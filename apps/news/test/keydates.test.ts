import assert from "node:assert/strict";
import { it } from "node:test";
import { KEY_DATES, dayScore, upcoming } from "../src/lib/keydates";

const published = new Set(KEY_DATES.map((k) => k.slug));
/** The two rows "Coming up" keeps for `date`, as on that day at noon in New York. */
const shown = (date: string, ranking: string[] = []) =>
  upcoming(published, 200, new Date(`${date}T17:00:00Z`), 2, ranking).filter((k) => k.date === date).map((k) => k.label);

it("Coming up: a busy day keeps its main event, found from the holiday rules and the label", () => {
  // Election Day 2026 has 19 rows; before the ranking the file order kept a lottery draw and a cricket match.
  assert.deepEqual(shown("2026-11-03"), ["Election Day", "Polls close from 6 p.m. ET"]);
  assert.equal(shown("2026-11-11")[0], "Veterans Day");
  assert.equal(shown("2026-11-26")[0], "Thanksgiving");
  // A US holiday row about another country ranks below the US ones.
  assert.ok(!shown("2026-11-27").includes("Black Friday in Canada"));
});

it("Coming up: readers' ranking decides between rows that name the same event; weight lifts an unnamed one", () => {
  const thanksgiving = KEY_DATES.filter((k) => k.date === "2026-11-26");
  const parade = thanksgiving.find((k) => k.label.startsWith("100th Macy's"))!;
  const trots = thanksgiving.find((k) => k.label.startsWith("Thanksgiving turkey trots"))!;
  assert.ok(dayScore(trots) > dayScore(parade), "starts with the name beats a mention");
  assert.ok(dayScore(parade, [parade.slug]) > dayScore(trots, [parade.slug]), "most-read story wins the mention tie");
  assert.equal(shown("2026-12-31")[0], "Times Square ball drop, 11:59 p.m. ET");
});

it("Coming up: days stay soonest first and the per-day cap holds", () => {
  const rows = upcoming(published, 12, new Date("2026-11-03T17:00:00Z"), 2, []);
  assert.equal(rows.length, 12);
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1]!.date <= rows[i]!.date);
  const perDay = new Map<string, number>();
  for (const r of rows) perDay.set(r.date, (perDay.get(r.date) ?? 0) + 1);
  assert.ok([...perDay.values()].every((n) => n <= 2));
});
