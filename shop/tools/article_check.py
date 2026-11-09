"""Check a shop article draft against the shop-article skill rules before it is published.

Usage:
  python3 shop/tools/article_check.py <draft.json> [...]      check drafts (exit 1 on any FAIL)
  python3 shop/tools/article_check.py --sync                   pull live articles into the corpus (API)
  python3 shop/tools/article_check.py --orphans               list articles no other article links to (after --sync)
  python3 shop/tools/article_check.py --live <draft.json>      also confirm every product is enabled,
                                                              in stock and priced in USD (API)

A draft is JSON: slug, title, meta_description, type, primary_query, cluster, products (ids),
content (HTML body without an <h1>), author, article_category, related (shop article slugs),
image_query, published_at (optional, ISO with offset). See the shop-article skill.
Reads the catalog from .cache/shop/audit/products-now.json (run fetchall.py first) and the
registry from shop/articles/registry.json. Stdlib only.
"""
import datetime as dt, html, json, os, re, statistics, sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import ROOT, WORK, call  # noqa: E402

REGISTRY = ROOT / 'shop' / 'articles' / 'registry.json'
CORPUS = WORK / 'articles' / 'live'
CATALOG = WORK / 'audit' / 'products-now.json'
RATINGS = ROOT / 'shop' / 'ratings' / 'published.json'

TYPES = {  # words (min, max), tables min, product shortcodes (min, max)
    'best': ((1100, 2600), 1, (5, 12)),
    'versus': ((800, 1800), 1, (2, 4)),
    'price': ((900, 2200), 1, (5, 12)),
    'review': ((700, 1500), 1, (1, 4)),
    'guide': ((900, 2400), 1, (3, 10)),
    'howto': ((700, 1800), 0, (1, 6)),
    'dates': ((700, 1800), 1, (2, 8)),
    'gift': ((900, 2200), 1, (6, 14)),
    'explainer': ((600, 1500), 1, (1, 6)),
    'alternatives': ((900, 2200), 1, (4, 10)),
}
BANNED = r'''delve|tapestry|testament|interplay|intricate|meticulous(?:ly)?|pivotal|crucial|underscore[sd]?|showcase[sd]?|realm|nuanced|robust|seamless(?:ly)?|leverage[sd]?|foster(?:s|ed)?|elevate[sd]?|embark|unleash|unlock|harness|bustling|vibrant|ever-evolving|game[- ]changer|cutting-edge|dive in|in today's|it's important to note|when it comes to|in conclusion|to sum up|moreover|furthermore|additionally|notably|boasts?|nestled|multifaceted|garner|indelible|rich history|serves as|stands as|plays a vital role|must-have|must-see|perfect for|irresistible|ultimate|top-notch|high-quality|luxurious|stunning|amazing|effortless(?:ly)?|look no further|whether you're|elevate your|take your .{1,20} to the next level|hassle-free|second to none|world-class|revolutionary'''
FAKE_TEST = r"we tested|i tested|we've tested|we tried|i tried|hands-on|in our testing|in our tests|our testers|after testing|we used (?:it|them|this)|i used (?:it|them|this)|we've been using|i've been using|our team tested|lab test"
URGENCY = r'hurry|limited time|act now|while supplies last|selling fast|don\'t miss|grab (?:it|yours)|today only|lowest price ever|best price ever'
MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December'
DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


def text_of(h):
    h = re.sub(r'<(script|style)\b.*?</\1>', ' ', h, flags=re.S | re.I)
    return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h))).strip()


def shingles(t, n=8):
    w = re.findall(r"[a-z0-9']+", t.lower())
    return {' '.join(w[i:i + n]) for i in range(max(0, len(w) - n + 1))}


def load(p, default):
    try:
        return json.loads(Path(p).read_text())
    except (OSError, ValueError):
        return default


