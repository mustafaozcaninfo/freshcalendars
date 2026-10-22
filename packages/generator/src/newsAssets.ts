/**
 * One command for a /news/ story's images, so a story needs no generator code of its own:
 *   pnpm fc news-assets <slug>
 * reads the story's frontmatter `assets:` block and draws
 * - the hero, 2400×1350 JPEG at apps/news/src/assets/news/<slug>/<slug>.jpg, and
 * - optionally a one-page date-list printable (PDF + PNG + preview) through renderPrintables,
 * then prints the `downloads:` entry to paste into the frontmatter. Astro ignores `assets:`.
 *
 * assets:
 *   scene: thanksgiving                     # illustration from art.ts (pnpm fc news-scenes); none = flat poster
 *   kicker: "Texas · Nov. 3, 2026"          # small line above the title
 *   title: "Who is on the Texas ballot"     # optional short hero line (<=40 chars); Discover shows
 *                                           # the real headline beside the image and avoids text-heavy images
 *   date: "2026-11-03"                      # calendar card on the hero (optional)
 *   color: "#9a3412"                        # defaults to the category color
 *   card: { top: "Early voting through", big: "Fri., Oct. 30", bottom: "No straight ticket" }
 *   printable:                              # optional
 *     slug: texas-key-dates-2026            # file name (kebab-case, with the year)
 *     group: election-2026                  # folder under public/downloads
 *     title: "Texas Key Dates, Nov. 3, 2026"
 *     subtitle: "Every deadline from the Texas Secretary of State"
 *     columns: ["Date", "What happens"]     # optional
 *     rows: [["Mon., Oct. 19-Fri., Oct. 30", "Early voting"], ["Tue., Nov. 3", "Election Day"]]
 *     note: "Source: Texas Secretary of State, ..."   # sources, required
 *     description: "..."                    # 20-200 chars, for the downloads entry
 *     alt: "..."                            # 10-160 chars, for the downloads entry
 *     layout: auto                          # month | timeline | checklist | list (see newsPrintable.ts)
 *     inkSaver: true                        # also <slug>-ink, black on white
 * A story with a licensed photo (news-photo, <slug>.photo.json) keeps it; only the printable is drawn.
 * Original art only: shapes, a calendar card and a little text, no logos. Keep the main shapes inside the
 * middle 900 px so 4:3 and 1:1 crops (Discover, schema images) still read.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { parse } from "yaml";
import { LETTER, fontFaces } from "./julian.js";
import { MONTHS, renderPrintables } from "./printables.js";
import { ROOT } from "./paths.js";
import { type Printable, printableHtml } from "./newsPrintable.js";
import { CATEGORY_SCENE, SCENE_ICON, SCENE_COLOR, SCENES, type SceneName, scene, tint } from "./art.js";

const W = 1200, H = 675;
const ARTICLES = path.join(ROOT, "apps/news/src/content/articles");
const CATEGORY_COLOR: Record<string, string> = {
  holidays: "#b45309", planning: "#1e3a8a", "retail-dates": "#be123c", "school-calendars": "#0f766e",
  "sky-events": "#1e1b4b", "time-change": "#6d28d9", "uk-canada": "#9f1239", puzzles: "#4c1d95",
};
const DOW = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

type Assets = { scene?: SceneName | "none"; kicker?: string; title?: string; date?: string; color?: string; card?: { top?: string; big: string; bottom?: string }; printable?: Printable };
type Front = { title: string; seoTitle?: string; category: string; assets?: Assets };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** #rrggbb darkened by a factor, for the gradient's second stop. */
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16), c = (s: number) => Math.round(((n >> s) & 255) * f);
  return `#${[c(16), c(8), c(0)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

async function findStory(slug: string): Promise<string> {
  const walk = async (dir: string): Promise<string[]> => (await Promise.all((await fs.readdir(dir, { withFileTypes: true })).map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])))).flat();
  const hit = (await walk(ARTICLES)).find((f) => path.basename(f, ".md") === slug);
  if (!hit) throw new Error(`no story apps/news/src/content/articles/**/${slug}.md`);
  return hit;
}

function hero(fonts: string, f: Front, a: Assets): string {
  const color = a.color ?? CATEGORY_COLOR[f.category] ?? "#1e3a8a";
  const title = a.title ?? "";
  if (title.length > 40) console.warn(`assets.title is ${title.length} chars; keep it under 40 so the hero is not text-heavy (Google Discover)`);
  const size = title.length > 30 ? 56 : 64;
  const dots = Array.from({ length: 48 }, (_, i) => `<circle cx="${700 + (i % 8) * 62}" cy="${70 + Math.floor(i / 8) * 62}" r="4" fill="#fff" opacity="${0.08 + ((i * 7) % 5) * 0.03}"/>`).join("");
  /** No headline: a centered layout (kicker and card left, calendar right) inside the middle 900 px for crops. */
  const center = !title;
  const rings = [0, 1, 2].map((i) => `<circle cx="${center ? 820 : 980}" cy="${center ? 330 : 470}" r="${150 + i * 70}" fill="none" stroke="#fff" stroke-opacity="${0.12 - i * 0.03}" stroke-width="2"/>`).join("");
  let cal = "";
  if (a.date) {
    const d = new Date(`${a.date}T12:00:00Z`);
    cal = `<g transform="${center ? "translate(690,170) scale(1.15)" : "translate(860,170)"} rotate(4)" filter="url(#sh)"><rect width="240" height="250" rx="18" fill="#fff"/><rect width="240" height="62" rx="18" fill="${color}"/><rect y="44" width="240" height="18" fill="${color}"/>
      <text x="120" y="43" font-family="Sora" font-size="24" font-weight="800" fill="#fff" text-anchor="middle">${MONTHS[d.getUTCMonth()]!.toUpperCase()}</text>
      <text x="120" y="182" font-family="Sora" font-size="118" font-weight="800" fill="${shade(color, 0.45)}" text-anchor="middle">${d.getUTCDate()}</text>
      <text x="120" y="228" font-family="Sora" font-size="22" font-weight="800" fill="${color}" text-anchor="middle">${DOW[d.getUTCDay()]}</text></g>`;
  }
  const card = a.card ? `<div class="card"><span>${esc(a.card.top ?? "")}</span><b>${esc(a.card.big)}</b><span>${esc(a.card.bottom ?? "")}</span></div>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}html,body{margin:0}
  body{width:${W}px;height:${H}px;overflow:hidden;background:${color};font-family:Manrope,sans-serif;position:relative}
  .k{position:absolute;left:64px;top:84px;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:#fde68a}
  .t{position:absolute;left:64px;top:118px;width:${a.date ? 640 : 900}px;font-family:Sora;font-weight:800;color:#fff;line-height:1.04;font-size:${size}px;letter-spacing:-.01em}
  .card{position:absolute;left:64px;bottom:96px;width:470px;border-radius:18px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.28);padding:18px 22px;color:#0f172a}
  .card b{display:block;font-family:Sora;font-size:30px;line-height:1.05;margin:2px 0}.card span{font-size:15px;color:#475569;font-weight:700}
  ${center ? `.k{left:170px;top:${a.card ? 228 : 318}px}.card{left:170px;bottom:auto;top:264px;width:440px;padding:22px 26px}.card b{font-size:44px}.card span{font-size:17px}` : ""}
  .brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.78)}</style></head><body>
  <svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, 0.55)}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>${dots}${rings}${cal}</svg>
  ${a.kicker ? `<div class="k">${esc(a.kicker)}</div>` : ""}${title ? `<div class="t">${esc(title)}</div>` : ""}${card}
  <div class="brand">freshcalendars.com/news</div></body></html>`;
}

/** assets.color, else the chosen scene's palette, else the category color (so default heroes keep their colors). */
function storyColor(f: Front, a: Assets, name: SceneName | "none"): string {
  if (a.color) return a.color;
  if (a.scene && name !== "none") return SCENE_COLOR[name];
  return CATEGORY_COLOR[f.category] ?? (name !== "none" ? SCENE_COLOR[name] : "#1e3a8a");
}

/**
 * Illustrated hero: an original scene from art.ts fills the right side, text sits on a scrim at the
 * left. The date becomes a small tear-off tile beside the card so it never covers the scene.
 */
function sceneHero(fonts: string, f: Front, a: Assets, slug: string, name: SceneName): string {
  const color = storyColor(f, a, name);
  const title = a.title ?? "";
  if (title.length > 40) console.warn(`assets.title is ${title.length} chars; keep it under 40 so the hero is not text-heavy (Google Discover)`);
  let tile = "";
  if (a.date) {
    const d = new Date(`${a.date}T12:00:00Z`);
    tile = `<div class="tile"><i style="background:${color}">${MONTHS[d.getUTCMonth()]!.slice(0, 3).toUpperCase()}</i><b style="color:${tint(color, -0.4)}">${d.getUTCDate()}</b><em style="color:${color}">${DOW[d.getUTCDay()]!.slice(0, 3)}</em></div>`;
  }
  const card = a.card ? `<div class="card"><span>${esc(a.card.top ?? "")}</span><b>${esc(a.card.big)}</b><span>${esc(a.card.bottom ?? "")}</span></div>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}html,body{margin:0}
  body{width:${W}px;height:${H}px;overflow:hidden;font-family:Manrope,sans-serif;position:relative;background:${color}}
  .k{position:absolute;left:64px;top:76px;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:#fde68a;text-shadow:0 2px 10px rgba(0,0,0,.35)}
  .t{position:absolute;left:64px;top:110px;width:500px;font-family:Sora;font-weight:800;color:#fff;line-height:1.04;font-size:${title.length > 26 ? 52 : 60}px;letter-spacing:-.01em;text-shadow:0 4px 24px rgba(0,0,0,.35)}
  .row{position:absolute;left:64px;bottom:84px;display:flex;gap:16px;align-items:stretch}
  .tile{width:118px;border-radius:16px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.32);overflow:hidden;text-align:center;font-family:Sora;transform:rotate(-3deg)}
  .tile i{display:block;font-style:normal;color:#fff;font-weight:800;font-size:17px;letter-spacing:.12em;padding:7px 0}
  .tile b{display:block;font-size:60px;line-height:1;margin-top:8px}.tile em{display:block;font-style:normal;font-weight:800;font-size:14px;letter-spacing:.14em;padding:4px 0 10px}
  .card{width:${tile ? 360 : 440}px;border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 18px 40px rgba(0,0,0,.3);padding:18px 22px;color:#0f172a;display:flex;flex-direction:column;justify-content:center}
  .card b{display:block;font-family:Sora;font-size:34px;line-height:1.05;margin:3px 0}.card span{font-size:15px;color:#475569;font-weight:700}
  .brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.8)}</style></head><body>
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0">${scene(name, { color, seed: slug })}</svg>
  ${a.kicker ? `<div class="k">${esc(a.kicker)}</div>` : ""}${title ? `<div class="t">${esc(title)}</div>` : ""}
  ${tile || card ? `<div class="row">${tile}${card}</div>` : ""}
  <div class="brand">freshcalendars.com/news</div></body></html>`;
}

export async function buildNewsAssets(slug: string): Promise<void> {
  if (!slug) throw new Error("usage: pnpm fc news-assets <slug>");
  const file = await findStory(slug);
  const raw = await fs.readFile(file, "utf8");
  const m = /^---\n([\s\S]*?)\n---/.exec(raw);
  if (!m) throw new Error(`${file}: no frontmatter`);
  const f = parse(m[1]!) as Front;
  const a = f.assets ?? {};
  if (!f.assets) console.log("no assets: block; drawing a hero from the title and category only");
  const fonts = await fontFaces();
  const dir = path.join(ROOT, "apps/news/src/assets/news", slug);
  const name = a.scene ?? CATEGORY_SCENE[f.category] ?? "calendar";
  if (name !== "none" && !SCENES.includes(name)) throw new Error(`assets.scene "${name}" is not one of: ${SCENES.join(", ")}, none`);
  // A licensed photo (news-photo) is the hero; only the printable is drawn then.
  const photo = await fs.access(path.join(dir, `${slug}.photo.json`)).then(() => true, () => false);
  if (photo) console.log(`hero: licensed photo ${slug}.webp kept (delete ${slug}.photo.json to draw a scene instead)`);
  const browser = photo ? null : await chromium.launch({ headless: true });
  if (browser) try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    await page.setContent(name === "none" ? hero(fonts, f, a) : sceneHero(fonts, f, a, slug, name), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png" });
    await fs.mkdir(dir, { recursive: true });
    await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${slug}.jpg`));
    console.log(`hero: apps/news/src/assets/news/${slug}/${slug}.jpg`);
  } finally {
    await browser.close();
  }
  const p = a.printable;
  if (!p) return;
  if (!/^[a-z0-9-]+$/.test(p.slug) || !/^[a-z0-9-]+$/.test(p.group)) throw new Error("printable slug and group must be lowercase kebab-case");
  if (!p.rows?.length || !p.note) throw new Error("printable needs rows and a sources note");
  const color = storyColor(f, a, name);
  const year = Number((a.date ?? "").slice(0, 4)) || new Date().getFullYear();
  const iconName = SCENE_ICON[name === "none" ? "calendar" : name];
  const main = printableHtml(fonts, slug, color, p, year, iconName);
  for (const w of main.warnings) console.warn(`printable: ${w}`);
  console.log(`printable layout: ${main.layout}${p.layout && p.layout !== "auto" ? "" : " (auto)"}`);
  const sheets = [{ slug: p.slug, size: LETTER, html: main.html }];
  if (p.inkSaver) sheets.push({ slug: `${p.slug}-ink`, size: LETTER, html: printableHtml(fonts, slug, color, { ...p, layout: main.layout as Printable["layout"] }, year, iconName, true).html });
  await renderPrintables(p.group, sheets);
  const q = (s: string) => JSON.stringify(s);
  const entry = (file: string, title: string, desc: string, alt: string) => `  - group: ${q(p.title.replace(/[,:].*$/, "") + " printables")}
    title: ${q(title)}
    description: ${q(desc)}
    preview: ../../../../assets/news/${p.group}/${file}.png
    alt: ${q(alt)}
    pdf: "/news/downloads/${p.group}/${file}.pdf"
    png: "/news/downloads/${p.group}/${file}.png"
    pages: 1`;
  const desc = p.description ?? p.subtitle ?? p.title, alt = p.alt ?? `${p.title} printable`;
  console.log(`\nPaste under downloads: in the frontmatter:\n${entry(p.slug, p.title, desc, alt)}${p.inkSaver ? `\n${entry(`${p.slug}-ink`, `${p.title.slice(0, 68)} (ink saver)`, `${desc.slice(0, 170)} Ink-saver version.`, `${alt.slice(0, 140)}, ink-saver version`)}` : ""}`);
}

/**
 * Contact sheet of every scene, so a writer can pick `assets.scene` by eye:
 *   pnpm fc news-scenes [out.png]   (default .cache/news-scenes.png)
 */
export async function buildSceneGallery(out = path.join(ROOT, ".cache/news-scenes.png")): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    const shots: Buffer[] = [];
    for (const name of SCENES) {
      const f: Front = { title: name, category: "planning" };
      const a: Assets = { scene: name, kicker: `Scene · ${name}`, date: "2026-11-26", card: { top: "Example card", big: "Thu., Nov. 26", bottom: name } };
      await page.setContent(sceneHero(fonts, f, a, "gallery", name), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      shots.push(await sharp(await page.screenshot({ type: "png" })).resize(600, 338).png().toBuffer());
    }
    const cols = 3, rows = Math.ceil(shots.length / cols);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await sharp({ create: { width: cols * 600, height: rows * 338, channels: 3, background: "#ffffff" } })
      .composite(shots.map((input, i) => ({ input, left: (i % cols) * 600, top: Math.floor(i / cols) * 338 })))
      .png().toFile(out);
    console.log(`scenes: ${path.relative(ROOT, out)} (${SCENES.join(", ")})`);
  } finally {
    await browser.close();
  }
}
