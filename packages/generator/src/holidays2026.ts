/**
 * In-story figures for the late-November 2026 holiday batch (heroes and printables come from news-assets).
 *
 *   thanksgiving-2026-tv-schedule-macys-parade-nfl-games/thanksgiving-2026-tv-timeline.png
 *   nyc-holiday-calendar-2026-rockefeller-tree-macys-parade/nyc-holiday-season-2026-chart.png
 *   thanksgiving-break-2026-school-districts-dates/thanksgiving-break-2026-chart.png
 *
 * Every date and time here is in the story it illustrates, with its source. Usage: pnpm fc news-holidays2026
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";
import { WINTER_2026 } from "./datelists3.js";

const INK = "#1c1917", RUST = "#9a3412", GOLD = "#d97706", NAVY = "#14306b", GREEN = "#166534";

const page = (fonts: string, w: number, h: number, bg: string, css: string, body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}html,body{margin:0}
  body{width:${w}px;height:${h}px;overflow:hidden;font-family:Manrope,sans-serif;background:${bg};color:${INK};padding:32px 40px;position:relative}
  h1{font-family:Sora;font-weight:800;font-size:31px;margin:0;line-height:1.1}p.s{margin:6px 0 18px;color:#57534e;font-size:16px}
  .f{position:absolute;right:40px;bottom:12px;font-size:12px;color:#78716c}${css}</style></head><body>${body}</body></html>`;

/** Wednesday to Friday, start times on an 8 a.m. to midnight ET axis. */
function tvTimeline(fonts: string): string {
  const x = (h: number) => ((h - 8) / 16) * 100;
  const days = [
    { d: "Wed., Nov. 25", items: [{ h: 20, t: "Packers at Rams", n: "Netflix · first Thanksgiving Eve game", c: NAVY }] },
    { d: "Thu., Nov. 26", items: [
      { h: 8.5, t: "100th Macy's Parade", n: "NBC · Peacock · Telemundo", c: RUST },
      { h: 13, t: "Bears at Lions", n: "CBS", c: GREEN },
      { h: 16.5, t: "Eagles at Cowboys", n: "FOX", c: NAVY },
      { h: 20.33, t: "Chiefs at Bills", n: "NBC · Peacock", c: RUST },
    ] },
    { d: "Fri., Nov. 27", items: [{ h: 15, t: "Broncos at Steelers", n: "Prime Video · Black Friday", c: GREEN }] },
  ];
  const clock = (h: number) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return `${((hh + 11) % 12) + 1}${mm ? `:${String(mm).padStart(2, "0")}` : ""} ${hh < 12 ? "a.m." : "p.m."}`; };
  const ticks = [8, 10, 12, 14, 16, 18, 20, 22, 24].map((h) => `<i style="left:${x(h)}%"><b>${h === 24 ? "12 a.m." : h === 12 ? "noon" : clock(h)}</b></i>`).join("");
  const rows = days.map((r) => `<div class="r"><div class="d">${r.d}</div><div class="lane">${ticks}${r.items.map((it) => `<div class="pin" style="left:${x(it.h)}%;--c:${it.c}"><em>${clock(it.h)}</em><strong>${it.t}</strong><span>${it.n}</span></div>`).join("")}</div></div>`).join("");
  const css = `.r{display:grid;grid-template-columns:150px 1fr;align-items:stretch;margin-bottom:14px}
  .d{font-family:Sora;font-weight:800;font-size:18px;color:${RUST};padding-top:46px}
  .lane{position:relative;height:150px;background:#fff;border-radius:14px;border:1.5px solid #e7d8c9}
  .lane i{position:absolute;top:0;bottom:0;border-left:1px dashed #eadfd3}.lane i b{position:absolute;bottom:4px;left:4px;font-size:11px;color:#a8a29e;font-style:normal;font-weight:700;white-space:nowrap}
  .pin{position:absolute;top:12px;width:190px;border-left:5px solid var(--c);background:#fffaf5;border-radius:0 10px 10px 0;padding:7px 10px;box-shadow:0 4px 12px rgba(0,0,0,.06)}
  .pin em{display:block;font-style:normal;font-weight:800;font-size:13px;color:var(--c)}.pin strong{display:block;font-family:Sora;font-size:16px;line-height:1.15;margin:2px 0}.pin span{display:block;font-size:12px;color:#57534e}`;
  return page(fonts, 1200, 640, "#fbf3ea", css, `<h1>Thanksgiving week 2026 on TV</h1><p class="s">Start times in Eastern Time. The parade airs at 8:30 a.m. local time in every time zone.</p>${rows}<div class="f">freshcalendars.com/news · Sources: NFL.com, Macy's, Inc.</div>`);
}

