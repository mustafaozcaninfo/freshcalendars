import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gameName, puzzleDate, puzzleRows, shortDate } from "../src/lib/puzzle-hub.ts";

describe("puzzle hub table", () => {
  it("reads the day from daily page slugs only", () => {
    assert.equal(puzzleDate("wordle-hint-answer-today-november-9-2026-1969"), "2026-11-09");
    assert.equal(puzzleDate("nyt-pips-hints-answers-october-31-2026"), "2026-10-31");
    assert.equal(puzzleDate("linkedin-games-answers-today-october-31-2026-queens-tango-zip"), "2026-10-31");
    assert.equal(puzzleDate("wordle-answers-october-2026-all-words"), null);
    assert.equal(puzzleDate("wordle-answers-2026-full-list-repeat-answers"), null);
  });

  it("takes the game from the title head, never the answers after the colon", () => {
    assert.equal(gameName("NYT Connections Hints and Answers for Monday, Nov. 9, 2026 (#1247): Schemes, Jeans, Sharp Edges and Sea Life"), "NYT Connections");
    assert.equal(gameName("NYT Connections: Sports Edition Hints and Answers for Friday, Oct. 30, 2026 (#767)"), "NYT Connections: Sports Edition");
    assert.equal(gameName("Wordle Hints and Answer Today, #1969 for Monday, Nov. 9, 2026: Six Clues Before the Reveal"), "Wordle");
    assert.equal(gameName("LinkedIn Games Answers, Saturday, Oct. 31, 2026: Queens, Tango, Zip, Pinpoint, Crossclimb"), "LinkedIn Games");
  });

  it("lists daily pages newest first with their numbers and skips other stories", () => {
    const rows = puzzleRows([
      { id: "nyt-connections-hints-answers-october-30-2026-1247", title: "NYT Connections Hints and Answers for Friday, Oct. 30, 2026 (#1247): Sea Life" },
      { id: "nyt-connections-sports-edition-hints-answers-october-30-2026-767", title: "NYT Connections: Sports Edition Hints and Answers for Friday, Oct. 30, 2026 (#767)" },
      { id: "nyt-connections-hints-answers-october-31-2026-1248", title: "NYT Connections Hints and Answers for Saturday, Oct. 31, 2026 (#1248): Groups" },
      { id: "connections-answers-october-2026", title: "Connections Answers for October 2026" },
      { id: "nyt-pips-hints-answers-october-31-2026", title: "NYT Pips Hints and Answers for Saturday, Oct. 31, 2026: Domino Placements" },
    ]);
    assert.deepEqual(rows.map((r) => [r.date, r.game, r.number]), [
      ["2026-10-31", "NYT Connections", 1248],
      ["2026-10-31", "NYT Pips", null],
      ["2026-10-30", "NYT Connections", 1247],
      ["2026-10-30", "NYT Connections: Sports Edition", 767],
    ]);
  });

  it("writes dates in AP style", () => {
    assert.equal(shortDate("2026-10-31"), "Sat., Oct. 31, 2026");
    assert.equal(shortDate("2026-09-01"), "Tue., Sept. 1, 2026");
    assert.equal(shortDate("2026-06-05"), "Fri., June 5, 2026");
  });
});
