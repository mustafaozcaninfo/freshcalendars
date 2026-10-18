/**
 * Social Security 2027 printables for /news/ (three independent Fresh Calendars templates).
 *
 *   1. social-security-increase-2027-chart — monthly benefit before and after the 3.6% COLA, $600 to $5,100
 *   2. social-security-scam-checklist      — COLA scam red flags, what SSA never does, where to report
 *   3. social-security-payment-calendar-2027 — every 2027 payment date by birth date, SSI and the 3rd
 *
 * Payment dates follow SSA's published rules (SSA Publication No. 05-10031): Wednesdays by birth
 * date; SSI on the 1st and "3rd of the month" payments, each moved to the prior business day when
 * it falls on a weekend or federal holiday. Usage: pnpm fc news-ssa
 */
import { holidaysForYear } from "@freshcalendars/engine";
import { LETTER, doc, fontFaces } from "./julian.js";
import { DAY, DOW3, MON3, MONTHS, renderPrintables, utc } from "./printables.js";

const SITE = "freshcalendars.com/news/social-security-cola-2027-scams-increase-chart/";
const NAVY = "#12355b", GREEN = "#1a7f5a", RED = "#b42318";
export const COLA = 0.036;

/** SSA applies the COLA to the benefit and rounds the payment down to the whole dollar. */
export const after = (m: number) => Math.floor(m * (1 + COLA));
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

