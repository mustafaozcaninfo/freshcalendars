/**
 * Heroes and printables for the Oct. 23-24, 2026 /news/ batch: the World Series schedule, DEA
 * Prescription Drug Take Back Day and early voting in Michigan and New York. Original art drawn
 * as HTML/SVG in Chromium: no team logos or uniforms, no agency seals, no party colors.
 * Usage: pnpm fc news-oct24
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";
import { ROOT } from "./paths.js";

const W = 1200, H = 675;
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const frame = (fonts: string, bg: string, body: string) => `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;background:${bg};font-family:Manrope,sans-serif;position:relative}
.t{position:absolute;font-family:Sora;font-weight:800;color:#fff;line-height:1.02;letter-spacing:-.01em}
.k{position:absolute;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase}
.card{position:absolute;border-radius:18px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.28);padding:18px 22px;color:#0f172a}
.card b{display:block;font-family:Sora;font-size:30px;line-height:1.05;margin:2px 0}
.card span{font-size:15px;color:#475569;font-weight:700}
.brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.78)}
</style></head><body>${body}<div class="brand">freshcalendars.com/news</div></body></html>`;

const SH = `<filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter>`;

/** A tear-off calendar card: month band, big day number, weekday. */
const calCard = (x: number, y: number, rot: number, month: string, day: string, dow: string, band: string, ink: string) =>
  `<g transform="translate(${x},${y}) rotate(${rot})" filter="url(#sh)"><rect width="210" height="220" rx="16" fill="#fff"/><rect width="210" height="58" rx="16" fill="${band}"/><rect y="42" width="210" height="16" fill="${band}"/>
  <text x="105" y="40" font-family="Sora" font-size="22" font-weight="800" fill="#fff" text-anchor="middle">${month}</text><text x="105" y="160" font-family="Sora" font-size="100" font-weight="800" fill="${ink}" text-anchor="middle">${day}</text><text x="105" y="200" font-family="Sora" font-size="20" font-weight="800" fill="${band}" text-anchor="middle">${dow}</text></g>`;

