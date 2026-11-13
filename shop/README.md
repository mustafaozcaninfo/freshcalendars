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
- **Product page columns:** the footer script makes the shorter of the two columns sticky on desktop, so neither side leaves a blank column.
- **Breadcrumb:** one line with chevron separators on desktop; on phones only the parent level, as a back link. The footer script marks the last crumb `aria-current="page"`.
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

### Articles
- Rules, types and the pillar-page pattern are in the `shop-article` skill. `tools/article_check.py` enforces them and `tools/article_publish.py` publishes or updates.
- Run `python3 shop/tools/article_check.py --sync` before a batch: it pulls every live and scheduled article into the registry, which the overlap checks need.
- The model pillar page is `/articles/planner-gifts-for-moms` (Nov. 11, 2026). Inline `<svg>` in article content is kept by the platform.
- The editor page is `/jessica-hartwell` (page id 18); About and the method page link to it.

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
- The Amazon US tag is empty in settings; links use the platform default tag `fl-api-72849163-20`. The owner must set `offers_amazon_us_tag` in the admin.

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
