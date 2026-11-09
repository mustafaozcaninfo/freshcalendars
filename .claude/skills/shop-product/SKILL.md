---
name: shop-product
description: Add or rewrite a product page on Fresh Calendars Shop (shop.freshcalendars.com) so it beats every other affiliate page for the same product - title, subtitle, summary, highlights, meta, the details section with a spec table, internal links - and add products without AI chips. Use whenever someone asks to add a product, import products, fix or improve a product page, write product copy, or clean up AI-written product text.
---

# Shop product pages that beat every other affiliate page

Read `shop/README.md` (rules, rate limit) and the products part of `shop/API.md` first. Machine checks: `shop/tools/product_check.py`; every FAIL blocks the write. This skill covers what the checker cannot judge.

The reference page is product 325, Zebra Mildliner 15-pack (`/products/zebra-mildliner-double-ended-highlighters-15-pack`), written Nov. 9, 2026. Its draft, `shop/products/examples/325-zebra-mildliner.json`, is the model for the draft format and the tone.

## 1. Why our page wins

Other shops on the same platform (GadgetSteal, checked Nov. 9, 2026) show the same template with about 180 words of plain prose: no table, no links in the text, nothing a buyer can check. Every one of our pages carries:

1. **A spec table built from the maker listing**: one row per fact, "Not stated" where the listing is silent. A buyer gets the answer in one screen, and Google sees original, structured detail.
2. **Who it suits and who should pick something else**, from listed facts. The "pick something else" paragraph is what earns trust; no other shop writes it.
3. **One reader question answered** (the question people search with the product name: "does X bleed through", "what size is X", "does X fit an A5 planner").
4. **Links that help the next step**: the category, 1-2 shop articles that compare it, one freshcalendars.com printable.
5. **No invented facts.** Every number on the page appears in the listing or in a computation we show. The checker fails any other number.
6. **The maker's own page, read every time.** It often holds a fact the retailer listing leaves out (Zebra's page gave "AP certified non-toxic"). Record it in `maker_source` (URL, or "none found") and `maker_facts`, and cite it in the table caption.

## 1a. Every page is unique (owner rule, Nov. 9, 2026)

At 2,000 products, Google must never see two of our pages as the same page. No text, heading or link pattern repeats from one product to the next. `product_check.py --sync` pulls every product page into a corpus; the check then compares the draft with every other page and every other draft and fails:

