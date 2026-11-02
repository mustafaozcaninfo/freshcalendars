# Drawn editor portraits (illustrations, not likenesses) and the News Desk emblem, 1024x1024 SVG.
# Usage: python3 make-avatars.py <out-dir>; then node make-avatars-png.mjs renders the PNGs.
import sys
W=1024
def grain(id):
    return f'''<filter id="{id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter>'''
def eye(cx,cy,iris,lid,scale=1.0):
    return f'''<g>
<path d="M{cx-34} {cy} Q{cx} {cy-26} {cx+34} {cy} Q{cx} {cy+20} {cx-34} {cy} Z" fill="#fbf7f0"/>
<circle cx="{cx}" cy="{cy-1}" r="15" fill="{iris}"/><circle cx="{cx}" cy="{cy-1}" r="7.5" fill="#1a1412"/><circle cx="{cx+5}" cy="{cy-6}" r="4" fill="#fff" opacity=".9"/>
<path d="M{cx-36} {cy+1} Q{cx} {cy-30} {cx+36} {cy+1}" fill="none" stroke="{lid}" stroke-width="5" stroke-linecap="round"/>
</g>'''
def face(c):
    s=c['skin']; sh=c['shade']; ln=c['line']
    out=[]
    # neck
    out.append(f'<path d="M452 560 L452 690 Q512 730 572 690 L572 560 Z" fill="{sh}"/>')
    # ears
    out.append(f'<ellipse cx="358" cy="452" rx="26" ry="40" fill="{s}"/><ellipse cx="666" cy="452" rx="26" ry="40" fill="{s}"/>')
    out.append(f'<path d="M352 440 Q362 452 356 468" stroke="{sh}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M672 440 Q662 452 668 468" stroke="{sh}" stroke-width="5" fill="none" stroke-linecap="round"/>')
    # head
    jaw=c.get('jaw',0)
    out.append(f'<path d="M370 400 Q368 270 512 262 Q656 270 654 400 Q656 520 {600+jaw} 585 Q556 628 512 630 Q468 628 {424-jaw} 585 Q368 520 370 400 Z" fill="{s}"/>')
    # cheek shading
    out.append(f'<path d="M376 430 Q384 540 452 600 Q420 520 398 430 Z" fill="{sh}" opacity=".35"/><path d="M648 430 Q640 540 572 600 Q604 520 626 430 Z" fill="{sh}" opacity=".35"/>')
    if c.get('stubble'):
        out.append(f'<path d="M408 520 Q430 610 512 628 Q594 610 616 520 Q600 580 512 596 Q424 580 408 520 Z" fill="{c["stubble"]}" opacity=".15"/>')
        out.append(f'<path d="M462 545 Q512 528 562 545 Q545 556 512 552 Q479 556 462 545 Z" fill="{c["stubble"]}" opacity=".14"/>')
    # brows
    out.append(f'<path d="M412 392 Q446 {372-c.get("brow",0)} 482 386" stroke="{c["browc"]}" stroke-width="{c.get("bw",11)}" fill="none" stroke-linecap="round"/>')
    out.append(f'<path d="M542 386 Q578 {372-c.get("brow",0)} 612 392" stroke="{c["browc"]}" stroke-width="{c.get("bw",11)}" fill="none" stroke-linecap="round"/>')
    out.append(eye(448,430,c['iris'],ln)); out.append(eye(576,430,c['iris'],ln))
    if c.get('lash'):
        out.append(f'<path d="M412 428 l-10 -8 M584 428 l0 0 M612 428 l10 -8" stroke="{ln}" stroke-width="4" stroke-linecap="round"/>')
    # nose
    out.append(f'<path d="M512 440 Q506 492 494 508 Q504 520 520 514" fill="none" stroke="{sh}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>')
    # mouth
    out.append(f'<path d="M466 556 Q512 {586+c.get("smile",0)} 560 552" fill="none" stroke="{c["lip"]}" stroke-width="8" stroke-linecap="round"/>')
    out.append(f'<path d="M478 562 Q512 {580+c.get("smile",0)} 548 560" fill="none" stroke="{c["lip"]}" stroke-width="3" opacity=".5" stroke-linecap="round"/>')
    # blush
    out.append(f'<ellipse cx="428" cy="500" rx="30" ry="16" fill="{c["blush"]}" opacity=".18"/><ellipse cx="596" cy="500" rx="30" ry="16" fill="{c["blush"]}" opacity=".18"/>')
    return '\n'.join(out)
