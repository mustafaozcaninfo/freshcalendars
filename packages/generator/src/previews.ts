import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { cdnUrl } from "@freshcalendars/engine";
import { DIST_ASSETS } from "./paths.js";

const PREVIEW_SIZES = [
  { suffix: "preview", width: 540, quality: 70 },
  { suffix: "preview-2x", width: 1080, quality: 68 },
] as const;

async function writePreview(
  full: string,
  out: string,
  width: number,
  quality: number,
): Promise<boolean> {
  try {
    const [srcStat, outStat] = await Promise.all([
      fs.stat(full),
      fs.stat(out).catch(() => null),
    ]);
    if (outStat && outStat.mtimeMs >= srcStat.mtimeMs) return false;
  } catch {
    /* generate */
  }
  await sharp(full)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toFile(out);
  return true;
}

/** Create WebP display previews next to each calendar.png under dist/assets. */
export async function generateAssetPreviews(): Promise<number> {
  let count = 0;
  async function walk(dir: string): Promise<void> {
    let entries: Awaited<ReturnType<typeof fs.readdir>>;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
        continue;
      }
      if (ent.name !== "calendar.png") continue;
      for (const size of PREVIEW_SIZES) {
        const out = path.join(dir, `calendar-${size.suffix}.webp`);
        if (await writePreview(full, out, size.width, size.quality)) count++;
      }
    }
  }
  await walk(DIST_ASSETS);
  return count;
}

/** Keep LCP previews on CDN (same host as PNG/PDF downloads). */
function toCdnPreview(url: string): string {
  const rel = url.replace(/^https?:\/\/[^/]+/, "");
  return cdnUrl(rel.startsWith("/") ? rel : `/${rel}`);
}

export function displayPreviewUrl(pngUrl: string): string {
  return toCdnPreview(pngUrl.replace(/\/calendar\.png(\?.*)?$/, "/calendar-preview.webp$1"));
}

export function displayPreview2xUrl(pngUrl: string): string {
  return toCdnPreview(pngUrl.replace(/\/calendar\.png(\?.*)?$/, "/calendar-preview-2x.webp$1"));
}
