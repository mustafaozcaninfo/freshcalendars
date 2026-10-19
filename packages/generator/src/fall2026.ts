/**
 * Late-fall 2026 printables for /news/:
 *
 *   downloads/halloween-2026/halloween-2026-trick-or-treat-times — sunset and dark by city, Oct. 31, 2026
 *   downloads/aca-open-enrollment-2027/open-enrollment-checklist-2027 — dates and documents to gather
 *   downloads/november-2026-sky/november-2026-meteor-showers — Taurids and Leonids with moon phases
 *
 * Sunsets: USNO snapshot in data/halloween-2026-sunsets.json (local daylight time; Phoenix MST).
 * Usage: pnpm fc news-fall
 */
import fs from "node:fs/promises";
import path from "node:path";
import { LETTER, doc, fontFaces } from "./julian.js";
import { ROOT } from "./paths.js";
import { renderPrintables } from "./printables.js";

const to12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h! + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h! < 12 ? "a.m." : "p.m."}`; };

function halloween(fonts: string, cities: { city: string; sunset: string; civilEnd: string; moonrise?: string }[]): string {
  const O = "#ea580c", P = "#3b0764";
  const rows = cities.map((c) => `<tr><td><b>${c.city}</b></td><td>${to12(c.sunset)}</td><td>${to12(c.civilEnd)}</td><td>${c.moonrise ? to12(c.moonrise) : "after midnight"}</td></tr>`).join("");
  const css = `
  .h1{padding:34px 38px 0;background:#fff7ed}
  .h1 header{background:${P};color:#fff;border-radius:16px;padding:16px 20px;margin-bottom:14px}
  .h1 h1{font-family:Sora;font-weight:800;font-size:31px;margin:0;line-height:1.1}.h1 h1 span{color:#fdba74}
  .h1 header p{margin:5px 0 0;font-size:12px;color:#e9d5ff}
  .h1 table{width:100%;border-collapse:collapse;font-size:12.6px;font-variant-numeric:tabular-nums}
  .h1 th{background:${O};color:#fff;font-family:Sora;font-size:10.5px;padding:8px;text-align:left}
  .h1 td{padding:9px 8px;border-bottom:1px solid #fed7aa;background:#fff}
  .h1 .tips{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
  .h1 .tips div{background:#fff;border:1.5px solid #fed7aa;border-radius:12px;padding:10px 12px;font-size:11.5px;line-height:1.45}
  .h1 .tips b{display:block;font-family:Sora;color:${P};font-size:12.5px;margin-bottom:3px}`;
  const page = `<section class="page h1">
    <header><h1>Halloween <span>2026</span>: Sunset and Dark by City</h1><p>Saturday, Oct. 31, 2026 · local daylight time · clocks fall back one hour at 2 a.m. Sunday, Nov. 1</p></header>
    <table><thead><tr><th>City</th><th>Sunset</th><th>Dark (end of civil twilight)</th><th>Moonrise</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tips">
      <div><b>A dark Halloween</b>The waning gibbous Moon (about 63% lit) does not rise until about 11 p.m. in most cities, so trick-or-treat hours have no moonlight. Bring a flashlight or glow sticks.</div>
      <div><b>An extra hour after</b>Clocks fall back at 2 a.m. on Sunday, Nov. 1, so the night after Halloween is 25 hours long. Sunset on Sunday comes about an hour earlier on the clock.</div>
      <div><b>Your town's hours</b>Many cities and towns set official trick-or-treat hours. Check your local government's announcement; this table only shows when it gets dark.</div>
      <div><b>Plan</b>Start: ________  Route: ______________________  Home by: ________</div>
    </div>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/halloween-2026-saturday-sunset-trick-or-treat-times/ · Sun and Moon times: U.S. Naval Observatory</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

function aca(fonts: string): string {
  const B = "#1e3a8a", T = "#0f766e";
  const docs = ["Social Security numbers (or immigration documents) for everyone applying", "Employer and income information for every household member, including 2027 income estimates", "Policy numbers for any current health coverage", "Details of any job-based coverage you are offered (HealthCare.gov's Employer Coverage Tool helps)", "Your current plan's 2027 premium, deductible and network from the renewal notice", "A list of your doctors and prescriptions to check against each plan"];
  const css = `
  .c1{padding:36px 40px 0}
  .c1 h1{font-family:Sora;font-weight:800;font-size:32px;margin:0;color:${B}}
  .c1 .sub{margin:4px 0 14px;font-size:12px;color:#37474f}
  .c1 .dates{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
  .c1 .dates div{border-radius:12px;padding:10px 12px;background:#eff6ff;border-top:4px solid ${B}}
  .c1 .dates div.k{background:#fef3c7;border-top-color:#d97706}
  .c1 .dates b{display:block;font-family:Sora;font-size:16px;color:${B}}
  .c1 .dates span{font-size:11px;color:#37474f;line-height:1.3}
  .c1 h2{font-family:Sora;font-size:15px;color:${T};margin:14px 0 8px}
  .c1 li{list-style:none;display:flex;gap:10px;font-size:12.6px;padding:7px 0;border-bottom:1px solid #e2e8f0}
  .c1 ul{margin:0;padding:0}
  .c1 li i{flex:none;width:16px;height:16px;border:2px solid ${T};border-radius:4px;margin-top:1px}
  .c1 .note{margin-top:12px;font-size:10px;color:#5a6b75;line-height:1.45}`;
  const steps = ["Log in to HealthCare.gov (or your state's marketplace) and update your income and household", "Compare at least three plans on total yearly cost, not just the premium", "Check that your doctors and drugs are covered", "Choose a plan by Dec. 15 for coverage on Jan. 1", "Pay the first premium so coverage can start"];
  const page = `<section class="page c1">
    <h1>ACA Open Enrollment 2027 Checklist</h1>
    <p class="sub">HealthCare.gov Marketplace plans for 2027 · state-run marketplaces may use different dates</p>
    <div class="dates"><div><b>Nov. 1, 2026</b><span>Open enrollment begins</span></div><div class="k"><b>Dec. 15, 2026</b><span>Deadline for coverage starting Jan. 1</span></div><div><b>Jan. 1, 2027</b><span>Coverage starts if you enrolled and paid by Dec. 15</span></div><div><b>Jan. 15, 2027</b><span>Open enrollment ends; coverage starts Feb. 1</span></div></div>
    <h2>Gather before you apply</h2><ul>${docs.map((d) => `<li><i></i>${d}</li>`).join("")}</ul>
    <h2>Steps</h2><ul>${steps.map((d) => `<li><i></i>${d}</li>`).join("")}</ul>
    <p class="note">Dates: HealthCare.gov. If you do nothing, HealthCare.gov may re-enroll you automatically in the same or a similar plan, but the price and subsidy can change. Free help: HealthCare.gov's Find Local Help tool or 1-800-318-2596.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/aca-open-enrollment-2027-dates-november-1-january-15/</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

function meteors(fonts: string): string {
  const N = "#0b1736";
  const showers = [
    { name: "Southern Taurids", peak: "Night of Nov. 4–5", moon: "Waning crescent, about 18% lit", rate: "About 5 meteors an hour; known for bright fireballs", when: "Best around midnight, low in the east before that" },
    { name: "Northern Taurids", peak: "Night of Nov. 11–12", moon: "Thin crescent, about 7% lit", rate: "About 5 an hour, slow and bright", when: "Best around midnight; the darkest skies of the month" },
    { name: "Leonids", peak: "Night of Nov. 16–17", moon: "First quarter, sets around midnight", rate: "About 15 an hour at best, fast meteors", when: "After the Moon sets, from midnight to dawn" },
  ];
  const css = `
  .m1{padding:34px 38px 0;background:${N};color:#e5e9f5}
  .m1 h1{font-family:Sora;font-weight:800;font-size:32px;margin:0;color:#fff}
  .m1 h1 span{color:#fbbf24}
  .m1 .sub{margin:4px 0 16px;font-size:12px;color:#b7c2d9}
  .m1 .card{background:#162449;border-radius:14px;padding:14px 16px;margin-bottom:12px;display:grid;grid-template-columns:200px 1fr;gap:14px}
  .m1 .card h2{font-family:Sora;font-size:18px;color:#fbbf24;margin:0}
  .m1 .card .pk{font-family:Sora;font-weight:800;font-size:15px;color:#fff;margin-top:6px}
  .m1 .card dl{margin:0;display:grid;grid-template-columns:90px 1fr;gap:5px 10px;font-size:12px}
  .m1 dt{color:#93a3c8}.m1 dd{margin:0}
  .m1 h3{font-family:Sora;font-size:14px;color:#fff;margin:16px 0 8px}
  .m1 table{width:100%;border-collapse:collapse;font-size:12px}
  .m1 td{padding:7px 8px;border-bottom:1px solid #24345f}
  .m1 td:first-child{color:#fbbf24;font-weight:700;width:150px}
  .m1 .note{margin-top:12px;font-size:10px;color:#93a3c8;line-height:1.45}
  .m1 .foot{color:#93a3c8}`;
  const page = `<section class="page m1">
    <h1>November 2026 <span>Meteor Showers</span></h1>
    <p class="sub">Taurid fireballs and the Leonids · peak nights and Moon conditions for the United States</p>
    ${showers.map((s) => `<div class="card"><div><h2>${s.name}</h2><div class="pk">${s.peak}</div></div><dl><dt>Moon</dt><dd>${s.moon}</dd><dt>Rate</dt><dd>${s.rate}</dd><dt>When to look</dt><dd>${s.when}</dd></dl></div>`).join("")}
    <h3>Moon phases, November 2026 (Eastern Time)</h3>
    <table><tbody>
      <tr><td>Last quarter</td><td>Sunday, Nov. 1, 3:28 p.m. EST</td></tr>
      <tr><td>New moon</td><td>Monday, Nov. 9, 2:02 a.m. EST</td></tr>
      <tr><td>First quarter</td><td>Tuesday, Nov. 17, 6:48 a.m. EST</td></tr>
      <tr><td>Full moon (Beaver Moon)</td><td>Tuesday, Nov. 24, 9:53 a.m. EST</td></tr>
    </tbody></table>
    <p class="note">Peak nights and rates: American Meteor Society. Moon phases: U.S. Naval Observatory. Rates assume a dark sky far from city lights; expect fewer from suburbs. Give your eyes 20 minutes to adjust and look about halfway up the sky.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/november-2026-meteor-showers-taurids-leonids/</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildFallDownloads(): Promise<void> {
  const fonts = await fontFaces();
  const h = JSON.parse(await fs.readFile(path.join(ROOT, "packages/generator/data/halloween-2026-sunsets.json"), "utf8"));
  await renderPrintables("halloween-2026", [{ slug: "halloween-2026-trick-or-treat-times", size: LETTER, html: halloween(fonts, h.cities) }]);
  await renderPrintables("aca-open-enrollment-2027", [{ slug: "open-enrollment-checklist-2027", size: LETTER, html: aca(fonts) }]);
  await renderPrintables("november-2026-sky", [{ slug: "november-2026-meteor-showers", size: LETTER, html: meteors(fonts) }]);
}