def build(c):
    g=grain('g')
    parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{W}" viewBox="0 0 {W} {W}"><defs>{g}<clipPath id="cl"><rect width="{W}" height="{W}"/></clipPath></defs>',
           f'<rect width="{W}" height="{W}" fill="{c["bg"]}"/>', c['bgart'], c.get('hairback',''),
           c['body'], face(c), c['hair'], c.get('extra',''),
           f'<rect width="{W}" height="{W}" fill="#000" filter="url(#g)"/></svg>']
    return '\n'.join(parts)


# Christina Gerland: holidays, elections and civic calendars. Wall calendar, ballot tick, ribbon.
christina=dict(skin="#f0c8a8",shade="#d9a888",line="#4a3024",iris="#3f6a8a",browc="#8a5a34",lip="#b8565a",blush="#e08a80",brow=5,smile=5,bw=8,lash=True,
 bg="#f4ede2",
 bgart='''<g><rect x="96" y="130" width="290" height="300" rx="18" fill="#fff" opacity=".75"/>
<rect x="96" y="130" width="290" height="70" rx="18" fill="#b8565a" opacity=".55"/>
<g fill="#1f3352" opacity=".18"><rect x="120" y="220" width="44" height="40" rx="6"/><rect x="180" y="220" width="44" height="40" rx="6"/><rect x="240" y="220" width="44" height="40" rx="6"/><rect x="300" y="220" width="44" height="40" rx="6"/>
<rect x="120" y="280" width="44" height="40" rx="6"/><rect x="180" y="280" width="44" height="40" rx="6"/><rect x="300" y="280" width="44" height="40" rx="6"/><rect x="120" y="340" width="44" height="40" rx="6"/><rect x="180" y="340" width="44" height="40" rx="6"/></g>
<rect x="240" y="280" width="44" height="40" rx="6" fill="#b8565a" opacity=".8"/>
<rect x="700" y="160" width="200" height="150" rx="14" fill="#1f3352" opacity=".14"/><path d="M745 235 l30 30 l60 -64" stroke="#3f8a5a" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>
<path d="M760 760 q60 -40 120 0 q-60 40 -120 0 Z" fill="#b8565a" opacity=".25"/><circle cx="170" cy="800" r="90" fill="#1f3352" opacity=".08"/></g>''',
 hairback='''<path d="M326 430 Q314 250 446 208 Q520 188 594 208 Q718 250 700 440 Q712 600 700 700 Q690 740 650 744 L374 744 Q334 740 324 700 Q312 600 326 430 Z" fill="#a8743e"/>''',
 body='''<path d="M180 1024 Q196 808 340 748 Q420 714 470 702 L512 760 L554 702 Q604 714 684 748 Q828 808 844 1024 Z" fill="#1f3352"/>
<path d="M470 702 L512 760 L554 702 L548 740 L512 790 L476 740 Z" fill="#f4ede2"/>
<path d="M470 702 L428 722 L486 900 L512 790 Z" fill="#2a4166"/><path d="M554 702 L596 722 L538 900 L512 790 Z" fill="#2a4166"/>
<circle cx="404" cy="830" r="16" fill="#b8565a"/><path d="M396 846 l-8 30 M412 846 l8 30" stroke="#b8565a" stroke-width="7" stroke-linecap="round"/>''',
 hair='''<path d="M366 440 Q352 290 440 240 Q520 200 604 236 Q678 276 662 420 Q640 340 592 300 Q540 296 500 290 Q430 300 400 350 Q378 390 366 440 Z" fill="#b8824a"/>
<path d="M500 290 Q560 252 620 280 Q600 250 560 240 Q520 236 480 256 Z" fill="#c8945a"/>
<path d="M600 258 Q660 320 662 420" stroke="#d6a66a" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/><path d="M440 262 Q396 310 392 380" stroke="#d6a66a" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/>''',
 extra='''<circle cx="358" cy="500" r="9" fill="#e0a33a"/><circle cx="666" cy="500" r="9" fill="#e0a33a"/>''')

