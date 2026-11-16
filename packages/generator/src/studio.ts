/** Real printable assets for the concept's paper/start-day/style controls. */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import sharp from "sharp";
import { buildMonthGrid, buildYearMonths, holidaysForMonth, monthNumberToName, MONTH_SLUGS } from "@freshcalendars/engine";
import { ROOT, DIST_ASSETS } from "./paths.js";
import { renderMonthlyPrintHtml, renderYearlyPrintHtml } from "./renderHtml.js";
import { YEARLY_VARIANTS, type MonthlyVariantId } from "./catalog.js";
const require = createRequire(path.join(ROOT, "apps/news/package.json"));
const { PDFDocument } = require("pdf-lib");

export const STUDIO_STYLES = [
  { id: "scenic", label: "Classic", description: "Seasonal photograph over a bold grid with US holidays named" },
  { id: "color-modern", label: "Modern", description: "Blue title band, rounded date boxes, holidays in red" },
  { id: "classic-bw", label: "Minimal", description: "Black and white with big dates, easy on ink" },
  { id: "floral", label: "Floral", description: "Spring blossoms over a bold grid with US holidays named" },
  { id: "landscape-soft", label: "Landscape", description: "A wide sheet with a green title band and full weekday names" },
  { id: "holidays", label: "Holidays", description: "US holidays named in the boxes and listed below the grid" },
  { id: "notes-planner", label: "Planner", description: "Ruled date boxes and a notes column for handwriting" },
  // Last in the studio (its preview opens on the first style), first on the design cards.
  { id: "large-print", label: "Large Print", description: "Landscape sheet with big dates and US holidays named in the boxes" },
] as const;
/** Design cards and image search lead with the sheet that reads best small: wide, bold, holidays named. */
export const CARD_STYLES = [STUDIO_STYLES.find((s) => s.id === "large-print")!, ...STUDIO_STYLES.filter((s) => s.id !== "large-print")];
const WIDE_STYLES = new Set<string>(["landscape-soft", "large-print"]);
export type StudioStyle = typeof STUDIO_STYLES[number]["id"];
export function studioAssets(year: number, month: number, style: string = "scenic", paper = "letter", start = "sunday") {
  const base = `/assets/studio/${year}/${MONTH_SLUGS[month - 1]}/${style}/${paper}-${start}`;
  return { png: `${base}.png`, pdf: `${base}.pdf`, preview: `${base}.webp` };
}
/**
 * The pictures image search shows for a month or a year: one per design, drawn at twice the print
 * preview's size and named after the query ("december-2026-calendar-classic.webp") instead of the
 * paper and start day. The studio's own files keep their names (the browser builds those paths);
 * these are the ones the design cards, the ImageObject data and the image sitemap point at.
 */
