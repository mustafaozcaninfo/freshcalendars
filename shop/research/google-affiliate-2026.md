# Google ranking rules for affiliate product content — official sources only

Research date: 2026-11-09. Sources limited to developers.google.com, Google Search Central blog, status.search.google.com. SEO blogs were not used as evidence.

Note on dates: Most Search Central docs no longer print a visible "Last updated" line on the page body; where a date could not be confirmed on the page it is marked **[date not shown on page]**. Quotes are verbatim and under 25 words each.

---

## 1. "Write high quality reviews" / reviews system guidance

Source A: How To Write Reviews — https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews **[last-updated date not shown on page]**

- Expertise: "Demonstrate that you are knowledgeable about what you are reviewing—show you are an expert."
- Evidence / original photos: "Provide evidence such as visuals, audio, or other links of your own experience with what you are reviewing"
- Quantitative measurements: "Share quantitative measurements about how something measures up in various categories of performance."
- Comparison with competitors: "Explain what sets something apart from its competitors."
- Pros and cons / original research: "Discuss the benefits and drawbacks of something, based on your own original research."
- "Best" justification: "When recommending something as the best overall or the best for a certain purpose, include why you consider it the best"
- Quality over length: focus on "the quality and originality of your reviews, not the length" (page guidance).

Source B: Google Search's Reviews System — https://developers.google.com/search/docs/appearance/reviews-system **[date not shown on page]**

- "aims to better reward high quality reviews, which is content that provides insightful analysis and original research"
- "to ensure that people see reviews that share in-depth research, rather than thin content that simply summarizes" products/services.
- Scope: "evaluate articles, blog posts, pages or similar first-party standalone content written with the purpose of providing a recommendation"
- It does NOT evaluate third-party user reviews posted in a product's review section.

Not confirmed on an official page this session: an explicit instruction to "link to multiple sellers / buying options." This is widely cited but I could not quote it verbatim from the two pages above — **UNCONFIRMED.** (The write-high-quality-reviews page does say to provide "other links of your own experience," not specifically multiple sellers.)

---

## 2. Spam policies relevant to affiliate content

Source: Spam policies for Google web search — https://developers.google.com/search/docs/essentials/spam-policies **[date not shown on page]**

- Scaled content abuse: "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users."
- Applies to AI: the policy applies "no matter how it's created," with the example "Using generative AI tools or other similar tools to generate many pages without adding value for users"
- Site reputation abuse: "third-party content is published on a host site mainly because of that host site's already-established ranking signals"
- Thin affiliate pages: "publishing content with product affiliate links where the product descriptions and reviews are copied directly from the original merchant"
- Doorway abuse: "Doorway abuse is when sites or pages are created to rank for specific, similar search queries."
- Expired domain abuse: "an expired domain name is purchased and repurposed primarily to manipulate search rankings"

On AI generally (from helpful-content guidance, Source in section 3): AI use is not banned; using it "primarily to manipulate search rankings" is a spam-policy violation. Reward of quality is "no matter how content is produced."

Practical read for our shop: affiliate pages that merely restate merchant descriptions = thin affiliate; mass-generated category/product pages without added value = scaled content abuse.

---

## 3. Helpful content / people-first content and E-E-A-T ("Who, How, Why")

Source: Creating helpful, reliable, people-first content — https://developers.google.com/search/docs/fundamentals/creating-helpful-content **[date not shown on page]**

People-first:
- "People-first content means content that's created primarily for people, and not to manipulate search engine rankings."

Self-assessment questions (verbatim):
- "Does the content provide original information, reporting, research, or analysis?"
- "Is this the sort of page you'd want to bookmark, share with a friend, or recommend?"
- "Is the content produced well, or does it appear sloppy or hastily produced?"

