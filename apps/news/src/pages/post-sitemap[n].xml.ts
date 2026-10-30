import type { APIRoute } from "astro";
import { postSitemapChunks } from "../lib/postSitemap";
import { urlset } from "../lib/sitemaps";

/** post-sitemap2.xml and on, once the stories outgrow one file. */
export async function getStaticPaths() {
  const chunks = await postSitemapChunks();
  return chunks.slice(1).map((_, i) => ({ params: { n: String(i + 2) } }));
}

export const GET: APIRoute = async ({ params }) => {
  const chunk = (await postSitemapChunks())[Number(params.n) - 1] ?? [];
  return new Response(urlset(chunk), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
