import assert from "node:assert/strict";
import { it } from "node:test";
import { pickRelated } from "../src/lib/related.ts";

const c = (id: string, category: string, keywords: string[], day: number) => ({
  id, category, keywords, publishedAt: new Date(Date.UTC(2026, 9, day)),
});

it("prefers pinned, then same category, then shared keywords, then recency", () => {
  const cur = c("cur", "holidays", ["thanksgiving 2026"], 17);
  const pool = [
    cur,
    c("other-cat-new", "sky-events", [], 18),
    c("same-cat-old", "holidays", [], 1),
    c("same-cat-kw", "holidays", ["Thanksgiving 2026"], 2),
    c("pinned", "planning", [], 3),
  ];
  assert.deepEqual(pickRelated(cur, pool, ["pinned", "cur"]).map((x) => x.id), ["pinned", "same-cat-kw", "same-cat-old"]);
});
