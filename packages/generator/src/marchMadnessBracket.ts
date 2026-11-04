/**
 * March Madness 2027 printable bracket for /news/ (march-madness-2027-printable-bracket).
 * One US Letter landscape page for the men's 76-team field: Opening Round (12 games, two sites,
 * 24 lines) beside a standard 64-line bracket (4 regions of 16 lines; First Round, Second Round,
 * Sweet 16, Elite Eight) and a Final Four and championship box. Dates and sites: NCAA.com,
 * "How the 2027 expanded NCAA tournament and March Madness brackets will work" (May 7, 2026);
 * Wichita as the second Opening Round site: CBS Sports and Yahoo Sports (July 9, 2026).
 * No logos, no team names (they are set on Selection Sunday). Usage: pnpm fc news-march-madness-bracket
 */
import { LETTER_LANDSCAPE, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "march-madness-2027-printable-bracket";
const STORY = "march-madness-2027-printable-bracket";
/** Seed order of the 16 first-round lines in a standard region (1v16, 8v9, 5v12, ...). */
const SEEDS = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];

const slots = (n: number, label?: (i: number) => string) =>
  Array.from({ length: n }, (_, i) => `<div class="sl"><span class="ln">${label ? `<b>${label(i)}</b>` : ""}</span></div>`).join("");

function region(name: string, site: string): string {
  return `<div class="reg"><p class="rn"><b>${name}</b> · ${site}</p><div class="cols">
    <div class="c r64">${slots(16, (i) => String(SEEDS[i]))}</div>
    <div class="c">${slots(8)}</div>
    <div class="c">${slots(4)}</div>
    <div class="c">${slots(2)}</div></div></div>`;
}

const heads = (rtl: boolean) => {
  const h = [
    ["First Round", "Mar. 18-19"],
    ["Second Round", "Mar. 20-21"],
    ["Sweet 16", "Mar. 25-26"],
    ["Elite Eight", "Mar. 27-28"],
  ];
  const cells = h.map(([a, b]) => `<div class="hd">${a}<br><span>${b}</span></div>`);
  return `<div class="heads ${rtl ? "rtl" : ""}">${cells.join("")}</div>`;
};

const side = (rtl: boolean, a: [string, string], b: [string, string]) =>
  `<div class="side ${rtl ? "rtl" : ""}">${heads(rtl)}${region(...a)}${region(...b)}</div>`;

const oGame = () => `<div class="og"><div class="ot"><i></i></div><div class="ot"><i></i></div></div>`;
const oCol = (site: string) =>
  `<div class="oc"><h4>${site}<br><span>6 games</span></h4>${Array.from({ length: 6 }, oGame).join("")}</div>`;

