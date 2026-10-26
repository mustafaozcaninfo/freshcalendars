/** Real printable assets for the concept's paper/start-day/style controls. */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import sharp from "sharp";
import { buildMonthGrid, buildYearMonths, monthNumberToName, MONTH_SLUGS } from "@freshcalendars/engine";
import { ROOT, DIST_ASSETS } from "./paths.js";
import { renderMonthlyPrintHtml, renderYearlyPrintHtml } from "./renderHtml.js";
import { YEARLY_VARIANTS, type MonthlyVariantId } from "./catalog.js";
const require = createRequire(path.join(ROOT, "apps/news/package.json"));
const { PDFDocument } = require("pdf-lib");

export const STUDIO_STYLES = [
  { id: "scenic", label: "Classic", description: "Seasonal photograph with a clean writing grid" },
  { id: "color-modern", label: "Modern", description: "Color accents and rounded date boxes" },
  { id: "classic-bw", label: "Minimal", description: "Crisp black and white, easy on ink" },
  { id: "floral", label: "Floral", description: "Delicate blossoms and a soft botanical palette" },
  { id: "landscape-soft", label: "Landscape", description: "A wide sheet for your desk or wall" },
  { id: "holidays", label: "Holidays", description: "US holidays labeled in each month" },
  { id: "notes-planner", label: "Planner", description: "Extra room for notes and handwriting" },
] as const;
export type StudioStyle = typeof STUDIO_STYLES[number]["id"];
export function studioAssets(year: number, month: number, style: string = "scenic", paper = "letter", start = "sunday") {
  const base = `/assets/studio/${year}/${MONTH_SLUGS[month - 1]}/${style}/${paper}-${start}`;
  return { png: `${base}.png`, pdf: `${base}.pdf`, preview: `${base}.webp` };
}
export function seasonFor(month: number): string {
  return month <= 2 || month === 12 ? "winter" : month <= 5 ? "spring" : month <= 8 ? "summer" : "autumn";
}
function scenicHtml(year: number, month: number, start: 0 | 1, image: string, floral: boolean) {
  const grid = buildMonthGrid({ year, month, weekStartsOn: start });
  const weekdays = start ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;width:1100px;height:1424px;padding:30px;color:#21364b;background:#fff;font-family:Manrope,sans-serif}.sheet{height:100%;border:1px solid #d5dfe7;display:flex;flex-direction:column}.scene{width:100%;height:280px;object-fit:cover}h1{font-family:Sora,sans-serif;text-align:center;font-size:48px;margin:20px 0 24px;letter-spacing:-2px}table{width:100%;border-collapse:collapse;table-layout:fixed;flex:1}th{font-size:15px;padding:15px 4px;text-transform:uppercase;color:#42556c;background:${floral ? "#f6eef2" : "#eef5fa"};border:1px solid #d5dfe7}td{height:${grid.weeks.length === 6 ? 143 : 171}px;vertical-align:top;padding:12px;border:1px solid #d5dfe7;font-size:21px}td:first-child,td:last-child{background:${floral ? "#fffbfc" : "#fafcfd"}}footer{font-size:11px;text-align:center;padding:15px;color:#526274;letter-spacing:1px}
  </style></head><body><div class="sheet"><img class="scene" src="${image}"><h1>${monthNumberToName(month)} ${year}</h1><table><thead><tr>${weekdays.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${grid.weeks.map(w => `<tr>${w.map(c => `<td>${c?.day ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table><footer>FRESHCALENDARS.COM · FREE FOR PERSONAL & CLASSROOM USE</footer></div></body></html>`;
}
export async function ensureStudioAssets(years: number[]) {
  const dir = path.join(DIST_ASSETS, "studio");
  await fs.mkdir(dir, { recursive: true });
  const manifestPath = path.join(dir, ".build.json");
  const old = JSON.parse(await fs.readFile(manifestPath, "utf8").catch(() => "{}"));
  const stamp = crypto.createHash("sha256").update("studio-v1").update(await fs.readFile(new URL(import.meta.url))).digest("hex");
  const browser = await chromium.launch({ headless: true });
  const fontDir = path.join(ROOT, "packages/generator/node_modules/@fontsource");
  const fonts = await Promise.all([["Manrope", "manrope", 400], ["Sora", "sora", 700]].map(async ([name, pkg, weight]) => `@font-face{font-family:'${name}';font-weight:${weight};src:url(data:font/woff2;base64,${(await fs.readFile(path.join(fontDir, String(pkg), "files", `${pkg}-latin-${weight}-normal.woff2`))).toString("base64")})}`));
  const images: Record<string, string> = {};
  for (const season of ["winter", "spring", "summer", "autumn"]) images[season] = `data:image/webp;base64,${(await fs.readFile(path.join(ROOT, "brand/design", `${season}-v1.webp`))).toString("base64")}`;
  const jobs = years.flatMap(year => Array.from({ length: 12 }, (_, i) => i + 1).flatMap(month => STUDIO_STYLES.flatMap(style => ([0, 1] as const).map(start => ({ year, month, style, start })))));
  let changed = 0;
  try {
    await Promise.all(Array.from({ length: 3 }, async () => {
      const page = await browser.newPage();
      for (let job; (job = jobs.shift());) {
        const { year, month, style, start } = job;
        const key = `${year}/${month}/${style.id}/${start}`;
        const paths = ["letter", "a4"].map(paper => studioAssets(year, month, style.id, paper, start ? "monday" : "sunday"));
        if (old[key] === stamp && await fs.stat(path.join(ROOT, "dist", paths[1]!.pdf)).then(() => true).catch(() => false)) continue;
        const decorated = style.id === "scenic" || style.id === "floral";
        let png: Buffer, pdf: Buffer;
        const existing = path.join(DIST_ASSETS, String(year), "monthly", MONTH_SLUGS[month - 1]!, style.id);
        if (!decorated && start === 0 && await fs.stat(path.join(existing, "calendar.pdf")).then(() => true).catch(() => false)) {
          png = await fs.readFile(path.join(existing, "calendar.png")); pdf = await fs.readFile(path.join(existing, "calendar.pdf"));
        } else {
          let html = decorated ? scenicHtml(year, month, start, images[style.id === "floral" ? "spring" : seasonFor(month)]!, style.id === "floral") : renderMonthlyPrintHtml(year, month, style.id as MonthlyVariantId, { weekStartsOn: start });
          html = html.replace(/<link[^>]+fonts.googleapis.com[^>]*>/g, "").replace("</head>", `<style>${fonts.join("")}</style></head>`);
          const width = style.id === "landscape-soft" ? 1600 : 1100, height = style.id === "landscape-soft" ? 1100 : decorated ? 1424 : 1420;
          await page.setViewportSize({ width, height });
          await page.setContent(html, { waitUntil: "load" }); await page.evaluate(() => document.fonts.ready);
          png = await page.screenshot({ type: "png" }); pdf = await page.pdf({ width: `${width}px`, height: `${height}px`, printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
        }
        for (let i = 0; i < paths.length; i++) {
          const files = paths[i]!, landscape = style.id === "landscape-soft";
          const points = i === 0 ? [612, 792] : [595.276, 841.89]; if (landscape) points.reverse();
          const doc = await PDFDocument.create(); const embedded = await doc.embedPdf(pdf);
          for (const source of embedded) { const sheet = doc.addPage(points); const scale = Math.min(points[0]! / source.width, points[1]! / source.height); sheet.drawPage(source, { x: (points[0]! - source.width * scale) / 2, y: (points[1]! - source.height * scale) / 2, width: source.width * scale, height: source.height * scale }); }
          doc.setTitle(`${monthNumberToName(month)} ${year} calendar · ${style.label} · ${i ? "A4" : "US Letter"} · ${start ? "Monday" : "Sunday"} start`); doc.setAuthor("Fresh Calendars");
          const target = path.join(ROOT, "dist", files.pdf); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, await doc.save());
          const size = landscape ? { width: i ? 1556 : 1424, height: 1100 } : { width: 1100, height: i ? 1556 : 1424 };
          await sharp(png).resize({ ...size, fit: "contain", background: "#fff" }).png().toFile(path.join(ROOT, "dist", files.png));
          await sharp(path.join(ROOT, "dist", files.png)).resize({ width: 500 }).webp({ quality: 83 }).toFile(path.join(ROOT, "dist", files.preview));
        }
        old[key] = stamp; changed++;
        if (changed % 24 === 0) console.log(`studio: ${changed} calendar configurations generated`);
      }
      await page.close();
    }));
  } finally { await browser.close(); }
  await fs.writeFile(manifestPath, JSON.stringify(old)); console.log(`studio: ${changed} configurations updated`);
}

export async function ensureOtherPaperAssets() {
  const walk = async (dir: string): Promise<string[]> => (await Promise.all((await fs.readdir(dir, { withFileTypes: true })).filter(e => e.name !== "studio" && e.name !== "monthly").map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.name === "calendar.pdf" ? [path.join(dir, e.name)] : []))).flat();
  const yearlyFolder = path.join(DIST_ASSETS, "studio/yearly");
  const extra = await fs.stat(yearlyFolder).then(() => walk(yearlyFolder)).catch(() => []);
  for (const file of [...await walk(DIST_ASSETS), ...extra]) {
    const source = await fs.readFile(file), pngFile = file.replace(/\.pdf$/, ".png");
    const info = await sharp(pngFile).metadata(); const landscape = info.width! > info.height!;
    for (const paper of ["letter", "a4"]) {
      const target = file.replace(/\.pdf$/, `-${paper}.pdf`);
      if (await fs.stat(target).then(s => s.mtimeMs >= 0).catch(() => false)) continue;
      const points = paper === "letter" ? [612, 792] : [595.276, 841.89]; if (landscape) points.reverse();
      const doc = await PDFDocument.create();
      for (const page of await doc.embedPdf(source)) { const sheet = doc.addPage(points); const scale = Math.min(points[0]! / page.width, points[1]! / page.height); sheet.drawPage(page, { x: (points[0]! - page.width * scale) / 2, y: (points[1]! - page.height * scale) / 2, width: page.width * scale, height: page.height * scale }); }
      doc.setAuthor("Fresh Calendars"); doc.setTitle(`Printable calendar · ${paper === "a4" ? "A4" : "US Letter"}`); await fs.writeFile(target, await doc.save());
      const ratio = points[0]! / points[1]!; const width = landscape ? Math.round(1100 * ratio) : 1100, height = landscape ? 1100 : Math.round(1100 / ratio);
      await sharp(pngFile).resize({ width, height, fit: "contain", background: "#fff" }).png().toFile(target.replace(/\.pdf$/, ".png"));
      await sharp(target.replace(/\.pdf$/, ".png")).resize({ width: 500 }).webp({ quality: 83 }).toFile(target.replace(/\.pdf$/, ".webp"));
    }
  }
}

export async function ensureYearlyStudio(years: number[]) {
  const browser = await chromium.launch({ headless: true }); const page = await browser.newPage({ viewport: { width: 1100, height: 1424 } });
  try {
    for (const year of years) for (const design of ["minimal", "floral", ...YEARLY_VARIANTS.map(v => v.id)]) {
      const custom = design === "minimal" || design === "floral";
      const folder = custom ? path.join(DIST_ASSETS, "studio/yearly", String(year), design) : path.join(DIST_ASSETS, String(year), "yearly", design);
      const pdf = path.join(folder, "calendar.pdf");
      if (await fs.stat(pdf).then(() => true).catch(() => false)) continue;
      await fs.mkdir(folder, { recursive: true });
      const floral = design === "floral";
      const image = floral ? `data:image/webp;base64,${(await fs.readFile(path.join(ROOT, "brand/design/spring-v1.webp"))).toString("base64")}` : "";
      const months = buildYearMonths(year).map(g => `<section><h2>${g.monthName}</h2><table><thead><tr>${["S","M","T","W","T","F","S"].map(d=>`<th>${d}</th>`).join("")}</tr></thead><tbody>${g.weeks.map(w=>`<tr>${w.map(c=>`<td>${c?.day??""}</td>`).join("")}</tr>`).join("")}</tbody></table></section>`).join("");
      let html = custom ? `<!doctype html><html><head><style>*{box-sizing:border-box}body{width:1100px;height:1424px;margin:0;padding:35px;font-family:Arial,sans-serif;color:#172c3e}header{height:${floral?220:120}px;position:relative;display:grid;place-items:center;margin-bottom:25px;overflow:hidden}header img{position:absolute;width:100%;height:100%;object-fit:cover;opacity:.5}h1{position:relative;font-size:80px;margin:0}main{display:grid;grid-template-columns:repeat(3,1fr);gap:20px 30px;height:${floral?1070:1170}px}section{min-width:0}h2{font-size:19px;margin:0 0 9px;text-align:center;font-weight:500}table{width:100%;table-layout:fixed;border-collapse:collapse}th{font-size:11px;padding:7px;border-bottom:1px solid #cbd5df}td{font-size:15px;text-align:center;padding:9px 2px;border-bottom:1px solid #eef1f4}footer{text-align:center;font-size:10px;margin-top:25px;letter-spacing:2px}</style></head><body><header>${floral?`<img src="${image}">`:""}<h1>${year}</h1></header><main>${months}</main><footer>FRESHCALENDARS.COM</footer></body></html>` : renderYearlyPrintHtml(year, design as typeof YEARLY_VARIANTS[number]["id"]);
      html = html.replace(/<link[^>]+fonts.googleapis.com[^>]*>/g, "");
      const size = custom ? {width:1100,height:1424} : YEARLY_VARIANTS.find(v=>v.id===design)!.size;
      await page.setViewportSize(size); await page.setContent(html,{waitUntil:"load"});
      await page.screenshot({path:path.join(folder,"calendar.png"),type:"png"}); await page.pdf({path:pdf,width:`${size.width}px`,height:`${size.height}px`,printBackground:true,margin:{top:"0",bottom:"0",left:"0",right:"0"}});
      await sharp(path.join(folder,"calendar.png")).resize({width:500}).webp({quality:83}).toFile(path.join(folder,"calendar-preview.webp"));
    }
  } finally { await browser.close(); }
}
