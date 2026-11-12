/**
 * Social share card (1200×630) for a calendar-site page: the page title in the site's own fonts
 * and, on the right, a sheet that shows what the page is about — the month grid with the holiday
 * marked, the year, or a plain calendar. The old card used system fonts, cut its subtitle mid-word
 * and clipped the year, and was drawn once and never again when a title changed.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildMonthGrid, holidayDefBySlug, monthNumberToName, resolveHoliday, type SeoMeta } from "@freshcalendars/engine";
import { esc } from "@freshcalendars/site-chrome";
import { ROOT } from "./paths.js";

let fontCss: string | null = null;
function fonts(): string {
  if (fontCss) return fontCss;
  const dir = path.join(ROOT, "packages/generator/node_modules/@fontsource");
  const face = (name: string, pkg: string, weight: number) =>
    `@font-face{font-family:'${name}';font-weight:${weight};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(dir, pkg, "files", `${pkg}-latin-${weight}-normal.woff2`)).toString("base64")})}`;
  fontCss = [face("Sora", "sora", 700), face("Sora", "sora", 600), face("Manrope", "manrope", 400), face("Manrope", "manrope", 600)].join("");
  return fontCss;
}

/** Whole words only, with an ellipsis when something was dropped. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:·.-]+$/, "")}…`;
}

function monthSheet(year: number, month: number, markDay?: number): string {
  const grid = buildMonthGrid({ year, month });
  const cells = grid.weeks.flat().map((c) => `<span${c && c.day === markDay ? ' class="on"' : ""}>${c?.day ?? ""}</span>`).join("");
  return `<div class="sheet month"><b>${monthNumberToName(month)} <i>${year}</i></b><div class="wd">${["S", "M", "T", "W", "T", "F", "S"].map((d) => `<em>${d}</em>`).join("")}</div><div class="days">${cells}</div></div>`;
}

function yearSheet(year: number): string {
  const minis = Array.from({ length: 12 }, (_, i) => {
    const cells = buildMonthGrid({ year, month: i + 1 }).weeks.flat().map((c) => `<u${c ? "" : ' class="x"'}></u>`).join("");
    return `<div><em>${monthNumberToName(i + 1).slice(0, 3)}</em><div class="dots">${cells}</div></div>`;
  }).join("");
  return `<div class="sheet year"><b>${year}</b><div class="minis">${minis}</div></div>`;
}

function plainSheet(label: string): string {
  const cells = Array.from({ length: 35 }, (_, i) => `<span${i === 16 ? ' class="on"' : ""}></span>`).join("");
  return `<div class="sheet month plain"><b>${esc(label)}</b><div class="days">${cells}</div></div>`;
}

const LABELS: Record<string, string> = { home: "Calendars", blank: "Blank calendar", holidays: "Holidays", legal: "Fresh Calendars", guide: "Guide" };

export function ogCardHtml(meta: SeoMeta, today: Date = new Date()): string {
  const title = clip(meta.title.split("|")[0]!.trim(), 78);
  const sub = clip(meta.description, 100);
  const { family, year, month } = meta.calendar;
  let sheet: string;
  const holidaySlug = /^(?:holiday|days-until)-(.+)$/.exec(meta.pageId)?.[1];
  if (holidaySlug && year) {
    const def = holidayDefBySlug(holidaySlug);
    const h = def ? resolveHoliday(def, year) : null;
    sheet = h ? monthSheet(h.year, h.month, h.day) : plainSheet("Holidays");
  } else if (family === "monthly" && year && month) sheet = monthSheet(year, month);
  else if (family === "yearly" && year) sheet = yearSheet(year);
  else if (family === "home") sheet = monthSheet(today.getFullYear(), today.getMonth() + 1);
  else if (family === "holidays" && year) sheet = yearSheet(year);
  else sheet = plainSheet(LABELS[family] ?? "Calendar");
  const size = title.length <= 26 ? 76 : title.length <= 40 ? 64 : title.length <= 56 ? 54 : 46;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${fonts()}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;display:flex;background:#f6f7f4;color:#0d1512;font-family:Manrope,sans-serif;overflow:hidden}
.copy{flex:1;min-width:0;padding:60px 20px 56px 68px;display:flex;flex-direction:column}
.brand{font:700 30px Sora,sans-serif;letter-spacing:-.045em}.brand span{color:#2f6f4a}
h1{font:700 ${size}px/1.1 Sora,sans-serif;letter-spacing:-.04em;margin-top:44px;max-width:15.5em;text-wrap:balance}
.sub{font-size:25px;line-height:1.42;color:#56625c;margin-top:22px;max-width:25em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.foot{margin-top:auto;display:flex;align-items:center;gap:14px;font:600 21px Manrope,sans-serif;color:#2f6f4a}
.foot i{font-style:normal;color:#56625c;font-weight:400}.foot b{width:5px;height:5px;border-radius:50%;background:#b9c2bc}
.side{width:438px;display:flex;align-items:center;justify-content:center;background:#e6eee8;border-left:1px solid #d5dfd8}
.sheet{width:330px;background:#fff;border-radius:16px;padding:26px 26px 24px;box-shadow:0 1px 2px rgba(13,21,18,.08),0 24px 48px -14px rgba(13,21,18,.28);transform:rotate(-2.5deg)}
.sheet>b{display:block;font:700 27px Sora,sans-serif;letter-spacing:-.035em;padding-bottom:14px;border-bottom:2px solid #0d1512}
.sheet>b i{font-style:normal;color:#2f6f4a}
.wd,.days{display:grid;grid-template-columns:repeat(7,1fr);text-align:center}
.wd{margin-top:12px}.wd em{font:600 13px Manrope,sans-serif;font-style:normal;color:#8a958f}
.days{row-gap:5px;margin-top:6px}
.days span{height:33px;display:grid;place-items:center;font:600 16px Manrope,sans-serif;color:#26302b}
.days .on{background:#2f6f4a;color:#fff;border-radius:50%;width:33px;justify-self:center}
.plain .days{gap:7px;margin-top:16px}.plain .days span{height:30px;border-radius:6px;background:#eef2ef}.plain .days .on{width:auto;justify-self:stretch;border-radius:6px}
.year>b{font-size:60px;text-align:center;border:0;padding-bottom:6px;color:#2f6f4a}
.minis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 16px}
.minis em{display:block;font:600 12px Manrope,sans-serif;font-style:normal;color:#56625c;margin-bottom:4px}
.dots{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.dots u{aspect-ratio:1;border-radius:2px;background:#c9d4cd}.dots .x{background:none}
</style></head><body><div class="copy"><div class="brand"><span>fresh</span>calendars</div><h1>${esc(title)}</h1><p class="sub">${esc(sub)}</p><div class="foot">freshcalendars.com<b></b><i>Free PDF and PNG, no sign-up</i></div></div><div class="side">${sheet}</div></body></html>`;
}

/** Fingerprint of a card; the image is redrawn only when this changes. */
export function ogCardHash(html: string): string {
  return crypto.createHash("sha1").update(html).digest("hex").slice(0, 16);
}