# Aaron Kessler: school calendars, money and benefits. Stacked books, coins, a ruled planner.
aaron=dict(skin="#d9a27a",shade="#bc855e",line="#3a2618",iris="#4a6a3a",browc="#2e2018",lip="#8e5444",blush="#c46e5a",stubble="#2e2018",brow=3,smile=3,jaw=10,bw=13,
 bg="#eef1e6",
 bgart='''<g><rect x="110" y="300" width="240" height="44" rx="8" fill="#4f8a8b" opacity=".45"/><rect x="126" y="256" width="210" height="44" rx="8" fill="#c99a3c" opacity=".5"/><rect x="100" y="212" width="230" height="44" rx="8" fill="#8e5444" opacity=".35"/>
<g fill="#c99a3c" opacity=".6"><ellipse cx="800" cy="300" rx="70" ry="22"/><ellipse cx="800" cy="276" rx="70" ry="22"/><ellipse cx="800" cy="252" rx="70" ry="22"/></g>
<text x="800" y="262" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="30" fill="#fff" opacity=".8">$</text>
<rect x="700" y="660" width="210" height="250" rx="14" fill="#fff" opacity=".6" transform="rotate(6 805 785)"/>
<g stroke="#4f8a8b" stroke-width="3" opacity=".35" transform="rotate(6 805 785)"><line x1="720" y1="710" x2="890" y2="710"/><line x1="720" y1="750" x2="890" y2="750"/><line x1="720" y1="790" x2="890" y2="790"/><line x1="720" y1="830" x2="890" y2="830"/></g></g>''',
 body='''<path d="M180 1024 Q190 802 330 744 Q420 708 470 694 L512 740 L554 694 Q604 708 694 744 Q834 802 844 1024 Z" fill="#8e5444"/>
<path d="M452 690 L512 742 L572 690 L566 716 L512 770 L458 716 Z" fill="#eef1e6"/>
<path d="M440 694 Q512 790 584 694" stroke="#7a463a" stroke-width="14" fill="none"/>
<path d="M330 1024 L340 860 M694 1024 L684 860" stroke="#7a463a" stroke-width="8" stroke-linecap="round" opacity=".6"/>''',
 hair='''<path d="M372 410 Q360 300 420 262 Q500 220 592 244 Q664 270 654 410 Q644 340 610 316 Q560 300 520 312 Q470 296 430 320 Q392 346 372 410 Z" fill="#2e2018"/>
<path d="M430 292 Q500 262 590 280" stroke="#4a3426" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>''',
 extra='''<path d="M408 520 Q426 616 512 634 Q598 616 616 520 Q604 590 512 606 Q420 590 408 520 Z" fill="#2e2018" opacity=".55"/>
<path d="M466 548 Q512 530 558 548 Q540 562 512 558 Q484 562 466 548 Z" fill="#2e2018" opacity=".6"/>''')

