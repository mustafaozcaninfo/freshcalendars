---
name: shop-article
description: Plan, write, check and publish articles on Fresh Calendars Shop (shop.freshcalendars.com) that rank for long-tail buying searches - best-of lists, X vs Y comparisons, price-band lists, single-product reviews, alternatives, buying guides, how-tos, 2027 date and planning guides, gift guides and spec explainers - toward 2,000 articles over a 2,000-product catalog. Use whenever someone asks for a shop article, guide, comparison, gift guide or batch of shop content, or asks why a shop article does not rank.
---

# Shop articles that win long-tail buying searches

Goal: about 2,000 articles over a catalog of about 2,000 products, each page the most useful answer to one buying question. GadgetSteal, a competitor on the same platform, published 708 templated AI articles in about 11 days. Google's spam policies call that scaled content abuse, and its reviews system rewards "insightful analysis and original research", not "thin content that simply summarizes" (sources: `shop/ROADMAP.md`, Google's reviews-system and spam-policy pages, checked Nov. 9, 2026). We win with fewer, better pages that carry data nobody else computes.

Read `shop/README.md` first: setup, API rules, rate limit. Our SEO playbook is `SEO-HARITASI-TAM.md`; the `news-seo` skill turns it into decisions for /news/, and the same lessons apply here (cited as §NN).

Machine checks: `shop/tools/article_check.py` (every FAIL blocks publishing). This skill covers the decisions the checker cannot make.

## 1. What makes our article better than theirs

Every article must carry at least one of these. They are what we have and the competitor does not:

1. **A comparison table built from the listings**: paper weight (gsm), pages, size in inches and mm, binding, date range, features present. Every cell comes from a quoted listing; an unknown value stays blank.
2. **Computed numbers**: price per 100 pages, months covered by a dated planner, pages per month, weight difference ("twice as heavy as 80 gsm"). Show how each is computed, once.
3. **The Fresh Calendars Score** for products that have one (`shop/ratings/published.json`). Quote it exactly; link `/how-we-rate-products`. Never invent or adjust a score in an article.
4. **Date facts from `packages/engine`**: the weekday of Jan. 1, 2027, federal holidays in 2027, academic-year week counts, ISO week numbers. Compute them; never type them from memory. The checker verifies every "Weekday, Month D, YYYY".
5. **A free printable from freshcalendars.com** that fits the product (an A5 insert for an A5 planner, a yearly calendar for a wall-calendar guide). Link it where the reader needs it.

An article with none of these is not written. Google's own review guidance asks for "quantitative measurements" and an explanation of "what sets something apart from its competitors"; our tables and computed numbers are exactly that (§02 l.464, §04 l.925).

**We do not test products by hand.** Never write "we tested", "I used", "hands-on" or any first-hand claim (the checker fails it). Say where each fact comes from: "the maker lists 120 gsm paper". When a real person on the team owns a product and has photos, that becomes a separate hands-on review, and only that person's words and photos count as experience.

## 2. Is this query a page? (before writing anything)

Run every candidate query through this (§04 l.1056-1084):

1. **Do we own it already?** Search `shop/articles/registry.json` for the query, its cluster and its products. Search Google: if 3 or more of the top 10 results would also answer one of our articles, it is the same intent: **update that article** instead.
2. **Do we have the products?** A best-of needs at least 5 qualifying, enabled, in-stock products in the shop; a price-band list needs 5 within the band; a versus needs both products. Not enough products: add products first (`shop/README.md` > Routines) or drop the query. A list padded with weak matches is a thin page.
3. **Modifier variants are not new pages.** "Best A5 planner for women" and "best A5 planner for moms" share one intent and one product set: one page, with a section for the variant. A variant earns a page only when its product set differs (the checker fails a same-type page that shares over 60% of its products with another) and its intent differs in the search results.
4. **Sub-question with its own facts?** A section (H2) in the article that owns the topic.
5. **One sentence answers it?** One sentence and a link to the page that owns it.

Every new page gets a `cluster` (a short slug for its intent). One article per cluster per type; the checker enforces it.

## 3. Article types

`type` in the draft picks the checker's limits. Full HTML skeletons: `references/templates.md`.

