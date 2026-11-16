from lib import *
def build():
    s=S('d2')
    # grizzly hide mantle: jagged fur shoulders
    s.layer(flame(100,106,84,40,16,.2,.4,rot=4),'#7A5A48','#4F362A',shadow=3)
    # forepaws draped at the front corners, claws forward
    for sx in (1,-1):
        tf=None if sx==1 else 'translate(200 0) scale(-1 1)'
        s.layer('<path d="M30 112 C20 130 24 152 40 156 C56 158 62 144 58 126 Z"/>','#86654F','#5A3F30',tf=tf,shadow=3,shade=.45)
        s.layer('<path d="M28 152 L26 168 L37 157 Z M39 156 L41 172 L48 157 Z M50 153 L57 168 L58 149 Z"/>','#FBF4E4','#E0D0AE',tf=tf,shadow=2,shade=.4)
    s.face(top=118)
    # bear helm
    s.layer('<circle cx="62" cy="48" r="15"/>','#86654F','#5A3F30',shadow=3)
    s.layer('<circle cx="138" cy="48" r="15"/>','#86654F','#5A3F30',shadow=3)
    s.layer('<path d="M46 98 C42 56 68 34 100 34 C132 34 158 56 154 98 L150 116 L138 108 L128 124 L116 110 L100 126 L84 110 L72 124 L62 108 L50 116 Z"/>','#8E6C54','#5E4334',shadow=4)
    # snout
    s.layer('<path d="M80 88 C80 78 120 78 120 88 L118 112 C116 124 84 124 82 112 Z"/>','#E2C8A0','#BFA076',shadow=3,shade=.4)
    s.layer('<path d="M90 86 C90 82 110 82 110 86 C110 92 106 96 100 96 C94 96 90 92 90 86 Z"/>','#4A3340','#2E2030',shadow=0,shade=0)
    # fangs
    s.layer('<path d="M82 114 L91 134 L96 116 Z M118 114 L109 134 L104 116 Z"/>','#FBF4E4','#E0D0AE',shadow=2,shade=.35)
    s.mouth()
    # club: flared wooden head with iron spikes
    s.layer('<path d="M93 128 L107 128 L111 164 C122 176 124 192 114 201 L86 201 C76 192 78 176 89 164 Z"/>','#C99A6C','#8E6038',shadow=3,shade=.5)
    s.layer('<path d="M82 174 L60 168 L80 190 Z M118 174 L140 168 L120 190 Z"/>','#D5DBE4','#8C95A4',shadow=0,shade=.5)
    s.hand(86,140); s.hand(95,157)
    return s
if __name__=='__main__':
    build().write('design-2.svg','BARBARIAN 2 Bearskin v2: grizzly hide mantle with forepaws, bear-head helm over the brow, spiked ball club forward.')
