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
/** Writers aim under this; pages from SIMILAR_SINCE between it and SIMILAR_MAX are reported as drifting. */
export const SIMILAR_TARGET = 0.25;
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

const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
/** Game and date of a daily puzzle page outside puzzleOf's games: "<game>-<month>-<d>-<yyyy>[-...]". */
function otherDaily(slug) {
  const m = new RegExp(`^(.+?)-(${MONTH_NAMES.join("|")})-(\\d{1,2})-(\\d{4})(?:-.+)?$`).exec(slug);
  return m ? { game: m[1], date: `${m[4]}-${String(MONTH_NAMES.indexOf(m[2]) + 1).padStart(2, "0")}-${m[3].padStart(2, "0")}` } : null;
}

/** Every daily puzzle page in the articles tree, grouped by game and sorted by puzzle date. */
function dailyPages(dir) {
  const games = new Map();
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!f.endsWith(".md")) continue;
      const slug = f.slice(0, -3);
      const md = readFileSync(p, "utf8");
      // Games with official data (puzzleOf) and every other daily puzzle page (Quordle, Blossom,
      // Sports Edition, LinkedIn...): category puzzles with a day in the slug; monthly roundups
      // have no day and are left out.
      const puzzle = puzzleOf(slug) ?? (/^category:\s*"?puzzles"?\s*$/m.test(md) ? otherDaily(slug) : null);
      if (!puzzle) continue;
      if (/^draft:\s*true/m.test(md)) continue;
      if (!games.has(puzzle.game)) games.set(puzzle.game, []);
      const body = md.split(/^---$/m).slice(2).join("---");
      const publishedAt = /^publishedAt:\s*"?([^"\n]+)/m.exec(md)?.[1] ?? "";
      games.get(puzzle.game).push({ slug, date: puzzle.date, body, publishedAt, runs: shingles(prose(md)), noindex: /^noindex:\s*true/m.test(md) });
    }
  })(dir);
  for (const list of games.values()) list.sort((a, b) => a.date.localeCompare(b.date));
  return games;
}

/**
 * The page model, checked on structure rather than wording (owner, 2026-11-05): from SIMILAR_SINCE on
 * a daily page carries no rules section (how each game works lives once on its hub) and links the
 * hub's rules in its text (`#how-it-works`). A page that fails either was written from the old model.
 */
const RULES_H2 = /^##\s+How\s+(?:to play\b|(?:the game|the \w+|Pips|Wordle|Connections|Strands|Spelling Bee|Letter Boxed|Contexto|Waffle|Quordle)\s+works\s*$)/im;

/** Old-model pages for puzzle dates from SIMILAR_SINCE on: a rules section, or no link to the hub's rules. */
export function modelProblems(dir) {
  const fails = [];
  // topics.ts sits next to the articles in a full checkout; the watchdog reads a sparse copy of
  // the articles only, so fall back to this script's own checkout.
  const topicsFile = [path.join(dir, "../../lib/topics.ts"), path.join(import.meta.dirname, "../../apps/news/src/lib/topics.ts")].find((f) => { try { return statSync(f).isFile(); } catch { return false; } });
  const topics = topicsFile ? readFileSync(topicsFile, "utf8") : "";
  const guides = topicsFile ? new Set([...topics.matchAll(/slug: "([a-z0-9-]+)",[^{}]*?guide: \{/g)].map((m) => m[1])) : null;
  for (const list of dailyPages(dir).values()) {
    for (const page of list) {
      if (page.date < SIMILAR_SINCE) continue;
      const rules = page.body.match(RULES_H2)?.[0].trim();
      if (rules) fails.push(`${page.slug}: rules section "${rules}" on a daily page; link the hub's #how-it-works instead`);
      else if (!page.body.includes("#how-it-works")) fails.push(`${page.slug}: no link to the hub's rules (#how-it-works)`);
      // A page goes live the day before its puzzle (or the same day). One published days earlier
      // links to neighbours that are not live yet and breaks the link check on main (Nov. 5, 2026).
      const pub = page.publishedAt.slice(0, 10), earliest = new Date(Date.parse(`${page.date}T12:00:00Z`) - 2 * 864e5).toISOString().slice(0, 10);
      if (pub && pub < earliest) fails.push(`${page.slug}: publishedAt ${pub} is more than 2 days before the puzzle date ${page.date}; use 12:05 a.m. ET the day before`);
      // The link must land on a rules section: the hub needs a `guide` in topics.ts.
      for (const [, hub] of page.body.matchAll(/\/news\/topic\/([a-z0-9-]+)\/#how-it-works/g))
        if (guides && !guides.has(hub)) fails.push(`${page.slug}: links /news/topic/${hub}/#how-it-works, but that hub has no rules section (add a guide in apps/news/src/lib/topics.ts)`);
    }
  }
  return fails;
}

/** Per game, from `today` (YYYY-MM-DD) on: how many pages exist and the last puzzle date written. */
export function queueAhead(dir, today) {
  return [...dailyPages(dir)].map(([game, list]) => {
    const ahead = list.filter((p) => p.date >= today);
    return { game, ahead: ahead.length, last: list.at(-1)?.date ?? "" };
  }).sort((a, b) => a.game.localeCompare(b.game));
}

/** { fails, older }: pages over SIMILAR_MAX against one of the previous LOOKBACK pages of their game. */
export function similarityProblems(dir) {
  const fails = [], older = [], near = [];
  for (const list of dailyPages(dir).values()) {
    list.forEach((page, i) => {
      let worst = { score: 0, slug: "" };
      for (const prev of list.slice(Math.max(0, i - LOOKBACK), i)) {
        const score = jaccard(page.runs, prev.runs);
        if (score > worst.score) worst = { score, slug: prev.slug };
      }
      const line = `${page.slug}: ${worst.score.toFixed(2)} of its three-word runs shared with ${worst.slug} (limit ${SIMILAR_MAX})`;
      if (worst.score < SIMILAR_TARGET) return;
      if (worst.score < SIMILAR_MAX) { if (page.date >= SIMILAR_SINCE) near.push(line); return; }
      // An older page kept out of the index (merged, see docs/PUZZLES.md) no longer counts.
      if (page.date >= SIMILAR_SINCE) fails.push(line); else if (!page.noindex) older.push(line);
    });
  }
  return { fails, older, near };
}
