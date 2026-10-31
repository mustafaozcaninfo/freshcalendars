# CDN — Fresh Calendars

`cdn.freshcalendars.com` is the R2 bucket `freshcalendars` (custom domain on the freshcalendars.com
zone, cached at the edge for 31 days by the zone's cache rule). It replaced DigitalOcean Spaces on
the Cloudflare cutover; object paths did not change.

## Object layout

```
assets/{year}/yearly/.../calendar.{png,pdf}, calendar-preview*.webp
assets/{year}/monthly/{month}/.../calendar.{png,pdf}
assets/blank/..., assets/weekly/..., assets/school/{span}/overview/...
assets/studio/...                 studio printables (pages linked these as /assets/..., which now 301s here)
og/{pageId}.png                   Open Graph images of the calendar pages
news/_astro/*.{avif,webp}         /news/ hero variants (Astro build.assetsPrefix); never overwritten
news/downloads/<group>/*          /news/ printables; also served at freshcalendars.com/news/downloads/
                                  by the Worker with the story canonical as a Link header
robots.txt
```

## Who writes it

- `cloudflare/deploy.sh images` (CI, after the checks): new `news/_astro` files, `--ignore-existing`.
- `cloudflare/deploy.sh deploy`: `news/downloads` synced with the build (removed printables are deleted).
- `cloudflare/deploy.sh sync-calendar-assets` (`calendar.yml`): changed `assets/` and `og/` files,
  then those URLs are purged from the edge cache. Nothing under `assets/` is ever deleted.

Cache-Control on objects: `public, max-age=31536000, immutable` for `news/_astro`,
`public, max-age=604800, immutable` for `assets/` and `og/` (as on Spaces).

Before the cutover the bucket was readable on `pub-15d7255f26e84763a4df070b63ac9d6a.r2.dev` for the
parity test; that dev URL is turned off afterwards.
