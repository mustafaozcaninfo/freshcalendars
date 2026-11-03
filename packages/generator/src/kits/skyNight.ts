/**
 * sky-night kit: a one-page viewing log for a night-sky event (a meteor shower, eclipse, supermoon
 * or bright planet). A peak banner names the window and the rate; a per-city table gives the local
 * moonset, the time the sky is dark until (dawn) and the Moon's lit fraction, all read from the saved
 * U.S. Naval Observatory data and never typed; the Moon is drawn as a vector disc from its lit
 * fraction, a compass rose points where to look, and a 15-minute tally grid and a checklist fill the
 * rest. Portrait.
 *
 * Every Moon and Sun time, and the lit fraction, come from packages/generator/src/data/usno-2026-27.json
 * by city and date. A city or date that is not in that file stops the sheet with a message to add it
 * from the USNO API (aa.usno.navy.mil) - the kit never guesses a rise, set or illumination.
 *
 * data:
 *   event: "Geminid meteor shower"        # optional short subject, shown in a tile
 *   peak:
 *     from: "2026-12-13T22:00-05:00"      # window start, an ISO moment with its offset
 *     to:   "2026-12-14T06:00-05:00"      # window end
 *     src: 1
 *     quote: "the 2026 Geminid peak as the night of Dec. 13-14"   # source's words, holds both dates
 *   rate: { text: "40 to 50 meteors an hour in dark skies", src: 3, quote: "40 to 50 Geminids per hour" }  # optional
 *   look: { direction: "SE", altitude: "halfway up", src: 3, quote: "..." }                                 # optional
 *   cities:
 *     - { city: "New York", tz: "America/New_York", date: "2026-12-13" }   # the evening you go out
 *   unconfirmed: [{ label: "Peak hour", why: "NASA has not published an official peak hour" }]
 */
import usno from "../data/usno-2026-27.json" with { type: "json" };
import { baseCss, header, notes, page, sizeOf, tiles, unconfirmedBox } from "./components.js";
import {
  DOW, MON, Problems, dayLabel, esc, isObj, isoDay, isoMoment, isoOf, needQuote, needSource,
  offsetProblem, str, unconfirmedList, type Kit, type Unconfirmed,
} from "./kit.js";

type Rec = { rise: string | null; set: string | null; mrise: string | null; mset: string | null; illum: string; phase: string; tz: number };
type UsnoFile = { cities?: Record<string, Record<string, Rec>>; earliest?: Record<string, Record<string, Rec>>; series?: Record<string, Record<string, Rec>> };
const U = usno as UsnoFile;

/** Every date saved for a city, across the file's three blocks (the specific, the window and the series). */
function cityRecords(city: string): Record<string, Rec> | null {
  const has = (U.cities?.[city] || U.earliest?.[city] || U.series?.[city]) ? true : false;
  if (!has) return null;
  return { ...(U.series?.[city] || {}), ...(U.earliest?.[city] || {}), ...(U.cities?.[city] || {}) };
}
const recordFor = (city: string, day: string): Rec | null => cityRecords(city)?.[day] ?? null;

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
type Dir = (typeof COMPASS)[number];
type City = { city: string; tz: string; date: Date; rec: Rec; nextRise: string | null };
type Peak = { from: Date; to: Date; fromIso: string; toIso: string };
type Fact = { text: string };
export type SkyNight = {
  event?: string; peak: Peak; rate?: Fact; look?: { direction: Dir; altitude: string }; cities: City[]; unconfirmed: Unconfirmed[];
};

const validZone = (tz: unknown): boolean => {
  if (!str(tz)) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
};

