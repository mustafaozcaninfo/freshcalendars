#!/usr/bin/env node
/**
 * Pre-publish gate for dist/news (NEWS-ROADMAP §7.8): link/H1/orphan crawl, every page has
 * canonical + JSON-LD that parses, sitemaps/feed are well-formed (xmllint when present),
 * the Google News sitemap holds nothing older than 48h, and no build leftovers ship.
 * Usage: node scripts/news-verify.mjs [distDir]
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(process.argv[2] ?? path.join(ROOT, "dist/news"));
let errors = 0;
const bad = (msg) => { console.log(`✖ ${msg}`); errors++; };

if (!existsSync(path.join(dist, "index.html"))) { bad(`no build at ${dist}`); process.exit(1); }

const links = spawnSync("node", [path.join(ROOT, "apps/news/test/links.mjs"), dist], { encoding: "utf8" });
process.stdout.write(links.stdout);
if (links.status !== 0) errors++;

const html = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== "_astro") walk(p); }
    else if (f === "index.html") html.push(p);
    // home.json is public on purpose: the calendar home page refreshes its news blocks from it.
    else if (dir === dist && /\.(mjs|js|json)$/.test(f) && f !== "home.json") bad(`build leftover in output: ${f}`);
  }
})(dist);
for (const f of html) {
  const s = readFileSync(f, "utf8");
  const rel = path.relative(dist, f);
  if (!/<link rel="canonical" href="https:\/\/[^"]+\/"/.test(s)) bad(`${rel}: missing absolute canonical`);
  const ld = [...s.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  if (ld.length !== 1) bad(`${rel}: expected 1 JSON-LD block, found ${ld.length}`);
  for (const m of ld) { try { JSON.parse(m[1]); } catch { bad(`${rel}: JSON-LD does not parse`); } }
  if (/localhost/.test(s)) bad(`${rel}: contains localhost (built with NEWS_SITE_ORIGIN?)`);
}

// Download links (PDF/PNG printables) must point at files that exist in the build.
for (const f of html) {
  for (const m of readFileSync(f, "utf8").matchAll(/href="\/news\/(downloads\/[^"]+)"/g)) {
    if (!existsSync(path.join(dist, m[1]))) bad(`${path.relative(dist, f)}: missing download ${m[1]}`);
  }
}

const xmlFiles = readdirSync(dist).filter((f) => f.endsWith(".xml"));
for (const want of ["sitemap.xml", "post-sitemap.xml", "news-sitemap.xml", "feed.xml"]) {
  if (!xmlFiles.includes(want)) bad(`missing ${want}`);
}
const hasXmllint = spawnSync("xmllint", ["--version"]).status === 0;
for (const f of xmlFiles) {
  const p = path.join(dist, f);
  if (hasXmllint && spawnSync("xmllint", ["--noout", p]).status !== 0) bad(`${f} is not well-formed XML`);
}
const news = readFileSync(path.join(dist, "news-sitemap.xml"), "utf8");
const now = Date.now();
for (const m of news.matchAll(/<news:publication_date>([^<]+)</g)) {
  if (now - Date.parse(m[1]) > 48 * 3600_000 + 15 * 60_000) bad(`news-sitemap has an item older than 48h: ${m[1]}`);
}

console.log(`${html.length} pages, ${xmlFiles.length} xml files${hasXmllint ? "" : " (xmllint not installed — XML well-formedness skipped)"} · ${errors ? `${errors} problem(s)` : "verify OK"}`);
process.exit(errors ? 1 : 0);
