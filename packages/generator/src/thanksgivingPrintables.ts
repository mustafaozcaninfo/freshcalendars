/**
 * Thanksgiving 2026 table printables for /news/ (thanksgiving-printables-2026-place-cards-kids-table-activities).
 * Three US Letter PDFs: 8 fold-over place cards a page, 6 gratitude cards a page, and a 12-word
 * Thanksgiving word search with an answer key on page 2. The grid is built from a fixed seed, every
 * word is placed by code and its position is checked to be the only one in the grid, so the answer
 * key always matches. No kit draws cut-out cards or a letter grid, so this story owns its generator.
 * Usage: pnpm fc news-thanksgiving-printables
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "thanksgiving-printables-2026-place-cards-kids-table-activities";
const DATE_LINE = "Thanksgiving · Thu., Nov. 26, 2026";
const FOOT = `<div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div>`;

const WORDS = ["TURKEY", "PILGRIM", "CRANBERRY", "THURSDAY", "GRATITUDE", "LINCOLN", "HARVEST", "MINNESOTA", "ARCHIVES", "FEAST", "STUFFING", "PUMPKIN"];
const SIZE = 13;
const SEED = 2026;

/** Small seeded generator (mulberry32) so the grid is the same on every run. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

type Placed = { word: string; row: number; col: number; dr: number; dc: number };
/** Kids' directions: across, down and diagonal down-right. */
const DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1]];

/** Counts every place a word reads in the grid, in all eight directions. */
function occurrences(grid: string[][], word: string): number {
  let n = 0;
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    let ok = true;
    for (let i = 0; i < word.length && ok; i++) {
      const rr = r + dr * i, cc = c + dc * i;
      ok = rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && grid[rr][cc] === word[i];
    }
    if (ok) n++;
  }
  return n;
}

export function buildGrid(): { grid: string[][]; placed: Placed[] } {
  for (let attempt = 0; attempt < 500; attempt++) {
    const rand = rng(SEED + attempt);
    const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
    const placed: Placed[] = [];
    let fail = false;
    // Longest words first: they have the fewest places to go.
    for (const word of [...WORDS].sort((a, b) => b.length - a.length)) {
      let done = false;
      for (let tries = 0; tries < 300 && !done; tries++) {
        const [dr, dc] = DIRS[Math.floor(rand() * DIRS.length)];
        const row = Math.floor(rand() * SIZE), col = Math.floor(rand() * SIZE);
        const er = row + dr * (word.length - 1), ec = col + dc * (word.length - 1);
        if (er >= SIZE || ec >= SIZE) continue;
        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const ch = grid[row + dr * i][col + dc * i];
          if (ch && ch !== word[i]) fits = false;
        }
        if (!fits) continue;
        for (let i = 0; i < word.length; i++) grid[row + dr * i][col + dc * i] = word[i];
        placed.push({ word, row, col, dr, dc });
        done = true;
      }
      if (!done) { fail = true; break; }
    }
    if (fail) continue;
    const letters = "ABCDEFGHIJKLMNOPRSTUVWY";
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) grid[r][c] = letters[Math.floor(rand() * letters.length)];
    if (WORDS.every((w) => occurrences(grid, w) === 1)) return { grid, placed };
  }
  throw new Error("word search: no grid found with every word exactly once");
}

const dirName = (p: Placed) => (p.dr === 0 ? "across" : p.dc === 0 ? "down" : "diagonal");

const BASE_CSS = `
  .tp{padding:26px 36px 0}
  .tp header{border-bottom:4px solid #b45309;padding-bottom:6px;margin-bottom:10px}
  .tp h1{font-family:Sora;font-weight:800;font-size:23px;margin:0;color:#7c2d12;line-height:1.1}
  .tp .sub{margin:4px 0 0;font-size:11px;color:#37474f}
  .tp .note{position:absolute;left:36px;right:36px;bottom:36px;font-size:8.6px;color:#5a6b75;line-height:1.4}
  .tp .ln{border-bottom:1.5px solid #334155;height:22px}`;

function placeCards(fonts: string): string {
  const css = `${BASE_CSS}
  .pc{display:grid;grid-template-columns:372px 372px;grid-template-rows:repeat(4,214px);margin-left:0}
  .pc .card{border:1px dashed #64748b;display:flex;flex-direction:column;padding:0}
  .pc .half{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:0 22px 14px;position:relative}
  .pc .half.back{transform:rotate(180deg)}
  .pc .half.front{border-top:1.5px dotted #b45309}
  .pc .half .nm{width:100%;border-bottom:1.5px solid #334155;height:30px}
  .pc .half .dt{font-family:Sora;font-weight:700;font-size:9.5px;color:#9a3412;margin-top:5px;letter-spacing:.03em}
  .pc .fold{position:absolute;left:5px;top:50%;font-size:8px;color:#5a6b75;transform:translateY(-50%)}`;
  const half = (cls: string) => `<div class="half ${cls}"><div class="nm"></div><div class="dt">${DATE_LINE}</div></div>`;
  const card = `<div class="card">${half("back")}${half("front")}</div>`;
  const page = `<section class="page tp"><header><h1>Thanksgiving Place Cards 2026</h1><p class="sub">8 cards a page: cut on the dashed lines, fold on the dotted middle line, write a name on the line</p></header>
    <div class="pc">${card.repeat(8)}</div>
    <p class="note">Source: Thanksgiving Day is Thursday, Nov. 26, 2026 on the U.S. Office of Personnel Management (OPM) federal holidays list. Print at 100% on US Letter.</p>
    ${FOOT}</section>`;
  return doc(fonts, LETTER, css, [page]);
}

