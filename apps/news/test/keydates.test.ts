import assert from "node:assert/strict";
import { it } from "node:test";
import { KEY_DATES, upcoming } from "../src/lib/keydates";

it("Coming up: a busy day keeps its weighted main events within the per-day cap", () => {
  const published = new Set(KEY_DATES.map((k) => k.slug));
  // Election Day 2026, noon in New York: 20 rows share the date and the home page shows two a day.
  const rows = upcoming(published, 6, new Date("2026-11-03T17:00:00Z"), 2);
  const today = rows.filter((k) => k.date === "2026-11-03").map((k) => k.label);
  assert.deepEqual(today, ["Election Day", "Polls close from 6 p.m. ET"]);
  assert.equal(rows.length, 6);
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1]!.date <= rows[i]!.date, "still soonest first");
});
