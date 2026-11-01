/**
 * Veterans Day 2026 free meals cheat sheet for /news/ (veterans-day-free-meals-discounts).
 * One US Letter page: free meals confirmed for 2026 in two columns, then discounts and deals,
 * the 2025 offers still to be announced, the fine print as short tags, and a cut-out wallet card
 * listing accepted proof of service. Offers come from Military.com's 2026 list (updated Nov. 1,
 * 2026) and brand pages or press releases (Red Robin, Pilot, Freddy's, Bob Evans; Oct. 22-27, 2026);
 * no logos. Usage: pnpm fc news-veterans
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

/** [brand, offer, tags]. Tags: D dine-in only, ID proof of service, F family or spouse included, T time window, L also usable on another day. */
type Deal = [string, string, string[]];
export const CONFIRMED_2026: Deal[] = [
  ["151 Coffee", "One free drink, any size", ["ID"]],
  ["Applebee's", "Free meal, limited menu", ["D"]],
  ["Aspen Creek Grill", "$15 voucher, use Nov. 11-Dec. 24", ["D", "T", "L"]],
  ["Bar Louie", "Free burger, Nov. 10-11", ["D", "ID", "L"]],
  ["Biscuit Belly", "Free breakfast sandwich + drink", ["D"]],
  ["BJ's Restaurant", "Free Pizookie + appetizer coupon", ["D", "L"]],
  ["Bob Evans", "Free meal, 11-item menu, all day", ["D", "ID", "L"]],
  ["Bombshells", "Free appetizer, entrée or dessert", ["F"]],
  ["Bonefish Grill", "Free Bang Bang Shrimp + drink", ["ID", "F"]],
  ["Buffalo Wild Wings", "10 free boneless wings + fries", ["ID"]],
  ["California Pizza Kitchen", "Free entrée + nonalcoholic drink", []],
  ["Charleys Cheesesteaks", "Free regular Gourmet Fry", ["ID"]],
  ["Chili's", "Free meal, select items", ["D"]],
  ["Claim Jumper", "Free meal, select menu", []],
  ["Cotton Patch Cafe", "Free chicken fried steak or chicken", ["D", "ID"]],
  ["Dave & Buster's", "Free entrée to $20 + $10 Power Card", ["ID"]],
  ["Denny's", "Free Original Grand Slam, 5 a.m.-noon", ["ID", "T"]],
  ["Dunkin'", "Free donut, in store", []],
  ["Farmer Boys", "Free Big Cheese Burger", ["D"]],
  ["Freddy's", "Free combo meal card, use by Nov. 25", ["ID", "L"]],
  ["Golden Corral", "Free meal, 4 p.m. to close", ["D", "T"]],
  ["Hard Rock Cafe", "Free Classic Smash Burger", []],
  ["Hoss's Steak & Sea House", "Free soup, salad and dessert bar", ["D", "L"]],
  ["IHOP", "Free Red, White & Blueberry Combo", ["D", "ID"]],
  ["In-N-Out Burger", "Free burger, fries and drink", ["ID"]],
  ["Lazy Dog", "Free entrée, dessert and soda", []],
  ["Marzoni's Brick Oven", "One free draft beer or soft drink", ["D"]],
  ["Mission BBQ", "Free sandwich", []],
  ["Olive Garden", "Free entrée, special menu", ["D", "ID"]],
  ["Outback Steakhouse", "Free Bloomin' Onion + drink, Nov. 10-11", ["L"]],
  ["Pilot / Flying J", "Free sandwich + coffee in the app", ["ID"]],
  ["Red Lobster", "Free Veteran's Shrimp & Chips", ["D", "ID"]],
  ["Red Robin", "Free Red's Big Tavern Burger + fries", ["D", "ID"]],
  ["Ruby Tuesday", "Free entrée, Garden Bar + drink", ["D"]],
  ["Sheetz", "Free half turkey sub, drink + car wash", ["ID"]],
  ["Shoney's", "Free breakfast bar, open to 11 a.m.", ["D", "T"]],
  ["Sizzler", "Free lunch + drink, open to 4 p.m.", ["T"]],
  ["Starbucks", "Free tall brewed coffee", ["F"]],
  ["Texas Roadhouse", "Voucher 11 a.m.-2 p.m., use by May 31", ["ID", "T", "L"]],
  ["Tuscan Brands", "Free meal 11 a.m.-4 p.m., reserve", ["T"]],
  ["Twin Peaks", "Free entrée + 20% off in November", ["L"]],
  ["White Castle", "Free combo or breakfast combo", []],
  ["Yard House", "Free appetizer", ["D", "ID"]],
];
export const DEALS_2026: Deal[] = [
  ["54th Street", "Up to $10 off an entrée", ["D", "ID"]],
  ["Bruegger's Bagels", "Free coffee with a food purchase", []],
  ["CentraArchy", "50% off an entrée at six brands", []],
  ["Chipotle", "Free chips + dip with $5 purchase", ["ID"]],
  ["Eat'n Park", "10% off your party, Nov. 1-30", ["D", "F", "L"]],
  ["Firebirds", "Free meal up to a guest's purchase", ["D"]],
  ["Fogo de Chão", "50% off Churrasco, Sat., Nov. 7", ["L"]],
  ["Hooters", "Free special-menu item with a drink", ["D"]],
  ["Joe's Crab Shack", "20% off", ["D", "ID"]],
  ["Margaritas", "50% off an entrée, Northeast", ["D"]],
  ["McCormick & Schmick's", "Half-price entrée, Sun., Nov. 8", ["D", "L"]],
  ["Perry's Steakhouse", "Free pork chop with an entrée, 4 p.m.", ["T"]],
  ["Rubio's", "Buy one entrée, get one (VETS26)", ["ID"]],
  ["Sonic", "Half-price shakes, any size", []],
];
export const WATCH_2025: Deal[] = [
  ["Cracker Barrel", "Free Sunrise Pancake Special", ["ID"]],
  ["Krispy Kreme", "Free doughnut + small coffee", []],
  ["Little Caesars", "Free lunch combo, 11 a.m.-2 p.m.", ["T"]],
  ["Shake Shack", "Free Big Shack", ["ID"]],
  ["Wendy's", "Free breakfast combo", ["T"]],
];
/** Rows in the left column of the free-meals list. */
const HALF = Math.ceil(CONFIRMED_2026.length / 2);
const TAG: Record<string, string> = { D: "Dine-in", ID: "ID", F: "Family", T: "Hours", L: "Later" };

