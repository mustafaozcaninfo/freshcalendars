/**
 * Original hero illustrations for the Oct. 20, 2026 /news/ batch, drawn as HTML/SVG and rendered
 * in Chromium (web fonts, gradients, filters), then saved as 2400×1350 JPEGs in
 * apps/news/src/assets/news/<slug>/<slug>.jpg. No stock photos, logos or third-party artwork.
 * Usage: pnpm fc news-heroes3
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";

const W = 1200, H = 675;
/** Deterministic pseudo-random numbers so re-renders are identical. */
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const frame = (fonts: string, body: string, bg: string, brand = "") => `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;background:${bg};font-family:Manrope,sans-serif;position:relative}
.t{position:absolute;font-family:Sora;font-weight:800;color:#fff;line-height:1.02;letter-spacing:-.01em}
.k{position:absolute;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase}
.card{position:absolute;border-radius:18px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.28);padding:18px 22px;color:#0f172a}
.card b{display:block;font-family:Sora;font-size:30px;line-height:1.05}
.card span{font-size:15px;color:#475569;font-weight:700}
.brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.75)}
</style></head><body>${body}<div class="brand" style="${brand}">freshcalendars.com/news</div></body></html>`;

// 1 ── Sunset after the clock change ───────────────────────────────────────────
function sunset(fonts: string): string {
  const r = rng(7);
  const sky = `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset=".45" stop-color="#7c2d92"/><stop offset=".72" stop-color="#f97316"/><stop offset="1" stop-color="#fde68a"/></linearGradient>
    <radialGradient id="g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7cc"/><stop offset=".35" stop-color="#fdba74" stop-opacity=".9"/><stop offset="1" stop-color="#fb923c" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#s)"/>
    ${Array.from({ length: 60 }, () => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 230).toFixed(0)}" r="${(r() * 1.6 + .4).toFixed(1)}" fill="#fff" opacity="${(r() * .7 + .2).toFixed(2)}"/>`).join("")}
    <circle cx="800" cy="520" r="230" fill="url(#g)"/><circle cx="800" cy="520" r="78" fill="#fff4c2"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="0" y="${560 + i * 14}" width="${W}" height="5" fill="#fde68a" opacity="${.35 - i * .07}"/>`).join("")}
    <path d="M0 675 V560 h40 v-60 h30 v-40 h26 v40 h22 v-90 h44 v90 h18 v-130 h50 v130 h20 v-70 h36 v-40 h18 v40 h28 v120 h30 v-150 h24 v-30 h20 v30 h24 v150 h26 v-80 h46 v80 h20 v-110 h40 v110 h30 v-60 h30 v60 h24 v-200 h16 v-40 h8 v40 h16 v200 h30 v-90 h50 v90 h26 v-140 h40 v140 h30 v-70 h34 v70 h20 v-100 h44 v100 h40 v-50 h30 v50 h40 v-120 h50 v120 h40 v-60 h40 v135 Z" fill="#1e1036"/>
    ${Array.from({ length: 140 }, () => { const x = r() * W, y = 470 + r() * 190; return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="4" height="5" fill="#fcd34d" opacity="${(r() * .6 + .2).toFixed(2)}"/>`; }).join("")}
  </svg>`;
  const clock = `<svg width="300" height="300" viewBox="0 0 300 300" style="position:absolute;left:840px;top:60px">
    <circle cx="150" cy="150" r="128" fill="#fff" stroke="#1e1b4b" stroke-width="10"/>
    ${Array.from({ length: 12 }, (_, i) => { const a = (i * 30 * Math.PI) / 180; return `<line x1="${150 + 104 * Math.sin(a)}" y1="${150 - 104 * Math.cos(a)}" x2="${150 + 116 * Math.sin(a)}" y2="${150 - 116 * Math.cos(a)}" stroke="#1e1b4b" stroke-width="${i % 3 ? 4 : 8}" stroke-linecap="round"/>`; }).join("")}
    <line x1="150" y1="150" x2="150" y2="66" stroke="#1e1b4b" stroke-width="10" stroke-linecap="round"/>
    <line x1="150" y1="150" x2="${150 + 62 * Math.sin(Math.PI * 5 / 6)}" y2="${150 - 62 * Math.cos(Math.PI * 5 / 6)}" stroke="#1e1b4b" stroke-width="12" stroke-linecap="round"/>
    <circle cx="150" cy="150" r="10" fill="#f97316"/>
    <path d="M 60 70 A 120 120 0 0 0 40 190" fill="none" stroke="#f97316" stroke-width="12" stroke-linecap="round"/>
    <path d="M 22 168 L 40 196 L 62 172" fill="none" stroke="#f97316" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  return frame(fonts, `${sky}${clock}
    <div class="k" style="left:64px;top:70px;color:#fde68a">Time change · Nov. 1, 2026</div>
    <div class="t" style="left:64px;top:104px;font-size:68px;width:720px">Sunset comes an hour earlier</div>
    <div class="card" style="left:64px;top:300px;width:250px"><span>New York sunset</span><b>5:53 → 4:52</b><span>Oct. 31 → Nov. 1</span></div>
    <div class="card" style="left:334px;top:300px;width:250px"><span>Earliest sunset</span><b>4:28 p.m.</b><span>New York, Dec. 6-9</span></div>`, "#1e1b4b");
}

