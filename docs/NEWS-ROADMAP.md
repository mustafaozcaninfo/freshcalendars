# Fresh Calendars News — Yol Haritası (`/news/`, Astro, Google News)

Hazırlanma: 2026-10-18 · Durum: **N0 ✔ · N1 ✔ · N2 ✔ · N3 ✔ · N4 ✔ · sıradaki N5**
Kaynaklar: canlı `tech-insider.org` analizi (sitemap index, post sitemap, RSS, örnek makale `verizon-iphone-handoff-fee-10-dollars-2026`), `SEO-HARITASI-TAM.md`, `docs/DESIGN.md`, `docs/BLUEPRINT-A-Z.md`, `packages/generator/src/sitePages.ts`, VPS/nginx/Cloudflare yapılandırması.

---

## 0. Özet (tek paragraf)

`freshcalendars.com/news/` altında, ana sitenin mavi/altın/kırmızı temasını **aynı header/footer/font/token kaynağından** kullanan, Astro ile üretilen statik bir haber bölümü kurulacak. Makale sayfası SEO yüzeyi tech-insider örneğiyle birebir tutarlı olacak (aynı meta seti, aynı `@graph` JSON-LD şekli, WebP hero, TOC, FAQ, yazar kartı, ilgili yazılar), onun eksikleri kapatılacak (gerçek Google News sitemap’i, görsel sitemap, sayısal breadcrumb pozisyonları, görünür breadcrumb, Person `sameAs`). Sitemap yapısı tech-insider’ın index → post/category sitemap düzenini izleyecek ve ona ek olarak `news:` namespace’li 48 saatlik News sitemap’i olacak. Hedef: mobil Lighthouse **Performance / Accessibility / Best Practices / SEO = 100** (reklam stratejisi §8.3’e bağlı). Haber bölümü takvim fabrikasından **ayrı build ve ayrı deploy** ile yayınlanacak; günlük cron’un `rsync --delete`’i ona dokunmayacak.

---

## 1. Örnek site analizi (tech-insider.org) — neyi kopyalıyoruz, neyi düzeltiyoruz

### 1.1 Sitemap mimarisi

| Ölçüm | tech-insider | Bizim karar |
|---|---|---|
| Kök | `/sitemap.xml` → `<sitemapindex>` (13 alt sitemap) + XSL stylesheet | `/news/sitemap.xml` index + `/news/sitemap.xsl` (aynı görünüm) |
| Yazılar | `post-sitemap.xml` **tek dosya, 4.617 URL**, `lastmod` azalan sırada, ilk satır anasayfa `priority 1.0`, diğerlerinde priority yok | `/news/post-sitemap.xml` aynı düzen; 5.000 URL’de `post-sitemap2.xml`’e böl (limit 50.000 ama hızlı işlenir) |
| Kategoriler | `category-sitemap.xml` (123 URL) | `/news/category-sitemap.xml` |
| Yerel sürümler | `ca-`, `au-`, `de-`… ayrı sitemap’ler + `/ca/` prefix | Faz 1’de yok (sadece en-US). §12’de UK/CA opsiyonu |
| Sayfa | `page-sitemap.xml` | `/news/page-sitemap.xml` (about, editorial policy, authors index) |
| **Google News sitemap** | **Yok** (`/news-sitemap.xml` 404, `news:` namespace yok) | **Var**: `/news/news-sitemap.xml`, son 48 saat, ≤1000 URL, `news:publication`, `news:publication_date`, `news:title` |
| Görsel sitemap | Yok (`image:` namespace yok) | `post-sitemap.xml` içinde `image:image` (hero) |
| robots.txt | Cloudflare managed AI-bot blokları + `Content-Signal: search=yes,ai-train=no,use=reference` + `Sitemap:` | Ana `robots.txt` generator’da üretiliyor → yeni `Sitemap:` satırları oradan eklenir (§7.4). AI-bot politikası ayrı karar (§13) |

### 1.2 Makale sayfası `<head>` (birebir parite listesi)

Örnekte bulunan ve bizde **zorunlu** olanlar:

- `<title>` = SEO başlığı (H1’den farklı olabilir: H1 “Verizon Sets $10/Month Fee for iPhone Handoff [2026]”, title “Verizon Charges $10/Month for iPhone Handoff Fee”)
- `meta description` (≈150–160 karakter)
- `meta robots` = `index, follow, max-snippet:-1, max-video-preview:-1, max-image-preview:large` ← Discover için kritik
- `link canonical` (mutlak, sonda `/`)
- `hreflang en` + `x-default`
- `og:locale en_US`, `og:type article`, `og:title`, `og:description`, `og:url`, `og:site_name`, `og:updated_time`
- `og:image` + `secure_url` + `width` + `height` + `alt` + `type image/webp`
- `article:section`, `article:published_time`, `article:modified_time`
- `twitter:card summary_large_image`, `twitter:title/description/image`
- `twitter:label1 Written by` / `twitter:data1 {yazar}`, `twitter:label2 Time to read` / `twitter:data2 {n} minutes`
- `link rel=alternate type=application/rss+xml` (news feed)

Örnekte olup **almayacaklarımız**: oEmbed linkleri, comments feed, `dns-prefetch fonts.googleapis.com` (fontlar self-hosted), Google Fonts CSS (render-blocking), 69 KB inline CSS, 13 script.

Eklediklerimiz: `article:author` (yazar URL’i), `meta name=author`, `link rel=preload` hero (imagesrcset), `theme-color`.

### 1.3 JSON-LD `@graph` (aynı şekil, düzeltilmiş)