| Element | Fails when |
|---|---|
| Body text | over 8% of its 8-word runs appear on another product page. The one shared "how this page was made" line and table captions are left out of the test. |
| `title`, `meta_title`, `link_title`, `subtitle`, `meta_description` | identical to another page's |
| `summary` | over 30% of its 5-word runs appear in another summary |
| H3 headings | any H3 is used on another product page. Put the product line or the deciding spec in each H3 ("Does Mildliner ink show through planner paper?"), never a generic "Who it suits". |
| Links in `content` | the same set as another page, or more than 2 links shared with any other page (the link to the product's own category, `category_slug`, is not counted). Rotate the article that fits this product's question and the printable that fits this product's use. |
| `highlights` | a bullet repeats the summary (over 50% of its 5-word runs). Highlights carry the facts the summary did not have room for. |

How to stay unique without inventing anything:
- **Start from what is particular to this product.** Its listed uses, its own limits and the question buyers ask about this model. Never start from a template sentence.
- **Vary the order and the angle of sections by family and by product.** Planners lead with the date range, notebooks with paper, pens with tips and ink, calendars with size and blocks.
- **Pick the reader question from this product's own gaps or claims.** Bleed-through, size, dates, refills, what fits inside.
- **Pick the link that answers that question.** The article that compares this family on that spec, and the printable that matches the size or the dates.
- **Write sentences for this product.** Two pages in the same family will share facts (A5, 120 gsm); they must not share sentences.
- **Never force a link or a question to pass the check.** A link must help the reader of this product; when no fitting link is left, drop one instead (the floor is the own category, one article and one printable). A question must come from this product's listing, as on product 110, whose listing calls it a gratitude journal.

## 2. Where each field shows on the page (crystal template, checked Nov. 9, 2026)

| Field | Where it shows | Rule |
|---|---|---|
| `title` | H1 | 30-70 chars. Brand or line name first, then the product type, then the one spec that decides it (count, size, dates). Matches the listing. No hype, no year unless the product is dated. |
| `meta_title` | `<title>` and the search result | 30-60 chars. Brand, line, product type, pack or size. |
| `link_title` | product cards, "You might also like" | 10-40 chars. Brand and line, plus pack or size. |
| `subtitle` | H2 under the H1 | 60-160 chars, one sentence: what it is and the job it does. |
| `summary` | "Product Summary", beside the price | 2-3 sentences, 420 chars max: what it is, the deciding specs, the source ("the maker lists"). |
| `highlights` | "Product Highlights" list | 4-7 bullets, 110 chars max, each one fact the summary does not already say (the maker-site fact, the listed uses, the limits), no period at the end. |
| `meta_description` | search snippet | 120-155 chars: brand, product and the key specs, then what only our page has ("spec table", "free printable"). |
| `content` | "Additional Product Details" | 220-650 words, H3s only (the page already has H1 and H2s). Structure in section 3. |
| `author_rating`, `author_verdict`, `author_pros`, `author_cons` | "Our review" | Only through the rating process in `shop/ratings/METHODS.md`, after Jessica Hartwell approves. Never in this routine. |
| `review_score`, `review_quantity` | "More reviews" (generated stars) | Never touch (owner decision). |

## 3. The details section (`content`)

In this order, H3 headings that name the product:

1. **"{Product} specs from the maker listing"**: the table in `<div class="fc-table fc-spec">` (two columns, fits the narrow details column), `<th>` header row, `<caption>Source: {maker}'s listing for model {x}, read {date}.</caption>`. 6-10 rows: count or size first, then the specs a buyer compares in this family (paper weight and pages for notebooks, tip and ink for pens, date range and block size for planners and calendars), then model, then a row for what the listing leaves out.
2. **"Who the {product} suits"**: the uses the listing names, then what the deciding specs mean in use. Link the category here.
3. **"Who should pick a different {family}"**: the listed limits, and what the listing does not state that a buyer may need. Phrase gaps as "the listing does not state", never as a fact that the feature is missing.
4. **One reader question as an H3** with a short factual answer, linking the shop article that compares this family.
5. **A short setup or use tip** only when it adds something, linking a freshcalendars.com printable that fits.
6. **The closing line**: "How this page was made: the facts come from the maker listing, collected by the Fresh Calendars team with AI help and checked before publishing. We do not test products by hand."

## 4. Writing rules

- **Facts only from the listing** (offer `title` and `features`), the maker's own site, or a computation shown on the page. Say so in the sentence: "the maker lists", "the listing states".
- **Maker claims stay maker claims**: "designed to minimize bleed-through", never "does not bleed".
- **Leave out marketing outcomes** even when the listing says them: health, mood, faith, grades, productivity. A listed use ("Bible margins", "lesson planning") is fine; a promised result is not.
- **No prices in text.** The page shows the live price; any number in prose goes stale.
- **No hype or ranking words** (best, perfect, ideal, premium, great, favorite, popular), no banned words from `article_check.py`, no em dashes, no exclamation marks, no first-person endorsement, no testing claims.
- **US English, US units first** (inches, then mm).

## 5. Adding a product without AI chips

Tested Nov. 9, 2026 (`shop/API.md` > Import products):

1. **Find the ASIN** with WebSearch, `allowed_domains: ["amazon.com"]`. Never accept a guessed ASIN. Check the shop does not have it: `GET offers?search=<line name>`.
2. **Create the product hidden**: `POST products` with a working title and `enabled: false`.
3. **Create the offer and link it in the same script**: `POST offers` (merchant `amazon`, `merchant_offer_id` = ASIN, `url_detail` = `https://www.amazon.com/dp/<ASIN>`, `locale` `us`), then at once `POST offers/{id}/products`. An unlinked offer disappears within a second.
4. **Set the category**: `POST products/{id}/categories`.
5. **Read back after about 5 seconds**: the offer now holds price, stock, the full listing title, feature bullets and images. Out of stock or no price: delete the product, do not publish it.
6. **Write the draft** `.cache/shop/products/drafts/<id>.json` (format: `shop/products/examples/325-zebra-mildliner.json`; `listing` is the offer title plus its features, verbatim).
7. **Check**: run `python3 shop/tools/product_check.py --sync` once per batch, then `python3 shop/tools/product_check.py --live <draft>` for each draft; fix every FAIL. Drafts in `.cache/shop/products/drafts/` are compared with each other too, so a batch cannot copy itself.
8. **Write and publish**: back up, then `PATCH products/{id}` with the fields and `enabled: true`, `in_sitemap: true`. Clear the cache.
9. **Check the live page** after 2-4 minutes at 360 and 1440 px with `shop/tools/ui_shot.mjs`: one H1, the table scrolls on phones, the price and buy button show.
10. **Join a brand** when the brand page is enabled. A new brand gets a page only when it has 3 or more live products.

A batch: agents find ASINs (`shop/tools/import_products.py create` imports them hidden; `verify` writes each listing to `.cache/shop/import/listings/`) and draft pages into files with the brief, family guide and link pools in `references/briefs.md`; only the main session calls the API (60 requests a minute, about 5 calls a product).

## 6. Rewriting an existing product page

The old AI copy often holds claims the listing does not make ("premium thick paper", "holds up to daily use"). Rewrite in the same order:
1. back up
2. draft from the listing
3. check
4. `PATCH`

A title change changes the slug, and the platform adds the 301. Change a title only when it is wrong or breaks the rules. Start with the products that get the most visits (`GET products?sort_by=analytics_visits`).
