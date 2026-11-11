"""Check a shop product-page draft against the shop-product skill rules before it is written to the store.

Usage:
  python3 shop/tools/product_check.py <draft.json> [...]          check drafts (exit 1 on any FAIL)
  python3 shop/tools/product_check.py --sync                      pull every product page into the uniqueness corpus (API)
  python3 shop/tools/product_check.py --live <draft.json> [...]   also confirm every link answers 200 and the
                                                                 product's offer is priced and in stock (API)

A draft is JSON (see .claude/skills/shop-product/SKILL.md): id, listing (the offer title and feature bullets,
verbatim), computed (optional list of numbers we worked out, with how), title, meta_title, link_title, subtitle,
summary, highlights, meta_description, content, category_ids. Stdlib only.
"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from article_check import BANNED, FAKE_TEST, URGENCY, text_of, load, shingles  # noqa: E402
from fs import call, WORK  # noqa: E402
from pathlib import Path  # noqa: E402

CORPUS = WORK / 'products' / 'corpus.json'      # every product page in the store (--sync)
DRAFTS = WORK / 'products' / 'drafts'
BOILER = r'<p>\s*How this page was made:.*?</p>'  # the one shared sentence, left out of the overlap test

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
HYPE = r'perfect|ideal|best|premium|luxury|must[- ]have|amazing|stunning|great|excellent|favorite|beloved|top-rated|bestselling|best-selling|popular|loved by'
OUTCOME = r'anxiety|stress|depress|heal|healing|mental health|happier|happiness|calm(?:er|ing)? (?:mind|you)|faith|spiritual|closer to god|grades? (?:improve|better)|productiv(?:e|ity) (?:boost|increase)'
NUM = r'(?<![\w.])\d+(?:[.,]\d+)?(?![\w])'


def numbers(s):
    return {n.replace(',', '') for n in re.findall(NUM, s)}


def page_of(p):
    """The parts of a product page that must be unique, from a store record or a draft."""
    c = p.get('content') or ''
    body = text_of(re.sub(BOILER, ' ', c, flags=re.S | re.I))
    body = text_of(re.sub(r'<caption\b.*?</caption>', ' ', body))
    links = sorted(set(u.split('?')[0].rstrip('/') for u in re.findall(r'<a\b[^>]*href="([^"]+)"', c, re.I)))
    h3 = [text_of(x).lower() for x in re.findall(r'<h3\b[^>]*>(.*?)</h3>', c, re.S | re.I)]
    return {'id': p.get('id'), 'title': p.get('title') or '', 'subtitle': p.get('subtitle') or '', 'summary': p.get('summary') or '',
            'meta_description': p.get('meta_description') or '', 'meta_title': p.get('meta_title') or '', 'link_title': p.get('link_title') or '',
            'highlights': p.get('highlights') or [], 'body': body, 'links': links, 'h3': h3}


def sync():
    """Pull every product page (enabled or not) into the corpus for the uniqueness checks."""
    out, page = [], 1
    while True:
        s, d = call('GET', f'products?per_page=100&page={page}')
        out += [page_of(p) for p in d.get('data', [])]
        if page >= d.get('meta', {}).get('last_page', 1): break
        page += 1
    CORPUS.parent.mkdir(parents=True, exist_ok=True)
    CORPUS.write_text(json.dumps(out))
    print('synced', len(out), 'product pages')


def others(me):
    pages = [p for p in load(CORPUS, []) if p['id'] != me]
    if DRAFTS.exists():
        drafted = {}
        for f in DRAFTS.glob('*.json'):
            x = load(f, None)
            if x and x.get('id') != me: drafted[x.get('id')] = page_of(x)
        pages = [p for p in pages if p['id'] not in drafted] + list(drafted.values())
    return pages


def overlap(a, b, n):
    A, B = shingles(a, n), shingles(b, n)
    return len(A & B) / len(A) if A else 0.0


def check(path, live=False):
    d = load(path, None)
    if d is None: return [('FAIL', f'{path}: not valid JSON')]
    out = []
    F = lambda m: out.append(('FAIL', m))
    W = lambda m: out.append(('WARN', m))
    need = ('id', 'category_slug', 'listing', 'title', 'meta_title', 'link_title', 'subtitle', 'summary', 'highlights', 'meta_description', 'content', 'category_ids')
    for k in need:
        if not d.get(k): F(f'missing field: {k}')
    if out: return out
    listing = d['listing']
    allowed = numbers(listing) | {str(c.get('value')) for c in d.get('computed', [])} | numbers(' '.join(c.get('value_text', '') for c in d.get('computed', [])))

    # Lengths
    t, mt, lt, st, sm, md = d['title'], d['meta_title'], d['link_title'], d['subtitle'], d['summary'], d['meta_description']
    if not 30 <= len(t) <= 70: F(f'title {len(t)} chars (30-70)')
    if not 30 <= len(mt) <= 60: F(f'meta_title {len(mt)} chars (30-60)')
    if not 10 <= len(lt) <= 40: F(f'link_title {len(lt)} chars (10-40)')
    if not 60 <= len(st) <= 160: F(f'subtitle {len(st)} chars (60-160)')
    sents = [s for s in re.split(r'(?<=[.])\s+', sm.strip()) if s]
    if not 2 <= len(sents) <= 3 or len(sm) > 420: F(f'summary: 2-3 sentences, 420 chars max (now {len(sents)} sentences, {len(sm)} chars)')
    if not 120 <= len(md) <= 155: F(f'meta_description {len(md)} chars (120-155)')
    hl = d['highlights']
    if not 4 <= len(hl) <= 7: F(f'{len(hl)} highlights (4-7)')
    for h in hl:
        if len(h) > 110: F(f'highlight over 110 chars: "{h[:50]}..."')
        if h.rstrip().endswith('.'): W(f'highlight ends with a period: "{h[:40]}"')
    # Brand or line name from the listing must lead the title
    first = re.findall(r'[A-Za-z0-9]+', listing.split('\n')[0])[:6]
    if not any(w.lower() in t.lower().split()[:3] for w in first if len(w) > 2): F('title must start with the brand or product line named in the listing')

    # Content structure
    c = d['content']
    if re.search(r'<h[12]\b', c, re.I): F('content: use <h3> only (the page already has H1 and H2s)')
    h3 = [text_of(x) for x in re.findall(r'<h3\b[^>]*>(.*?)</h3>', c, re.S | re.I)]
    if len(h3) < 2: F(f'content: {len(h3)} H3s (2 or more)')
    body = text_of(c); words = len(body.split())
    if not 220 <= words <= 650: F(f'content: {words} words (220-650)')
    tables = re.findall(r'<table\b.*?</table>', c, re.S | re.I)
    if not tables: F('content: one spec table from the listing is required')
    for tb in tables:
        if not re.search(r'<th\b', tb, re.I): F('table needs a <th> header row')
        if not re.search(r'<caption\b', tb, re.I): F('table needs a <caption> naming the source')
        if not re.search(r'class="fc-table(?: fc-spec)?"', c[:c.find(tb)][-60:]): F('wrap the table in <div class="fc-table fc-spec">')
    if not re.search(r'maker listing|listing', body, re.I): F('content must say where the facts come from (the maker listing)')
    if not re.search(r'do not test|did not test|not tested by hand', body, re.I): F('content must end with the how-this-page-was-made line (we do not test by hand)')

    # Links
    links = re.findall(r'<a\b[^>]*href="([^"]+)"', c, re.I)
    if not [u for u in links if re.match(r'https://shop\.freshcalendars\.com/categories/', u)]: F('link the product category page')
    if not [u for u in links if re.match(r'https://shop\.freshcalendars\.com/articles/', u)]: F('link 1-2 related shop articles')
    if not [u for u in links if re.match(r'https://freshcalendars\.com/', u)]: F('link 1 freshcalendars.com printable or date page')
    if re.search(r'<a\b[^>]*>\s*</a>', c): F('a link with no text (broken sentence)')
    if re.search(r'(?:,| and| or| the| to)\s*</p>', c): F('a paragraph ends mid-sentence')
    if len(links) > 7: W(f'{len(links)} links in content; 3-6 is enough')
    if any(re.search(r'amazon\.|amzn\.|ebay\.|walmart\.|etsy\.', u) for u in links): F('no retailer links in content: the page has its own buy buttons')

    # Writing rules over every visible field
    vis = ' '.join([t, st, sm, md, ' '.join(hl), body])
    low = vis.lower()
    # A hype word inside the product's own capitalized name ("The Great Big Grid") is the name, not praise
    for name in re.findall(r'\b(?:[A-Z][\w\'&-]*\s+){0,3}[A-Z][\w\'&-]*', listing.split('\n')[0]):
        if len(name.split()) >= 2 and re.search(r'\b(?:' + HYPE + r')\b', name.lower()):
            low = low.replace(re.sub(r'^(?:the|a|an)\s+', '', name.lower()), ' ')
    for name, rx in (('banned word', BANNED), ('hype word', HYPE), ('first-hand testing claim', FAKE_TEST), ('false urgency', URGENCY), ('health, mood or faith outcome', OUTCOME)):
        hits = sorted(set(m.group(0) for m in re.finditer(r'\b(?:' + rx + r')\b', low)))
        if hits: F(f'{name}: {", ".join(hits[:6])}')
    if '—' in vis or ' -- ' in vis: F('no em dashes')
    if '!' in vis: F('no exclamation marks')
    if re.search(r'\$\s?\d|\bUSD\b|\bprice[ds]?\b.{0,20}\d', vis, re.I): F('no prices in text: the page shows the live price')
    if re.search(r'\b(?:we|our team|i)\b (?:love|recommend|use|tried)', low): F('no first-person endorsement')
    # Every number must come from the listing or the computed list
    vis_nodate = re.sub(r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.? \d{1,2}, \d{4}', ' ', vis)
    stray = sorted(n for n in numbers(vis_nodate) - allowed if n not in {'1', '2'} and not re.fullmatch(r'20\d\d', n))
    if stray: F(f'numbers not in the listing or computed list: {", ".join(stray[:8])}')

    # Unique against every other product page in the store and every other draft
    if not d.get('maker_source'): F('maker_source: the maker site URL you checked, or "none found"')
    me = page_of(d)
    for h in hl:
        if overlap(h, sm, 5) > 0.5: F(f'highlight repeats the summary: "{h[:50]}"')
    for o in others(d['id']):
        for k in ('title', 'meta_title', 'link_title', 'subtitle', 'meta_description'):
            if me[k] and me[k].lower() == o[k].lower(): F(f'{k} is identical to product {o["id"]}')
        if o['summary'] and overlap(me['summary'], o['summary'], 5) > 0.3: F(f'summary shares wording with product {o["id"]}')
        if o['body'] and overlap(me['body'], o['body'], 8) > 0.08: F(f'{overlap(me["body"], o["body"], 8):.0%} of 8-word runs also appear on product {o["id"]}')
        same_h3 = set(me['h3']) & set(o['h3'])
        if same_h3: F(f'H3 reused from product {o["id"]}: "{sorted(same_h3)[0]}"')
        own = 'https://shop.freshcalendars.com/categories/' + str(d.get('category_slug', ''))  # every page links its own category
        shared = (set(me['links']) & set(o['links'])) - {own}
        if me['links'] and me['links'] == o['links']: F(f'same set of links as product {o["id"]}')
        elif len(shared) > 2: F(f'{len(shared)} links shared with product {o["id"]} (2 at most): vary the category, article and printable')

    if live:
        own = 'https://shop.freshcalendars.com/categories/' + str(d.get('category_slug', ''))
        for u in sorted(set(links)):
            code = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-A', UA, u], capture_output=True, text=True).stdout
            # a hidden category opens once 5 products are live (publish_products --open-categories), so its own
            # category may still answer 404 while its first products are published; FC_ALLOW_HIDDEN_OWN=1 allows that
            if code == '404' and u.rstrip('/') == own and os.environ.get('FC_ALLOW_HIDDEN_OWN') == '1':
                W(f'live: own category {u} is still hidden; run publish_products.py --open-categories'); continue
            if code != '200': F(f'live: {u} answers {code}')
        s, r = call('GET', f"products/{d['id']}?include=offers")
        offers = (r.get('data') or {}).get('offers') or []
        if not any(o.get('price') and o.get('stock_available') for o in offers): F('live: no priced, in-stock offer on this product')
    return out


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    if a[0] == '--sync': sync(); sys.exit(0)
    live = '--live' in a
    bad = 0
    for p in [x for x in a if not x.startswith('--')]:
        res = check(p, live)
        fails = [m for k, m in res if k == 'FAIL']
        bad += bool(fails)
        print(f"{'FAIL' if fails else 'PASS'} {p}")
        for k, m in res: print(f'  {k} {m}')
    sys.exit(1 if bad else 0)
