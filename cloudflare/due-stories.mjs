#!/usr/bin/env node
// Stories whose publishedAt fell between a build (Unix time, argv[2]) and now: the build left them
// out as future posts, so they need a rebuild to go live (.github/workflows/scheduled.yml).
// Prints their slugs, space separated; nothing when none are due.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const since = Number(process.argv[2]) * 1000;
const now = Date.now();
const due = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.mdx?$/.test(f)) {
      const m = /^publishedAt:\s*"?([^"\n]+)/m.exec(readFileSync(p, "utf8"));
      const t = m ? Date.parse(m[1]) : NaN;
      if (t > since && t <= now) due.push(f.replace(/\.mdx?$/, ""));
    }
  }
})(path.join(import.meta.dirname, "../apps/news/src/content/articles"));
console.log(due.join(" "));
