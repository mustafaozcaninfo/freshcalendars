/**
 * bank-holidays kit (uk-canada): a holidays x regions matrix. One row per holiday, one column per
 * region (nations of the UK, Canadian provinces). Each cell shows the computed weekday and date
 * ("Mon., Dec. 28"), a drawn mark when the date is a substitute day, or "Not a holiday" in words when
 * the region does not keep it. A tile row counts the holidays each region keeps. Landscape by
 * default, and drawn to fit A4 as well as US Letter (ctx.paper).
 *
 * data:
 *   regions: ["England and Wales", "Scotland", "Northern Ireland"]   # 1 to 6
 *   holidays:
 *     - name: "Boxing Day"
 *       dates: { "England and Wales": "2026-12-28", "Scotland": "2026-12-28", "Northern Ireland": "2026-12-28" }
 *       substitute: true          # the shown dates are substitute (moved) days
 *       src: 1
 *       quote: "Boxing Day ... substitute day Monday 28 December"    # source's words with the date(s)
 *     - name: "St Andrew's Day"
 *       dates: { "England and Wales": null, "Scotland": "2026-11-30", "Northern Ireland": null }
 *       src: 2
 *       quote: "St Andrew's Day ... Monday 30 November"
 *   unconfirmed: [{ label: "2027 dates", why: "GOV.UK had not published 2027 yet" }]
 */
import { baseCss, header, notes, page, sizeOf, tiles, unconfirmedBox } from "./components.js";
import { Problems, dayLabel, esc, isObj, isoDay, isoOf, needQuote, needSource, str, unconfirmedList, type Kit, type Unconfirmed } from "./kit.js";

type Holiday = { name: string; dates: Map<string, Date | null>; substitute: boolean };
export type BankHolidays = { regions: string[]; holidays: Holiday[]; unconfirmed: Unconfirmed[] };

/** A substitute-day mark: a small diamond outline, drawn as SVG so it reads in grayscale and never
 * depends on a font glyph. */
