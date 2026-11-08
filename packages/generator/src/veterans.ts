/**
 * Veterans Day 2026 free meals cheat sheet for /news/ (veterans-day-free-meals-discounts).
 * One US Letter page: free meals confirmed for 2026 in two columns, then discounts and deals,
 * the 2025 offers still to be announced, the fine print as short tags, and a cut-out wallet card
 * listing accepted proof of service. Offers come from Military.com's 2026 list (updated Nov. 1,
 * 2026), the Department of Veterans Affairs, the American Legion and brand pages or press releases
 * (Little Caesars, Shake Shack, Chipotle, Dave & Buster's, Red Robin, Pilot, Freddy's, Bob Evans,
 * Great Clips); as of Nov. 7, 2026.
 * No logos. Usage: pnpm fc news-veterans
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

/** [brand, offer, tags]. Tags: D dine-in only, ID proof of service, F family or spouse included, T time window, L also usable on another day. */
type Deal = [string, string, string[]];
export const CONFIRMED_2026: Deal[] = [
  ["110 Grill", "Free lunch, select menu", []],
  ["151 Coffee", "One free drink, any size", ["ID"]],
  ["Applebee's", "Free meal, limited menu", ["D"]],
  ["Aspen Creek Grill", "$15 voucher, use Nov. 11-Dec. 24", ["D", "T", "L"]],
  ["Bandana's BBQ", "Free pulled pork sandwich + side", []],
  ["Bar Louie", "Free burger, Nov. 10-11", ["D", "ID", "L"]],
  ["Biggby Coffee", "Free 16-oz coffee", []],
  ["Biscuit Belly", "Free breakfast sandwich + drink", ["D"]],
  ["BJ's Restaurant", "Free Pizookie + appetizer coupon", ["D", "L"]],
  ["Black Angus", "Free 6-oz sirloin meal", ["F"]],
  ["Blaze Pizza", "Free one-topping pizza", []],
  ["Bob Evans", "Free meal, 11-item menu, all day", ["D", "ID", "L"]],
  ["Bombshells", "Free appetizer, entrée or dessert", ["F"]],
  ["Bonefish Grill", "Free Bang Bang Shrimp + drink", ["ID", "F"]],
  ["Bravo! Italian Kitchen", "Free pasta", []],
  ["Brio Italian Grille", "Free pasta entrée", []],
  ["Buca di Beppo", "Free lunch entrée, 40 locations", []],
  ["Buffalo Wild Wings", "10 free boneless wings + fries", ["ID"]],
  ["California Pizza Kitchen", "Free entrée + nonalcoholic drink", []],
  ["Carolina Ale House", "Free half rack of ribs, NC/FL/TN", []],
  ["Casey's", "Free coffee or fountain drink + car wash", []],
  ["Cattlemens", "Free sirloin dinner, 4-10 p.m., CA", ["T", "L"]],
  ["Charleys Cheesesteaks", "Free regular Gourmet Fry", ["ID"]],
  ["Chelo's", "Free meal, select menu", []],
  ["Chili's", "Free meal, select items", ["D"]],
  ["Circle K", "Free medium coffee, no purchase", ["ID"]],
  ["Claim Jumper", "Free meal, select menu", []],
  ["Common Man", "Free entrée", []],
  ["Cotton Patch Cafe", "Free chicken fried steak or chicken", ["D", "ID"]],
  ["Cracker Barrel", "Free Sunrise Pancake Special", []],
  ["Denny's", "Free Original Grand Slam, 5 a.m.-noon", ["ID", "T"]],
  ["Dickey's Barbecue Pit", "Free pulled pork sandwich", []],
  ["Dunkin'", "Free donut, in store", []],
  ["Eddie Merlot's", "Free prime cheeseburger + fries", []],
  ["El Chico", "Free entrée, up to $25", []],
  ["Eureka!", "Free burger", []],
  ["Farmer Boys", "Free Big Cheese Burger", ["D"]],
  ["Fazoli's", "Free spaghetti, code VET26", []],
  ["Freddy's", "Free combo meal card, use by Nov. 25", ["ID", "L"]],
  ["Gold Star Chili", "Free meal, up to $12", []],
  ["Golden Corral", "Free meal, 4 p.m. to close", ["D", "T"]],
  ["Hacienda", "Free large wet burrito", []],
  ["Hard Rock Cafe", "Free Classic Smash Burger", []],
  ["Hickory River Smokehouse", "Free meal", []],
  ["Hof's Hut", "Free Hofburger or pancakes + $10 card", ["L"]],
  ["Hooters", "Free special-menu meal, with a drink purchase", []],
  ["Hopdoddy", "Free classic burger", []],
  ["Hoss's Steak & Sea House", "Free soup, salad and dessert bar", ["D", "L"]],
  ["Hurricane Grill & Wings", "Free entrée", []],
  ["Hy-Vee", "Free breakfast, 6-10 a.m.", ["T"]],
  ["IHOP", "Free Red, White & Blueberry Combo", ["D", "ID"]],
  ["In-N-Out Burger", "Free burger, fries and drink", ["ID"]],
  ["J. Christopher's", "Free meal", []],
  ["Jeremiah's Italian Ice", "Free small treat", []],
  ["Keke's Breakfast Cafe", "Free Classic Two Egg Combo", []],
  ["Lazy Dog", "Free entrée, dessert and soda", []],
  ["Little Caesars", "Free 4-slice combo + Pepsi, 11 a.m.-2 p.m.", ["ID", "T"]],
  ["Logan's Roadhouse", "Free meal, 11 a.m.-3 p.m.", ["T"]],
  ["Lucille's Smokehouse", "Free sandwich or chicken + $10 card", ["L"]],
  ["Main Event", "Free burger, fries + game card", []],
  ["Marzoni's Brick Oven", "One free draft beer or soft drink", ["D"]],
  ["Max & Erma's", "Free cheeseburger, fries + drink", []],
  ["Menchie's", "Free first 6 oz of frozen yogurt", []],
  ["Mission BBQ", "Free sandwich", []],
  ["Native Grill & Wings", "Free meal", []],
  ["Newk's Eatery", "Free Pick 2", []],
  ["Olive Garden", "Free entrée, special menu", ["D", "ID"]],
  ["Outback Steakhouse", "Free Bloomin' Onion + drink, Nov. 10-11", ["L"]],
  ["Paisano's Pizza", "Free large one-topping, 40 locations", []],
  ["Piada", "Free entrée", []],
  ["Pilot / Flying J", "Free sandwich + coffee in the app", ["ID"]],
  ["Pluckers", "Free meal up to $17, Texas", []],
  ["Polly's Pies", "Free slice of pie, Nov. 10-11", ["L"]],
  ["Prince St. Pizza", "Free slice", []],
  ["Red Lobster", "Free Veteran's Shrimp & Chips", ["D", "ID"]],
  ["Red Robin", "Free Red's Big Tavern Burger + fries", ["D", "ID"]],
  ["Rock and Brews", "Free pulled pork sandwich or salad", []],
  ["Ruby Tuesday", "Free entrée, Garden Bar + drink", ["D"]],
  ["Scooter's Coffee", "Free medium drink, in store", []],
  ["Shake Shack", "Free single ShackBurger, in-Shack", ["ID"]],
  ["Sheetz", "Free half turkey sub, drink + car wash", ["ID"]],
  ["Shoney's", "Free breakfast bar, open to 11 a.m.", ["D", "T"]],
  ["Sizzler", "Free lunch + drink, open to 4 p.m.", ["T"]],
  ["Smashburger", "Free All-American Smashburger", ["ID"]],
  ["Sonny's BBQ", "Free Pork Big Deal", []],
  ["Starbucks", "Free 12-oz (tall) brewed coffee", ["F"]],
  ["TCBY", "Free first 6 oz of frozen yogurt", []],
  ["Ted's Bulletin", "Free Ted's Tart", []],
  ["Teriyaki Madness", "Free bowl, in shop", []],
  ["Texas Roadhouse", "Voucher 11 a.m.-2 p.m., use by May 31", ["ID", "T", "L"]],
  ["TGI Fridays", "Free meal, 11 a.m.-7 p.m.", ["T"]],
  ["Torchy's Tacos", "Free taco + drink, in store", ["ID"]],
  ["Tuscan Brands", "Free meal 11 a.m.-4 p.m., reserve", ["T"]],
  ["Twin Peaks", "Free entrée + 20% off in November", ["L"]],
  ["Uno Pizzeria & Grill", "Free entrée, special menu", []],
  ["WaBa Grill", "Free slice of crepe cake", []],
  ["Wendy's", "Free Dave's Single, drive-thru too", []],
  ["White Castle", "Free combo or breakfast combo", []],
  ["Wings and Rings", "Free lunch combo, all day", []],
  ["WOB Bar & Kitchen", "Free Smash Burger + fries", []],
  ["Yard House", "Free appetizer", ["D", "ID"]],
];
export const DEALS_2026: Deal[] = [
  ["7 Brew", "50% off a drink order, open to all", []],
  ["54th Street", "Up to $10 off an entrée", ["D", "ID"]],
  ["99 Restaurants", "Free lunch w/ entrée, open to 4 p.m.", ["ID", "T"]],
  ["Benihana", "Free hibachi entrée w/ appetizer, Nov. 9-11", ["L"]],
  ["Brick House Tavern", "20% off, parties up to 4", ["F"]],
  ["Bruegger's Bagels", "Free coffee with a food purchase", []],
  ["Buffalo's Cafe", "25% off, excludes alcohol", []],
  ["Capriotti's", "Free small sub with a purchase", []],
  ["Carrabba's", "BOGO entrée Nov. 8-10; free app or dessert Nov. 11", ["L"]],
  ["CentraArchy", "50% off an entrée at six brands", []],
  ["Chipotle", "Free chips + dip with $5 purchase, in-store", ["ID"]],
  ["Dave & Buster's", "Free game play &/or dessert w/ entrée", ["ID"]],
  ["Eat'n Park", "10% off your party, Nov. 1-30", ["D", "F", "L"]],
  ["Einstein Bros. Bagels", "Free coffee with a purchase", []],
  ["Firebirds", "Free meal up to a guest's purchase", ["D"]],
  ["Firehouse Subs", "Buy one sub, get one free", []],
  ["Fogo de Chão", "50% off Churrasco, Sat., Nov. 7", ["L"]],
  ["Joe's Crab Shack", "20% off", ["D", "ID"]],
  ["Kings Family", "25% off meals", []],
  ["Kona Grill", "Free entrée w/ starter, Nov. 9-11", ["L"]],
  ["LongHorn Steakhouse", "10% off + free app/dessert w/ entrée", []],
  ["Margaritas", "50% off an entrée, Northeast", ["D"]],
  ["McCormick & Schmick's", "Half-price entrée, Sun., Nov. 8", ["D", "L"]],
  ["Perry's Steakhouse", "Free pork chop with an entrée, 4 p.m.", ["T"]],
  ["Playa Bowls", "50% off bowls, in shop", []],
  ["Rubio's", "Buy one entrée, get one (VETS26)", ["ID"]],
  ["Saltgrass Steak House", "20% off, you + up to 4 guests", ["F"]],
  ["Sonic", "Half-price shakes, any size", []],
  ["STK Steakhouse", "Free entrée w/ starter, Nov. 9-11", ["L"]],
  ["Viva Chicken", "Free entrée w/ a guest entrée", []],
];
export const WATCH_2025: Deal[] = [
  ["Krispy Kreme", "Free doughnut + small coffee", []],
];
/** Rows in the left column of the free-meals list. */
const HALF = Math.ceil(CONFIRMED_2026.length / 2);
const TAG: Record<string, string> = { D: "Dine-in", ID: "ID", F: "Family", T: "Hours", L: "Later" };

