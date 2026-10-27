import fs from "node:fs/promises";
import path from "node:path";
import {
  MONTH_SLUGS,
  buildMetaForEntry,
  monthNumberToSlug,
  preservedEvergreenUrls,
  resolveAllMonthYears,
  resolveBakeToday,
  resolvePlanningYear,
  schoolYearStartYear,
  validateSeoMeta,
  type SeoMeta,
  type UrlEntry,
} from "@freshcalendars/engine";
import {
  BLANK_VARIANTS,
  DEFAULT_BLANK_VARIANT,
  DEFAULT_MONTHLY_VARIANT,
  DEFAULT_YEARLY_VARIANT,
  MONTHLY_VARIANTS,
  WEEKLY_VARIANTS,
  YEARLY_VARIANTS,
  schoolOverviewAssetPaths,
} from "./catalog.js";
import { DIST, DIST_ASSETS, DIST_META, DIST_OG, DIST_SITE, ROOT } from "./paths.js";
import { closeBrowser, renderOg, renderPrintable } from "./playwrightRender.js";
import { generateAssetPreviews } from "./previews.js";
import {
  renderBlankPrintHtml,
  renderBlankYearlyPrintHtml,
  renderMonthlyPrintHtml,
  renderOgHtml,
  renderSchoolOverviewPrintHtml,
  renderWeeklyPrintHtml,
  renderYearlyPrintHtml,
} from "./renderHtml.js";
import {
  entryToRelPath,
  renderPageHtml,
  resolveEntryYear,
  htaccessContent,
  renderNotFoundHtml,
  renderConceptHubs,
  splitVolatile,
  writeSitePage,
  writeSitemap,
} from "./sitePages.js";
import { ensureStudioAssets, ensureOtherPaperAssets, ensureYearlyStudio } from "./studio.js";

