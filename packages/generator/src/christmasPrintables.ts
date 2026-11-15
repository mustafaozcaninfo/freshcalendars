/**
 * Christmas 2026 printables for /news/ (christmas-printables-2026-gift-tags-wish-list-letter-to-santa).
 * Three US Letter PDFs: 12 cut-out gift tags a page, a ranked Christmas wish list and a letter to
 * Santa template with the USPS and Canada Post addresses and mailing dates in a footer box.
 * No kit draws cut-out tags, a ranked list or a letter template, so this story owns its generator.
 * Usage: pnpm fc news-christmas-printables
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

const SLUG = "christmas-printables-2026-gift-tags-wish-list-letter-to-santa";
const DATE_LINE = "Christmas 2026 · Fri., Dec. 25, 2026";
const FOOT = `<div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${SLUG}/</div>`;

/** A small vector ornament: cap, ball and a sparkle, drawn with plain shapes. */
const ORNAMENT = (size: number) => `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
  <rect x="16" y="2" width="8" height="6" rx="1.5" fill="#92400e"/>
  <circle cx="20" cy="24" r="14" fill="#b91c1c"/>
  <path d="M8 22 Q20 28 32 22" fill="none" stroke="#fef3c7" stroke-width="2.2"/>
  <polygon points="20,15 21.6,19 26,19.4 22.6,22.2 23.7,26.5 20,24.2 16.3,26.5 17.4,22.2 14,19.4 18.4,19" fill="#fef3c7"/>
</svg>`;

const BASE_CSS = `
  .tp{padding:26px 36px 0}
  .tp header{border-bottom:4px solid #166534;padding-bottom:6px;margin-bottom:10px}
  .tp h1{font-family:Sora;font-weight:800;font-size:23px;margin:0;color:#14532d;line-height:1.1}
  .tp .sub{margin:4px 0 0;font-size:11px;color:#37474f}
  .tp .note{position:absolute;left:36px;right:36px;bottom:36px;font-size:8.6px;color:#5a6b75;line-height:1.4}
  .tp .ln{border-bottom:1.5px solid #334155;height:22px}`;

function giftTags(fonts: string): string {
  const css = `${BASE_CSS}
  .gt{display:grid;grid-template-columns:repeat(3,240px);grid-template-rows:repeat(4,200px);margin-left:0}
  .gt .tag{border:1px dashed #64748b;position:relative;padding:10px 16px 0;display:flex;flex-direction:column}
  .gt .top{display:flex;align-items:center;justify-content:space-between}
  .gt .hole{width:14px;height:14px;border:1.5px solid #64748b;border-radius:50%}
  .gt .fl{display:flex;align-items:flex-end;gap:6px;font-family:Sora;font-weight:700;font-size:12px;color:#14532d;margin-top:16px}
  .gt .fl s{flex:1;border-bottom:1.5px solid #334155;height:16px;text-decoration:none}
  .gt .dt{font-family:Sora;font-weight:700;font-size:8.6px;color:#991b1b;margin-top:auto;padding-bottom:10px;letter-spacing:.02em}`;
  const tag = `<div class="tag"><div class="top"><div class="hole"></div>${ORNAMENT(34)}</div><div class="fl">To: <s></s></div><div class="fl">From: <s></s></div><div class="dt">Christmas 2026 · Fri., Dec. 25, 2026</div></div>`;
  const page = `<section class="page tp"><header><h1>Christmas Gift Tags 2026</h1><p class="sub">12 tags a page: cut on the dashed lines, punch the hole, write To and From, and tie one on each gift</p></header>
    <div class="gt">${tag.repeat(12)}</div>
    <p class="note">Print at 100% on US Letter. Christmas Day 2026 is Friday, Dec. 25. Mail gifts with tags by the U.S. Postal Service dates on its 2026 holiday shipping page: Priority Mail Fri., Dec. 18 in the contiguous U.S.</p>
    ${FOOT}</section>`;
  return doc(fonts, LETTER, css, [page]);
}

