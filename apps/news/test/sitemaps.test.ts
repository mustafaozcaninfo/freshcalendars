import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { absolutizeHtml, newsSitemap, newsWindow, rssFeed, sitemapIndex, urlset, xmlEscape } from "../src/lib/sitemaps.ts";

const now = new Date("2026-10-18T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);

describe("news sitemap", () => {
  const entries = [
    { path: "/news/fresh/", title: "Fresh & new", publishedAt: hoursAgo(1) },
    { path: "/news/edge/", title: "Edge", publishedAt: hoursAgo(48) },
    { path: "/news/old/", title: "Old", publishedAt: hoursAgo(49) },
    { path: "/news/future/", title: "Future", publishedAt: hoursAgo(-2) },
  ];
  it("keeps only the last 48 hours, newest first", () => {
    assert.deepEqual(newsWindow(entries, now).map((e) => e.path), ["/news/fresh/", "/news/edge/"]);
  });
  it("caps at 1000 entries", () => {
    const many = Array.from({ length: 1200 }, (_, i) => ({ path: `/news/a${i}/`, title: "t", publishedAt: hoursAgo(1) }));
    assert.equal(newsWindow(many, now).length, 1000);
  });
  it("writes news: tags and escapes titles", () => {
    const xml = newsSitemap(entries, now);
    assert.match(xml, /xmlns:news="http:\/\/www.google.com\/schemas\/sitemap-news\/0.9"/);
    assert.match(xml, /<news:name>Fresh Calendars<\/news:name>/);
    assert.match(xml, /<news:title>Fresh &amp; new<\/news:title>/);
    assert.match(xml, /<news:publication_date>2026-10-18T11:00:00\+00:00<\/news:publication_date>/);
    assert.equal((xml.match(/<url>/g) ?? []).length, 2);
  });
  it("stays a valid empty urlset with no recent stories", () => {
    assert.match(newsSitemap([], now), /<urlset [^>]+>\n<\/urlset>\n$/);
  });
});

describe("urlset and index", () => {
  it("adds image namespace only when images exist", () => {
    assert.doesNotMatch(urlset([{ path: "/news/" }]), /xmlns:image/);
    const xml = urlset([{ path: "/news/a/", lastmod: now, image: { url: "https://x/a.webp", title: "A <b>" } }]);
    assert.match(xml, /xmlns:image=/);
    assert.match(xml, /<image:title>A &lt;b&gt;<\/image:title>/);
    assert.match(xml, /<loc>https:\/\/freshcalendars.com\/news\/a\/<\/loc>/);
  });
  it("writes a sitemap index with lastmod", () => {
    const xml = sitemapIndex([{ path: "/news/post-sitemap.xml", lastmod: now }]);
    assert.match(xml, /<sitemapindex/);
    assert.match(xml, /<lastmod>2026-10-18T12:00:00\+00:00<\/lastmod>/);
  });
});

describe("rss", () => {
  const item = {
    path: "/news/a/",
    title: "A & B",
    description: "d",
    html: '<p><a href="/when-is/thanksgiving/">x</a> ]]> y</p>',
    publishedAt: hoursAgo(3),
    authors: ["Fresh Calendars News Desk"],
    category: "Holidays",
    image: { url: "https://freshcalendars.com/news/_astro/a.webp", width: 1200, height: 675, alt: "alt" },
  };
  it("absolutizes links and keeps CDATA intact", () => {
    const xml = rssFeed([item]);
    assert.match(xml, /href="https:\/\/freshcalendars.com\/when-is\/thanksgiving\/"/);
    assert.ok(xml.includes("]]]]><![CDATA[>"));
    assert.match(xml, /<guid isPermaLink="true">https:\/\/freshcalendars.com\/news\/a\/<\/guid>/);
    assert.match(xml, /<media:content url="https:\/\/freshcalendars.com\/news\/_astro\/a.webp"/);
    assert.match(xml, /<title>A &amp; B<\/title>/);
  });
  it("caps at 30 items, newest first", () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ ...item, path: `/news/i${i}/`, publishedAt: hoursAgo(i) }));
    const xml = rssFeed(items);
    assert.equal((xml.match(/<item>/g) ?? []).length, 30);
    assert.ok(xml.indexOf("/news/i0/") < xml.indexOf("/news/i1/"));
  });
  it("is deterministic: lastBuildDate is the newest item, omitted when empty", () => {
    assert.match(rssFeed([item]), new RegExp(`<lastBuildDate>${item.publishedAt.toUTCString()}</lastBuildDate>`));
    assert.doesNotMatch(rssFeed([]), /lastBuildDate/);
  });
  it("helpers", () => {
    assert.equal(xmlEscape(`a&<>"'`), "a&amp;&lt;&gt;&quot;&apos;");
    assert.equal(absolutizeHtml('<img src="/x.png"><a href="//cdn/x">'), '<img src="https://freshcalendars.com/x.png"><a href="//cdn/x">');
  });
});
