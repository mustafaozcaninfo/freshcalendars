import { test } from "node:test";
import assert from "node:assert/strict";
import { bankHolidays as K } from "./bankHolidays.ts";
import { THEMES } from "./themes.ts";

/** Published before QUOTE_SINCE (2026-11-04), so these fixtures need no quotes; the quote rule has its own test. */
const kctx = (publishedAt = "2026-11-01T09:00:00-05:00", paper?: "letter" | "a4") => ({
  storySlug: "s", category: "uk-canada", sources: [{ url: "https://a.gov/x", publisher: "A" }, { url: "https://b.gov/y", publisher: "B" }],
  theme: THEMES["uk-canada"]!, fonts: "", publishedAt, paper,
});
const p = { kit: "bank-holidays", slug: "x", group: "g", title: "UK Bank Holidays 2026", note: "Source: A", data: {} };

const ok = () => ({
  regions: ["England and Wales", "Scotland", "Northern Ireland"],
  holidays: [
    { name: "St Andrew's Day", dates: { "England and Wales": null, Scotland: "2026-11-30", "Northern Ireland": null }, src: 2 },
    { name: "Christmas Day", dates: { "England and Wales": "2026-12-25", Scotland: "2026-12-25", "Northern Ireland": "2026-12-25" }, src: 1 },
    { name: "Boxing Day", dates: { "England and Wales": "2026-12-28", Scotland: "2026-12-28", "Northern Ireland": "2026-12-28" }, substitute: true, src: 1 },
  ],
  unconfirmed: [{ label: "2027 dates", why: "GOV.UK had not published 2027 yet" }],
});

test("bank-holidays accepts a well-formed matrix", () => {
  assert.doesNotThrow(() => K.validate(ok(), kctx()));
});

test("bank-holidays refuses bad regions, unknown region keys and empty rows", () => {
  const bad = (patch: Record<string, unknown>, re: RegExp) => assert.throws(() => K.validate({ ...ok(), ...patch }, kctx()), re);
  bad({ regions: ["A", "A"] }, /names must differ/);
  bad({ regions: ["A", "B", "C", "D", "E", "F", "G"] }, /1 to 6 names/);
  bad({ holidays: [{ name: "X", dates: { Ontario: "2026-12-25" }, src: 1 }] }, /not one of the regions/);
  bad({ holidays: [{ name: "X", dates: { Scotland: null, "England and Wales": null, "Northern Ireland": null }, src: 1 }] }, /at least one region needs a date/);
  bad({ holidays: [{ name: "X", dates: { Scotland: "2026-02-30" }, src: 1 }] }, /not a real date/);
  bad({ holidays: [{ name: "X", dates: { Scotland: "2026-11-30" } }] }, /add src/);
});

test("bank-holidays computes weekday, date, counts and the substitute mark", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  // Christmas Day 2026 is a Friday; computed, not typed.
  assert.match(out.html, /Fri\., Dec\. 25/);
  // St Andrew's Day 2026 is a Monday in Scotland; "Not a holiday" in the other two regions.
  assert.match(out.html, /Mon\., Nov\. 30/);
  assert.match(out.html, /Not a holiday/);
  // England and Wales keeps 2 of the 3 holidays (not St Andrew's Day); Scotland keeps all 3.
  assert.match(out.html, /<b>2<\/b><span>holidays - England and Wales/);
  assert.match(out.html, /<b>3<\/b><span>holidays - Scotland/);
  // Boxing Day is a substitute day, so its cells carry the drawn diamond mark.
  assert.match(out.html, /class="sub"/);
});

test("bank-holidays lists unconfirmed items in words, not on the grid", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  assert.match(out.html, /Not yet confirmed/);
  assert.match(out.html, /2027 dates/);
  assert.doesNotMatch(out.html, /<td[^>]*>2027 dates/);
});

test("bank-holidays draws an A4 sheet at A4 size", () => {
  const out = K.render(K.validate(ok(), kctx()), { ...p, landscape: true }, kctx("2026-11-01T09:00:00-05:00", "a4"));
  assert.deepEqual(out.size, { width: 1123, height: 794 });
});

test("bank-holidays enforces the source quote once quotes are required", () => {
  const ctx = kctx("2026-11-10T09:00:00-05:00");
  const base = ok();
  assert.throws(() => K.validate(base, ctx), /add quote/);
  const quoted = {
    ...base,
    holidays: [
      { ...base.holidays[0], quote: "St Andrew's Day Monday 30 November 2026" },
      { ...base.holidays[1], quote: "Christmas Day Friday 25 December 2026" },
      { ...base.holidays[2], quote: "Boxing Day substitute day Monday 28 December 2026" },
    ],
  };
  assert.doesNotThrow(() => K.validate(quoted, ctx));
  // A quote that names the wrong day is caught.
  const wrong = { ...quoted, holidays: [{ ...base.holidays[0], quote: "St Andrew's Day Monday 29 November 2026" }, quoted.holidays[1], quoted.holidays[2]] };
  assert.throws(() => K.validate(wrong, ctx), /does not say Nov\. 30/);
});
