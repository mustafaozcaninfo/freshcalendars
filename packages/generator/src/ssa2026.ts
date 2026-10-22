/**
 * Social Security payment schedule story for /news/ (social-security-payment-schedule-october-2026-who-gets-paid-today):
 * the hero and a one-page Oct.-Dec. 2026 payment calendar. Every marked date is read from SSA
 * Publication 05-10031, "Schedule of Social Security Benefit Payments 2026" (checked Oct. 21, 2026),
 * including the weekend and holiday shifts. No SSA seal or logo. Usage: pnpm fc news-ssa-oct
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { LETTER, doc, fontFaces } from "./julian.js";
import { DOW3, MONTHS, daysIn, renderPrintables, utc } from "./printables.js";
import { ROOT } from "./paths.js";

const SLUG = "social-security-payment-schedule-october-2026-who-gets-paid-today";

/** Kind of payment on a day: W1/W2/W3 birth-date Wednesdays, E early-filers/dual (the 3rd), S SSI. */
type Kind = "W1" | "W2" | "W3" | "E" | "S";
/** [month (0-based), day, kinds]: from the SSA 2026 schedule. */
const PAY: [number, number, Kind[]][] = [
  [9, 1, ["S"]], [9, 2, ["E"]], [9, 14, ["W1"]], [9, 21, ["W2"]], [9, 28, ["W3"]], [9, 30, ["S"]],
  [10, 3, ["E"]], [10, 10, ["W1"]], [10, 18, ["W2"]], [10, 25, ["W3"]],
  [11, 1, ["S"]], [11, 3, ["E"]], [11, 9, ["W1"]], [11, 16, ["W2"]], [11, 23, ["W3"]], [11, 31, ["S", "E"]],
];
const LABEL: Record<Kind, string> = { W1: "Born 1st-10th", W2: "Born 11th-20th", W3: "Born 21st-31st", E: "Pre-1997 or with SSI", S: "SSI" };
const COLOR: Record<Kind, string> = { W1: "#1d4ed8", W2: "#0f766e", W3: "#b45309", E: "#7c3aed", S: "#be123c" };

function month(m: number): string {
  const first = utc(2026, m, 1).getUTCDay(), n = daysIn(2026, m);
  const cells: string[] = Array.from({ length: first }, () => `<div class="c e"></div>`);
  for (let d = 1; d <= n; d++) {
    const kinds = PAY.find(([pm, pd]) => pm === m && pd === d)?.[2] ?? [];
    const k = kinds[0];
    cells.push(`<div class="c${k ? " pay" : ""}"${k ? ` style="--k:${COLOR[k]}"` : ""}><b>${d}</b>${kinds.map((x) => `<i style="background:${COLOR[x]}">${LABEL[x]}</i>`).join("")}</div>`);
  }
  return `<div class="m"><h2>${MONTHS[m]} 2026</h2><div class="g">${DOW3.map((x) => `<div class="h">${x}</div>`).join("")}${cells.join("")}</div></div>`;
}

