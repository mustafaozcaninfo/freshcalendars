import { test } from "node:test";
import assert from "node:assert/strict";
import { yearReference, isoWeek } from "./yearReference.ts";
import { THEMES } from "./themes.ts";

const kctx = (publishedAt = "2026-11-01T09:00:00-05:00") => ({ storySlug: "s", category: "calendar-guides", sources: [{ url: "https://a.gov/x", publisher: "A" }], theme: THEMES["calendar-guides"]!, fonts: "", publishedAt });
const prn = () => ({ kit: "year-reference", slug: "x", group: "g", title: "2027 Reference Calendar", note: "Source: engine", data: {} });

test("isoWeek numbers weeks by the year that owns their Thursday", () => {
  assert.equal(isoWeek(new Date(Date.UTC(2027, 0, 1))), 53); // Fri Jan 1, 2027 belongs to week 53 of 2026
  assert.equal(isoWeek(new Date(Date.UTC(2026, 11, 31))), 53); // the same week
  assert.equal(isoWeek(new Date(Date.UTC(2027, 0, 4))), 1); // the Monday after starts week 1 of 2027
  assert.equal(isoWeek(new Date(Date.UTC(2026, 0, 1))), 1); // Thu Jan 1, 2026 is week 1
  assert.equal(isoWeek(new Date(Date.UTC(2026, 11, 28))), 53); // Mon of the last 2026 ISO week
});

test("year-reference checks the year, mode, start and marks", () => {
  assert.doesNotThrow(() => yearReference.validate({ year: 2027, mode: "week-numbers" }, kctx()));
  assert.throws(() => yearReference.validate({ year: 2027, mode: "fortnights" }, kctx()), /mode: one of/);
  assert.throws(() => yearReference.validate({ year: 1800, mode: "day-of-year" }, kctx()), /four-digit year/);
  assert.throws(() => yearReference.validate({ year: 2027, mode: "days-left", start: "tuesday" }, kctx()), /monday or sunday/);
  const mark = (m: unknown, re: RegExp) => assert.throws(() => yearReference.validate({ year: 2027, mode: "week-numbers", marks: [m] }, kctx()), re);
  mark({ date: "2028-01-01", label: "X", src: 1 }, /is not in 2027/);
  mark({ date: "2027-02-30", label: "X", src: 1 }, /not a real date/);
  mark({ date: "2027-03-01", label: "X" }, /add src/);
});

test("year-reference computes the week-number gutter and lists the federal holidays", () => {
  const d = yearReference.validate({ year: 2027, mode: "week-numbers", start: "monday", federal: true }, kctx());
  const html = yearReference.render(d, prn(), kctx()).html;
  assert.match(html, /class="wn">53</); // January opens on ISO week 53
  assert.match(html, /class="wn">1</); // week 1 follows
  assert.match(html, /Christmas Day/); // a computed federal holiday, listed in the legend
  // Nothing on the grid reads as a date the story never gave: marks here are empty, so no computed dates.
  assert.deepEqual(yearReference.render(d, prn(), kctx()).computed, []);
});

test("year-reference needs a source and a date-bearing quote for each mark when required", () => {
  const ctx = kctx("2026-11-10T09:00:00-05:00");
  const mk = (quote?: string) => ({ year: 2027, mode: "day-of-year", marks: [{ date: "2027-04-15", label: "Taxes due", src: 1, ...(quote ? { quote } : {}) }] });
  assert.throws(() => yearReference.validate(mk(), ctx), /add quote/);
  assert.throws(() => yearReference.validate(mk("Taxes due Apr. 14"), ctx), /does not say Apr\. 15/);
  assert.doesNotThrow(() => yearReference.validate(mk("Federal returns due Apr. 15"), ctx));
  const d = yearReference.validate(mk("Federal returns due Apr. 15"), ctx);
  // The mark's computed weekday carries its date into `computed` for the audit.
  assert.ok(yearReference.render(d, prn(), ctx).computed.some((c) => /Apr\. 15/.test(c)));
});