function cheatSheet(fonts: string): string {
  const row = ([b, o, t]: Deal, ok: boolean) => `<tr><td class="cb"><i class="${ok ? "ok" : ""}"></i></td><td class="b">${b}</td><td>${o}</td><td class="tg">${t.map((x) => `<span class="t-${x}">${TAG[x]}</span>`).join("")}</td></tr>`;
  const tbl = (head: string, list: Deal[], ok: boolean) => `<h2>${head}</h2><table><tbody>${list.map((d) => row(d, ok)).join("")}</tbody></table>`;
  const css = `
  .vd{padding:28px 26px 0}
  .vd header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #b91c1c;padding-bottom:4px;margin-bottom:2px}
  .vd h1{font-family:Sora;font-weight:800;font-size:26px;margin:0;color:#0b2a5b;line-height:1.05}
  .vd .sub{margin:4px 0 0;font-size:11px;color:#37474f}
  .vd .badge{font-family:Sora;font-weight:800;font-size:13px;color:#fff;background:#0b2a5b;border-radius:7px;padding:8px 11px;white-space:nowrap;text-align:center;line-height:1.2}
  .vd .cols{display:grid;grid-template-columns:1.08fr 1fr;gap:14px}
  .vd h2{font-family:Sora;font-size:11.6px;text-transform:uppercase;letter-spacing:.07em;color:#b91c1c;margin:3px 0 1px}
  .vd h2.c{color:#15803d}
  .vd table{width:100%;border-collapse:collapse;font-size:9.2px}
  .vd td{padding:0.5px 3px;border-bottom:1px solid #e2e8f0;vertical-align:top;line-height:1.12}
  .vd .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .vd td.b{font-weight:800;color:#0f172a;width:31%}
  .vd td.cb{width:16px}
  .vd td.cb i{display:inline-block;width:10px;height:10px;border:1.4px solid #334155;border-radius:2px}
  .vd td.cb i.ok{background:#dcfce7;border-color:#15803d}
  .vd td.tg{width:19%;text-align:right;white-space:nowrap}
  .vd td.tg span{display:inline-block;margin:0 0 1px 2px;padding:0.5px 3.5px;border-radius:3px;font-size:8.2px;font-weight:800;color:#fff;background:#475569}
  .vd .t-D{background:#0b2a5b!important}.vd .t-ID{background:#b91c1c!important}.vd .t-F{background:#15803d!important}.vd .t-T{background:#b45309!important}.vd .t-L{background:#6d28d9!important}
  .vd .side{border:1.5px solid #cbd5e1;border-radius:9px;padding:5px 10px;margin-top:5px;font-size:9.6px;line-height:1.3;color:#1e293b}
  .vd .side b{font-family:Sora;font-size:11.6px;color:#0b2a5b;display:block;margin-bottom:2px}
  .vd .side ul{margin:0;padding-left:13px}
  .vd .cut{margin-top:4px;border:1.8px dashed #64748b;border-radius:12px;padding:5px 14px;display:grid;grid-template-columns:1.25fr 1fr;gap:16px;font-size:9.6px;line-height:1.28}
  .vd .cut b{font-family:Sora;font-size:12.4px;color:#b91c1c;display:block;margin-bottom:2px}
  .vd .cut ol{margin:0;padding-left:14px}
  .vd .note{margin-top:4px;font-size:8.6px;color:#5a6b75;line-height:1.35}`;
  // Two pages since the Nov. 8 Military.com list: 101 free meals fill page 1, the deals and the wallet card page 2.
  const header = (title: string) => `<header><div><h1>${title}</h1><p class="sub">Wed., Nov. 11, 2026 · participating locations; call ahead · tags: <b>Dine-in</b> only, bring <b>ID</b>, <b>Family</b> included, set <b>Hours</b>, usable <b>Later</b></p></div><div class="badge">Nov. 11<br>Veterans Day</div></header>`;
  const foot = `<div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/veterans-day-free-meals-discounts/</div>`;
  const page1 = `<section class="page vd">${header("Veterans Day Free Meals Cheat Sheet, 2026")}
    <h2 class="c">Free meals confirmed for 2026 (${CONFIRMED_2026.length})</h2>
    <div class="two">${[CONFIRMED_2026.slice(0, HALF), CONFIRMED_2026.slice(HALF)].map((l) => `<table><tbody>${l.map((d) => row(d, true)).join("")}</tbody></table>`).join("")}</div>
    ${foot}</section>`;
  const page2 = `<section class="page vd">${header("Veterans Day Deals and Wallet Card, 2026")}
    <div class="cols"><div>${tbl(`Discounts and deals for 2026 (${DEALS_2026.length})`, DEALS_2026, true).replace("<h2>", '<h2 class="c">')}</div>
      <div>${tbl("Offered in 2025, not yet announced", WATCH_2025, false)}
      <div class="side"><b>Also on Nov. 11, 2026</b><ul><li>National parks: free entrance for U.S. citizens and residents</li><li>Free Military Lifetime Pass for veterans, year-round</li><li>Closed: federal offices, banks, post offices · Open: stock markets</li><li>Great Clips and Sport Clips: free or discounted haircut</li><li>Grace For Vets: free car wash at participating washes</li><li>Year-round: Home Depot and Lowe's take 10% off</li></ul></div></div></div>
    <div class="cut"><div><b><svg width="13" height="11" viewBox="0 0 13 11" fill="none" stroke="#b91c1c" stroke-width="1.5" style="vertical-align:-1px;margin-right:4px"><circle cx="2.6" cy="2.6" r="1.9"/><circle cx="2.6" cy="8.4" r="1.9"/><path d="M4.2 3.6 12.4 9.4M4.2 7.4 12.4 1.6"/></svg>Wallet card: bring one of these</b><ol><li>Veteran ID Card (VA) or Veteran Health Identification Card</li><li>Military ID: Common Access Card or Uniformed Services ID</li><li>Driver's license or state ID with a veteran designation</li><li>DD-214 (a copy or a photo on your phone)</li></ol></div><div><b>Before you go</b>Most offers are for the veteran only, not guests; drinks, tax and tip are usually extra; many are dine-in only and limited to Nov. 11. Wear the uniform only where the offer says it counts.</div></div>
    <p class="note">Source: Military.com list updated Nov. 8, 2026; the Department of Veterans Affairs; the American Legion; and brand pages (Little Caesars, Shake Shack, Chipotle, Dave &amp; Buster's, Red Robin, Pilot, Freddy's, Bob Evans, Great Clips). Green boxes: announced for 2026. Gray box: offered in 2025, not yet announced for 2026. Park, VA and store terms as published.</p>
    ${foot}</section>`;
  return doc(fonts, LETTER, css, [page1, page2]);
}

export async function buildVeteransDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("veterans-day", [{ slug: "veterans-day-free-meals-cheat-sheet-2026", size: LETTER, html: cheatSheet(fonts) }]);
}