function gratitudeCards(fonts: string): string {
  const css = `${BASE_CSS}
  .gc{display:grid;grid-template-columns:372px 372px;grid-template-rows:repeat(3,282px)}
  .gc .card{border:1px dashed #64748b;padding:14px 22px 0;position:relative}
  .gc h2{font-family:Sora;font-weight:800;font-size:17px;color:#7c2d12;margin:0 0 6px}
  .gc .ln{margin-top:14px}
  .gc .fr{display:flex;align-items:flex-end;gap:8px;font-size:11px;font-weight:700;margin-top:18px;color:#334155}
  .gc .fr s{flex:1;border-bottom:1.5px solid #334155;height:18px;text-decoration:none}
  .gc .dt{font-family:Sora;font-weight:700;font-size:9.5px;color:#9a3412;margin-top:10px;letter-spacing:.03em}`;
  const card = `<div class="card"><h2>I am thankful for</h2><div class="ln"></div><div class="ln"></div><div class="ln"></div><div class="fr">From <s></s></div><div class="dt">${DATE_LINE}</div></div>`;
  const page = `<section class="page tp"><header><h1>Thanksgiving Gratitude Cards 2026</h1><p class="sub">6 cards a page: cut on the dashed lines, finish the sentence and leave one at each seat</p></header>
    <div class="gc">${card.repeat(6)}</div>
    <p class="note">Print at 100% on US Letter. Thanksgiving Day is Thursday, Nov. 26, 2026 (U.S. Office of Personnel Management, Federal Holidays).</p>
    ${FOOT}</section>`;
  return doc(fonts, LETTER, css, [page]);
}

function wordSearch(fonts: string): string {
  const { grid, placed } = buildGrid();
  const mark = new Set<string>();
  for (const p of placed) for (let i = 0; i < p.word.length; i++) mark.add(`${p.row + p.dr * i},${p.col + p.dc * i}`);
  const css = `${BASE_CSS}
  .ws .g{display:grid;grid-template-columns:repeat(${SIZE},40px);grid-auto-rows:40px;margin:6px auto 0;width:${SIZE * 40}px;border:2px solid #7c2d12}
  .ws .g span{display:flex;align-items:center;justify-content:center;font-family:Sora;font-weight:700;font-size:19px;color:#1e293b;border:1px solid #cbd5e1}
  .ws .g span.k{background:#7c2d12;color:#fff;border-color:#7c2d12}
  .ws .nm{display:flex;align-items:flex-end;gap:8px;font-size:12px;font-weight:700;margin-top:10px;color:#334155}
  .ws .nm s{width:260px;border-bottom:1.5px solid #334155;height:18px;text-decoration:none}
  .ws h2{font-family:Sora;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#9a3412;margin:14px 0 6px}
  .ws ul.wl{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:8px 12px}
  .ws ul.wl li{display:flex;align-items:center;gap:7px;font-family:Sora;font-weight:700;font-size:12px;color:#1e293b}
  .ws ul.wl i{width:13px;height:13px;border:1.5px solid #334155;border-radius:3px;display:inline-block}
  .ws .pos{font-size:11px;line-height:1.7;margin:0;padding:0;list-style:none;columns:2;column-gap:20px;color:#1e293b}
  .ws .pos b{font-family:Sora}`;
  const cells = (key: boolean) => grid.map((row, r) => row.map((ch, c) => `<span${key && mark.has(`${r},${c}`) ? ' class="k"' : ""}>${ch}</span>`).join("")).join("");
  const sorted = [...WORDS].sort();
  const p1 = `<section class="page tp ws"><header><h1>Thanksgiving Word Search 2026</h1><p class="sub">Find all 12 words. They run across, down or diagonally down to the right. ${DATE_LINE}</p></header>
    <div class="nm">Name <s></s></div>
    <div class="g">${cells(false)}</div>
    <h2>Find these 12 words</h2>
    <ul class="wl">${sorted.map((w) => `<li><i></i>${w}</li>`).join("")}</ul>
    <p class="note">The words come from the story: Minnesota, Lincoln, the National Archives and the Thursday date. Answer key on page 2.</p>
    ${FOOT}</section>`;
  const p2 = `<section class="page tp ws"><header><h1>Thanksgiving Word Search 2026: Answer Key</h1><p class="sub">Each word is in the grid once. Dark squares mark the letters of all 12 words.</p></header>
    <div class="g">${cells(true)}</div>
    <h2>Where each word starts</h2>
    <ul class="pos">${sorted.map((w) => { const p = placed.find((x) => x.word === w)!; return `<li><b>${w}</b>: row ${p.row + 1}, column ${p.col + 1}, ${dirName(p)}</li>`; }).join("")}</ul>
    ${FOOT}</section>`;
  return doc(fonts, LETTER, css, [p1, p2]);
}

export async function buildThanksgivingPrintablesDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("thanksgiving-printables-2026", [
    { slug: "thanksgiving-place-cards-2026", size: LETTER, html: placeCards(fonts) },
    { slug: "thanksgiving-gratitude-cards-2026", size: LETTER, html: gratitudeCards(fonts) },
    { slug: "thanksgiving-word-search-2026", size: LETTER, html: wordSearch(fonts) },
  ]);
}
