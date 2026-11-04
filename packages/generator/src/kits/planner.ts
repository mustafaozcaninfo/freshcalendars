/**
 * planner kit: a blank planner or tracker built from sections the reader fills in (a debt payoff
 * tracker, a weekly menu and grocery list, a monthly home checklist, a year-goal worksheet).
 * Sections, chosen by `type`:
 *
 *   table       blank columns and a set of blank rows         columns: ["Debt", "Balance"], rows: 6, totals?
 *   checklist   tick boxes grouped under subheadings          groups: [{ title, items: ["..."] }]
 *   month-grid  one box per month, the month-end date         months: ["2027-01", …], mark?: "month-end"
 *               computed when mark is set
 *   week        a 7-day grid with labeled rows                rows: ["Breakfast", "Lunch", "Dinner"]
 *   lines       labeled write-in lines                        labels: ["My 2027 goal", "Why it matters"]
 *
 * The planner's own column names, tick items and row labels are our wording, not facts. Anything
 * stated as a fact goes in the optional `facts` or `rules` box, where every line names its source
 * (storage limits, safety rules). Portrait by default; `landscape: true` turns the page.
 *
 * data:
 *   sections:
 *     - { type: table, title: "Your debts", columns: ["Debt", "Balance", "APR", "Minimum", "Order"], rows: 6 }
 *     - { type: week, title: "Weekly menu", rows: ["Breakfast", "Lunch", "Dinner", "Snack"] }
 *     - { type: month-grid, title: "Monthly check-ins", months: ["2027-01", "2027-02"], mark: month-end }
 *   rules:
 *     - { text: "Raw ground meat keeps 1 to 2 days in the refrigerator.", src: 1, quote: "Raw ground meat … 1 to 2 days" }
 *   unconfirmed: [{ label: "…", why: "…" }]
 */
import { baseCss, fillLines, header, notes, page, sizeOf, unconfirmedBox } from "./components.js";
import { DOW, MONTHS, Problems, dayLabel, esc, isObj, needQuote, needSource, str, unconfirmedList, type Kit, type KitContext, type Unconfirmed } from "./kit.js";

type Table = { type: "table"; title: string; columns: string[]; rows: number; totals: boolean };
type Checklist = { type: "checklist"; title: string; groups: { title: string; items: string[] }[] };
type MonthGrid = { type: "month-grid"; title: string; months: [number, number][]; mark: "month-end" | "none" };
type Week = { type: "week"; title: string; rows: string[] };
type Lines = { type: "lines"; title: string; labels: string[] };
type Section = Table | Checklist | MonthGrid | Week | Lines;
type Sourced = { text: string };
export type Planner = { sections: Section[]; facts: Sourced[]; rules: Sourced[]; unconfirmed: Unconfirmed[] };

const TYPES = ["table", "checklist", "month-grid", "week", "lines"] as const;

function title(pr: Problems, at: string, v: unknown): string {
  if (!str(v) || (v as string).length > 60) { pr.add(`${at}: title, up to 60 characters`); return ""; }
  return v as string;
}
function strList(pr: Problems, at: string, field: string, v: unknown, min: number, max: number): string[] {
  if (!Array.isArray(v) || v.length < min) { pr.add(`${at}: ${field}, at least ${min}`); return []; }
  const out: string[] = [];
  for (const [i, s] of v.entries()) {
    if (!str(s) || (s as string).length > 90) pr.add(`${at}: ${field} ${i + 1}, up to 90 characters`);
    else out.push(s as string);
  }
  if (out.length > max) pr.add(`${at}: ${field}, up to ${max}`);
  return out;
}

