import { copyFile, mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { rehypeMidArticleAd } from "./src/lib/ad-units.mjs";
import { rehypePuzzleBoards } from "./src/lib/puzzle-boards.mjs";
import { rehypeTableScroll } from "./src/lib/table-scroll.mjs";
import { minifyHtmlDir } from "./src/lib/minify-html.mjs";
import { stampPdfs } from "./src/lib/pdf-meta.mjs";

/** Astro leaves content-layer/server chunks in an outDir outside the project; none of it is public.
 *  Also moves latest.json (calendar-site data) to dist/news-data/ and copies home.json there. */
const cleanBuildLeftovers = {
  name: "clean-build-leftovers",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      const out = fileURLToPath(dir);
      // latest.json is build data for the calendar generator, not a public file.
      const data = path.join(out, "..", "news-data");
      await mkdir(data, { recursive: true });
      await rename(path.join(out, "latest.json"), path.join(data, "latest.json")).catch(() => {});
      // home.json stays public (the calendar home page refreshes from it); the generator reads a copy.
      await copyFile(path.join(out, "home.json"), path.join(data, "home.json")).catch(() => {});
      for (const f of await readdir(out)) {
        if (f.endsWith(".mjs") || f === "chunks" || f === "collections") {
          await rm(path.join(out, f), { recursive: true, force: true });
        }
      }
      await pruneUnusedImages(out);
    },
  },
};

/**
 * Astro copies every hero's original file into _astro and keeps a few variants no page links
 * (about 1 MB a story). An image in _astro that no page, feed, sitemap, JSON or stylesheet names
 * is never requested, so it is removed here instead of being synced to the server on every publish.
 */
async function pruneUnusedImages(out) {
  const assets = path.join(out, "_astro");
  const images = (await readdir(assets)).filter((f) => /\.(avif|webp|png|jpe?g|gif)$/i.test(f));
  let text = "";
  for (const f of await readdir(out, { recursive: true })) {
    if (/\.(html|xml|xsl|json|css|js|txt|webmanifest)$/i.test(f)) text += await readFile(path.join(out, f), "utf8");
  }
  let removed = 0;
  for (const f of images) {
    if (!text.includes(f)) { await rm(path.join(assets, f)); removed++; }
  }
  if (removed) console.log(`[news] removed ${removed} unused image file(s) from _astro`);
}

/**
 * Fresh Calendars News — static Google News section served at /news/.
 * Output goes to dist/news (outside dist/site, which the calendar generator wipes)
 * and is deployed on its own to public_html/news/. See docs/NEWS-ROADMAP.md.
 */
/** Printable PDFs: document properties, top link and the nginx canonical map (src/lib/pdf-meta.mjs). */
const stampPrintables = {
  name: "stamp-printables",
  hooks: {
    "astro:build:done": async ({ dir, logger }) => {
      const out = fileURLToPath(dir), json = path.join(out, "pdf-map.json");
      const data = path.join(out, "..", "news-data");
      await mkdir(data, { recursive: true });
      const n = await stampPdfs(out, JSON.parse(await readFile(json, "utf8")), path.join(data, "pdf-canonical.map"));
      await rm(json);
      logger.info(`stamped ${n} printable PDFs`);
    },
  },
};

/** Squeezes the whitespace compressHTML cannot reach (see src/lib/minify-html.mjs). */
const minifyHtml = {
  name: "minify-html",
  hooks: {
    "astro:build:done": async ({ dir, logger }) => {
      const [n, before, after] = await minifyHtmlDir(fileURLToPath(dir));
      logger.info(`minified ${n} HTML files: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`);
    },
  },
};

export default defineConfig({
  site: process.env.NEWS_SITE_ORIGIN ?? "https://freshcalendars.com",
  base: "/news",
  trailingSlash: "always",
  output: "static",
  image: { service: { entrypoint: "./src/lib/image-service.mjs" } },
  outDir: "../../dist/news",
  compressHTML: true,
  build: {
    format: "directory",
    // Everything in _astro is an image. CI builds with NEWS_ASSETS_PREFIX=https://cdn.freshcalendars.com/news
    // so pages load them from R2 (scripts/cf/) and the Workers deploy carries only pages; local
    // builds leave it unset so news:serve shows images a new story has not uploaded yet.
    ...(process.env.NEWS_ASSETS_PREFIX ? { assetsPrefix: process.env.NEWS_ASSETS_PREFIX } : {}),
    inlineStylesheets: "always",
    assets: "_astro",
  },
  integrations: [cleanBuildLeftovers, stampPrintables, minifyHtml],
  markdown: { rehypePlugins: [rehypePuzzleBoards, rehypeTableScroll, rehypeMidArticleAd] },
  devToolbar: { enabled: false },
  vite: {
    server: { port: 4322 },
  },
});
