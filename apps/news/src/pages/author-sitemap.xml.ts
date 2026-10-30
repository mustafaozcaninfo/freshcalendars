import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { authorHref, getIndexableArticles, lastModified, newest } from "../lib/articles";
import { urlset } from "../lib/sitemaps";

export const GET: APIRoute = async () => {
  const articles = await getIndexableArticles();
  // Sorted: collection order varies between builds, and an unchanged file is not re-published.
  const entries = (await getCollection("authors")).map((au) => ({
    path: authorHref(au.id),
    lastmod: newest(articles.filter((a) => a.data.authors.some((r) => r.id === au.id)).map(lastModified)),
  })).sort((a, b) => a.path.localeCompare(b.path));
  return new Response(urlset(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
