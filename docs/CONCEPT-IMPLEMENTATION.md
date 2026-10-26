# Son görsel referansın uygulanması

Referans: kullanıcının son gönderdiği beş panelli `codex-clipboard-ea3885d4-d433-477b-8a05-0c4cb9189200.png`. Yerel kopya: `output/design-audit/reference-final-concept.png`. Bu uygulama, önceki renk ve genel görünüm çalışmasının yerine geçer.

En son hata taraması: [26 Ekim CSS/JavaScript yüzey denetimi](FRONTEND-SURFACE-AUDIT.md). Dört genişlik ve iki görünümde 2.440 sayfa açılışı, 1.329 etkileşim kontrolü ve düzeltilen hataların kaydı bu rapordadır.

Güncel içerik tabanı: [canlı/yerel haber eşitlemesi](NEWS-LOCAL-SYNC.md). Yayındaki 192 haberin metin, kapak, sıralama ve indirmeleri eşitlenmiştir; önceki 305 sayfalık kontrol tarihsel kayıttır.

## Ekran eşlemesi

| Referans ayrıntısı | Uygulama |
|---|---|
| Küçük üst menü, logo, arama, dil göstergesi, görünüm düğmesi | Ortak site-chrome; altı ana gezinme öğesi, açılır alt menüler, bağımsız arama, EN bilgisi ve kalıcı açık/koyu görünüm tercihi |
| Ana sayfada fotoğraf, iki satır başlık, büyük arama | `homeConceptHero`; aynı yerleşim ve fotoğraf üzerinden çalışan gerçek HTML araması |
| Yedi renkli kategori kutusu | Yearly, Monthly, Holiday, Planner, School, News ve All Tools; ayrı ikonlar ve gerçek hedefler |
| Fotoğraftaki takvim ve el yazısı | Tarihler gerçek tarih motorundan; fotoğrafa yanlış tarih yazdırılmaz. El yazısı HTML'dir. |
| Popular Printable Calendars rafı | Altı görünür kart, yıl/kategori filtreleri, sağa kaydırma ve PDF/PNG bağlantıları |
| Sol menülü takvim kütüphanesi | `/monthly-calendars/` ve `/calendars/`; üç sütunlu kartlar, yıl/ay/tasarım/kâğıt/başlangıç filtreleri, arama ve sıfırlama |
| 2026–2030 yıl seçimi | Beş yılın gerçek indirilebilir dosyaları oluşturulur; boş yıl bağlantısı bulunmaz |
| İndirme ayrıntı sayfası | Büyük sol önizleme, önceki/sonraki tasarım, küçük görseller, tasarım etiketleri, sağ seçim paneli ve fayda şeridi |
| A4 / Letter, PDF / PNG, Sunday / Monday | Seçim ile hem görsel hem dosya adresi değişir; PDF sayfa ölçüleri gerçek A4/Letter'dır |
| Favori, paylaşım, baskı | Cihazda kalıcı favori; Web Share/bağlantı kopyalama; seçilen PDF'yi baskı için açma |
| Haber ana sayfası | Açık renk fotoğraf başlığı, kategori hapları, fotoğraf üzerine manşet, dört küçük görselli haber ve beş sıralı kart |
| Haber yazısı | Kompakt başlık, gerçek yazar avatarı, üstte paylaşım, büyük görsel; sağda numaralı içindekiler ve ilgili haberler |

Haber başlıkları, yazarları, tarihleri, kapakları ve indirmeleri yayımlanmış içerik kaynağından alınır. Web kartında ve haber yazısında doğrudan yazının `hero.src` kapağı kullanılır; alternatif kaynak fotoğrafı veya özel manşet kapağı seçilmez. Manşet ve sonraki haberler canlıdaki tarih sırasını izler; mevcut lisans/atıf bilgileri korunur. Dil göstergesi mevcut İngilizce yayını belirtir; olmayan çeviriler sunulmaz.

## Tüm sayfa aileleri ve son kontrol — 26 Ekim 2026

Güncel yerel üretimde **19 sayfa ailesi, 305 HTML sayfası** var. Bunların 303 tanesi içerik sayfası, ikisi ayrı 404 şablonudur. Google sahiplik doğrulama dosyası, XML/JSON beslemeleri ve API uçları görsel sayfa değildir. Önceki canlı envanterdeki hiçbir adres kapsam dışında kalmadı; eski PDF/PNG bağlantılarının kaybolmadığı doğrulandı.

