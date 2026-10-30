import type { APIRoute } from "astro";
import { postSitemapChunks } from "../lib/postSitemap";
import { urlset } from "../lib/sitemaps";

/** The news home and the newest URLSET_MAX - 1 stories (tech-insider layout); the rest go to post-sitemap2.xml and on. */
export const GET: APIRoute = async () => {
  const [first = []] = await postSitemapChunks();
  return new Response(urlset(first), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
