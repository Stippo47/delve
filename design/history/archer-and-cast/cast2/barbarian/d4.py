from lib import *
def build():
    s=S('d4')
    s.layer(SH,'#E0AE8A','#BE8662',shadow=3)
    s.defs.append('<clipPath id="shc">%s</clipPath>'%SH)
    s.body.append('<g clip-path="url(#shc)"><path d="M18 84 L58 94 L58 104 L18 94 Z M18 106 L58 116 L58 126 L18 116 Z" fill="#3E6FB4"/></g>')
    # right shoulder: spiked leather pauldron (spikes underneath)
    s.layer('<path d="M150 82 L176 70 L170 94 Z M158 104 L194 100 L168 122 Z M146 126 L178 134 L150 144 Z"/>','#D5DBE4','#8C95A4',shadow=2,shade=.5)
    s.layer('<path d="M128 80 C152 74 178 88 178 110 C178 132 152 142 128 136 Z"/>','#6E5568','#463747',shadow=4,shade=.5)
    s.layer('<circle cx="158" cy="108" r="7"/>','#F6C454','#D9952A',shadow=0,shade=.4)
    s.bald()
    s.layer(EARL,'#EDBF9A','#D9A27F',shadow=0,shade=0)
    s.layer(EARR,'#E0AE8A','#C99672',shadow=0,shade=0)
    s.paint(HEAD,'url(#gF)'); s.paint(HEAD,'url(#gFs)')
    # black beard along jaw
    s.layer('<path d="M54 112 C50 134 64 150 78 154 C88 160 112 160 122 154 C136 150 150 134 146 112 C140 128 128 138 118 142 C108 146 92 146 82 142 C72 138 60 128 54 112 Z"/>','#4A3A4C','#2C2232',shadow=2,shade=.4)
    # wild black hair cap, jagged front
    s.layer('<path d="M50 100 C42 60 64 40 100 40 C136 40 158 60 150 100 L146 114 L138 92 L128 106 L118 84 L108 100 L100 82 L92 100 L82 84 L72 106 L62 92 L54 114 Z"/>','#4A3A4C','#2C2232',shadow=3,shade=.4)
    # mohawk ridge
    s.layer('<path d="M84 94 L74 70 L88 66 L80 44 L94 48 L94 22 L106 38 L118 26 L118 50 L128 58 L118 66 L116 94 C108 98 92 98 84 94 Z"/>','#E2503E','#A8262F',shadow=3,shade=.5)
    s.mouth()
    # flail
    s.layer('<rect x="95" y="158" width="10" height="16" rx="3"/>','#B57944','#7C4E2A',shadow=0,shade=.4)
    s.layer('<ellipse cx="100" cy="173" rx="6" ry="5"/>','#C9D0DA','#7F8898',shadow=0,shade=.5)
    s.layer(star(100,185,19,12,9,rot=20),'#C9D0DA','#6F7888',shadow=2,shade=.6)
    s.layer('<circle cx="100" cy="185" r="12"/>','#99A2B2','#5E6878',shadow=0,shade=.5)
    s.hand(88,146)
    s.hand(30,130,tf='rotate(-15 42 140)')
    return s
if __name__=='__main__':
    build().write('design-4.svg','BARBARIAN 4 Berserker: black wild hair + red mohawk ridge, jaw beard, woad-striped shoulder and spiked leather pauldron, spiked-ball flail forward.')