/** Oct. 28, 2026 to Jan. 10, 2027 as a Gantt strip with one-day markers. */
function nycSeason(fonts: string): string {
  const start = Date.UTC(2026, 9, 28), end = Date.UTC(2027, 0, 11), span = end - start;
  const x = (m: number, d: number, y = 2026) => ((Date.UTC(y, m, d) - start) / span) * 100;
  const bars = [
    { t: "Bryant Park Winter Village shops", a: x(9, 28), b: x(0, 4, 2027), c: GREEN, l: "Oct. 28 to Jan. 3" },
    { t: "Radio City Christmas Spectacular", a: x(10, 4), b: x(0, 4, 2027), c: RUST, l: "From Nov. 4", open: true },
    { t: "NYBG Holiday Train Show", a: x(10, 14), b: x(0, 11, 2027), c: GREEN, l: "Nov. 14 to Jan. 10" },
    { t: "Macy's Herald Square windows", a: x(10, 19), b: x(0, 5, 2027), c: RUST, l: "Nov. 19 to Jan. 4" },
    { t: "Lightscape, Brooklyn Botanic Garden", a: x(10, 20), b: x(0, 4, 2027), c: NAVY, l: "Nov. 20 to Jan. 3" },
    { t: "Hanukkah", a: x(11, 4), b: x(11, 13), c: NAVY, l: "Dec. 4 to 12" },
    { t: "NYC public schools winter recess", a: x(11, 24), b: x(0, 2, 2027), c: GOLD, l: "Dec. 24-Jan. 1" },
  ];
  const marks = [
    { d: x(10, 1), t: "Marathon", s: "Nov. 1" }, { d: x(10, 7), t: "Tree arrives", s: "Nov. 7" },
    { d: x(10, 26), t: "Macy's parade", s: "Nov. 26" }, { d: x(11, 2), t: "Tree lighting", s: "Dec. 2" },
    { d: x(11, 31), t: "Ball drop", s: "Dec. 31" },
  ];
  const months = [{ t: "NOV", d: x(10, 1) }, { t: "DEC", d: x(11, 1) }, { t: "JAN", d: x(0, 1, 2027) }];
  const css = `.g{position:relative;margin-left:300px;height:440px}
  .m{position:absolute;top:0;bottom:0;border-left:2px solid #d6d3d1}.m b{position:absolute;top:-2px;left:6px;font-family:Sora;font-size:13px;color:#78716c}
  .k{position:absolute;top:26px;bottom:0;border-left:2px dashed #b45309}.k b{position:absolute;left:-60px;width:120px;text-align:center;font-family:Sora;font-size:12.5px;color:${RUST};background:#fbf3ea;line-height:1.15;z-index:2}.k b span{display:block;font-family:Manrope;font-weight:700;color:#57534e;font-size:11.5px}
  .row{position:absolute;left:-300px;right:0;height:36px}.row>label{position:absolute;left:0;width:290px;font-weight:800;font-size:15px;line-height:36px;white-space:nowrap}
  .bar{position:absolute;height:28px;top:4px;border-radius:8px;color:#fff;font-weight:800;font-size:12.5px;line-height:28px;padding:0 9px;white-space:nowrap}
  .bar.open{border-radius:8px 0 0 8px;-webkit-mask-image:linear-gradient(90deg,#000 70%,transparent)}`;
  const rows = bars.map((b, i) => `<div class="row" style="top:${100 + i * 46}px"><label>${b.t}</label><div class="bar${b.open ? " open" : ""}" style="left:calc(300px + (100% - 300px) * ${b.a / 100});width:calc((100% - 300px) * ${(b.b - b.a) / 100});background:${b.c}">${b.l}</div></div>`).join("");
  return page(fonts, 1200, 620, "#fbf3ea", css, `<h1>New York City holiday season 2026</h1><p class="s">What runs when, from the Bryant Park opening to the last train show day. Dashed lines are one-day events.</p>
  <div class="g">${months.map((m) => `<div class="m" style="left:${m.d}%"><b>${m.t}</b></div>`).join("")}${marks.map((m, i) => `<div class="k" style="left:${m.d}%"><b style="top:${i % 2 ? 34 : 0}px">${m.t}<span>${m.s}</span></b></div>`).join("")}${rows}</div>
  <div class="f">freshcalendars.com/news · Sources: each organizer's official site</div>`);
}

