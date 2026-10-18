/**
 * Julian date printables for /news/ (four independent Fresh Calendars templates).
 *
 *   1. day-of-year-chart     — year at a glance, 001–365/366, weekends + federal holidays
 *   2. monthly-julian        — 12 monthly pages with date, day of year and days left
 *   3. date-code-lookup      — every date with DDD, YYDDD and YDDD (food, warehouse, military codes)
 *   4. astronomical-jd-chart — Julian Day Number at 12:00 UT and MJD for every day (landscape)
 *
 * Output: apps/news/public/downloads/julian-date-calendar/<year>/<slug>.{pdf,png}
 *         apps/news/src/assets/news/julian-date-calendar/<year>-<slug>.png (preview for Astro Image)
 * Usage:  pnpm fc news-julian [--years 2026,2027]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { holidaysForYear } from "@freshcalendars/engine";
import { ROOT } from "./paths.js";

const OUT_PUBLIC = path.join(ROOT, "apps/news/public/downloads/julian-date-calendar");
const OUT_ASSETS = path.join(ROOT, "apps/news/src/assets/news/julian-date-calendar");
const SITE = "freshcalendars.com/news/julian-date-calendar-2027-2026-printable/";

// US Letter at 96 px/in; PNGs are rendered at 2x for print quality.
export const LETTER = { width: 816, height: 1056 };
export const LETTER_LANDSCAPE = { width: 1056, height: 816 };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MON3 = MONTHS.map((m) => m.slice(0, 3));
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const daysInYear = (y: number) => (isLeap(y) ? 366 : 365);
const pad3 = (n: number) => String(n).padStart(3, "0");
export function dayOfYear(y: number, m: number, d: number): number {
  return Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
}
/** Julian Day Number of a Gregorian date (the JD at 12:00 UT that day). */
export function julianDayNumber(y: number, m1: number, d: number): number {
  const a = Math.floor((14 - m1) / 12);
  const yy = y + 4800 - a;
  const mm = m1 + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

export async function fontFaces(): Promise<string> {
  const f = (pkg: string, file: string) => path.join(ROOT, "packages/generator/node_modules/@fontsource", pkg, "files", file);
  const faces: [string, number, string][] = [
    ["Sora", 700, f("sora", "sora-latin-700-normal.woff2")],
    ["Sora", 800, f("sora", "sora-latin-800-normal.woff2")],
    ["Manrope", 500, f("manrope", "manrope-latin-500-normal.woff2")],
    ["Manrope", 700, f("manrope", "manrope-latin-700-normal.woff2")],
  ];
  const css: string[] = [];
  for (const [family, weight, file] of faces) {
    try {
      const b64 = (await fs.readFile(file)).toString("base64");
      css.push(`@font-face{font-family:${family};font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format("woff2")}`);
    } catch { /* weight not installed: falls back to the nearest one */ }
  }
  return css.join("");
}

export function doc(fonts: string, size: { width: number; height: number }, css: string, pages: string[]): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${fonts}
  @page{size:${size.width}px ${size.height}px;margin:0}
  *{box-sizing:border-box}html,body{margin:0;padding:0}
  body{font-family:Manrope,Arial,sans-serif;color:#1d2a3a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:${size.width}px;height:${size.height}px;overflow:hidden;position:relative;page-break-after:always;break-after:page}
  .page:last-child{page-break-after:auto;break-after:auto}
  .foot{position:absolute;left:0;right:0;bottom:18px;text-align:center;font-size:9px;color:#5a6b75;letter-spacing:.02em}
  ${css}
  </style></head><body>${pages.join("")}</body></html>`;
}

const holidayMap = (y: number) =>
  new Map(holidaysForYear(y, { federalOnly: true }).map((h) => [`${h.date.getMonth()}-${h.date.getDate()}`, h.name]));

// ── 1. Day-of-year chart ───────────────────────────────────────────────────
function dayOfYearChart(y: number, fonts: string): string {
  const hol = holidayMap(y);
  let rows = "";
  for (let d = 1; d <= 31; d++) {
    rows += `<tr><th>${d}</th>`;
    for (let m = 0; m < 12; m++) {
      if (d > daysInMonth(y, m)) { rows += `<td class="na"></td>`; continue; }
      const wd = new Date(Date.UTC(y, m, d)).getUTCDay();
      const cls = hol.has(`${m}-${d}`) ? "hol" : wd === 0 || wd === 6 ? "we" : "";
      rows += `<td class="${cls}">${pad3(dayOfYear(y, m, d))}</td>`;
    }
    rows += `</tr>`;
  }
  const css = `
  .p1{padding:44px 44px 0}
  .p1 h1{font-family:Sora;font-weight:800;font-size:34px;margin:0;color:#0b3d66;letter-spacing:-.01em}
  .p1 .sub{margin:4px 0 14px;font-size:13px;color:#37474f}
  .p1 .bar{height:6px;background:linear-gradient(90deg,#007bff 0 70%,#fccc00 70% 100%);border-radius:3px;margin-bottom:14px}
  .p1 table{width:100%;border-collapse:collapse;table-layout:fixed;font-variant-numeric:tabular-nums}
  .p1 th,.p1 td{border:1px solid #c9d6e8;text-align:center;font-size:11.5px;height:25px}
  .p1 thead th{background:#0b3d66;color:#fff;font-family:Sora;font-weight:700;font-size:11px;height:28px}
  .p1 tbody th{background:#eef4fb;color:#0b3d66;font-weight:700;width:34px}
  .p1 td.we{background:#e8f1ff}
  .p1 td.hol{background:#fff1b8;font-weight:700}
  .p1 td.na{background:repeating-linear-gradient(45deg,#f2f4f7 0 4px,#fff 4px 8px)}
  .p1 .legend{display:flex;gap:18px;font-size:11px;margin-top:10px;color:#37474f}
  .p1 .legend i{display:inline-block;width:14px;height:12px;border:1px solid #c9d6e8;vertical-align:-2px;margin-right:5px}`;
  const page = `<section class="page p1">
    <h1>${y} Julian Date Calendar</h1>
    <p class="sub">Day of the year, 001 to ${daysInYear(y)} · ${isLeap(y) ? "leap year (Feb. 29 = 060)" : "not a leap year"} · Find the month, then the date</p>
    <div class="bar"></div>
    <table><thead><tr><th></th>${MON3.map((m) => `<th>${m}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
    <div class="legend"><span><i style="background:#e8f1ff"></i>Weekend</span><span><i style="background:#fff1b8"></i>U.S. federal holiday (actual date)</span><span><i style="background:repeating-linear-gradient(45deg,#f2f4f7 0 4px,#fff 4px 8px)"></i>No such date</span></div>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── 2. Monthly Julian calendar (12 pages) ──────────────────────────────────
function monthlyJulian(y: number, fonts: string): string {
  const hol = holidayMap(y);
  const total = daysInYear(y);
  const pages = MONTHS.map((name, m) => {
    const first = new Date(Date.UTC(y, m, 1)).getUTCDay();
    const dim = daysInMonth(y, m);
    const cells: string[] = [];
    for (let i = 0; i < first; i++) cells.push(`<div class="c empty"></div>`);
    for (let d = 1; d <= dim; d++) {
      const doy = dayOfYear(y, m, d);
      const h = hol.get(`${m}-${d}`);
      cells.push(`<div class="c${h ? " h" : ""}"><b>${d}</b><span class="doy">${pad3(doy)}</span><span class="left">${total - doy} left</span>${h ? `<span class="hn">${h}</span>` : ""}</div>`);
    }
    while (cells.length % 7) cells.push(`<div class="c empty"></div>`);
    const startDoy = dayOfYear(y, m, 1), endDoy = dayOfYear(y, m, dim);
    return `<section class="page p2">
      <header><div><h1>${name}</h1><p>${y} · Julian days ${pad3(startDoy)} to ${pad3(endDoy)}</p></div><div class="badge">${String(m + 1).padStart(2, "0")}</div></header>
      <div class="dow">${DOW.map((d) => `<span>${d}</span>`).join("")}</div>
      <div class="grid rows${cells.length / 7}">${cells.join("")}</div>
      <div class="notes"><span>Notes</span><i></i><i></i><i></i></div>
      <div class="foot">Fresh Calendars Julian date calendar ${y} · page ${m + 1} of 12 · ${SITE}</div>
    </section>`;
  });
  const css = `
  .p2{padding:40px 40px 0}
  .p2 header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:5px solid #ec1d00;padding-bottom:10px;margin-bottom:12px}
  .p2 h1{font-family:Sora;font-weight:800;font-size:46px;margin:0;color:#0092d1;line-height:1}
  .p2 header p{margin:6px 0 0;font-size:13px;color:#37474f}
  .p2 .badge{font-family:Sora;font-weight:800;font-size:40px;color:#fff;background:#0092d1;border-radius:12px;padding:6px 16px}
  .p2 .dow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px}
  .p2 .dow span{text-align:center;font-family:Sora;font-weight:700;font-size:12px;color:#0b3d66;text-transform:uppercase;letter-spacing:.06em}
  .p2 .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;height:640px}
  .p2 .grid.rows4{grid-template-rows:repeat(4,1fr)}.p2 .grid.rows5{grid-template-rows:repeat(5,1fr)}.p2 .grid.rows6{grid-template-rows:repeat(6,1fr)}
  .p2 .c{border:1.5px solid #bfdff0;border-radius:8px;position:relative;padding:6px 7px;background:#fff}
  .p2 .c.empty{border-style:dashed;border-color:#e3eef5;background:#fbfdfe}
  .p2 .c b{font-family:Sora;font-weight:700;font-size:20px;color:#1d2a3a}
  .p2 .c .doy{position:absolute;right:7px;bottom:20px;font-family:Sora;font-weight:800;font-size:17px;color:#0092d1;font-variant-numeric:tabular-nums}
  .p2 .c .left{position:absolute;right:7px;bottom:6px;font-size:9px;color:#5a6b75}
  .p2 .c.h{background:#fff4e5;border-color:#f5b26b}
  .p2 .c .hn{position:absolute;left:7px;top:32px;right:6px;font-size:8.5px;line-height:1.2;color:#b54708;font-weight:700}
  .p2 .notes{margin-top:16px;font-size:12px;color:#37474f;font-weight:700}
  .p2 .notes i{display:block;border-bottom:1px solid #c9d6e8;height:26px}`;
  return doc(fonts, LETTER, css, pages);
}

// ── 3. Date code lookup (YYDDD / YDDD), 2 pages ────────────────────────────
function dateCodeLookup(y: number, fonts: string): string {
  const rows: string[] = [];
  for (let m = 0; m < 12; m++) for (let d = 1; d <= daysInMonth(y, m); d++) {
    const doy = dayOfYear(y, m, d);
    const wd = new Date(Date.UTC(y, m, d)).getUTCDay();
    const yy = String(y % 100).padStart(2, "0");
    rows.push(`<tr class="${d === 1 ? "m1 " : ""}${wd === 0 || wd === 6 ? "we" : ""}"><td>${MON3[m]} ${d}</td><td>${DOW[wd]}</td><td class="k">${pad3(doy)}</td><td>${yy}${pad3(doy)}</td><td>${y % 10}${pad3(doy)}</td></tr>`);
  }
  const perCol = 46, perPage = perCol * 4;
  const head = `<thead><tr><th>Date</th><th>Day</th><th>DDD</th><th>YYDDD</th><th>YDDD</th></tr></thead>`;
  const pages: string[] = [];
  for (let p = 0; p * perPage < rows.length; p++) {
    const cols: string[] = [];
    for (let c = 0; c < 4; c++) {
      const slice = rows.slice(p * perPage + c * perCol, p * perPage + (c + 1) * perCol);
      if (slice.length) cols.push(`<table>${head}<tbody>${slice.join("")}</tbody></table>`);
    }
    pages.push(`<section class="page p3">
      <h1>${y} Julian Date Code Lookup</h1>
      <p class="sub">DDD = day of year · YYDDD = 2-digit year + day (lot and pack codes) · YDDD = 1-digit year + day (U.S. military document numbers)</p>
      <div class="cols">${cols.join("")}</div>
      <div class="foot">Fresh Calendars · ${y} date codes · page ${p + 1} of ${Math.ceil(rows.length / perPage)} · ${SITE}</div>
    </section>`);
  }
  const css = `
  .p3{padding:36px 32px 0}
  .p3 h1{font-family:Sora;font-weight:800;font-size:26px;margin:0;color:#1d2a3a}
  .p3 .sub{margin:4px 0 12px;font-size:10.5px;color:#37474f;border-left:5px solid #2b8a3e;padding-left:8px}
  .p3 .cols{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .p3 table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums;font-size:9.6px}
  .p3 th{background:#2b8a3e;color:#fff;font-family:Sora;font-weight:700;font-size:9px;padding:4px 2px}
  .p3 td{padding:2.6px 3px;border-bottom:1px solid #e1ece4;text-align:center;white-space:nowrap}
  .p3 td:first-child{text-align:left;font-weight:700}
  .p3 td.k{font-family:Sora;font-weight:700;color:#2b8a3e}
  .p3 tr.we td{background:#f1f8f3}
  .p3 tr.m1 td{border-top:2px solid #2b8a3e}`;
  return doc(fonts, LETTER, css, pages);
}

// ── 4. Astronomical Julian Day chart (landscape) ───────────────────────────
function astronomicalJd(y: number, fonts: string): string {
  let rows = "";
  for (let d = 1; d <= 31; d++) {
    rows += `<tr><th>${d}</th>`;
    for (let m = 0; m < 12; m++) {
      if (d > daysInMonth(y, m)) { rows += `<td class="na"></td>`; continue; }
      const jdn = julianDayNumber(y, m + 1, d);
      const s = String(jdn);
      rows += `<td><span class="pre">${s.slice(0, 3)}</span>${s.slice(3)}</td>`;
    }
    rows += `</tr>`;
  }
  const jan1 = julianDayNumber(y, 1, 1);
  const css = `
  .p4{padding:34px 36px 0;background:#fff;color:#0b1f3a}
  .p4 h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:#0b1f3a}
  .p4 .sub{margin:4px 0 12px;font-size:11px;color:#37474f}
  .p4 .sub b{color:#0b1f3a;background:#fff1b8;padding:0 4px;border-radius:3px}
  .p4 table{width:100%;border-collapse:collapse;table-layout:fixed;font-variant-numeric:tabular-nums}
  .p4 th,.p4 td{border:1px solid #c9d3e3;text-align:center;font-size:10.4px;height:19px}
  .p4 thead th{background:#0b1f3a;color:#fccc00;font-family:Sora;font-weight:700;font-size:10.5px;height:22px}
  .p4 tbody th{background:#eef2f8;color:#0b1f3a;width:28px;font-weight:700}
  .p4 td{color:#0b1f3a;font-weight:700}
  .p4 tbody tr:nth-child(even) td{background:#f7f9fc}
  .p4 td .pre{color:#8a9bb3;font-weight:500}
  .p4 td.na{background:repeating-linear-gradient(45deg,#eef2f8 0 4px,#fff 4px 8px)!important}
  .p4 .box{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:10px;font-size:10px;color:#37474f}
  .p4 .box div{border:1px solid #c9d3e3;border-radius:8px;padding:7px 10px;border-left:4px solid #fccc00}
  .p4 .box b{color:#0b1f3a}
  .p4 .foot{color:#5a6b75}`;
  const page = `<section class="page p4">
    <h1>${y} Astronomical Julian Day Chart</h1>
    <p class="sub">Julian Day Number (JDN) for each date, valid at <b>12:00 UT</b>. For 00:00 UT use JDN − 0.5 · Modified Julian Date: MJD (00:00 UT) = JDN − 2,400,001</p>
    <table><thead><tr><th></th>${MON3.map((m) => `<th>${m}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
    <div class="box">
      <div><b>Jan. 1, ${y}</b> · JD ${jan1}.0 at 12:00 UT · JD ${jan1 - 1}.5 at 00:00 UT · MJD ${jan1 - 2400001}</div>
      <div><b>Day of week</b> · (JDN + 1) mod 7: 0 = Sunday … 6 = Saturday</div>
      <div><b>Epoch</b> · JD 0 = noon UT, Jan. 1, 4713 BC (proleptic Julian calendar)</div>
    </div>
    <div class="foot">Fresh Calendars · astronomical Julian Day ${y} · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER_LANDSCAPE, css, [page]);
}

export const JULIAN_TEMPLATES = [
  { slug: "day-of-year-chart", size: LETTER, build: dayOfYearChart },
  { slug: "monthly-julian-calendar", size: LETTER, build: monthlyJulian },
  { slug: "date-code-lookup", size: LETTER, build: dateCodeLookup },
  { slug: "astronomical-julian-day-chart", size: LETTER_LANDSCAPE, build: astronomicalJd },
] as const;

export async function buildJulianDownloads(years: number[]): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const y of years) {
      for (const t of JULIAN_TEMPLATES) {
        const html = t.build(y, fonts);
        const dir = path.join(OUT_PUBLIC, String(y));
        await fs.mkdir(dir, { recursive: true });
        await fs.mkdir(OUT_ASSETS, { recursive: true });
        const page = await browser.newPage({ viewport: t.size, deviceScaleFactor: 2 });
        await page.setContent(html, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const pdf = path.join(dir, `${t.slug}-${y}.pdf`);
        const png = path.join(dir, `${t.slug}-${y}.png`);
        await page.pdf({ path: pdf, width: `${t.size.width}px`, height: `${t.size.height}px`, printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
        await page.screenshot({ path: png, type: "png", clip: { x: 0, y: 0, ...t.size } });
        await fs.copyFile(png, path.join(OUT_ASSETS, `${t.slug}-${y}.png`));
        await page.close();
        const kb = (f: string) => fs.stat(f).then((s) => Math.round(s.size / 1024));
        console.log(`${y} ${t.slug}: pdf ${await kb(pdf)} KB, png ${await kb(png)} KB`);
      }
    }
  } finally {
    await browser.close();
  }
}
