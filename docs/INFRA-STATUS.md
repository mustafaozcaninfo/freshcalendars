# Infra status — Fresh Calendars

Cut over from the VPS to Cloudflare on **2026-10-31** (PR #151). Setup and workflows: `docs/DEPLOY.md`.

| Piece | Status | Detail |
|---|---|---|
| `freshcalendars.com/*` | Cloudflare Worker `freshcalendars` | static assets (~1,300 files, limit 20,000), Workers Free |
| `www` | zone dynamic redirect → apex (301) | unchanged |
| `cdn.freshcalendars.com` | R2 bucket `freshcalendars` (custom domain) | edge cache 31 days (zone cache rule) |
| Build state | R2 bucket `freshcalendars-state` | private |
| Publishing | GitHub Actions `ci.yml` → `deploy.yml` | green pushes to `main` |
| Scheduled jobs | `calendar.yml`, `scheduled.yml` | replaced the VPS crontab |
| Contact form | Worker `/api/contact` + Turnstile `freshcalendars-contact` | mail from `contact@notify.freshcalendars.com` (Email Routing on the `notify` subdomain only) |
| Mail for the domain | Zoho (MX, SPF, DKIM unchanged) | |
| CI token | `freshcalendars-ci` (scoped) | in GitHub secrets |

Apex and www DNS records still point at the VPS (`2.25.147.42`, proxied); the Worker route answers
before the origin. Removing the route is the rollback.

## Left in place for the rollback window (until 2026-11-28)

- VPS: `public_html`, the app directory, the src clone, MySQL tables `cron_runs`, `cron_schedule`,
  `contact_messages`; crontab lines commented with `#CF-CUTOVER-2026-10-31`
  (backup `/root/crontab.before-cloudflare-2026-10-31.bak`).
- DigitalOcean Spaces bucket `freshcalendars` and its CDN endpoint (no longer in DNS).

After 2026-11-28, if nothing needed the VPS: delete those, the nginx maps in
`/etc/nginx/freshcalendars/` and `conf.d/freshcalendars-*.conf`, and the Spaces bucket.
