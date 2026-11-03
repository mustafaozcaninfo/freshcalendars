/**
 * watch-guide kit: games, shows and award nights grouped by day, with the start time in Eastern,
 * Central, Mountain and Pacific Time computed from one sourced moment, the channel and stream in
 * words, and a column to write a pick or a score. Landscape by default.
 *
 * data:
 *   pick: "My pick"                 # last column's label; false for none
 *   events:
 *     - start: "2026-10-31T08:30-04:00"   # the moment the source gives, with its offset
 *       title: "Chelsea v Manchester United"
 *       detail: "Premier League"          # optional: league, round, network note
 *       channel: "USA Network"            # optional
 *       stream: "Peacock"                 # optional
 *       airing: live                      # live (same moment everywhere, default), delayed (East and
 *                                         # Central live, West on tape: "8/7c"), eastern (only the
 *                                         # Eastern time is confirmed)
 *       src: 1
 *   fill: { title: "My picks", labels: ["Entertainer of the Year", "Album of the Year"] }   # optional
 *   unconfirmed: [{ label: "Pacific broadcast", why: "ABC lists 8/7c only" }]
 * Times the kit converts are recorded as computed, so the audit does not ask the story to print them.
 */
import { baseCss, fillLines, header, notes, page, sizeOf, unconfirmedBox } from "./components.js";
import { DOW, DOWFULL, MON, Problems, esc, isObj, isoMoment, needSource, str, unconfirmedList, type Kit, type Unconfirmed } from "./kit.js";

const ZONES = [["ET", "America/New_York"], ["CT", "America/Chicago"], ["MT", "America/Denver"], ["PT", "America/Los_Angeles"]] as const;
const AIRINGS = ["live", "delayed", "eastern"] as const;
type Ev = { start: Date; title: string; detail?: string; channel?: string; stream?: string; airing: (typeof AIRINGS)[number] };
export type WatchGuide = { pick: string | false; events: Ev[]; fill?: { title: string; labels: string[] }; unconfirmed: Unconfirmed[] };

/** Wall clock of a moment in a zone: { ymd, dow, h, min }. */
function wall(d: Date, tz: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(d).map((x) => [x.type, x.value]));
  return { ymd: `${parts.year}-${parts.month!.padStart(2, "0")}-${parts.day!.padStart(2, "0")}`, y: Number(parts.year), m: Number(parts.month) - 1, day: Number(parts.day), dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday!), h: Number(parts.hour), min: Number(parts.minute) };
}
/** "8 p.m.", "8:30 a.m.", "noon", "midnight" (AP style, as the stories write it). */
export function clock(h: number, min: number): string {
  if (min === 0 && h === 12) return "noon";
  if (min === 0 && h === 0) return "midnight";
  const hh = h % 12 || 12;
  return `${hh}${min ? `:${String(min).padStart(2, "0")}` : ""} ${h < 12 ? "a.m." : "p.m."}`;
}

