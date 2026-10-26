#!/usr/bin/env node
/**
 * Saves the official puzzle data for daily puzzle pages to apps/news/src/content/puzzles/<game>/<date>.json,
 * trimmed to the fields our pages use. The page checker (news-puzzle-check.mjs) and the solved-board
 * drawings (src/lib/puzzle-boards.mjs) read only these files, so CI never needs the network.
 *
 * Usage: node scripts/news-puzzle-data.mjs <from> [to] [--games wordle,connections,strands,pips,bee] [--force]
 *        node scripts/news-puzzle-data.mjs --pages     (every puzzle page in the repo that has no data yet)
 *
 * Requests go through curl, which honors HTTPS_PROXY. A date NYT has not published returns a
 * "not found" body; it is reported and skipped, never saved.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { GAMES, addDays, dataPath, puzzleOf } from "../apps/news/src/lib/puzzles.mjs";

const URL = {
  wordle: (d) => `https://www.nytimes.com/svc/wordle/v2/${d}.json`,
  connections: (d) => `https://www.nytimes.com/svc/connections/v2/${d}.json`,
  strands: (d) => `https://www.nytimes.com/svc/strands/v2/${d}.json`,
  pips: (d) => `https://www.nytimes.com/svc/pips/v1/${d}.json`,
  bee: (d) => `https://www.nytimes.com/svc/spelling-bee/v1/${d}.json`,
};

/** Only the fields the pages and checks use (Strands' full dictionary list is dropped). */
const TRIM = {
  wordle: (j) => ({ print_date: j.print_date, solution: j.solution, days_since_launch: j.days_since_launch, editor: j.editor }),
  connections: (j) => ({ print_date: j.print_date, editor: j.editor, categories: j.categories.map((c) => ({ title: c.title, cards: c.cards.map((x) => ({ content: x.content, position: x.position })) })) }),
  strands: (j) => ({ printDate: j.printDate, clue: j.clue, spangram: j.spangram, themeWords: j.themeWords, editor: j.editor, constructors: j.constructors, startingBoard: j.startingBoard, themeCoords: j.themeCoords, spangramCoords: j.spangramCoords }),
  pips: (j) => ({ printDate: j.printDate, editor: j.editor, ...Object.fromEntries(["easy", "medium", "hard"].map((k) => [k, { constructors: j[k].constructors, dominoes: j[k].dominoes, regions: j[k].regions, solution: j[k].solution }])) }),
  bee: (j) => ({ center_letter: j.center_letter, outer_letters: j.outer_letters, pangrams: j.pangrams, answers: j.answers }),
};

/** The data's own date, to make sure NYT answered for the day we asked about. */
const DATE_OF = { wordle: (j) => j.print_date, connections: (j) => j.print_date, strands: (j) => j.printDate, pips: (j) => j.printDate, bee: () => null };

function get(url) {
  // No --fail: an unpublished date answers 404 (Spelling Bee) or a 200 "404 page not found" body.
  const body = execFileSync("curl", ["-sS", "--max-time", "30", "-A", "Mozilla/5.0 (FreshCalendars puzzle data)", url], { encoding: "utf8" });
  try { return JSON.parse(body); } catch { return null; }
}

function save(game, date, force) {
  const out = dataPath(game, date);
  if (existsSync(out) && !force) return "kept";
  let j;
  try { j = get(URL[game](date)); } catch (e) { return `failed (${String(e.message).split("\n")[0]})`; }
  if (!j || j.status === "ERROR" || (game === "bee" ? !j.center_letter : !TRIM[game] || DATE_OF[game](j) !== date)) return "not published";
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(TRIM[game](j), null, 1)}\n`);
  return "saved";
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const gi = args.indexOf("--games");
const games = gi >= 0 ? args[gi + 1].split(",") : Object.keys(GAMES);
for (const g of games) if (!URL[g]) { console.error(`unknown game "${g}"; one of ${Object.keys(URL).join(", ")}`); process.exit(2); }

const jobs = [];
if (args.includes("--pages")) {
  const dir = path.resolve(import.meta.dirname, "../apps/news/src/content/articles");
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [e.name]));
  for (const f of walk(dir)) {
    const p = puzzleOf(f.replace(/\.mdx?$/, ""));
    if (p && games.includes(p.game)) jobs.push([p.game, p.date]);
  }
} else {
  const dates = args.filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  if (!dates.length) { console.error("usage: news-puzzle-data.mjs <from> [to] [--games a,b] [--force] | --pages"); process.exit(2); }
  for (let d = dates[0]; d <= (dates[1] ?? dates[0]); d = addDays(d, 1)) for (const g of games) jobs.push([g, d]);
}

let missing = 0;
for (const [g, d] of jobs) {
  const r = save(g, d, force);
  if (r !== "kept") console.log(`${d} ${g.padEnd(11)} ${r}`);
  if (r !== "saved" && r !== "kept") missing++;
}
console.log(`${jobs.length} checked, ${missing} not available`);
