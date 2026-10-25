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

alex=dict(skin="#c08a62",shade="#a36f4b",line="#3a261b",iris="#5b3a24",browc="#33231a",lip="#8a4f3b",blush="#c0604a",stubble="#3a2a20",brow=4,smile=4,jaw=6,
 bg="#f3ead8",
 bgart='''<g opacity=".9"><rect x="96" y="120" width="300" height="300" rx="18" fill="none" stroke="#4f8a8b" stroke-width="6" opacity=".35"/>
<g stroke="#4f8a8b" stroke-width="4" opacity=".3"><line x1="96" y1="200" x2="396" y2="200"/><line x1="96" y1="275" x2="396" y2="275"/><line x1="96" y1="350" x2="396" y2="350"/><line x1="171" y1="200" x2="171" y2="420"/><line x1="246" y1="200" x2="246" y2="420"/><line x1="321" y1="200" x2="321" y2="420"/></g>
<rect x="96" y="120" width="300" height="80" rx="18" fill="#4f8a8b" opacity=".22"/>
<rect x="700" y="170" width="190" height="120" rx="14" fill="#4f8a8b" opacity=".18"/><rect x="760" y="250" width="170" height="100" rx="14" fill="#e0a33a" opacity=".55"/>
<circle cx="830" cy="760" r="120" fill="#4f8a8b" opacity=".14"/></g>''',
 body='''<path d="M180 1024 Q190 800 330 742 Q420 706 470 690 L512 760 L554 690 Q604 706 694 742 Q834 800 844 1024 Z" fill="#1f3352"/>
<path d="M452 676 L512 770 L572 676 L560 720 L512 800 L464 720 Z" fill="#efe4cf"/>
<path d="M452 676 L420 700 L470 790 L512 770 Z" fill="#2a4166"/><path d="M572 676 L604 700 L554 790 L512 770 Z" fill="#2a4166"/>
<path d="M512 800 L512 1024" stroke="#16263f" stroke-width="5"/><circle cx="512" cy="860" r="7" fill="#e0a33a"/><circle cx="512" cy="940" r="7" fill="#e0a33a"/>
<path d="M300 900 L380 880" stroke="#2a4166" stroke-width="8" stroke-linecap="round"/>''',
 hair='''<path d="M366 410 Q350 300 410 252 Q480 200 580 218 Q660 236 668 330 Q672 380 656 420 Q648 352 610 318 Q560 300 470 316 Q420 330 392 360 Q378 384 366 410 Z" fill="#3b2a20"/>
<path d="M420 300 Q520 236 640 286 Q560 262 470 290 Z" fill="#4e382a"/><path d="M450 318 Q540 280 620 300" stroke="#5c4433" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>''')

emily=dict(skin="#e8bf9c",shade="#cf9f7d",line="#4a2e22",iris="#7a5a2c",browc="#5a3520",lip="#b05a52",blush="#d98c7a",brow=6,smile=6,bw=9,lash=True,
 bg="#f6f0e2",
 bgart='''<g><rect x="90" y="110" width="270" height="350" rx="16" fill="#fff" opacity=".7" transform="rotate(-6 225 285)"/>
<g stroke="#d98c7a" stroke-width="3" opacity=".35" transform="rotate(-6 225 285)"><line x1="120" y1="170" x2="330" y2="170"/><line x1="120" y1="215" x2="330" y2="215"/><line x1="120" y1="260" x2="330" y2="260"/><line x1="120" y1="305" x2="330" y2="305"/><line x1="120" y1="350" x2="330" y2="350"/><line x1="120" y1="395" x2="330" y2="395"/></g>
<rect x="690" y="140" width="230" height="170" rx="16" fill="#c99a3c" opacity=".35" transform="rotate(5 805 225)"/>
<g fill="#2f5a46" opacity=".25"><circle cx="730" cy="380" r="6"/><circle cx="770" cy="380" r="6"/><circle cx="810" cy="380" r="6"/><circle cx="850" cy="380" r="6"/><circle cx="730" cy="420" r="6"/><circle cx="770" cy="420" r="6"/><circle cx="810" cy="420" r="6"/><circle cx="850" cy="420" r="6"/></g>
<circle cx="160" cy="820" r="110" fill="#d98c7a" opacity=".2"/></g>''',
 hairback='''<path d="M330 420 Q320 250 440 214 Q520 192 600 214 Q712 250 698 430 Q706 560 692 640 Q704 700 656 734 L368 734 Q320 700 332 640 Q318 560 330 420 Z" fill="#6e3f22"/>''',
 body='''<path d="M180 1024 Q196 806 340 746 Q420 712 466 700 L512 790 L558 700 Q604 712 684 746 Q828 806 844 1024 Z" fill="#2f5a46"/>
<path d="M466 700 Q512 760 558 700 L560 1024 L464 1024 Z" fill="#f6f0e2"/>
<path d="M466 700 L430 716 L490 880 L512 800 Z" fill="#3c6c56"/><path d="M558 700 L594 716 L534 880 L512 800 Z" fill="#3c6c56"/>
<path d="M500 760 Q512 772 524 760" stroke="#c99a3c" stroke-width="5" fill="none"/>''',
 hair='''<path d="M368 430 Q356 296 430 248 Q510 206 596 236 Q676 270 664 400 Q640 330 588 300 Q556 330 470 336 Q420 340 392 372 Q376 396 368 430 Z" fill="#7a4a2a"/>
<path d="M470 336 Q540 310 588 300 Q560 270 520 262 Q470 270 440 300 Z" fill="#8a5632"/>
<path d="M360 470 Q340 560 372 640 Q352 700 384 726" stroke="#6e3f22" stroke-width="26" fill="none" stroke-linecap="round"/>
<path d="M664 470 Q684 560 652 640 Q672 700 640 726" stroke="#6e3f22" stroke-width="26" fill="none" stroke-linecap="round"/>
<path d="M600 250 Q650 300 650 380" stroke="#9a6640" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/><path d="M430 270 Q392 320 390 390" stroke="#9a6640" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/>''')

