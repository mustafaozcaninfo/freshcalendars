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
  - the Amazon tags (the US tag is set; other countries are the owner's to add)
- **Facts only from the listing or the maker.** Never guess a size, paper weight, count or date.
- **Never invent a person.** Product ratings carry Jessica Hartwell's name and go live only after she approves them (see Ratings). Articles carry her byline too (owner decision, Nov. 11, 2026); her page is `/jessica-hartwell`.
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
- **Dark mode:** the script in `design/hook-top.html` (template text `HTML_HOOK_TOP`) adds `cr-prism--dark` to `<body>`. It follows the visitor's system setting until they press the theme button in the net bar (`.fc-theme`); the choice is kept in `localStorage` under `fc-theme` (`light` or `dark`). Section 12 of the CSS holds the dark tokens. Product photos keep a white plate. Check both modes after any color change (`colorScheme: 'dark'` in Playwright).
- **Modern web guidance pass (Nov. 12, 2026):** the `modern-web-guidance` skill (GoogleChrome) is installed in `.claude/skills/`; its `legacy-scan` found no legacy patterns in `shop/design`, `site-chrome`, the generator, `/news/` or the Worker (35 rules, about a fifth of its catalogue). From its guides the shop gained: speculation rules that prefetch same-origin links on hover (`design/header-scripts.html`; not `/out/`, `/cart`, `/livewire`, query URLs or nofollow links), cross-document view transitions and `text-wrap` (section 18 of `custom.css`), a scroll-driven fade on wide tables with the section 17 background shadow as the fallback, and a theme switch that follows the guide: nothing is stored while the reader follows the system, a click stores the opposite, clicking back clears it, the `color-scheme` meta follows the choice and other tabs stay in step. Browser support policy for shop code: Baseline Widely available needs no fallback; anything newer must degrade to the current behaviour with no added library.
- **Quality pass (Nov. 12, 2026):** section 17 of `design/custom.css` fixes the dark sticky product bar on phones, raises disclosure text to 13 px, turns the category link lists (`.fc-spec-links`, `.fc-guide-links`) into a card grid and adds a scroll shadow to wide tables on phones. The footer script gives the contact fields an `aria-label` from their placeholder. Measured the same day on ten page types (phone throttled to slow 4G with 4x CPU, and desktop): largest contentful paint 0.8 to 2.8 s, layout shift 0 to 0.03. The heaviest page is the product page (about 1.5 MB) because the template loads eight eBay images below the fold without lazy loading; that cannot be changed from CSS or a script.
- **Homepage (Nov. 11, 2026):** hero photo and six category tile photos are listed in `design/images.md`. Sections in order: highlight boxes, hero (medium height), 2027 planners (8), Shop by Type, picks, gift ideas (4), price drops (4), top scores (4), shop by tag, guides (3), printable calendars box. The text block "A Printed Calendar and a Planner Work Well Together" is switched off, not deleted. On phones the CSS shows four cards per product row and the lead pick plus three.
- **Homepage, advent season (Nov. 19, 2026):** the H1 and subtitle of the homepage are the title and subtitle of page 7; the hero photo is a Pexels picture of a wooden advent calendar (photo 195030). Four sections sit above the planner rows: "Trending Advent Calendars" (section 192), "Advent Calendars by Kind" (193, eight subcategories), "Advent Calendars From Brands You Know" (194) and "Wooden Advent Calendars to Refill Every Year" (195). The first highlight box and the guides row point at advent pages too. **The trending row is the advent products with the most retailer clicks in the last 7 days** (`GET analytics/clicks/top-products?days=7&limit=30`, keep the advent ones, in order): refresh its `custom_ids` weekly until Dec. 1, and keep `quantity` equal to the number of ids. Advent products held 8 of the 30 most clicked products that week and the top two places; by page views the planner pages still led. After Dec. 1 move the four sections below the planner rows or hide them, and put the old title back ("Planners and Journals for Your Printable Calendars").
- **Product page columns:** the footer script makes the shorter of the two columns sticky on desktop, so neither side leaves a blank column.
- **Breadcrumb:** one line with chevron separators on desktop; on phones only the parent level, as a back link. The footer script marks the last crumb `aria-current="page"`.
- **Analytics (Nov. 13, 2026):** the header script loads Google Analytics 4 (`G-VT08H0GXHZ`) and Microsoft Clarity (`z9rxjv1l0s`), the same property and project as /news/, after window load. In GA4 filter by hostname `shop.freshcalendars.com`. A click on a retailer button (`[data-fs-out]`) sends the event `affiliate_click` with `link_url`, `merchant` and `page_path`; register `merchant` and `link_url` as custom dimensions in GA4 to report on them. Cloudflare Web Analytics is not installed: the shop is served by FreshStore, not through our Cloudflare zone, so it needs a site token the owner creates in the Cloudflare dashboard (Analytics > Web Analytics > Add a site). As on /news/, no consent signal is sent.
- **US offers for every visitor (Nov. 19, 2026):** `enabled_countries` is `["USA"]` (was USA, CAN, GBR, DEU; backup in `.cache/shop/backup/settings-store-2026-11-19-countries.json`). Every product has only an Amazon US offer, so a visitor placed in Canada, the UK or Germany saw an "estimated" price in their currency and a "Find at Amazon" button that opened a search for our short title on amazon.ca, .de or .co.uk: no product, and no tag of ours (CA and DE had none, the UK used the platform's). In the click log (`GET analytics/clicks`) that was 17 of 80 retailer clicks from Nov. 9 to 19. Now everyone gets the real price and the amazon.com product link, and the country picker is gone from the header. Put a country back only when it has its own Associates tag and real offers. The same log shows US links carried the platform's default tag until the owner set `freshcalendar-20` on Nov. 18.
- **Category pages on phones (Nov. 19, 2026):** section 19 of `design/custom.css` tightens the space above the product grid (the first card starts at about 620 px on a 390 x 844 screen, was 737) and shows the page numbers on their own row; the template printed only "Next" below 640 px.
- **Reading problems from data:** Clarity counts (`docs/desk/clarity.json`) say which pages have dead clicks or quick returns, not where; `GET analytics/clicks`, `analytics/clicks/summary?days=7` and `analytics/clicks/top-products?days=7` show where a retailer click really ended up (`final_url`). Read `final_url` for search pages and missing tags after any offer or country change.
- **Files:** scripts in `design/header-scripts.html` and `design/footer-scripts.html`; customised template texts in `design/template-texts.json`.

**Open admin-only items** (no API exists for these):
1. A cookie consent banner, or cookieless Matomo, for UK and DE visitors.
2. Social profile handles (none are set).
3. Google Search Console and Bing verification codes.
4. Check the AI chip balance before any large import.
5. (Done Nov. 21, 2026) The eBay Auto Populators are off; see "Amazon only" below.

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

### Articles
- Rules, types and the pillar-page pattern are in the `shop-article` skill. `tools/article_check.py` enforces them and `tools/article_publish.py` publishes or updates.
- Run `python3 shop/tools/article_check.py --sync` before a batch: it pulls every live and scheduled article into the registry, which the overlap checks need.
- The model pillar page is `/articles/planner-gifts-for-moms` (Nov. 11, 2026). Inline `<svg>` in article content is kept by the platform.
- The editor page is `/jessica-hartwell` (page id 18); About and the method page link to it.
- **Every article needs a `subtitle`** (30 to 92 characters, no prices): the template prints it as the H2 under the hero and prints an empty heading without one. All 145 articles got one on Nov. 13, 2026 (140 had none); `article_publish.py` refuses a new draft without it and keeps the saved one on an update.
- **Price tables: `python3 shop/tools/article_prices.py`** (weekly, and `--due` after a `refresh_by` date). The registry stores the price each product had when the tables were checked (`prices`, written at publish); the tool reads live offers and lists `CHANGED` (stale table), `CHECK` (no price on record), `GONE` (no live offer) and `DUE`. It changes nothing: fix the draft, republish. After checking an older article by hand, `--record <slug>` saves today's prices.

### Spec pages and deal pages (`tools/spec_pages.py`, `data/spec-pages.json`)
- A spec page lists the products whose listings state a set of specs ("2027 Planners in A5", "Dotted Journals With 120 gsm Paper"). Definitions (the rule, the table columns, the parent categories) are in the tool; prose and page ids are in `data/spec-pages.json`. All of them are linked from `/planner-and-journal-finder` (in the footer menu).
- Rules that keep them useful: 8 or more live, priced, in-stock products; no page that shares more than 60% of its products with a larger one; every table value read from the listing; prose written per page from the page's data file (`.cache/shop/spec/<slug>.json`), with three questions a shopper would type.
- The two `black-friday-*-deals` pages list only offers priced 15% or more below the stored list price. Their prose uses `{count}`-style placeholders filled from the day's data.
- **Routine (daily until Dec. 1, 2026, then weekly):** delete `.cache/shop/audit/products-*.json`, run `fetchall.py` (about 25 minutes), then `python3 shop/tools/spec_pages.py refresh`. It rebuilds every table, product block and the finder page. A line starting `STALE PROSE` means a page's product count changed since its text was written: rewrite that page's prose.
- New page: add a definition, run `build`, write the prose into `data/spec-pages.json`, run `publish <slug>`.

### Brand pages
- A brand page is enabled when the brand has 3 or more live products and its own text. Its `content_bottom` holds a table of its products (size and paper weight from the listings).
- Assign `brand_id` when the retailer title starts with the brand name. When a brand gains or loses products, rewrite its text so the count stays true.
- Nov. 12, 2026: 181 products got a brand, 10 brands were added and 29 more brand pages were opened (56 enabled in all).

### Long-tail article queue (`tools/longtail_queue.py`)
- Matches the saved search suggestions (`data/google-suggest-filtered.json`) against live listings and writes `articles/longtail-queue.json`: queries of three or more words that 6 or more products answer and no article or spec page covers. Run it after `fetchall.py` and `article_check.py --sync`, and pick article topics from it.

### Article batches (Nov. 12, 2026)
- 24 long-tail articles from `articles/longtail-queue.json` are scheduled three a day from Nov. 27 to Dec. 4, 2026 (ids 112 to 135). Facts files and drafts were built in `.cache/shop/articles/` by the workflow in the `shop-article` skill.
- `tools/category_guides.py` links every live article from its product category. Run it weekly and after scheduled articles go live; it skips articles that are not live yet.
- The checker fails an H2 another article already uses, so give the "what we left out" section a heading that names the product kind.

### New family: Clocks and Digital Calendars (live Nov. 21, 2026)
- Why: the shop's clicks sit on low-priced items (advent calendars averaged about 16 dollars). Things that keep time and dates fit the brand, are compared by specs (screen size, apps, subscription, alarms), sell all year and cost more: of the 360 products, the median is about 28 dollars and 55 cost more than 100 (digital wall calendars run to 850).
- Category 128 `clocks-and-digital-calendars` with seven subcategories: digital wall calendars (61), day and date clocks (49), visual timers (68), sunrise alarm clocks (53), alarm clocks (55), wall clocks (34), perpetual calendars (40). A countdown-clock category found only two products and was removed.
- Found two ways: `categories/fill` with product-kind titles, and 333 ASINs of named brands from a Sonnet agent (Skylight, Cozyla, Dragon Touch, American Lifetime, Time Timer, Philips, Lumie, Hatch, La Crosse, Sharp). 540 imported, 363 in stock with a full listing, 360 passed.
- Batch note for writers: `.cache/shop/clocks/TASK.md`. No health outcomes: a day clock page says who the maker sells it to ("seniors and people with memory loss") and what it shows, never that it helps dementia; sunrise clocks carry no sleep or mood claims, visual timers no ADHD or focus claims. Subscription, app and Wi-Fi are stated as the listing states them.
- `product_apply.py` has a printable line for each of the seven slugs. A product whose category changes after `--apply` needs a second apply (remove it from `apply-log.json`): the page text links its category.
- Ten guides in the article category Clock and Digital Calendar Guides (id 4, `/article-category/clock-and-digital-calendar-guides`), live Nov. 21, 2026, ids 179 to 188: digital wall calendars by price per inch, digital calendars with no subscription, Skylight alternatives, day clocks, visual timers, pomodoro cube timers, sunrise alarm clocks, atomic wall clocks, wooden perpetual calendars, alarm clocks with a USB charger. Tools and facts builder in `.cache/shop/clockart/`. The writer brief now tells each writer to keep its own articles under 6% shared 8-word runs; the batch came in at 4% at most and none failed the overlap check. Refresh the price tables by Dec. 21.
- "Cube timer" also means speedcubing timers: the page is titled for pomodoro cube timers and says so in its first paragraph.
- Next for this family: list pages (`spec_pages.py`: screens by size, timers by range), brand pages for makers with three or more products, more guides once Search Console shows which queries land.

### Black Friday 2026 (set up Nov. 21)
- Deal pages, all built by `spec_pages.py` from the stored offer prices (15% or more below the list price the retailer shows, largest cut first): `/black-friday-advent-calendar-deals` (new, 185 products), `/black-friday-planner-deals` (187), `/black-friday-journal-deals` (231). Two price-band lists for advent calendars: `/advent-calendars-under-25` (422) and `/advent-calendars-25-to-50` (361). The deal pages link each other, and the advent hub links all three advent lists.
- **Daily until Dec. 1:** delete `.cache/shop/audit/products-*.json`, run `fetchall.py` (about 55 minutes for 3,100 products), then `python3 shop/tools/spec_pages.py refresh`. A product that returns to list price drops off its deal page. Do not clear the cache while `fetchall.py` runs.
- A cut above 80% is treated as a data fault and ignored (`off()` in `spec_pages.py`): the advent activity books showed 97% because the offer carried an e-book price beside a paperback list price. The band list starts at $4 for the same reason. A card and gift wrap deal page was dropped: 13 products, only two of them cards.
- Homepage during the week: the three highlight boxes point at the three deal pages, the first row is "Black Friday: Largest Advent Calendar Price Cuts" (section 215, `custom_ids` = the first eight `card_ids` of the advent deal page: update them after each refresh), the top bar carries the Black Friday line. Offer prices now refresh every 24 hours (`auto_refresh_offers_minutes` 1440, was 4320).
- **After Cyber Monday (Nov. 30):** retitle or retire the three deal pages (their URLs can serve next year), put the highlight boxes and the top bar back, remove section 215. On Dec. 1 the advent rows move below the planner rows.
- The homepage `<title>` is fixed: "Fresh Calendars Shop: Calendars, Planners and Gifts Compared". Seasons change the H1 (page 7 `title`), its subtitle and the meta description, never the title tag: the homepage is found for the brand, and the season's queries belong to the category and guide pages.

### Selling surfaces (Nov. 21, 2026)
- **Zones.** Category, brand and article pages take Sections above and below their content (`GET/PATCH zones/{category|brand|article}/{above_core|below_core}/sections`); the sidebar zone accepts blocks but this template does not draw it. Below the content now: "Trending in the Shop" (products block, mode `trending`, 4) and "Below Their List Price Today" (mode `special_offers`, 4) on categories and articles, "Trending Across the Shop" on brand pages. Both modes fill themselves; nothing to refresh.
- **Suggestion card** (`fc-promo`, script in `design/footer-scripts.html`, styles in section 20 of `design/custom.css`). It slides in at the bottom corner once per visit, after half a page and 20 seconds, or when a desktop reader moves to leave; closing it hides it for 7 days. On a product page (desktop only, phones have the sticky buy bar) it repeats the page's own retailer button with the list price when the offer shows one. On guides, categories and brand pages it lists products from the homepage row "Trending Across the Shop", fetched at that moment (three on desktop, two on phones). It sends `promo_card_view`, `promo_card_click` and `promo_card_close` to GA4.
- **Why a corner card and no full-screen pop-up:** 80% of visits are on phones and most arrive from ChatGPT or search on a product page; Google demotes pages that cover the content with an interstitial, and a reader who came for one product leaves when blocked. The card covers about a quarter of a phone screen and never the page it opened on.
- The card depends on two things in the page: `.fs-pp-offers a[data-fs-out]` (the offer button) and a homepage section whose `h2` reads "Trending Across the Shop". Rename that homepage row and the list version stops showing (it fails silently).
- The top bar text (`HEADER_BAR_TEXT`) carries the season line. After Dec. 1 put back "Planners and journals to go with your free printable calendars".
- No countdown timers, stock warnings or invented discounts: the only price cut shown is the retailer's own list price next to its current price.

### Amazon only (owner decision, Nov. 21, 2026)
- The shop sells through Amazon US only. eBay is off: `ebay_enabled` and `ebay_search_button_enabled` false in `settings/offers`, `show_ebay_related_products` and `show_retailer_rating_ebay` false in `settings/product`, the three eBay Auto Populators (4, 5, 6) disabled, all 17 eBay offers disabled, and the six live products that only eBay sold (177, 178, 186, 187, 188, 190) hidden with a 301 to their category. No article used them. Do not turn eBay back on or import eBay products without the owner.
- The custom CSS and the click-tracking script still name eBay (rules for a block that no longer renders); they are harmless and can go at the next design pass.

### Where the visitors come from: ChatGPT (measured Nov. 20, 2026)
- From Nov. 16 the largest source of real visits is ChatGPT: 5, 28, 48, 87 and 107 visits a day, against 6 to 44 from search engines. 29% of those visits click a retailer button (search: 17%), 80% are on a phone, 64% from the US and 10% from Canada. They land on product pages first (47 of 81 landing URLs seen), then guides, categories and brand pages. "Direct" visits from Turkey and Qatar are our own checks.
- `python3 shop/tools/ai_traffic.py` prints the daily table. ChatGPT takes most cited pages from search results, so Bing indexing (IndexNow, above) is what feeds it: watch both.
- The calendar site sends readers over: six advent news stories carry a shop card (`shop: advent-calendars` or `shop: lego-advent` in the story's frontmatter, campaigns in `apps/news/src/lib/shop.ts`, off after Dec. 2), and the November and December 2026 month pages and the Thanksgiving page show the advent box (`packages/generator/src/shopLinks.ts`, key `monthly:<year>-<month>`). News cards are `rel="sponsored nofollow"`: they bring readers, not link weight.
- Open for the owner: the shop sells to the US only, so Canadian and British visitors get amazon.com links with the US tag. Turning on OneLink in Amazon Associates (and linking the Canada and UK accounts) is the fix; nothing in the shop needs to change.

### IndexNow with our own key (Nov. 19, 2026)
- The platform sends each new page to IndexNow, at most 200 a day by default (`indexnow_daily_limit`, now 1000). A day of product publishing used the 200 and the 30 advent guides were not sent.
- The shop now has its own key (`PATCH settings/traffic` `indexnow_api_key`; a copy is in `.cache/shop/indexnow-key`). The platform does not serve `/<key>.txt` for a key set through the API, so the calendar site's Worker serves that one file: route `shop.freshcalendars.com/<key>.txt` in `wrangler.jsonc`, `shopKeyFile` in `cloudflare/worker.js` (the shop host is proxied through the same Cloudflare zone). Never widen that route to `shop.freshcalendars.com/*`.
- **Order matters when the key changes: file first, key second.** The first key was saved on the platform a day before its file was live; Bing marked it invalid and kept answering 403 after the file appeared, and the platform's own submissions failed for a day (161 errors, Nov. 19 to 20). A second key fixed it: put the new key in the Worker (constant and route), push, wait until `/<key>.txt` answers on the shop host, then `PATCH settings/traffic`. `.cache/shop/advart/rotate.py` does the wait, the switch and the first submission. Bing took all 3,437 sitemap URLs on Nov. 20 and the platform's next automatic submission answered 200.
- A request for the key file with a query string does not match the route (it reaches the platform and gets 403); test the bare address.
- Bing Webmaster Tools: the shop is verified with the meta tag (`PATCH settings/traffic` `bing_verification_content`, set Nov. 20, 2026; the platform prints `<meta name="msvalidate.01">` in the head of every page). Keep the setting or the verification lapses.
- To send URLs yourself: POST `{host, key, keyLocation, urlList}` to `https://api.indexnow.org/indexnow` (up to 10,000 URLs). `.cache/shop/advart/indexnow_wait.py` waits for the key file and sends every sitemap URL, articles first. This reaches Bing, Yandex and the other IndexNow engines; Google has no such API and needs Search Console (owner task, not verified for the shop).

### Advent article batch (Nov. 19 to 21, 2026)
- 30 articles in the new article category Advent Calendar Guides (id 3, `/article-category/advent-calendar-guides`), ids 149 to 178: ten live on Nov. 19 (LEGO, beauty, squishy, kids, dog, cat, chocolate, tea, coffee, wooden), ten scheduled for Nov. 20 and ten for Nov. 21, 9:00 ET. Topics came from Google Trends for "advent calendar" (US, Oct. 19 to Nov. 19, 2026) matched against what the shop holds; rising brands the shop does not carry (NeeDoh, Skims, eos, Jellycat) got no page.
- Each page has a picker table, one master table of every product with today's price and cost per day, a section per product and reader questions from the research files. `.cache/shop/advart/` holds the product index, the topic picker and the facts builder: prices were refetched that morning and cost per day was computed in the facts file, and a script compared every dollar figure in every draft with its facts file before publishing.
- **Writers who write three sibling articles reuse sentences.** Nine drafts failed the 8-word-run check against a sibling published minutes earlier (9 to 13 percent). Check each draft against the other drafts of the batch before publishing, or tell the writer the limit applies between its own articles.
- `article_publish.py` skips the cache clear when `SHOP_NO_CACHE_CLEAR=1` (set it for a batch, clear once after). `category_guides.py` now reads every page of categories and lists a subcategory's guides on its parent too.
- **To do after Nov. 21:** run `python3 shop/tools/category_guides.py` so the 20 scheduled articles get their category links (it skips articles that are not live), and refresh the price tables by Nov. 27 (`refresh_by`).

### Holiday article batch (live Nov. 13, 2026)

- 11 articles for the holiday family, ids 136 to 146: `best-boxed-christmas-cards` (pillar, all 27 boxes), `how-many-christmas-cards-in-a-box`, `when-to-mail-christmas-cards`, `stationery-advent-calendars`, `advent-calendar-books`, `christmas-gift-tags`, `christmas-envelope-seals`, `greeting-card-organizers`, `boxed-thank-you-cards`, `christmas-scrapbook-paper`, `christmas-planner-books`. Refresh the price tables by Dec. 1.
- Facts files were built from each product's spec table (the rows `product_apply.py` already checked against the listing) plus the offer text, with unit costs computed in the file. Compute a cost per 100 from the price and the count, never from a rounded unit cost: rounding first put eight cells one to four cents off.
- Postal facts in `when-to-mail-christmas-cards` (send-by dates, stamp prices, the nonmachinable rule) were read on usps.com, about.usps.com and pe.usps.com on Nov. 13, 2026. USPS changes prices in January and July; recheck the postage table then, and replace the dates when USPS publishes the next season's release (late September).
- Writers invent reasons in "what we left out" ("we dropped packs sold without envelopes"). Give them the real count of the category and the real reason each product was skipped, or write that section yourself.
- A drawing made by an agent needs a render check: lay all the SVGs out on one page and test every `<text>` box against the viewBox and against the other labels.

### Advent calendars of every kind (live Nov. 17, 2026)
- 755 advent calendars went live in 20 subcategories of Advent Calendars (65): building block, toy, toy car, character and collectible, beauty and bath, chocolate and candy, tea and coffee, food, crystal and gemstone, jewelry, puzzle and game, craft and science, fidget toy, sock, tool and hobby, wooden, fabric and felt, fillable, paper, nativity. Six book calendars joined Advent Activity Books and Journals (66).
- **How they were found.** `POST categories/fill` searches Amazon with the category title, 50 a run. 31 hidden categories with a product kind in the title ("LEGO Advent Calendars", "Tea Advent Calendars") brought 1,331 products in about five minutes. A title that names an audience and no product ("Advent Calendars for Men", "Dog and Cat Advent Calendars") returns books and journals from the store's niche; rename it to the product ("Tool Advent Calendar") and fill again. 66 calendars from established brands were added by ASIN (Sonnet agent, WebSearch on amazon.com); about half were out of stock on Amazon and stay hidden.
- **Filter before the writers** (`.cache/shop/advent/filter.py`): the word advent or countdown in the retailer title before the first " | ", a price and stock, three or more bullets unless a known brand, no past year, no alcohol or adult items, no repeated ASIN or title. 853 of 1,331 went to 25 writer agents (36 products each, `PRODUCT-AGENT.md` plus a batch note with the list of category slugs and a `"move": "<slug>"` field for a real calendar in the wrong category). 761 passed, 120 were rejected (near-copies, listings dated 2025 or earlier, items with no countdown), 6 the editor pruned (Halloween countdowns, a witchcraft set, a survival kit with a knife).
- A category created with a slug that a hidden category already holds gets a random suffix. Rename and reuse the hidden category instead.
- `product_apply.py` keeps the retailer's long slug when it writes the title. Send `slug` (the title, slugified) in a second PATCH; the old address gets a 301.
- **Pet Advent Calendars (category 127, Nov. 18, 2026).** The fill found none, so a Sonnet agent searched amazon.com with exact product-name queries and returned 46 ASINs; 40 imported, 24 were in stock and 23 are live (dog and cat treats, toys, empty calendars to fill, one for hamsters and rabbits). The 16 out of stock stay hidden (Milk-Bone, Bocce's Bakery, DreamBone, SmartBones, Fancy Feast). Treat pages state flavor, count and weight only: no health or "safe for" claims.
- **Brand pages for the new makers (Nov. 18, 2026).** 38 brands with three or more live advent calendars were opened (Vermont Christmas Company 37, Get Trend 27, Funko 9, LEGO, Lindt, Hotel Chocolat, Tea Forte, Vahdam and 30 marketplace makers). `.cache/shop/advent/brands.py` builds each page from the product drafts: the count by category in the subtitle and first sentence, three product subtitles, and a table of every product with its openings and kind. "Generic", "Harry Potter" and "Barbie" are not makers and stay closed. Delete the brand's `/brands/<slug>` redirect when a page opens, and never rerun a redirect script from a saved product file: the saved `brand.enabled` is stale and the script redirected the 38 new pages again (removed the same hour).
- Not done: list pages (`spec_pages.py`) and an article per subcategory.

### Hidden products published (Nov. 19, 2026)
- 1,787 products were hidden. `.cache/shop/advent/hidden.py` refetched each one and sorted them by reason: 808 in stock with a full listing and no page text yet, 632 with a title and no bullets (mostly books), 219 with no stock or no offer, 68 dated for a past year, the rest pruned by the editor.
- The 808 went to 20 writer agents with a batch note (`.cache/shop/rest/TASK.md`): near-copies are kept and told apart in the title, a wrong or missing category is fixed with `"move"` from the list of live category slugs, and only adult, digital, past-year and off-shop items are rejected. 754 passed, 54 were rejected, 7 were pruned.
- **Do not clear the cache during a long batch.** `store/clear-cache` while the apply job ran left every page cold and the site answered 502 for a few minutes. `product_apply.py` no longer clears it; clear it once, after the batch, when the site is quiet. Its log is now saved every 20 products, so a dropped connection loses nothing.
- Still hidden on purpose: the title-only listings (a page built from a title alone is thin content), out-of-stock products, past-year products.

### Out-of-stock cleanup (Nov. 20, 2026)
- A read of every live product with its offers (3,119 products, about 55 minutes at one call a second) found 32 with nothing to buy: 28 with no price and no stock, 2 with no offer, 2 priced with no stock. Each was read again right before the change, backed up, disabled and 301ed to its first enabled category.
- A hidden product leaves traces in four places, and each has to be checked: articles that link it (none this time), custom product rows on pages (the home row "Advent Calendars From Brands You Know" lost one and got another so it still holds 8; `quantity` must equal the number of `custom_ids`), list pages (table row, card and count) and brand pages. A brand page states its count in `subtitle`, `content`, `content_bottom`, `meta_description` and `meta_title`; the title is the one that gets forgotten.
- Three brand pages dropped to two live products (Cloth & Paper, Indeme, LEGO), so they were disabled and `/brands/<slug>` 301ed to `/brands`.
- The list-page refresh that followed showed the daily routine had not run since Nov. 12: 32 of 38 list pages had a different product count than their prose. All 38 were rewritten from their data files the same day (one Sonnet agent per eight pages, a mechanical check of lengths, counts and banned patterns, then a read of the diff in the main session). Run the refresh on schedule so this stays a one-page job.
- Do not start a second API script or clear the cache while `fetchall.py` runs: the shop answered this machine with 429 on every page for about an hour afterwards.

### New product family: Holiday Cards and Gift Wrap (live Nov. 12, 2026)
- Categories 64 to 74. Live: advent calendars (65), advent activity books and journals (66), boxed Christmas cards (67), thank you cards (68), greeting card organizers (70), Christmas scrapbook paper and washi tape (71), gift tags and ribbon (72), Christmas planners and organizers (73), envelope seals and holiday stickers (74). Hidden until it has real cards: birthday and all-occasion cards (69).
- 189 of the 298 filled products are live. The rest stay hidden: 84 the writers rejected (off-category, thin listing, near-copy), 23 the editor pruned, 2 that failed the number check.
- **How a family is added:**
  1. `PATCH settings/product` `publish_new_products: false` (it is off now; leave it off).
  2. Create the categories hidden, then `POST categories/fill` with `generate_content: false` and `ai_relevance_check: false`. The fill searches inside the store's niche, so expect about half to be off-category; for cards, wrapping paper and other goods outside stationery, find products by ASIN and use `POST products/import-links`.
  3. Fetch each new product with its offers into `.cache/shop/<family>/products.json`, write one input file per category and give each to an agent with the product brief (`.cache/shop/PRODUCT-AGENT.md`): title, subtitle, summary, five highlights, a spec table and three sections, all from the listing, or a rejection with its reason.
  4. Read the kept titles per category yourself. Rename a category to what it really holds, move products, and list the ids to drop in `prune.json`.
  5. `python3 shop/tools/product_apply.py .cache/shop/<family>` checks every draft (lengths, banned words, every number in the listing); `--apply` writes the passing ones and shows them.
  6. Write category texts and set listing images, show the categories, redirect closed brand pages of live products to `/brands`, then add list pages (`spec_pages.py`) and run `link-categories`.
- Amazon US links carry the owner's tag `freshcalendar-20` (`amazon_us_tag` in `GET settings/offers`, checked on a live product page Nov. 20, 2026). Amazon tags of other countries are empty (UK links use the platform default).

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

### Template faults fixed on Nov. 13, 2026
- Empty H2 under article heroes: fixed at the source with subtitles (see Articles); the footer script also removes an empty `h1+h2`.
- Brand logos are printed with no `alt`, so the logo-only link to the brand page had no name: the footer script sets "<Brand> logo" from the file name. Article card pictures get the article title as `alt` (from the link's `aria-label`). Flag images keep `alt=""`: their button has an `aria-label`.
- The crawl's "undefined" on the Hug in a Box page (product 2011) was our own sentence, reworded.
- Not fixable from here: on any 404 page Livewire posts `pageLoaded` to `/livewire/update`, the platform answers 204 with no body and the script logs "Unexpected end of JSON input". Nothing visible breaks; report it to FreshStore support.
- Sitemap checked: the 11 holiday articles and `/categories/logbooks-and-record-books` are in it.

### Known-brand 2027 calendars (live Nov. 16, 2026)
- The 131 calendars in the shop were mostly marketplace brands. 22 calendars from established makers were found by ASIN (Sonnet agent, WebSearch on amazon.com only) and imported with `products/import-links`; 17 are live (ids 3606 to 3627): AT-A-GLANCE desk pad, 3-month wall and erasable year planner, House of Doolittle (three), Mead Cambridge (two), Brownline (two), Blue Sky, Lang, Graphique, Cavallini, Sierra Club, The Old Farmer's Almanac and Amy Knapp.
- Hidden: 3624 and 3618 (no offer on import day; show them when they are in stock), 3610 and 3611 (title-only listings), 3607 (its listing gives a start date of 12/31/2027, which would put a wrong date on the page).
- Publisher calendars sold as books (ISBN as the ASIN) often come with no bullets; expect to lose about one in three of them.
- Brand pages: AT-A-GLANCE (17 products), Blue Sky (12) and Mead (7) got the new rows and counts, and House of Doolittle (brand 477, three products) was written and opened. A brand page states its count in three places: `subtitle`, the first sentence of `content`, and the rows of `content_bottom`; change all three together. Closed brand pages of live products redirect to `/brands`.
- `product_apply.py` links a fitting printable for the three calendar categories.

### Month calendar article and the first AI hero (Nov. 16, 2026)
- `/articles/january-calendar` (id 147, type `dates`, slug without the year so the URL is reused each January): a Monday-start grid with ISO weeks, both federal holidays, day counts, the five-or-six-rows answer and six calendars that start in January 2027. It links the main site's `/january-2027-calendar/`; the same pattern fits the other months. `/articles/february-calendar` (id 148) followed the same day with two more pieces: a drawing of the month on both week layouts and a table that prices each calendar by the months it still has ahead on the 1st (a different product set from January; the checker fails two `dates` pages that share over 60% of their products). January also lists eight of the known-brand calendars in a linked table. A product added after the last `fetchall.py` run fails the checker as "not in the catalog": append it to `.cache/shop/audit/products-now.json` or rerun `fetchall.py`.
- Its hero is the first image made with AI chips: `PATCH articles/{id}` with `{"generate_images": ["hero"], "image_source": "ai", "image_quality": "standard"}` (about 20,000 chips, ready in under a minute). There is no prompt field; the platform writes it from the title. The calendar it drew had the right weekdays for every visible date, but that is luck: open every AI picture that shows dates or text and compare it with the real month before leaving it live, and set a stock photo if anything is wrong.

### Price refresh of Nov. 13, 2026
- `article_prices.py` on the 24 articles published Nov. 9 to 11 found real drift in 10: 23 price cells and the figures computed from them (Grabie fineliners $19.99 to $26.99, At-A-Glance $49.99 to $56.08), two products that were no longer below list price, and four products with no offer left (124, 306, 286, 909). The four were disabled and redirected to their category (redirects 866 to 869) and taken out of three articles.
- Titles that carried a count changed: `christmas-gifts-for-planner-lovers` is now 24 picks, `travel-journal-gifts-for-travelers` 8 picks, `planner-gifts-for-college-students` 9 picks. The slug was sent with each PATCH and did not change.
- **Open:** `planner-gifts-for-college-students` lost both dated academic planners and its "at or under 20 dollars" rule (Grabie is above it now). It is true as written but thin: add two in-stock dated academic planners and restore the angle.
- How it was done, for the next refresh: one file per article with the live body and every product's current price, a Sonnet agent per three to four articles that edits only prices, computed figures, counts and removed products and logs each change, then a word-level diff read in the main session before the PATCH. Things the diff caught: a dollar amount written into prose (amounts stay in tables), and "checked" dates moved on tables that hold dates, not prices.
- `CHECK` lines are often not drift: an article that prints only unit costs or no price for a linked product gets them until its prices are recorded (`--record`).

### Hidden categories (crawl of Nov. 13, 2026)

- `tools/crawl.py` found one real fault on 1,906 URLs: 50 product pages linked to six categories that were created hidden on Nov. 9 and never opened, so the links returned 404.
- Logbooks and Record Books (49) had 27 live products and is now open. The other five stay hidden and redirect to a live category: disc-bound planners (38) to planner inserts and refills; self-care journals (45) to fitness and wellness journals; goal and habit journals (46), dream and creative journals (48) and kids and teen journals (63) to guided journals.
- Before you open one of those five, delete its redirect (`GET redirects`, then `DELETE redirects/{id}`); otherwise the category page never shows.
- When product copy links to a category, check that the category is enabled.

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
| `design/` | live custom CSS (fixes plus the design system), the body-top hook, header and footer scripts, customised template texts, photo sources (`images.md`) |
| `ratings/` | method, the list of published ratings, the approved batch |
| `data/` | long-tail targets and filtered Google suggestions |
| `snippets/` | embed boxes for freshcalendars.com pages |
| `ROADMAP.md` | competitor analysis (GadgetSteal) and the plan |

## What the platform does on its own (checked Nov. 21, 2026)

- **Offer prices.** `settings/offers` has `auto_refresh_offers` on at 1,440 minutes, but the background job is paced: of 500 Amazon offers sampled, 36% had `price_checked_at` on the same day and 35% were last checked four days earlier. There is no endpoint that forces a price check. Product pages, product cards and `[product]` shortcodes show the stored price, so they follow this job.
- **Homepage rows.** The `products` block has four modes: `latest`, `trending`, `special_offers` and `custom`. `trending` (section 196) and `special_offers` (section 25) fill themselves, shop-wide; no mode filters by category, so an advent-only deals row stays `custom`.
- **Dates.** Only the `offer-box` block has `show_from` and `show_until`. Other sections, pages, the top bar text and the homepage order have no schedule.
- **Not automatic:** the computed tables in the deal pages (`spec_pages.py refresh`) and in articles (`article_prices.py`), and every seasonal change to the homepage. These need our own run.

## Night batch of Nov. 21, 2026 (from the day's reports)

What the reports showed: 173 ChatGPT visits that day (140 the day before), 83 retailer clicks, two thirds of the week's clicks on advent calendars, a median clicked price of 21 dollars. Search Console (Nov. 12 to 18) had product pages at positions 10 to 12 and the advent hub at position 30.

- **Three advent subcategories** opened under Advent Calendars (65): Stationery (137), Book Lover (138), Candle (139). 21 live products moved in from the general category (their page text links the category, so the link was rewritten with the move). `categories/fill` returned mostly books for "Stationery Advent Calendars"; a Sonnet agent found 89 ASINs on amazon.com instead, 54 imported. 74 new pages went live (`.cache/shop/adv2/`).
- **Fill of 12 categories that get clicks** (fillable, food, crystal, sock, tool and craft advent calendars, family and disc-bound planners, pocket calendars, digital wall calendars, day clocks, sunrise clocks): 292 new, 216 with a full listing, 188 passed, 185 live (`.cache/shop/night/`). Pruned by the editor: a witchcraft set and two Halloween sock calendars.
- **Homepage:** the advent row is now "Most Searched Advent Calendars This Week" (section 192, picked from Search Console and click data; refresh by hand), a row of digital calendars and clocks (216) and a second guides block (217). Category pages of the searched products carry a "Most searched here this week" line (`p.fc-most-searched` in `content_top`).
- **Advent hub:** a table of every kind with its count and lowest, typical and highest price (`div.fc-kind-table` at the top of `content_bottom`; built from the product index, dated; rebuild it when the deal tables are refreshed).
- **36 articles** (ids 189 to 224): ten month pages for March to December 2027 (`type: dates`, dates from `.cache/shop/months/facts.py`, each with seven products of a different kind), 14 clock and digital calendar guides, 8 advent guides, 4 planner and notebook guides, 2 reviews of products with a published score. Not written, because too few products fit: dream journals (4), projection alarm clocks (2), silent wall clocks (2), analog alarm clocks (one maker), Hatch alternatives (no Hatch product). Written but not published: advent calendars for couples (listings without a stated day count, one e-book price).
- **How the night batch was run.** Writers did research, facts and draft themselves from one product index (`.cache/shop/night/index.py` builds `index.json` from the audit file and the day's apply logs; brief `.cache/shop/night/WRITER.md`). The review step is `.cache/shop/night/verify.py`: every dollar figure in a draft is a catalog price or a computed value whose divisor is a number in the listing, the shortcodes equal the product list, no first-hand or health wording.
- **Lessons.** `article_check.py` reads `.cache/shop/audit/products-now.json`; products added the same day are missing from it and every draft that uses them fails ("not in the catalog"). Merge the day's `products.json` files into it, or run `fetchall.py`, before the writers start. Take only USD offers into an index (seven products have a EUR offer first). A full `article_prices.py` run takes over ten minutes and uses the whole rate limit: pass slugs.
- `best-calendar-year-planners` had five stale prices; the table was corrected in place and recorded (`article_prices.py --record`).
- Refresh the price tables of ids 189 to 224 by Dec. 21.
- **Clock brand pages (Nov. 21, 2026, night).** 34 makers with three or more live clocks, timers or digital calendars got a brand page (Skylight, Cozyla, Dragon Touch, Time Timer, La Crosse Technology, Sharp, Lumie, American Lifetime and 26 more): `.cache/shop/night/clockbrands.py`, the advent brand builder with a table of display size and power. Their `/brands/<slug>` redirects were deleted as each page opened.
- **Deal refresh of Nov. 22, 2026.** `fetchall.py` saved the whole catalog file after every product, so a run over 3,700 products slowed to hours; it now saves every 25 products and once at the end (about 70 minutes). After the refresh: `spec_pages.py refresh`, fix the prose of any page it reports as STALE PROSE (counts in `shop/data/spec-pages.json`), set homepage section 215 to the first eight `card_ids` of the advent deal page, rebuild the advent kind table, clear the cache once. Also check `GET store/warnings`: it names homepage products that were switched off, and the rows "Advent Calendars From Brands You Know" (194) and "2027 Planners" (22) lose out-of-stock picks during the season.
