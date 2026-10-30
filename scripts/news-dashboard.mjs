#!/usr/bin/env node
/**
 * Read-only editorial dashboard for /news/: one local HTML page built from the repository itself
 * (story frontmatter, git history, KEY_DATES, the similarity and topic engines the build uses), the
 * last CI runs (gh) and, when dist/news exists, the SEO audit. Nothing here writes to stories or
 * keeps state of its own: status comes from `draft` and `publishedAt`, history from git.
 * The page lists drafts and scheduled stories, so it is written to dist/editorial/ (gitignored,
 * never deployed) and opened from disk, not hosted.
 *
 * Usage: pnpm news:dashboard [--no-audit] [--no-ci] [--check-links] [--open]
 *   --no-audit     skip the SEO audit of dist/news (it reads the last local build)
 *   --no-ci        skip GitHub Actions runs (gh)
 *   --check-links  request every source URL of live stories (slow; blocked sites are listed apart)
 *   --open         open the page when done (macOS)
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { NEAR_COPY, buildIndex, similarity, tokens } from "../apps/news/src/lib/similarity.ts";
import { topicMembers } from "../apps/news/src/lib/topics.ts";
import { KEY_DATES, daysUntil, todayET } from "../apps/news/src/lib/keydates.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTICLES = "apps/news/src/content/articles";
const OUT_DIR = path.join(ROOT, "dist/editorial");
const ORIGIN = "https://freshcalendars.com";
const args = new Set(process.argv.slice(2));
const now = new Date();
const today = todayET(now);
const DAY = 86_400_000;

const git = (...a) => { try { return execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 }); } catch { return ""; } };

// ── Stories ────────────────────────────────────────────────────────────────
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : /\.mdx?$/.test(e.name) ? [path.join(dir, e.name)] : []);
}

const parseErrors = [];
const stories = walk(path.join(ROOT, ARTICLES)).flatMap((file) => {
  const md = readFileSync(file, "utf8");
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const rel = path.relative(ROOT, file);
  let fm;
  try { fm = m ? YAML.parse(m[1]) : null; } catch (e) { parseErrors.push(`${rel}: ${e.message.split("\n")[0]}`); return []; }
  if (!fm?.title || !fm.publishedAt) { parseErrors.push(`${rel}: no title or publishedAt in frontmatter`); return []; }
  const publishedAt = new Date(fm.publishedAt);
  const updatedAt = fm.updatedAt ? new Date(fm.updatedAt) : null;
  const body = m[2];
  return [{
    slug: path.basename(file).replace(/\.mdx?$/, ""),
    file: rel,
    title: fm.title,
    description: fm.description ?? "",
    type: fm.type,
    category: fm.category,
    authors: fm.authors ?? [],
    keywords: fm.keywords ?? [],
    links: (fm.internalLinks ?? []).map((l) => l.href),
    related: fm.related ?? [],
    sources: fm.sources ?? [],
    draft: !!fm.draft,
    noindex: !!fm.noindex,
    corrections: (fm.corrections ?? []).length,
    downloads: (fm.downloads ?? []).length,
    publishedAt,
    updatedAt,
    words: body.replace(/<[^>]+>|[#*_>`|-]/g, " ").split(/\s+/).filter(Boolean).length,
  }];
});
const bySlug = new Map(stories.map((s) => [s.slug, s]));

/** The same visibility rules as lib/articles.ts: drafts never render, a future publishedAt waits. */
const statusOf = (s) => (s.draft ? "DRAFT" : s.publishedAt > now ? "SCHEDULED" : s.noindex ? "LIVE_NOINDEX" : "LIVE");
for (const s of stories) s.status = statusOf(s);
const isLive = (s) => s.status === "LIVE" || s.status === "LIVE_NOINDEX";

