/**
 * November 2026 calendar printables for /news/november-2026-calendar-printable/ (14 Fresh Calendars templates)
 * and the story's hero, a fan of those sheets on a drawn autumn background. Same method as january2027.ts:
 * HTML/SVG printed by Chromium (real text), leaves, acorns, pumpkins and moons drawn here from primitives.
 *
 * Output: apps/news/public/downloads/november-2026-calendar/<slug>.{pdf,png,webp}
 *         apps/news/src/assets/news/november-2026-calendar/<slug>.png (download thumbnails)
 *         apps/news/src/assets/news/november-2026-calendar-printable/november-2026-calendar-printable.jpg (hero)
 * Usage:  pnpm fc news-november2026
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";
import { ROOT } from "./paths.js";
import { fontFaces, doc, LETTER, LETTER_LANDSCAPE } from "./julian.js";
import { renderPrintables, utc, DOW3, DOWFULL, type Printable } from "./printables.js";
import { weeksOf, isoWeek, iso, moon, mini, dowLabels, GRID_CSS, MINI_CSS, type Cell, type Phase } from "./january2027.js";

const STORY = "november-2026-calendar-printable";
const GROUP = "november-2026-calendar";
const FOOT = `Free printable from Fresh Calendars · freshcalendars.com/news/${STORY}/`;
const Y = 2026, M = 10;

// ── Facts (same sources as the story) ───────────────────────────────────────
/** U.S. federal holidays, Office of Personnel Management. */
const HOL: Record<string, string> = { "2026-11-11": "Veterans Day", "2026-11-26": "Thanksgiving Day" };
/** Other dates printed on the holiday sheets (NIST, election offices, Diwali and Advent sources, retailers). */
const OBS: Record<string, string> = {
  "2026-11-01": "Clocks fall back 1 hour",
  "2026-11-03": "Election Day",
  "2026-11-08": "Diwali",
  "2026-11-27": "Black Friday",
  "2026-11-29": "First Sunday of Advent",
  "2026-11-30": "Cyber Monday",
};
/** Primary Moon phases, U.S. Naval Observatory, converted to Eastern Time. */
const MOON: Record<string, { p: Phase; name: string; t: string }> = {
  "2026-11-01": { p: "lq", name: "Last Quarter", t: "3:28 p.m. EST" },
  "2026-11-09": { p: "new", name: "New Moon", t: "2:02 a.m. EST" },
  "2026-11-17": { p: "fq", name: "First Quarter", t: "6:48 a.m. EST" },
  "2026-11-24": { p: "full", name: "Full Moon", t: "9:53 a.m. EST" },
};
/** Dated deadlines for the key-dates sheet (SSA, NIST, HealthCare.gov, OPM, Medicare.gov). */
const KEY: { key: string; short: string; long: string; color: string }[] = [
  { key: "2026-10-30", short: "SSI for November", long: "Fri., Oct. 30: November Supplemental Security Income (SSI) paid early, because Nov. 1 is a Sunday", color: "#6a1b9a" },
  { key: "2026-11-01", short: "Clocks back · ACA opens", long: "Sun., Nov. 1: daylight saving time ends at 2 a.m.; HealthCare.gov open enrollment for 2027 plans begins", color: "#c2410c" },
  { key: "2026-11-03", short: "Election Day", long: "Tue., Nov. 3: Election Day; Social Security for people paid on the 3rd", color: "#1d4ed8" },
  { key: "2026-11-10", short: "Social Security", long: "Tue., Nov. 10: Social Security payment for birthdays on the 1st to 10th, a day early because Wed., Nov. 11 is Veterans Day", color: "#0f766e" },
  { key: "2026-11-11", short: "Veterans Day", long: "Wed., Nov. 11: Veterans Day, federal holiday", color: "#b91c1c" },
  { key: "2026-11-18", short: "Social Security", long: "Wed., Nov. 18: Social Security payment for birthdays on the 11th to 20th", color: "#0f766e" },
  { key: "2026-11-25", short: "Social Security", long: "Wed., Nov. 25: Social Security payment for birthdays on the 21st to 31st", color: "#0f766e" },
  { key: "2026-11-26", short: "Thanksgiving", long: "Thu., Nov. 26: Thanksgiving Day, federal holiday", color: "#b91c1c" },
  { key: "2026-11-27", short: "Black Friday", long: "Fri., Nov. 27: Black Friday; not a federal holiday", color: "#a16207" },
  { key: "2026-11-30", short: "Cyber Monday", long: "Mon., Nov. 30: Cyber Monday", color: "#a16207" },
  { key: "2026-12-07", short: "Medicare ends", long: "Mon., Dec. 7: Medicare open enrollment ends (it runs all of November)", color: "#4338ca" },
];

