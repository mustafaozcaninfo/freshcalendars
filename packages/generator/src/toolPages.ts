/**
 * Countdown pages (/days-until/) and the date calculators under /calendar-tools/.
 *
 * Every number on these pages is baked once a day and then recomputed in the reader's browser
 * against their own date (TOOLS_JS), so a page opened late at night or from a cache is still right.
 * The baked values sit inside volatile markers: a countdown that ticks down is not a content change.
 * Holiday dates come from the engine's rules, never typed in.
 */
import {
  allHolidayRules, holidayLocaleForSlug, holidayWhenIsPath, holidaysForMonth, holidaysForYear, monthNumberToName,
  resolveHoliday, resolveNextHoliday, type HolidayDef, type ResolvedHoliday,
} from "@freshcalendars/engine";
import { breadcrumbNavHtml, esc, iconHtml } from "@freshcalendars/site-chrome";
import { monthHref } from "./datedPages.js";

export type ToolPage = {
  id: string; path: string; title: string; description: string; body: string;
  crumbs: { name: string; url: string }[];
  /** Holiday shown on the share card's month sheet. */
  holiday?: { slug: string; year: number };
};
type Helpers = {
  volatile: (html: string) => string;
  holidayMonthBlock: (h: { name: string; year: number; month: number; day: number }, others: { name: string; day: number }[], us?: boolean) => string;
};

