from lib import *
def build():
    s=S('d3')
    # iron pauldrons with spikes over bare shoulders
    s.layer(SH,'#D9A27F','#B8825F',shadow=3)
    for sx in (1,-1):
        tf=None if sx==1 else 'translate(200 0) scale(-1 1)'
        s.layer('<path d="M150 80 L184 86 L178 100 Z M158 96 L194 112 L172 120 Z M150 118 L180 138 L156 140 Z"/>','#C9D0DA','#8A93A3',tf=tf,shadow=2,shade=.5)
        s.layer('<path d="M118 80 C150 70 182 84 184 108 C184 130 158 142 128 136 Z"/>','#B7BFCC','#7A8496',tf=tf,shadow=4,shade=.5)
    # beard
    s.layer('<path d="M54 118 C48 142 62 160 76 168 L82 186 L100 174 L118 186 L124 168 C138 160 152 142 146 118 C130 142 70 142 54 118 Z"/>','#B87A3E','#8A5528',shadow=3)
    s.face(top=104)
    s.mouth()
    # horned helm
    s.layer('<path d="M30 78 C20 60 24 36 44 20 C38 40 44 54 58 62 L60 84 Z"/>','#F3E7C8','#CDB98A',shadow=3,shade=.45)
    s.layer('<path d="M170 78 C180 60 176 36 156 20 C162 40 156 54 142 62 L140 84 Z"/>','#F3E7C8','#CDB98A',shadow=3,shade=.45)
    s.layer('<path d="M46 108 C40 58 66 36 100 36 C134 36 160 58 154 108 C150 112 140 112 130 108 L70 108 C60 112 50 112 46 108 Z"/>','#C9D0DA','#8A93A3',shadow=4)
    s.layer('<rect x="94" y="46" width="12" height="62" rx="6"/>','#9AA3B2','#66707F',shadow=3,shade=.4)
    s.layer('<path d="M46 96 H154 V108 C148 112 140 112 130 108 L70 108 C60 112 52 112 46 108 Z"/>','#F2B53A','#D9952A',shadow=0,shade=.45)
    # warhammer
    s.layer('<rect x="94" y="130" width="12" height="60" rx="4"/>','#B57944','#7C4E2A',shadow=0,shade=.4)
    s.layer('<path d="M58 170 H142 L148 177 V192 L142 200 H58 L52 192 V177 Z"/>','#C9D0DA','#7F8898',shadow=3,shade=.55)
    s.layer('<path d="M52 177 L66 177 L66 192 L52 192 Z M148 177 L134 177 L134 192 L148 192 Z"/>','#6B5A73','#4A3C56',shadow=0,shade=.3)
    s.hand(86,140); s.hand(95,153)
    return s
if __name__=='__main__':
    build().write('design-3.svg','BARBARIAN 3 Warhelm: iron horned helm with nasal bar, spiked pauldrons, big braided-gold beard, warhammer forward.')
