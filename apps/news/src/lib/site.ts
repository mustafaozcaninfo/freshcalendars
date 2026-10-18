/** NEWS_SITE_ORIGIN lets local Lighthouse runs keep canonicals on the audited host. */
export const SITE_ORIGIN = process.env.NEWS_SITE_ORIGIN ?? "https://freshcalendars.com";
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
 * Trust/policy pages referenced from Organization JSON-LD (Google News transparency signals).
 * Set a path to null to stop referencing a page.
 */
export const TRUST_PAGES: {
  publishingPrinciples: string | null;
  ethicsPolicy: string | null;
  correctionsPolicy: string | null;
  masthead: string | null;
  actionableFeedbackPolicy: string | null;
  license: string | null;
} = {
  publishingPrinciples: "/news/editorial-policy/",
  ethicsPolicy: "/news/editorial-policy/#ethics",
  correctionsPolicy: "/news/corrections-policy/",
  masthead: "/news/masthead/",
  actionableFeedbackPolicy: "/news/corrections-policy/#feedback",
  license: "/page/terms-of-use/",
};

/** Policy page slugs live at /news/<id>/ — articles may not reuse them. */
export const POLICY_PAGES = ["about", "editorial-policy", "corrections-policy", "masthead"] as const;
