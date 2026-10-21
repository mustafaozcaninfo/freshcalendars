import type { APIRoute } from "astro";
import { getIndexableArticles, lastModified } from "../lib/articles";
import { articlePath } from "../lib/seo";
import { SITE_ORIGIN } from "../lib/site";

/**
 * Printable PDF → the story it belongs to (the earliest story that offers it), with what its
 * document properties need. Build data, not a public file: the minify-html build hook moves it out
 * of dist/news and src/lib/pdf-meta.mjs uses it to stamp metadata, the top link and the canonical map.
 */
export const GET: APIRoute = async () => {
  const articles = (await getIndexableArticles()).sort((a, b) => a.data.publishedAt.getTime() - b.data.publishedAt.getTime());
  const map: Record<string, unknown> = {};
  for (const a of articles) {
    for (const d of a.data.downloads) {
      map[d.pdf] ??= {
        title: d.title,
        description: d.description,
        keywords: [...a.data.keywords, "free printable", "printable PDF"],
        story: `${SITE_ORIGIN}${articlePath(a.id)}`,
        created: a.data.publishedAt.toISOString(),
        modified: lastModified(a).toISOString(),
      };
    }
  }
  return new Response(JSON.stringify(map, null, 2), { headers: { "Content-Type": "application/json" } });
};
