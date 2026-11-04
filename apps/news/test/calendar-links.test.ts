import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { it } from "node:test";
import { MAX_PINS, pinTarget, withPinned, type LinkStory } from "../src/lib/calendar-links.ts";

const st = (n: string): LinkStory => ({ title: `Story ${n}`, url: `https://freshcalendars.com/news/${n}/`, publishedAt: "2026-10-20T12:00:00.000Z" });

it("a /when-is/ page is keyed by its slug, every other page by its path", () => {
  assert.deepEqual(pinTarget("/when-is/thanksgiving/"), { kind: "slug", key: "thanksgiving" });
  assert.deepEqual(pinTarget("/when-is/ca-thanksgiving"), { kind: "slug", key: "ca-thanksgiving" });
  assert.deepEqual(pinTarget("/canada-holidays/"), { kind: "path", key: "/canada-holidays/" });
  assert.deepEqual(pinTarget("/september-calendars.html"), { kind: "path", key: "/september-calendars.html" });
});

it("pinned stories lead, each story appears once, and the box keeps its size", () => {
  const list = [st("a"), st("b"), st("c"), st("d")];
  assert.deepEqual(withPinned(list, [st("c")], 3).map((s) => s.title), ["Story c", "Story a", "Story b"]);
  assert.deepEqual(withPinned(list, [st("a")], 3).map((s) => s.title), ["Story a", "Story b", "Story c"], "already in the list: not shown twice");
  assert.deepEqual(withPinned(undefined, [st("x")], 3).map((s) => s.title), ["Story x"], "a page with no other stories");
  assert.deepEqual(withPinned(list, [], 2).map((s) => s.title), ["Story a", "Story b"], "no pins: unchanged order");
});

it("calendar-pins.json names real stories, at most two a page, on calendar pages", () => {
  const root = path.join(import.meta.dirname, "..");
  const pins = JSON.parse(readFileSync(path.join(root, "calendar-pins.json"), "utf8")) as Record<string, string[]>;
  const slugs = new Set<string>();
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(d, e.name));
      else if (e.name.endsWith(".md")) slugs.add(e.name.slice(0, -3));
    }
  };
  walk(path.join(root, "src/content/articles"));
  for (const [page, ids] of Object.entries(pins)) {
    assert.ok(page.startsWith("/") && !page.startsWith("/news/"), `${page} must be a calendar-site path`);
    assert.ok(ids.length >= 1 && ids.length <= MAX_PINS, `${page}: 1 to ${MAX_PINS} pins`);
    for (const id of ids) assert.ok(slugs.has(id), `${page}: no story file named ${id}`);
  }
});
