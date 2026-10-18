export const SITE_ORIGIN = "https://freshcalendars.com";
export const NEWS_BASE = "/news/";
export const NEWS_NAME = "Fresh Calendars";
export const NEWS_DESK = {
  name: "Fresh Calendars News Desk",
  slug: "news-desk",
  path: "/news/author/news-desk/",
};

/** Absolute URL with a trailing slash for directory paths (matches engine absUrl). */
export function absNewsUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}
