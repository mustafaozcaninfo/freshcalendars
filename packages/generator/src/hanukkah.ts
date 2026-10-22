/**
 * Hanukkah 2026 hero, in-story figures and printables for /news/hanukkah-2026-dates-calendar/.
 *
 *   apps/news/src/assets/news/hanukkah-2026-dates-calendar/
 *     hanukkah-2026-dates-calendar.jpg      — hero: a lit menorah on a winter night (2400×1350)
 *     hanukkah-2026-candles-by-night.png    — figure: the eight nights, date and candle count
 *     hanukkah-2026-shabbat-order.png       — figure: Friday and Saturday lighting order
 *   downloads/hanukkah-2026/
 *     1. hanukkah-2026-calendar             — December 2026, Sunday start, the eight nights marked
 *     2. hanukkah-2026-calendar-ink         — same sheet, ink saver
 *     3. hanukkah-2026-calendar-monday      — Monday start
 *     4. hanukkah-2026-eight-nights-planner — candles, check boxes, gifts and meals, Shabbat times
 *
 * Dates: Chabad.org and Hebcal. Shabbat times: Hebcal API, fetched Oct. 22, 2026 (18 min before sunset; Havdalah at nightfall).
 * Usage: pnpm fc news-hanukkah
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { LETTER, doc, fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";
import { renderPrintables } from "./printables.js";

const SLUG = "hanukkah-2026-dates-calendar";
const SITE = `freshcalendars.com/news/${SLUG}/`;
const NAVY = "#14306b", DEEP = "#0b1a3d", GOLD = "#f2b705", SKY = "#3b6fd8", INK = "#15213a";
const SOURCE = "Source: Chabad.org, Jewish Holidays in 2026; Hebcal (Shabbat candles 18 minutes before sunset; Havdalah at nightfall). Exact local times vary by city and community.";

/** Night n begins on the evening of Dec. 3 + n; the holiday ends at nightfall Sat., Dec. 12. */
const NIGHTS = [
  { n: 1, d: 4, dow: "Fri.", note: "Light before Shabbat candles" },
  { n: 2, d: 5, dow: "Sat.", note: "Light after Shabbat ends" },
  { n: 3, d: 6, dow: "Sun.", note: "" },
  { n: 4, d: 7, dow: "Mon.", note: "" },
  { n: 5, d: 8, dow: "Tue.", note: "" },
  { n: 6, d: 9, dow: "Wed.", note: "Rosh Chodesh Tevet begins" },
  { n: 7, d: 10, dow: "Thu.", note: "" },
  { n: 8, d: 11, dow: "Fri.", note: "Light before Shabbat candles" },
];

/** Hebcal Shabbat times, Dec. 4-5 and Dec. 11-12, 2026 (local standard time). */
export const SHABBAT = [
  { city: "New York", fri1: "4:10 p.m.", sat1: "5:14 p.m.", fri2: "4:10 p.m.", sat2: "5:14 p.m." },
  { city: "Chicago", fri1: "4:01 p.m.", sat1: "5:06 p.m.", fri2: "4:01 p.m.", sat2: "5:06 p.m." },
  { city: "Miami", fri1: "5:11 p.m.", sat1: "6:07 p.m.", fri2: "5:12 p.m.", sat2: "6:08 p.m." },
  { city: "Los Angeles", fri1: "4:25 p.m.", sat1: "5:24 p.m.", fri2: "4:26 p.m.", sat2: "5:25 p.m." },
];

/**
 * A nine-branch menorah. Branch candles are added from the right, so night n lights the n rightmost
 * branches; the raised center candle is the shamash. viewBox 0 0 200 150.
 */
