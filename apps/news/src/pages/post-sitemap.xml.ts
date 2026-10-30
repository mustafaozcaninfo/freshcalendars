import type { APIRoute } from "astro";
import { getIndexableArticles, lastModified, newest } from "../lib/articles";
import { heroImages } from "../lib/images";
import { articlePath } from "../lib/seo";
import { absNewsUrl } from "../lib/site";
import { URLSET_MAX, urlset, type UrlEntry } from "../lib/sitemaps";

/** All articles, newest change first, after the news home (tech-insider layout). */
export const GET: APIRoute = async () => {
  const articles = (await getIndexableArticles()).sort((a, b) => lastModified(b).getTime() - lastModified(a).getTime());
  if (articles.length + 1 > URLSET_MAX) {
    throw new Error(`post-sitemap would hold ${articles.length + 1} URLs; split it into post-sitemap2.xml`);
  }
  const entries: UrlEntry[] = [
    { path: "/news/", lastmod: newest(articles.map(lastModified)) },
    ...(await Promise.all(
      articles.map(async (a) => ({
        path: articlePath(a.id),
        lastmod: lastModified(a),
        images: [
          { url: (await heroImages(a.data.hero.src)).main.url },
          // Printables rank in image search for "printable …" queries; list each full-page PNG.
          ...a.data.downloads.map((d) => ({ url: absNewsUrl(d.png) })),
        ],
      })),
    )),
  ];
  return new Response(urlset(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
