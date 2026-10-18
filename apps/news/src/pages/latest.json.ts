import type { APIRoute } from "astro";
import { getIndexableArticles } from "../lib/articles";
import { articlePath } from "../lib/seo";
import { SITE_ORIGIN } from "../lib/site";

/** Calendar site "Latest news" boxes only show recent stories. */
const MAX_AGE_DAYS = 120;
const PER_SLUG = 3;

/**
 * when-is slug → recent stories that link to it (internalLinks). Moved out of the public
 * output to dist/news-data/latest.json by the build hook in astro.config.mjs; the calendar
 * generator reads it (packages/generator/src/newsLinks.ts).
 */
export const GET: APIRoute = async () => {
  const now = new Date();
  const cutoff = now.getTime() - MAX_AGE_DAYS * 86_400_000;
  const bySlug: Record<string, { title: string; url: string; publishedAt: string }[]> = {};
  for (const a of await getIndexableArticles(now)) {
    if (a.data.publishedAt.getTime() < cutoff) continue;
    for (const link of a.data.internalLinks) {
      const slug = /^\/when-is\/([a-z0-9-]+)\/?$/.exec(link.href)?.[1];
      if (!slug) continue;
      const list = (bySlug[slug] ??= []);
      if (list.length < PER_SLUG) {
        list.push({ title: a.data.title, url: `${SITE_ORIGIN}${articlePath(a.id)}`, publishedAt: a.data.publishedAt.toISOString() });
      }
    }
  }
  return new Response(JSON.stringify({ bySlug }, null, 2), { headers: { "Content-Type": "application/json" } });
};
