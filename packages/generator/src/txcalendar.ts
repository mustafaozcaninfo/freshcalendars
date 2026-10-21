/**
 * Texas election calendar story for /news/ (texas-election-calendar-2026-early-voting-dates-deadlines):
 * the hero and a one-page 2026 calendar. Every date comes from the Texas Secretary of State:
 * Important Election Dates, the Nov. 3, 2026 Election Law Calendar (Advisory 2026-21) and the
 * March 3 primary and May 26 runoff law calendar (Advisory 2025-17), read Oct. 21, 2026.
 * Early voting hours are the legal minimums at a county's main early voting site. Nonpartisan.
 * Usage: pnpm fc news-txcalendar
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { LETTER, doc, fontFaces } from "./julian.js";
import { DOW3, MONTHS, daysIn, renderPrintables, utc } from "./printables.js";
import { ROOT } from "./paths.js";

const SLUG = "texas-election-calendar-2026-early-voting-dates-deadlines";
const ACCENT = "#9a3412";

/** Marked days for the Oct. and Nov. grids: [month (0-based), day, kind, label]. */
type Kind = "reg" | "ev" | "mail" | "eday" | "after" | "none";
const MARKS: [number, number, Kind, string][] = [
  [9, 5, "reg", "Last day to register"],
  [9, 19, "ev", "Early voting, 9+ hrs"], [9, 20, "ev", "9+ hrs"], [9, 21, "ev", "9+ hrs"], [9, 22, "ev", "9+ hrs"],
  [9, 23, "mail", "Mail ballot applications due · 12+ hrs"], [9, 24, "ev", "12+ hrs"], [9, 25, "ev", "Sunday, 6+ hrs"],
  [9, 26, "ev", "12+ hrs"], [9, 27, "ev", "12+ hrs"], [9, 28, "ev", "12+ hrs"], [9, 29, "ev", "12+ hrs"], [9, 30, "ev", "Last day of early voting, 12+ hrs"],
  [9, 31, "none", "No early voting"], [10, 1, "none", "No early voting"], [10, 2, "none", "No early voting"],
  [10, 3, "eday", "Election Day, 7 a.m.-7 p.m."], [10, 4, "after", "Postmarked mail ballots due 5 p.m."],
  [10, 9, "after", "Overseas and military ballots due"],
];
const COLOR: Record<Kind, string> = { reg: "#64748b", ev: "#0f766e", mail: "#7c3aed", eday: ACCENT, after: "#1d4ed8", none: "#94a3b8" };

/** The year at a glance: [date, what happens]. */
const YEAR: [string, [string, string][]][] = [
  ["March 3 primary", [["Mon., Feb. 2", "Last day to register"], ["Tue., Feb. 17-Fri., Feb. 27", "Early voting"], ["Fri., Feb. 20", "Mail ballot applications due"], ["Tue., March 3", "Primary Election Day"]]],
  ["May 26 primary runoff", [["Mon., April 27", "Last day to register"], ["Fri., May 15", "Mail ballot applications due"], ["Mon., May 18-Fri., May 22", "Early voting"], ["Tue., May 26", "Runoff Election Day"]]],
  ["After Nov. 3", [["Mon., Nov. 9", "Last day to fix a flagged mail ballot, in person"], ["Sat., Nov. 21", "Earliest date for the state canvass"], ["Sat., Dec. 12", "Runoffs for local Nov. 3 races"]]],
];

function month(m: number): string {
  const first = utc(2026, m, 1).getUTCDay(), n = daysIn(2026, m);
  const cells: string[] = Array.from({ length: first }, () => `<div class="c e"></div>`);
  for (let d = 1; d <= n; d++) {
    const mk = MARKS.find(([mm, dd]) => mm === m && dd === d);
    cells.push(mk
      ? `<div class="c on ${mk[2]}" style="--k:${COLOR[mk[2]]}"><b>${d}</b><i>${mk[3]}</i></div>`
      : `<div class="c"><b>${d}</b></div>`);
  }
  return `<div class="m"><h2>${MONTHS[m]} 2026</h2><div class="g">${DOW3.map((x) => `<div class="h">${x}</div>`).join("")}${cells.join("")}</div></div>`;
}

