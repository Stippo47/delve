"""Knight designs on the approved base (set-a8, 160 shoulders). python3 build.py -> design-1..4.svg"""
import math

OUT = '#2B2230'
HEAD = ("M 100.0 47.8 C 129.6 47.8 147.8 68.7 147.8 98.3 C 147.8 122.6 136.5 140.0 120.9 147.8 "
        "C 113.9 151.3 107.0 153.1 100.0 153.1 C 93.0 153.1 86.1 151.3 79.1 147.8 C 63.5 140.0 52.1 122.6 "
        "52.1 98.3 C 52.1 68.7 70.4 47.8 100.0 47.8 Z")
BAND = ("M26.0 108.0 C26.0 82 54.0 76 100 76 C146.0 76 174.0 82 174.0 108.0 "
        "C174.0 134 146.0 140 100 140 C54.0 140 26.0 134 26.0 108.0 Z")


def ell(cx, cy, rx, ry=None):
    ry = rx if ry is None else ry
    return (f"M{cx-rx:.1f} {cy:.1f} A{rx} {ry} 0 1 0 {cx+rx:.1f} {cy:.1f} "
            f"A{rx} {ry} 0 1 0 {cx-rx:.1f} {cy:.1f} Z")


def rr(x, y, w, h, r):
    return (f"M{x+r} {y} H{x+w-r} A{r} {r} 0 0 1 {x+w} {y+r} V{y+h-r} A{r} {r} 0 0 1 {x+w-r} {y+h} "
            f"H{x+r} A{r} {r} 0 0 1 {x} {y+h-r} V{y+r} A{r} {r} 0 0 1 {x+r} {y} Z")


def scallop(cx, cy, rx, ry, n, bump, rot=0.0):
    """bumpy ellipse (fur). n lobes, bump = outward lobe size."""
    pts = []
    for i in range(n):
        a0 = rot + 2 * math.pi * i / n
        a1 = rot + 2 * math.pi * (i + 0.5) / n
        pts.append(((cx + rx * math.cos(a0), cy + ry * math.sin(a0)),
                    (cx + (rx + bump * 2) * math.cos(a1), cy + (ry + bump * 2) * math.sin(a1))))
    d = f"M{pts[0][0][0]:.1f} {pts[0][0][1]:.1f} "
    for i in range(n):
        (_, c) = pts[i]
        nxt = pts[(i + 1) % n][0]
        d += f"Q{c[0]:.1f} {c[1]:.1f} {nxt[0]:.1f} {nxt[1]:.1f} "
    return d + "Z"


