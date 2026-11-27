# Amazon Creators API: what it gives the shop and how we use it

Read from Amazon's documentation on Nov. 27, 2026 (https://affiliate-program.amazon.com/creatorsapi/docs/) and
checked against live calls the same day. The client is `shop/tools/amazon_creators.py`. Credentials stay in
`.cache/shop/amazon-creators.txt`, never in git and never printed.

## Access

- Open since Nov. 27, 2026 (evening). Needs an approved Associates account and 10 qualifying sales in the trailing 30 days.
- Access is lost after 30 days in a row without a qualifying sale and comes back about two days after referred sales ship. The error is `AssociateNotEligible` (403).
- No SDK is needed. Amazon ships SDKs as zip files (Node.js, Python, PHP, Java, version 1.3.0 of Aug. 21, 2026) and also supports plain HTTPS, which our client uses. Nothing was installed.

## How a call works

- Token: `POST https://api.amazon.com/auth/o2/token` (credential version 3.1, North America) with `grant_type=client_credentials`, `scope=creatorsapi::default`. The token lasts one hour; reuse it. The token endpoint has its own 429.
- Calls: `POST https://creatorsapi.amazon/catalog/v1/<operation>` with `Authorization: Bearer <token>`, `x-marketplace: www.amazon.com`, and `marketplace` and `partnerTag` in the JSON body. Field names are lowerCamelCase.
- Our client sends `User-Agent: Agent/FreshCalendarsShopTool`: the Associates policy asks automated agents to name themselves as `Agent/<name>`.

## Limits

| Limit | Value |
|---|---|
| Requests | 1 a second and 8,640 a day for the first 30 days |
| Growth | 1 more request a day for every $0.05 of shipped revenue in the last 30 days; 1 more a second for every $4,320, up to 10 |
| One transaction | one call, whatever it carries (10 ASINs in one `getItems` is one) |
| Search depth | 10 items a page, 10 pages: 100 results a query. `totalResultCount` can say 1,000; only 100 are reachable, so narrow the query instead |
| Over the limit | 429 `ThrottleException`, sometimes with `retryAfterSeconds`; the client waits and retries |

At 8,640 calls a day we can look up 86,400 ASINs or run 8,640 search pages. The limit is not our bottleneck.

## Operations

| Operation | What it does | Client command |
|---|---|---|
| `searchItems` | keyword search with filters | `search "words" [pages] key=value ...` |
| `getItems` | facts for up to 10 ASINs | `items B0... B0...` |
| `getVariations` | the sizes and colors of one listing, with each child ASIN and price | `variations B0... [page]` |
| `getBrowseNodes` | Amazon's category tree: parents and children of a node | `nodes <id> ...` |
| `searchItems` with `searchRefinements` | the departments and brands Amazon suggests for a query | `refine "words" [searchIndex]` |

Search filters (all tested): `searchIndex` (US values include `OfficeProducts`, `HomeAndKitchen`, `ToysAndGames`, `ArtsAndCrafts`, `Baby`, `Beauty`, `Electronics`, `Handmade`, `All`), `brand`, `title`, `browseNodeId`, `minPrice` and `maxPrice` in cents, `minReviewsRating` (1 to 4), `minSavingPercent` (1 to 99), `sortBy` (`Relevance`, `Featured`, `AvgCustomerReviews`, `NewestArrivals`, `Price:LowToHigh`, `Price:HighToLow`), `deliveryFlags` (`Prime`, `FreeShipping`, `FulfilledByAmazon`, `AmazonGlobal`), `availability` (`Available` by default, or `IncludeOutOfStock`), `condition` (`Any`, `New`).

## What comes back (the `flat()` record in the client)

