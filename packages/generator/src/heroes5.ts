/**
 * Spoiler-free hero illustrations for the daily puzzle stories on /news/ (Puzzles category):
 * each game gets its own board motif with no answer letters, plus the puzzle number and date.
 * Drawn as HTML/SVG in Chromium, saved as 2400×1350 JPEGs. Usage: pnpm fc news-heroes5 [--only <slug-substring>]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";
import { rng } from "./art.js";

const W = 1200, H = 675;
const frame = (fonts: string, bg: string, body: string) => `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;background:${bg};font-family:Manrope,sans-serif;position:relative}
.t{position:absolute;left:64px;top:132px;width:540px;font-family:Sora;font-weight:800;color:#fff;line-height:1.02;font-size:68px;letter-spacing:-.01em}
.k{position:absolute;left:64px;top:96px;font-weight:800;font-size:15px;letter-spacing:.16em;text-transform:uppercase}
.d{position:absolute;left:64px;width:520px;color:#e5e7eb;font-size:21px;line-height:1.4;font-weight:600}
.brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.75)}
</style></head><body>${body}<div class="brand">freshcalendars.com/news</div></body></html>`;

type Opts = { bg: string; accent: string; kicker: string; title: string; dek: string; art: string; seed: string };
/**
 * Each day's board is tilted, scaled and placed differently, over a seeded scatter of faint tiles in
 * the accent color, so a daily series never repeats a picture.
 */
