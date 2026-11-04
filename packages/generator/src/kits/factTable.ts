/**
 * fact-table kit: a sourced reference table that is not about dates (SNAP allotments by household
 * size, fees by tier, limits by category). One row per fact, every row with its source, numbers
 * printed exactly as the source gives them (no rounding). The table is splittable, so a long table
 * repeats its column heads on the next page. One column may be highlighted (drawn bold, never by
 * color alone). Optional note lines, a "not yet confirmed" box and a notes area. Portrait or
 * landscape.
 *
 * Unlike the dated kits this one carries no dates, so `quote` is optional; but when a row gives a
 * quote, every dollar amount and percentage in its cells must appear in that quote (checked with
 * factTokens), so a figure mistyped into a cell is caught before it is printed.
 *
 * data:
 *   columns:
 *     - { key: household, label: "Household size" }           # highlight target, left-aligned
 *     - { key: max, label: "Maximum monthly allotment", align: right }
 *     - { key: gross, label: "Gross income limit", align: right }
 *   highlight: household                                       # optional: a column key to emphasize
 *   rows:
 *     - cells: { household: "4 people", max: "$1,023", gross: "$3,575" }
 *       src: 1
 *       quote: "$1,023 for four ... gross monthly income limit ... $3,575 for four"   # holds every $ and %
 *   note: ["Amounts are for the 48 states and DC."]            # optional note lines (our wording)
 *   unconfirmed: [{ label: "FY2026 figures", why: "not on the FNS pages we read" }]
 */
import { baseCss, header, notes, page, sizeOf, unconfirmedBox } from "./components.js";
import { Problems, esc, isObj, needSource, str, unconfirmedList, type Kit, type Unconfirmed } from "./kit.js";
import { factTokens } from "../../../../scripts/lib/print-record.mjs";

type Col = { key: string; label: string; align: "left" | "right" };
type Row = { cells: Record<string, string> };
export type FactTable = { columns: Col[]; highlight?: string; rows: Row[]; note: string[]; unconfirmed: Unconfirmed[] };

/** The dollar amounts and percentages in a text, as "$:1023" / "%:130" tokens. */
const moneyPct = (text: string): string[] => [...factTokens(text, { story: true }) as Set<string>].filter((k) => k.startsWith("$:") || k.startsWith("%:"));
/** A token like "$:1023" or "%:130" shown as "$1023" / "130%", for the problem message. */
const showMoney = (k: string) => k.startsWith("$:") ? `$${k.slice(2)}` : `${k.slice(2)}%`;

