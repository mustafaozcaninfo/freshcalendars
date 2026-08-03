# Deploy — Fresh Calendars

## Targets

| Var | Value |
|-----|-------|
| `DEPLOY_HOST` | `root@2.25.147.42` |
| `DEPLOY_PATH` | `/home/yuzdehesaplama/web/freshcalendars.com/public_html/` |
| `DEPLOY_PRIVATE` | `/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/` |
| `FRESHCALENDARS_APP` | `/home/yuzdehesaplama/private/freshcalendars-app` |

## Ship

```bash
pnpm test
pnpm fc refresh-evergreen   # or gen-meta / gen
pnpm fc verify
pnpm fc sync-cdn
pnpm fc deploy --confirm
pnpm smoke:auto
```

`SKIP_APP_SYNC=1` skips factory rsync (HTML-only).

## deploy.sh steps

1. `COPYFILE_DISABLE=1` rsync `dist/site/` → `public_html/`
2. Sync private PHP lib
3. Cloudflare `purge_everything` (requires valid `CF_ZONE_ID`)
4. `sync-app.sh` → VPS factory tree

## macOS

Always `COPYFILE_DISABLE=1` to avoid `._*` AppleDouble junk.

## First cutover caution

Legacy PHP is the live site. First deploy **replaces** `public_html` HTML/entrypoints. Keep a dated tar on VPS before cutover:

```bash
ssh root@2.25.147.42 'tar -C /home/yuzdehesaplama/web/freshcalendars.com -czf /root/freshcalendars-public_html-$(date +%F).tgz public_html'
```

Local backup already at `backup/public_html/`.
