/**
 * Original hero illustrations for the Election 2026 /news/ batch: six state ballot guides and
 * four national explainers. Drawn as HTML/SVG in Chromium, saved as 2400×1350 JPEGs.
 * Nonpartisan by design: no party colors as a theme, no candidate names, no logos.
 * Usage: pnpm fc news-heroes4
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";

const W = 1200, H = 675;
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const frame = (fonts: string, bg: string, body: string, brand = "rgba(255,255,255,.78)") => `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;background:${bg};font-family:Manrope,sans-serif;position:relative}
.t{position:absolute;font-family:Sora;font-weight:800;color:#fff;line-height:1.02;letter-spacing:-.01em}
.k{position:absolute;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase}
.card{position:absolute;border-radius:18px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.28);padding:18px 22px;color:#0f172a}
.card b{display:block;font-family:Sora;font-size:30px;line-height:1.05}
.card span{font-size:15px;color:#475569;font-weight:700}
.brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:${brand}}
</style></head><body>${body}<div class="brand">freshcalendars.com/news</div></body></html>`;

const stars = (seed: number, n: number, color = "#fff") => { const r = rng(seed); return Array.from({ length: n }, () => { const x = r() * W, y = r() * H, s = r() * 7 + 4; return `<path transform="translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${(s / 10).toFixed(2)})" d="M0 -10 L2.9 -3.1 L10 -3.1 L4.3 1.2 L6.5 8.1 L0 3.9 L-6.5 8.1 L-4.3 1.2 L-10 -3.1 L-2.9 -3.1Z" fill="${color}" opacity="${(r() * .18 + .06).toFixed(2)}"/>`; }).join(""); };

/** A paper ballot with filled ovals and a measure block, slightly rotated, with a ballot box behind. */
function ballot(accent: string, lines: string[], measure: string): string {
  const rows = lines.map((l, i) => `<g transform="translate(36,${118 + i * 46})"><ellipse cx="11" cy="0" rx="11" ry="8" fill="${i === 1 ? "#0f172a" : "none"}" stroke="#0f172a" stroke-width="2.4"/><rect x="34" y="-6" width="${150 + ((i * 37) % 90)}" height="12" rx="6" fill="#cbd5e1"/><text x="34" y="-14" font-family="Sora" font-size="13" font-weight="800" fill="#475569">${l}</text></g>`).join("");
  return `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter></defs>
    <g transform="translate(700,330)" filter="url(#sh)"><rect width="380" height="270" rx="16" fill="#e2e8f0"/><rect x="0" y="0" width="380" height="60" rx="16" fill="#cbd5e1"/><rect x="110" y="22" width="160" height="16" rx="8" fill="#334155"/><text x="190" y="170" font-family="Sora" font-size="44" font-weight="800" fill="#94a3b8" text-anchor="middle">VOTE</text></g>
    <g transform="translate(640,78) rotate(-5)" filter="url(#sh)"><rect width="330" height="430" rx="10" fill="#fff"/><rect width="330" height="70" rx="10" fill="${accent}"/><rect y="56" width="330" height="14" fill="${accent}"/>
      <text x="26" y="45" font-family="Sora" font-size="24" font-weight="800" fill="#fff">OFFICIAL BALLOT</text>${rows}
      <g transform="translate(36,${118 + lines.length * 46})"><rect x="-6" y="-4" width="270" height="62" rx="8" fill="#f1f5f9"/><text x="6" y="16" font-family="Sora" font-size="13" font-weight="800" fill="#334155">${measure}</text>
      <rect x="6" y="28" width="18" height="18" rx="3" fill="none" stroke="#0f172a" stroke-width="2.4"/><path d="M9 37 l5 5 l9 -11" stroke="${accent}" stroke-width="3.4" fill="none" stroke-linecap="round"/><text x="32" y="43" font-size="14" font-weight="800" fill="#0f172a">YES</text>
      <rect x="96" y="28" width="18" height="18" rx="3" fill="none" stroke="#0f172a" stroke-width="2.4"/><text x="122" y="43" font-size="14" font-weight="800" fill="#0f172a">NO</text></g></g>
    <g transform="translate(1085,250) rotate(12)" filter="url(#sh)"><circle r="62" fill="#fff"/><circle r="54" fill="none" stroke="${accent}" stroke-width="5"/><text y="-6" font-family="Sora" font-size="22" font-weight="800" fill="${accent}" text-anchor="middle">I VOTED</text><text y="20" font-family="Sora" font-size="14" font-weight="800" fill="#334155" text-anchor="middle">NOV. 3, 2026</text></g></svg>`;
}

