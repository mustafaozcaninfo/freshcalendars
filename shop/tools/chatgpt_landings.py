"""Which shop pages ChatGPT sends visitors to, from the daily Clarity exports kept in git history.

  python3 shop/tools/chatgpt_landings.py [days]      default 14

Clarity's export (docs/desk/clarity.json, written daily by the Search Console workflow) lists
sessions per URL for the last 24 hours, and ChatGPT's referrals carry ?utm_source=chatgpt.com.
This reads the last N daily versions of that file from git, adds the sessions up per shop page
and joins them with the catalog (.cache/shop/audit/products-now.json, from fetchall.py).
Prints: sessions per day, by page type, by product family with the share of products that got a
visit, the days from a product's creation to its first visit, and the top pages.
Run it from the repository root after `git fetch` so the history is current. No API call.
"""
import collections, datetime as dt, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CLOCKS = {'digital-wall-calendars', 'day-clocks', 'visual-timers', 'sunrise-alarm-clocks', 'alarm-clocks', 'wall-clocks', 'perpetual-calendars'}
XMAS = {'stocking-stuffers', 'christmas-craft-kits', 'elf-kits', 'christmas-eve-boxes'}
THEMED = {'dog-calendars', 'cat-calendars', 'nature-and-national-park-calendars', 'art-calendars', 'funny-calendars', 'car-and-truck-calendars'}


def family(slug):
    if 'advent' in slug: return 'advent calendars'
    if slug in XMAS: return 'christmas gifts and kits'
    if slug in THEMED: return 'themed 2027 calendars'
    if slug in CLOCKS: return 'clocks and digital calendars'
    if 'calendar' in slug: return 'wall, desk and pocket calendars'
    if 'planner' in slug: return 'planners'
    return 'journals, supplies and cards'


def main(days):
    git = lambda *a: subprocess.run(['git', *a], cwd=ROOT, capture_output=True, text=True).stdout
    seen, per_day = collections.defaultdict(dict), collections.Counter()
    for h in git('log', '--format=%H', '-n', str(days + 4), 'origin/main', '--', 'docs/desk/clarity.json').split():
        try: d = json.loads(git('show', f'{h}:docs/desk/clarity.json'))
        except ValueError: continue
        day = d['generatedAt'][:10]
        if day in per_day or len(per_day) >= days: continue
        per_day[day] = 0
        for r in next(m for m in d['pages'] if m['metricName'] == 'Traffic')['information']:
            u = r.get('Url', '')
            if 'shop.freshcalendars' in u and 'chatgpt' in u:
                n = float(r.get('totalSessionCount') or 0)
                seen[u.replace('https://shop.freshcalendars.com', '').split('?')[0]][day] = n; per_day[day] += n
    print('ChatGPT landing sessions per Clarity day:', ', '.join(f'{k[5:]} {int(v)}' for k, v in sorted(per_day.items())))
    tot = {p: sum(v.values()) for p, v in seen.items()}
    kinds = collections.Counter()
    for p, n in tot.items():
        m = re.match(r'/(products|articles|categories|brands|tags)/', p); kinds[m.group(1) if m else 'other pages'] += n
    print('by page type:', dict((k, int(v)) for k, v in kinds.most_common()), '| distinct pages', len(tot))
    cat = os.path.join(ROOT, '.cache/shop/audit/products-now.json')
    if os.path.exists(cat):
        fam, lag = collections.defaultdict(lambda: [0, 0, 0.0]), collections.Counter()
        for p in json.load(open(cat)):
            if not p.get('enabled') or not p.get('categories'): continue
            f = fam[family(p['categories'][0]['slug'])]; v = seen.get('/products/' + p['slug'])
            f[0] += 1
            if v:
                f[1] += 1; f[2] += sum(v.values())
                lag[(dt.date.fromisoformat(min(v)) - dt.date.fromisoformat(p['created_at'][:10])).days] += 1
        print('family                             products  visited  sessions  per product')
        for k, (n, l, s) in sorted(fam.items(), key=lambda x: -x[1][2]):
            print(f'{k:34} {n:8} {l:5} ({100 * l // max(n, 1):2}%) {int(s):8} {s / max(n, 1):10.2f}')
        print('days from creation to first visit:', dict(sorted(lag.items())[:12]))
    print('top pages:')
    for p, n in sorted(tot.items(), key=lambda x: -x[1])[:15]: print(f'  {int(n):4} {p[:90]}')


if __name__ == '__main__':
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 14)
