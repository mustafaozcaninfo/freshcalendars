# FreshCalendars tasarım uygulaması — 25 Ekim 2026

Güncel uygulama: [son beş panelli referansın ayrıntılı aktarımı](CONCEPT-IMPLEMENTATION.md). Aşağıdaki notlar ilk tasarım geçişinin kaydıdır.

## Referans ve kapsam

Önceki Tasarım Konseptleri Oluşturma sohbetindeki beş panelli görsel esas alındı: beyaz menü, yeşil vurgu, küçük ve düzenli arayüz yazıları, doğa temalı ana sayfa, ayrı haber görünümü. Bu kullanıcı tercihi, eski DESIGN.md belgesindeki mavi üst menü kuralını bu çalışma için değiştirir.

Çalışma dalı: `codex/design-refresh`. Canlıya deploy veya GitHub'a push yapılmadı. Eski PHP site şablonları kullanılmadı. Güncel iletişim API'si ve yönetim kodu değişmedi.

## Ön tarama

Canlı site haritaları ve sayfalardaki iç bağlantılar GET istekleriyle tarandı. 285 benzersiz HTML adresi: 93 takvim/rehber + 192 haber bölümü; hepsi HTTP 200. Özel yönetim/API adresleri ve indirme dosyaları HTML taramasına dahil edilmedi.

Her adres için HTTP sonucu, yönlendirme hedefi, title, H1, H2/H3 başlıkları, HTML sınıfı, canonical, resim sayısı, PDF/PNG bağlantıları ve iç bağlantılar kaydedildi:

- `output/design-audit/live-inventory.json`: tam makine okunur envanter.
- `output/design-audit/live-inventory.md`: adres bazında liste.
- `scripts/design-inventory.py`: yeniden çalıştırılabilir, canlı siteyi değiştirmeyen tarama.

Takvim grupları: ana sayfa; 12 ay; iki yıllık merkez; boş/haftalık/okul/Monday-start rehberleri; US/UK/Canada tatil listeleri; when-is tarih sayfaları; yasal/iletişim ve diğer rehberler. Haber grupları: ana sayfa, yazı, kategori, konu, yazar, sayfalama, indirilebilirler ve yayın politikaları. RSS, sitemap, arama JSON'u ve ICS uçları işlevsel veri çıktıları olarak korundu.

## Uygulama haritası

- `packages/site-chrome/src/design.ts`: ortak kompakt görünüm, beyaz üst menü, yeşil aksan, mobil düzen, takvim galerileri ve sayfa aileleri.
- `packages/site-chrome/src/index.ts`: yeni metin logosu, gruplanmış menüler, ortak arama, klavye desteği ve mevcut ortak iskelet.
- `packages/site-chrome/src/search.ts`: takvim URL'leri + mevcut haber JSON indeksini birleştiren arama. Haber indeksi erişilemezse takvim araması çalışır.
- `packages/generator/src/sitePages.ts`: ana sayfa görseli/kısayolları ve içeriğe atla bağlantısı.
- `packages/generator/src/gen.ts`: tasarım görsellerini yerel üretim çıktısına kopyalama.
- `apps/news/src/layouts/NewsBase.astro`: haber renkleri ve tipografi; ortak aramayı kullanır.
- `apps/news/src/components/HomeView.astro`: editoryal görsel, haber manşeti, haberler ve reklam/takip alanlarının sıralaması.
- `apps/news/src/components/NewsBar.astro`: kategori gezinmesi; arama artık ortak üst menüdedir.
- `apps/news/src/components/ListingView.astro`: kategori/konu ve koleksiyon sayfalarında görselli kart ızgarası; masaüstünde üç, tablette iki, telefonda bir sütun. Yazar profilleri kendi liste düzenini korur. Koleksiyonların ilk altı haberi üst reklamdan önce gelir.
- `apps/news/src/pages/[slug]/index.astro`: haber gövdesi 17px.

