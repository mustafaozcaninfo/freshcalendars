/**
 * XML builders for /news/ sitemaps (tech-insider layout + Google News) and RSS.
 * Pure string functions on plain data — tested in test/sitemaps.test.ts.
 */
import { NEWS_NAME, SITE_ORIGIN, absNewsUrl } from "./site.ts";
import { isoDateTime } from "./seo.ts";

export const XSL_PATH = "/news/sitemap.xsl";
/** Same-origin XSL (browsers refuse cross-origin stylesheets for XML). */
/** Google News: only articles published in the last two days, at most 1,000 URLs. */
export const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;
export const NEWS_MAX = 1000;
/** Split a urlset well before the 50,000 limit so files stay small and fast to fetch. */
export const URLSET_MAX = 5000;

export function xmlEscape(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const head = `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="${XSL_PATH}"?>\n`;

export interface UrlEntry {
  path: string;
  lastmod?: Date;
  priority?: string;
  image?: { url: string; title: string };
}

export function urlset(entries: UrlEntry[]): string {
  const hasImages = entries.some((e) => e.image);
  const ns = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ""}`;
  const body = entries
    .map((e) => {
      const lines = [`    <loc>${xmlEscape(absNewsUrl(e.path))}</loc>`];
      if (e.lastmod) lines.push(`    <lastmod>${isoDateTime(e.lastmod)}</lastmod>`);
      if (e.priority) lines.push(`    <priority>${e.priority}</priority>`);
      if (e.image) {
        lines.push(
          `    <image:image>\n      <image:loc>${xmlEscape(e.image.url)}</image:loc>\n      <image:title>${xmlEscape(e.image.title)}</image:title>\n    </image:image>`,
        );
      }
      return `  <url>\n${lines.join("\n")}\n  </url>`;
    })
    .join("\n");
  return `${head}<urlset ${ns}>\n${body}${body ? "\n" : ""}</urlset>\n`;
}

export function sitemapIndex(children: { path: string; lastmod?: Date }[]): string {
  const body = children
    .map(
      (c) =>
        `  <sitemap>\n    <loc>${xmlEscape(absNewsUrl(c.path))}</loc>${c.lastmod ? `\n    <lastmod>${isoDateTime(c.lastmod)}</lastmod>` : ""}\n  </sitemap>`,
    )
    .join("\n");
  return `${head}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export interface NewsEntry {
  path: string;
  title: string;
  publishedAt: Date;
}

/** Entries inside the 48h window, newest first, capped at 1,000. */
export function newsWindow<T extends NewsEntry>(entries: T[], now: Date): T[] {
  return entries
    .filter((e) => e.publishedAt <= now && now.getTime() - e.publishedAt.getTime() <= NEWS_WINDOW_MS)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, NEWS_MAX);
}

/** Google News sitemap. An empty window still yields a valid, empty urlset. */
export function newsSitemap(entries: NewsEntry[], now: Date): string {
  const body = newsWindow(entries, now)
    .map(
      (e) => `  <url>
    <loc>${xmlEscape(absNewsUrl(e.path))}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(NEWS_NAME)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${isoDateTime(e.publishedAt)}</news:publication_date>
      <news:title>${xmlEscape(e.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");
  return `${head}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${body}${body ? "\n" : ""}</urlset>\n`;
}

export interface FeedItem {
  path: string;
  title: string;
  description: string;
  html: string;
  publishedAt: Date;
  authors: string[];
  category: string;
  image: { url: string; width: number; height: number; alt: string };
}

export const FEED_ITEMS = 30;

const cdata = (s: string) => `<![CDATA[${s.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;

/** Root-relative href/src in article HTML → absolute, so feed readers resolve them. */
export function absolutizeHtml(html: string): string {
  return html.replace(/\s(href|src)="\/(?!\/)/g, ` $1="${SITE_ORIGIN}/`);
}

/** lastBuildDate follows the newest item (not the clock) so unchanged content yields an identical file. */
export function rssFeed(items: FeedItem[]): string {
  const self = absNewsUrl("/news/feed.xml");
  const list = [...items].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()).slice(0, FEED_ITEMS);
  const built = list[0] ? `\n    <lastBuildDate>${list[0].publishedAt.toUTCString()}</lastBuildDate>` : "";
  const body = list
    .map((i) => {
      const url = absNewsUrl(i.path);
      return `    <item>
      <title>${xmlEscape(i.title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>
      <pubDate>${i.publishedAt.toUTCString()}</pubDate>
${i.authors.map((a) => `      <dc:creator>${cdata(a)}</dc:creator>`).join("\n")}
      <category>${cdata(i.category)}</category>
      <description>${cdata(i.description)}</description>
      <content:encoded>${cdata(absolutizeHtml(i.html))}</content:encoded>
      <media:content url="${xmlEscape(i.image.url)}" medium="image" type="image/webp" width="${i.image.width}" height="${i.image.height}">
        <media:description type="plain">${xmlEscape(i.image.alt)}</media:description>
      </media:content>
    </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title>${xmlEscape(NEWS_NAME)} News</title>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
    <link>${absNewsUrl("/news/")}</link>
    <description>Calendar, holiday and date news from the Fresh Calendars News Desk.</description>
    <language>en-US</language>${built}
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <image>
      <url>${SITE_ORIGIN}/icons/icon-192.png</url>
      <title>${xmlEscape(NEWS_NAME)} News</title>
      <link>${absNewsUrl("/news/")}</link>
      <width>144</width>
      <height>144</height>
    </image>
${body}${body ? "\n" : ""}  </channel>
</rss>
`;
}
