#!/usr/bin/env node
/**
 * Parity check for the Cloudflare move: requests every URL of the live site and its twin on another
 * host, and compares status, redirect target, content-type, cache-control, Link, canonical, H1,
 * <title>, robots meta and a normalized body hash. Binary files are compared by their bytes, on the
 * CDN host when the new site moved them there.
 *
 *   node scripts/cf-parity.mjs [--a https://freshcalendars.com] [--b https://freshcalendars.info7691.workers.dev]
 *                              [--cdn-b https://pub-….r2.dev] [--paths file] [--out report.json]
 *
 * URLs: the sitemaps of A, every deployed file in dist/cf/public, every /news/ redirect source,
 * one sample for each old calendar-URL rule, a sample of printables, calendar files and news
 * images, and a few 404s. A difference listed in EXPLAINED (the intended changes) is reported as
 * explained; anything else is unexplained and makes the exit code 1.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, def) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : def; };
const A = arg("--a", "https://freshcalendars.com");
const B = arg("--b", "https://freshcalendars.info7691.workers.dev");
const CDN = "https://cdn.freshcalendars.com";
const CDN_B = arg("--cdn-b", CDN); // where B's CDN files can be read before the cutover (r2.dev)
const OUT = arg("--out", path.join(ROOT, ".cache/cf-parity.json"));
const CONCURRENCY = Number(arg("--concurrency", 12));
const UA = "Mozilla/5.0 (compatible; FreshCalendarsParity/1.0)";

async function get(url, opts = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(url, { redirect: "manual", headers: { "User-Agent": UA, "Accept-Encoding": "gzip, br" }, signal: AbortSignal.timeout(30_000), ...opts });
      const buf = Buffer.from(await r.arrayBuffer());
      return { status: r.status, headers: r.headers, buf };
    } catch (err) {
      if (attempt >= 2) return { status: 0, headers: new Headers(), buf: Buffer.alloc(0), error: String(err) };
      await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
    }
  }
}

const sha = (b) => createHash("sha256").update(b).digest("hex").slice(0, 16);
const pick = (re, s) => (re.exec(s)?.[1] ?? "").replace(/\s+/g, " ").trim();
const isText = (ct) => /text\/|xml|json|javascript|webmanifest|calendar/.test(ct);

/** Same page, either host: B's own origin and the moved files' URLs written as A writes them. */
function normalize(text, origin) {
  let t = text.split(origin).join(A).split(CDN_B).join(CDN);
  t = t.split(`${CDN}/news/_astro/`).join("/news/_astro/").split(`${A}/news/_astro/`).join("/news/_astro/");
  t = t.split(`${CDN}/assets/`).join("/assets/").split(`${A}/assets/`).join("/assets/");
  // Astro names image variants by a hash that includes the URL prefix: compare the source image only.
  t = t.replace(/(\/news\/_astro\/[^."'\s,)<]+)\.[^."'\s,)<]+\.(avif|webp|png|jpe?g)/g, "$1.V.$2");
  return t;
}

function summarize(res, origin) {
  const ct = (res.headers.get("content-type") ?? "").toLowerCase();
  const loc = res.headers.get("location") ?? "";
  const redirect = res.status >= 300 && res.status < 400;
  const out = {
    status: res.status,
    location: loc ? new URL(loc, origin + "/").href.split(origin).join(A).split(CDN_B).join(CDN) : "",
    // A redirect's own body type and cache header are not something a client uses.
    contentType: redirect ? "" : ct.replace(/\s/g, ""),
    cacheControl: redirect ? "" : res.headers.get("cache-control") ?? "",
    link: res.headers.get("link") ?? "",
  };
  if (res.status === 200 && isText(ct)) {
    const text = normalize(res.buf.toString("utf8"), origin);
    if (ct.includes("html")) {
      out.canonical = pick(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i, text);
      out.title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i, text);
      out.h1 = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i, text).replace(/<[^>]+>/g, "");
      out.robots = pick(/<meta[^>]+name="robots"[^>]+content="([^"]*)"/i, text);
    }
    out.body = sha(text);
  } else if (res.status === 200) {
    out.body = sha(res.buf);
  }
  return out;
}

