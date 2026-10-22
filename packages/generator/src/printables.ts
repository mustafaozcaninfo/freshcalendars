/**
 * Shared PDF + PNG renderer for /news/ printables (week numbers, moon phases, Lunar New Year).
 * Each template is a self-contained HTML document; the PNG is page 1 at 2x for the preview.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { ROOT } from "./paths.js";

export type Size = { width: number; height: number };
export type Printable = { slug: string; size: Size; html: string };

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MON3 = MONTHS.map((m) => m.slice(0, 3));
export const DOW3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DOWFULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY = 86_400_000;
export const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
export const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/** Renders every template to <public>/<slug>.pdf|png and copies the PNG to <assets>/<slug>.png. */
export async function renderPrintables(dir: string, list: Printable[]): Promise<void> {
  const outPublic = path.join(ROOT, "apps/news/public/downloads", dir);
  const outAssets = path.join(ROOT, "apps/news/src/assets/news", dir);
  await fs.mkdir(outPublic, { recursive: true });
  await fs.mkdir(outAssets, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const t of list) {
      const page = await browser.newPage({ viewport: t.size, deviceScaleFactor: 2 });
      await page.setContent(t.html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // Templates that ship a fit script (newsPrintable.ts) scale themselves to one page here.
      const fit = await page.evaluate(() => (window as unknown as { __fit?: () => number }).__fit?.() ?? null);
      if (await page.evaluate(() => document.body.dataset.overflow === "1")) throw new Error(`${t.slug}: content does not fit on the page even at 80%; cut or split the rows`);
      if (fit !== null && fit !== 1) console.log(`${t.slug}: scaled to ${Math.round(fit * 100)}% to fit`);
      const pdf = path.join(outPublic, `${t.slug}.pdf`), png = path.join(outPublic, `${t.slug}.png`);
      await page.pdf({ path: pdf, width: `${t.size.width}px`, height: `${t.size.height}px`, printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
      await page.screenshot({ path: png, type: "png", clip: { x: 0, y: 0, ...t.size } });
      await fs.copyFile(png, path.join(outAssets, `${t.slug}.png`));
      const pages = await page.evaluate(() => document.querySelectorAll(".page").length);
      await page.close();
      const kb = (f: string) => fs.stat(f).then((s) => Math.round(s.size / 1024));
      console.log(`${t.slug}: ${pages} page(s), pdf ${await kb(pdf)} KB, png ${await kb(png)} KB`);
    }
  } finally {
    await browser.close();
  }
}
