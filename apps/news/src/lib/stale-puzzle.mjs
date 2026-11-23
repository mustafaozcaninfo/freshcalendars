// A daily puzzle page is searched for on its own day and the day after: 96% of its Google clicks
// come in the first two days and 13 of 2,890 came after day 7 (Search Console, Sep. 24 to Nov. 22,
// 2026). Hundreds of week-old answer pages that nobody looks for are thin pages in Google's count
// of the section, so a daily page drops out of the index (noindex, follow; no ads, out of the
// sitemaps and related lists) seven days after it was published. The page stays up for its links.
// Monthly roundups and hubs have no day in the slug and are never stale.
// Shared by the build (lib/articles.ts, ad-units.mjs) and the checks (news-seo-audit, verify-live).
export const STALE_PUZZLE_DAYS = 7;
const DAY_MS = 86_400_000;
const DAILY_SLUG = /-(january|february|march|april|may|june|july|august|september|october|november|december)-\d{1,2}-20\d\d(-\d+)?$/;

/** Milliseconds since a daily puzzle page went stale; negative while it is fresh, null for any other story. */
export function stalePuzzleAge({ slug, category, publishedAt }, now = new Date()) {
  if (category !== "puzzles" || !DAILY_SLUG.test(slug)) return null;
  const t = new Date(publishedAt).getTime();
  return Number.isFinite(t) ? now.getTime() - t - STALE_PUZZLE_DAYS * DAY_MS : null;
}

/** True when the story is a daily puzzle page published seven or more days ago. */
export function isStaleDailyPuzzle(story, now = new Date()) {
  const age = stalePuzzleAge(story, now);
  return age !== null && age >= 0;
}