Örnek tek bir `<script type="application/ld+json">` içinde `@graph` kullanıyor: `Organization#organization` (logo ImageObject `#logo`), `WebSite#website`, hero `ImageObject` (`@id` = görsel URL’i, width/height/caption/license/creditText/copyrightNotice), `BreadcrumbList#breadcrumb` (Home → Kategori → Yazı), `WebPage#webpage` (datePublished/dateModified/primaryImageOfPage/breadcrumb), `Person` (`@id` = yazar URL’i, image, worksFor), `NewsArticle#richSnippet` (headline, keywords, articleSection, author, publisher, description, image, mainEntityOfPage, dateline).

Düzelteceğimiz hatalar:
1. `ListItem.position` **sayı** olmalı (örnekte `"1"` string).
2. Breadcrumb **görünür HTML** olarak da olmalı (örnekte yalnızca JSON-LD).
3. `Person` için `sameAs` (yalnızca doğrulanmış profiller), `jobTitle`, `description`; avatar gerçek fotoğraf (örnekte JSON-LD’de jenerik plugin avatarı var).
4. `NewsArticle.image` 3 oran: 16:9, 4:3, 1:1, her biri ≥1200 px genişlik (Google Article önerisi).
5. `headline` ≤110 karakter; `NewsArticle.url`; `isAccessibleForFree: true`; `wordCount`; `inLanguage`.
6. `dateline` gerçek yer (“New York”) — örnekte site adı yazılmış.
7. Organization: `sameAs`, `publishingPrinciples` (editorial policy URL), `ethicsPolicy`, `correctionsPolicy`, `masthead`, `actionableFeedbackPolicy` → Google News güven sinyalleri.
8. FAQ varsa: görünür FAQ bölümü, **FAQPage yok** (SEO-HARITASI §08: Ağustos 2023’ten beri sınırlı; editoryal FAQ için QAPage yok).
9. `@id`’ler ana siteyle tek varlık olacak: `https://freshcalendars.com/#organization`, `https://freshcalendars.com/#website` (ana generator’a da eklenmeli, §7.6).

### 1.4 Makale gövdesi düzeni (örnekten çıkarılan)

```
Header (site)  →  Breadcrumb  →  Kategori etiketi
H1 (+ [2026] eki opsiyonel)
Meta bar: Yazar (avatar 25px) · Yayın tarihi <time datetime> · Güncelleme · "13 min read"
Hero WebP 16:9 (eager, fetchpriority=high, srcset 300/768/1024/1344)
Özet kutusu (lede / key takeaways)
TOC (katlanabilir, h2 listesi)  ← örnekte "ti-toc collapsed"
Gövde: 10–15 H2, tablolar (2), listeler, karşılaştırma tablosu
"Analysis" / "What to know" / "Predictions" bölümleri
FAQ (görünür, <details>)
Sources (kaynak listesi, dış linkler)
Yazar kartı (80px foto, bio, yazar sayfası linki)
Related Coverage / Related Posts (3 kart, 768w lazy WebP)
Footer (site)
```

Örnekte ~3.400 kelime, 15 H2. **Bizde zorunlu değil**: haber türüne göre 400–1.500 kelime (§9.2).

### 1.5 RSS

Örnek: RSS 2.0, `content:encoded`, `dc:creator`, `category`, `sy:updatePeriod hourly`, 10 item, görsel yok. Biz: aynısı + `media:content` (hero, 1200w) + 30 item + `atom:link rel=self` → Google News, Flipboard, MSN feed alımı için.

### 1.6 Performans gözlemi

Örnek `cf-cache-status: DYNAMIC` (Cloudflare’de HTML cache yok, FastCGI cache var), blocksy teması + Google Fonts + 3 harici script. 100 skor alması mümkün değil; biz statik + sıfır JS ile bunu aşacağız.

---

## 2. Mevcut sistemden gelen kısıtlar (yapılmazsa bölüm bozulur)

| # | Kısıt | Kanıt | Çözüm (görev) |
|---|---|---|---|
| K1 | Her deploy `public_html`’e `rsync --delete` yapıyor; günlük 05:25 cron dahil | `scripts/deploy.sh`, `scripts/server-cron.sh` `deploy_site()` | Her iki rsync’e `--exclude 'news/'` (N0.1) |
| K2 | `gen.ts` her build’de `dist/site`’ı siliyor | `packages/generator/src/gen.ts:208` | News çıktısı `dist/site` dışında: `dist/news/` (N1.2) |
| K3 | `robots.txt` her build’de sıfırdan yazılıyor (2 Sitemap satırı) | `sitePages.ts` `writeSitemap` ~l.2660 | Generator’a news sitemap satırı ekle (N5.6) |
| K4 | HTML cache: tarayıcı 7 gün, CF edge 31 gün `override_origin`, tazelik yalnızca `purge_everything` | `.htaccess` l.2816+, `scripts/hestia-apply-nginx-cache.sh`, `cf-cache-optimize.sh` | `/news/*` için ayrı cache katmanı (N7.3–N7.5) |
| K5 | nginx `.html` dosyalarını kendisi 7 günle servis ediyor; dizin URL’leri Apache’ye gidiyor | nginx script | `location ^~ /news/` bloğu (N7.4) |
| K6 | `sync-app.sh` `apps/`’i VPS’e göndermiyor | `scripts/sync-app.sh` | Zamanlanmış yayın için `apps/news` sync’e eklenir (N7.7) |
| K7 | `apps/web` Astro sandbox eski ItsCalendar paleti + Google Fonts kullanıyor | `apps/web/src/styles/tokens.css` | Kullanılmaz; yeni `apps/news` (N1.1) |
| K8 | BLUEPRINT “Astro = sandbox only”, “Full blog CMS = not doing” diyor | `docs/BLUEPRINT-A-Z.md` §0, §18 | Doküman güncellemesi (N0.4) |
| K9 | SEO-HARITASI l.2591 “public sayfada tarih yok” kuralı | PrintGridCalendar metodolojisi | `/news/` için açık istisna: görünür byline + tarih zorunlu (N0.4) |
| K10 | Ana site JSON-LD’de Organization `@id`/logo yok | `sitePages.ts` `metaTags` | `#organization` / `#website` ana siteye de eklenir (N7.6) |
| K11 | `.htaccess` tüm kuralları kök anchor’lı (`^page/…`) | `htaccessContent` | `/news/page/2/` güvenli; doğrulama testi yine de yazılır (N7.8) |
| K12 | Sunucu: 4 çekirdek, 15 GB RAM, Node 22 | `ssh` kontrolü | VPS’te Astro build mümkün |

