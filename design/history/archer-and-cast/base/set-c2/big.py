import base64, subprocess, sys, os
out=sys.argv[1]; fs=sys.argv[2:]
def uri(p): return "data:image/svg+xml;base64," + base64.b64encode(open(p, 'rb').read()).decode()
cells=''.join(f'<img src="{uri(f)}" width=360 height=360>' for f in fs)
h='/tmp/basec_big.html'; open(h,'w').write(f'<body style="margin:0;background:#EDE6D8;display:flex;gap:10px;width:max-content">{cells}')
subprocess.run(['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1',f'--screenshot={os.path.abspath(out)}',f'--window-size={370*len(fs)},360','file://'+h],capture_output=True)
