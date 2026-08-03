# URLs — FreshCalendars.com

Canonical host: `https://freshcalendars.com` (www → apex 301)

Legacy PHP rewrite map is in `backup/public_html/.htaccess`. New SSG **must preserve** indexable paths below and 301 the rest.

## Sitemap-published (42 URLs — 2026-08-03)

Source: live `https://freshcalendars.com/sitemap.xml` ← `sitemap.php`

| Priority | Path | Role |
|----------|------|------|
| 1.0 | `/` | Entry (legacy redirects → yearly hub) |
| 0.8 | `/printable-calendars.html` | **Yearly hub** (planning year) |
| 0.8 | `/blank-calendars.html` | Blank templates hub |
| 0.8 | `/holidays` | US holidays list |
| 0.7 | `/page/school-holidays` | School year guide |
| 0.7 | `/page/daylight-savings` | DST guide |
| 0.7 | `/when-is/{slug}` | 24 holiday “when is” pages (see list) |
| 0.6 | `/{month}-calendars.html` | 12 evergreen month hubs |

### when-is slugs (sitemap)

```
new-years-day, new-years-eve, martin-luther-king-day, groundhogs-day,
valentines-day, presidents-day, st-patricks-day, easter, earth-day,
cinco-de-mayo, mothers-day, memorial-day, flag-day, fathers-day,
independence-day, labor-day, columbus-day, halloween, veterans-day,
thanksgiving, black-friday, cyber-monday, christmas-day, daylight-savings
```

## Legal / contact (live, not all in sitemap)

| Path | Status |
|------|--------|
| `/page/privacy-policy` | 200 |
| `/page/terms-of-use` | 200 |
| `/page/contact` | 200 |
| `/page/disclosure` | linked from privacy (keep or 301) |

## Soft / broken legacy (crawl found)

These currently resolve to the yearly hub title or soft-fallback — **new site must 301 cleanly**, not soft-404:

| From | Target |
|------|--------|
| `/` | `/printable-calendars.html` (or new dedicated home — decide in DESIGN) |
| `/printable-calendar.html` | `/printable-calendars.html` |
| `/{month}-calendar.html` (singular) | `/{month}-calendars.html` |
| `/blank-calendar.html` | `/blank-calendars.html` |
| `/year/{YYYY}` | `/printable-calendars.html` |
| `/{YYYY}-calendar.html` | `/printable-calendars.html` |
| `/monday-start-calendars.html` | decide: build real hub **or** 301 yearly |
| `/weekly-calendars.html` | decide: build real hub **or** 301 yearly |
| `/school-calendars.html` | `/page/school-holidays` or new school hub |
| `/page/about`, `/page/privacy`, `/page/terms` | legal pages / contact |
| `/calendars/*`, `/calendar/*` | `/printable/...` legacy asset redirects |

## Optional expansion (engine already has rules in legacy templates/)

Not in sitemap today; ship later if keyword plan says yes:

- Extra when-is: `christmas-eve`, `good-friday`, `april-fools-day`, `armed-forces-day`, `star-wars-day`, `international-womens-day`, `world-teachers-day`, `indigenous-peoples-day`, …
- Locale hubs: UK / Canada / Australia / India holiday templates exist as PHP stubs
- `/editor/{month}/{year}` — **do not** make FullCalendar editor a core indexable product (same decision as ItsCalendar)

## New factory additions (parity with ItsCalendar factory)

Keep FreshCalendars URL spelling (plural `-calendars.html`) for SEO; add only where no conflict:

| Path | Notes |
|------|-------|
| `/printable-monday-start-calendars.html` | optional new evergreen |
| `/printable-weekly-calendars.html` | optional |
| `/printable-school-calendars.html` | optional (maps school family) |
| `/guides/*.html` | optional classroom/fiscal guides |
| `/sitemap.xml`, `/sitemap-images.xml`, `/feed.xml`, `/robots.txt`, `/ads.txt`, `/llms.txt`, `/404.html` | generated |

## Year-qualified (never index)

Emit 301 only:

- `/printable-calendars-{year}.html`
- `/{month}-calendars-{year}.html`
- `/{year}-holidays.html`
- `/when-is/{slug}-{year}`

## AdSense / analytics (preserve IDs)

- Publisher: `ca-pub-2597035827677267`
- ads.txt: `google.com, pub-2597035827677267, DIRECT, f08c47fec0942fa0`
- Legacy GA: `UA-107362879-1` → migrate to GA4 property (ops step)

Manual slots only in new SSG (see BLUEPRINT §11). Slot IDs come from legacy `backup/public_html/config.php` + `rightmenu.php` (never ItsCalendar slots) — mapped in `sitePages.ts` `ADS`.
