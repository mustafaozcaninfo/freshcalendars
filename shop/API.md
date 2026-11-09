# FreshStore Site API: our working guide

Our own guide to the FreshStore Site API for shop.freshcalendars.com, arranged around the jobs in `README.md`. It is built from the platform's reference (version updated Nov. 3, 2026, checked against the platform's routes on Oct. 28, 2026) plus what we learned on the live store. The full platform reference stays out of git: keep it at `.cache/shop/api-freshstore.md` and read it when this guide is not enough. When the two disagree, trust the live store, then fix this file.

Contents: 1. Basics · 2. Our guardrails · 3. Recipes · 4. Endpoint reference · 5. Gotchas · 6. What the API cannot do

## 1. Basics

| Item | Value |
|---|---|
| Base URL | `https://shop.freshcalendars.com/api/` (`fs.BASE`) |
| Auth | `Authorization: Bearer <key>`; the key comes from `FRESHSTORE_TOKEN` or `.cache/shop/token` |
| User-Agent | Requests that carry a key are not filtered; we still send `FreshCalendarsScript/1.0` |
| Rate limit | 60 a minute per key. Headers `X-RateLimit-Limit` and `X-RateLimit-Remaining`; over the limit you get 429 (`fs.call` waits 20 s and retries) |
| Body | JSON in, JSON out. Booleans may be `true`/`false` or `"1"`/`"0"` |
| Wrapper | Most answers are `{"data": ...}`. Exceptions: `store/instant-store-readiness` (no wrapper), settings writes (`{"message": ...}`), `DELETE` (204, empty) |

```python
import sys; sys.path.insert(0, 'shop/tools')
from fs import call, backup, WORK
status, body = call('GET', 'products/213?include=offers,categories,brand')
```

**Pagination.** Lists take `page` and `per_page` (default 15, max 100) and return `data`, `links` and `meta` (`meta.total`, `meta.last_page`). Exception: `GET redirects` defaults to 50 a page and returns only `meta.total`, `meta.per_page` and `meta.current_page`. `fetchall.py` already pages through every enabled product.

**Errors**

| Code | Meaning | What we do |
|---|---|---|
| 401 | The key's user has no API access | Ask the owner |
| 402 `not_enough_chips` | AI endpoint, no AI chips left | Stop. Never retry |
| 403 `{"error":"Forbidden"}` | Missing, bad or expired key (a bad key is 403, not 401) | Check the token |
| 403 `{"message":"This token does not have ..."}` | The key lacks the ability | Ask the owner for the ability; do not work around it |
| 403 HTML page | CDN blocked a User-Agent (site pages, not `/api`) | Use a browser UA (`ui_shot.mjs`, `crawl.py`) |
| 404 `{"error":"Not Found"}` | Unknown route or id | |
| 409 | Site upgrading (rating fields, tags, feeds), unpublished Live Site Editor draft, or new design off | Wait a minute and retry once; for a draft, ask the owner |
| 422 | Validation or a business rule; `errors` names the field | Read `message`, fix, resend |
| 429 | Rate limit | Wait for the minute to roll over |
| 503 | Site installing (`Retry-After: 30`) or AI call failed | Retry later |

**Permissions.** A Full Access key passes everything. Otherwise GET needs broad Read and writes need broad Write; if the key holds any `resource:verb` ability, the path's resource must match too. The resource is the first path segment:

| Path | Resource |
|---|---|
| `products`, `tags` | products |
| `offers` | offers |
| `categories`, `populators` | categories |
| `brands` | brands |
| `articles`, `images` | articles |
| `article-categories` | article-categories |
| `pages`, `zones` | pages |
| `settings`, `launch-plan`, `redirects` | settings |
| `store`, `tools`, `recommendations` | store |
| `analytics` | analytics |
| `data` | data |
| `users` | users |

Two traps: the admin screen has no `store:write`, so `POST store/clear-cache` needs a Full Access key or broad Write with no resource boxes; and the "AI assistant" presets leave out `settings`, so they cannot write redirects.

## 2. Our guardrails, mapped to the API

