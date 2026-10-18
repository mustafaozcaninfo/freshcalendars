import type { APIRoute } from "astro";
import { getEntry } from "astro:content";
import { getCategoryNames, getIndexableArticles } from "../lib/articles";
import { heroImages } from "../lib/images";
import { articlePath } from "../lib/seo";
import { FEED_ITEMS, rssFeed } from "../lib/sitemaps";

/** RSS 2.0 with full content, author, category and hero (Google News / Flipboard / MSN intake). */
export const GET: APIRoute = async () => {
  const now = new Date();
  const names = await getCategoryNames();
  const articles = (await getIndexableArticles(now)).slice(0, FEED_ITEMS);
  const items = await Promise.all(
    articles.map(async (a) => {
      const crop = (await heroImages(a.data.hero.src)).crops[0]!;
      const authors = await Promise.all(a.data.authors.map(async (r) => (await getEntry(r))!.data.name));
      return {
        path: articlePath(a.id),
        title: a.data.title,
        description: a.data.description,
        html: a.rendered?.html ?? "",
        publishedAt: a.data.publishedAt,
        authors,
        category: names.get(a.data.category.id) ?? "",
        image: { url: crop.url, width: crop.width, height: crop.height, alt: a.data.hero.alt },
      };
    }),
  );
  return new Response(rssFeed(items), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
};
