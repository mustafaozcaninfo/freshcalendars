/**
 * January 2027 calendar printables for /news/january-2027-calendar-printable/ (12 Fresh Calendars templates)
 * and the story's hero, a fan of those same sheets on a drawn winter background.
 *
 * Every sheet is HTML/SVG printed by Chromium, so the PDF keeps real, selectable text. Snowflakes, moons
 * and the coloring snowman are drawn here from primitives; nothing comes from third-party art.
 *
 * Output: apps/news/public/downloads/january-2027-calendar/<slug>.{pdf,png,webp}
 *         apps/news/src/assets/news/january-2027-calendar/<slug>.png (download thumbnails)
 *         apps/news/src/assets/news/january-2027-calendar-printable/january-2027-calendar-printable.jpg (hero)
 * Usage:  pnpm fc news-january2027
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";
import { ROOT } from "./paths.js";
import { fontFaces, doc, LETTER, LETTER_LANDSCAPE } from "./julian.js";
import { renderPrintables, utc, daysIn, DOW3, DOWFULL, type Printable } from "./printables.js";

const STORY = "january-2027-calendar-printable";
const GROUP = "january-2027-calendar";
const FOOT = `Free printable from Fresh Calendars · freshcalendars.com/news/${STORY}/`;
const Y = 2027, M = 0;

export type Cell = { y: number; m: number; d: number; dow: number; inMonth: boolean; key: string };
export const iso = (dt: Date) => dt.toISOString().slice(0, 10);

/** Whole weeks covering a month, starting on Sunday (0) or Monday (1). */
export function weeksOf(start: 0 | 1, y = Y, m = M): Cell[][] {
  const lead = (utc(y, m, 1).getUTCDay() - start + 7) % 7;
  const total = Math.ceil((lead + daysIn(y, m)) / 7) * 7;
  const out: Cell[][] = [];
  for (let i = 0; i < total; i++) {
    const dt = utc(y, m, 1 - lead + i);
    if (i % 7 === 0) out.push([]);
    out[out.length - 1].push({ y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate(), dow: dt.getUTCDay(), inMonth: dt.getUTCMonth() === m, key: iso(dt) });
  }
  return out;
}

/** ISO 8601 week number: Jan. 1-3, 2027 fall in week 53 of 2026. */
export function isoWeek(c: Cell): number {
  // The Thursday of this week decides the year; count weeks from that year's first Thursday.
  const th = utc(c.y, c.m, c.d - ((c.dow + 6) % 7) + 3);
  const jan1 = utc(th.getUTCFullYear(), 0, 1);
  return 1 + Math.floor((th.getTime() - jan1.getTime()) / 86_400_000 / 7);
}

// ── Facts (same sources as the story) ───────────────────────────────────────
/** U.S. federal holidays, Office of Personnel Management. */
const HOL: Record<string, string> = { "2027-01-01": "New Year's Day", "2027-01-18": "Martin Luther King Jr. Day" };
/** Primary Moon phases, U.S. Naval Observatory, Eastern Standard Time (EST). */
export type Phase = "new" | "fq" | "full" | "lq";
const MOON: Record<string, { p: Phase; name: string; t: string }> = {
  "2027-01-07": { p: "new", name: "New Moon", t: "3:24 p.m." },
  "2027-01-15": { p: "fq", name: "First Quarter", t: "3:34 p.m." },
  "2027-01-22": { p: "full", name: "Full Moon", t: "7:17 a.m." },
  "2027-01-29": { p: "lq", name: "Last Quarter", t: "5:55 a.m." },
};
/** Dated deadlines for the key-dates sheet (OPM, SSA, IRS, HealthCare.gov). */
const KEY: { key: string; short: string; long: string; color: string }[] = [
  { key: "2026-12-31", short: "SSI for January", long: "Thu., Dec. 31, 2026: January Supplemental Security Income (SSI) paid early, because Jan. 1 is a holiday", color: "#6a1b9a" },
  { key: "2027-01-01", short: "New Year's Day", long: "Fri., Jan. 1: New Year's Day, federal holiday; federal offices, banks and markets closed", color: "#c62828" },
  { key: "2027-01-13", short: "Social Security", long: "Wed., Jan. 13: Social Security payment for birthdays on the 1st to 10th", color: "#1565c0" },
  { key: "2027-01-15", short: "ACA + IRS deadline", long: "Fri., Jan. 15: last day of HealthCare.gov open enrollment; fourth-quarter 2026 estimated tax payment due", color: "#00796b" },
  { key: "2027-01-18", short: "MLK Jr. Day", long: "Mon., Jan. 18: Martin Luther King Jr. Day, federal holiday", color: "#c62828" },
  { key: "2027-01-20", short: "Social Security", long: "Wed., Jan. 20: Social Security payment for birthdays on the 11th to 20th", color: "#1565c0" },
  { key: "2027-01-27", short: "Social Security", long: "Wed., Jan. 27: Social Security payment for birthdays on the 21st to 31st", color: "#1565c0" },
  { key: "2027-02-01", short: "W-2 due", long: "Mon., Feb. 1: employers' W-2 and 1099-NEC deadline, moved from Sun., Jan. 31", color: "#ef6c00" },
];

