# Blueprint A→Z — Fresh Calendars factory

Bu dosya, **freshcalendars.com** için ItsCalendar ile **aynı mimari** (generate-time SSG) ama **özgün URL, marka ve hosting** ile uçtan uca kurulum rehberidir.

Referans fabrika: `~/Documents/Workspace/ItsCalendar` · `docs/BLUEPRINT-A-Z.md`  
Canlı legacy: [freshcalendars.com](https://freshcalendars.com) · VPS backup: `backup/public_html/` (2026-08-03)  
Keşif çıktıları: [`URLS.md`](URLS.md) · [`../URL_INVENTORY.md`](../URL_INVENTORY.md) · [`DESIGN.md`](DESIGN.md)

---

## 0) Ürün kararı (kilitli)

| Karar | Fresh Calendars | Neden |
|-------|-----------------|--------|
| Render modeli | **Generate-time SSG** | SEO + hız + deterministik tarihler |
| URL modeli | **Evergreen legacy paths** (`/january-calendars.html`, `/when-is/easter`) | Mevcut GSC equity |
| Hosting | HestiaCP VPS `yuzdehesaplama` + Cloudflare | Mevcut origin |
| Binary assets | DigitalOcean Spaces + `cdn.freshcalendars.com` | HTML ince; PNG/PDF/og CDN’de |
| Monetization | AdSense **manuel** `ca-pub-2597035827677267` | Auto ads CLS |
| Preview UI | Astro (`apps/web`) design sandbox only | Production path değil |
| Marka | Mavi / altın / kırmızı — [`DESIGN.md`](DESIGN.md) | Live CSS + logo; ItsCalendar krem/terracotta değil |

**Yapma:** Soft-404, year-qualified indexable twin’ler, FullCalendar editor’ü core ürün, ItsCalendar görsel klonu.

---

## 1) Keşif & backup — DONE (2026-08-03)

1. ✅ Sitemap: 42 URL (`legacy/sitemap.xml`)
2. ✅ BFS crawl: `legacy/crawl/all_urls.txt` + `results.json`
3. ✅ VPS path: `/home/yuzdehesaplama/web/freshcalendars.com/public_html/`
4. ✅ Selective rsync → `backup/public_html/` (~218MB; vendor/node_modules/PHPlinks hariç)
5. ✅ Brand: `legacy/brand/*`, `img/fresh-logo.png`, `css/app.css` renkleri
6. ✅ **Cloudflare zone + DNS + SSL** — zone `1e7d8a7f6839cf53df0ac94e2c264ebd`, NS alexis/nelly, A→`2.25.147.42`, LE origin, CF SSL strict, site 200
7. ✅ URL envanteri: `URL_INVENTORY.md` + `docs/URLS.md`
8. ✅ Spaces + CDN + `cdn.freshcalendars.com` + factory Spaces key — [`INFRA-STATUS.md`](INFRA-STATUS.md)

Korunan çekirdek: yearly hub, blank, 12 ay, holidays, when-is×24, school/DST pages, legal, sitemap, ads.txt.

---

## 2) Monorepo iskeleti

```
packages/
  engine/      # resolve, holidays, seo, urls (Fresh path registry)
  templates/   # print HTML — Fresh visual families (not ItsCalendar CSS)
  generator/   # CLI + Playwright + sitePages SSG + Spaces
apps/
  web/         # Astro design preview ONLY
scripts/       # deploy, cron, smoke, CF/nginx
server/
  php/         # contact API + admin
  sql/         # cron_runs / contact
docs/          # this tree
dist/site/     # generated HTML (gitignore)
backup/        # legacy PHP (gitignore)
legacy/        # crawl + brand extracts (gitignore)
.env / .env.example
```

Stack: **pnpm** workspace, Node ≥22, TypeScript, `"type": "module"`.  
CLI: `pnpm fc <cmd>` → `packages/generator/src/cli.ts` (ItsCalendar’daki `its` yerine **fc**).

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test
```

---

## 3) Engine

| Modül | İş |
|-------|-----|
| `resolve.ts` | `resolvePlanningYear`, `resolveMonthYear`, `resolveAllMonthYears` |
| `holidays/*` | US rules + Easter computus; when-is slug seti legacy ile hizalı |
| `schoolYear.ts` | Aug–Jul span |
| `seo/buildMeta.ts` | title/description/canonical/og/FAQ |
| `urls.ts` | **Fresh** path registry (`*-calendars.html`, `/when-is/…`) |

Rolling davranış ItsCalendar ile aynı matematik; path spelling farklı.

Legacy bug to kill: hardcoded `$thisYear = "2026"` / `year-config.php` fixed year.

---

## 4) Templates + generator

1. Unique print CSS/HTML under Fresh tokens (DESIGN.md)
2. Playwright → PNG + PDF
3. sharp WebP previews (540w + 2x)
4. catalog paths: `assets/{year}/…`, `og/{pageId}.png`
5. Commands:

```bash
pnpm fc gen --year 2026
pnpm fc gen-meta --year 2026
pnpm fc refresh-evergreen
pnpm fc verify
pnpm fc build
```

---

## 5) Site HTML — `sitePages.ts`

Emit `dist/site/` with:

- Evergreen titles/H1/canonical matching **legacy URL spellings**
- JSON-LD (WebSite, Breadcrumb, FAQ, ImageObject)
- Family skins: `family-home|yearly|monthly|blank|…`
- Manual AdSense slots (`ca-pub-2597035827677267`)
- Self-host fonts + critical CSS inline
- `.htaccess`: www→apex, singular→plural, year-URL→evergreen, cache headers
- `sitemap.xml`, `sitemap-images.xml`, `feed.xml`, `robots.txt`, `ads.txt`, `404.html`, icons

---

## 6) CDN (DigitalOcean Spaces)

| Parça | Hedef | Status |
|-------|--------|--------|
| Bucket | `freshcalendars` (nyc3) | ✅ |
| Origin | `freshcalendars.nyc3.digitaloceanspaces.com` | ✅ |
| DO CDN endpoint | `fb3b07cf-83cb-4b09-aca0-b681c6b050d9` | ✅ |
| Public | `cdn.freshcalendars.com` → CNAME proxied | ❌ pending |

```bash
pnpm fc sync-cdn
pnpm fc purge-cdn
```

---

## 7) Deploy

```
DEPLOY_HOST=root@2.25.147.42
DEPLOY_PATH=/home/yuzdehesaplama/web/freshcalendars.com/public_html/
DEPLOY_PRIVATE=/home/yuzdehesaplama/web/freshcalendars.com/private/freshcalendars/
FRESHCALENDARS_APP=/home/yuzdehesaplama/private/freshcalendars-app
```

```bash
pnpm fc verify
pnpm fc sync-cdn
pnpm fc deploy --confirm
```

`scripts/deploy.sh`: rsync HTML → private PHP → **CF purge** → `sync-app.sh`.

---

## 8) İnce PHP

| Path | İş |
|------|-----|
| `server/php/api/contact.php` | Form → MariaDB |
| `server/php/admin/*` | Inbox + cron status |
| `server/sql/schema.sql` | cron + contact |

---

## 9) Cron (VPS)

`scripts/server-cron.sh` + `FC_JOB=…`

| Job | Cron | Ne |
|-----|------|-----|
| `refresh` | `15 0 1 * *` | refresh-evergreen Y+Y1 → verify → sync-cdn → deploy → smoke |
| `generate-next` | `30 0 1 9 *` | next year full gen |
| `rollover` | `20 0 1 1 *` | planning-year rollover |
| `health` | `0 3 * * 1` | smoke + stale alert |

`CRON_NOTIFY_TO` in app `.env`.

---

## 10) Cloudflare + origin cache

Aylık SSG modeli (ItsCalendar ile aynı TTL’ler):

| Katman | Politika |
|--------|----------|
| HTML browser | 7g + SWR |
| HTML edge | ~31g |
| Static / fonts | 30g / 365g immutable |
| Rocket Loader | **OFF** |

**Blocker:** Zone bu API hesabında yok — önce zone attach.

Scripts: `cf-cache-optimize.sh`, `hestia-apply-nginx-cache.sh` (user `yuzdehesaplama`).

---

## 11) Performans & CLS

ItsCalendar paketini taşı: font optional/preload/metrics, WebP LCP, manual ads min-height, Auto ads OFF, no empty 320px rail.

```bash
node scripts/measure-cls.mjs
node scripts/scan-layout.mjs
pnpm smoke:lighthouse
```

---

## 12) Smoke kapıları

| Komut | Ne |
|-------|-----|
| `pnpm test` | engine |
| `pnpm fc verify` | meta/HTML/og |
| `pnpm smoke` / `smoke:auto` | URL + CDN + cache |
| `pnpm smoke:ads` | AdSense slots |

Ship checklist: test → gen/refresh → verify → sync-cdn → deploy → smoke:auto → lighthouse.

---

## 13) SEO paket (v1 scope)

- Evergreen: yearly, monthly×12, blank, holidays, when-is×24, school + DST pages, legal
- Optional v1.1: monday-start, weekly, school printable hub, guides, UK/CA holidays
- RSS + image sitemap
- Year-qualified → 301 only
- Keyword catalog Fresh-specific (`docs/KEYWORD-CATALOG.md`)

---

## 14) GitHub / release

`.gitignore`: `.env`, `backup/`, `legacy/`, `dist/`, `node_modules/`  
CI: pnpm test (+ verify if dist present)  
Private repo `mustafaozcaninfo/freshcalendars` + `v1.0.0` when ship-ready.

---

## 15) `.env` şablonu

```
CF_EMAIL / CF_API_KEY / CF_ZONE_ID / CF_ZONE_NAME=freshcalendars.com
DO_SPACES_* / DIGITALOCEAN_ACCESS_TOKEN / CDN_ORIGIN / DO_CDN_ENDPOINT_ID
DEPLOY_HOST / DEPLOY_PATH / DEPLOY_PRIVATE / FRESHCALENDARS_APP
CRON_NOTIFY_TO
DB_*
SKIP_APP_SYNC=
```

ItsCalendar `.env` değerlerini aynen kopyalama — yanlış zone/bucket/path.

---

## 16) Uygulama sırası (bundan sonra)

1. ~~CF + Spaces + CDN + DNS/SSL cutover~~ ✅ ([`INFRA-STATUS.md`](INFRA-STATUS.md))  
2. Monorepo iskeletini ItsCalendar’dan fork/adapt (`fc` CLI, Fresh urls/design)  
3. Engine + holidays slug parity  
4. Templates Fresh skin  
5. `sitePages` tüm URL_INVENTORY A+B  
6. İlk `gen` → `sync-cdn` → staging path veya dikkatli prod cutover  
7. CF cache rules + nginx TTL split  
8. Crontab + notify  
9. AdSense manuel; Auto off  
10. CLS measure  
11. GSC sitemap resubmit  
12. `v1.0.0` release  

---

## 17) Runbook (kısa)

| Durum | Aksiyon |
|-------|---------|
| Yanlış tatil | holidays rules + test → refresh → deploy |
| CF purge fail | zone ID eksik — §1 blocker |
| Cron sessiz | `/admin/automation.php` + `FC_JOB=refresh` |
| Hestia rebuild | `hestia-apply-nginx-cache.sh` yeniden |

---

## 18) Bilinçli olarak yapılmayanlar

- Year-qualified indexable kopyalar
- Soft-404
- Full blog CMS
- Legacy editor / DOCX / PHPlinks
- ItsCalendar görsel kimliğini kopyalamak

---

## 19) Dosya haritası

| Dosya | Rol |
|-------|-----|
| `packages/engine/src/urls.ts` | Fresh path registry |
| `packages/generator/src/sitePages.ts` | Public HTML |
| `packages/generator/src/gen.ts` | Factory pipeline |
| `scripts/deploy.sh` / `sync-app.sh` | Ship |
| `docs/DESIGN.md` | Brand tokens |
| `docs/URLS.md` | URL sözleşmesi |
| `backup/public_html/` | Legacy reference only |

---

## 20) Keşif özeti (bugün)

1. Sitemap + crawl + htaccess rewrite map çıkarıldı  
2. Legacy site Mac’e indirildi  
3. Marka/renk/logo/AdSense/analytics envanteri yazıldı  
4. Bu blueprint + docs ağacı oluşturuldu  
5. Sonraki adım: CF zone + Spaces + monorepo kod üretimi  

---

*Mimari ItsCalendar; kimlik ve URL Fresh Calendars.*
