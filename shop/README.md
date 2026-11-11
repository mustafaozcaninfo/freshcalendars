# Fresh Calendars Shop (shop.freshcalendars.com)

The affiliate shop for planners, journals, calendars and journaling supplies. It runs on FreshStore (the "crystal" template), not on our own code, and is managed only through the FreshStore Site API. This folder keeps the tools, the live design, the rating method and the runbook. Live store data (products, prices, pages) lives in FreshStore, not here.

A session that works on the shop reads this file first.

## Setup (once per machine)

1. **API key.** Ask the owner for the FreshStore API key and save it in `.cache/shop/token` (gitignored), or export it as `FRESHSTORE_TOKEN`. **Never commit it; this repository is public.** Keys are made in the FreshStore admin (Settings > API Keys).
2. **API reference.** Ask the owner for `api-freshstore.md` and save it as `.cache/shop/api-freshstore.md`. It lists every endpoint and field. Read the section you need before calling an endpoint.
3. **Tools.** `pnpm install` once (Playwright for `ui_shot.mjs` comes with `packages/generator`). The Python tools need only Python 3.
4. **Claude cloud sessions:**
   - Set `FRESHSTORE_TOKEN` as an environment variable in the cloud environment's settings; a cloud session cannot see a local `.cache/shop/token`.
   - Give the environment network access to `shop.freshcalendars.com` (API and site) and `suggestqueries.google.com` (for `suggest.py`); WebSearch already works for agents.
   - Attach `api-freshstore.md` to the first message, or paste the section you need.
   - For `ui_shot.mjs`, run `npx playwright install --with-deps chromium` once after `pnpm install`.
5. **Check the connection:**
   ```bash
   python3 -c "import sys; sys.path.insert(0,'shop/tools'); from fs import call; print(call('GET','store/info'))"
   ```

Every tool writes its output, backups and audits to `.cache/shop/` (gitignored).

## Rules

- **Rate limit:** 60 API requests a minute per key, shared by every caller. Run one API script at a time and keep about 1 second between calls. Agents never call the API; they research and draft into files, and the main session writes.
- **Back up before you change anything** (`fs.backup(name, obj)`). Change, then read back, then check the live page.
- **Do not touch, by the owner's decision:**
  - the disabled merchants (Walmart, Etsy, AliExpress offers)
  - the review stars and review counts the platform generates
  - the empty Amazon and eBay tracking IDs (they come later)
- **Facts only from the listing or the maker.** Never guess a size, paper weight, count or date.
- **Never invent a person.** Product ratings carry Jessica Hartwell's name and go live only after she approves them (see Ratings). Articles use "Fresh Calendars Team".
- **No fake deals or urgency.** Say "below its usual price" only when the offer's `price` is lower than `price_full`.
- **No unlicensed trademark merchandise** (for example military emblem notebooks).
- **Never submit a form on the live site** (newsletter, contact) while testing.
- **Commit only code, design and method files.** Never commit backups, tokens or the API reference.

## How the platform behaves (learned the hard way)

**Caching and access**
- **CDN:** after any change call `POST store/clear-cache`; the edge purge takes 2 to 4 minutes. To bypass the cache when checking, add `?v=<random>` to the URL.
- **User agents:** the CDN returns 403 to `curl/`, `python-requests` and headless Playwright user agents on site pages. Send a browser user agent (`ui_shot.mjs` and `crawl.py` do). API calls are exempt.

**Slugs and redirects**
- Changing a product's **title** also changes its **slug**. Products, articles and brands get an automatic 301 from the old slug.
- **Disabled products return 404, so add the redirect yourself.** Policy:
  - an out-of-stock or unpriced product: disable it, then 301 it to its category (`POST redirects/bulk`)
  - a disabled brand with live products: 301 it to `/brands`

**Pages and design**
- **Own pages draw only Sections.** A page made with `POST pages` shows nothing from its `content` field. Add `heading` (tag h1) and `content` blocks with `PATCH pages/{id}/sections`. The `content-band` block did not render.
- In a `products` section, `quantity` must equal the number of `custom_ids`, or the platform fills the gap with unrelated products. Heading size `large` is huge on phones; use `medium`.
- **CSS specificity:** the theme sets many `!important` rules under `.cr-prism`. Override with `body.cr-prism ...` plus `!important`. The theme's second gradient color comes from `--cr-p2`, which we set to dark green.
- **Template texts:** `PATCH store/texts`. Setting a text to `""` restores the default, so it cannot be used to blank a text.
- **Scripts:** `settings/store` holds `header_scripts` and `footer_scripts`. Nav search and footer newsletter placeholders, the contact field label and the mobile filter toggle are added by `design/footer-scripts.html`.

