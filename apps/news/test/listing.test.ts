import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pagePath, pagedTitle, paginate } from "../src/lib/listing.ts";
import { listingGraph } from "../src/lib/seo.ts";

type Node = Record<string, any>;

describe("paginate", () => {
  it("puts page 1 at the base and never emits /page/1/", () => {
    const pages = paginate(Array.from({ length: 45 }, (_, i) => i), "/news/");
    assert.deepEqual(pages.map((p) => p.path), ["/news/", "/news/page/2/", "/news/page/3/"]);
    assert.equal(pages[0]!.prevPath, undefined);
    assert.equal(pages[1]!.prevPath, "/news/");
    assert.equal(pages[2]!.items.length, 5);
    assert.equal(pages[2]!.nextPath, undefined);
  });
  it("returns one empty page for no items", () => {
    const pages = paginate([], "/news/category/x/");
    assert.equal(pages.length, 1);
    assert.equal(pages[0]!.items.length, 0);
  });
  it("builds paths and titles", () => {
    assert.equal(pagePath("/news/category/holidays/", 2), "/news/category/holidays/page/2/");
    assert.equal(pagedTitle("Holidays News", 1), "Holidays News | Fresh Calendars");
    assert.equal(pagedTitle("Holidays News", 3), "Holidays News – Page 3 | Fresh Calendars");
  });
});

describe("listingGraph", () => {
  const base = {
    path: "/news/category/holidays/",
    name: "Holidays News",
    description: "d",
    trail: [{ name: "News", path: "/news/" }, { name: "Holidays", path: "/news/category/holidays/" }],
    items: [{ path: "/news/a/", name: "A" }, { path: "/news/b/", name: "B" }],
  };
  it("emits CollectionPage + ItemList with numeric positions", () => {
    const g = listingGraph({ ...base, kind: "CollectionPage" })["@graph"] as Node[];
    const page = g.find((n) => n["@type"] === "CollectionPage")!;
    const list = g.find((n) => n["@type"] === "ItemList")!;
    assert.equal(page.mainEntity["@id"], list["@id"]);
    assert.deepEqual(list.itemListElement.map((i: Node) => i.position), [1, 2]);
    const crumbs = g.find((n) => n["@type"] === "BreadcrumbList")!.itemListElement as Node[];
    assert.deepEqual(crumbs.map((c) => c.item.name), ["Home", "News", "Holidays"]);
  });
  it("emits ProfilePage whose mainEntity is the author node", () => {
    const g = listingGraph({
      ...base,
      kind: "ProfilePage",
      author: { kind: "Organization", name: "Fresh Calendars News Desk", path: "/news/author/news-desk/", sameAs: [], description: "bio" },
    })["@graph"] as Node[];
    const page = g.find((n) => n["@type"] === "ProfilePage")!;
    assert.equal(page.mainEntity["@id"], "https://freshcalendars.com/news/author/news-desk/");
    assert.ok(g.some((n) => n["@id"] === page.mainEntity["@id"] && n.description === "bio"));
  });
});
