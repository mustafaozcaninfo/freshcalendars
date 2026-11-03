/**
 * Building blocks shared by every kit: page frame, themed header with its motif, stat tiles, key,
 * "not yet confirmed" box, fill-in lines, notes area, source note and footer.
 *
 * Sizes are written as calc(<px> * var(--s)) so the fit script (FIT in newsPrintable.ts) can scale
 * the sheet between 80% and 130%. Lines and boxes are borders and plain SVG, never repeated glyphs
 * ("____") or gradients, so they print as vectors. The page keeps the .page / .col / .notes / .foot
 * structure that printCheck.ts and the fit script expect.
 */
import { icon } from "../art.js";
import { LETTER, LETTER_LANDSCAPE, doc } from "../julian.js";
import { FIT } from "../newsPrintable.js";
import { esc, type Size, type Unconfirmed } from "./kit.js";
import type { Theme } from "./themes.js";

export const sizeOf = (landscape: boolean): Size => (landscape ? LETTER_LANDSCAPE : LETTER);

export function baseCss(t: Theme, landscape: boolean): string {
  const pad = landscape ? "34px 40px 44px" : "38px 42px 46px";
  return `
  :root{--s:1}
  .page{padding:${pad};color:${t.ink}}
  .col{position:absolute;inset:${pad};display:flex;flex-direction:column}
  .hd{display:flex;gap:12px;align-items:center;border-bottom:3px solid ${t.primary};padding:0 0 calc(8px*var(--s));margin-bottom:calc(10px*var(--s));position:relative}
  .hd .tx{flex:1;min-width:0;padding-right:8px}
  .hd h1{font-family:Sora;font-weight:800;font-size:calc(${landscape ? 24 : 25}px*var(--s));margin:0;color:${t.primary};line-height:1.08;text-wrap:balance}
  .hd .sub{margin:4px 0 0;font-size:calc(10.5px*var(--s));color:${t.muted};line-height:1.35}
  .hd .motif{flex:none;width:170px;height:52px;margin-top:14px}
  .hd .badge{flex:none;font-family:Sora;font-weight:800;font-size:calc(11px*var(--s));color:#fff;background:${t.primary};border-radius:8px;padding:7px 10px;text-align:center;line-height:1.25;margin-top:14px}
  h2.sec{font-family:Sora;font-size:calc(11px*var(--s));text-transform:uppercase;letter-spacing:.08em;color:${t.primary};margin:calc(10px*var(--s)) 0 calc(5px*var(--s))}
  .tiles{display:grid;gap:8px;margin-bottom:calc(10px*var(--s))}
  .tiles div{border:1.6px solid ${t.primary};border-radius:8px;padding:calc(5px*var(--s)) 9px;display:flex;gap:8px;align-items:center;background:${t.soft}}
  .tiles b{font-family:Sora;font-size:calc(20px*var(--s));color:${t.primary};line-height:1}
  .tiles span{font-size:calc(9.5px*var(--s));line-height:1.25;color:${t.ink}}
  .bx{display:inline-block;flex:none;width:13px;height:13px;border:1.6px solid ${t.primary};border-radius:3px;vertical-align:middle;background:#fff}
  .box{border:1.4px solid ${t.line};border-radius:8px;padding:calc(7px*var(--s)) 10px}
  .box h3{font-family:Sora;font-size:calc(10.5px*var(--s));margin:0 0 4px;color:${t.primary}}
  .box ul{list-style:none;margin:0;padding:0;font-size:calc(9.5px*var(--s));line-height:1.35}
  .box li{margin:0 0 3px}
  .un{border-color:${t.accent};border-style:dashed}
  .un h3{color:${t.ink}}
  .fill p{display:flex;gap:8px;align-items:flex-end;margin:calc(7px*var(--s)) 0 0;font-size:calc(9.5px*var(--s))}
  .fill p i{flex:1;border-bottom:1px solid ${t.muted};height:12px}
  .notes{flex:1;min-height:0;margin-top:calc(10px*var(--s));border:1.4px solid ${t.line};border-radius:10px;padding:8px 12px;overflow:hidden}
  .notes b{display:block;font-family:Sora;font-size:11.5px;color:${t.primary};margin-bottom:2px}
  .notes i{display:block;height:26px;border-bottom:1px solid ${t.line}}
  .src{margin:8px 0 0;font-size:8.6px;color:${t.muted};line-height:1.45}
  .foot{color:${t.muted}}`;
}

export const header = (t: Theme, title: string, subtitle?: string, badge?: string) =>
  `<div class="hd">${icon(t.icon, t.primary)}<div class="tx"><h1>${esc(title)}</h1>${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ""}</div>${badge ? `<div class="badge">${badge}</div>` : `<svg class="motif" viewBox="0 0 200 60" aria-hidden="true">${t.motif(t)}</svg>`}</div>`;

export const tiles = (items: [string, string][], cols = items.length) =>
  `<div class="tiles" style="grid-template-columns:repeat(${cols},1fr)">${items.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join("")}</div>`;

export const unconfirmedBox = (items: Unconfirmed[], title = "Not yet confirmed") =>
  items.length ? `<div class="box un"><h3>${esc(title)}</h3><ul>${items.map((u) => `<li><b>${esc(u.label)}:</b> ${esc(u.why)}</li>`).join("")}</ul></div>` : "";

export const fillLines = (title: string, labels: string[]) =>
  `<div class="box fill"><h3>${esc(title)}</h3>${labels.map((x) => `<p><span>${esc(x)}</span><i></i></p>`).join("")}</div>`;

/** The flexible notes area the fit script grows into; ruled lines are borders (vector). */
export const notes = (label = "My notes") => `<div class="notes"><b>${esc(label)}</b>${"<i></i>".repeat(30)}</div>`;

export function page(ctx: { fonts: string; storySlug: string }, size: Size, css: string, body: string, note: string): string {
  const html = `<section class="page"><div class="col">${body}<p class="src">${esc(note)}</p></div>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${ctx.storySlug}/</div></section>`;
  return doc(ctx.fonts, size, css, [html]).replace("</body>", `${FIT}</body>`);
}