export function menorah(lit: number, o: { metal?: string; candle?: string; unlit?: string; glow?: boolean } = {}): string {
  const metal = o.metal ?? GOLD, candle = o.candle ?? "#eef2ff", unlit = o.unlit ?? "rgba(255,255,255,.35)";
  const cx = 100, xs = [16, 37, 58, 79, 121, 142, 163, 184];
  const arms = [1, 2, 3, 4].map((i) => {
    const r = cx - xs[4 - i]!;
    return `<path d="M${cx - r} 78 A${r} ${r * 0.72} 0 0 0 ${cx + r} 78" fill="none" stroke="${metal}" stroke-width="4.2" stroke-linecap="round"/>`;
  }).join("");
  const flame = (x: number, y: number) => `${o.glow ? `<circle cx="${x}" cy="${y - 7}" r="11" fill="${GOLD}" opacity=".22"/>` : ""}<path d="M${x} ${y - 16}c4 5 5.5 9 0 13.5c-5.5-4.5-4-8.5 0-13.5z" fill="#fbbf24"/><path d="M${x} ${y - 10}c2 3 2.2 5 0 7c-2.2-2-2-4 0-7z" fill="#fff7d6"/>`;
  const cand = (x: number, top: number, on: boolean) => `<rect x="${x - 3.6}" y="${top}" width="7.2" height="${78 - top}" rx="1.6" fill="${on ? candle : unlit}"/><rect x="${x - 6}" y="76" width="12" height="4" rx="1.5" fill="${metal}"/>${on ? flame(x, top) : ""}`;
  const branches = xs.map((x, i) => cand(x, 52, i >= 8 - lit)).join("");
  const shamash = `<rect x="${cx - 7}" y="52" width="14" height="5" rx="2" fill="${metal}"/><rect x="${cx - 3.6}" y="30" width="7.2" height="23" rx="1.6" fill="${lit > 0 ? candle : unlit}"/>${lit > 0 ? flame(cx, 30) : ""}`;
  return `<g>${arms}<rect x="${cx - 3}" y="56" width="6" height="80" fill="${metal}"/><path d="M${cx - 30} 146 L${cx - 18} 132 H${cx + 18} L${cx + 30} 146 Z" fill="${metal}"/>${branches}${shamash}</g>`;
}

const stars = (n: number, w: number, h: number, seed = 7) => {
  let s = seed; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: n }, () => `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(0.6 + r() * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`).join("");
};

const dreidel = `<g><rect x="-3" y="-34" width="6" height="14" rx="2" fill="#93c5fd"/><path d="M-20 -22 H20 V8 L0 30 L-20 8 Z" fill="${SKY}"/><path d="M-20 -22 H20 V-14 H-20Z" fill="#60a5fa"/><circle cx="0" cy="0" r="6" fill="#dbeafe"/></g>`;
const coin = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d4a017"/><circle cx="${x}" cy="${y}" r="${r * 0.78}" fill="none" stroke="#fde68a" stroke-width="2"/>`;

