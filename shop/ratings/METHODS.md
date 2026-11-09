# Fresh Calendars Score: methods

**Method v2 (Nov 9, 2026, owner decision; scoring code in apply_fixes.py):**
- The scale starts at 3.
- Features: 3 + 2 × (features present ÷ the most features any product of that type states).
- Paper: 80 gsm or less = 3, plus 1 per extra 40 gsm, up to 5 at 160 gsm; not counted when unstated.
- Only scores of 4.0 or more are shown.

The v1 rules below still define the feature lists and writing rules; v1 scoring is replaced.

The score comes only from the maker's published listing (the retailer listing title, feature bullets and description). Nothing is tested by hand. Each feature counts only when the listing states it. The score script computes the number; nobody types it in.

## Paper score (used by journal, planner and guided types)

| Listing says | Paper score |
|---|---|
| 80 gsm or less | 2.5 |
| 80 to 120 gsm | 2.5 + (gsm - 80) × 1.5 ÷ 40 |
| 120 gsm | 4.0 |
| 120 to 160 gsm | 4.0 + (gsm - 120) ÷ 40 |
| 160 gsm or more | 5.0 |
| No paper weight stated | 2.5, plus the con "Paper weight is not stated in the listing" |

When the listing gives pounds instead of gsm, convert text weight: lb × 1.48 = gsm (70 lb is about 104 gsm).

## Types, weights and feature lists

The feature part is always 1 + 4 × (features present ÷ number of features in the list). The final score is rounded to one decimal.

### journal (paper 50%, features 50%)

Categories: bullet journals, hardcover, softcover, dotted, graph, numbered pages, refillable and leather journals.

Features (9):
1. numbered pages
2. index or table of contents
3. lay-flat binding (or "opens flat" / thread-bound lay flat)
4. pen loop or pen holder
5. back or inner pocket
6. ribbon marker
7. elastic closure or strap
8. perforated sheets
9. stickers included

### planner (paper 40%, features 60%)

Categories: planners, daily, weekly, monthly, academic, teacher and budget planners.

Features (10):
1. hourly or time-slot schedule
2. monthly calendar pages
3. month tabs
4. back or inner pocket
5. ribbon marker
6. pen loop or pen holder
7. elastic closure
8. stickers included
9. notes pages
10. lay-flat, spiral or twin-wire binding

### guided (paper 30%, features 70%)

Categories: gratitude, five-year, prayer, travel and reading, fitness and wellness journals.

Features (8):
1. daily prompts or guided sections
2. weekly or monthly review pages
3. trackers or logs (habit, mood, goal, reading, workout, food)
4. undated or start any day
5. hardcover
6. ribbon marker
7. how-to or introduction pages
8. extras: any of stickers, pocket, pen loop, lock, gift box

### pens (features only)

Features (8):
1. 10 or more pens in the pack
2. tip of 0.5 mm or finer stated
3. waterproof ink
4. quick-dry or smear-resistant ink
5. acid-free or archival ink
6. listing says it does not bleed through paper
7. refillable
8. case, pouch or storage box included

### supplies (features only)

Categories: stickers, washi tape, stencils and decorative paper.

Features (6):
1. large count, by type:
   - stickers: 500 or more stickers
   - washi tape: 20 or more rolls
   - stencils: 20 or more stencils
   - paper: 24 or more sheets
2. foil or metallic finish
3. storage box, case or tin included
4. assorted sizes or widths
5. acid-free or archival
6. sized for or made for planners and journals (for example A5)

### calendar (features only)

Categories: wall, desk and all calendars.

Features (8):
1. large writing blocks (block size stated, or "large" or "jumbo" blocks)
2. holidays printed
3. pockets
4. ruled or lined blocks
5. hanging hole, stand or protective cover
6. year-at-a-glance or reference calendars
7. thick or heavy paper stated
8. stickers or extra notes pages

## Writing rules for the verdict, pros and cons

- **Facts only from the listing.** No claims about how it feels, performs or lasts. No health, faith or money outcomes. No price; prices change daily.
- **Verdict:** 2 or 3 plain sentences, 420 characters or fewer. What it is, who it suits by its stated features, and the main trade-off.
  - The script appends: " Fresh Calendars Score, worked out from the maker's published details; we did not test it by hand."
- **Pros:** 3 or 4 items, 150 characters or fewer each, each a stated fact.
- **Cons:** 1 to 3 items, 150 characters or fewer each. A con may be:
  - a listed feature it lacks ("No pen loop listed")
  - a stated limit ("Dated pages end in June 2027")
  - "Paper weight is not stated in the listing"
- **Banned words:** perfect, ultimate, best, must-have, premium (unless it is part of a product name), luxury, luxurious, amazing, stunning, elevate, journey, effortless, game-changer, high-quality, top-notch, ideal.
- **No em dashes.** No exclamation marks. US spelling.
