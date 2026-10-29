/**
 * Heroes and printables for two /news/ stories: "October 22, 2026: this day in history"
 * and "Mole Day 2026". Events come from the sources listed in the story; mole problems use IUPAC
 * standard atomic weights and the exact Avogadro constant (BIPM). Original art, no logos.
 * Usage: pnpm fc news-oct22
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";
import { ROOT } from "./paths.js";

const W = 1200, H = 675;
const SH = `<filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter>`;
const frame = (fonts: string, bg: string, svg: string, text: string) => `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;background:${bg};font-family:Manrope,sans-serif;position:relative}
.t{position:absolute;left:64px;top:118px;width:520px;font-family:Sora;font-weight:800;color:#fff;line-height:1.02;letter-spacing:-.01em;font-size:62px}
.k{position:absolute;left:64px;top:84px;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:#fde68a}
.card{position:absolute;left:64px;width:450px;border-radius:18px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.28);padding:18px 22px;color:#0f172a}
.card b{display:block;font-family:Sora;font-size:30px;line-height:1.05;margin:2px 0}.card span{font-size:15px;color:#475569;font-weight:700}
.brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.78)}
</style></head><body><svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs>${SH}</defs>${svg}</svg>${text}<div class="brand">freshcalendars.com/news</div></body></html>`;

/** [year, short label] for the hero timeline and the printable. */
export const OCT22: [number, string, string][] = [
  [1797, "First recorded parachute jump", "André-Jacques Garnerin drops from a balloon over Paris with a silk parachute."],
  [1836, "Sam Houston takes office in Texas", "Inaugurated as the first elected president of the Republic of Texas."],
  [1883, "Metropolitan Opera House opens", "Opening night in New York City with Gounod's \"Faust.\""],
  [1938, "First xerographic copy", "Chester Carlson and Otto Kornei print \"10-22-38 ASTORIA\" in Queens."],
  [1962, "JFK's Cuban missile crisis address", "Kennedy reveals Soviet missile sites in Cuba and a naval quarantine."],
  [1975, "First photo from the surface of Venus", "The Soviet lander Venera 9 returns the first image from another planet's surface."],
  [1981, "Air traffic controllers' union decertified", "Federal authorities decertify PATCO after its August strike."],
  [2014, "Attack on Parliament Hill, Ottawa", "Cpl. Nathan Cirillo is killed at the National War Memorial."],
];

function historyHero(fonts: string): string {
  const pts = OCT22.map(([y], i) => [690 + i * 62, 470 - (i % 2) * 70, y] as const);
  const line = `<path d="M670 440 H1170" stroke="#fde68a" stroke-width="4"/>` + pts.map(([x, y, yr], i) => `<line x1="${x}" y1="440" x2="${x}" y2="${y}" stroke="#fde68a" stroke-width="2" opacity=".7"/><circle cx="${x}" cy="440" r="8" fill="#fde68a"/><g filter="url(#sh)"><rect x="${x - 30}" y="${y - (i % 2 ? 30 : 0)}" width="60" height="28" rx="8" fill="#fff"/><text x="${x}" y="${y - (i % 2 ? 30 : 0) + 19}" font-family="Sora" font-size="14" font-weight="800" fill="#7c2d12" text-anchor="middle">${yr}</text></g>`).join("");
  const cal = `<g transform="translate(830,90) rotate(4)" filter="url(#sh)"><rect width="220" height="230" rx="16" fill="#fff"/><rect width="220" height="58" rx="16" fill="#b45309"/><rect y="42" width="220" height="16" fill="#b45309"/><text x="110" y="40" font-family="Sora" font-size="22" font-weight="800" fill="#fff" text-anchor="middle">OCTOBER</text><text x="110" y="166" font-family="Sora" font-size="104" font-weight="800" fill="#3b1d0a" text-anchor="middle">22</text><text x="110" y="208" font-family="Sora" font-size="20" font-weight="800" fill="#b45309" text-anchor="middle">THURSDAY</text></g>`;
  const svg = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b1d0a"/><stop offset="1" stop-color="#7c2d12"/></linearGradient><rect width="${W}" height="${H}" fill="url(#g)"/>${cal}${line}`;
  return frame(fonts, "#3b1d0a", svg, `<div class="k">This day in history · Oct. 22</div><div class="t">What happened on October 22</div>
    <div class="card" style="top:430px"><span>Thursday, Oct. 22, 2026</span><b>Day 295 of 365</b><span>From 1797 to 2014: eight firsts and turning points</span></div>`);
}

