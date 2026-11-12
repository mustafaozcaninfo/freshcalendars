import type { APIRoute } from "astro";
import { getImage } from "astro:assets";
import { getCategoryNames, getPublishedArticles } from "../../lib/articles";
import { allPrintables } from "../../lib/printables";
import { formatDateET } from "../../lib/seo";

/**
 * Every printable as compact rows for the hub's search, filters and "show more". The hub page
 * itself carries only its first screen of cards: with every card in the HTML it weighed 3.5 MB.
 * Keys are short because the file holds over a thousand rows; the hub script maps them back.
 */
export const GET: APIRoute = async () => {
  const articles = (await getPublishedArticles()).filter((a) => a.data.downloads.length > 0);
  const names = await getCategoryNames();
  const items = await Promise.all(
    allPrintables(articles).map(async (i) => {
      // Same width, format and quality as one of the hub's own <Image> sizes, so no new file is made.
      const img = await getImage({ src: i.preview, width: 360, format: "webp", quality: 62 });
      return {
        t: i.title,
        d: i.description,
        x: i.alt,
        p: i.pdf,
        g: i.png,
        i: img.src,
        n: i.pages,
        s: i.paper,
        k: i.inkSaver?.pdf ?? "",
        c: i.article.category,
        h: i.article.href,
        a: i.article.title,
        e: formatDateET(i.article.publishedAt),
        q: i.group,
      };
    }),
  );
  return new Response(JSON.stringify({ cats: Object.fromEntries(names), items }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