---

## 3. Mimari kararlar

### 3.1 Dizin ve build

```
apps/news/                      # yeni Astro projesi (apps/web'e dokunulmaz)
  astro.config.mjs              # site, base:'/news', trailingSlash:'always', build.format:'directory', outDir:'../../dist/news'
  src/content.config.ts         # content collections + zod şemaları
  src/content/articles/YYYY/MM/<slug>.md(x)
  src/content/authors/<slug>.json
  src/content/categories/<slug>.json
  src/assets/news/<slug>/hero.(jpg|png)   # kaynak görsel ≥1600px
  src/layouts/NewsBase.astro    # <head>, header, footer, ads loader
  src/components/…              # ArticleMeta, Toc, Faq, Sources, AuthorCard, RelatedGrid, Breadcrumb, Card, Pagination, AdSlot
  src/lib/seo.ts                # meta + @graph üreticileri (saf fonksiyonlar, test edilir)
  src/lib/sitemaps.ts           # xml üreticileri (test edilir)
  src/pages/index.astro                       → /news/
  src/pages/page/[n].astro                    → /news/page/2/
  src/pages/[slug]/index.astro                → /news/<slug>/
  src/pages/category/[cat]/index.astro        → /news/category/<cat>/
  src/pages/category/[cat]/page/[n].astro
  src/pages/author/[author]/index.astro       → /news/author/<slug>/
  src/pages/about/ editorial-policy/ corrections/ masthead/  (veya ana /page/… ile paylaşım, N8)
  src/pages/sitemap.xml.ts  post-sitemap.xml.ts  category-sitemap.xml.ts  author-sitemap.xml.ts  page-sitemap.xml.ts  news-sitemap.xml.ts
  src/pages/feed.xml.ts                       → /news/feed.xml
  public/sitemap.xsl
packages/site-chrome/           # yeni: ana sitenin header/footer/CSS/font kaynağı (tek kaynak)
```

**URL kalıbı:** `/news/<slug>/` (tarih yok, tech-insider gibi düz slug; yıl son eki yalnızca yıl gerçekten içerikte anlamlıysa: `daylight-saving-time-ends-2026`). Slug değişmez; değişirse 301 haritası (`apps/news/redirects.json` → `.htaccess` parçası).

### 3.2 Tema: tek kaynak (kopyalamak değil, paylaşmak)

`sitePages.ts` içindeki `CSS` (l.341), `FONTS_CSS` (l.324), `siteHeaderHtml` (l.1075), `siteFooterHtml` (l.1105), `NAV_JS` (l.954), `ADSENSE_JS` (l.123), `adUnit` (l.85) `packages/site-chrome`’a taşınır, hem generator hem Astro buradan import eder. Böylece header’a “News” linki tek yerden iki tarafa gider, tasarım sürüklenmez. Astro tarafı `set:html` ile header/footer’ı basar; CSS’in yalnızca news’in kullandığı alt kümesi + news bileşen CSS’i inline edilir (Astro `inlineStylesheets:'always'`).

Kurallar (DESIGN.md): Sora başlık, Manrope UI, **Source Sans 3 makale gövdesi**, `font-display: optional`, preload; mavi header + 4 px altın alt çizgi; footer 10 px altın üst çizgi; reklam yalnızca ekranın altında, min-height’lı manuel slot; dark-mode chrome yok; mor gradyan yok.

### 3.3 Yayın ve deploy (takvim fabrikasından bağımsız)

- `pnpm news:build` → `dist/news/`
- `pnpm news:verify` → şema, link, sitemap, JSON-LD, görsel boyutları
- `pnpm news:deploy` → `rsync --delete dist/news/ → public_html/news/` + **URL bazlı** Cloudflare purge (değişen makale, `/news/`, ilgili kategori/yazar sayfaları, tüm news sitemap’leri, feed)
- Zamanlanmış yazılar (`publishedAt` gelecekte) → VPS cron her 15 dk `news:build` + `news:deploy` yalnızca yeni yayın varsa (N7.7)
- Takvim deploy’u `news/`’i exclude eder; news deploy’u yalnızca `news/` altına yazar → iki pipeline birbirini silemez.

### 3.4 İçerik kaynağı

Faz 1: Git içinde Markdown/MDX (content collections). Yayın akışı = commit → `news:deploy`. CMS (Decap/Keystatic, git tabanlı) Faz 3 opsiyonu; veritabanlı CMS yok (BLUEPRINT ruhu).

---

## 4. İçerik modeli (zod şeması)

`articles`:

| Alan | Tip / kural | Kullanım |
|---|---|---|
| `title` | ≤110 kr | H1, `headline`, `news:title` |
| `seoTitle` | ≤60 kr, opsiyonel | `<title>`, `og:title` |
| `description` | 120–160 kr | meta description, og, RSS |
| `slug` | kebab, benzersiz, değişmez | URL |
| `publishedAt` | ISO-8601 + saat dilimi | datePublished, news sitemap (48 saat penceresi) |
| `updatedAt` | ≥ publishedAt | dateModified, `og:updated_time`, sitemap lastmod |
| `author` | `reference('authors')` (birden çok desteklenir) | byline, Person |
| `category` | `reference('categories')` | articleSection, breadcrumb |
| `keywords` | 1–5 string | `NewsArticle.keywords` (`news:keywords` Google tarafından kullanılmıyor, eklenmez) |
| `hero` | `{ image(), alt (zorunlu), caption?, credit?, license? }` kaynak ≥1600 px | og:image, ImageObject, LCP |
| `dateline` | ör. `New York` | `NewsArticle.dateline` + görünür |
| `type` | `news | explainer | analysis | update` | şablon varyantı, schema (`NewsArticle` / `AnalysisNewsArticle` / `BackgroundNewsArticle`) |
| `summary` | 2–4 madde | “Key points” kutusu |
| `faq` | `{q,a}[]` opsiyonel | görünür FAQ (FAQPage yok) |
| `sources` | `{title,url,publisher,date}[]` ≥1 (news tipi için zorunlu) | Sources bölümü |
| `related` | slug[] opsiyonel (yoksa otomatik) | Related Posts |
| `internalLinks` | `/when-is/…`, `/holidays/`, `/{month}-calendars.html` | outer → core link akışı (SEO-HARITASI §04) |
| `corrections` | `{date,text}[]` | görünür düzeltme notu + dateModified |
| `draft`, `noindex` | bool | build dışı / `noindex` |

`authors`: `name, slug, role, bio (≥50 kelime, gerçek), photo (≥400px), sameAs[] (doğrulanmış), email?`
`categories`: `name, slug, description (≥80 kelime, kategori sayfası intro’su), order`

---

## 5. Konu odağı (yalnızca haber, marka ile uyumlu)

Google News’te otorite = dar ve tutarlı konu. Fresh Calendars’ın varlığı “takvim, tarih, tatil” olduğu için haber kapsamı bununla sınırlı tutulur (KEYWORD-CATALOG: kardeş sitelerle kanibalizasyon yok).

| Kategori slug | Kapsam | Ana siteye iç link hedefi |
|---|---|---|
| `holidays` | Federal / eyalet tatil kararları, OPM duyuruları, yeni tatiller (Juneteenth tipi), observed-date değişiklikleri | `/when-is/<slug>/`, `/holidays/` |
| `time-change` | DST yasaları (Sunshine Protection Act, eyalet tasarıları), saat değişimi haberleri | `/page/daylight-savings/` |
| `school-calendars` | Büyük okul bölgelerinin takvim kararları, kar günleri, akademik yıl değişiklikleri | `/printable-school-calendar.html`, `/page/school-holidays/` |
| `retail-dates` | Black Friday, Prime Day, Cyber Monday tarih duyuruları | `/when-is/black-friday/`… |
| `sky-events` | Tutulmalar, dolunay, meteor yağmurları, ekinoks/gündönümü | ay sayfaları |
| `uk-canada` | UK bank holiday ve Kanada statutory holiday haberleri | `/uk-holidays/`, `/canada-holidays/` |
| `planning` | Mali yıl, vergi son tarihleri, seçim günü gibi tarih bazlı “ne zaman” haberleri | `/guides/fiscal-year-calendar.html` |

Haber türleri: kısa **breaking** (400–700 kelime, 1–2 saat içinde), **explainer** (900–1.500), **update** (mevcut yazıya güncelleme + `corrections`/dateModified). Uzun 3.400 kelimelik tech-insider formatı yalnızca analiz türünde.

---

## 6. Sayfa şablonları (çok basit arayüz)

Tasarım ilkesi: beyaz zemin, tek sütun okuma (max 68ch), Source Sans 3 gövde, mavi linkler, altın vurgu çizgisi; kart grid’i yalnızca listelerde. JS yok (TOC `<details>`, FAQ `<details>`, nav mevcut `NAV_JS`).

1. **Makale** — §1.4 düzeni. Masaüstünde sağ sidebar yok (CLS ve sadelik için); reklam slotları: gövde içinde 3. H2’den sonra `inArticle` (1984071374), yazar kartından sonra 1 adet; ilk ekranda reklam yok.
2. **News anasayfa `/news/`** — H1 “Calendar & Holiday News”, 1 öne çıkan (büyük kart, eager), ardından 20 öğelik kronolojik liste (küçük 16:9 thumb, başlık, tarih, kategori), sayfalama `/news/page/2/`. Kategori şeritleri yok (sade).
3. **Kategori** — kategori açıklaması (≥80 kelime) + aynı liste + sayfalama. `CollectionPage` + `ItemList`.
4. **Yazar** — foto, bio, sameAs linkleri, yazıları. `ProfilePage` + `Person`.
5. **Güven sayfaları** — About News, Editorial Policy, Corrections Policy, Masthead (kim, rol), Contact (mevcut `/page/contact/`).
6. **404** — ana 404’ü kullan (`ErrorDocument`).

Sayfalama: `rel=prev/next` yok (Google kullanmıyor), sayfa 2+ `index, follow`, self-canonical, başlığa “– Page 2”.

