"""Spec pages: long-tail list pages built from listing data ("A5 dotted journals with 160 gsm paper").

Each page is an intersection of stated specs that no category covers, with a computed table. Rules that keep
them from being doorway pages: 8 or more live, priced, in-stock products; no page whose product set overlaps
another's by more than 60%; every table value is read from the listing; prose is written per page.

  python3 shop/tools/fetchall.py                 # fresh catalog first (delete .cache/shop/audit/products-*.json)
  python3 shop/tools/spec_pages.py build         # data for every definition -> .cache/shop/spec/<slug>.json, prints counts
  python3 shop/tools/spec_pages.py publish <slug>|all   # create or update the page (needs prose in shop/data/spec-pages.json)
  python3 shop/tools/spec_pages.py refresh       # rebuild tables and product blocks of every published page (prices, stock)
"""
import datetime as dt, html, json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import ROOT, WORK, call  # noqa: E402

CATALOG = WORK / 'audit' / 'products-now.json'
REG = ROOT / 'shop' / 'data' / 'spec-pages.json'       # slug -> {page_id, sections, prose}
OUT = WORK / 'spec'; OUT.mkdir(exist_ok=True)
SIZE = {'a5': 'A5', 'a6': 'A6', 'a4': 'A4', 'b5': 'B5', 'b6': 'B6', 'letter': '8.5 x 11 in', 'pocket': 'Pocket'}


def spec(p):
    """Comparable facts from one product's listing. A value is set only when the listing states it."""
    o = [x for x in p.get('offers') or [] if x.get('enabled')]
    if not o: return None
    o = o[0]; T = o['title']; L = T + '\n' + '\n'.join(o.get('features') or []); l = L.lower(); t = T.lower()
    s = {'id': p['id'], 'slug': p['slug'], 'title': p['title'], 'link': p.get('link_title') or p['title'], 'cats': [c['slug'] for c in p.get('categories') or []],
         'rating': p.get('author_rating'), 'price': float(o['price']) if o.get('price') else None,
         'full': float(o['price_full']) if o.get('price_full') else None, 'stock': o.get('stock_available'), 'checked': (o.get('price_checked_at') or '')[:10], 't': t, 'l': l}
    def num(rx, lo, hi):
        for src in (t, l):
            m = re.search(rx, src)
            if m and lo <= int(m.group(1)) <= hi: return int(m.group(1))
    s['gsm'] = num(r'(\d{2,3})\s?(?:gsm|g/m2|g/m²|g/㎡|g/sm)', 50, 400)
    s['pages'] = num(r'(\d{2,4})\s*(?:numbered |lined |dotted |thick |blank |ruled )?pages', 20, 1500)
    s['size'] = next((k for k, rx in {'a5': r'\ba5\b', 'a6': r'\ba6\b', 'a4': r'\ba4\b', 'b5': r'\bb5\b', 'b6': r'\bb6\b', 'letter': r'8\.5\s?["”″\'’]*\s?[x×]\s?11', 'pocket': r'\bpocket[- ]size|3\.5\s?["”″]?\s?x\s?5\.5'}.items() if re.search(rx, l)), None)
    s['ruling'] = next((k for k, rx in {'dotted': r'dotted|dot grid|dot-grid', 'graph': r'graph|quad ruled|squared', 'lined': r'\blined\b|college ruled|wide ruled|\bruled\b', 'blank': r'\bblank\b|unlined'}.items() if re.search(rx, t)), None)
    s['cover'] = next((k for k, rx in {'leather': r'leather', 'hardcover': r'hardcover|hard cover', 'softcover': r'softcover|soft cover'}.items() if re.search(rx, t)), None)
    m = re.search(r'(?<![\d/.-])(?<!\d )(\d{1,2}(?:\.\d{1,2})?)\s?(?:["”″]|\'\'|’’|in\b|inch(?:es)?)?\s?[x×]\s?(\d{1,2}(?:\.\d{1,2})?)\s?(?:["”″]|\'\'|’’|in\b|inch)', t)
    s['dims'] = f'{m.group(1)} x {m.group(2)} in' if m else None
    s['cover_any'] = s['cover'] or next((k for k, rx in {'leather': r'leather', 'hardcover': r'hardcover|hard cover', 'softcover': r'softcover|soft cover'}.items() if re.search(rx, l)), None)
    s['spiral'] = bool(re.search(r'spiral|twin[- ]wire|wire[- ]?bound|wirebound', l))
    s['undated'] = bool(re.search(r'undated', l))
    s['y2027'] = bool(re.search(r'2027', t)); s['academic'] = bool(re.search(r'2026\s?[-–/]\s?(20)?27|academic|jul(y|\.)? 2026', t))
    s['layout'] = [k for k, rx in {'daily': r'daily|page[- ]a[- ]day|one page per day', 'weekly': r'weekly', 'monthly': r'monthly', 'hourly': r'hourly|appointment|\d+[- ]minute'}.items() if re.search(rx, t)]
    s['dates'] = 'Undated' if s['undated'] else '2026-2027' if s['academic'] else '2027' if s['y2027'] else ''
    s['f'] = [k for k, rx in {
        'numbered': r'numbered pages|page numbers', 'penloop': r'pen (loop|holder)',
        'pocket': r'(inner|back|expandable|inside|storage|document|gusseted|interior) pockets?|pocket (in|on|at) the (back|inside)|pockets? for (notes|receipts|loose|storage|cards|photos)',
        'tabs': r'(monthly|month|laminated|divider|index|side|colored) tabs?|tabbed', 'layflat': r'lay[s -]*flat', 'ribbon': r'ribbon',
        'elastic': r'elastic', 'stickers': r'stickers?', 'holidays': r'holidays?', 'magnetic': r'magnet', 'giftbox': r'gift box|gift-boxed|gift ready box'}.items() if re.search(rx, l)]
    return s


