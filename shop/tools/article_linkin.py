"""Link newly live shop articles from older live ones (shop-article skill, section 6 step 7).

Usage:
  python3 shop/tools/article_linkin.py [--dry-run]

For every article in the registry that is live now (published_at in the past) and has no inbound link yet,
pick 1-2 older live articles that share the most products (then the same type family) and add one
sentence with the link before their closing method note. Scheduled articles are never linked to, since
their URLs answer 404 until they go live. Backs up every article before PATCH; clears the cache once.
State: .cache/shop/articles/linked.json (target slug -> source slugs).
"""
import datetime as dt, json, re, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fs import ROOT, WORK, call, backup  # noqa: E402

REG = ROOT / 'shop' / 'articles' / 'registry.json'
STATE = WORK / 'articles' / 'linked.json'
BASE = 'https://shop.freshcalendars.com/articles/'
LEADS = ['For a related comparison, see', 'There is more on this in', 'Next, read', 'For the next step, see', 'Also on the shop:']


def api(m, p, b=None):
    time.sleep(1.1)
    return call(m, p, b)


def live(r, now):
    t = r.get('published_at')
    if not t: return bool(r.get('enabled'))
    # the platform stores the clock time in Eastern Time and labels it Z
    return dt.datetime.fromisoformat(t.replace('Z', '').replace('.000000', '')[:19]) <= now


def main(dry):
    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=-5))).replace(tzinfo=None)
    reg = json.loads(REG.read_text())
    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    alive = [r for r in reg if r.get('id') and live(r, now)]
    contents = {}
    def content(r):
        if r['slug'] not in contents:
            s, a = api('GET', f"articles/{r['id']}"); contents[r['slug']] = a['data']['content']
        return contents[r['slug']]
    # inbound links already present among live articles
    targets = []
    for r in alive:
        if state.get(r['slug']): continue
        targets.append(r)
    if not targets: print('nothing to link'); return
    for t in targets:
        tp = set(t.get('products') or [])
        cands = [r for r in alive if r['slug'] != t['slug'] and (r.get('published_at') or '') <= (t.get('published_at') or '9')]
        has = [r for r in cands if BASE + t['slug'] in content(r)]
        if has:
            state[t['slug']] = [r['slug'] for r in has]; print('already linked', t['slug']); continue
        fam = lambda r: (r['type'] in ('best', 'price', 'gift', 'review', 'alternatives', 'versus')) == (t['type'] in ('best', 'price', 'gift', 'review', 'alternatives', 'versus'))
        cands.sort(key=lambda r: (-len(tp & set(r.get('products') or [])), not fam(r), -len(r.get('products') or [])))
        picks = [r for r in cands if content(r).count(BASE) < 6][:2]
        done = []
        for i, s in enumerate(picks):
            c = content(s)
            lead = LEADS[(len(state) + i) % len(LEADS)]
            line = f'<p>{lead} <a href="{BASE}{t["slug"]}">{t["title"].split(":")[0]}</a>.</p>'
            # insert before the closing method note (the last paragraph), else append
            k = c.rfind('<p>')
            new = c[:k] + line + '\n' + c[k:] if k > 0 else c + line
            if dry: print('would link', s['slug'], '->', t['slug']); done.append(s['slug']); continue
            s_, cur = api('GET', f"articles/{s['id']}"); backup(f"article-{s['id']}-before-linkin-{int(time.time())}", cur['data'])
            st, r = api('PATCH', f"articles/{s['id']}", {'content': new})
            if st == 200:
                contents[s['slug']] = new; done.append(s['slug']); print('linked', s['slug'], '->', t['slug'])
            else:
                print('PATCH failed', s['slug'], st, str(r)[:200])
        if done and not dry: state[t['slug']] = done
    if not dry:
        STATE.parent.mkdir(parents=True, exist_ok=True); STATE.write_text(json.dumps(state, indent=1))
        api('POST', 'store/clear-cache')


if __name__ == '__main__':
    main('--dry-run' in sys.argv)
