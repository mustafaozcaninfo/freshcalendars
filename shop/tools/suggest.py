"""Harvest Google autocomplete long-tail queries for planner/journal seeds."""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import WORK
os.chdir(WORK)  # outputs go to .cache/shop/
import json, urllib.request, urllib.parse, time, string, sys
SEEDS = ['daily planner','weekly planner','monthly planner','academic planner','undated planner','2027 planner','teacher planner',
 'budget planner','meal planner notebook','fitness journal','gratitude journal','bullet journal','dotted journal','graph paper notebook',
 'hardcover journal','softcover journal','a5 journal','b5 notebook','journaling pens','gel pens for journaling','fineliner pens',
 'planner stickers','washi tape','journal stencils','scrapbook paper','prayer journal','travel journal','reading journal','5 year journal',
 'line a day journal','habit tracker journal','wellness planner','pregnancy journal','baby memory book','wedding planner book',
 'password book','recipe book to write in','dream journal','self care journal','planner for adhd','planner for nurses','homeschool planner',
 'small business planner','undated weekly planner','desk calendar 2027','wall calendar 2027','spiral planner','leather journal','refillable journal','sketchbook journal']
out = {}
for s in SEEDS:
    qs = set()
    for suf in [''] + [' ' + c for c in 'abcdefghijklmnoprstw'] + [' for', ' with']:
        q = s + suf
        u = 'https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=' + urllib.parse.quote(q)
        try:
            d = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=15).read().decode('utf-8', 'ignore'))
            qs.update(d[1])
        except Exception as e:
            print('err', q, e, file=sys.stderr)
        time.sleep(0.25)
    out[s] = sorted(qs)
    print(s, len(qs), flush=True)
json.dump(out, open('kw/suggest.json', 'w'), indent=1)
