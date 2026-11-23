import { describe, expect, it } from "vitest";
import { isStaleDailyPuzzle, stalePuzzleAge } from "../src/lib/stale-puzzle.mjs";

const now = new Date("2026-11-23T12:00:00Z");
const page = (slug: string, publishedAt: string, category = "puzzles") => ({ slug, category, publishedAt });

describe("stale daily puzzle pages", () => {
  it("a daily page goes stale seven days after it was published", () => {
    expect(isStaleDailyPuzzle(page("nyt-connections-hints-answers-november-17-2026-1255", "2026-11-16T00:05:00-05:00"), now)).toBe(true);
    expect(isStaleDailyPuzzle(page("nyt-connections-hints-answers-november-18-2026-1256", "2026-11-17T00:05:00-05:00"), now)).toBe(false);
    expect(isStaleDailyPuzzle(page("wordle-hint-answer-today-november-1-2026-1961", new Date("2026-10-31T04:05:00Z") as unknown as string), now)).toBe(true);
  });
  it("roundups, hubs and other categories never go stale", () => {
    expect(stalePuzzleAge(page("wordle-answers-october-2026-all-words", "2026-10-31T00:10:00-04:00"), now)).toBeNull();
    expect(stalePuzzleAge(page("past-wordle-answers-every-word-since-2021", "2026-10-20T00:10:00-04:00"), now)).toBeNull();
    expect(stalePuzzleAge(page("nba-games-today-november-2-2026", "2026-10-31T00:10:00-04:00", "sports"), now)).toBeNull();
  });
  it("reports how long ago the page went stale, for the audit's two-hour edge", () => {
    expect(stalePuzzleAge(page("nyt-pips-hints-answers-november-17-2026", "2026-11-16T11:00:00Z"), now)).toBe(3_600_000);
  });
});