---

## 7. SEO teknik görevleri

### 7.1 Head ve JSON-LD
`src/lib/seo.ts` içinde saf fonksiyonlar: `articleHead(article)`, `articleGraph(article)`, `listingGraph(...)`, `authorGraph(...)`. Çıktılar birim testle §1.2/§1.3 listesine karşı doğrulanır (her alan var mı, tarih ISO mu, position sayı mı, image ≥1200 mi).

### 7.2 Sitemap’ler (tech-insider düzeni + News)

```
/news/sitemap.xml                 sitemapindex (xsl)
  ├─ /news/post-sitemap.xml       tüm makaleler, lastmod desc, ilk satır /news/ priority 1.0, image:image hero
  ├─ /news/category-sitemap.xml
  ├─ /news/author-sitemap.xml
  ├─ /news/page-sitemap.xml
  └─ /news/news-sitemap.xml       Google News: publishedAt son 48 saat, ≤1000
```

News sitemap öğesi:

```xml
<url>
  <loc>https://freshcalendars.com/news/daylight-saving-time-ends-2026/</loc>
  <news:news>
    <news:publication><news:name>Fresh Calendars</news:name><news:language>en</news:language></news:publication>
    <news:publication_date>2026-10-18T09:30:00-04:00</news:publication_date>
    <news:title>Daylight Saving Time Ends Nov. 1, 2026: What Changes</news:title>
  </news:news>
</url>
```

Kurallar: `news:name` tüm sitede birebir aynı; 48 saat dışı öğe çıkar (cron build’i bunu otomatik yapar); boş kalırsa geçerli boş `<urlset>`; `lastmod` yalnızca gerçek içerik değişikliğinde.

### 7.3 Cache (Cloudflare)
Site geneli kuralın **önüne** yeni Cache Rule: `starts_with(http.request.uri.path, "/news/")` → edge TTL 10 dk (`override_origin`), browser TTL respect origin. News sitemap + feed: edge 5 dk. Publish’te URL bazlı purge (≤30 URL/istek). `cf-cache-optimize.sh` bu kuralı da yazacak şekilde güncellenir.

### 7.4 Origin header (nginx + Apache)
- nginx: `location ^~ /news/` → `.html` için `Cache-Control: public, max-age=300, stale-while-revalidate=600`, `CDN-Cache-Control: max-age=600`; `/news/_astro/` ve `/news/_img/` → 1 yıl immutable (hash’li dosya adı).
- `.htaccess` (generator’ın yazdığı): `<If "%{REQUEST_URI} =~ m#^/news/#">` aynı başlıklar; XML için `application/xml` + kısa TTL.

### 7.5 robots.txt / llms.txt / ana feed
Generator `writeSitemap` → `Sitemap: https://freshcalendars.com/news/sitemap.xml` ve `…/news/news-sitemap.xml` satırları. `llms.txt`’ye News bölümü. Ana `feed.xml` takvim feed’i kalır; news ayrı `/news/feed.xml`.

### 7.6 Varlık tutarlılığı
Ana site `metaTags`’e `Organization` (`@id #organization`, logo 512×512, `sameAs`) ve `WebSite` (`@id #website`) eklenir; news aynı `@id`’leri referans verir. Header’a “News” linki (site-chrome).

### 7.7 İç linkleme
Her makale ≥2 ana-site linki (when-is / tatil hub / ay sayfası) — haber = dış katman, takvim sayfaları = çekirdek (SEO-HARITASI §04). Ters yön: ilgili `/when-is/<slug>/` sayfasına “Latest news” kutusu (son 3 haber, build zamanı JSON’dan; generator `dist/news/latest.json` okur).

### 7.8 Doğrulama
`news:verify`: her URL 200 tek H1, canonical self, JSON-LD parse + zorunlu alanlar, kırık iç link yok, her `img` width/height/alt, sitemap’teki her URL build’de var, News sitemap’te 48 saat dışı yok, `/news/page/2/` için `.htaccess` redirect’ine takılmama testi.

---

## 8. Performans: Lighthouse 100 planı

### 8.1 Bütçe (mobil, Moto G Power, slow 4G)

| Metrik | Hedef |
|---|---|
| LCP | ≤1.8 s (hero WebP) |
| CLS | 0 |
| TBT | 0 ms |
| HTML (gzip) | ≤35 KB |
| Kritik CSS | inline, ≤14 KB |
| JS (reklam hariç) | 0 KB (yalnızca nav için mevcut ~1 KB inline) |
| Font | 2 dosya preload (Sora 700, Source Sans 3 400), `optional` |
| İstek sayısı ilk yükleme | ≤8 |

### 8.2 Teknikler
- Astro `output:'static'`, `inlineStylesheets:'always'`, `compressHTML:true`, client island yok.
- Görseller: Astro `<Picture>` + sharp → AVIF + WebP, genişlik 400/640/828/1080/1344/1600, `sizes="(max-width: 720px) 100vw, 720px"`; hero `loading=eager fetchpriority=high decoding=async` + `<link rel=preload as=image imagesrcset>`; diğerleri lazy. Aynı origin’den servis (`/news/_img/`) → ekstra DNS/TLS yok. OG/Discover için ayrıca 1200×675 WebP + 1200×1200 + 1200×900 türevleri.
- Dosya adı kalıbı tech-insider gibi: `<slug>-1344.webp` (okunur, SEO dostu).
- Tüm `img` için width/height, kart thumb’ları `aspect-ratio:16/9`.
- Kontrast: mevcut tokenlar (`--ink #37474f` beyazda 9.9:1, `--accent #007bff` beyazda 3.98:1 → **gövde linkleri için `--focus #004a7f` veya altı çizili koyu mavi kullan**, aksi halde a11y < 100).
- `lang="en"`, skip-link, landmark’lar, tap target ≥44 px, `<time datetime>`.

