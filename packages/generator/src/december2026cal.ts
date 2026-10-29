/**
 * December 2026 calendar printables for /news/december-2026-calendar-printable/ (16 Fresh Calendars templates)
 * and the story's hero, a fan of those sheets on a drawn winter-night background. Same method as january2027.ts:
 * HTML/SVG printed by Chromium (real text); the tree, holly, gifts, ornaments, menorah and moons are drawn here.
 *
 * Output: apps/news/public/downloads/december-2026-calendar/<slug>.{pdf,png,webp}
 *         apps/news/src/assets/news/december-2026-calendar/<slug>.png (download thumbnails)
 *         apps/news/src/assets/news/december-2026-calendar-printable/december-2026-calendar-printable.jpg (hero)
 * Usage:  pnpm fc news-december2026
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";
import { ROOT } from "./paths.js";
import { fontFaces, doc, LETTER, LETTER_LANDSCAPE } from "./julian.js";
import { renderPrintables, utc, DOW3, DOWFULL, type Printable } from "./printables.js";
import { weeksOf, isoWeek, iso, moon, flake, mini, dowLabels, GRID_CSS, MINI_CSS, type Cell, type Phase } from "./january2027.js";

const STORY = "december-2026-calendar-printable";
const GROUP = "december-2026-calendar";
const FOOT = `Free printable from Fresh Calendars · freshcalendars.com/news/${STORY}/`;
const Y = 2026, M = 11;

// ── Facts (same sources as the story) ───────────────────────────────────────
/** U.S. federal holidays, Office of Personnel Management: Christmas Day only (Christmas Eve is not one). */
const HOL: Record<string, string> = { "2026-12-25": "Christmas Day" };
/** Other dates printed on the holiday sheets (Chabad.org, USNO, 36 U.S.C. 129, official Kwanzaa site). */
const OBS: Record<string, string> = {
  "2026-12-04": "Hanukkah begins at sundown",
  "2026-12-07": "Pearl Harbor Remembrance Day",
  "2026-12-12": "Hanukkah ends at nightfall",
  "2026-12-21": "Winter solstice",
  "2026-12-24": "Christmas Eve",
  "2026-12-26": "Kwanzaa begins",
  "2026-12-31": "New Year's Eve",
};
/** Primary Moon phases, U.S. Naval Observatory, Eastern Standard Time (EST). */
const MOON: Record<string, { p: Phase; name: string; t: string }> = {
  "2026-12-01": { p: "lq", name: "Last Quarter", t: "1:08 a.m." },
  "2026-12-08": { p: "new", name: "New Moon", t: "7:52 p.m." },
  "2026-12-17": { p: "fq", name: "First Quarter", t: "12:42 a.m." },
  "2026-12-23": { p: "full", name: "Full Moon", t: "8:28 p.m." },
  "2026-12-30": { p: "lq", name: "Last Quarter", t: "1:59 p.m." },
};
/** Dated deadlines for the key-dates sheet (SSA, Medicare.gov, Congress, HealthCare.gov, USPS, NYSE, OPM). */
const KEY: { key: string; short: string; long: string; color: string }[] = [
  { key: "2026-12-01", short: "SSI", long: "Tue., Dec. 1: Supplemental Security Income (SSI) for December", color: "#6a1b9a" },
  { key: "2026-12-03", short: "Social Security", long: "Thu., Dec. 3: Social Security for people paid on the 3rd", color: "#0f766e" },
  { key: "2026-12-07", short: "Medicare ends", long: "Mon., Dec. 7: Medicare open enrollment ends", color: "#4338ca" },
  { key: "2026-12-09", short: "Social Security", long: "Wed., Dec. 9: Social Security for birthdays on the 1st to 10th; USPS international send-by date", color: "#0f766e" },
  { key: "2026-12-11", short: "Funding deadline", long: "Fri., Dec. 11: federal government funding expires unless Congress acts", color: "#7f1d1d" },
  { key: "2026-12-15", short: "ACA for Jan. 1", long: "Tue., Dec. 15: HealthCare.gov deadline for coverage that starts Jan. 1, 2027", color: "#1d4ed8" },
  { key: "2026-12-16", short: "Social Security", long: "Wed., Dec. 16: Social Security for birthdays on the 11th to 20th", color: "#0f766e" },
  { key: "2026-12-17", short: "USPS Ground", long: "Thu., Dec. 17: USPS Ground Advantage and First-Class Mail send-by date", color: "#c2410c" },
  { key: "2026-12-18", short: "USPS Priority", long: "Fri., Dec. 18: USPS Priority Mail send-by date", color: "#c2410c" },
  { key: "2026-12-19", short: "USPS Express", long: "Sat., Dec. 19: USPS Priority Mail Express send-by date", color: "#c2410c" },
  { key: "2026-12-23", short: "Social Security", long: "Wed., Dec. 23: Social Security for birthdays on the 21st to 31st", color: "#0f766e" },
  { key: "2026-12-24", short: "Stocks close 1 p.m.", long: "Thu., Dec. 24: Christmas Eve, not a federal holiday; New York Stock Exchange (NYSE) closes early", color: "#a16207" },
  { key: "2026-12-25", short: "Christmas Day", long: "Fri., Dec. 25: Christmas Day, federal holiday", color: "#b91c1c" },
  { key: "2026-12-31", short: "SSI for January", long: "Thu., Dec. 31: January SSI paid early, because Jan. 1 is New Year's Day", color: "#6a1b9a" },
];

