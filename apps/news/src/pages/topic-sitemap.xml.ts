import type { APIRoute } from "astro";
import { getPublishedArticles, lastModified, newest } from "../lib/articles";
import { urlset } from "../lib/sitemaps";
import { liveTopics } from "../lib/storygraph";
import { topicPath } from "../lib/topics";

/** Topic hubs, each dated by its newest story change. */
export const GET: APIRoute = async () => {
  const entries = liveTopics(await getPublishedArticles()).map(({ topic, items }) => ({
    path: topicPath(topic.slug),
    lastmod: newest(items.map(lastModified)),
  }));
  return new Response(urlset(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