const hero = (fonts: string, o: Opts) => {
  const r = rng(`layout:${o.seed}`);
  const tilt = (r() * 2 - 1) * 11, scale = 0.86 + r() * 0.18, dx = (r() * 2 - 1) * 60, dy = (r() * 2 - 1) * 30;
  const confetti = Array.from({ length: 26 }, () => {
    const sz = 14 + r() * 34, x = 560 + r() * 640, y = r() * H;
    return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${sz.toFixed(0)}" height="${sz.toFixed(0)}" rx="${(sz / 5).toFixed(0)}" fill="${o.accent}" opacity="${(0.06 + r() * 0.16).toFixed(2)}" transform="rotate(${(r() * 90).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
  }).join("");
  return frame(fonts, o.bg, `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter></defs><rect width="${W}" height="${H}" fill="${o.bg}"/>${confetti}<g filter="url(#sh)" transform="translate(${dx.toFixed(0)} ${dy.toFixed(0)}) rotate(${tilt.toFixed(1)} 905 335) translate(905 335) scale(${scale.toFixed(3)}) translate(-905 -335)">${o.art}</g></svg>
  <div class="k" style="color:${o.accent}">${o.kicker}</div><div class="t">${o.title}</div><div class="d" style="top:${o.title.length > 18 ? 360 : 300}px">${o.dek}</div>`);
};

const grid = (x: number, y: number, cols: number, rows: number, s: number, gap: number, fill: (r: number, c: number) => string, rx = 8) =>
  Array.from({ length: rows * cols }, (_, i) => { const r = Math.floor(i / cols), c = i % cols; return `<rect x="${x + c * (s + gap)}" y="${y + r * (s + gap)}" width="${s}" height="${s}" rx="${rx}" fill="${fill(r, c)}"/>`; }).join("");

const G = "#6aaa64", Y = "#c9b458", N = "#787c7e", E = "#ffffff";
/**
 * Board motifs, seeded by the story slug: the same game looks the same in kind but never the same
 * picture two days running (audit 12-HERO-UNIQUE). Colors and positions are random, so they reveal
 * nothing about the day's answer.
 */
type Rng = () => number;
const pick = <T,>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length)]!;
const shuffle = <T,>(r: Rng, a: T[]): T[] => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; };
const ART: Record<string, (r: Rng) => string> = {
  wordle: (r) => {
    const solved = 2 + Math.floor(r() * 4);
    const rows = Array.from({ length: solved - 1 }, () => Array.from({ length: 5 }, () => pick(r, [N, N, N, Y, Y, G])));
    return grid(700, 95, 5, 6, 76, 10, (row, c) => (row < solved - 1 ? rows[row]![c]! : row === solved - 1 ? G : E), 6);
  },
  connections: (r) => {
    const solved = 1 + Math.floor(r() * 3), order = shuffle(r, ["#f9df6d", "#a0c35a", "#b0c4ef", "#ba81c5"]);
    return grid(690, 120, 4, 4, 112, 12, (row) => (row < solved ? order[row]! : "#efefe6"), 12);
  },
  strands: (r) => {
    // A connected path for the spangram and a short theme word, drawn as a random walk.
    const walk = (len: number, start: number) => { const out = [start]; while (out.length < len) { const at = out[out.length - 1]!, row = Math.floor(at / 6), col = at % 6; const next = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1]].map(([dr, dc]) => [row + dr!, col + dc!]).filter(([a, b]) => a! >= 0 && a! < 8 && b! >= 0 && b! < 6).map(([a, b]) => a! * 6 + b!).filter((i) => !out.includes(i)); if (!next.length) break; out.push(pick(r, next)); } return out; };
    const sp = walk(6, Math.floor(r() * 6)), on = walk(4 + Math.floor(r() * 3), 18 + Math.floor(r() * 24)).filter((i) => !sp.includes(i));
    return Array.from({ length: 48 }, (_, i) => `<circle cx="${740 + (i % 6) * 70}" cy="${80 + Math.floor(i / 6) * 70}" r="27" fill="${sp.includes(i) ? "#f8cd05" : on.includes(i) ? "#aedfee" : "#ffffff"}"/>`).join("");
  },
  mini: (r) => {
    const black = new Set(Array.from({ length: 2 + Math.floor(r() * 3) }, () => Math.floor(r() * 25))), across = Math.floor(r() * 5), down = Math.floor(r() * 5);
    return grid(720, 110, 5, 5, 86, 4, (row, c) => (black.has(row * 5 + c) ? "#111827" : row === across ? "#a7d8ff" : c === down ? "#ffda00" : E), 2);
  },
  quordle: (r) => [0, 1, 2, 3].map((q) => {
    const solvedAt = 2 + Math.floor(r() * 3), rows = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => pick(r, [N, N, Y, G])));
    return grid(690 + (q % 2) * 230, 90 + Math.floor(q / 2) * 260, 5, 5, 38, 5, (row, c) => (row < solvedAt ? rows[row]![c]! : row === solvedAt ? G : E), 4);
  }).join(""),
  bee: (r) => {
    const turn = r() * Math.PI / 3, lit = Math.floor(r() * 6) + 1;
    return [[0, 0], [0, -1], [0.866, -0.5], [0.866, 0.5], [0, 1], [-0.866, 0.5], [-0.866, -0.5]].map(([dx, dy], i) => { const cx = 900 + dx! * 150, cy = 330 + dy! * 150; const pts = Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 3 * k + turn; return `${cx + 82 * Math.cos(a)},${cy + 82 * Math.sin(a)}`; }).join(" "); return `<polygon points="${pts}" fill="${i === 0 ? "#f7da21" : i === lit ? "#fff3a8" : "#e6e6e6"}"/>`; }).join("");
  },
  contexto: (r) => Array.from({ length: 7 }, () => 0.15 + r() * 0.82).sort((a, b) => b - a).map((v, i) => `<rect x="690" y="${110 + i * 64}" width="460" height="48" rx="10" fill="#1f2a44"/><rect x="690" y="${110 + i * 64}" width="${Math.round(460 * v)}" height="48" rx="10" fill="${v > 0.75 ? "#22c55e" : v > 0.45 ? "#eab308" : "#ef4444"}"/>`).join(""),
  blossom: (r) => {
    const turn = r() * Math.PI / 3, petal = pick(r, ["#f9a8d4", "#c4b5fd", "#fda4af", "#93c5fd"]);
    return Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 3 * k - Math.PI / 2 + turn; return `<ellipse cx="${905 + 135 * Math.cos(a)}" cy="${335 + 135 * Math.sin(a)}" rx="78" ry="78" fill="${petal}"/>`; }).join("") + `<circle cx="905" cy="335" r="90" fill="#fde047"/>`;
  },
  /** Connections: Sports Edition: the 4×4 board with a stitched ball in one corner. */
  sports: (r) => {
    const solved = 1 + Math.floor(r() * 3), order = shuffle(r, ["#f9df6d", "#a0c35a", "#b0c4ef", "#ba81c5"]);
    return grid(660, 110, 4, 4, 104, 12, (row) => (row < solved ? order[row]! : "#efefe6"), 12)
      + `<g transform="translate(680 560) rotate(${(r() * 60 - 30).toFixed(0)})"><ellipse rx="70" ry="44" fill="#9a3412"/><path d="M-34 0 H34" stroke="#fff" stroke-width="5"/>${[-20, -7, 7, 20].map((x) => `<path d="M${x} -9 V9" stroke="#fff" stroke-width="5"/>`).join("")}</g>`;
  },
  /** Pips: colored regions on a 4×4 board with a few dominoes laid on it; pip counts are random. */
  pips: (r) => {
    const region = ["#f9a8d4", "#93c5fd", "#fde68a", "#86efac", "#c4b5fd"];
    const cells = grid(700, 110, 4, 4, 100, 8, (row, c) => region[(row * 2 + c + Math.floor(r() * 2)) % region.length]!, 10);
    const dot = (cx: number, cy: number, n: number) => [[0, 0], [-1, -1], [1, 1], [-1, 1], [1, -1], [-1, 0], [1, 0]].slice(n % 2 ? 0 : 1, (n % 2 ? 0 : 1) + n).map(([dx, dy]) => `<circle cx="${cx + dx! * 22}" cy="${cy + dy! * 22}" r="8" fill="#111827"/>`).join("");
    const dominoes = Array.from({ length: 3 }, (_, i) => {
      const x = 700 + Math.floor(r() * 3) * 108, y = 110 + i * 108 + (i === 2 ? 108 : 0), a = Math.floor(r() * 7), b = Math.floor(r() * 7);
      return `<g><rect x="${x + 4}" y="${y + 4}" width="${200}" height="92" rx="14" fill="#fff" stroke="#111827" stroke-width="3"/><path d="M${x + 104} ${y + 14} V${y + 86}" stroke="#111827" stroke-width="3"/>${dot(x + 54, y + 50, a)}${dot(x + 154, y + 50, b)}</g>`;
    }).join("");
    return cells + dominoes;
  },
  /** LinkedIn games: a Queens board of colored regions with crowns, and a strip of Tango suns and moons. */
  linkedin: (r) => {
    const region = shuffle(r, ["#fca5a5", "#fdba74", "#fde047", "#86efac", "#93c5fd", "#c4b5fd"]);
    const n = 6, s = 70, cols = shuffle(r, [0, 1, 2, 3, 4, 5]);
    const board = grid(700, 70, n, n, s, 4, (row, c) => region[(Math.floor(row / 2) * 2 + Math.floor(c / 3) + (row % 2 && c > 3 ? 1 : 0)) % n]!, 6);
    const crowns = Array.from({ length: 3 }, (_, i) => { const row = i * 2 + Math.floor(r() * 2), c = cols[i]!, x = 700 + c * (s + 4) + s / 2, y = 70 + row * (s + 4) + s / 2; return `<path d="M${x - 20} ${y + 14} L${x - 22} ${y - 12} L${x - 8} ${y} L${x} ${y - 18} L${x + 8} ${y} L${x + 22} ${y - 12} L${x + 20} ${y + 14} Z" fill="#111827"/>`; }).join("");
    const tango = Array.from({ length: 6 }, (_, i) => { const x = 700 + i * 74 + 35, y = 545; return r() < 0.5 ? `<circle cx="${x}" cy="${y}" r="24" fill="#f59e0b"/>` : `<circle cx="${x}" cy="${y}" r="24" fill="#60a5fa"/><circle cx="${x + 11}" cy="${y - 7}" r="20" fill="#ffffff"/>`; }).join("");
    return board + crowns + `<rect x="696" y="505" width="448" height="80" rx="12" fill="#ffffff" opacity=".9"/>` + tango;
  },
  /** Letter Boxed: the square with three letter dots per side and a few random lines across it; no letters. */
  letterboxed: (r) => {
    const x0 = 730, y0 = 140, s = 360, at = [0.2, 0.5, 0.8];
    const dots = [0, 1, 2, 3].flatMap((side) => at.map((t) => side === 0 ? [x0 + s * t, y0] : side === 1 ? [x0 + s, y0 + s * t] : side === 2 ? [x0 + s * t, y0 + s] : [x0, y0 + s * t]));
    let at0 = Math.floor(r() * 12);
    const path = [dots[at0]!];
    for (let i = 0; i < 4 + Math.floor(r() * 3); i++) { let n = at0; while (Math.floor(n / 3) === Math.floor(at0 / 3)) n = Math.floor(r() * 12); path.push(dots[n]!); at0 = n; }
    return `<rect x="${x0}" y="${y0}" width="${s}" height="${s}" fill="#ffffff" stroke="#111827" stroke-width="10"/>`
      + `<polyline points="${path.map(([x, y]) => `${x!.toFixed(0)},${y!.toFixed(0)}`).join(" ")}" fill="none" stroke="#fa8072" stroke-width="7" stroke-dasharray="${r() < 0.5 ? "0" : "14 10"}" stroke-linejoin="round"/>`
      + dots.map(([x, y]) => `<circle cx="${x!.toFixed(0)}" cy="${y!.toFixed(0)}" r="17" fill="#ffffff" stroke="#111827" stroke-width="6"/>`).join("");
  },
  /** Waffle: the 5×5 waffle grid with its four holes; tile colors are random. */
  waffle: (r) => grid(700, 95, 5, 5, 88, 10, (row, c) => (row % 2 && c % 2 ? "none" : pick(r, [G, G, G, Y, Y, "#e5e7eb"])), 12),
};

