# Changelog

## v1.0.0 — 2026-08-03

Production cut of the SSG factory for [freshcalendars.com](https://freshcalendars.com).

### Product
- Evergreen printable hubs (yearly, next-year, monthly ×12, blank ×5, blank yearly, Monday-start, weekly, school)
- US / UK / Canada holidays + when-is pages
- Guides, legal/contact, affiliate disclosure, RSS / sitemaps / `llms.txt`
- Fresh brand (blue/gold/red), legacy AdSense slots, CDN on `cdn.freshcalendars.com`

### SEO / parity
- Distinct titles, H1s, and editorial vs ItsCalendar
- Directory URLs trailing-slash canonicals
- Legacy redirects: year calendars, `/page/{holiday}` → when-is, AU/IN hubs → US holidays

### Edge / performance
- Cloudflare Cache Rules (31d edge) + Hestia nginx TTL split (:80/:443)
- Warm HIT TTFB ~tens of ms
- Lighthouse mobile: home/yearly/month/blank **96–100** (`pnpm smoke:lighthouse`)

### Ops
- CLI: `pnpm fc` (gen, gen-meta, verify, sync-cdn, deploy)
- Scripts: `cf-cache-optimize.sh`, `hestia-apply-nginx-cache.sh`, smoke suite
- Docs: `docs/INFRA-STATUS.md`, `docs/RUNBOOK.md`, `DEEP-AUDIT.md`
