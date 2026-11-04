import { test } from "node:test";
import assert from "node:assert/strict";
import { factTable as K } from "./factTable.ts";
import { THEMES } from "./themes.ts";

/** Published before QUOTE_SINCE, so these fixtures need no quotes; the quote checks have their own test. */
const kctx = (publishedAt = "2026-11-01T09:00:00-05:00") => ({
  storySlug: "s", category: "money-benefits", sources: [{ url: "https://a.gov/x", publisher: "A" }, { url: "https://b.gov/y", publisher: "B" }],
  theme: THEMES["money-benefits"]!, fonts: "", publishedAt,
});
const p = { kit: "fact-table", slug: "x", group: "g", title: "SNAP Benefit Amounts, FY2027", subtitle: "By household size", note: "Source: FNS", data: {} };

// Real FNS FY2027 figures from the SNAP story.
const ok = () => ({
  columns: [
    { key: "size", label: "Household size" },
    { key: "max", label: "Maximum monthly allotment", align: "right" },
    { key: "gross", label: "Gross income limit", align: "right" },
    { key: "net", label: "Net income limit", align: "right" },
  ],
  highlight: "size",
  rows: [
    { cells: { size: "1 person", max: "$306", gross: "$1,729", net: "$1,330" }, src: 1 },
    { cells: { size: "4 people", max: "$1,023", gross: "$3,575", net: "$2,750" }, src: 1 },
    { cells: { size: "Each added person", max: "+$225", gross: "+$616", net: "+$474" }, src: 1 },
  ],
  note: ["Amounts are for the 48 states and DC."],
  unconfirmed: [{ label: "FY2026 figures", why: "not on the FNS pages we read" }],
});

test("fact-table accepts a well-formed sourced table", () => {
  assert.doesNotThrow(() => K.validate(ok(), kctx()));
});

test("fact-table refuses bad columns, keys, aligns, highlights and sources", () => {
  const bad = (patch: Record<string, unknown>, re: RegExp) => assert.throws(() => K.validate({ ...ok(), ...patch }, kctx()), re);
  bad({ columns: [{ key: "a", label: "A" }] }, /2 to 6/);
  bad({ columns: [{ key: "a", label: "A" }, { key: "a", label: "B" }] }, /keys must differ/);
  bad({ columns: [{ key: "a", label: "A" }, { key: "b", label: "B", align: "middle" }] }, /align must be left or right/);
  bad({ highlight: "nope" }, /not one of the column keys/);
  bad({ rows: [{ cells: { size: "1", bogus: "x" }, src: 1 }] }, /"bogus" is not one of the columns/);
  bad({ rows: [{ cells: { size: "1" } }] }, /add src/);
  bad({ rows: [{ cells: { size: "1" }, src: 9 }] }, /not one of the story's 2 sources/);
  bad({ rows: [] }, /at least one/);
});

test("fact-table checks that a row's quote holds every dollar amount and percent", () => {
  const withQuote = (q: string) => ({ ...ok(), rows: [{ cells: { size: "4 people", max: "$1,023", gross: "$3,575", net: "$2,750" }, src: 1, quote: q }] });
  assert.throws(() => K.validate(withQuote("the maximum is $1,023 and the gross limit is $3,575"), kctx()), /does not say \$2750/);
  assert.doesNotThrow(() => K.validate(withQuote("maximum $1,023, gross limit $3,575, net limit $2,750 for four"), kctx()));
  // A percent in a cell must also be in the quote.
  const pct = (q: string) => ({ ...ok(), rows: [{ cells: { size: "Gross monthly income", max: "130%" }, src: 1, quote: q }] });
  assert.throws(() => K.validate(pct("the gross limit is a share of poverty"), kctx()), /does not say 130%/);
  assert.doesNotThrow(() => K.validate(pct("the gross monthly income limit is 130 percent of poverty"), kctx()));
});

test("fact-table prints numbers exactly and marks the table splittable with repeated heads", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  assert.match(out.html, /data-split/);
  assert.match(out.html, /<thead>/);
  // Figures are printed verbatim, never rounded.
  assert.match(out.html, /\$1,023/);
  assert.match(out.html, /\+\$225/);
  // The highlighted column reads bold, not by color alone (it carries the "hi" class).
  assert.match(out.html, /class="l hi"/);
});

test("fact-table lists unconfirmed items in words, not in a table cell", () => {
  const out = K.render(K.validate(ok(), kctx()), p, kctx());
  assert.match(out.html, /Not yet confirmed/);
  assert.match(out.html, /FY2026 figures/);
  assert.doesNotMatch(out.html, /<td[^>]*>FY2026 figures/);
});
