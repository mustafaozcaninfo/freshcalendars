/**
 * Thanksgiving Day 2026 cooking plan for /news/ (thanksgiving-2026-planner-countdown-checklist).
 * One US Letter page: an unstuffed whole turkey at 325°F counted back from dinner time. Worked
 * example for dinner at 4 p.m. on Thu., Nov. 26 (times computed from the USDA roasting timetable as
 * published by University of Illinois Extension, plus the CDC's 20-minute rest) and a fill-in table
 * with blank slots for the reader's own dinner time. No kit draws a countdown-by-weight table with
 * blank fill-in slots, so this story owns its generator.
 * Usage: pnpm fc news-thanksgiving-cooking
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "thanksgiving-2026-cooking-plan";
const REST = 20; // minutes, CDC
const DINNER = 16 * 60; // 4 p.m.

/** [weight band, low minutes, top minutes] from the USDA unstuffed timetable at 325°F. */
const BANDS: [string, number, number][] = [
  ["8 to 12 lb", 165, 180],
  ["12 to 14 lb", 180, 225],
  ["14 to 18 lb", 225, 255],
  ["18 to 20 lb", 255, 270],
  ["20 to 24 lb", 270, 300],
];

function clock(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h >= 12 ? "p.m." : "a.m."}`;
}
function hm(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Computed rows for dinner at `dinner` minutes after midnight. */
export function plan(dinner: number) {
  return BANDS.map(([w, low, top]) => {
    const inOven = dinner - REST - top;
    return { w, range: `${hm(low)} to ${hm(top)}`, inOven: clock(inOven), check: clock(inOven + low), done: clock(inOven + top), carve: clock(dinner) };
  });
}

function sheet(fonts: string): string {
  const css = `
  .tc{padding:28px 32px 0}
  .tc header{border-bottom:4px solid #b45309;padding-bottom:6px}
  .tc h1{font-family:Sora;font-weight:800;font-size:25px;margin:0;color:#7c2d12;line-height:1.1}
  .tc .sub{margin:4px 0 0;font-size:11px;color:#37474f}
  .tc h2{font-family:Sora;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#9a3412;margin:12px 0 5px}
  .tc table.t{width:100%;border-collapse:collapse;table-layout:fixed}
  .tc .t th{background:#7c2d12;color:#fff;font-family:Sora;font-weight:700;font-size:10.4px;padding:7px 5px;text-align:left;border:1px solid #7c2d12}
  .tc .t td{border:1px solid #94a3b8;padding:8px 6px;font-size:12.5px;height:32px}
  .tc .t td.w{font-weight:700;font-family:Sora}
  .tc .t tr:nth-child(even) td{background:#f1f5f9}
  .tc .t.fill td{height:44px}
  .tc .dl{display:flex;align-items:flex-end;gap:8px;font-size:13px;font-weight:700;margin:6px 0 10px}
  .tc .dl s{width:170px;border-bottom:1.5px solid #334155;height:16px;text-decoration:none}
  .tc .steps{font-size:11.6px;line-height:1.6;color:#1e293b;margin:0;padding-left:16px}
  .tc .box{border:2px solid #7c2d12;border-radius:9px;padding:7px 12px;margin-top:12px}
  .tc .box h2{margin:0 0 4px}
  .tc .note{margin-top:8px;font-size:8.6px;color:#5a6b75;line-height:1.4}`;
  const rows = plan(DINNER).map((r) => `<tr><td class="w">${r.w}</td><td>${r.range}</td><td>${r.inOven}</td><td>${r.check}</td><td>${r.done}</td><td>${r.carve}</td></tr>`).join("");
  const head = `<colgroup><col style="width:16%"><col style="width:20%"><col style="width:16%"><col style="width:16%"><col style="width:16%"><col style="width:16%"></colgroup><thead><tr><th>Turkey weight</th><th>Roasting time at 325°F</th><th>Into the oven</th><th>Start checking</th><th>165°F by</th><th>Carve</th></tr></thead>`;
  const fill = BANDS.map(([w, , top]) => `<tr><td class="w">${w}</td><td>${hm(top)} + 20 min rest</td><td></td><td></td><td></td><td></td></tr>`).join("");
  const page = `<section class="page tc"><header><h1>Thanksgiving Day 2026 Cooking Plan</h1><p class="sub">Unstuffed whole turkey at 325°F, counted back from dinner · Thanksgiving is Thu., Nov. 26, 2026</p></header>
    <h2>Worked example: dinner at 4 p.m. on Thu., Nov. 26</h2>
    <table class="t">${head}<tbody>${rows}</tbody></table>
    <h2>Your dinner time</h2>
    <div class="dl">Dinner at <s></s> on Thu., Nov. 26</div>
    <table class="t fill">${head}<tbody>${fill}</tbody></table>
    <div class="box"><h2>On the day</h2><ul class="steps"><li>Into the oven = dinner time minus the longest roasting time minus the 20-minute rest.</li><li>Start checking at the shortest roasting time; the thermometer, not the clock, says when it is done.</li><li>Check three places, avoiding bone: thickest part of the breast, thigh and wing. The turkey must reach 165°F.</li><li>Let the turkey stand 20 minutes before carving. Cook stuffing in a casserole dish, not inside the turkey.</li><li>Refrigerate leftovers at 40°F or colder within 2 hours of cooking.</li></ul><div class="dl">Food off the table by <s></s> (2 hours after cooking)</div></div>
    <p class="note">Source: USDA roasting timetable for an unstuffed turkey at 325°F, as published by University of Illinois Extension; Centers for Disease Control and Prevention (CDC), Preparing Your Holiday Turkey Safely. The clock times are our plan built from the chart, not the USDA's words.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/thanksgiving-2026-planner-countdown-checklist/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildThanksgivingCookingDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("thanksgiving-2026", [{ slug: SLUG, size: LETTER, html: sheet(fonts) }]);
}