/** Thanksgiving week, Mon. Nov. 23 to Fri. Nov. 27, for the districts in WINTER_2026 (their official calendars). */
function breakChart(fonts: string): string {
  const days = ["Mon. 23", "Tue. 24", "Wed. 25", "Thu. 26", "Fri. 27"];
  const rows = [...WINTER_2026].map(([d, st, , , , , tg]) => ({ d, st, from: Number(tg.slice(8, 10)) }))
    .sort((a, b) => a.from - b.from || a.d.localeCompare(b.d));
  // Montgomery County, Md., holds early-release days Nov. 23-25 (its 2026-27 calendar).
  const cell = (on: boolean, i: number, d: string) => on ? `<td class="${i === 3 ? "h" : "o"}">${i === 3 ? "Thanksgiving" : "Off"}</td>`
    : d.startsWith("Montgomery") ? `<td class="e">Early release</td>` : `<td class="s">School</td>`;
  const body = rows.map((r) => `<tr><th>${r.d}<small>${r.st}</small></th>${days.map((_, i) => cell(23 + i >= r.from, i, r.d)).join("")}</tr>`).join("");
  const css = `table{width:100%;border-collapse:separate;border-spacing:4px 3px;font-size:13px}
  thead th{font-family:Sora;font-size:13px;color:#57534e;text-align:center;padding-bottom:2px}
  tbody th{text-align:left;font-weight:800;font-size:13.5px;white-space:nowrap;padding-right:8px;width:300px}tbody th small{font-weight:600;color:#78716c;margin-left:6px}
  td{text-align:center;border-radius:6px;font-weight:800;font-size:11.5px;height:24px}
  td.s{background:#fff;color:#a8a29e;border:1px solid #e7e5e4}td.o{background:${GOLD};color:#fff}td.e{background:#fff;color:${RUST};border:1.5px dashed ${GOLD}}td.h{background:${RUST};color:#fff}`;
  return page(fonts, 1200, 780, "#fbf3ea", css, `<h1>Thanksgiving break 2026 in 21 large school districts</h1><p class="s">Student days off in Thanksgiving week, from each district's official 2026-27 calendar.</p>
  <table><thead><tr><th></th>${days.map((d) => `<th>${d}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>
  <div class="f">freshcalendars.com/news · Sources: district calendars</div>`);
}

async function shoot(list: { slug: string; file: string; html: string; w: number; h: number }[]): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const it of list) {
      const p = await browser.newPage({ viewport: { width: it.w, height: it.h }, deviceScaleFactor: 2 });
      await p.setContent(it.html, { waitUntil: "load" });
      await p.evaluate(() => document.fonts.ready);
      const dir = path.join(ROOT, "apps/news/src/assets/news", it.slug);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, it.file), await p.screenshot({ type: "png" }));
      console.log(`figure: apps/news/src/assets/news/${it.slug}/${it.file}`);
      await p.close();
    }
  } finally {
    await browser.close();
  }
}

export async function buildHolidays2026Figures(): Promise<void> {
  const fonts = await fontFaces();
  await shoot([
    { slug: "thanksgiving-2026-tv-schedule-macys-parade-nfl-games", file: "thanksgiving-2026-tv-timeline.png", html: tvTimeline(fonts), w: 1200, h: 640 },
    { slug: "nyc-holiday-calendar-2026-rockefeller-tree-macys-parade", file: "nyc-holiday-season-2026-chart.png", html: nycSeason(fonts), w: 1200, h: 620 },
    { slug: "thanksgiving-break-2026-school-districts-dates", file: "thanksgiving-break-2026-chart.png", html: breakChart(fonts), w: 1200, h: 780 },
  ]);
}
