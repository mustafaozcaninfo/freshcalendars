import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NEWS_AD_UNITS, rehypeMidArticleAd } from "../src/lib/ad-units.mjs";

type Node = Record<string, any>;

const h2 = (t: string): Node => ({ type: "element", tagName: "h2", children: [{ type: "text", value: t }] });
const p = (words: number): Node => ({ type: "element", tagName: "p", children: [{ type: "text", value: "word ".repeat(words).trim() }] });
/** A story body: one paragraph of `words` per H2 section. */
const story = (sections: [string, number][]): Node => ({ type: "root", children: sections.flatMap(([t, w]) => [h2(t), p(w)]) });

function place(tree: Node, frontmatter: Node = {}) {
  const file = { path: "/x/src/content/articles/2026/10/s.md", data: { astro: { frontmatter } } };
  rehypeMidArticleAd()(tree, file);
  const kids: Node[] = tree.children;
  // For each ad, the heading of the section that follows it, and its unit ID.
  const ads = kids.flatMap((n, i) => (n.tagName === "aside" ? [{ before: kids[i + 1]?.children[0].value, slot: n.children[0].properties.dataAdSlot }] : []));
  return { ads, count: frontmatter.adsInBody };
}

describe("rehypeMidArticleAd", () => {
  it("skips stories with fewer than four sections", () => {
    assert.deepEqual(place(story([["A", 300], ["B", 300], ["C", 300]])).ads, []);
  });
  it("puts the first unit before the third section and spaces the second by words", () => {
    const { ads, count } = place(story([["A", 200], ["B", 200], ["C", 200], ["D", 200], ["E", 200], ["F", 200]]));
    assert.deepEqual(ads, [{ before: "C", slot: NEWS_AD_UNITS[1] }, { before: "E", slot: NEWS_AD_UNITS[5] }]);
    assert.equal(count, 2);
  });
  it("keeps one unit when the rest of the story is too short", () => {
    const { ads, count } = place(story([["A", 200], ["B", 200], ["C", 100], ["D", 100], ["E", 50]]));
    assert.deepEqual(ads.map((a) => a.before), ["C"]);
    assert.equal(count, 1);
  });
  it("never places a unit inside a spoiler section", () => {
    // Right before a spoiler heading is fine (a pause before the answers)...
    const open = place(story([["A", 200], ["B", 200], ["Hints", 400], ["Answers (spoilers)", 400], ["Tips", 300]]));
    assert.deepEqual(open.ads.map((a) => a.before), ["Hints", "Answers (spoilers)"]);
    // ...but never after answers, between two spoiler sections or below the last one.
    const closed = place(story([["A", 200], ["B", 200], ["Hints", 200], ["Answers (spoilers)", 400], ["Yesterday's answers (spoilers)", 400], ["Tips", 300]]));
    assert.deepEqual(closed.ads.map((a) => a.before), ["Hints"]);
  });
  it("keeps units away from printables and story tools", () => {
    const tree = story([["A", 200], ["B", 200], ["C", 200], ["D", 300], ["E", 50]]);
    // Section B ends with a printable thumbnail link, so the slot before C moves down to D.
    tree.children.splice(4, 0, { type: "element", tagName: "p", children: [{ type: "element", tagName: "a", properties: { className: ["tpl"], href: "/news/downloads/x/x.pdf" }, children: [] }] });
    assert.deepEqual(place(tree).ads.map((a) => a.before), ["D"]);
  });
  it("gives election stories one unit", () => {
    const sections: [string, number][] = [["A", 300], ["B", 300], ["C", 300], ["D", 300], ["E", 300], ["F", 300]];
    assert.equal(place(story(sections), { category: "elections" }).ads.length, 1);
  });
  it("leaves policy pages alone", () => {
    const tree = story([["A", 300], ["B", 300], ["C", 300], ["D", 300]]);
    rehypeMidArticleAd()(tree, { path: "/x/src/content/policies/about.md", data: {} });
    assert.equal(tree.children.some((n: Node) => n.tagName === "aside"), false);
  });
});