// ── Drawn art ───────────────────────────────────────────────────────────────
/** Three-tier tree with a star and ornaments; outline mode for the coloring sheet. */
function tree(cx: number, base: number, h: number, o: { fill?: string; stroke?: string; w?: number; balls?: boolean } = {}): string {
  const f = o.fill ?? "#166534", s = o.stroke ?? "none", w = o.w ?? 0, u = h / 100;
  const tier = (top: number, bot: number, half: number) => `<path d="M${cx} ${base - top * u}L${cx + half * u} ${base - bot * u}L${cx - half * u} ${base - bot * u}Z" fill="${f}" stroke="${s}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const star = (x: number, y: number, r: number) => `<path d="${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; return `${i ? "L" : "M"}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`; }).join("")}Z" fill="${s === "none" ? "#facc15" : "#fff"}" stroke="${s}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const balls = o.balls === false ? "" : [[-14, 38, "#dc2626"], [12, 30, "#facc15"], [-20, 62, "#facc15"], [18, 58, "#dc2626"], [0, 50, "#3b82f6"], [-6, 22, "#dc2626"], [24, 80, "#3b82f6"], [-28, 84, "#dc2626"], [4, 76, "#facc15"]]
    .map(([x, y, c]) => `<circle cx="${cx + (x as number) * u}" cy="${base - (100 - (y as number)) * u}" r="${3.6 * u}" fill="${s === "none" ? c : "#fff"}" stroke="${s}" stroke-width="${w}"/>`).join("");
  return `<rect x="${cx - 7 * u}" y="${base - 10 * u}" width="${14 * u}" height="${10 * u}" fill="${s === "none" ? "#78350f" : "#fff"}" stroke="${s}" stroke-width="${w}"/>` +
    tier(92, 40, 26) + tier(78, 22, 34) + tier(56, 8, 42) + balls + star(cx, base - 94 * u, 9 * u);
}
/** Two holly leaves and three berries. */
function holly(cx: number, cy: number, s: number, rot: number, o: { stroke?: string; w?: number } = {}): string {
  const st = o.stroke ?? "none", w = o.w ?? 0;
  const leafD = "M0 0 Q12 -10 22 -4 Q20 -14 32 -16 Q32 -6 44 -4 Q38 6 48 14 Q30 14 22 22 Q18 10 0 0Z";
  const g = (r: number) => `<path d="${leafD}" transform="rotate(${r})" fill="${st === "none" ? "#15803d" : "#fff"}" stroke="${st}" stroke-width="${w}" stroke-linejoin="round"/>`;
  return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s / 50})">${g(-160)}${g(-20)}` +
    [[-5, 4], [5, 4], [0, -5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${st === "none" ? "#dc2626" : "#fff"}" stroke="${st}" stroke-width="${w}"/>`).join("") + `</g>`;
}
function gift(cx: number, cy: number, s: number, box: string, ribbon: string, o: { stroke?: string; w?: number } = {}): string {
  const st = o.stroke ?? "none", w = o.w ?? 0, h = s / 2;
  return `<g stroke="${st}" stroke-width="${w}" stroke-linejoin="round"><rect x="${cx - h}" y="${cy - h * 0.7}" width="${s}" height="${s * 0.85}" fill="${box}"/><rect x="${cx - h * 1.1}" y="${cy - h}" width="${s * 1.1}" height="${s * 0.3}" fill="${box}"/>
    <rect x="${cx - s * 0.08}" y="${cy - h}" width="${s * 0.16}" height="${s * 1.15}" fill="${ribbon}"/>
    <path d="M${cx} ${cy - h} Q${cx - s * 0.45} ${cy - s * 0.95} ${cx - s * 0.08} ${cy - h}Z M${cx} ${cy - h} Q${cx + s * 0.45} ${cy - s * 0.95} ${cx + s * 0.08} ${cy - h}Z" fill="${ribbon}"/></g>`;
}
function ornament(cx: number, cy: number, r: number, fill: string, o: { stroke?: string; w?: number } = {}): string {
  const st = o.stroke ?? "none", w = o.w ?? 0;
  return `<g stroke="${st}" stroke-width="${w}"><rect x="${cx - r * 0.3}" y="${cy - r * 1.25}" width="${r * 0.6}" height="${r * 0.35}" fill="${st === "none" ? "#d4af37" : "#fff"}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/><path d="M${cx - r * 0.92} ${cy - r * 0.2} Q${cx} ${cy + r * 0.25} ${cx + r * 0.92} ${cy - r * 0.2}" fill="none" stroke="${st === "none" ? "rgba(255,255,255,.7)" : st}" stroke-width="${st === "none" ? r * 0.12 : w}"/></g>`;
}
/** A nine-branch menorah; `lit` candles burn from the right, plus the taller center shamash. */
function menorah(cx: number, base: number, wdt: number, lit: number, color = "#1e3a8a"): string {
  const step = wdt / 8, top = base - wdt * 0.42;
  let d = `M${cx} ${base}L${cx} ${top}`, cand = "";
  for (let i = 0; i < 9; i++) {
    const x = cx - wdt / 2 + i * step, sham = i === 4, ty = sham ? top - step * 0.6 : top;
    if (!sham) d += `M${x} ${ty}Q${x} ${base - wdt * 0.12} ${cx} ${base - wdt * 0.1}`;
    const idx = i > 4 ? i - 1 : i;
    const isLit = sham || idx >= 8 - lit;
    cand += `<rect x="${x - step * 0.12}" y="${ty - step * 0.62}" width="${step * 0.24}" height="${step * 0.62}" fill="${isLit ? "#fde68a" : "#e5e7eb"}" stroke="${color}" stroke-width="1.2"/>` +
      (isLit ? `<path d="M${x} ${ty - step * 0.95}Q${x + step * 0.14} ${ty - step * 0.72} ${x} ${ty - step * 0.62}Q${x - step * 0.14} ${ty - step * 0.72} ${x} ${ty - step * 0.95}Z" fill="#f59e0b"/>` : "");
  }
  return `<path d="${d}" stroke="${color}" stroke-width="${Math.max(2, step * 0.12)}" fill="none" stroke-linecap="round"/><rect x="${cx - step}" y="${base - 3}" width="${step * 2}" height="6" rx="3" fill="${color}"/>${cand}`;
}

// ── Shared pieces ───────────────────────────────────────────────────────────
interface GridOpts { start: 0 | 1; names: string[]; cell: (c: Cell) => string; week?: boolean; cls?: string; y?: number; m?: number }
function grid(o: GridOpts): string {
  const rows = weeksOf(o.start, o.y ?? Y, o.m ?? M);
  const head = (o.week ? `<div class="dh wk">Week</div>` : "") +
    dowLabels(o.start, o.names).map((n, i) => { const dow = (i + o.start) % 7; return `<div class="dh${dow === 0 || dow === 6 ? " we" : ""}">${n}</div>`; }).join("");
  const body = rows.map((r) => (o.week ? `<div class="wk">${isoWeek(r[0])}</div>` : "") + r.map((c) =>
    `<div class="c${c.inMonth ? "" : " out"}${c.dow === 0 || c.dow === 6 ? " we" : ""}${HOL[c.key] ? " hol" : ""}">${o.cell(c)}</div>`).join("")).join("");
  return `<div class="grid${o.week ? " withwk" : ""} ${o.cls ?? ""}" style="--rows:${rows.length}">${head}${body}</div>`;
}
const tags = (c: Cell) => !c.inMonth ? "" : HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : OBS[c.key] ? `<span class="h o">${OBS[c.key]}</span>` : "";
const cellStd = (c: Cell) => `<span class="n">${c.d}</span>${tags(c)}`;
const holLine = `Federal holiday: Christmas Day, Fri., Dec. 25 (U.S. Office of Personnel Management); Christmas Eve is not one. Hanukkah: sundown Dec. 4 to nightfall Dec. 12. Winter solstice: Mon., Dec. 21. Kwanzaa: Dec. 26 to Jan. 1.`;
/** One color scheme per sheet family: ink, accent, holiday red, soft fill, line. */
const RED = { ink: "#7f1d1d", accent: "#15803d", soft: "#fef2f2", line: "#f1d0d0" };

// ── 1. With holidays (portrait, Sunday start) ───────────────────────────────
function withHolidays(f: string): string {
  const css = `${GRID_CSS}${MINI_CSS}
  .t1{padding:46px 44px 0}
  .t1 header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px}
  .t1 h1{margin:0;line-height:1}
  .t1 h1 .mo{display:block;white-space:nowrap;font-family:Sora;font-weight:800;font-size:52px;color:${RED.ink};letter-spacing:-.02em}
  .t1 h1 .k{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:${RED.accent};letter-spacing:.14em;text-transform:uppercase;margin-top:8px}
  .t1 .mini b{color:${RED.ink}}
  .t1 .minis{display:flex;gap:18px}
  .t1 .grid{height:780px;border:2px solid ${RED.ink};border-radius:10px;overflow:hidden}
  .t1 .dh{background:${RED.ink};color:#fff;font-size:12px;padding:8px 0;letter-spacing:.04em}
  .t1 .dh.we{background:#14532d}
  .t1 .c{border-right:1px solid ${RED.line};border-top:1px solid ${RED.line};padding:7px 8px}
  .t1 .c:nth-child(7n){border-right:0}
  .t1 .n{font-size:22px;color:#3b0d0d}
  .t1 .we .n{color:#14532d}
  .t1 .out .n{color:#b18080;font-size:15px}
  .t1 .hol{background:${RED.soft}}
  .t1 .hol .n,.t1 .h{color:#b91c1c}
  .t1 .h{font-size:11px;margin-top:6px}
  .t1 .h.o{color:#15803d;font-weight:700}
  .t1 .legend{margin-top:10px;font-size:10.5px;color:#44403c}`;
  return doc(f, LETTER, css, [`<section class="page t1">
    <header><h1><span class="mo">December 2026</span><span class="k">Calendar With Holidays</span></h1>
    <div class="minis">${mini(2026, 10, "November 2026")}${mini(2027, 0, "January 2027")}</div></header>
    ${grid({ start: 0, names: DOWFULL, cell: cellStd })}<p class="legend">${holLine}</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 2. Landscape, big boxes ─────────────────────────────────────────────────
function landscape(f: string): string {
  const css = `${GRID_CSS}
  .t2{padding:40px 40px 0}
  .t2 h1{margin:0 0 12px;font-family:Sora;font-weight:800;font-size:42px;color:#1c1917;letter-spacing:-.01em}
  .t2 h1 small{font-family:Manrope;font-weight:700;font-size:15px;color:#b91c1c;margin-left:12px;letter-spacing:.06em;text-transform:uppercase}
  .t2 .bar{height:6px;border-radius:3px;background:repeating-linear-gradient(90deg,#b91c1c 0 28px,#fff 28px 34px,#15803d 34px 62px,#fff 62px 68px);margin-bottom:12px}
  .t2 .grid{height:600px;gap:4px}
  .t2 .dh{font-size:12px;color:#15803d;padding:2px 0 6px;letter-spacing:.06em;text-transform:uppercase}
  .t2 .c{border:1.5px solid #d9c3c3;border-radius:8px;padding:7px 9px}
  .t2 .n{font-size:24px;color:#1c1917}
  .t2 .out{border-style:dashed;border-color:#eee2e2}
  .t2 .out .n{color:#b18080;font-size:15px}
  .t2 .hol{border-color:#b91c1c;background:#fff5f5}
  .t2 .hol .n,.t2 .h{color:#b91c1c}
  .t2 .h{font-size:11px;margin-top:6px}
  .t2 .h.o{color:#15803d}
  .t2 .legend{margin-top:10px;font-size:10.5px;color:#44403c}`;
  return doc(f, LETTER_LANDSCAPE, css, [`<section class="page t2">
    <h1>December 2026 Calendar <small>Landscape With Holidays</small></h1><div class="bar"></div>
    ${grid({ start: 0, names: DOWFULL, cell: cellStd })}<p class="legend">${holLine}</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 3. Monday start with ISO week numbers ───────────────────────────────────
function mondayWeeks(f: string): string {
  const css = `${GRID_CSS}
  .t3{padding:48px 44px 0}
  .t3 h1{margin:0;font-family:Sora;font-weight:800;font-size:40px;color:#1c1917;line-height:1.05}
  .t3 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:16px;color:#15803d;margin-top:8px;letter-spacing:.02em}
  .t3 .note{margin:12px 0 16px;padding:10px 14px;border-left:5px solid #15803d;background:#f0f7f1;font-size:12px;color:#14532d;border-radius:0 8px 8px 0}
  .t3 .grid{height:720px;border-top:3px solid #1c1917}
  .t3 .dh{font-size:12px;padding:10px 0;color:#1c1917;border-bottom:1px solid #1c1917}
  .t3 .dh.wk{color:#15803d}
  .t3 .wk:not(.dh){display:flex;align-items:flex-start;justify-content:center;padding-top:10px;font-family:Sora;font-weight:800;font-size:16px;color:#15803d;background:#f0f7f1;border-bottom:1px solid #cfe3d3}
  .t3 .c{border-left:1px solid #e2ddd8;border-bottom:1px solid #e2ddd8;padding:8px}
  .t3 .n{font-size:23px;color:#1c1917}
  .t3 .we{background:#fafaf9}
  .t3 .out .n{color:#9b8878;font-size:15px}
  .t3 .hol .n,.t3 .h{color:#b91c1c}
  .t3 .h{font-size:10.5px;margin-top:5px}
  .t3 .h.o{color:#15803d}
  .t3 .legend{margin-top:10px;font-size:10.5px;color:#44403c}`;
  return doc(f, LETTER, css, [`<section class="page t3">
    <h1>December 2026 Calendar<span>Monday Start With Week Numbers (ISO 8601)</span></h1>
    <p class="note"><b>December 2026 runs through ISO weeks 49 to 53.</b> 2026 is a 53-week year: week 53 runs Mon., Dec. 28 to Sun., Jan. 3, 2027. Starting on Monday, the month fits in five rows.</p>
    ${grid({ start: 1, names: DOWFULL, week: true, cell: cellStd })}<p class="legend">${holLine} Week numbers follow ISO 8601.</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 4. Blank (ink saver) ────────────────────────────────────────────────────
function blank(f: string): string {
  const css = `${GRID_CSS}
  .t4{padding:50px 40px 0}
  .t4 h1{margin:0 0 18px;text-align:center;font-family:Sora;font-weight:700;font-size:40px;color:#292524;letter-spacing:.16em;text-transform:uppercase}
  .t4 h1 span{display:block;font-family:Manrope;font-weight:500;font-size:13px;letter-spacing:.3em;color:#78716c;margin-top:8px}
  .t4 .grid{height:820px;border:1px solid #a8a29e}
  .t4 .dh{font-family:Manrope;font-weight:700;font-size:11px;color:#57534e;padding:8px 0;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #a8a29e}
  .t4 .c{border-right:1px solid #d6d3d1;border-bottom:1px solid #d6d3d1;padding:6px 8px;text-align:right}
  .t4 .c:nth-child(7n){border-right:0}
  .t4 .n{font-family:Manrope;font-weight:700;font-size:17px;color:#44403c}
  .t4 .out .n{color:#948c87}`;
  return doc(f, LETTER, css, [`<section class="page t4"><h1>December 2026<span>Blank Calendar</span></h1>${grid({ start: 0, names: DOW3, cell: (c) => `<span class="n">${c.d}</span>` })}<div class="foot">${FOOT}</div></section>`]);
}

// ── 5. Monthly planner with notes (landscape) ───────────────────────────────
function planner(f: string): string {
  const lines = (n: number) => Array.from({ length: n }, () => `<i></i>`).join("");
  const checks = (n: number) => Array.from({ length: n }, () => `<li><span></span></li>`).join("");
  const css = `${GRID_CSS}
  .t5{padding:38px 36px 0;display:grid;grid-template-columns:1fr 250px;grid-template-rows:auto 1fr;column-gap:22px}
  .t5 h1{grid-column:1/3;margin:0 0 12px;font-family:Sora;font-weight:800;font-size:34px;color:#14532d}
  .t5 h1 span{font-family:Manrope;font-weight:700;font-size:15px;color:#b91c1c;margin-left:12px;letter-spacing:.06em;text-transform:uppercase}
  .t5 .grid{height:640px;border:2px solid #14532d;border-radius:10px;overflow:hidden}
  .t5 .dh{background:#14532d;color:#fff;font-size:11px;padding:7px 0}
  .t5 .c{border-right:1px solid #d7e6da;border-top:1px solid #d7e6da;padding:6px 7px}
  .t5 .c:nth-child(7n){border-right:0}
  .t5 .n{font-size:18px;color:#14532d}
  .t5 .out .n{color:#6b9776;font-size:13px}
  .t5 .hol{background:#fef2f2}
  .t5 .hol .n,.t5 .h{color:#b91c1c}
  .t5 .h{font-size:10px;margin-top:4px}
  .t5 .h.o{color:#15803d}
  .t5 aside{height:640px;display:flex;flex-direction:column;gap:12px}
  .t5 .box{border:1.5px solid #bfd8c4;border-radius:10px;padding:10px 12px}
  .t5 .box b{display:block;font-family:Sora;font-size:12px;color:#14532d;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
  .t5 .box i{display:block;height:24px;border-bottom:1px solid #d7e6da}
  .t5 .box ul{list-style:none;margin:0;padding:0}
  .t5 .box li{height:26px;border-bottom:1px solid #d7e6da;display:flex;align-items:center}
  .t5 .box li span{width:13px;height:13px;border:1.5px solid #b91c1c;border-radius:3px}
  .t5 .grow{flex:1}`;
  return doc(f, LETTER_LANDSCAPE, css, [`<section class="page t5">
    <h1>December 2026 Monthly Planner <span>With Notes</span></h1>${grid({ start: 0, names: DOW3, cell: cellStd })}
    <aside><div class="box"><b>Goals for December</b>${lines(3)}</div>
    <div class="box"><b>Before the year ends</b><ul>${checks(5)}</ul></div>
    <div class="box grow"><b>Notes</b>${lines(7)}</div></aside>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 6. Christmas calendar ───────────────────────────────────────────────────
function christmas(f: string): string {
  const art = [tree(80, 200, 160), holly(235, 172, 34, -10), ornament(712, 52, 20, "#dc2626"), ornament(668, 120, 14, "#facc15"), gift(760, 172, 46, "#b91c1c", "#facc15"), holly(580, 172, 34, 20)].join("");
  const css = `${GRID_CSS}
  .t6{background:linear-gradient(180deg,#fdf3f3 0,#fff 230px)}
  .t6 .sky{position:absolute;left:0;top:0;width:816px;height:220px}
  .t6 .head{position:relative;padding:70px 44px 0;text-align:center}
  .t6 h1{margin:0;font-family:Sora;font-weight:800;font-size:56px;color:#991b1b;letter-spacing:-.01em;line-height:1}
  .t6 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:#15803d;letter-spacing:.22em;text-transform:uppercase;margin-top:12px}
  .t6 .grid{position:relative;margin:30px 40px 0;height:700px;gap:5px}
  .t6 .dh{font-size:12px;color:#fff;padding:6px 0;background:#15803d;border-radius:8px}
  .t6 .dh.we{background:#b91c1c}
  .t6 .c{border-radius:10px;background:#fffafa;border:1.5px solid #f1d0d0;padding:7px 9px}
  .t6 .n{font-size:21px;color:#7f1d1d}
  .t6 .out{background:transparent;border-color:transparent}
  .t6 .out .n{color:#bd7c7c;font-size:14px}
  .t6 .hol{background:#b91c1c;border-color:#b91c1c}
  .t6 .hol .n,.t6 .hol .h{color:#fff}
  .t6 .h{font-size:10.5px;margin-top:6px}
  .t6 .h.o{color:#15803d}
  .t6 .legend{margin:10px 40px 0;font-size:10.5px;color:#44403c;text-align:center}`;
  return doc(f, LETTER, css, [`<section class="page t6"><svg class="sky" viewBox="0 0 816 220" aria-hidden="true">${art}</svg>
    <div class="head"><h1>December 2026<span>Christmas Calendar</span></h1></div>${grid({ start: 0, names: DOW3, cell: cellStd })}
    <p class="legend">Christmas Day is Friday, Dec. 25, 2026, a federal holiday (U.S. Office of Personnel Management). Christmas Eve, Thu., Dec. 24, is not a federal holiday.</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 7. Christmas countdown (Dec. 1 to 25) ───────────────────────────────────
function countdown(f: string): string {
  const ideas = ["Hang the first decoration", "Write your gift list", "Make a paper snowflake", "Watch a holiday movie", "Bake cookies", "Write a card", "Donate a coat or a can", "Light up a window",
    "Mail cards abroad", "Make hot cocoa", "Sing a carol", "Read a winter story", "Look for the Geminids", "Thank a neighbor", "Wrap one gift", "Make a paper chain",
    "Mail Ground Advantage gifts", "Mail Priority Mail gifts", "Last Priority Mail Express day", "Drive past the lights", "Longest night: stay up for stars", "Call someone far away", "Full Moon tonight", "Christmas Eve", "Christmas Day"];
  const doors = Array.from({ length: 25 }, (_, i) => {
    const d = i + 1, dow = utc(2026, 11, d).getUTCDay(), left = 25 - d;
    return `<div class="dr${d === 25 ? " xm" : ""}"><b>${d}</b><small>${DOW3[dow]}</small><em>${ideas[i]}</em><span>${left === 0 ? "Merry Christmas" : `${left} ${left === 1 ? "day" : "days"} to go`}</span><i></i></div>`;
  }).join("");
  const art = [holly(30, 30, 26, -14), holly(786, 30, 26, 14)].join("");
  const css = `
  .t7{padding:40px 36px 0;background:#fff}
  .t7 .art{position:absolute;left:0;top:0;width:816px;height:120px}
  .t7 h1{position:relative;margin:0;text-align:center;white-space:nowrap;font-family:Sora;font-weight:800;font-size:27px;color:#991b1b}
  .t7 .sub{position:relative;margin:8px 0 18px;text-align:center;font-size:12px;color:#44403c}
  .t7 .doors{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
  .t7 .dr{position:relative;height:160px;border:2px solid #15803d;border-radius:12px;padding:8px 10px;background:#f7fbf8}
  .t7 .dr:nth-child(even){border-color:#b91c1c;background:#fff8f8}
  .t7 .dr b{font-family:Sora;font-size:30px;color:#14532d;line-height:1}
  .t7 .dr:nth-child(even) b{color:#991b1b}
  .t7 .dr small{margin-left:6px;font-weight:700;font-size:10px;color:#57534e;text-transform:uppercase}
  .t7 .dr em{display:block;margin-top:8px;font-style:normal;font-size:11px;font-weight:700;line-height:1.3;color:#1c1917;min-height:30px}
  .t7 .dr span{position:absolute;left:10px;bottom:9px;font-size:10px;font-weight:700;color:#15803d}
  .t7 .dr i{position:absolute;right:9px;bottom:8px;width:18px;height:18px;border:2px solid #57534e;border-radius:50%}
  .t7 .dr.xm{background:#b91c1c;border-color:#b91c1c}
  .t7 .dr.xm b,.t7 .dr.xm small,.t7 .dr.xm em,.t7 .dr.xm span{color:#fff}
  .t7 .dr.xm i{border-color:#fff}`;
  return doc(f, LETTER, css, [`<section class="page t7"><svg class="art" viewBox="0 0 816 120" aria-hidden="true">${art}</svg>
    <h1>December 2026 Christmas Countdown Calendar</h1>
    <p class="sub">Tick one circle a day from Tue., Dec. 1 to Christmas, Fri., Dec. 25. Days 17 to 19 are the U.S. Postal Service send-by dates; day 21 is the winter solstice.</p>
    <div class="doors">${doors}</div><div class="foot">${FOOT}</div></section>`]);
}

// ── 8. Winter night ─────────────────────────────────────────────────────────
function winterNight(f: string): string {
  let seed = 1221;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let stars = "";
  for (let i = 0; i < 70; i++) stars += `<circle cx="${(rnd() * 816).toFixed(0)}" cy="${(rnd() * 230).toFixed(0)}" r="${(0.8 + rnd() * 1.8).toFixed(1)}" fill="#fff" opacity="${(0.4 + rnd() * 0.6).toFixed(2)}"/>`;
  const art = stars + [flake(70, 70, 34, 6, "#bfdbfe", 3), flake(745, 80, 38, 12, "#bfdbfe", 3), flake(150, 175, 16, 0, "#93c5fd", 2), flake(680, 185, 18, 20, "#93c5fd", 2)].join("") +
    `<circle cx="700" cy="168" r="22" fill="#fef9c3"/><circle cx="710" cy="161" r="20" fill="#1a3478"/>`;
  const css = `${GRID_CSS}
  .t8 .sky{position:relative;height:240px;background:linear-gradient(180deg,#0b1730,#1e3a8a)}
  .t8 .sky svg{position:absolute;left:0;top:0;width:816px;height:240px}
  .t8 .head{position:relative;padding:76px 44px 0;text-align:center}
  .t8 h1{margin:0;font-family:Sora;font-weight:800;font-size:56px;color:#fff;letter-spacing:-.01em;line-height:1}
  .t8 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:#bfdbfe;letter-spacing:.22em;text-transform:uppercase;margin-top:12px}
  .t8 .grid{position:relative;margin:-34px 40px 0;height:680px;gap:5px}
  .t8 .dh{font-size:12px;color:#1e3a8a;padding:6px 0;background:#dbeafe;border-radius:8px}
  .t8 .c{border-radius:10px;background:#f5f8ff;border:1.5px solid #d6e2fb;padding:7px 9px}
  .t8 .n{font-size:21px;color:#1e3a8a}
  .t8 .out{background:transparent;border-color:transparent}
  .t8 .out .n{color:#688dd0;font-size:14px}
  .t8 .hol{border-color:#ef8a7a;background:#fff}
  .t8 .hol .n,.t8 .h{color:#b91c1c}
  .t8 .h{font-size:10.5px;margin-top:6px}
  .t8 .h.o{color:#1d4ed8}
  .t8 .legend{margin:10px 40px 0;font-size:10.5px;color:#44403c;text-align:center}`;
  // The heading sits inside .sky so the print check measures its contrast against the night, not the paper.
  return doc(f, LETTER, css, [`<section class="page t8"><div class="sky"><svg viewBox="0 0 816 240" aria-hidden="true">${art}</svg>
    <div class="head"><h1>December 2026<span>Winter Night Calendar</span></h1></div></div>${grid({ start: 0, names: DOW3, cell: cellStd })}
    <p class="legend">The winter solstice on Mon., Dec. 21 brings the longest night of the year in the Northern Hemisphere (U.S. Naval Observatory). ${holLine.split(". Hanukkah")[0]}.</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 9. Hanukkah calendar ────────────────────────────────────────────────────
function hanukkah(f: string): string {
  const nights = Array.from({ length: 8 }, (_, i) => {
    const d = 4 + i, dow = DOW3[utc(2026, 11, d).getUTCDay()];
    const when = i === 0 ? "Light before sundown (Shabbat)" : i === 1 ? "Light after Shabbat ends" : i === 7 ? "Light before sundown (Shabbat)" : "Light after nightfall";
    return `<div class="nt"><svg viewBox="0 0 160 90" aria-hidden="true">${menorah(80, 84, 132, i + 1)}</svg><b>Night ${i + 1}</b><span>${dow}., Dec. ${d}</span><em>${i + 1} ${i ? "candles" : "candle"} + shamash</em><small>${when}</small></div>`;
  }).join("");
  const cell = (c: Cell) => {
    const n = c.inMonth && c.d >= 4 && c.d <= 11 ? c.d - 3 : 0;
    return `<span class="n">${c.d}</span>${n ? `<span class="h o">Night ${n}</span>` : c.inMonth && c.d === 12 ? `<span class="h o">Hanukkah ends at nightfall</span>` : tags(c)}`;
  };
  const css = `${GRID_CSS}
  .t9{padding:42px 44px 0}
  .t9 h1{margin:0;text-align:center;font-family:Sora;font-weight:800;font-size:38px;color:#1e3a8a;line-height:1.05}
  .t9 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:#2563eb;letter-spacing:.14em;text-transform:uppercase;margin-top:8px}
  .t9 .nights{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0 16px}
  .t9 .nt{border:1.5px solid #bfdbfe;border-radius:12px;padding:6px 8px 8px;text-align:center;background:#f8fbff}
  .t9 .nt svg{display:block;width:100%;height:62px}
  .t9 .nt b{display:block;font-family:Sora;font-size:13px;color:#1e3a8a}
  .t9 .nt span{display:block;font-weight:700;font-size:11px;color:#1d4ed8}
  .t9 .nt em{display:block;font-style:normal;font-size:10px;color:#334155}
  .t9 .nt small{display:block;font-size:9px;color:#64748b}
  .t9 .grid{height:470px;border:2px solid #1e3a8a;border-radius:10px;overflow:hidden}
  .t9 .dh{background:#1e3a8a;color:#fff;font-size:11px;padding:6px 0}
  .t9 .c{border-right:1px solid #dbe4f3;border-top:1px solid #dbe4f3;padding:6px 7px}
  .t9 .c:nth-child(7n){border-right:0}
  .t9 .n{font-size:18px;color:#1e3a8a}
  .t9 .out .n{color:#6d8ec6;font-size:13px}
  .t9 .hol .n,.t9 .h{color:#b91c1c}
  .t9 .h{font-size:10px;margin-top:4px}
  .t9 .h.o{color:#1d4ed8;font-weight:800}
  .t9 .legend{margin-top:10px;font-size:10.5px;color:#334155}`;
  return doc(f, LETTER, css, [`<section class="page t9"><h1>December 2026 Hanukkah Calendar<span>Eight nights, sundown Fri., Dec. 4 to nightfall Sat., Dec. 12</span></h1>
    <div class="nights">${nights}</div>${grid({ start: 0, names: DOW3, cell })}
    <p class="legend">Dates from Chabad.org. Candles are added from right to left and lit from left to right, with the shamash (helper candle) lighting the others. Nights 1 and 8 fall on Friday, so those candles are lit before Shabbat begins.</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 10. Moon phases and sky ─────────────────────────────────────────────────
function moonPhases(f: string): string {
  const css = `${GRID_CSS}
  .t10{padding:46px 44px 0}
  .t10 h1{margin:0;font-family:Sora;font-weight:800;font-size:44px;color:#1e1b4b;line-height:1}
  .t10 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:#4338ca;margin-top:10px;letter-spacing:.1em;text-transform:uppercase}
  .t10 .keys{display:flex;gap:7px;margin:16px 0 14px}
  .t10 .keys div{flex:1;display:flex;gap:6px;align-items:center;border:1.5px solid #c7d2fe;border-radius:10px;padding:7px 7px;font-size:10px;color:#3730a3}
  .t10 .keys b{display:block;font-family:Sora;font-size:12px;color:#1e1b4b}
  .t10 .grid{height:720px;border:2px solid #1e1b4b;border-radius:10px;overflow:hidden}
  .t10 .dh{background:#1e1b4b;color:#fff;font-size:11px;padding:8px 0}
  .t10 .c{border-right:1px solid #dcdcf0;border-top:1px solid #dcdcf0;padding:7px 8px}
  .t10 .c:nth-child(7n){border-right:0}
  .t10 .n{font-size:21px;color:#1e1b4b}
  .t10 .out .n{color:#8787c7;font-size:14px}
  .t10 .mp{position:absolute;right:7px;bottom:7px;text-align:right;font-size:9.5px;font-weight:700;color:#3730a3;line-height:1.2}
  .t10 .mp svg{display:block;margin:0 0 3px auto}
  .t10 .sk{display:block;font-size:10px;font-weight:800;color:#7c3aed;margin-top:5px;line-height:1.15}
  .t10 .hol .n,.t10 .h{color:#b91c1c}
  .t10 .h{font-size:10.5px;margin-top:5px}
  .t10 .legend{margin-top:10px;font-size:10.5px;color:#44403c}`;
  const SKY: Record<string, string> = { "2026-12-13": "Geminids peak tonight", "2026-12-21": "Winter solstice 3:50 p.m.", "2026-12-22": "Ursids peak tonight" };
  const keys = Object.entries(MOON).map(([k, v]) => { const d = Number(k.slice(8)); return `<div>${moon(v.p, 26)}<span><b>${v.name}</b>${DOW3[utc(2026, 11, d).getUTCDay()]}., Dec. ${d}, ${v.t} EST</span></div>`; }).join("");
  const g = grid({ start: 0, names: DOW3, cell: (c) => {
    const mp = c.inMonth ? MOON[c.key] : undefined;
    return `<span class="n">${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}${c.inMonth && SKY[c.key] ? `<span class="sk">${SKY[c.key]}</span>` : ""}${mp ? `<span class="mp">${moon(mp.p, 40)}${mp.name}<br>${mp.t}</span>` : ""}`;
  } });
  return doc(f, LETTER, css, [`<section class="page t10"><h1>December 2026<span>Moon Phase and Sky Calendar</span></h1>
    <div class="keys">${keys}</div>${g}
    <p class="legend">Moon phases and the solstice in Eastern Standard Time (EST), from the U.S. Naval Observatory. Meteor shower peak nights from the American Meteor Society. The full moon on Dec. 23 is often called the Cold Moon.</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 11. Coloring calendar for kids ──────────────────────────────────────────
function coloring(f: string): string {
  const s = "#1c1917", o = { stroke: s, w: 3 };
  const art = [tree(90, 170, 150, { fill: "#fff", stroke: s, w: 3 }), gift(240, 120, 70, "#fff", "#fff", o), ornament(370, 100, 34, "#fff", o), holly(480, 80, 52, -10, o),
    gift(600, 130, 56, "#fff", "#fff", o), flake(680, 60, 30, 10, s, 3)].join("");
  const css = `${GRID_CSS}
  .t11{padding:40px 40px 0}
  .t11 .art{display:block;width:100%;height:150px}
  .t11 h1{margin:4px 0 14px;text-align:center;font-family:Sora;font-weight:800;font-size:50px;line-height:1;color:#fff;-webkit-text-stroke:2.5px ${s};letter-spacing:.02em}
  .t11 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:${s};-webkit-text-stroke:0;letter-spacing:.2em;text-transform:uppercase;margin-top:10px}
  .t11 .grid{height:660px;gap:6px}
  .t11 .dh{font-size:13px;color:${s};padding:4px 0}
  .t11 .c{border:2.5px solid ${s};border-radius:14px;display:flex;align-items:center;justify-content:center;flex-direction:column}
  .t11 .n{font-family:Sora;font-weight:800;font-size:46px;color:#fff;-webkit-text-stroke:2px ${s}}
  .t11 .out{border:2px dashed #a8a29e}
  .t11 .out .n{font-size:22px;-webkit-text-stroke:1.2px #948c87}
  .t11 .h{font-family:Manrope;font-size:9.5px;color:${s};text-align:center;margin-top:4px;padding:0 3px}
  .t11 .legend{margin-top:10px;font-size:11px;color:#44403c;text-align:center}`;
  const g = grid({ start: 0, names: DOW3, cell: (c) => `<span class="n">${c.d}</span>${c.inMonth && (HOL[c.key] || c.d === 24 || c.d === 31) ? `<span class="h">${HOL[c.key] ?? OBS[c.key]}</span>` : ""}` });
  return doc(f, LETTER, css, [`<section class="page t11"><svg class="art" viewBox="0 0 720 180" aria-hidden="true">${art}</svg><h1>December 2026<span>Coloring Calendar for Kids</span></h1>${g}
    <p class="legend">Color the tree, the presents, the ornament, the holly and every number. Christmas is Friday, Dec. 25.</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 12. Holiday planner ─────────────────────────────────────────────────────
function holidayPlanner(f: string): string {
  const rows = (n: number, cols: string[]) => `<table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}<th class="ck"></th></tr></thead><tbody>${Array.from({ length: n }, () => `<tr>${cols.map(() => "<td></td>").join("")}<td class="ck"><span></span></td></tr>`).join("")}</tbody></table>`;
  const css = `${GRID_CSS}
  .t12{padding:38px 40px 0}
  .t12 h1{margin:0;white-space:nowrap;font-family:Sora;font-weight:800;font-size:30px;color:#7f1d1d}
  .t12 h1 span{font-family:Manrope;font-weight:700;font-size:12px;color:#15803d;margin-left:10px;letter-spacing:.08em;text-transform:uppercase}
  .t12 .top{display:grid;grid-template-columns:1fr 230px;gap:16px;margin-top:12px}
  .t12 .grid{height:330px;border:2px solid #7f1d1d;border-radius:10px;overflow:hidden}
  .t12 .dh{background:#7f1d1d;color:#fff;font-size:10px;padding:5px 0}
  .t12 .c{border-right:1px solid #f1d0d0;border-top:1px solid #f1d0d0;padding:4px 6px}
  .t12 .c:nth-child(7n){border-right:0}
  .t12 .n{font-size:14px;color:#7f1d1d}
  .t12 .out .n{color:#bd7c7c;font-size:11px}
  .t12 .hol{background:#fef2f2}
  .t12 .h{font-size:8.5px;margin-top:2px;color:#b91c1c}
  .t12 .h.o{color:#15803d}
  .t12 .ship{border:2px solid #c2410c;border-radius:10px;padding:10px 12px;background:#fff7ed}
  .t12 .ship b{display:block;font-family:Sora;font-size:12px;color:#9a3412;margin-bottom:6px;letter-spacing:.04em;text-transform:uppercase}
  .t12 .ship p{margin:0 0 6px;font-size:11px;line-height:1.35;color:#1c1917}
  .t12 .ship small{font-size:9px;color:#57534e}
  .t12 .lists{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
  .t12 h2{margin:0 0 4px;font-family:Sora;font-size:13px;color:#14532d;letter-spacing:.06em;text-transform:uppercase}
  .t12 table{width:100%;border-collapse:collapse;font-size:10px}
  .t12 th{text-align:left;color:#57534e;font-weight:700;padding:2px 4px;border-bottom:1.5px solid #14532d}
  .t12 td{height:25px;border-bottom:1px solid #e7e5e4}
  .t12 .ck{width:22px}
  .t12 td.ck span{display:block;width:12px;height:12px;border:1.5px solid #b91c1c;border-radius:3px;margin:0 auto}`;
  return doc(f, LETTER, css, [`<section class="page t12"><h1>December 2026 Holiday Planner <span>Gifts, cards, food, events</span></h1>
    <div class="top">${grid({ start: 0, names: DOW3, cell: cellStd })}
    <div class="ship"><b>Mail by (lower 48 states)</b><p><b style="display:inline;color:#1c1917">Wed., Dec. 9</b> International mail</p><p><b style="display:inline;color:#1c1917">Thu., Dec. 17</b> Ground Advantage, First-Class Mail</p><p><b style="display:inline;color:#1c1917">Fri., Dec. 18</b> Priority Mail</p><p><b style="display:inline;color:#1c1917">Sat., Dec. 19</b> Priority Mail Express</p><small>U.S. Postal Service 2026 recommended dates; not guarantees.</small></div></div>
    <div class="lists"><div><h2>Gifts</h2>${rows(11, ["For", "Gift idea", "Budget"])}</div><div><h2>Cards to send</h2>${rows(11, ["Name", "Address checked"])}</div>
    <div><h2>Food and baking</h2>${rows(9, ["Dish or recipe", "Shopping"])}</div><div><h2>Events and parties</h2>${rows(9, ["Date", "Where", "Bring"])}</div></div>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 13. Key dates and deadlines ─────────────────────────────────────────────
function keyDates(f: string): string {
  const byKey = new Map(KEY.map((k, i) => [k.key, { ...k, n: i + 1 }]));
  const css = `${GRID_CSS}
  .t13{padding:40px 44px 0}
  .t13 h1{margin:0;font-family:Sora;font-weight:800;font-size:34px;color:#1c1917;line-height:1.1}
  .t13 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:#b91c1c;margin-top:4px;letter-spacing:.06em;text-transform:uppercase}
  .t13 .grid{margin-top:12px;height:420px;border:2px solid #1c1917;border-radius:10px;overflow:hidden}
  .t13 .dh{background:#1c1917;color:#fff;font-size:11px;padding:6px 0}
  .t13 .c{border-right:1px solid #e2ddd8;border-top:1px solid #e2ddd8;padding:5px 6px}
  .t13 .c:nth-child(7n){border-right:0}
  .t13 .n{font-size:16px;color:#1c1917}
  .t13 .out .n{color:#9b8878;font-size:12px}
  .t13 .k{display:flex;align-items:center;gap:3px;margin-top:5px;font-size:8.8px;font-weight:700;line-height:1.1}
  .t13 .k i,.t13 li i{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;color:#fff;font-style:normal;font-size:9px;font-family:Sora}
  .t13 ol{list-style:none;margin:10px 0 0;padding:0}
  .t13 li{display:flex;gap:8px;align-items:flex-start;font-size:10.8px;line-height:1.3;padding:3.2px 0;border-bottom:1px solid #ece7e2;color:#1c1917}
  .t13 .src{margin-top:6px;font-size:9px;color:#57534e;line-height:1.35}`;
  const g = grid({ start: 0, names: DOW3, cell: (c) => {
    const k = byKey.get(c.key);
    return `<span class="n">${c.d}</span>${k ? `<span class="k" style="color:${k.color}"><i style="background:${k.color}">${k.n}</i>${k.short}</span>` : ""}`;
  } });
  const list = KEY.map((k, i) => `<li><i style="background:${k.color}">${i + 1}</i><span>${k.long}</span></li>`).join("");
  return doc(f, LETTER, css, [`<section class="page t13"><h1>December 2026 Calendar<span>Key Dates and Deadlines</span></h1>${g}<ol>${list}</ol>
    <p class="src">Source: Social Security Administration, Schedule of Social Security Benefit Payments 2026; Medicare.gov; HealthCare.gov; Public Law (H.R. 6500) funding through Dec. 11; U.S. Postal Service 2026 holiday dates (recommendations, not guarantees); New York Stock Exchange; U.S. Office of Personnel Management.</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 14. Daily list ──────────────────────────────────────────────────────────
function dailyList(f: string): string {
  const rows = Array.from({ length: 31 }, (_, i) => {
    const dt = utc(2026, 11, i + 1), dow = dt.getUTCDay(), key = iso(dt);
    const tag = HOL[key] ?? OBS[key] ?? (MOON[key] ? MOON[key].name : "");
    return `<div class="r${dow === 0 || dow === 6 ? " we" : ""}${HOL[key] ? " hol" : ""}${dow === 6 ? " sat" : ""}"><span class="d">${i + 1}</span><span class="w">${DOW3[dow]}</span><span class="t">${tag}</span><span class="l"></span></div>`;
  }).join("");
  const css = `
  .t14{padding:42px 48px 0}
  .t14 h1{margin:0 0 4px;font-family:Sora;font-weight:800;font-size:36px;color:#14532d}
  .t14 .sub{margin:0 0 12px;font-size:11.5px;color:#44403c}
  .t14 .r{display:grid;grid-template-columns:40px 46px 210px 1fr;align-items:end;height:26px;border-bottom:1px solid #d7e6da;font-size:12px}
  .t14 .r.sat{border-bottom:1.5px solid #15803d}
  .t14 .d{font-family:Sora;font-weight:800;font-size:16px;color:#14532d}
  .t14 .w{font-weight:700;color:#15803d;text-transform:uppercase;font-size:11px;letter-spacing:.06em}
  .t14 .we{background:#f5faf6}
  .t14 .t{font-weight:700;color:#166534;font-size:11px}
  .t14 .hol .t,.t14 .hol .d{color:#b91c1c}`;
  return doc(f, LETTER, css, [`<section class="page t14"><h1>December 2026 Daily Calendar List</h1>
    <p class="sub">All 31 days of December 2026 with weekdays, holidays and Moon phases already filled in. Weeks run Sunday to Saturday; a line under each Saturday marks the end of a week.</p>
    ${rows}<div class="foot">${FOOT}</div></section>`]);
}

// ── 15. Three months: November 2026, December 2026, January 2027 ─────────────
function threeMonth(f: string): string {
  const big = (y: number, m: number) => `<div class="mg">${DOW3.map((d) => `<i>${d}</i>`).join("")}${weeksOf(0, y, m).flat().map((c) => `<span class="${c.dow === 0 || c.dow === 6 ? "we" : ""}">${c.inMonth ? c.d : ""}</span>`).join("")}</div>`;
  const css = `${GRID_CSS}
  .t15{padding:44px 44px 0}
  .t15 h1{margin:0;font-family:Sora;font-weight:800;font-size:42px;color:#7f1d1d;line-height:1}
  .t15 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:#15803d;margin-top:8px;letter-spacing:.06em;text-transform:uppercase}
  .t15 .grid{margin-top:16px;height:560px;border:2px solid #7f1d1d;border-radius:10px;overflow:hidden}
  .t15 .dh{background:#7f1d1d;color:#fff;font-size:11px;padding:7px 0}
  .t15 .c{border-right:1px solid #f1d0d0;border-top:1px solid #f1d0d0;padding:6px 8px}
  .t15 .c:nth-child(7n){border-right:0}
  .t15 .n{font-size:20px;color:#3b0d0d}
  .t15 .out .n{color:#b18080;font-size:13px}
  .t15 .hol .n,.t15 .h{color:#b91c1c}
  .t15 .h{font-size:10px;margin-top:5px}
  .t15 .h.o{color:#15803d}
  .t15 .side{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:22px}
  .t15 .side>div{border:1.5px solid #f1d0d0;border-radius:12px;padding:12px 16px}
  .t15 .side b{display:block;font-family:Sora;font-size:16px;color:#7f1d1d;margin-bottom:6px}
  .t15 .side .mg{display:grid;grid-template-columns:repeat(7,1fr);row-gap:4px;text-align:center;font-size:13px;font-weight:700;color:#292524}
  .t15 .side i{font-style:normal;font-size:10px;color:#78716c;text-transform:uppercase}
  .t15 .side .we{color:#15803d}
  .t15 .side small{display:block;margin-top:6px;font-size:10px;color:#57534e}`;
  return doc(f, LETTER, css, [`<section class="page t15"><h1>December 2026 Calendar<span>With November 2026 and January 2027</span></h1>${grid({ start: 0, names: DOW3, cell: cellStd })}
    <div class="side"><div><b>November 2026</b>${big(2026, 10)}<small>Veterans Day: Wed., Nov. 11 · Thanksgiving: Thu., Nov. 26</small></div>
    <div><b>January 2027</b>${big(2027, 0)}<small>New Year's Day: Fri., Jan. 1 · Martin Luther King Jr. Day: Mon., Jan. 18</small></div></div>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 16. Four mini calendars per page ────────────────────────────────────────
function fourUp(f: string): string {
  const one = `<div class="q"><h2>December 2026</h2><div class="mg">${DOW3.map((d) => `<i>${d}</i>`).join("")}${weeksOf(0, Y, M).flat().map((c) => `<span class="${c.dow === 0 || c.dow === 6 ? "we" : ""}${HOL[c.key] ? " hol" : ""}">${c.inMonth ? c.d : ""}</span>`).join("")}</div>
    <p>Christmas Day Fri., Dec. 25 · New Year's Eve Thu., Dec. 31</p></div>`;
  const css = `
  .t16{padding:44px 40px 0}
  .t16 h1{margin:0 0 4px;text-align:center;font-family:Sora;font-weight:800;font-size:28px;color:#7f1d1d}
  .t16 .sub{margin:0 0 16px;text-align:center;font-size:11.5px;color:#44403c}
  .t16 .wrap{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;height:860px;border:1px dashed #a8a29e}
  .t16 .q{padding:26px 30px;border:1px dashed #a8a29e}
  .t16 h2{margin:0 0 12px;font-family:Sora;font-size:24px;color:#7f1d1d;text-align:center}
  .t16 .mg{display:grid;grid-template-columns:repeat(7,1fr);row-gap:10px;text-align:center;font-family:Sora;font-weight:700;font-size:19px;color:#292524}
  .t16 i{font-style:normal;font-family:Manrope;font-size:10.5px;color:#78716c;text-transform:uppercase;letter-spacing:.06em}
  .t16 .we{color:#15803d}
  .t16 .hol{color:#fff;background:#b91c1c;border-radius:50%;width:34px;height:34px;line-height:34px;margin:-6px auto 0}
  .t16 p{margin:16px 0 0;text-align:center;font-size:11px;color:#57534e}`;
  return doc(f, LETTER, css, [`<section class="page t16"><h1>December 2026 Mini Calendars, 4 per Page</h1>
    <p class="sub">Cut along the dashed lines for a planner, a desk, a gift tag or a card. The red circle marks Christmas Day.</p>
    <div class="wrap">${one}${one}${one}${one}</div><div class="foot">${FOOT}</div></section>`]);
}

export const DECEMBER_2026_TEMPLATES: { slug: string; size: typeof LETTER; build: (f: string) => string }[] = [
  { slug: "december-2026-calendar-with-holidays", size: LETTER, build: withHolidays },
  { slug: "december-2026-calendar-landscape", size: LETTER_LANDSCAPE, build: landscape },
  { slug: "december-2026-calendar-monday-start-week-numbers", size: LETTER, build: mondayWeeks },
  { slug: "december-2026-blank-calendar", size: LETTER, build: blank },
  { slug: "december-2026-monthly-planner-with-notes", size: LETTER_LANDSCAPE, build: planner },
  { slug: "december-2026-christmas-calendar", size: LETTER, build: christmas },
  { slug: "december-2026-christmas-countdown-calendar", size: LETTER, build: countdown },
  { slug: "december-2026-winter-night-calendar", size: LETTER, build: winterNight },
  { slug: "december-2026-hanukkah-calendar", size: LETTER, build: hanukkah },
  { slug: "december-2026-moon-phase-calendar", size: LETTER, build: moonPhases },
  { slug: "december-2026-coloring-calendar-for-kids", size: LETTER, build: coloring },
  { slug: "december-2026-holiday-planner", size: LETTER, build: holidayPlanner },
  { slug: "december-2026-calendar-key-dates-deadlines", size: LETTER, build: keyDates },
  { slug: "december-2026-daily-calendar-list", size: LETTER, build: dailyList },
  { slug: "december-2026-calendar-november-2026-january-2027", size: LETTER, build: threeMonth },
  { slug: "december-2026-mini-calendars-4-per-page", size: LETTER, build: fourUp },
];

/** The hero: a fan of our own sheets in falling snow on a pine-green night, 2400×1350. */
async function buildHero(pub: string): Promise<void> {
  const W = 2400, H = 1350;
  const img = async (slug: string) => `data:image/png;base64,${(await fs.readFile(path.join(pub, `${slug}.png`))).toString("base64")}`;
  const sheets = [
    { slug: "december-2026-hanukkah-calendar", x: 1090, y: 250, w: 520, r: -11 },
    { slug: "december-2026-christmas-countdown-calendar", x: 1830, y: 230, w: 520, r: 10 },
    { slug: "december-2026-christmas-calendar", x: 1440, y: 150, w: 600, r: -2 },
  ];
  let paper = "";
  for (const s of sheets) paper += `<img src="${await img(s.slug)}" style="left:${s.x - s.w / 2}px;top:${s.y}px;width:${s.w}px;transform:rotate(${s.r}deg)">`;
  let seed = 1225;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let snow = "";
  for (let i = 0; i < 280; i++) snow += `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${(1.2 + rnd() * 4).toFixed(1)}" fill="#fff" opacity="${(0.3 + rnd() * 0.6).toFixed(2)}"/>`;
  for (let i = 0; i < 14; i++) snow += flake(rnd() * W, rnd() * H * 0.8, 14 + rnd() * 30, rnd() * 60, "rgba(255,255,255,.35)", 2.5);
  const ground = [tree(2240, 1250, 360), tree(2080, 1270, 250), holly(240, 1260, 90, -10), ornament(420, 1250, 34, "#dc2626"), gift(1150, 1250, 90, "#b91c1c", "#facc15"), gift(1270, 1262, 66, "#15803d", "#fde68a")].join("");
  const fonts = await fontFaces();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
  html,body{margin:0}body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:radial-gradient(1500px 950px at 70% 35%,#1f5a3a 0,#123a26 50%,#081a12 100%);font-family:Manrope}
  svg{position:absolute;inset:0}
  .ground{position:absolute;left:0;right:0;bottom:0;height:190px;background:linear-gradient(180deg,#eef5fb,#fff);border-radius:50% 50% 0 0/60px 60px 0 0}
  img{position:absolute;border-radius:6px;box-shadow:0 40px 80px rgba(0,0,0,.5),0 8px 18px rgba(0,0,0,.3)}
  .kick{position:absolute;left:120px;top:250px;color:#fde047;font-family:Sora;font-weight:800;font-size:46px;letter-spacing:.12em;text-transform:uppercase}
  .tile{position:absolute;left:120px;top:340px;width:620px;background:#fff;border-radius:28px;padding:40px 46px;box-shadow:0 30px 60px rgba(0,0,0,.4)}
  .tile .m{font-family:Sora;font-weight:800;font-size:40px;color:#b91c1c;letter-spacing:.14em;text-transform:uppercase}
  .tile .d{font-family:Sora;font-weight:800;font-size:170px;line-height:1;white-space:nowrap;color:#14532d;letter-spacing:-.02em}
  .tile .w{font-family:Sora;font-weight:700;font-size:40px;color:#b91c1c}
  .tile .s{margin-top:18px;font-size:30px;font-weight:700;color:#44403c}
  .count{position:absolute;left:120px;top:960px;display:flex;align-items:center;gap:22px;color:#fff;font-family:Sora;font-weight:800;font-size:44px}
  .count b{color:#14532d;display:inline-flex;align-items:center;justify-content:center;width:110px;height:110px;border-radius:50%;background:#fde047;font-size:60px}
  </style></head><body><svg viewBox="0 0 ${W} ${H}">${snow}</svg>${paper}<div class="ground"></div><svg viewBox="0 0 ${W} ${H}">${ground}</svg>
  <div class="kick">December 2026</div>
  <div class="tile"><div class="m">Friday</div><div class="d">Dec. 25</div><div class="w">Christmas Day</div><div class="s">31 days · Hanukkah Dec. 4-12</div></div>
  <div class="count"><b>16</b>free printable calendars</div></body></html>`;
  const dir = path.join(ROOT, "apps/news/src/assets/news", STORY);
  await fs.mkdir(dir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await sharp(await page.screenshot({ type: "png" })).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${STORY}.jpg`));
  } finally {
    await browser.close();
  }
  await fs.writeFile(path.join(dir, `${STORY}.hero.json`), `${JSON.stringify({ kind: "poster" }, null, 2)}\n`);
  console.log(`hero: ${path.join(dir, `${STORY}.jpg`)}`);
}

export async function buildDecember2026Downloads(): Promise<void> {
  const fonts = await fontFaces();
  const list: Printable[] = DECEMBER_2026_TEMPLATES.map((t) => ({ slug: t.slug, size: t.size, html: t.build(fonts) }));
  await renderPrintables(GROUP, list);
  // WebP previews shown in the story body, each linked to its PDF.
  const pub = path.join(ROOT, "apps/news/public/downloads", GROUP);
  for (const t of DECEMBER_2026_TEMPLATES) {
    await sharp(path.join(pub, `${t.slug}.png`)).resize({ width: t.size.width > t.size.height ? 1400 : 1100 }).webp({ quality: 82 }).toFile(path.join(pub, `${t.slug}.webp`));
  }
  await buildHero(pub);
}
