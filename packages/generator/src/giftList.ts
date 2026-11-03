/**
 * Christmas gift list and budget planner 2026 for /news/ (christmas-gift-list-budget-planner-2026).
 * One US Letter page: a strip of 2026 ship-by dates (USPS lower 48, FedEx as reported by Value Added
 * Resource, UPS not yet published), a fill-in table (Person, Gift idea, Budget, Spent, Order by,
 * Bought / Wrapped / Shipped boxes) and a Total budget / Total spent / Left box. The text columns
 * are blank lines on purpose. No kit draws a fill-in gift table, so this story owns its generator.
 * Usage: pnpm fc news-gift-list
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "christmas-gift-list-budget-planner-2026";
const ROWS = 18;

/** [label, weekday and date]. */
const STRIP: [string, string][] = [
  ["FedEx Ground Economy", "Tue., Dec. 15"],
  ["USPS Ground Advantage, First-Class Mail", "Thu., Dec. 17"],
  ["USPS Priority Mail", "Fri., Dec. 18"],
  ["USPS Priority Mail Express", "Sat., Dec. 19"],
  ["FedEx overnight", "Wed., Dec. 23"],
  ["UPS", "Not yet published"],
];

function sheet(fonts: string): string {
  const css = `
  .gl{padding:28px 30px 0}
  .gl header{border-bottom:4px solid #b91c1c;padding-bottom:6px}
  .gl h1{font-family:Sora;font-weight:800;font-size:25px;margin:0;color:#14532d;line-height:1.1}
  .gl .sub{margin:4px 0 0;font-size:11px;color:#37474f}
  .gl .strip{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:9px 0 10px}
  .gl .strip div{border:1.5px solid #14532d;border-radius:7px;padding:5px 6px;text-align:center;line-height:1.2}
  .gl .strip span{display:block;font-size:8.6px;color:#37474f;min-height:21px}
  .gl .strip b{font-family:Sora;font-size:11.5px;color:#b91c1c}
  .gl .strip .no b{color:#475569;font-size:9.6px;line-height:1.45;display:block}
  .gl table.t{width:100%;border-collapse:collapse;table-layout:fixed}
  .gl .t th{background:#14532d;color:#fff;font-family:Sora;font-weight:700;font-size:9.6px;padding:5px 3px;text-align:left;border:1px solid #14532d}
  .gl .t th.c{text-align:center}
  .gl .t td{height:37px;border:1px solid #94a3b8;padding:0}
  .gl .t td.n{width:22px;text-align:center;font-size:9px;color:#475569;font-weight:700}
  .gl .t td.k{text-align:center}
  .gl .t td.k i{display:inline-block;width:13px;height:13px;border:1.5px solid #334155;border-radius:2px;vertical-align:middle}
  .gl .t tr:nth-child(even) td{background:#f1f5f9}
  .gl .bot{display:grid;grid-template-columns:1fr 1.15fr;gap:12px;margin-top:10px}
  .gl .box{border:2px solid #14532d;border-radius:9px;padding:7px 11px}
  .gl .box h2{font-family:Sora;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#b91c1c;margin:0 0 5px}
  .gl .line{display:flex;align-items:flex-end;gap:8px;font-size:11px;font-weight:700;margin-top:7px}
  .gl .line s{flex:1;border-bottom:1.5px solid #334155;height:15px;text-decoration:none}
  .gl .how{font-size:9.6px;line-height:1.4;color:#1e293b;margin:0;padding-left:14px}
  .gl .note{margin-top:7px;font-size:8.4px;color:#5a6b75;line-height:1.4}`;
  const body = Array.from({ length: ROWS }, (_, i) => `<tr><td class="n">${i + 1}</td><td></td><td></td><td></td><td></td><td></td><td class="k"><i></i></td><td class="k"><i></i></td><td class="k"><i></i></td></tr>`).join("");
  const page = `<section class="page gl"><header><h1>Christmas Gift List and Budget Planner 2026</h1><p class="sub">Christmas Day is Fri., Dec. 25, 2026 · write the person, the gift and the budget, then the date to order by</p></header>
    <div class="strip">${STRIP.map(([l, d]) => `<div${d.startsWith("Not") ? ' class="no"' : ""}><span>${l}</span><b>${d}</b></div>`).join("")}</div>
    <table class="t"><colgroup><col style="width:22px"><col style="width:21%"><col style="width:27%"><col style="width:10%"><col style="width:10%"><col style="width:12%"><col style="width:7%"><col style="width:7%"><col style="width:7%"></colgroup>
    <thead><tr><th class="c">#</th><th>Person</th><th>Gift idea</th><th>Budget</th><th>Spent</th><th>Order by</th><th class="c">Bought</th><th class="c">Wrapped</th><th class="c">Shipped</th></tr></thead><tbody>${body}</tbody></table>
    <div class="bot"><div class="box"><h2>Totals</h2><div class="line">Total budget <s></s></div><div class="line">Total spent <s></s></div><div class="line">Left <s></s></div></div>
    <div class="box"><h2>How to use it</h2><ol class="how"><li>Set one total budget, then split it across the people on your list.</li><li>Write the date to order by, ahead of the ship dates above.</li><li>Enter what you spend, tick the boxes and update Left.</li></ol></div></div>
    <p class="note">Source: U.S. Postal Service, 2026 Holiday Shipping Deadlines (lower 48 states, recommended dates, not guaranteed); FedEx 2026 Peak Last Day to Ship table as reported by Value Added Resource (Sept. 24, 2026); National Retail Federation (NRF) 2025 holiday survey (2025 average $627.93 per person on gifts; no 2026 figure given in the Oct. 20, 2026 release). UPS had not published 2026 last days to ship.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildGiftListDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("christmas-gift-list-2026", [{ slug: "christmas-gift-list-budget-planner-2026", size: LETTER, html: sheet(fonts) }]);
}
