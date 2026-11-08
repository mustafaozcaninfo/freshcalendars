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
  try {
    const sites = await call("GetUserSites");
    site = sites.map((s) => s.Url ?? s.url).find((u) => /freshcalendars\.com/.test(u ?? "")) ?? "";
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
}
