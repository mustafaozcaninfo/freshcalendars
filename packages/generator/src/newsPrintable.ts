/**
 * Story printables for `pnpm fc news-assets`: one data block, four layouts, and rules that keep every
 * sheet a finished product rather than a table dump.
 *
 * Layouts (`layout:`; `auto` picks one from the rows):
 *   list       date | what | Done, the general case
 *   month      calendar grid(s) with numbered markers and a legend, when the rows are dated days
 *              inside one or two months (planning stories: "when to thaw", "early voting")
 *   timeline   vertical steps, for up to 12 ordered steps (countdowns, how-to schedules)
 *   checklist  grouped tick boxes, when rows carry `section:` (packing lists, what to bring)
 *
 * Rules enforced here (errors stop the build of the sheet; warnings print):
 *   - weekday check: "Sat., Nov. 21" must really be a Saturday in the sheet's year (error)
 *   - one page: content is measured in Chromium and scaled from 100% down to 80%; if it still
 *     overflows, the sheet fails and the rows must be cut or split (error)
 *   - the page is filled: short content is scaled up (to 130%) and a notes area takes the rest
 *   - at most 40 rows, a sources note, a year in the title, cells under 140 characters (warnings/errors)
 *   - `inkSaver` is retired (2026-11-03): one color sheet per story, no -ink copy
 *   - then the print checks in printCheck.ts (safe area, footer, fonts, type size, contrast) (error)
 */
import { LETTER, doc } from "./julian.js";
import { DOW3, MONTHS, daysIn } from "./printables.js";
import { icon } from "./art.js";

export type Row = [string, string] | { when: string; what: string; date?: string; section?: string };
export type Printable = {
  slug: string; group: string; title: string; subtitle?: string; columns?: [string, string]; rows: Row[]; note: string;
  description?: string; alt?: string; layout?: "auto" | "list" | "month" | "timeline" | "checklist";
  year?: number; weekStart?: "sunday" | "monday"; /** retired, ignored */ inkSaver?: boolean; notesLabel?: string;
};
type Item = { when: string; what: string; date?: Date; end?: Date; section?: string; n: number };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MON_RE = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?";
const DOW_RE = "(Sun|Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|Sat)[a-z]*\\.?";
const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAY_MS = 86_400_000;

/**
 * Every "Weekday, Mon. D" in a `when` text as dates in `year`, with the weekday each one claims.
 * "Oct. 22-24" adds Oct. 24; "Fri., Nov. 20 to Sat., Nov. 21" gives both ends. A weekday may also
 * follow the date: "Jan. 18, 2027 (Mon.)"; a pair after a range, "Feb. 15-19 (Mon. to Fri.)" or
 * "Mar. 3 to Mar. 4, 2027 (Wed.-Thu.)", names its first and last day.
 * Years: an explicit year after a day ("Sat., Jan. 2, 2027") wins and also dates the days before it
 * in the same text ("Jan. 11 to Jan. 15, 2027"); a day without one takes the year of the day before
 * it, plus one when it would fall earlier ("Dec. 28 to Jan. 1"), so a sheet can cross New Year.
 */