PL = ('planners', 'daily-planners', 'weekly-planners', 'monthly-planners', 'academic-planners', 'dated-planners', 'undated-planners', 'hourly-planners', 'teacher-planners', 'business-planners', 'family-planners')
JR = ('hardcover-bullet-journals', 'softcover-bullet-journals', 'dotted-paper-journals', 'graph-paper-journals', 'numbered-pages-journals', 'refillable-journals', 'lined-journals', 'leather-journals', 'pocket-notebooks', 'spiral-and-composition-notebooks', 'sketchbooks-and-blank-journals', 'travelers-notebooks')
CAL = ('wall-calendars', 'desk-calendars', 'dry-erase-calendars', 'pocket-calendars', 'page-a-day-calendars')
inc = lambda s, *c: any(x in s['cats'] for x in c)
isP = lambda s: inc(s, *PL); isJ = lambda s: inc(s, *JR); isC = lambda s: inc(s, *CAL)
y27 = lambda s: s['y2027'] and not s['undated'] and not s['academic']
g = lambda s: s['gsm'] or 0
off = lambda s: (1 - s['price'] / s['full']) if s['full'] and s['full'] > s['price'] else 0
ST = ('pens', 'stickers', 'washi-tape', 'stencils', 'decorative-paper', 'highlighters', 'fineliners-and-markers', 'colored-pencils', 'fountain-pens-and-ink', 'sticky-notes-and-tabs', 'notepads-and-to-do-lists', 'planner-accessories', 'stamps-and-ink-pads', 'journal-gift-sets')
GJ = ('gratitude-journals', 'five-year-journals', 'prayer-journals', 'travel-and-reading-journals', 'fitness-and-wellness-journals', 'memory-and-baby-books')
# slug: (H1, the rule in words, test, table columns, parent categories)
D = {
 'a5-dotted-journals-160gsm': ('A5 Dotted Journals With 160 gsm Paper', 'A5 size, dot grid ruling and a stated paper weight of 160 gsm or more', lambda s: isJ(s) and s['size'] == 'a5' and s['ruling'] == 'dotted' and g(s) >= 160, 'pages gsm cover', ['dotted-paper-journals', 'hardcover-bullet-journals']),
 'dotted-journals-120gsm': ('Dotted Journals With 120 gsm Paper', 'dot grid ruling and a stated paper weight from 120 to 159 gsm', lambda s: isJ(s) and s['ruling'] == 'dotted' and 120 <= g(s) < 160, 'size pages gsm cover', ['dotted-paper-journals']),
 'a5-dotted-journals-numbered-pages': ('A5 Dotted Journals With Numbered Pages', 'A5 size, dot grid ruling and numbered pages stated in the listing', lambda s: isJ(s) and s['size'] == 'a5' and s['ruling'] == 'dotted' and 'numbered' in s['f'], 'pages gsm cover', ['numbered-pages-journals', 'dotted-paper-journals']),
 'a5-lined-hardcover-journals': ('A5 Lined Hardcover Journals', 'A5 size, lined ruling and a hard cover', lambda s: isJ(s) and s['size'] == 'a5' and s['ruling'] == 'lined' and s['cover'] == 'hardcover', 'pages gsm', ['lined-journals', 'hardcover-bullet-journals']),
 'lined-journals-100gsm-paper': ('Lined Journals With 100 gsm Paper or Heavier', 'lined ruling and a stated paper weight of 100 gsm or more', lambda s: isJ(s) and s['ruling'] == 'lined' and g(s) >= 100, 'size pages gsm cover', ['lined-journals']),
 'notebooks-160gsm-paper': ('Notebooks and Journals With 160 gsm Paper', 'a stated paper weight of 160 gsm or more, in any size or ruling', lambda s: isJ(s) and g(s) >= 160, 'size ruling pages gsm', ['dotted-paper-journals', 'sketchbooks-and-blank-journals']),
 'b5-notebooks': ('B5 Notebooks and Journals', 'B5 size stated in the listing', lambda s: isJ(s) and s['size'] == 'b5', 'ruling pages gsm cover', ['spiral-and-composition-notebooks', 'lined-journals']),
 'a6-pocket-notebooks': ('A6 and Pocket Size Notebooks', 'A6 or pocket size (3.5 x 5.5 in) stated in the listing', lambda s: isJ(s) and s['size'] in ('a6', 'pocket') and not re.search(r'cover for|inserts?\b|refills?\b', s['t']), 'size ruling pages gsm', ['pocket-notebooks']),
 'lined-leather-journals': ('Lined Leather Journals', 'a leather cover named in the title and lined pages', lambda s: isJ(s) and s['cover'] == 'leather' and s['ruling'] == 'lined', 'size pages gsm', ['leather-journals', 'lined-journals']),
 'journals-in-a-gift-box': ('Journals That Come in a Gift Box', 'a gift box stated in the listing', lambda s: (isJ(s) or inc(s, 'gratitude-journals', 'five-year-journals', 'prayer-journals')) and 'giftbox' in s['f'] and re.search(r'journal|notebook|diary', s['t']), 'size pages gsm', ['journal-gift-sets']),
 '2027-planners-a5': ('2027 Planners in A5', 'dated for 2027 and A5 size', lambda s: isP(s) and y27(s) and s['size'] == 'a5', 'layout pages gsm cover', ['dated-planners']),
 '2027-planners-8-5-x-11': ('2027 Planners, 8.5 x 11 Inches', 'dated for 2027 and 8.5 x 11 in (Letter) size', lambda s: isP(s) and y27(s) and s['size'] == 'letter', 'layout gsm cover', ['dated-planners']),
 '2027-hardcover-planners': ('2027 Hardcover Planners', 'dated for 2027 with a hard cover named in the title', lambda s: isP(s) and y27(s) and s['cover'] == 'hardcover', 'size layout gsm', ['dated-planners']),
 '2027-daily-planners-one-page-per-day': ('2027 Daily Planners With One Page per Day', 'dated for 2027 with one page for each day', lambda s: isP(s) and y27(s) and re.search(r'one page per day|page[- ]a[- ]day|1 page per day|365', s['t']), 'size pages gsm cover', ['daily-planners', 'dated-planners']),
 '2027-appointment-books-15-minute': ('2027 Appointment Books With 15-Minute Slots', 'dated for 2027 with 15-minute or quarter-hour rows stated', lambda s: isP(s) and y27(s) and re.search(r'15[- ]minute|15[- ]min\b|quarter[- ]hour', s['l']), 'size gsm cover', ['hourly-planners', 'dated-planners']),
 '2027-appointment-books-30-minute': ('2027 Appointment Books With 30-Minute Slots', 'dated for 2027 with 30-minute or half-hour rows stated', lambda s: isP(s) and y27(s) and re.search(r'30[- ]minute|30[- ]min\b|half[- ]hour', s['l']), 'size gsm cover', ['hourly-planners', 'dated-planners']),
 '2027-planners-pen-loop-and-pocket': ('2027 Planners With a Pen Loop and a Pocket', 'dated for 2027 with both a pen loop and an inner or back pocket stated', lambda s: isP(s) and y27(s) and 'penloop' in s['f'] and 'pocket' in s['f'], 'size layout gsm cover', ['dated-planners']),
 '2027-planners-100gsm-paper': ('2027 Planners With 100 gsm Paper or Heavier', 'dated for 2027 with a stated paper weight of 100 gsm or more', lambda s: isP(s) and y27(s) and g(s) >= 100, 'size layout gsm cover', ['dated-planners']),
 '2027-2028-two-year-planners': ('2027-2028 Two-Year Planners', 'two calendar years, 2027 and 2028, in one book', lambda s: (isP(s) or inc(s, 'pocket-calendars')) and re.search(r'2027\s?[-–‑]\s?2028', s['t']), 'size layout cover', ['monthly-planners', 'dated-planners']),
 '2027-2031-five-year-planners': ('2027-2031 Five-Year Monthly Planners', 'five years, 2027 to 2031, in one book', lambda s: re.search(r'2027\s?[-–]\s?2031', s['t']), 'size cover', ['monthly-planners']),
 'academic-planners-2026-2027-8-5-x-11': ('2026-2027 Academic Planners, 8.5 x 11 Inches', 'the 2026-2027 school year and 8.5 x 11 in (Letter) size', lambda s: isP(s) and s['academic'] and s['size'] == 'letter', 'layout gsm cover', ['academic-planners']),
 'academic-planners-2026-2027-a5': ('2026-2027 Academic Planners in A5', 'the 2026-2027 school year and A5 size', lambda s: isP(s) and s['academic'] and s['size'] == 'a5', 'layout gsm cover', ['academic-planners']),
 'undated-weekly-planners-a5': ('Undated Weekly Planners in A5', 'no printed dates, a weekly layout and A5 size', lambda s: isP(s) and s['undated'] and 'weekly' in s['layout'] and s['size'] == 'a5', 'pages gsm cover', ['undated-planners', 'weekly-planners']),
 'undated-daily-planners-with-schedule': ('Undated Daily Planners With a Timed Schedule', 'no printed dates, a daily layout and hourly or timed rows', lambda s: isP(s) and s['undated'] and 'daily' in s['layout'] and 'hourly' in s['layout'], 'size pages gsm', ['undated-planners', 'daily-planners']),
 'undated-planners-120gsm-paper': ('Undated Planners With 120 gsm Paper', 'no printed dates and a stated paper weight of 120 gsm or more', lambda s: isP(s) and s['undated'] and g(s) >= 120, 'size layout pages gsm', ['undated-planners']),
 'undated-planners-with-stickers': ('Undated Planners That Include Stickers', 'no printed dates and stickers stated in the listing', lambda s: isP(s) and s['undated'] and 'stickers' in s['f'], 'size layout gsm', ['undated-planners']),
 'budget-planners-with-pockets': ('Budget Planners With Pockets', 'a budget planner with pockets stated in the listing', lambda s: inc(s, 'budget-planners') and re.search(r'pocket', s['l']), 'size pages gsm', ['budget-planners']),
 'teacher-planners-2026-2027': ('2026-2027 Teacher Planners', 'a teacher or lesson planner for the 2026-2027 school year', lambda s: inc(s, 'teacher-planners') and s['academic'], 'size gsm cover', ['teacher-planners']),
 '2027-wall-calendars-with-holidays': ('2027 Wall Calendars With Holidays Printed', 'a 2027 wall calendar whose listing states printed holidays', lambda s: inc(s, 'wall-calendars') and s['y2027'] and 'holidays' in s['f'], 'size spiral', ['wall-calendars']),
 '2027-desk-calendars-with-stand': ('2027 Desk Calendars With a Stand', 'a 2027 desk calendar with a stand or easel stated', lambda s: inc(s, 'desk-calendars') and s['y2027'] and re.search(r'\bstand\b|easel|standing|flip', s['l']), 'size spiral', ['desk-calendars']),
 'magnetic-fridge-calendars': ('Magnetic Fridge Calendars', 'a calendar with a magnet or magnetic back stated', lambda s: isC(s) and 'magnetic' in s['f'], 'size dates', ['dry-erase-calendars', 'wall-calendars']),
 '2027-pocket-planners': ('2027 Pocket Planners and Calendars', 'dated for 2027 and pocket size', lambda s: s['y2027'] and (inc(s, 'pocket-calendars') or (isP(s) and s['size'] == 'pocket')), 'layout cover', ['pocket-calendars']),
 'magnetic-meal-planners': ('Magnetic Meal Planners and Grocery List Pads', 'a meal, menu or grocery planner with a magnetic back', lambda s: 'magnetic' in s['f'] and re.search(r'meal|menu|grocery', s['t']), 'size', ['meal-planners']),

 # Deal pages: only offers whose stored price is 15% or more below the stored list price. Sorted by the size of the cut.
 'black-friday-planner-deals': ('Black Friday Planner and Calendar Deals 2026', 'a price 15% or more below the list price the retailer shows, on a planner or calendar', lambda s: (isP(s) or isC(s) or inc(s, 'budget-planners', 'meal-planners')) and off(s) >= .15, 'dates size list off', ['dated-planners', 'wall-calendars'], 'off'),
 'black-friday-journal-deals': ('Black Friday Journal and Stationery Deals 2026', 'a price 15% or more below the list price the retailer shows, on a journal, notebook, pen set or planner supply', lambda s: (isJ(s) or inc(s, *ST) or inc(s, *GJ)) and off(s) >= .15, 'size list off', ['dotted-paper-journals', 'pens'], 'off'),
}
COLS = {'size': ('Size', lambda s: SIZE.get(s['size']) or s['dims'] or 'Not stated'), 'pages': ('Pages', lambda s: f"{s['pages']:,}" if s['pages'] else 'Not stated'),
        'gsm': ('Paper', lambda s: f"{s['gsm']} gsm" if s['gsm'] else 'Not stated'), 'cover': ('Cover', lambda s: (s['cover_any'] or 'Not stated').capitalize()),
        'ruling': ('Ruling', lambda s: (s['ruling'] or 'Not stated').capitalize()), 'layout': ('Layout', lambda s: ', '.join(x.capitalize() for x in s['layout']) or 'Not stated'),
        'spiral': ('Binding', lambda s: 'Spiral or wire' if s['spiral'] else 'Not stated'), 'dates': ('Dates', lambda s: s['dates'] or 'Not stated'),
        'list': ('List price', lambda s: usd(s['full'])), 'off': ('Below list', lambda s: f"{round(off(s) * 100)}%")}


