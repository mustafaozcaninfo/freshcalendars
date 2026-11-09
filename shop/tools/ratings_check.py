"""Validate agent drafts against the listings and compute the Fresh Calendars Score.
Writes reviews/final.json (ready to publish) and reviews/rejects.json (needs a fix)."""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import WORK
os.chdir(WORK)  # outputs go to .cache/shop/
import json, re, glob, unicodedata

FEAT = {
    'journal': ['numbered_pages', 'index', 'lay_flat', 'pen_loop', 'pocket', 'ribbon', 'elastic', 'perforated', 'stickers'],
    'planner': ['hourly_schedule', 'monthly_pages', 'month_tabs', 'pocket', 'ribbon', 'pen_loop', 'elastic', 'stickers', 'notes_pages', 'binding_flat'],
    'guided': ['daily_prompts', 'review_pages', 'trackers', 'undated', 'hardcover', 'ribbon', 'intro_pages', 'extras'],
    'pens': ['ten_plus', 'fine_tip', 'waterproof', 'quick_dry', 'archival', 'no_bleed', 'refillable', 'case'],
    'supplies': ['large_count', 'foil', 'storage', 'assorted_sizes', 'archival', 'planner_sized'],
    'calendar': ['large_blocks', 'holidays', 'pockets', 'ruled_blocks', 'hanger_stand', 'year_overview', 'thick_paper', 'extras'],
}
PAPER_W = {'journal': .5, 'planner': .4, 'guided': .3}
BANNED = re.compile(r'\b(perfect|ultimate|best|must-have|luxury|luxurious|amazing|stunning|elevate[sd]?|journey|effortless(ly)?|game-changer|high-quality|top-notch|ideal)\b', re.I)
NOTE = " Fresh Calendars Score, worked out from the maker's published details; we did not test it by hand."


def norm(s):
    s = unicodedata.normalize('NFKC', s or '').lower()
    s = s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').replace('–', '-').replace('—', '-')
    return re.sub(r'\s+', ' ', s).strip()


def paper(g):
    if g is None: return 2.5
    if g <= 80: return 2.5
    if g <= 120: return 2.5 + (g - 80) * 1.5 / 40
    return min(5.0, 4.0 + (g - 120) / 40)


def score(t, gsm, n):
    f = 1 + 4 * n / len(FEAT[t])
    w = PAPER_W.get(t)
    s = w * paper(gsm) + (1 - w) * f if w else f
    return round(max(1.0, min(5.0, s)) + 1e-9, 1)


items = {i['id']: i for i in json.load(open('reviews/all_items.json'))}
final, rejects, skips = [], [], []
for fn in sorted(glob.glob('reviews/drafts*.json')):
    for d in json.load(open(fn)):
        it = items.get(d['id'])
        if d.get('skip'):
            skips.append({'id': d['id'], 'title': it and it['title'], 'reason': d['skip']}); continue
        errs = []
        t = it['type']
        if d.get('type') != t: errs.append(f"type {d.get('type')} != {t}")
        L = norm(it['listing'])
        feats = d.get('features') or {}
        if set(feats) != set(FEAT[t]): errs.append(f'feature keys {sorted(set(feats) ^ set(FEAT[t]))}')
        present = [k for k in FEAT[t] if feats.get(k)]
        for k in present:
            if norm(feats[k]) not in L: errs.append(f'quote not in listing [{k}]: {feats[k]!r}')
        gsm = d.get('gsm') if t in PAPER_W else None
        if gsm is not None:
            q = d.get('gsm_quote') or ''
            if norm(q) not in L or not re.search(r'\d', q): errs.append(f'gsm quote not in listing: {q!r}')
            # Text-weight pounds convert at lb x 1.48 (the first method draft said 3.76, which was wrong).
            mlb = re.search(r'(\d+(?:\.\d+)?)[\s-]*(?:lb|lbs|pound)', q, re.I)
            mg = re.search(r'(\d+(?:\.\d+)?)\s*(?:gsm|g/m|g/sm|gram)', q, re.I)
            if mg: gsm = float(mg.group(1))
            elif mlb: gsm = round(float(mlb.group(1)) * 1.48)
        verdict = (d.get('verdict') or '').strip()
        pros, cons = d.get('pros') or [], d.get('cons') or []
        if not verdict or len(verdict) > 420: errs.append(f'verdict length {len(verdict)}')
        if not 3 <= len(pros) <= 4: errs.append(f'{len(pros)} pros')
        if not 1 <= len(cons) <= 3: errs.append(f'{len(cons)} cons')
        for x in pros + cons:
            if len(x) > 150: errs.append(f'item too long: {x[:40]}')
        text = ' '.join([verdict] + pros + cons)
        if BANNED.search(re.sub(r'(?i)premium(?= [A-Z])', '', text)): errs.append(f'banned word: {BANNED.search(text).group(0)}')
        if re.search(r'premium', text, re.I) and not re.search(r'premium', it['title'] + it['listing'][:200], re.I): errs.append('premium not part of product name')
        if '—' in text or '!' in text: errs.append('em dash or exclamation')
        if re.search(r'\$\s?\d', text): errs.append('price mentioned')
        if t in PAPER_W and gsm is None and not any('not stated' in c.lower() for c in cons): errs.append('missing paper-weight con')
        rec = {'id': d['id'], 'title': it['title'], 'type': t, 'gsm': gsm, 'present': present, 'n': len(present),
               'of': len(FEAT[t]), 'score': score(t, gsm, len(present)), 'author_verdict': verdict + NOTE,
               'author_pros': pros, 'author_cons': cons}
        (rejects if errs else final).append({**rec, 'errors': errs} if errs else rec)
json.dump(final, open('reviews/final.json', 'w'), indent=1)
json.dump(rejects, open('reviews/rejects.json', 'w'), indent=1)
json.dump(skips, open('reviews/skips.json', 'w'), indent=1)
print('ok', len(final), 'rejects', len(rejects), 'skips', len(skips), 'of', len(items))
