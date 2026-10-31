# Yayın rehberi (site sahibi için)

freshcalendars.com Cloudflare'de çalışır: sayfalar bir Worker'da (`freshcalendars`), tüm görseller,
takvim PNG/PDF'leri ve printable'lar R2'de (`cdn.freshcalendars.com`). Yayını tamamen GitHub Actions
yapar; senin Mac'inin ya da bir sunucunun açık olması gerekmez. Teknik ayrıntı: `docs/DEPLOY.md`.

## Yazılar nasıl yayına çıkar

1. Editör yazıyı `main`'e push eder.
2. GitHub CI (`ci.yml`) testleri, /news/ build'ini, `news:verify` ve `news:seo-audit`'i çalıştırır.
3. Hepsi yeşilse aynı çalışma yeni görselleri R2'ye yükler ve siteyi yayınlar (`deploy.yml`, sırayla, birer birer).
   Push'tan canlıya genelde 5-6 dakika sürer. Kırmızı CI asla yayınlanmaz; düzelten yeni commit gelince o yayınlanır.
4. Gelecek tarihli `publishedAt` taşıyan yazı, saati geldikten sonra 5-15 dakika içinde çıkar (`scheduled.yml`).
5. Yeni yazılar IndexNow'a ve bir kez AnindaIndex'e bildirilir; güncellenen yazılar IndexNow'a.

Takip: GitHub → Actions. `gh run list --branch main --limit 5` son çalışmaları gösterir. Başarısız
zamanlanmış işler GitHub bildirim e-postasıyla gelir.

## Takvim sitesi

`calendar.yml` VPS'teki cron'un yerini aldı (saatler UTC):

| Saat | İş |
|---|---|
| Her gün 05:25 | `refresh-meta`: bugün kartı, when-is tarihleri, bu hafta |
| Ayın 1'i 06:30 (Şubat-Aralık) | `refresh`: yeni ayın PNG/PDF'leri, R2'ye yükleme |
| 1 Eylül 08:45 | `generate-next`: gelecek yılın takvimleri |
| 1 Ocak 06:30 | `rollover` |
| Pazartesi 07:15 | sağlık kontrolü |

Elle çalıştırmak: Actions → Calendar site → Run workflow, ya da `gh workflow run calendar.yml -f job=refresh-meta`.
Takvim kodu değişince sayfalar bir sonraki günlük işte yenilenir; beklemek istemezsen bu komutu çalıştır.

## Sorun çıkarsa

| Ne görüyorsun | Ne yapmalı |
|---|---|
| CI kırmızı, "does not match collection schema" | Yazının üst bilgisi hatalı. Editör yeni commit ile düzeltir; hiçbir şey yayınlanmadı. |
| `news:seo-audit` FAIL | Kural ihlali. Editöre geri gönder. |
| Yazı sitede görünmüyor | `publishedAt` gelecekte olabilir; ya da CI hâlâ çalışıyor. `pnpm news:verify-live <slug> --wait 600` canlıya çıktığı anı doğrular. |
| Yanlış bir şey yayınlandı | `git revert <commit>` ve push; CI geri alınmış hâli yayınlar. Acil durumda Actions'ta son iyi `Deploy` çalışmasını "Re-run" et. |
| İletişim formu | Mesajlar e-postayla gelir (gönderen `contact@notify.freshcalendars.com`) ve R2'de `freshcalendars-state/contact/` altında saklanır. |

## Sırlar

GitHub'daki `CLOUDFLARE_API_TOKEN` yalnızca bu siteye yetkili, kısıtlı bir token'dır (`freshcalendars-ci`).
Cloudflare Global API Key'e yayın için gerek yoktur; `.env`'de tutma, Cloudflare panelinden yenile.
Editörlerin hiçbir sırra ihtiyacı yok: `main`'e push etmeleri yeter.

## Geri dönüş

`docs/DEPLOY.md` → Rollback. Kısaca: Worker route'unu silmek trafiği VPS'teki son kopyaya döndürür;
`cdn` kaydını DigitalOcean'a geri çevirmek görselleri de döndürür.