### 8.3 Reklam ile 100 çelişkisi — **karar: C (ilk 3 ay reklamsız)**
AdSense yüklendiğinde Best Practices üçüncü-taraf çerez/konsol uyarıları nedeniyle düşüyor (INFRA-STATUS: ana sitede BP ~75), TBT de artabiliyor. Seçenekler:
- **A (önerilen):** News’te reklam scripti **ilk kullanıcı etkileşiminde** (scroll/pointerdown/keydown) yüklenir. Lab Lighthouse 100/100/100/100; gerçek kullanıcıda reklam gösterimi neredeyse aynı (okuyucu zaten kaydırır). Slotlar min-height’lı rezerve, CLS 0.
- B: Ana sitedeki idle-loader aynen → Performance ~95–99, BP ~75.
- C: News’te reklam yok (ilk 3 ay, Google News kabulüne kadar) → kesin 100.

### 8.4 Sürekli ölçüm
`@lhci/cli` ile `pnpm news:lighthouse`: `/news/`, bir makale, bir kategori; mobil preset; assert tüm kategoriler `>=1` (minScore 1.0), 3 koşu medyanı. Deploy kapısına eklenir (`smoke:lighthouse` ile aynı yer).

---

## 9. Google News uygunluğu ve E-E-A-T

### 9.1 Zorunlu güven yüzeyi (yayından önce)
- Her makalede görünür byline (yazar sayfasına link), görünür yayın ve güncelleme tarihi/saati (ET), dateline.
- Yazar sayfaları: gerçek kişi, gerçek foto, bio, iletişim; uydurma kimlik/yetkinlik **yok** (SEO-HARITASI §07 l.2148).
- About News, Editorial Policy (kaynak kullanımı, AI kullanımı beyanı, düzeltme süreci), Corrections Policy, Masthead, Contact.
- Organization JSON-LD’de bu sayfalara `publishingPrinciples` vb. referansları.
- Reklam/sponsor ayrımı (mevcut `/page/disclosure/`).

### 9.2 İçerik kalitesi (SEO-HARITASI §02/§08)
- Her haberde ≥1 birincil kaynak (OPM, eyalet meclisi, okul bölgesi duyurusu, NASA vb.) Sources’ta ve metinde link.
- Yasaklı AI kalıpları listesi (l.603–612) `news:verify` içinde lint kuralı olarak uyarı üretir (delve, tapestry, pivotal, seamless, “in today’s digital world”…).
- Başlıkta yıl/tarih yalnızca doğruysa; clickbait yok; başlık ↔ H1 ↔ `news:title` tutarlı.
- Toplu üretim yok: §03 kuralı — ilk 4 hafta haftada 3–5 haber, index oranı ve sorgu sayısı 2 hafta düşerse yavaşla.

### 9.3 Kayıt ve izleme
- Google Search Console: `/news/sitemap.xml` + `/news/news-sitemap.xml` gönder; “News” performans filtresini takip et.
- Google Publisher Center: yayın profili (ad, logo, `/news/` bölümü, feed). Google News 2019’dan beri otomatik keşif yapıyor; Publisher Center marka/bölüm kontrolü için.
- Bing Webmaster + IndexNow (mevcut anahtar `freshcalendars-indexnow-2026.txt`) → publish’te ping. Google IndexNow kullanmıyor; sitemap ping endpoint’i 2023’te kaldırıldı → yalnızca sitemap.
- Haftalık rapor: indexlenen haber sayısı, Discover gösterimi, News sekmesi tıklaması, ortalama indexlenme süresi (publish → ilk gösterim).

---

## 10. Görev listesi (fazlar, kabul kriterleri)

### Faz N0 — Koruma ve kararlar (0.5 gün)
- **N0.1** `deploy.sh` ve `server-cron.sh deploy_site` rsync’lerine `--exclude 'news/'`. ✅ Kabul: dry-run’da `news/` silme yok.
- **N0.2** ✔ Karar (2026-10-18): **C — ilk 3 ay reklamsız** (lansmandan itibaren). Reklam slot bileşeni yazılır ama render edilmez; 3. ay sonunda A (etkileşimde yükleme) yeniden değerlendirilir.
- **N0.3** ✔ Karar (2026-10-18): şimdilik kurumsal byline **“Fresh Calendars News Desk”** (JSON-LD `author` = `Organization` `#newsdesk`, `/news/author/news-desk/` sayfası, editoryal politika linki). Gerçek yazarlar sonra `authors` koleksiyonuna eklenir; şema `author` için Person | Organization destekler.
- **N0.4** `BLUEPRINT-A-Z.md` §0/§18 ve `SEO-HARITASI` istisnası (news’te tarih/byline zorunlu) güncellenir.

