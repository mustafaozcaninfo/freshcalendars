import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { urlset } from "../lib/sitemaps";

/** Trust pages (About, Editorial Policy, Corrections, Masthead). */
export const GET: APIRoute = async () => {
  const entries = (await getCollection("policies")).map((p) => ({ path: `/news/${p.id}/`, lastmod: p.data.updatedAt }));
  return new Response(urlset(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