class Sprite:
    def __init__(self, note):
        self.note = note
        self.defs, self.outline, self.body = [], [], []
        self.n = 0
        self.gcache = {}
        self.defs.append('<radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/>'
                         '<stop offset="1" stop-color="#DFA57F"/></radialGradient>')

    def _id(self, p):
        self.n += 1
        return f"{p}{self.n}"

    def vgrad(self, top, bot, us=None):
        key = ('v', top, bot, us)
        if key in self.gcache:
            return self.gcache[key]
        gid = self._id('g')
        if us:
            self.defs.append(f'<linearGradient id="{gid}" x1="0" y1="{us[0]}" x2="0" y2="{us[1]}" gradientUnits="userSpaceOnUse">'
                             f'<stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bot}"/></linearGradient>')
        else:
            self.defs.append(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0.3" y2="1">'
                             f'<stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bot}"/></linearGradient>')
        self.gcache[key] = gid
        return gid

    def stops(self, stops, y0, y1):
        gid = self._id('g')
        s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
        self.defs.append(f'<linearGradient id="{gid}" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">{s}</linearGradient>')
        return gid

    def shade(self, dark, op, x0=70, x1=165):
        key = ('h', dark, op, x0, x1)
        if key in self.gcache:
            return self.gcache[key]
        gid = self._id('h')
        self.defs.append(f'<linearGradient id="{gid}" x1="{x0}" y1="0" x2="{x1}" y2="0" gradientUnits="userSpaceOnUse">'
                         f'<stop offset="0" stop-color="{dark}" stop-opacity="0"/><stop offset="1" stop-color="{dark}" stop-opacity="{op}"/></linearGradient>')
        self.gcache[key] = gid
        return gid

    def part(self, d, top=None, bot=None, dark=None, sh=0.4, cs=0.28, csdy=3.0, extra='', tf='', fill=None,
             outline=True, us=None, sx=(70, 165), sw=12):
        pid = self._id('p')
        self.defs.append(f'<path id="{pid}" d="{d}"/>')
        t = f' transform="{tf}"' if tf else ''
        if outline:
            self.outline.append(f'<use href="#{pid}"{t} stroke-width="{sw}"/>' if sw != 12 else f'<use href="#{pid}"{t}/>')
        if cs:
            tt = f'{tf} translate(0 {csdy})' if tf else f'translate(0 {csdy})'
            self.body.append(f'<use href="#{pid}" fill="{OUT}" opacity="{cs}" transform="{tt}"/>')
        f = fill or f'url(#{self.vgrad(top, bot, us)})'
        self.body.append(f'<use href="#{pid}" fill="{f}"{t}/>')
        if dark and sh:
            self.body.append(f'<use href="#{pid}" fill="url(#{self.shade(dark, sh, *sx)})"{t}/>')
        if extra:
            cid = self._id('c')
            self.defs.append(f'<clipPath id="{cid}"><use href="#{pid}"/></clipPath>')
            self.body.append(f'<g{t}><g clip-path="url(#{cid})">{extra}</g></g>')
        return pid

    def hand(self, x, y, tf=''):
        return self.part(rr(x, y, 24, 21, 8), fill='url(#gHand)', cs=0.3, csdy=2.5, tf=tf)

    def raw(self, s):
        self.body.append(s)

    def svg(self):
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n'
                f'<!-- {self.note} Facing = DOWN (+y). Rotate whole sprite around (100,100). -->\n'
                '<defs>' + ''.join(self.defs) + '</defs>\n'
                f'<g fill="{OUT}" stroke="{OUT}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">'
                + ''.join(self.outline) + '</g>\n' + '\n'.join(self.body) + '\n</svg>\n')


STEEL = ('#E3E7ED', '#A9B2C0', '#4A5468')
FACE_STOPS = [(0, '#B07560'), (0.2, '#D9A27F'), (0.45, '#F2C7A0'), (0.85, '#F4CBA6'), (1, '#E6B590')]


def face(s, y0=94.8, extra=''):
    g = s.stops(FACE_STOPS, y0, 153.1)
    return s.part(HEAD, fill=f'url(#{g})', dark='#8A4E36', sh=0.28, sx=(100, 156), cs=0.3, csdy=5, extra=extra)


def mouth(s, y=136.5):
    s.raw(f'<path d="M96 {y} Q100 {y+2.5} 104 {y}" fill="none" stroke="#C98868" stroke-width="2.5" stroke-linecap="round"/>')


def sword(s, hx, hy, ang, blade=50, bw=16, guard=40, gold=('#F9CB5C', '#D9952A'), pommel=True, grip=None, pom=-26):
    """vertical sword built in local space (hilt centre at 0,0 = top of crossguard), rotated by ang, placed at hx,hy.
    ang=0 points straight forward (+y)."""
    tf = f'translate({hx} {hy}) rotate({ang})'
    h = bw / 2
    if pommel:
        s.part(ell(0, pom, 7.5), gold[0], gold[1], tf=tf, cs=0)
    if grip:
        s.part(rr(-5, -24, 10, 26, 4), grip[0], grip[1], tf=tf, cs=0)
    s.part(f"M{-h} 6 H{h} V{blade} L0 {blade + bw * 0.9} L{-h} {blade} Z", STEEL[0], STEEL[1], tf=tf, cs=0.25,
           extra=f'<path d="M0 0 H{h+2} V{blade+30} H0 Z" fill="#7E8899" opacity="0.45"/>')
    s.part(rr(-guard / 2, 0, guard, 10, 5), gold[0], gold[1], tf=tf, cs=0.28,
           extra=f'<rect x="0" y="-2" width="{guard}" height="14" fill="{gold[1]}" opacity="0.6"/>')
    return tf


