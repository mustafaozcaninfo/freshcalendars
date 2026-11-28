#!/usr/bin/env node
// Daily URL submission of the shop to Bing. Bing held 475 of the shop's 4,642 sitemap pages on
// Nov. 23, 2026 and crawled about 100 a day, and ChatGPT takes its sources from Bing's index, so
// a page Bing does not hold cannot be cited (shop/README.md, "Is the shop in Bing's index?").
// IndexNow only announces a page; this uses the Webmaster API's own submission quota.
// Each run reads the shop's sitemap, picks the pages not yet submitted (the paths listed in
// shop/data/bing-priority.txt first, then categories, tags and guides, then products newest first) up to the day's quota, submits them and records the
// day in docs/desk/bing-shop-submitted.json. A page comes round again after RESUBMIT_DAYS.
//   node scripts/shop-bing-submit.mjs [--dry]
// Optional: without BING_API, or when Bing refuses, it warns and exits 0.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const API = "https://ssl.bing.com/webmaster/api.svc/json";
const SHOP = "https://shop.freshcalendars.com";
const STATE = path.join(ROOT, "docs/desk/bing-shop-submitted.json");
const PRIORITY = path.join(ROOT, "shop/data/bing-priority.txt");
// Paths never submitted: product kinds that draw no visits (shop/README.md, "Pages with no traffic").
// They stay in the sitemap and indexable; the small quota goes to the kinds that sell.
const SKIP = path.join(ROOT, "shop/data/bing-skip.txt");
/** The priority file: one path per line, # for comments. */
export const priorityList = (text) => text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
const BATCH = 500; // SubmitUrlBatch takes at most 500 URLs
export const RESUBMIT_DAYS = 45;

/** Lower rank goes first: listing pages lead to many products, so they are worth a crawl most. */
export function rank(url) {
  const p = url.replace(SHOP, "");
  if (p === "" || p === "/") return 0;
  if (p.startsWith("/categories/")) return 1;
  if (p.startsWith("/tags/")) return 2;
  if (p.startsWith("/articles/")) return 3;
  if (p.startsWith("/products/")) return 4;
  if (p.startsWith("/brands/")) return 5;
  return 6;
}

/**
 * The URLs to send today. `urls` is the sitemap in its own order (the platform lists products
 * oldest first, so a later position is a newer product); `sent` maps a path to the day it was
 * last submitted. Never-submitted pages go first, then pages last sent RESUBMIT_DAYS or more ago.
 */
export function pick(urls, sent, quota, today, priority = []) {
  const cutoff = new Date(Date.parse(today) - RESUBMIT_DAYS * 86_400_000).toISOString().slice(0, 10);
  // Paths in shop/data/bing-priority.txt lead in the file's order; the quota is small (100 a day).
  const first = new Map(priority.map((p, i) => [p, i]));
  const pri = (u) => first.get(u.replace(SHOP, "") || "/") ?? Infinity;
  const rows = urls.map((u, i) => ({ u, i, last: sent[u.replace(SHOP, "") || "/"] ?? "" }))
    .filter((r) => !r.last || r.last <= cutoff);
  rows.sort((a, b) => (a.last ? 1 : 0) - (b.last ? 1 : 0) || (pri(a.u) === pri(b.u) ? 0 : pri(a.u) < pri(b.u) ? -1 : 1) || rank(a.u) - rank(b.u) || (rank(a.u) === 4 ? b.i - a.i : a.i - b.i));
  return rows.slice(0, Math.max(0, quota)).map((r) => r.u);
}

export const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replaceAll("&amp;", "&"));

if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.env.BING_API;
  const dry = process.argv.includes("--dry");
  if (!key && !dry) { console.log("shop-bing-submit: BING_API not set; nothing submitted"); process.exit(0); }
  const get = async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(30_000), headers: { "User-Agent": "freshcalendars-desk" } }); if (!r.ok) throw new Error(`${u} ${r.status}`); return r.text(); };
  try {
    const maps = locs(await get(`${SHOP}/sitemap.xml`));
    const urls = [];
    for (const m of maps) for (const u of locs(await get(m))) if (u.startsWith(SHOP) && !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u)) urls.push(u);
    const all = [...new Set(urls)];
    const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { sent: {} };
    const today = new Date().toISOString().slice(0, 10);
    const priority = existsSync(PRIORITY) ? priorityList(readFileSync(PRIORITY, "utf8")) : [];
    const skip = new Set(existsSync(SKIP) ? priorityList(readFileSync(SKIP, "utf8")) : []);
    const pool = all.filter((u) => !skip.has(u.replace(SHOP, "") || "/"));
    let quota = { DailyQuota: 100, MonthlyQuota: 100 }, site = SHOP + "/";
    if (!dry) {
      const call = async (method, params, body) => {
        const res = await fetch(`${API}/${method}?${new URLSearchParams({ ...params, apikey: key })}`, body
          ? { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) }
          : { signal: AbortSignal.timeout(30_000) });
        const text = await res.text();
        if (!res.ok) throw new Error(`${method} ${res.status}: ${text.slice(0, 160)}`);
        return JSON.parse(text).d;
      };
      const sites = (await call("GetUserSites", {})) ?? [];
      site = sites.map((s) => s.Url ?? s.url ?? "").find((u) => /shop\.freshcalendars\.com/.test(u)) ?? "";
      if (!site) { console.log("shop-bing-submit: shop.freshcalendars.com is not among the verified sites; nothing submitted"); process.exit(0); }
      quota = await call("GetUrlSubmissionQuota", { siteUrl: site });
      const room = Math.min(Number(quota.DailyQuota ?? 0), Number(quota.MonthlyQuota ?? 0));
      const list = pick(pool, state.sent, room, today, priority);
      let done = 0;
      for (let i = 0; i < list.length; i += BATCH) {
        const part = list.slice(i, i + BATCH);
        await call("SubmitUrlbatch", {}, { siteUrl: site, urlList: part });
        for (const u of part) state.sent[u.replace(SHOP, "") || "/"] = today;
        done += part.length;
      }
      // Pages that left the sitemap (hidden products) drop out of the record.
      const live = new Set(all.map((u) => u.replace(SHOP, "") || "/"));
      for (const p of Object.keys(state.sent)) if (!live.has(p)) delete state.sent[p];
      const never = pool.filter((u) => !state.sent[u.replace(SHOP, "") || "/"]).length;
      const out = { generatedAt: new Date().toISOString(), site, quota, submittedToday: done, sitemapUrls: all.length, neverSubmitted: never, sent: Object.fromEntries(Object.entries(state.sent).sort()) };
      writeFileSync(STATE, JSON.stringify(out, null, 0).replace(/","/g, '",\n"') + "\n");
      console.log(`shop-bing-submit: submitted ${done} of ${all.length} sitemap URLs (daily quota ${quota.DailyQuota}, monthly ${quota.MonthlyQuota}); ${never} never submitted`);
    } else {
      const list = pick(pool, state.sent, 100, today, priority);
      console.log(`shop-bing-submit (dry): ${all.length} sitemap URLs, ${Object.keys(state.sent).length} on record; the first 100 would be:\n${list.slice(0, 12).join("\n")}\n...`);
    }
  } catch (e) {
    console.log(`::warning::shop-bing-submit: ${e.message}`);
  }
}
