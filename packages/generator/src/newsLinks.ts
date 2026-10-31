/**
 * "Latest news" boxes on calendar pages — read dist/news-data/latest.json written by the
 * news build (apps/news/src/pages/latest.json.ts). Off until NEWS_LAUNCHED; missing or
 * unreadable data renders nothing, so the calendar build never depends on the news build.
 */
import fs from "node:fs";
import path from "node:path";
import { NEWS_LAUNCHED, esc } from "@freshcalendars/site-chrome";
import { ROOT } from "./paths.js";

type Story = { title: string; url: string; publishedAt: string };
type Data = { bySlug: Record<string, Story[]>; byPath: Record<string, Story[]> };
let cache: Data | null = null;

function load(): Data {
  if (cache) return cache;
  cache = { bySlug: {}, byPath: {} };
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "dist/news-data/latest.json"), "utf8"));
    if (raw && typeof raw.bySlug === "object") cache.bySlug = raw.bySlug;
    if (raw && typeof raw.byPath === "object") cache.byPath = raw.byPath;
  } catch {
    // no news build yet
  }
  return cache;
}

function storyList(stories: Story[]): string {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" });
  return stories
    .map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a> <time datetime="${esc(s.publishedAt)}">${fmt.format(new Date(s.publishedAt))}</time></li>`)
    .join("\n    ");
}

export function latestNewsHtml(slug: string): string {
  if (!NEWS_LAUNCHED) return "";
  const stories = load().bySlug[slug] ?? [];
  if (!stories.length) return "";
  return `<h3>Latest news</h3>
  <ul class="latest-news">
    ${storyList(stories)}
  </ul>
  <p><a href="/news/">More calendar &amp; holiday news</a></p>
  `;
}

/**
 * Full-width news strip at the end of any other calendar page (month, printable, holiday
 * lists, guides), for stories whose internalLinks point at that page. /when-is/ pages keep
 * their in-content box instead, so they never get both.
 */
export function newsStripHtml(pagePath: string): string {
  if (!NEWS_LAUNCHED || pagePath.startsWith("/when-is/")) return "";
  const stories = load().byPath[pagePath] ?? [];
  if (!stories.length) return "";
  return `
<section class="wrap section news-strip" aria-labelledby="news-strip-title">
  <h2 id="news-strip-title">In the news</h2>
  <ul class="latest-news">
    ${storyList(stories)}
  </ul>
  <p><a href="/news/">More calendar &amp; holiday news</a></p>
</section>`;
}

type HomeStory = { title: string; url: string; cat: string; catName: string; img: string; publishedAt: string };
type HomeDate = { date: string; label: string; url: string };
type HomeData = { generatedAt: string; stories: HomeStory[]; dates: HomeDate[] };

function loadHome(): HomeData | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "dist/news-data/home.json"), "utf8"));
    return Array.isArray(raw?.stories) && Array.isArray(raw?.dates) ? raw : null;
  } catch {
    return null; // no news build yet
  }
}

const ET = "America/New_York";
const todayET = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: ET }).format(d);
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
const inDays = (n: number) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`);
const utcNoon = (iso: string) => new Date(`${iso}T12:00:00Z`);

function homeCard(s: HomeStory): string {
  const when = new Date(s.publishedAt).toLocaleDateString("en-US", { timeZone: ET, month: "short", day: "numeric", year: "numeric" });
  return `<li><a class="hn-card" href="${esc(s.url)}"><img src="${esc(s.img)}" alt="" width="480" height="270" loading="lazy" decoding="async"><span class="hn-cat">${esc(s.catName)}</span><span class="hn-title">${esc(s.title)}</span><time datetime="${esc(s.publishedAt)}">${when}</time></a></li>`;
}

function homeDate(k: HomeDate, today: string): string {
  const d = utcNoon(k.date);
  const md = d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
  const wd = d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short" });
  return `<li><a href="${esc(k.url)}"><span class="hn-d"><b>${md}</b>${wd}</span><span class="hn-w">${esc(k.label)}</span><span class="hn-in" data-days-until="${esc(k.date)}">${inDays(daysBetween(today, k.date))}</span></a></li>`;
}

/**
 * Same markup as homeCard/homeDate, rebuilt in the browser from /news/home.json: the calendar
 * site rebuilds once a day, stories publish every few minutes. Without the fetch (offline, old
 * cache) the baked lists stay, and "In N days" is still recomputed so a past date drops off.
 */
const HOME_NEWS_JS = `(function(){var s=document.querySelector('[data-home-news]');if(!s)return;
var ET='America/New_York',today=new Intl.DateTimeFormat('en-CA',{timeZone:ET}).format(new Date());
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function days(d){return Math.round((Date.parse(d+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/864e5)}
function inDays(n){return n===0?'Today':n===1?'Tomorrow':'In '+n+' days'}
function tick(){s.querySelectorAll('[data-days-until]').forEach(function(x){var n=days(x.getAttribute('data-days-until'));if(n<0)x.closest('li').remove();else x.textContent=inDays(n)})}
function card(st){var li=el('li'),a=el('a','hn-card'),i=new Image(480,270);a.href=st.url;i.src=st.img;i.alt='';i.loading='lazy';i.decoding='async';a.append(i,el('span','hn-cat',st.catName),el('span','hn-title',st.title));var t=el('time',null,new Date(st.publishedAt).toLocaleDateString('en-US',{timeZone:ET,month:'short',day:'numeric',year:'numeric'}));t.dateTime=st.publishedAt;a.append(t);li.append(a);return li}
function row(k){var li=el('li'),a=el('a'),d=new Date(k.date+'T12:00:00Z'),dd=el('span','hn-d'),n=el('span','hn-in',inDays(days(k.date)));a.href=k.url;dd.append(el('b',null,d.toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric'})),d.toLocaleDateString('en-US',{timeZone:'UTC',weekday:'short'}));n.setAttribute('data-days-until',k.date);a.append(dd,el('span','hn-w',k.label),n);li.append(a);return li}
tick();
fetch('/news/home.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).then(function(d){
if(!d||!(d.generatedAt>s.getAttribute('data-generated')))return;
var c=s.querySelector('[data-hn-stories]'),k=s.querySelector('[data-hn-dates]');
if(c&&d.stories.length)c.replaceChildren.apply(c,d.stories.map(card));
if(k)k.replaceChildren.apply(k,d.dates.filter(function(x){return days(x.date)>=0}).map(row));
s.setAttribute('data-generated',d.generatedAt);tick()}).catch(function(){})})();`;

/**
 * "Latest news" cards and "Coming up" dates on the calendar home page, from the news build's
 * home.json (dist/news-data/home.json). Empty without news data, so the calendar build never
 * depends on the news build.
 */
export function homeNewsHtml(now: Date): string {
  if (!NEWS_LAUNCHED) return "";
  const data = loadHome();
  if (!data || !data.stories.length) return "";
  const today = todayET(now);
  const dates = data.dates.filter((k) => k.date >= today);
  return `<section class="concept-wrap home-news" data-home-news data-generated="${esc(data.generatedAt)}" aria-label="From Fresh Calendars News">
<div class="hn-latest"><div class="shelf-heading"><h2>Latest news</h2><a href="/news/">All news →</a></div><ul class="hn-cards" data-hn-stories>${data.stories.map(homeCard).join("")}</ul></div>
<div class="hn-coming"><div class="shelf-heading"><h2>Coming up</h2><a href="/news/">More dates →</a></div><ol class="hn-dates" data-hn-dates>${dates.map((k) => homeDate(k, today)).join("")}</ol></div>
<script>${HOME_NEWS_JS}</script>
</section>`;
}
