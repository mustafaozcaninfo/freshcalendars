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
 *   render: 2d                              # optional: SVG scene instead of the 3D one (render3d/)
 *   overlay: true                           # licensed-photo stories: kicker, date tile and card over the photo
 * A story with a licensed photo (news-photo, <slug>.photo.json) keeps it; with `overlay: true` the
 * hero is redrawn from the untouched <slug>.source.webp with our scrim, text and finish, and the
 * credit gains ", edited" (CC BY asks us to say the image was changed).
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
import { SCENES_3D, backdrop3d, shootHero, type HeroDoc } from "./news3d.js";
import { UNIQUE_SINCE, heroProblems, storyHeroes } from "../../../scripts/lib/hero-hash.mjs";

const W = 1200, H = 675;
const ARTICLES = path.join(ROOT, "apps/news/src/content/articles");
const CATEGORY_COLOR: Record<string, string> = {
  holidays: "#b45309", planning: "#1e3a8a", "retail-dates": "#be123c", "school-calendars": "#0f766e",
  "sky-events": "#1e1b4b", "time-change": "#6d28d9", "uk-canada": "#9f1239", puzzles: "#4c1d95",
  elections: "#7f1d1d", "calendar-guides": "#155e75", sports: "#1d4f7a",
};
const DOW = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

