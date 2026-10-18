import { getCollection, getEntry, type CollectionEntry } from "astro:content";

export type Article = CollectionEntry<"articles">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Discover / Article rich results want large images; 1600px also covers 2x on 800px layouts. */
export const HERO_MIN_WIDTH = 1600;

/**
 * Articles that may be rendered: no drafts in production builds and nothing
 * scheduled for later than `now` (the VPS cron rebuild picks those up).
 * Dev server shows drafts so they can be reviewed.
 */
export async function getPublishedArticles(now: Date = new Date()): Promise<Article[]> {
  const all = await getCollection("articles");
  for (const a of all) {
    if (!SLUG.test(a.id)) throw new Error(`article slug "${a.id}" must be lowercase kebab-case`);
    const w = a.data.hero.src.width;
    if (w < HERO_MIN_WIDTH) throw new Error(`article "${a.id}": hero is ${w}px wide, needs ${HERO_MIN_WIDTH}px`);
    // Astro does not check that references exist until they are resolved — do it for every build.
    const refs = [a.data.category, ...a.data.authors, ...a.data.related];
    for (const ref of refs) {
      if (!(await getEntry(ref))) {
        throw new Error(`article "${a.id}": unknown ${ref.collection} reference "${ref.id}"`);
      }
    }
  }
  const showDrafts = import.meta.env.DEV || process.env.NEWS_INCLUDE_DRAFTS === "1";
  return all
    .filter((a) => (showDrafts || !a.data.draft) && a.data.publishedAt <= now)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

/** Last meaningful change — drives dateModified, og:updated_time and sitemap lastmod. */
export function lastModified(a: Article): Date {
  return a.data.updatedAt ?? a.data.publishedAt;
}

export type Category = CollectionEntry<"categories">;
export type Author = CollectionEntry<"authors">;

export const categoryHref = (id: string) => `/news/category/${id}/`;
export const authorHref = (id: string) => `/news/author/${id}/`;

/** Categories in display order that have at least one published article (no thin, empty hubs). */
export async function getActiveCategories(articles: Article[]): Promise<Category[]> {
  const used = new Set(articles.map((a) => a.data.category.id));
  return (await getCollection("categories"))
    .filter((c) => used.has(c.id))
    .sort((a, b) => a.data.order - b.data.order);
}

export async function getCategoryNames(): Promise<Map<string, string>> {
  return new Map((await getCollection("categories")).map((c) => [c.id, c.data.name]));
}

/** Articles that belong in sitemaps and feeds (published and indexable). */
export async function getIndexableArticles(now: Date = new Date()): Promise<Article[]> {
  return (await getPublishedArticles(now)).filter((a) => !a.data.noindex);
}

export function newest(dates: Date[]): Date | undefined {
  return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined;
}
