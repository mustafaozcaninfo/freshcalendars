"""Publish (or schedule, or update) one shop article draft after it passes article_check.

Usage:
  python3 shop/tools/article_publish.py <draft.json> [--dry-run]

Runs article_check with --live first and stops on any FAIL. Creates the article (or updates the
one with the same slug in the registry), sets a stock hero/listing/social image not used by another
article, clears the cache and records the article in shop/articles/registry.json.
A future published_at schedules it: the platform keeps it hidden and publishes it at that time.
"""
import datetime as dt, json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import call, backup  # noqa: E402
import article_check as ac  # noqa: E402
from article_prices import prices_for  # noqa: E402

ARTICLE_CATEGORIES = {'planner-buying-guides': 1, 'journaling-basics-and-supplies': 2}


def main(path, dry):
    res = ac.check(path, live=True)
    for k, m in res: print(f'  {k} {m}')
    if any(k == 'FAIL' for k, _ in res): sys.exit('not published: fix the FAILs')
    d = json.load(open(path))
    reg = ac.load(ac.REGISTRY, [])
    old = next((r for r in reg if r['slug'] == d['slug']), None)
    future = d.get('published_at') and dt.datetime.fromisoformat(d['published_at']) > dt.datetime.now(dt.timezone.utc)
    body = {
        'title': d['title'], 'slug': d['slug'], 'link_title': d.get('link_title') or d['title'].split(':')[0][:60],
        'subtitle': d.get('subtitle') or '', 'content': d['content'], 'meta_title': d['title'],
        'meta_description': d['meta_description'], 'meta_keywords': ', '.join([d['primary_query']] + (d.get('keywords') or [])[:3]),
        'author': d['author'], 'enabled': not future,
        'article_categories': [ARTICLE_CATEGORIES[d.get('article_category', 'planner-buying-guides')]],
    }
    # The template prints the subtitle as the H2 under the hero; without one it prints an empty heading.
    if not body['subtitle'].strip():
        if old and old.get('id'): del body['subtitle']      # keep the one already saved
        else: sys.exit('not published: add "subtitle" to the draft (30 to 92 characters, no prices)')
    if d.get('published_at'): body['published_at'] = d['published_at']
    if d.get('product_category_id'): body['product_category_id'] = d['product_category_id']
    if dry:
        print(json.dumps({k: (v[:80] + '...' if isinstance(v, str) and len(v) > 80 else v) for k, v in body.items()}, indent=1)); return
    if old and old.get('id'):
        s, cur = call('GET', f"articles/{old['id']}"); backup(f"article-{old['id']}-{int(time.time())}", cur.get('data'))
        s, r = call('PATCH', f"articles/{old['id']}", body)
    else:
        s, r = call('POST', 'articles', body)
    if s not in (200, 201): sys.exit(f'API {s}: {json.dumps(r)[:400]}')
    a = r['data']; print('saved', a['id'], a['slug'], 'enabled' if a.get('enabled') else f"scheduled {a.get('published_at')}")
    used = {r.get('image') for r in reg if r.get('image')}
    img = None
    if not (old and old.get('image')):
        time.sleep(1.1)
        s, st = call('GET', 'images/stock?query=' + re.sub(r'\s+', '+', d['image_query'].strip()) + '&quantity=12')
        img = next((x['url'] for x in st.get('data', []) if x['url'] not in used and (x.get('width') or 0) >= 1600), None)
        if img:
            for col in ('hero', 'listing', 'social'):
                time.sleep(1.1); call('POST', f"articles/{a['id']}/images", {'collection': col, 'url': img})
        else:
            print('WARN no unused stock image wider than 1600 px: set one by hand')
    call('POST', 'store/clear-cache')
    c = d['content']
    entry = {'slug': a['slug'], 'id': a['id'], 'title': d['title'], 'type': d['type'], 'primary_query': d['primary_query'].lower().strip(),
             'cluster': d['cluster'], 'products': sorted({int(x) for x in re.findall(r'\[product id="(\d+)"\]', c)}),
             'h2': [ac.text_of(x) for x in re.findall(r'<h2\b[^>]*>(.*?)</h2>', c, re.S | re.I)],
             'related': d.get('related') or [], 'image': img or (old or {}).get('image'),
             'published_at': a.get('published_at'), 'enabled': a.get('enabled'), 'pillar': bool(d.get('pillar')),
             'price_checked': d.get('price_checked'), 'refresh_by': d.get('refresh_by')}
    entry['prices'] = prices_for(entry['products'])   # what article_prices.py compares against later
    reg = [r for r in reg if r['slug'] != a['slug']] + [entry]
    ac.REGISTRY.write_text(json.dumps(sorted(reg, key=lambda r: r.get('id') or 0), indent=1) + '\n')
    ac.CORPUS.mkdir(parents=True, exist_ok=True); (ac.CORPUS / f"{a['slug']}.html").write_text(c)
    print('registry updated; commit shop/articles/registry.json')


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    main(a[0], '--dry-run' in a)
