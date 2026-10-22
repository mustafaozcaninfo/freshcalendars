# /news/ yayın rehberi (site sahibi için)

Editörler yazıyı yazar, kontrolleri geçirir ve `main`'e push eder. Yayını sadece sen yaparsın; sunucu ve Cloudflare anahtarları (`.env`, SSH anahtarı) yalnızca senin Mac'inde.

## Her yeni yazıda (3 adım)

```bash
cd ~/Documents/Workspace/FreshCalendars
git pull origin main
pnpm news:deploy
```

`pnpm news:deploy` sırasıyla şunları yapar:

1. Testler, build ve link/SEO doğrulaması (biri hata verirse durur, hiçbir şey yayınlanmaz).
2. Kodu ve içeriği VPS'e gönderir, VPS'te aynı build'i yapar.
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

Sadece `apps/news/src/content` ve `apps/news/src/assets` gönderilir, paket kurulumu atlanır. Editör kod, generator, `package.json` veya bileşen değiştirdiyse normal `pnpm news:deploy` kullan.

## Sorun çıkarsa

| Ne görüyorsun | Ne yapmalı |
|---|---|
| Build hatası, "does not match collection schema" | Yazının üst bilgisi (başlık en fazla 110 karakter, açıklama 120-160) hatalı. Editöre geri gönder; hiçbir şey yayınlanmadı. |
| `news:seo-audit` FAIL | Kural ihlali (kısaltma açılmamış, yasaklı kelime, PDF metadatası). Editöre geri gönder. |
| En sonda `curl` hatası (ör. exit code 35) ama öncesinde `changed=` ve `purge ok` var | Yayın tamamlandı; sadece son kontrol bir anlık bağlantı hatası verdi. Sayfayı tarayıcıda aç, açılıyorsa sorun yok. |
| Yazı sitede görünmüyor | `publishedAt` gelecekte olabilir. VPS her 15 dakikada yeniden yayınlar; saat geldiğinde kendiliğinden çıkar. |
| `git pull` çakışma verdi | Kendi Mac'inde commit etmediğin değişiklik vardır. `git status` ile bak; emin değilsen bana sor. |
| Yanlış bir şey yayınlandı | `git revert <commit>` ile geri al, sonra `pnpm news:deploy`. Gerekirse `git push origin main`. |

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