function validateSection(pr: Problems, at: string, s: Record<string, unknown>): Section | null {
  const type = s.type;
  if (!TYPES.includes(type as (typeof TYPES)[number])) { pr.add(`${at}: type must be one of ${TYPES.join(", ")}`); return null; }
  const tl = title(pr, at, s.title);
  if (type === "table") {
    const columns = strList(pr, at, "columns", s.columns, 1, 8);
    const rows = s.rows;
    if (typeof rows !== "number" || !Number.isInteger(rows) || rows < 1 || rows > 40) pr.add(`${at}: rows, a whole number of blank rows (1 to 40)`);
    return { type, title: tl, columns, rows: typeof rows === "number" ? rows : 0, totals: s.totals === true };
  }
  if (type === "week") return { type, title: tl, rows: strList(pr, at, "rows", s.rows, 1, 10) };
  if (type === "lines") return { type, title: tl, labels: strList(pr, at, "labels", s.labels, 1, 14) };
  if (type === "month-grid") {
    const months: [number, number][] = [];
    if (!Array.isArray(s.months) || !s.months.length) pr.add(`${at}: months, at least one "YYYY-MM"`);
    for (const [i, m] of ((s.months as unknown[]) ?? []).entries()) {
      const mm = typeof m === "string" ? /^(\d{4})-(\d{2})$/.exec(m) : null;
      if (!mm || Number(mm[2]) < 1 || Number(mm[2]) > 12) pr.add(`${at}: month ${i + 1} must be "YYYY-MM"`);
      else months.push([Number(mm[1]), Number(mm[2]) - 1]);
    }
    if (months.length > 12) pr.add(`${at}: up to 12 months`);
    if (s.mark !== undefined && s.mark !== "month-end" && s.mark !== "none") pr.add(`${at}: mark must be month-end or none`);
    return { type, title: tl, months, mark: s.mark === "month-end" ? "month-end" : "none" };
  }
  // checklist
  const groups: { title: string; items: string[] }[] = [];
  if (!Array.isArray(s.groups) || !s.groups.length) pr.add(`${at}: groups, at least one { title, items }`);
  for (const [i, g] of ((s.groups as unknown[]) ?? []).entries()) {
    const gat = `${at} group ${i + 1}`;
    if (!isObj(g)) { pr.add(`${gat}: { title, items }`); continue; }
    const gt = title(pr, gat, g.title);
    const items = strList(pr, gat, "items", g.items, 1, 20);
    if (gt) groups.push({ title: gt, items });
  }
  if (groups.reduce((n, g) => n + g.items.length, 0) > 60) pr.add(`${at}: keep the checklist under 60 items in all`);
  return { type: "checklist", title: tl, groups };
}

/** Facts and rules: sourced lines; a quote, when given, proves the source's wording. */
function sourcedList(pr: Problems, field: string, v: unknown, ctx: KitContext): Sourced[] {
  const out: Sourced[] = [];
  if (v === undefined) return out;
  if (!Array.isArray(v)) { pr.add(`${field}: a list of { text, src }`); return out; }
  for (const [i, f] of v.entries()) {
    const at = `${field} ${i + 1}`;
    if (!isObj(f)) { pr.add(`${at}: { text, src }`); continue; }
    if (!str(f.text) || (f.text as string).length > 160) pr.add(`${at}: text, up to 160 characters`);
    needSource(pr, at, f.src, ctx);
    needQuote(pr, at, f.quote, ctx, {});
    if (str(f.text) && (f.text as string).length <= 160) out.push({ text: f.text as string });
  }
  if (out.length > 12) pr.add(`${field}: up to 12 lines`);
  return out;
}

