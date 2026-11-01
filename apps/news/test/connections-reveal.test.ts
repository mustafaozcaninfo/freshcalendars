import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rehypeConnectionsReveal } from "../src/lib/connections-reveal.mjs";

type Node = Record<string, any>;

const t = (value: string): Node => ({ type: "text", value });
const el = (tagName: string, children: Node[], properties: Node = {}): Node => ({ type: "element", tagName, properties, children });
const group = (label: string, words: string): Node => el("li", [el("strong", [t(label)]), t(` ${words}`)]);
const spoilers = (): Node => el("ul", [
  group("Yellow, Words Meaning Good:", "Gnarly, Killer, Sick, Wicked"),
  group("Purple, Starting With Dog Commands:", "Downfall, Shakespeare, Sitcom, Staycation"),
  el("li", [t("A plain line stays as it is")]),
]);

function run(slug: string, kids: Node[]) {
  const tree = { type: "root", children: kids };
  rehypeConnectionsReveal()(tree, { path: `/x/src/content/articles/2026/10/${slug}.md` });
  return tree.children;
}
const page = "nyt-connections-hints-answers-october-31-2026-1238";

describe("rehypeConnectionsReveal", () => {
  it("turns each group line in the spoiler section into a details with the words inside", () => {
    const kids = run(page, [el("h2", [t("Today's Connections answers (spoilers)")]), spoilers()]);
    const [a, b, c] = kids[1].children;
    const d = a.children[0];
    assert.equal(d.tagName, "details");
    assert.deepEqual(d.properties.className, ["pz-hint", "pz-group"]);
    assert.equal(d.children[0].children[0].value, "Yellow, Words Meaning Good");
    assert.equal(d.children[1].children[0].value, "Gnarly, Killer, Sick, Wicked");
    assert.equal(b.children[0].children[0].children[0].value, "Purple, Starting With Dog Commands");
    assert.equal(c.children[0].type, "text");
  });
  it("leaves lists outside the spoiler section and other games alone", () => {
    const hints = run(page, [el("h2", [t("Hints for each group")]), spoilers(), el("h2", [t("Answers (spoilers)")])]);
    assert.equal(hints[1].children[0].children[0].tagName, "strong");
    const other = run("nyt-strands-hints-answers-october-31-2026-600", [el("h2", [t("Answers (spoilers)")]), spoilers()]);
    assert.equal(other[1].children[0].children[0].tagName, "strong");
  });
});
