/**
 * Orionid meteor shower 2026 viewing-times sheet for /news/ (orionid-meteor-shower-2026-peak-october-21-22),
 * in a night-sky theme and an ink-saver theme. Moonset and sunrise from the U.S. Naval Observatory
 * (aa.usno.navy.mil API); "dark until" is the start of astronomical twilight (sun 18° below the
 * horizon), computed with the NOAA solar equations and checked against USNO civil twilight.
 * Usage: pnpm fc news-sky
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

/** [city, zone, moonset Oct. 22, dark until Oct. 22, moonset Oct. 21, moonset Oct. 23] (local time). */
export const ORIONID_CITIES: [string, string, string, string, string, string][] = [
  ["New York", "ET", "3:13 a.m.", "5:43 a.m.", "2:07 a.m.", "4:19 a.m."],
  ["Washington, D.C.", "ET", "3:27 a.m.", "5:56 a.m.", "2:23 a.m.", "4:32 a.m."],
  ["Atlanta", "ET", "4:02 a.m.", "6:25 a.m.", "3:01 a.m.", "5:03 a.m."],
  ["Miami", "ET", "3:49 a.m.", "6:06 a.m.", "2:54 a.m.", "4:46 a.m."],
  ["Chicago", "CT", "3:09 a.m.", "5:38 a.m.", "2:02 a.m.", "4:16 a.m."],
  ["Houston", "CT", "3:50 a.m.", "6:08 a.m.", "2:52 a.m.", "4:49 a.m."],
  ["Dallas", "CT", "3:54 a.m.", "6:14 a.m.", "2:54 a.m.", "4:55 a.m."],
  ["Denver", "MT", "3:23 a.m.", "5:48 a.m.", "2:18 a.m.", "4:29 a.m."],
  ["Phoenix", "MST", "2:57 a.m.", "5:15 a.m.", "1:57 a.m.", "3:59 a.m."],
  ["Los Angeles", "PT", "3:22 a.m.", "5:40 a.m.", "2:22 a.m.", "4:24 a.m."],
  ["San Francisco", "PT", "3:37 a.m.", "5:57 a.m.", "2:34 a.m.", "4:42 a.m."],
  ["Seattle", "PT", "3:29 a.m.", "5:56 a.m.", "2:17 a.m.", "4:42 a.m."],
];
type Theme = { id: string; bg: string; ink: string; head: string; accent: string; line: string; soft: string };
const THEMES: Theme[] = [
  { id: "night", bg: "#0b1530", ink: "#e2e8f0", head: "#fde68a", accent: "#93c5fd", line: "#24345e", soft: "#13224a" },
  { id: "ink", bg: "#ffffff", ink: "#111111", head: "#111111", accent: "#333333", line: "#d4d4d4", soft: "#f3f3f3" },
];

