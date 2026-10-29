/**
 * Election 2026 printables for /news/ (Nov. 3, 2026 general election): poll closing times in
 * Eastern Time, mail ballot return deadlines, an election-night results tracker and one-page
 * ballot checklists for six states. Nonpartisan: candidates are listed only where the state's
 * certified list was read (Michigan), in ballot order, without endorsements.
 * Sources are named on each sheet. Usage: pnpm fc news-election2026
 */
import { LETTER, doc, fontFaces } from "./julian.js";
import { renderPrintables } from "./printables.js";

// ── Poll closing times ─────────────────────────────────────────────────────────
/** [state, local closing time, Eastern (EST) closing time of most polls, note]. Nov. 3 is on standard time. */
export const POLLS: [string, string, string, string?][] = [
  ["Alabama", "7 p.m. CT", "8 p.m."], ["Alaska", "8 p.m. AKT", "midnight", "Aleutian Islands 1 a.m. ET"], ["Arizona", "7 p.m. MST", "9 p.m."],
  ["Arkansas", "7:30 p.m. CT", "8:30 p.m."], ["California", "8 p.m. PT", "11 p.m."], ["Colorado", "7 p.m. MT", "9 p.m."],
  ["Connecticut", "8 p.m. ET", "8 p.m."], ["Delaware", "8 p.m. ET", "8 p.m."], ["District of Columbia", "8 p.m. ET", "8 p.m."],
  ["Florida", "7 p.m. local", "7 p.m.", "Panhandle (Central) 8 p.m. ET"], ["Georgia", "7 p.m. ET", "7 p.m."], ["Hawaii", "7 p.m. HST", "midnight"],
  ["Idaho", "8 p.m. local", "10 p.m.", "northern Idaho (Pacific) 11 p.m. ET"], ["Illinois", "7 p.m. CT", "8 p.m."],
  ["Indiana", "6 p.m. local", "6 p.m.", "Central-time counties 7 p.m. ET"], ["Iowa", "8 p.m. CT", "9 p.m."],
  ["Kansas", "7 p.m. local", "8 p.m.", "counties may stay open to 8 p.m.; western Mountain-time counties later"], ["Kentucky", "6 p.m. local", "6 p.m.", "western Kentucky (Central) 7 p.m. ET"],
  ["Louisiana", "8 p.m. CT", "9 p.m."], ["Maine", "8 p.m. ET", "8 p.m."], ["Maryland", "8 p.m. ET", "8 p.m."], ["Massachusetts", "8 p.m. ET", "8 p.m."],
  ["Michigan", "8 p.m. local", "8 p.m.", "four Upper Peninsula counties (Central) 9 p.m. ET"], ["Minnesota", "8 p.m. CT", "9 p.m."],
  ["Mississippi", "7 p.m. CT", "8 p.m."], ["Missouri", "7 p.m. CT", "8 p.m."], ["Montana", "8 p.m. MT", "10 p.m."],
  ["Nebraska", "8 p.m. CT", "9 p.m.", "Mountain-time Panhandle closes 7 p.m. MT, also 9 p.m. ET"], ["Nevada", "7 p.m. PT", "10 p.m."],
  ["New Hampshire", "7 or 8 p.m. ET", "7-8 p.m.", "towns set hours"], ["New Jersey", "8 p.m. ET", "8 p.m."], ["New Mexico", "7 p.m. MT", "9 p.m."],
  ["New York", "9 p.m. ET", "9 p.m."], ["North Carolina", "7:30 p.m. ET", "7:30 p.m."], ["North Dakota", "7-9 p.m. local", "8-10 p.m.", "closing time depends on precinct"],
  ["Ohio", "7:30 p.m. ET", "7:30 p.m."], ["Oklahoma", "7 p.m. CT", "8 p.m."], ["Oregon", "8 p.m. local", "11 p.m.", "all-mail; ballot drop sites close"],
  ["Pennsylvania", "8 p.m. ET", "8 p.m."], ["Rhode Island", "8 p.m. ET", "8 p.m."], ["South Carolina", "7 p.m. ET", "7 p.m."],
  ["South Dakota", "7 p.m. local", "8 p.m.", "western South Dakota (Mountain) 9 p.m. ET"], ["Tennessee", "7 p.m. CT / 8 p.m. ET", "8 p.m.", "counties set hours"],
  ["Texas", "7 p.m. local", "8 p.m.", "El Paso and Hudspeth counties (Mountain) 9 p.m. ET"], ["Utah", "8 p.m. MT", "10 p.m."], ["Vermont", "7 p.m. ET", "7 p.m."],
  ["Virginia", "7 p.m. ET", "7 p.m."], ["Washington", "8 p.m. PT", "11 p.m.", "all-mail; ballot drop boxes close"], ["West Virginia", "7:30 p.m. ET", "7:30 p.m."],
  ["Wisconsin", "8 p.m. CT", "9 p.m."], ["Wyoming", "7 p.m. MT", "9 p.m."],
];
const ET_ORDER = ["6 p.m.", "7 p.m.", "7-8 p.m.", "7:30 p.m.", "8 p.m.", "8-10 p.m.", "8:30 p.m.", "9 p.m.", "10 p.m.", "11 p.m.", "midnight"];