function sheet(fonts: string): string {
  const css = `
  .mm{padding:30px 24px 0}
  .mm header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #1e3a8a;padding-bottom:4px;margin-right:130px}
  .mm h1{font-family:Sora;font-weight:800;font-size:24px;margin:0;color:#14213d;line-height:1.05}
  .mm .sub{margin:3px 0 0;font-size:10.5px;color:#37474f}
  .mm .main{display:flex;gap:8px;margin-top:6px;height:630px}
  .mm .side{flex:1;display:flex;flex-direction:column}
  .mm .heads{display:flex;gap:6px;height:28px;margin-bottom:2px}
  .mm .heads.rtl{flex-direction:row-reverse}
  .mm .hd{flex:1;background:#1e3a8a;color:#fff;border-radius:4px;text-align:center;font-family:Sora;font-weight:700;font-size:8.5px;line-height:1.2;padding-top:3px}
  .mm .hd span{font-family:Manrope;font-weight:700;font-size:8.5px}
  .mm .reg{flex:1;display:flex;flex-direction:column;border-top:1.4px solid #94a3b8;padding-top:1px}
  .mm .rn{margin:0;font-size:8.5px;height:12px;color:#1e293b}
  .mm .rn b{font-family:Sora;color:#14213d;font-size:9.5px}
  .mm .cols{flex:1;display:flex;gap:6px}
  .mm .rtl .cols{flex-direction:row-reverse}
  .mm .c{flex:1;display:flex;flex-direction:column}
  .mm .sl{flex:1;display:flex;align-items:flex-end}
  .mm .ln{display:block;width:100%;border-bottom:1.1px solid #475569;height:100%;position:relative}
  .mm .ln b{position:absolute;left:1px;bottom:1px;font-family:Sora;font-size:8px;color:#475569}
  .mm .rtl .ln b{left:auto;right:1px}
  .mm .r64 .ln b{font-weight:700}
  .mm .center{width:196px;display:flex;flex-direction:column;gap:8px}
  .mm .open{border:2px solid #334155;border-radius:9px;padding:5px 5px 6px;background:#f8fafc}
  .mm .open h2{font-family:Sora;font-weight:800;font-size:11px;margin:0;color:#14213d;text-align:center}
  .mm .open p{margin:1px 0 4px;font-size:8.5px;text-align:center;color:#1e293b;font-weight:700;line-height:1.25}
  .mm .ocs{display:flex;gap:5px}
  .mm .oc{flex:1}
  .mm .oc h4{font-family:Sora;font-size:8.5px;margin:0 0 3px;text-align:center;color:#fff;background:#1e3a8a;border-radius:3px;padding:2px 0;line-height:1.2}
  .mm .oc h4 span{font-family:Manrope;font-weight:700}
  .mm .og{border:1.2px solid #334155;border-radius:4px;margin-bottom:5px;background:#fff}
  .mm .ot{height:20px;display:flex;align-items:flex-end;padding:0 3px 2px}
  .mm .ot+.ot{border-top:1px solid #cbd5e1}
  .mm .ot i{flex:1;border-bottom:1.1px solid #475569;height:12px}
  .mm .ff{border:3px solid #b91c1c;border-radius:11px;padding:8px 8px 8px;background:#fff7f7;flex:1;display:flex;flex-direction:column;justify-content:space-between}
  .mm .ff h2{font-family:Sora;font-weight:800;font-size:15px;color:#b91c1c;margin:0;text-align:center;line-height:1.1}
  .mm .ff p{margin:2px 0 0;font-size:9.5px;line-height:1.35;color:#1e293b;font-weight:700;text-align:center}
  .mm .ff .t{display:flex;align-items:flex-end;gap:4px;height:22px}
  .mm .ff .t b{font-family:Sora;font-size:8.5px;color:#14213d;min-width:44px}
  .mm .ff .t i{flex:1;border-bottom:1.3px solid #475569;height:14px}
  .mm .champ{font-family:Sora;font-weight:700;font-size:10px;color:#14213d}
  .mm .champ i{display:block;border-bottom:1.5px solid #475569;height:26px}
  .mm .note{margin:5px 0 0;font-size:8.5px;color:#5a6b75;line-height:1.35}`;
  const ff = `<div class="ff"><div><h2>Final Four</h2><p>Sat., Apr. 3, 2027<br>Ford Field, Detroit</p></div>
      <div><div class="t"><b>South v West</b><i></i></div><div class="t"><b>Midwest v East</b><i></i></div></div>
      <div><h2>Championship</h2><p>Mon., Apr. 5, 2027<br>Ford Field, Detroit</p><div class="t"><b>Winners</b><i></i></div></div>
      <div class="champ">Champion<i></i></div></div>`;
  const open = `<div class="open"><h2>Opening Round</h2><p>Tue., Mar. 16 and Wed., Mar. 17<br>24 teams, 12 games</p><div class="ocs">${oCol("UD Arena, Dayton")}${oCol("InTrust Bank Arena, Wichita")}</div></div>`;
  const page = `<section class="page mm"><header><div><h1>March Madness 2027 Printable Bracket</h1><p class="sub">Men's 76-team field · Selection Sunday is Sun., Mar. 14, 2027 · fill in the teams once the bracket is set</p></div></header>
  <div class="main">${side(false, ["South", "San Antonio, TX"], ["West", "Los Angeles, CA"])}
    <div class="center">${open}${ff}</div>
    ${side(true, ["Midwest", "Kansas City, MO"], ["East", "New York, NY"])}</div>
  <p class="note">Source: NCAA.com, How the 2027 expanded NCAA tournament and March Madness brackets will work (May 7, 2026); Opening Round site in Wichita: CBS Sports and Yahoo Sports (July 9, 2026). Opening Round winners join the 64-team bracket. First and Second Round cities: Charlotte, Fort Worth, Louisville, Minneapolis, Omaha, Pittsburgh, Sacramento, Spokane; arenas and TV not yet announced.</p>
  <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${STORY}/</div></section>`;
  return doc(fonts, LETTER_LANDSCAPE, css, [page]);
}

export async function buildMarchMadnessBracketDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("march-madness-2027", [{ slug: SLUG, size: LETTER_LANDSCAPE, html: sheet(fonts) }]);
}