function wishList(fonts: string): string {
  const css = `${BASE_CSS}
  .wl .nm{display:flex;align-items:flex-end;gap:8px;font-family:Sora;font-weight:700;font-size:14px;color:#14532d;margin:12px 0 14px}
  .wl .nm s{flex:1;border-bottom:1.5px solid #334155;height:20px;text-decoration:none}
  .wl .hd{display:flex;justify-content:space-between;align-items:center}
  .wl .row{display:flex;align-items:flex-end;gap:12px;height:64px}
  .wl .n{font-family:Sora;font-weight:800;font-size:22px;color:#991b1b;width:40px;text-align:right}
  .wl .row s{flex:1;border-bottom:1.5px solid #334155;height:30px;text-decoration:none}
  .wl .row i{width:16px;height:16px;border:1.5px solid #334155;border-radius:3px;display:inline-block;margin-bottom:4px}
  .wl .tip{font-size:11px;color:#1e293b;margin:10px 0 0;line-height:1.5}`;
  const rows = Array.from({ length: 10 }, (_, i) => `<div class="row"><span class="n">${i + 1}</span><s></s><i></i></div>`).join("");
  const page = `<section class="page tp wl"><header><div class="hd"><h1>Christmas Wish List 2026</h1>${ORNAMENT(40)}</div><p class="sub">List gifts in order of preference, with number 1 first. Tick the box when a gift is wrapped or ordered.</p></header>
    <div class="nm">Name <s></s></div>
    ${rows}
    <p class="tip">Tip from USPS Operation Santa: be specific about each gift and keep the requests to gifts that are not too expensive.</p>
    <p class="note">Source: U.S. Postal Service (USPS) Operation Santa, "How to Write a Letter to Santa and Where to Send It". ${DATE_LINE}.</p>
    ${FOOT}</section>`;
  return doc(fonts, LETTER, css, [page]);
}

function santaLetter(fonts: string): string {
  const css = `${BASE_CSS}
  .sl .hd{display:flex;justify-content:space-between;align-items:center}
  .sl .box{border:1.5px solid #334155;border-radius:6px;padding:6px 10px;font-size:10px;color:#334155}
  .sl .box b{font-family:Sora;font-size:10px;color:#14532d;display:block;margin-bottom:2px}
  .sl .box .ln{height:19px}
  .sl .dear{font-family:Sora;font-weight:800;font-size:18px;color:#14532d;margin:12px 0 0}
  .sl .body .ln{height:30px}
  .sl .pr{font-size:10.5px;margin:8px 0 0;color:#334155;font-weight:700}
  .sl .love{display:flex;align-items:flex-end;gap:8px;font-family:Sora;font-weight:700;font-size:12px;color:#14532d;margin-top:10px}
  .sl .love s{width:240px;border-bottom:1.5px solid #334155;height:18px;text-decoration:none}
  .sl .send{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
  .sl .send .box{background:#f0fdf4;border-color:#166534;font-size:10.5px;line-height:1.45;color:#1e293b}
  .sl .send h2{font-family:Sora;font-size:11px;margin:0 0 3px;color:#14532d}
  .sl .send p{margin:0 0 3px}
  .sl .addr{font-family:Sora;font-weight:700;font-size:11px;line-height:1.35;color:#991b1b}`;
  const lines = (n: number) => '<div class="ln"></div>'.repeat(n);
  const page = `<section class="page tp sl"><header><div class="hd"><h1>Letter to Santa Template 2026</h1>${ORNAMENT(40)}</div><p class="sub">Write your letter, fill in the return address, then copy the Santa address onto the envelope</p></header>
    <div class="box"><b>My name and full return address (top-left corner of the envelope)</b>${lines(1)}${lines(1)}${lines(1)}</div>
    <p class="dear">Dear Santa,</p>
    <p class="pr">This year I was good at:</p><div class="body">${lines(3)}</div>
    <p class="pr">Thank you, Santa, for:</p><div class="body">${lines(3)}</div>
    <p class="pr">Something I would like to ask you:</p><div class="body">${lines(3)}</div>
    <p class="pr">Gifts I would like, in order of preference:</p>
    <div class="body">${lines(3)}</div>
    <div class="love">Love, <s></s></div>
    <div class="send">
      <div class="box"><h2>Sending from the United States (USPS)</h2><div class="addr">Santa<br>123 Elf Road<br>North Pole, 88888</div><p>Add a First-Class stamp in the top-right corner. Letters must be postmarked by Sat., Dec. 5, 2026.</p></div>
      <div class="box"><h2>Sending from Canada (Canada Post)</h2><div class="addr">Santa Claus<br>North Pole<br>H0H 0H0<br>Canada</div><p>No stamp needed within Canada. Mail by Dec. 9, 2026, with your return address.</p></div>
    </div>
    <p class="note">Source: U.S. Postal Service (USPS) Operation Santa, FAQs and "How to Write a Letter to Santa"; Canada Post, Santa letter program. UK readers: check Royal Mail for its address and date.</p>
    ${FOOT}</section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildChristmasPrintablesDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("christmas-printables-2026", [
    { slug: "christmas-gift-tags-2026", size: LETTER, html: giftTags(fonts) },
    { slug: "christmas-wish-list-2026", size: LETTER, html: wishList(fonts) },
    { slug: "letter-to-santa-template-2026", size: LETTER, html: santaLetter(fonts) },
  ]);
}
