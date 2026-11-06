/**
 * release-tracker kit: games or devices by release date, with a column per platform (names as text,
 * never logos), a drawn mark where a title ships on a platform, preorder and "got it" tick boxes, and
 * a month strip of dots for the dated releases. Titles with no announced date are listed in words
 * after the dated ones and are not placed on the strip or counted. Landscape by default.
 *
 * data:
 *   platforms: ["PS5", "Xbox Series X|S", "Switch 2", "PC"]   # 1 to 6, text only
 *   releases:
 *     - date: "2026-11-19"                 # YYYY-MM-DD, or null for "Date not yet announced"
 *       title: "Some Game"
 *       platforms: ["PS5", "PC"]           # a subset of the platforms above
 *       note: "Deluxe edition 3 days early" # optional
 *       src: 1
 *       quote: "Some Game launches Nov. 19 on PS5 and PC"   # the source's words with the date
 *   unconfirmed: [{ label: "Switch 2 version", why: "publisher has not confirmed a date" }]
 */
import { baseCss, header, notes, page, sizeOf, unconfirmedBox } from "./components.js";
import { MON, Problems, dayLabel, esc, isObj, isoDay, isoOf, needQuote, needSource, str, unconfirmedList, type Kit, type Unconfirmed } from "./kit.js";

type Release = { date: Date | null; title: string; platforms: string[]; note?: string };
export type ReleaseTracker = { platforms: string[]; releases: Release[]; unconfirmed: Unconfirmed[] };