// ── Drawn art ───────────────────────────────────────────────────────────────
/** A seven-point maple leaf with a stem, pointing up before rotation. */
function leaf(cx: number, cy: number, s: number, rot: number, fill: string, stroke = "none", w = 0): string {
  const half = [[0, -1], [0.14, -0.6], [0.38, -0.78], [0.3, -0.38], [0.76, -0.52], [0.6, -0.2], [0.94, -0.06], [0.5, 0.14], [0.6, 0.34], [0.14, 0.24], [0.04, 0.5]];
  const pts = [...half, ...half.slice(1).reverse().map(([x, y]) => [-x, y])];
  const d = `M${pts.map(([x, y]) => `${(x * s).toFixed(1)} ${(y * s).toFixed(1)}`).join("L")}Z`;
  const vein = `M0 ${(0.85 * s).toFixed(1)}L0 ${(-0.7 * s).toFixed(1)}M0 0L${(0.6 * s).toFixed(1)} ${(-0.32 * s).toFixed(1)}M0 0L${(-0.6 * s).toFixed(1)} ${(-0.32 * s).toFixed(1)}`;
  const vc = stroke === "none" ? "rgba(0,0,0,.18)" : stroke;
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})"><path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/><path d="${vein}" stroke="${vc}" stroke-width="${Math.max(1, s / 22).toFixed(1)}" fill="none" stroke-linecap="round"/></g>`;
}
function acorn(cx: number, cy: number, s: number, rot: number, body: string, cap: string, stroke = "none", w = 0): string {
  return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s / 50})" stroke="${stroke}" stroke-width="${w * 50 / s}" stroke-linejoin="round">
    <path d="M-20 0 Q-22 34 0 48 Q22 34 20 0 Z" fill="${body}"/><path d="M-27 2 Q-26 -22 0 -24 Q26 -22 27 2 Q0 9 -27 2Z" fill="${cap}"/>
    <path d="M0 -24 Q2 -36 9 -40" fill="none" stroke="${stroke === "none" ? cap : stroke}" stroke-width="${(stroke === "none" ? 5 : w * 50 / s).toFixed(1)}" stroke-linecap="round"/></g>`;
}
function pumpkin(cx: number, cy: number, s: number, fill: string, stroke = "none", w = 0): string {
  return `<g transform="translate(${cx} ${cy}) scale(${s / 60})" stroke="${stroke}" stroke-width="${w * 60 / s}">
    <ellipse cx="-24" cy="6" rx="26" ry="36" fill="${fill}"/><ellipse cx="24" cy="6" rx="26" ry="36" fill="${fill}"/><ellipse cx="0" cy="4" rx="24" ry="38" fill="${fill}"/>
    <path d="M-3 -32 Q-2 -48 8 -52 L12 -46 Q4 -42 5 -32Z" fill="${stroke === "none" ? "#4d7c0f" : "#fff"}"/></g>`;
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
/** Holiday in red, other key date in the sheet's accent; nothing for days outside November. */
const tags = (c: Cell) => !c.inMonth ? "" : HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : OBS[c.key] ? `<span class="h o">${OBS[c.key]}</span>` : "";
const cellStd = (c: Cell) => `<span class="n">${c.d}</span>${tags(c)}`;
const holLine = `U.S. federal holidays: Veterans Day, Wed., Nov. 11 · Thanksgiving Day, Thu., Nov. 26 (U.S. Office of Personnel Management). Clocks fall back at 2 a.m. Sun., Nov. 1. Election Day is Tue., Nov. 3.`;