function subMark(color: string): string {
  return `<svg class="sub" width="11" height="11" viewBox="0 0 11 11" aria-hidden="true"><path d="M5.5 1 L10 5.5 L5.5 10 L1 5.5 Z" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
}

export const bankHolidays: Kit<BankHolidays> = {
  name: "bank-holidays",
  validate(data, ctx) {
    const pr = new Problems("bank-holidays");
    if (!isObj(data)) { pr.add("data: needs regions and holidays"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;

    const regions = Array.isArray(d.regions) ? (d.regions as unknown[]).filter(str) : [];
    if (regions.length < 1 || regions.length > 6 || regions.length !== (d.regions as unknown[] | undefined)?.length) pr.add("regions: 1 to 6 names");
    if (new Set(regions).size !== regions.length) pr.add("regions: names must differ");
    for (const r of regions) if (r.length > 40) pr.add(`region "${r}": up to 40 characters`);

    const holidays: Holiday[] = [];
    if (!Array.isArray(d.holidays) || !d.holidays.length) pr.add("holidays: at least one");
    for (const [i, h] of ((d.holidays as unknown[]) ?? []).entries()) {
      const at = `holiday ${i + 1}`;
      if (!isObj(h)) { pr.add(`${at}: { name, dates, src }`); continue; }
      if (!str(h.name) || h.name.length > 50) pr.add(`${at}: name, up to 50 characters`);
      if (!isObj(h.dates) || !Object.keys(h.dates).length) { pr.add(`${at} "${String(h.name ?? "")}": dates, one per region (date or null)`); continue; }
      const dates = new Map<string, Date | null>();
      for (const [region, v] of Object.entries(h.dates)) {
        if (!regions.includes(region)) { pr.add(`${at} "${String(h.name ?? "")}": "${region}" is not one of the regions`); continue; }
        if (v === null) { dates.set(region, null); continue; }
        const date = isoDay(v);
        if (!date) pr.add(`${at} "${String(h.name ?? "")}" ${region}: ${JSON.stringify(v)} is not a real date (YYYY-MM-DD) or null`);
        else dates.set(region, date);
      }
      const real = [...dates.values()].filter((x): x is Date => x !== null);
      if (!real.length) pr.add(`${at} "${String(h.name ?? "")}": at least one region needs a date (an all-null row is not a holiday anywhere)`);
      if (h.substitute !== undefined && typeof h.substitute !== "boolean") pr.add(`${at} "${String(h.name ?? "")}": substitute must be true or false`);
      needSource(pr, `${at} "${String(h.name ?? "")}"`, h.src, ctx);
      // The quote must hold every distinct date in the row.
      const distinct = [...new Map(real.map((x) => [isoOf(x), x])).values()].sort((a, b) => a.getTime() - b.getTime());
      needQuote(pr, `${at} "${String(h.name ?? "")}"`, h.quote, ctx, { days: distinct });
      if (str(h.name) && h.name.length <= 50 && real.length) holidays.push({ name: h.name, dates, substitute: h.substitute === true });
    }
    if (holidays.length > 40) pr.add(`${holidays.length} holidays; keep it to 40 or fewer (long tables continue on more pages)`);

    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    return { regions, holidays, unconfirmed };
  },

  render(k, p, ctx) {
    const t = ctx.theme, landscape = p.landscape ?? true, size = sizeOf(landscape, ctx.paper);
    const anySub = k.holidays.some((h) => h.substitute);

    // Counts: how many of the listed holidays each region keeps (a dated cell), computed from the data.
    const count = (region: string) => k.holidays.filter((h) => h.dates.get(region) instanceof Date).length;
    const countTiles = tiles(k.regions.map((r) => [String(count(r)), `holidays - ${r}`] as [string, string]));

    const head = `<tr><th class="hn">Holiday</th>${k.regions.map((r) => `<th>${esc(r)}</th>`).join("")}</tr>`;
    const rows = k.holidays.map((h) => {
      const cells = k.regions.map((r) => {
        const v = h.dates.get(r);
        if (v instanceof Date) return `<td class="dy">${dayLabel(v)}${h.substitute ? ` ${subMark(t.primary)}` : ""}</td>`;
        return `<td class="no">Not a holiday</td>`;
      }).join("");
      return `<tr><td class="hn">${esc(h.name)}</td>${cells}</tr>`;
    }).join("");
    const table = `<div class="blk" data-split><h2 class="sec">Bank and statutory holidays by region</h2>
      <table class="bh"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;

    const key = anySub ? `<div class="box key"><h3>Key</h3><ul><li>${subMark(t.primary)}<span>Substitute day - the holiday fell on a weekend, so it is observed on this weekday instead</span></li><li><span class="nokey">Not a holiday</span><span>the region does not keep this holiday</span></li></ul></div>` : "";

    const css = `${baseCss(t, landscape)}
    .tiles b{font-size:calc(18px*var(--s))}
    table.bh{width:100%;border-collapse:collapse;table-layout:fixed;font-size:calc(10.5px*var(--s))}
    .bh th{font-family:Sora;font-size:max(8px,calc(8.8px*var(--s)));text-transform:uppercase;letter-spacing:.05em;color:#fff;background:${t.primary};text-align:left;padding:5px 8px;line-height:1.2}
    .bh td{padding:calc(6px*var(--s)) 8px;border-bottom:1px solid ${t.line};vertical-align:top;line-height:1.3}
    .bh tbody tr:nth-child(even) td{background:${t.soft}}
    .bh .hn{width:24%}.bh td.hn{font-family:Sora;font-weight:700;color:${t.ink}}
    .bh td.dy{font-family:Sora;font-weight:700;color:${t.ink};white-space:nowrap}
    .bh td.no{color:${t.muted}}
    .sub{vertical-align:middle;margin-left:1px}
    .key ul{list-style:none;margin:0;padding:0;font-size:calc(9.5px*var(--s));line-height:1.4}
    .key li{display:flex;gap:7px;align-items:flex-start;margin:0 0 3px}.key li .sub{margin-top:1px;flex:none}
    .nokey{font-family:Sora;font-size:.85em;color:${t.muted};flex:none}
    .side{margin-top:calc(10px*var(--s))}`;

    const sideParts = [key, unconfirmedBox(k.unconfirmed)].filter(Boolean);
    const body = `${header(t, p.title, p.subtitle)}${countTiles}${table}${sideParts.length ? `<div class="side blk">${sideParts.join("")}</div>` : ""}${notes(p.notesLabel)}`;
    return { html: page(ctx, size, css, body, p.note), size, computed: [], warnings: [] };
  },
};
