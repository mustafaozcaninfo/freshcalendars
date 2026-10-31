import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getIndexableArticles, getPublishedArticles, lastModified, newest } from "../lib/articles";
import { ARCHIVE_PATH, archiveMonths } from "../lib/archive";
import { PRINTABLES_PATH } from "../lib/printables";
import { urlset } from "../lib/sitemaps";

/** Trust pages (About, Editorial Policy, Corrections, Masthead), the free printables hub and the story archive. */
export const GET: APIRoute = async () => {
  // Sorted: collection order varies between builds, and an unchanged file is not re-published.
  const entries = (await getCollection("policies")).map((p) => ({ path: `/news/${p.id}/`, lastmod: p.data.updatedAt }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const withDownloads = (await getIndexableArticles()).filter((a) => a.data.downloads.length > 0);
  if (withDownloads.length) entries.push({ path: PRINTABLES_PATH, lastmod: newest(withDownloads.map(lastModified))! });
  const published = await getPublishedArticles();
  if (published.length) entries.push({ path: ARCHIVE_PATH, lastmod: newest(published.map(lastModified))! });
  for (const m of archiveMonths(published, (a) => a.data.publishedAt)) entries.push({ path: m.path, lastmod: newest(m.items.map(lastModified))! });
  return new Response(urlset(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
