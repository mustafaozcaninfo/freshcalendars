import assert from "node:assert/strict";
import path from "node:path";
import { it } from "node:test";
import { rehypePuzzleBoards } from "../src/lib/puzzle-boards.mjs";

// Minimal HAST builders: the plugin runs on the tree Astro hands it, with hast text and raw nodes.
type N = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: N[] };
const t = (value: string): N => ({ type: "text", value });
const el = (tagName: string, ...children: N[]): N => ({ type: "element", tagName, properties: {}, children });
const html = (n: N): string => n.type === "text" || n.type === "raw" ? n.value ?? "" : `<${n.tagName}>${(n.children ?? []).map(html).join("")}</${n.tagName}>`;

const ARTICLES = path.resolve(import.meta.dirname, "../src/content/articles/2026/11");
const run = (slug: string, tree: N) => {
  (rehypePuzzleBoards() as (tree: N, file: { path: string }) => void)(tree, { path: path.join(ARTICLES, `${slug}.md`) });
  return tree.children!.map(html).join("\n");
};

it("Wordle: letter reveals, guess tester and the solved board all land in place", () => {
  const out = run("wordle-hint-answer-today-november-2-2026-1962", el("root",
    el("p", t("Intro.")),
    el("h2", t("Six clues, gentle to strong")),
    el("ol", el("li", el("strong", t("First letter:")), t(" S."))),
    el("h2", t("Guessing tips for today")),
    el("p", t("Plain strategy.")),
    el("h2", t("Today's Wordle answer (spoilers)")),
    el("p", el("strong", t("The answer to Wordle #1962 is Scoot."))),
  ));
  const board = out.indexOf("pz-wordle"), answer = out.indexOf("The answer to Wordle #1962");
  assert.ok(board > answer, "solved board sits after the answer line");
  assert.ok(out.includes("pz-letters"), "letter-by-letter reveal");
  assert.ok(out.indexOf("data-wordle-try") < out.indexOf("spoilers"), "guess tester above the spoiler heading");
  assert.ok(!out.includes("SCOOT") || out.indexOf("SCOOT") > out.indexOf("spoilers"), "answer text in capitals only inside the spoiler");
  assert.match(out, /<details>.*Show the solving tips.*Plain strategy/s, "tips behind a tap");
});

it("Connections: each color gets a group reveal, and the tester holds the board out of the text", () => {
  const group = (c: string) => [el("p", el("strong", t(c))), el("ul", el("li", t("Hint 1: a nudge.")))];
  const out = run("nyt-connections-hints-answers-november-2-2026-1240", el("root",
    el("p", t("Intro.")),
    el("h2", t("Hints for each group")),
    ...["Yellow", "Green", "Blue", "Purple"].flatMap(group),
    el("h2", t("Today's Connections answers (spoilers)")),
    el("ul", el("li", el("strong", t("Yellow, Things to Bring on a Trek:")), t(" Backpack, Compass, Hiking Boots, Water Bottle"))),
  ));
  for (const c of ["yellow", "green", "blue", "purple"]) assert.ok(out.includes(`Reveal the ${c} group`), c);
  const tester = out.slice(out.indexOf("data-conn-try"), out.indexOf("</form>"));
  assert.ok(tester.length > 0 && !/Backpack/i.test(tester), "tester keeps the entries encoded");
});
