# freshcalendars.com — URL inventory (pre-factory → post-factory)

Canonical: `https://freshcalendars.com/`  
Crawl date: **2026-08-03** · Sitemap locs: **42** · BFS HTML 200s: **75** · VPS backup: `backup/public_html/` (218MB, excludes vendor/node_modules/PHPlinks)

## A) Must preserve (indexable evergreen)

| URL | Legacy handler | New factory |
|-----|----------------|-------------|
| `/` | `index.php` → redirect chain | 301 → `/printable-calendars.html` (or new home later) |
| `/printable-calendars.html` | `year_new.php` | Yearly hub · `resolvePlanningYear` |
| `/blank-calendars.html` | `blank.php` | Blank family hub |
| `/january-calendars.html` … `/december-calendars.html` | `monthnew.php` | Month hubs · `resolveMonthYear` |
| `/holidays` | `holidays.php` | US holidays planning year |
| `/when-is/{24 slugs}` | `when-is.php` | Holiday date pages |
| `/page/school-holidays` | `page.php` + template | School guide |
| `/page/daylight-savings` | `page.php` + template | DST guide |
| `/page/privacy-policy` | `page.php` | Legal SSG |
| `/page/terms-of-use` | `page.php` | Legal SSG |
| `/page/contact` | `page.php` | Contact → thin PHP API |
| `/sitemap.xml` | `sitemap.php` | Generated |
| `/ads.txt` | static | Copied |
| `/feed.xml` | static/legacy | Generated |

## B) 301 map (keep equity, do not index)

| From | To |
|------|-----|
| `www.*` | apex |
| `/printable-calendar.html` | `/printable-calendars.html` |
| `/{month}-calendar.html` | `/{month}-calendars.html` |
| `/blank-calendar.html` | `/blank-calendars.html` |
| `/year/{YYYY}` | `/printable-calendars.html` |
| `/{YYYY}-calendar.html` | `/printable-calendars.html` |
| `/calendar/*`, `/calendars/*` | asset CDN or 410 after cutover |
| Soft hubs that currently fake yearly title (`/weekly-calendars.html`, `/monday-start-calendars.html`, `/page/about`, …) | real page **or** explicit 301 |

## C) Do not carry as core product

| Path | Reason |
|------|--------|
| `/editor/{month}/{year}` | Request-time FullCalendar — sandbox only if kept |
| `/explore/*`, `/download/*` | Legacy binary routers → CDN direct links |
| `PHPlinks/`, `make-a-calendar/`, `converter.zip` | Junk / unrelated |
| Hardcoded `$thisYear = "2026"` | Replaced by rolling resolve |

## D) Hosting facts

| Item | Value |
|------|-------|
| VPS | `root@2.25.147.42` (Hestia) |
| Unix user | `yuzdehesaplama` |
| `public_html` | `/home/yuzdehesaplama/web/freshcalendars.com/public_html/` |
| CF zone | ✅ `1e7d8a7f6839cf53df0ac94e2c264ebd` |
| CF NS | ✅ `alexis` / `nelly` (live at registry + public resolvers) |
| Origin A | ✅ `2.25.147.42` proxied · SSL strict · LE on Hestia |
| Spaces / CDN | ✅ bucket + `cdn.freshcalendars.com` |
| AdSense | `ca-pub-2597035827677267` |
| Live infra matrix | [`docs/INFRA-STATUS.md`](docs/INFRA-STATUS.md) |

## E) Full sitemap list

See `legacy/sitemap.xml` and `docs/URLS.md`. Machine-readable crawl: `legacy/crawl/all_urls.txt`.
