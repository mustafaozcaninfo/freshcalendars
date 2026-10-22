/**
 * One command for a /news/ story's images, so a story needs no generator code of its own:
 *   pnpm fc news-assets <slug>
 * reads the story's frontmatter `assets:` block and draws
 * - the hero, 2400×1350 JPEG at apps/news/src/assets/news/<slug>/<slug>.jpg, and
 * - optionally a one-page date-list printable (PDF + PNG + preview) through renderPrintables,
 * then prints the `downloads:` entry to paste into the frontmatter. Astro ignores `assets:`.
 *
 * assets:
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
 * Original art only: shapes, a calendar card and a little text, no logos. Keep the main shapes inside the
 * middle 900 px so 4:3 and 1:1 crops (Discover, schema images) still read.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { parse } from "yaml";
import { LETTER, doc, fontFaces } from "./julian.js";
import { MONTHS, renderPrintables } from "./printables.js";
import { ROOT } from "./paths.js";

const W = 1200, H = 675;
const ARTICLES = path.join(ROOT, "apps/news/src/content/articles");
const CATEGORY_COLOR: Record<string, string> = {
  holidays: "#b45309", planning: "#1e3a8a", "retail-dates": "#be123c", "school-calendars": "#0f766e",
  "sky-events": "#1e1b4b", "time-change": "#6d28d9", "uk-canada": "#9f1239", puzzles: "#4c1d95",
};
const DOW = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

type Printable = { slug: string; group: string; title: string; subtitle?: string; columns?: [string, string]; rows: [string, string][]; note: string; description?: string; alt?: string };
type Assets = { kicker?: string; title?: string; date?: string; color?: string; card?: { top?: string; big: string; bottom?: string }; printable?: Printable };
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

function sheet(fonts: string, slug: string, color: string, p: Printable): string {
  const rows = p.rows.map(([d, w]) => `<tr><td class="d">${esc(d)}</td><td>${esc(w)}</td><td class="ck"><span></span></td></tr>`).join("");
  const small = p.rows.length > 16;
  const notes = Math.max(4, 22 - p.rows.length);
  const css = `
  .dl{padding:34px 40px 0}
  .dl h1{font-family:Sora;font-weight:800;font-size:27px;margin:0;color:${color};line-height:1.08}
  .dl .sub{margin:6px 0 16px;font-size:11.5px;color:#37474f}
  .dl table{width:100%;border-collapse:collapse;font-size:${small ? 10.5 : 12}px}
  .dl th{font-family:Sora;font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;color:${color};text-align:left;padding:6px 8px;border-bottom:3px solid ${color}}
  .dl td{padding:${small ? 6 : 9}px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top;line-height:1.35;color:#1f2937}
  .dl td.d{font-family:Sora;font-weight:800;color:#0f172a;width:34%}
  .dl td.ck{width:46px;text-align:center}.dl td.ck span{display:inline-block;width:14px;height:14px;border:1.6px solid ${color};border-radius:3px}
  .dl .notes{margin-top:16px;border:1.6px solid #e2e8f0;border-radius:10px;padding:10px 14px}
  .dl .notes b{font-family:Sora;font-size:12.5px;color:${color}}
  .dl .notes i{display:block;border-bottom:1px solid #e2e8f0;height:28px}
  .dl .note{margin-top:10px;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const [c1, c2] = p.columns ?? ["Date", "What happens"];
  const page = `<section class="page dl"><h1>${esc(p.title)}</h1>${p.subtitle ? `<p class="sub">${esc(p.subtitle)}</p>` : ""}
    <table><thead><tr><th>${esc(c1)}</th><th>${esc(c2)}</th><th>Done</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="notes"><b>My notes</b>${"<i></i>".repeat(notes)}</div>
    <p class="note">${esc(p.note)}</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${slug}/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
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
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    await page.setContent(hero(fonts, f, a), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png" });
    const dir = path.join(ROOT, "apps/news/src/assets/news", slug);
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
  const color = a.color ?? CATEGORY_COLOR[f.category] ?? "#1e3a8a";
  await renderPrintables(p.group, [{ slug: p.slug, size: LETTER, html: sheet(fonts, slug, color, p) }]);
  const q = (s: string) => JSON.stringify(s);
  console.log(`\nPaste under downloads: in the frontmatter:\n  - group: ${q(p.title.replace(/[,:].*$/, "") + " printables")}
    title: ${q(p.title)}
    description: ${q(p.description ?? (p.subtitle ?? p.title))}
    preview: ../../../../assets/news/${p.group}/${p.slug}.png
    alt: ${q(p.alt ?? `${p.title} printable`)}
    pdf: "/news/downloads/${p.group}/${p.slug}.pdf"
    png: "/news/downloads/${p.group}/${p.slug}.png"
    pages: 1`);
}