export const releaseTracker: Kit<ReleaseTracker> = {
  name: "release-tracker",
  validate(data, ctx) {
    const pr = new Problems("release-tracker");
    if (!isObj(data)) { pr.add("data: needs platforms and releases"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;
    const platforms = Array.isArray(d.platforms) ? d.platforms.filter(str) : [];
    if (platforms.length < 1 || platforms.length > 6 || platforms.length !== (d.platforms as unknown[] | undefined)?.length) pr.add("platforms: 1 to 6 names (text, never logos)");
    if (new Set(platforms).size !== platforms.length) pr.add("platforms: names must differ");
    for (const pp of platforms) if (pp.length > 24) pr.add(`platform "${pp}": up to 24 characters`);

    const releases: Release[] = [];
    if (!Array.isArray(d.releases) || !d.releases.length) pr.add("releases: at least one");
    for (const [i, r] of ((d.releases as unknown[]) ?? []).entries()) {
      const at = `release ${i + 1}`;
      if (!isObj(r)) { pr.add(`${at}: { date, title, platforms, src }`); continue; }
      const label = str(r.title) ? ` "${r.title}"` : "";
      const date = r.date === null || r.date === undefined ? null : isoDay(r.date);
      if (r.date !== null && r.date !== undefined && !date) pr.add(`${at}${label}: date ${JSON.stringify(r.date)} is not a real date (YYYY-MM-DD) or null`);
      if (!str(r.title) || r.title.length > 90) pr.add(`${at}: title, up to 90 characters`);
      if (r.note !== undefined && (!str(r.note) || (r.note as string).length > 90)) pr.add(`${at}${label}: note, up to 90 characters`);
      const plats = Array.isArray(r.platforms) ? r.platforms.filter(str) : [];
      if (!plats.length) pr.add(`${at}${label}: platforms, at least one`);
      for (const pp of plats) if (!platforms.includes(pp)) pr.add(`${at}${label}: "${pp}" is not one of the platforms`);
      needSource(pr, `${at}${label}`, r.src, ctx);
      // A dated release quotes the source for its date; an undated one has no date to check.
      if (date) needQuote(pr, `${at}${label}`, r.quote, ctx, { days: [date] });
      if (str(r.title) && plats.length && plats.every((x) => platforms.includes(x)))
        releases.push({ date: date ?? null, title: r.title, platforms: plats, note: str(r.note) ? r.note : undefined });
    }
    if (releases.length > 50) pr.add(`${releases.length} releases; split into two printables (max 50; long tables continue on more pages)`);
    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    // Dated releases first, in date order; undated ones keep their given order at the end.
    const dated = releases.filter((r) => r.date).sort((a, b) => a.date!.getTime() - b.date!.getTime());
    const undated = releases.filter((r) => !r.date);
    return { platforms, releases: [...dated, ...undated], unconfirmed };
  },

  render(k, p, ctx) {
    const t = ctx.theme, landscape = p.landscape ?? true, size = sizeOf(landscape, ctx.paper);
    const dated = k.releases.filter((r) => r.date) as (Release & { date: Date })[];

    // Month strip: a dot for every dated release across the months it spans, labelled by month.
    let strip = "";
    if (dated.length) {
      const first = dated[0]!.date, last = dated[dated.length - 1]!.date;
      const months: { y: number; m: number }[] = [];
      for (let y = first.getUTCFullYear(), m = first.getUTCMonth(); y < last.getUTCFullYear() || (y === last.getUTCFullYear() && m <= last.getUTCMonth()); m === 11 ? (m = 0, y++) : m++) months.push({ y, m });
      const span = Math.max(1, (last.getUTCFullYear() * 12 + last.getUTCMonth()) - (first.getUTCFullYear() * 12 + first.getUTCMonth()) + 1);
      const X = (dt: Date) => 3 + (((dt.getUTCFullYear() * 12 + dt.getUTCMonth()) - (first.getUTCFullYear() * 12 + first.getUTCMonth())) + (dt.getUTCDate() - 1) / 31) / span * 94;
      const labels = months.map((mo, i) => `<text x="${(3 + (i + 0.5) / span * 94)}%" y="50" text-anchor="middle" font-family="Sora" font-weight="700" font-size="9" fill="${t.muted}">${MON[mo.m]} ${mo.y}</text>`).join("");
      const dots = dated.map((r) => `<circle cx="${X(r.date)}%" cy="24" r="5" fill="${t.primary}"/>`).join("");
      strip = `<svg class="strip" width="100%" height="56" role="img"><title>Dated releases by month</title><line x1="3%" x2="97%" y1="24" y2="24" stroke="${t.line}" stroke-width="3"/>${dots}${labels}</svg>`;
    }

    // Availability mark: a filled square drawn in SVG (shape, not colour alone); the key says so.
    const markOn = `<svg class="mk" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" rx="2" fill="${t.primary}"/></svg>`;
    const head = `<tr><th class="ti">Title</th>${k.platforms.map((pp) => `<th class="pf">${esc(pp)}</th>`).join("")}<th class="dt">Release date</th><th class="ck">Preorder</th><th class="ck">Got it</th></tr>`;
    const bodyRows = k.releases.map((r) => {
      const when = r.date ? dayLabel(r.date) : `<em class="tba">Date not yet announced</em>`;
      const cells = k.platforms.map((pp) => `<td class="pf">${r.platforms.includes(pp) ? markOn : ""}</td>`).join("");
      return `<tr><td class="ti"><b>${esc(r.title)}</b>${r.note ? `<span>${esc(r.note)}</span>` : ""}</td>${cells}<td class="dt">${when}</td><td class="ck"><span class="bx"></span></td><td class="ck"><span class="bx"></span></td></tr>`;
    }).join("");
    const key = `<div class="box"><h3>Key</h3><ul class="kl"><li>${markOn}Released on that platform</li><li><span class="bx"></span>Tick when you preorder or own it</li></ul><p class="kn">Platform names are listed as text; undated titles sit at the foot of the list and are not on the month strip.</p></div>`;

    const css = `${baseCss(t, landscape)}
    .strip{display:block;margin:0 0 calc(6px*var(--s))}
    table.rt{width:100%;border-collapse:collapse;table-layout:fixed;font-size:calc(10.5px*var(--s))}
    .rt th{font-family:Sora;font-size:max(8px,calc(8.8px*var(--s)));text-transform:uppercase;letter-spacing:.05em;color:#fff;background:${t.primary};text-align:left;padding:5px 7px;line-height:1.2}
    .rt th.pf,.rt th.ck{text-align:center}
    .rt td{padding:calc(6px*var(--s)) 7px;border-bottom:1px solid ${t.line};vertical-align:top;line-height:1.3}
    .rt tbody tr:nth-child(even) td{background:${t.soft}}
    .rt .ti b{font-family:Sora;font-weight:800;color:${t.ink};display:block}
    .rt .ti span{color:${t.muted};font-size:.9em;display:block}
    .rt .pf{width:6.5%;text-align:center}
    .rt td.dt{width:14%;font-family:Sora;font-weight:700;color:${t.primary}}
    .rt td.dt .tba{font-style:normal;font-family:Manrope;font-weight:700;color:${t.muted}}
    .rt .ck{width:7%;text-align:center}
    .mk{width:13px;height:13px;vertical-align:middle}
    .kl{list-style:none;margin:0;padding:0;font-size:calc(9.5px*var(--s))}
    .kl li{display:flex;gap:7px;align-items:center;margin:0 0 4px}
    .kn{margin:5px 0 0;font-size:calc(9px*var(--s));color:${t.muted};line-height:1.35}
    .side{display:grid;grid-template-columns:${k.unconfirmed.length ? "1fr 1fr" : "1fr"};gap:10px;margin-top:calc(10px*var(--s))}`;
    const body = `${header(t, p.title, p.subtitle)}${strip}<div class="blk" data-split><table class="rt"><thead>${head}</thead><tbody>${bodyRows}</tbody></table></div>
      <div class="side blk">${key}${unconfirmedBox(k.unconfirmed)}</div>${notes(p.notesLabel)}`;
    return { html: page(ctx, size, css, body, p.note), size, computed: [], warnings: [] };
  },
};