export const planner: Kit<Planner> = {
  name: "planner",
  validate(data, ctx) {
    const pr = new Problems("planner");
    if (!isObj(data)) { pr.add("data: needs sections"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;
    const sections: Section[] = [];
    if (!Array.isArray(d.sections) || !d.sections.length) pr.add("sections: at least one section with a type");
    for (const [i, s] of ((d.sections as unknown[]) ?? []).entries()) {
      const at = `section ${i + 1}`;
      if (!isObj(s)) { pr.add(`${at}: a section with a type`); continue; }
      const sec = validateSection(pr, at, s);
      if (sec) sections.push(sec);
    }
    if (sections.length > 8) pr.add(`${sections.length} sections; keep it to 8`);
    const facts = sourcedList(pr, "facts", d.facts, ctx);
    const rules = sourcedList(pr, "rules", d.rules, ctx);
    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    return { sections, facts, rules, unconfirmed };
  },

  render(k, p, ctx) {
    const t = ctx.theme, landscape = p.landscape ?? false, size = sizeOf(landscape, ctx.paper);
    const computed: string[] = [];

    const sections = k.sections.map((s) => {
      if (s.type === "table") {
        const head = `<tr>${s.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;
        const blank = Array.from({ length: s.rows }, () => `<tr>${s.columns.map(() => `<td></td>`).join("")}</tr>`).join("");
        const tot = s.totals ? `<tr class="tot"><td>Total</td>${s.columns.slice(1).map(() => `<td></td>`).join("")}</tr>` : "";
        return `<div class="blk" data-split><h2 class="sec">${esc(s.title)}</h2><table class="pt"><thead>${head}</thead><tbody>${blank}${tot}</tbody></table></div>`;
      }
      if (s.type === "week") {
        const head = `<tr><th class="rl"></th>${DOW.map((d) => `<th>${d}</th>`).join("")}</tr>`;
        const rows = s.rows.map((r) => `<tr><td class="rl">${esc(r)}</td>${DOW.map(() => `<td></td>`).join("")}</tr>`).join("");
        return `<div class="blk"><h2 class="sec">${esc(s.title)}</h2><table class="pt wk"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
      }
      if (s.type === "lines") return `<div class="blk">${fillLines(s.title, s.labels)}</div>`;
      if (s.type === "month-grid") {
        const boxes = s.months.map(([y, m]) => {
          let date = "";
          if (s.mark === "month-end") {
            const last = new Date(Date.UTC(y, m + 1, 0));
            computed.push(`${MONTHS[m]} ${last.getUTCDate()}`);
            date = `<span class="mg-d">${dayLabel(last)}</span>`;
          }
          return `<div class="mg blk"><div class="mg-h"><span class="mg-m">${MONTHS[m]} ${y}</span>${date}</div><div class="mg-w"><span class="bx"></span><i></i></div></div>`;
        }).join("");
        return `<div class="mgwrap"><h2 class="sec">${esc(s.title)}</h2><div class="mgrid flow">${boxes}</div></div>`;
      }
      // checklist
      const groups = s.groups.map((g) => `<div class="blk grp"><h3 class="grp-h">${esc(g.title)}</h3><ul class="ck">${g.items.map((x) => `<li><span class="bx"></span><span>${esc(x)}</span></li>`).join("")}</ul></div>`).join("");
      return `<div class="blk"><h2 class="sec">${esc(s.title)}</h2></div>${groups}`;
    }).join("");

    const sourcedBox = (items: Sourced[], label: string) => items.length
      ? `<div class="box blk src-box"><h3>${esc(label)}</h3><ul>${items.map((f) => `<li>${esc(f.text)}</li>`).join("")}</ul></div>` : "";
    const boxes = [sourcedBox(k.facts, "Good to know"), sourcedBox(k.rules, "Rules and limits")].filter(Boolean);
    const sourceGrid = boxes.length ? `<div class="sbs flow">${boxes.join("")}</div>` : "";

    const css = `${baseCss(t, landscape)}
    table.pt{width:100%;border-collapse:collapse;table-layout:fixed;font-size:calc(10px*var(--s))}
    .pt th{font-family:Sora;font-size:max(8.5px,calc(9px*var(--s)));text-transform:uppercase;letter-spacing:.04em;color:#fff;background:${t.primary};text-align:left;padding:5px 8px;line-height:1.2}
    .pt td{border:1px solid ${t.line};height:calc(26px*var(--s));padding:3px 8px;vertical-align:top}
    .pt tbody tr.tot td{background:${t.soft};font-family:Sora;font-weight:800;color:${t.primary}}
    .pt.wk td.rl,.pt.wk th.rl{width:16%;background:${t.soft};font-family:Sora;font-weight:700;color:${t.ink};font-size:calc(9px*var(--s))}
    .pt.wk th.rl{background:${t.primary}}
    ul.ck{list-style:none;margin:0;padding:0;font-size:calc(10px*var(--s));line-height:1.5}
    ul.ck li{display:flex;gap:8px;align-items:flex-start;margin:0 0 3px}
    ul.ck .bx{margin-top:2px}
    .grp{margin-top:calc(2px*var(--s))}
    .grp-h{font-family:Sora;font-size:calc(10px*var(--s));color:${t.ink};margin:0 0 3px}
    .mgwrap{margin-top:calc(2px*var(--s))}
    .mgrid{display:grid;grid-template-columns:repeat(${landscape ? 6 : 4},1fr);gap:8px}
    .mg{border:1.4px solid ${t.line};border-radius:8px;padding:6px 8px;background:#fff}
    .mg-h{display:flex;flex-direction:column;gap:1px;margin-bottom:5px}
    .mg-m{font-family:Sora;font-weight:800;font-size:calc(10.5px*var(--s));color:${t.primary}}
    .mg-d{font-size:calc(8.8px*var(--s));color:${t.muted};font-family:Sora;font-weight:700}
    .mg-w{display:flex;align-items:center;gap:7px}
    .mg-w i{flex:1;border-bottom:1px solid ${t.muted};height:14px}
    .sbs{display:grid;grid-template-columns:${boxes.length > 1 ? "1fr 1fr" : "1fr"};gap:10px;margin-top:calc(10px*var(--s))}
    .src-box ul{list-style:none;margin:0;padding:0;font-size:calc(9.5px*var(--s));line-height:1.4}
    .src-box li{margin:0 0 3px;padding-left:12px;position:relative}
    .src-box li::before{content:"";position:absolute;left:2px;top:6px;width:4px;height:4px;border-radius:50%;background:${t.primary}}`;

    const body = `${header(t, p.title, p.subtitle)}${sections}${sourceGrid}${k.unconfirmed.length ? `<div class="blk">${unconfirmedBox(k.unconfirmed)}</div>` : ""}${notes(p.notesLabel)}`;
    return { html: page(ctx, size, css, body, p.note), size, computed, warnings: [] };
  },
};
