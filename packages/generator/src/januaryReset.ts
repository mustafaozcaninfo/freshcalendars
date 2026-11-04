/**
 * January 2027 Reset Planner for /news/ (january-2027-reset-planner-printable).
 * One four-page portrait US Letter PDF: goals, a 31-day habit tracker (weekday and date computed for
 * every day, with the OPM and IRS dates of the month marked), a dated-deadline list and a monthly
 * review. news-assets draws one page per printable and no kit draws a goal and habit planner, so
 * this story owns its generator.
 * Usage: pnpm fc news-january-reset
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "january-2027-reset-planner-printable";
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WD_FULL = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
const wd = (d: number) => new Date(Date.UTC(2027, 0, d)).getUTCDay();

/** Dates marked on the tracker: OPM Federal Holidays and IRS Publication 505 (see the story's sources). */
const MARKS: Record<number, string> = { 1: "New Year's Day", 15: "IRS estimated tax due", 18: "Martin Luther King Jr. Day", 31: "IRS filing option date" };

const css = `
  .pg{padding:34px 40px 0}
  .pg header{border-bottom:3px solid #1e3a8a;padding-bottom:7px}
  .pg .kick{font-family:Sora;font-weight:700;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#1d4ed8;margin:0 0 3px}
  .pg h1{font-family:Sora;font-weight:800;font-size:25px;margin:0;color:#172554;line-height:1.1}
  .pg .sub{font-size:11.5px;color:#334155;margin:4px 0 0;line-height:1.4}
  .pg h2{font-family:Sora;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#1e3a8a;margin:0 0 5px}
  .pg .ln{display:flex;align-items:flex-end;gap:8px;font-size:11px;font-weight:700;color:#172554;margin-top:9px}
  .pg .ln s{flex:1;border-bottom:1.5px solid #475569;height:17px;text-decoration:none}
  .pg .goal{border:1.5px solid #1e3a8a;border-radius:9px;padding:9px 13px 11px;margin-top:13px}
  .pg .goal h2{display:flex;justify-content:space-between}
  .pg .tip{margin-top:14px;border-left:4px solid #1d4ed8;background:#eff6ff;padding:8px 12px;font-size:11px;line-height:1.5;color:#172554}
  .pg .note{font-size:9px;line-height:1.45;color:#475569;margin-top:10px}
  .pg table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:10px}
  .pg th{font-family:Sora;font-weight:700;font-size:9px;color:#172554;text-align:center;padding:0 2px 4px;vertical-align:bottom}
  .pg td{border:1px solid #64748b;height:23px;padding:0 5px;font-size:9.5px;color:#1e293b}
  .pg td.d{font-family:Sora;font-weight:700;color:#172554;white-space:nowrap}
  .pg td.d i{font-style:normal;display:inline-block;width:16px;color:#334155}
  .pg td.we{background:#e2e8f0}
  .pg td.mk{font-size:8.5px;line-height:1.15;color:#172554;font-weight:700}
  .pg td.mk b{border-bottom:2px solid #172554}
  .pg .bx{display:block;width:13px;height:13px;border:1.5px solid #475569;border-radius:3px;margin:0 auto}
  .pg .legend{font-size:9.5px;color:#1e293b;line-height:1.5;margin-top:8px}
  .pg .sw{display:inline-block;width:10px;height:10px;vertical-align:-1px;margin-right:4px;border:1px solid #64748b;background:#e2e8f0}
  .pg td.t{font-weight:700;color:#172554;font-size:11px}
  .pg td.w{font-size:10.5px;line-height:1.35;height:auto;padding:7px 8px}
  .pg td.o{height:36px}
  .pg .two{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:13px}
  .pg .two .goal{margin-top:0}
  .pg .area{border-bottom:1px solid #64748b;height:25px}
  .pg .stat td{height:30px}
`;

const lines = (n: number) => Array.from({ length: n }, () => `<div class="area"></div>`).join("");
const foot = `<div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div>`;

function goals(): string {
  const goal = (n: number) => `<div class="goal"><h2>Goal ${n}</h2>
    <div class="ln">I want to <s></s></div>
    <div class="ln">Why it matters <s></s></div>
    <div class="ln">Steps I will take <s></s></div><div class="ln"><s></s></div>
    <div class="ln">First step, and the date I start <s></s></div></div>`;
  return `<section class="page pg"><header><p class="kick">January 2027 reset planner · page 1 of 4</p><h1>My January 2027 Goals</h1>
    <p class="sub">The month runs from Friday, Jan. 1 to Sunday, Jan. 31, 2027. Pick up to three goals and write the steps down.</p></header>
    ${goal(1)}${goal(2)}${goal(3)}
    <div class="tip">NIH's employee wellness program tip: "Write down the steps that will help you to achieve them." and "A journal, app, or online diary will help keep your focus."</div>
    <p class="note">Source: Wellness@NIH, Maintaining Healthy Habits (National Institutes of Health, Feb. 3, 2020).</p>${foot}</section>`;
}

