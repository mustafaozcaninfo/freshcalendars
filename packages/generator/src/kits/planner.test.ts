import { test } from "node:test";
import assert from "node:assert/strict";
import { planner as K } from "./planner.ts";
import { THEMES } from "./themes.ts";

const kctx = (publishedAt = "2026-11-01T09:00:00-05:00") => ({
  storySlug: "s", category: "planning", sources: [{ url: "https://a.gov/x", publisher: "A" }, { url: "https://b.gov/y", publisher: "B" }],
  theme: THEMES.planning!, fonts: "", publishedAt,
});
const p = { kit: "planner", slug: "x", group: "g", title: "Debt Payoff Tracker 2027", note: "Source: CFPB", data: {} };

// Modeled on the debt-payoff, meal-planning and vision-board stories.
const ok = () => ({
  sections: [
    { type: "table", title: "Your debts", columns: ["Debt", "Balance", "APR", "Minimum", "Payoff order"], rows: 6 },
    { type: "table", title: "2027 payment log", columns: ["Month", "Paid", "Extra to first debt", "Balance left"], rows: 12, totals: true },
    { type: "week", title: "Weekly menu", rows: ["Breakfast", "Lunch", "Dinner", "Snack"] },
    { type: "month-grid", title: "Monthly check-ins", months: ["2027-01", "2027-02", "2027-12"], mark: "month-end" },
    { type: "checklist", title: "Home tasks", groups: [{ title: "Every month", items: ["Test every smoke alarm"] }, { title: "Storm season", items: ["Clear the gutters"] }] },
    { type: "lines", title: "Year goal page", labels: ["My 2027 goal", "Why it matters"] },
  ],
  rules: [{ text: "Raw ground meat keeps 1 to 2 days in the refrigerator at 40 F.", src: 1 }],
  unconfirmed: [{ label: "Interest rates", why: "the reader fills in their own" }],
});

test("planner accepts a well-formed set of sections", () => {
  assert.doesNotThrow(() => K.validate(ok(), kctx()));
});

test("planner refuses unknown section types, bad row counts, bad months and unsourced rules", () => {
  const sec = (s: unknown[]) => ({ ...ok(), sections: s });
  assert.throws(() => K.validate(sec([{ type: "gantt", title: "X" }]), kctx()), /type must be one of/);
  assert.throws(() => K.validate(sec([{ type: "table", title: "X", columns: ["A"], rows: 99 }]), kctx()), /rows, a whole number/);
  assert.throws(() => K.validate(sec([{ type: "month-grid", title: "X", months: ["2027-13"] }]), kctx()), /must be "YYYY-MM"/);
  assert.throws(() => K.validate(sec([{ type: "week", title: "X", rows: [] }]), kctx()), /rows, at least 1/);
  assert.throws(() => K.validate({ ...ok(), rules: [{ text: "A rule" }] }, kctx()), /add src/);
  assert.throws(() => K.validate({ ...ok(), rules: [{ text: "A rule", src: 9 }] }, kctx()), /not one of the story's 2 sources/);
});

test("planner marks blank tables splittable and computes the month-end dates", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  // Blank tables paginate with repeated heads.
  assert.match(out.html, /data-split/);
  // Jan. 31, 2027 is a Sunday; Dec. 31 is a Friday (computed from "month-end", never typed).
  assert.match(out.html, /Sun\., Jan\. 31/);
  assert.match(out.html, /Fri\., Dec\. 31/);
  assert.ok(out.computed.includes("January 31"), `computed should record the month-end date, got ${JSON.stringify(out.computed)}`);
  // The weekly grid has the seven weekday heads.
  assert.match(out.html, /<th>Sun\.<\/th>/);
});

test("planner lists unconfirmed items in words, not in a table cell", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  assert.match(out.html, /Not yet confirmed/);
  assert.match(out.html, /Interest rates/);
  assert.doesNotMatch(out.html, /<td[^>]*>Interest rates/);
});

test("planner requires a rule's quote to hold once quotes are required", () => {
  const ctx = kctx("2026-11-10T09:00:00-05:00");
  assert.throws(() => K.validate(ok(), ctx), /add quote/);
  const quoted = { ...ok(), rules: [{ text: "Raw ground meat keeps 1 to 2 days.", src: 1, quote: "Raw ground meat keeps 1 to 2 days in the refrigerator." }] };
  assert.doesNotThrow(() => K.validate(quoted, ctx));
});
