"""Amazon Creators API client (the shop's own Associates account). Plain HTTPS; no SDK needed.

  python3 shop/tools/amazon_creators.py search "day clock 12 inch" [pages] [key=value ...]
      filters: searchIndex=OfficeProducts brand=X minPrice=1500 maxPrice=8000 (cents) minReviewsRating=4
               minSavingPercent=20 sortBy=AvgCustomerReviews browseNodeId=123 deliveryFlags=Prime,FreeShipping
               availability=IncludeOutOfStock  json=1 (full JSON lines instead of the short list)
  python3 shop/tools/amazon_creators.py items B0XXXXXXX B0YYYYYYY ...      up to 10 ASINs a call
  python3 shop/tools/amazon_creators.py variations B0XXXXXXX [page]        sizes and colors of one listing
  python3 shop/tools/amazon_creators.py nodes 1069242 ...                  category tree: ancestors and children
  python3 shop/tools/amazon_creators.py refine "chore chart" [searchIndex] departments and brands Amazon suggests

Credentials live in .cache/shop/amazon-creators.txt (id=, secret=, version=; never in git, never printed).
Reference with every parameter, resource and rule: shop/AMAZON-CREATORS-API.md.
Limits: 1 request a second and 8,640 a day at the start (one call = one transaction, 10 ASINs included);
search gives 10 items a page and 10 pages at most. Access is lost after 30 days without a qualifying sale.
Docs: https://affiliate-program.amazon.com/creatorsapi/docs/
"""
import json, os, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
KEYFILE = os.path.join(HERE, '..', '..', '.cache', 'shop', 'amazon-creators.txt')
TOKEN_URL = {'3.1': 'https://api.amazon.com/auth/o2/token', '3.2': 'https://api.amazon.co.uk/auth/o2/token', '3.3': 'https://api.amazon.co.jp/auth/o2/token'}
API = 'https://creatorsapi.amazon'
TAG, MARKET = 'freshcalendar-20', 'www.amazon.com'
# The Associates policy asks automated agents to name themselves this way.
UA = 'Agent/FreshCalendarsShopTool'
_tok = {}
_last = [0.0]


def _creds():
    c = dict(l.strip().split('=', 1) for l in open(KEYFILE) if '=' in l)
    return c['id'], c['secret'], c.get('version', 'v3.1').lstrip('v')


