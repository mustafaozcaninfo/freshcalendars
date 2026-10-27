# Canlı haber tabanının yerele eşitlenmesi — 26 Ekim 2026

Tasarım dalındaki içerik, canlıda yayımlanan **`72bd449`** sürümüne eşitlendi. Son kontrol: **192 canlı haber / 192 yerel haber**, eksik/fazla haber **0**. Önceki 163 haberlik yerel kopyaya **29 haber** eklendi; **11 mevcut haber** güncellendi.

## Eşitlenen alanlar

- Haber Markdown dosyaları, kategori/yazar/politika içerikleri ve orijinal kapaklar.
- PDF/PNG/WebP dosyaları dahil yayınlanmış haber indirmeleri ve önizlemeleri.
- KEY_DATES tarih verisi; yerel JavaScript düzeltmeleri korunarak yalnız veri dizisi güncellendi.
- Ana manşet ve sonraki dört haberin sırası: canlıdaki `page.items` tarih sırası. Sabit Kasım manşeti ve bulmaca kategorisi filtresi kaldırıldı.
- Kapak seçimi: her yerde doğrudan yazının `hero.src` görseli. Yazısız `.source.webp` alternatifi ve özel sonbahar manşet görseli haber sunumundan kaldırıldı. Boyut/kalite dönüşümünden doğan dosya URL'leri tasarımın gerektirdiği ölçülere göre farklı olabilir; orijinal kaynak aynıdır.
- Takvim sayfalarındaki “Latest news / In the news” alanları, yeni haber üretiminin ardından yeniden oluşturuldu.

Ortak site-chrome, takvim üreticisi, yeni haber yerleşimleri, mobil düzen, arama ve önceki hata düzeltmeleri korundu. Tasarım amaçlı `src/assets/design/` ve `public/design/` klasörleri içerik senkronizasyonundan hariç tutuldu. Sayfa üstündeki dekoratif tasarım görselleri haber kapağı olarak kullanılmıyor.

## Doğrulama

- **192/192 haberde** başlık, haber gövdesi, kapak kaynağı, kapak açıklaması, arama kaydı ve PDF/PNG bağlantıları aynı.
- **1593 kaynak dosyası** yayımlanan Git sürümünün SHA-256 değerleriyle aynı. Tarih veri dizisi ayrıca doğrulandı.
- Ana manşet, kapak ve sonraki dört haberin sırası aynı.
- Yeni kümede **338 HTML sayfası**, dört ekran genişliği ve açık/koyu görünüm: **2704 tarayıcı kontrolü**, sıfır hata. **8197 yerel kaynak** kontrol edildi.
- Haber kutuları yeniden oluşturulan **97 takvim/hata sayfasında 776 ek kontrol**: doğru görünüm tercihi, yeni haber bağlantıları, JavaScript ve yatay taşma temiz.
- **1329 etkileşim kontrolü**, 60 konsept kontrolü ve 68 test geçti.
- Haber doğrulaması: **240 sayfa, 8 XML**, sıfır sorun. Takvim doğrulaması: **96 sayfa**.
- Açık/koyu metin kontrastı: **336 içerik sayfasında** telefon/masaüstü temiz.
- Haber SEO denetimi: **63/63** geçti. Yayımlanmış sürümdeki mevcut denetim politikası (yayın yoğunluğunun bilgilendirme uyarısı olması ve büyük harfli marka/özel isimler) üçlü birleştirmeyle alındı; tasarımın arama/tema kontrolleri korundu. Bilgilendirme uyarıları: yoğun yayın haftası ve eski kapak benzerlikleri.

## Kayıtlar

- [Özet](../output/parity-audit/sync-summary.json)
- [192 haberin tek tek karşılaştırması](../output/parity-audit/verified-parity.json)
- [Senkronize dosyalar ve yedek konumu](../output/parity-audit/sync-manifest.json)
- [Haber kutularının ek kontrolü](../output/parity-audit/sync-core-refresh.json)
- [Masaüstü ve telefon galerisi](../output/design-audit/all-pages-review.html)

Canlı HTML ve arama indeksi salt okunur SSH ile alınan yayın dosyalarından karşılaştırıldı. Önbellek atlatma parametreli HTTP isteği Cloudflare tarafından 403 ile engellendi; koruma aşılmadı veya önbellek temizlenmedi. Yetkili sunucu erişiminden alınan yayın dosyaları doğrulamanın kaynağıdır.

## Sonraki yerel çalışmalar

`scripts/sync-news-baseline.py --ref <yayımlanmış-commit>` yalnız yerel içerik/veri katmanını günceller; değiştirdiği dosyaları `.cache/news-sync/` altında yedekler. Çalıştırmadan önce ilgili commit `git fetch origin main` ile yerelde bulunmalıdır. Daha sonraki yayınlarda canlı HTML/indeks karşılaştırma kaydı da yeniden alınmalıdır; `scripts/news-parity-verify.mjs` karşılaştırmayı o kayıt üzerinden yapar.

Bu eşitleme tek bir yayımlanmış sürümü sabitler; canlıda sonradan yayımlanan haberler ayrı güncelleme gerektirir. Yeni tasarımın canlıya aktarılması bu aşamanın kapsamına dahil değildir. **Push, deploy, canlı dosya değişikliği veya yayın tetiklemesi yapılmadı.**