function stateHero(fonts: string, o: { state: string; bg: string; bg2: string; accent: string; kicker: string; title: string; cardTop: string; cardBig: string; cardBottom: string; lines: string[]; measure: string; seed: number }): string {
  return frame(fonts, o.bg, `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.bg}"/><stop offset="1" stop-color="${o.bg2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>${stars(o.seed, 40)}</svg>
    ${ballot(o.accent, o.lines, o.measure)}
    <div class="k" style="left:64px;top:84px;color:#fde68a">${o.kicker}</div>
    <div class="t" style="left:64px;top:118px;font-size:66px;width:600px">${o.title}</div>
    <div class="card" style="left:64px;top:${o.title.length > 26 ? 380 : 320}px;width:430px"><span>${o.cardTop}</span><b>${o.cardBig}</b><span>${o.cardBottom}</span></div>`);
}

/** GTA 6 countdown: neon sunset and a calendar page; original art, no game imagery or logos. */
function gta6(fonts: string): string {
  const sun = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e1065"/><stop offset=".55" stop-color="#be185d"/><stop offset="1" stop-color="#f97316"/></linearGradient><linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f472b6"/></linearGradient><filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>${stars(61, 30)}
    <circle cx="900" cy="470" r="230" fill="url(#sun)"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="640" y="${430 + i * 34}" width="520" height="${6 + i * 3}" fill="#be185d"/>`).join("")}
    <rect y="560" width="${W}" height="${H - 560}" fill="#1e0b3a"/>${[0, 1, 2, 3].map((i) => `<path d="M0 ${590 + i * 22} H${W}" stroke="#f472b6" stroke-opacity="${0.5 - i * 0.1}" stroke-width="2"/>`).join("")}
`;
  const cal = `<g transform="translate(690,120) rotate(4)" filter="url(#sh)"><rect width="250" height="270" rx="18" fill="#fff"/><rect width="250" height="70" rx="18" fill="#7c3aed"/><rect y="52" width="250" height="18" fill="#7c3aed"/>
    <text x="125" y="46" font-family="Sora" font-size="26" font-weight="800" fill="#fff" text-anchor="middle">OCTOBER</text><text x="125" y="196" font-family="Sora" font-size="120" font-weight="800" fill="#1e1b4b" text-anchor="middle">22</text><text x="125" y="244" font-family="Sora" font-size="24" font-weight="800" fill="#be185d" text-anchor="middle">THURSDAY</text></g>`;
  return frame(fonts, "#2e1065", `<svg width="${W}" height="${H}" style="position:absolute;inset:0">${sun}${cal}</svg>
    <div class="k" style="left:64px;top:84px;color:#fde68a">GTA 6 · Launch countdown</div>
    <div class="t" style="left:64px;top:118px;font-size:64px;width:560px">What's confirmed before Nov. 19</div>
    <div class="card" style="left:64px;top:390px;width:460px"><span>Pre-load opens Thursday, Nov. 12</span><b>Launch Thursday, Nov. 19</b><span>PlayStation 5 and Xbox Series X<span style="font-family:Arial,sans-serif">|</span>S</span></div>`);
}