# ---------------------------------------------------------------- D1 PALADIN
def d1():
    s = Sprite('KNIGHT design-1 "Paladin": young knight in an open sallet with a gold comb, sweeping blue cape, '
               'round steel pauldrons, heater shield on the left arm, arming sword forward in the right.')
    # cape flowing behind (up)
    s.part("M40 96 C24 76 18 46 30 22 Q44 -2 64 12 Q82 -6 100 8 Q118 -6 136 12 Q156 -2 170 22 C182 46 176 76 160 96 Z", '#5B8CDB', '#2E5AA8',
           dark='#1F3F7A', sh=0.45, cs=0,
           extra='<path d="M100 -10 C96 30 96 60 100 96 L104 96 C100 60 100 30 104 -10 Z" fill="#244C92" opacity="0.5"/>')
    s.part(BAND, '#4F7FCF', '#3462B0', dark='#1F3F7A', sh=0.4)
    # pauldrons
    for cx in (44, 156):
        s.part(ell(cx, 110, 27, 30), '#B4BCC8', '#7D879A', dark=STEEL[2], sh=0.42,
               extra=f'<path d="{ell(cx, 128, 27, 14)}" fill="#8A93A3" opacity="0.45"/>')
    face(s)
    mouth(s)
    # helm: dome + cheek guards, open face
    helm = ("M46 118 C38 70 62 40 100 40 C138 40 162 70 154 118 C151 128 139 128 137 117 "
            "C133 106 120 100 100 100 C80 100 67 106 63 117 C61 128 49 128 46 118 Z")
    s.part(helm, *STEEL[:2], dark=STEEL[2], sh=0.45, cs=0.3, csdy=4,
           extra='<path d="M40 112 C60 100 80 96 100 96 C120 96 140 100 160 112 V140 H40 Z" fill="#7F8898" opacity="0.35"/>')
    # gold comb down the crown
    s.part("M100 26 C109 38 110 76 106 98 H94 C90 76 91 38 100 26 Z", '#F9CB5C', '#E8A030', dark='#B8741A', sh=0.6,
           sx=(94, 108), cs=0.3)
    # heater shield (left arm)
    sh = "M16 128 C38 120 66 120 86 128 C88 160 76 184 51 200 C26 184 14 160 16 128 Z"
    s.part(sh, '#F9CB5C', '#E09A2E', dark='#A86A16', sh=0.4, sx=(30, 90),
           extra=f'<path d="M25 134 C43 128 59 128 77 134 C78 158 69 177 51 190 C33 177 24 158 25 134 Z" fill="#3D6CC0"/>'
                 f'<path d="M51 120 V200 H90 V120 Z" fill="#1F3F7A" opacity="0.35"/>')
    s.hand(66, 122)
    # sword (right)
    sword(s, 153, 150, 0, blade=36, bw=16, guard=38)
    s.hand(141, 130)
    return s