### Faz N1 — İskelet ve tema (1.5 gün)
- **N1.1** `apps/news` Astro 5 projesi, `base:'/news'`, `trailingSlash:'always'`, `format:'directory'`, `outDir: dist/news`.
- **N1.2** `packages/site-chrome` ayrıştırma; generator onu import eder (çıktı birebir aynı → `dist/site` diff boş olmalı).
- **N1.3** `NewsBase.astro`: head, header (News linki aktif), footer, fontlar, skip-link.
- ✅ Kabul: `/news/` boş sayfa ana siteyle görsel olarak aynı chrome; `pnpm fc gen-meta` çıktısı değişmedi (yalnızca nav linki).
- ✔ **Yapıldı (2026-10-18):** `packages/site-chrome` (esc, ADS/ADSENSE_JS, FONTS_CSS/FONT_PRELOAD, CSS, NAV_JS, header/footer, brandHeadLinks) — generator buradan import ediyor; `refresh-meta` öncesi/sonrası 105 HTML sayfası **byte-byte aynı**. Header/footer `opts.news` ile News linki (takvim sitesinde lansmana kadar kapalı). `apps/news` Astro 5.18 (`base:/news`, `trailingSlash:always`, `format:directory`, `inlineStylesheets:always`, outDir `dist/news`), `NewsBase.astro`, `/news/` iskelet sayfası; `pnpm news:build` / `news:dev`.
- ⚠ Not: Astro boş içerik deposu için `dist/news/content-assets.mjs` ve `content-modules.mjs` üretiyor → N7.1 deploy’da `--exclude '*.mjs'` (veya N2 sonrası tekrar kontrol).

### Faz N2 — İçerik modeli (1 gün)
- **N2.1** `content.config.ts` zod şemaları (§4), referans bütünlüğü.
- **N2.2** 1 yazar, 7 kategori, 3 örnek makale (news/explainer/update).
- ✅ Kabul: şema ihlali build’i kırar (eksik alt, 160+ description vb.).
- ✔ **Yapıldı (2026-10-18):** `apps/news/src/content.config.ts` (articles/authors/categories, glob loader, id = dosya adı), `src/lib/articles.ts` `getPublishedArticles()` — prod’da draft ve ileri tarihli (zamanlanmış) yazılar dışarıda, `NEWS_INCLUDE_DRAFTS=1` veya dev’de taslaklar görünür; slug kebab, hero ≥1600 px ve referans varlığı (category/authors/related) her build’de kontrol edilir (Astro `image()` genişliği ve `reference()` varlığı şema aşamasında doğrulanamıyor). İçerik: `news-desk` (Organization), 7 kategori (≥80 kelime), 3 örnek **taslak** (news / explainer / update+correction) + yer tutucu hero’lar. `apps/news/test/schema-negative.sh`: 7 bozuk-içerik vakası build’i kırıyor (7/7 ok).

### Faz N3 — Makale şablonu (2 gün)
- **N3.1** Bileşenler: Breadcrumb, ArticleMeta, Hero (Picture), KeyPoints, Toc, Prose, Faq, Sources, Corrections, AuthorCard, RelatedGrid, AdSlot.
- **N3.2** Okuma süresi (225 wpm), wordCount.
- **N3.3** `seo.ts` head + `@graph` (§1.2, §1.3), birim testleri.
- **N3.4** Related: aynı kategori + keyword örtüşmesi, 3 kart.
- ✅ Kabul: Rich Results Test’te Article geçerli, uyarı yok; head alanları §1.2 listesiyle %100 eşleşir.
- ✔ **Yapıldı (2026-10-18):** `src/pages/[slug]/index.astro` + bileşenler (Breadcrumb görünür, ArticleMeta ET saatli byline/yayın/güncelleme/okuma süresi, Hero `<Picture>` AVIF+WebP 400–1600w eager/high, KeyPoints, Toc `<details>` (≥3 H2), Faq `<details>` (FAQPage yok), Sources, Corrections, CalendarLinks, AuthorCard, RelatedGrid lazy WebP, AdSlot `NEWS_ADS=1` olmadan boş). `lib/seo.ts`: head etiketleri + `@graph` (Organization/WebSite/ImageObject/BreadcrumbList sayısal pozisyon/WebPage/author/NewsArticle·BackgroundNewsArticle·AnalysisNewsArticle, 3 crop 1200×675/900/1200, wordCount, timeRequired); henüz yayında olmayan güven sayfalarına link verilmez (`TRUST_PAGES`). Görsel dosya adları slug’dan (`<slug>.<hash>.webp`). News sayfaları yalnız Sora + Source Sans 3 (3 preload). Astro build artıkları (`*.mjs`, `collections/`) integration ile siliniyor. Testler: `apps/news/test/*.test.ts` (12) kök `pnpm test`’e bağlı; `pnpm news:schema-test`. Makale HTML’i ~13 KB gzip.
- ⚠ Rich Results Test canlı URL ister → N9’da yapılır. Kategori ve yazar linkleri N4’e kadar 404.

### Faz N4 — Listeler (1 gün)
- **N4.1** `/news/`, `/news/page/n/`, kategori (+sayfalama), yazar sayfaları; sayfa başı 20.
- **N4.2** CollectionPage/ItemList/ProfilePage JSON-LD.
- ✅ Kabul: tüm makalelere ≤3 tıkta erişim, yetim sayfa yok.
- ✔ **Yapıldı (2026-10-18):** `/news/` (öne çıkan eager kart + liste, kategori çipleri, News Desk byline linki), `/news/page/N/`, `/news/category/<id>/` (+`page/N/`; kısa intro üstte, ≥80 kelimelik açıklama listenin altında “About this section”), `/news/author/<id>/` (+`page/N/`, ProfilePage). Boş kategoriler üretilmez (ince sayfa yok); yazar sayfaları her zaman üretilir (byline linkleri çözülsün). Sayfa 1 = taban yol, `/page/1/` yok; sayfa 2+ başlık/açıklama/breadcrumb’da “Page N”. `lib/listing.ts` (paginate, `NEWS_PER_PAGE` test override), `listingGraph` (CollectionPage/ProfilePage + ItemList + BreadcrumbList). `pnpm news:links`: kırık iç link, tek H1, yetim ve derinlik (>3, `/page/N/` arşivleri hariç) kontrolü — prod (0 makale), taslaklı ve 1’er sayfalık build’lerde 0 sorun. Testler 35/35.

