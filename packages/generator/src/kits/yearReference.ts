/**
 * year-reference kit: a whole year at a glance as twelve mini months, each cell carrying the chosen
 * reference number: the ISO week number (in a left gutter), the day of the year, or the days left in
 * the year. Optional marks are drawn on their day with a numbered legend, and the U.S. federal
 * holidays can be computed from the engine and listed. Every number is computed; nothing is typed.
 * Portrait.
 *
 * data:
 *   year: 2027
 *   mode: week-numbers        # week-numbers | day-of-year | days-left
 *   start: monday             # monday | sunday (week start)
 *   marks:                    # optional, each drawn on its day and numbered in the legend
 *     - { date: "2027-01-20", label: "Taxes: W-2 forms due", src: 1, quote: "...by Jan. 20" }
 *   federal: true             # optional: draw and list the U.S. federal holidays (computed)
 *   month: 3                  # optional: one month as a large calendar (March), mark and holiday
 *                             # names written in the day cells; marks must fall in that month
 */
import { holidaysForYear } from "@freshcalendars/engine";
import { dayOfYear } from "../julian.js";
import { baseCss, header, notes, page, sizeOf } from "./components.js";
import { MONTHS, Problems, dayLabel, esc, isObj, isoDay, isoOf, needQuote, needSource, str, type Kit } from "./kit.js";

const MODES = ["week-numbers", "day-of-year", "days-left"] as const;
type Mode = (typeof MODES)[number];
type Mark = { date: Date; label: string };
export type YearReference = { year: number; mode: Mode; start: 0 | 1; marks: Mark[]; federal: boolean; month?: number };

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const daysInYear = (y: number) => ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365);

/**
 * ISO 8601 week number of a date: the week is numbered by the year that owns its Thursday, so
 * Jan. 1, 2027 (a Friday) is week 53 of 2026.
 */
export function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // the Thursday of this week
  const firstThu = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((date.getTime() - firstThu.getTime()) / (7 * 86_400_000));
}

