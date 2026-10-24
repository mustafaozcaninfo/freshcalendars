# /news/ — SEO-HARITASI-TAM.md uyum denetimi

Tarih: 2026-10-18 · Kapsam: yerel `dist/news` build’i (17 sayfa, 6 makale) · Komut: `pnpm news:seo-audit` (`scripts/news-seo-audit.mjs`)

Doküman (2.666 satır, bölüm 00–08) baştan sona okundu, 96 kural çıkarıldı. Her kural dört gruptan birine ayrıldı:

| Grup | Kural sayısı | Nasıl denetlendi |
|---|---|---|
| SITE: HTML/şema/link, sayfada ölçülebilir | 40 | Otomatik: `news:seo-audit` (40/40 PASS) + `news:verify` + `news:links` + Lighthouse |
| CONTENT: yazım/editoryal | 25 | Kısmen otomatik (yasaklı kelime, em dash, burstiness, kısaltma, üstünlük iddiası) + tek tek okuma |
| PROCESS: operasyon, dış site, ölçüm | 27 | HTML’de ölçülemez; aşağıda durum ve sorumlu |
| PGC-ONLY: PrintGridCalendar takvim ürünü | 4 | /news/ için geçerli değil (R071–R074) |

## 1. Otomatik denetim sonucu (40/40)

| Kural (doküman satırı) | Sonuç | Kanıt |
|---|---|---|
| Tek H1, başlık hiyerarşisi atlamasız (§01 l.312/315, §08 l.2601) | PASS | 17 sayfada 1 H1; h1→h2→h3 atlama yok |
| İçerik ve linkler SSR, gerçek `<a href>` (§02 C l.659) | PASS | JS kapalı HTML’de tüm metin; ≤2 inline script, harici bundle yok |
| Canonical / robots / sitemap (§02 C l.660–661) | PASS | Self canonical; `index, follow, max-image-preview:large`; indexlenebilir her sayfa sitemap’te, noindex olan yok |
| Reklam ana içerikte / ekran üstünde değil (§01 l.214, l.314) | PASS | Karar C: reklam kapalı, `<main>` içinde reklam işaretlemesi yok |
| Görseller: alt + width + height, LCP eager/high (§02 C, §01 SOP) | PASS | Kart görsellerine boş alt yerine hero alt’ı verildi (bu denetimde düzeltildi) |
| Görünür breadcrumb = BreadcrumbList (§01, §08) | PASS | Tüm alt sayfalarda |
| Builder/AI izi yok: generator meta, placeholder, Lorem (§02 C l.626, l.492) | PASS | — |
| Yasaklı İngilizce kelimeler, l.603 tam liste (§02 B) | PASS | 6 makale + politika sayfaları, 45 kalıp |
| Em dash aşırı kullanımı (l.605) | PASS | Makale düzyazısında 0–1 (kaynak listesi ayırıcısı “—” → parantezli atfa çevrildi) |
| “Not X but Y”, “not only… but also”, kalıp kapanışlar (l.606–608) | PASS | — |
| Cümle uzunluğu çeşitliliği / burstiness (l.611, l.656) | PASS | Her makalede CV ≥ 0.35 |
| Kısaltmalar ilk kullanımda açılmış (§08 l.2331, l.2609) | PASS | SSA, FERS, OPM, SIFMA, AP-NORC açıldı (bu denetimde düzeltildi) |
| Kanıtlanamayan üstünlük iddiası yok (R036, §06 l.1611) | PASS | “largest since 2023” gibi ifadeler SSA verisine dayalı |
| Şema yalnız görünür içerik: headline = H1, tarih ve yazar sayfada (§01 l.302, §08) | PASS | — |
| FAQPage / QAPage / DiscussionForumPosting / Review yok (§00 l.50, §08 l.2568, l.2619) | PASS | SSS görünür `<details>`, şemasız |
| JSON-LD ISO-8601 tarih, eksiksiz yazar, `inLanguage en-US` (§08 l.2618–2621) | PASS | — |
| Tek Organization varlığı, `sameAs` yalnız doğrulanmış (yok) (§07 l.2148–2159) | PASS | `#organization` 17 sayfada aynı |
| Uydurma uzman/kişi yok (§02 l.2587, §07 l.2148) | PASS | Kurumsal “News Desk” byline, Person düğümü yok |
| Güven sayfaları + Organization linkleri (§07 entity checklist) | PASS | about, editorial-policy, corrections-policy, masthead |
| /news/ istisnası: görünür byline + yayın/güncelleme saati ET + dateline (l.2591 notu) | PASS | — |
| Her haberde ≥1 birincil, linkli kaynak (§02 Who/How/Why) | PASS | SSA, NIST, OPM, Fed, House Clerk, AMS, NASA, GOV.UK… |
| Dış → çekirdek iç link, yetim sayfa yok (§04 l.1041, l.1210) | PASS | Her makale ≥2 takvim sayfasına link; 0 yetim |
| Konu odağı kaynak bağlamı içinde (§04 l.1010–1015) | PASS | 7 takvim/tarih kategorisi |
| Hız: yeni alt klasörde toplu yayın yok (§03 l.758, l.833) | PASS | 6 makale |
| Benzersiz title/description (§03) | PASS | — |
| Sitemap lastmod gerçek düzenlemeye bağlı (§03 l.838) | PASS | `updatedAt ?? publishedAt` |
| Sponsorlu dış link yok / varsa rel=sponsored (§06 l.1622) | PASS | — |
| Lighthouse (DESIGN/BLUEPRINT hedefi) | PASS | 5 sayfa tipi 100/100/100/100 |

