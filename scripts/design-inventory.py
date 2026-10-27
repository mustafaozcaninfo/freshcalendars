"""Read public sitemaps/pages to inventory layouts before the visual refresh."""
import concurrent.futures
import collections
import datetime
from html.parser import HTMLParser
import json
import subprocess
from pathlib import Path
import urllib.parse
import xml.etree.ElementTree as ET

ORIGIN = "https://freshcalendars.com"
OUT = Path(__file__).resolve().parents[1] / "output/design-audit"
OUT.mkdir(parents=True, exist_ok=True)

def fetch(url):
    try:
        response = subprocess.run(["curl", "-sSL", "--max-time", "25", "-A", "FreshCalendars-DesignInventory/1.0", "-w", "\n%{http_code}\t%{url_effective}", url], capture_output=True, text=True, check=True)
        body, metadata = response.stdout.rsplit("\n", 1)
        code, final = metadata.split("\t", 1)
        return int(code), final, body
    except Exception as error:
        return getattr(error, "code", 0), url, str(error)

def local_page(href, base=ORIGIN):
    url = urllib.parse.urlsplit(urllib.parse.urljoin(base, href))
    if url.netloc not in ("freshcalendars.com", "www.freshcalendars.com") or url.query:
        return None
    p = url.path or "/"
    if p.startswith(("/admin", "/api")) or "." in p.rsplit("/", 1)[-1] and not p.endswith(".html"):
        return None
    return ORIGIN + p

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.h1 = []
        self.headings = []
        self.links = []
        self.downloads = []
        self.images = 0
        self.canonical = ""
        self.html_class = ""
        self.capture = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("title", "h1", "h2", "h3"):
            self.capture = [tag, ""]
        if tag == "html": self.html_class = a.get("class", "")
        if tag == "img": self.images += 1
        if tag == "link" and a.get("rel") == "canonical": self.canonical = a.get("href", "")
        if tag == "a" and a.get("href"):
            self.links.append(a["href"])
            if a["href"].split("?")[0].endswith((".pdf", ".png")): self.downloads.append(a["href"])

    def handle_data(self, data):
        if self.capture: self.capture[1] += data

    def handle_endtag(self, tag):
        if self.capture and self.capture[0] == tag:
            value = " ".join(self.capture[1].split())
            if tag == "title": self.title = value
            if tag == "h1": self.h1.append(value)
            if tag in ("h2", "h3"): self.headings.append(value)
            self.capture = None

def inspect(url):
    status, final, body = fetch(url)
    p = Page()
    if status == 200: p.feed(body)
    return {"url": url, "final": final, "status": status, "title": p.title, "h1": p.h1,
            "headings": p.headings, "class": p.html_class, "canonical": p.canonical,
            "images": p.images, "downloads": p.downloads, "links": p.links}

pending_maps = [ORIGIN + "/sitemap.xml", ORIGIN + "/news/sitemap.xml"]
maps = set()
urls = set()
while pending_maps:
    url = pending_maps.pop()
    if url in maps: continue
    maps.add(url)
    status, _, body = fetch(url)
    if status != 200: raise RuntimeError(f"Sitemap unavailable: {url} ({status})")
    tree = ET.fromstring(body)
    locs = [n.text for n in tree.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    for loc in locs:
        if loc.endswith(".xml"): pending_maps.append(loc)
        elif local_page(loc): urls.add(local_page(loc))

rows = []
seen = set()
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    while urls - seen:
        batch = sorted(urls - seen)
        seen.update(batch)
        for row in pool.map(inspect, batch):
            rows.append(row)
            urls.update(u for href in row["links"] if (u := local_page(href, row["final"])))
        print(f"Scanned {len(rows)} HTML URLs; discovered {len(urls)}", flush=True)
        if len(urls) > 1200: raise RuntimeError("Unexpectedly large URL graph; inspect inventory")

rows.sort(key=lambda r: r["url"])
counts = collections.Counter(r["class"] or "unclassified" for r in rows)
result = {"checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
          "sitemaps": sorted(maps), "count": len(rows), "classes": dict(counts), "pages": rows}
(OUT / "live-inventory.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
lines = ["# FreshCalendars live page inventory", "", f"Read-only public crawl: {result['checkedAt']}",
         f"Pages: {len(rows)}. Sitemaps: {len(maps)}.", "", "| URL | Status | Layout | H1 count | PDF/PNG links |", "|---|---:|---|---:|---:|"]
for r in rows:
    lines.append(f"| {urllib.parse.urlsplit(r['url']).path} | {r['status']} | {r['class']} | {len(r['h1'])} | {len(r['downloads'])} |")
(OUT / "live-inventory.md").write_text("\n".join(lines) + "\n")
print(json.dumps({"pages": len(rows), "layouts": dict(counts), "statuses": dict(collections.Counter(r['status'] for r in rows))}))
