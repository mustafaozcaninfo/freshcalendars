import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveMonthYear,
  resolvePlanningYear,
  resolveAllMonthYears,
  resolveBakeToday,
  sundayWeekRangeLabel,
} from "./resolve.js";
import { easterSunday } from "./holidays/easter.js";
import { holidaysForYear } from "./holidays/engine.js";

describe("resolveMonthYear", () => {
  const today = new Date(2026, 7, 2); // Aug 2, 2026

  it("maps August 2026 and January 2027", () => {
    assert.equal(resolveMonthYear(8, today), 2026);
    assert.equal(resolveMonthYear(12, today), 2026);
    assert.equal(resolveMonthYear(1, today), 2027);
    assert.equal(resolveMonthYear(7, today), 2027);
  });

  it("after September 1 August rolls to 2027", () => {
    const sep = new Date(2026, 8, 1);
    assert.equal(resolveMonthYear(8, sep), 2027);
    assert.equal(resolveMonthYear(9, sep), 2026);
  });

  it("resolveAllMonthYears covers 12 months", () => {
    const all = resolveAllMonthYears(today);
    assert.equal(Object.keys(all).length, 12);
    assert.equal(all[1], 2027);
    assert.equal(all[8], 2026);
  });
});

describe("resolvePlanningYear", () => {
  it("equals civil year", () => {
    assert.equal(resolvePlanningYear(new Date(2026, 7, 2)), 2026);
    assert.equal(resolvePlanningYear(new Date(2027, 0, 1)), 2027);
  });
});

describe("resolveBakeToday", () => {
  it("uses America/New_York calendar date", () => {
    const beforeMidnightEt = new Date("2026-08-12T03:30:00.000Z");
    const bake = resolveBakeToday(beforeMidnightEt);
    assert.equal(bake.getFullYear(), 2026);
    assert.equal(bake.getMonth() + 1, 8);
    assert.equal(bake.getDate(), 11);

    const afterCron = new Date("2026-08-12T05:15:00.000Z");
    const bake2 = resolveBakeToday(afterCron);
    assert.equal(bake2.getDate(), 12);
  });
});

describe("sundayWeekRangeLabel", () => {
  it("Tue Sep 1 2026 is week of Aug 30 – Sep 5 (Sunday start)", () => {
    assert.equal(sundayWeekRangeLabel(new Date(2026, 8, 1, 12)), "Aug 30 – Sep 5, 2026");
  });
});

describe("holidays", () => {
  it("Easter 2026 is April 5", () => {
    const e = easterSunday(2026);
    assert.equal(e.getFullYear(), 2026);
    assert.equal(e.getMonth(), 3);
    assert.equal(e.getDate(), 5);
  });

  it("Thanksgiving 2026 is Nov 26", () => {
    const list = holidaysForYear(2026, { federalOnly: true });
    const t = list.find((h) => h.slug === "thanksgiving");
    assert.ok(t);
    assert.equal(t!.iso, "2026-11-26");
  });

  it("Black Friday and Mother's Day resolve dynamically", () => {
    const list = holidaysForYear(2026);
    const bf = list.find((h) => h.slug === "black-friday");
    const md = list.find((h) => h.slug === "mothers-day");
    assert.ok(bf);
    assert.equal(bf!.iso, "2026-11-27");
    assert.ok(md);
    assert.equal(md!.iso, "2026-05-10");
  });
});