**Importing products**
- `POST products/import-links` (ASINs, up to 100, with `categories`) runs in the background, and the platform writes the title and copy with AI.
- Some ASINs fail **silently**: no product appears. Retry once, then drop them.
- After an import, read every new product's offers: `stock_available: 0` with no price means the product goes straight to the out-of-stock policy.

**Other**
- Robots.txt gets the platform's own `User-agent: *` block and Sitemap line appended. Tag pages are noindex automatically.
- Visitors outside the enabled countries (USA, CAN, GBR, DEU) may see GBP from client-side geo detection. US visitors get USD, and the CDN does not cache by country.

## State on Nov. 9, 2026

**Catalog and content**

| Item | Count |
|---|---|
| Live products | about 240, all with Amazon US offers |
| Enabled categories | 30 (top level: Planners, Bullet Journals, Journaling Supplies, Calendars, Guided Journals, Patriotic and Military) |
| Articles | 5 (`types-of-journals` and `planner-accessories-guide` are scheduled for Nov. 12 and Nov. 15) |
| Ratings live | 76 (score 4.0 or more only; see `ratings/`) |
| Redirects | about 400 |

**Pages:**
- `/how-we-rate-products`: the public rating method
- `/veterans-day-gifts`: the seasonal page, built from sections

**Design (system v2, Nov. 11, 2026):**
- `design/custom.css` is the whole live CSS: functional fixes first, then the design system block ("Fresh Calendars Shop design system").
- **Tokens:** the system sets `--fc-*` tokens (ink, text, muted, accent, link, page, surface, line, radius, shadow) on `body.cr-prism` and redefines the theme's `--cr-*` tokens from them. Change a color or radius in the tokens, not in single rules.
- **Look:** neutral surfaces and hairlines instead of green gradients and glows; radius scale 8, 12, 16 and 20 px; one solid green primary button; quiet text links for "see all" and "View product"; Sora 600 for headings, Manrope for body.
- **Header:** on desktop the "freshcalendars.com" link sits inside the navy bar and the nav row is sticky; on phones the announcement line is hidden.
- **Dark mode:** the script in `design/hook-top.html` (template text `HTML_HOOK_TOP`) adds `cr-prism--dark` to `<body>` when the visitor's system is dark; section 12 of the CSS holds the dark tokens. Product photos keep a white plate. Check both modes after any color change (`colorScheme: 'dark'` in Playwright).
- **Files:** scripts in `design/header-scripts.html` and `design/footer-scripts.html`; customised template texts in `design/template-texts.json`.

**Open admin-only items** (no API exists for these):
1. A cookie consent banner, or cookieless Matomo, for UK and DE visitors.
2. Social profile handles (none are set).
3. Google Search Console and Bing verification codes.
4. Check the AI chip balance before any large import.
5. The three eBay Auto Populators are still on and add unreviewed products every day.

## Routines

### Add products for long-tail searches
1. **Collect queries.** `python3 shop/tools/suggest.py` collects Google autocomplete queries for the seed list into `.cache/shop/kw/suggest.json`. Keep queries with buying intent; earlier picks are in `data/longtail-targets.json` and `data/google-suggest-filtered.json`.
2. **Find products.** Give agents (Sonnet, `general-purpose`) a list of `[category_slug, keyword]` pairs plus an exclude list of ASINs already in the shop.
   - They find one amazon.com product per keyword with WebSearch, using `allowed_domains: ["amazon.com"]`; direct Amazon fetches return 503.
   - Never accept a guessed ASIN.
   - The web-search budget is about 200 a turn, shared by all agents, so split the list across agents.
3. **Review the list yourself.** Drop:
   - near-duplicates of products already in the shop (same brand and line)
   - past-year products
   - disabled brands
   - unlicensed trademark items