function moleHero(fonts: string): string {
  const atom = (x: number, y: number, r: number, c: string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .3}" fill="#fff" opacity=".35"/>`;
  const mol = `<g filter="url(#sh)"><line x1="960" y1="420" x2="880" y2="500" stroke="#e2e8f0" stroke-width="14"/><line x1="960" y1="420" x2="1060" y2="490" stroke="#e2e8f0" stroke-width="14"/>${atom(960, 420, 62, "#ef4444")}${atom(880, 505, 40, "#f8fafc")}${atom(1065, 495, 40, "#f8fafc")}</g>`;
  const clock = `<g transform="translate(760,190)" filter="url(#sh)"><circle r="96" fill="#fff"/><circle r="86" fill="none" stroke="#14532d" stroke-width="6"/>${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<line x1="${Math.sin(a) * 70}" y1="${-Math.cos(a) * 70}" x2="${Math.sin(a) * 80}" y2="${-Math.cos(a) * 80}" stroke="#14532d" stroke-width="4"/>`; }).join("")}<line x1="0" y1="0" x2="${Math.sin((6.033 / 12) * 2 * Math.PI) * 48}" y2="${-Math.cos((6.033 / 12) * 2 * Math.PI) * 48}" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/><line x1="0" y1="0" x2="${Math.sin((2 / 60) * 2 * Math.PI) * 70}" y2="${-Math.cos((2 / 60) * 2 * Math.PI) * 70}" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/><circle r="7" fill="#16a34a"/></g>`;
  const cal = `<g transform="translate(960,90) rotate(5)" filter="url(#sh)"><rect width="180" height="190" rx="16" fill="#fff"/><rect width="180" height="50" rx="16" fill="#16a34a"/><rect y="36" width="180" height="14" fill="#16a34a"/><text x="90" y="35" font-family="Sora" font-size="19" font-weight="800" fill="#fff" text-anchor="middle">OCTOBER</text><text x="90" y="140" font-family="Sora" font-size="86" font-weight="800" fill="#14532d" text-anchor="middle">23</text><text x="90" y="174" font-family="Sora" font-size="17" font-weight="800" fill="#16a34a" text-anchor="middle">FRIDAY</text></g>`;
  const num = `<text x="700" y="620" font-family="Sora" font-size="54" font-weight="800" fill="#bbf7d0">6.02 × 10<tspan dy="-24" font-size="32">23</tspan></text>`;
  const svg = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#052e16"/><stop offset="1" stop-color="#14532d"/></linearGradient><rect width="${W}" height="${H}" fill="url(#g)"/>${clock}${cal}${mol}${num}`;
  return frame(fonts, "#052e16", svg, `<div class="k">Mole Day · Oct. 23, 2026</div><div class="t">6:02 a.m. to 6:02 p.m.</div>
    <div class="card" style="top:400px"><span>Friday, Oct. 23</span><b>Avogadro's number</b><span>Exactly 6.022 140 76 × 10²³ per mole</span></div>`);
}