export type GenOptions = {
  years: number[];
  today?: Date;
  families?: Array<"yearly" | "monthly" | "blank" | "weekly" | "school">;
  /** Skip printable PNG/PDF render (reuse existing dist/assets). */
  skipAssets?: boolean;
  /** Skip OG PNG re-render (reuse existing dist/og). */
  skipOg?: boolean;
};

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function ensureAsset(
  family: "yearly" | "monthly" | "blank" | "weekly" | "school",
  year: number | null,
  month: number | null,
): Promise<{ png: string; pdf: string }> {
  if (family === "blank") {
    let primary = { png: "", pdf: "" };
    for (const variant of BLANK_VARIANTS) {
      const png = path.join(DIST_ASSETS, "blank", variant.id, "calendar.png");
      const pdf = path.join(DIST_ASSETS, "blank", variant.id, "calendar.pdf");
      await renderPrintable(renderBlankPrintHtml(variant.id), png, pdf, variant.size);
      if (variant.id === DEFAULT_BLANK_VARIANT) {
        primary = {
          png: `/assets/blank/${variant.id}/calendar.png`,
          pdf: `/assets/blank/${variant.id}/calendar.pdf`,
        };
        const legacyPng = path.join(DIST_ASSETS, "blank", "calendar.png");
        const legacyPdf = path.join(DIST_ASSETS, "blank", "calendar.pdf");
        await fs.mkdir(path.dirname(legacyPng), { recursive: true });
        await fs.copyFile(png, legacyPng);
        await fs.copyFile(pdf, legacyPdf);
      }
    }
    const yearlyPng = path.join(DIST_ASSETS, "blank/yearly/classic/calendar.png");
    const yearlyPdf = path.join(DIST_ASSETS, "blank/yearly/classic/calendar.pdf");
    await renderPrintable(renderBlankYearlyPrintHtml(), yearlyPng, yearlyPdf);
    return primary;
  }
  if (family === "school" && year) {
    const paths = schoolOverviewAssetPaths(year);
    const png = path.join(DIST_ASSETS, "school", paths.span, "overview", "calendar.png");
    const pdf = path.join(DIST_ASSETS, "school", paths.span, "overview", "calendar.pdf");
    await renderPrintable(renderSchoolOverviewPrintHtml(year), png, pdf);
    return { png: paths.png, pdf: paths.pdf };
  }
  if (family === "weekly") {
    let primary = { png: "", pdf: "" };
    for (const variant of WEEKLY_VARIANTS) {
      const png = path.join(DIST_ASSETS, "weekly", variant.id, "calendar.png");
      const pdf = path.join(DIST_ASSETS, "weekly", variant.id, "calendar.pdf");
      await renderPrintable(renderWeeklyPrintHtml(variant.id), png, pdf, variant.size);
      if (variant.id === "classic-sun") {
        primary = {
          png: `/assets/weekly/${variant.id}/calendar.png`,
          pdf: `/assets/weekly/${variant.id}/calendar.pdf`,
        };
      }
    }
    return primary;
  }
  if (family === "yearly" && year) {
    let primary = { png: "", pdf: "" };
    for (const variant of YEARLY_VARIANTS) {
      const png = path.join(DIST_ASSETS, String(year), "yearly", variant.id, "calendar.png");
      const pdf = path.join(DIST_ASSETS, String(year), "yearly", variant.id, "calendar.pdf");
      await renderPrintable(renderYearlyPrintHtml(year, variant.id), png, pdf, variant.size);
      if (variant.id === DEFAULT_YEARLY_VARIANT) {
        primary = {
          png: `/assets/${year}/yearly/${variant.id}/calendar.png`,
          pdf: `/assets/${year}/yearly/${variant.id}/calendar.pdf`,
        };
        const legacyPng = path.join(DIST_ASSETS, String(year), "yearly", "calendar.png");
        const legacyPdf = path.join(DIST_ASSETS, String(year), "yearly", "calendar.pdf");
        await fs.mkdir(path.dirname(legacyPng), { recursive: true });
        await fs.copyFile(png, legacyPng);
        await fs.copyFile(pdf, legacyPdf);
      }
    }
    return primary;
  }
  if (family === "monthly" && year && month) {
    const slug = monthNumberToSlug(month);
    let primary = { png: "", pdf: "" };
    for (const variant of MONTHLY_VARIANTS) {
      const png = path.join(
        DIST_ASSETS,
        String(year),
        "monthly",
        slug,
        variant.id,
        "calendar.png",
      );
      const pdf = path.join(
        DIST_ASSETS,
        String(year),
        "monthly",
        slug,
        variant.id,
        "calendar.pdf",
      );
      await renderPrintable(
        renderMonthlyPrintHtml(year, month, variant.id),
        png,
        pdf,
        variant.size,
      );
      if (variant.id === DEFAULT_MONTHLY_VARIANT) {
        primary = {
          png: `/assets/${year}/monthly/${slug}/${variant.id}/calendar.png`,
          pdf: `/assets/${year}/monthly/${slug}/${variant.id}/calendar.pdf`,
        };
        // Legacy flat path (pre-variant) → copy of default for old bookmarks
        const legacyPng = path.join(DIST_ASSETS, String(year), "monthly", slug, "calendar.png");
        const legacyPdf = path.join(DIST_ASSETS, String(year), "monthly", slug, "calendar.pdf");
        await fs.mkdir(path.dirname(legacyPng), { recursive: true });
        await fs.copyFile(png, legacyPng);
        await fs.copyFile(pdf, legacyPdf);
      }
    }
    return primary;
  }
  throw new Error(`Invalid asset request ${family} ${year} ${month}`);
}

async function writeOgForMeta(meta: SeoMeta): Promise<void> {
  const mark =
    meta.calendar.year != null
      ? String(meta.calendar.year)
      : meta.calendar.family === "blank"
        ? "○"
        : "·";
  const html = renderOgHtml({
    title: meta.title.split("|")[0]!.trim(),
    subtitle: meta.description.slice(0, 90),
    mark,
    family: meta.calendar.family,
  });
  const out = path.join(DIST_OG, `${meta.pageId}.png`);
  await renderOg(html, out);
}

function collectEntries(_years: number[]): UrlEntry[] {
  // Evergreen URL model only — year-qualified twins create internal link spam.
  return preservedEvergreenUrls();
}