# ---------------------------------------------------------------- D2 OLD GUARD
def d2():
    s = Sprite('KNIGHT design-2 "Old Guard": bald grey-bearded veteran, cream fur collar on a crimson mantle, '
               'heavy steel pauldrons, round shield slung on the back, two-handed greatsword held low and forward-right.')
    # heater shield slung on the back, point up-left
    hs = "M-32 -28 C-12 -35 12 -35 32 -28 C34 2 22 24 0 40 C-22 24 -34 2 -32 -28 Z"
    s.part(hs, *STEEL[:2], dark=STEEL[2], sh=0.3, cs=0, tf='translate(56 42) rotate(158) scale(1.15)',
           extra='<path d="M-24 -22 C-9 -27 9 -27 24 -22 C25 0 16 17 0 30 C-16 17 -25 0 -24 -22 Z" fill="#B8403A"/>')
    # crimson mantle
    s.part("M22 112 C20 80 50 64 100 64 C150 64 180 80 178 112 C176 142 150 150 100 150 C50 150 24 142 22 112 Z",
           '#C8473F', '#8E2A28', dark='#5A1416', sh=0.45)
    # fur collar
    s.part(scallop(100, 90, 58, 26, 11, 4, rot=0.2), '#FBF1DE', '#D9C7A6', dark='#8E7A5A', sh=0.4, us=(56, 124))
    # pauldrons
    for cx, k in ((38, 0), (162, 1)):
        s.part(ell(cx, 116, 27, 30), '#B9C0CB', '#7C8697', dark='#2E3442', sh=0.42,
               extra=f'<path d="{ell(cx, 136, 28, 14)}" fill="#7F8898" opacity="0.4"/>')
    # bald head: lit pate, darker toward the beard
    g = s.stops([(0, '#F6D2AE'), (0.55, '#EDBF97'), (1, '#D49A74')], 48, 153)
    s.part(HEAD, fill=f'url(#{g})', dark='#8A4E36', sh=0.3, sx=(100, 156), cs=0.3, csdy=5,
           extra='<ellipse cx="86" cy="70" rx="16" ry="11" fill="#FFF3E2" opacity="0.45"/>'
                 '<path d="M40 104 Q100 86 160 104 V125 H40 Z" fill="#B67A5E" opacity="0.18"/>')
    # grey side tufts at the temples
    for d in ("M50 82 C42 98 44 118 54 128 C62 120 66 104 64 88 C60 82 54 80 50 82 Z",
              "M150 82 C158 98 156 118 146 128 C138 120 134 104 136 88 C140 82 146 80 150 82 Z"):
        s.part(d, '#E6E3DE', '#B7B1A8', dark='#6C665E', sh=0.4, cs=0.25)
    # big spade beard
    beard = ("M58 116 C60 138 68 160 82 178 Q100 198 118 178 C132 160 140 138 142 116 "
             "C130 128 116 132 100 132 C84 132 70 128 58 116 Z")
    s.part(beard, '#F4F1EC', '#BDB6AC', dark='#6C665E', sh=0.45, cs=0.32, csdy=3,
           extra='<path d="M70 150 Q100 166 130 150 V200 H70 Z" fill="#A69E92" opacity="0.35"/>')
    # moustache
    s.part("M72 128 C82 118 94 120 100 126 C106 120 118 118 128 128 C120 138 108 136 100 132 C92 136 80 138 72 128 Z",
           '#FFFFFF', '#D8D2C8', dark='#6C665E', sh=0.35, cs=0.3, csdy=2.5)
    # greatsword, two hands on the grip
    sword(s, 152, 134, -14, blade=48, bw=18, guard=46, pom=-50)
    s.hand(140, 112, tf='rotate(-14 152 122)')
    s.hand(140, 91, tf='rotate(-14 152 101)')
    return s


# ---------------------------------------------------------------- D3 BASTION
def d3():
    s = Sprite('KNIGHT design-3 "Bastion": faceless hulk in a flat-topped great helm with a visor slit and gold cross, '
               'stacked dark-iron pauldrons, red surcoat, big pavise held in front, short sword out to the right.')
    IRON = ('#A7B0BE', '#6B7586', '#2E3442')
    s.part(BAND, '#C9473E', '#93302C', dark='#5A1416', sh=0.4)
    # stacked pauldrons: big plate + a lame below (forward)
    for cx, sgn in ((40, -1), (160, 1)):
        s.part(rr(cx - 32, 76, 64, 50, 22), *IRON[:2], dark=IRON[2], sh=0.42)
        s.part(rr(cx - 28, 112, 56, 30, 14), *IRON[:2], dark=IRON[2], sh=0.42, csdy=3.5)
        s.part(ell(cx, 96, 6), '#F9CB5C', '#D9952A', cs=0.25, csdy=2)
    # great helm
    helm = rr(54, 44, 92, 112, 26)
    s.part(helm, '#C3CAD5', '#8B95A6', dark=IRON[2], sh=0.45, cs=0.3, csdy=5,
           extra='<rect x="40" y="112" width="120" height="60" fill="#5E6878" opacity="0.4"/>'
                 '<rect x="54" y="122" width="92" height="9" rx="4.5" fill="#2B2230"/>'
                 '<rect x="95" y="40" width="10" height="82" fill="#F2B53A"/>'
                 '<rect x="95" y="131" width="10" height="30" fill="#F2B53A"/>'
                 '<rect x="100" y="40" width="5" height="121" fill="#C98620" opacity="0.7"/>')
    # pavise in front
    pav = "M40 150 Q40 140 52 140 H148 Q160 140 160 150 V176 Q160 194 100 204 Q40 194 40 176 Z"
    s.part(pav, '#D24C42', '#9A302B', dark='#5A1416', sh=0.45, sx=(60, 165), cs=0.35, csdy=4,
           extra='<path d="M40 140 H160 V150 H40 Z" fill="#F2B53A"/><rect x="92" y="140" width="16" height="70" fill="#F2B53A"/>'
                 '<rect x="100" y="140" width="8" height="70" fill="#C98620" opacity="0.7"/>')
    # short sword out right, pointing forward
    sword(s, 172, 150, -10, blade=30, bw=15, guard=32)
    s.hand(160, 128, tf='rotate(-10 172 138)')
    s.hand(28, 140)
    return s


