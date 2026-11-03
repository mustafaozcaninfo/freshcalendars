#!/usr/bin/env node
// Search Console for the desk: what Google shows and clicks, the gate numbers of docs/DESK.md
// ("Volume and growth policy") and the stories worth improving. Runs daily in
// .github/workflows/search-console.yml with a read-only service account (GSC_SERVICE_ACCOUNT_JSON,
// GSC_SITE, e.g. "sc-domain:freshcalendars.com"), and writes two files the research and update
// desks read from main:
//   docs/desk/search-console.json   the data (small: top pages, query/page opportunities, weekly totals)
//   docs/desk/search-console.md     the same in words, with the gate numbers
// Search Console data is 2 to 3 days late, so every window ends 3 days before today.
// Without the secrets, or when Google fails, it warns and exits 0 and leaves the last files as they are.
import { createSign } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_JSON = path.join(ROOT, "docs/desk/search-console.json");
const OUT_MD = path.join(ROOT, "docs/desk/search-console.md");
const DAY = 86_400_000;
const LAG_DAYS = 3;
const API = "https://www.googleapis.com/webmasters/v3/sites";
const INSPECT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

// ── Pure helpers (tested in apps/news/test/gsc.test.ts) ────────────────────────────────────────

export const ymd = (t) => new Date(t).toISOString().slice(0, 10);

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
 * can still win clicks (4 to 20), and a click-through rate below what that position usually earns.
 * Ranked by the clicks missing.
 */
export function opportunities(rows, { minImpressions = 80, limit = 40 } = {}) {
  return rows
    .filter((r) => r.impressions >= minImpressions && r.position >= 4 && r.position <= 20)
    .map((r) => ({ query: r.keys[0], page: r.keys[1], impressions: r.impressions, clicks: r.clicks, position: Math.round(r.position * 10) / 10, missing: Math.round(r.impressions * Math.max(0, expectedCtr(r.position) - r.clicks / r.impressions)) }))
    .filter((o) => o.missing >= 3)
    .sort((a, b) => b.missing - a.missing)
    .slice(0, limit);
}

