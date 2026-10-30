import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  articleGraph,
  articleHeadTags,
  countWords,
  formatDateTimeET,
  isoDateTime,
  jsonLdString,
  readingMinutes,
  type ArticleSeo,
} from "../src/lib/seo.ts";

const img = (w: number, h: number) => ({ url: `https://freshcalendars.com/news/_astro/x-${w}x${h}.webp`, width: w, height: h });

const article: ArticleSeo = {
  slug: "veterans-day-2026-wednesday-november-11",
  title: "Veterans Day 2026 Is Wednesday, Nov. 11: What Is Open and Closed",
  description: "Veterans Day 2026 falls on Wednesday, Nov. 11.",
  type: "update",
  publishedAt: new Date("2026-10-17T21:00:00Z"),
  modifiedAt: new Date("2026-10-17T22:00:00Z"),
  authors: [{ kind: "Organization", name: "Fresh Calendars News Desk", path: "/news/author/news-desk/", sameAs: [] }],
  category: { slug: "holidays", name: "Holidays" },
  keywords: ["Veterans Day 2026", "November 11 2026"],
  hero: { main: { ...img(1344, 756), type: "image/webp" }, crops: [img(1200, 675), img(1200, 900), img(1200, 1200)], alt: "Calendar page marked Nov. 11" },
  wordCount: 450,
  readingMinutes: 2,
};

type Node = Record<string, any>;
const graph = articleGraph(article)["@graph"] as Node[];
const byType = (t: string) => graph.filter((n) => n["@type"] === t);

describe("articleGraph", () => {
  it("has the tech-insider node set", () => {
    for (const t of ["Organization", "WebSite", "ImageObject", "BreadcrumbList", "WebPage", "NewsArticle"]) {
      assert.ok(byType(t).length >= 1, `missing ${t}`);
    }
  });
  it("uses numeric breadcrumb positions Home → News → Category → Article", () => {
    const items = byType("BreadcrumbList")[0]!.itemListElement as Node[];
    assert.deepEqual(items.map((i) => i.position), [1, 2, 3, 4]);
    assert.deepEqual(items.map((i) => i.item.name), ["Home", "News", "Holidays", article.title]);
  });
  it("lists the og:image first, then three ≥1200px crops, with ISO dates and offset", () => {
    const art = byType("NewsArticle")[0]!;
    assert.equal(art.image.length, 4);
    assert.equal(art.image[0], article.hero.main.url);
    assert.match(art.datePublished, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/);
    assert.equal(art.dateModified, "2026-10-17T22:00:00+00:00");
    assert.ok(art.headline.length <= 110);
    assert.equal(art.isAccessibleForFree, true);
  });
  it("links author and publisher by @id to real nodes", () => {
    const ids = new Set(graph.map((n) => n["@id"]));
    const art = byType("NewsArticle")[0]!;
    assert.ok(ids.has(art.publisher["@id"]));
    for (const a of art.author) assert.ok(ids.has(a["@id"]), `author ${a["@id"]} has no node`);
  });
  it("keeps every story type as NewsArticle and moves the type to genre", () => {
    const node = (type: ArticleSeo["type"]) => (articleGraph({ ...article, type })["@graph"] as Node[]).at(-1)!;
    assert.equal(node("explainer")["@type"], "NewsArticle");
    assert.equal(node("analysis")["@type"], "NewsArticle");
    assert.equal(node("explainer").genre, "Explainer");
  });
  it("types each author and gives it a url", () => {
    const art = byType("NewsArticle")[0]!;
    for (const a of art.author) { assert.ok(a["@type"]); assert.ok(a.url); }
  });
  it("links the Organization to the published trust pages", () => {
    const org = byType("Organization")[0]!;
    assert.equal(org.publishingPrinciples, "https://freshcalendars.com/news/editorial-policy/");
    assert.equal(org.ownershipFundingInfo, "https://freshcalendars.com/news/about/#who-publishes-fresh-calendars-news");
    assert.equal(org.verificationFactCheckingPolicy, "https://freshcalendars.com/news/editorial-policy/#accuracy");
    assert.equal((org.contactPoint as { email: string }).email, "info@freshcalendars.com");
    assert.equal(org.correctionsPolicy, "https://freshcalendars.com/news/corrections-policy/");
    assert.equal(org.masthead, "https://freshcalendars.com/news/masthead/");
    assert.equal(org.logo.width, 512);
  });
  it("names the publishing company and its address, and carries no dateline", () => {
    const org = byType("Organization")[0]!;
    assert.equal(org.legalName, "Fresh Calendars, Inc.");
    assert.equal(org.address.addressLocality, "Portland");
    assert.equal(org.address.postalCode, "97229");
    assert.equal(byType("NewsArticle")[0]!.dateline, undefined);
  });
});

describe("articleHeadTags", () => {
  const tags = articleHeadTags(article);
  const val = (k: string) => tags.find((t) => t.attrs.property === k || t.attrs.name === k)?.attrs.content;
  it("covers the og/article/twitter set", () => {
    for (const k of ["og:image", "og:image:width", "og:image:height", "og:image:alt", "og:image:type", "og:updated_time", "article:section", "article:published_time", "article:modified_time", "twitter:label1", "twitter:data2"]) {
      assert.ok(val(k), `missing ${k}`);
    }
    assert.equal(val("twitter:data2"), "2 minutes");
  });
});

describe("helpers", () => {
  it("escapes < in JSON-LD", () => assert.equal(jsonLdString({ a: "</script>" }), '{"a":"\\u003c/script>"}'));
  it("counts words and minutes", () => {
    assert.equal(countWords("## Head\n\nOne [two](/x) three."), 4);
    assert.equal(readingMinutes(100), 1);
    assert.equal(readingMinutes(900), 4);
  });
  it("formats ET times", () => assert.equal(formatDateTimeET(new Date("2026-10-17T20:00:00Z")), "October 17, 2026, 4:00 p.m. ET"));
  it("formats ISO without ms", () => assert.equal(isoDateTime(new Date("2026-01-02T03:04:05.678Z")), "2026-01-02T03:04:05+00:00"));
});
