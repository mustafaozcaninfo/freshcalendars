/**
 * holiday-planner kit: one holiday or observance on a page. A big date card with the weekday computed
 * from the date, a "what is open, closed or changed" grid whose status is a drawn shape and a word
 * (never color alone), a prep timeline counted back from the day (the dates computed, not typed), the
 * same holiday's date in the coming years (weekdays computed), a "not yet confirmed" box, fill-in
 * lines and a notes area. Portrait.
 *
 * data:
 *   holiday: { date: "2026-11-26", name: "Thanksgiving Day", src: 1,
 *              quote: "Thanksgiving Day, Thursday, November 26, 2026" }   # source's words with the date
 *   status:                                   # the open / closed / changed grid
 *     - { name: "Federal offices", status: closed, detail: "Federal holiday", src: 1,
 *         quote: "..." }                       # status: closed | open | limited
 *   tasks:                                    # our own advice, counted back from the day; no src
 *     - { daysBefore: 7, task: "Order the turkey" }
 *   future:                                   # the same date in coming years, weekday computed
 *     - { date: "2027-11-25", src: 1, quote: "Thanksgiving Day 2027: Thursday, November 25" }
 *   unconfirmed: [{ label: "Store hours", why: "chains had not posted 2026 hours" }]
 *   fill: ["Guest list", "Menu"]              # optional fill-in labels
 */
import { baseCss, fillLines, header, notes, page, sizeOf, unconfirmedBox } from "./components.js";
import { DOWFULL, MONTHS, Problems, dayLabel, esc, isObj, isoDay, isoOf, needQuote, needSource, str, unconfirmedList, type Kit, type Unconfirmed } from "./kit.js";

const STATUS = ["closed", "open", "limited"] as const;
type StatusName = (typeof STATUS)[number];
const STATUS_LABEL: Record<StatusName, string> = { closed: "Closed", open: "Open", limited: "Limited" };

type Fact = { name: string; status: StatusName; detail?: string };
type Task = { daysBefore: number; task: string };
type Future = { date: Date };
export type HolidayPlanner = {
  holiday: { date: Date; name: string };
  status: Fact[];
  tasks: Task[];
  future: Future[];
  unconfirmed: Unconfirmed[];
  fill: string[];
};

/** A 13 px status marker: a box plus a distinct inner mark (cross, check, dash), so the status reads
 * in grayscale without color. Drawn as SVG paths, never a font glyph. */
function mark(status: StatusName, color: string): string {
  const inner =
    status === "closed" ? `<path d="M3.5 3.5 L9.5 9.5 M9.5 3.5 L3.5 9.5" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>`
    : status === "open" ? `<path d="M3 6.7 l2.4 2.6 l4.4 -5.2" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<path d="M3.5 6.5 h6" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<svg class="mk" width="13" height="13" viewBox="0 0 13 13" aria-hidden="true"><rect x="1" y="1" width="11" height="11" rx="2.5" fill="#fff" stroke="${color}" stroke-width="1.6"/>${inner}</svg>`;
}

