/**
 * Building blocks shared by every kit: page frame, themed header with its motif, stat tiles, key,
 * "not yet confirmed" box, fill-in lines, notes area, source note and footer.
 *
 * Sizes are written as calc(<px> * var(--s)) so the fit script (PAGINATE below) can scale the sheet
 * between 90% and 130%; content that still does not fit continues on more pages instead of failing. Lines and boxes are borders and plain SVG, never repeated glyphs
 * ("____") or gradients, so they print as vectors. The page keeps the .page / .col / .notes / .foot
 * structure that printCheck.ts and the fit script expect.
 */
import { icon } from "../art.js";
import { LETTER, LETTER_LANDSCAPE, doc } from "../julian.js";
import { esc, type Size, type Unconfirmed } from "./kit.js";
import type { Theme } from "./themes.js";

const A4 = { width: 794, height: 1123 }, A4_LANDSCAPE = { width: 1123, height: 794 };
/** Page size for a kit: US Letter by default, A4 for the extra -a4 file of uk-canada stories. */
export const sizeOf = (landscape: boolean, paper: "letter" | "a4" = "letter"): Size =>
  paper === "a4" ? (landscape ? A4_LANDSCAPE : A4) : landscape ? LETTER_LANDSCAPE : LETTER;

export function baseCss(t: Theme, landscape: boolean): string {
  const pad = landscape ? "34px 40px 44px" : "38px 42px 46px";
  return `
  :root{--s:1}
  .page{padding:${pad};color:${t.ink}}
  .col{position:absolute;inset:${pad};display:flex;flex-direction:column}
  .col>*{flex-shrink:0}.col>.notes{flex-shrink:1}
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
  .foot{color:${t.muted}}
  .hd2{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:2px solid ${t.primary};padding:0 0 6px;margin-bottom:10px}
  .hd2 b{font-family:Sora;font-weight:800;font-size:14px;color:${t.primary}}.hd2 span{font-size:9.5px;color:${t.muted};white-space:nowrap}`;
}

export const header = (t: Theme, title: string, subtitle?: string, badge?: string) =>
  `<div class="hd">${icon(t.icon, t.primary)}<div class="tx"><h1>${esc(title)}</h1>${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ""}</div>${badge ? `<div class="badge">${badge}</div>` : `<svg class="motif" viewBox="0 0 200 60" aria-hidden="true">${t.motif(t)}</svg>`}</div>`;

export const tiles = (items: [string, string][], cols = items.length) =>
  `<div class="tiles blk" style="grid-template-columns:repeat(${cols},1fr)">${items.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join("")}</div>`;

export const unconfirmedBox = (items: Unconfirmed[], title = "Not yet confirmed") =>
  items.length ? `<div class="box un"><h3>${esc(title)}</h3><ul>${items.map((u) => `<li><b>${esc(u.label)}:</b> ${esc(u.why)}</li>`).join("")}</ul></div>` : "";

export const fillLines = (title: string, labels: string[]) =>
  `<div class="box fill"><h3>${esc(title)}</h3>${labels.map((x) => `<p><span>${esc(x)}</span><i></i></p>`).join("")}</div>`;

/** The flexible notes area the fit script grows into; ruled lines are borders (vector). */
export const notes = (label = "My notes") => `<div class="notes"><b>${esc(label)}</b>${"<i></i>".repeat(30)}</div>`;

/**
 * Fit and paginate. Blocks marked .blk (direct children of .col, or of a .flow container such as the
 * month grid) are the units that may move; a .blk with data-split is a table that may break between
 * rows, its heading and column heads repeated with "(continued)". The sheet first shrinks to 90%;
 * if it still overflows, it goes back to 100% and blocks move, last first, to new pages (each with a
 * short "Title, continued" header and the footer), up to MAX_PAGES (6). A single page that fits grows up
 * to 130% like the classic layouts. The notes area and the source note end up on the last page.
 */
