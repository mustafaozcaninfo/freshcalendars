# Tüm sayfalar ve özellikler — yerel smoke test

26 Ekim 2026 · `codex/design-refresh` · yalnız yerel çalışma.

**Sonuç:** Aşağıdaki kapsamda altı sorun grubu düzeltildi; son doğrulamada açık hata kalmadı. Kontrol sayıları, kapsam sınırları ve doğrulanan kaynakların SHA-256 değerleri [özet JSON'da](../output/design-audit/smoke-summary.json) tutulur.

## Kapsam

Üretilmiş **338 public HTML sayfasının tamamı**, iki 404 şablonu dahil **19 sayfa ailesi** üzerinden denetlendi. Google doğrulama belgesi görsel sayfa değildir. XML, JSON, ICS ve indirme dosyaları bağlantı/veri kontrollerine dahildir. Tam URL envanteri: [tasarım kapsamı](../output/design-audit/design-coverage.md).

Ana sayfa; 19 takvim ayrıntısı; iki takvim kütüphanesi; tarih araçları; üç ülke tatil listesi; 58 tatil tarihi; altı rehber; beş kurumsal/yasal sayfa; iletişim; haber ana sayfası; 192 haber; 12 yazar arşivi; 15 kategori; altı konu merkezi; dokuz arşiv sayfası; dört haber politikası; haber baskı kütüphanesi ve iki hata sayfası kapsamdadır.

## Bu turda düzeltilen sorunlar

| Sorun | Düzeltme |
|---|---|
| Boş aylık, boş yıllık, yıllık ve okul takvimlerinde aynı `classic` kimliği favorilerin karışmasına yol açıyordu. | Tarihsiz/aylık olmayan takvimler gerçek seçili dosya yolu ile kimliklendirilir. Aylık favorilerin mevcut anahtarları korunur. Kaydetme, farklı türe geçiş, geri dönme ve silme sınandı. |
| Kütüphanenin aile/yıl seçimi yan menüde, açıklamada ve ekmek kırıntısında görünmüyordu. | Başlık, açıklama, kategori seçimi, yıl seçimi ve ekmek kırıntısı aynı durumdan güncellenir. 2030 ve her takvim ailesiyle sınandı. |
| Aktif haber menüsünün alt kenarlığı menüyü yaklaşık 1,2px yükseltiyordu; haber mobil menüsünde ayrı yazı boyutu vardı. | Seçili durum ölçüyü değiştirmeyen iç çizgi kullanır. Ortak üst/alt alanın yazı ailesi ve mobil menü boyutu tekleştirildi. Tüm sayfalarda gerçek hesaplanmış stiller karşılaştırıldı. |
| İletişim formu yanıt beklerken ikinci kez gönderilebiliyordu. | Gönderim kilidi, pasif gönder düğmesi ve `aria-busy`; hata/başarı sonrasında tekrar kullanılabilirlik. Çift gönderim, geçici sunucu hatası ve başarılı yeniden deneme yerel yanıtlarla sınandı. |
| Arama kapatıldıktan sonra geciken haber indeksi sonuç kutusunu yeniden açabiliyordu. | Kapatma durumu asenkron yanıt boyunca korunur. Yeni yazılan sorgu aramayı yeniden etkinleştirir. Kontrollü gecikme ve Escape ile regresyon testi eklendi. |
| Haber manşetinin uzun beyaz başlığı, açık renkli takvim kapağı üzerinde yeterince ayrışmıyordu. | Orijinal haber görseli korunarak yalnız metin alanının arkasına koyu geçiş ve üstte yumuşak bir sınır eklendi. Telefon/masaüstü ekranları ve açık/koyu kontrast yeniden kontrol edildi. |

Kaynaklar: `packages/site-chrome/src/search.ts`, `studio-client.ts`, `design.ts`; `packages/generator/src/conceptPages.ts`, `sitePages.ts`; `apps/news/src/layouts/NewsBase.astro`, `apps/news/src/components/HomeView.astro`. Ekran görüntüsü araçları da resmi çözümlenmeden çekim yapmamak üzere güncellendi; URL parçası kontrollerinde Unicode kodlaması ve ekran genişliği değişim olayının tamamlanması hesaba katıldı.

Kontrast tarayıcısı uzun arşiv boyunca biriken sayfa durumunu 40 adreste bir yeni sekmeyle bırakır. Bir açılış zaman aşımında aynı adres temiz sekmede bir kez yeniden denenir; ikinci hata taramayı durdurur. Hiçbir adres atlanmaz ve kontrast eşikleri değiştirilmedi. Son koyu görünüm turu 336 adresin hem masaüstü hem telefon kontrollerini tamamladı.

## Doğrulama kayıtları

| Kontrol | Kapsam ve kanıt |
|---|---|
| Tüm sayfalarda yerleşim | 338 sayfa × 320/768/1024/1440px × açık/koyu görünüm = **2704 tarayıcı kontrolü**. Görünür resimleri yükleme, sayfa sonuna kaydırma, taşma, kaynak yanıtları, konsol ve çalışma zamanı hataları. [Açık](../output/design-audit/surface-browser-light.json), [koyu](../output/design-audit/surface-browser-dark.json). |
| Statik CSS/JS ve bağlantılar | **8197 yerel kaynak**, 12 benzersiz inline betik, 10 CSS bloğu/dosyası; sözdizimi, CSS.supports, JSON, kimlikler, aria/label hedefleri, srcset ve bölüm bağlantıları. [Kayıt](../output/design-audit/surface-static-light.json). |
| Her sayfada ortak davranış/uyum | **7019 kontrol**: üst/alt alan, yazı ve menü ölçüleri, renk, bağlantılar, mobil üst alan, arama, açık/koyu düğmesi, mobil menü/Escape; her liste araması, tatil filtresi, makale paylaşımı, içindekiler ve içerik açılır alanları. [Kayıt](../output/design-audit/feature-smoke.json). |
| Hata ve sınır durumları | **82 kontrol**: kategori/yıl tutarlılığı, favori ayrımı, paylaşım bağlantısı, önizleme okları, artık gün, yaz saati geçişi, negatif/sıfır gün, baskı kategorileri, çift form gönderimi, yeniden deneme, bütün popüler takvim filtreleri, raf kaydırma, klavye kısayolu, gerçek PDF/PNG tarayıcı indirmesi, kapalı depolama, erişilemeyen/geciken haber arama indeksi. [Kayıt](../output/design-audit/feature-edge-smoke.json). |
| Takvimler ve haber araçları | **1329 kontrol**, 18 araçlı haber sayfası, 260 seçim durumu; her takvim ayrıntısında tasarım/kâğıt dosyaları, bozuk favori verisi, modal odağı, menü klavyesi, mobil kaydırma kilidi, üretilen araç çıktıları ve dosyalar. [Kayıt](../output/design-audit/surface-interactions.json). |
| Gerçek indirme dosyaları | **7178 farklı dosya**: 2175 PDF çözümlendi; 2240 PNG ve 2763 WebP'nin biçim/boyut bilgisi okundu. 19 takvim ayrıntısındaki **1984 seçenek durumu** ve bütün statik PDF/PNG/WebP referansları toplandı. Her seçilebilir A4/Letter PDF'sinin tüm sayfalarının kâğıt boyutu denetlendi; yatay baskı yönü kabul edilir. Ayrıca **138 ICS çıktısındaki 206 olayın** başlık/kimlik/tarih ve tüm gün bitiş sınırları denetlendi. [Kayıt](../output/design-audit/download-smoke.json). |
| Konsept/iç sayfa/odak | 60 konsept, 41 iç sayfa ve dokuz geometri/odak/yönetim giriş görünümü kontrolü. [Konsept](../output/design-audit/concept-qa.json), [iç sayfalar](../output/design-audit/inner-pages-qa.json), [odak ve geometri](../output/design-audit/surface-extra.json). |
| Kontrast | 336 içerik sayfasında masaüstü/telefon, açık/koyu görünüm ve yedi örnek sayfada hover/focus. [Açık](../output/design-audit/recheck-contrast-light.log), [koyu](../output/design-audit/recheck-contrast-dark.log). |
| Temel doğrulamalar | 68 birim testi, 96 takvim sayfası, 240 haber sayfası ve sekiz XML; SEO 63/63. Yayın yoğunluğu ve önceden mevcut 39 kapak benzerliği çifti bilgilendirme uyarılarıdır. [Testler](../output/design-audit/recheck-tests.log), [takvim](../output/design-audit/recheck-calendar-verify.log), [haber](../output/design-audit/recheck-news-verify.log), [SEO](../output/design-audit/recheck-seo.log). |
| Haber tabanının korunması | Sabitlenen yayımlanmış `72bd449` sürümü: **192/192 haber**, başlık/gövde/orijinal kapak/indirme/arama kaydı ve manşet sırası aynı; 1593 kaynak dosyası ve tarih verisi hash kontrolü. Bu tur yeni canlı içerik çekilmedi. [Karşılaştırma](../output/parity-audit/verified-parity.json). |

## Sınırlar

Yönetim giriş görünümü 320/768/1440px'te ve PHP kaynakları sözdizimi açısından denetlendi. **Gerçek yönetici girişi, MySQL işlemleri, e-posta teslimi, zamanlanmış yayın işleri ve canlı reklam/analitik servisleri bu yerel statik ortamda çalıştırılmadı.** İletişim sonuçları ve paylaşım API'leri yerel taklitlerle sınandı; dışarıya mesaj gönderilmedi. Gerçek tarayıcı indirmeleri yalnız yerel dosyalara gitti.

Dosya biçimi/ölçü kontrolü, bütün indirme dosyalarının elle görsel incelemesi anlamına gelmez. Sayfa ailelerinin masaüstü/telefon ekran görüntüleri [galeride](../output/design-audit/all-pages-review.html) bulunur.

Push, deploy ve canlı dosya değişikliği yapılmadı.

## Yeniden çalıştırma

Önce `pnpm news:build`, ardından `pnpm fc refresh-meta`; önizleme `node scripts/news-serve.mjs 4324`. Üretim tamamlandıktan sonra, ağır tarayıcı taramalarını sırayla çalıştırın:

```sh
node scripts/feature-edge-smoke.mjs
node scripts/surface-interactions.mjs
node scripts/concept-qa.mjs
node scripts/inner-pages-qa.mjs
node scripts/surface-spotchecks.mjs
node scripts/design-qa.mjs
node scripts/design-review.mjs
node scripts/feature-smoke.mjs
node scripts/surface-audit.mjs
SURFACE_THEME=dark node scripts/surface-audit.mjs
pnpm smoke:contrast
CONTRAST_THEME=dark pnpm smoke:contrast
node scripts/download-smoke.mjs
pnpm test
pnpm fc verify
pnpm news:verify
pnpm news:seo-audit
node scripts/news-parity-verify.mjs
```
