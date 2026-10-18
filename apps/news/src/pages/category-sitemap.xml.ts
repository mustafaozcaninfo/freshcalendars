import type { APIRoute } from "astro";
import { categoryHref, getActiveCategories, getIndexableArticles, lastModified, newest } from "../lib/articles";
import { urlset } from "../lib/sitemaps";

export const GET: APIRoute = async () => {
  const articles = await getIndexableArticles();
  const entries = (await getActiveCategories(articles)).map((c) => ({
    path: categoryHref(c.id),
    lastmod: newest(articles.filter((a) => a.data.category.id === c.id).map(lastModified)),
  }));
  return new Response(urlset(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