export async function generateAll(opts: GenOptions): Promise<{ metas: SeoMeta[] }> {
  const today = opts.today ?? new Date();
  const planningYear = resolvePlanningYear(today);
  const monthYears = resolveAllMonthYears(today);
  const years = Array.from(new Set([...opts.years, planningYear, ...Object.values(monthYears)]));
  const families = opts.families ?? ["yearly", "monthly", "blank", "weekly", "school"];

  await fs.mkdir(DIST, { recursive: true });
  // Fresh HTML/meta/og each build so legacy year-qualified twins are not redeployed.
  await fs.rm(DIST_SITE, { recursive: true, force: true });
  await fs.rm(DIST_META, { recursive: true, force: true });
  if (!opts.skipOg) {
    await fs.rm(DIST_OG, { recursive: true, force: true });
  }
  await fs.mkdir(DIST_SITE, { recursive: true });
  await fs.mkdir(DIST_META, { recursive: true });
  await fs.mkdir(DIST_OG, { recursive: true });

  if (!opts.skipAssets) {
    if (families.includes("blank")) await ensureAsset("blank", null, null);
    if (families.includes("weekly")) await ensureAsset("weekly", null, null);
    if (families.includes("school")) {
      await ensureAsset("school", schoolYearStartYear(today), null);
    }
    for (const year of years) {
      if (families.includes("yearly")) await ensureAsset("yearly", year, null);
      if (families.includes("monthly")) {
        for (let m = 1; m <= 12; m++) await ensureAsset("monthly", year, m);
      }
    }
  }

  const entries = collectEntries(years);
  const studioYears = Array.from({ length: 5 }, (_, i) => planningYear + i);
  await ensureStudioAssets(studioYears);
  await ensureYearlyStudio(studioYears);
  await ensureOtherPaperAssets();
  const metas: SeoMeta[] = [];
  const lastmodState = await readLastmodState();
  const nextLastmod: LastmodState = {};

  for (const entry of entries) {
    const resolved = resolveEntryYear(entry, today, planningYear, monthYears);
    const meta = buildMetaForEntry(entry, resolved, { today });
    const errors = validateSeoMeta(meta);
    if (errors.length) throw new Error(`${meta.pageId}: ${errors.join(", ")}`);

    const { html, contentHash } = splitVolatile(renderPageHtml(entry, meta, { today }));
    // lastmod moves only when the page's own content changes, not on every daily bake.
    const prev = lastmodState[meta.url];
    if (prev?.hash === contentHash) meta.sitemap.lastmod = prev.lastmod;
    nextLastmod[meta.url] = { hash: contentHash, lastmod: meta.sitemap.lastmod };

    await writeJson(path.join(DIST_META, `${meta.pageId}.json`), meta);
    if (!opts.skipOg) await writeOgForMeta(meta);
    await writeSitePage(entryToRelPath(entry), html);
    metas.push(meta);
  }
  const home = metas.find(m => m.pageId === "home")!;
  for (const page of renderConceptHubs(home, today)) {
    if (!opts.skipOg || !await fs.stat(path.join(DIST, page.meta.ogImagePath)).then(() => true).catch(() => false)) await writeOgForMeta(page.meta);
    await writeSitePage(page.file, page.html); await writeJson(path.join(DIST_META, `${page.meta.pageId}.json`), page.meta); metas.push(page.meta);
  }
  await writeJson(LASTMOD_STATE, nextLastmod);

  await writeSitemap(metas);

  const previewCount = await generateAssetPreviews();
  console.log(`asset previews: ${previewCount} webp generated/updated`);

  // copy assets + og into site tree for deploy
  await fs.mkdir(DIST_ASSETS, { recursive: true });
  await fs.cp(DIST_ASSETS, path.join(DIST_SITE, "assets"), { recursive: true });
  await fs.cp(DIST_OG, path.join(DIST_SITE, "og"), { recursive: true });
  await fs.cp(DIST_META, path.join(DIST_SITE, "meta"), { recursive: true });

  const manifest = {
    generatedAt: new Date().toISOString(),
    today: today.toISOString(),
    planningYear,
    monthYears,
    years,
    monthlyVariants: MONTHLY_VARIANTS.map((v) => v.id),
    yearlyVariants: YEARLY_VARIANTS.map((v) => v.id),
    weeklyVariants: WEEKLY_VARIANTS.map((v) => v.id),
    blankVariants: BLANK_VARIANTS.map((v) => v.id),
    pageCount: metas.length,
    pages: metas.map((m) => ({ pageId: m.pageId, url: m.url, path: new URL(m.url).pathname })),
  };
  await writeJson(path.join(DIST, "manifest.json"), manifest);
  await writeJson(path.join(DIST_SITE, "manifest.json"), manifest);

  await writeSitePage(".htaccess", htaccessContent());
  await writeSitePage("404.html", renderNotFoundHtml());

  // PHP contact API + admin (config/lib live outside web root on the server)
  const phpRoot = path.join(ROOT, "server/php");
  await fs.cp(path.join(phpRoot, "api"), path.join(DIST_SITE, "api"), { recursive: true });
  await fs.cp(path.join(phpRoot, "admin"), path.join(DIST_SITE, "admin"), { recursive: true });

  // Self-hosted latin fonts (no render-blocking Google CSS)
  const fontOut = path.join(DIST_SITE, "fonts");
  await fs.mkdir(fontOut, { recursive: true });
  const fontFiles: { file: string; pkg: string }[] = [
    { file: "sora-latin-700-normal.woff2", pkg: "@fontsource/sora" },
    { file: "manrope-latin-400-normal.woff2", pkg: "@fontsource/manrope" },
    { file: "manrope-latin-700-normal.woff2", pkg: "@fontsource/manrope" },
    { file: "source-sans-3-latin-400-normal.woff2", pkg: "@fontsource/source-sans-3" },
    { file: "source-sans-3-latin-700-normal.woff2", pkg: "@fontsource/source-sans-3" },
  ];
  for (const { file, pkg } of fontFiles) {
    const candidates = [
      path.join(ROOT, "packages/generator/node_modules", pkg, "files", file),
      path.join(ROOT, "node_modules", pkg, "files", file),
      path.join(ROOT, "node_modules/.pnpm/node_modules", pkg, "files", file),
    ];
    let found: string | undefined;
    for (const p of candidates) {
      try {
        await fs.access(p);
        found = p;
        break;
      } catch {
        /* try next */
      }
    }
    if (!found) throw new Error(`Missing font file ${file} (${pkg})`);
    await fs.copyFile(found, path.join(fontOut, file));
  }

  const logoSrc = path.join(ROOT, "brand/fresh-logo.png");
  await fs.access(logoSrc);
  await fs.mkdir(path.join(DIST_SITE, "img"), { recursive: true });
  await fs.copyFile(logoSrc, path.join(DIST_SITE, "img", "fresh-logo.png"));
  await fs.cp(path.join(ROOT, "brand/design"), path.join(DIST_SITE, "img/design"), { recursive: true });
  const lockup = path.join(ROOT, "brand/logo.png");
  try {
    await fs.copyFile(lockup, path.join(DIST_SITE, "logo.png"));
  } catch {
    /* optional alternate lockup */
  }

  return { metas };
}

