"""Full read-only crawl of shop.freshcalendars.com. Writes audit/crawl.json and prints a summary.
Never requests retailer/affiliate URLs."""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs import WORK
os.chdir(WORK)  # outputs go to .cache/shop/
import json, re, time, urllib.request, urllib.error, urllib.parse, collections as C, html as H, sys

BASE = 'https://shop.freshcalendars.com'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
RETAIL = re.compile(r'amazon\.|amzn\.|ebay\.|etsy\.|aliexpress\.|walmart\.|s\.click\.|freshstore\.com/r/', re.I)
SKIP_PATH = re.compile(r'^/(admin|livewire|out/|account/|cart|feed/|storage/|_)|\.(xml|rss|txt|pdf|zip)$', re.I)
BAD = re.compile(r'\[STORE_NAME\]|\[Store Name\]|FreshCalendars Shop|Lorem ipsum|best options|happy customers|lowest prices|we scour|unleash|crush your goals|bestselling|ultimate|must-have|game-changer|\bundefined\b|\{\{|\}\}', re.I)


def fetch(url, method='GET', ref=None, follow=False):
    req = urllib.request.Request(url, method=method, headers={'User-Agent': UA, **({'Referer': ref} if ref else {})})

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k): return None
    opener = urllib.request.build_opener() if follow else urllib.request.build_opener(NoRedirect)
    for attempt in range(3):
        try:
            with opener.open(req, timeout=40) as r:
                body = r.read() if method == 'GET' else b''
                return r.status, dict(r.headers), body
        except urllib.error.HTTPError as e:
            return e.code, dict(e.headers or {}), e.read() if method == 'GET' else b''
        except Exception as e:
            time.sleep(3)
            err = type(e).__name__
    return 0, {'error': err}, b''


def norm(u, base):
    u = urllib.parse.urljoin(base, H.unescape(u.strip()))
    p = urllib.parse.urlsplit(u)
    return urllib.parse.urlunsplit((p.scheme, p.netloc, p.path, p.query, ''))


