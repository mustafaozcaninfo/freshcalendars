#!/usr/bin/env node
/**
 * Checks that a story is really live on freshcalendars.com after auto-publish: HTTP 200, the
 * canonical URL, an indexable robots tag, H1 and <title> from the frontmatter, the JSON-LD dates
 * and a row in the post sitemap. With --wait it polls until every check passes (or time runs
 * out), so a push of an urgent story can end with proof that readers see it, and when.
 * Each result is appended to .cache/news-live-verify.jsonl (gitignored). Exits 1 on any failure.
 *
 * Usage: pnpm news:verify-live [slug ...] [--wait 600]
 *   (no slug: the stories changed by the last commit on HEAD)
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTICLES = path.join(ROOT, "apps/news/src/content/articles");
const ORIGIN = "https://freshcalendars.com";
const POLL_MS = 15_000;

const argv = process.argv.slice(2);
const waitAt = argv.indexOf("--wait");
const waitSec = waitAt >= 0 ? Number(argv[waitAt + 1] ?? 600) : 0;
let slugs = argv.filter((a, i) => !a.startsWith("--") && (waitAt < 0 || i !== waitAt + 1));
if (!slugs.length) {
  slugs = execFileSync("git", ["diff-tree", "--no-commit-id", "--name-only", "-r", "--diff-filter=AM", "HEAD", "--", "apps/news/src/content/articles"], { cwd: ROOT, encoding: "utf8" })
    .split("\n").filter((f) => /\.mdx?$/.test(f)).map((f) => path.basename(f).replace(/\.mdx?$/, ""));
  if (!slugs.length) { console.log("No story changed in the last commit; pass a slug."); process.exit(0); }
}

const files = new Map();
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(dir, e.name));
    else if (/\.mdx?$/.test(e.name)) files.set(e.name.replace(/\.mdx?$/, ""), path.join(dir, e.name));
  }
})(ARTICLES);

const decode = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&#x27;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const sameInstant = (a, b) => a && b && new Date(a).getTime() === new Date(b).getTime();
// NEWS_LIVE_BASE checks another host serving the same build (the workers.dev preview); URLs and
// canonicals stay on freshcalendars.com.
const BASE = (process.env.NEWS_LIVE_BASE || ORIGIN).replace(/\/$/, "");
const get = async (url) => { const r = await fetch(url.replace(ORIGIN, BASE), { redirect: "manual", signal: AbortSignal.timeout(20_000) }); return { status: r.status, cache: r.headers.get("cf-cache-status"), text: await r.text() }; };

let sitemap = null;
async function sitemapUrls() {
  if (sitemap) return sitemap;
  const index = (await get(`${ORIGIN}/news/sitemap.xml`)).text;
  const children = [...index.matchAll(/<loc>([^<]*post-sitemap[^<]*)<\/loc>/g)].map((m) => m[1]);
  sitemap = new Set();
  for (const c of children) for (const m of (await get(c)).text.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemap.add(m[1]);
  return sitemap;
}

async function verify(slug) {
  const file = files.get(slug);
  if (!file) return { slug, ok: false, checks: [{ name: "story file", ok: false, detail: "no such story in this checkout" }] };
  const fm = YAML.parse(readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/)[1]);
  const url = `${ORIGIN}/news/${slug}/`;
  if (fm.draft) return { slug, url, ok: false, checks: [{ name: "draft", ok: false, detail: "draft: true, never published" }] };
  if (new Date(fm.publishedAt) > new Date()) return { slug, url, ok: false, scheduled: fm.publishedAt, checks: [{ name: "scheduled", ok: false, detail: `publishedAt ${fm.publishedAt} has not come yet` }] };

  const checks = [];
  const add = (name, ok, detail = "") => checks.push({ name, ok: !!ok, detail });
  const page = await get(url);
  if (page.status !== 200) {
    // A fresh query string skips the Cloudflare copy: tells "not published" apart from "edge still serves the old answer".
    const origin = await get(`${url}?verify=${Date.now()}`);
    add("HTTP 200", false, `${page.status} (cache ${page.cache ?? "?"}); without the edge cache: ${origin.status}`);
    return { slug, url, ok: false, checks };
  }
  const h = page.text;
  add("HTTP 200", true, `cache ${page.cache ?? "?"}`);
  const canonical = h.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  add("canonical", canonical === url, canonical ?? "missing");
  const robots = h.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? "";
  add("robots", fm.noindex ? /noindex/.test(robots) : !/noindex/.test(robots), robots || "missing");
  const h1 = decode(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "");
  add("H1 = title", h1 === fm.title, h1 || "missing");
  const title = decode(h.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  add("<title>", title.startsWith(fm.seoTitle ?? fm.title), title || "missing");
  const published = h.match(/"datePublished":"([^"]+)"/)?.[1];
  add("datePublished", sameInstant(published, fm.publishedAt), `${published} vs ${fm.publishedAt}`);
  const modified = h.match(/"dateModified":"([^"]+)"/)?.[1];
  add("dateModified", sameInstant(modified, fm.updatedAt ?? fm.publishedAt), `${modified} vs ${fm.updatedAt ?? fm.publishedAt}`);
  if (!fm.noindex) add("post sitemap", (await sitemapUrls()).has(url));
  return { slug, url, ok: checks.every((c) => c.ok), checks };
}

const started = Date.now();
const firstLive = new Map();
let results;
for (;;) {
  sitemap = null;
  results = [];
  for (const s of slugs) {
    const r = await verify(s).catch((e) => ({ slug: s, ok: false, checks: [{ name: "request", ok: false, detail: e.message }] }));
    // The publish time is only known when an earlier poll saw the page missing.
    const up = r.checks.find((c) => c.name === "HTTP 200")?.ok;
    if (!up) firstLive.set(s, null);
    else if (firstLive.get(s) === null) firstLive.set(s, new Date().toISOString());
    results.push(r);
  }
  const left = results.filter((r) => !r.ok);
  if (!left.length || Date.now() - started + POLL_MS > waitSec * 1000) break;
  console.log(`waiting: ${left.map((r) => r.slug).join(", ")} (${Math.round((Date.now() - started) / 1000)} s)`);
  await new Promise((r) => setTimeout(r, POLL_MS));
}

mkdirSync(path.join(ROOT, ".cache"), { recursive: true });
for (const r of results) {
  console.log(`${r.ok ? "LIVE" : "FAIL"}  ${r.url ?? r.slug}`);
  for (const c of r.checks) console.log(`  ${c.ok ? "ok  " : "FAIL"} ${c.name.padEnd(14)} ${c.detail}`);
  if (firstLive.get(r.slug)) console.log(`  went live between ${new Date(Date.parse(firstLive.get(r.slug)) - POLL_MS).toISOString()} and ${firstLive.get(r.slug)}`);
  appendFileSync(path.join(ROOT, ".cache/news-live-verify.jsonl"), JSON.stringify({ at: new Date().toISOString(), firstLive: firstLive.get(r.slug) ?? null, ...r }) + "\n");
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
