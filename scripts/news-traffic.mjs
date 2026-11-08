#!/usr/bin/env node
// Daily traffic report from Cloudflare's zone analytics: every page view the edge served, so ad
// blockers, late-loading gtag.js and readers who leave in a second do not hide it (Google Analytics
// misses all three). Per day for the last 7 days: /news/ story views, calendar-site page views,
// printable PDF downloads; for the week: top stories, where readers came from (Google, Bing,
// DuckDuckGo, direct...), countries and devices. Writes docs/desk/traffic.{json,md}; the Search
// Console workflow runs it daily with the same token as scripts/news-trending.mjs.
//   node scripts/news-traffic.mjs [--days 7] [--stdout]
// Optional: without CF_ANALYTICS_TOKEN / CF_ZONE_ID it warns and exits 0. A section Cloudflare
// refuses is reported as unavailable; the rest of the report is still written.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const HOST = "freshcalendars.com";
const BOTS = `AND: [{ userAgent_notlike: "%bot%" }, { userAgent_notlike: "%spider%" }, { userAgent_notlike: "%crawl%" }, { userAgent_notlike: "%Bot%" }]`;

/** Page-view filters: successful GETs from real clients on the main host. */
const KINDS = {
  news: `clientRequestPath_like: "/news/%/"`,
  calendar: `clientRequestPath_notlike: "/news/%", clientRequestPath_like: "%.html"`,
  pdf: `clientRequestPath_like: "/news/downloads/%.pdf"`,
};
const filter = (kind, extra = "") => `{
  datetime_geq: $since, datetime_lt: $until, requestSource: "eyeball", clientRequestHTTPHost: "${HOST}",
  clientRequestHTTPMethodName: "GET", edgeResponseStatus_geq: 200, edgeResponseStatus_lt: 300,
  ${KINDS[kind]}, ${extra} ${BOTS}
}`;
const query = (kind, dim, top) => `query($zone: String!, $since: Time!, $until: Time!) {
  viewer { zones(filter: { zoneTag: $zone }) {
    httpRequestsAdaptiveGroups(limit: ${top}, orderBy: [count_DESC], filter: ${filter(kind)}) { count ${dim ? `dimensions { ${dim} }` : ""} }
  } }
}`;

const iso = (d) => d.toISOString().replace(/\.\d+Z$/, "Z");

/** Runs one query per day (the dataset's widest window on this plan) and sums rows by dimension. */
export async function perDay({ post, kind, dim, top = 200, days, now }) {
  const daily = [], totals = new Map();
  for (let d = 0; d < days; d++) {
    const until = new Date(now.getTime() - d * 86_400_000), since = new Date(until.getTime() - 86_400_000);
    const rows = await post(query(kind, dim, top), { since: iso(since), until: iso(until) });
    let sum = 0;
    for (const r of rows) {
      sum += r.count;
      const key = dim ? r.dimensions?.[dim] || "(none)" : "all";
      totals.set(key, (totals.get(key) ?? 0) + r.count);
    }
    daily.push({ day: iso(since).slice(0, 10), count: sum });
  }
  return { daily: daily.reverse(), rows: [...totals].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count) };
}

/** Groups referrer hosts into the sources the desk cares about. */
export function sourceOf(host) {
  const h = (host || "").toLowerCase();
  if (!h || h === "(none)") return "Direct or app (no referrer)";
  if (h === HOST || h.endsWith(`.${HOST}`)) return "Inside the site";
  if (/(^|\.)google\./.test(h) || h === "news.google.com") return h === "news.google.com" ? "Google News" : "Google";
  if (/(^|\.)bing\.com$/.test(h)) return "Bing";
  if (/duckduckgo\.com$/.test(h)) return "DuckDuckGo";
  if (/(^|\.)yahoo\./.test(h)) return "Yahoo";
  if (/(^|\.)yandex\./.test(h)) return "Yandex";
  if (/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/.test(h)) return "AI assistants";
  if (/(facebook|instagram|t\.co|twitter|x\.com|reddit|pinterest|linkedin|threads|tiktok|youtube)/.test(h)) return "Social";
  return "Other sites";
}