function sheet(fonts: string): string {
  const css = `
  .ss{padding:26px 36px 0}
  .ss h1{font-family:Sora;font-weight:800;font-size:22px;margin:0;color:#0b2a5b;line-height:1.05}
  .ss .sub{margin:4px 0 8px;font-size:11px;color:#37474f}
  .ss .key{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0 0 8px;font-size:10px;color:#1f2937}
  .ss .key span::before{content:"";display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px;background:var(--k)}
  .ss .m{margin-bottom:7px}
  .ss h2{font-family:Sora;font-size:13px;margin:0 0 4px;color:#0b2a5b}
  .ss .g{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
  .ss .h{font-family:Sora;font-weight:800;font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:#475569;text-align:center}
  .ss .c{border:1.2px solid #e2e8f0;border-radius:6px;height:45px;padding:2px 4px;display:flex;flex-direction:column;gap:2px;background:#fff}
  .ss .c.e{border:0;background:none}
  .ss .c b{font-family:Sora;font-size:10.5px;color:#0f172a}
  .ss .c.pay{border-color:var(--k);background:#f8fafc}
  .ss .c i{font-style:normal;font-size:7.2px;font-weight:800;color:#fff;border-radius:3px;padding:1px 3px;line-height:1.25}
  .ss .note{margin-top:6px;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const key = (["W1", "W2", "W3", "E", "S"] as Kind[]).map((k) => `<span style="--k:${COLOR[k]}">${k === "S" ? "Supplemental Security Income (SSI)" : k === "E" ? "Benefits before May 1997, or Social Security plus SSI" : `Birthday ${LABEL[k].replace("Born ", "")}`}</span>`).join("");
  const page = `<section class="page ss"><h1>Social Security Payment Calendar, Oct.-Dec. 2026</h1>
    <p class="sub">Retirement, survivor and disability benefits are paid on a Wednesday set by your birthday · SSI on the 1st · every date from the Social Security Administration</p>
    <div class="key">${key}</div>
    ${[9, 10, 11].map(month).join("")}
    <p class="note">Source: Social Security Administration, Publication No. 05-10031, Schedule of Social Security Benefit Payments 2026. When a payment date falls on a weekend or federal holiday, SSA pays the business day before: Nov. 10 (Veterans Day is Wednesday, Nov. 11), Oct. 30 (November SSI) and Dec. 31 (January 2027 SSI and the Jan. 3 payment). Allow three more mailing days before contacting Social Security. Not affiliated with SSA.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

const W = 1200, H = 675;
/** Raised card in the hero: the next payday. Oct. 22 update moved it from Oct. 21 (index 1) to Oct. 28. */
const NEXT = 2;
function hero(fonts: string): string {
  const days = [["WED", "14", "Born 1st-10th", "#1d4ed8"], ["WED", "21", "Born 11th-20th", "#0f766e"], ["WED", "28", "Born 21st-31st", "#b45309"]];
  const cards = days.map(([w, d, l, c], i) => `<g transform="translate(${650 + i * 180},${i === NEXT ? 120 : 160})" filter="url(#sh)"><rect width="160" height="${i === NEXT ? 250 : 210}" rx="16" fill="#fff"/><rect width="160" height="46" rx="16" fill="${c}"/><rect y="30" width="160" height="16" fill="${c}"/><text x="80" y="31" font-family="Sora" font-size="17" font-weight="800" fill="#fff" text-anchor="middle">OCT. · ${w}</text><text x="80" y="${i === NEXT ? 160 : 135}" font-family="Sora" font-size="${i === NEXT ? 96 : 76}" font-weight="800" fill="#0b2a5b" text-anchor="middle">${d}</text><text x="80" y="${i === NEXT ? 218 : 182}" font-family="Manrope" font-size="15" font-weight="800" fill="${c}" text-anchor="middle">${l}</text>${i === NEXT ? `<rect x="40" y="-34" width="80" height="26" rx="13" fill="#facc15"/><text x="80" y="-16" font-family="Sora" font-size="14" font-weight="800" fill="#0b2a5b" text-anchor="middle">NEXT</text>` : ""}</g>`).join("");
  const check = `<g transform="translate(700,470) rotate(-4)" filter="url(#sh)"><rect width="420" height="120" rx="10" fill="#ecfdf5"/><rect width="420" height="120" rx="10" fill="none" stroke="#10b981" stroke-width="3" stroke-dasharray="2 0"/><text x="24" y="38" font-family="Sora" font-size="16" font-weight="800" fill="#065f46">DIRECT DEPOSIT</text><rect x="24" y="56" width="230" height="12" rx="6" fill="#a7f3d0"/><rect x="24" y="80" width="160" height="12" rx="6" fill="#a7f3d0"/><text x="396" y="96" font-family="Sora" font-size="36" font-weight="800" fill="#065f46" text-anchor="end">$</text></g>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}html,body{margin:0}body{width:${W}px;height:${H}px;overflow:hidden;background:#0b2a5b;font-family:Manrope,sans-serif;position:relative}
  .k{position:absolute;left:64px;top:84px;font-weight:800;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:#fde68a}
  .t{position:absolute;left:64px;top:118px;width:540px;font-family:Sora;font-weight:800;color:#fff;line-height:1.02;font-size:62px;letter-spacing:-.01em}
  .card{position:absolute;left:64px;top:430px;width:450px;border-radius:18px;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.28);padding:18px 22px;color:#0f172a}
  .card b{display:block;font-family:Sora;font-size:30px;line-height:1.05;margin:2px 0}.card span{font-size:15px;color:#475569;font-weight:700}
  .brand{position:absolute;right:28px;bottom:20px;font-size:13px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.78)}</style></head><body>
  <svg width="${W}" height="${H}" style="position:absolute;inset:0"><defs><filter id="sh"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b2a5b"/><stop offset="1" stop-color="#123c7a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>${cards}${check}</svg>
  <div class="k">Social Security · October 2026</div><div class="t">Who gets paid next</div>
  <div class="card"><span>Wednesday, Oct. 28</span><b>Birthdays 21st-31st</b><span>Then: Nov. 10 for the 1st-10th</span></div>
  <div class="brand">freshcalendars.com/news</div></body></html>`;
}

export async function buildSsaOct(): Promise<void> {
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
  await renderPrintables("social-security-2026", [{ slug: "social-security-payment-calendar-oct-dec-2026", size: LETTER, html: sheet(fonts) }]);
}
