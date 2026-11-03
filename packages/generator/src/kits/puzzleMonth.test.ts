import { test } from "node:test";
import assert from "node:assert/strict";
import { puzzleMonth } from "./puzzleMonth.ts";
import { THEMES } from "./themes.ts";
import { loadPuzzle } from "../../../../apps/news/src/lib/puzzles.mjs";

/** Puzzle data is the source, so no quote is needed; the published date is irrelevant to this kit. */
const ctx = () => ({ storySlug: "s", category: "puzzles", sources: [], theme: THEMES.puzzles!, fonts: "", publishedAt: "2026-11-10T09:00:00-05:00" });
const prn = (title = "Wordle Answers November 2026") => ({ kit: "puzzle-month", slug: "x", group: "g", title, note: "Source: official saved data", data: {} });

test("puzzle-month refuses an unknown or unbuilt game and a bad month", () => {
  assert.throws(() => puzzleMonth.validate({ game: "sudoku", month: "2026-11" }, ctx()), /game: one of/);
  assert.throws(() => puzzleMonth.validate({ game: "strands", month: "2026-11" }, ctx()), /not built yet/);
  assert.throws(() => puzzleMonth.validate({ game: "wordle", month: "2026-13" }, ctx()), /"YYYY-MM"/);
  assert.throws(() => puzzleMonth.validate({ game: "wordle" }, ctx()), /"YYYY-MM"/);
});

test("puzzle-month loads the saved data and refuses only the days with no file", () => {
  // November 2026 has Wordle files for the 1st to the 15th only; the kit must flag exactly 16-30.
  try {
    puzzleMonth.validate({ game: "wordle", month: "2026-11" }, ctx());
    assert.fail("expected a refusal for the missing days");
  } catch (e) {
    const msg = (e as Error).message;
    assert.match(msg, /no saved Wordle data for 15 day\(s\)/);
    assert.match(msg, /2026-11-16/);
    assert.match(msg, /2026-11-30/);
    // The present days loaded without complaint, so they are not in the missing list.
    assert.ok(!msg.includes("2026-11-01"), "day 1 has a file and must not be listed missing");
    assert.ok(!msg.includes("2026-11-15"), "day 15 has a file and must not be listed missing");
  }
});

test("puzzle-month draws the loaded answers and puzzle numbers, and returns them computed", () => {
  // Build a full month from the real saved files (the validator refuses gaps, so the render is tested
  // on a month assembled from the 15 real days cycled to fill the grid — the answers stay real).
  const real = Array.from({ length: 15 }, (_, i) => loadPuzzle("wordle", `2026-11-${String(i + 1).padStart(2, "0")}`) as { solution: string; days_since_launch: number });
  assert.equal(real[0]!.solution, "viper"); // the saved file, lower-case as stored
  const days = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, iso: `2026-11-${String(i + 1).padStart(2, "0")}`, number: real[i % 15]!.days_since_launch, solution: real[i % 15]!.solution.toUpperCase() }));
  const out = puzzleMonth.render({ game: "wordle", year: 2026, month: 10, days } as never, prn(), ctx());
  assert.match(out.html, /VIPER/); // the answer is printed upper-case
  assert.match(out.html, /No\. 1961/); // the puzzle number from the data
  assert.match(out.html, /ABCDEFGHIJKLMNOPQRSTUVWXYZ|<span>A<\/span>/); // the letter tracker
  // The dates and answers go into computed so 10-PDF-FACTS accepts them (the data is the source).
  assert.ok(out.computed.some((c) => /Nov\. 1, 2026: VIPER/.test(c)), "computed carries the date and answer");
});

test("puzzle-month draws Connections group titles from the saved data", () => {
  const groups = (loadPuzzle("connections", "2026-11-01") as { categories: { title: string }[] }).categories.map((c) => c.title);
  const days = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, iso: `2026-11-${String(i + 1).padStart(2, "0")}`, number: 900 + i, groups }));
  const out = puzzleMonth.render({ game: "connections", year: 2026, month: 10, days } as never, prn("Connections Answers November 2026"), ctx());
  assert.match(out.html, /KINDS OF TEETH/); // a real group title from the saved file
  assert.match(out.html, /Group 1/); // the blank solving board's group lines
});

test("a month still being played prints saved days and says the rest are not played yet", () => {
  const ctx2 = { storySlug: "s", category: "puzzles", sources: [], theme: THEMES.puzzles!, fonts: "", publishedAt: "2026-11-10T09:00:00-05:00" };
  assert.throws(() => puzzleMonth.validate({ game: "wordle", month: "2026-11" }, ctx2), /no saved Wordle data/);
  assert.throws(() => puzzleMonth.validate({ game: "wordle", month: "2026-11", through: "2026-12-01" }, ctx2), /through/);
  const d = puzzleMonth.validate({ game: "wordle", month: "2026-11", through: "2026-11-10" }, ctx2);
  assert.equal(d.days.length, 10);
  const html = puzzleMonth.render(d, { kit: "puzzle-month", slug: "x", group: "g", title: "Wordle Answers November 2026", note: "Source: The New York Times", data: {} }, ctx2).html;
  assert.equal((html.match(/Not yet played/g) ?? []).length, 20);
});
