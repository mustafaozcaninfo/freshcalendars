/**
 * Week number printables for /news/ (four independent Fresh Calendars templates).
 *
 *   1. week-number-calendar-2027     — ISO 8601 year at a glance, Monday start, week column
 *   2. week-numbers-list-2027        — every ISO week of 2027 with its Monday-to-Sunday dates
 *   3. us-week-number-calendar-2027  — Sunday start, U.S. numbering (week 1 holds Jan. 1; Excel WEEKNUM)
 *   4. week-number-calendar-2026     — ISO 8601 year at a glance for 2026 (a 53-week year)
 *
 * Usage: pnpm fc news-weeks
 */
import { holidaysForYear } from "@freshcalendars/engine";
import { LETTER, doc, fontFaces } from "./julian.js";
import { DAY, MON3, MONTHS, daysIn, renderPrintables, utc } from "./printables.js";

const SITE = "freshcalendars.com/news/week-numbers-2027-calendar-printable/";

/** ISO 8601 week (weeks start Monday; week 1 holds the year's first Thursday). */
export function isoWeek(d: Date): { year: number; week: number } {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (t.getUTCDay() + 6) % 7; // Mon 0 … Sun 6
  t.setUTCDate(t.getUTCDate() - dow + 3); // Thursday of this week
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / DAY + 1) / 7);
  return { year, week };
}
/** U.S. convention (Excel WEEKNUM default): weeks start Sunday, week 1 is the week holding Jan. 1. */
export function usWeek(d: Date): number {
  const jan1 = Date.UTC(d.getUTCFullYear(), 0, 1);
  const off = new Date(jan1).getUTCDay();
  return Math.floor(((d.getTime() - jan1) / DAY + off) / 7) + 1;
}
export const isoWeeksInYear = (y: number) => isoWeek(utc(y, 11, 28)).week;

const holidays = (y: number) => new Map(holidaysForYear(y, { federalOnly: true }).map((h) => [`${h.date.getMonth()}-${h.date.getDate()}`, h.name]));
const md = (d: Date) => `${MON3[d.getUTCMonth()]} ${d.getUTCDate()}`;

