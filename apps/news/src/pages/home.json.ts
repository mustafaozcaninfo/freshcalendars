import type { APIRoute } from "astro";
import { getImage } from "astro:assets";
import { getCategoryNames, getIndexableArticles } from "../lib/articles";
import { upcoming } from "../lib/keydates";
import { articlePath, isoDateTime } from "../lib/seo";

/** Stories and dates the calendar home page shows. */
const STORIES = 6;
const DATES = 6;

/**
 * News blocks for the calendar site's home page ("Latest news", "Coming up"). The calendar
 * generator bakes this into the page at build time (a copy goes to dist/news-data/), and the
 * page fetches the public copy on load: the calendar site rebuilds once a day, stories publish
 * every few minutes. Daily puzzle pages stay out, as on the news home's lead column.
 */
export const GET: APIRoute = async () => {
  const now = new Date();
  const all = await getIndexableArticles(now);
  const names = await getCategoryNames();
  const stories = await Promise.all(
    all
      .filter((a) => a.data.category.id !== "puzzles")
      .slice(0, STORIES)
      .map(async (a) => {
        const img = await getImage({ src: a.data.hero.src, width: 480, format: "webp", quality: 62 });
        return {
          title: a.data.title,
          url: articlePath(a.id),
          cat: a.data.category.id,
          catName: names.get(a.data.category.id) ?? a.data.category.id,
          img: img.src,
          publishedAt: isoDateTime(a.data.publishedAt),
        };
      }),
  );
  const dates = upcoming(new Set(all.map((a) => a.id)), DATES, now, 2).map((k) => ({ date: k.date, label: k.label, url: articlePath(k.slug) }));
  return new Response(JSON.stringify({ generatedAt: now.toISOString(), stories, dates }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
