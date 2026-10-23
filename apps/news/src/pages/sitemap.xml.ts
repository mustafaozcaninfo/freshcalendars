import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getActiveCategories, getIndexableArticles, getPublishedArticles, lastModified, newest } from "../lib/articles";
import { newsWindow, sitemapIndex } from "../lib/sitemaps";
import { liveTopics } from "../lib/storygraph";

/** /news/ sitemap index (tech-insider layout). */
export const GET: APIRoute = async () => {
  const now = new Date();
  const articles = await getIndexableArticles(now);
  const latest = newest(articles.map(lastModified));
  const recent = newsWindow(articles.map((a) => ({ path: a.id, title: a.data.title, publishedAt: a.data.publishedAt })), now);
  const children = [
    { path: "/news/post-sitemap.xml", lastmod: latest },
    ...((await getActiveCategories(articles)).length ? [{ path: "/news/category-sitemap.xml", lastmod: latest }] : []),
    ...(liveTopics(await getPublishedArticles(now)).length ? [{ path: "/news/topic-sitemap.xml", lastmod: latest }] : []),
    ...((await getCollection("authors")).length ? [{ path: "/news/author-sitemap.xml", lastmod: latest }] : []),
    { path: "/news/page-sitemap.xml", lastmod: newest((await getCollection("policies")).map((p) => p.data.updatedAt)) },
    { path: "/news/news-sitemap.xml", lastmod: newest(recent.map((r) => r.publishedAt)) },
  ];
  return new Response(sitemapIndex(children), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