function heroHtml(fonts: string): string {
  const W = 1200, H = 675;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}html,body{margin:0}
  body{width:${W}px;height:${H}px;overflow:hidden;font-family:Manrope,sans-serif;position:relative;background:${DEEP}}
  .k{position:absolute;left:64px;top:80px;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:#fde68a}
  .row{position:absolute;left:64px;bottom:88px;display:flex;gap:16px;align-items:stretch}
  .tile{width:118px;border-radius:16px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.4);overflow:hidden;text-align:center;font-family:Sora;transform:rotate(-3deg)}
  .tile i{display:block;font-style:normal;color:#fff;background:${SKY};font-weight:800;font-size:17px;letter-spacing:.12em;padding:7px 0}
  .tile b{display:block;font-size:60px;line-height:1;margin-top:8px;color:${DEEP}}.tile em{display:block;font-style:normal;font-weight:800;font-size:14px;letter-spacing:.14em;padding:4px 0 10px;color:${SKY}}
  .card{width:340px;border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 18px 40px rgba(0,0,0,.4);padding:18px 22px;color:${INK};display:flex;flex-direction:column;justify-content:center}
  .card b{display:block;font-family:Sora;font-size:32px;line-height:1.05;margin:4px 0}.card span{font-size:15px;color:#475569;font-weight:700}
  .brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.75)}</style></head><body>
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1633"/><stop offset=".7" stop-color="#1d3b7a"/><stop offset="1" stop-color="#2c4f96"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fbbf24" stop-opacity=".45"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>${stars(90, W, 420)}
    <circle cx="1080" cy="96" r="34" fill="#f8fafc" opacity=".9"/><circle cx="1094" cy="88" r="30" fill="#0f1f45"/>
    <path d="M0 470 Q300 430 600 470 T1200 455 V675 H0Z" fill="#e2e8f0" opacity=".9"/>
    <rect x="600" y="490" width="480" height="14" rx="6" fill="#94a3b8" opacity=".7"/>
    <ellipse cx="840" cy="300" rx="330" ry="230" fill="url(#glow)"/>
    <g transform="translate(600 140) scale(2.4)">${menorah(8, { glow: true })}</g>
    <g transform="translate(640 560) rotate(-12)">${dreidel}</g>
    ${coin(1010, 590, 20)}${coin(1050, 604, 17)}${coin(985, 618, 15)}
  </svg>
  <div class="k">Hanukkah 2026 · Eight nights</div>
  <div class="row"><div class="tile"><i>DEC</i><b>4</b><em>FRI</em></div>
  <div class="card"><span>First candle at sundown</span><b>Fri., Dec. 4</b><span>Ends at nightfall Sat., Dec. 12</span></div></div>
  <div class="brand">freshcalendars.com/news</div></body></html>`;
}

function candlesFigure(fonts: string): string {
  const W = 1200, H = 640;
  const tiles = NIGHTS.map((x) => `<div class="t${x.note.includes("Shabbat") ? " s" : ""}">
    <b>Night ${x.n}</b><em>${x.dow} Dec. ${x.d}</em>
    <svg viewBox="0 0 200 150" width="200" height="150">${menorah(x.n, { unlit: "#cbd5e1", candle: "#ffffff" })}</svg>
    <span>${x.n} ${x.n === 1 ? "candle" : "candles"} + shamash</span>${x.note ? `<i>${x.note}</i>` : "<i>&nbsp;</i>"}</div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}html,body{margin:0}
  body{width:${W}px;height:${H}px;overflow:hidden;font-family:Manrope,sans-serif;background:linear-gradient(180deg,${DEEP},${NAVY});color:#fff;padding:34px 40px}
  h1{font-family:Sora;font-weight:800;font-size:32px;margin:0}h1 span{color:${GOLD}}
  p{margin:6px 0 20px;color:#c7d2fe;font-size:16px}
  .g{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .t{background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.16);border-radius:16px;padding:12px 14px;text-align:center}
  .t.s{border-color:${GOLD};background:rgba(242,183,5,.12)}
  .t b{display:block;font-family:Sora;font-size:19px}.t em{display:block;font-style:normal;color:#fde68a;font-weight:800;font-size:15px;margin-top:2px}
  .t svg{display:block;margin:4px auto 0;width:170px;height:118px}.t span{display:block;font-size:14px;font-weight:700}.t i{display:block;font-style:normal;font-size:12.5px;color:#fde68a;margin-top:2px}
  .f{position:absolute;right:40px;bottom:14px;font-size:12px;color:rgba(255,255,255,.6)}</style></head><body>
  <h1>Hanukkah 2026: <span>candles by night</span></h1>
  <p>Each night is lit on the evening of the date shown. Candles are added from the right; the newest one is lit first.</p>
  <div class="g">${tiles}</div><div class="f">freshcalendars.com/news · Dates: Chabad.org, Hebcal</div></body></html>`;
}

function shabbatFigure(fonts: string): string {
  const W = 1200, H = 470;
  const step = (when: string, title: string, items: string[], tone: string) => `<div class="c" style="border-top:8px solid ${tone}"><b>${when}</b><h2>${title}</h2><ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}html,body{margin:0}
  body{width:${W}px;height:${H}px;overflow:hidden;font-family:Manrope,sans-serif;background:#f5f7fc;color:${INK};padding:34px 40px}
  h1{font-family:Sora;font-weight:800;font-size:31px;margin:0;color:${NAVY}}p.s{margin:6px 0 22px;color:#475569;font-size:16px}
  .g{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .c{background:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 6px 20px rgba(20,48,107,.08);min-height:290px}
  .c b{font-family:Sora;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:${SKY}}
  .c h2{font-family:Sora;font-size:24px;margin:6px 0 12px;line-height:1.15}
  .c ol{margin:0;padding-left:22px;font-size:16.5px;line-height:1.45}.c li{margin-bottom:9px}
  .f{position:absolute;right:40px;bottom:14px;font-size:12px;color:#64748b}</style></head><body>
  <h1>Hanukkah meets Shabbat twice in 2026</h1>
  <p class="s">Nights 1 and 8 fall on Friday, and night 2 begins on Saturday evening. New York times from Hebcal.</p>
  <div class="g">
  ${step("Fri., Dec. 4 · Night 1", "Menorah first, then Shabbat", ["Light the menorah before Shabbat candles", "Use candles or oil that burn until at least 30 minutes after nightfall", "Shabbat candles: 4:10 p.m. in New York"], GOLD)}
  ${step("Sat., Dec. 5 · Night 2", "Wait until Shabbat ends", ["Shabbat ends after nightfall: 5:14 p.m. in New York", "Havdalah, then light two candles plus the shamash", "The menorah is not lit or moved during Shabbat"], SKY)}
  ${step("Fri., Dec. 11 · Night 8", "All eight, before sunset", ["Light all eight candles plus the shamash", "Again, before Shabbat candles at 4:10 p.m. in New York", "Hanukkah ends at nightfall Sat., Dec. 12"], NAVY)}
  </div><div class="f">freshcalendars.com/news · Sources: Chabad.org, Hebcal</div></body></html>`;
}

/** December 2026 grid. Dec. 1, 2026 is a Tuesday. */
function calendarSheet(fonts: string, o: { monday?: boolean; ink?: boolean }): string {
  const ink = !!o.ink, accent = ink ? "#1f2937" : NAVY, soft = ink ? "#ffffff" : "#eef3ff";
  const head = o.monday ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const lead = o.monday ? 1 : 2;
  const cells: string[] = [];
  for (let i = 0; i < lead; i++) cells.push(`<div class="c e"></div>`);
  for (let d = 1; d <= 31; d++) {
    const night = NIGHTS.find((x) => x.d === d);
    let body = "";
    if (night) body = `<svg viewBox="0 0 200 150">${menorah(night.n, ink ? { metal: "#6b7280", candle: "#fff", unlit: "#e5e7eb" } : { unlit: "#d6def0", candle: "#fff" })}</svg><b>Night ${night.n}</b><span>${night.n} + shamash · at sundown</span>`;
    if (d === 12) body = `<b>Hanukkah ends</b><span>at nightfall</span>`;
    if (d === 25) body = `<b>Christmas Day</b><span>federal holiday</span>`;
    cells.push(`<div class="c${night ? " h" : ""}${night?.note.includes("Shabbat") ? " sh" : ""}"><i>${d}</i>${body}</div>`);
  }
  while (cells.length % 7) cells.push(`<div class="c e"></div>`);
  const rows = cells.length / 7;
  const css = `
  .hk{padding:34px 36px 0}
  .hk header{display:flex;align-items:center;gap:16px;${ink ? `border-bottom:3px solid ${accent};padding:0 0 12px` : `background:${DEEP};color:#fff;border-radius:16px;padding:14px 22px`};margin-bottom:14px}
  .hk header svg{width:92px;height:69px;flex:none}
  .hk h1{font-family:Sora;font-weight:800;font-size:34px;margin:0;line-height:1.05;color:${ink ? accent : "#fff"}}.hk h1 span{color:${ink ? accent : GOLD}}
  .hk header p{margin:5px 0 0;font-size:12.5px;color:${ink ? "#374151" : "#c7d2fe"}}
  .hk .dow{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:5px}
  .hk .dow div{font-family:Sora;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.08em;text-align:center;color:${accent}}
  .hk .grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:${rows > 5 ? 112 : 132}px;gap:5px}
  .hk .c{border:1.4px solid ${ink ? "#9ca3af" : "#c9d5ee"};border-radius:9px;padding:5px 6px;position:relative;overflow:hidden;background:#fff}
  .hk .c.e{border-style:dashed;opacity:.45}
  .hk .c.h{background:${soft};border-color:${ink ? "#374151" : SKY}}.hk .c.sh{border-width:2.4px}
  .hk .c i{font-style:normal;font-family:Sora;font-weight:800;font-size:15px;color:${accent}}
  .hk .c svg{display:block;width:84px;height:60px;margin:0 auto}
  .hk .c b{display:block;font-family:Sora;font-size:11px;text-align:center;color:${accent};line-height:1.15}
  .hk .c span{display:block;font-size:8.6px;text-align:center;color:#475569;line-height:1.2}
  .hk .c:not(.h) b{text-align:left;margin-top:8px}.hk .c:not(.h) span{text-align:left}
  .hk .key{display:grid;grid-template-columns:1.25fr 1fr;gap:14px;margin-top:12px}
  .hk .box{border:1.4px solid ${ink ? "#9ca3af" : "#c9d5ee"};border-radius:10px;padding:9px 12px;font-size:10.6px;line-height:1.45}
  .hk .box h2{font-family:Sora;font-size:12.5px;margin:0 0 4px;color:${accent}}
  .hk .lines div{border-bottom:1px solid #cbd5e1;height:21px}
  .hk .note{font-size:9.2px;color:#475569;margin-top:8px;line-height:1.4}`;
  const page = `<section class="page hk">
    <header><svg viewBox="0 0 200 150">${menorah(8, ink ? { metal: accent, candle: "#fff", unlit: "#e5e7eb" } : {})}</svg>
    <div><h1>Hanukkah <span>2026</span> Calendar</h1><p>December 2026 · First candle at sundown Friday, Dec. 4 · Holiday ends at nightfall Saturday, Dec. 12<br>25 Kislev to 2 Tevet 5787 on the Hebrew calendar</p></div></header>
    <div class="dow">${head.map((h) => `<div>${h}</div>`).join("")}</div>
    <div class="grid">${cells.join("")}</div>
    <div class="key">
      <div class="box"><h2>Friday and Saturday nights</h2>Fri., Dec. 4 and Fri., Dec. 11: light the menorah before Shabbat candles, with candles that burn until at least 30 minutes after nightfall. Sat., Dec. 5: light after Shabbat ends and Havdalah. Candles are added from the right; light the newest one first.</div>
      <div class="box lines"><h2>Family plans</h2><div></div><div></div><div></div><div></div></div>
    </div>
    <p class="note">${SOURCE} Hanukkah is not a federal holiday; schools and offices follow their own calendars.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

function plannerSheet(fonts: string): string {
  const css = `
  .pl{padding:34px 38px 0}
  .pl header{display:flex;align-items:center;gap:14px;border-bottom:4px solid ${GOLD};padding-bottom:10px;margin-bottom:12px}
  .pl header svg{width:84px;height:63px;flex:none}
  .pl h1{font-family:Sora;font-weight:800;font-size:29px;margin:0;color:${NAVY};line-height:1.1}
  .pl .sub{margin:3px 0 0;font-size:12px;color:#475569}
  .pl table{width:100%;border-collapse:collapse;font-size:11.4px}
  .pl th{background:${NAVY};color:#fff;font-family:Sora;font-size:10px;padding:7px 6px;text-align:left}
  .pl td{padding:0 6px;height:60px;border-bottom:1px solid #d6def0;vertical-align:middle}
  .pl tr:nth-child(even) td{background:#f5f7fc}
  .pl td.n{font-family:Sora;font-weight:800;color:${NAVY};width:58px}
  .pl td.d b{display:block}.pl td.d small{color:#64748b;font-size:9.6px}
  .pl td.k{width:48px;text-align:center}.pl td.k i{display:inline-block;width:18px;height:18px;border:2px solid ${NAVY};border-radius:4px}
  .pl td.w{width:150px}
  .pl h2{font-family:Sora;font-size:14px;color:${NAVY};margin:14px 0 6px}
  .pl .two{display:grid;grid-template-columns:1.3fr 1fr;gap:14px}
  .pl .two table td{height:27px;font-variant-numeric:tabular-nums}
  .pl ul{list-style:none;margin:0;padding:0;columns:2;font-size:11.4px}.pl li{margin:0 0 7px}.pl li::before{content:"";display:inline-block;width:12px;height:12px;border:1.6px solid ${NAVY};border-radius:3px;margin-right:7px;vertical-align:-2px}
  .pl .lines div{border-bottom:1px solid #cbd5e1;height:26px}
  .pl .note{font-size:9.2px;color:#475569;margin-top:10px;line-height:1.4}`;
  const rows = NIGHTS.map((x) => `<tr><td class="n">Night ${x.n}</td><td class="d"><b>${x.dow} Dec. ${x.d}</b><small>${x.note || "at sundown"}</small></td><td>${x.n} + shamash<br><small style="color:#64748b">${(x.n * (x.n + 1)) / 2 + x.n} used so far</small></td><td class="k"><i></i></td><td class="w"></td><td class="w"></td></tr>`).join("");
  const shabbat = SHABBAT.map((c) => `<tr><td><b>${c.city}</b></td><td>${c.fri1}</td><td>${c.sat1}</td><td>${c.fri2}</td><td>${c.sat2}</td></tr>`).join("");
  const page = `<section class="page pl">
    <header><svg viewBox="0 0 200 150">${menorah(8, {})}</svg><div><h1>Hanukkah 2026 Eight Nights Planner</h1><p class="sub">Dec. 4 to Dec. 12, 2026 · tick each night, plan gifts, meals and guests</p></div></header>
    <table><thead><tr><th>Night</th><th>Evening of</th><th>Candles</th><th>Lit</th><th>Gifts</th><th>Meal and guests</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="two">
      <div><h2>Shabbat times during Hanukkah</h2><table><thead><tr><th>City</th><th>Fri. 12/4 candles</th><th>Sat. 12/5 ends</th><th>Fri. 12/11 candles</th><th>Sat. 12/12 ends</th></tr></thead><tbody>${shabbat}</tbody></table></div>
      <div><h2>Before Dec. 4</h2><ul><li>44 candles (36 + 8 shamash)</li><li>Menorah, oil or wicks</li><li>Tray or foil for drips</li><li>Dreidels</li><li>Chocolate gelt</li><li>Potatoes, onions, oil</li><li>Applesauce, sour cream</li><li>Jelly doughnuts</li><li>Gift wrap</li><li>Matches</li></ul></div>
    </div>
    <h2>Notes</h2><div class="lines"><div></div><div></div></div>
    <p class="note">${SOURCE} Night 1 lights 1 candle plus the shamash and night 8 lights all 8, so a box of 44 covers the holiday.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

async function shot(html: string, w: number, h: number): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    return await page.screenshot({ type: "png" });
  } finally {
    await browser.close();
  }
}

export async function buildHanukkahDownloads(): Promise<void> {
  const fonts = await fontFaces();
  const dir = path.join(ROOT, "apps/news/src/assets/news", SLUG);
  await fs.mkdir(dir, { recursive: true });
  await sharp(await shot(heroHtml(fonts), 1200, 675)).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${SLUG}.jpg`));
  await fs.writeFile(path.join(dir, "hanukkah-2026-candles-by-night.png"), await shot(candlesFigure(fonts), 1200, 640));
  await fs.writeFile(path.join(dir, "hanukkah-2026-shabbat-order.png"), await shot(shabbatFigure(fonts), 1200, 560));
  console.log(`hero and figures: apps/news/src/assets/news/${SLUG}/`);
  await renderPrintables("hanukkah-2026", [
    { slug: "hanukkah-2026-calendar", size: LETTER, html: calendarSheet(fonts, {}) },
    { slug: "hanukkah-2026-calendar-ink", size: LETTER, html: calendarSheet(fonts, { ink: true }) },
    { slug: "hanukkah-2026-calendar-monday", size: LETTER, html: calendarSheet(fonts, { monday: true }) },
    { slug: "hanukkah-2026-eight-nights-planner", size: LETTER, html: plannerSheet(fonts) },
  ]);
}
