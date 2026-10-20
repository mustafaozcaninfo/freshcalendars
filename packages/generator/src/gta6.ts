/**
 * GTA 6 launch countdown printable for /news/ (gta-6-october-22-2026-what-is-confirmed-release-countdown).
 * One US Letter page: Sunday-first weeks from Oct. 18 to Nov. 21, 2026, each day showing the days
 * left until the Nov. 19 launch. Only dates confirmed by Rockstar Games, Take-Two or PlayStation
 * are marked; Thursdays are shaded without claiming any announcement. No game art or logos.
 * Usage: pnpm fc news-gta6
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { DAY, renderPrintables, utc } from "./printables.js";

const LAUNCH = utc(2026, 10, 19);
/** [month (0-based), day, label]: confirmed by the source named in the sheet note. */
const MARKS: [number, number, string][] = [
  [10, 1, "Clocks fall back 1 hour"],
  [10, 9, "Take-Two results, 4:30 p.m. ET"],
  [10, 12, "Pre-load opens; boxed copy on sale"],
  [10, 19, "LAUNCH: PS5 and Xbox Series X<span class=\"pipe\">|</span>S"],
  [10, 20, "Pre-order bonus window closes"],
];

function countdown(fonts: string): string {
  const start = utc(2026, 9, 18), end = utc(2026, 10, 21);
  const cells: string[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += DAY) {
    const d = new Date(t), m = d.getUTCMonth(), day = d.getUTCDate(), left = Math.round((LAUNCH.getTime() - t) / DAY);
    const mark = MARKS.find(([mm, dd]) => mm === m && dd === day)?.[2];
    const cls = [left === 0 ? "launch" : "", mark && left !== 0 ? "mark" : "", d.getUTCDay() === 4 ? "thu" : "", left < 0 ? "after" : ""].filter(Boolean).join(" ");
    const num = day === 1 || t === start.getTime() ? `${m === 9 ? "Oct." : "Nov."} ${day}` : String(day);
    const tag = left > 0 ? `${left} day${left === 1 ? "" : "s"} to go` : left === 0 ? "Launch day" : "";
    cells.push(`<div class="c ${cls}"><b>${num}</b>${tag ? `<i>${tag}</i>` : ""}${mark ? `<em>${mark}</em>` : ""}</div>`);
  }
  const css = `
  .gc{padding:28px 32px 0}
  .gc h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:#3b0764;line-height:1.05}
  .gc .sub{margin:5px 0 14px;font-size:11px;color:#37474f}
  .gc .dow,.gc .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
  .gc .dow div{font-family:Sora;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#6b21a8;text-align:center;padding:3px 0}
  .gc .c{border:1.4px solid #e9d5ff;border-radius:8px;height:140px;padding:7px 8px;display:flex;flex-direction:column;gap:3px;background:#fff}
  .gc .c b{font-family:Sora;font-size:15px;color:#1e1b4b}
  .gc .c i{font-style:normal;font-size:9.5px;font-weight:700;color:#7c3aed}
  .gc .c em{font-style:normal;font-size:9.6px;font-weight:800;color:#be185d;line-height:1.2;margin-top:auto}
  .gc .c.thu{background:#faf5ff}
  .gc .c.mark{border-color:#f472b6;background:#fdf2f8}
  .gc .c.launch{background:#be185d;border-color:#be185d}
  .gc .c.launch b,.gc .c.launch i,.gc .c.launch em{color:#fff}
  .gc .c.after{opacity:.75}
  .gc .key{display:flex;gap:16px;margin:12px 0 0;font-size:10px;color:#334155}
  .gc .key span::before{content:"";display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px;border:1.4px solid #e9d5ff}
  .gc .key .k1::before{background:#faf5ff}.gc .key .k2::before{background:#fdf2f8;border-color:#f472b6}.gc .key .k3::before{background:#be185d;border-color:#be185d}
  .gc .plan{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:12px}
  .gc .plan div{border:1.4px solid #e9d5ff;border-radius:8px;padding:8px 10px;height:66px;font-size:10px;color:#334155}
  .gc .plan b{display:block;font-family:Sora;font-size:10.5px;color:#3b0764;margin-bottom:3px}
  .gc .pipe{font-family:Arial,sans-serif;font-weight:700}
  .gc .note{margin-top:10px;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page gc"><h1>GTA 6 Countdown Calendar, Oct. 18-Nov. 21, 2026</h1>
    <p class="sub">Grand Theft Auto VI launches Thursday, Nov. 19, 2026 · every box shows the days left · marked dates are confirmed by Rockstar Games, Take-Two or PlayStation</p>
    <div class="dow"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div>
    <div class="grid">${cells.join("")}</div>
    <div class="key"><span class="k1">Thursday (Rockstar's usual news day, not a promise)</span><span class="k2">Confirmed date</span><span class="k3">Launch day</span></div>
    <div class="plan"><div><b>My platform</b>PlayStation 5 · Xbox Series X<span class="pipe">|</span>S</div><div><b>Free storage needed</b>Check the store listing before Nov. 12</div><div><b>Day off / plans</b></div></div>
    <p class="note">Sources: Take-Two Interactive press releases of June 24 and Oct. 13, 2026; Rockstar Games Newswire; PlayStation Blog. Pre-loading for digital pre-orders and the boxed edition (a download code, no disc) start Nov. 12; pre-orders and purchases before Nov. 20 include the Vintage Vice City Pack. Standard Edition $79.99, Ultimate Edition $99.99. Rated M for Mature 17+ by the ESRB. Not affiliated with Rockstar Games.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/gta-6-october-22-2026-what-is-confirmed-release-countdown/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildGta6Downloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("gta-6", [{ slug: "gta-6-countdown-calendar-2026", size: LETTER, html: countdown(fonts) }]);
}