import random
random.seed(3)
curls=[]
for i in range(120):
    import math
    a=math.pi*(1.02+0.96*i/119)
    r=150+random.uniform(-6,10)
    x=512+math.cos(a)*r*1.02; y=372+math.sin(a)*r*0.86
    curls.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(14,20):.0f}" fill="#1b1512"/>')
tex=[]
for i in range(70):
    x=random.uniform(400,624); y=random.uniform(250,330)
    tex.append(f'<path d="M{x:.0f} {y:.0f} q6 -7 12 0" stroke="#3a2c24" stroke-width="3" fill="none" opacity=".7"/>')
jordan=dict(skin="#8a5636",shade="#6e4128",line="#1f140e",iris="#3a2416",browc="#1b1512",lip="#5a2f22",blush="#a0503a",brow=3,smile=5,bw=12,
 bg="#e9f2f8",
 bgart='''<g fill="none"><circle cx="512" cy="470" r="400" stroke="#a9cfe6" stroke-width="5" opacity=".7"/><circle cx="512" cy="470" r="330" stroke="#a9cfe6" stroke-width="3" opacity=".6" stroke-dasharray="14 18"/>
<path d="M140 330 A400 400 0 0 1 330 120" stroke="#2f7d7a" stroke-width="8" stroke-linecap="round" opacity=".45"/></g>
<circle cx="840" cy="210" r="58" fill="#e98a3b" opacity=".85"/><circle cx="252" cy="190" r="14" fill="#2f7d7a" opacity=".6"/>
<g fill="#3a3f45" opacity=".35"><circle cx="760" cy="420" r="8"/><circle cx="820" cy="380" r="8"/><circle cx="880" cy="400" r="8"/><circle cx="930" cy="350" r="8"/></g>
<polyline points="760,420 820,380 880,400 930,350" fill="none" stroke="#3a3f45" stroke-width="3" opacity=".3"/>''',
 body='''<path d="M180 1024 Q192 804 336 744 Q420 708 470 696 L512 720 L554 696 Q604 708 688 744 Q832 804 844 1024 Z" fill="#3a3f45"/>
<path d="M440 690 Q512 740 584 690 L600 760 L560 1024 L464 1024 L424 760 Z" fill="#2f7d7a"/>
<path d="M452 690 Q512 734 572 690" stroke="#256764" stroke-width="10" fill="none"/>
<path d="M440 690 L400 714 L456 900 L470 760 Z" fill="#454b52"/><path d="M584 690 L624 714 L568 900 L554 760 Z" fill="#454b52"/>
<rect x="640" y="860" width="60" height="10" rx="4" fill="#e98a3b" opacity=".9"/>''',
 hair='<path d="M372 400 Q366 290 430 250 Q512 212 594 250 Q658 290 652 400 Q636 336 600 312 Q512 290 424 312 Q388 336 372 400 Z" fill="#1b1512"/>'+''.join(curls)+''.join(tex),
 extra='''<g fill="none" stroke="#2b2b2b" stroke-width="7"><circle cx="448" cy="430" r="46"/><circle cx="576" cy="430" r="46"/><path d="M494 424 Q512 412 530 424"/><path d="M402 424 L372 414"/><path d="M622 424 L652 414"/></g>
<g fill="#fff" opacity=".18"><ellipse cx="434" cy="414" rx="18" ry="10"/><ellipse cx="562" cy="414" rx="18" ry="10"/></g>''')
import json
for n,c in [('alex-morgan',alex),('emily-carter',emily),('jordan-bennett',jordan)]:
    open(f'{sys.argv[1]}/{n}.svg','w').write(build(c))
