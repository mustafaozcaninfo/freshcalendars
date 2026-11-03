import type { CollectionEntry } from "astro:content";

type Story = CollectionEntry<"articles">;

/**
 * The news home's lead (and the calendar home's first story) is the newest story, unless an editor
 * pins one with `featuredUntil` in its frontmatter: a published story whose featuredUntil is still
 * ahead leads until then (the newest such story if several are pinned). The site rebuilds every
 * 15 minutes, so a pin drops off on its own shortly after it ends.
 *
 * `newestFirst` is the list the page would show without a pin; `pool` is where pinned stories are
 * looked for (all published stories), since a pinned story may be older than the first page.
 */
export function withFeaturedFirst(newestFirst: Story[], pool: Story[], now: Date = new Date()): Story[] {
  const t = now.getTime();
  const pinned = pool
    .filter((a) => a.data.featuredUntil && a.data.featuredUntil.getTime() > t && a.data.publishedAt.getTime() <= t && a.data.category.id !== "puzzles")
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())[0];
  return pinned ? [pinned, ...newestFirst.filter((a) => a.id !== pinned.id)] : newestFirst;
}
