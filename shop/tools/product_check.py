"""Check a shop product-page draft against the shop-product skill rules before it is written to the store.

Usage:
  python3 shop/tools/product_check.py <draft.json> [...]          check drafts (exit 1 on any FAIL)
  python3 shop/tools/product_check.py --live <draft.json> [...]   also confirm every link answers 200 and the
                                                                 product's offer is priced and in stock (API)

A draft is JSON (see .claude/skills/shop-product/SKILL.md): id, listing (the offer title and feature bullets,
verbatim), computed (optional list of numbers we worked out, with how), title, meta_title, link_title, subtitle,
summary, highlights, meta_description, content, category_ids. Stdlib only.
"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from article_check import BANNED, FAKE_TEST, URGENCY, text_of, load  # noqa: E402
from fs import call  # noqa: E402

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
HYPE = r'perfect|ideal|best|premium|luxury|must[- ]have|amazing|stunning|great|excellent|favorite|beloved|top-rated|bestselling|best-selling|popular|loved by'
OUTCOME = r'anxiety|stress|depress|heal|healing|mental health|happier|happiness|calm(?:er|ing)? (?:mind|you)|faith|spiritual|closer to god|grades? (?:improve|better)|productiv(?:e|ity) (?:boost|increase)'
NUM = r'(?<![\w.])\d+(?:[.,]\d+)?(?![\w])'


def numbers(s):
    return {n.replace(',', '') for n in re.findall(NUM, s)}


def check(path, live=False):
    d = load(path, None)
    if d is None: return [('FAIL', f'{path}: not valid JSON')]
    out = []
    F = lambda m: out.append(('FAIL', m))
    W = lambda m: out.append(('WARN', m))
    need = ('id', 'listing', 'title', 'meta_title', 'link_title', 'subtitle', 'summary', 'highlights', 'meta_description', 'content', 'category_ids')
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
    if len(links) > 7: W(f'{len(links)} links in content; 3-6 is enough')
    if any(re.search(r'amazon\.|amzn\.|ebay\.|walmart\.|etsy\.', u) for u in links): F('no retailer links in content: the page has its own buy buttons')

    # Writing rules over every visible field
    vis = ' '.join([t, st, sm, md, ' '.join(hl), body])
    low = vis.lower()
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

    if live:
        for u in sorted(set(links)):
            code = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-A', UA, u], capture_output=True, text=True).stdout
            if code != '200': F(f'live: {u} answers {code}')
        s, r = call('GET', f"products/{d['id']}?include=offers")
        offers = (r.get('data') or {}).get('offers') or []
        if not any(o.get('price') and o.get('stock_available') for o in offers): F('live: no priced, in-stock offer on this product')
    return out


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    live = '--live' in a
    bad = 0
    for p in [x for x in a if not x.startswith('--')]:
        res = check(p, live)
        fails = [m for k, m in res if k == 'FAIL']
        bad += bool(fails)
        print(f"{'FAIL' if fails else 'PASS'} {p}")
        for k, m in res: print(f'  {k} {m}')
    sys.exit(1 if bad else 0)
