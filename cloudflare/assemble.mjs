#!/usr/bin/env node
// Builds the one folder the Worker serves (dist/cf/public) from the calendar site (dist/site) and
// /news/ (dist/news), plus the two maps the Worker bundles. Binary files stay out: calendar
// assets, news images (_astro) and printables live in R2 (cloudflare/r2-sync.sh) and are served
// on cdn.freshcalendars.com, which keeps the deploy far under the 20,000-file Workers limit.
//
//   node cloudflare/assemble.mjs        (CDN_ORIGIN overrides https://cdn.freshcalendars.com)
//
// Page files: Workers assets serve /dir/ from dir/index.html, but redirect /x.html to /x. Our
// canonical URLs end in .html, so every other page is stored as x.html.html, which the asset
// router serves at /x.html (and nothing at /x, which stays a 404 as on nginx).
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LEGACY_RULES, legacyRedirect } from "./legacy-redirects.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "dist/site");
const NEWS = path.join(ROOT, "dist/news");
const OUT = path.join(ROOT, "dist/cf");
const PUBLIC = path.join(OUT, "public");
const CDN = (process.env.CDN_ORIGIN || "https://cdn.freshcalendars.com").replace(/\/$/, "");
const FILE_LIMIT = 20000; // Workers Free; Paid allows 100,000
const SIZE_LIMIT = 25 * 1024 * 1024;

const HTML = "public, max-age=300, stale-while-revalidate=3600";
const NEWS_HTML = "public, max-age=300, stale-while-revalidate=600";
const STATIC = "public, max-age=2592000, stale-while-revalidate=604800";
const IMMUTABLE = "public, max-age=31536000, immutable";

async function walk(dir, base = dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, base, out);
    else out.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return out;
}

for (const [dir, cmd] of [[SITE, "pnpm fc refresh-meta"], [NEWS, "pnpm news:build"]]) {
  if (!(await stat(path.join(dir, "index.html")).catch(() => null))) throw new Error(`${dir} is empty: run ${cmd} first`);
}
await rm(OUT, { recursive: true, force: true });
await mkdir(PUBLIC, { recursive: true });

