# /news/ yayın rehberi (site sahibi için)

## Otomatik yayın (2026-10-24'ten beri)

Mac'inde bir launchd görevi 5 dakikada bir `main`'e bakar. `main`'e yeni bir commit gelmiş ve GitHub CI o commit'te yeşil bitmişse, o commit'i `~/.freshcalendars-publish` adlı ayrı bir clone'dan (macOS arka plan görevlerinin `~/Documents`'a erişmesine izin vermiyor) `pnpm news:deploy` ile yayınlar. Sadece yazı, görsel veya PDF değiştiyse hızlı modu (`NEWS_CONTENT_ONLY=1`), kod da değiştiyse tam senkronu kullanır. Gelecek tarihli `publishedAt` taşıyan yazılar, saati geldikten sonraki ilk kontrolde yayına çıkar. Kırmızı CI asla yayınlanmaz; düzelten yeni commit yeşil olunca yayın devam eder. Her yayında ve her hatada macOS bildirimi gelir.

- Kurmak (bir kez, merge'den sonra): `bash scripts/install-autopublish.sh`. `.env` clone'a kopyalanır; `.env`'i değiştirirsen bu komutu tekrar çalıştır.
- Kapatmak: `bash scripts/install-autopublish.sh --remove`
- Kayıt: `~/Library/Logs/freshcalendars-autopublish.log`, son deploy çıktısı: `~/Library/Logs/freshcalendars-deploy-last.log`
- Durum dosyaları: `~/Library/Application Support/FreshCalendars/autopublish/` (`last-sha`: son yayınlanan commit)
- Mac uykudaysa yayın bekler; uyandığında ilk kontrolde yapılır.

Elle yayın (aşağıdaki adımlar) hâlâ çalışır; sunucudaki yayın kilidi (`flock`) iki yayını aynı anda çalıştırmaz, ama elle yaptığında `last-sha` güncellenmez, sonraki kontrol aynı commit'i bir kez daha yayınlar (değişiklik yoksa `changed=0` ile biter).

Editörler yazıyı yazar, kontrolleri geçirir ve `main`'e push eder. Yayını sadece sen yaparsın; sunucu ve Cloudflare anahtarları (`.env`, SSH anahtarı) yalnızca senin Mac'inde.

## Her yeni yazıda (3 adım)

```bash
cd ~/Documents/Workspace/FreshCalendars
git pull origin main
pnpm news:deploy
```

`pnpm news:deploy` sırasıyla şunları yapar:

1. Testler, build ve link/SEO doğrulaması (biri hata verirse durur, hiçbir şey yayınlanmaz).
2. Kodu ve içeriği VPS'e gönderir, VPS'te aynı build'i yapar. `pnpm-lock.yaml` değişmediyse VPS'te `pnpm install` ve Chromium kurulumu atlanır (`.deps-stamp`); zorlamak için `FORCE_INSTALL=1 pnpm news:deploy`.
3. Değişen dosyaları `public_html/news/` altına kopyalar.
4. Değişen adresleri Cloudflare önbelleğinden temizler, Google ve Bing için IndexNow'a bildirir.
5. Canlı siteyi kısa bir sağlık kontrolünden geçirir.

Başarılı bittiğinde son satırlar şöyledir:

```
[news] IndexNow 3 url(s) → HTTP 200
changed=12
✔ /news/ live: cf-cache-status: MISS
```

Sonra yazının adresini tarayıcıda aç ve bir göz at.

## Daha hızlı yol: sadece yazı ve görsel değiştiyse

```bash
NEWS_CONTENT_ONLY=1 pnpm news:deploy
```

Sadece `apps/news/src/content`, `apps/news/src/assets` ve `apps/news/public` (printable PDF'ler) gönderilir, paket kurulumu atlanır. Editör kod, generator, `package.json` veya bileşen değiştirdiyse normal `pnpm news:deploy` kullan.

## Sorun çıkarsa

| Ne görüyorsun | Ne yapmalı |
|---|---|
| Build hatası, "does not match collection schema" | Yazının üst bilgisi (başlık en fazla 110 karakter, açıklama 120-160) hatalı. Editöre geri gönder; hiçbir şey yayınlanmadı. |
| `news:seo-audit` FAIL | Kural ihlali (kısaltma açılmamış, yasaklı kelime, PDF metadatası). Editöre geri gönder. |
| En sonda `curl` hatası (ör. exit code 35) ama öncesinde `changed=` ve `purge ok` var | Yayın tamamlandı; sadece son kontrol bir anlık bağlantı hatası verdi. Sayfayı tarayıcıda aç, açılıyorsa sorun yok. |
| Yazı sitede görünmüyor | `publishedAt` gelecekte olabilir: otomatik yayın saat geldikten sonraki ilk kontrolde (5 dakika içinde) çıkarır. CI kırmızıysa hiçbir yeni commit yayınlanmaz; `gh run list --branch main --limit 1` ile bak. |
| Uyarı e-postasında `stampPdf` ve `ENOENT` / `open` hatası | Yazının listelediği bir PDF sunucuda yok (eskiden hızlı mod PDF göndermiyordu). Normal `pnpm news:deploy` çalıştır. |
| `git pull` çakışma verdi | Kendi Mac'inde commit etmediğin değişiklik vardır. `git status` ile bak; emin değilsen bana sor. |
| Yanlış bir şey yayınlandı | `git revert <commit>` ile geri al, sonra `pnpm news:deploy`. Gerekirse `git push origin main`. |

## Sunucudaki eski cron (kapalı)

VPS'teki 15 dakikalık `news-publish` cron'u 2026-10-23'te kapatıldı; zamanlanmış yazıları artık Mac'teki otomatik yayın çıkarıyor (yukarıda). Kapatmak (veya kapalı tutmak) için VPS'te:

```bash
bash /home/yuzdehesaplama/private/freshcalendars-app/scripts/install-crontab.sh
```

`NEWS_CRON=1` olmadan çalışınca crontab'daki news satırını kaldırır, takvim işleri aynen kalır. Geri açmak için başına `NEWS_CRON=1` ekle.

## Hızlı kontroller

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://freshcalendars.com/news/<slug>/
curl -sI https://freshcalendars.com/news/downloads/<grup>/<dosya>.pdf | grep -i '^link'
```

İlki 200 dönmeli; ikincisi PDF'in yazıyı canonical olarak gösterdiğini doğrular.

## Ana takvim sitesi ayrı

Takvim sayfaları (aylık takvimler, `/when-is/`) farklı bir sistemle yayınlanır:

```bash
pnpm fc gen-meta          # sayfaları yeniden üretir (yaklaşık 1 dakika)
pnpm fc deploy --confirm  # sunucuya gönderir ve Cloudflare önbelleğinin tamamını temizler
```

Bunu sadece takvim sitesinde değişiklik olduğunda kullan; /news/ yazıları için gerekmez.

## Gerekenler (sadece senin Mac'inde)

- Proje kökünde `.env`: `CF_EMAIL`, `CF_API_KEY`, `CF_ZONE_ID`, `DEPLOY_HOST` ve diğerleri.
- VPS'e (`root@2.25.147.42`) şifresiz SSH anahtarı.
- `node` ve `pnpm` (`pnpm install` bir kez).

Bunları kimseyle paylaşma; editörlerin yayın için bunlara ihtiyacı yok.
