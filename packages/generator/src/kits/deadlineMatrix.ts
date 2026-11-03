/**
 * deadline-matrix kit: deadlines as a grid, one row per date and one column per carrier, program or
 * deadline type (FedEx / UPS / USPS ship-by dates, mail ballot / early voting / registration, payment
 * programs). Weekdays and "days before" the target are computed; a timeline strip at the top shows
 * the dates as ticks leading to the target. Landscape by default.
 *
 * data:
 *   target: { date: "2026-12-25", label: "Christmas Day" }   # optional; adds the days-before column
 *   columns: ["FedEx", "UPS", "USPS"]                        # 1 to 5
 *   rows:
 *     - date: "2026-12-18"
 *       cells: { FedEx: "Ground 4-day", USPS: "Priority Mail" }   # a cell may be { text, src }
 *       src: 1                                                    # source of the row's cells
 *   done: true                     # tick-box column (default true)
 *   unconfirmed: [{ label: "UPS ground dates", why: "UPS had not posted them on Oct. 30" }]
 */
import { baseCss, header, notes, page, sizeOf, unconfirmedBox } from "./components.js";
import { MON, Problems, dayLabel, daysBetween, esc, isObj, isoDay, isoOf, needSource, str, unconfirmedList, type Kit, type Unconfirmed } from "./kit.js";

type Row = { date: Date; cells: Record<string, string> };
export type DeadlineMatrix = { target?: { date: Date; label: string }; columns: string[]; rows: Row[]; done: boolean; unconfirmed: Unconfirmed[] };