const SEARCH_SLUGS: Record<string, string> = {
  scenic: "classic", "color-modern": "modern", "classic-bw": "minimal", floral: "floral",
  "landscape-soft": "landscape", holidays: "with-holidays", "notes-planner": "planner", "large-print": "printable",
};
const YEAR_SEARCH_SLUGS: Record<string, string> = {
  classic: "classic", "landscape-wall": "landscape",
  holidays: "with-holidays", "monday-start": "monday-start", "ink-compact": "compact",
};
export const SEARCH_IMAGE_WIDTHS = [640, 1100] as const;
export type SearchImage = { full: string; srcset: string; width: number; height: number };
function searchImage(base: string, sheet: { width: number; height: number }): SearchImage {
  const width = sheet.width * 2, height = sheet.height * 2;
  return { full: `${base}.webp`, srcset: [...SEARCH_IMAGE_WIDTHS.map((w) => `${base}-${w}.webp ${w}w`), `${base}.webp ${width}w`].join(", "), width, height };
}
/** Sheet size the studio draws a monthly design at (ensureStudioAssets uses the same numbers). */
function monthSheetSize(style: string): { width: number; height: number } {
  // US Letter turned on its side (11 x 8.5 in), so the sheet fills the page and the picture.
  if (WIDE_STYLES.has(style)) return { width: 1600, height: 1236 };
  return { width: 1100, height: style === "scenic" || style === "floral" ? 1424 : 1420 };
}
export function monthSearchImage(year: number, month: number, style: string): SearchImage {
  const slug = MONTH_SLUGS[month - 1];
  if (!SEARCH_SLUGS[style]) throw new Error(`No search image name for the ${style} design`);
  return searchImage(`/assets/studio/${year}/${slug}/${style}/${slug}-${year}-calendar-${SEARCH_SLUGS[style]}`, monthSheetSize(style));
}
/** Year posters only: the two studio year sheets appear in the browser-driven preview, not as cards. */
export function yearSearchImage(year: number, design: string): SearchImage {
  const variant = YEARLY_VARIANTS.find((v) => v.id === design);
  if (!variant || !YEAR_SEARCH_SLUGS[design]) throw new Error(`No search image name for the yearly ${design} design`);
  return searchImage(`/assets/${year}/yearly/${design}/${year}-yearly-calendar-${YEAR_SEARCH_SLUGS[design]}`, variant.size);
}
const exists = (file: string) => fs.stat(file).then(() => true).catch(() => false);
/** Writes a search image and its two smaller widths from a screenshot taken at twice the sheet size. */
async function writeSearchImage(shot: Buffer, image: SearchImage): Promise<void> {
  const target = path.join(ROOT, "dist", image.full);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await sharp(shot).webp({ quality: 82, effort: 5 }).toFile(target);
  for (const w of SEARCH_IMAGE_WIDTHS) await sharp(shot).resize({ width: w }).webp({ quality: 80, effort: 5 }).toFile(target.replace(/\.webp$/, `-${w}.webp`));
}
const searchImageReady = async (image: SearchImage) => (await Promise.all([image.full, ...SEARCH_IMAGE_WIDTHS.map((w) => image.full.replace(/\.webp$/, `-${w}.webp`))].map((f) => exists(path.join(ROOT, "dist", f))))).every(Boolean);

