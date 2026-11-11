"""Long-tail article queue: suggestion queries the shop can answer with 6+ live products and no article yet.

  python3 shop/tools/longtail_queue.py      # writes shop/articles/longtail-queue.json and prints a summary
Needs a fresh catalog (.cache/shop/audit/products-now.json from fetchall.py) and a synced registry (article_check.py --sync).
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import ROOT, WORK  # noqa: E402
SUG = json.loads((ROOT / 'shop/data/google-suggest-filtered.json').read_text())
REG = json.loads((ROOT / 'shop/articles/registry.json').read_text())
SPEC = json.loads((ROOT / 'shop/data/spec-pages.json').read_text()) if (ROOT / 'shop/data/spec-pages.json').exists() else {}
P = [p for p in json.loads((WORK / 'audit/products-now.json').read_text()) if p.get('offers')]
DROP = re.compile(r"\b(kmart|target|walmart|amazon|etsy|costco|staples|michaels|dollar tree|five below|officeworks|big w|tesco|argos|near me|pdf|template|printable|free|app|digital|ipad|goodnotes|notion|excel|online|download|diy|canva|png|svg|clipart|login|reddit|youtube|tiktok|uk|australia|canada|nz|india|philippines|singapore|ireland|south africa|20(1\d|2[0-5])|meaning|definition|quotes|ideas|aesthetic wallpaper|coloring|cricut)\b")
STOP = set('for with and the a an of to in on by at from that is are best good top buy cheap cute pretty'.split())
def toks(q): return [re.sub(r'(?<=[a-z]{3})s$', '', w) for w in re.findall(r'[a-z0-9]+', q.lower()) if w not in STOP]
texts = []
for p in P:
    o = p['offers'][0]; texts.append((p['id'], set(toks(o['title'] + ' ' + ' '.join(o.get('features') or []) + ' ' + ' '.join(c['slug'].replace('-', ' ') for c in p.get('categories') or [])))))
taken = [set(toks(r.get('primary_query') or r['slug'].replace('-', ' '))) for r in REG] + [set(toks(k.replace('-', ' '))) for k in SPEC if k != '_hub']
def typ(q):
    if ' vs ' in q or ' or ' in q: return 'versus'
    if re.search(r'under \$?\d+|cheap', q): return 'price'
    if re.search(r'^how to|how do', q): return 'howto'
    if re.search(r'gift|christmas|stocking|birthday|mother|father|graduat|valentine', q): return 'gift'
    if re.search(r'^what is|what are|meaning', q): return 'explainer'
    if re.search(r'alternative|dupe|like ', q): return 'alternatives'
    if re.search(r'review|worth it', q): return 'review'
    return 'best'
out, seen = [], []
for seed, qs in SUG.items():
    for q in qs:
        q = q.strip().lower(); t = set(toks(q))
        if len(t) < 3 or DROP.search(q) or len(q) > 60: continue
        ids = [i for i, tx in texts if t <= tx]
        if len(ids) < 6: continue
        if any(len(t & x) / len(t | x) >= 0.75 for x in taken + seen): continue
        seen.append(t); out.append({'query': q, 'seed': seed, 'type': typ(q), 'products': len(ids), 'sample_ids': ids[:14]})
out.sort(key=lambda r: (-len(toks(r['query'])), -r['products']))
(ROOT / 'shop/articles/longtail-queue.json').write_text(json.dumps(out, indent=1) + '\n')
import collections
print(len(out), 'queries;', dict(collections.Counter(r['type'] for r in out)), '; by seed top:', collections.Counter(r['seed'] for r in out).most_common(8))
for r in out[:40]: print(' ', r['products'], r['type'], '|', r['query'])
