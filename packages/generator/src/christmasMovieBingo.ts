/**
 * Christmas movie bingo for /news/ (christmas-movie-bingo-2026-printable-cards).
 * Two US Letter PDFs: six different 5x5 cards (one per page, centre FREE square) and one caller
 * sheet that lists all 36 squares with a number and a "called" box. Each card is a seeded shuffle
 * of 24 of the 36 squares (a fixed seed per card, so the files are byte-stable) and the code
 * refuses to print two identical cards. Squares are plot moments in our own words: no film,
 * channel, studio or character is named. No kit draws a bingo grid set with a caller sheet, so
 * this story owns its generator.
 * Usage: pnpm fc news-christmas-movie-bingo
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "christmas-movie-bingo-2026-printable-cards";
const FOOT = `<div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div>`;
const NOTE = "Source: Fresh Calendars, original squares written for this sheet. No film, channel or studio is named.";

/** The 36 squares. The caller sheet shows them in this order, numbered 1 to 36. */
export const SQUARES = [
  "Snow starts falling during a kiss",
  "Big-city career woman returns to her hometown",
  "Hot cocoa with marshmallows",
  "Bakery or tree farm needs saving",
  "Someone wears a matching Christmas sweater",
  "Ugly sweater contest",
  "Gingerbread house contest",
  "A town festival is in danger",
  'A character says "the true meaning of Christmas"',
  "Ice skating scene",
  "Handsome single carpenter or contractor",
  "A big misunderstanding splits the couple",
  "Characters string lights on a tree or house",
  "Cookie baking with flour on someone's face",
  "Town tree lighting ceremony",
  "Snowball fight",
  "Mistletoe moment",
  "Best friend gives romantic advice",
  "Work call interrupts a date",
  "Local business owner refuses to sell",
  "Horse-drawn sleigh or carriage ride",
  "A child plays matchmaker",
  "Dog or cat steals a scene",
  "Christmas market or craft fair",
  "Wrapped gift mix-up",
  "Santa appears, real or in costume",
  "Caroling in the town square",
  "Scarf and mittens walking montage",
  "Family recipe passed down",
  "Snowed in or road blocked",
  "Parent asks when you are coming home",
  "Talk by the fireplace",
  "Last-minute dash to a Christmas Eve event",
  "Proposal or engagement at the end",
  "Ex shows up unexpectedly",
  "Job offer in the big city",
];

export const CARD_COUNT = 6;
const BASE_SEED = 1215;

/** Small seeded generator (mulberry32) so every card is the same on every run. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Card n (1-based): 24 squares by index in reading order; the centre is index -1 (FREE). */
export function card(n: number): number[] {
  const rand = rng(BASE_SEED + n * 101);
  const idx = SQUARES.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const cells = idx.slice(0, 24);
  cells.splice(12, 0, -1);
  return cells;
}