// ── Drawn art ───────────────────────────────────────────────────────────────
/** Six-armed snowflake with two pairs of branches per arm. */
export function flake(cx: number, cy: number, r: number, rot: number, color: string, w: number): string {
  let d = "";
  for (let i = 0; i < 6; i++) {
    const a = ((rot + i * 60) * Math.PI) / 180;
    const pt = (t: number, off = 0, len = 0) => {
      const bx = cx + Math.cos(a) * r * t, by = cy + Math.sin(a) * r * t;
      return off === 0 ? [bx, by] : [bx + Math.cos(a + off) * len, by + Math.sin(a + off) * len];
    };
    const [ex, ey] = pt(1);
    d += `M${cx.toFixed(1)} ${cy.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
    for (const [t, len] of [[0.5, 0.3], [0.78, 0.2]] as const) {
      const [sx, sy] = pt(t);
      for (const off of [0.8, -0.8]) {
        const [bx, by] = pt(t, off, r * len);
        d += `M${sx.toFixed(1)} ${sy.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`;
      }
    }
  }
  return `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/><circle cx="${cx}" cy="${cy}" r="${(w * 1.4).toFixed(1)}" fill="${color}"/>`;
}

/** Moon disc as seen from the Northern Hemisphere: first quarter lit on the right, last quarter on the left. */
export function moon(p: Phase, s: number): string {
  const r = s / 2 - 1.5, c = s / 2, dark = "#22324a";
  const half = (side: 1 | -1) => `<path d="M${c} ${c - r}A${r} ${r} 0 0 ${side === 1 ? 1 : 0} ${c} ${c + r}Z" fill="#fff"/>`;
  const body = p === "new" ? `<circle cx="${c}" cy="${c}" r="${r}" fill="${dark}"/>`
    : p === "full" ? `<circle cx="${c}" cy="${c}" r="${r}" fill="#fff8d8"/>`
    : `<circle cx="${c}" cy="${c}" r="${r}" fill="${dark}"/>${half(p === "fq" ? 1 : -1)}`;
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true">${body}<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${dark}" stroke-width="1.5"/></svg>`;
}

/** Outline snowman, mitten and flakes for the coloring sheet. */
function coloringArt(): string {
  const s = "#1d2a3a";
  const man = `<g fill="#fff" stroke="${s}" stroke-width="3">
    <circle cx="120" cy="150" r="46"/><circle cx="120" cy="88" r="32"/>
    <rect x="94" y="30" width="52" height="34" rx="3"/><rect x="84" y="60" width="72" height="9" rx="3"/>
    <path d="M90 112 q30 14 60 0 l4 14 q-34 14 -68 0z"/><path d="M138 116 l12 34 l-14 2 l-6 -30z"/>
    <path d="M78 140 L40 112 M48 118 L36 120 M164 140 L200 110 M192 116 L206 116" fill="none"/>
    <path d="M120 92 l22 5 l-22 5z"/></g>
    <g fill="${s}"><circle cx="109" cy="80" r="3.5"/><circle cx="131" cy="80" r="3.5"/><circle cx="120" cy="138" r="4"/><circle cx="120" cy="158" r="4"/><circle cx="120" cy="178" r="4"/></g>`;
  const mitten = `<g transform="translate(560 40) rotate(12)" fill="#fff" stroke="${s}" stroke-width="3">
    <path d="M30 150 L30 60 Q30 10 70 10 Q110 10 110 60 L110 150 Z"/><path d="M30 80 Q0 70 8 40 Q16 18 34 40"/>
    <rect x="24" y="140" width="92" height="26" rx="6"/><path d="M50 60 l40 0 M50 85 l40 0 M50 110 l40 0" stroke-dasharray="6 6" fill="none"/></g>`;
  const flakes = [flake(300, 60, 36, 8, s, 3), flake(420, 140, 28, 20, s, 3), flake(255, 160, 20, 0, s, 2.5), flake(500, 70, 18, 14, s, 2.5)].join("");
  return `<svg class="art" viewBox="0 0 720 200" aria-hidden="true">${man}${mitten}${flakes}</svg>`;
}

// ── Shared pieces ───────────────────────────────────────────────────────────
export const dowLabels = (start: 0 | 1, names: string[]) => [...names.slice(start), ...names.slice(0, start)];

interface GridOpts { start: 0 | 1; names: string[]; cell: (c: Cell) => string; week?: boolean; cls?: string }
function grid(o: GridOpts): string {
  const rows = weeksOf(o.start);
  const head = (o.week ? `<div class="dh wk">Week</div>` : "") +
    dowLabels(o.start, o.names).map((n, i) => { const dow = (i + o.start) % 7; return `<div class="dh${dow === 0 || dow === 6 ? " we" : ""}">${n}</div>`; }).join("");
  const body = rows.map((r) => (o.week ? `<div class="wk">${isoWeek(r[0])}</div>` : "") + r.map((c) =>
    `<div class="c${c.inMonth ? "" : " out"}${c.dow === 0 || c.dow === 6 ? " we" : ""}${HOL[c.key] ? " hol" : ""}">${o.cell(c)}</div>`).join("")).join("");
  return `<div class="grid${o.week ? " withwk" : ""} ${o.cls ?? ""}" style="--rows:${rows.length}">${head}${body}</div>`;
}

export const GRID_CSS = `
  .grid{display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:auto repeat(var(--rows),1fr)}
  .grid.withwk{grid-template-columns:52px repeat(7,1fr)}
  .grid .dh{text-align:center;font-family:Sora;font-weight:700}
  .grid .c{position:relative;overflow:hidden}
  .grid .n{font-family:Sora;font-weight:700;line-height:1}
  .grid .h{display:block;font-weight:700;line-height:1.15}`;

/** Small month grid (December 2026, February 2027) for headers and the three-month sheet. */
export function mini(y: number, m: number, title: string, cls = "mini"): string {
  const rows = weeksOf(0, y, m);
  const cells = rows.flat().map((c) => `<span class="${c.inMonth ? "" : "o"}">${c.inMonth ? c.d : ""}</span>`).join("");
  return `<div class="${cls}"><b>${title}</b><div class="mg">${DOW3.map((d) => `<i>${d[0]}</i>`).join("")}${cells}</div></div>`;
}
export const MINI_CSS = `
  .mini{font-size:9px;color:#37474f}
  .mini b{display:block;font-family:Sora;font-size:11px;color:#0b3d66;margin-bottom:3px}
  .mini .mg{display:grid;grid-template-columns:repeat(7,16px);gap:1px 2px;text-align:right}
  .mini i{font-style:normal;font-weight:700;color:#5a6b75}`;

const holLine = `U.S. federal holidays: New Year's Day, Fri., Jan. 1 · Martin Luther King Jr. Day, Mon., Jan. 18. Source: U.S. Office of Personnel Management.`;
const short = (c: Cell) => (c.inMonth ? "" : c.m === 11 ? "Dec. " : "Feb. ");

// ── 1. With holidays (portrait, Sunday start) ───────────────────────────────
function withHolidays(f: string): string {
  const css = `${GRID_CSS}${MINI_CSS}
  .t1{padding:46px 44px 0}
  .t1 header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px}
  .t1 h1{margin:0;line-height:1}
  .t1 h1 .mo{display:block;font-family:Sora;font-weight:800;font-size:64px;color:#0b3d66;letter-spacing:-.02em}
  .t1 h1 .k{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:#c62828;letter-spacing:.14em;text-transform:uppercase;margin-top:8px}
  .t1 .minis{display:flex;gap:18px}
  .t1 .grid{height:790px;border:2px solid #0b3d66;border-radius:10px;overflow:hidden}
  .t1 .dh{background:#0b3d66;color:#fff;font-size:12px;padding:8px 0;letter-spacing:.04em}
  .t1 .dh.we{background:#14548a}
  .t1 .c{border-right:1px solid #c9d6e8;border-top:1px solid #c9d6e8;padding:7px 8px}
  .t1 .c:nth-child(7n){border-right:0}
  .t1 .n{font-size:21px;color:#0b1f3a}
  .t1 .we .n{color:#14548a}
  .t1 .out .n{color:#b5c2d1;font-size:15px}
  .t1 .hol{background:#fff3f3}
  .t1 .hol .n{color:#c62828}
  .t1 .h{color:#c62828;font-size:11px;margin-top:6px}
  .t1 .legend{margin-top:10px;font-size:10.5px;color:#37474f}`;
  const g = grid({ start: 0, names: DOWFULL, cell: (c) => `<span class="n">${short(c)}${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}` });
  return doc(f, LETTER, css, [`<section class="page t1">
    <header><h1><span class="mo">January 2027</span><span class="k">Calendar With Holidays</span></h1>
    <div class="minis">${mini(2026, 11, "December 2026")}${mini(2027, 1, "February 2027")}</div></header>
    ${g}<p class="legend">${holLine}</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 2. Landscape, big boxes ─────────────────────────────────────────────────
function landscape(f: string): string {
  const css = `${GRID_CSS}
  .t2{padding:40px 40px 0}
  .t2 header{display:flex;align-items:baseline;gap:16px;margin-bottom:12px}
  .t2 h1{margin:0;font-family:Sora;font-weight:800;font-size:42px;color:#0b1f3a;letter-spacing:-.01em}
  .t2 h1 small{font-family:Manrope;font-weight:700;font-size:15px;color:#1565c0;margin-left:12px;letter-spacing:.06em;text-transform:uppercase}
  .t2 .bar{height:6px;border-radius:3px;background:linear-gradient(90deg,#1565c0 0 72%,#fccc00 72% 100%);margin-bottom:12px}
  .t2 .grid{height:620px;gap:4px}
  .t2 .dh{font-size:12px;color:#1565c0;padding:2px 0 6px;letter-spacing:.06em;text-transform:uppercase}
  .t2 .c{border:1.5px solid #9fb6d3;border-radius:8px;padding:7px 9px}
  .t2 .n{font-size:22px;color:#0b1f3a}
  .t2 .out{border-style:dashed;border-color:#d3dce8}
  .t2 .out .n{color:#b5c2d1;font-size:15px}
  .t2 .hol{border-color:#c62828;background:#fff6f6}
  .t2 .hol .n,.t2 .h{color:#c62828}
  .t2 .h{font-size:11px;margin-top:6px}
  .t2 .legend{margin-top:8px;font-size:10.5px;color:#37474f}`;
  const g = grid({ start: 0, names: DOWFULL, cell: (c) => `<span class="n">${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}` });
  return doc(f, LETTER_LANDSCAPE, css, [`<section class="page t2">
    <header><h1>January 2027 Calendar <small>Landscape With Holidays</small></h1></header><div class="bar"></div>
    ${g}<p class="legend">${holLine}</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 3. Monday start with ISO week numbers ───────────────────────────────────
function mondayWeeks(f: string): string {
  const css = `${GRID_CSS}
  .t3{padding:48px 44px 0}
  .t3 h1{margin:0;font-family:Sora;font-weight:800;font-size:40px;color:#0b1f3a;line-height:1.05}
  .t3 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:16px;color:#2e7d32;margin-top:8px;letter-spacing:.02em}
  .t3 .note{margin:12px 0 16px;padding:10px 14px;border-left:5px solid #2e7d32;background:#f1f8f2;font-size:12px;color:#1b3a24;border-radius:0 8px 8px 0}
  .t3 .grid{height:720px;border-top:3px solid #0b1f3a}
  .t3 .dh{font-size:12px;padding:10px 0;color:#0b1f3a;border-bottom:1px solid #0b1f3a}
  .t3 .dh.wk{color:#2e7d32}
  .t3 .wk:not(.dh){display:flex;align-items:flex-start;justify-content:center;padding-top:10px;font-family:Sora;font-weight:800;font-size:16px;color:#2e7d32;background:#f1f8f2;border-bottom:1px solid #c8dccb}
  .t3 .c{border-left:1px solid #d5dde6;border-bottom:1px solid #d5dde6;padding:8px}
  .t3 .n{font-size:24px;color:#0b1f3a}
  .t3 .we{background:#fafbfc}
  .t3 .out .n{color:#b5c2d1;font-size:15px}
  .t3 .hol .n,.t3 .h{color:#c62828}
  .t3 .h{font-size:11px;margin-top:6px}
  .t3 .legend{margin-top:10px;font-size:10.5px;color:#37474f}`;
  const g = grid({ start: 1, names: DOWFULL, week: true, cell: (c) => `<span class="n">${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}` });
  return doc(f, LETTER, css, [`<section class="page t3">
    <h1>January 2027 Calendar<span>Monday Start With Week Numbers (ISO 8601)</span></h1>
    <p class="note"><b>Fri., Jan. 1 to Sun., Jan. 3 belong to week 53 of 2026.</b> Week 1 of 2027 starts Monday, Jan. 4. Starting on Monday, January 2027 fits in five rows.</p>
    ${g}<p class="legend">${holLine} Week numbers follow ISO 8601.</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 4. Blank (ink saver) ────────────────────────────────────────────────────
function blank(f: string): string {
  const css = `${GRID_CSS}
  .t4{padding:50px 40px 0}
  .t4 h1{margin:0 0 18px;text-align:center;font-family:Sora;font-weight:700;font-size:40px;color:#263238;letter-spacing:.18em;text-transform:uppercase}
  .t4 h1 span{display:block;font-family:Manrope;font-weight:500;font-size:13px;letter-spacing:.3em;color:#78909c;margin-top:8px}
  .t4 .grid{height:820px;border:1px solid #90a4ae}
  .t4 .dh{font-family:Manrope;font-weight:700;font-size:11px;color:#546e7a;padding:8px 0;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #90a4ae}
  .t4 .c{border-right:1px solid #cfd8dc;border-bottom:1px solid #cfd8dc;padding:6px 8px;text-align:right}
  .t4 .c:nth-child(7n){border-right:0}
  .t4 .n{font-family:Manrope;font-weight:700;font-size:17px;color:#37474f}
  .t4 .out .n{color:#cfd8dc}`;
  const g = grid({ start: 0, names: DOW3, cell: (c) => `<span class="n">${c.d}</span>` });
  return doc(f, LETTER, css, [`<section class="page t4"><h1>January 2027<span>Blank Calendar</span></h1>${g}<div class="foot">${FOOT}</div></section>`]);
}

// ── 5. Monthly planner with notes (landscape) ───────────────────────────────
function planner(f: string): string {
  const lines = (n: number) => Array.from({ length: n }, () => `<i></i>`).join("");
  const checks = (n: number) => Array.from({ length: n }, () => `<li><span></span></li>`).join("");
  const css = `${GRID_CSS}
  .t5{padding:38px 36px 0;display:grid;grid-template-columns:1fr 250px;grid-template-rows:auto 1fr;column-gap:22px}
  .t5 h1{grid-column:1/3;margin:0 0 12px;font-family:Sora;font-weight:800;font-size:34px;color:#4a148c}
  .t5 h1 span{font-family:Manrope;font-weight:700;font-size:15px;color:#7b1fa2;margin-left:12px;letter-spacing:.06em;text-transform:uppercase}
  .t5 .grid{height:640px;border:2px solid #4a148c;border-radius:10px;overflow:hidden}
  .t5 .dh{background:#4a148c;color:#fff;font-size:11px;padding:7px 0}
  .t5 .c{border-right:1px solid #e1d3ee;border-top:1px solid #e1d3ee;padding:6px 7px}
  .t5 .c:nth-child(7n){border-right:0}
  .t5 .n{font-size:17px;color:#311b92}
  .t5 .out .n{color:#c9bfd8;font-size:13px}
  .t5 .hol{background:#fbf3ff}
  .t5 .hol .n,.t5 .h{color:#c62828}
  .t5 .h{font-size:10px;margin-top:4px}
  .t5 aside{height:640px;display:flex;flex-direction:column;gap:12px}
  .t5 .box{border:1.5px solid #ccb6e3;border-radius:10px;padding:10px 12px}
  .t5 .box b{display:block;font-family:Sora;font-size:12px;color:#4a148c;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
  .t5 .box i{display:block;height:24px;border-bottom:1px solid #d9cce8}
  .t5 .box ul{list-style:none;margin:0;padding:0}
  .t5 .box li{height:26px;border-bottom:1px solid #d9cce8;display:flex;align-items:center}
  .t5 .box li span{width:13px;height:13px;border:1.5px solid #7b1fa2;border-radius:3px}
  .t5 .grow{flex:1}`;
  const g = grid({ start: 0, names: DOW3, cell: (c) => `<span class="n">${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}` });
  return doc(f, LETTER_LANDSCAPE, css, [`<section class="page t5">
    <h1>January 2027 Monthly Planner <span>With Notes</span></h1>${g}
    <aside><div class="box"><b>Goals for January</b>${lines(3)}</div>
    <div class="box"><b>Top priorities</b><ul>${checks(5)}</ul></div>
    <div class="box grow"><b>Notes</b>${lines(7)}</div></aside>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 6. Winter snowflakes ────────────────────────────────────────────────────
function winter(f: string): string {
  const fl = [
    flake(70, 80, 42, 6, "#8ec5ea", 3.2), flake(170, 36, 16, 18, "#b9dcf3", 2.4), flake(745, 78, 44, 12, "#8ec5ea", 3.4),
    flake(660, 30, 16, 0, "#b9dcf3", 2.4), flake(760, 172, 18, 20, "#cde6f7", 2), flake(60, 175, 18, 8, "#cde6f7", 2),
  ].join("");
  const css = `${GRID_CSS}
  .t6{background:linear-gradient(180deg,#eaf5fd 0,#fff 230px)}
  .t6 .sky{position:absolute;left:0;top:0;width:816px;height:220px}
  .t6 .head{position:relative;padding:70px 44px 0;text-align:center}
  .t6 h1{margin:0;font-family:Sora;font-weight:800;font-size:58px;color:#0d47a1;letter-spacing:-.01em;line-height:1}
  .t6 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:#1976d2;letter-spacing:.22em;text-transform:uppercase;margin-top:12px}
  .t6 .grid{position:relative;margin:30px 40px 0;height:720px;gap:5px}
  .t6 .dh{font-size:12px;color:#0d47a1;padding:6px 0;background:#d6ebfa;border-radius:8px}
  .t6 .c{border-radius:10px;background:#f4f9fe;border:1.5px solid #cfe4f5;padding:7px 9px}
  .t6 .n{font-size:20px;color:#0d47a1}
  .t6 .out{background:transparent;border-color:transparent}
  .t6 .out .n{color:#c0d5e6;font-size:14px}
  .t6 .hol{background:#fff;border-color:#e57373}
  .t6 .hol .n,.t6 .h{color:#c62828}
  .t6 .h{font-size:10.5px;margin-top:6px}
  .t6 .legend{margin:10px 40px 0;font-size:10.5px;color:#37474f;text-align:center}`;
  const g = grid({ start: 0, names: DOW3, cell: (c) => `<span class="n">${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}` });
  return doc(f, LETTER, css, [`<section class="page t6"><svg class="sky" viewBox="0 0 816 220" aria-hidden="true">${fl}</svg>
    <div class="head"><h1>January 2027<span>Winter Calendar With Snowflakes</span></h1></div>${g}
    <p class="legend">${holLine}</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 7. Moon phases ──────────────────────────────────────────────────────────
function moonPhases(f: string): string {
  const css = `${GRID_CSS}
  .t7{padding:46px 44px 0}
  .t7 h1{margin:0;font-family:Sora;font-weight:800;font-size:44px;color:#1a237e;line-height:1}
  .t7 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:#3949ab;margin-top:10px;letter-spacing:.1em;text-transform:uppercase}
  .t7 .keys{display:flex;gap:12px;margin:16px 0 14px}
  .t7 .keys div{flex:1;display:flex;gap:9px;align-items:center;border:1.5px solid #c5cae9;border-radius:10px;padding:8px 10px;font-size:11px;color:#283593}
  .t7 .keys b{display:block;font-family:Sora;font-size:12px;color:#1a237e}
  .t7 .grid{height:735px;border:2px solid #1a237e;border-radius:10px;overflow:hidden}
  .t7 .dh{background:#1a237e;color:#fff;font-size:11px;padding:8px 0}
  .t7 .c{border-right:1px solid #d6d9ee;border-top:1px solid #d6d9ee;padding:7px 8px}
  .t7 .c:nth-child(7n){border-right:0}
  .t7 .n{font-size:20px;color:#1a237e}
  .t7 .out .n{color:#c3c8e4;font-size:14px}
  .t7 .mp{position:absolute;right:7px;bottom:7px;text-align:right;font-size:9.5px;font-weight:700;color:#283593;line-height:1.2}
  .t7 .mp svg{display:block;margin:0 0 3px auto}
  .t7 .hol .n,.t7 .h{color:#c62828}
  .t7 .h{font-size:10.5px;margin-top:5px}
  .t7 .legend{margin-top:10px;font-size:10.5px;color:#37474f}`;
  const keys = Object.entries(MOON).map(([k, v]) => `<div>${moon(v.p, 30)}<span><b>${v.name}</b>${DOW3[utc(2027, 0, Number(k.slice(8))).getUTCDay()]}., Jan. ${Number(k.slice(8))}, ${v.t} EST</span></div>`).join("");
  const g = grid({ start: 0, names: DOW3, cell: (c) => {
    const mp = c.inMonth ? MOON[c.key] : undefined;
    return `<span class="n">${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}${mp ? `<span class="mp">${moon(mp.p, 40)}${mp.name}<br>${mp.t}</span>` : ""}`;
  } });
  return doc(f, LETTER, css, [`<section class="page t7"><h1>January 2027<span>Moon Phase Calendar</span></h1>
    <div class="keys">${keys}</div>${g}
    <p class="legend">Moon phase times in Eastern Standard Time (EST), from the U.S. Naval Observatory. Full Moon on Jan. 22 is often called the Wolf Moon. ${holLine.replace(" Source: U.S. Office of Personnel Management.", "")}</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 8. Coloring calendar for kids ───────────────────────────────────────────
function coloring(f: string): string {
  const css = `${GRID_CSS}
  .t8{padding:40px 40px 0}
  .t8 .art{display:block;width:100%;height:150px}
  .t8 h1{margin:4px 0 14px;text-align:center;font-family:Sora;font-weight:800;font-size:54px;line-height:1;color:#fff;-webkit-text-stroke:2.5px #1d2a3a;letter-spacing:.02em}
  .t8 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:#1d2a3a;-webkit-text-stroke:0;letter-spacing:.2em;text-transform:uppercase;margin-top:10px}
  .t8 .grid{height:660px;gap:6px}
  .t8 .dh{font-size:13px;color:#1d2a3a;padding:4px 0}
  .t8 .c{border:2.5px solid #1d2a3a;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-direction:column}
  .t8 .n{font-family:Sora;font-weight:800;font-size:44px;color:#fff;-webkit-text-stroke:2px #1d2a3a}
  .t8 .out{border:2px dashed #b0bec5}
  .t8 .out .n{font-size:22px;-webkit-text-stroke:1.2px #b0bec5}
  .t8 .h{font-family:Manrope;font-size:9.5px;color:#1d2a3a;text-align:center;margin-top:4px;padding:0 3px}
  .t8 .legend{margin-top:10px;font-size:11px;color:#37474f;text-align:center}`;
  const g = grid({ start: 0, names: DOW3, cell: (c) => `<span class="n">${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}` });
  return doc(f, LETTER, css, [`<section class="page t8">${coloringArt()}<h1>January 2027<span>Coloring Calendar for Kids</span></h1>${g}
    <p class="legend">Color the snowman, the mitten, the snowflakes and every number. Holidays: New Year's Day (Jan. 1) and Martin Luther King Jr. Day (Jan. 18).</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 9. Daily list ───────────────────────────────────────────────────────────
function dailyList(f: string): string {
  const rows = Array.from({ length: 31 }, (_, i) => {
    const dt = utc(2027, 0, i + 1), dow = dt.getUTCDay(), key = iso(dt);
    const tag = HOL[key] ?? (MOON[key] ? MOON[key].name : "");
    return `<div class="r${dow === 0 || dow === 6 ? " we" : ""}${HOL[key] ? " hol" : ""}${dow === 0 ? " sun" : ""}"><span class="d">${i + 1}</span><span class="w">${DOW3[dow]}</span><span class="t">${tag}</span><span class="l"></span></div>`;
  }).join("");
  const css = `
  .t9{padding:42px 48px 0}
  .t9 h1{margin:0 0 4px;font-family:Sora;font-weight:800;font-size:36px;color:#004d40}
  .t9 h1 span{font-family:Manrope;font-weight:700;font-size:15px;color:#00796b;margin-left:10px;letter-spacing:.08em;text-transform:uppercase}
  .t9 .sub{margin:0 0 12px;font-size:11.5px;color:#37474f}
  .t9 .r{display:grid;grid-template-columns:40px 46px 190px 1fr;align-items:end;height:26px;border-bottom:1px solid #cfe3df;font-size:12px}
  .t9 .r.sun{border-bottom:1.5px solid #00796b}
  .t9 .d{font-family:Sora;font-weight:800;font-size:16px;color:#004d40}
  .t9 .w{font-weight:700;color:#00796b;text-transform:uppercase;font-size:11px;letter-spacing:.06em}
  .t9 .we{background:#f3faf8}
  .t9 .t{font-weight:700;color:#00695c;font-size:11px}
  .t9 .hol .t,.t9 .hol .d{color:#c62828}`;
  return doc(f, LETTER, css, [`<section class="page t9"><h1>January 2027 Daily Calendar List</h1>
    <p class="sub">All 31 days of January 2027 with weekdays, federal holidays (U.S. Office of Personnel Management) and Moon phases (U.S. Naval Observatory). A line under each Sunday marks the end of a week.</p>
    ${rows}<div class="foot">${FOOT}</div></section>`]);
}

// ── 10. Habit tracker ───────────────────────────────────────────────────────
function habits(f: string): string {
  const head = Array.from({ length: 31 }, (_, i) => { const dow = utc(2027, 0, i + 1).getUTCDay(); return `<th class="${dow === 0 || dow === 6 ? "we" : ""}"><small>${"SMTWTFS"[dow]}</small>${i + 1}</th>`; }).join("");
  const row = (i: number) => `<tr><td class="hb"><span>${i + 1}.</span></td>${Array.from({ length: 31 }, (_, d) => { const dow = utc(2027, 0, d + 1).getUTCDay(); return `<td class="${dow === 0 || dow === 6 ? "we" : ""}"></td>`; }).join("")}<td class="tot"></td></tr>`;
  const css = `
  .t10{padding:40px 34px 0}
  .t10 h1{margin:0;font-family:Sora;font-weight:800;font-size:38px;color:#bf360c}
  .t10 h1 span{font-family:Manrope;font-weight:700;font-size:15px;color:#e64a19;margin-left:10px;letter-spacing:.08em;text-transform:uppercase}
  .t10 .sub{margin:6px 0 16px;font-size:12px;color:#37474f}
  .t10 .goals{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
  .t10 .goals div{border:1.5px solid #ffccbc;border-radius:10px;padding:8px 10px;height:84px}
  .t10 .goals b{font-family:Sora;font-size:11px;color:#bf360c;letter-spacing:.08em;text-transform:uppercase}
  .t10 table{width:100%;border-collapse:collapse;table-layout:fixed}
  .t10 th{font-family:Sora;font-size:9px;color:#bf360c;font-weight:700;padding:3px 0;line-height:1.1}
  .t10 th small{display:block;font-family:Manrope;font-size:7.5px;color:#8d6e63}
  .t10 th.hbh{width:150px;text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase}
  .t10 th.toth{width:34px}
  .t10 td{border:1px solid #f0c8b8;height:49px}
  .t10 td.we,.t10 th.we{background:#fff4ef}
  .t10 td.hb{border-left:0;font-size:11px;color:#bf360c;font-weight:700;vertical-align:bottom;padding:0 6px 4px 0;border-bottom:1.5px solid #e9a88d}
  .t10 td.tot{background:#fbe9e7}
  .t10 .legend{margin-top:12px;font-size:10.5px;color:#37474f}`;
  return doc(f, LETTER, css, [`<section class="page t10"><h1>January 2027 Habit Tracker <span>31 days</span></h1>
    <p class="sub">Write a habit on each line and fill in a box for every day you do it. January 2027 starts on a Friday and has five Fridays, Saturdays and Sundays.</p>
    <div class="goals"><div><b>My goal this month</b></div><div><b>Why it matters</b></div><div><b>My reward</b></div></div>
    <table><thead><tr><th class="hbh">Habit</th>${head}<th class="toth">Total</th></tr></thead><tbody>${Array.from({ length: 14 }, (_, i) => row(i)).join("")}</tbody></table>
    <p class="legend">Weekends are shaded. Federal holidays: New Year's Day (Jan. 1) and Martin Luther King Jr. Day (Jan. 18).</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 11. Key dates and deadlines ─────────────────────────────────────────────
function keyDates(f: string): string {
  const byKey = new Map(KEY.map((k, i) => [k.key, { ...k, n: i + 1 }]));
  const css = `${GRID_CSS}
  .t11{padding:44px 44px 0}
  .t11 h1{margin:0;font-family:Sora;font-weight:800;font-size:36px;color:#0b1f3a;line-height:1.1}
  .t11 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:#1565c0;margin-top:6px;letter-spacing:.06em;text-transform:uppercase}
  .t11 .grid{margin-top:16px;height:520px;border:2px solid #0b1f3a;border-radius:10px;overflow:hidden}
  .t11 .dh{background:#0b1f3a;color:#fff;font-size:11px;padding:7px 0}
  .t11 .c{border-right:1px solid #d5dde6;border-top:1px solid #d5dde6;padding:6px 7px}
  .t11 .c:nth-child(7n){border-right:0}
  .t11 .n{font-size:18px;color:#0b1f3a}
  .t11 .out .n{color:#b5c2d1;font-size:13px}
  .t11 .k{display:flex;align-items:center;gap:4px;margin-top:6px;font-size:9.5px;font-weight:700;line-height:1.15}
  .t11 .k i,.t11 li i{flex:none;display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;color:#fff;font-style:normal;font-size:9.5px;font-family:Sora}
  .t11 ol{list-style:none;margin:16px 0 0;padding:0;columns:1}
  .t11 li{display:flex;gap:8px;align-items:flex-start;font-size:11.5px;line-height:1.35;padding:4.5px 0;border-bottom:1px solid #e3e9f0;color:#1d2a3a}
  .t11 .src{margin-top:10px;font-size:9.5px;color:#455a64;line-height:1.4}`;
  const g = grid({ start: 0, names: DOW3, cell: (c) => {
    const k = byKey.get(c.key);
    return `<span class="n">${c.d}</span>${k ? `<span class="k" style="color:${k.color}"><i style="background:${k.color}">${k.n}</i>${k.short}</span>` : ""}`;
  } });
  const list = KEY.map((k, i) => `<li><i style="background:${k.color}">${i + 1}</i><span>${k.long}</span></li>`).join("");
  return doc(f, LETTER, css, [`<section class="page t11"><h1>January 2027 Calendar<span>Key Dates and Deadlines</span></h1>${g}<ol>${list}</ol>
    <p class="src">Source: U.S. Office of Personnel Management (federal holidays); Social Security Administration, Schedule of Social Security Payments 2027; Internal Revenue Service (IRS), Form 1040-ES; HealthCare.gov. Most states that run their own marketplace set their own deadline.</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 12. Three months: December 2026, January 2027, February 2027 ─────────────
function threeMonth(f: string): string {
  const big = (y: number, m: number) => {
    const rows = weeksOf(0, y, m);
    return `<div class="mg">${DOW3.map((d) => `<i>${d}</i>`).join("")}${rows.flat().map((c) => `<span class="${c.inMonth ? "" : "o"}${c.dow === 0 || c.dow === 6 ? " we" : ""}">${c.inMonth ? c.d : ""}</span>`).join("")}</div>`;
  };
  const css = `${GRID_CSS}
  .t12{padding:44px 44px 0}
  .t12 h1{margin:0;font-family:Sora;font-weight:800;font-size:44px;color:#0b3d66;line-height:1}
  .t12 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:#1565c0;margin-top:8px;letter-spacing:.06em;text-transform:uppercase}
  .t12 .grid{margin-top:16px;height:560px;border:2px solid #0b3d66;border-radius:10px;overflow:hidden}
  .t12 .dh{background:#0b3d66;color:#fff;font-size:11px;padding:7px 0}
  .t12 .c{border-right:1px solid #c9d6e8;border-top:1px solid #c9d6e8;padding:6px 8px}
  .t12 .c:nth-child(7n){border-right:0}
  .t12 .n{font-size:19px;color:#0b1f3a}
  .t12 .out .n{color:#b5c2d1;font-size:13px}
  .t12 .hol .n,.t12 .h{color:#c62828}
  .t12 .h{font-size:10px;margin-top:5px}
  .t12 .side{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:22px}
  .t12 .side>div{border:1.5px solid #c9d6e8;border-radius:12px;padding:12px 16px}
  .t12 .side b{display:block;font-family:Sora;font-size:16px;color:#0b3d66;margin-bottom:6px}
  .t12 .side .mg{display:grid;grid-template-columns:repeat(7,1fr);row-gap:4px;text-align:center;font-size:13px;font-weight:700;color:#1d2a3a}
  .t12 .side i{font-style:normal;font-size:10px;color:#5a6b75;text-transform:uppercase}
  .t12 .side .we{color:#14548a}
  .t12 .side small{display:block;margin-top:6px;font-size:10px;color:#455a64}`;
  const g = grid({ start: 0, names: DOW3, cell: (c) => `<span class="n">${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}` });
  return doc(f, LETTER, css, [`<section class="page t12"><h1>January 2027 Calendar<span>With December 2026 and February 2027</span></h1>${g}
    <div class="side"><div><b>December 2026</b>${big(2026, 11)}<small>Christmas Day: Fri., Dec. 25 (federal holiday)</small></div>
    <div><b>February 2027</b>${big(2027, 1)}<small>Washington's Birthday: Mon., Feb. 15 (federal holiday)</small></div></div>
    <div class="foot">${FOOT}</div></section>`]);
}

export const JANUARY_2027_TEMPLATES: { slug: string; size: typeof LETTER; build: (f: string) => string }[] = [
  { slug: "january-2027-calendar-with-holidays", size: LETTER, build: withHolidays },
  { slug: "january-2027-calendar-landscape", size: LETTER_LANDSCAPE, build: landscape },
  { slug: "january-2027-calendar-monday-start-week-numbers", size: LETTER, build: mondayWeeks },
  { slug: "january-2027-blank-calendar", size: LETTER, build: blank },
  { slug: "january-2027-monthly-planner-with-notes", size: LETTER_LANDSCAPE, build: planner },
  { slug: "january-2027-winter-calendar-snowflakes", size: LETTER, build: winter },
  { slug: "january-2027-moon-phase-calendar", size: LETTER, build: moonPhases },
  { slug: "january-2027-coloring-calendar-for-kids", size: LETTER, build: coloring },
  { slug: "january-2027-daily-calendar-list", size: LETTER, build: dailyList },
  { slug: "january-2027-habit-tracker", size: LETTER, build: habits },
  { slug: "january-2027-calendar-key-dates-deadlines", size: LETTER, build: keyDates },
  { slug: "january-2027-calendar-december-2026-february-2027", size: LETTER, build: threeMonth },
];

/** The hero: a fan of our own sheets on a drawn night-snow background, 2400×1350. */
async function buildHero(pub: string): Promise<void> {
  const W = 2400, H = 1350;
  const img = async (slug: string) => `data:image/png;base64,${(await fs.readFile(path.join(pub, `${slug}.png`))).toString("base64")}`;
  const sheets = [
    { slug: "january-2027-coloring-calendar-for-kids", x: 1090, y: 250, w: 520, r: -11 },
    { slug: "january-2027-moon-phase-calendar", x: 1830, y: 230, w: 520, r: 10 },
    { slug: "january-2027-winter-calendar-snowflakes", x: 1440, y: 150, w: 600, r: -2 },
  ];
  let paper = "";
  for (const s of sheets) paper += `<img src="${await img(s.slug)}" style="left:${s.x - s.w / 2}px;top:${s.y}px;width:${s.w}px;transform:rotate(${s.r}deg)">`;
  // Seeded flakes so the picture is the same on every run.
  let seed = 2027;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let flakes = "";
  for (let i = 0; i < 26; i++) flakes += flake(rnd() * W, rnd() * H, 14 + rnd() * 46, rnd() * 60, `rgba(255,255,255,${(0.12 + rnd() * 0.3).toFixed(2)})`, 2 + rnd() * 3);
  let dots = "";
  for (let i = 0; i < 260; i++) dots += `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${(1 + rnd() * 3.5).toFixed(1)}" fill="rgba(255,255,255,${(0.25 + rnd() * 0.5).toFixed(2)})"/>`;
  const fonts = await fontFaces();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
  html,body{margin:0}body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:radial-gradient(1400px 900px at 72% 40%,#2c5d8f 0,#173a63 45%,#0b1f3a 100%);font-family:Manrope}
  svg.bg{position:absolute;inset:0}
  .snow{position:absolute;left:0;right:0;bottom:0;height:210px;background:linear-gradient(180deg,#e8f2fb,#ffffff);border-radius:50% 50% 0 0/60px 60px 0 0}
  img{position:absolute;border-radius:6px;box-shadow:0 40px 80px rgba(0,0,0,.45),0 8px 18px rgba(0,0,0,.25)}
  .kick{position:absolute;left:120px;top:250px;color:#fccc00;font-family:Sora;font-weight:800;font-size:46px;letter-spacing:.12em;text-transform:uppercase}
  .tile{position:absolute;left:120px;top:340px;width:600px;background:#fff;border-radius:28px;padding:40px 46px;box-shadow:0 30px 60px rgba(0,0,0,.35)}
  .tile .m{font-family:Sora;font-weight:800;font-size:40px;color:#c62828;letter-spacing:.14em;text-transform:uppercase}
  .tile .d{font-family:Sora;font-weight:800;font-size:180px;line-height:1;white-space:nowrap;color:#0b1f3a;letter-spacing:-.02em}
  .tile .w{font-family:Sora;font-weight:700;font-size:40px;color:#14548a}
  .tile .s{margin-top:18px;font-size:30px;font-weight:700;color:#37474f}
  .count{position:absolute;left:120px;top:960px;display:flex;align-items:center;gap:22px;color:#fff;font-family:Sora;font-weight:800;font-size:44px}
  .count b{color:#0b1f3a;display:inline-flex;align-items:center;justify-content:center;width:110px;height:110px;border-radius:50%;background:#fccc00;font-size:60px}
  </style></head><body><svg class="bg" viewBox="0 0 ${W} ${H}">${dots}${flakes}</svg>${paper}<div class="snow"></div>
  <div class="kick">January 2027</div>
  <div class="tile"><div class="m">Friday</div><div class="d">Jan. 1</div><div class="w">New Year's Day</div><div class="s">31 days · 2 federal holidays</div></div>
  <div class="count"><b>12</b>free printable calendars</div></body></html>`;
  const dir = path.join(ROOT, "apps/news/src/assets/news", STORY);
  await fs.mkdir(dir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png" });
    await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${STORY}.jpg`));
  } finally {
    await browser.close();
  }
  await fs.writeFile(path.join(dir, `${STORY}.hero.json`), `${JSON.stringify({ kind: "poster" }, null, 2)}\n`);
  console.log(`hero: ${path.join(dir, `${STORY}.jpg`)}`);
}

export async function buildJanuary2027Downloads(): Promise<void> {
  const fonts = await fontFaces();
  const list: Printable[] = JANUARY_2027_TEMPLATES.map((t) => ({ slug: t.slug, size: t.size, html: t.build(fonts) }));
  await renderPrintables(GROUP, list);
  // WebP previews shown in the story body, each linked to its PDF.
  const pub = path.join(ROOT, "apps/news/public/downloads", GROUP);
  for (const t of JANUARY_2027_TEMPLATES) {
    await sharp(path.join(pub, `${t.slug}.png`)).resize({ width: t.size.width > t.size.height ? 1400 : 1100 }).webp({ quality: 82 }).toFile(path.join(pub, `${t.slug}.webp`));
  }
  await buildHero(pub);
}
