/**
 * Daily puzzle pages: which game a story slug belongs to, the puzzle number for a date, and the
 * official puzzle data we keep for it in src/content/puzzles/<game>/<YYYY-MM-DD>.json.
 * Plain JS so the rehype plugin (astro.config.mjs), scripts/news-puzzle-data.mjs and
 * scripts/news-puzzle-check.mjs share one copy. See .claude/skills/news-puzzles/SKILL.md.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PUZZLE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../content/puzzles");

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const DAY = 86_400_000;

/**
 * Games with dated official data. `prefix` is the slug before "<month>-<day>-<year>"; `first` is
 * the date of puzzle #1 where the number is counted one per day (Wordle's comes from its data).
 */
export const GAMES = {
  wordle: { prefix: "wordle-hint-answer-today", name: "Wordle", hub: "wordle" },
  connections: { prefix: "nyt-connections-hints-answers", name: "Connections", hub: "nyt-connections", first: "2023-06-12" },
  strands: { prefix: "nyt-strands-hints-answers", name: "Strands", hub: "nyt-strands", first: "2024-03-04" },
  pips: { prefix: "nyt-pips-hints-answers", name: "Pips", hub: "nyt-pips" },
  bee: { prefix: "nyt-spelling-bee-hints-answers", name: "Spelling Bee", hub: "nyt-spelling-bee" },
  // NYT serves only the current Mini, so its data is saved from the day it is written; pages dated
  // before `since` were written before saving started and have no data to check against.
  mini: { prefix: "nyt-mini-crossword-answers", name: "Mini Crossword", hub: "nyt-mini-crossword", since: "2026-10-27" },
};

/** { game, date: "YYYY-MM-DD", number } for a daily puzzle slug, or null for any other story. */
export function puzzleOf(slug) {
  for (const [game, g] of Object.entries(GAMES)) {
    const m = slug.match(new RegExp(`^${g.prefix}-(${MONTHS.join("|")})-(\\d{1,2})-(\\d{4})(?:-(\\d+))?$`));
    if (!m) continue;
    const date = `${m[3]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    return { game, date, number: m[4] ? Number(m[4]) : null };
  }
  return null;
}

/** The slug date written the way slugs spell it: "november-10-2026". */
export const slugDate = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return `${MONTHS[m - 1]}-${d}-${y}`;
};

export const addDays = (date, n) => new Date(Date.parse(`${date}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** Weekday name of a YYYY-MM-DD date. */
export const weekday = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

/** The public puzzle number for a date, from the data (Wordle) or by counting days (Connections, Strands). */
export function puzzleNumber(game, date, data) {
  if (game === "wordle") return data?.days_since_launch ?? null;
  const first = GAMES[game].first;
  return first ? Math.round((Date.parse(date) - Date.parse(first)) / DAY) + 1 : null;
}

export const dataPath = (game, date) => path.join(PUZZLE_DIR, game, `${date}.json`);

/** The stored official data for a game and date, or null when it was not saved. */
export function loadPuzzle(game, date) {
  const p = dataPath(game, date);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

/** Spelling Bee score: 1 point for a four-letter word, one per letter above that, +7 per pangram. */
export function beeScore(bee) {
  const words = [...bee.answers, ...bee.pangrams];
  const total = words.reduce((s, w) => s + (w.length === 4 ? 1 : w.length), 0) + 7 * bee.pangrams.length;
  return { words: words.length, total, genius: Math.round((total * 7) / 10) };
}

/** Value of every Pips cell ("r,c" zero-based) from the data's dominoes and their placements. */
export function pipsValues(level) {
  const v = new Map();
  level.dominoes.forEach(([a, b], i) => {
    const [c1, c2] = level.solution[i];
    v.set(c1.join(","), a);
    v.set(c2.join(","), b);
  });
  return v;
}

/** Whether a Pips region's condition holds for the given cell values. */
export function pipsRegionOk(region, values) {
  const v = region.indices.map((c) => values.get(c.join(",")));
  const sum = v.reduce((a, b) => a + b, 0);
  switch (region.type) {
    case "sum": return sum === region.target;
    case "less": return sum < region.target;
    case "greater": return sum > region.target;
    case "equals": return new Set(v).size === 1;
    case "unequal": return new Set(v).size === v.length;
    case "empty": return true;
    default: throw new Error(`unknown Pips region type "${region.type}"`);
  }
}
