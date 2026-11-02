/**
 * Full-text story search for the shared header search (Pagefind, https://pagefind.app).
 *
 * The header search matches titles and keywords instantly from /news/search/index.json; this index
 * adds matches inside story text ("when do schools close for thanksgiving" finds the Thanksgiving
 * break story even though no title says "close"). It runs after the build and writes
 * dist/news/pagefind/, which the browser loads in small chunks only when someone types.
 *
 * Only the story itself is indexed: the related/more lists, author card, sources, ads and share bar
 * repeat other stories' titles and made unrelated stories match. Each story's frontmatter keywords
 * are added at the end of the indexed text (weighted like a subheading) so a term that only appears
 * in the keywords still finds the story; at the end they stay out of the result excerpts, which
 * Pagefind takes from the best-matching passage and ties to the earliest one.
 */
import { readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import * as pagefind from "pagefind";

/** Blocks inside <article class="article"> that are not the story's own text. */
const EXCLUDE = [
  ".crumbs", ".kicker", ".article-byline-row", ".share", ".ad-slot", ".related", ".more", ".author-card",
  ".pref-src", ".cal-links", ".downloads", ".sources",
];
/** Pagefind's own UI bundles; the header search draws its own results with the core API. */
const UNUSED = /^pagefind-(component-ui|modular-ui|ui|highlight)\.(js|css)$/;

const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** @param {string} out absolute path of dist/news */
export async function buildSearchIndex(out) {
  const started = Date.now();
  const keywords = new Map();
  try {
    for (const x of JSON.parse(await readFile(path.join(out, "search/index.json"), "utf8"))) {
      if (typeof x.u === "string" && x.k) keywords.set(x.u, String(x.k));
    }
  } catch {
    /* no keyword list: index the text alone */
  }
  const { index, errors } = await pagefind.createIndex({ rootSelector: "article.article", excludeSelectors: EXCLUDE });
  if (!index) throw new Error(`[news] search index: ${errors.join("; ")}`);
  let pages = 0;
  try {
    for (const rel of await readdir(out, { recursive: true })) {
      if (!rel.endsWith("index.html") || rel.startsWith("_astro") || rel.startsWith("pagefind")) continue;
      let html = await readFile(path.join(out, rel), "utf8");
      // Pages without a story body (home, hubs, authors) have no root element and are skipped.
      if (!html.includes('class="news-wrap article"')) continue;
      // Pagefind prefixes result URLs with the folder its bundle is served from (/news/), so the
      // index stores the path below /news/; results come back as /news/<slug>/.
      const url = "/" + rel.split(path.sep).join("/").replace(/index\.html$/, "");
      const k = keywords.get("/news" + url);
      if (k) html = html.replace(/<\/article>/, `<p data-pagefind-weight="4">${escapeHtml(k)}</p></article>`);
      const added = await index.addHTMLFile({ url, content: html });
      if (added.errors.length) throw new Error(`[news] search index: ${url}: ${added.errors.join("; ")}`);
      pages++;
    }
    const dir = path.join(out, "pagefind");
    await rm(dir, { recursive: true, force: true });
    const written = await index.writeFiles({ outputPath: dir });
    if (written.errors.length) throw new Error(`[news] search index: ${written.errors.join("; ")}`);
    for (const f of await readdir(dir)) if (UNUSED.test(f)) await rm(path.join(dir, f));
  } finally {
    await pagefind.close();
  }
  console.log(`[news] search index: ${pages} stories in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}
