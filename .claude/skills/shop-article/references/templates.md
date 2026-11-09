# Shop article templates

These are skeletons, not text to copy. Every H2 is written fresh for its article; the checker fails an H2 reused from another article. Fill each slot from the facts file only. `{...}` marks a slot.

The disclosure line is the same everywhere, and it is the only fixed sentence:

```html
<p>Fresh Calendars Shop earns a commission when you buy through retailer links on this page, at no extra cost to you.</p>
```

## Table rules (all types)

```html
<div class="fc-table"><table>
<thead><tr><th>{Product}</th><th>{Size}</th><th>{Paper}</th><th>{Pages}</th><th>{Feature that decides}</th></tr></thead>
<tbody>
<tr><td>{short name}</td><td>A5 (5.8 x 8.3 in)</td><td>120 gsm</td><td>160</td><td>{fact}</td></tr>
</tbody>
<caption>{Source: maker listings. Price checked Nov. 9, 2026.}</caption>
</table></div>
```

- **Header and source:** every table has a `<th>` header row and a caption that names the source. A price column also needs "Price checked <date>".
- **Missing values:** a blank cell, never a guess. "Not stated" is fine.
- **Column order:** the column that decides the query comes first after the name. "For fountain pens" means paper weight; "for travel" means size and weight.
- **Width:** keep it to 4 to 6 columns. A wider table splits into two.

## best: "best {family} for {need}"

```html
<p>{disclosure}</p>
<p><strong>{The pick for the main need, by name, and the listed fact that decides it.}</strong> {Second need and its pick.} {Third need and its pick, or the budget pick.}</p>
<h2>{How we picked these {family}}</h2>
<p>{Source: maker listings for {n} {family} in the shop. Criteria in the order they matter for this query. Link to /how-we-rate-products when Scores appear.}</p>
<div class="fc-table">{comparison table, one row per product}</div>
<h2>{Pick 1 named by its use: "For fountain pens: VIVID SCRIBBLES A5, 160 gsm"}</h2>
<p>{2-4 sentences: listed facts that make it fit this need; Score if published.}</p>
<p>{Who should skip it: the listed limit.}</p>
[product id="{id}"]
<h2>{Pick 2 named by its use}</h2> ... (5 to 12 picks)
<h2>{A reader question the research found, for example "Is 100 gsm enough for gel pens?"}</h2>
<p>{Answer from listings or computation, with a link to a printable or category where it helps.}</p>
<p>{How this page was made: maker listings, collected by the Fresh Calendars team with AI help, checked before publishing; we do not test by hand.}</p>
```

## versus: "{A} vs {B}"

```html
<p>{disclosure}</p>
<p><strong>{A} suits {who, because listed fact}; {B} suits {who, because listed fact}.</strong> {The single difference that decides most buyers, with numbers.}</p>
<div class="fc-table">{spec table: rows = attributes, columns = A and B; include a computed row such as price per 100 pages}</div>
<h2>{The deciding difference, for example "Paper: 80 gsm against 120 gsm"}</h2>
<p>{What the numbers mean in use, from listings.}</p>
<h2>{Second difference: size, binding, layout or dates}</h2>
<h2>{Where they match, so the reader can ignore it}</h2>
<h2>Choose {A} if... / Choose {B} if...</h2>
[product id="{A}"] [product id="{B}"]
<p>{A third option when both miss a common need, if the shop has one.}</p>
<p>{how-this-page-was-made line}</p>
```

## price: "{family} under ${N}"

The band is a real filter. Every product's current USD price is at or under N on the day checked; the checker's `--live` mode confirms stock.

```html
<p>{disclosure}</p>
<p><strong>{How many} {family} in the shop are under ${N} on {date}; {the pick per need, named}.</strong></p>
<div class="fc-table">{name | price | price per 100 pages or per month | the deciding spec}; caption: "Prices checked {date}; they change daily."</div>
<h2>{What the extra few dollars buy, for example "From $8 to $15: thicker paper and a pen loop"}</h2>
<h2>{Pick by need}</h2> [product id] ...
<h2>{What you give up under ${N}}</h2>
```

## review: "{product} review" / "is {product} worth it"

Only for products with a published Score of 4.0 or more. The Score is quoted exactly, never re-scored.

```html
<p>{disclosure}</p>
<p><strong>{Product} scores {x.x} on the Fresh Calendars Score: {the two listed facts that drive it}.</strong> {Who it suits; who should look elsewhere.}</p>
<div class="fc-table">{spec table with the Score's inputs: paper, features present out of the list}</div>
<h2>{What the listing promises and what it leaves out}</h2>
<h2>{How it compares on price per page or per month}</h2>
<h2>{Alternatives for the buyers it does not suit}</h2> [product id] x2-3
<p>{Score method link; how-this-page-was-made line}</p>
```

## alternatives: "{original} alternatives"

Describe the original only with facts its maker publishes. The original need not be in the shop. Never belittle it, never claim "better" without a listed number.

```html
<p>{disclosure}</p>
<p><strong>{What buyers usually want from {original}: listed traits.} {The alternative per trait, named.}</strong></p>
<div class="fc-table">{original's published specs next to each alternative's}</div>
<h2>{Alternative for trait 1}</h2> ... [product id]
<h2>{When the original is still the right buy}</h2>
```

## guide / howto / explainer

- **guide:**
  - opens with the decision in one sentence
  - takes the reader through 3-5 decisions (an H2 each, with a small table where values compare)
  - ends with the picks per answer
- **howto:**
  - numbered steps with the time each takes
  - the printable that saves a step (linked at that step)
  - the products the steps need, by shortcode
- **explainer:**
  - opens with a bold definition (is-a, then what it means, then the attribute)
  - a table of real values from the shop's listings
  - how the value changes the buying choice

## dates: "2027 planner dates", "academic year 2026-27 calendar"

Compute every date with `packages/engine` (or Python's `datetime` for weekdays) and keep the computation note in the facts file. The checker verifies weekday-date pairs.

```html
<p>{disclosure}</p>
<p><strong>{The date fact the query asks: "Jan. 1, 2027 falls on a Friday; 2027 has 52 weeks and no leap day."}</strong> {What that means for choosing a planner.}</p>
<div class="fc-table">{date table: holidays, week starts, academic terms}</div>
<h2>{Planners that start on the right date}</h2> [product id] ...
<h2>{The free printable for the same range}</h2> {link to freshcalendars.com page}
```

## gift: "{occasion} gifts for {recipient}"

Group by need or budget, never a long flat list. Every gift says who it suits and its price band, but no price in prose.

```html
<p>{disclosure}</p>
<p><strong>{The safest gift and why (listed facts)}; {the budget gift}; {the personal gift}.</strong></p>
<div class="fc-table">{gift | price band | who it suits | the deciding fact}</div>
<h2>{Group 1: under $15}</h2> [product id] ...
<h2>{What to check before buying, for example size of their current planner}</h2>
```
