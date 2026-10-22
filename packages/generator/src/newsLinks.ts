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
