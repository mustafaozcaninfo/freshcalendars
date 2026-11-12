import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { datedPages, datedYears, monthHref, yearHref } from "./datedPages.js";

const today = new Date(2026, 10, 12); // Nov 12, 2026

describe("dated month and year pages", () => {
  const pages = datedPages(today);

  it("makes one page per year and per month of five years", () => {
    assert.deepEqual(datedYears(today), [2026, 2027, 2028, 2029, 2030]);
    assert.equal(pages.length, 5 + 60);
    assert.equal(new Set(pages.map((p) => p.path)).size, pages.length);
    assert.equal(new Set(pages.map((p) => p.id)).size, pages.length);
  });

  it("keeps titles and descriptions inside the snippet limits", () => {
    for (const p of pages) {
      assert.ok(p.title.length <= 60, `${p.path} title ${p.title.length}`);
      assert.ok(p.description.length >= 110 && p.description.length <= 160, `${p.path} description ${p.description.length}`);
    }
  });

  it("points a month or year the evergreen page shows at that page", () => {
    const by = (path: string) => pages.find((p) => p.path === path)!;
    assert.equal(by("/december-2026-calendar/").canonicalPath, "/december-calendars.html");
    assert.equal(by("/january-2027-calendar/").canonicalPath, "/january-calendars.html");
    assert.equal(by("/december-2027-calendar/").canonicalPath, undefined);
    assert.equal(by("/january-2026-calendar/").canonicalPath, undefined);
    assert.equal(by("/2026-calendar/").canonicalPath, "/printable-calendars.html");
    assert.equal(by("/2027-calendar/").canonicalPath, "/printable-yearly-calendar.html");
    assert.equal(by("/2028-calendar/").canonicalPath, undefined);
  });

  it("links the evergreen page while it shows that year, and nothing outside the range", () => {
    assert.equal(monthHref(2026, 12, today), "/december-calendars.html");
    assert.equal(monthHref(2027, 12, today), "/december-2027-calendar/");
    assert.equal(monthHref(2031, 1, today), null);
    assert.equal(monthHref(2025, 12, today), null);
    assert.equal(yearHref(2029, today), "/2029-calendar/");
    assert.equal(yearHref(2031, today), null);
  });

  it("states the facts of the month", () => {
    const feb = pages.find((p) => p.path === "/february-2028-calendar/")!;
    assert.match(feb.description, /starts on a Tuesday and has 29 days/);
    assert.match(pages.find((p) => p.path === "/2028-calendar/")!.body, /leap year with 366 days/);
    assert.match(pages.find((p) => p.path === "/2027-calendar/")!.body, /starts on a <strong>Friday<\/strong>/);
  });
});