const DAY = 864e5;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const utc = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d);
const dayOf = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
const parseIso = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return utc(y!, m!, d!); };
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);
const num = (n: number) => n.toLocaleString("en-US");
const plural = (n: number, w: string) => `${num(n)} ${w}${n === 1 ? "" : "s"}`;
export function longDate(t: number): string {
  const d = new Date(t);
  return `${WEEKDAYS[d.getUTCDay()]}, ${monthNumberToName(d.getUTCMonth() + 1)} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
/** Monday to Friday days after `a`, up to and including `b`. */
export function weekdaysBetween(a: number, b: number): number {
  const days = Math.round((b - a) / DAY), full = Math.floor(days / 7);
  let count = full * 5;
  for (let t = a + full * 7 * DAY + DAY; t <= b; t += DAY) { const g = new Date(t).getUTCDay(); if (g !== 0 && g !== 6) count++; }
  return count;
}
/** Same day of the month `m` months on; a day the month lacks becomes its last day (Jan 31 + 1 month = Feb 28 or 29). */
export function addMonths(t: number, m: number): number {
  const d = new Date(t), mo = d.getUTCMonth() + m, last = new Date(Date.UTC(d.getUTCFullYear(), mo + 1, 0)).getUTCDate();
  return Date.UTC(d.getUTCFullYear(), mo, Math.min(d.getUTCDate(), last));
}
/** Whole calendar months and leftover days from `a` to `b`. */
export function monthsAndDays(a: number, b: number): [number, number] {
  const x = new Date(a), y = new Date(b);
  let m = (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + y.getUTCMonth() - x.getUTCMonth();
  if (addMonths(a, m) > b) m--;
  return [m, Math.round((b - addMonths(a, m)) / DAY)];
}
/** ISO 8601 week: weeks start on Monday and week 1 holds the year's first Thursday. */
export function isoWeek(t: number): { week: number; year: number } {
  const day = new Date(t).getUTCDay() || 7, thu = new Date(t + (4 - day) * DAY);
  return { week: Math.ceil(((thu.getTime() - Date.UTC(thu.getUTCFullYear(), 0, 1)) / DAY + 1) / 7), year: thu.getUTCFullYear() };
}
/** US convention: weeks start on Sunday and week 1 holds January 1. */
export function usWeek(t: number): number {
  const y = new Date(t).getUTCFullYear(), jan1 = Date.UTC(y, 0, 1);
  return Math.floor((Math.round((t - jan1) / DAY) + new Date(jan1).getUTCDay()) / 7) + 1;
}
const dayOfYear = (t: number) => Math.round((t - Date.UTC(new Date(t).getUTCFullYear(), 0, 1)) / DAY) + 1;
const isLeap = (y: number) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
const weeksAndDays = (n: number) => (n < 7 ? plural(n, "day") : `${plural(Math.floor(n / 7), "week")}${n % 7 ? `, ${plural(n % 7, "day")}` : ""}`);
function monthsText(a: number, b: number): string {
  const [m, d] = monthsAndDays(a, b);
  return m ? `${plural(m, "month")}${d ? `, ${plural(d, "day")}` : ""}` : plural(d, "day");
}

/** Holidays that get a countdown page: every US one, plus UK and Canada days the US list lacks. */
type Countdown = { def: HolidayDef; slug: string; label: string; locale: "us" | "uk" | "ca" };
let countdownCache: Countdown[] | null = null;
export function countdownHolidays(): Countdown[] {
  if (countdownCache) return countdownCache;
  const out: Countdown[] = [], seen = new Map<string, Set<string>>();
  const probe = [2026, 2027, 2028];
  for (const def of allHolidayRules()) {
    const locale = holidayLocaleForSlug(def.slug);
    const sig = probe.map((y) => resolveHoliday(def, y).iso.slice(5)).join(",");
    const dates = seen.get(def.name);
    // Same name on the same dates (Christmas Day in three countries) is one countdown.
    if (dates?.has(sig)) continue;
    const label = dates ? `${def.name} in ${locale === "uk" ? "the UK" : locale === "ca" ? "Canada" : "the US"}` : def.name;
    seen.set(def.name, (dates ?? new Set()).add(sig));
    out.push({ def, slug: def.slug, label, locale });
  }
  return (countdownCache = out);
}
export const countdownPath = (slug: string) => `/days-until/${slug}/`;
export const hasCountdown = (slug: string) => countdownHolidays().some((c) => c.slug === slug);

/**
 * US federal holidays as most federal employees observe them: a holiday on a Saturday is observed
 * the Friday before, one on a Sunday the Monday after (OPM). Keyed by ISO date.
 */
export function observedFederalHolidays(fromYear: number, toYear: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (let y = fromYear; y <= toYear; y++) {
    for (const h of holidaysForYear(y, { federalOnly: true })) {
      const t = utc(h.year, h.month, h.day), g = new Date(t).getUTCDay();
      out[toIso(g === 6 ? t - DAY : g === 0 ? t + DAY : t)] = h.name;
    }
  }
  return out;
}

/**
 * One script for every tool page. Dates are handled as UTC midnights so a daylight saving change
 * never adds or drops a day. `today` is the reader's own date.
 */
export const TOOLS_JS = `
(function(){
var D=864e5,WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
function P(s){var a=String(s||'').split('-').map(Number),t=a.length===3?Date.UTC(a[0],a[1]-1,a[2]):NaN;return isFinite(t)&&a[0]>999&&a[0]<10000?t:NaN}
function I(t){return new Date(t).toISOString().slice(0,10)}
var n0=new Date(),T=Date.UTC(n0.getFullYear(),n0.getMonth(),n0.getDate());
function F(t){var d=new Date(t);return WD[d.getUTCDay()]+', '+MN[d.getUTCMonth()]+' '+d.getUTCDate()+', '+d.getUTCFullYear()}
function N(x){return x.toLocaleString('en-US')}
function L(x,w){return N(x)+' '+w+(x===1?'':'s')}
function WKD(a,b){var days=Math.round((b-a)/D),full=Math.floor(days/7),c=full*5;for(var t=a+full*7*D+D;t<=b;t+=D){var g=new Date(t).getUTCDay();if(g!==0&&g!==6)c++}return c}
function AM(t,m){var d=new Date(t),mo=d.getUTCMonth()+m,last=new Date(Date.UTC(d.getUTCFullYear(),mo+1,0)).getUTCDate();return Date.UTC(d.getUTCFullYear(),mo,Math.min(d.getUTCDate(),last))}
function MD(a,b){var x=new Date(a),y=new Date(b),m=(y.getUTCFullYear()-x.getUTCFullYear())*12+y.getUTCMonth()-x.getUTCMonth();if(AM(a,m)>b)m--;return [m,Math.round((b-AM(a,m))/D)]}
function MT(a,b){var r=MD(a,b);return r[0]?L(r[0],'month')+(r[1]?', '+L(r[1],'day'):''):L(r[1],'day')}
function WT(n){return n<7?L(n,'day'):L(Math.floor(n/7),'week')+(n%7?', '+L(n%7,'day'):'')}
function IW(t){var day=new Date(t).getUTCDay()||7,th=new Date(t+(4-day)*D);return [Math.ceil(((th-Date.UTC(th.getUTCFullYear(),0,1))/D+1)/7),th.getUTCFullYear()]}
function UW(t){var j=Date.UTC(new Date(t).getUTCFullYear(),0,1);return Math.floor((Math.round((t-j)/D)+new Date(j).getUTCDay())/7)+1}
function DY(t){return Math.round((t-Date.UTC(new Date(t).getUTCFullYear(),0,1))/D)+1}
function YL(t){var y=new Date(t).getUTCFullYear();return y%4===0&&(y%100!==0||y%400===0)?366:365}
function E(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
function rows(a){return '<dl class="tool-out">'+a.map(function(r){return '<div><dt>'+E(r[0])+'</dt><dd>'+E(r[1])+'</dd></div>'}).join('')+'</dl>'}

document.querySelectorAll('[data-du]').forEach(function(el){
  var t=P(el.getAttribute('data-du')),n=Math.round((t-T)/D),k=el.getAttribute('data-du-part')||'days';
  if(!isFinite(n))return;
  if(n<0){if(k==='days')el.textContent='0';else if(k==='phrase')el.textContent='passed';return}
  el.textContent=k==='days'?N(n):k==='weeks'?WT(n):k==='weekdays'?N(WKD(T,t)):k==='weekends'?N(n-WKD(T,t)):k==='months'?MT(T,t):k==='unit'?(n===1?'day':'days'):n===0?'today':n===1?'tomorrow':'in '+L(n,'day');
});
document.querySelectorAll('[data-ft]').forEach(function(el){el.textContent=F(T+Number(el.getAttribute('data-ft'))*D)});
document.querySelectorAll('[data-fw]').forEach(function(el){el.textContent=F(T+Number(el.getAttribute('data-fw'))*7*D)});
document.querySelectorAll('[data-fm]').forEach(function(el){el.textContent=F(AM(T,Number(el.getAttribute('data-fm'))))});
document.querySelectorAll('[data-fb]').forEach(function(el){var k=Number(el.getAttribute('data-fb')),t=T;while(k>0){t+=D;var g=new Date(t).getUTCDay();if(g!==0&&g!==6)k--}el.textContent=F(t)});
document.querySelectorAll('[data-today]').forEach(function(el){
  var k=el.getAttribute('data-today'),w=IW(T);
  el.textContent=k==='date'?F(T):k==='doy'?N(DY(T)):k==='left'?N(YL(T)-DY(T)):k==='len'?N(YL(T)):k==='week'?String(w[0]):k==='usweek'?String(UW(T)):k==='weekyear'?String(w[1]):k==='year'?String(new Date(T).getUTCFullYear()):el.textContent;
});
document.querySelectorAll('[data-week-start]').forEach(function(tr){var s=P(tr.getAttribute('data-week-start'));tr.classList.toggle('is-now',T>=s&&T<s+7*D)});
document.querySelectorAll('[data-month-row]').forEach(function(tr){var d=new Date(T);tr.classList.toggle('is-now',Number(tr.getAttribute('data-month-row'))===d.getUTCMonth()+1&&Number(tr.getAttribute('data-year-row'))===d.getUTCFullYear())});
document.querySelectorAll('input[type=date][data-default]').forEach(function(el){var v=el.getAttribute('data-default');el.value=I(v==='today'?T:v==='year-end'?Date.UTC(new Date(T).getUTCFullYear(),11,31):T+Number(v)*D)});

document.querySelectorAll('form[data-tool]').forEach(function(form){
  var out=form.querySelector('output'),kind=form.getAttribute('data-tool');
  function run(e){
    if(e)e.preventDefault();
    var f=new FormData(form),a=P(f.get('from')),b=P(f.get('to')),h='';
    if(kind==='between'||kind==='business'){
      if(!isFinite(a)||!isFinite(b)){out.innerHTML='<p>Choose a start date and an end date.</p>';return}
      var back=b<a;if(back){var x=a;a=b;b=x}
      var inc=f.get('inclusive')?1:0,n=Math.round((b-a)/D)+inc,wd=WKD(a,b)+(inc&&[0,6].indexOf(new Date(a).getUTCDay())<0?1:0);
      if(kind==='between'){
        h='<p class="tool-big"><b>'+L(n,'day')+'</b></p>'+rows([['From',F(a)],['To',F(b)],['In weeks',WT(n)],['In months',MT(a,b+inc*D)],['Weekdays (Mon to Fri)',N(wd)],['Weekend days',N(n-wd)]]);
      }else{
        var hol=[],map=f.get('holidays')?JSON.parse(form.getAttribute('data-holidays')||'{}'):{};
        for(var k in map){var t=P(k);if(t<=b&&(t>a||(inc&&t===a))){hol.push(map[k]+' ('+F(t)+')')}}
        h='<p class="tool-big"><b>'+L(wd-hol.length,'business day')+'</b></p>'+rows([['From',F(a)],['To',F(b)],['Calendar days',N(n)],['Weekend days',N(n-wd)],['Federal holidays skipped',hol.length?hol.join('; '):'None']]);
      }
      if(back)h+='<p class="tool-note">The end date is before the start date, so the two were swapped.</p>';
    }else if(kind==='add'){
      var q=Number(f.get('amount')),u=f.get('unit'),s=f.get('op')==='subtract'?-1:1;
      if(!isFinite(a)||!isFinite(q)||q<0||q%1){out.innerHTML='<p>Choose a start date and a whole number.</p>';return}
      var r=u==='weeks'?a+s*q*7*D:u==='months'?AM(a,s*q):u==='years'?AM(a,s*q*12):u==='business'?(function(){var t=a,k=q;while(k>0){t+=s*D;var g=new Date(t).getUTCDay();if(g!==0&&g!==6)k--}return t})():a+s*q*D;
      if(!isFinite(r)){out.innerHTML='<p>That date is out of range.</p>';return}
      var w=IW(r);
      h='<p class="tool-big"><b>'+F(r)+'</b></p>'+rows([['Start',F(a)],[s<0?'Subtracted':'Added',L(q,u==='business'?'business day':String(u).replace(/s$/,''))],['Days apart',N(Math.abs(Math.round((r-a)/D)))],['Week number','Week '+w[0]+' of '+w[1]],['Day of the year',N(DY(r))+' of '+YL(r)]]);
    }else if(kind==='week'){
      if(!isFinite(a)){out.innerHTML='<p>Choose a date.</p>';return}
      var w2=IW(a),day=new Date(a).getUTCDay()||7,mon=a-(day-1)*D;
      h='<p class="tool-big"><b>Week '+w2[0]+'</b> of '+w2[1]+'</p>'+rows([['Date',F(a)],['ISO week',w2[1]+'-W'+('0'+w2[0]).slice(-2)],['Week runs',F(mon)+' to '+F(mon+6*D)],['US week number (Sunday start)','Week '+UW(a)]]);
    }else if(kind==='doy'){
      if(!isFinite(a)){out.innerHTML='<p>Choose a date.</p>';return}
      h='<p class="tool-big"><b>Day '+N(DY(a))+'</b> of '+YL(a)+'</p>'+rows([['Date',F(a)],['Days left in the year',N(YL(a)-DY(a))],['Ordinal date',new Date(a).getUTCFullYear()+'-'+('00'+DY(a)).slice(-3)],['Week number','Week '+IW(a)[0]]]);
    }else if(kind==='until'){
      if(!isFinite(a)){out.innerHTML='<p>Choose a date.</p>';return}
      var m=Math.round((a-T)/D);
      h=m===0?'<p class="tool-big"><b>That is today.</b></p>':m>0?'<p class="tool-big"><b>'+L(m,'day')+'</b> until '+F(a)+'</p>'+rows([['In weeks',WT(m)],['In months',MT(T,a)],['Weekdays (Mon to Fri)',N(WKD(T,a))],['Weekend days',N(m-WKD(T,a))]]):'<p class="tool-big"><b>'+L(-m,'day')+'</b> since '+F(a)+'</p>'+rows([['In weeks',WT(-m)],['In months',MT(a,T)]]);
    }
    out.innerHTML=h;
  }
  form.addEventListener('submit',run);
  if(form.hasAttribute('data-auto'))run();
});
})();
`;

const crumbs = (...c: [string, string][]) => [{ name: "Home", url: "https://freshcalendars.com/" }, ...c.map(([name, p]) => ({ name, url: `https://freshcalendars.com${p}` }))];
const TOOLS: [string, string, string, string, string][] = [
  ["days-between-dates", "calendar", "Days between dates", "Count the days, weeks, weekdays and weekends between any two dates.", "Count days"],
  ["add-days", "calc", "Add or subtract days", "Find the date a number of days, weeks, months or years before or after a date.", "Find a date"],
  ["days-from-today", "arrow", "Days from today", "The date 30, 60, 90 or any number of days from today, and the same number of days ago.", "See the dates"],
  ["business-days", "chart", "Business days", "Weekdays between two dates, with an option to skip US federal holidays.", "Count business days"],
  ["week-number", "week", "Week number", "This week's number, and the dates of every week of the year.", "See week numbers"],
  ["day-of-year", "list", "Day of the year", "Today's day number, the days left in the year and each month's first day number.", "See day numbers"],
];
const toolPath = (slug: string) => `/calendar-tools/${slug}/`;
function toolLinks(current: string): string {
  return `<nav class="tool-more" aria-label="More date tools"><h2>More date tools</h2><div class="tool-grid">${TOOLS.filter(([slug]) => slug !== current).map(([slug, icon, name, text]) => `<a class="tool-card" href="${toolPath(slug)}">${iconHtml(icon)}<strong>${name}</strong><span>${text}</span></a>`).join("")}<a class="tool-card" href="/days-until/">${iconHtml("holiday")}<strong>Days until a holiday</strong><span>A countdown to every US, UK and Canada holiday.</span></a></div></nav>`;
}
const dateInput = (name: string, label: string, def: string) => `<label>${label}<input name="${name}" type="date" data-default="${def}" required></label>`;
const shell = (cls: string, crumb: { name: string; url: string }[], inner: string) => `<section class="concept-wrap tools-page ${cls}">${breadcrumbNavHtml(crumb)}${inner}</section>`;

function hubPage(today: Date, h: Helpers): ToolPage {
  const t = dayOf(today), y = today.getFullYear(), w = isoWeek(t), len = isLeap(y) ? 366 : 365;
  const next = countdownHolidays().map((c) => ({ c, h: resolveNextHoliday(c.def, today) })).filter((x) => x.c.locale === "us").sort((a, b) => a.h.iso.localeCompare(b.h.iso)).slice(0, 6);
  const body = shell("tools-hub", crumbs(["Calendar tools", "/calendar-tools/"]), `
<h1>Date calculators and calendar tools</h1>
<p class="tool-lead">Count the days between two dates, find a date a number of days from now, or look up today's week number and day of the year. Every tool works in your browser and uses the date on your device.</p>
<div class="tool-today" aria-label="Today">
  <div><span>Today</span><strong data-today="date">${h.volatile(longDate(t))}</strong></div>
  <div><span>Week number</span><strong>Week <b data-today="week">${h.volatile(String(w.week))}</b></strong></div>
  <div><span>Day of the year</span><strong><b data-today="doy">${h.volatile(String(dayOfYear(t)))}</b> of <b data-today="len">${len}</b></strong></div>
  <div><span>Days left this year</span><strong data-today="left">${h.volatile(String(len - dayOfYear(t)))}</strong></div>
</div>
<div class="tool-grid">${TOOLS.map(([slug, icon, name, text, cta]) => `<a class="tool-card" href="${toolPath(slug)}">${iconHtml(icon)}<strong>${name}</strong><span>${text}</span><em>${cta} →</em></a>`).join("")}</div>
<h2>Quick count</h2>
<div class="date-tools">
  <form data-tool="between"><h3>Days between dates</h3>${dateInput("from", "Start date", "today")}${dateInput("to", "End date", "year-end")}<button class="studio-primary">Count the days</button><output aria-live="polite"></output></form>
  <form data-tool="add"><h3>Add or subtract days</h3>${dateInput("from", "Start date", "today")}<label>Number of days<input name="amount" type="number" value="30" min="0" step="1" required></label><input type="hidden" name="unit" value="days"><label>Direction<select name="op"><option value="add">After the start date</option><option value="subtract">Before the start date</option></select></label><button class="studio-primary">Find the date</button><output aria-live="polite"></output></form>
</div>
<h2>Days until the next holidays</h2>
<table class="dates-table tool-table"><thead><tr><th scope="col">Holiday</th><th scope="col">Date</th><th scope="col">Days left</th></tr></thead><tbody>${next.map(({ c, h: r }) => `<tr><td><a href="${countdownPath(c.slug)}">${esc(c.label)}</a></td><td>${esc(r.formatted)}</td><td><span data-du="${r.iso}">${h.volatile(String(Math.round((parseIso(r.iso) - t) / DAY)))}</span></td></tr>`).join("")}</tbody></table>
<p><a href="/days-until/">Countdown to every holiday →</a></p>
<h2>How the tools count</h2>
<p>A count between two dates is the number of days you would cross off a calendar: the start date is not counted and the end date is. From a Monday to the Friday of the same week is 4 days. Tick "Count the start date too" where a tool offers it and the same span is 5 days.</p>
<p>Months are calendar months. One month after January 31 is the last day of February, because February has no 31st. Week numbers follow ISO 8601, the international standard: weeks start on Monday and week 1 is the week with the year's first Thursday.</p>
<p class="tool-links"><a href="/monthly-calendars/">Monthly calendars</a> · <a href="/printable-calendars.html">Yearly calendar</a> · <a href="/holidays/">US holiday dates</a> · <a href="/print-guide.html">Printing guide</a></p>`);
  return { id: "calendar-tools", path: "/calendar-tools/", title: "Date Calculator · Days Between Dates, Add Days, Week Number", description: "Free date calculators: count the days between two dates, add or subtract days, find business days, today's week number and the day of the year.", body, crumbs: crumbs(["Calendar tools", "/calendar-tools/"]) };
}

function betweenPage(today: Date, h: Helpers): ToolPage {
  const t = dayOf(today), y = today.getFullYear();
  const ends: [string, number][] = [[`the end of ${y}`, utc(y, 12, 31)], [`New Year's Day ${y + 1}`, utc(y + 1, 1, 1)], [`the end of ${y + 1}`, utc(y + 1, 12, 31)]];
  const c = crumbs(["Calendar tools", "/calendar-tools/"], ["Days between dates", toolPath("days-between-dates")]);
  const body = shell("tool-single", c, `
<h1>Days between dates calculator</h1>
<p class="tool-lead">Pick two dates to count the days between them, with the same span in weeks, months, weekdays and weekend days.</p>
<div class="date-tools one"><form data-tool="between" data-auto><h2>Count the days</h2>${dateInput("from", "Start date", "today")}${dateInput("to", "End date", "year-end")}<label class="tool-check"><input type="checkbox" name="inclusive"> Count the start date too</label><button class="studio-primary">Count the days</button><output aria-live="polite"></output></form></div>
<h2>From today</h2>
<table class="dates-table tool-table"><thead><tr><th scope="col">From today to</th><th scope="col">Days</th><th scope="col">Weekdays</th></tr></thead><tbody>${ends.map(([label, e]) => `<tr><td>${label}</td><td><span data-du="${toIso(e)}">${h.volatile(num(Math.round((e - t) / DAY)))}</span></td><td><span data-du="${toIso(e)}" data-du-part="weekdays">${h.volatile(num(weekdaysBetween(t, e)))}</span></td></tr>`).join("")}</tbody></table>
<h2>How the days are counted</h2>
<p>The calculator subtracts the start date from the end date. The start date is not counted and the end date is, the way you would count squares on a wall calendar. January 1 to January 31 is 30 days. Tick "Count the start date too" to count both ends: 31 days.</p>
<p>Weekdays are Monday to Friday. Weekend days are Saturdays and Sundays. "In months" counts whole calendar months first, then the days left over, so March 15 to May 20 is 2 months, 5 days.</p>
<p>Leap years are handled: a span that crosses February 29 includes it. ${isLeap(y) ? `${y} is a leap year with 366 days.` : `${y} has 365 days; the next leap year is ${[1, 2, 3, 4, 5, 6, 7, 8].map((k) => y + k).find(isLeap)}.`}</p>
<p>To count working days without public holidays, use the <a href="${toolPath("business-days")}">business days calculator</a>.</p>
${toolLinks("days-between-dates")}`);
  return { id: "tool-days-between-dates", path: toolPath("days-between-dates"), title: "Days Between Dates Calculator · Days, Weeks and Weekdays", description: "Count the days between two dates. The result also shows the span in weeks, calendar months, weekdays and weekend days, with or without the start date.", body, crumbs: c };
}

function addPage(): ToolPage {
  const c = crumbs(["Calendar tools", "/calendar-tools/"], ["Add or subtract days", toolPath("add-days")]);
  const body = shell("tool-single", c, `
<h1>Add or subtract days from a date</h1>
<p class="tool-lead">Enter a start date and a number of days, weeks, months or years. The calculator returns the date that many units after or before it, with its weekday and week number.</p>
<div class="date-tools one"><form data-tool="add" data-auto><h2>Find the date</h2>${dateInput("from", "Start date", "today")}<label>Number<input name="amount" type="number" value="90" min="0" step="1" required></label><label>Unit<select name="unit"><option value="days">Days</option><option value="business">Business days (Mon to Fri)</option><option value="weeks">Weeks</option><option value="months">Months</option><option value="years">Years</option></select></label><label>Direction<select name="op"><option value="add">After the start date</option><option value="subtract">Before the start date</option></select></label><button class="studio-primary">Find the date</button><output aria-live="polite"></output></form></div>
<h2>How the date is worked out</h2>
<p>Days and weeks are added one calendar day at a time, so the answer is the same in every time zone and across daylight saving changes. Business days skip Saturdays and Sundays; public holidays are not skipped.</p>
<p>Months and years keep the day of the month. When the target month is too short, the answer is that month's last day: one month after January 31 is February 28, or February 29 in a leap year. One year after February 29 is February 28.</p>
<p>For a ready table of common spans from today, see <a href="${toolPath("days-from-today")}">days from today</a>.</p>
${toolLinks("add-days")}`);
  return { id: "tool-add-days", path: toolPath("add-days"), title: "Add Days to a Date · Add or Subtract Days, Weeks, Months", description: "Add or subtract days, business days, weeks, months or years from any date. See the resulting date with its weekday, week number and day of the year.", body, crumbs: c };
}

function fromTodayPage(today: Date, h: Helpers): ToolPage {
  const t = dayOf(today);
  const days = [7, 10, 14, 15, 20, 21, 28, 30, 40, 45, 60, 70, 75, 90, 100, 120, 150, 180, 200, 270, 300, 365];
  const weeks = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 26, 52];
  const months = [1, 2, 3, 4, 6, 9, 12, 18, 24];
  const business = [5, 10, 15, 20, 30, 45, 60, 90];
  const businessDate = (k: number) => { let x = t; while (k > 0) { x += DAY; const g = new Date(x).getUTCDay(); if (g !== 0 && g !== 6) k--; } return x; };
  const c = crumbs(["Calendar tools", "/calendar-tools/"], ["Days from today", toolPath("days-from-today")]);
  const body = shell("tool-single", c, `
<h1>Days from today</h1>
<p class="tool-lead">Today is <strong data-today="date">${h.volatile(longDate(t))}</strong>. The tables give the date a set number of days, weeks, months or business days from today, and the same number of days ago.</p>
<div class="date-tools one"><form data-tool="add" data-auto><h2>Any number of days</h2>${dateInput("from", "Start date", "today")}<label>Number of days<input name="amount" type="number" value="30" min="0" step="1" required></label><input type="hidden" name="unit" value="days"><label>Direction<select name="op"><option value="add">From the start date</option><option value="subtract">Before the start date</option></select></label><button class="studio-primary">Find the date</button><output aria-live="polite"></output></form></div>
<h2>Days from today and days ago</h2>
<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Days</th><th scope="col">From today</th><th scope="col">Ago</th></tr></thead><tbody>${days.map((d) => `<tr><th scope="row">${d} days</th><td data-ft="${d}">${h.volatile(longDate(t + d * DAY))}</td><td data-ft="-${d}">${h.volatile(longDate(t - d * DAY))}</td></tr>`).join("")}</tbody></table></div>
<h2>Weeks from today</h2>
<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Weeks</th><th scope="col">From today</th><th scope="col">Ago</th></tr></thead><tbody>${weeks.map((d) => `<tr><th scope="row">${plural(d, "week")}</th><td data-fw="${d}">${h.volatile(longDate(t + d * 7 * DAY))}</td><td data-fw="-${d}">${h.volatile(longDate(t - d * 7 * DAY))}</td></tr>`).join("")}</tbody></table></div>
<h2>Months from today</h2>
<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Months</th><th scope="col">From today</th><th scope="col">Ago</th></tr></thead><tbody>${months.map((d) => `<tr><th scope="row">${plural(d, "month")}</th><td data-fm="${d}">${h.volatile(longDate(addMonths(t, d)))}</td><td data-fm="-${d}">${h.volatile(longDate(addMonths(t, -d)))}</td></tr>`).join("")}</tbody></table></div>
<h2>Business days from today</h2>
<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Business days</th><th scope="col">From today</th></tr></thead><tbody>${business.map((d) => `<tr><th scope="row">${d} business days</th><td data-fb="${d}">${h.volatile(longDate(businessDate(d)))}</td></tr>`).join("")}</tbody></table></div>
<p>Business days here are Monday to Friday; public holidays are not skipped. To leave out US federal holidays, use the <a href="${toolPath("business-days")}">business days calculator</a>.</p>
<h2>How the dates are counted</h2>
<p>Today is day zero. "30 days from today" is the date 30 days after today, so tomorrow is 1 day from today. A month from today keeps the same day of the month; where the month is too short, the date is its last day.</p>
<p>The tables use the date on your device and are right the moment you open the page.</p>
${toolLinks("days-from-today")}`);
  return { id: "tool-days-from-today", path: toolPath("days-from-today"), title: "Days From Today · What Date Is 30, 60 or 90 Days From Now?", description: "The date 30, 45, 60, 90, 120 or 180 days from today, and the same number of days ago, with weeks, months and business days from today in one table.", body, crumbs: c };
}

function businessPage(today: Date): ToolPage {
  const y = today.getFullYear(), map = observedFederalHolidays(y - 5, y + 10);
  const list = (yr: number) => holidaysForYear(yr, { federalOnly: true }).map((r) => {
    const t = utc(r.year, r.month, r.day), g = new Date(t).getUTCDay(), obs = g === 6 ? t - DAY : g === 0 ? t + DAY : t;
    return `<tr><td>${esc(r.name)}</td><td>${esc(longDate(t))}</td><td>${obs === t ? "Same day" : esc(longDate(obs))}</td></tr>`;
  }).join("");
  const c = crumbs(["Calendar tools", "/calendar-tools/"], ["Business days", toolPath("business-days")]);
  const body = shell("tool-single", c, `
<h1>Business days calculator</h1>
<p class="tool-lead">Count the working days, Monday to Friday, between two dates. Leave the box ticked to skip the 11 US federal holidays on the days they are observed.</p>
<div class="date-tools one"><form data-tool="business" data-auto data-holidays="${esc(JSON.stringify(map))}"><h2>Count business days</h2>${dateInput("from", "Start date", "today")}${dateInput("to", "End date", "year-end")}<label class="tool-check"><input type="checkbox" name="holidays" checked> Skip US federal holidays</label><label class="tool-check"><input type="checkbox" name="inclusive"> Count the start date too</label><button class="studio-primary">Count business days</button><output aria-live="polite"></output></form></div>
<h2>What counts as a business day</h2>
<p>A business day here is a weekday, Monday to Friday, that is not a US federal holiday. The start date is not counted and the end date is; tick "Count the start date too" to count both.</p>
<p>When a federal holiday falls on a Saturday, most federal employees observe it on the Friday before. When it falls on a Sunday, it is observed on the Monday after. The calculator skips the observed day. The rule and the holiday list are from the <a href="https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/" rel="noopener">US Office of Personnel Management</a>. Holiday dates in the calculator run from ${y - 5} to ${y + 10}.</p>
<p>Banks, courts, schools and private employers set their own closing days, and state holidays are not included. Check with the organization when a deadline depends on it.</p>
<h2>Federal holidays ${y}</h2>
<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Holiday</th><th scope="col">Date</th><th scope="col">Observed</th></tr></thead><tbody>${list(y)}</tbody></table></div>
<h2>Federal holidays ${y + 1}</h2>
<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Holiday</th><th scope="col">Date</th><th scope="col">Observed</th></tr></thead><tbody>${list(y + 1)}</tbody></table></div>
<p><a href="/holidays/">All US holidays with weekdays →</a></p>
${toolLinks("business-days")}`);
  return { id: "tool-business-days", path: toolPath("business-days"), title: "Business Days Calculator · Weekdays Between Two Dates", description: `Count business days between two dates, Monday to Friday, with US federal holidays skipped on their observed days. Includes the ${y} and ${y + 1} holiday lists.`, body, crumbs: c };
}

function weekPage(today: Date, h: Helpers): ToolPage {
  const t = dayOf(today), w = isoWeek(t);
  const table = (yr: number) => {
    // ISO week 1 is the week that holds January 4.
    const jan4 = utc(yr, 1, 4), first = jan4 - ((new Date(jan4).getUTCDay() || 7) - 1) * DAY, count = isoWeek(utc(yr, 12, 28)).week;
    const short = (x: number) => `${monthNumberToName(new Date(x).getUTCMonth() + 1).slice(0, 3)} ${new Date(x).getUTCDate()}${new Date(x).getUTCFullYear() !== yr ? `, ${new Date(x).getUTCFullYear()}` : ""}`;
    return { count, html: `<div class="tool-scroll"><table class="dates-table tool-table week-table"><thead><tr><th scope="col">Week</th><th scope="col">Monday</th><th scope="col">Sunday</th></tr></thead><tbody>${Array.from({ length: count }, (_, i) => { const s = first + i * 7 * DAY; return `<tr data-week-start="${toIso(s)}"><th scope="row">Week ${i + 1}</th><td>${short(s)}</td><td>${short(s + 6 * DAY)}</td></tr>`; }).join("")}</tbody></table></div>` };
  };
  const cur = table(w.year), nxt = table(w.year + 1);
  const c = crumbs(["Calendar tools", "/calendar-tools/"], ["Week number", toolPath("week-number")]);
  const body = shell("tool-single", c, `
<h1>What week number is it?</h1>
<div class="du-answer"><p class="du-big">Week <b data-today="week">${h.volatile(String(w.week))}</b></p><p>of <span data-today="weekyear">${h.volatile(String(w.year))}</span>, for <span data-today="date">${h.volatile(longDate(t))}</span>. On the US week count, which starts weeks on Sunday, it is week <span data-today="usweek">${h.volatile(String(usWeek(t)))}</span>.</p></div>
<div class="date-tools one"><form data-tool="week"><h2>Week number for any date</h2>${dateInput("from", "Date", "today")}<button class="studio-primary">Find the week</button><output aria-live="polite"></output></form></div>
<h2>Week numbers ${w.year}</h2>
<p>${w.year} has ${cur.count} ISO weeks. The current week is highlighted.</p>
${cur.html}
<h2>Week numbers ${w.year + 1}</h2>
<p>${w.year + 1} has ${nxt.count} ISO weeks.</p>
<details class="tool-details"><summary>Show all ${nxt.count} weeks of ${w.year + 1}</summary>${nxt.html}</details>
<h2>Two ways to number weeks</h2>
<p>The large number above follows ISO 8601, the international standard used across Europe and in most software. Weeks start on Monday, and week 1 is the week that holds the year's first Thursday, which is always the week with January 4. A year has 52 or 53 ISO weeks, and the first days of January can belong to the last week of the year before.</p>
<p>In the United States, calendars usually start weeks on Sunday and call the week that holds January 1 week 1. The two counts can differ by one. The lookup above gives both.</p>
<p>A written ISO week looks like ${w.year}-W${String(w.week).padStart(2, "0")}: the week-numbering year, then the week.</p>
<p>Need the weeks on paper? The <a href="/printable-weekly-calendar.html">weekly planner</a> and the <a href="/printable-calendars.html">yearly calendar</a> print on Letter or A4.</p>
${toolLinks("week-number")}`);
  return { id: "tool-week-number", path: toolPath("week-number"), title: `What Week Number Is It? Week Numbers ${w.year} and ${w.year + 1}`, description: `Today's week number, the week number for any date, and the Monday and Sunday of every week in ${w.year} and ${w.year + 1}, with ISO and US counts explained.`, body, crumbs: c };
}

function dayOfYearPage(today: Date, h: Helpers): ToolPage {
  const t = dayOf(today), y = today.getFullYear(), len = isLeap(y) ? 366 : 365;
  const table = (yr: number) => `<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Month</th><th scope="col">First day number</th><th scope="col">Last day number</th><th scope="col">Days</th></tr></thead><tbody>${Array.from({ length: 12 }, (_, i) => { const a = dayOfYear(utc(yr, i + 1, 1)), b = dayOfYear(Date.UTC(yr, i + 1, 0)); return `<tr data-month-row="${i + 1}" data-year-row="${yr}"><th scope="row">${monthNumberToName(i + 1)}</th><td>${a}</td><td>${b}</td><td>${b - a + 1}</td></tr>`; }).join("")}</tbody></table></div>`;
  const c = crumbs(["Calendar tools", "/calendar-tools/"], ["Day of the year", toolPath("day-of-year")]);
  const body = shell("tool-single", c, `
<h1>What day of the year is it?</h1>
<div class="du-answer"><p class="du-big">Day <b data-today="doy">${h.volatile(String(dayOfYear(t)))}</b></p><p>of <span data-today="len">${len}</span>, for <span data-today="date">${h.volatile(longDate(t))}</span>. There are <span data-today="left">${h.volatile(String(len - dayOfYear(t)))}</span> days left in <span data-today="year">${y}</span>.</p></div>
<div class="date-tools one"><form data-tool="doy"><h2>Day number for any date</h2>${dateInput("from", "Date", "today")}<button class="studio-primary">Find the day number</button><output aria-live="polite"></output></form></div>
<h2>Day numbers by month, ${y}</h2>
<p>To get a date's day number, add the day of the month to the number before its month's first day. ${isLeap(y) ? `${y} is a leap year, so every date from March 1 on is one higher than in a common year.` : `${y} is a common year of 365 days.`}</p>
${table(y)}
<h2>Day numbers by month, ${y + 1}</h2>
${table(y + 1)}
<h2>Day number, ordinal date and "Julian date"</h2>
<p>The day of the year runs from 1 on January 1 to 365 on December 31, or 366 in a leap year. Written with the year, as in ${y}-${String(dayOfYear(t)).padStart(3, "0")}, it is an ordinal date under ISO 8601.</p>
<p>Food packaging, manufacturing and the military often call this number a Julian date. Astronomers use the same name for a different count, a running total of days, so check which one a form means.</p>
${toolLinks("day-of-year")}`);
  return { id: "tool-day-of-year", path: toolPath("day-of-year"), title: `What Day of the Year Is It? Day Numbers ${y} and ${y + 1}`, description: `Today's day number, the days left in ${y}, the day number for any date, and each month's first and last day numbers for ${y} and ${y + 1}.`, body, crumbs: c };
}

function countdownTitle(label: string, year: number): string {
  return [`How Many Days Until ${label} ${year}? Countdown`, `How Many Days Until ${label} ${year}?`, `Days Until ${label} ${year} · Countdown`, `Days Until ${label} ${year}`].find((s) => s.length <= 60) ?? `Days Until ${label}`;
}
function clipSentence(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}.`;
}

function countdownHub(today: Date, h: Helpers): ToolPage {
  const t = dayOf(today), y = today.getFullYear();
  const all = countdownHolidays().map((c) => ({ c, r: resolveNextHoliday(c.def, today) })).sort((a, b) => a.r.iso.localeCompare(b.r.iso) || a.c.def.sort - b.c.def.sort);
  const table = (locale: string) => `<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Holiday</th><th scope="col">Date</th><th scope="col">Days left</th></tr></thead><tbody>${all.filter((x) => x.c.locale === locale).map(({ c, r }) => `<tr><td><a href="${countdownPath(c.slug)}">${esc(c.def.name)}</a></td><td>${esc(r.formatted)}</td><td><span data-du="${r.iso}">${h.volatile(num(Math.round((parseIso(r.iso) - t) / DAY)))}</span></td></tr>`).join("")}</tbody></table></div>`;
  const c = crumbs(["Days until", "/days-until/"]);
  const first = all[0]!;
  const body = shell("tool-single days-until-hub", c, `
<h1>How many days until each holiday?</h1>
<p class="tool-lead">Today is <strong data-today="date">${h.volatile(longDate(t))}</strong>. The next holiday is <a href="${countdownPath(first.c.slug)}">${esc(first.c.label)}</a>, <span data-du="${first.r.iso}" data-du-part="phrase">${h.volatile(phrase(Math.round((parseIso(first.r.iso) - t) / DAY)))}</span>. Each holiday links to its own countdown with the weeks, weekdays and weekends left.</p>
<div class="date-tools one"><form data-tool="until"><h2>Days until any date</h2>${dateInput("from", "Date", "30")}<button class="studio-primary">Count the days</button><output aria-live="polite"></output></form></div>
<h2>Days until US holidays</h2>
${table("us")}
<h2>Days until UK holidays</h2>
<p>Days marked in the UK that the US list does not have. Shared days such as Christmas Day are in the first table.</p>
${table("uk")}
<h2>Days until Canada holidays</h2>
${table("ca")}
<h2>How the days are counted</h2>
<p>Today is not counted and the holiday is. On the day before a holiday the count is 1, and on the day it shows 0. Once a holiday has passed, its row moves to next year's date. Dates are computed from each holiday's rule, such as the fourth Thursday of November for Thanksgiving, for ${y} and ${y + 1}.</p>
<p class="tool-links"><a href="/holidays/">US holidays</a> · <a href="/uk-holidays/">UK bank holidays</a> · <a href="/canada-holidays/">Canada holidays</a> · <a href="${toolPath("days-between-dates")}">Days between dates</a></p>
${toolLinks("")}`);
  return { id: "days-until", path: "/days-until/", title: `How Many Days Until…? Holiday Countdowns ${y} and ${y + 1}`, description: `Days left until every US, UK and Canada holiday in ${y} and ${y + 1}, counted from today, plus a counter for any date you choose.`, body, crumbs: c };
}
const phrase = (n: number) => (n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${plural(n, "day")}`);

