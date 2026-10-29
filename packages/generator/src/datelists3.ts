/**
 * Third batch of /news/ printables (Oct. 20, 2026): sunset times after the clock change, the
 * Hunter's Moon phase calendar, the 2027 federal tax calendar, late-October dates and winter
 * break 2026. Sun and moon times are U.S. Naval Observatory data saved in data/usno-2026-27.json
 * (local clock time); nothing astronomical is computed here, only drawn.
 * Usage: pnpm fc news-datelists3
 */
import { readFileSync } from "node:fs";
import { LETTER, doc, fontFaces } from "./julian.js";
import { list, type Row } from "./datelists.js";
import { ap, dow } from "./datelists2.js";
import { renderPrintables } from "./printables.js";

type Day = { rise: string | null; set: string | null; mrise: string | null; mset: string | null; illum: string; phase: string; tz: number };
type CityDays = Record<string, Record<string, Day>>;
const USNO = JSON.parse(readFileSync(new URL("./data/usno-2026-27.json", import.meta.url), "utf8")) as { cities: CityDays; earliest: CityDays; series: CityDays };

const min = (t: string) => { const [h, m] = t.split(":").map(Number); return h! * 60 + m!; };
/** "17:53" → "5:53 p.m." */
export const clock = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h! + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h! < 12 ? "a.m." : "p.m."}`; };
const span = (a: string, b: string) => { const d = min(b) - min(a); return `${Math.floor(d / 60)} h ${String(d % 60).padStart(2, "0")} m`; };
const r = (iso: string, what: string, kind?: Row["kind"]): Row => ({ date: ap(iso, 2026), day: dow(iso), what, kind });

/** First and last day on which a city's sunset reaches its earliest clock minute (Nov. 1-Dec. 22 for Miami, Houston and Honolulu; Nov. 22-Dec. 22 elsewhere). */
export function earliestSunset(city: string): { from: string; to: string; time: string } {
  const days = Object.entries(USNO.earliest[city]!).filter(([, v]) => v.set).sort(([a], [b]) => a.localeCompare(b));
  const best = Math.min(...days.map(([, v]) => min(v.set!)));
  const hits = days.filter(([, v]) => min(v.set!) === best).map(([d]) => d);
  return { from: hits[0]!, to: hits.at(-1)!, time: days.find(([, v]) => min(v.set!) === best)![1].set! };
}
export const SUN_CITIES = Object.keys(USNO.cities);
export const sun = (city: string, iso: string) => USNO.cities[city]![iso]!;

// ── Sunset sheet: chart of five cities + table of 20 ─────────────────────────
function sunsetSheet(fonts: string): string {
  const S = USNO.series;
  const series = ["New York", "Chicago", "Denver", "Los Angeles", "Miami"];
  const colors = ["#0f4c81", "#c2410c", "#7c3aed", "#0f766e", "#b91c1c"];
  const dates = Object.keys(S["New York"]!).sort();
  const W = 748, H = 290, L = 52, R = 14, T = 14, B = 34;
  const y0 = min("15:45"), y1 = min("19:15");
  const x = (i: number) => L + (i / (dates.length - 1)) * (W - L - R);
  const y = (m: number) => T + (1 - (m - y0) / (y1 - y0)) * (H - T - B);
  const grid = [];
  for (let m = 16 * 60; m <= 19 * 60; m += 30) grid.push(`<line x1="${L}" x2="${W - R}" y1="${y(m)}" y2="${y(m)}" stroke="#e3e8ee"/><text x="${L - 6}" y="${y(m) + 3.5}" text-anchor="end">${clock(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`).replace(" p.m.", "")}</text>`);
  const months = dates.map((d, i) => [d, i] as const).filter(([d]) => d.endsWith("-01")).map(([d, i]) => `<line x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}" stroke="#cfd8e3"/><text x="${x(i) + 4}" y="${H - B + 16}">${ap(d).split(" ")[0]}</text>`);
  const dst = dates.indexOf("2026-11-01");
  const sol = dates.indexOf("2026-12-21");
  const lines = series.map((c, k) => {
    const pts = dates.map((d, i) => `${x(i).toFixed(1)},${y(min(S[c]![d]!.set!)).toFixed(1)}`);
    // Break the line at the clock change so the one-hour drop reads as a step, not a slope.
    const a = pts.slice(0, dst).join(" "), b = pts.slice(dst).join(" ");
    const e = earliestSunset(c);
    const ei = dates.indexOf(e.from);
    return `<polyline fill="none" stroke="${colors[k]}" stroke-width="2.4" points="${a}"/><polyline fill="none" stroke="${colors[k]}" stroke-width="2.4" points="${b}"/>
      <line x1="${x(dst - 1)}" x2="${x(dst)}" y1="${y(min(S[c]![dates[dst - 1]!]!.set!))}" y2="${y(min(S[c]![dates[dst]!]!.set!))}" stroke="${colors[k]}" stroke-width="1.2" stroke-dasharray="3 3"/>
      <circle cx="${x(ei)}" cy="${y(min(e.time))}" r="3.6" fill="#fff" stroke="${colors[k]}" stroke-width="2"/>`;
  });
  const legend = series.map((c, k) => `<span><i style="background:${colors[k]}"></i>${c}</span>`).join("");
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Manrope" font-size="10" fill="#37474f">
    ${grid.join("")}${months.join("")}
    <rect x="${x(dst) - 1}" y="${T}" width="2" height="${H - T - B}" fill="#f59e0b"/>
    <text x="${x(dst) + 6}" y="${T + 12}" fill="#b45309" font-weight="700">Nov. 1: clocks fall back, sunset 1 hour earlier</text>
    <line x1="${x(sol)}" x2="${x(sol)}" y1="${T}" y2="${H - B}" stroke="#64748b" stroke-dasharray="4 3"/>
    <text x="${x(sol) + 4}" y="${H - B - 6}" fill="#475569">Dec. 21 solstice</text>
    ${lines.join("")}</svg>`;
  const rows = SUN_CITIES.map((c) => {
    const e = earliestSunset(c), s = sun(c, "2026-12-21");
    const range = e.from === e.to ? ap(e.from) : `${ap(e.from)}–${e.from.slice(5, 7) === e.to.slice(5, 7) ? Number(e.to.slice(8)) : ap(e.to)}`;
    return `<tr><td class="c">${c}</td><td>${clock(sun(c, "2026-10-31").set!)}</td><td class="hi">${clock(sun(c, "2026-11-01").set!)}</td><td>${clock(e.time)}<small>${range}</small></td><td>${clock(s.rise!)}</td><td>${clock(s.set!)}</td><td>${span(s.rise!, s.set!)}</td></tr>`;
  }).join("");
  const css = `
  .ss{padding:28px 34px 0}
  .ss h1{font-family:Sora;font-weight:800;font-size:27px;margin:0;color:#0f2a4a;line-height:1.1}
  .ss .sub{margin:5px 0 8px;font-size:11px;color:#37474f}
  .ss .lg{display:flex;gap:14px;font-size:10.5px;margin:0 0 2px}
  .ss .lg i{display:inline-block;width:14px;height:4px;border-radius:2px;margin-right:5px;vertical-align:middle}
  .ss table{width:100%;border-collapse:collapse;font-size:10px;font-variant-numeric:tabular-nums;margin-top:6px}
  .ss th{background:#0f2a4a;color:#fff;font-family:Sora;font-size:8.6px;padding:5px 5px;text-align:left;line-height:1.2}
  .ss td{padding:6.4px 5px;border-bottom:1px solid #e3e8ee;line-height:1.15}
  .ss td.c{font-weight:700}
  .ss td.hi{background:#fff7e6;font-weight:700;color:#9a3412}
  .ss small{font-size:8.2px;color:#64748b;margin-left:5px}
  .ss .note{margin-top:8px;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page ss"><h1>Sunset Times After the Clock Change, 2026</h1>
    <p class="sub">Local clock time · U.S. daylight saving time ends Sunday, Nov. 1, 2026 · open circles mark each city's earliest sunset</p>
    <div class="lg">${legend}</div>${svg}
    <table><thead><tr><th>City</th><th>Sunset<br>Sat., Oct. 31</th><th>Sunset<br>Sun., Nov. 1</th><th>Earliest sunset<br>time · dates</th><th>Sunrise<br>Dec. 21</th><th>Sunset<br>Dec. 21</th><th>Daylight<br>Dec. 21</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="note">Phoenix and Honolulu do not change clocks, so their sunset moves only a minute. Source: U.S. Naval Observatory Astronomical Applications Department, rise/set data for each city center. Times can differ by a minute or two across a metro area.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/sunset-times-after-daylight-saving-time-ends-2026/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── Moon sheet: phase calendar Oct. 18-Nov. 28 + moonrise table ──────────────
/** SVG path of the lit part of the Moon as seen from the Northern Hemisphere. */
export function moonPath(cx: number, cy: number, rad: number, f: number, waxing: boolean): string {
  if (f >= 0.995) return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="#fde68a"/>`;
  if (f <= 0.005) return "";
  const k = (rad * Math.abs(1 - 2 * f)).toFixed(2);
  const top = `${cx},${cy - rad}`, bot = `${cx},${cy + rad}`;
  const d = waxing
    ? `M${top} A${rad},${rad} 0 0 1 ${bot} A${k},${rad} 0 0 ${f > 0.5 ? 1 : 0} ${top}Z`
    : `M${top} A${rad},${rad} 0 0 0 ${bot} A${k},${rad} 0 0 ${f > 0.5 ? 0 : 1} ${top}Z`;
  return `<path d="${d}" fill="#fde68a"/>`;
}
function moonSheet(fonts: string): string {
  const NY = USNO.series["New York"]!;
  const start = Date.UTC(2026, 9, 18);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const iso = new Date(start + i * 864e5).toISOString().slice(0, 10);
    const d = NY[iso]!;
    const f = parseInt(d.illum) / 100;
    const waxing = /Waxing|First|New/.test(d.phase) && !/Full/.test(d.phase);
    const tag = iso === "2026-10-26" ? "Hunter's Moon" : iso === "2026-10-31" ? "Halloween" : iso === "2026-11-09" ? "New Moon" : iso === "2026-11-01" ? "Last Quarter" : iso === "2026-11-17" ? "First Quarter" : iso === "2026-11-24" ? "Beaver Moon" : "";
    cells.push(`<div class="cell${tag ? " tag" : ""}${iso === "2026-10-26" ? " full" : ""}"><b>${Number(iso.slice(8))}${iso.endsWith("-01") || i === 0 ? ` ${ap(iso).split(" ")[0]}` : ""}</b>
      <svg viewBox="0 0 60 60" width="56" height="56"><circle cx="30" cy="30" r="24" fill="#1e293b"/>${moonPath(30, 30, 24, f, waxing)}<circle cx="30" cy="30" r="24" fill="none" stroke="#475569" stroke-width="1"/></svg>
      ${tag ? `<em>${tag} · ${d.illum}</em>` : `<span>${d.illum}</span>`}</div>`);
  }
  const rise = SUN_CITIES.map((c) => `<tr><td class="c">${c}</td><td>${clock(sun(c, "2026-10-25").mrise!)}</td><td>${clock(sun(c, "2026-10-26").mrise!)}</td><td>${clock(sun(c, "2026-10-25").set!)}</td></tr>`);
  const half = Math.ceil(rise.length / 2);
  const tbl = (x: string[]) => `<table><thead><tr><th>City</th><th>Moonrise Sun. 10/25</th><th>Moonrise Mon. 10/26</th><th>Sunset 10/25</th></tr></thead><tbody>${x.join("")}</tbody></table>`;
  const css = `
  .mn{padding:28px 32px 0;background:linear-gradient(#0b1530,#13234a 64.5%,#fff 64.5%)}
  .mn h1{font-family:Sora;font-weight:800;font-size:30px;margin:0;color:#fde68a;line-height:1.05}
  .mn .sub{margin:5px 0 12px;font-size:11px;color:#cbd5e1}
  .mn .times{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:0 0 12px}
  .mn .times div{background:#ffffff14;border:1px solid #ffffff2e;border-radius:6px;padding:6px 8px;color:#e2e8f0;font-size:9.5px}
  .mn .times b{display:block;font-family:Sora;font-size:13px;color:#fff}
  .mn .wk{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;color:#94a3b8;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;text-align:center}
  .mn .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
  .mn .cell{background:#0f1d3d;border:1px solid #23345e;border-radius:6px;height:83px;position:relative;text-align:center;color:#cbd5e1;font-size:8.5px;padding-top:2px}
  .mn .cell b{position:absolute;left:5px;top:3px;font-size:9.5px;color:#fff}
  .mn .cell svg{margin-top:9px}
  .mn .cell span{display:block;margin-top:-1px}
  .mn .cell em{position:absolute;left:0;right:0;bottom:4px;font-style:normal;font-weight:700;color:#fde68a;font-size:8px}
  .mn .cell.full{border:2px solid #fde68a;background:#1b2b55}
  .mn h2{font-family:Sora;font-size:13px;margin:18px 0 4px;color:#0f2a4a}
  .mn .cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .mn table{width:100%;border-collapse:collapse;font-size:9.4px;font-variant-numeric:tabular-nums}
  .mn th{background:#13234a;color:#fff;font-family:Sora;font-size:8px;padding:4px;text-align:left}
  .mn td{padding:3.1px 4px;border-bottom:1px solid #e3e8ee}
  .mn td.c{font-weight:700}
  .mn .note{margin-top:6px;font-size:8.6px;color:#5a6b75;line-height:1.4}`;
  const page = `<section class="page mn"><h1>Hunter's Moon 2026 · Moon Phase Calendar</h1>
    <p class="sub">Full moon Monday, Oct. 26, 2026 at 12:12 a.m. EDT · daily illumination, Oct. 18 to Nov. 28 · local times from the U.S. Naval Observatory</p>
    <div class="times"><div><b>12:12 a.m.</b>EDT Mon., Oct. 26</div><div><b>11:12 p.m.</b>CDT Sun., Oct. 25</div><div><b>10:12 p.m.</b>MDT Sun., Oct. 25</div><div><b>9:12 p.m.</b>PDT Sun., Oct. 25</div><div><b>Nov. 24</b>Beaver Moon, 9:53 a.m. EST</div></div>
    <div class="wk"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
    <div class="grid">${cells.join("")}</div>
    <h2>Moonrise on the two best viewing nights</h2>
    <div class="cols">${tbl(rise.slice(0, half))}${tbl(rise.slice(half))}</div>
    <p class="note">Illumination is the share of the Moon's disk lit at midnight Eastern Time, drawn as seen from the Northern Hemisphere. Source: U.S. Naval Observatory Astronomical Applications Department (moon phases and rise/set data for each city center).</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/hunters-moon-october-2026-full-moon-time/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── 2027 tax calendar ──────────────────────────────────────────────────────────
const TAX_2027: Row[] = [
  { ...r("2027-01-15", "Fourth-quarter 2026 estimated tax payment (Form 1040-ES)"), kind: "key" },
  r("2027-02-01", "Forms W-2 to employees and SSA; Form 1099-NEC to recipients and IRS; most 1099 recipient copies; Form 940; fourth-quarter 2026 Form 941 (Jan. 31 is a Sunday)"),
  r("2027-02-16", "Recipient copies of Forms 1099-B and 1099-S, and 1099-MISC with amounts in box 8 or 10 (Feb. 15 is Presidents' Day)"),
  r("2027-03-01", "Paper Forms 1099 and 1096 to the IRS (Feb. 28 is a Sunday)"),
  { ...r("2027-03-15", "Partnership (Form 1065) and S corporation (Form 1120-S) returns or extensions; Schedules K-1"), kind: "half" },
  r("2027-03-31", "Electronically filed Forms 1099 to the IRS"),
  { ...r("2027-04-15", "Tax Day: Form 1040, Form 4868 extension, 2026 IRA and HSA contributions, first-quarter 2027 estimate, calendar-year Form 1120, FBAR (FinCEN 114)"), kind: "off" },
  r("2027-04-30", "First-quarter 2027 Form 941"),
  { ...r("2027-06-15", "Second-quarter 2027 estimated tax payment"), kind: "key" },
  r("2027-08-02", "Second-quarter 2027 Form 941 (July 31 is a Saturday)"),
  { ...r("2027-09-15", "Third-quarter 2027 estimated tax payment; extended Forms 1065 and 1120-S"), kind: "key" },
  { ...r("2027-10-15", "Extended Form 1040 and Form 1120; FBAR automatic extension"), kind: "off" },
  r("2027-11-01", "Third-quarter 2027 Form 941 (Oct. 31 is a Sunday)"),
  { ...r("2028-01-18", "Fourth-quarter 2027 estimated tax payment (Jan. 15 is a Saturday, Jan. 17 is Martin Luther King Jr. Day)"), kind: "key" },
];

// ── Late October 2026 ──────────────────────────────────────────────────────────
const LATE_OCT: Row[] = [
  r("2026-10-20", "International Chefs Day · World Osteoporosis Day · National Day on Writing"),
  { ...r("2026-10-21", "Social Security payments for birthdays on the 11th-20th · Orionid meteor shower peaks overnight"), kind: "key" },
  r("2026-10-22", "International Stuttering Awareness Day"),
  r("2026-10-23", "Mole Day, 6:02 a.m. to 6:02 p.m. · World Series Game 1, 8 p.m. ET"),
  { ...r("2026-10-24", "United Nations Day · World Polio Day · Make A Difference Day · DEA Prescription Drug Take Back Day, 10 a.m.-2 p.m."), kind: "half" },
  r("2026-10-25", "UK and EU clocks go back one hour"),
  { ...r("2026-10-26", "Hunter's Moon, full at 12:12 a.m. EDT (9:12 p.m. PDT on Oct. 25)"), kind: "key" },
  { ...r("2026-10-28", "Social Security payments for birthdays on the 21st-31st"), kind: "key" },
  { ...r("2026-10-30", "Nevada Day (state holiday) · SSI payments for November arrive early (Nov. 1 is a Sunday)"), kind: "off" },
  { ...r("2026-10-31", "Halloween · Reformation Day · World Series Game 7, if needed"), kind: "off" },
  { ...r("2026-11-01", "U.S. daylight saving time ends, 2 a.m. · ACA open enrollment begins"), kind: "break" },
];

// ── Winter break 2026 ──────────────────────────────────────────────────────────
/** [district, state, first day off, last day off, extra no-school days, students return, Thanksgiving break]. From each district's official 2026-27 calendar. */
export const WINTER_2026: [string, string, string, string, string, string, string][] = [
  ["New York City Public Schools", "N.Y.", "2026-12-24", "2027-01-01", "", "2027-01-04", "2026-11-26..2026-11-27"],
  ["Los Angeles Unified", "Calif.", "2026-12-21", "2027-01-08", "", "2027-01-11", "2026-11-23..2026-11-27"],
  ["Miami-Dade County", "Fla.", "2026-12-21", "2027-01-01", "Dec. 18 planning day", "2027-01-04", "2026-11-23..2026-11-27"],
  ["Chicago Public Schools", "Ill.", "2026-12-21", "2027-01-01", "Jan. 4 PD day", "2027-01-05", "2026-11-26..2026-11-27"],
  ["Clark County", "Nev.", "2026-12-21", "2027-01-01", "Jan. 4 staff day", "2027-01-05", "2026-11-25..2026-11-27"],
  ["Broward County", "Fla.", "2026-12-21", "2027-01-01", "", "", "2026-11-23..2026-11-27"],
  ["Houston ISD", "Texas", "2026-12-21", "2027-01-01", "Jan. 4 staff PD day", "2027-01-05", "2026-11-23..2026-11-27"],
  ["Hillsborough County", "Fla.", "2026-12-21", "2027-01-01", "Jan. 4 non-student day", "2027-01-05", "2026-11-23..2026-11-27"],
  ["Orange County", "Fla.", "2026-12-21", "2027-01-01", "Jan. 4 teacher workday", "2027-01-05", "2026-11-23..2026-11-27"],
  ["Palm Beach County", "Fla.", "2026-12-21", "2027-01-01", "Jan. 4 duty day", "2027-01-05", "2026-11-23..2026-11-27"],
  ["Fairfax County", "Va.", "2026-12-21", "2027-01-01", "", "2027-01-04", "2026-11-25..2026-11-27"],
  ["Gwinnett County", "Ga.", "2026-12-21", "2027-01-04", "", "2027-01-05", "2026-11-23..2026-11-27"],
  ["Dallas ISD", "Texas", "2026-12-21", "2027-01-04", "Jan. 5 PD day", "2027-01-06", "2026-11-23..2026-11-27"],
  ["Wake County (traditional)", "N.C.", "2026-12-21", "2027-01-01", "", "2027-01-04", "2026-11-25..2026-11-27"],
  ["Charlotte-Mecklenburg", "N.C.", "2026-12-21", "2027-01-01", "", "2027-01-04", "2026-11-25..2026-11-27"],
  ["Montgomery County", "Md.", "2026-12-24", "2027-01-01", "Dec. 23 early release", "2027-01-04", "2026-11-26..2026-11-27"],
  ["San Diego Unified", "Calif.", "2026-12-21", "2027-01-01", "Jan. 4 non-instructional", "2027-01-05", "2026-11-23..2026-11-27"],
  ["Duval County", "Fla.", "2026-12-21", "2027-01-01", "Jan. 4-5 staff days", "2027-01-06", "2026-11-23..2026-11-27"],
  ["Cypress-Fairbanks ISD", "Texas", "2026-12-21", "2027-01-01", "Jan. 4 professional day", "2027-01-05", "2026-11-23..2026-11-27"],
  ["Northside ISD (San Antonio)", "Texas", "2026-12-21", "2027-01-01", "Jan. 4 teacher planning", "2027-01-05", "2026-11-23..2026-11-27"],
  ["Denver Public Schools", "Colo.", "2026-12-21", "2027-01-01", "Jan. 4 planning day", "2027-01-05", "2026-11-23..2026-11-27"],
];
const rng2 = (x: string) => { const [a, b] = x.split(".."); return a!.slice(5, 7) === b!.slice(5, 7) ? `${ap(a!)}-${Number(b!.slice(8))}` : `${ap(a!)}-${ap(b!)}`; };
export const winterRange = (a: string, b: string) => `${ap(a)}-${ap(b)}`;
function winterSheet(fonts: string): string {
  const rows = WINTER_2026.map(([d, st, a, b, x, ret, tg]) => `<tr><td class="c">${d}<small>${st}</small></td><td class="hi">${winterRange(a, b)}</td><td>${x || "-"}</td><td>${ret ? `${dow(ret)}, ${ap(ret)}` : "See district"}</td><td>${rng2(tg)}</td></tr>`).join("");
  const css = `
  .wb{padding:28px 32px 0}
  .wb header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #1d4ed8;padding-bottom:8px;margin-bottom:10px}
  .wb h1{font-family:Sora;font-weight:800;font-size:30px;margin:0;color:#1d4ed8;line-height:1.05}
  .wb .sub{margin:4px 0 0;font-size:11px;color:#37474f}
  .wb .flake svg{display:block}
  .wb table{width:100%;border-collapse:collapse;font-size:11px;font-variant-numeric:tabular-nums}
  .wb th{background:#1e3a8a;color:#fff;font-family:Sora;font-size:8.6px;padding:6px 5px;text-align:left}
  .wb td{padding:10.4px 5px;border-bottom:1px solid #e3e8ee}
  .wb tr:nth-child(even) td{background:#f8fafc}
  .wb td.c{font-weight:700}
  .wb td.c small{font-weight:400;color:#64748b;margin-left:5px}
  .wb td.hi{font-weight:800;color:#1e3a8a}
  .wb .note{margin-top:9px;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page wb"><header><div><h1>Winter Break 2026 by School District</h1>
    <p class="sub">First and last weekday off for students, extra no-school days next to the break, the day students return, and Thanksgiving break</p></div><div class="flake"><svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" fill="none" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"><g transform="rotate(0 22 22)"><path d="M22 22V3M22 9l-5-4M22 9l5-4"/></g><g transform="rotate(60 22 22)"><path d="M22 22V3M22 9l-5-4M22 9l5-4"/></g><g transform="rotate(120 22 22)"><path d="M22 22V3M22 9l-5-4M22 9l5-4"/></g><g transform="rotate(180 22 22)"><path d="M22 22V3M22 9l-5-4M22 9l5-4"/></g><g transform="rotate(240 22 22)"><path d="M22 22V3M22 9l-5-4M22 9l5-4"/></g><g transform="rotate(300 22 22)"><path d="M22 22V3M22 9l-5-4M22 9l5-4"/></g></svg></div></header>
    <table><thead><tr><th>District</th><th>Winter break (students)</th><th>Extra no-school day</th><th>Students return</th><th>Thanksgiving break</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="note">Dates are weekdays off for students and come from each district's official 2026-27 calendar, read Oct. 19-20, 2026. Wake County is the traditional calendar; year-round and modified tracks differ. Gwinnett's student calendar includes Jan. 4 in winter break. Broward's announcement does not list a return date. Calendars can change after weather closures; check your school's site.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/winter-break-2026-school-districts-dates/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildDateList3Downloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("sunset-times-2026", [{ slug: "sunset-times-after-clock-change-2026", size: LETTER, html: sunsetSheet(fonts) }]);
  await renderPrintables("hunters-moon-2026", [{ slug: "hunters-moon-2026-moon-phase-calendar", size: LETTER, html: moonSheet(fonts) }]);
  await renderPrintables("tax-calendar-2027", [{ slug: "tax-calendar-2027", size: LETTER, html: list(fonts, { title: "2027 Federal Tax Calendar", sub: "Individual and small-business deadlines that fall in 2027 · green rows are estimated tax payments, red rows the April and October filing deadlines", accent: "#14532d", rows: TAX_2027, note: "Source: IRS Publication 509, Form 1040-ES instructions and 26 U.S.C. 7503 (a deadline on a weekend or legal holiday moves to the next business day). Employers who deposited all taxes on time get 10 more days for Forms 940 and 941. Confirm with Publication 509 (2027) when the IRS issues it.", legend: [["key", "Estimated tax payment"], ["off", "Individual filing deadline"], ["half", "Business returns"], ["plain", "Information returns and payroll"]], site: "freshcalendars.com/news/tax-calendar-2027-irs-deadlines/" }) }]);
  await renderPrintables("winter-break-2026", [{ slug: "winter-break-2026-school-districts", size: LETTER, html: winterSheet(fonts) }]);
  await renderPrintables("late-october-2026", [{ slug: "late-october-2026-dates", size: LETTER, html: list(fonts, { title: "What's On: Oct. 20-Nov. 1, 2026", sub: "Observances, benefit payments, sky events and deadlines for the rest of October", accent: "#c2410c", rows: LATE_OCT, note: "Sources: Worldchefs, International Osteoporosis Foundation, NCTE, International Stuttering Association, National Mole Day Foundation, MLB, United Nations, Rotary International, Points of Light, DEA, GOV.UK, U.S. Naval Observatory, Social Security Administration, Nevada Revised Statutes 236.015.", legend: [["key", "Payments and sky events"], ["half", "Saturday observances"], ["off", "Holidays"], ["break", "Clock change"], ["plain", "Observances"]], site: "freshcalendars.com/news/october-20-2026-what-day-holidays-observances/" }) }]);
}
