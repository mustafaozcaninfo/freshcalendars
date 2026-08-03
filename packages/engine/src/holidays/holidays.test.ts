import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { holidaysForYear, resolveHoliday } from "./engine.js";
import { CA_HOLIDAY_RULES, UK_HOLIDAY_RULES, holidayDefBySlug } from "./rules.js";

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
