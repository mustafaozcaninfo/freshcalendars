/**
 * Rehype plugin for the daily Connections pages: in the answers (spoilers) section, each
 * "**Yellow, Group name:** words" line becomes a tap-to-reveal <details>. The color and group name
 * stay visible as the summary and the four words open on tap, so a reader can check one group
 * without seeing the rest. The words stay in the HTML (crawlable, no JavaScript; audit
 * 02-NO-JS-CONTENT). Runs after rehypePuzzleBoards, which has already drawn the solved board from
 * the plain list; the board under the list stays as it is. Same markup and look as the hint
 * reveals there (details.pz-hint), with its own button label (details.pz-group).
 */
import path from "node:path";
import { puzzleOf } from "./puzzles.mjs";

const SPOILER = /\bspoilers?\b/i;
const GROUP = /^(Yellow|Green|Blue|Purple), (.+?):?$/;

const text = (n) => (n?.type === "text" ? n.value : (n?.children ?? []).map(text).join(""));

export function rehypeConnectionsReveal() {
  return (tree, file) => {
    const fp = file?.path ?? file?.history?.[0] ?? "";
    if (!/[\\/]content[\\/]articles[\\/]/.test(fp)) return;
    if (puzzleOf(path.basename(fp).replace(/\.mdx?$/, ""))?.game !== "connections") return;
    const kids = tree.children;
    const h = kids.findIndex((n) => n.type === "element" && n.tagName === "h2" && SPOILER.test(text(n)));
    if (h < 0) return;
    // The first list after the spoiler heading, before the next H2.
    for (let i = h + 1; i < kids.length; i++) {
      const n = kids[i];
      if (n.type === "element" && n.tagName === "h2") return;
      if (n.type === "element" && n.tagName === "ul") return revealGroups(n);
    }
  };
}

function revealGroups(ul) {
  for (const li of ul.children) {
    if (li.type !== "element" || li.tagName !== "li") continue;
    const kids = li.children.filter((c) => !(c.type === "text" && !c.value.trim()));
    if (kids[0]?.tagName !== "strong") continue;
    const m = text(kids[0]).trim().match(GROUP);
    if (!m) continue;
    const rest = kids.slice(1);
    // "**Yellow, Group:** words" puts the colon inside the bold; "**Yellow, Group**: words" after it.
    if (rest[0]?.type === "text") rest[0] = { ...rest[0], value: rest[0].value.replace(/^\s*:?\s*/, "") };
    if (!text({ children: rest }).trim()) continue;
    li.children = [{
      type: "element", tagName: "details", properties: { className: ["pz-hint", "pz-group"] },
      children: [
        { type: "element", tagName: "summary", properties: {}, children: [{ type: "text", value: `${m[1]}, ${m[2]}` }] },
        { type: "element", tagName: "span", properties: {}, children: rest },
      ],
    }];
  }
}