# Jessica Hartwell: time, sky, sports and entertainment. Clock face, stars, a scoreboard.
jessica=dict(skin="#a86f4c",shade="#8c5838",line="#2a1810",iris="#3a2416",browc="#1e1410",lip="#8a3e3a",blush="#b8604a",brow=6,smile=7,bw=9,lash=True,
 bg="#e8eef6",
 bgart='''<g><circle cx="230" cy="260" r="130" fill="#fff" opacity=".7"/><circle cx="230" cy="260" r="130" fill="none" stroke="#2f7d7a" stroke-width="6" opacity=".5"/>
<path d="M230 260 L230 180 M230 260 L290 290" stroke="#3a3f45" stroke-width="10" stroke-linecap="round" opacity=".6"/><circle cx="230" cy="260" r="10" fill="#e98a3b"/>
<g fill="#e98a3b" opacity=".8"><path d="M800 150 l10 24 26 2 -20 16 7 25 -23 -14 -23 14 7 -25 -20 -16 26 -2 Z"/></g>
<g fill="#2f7d7a" opacity=".45"><circle cx="880" cy="260" r="7"/><circle cx="740" cy="230" r="5"/><circle cx="860" cy="340" r="5"/></g>
<rect x="700" y="660" width="220" height="120" rx="12" fill="#3a3f45" opacity=".75"/><text x="810" y="738" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="54" fill="#e98a3b">21:14</text></g>''',
 hairback='''<path d="M340 430 Q330 260 450 216 Q520 196 590 216 Q700 258 690 430 Q696 520 680 580 L352 580 Q334 520 340 430 Z" fill="#1e1410"/>''',
 body='''<path d="M180 1024 Q194 806 338 746 Q420 712 470 700 L512 740 L554 700 Q604 712 686 746 Q830 806 844 1024 Z" fill="#2f7d7a"/>
<path d="M470 700 Q512 750 554 700 L548 1024 L476 1024 Z" fill="#3a3f45"/>
<path d="M470 700 L432 720 L470 1024 L476 1024 Z" fill="#256764"/><path d="M554 700 L592 720 L554 1024 L548 1024 Z" fill="#256764"/>
<rect x="612" y="860" width="70" height="12" rx="5" fill="#e98a3b" opacity=".9"/>''',
 hair='''<path d="M364 430 Q352 286 446 238 Q526 202 606 238 Q680 280 664 430 Q650 360 616 322 Q580 298 512 300 Q440 304 404 346 Q378 380 364 430 Z" fill="#1e1410"/>
<path d="M352 470 Q340 540 356 590 Q346 620 372 640" stroke="#1e1410" stroke-width="30" fill="none" stroke-linecap="round"/>
<path d="M672 470 Q684 540 668 590 Q678 620 652 640" stroke="#1e1410" stroke-width="30" fill="none" stroke-linecap="round"/>
<path d="M606 248 Q656 300 660 380" stroke="#3a2a22" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>''',
 extra='''<path d="M354 500 l0 34" stroke="#e98a3b" stroke-width="6" stroke-linecap="round"/><circle cx="354" cy="540" r="9" fill="#e98a3b"/>
<path d="M670 500 l0 34" stroke="#e98a3b" stroke-width="6" stroke-linecap="round"/><circle cx="670" cy="540" r="9" fill="#e98a3b"/>''')

def desk():
    """The News Desk is a team, so it gets an emblem, not a face: a folded newspaper over a puzzle grid."""
    g=grain('g'); cells=[]
    for r in range(5):
        for c in range(5):
            fill="#2f5a46" if (r*5+c) in (0,6,12,18,24,4,20) else "#ffffff"
            cells.append(f'<rect x="{332+c*72}" y="{300+r*72}" width="64" height="64" rx="10" fill="{fill}" opacity="{.85 if fill=="#2f5a46" else .9}"/>')
    return '\n'.join([f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{W}" viewBox="0 0 {W} {W}"><defs>{g}</defs>',
        f'<rect width="{W}" height="{W}" fill="#eef4ee"/>',
        '<circle cx="512" cy="512" r="420" fill="none" stroke="#2f5a46" stroke-width="10" opacity=".35"/>',
        '<circle cx="512" cy="512" r="350" fill="none" stroke="#2f5a46" stroke-width="4" opacity=".3" stroke-dasharray="14 18"/>',
        '<rect x="300" y="268" width="424" height="424" rx="28" fill="#dfe9df"/>', *cells,
        '<path d="M250 720 L774 720 L742 820 L282 820 Z" fill="#1f3352"/><rect x="300" y="740" width="200" height="16" rx="6" fill="#eef4ee" opacity=".8"/><rect x="300" y="772" width="320" height="12" rx="6" fill="#eef4ee" opacity=".5"/>',
        '<circle cx="790" cy="250" r="46" fill="#e0a33a" opacity=".9"/>',
        f'<rect width="{W}" height="{W}" fill="#000" filter="url(#g)"/></svg>'])

for n,c in [('christina-gerland',christina),('aaron-kessler',aaron),('jessica-hartwell',jessica)]:
    open(f'{sys.argv[1]}/{n}.svg','w').write(build(c))
open(f'{sys.argv[1]}/news-desk.svg','w').write(desk())
