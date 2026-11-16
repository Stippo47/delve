import base64, subprocess, os, glob
def uri(p): return "data:image/svg+xml;base64," + base64.b64encode(open(p,'rb').read()).decode()
def cell(f,sz,a=0):
    return f'<div class="u" style="width:{sz}px;height:{sz}px"><img src="{uri(f)}" width={sz} height={sz} style="transform:rotate({a}deg)"></div>'
def row(lab,f):
    big=cell(f,200)
    r70=''.join(cell(f,70,a) for a in range(0,360,45))
    r40=''.join(cell(f,40,a) for a in range(0,360,45))
    return f'<div class="row"><div class="l">{lab}</div>{big}<div class="rs"><div class="r">{r70}</div><div class="r s">{r40}</div></div></div>'
rows=[('archer','/home/claude/archer/final/archer.svg'),('base (Bowl 160)','/home/claude/archer/base/set-a8/base-1s-160.svg')]
names={1:'1 Wildmane',2:'2 Bearskin',3:'3 Warhelm',4:'4 Flail'}
import re
for i in range(1,5):
    p=f'design-{i}.svg'
    if os.path.exists(p): rows.append((names[i],p))
html=f'''<!doctype html><meta charset=utf-8><style>
body{{margin:0;padding:14px 20px;background:#EDE6D8;font:600 14px system-ui;color:#2B2230;width:max-content}}
.row{{display:flex;align-items:center;gap:16px;margin-bottom:6px}}
.l{{width:90px;opacity:.65;text-align:right}}
.r{{display:flex;gap:14px;align-items:center;margin-bottom:6px}} .r.s{{gap:44px;padding-left:15px}}
.u{{position:relative;flex:none}}
.u::before{{content:"";position:absolute;left:18%;right:18%;bottom:3%;height:14%;border-radius:50%;background:rgba(43,34,48,.15)}}
.u img{{position:relative;display:block}}
</style>{"".join(rows[i][0] and row(*rows[i]) for i in range(len(rows)))}'''
open('/tmp/b2.html','w').write(html)
h=14*2+len(rows)*(206)+20
subprocess.run(['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=2','--screenshot='+os.path.abspath('sheet.png'),f'--window-size=1000,{h}','file:///tmp/b2.html'],capture_output=True)
