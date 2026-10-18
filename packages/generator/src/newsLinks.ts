/**
 * "Latest news" box for /when-is/ pages — reads dist/news-data/latest.json written by the
 * news build (apps/news/src/pages/latest.json.ts). Off until NEWS_LAUNCHED; missing or
 * unreadable data renders nothing, so the calendar build never depends on the news build.
 */
import fs from "node:fs";
import path from "node:path";
import { NEWS_LAUNCHED, esc } from "@freshcalendars/site-chrome";
import { ROOT } from "./paths.js";

type Story = { title: string; url: string; publishedAt: string };
let cache: Record<string, Story[]> | null = null;

function load(): Record<string, Story[]> {
  if (cache) return cache;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "dist/news-data/latest.json"), "utf8"));
    cache = raw && typeof raw.bySlug === "object" ? raw.bySlug : {};
  } catch {
    cache = {};
  }
  return cache!;
}

export function latestNewsHtml(slug: string): string {
  if (!NEWS_LAUNCHED) return "";
  const stories = load()[slug] ?? [];
  if (!stories.length) return "";
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" });
  const items = stories
    .map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a> <time datetime="${esc(s.publishedAt)}">${fmt.format(new Date(s.publishedAt))}</time></li>`)
    .join("\n    ");
  return `<h3>Latest news</h3>
  <ul class="latest-news">
    ${items}
  </ul>
  <p><a href="/news/">More calendar &amp; holiday news</a></p>
  `;
}
