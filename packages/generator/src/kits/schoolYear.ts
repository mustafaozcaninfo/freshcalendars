/**
 * school-year kit: a district's year at a glance. Mini months with breaks filled, student holidays
 * ringed, remote days dashed and early releases underlined (each also named in the key and in the
 * month's list, so nothing depends on color), computed counts, a days-off-by-month bar chart, a
 * "not yet confirmed" box and fill-in lines for the family's own dates. Portrait.
 *
 * data:
 *   start: "2026-08"            # first month shown
 *   months: 10                  # 6 to 12
 *   events:
 *     - { from: "2026-08-03", kind: first, label: "First day of school", src: 2 }
 *     - { from: "2026-12-21", to: "2027-01-04", kind: break, label: "Holiday Break", src: 1 }
 *   unconfirmed: [{ label: "Last day of school", why: "not on the district's list" }]
 *   family: ["Conferences", "Picture day"]   # optional fill-in labels
 * kinds: first, last, break, holiday, remote (digital learning / no report), early (early release)
 */
import { baseCss, fillLines, header, notes, page, sizeOf, tiles, unconfirmedBox } from "./components.js";
import { DOW, MONTHS, Problems, eachDay, esc, isObj, isoDay, isoOf, needSource, str, unconfirmedList, type Kit, type Unconfirmed } from "./kit.js";

const KINDS = ["first", "last", "break", "holiday", "remote", "early"] as const;
type KindName = (typeof KINDS)[number];
type Ev = { from: Date; to: Date; kind: KindName; label: string };
export type SchoolYear = { start: [number, number]; months: number; events: Ev[]; unconfirmed: Unconfirmed[]; family: string[] };

const KEY: Record<KindName, string> = { first: "First day", last: "Last day", break: "Break (no school)", holiday: "Student holiday", remote: "Digital learning day (no report)", early: "Early release" };
/** School days lost to each kind; first/last are school days and count nothing. */
const OFF: KindName[] = ["break", "holiday", "remote"];
const weekday = (d: Date) => d.getUTCDay() % 6 !== 0;

