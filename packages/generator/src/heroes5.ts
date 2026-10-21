/**
 * Spoiler-free hero illustrations for the daily puzzle stories on /news/ (Puzzles category):
 * each game gets its own board motif with no answer letters, plus the puzzle number and date.
 * Drawn as HTML/SVG in Chromium, saved as 2400×1350 JPEGs. Usage: pnpm fc news-heroes5
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";

const W = 1200, H = 675;
const frame = (fonts: string, bg: string, body: string) => `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;background:${bg};font-family:Manrope,sans-serif;position:relative}
.t{position:absolute;left:64px;top:132px;width:540px;font-family:Sora;font-weight:800;color:#fff;line-height:1.02;font-size:68px;letter-spacing:-.01em}
.k{position:absolute;left:64px;top:96px;font-weight:800;font-size:15px;letter-spacing:.16em;text-transform:uppercase}
.d{position:absolute;left:64px;width:520px;color:#e5e7eb;font-size:21px;line-height:1.4;font-weight:600}
.brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.75)}
</style></head><body>${body}<div class="brand">freshcalendars.com/news</div></body></html>`;

type Opts = { bg: string; accent: string; kicker: string; title: string; dek: string; art: string };
const hero = (fonts: string, o: Opts) => frame(fonts, o.bg, `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter></defs><rect width="${W}" height="${H}" fill="${o.bg}"/><g filter="url(#sh)">${o.art}</g></svg>
  <div class="k" style="color:${o.accent}">${o.kicker}</div><div class="t">${o.title}</div><div class="d" style="top:${o.title.length > 18 ? 360 : 300}px">${o.dek}</div>`);

const grid = (x: number, y: number, cols: number, rows: number, s: number, gap: number, fill: (r: number, c: number) => string, rx = 8) =>
  Array.from({ length: rows * cols }, (_, i) => { const r = Math.floor(i / cols), c = i % cols; return `<rect x="${x + c * (s + gap)}" y="${y + r * (s + gap)}" width="${s}" height="${s}" rx="${rx}" fill="${fill(r, c)}"/>`; }).join("");

const G = "#6aaa64", Y = "#c9b458", N = "#787c7e", E = "#ffffff";
const ART: Record<string, string> = {
  wordle: grid(700, 95, 5, 6, 76, 10, (r, c) => (r === 0 ? [N, Y, N, N, G][c] : r === 1 ? [Y, N, G, N, G][c] : r === 2 ? [G, G, G, G, G][c] : E), 6),
  connections: grid(690, 120, 4, 4, 112, 12, (r) => (r === 0 ? "#f9df6d" : r === 1 ? "#a0c35a" : "#efefe6"), 12),
  strands: Array.from({ length: 48 }, (_, i) => { const r = Math.floor(i / 6), c = i % 6, on = [8, 14, 15, 21, 27, 28, 34].includes(i), sp = [0, 7, 13, 20].includes(i); return `<circle cx="${740 + c * 70}" cy="${80 + r * 70}" r="27" fill="${sp ? "#f8cd05" : on ? "#aedfee" : "#ffffff"}"/>`; }).join(""),
  mini: grid(720, 110, 5, 5, 86, 4, (r, c) => ((r === 0 && c === 0) || (r === 4 && c === 4) ? "#111827" : r === 1 ? "#a7d8ff" : c === 2 && r < 4 ? "#ffda00" : E), 2),
  quordle: [0, 1, 2, 3].map((q) => grid(690 + (q % 2) * 230, 90 + Math.floor(q / 2) * 260, 5, 5, 38, 5, (r, c) => (r === 4 && q !== 3 ? G : r < 2 ? (c % 2 ? Y : N) : E), 4)).join(""),
  bee: [[0, 0], [0, -1], [0.866, -0.5], [0.866, 0.5], [0, 1], [-0.866, 0.5], [-0.866, -0.5]].map(([dx, dy], i) => { const cx = 900 + dx * 150, cy = 330 + dy * 150; const pts = Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 3 * k; return `${cx + 82 * Math.cos(a)},${cy + 82 * Math.sin(a)}`; }).join(" "); return `<polygon points="${pts}" fill="${i === 0 ? "#f7da21" : "#e6e6e6"}"/>`; }).join(""),
  contexto: [0.95, 0.82, 0.7, 0.55, 0.42, 0.3, 0.2].map((v, i) => `<rect x="690" y="${110 + i * 64}" width="460" height="48" rx="10" fill="#1f2a44"/><rect x="690" y="${110 + i * 64}" width="${460 * v}" height="48" rx="10" fill="${i < 2 ? "#22c55e" : i < 4 ? "#eab308" : "#ef4444"}"/>`).join(""),
  blossom: Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 3 * k - Math.PI / 2; return `<ellipse cx="${905 + 135 * Math.cos(a)}" cy="${335 + 135 * Math.sin(a)}" rx="78" ry="78" fill="#f9a8d4"/>`; }).join("") + `<circle cx="905" cy="335" r="90" fill="#fde047"/>`,
};

/** [slug, game art key, bg, accent, kicker, title, dek]: filled in per day. */
export const PUZZLE_HEROES: [string, string, string, string, string, string, string][] = [
  ["wordle-hint-answer-today-october-21-2026-1950", "wordle", "#121213", "#c9b458", "Wordle #1950 · Wed., Oct. 21, 2026", "Wordle hints today", "Five clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-october-21-2026-1228", "connections", "#1e1a3a", "#f9df6d", "Connections #1228 · Wed., Oct. 21, 2026", "Connections hints", "Two hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-october-21-2026-962", "strands", "#0f2f3a", "#aedfee", "Strands #962 · Wed., Oct. 21, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-mini-crossword-answers-october-21-2026", "mini", "#0b2545", "#a7d8ff", "NYT Mini · Wed., Oct. 21, 2026", "Mini Crossword answers", "A hint for every clue, then the full grid."],
  ["quordle-hints-answers-october-21-2026-1731", "quordle", "#1f2937", "#6aaa64", "Quordle #1731 · Wed., Oct. 21, 2026", "Quordle hints today", "A clue for each of the four words, answers at the end."],
  ["contexto-answer-hints-october-21-2026-1494", "contexto", "#111827", "#22c55e", "Contexto #1494 · Wed., Oct. 21, 2026", "Contexto hints today", "Close words and graded hints before the secret word."],
  ["blossom-word-game-answers-october-21-2026", "blossom", "#3b0a2a", "#fde047", "Blossom · Wed., Oct. 21, 2026", "Blossom answers today", "Today's letters, scoring tips and both pangrams."],
];

export async function buildHeroes5(): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [slug, art, bg, accent, kicker, title, dek] of PUZZLE_HEROES) {
      const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
      await page.setContent(hero(fonts, { bg, accent, kicker, title, dek, art: ART[art] }), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ type: "png" });
      await page.close();
      const dir = path.join(ROOT, "apps/news/src/assets/news", slug);
      await fs.mkdir(dir, { recursive: true });
      await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${slug}.jpg`));
      console.log(`${slug}.jpg`);
    }
  } finally {
    await browser.close();
  }
}
