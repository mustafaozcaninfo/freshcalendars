#!/usr/bin/env node
// Writes the standard seoTitle (scripts/lib/puzzle-titles.mjs) into every daily puzzle page whose
// puzzle date is on or after TITLE_SINCE. Puzzle writers run it before committing a batch; audit
// 13-PUZZLE-TITLE fails a page it would change.  node scripts/news-puzzle-titles.mjs [--check]
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { TITLE_SINCE, parseDaily, puzzleSeoTitle } from "./lib/puzzle-titles.mjs";

const DIR = path.join(import.meta.dirname, "../apps/news/src/content/articles");

/** [file, slug, current seoTitle, expected] for every daily page from TITLE_SINCE on that differs. */
export function titleProblems(dir = DIR) {
  const out = [];
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!f.endsWith(".md")) continue;
      const slug = f.slice(0, -3), info = parseDaily(slug);
      if (!info || info.date < TITLE_SINCE) continue;
      const md = readFileSync(p, "utf8");
      const cur = /^seoTitle:\s*"(.*)"\s*$/m.exec(md)?.[1] ?? "";
      const want = puzzleSeoTitle(slug);
      if (cur !== want) out.push([p, slug, cur, want]);
    }
  })(dir);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const list = titleProblems();
  if (process.argv.includes("--check")) {
    for (const [, slug, cur, want] of list) console.log(`${slug}: "${cur}" -> "${want}"`);
    process.exit(list.length ? 1 : 0);
  }
  for (const [file, , , want] of list) {
    const md = readFileSync(file, "utf8");
    writeFileSync(file, /^seoTitle:/m.test(md) ? md.replace(/^seoTitle:.*$/m, `seoTitle: "${want}"`) : md.replace(/^(title:.*)$/m, `$1\nseoTitle: "${want}"`));
  }
  console.log(`puzzle titles: ${list.length} page(s) set to the standard seoTitle`);
}
