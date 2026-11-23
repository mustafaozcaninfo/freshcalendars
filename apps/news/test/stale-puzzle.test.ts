import assert from "node:assert/strict";
import { it } from "node:test";
import { isStaleDailyPuzzle, stalePuzzleAge } from "../src/lib/stale-puzzle.mjs";

const now = new Date("2026-11-23T12:00:00Z");
const page = (slug: string, publishedAt: string | Date, category = "puzzles") => ({ slug, category, publishedAt });

it("a daily puzzle page goes stale seven days after it was published", () => {
  assert.equal(isStaleDailyPuzzle(page("nyt-connections-hints-answers-november-17-2026-1255", "2026-11-16T00:05:00-05:00"), now), true);
  assert.equal(isStaleDailyPuzzle(page("nyt-connections-hints-answers-november-18-2026-1256", "2026-11-17T00:05:00-05:00"), now), false);
  assert.equal(isStaleDailyPuzzle(page("wordle-hint-answer-today-november-1-2026-1961", new Date("2026-10-31T04:05:00Z")), now), true);
});

it("roundups, hubs and other categories never go stale", () => {
  assert.equal(stalePuzzleAge(page("wordle-answers-october-2026-all-words", "2026-10-31T00:10:00-04:00"), now), null);
  assert.equal(stalePuzzleAge(page("past-wordle-answers-every-word-since-2021", "2026-10-20T00:10:00-04:00"), now), null);
  assert.equal(stalePuzzleAge(page("nba-games-today-november-2-2026", "2026-10-31T00:10:00-04:00", "sports"), now), null);
});

it("stalePuzzleAge reports how long ago the page went stale, for the audit's two-hour edge", () => {
  assert.equal(stalePuzzleAge(page("nyt-pips-hints-answers-november-17-2026", "2026-11-16T11:00:00Z"), now), 3_600_000);
});
