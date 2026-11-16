"""big.py OUT.png file.svg ... -> each at 420px side by side with archer for close inspection."""
import base64, subprocess, sys, os
out=sys.argv[1]; fs=sys.argv[2:]
def uri(p): return "data:image/svg+xml;base64," + base64.b64encode(open(p,'rb').read()).decode()
c=''.join(f'<img src="{uri(f)}" width=420 height=420>' for f in fs)
open('/tmp/big2.html','w').write(f'<body style="margin:0;background:#EDE6D8;display:flex;gap:10px;width:max-content">{c}</body>')
subprocess.run(['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1',
 f'--screenshot={os.path.abspath(out)}',f'--window-size={430*len(fs)},420','file:///tmp/big2.html'],capture_output=True)
