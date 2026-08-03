# Fresh Calendars — deep site audit

Date: **2026-08-03** · Live crawl + legacy inventory + CDN spot-check

| Metric | Count |
|--------|------:|
| Sitemap / `all_pages.txt` | 93 |
| BFS HTML paths | 101 |
| Paths status-checked | 126 |
| Sitemap all 200 | ✅ |
| Broken internal HTML links | **0** |
| Trailing-slash gaps in sitemap | **0** |
| ItsCalendar title/H1 matches | **0** |
| Canonical issues | **0** |
| Empty title/H1 on sitemap pages | **0** |
| Homepage linked assets | **21/21 = 200** |
| CDN PNG/PDF/WebP (real URLs) | **200** |

---

## P0 — Fix (real gaps)

### 1. Missing redirect: `/{YYYY}-calendar.html`
- `/2026-calendar.html` → **404**
- Eski sitede yearly hub’a gidiyordu; `.htaccess`’te `year/{YYYY}` ve `printable-calendars-{YYYY}.html` var, **`{YYYY}-calendar.html` yok**
- Öneri: `^([0-9]{4})-calendar\.html$` → `/printable-calendars.html`

### 2. (Opsiyonel) `manifest.webmanifest` 404
- Canlıda dosya adı: **`/site.webmanifest`** (doğru, HTML buna linkli)
- `/manifest.webmanifest` yok — dışarıdan tahmin edilirse 404
- Öneri: alias/copy veya 301 → `/site.webmanifest` (düşük öncelik)

---

## P1 — Legacy soft pages (404, eski crawl’da vardı)

Eski PHP `/page/{holiday}` soft sayfaları; yeni sitede **when-is** kullanılıyor. İç link kırığı yok; dış backlink varsa 301 faydalı:

| Eski path | Önerilen hedef |
|-----------|----------------|
| `/page/columbus-day` | `/when-is/columbus-day/` |
| `/page/mothers-day` | `/when-is/mothers-day/` |
| (benzeri `/page/{slug}`) | `/when-is/{slug}/` |

Locale hub stub’ları (eski template var, ürün kararı yoksa 404 OK):

| Path | Not |
|------|-----|
| `/australia-holidays` | Eski `australia-holiday.php` — henüz üretilmedi |
| `/india-holidays` | Eski `india-holiday.php` — henüz üretilmedi |

---

## P2 — Eski when-is / template içerik boşlukları (sitemap’te yok)

Eski `backup/public_html/templates/` içinde vardı; canlı when-is’te yok (bilinçli genişleme adayı):

- `armed-forces-day`
- `constitution-day`
- `day-of-the-dead`
- `dia-de-los-muertos`
- `indigenous-peoples-day`
- `international-womens-day`
- `native-americans-day`
- `samhain`
- `star-wars-day`
- `world-environment-day`
- `world-teachers-day`

---

## OK — Bilinçli redirect’ler (sorun değil)

| From | To |
|------|-----|
| `/about`, `/contact` | `/page/about/`, `/page/contact/` |
| `/page/privacy`, `/page/terms` | privacy-policy / terms-of-use |
| singular `*-calendar.html` | `*-calendars.html` |
| `/weekly-calendars.html` etc. | printable-* hubs |
| `/year/2026`, `/editor/…` | yearly / blank hubs |
| `/holidays.html` | `/holidays/` |

---

## Temiz çıkanlar

- Sitemap 93/93 → 200
- İç HTML link 404 yok
- CDN asset’ler 200 (önceki audit’teki “CDN 403” image-sitemap parse kirliliğiydi — yanlış alarm)
- Slash’ler sitemap + `all_pages.txt`’te tutarlı
- IC metin eşleşmesi yok
- Canonical’lar final URL ile uyumlu