/** World Series: a lit ballpark at night seen from above home plate, a ball and an Oct. 23 card. */
function worldSeries(fonts: string): string {
  const r = rng(23);
  const crowd = Array.from({ length: 220 }, () => `<circle cx="${(r() * W).toFixed(0)}" cy="${(250 + r() * 120).toFixed(0)}" r="${(1.5 + r() * 2).toFixed(1)}" fill="#fff" opacity="${(0.15 + r() * 0.35).toFixed(2)}"/>`).join("");
  const lights = [700, 940, 1150].map((x) => `<g transform="translate(${x},70)"><rect x="-3" y="20" width="6" height="140" fill="#334155"/><rect x="-46" y="-6" width="92" height="30" rx="4" fill="#e2e8f0"/>${[0, 1, 2, 3].map((i) => `<circle cx="${-33 + i * 22}" cy="9" r="7" fill="#fef9c3"/>`).join("")}</g><ellipse cx="${x}" cy="80" rx="140" ry="60" fill="#fef9c3" opacity=".12"/>`).join("");
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs>${SH}<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1530"/><stop offset="1" stop-color="#14254a"/></linearGradient><radialGradient id="grass" cx=".5" cy="1" r=".9"><stop offset="0" stop-color="#16a34a"/><stop offset="1" stop-color="#14532d"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>${lights}${crowd}
    <path d="M-50 ${H} Q600 300 1250 ${H}Z" fill="url(#grass)"/>
    <path d="M600 ${H - 20} L840 ${H - 170} L600 ${H - 320} L360 ${H - 170}Z" fill="#b45309" opacity=".9"/><path d="M600 ${H - 70} L790 ${H - 170} L600 ${H - 270} L410 ${H - 170}Z" fill="#15803d"/>
    ${[[600, H - 20], [840, H - 170], [600, H - 320], [360, H - 170]].map(([x, y]) => `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" fill="#fff" transform="rotate(45 ${x} ${y})"/>`).join("")}
    <g transform="translate(1035,470)" filter="url(#sh)"><circle r="70" fill="#f8fafc"/><path d="M-38 -58 q28 58 0 116" stroke="#dc2626" stroke-width="4" fill="none" stroke-dasharray="7 6"/><path d="M38 -58 q-28 58 0 116" stroke="#dc2626" stroke-width="4" fill="none" stroke-dasharray="7 6"/></g>
    ${calCard(860, 140, 5, "OCTOBER", "23", "FRIDAY", "#1d4ed8", "#0b1530")}</svg>`;
  return frame(fonts, "#0b1530", `${svg}
    <div class="k" style="left:64px;top:84px;color:#fde68a">World Series 2026 · Schedule</div>
    <div class="t" style="left:64px;top:118px;font-size:64px;width:600px">Game times and how to watch</div>
    <div class="card" style="left:64px;top:390px;width:450px"><span>Game 1 · Friday, Oct. 23</span><b>8 p.m. ET on FOX</b><span>Rays at Brewers · up to seven games</span></div>`);
}

/** Take Back Day: a collection box with a drop slot, pill bottles and blister packs, an Oct. 24 card. */
function takeBack(fonts: string): string {
  const bottle = (x: number, y: number, rot: number, cap: string, h = 120) => `<g transform="translate(${x},${y}) rotate(${rot})" filter="url(#sh)"><rect x="-38" y="0" width="76" height="${h}" rx="12" fill="#f59e0b" opacity=".92"/><rect x="-42" y="-26" width="84" height="30" rx="8" fill="${cap}"/><rect x="-30" y="${h * 0.3}" width="60" height="${h * 0.42}" rx="6" fill="#fff"/><rect x="-22" y="${h * 0.38}" width="44" height="7" rx="3" fill="#cbd5e1"/><rect x="-22" y="${h * 0.52}" width="30" height="7" rx="3" fill="#cbd5e1"/></g>`;
  const blister = (x: number, y: number, rot: number) => `<g transform="translate(${x},${y}) rotate(${rot})" filter="url(#sh)"><rect width="150" height="90" rx="12" fill="#e2e8f0"/>${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${30 + (i % 3) * 45}" cy="${28 + Math.floor(i / 3) * 34}" rx="16" ry="11" fill="${i === 4 ? "#cbd5e1" : "#fff"}" stroke="#94a3b8" stroke-width="2"/>`).join("")}</g>`;
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs>${SH}<linearGradient id="tb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#064e3b"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#tb)"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${640 + i * 110}" cy="${600 - (i % 2) * 40}" r="${90 + i * 8}" fill="#fff" opacity=".04"/>`).join("")}
    <g transform="translate(700,250)" filter="url(#sh)"><rect width="300" height="360" rx="18" fill="#e2e8f0"/><rect width="300" height="86" rx="18" fill="#cbd5e1"/><rect x="60" y="34" width="180" height="20" rx="10" fill="#0f172a"/>
      <text x="150" y="170" font-family="Sora" font-size="34" font-weight="800" fill="#0f766e" text-anchor="middle">TAKE BACK</text><text x="150" y="210" font-family="Sora" font-size="18" font-weight="800" fill="#475569" text-anchor="middle">UNUSED MEDICINES</text>
      <path d="M110 268 h80 M150 240 v56" stroke="#0f766e" stroke-width="14" stroke-linecap="round"/></g>
    ${bottle(640, 470, -14, "#fff")}${bottle(1080, 470, 10, "#fff", 104)}${blister(800, 140, 16)}
    ${calCard(960, 56, 5, "OCTOBER", "24", "SATURDAY", "#0f766e", "#064e3b")}</svg>`;
  return frame(fonts, "#064e3b", `${svg}
    <div class="k" style="left:64px;top:84px;color:#fde68a">Take Back Day · Oct. 24, 2026</div>
    <div class="t" style="left:64px;top:118px;font-size:62px;width:560px">Where to drop off unused medicines</div>
    <div class="card" style="left:64px;top:410px;width:450px"><span>Saturday, Oct. 24</span><b>10 a.m. to 2 p.m.</b><span>Pills, patches and sealed liquids · free</span></div>`);
}

/** Early voting: a strip of nine calendar days, Oct. 24 to Nov. 1, over a ballot; nonpartisan colors. */
function earlyVoting(fonts: string): string {
  const days = ["SAT 24", "SUN 25", "MON 26", "TUE 27", "WED 28", "THU 29", "FRI 30", "SAT 31", "SUN 1"];
  const strip = days.map((d, i) => { const [dow, n] = d.split(" "), x = 640 + (i % 5) * 104, y = 150 + Math.floor(i / 5) * 128; return `<g transform="translate(${x},${y})" filter="url(#sh)"><rect width="92" height="110" rx="12" fill="#fff"/><rect width="92" height="30" rx="12" fill="${i === 0 ? "#f59e0b" : "#6d28d9"}"/><rect y="18" width="92" height="12" fill="${i === 0 ? "#f59e0b" : "#6d28d9"}"/><text x="46" y="22" font-family="Sora" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">${dow}</text><text x="46" y="84" font-family="Sora" font-size="44" font-weight="800" fill="#1e1b4b" text-anchor="middle">${n}</text></g>`; }).join("");
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs>${SH}<linearGradient id="ev" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#4c1d95"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#ev)"/>${strip}
    <g transform="translate(1160,280)"><text font-family="Sora" font-size="15" font-weight="800" fill="#c4b5fd" text-anchor="end" transform="rotate(90)">OCT. 24 - NOV. 1</text></g>
    <g transform="translate(1066,430) rotate(12)" filter="url(#sh)"><circle r="62" fill="#fff"/><circle r="54" fill="none" stroke="#6d28d9" stroke-width="5"/><text y="-6" font-family="Sora" font-size="22" font-weight="800" fill="#6d28d9" text-anchor="middle">I VOTED</text><text y="20" font-family="Sora" font-size="14" font-weight="800" fill="#334155" text-anchor="middle">EARLY</text></g>
    <g transform="translate(640,440)" filter="url(#sh)"><rect width="320" height="150" rx="14" fill="#fff"/><text x="22" y="40" font-family="Sora" font-size="18" font-weight="800" fill="#1e1b4b">MICHIGAN</text><text x="22" y="66" font-size="14" font-weight="700" fill="#475569">Find sites at the Voter Information Center</text><text x="22" y="104" font-family="Sora" font-size="18" font-weight="800" fill="#1e1b4b">NEW YORK</text><text x="22" y="130" font-size="14" font-weight="700" fill="#475569">Hours set by each county board</text></g></svg>`;
  return frame(fonts, "#1e1b4b", `${svg}
    <div class="k" style="left:64px;top:84px;color:#fde68a">Election 2026 · Early voting</div>
    <div class="t" style="left:64px;top:118px;font-size:60px;width:540px">Early voting starts Oct. 24 in Michigan and New York</div>
    <div class="card" style="left:64px;top:430px;width:450px"><span>Nine days in person</span><b>Oct. 24 to Nov. 1</b><span>Election Day is Tuesday, Nov. 3</span></div>`);
}

export const HEROES_OCT24: [string, (fonts: string) => string][] = [
  ["world-series-2026-schedule-game-times-tv-channel", worldSeries],
  ["dea-drug-take-back-day-october-24-2026-locations", takeBack],
  ["early-voting-starts-october-24-michigan-new-york-2026", earlyVoting],
];

export async function buildOct24(): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [slug, draw] of HEROES_OCT24) {
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
  await renderPrintables("oct24", PRINTABLES(fonts));
}

/** [game, weekday, date, home team, if necessary]: MLB schedule of Oct. 20, 2026; every game 8 p.m. ET on FOX. */
const GAMES: [number, string, string, string, boolean][] = [
  [1, "Friday", "Oct. 23", "Brewers", false], [2, "Saturday", "Oct. 24", "Brewers", false],
  [3, "Monday", "Oct. 26", "Rays", false], [4, "Tuesday", "Oct. 27", "Rays", false],
  [5, "Wednesday", "Oct. 28", "Rays", true], [6, "Friday", "Oct. 30", "Brewers", true],
  [7, "Saturday", "Oct. 31", "Brewers", true],
];

/** World Series schedule and score tracker: one row per game with score boxes, plus a series tally. */
function seriesTracker(fonts: string, ink: boolean): string {
  const c = ink ? { a: "#111827", b: "#374151", soft: "#f3f4f6", line: "#9ca3af", head: "#111827" } : { a: "#1d4ed8", b: "#b91c1c", soft: "#eff6ff", line: "#bfdbfe", head: "#0b1530" };
  const rows = GAMES.map(([g, dow, date, home, maybe]) => `<tr${maybe ? ' class="maybe"' : ""}><td class="g">${g}${maybe ? "*" : ""}</td><td><b>${dow}, ${date}</b><span>${home === "Brewers" ? "Rays at Brewers · Milwaukee" : "Brewers at Rays · Tampa Bay"}</span></td><td>8 p.m. ET<span>FOX</span></td><td class="sc"><i>Rays</i><em></em></td><td class="sc"><i>Brewers</i><em></em></td><td class="sc w"><i>Winner</i><em></em></td></tr>`).join("");
  const css = `
  .ws{padding:34px 40px 0}
  .ws h1{font-family:Sora;font-weight:800;font-size:30px;margin:0;color:${c.head};line-height:1.05}
  .ws .sub{margin:6px 0 16px;font-size:11.5px;color:#374151}
  .ws table{width:100%;border-collapse:separate;border-spacing:0 6px}
  .ws th{font-family:Sora;font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;color:${c.a};text-align:left;padding:0 8px}
  .ws td{background:${c.soft};padding:12px 8px;font-size:11px;vertical-align:middle}
  .ws td:first-child{border-radius:10px 0 0 10px}.ws td:last-child{border-radius:0 10px 10px 0}
  .ws td b{display:block;font-family:Sora;font-size:13px;color:#111827}
  .ws td span{display:block;font-size:10px;color:#4b5563;margin-top:2px}
  .ws td.g{font-family:Sora;font-weight:800;font-size:22px;color:${c.a};width:44px;text-align:center}
  .ws td.sc{width:84px;text-align:center}.ws td.sc i{display:block;font-style:normal;font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#6b7280}
  .ws td.sc em{display:block;height:34px;margin:3px auto 0;width:60px;border:1.6px solid ${c.line};border-radius:6px;background:#fff}
  .ws td.w{width:96px}.ws td.w em{width:78px}
  .ws tr.maybe td{background:#fff;border-top:1.4px dashed ${c.line};border-bottom:1.4px dashed ${c.line}}
  .ws .tally{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px}
  .ws .tally div{border:1.6px solid ${c.line};border-radius:10px;padding:10px 14px}
  .ws .tally b{font-family:Sora;font-size:13px;color:${c.head}}
  .ws .tally p{margin:8px 0 0;display:flex;gap:8px}.ws .tally p span{width:34px;height:34px;border:1.6px solid ${c.line};border-radius:50%;display:inline-block}
  .ws .watch{margin-top:12px;font-size:10.5px;color:#374151;line-height:1.5}
  .ws .notes{margin-top:12px;border:1.6px solid ${c.line};border-radius:10px;padding:10px 14px;height:112px}
  .ws .notes b{font-family:Sora;font-size:13px;color:${c.head}}
  .ws .notes i{display:block;border-bottom:1px solid ${c.line};height:28px;font-style:normal}
  .ws .note{margin-top:8px;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page ws"><h1>World Series 2026 Schedule and Score Tracker</h1>
    <p class="sub">Milwaukee Brewers vs. Tampa Bay Rays · best of seven · every game 8 p.m. Eastern Time (7 p.m. Central) on FOX</p>
    <table><thead><tr><th>Game</th><th>Date and ballpark</th><th>Start</th><th colspan="3">Final score</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tally"><div><b>Rays wins</b><p><span></span><span></span><span></span><span></span></p></div><div><b>Brewers wins</b><p><span></span><span></span><span></span><span></span></p></div></div>
    <div class="notes"><b>Watch party and notes</b><i></i><i></i><i></i></div>
    <p class="watch"><b>How to watch:</b> FOX (English) · FOX Deportes (Spanish, all games) · Univision (Spanish, Game 1) · stream on FOX One · ESPN Radio national radio. *Games 5, 6 and 7 only if necessary. No games Sunday, Oct. 25, or Thursday, Oct. 29.</p>
    <p class="note">Schedule: Major League Baseball, Oct. 20, 2026; broadcast plan: MLB press release, Oct. 16, 2026. Times can change; check MLB.com on game day. Not affiliated with MLB or either club.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/world-series-2026-schedule-game-times-tv-channel/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

/** Take Back Day checklist: bring / leave home, an inventory table and year-round options. */
function cleanout(fonts: string): string {
  const inv = Array.from({ length: 15 }, () => `<tr><td></td><td></td><td class="ck"><span></span></td><td class="ck"><span></span></td></tr>`).join("");
  const css = `
  .tb{padding:34px 40px 0}
  .tb h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:#064e3b;line-height:1.05}
  .tb .sub{margin:6px 0 14px;font-size:11.5px;color:#374151}
  .tb .when{display:flex;gap:10px;margin-bottom:14px}
  .tb .when div{flex:1;background:#ecfdf5;border-radius:10px;padding:10px 12px;font-size:10.5px;color:#065f46}
  .tb .when b{display:block;font-family:Sora;font-size:15px;color:#064e3b}
  .tb .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .tb .box{border:1.6px solid #a7f3d0;border-radius:10px;padding:10px 14px;font-size:11px;color:#1f2937}
  .tb .box.no{border-color:#fecaca}
  .tb .box h2{font-family:Sora;font-size:13px;margin:0 0 6px;color:#064e3b}.tb .box.no h2{color:#991b1b}
  .tb ul{margin:0;padding-left:18px;line-height:1.6}
  .tb table{width:100%;border-collapse:collapse;margin-top:14px;font-size:10.5px}
  .tb th{font-family:Sora;font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;color:#0f766e;text-align:left;padding:6px 8px;border-bottom:2px solid #0f766e}
  .tb td{height:31px;border-bottom:1px solid #d1d5db;padding:0 8px}
  .tb td.ck{width:70px;text-align:center}.tb td.ck span{display:inline-block;width:14px;height:14px;border:1.6px solid #0f766e;border-radius:3px}
  .tb .year{margin-top:12px;font-size:10.5px;color:#374151;line-height:1.55}
  .tb .note{margin-top:8px;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page tb"><h1>Medicine Cabinet Cleanout Checklist</h1>
    <p class="sub">For the Drug Enforcement Administration's 31st National Prescription Drug Take Back Day</p>
    <div class="when"><div><b>Saturday, Oct. 24, 2026</b>10 a.m. to 2 p.m.</div><div><b>4,400+ sites</b>Search dea.gov/takebackday</div><div><b>My site</b>&nbsp;</div></div>
    <div class="cols"><div class="box"><h2>Bring</h2><ul><li>Tablets and capsules</li><li>Patches</li><li>Other prescription medication</li><li>Liquids sealed in their original containers</li></ul></div>
    <div class="box no"><h2>Leave at home</h2><ul><li>Syringes and other sharps</li><li>Illicit drugs</li><li>Vapes, unless the site says yes (batteries out)</li></ul></div></div>
    <table><thead><tr><th>Medicine</th><th>Expires</th><th>Drop off</th><th>Keep</th></tr></thead><tbody>${inv}</tbody></table>
    <p class="year"><b>Missed it?</b> Pharmacy kiosks and other DEA-registered collectors take medicines year-round. With no take-back option nearby, the Food and Drug Administration says: mix medicines with used coffee grounds, dirt or cat litter, seal the mix in a bag, put it in the household trash and scratch out personal information on the packaging. Flush only medicines on the FDA flush list.</p>
    <p class="note">Sources: DEA announcement of Oct. 16, 2026; FDA, "Where and How to Dispose of Unused Medicines." Site addresses and details can change; check the DEA locator before you go.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/dea-drug-take-back-day-october-24-2026-locations/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

/** Early voting plan for Michigan and New York: rules side by side, NYC hours, my plan boxes. */
function votePlan(fonts: string): string {
  const nyc: [string, string][] = [["Sat. Oct. 24", "9-5"], ["Sun. Oct. 25", "9-5"], ["Mon. Oct. 26", "9-5"], ["Tue. Oct. 27", "10-8"], ["Wed. Oct. 28", "10-8"], ["Thu. Oct. 29", "8-4"], ["Fri. Oct. 30", "9-5"], ["Sat. Oct. 31", "9-5"], ["Sun. Nov. 1", "9-5"]];
  const css = `
  .ev{padding:34px 40px 0}
  .ev h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:#1e1b4b;line-height:1.05}
  .ev .sub{margin:6px 0 14px;font-size:11.5px;color:#374151}
  .ev .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .ev .box{border:1.6px solid #ddd6fe;border-radius:10px;padding:12px 16px;font-size:12px;color:#1f2937;line-height:1.6}
  .ev .box h2{font-family:Sora;font-size:14px;margin:0 0 6px;color:#4c1d95}
  .ev .box ul{margin:0;padding-left:16px}
  .ev .nyc{display:grid;grid-template-columns:repeat(9,1fr);gap:5px;margin-top:12px}
  .ev .nyc div{background:#f5f3ff;border-radius:8px;padding:10px 4px;text-align:center;font-size:9px;color:#4c1d95}
  .ev .nyc b{display:block;font-family:Sora;font-size:12px;color:#1e1b4b;margin-top:2px}
  .ev h3{font-family:Sora;font-size:12px;margin:14px 0 0;color:#4c1d95}
  .ev .plan{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:8px}
  .ev .plan div{border:1.6px solid #ddd6fe;border-radius:10px;height:130px;padding:8px 10px;font-size:10px;color:#4c1d95;font-weight:700}
  .ev .keys{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:8px}
  .ev .keys div{border-left:4px solid #6d28d9;background:#faf5ff;padding:8px 10px;font-size:10.5px;color:#374151;border-radius:0 8px 8px 0}
  .ev .keys b{display:block;font-family:Sora;font-size:13px;color:#1e1b4b}
  .ev .bring{margin-top:14px;display:flex;flex-wrap:wrap;gap:8px 18px;font-size:10.5px;color:#1f2937}
  .ev .bring span::before{content:"";display:inline-block;width:12px;height:12px;border:1.6px solid #6d28d9;border-radius:3px;margin-right:6px;vertical-align:-2px}
  .ev .eday{margin-top:16px;background:#1e1b4b;color:#ede9fe;border-radius:12px;padding:16px 18px;font-size:12px;line-height:1.6}
  .ev .eday b{display:block;font-family:Sora;font-size:15px;color:#fff;margin-bottom:4px}
  .ev .note{margin-top:12px;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page ev"><h1>Early Voting Plan 2026: Michigan and New York</h1>
    <p class="sub">Early in-person voting Saturday, Oct. 24 to Sunday, Nov. 1 · Election Day Tuesday, Nov. 3</p>
    <div class="cols"><div class="box"><h2>Michigan</h2><ul><li>Sites open at least 8 hours every day, Oct. 24-Nov. 1; some towns add days</li><li>Find your site and hours: Michigan.gov/Vote</li><li>Bring photo ID, or sign an affidavit and vote</li><li>Register in person at your clerk's office with proof of residency, through 8 p.m. Nov. 3</li><li>Mail ballots must reach your clerk by 8 p.m. Nov. 3</li><li>Election Day polls: 7 a.m.-8 p.m.</li></ul></div>
    <div class="box"><h2>New York</h2><ul><li>Hours set by each county board of elections</li><li>Any site assigned to your county; one assigned site in New York City</li><li>Find your site: voterlookup.elections.ny.gov</li><li>Registration must be received by Oct. 24</li><li>Mail ballots: postmark by Nov. 3, or drop off at an early site or by 9 p.m. Nov. 3</li><li>Election Day polls: 6 a.m.-9 p.m.</li></ul></div></div>
    <h3>New York City early voting hours (all five boroughs)</h3>
    <div class="nyc">${nyc.map(([d, h]) => `<div>${d}<b>${h}</b></div>`).join("")}</div>
    <h3>Key dates</h3>
    <div class="keys"><div><b>Sat., Oct. 24</b>Early voting opens in both states; New York registration deadline</div><div><b>Sun., Nov. 1</b>Last day of early voting in both states</div><div><b>Mon., Nov. 2</b>New York: last day to apply for a mail ballot in person</div><div><b>Tue., Nov. 3</b>Election Day; Michigan mail ballots due to the clerk by 8 p.m.</div></div>
    <h3>My plan</h3>
    <div class="plan"><div>My early voting site</div><div>Day and time I'll go</div><div>Ride / who's coming</div></div>
    <div class="bring"><span>Photo ID (Michigan: or sign an affidavit)</span><span>Sample ballot, marked</span><span>Unreturned mail ballot to drop off</span><span>Water and a charged phone</span></div>
    <div class="eday"><b>Voting on Election Day instead?</b> Tuesday, Nov. 3: Michigan polls 7 a.m.-8 p.m., New York polls 6 a.m.-9 p.m., local time. Your Election Day poll site may differ from your early voting site; look it up again before you go. In Michigan, anyone in line at 8 p.m. can still vote.</div>
    <p class="note">Sources: Michigan Department of State, early voting page and Oct. 20, 2026 release; New York State Board of Elections; NYC Board of Elections. Hours outside New York City vary by county; check your site before you go. Nonpartisan.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/early-voting-starts-october-24-michigan-new-york-2026/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

function PRINTABLES(fonts: string) {
  return [
    { slug: "world-series-2026-schedule-tracker-color", size: LETTER, html: seriesTracker(fonts, false) },
    { slug: "world-series-2026-schedule-tracker-ink", size: LETTER, html: seriesTracker(fonts, true) },
    { slug: "medicine-cabinet-cleanout-checklist-2026", size: LETTER, html: cleanout(fonts) },
    { slug: "early-voting-plan-2026-michigan-new-york", size: LETTER, html: votePlan(fonts) },
  ];
}
