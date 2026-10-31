# Deploy — Fresh Calendars on Cloudflare

freshcalendars.com is one Cloudflare Worker with static assets plus one R2 bucket. GitHub Actions
builds, checks and publishes; nobody deploys from a laptop and no server is involved.

| Piece | Where |
|---|---|
| Pages, feeds, sitemaps, `/news/` (HTML, XML, JSON, ICS, fonts, icons) | Worker `freshcalendars`, static assets from `dist/cf/public` (`cloudflare/assemble.mjs`) |
| Calendar PNG/PDF/WebP (`/assets/`), Open Graph images (`/og/`), `/news/` images (`/news/_astro/`), `/news/` printables (`/news/downloads/`) | R2 bucket `freshcalendars`, public on `cdn.freshcalendars.com` |
| Build state (last deployed builds, sitemap lastmod dates, studio manifest, image cache, AnindaIndex record, contact messages) | R2 bucket `freshcalendars-state` (private) |
| Old calendar URLs (the former `.htaccess`), 404 pages, printables with their `Link: rel=canonical`, the contact form | `cloudflare/worker.js` (runs only for those paths) |
| `/news/` 301s (`apps/news/redirects.map`), `/assets/*` and `/news/_astro/*` 301 to the CDN, cache headers | `_redirects` and `_headers`, written by `assemble.mjs` |
| `www` → apex 301 | zone dynamic redirect rule |

Config: [`wrangler.jsonc`](../wrangler.jsonc). Workers Free plan: static asset requests are free and
unlimited; the Worker itself runs only for printables, 404s, old URLs and the form (100,000 a day free).
The deploy holds about 1,400 files (limit 20,000) because images and printables live in R2.

## How a change goes live

| Trigger | Workflow | What it does |
|---|---|---|
| Push to `main` | `ci.yml` | tests, puzzle check, `/news/` build with `NEWS_ASSETS_PREFIX=https://cdn.freshcalendars.com/news`, `news:verify`, `news:seo-audit`; when all are green: new images to R2, then `deploy.yml` |
| Every 10 min | `scheduled.yml` | a story whose `publishedAt` passed since the last build: rebuild the deployed commit and deploy |
| 05:25 UTC daily, 06:30 UTC on the 1st (Feb–Dec), Sep 1 08:45, Jan 1 06:30 | `calendar.yml` | `refresh-meta`, `refresh-evergreen`, `gen --year next`, `rollover`; changed printables to R2 (and purged on the CDN), then `deploy.yml` and a smoke test |
| Mondays 07:15 UTC | `calendar.yml` (health) | live smoke test, `/news/` sitemaps, daily job freshness |
| any of the above | `deploy.yml` | one at a time (`concurrency: production`): printables synced to R2, `assemble.mjs`, `wrangler deploy`, IndexNow and AnindaIndex for new or updated stories |

A deploy ships both halves of the site; the half its caller did not build comes from the last deploy
(`freshcalendars-state`). A `/news/` build of an older commit than the deployed one never replaces it.
A red run never deploys. Failed scheduled runs email the owner (GitHub notifications).

Run a job by hand: Actions → Calendar site → Run workflow (pick the job), or `gh workflow run calendar.yml -f job=refresh-meta`.

## Secrets and variables (GitHub → Settings → Secrets and variables → Actions)

| Name | What |
|---|---|
| `CLOUDFLARE_API_TOKEN` | scoped token `freshcalendars-ci`: Workers Scripts edit, Account Settings read, R2 metadata read, R2 object read/write on the two `freshcalendars` buckets only, and on the freshcalendars.com zone Workers Routes edit, Cache Purge, Zone read |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | the same token as S3 credentials (token id; SHA-256 of the token) for rclone |
| `CLOUDFLARE_ACCOUNT_ID`, `CF_ZONE_ID` | ids |
| `ANINDA_INDEX_KEY` | AnindaIndex API key |
| variable `CF_LIVE` | `1` once freshcalendars.com is served by the Worker (turns on IndexNow and AnindaIndex) |
| variable `SITE_BASE` | host the smoke tests check (`https://freshcalendars.com`) |

Worker secrets (`wrangler secret put`): `TURNSTILE_SECRET` (widget `freshcalendars-contact`) and
`CONTACT_TO` (the owner address, verified in Email Routing). Contact mail is sent from
`contact@notify.freshcalendars.com` (Email Routing on the `notify` subdomain only; the Zoho MX
and SPF records of the apex are untouched). Every message is also stored in
`freshcalendars-state/contact/YYYY-MM/`.

## Local checks

```bash
pnpm news:build && pnpm news:verify && pnpm news:seo-audit   # what CI runs
node scripts/cf-parity.mjs --b https://freshcalendars.info7691.workers.dev   # parity of two hosts
```

`pnpm cf:assemble` builds `dist/cf/public` from a local `dist/site` and `dist/news` (useful to count
files or inspect `_redirects`/`_headers`); it never deploys.

## Rollback

- A bad deploy: re-run the last good `deploy.yml` run, or `git revert` the commit (CI deploys the revert).
  `wrangler rollback` (with the token) restores the previous Worker version in seconds.
- Back to the VPS (until the VPS copy is removed, see below): delete the Worker route
  `freshcalendars.com/*` (Workers & Pages → freshcalendars → Settings → Domains & Routes) and point
  `cdn` back to `freshcalendars.nyc3.cdn.digitaloceanspaces.com` (CNAME, proxied) after removing the
  R2 custom domain. The VPS then serves its last published copy; to publish there again, revert the
  migration merge on `main` and uncomment the freshcalendars lines in the VPS crontab.

## VPS copy

The freshcalendars crontab lines on root@2.25.147.42 are commented out, not deleted, and
`public_html`, the app directory and the MySQL tables stay for the rollback window. Remove them
after the date in the migration notes (`docs/INFRA-STATUS.md`).
