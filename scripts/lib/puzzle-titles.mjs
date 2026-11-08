/**
 * One title formula per daily puzzle game (owner decision 2026-11-07; since 2026-11-08 it is the
 * headline itself, because the H1 is the <title>). Search Console shows
 * readers type the full month name ("connections 30 october 2026" outdraws "connections nov 1
 * 2026") and the puzzle number ("connections 1237"), and the top results all carry "hints and
 * answers" with the date. So every daily page's <title> is the game, its number, what the page
 * gives, "Today" and the date with the month spelled out, the first candidate that fits in 60
 * characters. Audit 13-PUZZLE-TITLE checks it from TITLE_SINCE on; `node scripts/news-puzzle-titles.mjs`
 * writes it into scheduled pages.
 */
export const TITLE_SINCE = "2026-11-09";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Name, whether its number goes in the title, and what the page gives, per slug prefix. */
const GAMES = {
  "wordle-hint-answer-today": { name: "Wordle", num: true, gives: "Hints & Answer" },
  "nyt-connections-hints-answers": { name: "Connections", num: true, gives: "Hints & Answers" },
  "nyt-connections-sports-edition-hints-answers": { name: "Connections Sports Edition", num: true, gives: "Hints & Answers" },
  "nyt-strands-hints-answers": { name: "Strands", num: true, gives: "Hints & Answers" },
  "nyt-spelling-bee-hints-answers": { name: "Spelling Bee", num: false, gives: "Hints & Answers" },
  "nyt-pips-hints-answers": { name: "NYT Pips", num: false, gives: "Hints & Answers" },
  "nyt-letter-boxed-answer-hints": { name: "Letter Boxed", num: false, gives: "Hints & Answer" },
  "nyt-mini-crossword-answers": { name: "NYT Mini Crossword", num: false, gives: "Answers" },
  "nyt-midi-crossword-answers": { name: "NYT Midi Crossword", num: false, gives: "Answers" },
  "nyt-crossword-answers": { name: "NYT Crossword", num: false, gives: "Answers" },
  "contexto-answer-hints": { name: "Contexto", num: true, gives: "Hints & Answer" },
  "waffle-answer-hints-today": { name: "Waffle", num: true, gives: "Hints & Answers" },
  "quordle-hints-answers": { name: "Quordle", num: true, gives: "Hints & Answers" },
  "blossom-word-game-answers": { name: "Blossom", num: false, gives: "Hints & Answers" },
  "linkedin-games-answers-today": { name: "LinkedIn Queens, Tango & Zip", num: false, gives: "Answers" },
};
const SLUG = /^(.+?)-(january|february|march|april|may|june|july|august|september|october|november|december)-(\d{1,2})-(\d{4})(?:-(\d+))?(?:-[a-z-]+)?$/;

/** Game prefix, puzzle date (YYYY-MM-DD) and number of a daily puzzle slug, or null. */
export function parseDaily(slug) {
  const m = SLUG.exec(slug);
  if (!m || !GAMES[m[1]]) return null;
  const month = MONTHS.findIndex((x) => x.toLowerCase() === m[2]);
  return { prefix: m[1], date: `${m[4]}-${String(month + 1).padStart(2, "0")}-${m[3].padStart(2, "0")}`, number: m[5] ? Number(m[5]) : null };
}

/** The title (H1 and <title>) a daily puzzle page must carry, or null for a slug that is not a daily page. */
export function puzzleSeoTitle(slug) {
  const p = parseDaily(slug);
  if (!p) return null;
  const g = GAMES[p.prefix];
  const [y, mo, d] = p.date.split("-").map(Number);
  const date = `${MONTHS[mo - 1]} ${d}, ${y}`;
  const name = g.num && p.number ? `${g.name} #${p.number}` : g.name;
  const candidates = [
    `${name} ${g.gives} Today, ${date}`,
    `${name} ${g.gives}, ${date}`,
    `${name} Answers, ${date}`,
    `${g.name} ${g.gives}, ${date}`,
  ];
  return candidates.find((t) => t.length <= 60) ?? candidates.at(-1).slice(0, 60);
}
