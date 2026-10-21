/**
 * "November 2026 calendar with holidays" printables for /news/ (november-2026-important-dates-days-until):
 * a month grid with every holiday and key date written in, plus the full list, in three versions:
 * Sunday start (color), Monday start (color) and Sunday start ink-saver.
 * Dates: OPM federal holidays, USNO moon phase, retailer/organizer dates as in the story.
 * The calendar site's /november-calendars.html keeps the plain monthly designs.
 * Usage: pnpm fc news-november-holidays
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

/** [day, short label for the grid, kind]. kind: fed = federal holiday, key = other notable date. */
export const NOV_2026: [number, string, "fed" | "key"][] = [
  [1, "Clocks fall back 2 a.m. · All Saints' Day", "key"], [2, "Day of the Dead · All Souls' Day", "key"], [3, "Election Day", "key"],
  [5, "Guy Fawkes Night (U.K.)", "key"], [6, "Dhanteras (Diwali begins)", "key"], [8, "Diwali · Lakshmi Puja", "key"], [10, "Bhai Dooj", "key"],
  [11, "Veterans Day", "fed"], [19, "GTA VI launches", "key"], [24, "Full Beaver Moon", "key"], [25, "Peak travel day", "key"],
  [26, "Thanksgiving Day", "fed"], [27, "Black Friday", "key"], [28, "Small Business Saturday", "key"], [29, "First Sunday of Advent", "key"], [30, "Cyber Monday", "key"],
];
type Theme = { id: string; ink: string; accent: string; fed: string; soft: string; line: string; mondayStart: boolean };
const THEMES: Theme[] = [
  { id: "sunday", ink: "#7c2d12", accent: "#c2410c", fed: "#b91c1c", soft: "#fff7ed", line: "#fed7aa", mondayStart: false },
  { id: "monday", ink: "#1e3a8a", accent: "#2563eb", fed: "#b91c1c", soft: "#eff6ff", line: "#bfdbfe", mondayStart: true },
  { id: "ink", ink: "#111111", accent: "#333333", fed: "#111111", soft: "#f4f4f4", line: "#cfcfcf", mondayStart: false },
];
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function sheet(fonts: string, t: Theme): string {
  const c = `nv-${t.id}`;
  const first = new Date(Date.UTC(2026, 10, 1)).getUTCDay(); // 0 = Sunday
  const lead = t.mondayStart ? (first + 6) % 7 : first;
  const heads = t.mondayStart ? [...DOW.slice(1), DOW[0]] : DOW;
  const cells: string[] = [];
  for (let i = 0; i < lead; i++) cells.push(`<div class="d empty"></div>`);
  for (let d = 1; d <= 30; d++) {
    const ev = NOV_2026.filter(([day]) => day === d);
    const fed = ev.some(([, , k]) => k === "fed");
    cells.push(`<div class="d${fed ? " fed" : ev.length ? " key" : ""}"><b>${d}</b>${ev.map(([, l]) => `<i>${l}</i>`).join("")}</div>`);
  }
  while (cells.length % 7) cells.push(`<div class="d empty"></div>`);
  const list = NOV_2026.map(([d, l, k]) => `<li class="${k}"><b>Nov. ${d}</b> ${DOW[new Date(Date.UTC(2026, 10, d)).getUTCDay()].slice(0, 3)}. · ${l}${k === "fed" ? " <em>federal holiday</em>" : ""}</li>`).join("");
  const css = `
  .${c}{padding:26px 30px 0;color:#1f2937}
  .${c} header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid ${t.accent};padding-bottom:7px;margin-bottom:10px}
  .${c} h1{font-family:Sora;font-weight:800;font-size:30px;margin:0;color:${t.ink};line-height:1.05}
  .${c} .sub{margin:4px 0 0;font-size:11px;color:#374151}
  .${c} .badge{font-family:Sora;font-weight:800;font-size:12px;color:#fff;background:${t.ink};border-radius:8px;padding:7px 11px;text-align:center;line-height:1.2}
  .${c} .dow,.${c} .grid{display:grid;grid-template-columns:repeat(7,1fr)}
  .${c} .dow div{font-family:Sora;font-weight:800;font-size:9.6px;text-transform:uppercase;letter-spacing:.06em;color:${t.ink};padding:4px 5px}
  .${c} .grid{border-top:1.5px solid ${t.line};border-left:1.5px solid ${t.line}}
  .${c} .d{border-right:1.5px solid ${t.line};border-bottom:1.5px solid ${t.line};height:104px;padding:5px 6px;display:flex;flex-direction:column;gap:2px;overflow:hidden}
  .${c} .d b{font-family:Sora;font-size:16px;color:${t.ink}}
  .${c} .d i{font-style:normal;font-size:8.6px;font-weight:700;line-height:1.2;color:#374151}
  .${c} .d.key{background:${t.soft}}
  .${c} .d.fed{background:${t.soft};box-shadow:inset 0 0 0 2px ${t.fed}}
  .${c} .d.fed i{color:${t.fed}}
  .${c} .d.empty{background:#fafafa}
  .${c} .cols{display:grid;grid-template-columns:1.25fr 1fr;gap:16px;margin-top:12px}
  .${c} h2{font-family:Sora;font-size:11.5px;text-transform:uppercase;letter-spacing:.07em;color:${t.accent};margin:0 0 6px}
  .${c} ul{margin:0;padding:0;list-style:none;columns:2;column-gap:14px}
  .${c} li{font-size:9.6px;line-height:1.3;margin:0 0 4px;break-inside:avoid}
  .${c} li b{color:${t.ink}} .${c} li em{font-style:normal;color:${t.fed};font-weight:700}
  .${c} .notes p{border-bottom:1px solid ${t.line};height:21px;margin:0}
  .${c} .note{margin-top:8px;font-size:8.6px;color:#6b7280;line-height:1.45}`;
  const page = `<section class="page ${c}"><header><div><h1>November 2026 Calendar With Holidays</h1><p class="sub">${t.mondayStart ? "Monday start" : "Sunday start"} · federal holidays outlined · Thanksgiving Thursday, Nov. 26 · clocks fall back Sunday, Nov. 1</p></div><div class="badge">30 days<br>Nov. 1-30, 2026</div></header>
    <div class="dow">${heads.map((h) => `<div>${h}</div>`).join("")}</div>
    <div class="grid">${cells.join("")}</div>
    <div class="cols"><div><h2>Holidays and key dates</h2><ul>${list}</ul></div><div><h2>Notes</h2><div class="notes">${Array.from({ length: 7 }, () => "<p></p>").join("")}</div></div></div>
    <p class="note">Federal holidays: U.S. Office of Personnel Management. Full moon: U.S. Naval Observatory (9:53 a.m. EST, Nov. 24). Diwali dates follow the U.S. calendars in our Diwali guide. More November 2026 designs: freshcalendars.com/november-calendars.html</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/november-2026-important-dates-days-until/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildNovemberHolidayDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("november-2026", THEMES.map((t) => ({ slug: `november-2026-calendar-with-holidays-${t.id}`, size: LETTER, html: sheet(fonts, t) })));
}
