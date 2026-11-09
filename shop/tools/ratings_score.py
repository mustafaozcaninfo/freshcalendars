"""Apply reviews/fixes.json to reviews/final.json and score with method v2 -> reviews/publish.json.
Method v2 (owner decision, Nov 9, 2026): the scale starts at 3 for a product that does the basic job of its type.
Features: 3 + 2 x (features present / most features any rated product of that type states).
Paper (journal, planner, guided): 80 gsm or less = 3, rising 1 point per 40 gsm to 5 at 160 gsm; not counted when unstated.
Only scores of 4.0 or more are shown on the site."""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import WORK
os.chdir(WORK)  # outputs go to .cache/shop/
import json
W = {'journal': .5, 'planner': .4, 'guided': .3}
PILOT = [  # already published pilot, rescored with the same rule
    {'id': 213, 'title': 'LEUCHTTURM1917 Hardcover Notebook A5 Dotted Black', 'type': 'journal', 'gsm': 80, 'n': 8, 'of': 9},
    {'id': 250, 'title': 'HUSTLE Co. A5 Thick Dotted Hardcover Journal, 120 GSM Paper', 'type': 'journal', 'gsm': 120, 'n': 6, 'of': 9},
    {'id': 214, 'title': 'VIVID SCRIBBLES A5 Dot Grid Journal with 160GSM Bleed Proof Pages', 'type': 'journal', 'gsm': 160, 'n': 8, 'of': 9}]
F = json.load(open('reviews/final.json')); fx = json.load(open('reviews/fixes.json'))
mx = {}
for f in F + PILOT: mx[f['type']] = max(mx.get(f['type'], 0), f['n'])


def score(f):
    fs = 3 + 2 * f['n'] / mx[f['type']]
    w = W.get(f['type'])
    if w and f['gsm']:
        ps = min(5.0, 3 + (max(f['gsm'], 80) - 80) / 40)
        return round(w * ps + (1 - w) * fs + 1e-9, 1)
    return round(fs + 1e-9, 1)


for f in F:
    x = fx.get(str(f['id']), {})
    if 'verdict_replace' in x:
        a, b = x['verdict_replace']; assert a in f['author_verdict']; f['author_verdict'] = f['author_verdict'].replace(a, b)
    if 'product_title' in x: f['product_title'] = x['product_title']
    f['author_cons'] = [fx['cons_replace'].get(c, c) for c in f['author_cons']]
    f['score_v1'] = f['score']; f['score'] = score(f)
    assert len(f['author_verdict']) <= 600 and all(len(c) <= 160 for c in f['author_pros'] + f['author_cons'])
for p in PILOT: p['score'] = score(p)
json.dump(F, open('reviews/publish.json', 'w'), indent=1)
json.dump(PILOT, open('reviews/pilot_v2.json', 'w'), indent=1)
show = [f for f in F if f['score'] >= 4]
print('max features by type', mx)
print('rated', len(F), 'shown (4.0+)', len(show), '| pilot', [(p['id'], p['score']) for p in PILOT])