// Calendar site. assets/ is in R2; api/ and admin/ were the PHP the Worker replaces.
const SITE_SKIP = /^(assets|api|admin)\/|(^|\/)\./;
let rewritten = 0;
for (const rel of await walk(SITE)) {
  if (SITE_SKIP.test(rel)) continue;
  const to = path.join(PUBLIC, rel);
  await mkdir(path.dirname(to), { recursive: true });
  if (rel.endsWith(".html")) {
    // Pages link calendar files as /assets/...; those are on the CDN now (/assets/* also 301s there).
    const html = await readFile(path.join(SITE, rel), "utf8");
    const next = html.replace(/(["'(\s,=])\/assets\//g, `$1${CDN}/assets/`);
    if (next !== html) rewritten++;
    await writeFile(to, next);
  } else {
    await cp(path.join(SITE, rel), to);
  }
}

// /news/. _astro holds only images (styles are inlined), served from R2 through build.assetsPrefix.
const newsFiles = await walk(NEWS);
const strayAstro = newsFiles.filter((f) => f.startsWith("_astro/") && !/\.(avif|webp|png|jpe?g|gif|svg)$/i.test(f));
if (strayAstro.length) throw new Error(`non-image files in dist/news/_astro (would be missing on the CDN): ${strayAstro.slice(0, 5).join(", ")}`);
for (const rel of newsFiles) {
  if (/^(_astro|downloads)\//.test(rel) || /(^|\/)\./.test(rel)) continue;
  const to = path.join(PUBLIC, "news", rel);
  await mkdir(path.dirname(to), { recursive: true });
  await cp(path.join(NEWS, rel), to);
}
const relativeImages = [];
for (const rel of newsFiles.filter((f) => f.endsWith(".html"))) {
  if ((await readFile(path.join(NEWS, rel), "utf8")).includes('"/news/_astro/')) relativeImages.push(rel);
}
if (relativeImages.length) {
  console.warn(`[cf] ${relativeImages.length} news page(s) still link /news/_astro/ (built without NEWS_ASSETS_PREFIX?); they work through a 301`);
}

// Page files, see the header comment.
const files = await walk(PUBLIC);
for (const rel of files.filter((f) => f.endsWith(".html") && !f.endsWith("/index.html") && f !== "index.html")) {
  await rename(path.join(PUBLIC, rel), path.join(PUBLIC, `${rel}.html`));
}

// /news/ 301s (apps/news/redirects.map, nginx map syntax). Printable ones go to the Worker,
// which answers /news/downloads/* before the asset router reads _redirects.
const redirectLines = [];
const downloadRedirects = {};
const mapText = await readFile(path.join(ROOT, "apps/news/redirects.map"), "utf8");
for (const line of mapText.split("\n")) {
  const m = /^"~\^(.+)\$"\s+(\S+);$/.exec(line.trim());
  if (!m) continue;
  const from = m[1].replace(/\\(.)/g, "$1");
  if (/[\^$*+?()[\]{}|]/.test(from)) throw new Error(`redirects.map: regex too complex for _redirects: ${line}`);
  if (from.startsWith("/news/downloads/")) downloadRedirects[from] = m[2];
  else redirectLines.push(`${from} ${m[2]} 301`);
}
// /x.html where x/index.html is a page: the asset router would answer 307 to /x/ before the Worker
// sees it; Apache sent 301 (old-URL rules), so those go here as static 301s.
for (const rel of files.filter((f) => f.endsWith("/index.html"))) {
  const page = "/" + rel.replace(/\/index\.html$/, ".html");
  const target = legacyRedirect(page);
  if (target) redirectLines.push(`${page} ${target} 301`);
}
redirectLines.push(
  `/news/_astro/* ${CDN}/news/_astro/:splat 301`,
  `/assets/* ${CDN}/assets/:splat 301`,
);
await writeFile(path.join(PUBLIC, "_redirects"), redirectLines.join("\n") + "\n");

// Cache headers as nginx and .htaccess set them (scripts/hestia-apply-nginx-cache.sh).
const rule = (pattern, cache, cdn) =>
  `${pattern}\n  ! Cache-Control\n  ! CDN-Cache-Control\n  Cache-Control: ${cache}\n${cdn ? `  CDN-Cache-Control: ${cdn}\n` : ""}`;
const headers = [
  `/*\n  Cache-Control: ${HTML}\n  CDN-Cache-Control: public, max-age=2678400\n`,
  ...["/*.png", "/*.svg", "/*.ico", "/*.webmanifest", "/*.webp", "/*.jpg", "/*.css", "/*.js", "/*.txt"].map((p) => rule(p, STATIC)),
  // Apache sent no cache header for these (nginx passed them through).
  ...["/*.xml", "/*.json", "/*.md"].map((p) => `${p}\n  ! Cache-Control\n  ! CDN-Cache-Control\n`),
  "/favicon.ico\n  Content-Type: image/x-icon\n",
  // Pages: nginx and Apache named the charset; the asset router sends bare text/html.
  "/\n  Content-Type: text/html; charset=utf-8\n",
  "/*/\n  Content-Type: text/html; charset=utf-8\n",
  "/*.html\n  Content-Type: text/html; charset=utf-8\n",
  "/*.txt\n  Content-Type: text/plain; charset=utf-8\n",
  rule("/*.woff2", IMMUTABLE),
  rule("/news/*", NEWS_HTML, "public, max-age=600"),
  rule("/news/*.xsl", "public, max-age=86400"),
  "/news/*.xml\n  Content-Type: text/xml; charset=utf-8\n",
];
await writeFile(path.join(PUBLIC, "_headers"), headers.join(""));

// PDF canonical map for the Worker (built by apps/news/src/lib/pdf-meta.mjs for nginx).
const canonical = {};
const pdfMap = await readFile(path.join(ROOT, "dist/news-data/pdf-canonical.map"), "utf8").catch(() => "");
for (const line of pdfMap.split("\n")) {
  const m = /^"~\^(.+)\$"\s+"<([^>]+)>; rel=\\"canonical\\"";$/.exec(line.trim());
  if (m) canonical[m[1].replace(/\\(.)/g, "$1")] = m[2];
}
await writeFile(path.join(OUT, "pdf-canonical.json"), JSON.stringify(canonical));
await writeFile(path.join(OUT, "news-redirects.json"), JSON.stringify(downloadRedirects));

// Checks: file count and size limits, and no old-URL rule that Apache applied to a live page.
const deployed = await walk(PUBLIC);
let big = [];
for (const rel of deployed) if ((await stat(path.join(PUBLIC, rel))).size > SIZE_LIMIT) big.push(rel);
if (big.length) throw new Error(`files over 25 MiB: ${big.join(", ")}`);
const shadowed = [];
for (const rel of deployed) {
  const url = rel.endsWith("index.html") ? rel.replace(/index\.html$/, "") : rel.replace(/\.html\.html$/, ".html");
  if (LEGACY_RULES.some(([re]) => re.test(url))) shadowed.push(url);
}
if (shadowed.length) throw new Error(`old-URL rules match deployed pages (Apache redirected them): ${shadowed.join(", ")}`);
const count = deployed.length - 2; // _redirects and _headers are config, not assets
if (count > FILE_LIMIT) throw new Error(`${count} files: over the ${FILE_LIMIT}-file Workers Free limit (move to Workers Paid)`);
console.log(`[cf] dist/cf/public: ${count} files (limit ${FILE_LIMIT}); ${rewritten} calendar pages point /assets/ at ${CDN}; ` +
  `${redirectLines.length} redirects, ${Object.keys(canonical).length} PDF canonicals`);