### Faz N5 — Sitemap, feed, robots (1 gün)
- **N5.1** index + post + category + author + page sitemap’leri, XSL.
- **N5.2** News sitemap (48 saat, ≤1000, boşken geçerli).
- **N5.3** `image:image` hero.
- **N5.4** `/news/feed.xml` RSS 2.0 + content:encoded + media:content + dc:creator.
- **N5.5** Sitemap/feed birim testleri (XSD ile doğrulama).
- **N5.6** Generator robots.txt + llms.txt satırları.
- ✅ Kabul: GSC’de “Success”, News sitemap’te yalnızca 48 saatlik öğeler.

### Faz N6 — Performans sertleştirme (1 gün)
- **N6.1** Görsel pipeline (AVIF/WebP, srcset, preload), OG türevleri.
- **N6.2** Font alt kümesi + preload, CSS bütçe kontrolü.
- **N6.3** Reklam yok (karar C); `AdSlot` bileşeni `NEWS_ADS=0` bayrağıyla kapalı, 3. ayda açılırsa etkileşimde yükleyici (A) + min-height.
- **N6.4** Kontrast/link renkleri, a11y düzeltmeleri.
- **N6.5** `pnpm news:lighthouse` (LHCI, minScore 1.0).
- ✅ Kabul: 3 sayfa tipinde mobil 100/100/100/100 (3 koşu medyanı).

### Faz N7 — Deploy ve operasyon (1.5 gün)
- **N7.1** `news:build`, `news:verify`, `news:deploy` script’leri.
- **N7.2** URL bazlı Cloudflare purge + IndexNow ping.
- **N7.3** Cloudflare `/news/*` cache rule (`cf-cache-optimize.sh`).
- **N7.4** nginx `location ^~ /news/` (`hestia-apply-nginx-cache.sh`).
- **N7.5** `.htaccess` news başlıkları (generator).
- **N7.6** Ana sitede Organization/WebSite `@id`.
- **N7.7** `sync-app.sh` → `apps/news`; VPS cron `FC_JOB=news-publish` her 15 dk (yeni/48 saat penceresi değiştiyse build+deploy); `cron_runs` loglama; health job’a “news sitemap 48 saatte en az 1 öğe” kontrolü (yayın varsa).
- **N7.8** Smoke: `/news/`, örnek makale 200, `cf-cache-status`, header’lar, `/news/page/2/` redirect yok.
- ✅ Kabul: takvim cron’u çalıştıktan sonra `/news/` hâlâ yerinde; yeni makale publish → ≤10 dk içinde canlı ve sitemap’te.

### Faz N8 — Güven sayfaları ve iç link (1 gün)
- **N8.1** About News, Editorial Policy, Corrections, Masthead.
- **N8.2** `/when-is/*` sayfalarına “Latest news” kutusu (generator, `latest.json`).
- **N8.3** Footer’a News, Editorial Policy linkleri.

### Faz N9 — Lansman (0.5 gün + izleme)
- **N9.1** İlk 10 gerçek haber (kaynaklı, editör kontrollü).
- **N9.2** GSC sitemap gönderimi, Publisher Center profili, Bing.
- **N9.3** 4 hafta izleme raporu (§9.3); §03 durdurma kuralı.

**Toplam:** ~11 iş günü (N0–N8), lansman + izleme ayrı.

---

## 11. Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Takvim deploy’u `news/`’i siler | Bölüm kaybolur | N0.1 ilk iş; smoke kontrolü |
| 31 günlük edge cache | Haber güncellenmez | N7.3 ayrı cache rule + URL purge |
| Yeni alt klasörün site geneli sınıflandırıcıyı aşağı çekmesi (SEO-HARITASI l.857) | Takvim trafiği düşer | Düşük hız, gerçek kaynak, konu odağı, durdurma kuralı |
| AI üretimi izlenimi | Google News reddi / helpful content | Yasaklı kalıp lint’i, kaynak zorunluluğu, gerçek yazar |
| AdSense ile 100 skor | Hedef kaçar | §8.3 karar |
| Tema iki yerde ayrışır | Marka tutarsızlığı | `packages/site-chrome` tek kaynak |
| Kanibalizasyon (when-is vs haber) | İki sayfa aynı sorguda | Haber = olay/değişiklik, when-is = evergreen tarih; haber when-is’e link verir, tersi “latest news” |

---

## 12. Sonraki fazlar (opsiyonel)
- UK/CA yerel haber bölümleri (`/news/uk/`, hreflang en-GB/en-CA) — tech-insider’ın `ca-post-sitemap` modeli.
- Git tabanlı CMS (Keystatic/Decap) editör arayüzü.
- Web Stories (Discover), newsletter.
- Takvim + haber birleşik arama.

## 13. Açık kararlar
1. ~~Reklam stratejisi~~ → C seçildi (2026-10-18).
2. ~~Yazar kimliği~~ → “Fresh Calendars News Desk” (2026-10-18), gerçek yazarlar sonra.
3. AI crawler politikası (tech-insider gibi Content-Signal + blok listesi mi, mevcut “Allow all” mı).
4. Zamanlanmış yayın Faz 1’de mi (VPS build) yoksa yalnızca Mac’ten manuel deploy mu.
