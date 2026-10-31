# Runbook — Fresh Calendars

Hosting: Cloudflare Worker `freshcalendars` + R2 (`docs/DEPLOY.md`). Jobs: GitHub Actions.

## Common ops

| Situation | Action |
|-----------|--------|
| Wrong holiday date | Fix `holidays/rules.ts` + test, push; then `gh workflow run calendar.yml -f job=refresh` (printables) or `-f job=refresh-meta` (pages only) |
| Empty PDF / bad OG | Fix, push, `gh workflow run calendar.yml -f job=refresh` |
| A scheduled job failed | GitHub emails the failure; Actions → Calendar site → the run's log; re-run it |
| Story not live | `gh run list --branch main --limit 5` (CI red?); `pnpm news:verify-live <slug> --wait 600` |
| Bad deploy | Re-run the last good Deploy run, or `git revert` and push; `wrangler rollback` restores the previous Worker version |
| Cache suspicion on the CDN | Calendar jobs purge changed `cdn.freshcalendars.com` URLs; purge more in the Cloudflare dashboard (zone freshcalendars.com) |
| Contact messages | Email to the owner; copies in R2 `freshcalendars-state/contact/YYYY-MM/` |

## Where things are

- Worker logs: Cloudflare dashboard → Workers & Pages → freshcalendars → Logs
- Build state: R2 `freshcalendars-state` (last deployed builds, lastmod dates, image cache, AnindaIndex record)
- Health: `calendar.yml` health job, Mondays 07:15 UTC
