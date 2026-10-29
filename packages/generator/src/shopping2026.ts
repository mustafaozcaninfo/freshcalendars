/**
 * Holiday shopping printables for /news/, each in three themes (a color theme, a second color
 * theme and an ink-saver black-and-white version):
 *   black-friday-planner-2026-{bold,autumn,ink}   store hours + shopping list + budget
 *   christmas-eve-checklist-2026-{classic,winter,ink}   closing times, open on Dec. 25, errands
 * Hours: Home Depot 2026 from its newsroom; others are 2025 hours (AP, chain releases), marked.
 * Usage: pnpm fc news-shopping
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables, type Printable } from "./printables.js";

type Theme = { id: string; ink: string; accent: string; soft: string; line: string };
const BF_THEMES: Theme[] = [
  { id: "bold", ink: "#111827", accent: "#a16207", soft: "#fef9c3", line: "#e5e7eb" },
  { id: "autumn", ink: "#431407", accent: "#c2410c", soft: "#ffedd5", line: "#fed7aa" },
  { id: "ink", ink: "#111111", accent: "#444444", soft: "#f3f3f3", line: "#d4d4d4" },
];
const XMAS_THEMES: Theme[] = [
  { id: "classic", ink: "#14532d", accent: "#b91c1c", soft: "#fef2f2", line: "#e5e7eb" },
  { id: "winter", ink: "#0c4a6e", accent: "#0369a1", soft: "#e0f2fe", line: "#bae6fd" },
  { id: "ink", ink: "#111111", accent: "#444444", soft: "#f3f3f3", line: "#d4d4d4" },
];

/** [store, Black Friday opening, source year]. */
export const BF_HOURS: [string, string, "2026" | "2025"][] = [
  ["Home Depot", "6 a.m.", "2026"], ["Lowe's", "6 a.m.", "2025"], ["Walmart", "6 a.m.", "2025"], ["Target", "6 a.m.", "2025"],
  ["Best Buy", "6 a.m.-10 p.m.", "2025"], ["Dick's Sporting Goods", "6 a.m.-10 p.m.", "2025"], ["Kohl's", "5 a.m.", "2025"],
  ["JCPenney", "5 a.m.", "2025"], ["Macy's", "6 a.m.-10 p.m.", "2025"], ["Costco", "9 a.m.", "2025"], ["Sam's Club", "Regular hours", "2025"],
];
/** [store, Christmas Eve closing, source year]. */
export const XMAS_EVE: [string, string, "2026" | "2025"][] = [
  ["Home Depot", "5 p.m.", "2026"], ["Walmart", "6 p.m.", "2025"], ["Sam's Club", "6 p.m.", "2025"], ["Costco", "5 p.m.", "2025"],
  ["H-E-B", "8 p.m.", "2025"], ["Trader Joe's", "5 p.m.", "2025"], ["Target", "Varies by store", "2025"], ["Whole Foods", "Varies by store", "2025"],
];

