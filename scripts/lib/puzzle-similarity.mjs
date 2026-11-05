/**
 * Daily puzzle pages must read as new pages, not as yesterday's text with new answers. Each page's
 * words (body, summary and FAQ) are cut into three-word runs, and the share of runs it has in common
 * with each of the previous three pages of the same game (Jaccard) must stay under SIMILAR_MAX.
 * Works on the Markdown source, so scheduled pages are checked before they go live. Owner decision
 * 2026-11-03; puzzle dates before SIMILAR_SINCE are only reported.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { puzzleOf } from "../../apps/news/src/lib/puzzles.mjs";

export const SIMILAR_MAX = 0.35;
export const SIMILAR_SINCE = "2026-11-05";
const LOOKBACK = 3;

/** Prose of a story: body plus summary and FAQ from the frontmatter, links reduced to their text. */
function prose(md) {
  const [, fm = "", body = ""] = md.split(/^---$/m);
  const lists = (fm.match(/^(summary:|faq:)[\s\S]*?(?=^\w+:)/gm) ?? []).join("\n");
  return `${lists}\n${body}`.toLowerCase().replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

export function shingles(text) {
  const w = text.match(/[a-z0-9']+/g) ?? [];
  const out = new Set();
  for (let i = 0; i + 2 < w.length; i++) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return out;
}

export function jaccard(a, b) {
  let both = 0;
  for (const s of a) if (b.has(s)) both++;
  const any = a.size + b.size - both;
  return any ? both / any : 0;
}

/** Every daily puzzle page in the articles tree, grouped by game and sorted by puzzle date. */
function dailyPages(dir) {
  const games = new Map();
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!f.endsWith(".md")) continue;
      const slug = f.slice(0, -3), puzzle = puzzleOf(slug);
      if (!puzzle) continue;
      const md = readFileSync(p, "utf8");
      if (/^draft:\s*true/m.test(md)) continue;
      if (!games.has(puzzle.game)) games.set(puzzle.game, []);
      games.get(puzzle.game).push({ slug, date: puzzle.date, runs: shingles(prose(md)) });
    }
  })(dir);
  for (const list of games.values()) list.sort((a, b) => a.date.localeCompare(b.date));
  return games;
}

/** { fails, older }: pages over SIMILAR_MAX against one of the previous LOOKBACK pages of their game. */
export function similarityProblems(dir) {
  const fails = [], older = [];
  for (const list of dailyPages(dir).values()) {
    list.forEach((page, i) => {
      let worst = { score: 0, slug: "" };
      for (const prev of list.slice(Math.max(0, i - LOOKBACK), i)) {
        const score = jaccard(page.runs, prev.runs);
        if (score > worst.score) worst = { score, slug: prev.slug };
      }
      if (worst.score < SIMILAR_MAX) return;
      const line = `${page.slug}: ${worst.score.toFixed(2)} of its three-word runs shared with ${worst.slug} (limit ${SIMILAR_MAX})`;
      (page.date >= SIMILAR_SINCE ? fails : older).push(line);
    });
  }
  return { fails, older };
}