const PAGINATE = `<script>window.__fit=()=>{
const MAX_PAGES=6,root=document.documentElement,first=document.querySelector('.page');
const set=(v)=>root.style.setProperty('--s',v);const col=(pg)=>pg.querySelector('.col');
const over=(pg)=>{const c=col(pg);return c.scrollHeight>c.clientHeight+1};
let s=1;while(over(first)&&s>0.9){s=Math.round((s-0.02)*100)/100;set(s)}
const notes=first.querySelector('.notes');
if(!over(first)){if(s===1&&notes){while(notes.clientHeight>col(first).clientHeight*0.4&&s<1.3){s=Math.round((s+0.02)*100)/100;set(s);if(over(first)){s=Math.round((s-0.02)*100)/100;set(s);break}}}
  if(notes&&notes.clientHeight<70)notes.style.display='none';return s}
s=1;set(1);
let id=0;document.querySelectorAll('.blk,.flow').forEach((e)=>e.dataset.k=String(id++));
const title=first.querySelector('h1')?.textContent??'';const pages=[first];
const newPage=()=>{const pg=first.cloneNode(true),c=col(pg);c.innerHTML='<div class="hd2"><b></b><span></span></div>';
  c.querySelector('b').textContent=title+', continued';pages[pages.length-1].after(pg);pages.push(pg);return pg};
/** Puts el at the top of page pg's content, inside a copy of its .flow container when it has one. */
const prepend=(pg,el,flowOf)=>{const c=col(pg),hd=c.querySelector('.hd2');
  if(!flowOf){hd.after(el);return}
  let f=hd.nextElementSibling;if(!f||f.dataset.k!==flowOf.dataset.k){f=flowOf.cloneNode(false);hd.after(f)}f.prepend(el)};
const movable=(pg)=>[...col(pg).querySelectorAll('.blk')].filter((e)=>!e.closest('.hd2'));
let guard=0;
for(let i=0;i<pages.length&&guard<4000;i++){const pg=pages[i];
  while(over(pg)&&guard++<4000){const blks=movable(pg);
    if(blks.length<=(i===0?0:1)&&!(blks[0]&&blks[0].hasAttribute('data-split')&&blks[0].querySelectorAll('tbody tr').length>1)){document.body.dataset.overflow='1';return s}
    if(pages.length===i+1){if(pages.length>=MAX_PAGES){document.body.dataset.overflow='1';return s}newPage()}
    const next=pages[i+1],b=blks[blks.length-1],flow=b.parentElement.classList.contains('flow')?b.parentElement:null;
    const rows=b.hasAttribute('data-split')?b.querySelectorAll('tbody tr'):[];
    if(rows.length>1){const hd=col(next).querySelector('.hd2');let cont=hd.nextElementSibling;
      if(!cont||cont.dataset.cont!==b.dataset.k){cont=b.cloneNode(true);cont.dataset.cont=b.dataset.k;cont.dataset.k='c'+(id++);cont.querySelector('tbody').innerHTML='';
        const h=cont.querySelector('h2');if(h)h.textContent+=' (continued)';prepend(next,cont,flow)}
      cont.querySelector('tbody').prepend(rows[rows.length-1])}
    else{const hd=col(next).querySelector('.hd2'),cont=hd.nextElementSibling;
      if(cont&&cont.dataset.cont===b.dataset.k){cont.querySelector('tbody').prepend(...b.querySelectorAll('tbody tr'));const h=cont.querySelector('h2'),h0=b.querySelector('h2');if(h&&h0)h.textContent=h0.textContent;cont.dataset.k=b.dataset.k;delete cont.dataset.cont;b.remove()}
      else prepend(next,b,flow)}
    if(flow&&!flow.children.length)flow.remove()}}
const last=pages[pages.length-1],src=document.querySelector('.src');
if(notes){const ls=col(last).querySelector('.src');if(ls)ls.before(notes);else col(last).append(notes)}
if(src&&!col(last).contains(src)){col(last).append(src)}
for(let i=pages.length-1;i>=0;i--)if(over(pages[i])&&i===pages.length-1&&notes){notes.style.display='none'}
pages.forEach((pg,i)=>{const sp=pg.querySelector('.hd2 span');if(sp)sp.textContent='page '+(i+1)+' of '+pages.length});
if(pages.some(over))document.body.dataset.overflow='1';
if(notes&&notes.style.display!=='none'&&notes.clientHeight<70)notes.style.display='none';
return s};</script>`;

export function page(ctx: { fonts: string; storySlug: string }, size: Size, css: string, body: string, note: string): string {
  const html = `<section class="page"><div class="col">${body}<p class="src blk">${esc(note)}</p></div>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${ctx.storySlug}/</div></section>`;
  return doc(ctx.fonts, size, css, [html]).replace("</body>", `${PAGINATE}</body>`);
}
