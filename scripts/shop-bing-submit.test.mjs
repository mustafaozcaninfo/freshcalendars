// Which shop pages go to Bing first (scripts/shop-bing-submit.mjs).
import assert from "node:assert/strict";
import { test } from "node:test";
import { locs, pick, priorityList, rank } from "./shop-bing-submit.mjs";

const S = "https://shop.freshcalendars.com";
const urls = [`${S}/about`, `${S}/products/old`, `${S}/products/new`, `${S}/categories/advent-calendars`, `${S}/articles/guide`, `${S}/tags/24-day`, `${S}/brands/lego`];

test("listing pages lead, then products newest first", () => {
  assert.deepEqual(pick(urls, {}, 10, "2026-11-25").map((u) => u.replace(S, "")),
    ["/categories/advent-calendars", "/tags/24-day", "/articles/guide", "/products/new", "/products/old", "/brands/lego", "/about"]);
  assert.ok(rank(`${S}/`) < rank(`${S}/categories/x`));
});

test("the quota caps the list and submitted pages wait", () => {
  const sent = { "/categories/advent-calendars": "2026-11-24", "/tags/24-day": "2026-11-24" };
  assert.deepEqual(pick(urls, sent, 2, "2026-11-25").map((u) => u.replace(S, "")), ["/articles/guide", "/products/new"]);
  assert.deepEqual(pick(urls, sent, 0, "2026-11-25"), []);
});

test("a page comes round again after 45 days, behind the pages never sent", () => {
  const sent = { "/categories/advent-calendars": "2026-10-01", "/tags/24-day": "2026-11-20" };
  const out = pick(urls, sent, 10, "2026-11-25").map((u) => u.replace(S, ""));
  assert.equal(out.at(-1), "/categories/advent-calendars");
  assert.ok(!out.includes("/tags/24-day"));
});

test("sitemap locations", () => {
  assert.deepEqual(locs("<url><loc>https://a/b?x=1&amp;y=2</loc></url><url>\n<loc> https://a/c </loc></url>"), ["https://a/b?x=1&y=2", "https://a/c"]);
});

test("the priority file leads, in its own order, and skips what was sent", () => {
  const pr = priorityList("# note\n/products/old\n\n/tags/24-day\n/categories/advent-calendars\n");
  assert.deepEqual(pr, ["/products/old", "/tags/24-day", "/categories/advent-calendars"]);
  assert.deepEqual(pick(urls, { "/tags/24-day": "2026-11-25" }, 3, "2026-11-26", pr).map((u) => u.replace(S, "")),
    ["/products/old", "/categories/advent-calendars", "/articles/guide"]);
});
