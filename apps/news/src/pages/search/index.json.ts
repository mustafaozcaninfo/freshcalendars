import type { APIRoute } from "astro";
import { getCategoryNames, getIndexableArticles } from "../../lib/articles";
import { articlePath, formatDateET } from "../../lib/seo";

/**
 * Search index for the news bar on every /news/ page, fetched only when a reader focuses the
 * search box: t title, d description, k keywords, c category, u path, p date (ET), n printables.
 */
export const GET: APIRoute = async () => {
  const names = await getCategoryNames();
  const items = (await getIndexableArticles(new Date())).map((a) => ({
    t: a.data.title,
    d: a.data.description,
    k: a.data.keywords.join(" "),
    c: names.get(a.data.category.id) ?? "",
    u: articlePath(a.id),
    p: formatDateET(a.data.publishedAt),
    n: a.data.downloads.length,
  }));
  return new Response(JSON.stringify(items), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
