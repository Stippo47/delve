"""render.py OUT.png label=file.svg ... -> sheet rows: big ~200px, 8 rotations @70, 8 rotations @40. Flat ground-shadow ellipse."""
import base64, subprocess, sys, os
out = sys.argv[1]; items = [a.split('=', 1) for a in sys.argv[2:]]
big = int(os.environ.get('BIG', 200))
def uri(p): return "data:image/svg+xml;base64," + base64.b64encode(open(p, 'rb').read()).decode()
rows = []
for lab, f in items:
    u = uri(f)
    def cell(sz, a):
        return f'<div class="u" style="width:{sz}px;height:{sz}px"><img src="{u}" width={sz} height={sz} style="transform:rotate({a}deg)"></div>'
    r70 = ''.join(cell(70, a) for a in range(0, 360, 45))
    r40 = ''.join(cell(40, a) for a in range(0, 360, 45))
    rows.append(f'<div class="row"><div class="l">{lab}</div>{cell(big,0)}<div class="rs"><div class="r">{r70}</div><div class="r r40">{r40}</div></div></div>')
html = f'''<!doctype html><meta charset=utf-8><style>
body{{margin:0;padding:16px 20px;background:#EDE6D8;font:600 14px system-ui;color:#2B2230;width:max-content}}
.row{{display:flex;align-items:center;gap:14px;margin-bottom:10px;border-bottom:1px solid rgba(43,34,48,.08);padding-bottom:6px}}
.l{{width:90px;opacity:.65;text-align:right}}
.rs{{display:flex;flex-direction:column;gap:10px}} .r{{display:flex;gap:10px;align-items:center}} .r40{{gap:40px;padding-left:15px}}
.u{{position:relative;flex:none}}
.u::before{{content:"";position:absolute;left:20%;right:20%;bottom:4%;height:15%;border-radius:50%;background:rgba(43,34,48,.15)}}
.u img{{position:relative;display:block}}
</style>{"".join(rows)}'''
h = f'/tmp/skel2_{os.getpid()}.html'
open(h, 'w').write(html)
H = 40 + len(items) * (big + 17)
W = 130 + big + 8 * 80 + 40
subprocess.run(['/usr/bin/google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
                '--force-device-scale-factor=2', f'--screenshot={os.path.abspath(out)}', f'--window-size={W},{H}', 'file://' + h],
               capture_output=True)
print(out)