export const deadlineMatrix: Kit<DeadlineMatrix> = {
  name: "deadline-matrix",
  validate(data, ctx) {
    const pr = new Problems("deadline-matrix");
    if (!isObj(data)) { pr.add("data: needs columns and rows"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;
    const columns = Array.isArray(d.columns) ? d.columns.filter(str) : [];
    if (columns.length < 1 || columns.length > 5 || columns.length !== (d.columns as unknown[] | undefined)?.length) pr.add("columns: 1 to 5 names");
    if (new Set(columns).size !== columns.length) pr.add("columns: names must differ");
    let target: DeadlineMatrix["target"];
    if (d.target !== undefined) {
      const tg = d.target as Record<string, unknown>, date = isObj(tg) ? isoDay(tg.date) : null;
      if (!date || !str(tg.label)) pr.add("target: { date: YYYY-MM-DD, label }");
      else target = { date, label: tg.label };
    }
    const rows: Row[] = [];
    if (!Array.isArray(d.rows) || !d.rows.length) pr.add("rows: at least one");
    for (const [i, r] of ((d.rows as unknown[]) ?? []).entries()) {
      const at = `row ${i + 1}`;
      if (!isObj(r)) { pr.add(`${at}: { date, cells, src }`); continue; }
      const date = isoDay(r.date);
      if (!date) { pr.add(`${at}: date ${JSON.stringify(r.date)} is not a real date (YYYY-MM-DD)`); continue; }
      if (!isObj(r.cells) || !Object.keys(r.cells).length) { pr.add(`${at} (${isoOf(date)}): cells, at least one`); continue; }
      const cells: Record<string, string> = {};
      for (const [col, v] of Object.entries(r.cells)) {
        if (!columns.includes(col)) pr.add(`${at} (${isoOf(date)}): "${col}" is not one of the columns`);
        const text = isObj(v) ? v.text : v;
        if (!str(text) || text.length > 90) pr.add(`${at} (${isoOf(date)}) ${col}: text up to 90 characters`);
        else cells[col] = text;
        needSource(pr, `${at} (${isoOf(date)}) ${col}`, isObj(v) && v.src !== undefined ? v.src : r.src, ctx);
      }
      if (target && date > target.date) pr.add(`${at}: ${isoOf(date)} is after the target ${isoOf(target.date)}`);
      if (rows.length && date <= rows[rows.length - 1]!.date) pr.add(`${at}: ${isoOf(date)} is not after the row before; one row per date, in order`);
      rows.push({ date, cells });
    }
    if (rows.length > 24) pr.add(`${rows.length} rows; split into two printables (max 24)`);
    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    return { target, columns, rows, done: d.done !== false, unconfirmed };
  },

  render(m, p, ctx) {
    const t = ctx.theme, landscape = p.landscape ?? true, size = sizeOf(landscape);
    // Timeline strip: one tick per date from the first row to the target, labels as SVG text.
    const first = m.rows[0]!.date, last = m.target?.date ?? m.rows[m.rows.length - 1]!.date;
    const span = Math.max(1, daysBetween(first, last));
    const X = (d: Date) => 3 + (daysBetween(first, d) / span) * 94;
    const ticks = m.rows.map((r, i) => `<circle cx="${X(r.date)}%" cy="26" r="6" fill="${t.primary}"/><text x="${X(r.date)}%" y="${i % 2 ? 50 : 14}" text-anchor="middle" font-family="Sora" font-weight="800" font-size="9" fill="${t.ink}">${MON[r.date.getUTCMonth()]} ${r.date.getUTCDate()}</text>`).join("");
    const goal = m.target ? `<rect x="${X(m.target.date)}%" y="16" width="14" height="20" rx="3" fill="${t.accent}" transform="translate(-7 0)"/><text x="${X(m.target.date)}%" y="50" text-anchor="end" font-family="Sora" font-weight="800" font-size="9" fill="${t.ink}">${esc(m.target.label)}</text>` : "";
    const strip = `<svg class="strip" width="100%" height="56" role="img"><title>Deadlines in date order</title><line x1="3%" x2="97%" y1="26" y2="26" stroke="${t.line}" stroke-width="3"/>${ticks}${goal}</svg>`;
    const head = `<tr><th class="dt">Date</th>${m.target ? `<th class="n">Days before ${esc(m.target.label)}</th>` : ""}${m.columns.map((c) => `<th>${esc(c)}</th>`).join("")}${m.done ? `<th class="ck">Done</th>` : ""}</tr>`;
    const body = m.rows.map((r) => `<tr><td class="dt">${dayLabel(r.date)}</td>${m.target ? `<td class="n">${daysBetween(r.date, m.target.date)}</td>` : ""}${m.columns.map((c) => `<td>${r.cells[c] ? esc(r.cells[c]!) : ""}</td>`).join("")}${m.done ? `<td class="ck"><span class="bx"></span></td>` : ""}</tr>`).join("");
    const badge = m.target ? `${esc(m.target.label)}<br>${dayLabel(m.target.date)}` : undefined;
    const css = `${baseCss(t, landscape)}
    .strip{display:block;margin:0 0 calc(6px*var(--s))}
    table.dm{width:100%;border-collapse:collapse;table-layout:fixed;font-size:calc(10.5px*var(--s))}
    .dm th{font-family:Sora;font-size:max(8px,calc(8.8px*var(--s)));text-transform:uppercase;letter-spacing:.05em;color:#fff;background:${t.primary};text-align:left;padding:5px 7px;line-height:1.2}
    .dm td{padding:calc(6px*var(--s)) 7px;border-bottom:1px solid ${t.line};vertical-align:top;line-height:1.3}
    .dm tbody tr:nth-child(even) td{background:${t.soft}}
    .dm .dt{width:13%}.dm .n{width:9%;text-align:center}.dm td.dt{font-family:Sora;font-weight:800;color:${t.ink}}.dm td.n{font-family:Sora;font-weight:800;color:${t.primary}}
    .dm .ck{width:6%;text-align:center}
    .sidebox{margin-top:calc(10px*var(--s))}`;
    const html = `${header(t, p.title, p.subtitle, badge)}${strip}<table class="dm"><thead>${head}</thead><tbody>${body}</tbody></table>
      ${m.unconfirmed.length ? `<div class="sidebox">${unconfirmedBox(m.unconfirmed)}</div>` : ""}${notes(p.notesLabel)}`;
    return { html: page(ctx, size, css, html, p.note), size, computed: [], warnings: [] };
  },
};