function sheet(fonts: string): string {
  const css = `
  .tx{padding:26px 36px 0}
  .tx h1{font-family:Sora;font-weight:800;font-size:23px;margin:0;color:${ACCENT};line-height:1.05}
  .tx .sub{margin:4px 0 8px;font-size:11px;color:#37474f}
  .tx .key{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0 0 8px;font-size:9.5px;color:#1f2937}
  .tx .key span::before{content:"";display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px;background:var(--k)}
  .tx .m{margin-bottom:8px}
  .tx h2{font-family:Sora;font-size:13px;margin:0 0 4px;color:#1f2937}
  .tx .g{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
  .tx .h{font-family:Sora;font-weight:800;font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:#475569;text-align:center}
  .tx .c{border:1.2px solid #e2e8f0;border-radius:6px;height:56px;padding:2px 4px;display:flex;flex-direction:column;gap:1px;background:#fff}
  .tx .c.e{border:0;background:none}
  .tx .c b{font-family:Sora;font-size:10.5px;color:#0f172a}
  .tx .c.on{border-color:var(--k);background:#f8fafc}
  .tx .c.on i{font-style:normal;font-size:7.4px;font-weight:800;color:var(--k);line-height:1.2}
  .tx .c.eday{background:${ACCENT}}.tx .c.eday b,.tx .c.eday i{color:#fff}
  .tx .yr{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:2px}
  .tx .yr h3{font-family:Sora;font-size:11px;margin:0 0 3px;color:${ACCENT}}
  .tx .yr p{margin:0 0 2px;font-size:8.8px;line-height:1.3;color:#1f2937}.tx .yr p b{display:block;font-size:8.6px;color:#0f172a}
  .tx .note{margin-top:8px;font-size:8.6px;color:#5a6b75;line-height:1.45}`;
  const key = ([["ev", "Early voting (minimum hours at the county's main site)"], ["mail", "Mail ballot deadline"], ["eday", "Election Day"], ["after", "Ballots arriving after Election Day"], ["none", "No early voting"]] as [Kind, string][])
    .map(([k, l]) => `<span style="--k:${COLOR[k]}">${l}</span>`).join("");
  const yr = YEAR.map(([h, rows]) => `<div><h3>${h}</h3>${rows.map(([d, w]) => `<p><b>${d}</b>${w}</p>`).join("")}</div>`).join("");
  const page = `<section class="page tx"><h1>Texas Election Calendar 2026</h1>
    <p class="sub">Every statewide voting date for the Nov. 3 general election, with the March primary and May runoff · from the Texas Secretary of State</p>
    <div class="key">${key}</div>
    ${[9, 10].map(month).join("")}
    <div class="yr">${yr}</div>
    <p class="note">Source: Texas Secretary of State, Important Election Dates; Nov. 3, 2026 Election Law Calendar (Election Advisory No. 2026-21); March 3, 2026 primary and May 26, 2026 primary runoff law calendar (Election Advisory No. 2025-17). Early voting hours shown are legal minimums at the county's main early voting site; check your county elections office for exact sites and hours. Mailed ballots postmarked by 7 p.m. Nov. 3 count if they arrive by 5 p.m. Nov. 4. Not affiliated with the State of Texas.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

const W = 1200, H = 675;
function hero(fonts: string): string {
  const first = utc(2026, 9, 1).getUTCDay();
  const cell = 58, gx = 650, gy = 150;
  const days = Array.from({ length: 31 }, (_, i) => {
    const d = i + 1, idx = first + i, x = gx + (idx % 7) * cell, y = gy + Math.floor(idx / 7) * cell;
    const ev = d >= 19 && d <= 30, last = d === 30;
    const fill = last ? ACCENT : ev ? "#ccfbf1" : "#fff", ink = last ? "#fff" : ev ? "#115e59" : "#334155";
    return `<rect x="${x + 3}" y="${y + 3}" width="${cell - 6}" height="${cell - 6}" rx="9" fill="${fill}"/><text x="${x + cell / 2}" y="${y + 37}" font-family="Sora" font-size="20" font-weight="800" fill="${ink}" text-anchor="middle">${d}</text>`;
  }).join("");
  const head = DOW3.map((d, i) => `<text x="${gx + i * cell + cell / 2}" y="${gy - 10}" font-family="Sora" font-size="13" font-weight="800" fill="#64748b" text-anchor="middle">${d.toUpperCase()}</text>`).join("");
  const cal = `<g filter="url(#sh)"><rect x="${gx - 22}" y="${gy - 80}" width="${cell * 7 + 44}" height="${cell * 5 + 110}" rx="20" fill="#fff"/></g><text x="${gx}" y="${gy - 40}" font-family="Sora" font-size="24" font-weight="800" fill="${ACCENT}">OCTOBER 2026</text>${head}${days}`;
  const nov = `<g transform="translate(1000,470) rotate(5)" filter="url(#sh)"><rect width="150" height="150" rx="16" fill="#fff"/><rect width="150" height="44" rx="16" fill="${ACCENT}"/><rect y="30" width="150" height="14" fill="${ACCENT}"/><text x="75" y="31" font-family="Sora" font-size="17" font-weight="800" fill="#fff" text-anchor="middle">NOV. · TUE</text><text x="75" y="120" font-family="Sora" font-size="72" font-weight="800" fill="#0f172a" text-anchor="middle">3</text></g>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;background:#431407;font-family:Manrope,sans-serif;position:relative}
  .k{position:absolute;left:64px;top:84px;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:#fed7aa}
  .t{position:absolute;left:64px;top:118px;width:520px;font-family:Sora;font-weight:800;color:#fff;line-height:1.02;font-size:62px;letter-spacing:-.01em}
  .card{position:absolute;left:64px;top:410px;width:440px;border-radius:18px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.28);padding:18px 22px;color:#0f172a}
  .card b{display:block;font-family:Sora;font-size:30px;line-height:1.05;margin:2px 0}.card span{font-size:15px;color:#475569;font-weight:700}
  .brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.78)}</style></head><body>
  <svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a3412"/><stop offset="1" stop-color="#431407"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>${cal}${nov}</svg>
  <div class="k">Texas · 2026 elections</div><div class="t">Texas election calendar</div>
  <div class="card"><span>Early voting Oct. 19-30</span><b>Mail applications due Fri., Oct. 23</b><span>Election Day Tue., Nov. 3, 7 a.m.-7 p.m.</span></div>
  <div class="brand">freshcalendars.com/news</div></body></html>`;
}

export async function buildTxCalendar(): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    await page.setContent(hero(fonts), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png" });
    const dir = path.join(ROOT, "apps/news/src/assets/news", SLUG);
    await fs.mkdir(dir, { recursive: true });
    await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${SLUG}.jpg`));
    console.log(`${SLUG}.jpg`);
  } finally {
    await browser.close();
  }
  await renderPrintables("election-2026", [{ slug: "texas-election-calendar-2026", size: LETTER, html: sheet(fonts) }]);
}