export function allCards(): number[][] {
  const cards = Array.from({ length: CARD_COUNT }, (_, i) => card(i + 1));
  const keys = new Set(cards.map((c) => c.join(",")));
  if (keys.size !== cards.length) throw new Error("two bingo cards are identical");
  return cards;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const CSS = `
  .bg{padding:36px 36px 0;color:#1f2937}
  .bg header{border-bottom:4px solid #9b1c1c;padding-bottom:8px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
  .bg h1{font-family:Sora;font-weight:800;font-size:27px;line-height:1.1;margin:0;color:#7f1d1d}
  .bg .cn{font-family:Sora;font-weight:700;font-size:15px;color:#14532d;white-space:nowrap}
  .bg .who{display:flex;align-items:flex-end;gap:8px;margin-top:12px;font-size:13px;font-weight:700;color:#14532d}
  .bg .who s{flex:1;border-bottom:1.5px solid #334155;height:17px;text-decoration:none}
  .bg table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:12px}
  .bg th{font-family:Sora;font-weight:800;font-size:25px;color:#fff;background:#14532d;padding:6px 0;border:2px solid #14532d;text-align:center}
  .bg td{height:131px;border:2px solid #14532d;padding:20px 7px 6px;text-align:center;vertical-align:middle;position:relative;font-family:Manrope;font-weight:700;font-size:14.5px;line-height:1.25;color:#1f2937;background:#fff}
  .bg td i{position:absolute;top:4px;left:6px;font-style:normal;font-family:Sora;font-weight:700;font-size:10px;color:#475569}
  .bg td.fr{background:#7f1d1d;color:#fff;font-family:Sora;font-weight:800;font-size:25px}
  .bg td.fr i{color:#fff}
  .bg .how{margin-top:12px;border:1.5px solid #9b1c1c;border-radius:8px;padding:7px 12px;font-size:11.5px;line-height:1.45;color:#1f2937}
  .bg .how b{font-family:Sora;color:#7f1d1d}
  .bg .note{margin-top:7px;font-size:9.5px;line-height:1.4;color:#475569}
  .bg .cl{list-style:none;margin:12px 0 0;padding:0;columns:2;column-gap:26px}
  .bg .cl li{break-inside:avoid;display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #94a3b8;font-size:14.5px;line-height:1.25;font-weight:600}
  .bg .cl li b{font-family:Sora;font-weight:800;color:#7f1d1d;width:24px;flex:none;text-align:right}
  .bg .cl li span{flex:1}
  .bg .cl li u{flex:none;width:15px;height:15px;border:2px solid #14532d;border-radius:3px;text-decoration:none}
  .bg .lead{font-size:13px;line-height:1.5;margin:10px 0 0}`;

function cardPage(n: number, cells: number[]): string {
  const rows = [0, 1, 2, 3, 4].map((r) => {
    const tds = [0, 1, 2, 3, 4].map((c) => {
      const v = cells[r * 5 + c];
      return v < 0 ? `<td class="fr">FREE</td>` : `<td><i>${v + 1}</i>${esc(SQUARES[v])}</td>`;
    });
    return `<tr>${tds.join("")}</tr>`;
  });
  return `<section class="page bg"><header><h1>Christmas Movie Bingo 2026</h1><div class="cn">Card ${n} of ${CARD_COUNT}</div></header>
  <div class="who">Player <s></s></div>
  <table><colgroup>${"<col>".repeat(5)}</colgroup><thead><tr>${[..."BINGO"].map((l) => `<th>${l}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>
  <div class="how"><b>How to play:</b> watch a holiday movie and mark a square when its moment happens on screen. Five marked squares in a row, a column or a diagonal win. Four corners and blackout (every square) are two longer games. The small number in each square matches the caller sheet.</div>
  <p class="note">${NOTE}</p>${FOOT}</section>`;
}

function callerPage(): string {
  const items = SQUARES.map((s, i) => `<li><b>${i + 1}</b><span>${esc(s)}</span><u></u></li>`).join("");
  return `<section class="page bg"><header><h1>Christmas Movie Bingo 2026: Caller Sheet</h1></header>
  <p class="lead">One person keeps this sheet and ticks a box when that moment happens on screen, then calls it out. The number matches the small number in the corner of each card square. All 36 squares are here; each card uses 24 of them plus the FREE square.</p>
  <ul class="cl">${items}</ul>
  <p class="note">${NOTE}</p>${FOOT}</section>`;
}

export async function buildChristmasMovieBingoDownloads(): Promise<void> {
  const fonts = await fontFaces();
  const cards = allCards();
  await renderPrintables("christmas-movie-bingo-2026", [
    { slug: "christmas-movie-bingo-2026-6-cards", size: LETTER, html: doc(fonts, LETTER, CSS, cards.map((c, i) => cardPage(i + 1, c))) },
    { slug: "christmas-movie-bingo-2026-caller-sheet", size: LETTER, html: doc(fonts, LETTER, CSS, [callerPage()]) },
  ]);
}
