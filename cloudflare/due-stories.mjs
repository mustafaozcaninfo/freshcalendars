#!/usr/bin/env node
// Stories whose publishedAt fell between a build (Unix time, argv[2]) and now: the build left them
// out as future posts, so they need a rebuild to go live (.github/workflows/scheduled.yml).
// Prints their slugs, space separated; nothing when none are due.
// With --next instead of a build time, prints the Unix time of the earliest story still in the future
// (nothing when there is none), so a scheduled run can wait for it instead of hoping GitHub starts
// a run right after it.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const next = process.argv[2] === "--next";
const since = Number(process.argv[2]) * 1000;
const now = Date.now();
const due = [];
let soonest = Infinity;
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.mdx?$/.test(f)) {
      const m = /^publishedAt:\s*"?([^"\n]+)/m.exec(readFileSync(p, "utf8"));
      const t = m ? Date.parse(m[1]) : NaN;
      if (t > since && t <= now) due.push(f.replace(/\.mdx?$/, ""));
      if (t > now && t < soonest) soonest = t;
    }
  }
})(path.join(import.meta.dirname, "../apps/news/src/content/articles"));
console.log(next ? (soonest < Infinity ? String(Math.ceil(soonest / 1000)) : "") : due.join(" "));
