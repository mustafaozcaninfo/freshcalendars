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
import { writeFileSync } from "node:fs";
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

const AE_WHERE = (days) => `timestamp > NOW() - INTERVAL '${days}' DAY`;
const AE_RATE = "SUM(_sample_interval)";
const AE_AVG = (col) => `SUM(_sample_interval * ${col}) / SUM(_sample_interval)`;
/** SQL for the beacon dataset (fc_pageviews, cloudflare/worker.js pageView). */
export const BEACON_SQL = {
  daily: (n) => `SELECT toStartOfDay(timestamp) AS k, ${AE_RATE} AS n, ${AE_AVG("double1")} AS sec FROM fc_pageviews WHERE ${AE_WHERE(n)} GROUP BY k ORDER BY k`,
  sources: (n) => `SELECT blob2 AS k, ${AE_RATE} AS n FROM fc_pageviews WHERE ${AE_WHERE(n)} GROUP BY k ORDER BY n DESC LIMIT 300`,
  pages: (n) => `SELECT blob1 AS k, ${AE_RATE} AS n, ${AE_AVG("double1")} AS sec, ${AE_AVG("double2")} AS scroll FROM fc_pageviews WHERE ${AE_WHERE(n)} GROUP BY k ORDER BY n DESC LIMIT 40`,
  countries: (n) => `SELECT blob3 AS k, ${AE_RATE} AS n FROM fc_pageviews WHERE ${AE_WHERE(n)} GROUP BY k ORDER BY n DESC LIMIT 15`,
  devices: (n) => `SELECT blob4 AS k, ${AE_RATE} AS n FROM fc_pageviews WHERE ${AE_WHERE(n)} GROUP BY k ORDER BY n DESC`,
};

/** The beacon part of the report: real readers whose browser ran the page. */
export function beaconReport(b, days) {
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const out = ["## Real readers (first-party beacon)", "",
    `Page views sent by the reader's own browser to /api/pv when they leave the page (cloudflare/worker.js). Ad blockers do not stop it and bots that run no JavaScript never send it, so this is the number to report. Last ${days} days.`, ""];
  if (b.daily) {
    out.push("| Day | Views | Avg. seconds on page |", "|---|---:|---:|", ...b.daily.map((r) => `| ${String(r.k).slice(0, 10)} | ${fmt(r.n)} | ${fmt(r.sec)} |`));
    out.push(`| **Total** | **${fmt(b.daily.reduce((s, r) => s + r.n, 0))}** | |`, "");
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
    ...b.pages.map((r) => `| ${r.k} | ${fmt(r.n)} | ${fmt(r.sec)} | ${fmt(r.scroll)}% |`), "");
  if (b.devices) out.push("Devices: " + b.devices.map((r) => `${r.k || "(unknown)"} ${fmt(r.n)}`).join(" · "), "");
  if (b.countries) out.push("Countries: " + b.countries.map((r) => `${r.k || "(unknown)"} ${fmt(r.n)}`).join(" · "), "");
  return out;
}

export function report({ days, now, sections }) {
  const fmt = (n) => n.toLocaleString("en-US");
  const out = [`# Traffic (generated, do not edit)`, "",
    `Read ${iso(now).slice(0, 16)} UTC from Cloudflare's edge analytics for ${HOST}, last ${days} days (UTC days). Every page the edge served to a real browser counts, so these numbers are higher than Google Analytics, which misses ad-blocked visits and readers who leave before the page finishes loading. Self-declared bots are left out; unlabeled bots are not, and they are many: real search traffic is mostly mobile, so a desktop share far above half means bots and crawlers inflate these totals. Treat them as an upper bound and use the trend and the story ranking. Source: \`scripts/news-traffic.mjs\`, daily.`, ""];
  const s = sections;
  if (s.beacon) out.push(...beaconReport(s.beacon, days), "## Edge requests (upper bound)", "");
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
    sections.beacon = {};
    for (const [name, sql] of Object.entries(BEACON_SQL)) {
      try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`, {
          method: "POST", headers: { authorization: `Bearer ${aeToken}` }, body: `${sql(days)} FORMAT JSON`, signal: AbortSignal.timeout(30_000),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
        sections.beacon[name] = (JSON.parse(text).data ?? []).map((r) => ({ ...r, n: Number(r.n), sec: Number(r.sec ?? 0), scroll: Number(r.scroll ?? 0) }));
      } catch (e) {
        sections.failed.push(`beacon ${name}: ${e.message}`);
        console.log(`::warning::traffic: beacon ${name}: ${e.message}`);
      }
    }
  } else sections.failed.push("beacon: CF_AE_TOKEN or CF_ACCOUNT_ID not set (Account Analytics Read token, see docs/ANALYTICS.md)");
  const md = report({ days, now, sections });
  if (args.includes("--stdout")) console.log(md);
  else {
    writeFileSync(path.join(ROOT, "docs/desk/traffic.md"), md + "\n");
    writeFileSync(path.join(ROOT, "docs/desk/traffic.json"), JSON.stringify({ generatedAt: iso(now), days, ...sections }, null, 1) + "\n");
    console.log(`traffic: wrote docs/desk/traffic.{md,json} (${sections.failed.length} section(s) unavailable)`);
  }
}