def specs():
    S = [x for x in (spec(p) for p in json.loads(CATALOG.read_text())) if x]
    return [s for s in S if s['price'] and s['stock']]


def members():
    S = specs()
    return {k: sorted([s for s in S if d[2](s)], key=(lambda s: (-round(off(s), 4), s['price'])) if len(d) > 5 else (lambda s: (s['price'], s['id']))) for k, d in D.items()}


def usd(x): return f'${x:,.2f}'


def data(slug, M):
    h1, rule, _, cols, parents = D[slug][:5]; deal = len(D[slug]) > 5; rows = M[slug]; cols = cols.split()
    ch = max(s['checked'] for s in rows); lo = min(s['checked'] for s in rows)
    d = lambda x: dt.date.fromisoformat(x).strftime('%b. %-d, %Y').replace('May.', 'May')
    checked = d(ch) if lo == ch else f"{d(lo)[:-6]} to {d(ch)}" if lo[:7] == ch[:7] else f'{d(lo)} to {d(ch)}'
    head = ['Product'] + [COLS[c][0] for c in cols] + ['Price', 'Score']
    body = [[f'<a href="/products/{s["slug"]}">{html.escape(s["link"])}</a>'] + [COLS[c][1](s) for c in cols] + [usd(s['price']), (f"{s['rating']:.1f}" if s['rating'] else '')] for s in rows[:30]]
    pr = sorted(s['price'] for s in rows)
    st = {'count': len(rows), 'price_low': pr[0], 'price_high': pr[-1], 'median_price': pr[len(pr) // 2], 'scored': sum(1 for s in rows if s['rating']),
          'below_list': sum(1 for s in rows if s['full'] and s['full'] > s['price'])}
    gs = [s for s in rows if s['gsm']]; pg = [s for s in rows if s['pages']]
    if gs: st['gsm_stated'] = len(gs); st['gsm_min'] = min(s['gsm'] for s in gs); st['gsm_max'] = max(s['gsm'] for s in gs); st['heaviest'] = max(gs, key=lambda s: s['gsm'])['link']
    if pg:
        st['pages_stated'] = len(pg); st['pages_max'] = max(s['pages'] for s in pg); st['most_pages'] = max(pg, key=lambda s: s['pages'])['link']
        c = min(pg, key=lambda s: s['price'] / s['pages']); st['lowest_cost_per_100_pages'] = [c['link'], round(c['price'] / c['pages'] * 100, 2)]
    for k in ('cover_any', 'size', 'ruling', 'dates'):
        cnt = {}
        for s in rows: cnt[s[k] or 'not stated'] = cnt.get(s[k] or 'not stated', 0) + 1
        st['by_' + k] = cnt
    if deal: st['off_max'] = round(off(rows[0]) * 100); st['off_30_plus'] = sum(1 for s in rows if off(s) >= .3); st['under_10'] = sum(1 for s in rows if s['price'] < 10)
    top = rows[:12] if deal else sorted(rows, key=lambda s: (-(s['rating'] or 0), s['price']))[:12]
    return {'slug': slug, 'deal': deal, 'h1': h1, 'rule': rule, 'parents': parents, 'checked': checked, 'head': head, 'body': body, 'stats': st, 'lowest': rows[0]['link'], 'highest': rows[-1]['link'],
            'card_ids': [s['id'] for s in top], 'ids': [s['id'] for s in rows], 'products': [{'name': s['link'], 'facts': {c: COLS[c][1](s) for c in cols}, 'price': s['price'], 'score': s['rating'], 'features': s['f']} for s in rows[:30]]}


def table(d):
    n = d['stats']['count']
    cap = f"{'All ' + str(n) if n <= 30 else ('The 30 largest cuts of ' if d.get('deal') else 'The 30 lowest-priced of ') + str(n)} products, {'largest cut first' if d.get('deal') else 'lowest price first'}. Price checked {d['checked']}; prices change daily. \"Not stated\" means the listing title and bullets give no value. Score is the Fresh Calendars Score out of 5; blank means none is published."
    return ('<div class="fc-table"><table><thead><tr>' + ''.join(f'<th>{h}</th>' for h in d['head']) + '</tr></thead><tbody>'
            + ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in d['body']) + f'</tbody></table></div>\n<p>{cap}</p>')


