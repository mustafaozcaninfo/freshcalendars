export const SITE_ORIGIN = "https://freshcalendars.com";
export const SITE_NAME = "Fresh Calendars";
export const THEME_COLOR = "#0062cc";

/** Public CDN for assets/og (DigitalOcean Spaces + CF). Override with CDN_ORIGIN. */
export function cdnOrigin(): string {
  return (process.env.CDN_ORIGIN || "https://cdn.freshcalendars.com").replace(/\/$/, "");
}

/** Turn a site-relative path (/assets/...) into a CDN absolute URL. */
export function cdnUrl(path: string): string {
  if (!path) return cdnOrigin();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${cdnOrigin()}${p}`;
}