/** Veterans Day free meals: a plate, a coffee cup and a Nov. 11 calendar card; no brand logos. */
function vetsMeals(fonts: string): string {
  const stripes = Array.from({ length: 7 }, (_, i) => `<rect x="0" y="${560 + i * 18}" width="${W}" height="9" fill="${i % 2 ? "#ffffff" : "#b91c1c"}" opacity=".55"/>`).join("");
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><linearGradient id="vb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b2a5b"/><stop offset="1" stop-color="#132f6b"/></linearGradient><filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter></defs>
    <rect width="${W}" height="${H}" fill="url(#vb)"/>${stars(71, 46)}${stripes}
    <g transform="translate(860,380)" filter="url(#sh)"><ellipse rx="210" ry="120" fill="#f8fafc"/><ellipse rx="160" ry="88" fill="#e2e8f0"/>
      <path d="M-95 -10 q40 -55 95 -35 q55 -25 95 35 q-30 40 -95 30 q-65 10 -95 -30z" fill="#b45309"/><path d="M-70 -18 q35 -30 70 -18" stroke="#fbbf24" stroke-width="6" fill="none"/>
      <ellipse cx="60" cy="25" rx="44" ry="16" fill="#16a34a"/><ellipse cx="-55" cy="28" rx="38" ry="14" fill="#facc15"/></g>
    <g transform="translate(1090,250)" filter="url(#sh)"><rect x="-48" y="-70" width="96" height="120" rx="14" fill="#fff"/><path d="M48 -40 q36 0 36 30 q0 30 -36 30" stroke="#fff" stroke-width="14" fill="none"/><rect x="-48" y="-70" width="96" height="26" rx="10" fill="#b91c1c"/><path d="M-20 -95 q10 -16 0 -30 M10 -95 q10 -16 0 -30" stroke="#cbd5e1" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    <g transform="translate(650,110) rotate(-5)" filter="url(#sh)"><rect width="210" height="220" rx="16" fill="#fff"/><rect width="210" height="58" rx="16" fill="#b91c1c"/><rect y="42" width="210" height="16" fill="#b91c1c"/>
      <text x="105" y="40" font-family="Sora" font-size="22" font-weight="800" fill="#fff" text-anchor="middle">NOVEMBER</text><text x="105" y="160" font-family="Sora" font-size="100" font-weight="800" fill="#0b2a5b" text-anchor="middle">11</text><text x="105" y="200" font-family="Sora" font-size="20" font-weight="800" fill="#b91c1c" text-anchor="middle">WEDNESDAY</text></g></svg>`;
  return frame(fonts, "#0b2a5b", `${svg}
    <div class="k" style="left:64px;top:84px;color:#fde68a">Veterans Day · Nov. 11, 2026</div>
    <div class="t" style="left:64px;top:118px;font-size:64px;width:560px">Free meals and discounts</div>
    <div class="card" style="left:64px;top:390px;width:470px"><span>Bring proof of service</span><b>Printable deal sheet</b><span>Dine-in and ID rules for every offer</span></div>`);
}

function polls(fonts: string): string {
  // One instant on four clocks: 8 p.m. ET is 7 p.m. CT, 6 p.m. MT and 5 p.m. PT.
  const zones = [["ET", "8:00", "#fde68a"], ["CT", "7:00", "#fdba74"], ["MT", "6:00", "#fca5a5"], ["PT", "5:00", "#c4b5fd"]];
  const clocks = zones.map(([z, t, c], i) => { const x = 640 + (i % 2) * 260, y = 120 + Math.floor(i / 2) * 250, hr = Number(t.split(":")[0]) % 12; const a = (hr / 12) * Math.PI * 2;
    return `<g transform="translate(${x},${y})"><circle cx="100" cy="100" r="96" fill="#fff"/><circle cx="100" cy="100" r="86" fill="none" stroke="${c}" stroke-width="10"/>${Array.from({ length: 12 }, (_, k) => { const b = (k / 12) * Math.PI * 2; return `<circle cx="${100 + 70 * Math.sin(b)}" cy="${100 - 70 * Math.cos(b)}" r="${k % 3 ? 3 : 5}" fill="#334155"/>`; }).join("")}
      <line x1="100" y1="100" x2="100" y2="46" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/><line x1="100" y1="100" x2="${100 + 42 * Math.sin(a)}" y2="${100 - 42 * Math.cos(a)}" stroke="#0f172a" stroke-width="9" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="#b91c1c"/>
      <rect x="62" y="206" width="76" height="30" rx="15" fill="${c}"/><text x="100" y="227" font-family="Sora" font-size="17" font-weight="800" fill="#0f172a" text-anchor="middle">${z}</text></g>`; }).join("");
  return frame(fonts, "#0b1f4a", `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><rect width="${W}" height="${H}" fill="#0b1f4a"/>${stars(5, 50)}</svg>
    <svg width="${W}" height="${H}" style="position:absolute;inset:0">${clocks}</svg>
    <div class="k" style="left:64px;top:84px;color:#fde68a">Election Day · Nov. 3, 2026</div>
    <div class="t" style="left:64px;top:118px;font-size:70px;width:540px">When do polls close?</div>
    <div class="card" style="left:64px;top:340px;width:420px"><span>First closings, Eastern Time</span><b>6 p.m. ET</b><span>Last: Alaska and Hawaii, midnight-1 a.m.</span></div>`);
}

function mail(fonts: string): string {
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter></defs><rect width="${W}" height="${H}" fill="#134e4a"/>${stars(9, 40)}
    <g transform="translate(660,150) rotate(-7)" filter="url(#sh)"><rect width="440" height="290" rx="14" fill="#fefce8"/><path d="M0 14 L220 170 L440 14" fill="none" stroke="#d6d3d1" stroke-width="6"/>
      <rect x="320" y="30" width="86" height="100" rx="6" fill="#fff" stroke="#dc2626" stroke-width="4" stroke-dasharray="8 6"/><path d="M340 92 q22 -38 46 0" fill="none" stroke="#1d4ed8" stroke-width="6"/>
      <g transform="translate(240,74) rotate(-14)"><circle r="54" fill="none" stroke="#b91c1c" stroke-width="5"/><text y="-8" font-family="Sora" font-size="12" font-weight="800" fill="#b91c1c" text-anchor="middle">POSTMARKED</text><text y="16" font-family="Sora" font-size="19" font-weight="800" fill="#b91c1c" text-anchor="middle">NOV 3</text></g>
      <rect x="40" y="190" width="200" height="14" rx="7" fill="#a8a29e"/><rect x="40" y="218" width="250" height="14" rx="7" fill="#a8a29e"/><rect x="40" y="246" width="160" height="14" rx="7" fill="#a8a29e"/>
      <text x="40" y="170" font-family="Sora" font-size="22" font-weight="800" fill="#0f766e">OFFICIAL BALLOT</text></g>
    <g transform="translate(880,470)" filter="url(#sh)"><rect width="230" height="150" rx="16" fill="#fff"/><text x="115" y="48" font-family="Sora" font-size="18" font-weight="800" fill="#475569" text-anchor="middle">MUST ARRIVE BY</text><text x="115" y="106" font-family="Sora" font-size="44" font-weight="800" fill="#0f766e" text-anchor="middle">Nov. 3</text></g></svg>`;
  return frame(fonts, "#134e4a", `${svg}
    <div class="k" style="left:64px;top:84px;color:#99f6e4">Vote by mail · 2026</div>
    <div class="t" style="left:64px;top:118px;font-size:66px;width:560px">Mail ballot deadlines by state</div>
    <div class="card" style="left:64px;top:390px;width:440px"><span>Received by Election Day in most states</span><b>Mail by Oct. 27</b><span>USPS advises a week before it is due</span></div>`);
}

