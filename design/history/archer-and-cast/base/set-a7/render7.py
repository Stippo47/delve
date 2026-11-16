"""set-a6 sheet: per base row = [no-shoulders, 140, 160, 180] @170px with 1x1 guide + 40px rotation strip of the 160 version."""
import base64, subprocess, os
def uri(p): return "data:image/svg+xml;base64," + base64.b64encode(open(p, 'rb').read()).decode()
GUIDE = '<svg viewBox="-10 -10 220 220" style="position:absolute;inset:0;width:100%;height:100%"><rect x="38" y="38" width="124" height="124" fill="none" stroke="#2B2230" stroke-opacity=".3" stroke-width="1.2" stroke-dasharray="4 3"/><circle cx="100" cy="100" r="62" fill="#2B2230" fill-opacity=".07" stroke="#2B2230" stroke-opacity=".35" stroke-width="1.2"/></svg>'
def cell(f, sz, a=0, guide=False, cap=''):
    g = GUIDE if guide else ''
    c = f'<div class="cap">{cap}</div>' if cap else ''
    return f'<div class="cw"><div class="u" style="width:{sz}px;height:{sz}px">{g}<img src="{uri(f)}" width={sz} height={sz} style="transform:rotate({a}deg)"></div>{c}</div>'
def strip(f): return '<div class="r40">' + ''.join(cell(f, 40, a) for a in range(0, 360, 45)) + '</div>'
A = '/home/claude/archer/final/'
rows = []
for lab, f in (('archer hood', A + 'archer-hood-only.svg'), ('archer', A + 'archer.svg')):
    rows.append(f'<div class="row"><div class="l">{lab}</div>{cell(f,170)}{strip(f)}</div>')
for n, name in (('1', 'Bowl'), ('2', 'Swept'), ('3', 'Crop')):
    cells = cell(f'base-{n}.svg', 170, guide=True, cap='no shoulders') + ''.join(
        cell(f'base-{n}s-{w}.svg', 170, guide=True, cap=f'{w}') for w in (160, 170, 180))
    rows.append(f'<div class="row"><div class="l">{n} {name}</div>{cells}<div class="sw"><div class="cap">170 @40px</div>{strip(f"base-{n}s-170.svg")}</div></div>')
html = f'''<!doctype html><meta charset=utf-8><style>
body{{margin:0;padding:16px 20px;background:#EDE6D8;font:600 14px Inter,system-ui;color:#2B2230;width:max-content}}
.row{{display:flex;align-items:center;gap:16px;margin-bottom:12px}}
.l{{width:80px;opacity:.65;text-align:right}}
.cw{{display:flex;flex-direction:column;align-items:center}} .cap{{opacity:.55;font-size:12px;margin-top:2px}}
.r40{{display:flex;gap:14px;align-items:center;padding-left:10px}}
.sw{{display:flex;flex-direction:column;align-items:flex-start}}
.u{{position:relative;flex:none}}
.u::before{{content:"";position:absolute;left:18%;right:18%;bottom:3%;height:14%;border-radius:50%;background:rgba(43,34,48,.15)}}
.u img{{position:relative;display:block}}
</style>{"".join(rows)}'''
open('/tmp/a7.html', 'w').write(html)
subprocess.run(['/usr/bin/google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
                '--force-device-scale-factor=2', '--screenshot=' + os.path.abspath('sheet.png'), '--window-size=1340,1060', 'file:///tmp/a7.html'],
               capture_output=True)
print('sheet.png')