export function parseWhen(when: string, year: number): { date: Date; claimed?: number }[] {
  const trail = new RegExp(`^\\s*\\(${DOW_RE}(?:\\s*(?:to|-|\u2013)\\s*${DOW_RE})?\\)`);
  const dowIx = (s: string) => ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(s.slice(0, 3).toLowerCase());
  const re = new RegExp(`(?:${DOW_RE},?\\s+)?${MON_RE}\\s+(\\d{1,2})\\b(?:\\s*[-\u2013]\\s*(\\d{1,2})\\b(?!\\s*[ap]\\.?m))?(?:,\\s*(20\\d\\d)\\b)?`, "g");
  type Hit = { mon: number; day: number; end?: number; y?: number; claimed?: number; endClaimed?: number };
  const hits: Hit[] = [];
  for (const m of when.matchAll(re)) {
    const mon = MON.indexOf(m[2]!.slice(0, 3).toLowerCase());
    const rest = when.slice((m.index ?? 0) + m[0].length), after = trail.exec(rest);
    // "Jan. 15 (Fri.), 2027": the year may come after the weekday.
    const late = !m[5] && after ? /^,?\s*(20\d\d)\b/.exec(rest.slice(after[0].length))?.[1] : undefined;
    const h: Hit = { mon, day: Number(m[3]), end: m[4] ? Number(m[4]) : undefined, y: m[5] ? Number(m[5]) : late ? Number(late) : undefined, claimed: m[1] ? dowIx(m[1]) : undefined };
    if (after?.[2]) {
      // A pair names a range: this match's own range, or the range from the day before to this one.
      if (h.end !== undefined) { h.claimed ??= dowIx(after[1]!); h.endClaimed = dowIx(after[2]); }
      else { h.claimed ??= dowIx(after[2]); if (hits.length && hits[hits.length - 1]!.claimed === undefined) hits[hits.length - 1]!.claimed = dowIx(after[1]!); }
    } else if (after?.[1]) h.claimed ??= dowIx(after[1]);
    hits.push(h);
  }
  // Years: explicit ones date the days before them, then each undated day follows the one before it.
  for (let i = hits.length - 1, next: number | undefined, nextAt: Hit | undefined; i >= 0; i--) {
    const h = hits[i]!;
    if (h.y !== undefined) { next = h.y, nextAt = h; continue; }
    if (next !== undefined && nextAt) h.y = h.mon * 32 + h.day > nextAt.mon * 32 + nextAt.day ? next - 1 : next;
  }
  const out: { date: Date; claimed?: number }[] = [];
  let prev: Date | undefined;
  for (const h of hits) {
    let y = h.y ?? prev?.getUTCFullYear() ?? year;
    if (h.y === undefined && prev && Date.UTC(y, h.mon, h.day) < prev.getTime()) y++;
    const date = new Date(Date.UTC(y, h.mon, h.day));
    if (date.getUTCMonth() !== h.mon) continue;
    out.push({ date, claimed: h.claimed });
    prev = date;
    if (h.end !== undefined) out.push({ date: (prev = new Date(Date.UTC(y, h.mon, h.end))), claimed: h.endClaimed });
  }
  return out;
}

/** Normalizes rows, derives dates and ranges from the text and checks every weekday. */
export function items(p: Printable, fallbackYear: number): { list: Item[]; warnings: string[] } {
  const year = p.year ?? Number(/\b(20\d\d)\b/.exec(p.title)?.[1] ?? fallbackYear);
  const warnings: string[] = [];
  const errors: string[] = [];
  const list = p.rows.map((r, i): Item => {
    const o = Array.isArray(r) ? { when: r[0], what: r[1] } : r;
    const found = parseWhen(o.when, year);
    for (const f of found) {
      if (f.claimed !== undefined && f.date.getUTCDay() !== f.claimed) {
        errors.push(`row ${i + 1} "${o.when}": ${f.date.toISOString().slice(0, 10)} is a ${DOW3[f.date.getUTCDay()]}, not a ${DOW3[f.claimed]}`);
      }
    }
    let date = found[0]?.date, end = found.length > 1 ? found[found.length - 1]!.date : undefined;
    if (o.date) {
      const d = new Date(`${o.date}T00:00:00Z`);
      if (date && date.getTime() !== d.getTime()) errors.push(`row ${i + 1} "${o.when}" does not match date ${o.date}`);
      date = d;
    }
    if (end && date && end < date) end = undefined;
    if (o.what.length > 140) warnings.push(`row ${i + 1} is ${o.what.length} chars; keep cells under 140 so the sheet stays scannable`);
    return { when: o.when, what: o.what, date, end, section: "section" in o ? o.section : undefined, n: i + 1 };
  });
  if (errors.length) throw new Error(`printable ${p.slug}: dates do not check out\n  ${errors.join("\n  ")}`);
  if (list.length > 40) throw new Error(`printable ${p.slug}: ${list.length} rows; split it into two printables (max 40)`);
  if (!/\b20\d\d\b/.test(p.title)) warnings.push("put the year in the printable title");
  if (!/^sources?:/i.test(p.note.trim())) warnings.push('start the note with "Source:" or "Sources:"');
  return { list, warnings };
}

