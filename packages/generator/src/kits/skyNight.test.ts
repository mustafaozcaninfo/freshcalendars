/** sky-night kit: validation, USNO lookup and refusal, computed times, quote/src checks, unconfirmed in words. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { skyNight } from "./skyNight.ts";
import { THEMES } from "./themes.ts";

const SRC = [
  { url: "https://amsmeteors.org/calendar/", publisher: "American Meteor Society" },
  { url: "https://aa.usno.navy.mil/", publisher: "U.S. Naval Observatory" },
  { url: "https://science.nasa.gov/", publisher: "NASA" },
];
const ctx = (publishedAt = "2026-11-01T09:00:00-05:00") => ({ storySlug: "s", category: "sky-events", sources: SRC, theme: THEMES["sky-events"]!, fonts: "", publishedAt });
const prn = { kit: "sky-night", slug: "x", group: "g", title: "Geminid Meteor Shower 2026: Viewing Log", note: "Source: AMS, USNO, NASA", data: {} };

/** Real facts: the 2026 Geminid peak (AMS: night of Dec. 13-14), USNO Moon and Sun times for two cities. */
const geminid = () => ({
  event: "Geminid meteor shower",
  peak: { from: "2026-12-13T22:00-05:00", to: "2026-12-14T06:00-05:00", src: 1, quote: "the 2026 Geminid peak as the night of Dec. 13-14" },
  rate: { text: "40 to 50 meteors an hour in dark skies", src: 3, quote: "40 to 50 Geminids per hour in dark skies" },
  look: { direction: "SE", altitude: "two-thirds up", src: 3, quote: "look toward the southeast before dawn" },
  cities: [
    { city: "New York", tz: "America/New_York", date: "2026-12-13" },
    { city: "Chicago", tz: "America/Chicago", date: "2026-12-13" },
  ],
  unconfirmed: [{ label: "Peak hour", why: "NASA has not published an official peak hour" }],
});

test("sky-night accepts a real meteor-shower fixture", () => {
  assert.doesNotThrow(() => skyNight.validate(geminid(), ctx()));
});

test("sky-night refuses bad peak windows, offsets and unknown sources", () => {
  const bad = (patch: Record<string, unknown>, re: RegExp) => assert.throws(() => skyNight.validate({ ...geminid(), ...patch }, ctx()), re);
  bad({ peak: { from: "2026-12-14T06:00-05:00", to: "2026-12-13T22:00-05:00", src: 1 } }, /to must be after from/);
  // Daylight saving time ended Nov. 1, 2026, so -04:00 on a December date is an hour off.
  bad({ peak: { from: "2026-12-13T22:00-04:00", to: "2026-12-14T06:00-05:00", src: 1 } }, /Eastern Time is -05:00/);
  bad({ peak: { from: "2026-12-13T22:00-05:00", to: "2026-12-14T06:00-05:00", src: 9 } }, /not one of the story's 3 sources/);
  bad({ peak: { from: "not-a-moment", to: "2026-12-14T06:00-05:00", src: 1 } }, /ISO moment with its offset/);
});

test("sky-night reads USNO by city and date, and refuses what the file does not have", () => {
  const miss = (cities: unknown[], re: RegExp) => assert.throws(() => skyNight.validate({ ...geminid(), cities }, ctx()), re);
  miss([{ city: "Gotham", tz: "America/New_York", date: "2026-12-13" }], /not in usno-2026-27\.json; add it from the USNO API/);
  miss([{ city: "New York", tz: "America/New_York", date: "2026-07-04" }], /no 2026-07-04 in usno-2026-27\.json/);
  miss([{ city: "New York", tz: "Mars/Olympus", date: "2026-12-13" }], /tz must be an IANA zone/);
  miss([{ city: "New York", tz: "America/New_York", date: "2026-13-40" }], /not a real date/);
});

test("sky-night prints USNO times it computed, and lists them in `computed` so the fact check accepts them", () => {
  const sheet = skyNight.render(skyNight.validate(geminid(), ctx()), prn, ctx());
  // New York Dec. 13: Moon sets 20:43, dark until the next sunrise 07:12 (Dec. 14), 18% lit. Chicago: 20:37, 07:10, 19%.
  for (const v of ["8:43 p.m.", "7:12 a.m.", "18%", "8:37 p.m.", "7:10 a.m.", "19%"]) assert.ok(sheet.computed.includes(v), `computed should list ${v}`);
  assert.match(sheet.html, /8:43 p\.m\./);
  assert.match(sheet.html, /New York/);
});

test("sky-night prints unconfirmed items in words only, never on the table or a count", () => {
  const sheet = skyNight.render(skyNight.validate(geminid(), ctx()), prn, ctx());
  // The unconfirmed note is in the dashed box, not a time or a drawn value.
  assert.match(sheet.html, /class="box un"[\s\S]*Peak hour[\s\S]*official peak hour/);
  // The table has exactly the two cities given; the unconfirmed item adds no row.
  assert.equal((sheet.html.match(/<td class="ct">/g) ?? []).length, 2);
  // "Peak hour" is not a clock time, so it never reaches `computed`.
  assert.ok(!sheet.computed.some((v) => /hour/.test(v)));
});

test("sky-night makes new stories quote the source, and the quote must hold the peak dates", () => {
  const c = ctx("2026-11-10T09:00:00-05:00"); // on or after QUOTE_SINCE
  const noquote = geminid(); delete (noquote.peak as Record<string, unknown>).quote;
  assert.throws(() => skyNight.validate(noquote, c), /add quote/);
  const wrong = geminid(); (wrong.peak as Record<string, unknown>).quote = "the Geminid peak on the night of Dec. 15-16";
  assert.throws(() => skyNight.validate(wrong, c), /does not say Dec\. 13/);
  assert.doesNotThrow(() => skyNight.validate(geminid(), c));
});