export function seasonFor(month: number): string {
  return month <= 2 || month === 12 ? "winter" : month <= 5 ? "spring" : month <= 8 ? "summer" : "autumn";
}
/** Classic and Floral: a seasonal picture over the same bold grid as the other sheets, holidays named. */
function scenicHtml(year: number, month: number, start: 0 | 1, image: string, floral: boolean) {
  const grid = buildMonthGrid({ year, month, weekStartsOn: start });
  const weekdays = start ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const holidays = new Map<number, string[]>();
  for (const h of holidaysForMonth(year, month)) holidays.set(h.day, [...(holidays.get(h.day) ?? []), h.name]);
  const weekend = (i: number) => (start ? i >= 5 : i === 0 || i === 6);
  const ink = floral ? "#4a2238" : "#16314b", line = floral ? "#b98aa2" : "#7f9bb5", head = floral ? "#f6e3ec" : "#deebf6", tint = floral ? "#fdf6f9" : "#f4f8fc", accent = floral ? "#b0306a" : "#b3261e";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;width:1100px;height:1424px;padding:36px 40px 0;color:${ink};background:#fff;font-family:Manrope,sans-serif}.scene{display:block;width:100%;height:270px;object-fit:cover;border-radius:14px}h1{font-family:Sora,sans-serif;font-weight:700;text-align:center;font-size:76px;line-height:1;margin:26px 0 24px;letter-spacing:-1.5px}table{width:100%;border-collapse:collapse;table-layout:fixed;border:3px solid ${ink}}th{font-family:Sora,sans-serif;font-weight:700;font-size:19px;letter-spacing:1.5px;padding:11px 4px;text-transform:uppercase;background:${head};border:2px solid ${ink}}td{height:${Math.floor(880 / grid.weeks.length)}px;vertical-align:top;padding:7px 12px;border:2px solid ${line}}td.we{background:${tint}}td b{display:block;font-family:Sora,sans-serif;font-weight:700;font-size:36px;line-height:1.1}td.hol b,td span{color:${accent}}td span{display:block;margin-top:3px;font-size:15px;font-weight:700;line-height:1.2}footer{font-size:15px;text-align:center;padding-top:12px;color:#42556c;letter-spacing:.5px}
  </style></head><body><img class="scene" src="${image}"><h1>${monthNumberToName(month)} ${year}</h1><table><thead><tr>${weekdays.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${grid.weeks.map(w => `<tr>${w.map((c, i) => { const names = c ? holidays.get(c.day) : undefined; return `<td class="${weekend(i) ? "we" : ""}${names ? " hol" : ""}">${c ? `<b>${c.day}</b>${(names ?? []).map(n => `<span>${n.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`).join("")}` : ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table><footer>freshcalendars.com</footer></body></html>`;
}
/**
 * Large Print: the layout the image results for "<month> <year> calendar" are made of. A wide page,
 * the month and year in heavy capitals, dates big enough to read in a thumbnail, and each US
 * holiday named in its box.
 */
function largePrintHtml(year: number, month: number, start: 0 | 1) {
  const grid = buildMonthGrid({ year, month, weekStartsOn: start });
  const weekdays = start ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const holidays = new Map<number, string[]>();
  for (const h of holidaysForMonth(year, month)) holidays.set(h.day, [...(holidays.get(h.day) ?? []), h.name]);
  const weekend = (i: number) => (start ? i >= 5 : i === 0 || i === 6);
  const rowHeight = Math.floor(888 / grid.weeks.length);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;width:1600px;height:1236px;padding:40px 48px 0;color:#16202b;background:#fff;font-family:Manrope,sans-serif}h1{font-family:Sora,sans-serif;font-weight:700;text-align:center;font-size:96px;line-height:1;margin:0 0 30px;letter-spacing:3px;text-transform:uppercase}table{width:100%;border-collapse:collapse;table-layout:fixed;border:4px solid #16202b}th{font-family:Sora,sans-serif;font-weight:700;font-size:22px;letter-spacing:1.5px;padding:14px 4px;text-transform:uppercase;border:2px solid #16202b;background:#e9eef3}td{height:${rowHeight}px;vertical-align:top;padding:8px 14px;border:2px solid #16202b}td.we{background:#f4f6f9}td b{display:block;font-family:Sora,sans-serif;font-weight:700;font-size:46px;line-height:1.1}td.hol b{color:#b3261e}td span{display:block;margin-top:4px;font-size:19px;line-height:1.2;color:#b3261e}footer{font-size:16px;text-align:center;padding-top:14px;color:#42556c;letter-spacing:.5px}
  </style></head><body><h1>${monthNumberToName(month)} ${year}</h1><table><thead><tr>${weekdays.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${grid.weeks.map(w => `<tr>${w.map((c, i) => { const names = c ? holidays.get(c.day) : undefined; return `<td class="${weekend(i) ? "we" : ""}${names ? " hol" : ""}">${c ? `<b>${c.day}</b>${(names ?? []).map(n => `<span>${n.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`).join("")}` : ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table><footer>freshcalendars.com</footer></body></html>`;
}
export async function ensureStudioAssets(years: number[]) {
  const dir = path.join(DIST_ASSETS, "studio");
  await fs.mkdir(dir, { recursive: true });
  const manifestPath = path.join(dir, ".build.json");
  const old = JSON.parse(await fs.readFile(manifestPath, "utf8").catch(() => "{}"));
  // The sheets are drawn from the monthly print templates and renderHtml.ts, so a change in
  // either must remake them; hashing only this file left old captions on the live PDFs.
  const stampHash = crypto.createHash("sha256").update("studio-v1").update(await fs.readFile(new URL(import.meta.url)));
  stampHash.update(await fs.readFile(new URL("./renderHtml.ts", import.meta.url)));
  const templateDir = path.join(ROOT, "packages/templates/monthly");
  for (const name of (await fs.readdir(templateDir)).sort()) stampHash.update(name).update(await fs.readFile(path.join(templateDir, name)));
  const stamp = stampHash.digest("hex");
  const browser = await chromium.launch({ headless: true });
  const fontDir = path.join(ROOT, "packages/generator/node_modules/@fontsource");
  const fonts = await Promise.all([["Manrope", "manrope", 400], ["Manrope", "manrope", 700], ["Sora", "sora", 700]].map(async ([name, pkg, weight]) => `@font-face{font-family:'${name}';font-weight:${weight};src:url(data:font/woff2;base64,${(await fs.readFile(path.join(fontDir, String(pkg), "files", `${pkg}-latin-${weight}-normal.woff2`))).toString("base64")})}`));
  const images: Record<string, string> = {};
  for (const season of ["winter", "spring", "summer", "autumn"]) images[season] = `data:image/webp;base64,${(await fs.readFile(path.join(ROOT, "brand/design", `${season}-v1.webp`))).toString("base64")}`;
  const jobs = years.flatMap(year => Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => STUDIO_STYLES.flatMap(style => ([0, 1] as const).map(start => ({ year, month, style, start })))));
  let changed = 0;
  try {
    await Promise.all(Array.from({ length: 3 }, async () => {
      const page = await browser.newPage();
      // A second page at twice the pixel density draws the search image; the print files keep theirs.
      const big = await browser.newPage({ deviceScaleFactor: 2 });
      for (let job; (job = jobs.shift());) {
        const { year, month, style, start } = job;
        const key = `${year}/${month}/${style.id}/${start}`;
        const paths = ["letter", "a4"].map(paper => studioAssets(year, month, style.id, paper, start ? "monday" : "sunday"));
        const search = start ? null : monthSearchImage(year, month, style.id);
        if (old[key] === stamp && await exists(path.join(ROOT, "dist", paths[1]!.pdf)) && (!search || await searchImageReady(search))) continue;
        const decorated = style.id === "scenic" || style.id === "floral";
        // Always drawn here: a copy from the year's monthly folder can be older than the templates
        // (only this year and next are rebuilt there).
        let html = decorated ? scenicHtml(year, month, start, images[style.id === "floral" ? "spring" : seasonFor(month)]!, style.id === "floral") : style.id === "large-print" ? largePrintHtml(year, month, start) : renderMonthlyPrintHtml(year, month, style.id as MonthlyVariantId, { weekStartsOn: start });
        html = html.replace(/<link[^>]+fonts.googleapis.com[^>]*>/g, "").replace("</head>", `<style>${fonts.join("")}</style></head>`);
        const { width, height } = monthSheetSize(style.id);
        await page.setViewportSize({ width, height });
        await page.setContent(html, { waitUntil: "load" }); await page.evaluate(() => document.fonts.ready);
        const png = await page.screenshot({ type: "png" }), pdf = await page.pdf({ width: `${width}px`, height: `${height}px`, printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
        for (let i = 0; i < paths.length; i++) {
          const files = paths[i]!, landscape = WIDE_STYLES.has(style.id);
          const points = i === 0 ? [612, 792] : [595.276, 841.89]; if (landscape) points.reverse();
          const doc = await PDFDocument.create(); const embedded = await doc.embedPdf(pdf);
          for (const source of embedded) { const sheet = doc.addPage(points); const scale = Math.min(points[0]! / source.width, points[1]! / source.height); sheet.drawPage(source, { x: (points[0]! - source.width * scale) / 2, y: (points[1]! - source.height * scale) / 2, width: source.width * scale, height: source.height * scale }); }
          doc.setTitle(`${monthNumberToName(month)} ${year} Calendar, ${style.label}, ${i ? "A4" : "US Letter"}, ${start ? "Monday" : "Sunday"} start`); doc.setAuthor("Fresh Calendars");
          const target = path.join(ROOT, "dist", files.pdf); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, await doc.save());
          const size = landscape ? { width: i ? 1556 : 1424, height: 1100 } : { width: 1100, height: i ? 1556 : 1424 };
          await sharp(png).resize({ ...size, fit: "contain", background: "#fff" }).png().toFile(path.join(ROOT, "dist", files.png));
          await sharp(path.join(ROOT, "dist", files.png)).resize({ width: 500 }).webp({ quality: 83 }).toFile(path.join(ROOT, "dist", files.preview));
        }
        if (search) {
          await big.setViewportSize({ width, height });
          await big.setContent(html, { waitUntil: "load" }); await big.evaluate(() => document.fonts.ready);
          await writeSearchImage(await big.screenshot({ type: "png" }), search);
        }
        old[key] = stamp; changed++;
        if (changed % 24 === 0) console.log(`studio: ${changed} calendar configurations generated`);
      }
      await page.close(); await big.close();
    }));
  } finally { await browser.close(); }
  await fs.writeFile(manifestPath, JSON.stringify(old)); console.log(`studio: ${changed} configurations updated`);
}

export async function ensureOtherPaperAssets() {
  const walk = async (dir: string): Promise<string[]> => (await Promise.all((await fs.readdir(dir, { withFileTypes: true })).filter(e => e.name !== "studio" && e.name !== "monthly").map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.name === "calendar.pdf" ? [path.join(dir, e.name)] : []))).flat();
  const yearlyFolder = path.join(DIST_ASSETS, "studio/yearly");
  const extra = await fs.stat(yearlyFolder).then(() => walk(yearlyFolder)).catch(() => []);
  // A paper-size copy is stale when its source sheet changed (a template edit), not only when it is
  // missing: the manifest keeps the hash of the PNG each copy was made from.
  const manifestPath = path.join(DIST_ASSETS, ".paper-build.json");
  const made: Record<string, string> = JSON.parse(await fs.readFile(manifestPath, "utf8").catch(() => "{}"));
  for (const file of [...await walk(DIST_ASSETS), ...extra]) {
    const source = await fs.readFile(file), pngFile = file.replace(/\.pdf$/, ".png");
    const key = path.relative(DIST_ASSETS, file), hash = crypto.createHash("sha1").update(await fs.readFile(pngFile)).digest("hex");
    const fresh = made[key] === hash; made[key] = hash;
    const info = await sharp(pngFile).metadata(); const landscape = info.width! > info.height!;
    for (const paper of ["letter", "a4"]) {
      const target = file.replace(/\.pdf$/, `-${paper}.pdf`);
      if (fresh && await fs.stat(target).then(() => true).catch(() => false)) continue;
      const points = paper === "letter" ? [612, 792] : [595.276, 841.89]; if (landscape) points.reverse();
      const doc = await PDFDocument.create();
      for (const page of await doc.embedPdf(source)) { const sheet = doc.addPage(points); const scale = Math.min(points[0]! / page.width, points[1]! / page.height); sheet.drawPage(page, { x: (points[0]! - page.width * scale) / 2, y: (points[1]! - page.height * scale) / 2, width: page.width * scale, height: page.height * scale }); }
      doc.setAuthor("Fresh Calendars"); doc.setTitle(`Printable calendar, ${paper === "a4" ? "A4" : "US Letter"}`); await fs.writeFile(target, await doc.save());
      const ratio = points[0]! / points[1]!; const width = landscape ? Math.round(1100 * ratio) : 1100, height = landscape ? 1100 : Math.round(1100 / ratio);
      await sharp(pngFile).resize({ width, height, fit: "contain", background: "#fff" }).png().toFile(target.replace(/\.pdf$/, ".png"));
      await sharp(target.replace(/\.pdf$/, ".png")).resize({ width: 500 }).webp({ quality: 83 }).toFile(target.replace(/\.pdf$/, ".webp"));
    }
  }  await fs.writeFile(manifestPath, JSON.stringify(made));
}

export async function ensureYearlyStudio(years: number[]) {
  const browser = await chromium.launch({ headless: true }); const page = await browser.newPage({ viewport: { width: 1100, height: 1424 } });
  const big = await browser.newPage({ deviceScaleFactor: 2 });
  // The posters are redrawn by gen.ts when a template changes; the stamp remakes their search images
  // then too. It lives in the studio manifest, which the daily job keeps between runs.
  const manifestPath = path.join(DIST_ASSETS, "studio", ".build.json");
  const made: Record<string, string> = JSON.parse(await fs.readFile(manifestPath, "utf8").catch(() => "{}"));
  const stampHash = crypto.createHash("sha256").update("year-search-v1").update(await fs.readFile(new URL(import.meta.url)));
  stampHash.update(await fs.readFile(new URL("./renderHtml.ts", import.meta.url)));
  const templateDir = path.join(ROOT, "packages/templates/yearly");
  for (const name of (await fs.readdir(templateDir)).sort()) stampHash.update(name).update(await fs.readFile(path.join(templateDir, name)));
  const stamp = stampHash.digest("hex");
  try {
    for (const year of years) for (const design of ["minimal", "floral", ...YEARLY_VARIANTS.map(v => v.id)]) {
      const custom = design === "minimal" || design === "floral";
      const folder = custom ? path.join(DIST_ASSETS, "studio/yearly", String(year), design) : path.join(DIST_ASSETS, String(year), "yearly", design);
      const pdf = path.join(folder, "calendar.pdf");
      const search = custom ? null : yearSearchImage(year, design);
      const key = `year-search/${year}/${design}`;
      // The stamp remakes the sheet too: gen.ts redraws posters only for this year and next, and the
      // later years' posters would otherwise keep an old template under a new search image.
      const sheetKey = `year-sheet/${year}/${design}`;
      const sheetReady = await exists(pdf) && made[sheetKey] === stamp, searchReady = !search || (made[key] === stamp && await searchImageReady(search));
      if (sheetReady && searchReady) continue;
      await fs.mkdir(folder, { recursive: true });
      const floral = design === "floral";
      const image = floral ? `data:image/webp;base64,${(await fs.readFile(path.join(ROOT, "brand/design/spring-v1.webp"))).toString("base64")}` : "";
      // Six rows a month, so the twelve boxes line up and fill the sheet.
      const months = buildYearMonths(year).map(g => { const hol = new Set(holidaysForMonth(year, g.month).map(h => h.day)); const weeks = [...g.weeks, ...Array.from({ length: 6 - g.weeks.length }, () => Array(7).fill(null))]; return `<section><h2>${g.monthName}</h2><table><thead><tr>${["S","M","T","W","T","F","S"].map(d=>`<th>${d}</th>`).join("")}</tr></thead><tbody>${weeks.map(w=>`<tr>${w.map((c: { day: number } | null)=>`<td${c && hol.has(c.day) ? ' class="hol"' : ""}>${c ? `<span>${c.day}</span>` : ""}</td>`).join("")}</tr>`).join("")}</tbody></table></section>`; }).join("");
      const ink = floral ? "#4a2238" : "#000", accent = floral ? "#b0306a" : "#000";
      let html = custom ? `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@700&family=Manrope:wght@400;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{width:1100px;height:1424px;margin:0;padding:38px 44px 0;font-family:Manrope,sans-serif;color:${ink};background:#fff}header{height:${floral?190:112}px;position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:20px;overflow:hidden;${floral?"border-radius:14px":`border-bottom:6px solid ${ink}`}}header img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}h1{position:relative;font-family:Sora,sans-serif;font-weight:700;font-size:92px;line-height:1;letter-spacing:-2px;margin:0;${floral?"background:rgba(255,255,255,.88);padding:14px 34px;border-radius:14px":""}}main{display:grid;grid-template-columns:repeat(3,1fr);gap:${floral?"8px":"20px"} 26px}h2{font-family:Sora,sans-serif;font-weight:700;font-size:23px;line-height:36px;margin:0;text-align:center;color:${accent};border-bottom:3px solid ${ink}}table{width:100%;table-layout:fixed;border-collapse:collapse}th{height:28px;font-family:Sora,sans-serif;font-weight:700;font-size:15px}td{height:${floral?33:36}px;padding:0;font-size:19px;font-weight:700;line-height:1;text-align:center}td span{display:inline-block;min-width:${floral?30:32}px;line-height:${floral?30:32}px;border-radius:50%}td.hol span{box-shadow:inset 0 0 0 2.5px ${accent}}footer{text-align:center;font-size:15px;padding-top:12px;letter-spacing:.5px;color:#42556c}</style></head><body><header>${floral?`<img src="${image}">`:""}<h1>${year} Calendar</h1></header><main>${months}</main><footer>freshcalendars.com</footer></body></html>` : renderYearlyPrintHtml(year, design as typeof YEARLY_VARIANTS[number]["id"]);
      // Web fonts and networkidle, as the posters drawn by gen.ts use (playwrightRender.ts).
      const size = custom ? {width:1100,height:1424} : YEARLY_VARIANTS.find(v=>v.id===design)!.size;
      if (!sheetReady) {
        await page.setViewportSize(size); await page.setContent(html,{waitUntil:"networkidle"});
        await page.screenshot({path:path.join(folder,"calendar.png"),type:"png"}); await page.pdf({path:pdf,width:`${size.width}px`,height:`${size.height}px`,printBackground:true,margin:{top:"0",bottom:"0",left:"0",right:"0"}});
        await sharp(path.join(folder,"calendar.png")).resize({width:500}).webp({quality:83}).toFile(path.join(folder,"calendar-preview.webp"));
        made[sheetKey] = stamp;
      }
      if (search && !searchReady) {
        await big.setViewportSize(size); await big.setContent(html,{waitUntil:"networkidle"});
        await writeSearchImage(await big.screenshot({type:"png"}), search);
        made[key] = stamp;
      }
    }
  } finally { await browser.close(); }
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(made));
}
