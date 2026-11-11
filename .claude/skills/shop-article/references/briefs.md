# Agent briefs and file formats

Agents never call the shop API. They read and write files in `.cache/shop/articles/`; the main session reads the API and publishes.

## Research agent (Sonnet, general-purpose, up to 5 queries)

```text
For each query in <file>, search Google (WebSearch) and read the top results that are articles
(skip retailer product pages). For each query write to .cache/shop/articles/research/<cluster>.json:
{"query", "intent": "commercial|informational|mixed", "format_top_results": "list|table|comparison|guide",
 "questions_answered": [...], "what_all_top_results_lack": [...], "related_searches": [...],
 "top_urls": [up to 10], "notes"}
Facts about products come only from makers' own pages or listings; quote them with the URL.
Do not copy sentences from competitor articles. Do not invent numbers. Mark anything unconfirmed.
```

## Facts file (main session writes, `.cache/shop/articles/facts/<slug>.json`)

```json
{"slug": "best-a5-dotted-journals-fountain-pens", "type": "best",
 "primary_query": "best a5 dotted journal for fountain pens", "checked": "2026-11-09",
 "products": [{"id": 214, "name": "VIVID SCRIBBLES A5 Dot Grid Journal", "category": "hardcover-bullet-journals",
   "listing": "<offer title + feature bullets verbatim>", "price_usd": 29.99, "score": 4.9,
   "computed": {"price_per_100_pages": 15.0}}],
 "dates": [{"fact": "Jan. 1, 2027 is a Friday", "how": "datetime.date(2027,1,1).strftime('%A')"}],
 "printables": [{"url": "https://freshcalendars.com/monthly-calendars/", "fits": "monthly spreads"}],
 "related_articles": ["dotted-journal-paper-weight"], "categories": ["/categories/dotted-paper-journals"]}
```

Build `listing` from `.cache/shop/audit/products-now.json` (offers' `title` and `features`). The checker compares nothing against it, so the review step (SKILL.md section 6, step 5) must.

## Writer agent (Sonnet, general-purpose, 3 to 5 articles)

```text
Read .claude/skills/shop-article/SKILL.md and references/templates.md first; their rules are binding.
For each slug in <list>: read research/<cluster>.json and facts/<slug>.json. Write
.cache/shop/articles/drafts/<slug>.json (format below). Every fact, number and claim must come
from the facts file or a computation you show; quote the listing's own numbers. Never write that
anyone tested, used or tried a product. No prices outside a dated table. Write fresh H2s that name
this article's subject. Answer the query in the first paragraph after the disclosure.
Then run: python3 shop/tools/article_check.py .cache/shop/articles/drafts/<slug>.json
and fix every FAIL. Do not call the shop API and do not publish. Reply with the PASS/FAIL list.
```

## Draft format (`.cache/shop/articles/drafts/<slug>.json`)

```json
{"slug": "best-a5-dotted-journals-fountain-pens",
 "title": "Best A5 Dotted Journals for Fountain Pens: 6 Picks by Paper Weight",
 "meta_description": "...120-155 characters...",
 "type": "best", "primary_query": "best a5 dotted journal for fountain pens", "cluster": "a5-dotted-thick-paper",
 "products": [214, 252, 250, 40, 149, 44],
 "content": "<p>Fresh Calendars Shop earns a commission ...</p> ...",
 "author": "Jessica Hartwell", "article_category": "journaling-basics-and-supplies",
 "product_category_id": 9, "related": ["dotted-journal-paper-weight"],
 "image_query": "fountain pen journal", "keywords": ["thick paper dotted journal"],
 "published_at": "2026-11-12T09:00:00-05:00", "price_checked": "2026-11-09", "refresh_by": "2026-12-09"}
```

`article_category` is one of the slugs in `article_publish.py` (`ARTICLE_CATEGORIES`). Add a new article category through the API and the map there before using it. `product_category_id` sets the sidebar products, so use the article's main shop category.