// 2 ── Hunter's Moon ──────────────────────────────────────────────────────────
function moon(fonts: string): string {
  const r = rng(11);
  const craters = Array.from({ length: 26 }, () => { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 150, s = r() * 22 + 6; return `<circle cx="${(820 + d * Math.cos(a)).toFixed(0)}" cy="${(300 + d * Math.sin(a)).toFixed(0)}" r="${s.toFixed(0)}" fill="#c2410c" opacity="${(r() * .14 + .05).toFixed(2)}"/>`; }).join("");
  const trees = Array.from({ length: 34 }, (_, i) => { const x = i * 38 - 10 + r() * 20, h = 70 + r() * 120, w = 26 + r() * 22; return `<path d="M${x} 675 L${x + w / 2} ${560 - h} L${x + w} 675Z" fill="#05070f"/>`; }).join("");
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs>
    <linearGradient id="n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020617"/><stop offset=".7" stop-color="#172554"/><stop offset="1" stop-color="#3b2a63"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#fdba74" stop-opacity=".55"/><stop offset="1" stop-color="#fdba74" stop-opacity="0"/></radialGradient>
    <radialGradient id="m" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#ffe7b3"/><stop offset=".6" stop-color="#fbbf6a"/><stop offset="1" stop-color="#ea7a2c"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#n)"/>
    ${Array.from({ length: 160 }, () => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 480).toFixed(0)}" r="${(r() * 1.5 + .3).toFixed(1)}" fill="#fff" opacity="${(r() * .8 + .15).toFixed(2)}"/>`).join("")}
    <circle cx="820" cy="300" r="330" fill="url(#glow)"/>
    <circle cx="820" cy="300" r="170" fill="url(#m)"/>${craters}
    <path d="M0 600 C 200 540 360 590 520 560 S 900 520 1200 575 V675 H0Z" fill="#0b1020"/>${trees}
  </svg>`;
  return frame(fonts, `${svg}
    <div class="k" style="left:64px;top:74px;color:#fdba74">Full moon · October 2026</div>
    <div class="t" style="left:64px;top:108px;font-size:84px;width:560px">Hunter's Moon</div>
    <div class="card" style="left:64px;top:300px;width:330px;background:#fff7ed"><span>Full on Monday, Oct. 26</span><b>12:12 a.m. EDT</b><span>9:12 p.m. PDT Sunday, Oct. 25</span></div>`, "#020617");
}

// 3 ── 2027 tax calendar ────────────────────────────────────────────────────────
function tax(fonts: string): string {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const grid = days.map((d) => { const col = (d + 3) % 7, row = Math.floor((d + 3) / 7); return `<g transform="translate(${col * 54},${row * 46})"><rect width="48" height="40" rx="6" fill="${d === 15 ? "#fee2e2" : "#f8fafc"}"/><text x="8" y="26" font-size="17" font-weight="700" fill="${d === 15 ? "#b91c1c" : "#334155"}">${d}</text>${d === 15 ? `<ellipse cx="24" cy="20" rx="30" ry="24" fill="none" stroke="#dc2626" stroke-width="4" transform="rotate(-8 24 20)"/>` : ""}</g>`; }).join("");
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0" font-family="Manrope"><defs>
    <linearGradient id="d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14532d"/><stop offset="1" stop-color="#052e16"/></linearGradient>
    <filter id="sh"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-opacity=".35"/></filter></defs>
    <rect width="${W}" height="${H}" fill="url(#d)"/>
    ${Array.from({ length: 14 }, (_, i) => `<line x1="${i * 100 - 300}" y1="0" x2="${i * 100 + 200}" y2="${H}" stroke="#ffffff" stroke-opacity=".04" stroke-width="40"/>`).join("")}
    <g transform="translate(640,90) rotate(-4)" filter="url(#sh)"><rect width="420" height="420" rx="18" fill="#fff"/><rect width="420" height="78" rx="18" fill="#16a34a"/><rect y="50" width="420" height="28" fill="#16a34a"/>
      <text x="26" y="52" font-family="Sora" font-size="34" font-weight="800" fill="#fff">April 2027</text>
      ${["S", "M", "T", "W", "T", "F", "S"].map((c, i) => `<text x="${36 + i * 54}" y="106" font-size="13" font-weight="800" fill="#64748b">${c}</text>`).join("")}
      <g transform="translate(22,118)">${grid}</g></g>
    <g transform="translate(470,330) rotate(7)" filter="url(#sh)"><rect width="260" height="320" rx="10" fill="#f8fafc"/><rect x="22" y="24" width="140" height="18" rx="4" fill="#0f172a"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="22" y="${66 + i * 26}" width="${150 + (i % 3) * 25}" height="8" rx="4" fill="#cbd5e1"/><rect x="200" y="${62 + i * 26}" width="38" height="16" rx="3" fill="none" stroke="#94a3b8" stroke-width="2"/>`).join("")}</g>
    <g transform="translate(1000,440) rotate(-14)" filter="url(#sh)"><rect width="150" height="210" rx="16" fill="#1f2937"/><rect x="16" y="16" width="118" height="44" rx="6" fill="#a7f3d0"/><text x="124" y="48" font-family="Sora" font-size="24" font-weight="800" text-anchor="end" fill="#064e3b">1040</text>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${16 + (i % 3) * 42}" y="${74 + Math.floor(i / 3) * 32}" width="34" height="24" rx="5" fill="${i === 11 ? "#f97316" : "#4b5563"}"/>`).join("")}</g>
    <g transform="translate(600,560) rotate(-28)"><rect width="300" height="18" rx="4" fill="#facc15"/><path d="M300 0 L330 9 L300 18Z" fill="#fde68a"/><path d="M318 5 L330 9 L318 13Z" fill="#334155"/><rect x="-26" width="26" height="18" rx="4" fill="#f472b6"/></g>
  </svg>`;
  return frame(fonts, `${svg}
    <div class="k" style="left:64px;top:84px;color:#86efac">IRS deadlines</div>
    <div class="t" style="left:64px;top:118px;font-size:76px;width:520px">2027 Tax Calendar</div>
    <div class="card" style="left:64px;top:330px;width:330px"><span>Tax Day 2027</span><b>Thursday, April 15</b><span>Plus four estimated-tax dates</span></div>`, "#14532d");
}

// 4 ── Oct. 20-31 dates ─────────────────────────────────────────────────────────
function late(fonts: string): string {
  const r = rng(23);
  const leaf = (x: number, y: number, s: number, rot: number, c: string) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})"><path d="M0 -40 C 22 -28 30 -6 0 40 C -30 -6 -22 -28 0 -40Z" fill="${c}"/><path d="M0 -36 V 44" stroke="#7c2d12" stroke-width="2.4" opacity=".55"/></g>`;
  const cols = ["#ea580c", "#f59e0b", "#dc2626", "#b45309", "#facc15"];
  // Keep the left third clear so the headline and card stay readable.
  const leaves = Array.from({ length: 40 }, () => { let x = r() * W; const y = r() * H; if (x < 600 && y < 520) x = 600 + r() * 600; return leaf(x, y, r() * .9 + .5, r() * 360, cols[Math.floor(r() * cols.length)]!); }).join("");
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0" font-family="Manrope"><defs>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c2d12"/><stop offset="1" stop-color="#431407"/></linearGradient>
    <filter id="sh"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-opacity=".4"/></filter></defs>
    <rect width="${W}" height="${H}" fill="url(#b)"/>${leaves}
    <g transform="translate(700,92) rotate(3)" filter="url(#sh)"><rect width="330" height="420" rx="22" fill="#fff"/><rect width="330" height="96" rx="22" fill="#c2410c"/><rect y="70" width="330" height="26" fill="#c2410c"/>
      ${[60, 130, 200, 270].map((x) => `<rect x="${x - 7}" y="-18" width="14" height="40" rx="7" fill="#334155"/>`).join("")}
      <text x="165" y="70" font-family="Sora" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">OCTOBER</text>
      <text x="165" y="300" font-family="Sora" font-size="210" font-weight="800" fill="#0f172a" text-anchor="middle">20</text>
      <text x="165" y="370" font-size="34" font-weight="800" fill="#c2410c" text-anchor="middle">TUESDAY</text></g>
    <g transform="translate(1060,440)" filter="url(#sh)"><path d="M0 40 C0 0 90 0 90 40 C90 90 0 90 0 40Z" fill="#f97316"/><path d="M45 4 C40 -10 52 -16 56 -6" stroke="#166534" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M22 34 l10 -12 l10 12Z M50 34 l10 -12 l10 12Z" fill="#431407"/><path d="M24 56 Q45 72 66 56 Q45 62 24 56Z" fill="#431407"/></g>
    <g transform="translate(620,470)" filter="url(#sh)"><circle r="54" fill="#fde68a"/><circle cx="-14" cy="-10" r="10" fill="#f59e0b" opacity=".35"/><circle cx="18" cy="14" r="14" fill="#f59e0b" opacity=".3"/></g>
  </svg>`;
  return frame(fonts, `${svg}
    <div class="k" style="left:64px;top:84px;color:#fdba74">Tuesday, Oct. 20, 2026</div>
    <div class="t" style="left:64px;top:118px;font-size:72px;width:600px">What's on, Oct. 20-31</div>
    <div class="card" style="left:64px;top:330px;width:440px"><span>Day 293 of 2026 · 72 days left</span><b>Hunter's Moon Oct. 26</b><span>Then Halloween on a Saturday</span></div>`, "#7c2d12");
}