// ── Git: last and first commit per story, local work not yet on main ───────
{
  const log = git("log", "--format=\x01%H\x02%aI\x02%an\x02%s", "--name-only", "--", ARTICLES);
  for (const chunk of log.split("\x01").slice(1)) {
    const [head, ...files] = chunk.split("\n");
    const [sha, date, author, subject] = head.split("\x02");
    for (const f of files.filter(Boolean)) {
      const s = stories.find((x) => x.file === f);
      if (!s) continue;
      const c = { sha: sha.slice(0, 7), date, author, subject };
      s.lastCommit ??= c;
      s.firstCommit = c; // log is newest first, so the last one seen is the oldest
      s.commits = (s.commits ?? 0) + 1;
    }
  }
  const dirty = new Set(git("status", "--porcelain", "--", ARTICLES).split("\n").filter(Boolean).map((l) => l.slice(3).trim()));
  const unpushed = new Set(git("diff", "--name-only", "origin/main...HEAD", "--", ARTICLES).split("\n").filter(Boolean));
  for (const s of stories) {
    if (dirty.has(s.file) || [...dirty].some((d) => d.endsWith("/") && s.file.startsWith(d))) s.local = "uncommitted";
    else if (unpushed.has(s.file)) s.local = "not pushed";
  }
}

// ── Topics and similarity (the build's own engines) ────────────────────────
const visible = stories.filter((s) => !s.draft).sort((a, b) => b.publishedAt - a.publishedAt);
const ix = buildIndex(visible.map((s) => ({
  id: s.slug, title: s.title, description: s.description, keywords: s.keywords,
  category: s.category, links: s.links, publishedAt: s.publishedAt,
})));
const sim = (a, b) => similarity(ix, a, b);
const hubs = topicMembers(visible.filter((s) => isLive(s) && !s.noindex).map((s) => ({ id: s.slug, title: s.title, keywords: s.keywords })), sim);
for (const { topic, items } of hubs) for (const it of items) (bySlug.get(it.id).topics ??= []).push(topic.name);

// ── Duplicates (advisory) ──────────────────────────────────────────────────
/** Daily puzzle pages share a template by design; comparing them would bury the real pairs. */
const SKIP_DUP_CATEGORIES = new Set(["puzzles"]);
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); const i = [...A].filter((x) => B.has(x)).length; return i / (A.size + B.size - i || 1); };
/** "NFL Week 9" / "Week 10", "Season 4", "#767": a numbered installment of a running series. */
const installment = (t) => [...t.matchAll(/\b(week|round|game|season|episode|part|#)\s*(\d+)/gi)].map((m) => `${m[1].toLowerCase()} ${m[2]}`).join("|");
const monthDays = (t) => new Set([...t.matchAll(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})\b/g)].map((m) => `${m[1]} ${m[2]}`));
const headOf = (t) => tokens(t.split(/[:?]/)[0]).filter((w) => !/^\d+$/.test(w));
/**
 * Pages built from one template on purpose (NFL Week 9 and Week 10, Broward and Palm Beach
 * school calendars, NBA games for Oct. 29 and Oct. 30) score high on similarity but answer
 * different queries. They are kept apart from the pairs that may really compete.
 */
function seriesKind(a, b) {
  const ia = installment(a.title), ib = installment(b.title);
  if (ia && ib && ia !== ib) return "numbered series";
  const ha = headOf(a.title), hb = headOf(b.title);
  const ua = ha.filter((w) => !hb.includes(w)), ub = hb.filter((w) => !ha.includes(w));
  if (ua.length && ub.length) return "same format, different subject";
  const da = monthDays(a.title), db = monthDays(b.title);
  if (!ua.length && !ub.length && da.size && db.size && ![...da].some((d) => db.has(d))) return "daily series";
  return null;
}
const duplicates = [];
{
  const pool = visible.filter((s) => !SKIP_DUP_CATEGORIES.has(s.category));
  for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) {
    const a = pool[i], b = pool[j];
    const score = sim(a.slug, b.slug);
    const head = jaccard(tokens(a.title), tokens(b.title));
    if (score < NEAR_COPY && head < 0.7) continue;
    const kwA = new Set(a.keywords.map((k) => k.toLowerCase()));
    const sharedKw = b.keywords.filter((k) => kwA.has(k.toLowerCase()));
    const sharedTopics = (a.topics ?? []).filter((t) => (b.topics ?? []).includes(t));
    const gap = Math.abs(a.publishedAt - b.publishedAt) / DAY;
    const [newer, older] = a.publishedAt > b.publishedAt ? [a, b] : [b, a];
    const series = seriesKind(a, b);
    const recommendation =
      series ? "Keep both: one template, different subject"
      : score >= 0.8 ? `Merge, or update ${older.slug} instead of keeping two pages`
      : sharedKw.length ? `Keyword cannibalization: both target "${sharedKw[0]}"; give each its own query or merge`
      : head >= 0.7 ? "Near-identical headlines: rewrite one so the angle shows in the title"
      : gap <= 30 ? "Same subject within a month: check that the newer story adds original information"
      : "Review manually; keep both if the angles differ";
    duplicates.push({ a: newer.slug, b: older.slug, score: +score.toFixed(3), headline: +head.toFixed(2), sharedKw, sharedTopics, gapDays: Math.round(gap), series, recommendation });
  }
  duplicates.sort((x, y) => y.score - x.score);
}

