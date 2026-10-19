/**
 * One-page "dates at a glance" printables for /news/ school-calendar and holiday stories.
 *
 *   downloads/nyc-public-schools-2026-27/nyc-public-schools-calendar-2026-27
 *   downloads/chicago-public-schools-2026-27/cps-calendar-2026-27
 *   downloads/uk-bank-holidays-2027/uk-bank-holidays-2027
 *
 * Dates are typed from the official calendars (NYCPS PDF, CPS family calendar PDF, gov.uk
 * bank-holidays.json snapshot in data/). Usage: pnpm fc news-datelists
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

type Row = { date: string; day: string; what: string; kind?: "off" | "break" | "remote" | "half" | "key" };
type Spec = { title: string; sub: string; accent: string; rows: Row[]; note: string; site: string; cols?: 1 | 2 };

function list(fonts: string, s: Spec): string {
  const cls = (k?: Row["kind"]) => (k ? ` class="${k}"` : "");
  const body = (rows: Row[]) => `<table><thead><tr><th>Date</th><th>Day</th><th>What happens</th></tr></thead><tbody>${rows.map((r) => `<tr${cls(r.kind)}><td class="d">${r.date}</td><td>${r.day}</td><td>${r.what}</td></tr>`).join("")}</tbody></table>`;
  const two = s.cols === 2;
  const half = Math.ceil(s.rows.length / 2);
  const css = `
  .l{padding:32px 34px 0}
  .l header{border-bottom:4px solid ${s.accent};padding-bottom:8px;margin-bottom:12px}
  .l h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:${s.accent};line-height:1.1}
  .l .sub{margin:4px 0 0;font-size:11.5px;color:#37474f}
  .l .cols{display:grid;grid-template-columns:${two ? "1fr 1fr" : "1fr"};gap:14px}
  .l table{width:100%;border-collapse:collapse;font-size:${two ? 10.4 : 11.6}px}
  .l th{background:${s.accent};color:#fff;font-family:Sora;font-size:9.5px;padding:6px;text-align:left}
  .l td{padding:${two ? 5 : 6.5}px 6px;border-bottom:1px solid #e3e8ee;vertical-align:top}
  .l td.d{font-weight:700;white-space:nowrap}
  .l tr.off td{background:#fde8e8}.l tr.break td{background:#fff1c2;font-weight:700}.l tr.remote td{background:#e0f2fe}.l tr.half td{background:#f1f5f9}.l tr.key td{background:#dcfce7;font-weight:700}
  .l .legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:10px;font-size:10px;color:#37474f}
  .l .legend i{display:inline-block;width:14px;height:11px;border-radius:3px;vertical-align:-2px;margin-right:5px}
  .l .note{margin-top:8px;font-size:9.6px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page l">
    <header><h1>${s.title}</h1><p class="sub">${s.sub}</p></header>
    <div class="cols">${two ? body(s.rows.slice(0, half)) + body(s.rows.slice(half)) : body(s.rows)}</div>
    <div class="legend"><span><i style="background:#fde8e8"></i>No school / holiday</span><span><i style="background:#fff1c2"></i>Break</span><span><i style="background:#e0f2fe"></i>Remote day</span><span><i style="background:#f1f5f9"></i>Early dismissal or no students</span><span><i style="background:#dcfce7"></i>First or last day</span></div>
    <p class="note">${s.note}</p>
    <div class="foot">Free printable from Fresh Calendars · ${s.site}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

const NYC: Row[] = [
  { date: "Sept. 10", day: "Thu", what: "First day of school", kind: "key" },
  { date: "Sept. 21", day: "Mon", what: "Yom Kippur, schools closed", kind: "off" },
  { date: "Oct. 12", day: "Mon", what: "Italian Heritage/Indigenous Peoples' Day, schools closed", kind: "off" },
  { date: "Nov. 3", day: "Tue", what: "Election Day, school in session remotely for all students", kind: "remote" },
  { date: "Nov. 5", day: "Thu", what: "Parent-teacher conferences, elementary; 3-hour early dismissal", kind: "half" },
  { date: "Nov. 11", day: "Wed", what: "Veterans Day, schools closed", kind: "off" },
  { date: "Nov. 12", day: "Thu", what: "Parent-teacher conferences, middle school and D75; early dismissal", kind: "half" },
  { date: "Nov. 20", day: "Fri", what: "Parent-teacher conferences, high school; early dismissal", kind: "half" },
  { date: "Nov. 26–27", day: "Thu–Fri", what: "Thanksgiving Recess, schools closed", kind: "break" },
  { date: "Dec. 24–Jan. 1", day: "Thu–Fri", what: "Winter Recess, schools closed", kind: "break" },
  { date: "Jan. 18", day: "Mon", what: "Martin Luther King Jr. Day, schools closed", kind: "off" },
  { date: "Jan. 26–29", day: "Tue–Fri", what: "Regents exams" },
  { date: "Feb. 1", day: "Mon", what: "Professional development; no high school students", kind: "half" },
  { date: "Feb. 2", day: "Tue", what: "Spring semester begins" },
  { date: "Feb. 15–19", day: "Mon–Fri", what: "Midwinter Recess, schools closed", kind: "break" },
  { date: "March 3–4", day: "Wed–Thu", what: "Parent-teacher conferences, elementary and middle; early dismissal", kind: "half" },
  { date: "March 9", day: "Tue", what: "Eid al-Fitr, schools closed", kind: "off" },
  { date: "March 19", day: "Fri", what: "Parent-teacher conferences, high school; early dismissal", kind: "half" },
  { date: "March 26", day: "Fri", what: "Good Friday, schools closed", kind: "off" },
  { date: "April 22–30", day: "Thu–Fri", what: "Spring Recess, schools closed", kind: "break" },
  { date: "May 17", day: "Mon", what: "Eid al-Adha, schools closed", kind: "off" },
  { date: "May 31", day: "Mon", what: "Memorial Day, schools closed", kind: "off" },
  { date: "June 8", day: "Tue", what: "Clerical Day; no classes for most students below high school", kind: "half" },
  { date: "June 10", day: "Thu", what: "Anniversary Day; students do not attend", kind: "off" },
  { date: "June 15–25", day: "", what: "Regents exams (June 15–18, 21–25)" },
  { date: "June 28", day: "Mon", what: "Last day of school", kind: "key" },
];
const CPS: Row[] = [
  { date: "Aug. 24", day: "Mon", what: "First day for K-12 (pre-K Aug. 25)", kind: "key" },
  { date: "Sept. 7", day: "Mon", what: "Labor Day, no school", kind: "off" },
  { date: "Sept. 25", day: "Fri", what: "Professional development, no students", kind: "half" },
  { date: "Oct. 12", day: "Mon", what: "Indigenous Peoples' Day, no school", kind: "off" },
  { date: "Oct. 23", day: "Fri", what: "End of first quarter" },
  { date: "Nov. 2", day: "Mon", what: "Parent-teacher conference day, no students", kind: "half" },
  { date: "Nov. 3", day: "Tue", what: "General Election (observed in lieu of Veterans Day), no school", kind: "off" },
  { date: "Nov. 11", day: "Wed", what: "Professional development, no students", kind: "half" },
  { date: "Nov. 26–27", day: "Thu–Fri", what: "Thanksgiving holiday", kind: "break" },
  { date: "Dec. 21–Jan. 1", day: "Mon–Fri", what: "Winter vacation, schools closed", kind: "break" },
  { date: "Jan. 4", day: "Mon", what: "Professional development, no students", kind: "half" },
  { date: "Jan. 18", day: "Mon", what: "Martin Luther King Jr. Day, no school", kind: "off" },
  { date: "Jan. 22", day: "Fri", what: "End of second quarter" },
  { date: "Jan. 29", day: "Fri", what: "Professional development, no students", kind: "half" },
  { date: "Feb. 15", day: "Mon", what: "Presidents' Day, no school", kind: "off" },
  { date: "Feb. 23", day: "Tue", what: "Professional development, no students", kind: "half" },
  { date: "March 22–26", day: "Mon–Fri", what: "Spring vacation, schools closed", kind: "break" },
  { date: "April 2", day: "Fri", what: "End of third quarter" },
  { date: "April 6", day: "Tue", what: "Professional development, no students", kind: "half" },
  { date: "April 12", day: "Mon", what: "Parent-teacher conference day, no students", kind: "half" },
  { date: "May 31", day: "Mon", what: "Memorial Day, no school", kind: "off" },
  { date: "June 11", day: "Fri", what: "Last day for K-12 (pre-K June 10)", kind: "key" },
];
const UK: Row[] = [
  { date: "Jan. 1", day: "Fri", what: "New Year's Day: all UK nations", kind: "off" },
  { date: "Jan. 4", day: "Mon", what: "2nd January (substitute day): Scotland only", kind: "off" },
  { date: "March 17", day: "Wed", what: "St Patrick's Day: Northern Ireland only", kind: "off" },
  { date: "March 26", day: "Fri", what: "Good Friday: all UK nations", kind: "off" },
  { date: "March 29", day: "Mon", what: "Easter Monday: England, Wales and Northern Ireland", kind: "off" },
  { date: "May 3", day: "Mon", what: "Early May bank holiday: all UK nations", kind: "off" },
  { date: "May 31", day: "Mon", what: "Spring bank holiday: all UK nations", kind: "off" },
  { date: "July 12", day: "Mon", what: "Battle of the Boyne (Orangemen's Day): Northern Ireland only", kind: "off" },
  { date: "Aug. 2", day: "Mon", what: "Summer bank holiday: Scotland only", kind: "off" },
  { date: "Aug. 30", day: "Mon", what: "Summer bank holiday: England, Wales and Northern Ireland", kind: "off" },
  { date: "Nov. 30", day: "Tue", what: "St Andrew's Day: Scotland only", kind: "off" },
  { date: "Dec. 27", day: "Mon", what: "Christmas Day (substitute day): all UK nations", kind: "break" },
  { date: "Dec. 28", day: "Tue", what: "Boxing Day (substitute day): all UK nations", kind: "break" },
];

export async function buildDateListDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("nyc-public-schools-2026-27", [{ slug: "nyc-public-schools-calendar-2026-27", size: LETTER, html: list(fonts, { title: "NYC Public Schools Calendar 2026–27", sub: "Key dates for 3-K to grade 12 · first day Thursday, Sept. 10, 2026 · last day Monday, June 28, 2027", accent: "#1e3a8a", rows: NYC, cols: 2, note: "Source: NYC Public Schools 2026–27 school year calendar. Parent-teacher conference dates can differ by school. Charter, private and parochial schools set their own calendars. On snow or emergency days NYCPS may hold school remotely.", site: "freshcalendars.com/news/nyc-public-schools-calendar-2026-27-breaks-holidays/" }) }]);
  await renderPrintables("chicago-public-schools-2026-27", [{ slug: "cps-calendar-2026-27", size: LETTER, html: list(fonts, { title: "Chicago Public Schools Calendar 2026–27", sub: "Elementary and high schools · first day Monday, Aug. 24, 2026 · last day Friday, June 11, 2027 · 176 student days", accent: "#0f4c81", rows: CPS, note: "Source: CPS 2026–2027 family calendar (last updated March 5, 2026). June 15–17 and 21–22 are emergency days, used only if student days fall below the state requirement.", site: "freshcalendars.com/news/chicago-public-schools-calendar-2026-27-breaks/" }) }]);
  await renderPrintables("uk-bank-holidays-2027", [{ slug: "uk-bank-holidays-2027", size: LETTER, html: list(fonts, { title: "UK Bank Holidays 2027", sub: "England and Wales: 8 · Scotland: 9 · Northern Ireland: 10 · Christmas and Boxing Day move to Monday 27 and Tuesday 28 December", accent: "#7f1d1d", rows: UK, note: "Source: GOV.UK bank holidays. Substitute days apply when a bank holiday falls on a weekend. In 2026, Boxing Day (Saturday 26 December) is observed on Monday 28 December.", site: "freshcalendars.com/news/uk-bank-holidays-2027-dates-england-scotland-northern-ireland/" }) }]);
}
