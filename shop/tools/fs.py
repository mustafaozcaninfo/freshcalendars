"""FreshStore Site API client for shop.freshcalendars.com.

The API key is never stored in the repository. Set it once per machine, either as the
environment variable FRESHSTORE_TOKEN or in the gitignored file .cache/shop/token.
Rate limit: 60 requests a minute per key, shared by every caller, so run one API script at a time
and keep about one second between calls.

    from fs import call, WORK
    status, body = call('GET', 'products/213')
"""
import json, os, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.cache' / 'shop'          # all outputs, backups and audits go here (gitignored)
WORK.mkdir(parents=True, exist_ok=True)
for _d in ('audit', 'backup', 'kw', 'reviews'): (WORK / _d).mkdir(exist_ok=True)
BASE = 'https://shop.freshcalendars.com/api/'


def _token():
    t = os.environ.get('FRESHSTORE_TOKEN', '').strip()
    if not t and (WORK / 'token').exists():
        t = (WORK / 'token').read_text().strip()
    if not t:
        raise SystemExit('No API key: set FRESHSTORE_TOKEN or write it to .cache/shop/token')
    return t


def call(method, path, body=None, retries=3):
    """Returns (status, json). Retries on 429 and network errors."""
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(retries):
        req = urllib.request.Request(BASE + path, data=data, method=method, headers={
            'Authorization': 'Bearer ' + _token(), 'User-Agent': 'FreshCalendarsScript/1.0',
            'Content-Type': 'application/json', 'Accept': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                raw = r.read().decode() or '{}'
                return r.status, json.loads(raw)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                time.sleep(20); continue
            raw = e.read().decode() or '{}'
            try: return e.code, json.loads(raw)
            except ValueError: return e.code, {'raw': raw[:500]}
        except (urllib.error.URLError, TimeoutError):
            if attempt == retries - 1: raise
            time.sleep(5)


def backup(name, obj):
    """Write a JSON backup under .cache/shop/backup/ before changing anything."""
    d = WORK / 'backup'; d.mkdir(exist_ok=True)
    (d / f'{name}.json').write_text(json.dumps(obj, indent=1))