def build():
    M = members(); out = {}
    for k, rows in M.items():
        if len(rows) < 8: print(f'skip {k}: {len(rows)} products'); continue
        out[k] = data(k, M)
    keys = sorted(out, key=lambda k: -len(out[k]['ids']))
    for i, a in enumerate(keys):  # drop the smaller page of any pair that shares most products
        for b in keys[i + 1:]:
            if a in out and b in out:
                A, B = set(out[a]['ids']), set(out[b]['ids'])
                if len(A & B) / len(A | B) > 0.6: print(f'drop {b}: overlaps {a} {len(A & B)}/{len(A | B)}'); out.pop(b)
    for k, d in out.items(): (OUT / f'{k}.json').write_text(json.dumps(d, indent=1))
    print(len(out), 'pages:', ', '.join(f"{k} ({out[k]['stats']['count']})" for k in out))
    return out


def sections(d, prose, reg):
    """The four sections of a page: heading, intro + table + prose, product cards, related links."""
    sib = [k for k in reg if k not in (d['slug'], '_hub') and k in D and set(D[k][4]) & set(d['parents'])][:6] if reg else []
    links = ''.join(f'<li><a href="/categories/{c}">{c.replace("-", " ").capitalize()}</a></li>' for c in d['parents'])
    links += ''.join(f'<li><a href="/{k}">{html.escape(D[k][0])}</a></li>' for k in sib)
    main = (f"<p>{prose['intro']}</p>\n{table(d)}\n" + ''.join(f"<h2>{html.escape(q['q'])}</h2>\n<p>{q['a']}</p>\n" for q in prose['qa'])
            + f"<h2>How this list is built</h2>\n<p>A product is on this page when its maker listing states {d['rule']}. Every value in the table is read from that listing, and a missing value is shown as \"Not stated\". We do not test products by hand; scores follow the method on <a href=\"/how-we-rate-products\">How We Rate Products</a>. The shop earns a commission when you buy through a retailer link.</p>")
    tail = f"<h2>Related lists</h2>\n<ul>{links}<li><a href=\"/planner-and-journal-finder\">All lists by size, paper and layout</a></li></ul>\n<p>{prose['printable']}</p>"
    return main, tail


