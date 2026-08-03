# Architecture — Fresh Calendars

Fresh Calendars is a **generate-time calendar factory**. Almost nothing is computed at HTTP request time after cutover. **Production HTML is emitted by the generator SSG**, not by Astro and not by legacy PHP.

## Packages

| Package | Role |
|---------|------|
| `@freshcalendars/engine` | Grid math, US holidays + when-is slugs, rolling year resolve, Fresh URL registry, SEO meta |
| `@freshcalendars/templates` | Unique HTML/CSS roots: `yearly/`, `monthly/`, `weekly/`, `blank/`, `school/` — Fresh tokens |
| `@freshcalendars/generator` | CLI `fc`: `gen`, `gen-meta`, `refresh-evergreen`, `verify`, `rollover`, `build`, `deploy` |
| `apps/web` | **Design preview only** — Astro sandbox |

## Data flow

1. Engine resolves dates (`resolveMonthYear`, holiday rules by slug).
2. Generator renders printable HTML → Playwright → PNG/PDF + `og:image`.
3. Generator writes `dist/meta/{pageId}.json`.
4. `sitePages.ts` emits `dist/site/*` using **legacy Fresh URL spellings**.
5. `pnpm fc sync-cdn` → DigitalOcean Spaces (`cdn.freshcalendars.com`).
6. `scripts/deploy.sh` rsyncs HTML to Hestia (`yuzdehesaplama`), purges Cloudflare, `sync-app.sh` updates VPS factory.
7. VPS cron: monthly refresh (Y+Y1), Sep generate-next, Jan rollover, weekly smoke.

## Legacy

- Live today: PHP under `/home/yuzdehesaplama/web/freshcalendars.com/public_html/`
- Local reference: `backup/public_html/` + `legacy/` (crawl/brand)
- After cutover: not served; keep for asset salvage / content reuse only

## Secrets

Root `.env` only. Never commit. See `.env.example`.

## Difference vs ItsCalendar

| Concern | ItsCalendar | Fresh Calendars |
|---------|-------------|-----------------|
| Evergreen month URL | `/printable-january-calendar.html` | `/january-calendars.html` |
| Yearly hub | `/printable-calendar.html` | `/printable-calendars.html` |
| when-is | `/when-is/{slug}.html` | `/when-is/{slug}` (extensionless) |
| Hestia user | `dreamcalendars` | `yuzdehesaplama` |
| Visual | cream / terracotta / Fraunces | blue / gold / red / Sora–Manrope |
| CLI | `pnpm its` | `pnpm fc` |
