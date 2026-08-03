# Overnight / batch plan — Fresh Calendars

Use after monorepo skeleton exists. Order matters.

## Block 0 — blockers (human / API)

- [x] Cloudflare zone in ops account → `CF_ZONE_ID=1e7d8a7f6839cf53df0ac94e2c264ebd`
- [x] Registrar NS → `alexis` / `nelly` (WHOIS + public resolvers)
- [x] CF DNS: apex+www A → `2.25.147.42` proxied; bogus AAAA removed
- [x] Origin Let’s Encrypt + CF SSL **strict**; site 200
- [x] Spaces bucket + CDN endpoint + `cdn.` CNAME + factory Spaces key
- [ ] Universal SSL wildcard → `active` (ACME TXT already published; then `cdn.` 1014 goes away)
- [ ] MariaDB DB/user for contact (Hestia `yuzdehesaplama`) if contact ships in v1

Live matrix: [`INFRA-STATUS.md`](INFRA-STATUS.md).

## Block 1 — code skeleton

- [ ] pnpm workspace + packages engine/templates/generator  
- [ ] Port resolve + holidays; Fresh `urls.ts`  
- [ ] Fresh DESIGN tokens in site chrome + print families  
- [ ] `sitePages` for all inventory A URLs + B redirects in `.htaccess`  
- [ ] CLI `pnpm fc`  

## Block 2 — assets

- [ ] `gen --year` current + next  
- [ ] `verify` green  
- [ ] `sync-cdn`  

## Block 3 — cutover

- [ ] VPS tar backup  
- [ ] `deploy --confirm`  
- [ ] smoke:auto + lighthouse  
- [ ] GSC sitemap  

## Block 4 — automation

- [ ] `sync-app` + install crontab  
- [ ] CF cache optimize + hestia nginx TTL split  
- [ ] CLS measure sign-off  
