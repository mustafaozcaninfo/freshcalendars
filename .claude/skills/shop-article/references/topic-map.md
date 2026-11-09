# Topic map: the road to 2,000 articles

## How to read this file

The map grows with the catalog. A cluster becomes an article only when the shop has the products it needs (`SKILL.md` section 2). Counts below are ceilings, not quotas: drop a cluster that has no distinct intent. Our ranking playbook (§04) calls the commercial pages the **core** and the supporting informational pages the **outer** section. Outer pages link into core pages, and core pages link to category and product pages.

## Entities (product families, from the shop's categories)

| Group | Families |
|---|---|
| Planners | daily, weekly, monthly, academic, teacher, budget, undated, hourly, 2027 dated |
| Journals | dotted (bullet), graph, lined, hardcover, softcover, numbered pages, refillable and leather, A5, B5, pocket |
| Guided journals | gratitude, five-year and line-a-day, prayer, travel, reading, fitness and food, self-care, dream |
| Calendars | wall (large, mini, 2-year, academic, dry erase), desk (pad, standing, mini) |
| Supplies | gel pens, fineliners, highlighters, planner stickers, washi tape, stencils, scrapbook paper |
| Military and patriotic | memory journals, flag notebooks, patriotic supplies |

## Modifiers that can change the intent (each must pass the overlap test)

- **Audience:** students, college, teachers, nurses, moms, men, women, kids, teens, beginners, work, small business, seniors.
- **Attribute:**
  - size: A5, B5, letter, pocket
  - binding: hardcover, spiral, refillable
  - paper: thick paper (gsm)
  - layout: undated, hourly, vertical, horizontal
  - dates: 2027, July 2026 to June 2027
- **Use:**
  - pens: fountain pens, gel pens, markers
  - setting: travel, desk, wall
  - planning: time blocking, habit tracking, meal planning, budgeting
- **Budget:** under $10, $15, $20, $30, $50.
- **Brand:**
  - brands in the shop: LEUCHTTURM1917, Clever Fox, Blue Sky, AT-A-GLANCE, ZICOTO, RETTACY, Day Designer, Bloom, Lamare, Mr. Pen, Pilot
  - well-known brands we write alternatives for: Moleskine, Hobonichi, Erin Condren, Passion Planner, Happy Planner, Panda Planner, Rocketbook

## Ceilings by type (at about 2,000 products)

| Type | Pattern | Ceiling | Notes |
|---|---|---|---|
| best | family x (audience or attribute or use) | 450 | needs 5 qualifying products each |
| versus | brand vs brand, format vs format (A5 vs B5, dotted vs grid, hardcover vs softcover, daily vs weekly, dated vs undated, spiral vs bound), product vs product | 250 | product vs product only for popular pairs found in research |
| price | family x budget | 150 | 5 products in the band on the day checked |
| review | products with a Score of 4.0+ | 350 | grows as ratings are approved |
| alternatives | well-known brand or product | 60 | facts about the original from its maker only |
| guide | how to choose, sizes, layouts | 120 | outer section; links into best pages |
| howto | set up, use, track, plan | 250 | outer; each with a printable |
| dates | yearly planning pages: 2027, academic 2026-27, holidays, week numbers | 120 | one URL per topic, updated yearly |
| gift | occasion x recipient x budget | 150 | seasonal; publish 3-6 weeks before the date |
| explainer | gsm, paper types, binding, sizes, terms | 100 | outer; definitions with tables |
| **Total ceiling** | | **about 2,000** | |

## Season calendar (publish 3 to 6 weeks before searches peak)

| When | Push |
|---|---|
| Nov 10 - Dec 15 | Black Friday (Nov. 27, 2026), Cyber Monday (Nov. 30), Christmas gifts for planners and journalers, 2027 planners and calendars, New Year journals |
| Dec 15 - Jan 31 | 2027 planner setup, goal and habit journals, budget planners, wall and desk calendars |
| Feb - Mar | Valentine's journals, spring planner refresh, tax and budget planners |
| Apr - May | Teacher Appreciation Week (early May), Mother's Day gifts, graduation journals |
| Jun - Aug | academic planners 2027-28, back to school, teacher planners, student planners |
| Sep - Oct | mid-year planner switch, Halloween stickers and washi, early holiday gift guides |

## Queue format (`shop/articles/queue.json`, kept by the main session)

```json
[{"cluster": "a5-dotted-thick-paper", "type": "best", "primary_query": "best a5 dotted journal for fountain pens",
  "support_queries": ["thick paper dotted journal", "160gsm dotted journal"], "season": "evergreen",
  "products_ready": 6, "status": "queued", "publish_after": "2026-11-12"}]
```

**Status flow:** queued, then researched, drafted, checked, scheduled, published, and later refresh.

**Rules:**
- **Candidates:** a cluster joins the queue with its `products_ready` count from the catalog.
- **Duplicates:** the main session drops any candidate whose top-10 results overlap an existing article's by 3 or more URLs.

## Internal link shape

- **Core pages (best, price, versus, review):**
  - link to their category or brand page
  - link to 1-2 sibling core pages ("best A5 dotted journals" links "Leuchtturm vs Moleskine")
  - link to one outer page that explains a spec
- **Outer pages (guide, howto, explainer, dates):**
  - link to 1-3 core pages where a reader is ready to buy
  - link to 2 or more freshcalendars.com printables or date pages
- **Category pages:** each category's `content_bottom` lists its 3-6 strongest articles. Update it when a stronger one is published.
- **No page is an orphan:** `article_check.py --orphans` after every batch.