def publish(slug):
    reg = json.loads(REG.read_text()) if REG.exists() else {}
    d = json.loads((OUT / f'{slug}.json').read_text()); r = reg.get(slug) or sys.exit(f'{slug}: no prose in {REG}')
    prose = r['prose']
    if d.get('deal'):  # deal pages change daily: their prose carries {placeholders} filled from today's stats
        v = dict(d['stats'], checked=d['checked'], lowest=d['lowest']); v['price_low'] = usd(v['price_low'])
        prose = json.loads(json.dumps(prose), object_hook=lambda o: {k: (x.format_map(v) if isinstance(x, str) else x) for k, x in o.items()})
    elif r.get('count') and r['count'] != d['stats']['count']: print(f"STALE PROSE {slug}: written for {r['count']} products, now {d['stats']['count']}; rewrite its prose")
    main, tail = sections(d, prose, reg)
    meta = {'slug': slug, 'title': d['h1'], 'link_title': d['h1'], 'meta_title': prose['meta_title'], 'meta_description': prose['meta_description'], 'enabled': True, 'in_footer_menu': False}
    assert 30 <= len(meta['meta_title']) <= 65 and 100 <= len(meta["meta_description"]) <= 160, (slug, len(meta['meta_title']), len(meta['meta_description']))
    if not r.get('page_id'):
        s, res = call('POST', 'pages', meta)
        if s not in (200, 201): sys.exit(f'{slug}: POST pages {s} {str(res)[:300]}')
        r['page_id'] = res['data']['id']; time.sleep(1.1)
        ops = [{'op': 'add', 'block': 'heading', 'position': 1, 'settings': {'tag': 'h1', 'size': 'medium', 'title': d['h1'], 'subtitle': prose['subtitle'], 'alignment': 'left'}},
               {'op': 'add', 'block': 'content', 'position': 2, 'settings': {'title': '', 'content': main}},
               {'op': 'add', 'block': 'products', 'position': 3, 'settings': {'mode': 'custom', 'title': prose['cards_title'], 'custom_ids': d['card_ids'], 'quantity': len(d['card_ids']), 'shuffle': False}},
               {'op': 'add', 'block': 'content', 'position': 4, 'settings': {'title': '', 'content': tail}}]
    else:
        s, res = call('PATCH', f"pages/{r['page_id']}", meta); time.sleep(1.1)
        s, cur = call('GET', f"pages/{r['page_id']}/sections"); sec = cur['data']['sections']; time.sleep(1.1)
        c = [x for x in sec if x['block'] == 'content']; h = [x for x in sec if x['block'] == 'heading'][0]; pr = [x for x in sec if x['block'] == 'products'][0]
        ops = [{'op': 'update', 'id': h['id'], 'settings': {'title': d['h1'], 'subtitle': prose['subtitle']}},
               {'op': 'update', 'id': c[0]['id'], 'settings': {'content': main}},
               {'op': 'update', 'id': pr['id'], 'settings': {'title': prose['cards_title'], 'custom_ids': d['card_ids'], 'quantity': len(d['card_ids'])}},
               {'op': 'update', 'id': c[1]['id'], 'settings': {'content': tail}}]
    s, res = call('PATCH', f"pages/{r['page_id']}/sections", {'operations': ops})
    if s != 200: sys.exit(f'{slug}: sections {s} {str(res)[:400]}')
    r['count'] = r.get('count') if (not d.get('deal') and r.get('count')) else d['stats']['count']; r['live_count'] = d['stats']['count']; r['updated'] = dt.date.today().isoformat(); reg[slug] = r
    REG.write_text(json.dumps(reg, indent=1) + '\n'); print('published', slug, r['page_id'], d['stats']['count']); time.sleep(1.1)


