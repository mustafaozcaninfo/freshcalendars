import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error plain .mjs module without types
import { spangramLetters } from "../src/lib/puzzle-boards.mjs";

test("spangram reveal opens one more letter per nested <details>", () => {
  const html: string = spangramLetters("TrickOrTreat");
  assert.equal((html.match(/<details class="pz-letters">/g) ?? []).length, 12);
  assert.equal((html.match(/<\/details>/g) ?? []).length, 12);
  assert.match(html, /<span class="pz-word-l">T<\/span><span class="pz-word-b" aria-hidden="true">_{11}<\/span> <small>\(1 of 12 letters\)/);
  assert.match(html, /<span class="pz-word-l">TRICKORTREAT<\/span>/);
  // Each step sits inside the one before it, so step 2 cannot open before step 1.
  assert.ok(html.indexOf("Show the first letter") < html.indexOf("Show letter 2"));
  assert.ok(html.indexOf("Show letter 11") < html.indexOf("Show the last letter"));
  assert.ok(!/<div/.test(html), "no <div> in the story body");
});

test("empty spangram draws nothing", () => {
  assert.equal(spangramLetters(""), "");
});
