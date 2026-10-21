/**
 * Hero for the /news/ story free-rides-to-the-polls-2026-lyft-uber-transit: a car, a bus and a
 * scooter heading to a polling place, with a Nov. 3 calendar card. Original art; no company
 * logos or colors. Usage: pnpm fc news-rides
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";

const SLUG = "free-rides-to-the-polls-2026-lyft-uber-transit";
const W = 1200, H = 675;

function hero(fonts: string): string {
  const road = `<rect y="560" width="${W}" height="115" fill="#1e293b"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 130}" y="612" width="70" height="8" rx="4" fill="#facc15"/>`).join("")}`;
  const sign = `<g transform="translate(1010,300)" filter="url(#sh)"><rect x="-8" y="90" width="16" height="170" fill="#94a3b8"/><rect x="-110" y="0" width="220" height="100" rx="14" fill="#fff"/><text x="0" y="44" font-family="Sora" font-size="26" font-weight="800" fill="#1e3a8a" text-anchor="middle">VOTE HERE</text><path d="M-40 70 h70 l-14 -12 M30 70 l-14 12" stroke="#1e3a8a" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
  const bus = `<g transform="translate(610,420)" filter="url(#sh)"><rect width="300" height="130" rx="22" fill="#0ea5e9"/>${[0, 1, 2, 3].map((i) => `<rect x="${22 + i * 66}" y="22" width="52" height="44" rx="8" fill="#e0f2fe"/>`).join("")}<rect y="86" width="300" height="10" fill="#0369a1"/><circle cx="70" cy="132" r="24" fill="#0f172a"/><circle cx="230" cy="132" r="24" fill="#0f172a"/><text x="150" y="83" font-family="Sora" font-size="15" font-weight="800" fill="#fff" text-anchor="middle">FREE ON NOV. 3</text></g>`;
  const car = `<g transform="translate(330,470)" filter="url(#sh)"><path d="M20 70 q10 -50 60 -54 h90 q40 4 64 54 h40 q16 0 16 16 v18 h-290 v-18 q0 -16 20 -16z" fill="#f43f5e"/><path d="M92 26 h70 q24 4 38 40 h-120z" fill="#ffe4e6"/><circle cx="80" cy="106" r="22" fill="#0f172a"/><circle cx="240" cy="106" r="22" fill="#0f172a"/></g>`;
  const scooter = `<g transform="translate(940,500)"><circle cx="0" cy="60" r="16" fill="#0f172a"/><circle cx="90" cy="60" r="16" fill="#0f172a"/><path d="M0 60 h90 M70 60 l-10 -70 h-16" stroke="#22c55e" stroke-width="8" fill="none" stroke-linecap="round"/></g>`;
  const cal = `<g transform="translate(700,90) rotate(-4)" filter="url(#sh)"><rect width="200" height="210" rx="16" fill="#fff"/><rect width="200" height="54" rx="16" fill="#1e3a8a"/><rect y="40" width="200" height="14" fill="#1e3a8a"/><text x="100" y="37" font-family="Sora" font-size="21" font-weight="800" fill="#fff" text-anchor="middle">NOVEMBER</text><text x="100" y="152" font-family="Sora" font-size="96" font-weight="800" fill="#0f172a" text-anchor="middle">3</text><text x="100" y="192" font-family="Sora" font-size="19" font-weight="800" fill="#1e3a8a" text-anchor="middle">TUESDAY</text></g>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;background:#1e3a8a;font-family:Manrope,sans-serif;position:relative}
  .k{position:absolute;left:64px;top:84px;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:#fde68a}
  .t{position:absolute;left:64px;top:118px;width:560px;font-family:Sora;font-weight:800;color:#fff;line-height:1.02;font-size:60px;letter-spacing:-.01em}
  .card{position:absolute;left:64px;top:330px;width:430px;border-radius:18px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.28);padding:18px 22px;color:#0f172a}
  .card b{display:block;font-family:Sora;font-size:30px;line-height:1.05;margin:2px 0}.card span{font-size:15px;color:#475569;font-weight:700}
  .brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.78)}</style></head><body>
  <svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><filter id="sh"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-opacity=".35"/></filter><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#312e81"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>${road}${cal}${sign}${bus}${car}${scooter}</svg>
  <div class="k">Election Day · Nov. 3, 2026</div><div class="t">Rides to the polls</div>
  <div class="card"><span>Lyft code VOTE26</span><b>50% off, up to $10</b><span>Free transit in several cities</span></div>
  <div class="brand">freshcalendars.com/news</div></body></html>`;
}

export async function buildRides(): Promise<void> {
  const fonts = await fontFaces();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    await page.setContent(hero(fonts), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png" });
    const dir = path.join(ROOT, "apps/news/src/assets/news", SLUG);
    await fs.mkdir(dir, { recursive: true });
    await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(dir, `${SLUG}.jpg`));
    console.log(`${SLUG}.jpg`);
  } finally {
    await browser.close();
  }
}