def main():
    seeds = ['/']
    for sm in ('pages', 'articles', 'categories', 'brands', 'products'):
        s, _, b = fetch(f'{BASE}/sitemap-{sm}-1.xml')
        seeds += [urllib.parse.urlsplit(u).path for u in re.findall(r'<loc>([^<]+)</loc>', b.decode())]
    sitemap_urls = set(seeds[1:])
    queue, seen, pages = list(dict.fromkeys(seeds)), set(), {}
    links_out = C.defaultdict(set)  # target -> sources
    imgs = C.defaultdict(set)
    ext = C.defaultdict(set)
    while queue:
        path = queue.pop(0)
        if path in seen: continue
        seen.add(path)
        url = BASE + path
        s, hd, b = fetch(url)
        rec = {'status': s, 'in_sitemap': path.split('?')[0] in sitemap_urls}
        if s in (301, 302, 307, 308):
            rec['location'] = hd.get('Location') or hd.get('location')
            pages[path] = rec; continue
        if s != 200:
            pages[path] = rec; continue
        h = b.decode('utf-8', 'ignore')
        body = re.sub(r'<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>', ' ', h, flags=re.S | re.I)
        g = lambda rx: (re.search(rx, h, re.S | re.I) or [None, None])[1]
        rec.update({
            'title': H.unescape((g(r'<title>(.*?)</title>') or '').strip()),
            'desc': H.unescape(g(r'<meta name="description" content="([^"]*)"') or ''),
            'canonical': g(r'<link rel="canonical" href="([^"]*)"'),
            'robots': g(r'<meta name="robots" content="([^"]*)"'),
            'xrobots': hd.get('X-Robots-Tag') or hd.get('x-robots-tag'),
            'og_title': g(r'property="og:title" content="([^"]*)"'),
            'og_image': g(r'property="og:image" content="([^"]*)"'),
            'tw_card': g(r'name="twitter:card" content="([^"]*)"'),
            'h1': [re.sub(r'\s+', ' ', re.sub('<[^>]+>', '', x)).strip() for x in re.findall(r'<h1\b[^>]*>(.*?)</h1>', h, re.S | re.I)],
            'empty_h2': len([x for x in re.findall(r'<h2\b[^>]*>(.*?)</h2>', h, re.S | re.I) if not re.sub(r'<[^>]+>|\s', '', x)]),
            'words': len(re.sub(r'<[^>]+>', ' ', re.search(r'<main\b.*?</main>', body, re.S | re.I).group(0) if re.search(r'<main\b.*?</main>', body, re.S | re.I) else body).split()),
            'bad': sorted(set(m.group(0) for m in BAD.finditer(re.sub(r'<[^>]+>', ' ', body)) if not re.search(r'perfect bound', m.group(0), re.I))),
            'mixed': sorted(set(re.findall(r'(?:src|href)="(http://[^"]+)"', h)))[:5],
            'html_kb': round(len(b) / 1024),
            'lang': g(r'<html[^>]*\blang="([^"]*)"'),
            'viewport': bool(re.search(r'name="viewport"', h)),
            'theme': g(r'name="theme-color" content="([^"]*)"'),
        })
        ld_ok, ld_types = True, []
        for blk in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
            try:
                d = json.loads(blk)
                for it in (d if isinstance(d, list) else d.get('@graph', [d])):
                    ld_types.append(it.get('@type'))
            except Exception:
                ld_ok = False
        rec['ld_ok'], rec['ld_types'] = ld_ok, ld_types
        rec['img_no_alt'] = len(re.findall(r'<img\b(?![^>]*\balt=)[^>]*>', h, re.I))
        for m in re.findall(r'<img\b[^>]*\bsrc="([^"]+)"', h, re.I):
            if not m.startswith('data:'): imgs[norm(m, url)].add(path)
        for m in re.findall(r'\bhref="([^"#][^"]*)"', body, re.I):
            if m.startswith(('mailto:', 'tel:', 'javascript:')): continue
            u = norm(m, url); p = urllib.parse.urlsplit(u)
            if p.netloc == 'shop.freshcalendars.com':
                tp = p.path + (('?' + p.query) if p.query else '')
                links_out[tp].add(path)
                if not SKIP_PATH.search(p.path) and not p.query and tp not in seen and tp not in queue:
                    queue.append(tp)
            elif p.scheme in ('http', 'https') and not RETAIL.search(u):
                ext[u].add(path)
        pages[path] = rec
        time.sleep(0.12)
        if len(seen) % 50 == 0: print('crawled', len(seen), 'queue', len(queue), flush=True)
    # check every internal link target not crawled (query/skip variants)
    link_status = {}
    for tp in links_out:
        if tp in pages: link_status[tp] = pages[tp]['status']; continue
        if re.search(r'^/(admin|livewire)', tp): continue
        s, hd, _ = fetch(BASE + tp, method='GET'); link_status[tp] = s; time.sleep(0.08)
    ext_status = {}
    for u in ext:
        s, hd, _ = fetch(u, method='GET', follow=True); ext_status[u] = s; time.sleep(0.08)
    img_status = {}
    for u in imgs:
        if RETAIL.search(u) and 'media-amazon' not in u: continue
        s, hd, _ = fetch(u, method='GET', ref=BASE + '/', follow=True); img_status[u] = (s, (hd.get('Content-Type') or hd.get('content-type') or '')[:20]); time.sleep(0.05)
    json.dump({'pages': pages, 'links': {k: sorted(v) for k, v in links_out.items()}, 'link_status': link_status,
               'ext_status': ext_status, 'ext_src': {k: sorted(v)[:3] for k, v in ext.items()},
               'img_status': img_status, 'img_src': {k: sorted(v)[:3] for k, v in imgs.items()},
               'sitemap': sorted(sitemap_urls)}, open('audit/crawl.json', 'w'))
    print('done pages', len(pages), 'links', len(link_status), 'ext', len(ext_status), 'imgs', len(img_status), flush=True)


if __name__ == '__main__':
    main()