// ── Freshness: explainable rules, one reason each ──────────────────────────
/** Years named in a title; a 2025-only title in 2026 is a page searchers no longer want. */
const year = +today.slice(0, 4);
const keyDatesBy = new Map();
for (const k of KEY_DATES) (keyDatesBy.get(k.slug) ?? keyDatesBy.set(k.slug, []).get(k.slug)).push(k);
const iso = (d) => d.toISOString().slice(0, 10);

function freshness(s) {
  if (!isLive(s) || s.category === "puzzles") return null;
  const touched = s.updatedAt ?? s.publishedAt;
  const age = Math.floor((now - touched) / DAY);
  const next = (keyDatesBy.get(s.slug) ?? []).filter((k) => k.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const titleYears = (s.title.match(/\b20\d\d\b/g) ?? []).map(Number);
  const base = { age, touched: iso(touched), lastSourceDate: s.sources.map((x) => x.date).filter(Boolean).sort().at(-1) ?? null };
  if (next) {
    const d = daysUntil(next.date, today);
    if (d <= 3 && age > 7) return { ...base, state: "URGENT_UPDATE", review: today, reason: `Key date ${d === 0 ? "today" : `in ${d} day(s)`} (${next.date}: ${next.label}); story last changed ${age} days ago. Confirm times and details with the source.` };
    if (d <= 14 && age > 30) return { ...base, state: "REVIEW_RECOMMENDED", review: iso(new Date(Date.parse(next.date) - 3 * DAY)), reason: `Key date ${next.date} (${next.label}); story last changed ${age} days ago.` };
  }
  if (titleYears.length && Math.max(...titleYears) < year) return { ...base, state: "OUTDATED", review: today, reason: `Title names only ${[...new Set(titleYears)].join(", ")}. Write or point to the ${year} story.` };
  const limit = s.type === "news" || s.type === "update" ? 180 : 365;
  if (age > limit) return { ...base, state: "REVIEW_RECOMMENDED", review: iso(new Date(touched.getTime() + limit * DAY)), reason: `${s.type} story unchanged for ${age} days (review every ${limit}).` };
  return { ...base, state: "CURRENT", review: iso(new Date(touched.getTime() + limit * DAY)), reason: next ? `Next key date ${next.date}.` : `Review by age (${limit} days).` };
}
for (const s of stories) s.fresh = freshness(s);

// ── Sources ────────────────────────────────────────────────────────────────
/** Source hosts the content rules do not accept as evidence. */
const WEAK_SOURCES = /(^|\.)(wikipedia\.org|reddit\.com|quora\.com|facebook\.com|x\.com|twitter\.com|tiktok\.com)$/;
const sourceIssues = [];
for (const s of stories) {
  const seen = new Set();
  if ((s.type === "news" || s.type === "update") && !s.sources.length) sourceIssues.push({ slug: s.slug, kind: "missing", text: `${s.type} story with no sources` });
  for (const src of s.sources) {
    let host = "";
    try { host = new URL(src.url).hostname.replace(/^www\./, ""); } catch { sourceIssues.push({ slug: s.slug, kind: "bad url", text: src.url }); continue; }
    if (seen.has(src.url)) sourceIssues.push({ slug: s.slug, kind: "duplicate", text: src.url });
    seen.add(src.url);
    if (src.url.startsWith("http:")) sourceIssues.push({ slug: s.slug, kind: "http", text: src.url });
    if (WEAK_SOURCES.test(host)) sourceIssues.push({ slug: s.slug, kind: "weak source", text: `${host}: ${src.title}` });
  }
}
if (args.has("--check-links")) {
  const queue = stories.filter(isLive).flatMap((s) => s.sources.map((src) => ({ slug: s.slug, url: src.url })));
  const checked = new Map();
  const probe = async (url) => {
    if (checked.has(url)) return checked.get(url);
    const p = (async () => {
      for (const method of ["HEAD", "GET"]) {
        try {
          const r = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(12_000), headers: { "user-agent": "FreshCalendars-editorial-check/1.0 (+https://freshcalendars.com/news/)" } });
          if (r.ok || method === "GET") return r.status;
        } catch (e) { if (method === "GET") return e.name === "TimeoutError" ? "timeout" : "error"; }
      }
    })();
    checked.set(url, p);
    return p;
  };
  process.stdout.write(`checking ${queue.length} source links…\n`);
  for (let i = 0; i < queue.length; i += 8) {
    await Promise.all(queue.slice(i, i + 8).map(async (q) => {
      const st = await probe(q.url);
      if (st === 404 || st === 410) sourceIssues.push({ slug: q.slug, kind: "broken", text: `${st} ${q.url}` });
      else if (typeof st !== "number" || st >= 400) sourceIssues.push({ slug: q.slug, kind: "unreachable", text: `${st} ${q.url} (may only block automated requests)` });
    }));
  }
}

