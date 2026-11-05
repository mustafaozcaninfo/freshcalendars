/**
 * Which stories the calendar site shows on a page ("Latest news" on /when-is/ pages, "In the news"
 * on the rest). Both boxes used to fill from the newest stories that link the page, so the story
 * that actually answers the page's question (Thanksgiving 2026: 218,000 impressions; Canada stat
 * holidays 2027) was pushed out by a parade or a trash-pickup story. `calendar-pins.json` names the
 * story a page must always show; the rest of the box is filled as before.
 */
export type LinkStory = { title: string; url: string; publishedAt: string };

/** At most this many pinned stories per page, so a pin never empties the box of fresh news. */
export const MAX_PINS = 2;

/** A /when-is/<slug>/ page is keyed by its slug (in-content box); every other page by its path. */
export function pinTarget(page: string): { kind: "slug" | "path"; key: string } {
  const slug = /^\/when-is\/([a-z0-9-]+)\/?$/.exec(page)?.[1];
  return slug ? { kind: "slug", key: slug } : { kind: "path", key: page };
}

/** Pinned stories first, then the others in their order, each story once, at most `cap`. */
export function withPinned(list: LinkStory[] = [], pinned: LinkStory[], cap: number): LinkStory[] {
  const seen = new Set<string>();
  const out: LinkStory[] = [];
  for (const s of [...pinned, ...list]) {
    if (seen.has(s.url)) continue;
    seen.add(s.url);
    out.push(s);
  }
  return out.slice(0, cap);
}
