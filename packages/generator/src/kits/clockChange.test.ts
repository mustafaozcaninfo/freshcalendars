/** clock-change kit: validation, USNO lookup and refusal, computed clock faces and sun times, quote/src checks. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { clockChange } from "./clockChange.ts";
import { THEMES } from "./themes.ts";

const SRC = [
  { url: "https://www.congress.gov/", publisher: "Energy Policy Act" },
  { url: "https://aa.usno.navy.mil/", publisher: "U.S. Naval Observatory" },
];
const ctx = (publishedAt = "2026-10-20T09:00:00-04:00") => ({ storySlug: "s", category: "time-change", sources: SRC, theme: THEMES["time-change"]!, fonts: "", publishedAt });
const prn = { kit: "clock-change", slug: "x", group: "g", title: "Daylight Saving Time Ends Nov. 1, 2026", note: "Source: USNO", data: {} };

/** Real facts: clocks fell back at 2 a.m. (to 1 a.m.) on Nov. 1, 2026; spring forward March 14, 2027. */
const fallBack = () => ({
  change: { at: "2026-11-01T01:00-05:00", direction: "back", src: 1, quote: "clocks fell back one hour at 2 a.m. on Sunday, Nov. 1, 2026" },
  next: { at: "2027-03-14T03:00-04:00", src: 1, quote: "daylight saving time begins on March 14, 2027" },
  cities: [
    { city: "New York", tz: "America/New_York" },
    { city: "Los Angeles", tz: "America/Los_Angeles" },
  ],
  devices: ["Oven and microwave", "Car dashboard clock"],
  unconfirmed: [{ label: "State opt-out bills", why: "no state had changed its law by Oct. 20" }],
});

test("clock-change accepts a real fall-back fixture", () => {
  assert.doesNotThrow(() => clockChange.validate(fallBack(), ctx()));
});

test("clock-change refuses a change moment whose offset no zone uses at that instant", () => {
  const bad = (patch: Record<string, unknown>, re: RegExp) => assert.throws(() => clockChange.validate({ ...fallBack(), ...patch }, ctx()), re);
  // The 2:00 a.m. instant has no settled offset; -04:00 is not a real Eastern clock at that moment.
  bad({ change: { at: "2026-11-01T02:00-04:00", direction: "back", src: 1 } }, /not the clock of any/);
  bad({ change: { at: "2026-11-01T01:00-05:00", direction: "sideways", src: 1 } }, /direction/);
  bad({ change: { at: "2026-11-01T01:00-05:00", direction: "back", src: 7 } }, /not one of the story's 2 sources/);
});

test("clock-change reads USNO for the day before and after, and refuses what the file lacks", () => {
  const miss = (cities: unknown[], re: RegExp) => assert.throws(() => clockChange.validate({ ...fallBack(), cities }, ctx()), re);
  miss([{ city: "Gotham", tz: "America/New_York" }], /not in usno-2026-27\.json/);
  // Phoenix has no Nov. 2 record saved, so the day-after lookup refuses rather than guessing.
  miss([{ city: "Phoenix", tz: "America/Phoenix" }], /no 2026-11-02 in usno-2026-27\.json/);
  miss([{ city: "New York", tz: "Mars/Olympus" }], /tz must be an IANA zone/);
});

test("clock-change computes the clock faces and the sun times, and lists them in `computed`", () => {
  const sheet = clockChange.render(clockChange.validate(fallBack(), ctx()), prn, ctx());
  // Clocks fall back from 2 a.m. to 1 a.m. New York Oct. 31: sunrise 07:25, sunset 17:53; Nov. 2: 06:28, 16:51.
  for (const v of ["2 a.m.", "1 a.m.", "7:25 a.m.", "5:53 p.m.", "6:28 a.m.", "4:51 p.m."]) assert.ok(sheet.computed.includes(v), `computed should list ${v}`);
  // The before/after day labels are computed from the change date (Oct. 31 and Nov. 2).
  assert.ok(sheet.computed.some((v) => /Oct\. 31/.test(v)) && sheet.computed.some((v) => /Nov\. 2\b/.test(v)));
  assert.match(sheet.html, /Sunrise/);
  assert.equal((sheet.html.match(/<td class="ct">/g) ?? []).length, 2);
});

test("clock-change needs a source and a quote with the change date on a new story", () => {
  const c = ctx("2026-11-10T09:00:00-05:00");
  const noquote = fallBack(); delete (noquote.change as Record<string, unknown>).quote;
  assert.throws(() => clockChange.validate(noquote, c), /add quote/);
  const wrong = fallBack(); (wrong.change as Record<string, unknown>).quote = "clocks change at 2 a.m. on Nov. 8, 2026";
  assert.throws(() => clockChange.validate(wrong, c), /does not say Nov\. 1/);
  assert.doesNotThrow(() => clockChange.validate(fallBack(), c));
});

test("clock-change points to the next change in the opposite direction", () => {
  const sheet = clockChange.render(clockChange.validate(fallBack(), ctx()), prn, ctx());
  assert.match(sheet.html, /Next change[\s\S]*Mar\. 14[\s\S]*spring forward/);
});
