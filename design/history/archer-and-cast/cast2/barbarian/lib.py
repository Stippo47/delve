import math
OUT='#2B2230'
def mix(a,b,t):
    a=a.lstrip('#');b=b.lstrip('#')
    return '#'+''.join('%02X'%round(int(a[i:i+2],16)*(1-t)+int(b[i:i+2],16)*t) for i in (0,2,4))
HEAD='<path d="M 100.0 47.8 C 129.6 47.8 147.8 68.7 147.8 98.3 C 147.8 122.6 136.5 140.0 120.9 147.8 C 113.9 151.3 107.0 153.1 100.0 153.1 C 93.0 153.1 86.1 151.3 79.1 147.8 C 63.5 140.0 52.1 122.6 52.1 98.3 C 52.1 68.7 70.4 47.8 100.0 47.8 Z"/>'
SH='<path d="M26.0 108.0 C26.0 82 54.0 76 100 76 C146.0 76 174.0 82 174.0 108.0 C174.0 134 146.0 140 100 140 C54.0 140 26.0 134 26.0 108.0 Z"/>'
EARL='<ellipse cx="52.1" cy="108.7" rx="7" ry="9.6"/>'
EARR='<ellipse cx="147.8" cy="108.7" rx="7" ry="9.6"/>'
def star(cx,cy,R,r,n,rot=0):
    pts=[]
    for i in range(2*n):
        a=math.radians(rot)+math.pi*i/n
        rr=R if i%2==0 else r
        pts.append('%.1f,%.1f'%(cx+rr*math.sin(a),cy-rr*math.cos(a)))
    return '<polygon points="%s"/>'%' '.join(pts)
def flame(cx,cy,rx,ry,n,depth=.2,sweep=.35,rot=0):
    d=''
    for i in range(n):
        a0=2*math.pi*i/n+math.radians(rot)
        a1=2*math.pi*(i+1)/n+math.radians(rot)
        am=a0+(a1-a0)*(0.5+sweep*0.5)
        def P(a,k): return (cx+rx*k*math.sin(a), cy-ry*k*math.cos(a))
        p0=P(a0,1-depth); tip=P(am,1.0); p1=P(a1,1-depth)
        c0=P(a0+(am-a0)*.4,1-depth*.25); c1=P(am+(a1-am)*.25,1-depth*.3)
        if i==0: d+='M%.1f %.1f '%p0
        d+='Q%.1f %.1f %.1f %.1f Q%.1f %.1f %.1f %.1f '%(c0+tip+c1+p1)
    return '<path d="%sZ"/>'%d
class S:
    def __init__(s,title):
        s.defs=[];s.outl=[];s.body=[];s.n=0;s.title=title
    def _i(s,tf,shape): return '<g transform="%s">%s</g>'%(tf,shape) if tf else shape
    def paint(s,shape,fill,tf=None,op=None,dy=0):
        a=' fill="%s"'%fill+(' opacity="%s"'%op if op else '')
        t=shape.replace('/>',a+'/>')
        if dy: tf=('translate(0 %s) '%dy)+(tf or '') if False else tf
        s.body.append(s._i(tf,t) if not dy else '<g transform="translate(0 %s)">%s</g>'%(dy,s._i(tf,t)))
    def layer(s,shape,c1,c2,tf=None,shadow=3,outline=True,shade=.5,rim=None):
        s.n+=1;k=s.n
        s.defs.append('<linearGradient id="a%d" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/></linearGradient>'%(k,c1,c2))
        if outline: s.outl.append(s._i(tf,shape))
        if shadow: s.paint(shape,OUT,tf,op=.28,dy=shadow)
        s.paint(shape,'url(#a%d)'%k,tf)
        if shade:
            dk=mix(c2,'#2A1E36',.5)
            s.defs.append('<linearGradient id="b%d" x1="0.42" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="%s" stop-opacity="0"/><stop offset="1" stop-color="%s" stop-opacity="%s"/></linearGradient>'%(k,dk,dk,shade))
            s.paint(shape,'url(#b%d)'%k,tf)
    def face(s,top=98,shadow=.28):
        s.defs.append('<linearGradient id="gF" x1="0" y1="%s" x2="0" y2="153" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#B07560"/><stop offset="0.2" stop-color="#D9A27F"/><stop offset="0.45" stop-color="#F2C7A0"/><stop offset="0.85" stop-color="#F4CBA6"/><stop offset="1" stop-color="#E6B590"/></linearGradient><linearGradient id="gFs" x1="100" y1="0" x2="156" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8A4E36" stop-opacity="0"/><stop offset="1" stop-color="#8A4E36" stop-opacity="%s"/></linearGradient>'%(top,shadow))
        s.outl.append(HEAD)
        s.paint(HEAD,OUT,op=.3,dy=5)
        s.paint(HEAD,'url(#gF)'); s.paint(HEAD,'url(#gFs)')
    def bald(s):
        s.defs.append('<linearGradient id="gF" x1="0" y1="48" x2="0" y2="153" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#E9BD98"/><stop offset="0.5" stop-color="#F2C7A0"/><stop offset="0.85" stop-color="#F4CBA6"/><stop offset="1" stop-color="#E6B590"/></linearGradient><linearGradient id="gFs" x1="100" y1="0" x2="156" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8A4E36" stop-opacity="0"/><stop offset="1" stop-color="#8A4E36" stop-opacity="0.3"/></linearGradient>')
        s.outl.append(HEAD)
        s.paint(HEAD,OUT,op=.3,dy=5)
        s.paint(HEAD,'url(#gF)'); s.paint(HEAD,'url(#gFs)')
    def mouth(s):
        s.body.append('<path d="M96 136.5 Q100 139 104 136.5" fill="none" stroke="#C98868" stroke-width="2.5" stroke-linecap="round"/>')
    def hand(s,x,y,tf=None,w=24,h=21):
        r='<rect x="%s" y="%s" width="%s" height="%s" rx="8"/>'%(x,y,w,h)
        s.outl.append(s._i(tf,r))
        s.body.append(s._i(tf,r.replace('/>',' fill="%s" opacity=".3"/>'%OUT).replace('<rect x="%s" y="%s"'%(x,y),'<rect x="%s" y="%s"'%(x+1,y+2.5))))
        s.body.append(s._i(tf,r.replace('/>',' fill="url(#gHand)"/>')))
    def write(s,path,comment):
        defs='<radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/><stop offset="1" stop-color="#DFA57F"/></radialGradient>'+''.join(s.defs)
        # outline needs ordered; body order is drawing order
        o='<g fill="%s" stroke="%s" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">%s</g>'%(OUT,OUT,''.join(s.outl))
        open(path,'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n<!-- %s -->\n<defs>%s</defs>\n%s\n%s\n</svg>\n'%(comment,defs,o,'\n'.join(s.body)))
