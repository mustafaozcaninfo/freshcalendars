/** Rules that keep /news/ printables and photos honest: weekday checks, layout choice, license allowlist. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { chooseLayout, items, parseWhen } from "./newsPrintable.ts";
import { licenseOk, openverseLicense } from "./newsPhoto.ts";
import { finish, grainLayer } from "./fx.ts";
import { samePdf } from "./printables.ts";
import { splitVolatile } from "./sitePages.ts";
import sharp from "sharp";
import { KITS } from "./kits/index.ts";
import { THEMES, contrast, textPairs } from "./kits/themes.ts";
import { clock } from "./kits/watchGuide.ts";
import { KIT_FOR_CATEGORY, factTokens, kitProblem } from "../../../scripts/lib/print-record.mjs";

const base = { slug: "t", group: "g", title: "Test Dates 2026", note: "Source: test" };
const iso = (d: Date) => d.toISOString().slice(0, 10);

test("parseWhen reads single days, ranges and day-only ends", () => {
  assert.deepEqual(parseWhen("Fri., Nov. 20 to Sat., Nov. 21", 2026).map((x) => iso(x.date)), ["2026-11-20", "2026-11-21"]);
  assert.deepEqual(parseWhen("Oct. 22-24", 2026).map((x) => iso(x.date)), ["2026-10-22", "2026-10-24"]);
  assert.deepEqual(parseWhen("Tue., Nov. 3, 7 a.m.-7 p.m.", 2026).map((x) => iso(x.date)), ["2026-11-03"]);
});

test("parseWhen honors an explicit year so a sheet can cross New Year", () => {
  const [d] = parseWhen("Sat., Jan. 2, 2027", 2026);
  assert.equal(iso(d!.date), "2027-01-02");
  assert.equal(d!.date.getUTCDay(), d!.claimed);
});

test("a wrong weekday stops the printable", () => {
  assert.throws(() => items({ ...base, rows: [["Fri., Nov. 21", "x"]] }, 2026), /is a Sat, not a Fri/);
  assert.doesNotThrow(() => items({ ...base, rows: [["Sat., Nov. 21", "x"]] }, 2026));
});

test("auto layout: month for dated days, list when days get crowded, checklist for sections", () => {
  const month = items({ ...base, rows: [["Fri., Nov. 20", "a"], ["Sat., Nov. 21", "b"], ["Thu., Nov. 26", "c"]] }, 2026).list;
  assert.equal(chooseLayout(month), "month");
  const crowded = items({ ...base, rows: Array.from({ length: 5 }, (_, i): [string, string] => [`Oct. 1-Oct. 30`, `row ${i}`]) }, 2026).list;
  assert.equal(chooseLayout(crowded), "list");
  const sections = items({ ...base, rows: [{ when: "Before", what: "a", section: "Plan" }] }, 2026).list;
  assert.equal(chooseLayout(sections), "checklist");
});

test("photo licenses: only public domain, CC0, CC BY and CC BY-SA", () => {
  for (const ok of ["CC0", "CC BY 4.0", "CC BY-SA 2.5", "Public domain", "PD-USGov-NASA"]) assert.equal(licenseOk(ok), null, ok);
  for (const no of ["CC BY-NC 2.0", "CC BY-ND 4.0", "GFDL", "Fair use", "All rights reserved"]) assert.notEqual(licenseOk(no), null, no);
});

test("photo sources map to allowed licenses", () => {
  assert.equal(licenseOk("Pexels License"), null);
  assert.equal(openverseLicense("by-sa", "4.0"), "CC BY-SA 4.0");
  assert.equal(licenseOk(openverseLicense("by", "2.0")), null);
  assert.equal(licenseOk(openverseLicense("cc0")), null);
  assert.equal(licenseOk(openverseLicense("pdm")), null);
  assert.notEqual(licenseOk(openverseLicense("by-nc", "4.0")), null);
  assert.notEqual(licenseOk(openverseLicense("by-nd", "4.0")), null);
});

test("hero finish is deterministic per seed", async () => {
  assert.deepEqual(grainLayer(64, 32, 7, "a"), grainLayer(64, 32, 7, "a"));
  assert.notDeepEqual(grainLayer(64, 32, 7, "a"), grainLayer(64, 32, 7, "b"));
  const img = await sharp({ create: { width: 120, height: 68, channels: 3, background: "#1e3a8a" } }).png().toBuffer();
  const [a, b] = await Promise.all([finish(img, { seed: "s" }), finish(img, { seed: "s" })]);
  assert.ok(a.equals(b));
});

test("a PDF that differs only in its dates and ID counts as unchanged", () => {
  const a = Buffer.from("%PDF-1.4 /Title (X) /CreationDate (D:20261024101010+00'00') /ModDate (D:20261024101010+00'00') /ID [<AB12> <CD34>] page");
  const b = Buffer.from("%PDF-1.4 /Title (X) /CreationDate (D:20261025111111+00'00') /ModDate (D:20261025111111+00'00') /ID [<EF56> <0099>] page");
  assert.ok(samePdf(a, b));
  assert.ok(!samePdf(a, Buffer.from(b.toString().replace("page", "page 2"))));
});

test("sitemap hash ignores volatile blocks and strips their markers", () => {
  const a = splitVolatile("<main>A<!--fc:volatile-->Today: Oct 25<!--/fc:volatile-->B</main>");
  const b = splitVolatile("<main>A<!--fc:volatile-->Today: Oct 26<!--/fc:volatile-->B</main>");
  const c = splitVolatile("<main>A changed<!--fc:volatile-->Today: Oct 26<!--/fc:volatile-->B</main>");
  assert.equal(a.contentHash, b.contentHash);
  assert.notEqual(a.contentHash, c.contentHash);
  assert.equal(a.html, "<main>AToday: Oct 25B</main>");
});

test("a weekday written after the date is checked too", () => {
  assert.throws(() => items({ ...base, rows: [["Jan. 4, 2027 (Fri.)", "x"]] }, 2026), /is a Mon, not a Fri/);
  assert.doesNotThrow(() => items({ ...base, rows: [["Jan. 4, 2027 (Mon.)", "x"]] }, 2026));
  assert.throws(() => items({ ...base, rows: [["Feb. 15-19, 2027 (Mon. to Thu.)", "x"]] }, 2026), /is a Fri, not a Thu/);
  assert.doesNotThrow(() => items({ ...base, rows: [["Feb. 15-19, 2027 (Mon. to Fri.)", "x"]] }, 2026));
  // Real rows from stories: a pair after two dates, a year after the weekday, a range over New Year.
  for (const when of ["Mar. 3 to Mar. 4, 2027 (Wed.-Thu.)", "Jan. 11 (Mon.) to Jan. 15 (Fri.), 2027", "Dec. 28 to Jan. 1 (Mon. to Fri.)", "Feb. 12, 2027 (Fri.) to Feb. 16 (Tue.)"])
    assert.doesNotThrow(() => items({ ...base, rows: [[when, "x"]] }, 2026), when);
});

/** Kit context with two sources and the school theme; fonts are not needed to validate. */
/** Published before QUOTE_SINCE, so these fixtures need no quotes; the quote rule has its own test. */
const kctx = (category = "school-calendars", publishedAt = "2026-11-01T09:00:00-05:00") => ({ storySlug: "s", category, sources: [{ url: "https://a.gov/x", publisher: "A" }, { url: "https://b.gov/y", publisher: "B" }], theme: THEMES[category]!, fonts: "", publishedAt });