## 2. Elle değerlendirilen içerik kuralları

| Kural | Sonuç | Not |
|---|---|---|
| H1 + ilk cümle konuyu tanımlıyor, cevap erkenden (R003, R037) | Uygun | Her makale ilk cümlede tarih/rakamı veriyor |
| Tek merkez parça, metin bölünmüyor (R025, R026) | Uygun | H1 → lede → byline → hero → key points → TOC → gövde; araya widget/reklam girmiyor |
| Özgün insan emeği sinyali (R030, R035) | Uygun | Özgün illüstrasyonlar, hesaplanmış tarih tabloları (2026–2031), kaynak karşılaştırmaları |
| Olgusal bölümde görüş yok (R045) | Uygun | Görüşler yalnız atıfla (AASM, Cotton, Wicker) |
| Modalite A/B/C/D, yapılandırılmış olgu → tablo/liste (R044, R052) | Uygun | Tarih/kapanış/eşik bilgileri tabloda |
| Somut sayı, belirsiz niceleyici yok (R050) | Uygun | Uyarı eşiği aşılmadı |
| Her olgu bağımsız kaynakla doğrulandı (R053) | Uygun | Kaynaklar makale sonunda; araştırma bu oturumda birincil sitelerden yapıldı |
| Hibrit sayfa / UGC bloğu (R056–R058) | Geçerli değil | Kullanıcı içeriği yok, sahte Q&A yok |
| Tek yazar/hakkında sayfası (R070) | Uygun | `/news/author/news-desk/` |
| **İç kanibalizasyon (R066)** | **Düzeltildi** | Thanksgiving ve Veterans Day haber başlıkları `/when-is/` sayfalarıyla aynı “ne zaman” niyetini hedefliyordu. Başlıklar “neden bu tarih” ve “ne açık/kapalı” niyetine çekildi; tarih cevabı when-is sayfalarında kalıyor, haberler oraya link veriyor |
| YMYL için uzman imzası (R054) | **Kısmen** | COLA haberi finansal (YMYL): kaynaklar SSA birincil, ama byline kurumsal. Gerçek, adı belli bir editör eklenince giderilir |

## 3. Süreç kuralları (HTML’de ölçülemez)

| Kural | Durum | Ne gerekiyor |
|---|---|---|
| Durdurma kuralı: index oranı/yeni sorgu 2 hafta düşerse yavaşla (R077) | Açık | GSC’de haftalık takip; bunun için GSC’ye news sitemap’leri gönderilmeli (kullanıcıda) |
| Hız risk çerçevesi, 90 gün/%20–30 hipotez (R075, R076, R079) | Uygun | Günlük 1–3 haber, kalite kontrolü kapasitesine göre |
| GSC verisini karıştırmama, Googlebot DNS doğrulaması (R080–R082) | Henüz geçerli değil | Raporlama başladığında |
| Dış link, Reddit, PBN, site reputation abuse yasakları (R083–R092) | Uygun | Dış faaliyet yok |
| Kırmızı çizgiler: aldatıcı yönlendirme, sahte “free” vaadi (R093–R096) | Uygun | — |
| Politika metinlerinin sahibince onayı | **Açık** | Editorial policy’deki yapay zeka/araç kullanımı ve düzeltme taahhütleri canlıda; okunup onaylanmalı |

## 4. Bu denetimde yapılan düzeltmeler (yerel, henüz canlıda değil)

1. Liste kartlarındaki görsellere boş alt yerine hero alt metni.
2. Kaynak listesi ayırıcısı “—” → “Başlık (Yayıncı, tarih)”.
3. Kısaltmalar açıldı: SSA, FERS, OPM, SIFMA (tablo ve özet), AP-NORC.
4. Kanibalizasyon: Thanksgiving ve Veterans Day başlık/seoTitle/anahtar kelimeleri farklı niyete taşındı.
5. `scripts/news-seo-audit.mjs` + `pnpm news:seo-audit`: kuralların sürekli denetimi (yeni her yazıdan önce çalıştırılmalı).

## 5. Geçerli olmayan kurallar

R071–R074 (araç sayfası rozetleri, “free / no sign up”, düz takvim-araç URL’leri, Letter kâğıt/2027–2028 kapsamı) PrintGridCalendar’ın takvim ürününe özgü. /news/ yalnızca en-US ve Eastern Time ilkesini devralıyor (uygulanmış). Türkçe yasaklı kelime/yapı listeleri (l.615–622) Türkçe metin için; /news/ metni İngilizce olduğu için İngilizce liste uygulandı.

## 6. Ek: benzersiz hero kuralı (2026-10-24)

`12-HERO-UNIQUE` (FAIL): 2026-10-24 ve sonrası yayımlanan her haberin hero'su kendine ait olmalı. İki ölçü: aynı çizim sahnesi (`<slug>.hero.json` kaydı) başka bir haberde kullanılmış olamaz; resmin parmak izi (sağ %60, 256 bit fark hash'i, `scripts/lib/hero-hash.mjs`) başka bir hero'ya 40 bitten yakın olamaz. `pnpm fc news-assets` aynı kontrolü üretim anında yapar ve tekrar eden hero'yu reddeder. `12-HERO-REPEATS` (WARN): eski haberlerde aynı resmi paylaşan çiftler; güncellenirken yeni hero alırlar. Yöntem: `news-visuals` skill'i. Yazım kararları: `news-seo` skill'i.
