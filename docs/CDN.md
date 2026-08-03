# CDN — Fresh Calendars

## Target topology

| Piece | Value | Status (2026-08-03) |
|-------|--------|---------------------|
| Provider | DigitalOcean Spaces (nyc3) | ✅ |
| Bucket | `freshcalendars` | ✅ |
| Origin endpoint | `https://freshcalendars.nyc3.digitaloceanspaces.com` | ✅ |
| DO CDN | `https://freshcalendars.nyc3.cdn.digitaloceanspaces.com` | ✅ endpoint `fb3b07cf-83cb-4b09-aca0-b681c6b050d9` |
| Public host | `https://cdn.freshcalendars.com` | ✅ DO custom domain + CF CNAME (proxied) |
| Spaces key R/W | `freshcalendars-factory` in `.env` | ✅ LIST/PUT/public GET verified |

Live checklist: [`INFRA-STATUS.md`](INFRA-STATUS.md).

## Object layout

```
assets/{year}/yearly/.../calendar.{png,pdf}
assets/{year}/monthly/{month}/.../calendar.{png,pdf}
assets/blank/...
assets/school/{span}/overview/...
og/{pageId}.png
```

Legacy on-origin printables live under `printable/yearly|monthly|blank/` — after cutover, HTML download buttons point at `CDN_ORIGIN`, not `/printable/…`.

## Commands

```bash
pnpm fc sync-cdn    # public-read + sha256 dedupe
pnpm fc purge-cdn   # DO CDN endpoint purge via API
```

Env: `DO_SPACES_*`, `DIGITALOCEAN_ACCESS_TOKEN`, `DO_CDN_ENDPOINT_ID=fb3b07cf-83cb-4b09-aca0-b681c6b050d9`, `CDN_ORIGIN=https://cdn.freshcalendars.com`.

## DNS / custom domain

1. ~~Create Spaces CDN endpoint~~ ✅  
2. ~~Custom domain `cdn.freshcalendars.com` + `needs-cloudflare-cert`~~ ✅  
3. ~~CF `cdn` CNAME → DO CDN host~~ ✅ (DNS-only until Universal SSL for `*.freshcalendars.com` is Active; then can orange-cloud)  
4. ~~Bucket-scoped Spaces key `freshcalendars-factory`~~ ✅  
5. Optional: Cache Rule for `cdn.freshcalendars.com/*` long TTL  
6. **Depends on:** registrar NS → alexis/nelly so CF (and thus `cdn.`) is authoritative

## Cutover note

Keep origin `/printable/` readable for 30 days (or 301 to CDN) so old external hotlinks don’t 404.