export async function refreshEvergreen(today = new Date()): Promise<void> {
  const planningYear = resolvePlanningYear(today);
  const monthYears = resolveAllMonthYears(today);
  // Always bake current + next planning year so /printable-yearly-calendar.html
  // and Jan rollover never wait on a separate manual gen.
  const years = Array.from(
    new Set([planningYear, planningYear + 1, ...Object.values(monthYears)]),
  );
  await generateAll({ years, today });
  console.log("refresh-evergreen complete", { planningYear, monthYears, years });
}

/** Daily HTML-only bake (Eastern date). Reuses PNG/PDF/OG. */
/** Kept beside dist/site (which is wiped each build) so it survives daily bakes. */
const LASTMOD_STATE = path.join(DIST, "sitemap-lastmod.json");
type LastmodState = Record<string, { hash: string; lastmod: string }>;

async function readLastmodState(): Promise<LastmodState> {
  try {
    return JSON.parse(await fs.readFile(LASTMOD_STATE, "utf8")) as LastmodState;
  } catch {
    return {};
  }
}

export async function refreshMeta(now = new Date()): Promise<void> {
  const today = resolveBakeToday(now);
  const planningYear = resolvePlanningYear(today);
  const monthYears = resolveAllMonthYears(today);
  const years = Array.from(
    new Set([planningYear, planningYear + 1, ...Object.values(monthYears)]),
  );
  await generateAll({ years, today, skipAssets: true, skipOg: true });
  console.log("refresh-meta complete", {
    bakeDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
    planningYear,
    monthYears,
    years,
  });
}

export async function rollover(toYear: number, confirm: boolean): Promise<void> {
  if (!confirm) throw new Error("Pass --confirm to rollover");
  const today = new Date(toYear, 0, 1);
  await generateAll({ years: [toYear - 1, toYear, toYear + 1], today });
  console.log(`Rolled planning context to ${toYear}`);
}

