export const SITE_ORIGIN = "https://freshcalendars.com";
export const SITE_NAME = "Fresh Calendars";
export const THEME_COLOR = "#007b48";

/** Public CDN for assets/og (DigitalOcean Spaces + CF). Override with CDN_ORIGIN. */
export function cdnOrigin(): string {
  return (process.env.CDN_ORIGIN || "https://cdn.freshcalendars.com").replace(/\/$/, "");
}

/** Turn a site-relative path (/assets/...) into a CDN absolute URL. */
export function cdnUrl(path: string): string {
  if (!path) return cdnOrigin();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  // PDFs stay on the site's own host: the Worker serves them from the same bucket with a Link
  // canonical to their page, which the CDN host cannot send (cloudflare/worker.js calendarAsset).
  if (/\.pdf$/i.test(p)) return `${SITE_ORIGIN}${p}`;
  return `${cdnOrigin()}${p}`;
}
