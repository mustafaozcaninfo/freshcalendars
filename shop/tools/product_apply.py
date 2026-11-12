"""Check product text drafts against their retailer listings, then write them to the store and show the products.

A batch lives in one folder under .cache/shop/ (for example .cache/shop/season/):
  products.json   the fetched products (products/{id}?include=offers,categories,brand), each with `_cat` = category slug
  out*.json       agent drafts in the format of the product brief (title, subtitle, specs, sections ...) or {"id", "reject"}

  python3 shop/tools/product_apply.py <folder>            # check only: prints what passes, what fails and why
  python3 shop/tools/product_apply.py <folder> --apply    # write the passing drafts and enable those products

Nothing is written for a draft that fails. Rejected and failing products stay hidden.
"""
import datetime as dt, glob, html, json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import WORK, call  # noqa: E402

BAN = re.compile(r"\b(perfect|ultimate|best|must-have|luxury|luxurious|amazing|stunning|elevate[sd]?|journey|effortless(ly)?|game-changer|high-quality|top-notch|ideal|seamless(ly)?|robust|vibrant|boasts?|showcases?|delve|crucial|moreover|furthermore|whether you're|look no further|festive cheer|magic of|we tested|we tried|hands-on)\b", re.I)
LIMITS = {'title': (35, 70), 'link_title': (12, 42), 'subtitle': (70, 165), 'meta_title': (28, 62), 'meta_description': (115, 158), 'summary': (160, 330)}
# The printable that fits each category: (url, sentence with {a} where the link goes)
PRINT = {
    'default': ('https://freshcalendars.com/holidays/', 'The dates themselves are on our {a}holiday dates page</a>.'),
    'advent-calendars': ('https://freshcalendars.com/december-calendars.html', 'Print a free {a}December calendar</a> to mark December 1 to 24 beside it.'),
    'christmas-countdown-calendars': ('https://freshcalendars.com/december-calendars.html', 'A free {a}December calendar</a> shows the same countdown on paper.'),
    'christmas-planners-and-organizers': ('https://freshcalendars.com/december-calendars.html', 'Pair it with a free {a}December calendar</a> for the dates that cannot move.'),
    'greeting-card-organizers': ('https://freshcalendars.com/printable-yearly-calendar.html', 'A free {a}yearly calendar</a> on the wall keeps the same birthdays in view.'),
}


def text(s): return re.sub(r'\s+', ' ', s or '').strip()


def check(d, p):
    """Errors for one draft against its product's listing (empty list = pass)."""
    o = p['offers'][0]; listing = (o['title'] + ' ' + ' '.join(o.get('features') or [])).lower().replace(',', '')
    listing += ' ' + ' '.join('0' + x for x in re.findall(r'(?<!\d)\.\d+', listing))  # ".47 in" also matches "0.47"
    e = []
    for k, (lo, hi) in LIMITS.items():
        v = text(d.get(k))
        if not lo <= len(v) <= hi: e.append(f'{k} {len(v)} chars ({lo}-{hi})')
    hl = d.get('highlights') or []; specs = d.get('specs') or []; secs = d.get('sections') or []
    if len(hl) != 5: e.append(f'{len(hl)} highlights')
    if not 5 <= len(specs) <= 9 or any(len(r) != 2 for r in specs): e.append('specs rows')
    elif specs[-1][0].lower() != 'not stated': e.append('last spec row must be "Not stated"')
    if len(secs) != 3: e.append(f'{len(secs)} sections')
    elif not text(secs[2].get('h')).endswith('?'): e.append('third heading must be a question')
    allt = ' '.join([text(d.get(k)) for k in LIMITS] + [text(x) for x in hl] + [text(a) + ' ' + text(b) for a, b in specs if len([a, b]) == 2] + [text(s.get('h')) + ' ' + text(s.get('p')) for s in secs])
    if re.search(r'<[a-z/]', allt): e.append('html in a field')
    if '$' in allt or '—' in allt or '!' in allt: e.append('dollar sign, em dash or exclamation mark')
    m = BAN.search(allt)
    if m: e.append('banned: ' + m.group(0))
    if re.search(r'\b[A-Z]{5,}\b', text(d.get('title'))) and not re.search(r'\b[A-Z]{5,}\b', o['title'][:40]): e.append('caps in title')
    bad = sorted({n for n in re.findall(r'\d+(?:\.\d+)?', allt.replace(',', '')) if n not in listing and n.lstrip('0') not in listing})
    if bad: e.append('numbers not in the listing: ' + ', '.join(bad[:8]))
    return e