test("school-year refuses bad dates, unknown sources, overlaps and a weekend holiday", () => {
  const k = KITS["school-year"]!;
  const ok = { start: "2026-08", months: 10, events: [{ from: "2026-12-21", to: "2027-01-04", kind: "break", label: "Winter break", src: 1 }] };
  assert.doesNotThrow(() => k.validate(ok, kctx()));
  const bad = (events: unknown[], re: RegExp) => assert.throws(() => k.validate({ ...ok, events }, kctx()), re);
  bad([{ from: "2026-02-30", kind: "holiday", label: "X", src: 1 }], /not a real date/);
  bad([{ from: "2026-12-04", to: "2026-12-01", kind: "break", label: "X", src: 1 }], /ends before it starts/);
  bad([{ from: "2026-11-03", kind: "holiday", label: "X", src: 3 }], /not one of the story's 2 sources/);
  bad([{ from: "2026-11-03", kind: "holiday", label: "X" }], /add src/);
  bad([{ from: "2026-11-23", to: "2026-11-27", kind: "break", label: "A", src: 1 }, { from: "2026-11-25", kind: "early", label: "B", src: 1 }], /is both "A" and "B"/);
  bad([{ from: "2026-11-07", kind: "holiday", label: "X", src: 1 }], /falls on a Sat/);
  bad([{ from: "2027-07-01", kind: "holiday", label: "X", src: "B" }], /outside the months shown/);
});

test("school-year counts weekdays off from the dates, not from typed numbers", () => {
  const k = KITS["school-year"]!;
  const d = k.validate({ start: "2026-08", months: 10, events: [{ from: "2026-12-21", to: "2027-01-04", kind: "break", label: "Winter break", src: 1 }] }, kctx());
  const html = k.render(d, { kit: "school-year", slug: "x", group: "g", title: "T 2026", note: "Source: A", data: {} }, { ...kctx(), fonts: "" }).html;
  // Dec. 21-24, 25, 28-31, Jan. 1 and Jan. 4 are weekdays: 11.
  assert.match(html, /<b>11<\/b><span>weekdays of scheduled breaks/);
  // The sheet's own text (chart labels and counts included) must not read as dates the story never gave.
  const text = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
  assert.deepEqual([...factTokens(text)].filter((k) => k.startsWith("d:")), []);
});

test("watch-guide converts one sourced moment to the four U.S. zones", () => {
  const k = KITS["watch-guide"]!;
  const ev = (start: string, airing?: string) => ({ events: [{ start, title: "Game", channel: "NBC", src: 1, ...(airing ? { airing } : {}) }] });
  const render = (data: unknown) => k.render(k.validate(data, kctx("sports")), { kit: "watch-guide", slug: "x", group: "g", title: "T 2026", note: "Source: A", data: {} }, kctx("sports"));
  const live = render(ev("2026-11-18T20:00-05:00"));
  assert.deepEqual(live.computed, ["7 p.m.", "6 p.m.", "5 p.m."]);
  // 12:30 a.m. Eastern is still the evening before out West, and the sheet says which day.
  const late = render(ev("2026-11-19T00:30-05:00")).html;
  assert.match(late, /9:30 p\.m\. <em>\(Wed\.\)<\/em>/);
  assert.match(render(ev("2026-11-18T20:00-05:00", "delayed")).html, /7 p\.m\.<\/td><td class="z na">Local listings/);
  assert.throws(() => k.validate(ev("2026-11-18 20:00"), kctx()), /ISO time with its offset/);
  assert.equal(clock(12, 0), "noon");
  assert.equal(clock(0, 15), "12:15 a.m.");
});

test("deadline-matrix needs ordered dates inside its columns and before the target", () => {
  const k = KITS["deadline-matrix"]!;
  const base = { target: { date: "2026-12-25", label: "Christmas Day" }, columns: ["FedEx", "USPS"] };
  const ok = { ...base, rows: [{ date: "2026-12-15", cells: { FedEx: "Ground Economy" }, src: 1 }, { date: "2026-12-18", cells: { USPS: { text: "Priority Mail", src: 2 } } }] };
  const d = k.validate(ok, kctx("retail-dates"));
  assert.match(k.render(d, { kit: "deadline-matrix", slug: "x", group: "g", title: "T 2026", note: "Source: A", data: {} }, kctx("retail-dates")).html, /Tue\., Dec\. 15<\/td><td class="n">10</);
  const bad = (rows: unknown[], re: RegExp) => assert.throws(() => k.validate({ ...base, rows }, kctx("retail-dates")), re);
  bad([{ date: "2026-12-18", cells: { UPS: "x" }, src: 1 }], /"UPS" is not one of the columns/);
  bad([{ date: "2026-12-18", cells: { FedEx: "x" }, src: 1 }, { date: "2026-12-15", cells: { FedEx: "y" }, src: 1 }], /not after the row before/);
  bad([{ date: "2026-12-28", cells: { FedEx: "x" }, src: 1 }], /after the target/);
  bad([{ date: "2026-12-18", cells: { FedEx: "x" } }], /add src/);
});

test("every kit theme keeps its text pairs at 4.5:1", () => {
  for (const t of Object.values(THEMES)) for (const [fg, bg, what] of textPairs(t)) assert.ok(contrast(fg, bg) >= 4.5, `${t.id}: ${what} is ${contrast(fg, bg).toFixed(2)}:1`);
});

test("factTokens reads dates, ranges, times, amounts and percentages the same way on both sides", () => {
  const story = factTokens("Holiday break runs Dec. 21 through Jan. 4; the show starts at 8 p.m. and costs $1,234.50, 86 percent");
  for (const k of ["d:12-21", "d:1-4", "t:20:00", "$:1234.5", "%:86"]) assert.ok(story.has(k), k);
  // A range supports its two ends only, so a sheet cannot name a day the story never wrote.
  assert.ok(!story.has("d:12-28"));
  const sheet = factTokens("Mon., Dec. 28 · 8:00 p.m. · Sept. 24 · 86%");
  assert.deepEqual([...sheet].sort(), ["%:86", "d:12-28", "d:9-24", "t:20:00"]);
  assert.ok(factTokens("as of 2026-09-24", { iso: true }).has("d:9-24"));
  assert.deepEqual([...factTokens("Burns Night is 25 January; doors 24-26 Dec", { story: true })].sort(), ["d:1-25", "d:12-24", "d:12-26"]);
  assert.ok(!factTokens("2 Feb. 2027").has("d:2-2"), "day-first is read in stories only");
  assert.ok(factTokens("gates open 17:00", { story: true }).has("t:17:00"));
});

test("categories with a kit must use it or say why not", () => {
  assert.match(kitProblem("sports", { rows: [] })!, /use a kit \(watch-guide\)/);
  assert.equal(kitProblem("sports", { kit: "watch-guide" }), null);
  assert.match(kitProblem("school-calendars", { noKit: "n/a" })!, /at least 20 characters/);
  assert.equal(kitProblem("school-calendars", { noKit: "registration rules by district, not a calendar" }), null);
  assert.equal(kitProblem("holidays", { rows: [] }), null);
  for (const kits of Object.values(KIT_FOR_CATEGORY)) for (const k of kits) assert.ok(KITS[k], `${k} is a real kit`);
});

test("new stories quote the source, and the quote must hold the date and time", () => {
  const ctx = kctx("sports", "2026-11-10T09:00:00-05:00");
  const k = KITS["watch-guide"]!;
  const ev = (quote?: string) => ({ events: [{ start: "2026-11-18T20:00-05:00", title: "Game", src: 1, ...(quote ? { quote } : {}) }] });
  assert.throws(() => k.validate(ev(), ctx), /add quote/);
  assert.throws(() => k.validate(ev("Wednesday, Nov. 19 at 8 p.m. ET"), ctx), /does not say Nov\. 18/);
  assert.throws(() => k.validate(ev("Wednesday, Nov. 18 at 9 p.m. ET"), ctx), /does not say 20:00/);
  assert.doesNotThrow(() => k.validate(ev("Wednesday, Nov. 18 at 8 p.m. ET on ABC"), ctx));
  assert.doesNotThrow(() => k.validate(ev("Nov. 18, 8/7c, ABC"), ctx));
  const s = KITS["school-year"]!;
  const sy = (quote: string) => ({ start: "2026-08", months: 10, events: [{ from: "2026-12-21", to: "2027-01-04", kind: "break", label: "Winter break", src: 1, quote }] });
  assert.throws(() => s.validate(sy("Winter break begins Dec. 21"), kctx("school-calendars", "2026-11-10T09:00:00-05:00")), /does not say Jan\. 4/);
  assert.doesNotThrow(() => s.validate(sy("Winter Break: December 21, 2026 - January 4, 2027"), kctx("school-calendars", "2026-11-10T09:00:00-05:00")));
});

test("a UTC offset that no zone uses that day is refused (daylight saving time slips)", () => {
  const k = KITS["watch-guide"]!;
  const ev = (start: string) => ({ events: [{ start, title: "Game", src: 1 }] });
  // Daylight saving time ended Nov. 1, 2026: -04:00 on Nov. 18 is a typo for -05:00.
  assert.throws(() => k.validate(ev("2026-11-18T20:00-04:00"), kctx("sports")), /Eastern Time is -05:00 that day/);
  assert.doesNotThrow(() => k.validate(ev("2026-10-18T20:00-04:00"), kctx("sports")));
  assert.doesNotThrow(() => k.validate(ev("2026-11-18T20:00-08:00"), kctx("sports")));
  assert.doesNotThrow(() => k.validate(ev("2026-11-21T15:00Z"), kctx("sports")));
  assert.throws(() => k.validate(ev("2026-07-04T20:00-03:30"), kctx("sports")), /not the clock of any/);
  // Atlantic time (-04:00 in winter) is a real clock for uk-canada stories only.
  assert.doesNotThrow(() => k.validate(ev("2026-11-18T20:00-04:00"), kctx("uk-canada")));
});