// ---- URL list -------------------------------------------------------------------------------
const paths = new Set();
const add = (p) => { if (p && p.startsWith("/")) paths.add(p); };
async function sitemap(url) {
  const r = await get(url);
  const xml = r.buf.toString("utf8");
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const u = m[1].replace(/&amp;/g, "&");
    if (/sitemap[^/]*\.xml$/.test(u) && u !== url) { add(new URL(u).pathname); await sitemap(u); }
    else if (u.startsWith(A)) add(new URL(u).pathname);
  }
}
const extra = arg("--paths");
if (extra) for (const l of readFileSync(extra, "utf8").split("\n")) add(l.trim());
else {
  for (const s of ["/sitemap.xml", "/sitemap-images.xml", "/news/sitemap.xml"]) { add(s); await sitemap(A + s); }
  // Every deployed file.
  const pub = path.join(ROOT, "dist/cf/public");
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else {
        const rel = "/" + path.relative(pub, p).split(path.sep).join("/");
        if (rel === "/_redirects" || rel === "/_headers") continue;
        add(rel.endsWith("/index.html") ? rel.replace(/index\.html$/, "") : rel.replace(/\.html\.html$/, ".html"));
      }
    }
  })(pub);
  // Redirect sources and their old spellings.
  for (const line of readFileSync(path.join(ROOT, "apps/news/redirects.map"), "utf8").split("\n")) {
    const m = /^"~\^(.+)\$"/.exec(line.trim());
    if (m) add(m[1].replace(/\\(.)/g, "$1"));
  }
  for (const p of ["/printable-calendar.html", "/march-calendar.html", "/blank-calendar.html", "/2025-calendar.html", "/year/2024",
    "/printable-calendars-2025.html", "/printable-calendar-2024.html", "/june-calendars-2025.html", "/printable-may-2025-calendar.html",
    "/2025-holidays.html", "/when-is/easter-2025.html", "/when-is/thanksgiving-2025.html", "/printable-july-calendar.html",
    "/printable-blank-calendar.html", "/weekly-calendars.html", "/school-calendars.html", "/monday-start-calendars.html",
    "/yearly-calendars.html", "/calendar.html", "/holidays.html", "/australia-holidays", "/india-holidays/", "/when-is/halloween.html",
    "/about", "/contact/", "/page/privacy", "/page/terms/", "/page/contact.html", "/page/privacy-policy.html", "/page/terms-of-use.html",
    "/page/easter", "/page/thanksgiving/", "/page/samhain", "/editor", "/editor/x", "/printable/monthly/2024/june/foo.jpg",
    "/when-is/easter", "/news", "/news/about", "/does-not-exist", "/news/does-not-exist/", "/january-calendars",
    "/robots.txt", "/ads.txt", "/llms.txt", "/favicon.ico", "/api/contact.php", "/admin/", "/.env", "/news/.git/config",
    "/?utm_source=x", "/news/?utm_source=x", "/january-calendars.html?ref=1"]) add(p);
  // Samples of the moved binary files, as live pages link them.
  const sample = (arr, n) => arr.filter((_, i) => i % Math.max(1, Math.floor(arr.length / n)) === 0).slice(0, n);
  const dl = [];
  (function walk(d) { for (const e of readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else dl.push("/news/downloads/" + path.relative(path.join(ROOT, "dist/news/downloads"), p).split(path.sep).join("/")); } })(path.join(ROOT, "dist/news/downloads"));
  for (const p of sample(dl, 120)) add(p);
  // Calendar files the pages link on the main host (/assets/...), now 301s to the CDN.
  const refs = new Set();
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "assets") walk(p); }
      else if (e.name.endsWith(".html")) for (const m of readFileSync(p, "utf8").matchAll(/["'(\s,=](\/assets\/[^"'\s,)?#]+)/g)) refs.add(m[1]);
    }
  })(path.join(ROOT, "dist/site"));
  for (const p of sample([...refs].sort(), 150)) add(p);
}