export const skyNight: Kit<SkyNight> = {
  name: "sky-night",
  validate(data, ctx) {
    const pr = new Problems("sky-night");
    if (!isObj(data)) { pr.add("data: needs peak and cities"); pr.throwIfAny(); }
    const d = data as Record<string, unknown>;

    // Peak window: two ISO moments, ordered, offsets that a real zone uses that day, quote holds the dates.
    let peak: Peak | undefined;
    const pk = d.peak as Record<string, unknown> | undefined;
    if (!isObj(pk)) pr.add("peak: { from, to, src, quote }");
    else {
      const from = isoMoment(pk.from), to = isoMoment(pk.to);
      if (!from) pr.add(`peak.from ${JSON.stringify(pk.from)} must be an ISO moment with its offset, e.g. 2026-12-13T22:00-05:00`);
      else { const o = offsetProblem(pk.from as string, ctx.category); if (o) pr.add(`peak.from: ${o}`); }
      if (!to) pr.add(`peak.to ${JSON.stringify(pk.to)} must be an ISO moment with its offset`);
      else { const o = offsetProblem(pk.to as string, ctx.category); if (o) pr.add(`peak.to: ${o}`); }
      if (from && to && to <= from) pr.add("peak: to must be after from");
      needSource(pr, "peak", pk.src, ctx);
      if (from && to) {
        const days = [new Date(`${(pk.from as string).slice(0, 10)}T00:00:00Z`), new Date(`${(pk.to as string).slice(0, 10)}T00:00:00Z`)];
        const uniqDays = days[0]!.getTime() === days[1]!.getTime() ? [days[0]!] : days;
        needQuote(pr, "peak", pk.quote, ctx, { days: uniqDays });
        peak = { from, to, fromIso: pk.from as string, toIso: pk.to as string };
      }
    }

    // Optional sourced facts: a rate and where to look. Neither carries a date, so the quote is just checked for being the source's own words.
    let rate: Fact | undefined;
    if (d.rate !== undefined) {
      const r = d.rate as Record<string, unknown>;
      if (!isObj(r) || !str(r.text) || r.text.length > 80) pr.add("rate: { text (up to 80 characters), src, quote }");
      else { needSource(pr, "rate", r.src, ctx); needQuote(pr, "rate", r.quote, ctx, {}); rate = { text: r.text }; }
    }
    let look: SkyNight["look"];
    if (d.look !== undefined) {
      const l = d.look as Record<string, unknown>;
      if (!isObj(l) || !COMPASS.includes(l.direction as Dir)) pr.add(`look.direction must be one of ${COMPASS.join(", ")}`);
      if (!isObj(l) || !str(l.altitude) || (l.altitude as string).length > 40) pr.add("look.altitude: a short phrase up to 40 characters (e.g. \"halfway up\")");
      if (isObj(l) && COMPASS.includes(l.direction as Dir) && str(l.altitude) && (l.altitude as string).length <= 40) {
        needSource(pr, "look", l.src, ctx); needQuote(pr, "look", l.quote, ctx, {});
        look = { direction: l.direction as Dir, altitude: l.altitude };
      }
    }

    // Cities: name known to the USNO file, a real IANA zone, a date the file has. All times are read, never typed.
    const cities: City[] = [];
    if (!Array.isArray(d.cities) || !d.cities.length) pr.add("cities: at least one { city, tz, date }");
    const seen = new Set<string>();
    for (const [i, c] of ((d.cities as unknown[]) ?? []).entries()) {
      const at = `city ${i + 1}`;
      if (!isObj(c)) { pr.add(`${at}: { city, tz, date }`); continue; }
      const name = c.city, date = isoDay(c.date);
      if (!str(name)) { pr.add(`${at}: city, a name as the USNO file spells it`); continue; }
      if (!date) { pr.add(`${at} (${name}): date ${JSON.stringify(c.date)} is not a real date (YYYY-MM-DD)`); continue; }
      if (!validZone(c.tz)) pr.add(`${at} (${name}): tz must be an IANA zone, e.g. "America/New_York"`);
      if (seen.has(name)) pr.add(`${at}: ${name} is listed twice`);
      seen.add(name);
      if (!cityRecords(name)) { pr.add(`${at}: "${name}" is not in usno-2026-27.json; add it from the USNO API (aa.usno.navy.mil) - do not type its times`); continue; }
      const rec = recordFor(name, isoOf(date));
      if (!rec) { pr.add(`${at}: ${name} has no ${isoOf(date)} in usno-2026-27.json; fetch that date from the USNO API and add it - do not type its times`); continue; }
      const next = recordFor(name, isoOf(new Date(date.getTime() + 86_400_000)));
      if (str(c.tz) && validZone(c.tz)) cities.push({ city: name, tz: c.tz, date, rec, nextRise: next?.rise ?? null });
    }

    if (cities.length > 16) pr.add(`${cities.length} cities; keep it to 16 (the list continues on more pages)`);
    const unconfirmed = unconfirmedList(pr, d.unconfirmed);
    pr.throwIfAny();
    return { event: str(d.event) ? d.event : undefined, peak: peak!, rate, look, cities, unconfirmed };
  },

  render(s, p, ctx) {
    const t = ctx.theme, size = sizeOf(p.landscape ?? false, ctx.paper);
    const computed = new Set<string>();
    const note = (v: string) => { computed.add(v); return v; };

    // Per-city rows: moonset, the hour dark skies last until (dawn), and the Moon's lit fraction.
    const rows = s.cities.map((c) => {
      const moonset = c.rec.mset ? fmtClock(c.rec.mset) : "does not set";
      if (c.rec.mset) note(moonset);
      const dark = darkUntil(c.rec, c.nextRise);
      const darkCell = dark ? note(fmtClock(dark)) : "all night";
      const lit = note(c.rec.illum);
      return `<tr><td class="ct">${esc(c.city)}</td><td class="k">${moonset}</td><td class="k">${darkCell}</td><td>${lit}</td></tr>`;
    }).join("");
    const table = `<div class="blk" data-split><table class="sn"><thead><tr><th>City</th><th>Moonset</th><th>Dark sky until</th><th>Moon lit</th></tr></thead><tbody>${rows}</tbody></table></div>`;

    // Peak banner: the window with weekday labels computed from the dates, plus the rate when given.
    const fromDay = new Date(`${s.peak.fromIso.slice(0, 10)}T00:00:00Z`), toDay = new Date(`${s.peak.toIso.slice(0, 10)}T00:00:00Z`);
    const window = fromDay.getTime() === toDay.getTime()
      ? `${dayLabel(fromDay)}`
      : `the night of ${dayLabel(fromDay)} into ${dayLabel(toDay)}`;
    const rateLine = s.rate ? ` Expect ${esc(s.rate.text)} from a dark site.` : "";
    const banner = `<div class="box peak blk"><h3>Peak window</h3><p>The ${esc(s.event ?? "event")} peaks ${window}.${rateLine} Watch after the Moon has set, when the sky is at its darkest, until dawn starts to brighten it.</p></div>`;

    // Moon disc from the first city's lit fraction (the phase is the same nationwide that night).
    const m0 = s.cities[0]!.rec, f = Math.max(0, Math.min(1, parseInt(m0.illum, 10) / 100));
    const waxing = /waxing|new/i.test(m0.phase);
    const moon = `<div class="moon"><svg viewBox="0 0 120 120" width="108" height="108" role="img"><title>Moon phase on the peak night</title>
      <circle cx="60" cy="60" r="52" fill="${t.soft}" stroke="${t.line}" stroke-width="2"/>${moonLit(60, 60, 52, f, waxing, t.primary)}
      <circle cx="60" cy="60" r="52" fill="none" stroke="${t.ink}" stroke-width="2"/></svg>
      <p class="cap">${esc(m0.phase)}, about ${note(m0.illum)} lit on the peak night</p></div>`;

    // Compass rose pointing where to look (or a general pointer when the story does not say).
    const lookBox = s.look
      ? `<div class="rose"><svg viewBox="0 0 120 120" width="108" height="108" role="img"><title>Where to look</title>${compassRose(60, 60, 42, s.look.direction, t)}</svg>
         <p class="cap">Face ${esc(s.look.direction)} and look ${esc(s.look.altitude)}. No telescope needed.</p></div>`
      : `<div class="rose"><svg viewBox="0 0 120 120" width="108" height="108" role="img"><title>Where to look</title>${compassRose(60, 60, 42, "S", t, false)}</svg>
         <p class="cap">Meteors can streak across any part of the sky. Face away from lights and take in as much sky as you can.</p></div>`;

    const checklist = ["Check the forecast for clear skies", "Pick a dark spot away from streetlights", "Set an alarm for moonset (see the table)", "Dress in warm layers; bring a hot drink", "Lie back on a reclining chair or blanket", "Let your eyes adjust in the dark, no phone screen", "Face the radiant and look about two-thirds up the sky", "Count for 15 minutes at a time (tally at right)"];
    const checks = `<div class="box"><h3>Before you go</h3><ul class="ck">${checklist.map((x) => `<li><span class="bx"></span>${esc(x)}</li>`).join("")}</ul></div>`;
    const tally = `<div class="box"><h3>My count (15-minute blocks)</h3><div class="tally">${["Start", "+15 min", "+30 min", "+45 min", "+60 min", "+75 min", "+90 min", "Best one"].map((x) => `<div><b>${esc(x)}</b></div>`).join("")}</div></div>`;

    const litMin = Math.min(...s.cities.map((c) => parseInt(c.rec.illum, 10)));
    const litMax = Math.max(...s.cities.map((c) => parseInt(c.rec.illum, 10)));
    const litTile = litMin === litMax ? note(`${litMin}%`) : `${note(`${litMin}%`)}-${note(`${litMax}%`)}`;
    const stat: [string, string][] = [[litTile, "Moonlight on the peak night"], [`${s.cities.length}`, "cities with local moonset and dark-sky times"]];

    const badge = fromDay.getTime() === toDay.getTime()
      ? `Peak<br>${MON[fromDay.getUTCMonth()]} ${fromDay.getUTCDate()}`
      : `Peak night<br>${MON[fromDay.getUTCMonth()]} ${fromDay.getUTCDate()}-${toDay.getUTCDate()}`;
    const sourceNote = "Moonset, dark-sky time (dawn) and Moon illumination: U.S. Naval Observatory, local clock time. Times are read from saved USNO data, not converted.";

    const css = `${baseCss(t, false)}
    .peak p{margin:0;font-size:calc(10.5px*var(--s));line-height:1.45}
    table.sn{width:100%;border-collapse:collapse;table-layout:fixed;font-size:calc(10.5px*var(--s))}
    .sn th{font-family:Sora;font-size:max(8px,calc(9px*var(--s)));text-transform:uppercase;letter-spacing:.05em;color:#fff;background:${t.primary};text-align:left;padding:5px 7px}
    .sn td{padding:calc(5px*var(--s)) 7px;border-bottom:1px solid ${t.line};vertical-align:top;line-height:1.3}
    .sn tbody tr:nth-child(even) td{background:${t.soft}}
    .sn .ct{font-family:Sora;font-weight:800;color:${t.ink}}.sn td.k{font-family:Sora;font-weight:800;color:${t.primary}}
    .sn th:first-child,.sn .ct{width:30%}
    .sky2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:calc(10px*var(--s))}
    .look2{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start;margin-top:calc(10px*var(--s))}
    .moon,.rose{border:1.4px solid ${t.line};border-radius:10px;padding:8px;text-align:center}
    .moon svg,.rose svg{display:block;margin:0 auto}
    .cap{margin:5px 0 0;font-size:calc(9px*var(--s));color:${t.ink};line-height:1.3}
    .ck{list-style:none;margin:0;padding:0;font-size:calc(9.6px*var(--s));line-height:1.35}
    .ck li{display:flex;gap:7px;align-items:flex-start;margin:0 0 4px}
    .tally{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
    .tally div{border:1.4px solid ${t.line};border-radius:8px;height:calc(44px*var(--s));padding:5px 7px;font-size:calc(9px*var(--s))}
    .tally b{font-family:Sora;color:${t.muted};font-weight:700}
    .sidebox{margin-top:calc(10px*var(--s))}
    .snnote{margin:6px 0 0;font-size:8.6px;color:${t.muted};line-height:1.45}`;

    const body = `${header(t, p.title, p.subtitle, badge)}${tiles(stat)}${banner}
      <h2 class="sec">Local moonset and dark-sky times</h2>${table}<p class="snnote blk">${esc(sourceNote)}</p>
      <div class="look2 blk">${moon}${lookBox}</div>
      <div class="sky2 blk">${checks}${tally}</div>${s.unconfirmed.length ? `<div class="sidebox blk">${unconfirmedBox(s.unconfirmed)}</div>` : ""}${notes(p.notesLabel)}`;
    return { html: page(ctx, size, css, body, p.note), size, computed: [...computed], warnings: [] };
  },
};

