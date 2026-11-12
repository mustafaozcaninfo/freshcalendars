"""Link live articles from the bottom text of their product category (so no article is an orphan).

  python3 shop/tools/category_guides.py     # safe to rerun: replaces the block; scheduled articles are skipped until live
Run it weekly, and after a batch of scheduled articles has gone live.
"""
import html, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import call  # noqa: E402

arts, page = [], 1
while True:
    s, d = call('GET', f'articles?per_page=100&page={page}'); arts += d['data']
    if page >= d['meta']['last_page']: break
    page += 1; time.sleep(1.1)
by = {}
for a in arts:
    if a.get('enabled') and a.get('product_category_id'): by.setdefault(a['product_category_id'], []).append(a)
time.sleep(1.1); s, d = call('GET', 'categories?per_page=100'); n = 0
for c in d['data']:
    cb = re.sub(r'\s*<div class="fc-guide-links">.*?</div>', '', c.get('content_bottom') or '', flags=re.S)
    block = ''
    if by.get(c['id']):
        items = sorted(by[c['id']], key=lambda a: a['title'])[:12]
        block = ('<div class="fc-guide-links"><h2>Guides for ' + html.escape(c['title'].lower()) + '</h2><ul>'
                 + ''.join(f'<li><a href="/articles/{a["slug"]}">{html.escape(a["title"])}</a></li>' for a in items) + '</ul></div>')
    new = (cb + ('\n' + block if block else '')).strip()
    if new != (c.get('content_bottom') or '').strip():
        time.sleep(1.1); s2, r2 = call('PATCH', f"categories/{c['id']}", {'content_bottom': new})
        print(c['slug'], s2, len(by.get(c['id'], []))); n += 1
print('categories updated', n); call('POST', 'store/clear-cache')