// ── 1. With holidays (portrait, Sunday start) ───────────────────────────────
function withHolidays(f: string): string {
  const css = `${GRID_CSS}${MINI_CSS}
  .t1{padding:46px 44px 0}
  .t1 header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px}
  .t1 h1{margin:0;line-height:1}
  .t1 h1 .mo{display:block;white-space:nowrap;font-family:Sora;font-weight:800;font-size:50px;color:#7c2d12;letter-spacing:-.02em}
  .t1 h1 .k{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:#c2410c;letter-spacing:.14em;text-transform:uppercase;margin-top:8px}
  .t1 .mini b{color:#7c2d12}
  .t1 .minis{display:flex;gap:18px}
  .t1 .grid{height:790px;border:2px solid #7c2d12;border-radius:10px;overflow:hidden}
  .t1 .dh{background:#7c2d12;color:#fff;font-size:12px;padding:8px 0;letter-spacing:.04em}
  .t1 .dh.we{background:#9a3412}
  .t1 .c{border-right:1px solid #f0d5c2;border-top:1px solid #f0d5c2;padding:7px 8px}
  .t1 .c:nth-child(7n){border-right:0}
  .t1 .n{font-size:22px;color:#431407}
  .t1 .we .n{color:#9a3412}
  .t1 .out .n{color:#d6c1b3;font-size:15px}
  .t1 .hol{background:#fff1f1}
  .t1 .hol .n,.t1 .h{color:#b91c1c}
  .t1 .h{font-size:11px;margin-top:6px}
  .t1 .h.o{color:#9a3412;font-weight:700}
  .t1 .legend{margin-top:10px;font-size:10.5px;color:#44403c}`;
  const g = grid({ start: 0, names: DOWFULL, cell: cellStd });
  return doc(f, LETTER, css, [`<section class="page t1">
    <header><h1><span class="mo">November 2026</span><span class="k">Calendar With Holidays</span></h1>
    <div class="minis">${mini(2026, 9, "October 2026")}${mini(2026, 11, "December 2026")}</div></header>
    ${g}<p class="legend">${holLine}</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 2. Landscape, big boxes ─────────────────────────────────────────────────
function landscape(f: string): string {
  const css = `${GRID_CSS}
  .t2{padding:40px 40px 0}
  .t2 h1{margin:0 0 12px;font-family:Sora;font-weight:800;font-size:42px;color:#292524;letter-spacing:-.01em}
  .t2 h1 small{font-family:Manrope;font-weight:700;font-size:15px;color:#c2410c;margin-left:12px;letter-spacing:.06em;text-transform:uppercase}
  .t2 .bar{height:6px;border-radius:3px;background:linear-gradient(90deg,#c2410c 0 60%,#d97706 60% 82%,#7c2d12 82% 100%);margin-bottom:12px}
  .t2 .grid{height:600px;gap:4px}
  .t2 .dh{font-size:12px;color:#c2410c;padding:2px 0 6px;letter-spacing:.06em;text-transform:uppercase}
  .t2 .c{border:1.5px solid #e7c3a5;border-radius:8px;padding:7px 9px}
  .t2 .n{font-size:24px;color:#292524}
  .t2 .out{border-style:dashed;border-color:#eee2d8}
  .t2 .out .n{color:#d6c1b3;font-size:15px}
  .t2 .hol{border-color:#b91c1c;background:#fff6f6}
  .t2 .hol .n,.t2 .h{color:#b91c1c}
  .t2 .h{font-size:11px;margin-top:6px}
  .t2 .h.o{color:#9a3412}
  .t2 .legend{margin-top:10px;font-size:10.5px;color:#44403c}`;
  return doc(f, LETTER_LANDSCAPE, css, [`<section class="page t2">
    <h1>November 2026 Calendar <small>Landscape With Holidays</small></h1><div class="bar"></div>
    ${grid({ start: 0, names: DOWFULL, cell: cellStd })}<p class="legend">${holLine}</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 3. Monday start with ISO week numbers ───────────────────────────────────
function mondayWeeks(f: string): string {
  const css = `${GRID_CSS}
  .t3{padding:48px 44px 0}
  .t3 h1{margin:0;font-family:Sora;font-weight:800;font-size:40px;color:#1c1917;line-height:1.05}
  .t3 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:16px;color:#15803d;margin-top:8px;letter-spacing:.02em}
  .t3 .note{margin:12px 0 16px;padding:10px 14px;border-left:5px solid #15803d;background:#f0f7f1;font-size:12px;color:#14532d;border-radius:0 8px 8px 0}
  .t3 .grid{height:735px;border-top:3px solid #1c1917}
  .t3 .dh{font-size:12px;padding:10px 0;color:#1c1917;border-bottom:1px solid #1c1917}
  .t3 .dh.wk{color:#15803d}
  .t3 .wk:not(.dh){display:flex;align-items:flex-start;justify-content:center;padding-top:10px;font-family:Sora;font-weight:800;font-size:16px;color:#15803d;background:#f0f7f1;border-bottom:1px solid #cfe3d3}
  .t3 .c{border-left:1px solid #e2ddd8;border-bottom:1px solid #e2ddd8;padding:8px}
  .t3 .n{font-size:23px;color:#1c1917}
  .t3 .we{background:#fafaf9}
  .t3 .out .n{color:#cfc6be;font-size:15px}
  .t3 .hol .n,.t3 .h{color:#b91c1c}
  .t3 .h{font-size:10.5px;margin-top:5px}
  .t3 .h.o{color:#9a3412}
  .t3 .legend{margin-top:10px;font-size:10.5px;color:#44403c}`;
  return doc(f, LETTER, css, [`<section class="page t3">
    <h1>November 2026 Calendar<span>Monday Start With Week Numbers (ISO 8601)</span></h1>
    <p class="note"><b>November 2026 runs through ISO weeks 44 to 49.</b> Sun., Nov. 1 closes week 44, which began Mon., Oct. 26, and Mon., Nov. 30 opens week 49. Starting on Monday, the month needs six rows.</p>
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
  .t4 .out .n{color:#d6d3d1}`;
  return doc(f, LETTER, css, [`<section class="page t4"><h1>November 2026<span>Blank Calendar</span></h1>${grid({ start: 0, names: DOW3, cell: (c) => `<span class="n">${c.d}</span>` })}<div class="foot">${FOOT}</div></section>`]);
}

// ── 5. Monthly planner with notes (landscape) ───────────────────────────────
function planner(f: string): string {
  const lines = (n: number) => Array.from({ length: n }, () => `<i></i>`).join("");
  const checks = (n: number) => Array.from({ length: n }, () => `<li><span></span></li>`).join("");
  const css = `${GRID_CSS}
  .t5{padding:38px 36px 0;display:grid;grid-template-columns:1fr 250px;grid-template-rows:auto 1fr;column-gap:22px}
  .t5 h1{grid-column:1/3;margin:0 0 12px;font-family:Sora;font-weight:800;font-size:34px;color:#3f2a14}
  .t5 h1 span{font-family:Manrope;font-weight:700;font-size:15px;color:#a16207;margin-left:12px;letter-spacing:.06em;text-transform:uppercase}
  .t5 .grid{height:640px;border:2px solid #3f2a14;border-radius:10px;overflow:hidden}
  .t5 .dh{background:#3f2a14;color:#fff;font-size:11px;padding:7px 0}
  .t5 .c{border-right:1px solid #eadfcf;border-top:1px solid #eadfcf;padding:6px 7px}
  .t5 .c:nth-child(7n){border-right:0}
  .t5 .n{font-size:18px;color:#3f2a14}
  .t5 .out .n{color:#d8cbb8;font-size:13px}
  .t5 .hol{background:#fff7ed}
  .t5 .hol .n,.t5 .h{color:#b91c1c}
  .t5 .h{font-size:10px;margin-top:4px}
  .t5 .h.o{color:#a16207}
  .t5 aside{height:640px;display:flex;flex-direction:column;gap:12px}
  .t5 .box{border:1.5px solid #e6cfa8;border-radius:10px;padding:10px 12px}
  .t5 .box b{display:block;font-family:Sora;font-size:12px;color:#3f2a14;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
  .t5 .box i{display:block;height:24px;border-bottom:1px solid #eadfcf}
  .t5 .box ul{list-style:none;margin:0;padding:0}
  .t5 .box li{height:26px;border-bottom:1px solid #eadfcf;display:flex;align-items:center}
  .t5 .box li span{width:13px;height:13px;border:1.5px solid #a16207;border-radius:3px}
  .t5 .grow{flex:1}`;
  return doc(f, LETTER_LANDSCAPE, css, [`<section class="page t5">
    <h1>November 2026 Monthly Planner <span>With Notes</span></h1>${grid({ start: 0, names: DOW3, cell: cellStd })}
    <aside><div class="box"><b>Goals for November</b>${lines(3)}</div>
    <div class="box"><b>Top priorities</b><ul>${checks(5)}</ul></div>
    <div class="box grow"><b>Notes</b>${lines(7)}</div></aside>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 6. Fall leaves ──────────────────────────────────────────────────────────
function fall(f: string): string {
  const art = [
    leaf(70, 70, 46, -18, "#c2410c"), leaf(165, 175, 22, 24, "#d97706"), leaf(40, 170, 18, 40, "#a16207"),
    leaf(745, 78, 48, 16, "#b91c1c"), leaf(700, 178, 22, -30, "#d97706"), acorn(770, 175, 26, 18, "#a16207", "#5b3a1e"), acorn(110, 190, 20, -14, "#a16207", "#5b3a1e"),
  ].join("");
  const css = `${GRID_CSS}
  .t6{background:linear-gradient(180deg,#fff4e6 0,#fff 230px)}
  .t6 .sky{position:absolute;left:0;top:0;width:816px;height:220px}
  .t6 .head{position:relative;padding:70px 44px 0;text-align:center}
  .t6 h1{margin:0;font-family:Sora;font-weight:800;font-size:56px;color:#7c2d12;letter-spacing:-.01em;line-height:1}
  .t6 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:#c2410c;letter-spacing:.22em;text-transform:uppercase;margin-top:12px}
  .t6 .grid{position:relative;margin:30px 40px 0;height:700px;gap:5px}
  .t6 .dh{font-size:12px;color:#7c2d12;padding:6px 0;background:#fde3c8;border-radius:8px}
  .t6 .c{border-radius:10px;background:#fff8f1;border:1.5px solid #f6d6b8;padding:7px 9px}
  .t6 .n{font-size:21px;color:#7c2d12}
  .t6 .out{background:transparent;border-color:transparent}
  .t6 .out .n{color:#e2cbb7;font-size:14px}
  .t6 .hol{background:#fff;border-color:#ef8a7a}
  .t6 .hol .n,.t6 .h{color:#b91c1c}
  .t6 .h{font-size:10.5px;margin-top:6px}
  .t6 .h.o{color:#9a3412}
  .t6 .legend{margin:10px 40px 0;font-size:10.5px;color:#44403c;text-align:center}`;
  return doc(f, LETTER, css, [`<section class="page t6"><svg class="sky" viewBox="0 0 816 220" aria-hidden="true">${art}</svg>
    <div class="head"><h1>November 2026<span>Fall Calendar With Autumn Leaves</span></h1></div>${grid({ start: 0, names: DOW3, cell: cellStd })}
    <p class="legend">${holLine}</p><div class="foot">${FOOT}</div></section>`]);
}

// ── 7. Thanksgiving week planner ────────────────────────────────────────────
function thanksgiving(f: string): string {
  const week = Array.from({ length: 8 }, (_, i) => {
    const dt = utc(2026, 10, 22 + i), key = iso(dt), dow = dt.getUTCDay();
    const tag = HOL[key] ?? OBS[key] ?? (MOON[key] ? MOON[key].name : i === 3 ? "Busy travel day" : "");
    return `<div class="day${HOL[key] ? " tg" : ""}"><b>${DOW3[dow]}., Nov. ${22 + i}</b><em>${tag}</em><i></i><i></i><i></i></div>`;
  }).join("");
  const art = [leaf(34, 40, 22, -20, "#c2410c"), pumpkin(40, 96, 18, "#ea7a2a"), leaf(782, 40, 22, 18, "#b91c1c"), acorn(780, 96, 16, 16, "#a16207", "#5b3a1e")].join("");
  const css = `${GRID_CSS}
  .t7{padding:42px 44px 0}
  .t7 .art{position:absolute;left:0;top:0;width:816px;height:130px}
  .t7 h1{position:relative;margin:0;text-align:center;white-space:nowrap;font-family:Sora;font-weight:800;font-size:31px;color:#7c2d12;line-height:1.05}
  .t7 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:#c2410c;letter-spacing:.16em;text-transform:uppercase;margin-top:8px}
  .t7 .grid{margin-top:22px;height:430px;border:2px solid #7c2d12;border-radius:10px;overflow:hidden}
  .t7 .dh{background:#7c2d12;color:#fff;font-size:11px;padding:6px 0}
  .t7 .c{border-right:1px solid #f0d5c2;border-top:1px solid #f0d5c2;padding:5px 7px}
  .t7 .c:nth-child(7n){border-right:0}
  .t7 .n{font-size:16px;color:#431407}
  .t7 .out .n{color:#d6c1b3;font-size:12px}
  .t7 .hol{background:#fff1f1}
  .t7 .hol .n,.t7 .h{color:#b91c1c}
  .t7 .h{font-size:9.5px;margin-top:3px}
  .t7 .h.o{color:#9a3412}
  .t7 h2{margin:18px 0 8px;font-family:Sora;font-size:15px;color:#7c2d12;letter-spacing:.06em;text-transform:uppercase}
  .t7 .week{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .t7 .day{border:1.5px solid #f0c9a6;border-radius:10px;padding:7px 9px;height:118px}
  .t7 .day.tg{border:2px solid #b91c1c;background:#fff7f5}
  .t7 .day b{display:block;font-family:Sora;font-size:12px;color:#431407}
  .t7 .day em{display:block;height:14px;font-style:normal;font-weight:700;font-size:10px;color:#b45309}
  .t7 .day i{display:block;height:24px;border-bottom:1px solid #f3dcc8}`;
  return doc(f, LETTER, css, [`<section class="page t7"><svg class="art" viewBox="0 0 816 130" aria-hidden="true">${art}</svg>
    <h1>November 2026 Thanksgiving Calendar<span>Thanksgiving is Thursday, Nov. 26</span></h1>
    ${grid({ start: 0, names: DOW3, cell: cellStd })}
    <h2>Thanksgiving week plan · Sun., Nov. 22 to Sun., Nov. 29</h2><div class="week">${week}</div>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 8. Moon phases ──────────────────────────────────────────────────────────
function moonPhases(f: string): string {
  const css = `${GRID_CSS}
  .t8{padding:46px 44px 0}
  .t8 h1{margin:0;font-family:Sora;font-weight:800;font-size:44px;color:#1e1b4b;line-height:1}
  .t8 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:#4338ca;margin-top:10px;letter-spacing:.1em;text-transform:uppercase}
  .t8 .keys{display:flex;gap:12px;margin:16px 0 14px}
  .t8 .keys div{flex:1;display:flex;gap:9px;align-items:center;border:1.5px solid #c7d2fe;border-radius:10px;padding:8px 10px;font-size:11px;color:#3730a3}
  .t8 .keys b{display:block;font-family:Sora;font-size:12px;color:#1e1b4b}
  .t8 .grid{height:735px;border:2px solid #1e1b4b;border-radius:10px;overflow:hidden}
  .t8 .dh{background:#1e1b4b;color:#fff;font-size:11px;padding:8px 0}
  .t8 .c{border-right:1px solid #dcdcf0;border-top:1px solid #dcdcf0;padding:7px 8px}
  .t8 .c:nth-child(7n){border-right:0}
  .t8 .n{font-size:21px;color:#1e1b4b}
  .t8 .out .n{color:#c9c9e6;font-size:14px}
  .t8 .mp{position:absolute;right:7px;bottom:7px;text-align:right;font-size:9.5px;font-weight:700;color:#3730a3;line-height:1.2}
  .t8 .mp svg{display:block;margin:0 0 3px auto}
  .t8 .hol .n,.t8 .h{color:#b91c1c}
  .t8 .h{font-size:10.5px;margin-top:5px}
  .t8 .legend{margin-top:10px;font-size:10.5px;color:#44403c}`;
  const keys = Object.entries(MOON).map(([k, v]) => { const d = Number(k.slice(8)); return `<div>${moon(v.p, 30)}<span><b>${v.name}</b>${DOW3[utc(2026, 10, d).getUTCDay()]}., Nov. ${d}, ${v.t}</span></div>`; }).join("");
  const g = grid({ start: 0, names: DOW3, cell: (c) => {
    const mp = c.inMonth ? MOON[c.key] : undefined;
    return `<span class="n">${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}${mp ? `<span class="mp">${moon(mp.p, 40)}${mp.name}<br>${mp.t.replace(" EST", "")}</span>` : ""}`;
  } });
  return doc(f, LETTER, css, [`<section class="page t8"><h1>November 2026<span>Moon Phase Calendar</span></h1>
    <div class="keys">${keys}</div>${g}
    <p class="legend">Moon phase times from the U.S. Naval Observatory in Eastern Standard Time (EST), which starts at 2 a.m. on Nov. 1. The full moon on Nov. 24 is often called the Beaver Moon. Federal holidays: Veterans Day (Nov. 11) and Thanksgiving Day (Nov. 26).</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 9. Coloring calendar for kids ───────────────────────────────────────────
function coloring(f: string): string {
  const s = "#1c1917";
  const art = [leaf(90, 80, 56, -16, "#fff", s, 3), pumpkin(250, 110, 58, "#fff", s, 3), acorn(400, 80, 40, 14, "#fff", "#fff", s, 3),
    leaf(520, 70, 40, 22, "#fff", s, 3), pumpkin(640, 120, 44, "#fff", s, 3), leaf(670, 40, 22, -30, "#fff", s, 2.5)].join("");
  const css = `${GRID_CSS}
  .t9{padding:40px 40px 0}
  .t9 .art{display:block;width:100%;height:150px}
  .t9 h1{margin:4px 0 14px;text-align:center;font-family:Sora;font-weight:800;font-size:50px;line-height:1;color:#fff;-webkit-text-stroke:2.5px ${s};letter-spacing:.02em}
  .t9 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:${s};-webkit-text-stroke:0;letter-spacing:.2em;text-transform:uppercase;margin-top:10px}
  .t9 .grid{height:660px;gap:6px}
  .t9 .dh{font-size:13px;color:${s};padding:4px 0}
  .t9 .c{border:2.5px solid ${s};border-radius:14px;display:flex;align-items:center;justify-content:center;flex-direction:column}
  .t9 .n{font-family:Sora;font-weight:800;font-size:46px;color:#fff;-webkit-text-stroke:2px ${s}}
  .t9 .out{border:2px dashed #a8a29e}
  .t9 .out .n{font-size:22px;-webkit-text-stroke:1.2px #a8a29e}
  .t9 .h{font-family:Manrope;font-size:9.5px;color:${s};text-align:center;margin-top:4px;padding:0 3px}
  .t9 .legend{margin-top:10px;font-size:11px;color:#44403c;text-align:center}`;
  const g = grid({ start: 0, names: DOW3, cell: (c) => `<span class="n">${c.d}</span>${c.inMonth && HOL[c.key] ? `<span class="h">${HOL[c.key]}</span>` : ""}` });
  return doc(f, LETTER, css, [`<section class="page t9"><svg class="art" viewBox="0 0 720 170" aria-hidden="true">${art}</svg><h1>November 2026<span>Coloring Calendar for Kids</span></h1>${g}
    <p class="legend">Color the leaves, the pumpkins, the acorn and every number. Holidays: Veterans Day (Nov. 11) and Thanksgiving Day (Nov. 26).</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 10. Daily list ──────────────────────────────────────────────────────────
function dailyList(f: string): string {
  const rows = Array.from({ length: 30 }, (_, i) => {
    const dt = utc(2026, 10, i + 1), dow = dt.getUTCDay(), key = iso(dt);
    const tag = HOL[key] ?? OBS[key] ?? (MOON[key] ? MOON[key].name : "");
    return `<div class="r${dow === 0 || dow === 6 ? " we" : ""}${HOL[key] ? " hol" : ""}${dow === 6 ? " sat" : ""}"><span class="d">${i + 1}</span><span class="w">${DOW3[dow]}</span><span class="t">${tag}</span><span class="l"></span></div>`;
  }).join("");
  const css = `
  .t10{padding:42px 48px 0}
  .t10 h1{margin:0 0 4px;font-family:Sora;font-weight:800;font-size:36px;color:#7c2d12}
  .t10 .sub{margin:0 0 12px;font-size:11.5px;color:#44403c}
  .t10 .r{display:grid;grid-template-columns:40px 46px 200px 1fr;align-items:end;height:27px;border-bottom:1px solid #f1dccb;font-size:12px}
  .t10 .r.sat{border-bottom:1.5px solid #c2410c}
  .t10 .d{font-family:Sora;font-weight:800;font-size:16px;color:#7c2d12}
  .t10 .w{font-weight:700;color:#c2410c;text-transform:uppercase;font-size:11px;letter-spacing:.06em}
  .t10 .we{background:#fff8f1}
  .t10 .t{font-weight:700;color:#9a3412;font-size:11px}
  .t10 .hol .t,.t10 .hol .d{color:#b91c1c}`;
  return doc(f, LETTER, css, [`<section class="page t10"><h1>November 2026 Daily Calendar List</h1>
    <p class="sub">All 30 days of November 2026 with weekdays, holidays, key dates and Moon phases already filled in. Weeks run Sunday to Saturday; a line under each Saturday marks the end of a week.</p>
    ${rows}<div class="foot">${FOOT}</div></section>`]);
}

// ── 11. Gratitude calendar ──────────────────────────────────────────────────
function gratitude(f: string): string {
  const css = `${GRID_CSS}
  .t11{padding:40px 40px 0}
  .t11 .art{position:absolute;left:0;top:0;width:816px;height:120px}
  .t11 h1{position:relative;margin:0;text-align:center;white-space:nowrap;font-family:Sora;font-weight:800;font-size:33px;color:#7c2d12;line-height:1.05}
  .t11 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:14px;color:#c2410c;letter-spacing:.16em;text-transform:uppercase;margin-top:8px}
  .t11 .sub{position:relative;text-align:center;margin:10px 0 16px;font-size:12px;color:#44403c}
  .t11 .grid{height:770px;gap:5px}
  .t11 .dh{font-size:12px;color:#7c2d12;padding:4px 0}
  .t11 .c{border:1.5px solid #f0c9a6;border-radius:10px;padding:6px 8px;background:#fffaf5}
  .t11 .out{border:0;background:transparent}
  .t11 .out .n{display:none}
  .t11 .n{font-size:17px;color:#7c2d12}
  .t11 .c i{display:block;height:19px;border-bottom:1px solid #f1dccb}
  .t11 .hol{border-color:#b91c1c}
  .t11 .hol .n{color:#b91c1c}
  .t11 .p{display:block;font-size:9px;font-weight:700;color:#b45309;margin:2px 0 1px;min-height:11px}`;
  const prompts = ["a person", "a place", "a meal", "something I learned", "a friend", "my home", "a song", "a memory", "my health", "a teacher", "someone who served", "something funny", "nature", "a book or show",
    "my family", "a small win", "a skill I have", "a tradition", "a kind act", "a smell", "something new", "my neighbors", "a photo", "a helper", "someone far away", "a favorite food", "something I own", "a pet or animal", "a hard day that ended well", "this month"];
  const g = grid({ start: 0, names: DOWFULL, cell: (c) => c.inMonth ? `<span class="n">${c.d}</span><span class="p">${HOL[c.key] ?? `Thankful for ${prompts[c.d - 1]}`}</span><i></i><i></i><i></i>` : `<span class="n">${c.d}</span>` });
  const art = [leaf(36, 44, 24, -20, "#d97706"), leaf(40, 100, 14, 30, "#c2410c"), leaf(780, 44, 24, 20, "#c2410c"), leaf(776, 100, 14, -26, "#d97706")].join("");
  return doc(f, LETTER, css, [`<section class="page t11"><svg class="art" viewBox="0 0 816 120" aria-hidden="true">${art}</svg>
    <h1>November 2026 Gratitude Calendar<span>30 days of thanks</span></h1>
    <p class="sub">Each day has a prompt. Write one thing you are thankful for, from Sunday, Nov. 1 to Thanksgiving on Nov. 26 and the end of the month.</p>
    ${g}<div class="foot">${FOOT}</div></section>`]);
}

// ── 12. Key dates and deadlines ─────────────────────────────────────────────
function keyDates(f: string): string {
  const byKey = new Map(KEY.map((k, i) => [k.key, { ...k, n: i + 1 }]));
  const css = `${GRID_CSS}
  .t12{padding:44px 44px 0}
  .t12 h1{margin:0;font-family:Sora;font-weight:800;font-size:36px;color:#1c1917;line-height:1.1}
  .t12 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:#c2410c;margin-top:6px;letter-spacing:.06em;text-transform:uppercase}
  .t12 .grid{margin-top:16px;height:470px;border:2px solid #1c1917;border-radius:10px;overflow:hidden}
  .t12 .dh{background:#1c1917;color:#fff;font-size:11px;padding:7px 0}
  .t12 .c{border-right:1px solid #e2ddd8;border-top:1px solid #e2ddd8;padding:6px 7px}
  .t12 .c:nth-child(7n){border-right:0}
  .t12 .n{font-size:18px;color:#1c1917}
  .t12 .out .n{color:#cfc6be;font-size:13px}
  .t12 .k{display:flex;align-items:center;gap:4px;margin-top:6px;font-size:9.5px;font-weight:700;line-height:1.15}
  .t12 .k i,.t12 li i{flex:none;display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;color:#fff;font-style:normal;font-size:9.5px;font-family:Sora}
  .t12 ol{list-style:none;margin:14px 0 0;padding:0}
  .t12 li{display:flex;gap:8px;align-items:flex-start;font-size:11.5px;line-height:1.35;padding:4px 0;border-bottom:1px solid #ece7e2;color:#1c1917}
  .t12 .src{margin-top:8px;font-size:9.5px;color:#57534e;line-height:1.4}`;
  const g = grid({ start: 0, names: DOW3, cell: (c) => {
    const k = byKey.get(c.key);
    return `<span class="n">${c.d}</span>${k ? `<span class="k" style="color:${k.color}"><i style="background:${k.color}">${k.n}</i>${k.short}</span>` : ""}`;
  } });
  const list = KEY.map((k, i) => `<li><i style="background:${k.color}">${i + 1}</i><span>${k.long}</span></li>`).join("");
  return doc(f, LETTER, css, [`<section class="page t12"><h1>November 2026 Calendar<span>Key Dates and Deadlines</span></h1>${g}<ol>${list}</ol>
    <p class="src">Source: U.S. Office of Personnel Management (federal holidays); Social Security Administration, Schedule of Social Security Payments 2026; National Institute of Standards and Technology (daylight saving time); HealthCare.gov; Medicare.gov. Black Friday and Cyber Monday are retail dates, not holidays.</p>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 13. Three months: October, November, December 2026 ─────────────────────
function threeMonth(f: string): string {
  const big = (y: number, m: number) => `<div class="mg">${DOW3.map((d) => `<i>${d}</i>`).join("")}${weeksOf(0, y, m).flat().map((c) => `<span class="${c.dow === 0 || c.dow === 6 ? "we" : ""}">${c.inMonth ? c.d : ""}</span>`).join("")}</div>`;
  const css = `${GRID_CSS}
  .t13{padding:44px 44px 0}
  .t13 h1{margin:0;font-family:Sora;font-weight:800;font-size:42px;color:#7c2d12;line-height:1}
  .t13 h1 span{display:block;font-family:Manrope;font-weight:700;font-size:15px;color:#c2410c;margin-top:8px;letter-spacing:.06em;text-transform:uppercase}
  .t13 .grid{margin-top:16px;height:560px;border:2px solid #7c2d12;border-radius:10px;overflow:hidden}
  .t13 .dh{background:#7c2d12;color:#fff;font-size:11px;padding:7px 0}
  .t13 .c{border-right:1px solid #f0d5c2;border-top:1px solid #f0d5c2;padding:6px 8px}
  .t13 .c:nth-child(7n){border-right:0}
  .t13 .n{font-size:20px;color:#431407}
  .t13 .out .n{color:#d6c1b3;font-size:13px}
  .t13 .hol .n,.t13 .h{color:#b91c1c}
  .t13 .h{font-size:10px;margin-top:5px}
  .t13 .h.o{color:#9a3412}
  .t13 .side{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:22px}
  .t13 .side>div{border:1.5px solid #f0d5c2;border-radius:12px;padding:12px 16px}
  .t13 .side b{display:block;font-family:Sora;font-size:16px;color:#7c2d12;margin-bottom:6px}
  .t13 .side .mg{display:grid;grid-template-columns:repeat(7,1fr);row-gap:4px;text-align:center;font-size:13px;font-weight:700;color:#292524}
  .t13 .side i{font-style:normal;font-size:10px;color:#78716c;text-transform:uppercase}
  .t13 .side .we{color:#9a3412}
  .t13 .side small{display:block;margin-top:6px;font-size:10px;color:#57534e}`;
  return doc(f, LETTER, css, [`<section class="page t13"><h1>November 2026 Calendar<span>With October and December 2026</span></h1>${grid({ start: 0, names: DOW3, cell: cellStd })}
    <div class="side"><div><b>October 2026</b>${big(2026, 9)}<small>Columbus Day: Mon., Oct. 12 · Halloween: Sat., Oct. 31</small></div>
    <div><b>December 2026</b>${big(2026, 11)}<small>Christmas Day: Fri., Dec. 25 (federal holiday)</small></div></div>
    <div class="foot">${FOOT}</div></section>`]);
}

// ── 14. Four mini calendars per page ────────────────────────────────────────
function fourUp(f: string): string {
  const one = `<div class="q"><h2>November 2026</h2><div class="mg">${DOW3.map((d) => `<i>${d}</i>`).join("")}${weeksOf(0, Y, M).flat().map((c) => `<span class="${c.dow === 0 || c.dow === 6 ? "we" : ""}${HOL[c.key] ? " hol" : ""}">${c.inMonth ? c.d : ""}</span>`).join("")}</div>
    <p>Veterans Day Nov. 11 · Thanksgiving Nov. 26</p></div>`;
  const css = `
  .t14{padding:44px 40px 0}
  .t14 h1{margin:0 0 4px;text-align:center;font-family:Sora;font-weight:800;font-size:28px;color:#7c2d12}
  .t14 .sub{margin:0 0 16px;text-align:center;font-size:11.5px;color:#44403c}
  .t14 .wrap{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;height:860px;border:1px dashed #a8a29e}
  .t14 .q{padding:26px 30px;border:1px dashed #a8a29e}
  .t14 h2{margin:0 0 12px;font-family:Sora;font-size:24px;color:#7c2d12;text-align:center}
  .t14 .mg{display:grid;grid-template-columns:repeat(7,1fr);row-gap:10px;text-align:center;font-family:Sora;font-weight:700;font-size:19px;color:#292524}
  .t14 i{font-style:normal;font-family:Manrope;font-size:10.5px;color:#78716c;text-transform:uppercase;letter-spacing:.06em}
  .t14 .we{color:#9a3412}
  .t14 .hol{color:#fff;background:#b91c1c;border-radius:50%;width:34px;height:34px;line-height:34px;margin:-6px auto 0}
  .t14 p{margin:16px 0 0;text-align:center;font-size:11px;color:#57534e}`;
  return doc(f, LETTER, css, [`<section class="page t14"><h1>November 2026 Mini Calendars, 4 per Page</h1>
    <p class="sub">Cut along the dashed lines for a planner, a desk, a fridge or a gift tag. Red circles mark the federal holidays.</p>
    <div class="wrap">${one}${one}${one}${one}</div><div class="foot">${FOOT}</div></section>`]);
}

export const NOVEMBER_2026_TEMPLATES: { slug: string; size: typeof LETTER; build: (f: string) => string }[] = [
  { slug: "november-2026-calendar-with-holidays", size: LETTER, build: withHolidays },
  { slug: "november-2026-calendar-landscape", size: LETTER_LANDSCAPE, build: landscape },
  { slug: "november-2026-calendar-monday-start-week-numbers", size: LETTER, build: mondayWeeks },
  { slug: "november-2026-blank-calendar", size: LETTER, build: blank },
  { slug: "november-2026-monthly-planner-with-notes", size: LETTER_LANDSCAPE, build: planner },
  { slug: "november-2026-fall-calendar-autumn-leaves", size: LETTER, build: fall },
  { slug: "november-2026-thanksgiving-calendar", size: LETTER, build: thanksgiving },
  { slug: "november-2026-moon-phase-calendar", size: LETTER, build: moonPhases },
  { slug: "november-2026-coloring-calendar-for-kids", size: LETTER, build: coloring },
  { slug: "november-2026-daily-calendar-list", size: LETTER, build: dailyList },
  { slug: "november-2026-gratitude-calendar", size: LETTER, build: gratitude },
  { slug: "november-2026-calendar-key-dates-deadlines", size: LETTER, build: keyDates },
  { slug: "november-2026-calendar-october-december-2026", size: LETTER, build: threeMonth },
  { slug: "november-2026-mini-calendars-4-per-page", size: LETTER, build: fourUp },
];

/** The hero: a fan of our own sheets with falling leaves on a dusk background, 2400×1350. */
async function buildHero(pub: string): Promise<void> {
  const W = 2400, H = 1350;
  const img = async (slug: string) => `data:image/png;base64,${(await fs.readFile(path.join(pub, `${slug}.png`))).toString("base64")}`;
  const sheets = [
    { slug: "november-2026-gratitude-calendar", x: 1090, y: 250, w: 520, r: -11 },
    { slug: "november-2026-thanksgiving-calendar", x: 1830, y: 230, w: 520, r: 10 },
    { slug: "november-2026-fall-calendar-autumn-leaves", x: 1440, y: 150, w: 600, r: -2 },
  ];
  let paper = "";
  for (const s of sheets) paper += `<img src="${await img(s.slug)}" style="left:${s.x - s.w / 2}px;top:${s.y}px;width:${s.w}px;transform:rotate(${s.r}deg)">`;
  let seed = 1126;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const colors = ["#c2410c", "#d97706", "#b91c1c", "#a16207", "#ea580c", "#f59e0b"];
  let leaves = "";
  for (let i = 0; i < 30; i++) leaves += leaf(rnd() * W, rnd() * H, 16 + rnd() * 44, rnd() * 360, colors[Math.floor(rnd() * colors.length)]).replace("<g ", `<g opacity="${(0.55 + rnd() * 0.45).toFixed(2)}" `);
  const ground = [leaf(260, 1290, 60, -30, "#c2410c"), leaf(420, 1310, 44, 50, "#d97706"), leaf(1900, 1300, 56, 20, "#b91c1c"), leaf(2150, 1285, 40, -60, "#d97706"),
    acorn(1150, 1290, 40, 20, "#a16207", "#5b3a1e"), acorn(1230, 1300, 34, -18, "#a16207", "#5b3a1e"), pumpkin(2280, 1240, 70, "#ea7a2a")].join("");
  const fonts = await fontFaces();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
  html,body{margin:0}body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:radial-gradient(1500px 950px at 70% 35%,#7c3a12 0,#4a1f0c 50%,#26100a 100%);font-family:Manrope}
  svg{position:absolute;inset:0}
  .ground{position:absolute;left:0;right:0;bottom:0;height:200px;background:linear-gradient(180deg,#5b3a1e,#3b2412);border-radius:50% 50% 0 0/60px 60px 0 0}
  img{position:absolute;border-radius:6px;box-shadow:0 40px 80px rgba(0,0,0,.5),0 8px 18px rgba(0,0,0,.3)}
  .kick{position:absolute;left:120px;top:250px;color:#fbbf24;font-family:Sora;font-weight:800;font-size:46px;letter-spacing:.12em;text-transform:uppercase}
  .tile{position:absolute;left:120px;top:340px;width:620px;background:#fff;border-radius:28px;padding:40px 46px;box-shadow:0 30px 60px rgba(0,0,0,.4)}
  .tile .m{font-family:Sora;font-weight:800;font-size:40px;color:#b91c1c;letter-spacing:.14em;text-transform:uppercase}
  .tile .d{font-family:Sora;font-weight:800;font-size:170px;line-height:1;white-space:nowrap;color:#431407;letter-spacing:-.02em}
  .tile .w{font-family:Sora;font-weight:700;font-size:40px;color:#9a3412}
  .tile .s{margin-top:18px;font-size:30px;font-weight:700;color:#44403c}
  .count{position:absolute;left:120px;top:960px;display:flex;align-items:center;gap:22px;color:#fff;font-family:Sora;font-weight:800;font-size:44px}
  .count b{color:#431407;display:inline-flex;align-items:center;justify-content:center;width:110px;height:110px;border-radius:50%;background:#fbbf24;font-size:60px}
  </style></head><body><svg viewBox="0 0 ${W} ${H}">${leaves}</svg>${paper}<div class="ground"></div><svg viewBox="0 0 ${W} ${H}">${ground}</svg>
  <div class="kick">November 2026</div>
  <div class="tile"><div class="m">Thursday</div><div class="d">Nov. 26</div><div class="w">Thanksgiving Day</div><div class="s">30 days · 2 federal holidays</div></div>
  <div class="count"><b>14</b>free printable calendars</div></body></html>`;
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

export async function buildNovember2026Downloads(): Promise<void> {
  const fonts = await fontFaces();
  const list: Printable[] = NOVEMBER_2026_TEMPLATES.map((t) => ({ slug: t.slug, size: t.size, html: t.build(fonts) }));
  await renderPrintables(GROUP, list);
  // WebP previews shown in the story body, each linked to its PDF.
  const pub = path.join(ROOT, "apps/news/public/downloads", GROUP);
  for (const t of NOVEMBER_2026_TEMPLATES) {
    await sharp(path.join(pub, `${t.slug}.png`)).resize({ width: t.size.width > t.size.height ? 1400 : 1100 }).webp({ quality: 82 }).toFile(path.join(pub, `${t.slug}.webp`));
  }
  await buildHero(pub);
}
