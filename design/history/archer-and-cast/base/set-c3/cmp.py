import base64, subprocess, sys, os
out=sys.argv[1]; fs=sys.argv[2:]; hood='/home/claude/archer/final/archer-hood-only.svg'
def uri(p): return "data:image/svg+xml;base64," + base64.b64encode(open(p, 'rb').read()).decode()
def c(f, ov): return f'<div style="position:relative;width:300px;height:300px"><img src="{uri(f)}" width=300 height=300 style="position:absolute">' + (f'<img src="{uri(hood)}" width=300 height=300 style="position:absolute;opacity:.4">' if ov else '') + '</div>'
row1=''.join(c(f,False) for f in [hood]+fs); row2=''.join(c(f,True) for f in [hood]+fs)
h='/tmp/basec2_cmp.html'; open(h,'w').write(f'<body style="margin:0;background:#EDE6D8"><div style="display:flex">{row1}</div><div style="display:flex">{row2}</div>')
subprocess.run(['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1',f'--screenshot={os.path.abspath(out)}',f'--window-size={300*(len(fs)+1)},600','file://'+h],capture_output=True)