export const holidayPlanner: Kit<HolidayPlanner> = {
  name: "holiday-planner",
  validate(data, ctx) {
    const pr = new Problems("holiday-planner");
    if (!isObj(data)) { pr.add("data: needs holiday, status, tasks and future"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;

    // The holiday itself.
    let holiday: HolidayPlanner["holiday"] | null = null;
    const h = d.holiday;
    if (!isObj(h)) pr.add("holiday: { date: YYYY-MM-DD, name, src }");
    else {
      const date = isoDay(h.date);
      if (!date) pr.add(`holiday: date ${JSON.stringify(h.date)} is not a real date (YYYY-MM-DD)`);
      if (!str(h.name) || h.name.length > 60) pr.add("holiday: name, up to 60 characters");
      needSource(pr, "holiday", h.src, ctx);
      if (date) needQuote(pr, "holiday", h.quote, ctx, { days: [date] });
      if (date && str(h.name) && h.name.length <= 60) holiday = { date, name: h.name };
    }

    // The open / closed / changed grid.
    const status: Fact[] = [];
    if (!Array.isArray(d.status) || !d.status.length) pr.add("status: at least one { name, status, detail?, src }");
    for (const [i, s] of ((d.status as unknown[]) ?? []).entries()) {
      const at = `status ${i + 1}`;
      if (!isObj(s)) { pr.add(`${at}: { name, status, detail?, src }`); continue; }
      if (!str(s.name) || s.name.length > 48) pr.add(`${at}: name, up to 48 characters`);
      if (!STATUS.includes(s.status as StatusName)) pr.add(`${at}: status must be one of ${STATUS.join(", ")}`);
      if (s.detail !== undefined && (!str(s.detail) || (s.detail as string).length > 90)) pr.add(`${at}: detail, up to 90 characters`);
      needSource(pr, `${at} "${String(s.name ?? "")}"`, s.src, ctx);
      // The status quote proves the source calls it open or closed; it carries no date of its own.
      needQuote(pr, `${at} "${String(s.name ?? "")}"`, s.quote, ctx, {});
      if (str(s.name) && s.name.length <= 48 && STATUS.includes(s.status as StatusName))
        status.push({ name: s.name, status: s.status as StatusName, detail: str(s.detail) && (s.detail as string).length <= 90 ? (s.detail as string) : undefined });
    }
    if (status.length > 30) pr.add(`${status.length} status rows; keep it under 30 (long tables continue on more pages)`);

    // Prep timeline: our advice, so no source; the kit computes each date from daysBefore.
    const tasks: Task[] = [];
    if (d.tasks !== undefined) {
      if (!Array.isArray(d.tasks)) pr.add("tasks: a list of { daysBefore, task }");
      else for (const [i, tk] of (d.tasks as unknown[]).entries()) {
        const at = `task ${i + 1}`;
        if (!isObj(tk)) { pr.add(`${at}: { daysBefore, task }`); continue; }
        const db = tk.daysBefore;
        if (typeof db !== "number" || !Number.isInteger(db) || db < 0 || db > 365) pr.add(`${at}: daysBefore, a whole number of days (0 to 365) before the day`);
        if (!str(tk.task) || tk.task.length > 90) pr.add(`${at}: task, up to 90 characters`);
        if (typeof db === "number" && Number.isInteger(db) && db >= 0 && db <= 365 && str(tk.task) && tk.task.length <= 90) tasks.push({ daysBefore: db, task: tk.task });
      }
      if (tasks.length > 30) pr.add(`${tasks.length} tasks; keep it under 30`);
    }

    // The date in coming years: each sourced, after the holiday, in order.
    const future: Future[] = [];
    if (d.future !== undefined) {
      if (!Array.isArray(d.future)) pr.add("future: a list of { date, src }");
      else for (const [i, f] of (d.future as unknown[]).entries()) {
        const at = `future ${i + 1}`;
        if (!isObj(f)) { pr.add(`${at}: { date, src }`); continue; }
        const date = isoDay(f.date);
        if (!date) { pr.add(`${at}: date ${JSON.stringify(f.date)} is not a real date (YYYY-MM-DD)`); continue; }
        if (holiday && date <= holiday.date) pr.add(`${at}: ${isoOf(date)} is not after the holiday ${isoOf(holiday.date)}; "coming years" lists later dates`);
        if (future.length && date <= future[future.length - 1]!.date) pr.add(`${at}: ${isoOf(date)} is not after the row before; one row per year, in order`);
        needSource(pr, `${at} (${isoOf(date)})`, f.src, ctx);
        needQuote(pr, `${at} (${isoOf(date)})`, f.quote, ctx, { days: [date] });
        future.push({ date });
      }
      if (future.length > 10) pr.add(`${future.length} future years; keep it to 10 or fewer`);
    }

    const fill = Array.isArray(d.fill) ? (d.fill as unknown[]).filter(str) : [];
    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    tasks.sort((a, b) => b.daysBefore - a.daysBefore);
    return { holiday: holiday!, status, tasks, future, unconfirmed, fill };
  },

  render(k, p, ctx) {
    const t = ctx.theme, landscape = p.landscape ?? false, size = sizeOf(landscape, ctx.paper);
    const computed: string[] = [];
    const hd = k.holiday.date;

    // Big date card. The weekday is computed; the month and day come from the sourced holiday date.
    const card = `<div class="dcard blk"><div class="dc-l"><span class="dc-dow">${DOWFULL[hd.getUTCDay()]}</span>
      <span class="dc-date">${MONTHS[hd.getUTCMonth()]} ${hd.getUTCDate()}, ${hd.getUTCFullYear()}</span></div>
      <div class="dc-r">${esc(k.holiday.name)}</div></div>`;

    // Open / closed / changed grid as a splittable table; the status is a drawn mark and a word.
    const used = STATUS.filter((s) => k.status.some((x) => x.status === s));
    const statusRows = k.status.map((s) => `<tr><td class="st">${mark(s.status, t.primary)}<span>${STATUS_LABEL[s.status]}</span></td><td class="nm">${esc(s.name)}</td><td>${s.detail ? esc(s.detail) : ""}</td></tr>`).join("");
    const statusTable = `<div class="blk" data-split><h2 class="sec">What is open, closed or changed</h2>
      <table class="st-t"><thead><tr><th class="st">Status</th><th class="nm">Place or service</th><th>Detail</th></tr></thead><tbody>${statusRows}</tbody></table></div>`;
    const key = used.length ? `<div class="box key"><h3>Key</h3><ul>${used.map((s) => `<li>${mark(s, t.primary)}<span>${STATUS_LABEL[s]} - ${s === "closed" ? "not open on the day" : s === "open" ? "open, regular service" : "open with reduced hours or service"}</span></li>`).join("")}</ul></div>` : "";

    // Prep timeline: each date is computed from daysBefore, so it is recorded as computed for 10-PDF-FACTS.
    const taskRows = k.tasks.map((tk) => {
      const day = new Date(hd.getTime() - tk.daysBefore * 86_400_000);
      computed.push(`${MONTHS[day.getUTCMonth()]} ${day.getUTCDate()}`);
      const dleft = tk.daysBefore === 0 ? "On the day" : `${tk.daysBefore} day${tk.daysBefore === 1 ? "" : "s"} before`;
      return `<tr><td class="wn"><b>${dayLabel(day)}</b><span>${dleft}</span></td><td>${esc(tk.task)}</td><td class="ck"><span class="bx"></span></td></tr>`;
    }).join("");
    const timeline = k.tasks.length ? `<div class="blk" data-split><h2 class="sec">Plan ahead</h2>
      <table class="tl-t"><thead><tr><th class="wn">When</th><th>To do</th><th class="ck">Done</th></tr></thead><tbody>${taskRows}</tbody></table></div>` : "";

    // The same date in coming years; weekday computed, the date itself is a sourced fact.
    const futureRows = k.future.map((f) => `<tr><td class="yr">${f.date.getUTCFullYear()}</td><td>${dayLabel(f.date)}</td></tr>`).join("");
    const future = k.future.length ? `<div class="blk" data-split><h2 class="sec">${esc(k.holiday.name)} in the coming years</h2>
      <table class="fu-t"><thead><tr><th class="yr">Year</th><th>Date</th></tr></thead><tbody>${futureRows}</tbody></table></div>` : "";

    const sideParts = [unconfirmedBox(k.unconfirmed), k.fill.length ? fillLines("My plans", k.fill) : ""].filter(Boolean);
    // Each box moves on its own (a .flow grid), so the key can stay on page 1 when the rest cannot.
    const boxes = [key, ...sideParts].filter(Boolean).map((b) => b.replace(/^<div class="box/, '<div class="box blk'));
    const side = boxes.length ? `<div class="side flow">${boxes.join("")}</div>` : "";

    const css = `${baseCss(t, landscape)}
    .dcard{display:flex;align-items:stretch;gap:14px;border:2px solid ${t.primary};border-radius:12px;background:${t.soft};padding:calc(10px*var(--s)) 16px;margin-bottom:calc(10px*var(--s))}
    .dc-l{display:flex;flex-direction:column;justify-content:center;flex:1;min-width:0}
    .dc-dow{font-family:Sora;font-weight:800;font-size:calc(15px*var(--s));color:${t.primary};line-height:1.1}
    .dc-date{font-family:Sora;font-weight:800;font-size:calc(27px*var(--s));color:${t.ink};line-height:1.05}
    .dc-r{display:flex;align-items:center;text-align:right;font-family:Sora;font-weight:700;font-size:calc(13px*var(--s));color:${t.primary};max-width:44%;line-height:1.2}
    table.st-t,table.tl-t,table.fu-t{width:100%;border-collapse:collapse;table-layout:fixed;font-size:calc(10.5px*var(--s))}
    .st-t th,.tl-t th,.fu-t th{font-family:Sora;font-size:max(8px,calc(8.8px*var(--s)));text-transform:uppercase;letter-spacing:.05em;color:#fff;background:${t.primary};text-align:left;padding:5px 8px;line-height:1.2}
    .st-t td,.tl-t td,.fu-t td{padding:calc(6px*var(--s)) 8px;border-bottom:1px solid ${t.line};vertical-align:top;line-height:1.3}
    .st-t tbody tr:nth-child(even) td,.tl-t tbody tr:nth-child(even) td,.fu-t tbody tr:nth-child(even) td{background:${t.soft}}
    .st-t .st,.st-t td.st{width:21%;white-space:nowrap}.st-t td.st{display:flex;align-items:center;gap:6px;font-family:Sora;font-weight:700;color:${t.ink}}
    .st-t .nm{width:34%}.st-t td.nm{font-family:Sora;font-weight:700;color:${t.ink}}
    .mk{flex:none;vertical-align:middle}
    .tl-t .wn{width:30%}.tl-t td.wn b{font-family:Sora;color:${t.ink};display:block}.tl-t td.wn span{color:${t.muted};font-size:.85em}
    .tl-t .ck,.fu-t .yr{text-align:left}.tl-t .ck{width:12%;text-align:center}.tl-t td.ck{text-align:center}
    .fu-t .yr{width:22%}.fu-t td.yr{font-family:Sora;font-weight:800;color:${t.primary}}
    .side{display:grid;grid-template-columns:${sideParts.length ? "1.1fr 1fr" : "1fr"};gap:10px;margin-top:calc(10px*var(--s))}
    .key ul{list-style:none;margin:0;padding:0;font-size:calc(9.5px*var(--s));line-height:1.4}
    .key li{display:flex;gap:7px;align-items:flex-start;margin:0 0 3px}.key li .mk{margin-top:1px}`;

    const body = `${header(t, p.title, p.subtitle)}${card}${statusTable}${timeline}${future}${side}${notes(p.notesLabel)}`;
    return { html: page(ctx, size, css, body, p.note), size, computed, warnings: [] };
  },
};