// --cdn-keys <file>: also compare each CDN object (one key per line) on CDN and CDN_B.
const cdnKeys = arg("--cdn-keys");

// ---- compare -----------------------------------------------------------------------------------
/** Intended differences, each with the reason given in the delivery report. */
const EXPLAINED = [
  { id: "dir-no-slash", why: "Directory URL without its slash: Workers redirects with 307 (nginx/Apache: 301 or 200)", test: (p, a, b) => b.status === 307 && b.location === A + p.replace(/\?.*$/, "") + "/" + (p.includes("?") ? p.slice(p.indexOf("?")) : "") },
  { id: "index-html", why: "/dir/index.html redirects (307) to /dir/ instead of serving a duplicate", test: (p, a, b) => /\/index\.html$/.test(p) && b.status === 307 },
  { id: "assets-cdn", why: "/assets/* moved to cdn.freshcalendars.com (R2) with a 301; the file is byte-identical there", test: (p, a, b) => p.startsWith("/assets/") && b.status === 301 && b.cdnBody && b.cdnBody === a.body },
  { id: "assets-fixed", why: "/assets/ files the pages link (srcset sizes) that were missing on the old server: now 301 to the CDN copy (200)", test: (p, a, b) => p.startsWith("/assets/") && a.status === 404 && b.status === 301 && b.cdnStatus === 200 },
  { id: "php-gone", why: "PHP removed: /admin/ and the PHP contact endpoint are gone (404 / the Worker endpoint)", test: (p) => /^\/(admin\/|api\/contact\.php)/.test(p) },
  { id: "ics-type", why: "Calendar files (.ics) sent as text/calendar instead of application/octet-stream, so phones offer to add the events", fields: ["contentType"], test: (p, a, b) => p.endsWith(".ics") && b.contentType === "text/calendar" },
  { id: "html-suffix-of-dir", why: "/x.html where /x/ is a page: the asset router answers 307 to /x/ (nginx: 404)", test: (p, a, b) => /\.html$/.test(p) && a.status === 404 && b.status === 307 && b.location === A + p.replace(/\.html$/, "/") },
  { id: "dotfile-404", why: "Dotfiles (/.env) get the site's 404 page instead of the server's generic one; still 404", test: (p, a, b) => /\/\./.test(p) && a.status === 404 && b.status === 404 },
  { id: "charset", why: "Content-Type without '; charset=utf-8' (pages declare <meta charset>)", fields: ["contentType"], test: (p, a, b) => a.contentType.replace(/;charset=utf-8/, "") === b.contentType.replace(/;charset=utf-8/, "") },
];

