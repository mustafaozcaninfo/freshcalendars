/** Rules that keep /news/ printables and photos honest: weekday checks, layout choice, license allowlist. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { chooseLayout, items, parseWhen } from "./newsPrintable.ts";
import { licenseOk, openverseLicense } from "./newsPhoto.ts";
import { finish, grainLayer } from "./fx.ts";
import { samePdf } from "./printables.ts";
import sharp from "sharp";

const base = { slug: "t", group: "g", title: "Test Dates 2026", note: "Source: test" };
const iso = (d: Date) => d.toISOString().slice(0, 10);

test("parseWhen reads single days, ranges and day-only ends", () => {
  assert.deepEqual(parseWhen("Fri., Nov. 20 to Sat., Nov. 21", 2026).map((x) => iso(x.date)), ["2026-11-20", "2026-11-21"]);
  assert.deepEqual(parseWhen("Oct. 22-24", 2026).map((x) => iso(x.date)), ["2026-10-22", "2026-10-24"]);
  assert.deepEqual(parseWhen("Tue., Nov. 3, 7 a.m.-7 p.m.", 2026).map((x) => iso(x.date)), ["2026-11-03"]);
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
