# CSS ve JavaScript yüzey taraması — 26 Ekim 2026

Son ek tarama: [tüm sayfalar ve özelliklerin smoke testi](SMOKE-TEST-REPORT.md). Ortak alanların her sayfada karşılaştırılması, bütün seçilebilir indirme dosyaları, favori ayrımı, kütüphane durumları, çift form gönderimi ve gecikmeli arama yanıtı bu rapordaki kapsamı genişletir.

Yerel kaynaklardan üretilen **338 HTML sayfası**, 320/768/1024/1440 piksel genişlikte ve açık/koyu görünümde toplam **2704 kez** tarayıcıda açıldı. Son taramada CSS/JS, yerel kaynak yükleme, görseller ve yatay taşma için **0 sorun** kaydedildi. Bu sonuç aşağıdaki otomatik kontrollerin kapsamını ifade eder.

İçerik tabanı güncellendi: [192 haberin canlıyla eşitlenmesi](NEWS-LOCAL-SYNC.md). Takvim haber kutularının yenilenmesinden sonra 776 ek görünüm/bağlantı kontrolü yapıldı.

## Bulunan ve düzeltilen hatalar

| Sorun | Düzeltme ve kaynak |
|---|---|
| Favoriler yerel depoda dizi yerine nesne/null/metin içerdiğinde `includes is not a function` hatasıyla takvim kodu duruyordu. | `packages/site-chrome/src/studio-client.ts` kaydı doğrular; yalnız metin anahtarlarından oluşan diziyi kabul eder. Beş bozuk/eski kayıt biçimiyle yeniden yükleme ve kaydetme sınandı. |
| Takvim önizlemesi açıkken Tab arka sayfaya geçiyordu. | `packages/generator/src/sitePages.ts` ve ortak CSS: gerçek modal `dialog`, Tab/Shift+Tab sınırı, Escape, kapatma ve açan öğeye odak/önceki kaydırma kilidi dönüşü. |
| Menü Escape ile kapandığında odak BODY'ye düşüyordu. | `packages/site-chrome/src/index.ts` masaüstünde alt menü başlığına, telefonda menü düğmesine odağı geri verir. |
| Kütüphanede A4 seçimi aylık dışındaki kartların dosyalarını değiştirmiyordu; aile filtrelerinde kâğıt seçimi devre dışı kalıyordu. | `studio-client.ts` ve `conceptPages.ts`: yıllık/boş/haftalık kartların PDF, PNG, önizleme ve ayrıntı bağlantısına seçilen kâğıt boyutu uygulanır. |
| Haber ana sayfasında yaklaşan tarih kartları 320px'te 4px taşıyordu. | `apps/news/src/components/HomeView.astro`: dar ekranda iki sütun, sarmalanan başlık, ayrı gün etiketi. |
| Haber yazılarında 300px reklam kabı 290px yan sütuna konmuştu. | `apps/news/src/pages/[slug]/index.astro`: yan sütun gerçek sabit kabın 300px genişliğiyle eşleştirildi; kabın sütun içinde kaldığı ölçüldü. |
| Bazı araç/paylaşım/indirme kontrolleri soluk yeşil klavye çerçevesi kullanıyordu; koyu görünümde beyaz yüzeylerin odak rengi uyumsuzdu. | Makale, ShareBar ve DownloadGrid odak çerçeveleri `--focus` kullanır. Beyaz kalan ana sayfa araması, kategori kutuları ve önizleme oklarının koyu görünüm odağı ayrı koyu yeşille düzenlendi. Açık/koyu arama kenarlığı ve araç odağı için en az 3:1 kontrast ayrıca ölçüldü. |

## Kontrol kapsamı

- **8197 yerel kaynak**: HTML'nin ve CSS'nin referans verdiği dosyaların varlığı/boş olmaması, tüm srcset adayları, yazı tipleri, CSS/JS/görseller; yerel bağlantılar ve bölüm hedefleri.
- **12 benzersiz çalıştırılabilir inline JavaScript**, **10 CSS bloğu/dosyası**: sözdizimi; JSON, yinelenen kimlikler, eksik aria/label hedefleri. CSS gramerinin şüpheli gördüğü değerler tarayıcının CSS.supports sonucuyla da karşılaştırıldı. Yönetim CSS'i ayrıca ayrıştırıldı.
- **2704 tarayıcı kontrolü**: her sayfanın altına kadar kaydırma, görünür tembel görsellerin yüklenip çözümlenmesi, kırık görseller, HTTP/kaynak hataları, konsol hataları ve yakalanmamış JavaScript istisnaları, yatay taşma. CDN adresleri üretimdeki servise gitmeden yerel dosyalara yönlendirildi.
- **1329 etkileşim kontrolü**: tüm takvim ayrıntı sayfalarındaki tasarım/kâğıt dosyaları; kütüphanenin tüm aileleri; bozuk favoriler, modal ve menü klavyesi, arama, ekran genişliği değişiminde kaydırma kilidi. **18 haber araç sayfası, 260 seçim durumu**; üretilen çıktı ve indirme dosyaları kontrol edildi.
- **9 ek kontrol**: 320px haber yerleşimi, reklam kabı/sütun ölçüsü, gerçek odak renklerinin kontrastı ve üç genişlikte yerel yönetim giriş görünümü.
- Mevcut **60 konsept kontrolü**, **41 iç sayfa kontrolü**, **68 birim testi**, takvim doğrulaması (**96 sayfa**) ve haber doğrulaması (**240 sayfa, 8 XML**) geçti.
- Açık ve koyu görünümde **336 içerik sayfasının** telefon/masaüstü metin kontrastı, örnek hover/focus durumları temiz. Haber SEO kontrolü yayımdaki güncel denetim kurallarıyla **63/63** geçti; yayın yoğunluğu bilgilendirme uyarısı olarak raporlanır. Önceden mevcut eski haber kapaklarının benzerliğine ilişkin 39 çiftlik bilgilendirme uyarısı korunuyor; içerik görselleri bu hata düzeltmesinde değiştirilmedi.
- Yönetimin beş PHP dosyası ve iletişim API'si sözdizimi kontrolünden geçti. Gerçek yetkili yönetim oturumu, veritabanı, e-posta gönderimi ve canlı reklam/analitik servisleri çalıştırılmadı. İletişim formunun başarı/hata kontrolü yerel yanıt taklitleriyle yapıldı.

## Kanıtlar ve yeniden çalıştırma

Tüm sonuçlar [özet JSON](../output/design-audit/surface-summary.json), [açık görünümde sayfa bazlı kayıt](../output/design-audit/surface-browser-light.json), [koyu görünümde sayfa bazlı kayıt](../output/design-audit/surface-browser-dark.json), [statik kaynak raporu](../output/design-audit/surface-static-light.json), [etkileşim kayıtları](../output/design-audit/surface-interactions.json) ve [ek ölçümler](../output/design-audit/surface-extra.json) içinde tutulur. Özet JSON, doğrulanan kaynak dosyalarının SHA-256 değerlerini içerir.

Yerel sunucu 4324 portunda çalışırken `node scripts/surface-audit.mjs`, `SURFACE_THEME=dark node scripts/surface-audit.mjs`, `node scripts/surface-interactions.mjs` ve `node scripts/surface-spotchecks.mjs` ile yeniden çalıştırılabilir. Önce normal takvim/haber üretimi tamamlanmış olmalıdır; bu tarayıcı denetimleri üretimle eşzamanlı çalıştırılmamalıdır.

Çalışma yerelde yapıldı; push/deploy veya canlı dosya değişikliği yapılmadı.