These come from `README.md` and owner decisions. The API allows all of these calls; we do not make them.

| Never call or change | Why |
|---|---|
| `offers` group: `walmart_*`, `etsy_*`, `aliexpress_*` `_enabled`, and any disabled merchant's offers | Owner decision: those merchants stay disabled |
| `offers` group: `amazon_{cc}_tag`, `ebay_tracking_id` | Owner decision: tracking IDs come later |
| `product` group: `auto_review_*`, `show_reviews`; product `review_score`, `review_quantity`; `schema.generated_stars_in_google` | Owner decision: platform stars stay as they are |
| `author_rating`, `author_verdict`, `author_pros`, `author_cons` without Jessica Hartwell's approval | Ratings policy (`ratings/METHODS.md`) |
| `POST store/clean`, `POST brands/clean`, `POST store/retire-catalogue` with `dry_run: false`, any `DELETE` on products, categories, brands or articles | Irreversible or broad. Use the disable + 301 policy instead; ask the owner first |
| `users/*`, especially `GET users/login-link` (a magic sign-in link) | Not our job; treat as a password |
| `POST store/template`, `store/regenerate-stock-texts`, `store/pick-logo-icon`, `store/generate-logo`, `store/footer-credit`, `PATCH store/design` | Design is owned in `design/`; the theme stays "crystal" |
| `POST member-facts`, `users/invite` | Platform only (403 anyway) |
| Store `*_api_key`, `*_secret`, `*_token` settings | Credentials; never read into logs or files in git |

Before every write: `backup(name, current_object)`; after: read back, `POST store/clear-cache`, wait 2 to 4 minutes, check the live page.

## 3. Recipes

### Health check (read only, 4 calls)

```python
call('GET', 'store/info')        # name, url, version, live, enabled_countries
call('GET', 'store/stats')       # products, categories, articles, brands, offers, offers_expired,
                                 # offers_out_of_stock, products_without_offers (sorted by value, smallest first)
call('GET', 'store/warnings')    # the admin Site Health list
call('GET', 'tools/offer-health')# what store/clean would remove; read it, never run clean
```

`store/stats?images=1` adds `offers_images_pending` and `articles_images_pending` (slower). `GET store/status` needs no key and returns `{"up": true}`.

### Import products from Amazon (long-tail routine)

1. `POST products/import-links` `{"links": ["B0...", ...], "categories": [cat_id], "locale": "us"}`, 1 to 100 links. Answer 202 with `importing`, `duplicates` (with the existing `product_id`) and `failed` (with `reason`). Some ASINs fail without showing up as failed: count new products afterwards.
2. Wait about 3 minutes; then `GET products?sort_by=created_at&sort_dir=desc&per_page=100&include=offers,categories` (or `GET products/{id}?include=offers,categories,brand`).
3. For each new product check the offer: `price`, `price_full`, `stock_available`, `price_hidden`, `locale`, `merchant`.
4. Out of stock or no price: `PATCH products/{id}` `{"enabled": false}`, then a 301 to its category (bulk, below).
5. Wrong facts in the AI title: `PATCH products/{id}` `{"title": ...}`. The slug changes and the platform adds the 301 itself.
6. Wrong category: `POST products/{id}/categories` `{"category_ids": [...]}` (it **replaces** the list; `PATCH products` refuses `category_ids` with 422, and older releases silently drop it).

Alternative for many products at once: `POST categories/fill` `{"api_name": "amazon", "locale": "us", "categories": [ids], "quantity": 1-50}`. It costs AI chips (`generate_content` and `ai_relevance_check` default to true) and publishes according to the admin's "Publish New Products Immediately" setting, which the API does not expose. Turn that off in the admin before a fill (ROADMAP step 2).

### Disable and redirect (out-of-stock policy)

```python
call('PATCH', f'products/{pid}', {'enabled': False})
call('POST', 'redirects/bulk', {'redirects': [
    {'from': '/products/old-slug', 'to': '/categories/planners'},
]})
```