function countdownPage(cd: Countdown, today: Date, h: Helpers, upcoming: { c: Countdown; r: ResolvedHoliday }[]): ToolPage {
  const t = dayOf(today), r = resolveNextHoliday(cd.def, today), e = parseIso(r.iso), n = Math.round((e - t) / DAY);
  const name = cd.def.name, label = cd.label, month = monthNumberToName(r.month);
  const years = Array.from({ length: 6 }, (_, i) => resolveHoliday(cd.def, r.year + i));
  const wd = weekdaysBetween(t, e);
  const stat = (lbl: string, part: string, val: string) => `<div><span>${lbl}</span><strong data-du="${r.iso}" data-du-part="${part}">${h.volatile(val)}</strong></div>`;
  // The eight holidays that follow this one in the year, wrapping round: every countdown is then
  // linked from eight others. The next eight from today gave the same eight on every page.
  // A UK or Canada page links five of its own country first, or the US days between them crowd
  // some pages out.
  const after = (loc: string, n: number) => {
    const pool = upcoming.filter((x) => x.c.locale === loc), at = pool.findIndex((x) => x.r.iso > r.iso || (x.r.iso === r.iso && x.c.slug > cd.slug));
    return [...pool.slice(at < 0 ? 0 : at), ...pool.slice(0, at < 0 ? 0 : at)].filter((x) => x.c.slug !== cd.slug).slice(0, n);
  };
  const others = cd.locale === "us" ? after("us", 8) : [...after(cd.locale, 5), ...after("us", 3)];
  const c = crumbs(["Days until", "/days-until/"], [label, countdownPath(cd.slug)]);
  const body = shell("tool-single days-until-page", c, `
<h1>How many days until ${esc(label)}?</h1>
<div class="du-answer"><p class="du-big"><b data-du="${r.iso}">${h.volatile(num(n))}</b> <span data-du="${r.iso}" data-du-part="unit">${h.volatile(n === 1 ? "day" : "days")}</span></p><p>${esc(name)} ${cd.slug === "daylight-savings" ? "starts on" : "is"} <strong>${esc(r.formatted)}</strong>, <span data-du="${r.iso}" data-du-part="phrase">${h.volatile(phrase(n))}</span>.</p></div>
<div class="tool-today">${stat("In weeks", "weeks", weeksAndDays(n))}${stat("In months", "months", monthsText(t, e))}${stat("Weekdays left", "weekdays", num(wd))}${stat("Weekend days left", "weekends", num(n - wd))}</div>
<p>${esc(cd.def.blurb)} <a href="${holidayWhenIsPath(cd.slug)}">When is ${esc(name)}: the date, the weekday and how it is set →</a></p>
<h2>${esc(name)} on the ${month} ${r.year} calendar</h2>
${h.holidayMonthBlock({ name, year: r.year, month: r.month, day: r.day }, holidaysForMonth(r.year, r.month, cd.locale), cd.locale === "us")}
<h2>Days until ${esc(name)}, ${years[0]!.year} to ${years.at(-1)!.year}</h2>
<div class="tool-scroll"><table class="dates-table tool-table"><thead><tr><th scope="col">Year</th><th scope="col">Date</th><th scope="col">Days from today</th></tr></thead><tbody>${years.map((x) => `<tr><th scope="row">${x.year}</th><td>${monthHref(x.year, x.month, today) ? `<a href="${monthHref(x.year, x.month, today)}" title="${monthNumberToName(x.month)} ${x.year} printable calendar">${esc(x.formatted)}</a>` : esc(x.formatted)}</td><td><span data-du="${x.iso}">${h.volatile(num(Math.round((parseIso(x.iso) - t) / DAY)))}</span></td></tr>`).join("")}</tbody></table></div>
<h2>How the countdown is counted</h2>
<p>Today is not counted and ${esc(name)} is, so the number is how many times you go to sleep before the day. The page counts from the date on your device, and once ${esc(r.formatted)} has passed it moves to ${esc(name)} ${r.year + 1}.</p>
<p>Weekdays are Monday to Friday; public holidays between now and then are not taken out. For a count between any two dates, use the <a href="${toolPath("days-between-dates")}">days between dates calculator</a>. To find the date a set number of days away, use <a href="${toolPath("days-from-today")}">days from today</a> or <a href="${toolPath("add-days")}">add or subtract days</a>.</p>
<nav class="tool-more" aria-label="More countdowns"><h2>More countdowns</h2><div class="du-chips">${others.map(({ c: o, r: x }) => `<a href="${countdownPath(o.slug)}">${esc(o.label)}<span data-du="${x.iso}" data-du-part="phrase">${h.volatile(phrase(Math.round((parseIso(x.iso) - t) / DAY)))}</span></a>`).join("")}<a href="/days-until/">Every holiday →</a></div></nav>`);
  return {
    id: `days-until-${cd.slug}`, path: countdownPath(cd.slug), title: countdownTitle(label, r.year),
    description: clipSentence(`Days left until ${label}, ${r.formatted}, counted from today: weeks, weekdays and weekends to go, the ${month} ${r.year} calendar and the dates through ${years.at(-1)!.year}.`, 158),
    body, crumbs: c, holiday: { slug: cd.slug, year: r.year },
  };
}

export function toolPages(today: Date, h: Helpers): ToolPage[] {
  const upcoming = countdownHolidays().map((c) => ({ c, r: resolveNextHoliday(c.def, today) })).sort((a, b) => a.r.iso.localeCompare(b.r.iso) || a.c.def.sort - b.c.def.sort);
  return [
    hubPage(today, h), betweenPage(today, h), addPage(), fromTodayPage(today, h), businessPage(today), weekPage(today, h), dayOfYearPage(today, h),
    countdownHub(today, h), ...countdownHolidays().map((cd) => countdownPage(cd, today, h, upcoming)),
  ];
}