def sync():
    """Pull every article (published and scheduled) into the corpus and refresh the registry."""
    CORPUS.mkdir(parents=True, exist_ok=True)
    reg = {r['slug']: r for r in load(REGISTRY, [])}
    page = 1
    while True:
        s, d = call('GET', f'articles?per_page=50&page={page}')
        for a in d.get('data', []):
            s2, f = call('GET', f"articles/{a['id']}"); f = f['data']
            c = f.get('content') or ''
            (CORPUS / f"{f['slug']}.html").write_text(c)
            r = reg.get(f['slug'], {'slug': f['slug'], 'type': 'legacy', 'primary_query': f['title'].lower(), 'cluster': f['slug']})
            r.update({'id': f['id'], 'title': f['title'], 'enabled': f.get('enabled'), 'published_at': f.get('published_at'),
                      'products': sorted({int(x) for x in re.findall(r'\[product id="(\d+)"\]', c)}),
                      'h2': [text_of(x) for x in re.findall(r'<h2\b[^>]*>(.*?)</h2>', c, re.S | re.I)]})
            reg[f['slug']] = r
        if page >= d.get('meta', {}).get('last_page', 1): break
        page += 1
    REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY.write_text(json.dumps(sorted(reg.values(), key=lambda r: r.get('id') or 0), indent=1) + '\n')
    print('synced', len(reg), 'articles')


def orphans():
    """Articles that no other article links to: add a link from 1-2 related articles."""
    files = {f.stem: f.read_text() for f in CORPUS.glob('*.html')} if CORPUS.exists() else {}
    for slug in sorted(files):
        inbound = [o for o, c in files.items() if o != slug and f'/articles/{slug}"' in c]
        if not inbound: print('orphan', slug)