export const yearReference: Kit<YearReference> = {
  name: "year-reference",
  validate(data, ctx) {
    const pr = new Problems("year-reference");
    if (!isObj(data)) { pr.add("data: needs year and mode"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;
    const year = typeof d.year === "number" ? d.year : 0;
    if (!Number.isInteger(year) || year < 1900 || year > 2100) pr.add("year: a four-digit year");
    const mode = d.mode as Mode;
    if (!MODES.includes(mode)) pr.add(`mode: one of ${MODES.join(", ")}`);
    const start = d.start === undefined ? "monday" : d.start;
    if (start !== "monday" && start !== "sunday") pr.add("start: monday or sunday");
    // ISO weeks run Monday to Sunday: in a Sunday-start grid each row straddles two week numbers.
    else if (mode === "week-numbers" && start === "sunday") pr.add("start: ISO week numbers need a Monday start (each row is one ISO week); use start: monday or another mode");

    const marks: Mark[] = [];
    if (d.marks !== undefined) {
      if (!Array.isArray(d.marks)) pr.add("marks: a list of { date, label, src, quote }");
      else for (const [i, mk] of d.marks.entries()) {
        const at = `mark ${i + 1}`;
        if (!isObj(mk)) { pr.add(`${at}: { date, label, src, quote }`); continue; }
        const date = isoDay(mk.date);
        if (!date) pr.add(`${at}: date ${JSON.stringify(mk.date)} is not a real date (YYYY-MM-DD)`);
        else if (date.getUTCFullYear() !== year) pr.add(`${at}: ${isoOf(date)} is not in ${year}`);
        if (!str(mk.label) || mk.label.length > 44) pr.add(`${at}: label, up to 44 characters`);
        needSource(pr, `${at}${str(mk.label) ? ` "${mk.label}"` : ""}`, mk.src, ctx);
        if (date) needQuote(pr, `${at}${str(mk.label) ? ` "${mk.label}"` : ""}`, mk.quote, ctx, { days: [date] });
        if (date && str(mk.label)) marks.push({ date, label: mk.label });
      }
    }
    const month = d.month === undefined ? undefined : d.month;
    if (month !== undefined && (typeof month !== "number" || !Number.isInteger(month) || month < 1 || month > 12)) pr.add("month: 1 to 12, for a one-month calendar");
    if (typeof month === "number") for (const mk of marks) if (mk.date.getUTCMonth() + 1 !== month) pr.add(`mark "${mk.label}" on ${isoOf(mk.date)} is not in ${MONTHS[month - 1]} ${year}`);
    if (marks.length > (month ? 31 : 14)) pr.add(`${marks.length} marks; keep it to ${month ? 31 : 14} so the sheet stays legible`);
    if (d.federal !== undefined && typeof d.federal !== "boolean") pr.add("federal: true or false");
    pr.throwIfAny();
    marks.sort((a, b) => a.date.getTime() - b.date.getTime());
    return { year, mode, start: start === "monday" ? 1 : 0, marks, federal: d.federal === true, month: typeof month === "number" ? month : undefined };
  },

  render(k, p, ctx) {
    const t = ctx.theme, size = sizeOf(false, ctx.paper);
    const total = daysInYear(k.year);
    const markBy = new Map(k.marks.map((m, i) => [isoOf(m.date), i + 1]));
    const fed = (k.federal ? holidaysForYear(k.year, { federalOnly: true }) : []).filter((h) => !k.month || Number(h.iso.slice(5, 7)) === k.month);
    const fedSet = new Set(fed.map((h) => h.iso));
    const dowLetters = (k.start === 1 ? ["M", "T", "W", "T", "F", "S", "S"] : ["S", "M", "T", "W", "T", "F", "S"]);

    const miniMonth = (m: number): string => {
      const dim = daysInMonth(k.year, m);
      const firstWd = new Date(Date.UTC(k.year, m, 1)).getUTCDay();
      const lead = (firstWd - k.start + 7) % 7;
      const slots: (number | null)[] = Array.from({ length: lead }, () => null);
      for (let dd = 1; dd <= dim; dd++) slots.push(dd);
      while (slots.length % 7) slots.push(null);
      const weekMode = k.mode === "week-numbers";
      let rows = "";
      for (let r = 0; r < slots.length / 7; r++) {
        const week = slots.slice(r * 7, r * 7 + 7);
        const firstReal = week.find((x) => x !== null) as number | undefined;
        const gutter = weekMode && firstReal ? `<i class="wn">${isoWeek(new Date(Date.UTC(k.year, m, firstReal)))}</i>` : weekMode ? `<i class="wn"></i>` : "";
        const cells = week.map((dd, ci) => {
          if (dd === null) return `<i class="x"></i>`;
          const iso = `${k.year}-${String(m + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
          const wd = (k.start + ci) % 7; // 0 = Sunday
          const weekend = wd === 0 || wd === 6;
          const doy = dayOfYear(k.year, m, dd);
          const value = weekMode ? dd : k.mode === "day-of-year" ? doy : total - doy;
          const isFed = fedSet.has(iso), markN = markBy.get(iso);
          const corner = `${isFed ? `<svg class="fd" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="3" fill="${t.primary}"/></svg>` : ""}${markN ? `<b class="mn">${markN}</b>` : ""}`;
          return `<i class="dy${weekend ? " we" : ""}${isFed ? " fed" : ""}"><em>${value}</em>${corner}</i>`;
        }).join("");
        rows += `<div class="wr">${gutter}${cells}</div>`;
      }
      return `<div class="mm blk"><h4>${MONTHS[m]}</h4><div class="wr dh">${weekMode ? `<i class="wn"></i>` : ""}${dowLetters.map((x) => `<i class="hd">${x}</i>`).join("")}</div>${rows}</div>`;
    };

    /** One month, large: the reference number in the corner, mark and holiday names in the cell. */
    const bigMonth = (m: number): string => {
      const dim = daysInMonth(k.year, m), lead = (new Date(Date.UTC(k.year, m, 1)).getUTCDay() - k.start + 7) % 7;
      const slots: (number | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: dim }, (_, i) => i + 1)];
      while (slots.length % 7) slots.push(null);
      const fedName = new Map(fed.map((h) => [h.iso, h.name]));
      const weekMode = k.mode === "week-numbers";
      const dows = (k.start === 1 ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
      let rows = "";
      for (let r = 0; r < slots.length / 7; r++) {
        const week = slots.slice(r * 7, r * 7 + 7), firstReal = week.find((x) => x !== null) as number | undefined;
        const gutter = weekMode ? `<td class="bwn">${firstReal ? isoWeek(new Date(Date.UTC(k.year, m, firstReal))) : ""}</td>` : "";
        rows += `<tr>${gutter}${week.map((dd, ci) => {
          if (dd === null) return `<td class="bx0"></td>`;
          const iso = `${k.year}-${String(m + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`, wd = (k.start + ci) % 7, doy = dayOfYear(k.year, m, dd);
          const ref = k.mode === "day-of-year" ? `Day ${doy}` : k.mode === "days-left" ? `${total - doy} left` : "";
          const markN = markBy.get(iso), names = [fedName.get(iso), markN ? k.marks[markN - 1]!.label : undefined].filter(Boolean) as string[];
          return `<td class="bd${wd === 0 || wd === 6 ? " we" : ""}${fedName.has(iso) ? " fed" : ""}"><span class="n">${dd}</span>${ref ? `<span class="rf">${ref}</span>` : ""}${markN ? `<b class="mn">${markN}</b>` : ""}${names.map((x) => `<span class="nm">${esc(x)}</span>`).join("")}</td>`;
        }).join("")}</tr>`;
      }
      return `<div class="blk"><h2 class="sec bm">${MONTHS[m]} ${k.year}</h2><table class="big"><thead><tr>${weekMode ? `<th class="bwn">Week</th>` : ""}${dows.map((x) => `<th>${x.slice(0, 3)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
    };
    const grids = k.month ? "" : Array.from({ length: 12 }, (_, m) => miniMonth(m)).join("");

    // Legend: the mode, then numbered marks, then the federal-holiday note. All text is Sora/Manrope.
    const modeNote = k.mode === "week-numbers" ? "Left of each row: the ISO week number. Weeks run Monday to Sunday."
      : k.mode === "day-of-year" ? "Each day shows its day of the year, 1 to " + total + "."
      : "Each day shows the number of days left in the year.";
    const markList = k.marks.length
      ? `<div class="lg"><h3>Marked days</h3><ul>${k.marks.map((mm, i) => `<li><b class="mn">${i + 1}</b><span><b>${esc(mm.label)}</b> ${dayLabel(mm.date)}</span></li>`).join("")}</ul></div>` : "";
    const fedList = fed.length
      ? `<div class="lg"><h3><svg class="fd" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="3" fill="${t.primary}"/></svg>U.S. federal holidays</h3><p class="fn">${fed.map((h) => esc(h.name)).join(", ")}</p></div>` : "";
    const legend = `<div class="legend blk"><p class="mode">${esc(modeNote)}</p>${markList}${fedList}</div>`;

    const css = `${baseCss(t, false)}
    .yr{display:grid;grid-template-columns:repeat(3,1fr);gap:calc(9px*var(--s)) 14px}
    .mm h4{font-family:Sora;font-weight:800;font-size:calc(11px*var(--s));margin:0 0 3px;color:${t.ink}}
    .wr{display:grid;grid-template-columns:${k.mode === "week-numbers" ? "1.1fr " : ""}repeat(7,1fr);gap:1px}
    .wr i{font-style:normal;text-align:center;display:flex;align-items:center;justify-content:center;position:relative}
    .wr .hd{font-family:Sora;font-weight:700;font-size:max(8px,calc(8.5px*var(--s)));color:${t.primary};height:14px}
    .wr .wn{font-family:Sora;font-weight:700;font-size:max(8px,calc(8.5px*var(--s)));color:${t.muted}}
    .wr .dy{height:calc(17px*var(--s));font-weight:600;border-radius:3px}
    .wr .dy em{font-style:normal;font-size:max(8px,calc(9px*var(--s)));color:${t.ink}}
    .wr .dy.we em{color:${t.muted}}
    .wr .dy.fed{background:${t.soft}}
    .wr .fd{position:absolute;left:1px;top:1px;width:5px;height:5px}
    .wr .mn{position:absolute;right:0;top:-1px;font-family:Sora;font-weight:800;font-size:8px;color:#fff;background:${t.primary};border-radius:3px;min-width:9px;height:9px;line-height:9px;padding:0 1px}
    .legend{border:1.4px solid ${t.line};border-radius:10px;padding:calc(8px*var(--s)) 12px;margin-top:calc(10px*var(--s))}
    .legend .mode{margin:0 0 6px;font-size:calc(9.5px*var(--s));color:${t.ink};line-height:1.4}
    .legend .lg{margin-top:6px}
    .legend h3{font-family:Sora;font-size:calc(10.5px*var(--s));margin:0 0 4px;color:${t.primary};display:flex;align-items:center;gap:6px}
    .legend h3 .fd{width:9px;height:9px;position:static}
    .legend ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:3px 16px;font-size:calc(9.5px*var(--s))}
    .legend li{display:flex;gap:7px;align-items:baseline;line-height:1.3}
    .legend li .mn{position:static;font-family:Sora;font-weight:800;font-size:9px;color:#fff;background:${t.primary};border-radius:3px;min-width:14px;height:14px;line-height:14px;text-align:center;flex:none}
    .legend li b:not(.mn){font-family:Sora;color:${t.ink}}
    .legend .fn{margin:0;font-size:calc(9px*var(--s));color:${t.muted};line-height:1.5}
    .bm{font-size:calc(16px*var(--s))!important;text-transform:none!important;letter-spacing:0!important;color:${t.ink}!important}
    table.big{width:100%;border-collapse:collapse;table-layout:fixed}
    .big th{font-family:Sora;font-size:max(8px,calc(9px*var(--s)));text-transform:uppercase;letter-spacing:.06em;color:#fff;background:${t.primary};padding:5px 4px}
    .big td{border:1px solid ${t.line};height:calc(104px*var(--s));vertical-align:top;padding:4px 5px;position:relative}
    .big td.bx0{background:${t.soft}}
    .big td.fed{background:${t.soft}}
    .big .n{display:block;font-family:Sora;font-weight:800;font-size:calc(15px*var(--s));color:${t.ink}}
    .big td.we .n{color:${t.muted}}
    .big .rf{position:absolute;right:5px;top:6px;font-size:8px;color:${t.muted}}
    .big .mn{position:absolute;right:5px;bottom:5px;font-family:Sora;font-weight:800;font-size:9px;color:#fff;background:${t.primary};border-radius:3px;min-width:14px;height:14px;line-height:14px;text-align:center}
    .big .nm{display:block;margin-top:3px;font-size:calc(9px*var(--s));line-height:1.25;color:${t.ink};font-weight:700}
    .big .bwn{width:7%;text-align:center}.big td.bwn{font-family:Sora;font-weight:800;color:${t.muted};font-size:calc(10px*var(--s));vertical-align:middle}`;
    const sub = k.month ? `${MONTHS[k.month - 1]} ${k.year}.${k.mode === "week-numbers" ? " ISO week numbers at the left." : ""}` : `${k.year} at a glance. ${k.mode === "week-numbers" ? "ISO week numbers" : k.mode === "day-of-year" ? "Day of the year" : "Days left in the year"}.`;
    const body = k.month
      ? `${header(t, p.title, p.subtitle ?? sub)}${bigMonth(k.month - 1)}${legend}${notes(p.notesLabel)}`
      : `${header(t, p.title, sub)}<div class="yr flow">${grids}</div>${legend}${notes(p.notesLabel)}`;
    // Marked days carry a computed weekday, so 10-PDF-FACTS accepts their dates on the sheet.
    return { html: page(ctx, size, css, body, p.note), size, computed: k.marks.map((m) => dayLabel(m.date)), warnings: [] };
  },
};
