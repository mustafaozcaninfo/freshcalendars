#!/usr/bin/env node
// Daily Bing Webmaster Tools read for the desk: Bing (which also serves Yahoo and DuckDuckGo
// results) brought about twice Google's readers in the first beacon data (Nov. 8, 2026), and Search
// Console does not see it. Clicks and impressions per day, the queries and pages with their
// positions, the queries worth a better title (position 2.5 to 20, click rate under 3%), and the
// crawl and index counts. Writes docs/desk/bing.{md,json}; the daily Search Console workflow runs it
// with the BING_API secret (Bing Webmaster Tools > Settings > API access).
//   node scripts/news-bing.mjs [--stdout]
// Optional: without the key, or when Bing refuses, it warns and exits 0.
import { writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const API = "https://ssl.bing.com/webmaster/api.svc/json";
const DAY = 86_400_000;

/** Bing's "/Date(1731024000000)/" or ISO text to a YYYY-MM-DD day. */
export const bingDay = (v) => { const m = /Date\((\d+)/.exec(String(v)); return new Date(m ? Number(m[1]) : Date.parse(v)).toISOString().slice(0, 10); };

/** Rows grouped by key over the days from `from` on: clicks, impressions, impression-weighted position. */
export function aggregate(rows, key, from) {
  const by = new Map();
  for (const r of rows) {
    if (bingDay(r.Date) < from) continue;
    const k = r[key];
    const a = by.get(k) ?? by.set(k, { key: k, clicks: 0, impressions: 0, posW: 0 }).get(k);
    a.clicks += Number(r.Clicks ?? 0);
    a.impressions += Number(r.Impressions ?? 0);
    a.posW += Number(r.AvgImpressionPosition ?? r.AvgClickPosition ?? 0) * Number(r.Impressions ?? 0);
  }
  return [...by.values()].map((a) => ({ ...a, position: a.impressions ? a.posW / a.impressions : 0, ctr: a.impressions ? a.clicks / a.impressions : 0 })).sort((x, y) => y.impressions - x.impressions);
}

export function report({ now, site, daily, queries, pages, crawl, failed }) {
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  const out = ["# Bing Webmaster Tools (generated, do not edit)", "",
    `Read ${now.toISOString().slice(0, 16)} UTC for ${site || "(site not found)"}. Bing's results also appear on Yahoo and DuckDuckGo. Bing's data lags a few days. Source: \`scripts/news-bing.mjs\`, daily.`, ""];
  if (daily?.length) {
    const last = daily.slice(-14);
    const sum = (rows, f) => rows.reduce((s, r) => s + Number(r[f] ?? 0), 0);
    const cur = last.slice(-7), prev = last.slice(0, -7);
    out.push("## Clicks and impressions", "", `Last 7 days with data: ${fmt(sum(cur, "Clicks"))} clicks, ${fmt(sum(cur, "Impressions"))} impressions (the 7 before: ${fmt(sum(prev, "Clicks"))} clicks, ${fmt(sum(prev, "Impressions"))} impressions).`, "",
      "| Day | Clicks | Impressions |", "|---|---:|---:|", ...last.map((r) => `| ${bingDay(r.Date)} | ${fmt(r.Clicks ?? 0)} | ${fmt(r.Impressions ?? 0)} |`), "");
  }
  if (queries?.length) {
    out.push("## Top queries, last 28 days", "", "| Query | Impressions | Clicks | Click rate | Avg. position |", "|---|---:|---:|---:|---:|",
      ...queries.slice(0, 30).map((q) => `| ${q.key} | ${fmt(q.impressions)} | ${fmt(q.clicks)} | ${pct(q.ctr)} | ${q.position.toFixed(1)} |`), "");
    const opp = queries.filter((q) => q.impressions >= 50 && q.position >= 2.5 && q.position <= 20 && q.ctr < 0.03);
    out.push("## Opportunities (search desk)", "", "Queries at position 2.5 to 20 with 50+ impressions and a click rate under 3%: the title or first sentence may not match what Bing searchers want.", "",
      ...(opp.length ? opp.slice(0, 20).map((q) => `- "${q.key}": ${fmt(q.impressions)} impressions at ${q.position.toFixed(1)}, ${pct(q.ctr)} click rate`) : ["- none"]), "");
  }
  if (pages?.length) out.push("## Top pages, last 28 days", "", "| Page | Impressions | Clicks | Click rate | Avg. position |", "|---|---:|---:|---:|---:|",
    ...pages.slice(0, 25).map((p) => `| ${String(p.key).replace(/^https?:\/\/[^/]+/, "")} | ${fmt(p.impressions)} | ${fmt(p.clicks)} | ${pct(p.ctr)} | ${p.position.toFixed(1)} |`), "");
  if (crawl?.length) {
    const c = crawl.at(-1);
    out.push("## Crawl and index", "", `Latest day ${bingDay(c.Date)}: ${fmt(c.CrawledPages ?? 0)} pages crawled, ${fmt(c.CrawlErrors ?? 0)} crawl errors, ${fmt(c.InIndex ?? 0)} pages in the index, ${fmt(c.InLinks ?? 0)} inbound links${c.BlockedByRobotsTxt ? `, ${fmt(c.BlockedByRobotsTxt)} blocked by robots.txt` : ""}.`, "");
  }
  if (failed.length) out.push("## Not available this run", "", ...failed.map((f) => `- ${f}`), "");
  return out.join("\n");
}

/** The shop's report: pages in Bing's index and crawl results by day, then clicks, pages and queries. */
export function shopReport({ now, site, crawl, daily, pages, queries, failed }) {
  const out = ["# Bing Webmaster Tools, shop (generated, do not edit)", "",
    `Read ${now.toISOString().slice(0, 16).replace("T", " ")} UTC for ${site}. "In index" is the number of the shop's pages Bing holds; ChatGPT search takes its sources from Bing. Bing's data lags a few days. Source: \`scripts/news-bing.mjs\`, daily.`, ""];
  if (failed.length) out.push(`Problems: ${failed.join("; ")}`, "");
  out.push("## Pages in Bing's index and crawl, last 14 days", "");
  if (crawl?.length) {
    out.push("| Day | In index | Crawled | 2xx | 301 | 4xx | 5xx | Blocked by robots.txt |", "|---|---:|---:|---:|---:|---:|---:|---:|");
    for (const c of crawl.slice(-14)) out.push(`| ${bingDay(c.Date)} | ${c.InIndex ?? ""} | ${c.CrawledPages ?? ""} | ${c.Code2xx ?? ""} | ${c.Code301 ?? ""} | ${c.Code4xx ?? ""} | ${c.Code5xx ?? ""} | ${c.BlockedByRobotsTxt ?? ""} |`);
  } else out.push("No crawl data.");
  out.push("", "## Clicks and impressions, last 14 days", "");
  if (daily?.length) {
    out.push("| Day | Clicks | Impressions |", "|---|---:|---:|");
    for (const d of daily.slice(-14)) out.push(`| ${bingDay(d.Date)} | ${d.Clicks ?? 0} | ${d.Impressions ?? 0} |`);
  } else out.push("No traffic data.");
  const top = (rows, title, n) => {
    out.push("", `## ${title}`, "");
    if (!rows?.length) { out.push("No data."); return; }
    out.push("| Key | Clicks | Impressions | Position |", "|---|---:|---:|---:|");
    for (const r of rows.slice(0, n)) out.push(`| ${String(r.key).replace(/\|/g, "/")} | ${r.clicks} | ${r.impressions} | ${r.impressions ? Math.round((r.posW / r.impressions) * 10) / 10 : ""} |`);
  };
  top(pages, "Top pages, last 28 days", 40);
  top(queries, "Top queries, last 28 days", 40);
  return out.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.env.BING_API;
  if (!key) { console.log("bing: BING_API not set; no Bing report"); process.exit(0); }
  const failed = [];
  const call = async (method, params = {}) => {
    const qs = new URLSearchParams({ ...params, apikey: key });
    const res = await fetch(`${API}/${method}?${qs}`, { signal: AbortSignal.timeout(30_000) });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${res.status}: ${text.slice(0, 160)}`);
    return JSON.parse(text).d ?? [];
  };
  const now = new Date();
  let site = "";
  let shopSite = "";
  try {
    const sites = await call("GetUserSites");
    const urls = sites.map((s) => s.Url ?? s.url ?? "");
    // The shop is its own verified site; the main report must not pick it up by accident.
    site = urls.find((u) => /freshcalendars\.com/.test(u) && !/shop\.freshcalendars\.com/.test(u)) ?? "";
    shopSite = urls.find((u) => /shop\.freshcalendars\.com/.test(u)) ?? "";
    if (!site) failed.push(`no freshcalendars.com site among ${sites.length} verified sites`);
  } catch (e) { failed.push(`sites: ${e.message}`); }
  const get = async (name, method) => {
    if (!site) return null;
    try { return await call(method, { siteUrl: site }); } catch (e) { failed.push(`${name}: ${e.message}`); console.log(`::warning::bing: ${name}: ${e.message}`); return null; }
  };
  const from = new Date(now.getTime() - 28 * DAY).toISOString().slice(0, 10);
  const dailyRaw = await get("traffic", "GetRankAndTrafficStats");
  const daily = dailyRaw ? [...dailyRaw].sort((a, b) => bingDay(a.Date).localeCompare(bingDay(b.Date))) : null;
  const qRaw = await get("queries", "GetQueryStats");
  const pRaw = await get("pages", "GetPageStats");
  const crawlRaw = await get("crawl", "GetCrawlStats");
  const crawl = crawlRaw ? [...crawlRaw].sort((a, b) => bingDay(a.Date).localeCompare(bingDay(b.Date))) : null;
  const queries = qRaw ? aggregate(qRaw, "Query", from) : null;
  const pages = pRaw ? aggregate(pRaw, "Query", from) : null;
  const md = report({ now, site, daily, queries, pages, crawl, failed });
  if (process.argv.includes("--stdout")) console.log(md);
  else {
    writeFileSync(path.join(ROOT, "docs/desk/bing.md"), md + "\n");
    writeFileSync(path.join(ROOT, "docs/desk/bing.json"), JSON.stringify({ generatedAt: now.toISOString(), site, daily, queries: queries?.slice(0, 300), pages: pages?.slice(0, 300), crawl: crawl?.slice(-30), failed }, null, 1) + "\n");
    console.log(`bing: wrote docs/desk/bing.{md,json} (${failed.length} problem(s))`);
  }
  // The shop (shop.freshcalendars.com): how many of its pages Bing holds. ChatGPT takes its sources
  // from Bing's index, so this count is the first thing to read when shop traffic moves
  // (shop/README.md, "Where the visitors come from"). Skipped when the shop is not a verified site.
  if (shopSite) {
    const shopFailed = [];
    const sget = async (name, method) => { try { return await call(method, { siteUrl: shopSite }); } catch (e) { shopFailed.push(`${name}: ${e.message}`); return null; } };
    const byDay = (rows) => (rows ? [...rows].sort((a, b) => bingDay(a.Date).localeCompare(bingDay(b.Date))) : null);
    const sCrawl = byDay(await sget("crawl", "GetCrawlStats"));
    const sDaily = byDay(await sget("traffic", "GetRankAndTrafficStats"));
    const sPagesRaw = await sget("pages", "GetPageStats");
    const sQueriesRaw = await sget("queries", "GetQueryStats");
    const sPages = sPagesRaw ? aggregate(sPagesRaw, "Query", from) : null;
    const sQueries = sQueriesRaw ? aggregate(sQueriesRaw, "Query", from) : null;
    const smd = shopReport({ now, site: shopSite, crawl: sCrawl, daily: sDaily, pages: sPages, queries: sQueries, failed: shopFailed });
    if (process.argv.includes("--stdout")) console.log(smd);
    else {
      writeFileSync(path.join(ROOT, "docs/desk/bing-shop.md"), smd + "\n");
      writeFileSync(path.join(ROOT, "docs/desk/bing-shop.json"), JSON.stringify({ generatedAt: now.toISOString(), site: shopSite, crawl: sCrawl?.slice(-30), daily: sDaily?.slice(-30), pages: sPages?.slice(0, 300), queries: sQueries?.slice(0, 300), failed: shopFailed }, null, 1) + "\n");
      console.log(`bing: wrote docs/desk/bing-shop.{md,json} (${shopFailed.length} problem(s))`);
    }
  } else console.log("bing: shop.freshcalendars.com is not among the verified sites; no shop report");
}