export async function verifyDist(): Promise<void> {
  const manifestPath = path.join(DIST, "manifest.json");
  const raw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw) as {
    pages: { pageId: string; path: string }[];
    monthlyVariants?: string[];
    monthYears: Record<string, number>;
    today: string;
  };
  const errors: string[] = [];

  for (const p of manifest.pages) {
    const metaPath = path.join(DIST_META, `${p.pageId}.json`);
    try {
      const meta = JSON.parse(await fs.readFile(metaPath, "utf8")) as SeoMeta;
      errors.push(...validateSeoMeta(meta).map((e) => `${p.pageId}: ${e}`));
      const og = path.join(DIST_OG, `${p.pageId}.png`);
      await fs.access(og);
      const rel =
        p.path === "/" || p.path === "" ? "index.html" : p.path.replace(/^\//, "");
      const htmlPath = path.join(DIST_SITE, rel);
      await fs.access(htmlPath);

      if (meta.calendar.family === "monthly" && meta.calendar.year && meta.calendar.month) {
        const slug = monthNumberToSlug(meta.calendar.month);
        for (const v of MONTHLY_VARIANTS) {
          const png = path.join(
            DIST_ASSETS,
            String(meta.calendar.year),
            "monthly",
            slug,
            v.id,
            "calendar.png",
          );
          const pdf = path.join(
            DIST_ASSETS,
            String(meta.calendar.year),
            "monthly",
            slug,
            v.id,
            "calendar.pdf",
          );
          try {
            await fs.access(png);
            await fs.access(pdf);
          } catch {
            errors.push(`${p.pageId}: missing asset ${v.id}`);
          }
        }
        if (!meta.faq?.length) errors.push(`${p.pageId}: empty FAQ`);
      }
      if (meta.calendar.family === "yearly" && meta.calendar.year) {
        for (const v of YEARLY_VARIANTS) {
          const png = path.join(
            DIST_ASSETS,
            String(meta.calendar.year),
            "yearly",
            v.id,
            "calendar.png",
          );
          const pdf = path.join(
            DIST_ASSETS,
            String(meta.calendar.year),
            "yearly",
            v.id,
            "calendar.pdf",
          );
          try {
            await fs.access(png);
            await fs.access(pdf);
          } catch {
            errors.push(`${p.pageId}: missing yearly asset ${v.id}`);
          }
        }
        if (!meta.variants?.length) errors.push(`${p.pageId}: missing yearly variants meta`);
      }
      if (p.pageId === "guide-weekly") {
        for (const v of WEEKLY_VARIANTS) {
          const png = path.join(DIST_ASSETS, "weekly", v.id, "calendar.png");
          const pdf = path.join(DIST_ASSETS, "weekly", v.id, "calendar.pdf");
          try {
            await fs.access(png);
            await fs.access(pdf);
          } catch {
            errors.push(`${p.pageId}: missing weekly asset ${v.id}`);
          }
        }
        if (!meta.variants?.length) errors.push(`${p.pageId}: missing weekly variants meta`);
      }
      if (p.pageId === "blank") {
        for (const v of BLANK_VARIANTS) {
          const png = path.join(DIST_ASSETS, "blank", v.id, "calendar.png");
          const pdf = path.join(DIST_ASSETS, "blank", v.id, "calendar.pdf");
          try {
            await fs.access(png);
            await fs.access(pdf);
          } catch {
            errors.push(`${p.pageId}: missing blank asset ${v.id}`);
          }
        }
        if (!meta.variants?.length) errors.push(`${p.pageId}: missing blank variants meta`);
      }
      if (p.pageId === "blank-yearly") {
        try {
          await fs.access(path.join(DIST_ASSETS, "blank/yearly/classic/calendar.png"));
          await fs.access(path.join(DIST_ASSETS, "blank/yearly/classic/calendar.pdf"));
        } catch {
          errors.push(`${p.pageId}: missing blank yearly overview asset`);
        }
      }
      if (p.pageId === "guide-school") {
        const start = schoolYearStartYear(new Date(manifest.today));
        const paths = schoolOverviewAssetPaths(start);
        try {
          await fs.access(path.join(DIST_ASSETS, paths.png.replace(/^\/assets\//, "")));
          await fs.access(path.join(DIST_ASSETS, paths.pdf.replace(/^\/assets\//, "")));
        } catch {
          errors.push(`${p.pageId}: missing school overview asset ${paths.span}`);
        }
      }
    } catch (e) {
      errors.push(`${p.pageId}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const jan = manifest.pages.find((p) => p.pageId === "month-january-evergreen");
  if (jan) {
    const meta = JSON.parse(
      await fs.readFile(path.join(DIST_META, "month-january-evergreen.json"), "utf8"),
    ) as SeoMeta;
    const expected = manifest.monthYears["1"];
    if (meta.calendar.year !== expected) {
      errors.push(`january evergreen year ${meta.calendar.year} != expected ${expected}`);
    }
  }

  try {
    await fs.access(path.join(DIST_SITE, "img/fresh-logo.png"));
  } catch {
    errors.push("missing header logo img/fresh-logo.png (copy from brand/fresh-logo.png)");
  }

  if (errors.length) {
    console.error(errors.join("\n"));
    throw new Error(`verify failed with ${errors.length} error(s)`);
  }
  console.log(`verify ok — ${manifest.pages.length} pages`);
}

export async function shutdown(): Promise<void> {
  await closeBrowser();
}

export { MONTH_SLUGS };
