import assert from "node:assert/strict";
import { it } from "node:test";
import { expectedCtr, fellTwice, gate, opportunities, report, sample, section, weeklyTotals, windows, ymd } from "../../../scripts/news-gsc.mjs";

const day = (date: string, clicks: number, impressions: number) => ({ keys: [date], clicks, impressions });

it("windows are three 7-day blocks ending 3 days before the read", () => {
  const w = windows(new Date("2026-11-10T12:00:00Z"));
  assert.deepEqual(w[0], { start: "2026-11-01", end: "2026-11-07" });
  assert.deepEqual(w[1], { start: "2026-10-25", end: "2026-10-31" });
  assert.deepEqual(w[2], { start: "2026-10-18", end: "2026-10-24" });
});

it("weeklyTotals sums daily rows into the windows", () => {
  const w = windows(new Date("2026-11-10T12:00:00Z"));
  const rows = [day("2026-11-07", 5, 100), day("2026-11-01", 3, 50), day("2026-10-31", 9, 10), day("2026-10-20", 1, 2), day("2026-11-09", 99, 99)];
  const t = weeklyTotals(rows, w);
  assert.deepEqual(t.map((x) => [x.clicks, x.impressions]), [[8, 150], [9, 10], [1, 2]]);
});

it("fellTwice needs two falls in a row, latest week first", () => {
  const wk = (a: number, b: number, c: number) => [a, b, c].map((v) => ({ clicks: v, impressions: v }));
  assert.equal(fellTwice(wk(5, 8, 10), "clicks"), true);
  assert.equal(fellTwice(wk(5, 8, 7), "clicks"), false);
  assert.equal(fellTwice(wk(9, 8, 10), "clicks"), false);
});

it("section tells the news section from the calendar site", () => {
  assert.equal(section("https://freshcalendars.com/news/nba-games-today/"), "news");
  assert.equal(section("https://freshcalendars.com/when-is/thanksgiving/"), "calendar");
  assert.equal(section("https://freshcalendars.com/news-sitemap.xml"), "calendar");
});

it("opportunities keep rankable, under-clicked pairs and rank them by the clicks missing", () => {
  const row = (q: string, page: string, impressions: number, clicks: number, position: number) => ({ keys: [q, page], impressions, clicks, position });
  const out = opportunities([
    row("first night of hanukkah 2026", "https://freshcalendars.com/news/hanukkah/", 1890, 2, 8),   // missing ~ 64
    row("thanksgiving canada 2027", "https://freshcalendars.com/news/canada-holidays/", 963, 10, 6), // missing ~ 24
    row("already winning", "https://freshcalendars.com/news/a/", 500, 140, 1.2),                     // position 1: skipped
    row("too small", "https://freshcalendars.com/news/b/", 20, 0, 9),                                // impressions below the floor
    row("fine ctr", "https://freshcalendars.com/news/c/", 300, 30, 9),                               // 10% at position 9: nothing missing
    row("deep", "https://freshcalendars.com/news/d/", 900, 0, 45),                                   // position 45: out of reach
  ]);
  assert.deepEqual(out.map((o) => o.query), ["first night of hanukkah 2026", "thanksgiving canada 2027"]);
  assert.ok(out[0]!.missing > out[1]!.missing);
  assert.ok(expectedCtr(1) > expectedCtr(8));
});

it("sample spreads over the list", () => {
  assert.deepEqual(sample([1, 2, 3], 5), [1, 2, 3]);
  assert.deepEqual(sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5), [1, 3, 5, 7, 9]);
});

it("gate: index share, two falling weeks, and the checks the API cannot do", () => {
  const wk = (a: number, b: number, c: number) => [a, b, c].map((v) => ({ clicks: v, impressions: v }));
  const g = gate({ news: wk(6, 8, 10), indexed: { checked: 30, indexed: 15 } });
  assert.equal(g[0]!.pass, false);
  assert.equal(g[1]!.pass, false);
  assert.equal(g[2]!.pass, null);
  const ok = gate({ news: wk(10, 8, 9), indexed: { checked: 30, indexed: 24 } });
  assert.equal(ok[0]!.pass, true);
  assert.equal(ok[1]!.pass, true);
  assert.equal(gate({ news: wk(1, 1, 1), indexed: { checked: 0, indexed: 0 } })[0]!.pass, null);
});

it("report names the gate, the opportunities and the pages", () => {
  const wk = (a: number) => [0, 1, 2].map((i) => ({ start: `2026-11-0${i + 1}`, end: `2026-11-0${i + 2}`, clicks: a, impressions: a * 10 }));
  const md = report({
    generatedAt: "2026-11-10T09:10:00Z", site: "sc-domain:freshcalendars.com",
    weeks: { news: wk(5), calendar: wk(2) },
    gate: gate({ news: wk(5), indexed: { checked: 10, indexed: 8 } }),
    opportunities: [{ query: "q one", page: "https://freshcalendars.com/news/x/", impressions: 200, clicks: 1, position: 7.2, missing: 5 }],
    pages: { news: [{ page: "https://freshcalendars.com/news/x/", clicks: 9, impressions: 300, position: 6 }], calendar: [] },
    indexed: { checked: 10, indexed: 8, notIndexed: [{ url: "https://freshcalendars.com/news/y/", status: "not indexed", state: "Crawled - currently not indexed" }], unknown: 0 },
  });
  assert.match(md, /PASS: At least 60%/);
  assert.match(md, /5 missing: "q one" → \/news\/x\//);
  assert.match(md, /\/news\/y\/ \(Crawled - currently not indexed\)/);
  assert.equal(ymd(Date.parse("2026-11-10T23:59:00Z")), "2026-11-10");
});
