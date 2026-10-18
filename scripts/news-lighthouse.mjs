#!/usr/bin/env node
/**
 * Lighthouse gate for /news/ (NEWS-ROADMAP §8.4): builds the news app against a local
 * origin, serves it with scripts/news-serve.mjs and requires 100 in all four categories
 * (mobile) on the home, an article, a category and an author page.
 * Env: LH_RUNS (default 1, median per URL), LH_MIN (default 100), LH_SKIP_BUILD=1.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.LH_PORT || 4324);
const ORIGIN = `http://localhost:${PORT}`;
const RUNS = Number(process.env.LH_RUNS || 1);
const MIN = Number(process.env.LH_MIN || 100);
const CATS = ["performance", "accessibility", "best-practices", "seo"];

if (process.env.LH_SKIP_BUILD !== "1") {
  const b = spawnSync("pnpm", ["news:build"], {
    cwd: ROOT, stdio: "inherit", env: { ...process.env, NEWS_SITE_ORIGIN: ORIGIN, NEWS_INCLUDE_DRAFTS: "1" },
  });
  if (b.status !== 0) process.exit(b.status ?? 1);
}

const dist = path.join(ROOT, "dist/news");
const firstDir = (sub) => fs.readdirSync(path.join(dist, sub)).find((d) => fs.existsSync(path.join(dist, sub, d, "index.html")));
const article = fs.readdirSync(dist).find((d) => !["_astro", "author", "category", "page", "about", "editorial-policy", "corrections-policy", "masthead"].includes(d) && fs.existsSync(path.join(dist, d, "index.html")));
const urls = ["/news/", article && `/news/${article}/`, firstDir("category") && `/news/category/${firstDir("category")}/`, `/news/author/${firstDir("author")}/`, "/news/editorial-policy/"]
  // Heaviest article template (download grid with previews) when present.
  .concat(fs.existsSync(path.join(dist, "julian-date-calendar-2027-2026-printable/index.html")) ? ["/news/julian-date-calendar-2027-2026-printable/"] : [])
  .concat(fs.existsSync(path.join(dist, "ramadan-2027-calendar-dates-timetable/index.html")) ? ["/news/ramadan-2027-calendar-dates-timetable/"] : [])
  .filter(Boolean)
  .map((p) => ORIGIN + p);

const server = spawn("node", [path.join(ROOT, "scripts/news-serve.mjs"), String(PORT)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "news-lh-"));
let fails = 0;
try {
  for (const url of urls) {
    const reports = [];
    for (let i = 0; i < RUNS; i++) {
      const out = path.join(tmp, `r${reports.length}.json`);
      const r = spawnSync("npx", ["--yes", "lighthouse@12.2.1", url, `--only-categories=${CATS.join(",")}`,
        "--form-factor=mobile", "--screenEmulation.mobile=true",
        "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage", "--quiet", "--output=json", `--output-path=${out}`],
        { encoding: "utf8", timeout: 240_000 });
      if (r.status !== 0) { console.error(r.stderr); fails++; continue; }
      reports.push(JSON.parse(fs.readFileSync(out, "utf8")));
    }
    if (!reports.length) continue;
    reports.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
    const rep = reports[Math.floor(reports.length / 2)];
    const scores = Object.fromEntries(CATS.map((c) => [c, Math.round((rep.categories[c].score ?? 0) * 100)]));
    const a = rep.audits;
    console.log(`${url.replace(ORIGIN, "")}  perf ${scores.performance} · a11y ${scores.accessibility} · bp ${scores["best-practices"]} · seo ${scores.seo}  | LCP ${a["largest-contentful-paint"].displayValue} · CLS ${a["cumulative-layout-shift"].displayValue} · TBT ${a["total-blocking-time"].displayValue}`);
    const failing = CATS.flatMap((c) => rep.categories[c].auditRefs
      .filter((ref) => ref.weight > 0 && a[ref.id].score !== null && a[ref.id].score < 1)
      .map((ref) => {
        const au = a[ref.id];
        const nodes = (au.details?.items ?? []).slice(0, 5).map((it) => it.node && `        · ${it.node.snippet?.slice(0, 120)} — ${it.node.explanation?.split("\n").pop()?.slice(0, 140) ?? ""}`).filter(Boolean);
        return [`    ✖ [${c}] ${ref.id}: ${au.title}${au.displayValue ? ` (${au.displayValue})` : ""}`, ...nodes].join("\n");
      }));
    if (failing.length) console.log(failing.join("\n"));
    if (CATS.some((c) => scores[c] < MIN)) fails++;
  }
} finally {
  server.kill();
}
console.log(fails ? `Lighthouse gate FAILED (${fails} URL(s) below ${MIN})` : `Lighthouse gate OK — all categories ≥ ${MIN}`);
process.exit(fails ? 1 : 0);