def body(d, p, cat_slug, cat_title, read_on):
    rows = ''.join(f'<tr><td>{html.escape(text(a))}</td><td>{html.escape(text(b))}</td></tr>' for a, b in d['specs'])
    kind = text(d['link_title'])
    s = d['sections']
    url, sent = PRINT.get(cat_slug, PRINT['default'])
    out = (f'<h3>{html.escape(kind)}: what the listing states</h3>\n<div class="fc-table fc-spec"><table>\n<thead><tr><th>Detail</th><th>What the listing states</th></tr></thead>\n<tbody>\n{rows}\n</tbody>\n'
           f'<caption>Source: the retailer listing, read {read_on}.</caption>\n</table></div>\n')
    out += f'<h3>{html.escape(text(s[0]["h"]))}</h3>\n<p>{html.escape(text(s[0]["p"]))} More options sit in the <a href="https://shop.freshcalendars.com/categories/{cat_slug}">{html.escape(cat_title.lower())} category</a>.</p>\n'
    out += f'<h3>{html.escape(text(s[1]["h"]))}</h3>\n<p>{html.escape(text(s[1]["p"]))}</p>\n'
    out += f'<h3>{html.escape(text(s[2]["h"]))}</h3>\n<p>{html.escape(text(s[2]["p"]))} {sent.format(a=f"<a href={chr(34)}{url}{chr(34)}>")}</p>\n'
    out += '<p>How this page was made: the facts come from the maker listing, collected by the Fresh Calendars team with AI help and checked before publishing. We do not test products by hand.</p>'
    return out


def main(folder, apply):
    folder = WORK / folder if not os.path.isabs(folder) and not os.path.exists(folder) else folder
    P = {p['id']: p for p in json.load(open(os.path.join(folder, 'products.json')))}
    drafts = []
    for f in sorted(glob.glob(os.path.join(folder, 'out*.json'))): drafts += json.load(open(f))
    ok, rej, fail, seen_titles = [], [], [], {}
    for d in drafts:
        p = P.get(d.get('id'))
        if not p: fail.append((d.get('id'), ['unknown id'])); continue
        if d.get('reject'): rej.append((d['id'], d['reject'])); continue
        e = check(d, p)
        t = text(d.get('title')).lower()
        if t in seen_titles: e.append(f'title repeats product {seen_titles[t]}')
        seen_titles.setdefault(t, d['id'])
        o = p['offers'][0]
        if not (o.get('price') and o.get('stock_available')): e.append('no price or stock')
        (fail if e else ok).append((d['id'], e) if e else d)
    print(f'drafts {len(drafts)} | pass {len(ok)} | rejected by the writer {len(rej)} | fail {len(fail)} | no draft {len(P) - len(drafts)}')
    for i, e in fail[:60]: print('  FAIL', i, e[:3])
    json.dump({'pass': [d['id'] for d in ok], 'reject': rej, 'fail': fail}, open(os.path.join(folder, 'check.json'), 'w'), indent=1)
    if not apply: return
    read_on = dt.date.today().strftime('%b. %-d, %Y').replace('May.', 'May'); log = []
    for d in ok:
        p = P[d['id']]; c = p['categories'][0]
        payload = {'title': text(d['title']), 'link_title': text(d['link_title']), 'subtitle': text(d['subtitle']), 'meta_title': text(d['meta_title']), 'meta_description': text(d['meta_description']),
                   'summary': text(d['summary']), 'highlights': [text(x) for x in d['highlights']], 'content': body(d, p, c['slug'], c['title'], read_on), 'enabled': True}
        s, r = call('PATCH', f"products/{d['id']}", payload)
        log.append({'id': d['id'], 'status': s, 'slug': (r.get('data') or {}).get('slug') if s == 200 else str(r)[:200], 'cat': c['slug']})
        time.sleep(1.05)
    json.dump(log, open(os.path.join(folder, 'apply-log.json'), 'w'), indent=1)
    print('written and enabled', sum(1 for l in log if l['status'] == 200), '| errors', [l for l in log if l['status'] != 200][:5])
    call('POST', 'store/clear-cache')


if __name__ == '__main__':
    a = sys.argv[1:] or sys.exit(__doc__)
    main(a[0], '--apply' in a)