/** AP-style clock from a 24-hour "HH:MM" USNO value: "8:43 p.m.", "7:11 a.m.", "noon", "midnight". */
function fmtClock(hm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm);
  if (!m) return "—";
  const h = Number(m[1]), min = Number(m[2]);
  if (min === 0 && h === 12) return "noon";
  if (min === 0 && h === 0) return "midnight";
  return `${h % 12 || 12}${min ? `:${String(min).padStart(2, "0")}` : ""} ${h < 12 ? "a.m." : "p.m."}`;
}
const hm = (s: string | null) => { const m = s ? /^(\d{1,2}):(\d{2})$/.exec(s) : null; return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
/** The hour the sky is dark until: the moon's set, then dawn. Pre-dawn moonset -> that morning's sunrise; evening moonset -> the next morning's. */
function darkUntil(rec: Rec, nextRise: string | null): string | null {
  const ms = hm(rec.mset), sr = hm(rec.rise);
  if (ms === null || sr === null) return null;
  if (ms < sr) return rec.rise; // moon sets before dawn the same morning
  return nextRise; // moon sets in the evening; dark until the next sunrise (null when that date is not saved)
}

/** Lit part of the Moon as a vector path: a semicircle on the lit limb closed by the terminator ellipse. */
function moonLit(cx: number, cy: number, R: number, f: number, waxing: boolean, fill: string): string {
  if (f <= 0.001) return "";
  if (f >= 0.999) return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${fill}"/>`;
  const rx = +(R * Math.abs(1 - 2 * f)).toFixed(2), top = cy - R, bot = cy + R;
  const inner = f < 0.5 ? 0 : 1;
  const path = `M ${cx} ${top} A ${R} ${R} 0 0 1 ${cx} ${bot} A ${rx} ${R} 0 0 ${inner} ${cx} ${top} Z`;
  const g = waxing ? "" : ` transform="translate(${2 * cx} 0) scale(-1 1)"`;
  return `<path d="${path}"${g} fill="${fill}"/>`;
}

/** A compass with the eight points; with `highlight`, an arrow to `dir` and that label picked out. N is up, E is right (bearings clockwise). */
function compassRose(cx: number, cy: number, R: number, dir: Dir, t: { primary: string; ink: string; muted: string; line: string }, highlight = true): string {
  const ang = COMPASS.indexOf(dir) * 45 * (Math.PI / 180);
  const px = cx + Math.sin(ang) * R * 0.9, py = cy - Math.cos(ang) * R * 0.9;
  const headL = ang + Math.PI - 0.4, headR = ang + Math.PI + 0.4;
  const h1x = px + Math.sin(headL) * 12, h1y = py - Math.cos(headL) * 12, h2x = px + Math.sin(headR) * 12, h2y = py - Math.cos(headR) * 12;
  const labels = COMPASS.map((c, i) => {
    const a = i * 45 * (Math.PI / 180), lx = cx + Math.sin(a) * (R + 8), ly = cy - Math.cos(a) * (R + 8);
    const on = highlight && c === dir;
    return `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="middle" font-family="Sora" font-weight="${on ? 800 : 600}" font-size="${on ? 11 : 8.5}" fill="${on ? t.primary : t.muted}">${c}</text>`;
  }).join("");
  const arrow = highlight
    ? `<line x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="${t.primary}" stroke-width="3" stroke-linecap="round"/>
       <polygon points="${px.toFixed(1)},${py.toFixed(1)} ${h1x.toFixed(1)},${h1y.toFixed(1)} ${h2x.toFixed(1)},${h2y.toFixed(1)}" fill="${t.primary}"/>`
    : "";
  return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${t.line}" stroke-width="1.6"/>${arrow}<circle cx="${cx}" cy="${cy}" r="3" fill="${t.ink}"/>${labels}`;
}
