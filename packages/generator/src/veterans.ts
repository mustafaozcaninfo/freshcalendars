/**
 * Veterans Day 2026 free meals cheat sheet for /news/ (veterans-day-free-meals-discounts).
 * One US Letter page: offers confirmed for 2026 first, then 2025 offers to watch for, with the
 * fine print as short tags, and a cut-out wallet card listing accepted proof of service.
 * Offers come from Military.com's 2026 and 2025 lists (checked Oct. 20, 2026) and brand pages
 * or press releases (Red Robin, Oct. 22, 2026);
 * no logos. Usage: pnpm fc news-veterans
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

/** [brand, offer, tags]. Tags: D dine-in only, ID proof of service, F family or spouse included, T time window. */
type Deal = [string, string, string[]];
export const CONFIRMED_2026: Deal[] = [
  ["Bob Evans", "Free meal, select menu", ["D"]],
  ["Bonefish Grill", "Free Bang Bang Shrimp + nonalcoholic drink", ["ID", "F"]],
  ["Chili's", "Free meal, select items", ["D"]],
  ["Golden Corral", "Free thank-you meal, 4 p.m. to close", ["D", "T"]],
  ["Hoss's Steak & Sea House", "Free soup, salad and dessert bar + iced tea", ["D"]],
  ["In-N-Out Burger", "Free burger, fries and drink + decal", ["ID"]],
  ["Red Robin", "Free Red's Big Tavern Burger + Bottomless Steak Fries", ["D", "ID"]],
  ["Marzoni's Brick Oven", "One free draft beer or nonalcoholic drink", ["D"]],
  ["Rubio's", "Buy one entrée, get one free (code VETS26)", ["ID"]],
  ["Sizzler", "Free lunch + drink, open to 4 p.m.", ["T"]],
];
export const WATCH_2025: [string, Deal[]][] = [
  ["Breakfast and coffee", [
    ["Denny's", "Free Original Grand Slam, 5 a.m.-noon", ["ID", "T"]],
    ["IHOP", "Free Red, White & Blueberry Pancakes", ["D"]],
    ["Cracker Barrel", "Free Sunrise Pancake Special", ["ID"]],
    ["Wendy's", "Free breakfast combo, breakfast hours", ["T"]],
    ["Starbucks", "Free tall brewed coffee", ["F"]],
    ["Dunkin'", "Free donut, in store", []],
    ["Krispy Kreme", "Free doughnut + small coffee", []],
  ]],
  ["Lunch and dinner", [
    ["Applebee's", "Free meal, select menu", ["D"]],
    ["Olive Garden", "Free entrée, special menu", ["D", "ID"]],
    ["Red Lobster", "Free Shrimp & Chips", ["D", "ID"]],
    ["Texas Roadhouse", "Free meal voucher for a later visit", []],
    ["Outback Steakhouse", "Free 3-course meal, Nov. 10-11", ["D", "ID"]],
    ["Buffalo Wild Wings", "10 free boneless wings + fries", ["D", "ID"]],
    ["Chipotle", "Buy one entrée, get one free, 4-8 p.m.", ["ID", "T"]],
    ["Little Caesars", "Free lunch combo, 11 a.m.-2 p.m.", ["T"]],
    ["Shake Shack", "Free Big Shack", ["ID"]],
  ]],
];
const TAG: Record<string, string> = { D: "Dine-in", ID: "ID", F: "Family", T: "Hours" };

