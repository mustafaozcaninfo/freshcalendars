import { test } from "node:test";
import assert from "node:assert/strict";
import { activitySheet as K } from "./activitySheet.ts";
import { THEMES } from "./themes.ts";

const kctx = (publishedAt = "2026-11-01T09:00:00-05:00") => ({
  storySlug: "s", category: "holidays", sources: [{ url: "https://a.gov/x", publisher: "A" }, { url: "https://b.gov/y", publisher: "B" }],
  theme: THEMES.holidays!, fonts: "", publishedAt,
});
const p = { kit: "activity-sheet", slug: "x", group: "g", title: "National Popcorn Day 2027 Quiz", note: "Source: Popcorn Board", data: {} };

// Real facts from the National Popcorn Day and World Braille Day stories.
const ok = () => ({
  day: { date: "2027-01-19", name: "National Popcorn Day", src: 1 },
  facts: [
    { text: "Popcorn is a whole grain.", src: 1 },
    { text: "Americans eat about 14 billion quarts of popcorn a year.", src: 2 },
  ],
  activities: [
    { type: "quiz", title: "Facts quiz", questions: [
      { q: "Is popcorn a whole grain?", a: "Yes", src: 1 },
      { q: "Which day is National Popcorn Day?", a: "January 19th", src: 1 },
    ] },
    { type: "tally", title: "Flavor tally", labels: ["Plain with salt", "Butter", "Caramel"] },
    { type: "checklist", title: "Before the day", items: ["Pick a recipe", "Buy kernels"] },
    { type: "chart", title: "Braille a to c", columns: 6, cells: [
      { label: "a", dots: [1] }, { label: "b", dots: [1, 2] }, { label: "c", dots: [1, 4] },
    ] },
    { type: "lines", title: "My plan", labels: ["Who is coming", "What we will make"] },
  ],
  unconfirmed: [{ label: "2027 theater deals", why: "no theater had posted a 2027 offer" }],
});

test("activity-sheet accepts a well-formed observance sheet", () => {
  assert.doesNotThrow(() => K.validate(ok(), kctx()));
});

test("activity-sheet refuses bad dates, unknown sources, unknown types and bad dots", () => {
  const bad = (patch: Record<string, unknown>, re: RegExp) => assert.throws(() => K.validate({ ...ok(), ...patch }, kctx()), re);
  bad({ day: { date: "2027-02-30", name: "X", src: 1 } }, /not a real date/);
  bad({ day: { date: "2027-01-19", name: "X", src: 9 } }, /not one of the story's 2 sources/);
  bad({ day: { date: "2027-01-19", name: "X" } }, /add src/);
  bad({ facts: [] }, /at least one/);
  bad({ activities: [{ type: "wordsearch", title: "X" }] }, /type must be one of/);
  bad({ activities: [{ type: "quiz", title: "Q", questions: [{ q: "Why?", a: "Because" }] }] }, /add src/);
  bad({ activities: [{ type: "chart", title: "C", cells: [{ label: "a", dots: [1, 7] }] }] }, /dots, whole numbers 1 to 6/);
  bad({ activities: [{ type: "chart", title: "C", cells: [{ label: "a", dots: [1, 1] }] }] }, /no repeats/);
});

test("activity-sheet computes the weekday and keeps quiz answers on the cut-off strip", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  // Jan. 19, 2027 is a Tuesday (computed, not typed in the data).
  assert.match(out.html, /Tuesday/);
  assert.match(out.html, /January 19, 2027/);
  // The scissors cut line and the answers are both present; the answers sit in the upside-down strip.
  assert.match(out.html, /cut here to hide the answers/);
  const strip = /<div class="ans-body">([\s\S]*?)<\/div>\s*<\/div>/.exec(out.html)?.[1] ?? "";
  assert.match(strip, /Q1\. Yes/);
  assert.match(strip, /Q2\. January 19th/);
  // The questions themselves are not in the answer strip.
  assert.doesNotMatch(strip, /whole grain\?/);
});

test("activity-sheet draws braille dots as SVG, not glyphs", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  assert.match(out.html, /<svg[^>]*viewBox="0 0 27 40"/);
  // No braille Unicode glyphs (those would fall back to a system font).
  assert.doesNotMatch(out.html, /[⠀-⣿]/);
});

test("activity-sheet lists unconfirmed items in words, not on a grid", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  assert.match(out.html, /Not yet confirmed/);
  assert.match(out.html, /2027 theater deals/);
  assert.doesNotMatch(out.html, /<td[^>]*>2027 theater deals/);
});

test("activity-sheet enforces the date and answer quotes once quotes are required", () => {
  const ctx = kctx("2026-11-10T09:00:00-05:00");
  const base = ok();
  assert.throws(() => K.validate(base, ctx), /add quote/);
  const quoted = {
    ...base,
    day: { ...base.day, quote: "National Popcorn Day is on Jan. 19, 2027" },
    facts: base.facts.map((f) => ({ ...f, quote: "the source says so" })),
    activities: base.activities.map((a) => a.type === "quiz" ? { ...a, questions: a.questions.map((q) => ({ ...q, quote: "the source says so" })) } : a),
  };
  assert.doesNotThrow(() => K.validate(quoted, ctx));
  // A date quote that does not hold the date is caught.
  assert.throws(() => K.validate({ ...quoted, day: { ...quoted.day, quote: "National Popcorn Day is Jan. 20" } }, ctx), /does not say Jan\. 19/);
});