| Field | Source | Use for us |
|---|---|---|
| title, features (the bullets) | `itemInfo.title`, `itemInfo.features` | the facts a product page is written from |
| brand, manufacturer, model, part number | `itemInfo.byLineInfo`, `itemInfo.manufactureInfo` | brand pages; spotting Amazon-native brands |
| size, color, unit count, height, length, width, weight | `itemInfo.productInfo` | spec tables; price per unit |
| EAN, UPC | `itemInfo.externalIds` | matching one product across listings |
| price, list or "was" price, percent off, price per unit | `offersV2.listings.price` | real discounts only; deal pages |
| deal badge, deal start and end, percent claimed | `offersV2.listings.dealDetails` | "Black Friday Deal" with its true end time |
| stock type (`IN_STOCK`, `IN_STOCK_SCARCE`, `OUT_OF_STOCK`, `PREORDER`, ...) | `offersV2.listings.availability` | drop dead listings before they are written |
| seller name, buy box winner | `offersV2.listings.merchantInfo` | sold by Amazon or by a third party |
| sales rank in the top category, and per category | `browseNodeInfo` | a demand signal: lower rank sells more |
| category path | `browseNodeInfo.browseNodes` | filing a product in the right shop category |
| parent ASIN | `parentASIN` | removing near-copies (one parent, many colors) |
| large image URL | `images.primary.large` | never stored; see the rules |
| tagged product link | `detailPageURL` | carries `tag=freshcalendar-20` |

**Not available at all:** customer star ratings, review counts and review text; the count of offers; Prime and free-shipping flags per offer; seller feedback; coupons and promotions. `minReviewsRating` filters by rating without returning it. Only the featured (buy box) offer is returned; no featured offer reads as out of stock.

## Rules that bind us (Associates Program IP License and Participation Requirements, US)

- **24 hours.** Prices, stock and other text from the API may be kept for 24 hours, then must be refreshed. ASINs may be kept for as long as the license lasts. Our `.cache/shop` files are working files, not a price source.
- **Price shown must be fresh or stamped.** A price refreshed less often than hourly needs its date and time next to it and the disclaimer that prices and availability "are accurate as of the date/time indicated and are subject to change". The storefront's price display is the platform's; any price we write ourselves (article tables) already carries a checked date.
- **Images are not stored.** Only the link, for up to 24 hours.
- **Customer reviews and star ratings** may be used only when obtained as a link through the API, and the API has no such resource. The shop's product pages show an "Amazon.com rating" line from the platform. That is an owner decision; it is recorded here as a risk.
- **No model training.** Program content may not be used to develop or improve language or machine learning models. Using listing facts to write a page is not training, and nothing here is fed to training.
- **No resale, no third parties, no data mining.** The data is for our own site, to send shoppers to Amazon.
- **Links go to Amazon only**, with our tag, unaltered, never shortened or cloaked.
- **No price tracking or price alerts** on the site.
- **Agents name themselves** (`Agent/<name>` in the user agent), never hide that they are automated, never solve CAPTCHAs.
- Any breach ends the license at once.

## How we use it (the working method)

1. **Find the kind.** `refine "question words"` shows the departments and brands Amazon files the query under; brands nobody has heard of are the Amazon-native ones a big store does not carry.
2. **Pull candidates with the buyer's details as filters.** A detailed ChatGPT question ("12 inch or larger, medication alarms, under $80") maps to `search` with `maxPrice=8000`, `minReviewsRating=4` and the words in the query. Run three to five phrasings; each gives 100 results at most.
3. **Clean before writing.** Drop `OUT_OF_STOCK`, keep one ASIN per `parent` (or call `variations` and name the sizes on one page), prefer a low sales rank, and note the seller.
4. **Write from facts.** Title, bullets, dimensions, unit count and model go to the writers. The spec table gets real numbers, which is what wins a detailed question.
5. **Keep it true.** A `getItems` pass over every ASIN in the shop costs about 500 calls (some 5,000 products, 10 a call) and finds listings that died or changed price; run it before a deals page and weekly.
6. **Deals without guessing.** `minSavingPercent` with `dealDetails` gives real deals with their end times. No discount is shown that the API did not report.

How the shop's own "fill" search and this API differ: fill searches by the category title and takes what Amazon returns, 50 a run; the API lets us choose by price, rating, brand, category and stock, and returns the facts with the ASIN.
