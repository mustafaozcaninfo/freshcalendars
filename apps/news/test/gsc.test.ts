import assert from "node:assert/strict";
import { it } from "node:test";
import { cannibalization, canonicalRows, expectedCtr, fellTwice, gate, imageGaps, measureExperiment, movers, opportunities, report, sample, section, weeklyTotals, windows, ymd } from "../../../scripts/news-gsc.mjs";

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
    row("why thanksgiving", "https://freshcalendars.com/news/e/", 40000, 8, 3.4),                    // position 3.4 earning 0.02%: a snippet problem
  ]);
  assert.deepEqual(out.map((o) => o.query), ["why thanksgiving", "first night of hanukkah 2026", "thanksgiving canada 2027"]);
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
    indexed: { checked: 10, indexed: 8, notIndexed: [{ url: "https://freshcalendars.com/news/y/", status: "not indexed", state: "Crawled - currently not indexed", age: 9 }], states: { "Submitted and indexed": 8, "Crawled - currently not indexed": 2 }, unknown: 0 },
    image: { pages: [{ page: "https://freshcalendars.com/news/x/", clicks: 2, impressions: 400, position: 5 }], gaps: [{ page: "https://freshcalendars.com/news/z/", impressions: 900, clicks: 1, position: 4 }] },
    cannibalization: [{ query: "wordle hint", total: 500, pages: [{ page: "https://freshcalendars.com/news/a/", impressions: 300, clicks: 5, position: 6 }, { page: "https://freshcalendars.com/news/b/", impressions: 200, clicks: 1, position: 9 }] }],
    movers: { decliners: [{ page: "https://freshcalendars.com/news/old/", clicks: 5, prevClicks: 40, impressions: 100, prevImpressions: 900 }], risers: [] },
    sitemaps: [{ path: "https://freshcalendars.com/news/sitemap.xml", errors: 0, warnings: 1, submitted: 700, lastDownloaded: "2026-11-03T05:00:00Z" }],
    experiments: [{ slug: "x", changedAt: "2026-10-20", what: "title", before: { clicks: 4, impressions: 400, ctr: 1, position: 7 }, after: null, daysAfter: 8 }],
  });
  assert.match(md, /PASS: At least 60%/);
  assert.match(md, /5 missing: "q one" → \/news\/x\//);
  assert.match(md, /not indexed: \/news\/y\/ \(Crawled - currently not indexed\), 9 days old/);
  assert.match(md, /8 Submitted and indexed, 2 Crawled - currently not indexed/);
  assert.match(md, /"wordle hint" \(500 impressions\)/);
  assert.match(md, /\/news\/old\/: 40 → 5 clicks/);
  assert.match(md, /\/news\/z\/: 900 web impressions/);
  assert.match(md, /x \(changed 2026-10-20\).*after: not yet \(8 of 15 days\)/);
  assert.equal(ymd(Date.parse("2026-11-10T23:59:00Z")), "2026-11-10");
});

const pair = (q: string, page: string, impressions: number, clicks = 0, position = 8) => ({ keys: [q, page], impressions, clicks, position });

it("cannibalization lists queries that show two or more of our pages", () => {
  const out = cannibalization([
    pair("black friday ads 2026", "https://freshcalendars.com/news/a/", 400),
    pair("black friday ads 2026", "https://freshcalendars.com/news/b/", 200),
    pair("thanksgiving 2026", "https://freshcalendars.com/news/c/", 900),
    pair("weak overlap", "https://freshcalendars.com/news/d/", 60),
    pair("weak overlap", "https://freshcalendars.com/news/e/", 40),
    pair("tiny", "https://freshcalendars.com/news/f/", 10),
    pair("tiny", "https://freshcalendars.com/news/g/", 10),
  ]);
  assert.deepEqual(out.map((c) => c.query), ["black friday ads 2026"]);
  assert.equal(out[0]!.total, 600);
  assert.equal(out[0]!.pages[0]!.page, "https://freshcalendars.com/news/a/");
});