function pollSheet(fonts: string): string {
  const groups = ET_ORDER.map((t) => [t, POLLS.filter((p) => p[2] === t)] as const).filter(([, l]) => l.length);
  const blocks = groups.map(([t, list]) => `<div class="g"><div class="t">${t}<small>ET</small></div><div class="s">${list.map(([s, , , n]) => `<span>${s}${n ? `<i>*</i>` : ""}</span>`).join("")}</div></div>`).join("");
  const notes = POLLS.filter((p) => p[3]).map(([s, , , n]) => `<b>${s}:</b> ${n}`).join(" · ");
  const css = `
  .pc{padding:30px 34px 0}
  .pc h1{font-family:Sora;font-weight:800;font-size:30px;margin:0;color:#1e3a8a;line-height:1.05}
  .pc .sub{margin:5px 0 14px;font-size:11.4px;color:#37474f}
  .pc .g{display:grid;grid-template-columns:128px 1fr;border-top:1px solid #dbe3ee;padding:9px 0}
  .pc .t{font-family:Sora;font-weight:800;font-size:24px;color:#b91c1c;line-height:1}
  .pc .t small{font-size:10px;color:#64748b;margin-left:4px}
  .pc .s{display:flex;flex-wrap:wrap;gap:6px}
  .pc .s span{background:#eef2ff;border:1px solid #c7d2fe;border-radius:6px;padding:6px 10px;font-size:13px;font-weight:700;color:#1e293b}
  .pc .s i{font-style:normal;color:#b91c1c}
  .pc .note{margin-top:12px;font-size:9px;color:#5a6b75;line-height:1.5}`;
  const page = `<section class="page pc"><h1>When Polls Close on Election Day, Nov. 3, 2026</h1>
    <p class="sub">Closing time of most polling places in each state, in Eastern Standard Time · daylight saving time ends Nov. 1 · anyone in line at closing time can still vote</p>
    ${blocks}
    <p class="note">* Part of the state closes later: ${notes}.<br>Sources: state election offices and statutes (for example Louisiana R.S. 18:541), National Association of Secretaries of State compilations. Check your county for local hours.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/what-time-do-polls-close-election-day-2026/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── Mail ballot return deadlines ──────────────────────────────────────────────
/** [state, rule, deadline for postmarked ballots or "-"]. "Received" = must arrive by the time shown on Nov. 3. */
export const MAIL: [string, string, string][] = [
  ["Alabama", "Received by noon Nov. 3", "-"], ["Alaska", "Postmarked by Nov. 3", "Nov. 13"], ["Arizona", "Received by 7 p.m. Nov. 3", "-"],
  ["Arkansas", "Received by 7:30 p.m. Nov. 3", "-"], ["California", "Postmarked by Nov. 3", "Nov. 10"], ["Colorado", "Received by 7 p.m. Nov. 3", "-"],
  ["Connecticut", "Received by close of polls", "-"], ["Delaware", "Received by close of polls", "-"], ["District of Columbia", "Postmarked by Nov. 3", "Nov. 13"],
  ["Florida", "Received by 7 p.m. Nov. 3", "-"], ["Georgia", "Received by 7 p.m. Nov. 3", "-"], ["Hawaii", "Received by 7 p.m. Nov. 3", "-"],
  ["Idaho", "Received by 8 p.m. Nov. 3", "-"], ["Illinois", "Postmarked by Nov. 3", "Nov. 17"], ["Indiana", "Received by 6 p.m. Nov. 3", "-"],
  ["Iowa", "Received by close of polls", "-"], ["Kansas", "Postmarked by Nov. 3 (court order)", "Nov. 6"], ["Kentucky", "Received by 6 p.m. Nov. 3", "-"],
  ["Louisiana", "Received by 4:30 p.m. Nov. 2", "-"], ["Maine", "Received by 8 p.m. Nov. 3", "-"], ["Maryland", "Postmarked by Nov. 3", "Nov. 13, 10 a.m."],
  ["Massachusetts", "Postmarked by Nov. 3", "Nov. 6, 5 p.m."], ["Michigan", "Received by 8 p.m. Nov. 3", "-"], ["Minnesota", "Received by 8 p.m. Nov. 3", "-"],
  ["Mississippi", "Postmarked by Nov. 3", "5 business days later"], ["Missouri", "Received by close of polls", "-"], ["Montana", "Received by 8 p.m. Nov. 3", "-"],
  ["Nebraska", "Received by close of polls", "-"], ["Nevada", "Postmarked by Nov. 3", "Nov. 7, 5 p.m."], ["New Hampshire", "Received by 5 p.m. Nov. 3", "-"],
  ["New Jersey", "Postmarked by Nov. 3", "144 hours after polls close"], ["New Mexico", "Received by 7 p.m. Nov. 3", "-"], ["New York", "Postmarked by Nov. 3", "Nov. 10"],
  ["North Carolina", "Received by 7:30 p.m. Nov. 3", "-"], ["North Dakota", "Postmarked by Nov. 2", "Before canvass"], ["Ohio", "Received by 7:30 p.m. Nov. 3", "-"],
  ["Oklahoma", "Received by 7 p.m. Nov. 3", "-"], ["Oregon", "Postmarked by Nov. 3", "Nov. 10"], ["Pennsylvania", "Received by 8 p.m. Nov. 3", "-"],
  ["Rhode Island", "Received by 8 p.m. Nov. 3", "-"], ["South Carolina", "Received by 7 p.m. Nov. 3", "-"], ["South Dakota", "Received by close of polls", "-"],
  ["Tennessee", "Received by close of polls", "-"], ["Texas", "Postmarked by Nov. 3", "Nov. 4, 5 p.m."], ["Utah", "Received by 8 p.m. Nov. 3", "-"],
  ["Vermont", "Received by 7 p.m. Nov. 3", "-"], ["Virginia", "Postmarked by Nov. 3", "Nov. 6, noon"], ["Washington", "Postmarked by Nov. 3", "Before county certification"],
  ["West Virginia", "Postmarked by Nov. 3", "Start of canvass"], ["Wisconsin", "Received by 8 p.m. Nov. 3", "-"], ["Wyoming", "Received by 7 p.m. Nov. 3", "-"],
];
function mailSheet(fonts: string): string {
  const row = ([s, r, g]: [string, string, string]) => `<tr class="${g === "-" ? "" : "pm"}"><td class="c">${s}</td><td>${r}</td><td>${g === "-" ? "No grace period" : g}</td></tr>`;
  const half = Math.ceil(MAIL.length / 2);
  const tbl = (x: typeof MAIL) => `<table><thead><tr><th>State</th><th>Mailed ballot must be</th><th>Late arrival accepted until</th></tr></thead><tbody>${x.map(row).join("")}</tbody></table>`;
  const css = `
  .mb{padding:30px 28px 0}
  .mb h1{font-family:Sora;font-weight:800;font-size:27px;margin:0;color:#0f766e;line-height:1.05}
  .mb .sub{margin:4px 0 10px;font-size:10.6px;color:#37474f}
  .mb .cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .mb table{width:100%;border-collapse:collapse;font-size:8.9px}
  .mb th{background:#115e59;color:#fff;font-family:Sora;font-size:8px;padding:4px;text-align:left}
  .mb td{padding:4.3px 4px;border-bottom:1px solid #e3e8ee;line-height:1.2}
  .mb td.c{font-weight:700}
  .mb tr.pm td{background:#f0fdfa}
  .mb .note{margin-top:8px;font-size:8.6px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page mb"><h1>Mail Ballot Deadlines, Nov. 3, 2026</h1>
    <p class="sub">When a mailed ballot has to arrive · shaded states count ballots postmarked by Election Day that arrive later · ballots dropped off in person usually must arrive by the close of polls</p>
    <div class="cols">${tbl(MAIL.slice(0, half))}${tbl(MAIL.slice(half))}</div>
    <p class="note">The U.S. Postal Service advises mailing a ballot at least one week before it is due. In June 2026, the U.S. Supreme Court held in Watson v. Republican National Committee that federal law does not bar states from counting ballots that arrive after Election Day. Kansas's three-day grace period is in effect under a court injunction. Military and overseas voters have separate rules. Sources: state election codes as compiled by Ballotpedia; state election offices. Confirm with your county.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/mail-ballot-deadlines-2026-by-state/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── Election night tracker ───────────────────────────────────────────────────
const POLL_ET = new Map(POLLS.map(([s, , et]) => [s, et]));
export const SENATE_2026: [string, string?][] = [
  ["Alabama"], ["Alaska"], ["Arkansas"], ["Colorado"], ["Delaware"], ["Florida", "special"], ["Georgia"], ["Idaho"], ["Illinois"], ["Iowa"], ["Kansas"], ["Kentucky"],
  ["Louisiana"], ["Maine"], ["Massachusetts"], ["Michigan"], ["Minnesota"], ["Mississippi"], ["Montana"], ["Nebraska"], ["New Hampshire"], ["New Jersey"],
  ["New Mexico"], ["North Carolina"], ["Ohio", "special"], ["Oklahoma"], ["Oregon"], ["Rhode Island"], ["South Carolina"], ["South Dakota"], ["Tennessee"],
  ["Texas"], ["Virginia"], ["West Virginia"], ["Wyoming"],
];
export const GOVERNORS_2026 = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois",
  "Iowa", "Kansas", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Nebraska", "Nevada", "New Hampshire", "New Mexico", "New York", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Vermont", "Wisconsin", "Wyoming"];
function trackerSheets(fonts: string): string {
  const row = (s: string, tag?: string) => `<tr><td class="c">${s}${tag ? ` <em>${tag}</em>` : ""}</td><td>${POLL_ET.get(s) ?? ""}</td><td class="w"></td><td class="b"></td></tr>`;
  const tbl = (rows: string[]) => `<table><thead><tr><th>State</th><th>Polls close (ET)</th><th>Winner</th><th>Called</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
  const sen = SENATE_2026.map(([s, t]) => row(s, t));
  const gov = GOVERNORS_2026.map((s) => row(s));
  const css = `
  .tr{padding:30px 28px 0}
  .tr h1{font-family:Sora;font-weight:800;font-size:25px;margin:0;color:#1e3a8a;line-height:1.05}
  .tr .sub{margin:4px 0 10px;font-size:10.4px;color:#37474f}
  .tr .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .tr table{width:100%;border-collapse:collapse;font-size:9.6px}
  .tr th{background:#1e3a8a;color:#fff;font-family:Sora;font-size:8px;padding:4px;text-align:left}
  .tr td{padding:0 4px;height:37px;border-bottom:1px solid #d6dde8}
  .tr td.c{font-weight:700;width:38%}
  .tr td.w{border-left:1px dashed #cbd5e1;width:34%}
  .tr td.b{border-left:1px dashed #cbd5e1}
  .tr em{font-style:normal;font-size:8px;font-weight:800;color:#b91c1c;text-transform:uppercase}
  .tr .tot{display:flex;gap:10px;margin:10px 0 0}
  .tr .tot div{flex:1;border:1.5px solid #1e3a8a;border-radius:8px;padding:7px 10px;font-size:9.5px;color:#334155;height:62px}
  .tr .tot b{display:block;font-family:Sora;font-size:10px;color:#1e3a8a}`;
  const half = (l: string[]) => [l.slice(0, Math.ceil(l.length / 2)), l.slice(Math.ceil(l.length / 2))];
  const [s1, s2] = half(sen), [g1, g2] = half(gov);
  const p1 = `<section class="page tr"><h1>Election Night Tracker: U.S. Senate 2026</h1>
    <p class="sub">35 seats on the ballot Nov. 3, 2026: 33 regular seats plus special elections in Florida and Ohio · fill in each race as it is called</p>
    <div class="cols">${tbl(s1)}${tbl(s2)}</div>
    <div class="tot"><div><b>Senate today</b>53 Republicans, 47 Democrats and independents who caucus with them</div><div><b>Your tally</b></div><div><b>Control after Jan. 3, 2027</b></div></div>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/2026-midterm-elections-whats-on-the-ballot-results-tracker/</div></section>`;
  const p2 = `<section class="page tr"><h1>Election Night Tracker: Governors 2026</h1>
    <p class="sub">36 governorships on the ballot Nov. 3, 2026 · poll closing times are for most of each state, Eastern Standard Time</p>
    <div class="cols">${tbl(g1)}${tbl(g2)}</div>
    <div class="tot"><div><b>Runoff watch</b>Georgia runoffs, if needed: Dec. 1, 2026</div><div><b>Your tally</b></div><div><b>Notes</b></div></div>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/2026-midterm-elections-whats-on-the-ballot-results-tracker/</div></section>`;
  return doc(fonts, LETTER, css, [p1, p2]);
}

// ── State ballot checklists ──────────────────────────────────────────────────
export type StateSheet = {
  slug: string; state: string; accent: string; site: string;
  dates: [string, string][]; offices: string[]; measures: [string, string][]; measureLabel: string; note: string;
  candidates?: [string, string[]][];
  /** Heading over the candidate list when ballot order is not the order given. */
  candidatesLabel?: string;
};
export function stateSheet(fonts: string, s: StateSheet): string {
  const dates = s.dates.map(([d, w]) => `<li><b>${d}</b><span>${w}</span></li>`).join("");
  const offices = s.candidates
    ? s.candidates.map(([o, names]) => `<div class="off"><h3>${o}</h3>${names.map((n) => `<p><i></i>${n}</p>`).join("")}</div>`).join("")
    : s.offices.map((o) => `<div class="off"><h3>${o}</h3><p class="line"></p></div>`).join("");
  const measures = s.measures.map(([n, t]) => `<div class="m"><div class="mt"><b>${n}</b> ${t}</div><div class="yn"><span><i></i>Yes</span><span><i></i>No</span></div></div>`).join("");
  const css = `
  .st{display:flex;flex-direction:column;padding:30px 28px 42px}
  .st header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid ${s.accent};padding-bottom:7px;margin-bottom:10px}
  .st h1{font-family:Sora;font-weight:800;font-size:25px;margin:0;color:${s.accent};line-height:1.05}
  .st .sub{margin:3px 0 0;font-size:10px;color:#37474f}
  .st .badge{font-family:Sora;font-weight:800;font-size:12px;color:#fff;background:${s.accent};border-radius:6px;padding:6px 10px;white-space:nowrap}
  .st .grid{display:grid;grid-template-columns:205px 1fr;gap:14px}
  .st h2{font-family:Sora;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:${s.accent};margin:0 0 6px}
  .st ul{list-style:none;margin:0 0 12px;padding:0}
  .st li{border-left:3px solid ${s.accent};padding:3px 0 3px 8px;margin-bottom:5px;font-size:9.4px;line-height:1.3}
  .st li b{display:block;font-size:10px}
  .st .plan p{font-size:9.4px;margin:0 0 9px;border-bottom:1px solid #cbd5e1;padding-bottom:9px}
  .st .offs{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-bottom:10px}
  .st .off h3{font-size:9.6px;margin:4px 0 2px;color:#0f172a}
  .st .off p{font-size:8.9px;margin:0 0 1.5px;display:flex;align-items:center;gap:5px}
  .st .off p i{width:9px;height:9px;border:1.3px solid #334155;border-radius:50%;display:inline-block;flex:none}
  .st .off p.line{border-bottom:1px solid #cbd5e1;height:15px}
  .st .m{display:grid;grid-template-columns:1fr 92px;gap:6px;align-items:center;border-bottom:1px solid #e2e8f0;padding:4.5px 0}
  .st .mt{font-size:9.1px;line-height:1.3}
  .st .yn{display:flex;gap:9px;font-size:9.2px;font-weight:700}
  .st .yn i{width:10px;height:10px;border:1.4px solid #334155;display:inline-block;margin-right:3px;vertical-align:-1px}
  .st h2.loc{margin-top:14px}
  /* Ruled lines fill whatever the races leave, so the sources note always sits above the footer;
     real borders, because a repeating-gradient background prints as a 72 dpi bitmap. */
  .st .lines{flex:1;min-height:44px;overflow:hidden}
  .st .lines p{border-bottom:1px solid #cbd5e1;height:22px;margin:0}
  .st .note{margin-top:8px;font-size:8.4px;color:#5a6b75;line-height:1.4}`;
  const page = `<section class="page st"><header><div><h1>${s.state} Ballot Checklist, Nov. 3, 2026</h1><p class="sub">Copy your choices from your official sample ballot, then take this sheet with you · nonpartisan</p></div><div class="badge">Election Day · Tue., Nov. 3</div></header>
    <div class="grid"><div><h2>Key dates</h2><ul>${dates}</ul><h2>My voting plan</h2><div class="plan"><p>How I'll vote: in person early · by mail · on Election Day</p><p>Where:</p><p>When:</p><p>ID I'll bring:</p><p>Ride / childcare:</p></div></div>
    <div><h2>${s.candidatesLabel ?? (s.candidates ? "Statewide races (candidates in ballot order)" : "Statewide races")}</h2><div class="offs">${offices}</div>
    ${s.measures.length ? `<h2>${s.measureLabel}</h2>${measures}` : ""}</div></div>
    <h2 class="loc">Local races and notes</h2><div class="lines">${"<p></p>".repeat(40)}</div>
    <p class="note">${s.note}</p>
    <div class="foot">Free printable from Fresh Calendars · ${s.site}</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export const STATES: StateSheet[] = [
  {
    slug: "california-ballot-checklist-2026", state: "California", accent: "#1d4ed8", site: "freshcalendars.com/news/california-propositions-2026-november-ballot-explained/",
    dates: [["Oct. 5", "Mail ballots sent to all active voters"], ["Oct. 19", "Regular registration deadline (passed); same-day conditional registration continues"], ["Nov. 3, 8 p.m.", "Polls and drop boxes close"], ["Nov. 10", "Last day for a ballot postmarked by Nov. 3 to arrive"]],
    offices: ["Governor", "Lieutenant governor", "Attorney general", "Secretary of state", "Controller", "Treasurer", "Insurance commissioner", "Superintendent of public instruction"],
    measureLabel: "Propositions", note: "Source: California Secretary of State, Official Voter Information Guide (voterguide.sos.ca.gov). Propositions pass with a simple majority. Your county mails a sample ballot with local races.",
    measures: [["1", "Bonds for housing affordability programs"], ["2", "Increases state's rainy day fund"], ["3", "Extends existing tax on high incomes for schools and health care"], ["4", "Repeals ban on public funding of election campaigns"], ["5", "Changes recall election process for statewide officers"], ["37", "Loan program for middle-income buyers of new homes"], ["38", "Bonds for immunology medical research"], ["39", "Government-issued ID to vote"], ["40", "One-time tax on certain taxpayers"], ["41", "New taxes must count under spending limit; audits"], ["42", "Bars new personal property and retroactive taxes"], ["43", "Two-thirds vote for certain local special taxes"], ["44", "Clinics must spend 90% of revenue on services"], ["45", "Environmental review changes for certain projects"]],
  },
  {
    slug: "florida-ballot-checklist-2026", state: "Florida", accent: "#c2410c", site: "freshcalendars.com/news/florida-amendments-2026-ballot-senate-special-election/",
    dates: [["Oct. 5", "Registration deadline (passed)"], ["Oct. 22, 5 p.m.", "Last day to request a vote-by-mail ballot"], ["Oct. 24-31", "Early voting in every county (some counties add days)"], ["Nov. 3, 7 p.m.", "Polls close; mail ballots must be received"]],
    offices: ["U.S. senator (special election)", "Governor and lieutenant governor", "Attorney general", "Chief financial officer", "Commissioner of agriculture"],
    measureLabel: "Constitutional amendments (60% needed to pass)", note: "Sources: Florida Statutes 101.62, 101.657 and 101.67; county supervisors of elections. Photo ID with signature required at the polls.",
    measures: [["Amendment 1", "Budget Stabilization Fund: raises the reserve cap from 10% to 25%"], ["Amendment 2", "Tax exemption for tangible personal property on agricultural land"], ["Amendment 3", "Larger homestead exemption; lower cap on non-homestead assessment increases"]],
  },
  {
    slug: "michigan-ballot-checklist-2026", state: "Michigan", accent: "#0f766e", site: "freshcalendars.com/news/michigan-ballot-2026-proposals-candidates/",
    dates: [["Oct. 24-Nov. 1", "Early in-person voting, at least nine days statewide"], ["Through Nov. 3", "Register in person at your clerk's office with proof of residency"], ["Nov. 3, 7 a.m.-8 p.m.", "Polls open; absentee ballots must be received by 8 p.m."]],
    offices: [], measureLabel: "Statewide proposals",
    note: "Sources: Michigan Bureau of Elections certified candidate report; Michigan Department of State. Two Supreme Court seats: vote for up to two. Partial list: university boards and State Board of Education are also on your ballot.",
    candidates: [
      ["Governor / Lieutenant governor", ["Jocelyn Benson / Winnie Brinks (Dem.)", "John James / Jay DeBoyer (Rep.)", "Anthony Hudson / Beau Parmenter (Lib.)", "Donna Brandenburg / Robert Cowper II (U.S. Taxpayers)", "Doug Campbell / Bobbie Clay (Green)"]],
      ["U.S. Senate", ["Abdul El-Sayed (Dem.)", "Mike Rogers (Rep.)", "Lydia Christensen (Lib.)", "Tim Long (U.S. Taxpayers)", "Douglas P. Marsh (Green)", "Walter P. Kristy (Natural Law)"]],
      ["Secretary of state", ["Garlin Gilchrist II (Dem.)", "Anthony G. Forlini (Rep.)", "Others on ballot: Lib., U.S. Taxpayers, Green"]],
      ["Attorney general", ["Eli Savit (Dem.)", "Doug Lloyd (Rep.)", "Others on ballot: Lib., U.S. Taxpayers, Green, Natural Law"]],
      ["Supreme Court (vote for 2)", ["Megan K. Cavanagh (incumbent)", "Noah P. Hood (incumbent)", "Thomas W. Howe", "Casandra Morse-Bills", "Michael Warren", "Jody White"]],
    ],
    measures: [["Proposal 1", "Hold a convention in 2027 to draft a general revision of the state constitution"], ["Proposal 2", "Limit campaign contributions from certain utilities and government contractors; expand political ad disclosure"]],
  },
  {
    slug: "pennsylvania-ballot-checklist-2026", state: "Pennsylvania", accent: "#1e3a8a", site: "freshcalendars.com/news/pennsylvania-2026-election-governor-mail-ballot-deadlines/",
    dates: [["Oct. 19", "Registration deadline (passed)"], ["Oct. 27, 5 p.m.", "Last day to apply for a mail ballot; apply and vote in one visit at your county office"], ["Nov. 3, 7 a.m.-8 p.m.", "Polls open; mail ballots must be received by 8 p.m."]],
    offices: ["Governor and lieutenant governor", "U.S. House", "State Senate (25 of 50 seats)", "State House (all 203 seats)"],
    measureLabel: "Local questions (check your county sample ballot)", note: "Source: Pennsylvania Department of State. No U.S. Senate race and no statewide ballot question in 2026. First-time voters at a polling place must show ID.",
    measures: [["Question", "________________________________________"], ["Question", "________________________________________"], ["Question", "________________________________________"]],
  },
  {
    slug: "georgia-ballot-checklist-2026", state: "Georgia", accent: "#9f1239", site: "freshcalendars.com/news/georgia-2026-ballot-amendments-advance-voting/",
    dates: [["Oct. 13-30", "Advance (early) voting, including two Saturdays"], ["Oct. 23", "Last day to request an absentee ballot"], ["Nov. 3, 7 a.m.-7 p.m.", "Polls open; absentee ballots due by 7 p.m."], ["Dec. 1", "Runoff, if no candidate wins a majority"]],
    offices: ["U.S. senator", "Governor", "Lieutenant governor", "Secretary of state", "Insurance and fire safety commissioner", "Labor commissioner", "Agriculture commissioner", "State school superintendent"],
    measureLabel: "Constitutional amendments (your ballot sets the order)", note: "Sources: Georgia Secretary of State, offices up for election in 2026 (Jan. 29, 2026); georgia.gov election calendar. Photo ID required to vote in person.",
    measures: [["Farmland", "Raise the conservation-use property tax limit for farm and timberland"], ["Probate judges", "Elect all probate judges in nonpartisan elections"], ["9-1-1", "Create a dedicated Next Generation 9-1-1 fund"]],
  },
  {
    slug: "arizona-ballot-checklist-2026", state: "Arizona", accent: "#b45309", site: "freshcalendars.com/news/arizona-propositions-2026-ballot-explained/",
    dates: [["Oct. 7-30", "Early voting in person and by mail"], ["Oct. 23", "Last day to request an early ballot"], ["Nov. 3, 6 a.m.-7 p.m.", "Polls open; early ballots must be received by 7 p.m."]],
    offices: ["Governor and lieutenant governor (joint ticket)", "Secretary of state", "Attorney general", "State treasurer", "Superintendent of public instruction", "State mine inspector", "Corporation Commission (2 seats)", "Judicial retention"],
    measureLabel: "Propositions", note: "Sources: Arizona Secretary of State 2026 ballot language as reported by Ballotpedia and Axios. All eight were referred by the Legislature. No U.S. Senate race in 2026.",
    measures: [["141", "Bans taxes or fees based on miles driven"], ["142", "Bans race-based preferences by government"], ["144", "Citizenship and government ID rules for voting"], ["316", "Voter approval for local grocery taxes; 2% cap"], ["317", "Designates drug cartels as terrorist organizations"], ["318", "School restroom, locker room and sports rules by biological sex"], ["319", "Limits photo radar traffic enforcement"], ["320", "60% of large districts' budgets to classroom instruction"]],
  },
  {
    slug: "louisiana-ballot-checklist-2026", state: "Louisiana", accent: "#4c1d95", site: "freshcalendars.com/news/louisiana-sample-ballot-2026-senate-amendments/",
    dates: [["Oct. 20-27", "Early voting, 8:30 a.m.-6 p.m. (closed Sun., Oct. 25)"], ["Oct. 30, 4:30 p.m.", "Last day to request a mail ballot"], ["Nov. 2, 4:30 p.m.", "Registrar must receive voted mail ballots"], ["Nov. 3, 6 a.m.-8 p.m.", "Polls open"], ["Dec. 12", "U.S. House general election, if needed"]],
    offices: [], measureLabel: "Constitutional amendments",
    note: "Sources: Louisiana Secretary of State 2026 elections calendar, candidate inquiry and proposed constitutional amendments guide. U.S. House races are open primaries on Nov. 3; see your sample ballot at voterportal.sos.la.gov.",
    candidatesLabel: "Statewide and federal races",
    candidates: [["U.S. Senate", ["Jamie Davis (Dem.)", "Julia Letlow (Rep.)"]], ["U.S. House (open primary)", ["District: ____", "My choice: ______________"]]],
    measures: [["No. 1", "Disabled veteran's surviving spouse may transfer property tax exemption once"], ["No. 2", "Taxing authorities may keep a lower millage rate without losing the maximum"], ["No. 3", "No post-conviction bail for aggravated offenses against a minor"], ["No. 4", "No new term for a governor who served more than 1 1/2 terms"], ["No. 5", "Retirement systems may apply one-time money to any unfunded liability"], ["No. 6", "Local option: extra homestead exemption for owners 65 and older"], ["No. 7", "Public funds to replace lead drinking water service lines"], ["No. 8", "Bars expropriation of property by a foreign adversary"], ["No. 9", "Raises income limit for the senior special assessment level"], ["No. 10", "Tax exemptions for rehabilitated blighted property"]],
  },
  {
    slug: "ohio-ballot-checklist-2026", state: "Ohio", accent: "#b91c1c", site: "freshcalendars.com/news/ohio-sample-ballot-2026-governor-senate-issue-3/",
    dates: [["Oct. 6-Nov. 1", "Early in-person voting at your county board of elections"], ["Oct. 27", "Absentee ballot application must be received"], ["Nov. 3, 6:30 a.m.-7:30 p.m.", "Polls open; bring an unexpired photo ID"]],
    offices: [], measureLabel: "Statewide issue",
    note: "Source: Butler County Board of Elections, updated FWAB election notice (Oct. 2, 2026), listing candidates certified for all Ohio voters; write-in candidates not shown. Your county sample ballot adds U.S. House, legislative and local races.",
    candidates: [
      ["Governor / Lieutenant governor", ["Vivek Ramaswamy / Robert A. McColley (Rep.)", "Amy Acton / David Pepper (Dem.)", "Don Kissick / James L. Mills (Lib.)"]],
      ["U.S. Senate (unexpired term)", ["Jon Husted (Rep.)", "Sherrod Brown (Dem.)", "William B. Redpath (Lib.)", "Greg Levy (other party)"]],
      ["Attorney general", ["Keith Faber (Rep.)", "John J. Kulewicz (Dem.)"]],
      ["Auditor of state", ["Frank LaRose (Rep.)", "Annette Blackwell (Dem.)"]],
      ["Secretary of state", ["Robert Sprague (Rep.)", "Allison Russo (Dem.)", "Tom Pruss (Lib.)"]],
      ["Treasurer of state", ["Jay Edwards (Rep.)", "Seth Walsh (Dem.)"]],
      ["Supreme Court (term from Jan. 1, 2027)", ["Daniel R. Hawkins (Rep.)", "Marilyn Zayas (Dem.)"]],
      ["Supreme Court (term from Jan. 2, 2027)", ["Colleen O'Donnell (Rep.)", "Jennifer Brunner (Dem.)"]],
    ],
    candidatesLabel: "Statewide races (order on your ballot may differ)",
    measures: [["Issue 3", "Proposed constitutional amendment: require voters to present photo identification in order to vote"]],
  },
  {
    slug: "north-carolina-ballot-checklist-2026", state: "North Carolina", accent: "#0369a1", site: "freshcalendars.com/news/north-carolina-sample-ballot-2026-senate-amendments/",
    dates: [["Oct. 15-31", "One-stop early voting; same-day registration (ends 3 p.m. Oct. 31)"], ["Oct. 20, 5 p.m.", "Absentee ballot request deadline (passed)"], ["Nov. 3, 6:30 a.m.-7:30 p.m.", "Polls open; absentee ballots due by 7:30 p.m."]],
    offices: [], measureLabel: "Constitutional amendments",
    note: "Sources: NC State Board of Elections candidate list (Oct. 13, 2026) and Beaufort County official sample ballot. Notes and voter guides are allowed in the booth. Photo ID is requested; an ID exception form is available.",
    candidates: [
      ["U.S. Senate", ["Michael Dublin (Green)", "Roy Cooper (Dem.)", "Shannon W. Bray (Lib.)", "Michael Whatley (Rep.)"]],
      ["Supreme Court, Seat 1", ["Anita Earls (Dem.)", "Sarah Stevens (Rep.)"]],
      ["Court of Appeals, Seat 1", ["Michael C. Byrne (Rep.)", "John S. Arrowood (Dem.)"]],
      ["Court of Appeals, Seat 2", ["George Cooper Bell (Rep.)", "Tobias (Toby) Hampson (Dem.)"]],
      ["Court of Appeals, Seat 3", ["Craig Collins (Rep.)", "Christine Marie Walczyk (Dem.)"]],
      ["U.S. House", ["District: ____", "My choice: ______________"]],
    ],
    candidatesLabel: "Statewide races (order on your ballot may differ)",
    measures: [["Photo ID", "Require all voters, not just those voting in person, to present photo ID"], ["Income tax", "Keep the state income tax rate from being raised higher than 3.5%"], ["Property tax", "Require limits on property tax increases by local governments"]],
  },
  {
    slug: "new-jersey-ballot-checklist-2026", state: "New Jersey", accent: "#0f766e", site: "freshcalendars.com/news/new-jersey-sample-ballot-2026-senate-early-voting/",
    dates: [["Oct. 24-Nov. 1", "Early in-person voting: Mon.-Sat. 10 a.m.-8 p.m., Sun. 10 a.m.-6 p.m."], ["Nov. 3, 8 p.m.", "Drop boxes and county boards close"], ["Nov. 3, 6 a.m.-8 p.m.", "Polls open"], ["Within 6 days", "Mailed ballots postmarked by Nov. 3 must arrive"]],
    offices: [], measureLabel: "Local public questions (check your county sample ballot)",
    note: "Source: New Jersey Division of Elections, official general election candidates for U.S. Senate (July 27, 2026) and U.S. House (Sept. 4, 2026). No statewide public question is listed for 2026. Your county clerk mails your sample ballot.",
    candidates: [["U.S. Senate", ["Cory Booker (Dem., incumbent)", "Justin Murphy (Rep.)", "Veronica Fernandez (End the Corruption!)", "Joanne Kuniansky (Socialist Workers Party)"]], ["U.S. House", ["District: ____", "My choice: ______________"]]],
    candidatesLabel: "Federal races (order on your ballot may differ)",
    measures: [["Question", "________________________________________"], ["Question", "________________________________________"]],
  },
];

// ── Sample ballot lookup by state ────────────────────────────────────────────
/**
 * [state, official portal, URL, where sample ballots are posted]. Checked Oct. 20, 2026 against each
 * state election office and vote.gov; the same list is the table in the sample ballot story.
 */
export const BALLOT_LOOKUPS: [string, string, string, "state" | "county" | "both"][] = [
  ["Alabama", "Alabama Votes VoterView", "https://myinfo.alabamavotes.gov/voterview", "county"],
  ["Alaska", "Alaska Voter Information", "https://myvoterinformation.alaska.gov/", "state"],
  ["Arizona", "My.Arizona.Vote", "https://my.arizona.vote/WhereToVote/Default.aspx", "county"],
  ["Arkansas", "Arkansas Voter View", "https://www.voterview.ar-nova.org/voterview", "county"],
  ["California", "My Voter Status", "https://www.sos.ca.gov/elections/registration-status", "county"],
  ["Colorado", "GoVoteColorado: Find My Registration", "https://www.coloradosos.gov/voter/pages/pub/olvr/findVoterReg.xhtml", "state"],
  ["Connecticut", "Connecticut Voter Registration Lookup", "https://portaldir.ct.gov/sots/LookUp.aspx", "county"],
  ["Delaware", "Delaware iVote VoterView", "https://ivote.de.gov/VoterView", "state"],
  ["District of Columbia", "D.C. Board of Elections: Check Registration", "https://www.dcboe.org/voters/register-to-vote/check-voter-registration-status", "state"],
  ["Florida", "Florida Voter Information Lookup", "https://registration.elections.myflorida.com/CheckVoterStatus", "county"],
  ["Georgia", "Georgia My Voter Page", "https://mvp.sos.ga.gov/s/", "state"],
  ["Hawaii", "Hawaii Online Voter Services", "https://olvr.hawaii.gov/", "county"],
  ["Idaho", "IdahoVotes", "https://idahovotes.gov/", "county"],
  ["Illinois", "Illinois Voter Registration Lookup", "https://ova.elections.il.gov/RegistrationLookup.aspx", "county"],
  ["Indiana", "Indiana Voter Portal", "https://indianavoters.in.gov/", "state"],
  ["Iowa", "Iowa Voter Information", "https://sos.iowa.gov/elections/voterreg/voterinformation.aspx", "county"],
  ["Kansas", "Kansas VoterView", "https://myvoteinfo.voteks.org/voterview", "county"],
  ["Kentucky", "GoVoteKY", "https://govoteky.com/", "county"],
  ["Louisiana", "Louisiana Voter Portal (GeauxVote)", "https://voterportal.sos.la.gov/", "state"],
  ["Maine", "Maine Elections: Information About Voting", "https://www.maine.gov/sos/elections-voting/information-about-voting", "county"],
  ["Maryland", "Maryland Voter Lookup", "https://voterservices.elections.maryland.gov/votersearch", "state"],
  ["Massachusetts", "Massachusetts Voter Registration Status", "https://www.sec.state.ma.us/VoterRegistrationSearch/MyVoterRegStatus.aspx", "county"],
  ["Michigan", "Michigan Voter Information Center", "https://mvic.sos.state.mi.us/", "state"],
  ["Minnesota", "What's On My Ballot", "https://www.sos.mn.gov/elections-voting/whats-on-my-ballot/", "state"],
  ["Mississippi", "Y'all Vote", "https://yallvote.sos.ms.gov/", "county"],
  ["Missouri", "Missouri Voter Lookup", "https://voteroutreach.sos.mo.gov/portal/", "county"],
  ["Montana", "Montana My Voter Page", "https://app.mt.gov/voterinfo/", "county"],
  ["Nebraska", "Nebraska VoterCheck", "https://www.votercheck.necvr.ne.gov/voterview", "county"],
  ["Nevada", "Nevada Voter Search", "https://www.nvsos.gov/votersearch/", "both"],
  ["New Hampshire", "New Hampshire Voter Information Lookup", "https://app.sos.nh.gov/voterinformation", "county"],
  ["New Jersey", "New Jersey Voter Registration Check", "https://voter.svrs.nj.gov/registration-check", "county"],
  ["New Mexico", "New Mexico Voter Portal", "https://voterportal.servis.sos.state.nm.us/WhereToVote.aspx", "state"],
  ["New York", "New York Voter Lookup", "https://voterlookup.elections.ny.gov/", "county"],
  ["North Carolina", "North Carolina Voter Search", "https://vt.ncsbe.gov/RegLkup/", "state"],
  ["North Dakota", "North Dakota Where to Vote", "https://vip.sos.nd.gov/WhereToVote.aspx", "county"],
  ["Ohio", "Ohio Voter Lookup", "https://voterlookup.ohiosos.gov/voterlookup.aspx", "county"],
  ["Oklahoma", "Oklahoma Voter Portal", "https://oklahoma.gov/elections/ovp.html", "state"],
  ["Oregon", "Oregon My Vote", "https://secure.sos.state.or.us/orestar/vr/showVoterSearch.do", "county"],
  ["Pennsylvania", "Pennsylvania Voter Registration Status", "https://www.pavoterservices.pa.gov/pages/voterregistrationstatus.aspx", "county"],
  ["Rhode Island", "Rhode Island Voter Information Center", "https://vote.sos.ri.gov/", "state"],
  ["South Carolina", "MyscVOTES at scVOTES.gov", "https://scvotes.gov/", "state"],
  ["South Dakota", "South Dakota Voter Information Portal", "https://vip.sdsos.gov/VIPLogin.aspx", "county"],
  ["Tennessee", "GoVoteTN Voter Lookup", "https://web.go-vote-tn.elections.tn.gov/", "state"],
  ["Texas", "Texas My Voter Portal", "https://teamrv-mvp.sos.texas.gov/MVP/mvp.do", "county"],
  ["Utah", "Vote.Utah.gov", "https://vote.utah.gov/", "state"],
  ["Vermont", "Vermont My Voter Page", "https://mvp.vermont.gov/", "county"],
  ["Virginia", "Virginia Department of Elections: View Your Info", "https://www.elections.virginia.gov/registration/view-your-info/", "county"],
  ["Washington", "VoteWA", "https://voter.votewa.gov/WhereToVote.aspx", "state"],
  ["West Virginia", "West Virginia Voter Registration Lookup", "https://apps.sos.wv.gov/elections/voter/", "county"],
  ["Wisconsin", "Wisconsin MyVote", "https://myvote.wi.gov/en-us/", "state"],
  ["Wyoming", "Wyoming Secretary of State: Elections", "https://sos.wyo.gov/Elections/", "county"],
];
function lookupSheet(fonts: string): string {
  const short = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const tag = { state: "State", county: "County", both: "Both" };
  const row = ([st, name, url, b]: (typeof BALLOT_LOOKUPS)[number]) => `<tr><td class="c">${st}</td><td><b>${name}</b><span>${short(url)}</span></td><td class="t ${b}">${tag[b]}</td></tr>`;
  const half = Math.ceil(BALLOT_LOOKUPS.length / 2);
  const tbl = (x: typeof BALLOT_LOOKUPS) => `<table><thead><tr><th>State</th><th>Official lookup</th><th>Ballot</th></tr></thead><tbody>${x.map(row).join("")}</tbody></table>`;
  const css = `
  .lk{padding:28px 26px 0}
  .lk h1{font-family:Sora;font-weight:800;font-size:25px;margin:0;color:#1f3a5f;line-height:1.05}
  .lk .sub{margin:4px 0 9px;font-size:10px;color:#37474f}
  .lk .cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .lk table{width:100%;border-collapse:collapse;font-size:9.2px}
  .lk th{background:#1f3a5f;color:#fff;font-family:Sora;font-size:8.6px;padding:4.5px 5px;text-align:left}
  .lk td{padding:3.4px 5px;border-bottom:1px solid #e3e8ee;line-height:1.22;vertical-align:top}
  .lk td.c{font-weight:700;width:23%}
  .lk td b{display:block;font-size:9.2px}
  .lk td span{display:block;color:#475569;font-size:8px;word-break:break-all}
  .lk td.t{width:12%;font-weight:700;font-size:8.4px}
  .lk td.state{color:#15803d} .lk td.both{color:#1d4ed8} .lk td.county{color:#9a3412}
  .lk .note{margin-top:9px;font-size:9.4px;color:#5a6b75;line-height:1.4}`;
  const page = `<section class="page lk"><h1>Find Your Sample Ballot: Official Lookup by State, 2026</h1>
    <p class="sub">General election Tuesday, Nov. 3, 2026 · "State" = the state portal shows your sample ballot · "County" = your county, city or town elections office posts it · nonpartisan</p>
    <div class="cols">${tbl(BALLOT_LOOKUPS.slice(0, half))}${tbl(BALLOT_LOOKUPS.slice(half))}</div>
    <p class="note">Search by your full street address or by name and date of birth, not by ZIP code alone: one ZIP code can include several districts. Links checked Oct. 20, 2026 against state election offices and vote.gov. If a portal shows only your registration, open your county elections office site for the ballot.</p>
    <div class="foot">Free printable from Fresh Calendars · freshcalendars.com/news/sample-ballot-by-zip-code-2026-texas-ballot/</div></section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildElection2026Downloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("election-2026", [
    { slug: "poll-closing-times-2026", size: LETTER, html: pollSheet(fonts) },
    { slug: "mail-ballot-deadlines-2026", size: LETTER, html: mailSheet(fonts) },
    { slug: "election-night-tracker-2026", size: LETTER, html: trackerSheets(fonts) },
    { slug: "sample-ballot-lookup-by-state-2026", size: LETTER, html: lookupSheet(fonts) },
    ...STATES.map((s) => ({ slug: s.slug, size: LETTER, html: stateSheet(fonts, s) })),
  ]);
}
