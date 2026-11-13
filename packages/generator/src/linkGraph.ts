/**
 * Internal link check for the built calendar site: every link to a page of ours must resolve,
 * and every page in the sitemap must be linked from at least `minInbound` other pages. A page
 * nobody links to is one neither readers nor crawlers reach, however good it is.
 */
const ORIGIN = "https://freshcalendars.com";

/** Site-relative path of a link, or null when it leaves the calendar pages (or is a file). */
export function internalPath(href: string, from: string): string | null {
  if (!href || /^(mailto:|tel:|javascript:|data:|#)/.test(href)) return null;
  let h = href.startsWith(ORIGIN) ? href.slice(ORIGIN.length) || "/" : href;
  if (/^[a-z]+:/i.test(h) || h.startsWith("//")) return null;
  if (!h.startsWith("/")) h = new URL(h, ORIGIN + from).pathname;
  h = h.split("#")[0]!.split("?")[0]!;
  if (/^\/(news|assets|downloads)(\/|$)/.test(h) || /\.[a-z0-9]+$/i.test(h) && !h.endsWith(".html")) return null;
  return h;
}

export function checkLinkGraph(pages: Map<string, string>, sitemap: string[], minInbound = 3): string[] {
  const errors: string[] = [], inbound = new Map<string, Set<string>>();
  for (const [from, html] of pages) {
    for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)) {
      const to = internalPath(m[1]!, from);
      if (!to || to === from) continue;
      if (!pages.has(to)) { errors.push(`broken link on ${from}: ${to}`); continue; }
      (inbound.get(to) ?? inbound.set(to, new Set()).get(to)!).add(from);
    }
  }
  for (const url of sitemap) {
    const n = inbound.get(url)?.size ?? 0;
    if (url !== "/" && n < minInbound) errors.push(`${url} is linked from ${n} page${n === 1 ? "" : "s"} (minimum ${minInbound})`);
  }
  return [...new Set(errors)];
}
