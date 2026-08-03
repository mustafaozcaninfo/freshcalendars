# Runbook — Fresh Calendars

## Common ops

| Situation | Action |
|-----------|--------|
| Wrong holiday date | Fix `holidays/rules.ts` + test → `FC_JOB=refresh` or local refresh → deploy |
| Empty PDF / bad OG | `pnpm fc gen --year Y --family …` → verify → sync-cdn → deploy |
| Cron silent | Admin automation page + `/var/log/freshcalendars-cron.log` + manual `FC_JOB=health` |
| CF purge fails | Confirm zone in API account (`CF_ZONE_ID`) — currently a known gap |
| Hestia domain rebuild | Re-run `hestia-apply-nginx-cache.sh` for `freshcalendars.com` |
| Cache suspicion | Deploy (purges) + `smoke:auto` cache assertions |
| Rollback | Restore VPS tar `/root/freshcalendars-public_html-*.tgz` + CF purge |

## Logs / paths

- Web root: `/home/yuzdehesaplama/web/freshcalendars.com/public_html/`
- App factory: `/home/yuzdehesaplama/private/freshcalendars-app`
- Nginx/Apache conf: `/home/yuzdehesaplama/conf/web/freshcalendars.com/`

## Contacts

`CRON_NOTIFY_TO` in `.env` / VPS app env.