| type | Query shape | Words | Tables | Products | Must contain |
|---|---|---|---|---|---|
| `best` | best {family} [for {audience} / {attribute}] | 1,100-2,600 | 1+ | 5-12 | "How we chose" criteria, comparison table, one pick per need, who should skip each |
| `versus` | {A} vs {B} | 800-1,800 | 1+ | 2-4 | side-by-side spec table, the difference that decides, who each suits |
| `price` | {family} under ${N} | 900-2,200 | 1+ | 5-12 | price table with "price checked <date>", what the money buys at each step |
| `review` | {product} review / is {product} worth it | 700-1,500 | 1+ | 1-4 | the published Score, spec table, listed pros and limits, 2-3 alternatives |
| `alternatives` | {brand/product} alternatives | 900-2,200 | 1+ | 4-10 | what people want from the original (facts only), alternatives by need |
| `guide` | how to choose {family} / {family} sizes | 900-2,400 | 1+ | 3-10 | decision steps, size or spec chart, picks per answer |
| `howto` | how to use / set up {thing} | 700-1,800 | 0+ | 1-6 | numbered steps, a printable, the products the steps need |
| `dates` | 2027 planner dates / academic year 2026-27 | 700-1,800 | 1+ | 2-8 | engine-computed date table, printable, planners that cover the range |
| `gift` | {occasion} gifts for {recipient} [under ${N}] | 900-2,200 | 1+ | 6-14 | gifts grouped by need, price bands, what to check before buying |
| `explainer` | what is {spec} / {spec} explained | 600-1,500 | 1+ | 1-6 | definition first, table of values, how it affects the choice |

## 4. Page anatomy

The platform renders the title as the H1, then the body. The body:

1. **Disclosure first** (FTC): "Fresh Calendars Shop earns a commission when you buy through retailer links on this page, at no extra cost to you." The checker requires it in the first paragraph.
2. **The answer in the first real paragraph** (§08 l.2329). For a best-of: the top pick per main need, by name, with the fact that decides it. For a versus: which one suits whom, and why, in one sentence each. For an explainer: the definition (is-a, then what it means, then the attribute the query asks). Bold the first sentence when it is a definition.
3. **"How we chose"** (best, price, gift, alternatives): 2-4 sentences: the source (maker listings), the criteria, and the link to `/how-we-rate-products`. This is the "how" Google asks pages to show.
4. **The comparison table** early, inside `<div class="fc-table">` (scrolls on phones), with a `<th>` header row. Prices only in a table, with "price checked Nov. 9, 2026" in a caption or right below.
5. **One section per pick or per decision**: an H2 or H3 naming the product or the choice, 2-4 sentences of listed facts and who it suits, then its `[product id="N"]` shortcode. Each pick says who should skip it.
6. **Reader questions as H2s** (§04 l.1100): the questions people type, short, with the entity in them. No H2 copied from another article (the checker fails reuse).
7. **Links where they help** (§04 l.959):
   - 2 or more to freshcalendars.com (a printable, a date page)
   - 1 or more to a shop category or brand page
   - 1 to 3 related shop articles
   - never a raw retailer link; products go in by shortcode
8. **A one-line "how this page was made"** note: the facts come from maker listings, collected by the Fresh Calendars team with AI help and checked before publishing; we do not test by hand. Google asks pages to make the use of automation "self-evident to visitors".
9. **No closing summary**, no "In conclusion", no FAQ schema. FAQ rich results ended May 7, 2026, so visible questions are H2s, not a markup trick.

**Title** (the H1, the `<title>` and og:title, set together by the publisher):
- **Length:** 40-70 characters.
- **Query first, in the searcher's words.**
- **Then one fact that only this page has.** For example "Best A5 Dotted Journals: 6 Picks From 80 to 160 GSM" or "Leuchtturm1917 vs Moleskine: Paper, Pages and Price per Page".
- **No hype.** No year unless the query has one.

**meta_description**:
- **Length:** 120-155 characters.
- **First the query words and the key fact, then what only this page has**, named concretely: "a gsm table for 8 journals", "a free A5 insert printable".

**slug**:
- **Form:** 2-8 words, no year.
- **Why no year:** a yearly topic keeps its URL and its click history, and each year only the title and the facts change.

### Pillar pages (one per cluster, `"pillar": true` in the draft)

