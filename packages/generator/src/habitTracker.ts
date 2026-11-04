/**
 * 2027 habit tracker for /news/ (2027-habit-tracker-printable).
 * One landscape US Letter page: 12 month rows by 31 day columns, one box per day (365 boxes), the
 * weekday initial computed for every day, the ISO week number on every Monday and the 11 federal
 * holidays (OPM observed dates) marked. The kit year-reference draws mini months, not a fill-in grid,
 * so this story owns its generator.
 * Usage: pnpm fc news-habit-tracker
 */
import { LETTER_LANDSCAPE, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "2027-habit-tracker-printable";
const YEAR = 2027;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const INITIAL = ["S", "M", "T", "W", "T", "F", "S"];

/** OPM 2027 observed dates (https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/). */
export const HOLIDAYS_2027 = ["2027-01-01", "2027-01-18", "2027-02-15", "2027-05-31", "2027-06-18", "2027-07-05", "2027-09-06", "2027-10-11", "2027-11-11", "2027-11-25", "2027-12-24"];

export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const wd = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - wd);
  const y0 = Date.UTC(t.getUTCFullYear(), 0, 1);
  return Math.ceil(((t.getTime() - y0) / 86400000 + 1) / 7);
}

function sheet(fonts: string): string {
  const hol = new Set(HOLIDAYS_2027);
  const css = `
  .ht{padding:26px 30px 0}
  .ht header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #0f766e;padding-bottom:5px}
  .ht h1{font-family:Sora;font-weight:800;font-size:23px;margin:0;color:#134e4a;line-height:1.1}
  .ht .hab{display:flex;align-items:flex-end;gap:7px;font-size:11px;font-weight:700;color:#134e4a;width:330px}
  .ht .hab s{flex:1;border-bottom:1.5px solid #334155;height:15px;text-decoration:none}
  .ht table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:8px}
  .ht th{font-family:Sora;font-weight:700;font-size:8.5px;color:#134e4a;padding:0 0 2px;text-align:center}
  .ht th.m,.ht td.m{width:34px;text-align:left}
  .ht td.m{font-family:Sora;font-weight:800;font-size:10.5px;color:#134e4a}
  .ht td.d{height:45px;border:1px solid #64748b;padding:2px 0 0;vertical-align:top;text-align:center;position:relative}
  .ht td.d em{display:block;font-style:normal;font-size:8.2px;font-weight:700;color:#334155;line-height:1}
  .ht td.d b{display:block;font-family:Sora;font-size:8.2px;color:#0f766e;line-height:1;margin-top:1px}
  .ht td.we{background:#e2e8f0}
  .ht td.h{background:#134e4a}
  .ht td.h em,.ht td.h b{color:#fff}
  .ht td.x{background:#94a3b8;border-color:#94a3b8}
  .ht td.mon{border-left:2px solid #0f766e}
  .ht .keys{display:grid;grid-template-columns:1.25fr 1fr;gap:14px;margin-top:9px}
  .ht .box{border:1.5px solid #134e4a;border-radius:8px;padding:6px 10px}
  .ht .box h2{font-family:Sora;font-size:9.6px;text-transform:uppercase;letter-spacing:.06em;color:#0f766e;margin:0 0 4px}
  .ht .box p,.ht .box li{font-size:9.4px;line-height:1.4;color:#1e293b;margin:0}
  .ht .box ol{margin:0;padding-left:14px}
  .ht .sw{display:inline-block;width:10px;height:10px;vertical-align:-1px;margin-right:4px;border:1px solid #64748b}
  .ht .hl{columns:2;column-gap:14px;font-size:9px;line-height:1.4;color:#1e293b}
  .ht .hl div{break-inside:avoid}
  .ht .note{margin-top:6px;font-size:8.4px;color:#5a6b75;line-height:1.4}`;
  const head = `<tr><th class="m"></th>${Array.from({ length: 31 }, (_, i) => `<th>${i + 1}</th>`).join("")}</tr>`;
  let body = "";
  const holList: string[] = [];
  for (let m = 0; m < 12; m++) {
    const dim = new Date(Date.UTC(YEAR, m + 1, 0)).getUTCDate();
    let cells = "";
    for (let d = 1; d <= 31; d++) {
      if (d > dim) { cells += `<td class="d x"></td>`; continue; }
      const dt = new Date(Date.UTC(YEAR, m, d));
      const wd = dt.getUTCDay();
      const iso = `${YEAR}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isH = hol.has(iso);
      if (isH) holList.push(iso);
      const cls = ["d", wd === 0 || wd === 6 ? "we" : "", isH ? "h" : "", wd === 1 ? "mon" : ""].filter(Boolean).join(" ");
      cells += `<td class="${cls}"><em>${INITIAL[wd]}</em>${wd === 1 ? `<b>${isoWeek(dt)}</b>` : ""}</td>`;
    }
    body += `<tr><td class="m">${MONTHS[m]}</td>${cells}</tr>`;
  }
  const names: Record<string, string> = {
    "2027-01-01": "New Year's Day", "2027-01-18": "Martin Luther King Jr. Day", "2027-02-15": "Washington's Birthday", "2027-05-31": "Memorial Day",
    "2027-06-18": "Juneteenth (observed)", "2027-07-05": "Independence Day (observed)", "2027-09-06": "Labor Day", "2027-10-11": "Columbus Day",
    "2027-11-11": "Veterans Day", "2027-11-25": "Thanksgiving Day", "2027-12-24": "Christmas Day (observed)",
  };
  const label = (iso: string) => {
    const dt = new Date(iso + "T12:00:00Z");
    return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getUTCDay()]}., ${MONTHS[dt.getUTCMonth()]}. ${dt.getUTCDate()}`;
  };
  const page = `<section class="page ht"><header><h1>2027 Habit Tracker: 365-Day Grid</h1><div class="hab">Habit <s></s></div></header>
    <table><colgroup><col style="width:34px">${"<col>".repeat(31)}</colgroup><thead>${head}</thead><tbody>${body}</tbody></table>
    <div class="keys"><div class="box"><h2>How to use it</h2><ol><li>Write one habit at the top and pick a mark: a tick, a dot or a fill.</li><li>Mark the box under each day you do it, in the row of that month.</li><li>Check the week number on each Monday to review a full week.</li><li>Count the marks at the end of each row.</li></ol>
    <p style="margin-top:4px"><span class="sw" style="background:#e2e8f0"></span>Light gray: Saturday or Sunday. <span class="sw" style="background:#134e4a"></span>Dark: federal holiday, observed date. <span class="sw" style="background:#94a3b8"></span>Gray: no such day. Number beside a Monday: ISO week. Jan. 1 to 3 are in week 53 of 2026.</p></div>
    <div class="box"><h2>2027 federal holidays (observed)</h2><div class="hl">${holList.map((i) => `<div><b>${label(i)}</b> ${names[i]}</div>`).join("")}</div></div></div>
    <p class="note">Source: U.S. Office of Personnel Management, Federal Holidays (2027 observed dates); ISO 8601 week rule (International Organization for Standardization). 2027 has 365 days and 52 ISO weeks.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div></section>`;
  return doc(fonts, LETTER_LANDSCAPE, css, [page]);
}

export async function buildHabitTrackerDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("2027-habit-tracker", [{ slug: "2027-habit-tracker-365-day-grid", size: LETTER_LANDSCAPE, html: sheet(fonts) }]);
}
