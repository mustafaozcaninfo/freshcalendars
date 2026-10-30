import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import { POLICY_PAGES } from "./site";

export type Article = CollectionEntry<"articles">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Discover / Article rich results want large images; 1600px also covers 2x on 800px layouts. */
export const HERO_MIN_WIDTH = 1600;
/** Slugs that are section/policy routes under /news/. */
const RESERVED = new Set<string>(["page", "category", "author", "topic", "printables", "404", ...POLICY_PAGES]);

/**
 * Articles that may be rendered: no drafts in production builds and nothing
 * scheduled for later than `now` (they go live with the first deploy after that time; the 15-min VPS cron is off since 2026-10-23).
 * Dev server shows drafts so they can be reviewed.
 */
export async function getPublishedArticles(now: Date = new Date()): Promise<Article[]> {
  const all = await checkedArticles();
  const showDrafts = import.meta.env.DEV || process.env.NEWS_INCLUDE_DRAFTS === "1";
  return all
    .filter((a) => (showDrafts || !a.data.draft) && a.data.publishedAt <= now)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

let checkedOnce: Promise<Article[]> | undefined;

/**
 * Every article, validated. A build reads and checks them once: each page calls
 * getPublishedArticles several times (bar, rail, page), and resolving every reference of every
 * story on each call made the build grow with the square of the story count (about 40% of its
 * CPU at 525 stories). The dev server reads them fresh so edits show up.
 */
function checkedArticles(): Promise<Article[]> {
  if (import.meta.env.DEV) return readCheckedArticles();
  return (checkedOnce ??= readCheckedArticles());
}

async function readCheckedArticles(): Promise<Article[]> {
  const all = await getCollection("articles");
  for (const a of all) {
    if (!SLUG.test(a.id)) throw new Error(`article slug "${a.id}" must be lowercase kebab-case`);
    if (RESERVED.has(a.id)) throw new Error(`article slug "${a.id}" is reserved for a section page`);
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
  return all;
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