| Sayfa ailesi | Adet |
|---|---:|
| Ana sayfa | 1 |
| Takvim 404 | 1 |
| Takvim ayrıntıları | 19 |
| Tarih araçları | 1 |
| Takvim kütüphaneleri | 2 |
| Ülke tatil listeleri | 3 |
| Planlama ve baskı rehberleri | 6 |
| Haber ana sayfası | 1 |
| Haber yazıları | 163 |
| Haber 404 | 1 |
| Haber politikaları | 4 |
| Yazar profilleri ve arşivleri | 10 |
| Haber kategorileri | 14 |
| Haber arşivi | 8 |
| Haber baskı kütüphanesi | 1 |
| Konu merkezleri | 6 |
| Kurumsal ve yasal sayfalar | 5 |
| İletişim | 1 |
| Tatil tarihleri | 58 |

Kalan iç sayfalar da aynı yapıya taşındı:

- `packages/site-chrome/src/page-shell.ts` ve `inner-design.ts`: ortak sol gezinme, kompakt başlıklar, bölüm bağlantıları, metin/tablo düzenleri, iletişim ve hata sayfaları; ortak alt menü.
- `packages/generator/src/sitePages.ts`: ülke tatil filtreleri, gerçek tarihlerden oluşturulan indirilebilir ICS etkinlikleri, rehberler, politikalar, iletişim ve 404. İlk ekrandaki reklam bandı bu okuma sayfalarında içerik sonuna taşınır; reklam birimleri korunur.
- `apps/news/src/components/NewsRail.astro`, `ListingView.astro`, `AuthorListing.astro`, `PolicyPage.astro` ve `Pagination.astro`: haber dizini, kategori/konu arşivleri, yazar profilleri, yayın ilkeleri, arama ve gerçek sayfalama bağlantıları.
- `apps/news/src/pages/printables/index.astro`: her haberin altında boş sütunlar bırakmak yerine tüm şablonları kapsayan üç sütunlu kart ızgarası; konu/kelime filtreleri, sıfırlama, kaynak haber ve dosya bağlantıları.
- `packages/site-chrome/src/studio-client.ts`: Pazartesi sayfasında doğru varsayılan başlangıç, yıllık kütüphaneden doğru yıl/tasarım aktarımı, tarihsiz şablonlarda yıl alanının gizlenmesi. Görünüm tercihi ilk boyamadan önce uygulanır.
- `server/php/admin/admin.css` ve yönetimin üç HTML şablonu: ortak renk ve yazı düzeni. **Yetkilendirme ve veritabanı mantığı değiştirilmedi.**
- `packages/templates/og.html` ve `packages/generator/src/brandIcons.ts`: paylaşım kartları ve site simgeleri için uyumlu renkler ve yazılar.

### Son doğrulama

- `current-layout-qa.log` / `local-qa.json`: **610 ekran kontrolü**, sıfır kapsam/H1/yerleşim/taşma/JavaScript sorunu; önceki indirme bağlantıları korunuyor.
- `current-concept-qa.log` / `concept-qa.json`: **60 kontrol**, gerçek A4/Letter ölçüleri, yedi tasarım, 2030 seçimi, PDF/PNG, arama, favori, görünüm ve artık yıl hesabı.
- `current-inner-qa.log` / `inner-pages-qa.json`: **41 kontrol**, tatil araması/sıfırlama/ICS, tarihsiz şablonlar, yıllık seçim aktarımı, haber filtreleri, sayfalama ve iki 404.
- `current-light-contrast.log` ve `current-dark-contrast.log`: tüm **303 içerik sayfasında** telefon/masaüstü, örnek hover/focus durumları; metin kontrastı taramasında WCAG AA altı bulunmadı.
- `current-tests.log`: **68/68 test**.
- `current-verify.log`: takvim üreticisi **96 sayfa**, sıfır sorun.
- `current-news-verify.log`: haber bölümü **207 sayfa ve 8 XML**, sıfır sorun.
- `current-seo-audit.log`: **64/64 kontrol geçti**. Tek bilgilendirme uyarısı, eski haber kapaklarında benzer görsellere sahip 39 çift; mevcut içerik görsellerine ilişkin bu uyarı raporda korunuyor.
- `current-admin-lint.log`: üç PHP şablonunun sözdizimi temiz. Yönetim giriş ekranı, gerçek HTML/CSS'ten hazırlanan yerel statik önizlemeyle görüntülendi. **Gerçek oturum açma, veritabanı ve zamanlanmış işleri çalıştırma sınanmadı.**