function tracker(): string {
  let rows = "";
  for (let d = 1; d <= 31; d++) {
    const w = wd(d);
    const we = w === 0 || w === 6 ? " we" : "";
    const mark = MARKS[d] ? `<td class="mk${we}"><b>${MARKS[d]}</b></td>` : `<td class="${we.trim()}"></td>`;
    rows += `<tr><td class="d${we}"><i>${WD[w][0]}</i>Jan. ${d}</td>${mark}${Array.from({ length: 5 }, () => `<td class="${we.trim()}"><span class="bx"></span></td>`).join("")}</tr>`;
  }
  const head = `<tr><th style="width:74px">Day</th><th style="width:132px">Dated item</th>${[1, 2, 3, 4, 5].map((n) => `<th>Habit ${n}<div style="border-bottom:1px solid #64748b;height:15px;margin-top:2px"></div></th>`).join("")}</tr>`;
  return `<section class="page pg"><header><p class="kick">January 2027 reset planner · page 2 of 4</p><h1>January 2027 Habit Tracker</h1>
    <p class="sub">Write up to five habits above the columns, then tick a box at the end of each day. Jan. 1, 2027 is a Friday.</p></header>
    <table>${head}${rows}</table>
    <p class="legend"><span class="sw"></span>Shaded rows are Saturdays and Sundays. Weekday letters: S Sunday, M Monday, T Tuesday, W Wednesday, F Friday. Underlined items are dates from the next page.</p>
    ${foot}</section>`;
}

function dates(): string {
  const row = (when: string, what: string, how: string) => `<tr><td class="t" style="width:112px">${when}</td><td class="w">${what}</td><td class="w" style="width:190px">${how}</td><td style="width:44px"><span class="bx"></span></td></tr>`;
  const blank = `<tr><td class="o"></td><td class="o"></td><td class="o"></td><td><span class="bx"></span></td></tr>`;
  return `<section class="page pg"><header><p class="kick">January 2027 reset planner · page 3 of 4</p><h1>January 2027 Dates to Plan Around</h1>
    <p class="sub">Official dates for January and February 2027, with room for your own deadlines. Tick Done as you go.</p></header>
    <table><thead><tr><th style="text-align:left">Date</th><th style="text-align:left">What</th><th style="text-align:left">Plan</th><th>Done</th></tr></thead><tbody>
    ${row("Fri., Jan. 1", "New Year's Day, a federal holiday (Office of Personnel Management)", "Day 1 of the habit tracker")}
    ${row("Fri., Jan. 15", "Fourth estimated tax payment for 2026 due (Internal Revenue Service, Publication 505)", "Skip it only if you file your 2026 return by Jan. 31 and pay the rest")}
    ${row("Mon., Jan. 18", "Birthday of Martin Luther King, Jr., a federal holiday (Office of Personnel Management)", "A day off from routine: plan your habits for it")}
    ${row("Sun., Jan. 31", "Last day of the IRS option: file by then and pay the tax owed to skip the Jan. 15 payment", "Last day of the habit tracker")}
    ${row("Mon., Feb. 15", "Washington's Birthday, a federal holiday (Office of Personnel Management)", "Next date for your review")}
    <tr><td class="t">Not yet announced</td><td class="w">IRS 2027 filing season opening date. Last year, the IRS opened the 2026 season on Jan. 26, 2026.</td><td class="w">Write the date here:</td><td><span class="bx"></span></td></tr>
    ${blank}${blank}${blank}${blank}${blank}${blank}
    </tbody></table>
    <p class="note">Source: U.S. Office of Personnel Management (OPM), Federal Holidays; Internal Revenue Service (IRS), Publication 505 (2026) and news release IR-2026-12, IRS opens 2026 filing season (Jan. 26, 2026); checked Nov. 4, 2026. The sheet lists the 2027 federal holidays for January and February only.</p>${foot}</section>`;
}

function review(): string {
  const habit = (n: number) => `<tr><td>Habit ${n}: ______________</td><td style="width:90px">___ of 31</td></tr>`;
  const box = (h: string) => `<div class="goal"><h2>${h}</h2>${lines(4)}</div>`;
  return `<section class="page pg"><header><p class="kick">January 2027 reset planner · page 4 of 4</p><h1>January 2027 Monthly Review</h1>
    <p class="sub">Fill it in after Sunday, Jan. 31: count the ticks, then decide what carries into February.</p></header>
    <table class="stat"><thead><tr><th style="text-align:left">Habit</th><th>Days done</th></tr></thead><tbody>${[1, 2, 3, 4, 5].map(habit).join("")}</tbody></table>
    <div class="two">${box("What went well")}${box("What got in the way")}</div>
    <div class="two">${box("Keep doing")}${box("Change or drop")}</div>
    <div class="goal"><h2>Goals check</h2>
      <div class="ln">Goal 1: done, partly done or not started <s></s></div>
      <div class="ln">Goal 2: done, partly done or not started <s></s></div>
      <div class="ln">Goal 3: done, partly done or not started <s></s></div></div>
    <div class="goal"><h2>My focus for February 2027</h2>${lines(2)}</div>
    ${foot}</section>`;
}

export async function buildJanuaryResetDownloads(): Promise<void> {
  const fonts = await fontFaces();
  const html = doc(fonts, LETTER, css, [goals(), tracker(), dates(), review()]);
  await renderPrintables(SLUG, [{ slug: "january-2027-reset-planner", size: LETTER, html }]);
}
