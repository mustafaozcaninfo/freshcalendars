"""Find shop articles whose price tables no longer match the retailer price.

Usage:
  python3 shop/tools/article_prices.py                 every live article in the registry
  python3 shop/tools/article_prices.py <slug> [...]    only these articles
  python3 shop/tools/article_prices.py --due           only articles whose refresh_by date has passed
  python3 shop/tools/article_prices.py --record <slug> [...]   save today's prices as the checked ones

The registry keeps, per article, the price each product had when the tables were last checked
("prices", written by article_publish.py and by --record). For each article this reads the live
body and every product the registry lists for it, then reports
  CHANGED  the price moved and the old one is printed in the article (the table is stale)
  CHECK    no price on record for this product and its current price is not printed in the
           article: either the article never priced it or the table is stale, so look
  GONE     the product is disabled, out of stock or has no USD price (drop it or replace it)
  DUE      the article's refresh_by date has passed
A price that moved on a product the article does not price is listed as "moved" and not counted.
Without --record it changes nothing. Fix a stale article in its draft (the price cell and every
figure computed from it, from the price and the count, never from a rounded unit cost), set the
new "Prices checked" date and republish with article_publish.py, which records the new prices. Exit code 1 when anything is reported. About one API call a
second: one per article and one per product.
"""
import datetime as dt, html, json, os, re, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import ROOT, call  # noqa: E402

REGISTRY = ROOT / 'shop' / 'articles' / 'registry.json'


def offer(pid, cache={}):
    """(price or None, reason) for the product's best live USD offer."""
    if pid in cache: return cache[pid]
    time.sleep(1.05)
    s, r = call('GET', f'products/{pid}?include=offers')
    p = r.get('data') or {}
    if s != 200 or not p.get('enabled'):
        out = (None, 'disabled or missing', p.get('title') or str(pid))
    else:
        live = [o for o in p.get('offers') or [] if o.get('enabled') and o.get('stock_available')
                and o.get('currency') == 'USD' and float(o.get('price') or 0) > 0]
        out = (min(float(o['price']) for o in live), '', p.get('title')) if live else (None, 'no live USD offer', p.get('title'))
    cache[pid] = out
    return out


def prices_for(pids):
    """{product id: price} for the products with a live USD offer; article_publish.py stores it."""
    return {str(p): offer(p)[0] for p in pids if offer(p)[0] is not None}


def main(args):
    due_only, record = '--due' in args, '--record' in args
    slugs = [a for a in args if not a.startswith('--')]
    full = json.load(open(REGISTRY))
    reg = [r for r in full if r.get('enabled') and r.get('id')]
    if record and not [a for a in args if not a.startswith('--')]: sys.exit('--record needs the slugs you have just checked')
    today = dt.date.today().isoformat()
    if slugs: reg = [r for r in reg if r['slug'] in slugs]
    if due_only: reg = [r for r in reg if (r.get('refresh_by') or '9999') < today]
    found = 0
    for r in reg:
        time.sleep(1.05)
        s, a = call('GET', f"articles/{r['id']}")
        body = html.unescape(re.sub(r'<[^>]+>', ' ', (a.get('data') or {}).get('content') or ''))
        if s != 200 or not body.strip():
            print(f"{r['slug']}: could not read the live article ({s})"); found += 1; continue
        printed = set(re.findall(r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)', body))
        printed = {f'{float(x.replace(",", "")):.2f}' for x in printed}
        lines = []
        if (r.get('refresh_by') or '9999') < today: lines.append(f"  DUE      refresh_by {r['refresh_by']}")
        known, moved = r.get('prices') or {}, []
        for pid in r.get('products') or []:
            price, why, name = offer(pid)
            was = known.get(str(pid))
            if price is None: lines.append(f'  GONE     {pid} {name[:60]}: {why}')
            elif was is None:
                if printed and f'{price:.2f}' not in printed: lines.append(f'  CHECK    {pid} {name[:60]}: now ${price:.2f}, not printed in the article')
            elif abs(was - price) >= 0.005:
                if f'{was:.2f}' in printed: lines.append(f'  CHANGED  {pid} {name[:60]}: ${was:.2f} is now ${price:.2f}')
                else: moved.append(f'  moved    {pid} {name[:60]}: ${was:.2f} is now ${price:.2f} (not priced in the article)')
        if record:
            r['prices'] = prices_for(r.get('products') or [])
            r['price_checked'] = today
            lines = [ln for ln in lines if 'GONE' in ln or 'DUE' in ln]
        note = '' if printed else ' (no prices printed)'
        print(f"{r['slug']}: {'ok' if not lines else str(len(lines)) + ' to fix'}{note}, prices checked {r.get('price_checked') or 'not recorded'}", flush=True)
        for ln in lines + moved: print(ln, flush=True)
        found += len(lines)
    if record:
        REGISTRY.write_text(json.dumps(full, indent=1) + '\n')
    print(f'{len(reg)} articles, {found} lines to fix')
    sys.exit(1 if found else 0)


if __name__ == '__main__':
    main(sys.argv[1:])
