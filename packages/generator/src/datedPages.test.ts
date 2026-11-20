import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { datedPages, datedYears, designCards, monthHref, sheetSearchImages, yearHref } from "./datedPages.js";
import { federalDays, holidaySpan, repeatedSentences, sameCalendarYears, sameLayoutYears, sheetRows, workingDays } from "./pageFacts.js";
import { holidayDefBySlug } from "@freshcalendars/engine";

const today = new Date(2026, 10, 12); // Nov 12, 2026

describe("dated month and year pages", () => {
  const pages = datedPages(today);

  it("makes one page per year and per month of five years", () => {
    assert.deepEqual(datedYears(today), [2026, 2027, 2028, 2029, 2030]);
    assert.equal(pages.length, 5 + 60);
    assert.equal(new Set(pages.map((p) => p.path)).size, pages.length);
    assert.equal(new Set(pages.map((p) => p.id)).size, pages.length);
  });

  it("never says the same sentence on two pages", () => {
    assert.deepEqual(repeatedSentences(pages), []);
    assert.equal(new Set(pages.map((p) => p.description)).size, pages.length);
    // The shared print help and the designs' stock descriptions stay off the dated pages.
    for (const p of pages) assert.doesNotMatch(p.body, /How to print it|Fit to page/);
  });

  it("works out each page's own facts", () => {
    // February 2026 starts on a Sunday: four rows on a Sunday-start sheet, five on a Monday-start one.
    assert.equal(sheetRows(2026, 2, 0), 4);
    assert.equal(sheetRows(2026, 2, 1), 5);
    assert.equal(sheetRows(2027, 5, 0), 6); // May 2027 starts on a Saturday
    assert.deepEqual(sameLayoutYears(2027, 7), { before: [2021, 2010, 2004], after: [2032, 2038, 2049] });
    assert.deepEqual(sameCalendarYears(2027).after.slice(0, 2), [2038, 2049]);
    // July 2027: 22 weekdays, Independence Day (a Sunday) observed Monday, July 5.
    const july = workingDays(2027, 7);
    assert.equal(july.count, 21);
    assert.equal(new Date(july.off[0]!.observed).toISOString().slice(0, 10), "2027-07-05");
    // New Year's Day 2028 is a Saturday: the day off is Friday, December 31, 2027.
    assert.equal(workingDays(2027, 12).off.map((d) => d.h.name).join(), "Christmas Day,New Year's Day");
    assert.equal(federalDays(2026).length, 11);
    const easter = holidaySpan(holidayDefBySlug("easter")!, 2027)!;
    assert.deepEqual([easter.earliest.month, easter.earliest.day, easter.latest.month, easter.latest.day, easter.latest.year], [3, 22, 4, 25, 2038]);
    assert.equal(holidaySpan(holidayDefBySlug("christmas-day")!, 2027), null);
  });

  it("keeps titles and descriptions inside the snippet limits", () => {
    for (const p of pages) {
      assert.ok(p.title.length <= 60, `${p.path} title ${p.title.length}`);
      assert.ok(p.description.length >= 110 && p.description.length <= 160, `${p.path} description ${p.description.length}`);
    }
  });

  it("names the search images after the query and shows the same files on the design cards", () => {
    const month = sheetSearchImages(2026, 12), year = sheetSearchImages(2027);
    assert.equal(month.length, 8);
    // The wide, bold sheet leads: it is the one that reads at thumbnail size.
    assert.equal(month[0]!.url, "https://cdn.freshcalendars.com/assets/studio/2026/december/large-print/december-2026-calendar-printable.webp");
    assert.deepEqual([month[0]!.width, month[0]!.height], [3200, 2472]);
    const classic = month.find((i) => i.url.endsWith("december-2026-calendar-classic.webp"))!;
    assert.deepEqual([classic.width, classic.height], [2200, 2848]);
    const wide = month.find((i) => i.url.endsWith("december-2026-calendar-landscape.webp"))!;
    assert.deepEqual([wide.width, wide.height], [3200, 2472]);
    assert.equal(year.length, 5);
    assert.equal(year[0]!.url, "https://cdn.freshcalendars.com/assets/2027/yearly/classic/2027-yearly-calendar-classic.webp");
    const all = [...month, ...year];
    assert.equal(new Set(all.map((i) => i.url)).size, all.length);
    assert.equal(new Set(all.map((i) => i.name)).size, all.length);
    const cards = designCards(2026, 12);
    for (const img of month) assert.ok(cards.includes(`<img src="${new URL(img.url).pathname}"`), img.url);
    const page2028 = pages.find((p) => p.path === "/2028-calendar/")!;
    for (const img of sheetSearchImages(2028)) assert.ok(page2028.body.includes(`<img src="${new URL(img.url).pathname}"`), img.url);
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
    assert.match(feb.description, /starts on a Tuesday, has 29 days/);
    assert.match(pages.find((p) => p.path === "/2028-calendar/")!.body, /leap year with 366 days/);
    assert.match(pages.find((p) => p.path === "/2027-calendar/")!.body, /starts on a <strong>Friday<\/strong>/);
  });

  it("sells a printable pack only when it has a checkout link", async () => {
    const { PACKS } = await import("../../../cloudflare/products.js");
    const { packFor, packLd, packContents, zipStore } = await import("./packs.js");
    const pack = PACKS.find((p) => p.id === "january-2028-calendar-pack")!;
    const page = () => datedPages(today).find((p) => p.path === "/january-2028-calendar/")!;
    const was = pack.checkoutUrl;
    try {
      // Not on sale: the page is the free page, with no buy box and no Product data.
      pack.checkoutUrl = "";
      assert.equal(packFor(2028, 1), null);
      assert.doesNotMatch(page().body, /pack-box|pack-terms/);
      assert.equal(page().ld, undefined);
      pack.checkoutUrl = "https://buy.stripe.com/test_123";
      const p = page(), ld = packLd(pack, "https://freshcalendars.com/january-2028-calendar/") as any;
      assert.match(p.body, /href="https:\/\/buy\.stripe\.com\/test_123"/);
      // The price a reader sees is the price in the data, and the terms the data points at are on the page.
      assert.match(p.body, /\$0\.99/);
      assert.match(p.body, /id="pack-terms"/);
      assert.deepEqual(p.ld, [ld]);
      assert.equal(ld.offers.price, "0.99");
      assert.equal(ld.offers.priceCurrency, "USD");
      assert.equal(ld.offers.url, "https://freshcalendars.com/january-2028-calendar/#pack");
      assert.equal(ld.image.length, 3);
      assert.equal(ld.aggregateRating, undefined);
      assert.equal(ld.offers.hasMerchantReturnPolicy.merchantReturnDays, pack.refundDays);
      assert.equal(packContents(pack).length, 4);
      // Every other month stays as it was.
      assert.equal(datedPages(today).filter((x) => x.ld).length, 1);
    } finally { pack.checkoutUrl = was; }
    // The ZIP writer: a stored archive any unzip tool reads.
    const zip = zipStore([{ name: "a.txt", data: Buffer.from("hello") }]);
    assert.equal(zip.readUInt32LE(0), 0x04034b50);
    assert.equal(zip.readUInt32LE(14), 0x3610a686); // CRC-32 of "hello"
    assert.equal(zip.readUInt32LE(zip.length - 22), 0x06054b50);
  });
});