/** [slug, game art key, bg, accent, kicker, title, dek]: filled in per day. */
export const PUZZLE_HEROES: [string, string, string, string, string, string, string][] = [
  ["wordle-hint-answer-today-october-25-2026-1954", "wordle", "#121213", "#c9b458", "Wordle #1954 · Sun., Oct. 25, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-october-25-2026-1232", "connections", "#1e1a3a", "#f9df6d", "Connections #1232 · Sun., Oct. 25, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-october-25-2026-966", "strands", "#0f2f3a", "#aedfee", "Strands #966 · Sun., Oct. 25, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["quordle-hints-answers-october-25-2026-1735", "quordle", "#1f2937", "#6aaa64", "Quordle #1735 · Sun., Oct. 25, 2026", "Quordle hints today", "A clue for each of the four words, answers at the end."],
  ["nyt-spelling-bee-hints-answers-october-26-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Mon., Oct. 26, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
  ["nyt-connections-sports-edition-hints-answers-october-26-2026-763", "sports", "#0f2a1d", "#a0c35a", "Sports Edition #763 · Mon., Oct. 26, 2026", "Sports Connections", "Hints for every group first, the answers at the end."],
  ["linkedin-games-answers-today-october-26-2026-queens-tango-zip", "linkedin", "#0b2545", "#93c5fd", "LinkedIn games · Mon., Oct. 26, 2026", "LinkedIn games hints", "Queens, Tango, Zip, Pinpoint and Crossclimb, hints first."],
  ["nyt-spelling-bee-hints-answers-october-25-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Sun., Oct. 25, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
  ["nyt-pips-hints-answers-october-25-2026", "pips", "#1e293b", "#f9a8d4", "Pips · Sun., Oct. 25, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-connections-sports-edition-hints-answers-october-25-2026-762", "sports", "#0f2a1d", "#a0c35a", "Sports Edition #762 · Sun., Oct. 25, 2026", "Sports Connections", "Hints for every group first, answers only at the end."],
  ["linkedin-games-answers-today-october-25-2026-queens-tango-zip", "linkedin", "#0b2545", "#93c5fd", "LinkedIn games · Sun., Oct. 25, 2026", "LinkedIn games hints", "Queens, Tango, Zip, Pinpoint and Crossclimb, answers at the end."],
  ["wordle-hint-answer-today-october-26-2026-1955", "wordle", "#121213", "#c9b458", "Wordle #1955 · Mon., Oct. 26, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-october-26-2026-1233", "connections", "#1e1a3a", "#f9df6d", "Connections #1233 · Mon., Oct. 26, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-october-26-2026-967", "strands", "#0f2f3a", "#aedfee", "Strands #967 · Mon., Oct. 26, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-pips-hints-answers-october-26-2026", "pips", "#1e293b", "#93c5fd", "Pips · Mon., Oct. 26, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-mini-crossword-answers-october-25-2026", "mini", "#111827", "#a7d8ff", "NYT Mini · Sun., Oct. 25, 2026", "NYT Mini answers", "A hint for every clue first, the full grid at the end."],
  ["contexto-answer-hints-october-25-2026-1498", "contexto", "#0f172a", "#22c55e", "Contexto #1498 · Sun., Oct. 25, 2026", "Contexto hints", "Close words and hints first, the secret word only at the end."],
  ["blossom-word-game-answers-october-25-2026", "blossom", "#3b0764", "#fde047", "Blossom · Sun., Oct. 25, 2026", "Blossom answers", "Letters and hints first, the pangrams only at the end."],
  ["nyt-connections-answers-meanings-october-25-2026-1232", "connections", "#14213d", "#b0c4ef", "Connections #1232 · Sun., Oct. 25, 2026", "Connections meanings", "What every word means and why it fits, answers in spoilers."],
  ["wordle-hint-answer-today-october-27-2026-1956", "wordle", "#121213", "#c9b458", "Wordle #1956 · Tue., Oct. 27, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-october-27-2026-1234", "connections", "#1e1a3a", "#f9df6d", "Connections #1234 · Tue., Oct. 27, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-october-27-2026-968", "strands", "#0f2f3a", "#aedfee", "Strands #968 · Tue., Oct. 27, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-pips-hints-answers-october-27-2026", "pips", "#1e293b", "#fde68a", "Pips · Tue., Oct. 27, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-spelling-bee-hints-answers-october-27-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Tue., Oct. 27, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
  ["nyt-mini-crossword-answers-october-26-2026", "mini", "#111827", "#ffda00", "NYT Mini · Mon., Oct. 26, 2026", "NYT Mini answers", "A hint for every clue first, the full grid at the end."],
  ["nyt-letter-boxed-answer-hints-october-27-2026", "letterboxed", "#3d1f1a", "#fa8072", "Letter Boxed · Tue., Oct. 27, 2026", "Letter Boxed hints", "Starting letters and word lengths first, the answer at the end."],
  ["waffle-answer-hints-today-october-26-2026-1739", "waffle", "#1f2937", "#6aaa64", "Waffle #1739 · Mon., Oct. 26, 2026", "Waffle hints today", "A clue for each of the six words, the solved grid at the end."],
  ["wordle-hint-answer-today-october-28-2026-1957", "wordle", "#121213", "#c9b458", "Wordle #1957 · Wed., Oct. 28, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-october-28-2026-1235", "connections", "#1e1a3a", "#f9df6d", "Connections #1235 · Wed., Oct. 28, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-october-28-2026-969", "strands", "#0f2f3a", "#aedfee", "Strands #969 · Wed., Oct. 28, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-pips-hints-answers-october-28-2026", "pips", "#1e293b", "#86efac", "Pips · Wed., Oct. 28, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-spelling-bee-hints-answers-october-28-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Wed., Oct. 28, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
  ["nyt-letter-boxed-answer-hints-october-28-2026", "letterboxed", "#3d1f1a", "#fa8072", "Letter Boxed · Wed., Oct. 28, 2026", "Letter Boxed hints", "Starting letters and word lengths first, the answer at the end."],
  ["wordle-hint-answer-today-october-29-2026-1958", "wordle", "#121213", "#c9b458", "Wordle #1958 · Thu., Oct. 29, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-october-29-2026-1236", "connections", "#1e1a3a", "#f9df6d", "Connections #1236 · Thu., Oct. 29, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-october-29-2026-970", "strands", "#0f2f3a", "#aedfee", "Strands #970 · Thu., Oct. 29, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-pips-hints-answers-october-29-2026", "pips", "#1e293b", "#c4b5fd", "Pips · Thu., Oct. 29, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-spelling-bee-hints-answers-october-29-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Thu., Oct. 29, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
  ["nyt-letter-boxed-answer-hints-october-29-2026", "letterboxed", "#3d1f1a", "#fa8072", "Letter Boxed · Thu., Oct. 29, 2026", "Letter Boxed hints", "Starting letters and word lengths first, the answer at the end."],
  ["contexto-answer-hints-october-26-2026-1499", "contexto", "#0f172a", "#eab308", "Contexto #1499 · Mon., Oct. 26, 2026", "Contexto hints", "Close words and hints first, the secret word only at the end."],
  ["contexto-answer-hints-october-27-2026-1500", "contexto", "#111827", "#22c55e", "Contexto #1500 · Tue., Oct. 27, 2026", "Contexto hints", "Close words and hints first, the secret word only at the end."],
  ["wordle-hint-answer-today-october-30-2026-1959", "wordle", "#121213", "#c9b458", "Wordle #1959 · Fri., Oct. 30, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-october-30-2026-1237", "connections", "#1e1a3a", "#f9df6d", "Connections #1237 · Fri., Oct. 30, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-october-30-2026-971", "strands", "#0f2f3a", "#aedfee", "Strands #971 · Fri., Oct. 30, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-pips-hints-answers-october-30-2026", "pips", "#1e293b", "#fda4af", "Pips · Fri., Oct. 30, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-spelling-bee-hints-answers-october-30-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Fri., Oct. 30, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
  ["nyt-letter-boxed-answer-hints-october-30-2026", "letterboxed", "#3d1f1a", "#fa8072", "Letter Boxed · Fri., Oct. 30, 2026", "Letter Boxed hints", "Starting letters and word lengths first, the answer at the end."],
  ["wordle-hint-answer-today-october-31-2026-1960", "wordle", "#121213", "#c9b458", "Wordle #1960 · Sat., Oct. 31, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-october-31-2026-1238", "connections", "#1e1a3a", "#f9df6d", "Connections #1238 · Sat., Oct. 31, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-october-31-2026-972", "strands", "#0f2f3a", "#aedfee", "Strands #972 · Sat., Oct. 31, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-pips-hints-answers-october-31-2026", "pips", "#1e293b", "#fdba74", "Pips · Sat., Oct. 31, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-spelling-bee-hints-answers-october-31-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Sat., Oct. 31, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
  ["nyt-letter-boxed-answer-hints-october-31-2026", "letterboxed", "#3d1f1a", "#fa8072", "Letter Boxed · Sat., Oct. 31, 2026", "Letter Boxed hints", "Starting letters and word lengths first, the answer at the end."],
  ["contexto-answer-hints-october-28-2026-1501", "contexto", "#0f172a", "#f59e0b", "Contexto #1501 · Wed., Oct. 28, 2026", "Contexto hints", "Close words and hints first, the secret word only at the end."],
  ["contexto-answer-hints-october-29-2026-1502", "contexto", "#0f172a", "#a78bfa", "Contexto #1502 · Thu., Oct. 29, 2026", "Contexto hints", "Close words and hints first, the secret word only at the end."],
  ["contexto-answer-hints-october-30-2026-1503", "contexto", "#0f172a", "#38bdf8", "Contexto #1503 · Fri., Oct. 30, 2026", "Contexto hints", "Close words and hints first, the secret word only at the end."],
  ["contexto-answer-hints-october-31-2026-1504", "contexto", "#0f172a", "#fb923c", "Contexto #1504 · Sat., Oct. 31, 2026", "Contexto hints", "Close words and hints first, the secret word only at the end."],
  ["wordle-hint-answer-today-november-1-2026-1961", "wordle", "#121213", "#c9b458", "Wordle #1961 · Sun., Nov. 1, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-november-1-2026-1239", "connections", "#1e1a3a", "#f9df6d", "Connections #1239 · Sun., Nov. 1, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-november-1-2026-973", "strands", "#0f2f3a", "#aedfee", "Strands #973 · Sun., Nov. 1, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-pips-hints-answers-november-1-2026", "pips", "#1e293b", "#93c5fd", "Pips · Sun., Nov. 1, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-spelling-bee-hints-answers-november-1-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Sun., Nov. 1, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
  ["nyt-letter-boxed-answer-hints-november-1-2026", "letterboxed", "#3d1f1a", "#fa8072", "Letter Boxed · Sun., Nov. 1, 2026", "Letter Boxed hints", "Starting letters and word lengths first, the answer at the end."],
  ["wordle-hint-answer-today-november-2-2026-1962", "wordle", "#121213", "#c9b458", "Wordle #1962 · Mon., Nov. 2, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-november-2-2026-1240", "connections", "#1e1a3a", "#f9df6d", "Connections #1240 · Mon., Nov. 2, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-november-2-2026-974", "strands", "#0f2f3a", "#aedfee", "Strands #974 · Mon., Nov. 2, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-pips-hints-answers-november-2-2026", "pips", "#1e293b", "#f9a8d4", "Pips · Mon., Nov. 2, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-spelling-bee-hints-answers-november-2-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Mon., Nov. 2, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
  ["wordle-hint-answer-today-november-3-2026-1963", "wordle", "#121213", "#c9b458", "Wordle #1963 · Tue., Nov. 3, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-november-3-2026-1241", "connections", "#1e1a3a", "#f9df6d", "Connections #1241 · Tue., Nov. 3, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-november-3-2026-975", "strands", "#0f2f3a", "#aedfee", "Strands #975 · Tue., Nov. 3, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-pips-hints-answers-november-3-2026", "pips", "#1e293b", "#fde68a", "Pips · Tue., Nov. 3, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-spelling-bee-hints-answers-november-3-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Tue., Nov. 3, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
  ["contexto-answer-hints-november-1-2026-1505", "contexto", "#0f172a", "#34d399", "Contexto #1505 · Sun., Nov. 1, 2026", "Contexto hints", "Close words and hints first, the secret word only at the end."],
  ["contexto-answer-hints-november-2-2026-1506", "contexto", "#0f172a", "#f472b6", "Contexto #1506 · Mon., Nov. 2, 2026", "Contexto hints", "Close words and hints first, the secret word only at the end."],
  ["contexto-answer-hints-november-3-2026-1507", "contexto", "#0f172a", "#facc15", "Contexto #1507 · Tue., Nov. 3, 2026", "Contexto hints", "Close words and hints first, the secret word only at the end."],
  ["wordle-hint-answer-today-november-4-2026-1964", "wordle", "#121213", "#c9b458", "Wordle #1964 · Wed., Nov. 4, 2026", "Wordle hints today", "Six clues from gentle to strong, the answer only at the end."],
  ["nyt-connections-hints-answers-november-4-2026-1242", "connections", "#1e1a3a", "#f9df6d", "Connections #1242 · Wed., Nov. 4, 2026", "Connections hints", "Gentle hints for every group first, answers only at the end."],
  ["nyt-strands-hints-answers-november-4-2026-976", "strands", "#0f2f3a", "#aedfee", "Strands #976 · Wed., Nov. 4, 2026", "Strands hints today", "Spangram and theme-word hints first, answers at the end."],
  ["nyt-pips-hints-answers-november-4-2026", "pips", "#1e293b", "#86efac", "Pips · Wed., Nov. 4, 2026", "Pips hints today", "Hints for Easy, Medium and Hard, placements at the end."],
  ["nyt-spelling-bee-hints-answers-november-4-2026", "bee", "#1c1917", "#f7da21", "Spelling Bee · Wed., Nov. 4, 2026", "Spelling Bee hints", "Hint grid and two-letter list first, the word list at the end."],
];

export async function buildHeroes5(only?: string): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [slug, art, bg, accent, kicker, title, dek] of PUZZLE_HEROES) {
      if (only && !slug.includes(only)) continue;
      const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
      await page.setContent(hero(fonts, { bg, accent, kicker, title, dek, art: ART[art]!(rng(slug)), seed: slug }), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ type: "png" });
      await page.close();
      const dir = path.join(ROOT, "apps/news/src/assets/news", slug);
      await fs.mkdir(dir, { recursive: true });
      await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${slug}.jpg`));
      await fs.writeFile(path.join(dir, `${slug}.hero.json`), `${JSON.stringify({ kind: "custom" }, null, 2)}\n`);
      console.log(`${slug}.jpg`);
    }
  } finally {
    await browser.close();
  }
}