Arayüz: Sora başlıklar, Manrope takvim arayüzü, Source Sans 3 haber metni. Masaüstü üst menü 13px; genel gövde 15px; haber gövdesi 17px. Telefonlarda dokunma hedefleri en az 44px olacak şekilde korundu. Küçük yazı için HTML kök boyutu küçültülmedi.

Baskı şablonları, tarih motoru hesapları ve PDF/PNG üretim yöntemi değiştirilmedi. Web görünümü baskı tasarımından ayrıdır. Reklam birimleri korunur; masaüstü header reklamının ayrılmış yüksekliği, mevcut 728×90 formatına göre düzeltilmiştir.

## Renk uyumu güncellemesi

Kullanıcı geri bildirimiyle canlı yeşil, mavi-gri ve parlak sarı vurgular daha sakin bir doğa paletine bağlandı. Ana vurgu orman yeşili `#285e50`, koyu/hover yeşili `#1e493e`, başlık rengi `#233d35`, adaçayı yüzey `#eaf1e8`, sıcak bilgi alanı `#f7f3e9` ve sınırlı kum-altın vurgu `#af9160`. Kategori renkleri de benzer doygunlukta toprak, yeşil, petrol ve mürdüm tonlarına çekildi. Menü, buton, arama, yan kartlar, haber bilgi kutuları ve indirme alanları aynı semantik renk değişkenlerini kullanır. Sosyal platform renkleri ve baskı dosyaları korunur.

## Görseller

İki özgün sahne image_gen ile üretildi. Metinler ve düğmeler görsele gömülmez; gerçek HTML'dir. Fotoğraftaki defter dekoratiftir; gerçek takvim tarihleri mevcut motorun ürettiği önizlemelerdedir.

- `brand/design/planning-lake-v1.webp`: ana sayfa, yaklaşık 140 KB.
- `brand/design/news-desk-v1.webp`: haber ana sayfası, yaklaşık 60 KB.
- `brand/design/PROMPTS.md`: üretimde kullanılan tam istemler.

## Doğrulama

Mevcut 68 test geçti. Takvim ve Astro üretimleri tamamlandı. `news:verify` 192 içerik sayfasında bağlantı/H1/üretim kontrollerini geçti. `smoke:contrast` 285 içerik sayfasında masaüstü/telefon ile örnek hover/focus kontrollerini yaptı; WCAG AA altına düşen metin bulunmadı.

`scripts/design-qa.mjs` üretilen HTML sayfalarını 390px ve 1440px genişlikte açar; H1, yatay taşma, HTTP durumu, canlı URL kapsamı ve önceki PDF/PNG bağlantılarının korunmasını kontrol eder. Masaüstü menüsü, telefon menüsü, Escape tuşu, takvim ve haber araması ayrıca kontrol edilir. Google sahiplik doğrulama dosyası içerik sayfası olmadığı için görsel kontrollerden hariçtir. Sonuçlar `output/design-audit/local-qa.json` dosyasındadır; örnek ekran görüntüleri aynı dizindedir.

Son tam görsel kontrol: iki 404 şablonu dahil 287 HTML sayfasında 574 ekran genişliği kontrolü. Ayrıca 320/768/1024/1280px genişliklerde yedi sayfa ailesi üzerinde 28 ek taşma kontrolü yapıldı. Bilinmeyen ana site adresi ve `/news/page/99/` için yerel HTTP 404 yanıtı doğrulandı.

Sonuçlar yerel statik önizlemeye aittir. Canlı PHP formuna gönderim, reklam sunum geliri veya tüm CDN dosyalarının yeniden üretimi test edilmedi; bu bileşenler değiştirilmedi.

## Yerel önizleme

`node scripts/news-serve.mjs 4324` ile ana site ve haber bölümü aynı kök altında açılır: `http://localhost:4324/` ve `http://localhost:4324/news/`.