it("movers separates pages that lost clicks from pages that gained them", () => {
  const page = (u: string, clicks: number, impressions: number) => ({ keys: [`https://freshcalendars.com/news/${u}/`], clicks, impressions, position: 5 });
  const m = movers(
    [page("fell", 10, 500), page("rose", 60, 900), page("flat", 30, 300), page("small", 4, 50)],
    [page("fell", 50, 2000), page("rose", 20, 400), page("flat", 28, 290), page("gone", 45, 800)],
    { minPrevClicks: 0 },
  );
  assert.deepEqual(m.decliners.map((p) => p.page.split("/")[4]), ["gone", "fell"]);
  assert.deepEqual(m.risers.map((p) => p.page.split("/")[4]), ["rose"]);
});

it("imageGaps names news pages that rank on the web but have no image impressions", () => {
  const web = (u: string, impressions: number) => ({ keys: [u], clicks: 3, impressions, position: 6 });
  const out = imageGaps(
    [web("https://freshcalendars.com/news/a/", 900), web("https://freshcalendars.com/news/b/", 500), web("https://freshcalendars.com/news/c/", 50), web("https://freshcalendars.com/when-is/x/", 800), web("https://freshcalendars.com/news/downloads/y/z.pdf", 700)],
    [{ keys: ["https://freshcalendars.com/news/b/"], clicks: 1, impressions: 80, position: 9 }],
  );
  assert.deepEqual(out.map((p) => p.page), ["https://freshcalendars.com/news/a/"]);
});

it("measureExperiment compares 14 days before with 14 days after, once the data is in", () => {
  const rows: { keys: string[]; clicks: number; impressions: number; position: number }[] = [];
  const add = (date: string, clicks: number, impressions: number, position: number) => rows.push({ keys: [date, "https://freshcalendars.com/news/a/"], clicks, impressions, position });
  for (let d = 6; d <= 19; d++) add(`2026-10-${String(d).padStart(2, "0")}`, 1, 100, 9);  // before the change on Oct. 20
  add("2026-10-20", 5, 100, 9);                                                              // the change day: left out
  for (let d = 21; d <= 31; d++) add(`2026-10-${d}`, 3, 100, 7);
  for (let d = 1; d <= 3; d++) add(`2026-11-0${d}`, 3, 100, 7);
  const done = measureExperiment(rows, "2026-10-20", new Date("2026-11-10T00:00:00Z"));
  assert.equal(done.before.clicks, 14);
  assert.equal(done.after?.clicks, 42);
  assert.equal(done.after?.position, 7);
  assert.equal(done.after?.ctr, 3);
  const early = measureExperiment(rows, "2026-10-20", new Date("2026-11-02T00:00:00Z"));
  assert.equal(early.after, null);
  assert.equal(early.daysAfter, 10);
});

it("canonicalRows folds jump links into their story, weighting the position by impressions", () => {
  const row = (page: string, clicks: number, impressions: number, position: number) => ({ keys: [page], clicks, impressions, position });
  const out = canonicalRows([
    row("https://freshcalendars.com/news/a/", 10, 100, 4),
    row("https://freshcalendars.com/news/a/#heading", 2, 300, 8),
    row("https://freshcalendars.com/news/b/", 1, 50, 6),
  ]);
  assert.equal(out.length, 2);
  assert.deepEqual([out[0]!.keys[0], out[0]!.clicks, out[0]!.impressions, out[0]!.position], ["https://freshcalendars.com/news/a/", 12, 400, 7]);
  const pair = canonicalRows([{ keys: ["q", "https://freshcalendars.com/news/a/#x"], clicks: 1, impressions: 10, position: 3 }, { keys: ["q", "https://freshcalendars.com/news/a/"], clicks: 0, impressions: 10, position: 5 }]);
  assert.equal(pair.length, 1);
  assert.equal(pair[0]!.position, 4);
});

it("movers says nothing when the earlier window has no data to compare", () => {
  const page = (u: string, clicks: number) => ({ keys: [`https://freshcalendars.com/news/${u}/`], clicks, impressions: clicks * 10, position: 5 });
  const m = movers([page("a", 300), page("b", 200)], [page("a", 20)]);
  assert.deepEqual([m.decliners.length, m.risers.length], [0, 0]);
  assert.match(String(m.note), /too little data/);
});
