# Infra status checklist — Fresh Calendars

Last checked: **2026-08-03** (clean go/no-go — **GO**)

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Cloudflare zone | ✅ | `1e7d8a7f6839cf53df0ac94e2c264ebd` · active |
| Registrar NS | ✅ | 1.1.1.1 / 8.8.8.8 → `alexis` / `nelly` |
| Apex/www A → VPS | ✅ | `2.25.147.42` proxied |
| Site | ✅ | home/hub/blank/month/holidays/when-is/legal/sitemap/ads **200** |
| Origin Let’s Encrypt | ✅ | Hestia SSL + LE yes |
| CF SSL | ✅ | **strict** · always HTTPS · Rocket Loader off |
| Universal SSL wildcard | ⚠️ | still `pending_validation` (soft; apex/cdn already serving) |
| `cdn.freshcalendars.com` | ✅ | health **200** (proxied) |
| DO CDN host / Spaces | ✅ | health 200 · LIST 200 · custom domain attached |
| Spaces key | ✅ | `freshcalendars-factory` |
| Docs + `.env` | ✅ | Fresh bindings |
| Factory code | ✅ | deployed `dist/site` + app sync + CF purge |
| Live SSG | ✅ | hubs/when-is/legal 200 · brand Fresh Calendars |

---

## Cloudflare DNS

| Type | Name | Content | Proxied |
|------|------|---------|---------|
| A | `freshcalendars.com` | `2.25.147.42` | yes |
| A | `www.freshcalendars.com` | `2.25.147.42` | yes |
| CNAME | `cdn.freshcalendars.com` | `freshcalendars.nyc3.cdn.digitaloceanspaces.com` | yes |
| TXT | `_acme-challenge` | Universal SSL DCV values | no |
| MX / TXT | apex + DKIM | Zoho / Google verify / SPF | no |

## Zone settings

SSL **strict** · Always HTTPS · Min TLS 1.2 · TLS1.3/0-RTT · Brotli · HTTP/3 · Early Hints · Rocket Loader **off** · Security medium · cache level **aggressive** · browser TTL respect origin · Polish lossless

### Cache (2026-08-03)

| Layer | Policy |
|-------|--------|
| CF Cache Rule | apex + www → `cache: true`, edge TTL **31d** (`override_origin`) |
| Origin HTML | `Cache-Control: public, max-age=300, stale-while-revalidate=3600` (browsers, since 2026-10-27; was 7 days) + `CDN-Cache-Control: max-age=2678400` (Cloudflare) |
| Origin static | CSS/img **30d** · fonts **365d immutable** |
| Hestia nginx | `scripts/hestia-apply-nginx-cache.sh` (:80 + :443, user `yuzdehesaplama`) |

Warm edge proof (DOH PoP): `cf-cache-status: HIT`, homepage median TTFB **~37ms**.

### Lighthouse mobile (warm, 2026-08-03)

| URL | Perf | LCP | CLS |
|-----|------|-----|-----|
| `/` | 98 | 2.1s | 0.019 |
| `/printable-calendars.html` | 99 | 2.0s | 0 |
| `/august-calendars.html` | 99 | 2.1s | 0 |
| `/blank-calendars.html` | 100 | 1.7s | 0 |

BP ~75 expected (AdSense 3P cookies). `pnpm smoke:lighthouse` OK.

## DigitalOcean

| Field | Value |
|-------|--------|
| Bucket | `freshcalendars` nyc3 |
| CDN endpoint | `fb3b07cf-83cb-4b09-aca0-b681c6b050d9` |
| Custom domain | `cdn.freshcalendars.com` (`needs-cloudflare-cert`) |
| Spaces key | `freshcalendars-factory` |
| Interim asset URL | `https://freshcalendars.nyc3.cdn.digitaloceanspaces.com` until custom domain SSL active |

## VPS

| Field | Value |
|-------|--------|
| `DEPLOY_PATH` | `/home/yuzdehesaplama/web/freshcalendars.com/public_html/` |
| LE | yes (2026-08-03 → 2026-11-01) |

## Smoke

```
https://freshcalendars.com/printable-calendars.html → 200
https://freshcalendars.com/january-calendars.html   → 200
https://freshcalendars.com/when-is/easter           → 200
https://freshcalendars.nyc3.cdn.digitaloceanspaces.com/.factory-health.txt → 200
```

After Universal SSL → `active`, re-check `https://cdn.freshcalendars.com/.factory-health.txt` (expect 200; was intermittently 1014 while pending).
