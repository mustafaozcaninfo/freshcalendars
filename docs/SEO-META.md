# SEO meta — Fresh Calendars

## Principles

1. **One indexable URL** per intent — evergreen Fresh paths  
2. Year in title/H1/description updates via resolve; path does not  
3. Canonical always apex evergreen  
4. Year-qualified URLs: 301 only, no sitemap, no UI links  
5. Unique title/description/og per pageId  

## Title patterns (v1)

| Page | Pattern |
|------|---------|
| Yearly hub | `Free Printable {Y} Calendar \| Fresh Calendars` |
| Month hub | `Printable {Month} {Y} Calendar \| Fresh Calendars` |
| Blank | `Printable Blank Calendar Templates \| Fresh Calendars` |
| Holidays | `{Y} Holidays and Observances \| Fresh Calendars` |
| when-is | `{Name} {Y}[ (UK)\| (Canada)] Date · {Weekday, Month D, Y}`; H1 `When is {Name} {Y}[ in the UK\| in Canada]?` |
| School | `School Holidays {Y}-{Y+1} Calendar` |
| DST | `Daylight Saving Time {Y} \| When is DST {Y+1}?` |

Legacy titles already follow this shape; keep continuity for CTR.

Length: the `| Fresh Calendars` suffix is dropped when a title would pass 60 characters (`fitTitle` in `buildMeta.ts`); when-is titles then fall back to shorter date forms (`holidayTitle`). Meta descriptions stay within 120 to 160 characters and lead with the page's subject, not the brand.

## Required JSON-LD

- `WebSite` + `Organization` on home/yearly  
- `BreadcrumbList` on all hubs  
- `FAQPage` where FAQ block exists (decision 2026-10-25: kept on calendar pages. The FAQs are visible editorial content and the SEO map says existing markup need not be removed, but FAQ rich results are not expected. /news/ does not use FAQPage; that rule is separate.)  
- No `SearchAction`: the site has no search page.  
- `ImageObject` for primary printable preview  

## Sitemaps

- `sitemap.xml` — HTML pages only (evergreen)  
- `sitemap-images.xml` — printable/OG images on CDN  
- `feed.xml` — recent hubs  
- `lastmod` changes only when a page's own HTML changes. The build hashes each page without the blocks wrapped by `volatile()` in `sitePages.ts` (Today card, news links) and keeps the previous date in `dist/sitemap-lastmod.json` when the hash matches. Deleting that file resets every `lastmod` to the build time once.  

## hreflang

Most pages: `en` plus a self `x-default`.

when-is pages that exist for more than one country under the same holiday name (Christmas Day, Good Friday, Boxing Day, ...) list each other as `en-US`, `en-GB` and `en-CA`, with the US page as `x-default` (`holidayHreflang` in `buildMeta.ts`). UK and Canada pages also set `og:locale` to `en_GB` / `en_CA`.
