import assert from "node:assert/strict";
import { it } from "node:test";
import { withFeaturedFirst } from "../src/lib/featured";

const story = (id: string, published: string, featuredUntil?: string, category = "elections") =>
  ({ id, data: { publishedAt: new Date(published), featuredUntil: featuredUntil ? new Date(featuredUntil) : undefined, category: { id: category } } }) as never;

const newest = story("newest", "2026-11-03T09:00:00-05:00");
const pinned = story("pinned", "2026-10-20T10:30:00-04:00", "2026-11-04T02:00:00-05:00");
const expired = story("expired", "2026-10-30T10:00:00-04:00", "2026-11-01T00:00:00-04:00");
const ids = (list: { id: string }[]) => list.map((s) => s.id);

it("news home lead: a pinned story leads until featuredUntil, then the newest story does", () => {
  const noon = new Date("2026-11-03T17:00:00Z");
  assert.deepEqual(ids(withFeaturedFirst([newest, expired], [newest, pinned, expired], noon)), ["pinned", "newest", "expired"]);
  assert.deepEqual(ids(withFeaturedFirst([newest, pinned], [newest, pinned], new Date("2026-11-04T08:00:00Z"))), ["newest", "pinned"]);
  assert.deepEqual(ids(withFeaturedFirst([newest], [newest, expired], noon)), ["newest"], "an expired pin is ignored");
});

it("news home lead: an unpublished or puzzle story is never pinned", () => {
  const noon = new Date("2026-11-03T17:00:00Z");
  const scheduled = story("scheduled", "2026-11-05T09:00:00-05:00", "2026-11-06T00:00:00-05:00");
  const puzzle = story("puzzle", "2026-11-03T00:05:00-05:00", "2026-11-04T00:00:00-05:00", "puzzles");
  assert.deepEqual(ids(withFeaturedFirst([newest], [newest, scheduled, puzzle], noon)), ["newest"]);
});
