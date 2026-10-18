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

/**
 * Trust/policy pages referenced from Organization JSON-LD. null = not published yet
 * (N8), so nothing links to a 404. Fill in the path when the page ships.
 */
export const TRUST_PAGES: {
  publishingPrinciples: string | null;
  ethicsPolicy: string | null;
  correctionsPolicy: string | null;
  masthead: string | null;
  actionableFeedbackPolicy: string | null;
  license: string | null;
} = {
  publishingPrinciples: null,
  ethicsPolicy: null,
  correctionsPolicy: null,
  masthead: null,
  actionableFeedbackPolicy: null,
  license: "/page/terms-of-use/",
};
