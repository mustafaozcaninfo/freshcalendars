/**
 * Cookie exchange 2026 printables for /news/ (cookie-exchange-2026-planner-printable-sign-up-sheet).
 * Two US Letter PDFs: a guest and cookie sign-up sheet (name, cookie, dozens and the nine major food
 * allergens as tick boxes) and recipe cards, four to a page, each with a Contains row of the same nine
 * allergens and a raw dough warning. No kit draws these, so the story owns its generator; the host
 * planner is drawn by the holiday-planner kit through `pnpm fc news-assets`.
 * Allergen list: FDA, Food Allergies (milk, eggs, fish, Crustacean shellfish, tree nuts, peanuts,
 * wheat, soybeans, sesame). Usage: pnpm fc news-cookie-exchange
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "cookie-exchange-2026-planner-printable-sign-up-sheet";
const FOOT = `<div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div>`;

/** Short column names for the nine allergens; "Shellfish" stands for Crustacean shellfish. */
const ALLERGENS = ["Milk", "Eggs", "Fish", "Shellfish", "Tree nuts", "Peanuts", "Wheat", "Soy", "Sesame"];

const BASE_CSS = `
  .ck{padding:26px 36px 0}
  .ck header{border-bottom:4px solid #9f1239;padding-bottom:6px;margin-bottom:10px}
  .ck h1{font-family:Sora;font-weight:800;font-size:23px;margin:0;color:#881337;line-height:1.1}
  .ck .sub{margin:4px 0 0;font-size:11px;color:#37474f}
  .ck .note{position:absolute;left:36px;right:36px;bottom:36px;font-size:8.6px;color:#5a6b75;line-height:1.4}
  .ck .bx{display:inline-block;width:11px;height:11px;border:1.5px solid #334155;border-radius:2px}`;

function signUp(fonts: string): string {
  const rows = 15;
  const css = `${BASE_CSS}
  .su .top{display:flex;gap:18px;font-size:11px;font-weight:700;color:#334155;margin-bottom:8px}
  .su .top span{display:flex;align-items:flex-end;gap:6px}
  .su .top s{border-bottom:1.5px solid #334155;height:16px;text-decoration:none;display:inline-block}
  .su table{border-collapse:collapse;width:744px;table-layout:fixed}
  .su th{font-family:Sora;font-weight:700;font-size:8.6px;color:#fff;background:#881337;padding:6px 2px;text-align:center;border:1px solid #881337;line-height:1.15}
  .su th.l{text-align:left;padding-left:6px;font-size:10px}
  .su td{border:1px solid #94a3b8;height:44px;text-align:center}
  .su .legend{margin:8px 0 0;font-size:10px;color:#334155;line-height:1.45}`;
  const widths = [136, 150, 44, ...ALLERGENS.map(() => 46)];
  const cols = widths.map((w) => `<col style="width:${w}px">`).join("");
  const head = `<tr><th class="l">Guest name</th><th class="l">Cookie</th><th>Dozens</th>${ALLERGENS.map((a) => `<th>${a}</th>`).join("")}</tr>`;
  const row = `<tr><td></td><td></td><td></td>${ALLERGENS.map(() => `<td><span class="bx"></span></td>`).join("")}</tr>`;
  const page = `<section class="page ck su"><header><h1>Cookie Exchange Sign-Up Sheet 2026</h1><p class="sub">One line per guest: write the cookie, the dozens and tick every allergen the cookie contains</p></header>
    <div class="top"><span>Swap date <s style="width:130px"></s></span><span>Place <s style="width:200px"></s></span><span>Guests <s style="width:50px"></s></span><span>Dozens each <s style="width:50px"></s></span></div>
    <table><colgroup>${cols}</colgroup><thead>${head}</thead><tbody>${row.repeat(rows)}</tbody></table>
    <p class="legend">Tick boxes list the nine major food allergens named by the U.S. Food and Drug Administration (FDA): milk, eggs, fish, Crustacean shellfish (Shellfish above), tree nuts, peanuts, wheat, soybeans (Soy) and sesame. Tick a box even when the amount is small.</p>
    <p class="note">Source: FDA, Food Allergies (the nine major food allergens; sesame added Jan. 1, 2023). Dozens to bake by guest count are in the story; they are our arithmetic, not an FDA rule.</p>
    ${FOOT}</section>`;
  return doc(fonts, LETTER, css, [page]);
}

function recipeCards(fonts: string): string {
  const css = `${BASE_CSS}
  .rc{display:grid;grid-template-columns:372px 372px;grid-template-rows:repeat(2,436px)}
  .rc .card{border:1px dashed #64748b;padding:14px 20px 0;position:relative}
  .rc h2{font-family:Sora;font-weight:800;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#9f1239;margin:0}
  .rc .nm{border-bottom:1.5px solid #334155;height:26px;margin-bottom:4px}
  .rc .meta{display:flex;gap:10px;font-size:10px;font-weight:700;color:#334155;margin-top:8px}
  .rc .meta span{display:flex;align-items:flex-end;gap:4px;flex:1}
  .rc .meta s{flex:1;border-bottom:1.5px solid #334155;height:13px;text-decoration:none}
  .rc .ln{border-bottom:1.2px solid #94a3b8;height:21px}
  .rc .ct{position:absolute;left:20px;right:20px;bottom:44px}
  .rc .ct h2{margin-bottom:5px}
  .rc .ct ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:5px 6px}
  .rc .ct li{display:flex;align-items:center;gap:5px;font-family:Sora;font-weight:700;font-size:9.5px;color:#1e293b}
  .rc .warn{position:absolute;left:20px;right:20px;bottom:12px;font-size:10px;font-weight:700;color:#7f1d1d;line-height:1.25}`;
  const card = `<div class="card"><h2>Cookie</h2><div class="nm"></div>
    <div class="meta"><span>Makes <s></s></span><span>Oven <s></s></span><span>Bake <s></s></span></div>
    <h2 style="margin-top:12px">Ingredients</h2>${'<div class="ln"></div>'.repeat(6)}
    <h2 style="margin-top:10px">Steps</h2>${'<div class="ln"></div>'.repeat(3)}
    <div class="ct"><h2>Contains</h2><ul>${ALLERGENS.map((a) => `<li><span class="bx"></span>${a}</li>`).join("")}</ul></div>
    <div class="warn">Bake before eating: raw dough is not safe to eat.</div></div>`;
  const page = `<section class="page ck"><header><h1>Cookie Exchange Recipe Cards 2026</h1><p class="sub">4 cards a page: cut on the dashed lines, write the recipe and tick every allergen it contains</p></header>
    <div class="rc">${card.repeat(4)}</div>
    <p class="note">Source: U.S. Food and Drug Administration (FDA), Food Allergies (nine major food allergens) and Flour Is a Raw Food and Other Safety Facts. Print at 100% on US Letter.</p>
    ${FOOT}</section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildCookieExchangeDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("cookie-exchange-2026", [
    { slug: "cookie-exchange-sign-up-sheet-2026", size: LETTER, html: signUp(fonts) },
    { slug: "cookie-exchange-recipe-cards-2026", size: LETTER, html: recipeCards(fonts) },
  ]);
}