// ── Cross-references ───────────────────────────────────────────────────────
const integrity = [];
{
  const names = new Map();
  for (const s of stories) (names.get(s.slug) ?? names.set(s.slug, []).get(s.slug)).push(s.file);
  for (const [slug, files] of names) if (files.length > 1) integrity.push({ slug, text: `slug used by ${files.length} files (one URL): ${files.join(", ")}` });
  for (const s of stories) for (const r of s.related) if (!bySlug.has(r)) integrity.push({ slug: s.slug, text: `related: "${r}" does not exist` });
  for (const k of KEY_DATES) {
    const s = bySlug.get(k.slug);
    if (!s) integrity.push({ slug: k.slug, text: `KEY_DATES "${k.label}" points at a missing story` });
    else if (!isLive(s)) integrity.push({ slug: k.slug, text: `KEY_DATES "${k.label}" points at a ${s.status.toLowerCase()} story` });
  }
}

// ── CI and publishing ──────────────────────────────────────────────────────
let ci = { runs: [], error: null };
if (!args.has("--no-ci")) {
  // Compare against the real main, not a clone that has not pulled for a while.
  git("fetch", "--quiet", "origin", "main");
  const r = spawnSync("gh", ["run", "list", "--branch", "main", "--limit", "30", "--json", "databaseId,displayTitle,headSha,status,conclusion,createdAt,updatedAt,url,event"], { cwd: ROOT, encoding: "utf8" });
  if (r.status === 0) ci.runs = JSON.parse(r.stdout).map((x) => ({ ...x, seconds: x.status === "completed" ? Math.round((Date.parse(x.updatedAt) - Date.parse(x.createdAt)) / 1000) : null }));
  else ci.error = (r.stderr || r.error?.message || "gh failed").trim().split("\n")[0];
}
const lastGreen = ci.runs.find((r) => r.conclusion === "success");
const headSha = git("rev-parse", "origin/main").trim();
const pending = lastGreen ? git("log", "--format=%h %s", `${lastGreen.headSha}..${headSha}`).split("\n").filter(Boolean) : [];