İletişim başarı/hata durumları yalnızca yerelde taklit edilen yanıtlarla sınandı; hiçbir mesaj gönderilmedi. Bu aşamada çalışma yerelde sürdürüldü; canlıya yayın veya push yapılmadı.

[Tüm adresler ve kapsam kaydı](../output/design-audit/design-coverage.md) · [Masaüstü/telefon görsel galerisi](../output/design-audit/all-pages-review.html) · [24 ekranın ortak görünümü](../output/design-audit/all-page-families.png)

## Takvim dosyaları

`packages/generator/src/studio.ts` tarih motorunu ve mevcut baskı şablonlarını kullanır. Yeni Classic (mevsim görselli) ve Floral tasarımları gerçek metin/tablo olarak PDF'ye çizilir. Eski tasarımlar ve eski indirme adresleri korunur.

Beş yıl × 12 ay × yedi tasarım × iki başlangıç günü × iki kâğıt boyutu = 1.680 aylık indirme seçeneği. Her seçenek için PDF, PNG ve hafif WebP önizleme bulunur: 5.040 dosya. Yıllık minimal/floral ve mevcut yıllık tasarımların A4/Letter dosyaları ayrıca üretilir. İlk üretimden sonra mevcut dosyalar önbellekten kullanılır; yıllık geçişte yeni planlama yılı eklenir.

US Letter: 612 × 792 PDF point. A4: 595.276 × 841.89 PDF point. Landscape tasarımlarda yön çevrilir. A4 dönüşümü sayfaları rasterleştirmez; PDF metni korunur. PNG dosyası aynı sayfa oranına yerleştirilir.

Yeni mevsim fotoğrafları yerleşik image_gen ile üretildi. Dosyalar ve tam istemler `brand/design/SCENES.md` içinde kayıtlıdır. Takvim tarihleri görsel üretim aracına bırakılmaz.

## Kaynak konumları

- `packages/site-chrome/src/design.ts`: ölçüler, tipografi, renkler ve responsive düzen.
- `packages/site-chrome/src/icons.ts`: ortak çizgi ikonları.
- `packages/site-chrome/src/search.ts`: bağımsız üst menü ve ana sayfa aramaları.
- `packages/site-chrome/src/studio-client.ts`: filtreler, seçenekler, görünüm, favori ve tarih araçları.
- `packages/generator/src/conceptPages.ts`: ana sayfa, raf, kütüphane ve indirme paneli.
- `packages/generator/src/studio.ts`: gerçek baskı dosyaları ve önizlemeler.
- `packages/generator/src/gen.ts`: normal üretime entegrasyon.
- `apps/news/src/components/HomeView.astro`, `NewsBar.astro`, `ArticleMeta.astro`, `ArticleAside.astro`: haber ekranları.
- `apps/news/src/lib/images.ts`: lisanslı temiz fotoğraf seçimi.

## Doğrulama kayıtları

- `concept-tests.log`: mevcut 68 test.
- `concept-qa.json`: 60 işlev/ekran kontrolü; dosya ölçüleri, seçimlerin aktarılması, favori, görünüm, arama, filtre ve artık yıl hesabı dahil.
- `concept-assets.json`: 5.040 aylık dosyanın varlık ve boş olmama kontrolü.
- `local-qa.json`: tüm üretilen içerik ve hata sayfalarında 390px/1440px render, H1, taşma ve önceki indirme bağlantılarının korunması.
- `concept-contrast.log`: tüm içerik sayfalarında açık görünüm metin kontrastı; telefon ve masaüstü.
- `concept-verify.log`: takvim üreticisinin SEO/dosya kontrolü.
- `concept-news-verify.log`: haber sayfaları, dosyalar ve bağlantılar.

Kayıtlar `output/design-audit/` altındadır. Kontroller yerel önizlemeye aittir; canlıya yayın veya push yapılmadı.

Yerel önizleme sunucusu tasarım değişikliklerini saklamaması için `no-store` kullanır. Üretim önbellek başlıklarını özel olarak sınamak gerekirse `PREVIEW_CACHE=1` ile başlatılabilir.