/** Every day an item covers (its range, or its one day). */
const days = (x: Item) => {
  if (!x.date) return [];
  const n = x.end ? Math.round((x.end.getTime() - x.date.getTime()) / DAY_MS) : 0;
  return Array.from({ length: n + 1 }, (_, k) => new Date(x.date!.getTime() + k * DAY_MS));
};

/**
 * The layout `auto` picks: checklist for sections; month when the rows are dated, fit in one or two
 * months and no day carries more than three markers (so the grid stays readable); timeline for up
 * to 12 ordered steps that do not overlap; list otherwise.
 */
export function chooseLayout(list: Item[]): "list" | "month" | "timeline" | "checklist" {
  if (list.some((x) => x.section)) return "checklist";
  const dated = list.filter((x) => x.date);
  const load = new Map<number, number>();
  for (const x of dated) for (const d of days(x)) load.set(d.getTime(), (load.get(d.getTime()) ?? 0) + 1);
  const peak = Math.max(0, ...load.values());
  if (dated.length >= 3 && dated.length >= list.length - 1 && months(dated).length <= 2 && peak <= 3) return "month";
  const ordered = dated.length === list.length && list.every((x, i) => i === 0 || x.date!.getTime() >= list[i - 1]!.date!.getTime());
  if (ordered && list.length <= 12 && peak <= 1) return "timeline";
  return "list";
}

const months = (xs: Item[]) => [...new Set(xs.flatMap((x) => days(x)).map((d) => d.getUTCFullYear() * 12 + d.getUTCMonth()))].sort((a, b) => a - b);

