import base64,subprocess,sys,os
files=sys.argv[2:]; out=sys.argv[1]
def uri(p): return "data:image/svg+xml;base64,"+base64.b64encode(open(p,'rb').read()).decode()
cells=[]
for f in files:
    u=uri(f); lab=f.replace('.svg','').replace('-',' · ')
    small=''.join(f'<div class="u s"><img src="{u}" width=40 height=40 style="transform:rotate({a}deg)"></div>' for a in (0,45,90,180,270))
    cells.append(f'<div class="c"><div class="l">{lab}</div><div class="u"><img src="{u}" width=190 height=190></div><div class="r">{small}</div></div>')
html=f'''<!doctype html><meta charset=utf-8><style>
body{{margin:0;padding:14px;background:#EDE6D8;font:600 13px system-ui;color:#2B2230}}
.g{{display:grid;grid-template-columns:repeat(5,1fr);gap:10px 14px}}
.c{{display:flex;flex-direction:column;align-items:center}} .l{{opacity:.65;margin-bottom:2px}}
.r{{display:flex;gap:6px;margin-top:2px}}
.u{{position:relative}} .u::before{{content:"";position:absolute;left:17%;right:17%;bottom:3%;height:17%;border-radius:50%;background:rgba(43,34,48,.16)}}
.u img{{position:relative;display:block}}
</style><div class=g>{"".join(cells)}</div>'''
open('_g.html','w').write(html)
subprocess.run(['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=2',f'--screenshot={out}','--window-size=1200,330','file://'+os.path.abspath('_g.html')],capture_output=True)