def check(path, live=False):
    d = load(path, None)
    if d is None: return [('FAIL', f'{path}: not valid JSON')]
    out = []
    F = lambda m: out.append(('FAIL', m))
    W = lambda m: out.append(('WARN', m))
    for k in ('slug', 'title', 'meta_description', 'type', 'primary_query', 'cluster', 'products', 'content', 'author', 'image_query'):
        if not d.get(k): F(f'missing field: {k}')
    if out: return out
    typ, c, q = d['type'], d['content'], d['primary_query'].lower().strip()
    if typ not in TYPES: F(f'type must be one of {sorted(TYPES)}'); return out
    (wmin, wmax), tmin, (pmin, pmax) = TYPES[typ]
    body = text_of(c); words = len(body.split())

    # Title, description, slug
    t = d['title']
    if not 40 <= len(t) <= 70: F(f'title {len(t)} chars (40-70)')
    head = ' '.join(q.split()[:3])
    if head not in t.lower()[:max(45, len(head) + 5)]: F(f'title must start with the query words "{head}"')
    if re.search(r'[!?]{2,}|!|\b(best ever|you won.t believe|shocking)\b', t, re.I): F('title: no hype or exclamation')
    md = d['meta_description']
    if not 120 <= len(md) <= 155: F(f'meta_description {len(md)} chars (120-155)')
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+){1,7}$', d['slug']) or len(d['slug']) > 60: F('slug: 2-8 lowercase words, 60 chars max')
    if re.search(r'(?:^|-)20\d\d(?:-|$)', d['slug']): W('year in the slug: yearly topics keep one URL and change the year in the title')
    if d['author'] != 'Fresh Calendars Team': F('author must be "Fresh Calendars Team" (no invented people)')
    if d.get('published_at') and not re.match(r'^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[-+]\d\d:\d\d$', d['published_at']): F('published_at: ISO with offset')

    # Structure
    if re.search(r'<h1\b', c, re.I): F('content must not contain <h1> (the title is the H1)')
    h2 = [text_of(x) for x in re.findall(r'<h2\b[^>]*>(.*?)</h2>', c, re.S | re.I)]
    if len(h2) < 3: F(f'{len(h2)} H2s (3 or more)')
    if len(set(x.lower() for x in h2)) < len(h2): F('two H2s are identical')
    if not wmin <= words <= wmax: F(f'{words} words ({wmin}-{wmax} for {typ})')
    tables = re.findall(r'<table\b.*?</table>', c, re.S | re.I)
    if len(tables) < tmin: F(f'{len(tables)} tables ({tmin}+ for {typ})')
    for tb in tables:
        if not re.search(r'<th\b', tb, re.I): F('every table needs a header row (<th>)')
        if not re.search(r'class="fc-table"', c[:c.find(tb)][-80:] + tb[:40]): W('wrap each table in <div class="fc-table"> for phone scrolling')
    first_p = text_of((re.findall(r'<p\b[^>]*>(.*?)</p>', c, re.S | re.I) or [''])[0])
    if not re.search(r'commission', first_p, re.I): F('first paragraph must be the affiliate disclosure (mentions the commission)')
    paras = [text_of(x) for x in re.findall(r'<p\b[^>]*>(.*?)</p>', c, re.S | re.I)]
    lede = next((p for p in paras[1:] if len(p.split()) > 12), '')
    key = [w for w in re.findall(r'[a-z0-9]+', q) if len(w) > 3]
    if key and not any(k in lede.lower() for k in key): F('the first real paragraph must answer the query (no query word found)')

    # Products
    ids = [int(x) for x in re.findall(r'\[product id="(\d+)"\]', c)]
    if len(ids) != len(set(ids)): F('a product shortcode appears twice')
    if sorted(set(ids)) != sorted(set(int(x) for x in d['products'])): F('products list must match the [product id] shortcodes in content')
    if not pmin <= len(set(ids)) <= pmax: F(f'{len(set(ids))} products ({pmin}-{pmax} for {typ})')
    cat = {p['id']: p for p in load(CATALOG, [])}
    for i in set(ids):
        p = cat.get(i)
        if cat and not p: F(f'product {i} not in the catalog (disabled or unknown; run fetchall.py)')
        elif p and not any(o.get('currency') == 'USD' and o.get('price') for o in p.get('offers', [])): F(f'product {i} has no USD price')
    if live:
        for i in set(ids):
            s, r = call('GET', f'products/{i}?include=offers')
            p = r.get('data') or {}
            ok = s == 200 and p.get('enabled') and any(o.get('currency') == 'USD' and o.get('price') and o.get('stock_available', 1) for o in p.get('offers', []))
            if not ok: F(f'live: product {i} is not enabled, priced and in stock')

    # Ratings quoted in the text must match the published ratings
    rated = {r['id']: r['author_rating'] for r in load(RATINGS, [])}
    for m in re.finditer(r'(\d\.\d)\s*(?:out of 5|/ ?5)', body):
        if float(m.group(1)) not in rated.values(): F(f'score {m.group(1)} does not match any published Fresh Calendars Score')

    # Writing rules
    low = body.lower()
    for name, rx, kind in (('banned word', BANNED, F), ('first-hand testing claim (we do not test by hand)', FAKE_TEST, F), ('false urgency', URGENCY, F)):
        hits = sorted(set(m.group(0) for m in re.finditer(r'\b(?:' + rx + r')\b', low)))
        if hits: kind(f'{name}: {", ".join(hits[:6])}')
    if '\u2014' in c or ' -- ' in c: F('no em dashes')
    if '!' in body: F('no exclamation marks')
    if re.search(r"\bnot (?:just|only|merely) [^.]{1,60}\bbut\b|\bit'?s not [^.]{1,40}, (?:it'?s|but)\b", low): F('no "not X but Y" constructions')
    if len(re.findall(r'\b(?:this (?:article|guide|post|page)|the table below|in this (?:article|guide))\b', low)) > 2: F('the page talks about itself more than twice')
    sl = [len(s.split()) for s in re.split(r'(?<=[.?])\s+', body) if len(s.split()) > 2]
    if len(sl) > 10 and statistics.pstdev(sl) < 4.5: W(f'sentence lengths too even (sd {statistics.pstdev(sl):.1f}); vary them')
    if re.search(r'\b(?:the )?best\b', low) and typ not in ('best', 'gift', 'price', 'alternatives'):
        W('"best" outside a best-of page: state the criterion or drop it')

    # Prices: only inside a dated price table
    for chunk in re.split(r'<table\b.*?</table>', c, flags=re.S | re.I):
        if re.search(r'\$\s?\d', text_of(chunk)) and typ != 'price': F('dollar amounts only inside a table (prices change daily)')
        elif re.search(r'\$\s?\d', text_of(chunk)) and typ == 'price':
            for m in re.finditer(r'[^.]*\$\s?\d[^.]*', text_of(chunk)):
                if not re.search(r'under \$\d+|\$\d+ (?:or less|and under)|below \$\d+', m.group(0), re.I): F(f'price in prose: "{m.group(0)[:60]}"'); break
    for tb in tables:
        if re.search(r'\$\s?\d', text_of(tb)) and not re.search(r'checked|as of', text_of(tb) + c[c.find(tb) + len(tb):c.find(tb) + len(tb) + 300], re.I):
            F('a price table needs "price checked <date>" in it or right below it')

    # Dates: every "Weekday, Month D, YYYY" must be the right weekday
    for m in re.finditer(rf'\b({"|".join(DAYS)}),? ({MONTHS}) (\d{{1,2}}),? (\d{{4}})', body):
        wd, mo, dd, yy = m.groups()
        real = dt.date(int(yy), MONTHS.split('|').index(mo) + 1, int(dd)).strftime('%A')
        if real != wd: F(f'{m.group(0)} is a {real}')
    yrs = {int(y) for y in re.findall(r'\b(20[2-3]\d)\b', t)}
    if yrs and any(int(y) < min(yrs) - 1 for y in re.findall(r'\b(20[2-3]\d)\b', body)): W('body mentions a year well before the title year; check it is not stale')

    # Links
    links = re.findall(r'<a\b[^>]*href="([^"]+)"', c, re.I)
    fc = [u for u in links if re.match(r'https://freshcalendars\.com/', u)]
    shop_cat = [u for u in links if re.search(r'^(?:https://shop\.freshcalendars\.com)?/(?:categories|brands)/', u)]
    if len(fc) < 2: F(f'{len(fc)} links to freshcalendars.com (2+: printables, dates)')
    if not shop_cat: F('link at least one shop category or brand page')
    if any(re.search(r'amazon\.|amzn\.|ebay\.', u) for u in links): F('no raw retailer links: use [product id] shortcodes')
    rel = d.get('related') or []
    if len(rel) > 3: F('related: 3 or fewer')

    # Overlap with existing articles (doorway and copy checks)
    reg = [r for r in load(REGISTRY, []) if r.get('slug') != d['slug']]
    for r in reg:
        if r.get('primary_query', '').lower().strip() == q: F(f'primary query already owned by {r["slug"]}: update that article instead')
        if r.get('cluster') == d['cluster'] and r.get('type') == typ: F(f'cluster "{d["cluster"]}" already has a {typ} page: {r["slug"]}')
        a, b = set(r.get('products') or []), set(ids)
        if a and b and r.get('type') == typ and len(a & b) / len(a | b) > 0.6: F(f'product set overlaps {r["slug"]} by {len(a & b)}/{len(a | b)}: make it a section there')
        for x in h2:
            if x.lower() in [y.lower() for y in r.get('h2') or []] and len(x.split()) > 3: F(f'H2 reused from {r["slug"]}: "{x}"')
    mine = shingles(body)
    if CORPUS.exists() and mine:
        for f in CORPUS.glob('*.html'):
            if f.stem == d['slug']: continue
            o = len(mine & shingles(text_of(f.read_text()))) / len(mine)
            if o > 0.08: F(f'{o:.0%} of 8-word runs also appear in {f.stem}')
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args: sys.exit(__doc__)
    if args[0] == '--sync': sync(); sys.exit(0)
    if args[0] == '--orphans': orphans(); sys.exit(0)
    live = '--live' in args
    bad = 0
    for p in [a for a in args if not a.startswith('--')]:
        res = check(p, live)
        fails = [m for k, m in res if k == 'FAIL']
        bad += bool(fails)
        print(f"{'FAIL' if fails else 'PASS'} {p}")
        for k, m in res: print(f'  {k} {m}')
    sys.exit(1 if bad else 0)
