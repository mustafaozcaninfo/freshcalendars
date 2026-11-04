/**
 * Dry January 2027 tracker for /news/ (dry-january-2027-tracker).
 * One portrait US Letter page: 31 day boxes laid out Monday to Sunday (weeks of Jan. 1-3, 4-10, 11-17,
 * 18-24, 25-31), weekday computed for every day, weekends shaded, a "why I'm doing it" line, a weekly
 * check-in column and an optional money-saved line. No kit draws a 31-day fill-in tracker, so this
 * story owns its generator.
 * Usage: pnpm fc news-dry-january
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "dry-january-2027-tracker";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function sheet(fonts: string): string {
  const css = `
  .dj{padding:28px 32px 0}
  .dj header{border-bottom:3px solid #0f766e;padding-bottom:6px}
  .dj h1{font-family:Sora;font-weight:800;font-size:25px;margin:0;color:#134e4a;line-height:1.1}
  .dj .sub{font-size:11px;color:#334155;margin:3px 0 0}
  .dj .why{display:flex;align-items:flex-end;gap:8px;margin-top:12px;font-size:11.5px;font-weight:700;color:#134e4a}
  .dj .why s{flex:1;border-bottom:1.5px solid #334155;height:16px;text-decoration:none}
  .dj table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:12px}
  .dj th{font-family:Sora;font-weight:700;font-size:9.5px;color:#134e4a;padding:0 0 3px;text-align:center}
  .dj td.d{height:118px;border:1px solid #64748b;padding:4px 5px;vertical-align:top;position:relative}
  .dj td.d b{display:block;font-family:Sora;font-size:15px;color:#134e4a;line-height:1}
  .dj td.d em{display:block;font-style:normal;font-size:8.5px;font-weight:700;color:#334155;margin-top:2px}
  .dj td.we{background:#e2e8f0}
  .dj td.x{background:#94a3b8;border-color:#94a3b8}
  .dj td.w{border:1px solid #64748b;padding:5px 6px;vertical-align:top;font-size:9px;color:#1e293b;line-height:1.3}
  .dj td.w b{font-family:Sora;font-size:9.5px;color:#0f766e;display:block;margin-bottom:5px}
  .dj td.w s{display:block;border-bottom:1px solid #64748b;height:17px;text-decoration:none;font-size:8.8px;color:#1e293b;padding-top:3px;box-sizing:border-box}
  .dj .keys{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px}
  .dj .box{border:1.5px solid #134e4a;border-radius:8px;padding:7px 11px}
  .dj .box h2{font-family:Sora;font-size:9.8px;text-transform:uppercase;letter-spacing:.06em;color:#0f766e;margin:0 0 4px}
  .dj .box p,.dj .box li{font-size:9.6px;line-height:1.45;color:#1e293b;margin:0}
  .dj .box ol{margin:0;padding-left:14px}
  .dj .sw{display:inline-block;width:10px;height:10px;vertical-align:-1px;margin-right:4px;border:1px solid #64748b}
  .dj .lines{margin-top:12px;font-size:10px;font-weight:700;color:#134e4a}
  .dj .lines div{border-bottom:1px solid #64748b;height:26px;margin-top:0}
  .dj .note{margin-top:9px;font-size:8.6px;color:#5a6b75;line-height:1.45}`;
  const head = `<tr>${DAYS.map((d) => `<th>${d}</th>`).join("")}<th>Weekly check-in</th></tr>`;
  let body = "";
  let day = 1;
  let week = 0;
  const weekLabels: string[] = [];
  while (day <= 31) {
    week++;
    let cells = "";
    const first = day;
    for (let col = 0; col < 7; col++) {
      // Monday = column 0; the Date weekday (0 = Sunday) maps to (wd + 6) % 7.
      const wd = day <= 31 ? new Date(Date.UTC(2027, 0, day)).getUTCDay() : -1;
      if (day > 31 || (week === 1 && (wd + 6) % 7 !== col)) { cells += `<td class="d x"></td>`; continue; }
      cells += `<td class="d${col >= 5 ? " we" : ""}"><b>${day}</b><em>${FULL[wd]}</em></td>`;
      day++;
    }
    const last = day - 1;
    weekLabels.push(first === last ? `Jan. ${first}` : `Jan. ${first}-${last}`);
    body += `<tr>${cells}<td class="w"><b>Jan. ${first}-${last}</b><s>Dry days: __ of ${last - first + 1}</s><s>Money saved: $</s><s>Notes</s></td></tr>`;
  }
  const page = `<section class="page dj"><header><h1>Dry January 2027: 31-Day Tracker</h1><p class="sub">Friday, Jan. 1 to Sunday, Jan. 31, 2027. Mark each box on a dry day.</p></header>
    <div class="why">Why I'm doing it <s></s></div>
    <table><colgroup>${"<col>".repeat(7)}<col style="width:128px"></colgroup><thead>${head}</thead><tbody>${body}</tbody></table>
    <div class="keys"><div class="box"><h2>How to use it</h2><ol><li>Write your reason on the line at the top.</li><li>Tick or fill each box at the end of a dry day.</li><li>At the end of each week, count the dry days and add up any money saved.</li><li>Money saved is optional: use the line if you want to track it.</li></ol>
    <p style="margin-top:4px"><span class="sw" style="background:#e2e8f0"></span>Light gray: Saturday or Sunday (five weekends in January 2027). <span class="sw" style="background:#94a3b8"></span>Gray: not in January.</p></div>
    <div class="box"><h2>Good to know</h2><p>In the United States, a standard drink has 0.6 ounces (14 grams) of pure alcohol (CDC).</p><p style="margin-top:4px">Anyone who drinks heavily every day should talk to a doctor before stopping. Free help: SAMHSA National Helpline, 1-800-662-HELP (4357).</p></div></div>
    <div class="lines">Month review: what was hardest, what helped<div></div><div></div></div>
    <p class="note">Source: Alcohol Change UK, The Dry January challenge; Centers for Disease Control and Prevention (CDC), About Standard Drink Sizes; Substance Abuse and Mental Health Services Administration (SAMHSA), National Helpline.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildDryJanuaryDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("dry-january-2027", [{ slug: "dry-january-2027-31-day-tracker", size: LETTER, html: sheet(fonts) }]);
}
