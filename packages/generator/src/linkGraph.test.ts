import test from "node:test";
import assert from "node:assert/strict";
import { checkLinkGraph, internalPath } from "./linkGraph.js";

test("internalPath keeps our pages and drops files, news and other sites", () => {
  assert.equal(internalPath("https://freshcalendars.com/holidays/", "/"), "/holidays/");
  assert.equal(internalPath("/may-calendars.html#faq", "/"), "/may-calendars.html");
  assert.equal(internalPath("/assets/2026/x.pdf", "/"), null);
  assert.equal(internalPath("/news/story/", "/"), null);
  assert.equal(internalPath("https://shop.freshcalendars.com/", "/"), null);
  assert.equal(internalPath("data:text/calendar,BEGIN", "/"), null);
});

test("checkLinkGraph reports broken links and pages too few others link to", () => {
  const a = (...to: string[]) => to.map((t) => `<a href="${t}">x</a>`).join("");
  const pages = new Map([["/", a("/a/", "/b/", "/gone/")], ["/a/", a("/", "/b/")], ["/b/", a("/")]]);
  const errors = checkLinkGraph(pages, ["/", "/a/", "/b/"], 2);
  assert.deepEqual(errors, ["broken link on /: /gone/", "/a/ is linked from 1 page (minimum 2)"]);
});
