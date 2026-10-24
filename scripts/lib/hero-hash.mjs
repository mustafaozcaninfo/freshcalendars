/**
 * Perceptual fingerprint of a story hero, used to keep every hero unique (audit 12-HERO-UNIQUE and
 * `pnpm fc news-assets`). Only the picture side counts: the left 40% holds our kicker, date tile and
 * card, which look alike on purpose. The art side is reduced to a 17×16 grayscale grid and each cell
 * is compared with its right neighbor (difference hash, 256 bits), so recolors and small shifts of
 * the same scene still match while a different subject or photo does not.
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sharp = createRequire(path.join(ROOT, "packages/generator/package.json"))("sharp");

/** Heroes closer than this many bits (of 256) are the same picture. */
export const SAME_PICTURE = 40;
/** Stories published from this date on must have a unique hero; older pairs are only reported. */
export const UNIQUE_SINCE = "2026-10-24";

const cache = new Map();
export function heroHash(file) {
  if (!cache.has(file)) cache.set(file, hashFile(file));
  return cache.get(file);
}

async function hashFile(file) {
  const img = sharp(file);
  const { width = 0, height = 0 } = await img.metadata();
  const left = Math.round(width * 0.4);
  const px = await img.extract({ left, top: 0, width: width - left, height }).greyscale().resize(17, 16, { fit: "fill" }).raw().toBuffer();
  let bits = "";
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) bits += px[y * 17 + x] > px[y * 17 + x + 1] ? "1" : "0";
  return bits;
}

export const distance = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; return d; };

/**
 * What `news-assets` drew, kept next to the hero as <slug>.hero.json: { kind: "scene" | "poster" | "photo",
 * scene, render }. Two stories never share an illustrated scene: the seed only moves small details, so the
 * same scene is the same picture to a reader. Older heroes have no record; the pixel check covers them.
 */
export function heroRecord(heroFile) {
  const dir = path.dirname(heroFile), slug = path.basename(dir);
  const file = path.join(dir, `${slug}.hero.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

/** Every story's hero file and publish date, read from the Markdown frontmatter. */
export function storyHeroes(articlesDir = path.join(ROOT, "apps/news/src/content/articles")) {
  const out = [];
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!f.endsWith(".md")) continue;
      const fm = readFileSync(p, "utf8").split(/^---$/m)[1] ?? "";
      const src = fm.match(/^hero:\s*\n\s+src:\s*"?([^"\n]+)"?/m)?.[1];
      if (!src || /^\s*draft:\s*true/m.test(fm)) continue;
      const file = path.resolve(path.dirname(p), src.trim());
      if (!existsSync(file)) continue;
      out.push({ slug: f.replace(/\.md$/, ""), file, published: fm.match(/^publishedAt:\s*"?([^"\n]+)/m)?.[1]?.slice(0, 10) ?? "", record: heroRecord(file) });
    }
  })(articlesDir);
  return out;
}

/** Pairs of stories whose heroes are the same picture, closest first. */
export async function duplicateHeroes(stories = storyHeroes()) {
  const hashed = await Promise.all(stories.map(async (s) => ({ ...s, hash: await heroHash(s.file) })));
  const pairs = [];
  for (let i = 0; i < hashed.length; i++) for (let j = i + 1; j < hashed.length; j++) {
    const d = distance(hashed[i].hash, hashed[j].hash);
    if (d < SAME_PICTURE) pairs.push({ a: hashed[i], b: hashed[j], d });
  }
  return pairs.sort((x, y) => x.d - y.d);
}

/**
 * Why one story's hero is not unique: the same illustrated scene as another story, or the same picture
 * (pixel fingerprint) as any other hero. Empty when it is unique.
 */
export async function heroProblems(slug, stories = storyHeroes()) {
  const me = stories.find((s) => s.slug === slug);
  if (!me) return [];
  const others = stories.filter((s) => s.slug !== slug);
  const problems = [];
  if (me.record?.kind === "scene") {
    const same = others.filter((s) => s.record?.kind === "scene" && s.record.scene === me.record.scene).map((s) => s.slug);
    if (same.length) problems.push(`illustrated scene "${me.record.scene}" is already the hero of ${same.join(", ")}`);
  }
  const mine = await heroHash(me.file);
  for (const s of others) {
    const d = distance(mine, await heroHash(s.file));
    if (d < SAME_PICTURE) problems.push(`same picture as ${s.slug} (${d}/256 bits apart, limit ${SAME_PICTURE})`);
  }
  return problems;
}
