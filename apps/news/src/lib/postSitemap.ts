/**
 * The story sitemap, cut into files of URLSET_MAX URLs: post-sitemap.xml, post-sitemap2.xml, ...
 * Newest change first, so the first file (the one robots.txt names) always holds the freshest
 * stories; at 60 stories a day the 5,000-URL file fills in about three months.
 */
import { getIndexableArticles, lastModified, newest } from "./articles";
import { heroImages } from "./images";
import { articlePath } from "./seo";
import { absNewsUrl } from "./site";
import { URLSET_MAX, type UrlEntry } from "./sitemaps";

export const postSitemapPath = (n: number) => (n === 1 ? "/news/post-sitemap.xml" : `/news/post-sitemap${n}.xml`);

let chunks: Promise<UrlEntry[][]> | undefined;

/** One list of URLs per sitemap file; the first starts with the news home. Built once per build. */
export function postSitemapChunks(): Promise<UrlEntry[][]> {
  return (chunks ??= (async () => {
    const articles = (await getIndexableArticles()).sort((a, b) => lastModified(b).getTime() - lastModified(a).getTime());
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
    const out: UrlEntry[][] = [];
    for (let i = 0; i < entries.length; i += URLSET_MAX) out.push(entries.slice(i, i + URLSET_MAX));
    return out;
  })());
}