- `from` and `to` take a full URL, a path or a slug, up to 255 characters. A second redirect from the same `from` replaces the first.
- `switch_off_source: true` on a row also disables the old page, so one call can do both steps.
- Up to 500 rows a call. 50 rows or fewer: 200 with `status: done` and per-row `results` (`index`, `ok`, `error`). More than 50: 202 with an `id`; read `GET redirects/bulk/{id}` until `status` is `done` (kept a week). A bad row fails alone; the CDN is purged once for the batch.
- List: `GET redirects?per_page=100&hide_automatic=1`. Fields: `from`, `to_url`, `status` (`active`, `waiting` = old page still live, `broken` = target not working), `source`, `last_used_at`. `waiting` means the old product is still enabled.
- A disabled brand with live products: 301 to `/brands`.

### Publish ratings (after approval only)

- `PATCH products/{id}` with `author_rating` (1 to 5, steps of 0.1: 4.3 is valid, 4.35 is 422; `null` clears), `author_verdict` (600 characters max), `author_pros` and `author_cons` (up to 8 items of 160 characters). Our own limits in `METHODS.md` are stricter (verdict 420, items 150, 3-4 pros, 1-3 cons).
- One PATCH per product. A 409 "Store is upgrading" means retry after a minute.
- `author_reviewed_at` is set by the site. `GET products?sort_by=author_rating&sort_dir=desc` lists rated products first; `own_touch=with` lists products with our verdict, pros, cons or photo.
- `schema.your_ratings_in_google` controls whether our ratings go to Google. Leave it as it is.
- Live check: "Rated by Jessica Hartwell", the right `ratingValue` and the "we did not test it by hand" note.

### Seasonal page from Sections (pattern `/veterans-day-gifts`)

