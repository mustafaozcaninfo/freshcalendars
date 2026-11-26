"""Amazon Creators API client for product search and lookup (the shop's own Associates account).

  python3 shop/tools/amazon_creators.py search "lego advent calendar 2026" [pages]
  python3 shop/tools/amazon_creators.py items B0XXXXXXX B0YYYYYYY

Credentials live in .cache/shop/amazon-creators.txt (id=, secret=, version=; never in git, never printed).
Token: Login with Amazon client-credentials grant, scope creatorsapi::default; the endpoint follows the
credential version (3.1 North America). Calls go to https://creatorsapi.amazon with the partner tag
freshcalendar-20. Access needs an approved Associates account with 10 sales in 30 days and can take up to
48 hours after the credential is made (error AssociateNotEligible until then). Docs:
https://affiliate-program.amazon.com/creatorsapi/docs/
"""
import json, os, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
KEYFILE = os.path.join(HERE, '..', '..', '.cache', 'shop', 'amazon-creators.txt')
TOKEN_URL = {'3.1': 'https://api.amazon.com/auth/o2/token', '3.2': 'https://api.amazon.co.uk/auth/o2/token', '3.3': 'https://api.amazon.co.jp/auth/o2/token'}
API = 'https://creatorsapi.amazon'
TAG, MARKET = 'freshcalendar-20', 'www.amazon.com'
_tok = {}


def _creds():
    c = dict(l.strip().split('=', 1) for l in open(KEYFILE) if '=' in l)
    return c['id'], c['secret'], c.get('version', 'v3.1').lstrip('v')


def _post(url, body, headers):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', **headers})
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
    """POST /catalog/v1/<op>; returns (status, json)."""
    return _post(f'{API}/catalog/v1/{op}', {'marketplace': MARKET, 'partnerTag': TAG, **body}, {'Authorization': 'Bearer ' + token(), 'x-marketplace': MARKET})


RES = ['itemInfo.title', 'itemInfo.features', 'itemInfo.byLineInfo', 'offersV2.listings.price', 'offersV2.listings.availability']

if __name__ == '__main__':
    if len(sys.argv) < 3: raise SystemExit(__doc__)
    if sys.argv[1] == 'search':
        pages = int(sys.argv[3]) if len(sys.argv) > 3 else 1
        for p in range(1, pages + 1):
            s, r = call('searchItems', {'keywords': sys.argv[2], 'itemPage': p, 'itemCount': 10, 'resources': RES})
            if s != 200: print(s, json.dumps(r)[:400]); break
            for it in (r.get('searchResult') or {}).get('items') or []:
                print(it.get('asin'), '|', ((it.get('itemInfo') or {}).get('title') or {}).get('displayValue', '')[:110])
            time.sleep(1.1)
    else:
        s, r = call('getItems', {'itemIds': sys.argv[2:], 'itemIdType': 'ASIN', 'resources': RES})
        print(s, json.dumps(r)[:1500])
