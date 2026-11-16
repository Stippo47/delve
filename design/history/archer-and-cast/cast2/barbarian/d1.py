from lib import *
def build():
    s=S('d1')
    # cream fur shoulders with lumpy rim
    s.layer(SH,'#E6D9BC','#BFAE88')
    for (x,y,r) in [(30,92,13),(24,108,13),(28,124,13),(40,136,12),(170,92,13),(176,108,13),(172,124,13),(160,136,12)]:
        s.layer('<circle cx="%s" cy="%s" r="%s"/>'%(x,y,r),'#E6D9BC','#BFAE88',shadow=0,shade=.45)
    # mane back
    s.layer(flame(100,74,68,60,11,.24,.45,rot=8),'#D96C30','#A9431F',shadow=4)
    # beard bib
    s.layer('<path d="M58 120 C54 140 66 156 80 166 L84 184 L100 172 L116 184 L120 166 C134 156 146 140 142 120 C128 140 72 140 58 120 Z"/>','#CC5A28','#9C3C1F',shadow=3)
    s.face(top=100)
    s.paint(HEAD,'#2B2230','',op=0) if False else None
    # side locks + fringe
    s.layer('<path d="M50 104 C44 64 64 42 100 42 C136 42 156 64 150 104 L152 134 L140 122 L134 100 L122 112 L112 94 L100 114 L88 94 L78 112 L66 100 L60 122 L48 134 Z"/>','#F0924A','#D2652C',shadow=4)
    s.mouth()
    # greatsword at left, pointing forward
    s.layer('<path d="M31 140 H61 V176 L46 203 L31 176 Z"/>','#EEF1F4','#B9C1CC',shadow=2,shade=.6)
    s.layer('<rect x="42" y="80" width="8" height="62" rx="3"/>','#8C4A32','#6A3324',shadow=0,shade=.3)
    s.layer('<rect x="16" y="130" width="60" height="13" rx="6"/>','#F6C454','#D9952A',shadow=3,shade=.4)
    s.layer('<circle cx="46" cy="76" r="9"/>','#F6C454','#D9952A',shadow=2,shade=.4)
    s.hand(34,92); s.hand(34,109)
    return s
if __name__=='__main__':
    build().write('design-1.svg','BARBARIAN 1 Wildmane v2: cream fur mantle over the shoulders, swept rust mane, fringe + beard, greatsword carried point-forward at the left.')
