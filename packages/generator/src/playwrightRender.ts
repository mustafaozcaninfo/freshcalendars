import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser } from "playwright";
import type { PrintSize } from "./catalog.js";
import { PORTRAIT } from "./catalog.js";

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const b = await browserPromise;
    await b.close();
    browserPromise = null;
  }
}

async function renderHtmlToPng(
  html: string,
  outPath: string,
  size: { width: number; height: number },
): Promise<void> {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width: size.width, height: size.height, deviceScaleFactor: 1 },
  });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: outPath, type: "png", fullPage: false });
  await page.close();
}

export async function renderPrintable(
  html: string,
  pngPath: string,
  pdfPath: string,
  size: PrintSize = PORTRAIT,
): Promise<void> {
  await fs.mkdir(path.dirname(pngPath), { recursive: true });
  await fs.mkdir(path.dirname(pdfPath), { recursive: true });
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width: size.width, height: size.height, deviceScaleFactor: 1 },
  });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: pngPath, type: "png", fullPage: false });
  await page.pdf({
    path: pdfPath,
    width: `${size.width}px`,
    height: `${size.height}px`,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
  await page.close();
}

export async function renderOg(html: string, outPath: string): Promise<void> {
  await renderHtmlToPng(html, outPath, { width: 1200, height: 630 });
}