A pillar is the page a cluster's other articles link up to. It has no upper word limit and may hold up to 30 products, and the checker asks more of it. The model is `/articles/planner-gifts-for-moms` (rebuilt Nov. 11, 2026: 22 products, 8 tables, one drawing). Build one only for a query whose results are roundups, and only when the shop has 15 or more products that fit.

1. **Read the results first.** Search the query and two close variants, open the five or six pages that rank, and note their sections, their product groups, their tables, their dates and what every one of them leaves out. Then cover each group they cover and add what none has. For moms the gaps were: no prices compared, no sizes, no answer to "is a dated planner still a good gift in May", and pages dated 2022 to 2025.
2. **A picker table before anything else**: "If she ... / Give her ... / Why, from the listing". The searcher gets an answer in one screen.
3. **One master table of every product**, sorted by price, with a cost-per-unit column computed from a unit the listing states (per person, per week, per month, per page). Show the arithmetic once in the note under it.
4. **Budget bands** as a table (count and names per band), and a separate "below its list price" table only for offers whose `price` is lower than `price_full`.
5. **One drawing of our own, as inline `<svg>`** built from listing numbers (sizes to scale, a timeline of months covered). Rules that make it survive the platform and both themes: `fill="none" stroke="currentColor"`, text in a `<g fill="currentColor" stroke="none">`, labels inside the shapes, `role="img"` with an `aria-label` that states the finding, a `viewBox` no wider than 340 so text stays readable on a phone, and `style="width:100%;height:auto;max-width:480px"`. No external image host is needed and nothing is copied from a retailer.
6. **Sections by person or use, each with its own small table** when the group has a number to compare (people per page, months printed).
7. **A date table for seasonal pages**: the occasions with their weekdays, and for dated products the months still unused on each occasion. Compute it; do not estimate.
8. **Three or more question headings** in the words a searcher types ("Dated or undated: which is the safer gift?"), each answered from the listings in one short paragraph.
9. **Pairings table**: two items used together, with the total, so a reader with a budget has a ready answer.
10. **"How we chose, and what we left out"**: name the near-copies and thin listings you dropped and why, and say which entries rest on a title-only listing. A page that admits its gaps is the one a reader trusts.
11. **Links**: 4 or more related shop articles, 3 or more categories, 2 or more freshcalendars.com pages, the method page and `/jessica-hartwell`.
12. **Every claim about a competitor is something you saw** ("several other guides name this planner" after reading them), never "the most popular".

Publishing an existing article again keeps its hero when its registry entry has an `image` value; set `"image": "existing"` before updating an article someone else published.

## 5. Writing rules

- **Facts only from the listing, the maker's site, or our computation.** Write the source into the sentence: "the maker lists", "the listing states". Never guess a size, weight, page count, date range or price.
- **The verb carries the certainty.** "Has 192 pages" only when the listing says so; "is listed as acid-free" for a maker claim we cannot check.
- **"Best" needs its criterion.** "Best for fountain pens: the heaviest paper here, 160 gsm." Google asks for "why you consider it the best". No unsourced superlatives.
- **Every pick gets a limit.** "Worth knowing" comes from the listing: no pen loop, dated pages end in June 2027, paper weight not stated. No limit, no credibility.
- **Prices go stale daily.** Prices may appear only in a dated table. A price band ("under $20") may appear in the title and headings.
- **No banned words, no em dashes, no exclamation marks, no "not X but Y".** The checker's list is in `article_check.py` and merges §02's AI-tell list with our /news/ list.
- **Vary sentence length.** Do not end every section with a three-item list, and do not open two articles the same way (§02 l.605-612).
- **US English, US units first**: inches, then mm. Letter size, Eastern Time.
- **No health, faith or money outcomes.** A "planner for ADHD" page lists features (time blocks, checklists, undated pages); it never says a product helps a condition.
- **No invented people, quotes, reviewers, user counts or "readers love".** Byline is "Jessica Hartwell" (the editor who owns the shop content; owner decision, Nov. 11, 2026). Ratings carry Jessica Hartwell's name only through the approved rating process (`shop/ratings/METHODS.md`).

## 6. Workflow (one batch of 5 to 15 articles)

Low cost, and only the main session calls the API (60 requests a minute, shared):