/** Rows from `from` days ago up to `to` days ago (0 = now). */
const AE_WHERE = (from, to = 0) => `timestamp > NOW() - INTERVAL '${from}' DAY` + (to ? ` AND timestamp <= NOW() - INTERVAL '${to}' DAY` : "");
const AE_RATE = "SUM(_sample_interval)";
const AE_AVG = (col) => `SUM(_sample_interval * ${col}) / SUM(_sample_interval)`;
const PAGE_COLS = `blob1 AS k, ${AE_RATE} AS n, ${AE_AVG("double1")} AS sec, ${AE_AVG("double2")} AS scroll`;
/**
 * SQL for the beacon dataset (fc_pageviews, cloudflare/worker.js pageView). `n` is the report
 * window in days; the *Prev queries read the window before it, for week-over-week numbers.
 */
export const BEACON_SQL = {
  daily: (n) => `SELECT toStartOfDay(timestamp) AS k, ${AE_RATE} AS n, ${AE_AVG("double1")} AS sec, ${AE_AVG("double2")} AS scroll FROM fc_pageviews WHERE ${AE_WHERE(2 * n)} GROUP BY k ORDER BY k`,
  sources: (n) => `SELECT blob2 AS k, ${AE_RATE} AS n FROM fc_pageviews WHERE ${AE_WHERE(n)} GROUP BY k ORDER BY n DESC LIMIT 300`,
  sourcesPrev: (n) => `SELECT blob2 AS k, ${AE_RATE} AS n FROM fc_pageviews WHERE ${AE_WHERE(2 * n, n)} GROUP BY k ORDER BY n DESC LIMIT 300`,
  pages: (n) => `SELECT ${PAGE_COLS} FROM fc_pageviews WHERE ${AE_WHERE(n)} GROUP BY k ORDER BY n DESC LIMIT 1000`,
  pagesPrev: (n) => `SELECT ${PAGE_COLS} FROM fc_pageviews WHERE ${AE_WHERE(2 * n, n)} GROUP BY k ORDER BY n DESC LIMIT 1000`,
  devices: (n) => `SELECT blob4 AS k, ${AE_RATE} AS n, ${AE_AVG("double1")} AS sec, ${AE_AVG("double2")} AS scroll FROM fc_pageviews WHERE ${AE_WHERE(n)} GROUP BY k ORDER BY n DESC`,
  countries: (n) => `SELECT blob3 AS k, ${AE_RATE} AS n FROM fc_pageviews WHERE ${AE_WHERE(n)} GROUP BY k ORDER BY n DESC LIMIT 15`,
  // Interaction to Next Paint (INP), from views where the reader tapped, clicked or typed (double3 > 0).
  inpDevices: (n) => `SELECT blob4 AS k, ${AE_RATE} AS n, SUM(if(double3 > 200, _sample_interval, 0)) AS slow, ${AE_AVG("double3")} AS inp FROM fc_pageviews WHERE ${AE_WHERE(n)} AND double3 > 0 GROUP BY k ORDER BY n DESC`,
  inpPages: (n) => `SELECT blob1 AS k, ${AE_RATE} AS n, SUM(if(double3 > 200, _sample_interval, 0)) AS slow, ${AE_AVG("double3")} AS inp FROM fc_pageviews WHERE ${AE_WHERE(n)} AND double3 > 0 GROUP BY k ORDER BY slow DESC LIMIT 25`,
  inpCauses: (n) => `SELECT blob5 AS k, blob6 AS script, ${AE_RATE} AS n, ${AE_AVG("double3")} AS inp, ${AE_AVG("double4")} AS delay FROM fc_pageviews WHERE ${AE_WHERE(n)} AND double3 > 200 GROUP BY k, script ORDER BY n DESC LIMIT 20`,
};