function cheatSheet(fonts: string): string {
  const row = ([b, o, t]: Deal, ok: boolean) => `<tr><td class="cb"><i class="${ok ? "ok" : ""}"></i></td><td class="b">${b}</td><td>${o}</td><td class="tg">${t.map((x) => `<span class="t-${x}">${TAG[x]}</span>`).join("")}</td></tr>`;
  const tbl = (head: string, list: Deal[], ok: boolean) => `<h2>${head}</h2><table><tbody>${list.map((d) => row(d, ok)).join("")}</tbody></table>`;
  const css = `
  .vd{padding:26px 30px 0}
  .vd header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #b91c1c;padding-bottom:7px;margin-bottom:8px}
  .vd h1{font-family:Sora;font-weight:800;font-size:29px;margin:0;color:#0b2a5b;line-height:1.05}
  .vd .sub{margin:4px 0 0;font-size:11px;color:#37474f}
  .vd .badge{font-family:Sora;font-weight:800;font-size:13px;color:#fff;background:#0b2a5b;border-radius:7px;padding:8px 11px;white-space:nowrap;text-align:center;line-height:1.2}
  .vd .cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .vd h2{font-family:Sora;font-size:12.4px;text-transform:uppercase;letter-spacing:.07em;color:#b91c1c;margin:12px 0 4px}
  .vd h2.c{color:#15803d}
  .vd table{width:100%;border-collapse:collapse;font-size:11px}
  .vd td{padding:5.6px 3px;border-bottom:1px solid #e2e8f0;vertical-align:top;line-height:1.22}
  .vd td.b{font-weight:800;color:#0f172a;width:31%}
  .vd td.cb{width:16px}
  .vd td.cb i{display:inline-block;width:11px;height:11px;border:1.4px solid #334155;border-radius:2px}
  .vd td.cb i.ok{background:#dcfce7;border-color:#15803d}
  .vd td.tg{width:24%;text-align:right}
  .vd td.tg span{display:inline-block;margin:0 0 1px 2px;padding:1.5px 4px;border-radius:3px;font-size:8.4px;font-weight:800;color:#fff;background:#475569}
  .vd .t-D{background:#0b2a5b!important}.vd .t-ID{background:#b91c1c!important}.vd .t-F{background:#15803d!important}.vd .t-T{background:#b45309!important}
  .vd .side{border:1.5px solid #cbd5e1;border-radius:9px;padding:9px 12px;margin-top:14px;font-size:10.8px;line-height:1.35;color:#1e293b}
  .vd .side b{font-family:Sora;font-size:11.6px;color:#0b2a5b;display:block;margin-bottom:2px}
  .vd .side ul{margin:0;padding-left:13px}
  .vd .cut{margin-top:16px;border:1.8px dashed #64748b;border-radius:12px;padding:12px 16px;display:grid;grid-template-columns:1.25fr 1fr;gap:16px;font-size:10.8px;line-height:1.35}
  .vd .cut b{font-family:Sora;font-size:12.4px;color:#b91c1c;display:block;margin-bottom:2px}
  .vd .cut ol{margin:0;padding-left:14px}
  .vd .note{margin-top:10px;font-size:9.2px;color:#5a6b75;line-height:1.4}`;
  const page = `<section class="page vd"><header><div><h1>Veterans Day Free Meals Cheat Sheet, 2026</h1><p class="sub">Wednesday, Nov. 11, 2026 · check a box when you go · participating locations only; call ahead · tags: <b>Dine-in</b> only, bring <b>ID</b>, <b>Family</b> included, set <b>Hours</b></p></div><div class="badge">Nov. 11<br>Veterans Day</div></header>
    <div class="cols"><div>${tbl("Confirmed for 2026", CONFIRMED_2026, true).replace("<h2>", '<h2 class="c">')}
      <div class="side"><b>Also on Nov. 11, 2026</b><ul><li>National parks: free entrance for U.S. citizens and residents</li><li>Free Military Lifetime Pass for veterans, year-round</li><li>Closed: federal offices, banks, post offices · Open: stock markets</li></ul></div>
      <div class="side"><b>Year-round store discounts</b><ul><li>Home Depot: 10% off, up to $400 a year (register in the app)</li><li>Lowe's: 10% off most full-price items (verify with ID.me)</li></ul></div></div>
      <div>${WATCH_2025.map(([h, l]) => tbl(`Offered in 2025: ${h}`, l, false)).join("")}</div></div>
    <div class="cut"><div><b>✂ Wallet card: bring one of these</b><ol><li>Veteran ID Card (VA) or Veteran Health Identification Card</li><li>Military ID: Common Access Card or Uniformed Services ID</li><li>Driver's license or state ID with a veteran designation</li><li>DD-214 (a copy or a photo on your phone)</li></ol></div><div><b>Before you go</b>Most offers are for the veteran only, not guests; drinks, tax and tip are usually extra; many are dine-in only and limited to Nov. 11. Wear the uniform only where the offer says it counts.</div></div>
    <p class="note">Green boxes: offers announced for 2026 (Military.com list updated Oct. 20, 2026, and chain announcements through Oct. 25). Gray boxes: offered in 2025; watch for each chain's 2026 announcement. National Park Service, Department of Veterans Affairs, Home Depot and Lowe's terms as published. Updates: freshcalendars.com/news/veterans-day-free-meals-discounts/</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/veterans-day-free-meals-discounts/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildVeteransDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("veterans-day", [{ slug: "veterans-day-free-meals-cheat-sheet-2026", size: LETTER, html: cheatSheet(fonts) }]);
}
