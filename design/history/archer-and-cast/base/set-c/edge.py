import subprocess,sys,os
from PIL import Image
for f in sys.argv[1:]:
    h='/tmp/basec_edge.html'
    open(h,'w').write(f'<body style="margin:0;background:#fff"><img src="file://{os.path.abspath(f)}" width=220 height=220>')
    subprocess.run(['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--screenshot=/tmp/basec_edge.png','--window-size=220,220','file://'+h],capture_output=True)
    im=Image.open('/tmp/basec_edge.png').convert('L'); w,hh=im.size
    px=im.load()
    xs=[x for x in range(w) for y in range(hh) if px[x,y]<200]; ys=[y for x in range(w) for y in range(hh) if px[x,y]<200]
    print(f, 'x',min(xs)-10,max(xs)-10,'y',min(ys)-10,max(ys)-10, 'width',max(xs)-min(xs))