// ── Year-at-a-glance grid with a week column (ISO Monday start or U.S. Sunday start) ──
function yearGrid(y: number, fonts: string, mode: "iso" | "us"): string {
  const hol = holidays(y);
  const startDow = mode === "iso" ? 1 : 0;
  const heads = mode === "iso" ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const months = MONTHS.map((name, m) => {
    const first = utc(y, m, 1);
    const lead = (first.getUTCDay() - startDow + 7) % 7;
    const rows: string[] = [];
    let day = 1 - lead;
    while (day <= daysIn(y, m)) {
      const rowStart = utc(y, m, day);
      // The row's week number: ISO uses the row's Thursday; U.S. uses the first in-month day.
      const wk = mode === "iso" ? isoWeek(new Date(rowStart.getTime() + 3 * DAY)).week : usWeek(utc(y, m, Math.max(day, 1)));
      const cells: string[] = [];
      for (let i = 0; i < 7; i++, day++) {
        if (day < 1 || day > daysIn(y, m)) { cells.push("<td></td>"); continue; }
        const dow = utc(y, m, day).getUTCDay();
        const h = hol.get(`${m}-${day}`);
        cells.push(`<td class="${dow === 0 || dow === 6 ? "we" : ""}${h ? " hol" : ""}"${h ? ` title="${h}"` : ""}>${day}</td>`);
      }
      rows.push(`<tr><th class="wk">${wk}</th>${cells.join("")}</tr>`);
    }
    return `<div class="mo"><h2>${name}</h2><table><thead><tr><th class="wk">Wk</th>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  }).join("");
  const total = mode === "iso" ? isoWeeksInYear(y) : usWeek(utc(y, 11, 31));
  const jan4 = utc(y, 0, 4), firstMon = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * DAY);
  // Rows per band of three months sets the cell height so every year fills one page.
  const rowsIn = (m: number) => Math.ceil((((utc(y, m, 1).getUTCDay() - startDow + 7) % 7) + daysIn(y, m)) / 7);
  const bandRows = [0, 3, 6, 9].reduce((n, b) => n + Math.max(rowsIn(b), rowsIn(b + 1), rowsIn(b + 2)), 0);
  const cellH = Math.min(30, Math.floor((905 - 4 * 48) / bandRows) - 7);
  const sub = mode === "iso"
    ? `ISO 8601 week numbers · weeks start Monday · ${y} has ${total} weeks · week 1 begins Monday, ${md(firstMon)}${firstMon.getUTCFullYear() !== y ? `, ${firstMon.getUTCFullYear()}` : ""}`
    : `U.S. week numbers · weeks start Sunday · week 1 is the week of Jan. 1 · ${y} runs to week ${total}`;
  const accent = mode === "iso" ? "#007bff" : "#ec1d00";
  const css = `
  .w1{padding:34px 34px 0}
  .w1 header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid ${accent};padding-bottom:10px;margin-bottom:14px}
  .w1 h1{font-family:Sora;font-weight:800;font-size:${mode === "iso" ? 33 : 30}px;margin:0;color:#0b3d66;line-height:1;white-space:nowrap}
  .w1 h1 span{color:${accent}}
  .w1 .sub{margin:6px 0 0;font-size:11.5px;color:#37474f}
  .w1 .badge{font-family:Sora;font-weight:800;font-size:13px;background:#fccc00;color:#1d2a3a;border-radius:8px;padding:6px 10px;white-space:nowrap}
  .w1 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px 16px}
  .w1 .mo h2{font-family:Sora;font-weight:700;font-size:14px;margin:0 0 4px;color:#0b3d66}
  .w1 table{width:100%;border-collapse:collapse;font-size:11px;font-variant-numeric:tabular-nums;table-layout:fixed}
  .w1 thead th{font-family:Sora;font-weight:700;font-size:8.6px;color:#5a6b75;padding:3px 0;border-bottom:1px solid #dbe4ee}
  .w1 td{text-align:center;padding:3.4px 0;height:${cellH}px;font-size:12px}
  .w1 td.we{color:#5a6b75}
  .w1 td.hol{background:#ffe9a8;color:#1d2a3a;font-weight:700;border-radius:4px}
  .w1 th.wk{width:24px;background:${accent};color:#fff;font-family:Sora;font-weight:700;font-size:9.5px;border-radius:4px}
  .w1 thead th.wk{background:#0b3d66}
  .w1 .legend{display:flex;gap:18px;margin-top:14px;font-size:10px;color:#37474f}
  .w1 .legend i{display:inline-block;width:14px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:5px}`;
  const title = mode === "iso" ? `${y} Calendar with <span>Week Numbers</span>` : `${y} Calendar with <span>U.S. Week Numbers</span>`;
  const page = `<section class="page w1">
    <header><div><h1>${title}</h1><p class="sub">${sub}</p></div><div class="badge">${total} weeks</div></header>
    <div class="grid">${months}</div>
    <div class="legend"><span><i style="background:${accent}"></i>Week number</span><span><i style="background:#ffe9a8"></i>U.S. federal holiday (actual date)</span><span>${mode === "iso" ? "Used in Europe, by ISO 8601 and by Excel ISOWEEKNUM" : "Matches Excel WEEKNUM with its default setting"}</span></div>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── List of every ISO week with dates ────────────────────────────────────────
function weekList(y: number, fonts: string): string {
  const n = isoWeeksInYear(y);
  let mon = utc(y, 0, 4); mon = new Date(mon.getTime() - ((mon.getUTCDay() + 6) % 7) * DAY);
  const hol = holidays(y);
  const rows: string[] = [];
  for (let w = 1; w <= n; w++) {
    const a = new Date(mon.getTime() + (w - 1) * 7 * DAY), b = new Date(a.getTime() + 6 * DAY);
    const q = Math.floor(a.getUTCMonth() / 3) + 1;
    const names: string[] = [];
    for (let i = 0; i < 7; i++) { const d = new Date(a.getTime() + i * DAY); if (d.getUTCFullYear() === y) { const h = hol.get(`${d.getUTCMonth()}-${d.getUTCDate()}`); if (h) names.push(h); } }
    rows.push(`<tr><td class="n">W${String(w).padStart(2, "0")}</td><td>${md(a)}${a.getUTCFullYear() !== y ? `, ${a.getUTCFullYear()}` : ""}</td><td>${md(b)}${b.getUTCFullYear() !== y ? `, ${b.getUTCFullYear()}` : ""}</td><td class="q">Q${q}</td><td class="h">${names.join(", ")}</td></tr>`);
  }
  const half = Math.ceil(n / 2);
  const table = (r: string[]) => `<table><thead><tr><th>Week</th><th>Monday</th><th>Sunday</th><th>Qtr</th><th>Holiday</th></tr></thead><tbody>${r.join("")}</tbody></table>`;
  const css = `
  .w2{padding:36px 36px 0}
  .w2 h1{font-family:Sora;font-weight:800;font-size:34px;margin:0;color:#0b3d66}
  .w2 .sub{margin:4px 0 14px;font-size:11.5px;color:#37474f}
  .w2 .cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .w2 table{width:100%;border-collapse:collapse;font-size:10.6px;font-variant-numeric:tabular-nums}
  .w2 th{background:#0b3d66;color:#fff;font-family:Sora;font-weight:700;font-size:9.5px;padding:5px 4px;text-align:left}
  .w2 td{padding:7.2px 4px;border-bottom:1px solid #e3eaf2;white-space:nowrap}
  .w2 tr:nth-child(even) td{background:#f5f8fc}
  .w2 td.n{font-family:Sora;font-weight:800;color:#007bff}
  .w2 td.q{color:#5a6b75}
  .w2 td.h{font-size:9px;color:#8a5a00;white-space:normal;max-width:110px}
  .w2 .note{margin-top:12px;font-size:10px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page w2">
    <h1>${y} Week Numbers List</h1>
    <p class="sub">All ${n} ISO 8601 weeks of ${y}, Monday to Sunday · Week 1 is the week with the year's first Thursday</p>
    <div class="cols">${table(rows.slice(0, half))}${table(rows.slice(half))}</div>
    <p class="note">${y === 2027 ? "Jan. 1 to 3, 2027 belong to week 53 of 2026. Week 52 of 2027 ends on Sunday, Jan. 2, 2028." : ""} Quarters follow the Monday of each week. Holidays are U.S. federal holidays on their actual dates; when one falls on a weekend, federal offices close on the nearest weekday.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildWeekNumberDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("week-numbers-2027", [
    { slug: "week-number-calendar-2027", size: LETTER, html: yearGrid(2027, fonts, "iso") },
    { slug: "week-numbers-list-2027", size: LETTER, html: weekList(2027, fonts) },
    { slug: "us-week-number-calendar-2027", size: LETTER, html: yearGrid(2027, fonts, "us") },
    { slug: "week-number-calendar-2026", size: LETTER, html: yearGrid(2026, fonts, "iso") },
  ]);
}
