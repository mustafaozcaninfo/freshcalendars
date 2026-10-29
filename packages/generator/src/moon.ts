/**
 * Moon phase printables for /news/ (four independent Fresh Calendars templates).
 *
 *   1. moon-phase-calendar-2027   — the whole year on one landscape page, a Moon drawing for every day
 *   2. full-moon-calendar-2027    — the 12 full moons with traditional names and times in four U.S. zones
 *   3. monthly-moon-calendar-2027 — 12 monthly pages, daily Moon drawings, principal phases with times
 *   4. moon-phases-table-2027     — all principal phases in Eastern Time, eclipses and seasons
 *
 * Phase times come from the U.S. Naval Observatory API snapshot in data/; eclipses from NASA.
 * Daily drawings interpolate the Moon's age between principal phases (Northern Hemisphere view).
 * Usage: pnpm fc news-moon
 */
import fs from "node:fs/promises";
import path from "node:path";
import { LETTER, LETTER_LANDSCAPE, doc, fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";
import { DAY, DOW3, DOWFULL, MON3, MONTHS, daysIn, renderPrintables, utc } from "./printables.js";

const SITE = "freshcalendars.com/news/moon-phases-2027-full-moon-calendar/";
type Phase = { at: Date; kind: "New Moon" | "First Quarter" | "Full Moon" | "Last Quarter" };
const FRACTION = { "New Moon": 0, "First Quarter": 0.25, "Full Moon": 0.5, "Last Quarter": 0.75 } as const;

// U.S. daylight saving time in 2027: Sunday, March 14 to Sunday, Nov. 7, at 2 a.m. local.
const ZONES = [["ET", -5], ["CT", -6], ["MT", -7], ["PT", -8]] as const;
function local(d: Date, std: number): { date: Date; label: string; dst: boolean } {
  const startUtc = Date.UTC(2027, 2, 14, 2 - std), endUtc = Date.UTC(2027, 10, 7, 1 - std);
  const dst = d.getTime() >= startUtc && d.getTime() < endUtc;
  const date = new Date(d.getTime() + (std + (dst ? 1 : 0)) * 3_600_000);
  return { date, label: dst ? "D" : "S", dst };
}
const clock = (d: Date) => { const h = d.getUTCHours(), m = d.getUTCMinutes(); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}`; };
const et = (d: Date) => local(d, -5);
const etZone = (d: Date) => (et(d).dst ? "EDT" : "EST");

// Traditional (Old Farmer's Almanac) names; Harvest Moon is the full moon nearest the September equinox.
const NAMES = ["Wolf Moon", "Snow Moon", "Worm Moon", "Pink Moon", "Flower Moon", "Strawberry Moon", "Buck Moon", "Sturgeon Moon", "Harvest Moon", "Hunter's Moon", "Beaver Moon", "Cold Moon"];

async function loadPhases(): Promise<Phase[]> {
  const raw = JSON.parse(await fs.readFile(path.join(ROOT, "packages/generator/data/usno-moon-phases-2026-12-to-2028-01.json"), "utf8"));
  return raw.phasedata.map((p: any) => {
    const [h, m] = p.time.split(":").map(Number);
    return { at: new Date(Date.UTC(p.year, p.month - 1, p.day, h, m)), kind: p.phase };
  });
}
/** Fraction of the lunation (0 new, .5 full) at instant t, interpolated between principal phases. */
function lunation(phases: Phase[], t: number): number {
  for (let i = 0; i < phases.length - 1; i++) {
    const a = phases[i]!, b = phases[i + 1]!;
    if (t >= a.at.getTime() && t < b.at.getTime()) {
      const fa = FRACTION[a.kind], fb = FRACTION[b.kind] === 0 ? 1 : FRACTION[b.kind];
      return (fa + ((t - a.at.getTime()) / (b.at.getTime() - a.at.getTime())) * (fb - fa)) % 1;
    }
  }
  throw new Error("date outside phase data");
}
/** SVG Moon: lit part on the right while waxing, on the left while waning (Northern Hemisphere). */
function moonSvg(f: number, size: number, dark = "#26324a", lit = "#f4f1e4"): string {
  const r = 50, c = Math.cos(2 * Math.PI * f), rx = Math.abs(c) * r;
  const waxing = f < 0.5;
  const gibbous = c < 0;
  const outer = waxing ? `M0 -50 A50 50 0 0 1 0 50` : `M0 -50 A50 50 0 0 0 0 50`;
  const sweep = waxing ? (gibbous ? 1 : 0) : (gibbous ? 0 : 1);
  const litPath = f < 0.005 || f > 0.995 ? "" : `<path d="${outer} A${rx.toFixed(2)} 50 0 0 ${sweep} 0 -50 Z" fill="${lit}"/>`;
  return `<svg width="${size}" height="${size}" viewBox="-52 -52 104 104" aria-hidden="true"><circle r="${r}" fill="${dark}" stroke="#7d8aa3" stroke-width="2"/>${litPath}</svg>`;
}
const noonEt = (y: number, m: number, d: number) => Date.UTC(y, m, d, 17); // ~noon Eastern

const css0 = `body{background:#0d1630}`;

// ── 1. Year on one page ──────────────────────────────────────────────────────
function yearChart(phases: Phase[], fonts: string): string {
  const principal = new Map<string, Phase>();
  for (const p of phases) { const d = et(p.at).date; principal.set(`${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCFullYear()}`, p); }
  const rows = MONTHS.map((name, m) => {
    const cells: string[] = [];
    for (let d = 1; d <= 31; d++) {
      if (d > daysIn(2027, m)) { cells.push(`<td class="x"></td>`); continue; }
      const p = principal.get(`${m}-${d}-2027`);
      cells.push(`<td class="${p ? (p.kind === "Full Moon" ? "full" : p.kind === "New Moon" ? "new" : "q") : ""}">${moonSvg(lunation(phases, noonEt(2027, m, d)), 29)}</td>`);
    }
    return `<tr><th>${MON3[m]}</th>${cells.join("")}</tr>`;
  }).join("");
  const css = `${css0}
  .m1{padding:30px 30px 0;color:#e8ecf5}
  .m1 h1{font-family:Sora;font-weight:800;font-size:32px;margin:0;color:#fff}
  .m1 h1 span{color:#f5c84c}
  .m1 .sub{margin:4px 0 14px;font-size:11.5px;color:#b7c2d9}
  .m1 table{border-collapse:separate;border-spacing:2px;width:100%;table-layout:fixed}
  .m1 thead th{font-family:Sora;font-weight:700;font-size:9.5px;color:#b7c2d9;padding-bottom:2px}
  .m1 tbody th{font-family:Sora;font-weight:700;font-size:11px;color:#f5c84c;text-align:left;width:34px}
  .m1 td{text-align:center;padding:7px 0;border-radius:6px;background:#152043}
  .m1 td svg{display:block;margin:0 auto}
  .m1 td.full{background:#5a4a12;box-shadow:inset 0 0 0 1.5px #f5c84c}
  .m1 td.new{box-shadow:inset 0 0 0 1.5px #7d8aa3}
  .m1 td.q{background:#1e2c58}
  .m1 td.x{background:transparent}
  .m1 .legend{display:flex;gap:18px;margin-top:12px;font-size:10px;color:#b7c2d9}
  .m1 .legend i{display:inline-block;width:14px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:5px}
  .m1 + .foot,.m1 .foot{color:#b7c2d9}`;
  const page = `<section class="page m1">
    <h1>Moon Phase Calendar <span>2027</span></h1>
    <p class="sub">The Moon on every day of 2027 as seen from the Northern Hemisphere at noon Eastern Time · 12 full moons, 13 new moons</p>
    <table><thead><tr><th></th>${Array.from({ length: 31 }, (_, i) => `<th>${i + 1}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
    <div class="legend"><span><i style="background:#5a4a12;box-shadow:inset 0 0 0 1.5px #f5c84c"></i>Full moon</span><span><i style="box-shadow:inset 0 0 0 1.5px #7d8aa3;background:#152043"></i>New moon</span><span><i style="background:#1e2c58"></i>First or last quarter</span><span>Dates in Eastern Time. Phase times: U.S. Naval Observatory.</span></div>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER_LANDSCAPE, css, [page]);
}

// ── 2. Full moon calendar ────────────────────────────────────────────────────
function fullMoons(phases: Phase[], fonts: string): string {
  const fulls = phases.filter((p) => p.kind === "Full Moon" && et(p.at).date.getUTCFullYear() === 2027);
  const notes: Record<number, string> = {
    1: "Penumbral lunar eclipse, greatest at 6:13 p.m. EST (NASA)",
    6: "Penumbral eclipse so slight it cannot be seen",
    7: "Penumbral lunar eclipse, greatest at 3:14 a.m. EDT (NASA)",
    8: "Nearest full moon to the Sept. 23 equinox",
    9: "First full moon after the Harvest Moon",
  };
  const rows = fulls.map((p, i) => {
    const e = et(p.at).date;
    const times = ZONES.map(([z, off]) => { const l = local(p.at, off); return `<td>${l.date.getUTCDate() !== e.getUTCDate() ? `<small>${MON3[l.date.getUTCMonth()]} ${l.date.getUTCDate()}</small> ` : ""}${clock(l.date)}</td>`; }).join("");
    return `<tr><td class="ic">${moonSvg(0.5, 34, "#26324a", "#f5e6b0")}</td><td class="nm"><b>${NAMES[i]}</b><span>${DOWFULL[e.getUTCDay()]}, ${MONTHS[e.getUTCMonth()]} ${e.getUTCDate()}</span></td>${times}<td class="nt">${notes[i] ?? ""}</td></tr>`;
  }).join("");
  const css = `
  .m2{padding:38px 38px 0}
  .m2 header{display:flex;gap:16px;align-items:center;margin-bottom:16px}
  .m2 h1{font-family:Sora;font-weight:800;font-size:36px;margin:0;color:#1b2547;line-height:1.05}
  .m2 .sub{margin:4px 0 0;font-size:11.5px;color:#37474f}
  .m2 table{width:100%;border-collapse:collapse;font-size:11.4px;font-variant-numeric:tabular-nums}
  .m2 th{background:#1b2547;color:#fff;font-family:Sora;font-weight:700;font-size:9.8px;padding:6px 5px;text-align:left}
  .m2 td{padding:11px 5px;border-bottom:1px solid #e1e5ef;vertical-align:middle;white-space:nowrap}
  .m2 td.ic{width:42px}.m2 td.ic svg{display:block}
  .m2 td.nm b{display:block;font-family:Sora;font-weight:700;font-size:13px;color:#1b2547}
  .m2 td.nm span{font-size:10.8px;color:#5a6b75}
  .m2 td small{font-size:9px;color:#8a5a00;font-weight:700}
  .m2 td.nt{font-size:9.6px;color:#5a6b75;white-space:normal;width:150px;line-height:1.3}
  .m2 tr:nth-child(9) td,.m2 tr:nth-child(10) td{background:#fff7e0}
  .m2 .note{margin-top:12px;font-size:10px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page m2">
    <header>${moonSvg(0.5, 70, "#26324a", "#f5e6b0")}<div><h1>Full Moon Calendar 2027</h1><p class="sub">All 12 full moons of 2027 with their traditional names and the exact time in each U.S. time zone</p></div></header>
    <table><thead><tr><th></th><th>Full moon</th><th>Eastern</th><th>Central</th><th>Mountain</th><th>Pacific</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="note">Times are the instant of full moon from the U.S. Naval Observatory, converted to local standard or daylight time (daylight saving time runs March 14 to Nov. 7, 2027). A date in small type means the full moon falls on a different calendar day in that zone. Names follow the Old Farmer's Almanac; there is no blue moon in 2027.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── 3. Monthly moon calendar (12 pages) ──────────────────────────────────────
function monthly(phases: Phase[], fonts: string): string {
  const byDay = new Map<string, Phase>();
  for (const p of phases) { const d = et(p.at).date; byDay.set(`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`, p); }
  const pages = MONTHS.map((name, m) => {
    const lead = utc(2027, m, 1).getUTCDay();
    const cells: string[] = Array.from({ length: lead }, () => `<div class="c e"></div>`);
    for (let d = 1; d <= daysIn(2027, m); d++) {
      const p = byDay.get(`2027-${m}-${d}`);
      const f = lunation(phases, noonEt(2027, m, d));
      const lit = Math.round(((1 - Math.cos(2 * Math.PI * f)) / 2) * 100);
      cells.push(`<div class="c${p ? " p" : ""}"><b>${d}</b>${moonSvg(f, 40)}<span>${p ? `${p.kind}<br>${clock(et(p.at).date)}` : `${lit}% lit`}</span></div>`);
    }
    while (cells.length % 7) cells.push(`<div class="c e"></div>`);
    const list = phases.filter((p) => { const d = et(p.at).date; return d.getUTCFullYear() === 2027 && d.getUTCMonth() === m; })
      .map((p) => `<li>${moonSvg(FRACTION[p.kind], 16)}<b>${p.kind}</b> ${DOW3[et(p.at).date.getUTCDay()]}, ${MON3[m]} ${et(p.at).date.getUTCDate()} · ${clock(et(p.at).date)} ${etZone(p.at)}</li>`).join("");
    return `<section class="page m3">
      <header><h1>${name} <span>2027</span></h1><p>Moon phases · Eastern Time</p></header>
      <div class="dow">${DOWFULL.map((d) => `<span>${d}</span>`).join("")}</div>
      <div class="grid${cells.length <= 35 ? " r5" : ""}">${cells.join("")}</div>
      <ul>${list}</ul>
      <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
    </section>`;
  });
  const css = `${css0}
  .m3{padding:34px 34px 0;color:#e8ecf5}
  .m3 header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #f5c84c;padding-bottom:8px}
  .m3 h1{font-family:Sora;font-weight:800;font-size:40px;margin:0;color:#fff}.m3 h1 span{color:#f5c84c}
  .m3 header p{margin:0;font-size:12px;color:#b7c2d9}
  .m3 .dow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:12px 0 6px}
  .m3 .dow span{text-align:center;font-family:Sora;font-weight:700;font-size:10px;color:#b7c2d9;text-transform:uppercase;letter-spacing:.06em}
  .m3 .grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:116px;gap:6px}
  .m3 .grid.r5{grid-auto-rows:136px}
  .m3 .c{background:#152043;border-radius:10px;padding:6px;text-align:center;position:relative}
  .m3 .c b{position:absolute;left:8px;top:6px;font-family:Sora;font-weight:700;font-size:13px;color:#fff}
  .m3 .c svg{display:block;margin:20px auto 4px}
  .m3 .c span{font-size:9.4px;color:#b7c2d9;line-height:1.25}
  .m3 .c.p{background:#2a3566;box-shadow:inset 0 0 0 1.5px #f5c84c}.m3 .c.p span{color:#f5c84c;font-weight:700}
  .m3 .c.e{background:transparent;border:1.5px dashed #24305a}
  .m3 ul{list-style:none;margin:14px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;font-size:11.5px}
  .m3 li svg{vertical-align:-3px;margin-right:6px}.m3 li b{color:#f5c84c;margin-right:4px}
  .m3 .foot{color:#b7c2d9}`;
  return doc(fonts, LETTER, css, pages);
}

// ── 4. Table of every principal phase ────────────────────────────────────────
function phaseTable(phases: Phase[], fonts: string): string {
  const year = phases.filter((p) => et(p.at).date.getUTCFullYear() === 2027);
  // One row per lunation, starting from the first new moon of the year.
  const rows: string[] = [];
  const first = year.findIndex((p) => p.kind === "New Moon");
  const lead = year.slice(0, first);
  const cell = (p?: Phase) => p ? `<td>${DOW3[et(p.at).date.getUTCDay()]}, ${MON3[et(p.at).date.getUTCMonth()]} ${et(p.at).date.getUTCDate()}<small>${clock(et(p.at).date)}</small></td>` : `<td class="x">·</td>`;
  if (lead.length) rows.push(`<tr><td class="x">·</td>${["First Quarter", "Full Moon", "Last Quarter"].map((k) => cell(lead.find((p) => p.kind === k))).join("")}</tr>`);
  for (let i = first; i < year.length; i += 4) rows.push(`<tr>${[0, 1, 2, 3].map((j) => cell(year[i + j])).join("")}</tr>`);
  const css = `
  .m4{padding:38px 38px 0}
  .m4 h1{font-family:Sora;font-weight:800;font-size:34px;margin:0;color:#1b2547}
  .m4 .sub{margin:4px 0 14px;font-size:11.5px;color:#37474f}
  .m4 table{width:100%;border-collapse:collapse;font-size:11.6px;font-variant-numeric:tabular-nums;table-layout:fixed}
  .m4 th{background:#1b2547;color:#fff;font-family:Sora;font-weight:700;font-size:10.5px;padding:7px 6px;text-align:left}
  .m4 th svg{vertical-align:-4px;margin-right:6px}
  .m4 td{padding:9.5px 6px;border-bottom:1px solid #e1e5ef}
  .m4 td small{display:inline-block;margin-left:8px;color:#5a6b75}
  .m4 td:nth-child(3){background:#fff7e0;font-weight:700}
  .m4 td.x{color:#7d8dab}
  .m4 h2{font-family:Sora;font-weight:700;font-size:14px;color:#1b2547;margin:16px 0 6px}
  .m4 .two{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .m4 .two li{font-size:11.5px;margin:0 0 6px}.m4 .two ul{padding-left:16px;margin:0}
  .m4 .note{margin-top:12px;font-size:9.8px;color:#5a6b75;line-height:1.45}`;
  const heads = (["New Moon", "First Quarter", "Full Moon", "Last Quarter"] as const).map((k) => `<th>${moonSvg(FRACTION[k], 18, "#3a4a72", "#f5e6b0")}${k}</th>`).join("");
  const page = `<section class="page m4">
    <h1>Moon Phases 2027</h1>
    <p class="sub">Every new moon, first quarter, full moon and last quarter of 2027 in Eastern Time (EST or EDT)</p>
    <table><thead><tr>${heads}</tr></thead><tbody>${rows.join("")}</tbody></table>
    <div class="two">
      <div><h2>Eclipses in 2027 (NASA)</h2><ul>
        <li><b>Feb. 6:</b> annular solar eclipse, South America and West Africa</li>
        <li><b>Feb. 20:</b> penumbral lunar eclipse, 6:13 p.m. EST</li>
        <li><b>July 18:</b> penumbral lunar eclipse, too faint to see</li>
        <li><b>Aug. 2:</b> total solar eclipse, Spain to Egypt, up to 6 min 23 s</li>
        <li><b>Aug. 17:</b> penumbral lunar eclipse, 3:14 a.m. EDT</li></ul></div>
      <div><h2>Seasons in 2027 (Eastern Time)</h2><ul>
        <li><b>March equinox:</b> Saturday, March 20, 4:25 p.m. EDT</li>
        <li><b>June solstice:</b> Monday, June 21, 10:11 a.m. EDT</li>
        <li><b>September equinox:</b> Thursday, Sept. 23, 2:02 a.m. EDT</li>
        <li><b>December solstice:</b> Tuesday, Dec. 21, 9:42 p.m. EST</li></ul></div>
    </div>
    <p class="note">Phase and season times: U.S. Naval Observatory Astronomical Applications Department. Eclipse times: NASA Goddard Space Flight Center. Daylight saving time runs March 14 to Nov. 7, 2027.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildMoonDownloads(): Promise<void> {
  const fonts = await fontFaces();
  const phases = await loadPhases();
  await renderPrintables("moon-phases-2027", [
    { slug: "moon-phase-calendar-2027", size: LETTER_LANDSCAPE, html: yearChart(phases, fonts) },
    { slug: "full-moon-calendar-2027", size: LETTER, html: fullMoons(phases, fonts) },
    { slug: "monthly-moon-calendar-2027", size: LETTER, html: monthly(phases, fonts) },
    { slug: "moon-phases-table-2027", size: LETTER, html: phaseTable(phases, fonts) },
  ]);
}
