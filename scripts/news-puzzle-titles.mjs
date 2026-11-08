#!/usr/bin/env node
// Writes the standard puzzle title (scripts/lib/puzzle-titles.mjs) into every daily puzzle page whose
// puzzle date is on or after TITLE_SINCE, as the headline itself: the H1 is the <title> (owner
// decision 2026-11-08), so the page carries no seoTitle. Puzzle writers run it before committing a
// batch; audit 13-PUZZLE-TITLE fails a page it would change.  node scripts/news-puzzle-titles.mjs [--check]
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { TITLE_SINCE, parseDaily, puzzleSeoTitle } from "./lib/puzzle-titles.mjs";

const DIR = path.join(import.meta.dirname, "../apps/news/src/content/articles");

/** [file, slug, current title, expected] for every daily page from TITLE_SINCE on that differs or still has a seoTitle. */
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
      const cur = /^title:\s*"(.*)"\s*$/m.exec(md)?.[1] ?? "";
      const want = puzzleSeoTitle(slug);
      if (cur !== want || /^seoTitle:/m.test(md)) out.push([p, slug, cur, want]);
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
    writeFileSync(file, md.replace(/^seoTitle:.*\n/m, "").replace(/^title:.*$/m, `title: "${want}"`));
  }
  console.log(`puzzle titles: ${list.length} page(s) set to the standard title`);
}