function sheet(fonts: string, t: Theme): string {
  const c = `or-${t.id}`;
  const rows = ORIONID_CITIES.map(([city, z, ms, dark, a, b]) => `<tr><td class="s">${city} <i>${z}</i></td><td class="k">${ms}</td><td class="k">${dark}</td><td>${a}</td><td>${b}</td></tr>`).join("");
  const checks = ["Check the forecast for clear skies", "Pick a dark spot away from streetlights", "Set an alarm for moonset (table)", "Warm layers, hat and gloves", "Blanket, sleeping pad or reclining chair", "Hot drink in a thermos", "Red flashlight or phone red-light mode", "Phone brightness down; no screens for 20-30 minutes", "Face southeast to south, look halfway up", "Count meteors for 15 minutes at a time"];
  const css = `
  .${c}{background:${t.bg};color:${t.ink};padding:28px 32px 0;min-height:100%}
  .${c} header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid ${t.head};padding-bottom:8px;margin-bottom:12px}
  .${c} h1{font-family:Sora;font-weight:800;font-size:27px;margin:0;color:${t.head};line-height:1.05}
  .${c} .sub{margin:5px 0 0;font-size:11px;color:${t.ink};opacity:.9}
  .${c} .badge{font-family:Sora;font-weight:800;font-size:12.5px;color:${t.bg};background:${t.head};border-radius:8px;padding:8px 11px;text-align:center;line-height:1.2;white-space:nowrap}
  .${c} .gw{border:2px solid ${t.head};border-radius:10px;padding:10px 14px;margin:0 0 12px;font-size:12px;line-height:1.45;background:${t.soft}}
  .${c} .gw b{font-family:Sora;color:${t.head}}
  .${c} h2{font-family:Sora;font-size:12.5px;text-transform:uppercase;letter-spacing:.08em;color:${t.accent};margin:12px 0 6px}
  .${c} table{width:100%;border-collapse:collapse;font-size:11.4px}
  .${c} th{text-align:left;font-family:Sora;font-size:9.2px;color:${t.head};border-bottom:2px solid ${t.head};padding:5px 6px}
  .${c} td{border-bottom:1px solid ${t.line};padding:6.5px 6px}
  .${c} td.s{font-weight:700} .${c} td.s i{font-style:normal;font-size:9px;opacity:.75}
  .${c} td.k{font-weight:800;color:${t.head}}
  .${c} .cols{display:grid;grid-template-columns:1.05fr 1fr;gap:18px;margin-top:6px}
  .${c} ul{margin:0;padding:0} .${c} li{list-style:none;position:relative;padding-left:22px;margin:0 0 8px;font-size:11.8px;line-height:1.35}
  .${c} li::before{content:"";position:absolute;left:0;top:1px;width:12px;height:12px;border:1.6px solid ${t.head};border-radius:3px}
  .${c} .tally{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
  .${c} .tally div{border:1.4px solid ${t.line};border-radius:8px;height:56px;padding:5px 7px;font-size:9.6px}
  .${c} .note{margin-top:10px;font-size:8.8px;opacity:.8;line-height:1.45}
  .${c} .foot{color:${t.ink}}`;
  const page = `<section class="page ${c}"><header><div><h1>Orionid Meteor Shower 2026: Viewing Times</h1><p class="sub">Peak night Wednesday, Oct. 21 into Thursday, Oct. 22 · up to about 20 meteors an hour from a dark site · local times</p></div><div class="badge">Peak night<br>Oct. 21-22</div></header>
    <div class="gw"><b>The golden window:</b> the moon is about 86% lit and bright until it sets. Watch from <b>moonset</b> until <b>dark until</b>, when dawn twilight starts to wash out the sky. The mornings of Oct. 21 and Oct. 23 work too, with moonset about an hour earlier or later.</div>
    <h2>Moonset and dark sky, morning of Thursday, Oct. 22</h2>
    <table><thead><tr><th>City</th><th>Moonset</th><th>Dark until</th><th>Moonset Oct. 21</th><th>Moonset Oct. 23</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="cols"><div><h2>Meteor-watching checklist</h2><ul>${checks.map((x) => `<li>${x}</li>`).join("")}</ul></div>
      <div><h2>My count</h2><div class="tally">${["Start", "+15 min", "+30 min", "+45 min", "+60 min", "+75 min", "+90 min", "Best one"].map((x) => `<div>${x}</div>`).join("")}</div>
      <h2>Where to look</h2><p style="font-size:11.6px;line-height:1.45;margin:0">The meteors seem to come from near Orion's raised club, high in the southeast to south before dawn. Look 30 to 40 degrees away from that point, about halfway up the sky. No telescope or binoculars needed.</p></div></div>
    <p class="note">Sources: U.S. Naval Observatory (moonset, sunrise, moon phase); "dark until" = start of astronomical twilight, calculated for each city. Rates: American Meteor Society. Times are local daylight time except Phoenix (MST).</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/orionid-meteor-shower-2026-peak-october-21-22/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildSkyDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("sky-2026", THEMES.map((t) => ({ slug: `orionid-viewing-times-2026-${t.id}`, size: LETTER, html: sheet(fonts, t) })));
}
