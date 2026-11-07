# Measuring traffic

Three tools, three different questions. Their numbers never match, and that is expected.

| Tool | Answers | Counts | Misses |
|---|---|---|---|
| First-party beacon (`/api/pv`, top of `docs/desk/traffic.md`) | How many real readers, from where, how long, how far down? | One view per news page a browser ran and left, same-origin so ad blockers let it through | Readers with JavaScript off; bots that run JavaScript (few); the calendar site (not added yet) |
| Cloudflare edge analytics (`docs/desk/traffic.md`, daily) | How many pages and printables did readers open, and where from? | Every HTML page and PDF the edge served to a client that does not call itself a bot | Unlabeled bots are counted (the first run, Nov. 7, 2026, showed 94% desktop, so bots inflate the totals); no referrer on this plan; no behaviour inside the page |
| Google Analytics 4 (`G-VT08H0GXHZ`, `apps/news/src/lib/analytics.ts`) | What did readers do on the page (engagement, events)? | Visits whose browser ran gtag.js | Ad-blocked visits, and readers who leave before window load (gtag.js loads after it, on purpose, for page speed) |
| Search Console and Bing Webmaster Tools | How did we do in search results? | Clicks and impressions on the search page | Everything after the click |

So: **the beacon is the traffic number to report**, the Cloudflare edge count an upper bound and a ranking, GA4 a lower bound; search performance from Search Console, behaviour from GA4 and Clarity.

## Cloudflare traffic report

`scripts/news-traffic.mjs` runs in the daily Search Console workflow (`.github/workflows/search-console.yml`) with the read-only `CF_ANALYTICS_TOKEN` already used for "Trending now". It writes `docs/desk/traffic.{md,json}`: views per day (stories, calendar pages, PDFs), top stories, sources (Google, Bing, DuckDuckGo, AI assistants, social, direct), countries and devices. Self-declared bots are filtered out by user agent. Run it by hand with the two variables set: `node scripts/news-traffic.mjs --stdout`.

## Microsoft Clarity

Heatmaps, scroll maps, session recordings, rage and dead clicks: where readers stop, which ads and printables they see, what confuses them. Free, no traffic limit.

- Turn on: set `CLARITY_ID` in `apps/news/src/lib/analytics.ts` to the project id from clarity.microsoft.com (Settings > Overview). It is public, not a secret. It loads with gtag.js after window load, so page speed is unchanged.
- In Clarity, link the Google Analytics property (Settings > Setup > Google Analytics integration) and turn on masking "Balanced" (default).
- **Daily numbers in the repo:** `scripts/news-clarity.mjs` reads the Data Export API (3 of its 10 requests a day: by page, channel and device, last 24 hours) and writes `docs/desk/clarity.{md,json}` in the daily workflow. It needs the GitHub Actions secret `CLARITY_API_TOKEN` (Clarity > Settings > Data Export > Generate new API token, project admin).
- **Consent:** no consent banner exists yet. Without a consent signal Clarity records visitors from the European Economic Area (EEA), the United Kingdom (UK) and Switzerland without cookies, so their sessions are not joined across pages. When a consent banner is added (AdSense requires a Google-certified one for those visitors), pass its answer with `clarity('consentv2', ...)` and Google consent mode.

## First-party beacon

Every /news/ page sets up a tiny script in its inline script (`PV_JS` in `apps/news/src/lib/analytics.ts`): when the reader leaves or hides the tab it sends one `sendBeacon` POST to `/api/pv` with the path, the referrer host, seconds on the page (capped at 30 minutes) and the deepest scroll. The Worker (`pageView` in `cloudflare/worker.js`) drops cross-site posts, bot user agents and malformed bodies, adds the country and device, and writes one data point to the Workers Analytics Engine dataset `fc_pageviews` (binding `PV` in `wrangler.jsonc`). No cookie, no IP, no id. The Privacy Policy (section 2.4) describes it.

- Limits on the Workers Free plan: 100,000 data points written and 10,000 read queries a day, kept three months; each beacon is also one Worker request (100,000 a day on Free). At about 30,000 real views a day there is room; past 70,000 a day, move to Workers Paid or sample.
- Reading: the daily workflow queries the SQL API with `CF_AE_TOKEN`, a token with **Account > Account Analytics > Read** only, and `CLOUDFLARE_ACCOUNT_ID`. Until the owner adds `CF_AE_TOKEN` as a GitHub Actions secret, the report says the beacon section is unavailable.
- Off: `NEWS_PV=0` at build time.

## What the desks do with it

`scripts/news-readers.mjs` runs last in the daily workflow and needs no secret. It writes `docs/desk/readers.md` (fast-leaving pages, Clarity problems, reading per category, reader experiments), `docs/desk/weekly.md` (the owner's one page: this week against the week before) and `docs/desk/clarity-history.json` (one Clarity row a day, since the API only reaches back 3 days). Thresholds are in `RULES` at the top of the script; `docs/DESK.md` "Reader data" says which desk acts on which list: the search desk writes UX briefs (measured with the beacon, 7 days before and after, in `scripts/news-traffic.mjs`), the research desk weighs topics by reading per category, the update desk makes the change, the manager takes code, layout and ads.