// 5 ── Winter break 2026 ────────────────────────────────────────────────────────
function winter(fonts: string): string {
  const r = rng(31);
  const flakes = Array.from({ length: 120 }, () => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(r() * 3 + 1).toFixed(1)}" fill="#fff" opacity="${(r() * .6 + .3).toFixed(2)}"/>`).join("");
  const svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0" font-family="Manrope"><defs>
    <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4ed8"/><stop offset="1" stop-color="#93c5fd"/></linearGradient>
    <filter id="sh"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-opacity=".3"/></filter></defs>
    <rect width="${W}" height="${H}" fill="url(#w)"/>
    <path d="M0 560 C 260 520 480 570 700 540 S 1050 520 1200 548 V675 H0Z" fill="#f1f5f9"/>
    <g transform="translate(640,250)" filter="url(#sh)">
      <path d="M0 120 L190 20 L380 120Z" fill="#991b1b"/><path d="M-6 120 L190 14 L386 120" fill="none" stroke="#fff" stroke-width="16" stroke-linejoin="round"/>
      <rect x="20" y="120" width="340" height="190" fill="#b91c1c"/><rect x="150" y="190" width="80" height="120" rx="8" fill="#7f1d1d"/>
      ${[50, 270].map((x) => `<rect x="${x}" y="160" width="60" height="56" rx="6" fill="#fde68a"/><path d="M${x + 30} 160 V216 M${x} 188 H${x + 60}" stroke="#b91c1c" stroke-width="5"/>`).join("")}
      <rect x="165" y="-50" width="50" height="80" fill="#991b1b"/><path d="M165 -50 H215" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
      <circle cx="190" cy="80" r="22" fill="#fff"/><path d="M190 66 V80 L200 88" stroke="#334155" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M20 120 H360" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    </g>
    <g transform="translate(270,470)" filter="url(#sh)"><rect width="300" height="110" rx="20" fill="#facc15"/><rect x="230" y="20" width="70" height="90" rx="12" fill="#eab308"/>
      ${[20, 80, 140].map((x) => `<rect x="${x}" y="18" width="48" height="36" rx="6" fill="#bfdbfe"/>`).join("")}<rect x="0" y="66" width="300" height="10" fill="#1f2937"/>
      <circle cx="62" cy="112" r="24" fill="#1f2937"/><circle cx="62" cy="112" r="10" fill="#9ca3af"/><circle cx="238" cy="112" r="24" fill="#1f2937"/><circle cx="238" cy="112" r="10" fill="#9ca3af"/>
      <path d="M0 0 H300" stroke="#fff" stroke-width="12" stroke-linecap="round"/></g>
    ${flakes}
  </svg>`;
  return frame(fonts, `${svg}
    <div class="k" style="left:64px;top:74px;color:#dbeafe">School calendars 2026-27</div>
    <div class="t" style="left:64px;top:108px;font-size:76px;width:600px">Winter break 2026</div>
    <div class="card" style="left:64px;top:290px;width:400px"><span>Most large districts</span><b>Dec. 21 - Jan. 1</b><span>Some return Jan. 5 or later</span></div>`, "#1d4ed8", "color:#1e3a8a");
}

export const HEROES3: [string, (f: string) => string][] = [
  ["sunset-times-after-daylight-saving-time-ends-2026", sunset],
  ["hunters-moon-october-2026-full-moon-time", moon],
  ["tax-calendar-2027-irs-deadlines", tax],
  ["october-20-2026-what-day-holidays-observances", late],
  ["winter-break-2026-school-districts-dates", winter],
];

export async function buildHeroes3(): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [slug, draw] of HEROES3) {
      const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
      await page.setContent(draw(fonts), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ type: "png" });
      await page.close();
      const dir = path.join(ROOT, "apps/news/src/assets/news", slug);
      await fs.mkdir(dir, { recursive: true });
      const out = path.join(dir, `${slug}.jpg`);
      await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
      console.log(`${slug}.jpg`);
    }
  } finally {
    await browser.close();
  }
}