export const schoolYear: Kit<SchoolYear> = {
  name: "school-year",
  validate(data, ctx) {
    const pr = new Problems("school-year");
    if (!isObj(data)) { pr.add("data: needs start, months and events"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;
    const sm = typeof d.start === "string" ? /^(\d{4})-(\d{2})$/.exec(d.start) : null;
    if (!sm || Number(sm[2]) < 1 || Number(sm[2]) > 12) pr.add('start: "YYYY-MM", the first month on the sheet');
    const months = typeof d.months === "number" ? d.months : 0;
    if (months < 6 || months > 12) pr.add("months: 6 to 12");
    const sy = Number(sm?.[1] ?? 0), smo = Number(sm?.[2] ?? 1) - 1;
    const first = new Date(Date.UTC(sy, smo, 1)), last = new Date(Date.UTC(sy, smo + months, 0));
    const events: Ev[] = [];
    if (!Array.isArray(d.events) || !d.events.length) pr.add("events: at least one");
    for (const [i, e] of ((d.events as unknown[]) ?? []).entries()) {
      const at = `event ${i + 1}`;
      if (!isObj(e)) { pr.add(`${at}: { from, to?, kind, label, src }`); continue; }
      const from = isoDay(e.from), to = e.to === undefined ? from : isoDay(e.to);
      if (!from) pr.add(`${at}: from ${JSON.stringify(e.from)} is not a real date (YYYY-MM-DD)`);
      if (!to) pr.add(`${at}: to ${JSON.stringify(e.to)} is not a real date (YYYY-MM-DD)`);
      if (from && to && to < from) pr.add(`${at}: ends before it starts`);
      if (!KINDS.includes(e.kind as KindName)) pr.add(`${at}: kind must be one of ${KINDS.join(", ")}`);
      if (!str(e.label) || e.label.length > 60) pr.add(`${at}: label, up to 60 characters`);
      needSource(pr, `${at} "${String(e.label ?? "")}"`, e.src, ctx);
      if (from && to && (from < first || to > last)) pr.add(`${at}: ${isoOf(from)} is outside the months shown`);
      if (from && to && to >= from && KINDS.includes(e.kind as KindName) && str(e.label)) events.push({ from, to, kind: e.kind as KindName, label: e.label });
    }
    // One kind per day, so a cell is never two marks at once.
    const seen = new Map<string, string>();
    for (const e of events) for (const day of eachDay(e.from, e.to)) {
      const k = isoOf(day), was = seen.get(k);
      if (was && was !== e.label) pr.add(`${k} is both "${was}" and "${e.label}"; split the range`);
      seen.set(k, e.label);
    }
    for (const e of events) if ((e.kind === "first" || e.kind === "last" || e.kind === "holiday" || e.kind === "remote") && e.from.getTime() === e.to.getTime() && !weekday(e.from)) pr.add(`${e.label} on ${isoOf(e.from)} falls on a ${DOW[e.from.getUTCDay()]}; check the source`);
    const family = Array.isArray(d.family) ? d.family.filter(str) : ["Conferences", "Picture day", "Field trip", "Exams", "Sign-up deadline"];
    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    return { start: [sy, smo], months, events, unconfirmed, family };
  },

  render(k, p, ctx) {
    const t = ctx.theme, landscape = p.landscape ?? false, size = sizeOf(landscape);
    const byDay = new Map<string, Ev>();
    for (const e of k.events) for (const d of eachDay(e.from, e.to)) byDay.set(isoOf(d), e);
    const grids: string[] = [], perMonth: [string, number][] = [];
    for (let i = 0; i < k.months; i++) {
      const y = k.start[0] + Math.floor((k.start[1] + i) / 12), m = (k.start[1] + i) % 12;
      const lead = new Date(Date.UTC(y, m, 1)).getUTCDay(), n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      let cells = "<span></span>".repeat(lead), off = 0;
      for (let d = 1; d <= n; d++) {
        const day = new Date(Date.UTC(y, m, d)), e = byDay.get(isoOf(day));
        if (e && OFF.includes(e.kind) && weekday(day)) off++;
        cells += `<span class="${e ? `k-${e.kind}` : ""}${weekday(day) ? "" : " we"}">${d}</span>`;
      }
      perMonth.push([MONTHS[m]!.slice(0, 3), off]);
      const lines = k.events.filter((e) => eachDay(e.from, e.to).some((d) => d.getUTCFullYear() === y && d.getUTCMonth() === m)).map((e) => {
        const ds = eachDay(e.from, e.to).filter((d) => d.getUTCFullYear() === y && d.getUTCMonth() === m).map((d) => d.getUTCDate());
        return `<li><b>${ds.length > 1 ? `${ds[0]}-${ds[ds.length - 1]}` : ds[0]}</b> ${esc(e.label)}</li>`;
      }).join("");
      grids.push(`<div class="mo"><h2>${MONTHS[m]} ${y}</h2><div class="dw">${"SMTWTFS".split("").map((x) => `<i>${x}</i>`).join("")}</div><div class="g">${cells}</div><ul>${lines}</ul></div>`);
    }
    const count = (kind: KindName) => k.events.filter((e) => e.kind === kind).flatMap((e) => eachDay(e.from, e.to)).filter(weekday).length;
    const stat: [string, string][] = [[String(count("break")), "weekdays of scheduled breaks"], [String(count("holiday")), "student holidays (weekdays)"]];
    if (count("remote")) stat.push([String(count("remote")), "digital learning days, no report"]);
    if (count("early")) stat.push([String(count("early")), "early-release days"]);
    const kinds = KINDS.filter((x) => k.events.some((e) => e.kind === x));
    const key = `<div class="box"><h3>Key</h3><ul class="kl">${kinds.map((x) => `<li><span class="sw k-${x}">8</span>${KEY[x]}</li>`).join("")}</ul></div>`;
    // Bar chart of weekdays off per month: plain SVG rects, the number printed on each bar.
    const max = Math.max(1, ...perMonth.map(([, n]) => n)), bw = 100 / perMonth.length;
    const bars = perMonth.map(([lab, n], i) => {
      const h = (n / max) * 40, x = i * bw;
      return `<rect x="${x + bw * 0.18}%" y="${58 - h}" width="${bw * 0.64}%" height="${Math.max(h, 0.8)}" rx="2" fill="${t.primary}"/>
        <text x="${x + bw / 2}%" y="${n ? 58 - h - 4 : 55}" text-anchor="middle" font-family="Sora" font-weight="800" font-size="9" fill="${t.ink}">${n}</text>
        <text x="${x + bw / 2}%" y="72" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="8.5" fill="${t.muted}">${lab}</text>`;
    }).join("");
    const chart = `<div class="box chart"><h3>Weekdays with no school, by month</h3><svg width="100%" height="78" aria-hidden="false" role="img"><title>Weekdays with no school by month</title>${bars}</svg></div>`;
    const css = `${baseCss(t, landscape)}
    .yr{display:grid;grid-template-columns:repeat(4,1fr);gap:calc(8px*var(--s)) 12px}
    .mo h2{font-family:Sora;font-size:calc(11px*var(--s));margin:0 0 2px;color:${t.ink}}
    .dw,.g{display:grid;grid-template-columns:repeat(7,1fr);text-align:center}
    .dw i{font-style:normal;font-family:Sora;font-size:8px;color:${t.muted}}
    .g span{font-size:9px;height:calc(17px*var(--s));margin:1px;border-radius:4px;color:${t.ink};font-weight:700;display:flex;align-items:center;justify-content:center}
    .g span.we{color:${t.muted}}
    .k-break{background:${t.primary};color:#fff!important}
    .k-first,.k-last{background:${t.ink};color:#fff!important}
    .k-holiday{border:1.8px solid ${t.primary};border-radius:50%!important;color:${t.primary}!important}
    .k-remote{border:1.5px dashed ${t.ink}}
    .k-early{border-bottom:3px solid ${t.accent};border-radius:0!important}
    .mo ul{list-style:none;margin:2px 0 0;padding:0;font-size:8.5px;line-height:1.3}
    .mo ul b{font-family:Sora;color:${t.primary}}
    .side{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:10px;margin-top:calc(10px*var(--s))}
    .kl li{display:flex;gap:6px;align-items:center}
    .sw{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;font-size:9px;border-radius:4px;font-weight:700;flex:none}
    .chart{margin-top:calc(10px*var(--s))}`;
    const body = `${header(t, p.title, p.subtitle)}${tiles(stat)}<div class="yr">${grids.join("")}</div>
      ${chart}<div class="side">${key}${unconfirmedBox(k.unconfirmed) || fillLines("More dates", ["", ""])}${fillLines("My family's dates", k.family)}</div>${notes(p.notesLabel)}`;
    // The chart's counts sit next to month labels, so the PDF's text reads "Aug 1 Sep 5": record those
    // label-count pairs as computed, or 10-PDF-FACTS takes them for dates the story never gives.
    const computed = perMonth.flatMap(([lab, n], i) => [`${lab} ${n}`, ...(i + 1 < perMonth.length ? [`${lab} ${perMonth[i + 1]![1]}`] : [])]);
    return { html: page(ctx, size, css, body, p.note), size, computed, warnings: [] };
  },
};