4. **Import** by category with `POST products/import-links`. Wait about 3 minutes, then read every new product: price, stock, title, category.
5. **Tidy up.**
   - Apply the out-of-stock policy.
   - Fix wrong facts in the AI titles (a title change also changes the slug, and the 301 is automatic).
   - 301 any new disabled brand to `/brands`.
6. **Brand pages:** if a product joins an enabled brand, update that brand page's product list so it stays true.

### Ratings (Fresh Calendars Score)
1. The method and the writing rules are in `ratings/METHODS.md`. The public version is the `/how-we-rate-products` page; keep both in step.
2. Build the input: listing text per product from the offers' `title` and `features`.
3. Agents draft into `.cache/shop/reviews/drafts*.json`: each feature present must carry a verbatim quote from the listing. Agents never compute the score.
4. `python3 shop/tools/ratings_check.py` validates quotes, banned words and lengths. Then also check:
   - every number in the text appears in the listing
   - no con states as fact something the listing simply does not mention
5. `python3 shop/tools/ratings_score.py` computes the scores (method v2). Only scores of 4.0 or more are shown.
6. Write the approval file. Publish only after Jessica Hartwell approves, then verify the live pages: "Rated by Jessica Hartwell", the right `ratingValue`, and the "we did not test it by hand" note.

### Seasonal page (pattern: `/veterans-day-gifts`)
1. Pick 10 to 20 relevant, in-stock products, using a category if the theme lasts all year.
2. `POST pages` sets the title, meta and slug. `PATCH pages/{id}/sections` adds a heading (h1, medium), a content block, products sections (`custom_ids` and a matching `quantity`) and a closing content block linking freshcalendars.com.
3. Give the owner an embed box (`snippets/`) for the matching freshcalendars.com page.
4. Check at 360 and 1440 px: one H1, canonical, no overflow.

### Design changes
1. **Edit the files.** Change `design/custom.css` (or the scripts) in this repo first.
2. **Push them to the store.** Write the CSS with `PATCH store/texts` `{"texts":{"CUSTOM_CSS": ...}}` and the scripts with `PATCH settings/store`, then clear the cache.
3. **Check after the purge:**
   ```bash
   node shop/tools/ui_shot.mjs <url> 360 out.png
   ```
   The tool prints overflow, small tap targets, unnamed controls, low contrast, broken images and console errors.
4. **Look at the screenshot.** Full-page shots show lazy-loaded images as blank boxes; that is an artifact, not a bug.
5. **Commit** the design files so the repository matches the store.

### Articles
Use the `shop-article` skill (`.claude/skills/shop-article/SKILL.md`): which queries deserve a page, the article types and templates, the writing rules, the agent workflow, velocity and the stop rule. Every article passes `tools/article_check.py` before `tools/article_publish.py` puts it live.

### Site audit
`python3 shop/tools/crawl.py` crawls every page and writes `.cache/shop/audit/crawl.json`: status, titles, descriptions, canonicals, H1s, JSON-LD, internal and external links and images. It never requests retailer URLs. Share buttons and template strings in scripts show up as false positives.

## Files

| Path | What |
|---|---|
| `tools/fs.py` | API client (`call`, `backup`, `WORK`) |
| `tools/fetchall.py` | every enabled product with offers, categories and brand |
| `tools/crawl.py` | full read-only site crawl |
| `tools/suggest.py` | Google autocomplete long-tail harvest |
| `tools/ratings_check.py`, `tools/ratings_score.py` | rating draft validation and method v2 scoring |
| `tools/ui_shot.mjs` | screenshot plus UI metrics for one page at one width |
| `tools/article_check.py`, `tools/article_publish.py` | article rule checker (also `--sync`, `--orphans`, `--live`) and publisher; see the `shop-article` skill |
| `articles/registry.json`, `articles/queue.json` | every shop article (type, query, cluster, products, H2s) and the article queue |
| `research/google-affiliate-2026.md` | Google's official rules for affiliate and review content, quoted with URLs (Nov. 9, 2026) |
| `design/` | live custom CSS (fixes plus the design system), the body-top hook, header and footer scripts, customised template texts |
| `ratings/` | method, the list of published ratings, the approved batch |
| `data/` | long-tail targets and filtered Google suggestions |
| `snippets/` | embed boxes for freshcalendars.com pages |
| `ROADMAP.md` | competitor analysis (GadgetSteal) and the plan |