1. `POST pages` `{"title", "slug", "meta_title", "meta_description", "enabled": true, "in_footer_menu": false}`. The `content` field is not drawn on our own pages.
2. `GET pages/{id}/sections` returns `sections` and `blocks` (each block's settings schema). Check `editable: true` and `editor_draft: false`.
3. `PATCH pages/{id}/sections` `{"operations": [...]}`, 1 to 50 operations, all or nothing, published at once:
   - `{"op": "add", "block": "heading", "settings": {...}, "position": 1}`; also `update` (id, settings), `enable`, `disable`, `move` (id, position from 1), `remove`.
   - `products` block: `"mode": "custom"`, `custom_ids: [...]` and `quantity` equal to `len(custom_ids)`.
   - link value: `{"link": "https://...", "link_text": "", "new_tab": false, "no_follow": false}`; internal targets like `internal:page:categories` work.
   - image value: `{"src": "https://...", "alt": "", "title": ""}`.
   - repeater (FAQ, cards): send the whole list; items past the end are emptied.
   - 422 names the bad operation (`operations.1.settings.alignment`); 409 `editor_draft`, `new_design_off` or `not_composable`.
4. Clear the cache and check at 360 and 1440 px.

Homepage Featured Products: set `custom_ids` on its products section, or `POST store/featured-products` with `dry_run: true` first.

Category, brand and article page zones: `GET`/`PATCH zones/{page_type}/{zone}/sections` with `page_type` `category`, `brand` or `article` and zone `above_core`, `below_core` or `sidebar` (no sidebar for articles). A zone applies to every page of that type.

### Design push (after editing `design/`)

```python
css = open('shop/design/custom.css').read()
call('PATCH', 'store/texts', {'texts': {'CUSTOM_CSS': css}})        # max 50,000 chars, cleaned
call('PATCH', 'settings/store', {'footer_scripts': open('shop/design/footer-scripts.html').read()})
call('POST', 'store/clear-cache')
```

- `GET store/texts?keys=CUSTOM_CSS,HEADER_BAR_TEXT` reads texts; `customised` tells our text from the default. Up to 200 keys a write; an unknown key refuses the whole call.
- Per the reference, `null` restores the default and `""` shows nothing. `README.md` records that `""` restored the default on our store. Read back after any blanking attempt.
- `header_scripts` and `footer_scripts` can be changed only with a key the site owner created; another admin's key may only resend the current value.
- `GET store/design` reads palette and fonts (read only for us).

### Articles

- `POST articles`: `title`, `slug`, `content` (HTML), `meta_title`, `meta_description`, `author: "Fresh Calendars Team"`, `enabled`, `published_at` (ISO; a future date schedules the article, saved disabled, live on that date), `product_category_id`, `article_categories` (ids, replaces the set on update).
- We write our own HTML: never send `generate_ai_content: true` (it also clears the body on update).
- Images in `content` are copied to the site's CDN in the background (up to 30, JPEG, PNG, WebP or GIF, 10 MB, no redirects; Amazon images stay linked). On create the first copied image at least 600 px wide fills the listing and social image. `copy_images: false` turns that off. The hero comes only from `POST articles/{id}/images` `{"collection": "hero", "url": ...}`; `POST articles/{id}/fill-empty-images` copies the hero into empty listing and social slots.
- A review article: `reviewed_product_id` plus the `author_*` rating fields (same rules as products).
- `GET images/stock?query=...&orientation=horizontal&quantity=6` searches Pexels, Unsplash and Pixabay with no chips; results carry `attribution`.

### Analytics (read only)

| Need | Call |
|---|---|
| Visits over time | `GET analytics/visits/summary?period=day&length=30` |
| Top pages | `GET analytics/pages` (not paginated) |
| Sources | `GET analytics/sources`, `analytics/sources/summary?source=google` |
| Affiliate clicks over time | `GET analytics/clicks/summary`, `analytics/clicks/by-merchant?merchant=amazon` |
| Most clicked products | `GET analytics/clicks/top-products?days=30&limit=50` |
| One product | `GET products/{id}/analytics` (`analytics_visits`, `total_clicks`, `affiliate_clicks`) |
| Raw clicks | `GET analytics/clicks?affiliate=true&from=...&to=...` |

`revenue` and `value` are the product price at click time, not commission or sales. Data can lag about 10 minutes. `period` is `day` (max 366), `week` (260) or `month` (120); keys look like `2026-10-07`, `2026-W41`, `2026-10`.

### Auto Populators (the eBay item in README)

- `GET populators?enabled=1` lists them with `merchant`, `search_term`, `quantity_per_day`, `total_products_added` and `stopped_reason`.
- `PATCH populators/{id}` `{"enabled": false}` or `POST populators/bulk` `{"ids": [...], "enabled": false}` turns them off.
- Create, delete and run-now exist only in the admin. Switching them off is an owner decision; ask first.

### SEO settings

- `GET settings/traffic`: `robots_txt_content`, `gsc_verification_content`, `bing_verification_content`, the `indexnow_submit_*` flags and the `ai_treasure_map_include_*` flags (llms.txt).
- Search Console and Bing codes go in with `PATCH settings/traffic`, once the owner gives them.
- `GET store/indexnow?recent=20` shows whether IndexNow works.
- `GET settings/xml-sitemap`, `POST store/rebuild-sitemap` (202, no body).

## 4. Endpoint reference

`R` = read, `W` = write. Paths are relative to `/api/`.

### Store and tools

| Method | Path | Use |
|---|---|---|
| GET | `store/status` | No key; `{"up": true}` or a `reason` |
| GET | `store/info` | `name`, `url`, `niche`, `live`, `default_country`, `enabled_countries`, `version`, `cart_enabled`, `advanced_mode` |
| GET | `store/stats` (`data/stats`) | Content counts; `?images=1` adds image backlogs |
| GET | `store/warnings` | Site Health list (`message`, `action`, `url`) |
| GET | `store/locales` | Enabled countries keyed `us`, `gb` ... |
| GET | `store/indexnow?recent=` | IndexNow summary and last attempts |
| GET | `store/messages/summary` | Contact messages over time |
| GET | `store/instant-store-readiness` | Content counts (no `data` wrapper) |
| GET | `store/template?key=` | Current template, readiness, dry run of a switch |
| GET/PATCH | `store/texts` | Template texts and `CUSTOM_CSS` |
| GET | `store/design` | Scheme, palette, fonts and allowed values |
| POST | `store/clear-cache` | Clears caches and queues a CDN purge (`edge: false` skips the CDN); answer has `edge: queued|skipped` |
| POST | `store/rebuild-sitemap` | Queues a sitemap build (202) |
| POST | `store/featured-products` | `quantity` 4-12, `force`, `dry_run`; status `seeded`, `already_chosen`, `blocked_draft`, `no_band` ... |
| POST | `store/images` | `collection` `logo`, `icon` (PNG), `social`, `hero`, `about`, `person`; `url`; `replace` |
| GET | `tools/offer-health` | Counts that `store/clean` would delete |
| GET | `recommendations?limit=` | Platform suggestions |
| GET | `launch-plan` | Launch checklist; `POST`/`DELETE launch-plan/{key}` marks a step |
| POST | `recompute` | Re-check launch plan and recommendations |
| GET | `data/openai-tokens` | AI tokens used per month |

Avoid (section 2): `store/clean`, `store/retire-catalogue`, `store/template` POST, `store/regenerate-stock-texts`, `store/pick-logo-icon`, `store/generate-logo`, `store/footer-credit`, `PATCH store/design`, `store/design/palette`.

### Products

Fields: `id`, `slug`, `title`, `subtitle`, `link_title`, `content`, `content_bottom` (HTML), `highlights` (list), `summary`, `meta_title`, `meta_keywords`, `meta_description`, `review_quantity`, `review_score`, `author_rating`, `author_verdict`, `author_pros`, `author_cons`, `author_reviewed_at` (R), `enabled`, `in_sitemap`, `brand_id`, `analytics_visits` (R), `upc`, `ean`, `isbn`, `mpn`, `main_image_url` (R), `tags` (R), `created_at`, `updated_at`; with `?include=brand,offers,categories`.

| Method | Path | Notes |
|---|---|---|
| GET | `products` | Filters `search`, `enabled`, `brand_id`, `category_id`, `tag_id`, `own_touch=with|without`; `sort_by` one of `id`, `title`, `slug`, `enabled`, `brand_id`, `analytics_visits`, `review_score`, `review_quantity`, `author_rating`, `created_at`, `updated_at` (else 422); `sort_dir` |
| POST | `products` | `title` required. Makes a product with no offer, no price, no image |
| GET/PATCH/DELETE | `products/{id}` | PATCH sends only the changed fields; DELETE is a soft delete |
| GET | `products/{id}/offers` | Paginated |
| GET/POST | `products/{id}/categories` | POST `{"category_ids": [...]}` replaces; `[]` removes all |
| GET/POST | `products/{id}/tags` | Accelerator only for now (403 with a date otherwise) |
| GET | `products/{id}/analytics` | Visits and clicks |
| POST | `products/{id}/images` | `{"collection": "gallery", "url": ..., "replace": false}`; our own pictures show before offer pictures |
| POST | `products/import-links` | Up to 100 links or ASINs, `categories`, `locale` |
| POST/GET | `products/import-csv`, `products/import-csv/{id}` | CSV by `file` or `csv_url` (5 MB, 1,000 rows); `title` is the only required column; `enabled`, `generate_content` |
| GET | `tags` | Every tag and Tag Group (not paginated) |

### Offers

Fields: `id`, `uuid` (`{merchant}_{locale}_{id}`), `merchant` (`amazon`, `ebay`, `etsy`, `walmart`, `aliexpress`, `custom`), `merchant_offer_id` (the ASIN), `title`, `summary`, `features` (list), `currency`, `price`, `price_full`, `price_hidden`, `price_source`, `price_checked_at`, `min_price`, `max_price`, `condition`, `stock_available`, `enabled`, `locale`, `images`, `url_detail`.

| Method | Path | Notes |
|---|---|---|
| GET | `offers/merchants` | Enabled merchants |
| GET | `offers` | Filters `search`, `merchant`, `enabled`, `product_id`; newest first |
| POST | `offers` | `merchant`, `title`, `url_detail`, `merchant_offer_id` required. A merchant offer that exists is returned (restored) instead; price and stock fill in the background |
| GET/PATCH/DELETE | `offers/{id}` | DELETE removes it from every product |
| POST | `offers/{id}/products` | `{"product_ids": [...]}` adds links, never removes |

Rules we follow with offers: listing text for ratings comes from `title` and `features`; "below its usual price" only when `price < price_full`; never show a price when `price_hidden` is true.

### Categories, populators, brands

Category fields: `id`, `parent_id`, `slug`, `title`, `subtitle`, `link_title`, `content_top`, `content_bottom`, `meta_title`, `meta_keywords`, `meta_description`, `enabled`, `sort_order`, `products_count`, `children_count`.

| Method | Path | Notes |
|---|---|---|
| GET | `categories/tree` | Nested, by `sort_order` |
| GET | `categories` | `search`, `enabled`, `parent_id` |
| POST | `categories` | `title` required; do not send `generate_ai_content` or `generate_images` (chips; images cost about 20,000 chips each with AI) |
| GET/PATCH/DELETE | `categories/{id}` | |
| GET | `categories/{id}/products` | Paginated |
| POST | `categories/{id}/images` | `collection` `listing` or `banner`, `url`, `replace` |
| POST | `categories/fill` | See recipes; chips |
| POST | `categories/generate-list` | AI suggestions only; chips |
| GET | `populators`, `populators/{id}` | |
| PATCH | `populators/{id}` | `enabled`, `search_term`, `quantity_per_day` (1, 3, 5, 10, 25, 50), `max_quantity`, `max_products_in_category`, `ai_relevance_check` |
| POST | `populators/bulk` | `ids`, `enabled` |
| GET | `brands` | `search`, `enabled`; ordered by title |
| POST | `brands` | `title` required |
| GET/PATCH/DELETE | `brands/{id}` | Products join a brand through `brand_id` on the product |
| GET | `brands/{id}/products` | For keeping brand pages true |

### Articles, article categories, pages

Article fields: `id`, `slug`, `title`, `subtitle`, `link_title`, `content`, `meta_title`, `meta_keywords`, `meta_description`, `author`, `enabled`, `generated`, `product_category_id`, `fallback_random_products`, `formula` (R: `standard`, `review`, `fact-sheet`), `reviewed_product_id`, `author_*`, `published_at`, `article_categories` (on get).

| Method | Path | Notes |
|---|---|---|
| GET | `articles` | `search`, `enabled`, `generated`, `article_category_id`; newest first |
| POST | `articles` | See recipes |
| GET/PATCH/DELETE | `articles/{id}` | |
| POST | `articles/{id}/images` | `collection` `hero`, `listing` or `social` |
| POST | `articles/{id}/fill-empty-images` | Never overwrites |
| POST | `articles/generate-topics` | AI suggestions; chips |
| GET | `images/stock` | Free stock search |
| GET/POST | `article-categories` | |
| GET/PATCH/DELETE | `article-categories/{id}` | |

Page fields: `id`, `key` (system pages: `homepage`, `about`, `contact`; null for ours), `slug`, `title`, `subtitle`, `link_title`, `content`, `meta_*`, `enabled`, `in_footer_menu` (default on at create: send `false` for seasonal pages unless wanted).

| Method | Path | Notes |
|---|---|---|
| GET | `pages` | `search`, `key`, `enabled` |
| POST | `pages` | Do not set `key` on our own pages |
| GET/PATCH/DELETE | `pages/{id}` | |
| GET/PATCH | `pages/{id}/sections` | See recipes |
| GET/PATCH | `zones/{page_type}/{zone}/sections` | Same operations |

### Settings

`GET settings` (flat `{group}_{key}`), `GET settings/{group}`, `PATCH settings` or `PATCH settings/{group}`. Groups: `store`, `offers`, `product`, `traffic`, `article`, `social`, `template`, `xml-sitemap`, `schema`. Keys ending in `_password`, `_secret`, `_key`, `_keystring`, `_key_base64`, `_token` or `_cert_id` are never returned. A write answers `{"message": "Settings saved successfully."}`; a key that cannot be saved gives 422 with `failed`, and the other keys in the same call are still saved. An unknown group prefix is ignored silently.

| Group | Keys we use | Notes |
|---|---|---|
| `store` | `name`, `live`, `enabled_countries`, `header_scripts`, `footer_scripts`, `matomo_site_id`, `ai_language` | Scripts need an owner-made key; changing `ai_language` purges cached pages |
| `offers` | read only for us | Merchant switches and tags are owner decisions |
| `product` | `listing_default_sort`, `show_button_on_listings` | Review ranges and `show_reviews` are off limits |
| `traffic` | `robots_txt_content`, `gsc_verification_content`, `bing_verification_content`, `indexnow_submit_*`, `ai_treasure_map_include_*` | |
| `article` | `default_author`, `show_article_meta`, `show_table_of_contents`, `auto_refresh_modified_date_*` | `auto_refresh_modified_date_enabled` moves dates without content changes; keep it off |
| `social` | `*_handle`, `custom_social_url` | Full profile URLs are reduced to handles |
| `xml-sitemap` | `{type}_quantity` (0 = all), `product_method` | A write queues a rebuild within 10 minutes |
| `schema` | read only for us | `price_and_availability`, `shipping_and_returns`, `article_author`, `generated_stars_in_google`, `your_ratings_in_google` |
| `template` | read only | `frontend` is the template key |

### Analytics, feeds, users

- Analytics: `analytics/visits/summary`, `visits` (`country_code`, `device_type`, `from`, `to`), `visitors`, `visitors/{id}`, `pages`, `countries`, `devices`, `sources`, `sources/summary`, `clicks/summary`, `clicks/by-merchant`, `clicks/top-products`, `clicks`, `checkouts/summary`, `checkouts`, `actions` (`action_type` such as `page_view`, `affiliate_click`, `search`).
- Product feeds (`feeds`, `feeds/{id}`, `/preview`, `/import`): Awin, Impact, CJ, Rakuten, Tradedoubler, AvantLink or CSV feeds that make custom offers. We do not use them; adding a network is an owner decision.
- Users (`users`, `users/{id}`, `users/login-link`): not used.

## 5. Gotchas

From the reference:
- A bad key is 403, not 401.
- `PATCH products/{id}` never sets categories; use `POST products/{id}/categories`, which replaces the whole list.
- `POST offers/{id}/products` only adds; to unlink, delete the offer.
- `POST categories/fill`, `products/import-csv` with `generate_content`, `brands/clean` and every `generate_*` flag cost AI chips (about 1,800 chips a product, about 20,000 an AI image, 80,000 at `image_quality: high`). The chip balance is admin-only; check it before any large run.
- Image endpoints take a URL only (no upload), JPEG, PNG, WebP or GIF, 10 MB, and do not follow redirects: send the final address.
- Bulk redirects over 50 rows and live catalogue retires are queued; poll their `{id}`.
- Rating, tag and feed fields can answer 409 while the site upgrades.
- `store/stats` keys come back sorted by value, not by name.

From our store (`README.md`):
- A title change changes the slug (automatic 301 for products, articles, brands). A disabled product is a 404 until we add the 301.
- Our own pages draw only Sections; `content` and the `content-band` block did not render.
- In a `products` section, `quantity` must equal the number of `custom_ids`, or the platform fills the gap.
- The theme's `!important` rules need `body.cr-prism ...` plus `!important` to override.
- The CDN purge takes 2 to 4 minutes; add `?v=<random>` to bypass it when checking.
- AI-written titles from `import-links` need a fact check against the listing.

## 6. What the API cannot do (admin only)

- Create API keys; keys are per site.
- Upload a file (every image is set from a URL).
- Create, delete or run an Auto Populator now.
- Set a video in a section, or edit a page in another country's language.
- Change "Publish New Products Immediately" (not among the documented settings).
- See the AI chip balance (only `data/openai-tokens` usage).
- Cookie consent banner and the other open admin items in `README.md`.