/** Check mark drawn as SVG in the text color: ✓ is not in Sora or Manrope and printed in a system font. */
const CHECK = `<svg width="0.95em" height="0.8em" viewBox="0 0 12 10" aria-hidden="true" style="vertical-align:-0.05em"><path d="M1 5.2 4.3 8.5 11 1.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;

function css(t: Theme, cls: string): string {
  return `
  .${cls}{padding:28px 32px 0;color:#1f2937}
  .${cls} header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid ${t.accent};padding-bottom:8px;margin-bottom:12px}
  .${cls} h1{font-family:Sora;font-weight:800;font-size:28px;margin:0;color:${t.ink};line-height:1.05}
  .${cls} .sub{margin:4px 0 0;font-size:11px;color:#374151}
  .${cls} .badge{font-family:Sora;font-weight:800;font-size:13px;color:#fff;background:${t.ink};border-radius:8px;padding:8px 12px;text-align:center;line-height:1.2;white-space:nowrap}
  .${cls} .strip{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:0 0 14px}
  .${cls} .strip div{border:1.5px solid ${t.line};border-radius:8px;padding:7px 8px;background:${t.soft}}
  .${cls} .strip b{display:block;font-family:Sora;font-size:12px;color:${t.ink}}
  .${cls} .strip span{font-size:9.6px;color:#374151;line-height:1.25;display:block}
  .${cls} h2{font-family:Sora;font-size:13px;text-transform:uppercase;letter-spacing:.07em;color:${t.accent};margin:16px 0 6px}
  .${cls} .cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .${cls} table{width:100%;border-collapse:collapse;font-size:12px}
  .${cls} th{background:${t.ink};color:#fff;font-family:Sora;font-size:9px;padding:5px 6px;text-align:left}
  .${cls} td{border-bottom:1px solid ${t.line};padding:8px 7px;vertical-align:top}
  .${cls} td.s{font-weight:700;color:${t.ink}}
  .${cls} td.y{font-size:8.6px;color:#6b7280;white-space:nowrap}
  .${cls} .lines td{height:31px}
  .${cls} .box{border:1.5px solid ${t.line};border-radius:9px;padding:10px 13px;font-size:11.6px;line-height:1.5}
  .${cls} .box b{font-family:Sora;color:${t.ink}}
  .${cls} .chk li{list-style:none;margin:0 0 9px;padding-left:22px;position:relative;font-size:11.8px;line-height:1.35}
  .${cls} .chk li::before{content:"";position:absolute;left:0;top:2px;width:11px;height:11px;border:1.5px solid ${t.ink};border-radius:2px}
  .${cls} ul.chk{margin:0;padding:0}
  .${cls} .note{margin-top:10px;font-size:8.8px;color:#6b7280;line-height:1.45}`;
}

function blackFriday(fonts: string, t: Theme): string {
  const c = `bf-${t.id}`;
  const hours = BF_HOURS.map(([s, h, y]) => `<tr><td class="s">${s}</td><td>${h}</td><td class="y">${y === "2026" ? `2026 ${CHECK}` : "2025"}</td></tr>`).join("");
  const list = Array.from({ length: 15 }, () => `<tr><td></td><td></td><td></td><td></td></tr>`).join("");
  const page = `<section class="page ${c}"><header><div><h1>Black Friday 2026 Shopping Planner</h1><p class="sub">Friday, Nov. 27, 2026 · store opening times, your list, your budget · most big chains close on Thanksgiving</p></div><div class="badge">Black Friday<br>Nov. 27</div></header>
    <div class="strip"><div><b>Thu., Nov. 26</b><span>Thanksgiving: most big stores closed</span></div><div><b>Fri., Nov. 27</b><span>Black Friday; stock market closes 1 p.m. ET</span></div><div><b>Sat., Nov. 28</b><span>Small Business Saturday</span></div><div><b>Mon., Nov. 30</b><span>Cyber Monday</span></div><div><b>Tue., Dec. 1</b><span>Giving Tuesday</span></div></div>
    <div class="cols"><div><h2>Store opening times</h2><table><thead><tr><th>Store</th><th>Black Friday</th><th>Hours from</th></tr></thead><tbody>${hours}</tbody></table>
      <div class="box" style="margin-top:12px"><b>My budget</b><br>Total I'll spend: $________ &nbsp; Spent so far: $________<br>Gift cards / rewards to use: ____________________</div>
      <div class="box" style="margin-top:10px"><b>Before I go</b><ul class="chk" style="margin-top:6px"><li>Check each store's hours for my location</li><li>Compare prices online and note price history</li><li>Load coupons and member offers in the apps</li><li>Read return and price-match policies</li></ul></div></div>
      <div><h2>My shopping list</h2><table class="lines"><thead><tr><th style="width:34%">Item</th><th>Store</th><th>Target price</th><th style="width:12%">Got it</th></tr></thead><tbody>${list}</tbody></table>
      <h2>Cyber Monday wish list</h2><table class="lines"><tbody>${Array.from({ length: 4 }, () => "<tr><td></td><td style='width:30%'></td></tr>").join("")}</tbody></table></div></div>
    <p class="note">Hours: Home Depot 2026 from its newsroom; the others are each chain's 2025 Black Friday hours as reported by the Associated Press and will be updated when the 2026 hours are announced. Hours vary by location. Stock market early close: NYSE 2026 calendar.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/black-friday-2026-store-hours-walmart-target-best-buy/</div></section>`;
  return doc(fonts, LETTER, css(t, c), [page]);
}

function christmasEve(fonts: string, t: Theme): string {
  const c = `xm-${t.id}`;
  const rows = XMAS_EVE.map(([s, h, y]) => `<tr><td class="s">${s}</td><td>${h}</td><td class="y">${y === "2026" ? `2026 ${CHECK}` : "2025"}</td></tr>`).join("");
  const page = `<section class="page ${c}"><header><div><h1>Christmas Eve 2026 Last-Minute Checklist</h1><p class="sub">Thursday, Dec. 24 and Friday, Dec. 25, 2026 · closing times, what's open on Christmas Day, and your errands</p></div><div class="badge">Christmas Eve<br>Thu., Dec. 24</div></header>
    <div class="strip"><div><b>Thu., Dec. 17</b><span>USPS Ground Advantage and First-Class deadline</span></div><div><b>Sat., Dec. 19</b><span>USPS Priority Mail Express deadline</span></div><div><b>Thu., Dec. 24</b><span>Stores close early; stocks close 1 p.m. ET</span></div><div><b>Fri., Dec. 25</b><span>Christmas Day: most stores, banks and mail closed</span></div><div><b>Sat., Dec. 26</b><span>Stores reopen; returns start</span></div></div>
    <div class="cols"><div><h2>Christmas Eve closing times</h2><table><thead><tr><th>Store</th><th>Closes Dec. 24</th><th>Hours from</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>Usually open Christmas Day</h2><div class="box">Many CVS and Walgreens stores (pharmacy hours vary), 7-Eleven, some McDonald's, Starbucks in hotels and airports, movie theaters. Call ahead.</div>
      <h2>Closed Christmas Day</h2><div class="box">Walmart, Target, Costco, Sam's Club, Home Depot, Lowe's, Kroger, Publix, Aldi, Trader Joe's, Whole Foods; banks, post offices and the stock market.</div>
      <h2>Christmas Day plan</h2><table class="lines"><tbody>${["Morning", "Midday", "Dinner", "Calls and visits"].map((x) => `<tr><td class="s" style="width:34%">${x}</td><td></td></tr>`).join("")}</tbody></table></div>
      <div><h2>Last errands</h2><ul class="chk">${["Pick up the last gifts (by the store's closing time)", "Batteries, tape, gift bags and wrapping paper", "Groceries for Christmas Eve and Christmas Day", "Prescriptions refilled before the holiday", "Gas in the car; cash for tips", "Gift receipts in an envelope", "Holiday cards for anyone missed", "Charge phones, cameras and new devices"].map((x) => `<li>${x}</li>`).join("")}</ul>
      <h2>My own list</h2><table class="lines"><tbody>${Array.from({ length: 9 }, () => "<tr><td></td><td style='width:24%'></td></tr>").join("")}</tbody></table></div></div>
    <p class="note">Home Depot 2026 hours from its newsroom; the others are 2025 Christmas Eve hours as reported by Spectrum News on Dec. 23, 2025, and will be updated when 2026 hours are announced. Hours vary by location. USPS 2026 holiday shipping deadlines; NYSE 2026 calendar.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/christmas-eve-christmas-day-2026-store-hours/</div></section>`;
  return doc(fonts, LETTER, css(t, c), [page]);
}

export async function buildShoppingDownloads(): Promise<void> {
  const fonts = await fontFaces();
  const list: Printable[] = [
    ...BF_THEMES.map((t) => ({ slug: `black-friday-planner-2026-${t.id}`, size: LETTER, html: blackFriday(fonts, t) })),
    ...XMAS_THEMES.map((t) => ({ slug: `christmas-eve-checklist-2026-${t.id}`, size: LETTER, html: christmasEve(fonts, t) })),
  ];
  await renderPrintables("holiday-shopping", list);
}
