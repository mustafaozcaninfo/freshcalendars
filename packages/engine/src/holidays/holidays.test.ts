import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { holidaysForYear, resolveHoliday, resolveHolidayYear } from "./engine.js";
import { CA_HOLIDAY_RULES, UK_HOLIDAY_RULES, holidayDefBySlug } from "./rules.js";

describe("resolveHolidayYear (evergreen when-is)", () => {
  it("rolls past holidays to next year (like resolveMonthYear)", () => {
    const nye = holidayDefBySlug("new-years-day");
    const thanks = holidayDefBySlug("thanksgiving");
    const easter = holidayDefBySlug("easter");
    assert.ok(nye && thanks && easter);
    const aug2026 = new Date(2026, 7, 3); // Aug 3 2026 — NYE & Easter past, Thanksgiving ahead
    assert.equal(resolveHolidayYear(nye, aug2026), 2027);
    assert.equal(resolveHolidayYear(easter, aug2026), 2027);
    assert.equal(resolveHolidayYear(thanks, aug2026), 2026);
  });

  it("keeps today as still-valid (holiday day itself)", () => {
    const thanks = holidayDefBySlug("thanksgiving");
    assert.ok(thanks);
    const thanksgiving2026 = new Date(2026, 10, 26); // Thu Nov 26 2026
    assert.equal(resolveHolidayYear(thanks, thanksgiving2026), 2026);
    const dayAfter = new Date(2026, 10, 27);
    assert.equal(resolveHolidayYear(thanks, dayAfter), 2027);
  });
});

describe("UK/CA holiday rules", () => {
  it("resolves UK Boxing Day and Easter Monday for 2026", () => {
    const boxing = holidayDefBySlug("uk-boxing-day");
    const easterMon = holidayDefBySlug("uk-easter-monday");
    assert.ok(boxing && easterMon);
    assert.equal(resolveHoliday(boxing, 2026).iso, "2026-12-26");
    assert.equal(resolveHoliday(easterMon, 2026).iso, "2026-04-06");
  });

  it("resolves Canadian Thanksgiving and Victoria Day for 2026", () => {
    const thanks = holidayDefBySlug("ca-thanksgiving");
    const victoria = holidayDefBySlug("ca-victoria-day");
    assert.ok(thanks && victoria);
    assert.equal(resolveHoliday(thanks, 2026).iso, "2026-10-12");
    assert.equal(resolveHoliday(victoria, 2026).iso, "2026-05-18");
  });

  it("lists locale hubs separately", () => {
    assert.ok(holidaysForYear(2026, { locale: "uk" }).length >= UK_HOLIDAY_RULES.length);
    assert.ok(holidaysForYear(2026, { locale: "ca" }).length >= CA_HOLIDAY_RULES.length);
    assert.ok(!holidaysForYear(2026, { locale: "uk" }).some((h) => h.slug === "thanksgiving"));
    assert.ok(holidaysForYear(2026, { locale: "ca" }).some((h) => h.slug === "ca-thanksgiving"));
  });
});
