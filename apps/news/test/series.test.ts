import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { it } from "node:test";
import { isPast, seriesKey, seriesNeighbors, storySpan } from "../src/lib/series.ts";
import { buildIndex, related } from "../src/lib/similarity.ts";
import { readRanking, trendingFor } from "../src/lib/trending.ts";

it("seriesKey joins the days of a dated series", () => {
  assert.equal(seriesKey("nba-games-today-november-1-2026"), "nba-games-today");
  assert.equal(seriesKey("wordle-hint-answer-today-november-2-2026-1962"), seriesKey("wordle-hint-answer-today-november-3-2026-1963"));
  assert.equal(seriesKey("nfl-week-9-schedule-2026-printable"), seriesKey("nfl-week-12-schedule-2026-printable"));
  assert.notEqual(seriesKey("nba-games-today-november-1-2026"), seriesKey("nhl-games-today-november-1-2026"));
});

it("storySpan reads days, ranges, months and key dates from a story", () => {
  assert.deepEqual(storySpan("nba-games-today-november-1-2026"), { start: "2026-11-01", end: "2026-11-01" });
  assert.deepEqual(storySpan("premier-league-fixtures-november-6-8-2026-gameweek-10"), { start: "2026-11-06", end: "2026-11-08" });
  assert.deepEqual(storySpan("snap-payment-schedule-december-2026-deposit-dates"), { start: "2026-12-01", end: "2026-12-31" });
  assert.deepEqual(storySpan("february-2027-calendar-printable"), { start: "2027-02-01", end: "2027-02-28" });
  // Key dates extend the span: the GTA 6 story is dated October 22 and reports a November launch.
  assert.deepEqual(storySpan("gta-6-october-22-2026-what-is-confirmed", ["2026-11-19"]), { start: "2026-10-22", end: "2026-11-19" });
  // "after November 1" starts a period; the story stays current.
  assert.equal(storySpan("us-brazil-time-difference-after-november-1-2026-sao-paulo-2-hours"), undefined);
  assert.equal(storySpan("veterans-day-free-meals-discounts"), undefined);
  assert.equal(storySpan("nfl-week-9-schedule-2026-printable"), undefined);
});

it("isPast is true only once every date of the story has gone by", () => {
  const span = storySpan("bayern-vs-dortmund-prediction-october-31-2026");
  assert.equal(isPast(span, "2026-10-31"), false);
  assert.equal(isPast(span, "2026-11-01"), true);
  assert.equal(isPast(undefined, "2030-01-01"), false);
});

it("seriesNeighbors orders a series by the date it covers", () => {
  const at = (day: number) => new Date(Date.UTC(2026, 9, day));
  const items = [
    // Published in a batch, out of order: the date in the slug decides.
    { id: "nba-games-today-november-2-2026", publishedAt: at(30) },
    { id: "nba-games-today-october-31-2026", publishedAt: at(30) },
    { id: "nba-games-today-november-1-2026", publishedAt: at(29) },
    { id: "nhl-games-today-november-1-2026", publishedAt: at(29) },
  ];
  const n = seriesNeighbors(items, "nba-games-today-november-1-2026", (id) => storySpan(id));
  assert.equal(n?.prev?.id, "nba-games-today-october-31-2026");
  assert.equal(n?.next?.id, "nba-games-today-november-2-2026");
  assert.equal(seriesNeighbors(items, "nhl-games-today-november-1-2026", (id) => storySpan(id)), undefined);
});

it("related honors allow and keeps one pick per group", () => {
  const doc = (id: string, title: string, day: number) => ({ id, title, description: title, keywords: [title], category: "sports", links: [], publishedAt: new Date(Date.UTC(2026, 9, day)) });
  const ix = buildIndex([
    doc("nba-games-today-november-1-2026", "NBA games today schedule", 1),
    doc("nba-games-today-november-2-2026", "NBA games today schedule", 2),
    doc("nba-games-today-november-3-2026", "NBA games today schedule", 3),
    doc("nba-season-schedule-2026", "NBA season schedule", 4),
    doc("nhl-games-today-november-1-2026", "NHL games today schedule", 5),
  ]);
  const key = seriesKey("nba-games-today-november-1-2026");
  const r = related(ix, "nba-games-today-november-1-2026", [], 4, () => 0, { allow: (c) => seriesKey(c) !== key, group: seriesKey });
  assert.ok(r.every((c) => seriesKey(c) !== key), "no story of the same series");
  assert.deepEqual([...r].sort(), ["nba-season-schedule-2026", "nhl-games-today-november-1-2026"]);
  // Without allow, the series fills one slot only.
  const g = related(ix, "nba-season-schedule-2026", [], 4, () => 0, { group: seriesKey });
  assert.equal(g.filter((c) => seriesKey(c) === key).length, 1);
});

it("trendingFor skips the page's own links, its series and repeats of a series", () => {
  const ranking = ["dst-ends", "wordle-hint-answer-today-november-1-2026-1961", "wordle-hint-answer-today-november-2-2026-1962", "unknown-page", "black-friday", "snap"];
  const t = trendingFor(ranking, (s) => s !== "unknown-page", (s) => s !== "snap", new Set(["black-friday"]), 5);
  assert.deepEqual(t, ["dst-ends", "wordle-hint-answer-today-november-1-2026-1961"]);
});

it("readRanking ignores a missing, broken or stale file", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "trend-"));
  const file = path.join(dir, "t.json");
  const now = new Date("2026-11-01T12:00:00Z");
  assert.deepEqual(readRanking(file, now), []);
  writeFileSync(file, "{");
  assert.deepEqual(readRanking(file, now), []);
  const pages = [{ path: "/news/dst-ends/", requests: 9 }, { path: "/news/category/sports/", requests: 5 }, { path: "/news/snap/", requests: 3 }];
  writeFileSync(file, JSON.stringify({ generatedAt: "2026-11-01T11:00:00Z", hours: 24, pages }));
  assert.deepEqual(readRanking(file, now), ["dst-ends", "snap"]);
  writeFileSync(file, JSON.stringify({ generatedAt: "2026-10-29T11:00:00Z", hours: 24, pages }));
  assert.deepEqual(readRanking(file, now), []);
});

it("storySpan reads full dates in the title, except period starts", () => {
  assert.deepEqual(storySpan("bayern-vs-dortmund-prediction-last-5-matches-where-to-watch-2026", [], "Bayern vs. Dortmund: Prediction, Last 5 Matches and Where to Watch on Oct. 31, 2026"), { start: "2026-10-31", end: "2026-10-31" });
  assert.deepEqual(storySpan("premier-league-weekend", [], "Premier League Fixtures Nov. 6-8, 2026: Kick-Off Times"), { start: "2026-11-06", end: "2026-11-08" });
  assert.equal(storySpan("arizona-time-after-november-1-2026", [], "Arizona Time After Nov. 1, 2026: Phoenix Is 1 Hour Ahead"), undefined);
  assert.equal(storySpan("christmas-markets", [], "Christmas Markets 30, 2026 Guide"), undefined);
});

it("seriesNeighbors orders an undated series by the numbers in its slugs", () => {
  const at = (day: number) => new Date(Date.UTC(2026, 9, day));
  const items = [9, 12, 10, 11].map((w, i) => ({ id: `nfl-week-${w}-schedule-2026-printable`, publishedAt: at(20 - i) }));
  const n = seriesNeighbors(items, "nfl-week-10-schedule-2026-printable", (id) => storySpan(id));
  assert.equal(n?.prev?.id, "nfl-week-9-schedule-2026-printable");
  assert.equal(n?.next?.id, "nfl-week-11-schedule-2026-printable");
});
