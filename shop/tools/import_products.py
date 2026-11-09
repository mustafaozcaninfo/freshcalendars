"""Import Amazon products into the shop without AI chips, hidden, resumable (shop-product skill, section 5).

Usage:
  python3 shop/tools/import_products.py create <candidates.json> [...]   create hidden product + offer + link + category
  python3 shop/tools/import_products.py verify                            read back every imported product: price, stock,
                                                                          listing; write listings/<id>.json; mark failures
  python3 shop/tools/import_products.py drop-failed                       delete products whose offer has no price or stock
  python3 shop/tools/import_products.py reconcile <candidates.json>     add products created after a stopped run's last save
  python3 shop/tools/import_products.py status                            counts by state and category

Candidates are JSON arrays of {"asin", "category": "<category slug>", "title"}. State lives in
.cache/shop/import/state.json (asin -> product id, offer id, category, state), so a run can stop and resume.
Every product is created with enabled false and in_sitemap false; it goes live only through the shop-product
page routine. The rate limit is shared: run one API script at a time; this one keeps about 1.05 s per call.
"""
import json, re, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fs import call, WORK  # noqa: E402

DIR = WORK / 'import'
STATE = DIR / 'state.json'
LIST = DIR / 'listings'
GAP = 1.05


def api(method, path, body=None):
    time.sleep(GAP)
    return call(method, path, body)


def load_state():
    return json.loads(STATE.read_text()) if STATE.exists() else {}


def save_state(st):
    STATE.write_text(json.dumps(st, indent=1))


def category_ids():
    out, page = {}, 1
    while True:
        s, d = api('GET', f'categories?per_page=100&page={page}')
        for c in d.get('data', []): out[c['slug']] = c['id']
        if page >= d.get('meta', {}).get('last_page', 1): break
        page += 1
    return out


def existing_asins():
    out, page = set(), 1
    while True:
        s, d = api('GET', f'offers?merchant=amazon&per_page=100&page={page}')
        out |= {o['merchant_offer_id'] for o in d.get('data', [])}
        if page >= d.get('meta', {}).get('last_page', 1): break
        page += 1
    return out


def create(files):
    st = load_state()
    cats = category_ids()
    have = existing_asins()
    rows, seen = [], set()
    for f in files:
        for r in json.loads(Path(f).read_text()):
            a = (r.get('asin') or '').strip().upper()
            if not re.fullmatch(r'[A-Z0-9]{10}', a) or a in seen: continue
            seen.add(a); rows.append({**r, 'asin': a})
    todo = [r for r in rows if r['asin'] not in st and r['asin'] not in have]
    print(f'{len(rows)} candidates, {len(todo)} new to import', flush=True)
    for i, r in enumerate(todo, 1):
        cid = cats.get(r['category'])
        if not cid: print('no category', r['category'], r['asin']); continue
        title = re.sub(r'\s+', ' ', r.get('title') or r['asin'])[:200]
        time.sleep(2.2)  # 4 calls a product: keep the whole run under 60 a minute
        s, p = api('POST', 'products', {'title': title, 'enabled': False, 'in_sitemap': False})
        if s != 201: print('product', s, r['asin'], str(p)[:200]); continue
        pid = p['data']['id']
        # offer and link back to back: an unlinked offer disappears within a second
        s, o = call('POST', 'offers', {'merchant': 'amazon', 'merchant_offer_id': r['asin'], 'title': title,
                                        'url_detail': f'https://www.amazon.com/dp/{r["asin"]}', 'locale': 'us'})
        oid = (o.get('data') or {}).get('id')
        s2, l = call('POST', f'offers/{oid}/products', {'product_ids': [pid]}) if oid else (0, {})
        if oid and s2 != 200:  # the offer vanished before the link: creating it again restores it
            time.sleep(GAP)
            s, o = call('POST', 'offers', {'merchant': 'amazon', 'merchant_offer_id': r['asin'], 'title': title,
                                            'url_detail': f'https://www.amazon.com/dp/{r["asin"]}', 'locale': 'us'})
            oid = (o.get('data') or {}).get('id')
            s2, l = call('POST', f'offers/{oid}/products', {'product_ids': [pid]}) if oid else (0, {})
        api('POST', f'products/{pid}/categories', {'category_ids': [cid]})
        st[r['asin']] = {'pid': pid, 'oid': oid, 'category': r['category'], 'state': 'created' if s2 == 200 else 'link_failed', 'title_hint': title}
        if i % 10 == 0 or i == len(todo):
            save_state(st); print(f'{i}/{len(todo)} created', flush=True)
    save_state(st)


def verify():
    st = load_state(); LIST.mkdir(parents=True, exist_ok=True)
    for a, x in st.items():
        if x['state'] not in ('created', 'link_failed', 'no_offer_yet'): continue
        s, d = api('GET', f"products/{x['pid']}?include=offers")
        offers = (d.get('data') or {}).get('offers') or []
        o = next((o for o in offers if o.get('merchant') == 'amazon'), None)
        if not o: x['state'] = 'no_offer'; continue
        if not o.get('price') or not o.get('stock_available'): x['state'] = 'unavailable'; continue
        x['state'] = 'ready'
        (LIST / f"{x['pid']}.json").write_text(json.dumps({'id': x['pid'], 'asin': a, 'category': x['category'],
            'listing': o['title'] + '\n' + '\n'.join('- ' + str(f) for f in (o.get('features') or [])),
            'features_count': len(o.get('features') or []), 'price_usd': float(o['price']),
            'price_full_usd': float(o['price_full']) if o.get('price_full') else None}, indent=1))
    save_state(st); status()


def drop_failed():
    st = load_state()
    for a, x in st.items():
        if x['state'] in ('no_offer', 'unavailable'):
            if x.get('oid'): api('DELETE', f"offers/{x['oid']}")
            s, _ = api('DELETE', f"products/{x['pid']}")
            x['state'] = 'dropped' if s == 204 else x['state']
    save_state(st); status()


def reconcile(files):
    """Add products a stopped run created after its last save (hidden, linked, missing from state)."""
    st = load_state(); known = {x['pid'] for x in st.values()}
    cand = {}
    for f in files:
        for r in json.loads(Path(f).read_text()): cand[(r.get('asin') or '').upper()] = r
    page, found = 1, 0
    while True:
        s, d = api('GET', f'products?enabled=0&per_page=100&page={page}')
        for p in d.get('data', []):
            if p['id'] in known or p['id'] < 326: continue
            s2, full = api('GET', f"products/{p['id']}?include=offers")
            o = next((o for o in (full.get('data') or {}).get('offers') or [] if o.get('merchant') == 'amazon'), None)
            if o and o['merchant_offer_id'] in cand and o['merchant_offer_id'] not in st:
                st[o['merchant_offer_id']] = {'pid': p['id'], 'oid': o['id'], 'category': cand[o['merchant_offer_id']]['category'],
                                              'state': 'created', 'title_hint': p['title']}
                found += 1
        if page >= d.get('meta', {}).get('last_page', 1): break
        page += 1
    save_state(st); print('reconciled', found)


def status():
    st = load_state()
    from collections import Counter
    print(dict(Counter(x['state'] for x in st.values())))
    ready = Counter(x['category'] for x in st.values() if x['state'] == 'ready')
    print('ready by category:', dict(sorted(ready.items())))


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    DIR.mkdir(parents=True, exist_ok=True)
    {'create': lambda: create(a[1:]), 'reconcile': lambda: reconcile(a[1:]), 'verify': verify, 'drop-failed': drop_failed, 'status': status}[a[0]]()