export const watchGuide: Kit<WatchGuide> = {
  name: "watch-guide",
  validate(data, ctx) {
    const pr = new Problems("watch-guide");
    if (!isObj(data) || !Array.isArray(data.events) || !data.events.length) { pr.add("data: needs events"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;
    const events: Ev[] = [];
    for (const [i, e] of (d.events as unknown[]).entries()) {
      const at = `event ${i + 1}`;
      if (!isObj(e)) { pr.add(`${at}: { start, title, channel?, stream?, src }`); continue; }
      const start = isoMoment(e.start);
      if (!start) pr.add(`${at}: start ${JSON.stringify(e.start)} must be an ISO time with its offset, e.g. 2026-11-18T20:00-05:00`);
      if (!str(e.title) || e.title.length > 90) pr.add(`${at}: title, up to 90 characters`);
      for (const k of ["detail", "channel", "stream"] as const) if (e[k] !== undefined && (!str(e[k]) || (e[k] as string).length > 60)) pr.add(`${at}: ${k}, up to 60 characters`);
      const airing = (e.airing ?? "live") as Ev["airing"];
      if (!AIRINGS.includes(airing)) pr.add(`${at}: airing must be ${AIRINGS.join(", ")}`);
      needSource(pr, `${at} "${String(e.title ?? "")}"`, e.src, ctx);
      if (start && str(e.title)) events.push({ start, title: e.title, detail: e.detail as string | undefined, channel: e.channel as string | undefined, stream: e.stream as string | undefined, airing });
    }
    if (events.length > 80) pr.add(`${events.length} events; split into two printables (max 80; long lists continue on more pages)`);
    for (let i = 1; i < events.length; i++) if (events[i]!.start < events[i - 1]!.start) { pr.add(`event ${i + 1} starts before event ${i}; list events in time order`); break; }
    let fill: WatchGuide["fill"];
    if (d.fill !== undefined) {
      const f = d.fill as Record<string, unknown>;
      if (!isObj(f) || !str(f.title) || !Array.isArray(f.labels)) pr.add("fill: { title, labels: [...] }");
      else fill = { title: f.title, labels: f.labels.filter(str) };
    }
    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    return { pick: d.pick === false ? false : str(d.pick) ? d.pick : "My pick", events, fill, unconfirmed };
  },

  render(w, p, ctx) {
    const t = ctx.theme, landscape = p.landscape ?? true, size = sizeOf(landscape);
    const computed = new Set<string>();
    const days = new Map<string, { label: string; rows: string[] }>();
    for (const e of w.events) {
      const et = wall(e.start, ZONES[0][1]);
      const cells = ZONES.map(([abbr, tz], zi) => {
        if (zi > 0 && (e.airing === "eastern" || (e.airing === "delayed" && zi > 1))) return `<td class="z na">Local listings</td>`;
        const c = wall(e.start, tz), text = clock(c.h, c.min);
        if (zi > 0) computed.add(text);
        return `<td class="z${zi === 0 ? " et" : ""}">${text}${c.ymd !== et.ymd ? ` <em>(${DOW[c.dow]})</em>` : ""}</td>`;
      }).join("");
      const watch = [e.channel, e.stream].filter(Boolean).map((x) => esc(x!)).join("<br>");
      const row = `<tr>${cells}<td class="ev"><b>${esc(e.title)}</b>${e.detail ? `<span>${esc(e.detail)}</span>` : ""}</td><td class="tv">${watch}</td>${w.pick ? `<td class="pk"></td>` : ""}</tr>`;
      const day = days.get(et.ymd) ?? { label: `${DOWFULL[et.dow]}, ${MON[et.m]} ${et.day}`, rows: [] };
      day.rows.push(row);
      days.set(et.ymd, day);
    }
    const head = `<tr>${ZONES.map(([z]) => `<th class="z">${z}</th>`).join("")}<th>Event</th><th>Watch on</th>${w.pick ? `<th class="pk">${esc(w.pick)}</th>` : ""}</tr>`;
    const tables = [...days.values()].map((d) => `<div class="blk" data-split><h2 class="sec">${esc(d.label)}</h2><table class="wg"><thead>${head}</thead><tbody>${d.rows.join("")}</tbody></table></div>`).join("");
    const zoneNote = "Eastern Time (ET), Central Time (CT), Mountain Time (MT, Denver; most of Arizona keeps standard time), Pacific Time (PT). Times are converted from the start time the source gives.";
    const side = [w.fill ? fillLines(w.fill.title, w.fill.labels) : "", unconfirmedBox(w.unconfirmed)].filter(Boolean);
    const css = `${baseCss(t, landscape)}
    table.wg{width:100%;border-collapse:collapse;table-layout:fixed;font-size:calc(10.5px*var(--s))}
    .wg th{font-family:Sora;font-size:max(8px,calc(8.8px*var(--s)));text-transform:uppercase;letter-spacing:.06em;color:${t.primary};text-align:left;padding:3px 6px;border-bottom:2px solid ${t.primary}}
    .wg td{padding:calc(5px*var(--s)) 6px;border-bottom:1px solid ${t.line};vertical-align:top;line-height:1.3}
    .wg .z{width:8.5%;white-space:nowrap}.wg td.et{font-family:Sora;font-weight:800;color:${t.ink}}
    .wg td.na{color:${t.muted};font-size:.85em;white-space:normal}.wg em{font-style:normal;color:${t.muted};font-size:.85em}
    .wg .ev b{display:block;font-family:Sora;font-size:1.02em;color:${t.ink}}.wg .ev span{color:${t.muted};font-size:.92em}
    .wg th:nth-child(5){width:auto}.wg th:nth-child(6),.wg .tv{width:19%}.wg .pk{width:15%}
    .wg td.pk{border-left:1px dashed ${t.line}}
    .zn{margin:6px 0 0;font-size:8.6px;color:${t.muted}}
    .sidebox{display:grid;grid-template-columns:repeat(${Math.max(side.length, 1)},1fr);gap:10px;margin-top:calc(10px*var(--s))}`;
    const body = `${header(t, p.title, p.subtitle)}${tables}<p class="zn blk">${zoneNote}</p>${side.length ? `<div class="sidebox blk">${side.join("")}</div>` : ""}${notes(p.notesLabel)}`;
    return { html: page(ctx, size, css, body, p.note), size, computed: [...computed], warnings: [] };
  },
};
