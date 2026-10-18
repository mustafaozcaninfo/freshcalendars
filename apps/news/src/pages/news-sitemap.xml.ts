import type { APIRoute } from "astro";
import { getIndexableArticles } from "../lib/articles";
import { articlePath } from "../lib/seo";
import { newsSitemap } from "../lib/sitemaps";

/** Google News sitemap — last 48h only; the 15-minute VPS rebuild (N7.7) keeps the window current. */
export const GET: APIRoute = async () => {
  const now = new Date();
  const entries = (await getIndexableArticles(now)).map((a) => ({
    path: articlePath(a.id),
    title: a.data.title,
    publishedAt: a.data.publishedAt,
  }));
  return new Response(newsSitemap(entries, now), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