def _post(url, body, headers):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'User-Agent': UA, **headers})
    try:
        with urllib.request.urlopen(req, timeout=30) as r: return r.status, json.loads(r.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        t = e.read().decode('utf8', 'ignore')
        try: return e.code, json.loads(t)
        except ValueError: return e.code, {'raw': t[:300]}


def token():
    if _tok.get('exp', 0) > time.time() + 60: return _tok['v']
    cid, sec, ver = _creds()
    s, r = _post(TOKEN_URL[ver], {'grant_type': 'client_credentials', 'client_id': cid, 'client_secret': sec, 'scope': 'creatorsapi::default'}, {})
    if s != 200 or 'access_token' not in r: raise SystemExit(f'token: {s} {str({k: v for k, v in r.items() if k != "access_token"})[:200]}')
    _tok.update(v=r['access_token'], exp=time.time() + int(r.get('expires_in', 3600)))
    return _tok['v']


def call(op, body):
    """POST /catalog/v1/<op>; returns (status, json). Keeps to one request a second and waits out a 429."""
    for attempt in range(4):
        wait = 1.05 - (time.time() - _last[0])
        if wait > 0: time.sleep(wait)
        s, r = _post(f'{API}/catalog/v1/{op}', {'marketplace': MARKET, 'partnerTag': TAG, **body}, {'Authorization': 'Bearer ' + token(), 'x-marketplace': MARKET})
        _last[0] = time.time()
        if s != 429: return s, r
        time.sleep(min(int(r.get('retryAfterSeconds') or 5 * (attempt + 1)), 60))
    return s, r


# Everything a product page or a filter can use. There is no customer review or star rating resource.
RES = ['itemInfo.title', 'itemInfo.features', 'itemInfo.byLineInfo', 'itemInfo.productInfo', 'itemInfo.manufactureInfo',
       'itemInfo.classifications', 'itemInfo.externalIds', 'itemInfo.technicalInfo', 'parentASIN',
       'images.primary.large', 'browseNodeInfo.browseNodes', 'browseNodeInfo.websiteSalesRank',
       'offersV2.listings.price', 'offersV2.listings.availability', 'offersV2.listings.merchantInfo',
       'offersV2.listings.dealDetails', 'offersV2.listings.condition', 'offersV2.listings.isBuyBoxWinner', 'offersV2.listings.type']
INT = {'minPrice', 'maxPrice', 'minReviewsRating', 'minSavingPercent', 'itemCount'}


def flat(it):
    """One item as a small dict: the facts a writer or a filter needs."""
    info = it.get('itemInfo') or {}; dv = lambda o, k: ((o or {}).get(k) or {}).get('displayValue')
    li = ((it.get('offersV2') or {}).get('listings') or [{}])[0]; pr = li.get('price') or {}
    dim = (info.get('productInfo') or {}).get('itemDimensions') or {}
    return {'asin': it.get('asin'), 'parent': it.get('parentASIN'), 'title': dv(info, 'title'),
            'brand': dv(info.get('byLineInfo'), 'brand'), 'model': dv(info.get('manufactureInfo'), 'model'),
            'price': (pr.get('money') or {}).get('amount'), 'was': ((pr.get('savingBasis') or {}).get('money') or {}).get('amount'),
            'off_pct': (pr.get('savings') or {}).get('percentage'), 'per_unit': (pr.get('pricePerUnit') or {}).get('displayAmount'),
            'stock': (li.get('availability') or {}).get('type'), 'seller': (li.get('merchantInfo') or {}).get('name'),
            'deal': (li.get('dealDetails') or {}).get('badge'), 'deal_ends': (li.get('dealDetails') or {}).get('endTime'),
            'rank': ((it.get('browseNodeInfo') or {}).get('websiteSalesRank') or {}).get('salesRank'),
            'nodes': [n.get('contextFreeName') for n in (it.get('browseNodeInfo') or {}).get('browseNodes') or []][:3],
            'color': dv(info.get('productInfo'), 'color'), 'size': dv(info.get('productInfo'), 'size'),
            'unit_count': dv(info.get('productInfo'), 'unitCount'),
            'dims': {k: f"{v.get('displayValue')} {v.get('unit')}" for k, v in dim.items() if v},
            'features': (info.get('features') or {}).get('displayValues') or [], 'url': it.get('detailPageURL')}


def search(keywords, pages=1, **f):
    """Up to 10 pages of 10. Returns (flat items, total count Amazon reports)."""
    out, total = [], None
    if 'deliveryFlags' in f and isinstance(f['deliveryFlags'], str): f['deliveryFlags'] = f['deliveryFlags'].split(',')
    for k in INT & set(f): f[k] = int(f[k])
    for p in range(1, min(pages, 10) + 1):
        s, r = call('searchItems', {'keywords': keywords, 'itemPage': p, 'itemCount': 10, 'resources': RES, **f})
        if s != 200: print(s, json.dumps(r)[:400], file=sys.stderr); break
        sr = r.get('searchResult') or {}; total = sr.get('totalResultCount', total)
        got = sr.get('items') or []; out += [flat(i) for i in got]
        if len(got) < 10: break
    return out, total


def items(asins):
    """Look up ASINs, 10 a call. Returns ({asin: flat item}, [errors])."""
    out, errs = {}, []
    for k in range(0, len(asins), 10):
        s, r = call('getItems', {'itemIds': asins[k:k + 10], 'itemIdType': 'ASIN', 'resources': RES})
        if s != 200: errs.append({'status': s, **r}); continue
        errs += r.get('errors') or []
        for i in ((r.get('itemsResult') or r.get('itemResults') or {}).get('items') or []): out[i['asin']] = flat(i)
    return out, errs


if __name__ == '__main__':
    if len(sys.argv) < 3: raise SystemExit(__doc__)
    cmd, a = sys.argv[1], sys.argv[2:]
    kv = dict(x.split('=', 1) for x in a if '=' in x and not x.startswith('B0')); a = [x for x in a if x.split('=', 1)[0] not in kv]
    as_json = kv.pop('json', None)
    line = lambda d: print(json.dumps(d) if as_json else f"{d['asin']} | ${d['price']} | {d['stock']} | {d['brand']} | {(d['title'] or '')[:90]}")
    if cmd == 'search':
        got, total = search(a[0], int(a[1]) if len(a) > 1 else 1, **kv)
        for d in got: line(d)
        print(f'-- {len(got)} shown of {total} matches', file=sys.stderr)
    elif cmd == 'items':
        got, errs = items(a)
        for d in got.values(): line(d)
        for e in errs: print('error:', json.dumps(e)[:200], file=sys.stderr)
    elif cmd == 'variations':
        s, r = call('getVariations', {'asin': a[0], 'variationPage': int(a[1]) if len(a) > 1 else 1, 'resources': RES + ['variationSummary.price.highestPrice', 'variationSummary.price.lowestPrice', 'variationSummary.variationDimension']})
        vr = r.get('variationsResult') or {}
        print(s, json.dumps(vr.get('variationSummary') or r)[:600])
        for i in vr.get('items') or []: print(i.get('asin'), '|', i.get('variationAttributes'), '|', flat(i)['price'])
    elif cmd == 'nodes':
        s, r = call('getBrowseNodes', {'browseNodeIds': a, 'resources': ['browseNodes.ancestor', 'browseNodes.children']})
        print(s, json.dumps(r)[:2500])
    elif cmd == 'refine':
        s, r = call('searchItems', {'keywords': a[0], 'searchIndex': a[1] if len(a) > 1 else 'All', 'itemCount': 1, 'resources': ['searchRefinements', 'itemInfo.title']})
        sr = r.get('searchResult') or {}
        print(s, 'matches', sr.get('totalResultCount'), json.dumps(sr.get('searchRefinements') or r)[:2500])
    else: raise SystemExit(__doc__)
