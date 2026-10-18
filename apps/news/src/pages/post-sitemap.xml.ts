import type { APIRoute } from "astro";
import { getIndexableArticles, lastModified, newest } from "../lib/articles";
import { heroImages } from "../lib/images";
import { articlePath } from "../lib/seo";
import { URLSET_MAX, urlset, type UrlEntry } from "../lib/sitemaps";

/** All articles, newest change first; the news home leads with priority 1.0 (tech-insider layout). */
export const GET: APIRoute = async () => {
  const articles = (await getIndexableArticles()).sort((a, b) => lastModified(b).getTime() - lastModified(a).getTime());
  if (articles.length + 1 > URLSET_MAX) {
    throw new Error(`post-sitemap would hold ${articles.length + 1} URLs; split it into post-sitemap2.xml`);
  }
  const entries: UrlEntry[] = [
    { path: "/news/", lastmod: newest(articles.map(lastModified)), priority: "1.0" },
    ...(await Promise.all(
      articles.map(async (a) => ({
        path: articlePath(a.id),
        lastmod: lastModified(a),
        image: { url: (await heroImages(a.data.hero.src)).main.url, title: a.data.hero.alt },
      })),
    )),
  ];
  return new Response(urlset(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
