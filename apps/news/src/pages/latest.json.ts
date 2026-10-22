import type { APIRoute } from "astro";
import { getIndexableArticles } from "../lib/articles";
import { articlePath } from "../lib/seo";
import { SITE_ORIGIN } from "../lib/site";

/** Calendar site "Latest news" boxes only show recent stories. */
const MAX_AGE_DAYS = 120;
const PER_SLUG = 3;
const PER_PATH = 5;
/** Daily puzzle stories link month pages too; they would crowd every month box, so they stay out of byPath. */
const PATH_SKIP_CATEGORIES = new Set(["puzzles"]);

type Story = { title: string; url: string; publishedAt: string };

/**
 * Calendar-site page → recent stories that link to it (internalLinks), newest first.
 * bySlug: /when-is/<slug>/ pages (in-content box). byPath: every other calendar page, keyed by
 * its path ("/november-calendars.html", "/holidays/"). Moved out of the public output to
 * dist/news-data/latest.json by the build hook in astro.config.mjs; the calendar generator
 * reads it (packages/generator/src/newsLinks.ts).
 */
export const GET: APIRoute = async () => {
  const now = new Date();
  const cutoff = now.getTime() - MAX_AGE_DAYS * 86_400_000;
  const bySlug: Record<string, Story[]> = {};
  const byPath: Record<string, Story[]> = {};
  for (const a of await getIndexableArticles(now)) {
    if (a.data.publishedAt.getTime() < cutoff) continue;
    const story = { title: a.data.title, url: `${SITE_ORIGIN}${articlePath(a.id)}`, publishedAt: a.data.publishedAt.toISOString() };
    for (const link of a.data.internalLinks) {
      const slug = /^\/when-is\/([a-z0-9-]+)\/?$/.exec(link.href)?.[1];
      if (slug) {
        const list = (bySlug[slug] ??= []);
        if (list.length < PER_SLUG) list.push(story);
        continue;
      }
      if (PATH_SKIP_CATEGORIES.has(a.data.category.id)) continue;
      const list = (byPath[link.href] ??= []);
      if (list.length < PER_PATH && !list.some((s) => s.url === story.url)) list.push(story);
    }
  }
  return new Response(JSON.stringify({ bySlug, byPath }, null, 2), { headers: { "Content-Type": "application/json" } });
};
