/**
 * Contact sheet of the printables changed recently, so an editor checks them by eye in one look
 * (the print checks measure layout, not whether a sheet reads well):
 *   pnpm fc news-printables [--since 2026-11-03] [out.png]   (default: last 24 hours, .cache/printables-<date>.png)
 * Takes the preview PNG of every printable PDF a commit touched since the date (page 1, as readers
 * see it in the story), labels it with its file name and lays them out four across.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ROOT } from "./paths.js";

const TILE_W = 400, LABEL_H = 34, COLS = 4;

export async function buildPrintSheet(since?: string, out?: string): Promise<void> {
  const from = since ?? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const log = execFileSync("git", ["log", `--since=${from}T00:00:00`, "--name-only", "--format=", "--", "apps/news/public/downloads"], { cwd: ROOT, encoding: "utf8" });
  const pngs = [...new Set(log.split("\n").filter((f) => f.endsWith(".png")))];
  const files = (await Promise.all(pngs.map(async (f) => (await fs.access(path.join(ROOT, f)).then(() => f, () => null))))).filter((f): f is string => !!f).sort();
  if (!files.length) { console.log(`printables: none changed since ${from}`); return; }
  const tiles = await Promise.all(files.map(async (f) => {
    const name = path.basename(f, ".png").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const label = Buffer.from(`<svg width="${TILE_W}" height="${LABEL_H}"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="8" y="22" font-family="Helvetica, Arial" font-size="13" fill="#0f172a">${name.length > 52 ? `${name.slice(0, 50)}…` : name}</text></svg>`);
    const { data: pic, info } = await sharp(path.join(ROOT, f)).resize({ width: TILE_W }).png().toBuffer({ resolveWithObject: true });
    return { pic, label, height: info.height };
  }));
  const rowH = Math.max(...tiles.map((t) => t.height)) + LABEL_H + 12;
  const rows = Math.ceil(tiles.length / COLS);
  const target = out ?? path.join(ROOT, `.cache/printables-${from}.png`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await sharp({ create: { width: COLS * (TILE_W + 12) + 12, height: rows * rowH + 12, channels: 3, background: "#ffffff" } })
    .composite(tiles.flatMap((t, i) => {
      const left = 12 + (i % COLS) * (TILE_W + 12), top = 12 + Math.floor(i / COLS) * rowH;
      return [{ input: t.label, left, top }, { input: t.pic, left, top: top + LABEL_H }];
    }))
    .png().toFile(target);
  console.log(`printables: ${files.length} changed since ${from} → ${path.relative(ROOT, target)}`);
}
