#!/usr/bin/env node
// After a deploy: tell search engines about /news/ stories that are new or whose updatedAt moved,
// as scripts/news-publish.sh did on the VPS. New stories and topic hubs go to IndexNow and once to
// AnindaIndex (scripts/index-submit.mjs keeps that record); an updated story goes to IndexNow only.
// Lists and pages a new story merely reshuffles are left to the crawl.
//
//   node cloudflare/index-ping.mjs <previous dist/news> <new dist/news>
// A missing previous build (first deploy) announces nothing. Env: ANINDA_INDEX_KEY,
// NEWS_INDEXNOW=0 and NEWS_INDEX_SUBMIT=0 to skip either. Never fails the deploy.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ORIGIN = "https://freshcalendars.com";
const INDEXNOW_KEY = "freshcalendars-indexnow-2026";
const [prev, next] = process.argv.slice(2);
if (!prev || !next) throw new Error("usage: index-ping.mjs <previous dist/news> <new dist/news>");
if (!existsSync(path.join(prev, "index.html"))) {
  console.log("[index] no previous build to compare with; nothing announced");
  process.exit(0);
}

const modified = (file) => /article:modified_time" content="([^"]*)"/.exec(readFileSync(file, "utf8"))?.[1] ?? "";
// Story pages are <slug>/index.html; hubs are topic/<slug>/index.html.
const pages = [];
for (const d of readdirSync(next, { withFileTypes: true })) {
  if (!d.isDirectory() || /^(category|author|page|topic|_astro|downloads|design|search)$/.test(d.name)) continue;
  if (existsSync(path.join(next, d.name, "index.html"))) pages.push(`${d.name}/index.html`);
}
if (existsSync(path.join(next, "topic"))) {
  for (const d of readdirSync(path.join(next, "topic"), { withFileTypes: true })) {
    if (d.isDirectory() && existsSync(path.join(next, "topic", d.name, "index.html"))) pages.push(`topic/${d.name}/index.html`);
  }
}

const announce = [];
const fresh = [];
for (const p of pages) {
  const url = `${ORIGIN}/news/${p.replace(/index\.html$/, "")}`;
  const before = path.join(prev, p);
  if (!existsSync(before)) { announce.push(url); fresh.push(url); }
  else if (!p.startsWith("topic/") && modified(before) !== modified(path.join(next, p))) announce.push(url);
}
console.log(`[index] ${fresh.length} new, ${announce.length - fresh.length} updated`);

if (process.env.NEWS_INDEXNOW !== "0" && announce.length) {
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: "freshcalendars.com", key: INDEXNOW_KEY, keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`, urlList: announce }),
    });
    console.log(`[index] IndexNow ${announce.length} url(s) -> HTTP ${res.status}`);
  } catch (err) {
    console.log(`[index] IndexNow failed: ${err.message}`);
  }
}
// Runs even with no new URL: it sends whatever an earlier run left queued.
if (process.env.NEWS_INDEX_SUBMIT !== "0" && process.env.ANINDA_INDEX_KEY) {
  spawnSync(process.execPath, [path.join(import.meta.dirname, "../scripts/index-submit.mjs"), "submit", ...fresh], { stdio: "inherit" });
}
