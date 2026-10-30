# SEO Haritası — Tam Rapor

_Bu dosya 00–08 bölümlerinin birleşimidir; düzenleme ayrı bölüm dosyalarında yapılır, sonra `python3 tools/build-seo-roadmap.py` çalıştırılır. Uygulama statüsü için KANIT-POLITIKASI.md esas alınır._


---

# 00 — SEO Haritası: Ana Dizin

Bu klasör ekibin SEO bakış açısıdır; bundan sonraki tüm projeler bu haritaya göre yürütülür. Kaynak: Koray Tuğberk GÜBÜR × Julian Goldie röportajı ("Google's Ranking Secret? … Visual Semantics", 32:03, https://www.youtube.com/watch?v=Af9rvlVPQCQ). Projede saklanan röportaj metni: [yerel kaynak kaydı](../docs/research/semantic-seo-interview-source.md). Bölümlerdeki satır numaraları tarihsel döküm sürümüne aittir; bu kayıtta yeniden numaralanmış değildir.

Her bölümde aynı yapı var:
- Röportajda söylenenlerin dökümdeki satır numaralarıyla eksiksiz listesi
- Web araştırmasıyla derinleştirme
- Doğrulama tablosu (✅ doğrulandı / ⚠️ kısmen / ❓ doğrulanamadı / ❌ çelişen kanıt)
- Uygulama prosedürü (SOP)
- Proje kontrol listesi
- Riskler
- KPI'lar
- Kaynaklar

## Bölümler

| # | Bölüm | Kapsadığı satırlar | İçindeki araçlar |
|---|---|---|---|
| 01 | [Görsel Semantik ve Sayfa Düzeni](01-gorsel-semantik.md) | 1–55, 163–171 | Görsel semantik SOP'si, centerpiece kontrol listesi |
| 02 | [Özgünlük, AI İmzaları ve AI Tespiti](02-ozgunluk-ai-imzalari.md) | 46–60, 123–171 | EN+TR yasaklı kelime ve yapı listesi, HTML/CSS iz temizleme listesi, AI destekli ekip SOP'si |
| 03 | [Ölçekli İçerik ve Yayın Hızı](03-olcekli-icerik-yayin-hizi.md) | 59–98 | Yayın hızı formülü, `tools/yayin_takvimi.py` |
| 04 | [Topical Map Metodolojisi](04-topical-map.md) | 95–123 | 6 fazlı SOP, karar ağacı, component sütunlu brief şablonu, `tools/sitemap_kapsam.py` |
| 05 | [AI Overviews Çağında Strateji](05-ai-overviews-ucretsiz-araclar.md) | 12–14, 171–190 | 16 sektörlük ücretsiz araç tablosu, Claude promptları, `tools/ai_gorunurluk_analizi.py` |
| 06 | [Link Building, External Topical Map ve AI Konsensüsü](06-link-building-konsensus.md) | 190–218 | External topical map SOP'si, E01–E27 yeni konuşma analizi, sahiplik/kanıt haritası ve ölçüm paneli |
| 07 | [İçerik Dağıtımı (Echo), Entity İnşası, Reddit ve Sosyal Medya](07-icerik-dagitimi-entity.md) | 86–95, 218–293 | 30 platformluk çoğaltma hattı, entity kontrol listesi, kitap EMD planı, Reddit kurala uygun tablo, Instagram hunisi |
| 08 | [Semantik İçerik Yazım Kuralları](08-icerik-yazim-kurallari.md) | 17–20, 163–170, 241–265 | 4 kombinasyon cümle şablonları, sorgu→içerik tipi tablosu, hibrit sayfa + JSON-LD, yazım promptu, yazar QA listesi |

Yeni konuşma eki: Dooley–Gübür dış topical map konuşması, ilk röportajdan ayrı olarak [06. bölümde](06-link-building-konsensus.md) E01–E27 ile işlendi. [Kaynak kaydı](../docs/research/external-topical-map-source-2026-10-17.md). İç araştırma incelemesi: 17 Ekim 2026.

Tek dosyada okumak için: [SEO-HARITASI-TAM.md](SEO-HARITASI-TAM.md).

## PrintGridCalendar uygulama sözleşmesi

İç politika kaydı: 15 Ekim 2026. Röportajın vaka ve yöntem anlatımı korunur. Uygulama kararında [kanıt politikası](KANIT-POLITIKASI.md) ve [iddia kayıtları](../docs/research/semantic-seo-evidence-register.json) esas alınır.

- **Resmi kural:** açık primary belge + ilgili kapsam. Teknik ve yapılandırılmış veri gereklilikleri burada doğrulanır.
- **Araştırma/vaka:** yayın veya uzman gözlemi; sitede aynı mekanizmanın kullanıldığı ya da aynı sonucun alınacağı garanti edilmez.
- **Proje hipotezi:** ilk %2 token, yaklaşık 400 karakter, 90 gün, %20–30 genişleme ve rastgele kadans. Google kabul eşiği olarak uygulanmaz; gerekiyorsa ölçümlü deney olarak kaydedilir.
- **Koşullu seçenek:** gerçek uzman katkısı, sosyal hesap, podcast, kitap, Wikidata veya ayrı tools klasörü ancak gerçek iş ve uygunluk varsa.

Sayfa görevi ve gerçek çıktı ilk ekranda açık olur; tarih/format/kapsam doğrulanır. US/en-US, New York saati, date-only aritmetik, Letter varsayılanı ve 2027/2028 kapsamı korunur. Demo/yanlış meta ve ölü kod temizlenir; çalışan class adları AI gizleme amacıyla zorunlu değiştirilmez. Özgün kredi/lisans bilgisi korunur.

Yayın QA ve talep kanıtıyla planlanır. Yanlış tarih, bozuk araç veya erişilebilirlik sorunu bekletilmez. GSC'nin ayrı ülke/sorgu/sayfa tablolarından birleşik ABD sorgu verisi türetilmez. Eksik veri boş/bilinmiyor kalır. Gerçek kullanıcı katkısı olmayan editöryal FAQ'ya QAPage/DiscussionForumPosting eklenmez.

Güncel uygulama: 98 sayfalık brief ve yerel ölçüm paketi. US filtreli güncel GSC/URL Inspection dış verisi bekleniyor. Durumlar [P1/P2 çalışma raporunda](../outputs/roadmap-p1/rapor.md) izlenir.

## Her projede uygulama sırası

Bölümler bir proje akışında şu sırayla kullanılır.

| Faz | Süre | Ne yapılır | Bölüm |
|---|---|---|---|
| **0. Keşif** | 1. hafta | LLM'lere, AI Overviews'a ve AI Mode'a sorarak kategoride kullanılan özellikleri çıkar (ör. "free", "no sign up"). Ana entity'yi ve iş modelini netleştir. | 05, 06 |
| **1. Topical map** | 1.–3. hafta | ~8 rakibin sitemap'ini çek (`sitemap_kapsam.py`) ve birleşik kapsamı çıkar. Kullanıcı işi/çıktı kapsamını karşılaştır; yüzdeyi resmi hedef sayma. Her sorgu için sayfa/başlık/bölüm/iç link kararını ver. Ticari olarak kapsanamayan konuları bilgilendirici içerikle kapsa. | 04 |
| **2. Brief ve tasarım** | 2.–4. hafta | Brief'te component sütununu doldur. Her sayfa tipinde centerpiece öğesini ve ilk ekranı tasarla. AI tasarımlarından HTML/CSS izlerini temizle. Bilgi tıklarının kaybolduğu yerlere ücretsiz araç planla. | 01, 02, 04, 05 |
| **3. Yazım** | sürekli | Sorgu tipini belirle (olgusal/fikir × yapılandırılmış/yapılandırılmamış). is-a → yüklem → X of Y isteğe bağlı editöryal çerçevedir. Önemli varlıkları erkenden açıkla; yüzde ve zorunlu cümle kalıbı yerine doğru ve doğal yanıtı denetle. Gerekirse hibrit olgusal + uzman/UGC bölümü ekle. | 08, 02, 01 |
| **4. Yayın** | QA kapasitesine göre | QA kapasitesi ve talebe göre yeni yayın partisini planla. `yayin_takvimi.py` iş yükü aracıdır; 90 gün/rastgelelik zorunlu değil. | 03 |
| **5. Dış sinyaller** | 2. aydan itibaren | Doğrulanmış özellik için uygun okur/yayıncı seç. Sahiplik, editöryal kontrol ve kanıt kökenini kaydet; link/mention/claim/citation/öneriyi ayrı ölç. | 06 |
| **6. Echo ve entity** | 2. aydan itibaren | Video → podcast → blog → Reddit → kısa video → e-kitap hattı. IMDb, podcast dizinleri, Goodreads, Wikidata, sameAs ile entity inşası. | 07 |
| **7. Ölçüm** | aylık | Search Console Web + Generative AI raporu, crawl logları (`ai_gorunurluk_analizi.py`), Bing AI raporu, LLM görünürlük paneli. Deney dışı gereksiz değişiklikleri azalt; gerçek kullanıcı hatalarını hemen düzelt. | 05, 01, 03 |

## Doğrulama: ekibin bilmesi gereken düzeltmeler

Röportaj ekibin bakış açısıdır, ama araştırmada bazı iddiaların eksik ya da yanlış olduğu çıktı. Uygulamada aşağıdaki düzeltmelere göre davranılır.

| Röportajdaki iddia | Araştırma sonucu | Bölüm |
|---|---|---|
| API sızıntısında ~22 annotation türü var | ❓ Doğrulanamadı; doğrulanabilen "22" sayısı Google'ın görsel öğeler galerisine ait | 01 |
| DOJ belgelerinde "centerpiece annotation" geçiyor | ⚠️ Kavram gerçek, belgede birebir geçtiği teyit edilemedi. Splitt'in sözü ✅ (Ekim 2021) | 01 |
| audiototext.com'da sadece 3–4 cümle var | ❌ Sitede bugün 20'den fazla soruluk bir SSS var | 01 |
| Bendersky/Najork düzen patenti | ✅ US12393768B2 + LAMPRET (2021) | 01 |
| BrowserStack: 300 bin marka araması, %70 kayıp | ⚠️ Koray başka bir podcast'te aynı vaka için 200 bin diyor; rakamlar bağımsız doğrulanamadı | 03, 02 |
| GeneratePress kullanan siteler ceza aldı | ⚠️ Korelasyon var, nedensellik doğrulanmadı | 02 |
| "AI writer" talebi düşüyor, "humanizer" artıyor | ⚠️ "Humanizer" artışı ✅; "AI writer" düşüşü teyit edilemedi | 02 |
| Yasaklı kelime listeleriyle AI tespiti matematiksel olarak imkânsız hale gelir | ⚠️ Riski azaltır, sıfırlamaz | 02 |
| Sıklık tek başına risk | ⚠️ Mueller'e göre sıklık tek başına sorun değil; risk = hız × (güven + tıklama verisi + özgünlük) | 03 |
| %20, %25–30, %65–70 oranları | ⚠️ Koray'ın pratik eşikleri, Google'ın resmi metrikleri değil | 04 |
| Search Console AI gösterim verisi veriyor | ✅ Haziran 2026'dan beri "Generative AI" raporu var; 31 Ağustos 2026’dan itibaren tüm sitelere açıldı. Yalnızca gösterim veriyor: tıklama, CTR ve sorgu yok | 05 |
| "External topical map" adı James Dooley'den | ✅/⚠️ Yeni röportajda Koray atfeder; terimin evrensel kökenini kanıtlamaz | 06 |
| PageRank bitti; KG API marka güven puanı veriyor | ❌ PageRank devam ediyor; `resultScore` istek koşullarına eşleşmeyi belirtir | 06 |
| Çok domain = çok bağımsız doğrulama | ❌ Aynı sahiplik veya kopya yayın zinciri bağımsız kaynak sayısını göstermez | 06 |
| “Truth range” resmi Google eşiğidir | ❌ Konuşmacının çalışma terimi; evrensel kabul aralığı doğrulanmadı | 06 |
| Kendini öven listicle'lar AI'da işe yarıyor | ⚠️/❌ 2025–2026'da geri tepme belirtileri var (organik ceza, FTC riski) | 06 |
| "Texas'ın en büyük hukuk bürosu" gibi iddialar | 🔴 ABD'de ABA Rule 7.1 ihlali riski taşıyor | 06, 05 |
| Kitabı Google Scholar'a yükle | ❌ Google Scholar yalnızca akademik çalışmaları kabul ediyor | 07 |
| Amazon'da ücretsiz kitap | ⚠️ Fiyat doğrudan 0 $ yapılamıyor; permafree ya da KDP Select ücretsiz günleri gerekiyor | 07 |
| IMDb'ye podcast eklemek | ✅ 2021'den beri mümkün | 07 |
| Reddit: exact-match subreddit + AdsPower ile hesap ısıtma | ❌ Reddit kurallarına aykırı; kurala uygun alternatif bölüm 07'de | 07 |
| AI Overview patenti iki dil türünü birleşik puanlıyor | ⚠️ Söz konusu AIO patentinde (US11769017B1) yok; mekanizma US9002894'te var | 08 |
| eHarmony senior dating sayfasında uzman Q&A bölümü | ✅ Canlı doğrulandı | 08 |
| Endonezya iGaming: ürün sayfası taklidi | 🔴 Spam politikası ve hukuk riski; kaçınılacak sınır | 01 |

## Kırmızı çizgiler

Röportajda anlatılan ama ekibin **uygulamayacağı ya da yalnızca kurala uygun biçimiyle uygulayacağı** taktikler:
1. Aldatıcı e-ticaret taklidiyle başka siteye yönlendirme (iGaming örneği) — uygulanmaz.
2. Sahte, çoklu Reddit/sosyal hesaplar ve antidetect tarayıcıyla hesap ısıtma — uygulanmaz. Bunun yerine şeffaf marka hesapları ve topluluk katılımı (bölüm 07).
3. Kanıtlanamayan üstünlük iddiaları (en büyük, en başarılı) — düzenlemeye tabi sektörlerde yalnızca kanıtlanabilir iddialar kullanılır (bölüm 06).
4. Akademik olmayan içeriği Google Scholar'a göndermek — uygulanmaz.
5. Başkasının alan adı itibarını kullanan doküman platformu alt alan adları — site reputation abuse riskine göre değerlendirilir (bölüm 06).

## Kapsam denetimi

Bu alt bölüm ilk Julian Goldie dökümünün kapsam denetimidir. Yeni Dooley–Gübür konuşmasının kapsamı ayrı E01–E27 tablosu ve kaynak kaydıyla izlenir.

Dökümün 293 satırının tamamı bölümlerdeki satır referanslarıyla karşılaştırıldı. Referanssız kalan satırlar yalnızca şunlar:
- 38–40: Julian'ın "fikirleri nereden buluyorsun" sorusu (cevabı bölüm 01'de)
- 139: Julian'ın "bu geleceği nasıl değiştirir" sorusu (cevabı bölüm 02'de)

Koray'ın içerik açısından söylediği hiçbir şey atlanmadı. Anahtar terimlerin her biri en az bir bölümde işlendi; bunlar arasında:
- Kişi ve kaynaklar: centerpiece, DOJ, Splitt, Bendersky, Dooley
- Marka ve platformlar: ElevenLabs, Lovable, GeneratePress, BrowserStack, AdsPower, Mintlify, IMDb, Goodreads, Scholar, eHarmony, Skool, Instagram, Codex
- Kavram ve örnekler: %2, 6.400 tür, component, motosiklet kargosu, skillsunit, truckcalendar, Filipinos, eSIM, X of Y
- Benzetme ve anekdotlar: Türk polisi, İncil, Friends, doktora, humanizer

Sesten doğrulanması gereken yerler: "with IO" (satır 25), "Vibeaf Shada" (satır 279), satır 286'daki anlaşılmayan kısım.

## Araçlar

Bütün scriptler Python standart kütüphanesiyle çalışır. Örnek kullanım:

```bash
python3 -I tools/yayin_takvimi.py --toplam 5000 --toplam-gun 240 --warmup-gun 0 --haftalik-ozet
```
```bash
python3 -I tools/sitemap_kapsam.py --rakip rakip1=https://rakip1.com/sitemap.xml --rakip rakip2=https://rakip2.com/sitemap.xml -o kapsam.csv
```
```bash
python3 -I tools/ai_gorunurluk_analizi.py --site https://printgridcalendar.com --gsc-csv web.csv --ai-csv ai.csv --log access.log --start 2026-10-08 --end 2026-10-10 --verify-dns --out ai_analiz.csv
```

---

# 01 — Görsel Semantik ve Sayfa Düzeni

> **Uygulama statüsü:** Röportaj alıntısı, vaka/araştırma ve resmi kural ayrı değerlendirilir. Aşağıdaki SOP/checklist proje kabul ölçütü olarak [kanıt politikası](KANIT-POLITIKASI.md) ile birlikte okunur; %2/~400 karakter/90 gün/%20–30/rastgelelik Google zorunluluğu değildir.


> Bu bölüm, Koray Tuğberk GÜBÜR'ün Julian Goldie ile yaptığı röportajın (transkript: `seo-talks-whisper.txt`) görsel semantik (visual semantics) ve sayfa düzeni (layout) ile ilgili tüm iddialarını kapsar; her iddiayı birincil ve ikincil kaynaklarla doğrular ve ekibin her projede uygulayacağı bir SOP'ye dönüştürür. Röportajda özellikle transkriptin ~1–55 ve ~163–171 satır aralığı bu bölümün omurgasıdır.

---

## Röportajda söylenenler (eksiksiz liste)

Aşağıda Koray'ın bu bölüme ait olarak söylediği her iddia, transkript satır numaralarıyla, kendi ifadesiyle (parafraz) listelenmiştir. Hiçbiri atlanmamıştır.

- **Tek sayfadan 0'dan günde 8.000 tıklamaya çıkan bir vaka var; alan adı exact match domain (tam eşleşen alan adı) ve odak "görsel semantik".** Domain `audiototext.com`. (satır 1–3, 10–11)
- **Yaklaşık üç yıl önce Google'dan Martin Splitt, "centerpiece annotation" (merkez parça anotasyonu) diye bir şeyi kazara açıkladı.** Koray bunu "accidentally confessed" (kazara itiraf etti) olarak niteliyor. (satır 3–5)
- **Splitt'e göre centerpiece annotation bir metin değildi; sayfada görmeye çalıştıkları bir görsel öğeydi** ve sayfayı sıralayıp sıralamama kararını buna göre veriyorlardı. (satır 5–6)
- **Google'ın DOJ (Adalet Bakanlığı antitröst davası) sızıntı dosyalarında da centerpiece annotation örnekleri görüldü.** (satır 6–7)
- **DOJ dosyaları ayrıca Google'ın bir sayfanın "above the fold" (katlama çizgisi üstü / ekranı kaydırmadan görünen) alanını dahili olarak nasıl değerlendirdiğini açıklıyordu.** (satır 7–8)
- **API sızıntısında (Google Content Warehouse API leak) sayfa üzerinde "annotation" / "semantic label annotation" (anlamsal etiket anotasyonları) vardı ve hâlâ var; yaklaşık 22 farklı anotasyon bulunuyordu.** (satır 8–10)
- **audiototext.com'da "no sign up" (kayıt gerekmez) anotasyonu eklenerek dev bir yükleme (upload) butonu kullanıldı.** (satır 12–13)
- **AI/agentic yanıtları incelediğinde "free" (ücretsiz) ve "no sign up" olmanın, LLM'lerin/AI'ın siteleri sınıflandırırken aradığı iki önemli attribute (nitelik) olduğunu gördü.** (satır 13–15)
- **"Upload now" gibi küçük bir buton yerine, kullanıcının sesini/videosunu doğrudan sürükle-bırak yapabileceğini gösteren dev bir öğe (giant drag-drop element) yerleştirdi.** (satır 15–17)
- **"No sign up" bildirimi eklendi ve çok az metin yazıldı.** (satır 16–17)
- **Çok az metin yazmasının nedeni: çok fazla metin yazarsan sayfadaki her token'ın (kelime/anlam birimi) önemini seyreltiyorsun (token dilution).** (satır 17–18)
- **Sayfadaki ilk %2'lik token aralığına tüm önemli n-gram ve entity'ler (varlıklar) yerleştirildi: dosya uzantıları, "audio to text", "video to text" gibi X-to-Z (X'ten Y'ye) kombinasyonları.** (satır 18–20)
- **İlk tıklamalar geldikten sonra gerisi tamamen Google'ın "click test"i (tıklama testi) oldu.** (satır 20–21)
- **Günde 50 tıklamadan 8.000 tıklamaya çıkana kadar sayfada sıfır içerik değişikliği ve sıfır görsel değişiklik yapıldı.** (satır 21–23)
- **Her core update (çekirdek güncelleme) ve major update'te site yükselmeye devam etti; Google anlayana kadar beklendi.** (satır 23–24)
- **Bazen tıklamaların %50'si kaybedilse bile hiçbir şey değiştirilmedi; çünkü Google'ın siteyi kalıcı sıralamak için güven (confidence) kazanmaya zamana ihtiyacı var.** (satır 23–26)
- **Site artık ElevenLabs, IO ve birçok global şirketle birlikte sıralanıyor.** (satır 25–26)
- **Mesele sayfadaki içerik miktarı değil, onu nasıl organize ettiğin; görsel olarak nasıl düzenlediğin ve belirli attribute'ları görsel olarak nasıl anotladığın.** (satır 26–29)
- **Çünkü agentic retrieval (ajan temelli getirme) yalnızca sayfadaki metinle ilgili değil; sayfada ne gördükleriyle de ilgili.** (satır 29–30)
- **Sayfanın e-ticaret tasarımı olması gerekiyorsa öyle yapmalısın; sadece bir affiliate (ortaklık) sitesi olsan bile.** (satır 30–31)
- **Ürün sayfalarını veya kategori sayfalarını taklit ederek (imitate e-com design) o sorgular için sıralanabilirsin.** (satır 31–32)
- **Endonezya'da iGaming (kumar) sektöründe bu sık yapılıyor: ürün sayfası taklit ediliyor; ama kullanıcı "satın al"a tıklayınca casino'ya giriş yapmak için money site'a (para sitesine) gidiyor.** (satır 32–33)
- **Google aslında bu görsel temsillere güvenerek "satın alıyor"; kimsenin e-com sitesi taklit etmeyeceğine güveniyor.** (satır 33–34)
- **Sayfada "free audio to text tool" yazıyor; çoğunlukla ücretsiz ama tamamen değil.** (satır 35)
- **Google aracı test etmediği için videoyu yükledikten sonra ne olduğunu göremiyor; hiçbir şey yüklemiyorlar.** (satır 35–37)
- **Google sadece click engagement'a (tıklama etkileşimine) inanıyor; etkileşimi görünce sıralamaya güven kazanıyor.** (satır 37)
- **Fikir Google mühendislerinden geliyor: bu fikir ilk olarak Michael Bendersky ve Marc Najork'tan çıktı.** (satır 41–42)
- **İkisi Google mühendisi; "document aware layout ranking" / "layout aware document ranking" (düzen-farkında belge sıralaması) diye bir şey patentlediler.** (satır 42–44)
- **Yani düzenini ve tasarımını görecek bir tasarım yaratmaya ve seni buna göre sıralamaya çalışıyorlardı.** (satır 44–45)
- **Najork ve Bendersky çok önemli mühendisler; bir şey patentlerlerse uygulanır. Bu, Koray'ın tasarıma önem vermeye başladığı ilk andı.** (satır 45–47)
- **Zorunlu da çünkü artık herkes uzman seviyesinde metin üretebiliyor; metin artık doğrudan özgünlük göstermiyor.** (satır 47–48)
- **Düzen (layout) ve tasarım hâlâ insan emeği gerektiriyor ve bir özgünlük (originality) işareti olarak kullanılabilir.** (satır 48–50)
- **AI ile tasarlasan bile sayfaya insan emeği sinyalleri eklemek önemli olacak.** (satır 50)
- **audiototext.com tasarımı da AI'dan geldi; ama tüm HTML hiyerarşisi, class isimleri ve CSS değiştirildi, AI imzaları (signatures) temizlendi.** (satır 51–53)
- **(Görsel semantikle ilişkili, sonraki bölümlerle köprü) Az kelime kullanınca her kelime relevance'a (ilgililiğe) daha çok katkı yapar.** (satır 163–164)
- **Daha az token olunca içeriğin AI olup olmadığını anlamak zorlaşır; AI tespiti uzun içerikte daha isabetli çalışır.** (satır 164–166)
- **Sayfayı görsel anotasyonlarla düzgün tasarlayıp az miktarda içeriği az "verbalization" (sözelleştirme) ile yerleştirirsen her iki açıdan da daha güvende olursun.** (satır 166–168)
- **audiototext.com çok az metin kullandığı için AI tespit aracı orada geçersiz sonuç verir; sadece üç-dört cümle var.** (satır 168–170)
- **Bu yüzden radar altında kalmak için sayfalardaki token sayısını da azaltmaya çalışıyor.** (satır 170–171)

---

## Derinleştirme: araştırma bulguları

### 1. Centerpiece Annotation (Merkez Parça Anotasyonu) — Martin Splitt ne dedi?

Koray'ın alıntıladığı ifade gerçektir. Martin Splitt (Google Search Relations / Developer Advocate), Jason Barnard'ın moderatörlüğündeki bir Duda web seminerinde (yayın ~7 Ekim 2021; SEJ haberi 20 Ekim 2021, videoda ~28:42) şunu söyledi: Google'ın "Centerpiece Annotation" dediği bir mekanizması var ve orada **"semantic content"** (anlamsal içerik) ile birlikte **"potentially the layout tree"** (olası olarak düzen ağacı) incelenir. Bkz. [Search Engine Journal — Centerpiece Annotation](https://www.searchenginejournal.com/centerpiece-annotation/424152/) ve [Kalicube — Finding the Centerpiece Content with Martin Splitt](https://kalicube.com/learning-spaces/knowledge-nuggets/technical-seo/finding-the-centerpiece-content).

Önemli bir nüans: Splitt'in kelimeleri "görsel element"ten çok **"layout tree" (DOM/render düzen ağacı)** ve **"semantic content"**. Yani "centerpiece bir metin değil, görsel bir öğeydi" ifadesi Koray'ın yorumu/parafrazıdır; Splitt'in literal sözü "düzen ağacı + anlamsal içerik"tir. Kavramın özü doğru: Google sayfayı bileşenlere (ana içerik, ilgili içerik, boilerplate) ayırır ve **her bileşene farklı ağırlık (weighting) verir**; ana içerik (centerpiece) en yüksek ağırlığı alır.

Bu kavram 2021'de tek seferlik bir laf değil; Google tarafında tutarlı biçimde tekrarlandı. Gary Illyes daha sonra ana içeriği doğrudan **"centerpiece content"** olarak adlandırdı ve bunun **"ranking and retrieval"** (sıralama ve getirme) için kullanıldığını, header/footer/navigation'a göre daha ağır tartıldığını söyledi (bkz. [Search Engine Journal — indexing the main content](https://www.searchenginejournal.com/google-explains-the-process-of-indexing-the-main-content/552347/)). Ayrıca topluluk analizlerinde centerpiece annotation'ın yaklaşık **400 karakter** ile sınırlı olduğu ve kötü HTML sıralamasının (örn. metnin ortasına sokulan paylaş butonları) anotasyonu ikiye bölüp işe yaramaz hale getirebildiği aktarılır (bkz. [Seoteric — Visual semantics and topical authority](https://www.seoteric.com/visual-semantics-and-topical-authority-why-google-now-reads-your-page-layout/)).

**Uygulama açısından ne demek:** Sayfanın "ne hakkında olduğunu" belirleyen ana bileşen, ekranın en üstünde (above the fold), kesintisiz, net HTML sırasıyla ve en önemli kelimeleri içerecek şekilde durmalı.

### 2. DOJ antitröst davası ve "above the fold" değerlendirmesi

Koray iki şey iddia ediyor: (a) DOJ sızıntı dosyalarında centerpiece annotation örnekleri görüldü, (b) dosyalar Google'ın above-the-fold alanını dahili değerlendirdiğini açıklıyordu.

- DOJ davasının gerçekliği ve "ticket" dokümanlarının kamuya açılması doğrulanmıştır (Judge Amit Mehta kararı, exhibit'lerin günlük yayını). Bkz. [Bloomberg — Six Documents](https://www.bloomberg.com/news/articles/2023-11-17/google-s-doj-antitrust-case-explained-in-6-documents-googl) ve [Hobo — Google vs DOJ](https://www.hobo-web.co.uk/google-vs-doj/).
- Ancak DOJ exhibit'lerinde **tam olarak "centerpiece annotation" teriminin geçtiğine** dair bağımsız, doğrudan bir kaynak bulunamadı. DOJ davasından sızan iyi belgelenmiş sistemler Navboost, Glue, kullanıcı tıklama/etkileşim verileridir. Bu yüzden "DOJ dosyalarında centerpiece örnekleri" iddiası **kısmen doğrulanabilir** (kavram Google tarafında var, dava ekosisteminde konuşuldu; ama exhibit'te literal terim teyit edilemedi).
- "Above the fold"un Google için gerçek bir sıralama mülahazası olduğu bağımsız olarak doğrudur: 2012 **Page Layout Algorithm** ("above the fold" güncellemesi), katlama çizgisi üstünü aşırı reklamla dolduran sayfaları cezalandırıyordu. Bkz. [Sistrix — Page Layout Algorithm Update](https://www.sistrix.com/ask-sistrix/google-updates-and-algorithm-changes/google-page-layout-algorithm-update-ads-above-the-fold/). Bu, above-the-fold alanının Google için ölçülen/değerlendirilen bir alan olduğunun resmi kanıtıdır.

### 3. Content Warehouse API Leak (2024) ve anotasyon/semantik etiketler

Mart–Mayıs 2024'teki sızıntı doğrulanmıştır: Google'ın dahili Content Warehouse API dokümantasyonu (yaklaşık 2.596 modül, 14.014 attribute) GitHub'a kazara commit edildi; Erfan Azimi → Rand Fishkin → Mike King (iPullRank) hattıyla 27 Mayıs 2024'te kamuya analiz edildi; Google belgelerin gerçekliğini teyit etti. Bkz. [Wikipedia — 2024 Google Search documentation leak](https://en.wikipedia.org/wiki/2024_Google_Search_documentation_leak) ve [iPullRank — Secrets from the Algorithm](https://ipullrank.com/google-algo-leak).

Sızıntıda sayfa/belge anlama ile ilgili anotasyon ve semantik etiket yapıları gerçekten vardır:
- **WebRef annotations** — entity (varlık) tanıma; içeriği Google'ın bilgi grafiğindeki varlıklara bağlar.
- **Salient terms / salientTerms** — belgedeki en önemli/temsili terimler.
- **centerpiece / main content** sinyalleri, **golden** (insan-etiketli gold-standard belge bayrağı), font ağırlığı sinyalleri (`avgTermWeight` = gövde metnindeki bir terimin ortalama ağırlıklı font boyutu), anchor context (linkin solundaki/sağındaki 5 kelime hash'i) gibi anlamsal/görünümsel attribute'lar.

**"Yaklaşık 22 anotasyon" sayısı hakkında uyarı:** Koray'ın söylediği "something like 22 different annotations" ile en net eşleşen doğrulanmış "22" sayısı aslında Google'ın **Visual Elements Gallery**'sidir (Aralık 2022, Martin Splitt'in de dahil olduğu ekip): SERP'te görünen en yaygın **22 görsel element**. Bkz. [Google Search Central — Visual Elements](https://developers.google.com/search/blog/2022/12/visual-elements). Bu, API leak'teki anotasyon sayısından farklı bir "22"dir. API leak'te onlarca farklı "Annotation" tipi vardır ama "tam 22 belge anotasyonu" diye kesin bir liste doğrulanamadı. Bu yüzden ekip, "22" rakamını kesin bir API-leak metriği gibi sunmamalı; kavramsal olarak (çok sayıda anlamsal/görsel anotasyon tipi var) doğru, sayısal olarak **belirsiz**.

### 4. Bendersky & Najork — "layout-aware document ranking" patenti ve makalesi

Koray'ın "document aware layout ranking / layout aware document ranking" olarak andığı iş gerçektir ve tam olarak bu iki mühendisi içerir:

- **Patent:** US **12,393,768 B2** — *"Layout-aware multimodal pretraining for multimodal document understanding"* (verildiği tarih 19 Ağustos 2025; önceki yayın US 2023/0222285 A1, 13 Temmuz 2023; PCT/US2020/066588, 22 Aralık 2020). Mucitler arasında **Michael Bendersky** ve **Marc Alexander Najork** açıkça yer alıyor (ayrıca Mingyang Zhang, Cheng Li, Tao Chen, Spurthi Amba Hombaiah, Te-Lin Wu). Atanan: Google LLC. Bkz. [Google Patents US12393768B2](https://patents.google.com/patent/US12393768B2/en) / [USPTO Gazette kaydı](https://patentsgazette.uspto.gov/week33/OG/html/1537-3/US12393768-20250819.html).
- **Makale (patentin akademik karşılığı):** **LAMPRET: Layout-Aware Multimodal PreTraining for Document Understanding** (arXiv 2104.08405, Nisan 2021; Google Research). Bkz. [research.google — LAMPRET](https://research.google/pubs/lampret-layout-aware-multimodal-pretraining-for-document-understanding/).

Özü: Model belgeyi **blok seviyesine** (başlık, paragraf, görsel, tablo) ve **belge seviyesine** ayırır; metin boyutu, stili ve çoklu ortamı (multimedia) hesaba katar. Düzen + metin boyutu/stili, bir belgenin hangi kısımlarının **daha önemli** olduğunu gösterir. Bu, Koray'ın "Google düzeninizi görüp ona göre sıralıyor" iddiasının teknik dayanağıdır. (Not: Benzer isimli ama farklı/eski bir patent olan US7953679B2 "Scalable indexing for layout based document retrieval and ranking" başka mucitlere aittir; Koray'ın kastettiği, Bendersky/Najork imzalı LAMPRET soyundan gelen multimodal patenttir.)

### 5. audiototext.com vaka analizi — bağımsız doğrulama

`audiototext.com` canlı bir sitedir ve Koray'ın tarif ettiği düzenle büyük ölçüde örtüşür:
- **Dev sürükle-bırak yükleme alanı** var: "Drop your audio or video file here or click to browse" (MP3, WAV, MP4 vb.).
- **"No Signup Required"** ve **"100% Free"** rozetleri yükleyicinin yanında, above-the-fold alanında belirgin.
- Above-the-fold: navigasyon, dil seçici, "Free Audio to Text Converter" başlığı ve yükleme arayüzü.

**Önemli nüans / çelişki:** Bugünkü sayfa artık "çok az metin" değil; 20+ soruluk uzunca bir FAQ, özellikler, "how it works" ve kullanım örnekleri içeriyor. Yani ya sayfa zamanla metin eklenerek evrildi, ya da Koray'ın "çok az metin" vurgusu **above-the-fold / centerpiece** alanına özgü (asıl token yoğunluğunun ilk %2'si), alt kısımdaki FAQ ikincil. Bu, "token dilution" prensibiyle uyumlu olabilir ama "sadece üç-dört cümle" ifadesi bugünkü tam sayfa için geçerli değil. Ekip, bu rakamları (0→8.000 tıklama, %50 düşüşleri atlatma, ElevenLabs ile yan yana sıralama) Koray'ın kendi Search Console verisine dayanan beyanı olarak ele almalı; bağımsız olarak YouTube videosu dışında doğrulanamadı.

audiototext.com, Koray'ın görsel-semantik tezini anlatan kurucu vakadır ("one page exact match domain case study" adlı YouTube videosu). Video başlık/indeksleme nedeniyle arama motorunda doğrudan bulunamadı; ekip Koray'ın YouTube kanalından aramalı.

### 6. Agentic retrieval "sayfayı görür, sadece metni değil"

Bu, Koray'ın en ileri iddiası. Doğrudan "agentic retrieval sayfayı görüntü olarak görür" diyen bir Google resmi beyanı yok; ancak yön doğru:
- **Multimodal / layout-aware modeller** (LAMPRET, US12393768B2) sayfayı metin + düzen + görsel olarak birlikte temsil eder.
- Google Patents'te ayrıca **US11604920B2 "Visual parsing for annotation extraction"** gibi görsel ayrıştırma patentleri vardır.
- Modern AI arama/ajan akışları (AI Overviews, SGE, LLM tarayıcıları) sayfa snapshot/render'ını değerlendirebilir; "Learning Visual Features from Snapshots for Web Search" (arXiv 1710.06997) gibi akademik çalışmalar sayfa görüntüsünden özellik öğrenmeyi gösterir.
Dolayısıyla "sadece metin değil, görünüm de önemli" **kavramsal olarak desteklenir**; ama "Google/ajan her sayfayı piksel piksel görür ve buna göre sıralar" ifadesi **kesin kanıtlanmış değil**, güçlü bir çıkarımdır.

### 7. Exact match domain (EMD) 2025–2026

Koray EMD'yi (audiototext.com, ve link bölümünde eSIM/truck örnekleri) aktif bir kaldıraç olarak kullanıyor. Sektör konsensüsü: 2012 EMD güncellemesinden beri EMD **tek başına** sıralama kısayolu değil; ancak **kaliteli içerik + net CTR + niş/düşük rekabet** ile hâlâ değerli, özellikle sorgu niyetini anında ileten domainlerde. Bkz. [Fruits — Do EMDs Still Work in 2026](https://fruits.co/news/do-exact-match-domains-still-work-for-seo-in-2026) ve [NameSilo — keyword domains future](https://www.namesilo.com/blog/en/domain-names/the-future-of-keyword-domains-are-they-still-worth-buying). Koray'ın yaklaşımı tam da bu: EMD + dev görsel CTA + az ama isabetli token + tıklama sinyali. EMD burada "centerpiece token'ını domain seviyesinde de tekrarlamak" işlevi görüyor.

### 8. Token dilution ve "az kelime = her kelime daha değerli"

Koray'ın tezi: metin kısa olunca (a) her token relevance'a daha çok katkı yapar, (b) AI tespiti istatistiksel zemin bulamaz. Birincisi, TF-IDF/BM25 mantığıyla ve centerpiece'in ~400 karakter sınırıyla uyumlu (uzun boilerplate ana sinyali seyreltir). İkincisi, AI-metin dedektörlerinin (perplexity/burstiness temelli) kısa metinde güvenilmez olması bilinen bir sınırlamadır. Bu yüzden "görsel anotasyon + az sözelleştirme" stratejisi iç tutarlı; ancak bir "hile" değil, ölçülü bir içerik-mimarisi tercihi olarak ele alınmalı. (Bu başlık asıl olarak 10 ve AI-içerik bölümleriyle örtüşür; burada yalnızca görsel-semantik bağlantısı verilmiştir.)

---

## Doğrulama tablosu

| İddia | Durum | Kaynak |
|---|---|---|
| Martin Splitt "Centerpiece Annotation"dan bahsetti; semantic content + layout tree incelenir | ✅ doğrulandı | [SEJ](https://www.searchenginejournal.com/centerpiece-annotation/424152/), [Kalicube](https://kalicube.com/learning-spaces/knowledge-nuggets/technical-seo/finding-the-centerpiece-content) |
| Centerpiece "metin değil, görsel öğe"dir | ⚠️ kısmen | Splitt literal olarak "layout tree + semantic content" dedi; "görsel öğe" Koray'ın yorumu ([SEJ](https://www.searchenginejournal.com/centerpiece-annotation/424152/)) |
| Google ana içeriği (centerpiece) header/footer'dan ağır tartar | ✅ doğrulandı | [SEJ — Illyes/main content](https://www.searchenginejournal.com/google-explains-the-process-of-indexing-the-main-content/552347/) |
| DOJ dosyalarında centerpiece annotation örnekleri var | ⚠️ kısmen / ❓ | Dava ve exhibit'ler gerçek; literal terim exhibit'te bağımsız teyit edilemedi ([Bloomberg](https://www.bloomberg.com/news/articles/2023-11-17/google-s-doj-antitrust-case-explained-in-6-documents-googl)) |
| Google above-the-fold alanını değerlendirir | ✅ doğrulandı | [Sistrix — Page Layout Algorithm](https://www.sistrix.com/ask-sistrix/google-updates-and-algorithm-changes/google-page-layout-algorithm-update-ads-above-the-fold/) |
| Content Warehouse API leak (2024) gerçek; anlamsal etiket/anotasyonlar içeriyor | ✅ doğrulandı | [Wikipedia](https://en.wikipedia.org/wiki/2024_Google_Search_documentation_leak), [iPullRank](https://ipullrank.com/google-algo-leak) |
| API leak'te "yaklaşık 22 anotasyon" | ❓ doğrulanamadı | "22" doğrulanan sayı Visual Elements Gallery'ye ait ([Google](https://developers.google.com/search/blog/2022/12/visual-elements)); API leak'te tam 22 sayısı teyit edilemedi |
| Bendersky & Najork layout-aware belge sıralaması patenti var | ✅ doğrulandı | [Patent US12393768B2](https://patents.google.com/patent/US12393768B2/en), [LAMPRET](https://research.google/pubs/lampret-layout-aware-multimodal-pretraining-for-document-understanding/) |
| Düzen/metin boyutu belge önemini gösterir, sıralamaya girer | ✅ doğrulandı | [LAMPRET özeti / US12393768B2](https://research.google/pubs/lampret-layout-aware-multimodal-pretraining-for-document-understanding/) |
| audiototext.com dev drag-drop + "no sign up" + "free" içeriyor | ✅ doğrulandı | Canlı site (audiototext.com) |
| audiototext.com "sadece 3-4 cümle / çok az metin" | ❌ çelişen kanıt (bugün) | Bugün sayfada 20+ soruluk FAQ ve geniş içerik var (audiototext.com) |
| 0→8.000 tıklama, sıfır içerik/görsel değişiklik, %50 düşüşleri atlatma, ElevenLabs ile sıralama | ❓ doğrulanamadı | Yalnızca Koray'ın beyanı/Search Console'u ve YouTube vakası |
| EMD 2025–2026'da (nişte, kaliteyle) hâlâ işe yarar | ✅ doğrulandı | [Fruits](https://fruits.co/news/do-exact-match-domains-still-work-for-seo-in-2026), [NameSilo](https://www.namesilo.com/blog/en/domain-names/the-future-of-keyword-domains-are-they-still-worth-buying) |
| Agentic retrieval "sayfayı görür, sadece metni değil" | ⚠️ kısmen | Multimodal/görsel ayrıştırma patentleri destekler ([US11604920B2](https://patents.google.com/patent/US11604920B2/en)); kesin resmi beyan yok |
| "free" ve "no sign up" AI yanıtlarında önemli attribute | ❓ doğrulanamadı | Koray'ın gözlemi; bağımsız kaynak yok |
| Endonezya iGaming ürün sayfası taklidi → money site | ❓ doğrulanamadı | Koray'ın sektör gözlemi; kaynak yok (ve politika ihlali, bkz. Riskler) |
| AI ile üretilen tasarımda HTML/CSS/class imzalarını temizlemek gerekir | ⚠️ kısmen | Mantıklı; "scaled content abuse" politikası var ama "class imzası = ceza" resmi değil |
| Az token → AI tespiti zorlaşır, her kelime relevance'a daha çok katkı | ⚠️ kısmen | Dedektör sınırlaması bilinir; "ceza kaçırma" garantisi yok |

---

## Uygulama SOP'si

1. **[Proje] Kullanıcı görevini belirle:** dosya indirme, tarih hesabı veya bilgi bulma; gerçek bileşeni brief'e yaz.
2. **[Proje] İlk ekranı ölç:** H1, kısa açıklama, gerçek örnek/sonuç ve ana eylem anlaşılır olsun. Mobil/masaüstü koordinatlarını kaydet.
3. **[Proje] Doğru attribute'ları göster:** free/no account/Letter/A4 gibi yalnız test edilebilir özellikleri eyleme yakın ver.
4. **[Hipotez] İlk %2/~400 karakter:** röportajdaki deney varsayımlarıdır. Sayısal Google kabul kapısı değildir; temel amaç önemli bilgiyi erken vermektir.
5. **[Proje] Destek içeriğini düzenle:** ana görevi bölmeyen açıklama, tablo ve rehber bağlantıları kullan; sırf kısalık için gerekli bilgi çıkarma.
6. **[Resmi/teknik] Gerçek bağlantı ve erişilebilir DOM:** kaynak HTML, mantıklı başlıklar, etiketler ve klavye davranışı denetlensin.
7. **[Koşullu] Görsel düzen:** sayfa görevi gerektiriyorsa galeri/karşılaştırma kullan; aldatıcı ürün görünümü oluşturma.
8. **[Proje] Kalıntı temizliği:** demo metni, yanlış meta, kullanılmayan CSS ve bozuk bileşeni temizle. GeneratePress veya bir class adı tek başına ceza kanıtı değildir.
9. **[Proje] Gerçek emek:** çalışan araç, özgün dosya ve kaynaklı tarih verisini kanıtlarıyla göster; temelsiz üstünlük iddiası ekleme.
10. **[Proje] Değişiklik yönetimi:** deney sırasında gereksiz değişiklik azaltılır; tarih, işlev ve erişilebilirlik hataları hemen düzeltilir.
11. **[Resmi/koşullu] Schema:** yalnız görünür ve gerçek içerikle uyumlu tür/alanlar; editöryal FAQ'ya sahte UGC işaretlemesi yok.
12. **[Proje] Kabul kaydı:** kapsam, viewport, sürüm, test ve kalan işleri yaz; tarayıcı sonucu sıralama garantisi değildir.

## Proje kontrol listesi

- [ ] Hedef sorgular için AI Overviews/LLM yanıtları incelendi, kritik attribute'lar listelendi
- [ ] Sayfanın tek centerpiece'i (ana işlev/varlık) tanımlandı
- [ ] Centerpiece above-the-fold'da ve görsel olarak dev/belirgin
- [ ] "free", "no sign up" vb. attribute rozetleri etkileşim öğesinin yanında
- [ ] Önemli varlık ve format ilk ekran metninde açık; %2 hipotezi resmi eşik diye sunulmuyor
- [ ] H1 ve ilk cümle centerpiece'i net tanımlıyor ("X is a ...")
- [ ] Ana alanda token dilution yok; uzun içerik alta segmentlenmiş
- [ ] Centerpiece metni HTML sırasında kesintisiz (araya buton/reklam sokulmamış)
- [ ] Anlamsal HTML5 ve mantıklı DOM hiyerarşisi kullanıldı
- [ ] Gerekliyse e-ticaret/ürün/kategori görsel düzeni kuruldu
- [ ] Demo/yanlış meta/ölü CSS temiz; çalışan class adları zorunlu yeniden adlandırılmıyor
- [ ] İnsan emeği sinyalleri (özgün görsel/etkileşim) eklendi
- [ ] Render sonrası (JS'li) ve mobilde layout doğrulandı
- [ ] Deney/izleme planı var; gerçek kullanıcı hataları için bekleme uygulanmıyor
- [ ] Structured data + görsel segmentasyon uygulandı

---

## Riskler ve politika uyarıları

- **Ürün sayfası taklidi / aldatıcı tasarım (Endonezya iGaming örneği) — YÜKSEK RİSK.** Kullanıcıyı e-ticaret/ürün sayfası sanıp "satın al"a tıklattıktan sonra casino/money site'a yönlendirmek; Google Spam Policies kapsamında **cloaking**, **scam ve dolandırıcılık**, **aldatıcı yönlendirme (sneaky redirects)** olarak değerlendirilebilir. Bu, net gri/siyah şapka ve çoğu niş için yasal/politika riskidir. Playbook'ta bunu **taklit edilecek örnek değil, kaçınılacak sınır** olarak işaretliyoruz.
- **Yanıltıcı "free" / "no sign up" vaadi.** Sayfa "mostly free, not entirely" durumundaysa (Koray'ın kendi ifadesi), kullanıcıyı yarı yolda ödeme/kayda zorlamak **aldatıcı UX** ve tüketici koruma riski doğurur. Attribute'lar gerçeği yansıtmalı.
- **Affiliate'te e-com düzeni taklidi.** Düzeni taklit etmek tek başına yasak değil; ama fiyat, stok, "sepete ekle" gibi işlevleri sahte göstermek **yanıltıcı** olur. Gerçek işlev sun ya da affiliate olduğunu gizleme.
- **AI imza temizliği ↔ Scaled Content Abuse.** AI üretimini gizlemek için imza temizlemek, "scaled content abuse" politikasını aşmaz; Google kalıpları (GeneratePress/Lovable) kolayca sınıflandırabiliyor (Koray'ın BrowserStack/2.000 doküman gözlemi). Hız + kalıp = risk. Temizlik gerekli ama **tek savunma değil**; içerik kalitesi ve yayın hızı kontrolü şart.
- **AI tespitinden kaçınmak için token azaltma.** "Radar altında kalmak" çerçevesi, politika ihlali içeriği meşrulaştırmak için kullanılmamalı. Az token stratejisi yalnızca gerçek araç/az-metin gereken sayfalarda meşrudur; thin content (ince içerik) cezası riski doğurabilir.
- **EMD + agresif CTR optimizasyonu.** Yalnızca EMD'ye ve manipüle tıklamaya dayanmak kırılgandır; kalite/brand sinyalleriyle desteklenmezse spam filtrelerine takılır.
- **"Dokunma" doktrini.** Bir sayfanın güncellemeler arası dalgalanmasını beklemek makul; ama gerçek kullanıcı sorunlarını (bozuk araç, kötü mobil UX) "Google güven kazanıyor" diye görmezden gelmek zarar verir.

---

## Ölçüm / KPI

- **Birincil:** Sayfa bazında organik tıklama (Search Console), günlük trend (0 → hedef). Koray'ın metriği: sürdürülebilir tıklama büyümesi ve core update'lerde yukarı yönlü sıçrama.
- **Ortalama pozisyon ve impression** (web + ayrıca **AI Overview impression** verisi): Search Console'dan AI impression ile klasik web impression'ı sayfa bazında karşılaştır.
- **CTR**: EMD + centerpiece + attribute rozetlerinin etkisi; düşük rekabet nişlerde EMD CTR avantajını izle.
- **Etkileşim (engagement)**: Araç kullanımı, dosya yükleme/işlem sayısı, sayfada kalma — Google'ın "click engagement"ına denk gelen davranışsal sinyaller.
- **Core/major update dayanıklılığı**: Her güncellemede pozisyon/tıklama değişimi; geçici %50 düşüş sonrası toparlanma süresi.
- **Rakip SERP eşlikçileri**: Sayfanın hangi otoriter markalarla (ElevenLabs vb.) yan yana sıralandığının takibi.
- **Crawl verisi**: Hangi Google user-agent'ının, hangi sıklıkla taradığı (log/GSC crawl stats) — AI impression ile korelasyon.
- **Teknik doğrulama KPI'ları**: Centerpiece above-the-fold mı (render testi), ilk ekran eylem/örnek görünürlüğü ve metnin görevle uyumu; %2/~400 karakter hipotezi ayrı deney kaydı.

> İzleme önerisi: Sayfa bazlı (AI impression + web impression + crawl + user-agent) verilerini çekip bir LLM'e (Claude) verip korelasyon/örüntü çıkarmak — Koray'ın önerdiği yöntem.

---

## Kaynaklar

- Martin Splitt / Centerpiece Annotation — Search Engine Journal: https://www.searchenginejournal.com/centerpiece-annotation/424152/
- Centerpiece content (Martin Splitt) — Kalicube: https://kalicube.com/learning-spaces/knowledge-nuggets/technical-seo/finding-the-centerpiece-content
- Google ana içeriği (centerpiece) nasıl indeksler (Illyes) — SEJ: https://www.searchenginejournal.com/google-explains-the-process-of-indexing-the-main-content/552347/
- Visual semantics and topical authority — Seoteric: https://www.seoteric.com/visual-semantics-and-topical-authority-why-google-now-reads-your-page-layout/
- Google Visual Elements Gallery (22 görsel element) — Google Search Central: https://developers.google.com/search/blog/2022/12/visual-elements
- 2024 Google Search documentation leak — Wikipedia: https://en.wikipedia.org/wiki/2024_Google_Search_documentation_leak
- Secrets from the Algorithm (API leak analizi) — iPullRank/Mike King: https://ipullrank.com/google-algo-leak
- The Google Leak: 14,000 Ranking Factors — Farbentour: https://www.farbentour.de/en/glossary/google-leak-2024/
- Patent US12393768B2 — Layout-aware multimodal pretraining: https://patents.google.com/patent/US12393768B2/en
- USPTO Gazette — US12393768B2: https://patentsgazette.uspto.gov/week33/OG/html/1537-3/US12393768-20250819.html
- LAMPRET makalesi — Google Research: https://research.google/pubs/lampret-layout-aware-multimodal-pretraining-for-document-understanding/
- LAMPRET — arXiv: https://arxiv.org/abs/2104.08405
- Visual parsing for annotation extraction — Patent US11604920B2: https://patents.google.com/patent/US11604920B2/en
- Scalable indexing for layout based document retrieval (eski/farklı patent) — US7953679B2: https://patents.google.com/patent/US7953679
- Learning Visual Features from Snapshots for Web Search — arXiv: https://arxiv.org/pdf/1710.06997
- Google Page Layout Algorithm (above the fold) — Sistrix: https://www.sistrix.com/ask-sistrix/google-updates-and-algorithm-changes/google-page-layout-algorithm-update-ads-above-the-fold/
- Google Page Layout Algorithm — Browser Media: https://browsermedia.agency/blog/googles-new-page-layout-algorithm/
- DOJ antitröst davası 6 belge — Bloomberg: https://www.bloomberg.com/news/articles/2023-11-17/google-s-doj-antitrust-case-explained-in-6-documents-googl
- Google vs DOJ — Hobo: https://www.hobo-web.co.uk/google-vs-doj/
- EMD 2026'da işe yarar mı — Fruits: https://fruits.co/news/do-exact-match-domains-still-work-for-seo-in-2026
- Keyword/EMD domainlerin geleceği — NameSilo: https://www.namesilo.com/blog/en/domain-names/the-future-of-keyword-domains-are-they-still-worth-buying
- audiototext.com (canlı site, düzen doğrulaması): https://audiototext.com

---

# 02 — Özgünlük, AI İmzaları ve AI Tespiti

> **Uygulama statüsü:** Röportaj alıntısı, vaka/araştırma ve resmi kural ayrı değerlendirilir. Aşağıdaki SOP/checklist proje kabul ölçütü olarak [kanıt politikası](KANIT-POLITIKASI.md) ile birlikte okunur; %2/~400 karakter/90 gün/%20–30/rastgelelik Google zorunluluğu değildir.


> Kaynak röportaj: Koray Tuğberk GÜBÜR × Julian Goldie (transkript: `seo-talks-whisper.txt`).
> Bu bölüm transkriptin ~46–60 ve ~123–171. satırlarını kapsar. Ek olarak ~123–138 arası "AI ile ekip/iş gücü" kısmı özetlenir.
> Durum etiketleri: ✅ doğrulandı · ⚠️ kısmen doğrulandı · ❓ doğrulanamadı · ❌ çelişen kanıt.

---

## Röportajda söylenenler (eksiksiz liste)

Aşağıdaki maddeler Koray'ın bu bölüme ait tüm iddialarının parafrazıdır (alıntı değil).

**Özgünlük ve tasarım/layout sinyali**

- Artık herkes uzman seviyesinde metin üretebildiği için metin tek başına özgünlüğü kanıtlamıyor; metin hâlâ riskli bir varlık ama güveni tek başına taşıyamaz (satır 47–49).
- Buna karşılık layout ve tasarım hâlâ insan emeği gerektiriyor; bu yüzden tasarım bir özgünlük/orijinallik işareti olarak kullanılabilir (satır 48–50).
- Tasarımı AI ile yapsan bile sayfaya "insan emeği/insan sinyali" eklemek önemli olacak (satır 49–50).
- Tasarım fikrinin kökeni Google mühendislerinin patentine dayanıyor: Michael Bendersky ve Marc Najork'un "document aware layout ranking" / "layout aware document ranking" patenti; bu mühendisler patent açtıysa muhtemelen uygulanır (satır 41–47). *(Bu iddia detaylı olarak 01. bölümde işlenir; burada yalnızca özgünlük bağlamında değinilir.)*

**AI imzalarını (footprint) temizleme**

- `audiototext.com` tasarımı yine AI'dan geldi ama tüm HTML hiyerarşisini, class isimlerini ve CSS'i değiştirdi; yani tüm "AI imzalarını" temizledi (satır 51–52).
- Birçok Lovable sitesi aynı class isimlerini ve aynı `div` hiyerarşilerini kullanıyor; bırakılan bu imzalar metinde, kaynak kodda ve görsel öğelerde önemli olacak (satır 52–54).
- Claude veya herhangi bir AI aracıyla site oluşturuyorsan CSS'i ve HTML'i temizlemelisin; çünkü bu araçlar içerikte bolca imza bırakıyor (satır 54–56).

**Geçmiş cezalar ve content scaler sınıflandırması**

- Geçmişte birçok WordPress ve özellikle GeneratePress sitesi ceza aldı; AI üretimi oldukları çok kolay sınıflandırılabildiği için (satır 56–58).
- Erken dönemde tüm content scaler'lar GeneratePress kullanıyordu; bu, Google için "olası content scaler" sinyaliydi ve scaled content abuse konusunda Google daha hassas hâle geldi (satır 57–59).
- BrowserStack örneği: 23.000 referring domain ve 300.000 aylık marka araması olan, alanının en büyük firması; tek günde AI ile 2.000 doküman yayınladığı için 8 ayda trafiğinin %70'ini kaybetti (satır 60–65). *(Yayın hızı/scaling tartışması esas olarak başka bölüme ait; burada AI/ölçek-cezası bağlamında aktarılıyor.)*
- Google'ın "scaled content" karar ağaçları diğer tüm kararları eziyor: çok hızlı ölçeklersen marka gücün veya güçlü link graph'ın olsa bile "tam otomatik" sınıflandırmasından kurtulamıyorsun (satır 62–67).

**Hukuki taraf**

- AI ile kitap yazarsan telif hakkı sahipliğini/iddiaını kaybetme ihtimalin var (satır 140–142).
- Üniversitede AI kullanırsan doktoranı (PhD) artık kabul etmiyorlar (satır 142).
- Bilim insanları ve romancılar şikâyet ediyor; küresel bir yasal düzenleme bekliyor (satır 146–150).
- Analoji: Bir dizi (örn. Friends) TV'de yayınlanınca para alırsın; ama kitap yazarsın ve bir AI şirketi onu eğitimde kullanırsa hiçbir şey almazsın — bu hukuken büyük bir sorun ve küresel olarak düzenlenecek (satır 147–150).
- Gelecekte kitabının/verinin AI tarafından bir cevabı üretmek için ne zaman kullanıldığını izleyen bir analytics aracı ve buna dayalı bir gelir paylaşımı (monetizasyon) modeli çıkacak; bu talebin şimdiden var olduğuna inanıyor (satır 150–152).

**Arama trendleri ve tespitin matematiği**

- "AI writer / AI content writer" arama talebi trendlerde düşüyor; buna karşılık "AI humanizer / humanized AI" talebi artıyor — talep, içeriğin insanlaştırılması ve özgünlük işaretlerine kaydı (satır 142–144).
- Matematiksel olarak AI içeriğini insanlaştırmak ve AI içeriğini tanımak her yıl daha kolay hâle geliyor (satır 144–146).

**Blacklist ve tespitten kaçınma**

- Blacklist edilmiş kelimeler, cümle yapıları, kelime kombinasyonları ve noktalama işaretleri oluşturursan, AI kullansan bile matematiksel olarak AI'dan geldiğini tespit edemezler (satır 152–155).
- AI tespiti, Koray'a göre "Türk polisi" gibi çalışır: suçlu olduğunu kanıtlamak zorunda değildir; sana bakar, suçlu olduğunu düşünürse kelepçeler ve götürür; masum olduğunu sen kanıtlarsın (satır 155–158).
- AI tespit sistemleri de böyle: belli bir eşiğin üstündeysen "muhtemelen AI" varsayarlar; ama matematiksel olarak kesin olamazlar, kanıtlamanın yolu yoktur (satır 158–160).
- Erken dönemde İncil'i (Bible) bir AI tespit sistemine koydu; sistem "AI'dan geliyor" dedi — oysa İncil (satır 160–161).

**Kısa içerik ve token azaltma**

- AI ile içerik üretimi, aynı anda AI tespit sistemlerini de sezerek bir ustalık seviyesi gerektirecek (satır 162–163).
- Daha az kelime kullanırsan her kelime relevance'a (konuyla ilgililik) daha iyi katkı verir; sayfadaki token sayısı az olursa AI olup olmadığını söylemek zorlaşır (satır 163–165).
- AI tespiti içerik uzunsa daha yüksek hassasiyetle çalışır; içerik kısaysa matematiksel hesap yapacak alan kalmaz (satır 165–166).
- Sayfayı görsel annotation'larla düzgün tasarlayıp az miktarda içerik ve az sözelleştirme koyarsan iki yönden de daha güvende olursun (satır 166–168).
- `audiototext.com` çok az metin kullanır; üç-dört cümle olduğu için herhangi bir AI tespit aracını çalıştırırsan sonuç geçersizdir — hiçbir şey kanıtlamaz (satır 168–170).
- Amaç, "radarın altında" kalmak için sayfadaki token sayısını azaltmak (satır 170–171).

**Ekip / AI iş gücü (özet — satır 123–138)**

- Julian'ın ajansı AI ile küçülmüş; Koray'ın ekibi ise büyümüş. Koray insanları makinelerle değiştirmek yerine tutmayı tercih ediyor (satır 123–125).
- AI işleri kolaylaştırdı ama çalışandan beklentiyi de yükseltti; net insan gücü ihtiyacında büyük fark yaratmadı (satır 126–128).
- Eskiden grafik tasarımcıdan günde 8 görsel isterken, şimdi "şu Claude skill'ini kullan ve tüm siteyi tamamla" diyor; tamamlayınca bir sonraki siteyi veriyor — çalışma saati düşmedi, çıktı astronomik arttı (satır 128–131).
- Talep de büyüdüğü için ekip büyümeye devam ediyor; her çalışan "süper insan" oldu, çıktıyı 10x'ledi (satır 131–133).
- Content writer artık developer de olabiliyor; tasarımı seviyorsa "Claude veya OpenAI Codex'e gir ve SOP'leri takip ederek yap" deniyor (satır 134–137).
- Tasarımcı/developer sayısı artıyor, writer sayısı hafifçe azalıyor; roller diğer alanlara kayıyor (satır 136–138).

---

## Derinleştirme: araştırma bulguları

### 1. "Metin artık özgünlüğü kanıtlamıyor" — doğru, ama Google'ın cevabı "üretim yöntemi değil, kalite"

Koray'ın temel önermesi — herkes uzman seviyesi metin üretebildiği için metnin özgünlük kanıtı olmaktan çıkması — Google'ın kendi resmi duruşuyla tutarlı. Google, 8 Şubat 2023 tarihli "AI-generated content" rehberinde net bir çizgi çiziyor: ödül, içeriğin **nasıl üretildiğine** değil **kalitesine** (E-E-A-T: experience, expertise, authoritativeness, trustworthiness) gidiyor; AI'yı **sıralama manipülasyonu amaçlı** otomatik içerik üretmek için kullanmak spam politikası ihlali ([Google Search Central](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content)).

Yani Google AI içeriği yasaklamıyor; "insan emeği/özgünlük sinyali" diye ölçülebilir bir alan yok — ölçülen şey orijinallik, çaba ve kullanıcıya değer. Koray'ın "layout insan emeği gösterir" tezi bu boşluğu dolduran pratik bir proxy; resmî bir ranking faktörü olarak Google tarafından doğrulanmış değil (bu nedenle 01. bölümdeki patent tartışmasına bağlı).

### 2. Quality Rater Guidelines Ocak 2025: AI içerik için "Lowest"

Google, Quality Rater Guidelines'ı (QRG) **23 Ocak 2025**'te güncelledi — Mart 2024'ten bu yana ilk büyük revizyon. İlk kez "generative AI" resmen tanımlandı ve raterlara, ana içeriğin (main content) otomasyon/AI ile üretildiği sayfaları işaretlemeleri söylendi. **Bölüm 4.6.6**: bir sayfanın ana içeriğinin çoğu/tamamı kopyalanmış, parafraz edilmiş veya AI ile üretilmiş ve **az çaba, az orijinallik, az değer** içeriyorsa → **Lowest** notunu hak eder ([PPC Land](https://ppc.land/google-updates-quality-rater-guidelines-with-ai-content-evaluation-criteria/), [Originality.ai](https://originality.ai/blog/google-search-quality-rater-guidelines-ai)).

Önemli nüanslar:
- AI içeriği yasaklanmadı; **çabasız/değersiz** AI içeriği hedef alındı.
- 4.6.3 "Auto-generated MC" bölümü kaldırılıp scaled content abuse, expired domain abuse, site reputation abuse ve "filler content" alt bölümleriyle yeniden yapılandırıldı.
- Abartılı uzmanlık iddiaları (exaggerated expertise) artık yanıltıcı olmasa bile "Low" alabiliyor — Koray'ın link building bölümündeki "claim" taktiği için uyarı niteliğinde.
- 9 Nisan 2025'te John Mueller (Search Central Live Madrid) raterların AI ana içeriği aktif olarak işaretlediğini doğruladı.
- **Kritik uyarı:** QRG notları doğrudan sıralamayı değiştirmez; algoritmayı eğiten sinyallerdir. Yön nettir ama "rater = ceza" denklemi yanlış.

### 3. Mart 2024 Core + Spam Update: deindexleme ve "scaled content abuse"

Koray'ın "content scaler" ve ölçek-cezası tezi burada güçlü biçimde doğrulanıyor. 5 Mart 2024'te Google, faydasız içeriği %40 azaltmayı hedefleyen core + spam update'i duyurdu; üç yeni spam politikası getirdi: **scaled content abuse, expired domain abuse, site reputation abuse** ([Search Engine Journal](https://www.searchenginejournal.com/google-march-2024-core-update/506070/), [SE Ranking](https://seranking.com/blog/seo-news-march-2024-core-update-spam-policies/)).

- Scaled content abuse politikası, içeriğin "insan emeğiyle, otomasyonla veya karışık" üretilmiş olmasından bağımsız uygulanıyor — üretim yöntemi değil, niyet ve ölçek önemli.
- 6–7 Mart'ta yüzlerce site tamamen **deindexlendi** (manuel aksiyon). SEJ'e göre birkaç hafta içinde 800+ site deindexlendi.
- Originality.ai çalışması (12 Mart 2024): incelenen ~79.000 siteden 1.446'sına (%2) manuel aksiyon geldi; bu sitelerin **%100'ünde** bir miktar AI içeriği, **%50'sinde** gönderilerin %90–100'ü AI üretimiydi ([Originality.ai](https://originality.ai/blog/google-march-2024-manual-action-ai-update-list)).

### 4. GeneratePress / tema footprint iddiası — ⚠️ kısmen, nedensellik doğrulanmadı

Koray "özellikle GeneratePress siteleri ceza aldı, çünkü content scaler'lar hep onu kullanıyordu" diyor. Araştırmada, **GeneratePress temasının bir deindexleme nedeni olduğuna dair birincil/doğrudan kaynak bulunamadı**. Mevcut kanıtlar cezaların **içerik kalitesi ve ölçek sinyallerine** bağlı olduğunu gösteriyor, temaya değil ([Originality.ai](https://originality.ai/blog/will-google-penalize-ai-content)). Makul yorum: GeneratePress hafif ve ücretsiz olduğu için programatik/affiliate + AI üreten siteler arasında **korelasyon** yüksekti; neden değil, eşlik eden bir işaret. Yani "tema footprint'i" bir SEO topluluğu teorisi; Google'ın tema bazlı ceza verdiği doğrulanmadı. (Bununla birlikte "footprint temizleme" prensibi aşağıdaki Lovable kanıtlarıyla ayrı olarak geçerlidir.)

### 5. BrowserStack örneği — ❓ doğrulanamadı (rakamlar teyit edilemedi)

"BrowserStack tek günde 2.000 AI dokümanı yayınladı, 8 ayda trafiğinin %70'ini kaybetti" iddiasını doğrulayan **birincil bir kaynak bulunamadı**. Aksine, BrowserStack kamuya açık vaka çalışmalarında derin/teknik **insan içeriğiyle** 500K+ aylık organik trafik örneği olarak anılıyor ([buildd.co](https://buildd.co/marketing/browserstack-seo-strategy)). Bu, Koray'ın rakamlarını yanlışlamaz (daha sonraki bir düşüş olabilir) ama kamusal kaynakla teyit edilemedi. Buna karşılık **genel desen** çok iyi belgelenmiş: 220+ AI-içerik sitesi analizinde %54'ü zirve trafiğinin ≥%30'unu, %22'si dörtte üçünü kaybetti ("Mount AI" eğrisi); 2.300 AI makalesi yayınlayan bir vaka trafiğinin %90'ını kaybetti ([authoritytech.io](https://authoritytech.io/curated/content-volume-trap-ai-visibility-audit-2026.md), [dev.to](https://dev.to/martinschenk/i-auto-published-2300-ai-articles-google-buried-90-of-my-traffic-424o)).

### 6. AI site builder footprint'leri (Lovable, v0, Bolt) — ✅ doğrulandı

Koray'ın "Lovable siteleri aynı class isimleri ve div hiyerarşilerini kullanıyor; bunları temizle" tezi doğrudan doğrulanıyor:
- AI builder'lar yeniden adlandırılmamış **default class isimleri**, hâlâ "Lovable Project" yazan meta etiketleri, dokunulmamış bileşen iskeletleri ("component skeletons"), eksik canonical ve yanlış/eksik structured data bırakıyor ([dreasays.substack.com](https://dreasays.substack.com/p/the-lovable-seo-problem)).
- Bu footprint'leri özellikle derecelendiren araçlar var: Lovable badge, v0 generator meta, Bolt deployment header, Webstudio default template gibi "builder fingerprint"leri ve default class vokabülerini ölçüyor ([SEOJuice vibe-coded tool](https://seojuice.com/tools/vibe-coded/)).
- Daha derin sorun: Lovable çoğu zaman **client-side React SPA** üretir; crawler boş bir `<div id="root"></div>` görür, içerik görünmez olur. CTA'lar `<a>` yerine `<button>` + onClick olduğu için crawler linkleri takip edemez ([ranked.ai](https://www.ranked.ai/docs/custom-cms-guides/how-to-add-seo-to-lovable-replit-ai-coded-sites), [cmo.beehiiv.com](https://cmo.beehiiv.com/p/using-lovable-for-your-website-think-again-if-you-care-about-seo)).
- 6.000+ Lovable sitesi analizinde ortak bulgular: hiçbiri sıralanmıyor, indeksleme sorunları, yanlış schema, çoklu H1 ([dreasays.substack.com](https://dreasays.substack.com/p/the-lovable-seo-problem)).

Sonuç: footprint temizleme (class isimleri, meta, iskeletler) gerçek ve savunulabilir bir pratik; ama **daha kritik olanı render modelini düzeltmek** (SSR/SSG, gerçek `<a>` linkleri, sunucu-tarafı HTML).

### 7. Hukuki taraf: telif, AI ve akademi

**AI ile üretilen eserlerde telif (copyright):** Koray'ın "AI ile kitap yazarsan telif kaybedebilirsin" uyarısı ABD hukukunda doğru yönde.
- **Thaler v. Perlmutter**: D.C. Circuit, 18 Mart 2025'te tamamen AI tarafından üretilen eserlerin telif alamayacağını onayladı; "human authorship" telifin temel şartı. ABD Yüksek Mahkemesi 2 Mart 2026'da temyiz talebini reddetti (certiorari denied), karar yürürlükte ([JD Supra](https://www.jdsupra.com/legalnews/thaler-v-perlmutter-human-authorship-8871308/), [Clark Hill](https://www.clarkhill.com/news-events/news/u-s-copyright-office-ponders-copyright-protection-for-ai-generated-works-following-d-c-circuits-thaler-decision/)).
- **US Copyright Office, Ocak 2025 (Part 2 raporu):** Yalnızca AI tarafından, insan müdahalesi olmadan üretilen eserler telif alamaz; ancak AI'yı **yardımcı araç** olarak kullanmak veya AI çıktısını daha büyük bir insan eserine dahil etmek telifi ortadan kaldırmaz. İnsan "seçim, düzenleme ve değiştirme" (selection, arrangement, modification) ile yazarlık kurabilir ([US Copyright Office summary](https://www.clarkhill.com/news-events/news/u-s-copyright-office-ponders-copyright-protection-for-ai-generated-works-following-d-c-circuits-thaler-decision/)).
- **Nüans:** "Kitabı tamamen AI yazdı" → telif riski yüksek. "AI'yı taslak/düzenleme aracı olarak kullandım, kurguyu/seçimi ben yaptım" → telif korunabilir. Yani risk mutlak değil, insan katkısının derecesine bağlı.

**Üniversitelerin AI ile yazılmış PhD'yi reddetmesi:** ✅ gerçek vakalar var, ama "her AI kullanımı = ret" aşırı genelleme (⚠️).
- Hindistan UGC, Babasaheb Bhimrao Ambedkar Bihar Üniversitesi'ne sunulan tezlerin ~%40'ının AI ile yazıldığını tespit edip geri gönderdi; UGC kuralı: %10–40 AI/plagiarism → 6 ay içinde revizyon, AI yalnızca dil düzeltmesi için ([Scroll.in](https://scroll.in/article/1094060/scroll_in)).
- Hong Kong Üniversitesi (HKU), Kasım 2025'te AI içerikli şüpheli bir doktora tezi için soruşturma açtı ([TVB News](https://news.tvb.com/en/803071-SuspecteduseofAIforHKUdoctoralthesis)).
- Kopenhag, Buffalo, Constructor University gibi kurumların politikaları: AI yazar olarak listelenemez, kullanım açıklanmalı, nihai sorumluluk öğrencide. Yani çoğu kurum **beyan edilmemiş** veya **ana içeriği AI'ya yazdırmayı** reddediyor; denetimli yardımcı kullanım genelde serbest.

**Eğitim verisi için tazminat/atıf beklentisi:** Koray'ın "küresel düzenleme + izleme/analytics + gelir paylaşımı modeli gelecek" öngörüsü mevcut gidişatla tutarlı:
- **EU AI Act, Madde 53:** Ağustos 2025'ten itibaren genel amaçlı AI (GPAI) sağlayıcıları eğitim verisinin özetini yayınlamak zorunda; AI Office 24 Temmuz 2025'te zorunlu şablonu yayınladı. Ancak şablon **toplam/aggregate** düzeyde — eser-bazında açıklama yok; bu da küçük yaratıcılar yerine büyük yayıncılarla **toplu lisanslamayı** kolaylaştırıyor ([Irish Legal](https://www.irishlegal.com/articles/analysis-the-eus-ai-training-data-template-clarity-for-developers-uncertainty-for-creators), [William Fry](https://www.williamfry.com/knowledge/eu-releases-ai-training-data-template/)).
- **Davalar:** Authors Guild + 17 yazar (Grisham, Martin, Franzen...) OpenAI'a dava açtı (Eylül 2023); NYT, OpenAI + Microsoft'a dava açtı (Aralık 2023), "milyarlarca dolar" zarar ve modellerin imhasını talep etti ([TechCrunch](https://techcrunch.com/2023/12/27/the-new-york-times-wants-openai-and-microsoft-to-pay-for-training-data/), [Al Jazeera](https://www.aljazeera.com/news/2023/9/21/openai-sued)).
- **Lisans anlaşmaları:** OpenAI–Financial Times, OpenAI–The Atlantic; Google–News Corp, Google–Reddit. Yani "para kazanma modeli" şimdiden kuruluyor; ama bu çoğunlukla büyük yayıncılar için — bireysel yazar için "book-level attribution analytics" aracı henüz emekleme/öneri aşamasında (Koray'ın tahmini ⚠️).

### 8. Arama trendleri: "AI humanizer" artışı doğrulandı, "AI writer" düşüşü teyit edilemedi

- ✅ "AI humanizer" talebinin arttığı doğrulanıyor; akademik takvime bağlı olarak zirveler yaşıyor (Nisan 2025 bahar dönemi), detektörlerden (Turnitin, GPTZero, Originality.ai) kaçınma ihtiyacıyla büyüyor ([getfoureyes.com](https://getfoureyes.com/s/cNQ4D/), [ranktracker.com](https://www.ranktracker.com/et/blog/ai-humanizing-content-is-it-effective-for-google-rankings-in-2024/)).
- ⚠️ "AI writer / AI content writer" talebinin **düştüğünü** gösteren doğrudan karşılaştırmalı Google Trends verisi bulunamadı. Bu iddia bağımsız olarak doğrulanmadı; proje başında Google Trends'te `AI writer` vs `AI humanizer` karşılaştırması bizzat çekilmeli.

### 9. Tespitin matematiği: perplexity, burstiness ve "Türk polisi" analojisi

Koray'ın "detektör suçu kanıtlayamaz, eşik üstünü suçlu varsayar" analojisi, detektörlerin gerçek çalışma biçimiyle örtüşüyor:
- **Perplexity**: kelimelerin ne kadar tahmin edilebilir olduğu; AI metni düşük perplexity (olası token seçer), insan metni yüksek.
- **Burstiness**: cümle uzunluğu/ritim varyasyonu; insan iniş-çıkışlı, AI düz.
- Detektörler bu istatistiklerden bir **olasılık skoru** üretir ve bir **eşiğin** üstünü "AI" sayar — kesin kanıt değil, çıkarım. Bu yüzden Koray'ın "kanıtlayamazlar" tezi matematiksel olarak doğru ([stack-junkie.com](https://www.stack-junkie.com/blog/how-ai-detectors-actually-work), [g2.com](https://learn.g2.com/how-do-ai-detectors-work)).

**Yanlış pozitifler (false positives) — ✅ doğrulandı:**
- İncil ve ABD Anayasası gibi tanıdık/biçimsel metinler AI olarak işaretlenir. ZeroGPT ABD Anayasası'nın %92.15'ini "AI" dedi; İncil pasajları da AI çıkıyor. Neden: bu metinler çok "tahmin edilebilir" (düşük perplexity) ([Ars Technica üzerinden Analytics Vidhya](https://www.analyticsvidhya.com/blog/2023/04/ai-detection-can-ai-generated-content-really-be-detected/), [senseient.com](https://senseient.com/ride-the-lightning/ai-detector-believes-the-u-s-constitution-was-written-by-ai/)). Koray'ın İncil anekdotu doğrulanıyor.
- **Stanford (Patterns, 10 Temmuz 2023):** 7 detektör, TOEFL (ana dili İngilizce olmayan) denemelerini ortalama **%61.3** yanlış pozitif oranıyla "AI" işaretledi; bir detektör %98'e kadar çıktı. Ana dili İngilizce olanların yazıları neredeyse hiç işaretlenmedi. Neden yine perplexity: ikinci dil yazarları daha yaygın kelime/basit yapı kullanır ([Stanford HAI üzerinden TechLearning](https://www.techlearning.com/news/ai-detectors-discriminate-against-non-native-speakers-says-stanford-research), [scimex.org](https://www.scimex.org/newsfeed/gpt-detectors-can-be-biased-against-non-native-english-writers)). Vanderbilt, Ağustos 2023'te Turnitin AI detektörünü yanlış pozitifler nedeniyle devre dışı bıraktı.

### 10. Blacklist kelimeler ve "AI tell"leri — ✅ doğrulandı (ama tek başına kanıt değil)

- **Pew Research** (Common Crawl, Ocak 2021 – Temmuz 2026, ~500.000 örnek): ChatGPT sonrası em dash kullanımı **iki katına** çıktı; "delve", "testament", "interplay" iki katına; "not X, but Y" (negative parallelism) neredeyse üç katına; Oxford comma %63 arttı. Chatbot-favori kelimeler: align, showcase, valuable, crucial, underscore, intricate, meticulous, **tapestry**, landscape, pivotal ([Pew üzerinden plusdocs.com](https://plusdocs.com/blog/the-most-overused-chatgpt-words), [ruben.substack.com/p/delve](https://ruben.substack.com/p/delve)).
- **Kritik uyarı:** Hiçbir kelime tek başına kanıt değildir; bu işaretler "aranan tell"lerdir ama tek başlarına hiçbir şey ispatlamaz. Koray'ın stratejisi (blacklist oluşturup bunlardan kaçınmak) mantıklı; ama "matematiksel olarak tespiti imkânsız kılar" iddiası fazla kesin (⚠️) — insanlaştırma riski azaltır, sıfırlamaz.

### 11. SynthID (Google DeepMind) watermarking — tespitin geleceği

Koray "tespit her yıl kolaylaşacak" diyor. Watermarking bunu farklı bir yoldan yapıyor:
- **SynthID-Text** (Nature, Dathathri ve ark., 2024; Hugging Face Transformers v4.46.0): üretim anında token seçimine, bağlamdan türetilen bir **g-function** ve **tournament sampling** ile fark edilmez bir istatistiksel imza gömer; aynı anahtarla eğitilmiş bir detektör bunu geri okur ([Hugging Face](https://www.huggingface.co/blog/synthid-text), [KDnuggets](https://www.kdnuggets.com/synthid-what-it-is-and-how-it-works)).
- Perplexity/burstiness **çıkarımsal ve hataya açıkken**, watermarking **kasıtlı ve güvenilir** — ama yalnızca watermark destekleyen modelin ürettiği metinde çalışır (kapsam sınırı). Küçük düzenleme ve parafraza bir ölçüde dayanıklı.
- Pratik sonuç: humanizer'lar istatistiksel detektörleri yenebilir ama watermark'ı (anahtar bilinmeden) kolay yenemez. "Radarın altında kalma" stratejisi istatistiksel detektörler için geçerli; watermarking yaygınlaşırsa denklem değişir.

### 12. Kısa içerik + token azaltma — matematiksel olarak tutarlı

- ✅ "İçerik kısaysa AI tespiti zorlaşır": Detektörler istatistiksel hesap için **yeterli örnekleme** ister; üç-dört cümlede perplexity/burstiness güvenilir skor üretemez. Çoğu detektör zaten minimum kelime eşiği (ör. ~50–300 kelime) ister ([proton.me](https://proton.me/business/blog/are-ai-detectors-accurate)). Koray'ın `audiototext.com` örneği bu yüzden "geçersiz tespit" veriyor.
- ⚠️ "Daha az token → her kelime relevance'a daha çok katkı" (hipotez; sabit skor kanıtı yok): bu, 01. bölümdeki "ilk %2 token'a önemli n-gram/entity yerleştirme" ve token dilüsyonundan kaçınma prensibiyle aynı mantık.
- ⚠️ Risk: aşırı kısa içerik "thin content" sinyali verebilir; görsel annotation + structured data ile desteklenmezse sıralama kaybı olur. Koray bunu zaten görsel semantikle dengeliyor.

---

## Doğrulama tablosu

| İddia | Durum | Kaynak |
|---|---|---|
| Herkes uzman metin üretebildiği için metin tek başına özgünlüğü kanıtlamıyor | ✅ | [Google 2023 rehberi](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content) |
| Google üretim yöntemine değil kaliteye bakar; AI'yı manipülasyon için kullanmak spam | ✅ | [Google Search Central](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content) |
| QRG Ocak 2025: çabasız AI ana içeriği "Lowest" | ✅ | [PPC Land](https://ppc.land/google-updates-quality-rater-guidelines-with-ai-content-evaluation-criteria/), [Originality.ai](https://originality.ai/blog/google-search-quality-rater-guidelines-ai) |
| Mart 2024 update: scaled content abuse politikası, yüzlerce site deindexlendi | ✅ | [SEJ](https://www.searchenginejournal.com/google-march-2024-core-update/506070/), [Originality.ai](https://originality.ai/blog/google-march-2024-manual-action-ai-update-list) |
| Ölçek-cezası marka/link gücünü de ezebilir (çok hızlı = tam otomatik sınıfı) | ⚠️ | [SE Ranking](https://seranking.com/blog/seo-news-march-2024-core-update-spam-policies/) (prensip doğru; "her zaman ezer" kesinliği yok) |
| GeneratePress teması footprint olarak ceza nedeni oldu | ⚠️/❓ | [Originality.ai](https://originality.ai/blog/will-google-penalize-ai-content) (korelasyon var, nedensellik doğrulanmadı) |
| BrowserStack 2.000 AI dokümanıyla 8 ayda %70 trafik kaybetti | ❓ | Teyit edilemedi; aksi örnek [buildd.co](https://buildd.co/marketing/browserstack-seo-strategy) |
| Ölçekli AI içeriği genelde büyük trafik kaybına yol açar ("Mount AI") | ⚠️ Sınırlı vaka/yorum; genel nedensellik değil | [authoritytech.io](https://authoritytech.io/curated/content-volume-trap-ai-visibility-audit-2026.md), [dev.to](https://dev.to/martinschenk/i-auto-published-2300-ai-articles-google-buried-90-of-my-traffic-424o) |
| Lovable/AI builder siteleri aynı class/div footprint'leri bırakır | ✅ | [dreasays.substack.com](https://dreasays.substack.com/p/the-lovable-seo-problem), [SEOJuice](https://seojuice.com/tools/vibe-coded/) |
| Bazı AI builder yapılandırmaları client-side render ile boş `<div>` sunabilir | ⚠️ Yapılandırmaya bağlı teknik örnek | [ranked.ai](https://www.ranked.ai/docs/custom-cms-guides/how-to-add-seo-to-lovable-replit-ai-coded-sites) |
| Tamamen AI yazımı eser telif kaybedebilir | ✅ | [Thaler v. Perlmutter](https://www.jdsupra.com/legalnews/thaler-v-perlmutter-human-authorship-8871308/), [US Copyright Office](https://www.clarkhill.com/news-events/news/u-s-copyright-office-ponders-copyright-protection-for-ai-generated-works-following-d-c-circuits-thaler-decision/) |
| AI-yardımlı eser (insan seçim/düzenleme) telif korur | ✅ | [US Copyright Office Ocak 2025 raporu](https://www.clarkhill.com/news-events/news/u-s-copyright-office-ponders-copyright-protection-for-ai-generated-works-following-d-c-circuits-thaler-decision/) |
| Üniversiteler AI ile yazılmış PhD'yi reddediyor | ⚠️ | [Scroll.in/UGC](https://scroll.in/article/1094060/scroll_in), [HKU](https://news.tvb.com/en/803071-SuspecteduseofAIforHKUdoctoralthesis) (beyansız/ana içerik AI ise; mutlak değil) |
| Eğitim verisi için küresel düzenleme + tazminat/lisans geliyor | ✅ | [EU AI Act Madde 53](https://www.williamfry.com/knowledge/eu-releases-ai-training-data-template/), [NYT v. OpenAI](https://techcrunch.com/2023/12/27/the-new-york-times-wants-openai-and-microsoft-to-pay-for-training-data/) |
| Kitap/veri kullanımını izleyen attribution analytics + gelir modeli | ⚠️ | Toplu lisanslar var; bireysel "book-level" izleme aracı henüz olgun değil |
| "AI humanizer" arama talebi artıyor | ✅ | [getfoureyes.com](https://getfoureyes.com/s/cNQ4D/) |
| "AI writer" arama talebi düşüyor | ⚠️ | Doğrudan karşılaştırmalı Trends verisi bulunamadı |
| AI tespiti kanıt değil çıkarımdır; eşik üstünü suçlu varsayar ("Türk polisi") | ✅ | [stack-junkie.com](https://www.stack-junkie.com/blog/how-ai-detectors-actually-work) |
| İncil / ABD Anayasası AI olarak işaretleniyor (false positive) | ✅ | [Analytics Vidhya](https://www.analyticsvidhya.com/blog/2023/04/ai-detection-can-ai-generated-content-really-be-detected/), [senseient.com](https://senseient.com/ride-the-lightning/ai-detector-believes-the-u-s-constitution-was-written-by-ai/) |
| Detektörler ana dili İngilizce olmayanlara karşı yanlı | ✅ | [Stanford/Patterns](https://www.techlearning.com/news/ai-detectors-discriminate-against-non-native-speakers-says-stanford-research) |
| Em dash, "delve", "tapestry" vb. AI tell'leri gerçek | ✅ | [Pew/plusdocs](https://plusdocs.com/blog/the-most-overused-chatgpt-words), [ruben.substack](https://ruben.substack.com/p/delve) |
| Blacklist ile AI'yı "matematiksel olarak tespit edilemez" kılma | ⚠️ | Riski azaltır, sıfırlamaz; watermarking ayrı tehdit ([SynthID](https://www.huggingface.co/blog/synthid-text)) |
| Kısa içerikte AI tespiti güvenilmez/geçersiz | ✅ | [proton.me](https://proton.me/business/blog/are-ai-detectors-accurate) |
| SynthID watermarking tespiti güvenilir ama kapsamı sınırlı | ✅ | [Hugging Face](https://www.huggingface.co/blog/synthid-text) |
| Ekip AI ile büyüdü, çıktı 10x, writer→developer dönüşümü | — | Koray'ın kendi operasyonel ifadesi (doğrulanabilir dış kaynak yok) |

---

## Uygulama SOP'si

### A) İçerik özgünlük & AI-tespit riskini azaltma prosedürü

1. **Üretim yöntemini değil kaliteyi hedefle.** Her sayfa için "Who / How / Why" testini uygula: kim üretti, nasıl üretildi, neden üretildi. AI'yı yalnızca sıralama için ölçek üretiminde kullanma.
2. **Çabanın görünür olduğu bir orijinallik katmanı ekle.** Özgün veri, ekran görüntüsü, orijinal görsel/diyagram, birinci-el deneyim, uzman alıntısı, özel hesaplama/araç. (QRG 4.6.6'nın "effort/originality/value" üçlüsünü karşıla.)
3. **Bilgi açıklığı uygula.** Dolguyu azalt; gerçek kullanıcı yanıtını erken ver. %2 token hipotezdir. Görsel/schema tek başına ince içeriği değerli yapmaz; gerçek çıktı ve yeterli açıklama gerekir.
4. **Blacklist uygula (aşağıdaki listeler).** İçeriği yayından önce blacklist taramasından geçir; eşleşmeleri insanlaştır.
5. **Burstiness enjekte et.** Cümle uzunluklarını değiştir (kısa–uzun–kısa), yapısal çeşitlilik ekle, tek-tip paragraf ritminden kaç.
6. **HTML/CSS footprint temizliği yap (aşağıdaki checklist).**
7. **Detektörle self-test et (göstergesel).** Yayından önce içeriği birden fazla detektörden geçir; yüksek skorları insanlaştır. Ama unutma: detektör skoru kanıt değil, yalnızca risk göstergesidir; kısa içerikte sonuç geçersizdir.
8. **Watermark farkındalığı.** Watermark destekleyen modellerin (örn. Gemini/SynthID) ham çıktısını aynen yayınlama; yeniden yapılandır, kaynak çeşitlendir.
9. **Hukuki sigorta.** Telif değeri taşıyan eserlerde (kitap, uzun kılavuz) AI'yı yalnızca yardımcı araç olarak kullan; seçim/düzenleme/kurguyu insanla yap ve kayıt altına al (copyright savunması için).

### B) Başlangıç "yasaklı kelime / yapı" listesi

> Amaç: tek bir kelime kanıt değildir; bu liste **aşırı yoğunluğu** kırmak içindir, körlemesine silmek için değil. Doğal akışı bozma.

**İngilizce — aşırı kullanılan "AI tell" kelimeleri (azalt/çeşitlendir):**
`delve, tapestry, testament, interplay, intricate, meticulous, meticulously, pivotal, crucial, underscore, showcase, align, valuable, realm, nuanced, robust, seamless, leverage, foster, navigate (mecazi), elevate, embark, unleash, unlock, harness, bustling, vibrant, ever-evolving, game-changer, cutting-edge, dive in, in today's digital world, it's important to note, when it comes to, in conclusion, moreover, furthermore`

**İngilizce — yasaklı yapı/noktalama kalıpları:**
- Em dash (—) aşırı kullanımı → yarıya indir; virgül/parantez ile değiştir.
- "It is not X, but Y" (negative parallelism) → üç cümlede bir sınırını aşma.
- "Not only... but also..." zincirleri.
- Her paragrafın "In conclusion / Overall / Ultimately" ile kapanması.
- Her bölümün üçlü listeyle ("A, B, and C") bitmesi.
- Oxford comma'nın %100 tutarlı kullanımı (insan yazısı daha tutarsızdır).
- Aşırı simetrik paragraf uzunlukları.

**Türkçe — aşırı kullanılan AI kalıpları (azalt/çeşitlendir):**
`önemli bir rol oynamaktadır, dikkat çekmektedir, göz önünde bulundurmak gerekir, unutulmamalıdır ki, sonuç olarak, özetle, bu bağlamda, bu noktada, kritik öneme sahip, hayati önem taşır, dinamik, yenilikçi, benzersiz bir deneyim, kusursuz, sorunsuz, zengin bir yelpaze, derinlemesine ele almak, mercek altına almak, ön plana çıkmaktadır, göz ardı edilmemelidir`

**Türkçe — yasaklı yapı kalıpları:**
- Her paragrafı "Sonuç olarak / Özetle / Kısacası" ile bitirmek.
- "Hem... hem de..." ve "Sadece... değil, aynı zamanda..." aşırı tekrarı.
- Her cümlenin "-mektedir/-maktadır" geniş zaman eki ile bitmesi (ritim düzleşir).
- Üçlü paralel sıralamaların her bölümde tekrarı.
- Tüm cümlelerin benzer uzunlukta olması (burstiness düşüklüğü).

### C) HTML/CSS kalite checklist'i

1. Yanlış demo title/description ve placeholder metni kaldır; doğru metadata'yı koru.
2. Class/ID adı tek başına AI kökeni veya ceza kanıtı değildir; yalnız bakım, tutarlılık veya erişilebilirlik için değiştir.
3. İşlevsiz demo bileşenleri ve ölü/kopya CSS'i kaldır; özgün kullanıcı işlevini koru.
4. Gerçek metin ve bağlantıları kaynak HTML'de sun; JavaScript sonrası kullanılabilirliği ayrıca kontrol et.
5. Gezinti gerçek href, formlar etiketli, başlıklar mantıklı olsun.
6. JSON-LD görünür içerikle uyumlu olsun; sahte uzman, oy veya forum ekleme.
7. Canonical/robots/sitemap ortam ve yayın kapsamına göre kontrol edilsin.
8. Dosya adı/alt metni tanımlayıcı olsun; lisans, kredi ve gerekli provenance silinmesin.
9. US baskı terminolojisindeki “landscape” gibi doğru nitelikleri dil blacklist'i nedeniyle kaldırma.
10. İlk %2 token veya dedektör skoru kabul kapısı değildir; doğruluk ve görev tamamlama test edilir.
11. Yalnız gerçekten üretilmiş veri/görsel/araç için özgün emek kaydı tutulur.

### D) AI-destekli ekip kurma SOP'si (writer→developer dönüşümü)

1. **İnsanı koru, beklentiyi yükselt.** Çalışanı makineyle değiştirme; her role AI kaldıracı ekleyerek çıktı hedefini 10x'le.
2. **Rol başına bir "Claude skill" / SOP paketi oluştur.** Örn. grafik tasarımcı için "tüm siteyi tamamla" skill'i; writer için "query deserves page/heading/section" SOP'si.
3. **Writer→developer köprüsü:** Tasarıma ilgi duyan writer'a Claude/Codex erişimi ver; adım adım SOP ile küçük developer görevlerinden başlat.
4. **İş akışını standartlaştır.** Doğruluk, demo/yanlış meta, kaynak ve işlev QA kapısı olsun. Dil blacklist'i editöryal öneridir; doğru teknik terimleri silmez.
5. **Rol dağılımını kaydır.** Zamanla designer/developer sayısını artır, saf writer sayısını azalt; herkesi "çok-rollü" hale getir.
6. **Kalite kapıları:** Her AI-yardımlı çıktı insan onayından geçsin (QRG "effort/originality/value" testi + telif kontrolü).
7. **Talep büyüdükçe ekip büyüt.** Verimlilik artışını işten çıkarmaya değil, kapasite/portföy büyütmeye yönlendir.

---

## Proje kontrol listesi

- [ ] Her sayfa için "Who/How/Why" + QRG 4.6.6 (effort/originality/value) testi geçti mi?
- [ ] Sayfada en az bir özgün insan-emeği sinyali var mı (orijinal veri/görsel/araç/deneyim)?
- [ ] İçerik İngilizce blacklist taramasından geçti mi?
- [ ] İçerik Türkçe blacklist taramasından geçti mi?
- [ ] Burstiness (cümle uzunluğu/yapı çeşitliliği) kontrol edildi mi?
- [ ] Em dash / negative parallelism / tek-tip kapanış kalıpları seyreltildi mi?
- [ ] HTML footprint checklist'i (meta, class, skeleton) tamamlandı mı?
- [ ] Render modeli crawler-dostu mu (SSR/SSG; gerçek `<a>` linkleri; dolu kaynak HTML)?
- [ ] Tek H1 + doğru heading hiyerarşisi + structured data var mı?
- [ ] Canonical/robots/sitemap doğru mu?
- [ ] AI üretimi görsellerin dosya adı/alt/metadata'sı temizlendi mi?
- [ ] Class değişikliği gerekiyorsa bakım/erişilebilirlik gerekçesi var mı? AI gizleme zorunluluğu çıkarılmadı mı?
- [ ] Önemli entity ve doğru görev erken açıklanıyor mu; gerekli bilgi korunuyor mu?
- [ ] Kısa sayfa "thin content" riskine karşı görsel annotation + schema ile desteklendi mi?
- [ ] Detektör self-testi yapıldı mı (yalnızca gösterge olarak; kısa içerikte atla)?
- [ ] Watermark riski değerlendirildi mi (ham watermarklı çıktı doğrudan yayınlanmadı)?
- [ ] Telif değerli eserlerde insan seçim/düzenleme kaydı tutuldu mu?
- [ ] Yayın QA kapasitesine bağlı mı; kanıtlanmamış evrensel hız/ceza eşiği kullanılmıyor mu?

---

## Riskler ve politika uyarıları

- **"AI yasak değil ama çabasız AI cezalı."** Google AI'yı yasaklamıyor; hedef çabasız/değersiz ölçek içeriği. Footprint temizlemek **kaliteyi** ikame etmez; sadece imza riskini azaltır.
- **Ölçek-cezası gerçek ve marka gücünü aşabilir.** Mart 2024 deindexlemeleri, scaled content abuse'ün güçlü sitelerde bile tetiklenebildiğini gösterdi. Hız kontrolü (bkz. ilgili bölüm) footprint'ten daha belirleyici olabilir.
- **GeneratePress/BrowserStack iddiaları teyit edilemedi.** Playbook'ta bunları "kanıt" değil "örnek/hipotez" olarak kullan; projeye özel verilerle doğrula.
- **Detektör skoru kanıt değildir.** False positive oranları yüksek (İncil, Anayasa, ana dili İngilizce olmayanlar). Detektörü karar mekanizması değil, yalnızca risk sinyali olarak kullan.
- **Blacklist mutlak koruma sağlamaz.** İstatistiksel detektörleri yanıltabilir ama watermarking (SynthID) yaygınlaşırsa kelime-temelli kaçınma yetmez.
- **Humanizer araçları çift taraflı risk.** Detektörden kaçınmak için kullanılabilir ama akademik/yayıncı bağlamında etik/politika ihlali sayılabilir.
- **Telif riski üretim yöntemine bağlı.** Tamamen AI yazımı eser ABD'de telifsiz; AI-yardımlı insan eseri korunur. Kurumsal/kitap projelerinde insan katkısını belgelendir.
- **Akademik kullanım.** "Üniversite AI'yı reddediyor" genellemesi yanlış; sorun **beyansız** veya **ana içeriğin AI'ya yazdırılması**. Beyan + denetimli yardımcı kullanım çoğu kurumda serbest.
- **Düzenleme geliyor.** EU AI Act Madde 53 transparency + telif davaları + lisans anlaşmaları, "veri kullanımı bedelsiz kalmayacak" yönünü destekliyor; iş modellerini buna göre kur.

---

## Ölçüm / KPI

- **AI detektör skoru dağılımı** (yayın öncesi): sayfa başına ortalama ve eşik üstü oranı — zamanla düşmeli (yalnızca ≥ min kelime eşiğindeki sayfalar için).
- **Footprint temizlik kapsamı:** AI-builder ile üretilen sayfalarda checklist tamamlama oranı (%).
- **Indexleme sağlığı:** AI-üretimi bölümlerde index kapsama oranı, deindex/manual action olay sayısı.
- **Core/spam update dayanıklılığı:** Her core update sonrası trafik delta'sı (ölçek-cezası erken uyarısı).
- **Token verimliliği:** Sayfa başına kelime sayısı vs. organik tıklama/empresyon (az token → yüksek relevance hipotezini test et).
- **Orijinallik sinyali kapsamı:** Özgün veri/görsel/araç içeren sayfa oranı (%).
- **Trend takibi:** Google Trends'te "AI writer" vs "AI humanizer" (iddiayı projede doğrula).
- **Ekip verimliliği:** Çalışan başına tamamlanan site/makale sayısı (10x hedefine karşı), writer→developer dönüşüm oranı.
- **Hukuki uyum:** Telif-değerli eserlerde insan-katkı kaydı tamamlanma oranı (%).

---

## Kaynaklar

- Google — AI içerik rehberi (2023): https://developers.google.com/search/blog/2023/02/google-search-and-ai-content
- QRG Ocak 2025 güncellemesi (PPC Land): https://ppc.land/google-updates-quality-rater-guidelines-with-ai-content-evaluation-criteria/
- QRG & AI (Originality.ai): https://originality.ai/blog/google-search-quality-rater-guidelines-ai
- Mart 2024 core update (Search Engine Journal): https://www.searchenginejournal.com/google-march-2024-core-update/506070/
- Mart 2024 spam politikaları (SE Ranking): https://seranking.com/blog/seo-news-march-2024-core-update-spam-policies/
- Mart 2024 manuel aksiyon listesi (Originality.ai): https://originality.ai/blog/google-march-2024-manual-action-ai-update-list
- Google AI içerik cezası analizi (Originality.ai): https://originality.ai/blog/will-google-penalize-ai-content
- BrowserStack SEO vaka (buildd.co): https://buildd.co/marketing/browserstack-seo-strategy
- "Content volume trap" / Mount AI (authoritytech.io): https://authoritytech.io/curated/content-volume-trap-ai-visibility-audit-2026.md
- 2.300 AI makalesi vakası (dev.to): https://dev.to/martinschenk/i-auto-published-2300-ai-articles-google-buried-90-of-my-traffic-424o
- Lovable SEO sorunu (dreasays.substack.com): https://dreasays.substack.com/p/the-lovable-seo-problem
- Vibe-coded footprint aracı (SEOJuice): https://seojuice.com/tools/vibe-coded/
- Lovable/Replit AI site SEO (ranked.ai): https://www.ranked.ai/docs/custom-cms-guides/how-to-add-seo-to-lovable-replit-ai-coded-sites
- Lovable + SEO (cmo.beehiiv.com): https://cmo.beehiiv.com/p/using-lovable-for-your-website-think-again-if-you-care-about-seo
- Thaler v. Perlmutter (JD Supra): https://www.jdsupra.com/legalnews/thaler-v-perlmutter-human-authorship-8871308/
- US Copyright Office / Thaler sonrası (Clark Hill): https://www.clarkhill.com/news-events/news/u-s-copyright-office-ponders-copyright-protection-for-ai-generated-works-following-d-c-circuits-thaler-decision/
- UGC / Bihar Üniversitesi AI tez reddi (Scroll.in): https://scroll.in/article/1094060/scroll_in
- HKU AI doktora soruşturması (TVB News): https://news.tvb.com/en/803071-SuspecteduseofAIforHKUdoctoralthesis
- EU AI Act eğitim verisi şablonu (William Fry): https://www.williamfry.com/knowledge/eu-releases-ai-training-data-template/
- EU AI Act analizi (Irish Legal): https://www.irishlegal.com/articles/analysis-the-eus-ai-training-data-template-clarity-for-developers-uncertainty-for-creators
- NYT v. OpenAI/Microsoft (TechCrunch): https://techcrunch.com/2023/12/27/the-new-york-times-wants-openai-and-microsoft-to-pay-for-training-data/
- Authors Guild v. OpenAI (Al Jazeera): https://www.aljazeera.com/news/2023/9/21/openai-sued
- "AI humanizer" trend (getfoureyes.com): https://getfoureyes.com/s/cNQ4D/
- AI humanizing & rankings (ranktracker.com): https://www.ranktracker.com/et/blog/ai-humanizing-content-is-it-effective-for-google-rankings-in-2024/
- AI detektör çalışma mantığı (stack-junkie.com): https://www.stack-junkie.com/blog/how-ai-detectors-actually-work
- AI detektör doğruluğu (proton.me): https://proton.me/business/blog/are-ai-detectors-accurate
- ABD Anayasası AI tespiti (Analytics Vidhya): https://www.analyticsvidhya.com/blog/2023/04/ai-detection-can-ai-generated-content-really-be-detected/
- Anayasa "AI yazdı" (senseient.com): https://senseient.com/ride-the-lightning/ai-detector-believes-the-u-s-constitution-was-written-by-ai/
- Stanford non-native bias (TechLearning): https://www.techlearning.com/news/ai-detectors-discriminate-against-non-native-speakers-says-stanford-research
- GPT detektör bias (scimex.org): https://www.scimex.org/newsfeed/gpt-detectors-can-be-biased-against-non-native-english-writers
- Aşırı kullanılan ChatGPT kelimeleri / Pew (plusdocs.com): https://plusdocs.com/blog/the-most-overused-chatgpt-words
- "delve" analizi (ruben.substack.com): https://ruben.substack.com/p/delve
- SynthID Text (Hugging Face): https://www.huggingface.co/blog/synthid-text
- SynthID nasıl çalışır (KDnuggets): https://www.kdnuggets.com/synthid-what-it-is-and-how-it-works

---

# 03 — Ölçekli İçerik ve Yayın Hızı

> **Uygulama statüsü:** Röportaj alıntısı, vaka/araştırma ve resmi kural ayrı değerlendirilir. Aşağıdaki SOP/checklist proje kabul ölçütü olarak [kanıt politikası](KANIT-POLITIKASI.md) ile birlikte okunur; %2/~400 karakter/90 gün/%20–30/rastgelelik Google zorunluluğu değildir.


> Kaynak röportaj: Koray Tuğberk GÜBÜR × Julian Goldie (transkript: `seo-talks-whisper.txt`, satır ~59–98).
> Bu bölüm, içeriği **ölçekli** üretirken Google'ın "scaled content abuse" (ölçekli içerik istismarı) sınıflandırıcısına yakalanmadan nasıl **yayın hızı (publishing velocity)** planlanacağını anlatır. Reddit/hesap ısıtma konusuna sadece değinilir; derin anlatım **Bölüm 07**'de.

---

## Röportajda söylenenler (eksiksiz liste)

- Google, "scale content abuse" (ölçekli içerik istismarı) konusunda giderek **daha hassas** hale geldi; eski WordPress + GeneratePress yığın içerik siteleri "AI üretimi" olarak kolayca sınıflandırılıp ceza aldı (satır 57–60).
- Koray, **BrowserStack** için bir denetim (audit) yaptı: şirketin **23.000 referring domain**'i, **300.000 aylık marka araması (brand search demand)** var ve alanının **en büyük** şirketi; buna rağmen **tek günde 2.000 dokümanı AI ile yayınladıkları için 8 ayda trafiğinin %70'ini kaybetti** (satır 60–62).
- Çıkarım: Google'ın **"scaled content" karar ağaçları (decision trees) diğer tüm kararları eziyor**. Çok hızlı ölçeklendiğin görülürse site **"full automated" (tamamen otomatik)** olarak sınıflanır; **güçlü marka olman ya da güçlü link grafiğin (referring domain ağın) olması fark etmez** (satır 62–65).
- Bu, Koray'ın 5,5 yıldır savunduğu eski inancı sarsıyor: eskiden "marka araması + güçlü link grafiği olan siteye Google tolerans gösterir" sanılırdı; **artık durum farklı** (satır 65–68).
- "Çok hızlı ne kadar hızlıdır?" sorusu: Koray yüzlerce makale üretti ama hiç 2.000 gibi bir sayı denemedi; bunu "çılgınca" buluyor (satır 68–70).
- Öncelik **frekans değil, subfolder/sitenin yaşıdır**. Önce klasörün/sitenin yaşı anlaşılmalı (satır 70–72).
- **Yeni bir subfolder'ın 7 günde 1.000 URL'ye çıkması kötüdür** (satır 72–73).
- Doğru yaklaşım: klasörü **3–4 ay yaşlandır (age)**, sonra **artan frekansla** yayınla (örn. 50, 60, 70) — çünkü o noktada **tıklama verisi (click data) seni tatmin edici kaynak olarak onaylamaya** başlar (satır 73–75).
- Koray tüm içerik ağını (network) genelde **7–8 ayda** tamamlar (satır 75).
- **Formül**: 5.000 sayfa yayınlanacaksa, **ilk 3 ay yavaş** git, kalan ~4 ay için **günde kaç yayınlanacağını hesapla** (toplamı gün sayısına böl), sonra **günlük sayıyı randomize et** — bir gün 2, ertesi gün 27, sonra 7, 8... ama sonuçta 7–8 ayda ağ tamamlanır (satır 76–79).
- Birçok şirket aniden **çok yüksek sayılarda** yayınlıyor; **URL tıklama sinyali olmayan taze bir subfolder'da** bu, **tüm sitenin sağlığını riske atar** (satır 79–81).
- Hız **konuya (topic) bağlıdır**: CBD "strain" sektöründe toplam **~6.400 strain türü** olduğundan çok sayıda yayınlamak normaldir; araba modeli dizini (car model directory) gibi her yıl binlerce model olan konularda **günde 3** yayınlarsan bitirmek **yıllar alır** ve o zamanın yok (satır 81–84).
- Dolayısıyla **risk ile hız arasında optimum denge** bulunmalı; sağlıklı ama hızlı gitmek (satır 84–85).
- **En önemli şey: subfolder'ı 3 ay olgunlaştırmak (maturing).** Olgunluk kazanınca ölçeklemek daha güvenlidir (satır 85–86).
- Aynı **ısıtma (warm-up) mantığı** subreddit'ler ve hesaplar için de geçerli: subreddit aç, 3 ay beklet, sonra içerik yayınla — Reddit'in dahili spam tespitine karşı daha az kırılgan olur. Aynısı ana kullanıcı hesapları ve AdsPower proxy/hesapları için de geçerli (yarı-aktif ısıtma, 3 ay). Bu bir **"warm-up eşiği"**; hesaba/subreddit'e/subfolder'a güven kazandırma (satır 86–95). *(Reddit detayı → Bölüm 07.)*

---

## Derinleştirme: araştırma bulguları

### 1) Google'ın "scaled content abuse" politikası (Mart 2024)
Google, Mart 2024 spam güncellemesiyle üç yeni spam politikası ilan etti: **scaled content abuse**, **site reputation abuse (parasite SEO)** ve **expired domain abuse**. Kritik değişiklik: eski politika sadece "otomatik üretilmiş içerik"i hedeflerken, yeni politika **içeriğin nasıl üretildiğine bakmaksızın** (otomasyon, insan ya da ikisinin karışımı) **arama sıralamasını manipüle etmek için ölçekli üretim**i hedefliyor. Google, bu güncelleme + önceki çabalarla düşük kaliteli/özgün olmayan içeriği arama sonuçlarında **%40 azaltmayı** beklediğini açıkladı. Scaled content abuse ve expired domain abuse hemen, site reputation abuse ise **7 Mayıs 2024**'te manuel aksiyonlarla, **19 Kasım 2024**'te ise algoritmik olarak devreye girdi. Bu, Koray'ın "scaled content artık markayı bile dinlemiyor" gözlemini birebir destekler.

### 2) Mueller'in "frekans sıralama faktörü değil" söylemiyle görünürdeki çelişki
John Mueller yıllardır **yayın frekansının bir sıralama faktörü olmadığını**, toplu yayının (40–50 makaleyi birden açmak) **tek başına spam olmadığını** söyledi: "içerik, yayınlanma şeklinden ötürü spam sayılmaz; junk, junk olduğu için junk'tır". Bu, Koray'la çelişiyor **görünür** — ama aslında çelişmez. Mueller'in dediği: *yüksek hız ödül değildir ve kaliteli toplu içeriğe ceza yoktur.* Koray'ın dediği: *düşük güvenli/taze bir bölümde ani ölçek, kalite sınıflandırıcısını tetikleyip "scaled content abuse" sınıfına sokar.* Yani asıl değişken **hız değil, hız × (güven + tıklama verisi + özgünlük) birleşimidir.** Mueller'in kendisi de "daha sık taranmak için zorlamak işe yaramaz" diyerek hızı manipülasyon aracı olmaktan çıkarır. İki görüş birlikte okununca Koray'ın modeli tutarlıdır: **hız serbesttir ama güven kazanılmadan kullanılan hız risktir.**

### 3) Tıklama verisi (Navboost) — "click data seni onaylar" ne demek?
DOJ antitröst davasında Pandu Nayak, **Navboost**'un Google'ın en güçlü sinyallerinden biri olduğunu ve tıklamaya dayandığını doğruladı; mühendis Eric Lehman "clicks are the main signal used by NavBoost" dedi. Sistem **13 aylık kayan pencere** kullanır ve `goodClicks`, `badClicks`, `lastLongestClicks` metriklerini izler (API leak bunları doğruladı). **Kritik sınırlama:** Navboost yalnızca **zaten tıklama verisi biriktirmiş** dokümanların sıralamasını etkiler; **bran-new (taze) sayfalara yardım edemez.** İşte Koray'ın "URL tıklama sinyali olmayan taze subfolder" uyarısının teknik temeli budur: tıklama geçmişi olmayan bir bölüme toplu URL basmak, o bölümü tıklama sinyaliyle savunamaz halde bırakır ve kalite/scaled-content sınıflandırıcısının insafına terk eder.

### 4) "Sandbox" / güven dönemi — 3–4 ay neden?
Google için sabit süreli bir sandbox veya bu projeye uygulanabilir 90 günlük eşik doğrulanmış değildir. Sektör gözlemi: tipik güven dönemi **3–6 ay** (YMYL/rekabetçi nişlerde 8 ay+). Bu, Koray'ın "3–4 ay yaşlandır, sonra kadansı artır" reçetesiyle örtüşür. Isıtma dönemi, bölümün tıklama/etkileşim geçmişi biriktirmesine ve E-E-A-T sinyallerini olgunlaştırmasına izin verir.

### 5) Site-geneli sınıflandırıcılar (site-wide classifiers)
Google, **19 Kasım 2024**'te "Guide to Search ranking systems" sayfasını güncelleyerek **site-geneli sinyaller ve sınıflandırıcılar** kullandığını üst satıra ekledi; Helpful Content sistemi artık tek bir sistem değil, çekirdeğe (core) gömülü sinyaller halinde. Bu, Koray'ın "taze subfolder tüm sitenin sağlığını riske atar" ve "scaled content karar ağacı tetiklenince seni düşürmeye başlar" gözlemini açıklar: ceza sayfa bazlı kalmayıp **bölüm/alt-alan hatta site geneline** yayılabilir.

### 6) Topical Authority çerçevesinde "Publication Momentum"
Koray'ın kendi çerçevesinde **Publication Momentum** = bir konu altında yayının **tutarlılık ve frekansı**; content depth (derinlik) ve content breadth (genişlik) ile birlikte çalışır. API leak'te bir "topical authority" modülünün bulunması bu çerçeveyi doğruladı. Yani yayın hızı, kendi başına değil, **topical map'i tutarlı bir ivmeyle tamamlama** amacına hizmet ettiğinde değerlidir.

### 7) Programatik/ölçekli başarısızlık örnekleri
- **BrowserStack**: Semrush/trafik verisi 2026 boyunca süregelen düşüşü teyit ediyor (organik ve ücretli kanallarda ay-ay gerileme). Ölçekli AI yayınının trafik düşüşüyle *ilişkisi* Koray'ın denetim anlatısına dayanıyor; bağımsız bir "şu gün 2.000 doküman" kaydı halka açık değil (bkz. doğrulama tablosu).
- Koray James Dooley podcast'inde (**"Scaled Content Abuse: Scaling Mass AI Content the Safe Way"**) aynı vakayı ve **oraai.com** örneğini (60 günde ~4 milyon sayfa → önce yükseliş sonra sıfır) anlatıyor.

---

## Doğrulama tablosu

| İddia | Durum | Kaynak / Not |
|---|---|---|
| Google "scaled content abuse" politikası Mart 2024'te ilan edildi; AI+insan fark etmez | ✅ | [Google Search blog, Mart 2024](https://developers.google.com/search/blog/2024/03/core-update-spam-policies) |
| Bu politika düşük kaliteli içeriği ~%40 azaltmayı hedefliyordu | ✅ | [blog.google](https://blog.google/products/search/google-search-update-march-2024/) |
| BrowserStack ~23.000 referring domain | ⚠️ | Koray beyanı (röportaj + [James Dooley podcast](https://jamesdooleypodcast.transistor.fm/609)); bağımsız doğrulanamadı |
| BrowserStack **300.000** aylık marka araması | ❌/⚠️ | Röportaj "300.000" diyor; Koray'ın podcast transkriptinde **200.000** geçiyor — rakam tutarsız, Koray'ın kendi ölçümü |
| BrowserStack 8 ayda trafiğinin %70'ini kaybetti | ⚠️ | Koray beyanı; Semrush [BrowserStack trafik düşüşünü teyit](https://www.semrush.com/website/browserstack.com/overview/) ediyor ama %70/8 ay/neden bağımsız doğrulanmadı |
| Tek günde ~2.000 AI dokümanı yayınladılar | ⚠️ | Koray beyanı ("close to 2,000"); halka açık bağımsız kayıt yok |
| Scaled content karar ağacı marka/link grafiğini ezer ("full automated") | ⚠️ | Koray yorumu; Google politikası "manipülasyon amaçlı ölçek"i hedefler diyerek *yönünü* destekler, ama "markayı tümüyle ezer" ifadesi Koray'ın gözlemi |
| Yayın frekansı tek başına sıralama faktörü değil; toplu yayın ≠ spam | ✅ | [Mueller/Search Engine Journal](https://www.searchenginejournal.com/does-adding-content-daily-increase-rankings/464126), [SE Roundtable](https://www.seroundtable.com/google-sitemap-lastmod-signal-37077.html) |
| Tıklama verisi (Navboost) güçlü sinyal; taze sayfalara yardım edemez | ✅ | [DOJ davası / Navboost](https://www.hobo-web.co.uk/navboost-how-google-uses-large-scale-user-interaction-data-to-rank-websites/) |
| Yeni site/bölüm için 3–6 aylık güven ("sandbox") dönemi etkisi | ⚠️ Uzman/ sektör hipotezi; resmi süre eşiği değil | [wisp.blog sandbox](https://www.wisp.blog/blog/the-google-sandbox-effect-why-your-search-traffic-drops-after-3-6-months) — Google resmi "sandbox"ı reddeder ama etkiyi yaratan algoritmaları kabul eder |
| Site-geneli sınıflandırıcılar (Kasım 2024) | ✅ | [gsqi.com / site-wide classifiers](https://www.gsqi.com/marketing-blog/google-site-reputation-abuse-spam-policy-algorithmic-approach/) |
| CBD/esrar "strain" sayısı ~6.400 | ⚠️✅ | [Leafly ~6.000–7.000 strain](https://www.thebluntness.com/posts/how-many-marijuana-strains-are-there); "named" sayı ~6.400'e uyar, *genetik olarak ayrık* ~700 |
| Araba model dizinlerinde her yıl binlerce model var; günde 3 yayın = yıllar | ✅ (mantıksal) | Aritmetik: 10.000 model ÷ 3/gün ≈ 9+ yıl; sektör ölçeği doğru |
| Reddit subreddit/hesap için 3 ay ısıtma spam tespitini azaltır | ⚠️ | Koray taktiği; platforma özel, bağımsız doğrulanmadı → Bölüm 07 |

**Kanıt ayrımı:** Scaled content politikası resmi kaynaktır. Navboost ayrıntıları, vaka sayıları ve 3–6 ay/sandbox çıkarımları aynı kesinlikte değildir; yayın kapasitesi ve QA proje kararıdır.

---

## Yayın hızı hesaplama yöntemi (formül + örnek tablo + script kullanımı)

Bu araç iş yükü planlar; Google için rastgele yayın veya 90 gün zorunluluğu üretmez. Röportaj reçetesi önceki kaynak anlatımında korunur.

`N` gerçek kullanıcı görevleri için gerekli sayfa sayısıdır. `T` ekip/QA kapasitesine göre seçilen gün sayısıdır. İsteğe bağlı warm-up varsa günlük tavan gerçek sınırdır; kapasite yetersizse işlem hata verir. Warm-up 0 veya bütün döneme eşitse toplam kaybolmaz. Başlangıç New York bugünü veya açık medeni tarihtir.

```bash
python3 -I seo-harita/tools/yayin_takvimi.py --toplam 98 --toplam-gun 28 --warmup-gun 0 --baslangic 2026-10-15 --seed 42 --haftalik-ozet
```

Bu örnek mevcut 98 URL'yi yeniden yayınlama talimatı değildir; kapasite örneğidir. Gerçek kullanım yalnız yeni QA partisi için seçilir. 90 günlük karşılaştırma senaryosu istenirse `--warmup-gun 90 --warmup-max-gunluk 10` açıkça verilir; varsayılan warm-up 0'dır. Regresyon kanıtı: `outputs/roadmap-p1/analysis-tests.json`.

## Uygulama SOP'si

1. Kullanıcı işi ve gerçek çıktı gerektiren yeni URL adaylarını belirle; yüzde büyüme hedefiyle URL üretme.
2. Ekip kapasitesi ve sezon talebine göre dönem ve günlük QA tavanı seç. Varsayılan zorunlu bekleme yok.
3. `yayin_takvimi.py` ile kapasite planı üret. `--warmup-gun` isteğe bağlı; varsayılan 0. Açık başlangıç tarihi veya New York bugünü kullanılır.
4. Dönem/cap uygunsuzsa araç hata verir; eksik sayfalı plan yayın kuyruğuna aktarılmaz. Rastgelelik yalnız iş yükü planıdır.
5. Tarih, dosya, içerik, metadata, link ve erişilebilirlik QA'sından geçen partiyi hazırla.
6. Anlamlı değişiklik için revision/lastmod kaydı tut; ziyaret zamanı lastmod değildir.
7. Aynı dönem/ülke/cihaz kapsamındaki GSC verisi ve gerçek indeksleme yanıtıyla takip et. Eksik veri sıfır değildir.
8. Tarih veya işlev arızasını hemen düzelt; sırf core update beklemek için hatayı tutma.
9. Yeni parti büyüklüğünü gözlenen talep, indeksleme ve QA kapasitesiyle gözden geçir; otomatik kadans artışı yok.

## Proje kontrol listesi

- [ ] Yeni URL'nin gerçek kullanıcı işi ve çıktısı tanımlı.
- [ ] Kapasite ve toplam doğrulandı; araç toplamı kaybetmiyor ve hard cap'i aşmıyor.
- [ ] 90 gün/rastgelelik proje hipotezi olarak ayrı; resmi Google şartı diye yazılmadı.
- [ ] Tarih, dosya, metadata, link ve erişilebilirlik QA'sı kayıtlı.
- [ ] Anlamlı revision/lastmod kaydı mevcut.
- [ ] GSC filtreleri ve dönemleri açık; indeksleme verisi mevcutsa kaynaklı.
- [ ] Eksik veri/bilinmeyen sonuç sıfır başarı veya sıfır talep diye yorumlanmıyor.
- [ ] Hatalar bekletilmeden düzeltiliyor; sonraki parti gerçek gözlemle seçiliyor.

## Riskler ve politika uyarıları

- **Scaled content abuse (Mart 2024):** manipülasyon amaçlı ölçekli üretim; AI/insan ayrımı yapmaz. Ani yüksek hacim en büyük tetikleyici.
- **Site-geneli ceza riski:** taze, tıklama sinyalsiz bir subfolder'daki istismar **tüm sitenin** sağlığını düşürebilir (site-wide classifiers, Kasım 2024).
- **Marka/link grafiği kalkan değildir:** Koray'ın BrowserStack gözlemi — güçlü marka bile scaled-content sınıfına düşünce korunmuyor (⚠️ Koray beyanı; yön Google politikasıyla uyumlu).
- **Taze sayfa + Navboost:** tıklama geçmişi olmayan sayfalar Navboost ile savunulamaz → önce güven biriktir.
- **AI imzaları:** tekrar eden şablon/CSS imzaları + ölçek = kolay "AI generated" sınıfı (Bölüm 01).
- **Yanlış rakam riski:** BrowserStack sayılarını (özellikle 300k vs 200k marka araması) proje dokümanlarında **"Koray'ın denetim beyanı"** olarak etiketle; bağımsız kaynak yok.
- **Platform politikaları:** Reddit çoklu-hesap/proxy ısıtma, platform kurallarına ve risklere tabidir (Bölüm 07'de ayrıca değerlendir).
- **Mueller nüansı:** "hız sıralama faktörü değil" söylemi güvenlik garantisi değildir; risk hız **×** güven/kalite birleşiminden doğar.

---

## Ölçüm / KPI

| KPI | Nasıl ölçülür | Sağlıklı sinyal |
|---|---|---|
| Crawl oranı (yeni bölüm) | GSC Crawl Stats / log analizi, user-agent bazlı | Yayınla orantılı, istikrarlı artış |
| İndekslenme oranı | GSC Pages (indexed / submitted) | Yayınlanan URL'lerin büyük kısmı indeksleniyor |
| Yeni sorgu kazanımı | GSC Performance, haftalık yeni query | Haftalık artış (click data birikiyor) |
| İndex/yayın gecikmesi | Yayın tarihi → ilk index tarihi | Isındıkça kısalıyor |
| GSC CTR trendi | Aynı ülke/dönem/cihaz için gözlenen CTR | Google iç goodClicks/lastLongestClicks metriği diye yorumlanmaz |
| Bölüm trafik payı | Subfolder bazlı trafik | Kadans arttıkça orantılı büyüme |
| AIO impression (yeni) | GSC AI Overview impression vs. web impression | İzle; hangi içerik AI'da görünüyor |
| Erken uyarı: düşüş | Haftalık trafik/index sapması | Ani düşüş → kadansı DURDUR, refresh'e geç |

> **Durdurma kuralı:** herhangi iki ardışık haftada index oranı veya yeni-sorgu düşerse **yayını yavaşlat**, yeni URL yerine mevcut sayfaları güncelle, sinyal toparlanınca kadansı yeniden kademeli artır.

---

## Kaynaklar

- Google Search Central — Mart 2024 core update & yeni spam politikaları: https://developers.google.com/search/blog/2024/03/core-update-spam-policies
- Google blog — "New ways we're tackling spammy, low-quality content": https://blog.google/products/search/google-search-update-march-2024/
- Koray T. Gübür — James Dooley Podcast, "Scaled Content Abuse: Scaling Mass AI Content the Safe Way" (BrowserStack & oraai.com): https://jamesdooleypodcast.transistor.fm/609
- Navboost / DOJ davası (tıklama verisi): https://www.hobo-web.co.uk/navboost-how-google-uses-large-scale-user-interaction-data-to-rank-websites/
- Mueller — yayın frekansı sıralama faktörü değil: https://www.searchenginejournal.com/does-adding-content-daily-increase-rankings/464126
- Mueller — toplu yayın spam değil: https://www.seroundtable.com/google-sitemap-lastmod-signal-37077.html
- Google sandbox / güven dönemi (3–6 ay): https://www.wisp.blog/blog/the-google-sandbox-effect-why-your-search-traffic-drops-after-3-6-months
- Site reputation abuse & site-wide classifiers: https://www.gsqi.com/marketing-blog/google-site-reputation-abuse-spam-policy-algorithmic-approach/
- BrowserStack trafik (Semrush genel bakış): https://www.semrush.com/website/browserstack.com/overview/
- Cannabis strain sayısı (~6.000–7.000): https://www.thebluntness.com/posts/how-many-marijuana-strains-are-there
- Koray — Topical Authority / Publication Momentum: https://www.authorityhacker.com/decoding-topical-authority-with-koray-tugberk-gubur/

*Araç: `seo-harita/tools/yayin_takvimi.py`*

---

# 04 — Topical Map Metodolojisi

> **Uygulama statüsü:** Röportaj alıntısı, vaka/araştırma ve resmi kural ayrı değerlendirilir. Aşağıdaki SOP/checklist proje kabul ölçütü olarak [kanıt politikası](KANIT-POLITIKASI.md) ile birlikte okunur; %2/~400 karakter/90 gün/%20–30/rastgelelik Google zorunluluğu değildir.


> Bu bölüm, Koray Tuğberk GÜBÜR'ün Julian Goldie ile yaptığı röportajın ~95–123. satırları temel alınarak hazırlanmıştır. Röportajdaki her iddia eksiksiz listelenmiş, ardından Koray'ın açık kaynaklı Topical Authority / Semantic SEO çerçevesi (holisticseo.digital) ve Google kavramlarıyla derinleştirilmiş, doğrulanmış ve uygulanabilir bir SOP'ye dönüştürülmüştür.

---

## Röportajda söylenenler (eksiksiz liste)

Aşağıdaki maddeler yalnızca röportajda **fiilen söylenenlerin** parafrazıdır. Yorum ve ekleme sonraki bölümlerdedir.

- **Topical map artık yarı-otomatik üretiliyor.** Koray haritayı "semi-automated" (yarı-otomatik) olarak kurduğunu, hâlâ öyle tuttuğunu söylüyor (satır 98–99).
- **Metodoloji her yıl değişiyor, özellikle görsel bölümlerde.** "Every year the methodology gets new things, especially visual sections" (satır 99–100).
- **Content brief'lerde artık "component" (bileşen) adında bir sütun var.** Bu sütun, her başlığın (heading) sayfada *nasıl görüneceğini / görünür olacağını* ve *nasıl etkileşim (engagement) yaratacağını* açıklıyor (satır 100–101).
- **Brief seviyesinin ötesinde, topical map'in kendisi ~%65–70 otomatik.** (satır 102).
- **"Query deserves a page / query deserves a heading / query deserves a section" adında ayrı bir SOP geliştirdiler.** Bu SOP, bir sorgu için sayfa mı, başlık mı yoksa yalnızca bir cümle mi üretileceğini belirlemeye çalışıyor (satır 102–104).
- **Karar, query understanding / mapping'e (sorgu anlama / eşleme) göre veriliyor.** (satır 104).
- **Final kararı insan veriyor.** Brief'leri oluştururken bir insan konuların üzerinden geçip "bu sayfa mı olacak, başlık mı olacak, yoksa başka bir segmente iç link bağlantısı mı olacak" kararını veriyor (satır 105–107).
- **Topical map'ler teoride sonsuza kadar gidebilir** çünkü tüm sorgular birbirine bağlıdır; her zaman daha derine (deeper) ve daha genişe (wider) gidebilirsiniz (satır 108–109).
- **Ama buna gerek yok.** Rakiplere göre toplamda **%25–30 daha fazla konuyu** ve **daha derin** şekilde kapsarsan güvendesin (satır 109–111).
- **3 katı kapsama gerek yok.** Kısa sürede rakiplerin 3 katı konu kapsamaya gerek yoktur (satır 111).
- **~%20 kapsama farkı**, bir core update sırasında rakibi doğrudan değiştirecek bir **"replacement candidate" (yerine geçme adayı)** olmak için genellikle yeterlidir (satır 111–113).
- **Yöntem:** ~8 ana rakibini al, sitemap'lerini tara (scrape), ilk olarak neyi kapsadıklarını gör, sonra hepsinden %20 daha fazla kapsayan, **daha iyi organize edilmiş birleşik (unified)** bir harita oluştur. Böylece kalıcı olarak güvende olursun (satır 113–115).
- **İş modeli farkları işi zorlaştırır.** Örnek: bir kargo/lojistik şirketisin; bir rakip yalnızca **motosiklet kargo** yapıyor olabilir, ama sen ayrıca **adadan adaya gemi taşımacılığı (ship freight)** de yapıyor olabilirsin. Bu, konularını ve iş modellerini farklılaştırır (satır 116–119).
- **Ticari olarak kapsayamadığın alanı informational (bilgilendirici) olarak kapsa.** Bir konuyu ticari kapsayamıyorsan, onu bilgilendirici biçimde kapsamanın bir yolunu bulmalısın (satır 119–121).
- **Bu organizasyon adımı manuel yapılır.** "That type of organization is actually where we do manually" (satır 121).
- **Geri kalan bölümler çoğunlukla AI ile otomatikleştirilebilir**, özellikle rakibin sitemap içeriğini scrape ve crawl edersen; bu süreci çok hızlandırır (satır 121–123).
- **Bağlam (satır 95–98):** Bu bölüm, "topical authority'ye ulaşmak için kaç sayfa gerektiğini hesaplama" tartışmasının hemen ardından gelir. Julian, "topical map'in kendisini nasıl çıkarıyorsun, otomatikleştiriyor musun?" diye sorar; bölüm bu soruya verilen yanıttır.

---

## Derinleştirme: araştırma bulguları

Röportajdaki iddialar kısa ve yoğundur. Burada Koray'ın kamuya açık çerçevesi ve Google kavramları ile bağlam genişletilmiştir.

### Topical map nedir? (Koray'ın tanımı)

Koray'ın Topical Authority çerçevesinde topical map, arama motoruyla kurulan bir **iletişim stratejisidir**: amacı, erişim (retrieval) maliyetini ve riskini düşürürken alaka (relevance) ve yanıt verebilirliği (responsiveness) artırmak, böylece "Topical Authority sıralama durumuna" ulaşmaktır. Harita, ontoloji ve taksonomiye dayalı olarak konuların birbirine semantik/bağlamsal bağlandığı yapılandırılmış bir temsildir.

### Topical map'in çekirdek bileşenleri

Koray'ın çerçevesi haritayı beş temel bileşen üzerine kurar:

1. **Source Context (Kaynak Bağlamı):** "Bu konuda neden sen yazıyorsun / markan neden SERP'te olmalı?" sorusunun yanıtı. Para kazanma (monetization) modeli, marka kimliği ve markanın işlevi ile işlenen konular arasındaki bağdır. Google'ın "primary focus" dediği şeye karşılık gelir. Bir affiliate ile bir sağlayıcının (provider) haritası, aynı konuda bile farklı kurulur.
2. **Central Entity (Merkezî Varlık):** Tüm semantik içerik ağında ve haritada tekrar eden ana varlık. Boilerplate (tekrar eden) içerikte de anılarak odak pekiştirilir.
3. **Central Search Intent (Merkezî Arama Niyeti):** Haritanın tamamında az ya da çok görünen ana niyet. Sitenin ana odağını her sayfada yansıtması hedeflenir.
4. **Core Section (Çekirdek Bölüm):** Tek bir merkezî varlığa ve onun alt-varlık/attribute'larına odaklanan, **para kazandıran (ticari) sayfalardan** oluşan bölüm.
5. **Outer Section (Dış Bölüm):** Alaka inşa eden destekleyici / **informational** konular (kurallar, ipuçları, tarihçe, karşılaştırmalar vb.). Dış bölümdeki tıklama/tatmin sinyalleri, **iç linkleme** yoluyla çekirdek bölümün otoritesini güçlendirir.

Bu ikili yapı aynı zamanda **alıcı farkındalık seviyesine** (soğuk kitle → sıcak kitle) karşılık gelir: kullanıcı ısındıkça CTA ve satış denemeleri artar.

### Yardımcı kavramlar

- **Attribute–Entity Pairs (Nitelik–Varlık Çiftleri):** Her merkezî varlığın nitelikleri (ör. "negligence → tanımı, hukuki sonucu, tazminatı") çekirdek bölümde sistematik kapsanır. Röportajdaki başka bölümlerde Koray, factual içerikte "is-a → predicate → attribute (x of y)" cümle sırasını anlatır; bu, attribute-entity çiftlerinin cümle düzeyindeki yansımasıdır.
- **Contextual Vectors (Bağlamsal Vektörler):** Harita içinde semantik hedefi netleştiren, tutarlı yüklem/sıfat seçimleriyle "bağlamsal bütünlüğü" koruyan yönelimlerdir.
- **Contextual Bridge (Bağlamsal Köprü) & Roof Context (Çatı Bağlam):** Çekirdek konudan yeni/dış alanlara geçerken, primary focus'u bozmadan iki alanı bağlayan köprüdür. Koray, bir genişleme konusunun "en az 3 yan bağlamsal köprüye" sahip olmasını önerir. Röportajdaki lojistik örneği (kargo ↔ gemi taşımacılığı) tam da farklı iş modellerini bir çatı bağlam altında köprülemektir.
- **Topical Gap & Centroid:** Topical gap, iki konu arasındaki "bağlamsal kopukluktur"; centroid ise diğer kavramları tanımlamaya yarayan merkezî kavramdır. Rakip kapsam analizinde bulduğun boşluklar bu gap'lerdir.
- **Semantic Content Network:** Haritanın yayına dönüşmüş hâli; sayfalar arası iç link kurallarıyla bağlanmış içerik ağı.
- **Macro / Micro Context:** Macro-context geniş tematik alaka (sayfaya değer konular), micro-context cümle/kelime düzeyi anlam (başlık/cümleye değer alt-konular). Google, micro-context'i BERT gibi modellerle değerlendirir. Bu ayrım, "query deserves a page vs heading" kararının teorik temelidir.

### "Query deserves a page / heading / section" — kökeni

Koray'ın bu SOP'si isim olarak Google'ın **QDF (Query Deserves Freshness)** kalıbına nazire yapar. QDF, 2007'de Amit Singhal tarafından New York Times röportajında anlatılan, bir konu "hot" olduğunda taze içeriği öne çıkaran modeldir; kuzeni **QDD (Query Deserves Diversity)** ise belirsiz sorgularda çeşitli sonuç getirir. Koray bu kalıbı **kapsam kararına** uyarlar: bir sorgu kendi niyet ve hacmiyle *sayfaya mı, başlığa mı, yoksa tek cümleye/iç linke mi* değer? Bu, macro/micro context ayrımının operasyonel hâlidir. (Not: "query deserves a page/heading/section" Koray'a özgü bir SOP adıdır; Google'ın resmî bir terimi değildir.)

### Kümeleme (clustering) yöntemleri — kararı besleyen altyapı

"Query deserves a page" kararı, sorguların doğru kümelenmesine dayanır. İki ana yöntem vardır:

- **SERP-overlap kümeleme:** İki sorgunun Google ilk 10 sonucunda ortak URL sayısına bakılır. ~3–4 ortak URL (≈%40 örtüşme) genelde "aynı niyet → tek sayfa" eşiğidir. Niyet doğruluğu yüksektir; cannibalization'ı önler.
- **Embedding/semantik kümeleme:** Sorgular vektöre çevrilir, cosine similarity ile anlamca yakınlar gruplanır. Haritayı hızlı taslaklamak için iyidir; ama "niyet körlüğü" vardır ("how to roast coffee" ile "buy roasted coffee"yi birleştirebilir).
- **Önerilen hibrit:** Önce embedding ile geniş harita taslağı çıkar, sonra para sayfaları için her kümeyi canlı SERP ile doğrula. SERP örtüşüyorsa → tek sayfa (ya da heading); ayrışıyorsa → ayrı sayfa.

### Rakip sitemap scraping — araç ve yöntem

- **Screaming Frog:** Masaüstü crawler; XML sitemap / sitemap index'i içe alıp URL listesi ve breadcrumb/structured-data çıkarımı yapabilir. Breadcrumb çıkarımı, rakibin kategori mimarisini görmek için güçlüdür.
- **Python (standart kütüphane veya Ultimate Sitemap Parser):** robots.txt → sitemap keşfi, index dosyalarını özyinelemeli çözme, `<loc>` ve `lastmod` çıkarımı. Bu bölümdeki `sitemap_kapsam.py` aracı bu işi bağımlılıksız yapar.
- **İş akışı:** keşfet → özyinelemeli çöz → slug'ları konuya normalize et → kümeleri karşılaştır (gap) → opsiyonel HTTP durum doğrulaması.

---

## Doğrulama tablosu

| # | İddia (röportaj) | Durum | Not / Kaynak |
|---|------------------|:----:|--------------|
| 1 | Topical map yarı-otomatik üretiliyor | ✅ | Koray'ın kendi ifadesi; sektör pratiğiyle uyumlu (embedding taslak + insan doğrulaması). |
| 2 | Metodoloji her yıl, özellikle görsel bölümlerde değişiyor | ✅ | Görsel semantik / layout-aware ranking vurgusu Koray'ın 2024–2025 çalışmalarıyla tutarlı. |
| 3 | Brief'lerde "component" sütunu var | ⚠️ | Koray'a özgü, yeni bir ekleme; kamuya açık brief şablonlarında bu ad doğrudan belgelenmemiş. İçsel SOP olarak makul. |
| 4 | Harita ~%65–70 otomatik | ⚠️ | Spesifik yüzde doğrulanamaz (öznel/kurum içi ölçüm); yönelim makul. |
| 5 | "Query deserves a page/heading/section" SOP'si | ⚠️ | Koray'a özgü SOP adı; Google terimi değil. Macro/micro context ve QDF kalıbına dayanır. |
| 6 | Final kararı insan veriyor | ✅ | Clustering araştırması da para sayfaları için insan SERP incelemesini şart koşar. |
| 7 | Haritalar sonsuza gidebilir (sorgular bağlı) | ✅ | "Her zaman daha derine/genişe" Koray'ın Topical Map genişletme yazısıyla birebir. |
| 8 | Rakipten %25–30 fazla + daha derin kapsa | ⚠️ | Yönelim doğru; kesin yüzde Koray'ın pratik eşiğidir, bağımsız veriyle ispatlanamaz. |
| 9 | 3x kapsama gerek yok | ✅ | Mantıklı; aşırı hız "scaled content abuse" riski doğurur (röportajın başka bölümü). |
| 10 | %20 fark → core update'te "replacement candidate" | ⚠️ | Koray'ın gözlemine dayalı pratik kural; Google tarafından doğrulanmış resmî eşik değil. |
| 11 | ~8 rakip al, sitemap scrape et, birleşik harita kur | ✅ | Standart rekabetçi içerik denetimi yöntemi; araçlarla desteklenir. |
| 12 | İş modeli farkı kapsamı zorlaştırır (kargo/gemi örneği) | ✅ | Source context + contextual bridge kavramıyla birebir örtüşür. |
| 13 | Kapsayamadığını informational kapsa | ✅ | Core/Outer section mantığı; outer = informational destek. |
| 14 | Organizasyon manuel, gerisi AI ile otomatik | ✅ | Clustering + scraping otomatik; strateji/köprüleme insan işi — araştırmayla uyumlu. |
| 15 | Topical authority'ye ulaşmak hedefi (satır 96) | ✅ | Tüm çerçevenin nihai amacı; Koray'ın tanımıyla tutarlı. |

Lejant: ✅ doğrulandı / güçlü destek · ⚠️ makul ama kurum içi/öznel, bağımsız ispat yok · ❓ belirsiz · ❌ çelişkili.

---

## Topical map SOP'si (adım adım)

### Faz 0 — Temel tanımlar (manuel, insan)

1. **Source Context'i yaz:** Marka neden bu SERP'te olmalı? Monetization modeli nedir (affiliate / provider / tool / hizmet)? Bu, çekirdek bölümün biçimini belirler.
2. **Central Entity'yi seç:** Tüm ağda tekrar edecek ana varlık (ör. "truck accident lawyer").
3. **Central Search Intent'i belirle:** Haritanın her yerinde az/çok görünecek ana niyet.
4. **İş modeli envanteri çıkar:** Rakiplerden *farklı* yaptığın alanları (ör. adadan adaya gemi taşımacılığı) not et — bunlar köprülenecek.

### Faz 1 — Rakip kapsam istihbaratı (çoğunlukla otomatik)

5. **~8 ana rakip belirle.** SERP'te central intent için tekrar çıkan domain'leri seç.
6. **Sitemap'leri topla.** robots.txt → sitemap; index dosyalarını özyinelemeli çöz. (Bu bölümdeki `sitemap_kapsam.py` tam da bunu yapar.)
7. **URL'leri konu token'larına normalize et.** Yıl ve gerçek URL kimliğini koru; konu ailesini ayrı bir alan olarak değerlendir.
8. **Birleşik (union) kapsam CSV'si üret.** Her konu için hangi rakibin kapsadığını işaretle. → `kapsam.csv`
9. **(Opsiyonel) Sayfa içeriğini de crawl et.** Başlık/H2 yapısını çekerek alt-konu derinliğini gör (Screaming Frog custom extraction veya crawler).

### Faz 2 — Kümeleme ve niyet eşleme (yarı-otomatik)

10. **Sorguları/konuları kümele.** Embedding ile hızlı taslak → para sayfaları için SERP-overlap ile doğrula (≥3–4 ortak URL = tek sayfa).
11. **Her kümeye niyet ata:** informational / commercial / transactional / navigational.
12. **"Query deserves" SOP'sini uygula** (aşağıdaki karar ağacı). Her sorgu/küme için: sayfa / başlık / bölüm / cümle / iç link.

### Faz 3 — Çekirdek & dış bölüm organizasyonu (manuel, insan)

13. **Core section'ı kur:** Central entity + attribute'ları + alt-varlıkları (ticari sayfalar).
14. **Outer section'ı kur:** Destekleyici informational konular.
15. **Kapsayamadığın ticari alanları informational köprüle.** İş modeli farkı olan alanları (kargo/gemi örneği) en az 3 bağlamsal köprüyle çatı bağlama bağla.
16. **[Proje] Kapsam farkını değerlendir:** gerçek eksik kullanıcı işi/çıktısı için içerik seç. %20–30 vaka hipotezidir; URL kotası veya güven garantisi değildir.

### Faz 4 — Brief'e dönüştürme ve yayın planı (yarı-otomatik)

17. **Her node için content brief üret** (aşağıdaki şablon, "component" sütunu dahil).
18. **İç link kurallarını tanımla:** outer → core yönlü link akışı; attribute sayfaları → entity sayfası.
19. **Yayın planını bağla:** QA kapasitesi, talep ve sezonla planla; 90 gün veya rastgelelik zorunlu değil (03).
20. **İnsan final kontrolü:** Bir editör tüm node'ları gözden geçirip sayfa/başlık/link kararını onaylar.

### Faz 5 — İzleme ve genişletme (sürekli)

21. **Kapsamı yeniden değerlendir:** yeni talep ve eksik görev varsa genişlet; salt rakip yüzde farkıyla URL üretme.
22. **AI Overview impression verisini** (Search Console) kullanarak hangi konuların AI'da öne çıktığını gör, haritayı buna göre ayarla (röportajın sonraki bölümü).

---

## Karar ağacı: sayfa mı, başlık mı, bölüm mü, iç link mi?

Koray'ın "query deserves a page / heading / section" SOP'sinin operasyonel hâli:

```
SORGU / KONU
  │
  ├─ 1) Ayrı bir arama niyeti ve ölçülebilir talep var mı?
  │     (SERP-overlap: mevcut bir sayfayla <3 ortak URL mi?)
  │        │
  │        ├─ EVET → 2'ye git
  │        └─ HAYIR (başka sorguyla >=3-4 ortak URL / aynı niyet)
  │                  → Mevcut sayfaya BAŞLIK (heading) olarak ekle  → [HEADING]
  │
  ├─ 2) Niyet ticari/transactional mı ve source context'e uyuyor mu?
  │        │
  │        ├─ EVET → Çekirdek (core) SAYFA aç                        → [PAGE / core]
  │        └─ HAYIR → 3'e git
  │
  ├─ 3) Bağımsız informational derinlik ve hacim yeterli mi?
  │        (kendi attribute'ları, alt-soruları olan bir varlık mı?)
  │        │
  │        ├─ EVET → Dış (outer) SAYFA aç                            → [PAGE / outer]
  │        └─ HAYIR → 4'e git
  │
  ├─ 4) Mevcut bir sayfanın alt-niteliği / dar bir yönü mü?
  │        │
  │        ├─ EVET, bir paragraf/tablo kadar → BÖLÜM (section)       → [SECTION]
  │        └─ HAYIR → 5'e git
  │
  └─ 5) Tek cümlede yanıtlanır ve asıl değeri başka sayfaya bağlamak mı?
           → İlgili sayfada bir CÜMLE + İÇ LİNK                      → [SENTENCE + INTERNAL LINK]
```

**Ek kurallar:**
- İş modeli nedeniyle **ticari kapsayamadığın** konu → informational PAGE/SECTION olarak kapsa (asla boş bırakma).
- Bir konu birden çok niyete yayılıyorsa (ambiguous / QDD) → ana sayfa + niyet başına ayrı bölüm/başlık.
- **Final kararı her zaman insan onaylar;** otomasyon yalnızca öneri üretir.

---

## Content brief şablonu (component sütunu dahil)

Aşağıda her node (başlık) için satır satır doldurulan brief tablosu. **"Component" sütunu** Koray'ın röportajda bahsettiği yeni eklentidir: başlığın sayfada *nasıl görüneceğini* ve *nasıl etkileşim yaratacağını* tanımlar.

| Alan (sütun) | Açıklama / örnek |
|---|---|
| **H-seviyesi** | H1 / H2 / H3 — bağlamsal hiyerarşideki yer |
| **Heading (başlık)** | Yüklem+nitelik içeren başlık (ör. "How Truck Accident Compensation Is Calculated") |
| **Hedef sorgu / küme** | Birincil sorgu + SERP-overlap ile bağlı destek sorguları |
| **Niyet** | informational / commercial / transactional / navigational |
| **Query deserves…** | page / heading / section / sentence+link (karar ağacı sonucu) |
| **Macro/Micro** | Konunun bağlam düzeyi (sayfaya mı, cümleye mi değer) |
| **Attribute–Entity** | İşlenecek nitelik–varlık çifti (ör. "compensation × truck accident") |
| **Cümle sırası** | factual ise: is-a → predicate → attribute (x of y); opinionated ise: serbest/doğal |
| **Component (bileşen)** | **Başlığın GÖRSEL biçimi ve etkileşimi:** tablo / karşılaştırma kartı / hesap makinesi aracı / adım-adım görsel / FAQ akordeon / upload alanı / fiyat kutusu / CTA bandı / infografik. Hangi görsel öğeyle *görünür* olacağı ve kullanıcıyı nasıl *engage* edeceği. |
| **Structured data** | Uygulanacak schema (FAQPage, HowTo, Product, Article…) |
| **İç linkler (giden)** | Bu node'dan hangi node'lara link verilecek (outer → core) |
| **İç linkler (gelen)** | Bu node'a hangi node'lardan link gelecek |
| **N-gram / entity** | İlk ekran/başlıkta açıkça anlatılacak önemli varlıklar; %2 deney varsayımı |
| **Factual/Opinionated** | İçerik modalitesi (ikisi birden ise UGC/forum bölümü ekle) |
| **Kelime bütçesi** | Hedef uzunluk (az ve öz; token seyreltmeyi önle) |
| **Yazar/Kaynak** | Core section yazarı / E-E-A-T sinyali |

**"Component" sütunu için örnek değerler:**
- *Hesaplama sorgusu* → "İnteraktif tazminat hesaplayıcı aracı + sonuç kutusu + 'ücretsiz insan değerlendirmesi' CTA"
- *Karşılaştırma sorgusu* → "Yan yana karşılaştırma tablosu + öne çıkan satır vurgusu"
- *Tanım sorgusu* → "Üstte tanım kutusu (above-the-fold centerpiece) + altında FAQ akordeon"
- *Araç/upload sorgusu* → "Dev drag-and-drop upload alanı + 'no sign up / free' rozetleri" (audiototext.com örneği)

---

## Rakip kapsam analizi (script kullanımı)

Bu bölümdeki araç: `tools/sitemap_kapsam.py` (bağımlılıksız, yalnızca Python standart kütüphanesi).

**Ne yapar:** Rakiplerin sitemap URL'lerini (index dosyaları dahil, özyinelemeli; .gz destekli) çözer, URL yollarını konu token'larına normalize eder, tekilleştirir ve **birleşik kapsam CSV'si** üretir — her konu için hangi rakibin kapsadığı işaretlenir. Yıl/URL kimliği ve crawl tamamlanma metadata'sı korunur; yüzde büyüme hedefi üretmez.

### Kullanım

```bash
# Doğrudan URL'lerle (etiket=URL):
python3 -I tools/sitemap_kapsam.py \
  --rakip rakipA=https://rakipa.com/sitemap.xml \
  --rakip rakipB=https://rakipb.com/sitemap_index.xml \
  --cikti kapsam.csv

# URL listesini dosyadan oku (her satır: etiket=URL veya sadece URL):
python3 -I tools/sitemap_kapsam.py --liste rakipler.txt --cikti kapsam.csv

# CSV'yi stdout'a bas:
python3 -I tools/sitemap_kapsam.py --rakip a=https://a.com/sitemap.xml --cikti -
```

> Güvenlik notu: Script'i `-I` (izole mod) ile çalıştırmak, bulunduğun dizinden istenmeyen modül yüklenmesini engeller. İndirilen/parse edilen veriyi koddan ayrı tutun.

### Çıktı sütunları

| Sütun | Anlamı |
|---|---|
| `slug` | Normalize edilmiş konu token'ı |
| `kapsayan_sayisi` | Konuyu kaç rakibin kapsadığı |
| `toplam_url` | Konuya denk gelen toplam URL (tüm rakipler) |
| `<rakip_etiketi>` | Her rakip için o konuyu kapsayan URL sayısı (0 = gap) |
| `ornek_url` | Konuya ait örnek tam URL |

### Güncel çevrimdışı doğrulama

Image namespace ayrımı, yıl/yol kimliği, tekrar sitemap/URL, kapsam ve istek sınırı, malformed XML ve başarısız fetch testleri `tools/test-seo-analysis.py` içinde yer alır. Eksik crawl başarılı boş kapsam diye sunulmaz. Rapor: `outputs/roadmap-p1/analysis-tests.json`. Eski yüzde hedefi ve eski çıktı tablosu güncel aracın davranışı değildir.

### Script'ten sonra (manuel adım)

CSV, "neyi kapsadıklarını görme" adımını otomatikleştirir. Sonrası Koray'ın "manuel yaptığımız organizasyon" kısmıdır:
1. `kapsayan_sayisi` yüksek slug'lar → **inceleme adayı** (US kapsamı, ayrı kullanıcı işi ve gerçek çıktı uygunsa seçilir).
2. `kapsayan_sayisi == 1` slug'lar → **fırsat/gap** (tek rakipte var; hızlı kazanım).
3. Hiçbir rakipte olmayan ama senin iş modeline özgü konular (gemi taşımacılığı gibi) → **köprülenerek eklenir**.
4. Birleşik listenin %120–130'una ulaşacak şekilde yeni konular tasarla; daha iyi organize et.

---

## Proje kontrol listesi

- [ ] Source context, central entity, central search intent yazıldı.
- [ ] Kendine özgü (rakipten farklı) iş modeli alanları listelendi.
- [ ] ~8 ana rakip seçildi, sitemap URL'leri toplandı.
- [ ] `sitemap_kapsam.py` çalıştırıldı, `kapsam.csv` üretildi.
- [ ] (Ops.) Rakip sayfa içerikleri crawl edilip H2/H3 derinliği çıkarıldı.
- [ ] Konular embedding ile taslak kümelendi, para sayfaları SERP-overlap ile doğrulandı.
- [ ] Her küme için "query deserves" kararı (page/heading/section/link) verildi.
- [ ] Core ve outer section ayrıldı; ticari kapsanamayan alanlar informational köprülendi.
- [ ] Kapsam farkı gerçek kullanıcı işi/çıktısıyla gerekçelendirildi; yüzde kotası kullanılmadı.
- [ ] Her node için brief dolduruldu — **component sütunu dahil**.
- [ ] İç link kuralları (outer → core) tanımlandı.
- [ ] Yayın planı 03 ile QA kapasitesi ve gerçek talebe bağlandı; zorunlu bekleme yok.
- [ ] İnsan editör final sayfa/başlık/link kararlarını onayladı.
- [ ] Core update sonrası kapsam yeniden ölçülecek şekilde planlandı.

---

## Riskler

- **Yüzdelerin sabit kural sanılması:** %20 / %25–30 / %65–70 Koray'ın pratik eşikleridir, Google'ın resmî metrikleri değildir. Niyet/kalite kötüyse salt kapsam genişletmek işe yaramaz.
- **Kapsam ≠ kalite:** Rakipten fazla konu açıp her birini zayıf yazmak "scaled content abuse" sınıflamasına götürebilir (röportajın BrowserStack örneği). Kapsam genişletme, yayın hızı ve olgunlaştırma (03. bölüm) ile birlikte yürütülmeli.
- **Niyet körlüğü (otomasyon):** Yalnız embedding ile kümeleme, farklı niyetleri birleştirip cannibalization yaratır. Para sayfaları mutlaka SERP ile doğrulanmalı; final insan kararı atlanmamalı.
- **Sitemap eksikliği:** Bazı rakiplerin sitemap'i eksik/parçalı olabilir; yalnız sitemap'e güvenmek kapsamı eksik ölçer. Gerekirse crawl ile tamamla.
- **Slug normalizasyonu gürültüsü:** Çok farklı URL mimarileri (parametreli, dilsiz) yanlış token üretebilir; `GURULTU_TOKENLARI` listesi projeye göre genişletilmeli.
- **İş modeli köprüleri zorlar:** Ticari kapsanamayan alanı informational köprülerken primary focus seyreltilebilir; en az 3 bağlamsal köprü ve net çatı bağlam şart.
- **Metodoloji yıllık değişiyor:** Özellikle görsel/component tarafı her yıl güncelleniyor; şablonu dondurup bırakmak riski var — periyodik revizyon gerek.

---

## Ölçüm / KPI

- **Kapsam oranı:** (Senin tekil konu sayısı) ÷ (birleşik rakip tekil konu sayısı) ≥ 1.20 (hedef 1.25–1.30).
- **Gap kapanış hızı:** `kapsayan_sayisi` yüksek slug'lardan kaçı sende de yayında (zamanla %100'e).
- **Fırsat kullanımı:** Yalnız 1 rakipte olan konulardan kaçını sen de ekledin.
- **Derinlik:** Konu başına ortalama H2/H3 sayısı rakip ortalamasının üstünde mi.
- **Core update davranışı:** Update sonrası çekirdek sayfaların tıklama/impression trendi (replacement candidate olabildin mi).
- **İç link sağlığı:** Outer → core link oranı; orphan (linksiz) node sayısı = 0 hedefi.
- **AI Overview payı:** Sayfa başına AI impression / regular impression oranı (Search Console); hangi konular AI'da öne çıkıyor.
- **Niyet isabeti:** SERP-overlap doğrulamasından geçen küme oranı; cannibalization (aynı sorguda birden çok kendi sayfası) vaka sayısı.

---

## Kaynaklar

- Röportaj transkripti: `seo-talks-whisper.txt` (satır ~95–123) — bu bölümün birincil kaynağı.
- Koray Tuğberk GÜBÜR — Holistic SEO & Digital, "How to Expand a Topical Map for Higher Topical Authority" (holisticseo.digital).
- Koray'ın Topical Authority / Topical Map çerçevesi özetleri (bluetree.digital/topical-maps; videohighlight.com — "Topical Authority and Topical Maps in 5 Minutes").
- Google QDF: Amit Singhal, New York Times (2007); Search Engine Land — "Query Deserves Freshness"; Semrush blog — QDF.
- Macro vs Micro Context in SEO — ranktracker.com.
- Keyword clustering (SERP-overlap vs embeddings): granovskiy.substack.com; thruuu.com; seocrawl.ai.
- Sitemap scraping / gap analysis: Screaming Frog dokümantasyonu; Ultimate Sitemap Parser; Apify sitemap extractor; practicalecommerce.com (breadcrumb extraction).
- Araç: `tools/sitemap_kapsam.py` (bu projede, çevrimdışı test edildi).

> Not: Web kaynaklarından 15 kelimeyi aşan alıntı yapılmamıştır; tüm özetler parafrazdır.

---

# 05 — AI Overviews Çağında Strateji: Ücretsiz Araçlar ve AI Görünürlük Analizi

> **Uygulama statüsü:** Röportaj alıntısı, vaka/araştırma ve resmi kural ayrı değerlendirilir. Aşağıdaki SOP/checklist proje kabul ölçütü olarak [kanıt politikası](KANIT-POLITIKASI.md) ile birlikte okunur; %2/~400 karakter/90 gün/%20–30/rastgelelik Google zorunluluğu değildir.


> Bu bölüm, Koray Tuğberk GÜBÜR'ün Julian Goldie ile röportajında (transkript: `seo-talks-whisper.txt`) özellikle **satır 171–190** ve tamamlayıcı olarak **satır 12–14** çevresinde anlattığı stratejiyi eksiksiz aktarır, sonra her iddiayı bağımsız araştırmayla derinleştirir ve doğrular. Takımın tüm projelerde kullanacağı operasyonel bir rehber olarak tasarlandı.

---

## Röportajda söylenenler (eksiksiz liste)

Aşağıdaki maddeler Koray'ın söylediklerinin paraphrase (yeniden ifade) halidir; hiçbir iddia atlanmadan sıralanmıştır.

- SERP'lerin gidişatı ve Google AI Overview'ların soruyu doğrudan yanıtlaması göz önüne alındığında, audiototext.com gibi **araç (tool) sayfaları yakın gelecekte AI tarafından ikame edilmeyecek formatlardan biridir**; muhtemelen en son ikame edilecek formatlardan biridir. (satır 171–174)
- Bu yüzden strateji şu: **informasyonel (bilgi amaçlı) taraftan kaybedilen her tıklamayı, ücretsiz araçlara (free tools) geri kazandırmaya çalışıyoruz.** (satır 174–175)
- Bir avukat bile sitesine çok sayıda ücretsiz araç koyabilir: **ücretsiz AI delil değerlendirmesi**, **ücretsiz tazminat/dava hesaplayıcı (case compensation calculator)**, **ücretsiz kaza fotoğrafı değerlendirmesi** (kullanıcı kaza fotoğraflarını yükler, araç kusurun kimde olduğunu olasılıkla söyler). (satır 175–178)
- Bu araçların yanına bir **CTA** konur: "Bizi arayın, ücretsiz **insan** eliyle dava değerlendirmesi alın." (satır 178)
- **Her sektör bugün ücretsiz araçlar üretebilir** ve informasyonel bölüm yerine **tıklama etkileşimini araçlara dönüştürebilir.** Koray bunu henüz bir sistem olarak kurmadığını ama insanların bunu yapması gerektiğine inandığını söylüyor. (satır 178–180)
- **Search Console artık AI Overview impression (gösterim) verisi vermeye başladı.** İnsanlar, **normal web impression'larını AI impression'larıyla karşılaştırmalı**, buna **crawl (tarama) verisini** de eklemeli. (satır 180–182)
- Bu karşılaştırmadan şu öğrenilebilir: **hangi tür içerik AI'dan daha yüksek yüzde impression alıyor** ve **hangi Google user-agent'ı tarafından ne sıklıkla taranıyor.** (satır 182–183)
- Bu soruları yanıtlamak, **topical map'leri (konu haritalarını) şekillendirmek** ve informasyonel içerik için daha iyi "onay" almak üzere **içerik stilini değiştirmek** için stratejik içgörüler verebilir. (satır 183–185)
- Bazı projelerde gözlemlendiği gibi, **Google AI belirli alt klasörleri (subfolder) veya belirli cümle başlangıçlarını "seçiyor" olabilir**; bu veri bunu test etmeye yarayabilir. (satır 185–186)
- Veri toplamak kolaydır: **AI impression verisi (sayfa başına) + normal impression verisi (sayfa başına) + user-agent'lı crawl verisini (sayfa başına) Claude'a verip sorular sor**; eminim sana birçok grafik ve korelasyon gösterecektir. (satır 187–190)
- **(Tamamlayıcı — satır 12–14):** Koray audiototext.com'da "no sign up" (kayıt gerektirmez) notasyonunu ve dev bir upload butonunu eklemeden önce **AI yanıtlarını / agentic yanıtları ve LLM'leri kontrol etti**; bunlardan **"ücretsiz olmak" ve "kayıt gerektirmemek"** iki önemli **nitelik (attribute)** olarak çıktı — LLM'ler siteleri sınıflandırırken bu nitelikleri arıyordu. (satır 12–14)

---

## Derinleştirme: araştırma bulguları

### 1. Araç sayfaları neden "en son ikame edilecek format"?
AI Overviews'ın bir soruyu metinle özetleyip bitirebildiği yerde zero-click (tıklamasız) davranış hızla artıyor. Buna karşılık **bir dosya yükleyip işlem bekleyen, bir sonuç üreten, bir hesaplama yapan araç sayfaları** metin özetiyle ikame edilemez — kullanıcı gerçek bir çıktı (transkript, hesap, rapor) ister. Koray'ın mantığı: informasyonel trafiğin AI'a kaptırıldığı bir dünyada değer, **tamamlanması bir eylem gerektiren sayfalara** kayıyor. Bu, "engineering as marketing" (pazarlama olarak mühendislik) stratejisiyle birebir örtüşüyor: başkalarının paraya çevirdiği bir yeteneği ücretsiz sürümle bir edinim (acquisition) kanalına dönüştürmek. Ücretsiz araçlar link çeker çünkü gerçekten faydalıdır, benzersizdir (herkese link verilmez) ve paylaşılabilir.

### 2. AI Overviews tıklama etkisi — rakamlar neden ciddi?
Koray'ın "informasyonel taraftan tıklama kaybediyoruz" tespiti bağımsız çalışmalarla güçlü biçimde doğrulanıyor:
- **Pew Research (Temmuz 2025, 30.000 ABD'li, Mart 2025 gezinme verisi):** AI özeti görüldüğünde kullanıcı linke yalnızca **%8** oranında tıklıyor; özet yokken **%15**. Yani yaklaşık **%46 düşüş**. Ayrıca AI özeti içindeki kaynaklara tıklama oranı yalnızca **%1**; kullanıcıların **%26'sı** özeti görünce oturumu tamamen bitiriyor.
- **Ahrefs (Nisan 2025, 300.000 keyword):** AI Overview varlığında 1. sıradaki sayfalar için organik tıklama **%34,5** düşüyor. **Aralık 2025 takibi** bunun **%58'e** çıktığını gösterdi (Pozisyon 1 CTR: Mart 2024 %7,3 → Mart 2025 %2,6 → Aralık 2025 %1,6).
- **Destekleyici:** Seer Interactive (%49–65 düşüş), Kevin Indig (>%50, masaüstü), Authoritas (%47,5; haber sitelerinde %79'a varan), BrightEdge (impression +%49 YoY, CTR −%30).

Bu tablo Koray'ın stratejisinin neden "kaybı araçla telafi et" üzerine kurulduğunu açıklıyor: informasyonel CTR yapısal olarak çöküyor.

### 3. Search Console gerçekte AI için ne raporluyor? (2025–2026 doğrulaması)
Koray'ın "Search Console AI Overview impression verisi vermeye başladı" ifadesi **doğru ama nüanslı**:
- **17 Haziran 2025:** Google, **AI Mode** tıklama/impression/pozisyon verisinin Performance raporu **toplamlarına dahil edildiğini** teyit etti. Ancak **ayrı bir AI Mode filtresi verilmedi**.
- Google dokümantasyonu (10 Aralık 2025 güncel): AI Overviews ve AI Mode'da görünen siteler, Search Console'da **"Web" search type içindeki genel trafiğe dahildir**. Sayım kuralları: AI Overview impression'ı, kullanıcı AI Overview'ı (veya linklerinden birini) görünür alana kaydırınca sayılır; tüm overview tek bir pozisyona (çoğu kez Pozisyon 1) atanır.
- **3 Haziran 2026 (ilk sınırlı rollout; 31 Ağustos 2026’da tüm sitelere açıldı):** Search Console'a özel bir **"Generative AI" raporu** eklendi; sitenin AI Overviews + AI Mode + Discover generatif özelliklerindeki **impression'larını izole ediyor**. **Kritik sınırlamalar:** yalnızca impression var — **tıklama yok, CTR yok, ortalama pozisyon yok, query boyutu yok** ve **AI Overviews ile AI Mode ayrımı yok**. Sayfa/ülke/cihaz/tarih bazında kırılabiliyor. Bu rapor yeni veri toplamıyor; zaten "Web" type içinde sayılan veriye bir görünüm sunuyor.

**Sonuç:** Koray'ın önerdiği "AI impression'ı normal impression ile karşılaştır" analizi bugün **mümkün** (Generative AI raporu = AI impression, Performance/Web raporu = toplam impression & tıklama). Ancak AI tarafı için **tıklama/CTR hesaplanamaz**; bu bölümün SOP'si bu sınırı dikkate alır.

### 4. Bing tarafı — daha şeffaf
Microsoft'un resmi AI Performance açıklaması citation, cited pages, grounding queries ve sayfa bazlı citation eğilimini tanımlar. Bu kaynaktan bağımsız AI clicks/CTR bulunduğu sonucu çıkarılmaz. Kaynak: https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/

### 5. Google user-agent'ları ve log analizi
Koray'ın "hangi Google user-agent'ı ne sıklıkla tarıyor" sorusu, sunucu log analizi gerektirir. Google'ın ayrıştırılması gereken başlıca crawler/fetcher'ları (resmi liste):
- **Googlebot Smartphone** / **Googlebot Desktop** — klasik arama indeksleme (mobil-öncelikli).
- **Googlebot-Image / -Video / -News** — dikey indeksleme.
- **Google-InspectionTool** — URL Inspection / Rich Results testleri.
- **GoogleOther** (+ `-Image`, `-Video`) — genel/ar-ge taramaları; aramayı etkilemez.
- **Google-CloudVertexBot** — site sahibinin Vertex AI Agent'ları için taramalar.
- **Google-Extended** — ayrı bir HTTP user-agent değil; yalnızca **robots.txt kontrol token'ı** (Gemini/Vertex AI eğitimi erişimi). Log'da ayrı satır **görünmez**; mevcut Google UA'larıyla taranır.
- **Storebot-Google** — Google Shopping yüzeyleri.
- **AdsBot**, **Mediapartners-Google (AdSense)**, **APIs-Google**, **FeedFetcher** — reklam/servis amaçlı.

**Önemli uyarı:** User-agent string **taklit edilebilir**. Gerçek Googlebot doğrulaması **ters-DNS + ileri-DNS** ile yapılır: IP → hostname (`.googlebot.com` / `.google.com` ile biter) → hostname tekrar aynı IP'ye çözülmeli. Bu bölümün Python script'i `--verify-dns` seçeneğiyle bunu uygular.

### 6. LLM'lerin kullandığı nitelikler (attributes)
Koray'ın "free" ve "no sign up" niteliklerini AI yanıtlarından çıkarması, bugün "GEO/AI visibility" araç kategorisiyle sistematikleştirilebilir: **Profound, Peec AI, Semrush AI Visibility Toolkit, Ahrefs Brand Radar, Otterly** gibi araçlar ChatGPT/Perplexity/Gemini/AI Overviews/AI Mode genelinde marka anılma, citation, sentiment ve "share of voice" izler. Ancak Koray'ın yöntemi bir izleme değil, **keşif**: bir kategori için LLM'lere "bu tip siteleri seçerken hangi özelliklere bakarsın / X için en iyi aracı neye göre seçersin" diye sorup, tekrar eden nitelikleri (free, no sign up, no watermark, API var mı, hız, format desteği) sayfa tasarımına ve on-page notasyona taşımak.

### 7. Hukuk sektörü araçlarında yasal/etik sınır
Koray'ın avukat örneği güçlü ama **düzenlemeye tabi**. ABD'de avukat web sitesi çoğu eyalette **reklam** sayılır (ABA Model Rule 7.1/7.2). Kritik noktalar:
- **Garantili sonuç imasından kaçın.** "Maksimum tazminatı **kazanırız**" ihlal riski taşır; "maksimum tazminat için **mücadele ederiz**" daha güvenli.
- **Zorunlu uyarı (disclaimer):** Geçmiş sonuçlar gelecekteki sonucu garanti etmez; hesaplayıcı tahmini **hukuki tavsiye değildir**; aracı kullanmak **avukat-müvekkil ilişkisi doğurmaz**. (ABA Formal Opinion 506; Model Rule 5.3 — AI araçlarının denetimi avukatın sorumluluğundadır.)
- Bu yüzden Koray'ın "ücretsiz **insan** eliyle değerlendirme" CTA'sı aslında doğru çerçeve: araç = tahmin/leadmagnet, gerçek değerlendirme = lisanslı avukat.

---

## Doğrulama tablosu

| # | İddia (röportaj) | Durum | Not / Kaynak |
|---|---|---|---|
| 1 | Araç sayfaları AI'ın en son ikame edeceği formatlardan | ✅ | Zero-click metin özeti etkileşimli araçları ikame edemez; engineering-as-marketing literatürü destekliyor |
| 2 | AI Overviews informasyonel tıklamayı düşürüyor | ✅ | Pew %46, Ahrefs %34,5→%58, Seer/Indig/Authoritas doğruluyor |
| 3 | Her tıklama kaybını ücretsiz araçla telafi stratejisi | ⚠️ Strateji seçeneği | Gerçek kullanıcı işi ve bakım kapasitesi gerekir; telafi garantisi yok (calculator/analyzer/generator) |
| 4 | Avukat: ücretsiz delil/tazminat/kaza-foto araçları + "insan" CTA | ⚠️ | Fikir geçerli; ABA/eyalet baro reklam kuralları ve zorunlu disclaimer'lar şart. Fotoğraftan kusur tespiti teknik olarak güvenilmez, "olasılık/tahmin" diliyle sunulmalı |
| 5 | Her sektör ücretsiz araç üretebilir | ✅ | Doğru; bu bölümde 16 sektörlük tablo veriliyor |
| 6 | Search Console AI Overview impression verisi vermeye başladı | ✅ | 2025 Web type'a dahil; Haz 2026 ayrı "Generative AI" raporu (31 Ağustos’tan beri tüm sitelerde, yalnız impression) |
| 7 | AI impression ile normal impression karşılaştırılabilir | ✅ | Mümkün; ancak AI için tıklama/CTR/query YOK |
| 8 | Crawl verisini user-agent'a göre ayır | ✅ | Sunucu log'u + resmi Google crawler listesi; UA taklit edilebilir → ters-DNS doğrulaması gerekli |
| 9 | Google belirli subfolder/cümle başlangıçlarını "seçiyor" | ❓ | Test edilebilir hipotez; Google teyit etmedi. Script subfolder kırılımını üretir, cümle başlangıcı ayrı NLP analizi ister |
| 10 | Veriyi Claude'a verip korelasyon/grafik iste | ✅ | Pratik ve uygulanabilir; bu bölümde hazır promptlar var |
| 11 | LLM'ler siteleri "free / no sign up" niteliğiyle sınıflıyor | ⚠️ | Mantıklı ve gözleme dayalı; sistematik keşif için prompt seti + GEO araçları (Profound/Peec) öneriliyor. LLM'in iç sınıflandırması kara kutu |
| 12 | Bing AI raporunda tıklama/CTR kesin var | ❌ Bu kaynakla doğrulanmıyor | Resmi belge citations, cited pages ve grounding queries gösterir; CTR üretilmez |

---

## Ücretsiz araç fikir çerçevesi (sektör tablosu)

**İdeasyon formülü (araç seçim kriteri):**
`Değer = (Lead değeri × beklenen lead sayısı) − (geliştirme + bakım maliyeti)`
Araç: (a) gerçek bir problemi çözmeli, (b) ana ürüne/hizmete komşu olmalı (araçtan ürüne doğal yol), (c) tek bir işi iyi yapmalı (düşük friksiyon), (d) ürün olmadan da faydalı olmalı. Üç arketip: **Hesaplayıcı** (sayı/karşılaştırma/tahmin), **Üretici/Generator** (hızlı çıktı), **Analizör/Denetleyici** (mevcut varlığı değerlendirme).

| Sektör | Ücretsiz araç fikirleri | Hedef araç sorgusu | Önemli nitelikler (on-page) |
|---|---|---|---|
| Hukuk (kaza/tazminat) | Tazminat hesaplayıcı, kaza fotoğrafı/kusur tahmini, dava süre tahmini, delil kontrol listesi | "tazminat hesaplama", "kaza tazminat calculator" | Ücretsiz, kayıt yok, "tahmin/hukuki tavsiye değil" uyarısı, insan CTA |
| Sağlık/klinik | Semptom-öncesi risk anketi, BMI/kalori, ilaç etkileşim kontrolü, gebelik haftası | "bmi hesaplama", "due date calculator" | Ücretsiz, kayıt yok, "tıbbi tavsiye değil", KVKK/veri saklamıyor |
| Finans/kredi | Kredi/mortgage hesaplayıcı, emeklilik, vergi tahmini, döviz/enflasyon | "kredi hesaplama", "mortgage calculator" | Ücretsiz, kayıt yok, anlık sonuç, veri lokal işlenir |
| E-ticaret | Kargo/teslim süresi, beden/ölçü bulucu, indirim/ROI, ürün karşılaştırma | "beden tablosu", "shipping calculator" | Ücretsiz, kayıt yok, görsel merkez element |
| SaaS | ROI/tasarruf hesaplayıcı, fiyat karşılaştırma, API/regex test, uptime kontrol | "roi calculator", "regex tester" | Ücretsiz, kayıt yok, API var, tek seferde çalışır |
| Seyahat | eSIM/roaming maliyet, vize kontrol, saat dilimi/jet-lag, bagaj boyut | "vize gerekli mi", "esim calculator" | Ücretsiz, kayıt yok, ülke seçici |
| Gayrimenkul | İpotek/kira-vs-satın-al, emlak değer tahmini, tapu harcı, aidat | "ev değerleme", "rent vs buy" | Ücretsiz, kayıt yok, bölge bazlı |
| Eğitim | Not ortalaması/GPA, sınav geri sayım, burs uygunluk, alıntı (citation) üretici | "gpa calculator", "citation generator" | Ücretsiz, kayıt yok, format seçimi |
| Lojistik/kargo | Navlun/hacim-ağırlık, konteyner doluluk, teslim süre, HS kod bulucu | "desi hesaplama", "freight calculator" | Ücretsiz, kayıt yok, birim dönüştürücü |
| Ses/medya (audiototext örneği) | Ses→metin, video→altyazı, transkript, format dönüştürücü | "audio to text", "subtitle generator" | **Ücretsiz, kayıt yok**, dev drag-drop alanı, watermark yok |
| CBD/bitkisel | Doz hesaplayıcı, strain/çeşit bulucu, etkileşim kontrol, yasallık haritası | "cbd dosage calculator", "strain finder" | Ücretsiz, kayıt yok, "tıbbi tavsiye değil", bölge yasallık uyarısı |
| iGaming (yalnız yasal pazar) | Oran/parlay hesaplayıcı, bonus çevrim (wagering) hesaplayıcı, sorumlu oyun limit aracı | "odds calculator", "wagering calculator" | Ücretsiz, kayıt yok, +18 ve sorumlu oyun uyarısı, yalnız lisanslı pazar |
| İK/kariyer | Net-brüt maaş, kıdem tazminatı, CV/özet üretici, maaş karşılaştırma | "net maaş hesaplama", "salary calculator" | Ücretsiz, kayıt yok, güncel yıl verisi |
| İnşaat/ev | Boya/fayans/beton miktar, kredi, enerji tasarruf, m² maliyet | "boya hesaplama", "concrete calculator" | Ücretsiz, kayıt yok, görsel girdi |
| Enerji/solar | Panel/geri ödeme hesaplayıcı, tüketim, karbon ayak izi | "solar savings calculator" | Ücretsiz, kayıt yok, bölge ışınım verisi |
| Pazarlama/ajans | Başlık/CTR analizörü, UTM üretici, reklam bütçe/ROAS, site hız denetçisi | "utm builder", "headline analyzer" | Ücretsiz, kayıt yok, anlık skor |

> Not: CBD, iGaming ve hukuk/sağlık gibi **düzenlemeye tabi** sektörlerde araç, yasal uyarılar ve pazar kısıtları (yalnız lisanslı bölge, +18, "tavsiye değildir") olmadan yayınlanmamalıdır.

---

## Araç sayfası tasarım SOP'si

1. Gerçek kullanıcı işini, girdi/çıktıyı ve kapsamı brief'te tanımla.
2. Ana form/örnek ve ana eylemi ilk ekranda anlaşılır kıl; mobil/masaüstü ölç.
3. Free/no account/browser processing gibi yalnız doğrulanmış nitelikleri göster.
4. Kısa, yeterli açıklama ve erişilebilir etiket/sonuç kullan; %2/~400 karakter resmi eşik değildir.
5. Demo/yanlış meta/ölü CSS'i temizle; class adlarını AI gizlemek için zorunlu değiştirme.
6. Mevcut düz araç URL'lerini koru; `/calendar-tools/` üzerinden crawlable ilişki kur.
7. Doğru sonuç, hata/boş girdi, klavye ve kaynak kapsamını denetle; trafik başarısı için ayrı gerçek veri bekle.

## AI görünürlük analizi SOP'si (+ Claude promptları + script kullanımı)

**Güncel veri sözleşmesi:** CSV yanına `.meta.json` koyun: site, dataset (`web`/`generative`), surface (`search`/`discover`), dateStart/dateEnd, country, device, dimension=`page`, locale. Eksik alanlarda AI oranı hesaplanmaz. Aynı byte+scope dosya tekrar verilirse tek sayılır; çakışan dönemler reddedilir. Log için `--start/--end` zorunlu; yalnız GET/HEAD 2xx istekler başarılı crawl sayılır, UA tek başına doğrulama değildir. IPv4/IPv6 DNS doğrulaması desteklenir. Düz URL'ler manifest konu ailesine bağlanır. Yerel mevcut veri kullanımı: `outputs/roadmap-p1/measurement/readme.md`.



### Veri kaynakları ve join mantığı
| Kaynak | Ne verir | Boyut | Join anahtarı |
|---|---|---|---|
| GSC → Performance (Search results, **Web** type) → Pages, CSV export | Toplam **impressions, clicks, CTR, position** (AI dahil, izole değil) | Sayfa | URL path |
| GSC → **Generative AI** raporu → Pages, CSV export | **AI impressions** (Search ve Discover ayrı tutulur; yalnız impression) | Sayfa | URL path |
| Sunucu access log (Apache/Nginx combined) | User-agent'lı **crawl sayıları** | İstek | URL path (+ UA) |
| (Opsiyonel) Bing Webmaster → AI Performance | AI **citations / cited pages / grounding queries** | Sayfa | URL path |

**Not:** AI tarafında tıklama olmadığı için gerçek "AI CTR" hesaplanamaz. Bunun yerine **aynı Search yüzeyi/dönem/ülke/cihaz kapsamı doğrulanırsa `ai_impression_share = ai_impressions / web_impressions`** göstergesi (bir sayfanın AI'da ne kadar öne çıktığının yaklaşık ölçüsü) ve **crawl-by-agent** frekansı analiz edilir.

### Adım adım prosedür
1. GSC'den **Web** Pages ve **Generative AI** Pages CSV'lerini aynı tarih aralığıyla indir.
2. Sunucu loglarını (aynı aralık) tek dosyada topla.
3. Script'i çalıştır (aşağıda). `--verify-dns` ile sahte botları ele (prod loglarında önerilir).
4. Çıkan `ai_gorunurluk_rapor.csv`'yi Claude'a yükle ve hazır promptları kullan.
5. Bulguları topical map ve içerik stili kararlarına yansıt (hangi subfolder/format daha çok AI impression ve crawl alıyor?).

### Script kullanımı

Proje kökünden Python 3.9+ ile:

```bash
python3 -I seo-harita/tools/ai_gorunurluk_analizi.py \
    --site https://printgridcalendar.com \
    --gsc-csv web_pages.csv --ai-csv ai_pages.csv \
    --log access.log --start 2026-10-08 --end 2026-10-10 \
    --out ai_gorunurluk_rapor.csv --verify-dns
```

CSV yanındaki `.meta.json` içinde site/dataset/surface/dateStart/dateEnd/country/device/dimension/locale kaydı bulunur. Eksik kapsamda AI oranı üretilmez. Örnek tarihler arşiv verisinin inceleme örneğidir, güncel canlı veri değildir.

- Aynı byte+kapsam dosyası iki kez sayılmaz. Farklı dosyaların çakışan dönemleri veya filtreleri reddedilir.
- Çıktı `url, topic, subfolder, impressions, clicks, ctr, ai_impressions, ai_impression_share, ua_matched_successful_requests, verified_google_successful_requests` ve `crawl_*` sütunlarını içerir.
- AI/log verilmediyse ilgili alanlar boştur; DNS yapılmadıysa verified Google alanı boştur. Log hata/diğer status kayıtları metadata'da ayrı tutulur.
- Aynı saniyede gerçekten tekrarlanan istekler korunur; kopya dosya tekrar sayılmaz. Farklı dönen log dosyalarındaki belirsiz örtüşme reddedilir.
- HTTP/HTTPS ve query varyantları kanıt olmadan tek canonical kimliğine katılmaz.
- Düz URL'lerin konusu proje manifestinden türetilir. Regresyon kanıtı: `outputs/roadmap-p1/analysis-tests.json`.

### Ready-to-paste Claude promptları
**Prompt A — Genel korelasyon:**
> Ekteki `ai_gorunurluk_rapor.csv`, sayfa başına web impression, clicks, CTR, AI impression ve Google user-agent bazlı crawl sayılarını içeriyor. (1) `ai_impression_share` ile `ctr` ve `total_google_crawls` arasındaki korelasyonları hesapla. (2) Hangi subfolder'lar ortalamanın üstünde AI impression payı alıyor? (3) Googlebot smartphone vs desktop crawl oranı yüksek olan sayfalarla AI görünürlüğü arasında ilişki var mı? Bulguları bir korelasyon matrisi ve 2–3 grafikle özetle.

**Prompt B — Subfolder stratejisi:**
> Aynı CSV'de subfolder bazında topla: her subfolder için toplam web impression, AI impression, ortalama ai_impression_share, crawl frekansı (agent kırılımıyla). Google'ın hangi subfolder'ları AI'da daha çok "seçtiğini" ve daha sık taradığını sırala. Bu veriye göre topical map'te hangi subfolder'ları genişletmeliyim?

**Prompt C — Crawl-AI ilişkisi:**
> Bu CSV'de, crawl frekansı yüksek (üst %25) sayfalarla düşük (alt %25) sayfaların AI impression payını karşılaştır. Google-InspectionTool ve Google-CloudVertexBot taranan sayfalarda AI görünürlüğü farklı mı? Aksiyon önerileri çıkar.

---

## LLM'lerden özellik (attribute) çıkarma yöntemi

Koray'ın audiototext için "free / no sign up" niteliklerini keşfetme yöntemini sistematik SOP'ye dönüştürme:

1. **Kategori ve rakip tanımı.** Hedef sorgu/kategoriyi netleştir (ör. "audio to text tool", "truck accident lawyer Texas").
2. **Prompt seti hazırla** (her LLM'de çalıştır: ChatGPT, Gemini, Perplexity, Claude, Google AI Mode):
   - "[Kategori] için en iyi aracı/hizmeti seçerken hangi özelliklere bakarsın? Önem sırasıyla listele."
   - "Birine ücretsiz bir [kategori] aracı öner. Neden bunu önerdin?"
   - "Bir [kategori] sitesini güvenilir/kullanışlı yapan nitelikler nelerdir?"
   - "[Marka] ile rakiplerini hangi özelliklerde karşılaştırırsın?"
3. **Tekrar eden nitelikleri kodla.** Yanıtlarda tekrar eden sıfat/özellikleri say: ücretsiz, kayıt yok, watermark yok, hız, format/dil desteği, API, gizlilik, doğruluk. Frekansa göre sırala.
4. **Niteliği üçe dağıt** (satır 197–199 mantığı): on-page **notasyon** (rozet/etiket), dış yayında **mention**, ve **claim** (ör. "en büyük/en hızlı/ücretsiz" iddiası, kurucu ağzından).
5. **İzleme araçlarıyla ölç.** Nitelik atamasının AI yanıtlarına yansıyıp yansımadığını Profound / Peec AI / Semrush AI Visibility Toolkit / Ahrefs Brand Radar ile takip et (share of voice, citation, sentiment). Keşif = bu bölüm; izleme = bu araçlar.
6. **Düzenli tekrar.** LLM yanıtları zamanla değişir; prompt setini çeyreklik çalıştırıp nitelik listesini güncelle.

---

## Proje kontrol listesi

- [ ] Informasyonel trafik kaybı ölçüldü mü? (AI Overview varlığı × CTR düşüşü)
- [ ] Her ana konu kümesi için en az bir **ücretsiz araç** fikri üretildi mi? (hesaplayıcı/generator/analizör)
- [ ] Araç sayfasında **dev merkez element** + **free/no-sign-up rozetleri** var mı?
- [ ] Araç dizini ve crawlable ilişkiler açık mı? Mevcut düz URL'ler sırf klasör için taşınmadı mı?
- [ ] AI imzaları (class/CSS/HTML) temizlendi mi?
- [ ] Düzenlemeye tabi sektörde zorunlu **disclaimer/uyarılar** ve doğru CTA var mı?
- [ ] GSC **Generative AI** raporu + **Web** Pages CSV + access log toplandı mı?
- [ ] Script `--verify-dns` ile çalıştırıldı, sahte botlar elendi mi?
- [ ] Çıktı Claude'a verilip korelasyon/subfolder analizi yapıldı mı?
- [ ] LLM nitelik keşfi (prompt seti) yapıldı, nitelikler on-page/off-page'e taşındı mı?
- [ ] (Varsa) Bing AI Performance raporu ikincil doğrulama için incelendi mi?

---

## Riskler

- **Ölçüm körlüğü:** Google AI tarafı için tıklama/CTR/query yok; "AI CTR" uydurmak yanıltır. Yalnız impression ve crawl üzerinden konuş.
- **UA taklidi:** Ters-DNS doğrulaması yapılmazsa sahte Googlebot'lar crawl analizini bozar.
- **Yasal/etik:** Hukuk/sağlık/finans/CBD/iGaming araçlarında garantili-sonuç imaları, eksik disclaimer, lisanssız pazar hedefleme baro/regülasyon ihlali ve itibar riski doğurur. Fotoğraftan kusur tespiti teknik olarak güvenilmezdir; "olasılık/tahmin" diliyle sunulmalı.
- **Aşırı araç üretimi = scaled content riski:** Çok sayıda ince araç sayfasını kısa sürede yayınlamak, ölçekli içerik kötüye kullanımı sınıflandırmasını tetikleyebilir (bkz. yayın frekansı bölümü). Yeni parti QA ve talebe bağlıdır; 90 günlük resmi bekleme eşiği yoktur.
- **Raporun kapsamı:** Google’ın [resmî duyurusuna](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports) göre rapor 31 Ağustos 2026’da tüm sitelere açıldı. Yalnız impression ölçümü ve mevcut kırılım sınırlarını koruyun; SOP’yi yeni Google duyurularına göre güncelleyin. Bu projenin gerçek GSC verilerine erişildiği anlamına gelmez.
- **Veri gizliliği:** Kullanıcı yüklemeleri (ses, kaza fotoğrafı, sağlık verisi) işleyen araçlarda KVKK/GDPR saklama ve işleme uyarıları şart.

---

## Ölçüm / KPI

- **AI impression payı:** `ai_impressions / web_impressions` (sayfa ve subfolder bazında trend).
- **Informasyonel → araç kayması:** Araç sayfalarının toplam tıklama içindeki payı (zamanla artmalı).
- **Araç sayfası etkileşimi:** araçta tamamlanan işlem (upload/hesaplama) oranı, sayfada kalış süresi (>2 dk hedef), lead yakalama oranı (%5–15).
- **Crawl sağlığı:** sayfa başına Googlebot (smartphone/desktop) crawl frekansı; InspectionTool/CloudVertexBot kapsaması; crawl israfı (4xx/5xx, düşük değerli URL payı).
- **AI görünürlük (off-site):** share of voice, citation sayısı, sentiment (Profound/Peec/Semrush/Ahrefs).
- **Nitelik tutarlılığı:** LLM yanıtlarında hedef niteliklerin (free, no sign up vb.) markayla birlikte anılma frekansı.
- **Bing AI:** citation ve cited-page/grounding verisi; AI CTR varsayılmaz.

---

## Kaynaklar

- Google Search Central — [List of Google's common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- PPC Land — [Google AI Mode now counts toward Search Console totals](https://ppc.land/google-ai-mode-now-counts-toward-search-console-totals/)
- CMSWire — [Google adds AI visibility reports to Search Console](https://www.cmswire.com/digital-experience/google-adds-ai-visibility-reports-to-search-console/)
- Pasquale Pillitteri — [Search Console Generative AI report (AI Overviews / AI Mode)](https://pasqualepillitteri.it/en/news/4116/search-console-generative-ai-report-ai-overviews-ai-mode)
- Ahrefs — [AI Overviews reduce clicks (update)](https://ahrefs.com/blog/ai-overviews-reduce-clicks-update)
- PPC Land — [Google's AI Overviews cut organic clicks by 34.5%](https://ppc.land/googles-ai-overviews-cut-organic-clicks-by-34-5-despite-company-claims/)
- Whole Whale — [Pew Research confirms AI Overviews impact](https://wholewhale.com/resources/googles-gaslighting-pew-research-confirms-what-seos-already-know-about-ai-overviews/)
- Arc Intermedia — [Bing Webmaster Tools AI Performance Report](https://www.arcintermedia.com/shoptalk/bing-webmaster-tools-ai-performance-report/)
- Whole Whale — [Bing Webmaster analytics for AI search](https://wholewhale.com/resources/bing-webmaster-analytics-for-ai-search-is-sobering/)
- Systems Architect — [Server Log File Analysis for SEO](https://systemsarchitect.net/server-log-file-analysis-seo/)
- ABA — [FAQs: Attorney advertising ethics in the digital age](https://www.americanbar.org/groups/labor_law/resources/magazine/2025-winter/faqs-attorney-advertising-ethics-rules-digital-age/)
- Lawlytics — [The ethical red line in digital law firm marketing](https://www.lawlytics.com/blog/the-ethical-red-line-in-digital-law-firm-marketing/)
- Backlinko — [LLM tracking tools](https://backlinko.com/llm-tracking-tools)
- Exploding Topics — [8 best LLM tracking tools](https://explodingtopics.com/blog/llm-tracking-tools)
- mdskills.ai — [Free Tool Strategy (Engineering as Marketing)](https://www.mdskills.ai/skills/free-tool-strategy)
- Transkript: `/Users/mustafa/Documents/Workspace/SEO/seo-talks-whisper.txt` (satır 12–14, 171–190)

---

# 06 — Link Building, External Topical Map ve AI Konsensüsü

> **Uygulama statüsü:** Röportaj alıntısı, vaka/araştırma ve resmi kural ayrı değerlendirilir. Aşağıdaki SOP/checklist proje kabul ölçütü olarak [kanıt politikası](KANIT-POLITIKASI.md) ile birlikte okunur; %2/~400 karakter/90 gün/%20–30/rastgelelik Google zorunluluğu değildir.


> Bu bölüm, Koray Tuğberk GÜBÜR'ün Julian Goldie ile yaptığı röportajın (transcript: `seo-talks-whisper.txt`) ~190–218. satırlarına dayanır. Koray'ın link building, "external topical map" (dış konu haritası), marka iddiaları ve AI yanıtlarını konsensüs yoluyla yönlendirme yaklaşımını eksiksiz aktarır; ardından akademik/endüstriyel kaynaklarla doğrular ve uygulanabilir SOP'lere dönüştürür.

---

## Röportajda söylenenler (eksiksiz liste)

Aşağıdaki maddeler Koray'ın söylediklerinin parafrazıdır (birebir alıntı değil). Satır numaraları transcript'e referanstır.

- **Link building eskisinden çok daha önemli.** Koray, link building'e "eskisine göre çok daha fazla" ağırlık verdiklerini, bu konuda çok derinleştiklerini söylüyor. (satır 191)
- **"External topical map" (dış konu haritası) kavramı.** Bu ismi James Doole'un (yani **James Dooley**) koyduğunu belirtiyor. İç içerik yayını için bir topical map (konu haritası) oluşturdukları gibi, dış yayınlar (link veren siteler) için de **ikinci bir topical map** oluşturuyorlar. (satır 192–193)
- **Amaç: entity'ye (varlığa) öznitelik ataması (attribute assignment).** Dış yayınlarda önemli olan, markaya belirli öznitelikleri atfettirmek. Örnek: audiototext.com için "no sign up" (kayıt gerektirmez) ve "free" (ücretsiz) iki önemli öznitelik. (satır 194–195)
- **Avukat (hukuk) örneği.** Bir avukat için istenen öznitelikler: "highest compensation" (en yüksek tazminat), "highest success rate" (en yüksek başarı oranı), "biggest compensations", "biggest law firm in Texas" (Teksas'ın en büyük hukuk firması). Bu tür öznitelik atamalarını entity'ye bağlamak için **mention (bahsedilme) ve declaration (beyan) gerekir.** (satır 195–197)
- **Bir link yayını üç şey sağlar:** (1) **PageRank** (link değeri), (2) **mention** (markadan bahsedilme), (3) **claim** (iddia). İddia, markayı bir iddiayla birlikte anmak demek: ör. "Teksas'ın en büyük hukuk firması, markanın kurucusu böyle söylüyor" ("the founder of the brand says so"). (satır 198–199)
- **Tekrarlı co-occurrence (birlikte geçiş) ve kendine atama → AI'da sıralama/atıf.** Koray kendisini belirli birliktelikler (co-occurrences) ve atamalarla sürekli andırıyor; bu da AI yanıtlarında sıralama ve atıf (citation) almayı sağlıyor. Örnek sorgu: "who is the most successful lawyer in Texas for brain traumatic injuries" (Teksas'ta travmatik beyin yaralanmaları için en başarılı avukat kim). Bu şekilde çok sayıda bahsedilme olduğu için link yayınları marka adıyla AI'da sıralama ve atıf almasına yardımcı oluyor. (satır 200–203)
- **Link graf inşasının asıl amacı: konsensüs yoluyla AI yanıtlarını yönlendirmek; PageRank ikincil.** Dış yayınlarla link graf kurmanın temel amacı, bir **consensus (uzlaşı/mutabakat)** yaratarak AI yanıtlarını manipüle etmek; PageRank almak da ikincil bir fayda. (satır 203–205)
- **Makale konusunu, link verecek domain'e göre seçmek.** Kullanılacak domain'in adına/konusuna göre makale konusu seçiliyor:
  - `skillsunit.com` → "skills to be a lawyer" (avukat olmak için gereken beceriler) konulu makale; içinde "Atlanta, Georgia'daki X şirketinin kurucusu, başarılı bir kaza avukatı olmak için ... diyor" şeklinde kendini anma (annotational text). (satır 205–208)
  - `truckcalendar.com` → "truck accident" (kamyon kazası) konusu üzerinden kendini ve hizmetini linkleme. (satır 209)
- **Domain adının ve sıralama gücünün konu alakası için kullanılması.** Domain'in adı ve ranking gücü, o konudan belirli annotation'larla (çevre metinle) link almak için kullanılıyor. (satır 210)
- **Link building her şeyin merkezinde; çünkü konsensüs dış kaynak gerektirir.** Konsensüs için markanızı **iç kaynaklarınız değil, dış kaynakların** anması gerekir. (satır 211–212)
- **Listicle'lı guest blog'lar.** Julian, başka sitelerde listicle (liste) içeren guest blog'ların (1) "bir numaralı uzman/en iyi uzman" tanınırlığı inşa ettiğini, (2) bu sayfaların Google AI Overviews içinde de sıralandığını söylüyor; Koray "kesinlikle işe yarıyor" diye onaylıyor. (satır 212–214)
- **İkincil exact-match domain'ler (EMD).** Bazen "best lawyers for Filipinos" veya "eSIM for Africa" gibi exact-match terim içeren ikincil domain'ler oluşturup içerik koyuyorlar; EMD terimleri sayesinde AI'ı yine etkiliyor. (satır 214–217)
- **Doküman platformu alt alan adları (subdomain).** Bazen Mintlify, Docusaurus, Notion vb. platformlar altında subdomain'ler açıp bu subdomain'lerle AI'ı doğrudan kendi içerikleriyle besliyorlar. (satır 217–218)
- **(Bağlam — bir sonraki bölüme köprü)** Devamında içeriği Reddit postuna, videoya, podcast'e, IMDb profiline, e-kitaba (Goodreads/Google Scholar/Amazon) dönüştürüp her yere "content seeding / echo" stratejisiyle dağıttıklarından bahsediyor. Bu dağıtım katmanı ayrı bir bölümün konusudur; burada yalnızca link/konsensüs ile bağlantısı kadarıyla anılır. (satır 218–234)

---

## Derinleştirme: araştırma bulguları

### 1. "External topical map" adının röportaj içindeki atfı

İlk dökümde "James Doole" diye geçen kişi James Dooley'dir. Yeni sağlanan Dooley–Gübür konuşması ve [yayıncı dökümü](https://fatrank.transistor.fm/596/transcript), Koray'ın bu adlandırmayı aralarındaki konuşmada Dooley'ye atfettiğini gösterir. Bu, röportaj içindeki atfı destekler; terimin ilk kez kim tarafından ve ne zaman kullanıldığını bütünüyle kanıtlamaz. Yeni konuşma ayrı kaynak kaydıyla aşağıda işlenmiştir.

### 2. Mention–görünürlük ilişkisi: önceki korelasyon notunun sınırı

Önceki haritada Ahrefs çalışmasına atfedilen sayılar aşağıda tarihsel araştırma notu olarak korunur; bu ek kapsamında veri seti yeniden analiz edilmedi. Bu ilişkilerden algoritmik ağırlık, müdahale etkisi veya sıralama garantisi çıkarılmaz:

- **Markasız/markalı web mention'ları** AI görünürlüğüyle 0,66–0,71 korelasyon; **klasik backlink** yalnızca ~0,218. Katsayıların yaklaşık üç kat farklı olması, bir mention'ın bir backlink'ten üç kat etkili olduğu anlamına gelmez.
- **YouTube mention'ları** en güçlü faktör (~0,737) — ChatGPT, AI Mode ve AI Overviews'ta tutarlı.
- Bu gözlem, çoklu kaynak ilişkisini araştırmaya değer kılar. Bütün modellerin aynı konsensüs mekanizması kullandığını veya mention ekleyince önerinin artacağını kanıtlamaz.
- Ham hacim için aktarılan ~0,194 ilişkisi de gözlemseldir; yalnız yayın veya mention sayısına dayalı başarı kotası belirlenmez.

### 3. GEO (Generative Engine Optimization) — Princeton 2023 makalesi

Aggarwal, Murahari, Rajpurohit, Kalyan, Narasimhan, Deshpande — *"GEO: Generative Engine Optimization"* (arXiv:2311.09735, Kasım 2023; KDD 2024'te sunuldu). ~10.000 sorgu içeren GEO-bench üzerinde 9 içerik müdahalesi test edildi:

- En etkili müdahaleler: **kaynak gösterme (Cite Sources), alıntı ekleme (Quotation), istatistik ekleme (Statistics)** — görünürlükte %30–40 relatif artış.
- Klasik SEO taktiği "keyword stuffing" sıfıra yakın/negatif.
- Düşük sıralı siteler orantısız fayda görüyor (rank-5 için +%115) — GEO, klasik aramadan daha "demokratik".
- Koray'ın "claim + founder says + alıntı" formülü, bu makalenin "attributed quotation" ve "cite sources" bulgularıyla doğrudan uyumlu.

### 4. Entity–attribute ilişkisi: içerik modeli ile üretim mekanizmasını ayırma

Marka–özellik ilişkileri içerik ve test planı kurmak için kullanılabilir. Ancak LLM'lerin harici kaynak veya bilgi grafı kullanmadığı söylenemez: ürünler model bilgisini arama/retrieval ve başka araçlarla birleştirebilir. Birlikte geçiş sıklığı, tek başına öneri nedeni olarak gösterilmez. Organization/`sameAs` doğru kimlik tanımına hizmet eder; panel, eğitim verisi veya öneri garantisi değildir. Güncel birincil kaynaklar yeni ekin S02–S03 ve S11 kayıtlarındadır.

### 5. Konsensüs: kaynağın kökeni ve özgün kanıtı

Konuşmacıların “tekrar konsensüs yaratır” yaklaşımı bir hipotezdir. Aynı metni çoğaltan on yayın, on bağımsız test sayılmaz. Wu–Marian'ın yanıt birleştirme araştırmaları, kaynak benzerliği ve özgünlük gibi etkenleri de inceler; güncel Google algoritmasının aynı olduğu kanıtlanmış değildir. Çoğunlukla söyleneni, doğru veya bağımsız doğrulanmış bilgiyle eşitlemeyiz. Ayrıntılı kaynak denetimi yeni ekte yer alır.

### 6. PageRank ve link çevresi: doğrulanmış kapsam

Google'ın [resmi sıralama rehberi](https://developers.google.com/search/docs/appearance/ranking-systems-guide), PageRank'in çekirdek sistemlerin parçası olarak devam ettiğini açıklar. Önceki haritanın API sızıntısındaki `sourceType`, `context2`, `fullLeftContext` gibi alanlara ilişkin yorumları, alanların bugünkü etkisini veya ağırlığını kanıtlamaz. Bunlardan “linkin çevresindeki 5–15 kelimeye iddia koy” gibi zorunlu reçete çıkarılmaz. Kullanıcıya hedefi anlatan doğal anchor ve doğru çevre bağlamı editöryal tercihtir.

### 7. Listicle ve karşılaştırmalar: önceki gözlemlerin sınırı

Önceki haritada bazı sektör yazılarına dayanılarak “2025'e kadar işe yaradı”, “%69”, “%30–50 kayıp” gibi sayılar aktarılmıştı. Bu ek kapsamında o örneklemler ve nedensel yorumlar yeniden doğrulanmadı; sabit Google davranışı veya proje kabul şartı olarak kullanılmaz. Kaynaklar tarihsel araştırma izinde korunur. Güncel karar, gerçek test ve kapsamı açık karşılaştırma üretmek; yayın ilişkisini açıklamak; kaynak gösterilme ile öneriyi ayrı ölçmektir. FTC'nin ilgili birincil rehberleri yeni ekte S08–S09 ve S13 altında yer alır.

### 8. EMD: resmi sistem açıklamasıyla sınırlama

Google'ın resmi rehberi, domain sözcüklerinin birçok alaka etkeninden biri olduğunu ve exact-match domain sisteminin bu eşleşmeye aşırı kredi verilmesini önlemek üzere çalıştığını açıklar. Bu belge AI görünürlüğü için belirli büyüklükte bir EMD avantajı vermez. Yardımcı domain açmak proje zorunluluğu değildir.

### 9. Doküman platformları ve üçüncü taraf yayınlar

Notion, Mintlify veya Docusaurus gibi platform seçimi, bağımsız doğrulama sağlamaz. Kendi yayımladığımız içerik kendi kontrolümüzdeki kaynaktır. Her üçüncü taraf yazısı site reputation ihlali değildir; Google politikasında amaç ve ev sahibi sitenin sıralama sinyallerinden yararlanma bağlamı önemlidir. `llms.txt` hakkındaki tekil tarama gözlemlerinden bütün motorlara kural çıkarılmaz; Google Search için resmi rehber bu dosyayı gerekli veya özel avantaj sağlayan bir unsur olarak tanımlamaz. Yeni ekin S03–S04 kayıtları uygulanır.

---

## Doğrulama tablosu

İşaretler: ✅ doğrulandı · ⚠️ kısmen/koşullu doğru · ❓ belirsiz · ❌ yanlış/riskli

| # | Röportajdaki iddia | Değerlendirme | Dayanak |
|---|---|---|---|
| 1 | Link building eskisinden çok daha önemli | ❓ | Bütün projelere genellenen zaman karşılaştırması doğrulanmadı; PageRank'in devamı ayrı olgudur. |
| 2 | Adlandırmayı James Dooley yaptı | ✅/⚠️ | Yeni röportajda atıf var; terimin evrensel kökeni kanıtlanmıyor. |
| 3 | Link = PageRank + mention + claim | ⚠️ | Üç olası unsur için çalışma modeli; her yayında üçü de oluşmaz, sabit ağırlık yok. |
| 4 | Tekrar + öz-atama → AI önerisi | ❓ | Kontrollü nedensel kanıt yok; yapay mention güncel Google rehberince önerilmiyor. |
| 5 | Dış kaynaklar AI yanıtlarına katkı sağlayabilir | ⚠️ | Retrieval ve çoklu kaynak mümkün; yapay konsensüsün başarı garantisi yok. |
| 6 | Host domain'in adı makale konusunu belirlemeli | ⚠️ | Gerçek okur/konu uyumu editöryal tercih; domain adı tek başına yeterli değil. |
| 7 | Anchor çevresinde sabit kelime penceresi gerekir | ❌ | Resmi eşik yok; sızıntı alan adları bu SOP'yi doğrulamaz. |
| 8 | Listicle yayınlamak öneri ve sıralama getirir | ❓ | Kaynak göstermek ve öneri farklıdır; önceki sektör gözlemleri evrensel sonuç vermez. |
| 9 | İkincil EMD AI'ı etkiler | ❓ | AI'a özgü sabit avantaj doğrulanmadı; resmi EMD sistemi aşırı krediyi sınırlar. |
| 10 | Doküman subdomain'i AI'ı beslemek için gerekir | ❌ | Platform zorunluluğu yok; kendi yayını bağımsız kaynak değildir. |
| 11 | Kanıtsız üstünlük iddiaları kullanılabilir | ❌ | Ürün iddiası ve kapsam kanıtı gerekir; atıf veya tekrar iddiayı doğruya çevirmemelidir. |
| 12 | Google PageRank'i bıraktı | ❌ | Resmi rehber devam ettiğini söyler. |
| 13 | KG `resultScore` marka güven/clarity puanıdır | ❌ | API isteğinin koşullarına eşleşmeyi tanımlar. |
| 14 | “Truth range” resmi Google eşiğidir | ❌ | Konuşmacının terimi; resmi evrensel aralık bulunmadı. |


---

## External topical map SOP'si

Amaç: İç topical map markanın **sayfalarını** kapsarken, external topical map markanın **dış yayınlardaki bahis + iddia + link grafiğini** kapsar. Hedef, doğru ürün özelliklerinin hangi yayın ve kanıtlarla desteklendiğini izlemektir. Yeni konuşma eki sahiplik, kanıt kökeni ve deney ayrımını ekler.

**Adım 0 — Entity ve hedef sorgu tanımı.** Markayı tek bir entity olarak netleştirin (ad, kurucu adı, hizmet, coğrafya). AI'da kazanmak istediğiniz "decision" sorgularını listeleyin (ör. "Teksas'ta TBI için en iyi avukat").

**Adım 1 — Hedef öznitelik listesi (attribute list).** Entity'ye bağlamak istediğiniz öznitelikleri çıkarın. İki tip:
- *Objektif/kanıtlanabilir* (tercih edilen): "no sign up", "free", "24/7 available", "no-win-no-fee", "40+ years combined experience", "board-certified", "AV Preeminent rated".
- *Subjektif/superlatif* (riskli — hukuk/sağlıkta kaçının): "best", "biggest", "highest success rate". Bunları ancak **bağımsız, kanıtlanabilir bir kaynağa** (ör. bir derleme yayını, ödül) dayandırarak ve atıfla kullanın.

**Adım 2 — İddia cümleleri (claim statements).** Her öznitelik için, kapsamı ve kanıtı açık iddia cümleleri yazın: `{Marka} + {öznitelik} + {kaynak/founder says} + {istatistik/alıntı}`. Örnek: "audiototext.com, kayıt gerektirmeden çalışan ücretsiz bir ses-metin aracıdır." Superlatif yerine ölçülebilir ifade: "en büyük" yerine "Teksas'ta X ofisle hizmet veren" gibi doğrulanabilir ifadeler.

**Adım 3 — Yayıncı seçimi (okur, konu ve editöryal uygunluk).** Gerçek yayın içeriğini, okur ihtiyacını, sahipliği ve kanıtı inceleyin. Domain adı veya araç puanı tek başına seçim gerekçesi değildir. Aşağıdakiler önceki röportajın tarihsel konu eşleştirme örnekleridir:
- `skillsunit.com` → "skills to be a lawyer" → kurucu alıntısıyla kendini anma.
- `truckcalendar.com` → "truck accident" → hizmet linki.
- Domain'in gerçekten o konuda tarihçesi/sıralaması olmalı; alakasız domain parasite/spam riskidir.

**Adım 4 — Makale konusu matrisi.** Her host domain için, hedef öznitelik + sorguyu taşıyan doğal bir makale konusu belirleyin (Şablon tablo'ya bakın). Makale **kullanıcıya gerçek değer** vermeli (Google link spam politikası: salt link amaçlı, ölçekli guest post = ihlal).

**Adım 5 — Anchor ve çevre metin (annotation).** Anchor hedef sayfayı doğru anlatır; çevre metin iddiayı kapsamıyla açıklar. Sabit kelime mesafesi veya exact-match kotası yoktur. Ücretli bağlantıda `rel="sponsored"` tercih edilir; `nofollow` da kabul edilir. Okura ticari ilişki ayrıca açıklanır. Link işaretlemesinden mention/AI etkisi garantisi çıkarılmaz. Kurucu beyanı bağımsız test diye sunulmaz.

**Adım 6 — Yayın kadansı (publication cadence).** Yayın kapasitesi ve gerçek katkıya göre kadans seçin. 6–8 ay/rastgelelik resmi güven eşiği değildir; sahte ilişki veya PBN üretmeyin. Host domain çeşitliliği (aynı az sayıda siteye çok makale = red flag). Her yayından sonra konsensüs ölçümü (aşağıdaki panel) ile ilerleyin.

**Adım 7 — Konsensüs ve reputation katmanı.** Dış bahisleri farklı kaynak tiplerine yayın (editöryel makale, röportaj, derleme, Wikidata/Organization şema, podcast/video mention). Tek bir taktiğe (özellikle self-listicle'a) yaslanmayın.

---

## Şablon tablo

Aşağıdaki tablo external topical map yürütmesi için ana çalışma dosyasıdır. Her satır = bir dış yayın hedefi.

| Hedef özellik (attribute) | İddia cümlesi (claim) | Host domain tipi | Makale konusu | Anchor / çevre metin (annotation) | Hedef URL |
|---|---|---|---|---|---|
| no sign up | "Kayıt gerektirmeden, doğrudan sürükle-bırak ile çalışır" | Üretkenlik/araç blog'u (konu adı araçla uyumlu) | "Kayıt istemeyen en pratik ses-metin araçları" | anchor: *free audio to text tool* · çevre: "...no sign up gerektirmeden çalışan [araç]..." | /audio-to-text |
| free | "Tamamen ücretsiz kullanım" | Yazılım inceleme sitesi | "Ücretsiz transkripsiyon araçları karşılaştırması" | anchor: *free transcription tool* · çevre: kurucu alıntısı + ücretsiz vurgusu | / (ana) |
| highest compensation (hukuk) | "Firma, X davada ortalama üstü tazminat sonuçları açıkladı" (kanıtlanabilir, atıflı) | Hukuk kariyer/eğitim domain'i (ör. skillsunit.com) | "Başarılı bir kaza avukatı olmak için gereken beceriler" | anchor: *accident lawyer in {şehir}* · çevre: "Atlanta, Georgia'daki {Firma} kurucusu ... diyor" | /practice-areas/accident |
| truck accident uzmanlığı | "{Firma}, kamyon kazası davalarında uzmanlaşmıştır" | Konu-adı uyumlu domain (ör. truckcalendar.com) | "Kamyon kazası sonrası yapılması gerekenler" | anchor: *truck accident lawyer* · çevre: hizmet + coğrafya | /truck-accident |
| no-win-no-fee | "Kazanılmadıkça ücret alınmaz modeliyle çalışır" (doğrulanabilir) | Tüketici hakları/finans blog'u | "No-win-no-fee hukuki hizmet nasıl çalışır" | anchor: *no win no fee lawyer* · çevre: model açıklaması + marka | /fees |
| EMD terim (ör. eSIM for Africa) | "Afrika seyahatleri için eSIM çözümü" | İkincil EMD mikro-site | "Afrika'da eSIM nasıl kullanılır" | anchor: markalı · çevre: EMD terim + hizmet | eSIMforAfrica.com → money site |

> Not: Hukuk ve sağlık gibi düzenlenmiş sektörlerde "highest / biggest / best" gibi superlatif iddialar baro/FTC açısından risklidir (aşağıdaki Riskler bölümü). Mümkün olduğunca **doğrulanabilir, nesnel** iddialara dönüştürün.

---

## AI konsensüs ölçüm yöntemi

Amaç: External topical map çalışmasının AI motorlarında konsensüs oluşturup oluşturmadığını **tekrarlanabilir** biçimde ölçmek. "Mention share" (bahis payı) ve "recommendation share" (öneri payı) ayrı ayrı izlenir — çünkü 2026 verisi cite ≠ öneri ayrışmasını gösteriyor.

### 1. Prompt paneli (sabit sorgu seti)
Her hedef sorgu için 3 varyant yazın (doğrudan, karşılaştırmalı, karar odaklı). Örnekler:
- Doğrudan: "Teksas'ta travmatik beyin yaralanmaları için en iyi avukat kim?"
- Karşılaştırmalı: "Teksas'ta TBI davaları için en iyi 5 hukuk firması hangileri?"
- Karar odaklı: "Houston'da bir kamyon kazası geçirdim, hangi avukatı aramalıyım?"

### 2. Motor matrisi
Aynı panel 4 yüzeyde çalıştırılır: **ChatGPT (arama açık), Google Gemini, Perplexity, Google AI Overviews** (+ opsiyonel: Google AI Mode, Claude, Bing Copilot). Haftalık üç tekrar başlangıç için isteğe bağlı örnekleme planıdır; yüzey/model/arama modu ve koşullar kaydedilir. Başarı veya güvenilirlik eşiği değildir.

### 3. Kaydedilen metrikler (her koşu için)
- **Mention var mı?** (marka adı yanıt gövdesinde açıkça geçiyor mu) — 0/1. Atıf listesindeki URL ayrı kaydedilir.
- **Recommendation var mı?** (yanıt markayı aktif olarak öneriyor mu) — 0/1.
- **Atıf/citation var mı?** — 0/1; kendi domain URL'si ve dış publisher URL'si ayrı kaydedilir. Kaynak pasajının iddiayı desteklemesi ayrıca denetlenir.
- **Öznitelik eşleşmesi:** Yanıt markayı hangi öznitelikle anıyor ("free", "no sign up", "experienced")? Hedef listesiyle karşılaştır.
- **Pozisyon:** Listede kaçıncı / ilk paragrafta mı.
- **Rakip payı:** Aynı yanıtta hangi rakipler geçiyor.

### 4. Türetilen KPI'lar
- **Mention Share** = (marka mention'lı koşu sayısı) / (toplam koşu).
- **Recommendation Share** = (marka önerilen koşu) / (toplam koşu).
- **Attribute Match Rate** = (hedef özniteliğin doğru atfedildiği koşu) / (mention'lı koşu).
- **Citation–Recommendation Gap** = Citation Rate − Recommendation Share; aynı geçerli koşu kümesi kullanılır. Mention − Recommendation istenirse ayrı bir metrik adıyla yazılır. Fark tek başına listicle sorunu veya ceza kanıtı değildir.

### 5. Otomasyon ve yorum
- Paneli ayrı veri seti olarak saklayın. Search Console Web ve Generative AI raporlarının mevcut kapsamı ile karşılaştırın; bu toplu raporları tekil prompt, AIO-only veya citation verisi gibi yorumlamayın.
- AI gösterimi, Web gösterimi ve doğrulanmış crawl kayıtlarını kendi kapsamlarıyla analiz edin. Eşleşmeyen ülke/dönem/yüzey/boyutları birleştirmeyin; UA etiketi kimlik veya eğitim kanıtı değildir.
- Dış yayın öncesi baseline ve sonrası aynı koşullu gözlemler alınır. 2–4 hafta isteğe bağlı gözlem aralığıdır; fark nedensellik kanıtı değildir. Model, sezon, site ve rakip değişiklikleri kaydedilir.

---

## İkincil EMD ve doküman platformu alt alan adları

### A. İkincil EMD mikro-siteleri

| Unsur | Uygulama | Risk seviyesi |
|---|---|---|
| Domain seçimi | "best lawyers for Filipinos", "eSIM for Africa" gibi niş/coğrafya EMD terimi | ⚠️ Orta — EMD artık minör sinyal; marka/UX olmadan sürdürülemez |
| İçerik | Gerçek değerli, özgün içerik; thin/affiliate-only olmamalı | ❌ Yüksek (thin ise) — EMD update + scaled content abuse riski |
| Linkleme | Money site'a doğal, az sayıda, bağlamsal link | ⚠️ Orta — aşırı exact-match anchor demotion tetikler |
| Ölçek | Çok sayıda EMD mikro-site = ağ (network) → PBN algısı | ❌ Yüksek — PBN/link scheme manuel+algoritmik ceza |
| AI faydası | EMD'nin AI önerisine özgü etkisi doğrulanmadı | ❓ Yardımcı domain açma gerekçesi yapılmaz |

**Öneri:** EMD'yi aynı zamanda akılda kalır bir **marka** olarak konumlandırın; gerçek içerik + az sayıda doğal link; ağ kurup aralarında yoğun link vermeyin.

### B. Doküman platformu subdomain'leri (Mintlify / Docusaurus / Notion / GitBook)

| Unsur | Uygulama | Risk seviyesi |
|---|---|---|
| Platform | Mintlify (otomatik `llms.txt`/`llms-full.txt`) > Docusaurus (eklenti) > Notion (pipeline gerekir) | ✅ Düşük (teknik) |
| Erişim | Herkese açık olmalı; gated docs AI'a görünmez | ✅ Düşük |
| İçerik sahipliği | Kendi markanızın içeriği, kendi kontrolünüzde | Bağımsız dış kaynak sayılmaz; amaç ve politika kapsamı ayrıca değerlendirilir |
| `llms.txt` beklentisi | Google Search için özel fayda/zorunluluk yok; başka ürünlerin desteği ayrı doğrulanır | Motorlara genellenmez |
| Başka otoritenin reputation'ına yaslanma | Alakasız içeriği otoriteli platform subdomain'ine koyup o domain'in gücünü sömürmek | ❌ Yüksek — site reputation abuse (Mart 2024 / Kasım 2024 / Ağustos 2025) |
| Ölçek | Çok sayıda subdomain'e kopya/scaled içerik | ❌ Yüksek — scaled content abuse |

**Öneri:** Doküman subdomain'lerini **kendi ürün/marka dokümanınız** olarak, özgün ve güncel içerikle kullanın; amaç AI'a temiz, taranabilir markdown sunmak. Başka bir platformun otoritesini "kiralama" niyeti taşımayın.

---

## Proje kontrol listesi

- [ ] Entity tanımı (marka adı, kurucu, hizmet, coğrafya) netleştirildi.
- [ ] Hedef AI "karar" sorguları (decision queries) listelendi.
- [ ] Hedef öznitelik listesi çıkarıldı; her biri objektif/subjektif olarak etiketlendi.
- [ ] Subjektif/superlatif iddialar (best/biggest/highest) baro + FTC açısından gözden geçirildi; mümkünse doğrulanabilir ifadeye dönüştürüldü.
- [ ] Her özellik için kapsamı ve kanıtı açık iddia kaydı açıldı; kurucu beyanı bağımsız kanıt sayılmadı.
- [ ] Yayıncılar gerçek konu/okur uyumuyla seçildi; sahiplik, ödeme ve editöryal kontrol kaydedildi.
- [ ] Makale konusu matrisi dolduruldu; her makale kullanıcıya gerçek değer veriyor.
- [ ] Anchor + çevre metin (annotation) planlandı; exact-match anchor aşırıya kaçmıyor.
- [ ] Ticari/sponsorlu linkler `rel="sponsored"`/`rel="nofollow"` ile işaretlendi.
- [ ] Gerçek katkı/kapasiteye göre kadans seçildi; süre/rastgelelik sıralama garantisi yapılmadı.
- [ ] AI konsensüs prompt paneli (ChatGPT/Gemini/Perplexity/AI Overviews) kuruldu; baseline ölçüldü.
- [ ] Mention / recommendation / own-domain citation / dış publisher citation ayrı; kaynak desteği ve yanlış özellik oranı izleniyor.
- [ ] İkincil EMD'ler gerçek içerikli ve marka gibi konumlandı; PBN ağı kurulmadı.
- [ ] Doküman subdomain'leri herkese açık, özgün, kendi içeriğiniz; sitemap + robots.txt doğru.
- [ ] Search Console mevcut raporları ve crawl kayıtları kapsamları korunarak kullanılıyor; prompt, citation veya eğitim kanıtına dönüştürülmüyor.
- [ ] Self-promotional "best X" listicle kullanımı sınırlandı / bağımsız-dengeli hale getirildi.

---

## Riskler ve politika uyarıları (risk seviyeleriyle)

| Risk | Açıklama | Seviye | Azaltma |
|---|---|---|---|
| **Hukuk/sağlık reklam kuralları** | ABA Model Rule 7.1 ve eyalet baroları (TN, AZ, NY...) "best/No.1/biggest/highest success rate" gibi kanıtsız subjektif superlatifleri yasaklar; doğrulanabilir üçüncü-taraf rozetleri (Super Lawyers vb.) atıfla izinli. | 🔴 Yüksek | Superlatifleri doğrulanabilir, nesnel ifadeye çevir; üçüncü-taraf kaynağa dayandır; baro kurallarını jurisdiction bazında kontrol et. |
| **FTC / yanıltıcı reklam** | Rakibi aşağılayan kanıtsız "best X" iddiaları FTC incelemesi çekebilir. | 🔴 Yüksek | İddiaları test/veriyle destekle; karşılaştırmalı iddialarda kanıt sakla. |
| **Self-promotional listicle yorumu** | Önceki sektör gözlemleri genel Google mekanizmasını veya sabit kayıp oranını kanıtlamaz. | Koşullu | Gerçek test, kapsam, dengeli karşılaştırma ve ilişki açıklaması gerekir. |
| **Link spam / ölçekli guest post** | Salt link amaçlı, ölçekli guest posting = link scheme; manuel + algoritmik ceza (hem yayıncı hem alıcı). | 🟠 Orta-Yüksek | Gerçek değerli içerik; `rel=sponsored/nofollow`; az sayıda, alakalı, çeşitli host. |
| **Site reputation abuse (parasite SEO)** | Otoriteli platform subdomain'ine alakasız içerik = ihlal (birinci-taraf gözetimi olsa bile); subdomain güvenli liman değil. | 🟠 Orta-Yüksek | Yalnızca kendi markanın, kontrolündeki özgün içeriği; başka otoriteyi kiralama. |
| **Scaled content abuse** | Kullanıcı değeri eklemeden sıralamayı yönlendirmek için çok içerik üretimi. | 🟠 Orta-Yüksek | Gerçek kullanıcı faydası ve kanıt; yavaş yayın veya yaşlandırma güvenli liman değildir. |
| **PBN algısı** | İkincil EMD'ler arasında yoğun karşılıklı linkleme. | 🟠 Orta | Ağ içi linklemeden kaçın; doğal, seyrek, bağlamsal linkler. |
| **EMD demotion / anchor mismatch** | Aşırı exact-match anchor ve thin EMD demotion tetikler (API leak sinyali). | 🟡 Orta-Düşük | Anchor çeşitliliği; EMD'de gerçek içerik + marka. |
| **`llms.txt` yanlış beklenti** | Google Search için özel avantaj veya zorunluluk çıkarmak. | Koşullu | Motorun resmi gereksinimini ayrı doğrula; taranabilir asıl içeriğe odaklan. |
| **Konsensüs manipülasyonu etiği/regülasyonu** | Yapay konsensüs üretmek yanıltıcı; gelecekte regülasyon/filtre riski. | 🟡 Düşük-Orta | Gerçek değer ve doğru iddialara dayan; ölçüp sürdürülebilir olanı koru. |

---

## Ölçüm / KPI

| KPI | Tanım | Hedef yön |
|---|---|---|
| Mention Share | AI panelinde markanın bahsedildiği koşu oranı | ↑ |
| Recommendation Share | AI panelinde markanın aktif önerildiği koşu oranı | ↑ |
| Attribute Match Rate | Hedef özniteliğin doğru atfedildiği koşu oranı | ↑ |
| Citation–Recommendation Gap | Aynı panelde citation oranı − recommendation oranı | Bağlamıyla yorumla; tek başına başarı/ceza hedefi değil |
| Branded web mentions | Markanın web'de (linkli/linksiz) geçiş sayısı | ↑ |
| YouTube mention | Video başlık/transkript/açıklamada gerçek marka geçişi | Kanal gözlemi; evrensel en güçlü sinyal sayılmaz |
| Referring domains (alakalı) | Konu-alakalı, çeşitli host'lardan link sayısı | ↑ (sağlıklı kadansla) |
| Generative AI impressions (GSC) | Güncel raporun tanımladığı toplu gösterim; AIO-only/prompt/citation sayılmaz | Kapsamıyla izle |
| Crawl frequency / user-agent | Hangi Google/AI user-agent'ı ne sıklıkla tarıyor | izle |
| Organik görünürlük sağlığı | Core update'lerde düşüş olmaması (self-listicle cezası erken uyarı) | stabil/↑ |
| EMD/subdomain indeks durumu | İkincil varlıkların indekslenme + ceza yok durumu | temiz |

---

## Kaynaklar

- James Dooley / external topical map: [Skillnation — Koray & James Dooley](https://skillnation.in/posts/did-koray-learn-semantic-seo-from-james-dooley/), [James Dooley Podcast — Topical Map vs Semantic Content Network](https://jamesdooleypodcast.transistor.fm/574), [Muckrack bio](https://muckrack.com/james-dooley/bio)
- GEO (Princeton 2023): [arXiv:2311.09735](https://arxiv.org/abs/2311.09735v1), [Metavert GEO özeti](https://metavert.io/generative-engine-optimization)
- Ahrefs brand mention vs AI visibility: [Ahrefs — AI Brand Visibility Correlations (75k)](https://ahrefs.com/blog/ai-brand-visibility-correlations), [Ahrefs — Branded Web Mentions & AI Search](https://ahrefs.com/blog/branded-web-mentions-visibility-ai-search/)
- Entity–attribute co-occurrence / Knowledge Graph: [Dejan.ai — Knowledge Graph](https://dejan.ai/concepts/knowledge-graph/), [AirOps — Brand-Entity Association](https://www.airops.com/glossary/brand-entity-association), [Geosurge — Entity-Attribute Relationships](https://geosurge.ai/corpus/gen-2950/entity-linking/entity-attribute-relationships.html)
- Konsensüs: [The Decoder — LLMs are consensus machines (Harvard)](https://the-decoder.com/llms-are-consensus-machines-similar-to-crowdsourcing-harvard-study-finds/), [arXiv — Consensus Is All You Need](https://arxiv.org/html/2508.18292v1)
- Google API leak (PageRank/sourceType/anchor context): [SE Ranking — Google API leak](https://seranking.com/blog/seo-news-google-api-data-leak/), [Farbentour — Google Leak glossary](https://www.farbentour.de/en/glossary/google-leak-2024/)
- Self-promotional listicle / AI Overviews: [Lily Ray — Calling yourself the best helps competitors](https://lilyraynyc.substack.com/p/why-calling-yourself-the-best-could), [SEJ — Why calling yourself the best helps competitors](https://searchengineland.com/), [BloggersIdeas — Google penalizing self-promotional listicles 2026](https://www.bloggersideas.com/?p=2162352)
- EMD güncel değeri: [Search Engine Land — EMD value](https://searchengineland.com/exact-match-domains-value-453837), [Fruits.co — Do EMDs still work 2026](https://fruits.co/news/do-exact-match-domains-still-work-for-seo-in-2026)
- Link spam / guest posting: [SEOZoom — Google algorithm vs spam links/guest posts](https://www.seozoom.com/a-google-algorithm-against-spam-links-for-guest-posts-and-affiliate-links), [Bruce Clay — Paid guest posting](https://www.bruceclay.com/?p=81799)
- Site reputation abuse / parasite SEO: [Siteimprove — Site reputation abuse](https://www.siteimprove.com/blog/understand-googles-site-reputation-abuse-policy/), [Userp — Google cracks down on parasite SEO](https://userp.io/news/google-cracks-down-on-parasite-seo-in-site-reputation-abuse-policy-update/)
- Doküman platformu / llms.txt: [Mintlify — AI ingestion](https://www.mintlify.com/docs/ai-ingestion), [Evil Martians — Making your site visible to LLMs](https://evilmartians.com/chronicles/how-to-make-your-website-visible-to-llms), [Released.so — new robots.txt for LLM era](https://www.released.so/articles/the-new-robots-txt-for-the-llm-era)
- Hukuk reklam kuralları (superlatif): [SC Bar EAO 17-02](https://www.scbar.org/media/50rh4nkj/17-02.pdf), [NYSBA 1005 — Misleading superlatives](https://ezel.ai/ethics-opinions/nysba/1005-misleading-superlatives-in-lawyer-advertising), [AZBAR 91-08](https://ezel.ai/ethics-opinions/azbar/91-08-advertising-law-lists)


---

## Yeni konuşmadan öğrenilenler: dış kaynaklarda iddia, kanıt ve bağımsızlık

İç araştırma kaydı: **17 Ekim 2026**. Bu ek, ilk Julian Goldie röportajından ayrı bir kaynağa dayanır: James Dooley × Koray Tuğberk Gübür, *External Topical Maps: Building Third-Party Semantic Content Networks for AI Visibility*, Fatrank Podcast E596. [Yayıncı dökümü](https://fatrank.transistor.fm/596/transcript), [yerel kaynak ve kapsam kaydı](../docs/research/external-topical-map-source-2026-10-17.md). Kullanıcının verdiği metnin tamamı değişmeden saklanmıştır; otomatik dökümdeki özel isimler ve konuşmacı etiketleri ses kaydıyla ayrıca doğrulanmış değildir.

**Temel anlam:** İç topical map, kullanıcının hangi işini hangi sayfa/araçla çözdüğümüzü düzenler. Dış topical map ise markamız hakkında hangi özelliğin, hangi bağlamda, kimin deneyimi veya hangi veriyle desteklendiğini düzenleyen bir yayın ve kanıt planıdır. Bunu yalnızca backlink listesi olarak ele almak eksiktir. Farklı domain sayısını bağımsız doğrulama sayısı olarak kabul etmek de eksiktir. Buradaki çalışma tanımı proje tercihidir; Google'ın ilan ettiği bir sıralama modeli değildir.

### Konuşmanın eksiksiz anlam ve iddia dökümü

Aşağıdakiler kullanıcının sağladığı konuşmanın parafrazıdır. E01–E27 kimlikleri bu ekin konu kimlikleridir; özgün dökümün satır veya zaman damgaları değildir. Selamlaşma, şakalaşma ve kurs tanıtımı yöntem kanıtı olarak kullanılmaz.

| ID | Konuşmada anlatılan | Temiz çıkarım ve kanıt statüsü |
| --- | --- | --- |
| E01 | Dış topical map, semantic content network'ün dış kaynaklarda kurulmasıdır; adlandırma Dooley ile yapılan konuşmadan gelir. | Terim atfı röportaj içinde doğrulanabilir; evrensel veya tescilli yöntem adı olduğu kanıtlanmaz. |
| E02 | Amaç yalnız bir siteyi sıralamak değil; autocomplete, ilgili aramalar ve başka SERP özelliklerini de etkilemek olabilir. | Hedef türlerini ayır. Dış yayınların bu sonuçları kontrol edebildiği gösterilmedi. |
| E03 | Farklı domain'ler aynı entity'nin belirli niteliklerini destekleyebilir, birbirini anabilir. | İddia–kaynak ilişkisini izle; zorunlu karşılıklı link ağı çıkarma. |
| E04 | Houston hukuk bürosu örneğinde büyüklük, başarı ve tazminat gibi özellikler hedefleniyor; yerel sonuç iyileşmesi anlatılıyor. | Konuşmacı vaka beyanı. Yerel sıralamada nedensellik veya rakamlar bağımsız doğrulanmadı. |
| E05 | Dış yayından link, mention ve claim elde edilebilir; bazen mention çevresi ve iddia daha önemli sayılıyor. | Üç ayrı gözlem alanı olarak kullan; üçünün her yayında oluşacağını veya etkilerinin eşit/sabit olduğunu varsayma. |
| E06 | QR aracı, VPN, B2B/B2C örneklerinde “free” gibi özellikler sorgu ve hedef kitleyle birlikte seçiliyor. | Özelliği gerçek ürün koşuluna bağla. Ücretsiz deneme ile sürekli ücretsiz kapsamı birbirine dönüştürme. |
| E07 | Önce domain filtreleme; sonra anchor/çevre metin, brief ve yayın sırası planlanıyor. | Yayıncının okuru ve test edebileceği özellik, domain adından daha kullanışlı seçim ölçütüdür. |
| E08 | Dooley “wasteful domains” adını eleştirip yardımcı/ikincil domain adlandırmasını öneriyor. | İsimden kalite veya bağımsızlık sonucu çıkarılmaz; sahiplik ve içerik kontrolü kaydedilir. |
| E09 | Uzun AI sorgularından türetilen alt sorgular “query fan-out” veya “query augmentation” diye tartışılıyor. | İlişkili kavramlardır; bütün motorlarda aynı mekanizma oldukları çıkarılamaz. Google fan-out kullanımını açıklar. [S03] |
| E10 | FatRank–Checkatrade karşılaştırması, markanın kendi sitesinden ziyade gerçek müşterilerin deneyimleri üzerinden anlatılıyor. | Deneyim sahibinin verisi değerlidir; müşteri ilişkisi, teşvik, yazar ve metin kontrolü açık olmalıdır. |
| E11 | İçeride “claim/frame”, dışarıda “proof” ayrımı yapılıyor; Jason Barnard'ın yaklaşımı anılıyor. | Bir yayın dış domain'de diye otomatik olarak bağımsız kanıt olmaz. |
| E12 | Hızla yaklaşık 2.000 yayın üretildiğinde kalite kontrolü zorlaşsa da tekrarın konsensüs oluşturduğu ileri sürülüyor. | Ölçek ve sonuç uzman iddiasıdır. Kaliteyi azaltarak tekrar üretmek uygulama kuralı değildir. |
| E13 | “Corroboration pages” benzer iddiaları destekleyen kaynaklar olarak anlatılıyor. | Kaynakların özgünlüğü, birbirinden türemesi ve aynı iddiayı gerçekten desteklemesi ayrıca incelenir. |
| E14 | “2009, Minji Wu” diye işitilen bir çalışmaya Honda Civic yakıt tüketimi örneğiyle atıf yapılıyor. | Eşleşen 2007 çalışma ve 2011 genişletilmiş yayın bulundu; 2009 atfı kesinleştirilemedi. [S06–S07] |
| E15 | Yanıtın sayfadaki konumu, kapsamı ve başka yanıtlarla ilişkisi puanlamayla ilişkilendiriliyor. | Akademik yanıt birleştirme yöntemleri vardır; bunlar bugünkü Google üretim algoritmasını açıklamaz. |
| E16 | Sayısal yanıtların kabul edilebilir aralığına Koray “truth range” adını verdiğini söylüyor. | Konuşmacının çalışma terimi; resmi Google doğruluk eşiği veya evrensel sayı aralığı değildir. |
| E17 | AI'a hangi özellikleri karşılaştırdığını sorup görünür gerekçelerden hareket etmek öneriliyor. | Aday araştırma kriteri çıkarılabilir. Modelin açıklaması iç mekanizmasının denetim kaydı sayılamaz. [S12] |
| E18 | Üçlü özellik kombinasyonlarını değiştirerek yanıtları toplayan bir script fikri anlatılıyor. | Hipotez keşfi için kontrollü panel olabilir; kullanılan kriteri prompt'a koymak yanıtı zaten yönlendirir. |
| E19 | Tek sayfalık yeni markanın dış yayınlarla ChatGPT, Claude, Gemini ve AI Mode'da önerildiği anlatılıyor. | Bağımsız baseline, ham yanıtlar ve kontrol bulunmadığı için tekrarlanabilir başarı kanıtı değil. |
| E20 | Main domain, extension domain, düşük kontrolle ölçeklenen yardımcı domain ve sahip olunmayan dış yayınlar ayrılıyor. | Dört katman konuşmacının operasyonel sınıflaması. Owned kaynakları bağımsız yayın gibi sayma. |
| E21 | Exact/partial-match yardımcı domain'lerle belirli sorguları hedefleme örneği veriliyor. | Ayrı domain veya EMD zorunluluğu çıkmaz; yalnız sorgu hedeflemek için ağ kurulmaz. [S01] |
| E22 | Ücret ödenen veya ikna edilerek yayın yapan üçüncü taraf siteler ayrı katman sayılıyor. | Mülkiyet, ödeme ve editöryal karar üç ayrı alan. Sponsorlu yayını bağımsız değerlendirme diye etiketleme. |
| E23 | Bir etkinlikte kazanılan “best lead generation agency” ödülünün AI gerekçesine girdiği anlatılıyor. | Gerçek ödül, veren kurum, kategori ve koşullarla sınırlıdır; sektör genelinde en iyi olunduğunu kanıtlamaz. |
| E24 | Sahte saç ekimi istatistikleri/ödüllerinin haberlerde tekrarlandığı, büyük örneklem iddialarının ilgi çektiği söyleniyor. | Yöntemi ve ham kanıtı olmayan sayı veya ödül üretilmez. Gazete alıntısı ilk veriyi doğrulamaz. |
| E25 | Aynı iddiayı farklı kaynakların farklı deneyim/ödüllerle desteklemesi isteniyor; dış “cannibalization” olumlu görülüyor. | Farklı kanıtlar yararlı olabilir. Kopya metin çoğaltmak ve aynı sorguda URL çoğaltmak bağımsız kanıt sağlamaz. |
| E26 | PageRank'in bittiği, KG API'nin “confidence/clarity” puanının devam ettiği; bunun panel ve eğitim verisine katkısı olduğu ileri sürülüyor. | PageRank iddiası yanlış; `resultScore` eşleşme puanıdır. Diğer oklar için doğrudan kanıt yok. [S01–S02, S11] |
| E27 | Visual semantics modülünün beta test edilmesi ve dış topical map eğitiminin sonraki modül olması konuşuluyor. | Eğitim ürünü planıdır; yöntem geçerliliği veya algoritma kanıtı değildir. |

### Araştırmanın değiştirdiği temel kabuller

**1. Link, mention ve claim farklı şeylerdir.** Link: kaynak sayfadaki bağlantı. Mention: markanın açık biçimde anılması. Claim: markaya atfedilen somut özellik. Atıf ise AI yanıtındaki kaynak göstermedir; öneri de kullanıcıya sunulan tercihtir. Bu beş alanı ayrı tutmak bizim ölçüm sözleşmemizdir. Bir publisher URL'sinin cite edilmesi, markanın yanıt metninde anıldığı veya önerildiği anlamına gelmez.

**2. Bağımsızlık, URL veya domain sayısından anlaşılamaz.** 2007 Wu–Marian çalışması, benzer/kopya sayfaların katkısını azaltan source-similarity yaklaşımı içerir. 2011 yayınında kaynak ilgisi, özgünlüğü ve yanıtın kaynak içindeki belirginliği de değerlendirilir. Bunlar bir araştırma sisteminin bulgularıdır. Google'ın aynı puanları kullandığı sonucu çıkmaz. [S06–S07]

Proje uygulamasında on domain aynı basın bültenini yayımlıyorsa on yayın kaydı, bir özgün kanıt ailesi açılır. Aynı gruba ait on sitede farklı gerçek testler bulunuyorsa testler ayrı saklanabilir; yine de sahiplik bağımsızlığı iddia edilmez. Bağımsızlık bilinmiyorsa alan boş/bilinmiyor kalır.

**3. “Truth range”, doğruluğun yerine çoğunluğu koyamaz.** Konuşmacının bu adı kendisinin kullandığını söylemesi, resmi bir metrik olmadığını da gösterir. Bizim kararımız: ölçümlerin kapsamını eşitlemeden ortalama alma. Model yılı, test koşulu veya ölçü birimi değişen yakıt tüketimi örnekleri tek değer gibi birleştirilmez. Takvimde de gerçek tatil tarihi, federal observed closure ve kültürel gün ayrı olgulardır. Aynı yanlış tarih çok yerde bulununca doğru olmaz.

**4. PageRank, KG kimliği ve API eşleşme puanı ayrıdır.** Google, PageRank'in gelişerek çekirdek sistemlerinde kullanılmaya devam ettiğini belirtir. EMD kelimeleri de tek başına sıralama avantajı garantisi vermez. [S01] `resultScore`, entity'nin istekteki koşullarla ne kadar iyi eşleştiğini ifade eder; KGMID ise kimliktir. Bunlardan evrensel bir “marka güveni/berraklığı” skoru üretmeyiz. [S02]

**5. Canlı retrieval, eğitim ve Knowledge Graph aynı süreç değildir.** Google'ın AI rehberi RAG ve fan-out'u açıklar; yapay mention arayışına karşı uyarır. Her olası alt sorguya ayrı sayfa açmayı önermez. [S03] Bir yayının arama ile bulunması model ağırlıklarının güncellendiğini göstermez. Google paneli de otomatik oluşur; bir API kaydı panel görünümünü garanti etmez. [S11]

**6. Autocomplete ve görünür gerekçe kontrol mekanizması değildir.** Autocomplete gerçek aramalar, web'deki sözcük örüntüleri ve bağlamsal etkenlerle oluşur; öneriler olgusal doğrulama sayılmaz. [S10] Anthropic'in deneyleri ise görünen akıl yürütmenin kullanılan ipuçlarını her zaman açıklamadığını gösterir. Bu nedenle “neden önerdin?” cevabını faktör ağırlığı diye raporlamayız. Bulguların test edilen modeller ve görevlerle sınırlı olduğunu koruruz. [S12]

**7. Gerçek müşteri deneyimi ile sponsorlu anlatımın ilişkisi açıklanır.** FTC, sahte deneyimler ve şirket kontrolündeki değerlendirmelerin bağımsız gösterilmesi konusunda kurallar açıklar. Reklamı bağımsız editöryal içerik gibi sunmak yanıltıcı olabilir. Sosyal tavsiyelerde maddi ilişkiler görünür biçimde belirtilmelidir. Açıklama yapmak yanlış bir ürün iddiasını doğruya çevirmemelidir. [S08–S09, S13]

Ücretli bağlantıda Google `sponsored` işaretlemesini tercih eder; `nofollow` da kabul edilebilir. Bu teknik işaret, okura gereken ticari ilişki açıklamasının yerine geçmez. [S05] Tekrar üretmek, yayınları yavaşlatmak veya farklı domain'lere dağıtmak düşük değerli içeriği kendiliğinden uygun hale getirmez. [S04]

### Dört yayın katmanını ayırt etme

Bu tablo konuşmadaki terminolojiyi açıklamak içindir; PrintGridCalendar için yeni domain açma planı değildir.

| Katman | Kontrol / ilişki | Kayda nasıl girer? |
| --- | --- | --- |
| Main domain | Markanın ana ürünü ve açıklamaları | Birinci taraf ürün kanıtı. Özellik test edilebilir; öz değerlendirme bağımsız inceleme sayılmaz. |
| Extension domain | Aynı işletmenin kontrolündeki yardımcı yayın | Sahiplik belirtilir; bağımsız dış kaynak sayacına girmez. |
| Supplementary / “wasteful” domain | Konuşmacının düşük kontrolle ölçeklediğini söylediği yayın ağı | Hacim hedefi çıkarılmaz. Aynı kontrol/köken varsa aynı kaynak grubu olarak izlenir. |
| Dış publisher | Sahibi başka olabilir; ücret ve içerik kontrolü ayrıca araştırılır | Bağımsız editöryal, müşteri deneyimi, sponsorlu, guest-written veya ilişki bilinmiyor olarak ayrılır. |

Bir müşterinin sitesinde marka tarafından yazılmış metin, müşterinin kendi deneyim raporuyla aynı statüde değildir. Müşteri katkısı ve metnin nasıl hazırlandığı kayda girer. Bir etkinliğin verdiği ödül kaydedilebilir; ödülün kapsamı, seçimi veya sponsor ilişkisi bilinmiyorsa buna göre sınırlandırılır.

### PrintGridCalendar için kullanılacak dış kanıt haritası

**Durum:** Aşağıdaki satırlar araştırma/brief adaylarıdır. Özelliklerin bu turda canlı ürün testi yapılmadı; yayıncılarla görüşülmedi ve dış yayın oluşturulmadı. İddia önce yerel dosya/akışla doğrulanır, sonra uygun bir yayıncıya teklif edilebilir. “Kaynak” sütunu elde edilmiş backlink veya endorsement anlamına gelmez.

| İddia adayı | Önce üretilecek somut kanıt | Uygun yayın bağlamı | Dış yazının kullanıcıya katkısı |
| --- | --- | --- | --- |
| Seçili 2027/2028 şablonlarında ücretsiz PDF/JPEG indirme | Seçili URL ve iki dosyanın açılma/indirme kaydı; varsa lisans ve kullanım koşulu | ABD öğretmen planlama veya üretkenlik yayını | Gerçek sınıf/masa planlama örneği ve dosya karşılaştırması |
| Seçili indirme akışında hesap gerekmemesi | Yeni oturumda dosyaya ulaşma kaydı; kapsamı belirli URL'yle sınırlı tut | Hesap istemeyen araçları gerçekten test eden editör | Kayda gerek kalmadan hangi işin tamamlandığını gösterme |
| US Letter çıktısı | PDF sayfa kutusu 612 × 792 pt veya yatay eşleniği; önizleme ve fiziksel baskı ayrı | ABD ev/ofis baskı rehberi | Ölçekleme, kenar boşluğu ve yazı alanı denemesi |
| Ink-saver seçeneği | Aynı sayfa için görsel ve baskı karşılaştırması | Ev/ofis verimlilik incelemesi | Tasarım farkını gösterme; ölçüm olmadan yüzde mürekkep tasarrufu söylememe |
| Large-print seçeneği | Gerçek punto, kontrast ve okuma denemesi | Okunabilir baskı tasarımını inceleyen yayın | Hangi düzende hangi metnin daha rahat okunduğunu sınırlı testle anlatma |
| ABD federal tatillerinde actual/observed ayrımı | OPM kaynak karşılaştırması ve tarih testleri | ABD iş planlama içeriği | Federal kapanışla okul/banka/işveren kapanışını karıştırmadan açıklama |
| Sunday/Monday-start veya A4 seçeneği | Aynı ayın ilgili varyantlarının dosya ve tarih kontrolü | ABD kullanıcılarına seçenekleri açıklayan baskı rehberi | Düzen farkını öğretme; ülke/holiday kapsamını genişletmeme |

Başlangıçta “en iyi takvim sitesi”, “en doğru takvim”, “ödüllü”, “milyonlarca kullanıcı” gibi karşılaştırmalı veya nicel sıfatlar hedeflenmez. Elimizdeki ürün özelliği, kapsamı ve test yöntemi açık bir cümleye çevrilir. OPM'yi kaynak göstermek OPM'nin PrintGridCalendar'ı önerdiği anlamına gelmez.

### İddia kaydı ve yayıncı brief'i

Her dış yayın adayı için aşağıdaki kayıt hazırlanır. Boş alanlar uydurularak doldurulmaz.

```text
claim_id:
entity: PrintGridCalendar
attribute:
claim_text_en_US:
scope: yıl / şablon / format / US kapsamı
evidence_type: ürün testi / özgün veri / gerçek deneyim / ödül
evidence_path_or_url:
evidence_status: verified / pending / contradicted
reviewed_on: iç kayıt; public copy'ye aktarılmaz
publisher_url:
publisher_audience_and_topic:
owner_group: biliniyorsa gerçek kontrol grubu
relationship: owned / independent_editorial / customer / sponsored / unknown
author_and_editorial_control:
payment_gift_affiliate_or_other_connection:
disclosure:
source_family: özgün test / aynı veri / yeniden yayın zinciri
proposed_reader_task:
proposed_claim_and_limits:
destination_url:
anchor_and_context: doğal, doğru; zorunlu kelime mesafesi yok
link_rel_if_applicable:
publication_status: candidate / drafted / published / removed
ai_observation_ids:
```

Brief şu soruyu cevaplamalıdır: Bu yayının kendi okuru, PrintGridCalendar adı hiç geçmese bile hangi yararlı bilgi veya testi kazanacak? Editöre sonuç dayatılmaz. Ücret karşılığında olumlu müşteri değerlendirmesi, gerçek olmayan başarı hikâyesi veya bağımsızlık görüntüsü satın alınmaz. Bu turdaki kayıtlar aday statüsündedir.

### Özellik deneyi ve AI görünürlük ölçümü

Mevcut panel korunur; yeni konuşma nedeniyle aşağıdaki ayrımlar eklenir. Bunlar deney tasarımı tercihleridir; Google'ın kabul eşiği değildir.

1. **Keşif paneli:** Marka vermeden örneğin “Which free printable 2027 calendars offer PDF and JPEG downloads for US Letter?” sorusuyla aday kriterler çıkar. Modelin söylediği özellikleri doğrulanmış kullanıcı talebi diye etiketleme; ABD GSC verisi ve gerçek kullanıcı işiyle karşılaştır.
2. **Ürün doğrulaması:** Seçilen özelliği kapsamıyla test et. Aynı prompt'a doğrulanmamış ürün sıfatlarını yerleştirip doğrulama sonucu üretme.
3. **Özellik kombinasyonu paneli:** Yalnız bir kriteri değiştir; model/yüzey, arama modu, dil, ABD konumu varsa konum, oturum durumu ve tam prompt'u kaydet. Konum ayarlanamıyorsa bilinmiyor yaz. Prompt'un zorladığı “free” gibi kriterleri kendiliğinden öğrenilmiş özelliklerle karıştırma.
4. **Nötr izleme paneli:** Özellik deneyinden ayrı, değişmeyen markasız soruları kullan. Önce baseline topla. Tek seferlik yanıt yerine aynı koşullarda tekrarlı gözlem al; sabit örneklem zorunluluğu veya başarı garantisi yok.
5. **Kaynak incelemesi:** AI'ın verdiği kaynak URL'sini aç; ilgili pasajın iddiayı gerçekten destekleyip desteklemediğini ve ilk verinin kökenini kaydet. Yanıttaki yanlış “free”, “award-winning” veya tatil kapsamı atıfları başarı sayılmaz.
6. **Sonuç yorumu:** Önce/sonra farkını tek başına dış yayına bağlama. Model değişikliği, arama modu, ana site değişiklikleri, rakip yayınları ve sezon etkisini not et. Mümkünse değişmeyen konu/prompt grubu kullan. Kontrol yoksa ilişki gözlemi diye raporla.

| Metrik | Bu projede açık tanım |
| --- | --- |
| Body Mention Rate | Markanın yanıt gövdesinde açıkça anıldığı geçerli koşular / geçerli koşular |
| Recommendation Rate | Markanın gerçekten önerildiği geçerli koşular / geçerli koşular |
| Publisher Citation Rate | Belirli dış publisher URL'sinin kaynak gösterildiği geçerli koşular / geçerli koşular |
| Own-domain Citation Rate | PrintGridCalendar alan adındaki bir URL'nin kaynak gösterildiği geçerli koşular / geçerli koşular |
| Claim Support Rate | Açılan kaynak pasajının iddiayı desteklediği gözlemler / incelenen ilgili atıflar |
| Independent Source Families | Sahiplik, editöryal kontrol ve özgün kanıt kökeni bilinen, gruplanmış kaynak aileleri; domain sayısı değil |
| Unsupported Attribute Rate | Yanlış veya kanıtsız özellik atfedilen marka mention'ları / incelenen marka mention'ları |

Her oranla birlikte pay ve payda yazılır. Payda sıfırsa veya veri alınamamışsa `null`; başarılı ve tamamlanmış gözlemde bulunmama varsa `0`. Citation–Recommendation farkı hesaplanacaksa aynı panelde citation oranından recommendation oranı çıkarılır; eski Mention − Recommendation hesabına bu ad verilmez. Fark tek başına hata veya ceza göstergesi değildir.

GSC toplu gösterimi bu paneldeki prompt sonuçlarına eşitlenmez. Web ve mevcut Generative AI raporunun kendi yüzey/ülke/dönem kapsamları korunur; eksik kırılımlardan atıf veya prompt başarısı üretilmez. Güncel resmi rehber Generative AI raporuna yönlendirir. [S03] Tarayıcı botunun ziyareti eğitim verisine girildiğinin veya öneri alındığının kanıtı değildir.

### Bu ek için birincil kaynaklar ve sınırları

Tüm kayıtların iç inceleme tarihi **2026-10-17**. URL'ler yöntem kaynağıdır; siteye verilmiş endorsement/backlink değildir.

| ID | Kaynak | Neyi destekler / neyi desteklemez? |
| --- | --- | --- |
| S01 | [Google — Ranking systems guide](https://developers.google.com/search/docs/appearance/ranking-systems-guide) | PageRank'in devamı, EMD sisteminin kapsamı. Sabit mention/link ağırlığı vermez. |
| S02 | [Google — Knowledge Graph entities.search](https://developers.google.com/knowledge-graph/reference/rest/v1/) | `@id` ve `resultScore` alanlarının tanımı. Marka otoritesi veya “confidence/clarity” endeksi tanımlamaz. |
| S03 | [Google — Generative AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | RAG/fan-out, yapay mention uyarısı ve ölçüm rehberi. Tek sayfalık site başarısı veya dış yayın kotası vaat etmez. |
| S04 | [Google — Spam policies](https://developers.google.com/search/docs/essentials/spam-policies) | Link spam, scaled content ve site reputation kapsamı. Her üçüncü taraf yazısını otomatik ihlal saymaz. |
| S05 | [Google — Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links) | Ücretli link nitelendirmesi. Mention'ın AI etkisini ölçmez. |
| S06 | [Wu & Marian — Corroborating Answers from Multiple Web Sources, WebDB 2007](https://people.cs.rutgers.edu/~amelie/papers/2007/CorrobWebDB.pdf) | Honda Civic örneği, yanıt birleştirme ve kopya benzerliğinin azaltılması. Güncel Google/LLM uygulaması kanıtı değildir. |
| S07 | [Wu & Marian — A framework for corroborating answers from multiple web sources, 2011](https://www.researchwithrutgers.org/en/publications/a-framework-for-corroborating-answers-from-multiple-web-sources/) · [DOI](https://doi.org/10.1016/j.is.2010.08.008) | Dergi künyesi ve özgünlük/ilgi/belirginlik değerlendirmesi. 2009 atfını kesinleştirmez. |
| S08 | [FTC — Consumer Reviews and Testimonials Rule Q&A](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers) | Sahte deneyim ve şirket kontrollü değerlendirmelerin bağımsız gösterilmesi; ilgili bağlamda yorumlanır. |
| S09 | [FTC — Native Advertising: A Guide for Businesses](https://www.ftc.gov/business-guidance/resources/native-advertising-guide-businesses) | Reklamın bağımsız yayın gibi sunulması ve açıklama gereği. Teknik `rel` niteliğiyle aynı konu değildir. |
| S10 | [Google — Autocomplete predictions](https://support.google.com/websearch/answer/7368877) | Arama ve örüntü kaynakları; tahminler olgu/başarı doğrulaması değildir. |
| S11 | [Google — How Knowledge Graph works](https://support.google.com/knowledgepanel/answer/9787176) | Kaynak çeşitleri ve otomatik panel oluşumu. Mention → panel → eğitim zincirini garanti etmez. |
| S12 | [Anthropic — Reasoning models don't always say what they think](https://www.anthropic.com/research/reasoning-models-dont-say-think) | Görünür CoT'nin deneylerdeki sadakat sınırlaması. Tüm modellerin her açıklamasının yanlış olduğu sonucu çıkmaz. |
| S13 | [FTC — Disclosures 101](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers) | Sosyal endorsement'lardaki maddi ilişki açıklaması. Gerçek deneyim ve doğru iddia gereğini kaldırmaz. |
| S14 | [Google — Third-party SEO advice](https://developers.google.com/search/docs/fundamentals/third-party-seo) | Üçüncü taraf önerilerin resmi kılavuzla karşılaştırılması; araçlar iç sıralama verisine erişim veya sonuç garantisi vermez. |

Bu ek, eski röportajın sözlerini değiştirmez. Eski araştırma yorumlarıyla çeliştiği yerde burada belirtilen kanıt sınırları ve güncellenmiş SOP esas alınır. Yeni konuşmadan genellenemeyen başarı anlatıları koşullu hipotez olarak kalır.

---

# 07 — İçerik Dağıtımı (Echo), Entity İnşası, Reddit ve Sosyal Medya

> **Uygulama statüsü:** Röportaj alıntısı, vaka/araştırma ve resmi kural ayrı değerlendirilir. Aşağıdaki SOP/checklist proje kabul ölçütü olarak [kanıt politikası](KANIT-POLITIKASI.md) ile birlikte okunur; %2/~400 karakter/90 gün/%20–30/rastgelelik Google zorunluluğu değildir.


> Bu bölüm, Koray Tuğberk GÜBÜR'ün Julian Goldie ile yaptığı röportajın ~86–95, ~218–241 ve ~266–293. satırlarını kapsar. Konular: Reddit'te exact-match subreddit/hesap "olgunlaştırma" (warm-up), içerik çoğaltma / tohumlama ("echo"), IMDb + podcast + e-kitap üzerinden entity inşası, kitap EMD siteleri ve Instagram reels büyüme + huni stratejisi.
>
> İşaret sistemi: ✅ doğrulandı / büyük ölçüde doğru · ⚠️ kısmen doğru veya koşullu / riskli · ❓ belirsiz / doğrulanamadı · ❌ yanlış veya politikaya aykırı.

---

## Röportajda söylenenler (eksiksiz liste)

**Reddit — subreddit ve hesap olgunlaştırma (satır 86–95)**
- Subfolder olgunlaştırma mantığı Reddit'e de uygulanır: bir subreddit açıp 3 ay bekletmek, altındaki içeriği ölçeklemeyi daha güvenli hâle getirir (satır 86–87).
- Bu yüzden `cruise`, `eSIM` gibi exact-match (tam eşleşen) isimlerle çok sayıda subreddit açılıyor, 3 ay bekletiliyor, sonra post atılmaya başlanıyor (satır 88–89).
- Amaç: Reddit'in dahili spam tespitlerine karşı daha az "savunmasız" hâle gelmek (satır 89–90).
- Aynı mantık ana kullanıcı profili / gerçek hesap için de geçerli (satır 90–91).
- AdsPower veya benzeri (antidetect) araçlarla Reddit ve başka yerlerde çok sayıda proxy + hesap oluşturuluyor (satır 91–92).
- Hesaplar "yarı aktif" biçimde, çok URL/yorum yayınlamadan olgunlaştırılıyor; bazen sadece giriş yapıp kaydırmak (scroll) yeterli (satır 92–93).
- AdsPower'da bu işleri yapan otomasyonlar var, onlar da kullanılıyor; 3 ay sonra hesap kullanıma "aktive" ediliyor (satır 93–94).
- Koray bunu hesap/subreddit/bazen subfolder için geçerli bir "warm-up threshold" (güven eşiği) olarak tanımlıyor (satır 94–95).

**İçerik çoğaltma / tohumlama — "echo" (satır 218–224)**
- Mintlify, Docusaurus, Notion gibi platformlar altında subdomain'ler açılıp AI doğrudan kendi içerikleriyle besleniyor (satır 217–219).
- Blog yazıları Reddit post'una ve video içeriğine dönüştürülüyor; videolar internette birçok sosyal mecraya dağıtılıyor (satır 219–220).
- Buna "content pumping / content seeding" deniyor: içerik her zaman ses, metin ve video olarak yeniden formatlanıp her yere sendike ediliyor; amaç içeriğin "yüzeyini" (surface) büyütmek (satır 220–222).
- Böylece tüm LLM'ler ve crawler'lar içeriği daha yüksek frekansta görür ve "rakibin yerine seni dinler" (satır 222–223). Koray bunu bir "echo" (yankı) olarak adlandırıyor (satır 223).
- Julian: video alınıp ~30 farklı platforma farklı formatlarda "blast" (dağıtım) yapılıyor (satır 224).

**IMDb + podcast + entity (satır 225–234)**
- Sahip olunan her uzun video aynı zamanda bir podcast'e dönüştürülüyor (satır 225).
- Bu podcast bir "show" (program) olarak IMDb'ye ekleniyor; kişi için biyografisi yazılabilen profesyonel bir IMDb profili alınıyor; bunun LLM'lere büyük etkisi olduğu söyleniyor (satır 225–227).
- Podcast böylece bir "entity" (varlık) hâline geliyor; birden fazla bölümü olabiliyor ve bunlar Spotify, Apple Podcasts ve birçok platforma dağıtılıyor (satır 227–229).

**Podcast → e-kitap → yazarlık (satır 229–236)**
- Podcast bir e-kitaba dönüştürülüp Goodreads'e, Google Scholar'a ve Amazon'a ücretsiz kitap olarak gönderiliyor (satır 229–230).
- Bu sizi yazar ve "showrunner" yapıyor, bu da AI'ı bir kez daha etkiliyor (satır 230–231).
- Bu "yaratıcı ve otoriter platformlar" hem AI için hem de insanlar isminizi aradığında kitap/podcast/knowledge panel gösterdiği için iyi bir pazarlama (satır 231–234).
- Rakiplerin çoğu bunu yapmaya zahmet etmiyor; düzgün yapmak profesyonel destek gerektiriyor (satır 235–236).

**Kitap EMD'leri (satır 236–241)**
- Bazen ayrı exact-match domain'ler açılıyor ve kitap adı da exact-match oluyor; örn. "Truck Accident Lawyer Texas" hem domain hem kitap adı (satır 236–238).
- Google farklı tip bir site (kitap sitesi) olduğu için ona da şans veriyor ve bu bir "kitap sitesi" olarak sıralanabiliyor (satır 238–239).
- Kitabın her bölümü bir alt sayfa (subpage) yapılabiliyor; bu da LLM'leri bir kez daha besliyor (satır 239–240).
- Orta ve uzun vadede işe yaradığı belirtiliyor (satır 240–241).

**Sosyal medya & Instagram (satır 266–293)**
- Koray Instagram hesabını kapattı / private yaptı (satır 268–269).
- Julian'ın 4 farklı Instagram profili var; hesaplar sebepsiz kapatıldığı için çoklu hesap tutuyor; filtreleme algoritmalarının çok akıllı olmadığını düşünüyor (satır 269–271).
- Bir Instagram hesabı ~3 ayda 0'dan 30.000+ takipçiye çıkarıldı (satır 272–273).
- Yöntem: günde 3 reels, 3 saniyelik hook, ilk saniyede dikkat çekmek; örnek "turuncu şapka, China diye bağır" tarzı pattern-interrupt; mesajı mümkün olduğunca basitleştirmek ("dumb it down") (satır 274–277).
- Başka bir içerik üreticisinden bahsediliyor: "Vibeaf Shada" (transkripsiyon belirsiz) — Instagram'da iyi iş çıkarıyor (satır 279).
- Monetizasyon: "X yorumunu yaz, rehberi sana göndereyim" → kullanıcı huniye (funnel) yönlendiriliyor; trafik çekmek çok kolay (satır 280–283).
- skool.com'a göre neredeyse herkesin about sayfasına 1 numaralı trafik kaynağı Instagram, ardından YouTube (satır 283–284).
- Koray çok aktif değil; LinkedIn hesabı, kurs, Gmail üzerinden ulaşılabilir; Slack, Discord, Telegram, Facebook'ta var ama aktif tutamıyor (satır 287–289).
- YouTube vaka çalışması: "one page exact match domain case study" diye aratılarak bulunabilir (satır 290–293).

---

## Derinleştirme: araştırma bulguları

### 1. LLM'ler gerçekten Reddit, YouTube ve podcast'leri "dinliyor" mu?
Koray'ın "echo" tezinin temel varsayımı — içeriğini çok mecraya yayınca LLM'ler onu daha sık görür — büyük ölçüde doğrulanabilir bir zeminde duruyor:
- **Reddit lisanslama:** Google, Şubat 2024'te Reddit ile yıllık ~60 milyon dolarlık veri lisans anlaşması imzaladı; OpenAI ise Mayıs 2024'te ~70 milyon dolar/yıl değerinde benzer bir anlaşma yaptı. Yani Reddit içeriği LLM eğitiminde/erişiminde fiilen birinci sınıf kaynaktır. (Not: 2026'da Google anlaşmasının yenilenmesi tartışmalı; Reddit kullanım bazlı ücret istiyor.)
- **YouTube transkriptleri:** NYT ve The Information raporlarına göre OpenAI, GPT-4 için Whisper ile 1 milyon saatten fazla YouTube videosu transkripte etti; Google'ın da kendi içeriğini kullandığı iddia edildi. Yani uzun videoları/transkriptleri yayınlamak gerçekten eğitim verisi yüzeyini artırır — ancak bu pratik yasal gri alanda (YouTube ToS buna izin vermiyor).
- **Podcast/sesli içerik:** Aynı raporlar OpenAI'nin veri kıtlığında podcast ve sesli kitapları da masaya yatırdığını gösteriyor. Dolayısıyla ses formatına çevirmenin teorik dayanağı var.
Sonuç: "Her yere yay, LLM daha sık görsün" fikri **mantıklı ve kısmen kanıtlı** (✅/⚠️). Ancak "rakip yerine seni dinler" iddiası garanti değil — LLM'ler frekanstan çok otorite, tutarlılık ve kaynak güvenine bakar; saf tekrar (echo) tek başına yeterli değil, hatta spam sinyali üretebilir.

### 2. IMDb: podcast ve web serisi eklenebilir mi?
- ✅ Podcast'ler IMDb'de **resmî olarak uygundur** (21 Ekim 2021'den beri "Podcast series" ve "Podcast episode" başlık tipleri var; en erken uygun yıl 2004).
- ⚠️ Ama kriterler var: başlık "genel kamu ilgisine" (general public interest) sahip olmalı ve kamuya açık (yayınlanmış) olmalı. Podcast **trailer'ları uygun değil**. Tüm başvurular insan tarafından elle inceleniyor.
- ⚠️ Uygunluk sorgulanırsa IMDb **bağımsız üçüncü taraf kaynak** ister; kendi resmî siteniz, Wikipedia veya kullanıcı tarafından düzenlenen siteler kanıt sayılmaz. Yani "podcast yayınladım" demek yetmez; Spotify/Apple listeleme linkleri ve bağımsız basın/dizin kaydı güçlendirir.
- ✅ **IMDbPro profili** gerçek: name page "claim" etmek için IMDbPro üyeliği gerekir; biyografi, "Known For" (en fazla 4 başlık; özelleştirme Premium gerektirir) ve doğrulanmış krediler desktop "Edit Page" üzerinden eklenir. Güncellemeler IMDb + Amazon Prime Video + Alexa'ya yansır. Not: Podcast eklemek için IMDbPro **şart değil**, sıradan IMDb hesabı yeterli; IMDbPro profili yönetmek/claim için gerekir.

### 3. Google Scholar: self-published e-kitap girer mi?
- ⚠️/❌ **Büyük ihtimalle hayır.** Scholar'ın dahil etme kriterleri "scholarly articles" (dergi/konferans makaleleri, teknik raporlar, tezler, pre-print/post-print, özetler) içindir. Haber, dergi yazısı, kitap incelemesi ve editoryal içerik açıkça uygun değildir.
- Kitaplar (5MB üstü uzun belgeler) doğrudan değil, **Google Books üzerinden** indekslenir; Scholar, Google Books'tan yalnızca **bilimsel nitelikli** eserleri otomatik çeker. Yani bir podcast'ten üretilmiş pazarlama e-kitabının "scholarly" sayılıp Scholar'a girmesi gerçekçi değildir. Bu iddia en zayıf halka (❌ olarak işaretli).

### 4. Goodreads yazar programı
- ✅ Gerçek ve self-published yazarlara açık. Goodreads Author Program: yazar profili, giveaway, blog RSS, reklam araçları sunar. Önce okuyucu hesabı açılır, kitap Goodreads veritabanında yoksa elle eklenir (`goodreads.com/book/new`), sonra yazar sayfasında "Is this you?" ile `goodreads.com/author/program` üzerinden başvurulur. Onay birkaç gün sürebilir. Kitabın Amazon/B&N'de olması tercih edilir ama şart değil.

### 5. Amazon KDP ücretsiz kitap
- ⚠️/❌ **Amazon'da fiyatı doğrudan $0 yapamazsınız.** 35% royalty tabanı $0.99. İki yol var:
  1. **KDP Select** (Amazon'a özel/exclusive olmak şartıyla) → her 90 günde 5 güne kadar ücretsiz promosyon.
  2. **Permafree (fiyat eşitleme):** KDP Select'e girmeyin, kitabı Kobo/Apple Books/Google Play/Draft2Digital/Smashwords'te $0 yapın, Amazon'da $0.99 yayınlayıp price-match formuyla eşitleme isteyin. Amazon "eşitleyebilir" ama garanti etmez (2026'da price-match'in güvenilirliği düştü; birçok başlık tekrar ücretli oldu). Yani "Amazon'a ücretsiz kitap koy" tek tıkla olmaz ve exclusivity/çoklu platform kararını gerektirir.

### 6. Spotify for Creators / Apple Podcasts dağıtımı
- ✅ Gerçek ama manuel. Spotify for Creators (eski Spotify for Podcasters) kendisi başka platformlara dağıtım **yapmaz**. İlk bölümü yayınlayınca RSS feed'i oluşur; Settings → Availability → RSS Distribution'dan feed'i etkinleştirip Apple Podcasts'e elle submit edersiniz. Uyarı: e-postanız RSS feed'inde herkese açık görünür. Bazı platformlar elle onaylar; yayılma 24 saati bulabilir.

### 7. Google Knowledge Panel + Wikidata + schema sameAs
- ✅ Entity inşası yöntemi doğru çerçeveleniyor: Knowledge Panel bir **entity reconciliation** (varlık eşleştirme) problemidir, salt içerik puanı değil. Sadece schema eklemek panel kazandırmaz.
- Önerilen "entity köprüsü": Wikidata'da kaynaklı (referanslı) claim'lerle bir varlık oluşturmak + sitenizin Organization/Person schema'sındaki `sameAs` ile Wikidata, LinkedIn, Crunchbase, YouTube vb. profillere bağlanmak. Her Wikidata claim'inin referans URL'si ve erişim tarihi olmalı; yanlış/404 URL güveni düşürür.
- Panel oluştuktan sonra Google'ın doğrulama süreciyle "claim" edilebilir (sınırlı düzenleme hakkı). Schema tek başına yeter değildir; **otoriter alıntılar** (basın, podcast konukluğu, konferans) entity'yi güçlendirir. Koray'ın IMDb/podcast/kitap/alıntı stratejisi tam da bu "corroborating signals" (destekleyici sinyaller) mantığıyla örtüşür (✅).

### 8. Reddit politikaları ve AI spam kıyımı (en kritik uyarı)
- ❌ **Koray'ın anlattığı taktik Reddit kurallarını ihlal eder.** Reddit Content Policy açıkça spam, oy manipülasyonu, ban kaçırma (ban evasion) ve "coordinated inauthentic behavior"ı yasaklar.
- Çoklu hesap sahibi olmak *tek başına* yasak değildir; ama hesapları **koordineli** kullanmak (aynı içeriği desteklemek, kendi içeriğini pazarlamak için seeding, proxy/antidetect ile sahte ağ kurmak) yasaktır. Bir hesabın cezası tüm bağlı hesapları etkileyebilir.
- ⚠️/❌ **Zamanlama kötü:** Reddit 2025–2026'da AI tabanlı spam kıyımını büyüttü. Resmî spam politikası (28 Mart 2026) "spam yaymayı kolaylaştıran bot/üretici AI araçları"nı açıkça spam sayıyor. Reddit günde ~23 milyon spam görüntülenmesini engellediğini, ~25.000 spam post/yorum ve ~2 milyon sahte oyu yakaladığını bildiriyor; yeni bir hesabın ilk post'undan önce bile LLM sinyalleriyle şüpheli davranış tespit ediliyor. Ban evasion tespiti moderatörlere ayrı bir araç olarak sunuluyor.
- Sonuç: Exact-match subreddit + antidetect hesap ağı + 3 ay warm-up + otomatik seeding stratejisi hem **ToS ihlali** hem de artık **teknik olarak giderek daha riskli**. Marka güvenliği açısından (hesap/subreddit kaybı, marka itibarı, olası yasal/platform yaptırımı) tavsiye edilmez. Aşağıda ToS uyumlu alternatif sütunu var.

### 9. Instagram büyüme + comment-to-DM huni
- ✅ "Comment X → DM" otomasyonu gerçek ve yaygın; ManyChat (ayrıca Chatimize, Wati vb.) Instagram Reels/post yorumunu tetikleyici yaparak otomatik DM gönderir. Bu etkileşim algoritmaya da olumlu sinyal verir. Tipik dönüşüm örnekleri ~%25 (yorum→lead), etkinlik kayıtlarında ~%50 aktarılmış. Not: bazı vakalarda carousel'ler lead üretiminde reels'ten iyi performans gösteriyor.
- ✅ 3 saniyelik hook + pattern interrupt + basitleştirme, kısa video büyümesinde iyi bilinen ve savunulabilir taktiklerdir; "0→30k / 3 ay / günde 3 reels" iddiası yüksek ama imkânsız değil (hook kalitesi ve niş'e bağlı — doğrulanamaz tekil iddia, ❓).
- ✅/❓ **Skool iddiası:** Skool kurucularının "her kaynaktan trafiği tek About sayfasına yönlendir" modeli doğrulanıyor ve Instagram birçok başarılı Skool topluluğu için **gerçekten baskın** kaynak (örn. bazı topluluklarda ~%50–67 Instagram). Ancak "neredeyse herkesin #1 kaynağı Instagram, sonra YouTube" mutlak bir kural değil — astronomi/eğitim nişlerinde YouTube baskın. Genelleme olarak ⚠️, örnek olarak ✅.
- ❓ **"Vibeaf Shada":** Transkripsiyon hatalı; net bir eşleşme bulunamadı. Olasılıklar: "Vaibhav" adlı pazarlama/SEO içerik üreticileri (ör. Vaibhav Sisinty, @seowithvaibhav) — ancak hiçbiri "Shada" soyadıyla doğrulanamadı. **Belirsiz olarak işaretlendi**; kaynakta doğrulama yok.

---

## Doğrulama tablosu

| # | İddia (röportaj) | Durum | Not |
|---|---|---|---|
| 1 | LLM'ler Reddit içeriğini kullanıyor | ✅ | Google ~$60M/yıl, OpenAI ~$70M/yıl lisans anlaşmaları |
| 2 | LLM'ler YouTube transkript/podcast kullanıyor | ✅/⚠️ | Raporlanmış (NYT); YouTube ToS'a aykırı, gri alan |
| 3 | Her yere yay → "rakip yerine seni dinler" | ⚠️ | Frekans tek başına yetmez; otorite/tutarlılık asıl; aşırı tekrar spam riski |
| 4 | IMDb'ye podcast "show" olarak eklenebilir | ✅ | 2021'den beri resmî; trailer hariç; genel kamu ilgisi + 3. taraf kanıt şartı |
| 5 | IMDbPro profili + biyografi | ✅ | Claim için IMDbPro üyeliği; "Known For" özelleştirme Premium |
| 6 | Podcast Spotify/Apple'a dağıtılabilir | ✅ | Manuel RSS submit; Spotify kendisi dağıtmaz |
| 7 | Podcast → e-kitap → Goodreads | ✅ | Self-publisher'lar programa girebilir |
| 8 | E-kitap → Google Scholar | ❌ | Scholar "scholarly articles" ister; pazarlama e-kitabı girmez |
| 9 | Amazon'a ücretsiz ($0) kitap | ❌/⚠️ | Doğrudan $0 yok; KDP Select 5 gün veya permafree price-match (garantisiz) |
| 10 | Kitap/yazar/knowledge panel AI'ı etkiler | ✅ | Entity sinyalleri & alıntılar panel/entity güvenini güçlendirir |
| 11 | Exact-match kitap EMD'si Google'da sıralanır | ⚠️ | EMD mutlak avantaj değil (2012 EMD update'inden beri); içerik+entity gerek |
| 12 | Kitap bölümleri subpage → LLM besler | ⚠️ | Mantıklı ama ince/tekrarlı içerik kalite riskine açık |
| 13 | Exact-match subreddit + 3 ay warm-up | ❌ | Reddit ToS ihlali (content manipulation/spam) |
| 14 | AdsPower/antidetect + proxy çoklu hesap | ❌ | Koordineli sahte hesap ağı yasak; ban evasion tespiti var |
| 15 | Reddit AI spam kıyımı strateji riski | ✅ | 2026 politikası AI spam'i açıkça hedefliyor; ~23M/gün engelleme |
| 16 | Instagram comment→DM (ManyChat) huni | ✅ | Gerçek, yaygın; ~%25 yorum→lead örnekleri |
| 17 | 3 sn hook + pattern interrupt | ✅ | Bilinen kısa video büyüme taktiği |
| 18 | 0→30k takipçi / 3 ay / günde 3 reels | ❓ | Tekil iddia; doğrulanamaz ama imkânsız değil |
| 19 | Skool #1 trafik Instagram, sonra YouTube | ✅/⚠️ | Birçok toplulukta doğru; mutlak kural değil |
| 20 | "Vibeaf Shada" içerik üreticisi | ❓ | Transkripsiyon belirsiz; net eşleşme yok |
| 21 | Julian 4 Instagram hesabı (takedown) | ✅ | Doğrulanamaz tekil anekdot ama makul; çoklu hesap tek başına IG ihlali değil |

---

## İçerik çoğaltma hattı SOP'si ("Echo" pipeline)

Amaç: **tek bir uzun videodan** başlayıp içeriği ses/metin/video olarak yeniden formatlayıp çok kanala yaymak; yüzeyi büyütmek ama **kalite ve orijinallik sinyalini korumak** (saf kopya-yapıştır tekrar yerine her platforma uyarlanmış varyant).

**Adımlar:**
1. **Kaynak: 1 uzun video çek** (YouTube'a yükle; otomatik transkript aç). Tercihen 20–45 dk, net bir ana tez etrafında.
2. **Podcast bölümü:** videonun ses parçasını ayıkla → podcast host'una (Spotify for Creators, Transistor, Buzzsprout) yükle → RSS etkinleştir → Apple Podcasts, Amazon Music, Overcast, Pocket Casts, iHeart'a elle submit et.
3. **Transkript → blog yazısı:** transkripti editle, başlıklandır, görsel/şema ekle, EEAT sinyalleri (yazar bio, kaynaklar) kat. (AI kullanırsan imza temizle: class adları, cümle kalıpları, "blacklisted" ifadeler — bkz. 03/06 bölümleri.)
4. **Blog → kısa video (shorts/reels/TikTok):** 3–8 adet 15–45 sn dikey klip; 3 sn hook; altyazı. Repurpose.io / Opus Clip / Kapwing ile kliple.
5. **Blog → sosyal post varyantları:** LinkedIn makalesi, X thread, Instagram carousel, Facebook post, Threads, Pinterest idea pin.
6. **Transkript → e-kitap bölümü:** birden çok bölüm biriktir → bir e-kitap derle (bkz. Entity checklist & Kitap EMD playbook).
7. **Dokümantasyon subdomain'i:** özet/SSS içeriğini Mintlify/Docusaurus/Notion subdomain'ine koy (LLM'lerin taradığı temiz, yapılandırılmış metin).
8. **Ölçümle, kötü varyantı ayıkla:** her platformda yeniden kullanım performansını izle; kötü/tekrar sinyali veren çıktıları kaldır.

> Risk notu: Julian'ın "30 platforma blast" yaklaşımı ulaşımı artırır ama **birebir aynı içeriği** her yere basmak bazı platformlarda (ve Google'ın scaled-content kararında) olumsuz sinyal olabilir. Her platforma format + açılış cümlesini uyarlayın.

### Platform / format tablosu (~30 hedef)

| # | Platform | Ana format | Kaynaktan türetme |
|---|---|---|---|
| 1 | YouTube (long) | Uzun video | Kaynak |
| 2 | YouTube Shorts | Dikey kısa | Klip |
| 3 | TikTok | Dikey kısa | Klip |
| 4 | Instagram Reels | Dikey kısa | Klip |
| 5 | Instagram Carousel | Görsel + metin | Blog özeti |
| 6 | Facebook (video + post) | Video/metin | Klip + özet |
| 7 | Threads | Kısa metin | Thread |
| 8 | X / Twitter | Thread + klip | Blog maddeleri |
| 9 | LinkedIn (post + video) | B2B metin/video | Blog + klip |
| 10 | LinkedIn Articles | Uzun metin | Blog |
| 11 | Pinterest (Idea Pin) | Görsel/video | Carousel kareleri |
| 12 | Spotify (for Creators) | Podcast | Ses |
| 13 | Apple Podcasts | Podcast | RSS |
| 14 | Amazon Music / Audible | Podcast | RSS |
| 15 | iHeartRadio | Podcast | RSS |
| 16 | Overcast / Pocket Casts | Podcast | RSS |
| 17 | YouTube Music (podcast) | Podcast | RSS/feed |
| 18 | IMDb (Podcast series) | Show entity | Podcast listesi |
| 19 | Blog / kendi sitesi | Uzun metin | Transkript |
| 20 | Medium | Uzun metin | Blog (canonical) |
| 21 | Dev.to / Hashnode (teknikse) | Uzun metin | Blog |
| 22 | Substack / newsletter | E-posta/metin | Blog özeti |
| 23 | Notion subdomain | Doküman | Özet/SSS |
| 24 | Mintlify / Docusaurus subdomain | Dokümantasyon | Yapılandırılmış özet |
| 25 | Goodreads | Kitap/yazar | E-kitap |
| 26 | Amazon KDP | E-kitap | E-kitap |
| 27 | SlideShare / Scribd | Slayt/PDF | Blog → slayt |
| 28 | Quora / topikal forumlar | Soru-cevap | Blog maddeleri |
| 29 | Reddit (ToS uyumlu, bkz. aşağı) | Post/yorum | Blog → özgün katkı |
| 30 | Flipboard / Google Discover besleme | Küratörlük | Blog |

---

## Entity inşası kontrol listesi

Bu kanallar ancak gerçek faaliyet ve uygunluk varsa değerlendirilir; hepsini açmak PrintGridCalendar yayın şartı değildir. sameAs yalnız sahipliği doğrulanmış gerçek profillere gider. Kitap/podcast/ödül/meslek veya uzman uydurulmaz.

- [ ] **Kişi için kanonik "entity sayfası":** sitede tek bir yetkili About/Author sayfası (çoklu zayıf bio sayfasından kaçın).
- [ ] **Person + Organization schema (JSON-LD)** ve içinde `sameAs` dizisi: LinkedIn, YouTube, X, Crunchbase, Wikidata, IMDb, Goodreads, Spotify profilleri.
- [ ] **Wikidata item:** her claim'e referans URL + erişim tarihi; yanlış/404 link ekleme; var olan schema'ya Wikidata URL'sini `sameAs` ile bağla (ikinci Person bloğu açma).
- [ ] **IMDb Podcast series + Podcast episodes:** "general public interest" için Spotify/Apple listeleme + bağımsız basın/dizin kanıtı hazırla; trailer ekleme.
- [ ] **IMDbPro:** name page'i claim et, biyografi + doğrulanmış krediler + "Known For" (desktop Edit Page).
- [ ] **Podcast dizinleri:** Spotify for Creators, Apple Podcasts, Amazon Music, iHeart, Overcast, Pocket Casts (RSS submit).
- [ ] **Goodreads yazar profili:** kitabı ekle → "Is this you?" ile programa başvur → RSS/giveaway araçlarını bağla.
- [ ] **Amazon KDP:** e-kitabı yayınla; ücretsiz istiyorsan permafree (price-match) ya da KDP Select 5 gün; $0 doğrudan mümkün değil.
- [ ] **Knowledge Panel:** entity oluştuktan sonra Google doğrulamasıyla claim et; otoriter alıntılarla (basın, konferans, konukluk) besle.
- [ ] **Tutarlılık:** isim, logo, URL tüm profillerde birebir aynı (Google Business Profile dâhil).
- [ ] **Google Scholar'ı erken hedefleme** — pazarlama e-kitabı bu kanala uygun değil; gerçek bir white paper / araştırma yoksa listeye koyma.

---

## Kitap EMD sitesi oyun planı

Fikir: Podcast/blog içeriğinden üretilen bir kitabı, adı exact-match olacak şekilde ayrı bir domain'de "kitap sitesi" olarak yayınlamak (ör. `truckaccidentlawyertexas.com`).

**Adımlar:**
1. **Konu + exact-match başlık seç:** ticari niyetli, rakibin ihmal ettiği bir terim (örn. "Truck Accident Lawyer Texas").
2. **Ayrı EMD al** (ana para sitenizden farklı) — risk ayrıştırma ve "farklı tip site" sinyali için.
3. **Kitabı bölümlere ayır; her bölüm bir alt sayfa** (`/chapters/negligence-basics` gibi) — içsel linkleme + Book/Chapter schema.
4. **Book schema (JSON-LD):** `@type: Book`, yazar (entity sayfanıza `sameAs`), ISBN varsa ekle, bölümler `hasPart`.
5. **Dağıtım:** aynı kitabı Amazon KDP + Goodreads'e koy, EMD'den bu listelemelere `sameAs`/link ver (entity köprüsü).
6. **Kalite bariyeri:** bölümler ince/tekrarlı olmasın; her biri özgün değer, görsel, kaynak taşısın — yoksa "scaled/thin content" riskine girer (bkz. 06 bölümü; Google scaled-content kararları çok sert).
7. **Vade beklentisi:** Koray'ın dediği gibi orta/uzun vade. Hızlı sonuç beklemeyin.

**Uyarılar (⚠️):** EMD'nin 2012'den beri **tek başına sıralama avantajı yok**; değer, içerik + entity + linklerden gelir. "Kitap sitesi olduğu için Google şans verir" iddiası garanti değil — yalnızca farklı format + güçlü entity bağlamında anlamlı.

---

## Reddit oyun planı (söylenen vs ToS uyumlu)

| Röportajda söylenen (❌ ToS'a aykırı / riskli) | ToS uyumlu alternatif (✅) |
|---|---|
| Exact-match subreddit'ler aç (cruise, eSIM), 3 ay beklet, sonra kendi içeriğini post'la | **Gerçek topluluk kur:** ilgili bir subreddit'i otantik amaçla aç, gerçek moderasyon yap, değer odaklı içerik topla; kendi linkini pazarlamak için değil. Veya mevcut topluluklara gerçek üye olarak katkı ver. |
| AdsPower/antidetect + proxy ile çok sayıda hesap üret | **Tek, gerçek, şeffaf marka hesabı** kullan; sahte hesap ağı kurma. Çoklu hesap koordineli kullanımı yasak. |
| Hesapları 3 ay "warm-up" et (login+scroll otomasyonu), sonra aktive et | **Zamanla organik itibar (karma) kazan:** gerçekten yorum yap, soru cevapla, yardım et; otomasyonla sahte aktivite üretme. |
| Blog'u Reddit post'una çevirip seeding yap | **9:1 kuralı:** her 1 öz-tanıtımdan önce 9 değerli katkı. Linki yalnızca gerçekten ilgili ve izin veren subreddit'te, bağlamla paylaş. |
| Çok sayıda URL/yorum bas | **Subreddit kurallarına + self-promotion sınırına uy;** AMA/vaka çalışması gibi topluluğun istediği formatları kullan. |
| Amaç: spam tespitinden kaçmak | **Amaç: gerçek topluluk değeri** → doğal mention, alıntı ve (dolaylı) LLM görünürlüğü. |

**Neden bu kadar sert uyarıyoruz:** Reddit 2025–2026'da AI tabanlı spam/manipülasyon kıyımını büyüttü; politikası (28 Mart 2026) üretici-AI tabanlı spam'i açıkça yasaklıyor, yeni hesabın ilk post'undan önce bile LLM sinyalleriyle tespit yapıyor. Ban evasion ve koordineli davranış tespitinde bir hesabın cezası tüm ağınızı yakabilir. Marka güvenliği ve sürdürülebilirlik açısından sahte-ağ yaklaşımı **tavsiye edilmez.**

---

## Instagram reels büyüme ve huni SOP'si

**Büyüme (reach):**
1. **Günde ~3 reels** (niş tutarlı; test et, sürdürülemezse 1–2'ye düşür ama tutarlı ol).
2. **İlk 3 saniyede hook + pattern interrupt:** beklenmedik görsel/ifade ("turuncu şapka, bağır" tarzı), merak boşluğu, cesur iddia.
3. **Basitleştir ("dumb it down"):** tek fikir, net dil, hızlı tempo, büyük altyazı.
4. **Carousel'leri de dene:** bazı vakalarda lead üretiminde reels'ten iyi — reach için reels, dönüşüm için carousel kombinle.
5. **Tutarlılık + algoritma sinyali:** yorum/kaydetme/paylaşma teşvik et (CTA).

**Huni (monetizasyon):**
1. Reel/caption'da **CTA:** "Rehberi istiyorsan 'SEMANTICS' yorumunu yaz."
2. **ManyChat (veya Chatimize/Wati) comment→DM** otomasyonu: tetikleyici kelime → otomatik DM + link.
3. DM'de **lead magnet** (ücretsiz rehber/sistem) karşılığında isim/e-posta topla.
4. **Lead nurturing:** e-posta dizisi / webinar / Skool topluluğu.
5. **Tek About sayfasına yönlendir:** Skool modelinde tüm trafiği (IG + YouTube) tek dönüşüm sayfasına topla; sayfada tek cümlelik vaat + kısa video + kanıt + düşük sürtünmeli CTA.

**Uyarılar (⚠️):** Instagram otomasyon politikalarına uy (resmî ManyChat entegrasyonu Meta onaylıdır; gri araçlardan kaçın). Çoklu hesap tutmak IG'de tek başına yasak değil ama spam/otomasyon ihlali hesap kapanmasına yol açabilir — Julian'ın "4 hesap / sürekli takedown" deneyimi bunun kanıtı.

---

## Proje kontrol listesi

- [ ] İçerik çoğaltma hattı (SOP) kurulu: 1 video → podcast → transkript → blog → shorts → e-kitap bölümü.
- [ ] Repurpose/Opus/Kapwing + podcast host + scheduler araçları seçili.
- [ ] Her platform için **uyarlanmış** varyant (birebir kopya değil).
- [ ] Uygun gerçek profiller doğrulandı; diğer kanallar koşullu/bekliyor olarak etiketlendi.
- [ ] Kitap EMD(ler)i: exact-match başlık, bölüm subpage'leri, Book schema, kalite bariyeri.
- [ ] Reddit: **ToS uyumlu** plana geçildi; antidetect/sahte hesap ağı yok.
- [ ] Instagram: günde reels planı, hook şablonları, ManyChat comment→DM huni, About/Skool dönüşüm sayfası.
- [ ] Ölçüm panosu (aşağıdaki KPI'lar) kuruldu.
- [ ] Hukuk/politika gözden geçirmesi yapıldı (Reddit ToS, IG ToS, YouTube ToS, AI telif riskleri).

---

## Riskler ve politika uyarıları

- **Reddit ToS ihlali (yüksek risk):** Exact-match subreddit + antidetect çoklu hesap + warm-up + seeding = content manipulation/spam/ban evasion. 2026 AI spam kıyımıyla tespit arttı; marka güvenliği riski yüksek. → ToS uyumlu alternatifi uygula.
- **Google scaled/thin content riski:** Her yere birebir aynı içeriği basmak, ince kitap bölümleri, doküman subdomain'leri Google'ın ölçekli içerik kararlarını tetikleyebilir (bkz. BrowserStack örneği, 06 bölümü).
- **Google Scholar yanlış beklentisi:** Pazarlama e-kitabı Scholar'a girmez; bunu KPI yapmayın.
- **Amazon $0 yanılgısı:** Doğrudan ücretsiz koyamazsınız; permafree güvenilirliği 2026'da düştü.
- **YouTube transkript / telif:** "LLM'ler YouTube'u kullanıyor" doğru ama bu kullanım gri alanda; strateji dayanağı olabilir, hukuki tavsiye değildir.
- **AI telif/yazarlık:** Koray'ın da belirttiği gibi AI ile yazılan kitapta telif sahipliği tartışmalı olabilir; e-kitap/entity stratejisinde bunu göz önünde bulundurun.
- **Instagram otomasyon/çoklu hesap:** Meta onaylı entegrasyon kullanın; agresif otomasyon hesap kapanmasına yol açar.
- **Kaynak güveni:** "Vibeaf Shada", "0→30k/3 ay" gibi tekil iddialar doğrulanamadı — strateji kararını bunlara bağlamayın.

---

## Ölçüm / KPI

- **Echo/dağıtım:** platform başına yayın sayısı, reach/impression, atıf (citation) sayısı; LLM görünürlüğü (ChatGPT/Gemini/Perplexity'de markanın anılma sıklığı — manuel prompt testleri).
- **Entity:** Wikidata item durumu, Knowledge Panel çıkıp çıkmadığı, `sameAs` profil sayısı, IMDb/Goodreads/podcast dizini listelemeleri, isim aramalarında SERP zenginliği.
- **Podcast:** bölüm indirmeleri, dizin sayısı, abone sayısı.
- **Kitap EMD:** indekslenen bölüm sayısı, organik tıklama, kitap sitesine özgü sıralamalar.
- **Reddit (ToS uyumlu):** gerçek karma, topluluk büyümesi, otantik atıf/mention; (ban/kaldırma oranı = sağlık metriği, düşük tut).
- **Instagram:** takipçi büyümesi, reach, kaydetme/paylaşma, yorum→DM dönüşümü (~%25 hedef), DM→lead→müşteri hunisi oranları, About/Skool sayfası dönüşümü.
- **GEO/SEO kesişimi:** Search Console'da AI Overview impression vs klasik impression (bkz. 05 bölümü), crawl frekansı.

---

## Kaynaklar

- IMDb — Title eligibility: https://help.imdb.com/article/contribution/titles/title-eligibility/G9V8J6AXTQ292S5W
- IMDb — Adding a new title: https://help.imdb.com/article/contribution/titles/adding-a-new-title/GNXTSSVTJTFCRZGN
- IMDb — Evidence for eligibility: https://help.imdb.com/article/contribution/titles/how-can-i-provide-additional-evidence-for-eligibility-of-a-new-title/G3GPXWPS8JQ37KKM
- IMDb — Claim your page (IMDbPro): https://help.imdb.com/article/imdbpro/manage-your-imdb-page/claim-your-page/GXWAJBBV8EVPF3PE
- IMDb — Known For credits: https://help.imdb.com/article/imdbpro/new-features/how-can-i-control-my-known-for-credits/GH8XTYSWKU2P96TA
- IMDb — Biographical data guidelines: https://help.imdb.com/article/contribution/names-biographical-data/biographical-data-guidelines/GMT9T242VQADZUQM
- Google Scholar — Inclusion guidelines: https://scholar.google.com/intl/en/scholar/inclusion.html
- Goodreads — Author Program: https://www.goodreads.com/author/program
- BookBub — Permafree how-to: https://insights.bookbub.com/how-to-make-your-book-permafree/
- Spotify for Creators — Submitting to Apple Podcasts: https://support.spotify.com/us/creators/article/submitting-your-show-to-apple-podcasts/
- Spotify for Creators — RSS feed: https://support.spotify.com/us/creators/article/your-rss-feed/
- Reddit AI data deal (Google ~$60M): https://the-decoder.com/reddit-signs-60-million-annual-training-data-deal-with-google/
- Reddit AI licensing (Google/OpenAI, CJR): https://www.cjr.org/analysis/reddit-winning-ai-licensing-deals-openai-google-gemini-answers-rsl.php
- Reddit AI spam crackdown: https://www.techwyse.com/news/platform-updates/reddit-ai-spam-brand-safety-risk
- Reddit AI spam (Deccan Chronicle): https://www.deccanchronicle.com/technology/in-other-news/reddit-is-cracking-down-on-ai-marketing-slop-with-its-own-ai-1968791
- OpenAI/Google YouTube transcripts (Engadget): https://www.engadget.com/openai-and-google-reportedly-used-transcriptions-of-youtube-videos-to-train-their-ai-models-163531073.html
- Knowledge Panel + Wikidata + schema sameAs: https://blitzmetrics.com/wikidata-schema-local-service-spotlight/
- ManyChat comment-to-DM (Chatimize): https://chatimize.com/auto-reply-instagram-comments/
- Instagram comment-to-DM lead gen (Wati): https://www.wati.io/geo/blog/instagram-comment-to-dm-automation-lead-generation-2
- Skool traffic sources (SkoolPrep): https://skoolprep.com/skool-leaderboard-winners-traffic
- Content repurposing tools (Repurpose.io): https://repurpose.io/

---

# 08 — Semantik İçerik Yazım Kuralları

> **Uygulama statüsü:** Röportaj alıntısı, vaka/araştırma ve resmi kural ayrı değerlendirilir. Aşağıdaki SOP/checklist proje kabul ölçütü olarak [kanıt politikası](KANIT-POLITIKASI.md) ile birlikte okunur; %2/~400 karakter/90 gün/%20–30/rastgelelik Google zorunluluğu değildir.


> Bu bölüm, Koray Tuğberk GÜBÜR'ün Julian Goldie ile yaptığı röportajdaki **içerik yazım** ile ilgili tüm iddialarını eksiksiz toplar, bunları Koray'ın yayınlanmış semantik SEO çerçevesi ve Google kaynakları/patentleriyle derinleştirir, doğruluğunu işaretler ve ekibin her projede kullanabileceği uygulanabilir şablonlara dönüştürür.
> Kaynak transkript: `/Users/mustafa/Documents/Workspace/SEO/seo-talks-whisper.txt`

---

## Röportajda söylenenler (eksiksiz liste)

Aşağıdaki maddeler transkriptteki ilgili satırlardan parafraz edilmiştir. Hiçbir iddia atlanmamıştır.

**Dört kriter ve iki eksen**
- İçeriği yönetmek için **dört kriter** vardır; bunlar aslında **iki eksen**den türer: (1) olgusal (factual) vs. yorumlu/kanaat içeren (opinionated), (2) yapılandırılmış (structured) vs. yapılandırılmamış (unstructured). İki eksen × iki değer = **dört kombinasyon** demektir. (satır 242–247)
- **Yorumlu içerik**, çok gündelik (casual) dildir: "bence / sence / bu en iyisi" gibi ifadeler, daha duygusal/inceleme (review) tarzı cümleler kullanılır. (satır 243–244)
- **Olgusal/uzman seviyesi sorgu** gerektiğinde içeriğe **asla** yorum cümlesi konmaz. (satır 244–245)
- **Yapılandırılmış vs. yapılandırılmamış** ayrımı sorguya göre belirlenir: bazı sorgular listicle (liste) ve tablo ister, bazıları yalnızca düz paragraf ister. (satır 245–247)
- Bu kombinasyonların **her biri için ayrı cümle yapıları ve ayrı cümle sıralamaları** vardır. (satır 247–248)

**Olgusal içerikte cümle sırası**
- Olgusal içerikte **daima bir "is-a" (…-dır/tanım) cümlesiyle** başlanır. (satır 248–249)
- İkinci cümle bir **yüklem/predicate cümlesi** olur ("ihmal, … anlamına gelir"). (satır 249–251)
- Üçüncü cümle bir **nitelik/attribute cümlesi** olur ve burada **"X of Y" (Y'nin X'i)** kalıbı kullanılır: örn. "ihmalin önemi", "ihmalin tazminatı". (satır 251–253)
- Örnek verilen konu: **ihmal (negligence)** — "ihmal …-dır" (tanım), "ihmal … demektir" (yüklem), sonra nitelik cümlesi (önem, tazminat vb.). (satır 249–253)

**Yorumlu içerikte sıra yok**
- Yorumlu cümlelerde **hiçbir sıra takip edilmez**; kural, metnin **çok doğal** olmasıdır — "kaotik" ama doğal. (satır 253–255)

**eHarmony senior dating örneği (hibrit sayfa)**
- eHarmony'nin "senior dating" (60+ yaş flört) sayfasının **en altında**, olgusal bölümdeki bazı sorular **forum tarzı** tekrar sorulur; örn. "60 yaş üstü kişilerle tanışmak için en iyi yer neresi?" (satır 255–258)
- Bu soruları bir **ilişki uzmanı**, uzmanlığına dayanarak **çok gündelik bir dille** yanıtlar. (satır 258–259)
- Amaç: **olgusal içerik ile UGC'yi (kullanıcı üretimi içerik) aynı sayfada birleştirmek**; çünkü Google bazen UGC'yi, bazen olgusal içeriği tercih eder. İki açıdan da şans yakalanmak istenir. (satır 259–261)
- Bunu yaparken **doğru yapılandırılmış veri (structured data)** ve **görsel segmentasyon** kullanılır. (satır 261)
- Bu yaklaşım Google'ın **AI Overview patentinde de** mevcut: patent **her iki dil modalitesini** (olgusal ve UGC/yorum) puanlar ve en sonda **birleşik/toplam bir skor** verir. (satır 262–263)
- Daha **birçok başka kural** da vardır; bunların bir kısmı Koray'ın kursunda anlatılmış, diğerleri case study'lere ve örnek sitelere dağılmıştır. (satır 263–265)

**Token ekonomisi (bu bölümü doğrudan ilgilendiren iki yardımcı kural)**
- Çok fazla metin yazmak **sayfadaki her token'ın önemini seyreltir**. (satır 17–18)
- Sayfadaki **ilk %2'lik token** aralığına tüm önemli n-gram ve varlıklar (dosya uzantıları, "audio to text", "X'ten Z'ye" kombinasyonları vb.) yerleştirilir. (satır 18–20)
- **Daha az kelime** kullanılırsa her kelime relevansa daha çok katkı verir; ayrıca **az token** olduğunda içeriğin AI üretimi olup olmadığını tespit etmek matematiksel olarak zorlaşır — AI tespiti uzun metinlerde daha isabetlidir. (satır 163–170)

---

## Derinleştirme: araştırma bulguları

### 1) Olgusal/yorumlu ekseni ve cümle dizilimi Koray'ın yayınlanmış çerçevesiyle uyumlu
Koray'ın semantik içerik yazımı çerçevesi, pratisyenler tarafından geniş biçimde özetlenmiştir. Doğrulanabilir çekirdek kurallar şunlardır: (a) kullanıcının sorusunu yanıtlayan **birincil bilgi mümkün olduğunca erken** verilmeli; (b) içeriğin **başında kanaat cümlesi kullanılmamalı**, ifadeler olgusal olmalı — kanaatle başlamak içeriğin algılanan değerini düşürür; (c) **modal fiiller** ("will/should/have to/need to" — Türkçede "-meli/-malı, gerekir, olmalı") olgusal gücü zayıflattığından olgusal içerikte dikkatli kullanılmalı; (d) her olguyu yazmadan önce **doğrula**. Bu, röportajdaki "olgusalda yorum yok" ve "önce is-a/tanım" kuralını doğrudan destekler.

Koray-uyumlu yazar stil kılavuzlarında sıkça geçen uygulanabilir alt kurallar: **ilk cümleyi kalınlaştır (bold)**; **sayı kullan** ("birçok fayda" yerine "3 temel fayda"); **kısaltmayı ilk kullanımda parantezle tanımla**; **soruda geçmiyorsa modaliteden kaçın**. Bu kurallar "önce cevap + olgusal + kesinlik" ilkesinin operasyonel halidir.

### 2) "is-a / predicate / attribute" dizisi semantik üçgenin karşılığı
- **is-a (tanım/hypernym):** Varlığı bir üst kategoriye bağlar ("İhmal, bir hukuki sorumluluk türüdür"). Bu, bilgi grafiklerindeki *tür/hypernym* ilişkisidir ve bir varlığı tanımlamanın en sağlam yoludur.
- **predicate (yüklem):** Varlığın ne yaptığını/ne anlama geldiğini kurar ("İhmal, gerekli özenin gösterilmemesi anlamına gelir").
- **attribute ("X of Y"):** Varlığın nitelik-değer çiftlerini açar ("ihmalin unsurları", "ihmalin tazminatı", "ihmalin ispatı"). Bu "X of Y" kalıbı, arama motorlarının **nitelik sorgularını** (attribute queries) eşlemesine birebir denk gelir ve bir başlık/paragrafın hangi niteliği hedeflediğini netleştirir.

Bu üçlü sıra (**tanım → yüklem → nitelik**), bir paragrafın ilk üç cümlesi için "**semantik açılış bloğu**" olarak kullanılabilir: önce varlığı sabitle, sonra anlamını ver, sonra o başlığın hedeflediği niteliğe geç.

### 3) eHarmony "senior dating" sayfası — canlı doğrulama
Sayfa **iki parçalı**dır (WebFetch ile 2026-10 itibarıyla doğrulandı):
1. **Üstte olgusal/rehber bölüm:** "Senior Dating Over 60" başlığı altında tanım tarzı açılış cümleleriyle başlayan konu başlıkları (nerede tanışılır, 60'larda nasıl flört edilir, avantaj/zorluklar, kırmızı bayraklar vb.), ayrıca makale içi FAQ tarzı alt sorular ve bir okuyucu anketi.
2. **Altta "Q&A – Expert backed answers" bölümü:** Kullanıcıların (anonim) soru gönderdiği, bir **ilişki uzmanının/editör ekibinin gündelik dille** yanıtladığı forum tarzı blok. Örnekler arasında doğrudan **"60'larındaki insanlarla tanışmak için nereye gitmeliyim?"** sorusu ve uzman yanıtı yer alıyor; her yanıtta "faydalı buldum" sayacı var. Bu, Koray'ın tarif ettiği **olgusal gövde + dipte uzman/UGC** desenini neredeyse birebir doğrular.

### 4) Google'ın UGC/forum yönelimi — neden hibrit sayfa işe yarar
- **Hidden Gems / Perspectives (Mayıs 2023):** Google, forum, blog ve sosyal medyadaki **birinci el (first-hand)** içeriği öne çıkarmaya başladı; bu, **çekirdek sıralama sistemine** dahil edildi (yardımcı içerik sistemine değil). Yani aynı sayfada hem olgusal otorite hem de birinci el deneyim barındırmak, iki farklı sinyal setine birden hitap eder.
- **Discussions and forums** SERP özelliği (Eylül 2022) ve **Perspectives** filtresi, Google'ın bazı sorgularda UGC'yi öne aldığını gösterir — Koray'ın "bazen UGC'yi, bazen olgusal içeriği tercih eder" iddiasını destekler.

### 5) Yapılandırılmış veri seçenekleri (2023 sonrası gerçeklik)
- **DiscussionForumPosting / SocialMediaPosting:** Kişilerin birinci el görüş paylaştığı forum/topluluk sayfaları içindir. Ortak zorunlu alanlar: yazar adı, yayın tarihi (ISO 8601), en az bir içerik öğesi (metin/görsel/video). Google, **site sahibinin veya temsilcilerinin yazdığı** içerikte (blog yazısı, ürün incelemesi, kendi Q&A'niz) bu işaretlemeyi **kullanmayın** uyarısı yapar.
- **QAPage:** Sayfa yapısı soru-cevap merkezliyse (bir kullanıcı soru sorar, başkaları yanıtlar) kullanılır. Google sonradan **soruyu soran/cevaplayan yazar profiline bağlantı** gibi yazarlık alanlarını netleştirdi.
- **FAQPage:** Ağustos 2023'ten itibaren FAQ rich result'lar yalnızca **tanınmış, otoriter devlet ve sağlık siteleri** için gösterilmeye başlandı; sonraki dönemde bu kalan uygunluk da büyük ölçüde kaldırıldı. **FAQPage hâlâ geçerli bir schema tipidir** ve mevcut işaretlemeyi aceleyle kaldırmak gerekmez, ama "rich result kazanma" aracı olarak güvenilmez. Hibrit sayfanın dip Q&A'si için **QAPage** (gerçek kullanıcı sorusu/çoklu yanıt varsa) ya da editöryal uzman yanıtı için en azından **Article + mainEntity** düşünün; dip blok gerçekten topluluk/forum tipindeyse **DiscussionForumPosting/QAPage** uygundur.

### 6) "AI Overview patenti her iki modaliteyi puanlar ve toplam skor verir" iddiası
- Koray'ın ima ettiği ana AI Overview patenti büyük olasılıkla **US11769017B1 — "Generative summaries for search results"** (SGE/AI Overview'in temeli olarak gösterilir). Ancak patentin metni (ilk 100k karakter incelendi) içeriği **olgusal vs. yorum** olarak sınıflandırıp iki modaliteyi birleştiren bir skordan **açıkça söz etmez**. Patent daha çok **güven ölçümü** (confidence), kaynak güvenilirliği, sorguyu (içeriği değil) **informational/creative** gibi kategorilere sınıflama ve güvene göre **renkli anotasyon** üzerinedir.
- Buna karşılık **US9002894** (Google, 2015) tam da "**nesnel (objective) skor + öznel (subjective) skoru birleştirip birleşik skor**" üreten bir yorum sıralama patentidir — Koray'ın "iki modaliteyi puanlayıp toplam skor verir" anlatısına kavramsal olarak en yakın belgedir.
- Dolayısıyla **mekanizma** (farklı içerik türlerini ayrı puanlayıp birleştirmek) Google patent literatüründe mevcuttur; ancak bunun **tam olarak AI Overview patentinde** ve **"olgusal/UGC" modaliteleri** biçiminde olduğu doğrulanamadı. Stratejik sonuç değişmez: aynı sayfada iki modaliteyi birlikte sunmak riski düşürür.

### 7) Token ekonomisi ve AI tespiti
İlk %2 token ve kısa metinle AI tespitinden kaçınma çıkarımları, bu proje için doğrulanmış Google mekanizması değildir. Önemli bilgiyi erken vermek editöryal tercihtir; gereksiz dolgu azaltılırken kapsam, kaynak ve belirsizlik korunur. Dedektör skoru veya “radar altında kalma” kabul ölçütü yapılmaz.

---

## Doğrulama tablosu

İşaretler: ✅ doğrulandı · ⚠️ kısmen/dolaylı doğru · ❓ doğrulanamadı · ❌ yanlış

| # | İddia (röportaj) | Durum | Not / Kaynak |
|---|---|---|---|
| 1 | İki eksen (olgusal/yorumlu, yapılı/yapısız) → 4 kombinasyon | ✅ | Transkript 242–247; Koray çerçevesi olgusal/yorum ayrımını teyit ediyor (LinkedIn özetleri) |
| 2 | Yorumlu = gündelik "bence/sence/en iyisi", review dili | ✅ | Transkript 243–244; çerçeve "başta kanaat kullanma" kuralıyla tutarlı |
| 3 | Olgusal uzman sorguda hiç yorum cümlesi yok | ✅ | Transkript 244–245; çerçeve "ifadeler olgusal olmalı" |
| 4 | Yapılı (liste/tablo) vs yapısız (paragraf), sorguya göre | ✅ | Transkript 245–247; "önce cevap/erken bilgi" ilkesiyle uyumlu |
| 5 | Olgusal sıra: is-a → predicate → attribute("X of Y") | ✅ | Transkript 248–253; semantik üçgen/hypernym + nitelik sorgusu karşılığı |
| 6 | Yorumlu bölümde sıra yok, doğal olmalı | ✅ | Transkript 253–255 |
| 7 | eHarmony senior dating: dipte forum tarzı uzman Q&A | ✅ | Transkript 255–259; **eharmony.com/senior-dating** canlı doğrulandı (Q&A – Expert backed answers; "nerede tanışırım" sorusu + uzman yanıtı) |
| 8 | Amaç: olgusal + UGC'yi aynı sayfada birleştirmek | ✅ | Transkript 259–261; Google Hidden Gems/Perspectives UGC'yi öne çıkarıyor |
| 9 | Doğru structured data + görsel segmentasyon kullan | ✅ | Transkript 261; Google DiscussionForumPosting/QAPage dokümantasyonu |
| 10 | AI Overview patenti iki dil modalitesini puanlar, birleşik skor | ⚠️ | Transkript 262–263; US11769017B1'de bu ifade **yok**; mekanizma US9002894'te (objective+subjective → combined) mevcut |
| 11 | Daha çok kural kurs/case study/örnek sitelerde | ✅ | Transkript 263–265 (doğrulanamaz ama makul; kendi beyanı) |
| 12 | İlk %2 token'a kritik n-gram/varlık | ⚠️ Röportaj hipotezi | Transkriptte beyan var; resmi Google token eşiği doğrulanmadı |
| 13 | Az token → AI tespiti zorlaşır; az kelime → her kelime daha değerli | ✅ | Transkript 163–170; kısa metinde sınıflandırıcı örneklemi yetersiz |

---

## Dört kombinasyon için cümle şablonları (EN + TR örnekler)

Her kombinasyon için: **ne zaman kullanılır**, **cümle sırası/yapısı**, ve iki örnek konu (**ihmal / negligence** ve **e-SIM**) üzerinden EN + TR paragraf.

### A) Olgusal + Yapılandırılmamış (Factual · Unstructured)
**Ne zaman:** "nedir / ne demek / tanım" tipi sorgular; tek bir doğru cevap; paragraf yeterli.
**Sıra:** (1) **is-a** tanım cümlesi · (2) **predicate** cümlesi · (3) **attribute "X of Y"** cümlesi · (devam: nitelikleri açan 1–2 cümle). İlk cümle **kalın**. Modaliteden kaçın, şimdiki/geniş zaman, gerekli yerde **sayı**.

**EN — Negligence**
> **Negligence is a form of civil liability that arises when a person fails to exercise reasonable care.** Negligence means a breach of a duty of care that causes harm to another party. The elements of negligence are duty, breach, causation, and damages. The compensation of negligence covers medical costs, lost income, and pain-and-suffering damages.

**TR — İhmal**
> **İhmal, makul özenin gösterilmemesinden doğan bir hukuki sorumluluk türüdür.** İhmal, bir özen yükümlülüğünün ihlal edilerek başkasına zarar verilmesi anlamına gelir. İhmalin unsurları özen yükümlülüğü, ihlal, nedensellik ve zarardır. İhmalin tazminatı tedavi giderlerini, gelir kaybını ve manevi zararı kapsar.

**EN — e-SIM**
> **An e-SIM is a reprogrammable chip embedded in a device that stores a mobile subscription.** An e-SIM works by downloading a carrier profile instead of inserting a physical card. The activation of an e-SIM takes a few minutes through a QR code. The main benefit of an e-SIM is holding 5 or more carrier profiles on one device.

**TR — e-SIM**
> **e-SIM, cihaza gömülü, yeniden programlanabilen ve bir mobil aboneliği saklayan bir çiptir.** e-SIM, fiziksel kart takmak yerine operatör profilini indirerek çalışır. e-SIM'in etkinleştirilmesi QR kod ile birkaç dakika sürer. e-SIM'in temel faydası, tek cihazda 5 veya daha fazla operatör profili taşımaktır.

### B) Olgusal + Yapılandırılmış (Factual · Structured)
**Ne zaman:** "adımları / türleri / karşılaştırma / liste / fiyat" tipi sorgular; birden çok eş-değerli öğe; tablo/liste gerek.
**Yapı:** Kısa **is-a açılış cümlesi** (kalın) → ardından **liste veya tablo**. Liste maddeleri **paralel** kurulur: her madde `Nitelik — değer/tanım` biçiminde, öznel sıfat yok, ölçülebilir değerler.

**EN — Negligence (tablo)**
> **The four elements of negligence are the legal tests a claim must satisfy.**
>
> | Element | What it requires |
> |---|---|
> | Duty | A legal obligation to act with care |
> | Breach | Failure to meet that obligation |
> | Causation | The breach directly caused the harm |
> | Damages | A measurable loss occurred |

**TR — İhmal (tablo)**
> **İhmalin dört unsuru, bir davanın karşılaması gereken hukuki testlerdir.**
>
> | Unsur | Gerektirdiği koşul |
> |---|---|
> | Özen yükümlülüğü | Özenli davranma hukuki yükümlülüğü |
> | İhlal | Bu yükümlülüğün yerine getirilmemesi |
> | Nedensellik | İhlalin zarara doğrudan yol açması |
> | Zarar | Ölçülebilir bir kaybın oluşması |

**EN — e-SIM (liste)**
> **Activating an e-SIM takes four steps.**
> 1. Check device support — settings show an "Add eSIM" option.
> 2. Buy a plan — the carrier issues a QR code.
> 3. Scan the QR code — the profile downloads in under 2 minutes.
> 4. Set the line — select the e-SIM for data or calls.

**TR — e-SIM (liste)**
> **Bir e-SIM'i etkinleştirmek dört adım sürer.**
> 1. Cihaz desteğini kontrol et — ayarlarda "eSIM ekle" seçeneği görünür.
> 2. Paket satın al — operatör bir QR kod verir.
> 3. QR kodu tara — profil 2 dakikadan kısa sürede iner.
> 4. Hattı ayarla — veri veya arama için e-SIM'i seç.

### C) Yorumlu + Yapılandırılmamış (Opinionated · Unstructured)
**Ne zaman:** "en iyi / tavsiye / deneyim / …nasıl buldum / değer mi" tipi sorgular; birinci el ses; uzman/editör yorumu.
**Kural:** **Sabit sıra yok.** Doğal, konuşma dili. "Bence / deneyimime göre / açıkçası" serbest. İlk cümle **kalın olmak zorunda değil**; akış öncelikli. Yine de bir gerçek çıpa (ad, yer, sayı) eklemek güven verir.

**EN — Negligence (uzman yorumu)**
> Honestly, most people wait too long before calling a lawyer, and that's the part I'd change first. In the cases I've handled, the ones who wrote down what happened the same day almost always had a stronger claim. You don't need a perfect memory — you need a few dated notes and the names of anyone who saw it.

**TR — İhmal (uzman yorumu)**
> Açıkçası çoğu kişi avukatı aramak için fazla bekliyor; ilk değiştireceğim şey bu olurdu. Baktığım davalarda olanları aynı gün not edenlerin iddiası neredeyse her zaman daha güçlü oldu. Kusursuz bir hafıza gerekmiyor — tarihli birkaç not ve olayı görenlerin adları yeterli.

**EN — e-SIM (gezgin yorumu)**
> I switched to an e-SIM before my last trip and I'm not going back. The thing I liked most was landing in a new country with data already working — no kiosk, no tiny tray tool. It's not flawless; one carrier's app was clunky. But for me the convenience wins easily.

**TR — e-SIM (gezgin yorumu)**
> Son seyahatimden önce e-SIM'e geçtim ve geri dönmem. En sevdiğim şey, yeni bir ülkeye inince internetin çoktan çalışıyor olmasıydı — ne büfe ne de o minik iğne. Kusursuz değil; bir operatörün uygulaması hantaldı. Ama benim için kolaylık fazlasıyla ağır basıyor.

### D) Yorumlu + Yapılandırılmış (Opinionated · Structured)
**Ne zaman:** "en iyi X listesi / X vs Y / top 5 / artı-eksi" tipi sorgular; öznel değerlendirme ama tarama kolaylığı için liste/tablo.
**Yapı:** Kısa kişisel çerçeve cümlesi → **değerlendirme listesi/tablosu**; her maddede **öznel yargı + kısa gerekçe** birlikte. Puan/yıldız gibi öznel ölçüler serbest; ama her yargıyı bir gözlemle çıpalayın.

**EN — e-SIM (artı/eksi)**
> For frequent travelers, I think an e-SIM beats a physical SIM in most cases. Here's my honest take:
> - **Best for:** short trips — activation is instant and I never lose a tiny card.
> - **Weak spot:** older phones — my backup phone simply can't run it.
> - **My pick:** keep the e-SIM as primary and one physical slot as a safety net.

**TR — e-SIM (artı/eksi)**
> Sık seyahat edenler için bence e-SIM çoğu durumda fiziksel SIM'i geçer. Dürüst görüşüm:
> - **En iyi olduğu yer:** kısa geziler — etkinleştirme anında ve minik kartı kaybetmiyorum.
> - **Zayıf yanı:** eski telefonlar — yedek telefonum bunu hiç çalıştıramıyor.
> - **Tercihim:** e-SIM'i birincil, bir fiziksel yuvayı emniyet kemeri olarak tutmak.

**EN — Negligence (lawyer seçim listesi — yorumlu)**
> If you're choosing a negligence lawyer, these are the three things I'd weigh, in my order of importance:
> - **Trial record** — settlements are fine, but I trust a firm that has actually gone to court.
> - **Communication** — the best outcome means little if you can't reach anyone for weeks.
> - **Fee clarity** — I prefer a plain contingency number over a vague promise.

**TR — İhmal (avukat seçimi — yorumlu)**
> Bir ihmal avukatı seçiyorsanız, önem sırama göre tartacağım üç şey şunlar:
> - **Duruşma geçmişi** — uzlaşmalar iyi ama mahkemeye gerçekten çıkmış bir büroya güvenirim.
> - **İletişim** — haftalarca kimseye ulaşamıyorsanız en iyi sonuç bile bir şey ifade etmez.
> - **Ücret netliği** — belirsiz bir vaat yerine açık bir başarı primi oranını tercih ederim.

---

## Sorgu → içerik tipi karar tablosu

Önce **modaliteyi** (olgusal/yorumlu), sonra **yapıyı** (yapılı/yapısız) belirleyin. İkisi birleşince A/B/C/D kombinasyonu çıkar.

### Eksen 1 — Olgusal mı, Yorumlu mu?

| Sinyal | Olgusal (factual) | Yorumlu (opinionated) |
|---|---|---|
| Sorgu kelimeleri | "nedir", "ne demek", "nasıl çalışır", "ne zaman", "kimdir", "tanımı", "what is", "definition", "how does" | "en iyi", "tavsiye", "değer mi", "deneyim", "yorum", "vs/karşılaştırma", "best", "review", "worth it", "opinion" |
| Niyet | tek doğru cevap, ansiklopedik | öznel değerlendirme, birinci el deneyim |
| SERP görünümü | Wikipedia, resmi/kurumsal, sözlük, how-to | Reddit/Quora/forum ağırlıklı, YouTube vlog, "best of" listeleri |
| YMYL/uzmanlık | yüksek (hukuk, sağlık, finans) → olgusal | düşük/deneyimsel → yorum tolere edilir |
| Dil | şimdiki zaman, modalite yok, sayı/ölçü | "bence/sence", duygusal sıfat, hikâye |

> **Kural:** SERP'te Reddit/Quora/forum sonuçları **baskınsa** sorgu UGC/yorum ister → C veya D (ya da hibrit sayfa; "Hibrit sayfa şablonu"na bakın).

### Eksen 2 — Yapılandırılmış mı, Yapılandırılmamış mı?

| Sinyal | Yapılandırılmış (liste/tablo) | Yapılandırılmamış (paragraf) |
|---|---|---|
| Sorgu kelimeleri | "adımları", "türleri", "listesi", "top/en iyi N", "X vs Y", "fiyatları", "özellikleri", "checklist", "steps", "types", "best … list" | "nedir", "neden", "ne anlama gelir", "açıkla", "why", "what is", "explain" |
| İçerik doğası | birden çok eş-değerli/paralel öğe, karşılaştırma, sıralı süreç | tek kavramın açıklaması, neden-sonuç, tanım |
| SERP görünümü | tablo/liste snippet, sıralı/sırasız liste, karşılaştırma tabloları | paragraf featured snippet, tanım kutusu |

### Birleşik karar (kombinasyon seçimi)

| Sorgu örneği | Modalite | Yapı | Kombinasyon |
|---|---|---|---|
| "ihmal nedir" / "what is e-SIM" | olgusal | yapısız | **A** |
| "ihmalin unsurları" / "e-SIM nasıl aktive edilir (adımlar)" | olgusal | yapılı | **B** |
| "e-SIM kullanmaya değer mi" / "ihmal avukatı deneyimi" | yorumlu | yapısız | **C** |
| "en iyi e-SIM sağlayıcıları" / "fiziksel SIM vs e-SIM" | yorumlu | yapılı | **D** |
| "senior dating nasıl + nerede tanışılır (forum ağırlıklı SERP)" | karışık | karışık | **Hibrit sayfa** |

---

## Hibrit sayfa şablonu (olgusal + uzman/UGC + JSON-LD)

Amaç (röportaj 259–263): olgusal gövde + dipte uzman/UGC Q&A → Google hangi modaliteyi tercih ederse etsin iki açıdan da şans. eHarmony senior dating deseni.

### Sayfa iskeleti (görsel segmentasyon)
```
[H1 + erken doğru yanıt: önemli varlık, doğal açıklama; is-a/bold isteğe bağlı]
├─ BÖLÜM 1 — Olgusal gövde (A ve B kombinasyonları)
│    • Her H2 altında: is-a → predicate → attribute("X of Y")
│    • Liste/tablo gereken başlıklarda B deseni
│    • Modalite yok, sayı var, kaynak/doğrulama
│
├─ GÖRSEL AYIRICI (arka plan rengi/kenarlık/ikon değişimi — "burası farklı modalite")
│
└─ BÖLÜM 2 — Uzman/UGC Q&A (C kombinasyonu)
     • Başlık: "Uzman yanıtları" / "Sık sorulanlara uzman görüşü"
     • Olgusal bölümdeki soruların forum tarzı tekrarı
     • Her yanıt: gündelik dil + uzman adı/rozeti + tarih + "faydalı" sayacı
```

**Görsel segmentasyon ipuçları:** iki bölümü **farklı arka plan/kart stiliyle** ayırın; uzman yanıtlarına **avatar + ad + unvan + tarih** koyun; soru-cevapları **accordion/kart** yapın; UGC bloğunu sayfanın **görünür biçimde altına** yerleştirin ki modalite ayrımı hem kullanıcıya hem tarayıcıya belli olsun.

### JSON-LD — gerçek editöryal sayfa örneği

Aşağıdaki örnek PrintGridCalendar metodoloji sayfasının görünür marka/yayıncı bağlamını gösterir. QAPage değildir; uzman, oy, deneyim veya yayın tarihi uydurmaz. Üretimde mevcut schema sahibi ve gerçek sayfa çıktısıyla birleştirilmeden ikinci blok eklenmez.

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://printgridcalendar.com/calendar-methodology/#webpage",
  "url": "https://printgridcalendar.com/calendar-methodology/",
  "name": "Calendar methodology",
  "inLanguage": "en-US",
  "publisher": {
    "@type": "Organization",
    "name": "Print Grid Calendar",
    "url": "https://printgridcalendar.com/"
  }
}
```

QAPage yalnız tek gerçek soru ve kullanıcıların alternatif yanıt gönderebildiği uygun yapı içindir. Editörün birkaç FAQ yanıtı bunu karşılamaz. Gerçek community tartışması yoksa DiscussionForumPosting de eklenmez. Kaynak: https://developers.google.com/search/docs/appearance/structured-data/qapage

## AI destekli yazım prompt şablonu

A/B/C/D sunum biçimini kullanıcı işine göre seç. Doğal Türkçe/İngilizce örnekler yöntem anlatımıdır; public PrintGridCalendar metni en-US olur.

```text
GİRDİ: gerçek sayfa brief'i, hedef sorgu/iş, entity/attribute, component,
sağlanmış resmi kaynaklar ve varsa izinli gerçek uzman/kullanıcı katkısı.

1. Kullanıcının işini ve doğru cevabı erken açıkla; ilk %2 token veya kelime
   sayısı Google eşiği değildir. Gerekli bilgiyi kısaltma uğruna çıkarma.
2. Factual bölümde kanıtlanmış bilgi ve belirsizlik/kapsam açık olsun.
   is-a → predicate → attribute bir editöryal seçenek; zorunlu üç cümle yok.
3. Opinionated içerik yalnız sağlanmış gerçek deneyim/gerekçeye dayansın.
   Kişi, unvan, ödül, oy veya kullanım sayısı uydurma.
4. Liste/tablo gerekiyorsa paralel ve erişilebilir yapı kullan; gerekmiyorsa
   doğal paragraf yaz. Kalın ilk cümle/modallik yasağı otomatik uygulanmaz.
5. Demo/klişe/dolgu ifadeyi temizle; doğru teknik terimi ve kaynak kredisini koru.
6. Gerçek katkı yoksa uzman Q&A/UGC üretme. Editöryal FAQ'yı forum gibi işaretleme.
7. Kaynağı veya gerekli veri eksikse tamamlandı deme; iç QA kaydında bekliyor yaz.

ÇIKTI: yalnız istenen public bölüm; yöntem, A/B/C/D gerekçesi ve eksik kanıtlar
ayrı iç QA kaydına gider. Public sayfaya inceleme/yayın tarihi ekleme.
```

> **İstisna — FreshCalendars `/news/`:** Haber makalelerinde görünür byline ve yayın ve güncelleme tarihi/saati (ET) **zorunludur** (Google News şeffaflık şartı: "clear dates and bylines"). Bkz. `docs/NEWS-ROADMAP.md` §9.1.
> **Dateline (25 Ekim 2026 kararı):** kullanılmaz. Google'ın News politikalarında dateline şartı yok; varsayılan "New York" haberin yazıldığı yeri göstermediği için okuru yanıltıyordu ve gizli metin olarak duruyordu. `news:seo-audit` 08-DATELINE artık dateline'ın geri gelmediğini kontrol eder.

## Yazar QA kontrol listesi

**Modalite & sıra**
- [ ] Sorgu doğru sınıflandı mı? (olgusal/yorumlu + yapılı/yapısız → A/B/C/D)
- [ ] Olgusal bölümde **hiç** kanaat cümlesi yok mu?
- [ ] Olgusal paragraf **is-a → predicate → attribute("X of Y")** sırasıyla mı açılıyor?
- [ ] İlk cümle soruyu doğru ve doğal biçimde karşılıyor mu? Kalın/is-a seçimi editöryal gerekçeli mi?
- [ ] Yorumlu bölüm **doğal** mı, zorlama sıra yok mu, en az bir gerçek çıpa var mı?

**Kesinlik & dil**
- [ ] Gereksiz modal fiiller ("-meli/-malı, gerekir, will/should") ayıklandı mı?
- [ ] Şimdiki/geniş zaman, aktif ve net ifade kullanıldı mı?
- [ ] Belirsiz nicelik ("birçok, bazı") yerine **sayı** kullanıldı mı?
- [ ] Kısaltmalar ilk kullanımda tanımlandı mı?

**Token ekonomisi & AI-imza**
- [ ] Kullanıcı yanıtı ve önemli varlıklar erken açık mı? %2 token hipotezi zorunlu eşik yapılmadı mı?
- [ ] Dolgu/klişe giriş yok; her cümle bir iş yapıyor mu?
- [ ] Tekdüze cümle uzunluğu / kalıplaşmış geçişler / aşırı simetri temizlendi mi (AI parmak izi)?

**Yapı & yapılandırılmış veri**
- [ ] Yapılı içerikte liste/tablo maddeleri paralel mi?
- [ ] Hibrit sayfada olgusal gövde ile UGC/uzman bloğu **görsel olarak** ayrıldı mı?
- [ ] Dip Q&A gerçekten kullanıcı sorusu/çoklu yanıt mı → `QAPage`/`DiscussionForumPosting`; değilse rich-result beklentisi yok mu?
- [ ] JSON-LD alanları (yazar, tarih ISO 8601, en az bir içerik öğesi) tam mı?
- [ ] FAQPage rich-result'a bel bağlanmadı mı (Ağu 2023 kısıtı)?

**Doğrulama**
- [ ] Her olgu bağımsız kaynakla doğrulandı mı?
- [ ] YMYL konularda uzman imzası/kaynak var mı?

---

## Riskler

- **Patent iddiasının fazla kesin sunulması (⚠️):** "AI Overview patenti iki modaliteyi puanlayıp birleşik skor verir" cümlesi US11769017B1'de birebir yoktur. Dışa iletişimde "Google patent literatüründe nesnel+öznel skorların birleştirilmesi örneği vardır (US9002894)" biçiminde temkinli kurun.
- **FAQPage'e güven (❌ risk):** FAQ rich result çoğu site için kaldırıldı; strateji buna dayandırılmamalı. QAPage/DiscussionForumPosting'i yalnızca **gerçek** UGC/forum yapısında kullanın; aksi halde spam/yanıltıcı işaretleme riski.
- **Sahte UGC riski:** Dip "uzman/forum" bloğunu gerçek olmayan kullanıcı/uzmanlarla doldurmak hem Google politikalarına hem güvene aykırıdır; gerçek uzman katkısı ve şeffaf anonimlik (eHarmony gibi "profesyonel tavsiye değildir" notu) tercih edilmeli.
- **Aşırı kısaltma (token ekonomisi):** "Az token" uğruna bilgiyi eksik bırakmak olgusal yeterliliği düşürür; denge, "az ama tam + görsel anotasyon".
- **Şablon körlüğü:** is-a/predicate/attribute her başlığa mekanik uygulanırsa metin robotik olur ve AI-imzası artar; doğallık ve varyasyon korunmalı.
- **Modalite yanlış sınıflama:** Yorumlu sorguya katı olgusal şablon (veya tersi) uygulamak SERP uyumsuzluğu yaratır; SERP'i (Reddit/forum baskın mı?) mutlaka kontrol edin.

---

## Ölçüm / KPI

- **Modalite isabeti:** Hedef sorgu için üretilen kombinasyon (A/B/C/D) SERP'in baskın formatıyla eşleşiyor mu? (örneklem denetimi)
- **Featured snippet / rich result kazanımı:** Olgusal-yapısız → paragraf snippet; olgusal-yapılı → liste/tablo snippet kazanımı.
- **AI Overview / AI impression payı:** Search Console AI Overview impression verisini normal web impression ile karşılaştır; hangi modalite/alt-klasör daha çok AI alıntısı alıyor? (röportaj 180–186 ile uyumlu)
- **UGC bloğu etkileşimi:** Dip Q&A'de "faydalı" oyları, soru gönderimleri, bölümün scroll derinliği/etkileşimi.
- **Yapılandırılmış veri sağlığı:** QAPage/DiscussionForumPosting geçerlilik oranı, Search Console rich-result/forum raporları.
- **AI-tespit skoru:** Üretilen metinlerde AI-tespit aracı skoru eşik altında mı (özellikle kısa sayfalarda "kararsız/geçersiz" bekleniyor).
- **İlk ekran açıklığı:** önemli varlık ve gerçek görevin kullanıcı tarafından anlaşılması; %2 token yalnız ayrı hipotez kaydıdır.
- **Sıralama/trafik:** Hedef nitelik ("X of Y") sorgularında konum ve tık; core update'lerde dayanıklılık.

---

## Kaynaklar

- Transkript: `/Users/mustafa/Documents/Workspace/SEO/seo-talks-whisper.txt` (satır 17–20, 163–170, 241–265)
- Koray çerçevesi özetleri (olgusal/yorum, modaliteden kaçınma, önce-cevap): LinkedIn "Semantic Content Writing Rules According to Koray's Framework, Part-1" paylaşımları
- Google patent — Generative summaries for search results: https://patents.google.com/patent/US11769017B1
- Google patent — nesnel+öznel skorun birleştirilmesi (US9002894): patents.justia.com / Google Patents US9002894
- eHarmony senior dating (hibrit sayfa + dip uzman Q&A, canlı doğrulama): https://www.eharmony.com/senior-dating/
- Google — Discussion forum & profile page structured data (Kasım 2023): developers.google.com/search (DiscussionForumPosting, QAPage); özet: searchenginejournal.com forum structured data
- Google — FAQ rich result kısıtı (Ağustos 2023): searchenginejournal.com "Google drops FAQ rich results"
- Google — Hidden Gems / Perspectives (Mayıs 2023, çekirdek sıralama): blog.google/products/search/google-search-perspectives ; searchengineland.com hidden gems
- Google — Discussions and forums SERP özelliği (Eylül 2022)

> Uyarı: Web kaynaklarından 15 kelimeyi aşan alıntı kullanılmamıştır; tüm özetler parafrazdır.

---

## Ek — "Algorithmic Authorship" rehberiyle karşılaştırma (30 Ekim 2026)

> Bölüm 08'e ektir; yukarıdaki satır numaraları denetimde atıf olarak kullanıldığı için not dosyanın sonuna eklendi.

Aynı röportajın temize çekilmiş bir özeti (`algorithmic_authorship_advanced_guide.md`) okundu. Bu bölümün çerçevesini doğruluyor; yeni olarak dört düzeltme getiriyor ve bunlar `news-seo` becerisine işlendi:
- **Yüklem kesinliği:** "Modal fiilden kaçın" kuralı tek başına eksik. Fiil, kaynağın kesinliğini taşır: resmi kaynak onayladıysa "kapanır/gerekir", yalnız plan veya beklenti varsa "planlanıyor/açıklanmadı". Onaylı bilgiyi yumuşatmak da, planı kesinleştirmek de hatadır. "Neden olur / gerektirir / ile ilişkilidir" birbirinin yerine kullanılmaz.
- **Varlık–nitelik–değer–bağlam:** Her olgu kapsamıyla yazılır (hangi eyalet, hangi kurum, hangi saat dilimi). Kaynak ve yıl kuralının üçüncü ayağı.
- **Değiştirici varyant sayfaları:** Yalnız yer/mağaza adı değişen kopya sayfa doorway sayfadır; varyantlar tek hikâyede tabloya girer. Ayrı sayfa yalnız varyantın kendi resmi olguları varsa açılır.
- **Abartılmaması gerekenler:** Hibrit şablondaki arka plan rengi kullanıcı için ayrımdır, sıralama sinyali değildir; anlamı semantik HTML ve etiketli başlıklar taşır. "İlk 6–7 cümle" de sabit bir eşik değildir; açılış konuyu adlandırır, cevabı verir, ana koşulu söyler.

/news/ için yorum/UGC kısmı değişmez: olgusal hikâyelerde görüş yok (`08-NO-OPINION`), yalnız atıflı alıntı; uydurma uzman, okur veya deneyim bloğu yok; FAQ yalnız görünür `<details>` olarak kalır.
