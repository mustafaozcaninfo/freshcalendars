"""Fetch every enabled product with offers, categories and brand -> .cache/shop/audit/products-now.json . Resumable: delete both audit files to start fresh.."""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import WORK
os.chdir(WORK)  # outputs go to .cache/shop/
import json, time, os
import fs
if not os.path.exists('audit/products-list.json'):  # list every enabled product first
    L, page = [], 1
    while True:
        s, d = fs.call('GET', f'products?per_page=100&page={page}&enabled=true'); L += d['data']
        if page >= d['meta']['last_page']: break
        page += 1; time.sleep(1.1)
    json.dump(L, open('audit/products-list.json', 'w'))
L = json.load(open('audit/products-list.json'))
out = 'audit/products-now.json'
done = {p['id']: p for p in json.load(open(out))} if os.path.exists(out) else {}
for p in L:
    if not p['enabled'] or p['id'] in done: continue
    for attempt in range(6):
        try:
            s, j = fs.call('GET', f"products/{p['id']}?include=offers,categories,brand")
        except Exception as e:
            print('retry', p['id'], type(e).__name__, flush=True); time.sleep(10); continue
        if s == 429: time.sleep(20); continue
        if s == 200: done[p['id']] = j['data']
        break
    json.dump(list(done.values()), open(out, 'w')); time.sleep(1.05)
print('fetched', len(done), 'of', sum(1 for p in L if p['enabled']), flush=True)