# ---------------------------------------------------------------- D4 DAME
def d4():
    s = Sprite('KNIGHT design-4 "Dame": bareheaded woman knight, auburn hair swept back into a long braid trailing behind, '
               'teal cape swept off the right shoulder, silver pauldrons, kite shield on the right arm, sword forward in the left.')
    HAIR = ('#B4532E', '#7E3218', '#4A1A0C')
    # teal cape, swept back and off to the right (wind of the charge)
    s.part("M44 92 C40 64 50 40 66 24 Q90 30 112 14 Q138 22 160 6 Q166 34 174 50 C180 70 172 90 158 96 Z",
           '#4CC2B6', '#1F7F7A', dark='#0E4C4A', sh=0.35, cs=0,
           extra='<path d="M100 96 C104 70 116 40 130 14 L138 18 C124 44 112 72 108 96 Z" fill="#17625E" opacity="0.45"/>')
    # braid trailing back
    for i, (y, r) in enumerate(((44, 13), (30, 12), (17, 11), (5, 10))):
        s.part(ell(100, y, r, r * 0.95), *HAIR[:2], dark=HAIR[2], sh=0.4, sx=(90, 112), cs=0.3, csdy=2.5)
    s.part(BAND, '#E9EDF2', '#B5BECB', dark='#4A5468', sh=0.4)
    for cx in (44, 156):
        s.part(ell(cx, 112, 24, 28), *STEEL[:2], dark=STEEL[2], sh=0.42,
               extra=f'<path d="{ell(cx, 130, 24, 12)}" fill="#8A93A3" opacity="0.45"/>')
    face(s, y0=92)
    mouth(s)
    # swept-back hair: two soft wings parted in the middle, ears tucked
    hair = ("M52 112 C42 70 64 42 100 42 C136 42 158 70 148 112 C144 100 136 84 120 80 C110 78 104 84 100 92 "
            "C96 84 90 78 80 80 C64 84 56 100 52 112 Z")
    s.part(hair, *HAIR[:2], dark=HAIR[2], sh=0.45, cs=0.3, csdy=4,
           extra='<path d="M99 40 Q97 66 100 92 Q103 66 101 40 Z" fill="#5E220E" opacity="0.6"/>'
                 '<path d="M60 70 C70 60 84 56 94 58" stroke="#D27447" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7"/>')
    # kite shield on the right arm, point forward
    kite = "M128 112 C142 104 170 104 186 112 C190 140 178 172 160 200 C140 172 126 140 128 112 Z"
    s.part(kite, '#E9EDF2', '#AEB8C6', dark='#4A5468', sh=0.4, sx=(120, 190), cs=0.35, csdy=4,
           extra='<path d="M136 118 C148 112 166 112 178 118 C180 140 170 165 158 186 C144 165 135 140 136 118 Z" fill="#2E9E95"/>'
                 '<path d="M157 100 V210 H200 V100 Z" fill="#0E4C4A" opacity="0.3"/>')
    s.hand(146, 100)
    # sword forward in the left hand
    sword(s, 48, 150, 0, blade=36, bw=15, guard=34, gold=('#E9EDF2', '#AEB8C6'))
    s.hand(36, 128)
    return s


if __name__ == '__main__':
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    for i, f in enumerate((d1, d2, d3, d4), 1):
        open(os.path.join(here, f'design-{i}.svg'), 'w').write(f().svg())
    print('built')
