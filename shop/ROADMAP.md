# Shop roadmap

## Summary

GadgetSteal, a competitor on the same platform, does not list only deals: half its products are full price. It chases traffic with 708 templated AI articles published over about 11 days under one invented author. We can beat it with fewer, data-backed pages and with traffic from freshcalendars.com. Order of work: seasonal pages now, then 2,000 products, then weekly articles, alongside links from the main site.

## Competitor: gadgetsteal.com (checked Nov. 9, 2026)

**What the site has**

| Item | Finding |
|---|---|
| Site | Same platform and template as ours; live since late October 2026 |
| Catalog | 1,403 products, 708 articles, 84 categories with long keyword slugs, 8 brand pages |
| Pricing | Not deals only: in a random sample of 60 products, 30 were discounted, mostly 5% to 20% |
| Deal UI | Discounted products show a "58 % under RRP" badge; 4 of 60 showed a "Why it's a deal" box |
| Own rating | 19 of the 60 sampled products |

Our template (v3.1.1) shows neither the RRP badge nor the deal box. Ask FreshStore whether a newer version or a setting adds them.

**How it chases traffic** (articles counted by slug pattern)

| Pattern | Articles |
|---|---|
| "best X for Y" | 125 |
| "X vs Y" | 77 |
| "X under $100" | 73 |
| "is X worth it" | 19 |
| fix-it and how-to guides | the rest |

Most of the 708 were published in a few days.

**Weak points**
- **Templated articles.** Every article sampled has the same outline: three H2s, Pros, Cons, "Which one should you buy". Each has 2 to 4 products, no comparison tables and no original data. Google treats this as scaled content abuse.
- **An invented author.** One person ("Milan Runolfsson") signs all 708 articles and every rating.
- **Generated site stars** on a site that sells nothing.
- **Careless titles,** some lower-case.

## Our plan

### 1. Seasonal pages (Nov. 10 to Dec. 15)

Our niche peaks now: 2027 planners and calendars sell from December to January, Black Friday is Nov. 27 and Cyber Monday is Nov. 30.

Make one page like `/veterans-day-gifts` for each of these:
- Black Friday planner deals
- Christmas gifts for planner lovers
- 2027 planners by size
- New Year journals

Link each one from the matching freshcalendars.com page: `/when-is/black-friday/`, `/when-is/christmas-day/` and the printable calendar pages. That traffic is something the competitor does not have.

### 2. Catalog to 2,000 products

**Steps**
1. Before a fill, turn off "publish new products immediately".
2. Run `POST categories/fill` (Amazon, US, up to 50 per category) so new products arrive hidden.
3. Enable only in-stock products, discounted ones first.
4. Grow from 30 to about 45 categories, following the long-tail targets (2027 planner A5, for women, for teachers and so on).

**Before you start**
- Check the AI chip balance: about 1,800 chips a product.
- A deal ends within days. Pick products while they are discounted, but do not remove them when the discount ends; the Special Offers page shows current deals on its own.

### 3. Articles: their patterns, our data (10 to 15 a week)

| Type | What ours adds |
|---|---|
| "Best X for Y" | 6 to 10 products, a Fresh Calendars Score table, a link to the method page |
| "X vs Y" | a side-by-side spec table built from our feature data |
| "Under $N" | a price table with the date checked, refreshed weekly |
| 2027 planning guides | dates computed by `packages/engine` (weekdays, holidays) and a free printable |

Articles and ratings are signed by Jessica Hartwell (articles since Nov. 11, 2026), and only after she approves them.

### 4. Authority and links (ongoing)

- **Internal links:** link from relevant freshcalendars.com pages and daily /news/ stories to shop pages. Add a matching product link below the printable PDFs.
- **Deals page:** a "planner deals today" page, with the date each price was checked.
- **Measurement:** set up Search Console and Bing (the owner provides the codes), then track which pages earn clicks.