function holiday(fonts: string): string {
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".3"/></filter></defs><rect width="${W}" height="${H}" fill="#7c2d12"/>${stars(13, 40)}
    <g transform="translate(660,90)" filter="url(#sh)"><path d="M70 0 L250 0" stroke="#e7e5e4" stroke-width="6"/><line x1="100" y1="0" x2="60" y2="70" stroke="#e7e5e4" stroke-width="5"/><line x1="220" y1="0" x2="260" y2="70" stroke="#e7e5e4" stroke-width="5"/>
      <rect x="0" y="70" width="320" height="170" rx="16" fill="#fff"/><text x="160" y="150" font-family="Sora" font-size="62" font-weight="800" fill="#15803d" text-anchor="middle">OPEN</text><text x="160" y="200" font-family="Sora" font-size="20" font-weight="800" fill="#475569" text-anchor="middle">BANKS · POST OFFICES</text></g>
    <g transform="translate(760,380) rotate(5)" filter="url(#sh)"><rect width="340" height="190" rx="16" fill="#fff"/><rect width="340" height="56" rx="16" fill="#b91c1c"/><rect y="40" width="340" height="16" fill="#b91c1c"/><text x="170" y="38" font-family="Sora" font-size="22" font-weight="800" fill="#fff" text-anchor="middle">NOVEMBER</text>
      <text x="170" y="150" font-family="Sora" font-size="90" font-weight="800" fill="#0f172a" text-anchor="middle">3</text><text x="290" y="150" font-family="Sora" font-size="20" font-weight="800" fill="#b91c1c" text-anchor="middle">TUE</text></g></svg>`;
  return frame(fonts, "#7c2d12", `${svg}
    <div class="k" style="left:64px;top:84px;color:#fdba74">Election Day 2026</div>
    <div class="t" style="left:64px;top:118px;font-size:66px;width:560px">Is Election Day a holiday?</div>
    <div class="card" style="left:64px;top:320px;width:440px"><span>Not a federal holiday</span><b>A holiday in 11 states</b><span>Banks, mail and stock markets are open</span></div>`);
}

function midterm(fonts: string): string {
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#172554"/></linearGradient><filter id="sh"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-opacity=".35"/></filter></defs><rect width="${W}" height="${H}" fill="url(#s)"/>${stars(21, 60)}
    <g transform="translate(640,110)" fill="#f8fafc" filter="url(#sh)">
      <rect x="40" y="380" width="460" height="30" rx="4"/><rect x="70" y="250" width="400" height="130"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${86 + i * 44}" y="262" width="16" height="112" fill="#cbd5e1"/>`).join("")}
      <rect x="60" y="236" width="420" height="18" rx="3"/><rect x="170" y="200" width="200" height="40" rx="4"/>
      <path d="M180 200 C 180 110 360 110 360 200Z"/><rect x="262" y="70" width="16" height="70" rx="6"/><circle cx="270" cy="66" r="12"/>
      ${Array.from({ length: 7 }, (_, i) => `<rect x="${196 + i * 22}" y="160" width="9" height="36" fill="#cbd5e1"/>`).join("")}</g>
    <g transform="translate(980,440)" filter="url(#sh)"><rect width="190" height="190" rx="16" fill="#fff"/>${Array.from({ length: 5 }, (_, i) => `<rect x="22" y="${30 + i * 30}" width="18" height="18" rx="3" fill="none" stroke="#1e3a8a" stroke-width="2.4"/>${i < 3 ? `<path d="M25 ${39 + i * 30} l5 5 l9 -11" stroke="#b91c1c" stroke-width="3" fill="none"/>` : ""}<rect x="52" y="${34 + i * 30}" width="${90 + (i % 2) * 30}" height="10" rx="5" fill="#cbd5e1"/>`).join("")}</g></svg>`;
  return frame(fonts, "#1e3a8a", `${svg}
    <div class="k" style="left:64px;top:84px;color:#fde68a">2026 midterm elections</div>
    <div class="t" style="left:64px;top:118px;font-size:66px;width:560px">What's on the ballot Nov. 3</div>
    <div class="card" style="left:64px;top:390px;width:450px"><span>Congress and 36 governors</span><b>35 Senate · 435 House</b><span>Plus a free election-night tracker</span></div>`);
}

export const HEROES4: [string, (f: string) => string][] = [
  ["california-propositions-2026-november-ballot-explained", (f) => stateHero(f, { state: "California", bg: "#1e40af", bg2: "#0c4a6e", accent: "#1d4ed8", kicker: "California · Nov. 3, 2026", title: "14 propositions on the ballot", cardTop: "Mailed ballots postmarked by Nov. 3", cardBig: "Count if in by Nov. 10", cardBottom: "Plus an open race for governor", lines: ["GOVERNOR", "LT. GOVERNOR", "ATTORNEY GENERAL"], measure: "PROPOSITION 1", seed: 31 })],
  ["florida-amendments-2026-ballot-senate-special-election", (f) => stateHero(f, { state: "Florida", bg: "#c2410c", bg2: "#7c2d12", accent: "#c2410c", kicker: "Florida · Nov. 3, 2026", title: "3 amendments and a Senate special", cardTop: "Each amendment needs", cardBig: "60% to pass", cardBottom: "Early voting Oct. 24-31 statewide", lines: ["U.S. SENATE (SPECIAL)", "GOVERNOR", "ATTORNEY GENERAL"], measure: "AMENDMENT 3", seed: 37 })],
  ["michigan-ballot-2026-proposals-candidates", (f) => stateHero(f, { state: "Michigan", bg: "#0f766e", bg2: "#134e4a", accent: "#0f766e", kicker: "Michigan · Nov. 3, 2026", title: "Two proposals, open seats at the top", cardTop: "Early voting statewide", cardBig: "Oct. 24-Nov. 1", cardBottom: "Same-day registration through Nov. 3", lines: ["GOVERNOR", "U.S. SENATE", "SUPREME COURT"], measure: "PROPOSAL 1", seed: 41 })],
  ["pennsylvania-2026-election-governor-mail-ballot-deadlines", (f) => stateHero(f, { state: "Pennsylvania", bg: "#1e3a8a", bg2: "#0f172a", accent: "#1e3a8a", kicker: "Pennsylvania · Nov. 3, 2026", title: "Governor's race and mail ballots", cardTop: "Apply for a mail ballot by", cardBig: "Oct. 27, 5 p.m.", cardBottom: "Must arrive by 8 p.m. Election Day", lines: ["GOVERNOR", "U.S. HOUSE", "STATE HOUSE"], measure: "LOCAL QUESTION", seed: 43 })],
  ["georgia-2026-ballot-amendments-advance-voting", (f) => stateHero(f, { state: "Georgia", bg: "#9f1239", bg2: "#4c0519", accent: "#9f1239", kicker: "Georgia · Nov. 3, 2026", title: "Senate, governor and 3 amendments", cardTop: "Advance voting", cardBig: "Oct. 13-30", cardBottom: "Runoff, if needed: Dec. 1", lines: ["U.S. SENATE", "GOVERNOR", "SECRETARY OF STATE"], measure: "AMENDMENT", seed: 47 })],
  ["arizona-propositions-2026-ballot-explained", (f) => stateHero(f, { state: "Arizona", bg: "#b45309", bg2: "#7c2d12", accent: "#b45309", kicker: "Arizona · Nov. 3, 2026", title: "8 propositions on the ballot", cardTop: "Early ballots must arrive by", cardBig: "7 p.m. Nov. 3", cardBottom: "Postmarks do not count", lines: ["GOVERNOR / LT. GOV.", "ATTORNEY GENERAL", "CORPORATION COMM."], measure: "PROPOSITION 141", seed: 53 })],
  ["what-time-do-polls-close-election-day-2026", polls],
  ["veterans-day-free-meals-discounts", vetsMeals],
  ["gta-6-october-22-2026-what-is-confirmed-release-countdown", gta6],
  ["mail-ballot-deadlines-2026-by-state", mail],
  ["is-election-day-a-holiday-2026-whats-open", holiday],
  ["2026-midterm-elections-whats-on-the-ballot-results-tracker", midterm],
];

export async function buildHeroes4(): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [slug, draw] of HEROES4) {
      const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
      await page.setContent(draw(fonts), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ type: "png" });
      await page.close();
      const dir = path.join(ROOT, "apps/news/src/assets/news", slug);
      await fs.mkdir(dir, { recursive: true });
      await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${slug}.jpg`));
      console.log(`${slug}.jpg`);
    }
  } finally {
    await browser.close();
  }
}
