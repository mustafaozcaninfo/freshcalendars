/**
 * clock-change kit: a one-page sheet for a daylight saving time change. Two analog clock faces drawn
 * in SVG show the before and after time (the hands are computed from the change moment); a per-city
 * table gives sunrise and sunset the day before and the day after, read from the saved U.S. Naval
 * Observatory data and never typed; a checklist lists the clocks and devices to change by hand; and a
 * box names the next change. Portrait.
 *
 * `change.at` is the time the clocks READ right after the jump, with the offset then in effect:
 * 1:00 a.m. standard for a fall-back ("2026-11-01T01:00-05:00"), 3:00 a.m. daylight for a
 * spring-forward ("2027-03-14T03:00-04:00"). The sheet draws that face and the 2:00 a.m. face it came
 * from. Written this way the offset is one a real U.S. zone uses at that instant, so offsetProblem
 * passes (the 2:00 a.m. instant itself has no settled offset).
 *
 * data:
 *   change:
 *     at: "2026-11-01T01:00-05:00"        # clocks fall back to 1:00 a.m.
 *     direction: back                     # "back" (fall back) or "forward" (spring forward)
 *     src: 1
 *     quote: "clocks fell back one hour at 2 a.m. on Sunday, Nov. 1, 2026"   # holds the change date
 *   next: { at: "2027-03-14T03:00-04:00", src: 2, quote: "daylight saving time begins March 14, 2027" }  # optional
 *   cities:
 *     - { city: "New York", tz: "America/New_York" }   # the day before and after come from the change date
 *   devices: ["Oven", "Microwave", "Car clock"]        # optional checklist labels
 *   unconfirmed: [{ label: "...", why: "..." }]
 */
import usno from "../data/usno-2026-27.json" with { type: "json" };
import { baseCss, fillLines, header, notes, page, sizeOf, unconfirmedBox } from "./components.js";
import {
  DAY_MS, MON, Problems, dayLabel, esc, isObj, isoMoment, isoOf, needQuote, needSource, offsetProblem,
  str, unconfirmedList, type Kit, type Unconfirmed,
} from "./kit.js";

type Rec = { rise: string | null; set: string | null; mrise: string | null; mset: string | null; illum: string; phase: string; tz: number };
type UsnoFile = { cities?: Record<string, Record<string, Rec>>; earliest?: Record<string, Record<string, Rec>>; series?: Record<string, Record<string, Rec>> };
const U = usno as UsnoFile;
function cityRecords(city: string): Record<string, Rec> | null {
  if (!(U.cities?.[city] || U.earliest?.[city] || U.series?.[city])) return null;
  return { ...(U.series?.[city] || {}), ...(U.earliest?.[city] || {}), ...(U.cities?.[city] || {}) };
}
const recordFor = (city: string, day: string): Rec | null => cityRecords(city)?.[day] ?? null;
const validZone = (tz: unknown): boolean => { if (!str(tz)) return false; try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; } };

type City = { city: string; before: Rec; after: Rec };
export type ClockChange = {
  change: { at: Date; atIso: string; direction: "back" | "forward" };
  next?: { atIso: string; day: Date };
  changeDay: Date; dayBefore: Date; dayAfter: Date;
  cities: City[]; devices: string[]; unconfirmed: Unconfirmed[];
};

const DIRS = ["back", "forward"] as const;
const DEFAULT_DEVICES = ["Oven and microwave", "Car dashboard clock", "Wall and alarm clocks", "Thermostat", "Watch", "Coffee maker"];