function monthGrid(ym: number, its: Item[], mondayStart: boolean): string {
  const y = Math.floor(ym / 12), m = ym % 12, first = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const lead = mondayStart ? (first + 6) % 7 : first;
  const heads = (mondayStart ? [...DOW3.slice(1), DOW3[0]!] : DOW3).map((d) => `<th>${d}</th>`).join("");
  const byDay = new Map<number, Item[]>();
  for (const it of its) for (const d of days(it)) if (d.getUTCFullYear() === y && d.getUTCMonth() === m) byDay.set(d.getUTCDate(), [...(byDay.get(d.getUTCDate()) ?? []), it]);
  let cells = "", rows = "";
  const total = Math.ceil((lead + daysIn(y, m)) / 7) * 7;
  for (let i = 0; i < total; i++) {
    const d = i - lead + 1, hit = byDay.get(d);
    cells += d < 1 || d > daysIn(y, m) ? `<td class="x"></td>`
      : `<td${hit ? ` class="hit"` : ""}><span class="dn">${d}</span>${hit ? `<span class="mk">${hit.map((h) => `<i>${h.n}</i>`).join("")}</span>` : ""}</td>`;
    if (i % 7 === 6) rows += `<tr>${cells}</tr>`, (cells = "");
  }
  return `<div class="cal"><h2>${MONTHS[m]} ${y}</h2><table class="grid"><thead><tr>${heads}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function body(layout: string, list: Item[], p: Printable): string {
  const box = `<span class="bx"></span>`;
  if (layout === "month") {
    const ms = months(list.filter((x) => x.date));
    const grids = ms.map((ym) => monthGrid(ym, list, p.weekStart === "monday")).join("");
    const legend = list.map((x) => `<li><i>${x.n}</i><b>${esc(x.when)}</b><span>${esc(x.what)}</span>${box}</li>`).join("");
    return `<div class="cals n${ms.length}">${grids}</div><ol class="legend">${legend}</ol>`;
  }
  if (layout === "timeline") {
    return `<ol class="tl">${list.map((x) => `<li><i>${x.n}</i><div><b>${esc(x.when)}</b><span>${esc(x.what)}</span></div>${box}</li>`).join("")}</ol>`;
  }
  if (layout === "checklist") {
    const groups = new Map<string, Item[]>();
    for (const x of list) groups.set(x.section ?? "Other", [...(groups.get(x.section ?? "Other") ?? []), x]);
    return `<div class="ck">${[...groups].map(([g, xs]) => `<section><h2>${esc(g)}</h2><ul>${xs.map((x) => `<li>${box}<span>${esc(x.what)}</span><em>${esc(x.when)}</em></li>`).join("")}</ul></section>`).join("")}</div>`;
  }
  const [c1, c2] = p.columns ?? ["Date", "What happens"];
  return `<table class="ls"><thead><tr><th>${esc(c1)}</th><th>${esc(c2)}</th><th>Done</th></tr></thead><tbody>${list.map((x) => `<tr><td class="d">${esc(x.when)}</td><td>${esc(x.what)}</td><td class="c">${box}</td></tr>`).join("")}</tbody></table>`;
}

/**
 * Fit script: `renderPrintables` awaits window.__fit() after fonts load. It shrinks the --s scale
 * until the content column fits the page and flags an overflow it could not fix; a short sheet grows
 * (up to 130%) until the notes area is under 40% of the page.
 */
export const FIT = `<script>window.__fit=()=>{const pg=document.querySelector('.page'),col=document.querySelector('.col');let s=1;
const over=()=>col.scrollHeight>col.clientHeight+1;while(over()&&s>0.8){s=Math.round((s-0.02)*100)/100;document.documentElement.style.setProperty('--s',s)}
if(over())document.body.dataset.overflow='1';const n=document.querySelector('.notes');
if(s===1&&n){while(n.clientHeight>col.clientHeight*0.4&&s<1.3){s=Math.round((s+0.02)*100)/100;document.documentElement.style.setProperty('--s',s);if(over()){s=Math.round((s-0.02)*100)/100;document.documentElement.style.setProperty('--s',s);break}}}if(n&&n.clientHeight<70)n.style.display='none';return s};</script>`;

/**
 * Ruled lines as real borders: Chromium turns a repeating-gradient background into a 72 dpi bitmap
 * in the PDF, which prints soft. The box clips the lines it has no room for.
 */
const NOTE_LINES = "<i></i>".repeat(36);

export function printableHtml(fonts: string, storySlug: string, color: string, p: Printable, fallbackYear: number, iconName: string): { html: string; layout: string; warnings: string[] } {
  const { list, warnings } = items(p, fallbackYear);
  const layout = !p.layout || p.layout === "auto" ? chooseLayout(list) : p.layout;
  const c = color, fill = c, fillText = "#fff";
  const cellH = layout === "month" ? (months(list.filter((x) => x.date)).length > 1 ? 52 : 64) : 60;
  const css = `
  :root{--s:1}
  .page{padding:40px 44px 46px}
  .col{position:absolute;inset:40px 44px 46px;display:flex;flex-direction:column}
  .hd{display:flex;gap:14px;align-items:center;padding-right:30px;border-bottom:3px solid ${c};padding-bottom:calc(10px*var(--s));margin-bottom:calc(14px*var(--s))}
  .hd h1{font-family:Sora;font-weight:800;font-size:calc(26px*var(--s));margin:0;color:${c};line-height:1.08;text-wrap:balance}
  .hd .sub{margin:4px 0 0;font-size:calc(11.5px*var(--s));color:#37474f}
  .bx{display:inline-block;flex:none;width:14px;height:14px;border:1.6px solid ${c};border-radius:3px;vertical-align:middle}
  table.ls{width:100%;border-collapse:collapse;font-size:calc(12px*var(--s))}
  .ls th{font-family:Sora;font-size:max(8px,calc(9.5px*var(--s)));text-transform:uppercase;letter-spacing:.08em;color:${c};text-align:left;padding:5px 8px;border-bottom:2px solid ${c}}
  .ls td{padding:calc(8px*var(--s)) 8px;border-bottom:1px solid #e2e8f0;vertical-align:top;line-height:1.35;color:#1f2937}
  .ls td.d{font-family:Sora;font-weight:800;color:#0f172a;width:34%}.ls td.c,.ls th:last-child{width:46px;text-align:center}
  .cals{display:grid;gap:16px}.cals.n2{grid-template-columns:1fr 1fr}
  .cal h2{font-family:Sora;font-size:calc(15px*var(--s));margin:0 0 6px;color:${c}}
  table.grid{width:100%;border-collapse:collapse;table-layout:fixed}
  .grid th{font-family:Sora;font-size:calc(9px*var(--s));color:#475569;text-transform:uppercase;padding:3px 0}
  .grid td{border:1px solid #cbd5e1;height:calc(${cellH}px*var(--s));vertical-align:top;padding:3px 4px;position:relative}
  .grid td.x{background:#f8fafc}
  .grid .dn{font-family:Sora;font-weight:700;font-size:calc(10.5px*var(--s));color:#334155}
  .grid td.hit{background:${c}14;border-color:${c}}
  .grid .mk{position:absolute;right:4px;bottom:4px;display:flex;gap:2px;flex-wrap:wrap;justify-content:flex-end}
  .mk i,.legend i,.tl i{font-style:normal;display:inline-grid;place-items:center;border-radius:50%;background:${fill};color:${fillText};border:1.6px solid ${c};font-family:Sora;font-weight:800}
  .mk i{width:calc(17px*var(--s));height:calc(17px*var(--s));font-size:calc(9.5px*var(--s))}
  .legend{list-style:none;margin:calc(14px*var(--s)) 0 0;padding:0;font-size:calc(11.5px*var(--s))}
  .legend li{display:flex;gap:10px;align-items:center;padding:calc(5px*var(--s)) 0;border-bottom:1px solid #e2e8f0}
  .legend i{flex:none;width:20px;height:20px;font-size:10.5px}.legend b{font-family:Sora;min-width:31%;color:#0f172a}.legend span:not(.bx){flex:1;color:#1f2937;line-height:1.35}
  .tl{list-style:none;margin:0;padding:0 0 0 4px;position:relative;font-size:calc(12.5px*var(--s))}
  .tl:before{content:"";position:absolute;left:17px;top:10px;bottom:10px;border-left:2.5px dashed ${c}66}
  .tl li{display:flex;gap:14px;align-items:flex-start;padding:calc(9px*var(--s)) 0;position:relative}
  .tl i{flex:none;width:28px;height:28px;font-size:12px;position:relative}
  .tl div{flex:1;line-height:1.35}.tl b{display:block;font-family:Sora;color:#0f172a;font-size:calc(13px*var(--s))}.tl span{color:#334155}
  .tl .bx{margin-top:6px}
  .ck{columns:2;column-gap:28px;font-size:calc(12px*var(--s))}
  .ck section{break-inside:avoid;margin-bottom:calc(12px*var(--s))}
  .ck h2{font-family:Sora;font-size:calc(12.5px*var(--s));text-transform:uppercase;letter-spacing:.06em;color:${c};margin:0 0 4px;border-bottom:1.5px solid ${c}55;padding-bottom:3px}
  .ck ul{list-style:none;margin:0;padding:0}.ck li{display:flex;gap:9px;align-items:flex-start;padding:calc(5px*var(--s)) 0;line-height:1.35}
  .ck li .bx{margin-top:1px}.ck li span:not(.bx){flex:1}.ck li em{font-style:normal;color:#64748b;font-size:.9em}
  .notes{flex:1;min-height:0;margin-top:calc(14px*var(--s));border:1.6px solid #e2e8f0;border-radius:10px;padding:10px 14px;overflow:hidden}
  .notes b{display:block;font-family:Sora;font-size:12.5px;color:${c};margin-bottom:2px}
  .notes i{display:block;height:28px;border-bottom:1px solid #e2e8f0}
  .src{margin:10px 0 0;font-size:8.8px;color:#5a6b75;line-height:1.45}`;
  const head = `<div class="hd">${icon(iconName, c)}<div><h1>${esc(p.title)}</h1>${p.subtitle ? `<p class="sub">${esc(p.subtitle)}</p>` : ""}</div></div>`;
  const page = `<section class="page"><div class="col">${head}${body(layout, list, p)}
    <div class="notes"><b>${esc(p.notesLabel ?? "My notes")}</b>${NOTE_LINES}</div><p class="src">${esc(p.note)}</p></div>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/${storySlug}/</div></section>`;
  return { html: doc(fonts, LETTER, css, [page]).replace("</body>", `${FIT}</body>`), layout, warnings };
}