// ── 1. Increase chart ───────────────────────────────────────────────────────
function increaseChart(fonts: string): string {
  const rows: string[] = [];
  for (let m = 600; m <= 5100; m += 100) {
    const n = after(m);
    rows.push(`<tr${m === 2100 ? ' class="avg"' : ""}><td>${usd(m)}</td><td class="b">${usd(n)}</td><td>+${usd(n - m)}</td><td>+${usd((n - m) * 12)}</td></tr>`);
  }
  const half = Math.ceil(rows.length / 2);
  const table = (r: string[]) => `<table><thead><tr><th>2026 benefit</th><th>2027 benefit</th><th>Per month</th><th>Per year</th></tr></thead><tbody>${r.join("")}</tbody></table>`;
  const css = `
  .s1{padding:36px 36px 0}
  .s1 header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid ${GREEN};padding-bottom:10px;margin-bottom:14px}
  .s1 h1{font-family:Sora;font-weight:800;font-size:32px;margin:0;color:${NAVY};line-height:1.05}
  .s1 .sub{margin:6px 0 0;font-size:11.5px;color:#37474f}
  .s1 .badge{font-family:Sora;font-weight:800;font-size:28px;background:${GREEN};color:#fff;border-radius:12px;padding:8px 14px}
  .s1 .cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  .s1 table{width:100%;border-collapse:collapse;font-size:11.6px;font-variant-numeric:tabular-nums}
  .s1 th{background:${NAVY};color:#fff;font-family:Sora;font-weight:700;font-size:9.6px;padding:6px 5px;text-align:right}
  .s1 td{padding:6.9px 6px;border-bottom:1px solid #e1e8ef;text-align:right}
  .s1 tr:nth-child(even) td{background:#f4f8fb}
  .s1 td.b{font-weight:700;color:${GREEN}}
  .s1 tr.avg td{background:#fff4cc!important;font-weight:700}
  .s1 .keys{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
  .s1 .keys div{background:#f4f8fb;border-radius:10px;padding:9px 11px;border-left:4px solid ${GREEN}}
  .s1 .keys b{display:block;font-family:Sora;font-size:10px;color:${NAVY}}
  .s1 .keys span{font-size:12px;font-weight:700}
  .s1 .note{margin-top:10px;font-size:9.8px;color:#5a6b75;line-height:1.45}`;
  const page = `<section class="page s1">
    <header><div><h1>Social Security Increase 2027 Chart</h1><p class="sub">Your monthly benefit before and after the 3.6% cost-of-living adjustment, paid from January 2027 (SSI from Dec. 31, 2026)</p></div><div class="badge">+3.6%</div></header>
    <div class="cols">${table(rows.slice(0, half))}${table(rows.slice(half))}</div>
    <div class="keys"><div><b>Average retired worker</b><span>$2,095 → $2,170</span></div><div><b>Maximum at full retirement age</b><span>$4,152 → $4,188</span></div><div><b>SSI, individual</b><span>$994 → $1,029</span></div></div>
    <p class="note">Estimates: the 2026 amount times 1.036, rounded down to the dollar, before Medicare or tax deductions. SSA applies the COLA to your primary insurance amount, so your notice can differ by a dollar or two. The highlighted row is closest to the average retired worker. Averages and maximums: SSA 2027 COLA fact sheet. The COLA is automatic; you never pay or sign up for it.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── 2. Scam checklist ───────────────────────────────────────────────────────
function scamChecklist(fonts: string): string {
  const flags = [
    "Asks for a fee to “activate,” “unlock” or “boost” your 2027 raise",
    "Says you must verify your Social Security number or bank details to get the COLA",
    "Sends a link or QR code by text, email or social media",
    "Transfers your call from a store, bank or another agency to “Social Security”",
    "Threatens arrest, legal action or a suspended Social Security number",
    "Wants gift cards, crypto, wire transfers, cash, gold or a barcode paid at a store",
    "Tells you to keep the call secret or to move money to “protect” it",
    "Pushes you to act right now, before you can talk to anyone",
  ];
  const never = [
    "Charge a fee for your cost-of-living adjustment",
    "Ask you to sign up for or activate the COLA",
    "Threaten you or demand immediate payment",
    "Ask you to pay with gift cards, crypto, cash or a QR code",
    "Have another company or agency transfer your call to SSA",
  ];
  const css = `
  .s2{padding:34px 38px 0}
  .s2 .top{background:${RED};color:#fff;border-radius:16px;padding:18px 22px;margin-bottom:14px}
  .s2 .top b{font-family:Sora;font-weight:800;font-size:13px;letter-spacing:.12em;color:#ffd6d1}
  .s2 h1{font-family:Sora;font-weight:800;font-size:31px;margin:4px 0 4px;line-height:1.1}
  .s2 .top p{margin:0;font-size:13px;color:#ffe9e6}
  .s2 h2{font-family:Sora;font-weight:800;font-size:16px;color:${NAVY};margin:14px 0 8px}
  .s2 ul{list-style:none;margin:0;padding:0}
  .s2 li{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.35;padding:9px 0;border-bottom:1px solid #eef1f4}
  .s2 li i{flex:none;width:18px;height:18px;border:2px solid ${RED};border-radius:4px;margin-top:1px}
  .s2 .never li i{border-color:${GREEN};border-radius:50%}
  .s2 .two{display:grid;grid-template-columns:1.15fr 1fr;gap:22px}
  .s2 .box{background:#eef6f1;border-radius:14px;padding:12px 16px;margin-top:14px}
  .s2 .box h2{margin-top:0}
  .s2 .box p{margin:4px 0;font-size:12.6px;line-height:1.4}
  .s2 .box b{color:${NAVY}}
  .s2 .facts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
  .s2 .facts div{border:2px solid #dde5ec;border-radius:12px;padding:9px 11px}
  .s2 .facts b{display:block;font-family:Sora;font-size:18px;color:${NAVY}}
  .s2 .facts span{font-size:10.5px;color:#5a6b75}
  .s2 .note{margin-top:10px;font-size:9.6px;color:#5a6b75;line-height:1.4}`;
  const page = `<section class="page s2">
    <div class="top"><b>SCAM WARNING · KEEP BY THE PHONE</b><h1>Your 2027 Social Security raise is automatic</h1><p>The 3.6% COLA needs no fee, no form and no phone call. Anyone who says otherwise is a scammer.</p></div>
    <div class="two">
      <div><h2>It's a scam if someone…</h2><ul>${flags.map((f) => `<li><i></i>${f}</li>`).join("")}</ul></div>
      <div class="never"><h2>Social Security will never…</h2><ul>${never.map((f) => `<li><i></i>${f}</li>`).join("")}</ul></div>
    </div>
    <div class="box"><h2>What to do</h2>
      <p><b>1. Hang up or don't reply.</b> Don't press any numbers, click links or scan codes.</p>
      <p><b>2. Check it yourself.</b> Type <b>ssa.gov/myaccount</b> into your browser, or call SSA at <b>1-800-772-1213</b> (TTY 1-800-325-0778).</p>
      <p><b>3. Report it.</b> <b>oig.ssa.gov/report</b> or the Inspector General's Fraud Hotline, <b>1-800-269-0271</b>. Also <b>reportfraud.ftc.gov</b>.</p>
      <p><b>4. Tell someone you trust.</b> Scammers rely on secrecy and speed.</p></div>
    <div class="facts"><div><b>3.6%</b><span>2027 COLA, announced Oct. 14, 2026</span></div><div><b>Late Nov.</b><span>COLA notices appear in my Social Security</span></div><div><b>Dec. 31</b><span>First SSI payment with the raise</span></div></div>
    <p class="note">Sources: SSA Office of the Inspector General scam alerts (Sept. 21 and Sept. 28, 2026; July 29, 2026), Social Security Administration. Real SSA email addresses end in .gov, but scammers can fake caller ID and logos, so always contact SSA using a number you look up yourself.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

// ── 3. Payment calendar 2027 ────────────────────────────────────────────────
export function paymentDates(y: number) {
  // Federal holidays as observed: Saturday → Friday, Sunday → Monday (New Year's Day 2028 is
  // observed on Friday, Dec. 31, 2027, which moves that SSI payment to Thursday, Dec. 30).
  const off = new Set<string>();
  for (const yy of [y - 1, y, y + 1]) for (const h of holidaysForYear(yy, { federalOnly: true })) {
    const d = utc(h.date.getFullYear(), h.date.getMonth(), h.date.getDate()), w = d.getUTCDay();
    const o = w === 6 ? new Date(d.getTime() - DAY) : w === 0 ? new Date(d.getTime() + DAY) : d;
    off.add(o.toISOString().slice(0, 10));
  }
  const isBiz = (d: Date) => { const w = d.getUTCDay(); return w !== 0 && w !== 6 && !off.has(d.toISOString().slice(0, 10)); };
  const back = (d: Date) => { let t = d; while (!isBiz(t)) t = new Date(t.getTime() - DAY); return t; };
  const wed = (m: number, n: number) => { const first = utc(y, m, 1); const off = (3 - first.getUTCDay() + 7) % 7; return utc(y, m, 1 + off + (n - 1) * 7); };
  return MONTHS.map((_, m) => ({
    m,
    ssiOwn: back(utc(y, m, 1)),
    ssiNext: back(m === 11 ? utc(y + 1, 0, 1) : utc(y, m + 1, 1)),
    third: back(utc(y, m, 3)),
    w2: wed(m, 2), w3: wed(m, 3), w4: wed(m, 4),
  }));
}
function paymentCalendar(fonts: string): string {
  const y = 2027;
  const p = paymentDates(y);
  const md = (d: Date) => `${DOW3[d.getUTCDay()]}, ${MON3[d.getUTCMonth()]} ${d.getUTCDate()}${d.getUTCFullYear() !== y ? `, ${d.getUTCFullYear()}` : ""}`;
  const moved = (d: Date, day: number, m: number) => d.getUTCDate() !== day || d.getUTCMonth() !== m;
  const next = (r: (typeof p)[number]) => (r.ssiNext.getUTCMonth() === r.m ? `<br><span class="mv">+ ${md(r.ssiNext)} (next month's)</span>` : "");
  const rows = p.map((r) => `<tr><th>${MONTHS[r.m]}</th><td class="${moved(r.ssiOwn, 1, r.m) ? "mv" : ""}">${md(r.ssiOwn)}${next(r)}</td><td class="${moved(r.third, 3, r.m) ? "mv" : ""}">${md(r.third)}</td><td>${md(r.w2)}</td><td>${md(r.w3)}</td><td>${md(r.w4)}</td></tr>`).join("");
  const css = `
  .s3{padding:36px 34px 0}
  .s3 h1{font-family:Sora;font-weight:800;font-size:32px;margin:0;color:${NAVY}}
  .s3 h1 span{color:${GREEN}}
  .s3 .sub{margin:4px 0 14px;font-size:11.5px;color:#37474f}
  .s3 table{width:100%;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}
  .s3 thead th{background:${NAVY};color:#fff;font-family:Sora;font-weight:700;font-size:9.6px;padding:7px 6px;text-align:left;vertical-align:bottom;line-height:1.25}
  .s3 tbody th{font-family:Sora;font-weight:700;font-size:13px;color:${NAVY};text-align:left;padding:16px 6px;border-bottom:1px solid #e1e8ef}
  .s3 td{padding:16px 6px;font-size:12.5px;border-bottom:1px solid #e1e8ef;white-space:nowrap}
  .s3 tbody tr:nth-child(even) td,.s3 tbody tr:nth-child(even) th{background:#f4f8fb}
  .s3 td.mv,.s3 span.mv{color:${RED};font-weight:700}
  .s3 .note{margin-top:12px;font-size:10px;color:#5a6b75;line-height:1.5}
  .s3 .note b{color:${NAVY}}`;
  const page = `<section class="page s3">
    <h1>Social Security Payment Calendar <span>2027</span></h1>
    <p class="sub">When each 2027 payment arrives · Social Security pays on a Wednesday chosen by your birth date · SSI pays on the 1st</p>
    <table><thead><tr><th>Month</th><th>SSI<br>(normally the 1st)</th><th>Benefits began before May 1997, or SSI too (the 3rd)</th><th>Born 1st–10th<br>(2nd Wednesday)</th><th>Born 11th–20th<br>(3rd Wednesday)</th><th>Born 21st–31st<br>(4th Wednesday)</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="note"><b>Red dates</b> moved to the business day before a weekend or federal holiday. Because of those moves, SSI recipients get <b>no payment in January, May or August 2027</b> and <b>two payments in April, July and December</b>; the second one each time is the next month's benefit, paid early. The January 2027 SSI payment arrives on Thursday, Dec. 31, 2026, and the January 2028 payment on Thursday, Dec. 30, 2027. Dates match SSA's official schedule, Publication No. 05-10031. Payments include the 3.6% COLA all year.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

export async function buildSocialSecurityDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("social-security-2027", [
    { slug: "social-security-increase-2027-chart", size: LETTER, html: increaseChart(fonts) },
    { slug: "social-security-scam-checklist", size: LETTER, html: scamChecklist(fonts) },
    { slug: "social-security-payment-calendar-2027", size: LETTER, html: paymentCalendar(fonts) },
  ]);
}
