import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getIndexableArticles, lastModified, newest } from "../lib/articles";
import { PRINTABLES_PATH } from "../lib/printables";
import { urlset } from "../lib/sitemaps";

/** Trust pages (About, Editorial Policy, Corrections, Masthead) and the free printables hub. */
export const GET: APIRoute = async () => {
  const entries = (await getCollection("policies")).map((p) => ({ path: `/news/${p.id}/`, lastmod: p.data.updatedAt }));
  const withDownloads = (await getIndexableArticles()).filter((a) => a.data.downloads.length > 0);
  if (withDownloads.length) entries.push({ path: PRINTABLES_PATH, lastmod: newest(withDownloads.map(lastModified))! });
  return new Response(urlset(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