export const clockChange: Kit<ClockChange> = {
  name: "clock-change",
  validate(data, ctx) {
    const pr = new Problems("clock-change");
    if (!isObj(data)) { pr.add("data: needs change and cities"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;

    const ch = d.change as Record<string, unknown> | undefined;
    let changeDay: Date | undefined, at: Date | undefined;
    if (!isObj(ch)) pr.add("change: { at, direction, src, quote }");
    else {
      at = isoMoment(ch.at) ?? undefined;
      if (!at) pr.add(`change.at ${JSON.stringify(ch.at)} must be an ISO moment with its offset (the time clocks read after the change, e.g. 2026-11-01T01:00-05:00)`);
      else { const o = offsetProblem(ch.at as string, ctx.category); if (o) pr.add(`change.at: ${o} (write the time the clocks land on, with the offset then in effect)`); }
      if (!DIRS.includes(ch.direction as "back" | "forward")) pr.add('change.direction: "back" (fall back) or "forward" (spring forward)');
      needSource(pr, "change", ch.src, ctx);
      if (at) { changeDay = new Date(`${(ch.at as string).slice(0, 10)}T00:00:00Z`); needQuote(pr, "change", ch.quote, ctx, { days: [changeDay] }); }
    }

    let next: ClockChange["next"];
    if (d.next !== undefined) {
      const nx = d.next as Record<string, unknown>;
      const nat = isObj(nx) ? isoMoment(nx.at) : null;
      if (!nat) pr.add("next.at must be an ISO moment with its offset");
      else { const o = offsetProblem(nx.at as string, ctx.category); if (o) pr.add(`next.at: ${o}`); }
      if (isObj(nx)) {
        needSource(pr, "next", nx.src, ctx);
        if (nat) { const day = new Date(`${(nx.at as string).slice(0, 10)}T00:00:00Z`); needQuote(pr, "next", nx.quote, ctx, { days: [day] }); next = { atIso: nx.at as string, day }; }
      }
    }

    const dayBefore = changeDay ? new Date(changeDay.getTime() - DAY_MS) : undefined;
    const dayAfter = changeDay ? new Date(changeDay.getTime() + DAY_MS) : undefined;
    const cities: City[] = [];
    if (!Array.isArray(d.cities) || !d.cities.length) pr.add("cities: at least one { city, tz }");
    const seen = new Set<string>();
    for (const [i, c] of ((d.cities as unknown[]) ?? []).entries()) {
      const at2 = `city ${i + 1}`;
      if (!isObj(c)) { pr.add(`${at2}: { city, tz }`); continue; }
      const name = c.city;
      if (!str(name)) { pr.add(`${at2}: city, a name as the USNO file spells it`); continue; }
      if (!validZone(c.tz)) pr.add(`${at2} (${name}): tz must be an IANA zone, e.g. "America/New_York"`);
      if (seen.has(name)) pr.add(`${at2}: ${name} is listed twice`);
      seen.add(name);
      if (!cityRecords(name)) { pr.add(`${at2}: "${name}" is not in usno-2026-27.json; add it from the USNO API (aa.usno.navy.mil) - do not type its times`); continue; }
      if (!dayBefore || !dayAfter) continue;
      const before = recordFor(name, isoOf(dayBefore)), after = recordFor(name, isoOf(dayAfter));
      if (!before) { pr.add(`${at2}: ${name} has no ${isoOf(dayBefore)} in usno-2026-27.json; fetch it from the USNO API - do not type its times`); continue; }
      if (!after) { pr.add(`${at2}: ${name} has no ${isoOf(dayAfter)} in usno-2026-27.json; fetch it from the USNO API - do not type its times`); continue; }
      cities.push({ city: name, before, after });
    }

    if (cities.length > 12) pr.add(`${cities.length} cities; keep it to 12 (the table continues on more pages)`);
    let devices = DEFAULT_DEVICES;
    if (d.devices !== undefined) {
      if (!Array.isArray(d.devices) || d.devices.some((x) => !str(x) || (x as string).length > 40)) pr.add("devices: a list of short labels (up to 40 characters each)");
      else { devices = (d.devices as string[]); if (devices.length > 12) pr.add("devices: up to 12"); }
    }

    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    return {
      change: { at: at!, atIso: (ch!.at as string), direction: ch!.direction as "back" | "forward" },
      next, changeDay: changeDay!, dayBefore: dayBefore!, dayAfter: dayAfter!, cities, devices, unconfirmed,
    };
  },

  render(c, p, ctx) {
    const t = ctx.theme, size = sizeOf(p.landscape ?? false, ctx.paper);
    const computed = new Set<string>();
    const note = (v: string) => { computed.add(v); return v; };

    // Clock faces: the after time from the change moment, the before time one hour away in the other direction.
    const afterHM = clockOfHM(c.change.atIso);
    const beforeMin = c.change.direction === "back" ? afterHM.min + afterHM.h * 60 + 60 : afterHM.h * 60 + afterHM.min - 60;
    const before = { h: Math.floor(((beforeMin % 1440) + 1440) % 1440 / 60), min: ((beforeMin % 60) + 60) % 60 };
    const afterLabel = note(fmtClock(afterHM.h, afterHM.min)), beforeLabel = note(fmtClock(before.h, before.min));
    const phrase = c.change.direction === "back" ? "fall back one hour" : "spring forward one hour";
    const clocks = `<div class="clocks blk">
      <div class="cl"><svg viewBox="0 0 120 120" width="118" height="118" role="img"><title>Clock before the change</title>${clockFace(60, 60, 52, before.h, before.min, t)}</svg><p class="cap"><b>Before</b><br>${beforeLabel}</p></div>
      <div class="arrow"><svg viewBox="0 0 60 40" width="56" height="38" aria-hidden="true"><line x1="6" y1="20" x2="48" y2="20" stroke="${t.primary}" stroke-width="3"/><polygon points="48,12 58,20 48,28" fill="${t.primary}"/></svg><span>clocks ${phrase}</span></div>
      <div class="cl"><svg viewBox="0 0 120 120" width="118" height="118" role="img"><title>Clock after the change</title>${clockFace(60, 60, 52, afterHM.h, afterHM.min, t, true)}</svg><p class="cap"><b>After</b><br>${afterLabel}</p></div></div>`;

    // Sunrise and sunset the day before and after, read straight from USNO (local clock time).
    const hb = dayLabel(c.dayBefore), ha = dayLabel(c.dayAfter);
    note(hb); note(ha);
    const rows = c.cities.map((ci) => {
      const cells = [ci.before.rise, ci.before.set, ci.after.rise, ci.after.set].map((v) => v ? note(fmtClock24(v)) : "—");
      return `<tr><td class="ct">${esc(ci.city)}</td><td class="k">${cells[0]}</td><td>${cells[1]}</td><td class="k">${cells[2]}</td><td>${cells[3]}</td></tr>`;
    }).join("");
    const table = `<div class="blk" data-split><table class="cc"><thead>
      <tr><th rowspan="2">City</th><th colspan="2">${esc(hb)}</th><th colspan="2">${esc(ha)}</th></tr>
      <tr><th class="sub">Sunrise</th><th class="sub">Sunset</th><th class="sub">Sunrise</th><th class="sub">Sunset</th></tr>
      </thead><tbody>${rows}</tbody></table></div>`;

    const banner = `<div class="box blk"><h3>What happens</h3><p>At 2:00 a.m. on ${esc(dayLabel(c.changeDay))}, clocks ${phrase}, ${c.change.direction === "back" ? "so the hour from 1 to 2 a.m. repeats and mornings get lighter" : "so the hour from 2 to 3 a.m. is skipped and evenings stay lighter"}. Most phones and computers change on their own; the devices below do not.</p></div>`;

    const devices = fillLines("Clocks and devices to change by hand", c.devices);
    const nextBox = c.next
      ? `<div class="box"><h3>Next change</h3><p>${esc(dayLabel(c.next.day))}: clocks ${c.change.direction === "back" ? "spring forward one hour" : "fall back one hour"}.</p></div>`
      : "";
    const side = [devices, nextBox, c.unconfirmed.length ? unconfirmedBox(c.unconfirmed) : ""].filter(Boolean);
    const sourceNote = "Sunrise and sunset: U.S. Naval Observatory, local clock time (daylight time the day before, standard time the day after for a fall-back; the reverse for a spring-forward).";

    const css = `${baseCss(t, false)}
    .clocks{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:calc(8px*var(--s)) 0;border:1.4px solid ${t.line};border-radius:12px;padding:calc(10px*var(--s)) 8px}
    .cl{text-align:center}.cl svg{display:block;margin:0 auto}
    .cap{margin:4px 0 0;font-size:calc(10px*var(--s));color:${t.ink};line-height:1.25}.cap b{font-family:Sora;color:${t.primary}}
    .arrow{text-align:center;color:${t.muted};font-size:calc(9.5px*var(--s))}.arrow svg{display:block;margin:0 auto 2px}
    table.cc{width:100%;border-collapse:collapse;table-layout:fixed;font-size:calc(10.5px*var(--s))}
    .cc th{font-family:Sora;font-size:max(8px,calc(8.8px*var(--s)));color:#fff;background:${t.primary};text-align:center;padding:4px 6px;line-height:1.15;border-left:1px solid ${t.soft}}
    .cc th.sub{font-size:max(8px,calc(8.2px*var(--s)));font-weight:600;text-transform:uppercase;letter-spacing:.03em}
    .cc td{padding:calc(5px*var(--s)) 6px;border-bottom:1px solid ${t.line};text-align:center;line-height:1.3}
    .cc tbody tr:nth-child(even) td{background:${t.soft}}
    .cc .ct{font-family:Sora;font-weight:800;color:${t.ink};text-align:left}.cc td.k{font-family:Sora;font-weight:800;color:${t.primary}}
    .cc th:first-child,.cc .ct{width:24%}
    .ccside{display:grid;grid-template-columns:repeat(${Math.max(side.length, 1)},1fr);gap:10px;margin-top:calc(10px*var(--s))}
    .ccnote{margin:6px 0 0;font-size:8.6px;color:${t.muted};line-height:1.45}`;

    const badge = `${c.change.direction === "back" ? "Fall back" : "Spring forward"}<br>${MON[c.changeDay.getUTCMonth()]} ${c.changeDay.getUTCDate()}`;
    const body = `${header(t, p.title, p.subtitle, badge)}${banner}${clocks}
      <h2 class="sec">Sunrise and sunset, the day before and after</h2>${table}<p class="ccnote blk">${esc(sourceNote)}</p>
      <div class="ccside blk">${side.join("")}</div>${notes(p.notesLabel)}`;
    return { html: page(ctx, size, css, body, p.note), size, computed: [...computed], warnings: [] };
  },
};

const clockOfHM = (iso: string) => { const m = /T(\d{2}):(\d{2})/.exec(iso); return { h: m ? Number(m[1]) : 0, min: m ? Number(m[2]) : 0 }; };
/** AP-style clock from hour and minute numbers. */
function fmtClock(h: number, min: number): string {
  if (min === 0 && h === 12) return "noon";
  if (min === 0 && h === 0) return "midnight";
  return `${h % 12 || 12}${min ? `:${String(min).padStart(2, "0")}` : ""} ${h < 12 ? "a.m." : "p.m."}`;
}
const fmtClock24 = (hm: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(hm); return m ? fmtClock(Number(m[1]), Number(m[2])) : "—"; };

/** An analog clock face: 12 ticks, 12/3/6/9 numerals, and hour and minute hands computed from h and min. */
function clockFace(cx: number, cy: number, R: number, h: number, min: number, t: { primary: string; ink: string; muted: string; line: string }, accent = false): string {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = i * 30 * (Math.PI / 180), s = i % 3 === 0 ? R - 10 : R - 6;
    return `<line x1="${(cx + Math.sin(a) * s).toFixed(1)}" y1="${(cy - Math.cos(a) * s).toFixed(1)}" x2="${(cx + Math.sin(a) * (R - 3)).toFixed(1)}" y2="${(cy - Math.cos(a) * (R - 3)).toFixed(1)}" stroke="${t.muted}" stroke-width="${i % 3 === 0 ? 2.4 : 1.3}"/>`;
  }).join("");
  const nums = [["12", 0], ["3", 90], ["6", 180], ["9", 270]].map(([n, deg]) => {
    const a = (deg as number) * (Math.PI / 180), nx = cx + Math.sin(a) * (R - 18), ny = cy - Math.cos(a) * (R - 18);
    return `<text x="${nx.toFixed(1)}" y="${(ny + 4).toFixed(1)}" text-anchor="middle" font-family="Sora" font-weight="700" font-size="11" fill="${t.ink}">${n}</text>`;
  }).join("");
  const ha = ((h % 12) + min / 60) * 30 * (Math.PI / 180), ma = min * 6 * (Math.PI / 180);
  const hand = (a: number, len: number, w: number, col: string) => `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.sin(a) * len).toFixed(1)}" y2="${(cy - Math.cos(a) * len).toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const hourCol = accent ? t.primary : t.ink;
  return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#ffffff" stroke="${t.primary}" stroke-width="2.4"/>${ticks}${nums}${hand(ha, R - 22, 4, hourCol)}${hand(ma, R - 12, 2.6, t.ink)}<circle cx="${cx}" cy="${cy}" r="3.2" fill="${t.primary}"/>`;
}