function cheatSheet(fonts: string): string {
  const row = ([b, o, t]: Deal, ok: boolean) => `<tr><td class="cb"><i class="${ok ? "ok" : ""}"></i></td><td class="b">${b}</td><td>${o}</td><td class="tg">${t.map((x) => `<span class="t-${x}">${TAG[x]}</span>`).join("")}</td></tr>`;
  const tbl = (head: string, list: Deal[], ok: boolean) => `<h2>${head}</h2><table><tbody>${list.map((d) => row(d, ok)).join("")}</tbody></table>`;
  const css = `
  .vd{padding:30px 28px 0}
  .vd header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #b91c1c;padding-bottom:6px;margin-bottom:4px}
  .vd h1{font-family:Sora;font-weight:800;font-size:26px;margin:0;color:#0b2a5b;line-height:1.05}
  .vd .sub{margin:4px 0 0;font-size:11px;color:#37474f}
  .vd .badge{font-family:Sora;font-weight:800;font-size:13px;color:#fff;background:#0b2a5b;border-radius:7px;padding:8px 11px;white-space:nowrap;text-align:center;line-height:1.2}
  .vd .cols{display:grid;grid-template-columns:1.08fr 1fr;gap:14px}
  .vd h2{font-family:Sora;font-size:11.6px;text-transform:uppercase;letter-spacing:.07em;color:#b91c1c;margin:6px 0 2px}
  .vd h2.c{color:#15803d}
  .vd table{width:100%;border-collapse:collapse;font-size:9.2px}
  .vd td{padding:1.5px 3px;border-bottom:1px solid #e2e8f0;vertical-align:top;line-height:1.14}
  .vd .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .vd td.b{font-weight:800;color:#0f172a;width:31%}
  .vd td.cb{width:16px}
  .vd td.cb i{display:inline-block;width:11px;height:11px;border:1.4px solid #334155;border-radius:2px}
  .vd td.cb i.ok{background:#dcfce7;border-color:#15803d}
  .vd td.tg{width:19%;text-align:right;white-space:nowrap}
  .vd td.tg span{display:inline-block;margin:0 0 1px 2px;padding:1px 3.5px;border-radius:3px;font-size:8.2px;font-weight:800;color:#fff;background:#475569}
  .vd .t-D{background:#0b2a5b!important}.vd .t-ID{background:#b91c1c!important}.vd .t-F{background:#15803d!important}.vd .t-T{background:#b45309!important}.vd .t-L{background:#6d28d9!important}
  .vd .side{border:1.5px solid #cbd5e1;border-radius:9px;padding:6px 10px;margin-top:8px;font-size:10px;line-height:1.35;color:#1e293b}
  .vd .side b{font-family:Sora;font-size:11.6px;color:#0b2a5b;display:block;margin-bottom:2px}
  .vd .side ul{margin:0;padding-left:13px}
  .vd .cut{margin-top:7px;border:1.8px dashed #64748b;border-radius:12px;padding:7px 14px;display:grid;grid-template-columns:1.25fr 1fr;gap:16px;font-size:10px;line-height:1.32}
  .vd .cut b{font-family:Sora;font-size:12.4px;color:#b91c1c;display:block;margin-bottom:2px}
  .vd .cut ol{margin:0;padding-left:14px}
  .vd .note{margin-top:7px;font-size:8.6px;color:#5a6b75;line-height:1.4}`;
  const page = `<section class="page vd"><header><div><h1>Veterans Day Free Meals Cheat Sheet, 2026</h1><p class="sub">Wed., Nov. 11, 2026 · participating locations; call ahead · tags: <b>Dine-in</b> only, bring <b>ID</b>, <b>Family</b> included, set <b>Hours</b>, usable <b>Later</b></p></div><div class="badge">Nov. 11<br>Veterans Day</div></header>
    <h2 class="c">Free meals confirmed for 2026</h2>
    <div class="two">${[CONFIRMED_2026.slice(0, HALF), CONFIRMED_2026.slice(HALF)].map((l) => `<table><tbody>${l.map((d) => row(d, true)).join("")}</tbody></table>`).join("")}</div>
    <div class="cols"><div>${tbl("Discounts and deals for 2026", DEALS_2026, true).replace("<h2>", '<h2 class="c">')}</div>
      <div>${tbl("Offered in 2025, not yet announced", WATCH_2025, false)}
      <div class="side"><b>Also on Nov. 11, 2026</b><ul><li>National parks: free entrance for U.S. citizens and residents</li><li>Free Military Lifetime Pass for veterans, year-round</li><li>Closed: federal offices, banks, post offices · Open: stock markets</li><li>Year-round: Home Depot and Lowe's take 10% off</li></ul></div></div></div>
    <div class="cut"><div><b><svg width="13" height="11" viewBox="0 0 13 11" fill="none" stroke="#b91c1c" stroke-width="1.5" style="vertical-align:-1px;margin-right:4px"><circle cx="2.6" cy="2.6" r="1.9"/><circle cx="2.6" cy="8.4" r="1.9"/><path d="M4.2 3.6 12.4 9.4M4.2 7.4 12.4 1.6"/></svg>Wallet card: bring one of these</b><ol><li>Veteran ID Card (VA) or Veteran Health Identification Card</li><li>Military ID: Common Access Card or Uniformed Services ID</li><li>Driver's license or state ID with a veteran designation</li><li>DD-214 (a copy or a photo on your phone)</li></ol></div><div><b>Before you go</b>Most offers are for the veteran only, not guests; drinks, tax and tip are usually extra; many are dine-in only and limited to Nov. 11. Wear the uniform only where the offer says it counts.</div></div>
    <p class="note">Green boxes: announced for 2026 (Military.com list updated Nov. 1, 2026; Red Robin, Pilot, Freddy's and Bob Evans announcements). Gray boxes: offered in 2025, not yet announced for 2026. Park, VA and store terms as published.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/veterans-day-free-meals-discounts/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildVeteransDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("veterans-day", [{ slug: "veterans-day-free-meals-cheat-sheet-2026", size: LETTER, html: cheatSheet(fonts) }]);
}
