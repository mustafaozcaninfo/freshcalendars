import { test } from "node:test";
import assert from "node:assert/strict";
import { releaseTracker } from "./releaseTracker.ts";
import { THEMES } from "./themes.ts";

const kctx = (publishedAt = "2026-11-01T09:00:00-05:00") => ({ storySlug: "s", category: "gaming-tech", sources: [{ url: "https://a.gov/x", publisher: "A" }, { url: "https://b.gov/y", publisher: "B" }], theme: THEMES["gaming-tech"]!, fonts: "", publishedAt });
const prn = () => ({ kit: "release-tracker", slug: "x", group: "g", title: "Releases 2026", note: "Source: A", data: {} });

const base = () => ({ platforms: ["PS5", "PC"], releases: [{ date: "2026-11-19", title: "Game A", platforms: ["PS5", "PC"], src: 1 }] });

test("release-tracker checks platforms, dates, subsets and sources", () => {
  assert.doesNotThrow(() => releaseTracker.validate(base(), kctx()));
  const bad = (releases: unknown[], re: RegExp) => assert.throws(() => releaseTracker.validate({ ...base(), releases }, kctx()), re);
  bad([{ date: "2026-11-19", title: "X", platforms: ["Switch 2"], src: 1 }], /"Switch 2" is not one of the platforms/);
  bad([{ date: "2026-02-30", title: "X", platforms: ["PC"], src: 1 }], /not a real date/);
  bad([{ date: "2026-11-19", title: "X", platforms: ["PC"] }], /add src/);
  bad([{ date: "2026-11-19", title: "X", platforms: [], src: 1 }], /platforms, at least one/);
  assert.throws(() => releaseTracker.validate({ platforms: ["a", "b", "c", "d", "e", "f", "g"], releases: base().releases }, kctx()), /1 to 6 names/);
  assert.throws(() => releaseTracker.validate({ platforms: ["PS5", "PS5"], releases: base().releases }, kctx()), /names must differ/);
});

test("release-tracker sorts dated releases first and keeps undated ones at the end", () => {
  const d = releaseTracker.validate({
    platforms: ["PS5", "PC"],
    releases: [
      { date: null, title: "No date yet", platforms: ["PC"], src: 1 },
      { date: "2026-12-10", title: "Later", platforms: ["PS5"], src: 1 },
      { date: "2026-11-19", title: "Sooner", platforms: ["PC"], src: 1 },
    ],
  }, kctx());
  assert.deepEqual(d.releases.map((r) => r.title), ["Sooner", "Later", "No date yet"]);
  const html = releaseTracker.render(d, prn(), kctx()).html;
  // The weekday is computed from the date; the undated row says so in words and is not placed on the strip.
  assert.match(html, /Thu\., Nov\. 19/);
  assert.match(html, /Date not yet announced/);
});

test("release-tracker needs a source quote that holds the date once quoting is required", () => {
  const ctx = kctx("2026-11-10T09:00:00-05:00");
  const r = (quote?: string) => ({ platforms: ["PC"], releases: [{ date: "2026-11-19", title: "Game", platforms: ["PC"], src: 1, ...(quote ? { quote } : {}) }] });
  assert.throws(() => releaseTracker.validate(r(), ctx), /add quote/);
  assert.throws(() => releaseTracker.validate(r("Game launches Nov. 20"), ctx), /does not say Nov\. 19/);
  assert.doesNotThrow(() => releaseTracker.validate(r("Game launches Nov. 19 on PC"), ctx));
  // An undated release has no date to quote, so a quote is not demanded.
  assert.doesNotThrow(() => releaseTracker.validate({ platforms: ["PC"], releases: [{ date: null, title: "TBA", platforms: ["PC"], src: 1 }] }, ctx));
});
