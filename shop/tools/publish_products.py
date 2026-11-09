"""Write checked product-page drafts to the store and publish them (shop-product skill, section 5 steps 7-8).

Usage:
  python3 shop/tools/publish_products.py <draft.json> [...] [--limit N] [--no-live]
  python3 shop/tools/publish_products.py --open-categories      enable hidden categories that now hold 5+ live products

For each draft: rerun product_check (with --live link and stock checks unless --no-live), back up the current
product, PATCH the page fields with enabled true and in_sitemap true, and set the category. Stops a draft on any
FAIL. Clears the cache once at the end. Paced under the shared rate limit (about 4 calls a product).
Results go to .cache/shop/products/published.json.
"""
import json, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fs import call, backup, WORK  # noqa: E402
import product_check as pc  # noqa: E402

FIELDS = ('title', 'meta_title', 'link_title', 'subtitle', 'summary', 'highlights', 'meta_description', 'content')
LOG = WORK / 'products' / 'published.json'


def api(m, p, b=None):
    time.sleep(1.05)
    return call(m, p, b)


def publish(paths, live=True, limit=None):
    log = json.loads(LOG.read_text()) if LOG.exists() else {}
    n = 0
    for p in paths:
        if limit and n >= limit: break
        d = json.load(open(p))
        res = pc.check(p, live=live)
        fails = [m for k, m in res if k == 'FAIL']
        if fails:
            print('SKIP', d['id'], fails[:2]); log[str(d['id'])] = {'state': 'check_failed', 'fails': fails}; continue
        s, cur = api('GET', f"products/{d['id']}")
        if s != 200: print('SKIP', d['id'], 'not found'); continue
        backup(f"product-{d['id']}-before-page-{int(time.time())}", cur['data'])
        body = {k: d[k] for k in FIELDS}
        body.update({'enabled': True, 'in_sitemap': True})
        s, r = api('PATCH', f"products/{d['id']}", body)
        if s != 200: print('FAIL', d['id'], s, str(r)[:200]); log[str(d['id'])] = {'state': f'api_{s}'}; continue
        api('POST', f"products/{d['id']}/categories", {'category_ids': d['category_ids']})
        log[str(d['id'])] = {'state': 'published', 'slug': r['data']['slug'], 'at': time.strftime('%Y-%m-%dT%H:%M:%S')}
        n += 1
        if n % 10 == 0: LOG.write_text(json.dumps(log, indent=1)); print(n, 'published', flush=True)
    LOG.parent.mkdir(parents=True, exist_ok=True); LOG.write_text(json.dumps(log, indent=1))
    api('POST', 'store/clear-cache')
    print('published', n)


def open_categories():
    s, d = api('GET', 'categories?per_page=100&enabled=0')
    for c in d.get('data', []):
        s, pr = api('GET', f"categories/{c['id']}/products?per_page=100")
        live = sum(1 for x in pr.get('data', []) if x.get('enabled'))
        if live >= 5:
            api('PATCH', f"categories/{c['id']}", {'enabled': True}); print('opened', c['slug'], live)
        else:
            print('still hidden', c['slug'], live)
    api('POST', 'store/clear-cache')


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    if a[0] == '--open-categories': open_categories(); sys.exit(0)
    lim = int(a[a.index('--limit') + 1]) if '--limit' in a else None
    publish([x for x in a if x.endswith('.json')], live='--no-live' not in a, limit=lim)