const report = { a: A, b: B, at: new Date().toISOString(), total: 0, identical: 0, explained: {}, unexplained: [] };
const list = [...paths].sort();
let next = 0;
async function worker() {
  while (next < list.length) {
    const p = list[next++];
    const [ra, rb] = await Promise.all([get(A + p), get(B + p)]);
    const a = summarize(ra, A), b = summarize(rb, B);
    // Files B moved to the CDN: compare the bytes there.
    if (b.status === 301 && b.location.startsWith(CDN + "/")) {
      const twin = await get(b.location.replace(CDN, CDN_B));
      b.cdnStatus = twin.status;
      b.cdnBody = twin.status === 200 ? (isText(twin.headers.get("content-type") ?? "") ? sha(normalize(twin.buf.toString("utf8"), B)) : sha(twin.buf)) : "";
    }
    report.total++;
    // A page differs: ask A's origin past its edge cache (a fresh query string) before judging.
    if (a.body && b.body && a.body !== b.body && ra.headers.get("cf-cache-status") === "HIT") {
      const fresh = summarize(await get(`${A}${p}${p.includes("?") ? "&" : "?"}cfparity=${Date.now()}`), A);
      if (fresh.body === b.body) { a.body = b.body; a.staleEdge = true; }
    }
    const diff = Object.keys({ ...a, ...b }).filter((k) => !["cdnStatus", "cdnBody", "staleEdge"].includes(k) && JSON.stringify(a[k] ?? "") !== JSON.stringify(b[k] ?? ""));
    if (!diff.length) {
      if (a.staleEdge) (report.explained["stale-edge"] ??= { why: "Live Cloudflare cache held an older copy; A's origin file equals B", paths: [] }).paths.push(p);
      else report.identical++;
      continue;
    }
    const whole = EXPLAINED.find((e) => !e.fields && e.test(p, a, b));
    if (whole) { (report.explained[whole.id] ??= { why: whole.why, paths: [] }).paths.push(p); continue; }
    const rest = diff.filter((k) => !EXPLAINED.some((e) => e.fields?.includes(k) && e.test(p, a, b)));
    for (const e of EXPLAINED.filter((e) => e.fields && diff.some((k) => e.fields.includes(k)) && e.test(p, a, b))) {
      (report.explained[e.id] ??= { why: e.why, paths: [] }).paths.push(p);
    }
    if (!rest.length) continue;
    report.unexplained.push({ path: p, fields: rest, a: Object.fromEntries(rest.map((k) => [k, a[k]])), b: Object.fromEntries(rest.map((k) => [k, b[k]])) });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

if (cdnKeys) {
  const keys = readFileSync(cdnKeys, "utf8").split("\n").map((k) => k.trim()).filter(Boolean);
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < keys.length) {
      const k = keys[i++];
      const [ra, rb] = await Promise.all([get(`${CDN}/${k}`), get(`${CDN_B}/${k}`)]);
      report.total++;
      const a = { status: ra.status, contentType: ra.headers.get("content-type") ?? "", body: sha(ra.buf) };
      const b = { status: rb.status, contentType: rb.headers.get("content-type") ?? "", body: sha(rb.buf) };
      if (a.status === b.status && a.contentType === b.contentType && a.body === b.body) { report.identical++; continue; }
      // The CDN copy is an older render than the one freshcalendars.com/assets/ served: R2 holds the newer one.
      if (k.startsWith("assets/") || k.startsWith("og/")) {
        const origin = await get(`${A}/${k}`);
        if (b.status === 200 && origin.status === 200 && sha(origin.buf) === b.body && a.contentType === b.contentType) {
          (report.explained["newer-render"] ??= { why: "cdn.freshcalendars.com (DigitalOcean) held an older render than freshcalendars.com/assets/; R2 holds the newer one the site served", paths: [] }).paths.push(`cdn:/${k}`);
          continue;
        }
      }
      const fields = ["status", "contentType", "body"].filter((f) => a[f] !== b[f]);
      report.unexplained.push({ path: `cdn:/${k}`, fields, a, b });
    }
  }));
}
report.unexplained.sort((x, y) => x.path.localeCompare(y.path));
writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`${report.total} URLs: ${report.identical} identical, ${Object.values(report.explained).reduce((n, e) => n + e.paths.length, 0)} explained, ${report.unexplained.length} unexplained`);
for (const [id, e] of Object.entries(report.explained)) console.log(`  explained ${id} (${e.paths.length}): ${e.why}`);
for (const u of report.unexplained.slice(0, 40)) console.log(`  DIFF ${u.path} ${u.fields.join(",")} A=${JSON.stringify(u.a).slice(0, 160)} B=${JSON.stringify(u.b).slice(0, 160)}`);
console.log(`report: ${OUT}`);
process.exit(report.unexplained.length ? 1 : 0);