export const factTable: Kit<FactTable> = {
  name: "fact-table",
  validate(data, ctx) {
    const pr = new Problems("fact-table");
    if (!isObj(data)) { pr.add("data: needs columns and rows"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;

    // Columns: 2 to 6, each { key, label, align? }; keys are identifiers and must differ.
    const columns: Col[] = [];
    const raw = Array.isArray(d.columns) ? d.columns : [];
    if (raw.length < 2 || raw.length > 6) pr.add("columns: 2 to 6 of { key, label, align? }");
    for (const [i, c] of raw.entries()) {
      const at = `column ${i + 1}`;
      if (!isObj(c)) { pr.add(`${at}: { key, label, align? }`); continue; }
      if (!str(c.key) || !/^[a-z][a-z0-9_]*$/i.test(c.key as string)) pr.add(`${at}: key, a short identifier (letters, digits, underscore)`);
      if (!str(c.label) || (c.label as string).length > 40) pr.add(`${at}: label, up to 40 characters`);
      if (c.align !== undefined && c.align !== "left" && c.align !== "right") pr.add(`${at}: align must be left or right`);
      if (str(c.key) && str(c.label) && (c.label as string).length <= 40) columns.push({ key: c.key as string, label: c.label as string, align: c.align === "right" ? "right" : "left" });
    }
    if (new Set(columns.map((c) => c.key)).size !== columns.length) pr.add("columns: keys must differ");
    const keys = new Set(columns.map((c) => c.key));

    let highlight: string | undefined;
    if (d.highlight !== undefined) {
      if (!str(d.highlight) || !keys.has(d.highlight)) pr.add(`highlight: ${JSON.stringify(d.highlight)} is not one of the column keys`);
      else highlight = d.highlight;
    }

    // Rows: 1 to 60; each cell printed verbatim (no rounding). The quote, when given, must hold the
    // row's money and percent values so a mistyped figure is caught.
    const rows: Row[] = [];
    if (!Array.isArray(d.rows) || !d.rows.length) pr.add("rows: at least one { cells, src }");
    for (const [i, r] of ((d.rows as unknown[]) ?? []).entries()) {
      const at = `row ${i + 1}`;
      if (!isObj(r)) { pr.add(`${at}: { cells, src }`); continue; }
      if (!isObj(r.cells) || !Object.keys(r.cells).length) { pr.add(`${at}: cells, at least one`); continue; }
      const cells: Record<string, string> = {};
      for (const [k, v] of Object.entries(r.cells)) {
        if (!keys.has(k)) pr.add(`${at}: "${k}" is not one of the columns`);
        if (!str(v) || (v as string).length > 90) pr.add(`${at} ${k}: text up to 90 characters`);
        else cells[k] = v as string;
      }
      needSource(pr, at, r.src, ctx);
      if (str(r.quote)) {
        if ((r.quote as string).length < 6) pr.add(`${at}: quote must be the source's own words`);
        else {
          const have = new Set(moneyPct(r.quote as string));
          const want = moneyPct(Object.values(cells).join(" "));
          for (const k of want) if (!have.has(k)) pr.add(`${at}: the quote does not say ${showMoney(k)} ("${(r.quote as string).slice(0, 60)}"); check the figure against the source`);
        }
      } else if (r.quote !== undefined) pr.add(`${at}: quote must be the source's own words`);
      if (Object.keys(cells).length) rows.push({ cells });
    }
    if (rows.length > 60) pr.add(`${rows.length} rows; keep it to 60 (long tables continue on more pages)`);

    const note = Array.isArray(d.note) ? (d.note as unknown[]).filter(str) as string[] : [];
    if (note.length > 6) pr.add("note: up to 6 lines");
    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    return { columns, highlight, rows, note, unconfirmed };
  },

  render(k, p, ctx) {
    const t = ctx.theme, landscape = p.landscape ?? false, size = sizeOf(landscape, ctx.paper);
    const head = `<tr>${k.columns.map((c) => `<th class="${c.align === "right" ? "r" : "l"}${c.key === k.highlight ? " hi" : ""}">${esc(c.label)}</th>`).join("")}</tr>`;
    const bodyRows = k.rows.map((r) => `<tr>${k.columns.map((c) => `<td class="${c.align === "right" ? "r" : "l"}${c.key === k.highlight ? " hi" : ""}">${r.cells[c.key] ? esc(r.cells[c.key]!) : ""}</td>`).join("")}</tr>`).join("");
    // No heading above the table: the column heads carry the context and repeat on each continued page.
    const table = `<div class="blk" data-split><table class="ft"><thead>${head}</thead><tbody>${bodyRows}</tbody></table></div>`;
    const noteBox = k.note.length ? `<div class="box blk note"><ul>${k.note.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : "";
    const css = `${baseCss(t, landscape)}
    table.ft{width:100%;border-collapse:collapse;table-layout:fixed;font-size:calc(11px*var(--s))}
    .ft th{font-family:Sora;font-size:max(9px,calc(9.4px*var(--s)));text-transform:uppercase;letter-spacing:.04em;color:#fff;background:${t.primary};text-align:left;padding:calc(6px*var(--s)) 9px;line-height:1.2;vertical-align:bottom}
    .ft td{padding:calc(7px*var(--s)) 9px;border-bottom:1px solid ${t.line};vertical-align:top;line-height:1.3;color:${t.ink}}
    .ft tbody tr:nth-child(even) td{background:${t.soft}}
    .ft .r{text-align:right;font-variant-numeric:tabular-nums}
    .ft td.hi{font-family:Sora;font-weight:800;color:${t.primary}}
    .ft th.r{text-align:right}
    .note ul{list-style:none;margin:0;padding:0;font-size:calc(9.5px*var(--s));line-height:1.4}
    .note li{margin:0 0 3px;padding-left:12px;position:relative}
    .note li::before{content:"";position:absolute;left:2px;top:6px;width:4px;height:4px;border-radius:50%;background:${t.primary}}`;
    const body = `${header(t, p.title, p.subtitle)}${table}${noteBox}${k.unconfirmed.length ? `<div class="blk">${unconfirmedBox(k.unconfirmed)}</div>` : ""}${notes(p.notesLabel)}`;
    return { html: page(ctx, size, css, body, p.note), size, computed: [], warnings: [] };
  },
};