/** Even sample of `n` items (keeps order, spreads over the list). */
export function sample(items, n) {
  if (items.length <= n) return items;
  return Array.from({ length: n }, (_, i) => items[Math.floor((i * items.length) / n)]);
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

async function post(url, token, body) {
  const res = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${url.split("?")[0].split("/").slice(-2).join("/")}: ${res.status} ${data.error?.message ?? ""}`);
  return data;
}

async function searchAnalytics(site, token, { start, end, dimensions, filter, rowLimit = 1000 }) {
  const rows = [];
  for (let startRow = 0; ; startRow += rowLimit) {
    const body = { startDate: start, endDate: end, dimensions, rowLimit, startRow, dataState: "final" };
    if (filter) body.dimensionFilterGroups = [{ filters: [filter] }];
    const data = await post(`${API}/${encodeURIComponent(site)}/searchAnalytics/query`, token, body);
    rows.push(...(data.rows ?? []));
    if ((data.rows ?? []).length < rowLimit || rows.length >= 10_000) return rows;
  }
}

/** Index status of one URL: "indexed", "not indexed" or "unknown". */
async function inspect(site, token, url) {
  try {
    const data = await post(INSPECT, token, { inspectionUrl: url, siteUrl: site });
    const r = data.inspectionResult?.indexStatusResult;
    if (!r) return { url, status: "unknown" };
    return { url, status: r.verdict === "PASS" ? "indexed" : "not indexed", state: r.coverageState };
  } catch (e) {
    return { url, status: "unknown", error: String(e.message).slice(0, 80) };
  }
}

/** Stories published 7 to 21 days ago, read from the article files (slug, publishedAt). */
function recentStories(now = new Date()) {
  const dir = path.join(ROOT, "apps/news/src/content/articles");
  const out = [];
  (function walk(d) {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith(".md")) {
        const t = Date.parse(/^publishedAt:\s*"?([^"\n]+)/m.exec(readFileSync(p, "utf8"))?.[1] ?? "");
        const age = (now.getTime() - t) / DAY;
        if (age >= 7 && age <= 21 && !/^draft:\s*true/m.test(readFileSync(p, "utf8"))) out.push({ slug: f.name.replace(/\.md$/, ""), t });
      }
    }
  })(dir);
  return out.sort((a, b) => a.t - b.t);
}

// ── Report ─────────────────────────────────────────────────────────────────────────────────────

const n = (x) => Math.round(x).toLocaleString("en-US");
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const slugOf = (url) => url.replace(/^https?:\/\/[^/]+/, "");

export function report(d) {
  const w = (arr) => arr.map((x) => `${x.start}..${x.end}: ${n(x.clicks)} clicks, ${n(x.impressions)} impressions`).join(" | ");
  const lines = [
    "# Search Console (generated, do not edit)",
    "",
    `Read ${d.generatedAt.slice(0, 16)} UTC for ${d.site}. Windows end ${LAG_DAYS} days before the read (Search Console data is late). Source: \`scripts/news-gsc.mjs\`, daily.`,
    "",
    "## Gate for the phase decision (docs/DESK.md)",
    "",
    ...d.gate.map((g) => `- ${g.pass === true ? "PASS" : g.pass === false ? "FAIL" : "CHECK"}: ${g.rule} — ${g.value}`),
    "",
    "## Weekly totals (latest first)",
    "",
    `- /news/: ${w(d.weeks.news)}`,
    `- Calendar site: ${w(d.weeks.calendar)}`,
    "",
    "## Opportunities: ranking 4 to 20 with a click rate below what that position earns",
    "",
    "Improve the title, the first sentence or a section of the page (an update item for the update desk), or answer the query in a new story (a queue item for the research desk). `missing` is the clicks per 28 days the page would gain at the usual rate.",
    "",
    ...d.opportunities.map((o) => `- ${o.missing} missing: "${o.query}" → ${slugOf(o.page)} (position ${o.position}, ${n(o.impressions)} impressions, ${o.clicks} clicks)`),
    "",
    "## Top /news/ pages, last 28 days",
    "",
    ...d.pages.news.slice(0, 25).map((p) => `- ${slugOf(p.page)}: ${n(p.clicks)} clicks, ${n(p.impressions)} impressions, position ${p.position}`),
    "",
    "## Top calendar-site pages, last 28 days",
    "",
    ...d.pages.calendar.slice(0, 15).map((p) => `- ${slugOf(p.page)}: ${n(p.clicks)} clicks, ${n(p.impressions)} impressions, position ${p.position}`),
    "",
    "## Stories not indexed (sample of those published 7 to 21 days ago)",
    "",
    ...(d.indexed.notIndexed.length ? d.indexed.notIndexed.map((u) => `- ${slugOf(u.url)}${u.state ? ` (${u.state})` : ""}`) : ["- none in the sample"]),
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
    const [daily, dailyNews, pages, pairs] = await Promise.all([
      searchAnalytics(site, token, { start: from, end: to, dimensions: ["date"] }),
      searchAnalytics(site, token, { start: from, end: to, dimensions: ["date"], filter: { dimension: "page", operator: "includingRegex", expression: "^https?://[^/]+/news/" } }),
      searchAnalytics(site, token, { ...q28, dimensions: ["page"], rowLimit: 1000 }),
      searchAnalytics(site, token, { ...q28, dimensions: ["query", "page"], rowLimit: 5000 }),
    ]);
    const newsWeeks = weeklyTotals(dailyNews, wins), allWeeks = weeklyTotals(daily, wins);
    const calendarWeeks = allWeeks.map((a, i) => ({ start: a.start, end: a.end, clicks: Math.max(0, a.clicks - newsWeeks[i].clicks), impressions: Math.max(0, a.impressions - newsWeeks[i].impressions) }));
    const shape = (r) => ({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: Math.round(r.position * 10) / 10 });
    const bySection = { news: [], calendar: [] };
    for (const r of pages.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)) bySection[section(r.keys[0])].push(shape(r));

    const stories = sample(recentStories(), 30);
    const base = (process.env.NEWS_SITE_ORIGIN ?? "https://freshcalendars.com");
    const checked = [];
    for (const s of stories) { checked.push(await inspect(site, token, `${base}/news/${s.slug}/`)); await new Promise((r) => setTimeout(r, 250)); }
    const known = checked.filter((c) => c.status !== "unknown");
    const indexed = { checked: known.length, indexed: known.filter((c) => c.status === "indexed").length, notIndexed: known.filter((c) => c.status === "not indexed"), unknown: checked.length - known.length };

    const data = {
      generatedAt: new Date().toISOString(), site, windows: wins,
      weeks: { news: newsWeeks, calendar: calendarWeeks },
      gate: gate({ news: newsWeeks, indexed }),
      opportunities: opportunities(pairs),
      pages: { news: bySection.news.slice(0, 60), calendar: bySection.calendar.slice(0, 40) },
      indexed,
    };
    writeFileSync(OUT_JSON, `${JSON.stringify(data, null, 1)}\n`);
    writeFileSync(OUT_MD, report(data));
    console.log(`search console: ${bySection.news.length} /news/ pages, ${data.opportunities.length} opportunities, ${indexed.indexed}/${indexed.checked} sampled stories indexed (${indexed.unknown} unknown)`);
  } catch (e) {
    console.log(`::warning::search console: ${e.message}; files left as they are`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