1. **Pick the batch** from the queue (`references/topic-map.md`): the next clusters by season and demand. Check each with section 2. Refresh the catalog first:
   ```bash
   python3 shop/tools/fetchall.py
   ```
2. **Research** (one Sonnet `general-purpose` agent per 5 queries, prompt in `references/briefs.md`). The agent reads the top 10 Google results for each query and returns:
   - the search intent
   - the format the top results use (list, table, comparison)
   - the questions they answer
   - what every one of them lacks
   - the related searches

   It never invents data.
3. **Facts file** (main session): for each article, write the chosen products' listing text (offer `title`, `features`, the published Score) to `.cache/shop/articles/facts/<slug>.json`, plus computed numbers and engine dates. Writers read only this file.
4. **Write** (one Sonnet agent per 3-5 articles, prompt in `references/briefs.md`). The agent writes `.cache/shop/articles/drafts/<slug>.json` from the template, the research and the facts file, then runs the checker on its drafts:
   ```bash
   python3 shop/tools/article_check.py <draft>
   ```
   It fixes every FAIL.
5. **Review** (main session): read every draft against the facts file.
   - Every number and claim must be in the facts.
   - No con may state as fact something the listing simply does not mention.
   - The first paragraph must answer the query.
6. **Publish** with `python3 shop/tools/article_publish.py <draft>`:
   - It reruns the checker with live stock checks.
   - It creates or updates the article and sets an unused stock image.
   - It records the article in `shop/articles/registry.json`.
   - A future `published_at` schedules it.
7. **Link in.**
   - Add a link to each new article from 1-2 related older articles or the matching category's `content_bottom`.
   - Then run `python3 shop/tools/article_check.py --sync` and `--orphans`. An orphan page is a page Google finds late.
8. **Check live** after 2-4 minutes, at 360 and 1440 px with `shop/tools/ui_shot.mjs`:
   - one H1
   - the table scrolls on phones
   - the shortcodes render products with prices
9. **Commit** `shop/articles/registry.json` with a message naming the batch.

## 7. Velocity and the stop rule (§03)

Publishing frequency is not a ranking factor, and quality bulk publishing is not spam. Speed only becomes a risk when it outruns trust and quality, and the shop is new. A site-wide classifier can pull the whole subdomain down (§03 l.776, l.785).

| Weeks | Pace |
|---|---|
| 1-2 | up to 5 a day |
| 3-6 | up to 10 a day, if the stop rule is quiet |
| later | up to 15 a day, never more than the team can review |

- **Spread batches over the week with `published_at`.** Never drop hundreds of pages at once.
- **Stop rule.** Search Console must be verified first (owner task). If the indexed share of last month's articles falls below about 60%, or impressions per new article fall two weeks in a row: halve the pace and spend the time improving and linking existing articles until they recover.
- **Our project hypotheses** (not Google rules): the ramp, the 60% line and 15 a day.

## 8. Keeping 2,000 articles true

- **Weekly: stock check.** Rerun `article_check.py --live` on every article whose products changed stock. Replace a product that went out of stock in its article within a week.
- **Monthly: price tables.** Refresh them and update "price checked". The registry's `refresh_by` field holds the date.
- **Yearly topics: same URL.** Update the existing article each year: new title year, new dates, new products, same URL.
- **Updates are silent.** Change the facts and republish; no "Updated" banners.
- **Ratings change only through the rating process.** An article quoting a score updates when the score changes.

## 9. Before publishing (main session)

- [ ] The query passed section 2. No registry article owns the query or the cluster, and there are enough qualifying products.
- [ ] At least one advantage from section 1 is in the first screen.
- [ ] Disclosure first, then the answer, then "how we chose"; the table is early and wrapped in `.fc-table`.
- [ ] Every number traces to the facts file or a computation shown on the page. No first-hand claims, no stale prices, no invented scores.
- [ ] Every pick says who it suits and its listed limit. Every "best" names its criterion.
- [ ] Title 40-70 characters, query first plus one fact. Description 120-155 characters. Slug without a year.
- [ ] Links: 2 or more to freshcalendars.com, 1 or more category or brand, 1-3 related articles; 1-2 older articles now link to this one.
- [ ] `article_check.py --live` passes; the live page is checked on a phone width.
