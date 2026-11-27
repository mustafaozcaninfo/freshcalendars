"""Add a block of links to sibling products at the end of each product page.

  python3 shop/tools/more_links.py <category-slug> [--n 8] [--apply]     one category, reads each product from the API
  python3 shop/tools/more_links.py all [--n 8] [--apply] [--limit 500]   every enabled product, from the catalog file

Why: the platform's "You might also like" row shows four products and has no setting for more (checked in the API
and the admin panel, Nov. 28, 2026), and a category page lists only its first 60 products to a crawler. A product
past the 60th had almost no link pointing at it. This block gives every product N links from sibling product pages:
inside a category the products form a ring by id, and each page links the next N. The links are in the stored HTML,
so crawlers that run no script see them.

The block sits between <!--fc-more--> markers and is replaced on every run, so run it again after products are
added or hidden (a hidden product would leave dead links). `all` needs a fresh .cache/shop/audit/products-now.json
(fetchall.py) and gives each product one home category, its first. Without --apply nothing is written.
"""
import collections, html, json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import WORK, call  # noqa: E402

MARK = re.compile(r'\s*<!--fc-more-->.*?<!--/fc-more-->', re.S)
HOST = 'https://shop.freshcalendars.com'


def block(cat_slug, cat_title, sibs):
    li = ''.join(f'<li><a href="{HOST}/products/{s["slug"]}">{html.escape(s["name"])}</a></li>' for s in sibs)
    return (f'\n<!--fc-more--><div class="fc-more"><h3>More {html.escape(cat_title.lower())}</h3><ul>{li}</ul>'
            f'<p><a href="{HOST}/categories/{cat_slug}">See all {html.escape(cat_title.lower())}</a></p></div><!--/fc-more-->')


def ring(items, n):
    """items sorted by id; each gets the next n of the ring (fewer in a small category)."""
    k = len(items); n = min(n, k - 1)
    return {it['id']: [items[(i + j) % k] for j in range(1, n + 1)] for i, it in enumerate(items)}


def get(path):
    for _ in range(6):
        s, r = call('GET', path)
        if s != 429: return s, r
        time.sleep(20)
    return s, r


def write(pid, content, new_block, apply):
    new = MARK.sub('', content or '').rstrip() + new_block
    if new == content: return 'same'
    if not apply: return 'would write'
    for _ in range(5):
        s, r = call('PATCH', f'products/{pid}', {'content': new})
        if s != 429: break
        time.sleep(20)
    time.sleep(1.05)
    return s


def one_category(slug, n, apply):
    cats, page = [], 1
    while True:   # the API gives 100 a page at most
        s, r = get(f'categories?per_page=100&page={page}'); cats += r.get('data', []); time.sleep(1.05)
        if len(r.get('data', [])) < 100: break
        page += 1
    c = next(x for x in cats if x['slug'] == slug)
    items, page = [], 1
    while True:
        s, r = get(f"categories/{c['id']}/products?per_page=100&page={page}")
        items += [{'id': p['id'], 'slug': p['slug'], 'name': p['title']} for p in r.get('data', []) if p.get('enabled')]
        if len(r.get('data', [])) < 100: break
        page += 1; time.sleep(1.05)
    items.sort(key=lambda x: x['id']); links = ring(items, n); res = collections.Counter()
    for it in items:
        s, r = get(f"products/{it['id']}"); time.sleep(1.05)
        if s != 200: res[f'get {s}'] += 1; continue
        res[write(it['id'], r['data'].get('content'), block(slug, c['title'], links[it['id']]), apply)] += 1
    print(slug, len(items), 'products |', dict(res))


def everything(n, apply, limit):
    ps = [p for p in json.load(open(WORK / 'audit' / 'products-now.json')) if p.get('enabled') and p.get('categories')]
    by = collections.defaultdict(list)
    for p in ps:
        c = p['categories'][0]; by[(c['slug'], c['title'])].append(p)
    lp = WORK / 'audit' / 'more-links-log.json'; done = set(json.load(open(lp))) if lp.exists() else set()
    res, wrote = collections.Counter(), 0
    for (slug, title), group in sorted(by.items()):
        if len(group) < 2: res['alone in category'] += 1; continue
        items = sorted(({'id': p['id'], 'slug': p['slug'], 'name': p['title']} for p in group), key=lambda x: x['id'])
        links = ring(items, n); content = {p['id']: p.get('content') for p in group}
        for it in items:
            if it['id'] in done: res['done before'] += 1; continue
            if limit and wrote >= limit: res['left for the next run'] += 1; continue
            out = write(it['id'], content[it['id']], block(slug, title, links[it['id']]), apply)
            res[out] += 1
            if out == 200:
                done.add(it['id']); wrote += 1
                if wrote % 50 == 0: json.dump(sorted(done), open(lp, 'w'))
    if apply: json.dump(sorted(done), open(lp, 'w'))
    print(len(ps), 'products in', len(by), 'categories |', dict(res))


if __name__ == '__main__':
    a = sys.argv[1:] or sys.exit(__doc__)
    n = int(a[a.index('--n') + 1]) if '--n' in a else 8
    limit = int(a[a.index('--limit') + 1]) if '--limit' in a else 0
    if a[0] == 'all': everything(n, '--apply' in a, limit)
    else: one_category(a[0], n, '--apply' in a)
