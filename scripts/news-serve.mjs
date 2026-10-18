#!/usr/bin/env node
/**
 * Local origin for /news/ checks: serves dist/news at /news/ and dist/site elsewhere,
 * with gzip and the cache headers planned for production (NEWS-ROADMAP §7.4).
 * Usage: node scripts/news-serve.mjs [port]
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "dist/site");
const NEWS = path.join(ROOT, "dist/news");
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4324);

const TYPES = {
  ".html": "text/html; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".xsl": "text/xsl; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".pdf": "application/pdf", ".avif": "image/avif", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};
const COMPRESSIBLE = /^(text\/|application\/(xml|json|manifest)|image\/svg)/;

function cacheControl(urlPath, ext) {
  if (urlPath.startsWith("/news/_astro/") || ext === ".woff2") return "public, max-age=31536000, immutable";
  if (urlPath.startsWith("/news/")) return "public, max-age=300, stale-while-revalidate=600";
  if ([".png", ".jpg", ".webp", ".avif", ".svg", ".ico", ".css", ".js"].includes(ext)) return "public, max-age=2592000";
  return "public, max-age=604800";
}

function resolve(urlPath) {
  const [base, rel] = urlPath.startsWith("/news/") || urlPath === "/news" ? [NEWS, urlPath.slice(5)] : [SITE, urlPath];
  let file = path.join(base, decodeURIComponent(rel));
  if (!file.startsWith(base)) return null;
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!urlPath.endsWith("/")) return { redirect: `${urlPath}/` };
    file = path.join(file, "index.html");
  }
  return existsSync(file) ? { file } : null;
}

http
  .createServer((req, res) => {
    const urlPath = new URL(req.url ?? "/", "http://x").pathname;
    const hit = resolve(urlPath);
    if (hit?.redirect) { res.writeHead(301, { Location: hit.redirect }); return res.end(); }
    const file = hit?.file ?? path.join(SITE, "404.html");
    const ext = path.extname(file);
    const type = TYPES[ext] ?? "application/octet-stream";
    const headers = { "Content-Type": type, "Cache-Control": cacheControl(urlPath, ext), "X-Content-Type-Options": "nosniff" };
    const gzip = COMPRESSIBLE.test(type) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
    if (gzip) headers["Content-Encoding"] = "gzip";
    res.writeHead(hit ? 200 : 404, headers);
    const stream = createReadStream(file);
    (gzip ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
  })
  .listen(PORT, () => console.log(`news origin on http://localhost:${PORT} (news: ${NEWS}, site: ${SITE})`));