type Assets = { scene?: SceneName | "none"; render?: "2d" | "3d"; overlay?: boolean; kicker?: string; title?: string; date?: string; color?: string; card?: { top?: string; big: string; bottom?: string }; printable?: Printable };
type Front = { title: string; seoTitle?: string; category: string; publishedAt?: string; assets?: Assets };

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
 * Text layer shared by every illustrated hero: kicker and optional short title at the left (on the
 * art's scrim), a date tile and card at the bottom left, the brand line at the bottom right.
 */
function heroUi(fonts: string, a: Assets, color: string): { css: string; ui: string } {
  const title = a.title ?? "";
  if (title.length > 40) console.warn(`assets.title is ${title.length} chars; keep it under 40 so the hero is not text-heavy (Google Discover)`);
  let tile = "";
  if (a.date) {
    const d = new Date(`${a.date}T12:00:00Z`);
    tile = `<div class="tile"><i style="background:${color}">${MONTHS[d.getUTCMonth()]!.slice(0, 3).toUpperCase()}</i><b style="color:${tint(color, -0.4)}">${d.getUTCDate()}</b><em style="color:${color}">${DOW[d.getUTCDay()]!.slice(0, 3)}</em></div>`;
  }
  const card = a.card ? `<div class="card"><span>${esc(a.card.top ?? "")}</span><b>${esc(a.card.big)}</b><span>${esc(a.card.bottom ?? "")}</span></div>` : "";
  const css = `${fonts}body{font-family:Manrope,sans-serif;background:${color}}
  .k{position:absolute;left:64px;top:76px;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:#fde68a;text-shadow:0 2px 10px rgba(0,0,0,.45)}
  .t{position:absolute;left:64px;top:110px;width:500px;font-family:Sora;font-weight:800;color:#fff;line-height:1.04;font-size:${title.length > 26 ? 52 : 60}px;letter-spacing:-.01em;text-shadow:0 4px 24px rgba(0,0,0,.45)}
  .row{position:absolute;left:64px;bottom:84px;display:flex;gap:16px;align-items:stretch}
  .tile{width:118px;border-radius:16px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.32);overflow:hidden;text-align:center;font-family:Sora;transform:rotate(-3deg)}
  .tile i{display:block;font-style:normal;color:#fff;font-weight:800;font-size:17px;letter-spacing:.12em;padding:7px 0}
  .tile b{display:block;font-size:60px;line-height:1;margin-top:8px}.tile em{display:block;font-style:normal;font-weight:800;font-size:14px;letter-spacing:.14em;padding:4px 0 10px}
  .card{width:${tile ? 360 : 440}px;border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 18px 40px rgba(0,0,0,.3);padding:18px 22px;color:#0f172a;display:flex;flex-direction:column;justify-content:center}
  .card b{display:block;font-family:Sora;font-size:34px;line-height:1.05;margin:3px 0}.card span{font-size:15px;color:#475569;font-weight:700}
  .brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.82);text-shadow:0 1px 6px rgba(0,0,0,.4)}`;
  const ui = `${a.kicker ? `<div class="k">${esc(a.kicker)}</div>` : ""}${title ? `<div class="t">${esc(title)}</div>` : ""}
  ${tile || card ? `<div class="row">${tile}${card}</div>` : ""}<div class="brand">freshcalendars.com/news</div>`;
  return { css, ui };
}

/**
 * Illustrated hero. Scenes listed in SCENES_3D are rendered in 3D (render3d/); the rest, or any
 * story with `assets.render: 2d`, use the SVG scenes in art.ts. Text sits on a scrim at the left.
 */
function sceneDoc(fonts: string, f: Front, a: Assets, slug: string, name: SceneName): HeroDoc {
  const color = storyColor(f, a, name);
  const { css, ui } = heroUi(fonts, a, color);
  const three = a.render !== "2d" ? SCENES_3D[name] : undefined;
  if (three) {
    return { css, ui, art: backdrop3d(color, three.accent, slug, three.night), three: { scene: name, color, accent: three.accent, seed: slug, date: a.date } };
  }
  return { css, ui, art: `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0">${scene(name, { color, seed: slug })}</svg>` };
}

/** Licensed photo with our layer: the photo, a scrim for the text, then kicker, tile, card and brand. */
async function photoDoc(fonts: string, f: Front, a: Assets, src: string): Promise<HeroDoc> {
  const color = storyColor(f, a, "none");
  const { css, ui } = heroUi(fonts, a, color);
  const data = (await fs.readFile(src)).toString("base64");
  return {
    css, ui,
    art: `<img src="data:image/webp;base64,${data}" style="position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover">
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.62) 0%,rgba(0,0,0,.3) 40%,rgba(0,0,0,0) 66%),linear-gradient(0deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,0) 38%)"></div>`,
  };
}

/** Finish per hero kind: 3D gets a stronger bloom (lit pumpkins, light strips), SVG art a light one. */
const fxFor = (doc: HeroDoc, slug: string) => (doc.three ? { seed: slug, bloom: 0.5, threshold: 215 } : { seed: slug, bloom: 0.18, threshold: 200, vignette: 0.18 });

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
  const recordFile = path.join(dir, `${slug}.photo.json`);
  const photo = await fs.access(recordFile).then(() => true, () => false);
  if (photo && a.overlay) {
    const src = path.join(dir, `${slug}.source.webp`);
    if (!(await fs.access(src).then(() => true, () => false))) throw new Error(`${slug}.source.webp is missing; run pnpm fc news-photo use again so the untouched crop is kept`);
    const rec = JSON.parse(await fs.readFile(recordFile, "utf8"));
    const browser = await chromium.launch({ headless: true });
    try {
      const png = await shootHero(browser, await photoDoc(fonts, f, a, src), { seed: slug, bloom: 0.08, threshold: 235, vignette: 0.2, grain: 4, saturation: 1.04 });
      // Never upscale a photo: the branded hero keeps the source width.
      const { width = 0 } = await sharp(src).metadata();
      const credit = /, edited$/.test(rec.credit) ? rec.credit : `${rec.credit}, edited`;
      const rights = `${rec.author}, ${rec.license}${rec.licenseUrl ? ` (${rec.licenseUrl})` : ""}; edited by Fresh Calendars`;
      await sharp(png).resize(Math.min(width, W * 2)).withExif({ IFD0: { Artist: rec.author, Copyright: rights, ImageDescription: rec.title } })
        .webp({ quality: 84, effort: 6 }).toFile(path.join(dir, `${slug}.webp`));
      await fs.writeFile(recordFile, `${JSON.stringify({ ...rec, credit, overlay: true }, null, 2)}\n`);
      console.log(`hero: ${slug}.webp redrawn from ${slug}.source.webp with the overlay\nset hero.credit in the frontmatter to: ${JSON.stringify(credit)}`);
    } finally {
      await browser.close();
    }
  } else if (photo) console.log(`hero: licensed photo ${slug}.webp kept (assets.overlay: true adds our layer; delete ${slug}.photo.json to draw a scene instead)`);
  const browser = photo ? null : await chromium.launch({ headless: true });
  if (browser) try {
    let png: Buffer;
    if (name === "none") {
      const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
      await page.setContent(hero(fonts, f, a), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      png = await page.screenshot({ type: "png" });
    } else {
      const doc = sceneDoc(fonts, f, a, slug, name);
      png = await shootHero(browser, doc, fxFor(doc, slug));
    }
    await fs.mkdir(dir, { recursive: true });
    await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${slug}.jpg`));
    console.log(`hero: apps/news/src/assets/news/${slug}/${slug}.jpg`);
  } finally {
    await browser.close();
  }
  // Record what was drawn, then refuse a hero that repeats another story's scene or picture.
  const kind = photo ? "photo" : name === "none" ? "poster" : "scene";
  const render = kind === "scene" ? (a.render !== "2d" && SCENES_3D[name] ? "3d" : "2d") : undefined;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${slug}.hero.json`), `${JSON.stringify({ kind, ...(kind === "scene" ? { scene: name, render } : {}) }, null, 2)}\n`);
  const problems = await heroProblems(slug, storyHeroes());
  if (problems.length) {
    const msg = `hero is not unique:\n  - ${problems.join("\n  - ")}\nUse a licensed photo with the overlay (pnpm fc news-photo, assets.overlay: true) or a scene no story has used; see .claude/skills/news-visuals/SKILL.md`;
    if (String(f.publishedAt ?? "").slice(0, 10) >= UNIQUE_SINCE) throw new Error(msg);
    console.warn(`${msg}\n(older story, published before ${UNIQUE_SINCE}: warning only)`);
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
 *   pnpm fc news-scenes [out.png] [--only calendar,election]   (default .cache/news-scenes.png)
 */
export async function buildSceneGallery(out = path.join(ROOT, ".cache/news-scenes.png"), only?: string[]): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    const shots: Buffer[] = [];
    const names = only?.length ? SCENES.filter((n) => only.includes(n)) : SCENES;
    for (const name of names) {
      const f: Front = { title: name, category: "planning" };
      const a: Assets = { scene: name, kicker: `Scene · ${name}${SCENES_3D[name] ? " · 3D" : ""}`, date: "2026-11-26", card: { top: "Example card", big: "Thu., Nov. 26", bottom: name } };
      const doc = sceneDoc(fonts, f, a, "gallery", name);
      shots.push(await sharp(await shootHero(browser, doc, fxFor(doc, "gallery"))).resize(600, 338).png().toBuffer());
    }
    const cols = Math.min(3, shots.length), rows = Math.ceil(shots.length / cols);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await sharp({ create: { width: cols * 600, height: rows * 338, channels: 3, background: "#ffffff" } })
      .composite(shots.map((input, i) => ({ input, left: (i % cols) * 600, top: Math.floor(i / cols) * 338 })))
      .png().toFile(out);
    console.log(`scenes: ${path.relative(ROOT, out)} (${names.join(", ")})`);
  } finally {
    await browser.close();
  }
}