/** One page's views, seconds and scroll between two UTC days (YYYY-MM-DD, end excluded). */
export const windowSql = (pagePath, from, to) =>
  `SELECT ${AE_RATE} AS n, ${AE_AVG("double1")} AS sec, ${AE_AVG("double2")} AS scroll FROM fc_pageviews WHERE blob1 = '${pagePath.replace(/[^\w\-./]/g, "")}' AND timestamp >= toDateTime('${from} 00:00:00') AND timestamp < toDateTime('${to} 00:00:00')`;

const addDays = (day, d) => new Date(Date.parse(`${day}T00:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);

/**
 * Reader experiments (search desk "UX brief" items, `"kind": "ux"` in
 * docs/desk/search-experiments.json): the 7 days before the change against the 7 days after it,
 * the change day left out, once 8 days have passed.
 */
export function uxWindows(exp, today) {
  const before = [addDays(exp.changedAt, -7), exp.changedAt];
  const after = [addDays(exp.changedAt, 1), addDays(exp.changedAt, 8)];
  return after[1] <= today ? { before, after } : null;
}

/** win, loss, flat or small, from the before and after windows of a reader experiment. */
export function judgeUx(b, a) {
  if (!b || !a || b.n < 50 || a.n < 50) return "too small to judge";
  const sec = (a.sec - b.sec) / (b.sec || 1), scroll = a.scroll - b.scroll;
  if (sec >= 0.2 || scroll >= 10) return sec <= -0.2 || scroll <= -10 ? "flat" : "win";
  if (sec <= -0.2 || scroll <= -10) return "loss";
  return "flat";
}

/** The beacon part of the report: real readers whose browser ran the page. */
export function beaconReport(b, days) {
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const out = ["## Real readers (first-party beacon)", "",
    `Page views sent by the reader's own browser to /api/pv when they leave the page (cloudflare/worker.js). Ad blockers do not stop it and bots that run no JavaScript never send it, so this is the number to report. Last ${days} days.`, ""];
  if (b.daily) {
    const shown = b.daily.slice(-days);
    out.push("| Day | Views | Avg. seconds on page | Avg. deepest scroll |", "|---|---:|---:|---:|", ...shown.map((r) => `| ${String(r.k).slice(0, 10)} | ${fmt(r.n)} | ${fmt(r.sec)} | ${fmt(r.scroll)}% |`));
    out.push(`| **Total** | **${fmt(shown.reduce((s, r) => s + r.n, 0))}** | | |`, "");
  }
  if (b.sources) {
    const by = new Map();
    for (const r of b.sources) by.set(sourceOf(r.k), (by.get(sourceOf(r.k)) ?? 0) + r.n);
    const all = [...by.values()].reduce((a, c) => a + c, 0) || 1;
    out.push("### Where readers came from", "", "| Source | Views | Share |", "|---|---:|---:|",
      ...[...by].sort((a, c) => c[1] - a[1]).map(([k, n]) => `| ${k} | ${fmt(n)} | ${((100 * n) / all).toFixed(1)}% |`), "");
    const other = b.sources.filter((r) => sourceOf(r.k) === "Other sites").slice(0, 10);
    if (other.length) out.push("Other sites, top 10: " + other.map((r) => `${r.k} (${fmt(r.n)})`).join(", "), "");
  }
  if (b.pages) out.push("### Top pages", "", "| Page | Views | Avg. seconds | Avg. deepest scroll |", "|---|---:|---:|---:|",
    ...b.pages.slice(0, 40).map((r) => `| ${r.k} | ${fmt(r.n)} | ${fmt(r.sec)} | ${fmt(r.scroll)}% |`), "");
  if (b.devices) out.push("Devices: " + b.devices.map((r) => `${r.k || "(unknown)"} ${fmt(r.n)} (${fmt(r.sec)} s, ${fmt(r.scroll)}% scroll)`).join(" · "), "");
  if (b.inpDevices?.length) {
    out.push("### Interaction to Next Paint (INP): how fast the page answers a tap", "", "Views where the reader tapped, clicked or typed. Google counts a page as good when its slow interactions stay rare; slow means over 200 ms.", "",
      "| Device | Views with a tap | Over 200 ms | Avg. slowest interaction |", "|---|---:|---:|---:|",
      ...b.inpDevices.map((r) => `| ${r.k || "(unknown)"} | ${fmt(r.n)} | ${r.n ? ((100 * r.slow) / r.n).toFixed(1) : 0}% | ${fmt(r.inp)} ms |`), "");
    const pages = (b.inpPages ?? []).filter((r) => r.slow > 0);
    if (pages.length) out.push("Pages with the most slow taps:", "", "| Page | Views with a tap | Over 200 ms | Avg. |", "|---|---:|---:|---:|", ...pages.slice(0, 15).map((r) => `| ${r.k} | ${fmt(r.n)} | ${fmt(r.slow)} | ${fmt(r.inp)} ms |`), "");
    if (b.inpCauses?.length) out.push("What was tapped, and the script that ran longest in that frame:", "", "| Element | Script | Slow taps | Avg. INP | Avg. input delay |", "|---|---|---:|---:|---:|", ...b.inpCauses.map((r) => `| ${r.k || "(not recorded)"} | ${r.script || "(none over 50 ms)"} | ${fmt(r.n)} | ${fmt(r.inp)} ms | ${fmt(r.delay)} ms |`), "");
  }
  if (b.experiments?.length) out.push("### Reader experiments (UX briefs, 7 days before and after)", "", "| Story | Changed | Before: views, s, scroll | After: views, s, scroll | Result |", "|---|---|---|---|---|",
    ...b.experiments.map((e) => `| ${e.slug} | ${e.changedAt} | ${e.before ? `${fmt(e.before.n)}, ${fmt(e.before.sec)}, ${fmt(e.before.scroll)}%` : "-"} | ${e.after ? `${fmt(e.after.n)}, ${fmt(e.after.sec)}, ${fmt(e.after.scroll)}%` : "waiting"} | ${e.result ?? "waiting"} |`), "");
  if (b.countries) out.push("Countries: " + b.countries.map((r) => `${r.k || "(unknown)"} ${fmt(r.n)}`).join(" · "), "");
  return out;
}

/**
 * Cloudflare Web Analytics (the beacon Cloudflare adds to every page, bots left out): Core Web
 * Vitals as Google scores them, per device, per page and per element. Account-level RUM datasets,
 * read with the same Account Analytics Read token as the beacon (CF_AE_TOKEN). Times are reported
 * in microseconds by the API when they are large; `ms` converts.
 */
const RUM_FILTER = (since, until) => `{ AND: [{ datetime_geq: "${since}", datetime_lt: "${until}" }, { requestHost: "freshcalendars.com" }, { bot: 0 }] }`;
const VITALS_SUM = "lcpGood lcpNeedsImprovement lcpPoor lcpTotal inpGood inpNeedsImprovement inpPoor inpTotal clsGood clsNeedsImprovement clsPoor clsTotal";
const VITALS_Q = "largestContentfulPaintP75 interactionToNextPaintP75 cumulativeLayoutShiftP75";
export const RUM_QUERIES = {
  devices: (f) => `rumWebVitalsEventsAdaptiveGroups(limit: 10, filter: ${f}, orderBy: [count_DESC]) { count sum { ${VITALS_SUM} } quantiles { ${VITALS_Q} } dimensions { deviceType } }`,
  pages: (f) => `rumWebVitalsEventsAdaptiveGroups(limit: 40, filter: ${f}, orderBy: [count_DESC]) { count sum { ${VITALS_SUM} } quantiles { ${VITALS_Q} } dimensions { requestPath } }`,
  inpElements: (f) => `rumWebVitalsEventsAdaptiveGroups(limit: 12, filter: { AND: [${f}, { interactionToNextPaint_gt: 200 }] }, orderBy: [count_DESC]) { count dimensions { interactionToNextPaintElement interactionToNextPaintPath } }`,
  lcpElements: (f) => `rumWebVitalsEventsAdaptiveGroups(limit: 10, filter: ${f}, orderBy: [count_DESC]) { count quantiles { largestContentfulPaintP75 } dimensions { largestContentfulPaintElement } }`,
  visits: (f) => `rumPageloadEventsAdaptiveGroups(limit: 10, filter: ${f}, orderBy: [date_ASC]) { count sum { visits } dimensions { date } }`,
};
/** Milliseconds from a RUM time that may come in microseconds. */
export const ms = (v) => { const n = Number(v ?? 0); return n > 60000 ? n / 1000 : n; };
const share = (good, total) => (total ? `${Math.round((100 * good) / total)}%` : "-");

/** The Core Web Vitals section of the report. */
export function rumReport(r) {
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const out = ["## Core Web Vitals (Cloudflare Web Analytics)", "", "Measured in real browsers by the Cloudflare beacon, bots left out, last 7 days. Google's \"good\" limits at the 75th percentile: Largest Contentful Paint (LCP) 2.5 s, Interaction to Next Paint (INP) 200 ms, Cumulative Layout Shift (CLS) 0.1.", ""];
  if (r.visits?.length) out.push(`Page loads: ${r.visits.map((v) => `${v.dimensions.date} ${fmt(v.count)}`).join(" · ")}`, "");
  const row = (label, x) => `| ${label} | ${fmt(x.count)} | ${(ms(x.quantiles?.largestContentfulPaintP75) / 1000).toFixed(2)} s (${share(x.sum?.lcpGood, x.sum?.lcpTotal)} good) | ${fmt(ms(x.quantiles?.interactionToNextPaintP75))} ms (${share(x.sum?.inpGood, x.sum?.inpTotal)} good) | ${Number(x.quantiles?.cumulativeLayoutShiftP75 ?? 0).toFixed(3)} (${share(x.sum?.clsGood, x.sum?.clsTotal)} good) |`;
  if (r.devices?.length) out.push("| Device | Samples | LCP p75 | INP p75 | CLS p75 |", "|---|---:|---:|---:|---:|", ...r.devices.map((x) => row(x.dimensions.deviceType || "(unknown)", x)), "");
  const slow = (r.pages ?? []).filter((x) => x.count >= 10 && (ms(x.quantiles?.largestContentfulPaintP75) > 2500 || ms(x.quantiles?.interactionToNextPaintP75) > 200 || Number(x.quantiles?.cumulativeLayoutShiftP75) > 0.1));
  out.push("Pages over a limit (10+ samples):", "", ...(slow.length ? ["| Page | Samples | LCP p75 | INP p75 | CLS p75 |", "|---|---:|---:|---:|---:|", ...slow.slice(0, 15).map((x) => row(x.dimensions.requestPath, x))] : ["- none"]), "");
  if (r.inpElements?.length) out.push("Elements behind slow taps (INP over 200 ms):", "", ...r.inpElements.map((x) => `- ${x.dimensions.interactionToNextPaintElement || "(unknown)"} on ${x.dimensions.interactionToNextPaintPath || "?"}: ${fmt(x.count)}`), "");
  if (r.lcpElements?.length) out.push("What the largest paint is:", "", ...r.lcpElements.map((x) => `- ${x.dimensions.largestContentfulPaintElement || "(unknown)"}: ${fmt(x.count)} samples, p75 ${(ms(x.quantiles?.largestContentfulPaintP75) / 1000).toFixed(2)} s`), "");
  return out;
}

export function report({ days, now, sections }) {
  const fmt = (n) => n.toLocaleString("en-US");
  const out = [`# Traffic (generated, do not edit)`, "",
    `Read ${iso(now).slice(0, 16)} UTC from Cloudflare's edge analytics for ${HOST}, last ${days} days (UTC days). Every page the edge served to a real browser counts, so these numbers are higher than Google Analytics, which misses ad-blocked visits and readers who leave before the page finishes loading. Self-declared bots are left out; unlabeled bots are not, and they are many: real search traffic is mostly mobile, so a desktop share far above half means bots and crawlers inflate these totals. Treat them as an upper bound and use the trend and the story ranking. Source: \`scripts/news-traffic.mjs\`, daily.`, ""];
  const s = sections;
  if (s.beacon) out.push(...beaconReport(s.beacon, days));
  if (s.rum) out.push(...rumReport(s.rum));
  if (s.beacon || s.rum) out.push("## Edge requests (upper bound)", "");
  if (s.newsDaily && s.calendarDaily && s.pdfDaily) {
    out.push("## Page views per day", "", "| Day | /news/ stories | Calendar pages | Printable PDFs |", "|---|---:|---:|---:|");
    s.newsDaily.forEach((r, i) => out.push(`| ${r.day} | ${fmt(r.count)} | ${fmt(s.calendarDaily[i]?.count ?? 0)} | ${fmt(s.pdfDaily[i]?.count ?? 0)} |`));
    const sum = (a) => a.reduce((n, r) => n + r.count, 0);
    out.push(`| **Total** | **${fmt(sum(s.newsDaily))}** | **${fmt(sum(s.calendarDaily))}** | **${fmt(sum(s.pdfDaily))}** |`, "");
  }
  if (s.sources) {
    const by = new Map();
    for (const r of s.sources) by.set(sourceOf(r.key), (by.get(sourceOf(r.key)) ?? 0) + r.count);
    const all = [...by.values()].reduce((a, b) => a + b, 0) || 1;
    out.push("## Where /news/ readers came from (referrer)", "", "Browsers send no referrer from some apps and many mobile searches, so part of the search traffic shows as direct.", "", "| Source | Views | Share |", "|---|---:|---:|",
      ...[...by].sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${k} | ${fmt(n)} | ${((100 * n) / all).toFixed(1)}% |`), "");
    const other = s.sources.filter((r) => sourceOf(r.key) === "Other sites").slice(0, 10);
    if (other.length) out.push("Other sites, top 10: " + other.map((r) => `${r.key} (${fmt(r.count)})`).join(", "), "");
  }
  if (s.topNews) out.push("## Top /news/ stories", "", "| Story | Views |", "|---|---:|", ...s.topNews.slice(0, 40).map((r) => `| ${r.key} | ${fmt(r.count)} |`), "");
  if (s.topCalendar) out.push("## Top calendar pages", "", "| Page | Views |", "|---|---:|", ...s.topCalendar.slice(0, 15).map((r) => `| ${r.key} | ${fmt(r.count)} |`), "");
  if (s.countries) out.push("## Countries (/news/)", "", s.countries.slice(0, 12).map((r) => `${r.key} ${fmt(r.count)}`).join(" · "), "");
  if (s.devices) out.push("## Devices (/news/)", "", s.devices.map((r) => `${r.key} ${fmt(r.count)}`).join(" · "), "");
  if (s.failed.length) out.push("## Not available this run", "", ...s.failed.map((f) => `- ${f}`), "");
  return out.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), days = Number(args[args.indexOf("--days") + 1]) || 7;
  const token = process.env.CF_ANALYTICS_TOKEN, zone = process.env.CF_ZONE_ID;
  if (!token || !zone) {
    console.log("traffic: CF_ANALYTICS_TOKEN or CF_ZONE_ID not set; no traffic report");
    process.exit(0);
  }
  const post = async (q, vars) => {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ query: q, variables: { zone, ...vars } }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.errors?.length) throw new Error(`${res.status}: ${body.errors?.map((e) => e.message).join("; ") ?? "no body"}`);
    return body.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? [];
  };
  const now = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000);
  const sections = { failed: [] };
  const jobs = {
    newsDaily: ["news", null], calendarDaily: ["calendar", null], pdfDaily: ["pdf", null],
    topNews: ["news", "clientRequestPath"], topCalendar: ["calendar", "clientRequestPath"],
    // Referrer (clientRefererHost) is not available on this zone's plan; sources need a first-party beacon.
    countries: ["news", "clientCountryName"], devices: ["news", "clientDeviceType"],
  };
  for (const [name, [kind, dim]] of Object.entries(jobs)) {
    try {
      const r = await perDay({ post, kind, dim, days, now });
      sections[name] = dim ? r.rows : r.daily;
    } catch (e) {
      sections.failed.push(`${name}: ${e.message}`);
      console.log(`::warning::traffic: ${name}: ${e.message}`);
    }
  }
  // The beacon dataset: needs an Account Analytics Read token (CF_AE_TOKEN) and the account id.
  const aeToken = process.env.CF_AE_TOKEN, account = process.env.CF_ACCOUNT_ID;
  if (aeToken && account) {
    const sql = async (q) => {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`, {
        method: "POST", headers: { authorization: `Bearer ${aeToken}` }, body: `${q} FORMAT JSON`, signal: AbortSignal.timeout(30_000),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
      return (JSON.parse(text).data ?? []).map((r) => ({ ...r, n: Number(r.n ?? 0), sec: Number(r.sec ?? 0), scroll: Number(r.scroll ?? 0), slow: Number(r.slow ?? 0), inp: Number(r.inp ?? 0), delay: Number(r.delay ?? 0) }));
    };
    sections.beacon = {};
    for (const [name, q] of Object.entries(BEACON_SQL)) {
      try {
        sections.beacon[name] = await sql(q(days));
      } catch (e) {
        sections.failed.push(`beacon ${name}: ${e.message}`);
        console.log(`::warning::traffic: beacon ${name}: ${e.message}`);
      }
    }
    // Reader experiments of the search desk: measured here, judged by the rule in docs/DESK.md.
    try {
      const exps = JSON.parse(readFileSync(path.join(ROOT, "docs/desk/search-experiments.json"), "utf8"));
      const list = (Array.isArray(exps) ? exps : exps.experiments ?? []).filter((e) => e.kind === "ux" && e.slug && e.changedAt);
      const today = iso(now).slice(0, 10);
      sections.beacon.experiments = [];
      for (const e of list) {
        const w = uxWindows(e, today), page = `/news/${e.slug}/`;
        const row = { slug: e.slug, changedAt: e.changedAt, what: e.what };
        if (w) {
          row.before = (await sql(windowSql(page, ...w.before)))[0];
          row.after = (await sql(windowSql(page, ...w.after)))[0];
          row.result = judgeUx(row.before, row.after);
        }
        sections.beacon.experiments.push(row);
      }
    } catch (e) {
      if (e.code !== "ENOENT") sections.failed.push(`beacon experiments: ${e.message}`);
    }
  } else sections.failed.push("beacon: CF_AE_TOKEN or CF_ACCOUNT_ID not set (Account Analytics Read token, see docs/ANALYTICS.md)");
  // Cloudflare Web Analytics (RUM): the same token, account-level GraphQL.
  if (aeToken && account) {
    sections.rum = {};
    const until = iso(now), since = iso(new Date(now.getTime() - 7 * 86_400_000));
    for (const [name, q] of Object.entries(RUM_QUERIES)) {
      try {
        const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
          method: "POST", headers: { authorization: `Bearer ${aeToken}`, "content-type": "application/json" },
          body: JSON.stringify({ query: `query { viewer { accounts(filter: { accountTag: "${account}" }) { ${q(RUM_FILTER(since, until))} } } }` }),
          signal: AbortSignal.timeout(30_000),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || body.errors?.length) throw new Error(`${res.status}: ${body.errors?.map((e) => e.message).join("; ") ?? "no body"}`);
        sections.rum[name] = Object.values(body.data?.viewer?.accounts?.[0] ?? {})[0] ?? [];
      } catch (e) {
        sections.failed.push(`web analytics ${name}: ${e.message}`);
        console.log(`::warning::traffic: web analytics ${name}: ${e.message}`);
      }
    }
  }
  const md = report({ days, now, sections });
  if (args.includes("--stdout")) console.log(md);
  else {
    writeFileSync(path.join(ROOT, "docs/desk/traffic.md"), md + "\n");
    writeFileSync(path.join(ROOT, "docs/desk/traffic.json"), JSON.stringify({ generatedAt: iso(now), days, ...sections }, null, 1) + "\n");
    console.log(`traffic: wrote docs/desk/traffic.{md,json} (${sections.failed.length} section(s) unavailable)`);
  }
}