function timelineSheet(fonts: string): string {
  const rows = OCT22.map(([y, t, d]) => `<li><b>${y}</b><div><h3>${t}</h3><p>${d}</p></div><span>${2026 - y} years ago</span></li>`).join("");
  const css = `
  .tl{padding:30px 40px 0}
  .tl h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:#7c2d12;line-height:1.05}
  .tl .sub{margin:5px 0 16px;font-size:11.5px;color:#37474f}
  .tl ol{list-style:none;margin:0;padding:0 0 0 18px;border-left:3px solid #f59e0b}
  .tl li{position:relative;display:grid;grid-template-columns:62px 1fr 90px;gap:12px;align-items:start;padding:9px 0 9px 14px;border-bottom:1px solid #fde68a}
  .tl li::before{content:"";position:absolute;left:-27px;top:15px;width:14px;height:14px;border-radius:50%;background:#f59e0b;border:3px solid #fff;box-shadow:0 0 0 2px #f59e0b}
  .tl li b{font-family:Sora;font-size:18px;color:#7c2d12}
  .tl h3{font-family:Sora;font-size:13px;margin:0 0 3px;color:#1f2937}
  .tl p{margin:0;font-size:10.8px;color:#374151;line-height:1.45}
  .tl li span{font-size:10px;font-weight:800;color:#b45309;text-align:right;padding-top:4px}
  .tl .notes{margin-top:16px;border:1.6px solid #fde68a;border-radius:10px;padding:10px 14px;height:150px}
  .tl .notes b{font-family:Sora;font-size:13px;color:#7c2d12}
  .tl .notes i{display:block;border-bottom:1px solid #fde68a;height:28px}
  .tl .note{margin-top:10px;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page tl"><h1>On This Day: October 22</h1>
    <p class="sub">Eight events on Oct. 22, from 1797 to 2014 · years ago counted from Oct. 22, 2026 · for classrooms and history buffs</p>
    <ol>${rows}</ol>
    <div class="notes"><b>Which event would you research further, and why?</b><i></i><i></i><i></i><i></i></div>
    <p class="note">Sources: Texas State Historical Association; American Presidency Project (UC Santa Barbara); The Henry Ford; American Physical Society; NASA; Guinness World Records; EBSCO Research Starters; The Canadian Encyclopedia.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/october-22-2026-this-day-in-history-observances/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

function moleSheet(fonts: string): string {
  const probs = ["How many water molecules (H<sub>2</sub>O) are in 18.015 grams of water?", "How many moles are in 44.009 grams of carbon dioxide (CO<sub>2</sub>)?", "How many atoms are in 2 moles of helium?", "What is the mass of 0.5 mole of sodium chloride (NaCl)?"];
  const css = `
  .md{padding:30px 40px 0}
  .md h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:#14532d;line-height:1.05}
  .md .sub{margin:5px 0 14px;font-size:11.5px;color:#37474f}
  .md .box{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
  .md .box div{background:#f0fdf4;border:1.6px solid #bbf7d0;border-radius:10px;padding:10px 14px;font-size:11px;color:#14532d;line-height:1.5}
  .md .box b{display:block;font-family:Sora;font-size:17px;color:#052e16;margin-bottom:2px}
  .md .aw{font-size:10.5px;color:#374151;margin:0 0 10px}
  .md .p{border:1.6px solid #d1fae5;border-radius:10px;padding:10px 14px;margin-bottom:10px;height:128px}
  .md .p h3{font-family:Sora;font-size:12.5px;margin:0;color:#14532d}
  .md .key{margin-top:16px;border-top:2px dashed #86efac;padding-top:8px;font-size:10px;color:#374151;line-height:1.6}
  .md .key b{font-family:Sora;color:#14532d}
  .md .note{margin-top:8px;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page md"><h1>Mole Day 2026 Practice Sheet</h1>
    <p class="sub">Friday, Oct. 23, 2026 · celebrate from 6:02 a.m. to 6:02 p.m.</p>
    <div class="box"><div><b>N<sub>A</sub> = 6.022 140 76 × 10<sup>23</sup> mol<sup>−1</sup></b>The Avogadro constant, exact since the 2019 revision of the International System of Units (SI).</div><div><b>1 mole</b>contains exactly 6.022 140 76 × 10<sup>23</sup> entities: atoms, molecules, ions or electrons.</div></div>
    <p class="aw"><b>Atomic weights (IUPAC):</b> H 1.008 · He 4.0026 · C 12.011 · O 15.999 · Na 22.990 · Cl 35.45</p>
    ${probs.map((q, i) => `<div class="p"><h3>${i + 1}. ${q}</h3></div>`).join("")}
    <div class="key"><b>Answer key (fold under):</b> 1. 1 mole = 6.022 × 10<sup>23</sup> molecules (molar mass of water 2 × 1.008 + 15.999 = 18.015 g/mol). 2. 1.000 mole (12.011 + 2 × 15.999 = 44.009 g/mol). 3. 2 × 6.022 × 10<sup>23</sup> = 1.204 × 10<sup>24</sup> atoms. 4. 0.5 × (22.990 + 35.45) = 0.5 × 58.44 = 29.22 g.</div>
    <p class="note">Sources: International Bureau of Weights and Measures (BIPM), SI base unit mole; NIST CODATA; IUPAC Commission on Isotopic Abundances and Atomic Weights; National Mole Day Foundation.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/mole-day-2026-october-23-6-02/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildOct22(): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [slug, draw] of [["october-22-2026-this-day-in-history-observances", historyHero], ["mole-day-2026-october-23-6-02", moleHero]] as const) {
      const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
      await page.setContent(draw(fonts), { waitUntil: "load" });
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
  await renderPrintables("oct22", [
    { slug: "october-22-this-day-in-history-timeline", size: LETTER, html: timelineSheet(fonts) },
    { slug: "mole-day-2026-practice-sheet", size: LETTER, html: moleSheet(fonts) },
  ]);
}
