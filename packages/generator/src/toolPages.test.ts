import assert from "node:assert/strict";
import { test } from "node:test";
import { addMonths, countdownHolidays, isoWeek, monthsAndDays, observedFederalHolidays, toolPages, usWeek, weekdaysBetween } from "./toolPages.js";

const d = (y: number, m: number, day: number) => Date.UTC(y, m - 1, day);

test("weekdays between two dates leave out the start and count the end", () => {
  assert.equal(weekdaysBetween(d(2026, 1, 1), d(2026, 1, 31)), 21);
  assert.equal(weekdaysBetween(d(2026, 11, 12), d(2026, 12, 25)), 31);
  assert.equal(weekdaysBetween(d(2026, 11, 13), d(2026, 11, 16)), 1);
});

test("month arithmetic clamps to the month's last day", () => {
  assert.equal(addMonths(d(2027, 1, 31), 1), d(2027, 2, 28));
  assert.equal(addMonths(d(2028, 2, 29), 12), d(2029, 2, 28));
  assert.equal(addMonths(d(2026, 3, 31), -1), d(2026, 2, 28));
  assert.deepEqual(monthsAndDays(d(2026, 3, 15), d(2026, 5, 20)), [2, 5]);
  assert.deepEqual(monthsAndDays(d(2026, 1, 1), d(2026, 1, 31)), [0, 30]);
});

test("ISO and US week numbers", () => {
  assert.deepEqual(isoWeek(d(2026, 11, 12)), { week: 46, year: 2026 });
  assert.deepEqual(isoWeek(d(2027, 1, 1)), { week: 53, year: 2026 });
  assert.deepEqual(isoWeek(d(2027, 1, 4)), { week: 1, year: 2027 });
  assert.equal(usWeek(d(2027, 1, 1)), 1);
  assert.equal(usWeek(d(2026, 12, 31)), 53);
});

test("federal holidays move to the observed weekday", () => {
  const map = observedFederalHolidays(2027, 2028);
  // New Year's Day 2028 is a Saturday, observed Friday, Dec. 31, 2027.
  assert.equal(map["2027-12-31"], "New Year's Day");
  // Independence Day 2027 is a Sunday, observed Monday, July 5.
  assert.equal(map["2027-07-05"], "Independence Day");
  assert.equal(Object.keys(observedFederalHolidays(2026, 2026)).length, 11);
});

test("every countdown page has a unique path and a title of 60 characters or fewer", () => {
  const pages = toolPages(new Date(2026, 10, 12), { volatile: (s) => s, holidayMonthBlock: () => "" });
  assert.equal(new Set(pages.map((p) => p.path)).size, pages.length);
  assert.equal(pages.length, countdownHolidays().length + 8);
  for (const p of pages) {
    assert.ok(p.title.length <= 60, p.title);
    assert.ok(p.description.length >= 110 && p.description.length <= 160, `${p.id}: ${p.description.length}`);
  }
  const xmas = pages.find((p) => p.id === "days-until-christmas-day")!;
  assert.match(xmas.body, /<b data-du="2026-12-25">43<\/b>/);
});
