// Crawls a built dist/news: every internal /news/ link must resolve to a file, every page
// must be reachable from /news/ (articles and hubs within 3 clicks; deep /page/N/ archives only need to be linked), and each page has exactly one <h1>.
// Usage: node apps/news/test/links.mjs [distDir]
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(process.argv[2] ?? path.join(here, "../../../dist/news"));
const MAX_DEPTH = 3;

const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== "_astro") walk(p); }
    else if (f === "index.html") pages.push("/news/" + path.relative(dist, dir).split(path.sep).filter(Boolean).map((s) => s + "/").join(""));
  }
})(dist);

const fileFor = (url) => path.join(dist, url.replace(/^\/news\//, ""), "index.html");
const linksOf = (url) => {
  const html = readFileSync(fileFor(url), "utf8");
  return { html, links: [...html.matchAll(/href="(\/news\/[^"#?]*)/g)].map((m) => m[1]).filter((h) => !h.startsWith("/news/_astro/") && !/\.\w+$/.test(h)) };
};

let errors = 0;
const depth = new Map([["/news/", 0]]);
const queue = ["/news/"];
while (queue.length) {
  const url = queue.shift();
  const { html, links } = linksOf(url);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) { console.log(`h1 x${h1}: ${url}`); errors++; }
  for (const l of links) {
    if (!existsSync(fileFor(l))) { console.log(`broken: ${url} → ${l}`); errors++; continue; }
    if (!depth.has(l)) { depth.set(l, depth.get(url) + 1); queue.push(l); }
  }
}
for (const p of pages) {
  const d = depth.get(p);
  if (d === undefined) { console.log(`orphan: ${p}`); errors++; }
  else if (d > MAX_DEPTH && !/\/page\/\d+\/$/.test(p)) { console.log(`depth ${d}: ${p}`); errors++; }
}
console.log(`${pages.length} pages, max depth ${Math.max(...depth.values())}, ${errors} problem(s)`);
process.exit(errors ? 1 : 0);