E-E-A-T:
- "experience, expertise, authoritativeness, and trustworthiness, or what we call E-E-A-T."
- "Of these aspects, trust is most important."
- "While E-E-A-T itself isn't a specific ranking factor" (it describes qualities Google's systems reward).

Who / bylines / author pages:
- "Is it self-evident to your visitors who authored your content?"
- "Do pages carry a byline, where one might be expected?"
- "We strongly encourage adding accurate authorship information, such as bylines to content where readers might expect it."

How (incl. disclosing AI/automation):
- "It's helpful to readers to know how a piece of content was produced"
- "Are you providing background about how automation or AI-generation was used to create content?"
- "Is the use of automation, including AI-generation, self-evident to visitors through disclosures or in other ways?"

Why:
- "'Why' is perhaps the most important question to answer about your content."
- Content should be made "primarily to help people," not to manipulate rankings.

---

## 4. Structured data for product and review pages

Source A: Product structured data — https://developers.google.com/search/docs/appearance/structured-data/product **[date not shown on page]**
- Two classes: product snippets "For product pages where people can't directly purchase the product." Merchant listings: "For pages where customers can purchase products from you."
- "there is some overlap between the two product features."
- Editorial reviews: "This markup has more options for specifying review information, like pros and cons on an editorial product review page."
- Variants: "Both product snippets and merchant listings support product variants."

Source B: Review snippet — https://developers.google.com/search/docs/appearance/structured-data/review-snippet **[date not shown on page]**
- Self-serving prohibited: reviews controlled by the entity being reviewed "are ineligible for star review feature."
- Self-serving defined: "a review about entity A is placed on the website of entity A, either directly in their structured data or through an embedded third-party widget"
- "Ratings must be sourced directly from users."
- "Don't rely on human editors to create, curate, or compile ratings information for local businesses."
- "Don't aggregate reviews or ratings from other websites."
- Aggregate: "At least one of `ratingCount` or `reviewCount` is required." Must be "about a specific item, not about a category or a list of items."
- Editorial reviews (pros/cons) are allowed via Product markup (see Source A), unlike self-serving star reviews.

Source C: Product variants — https://developers.google.com/search/docs/appearance/structured-data/product-variants **[date not shown on page]**
- Use `ProductGroup` with `variesBy`, `hasVariant`, `productGroupID`.
- "the full `ProductGroup` definition needs to be repeated on each of the variant pages."
- "there must be only one distinct canonical URL for the overall `ProductGroup` that all variants belong to."

Source D: Search gallery of rich results — https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Currently listed/supported include: Article, Breadcrumb, Carousel, Product, Review snippet, Organization, Video, Event, Discussion forum, Q&A, Recipe, and others.
- ItemList is used to build Carousel rich results (combined with Recipe, Course, Restaurant, or Movie types).
- FAQ and HowTo are NOT in the supported list.

Deprecations (Source E: changelog on the FAQ structured-data doc) — https://developers.google.com/search/docs/appearance/structured-data/faqpage
- FAQ: "This feature will no longer appear in Google Search starting May 7, 2026." Deprecation notice added May 8, 2026; documentation removed June 15, 2026.
- HowTo rich result: deprecated (removed from Search earlier; **exact deprecation date not re-confirmed on an official page this session — UNCONFIRMED here, but HowTo is absent from the supported gallery**).
- Still supported in 2026: Product, Merchant listing, Review snippet (editorial), Article, ItemList/Carousel, Breadcrumb, Organization.

---

## 5. Core and spam updates, 2025–2026

Source: Google Search Status / ranking updates history — https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history (redirected from developers.google.com/search/updates/ranking). Dates = start date + duration as shown; page shows no explicit end dates.

2026:
- September 2026 spam update — started 24 Sep 2026 (13 days 16 hours)
- August 2026 spam update — started 18 Aug 2026 (2 days 16 hours)
- June 2026 spam update — started 24 Jun 2026 (2 days 1 hour)
- May 2026 core update — started 21 May 2026 (11 days 21 hours)
- March 2026 core update — started 27 Mar 2026 (12 days 4 hours)
- March 2026 spam update — started 24 Mar 2026 (19h 30m)
- February 2026 Discover update — started 5 Feb 2026 (21 days 17 hours)

2025:
- December 2025 core update — started 11 Dec 2025 (18 days 2 hours)
- August 2025 spam update — started 26 Aug 2025 (26 days 15 hours)
- June 2025 core update — started 30 Jun 2025 (16 days 18 hours)
- March 2025 core update — started 13 Mar 2025 (13 days 21 hours)

Note: The status history page lists NO standalone "reviews/product reviews" update and NO standalone "site reputation abuse" update for 2025–2026. Reviews are now a continuous/core system (not rolled as discrete updates), and spam policies (incl. site reputation abuse) are enforced through the spam updates above plus manual actions. Relevance to us: core and spam updates both touch affiliate/review sites; the frequent spam updates target scaled content and thin affiliate pages.

---

## 6. Product variants, faceted navigation, near-duplicate pages (for a ~2,000-product catalog)

Source A: Faceted navigation — https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation **[date not shown on page]**
- Risk: URL-parameter facets "can generate infinite URL spaces which harms the website"
- Crawl waste: "crawling faceted URLs tends to cost sites large amounts of computing resources due to the sheer amount of URLs"
- "if crawling is spent on useless URLs, the crawlers have less time to spend on new, useful URLs"
- robots.txt: "Use robots.txt to disallow crawling of faceted navigation URLs." Then "allow crawling of just the individual items' pages along with a dedicated listing page."
- canonical: use rel="canonical" "to specify which URL is the canonical version of a faceted navigation URL"
- nofollow: "every anchor pointing to a specific URL must have the `rel=\"nofollow\"` attribute in order for it to be effective"
- Return 404 for a URL that "contains duplicate filters or otherwise nonsensical filter combinations."

Source B: Product variants (same as 4C) — one canonical URL per ProductGroup; repeat full markup on each variant page.

Takeaway for the catalog: pick one canonical per product/variant group; block or canonicalize facet/sort/filter URLs; avoid near-duplicate pages that only differ by a parameter. Google consolidates duplicates via canonicalization (general guidance: Consolidate duplicate URLs doc).

---

## 7. AI Overviews / AI Mode — how pages get cited

Source: Google Search's AI features and your website — https://developers.google.com/search/docs/appearance/ai-features **[date not shown on page]**
- Eligibility: "a page must be indexed and eligible to be shown in Google Search with a snippet"
- "There are no additional technical requirements."
- No special markup: "There's also no special schema.org structured data that you need to add."
- "no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary."
- Same SEO applies: "The best practices for SEO remain relevant for AI features in Google Search"
- Links: AI features "surface relevant links to help people find the information they're looking for quickly and reliably" and aim to "display a wider and more diverse set of helpful links"
- Site checklist: "Ensuring that crawling is allowed in robots.txt, and by any CDN or hosting infrastructure" and "Making sure that important content is available in textual form"

Takeaway: to be cited in AI Overviews/AI Mode, be indexable, snippet-eligible, crawlable (don't block Google's crawlers), and keep key facts in plain text. No schema trick exists for it.

---

## Items marked UNCONFIRMED on an official page this session
- "Link to multiple sellers / buying options" as explicit reviews guidance — not quotable from the two reviews pages read.
- HowTo rich result exact deprecation date — HowTo is absent from the supported gallery, but the deprecation date was not re-confirmed on an official page here.
- Visible "Last updated" dates — most Search Central doc bodies did not print one; the FAQ changelog's most recent dated entry seen was Nov 9, 2026.