GROUPS = (('2027 planners', lambda k: k.startswith('2027-') and 'calendar' not in k), ('School year planners', lambda k: 'academic' in k or 'teacher' in k),
          ('Undated and budget planners', lambda k: k.startswith('undated') or 'budget' in k), ('Journals and notebooks', lambda k: 'journal' in k or 'notebook' in k),
          ('Calendars and fridge planners', lambda k: 'calendar' in k or 'magnetic' in k), ('Prices below list', lambda k: 'deals' in k))


def hub():
    """/planner-and-journal-finder: every published spec page, grouped, with its product count. Keeps them out of orphan status."""
    reg = json.loads(REG.read_text()); h = reg.pop('_hub', {}); seen = set(); parts = []
    for name, test in GROUPS:
        ks = [k for k in reg if k not in seen and test(k) and reg[k].get('page_id')]; seen |= set(ks)
        if ks: parts.append(f'<h2>{name}</h2>\n<ul>' + ''.join(f'<li><a href="/{k}">{html.escape(D[k][0])}</a> ({reg[k].get("live_count", reg[k]["count"])} products)</li>' for k in ks) + '</ul>')
    n = len(seen); total = 0
    intro = (f'<p>These {n} lists sort the shop by what a listing states: size, paper weight, ruling, dates and layout. A product appears on a list only when its maker listing states every spec in the list name, and each list has a table of those specs with the price on the day it was checked.</p>'
             '<p>Use them when a category is too broad. "Dotted journals" is a category; "A5 dotted journals with numbered pages" is a list.</p>')
    tail = ('<h2>How the lists are made</h2>\n<p>Every value comes from the maker listing: the title and the feature bullets. We do not test products by hand. Lists are rebuilt from the retailer data, so a product that goes out of stock drops off and a new one that states the specs joins. The rating method is on <a href="/how-we-rate-products">How We Rate Products</a>, and <a href="/jessica-hartwell">Jessica Hartwell</a> edits the shop.</p>'
            '<p>Free printable calendars to plan with: <a href="https://freshcalendars.com/monthly-calendars/">monthly</a>, <a href="https://freshcalendars.com/printable-weekly-calendar.html">weekly</a> and <a href="https://freshcalendars.com/printable-yearly-calendar.html">yearly</a>.</p>')
    meta = {'slug': 'planner-and-journal-finder', 'title': 'Planner and Journal Finder', 'link_title': 'Planner and Journal Finder', 'meta_title': f'Planner and Journal Finder: {n} Lists by Size and Paper',
            'meta_description': f'Find a planner or journal by what its listing states: {n} lists by size, paper weight, ruling, dates and layout, each with a spec and price table.', 'enabled': True, 'in_footer_menu': True}
    body = intro + '\n' + '\n'.join(parts) + '\n' + tail
    if not h.get('page_id'):
        s, r = call('POST', 'pages', meta); h['page_id'] = r['data']['id']; time.sleep(1.1)
        ops = [{'op': 'add', 'block': 'heading', 'position': 1, 'settings': {'tag': 'h1', 'size': 'medium', 'title': 'Planner and Journal Finder', 'subtitle': f'{n} lists by size, paper weight, ruling, dates and layout', 'alignment': 'left'}},
               {'op': 'add', 'block': 'content', 'position': 2, 'settings': {'title': '', 'content': body}}]
    else:
        call('PATCH', f"pages/{h['page_id']}", meta); time.sleep(1.1)
        s, cur = call('GET', f"pages/{h['page_id']}/sections"); sec = cur['data']['sections']; time.sleep(1.1)
        ops = [{'op': 'update', 'id': [x for x in sec if x['block'] == 'heading'][0]['id'], 'settings': {'subtitle': f'{n} lists by size, paper weight, ruling, dates and layout'}},
               {'op': 'update', 'id': [x for x in sec if x['block'] == 'content'][0]['id'], 'settings': {'content': body}}]
    s, r = call('PATCH', f"pages/{h['page_id']}/sections", {'operations': ops})
    if s != 200: sys.exit(f'hub: {s} {str(r)[:300]}')
    reg['_hub'] = h; REG.write_text(json.dumps(reg, indent=1) + '\n'); print('hub', h['page_id'], n, 'lists')


if __name__ == '__main__':
    a = sys.argv[1:] or sys.exit(__doc__)
    if a[0] == 'build': build()
    elif a[0] in ('publish', 'refresh'):
        if a[0] == 'refresh': build()
        reg = json.loads(REG.read_text()) if REG.exists() else {}
        todo = [k for k in reg if k != '_hub' and (OUT / f'{k}.json').exists()] if (a[0] == 'refresh' or a[1] == 'all') else a[1:]
        for k in todo: publish(k)
        hub(); call('POST', 'store/clear-cache')