// ── SEO audit (reads the last local build) ─────────────────────────────────
let seo = null;
const distNews = path.join(ROOT, "dist/news");
if (!args.has("--no-audit") && existsSync(path.join(distNews, "index.html"))) {
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/news-seo-audit.mjs")], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
  const checks = [];
  for (const line of r.stdout.split("\n")) {
    const m = line.match(/^(PASS|FAIL|WARN)\s+(\S+)\s+(.*)$/);
    if (m) checks.push({ result: m[1], id: m[2], label: m[3], details: [] });
    else if (/^\s+· /.test(line) && checks.length) checks.at(-1).details.push(line.trim().slice(2));
  }
  seo = { builtAt: statSync(path.join(distNews, "index.html")).mtime.toISOString(), checks, summary: r.stdout.trim().split("\n").at(-1) };
  for (const c of checks.filter((c) => c.result !== "PASS")) for (const d of c.details) {
    const slug = d.match(/^\/news\/([^/]+)\//)?.[1];
    if (slug && bySlug.has(slug)) (bySlug.get(slug).seo ??= []).push(`${c.result} ${c.id}: ${d.replace(/^\S+:\s*/, "")}`);
  }
}

// ── Page ───────────────────────────────────────────────────────────────────
const recent = (days, key) => stories.filter((s) => isLive(s) && s[key] && now - s[key] <= days * DAY).length;
const counts = {
  total: stories.length,
  live: stories.filter(isLive).length,
  noindex: stories.filter((s) => s.status === "LIVE_NOINDEX").length,
  scheduled: stories.filter((s) => s.status === "SCHEDULED").length,
  drafts: stories.filter((s) => s.status === "DRAFT").length,
  local: stories.filter((s) => s.local).length,
  pub7: recent(7, "publishedAt"), pub30: recent(30, "publishedAt"),
  upd7: recent(7, "updatedAt"), upd30: recent(30, "updatedAt"),
  urgent: stories.filter((s) => s.fresh?.state === "URGENT_UPDATE").length,
  review: stories.filter((s) => s.fresh?.state === "REVIEW_RECOMMENDED").length,
  outdated: stories.filter((s) => s.fresh?.state === "OUTDATED").length,
  seoIssues: stories.filter((s) => s.seo?.length).length,
  duplicates: duplicates.filter((d) => !d.series).length,
  sourceIssues: sourceIssues.length,
};
const data = {
  generatedAt: now.toISOString(), today, origin: ORIGIN, counts, parseErrors, integrity, duplicates, sourceIssues,
  keyDates: KEY_DATES, hubs: hubs.map((h) => ({ name: h.topic.name, slug: h.topic.slug, n: h.items.length })),
  ci: { ...ci, lastGreen: lastGreen ? { sha: lastGreen.headSha.slice(0, 7), at: lastGreen.updatedAt } : null, head: headSha.slice(0, 7), pending },
  seo,
  stories: stories.map(({ description, links, related, ...s }) => ({ ...s, sources: s.sources.length, sourceList: s.sources })),
};

mkdirSync(OUT_DIR, { recursive: true });
const out = path.join(OUT_DIR, "index.html");
const template = readFileSync(path.join(ROOT, "scripts/lib/editorial-dashboard.html"), "utf8");
writeFileSync(out, template.replace("/*__DATA__*/null", JSON.stringify(data).replace(/</g, "\\u003c")));

console.log(`editorial dashboard: ${path.relative(process.cwd(), out)}`);
console.log(`  ${counts.live} live (${counts.noindex} noindex) · ${counts.scheduled} scheduled · ${counts.drafts} drafts · ${counts.local} local changes`);
console.log(`  freshness: ${counts.urgent} urgent · ${counts.outdated} outdated · ${counts.review} to review`);
console.log(`  ${counts.duplicates} possible duplicate pair(s) (+${duplicates.length - counts.duplicates} series pages) · ${counts.sourceIssues} source issue(s) · ${integrity.length} broken reference(s)`);
console.log(seo ? `  SEO audit (build of ${seo.builtAt.slice(0, 16)}): ${seo.summary}` : `  SEO audit: skipped (${args.has("--no-audit") ? "--no-audit" : "no dist/news; run pnpm news:build first"})`);
console.log(ci.error ? `  CI: unavailable (${ci.error})` : `  CI: last green ${data.ci.lastGreen?.sha ?? "none"} · ${pending.length} commit(s) on main after it`);
if (parseErrors.length) console.log(`  ${parseErrors.length} story file(s) could not be read:\n    ${parseErrors.join("\n    ")}`);
if (args.has("--open")) spawnSync("open", [out]);
