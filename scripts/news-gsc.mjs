#!/usr/bin/env node
// Search Console for the desk: what Google shows and clicks in web, image and Discover results, the
// gate numbers of docs/DESK.md ("Volume and growth policy"), the stories worth improving, and what
// the title and snippet changes of the search desk did. Runs daily in
// .github/workflows/search-console.yml with a read-only service account (GSC_SERVICE_ACCOUNT_JSON,
// GSC_SITE, e.g. "sc-domain:freshcalendars.com"), and writes two files the desks read from main:
//   docs/desk/search-console.json   the data
//   docs/desk/search-console.md     the same in words, with the gate numbers
// Search Console data is 2 to 3 days late, so every window ends 3 days before today.
// Without the secrets, or when Google fails, it warns and exits 0 and leaves the last files as they are.
import { createSign } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_JSON = path.join(ROOT, "docs/desk/search-console.json");
const OUT_MD = path.join(ROOT, "docs/desk/search-console.md");
const OUT_PAGES = path.join(ROOT, "docs/desk/search-console-pages.json");
const EXPERIMENTS = path.join(ROOT, "docs/desk/search-experiments.json");
const DAY = 86_400_000;
const LAG_DAYS = 3;
const API = "https://www.googleapis.com/webmasters/v3/sites";
const INSPECT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const NEWS_RE = "^https?://[^/]+/news/";

// ── Pure helpers (tested in apps/news/test/gsc.test.ts) ────────────────────────────────────────

export const ymd = (t) => new Date(t).toISOString().slice(0, 10);
const round1 = (x) => Math.round(x * 10) / 10;

/** Three consecutive 7-day windows ending `LAG_DAYS` before `now`: latest first. */
export function windows(now = new Date()) {
  const end = Date.parse(ymd(now.getTime() - LAG_DAYS * DAY));
  return [0, 1, 2].map((i) => ({ start: ymd(end - (6 + 7 * i) * DAY), end: ymd(end - 7 * i * DAY) }));
}

/** Clicks and impressions per window from daily rows ({keys:[date], clicks, impressions}). */
export function weeklyTotals(rows, wins) {
  return wins.map((w) => {
    const inWin = rows.filter((r) => r.keys[0] >= w.start && r.keys[0] <= w.end);
    const clicks = inWin.reduce((s, r) => s + r.clicks, 0), impressions = inWin.reduce((s, r) => s + r.impressions, 0);
    return { ...w, clicks, impressions, days: inWin.length };
  });
}

/** True when the metric fell in both of the last two week-over-week steps ([latest, previous, older]). */
export const fellTwice = (weeks, key) => weeks.length === 3 && weeks[0][key] < weeks[1][key] && weeks[1][key] < weeks[2][key];

