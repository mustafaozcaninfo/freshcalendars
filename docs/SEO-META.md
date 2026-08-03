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
| when-is | `{Name} {Y} \| When is {Name} {Y+1}?` |
| School | `School Holidays {Y}-{Y+1} Calendar` |
| DST | `Daylight Saving Time {Y} \| When is DST {Y+1}?` |

Legacy titles already follow this shape — keep continuity for CTR.

## Required JSON-LD

- `WebSite` + `Organization` on home/yearly  
- `BreadcrumbList` on all hubs  
- `FAQPage` where FAQ block exists  
- `ImageObject` for primary printable preview  

## Sitemaps

- `sitemap.xml` — HTML pages only (evergreen)  
- `sitemap-images.xml` — printable/OG images on CDN  
- `feed.xml` — recent hubs  

## hreflang

EN-only (`en` / `en-US`) unless later locales ship.
