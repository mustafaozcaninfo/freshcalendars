import { test } from "node:test";
import assert from "node:assert/strict";
import { holidayPlanner as K } from "./holidayPlanner.ts";
import { THEMES } from "./themes.ts";
import { factTokens } from "../../../../scripts/lib/print-record.mjs";

/** Published before QUOTE_SINCE (2026-11-04), so these fixtures need no quotes; the quote rule has its own test. */
const kctx = (publishedAt = "2026-11-01T09:00:00-05:00") => ({
  storySlug: "s", category: "holidays", sources: [{ url: "https://a.gov/x", publisher: "A" }, { url: "https://b.gov/y", publisher: "B" }],
  theme: THEMES.holidays!, fonts: "", publishedAt,
});
const p = { kit: "holiday-planner", slug: "x", group: "g", title: "Thanksgiving 2026 Planner", note: "Source: A", data: {} };

const ok = () => ({
  holiday: { date: "2026-11-26", name: "Thanksgiving Day", src: 1 },
  status: [
    { name: "Federal offices", status: "closed", detail: "Federal holiday", src: 1 },
    { name: "Grocery stores", status: "limited", detail: "Many close early", src: 2 },
    { name: "Parks", status: "open", src: 1 },
  ],
  tasks: [{ daysBefore: 7, task: "Order the turkey" }, { daysBefore: 1, task: "Thaw and prep" }],
  future: [{ date: "2027-11-25", src: 1 }, { date: "2028-11-23", src: 1 }],
  unconfirmed: [{ label: "Store hours", why: "chains had not posted 2026 hours" }],
  fill: ["Guest list", "Menu"],
});

test("holiday-planner accepts a well-formed holiday sheet", () => {
  assert.doesNotThrow(() => K.validate(ok(), kctx()));
});

test("holiday-planner refuses bad dates, unknown sources and unknown status", () => {
  const bad = (patch: Record<string, unknown>, re: RegExp) => assert.throws(() => K.validate({ ...ok(), ...patch }, kctx()), re);
  bad({ holiday: { date: "2026-02-30", name: "X", src: 1 } }, /not a real date/);
  bad({ holiday: { date: "2026-11-26", name: "X", src: 5 } }, /not one of the story's 2 sources/);
  bad({ holiday: { date: "2026-11-26", name: "X" } }, /add src/);
  bad({ status: [{ name: "Banks", status: "shut", src: 1 }] }, /status must be one of/);
  bad({ status: [] }, /at least one/);
});

test("holiday-planner needs coming-year dates after the holiday, in order", () => {
  const bad = (future: unknown[], re: RegExp) => assert.throws(() => K.validate({ ...ok(), future }, kctx()), re);
  bad([{ date: "2025-11-27", src: 1 }], /not after the holiday/);
  bad([{ date: "2028-11-23", src: 1 }, { date: "2027-11-25", src: 1 }], /not after the row before/);
  bad([{ date: "2027-02-30", src: 1 }], /not a real date/);
  bad([{ date: "2027-11-25" }], /add src/);
});

test("holiday-planner computes the weekday and the prep dates, never typing them", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  // Nov. 26, 2026 is a Thursday (computed, not in the data).
  assert.match(out.html, /Thursday/);
  assert.match(out.html, /November 26, 2026/);
  // 7 days before Nov. 26 is Thu., Nov. 19; the kit draws the weekday and records the computed date.
  assert.match(out.html, /Thu\., Nov\. 19/);
  assert.ok(out.computed.includes("November 19"), `computed should record the prep date, got ${JSON.stringify(out.computed)}`);
  // Coming years: 2027 is a Wednesday (Nov. 25), computed.
  assert.match(out.html, /Wed\., Nov\. 25/);
});

test("holiday-planner prints no date the data and computed list do not justify", () => {
  const d = K.validate(ok(), kctx());
  const out = K.render(d, p, kctx());
  const text = out.html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
  const allowed = new Set<string>();
  for (const iso of ["2026-11-26", "2027-11-25", "2028-11-23"]) for (const k of factTokens(iso, { iso: true })) allowed.add(k);
  for (const c of out.computed) for (const k of factTokens(c)) allowed.add(k);
  const stray = [...factTokens(text)].filter((k) => k.startsWith("d:") && !allowed.has(k));
  assert.deepEqual(stray, [], `stray date tokens on the sheet: ${stray.join(", ")}`);
});

test("holiday-planner lists unconfirmed items in words, not on a grid", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  assert.match(out.html, /Not yet confirmed/);
  assert.match(out.html, /Store hours/);
  // The unconfirmed item is inside the dashed box, not a status or future table row.
  assert.doesNotMatch(out.html, /<td[^>]*>Store hours/);
});

test("holiday-planner enforces the source quote once quotes are required", () => {
  const ctx = kctx("2026-11-10T09:00:00-05:00");
  const base = ok();
  assert.throws(() => K.validate(base, ctx), /add quote/);
  const withQuotes = (hq: string) => ({
    ...base,
    holiday: { ...base.holiday, quote: hq },
    status: base.status.map((s) => ({ ...s, quote: "the source calls it this" })),
    future: base.future.map((f, i) => ({ ...f, quote: i === 0 ? "Thanksgiving 2027: November 25" : "Thanksgiving 2028: November 23" })),
  });
  assert.throws(() => K.validate(withQuotes("Thanksgiving Day, November 27, 2026"), ctx), /does not say Nov\. 26/);
  assert.doesNotThrow(() => K.validate(withQuotes("Thanksgiving Day, Thursday, November 26, 2026"), ctx));
});
