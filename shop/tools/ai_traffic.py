"""Daily traffic by source for the shop, with the share that comes from AI assistants (ChatGPT).

  python3 shop/tools/ai_traffic.py [days]      default 14

Reads GET analytics/visits (about 12 calls for 1,200 visits) and prints, per day, visits from AI
assistants, search engines and other sites, and the visits that clicked a retailer button (an
"event"). Visits from Turkey and Qatar with no referrer are left out of the totals: they are our
own checks. Run it daily while a season is on; a drop in the AI column is the first sign that
Bing stopped indexing new pages (see "IndexNow with our own key" in shop/README.md).
"""
import collections, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import call  # noqa: E402

OWN = {'tr', 'qa'}


def main(days):
    visits, page = [], 1
    while True:
        s, r = call('GET', f'analytics/visits?per_page=100&page={page}')
        visits += r['data']
        if page >= r['meta']['last_page']: break
        page += 1; time.sleep(1.1)
    day = collections.defaultdict(collections.Counter)
    for v in visits:
        src = v['referrer_type_name']
        if src == 'Direct Entry' and v.get('country_code') in OWN: continue
        d = v['first_action_at'][:10]
        day[d][src] += 1
        if (v.get('events') or 0) > 0: day[d][src + ' clicked'] += 1
        if src == 'AI Assistant' and v.get('device_type') in ('Smartphone', 'Phablet'): day[d]['AI phone'] += 1
    print('day         AI  clicked  phone | search  clicked | sites  direct')
    for d in sorted(day)[-days:]:
        c = day[d]
        print(f"{d}  {c['AI Assistant']:3}  {c['AI Assistant clicked']:7}  {c['AI phone']:5} | {c['Search Engine']:6}  {c['Search Engine clicked']:7} | {c['Website'] + c['Campaign']:5}  {c['Direct Entry']:6}")
    ai = [v for v in visits if v['referrer_type_name'] == 'AI Assistant']
    if ai:
        n = len(ai); k = sum(1 for v in ai if (v.get('events') or 0) > 0)
        top = collections.Counter(v.get('country_code') for v in ai).most_common(4)
        print(f"AI assistants, all {n} visits on record: {k} clicked a retailer ({100 * k / n:.0f}%); countries {top}")


if __name__ == '__main__':
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 14)