/** Pages and queries by section: the news section lives under /news/, the rest is the calendar site. */
export const section = (url) => (/^https?:\/\/[^/]+\/news\//.test(url) ? "news" : "calendar");

/** Expected click-through rate by average position (a rough curve; used only to rank opportunities). */
export const expectedCtr = (pos) => (pos <= 1.5 ? 0.28 : pos <= 2.5 ? 0.15 : pos <= 3.5 ? 0.10 : pos <= 5.5 ? 0.06 : pos <= 8.5 ? 0.035 : pos <= 12 ? 0.02 : 0.01);

/**
 * Query and page pairs worth a better title, lede or section: enough impressions, a position that
 * can still win clicks (2.5 to 20; a page at 3.4 earning 0.02% has a title or snippet problem), and
 * a click-through rate below what that position usually earns. Ranked by the clicks missing.
 */
export function opportunities(rows, { minImpressions = 80, limit = 40 } = {}) {
  return rows
    .filter((r) => r.impressions >= minImpressions && r.position >= 2.5 && r.position <= 20)
    .map((r) => ({ query: r.keys[0], page: r.keys[1], impressions: r.impressions, clicks: r.clicks, position: round1(r.position), missing: Math.round(r.impressions * Math.max(0, expectedCtr(r.position) - r.clicks / r.impressions)) }))
    .filter((o) => o.missing >= 3)
    .sort((a, b) => b.missing - a.missing)
    .slice(0, limit);
}

/**
 * /news/ pages with many impressions and almost no clicks, each with the queries behind them. The
 * opportunity list keeps only the 40 biggest single gaps, so a page whose impressions are spread over
 * many small queries (a long tail at position 9) never shows up there; this lists the page and its
 * top queries so the desk can see what the page is being shown for before it changes a title.
 */
export function weakPages(pages, pairs, { minImpressions = 800, maxCtr = 0.01, limit = 15, perPage = 6 } = {}) {
  const byPage = new Map();
  for (const r of pairs) {
    const list = byPage.get(r.keys[1]) ?? [];
    list.push({ query: r.keys[0], impressions: r.impressions, clicks: r.clicks, position: round1(r.position) });
    byPage.set(r.keys[1], list);
  }
  return pages
    .filter((p) => section(p.keys[0]) === "news" && p.impressions >= minImpressions && p.clicks / p.impressions <= maxCtr)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map((p) => ({
      page: p.keys[0], impressions: p.impressions, clicks: p.clicks, position: round1(p.position),
      queries: (byPage.get(p.keys[0]) ?? []).sort((a, b) => b.impressions - a.impressions).slice(0, perPage),
    }));
}

/**
 * Queries that show two or more of our pages (each with enough impressions): the pages compete with
 * each other, so one of them may be merged into the other, retitled for a different query or linked
 * to the stronger one. Dated series (a puzzle for every day) compete by nature: the desk judges.
 */
export function cannibalization(pairs, { minPage = 30, minTotal = 150, limit = 15 } = {}) {
  const byQuery = new Map();
  for (const r of pairs) {
    if (r.impressions < minPage) continue;
    const list = byQuery.get(r.keys[0]) ?? [];
    list.push({ page: r.keys[1], impressions: r.impressions, clicks: r.clicks, position: round1(r.position) });
    byQuery.set(r.keys[0], list);
  }
  return [...byQuery]
    .map(([query, pages]) => ({ query, pages: pages.sort((a, b) => b.impressions - a.impressions), total: pages.reduce((s, p) => s + p.impressions, 0) }))
    .filter((x) => x.pages.length >= 2 && x.total >= minTotal)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/**
 * Google reports a jump link ("/news/story/#heading") as its own page. For the desk it is the story
 * itself: strip the fragment from every URL key and add the rows together (impressions and clicks
 * summed, position weighted by impressions).
 */
export function canonicalRows(rows) {
  const merged = new Map();
  for (const r of rows) {
    const keys = r.keys.map((k) => (/^https?:\/\//.test(k) ? k.replace(/#.*$/, "") : k));
    const id = keys.join("\u0000"), m = merged.get(id);
    if (!m) { merged.set(id, { ...r, keys, _w: r.position * r.impressions }); continue; }
    m.clicks += r.clicks; m.impressions += r.impressions; m._w += r.position * r.impressions;
    m.position = m.impressions ? m._w / m.impressions : m.position;
  }
  return [...merged.values()].map(({ _w, ...r }) => r);
}

/**
 * Every /news/ story page with its own numbers, not only the top 60 that search-console.json keeps.
 * A story missing here had no impressions in the window; a page cut from the short lists did not.
 * The desk decides merges and removals from this table, so it carries web, image and Discover for
 * 28 days, the two 14-day halves and the page's top queries (from the query-page pairs, which the
 * API caps at 5,000 rows, so a page's long tail can be missing).
 */
export function pageTable({ web = [], image = [], discover = [], cur = [], prev = [], pairs = [] }, { queriesPerPage = 5 } = {}) {
  const slugOf = (url) => (section(url) === "news" ? (url.replace(/[?#].*$/, "").match(/\/news\/([^/]+)\/?$/) ?? [])[1] : undefined);
  const out = {};
  const row = (slug) => (out[slug] ??= { web: { clicks: 0, impressions: 0, position: null }, image: { clicks: 0, impressions: 0 }, discover: { clicks: 0, impressions: 0 }, web14: { clicks: 0, impressions: 0 }, webPrev14: { clicks: 0, impressions: 0 }, queries: [] });
  const add = (rows, key, withPosition = false) => {
    for (const r of rows) {
      const slug = slugOf(r.keys[0]);
      if (!slug) continue;
      const t = row(slug)[key];
      t.clicks += r.clicks; t.impressions += r.impressions;
      if (withPosition) t.position = round1(r.position);
    }
  };
  add(web, "web", true); add(image, "image"); add(discover, "discover"); add(cur, "web14"); add(prev, "webPrev14");
  for (const r of [...pairs].sort((a, b) => b.impressions - a.impressions)) {
    const slug = slugOf(r.keys[1]);
    if (!slug || !out[slug] || out[slug].queries.length >= queriesPerPage) continue;
    out[slug].queries.push({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: round1(r.position) });
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Pages that gained or lost the most clicks between two equal windows (`cur` and `prev` are page rows).
 * The section is young: when the earlier window holds fewer than `minPrevClicks` clicks (before the
 * section had traffic) every page would "gain", so nothing is reported.
 */
export function movers(cur, prev, { minClicks = 15, limit = 10, minPrevClicks = 200 } = {}) {
  if (prev.reduce((s, r) => s + r.clicks, 0) < minPrevClicks) return { decliners: [], risers: [], note: "the earlier 14 days hold too little data to compare" };
  const before = new Map(prev.map((r) => [r.keys[0], r]));
  const after = new Map(cur.map((r) => [r.keys[0], r]));
  const pages = [...new Set([...before.keys(), ...after.keys()])].map((page) => {
    const a = after.get(page), b = before.get(page);
    return { page, clicks: a?.clicks ?? 0, prevClicks: b?.clicks ?? 0, impressions: a?.impressions ?? 0, prevImpressions: b?.impressions ?? 0 };
  });
  const delta = (p) => p.clicks - p.prevClicks;
  return {
    decliners: pages.filter((p) => p.prevClicks >= minClicks && p.clicks <= p.prevClicks * 0.6).sort((a, b) => delta(a) - delta(b)).slice(0, limit),
    risers: pages.filter((p) => p.clicks >= minClicks && p.clicks >= p.prevClicks * 1.6).sort((a, b) => delta(b) - delta(a)).slice(0, limit),
  };
}

/** News pages that rank in web results but show no image result at all: hero alt text, filename or caption. */
export function imageGaps(webPages, imagePages, { minImpressions = 150, limit = 15 } = {}) {
  const hasImage = new Set(imagePages.map((r) => r.keys[0]));
  return webPages
    .filter((r) => section(r.keys[0]) === "news" && !r.keys[0].includes("/downloads/") && r.impressions >= minImpressions && !hasImage.has(r.keys[0]))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map((r) => ({ page: r.keys[0], impressions: r.impressions, clicks: r.clicks, position: round1(r.position) }));
}

/** Even sample of `n` items (keeps order, spreads over the list). */
export function sample(items, n) {
  if (items.length <= n) return items;
  return Array.from({ length: n }, (_, i) => items[Math.floor((i * items.length) / n)]);
}

const metrics = (rows) => {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0), impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const position = impressions ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / impressions : 0;
  return { clicks, impressions, ctr: impressions ? Math.round((clicks / impressions) * 10_000) / 100 : 0, position: round1(position) };
};

/**
 * What one change did to one page: the 14 days before the change against the 14 days after it, the
 * first day after left out (the change goes live during it). `rows` are the page's daily rows
 * ({keys:[date, page], clicks, impressions, position}); `after` stays null until 14 full days past
 * the change are in the data (the window ends 3 days before `now`).
 */
export function measureExperiment(rows, changedAt, now = new Date()) {
  const t = Date.parse(changedAt);
  const inRange = (from, to) => rows.filter((r) => r.keys[0] >= ymd(t + from * DAY) && r.keys[0] <= ymd(t + to * DAY));
  const lastDay = Date.parse(ymd(now.getTime() - LAG_DAYS * DAY));
  const ready = t + 14 * DAY <= lastDay;
  return { before: metrics(inRange(-14, -1)), after: ready ? metrics(inRange(1, 14)) : null, daysAfter: Math.max(0, Math.floor((lastDay - t) / DAY)) };
}

/** The gate of docs/DESK.md as far as the API can say it; manual actions and security issues stay with the owner. */
export function gate({ news, indexed }) {
  const out = [];
  const idx = indexed.checked ? indexed.indexed / indexed.checked : null;
  out.push({ rule: "At least 60% of /news/ URLs published 7 to 21 days ago are indexed", value: idx === null ? "no sample" : `${Math.round(idx * 100)}% (${indexed.indexed} of ${indexed.checked} sampled)`, pass: idx === null ? null : idx >= 0.6 });
  const fell = ["clicks", "impressions"].filter((k) => fellTwice(news, k));
  out.push({ rule: "/news/ clicks and impressions did not fall two weeks in a row", value: fell.length ? `fell two weeks in a row: ${fell.join(", ")}` : "no", pass: fell.length === 0 });
  out.push({ rule: "No manual action and no security issue", value: "not in the API: check Search Console > Security & Manual Actions", pass: null });
  return out;
}

// ── Google API ─────────────────────────────────────────────────────────────────────────────────

const b64 = (x) => Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString("base64url");

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: key.client_email, scope: SCOPE, aud: key.token_uri ?? "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");
  const res = await fetch(key.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) throw new Error(`token: ${res.status} ${body.error_description ?? body.error ?? ""}`);
  return body.access_token;
}

async function call(url, token, body) {
  const res = await fetch(url, { method: body ? "POST" : "GET", headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60_000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${url.split("?")[0].split("/").slice(-2).join("/")}: ${res.status} ${data.error?.message ?? ""}`);
  return data;
}

async function searchAnalytics(site, token, { start, end, dimensions, filter, searchType = "web", rowLimit = 1000 }) {
  const rows = [];
  for (let startRow = 0; ; startRow += rowLimit) {
    const body = { startDate: start, endDate: end, dimensions, rowLimit, startRow, dataState: "final", searchType };
    if (filter) body.dimensionFilterGroups = [{ filters: [filter] }];
    const data = await call(`${API}/${encodeURIComponent(site)}/searchAnalytics/query`, token, body);
    rows.push(...(data.rows ?? []));
    if ((data.rows ?? []).length < rowLimit || rows.length >= 10_000) return rows;
  }
}

/** Index status of one URL: "indexed", "not indexed" or "unknown", with Google's own state text. */
async function inspect(site, token, url) {
  try {
    const data = await call(INSPECT, token, { inspectionUrl: url, siteUrl: site });
    const r = data.inspectionResult?.indexStatusResult;
    if (!r) return { url, status: "unknown" };
    return { url, status: r.verdict === "PASS" ? "indexed" : "not indexed", state: r.coverageState };
  } catch (e) {
    return { url, status: "unknown", error: String(e.message).slice(0, 80) };
  }
}

/** Runs `fn` over `items` with `size` at a time. */
async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

/** Stories published 2 to 21 days ago, read from the article files (slug, age in days). */
function recentStories(now = new Date()) {
  const dir = path.join(ROOT, "apps/news/src/content/articles");
  const out = [];
  (function walk(d) {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith(".md")) {
        const text = readFileSync(p, "utf8");
        const t = Date.parse(/^publishedAt:\s*"?([^"\n]+)/m.exec(text)?.[1] ?? "");
        const age = (now.getTime() - t) / DAY;
        if (age >= 2 && age <= 21 && !/^draft:\s*true/m.test(text)) out.push({ slug: f.name.replace(/\.md$/, ""), t, age });
      }
    }
  })(dir);
  return out.sort((a, b) => a.t - b.t);
}

/** The experiments the search desk keeps in docs/desk/search-experiments.json: [{slug, changedAt, what}]. */
function readExperiments() {
  try {
    return (JSON.parse(readFileSync(EXPERIMENTS, "utf8")).experiments ?? []).filter((e) => /^[a-z0-9-]+$/.test(e.slug) && /^\d{4}-\d{2}-\d{2}$/.test(e.changedAt)).slice(0, 40);
  } catch {
    return [];
  }
}

// ── Report ─────────────────────────────────────────────────────────────────────────────────────

const n = (x) => Math.round(x).toLocaleString("en-US");
const slugOf = (url) => url.replace(/^https?:\/\/[^/]+/, "");

export function report(d) {
  const w = (arr) => (arr ?? []).map((x) => `${x.start}..${x.end}: ${n(x.clicks)} clicks, ${n(x.impressions)} impressions`).join(" | ");
  const pageLine = (p) => `- ${slugOf(p.page)}: ${n(p.clicks)} clicks, ${n(p.impressions)} impressions${p.position ? `, position ${p.position}` : ""}`;
  const lines = [
    "# Search Console (generated, do not edit)",
    "",
    `Read ${d.generatedAt.slice(0, 16)} UTC for ${d.site}. Windows end ${LAG_DAYS} days before the read (Search Console data is late). Source: \`scripts/news-gsc.mjs\`, daily. Web, image and Discover results are separate: each section says which.`,
    "",
    "## Gate for the phase decision (docs/DESK.md)",
    "",
    ...d.gate.map((g) => `- ${g.pass === true ? "PASS" : g.pass === false ? "FAIL" : "CHECK"}: ${g.rule} — ${g.value}`),
    "",
    "## Weekly totals (latest first)",
    "",
    `- /news/, web: ${w(d.weeks.news)}`,
    `- /news/, image: ${w(d.weeks.newsImage)}`,
    `- /news/, Discover: ${w(d.weeks.newsDiscover)}`,
    `- Calendar site, web: ${w(d.weeks.calendar)}`,
    `- Calendar site, image: ${w(d.weeks.calendarImage)}`,
    "",
    "## Web opportunities: ranking 2.5 to 20 with a click rate below what that position earns",
    "",
    "An update item for the update desk (title, first sentence or a section), or a new story for the research desk when no page answers the query. `missing` is the clicks per 28 days the page would gain at the usual rate. A query Google answers itself (a date, a time) can show a large `missing` that no title will win.",
    "",
    ...d.opportunities.map((o) => `- ${o.missing} missing: "${o.query}" → ${slugOf(o.page)} (position ${o.position}, ${n(o.impressions)} impressions, ${o.clicks} clicks)`),
    "",
    "## Pages shown a lot and clicked almost never (/news/, web, 28 days): what each is shown for",
    "",
    "Pages with 800 or more impressions and a click rate of 1% or less, with their top queries. Read this before you retitle one: the queries tell you which question the page is answering in the results, and whether the title names it. A date or time that Google answers itself will stay low.",
    "",
    ...(d.weakPages ?? []).flatMap((p) => [`- ${slugOf(p.page)}: ${n(p.impressions)} impressions, ${p.clicks} clicks, position ${p.position}`, ...p.queries.map((q) => `  - "${q.query}": ${n(q.impressions)} impressions, ${q.clicks} clicks, position ${q.position}`)]),
    "",
    "## Pages that lost or gained clicks (last 14 days against the 14 before; web)",
    "",
    ...(d.movers?.note ? [`Not compared: ${d.movers.note}.`, ""] : []),
    "Losing: " + (d.movers?.decliners?.length ? "" : "none"),
    ...(d.movers?.decliners ?? []).map((p) => `- ${slugOf(p.page)}: ${p.prevClicks} → ${p.clicks} clicks (${n(p.prevImpressions)} → ${n(p.impressions)} impressions)`),
    "",
    "Gaining: " + (d.movers?.risers?.length ? "" : "none"),
    ...(d.movers?.risers ?? []).map((p) => `- ${slugOf(p.page)}: ${p.prevClicks} → ${p.clicks} clicks (${n(p.prevImpressions)} → ${n(p.impressions)} impressions)`),
    "",
    "## Pages that compete with each other (one query, two or more of our pages; web, 28 days)",
    "",
    ...(d.cannibalization?.length ? d.cannibalization.map((c) => `- "${c.query}" (${n(c.total)} impressions): ${c.pages.map((p) => `${slugOf(p.page)} ${n(p.impressions)} at ${p.position}`).join("; ")}`) : ["- none"]),
    "",
    "## Image search (28 days)",
    "",
    ...(d.image?.pages?.length ? d.image.pages.slice(0, 15).map(pageLine) : ["- no image data"]),
    "",
    "Ranking in web results but absent from image results (hero alt text, caption, file name):",
    ...(d.image?.gaps?.length ? d.image.gaps.map((p) => `- ${slugOf(p.page)}: ${n(p.impressions)} web impressions, position ${p.position}`) : ["- none"]),
    "",
    "## Discover (28 days)",
    "",
    ...(d.discover?.pages?.length ? d.discover.pages.slice(0, 15).map(pageLine) : ["- no Discover data"]),
    "",
    "## Top /news/ pages, web, last 28 days",
    "",
    ...d.pages.news.slice(0, 25).map(pageLine),
    "",
    "## Top calendar-site pages, web, last 28 days",
    "",
    ...d.pages.calendar.slice(0, 15).map(pageLine),
    "",
    "## Indexing",
    "",
    `Sample of ${d.indexed.sampled ?? d.indexed.checked} stories published 2 to 21 days ago (the gate counts the ${d.indexed.checked} that are 7 to 21 days old): ${Object.entries(d.indexed.states ?? {}).map(([k, v]) => `${v} ${k}`).join(", ") || "none"}.`,
    "",
    ...(d.indexed.notIndexed.length ? d.indexed.notIndexed.map((u) => `- not indexed: ${slugOf(u.url)}${u.state ? ` (${u.state}), ${u.age} days old` : ""}`) : ["- every sampled story is indexed"]),
    "",
    "## Sitemaps",
    "",
    ...(d.sitemaps?.length ? d.sitemaps.map((s) => `- ${slugOf(s.path)}: ${s.errors} errors, ${s.warnings} warnings, ${n(s.submitted)} URLs submitted, last read ${String(s.lastDownloaded ?? "never").slice(0, 10)}`) : ["- none listed"]),
    "",
    "## Experiments (title and snippet changes of the search desk, 14 days before against 14 days after)",
    "",
    ...(d.experiments?.length ? d.experiments.map((e) => `- ${e.slug} (changed ${e.changedAt}): before ${e.before.clicks} clicks, ${n(e.before.impressions)} impressions, CTR ${e.before.ctr}%, position ${e.before.position}; ${e.after ? `after ${e.after.clicks} clicks, ${n(e.after.impressions)} impressions, CTR ${e.after.ctr}%, position ${e.after.position}` : `after: not yet (${e.daysAfter} of 15 days)`}`) : ["- none running"]),
    "",
  ];
  return lines.join("\n");
}

// ── Main ───────────────────────────────────────────────────────────────────────────────────────

async function main() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON, site = process.env.GSC_SITE;
  if (!raw || !site) return console.log("search console: GSC_SERVICE_ACCOUNT_JSON or GSC_SITE not set; files left as they are");
  try {
    const key = JSON.parse(raw);
    const token = await accessToken(key);
    const wins = windows();
    const from = wins[2].start, to = wins[0].end;
    const q28 = { start: ymd(Date.parse(to) - 27 * DAY), end: to };
    const cur14 = { start: ymd(Date.parse(to) - 13 * DAY), end: to }, prev14 = { start: ymd(Date.parse(to) - 27 * DAY), end: ymd(Date.parse(to) - 14 * DAY) };
    const inNews = { dimension: "page", operator: "includingRegex", expression: NEWS_RE };
    const notNews = { dimension: "page", operator: "excludingRegex", expression: NEWS_RE };
    const daily = (filter, searchType) => searchAnalytics(site, token, { start: from, end: to, dimensions: ["date"], filter, searchType });
    const experiments = readExperiments();
    const expFrom = experiments.length ? ymd(Math.min(...experiments.map((e) => Date.parse(e.changedAt))) - 14 * DAY) : null;
    // Both sections are read with a page filter, so they count the same way (a search that shows
    // two of our pages counts once per page); the unfiltered daily total counts it once.
    const [dailyCalendar, dailyNews, dailyNewsImage, dailyCalendarImage, dailyNewsDiscover, pagesRaw, pagesCurRaw, pagesPrevRaw, pairsRaw, imagePagesRaw, discoverPagesRaw, sitemaps, expRowsRaw] = await Promise.all([
      daily(notNews), daily(inNews), daily(inNews, "image"), daily(notNews, "image"), daily(inNews, "discover"),
      searchAnalytics(site, token, { ...q28, dimensions: ["page"] }),
      searchAnalytics(site, token, { ...cur14, dimensions: ["page"] }),
      searchAnalytics(site, token, { ...prev14, dimensions: ["page"] }),
      searchAnalytics(site, token, { ...q28, dimensions: ["query", "page"], rowLimit: 5000 }),
      searchAnalytics(site, token, { ...q28, dimensions: ["page"], searchType: "image" }),
      searchAnalytics(site, token, { ...q28, dimensions: ["page"], searchType: "discover" }),
      call(`${API}/${encodeURIComponent(site)}/sitemaps`, token).then((r) => r.sitemap ?? []).catch(() => []),
      experiments.length
        ? searchAnalytics(site, token, { start: expFrom, end: to, dimensions: ["date", "page"], rowLimit: 5000, filter: { dimension: "page", operator: "includingRegex", expression: `^https?://[^/]+/news/(${experiments.map((e) => e.slug).join("|")})/(#.*)?$` } })
        : Promise.resolve([]),
    ]);

    const shape = (r) => ({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: round1(r.position) });
    const pages = canonicalRows(pagesRaw), pagesCur = canonicalRows(pagesCurRaw), pagesPrev = canonicalRows(pagesPrevRaw), pairs = canonicalRows(pairsRaw), imagePages = canonicalRows(imagePagesRaw), discoverPages = canonicalRows(discoverPagesRaw), expRows = canonicalRows(expRowsRaw);
    const bySection = { news: [], calendar: [] };
    for (const r of [...pages].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)) bySection[section(r.keys[0])].push(shape(r));
    const byClicks = (rows) => [...rows].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).map(shape);

    // Indexing: up to 90 stories published 2 to 21 days ago, 5 requests at a time.
    const base = process.env.NEWS_SITE_ORIGIN ?? "https://freshcalendars.com";
    const stories = sample(recentStories(), 90);
    const checked = (await pool(stories, 5, async (s) => ({ ...(await inspect(site, token, `${base}/news/${s.slug}/`)), age: Math.round(s.age) }))).filter(Boolean);
    const known = checked.filter((c) => c.status !== "unknown");
    const gateSample = known.filter((c) => c.age >= 7);
    const states = {};
    for (const c of known) states[c.state ?? c.status] = (states[c.state ?? c.status] ?? 0) + 1;
    const indexed = { checked: gateSample.length, sampled: known.length, indexed: gateSample.filter((c) => c.status === "indexed").length, notIndexed: known.filter((c) => c.status === "not indexed").slice(0, 25), states, unknown: checked.length - known.length };

    const newsWeeks = weeklyTotals(dailyNews, wins);
    const data = {
      generatedAt: new Date().toISOString(), site, windows: wins,
      weeks: { news: newsWeeks, calendar: weeklyTotals(dailyCalendar, wins), newsImage: weeklyTotals(dailyNewsImage, wins), calendarImage: weeklyTotals(dailyCalendarImage, wins), newsDiscover: weeklyTotals(dailyNewsDiscover, wins) },
      gate: gate({ news: newsWeeks, indexed }),
      opportunities: opportunities(pairs),
      weakPages: weakPages(pages, pairs),
      movers: movers(pagesCur, pagesPrev),
      cannibalization: cannibalization(pairs),
      image: { pages: byClicks(imagePages).slice(0, 40), gaps: imageGaps(pages, imagePages) },
      discover: { pages: byClicks(discoverPages).slice(0, 25) },
      pages: { news: bySection.news.slice(0, 60), calendar: bySection.calendar.slice(0, 40) },
      indexed,
      sitemaps: sitemaps.map((s) => ({ path: s.path, errors: Number(s.errors ?? 0), warnings: Number(s.warnings ?? 0), lastDownloaded: s.lastDownloaded, submitted: Number((s.contents ?? []).find((c) => c.type === "web")?.submitted ?? 0) })),
      experiments: experiments.map((e) => ({ ...e, ...measureExperiment(expRows.filter((r) => r.keys[1].endsWith(`/news/${e.slug}/`)), e.changedAt) })),
    };
    writeFileSync(OUT_JSON, `${JSON.stringify(data, null, 1)}\n`);
    writeFileSync(OUT_MD, report(data));
    const pageRows = pageTable({ web: pages, image: imagePages, discover: discoverPages, cur: pagesCur, prev: pagesPrev, pairs });
    writeFileSync(OUT_PAGES, `${JSON.stringify({ generatedAt: data.generatedAt, window: q28, halves: { web14: cur14, webPrev14: prev14 }, note: "Every /news/ page with web, image or Discover impressions in the 28 days; a story not listed had none. Top queries come from the 5,000 largest query-page rows.", pages: pageRows }, null, 1)}\n`);
    console.log(`search console: ${bySection.news.length} /news/ pages, ${data.opportunities.length} opportunities, ${data.image.pages.length} image pages, ${data.discover.pages.length} Discover pages, ${indexed.indexed}/${indexed.checked} indexed in the gate sample (${indexed.unknown} unknown), ${data.experiments.length} experiments`);
  } catch (e) {
    console.log(`::warning::search console: ${e.message}; files left as they are`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
