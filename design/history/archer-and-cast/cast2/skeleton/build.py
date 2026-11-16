"""Skeleton enemy, 4 designs on the approved base body (head token ~96 wide centred (100,100),
shoulder mass ~160 x 64 centred y~108, hands ~24x21 at the front corners).
Rendering = archer: one heavy #2B2230 silhouette (12u stroke under everything), no inner lines,
soft top-to-bottom gradients, lit from the left (soft right-side shade), contact shadows.
Front = DOWN (+y). Rotate whole sprite around (100,100). No eye sockets in any design.
"""
import math

INK = '#2B2230'
BONE = ('#F7EDD3', '#E3D2A8')       # main bone
BONE_B = ('#BFAA80', '#9E885F')     # bone further back / under
BONE_F = ('#B9A378', '#E8D9B2')     # recessed face plate: darker under the brow, light at the chin (archer face logic)
TOOTH = ('#FFFBEF', '#EFE4C8')
RUST = ('#D27A40', '#A4532B')
IRON = ('#958A84', '#6E6460')
WOOD = ('#B98250', '#93602F')
CLOTH = ('#6A5A6E', '#4E4254')


def circ(cx, cy, r):
    return f'M{cx-r} {cy} A{r} {r} 0 1 0 {cx+r} {cy} A{r} {r} 0 1 0 {cx-r} {cy} Z'


def ell(cx, cy, rx, ry):
    return f'M{cx-rx} {cy} A{rx} {ry} 0 1 0 {cx+rx} {cy} A{rx} {ry} 0 1 0 {cx-rx} {cy} Z'


def rrect(x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    return (f'M{x+r} {y} H{x+w-r} A{r} {r} 0 0 1 {x+w} {y+r} V{y+h-r} A{r} {r} 0 0 1 {x+w-r} {y+h} '
            f'H{x+r} A{r} {r} 0 0 1 {x} {y+h-r} V{y+r} A{r} {r} 0 0 1 {x+r} {y} Z')


def mirror(d):
    """mirror an absolute-coordinate path (M C L Q H V A Z only) about x=100."""
    out, toks = [], d.replace(',', ' ').split()
    i, cmd = 0, None
    res = []
    import re
    toks = re.findall(r'[A-Za-z]|-?\d*\.?\d+', d)
    i = 0
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; res.append(t); i += 1; continue
        if cmd in 'MCLQT':
            res += [f'{200-float(toks[i]):g}', toks[i+1]]; i += 2
        elif cmd == 'H':
            res.append(f'{200-float(t):g}'); i += 1
        elif cmd == 'V':
            res.append(t); i += 1
        elif cmd == 'A':
            rx, ry, rot, la, sw, x, y = toks[i:i+7]
            res += [rx, ry, f'{-float(rot):g}', la, str(1-int(sw)), f'{200-float(x):g}', y]; i += 7
        else:
            res.append(t); i += 1
    return ' '.join(res)


class Spr:
    def __init__(self, note):
        self.note, self.defs, self.sil, self.body, self.n = note, [], [], [], 0
        self.defs.append('<linearGradient id="shX" x1="96" y1="0" x2="168" y2="0" gradientUnits="userSpaceOnUse">'
                         '<stop offset="0" stop-color="#4A3220" stop-opacity="0"/>'
                         '<stop offset="1" stop-color="#4A3220" stop-opacity="0.42"/></linearGradient>')

    def _id(self, p):
        self.n += 1
        return f'{p}{self.n}'

    def grad(self, pal, x2=0.25, user=None):
        i = self._id('g')
        if user:
            y1, y2 = user
            self.defs.append(f'<linearGradient id="{i}" x1="0" y1="{y1}" x2="0" y2="{y2}" gradientUnits="userSpaceOnUse">'
                             f'<stop offset="0" stop-color="{pal[0]}"/><stop offset="1" stop-color="{pal[1]}"/></linearGradient>')
        else:
            self.defs.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="1">'
                             f'<stop offset="0" stop-color="{pal[0]}"/><stop offset="1" stop-color="{pal[1]}"/></linearGradient>')
        return f'url(#{i})'

    def clip(self, d):
        i = self._id('c')
        self.defs.append(f'<clipPath id="{i}"><path d="{d}"/></clipPath>')
        return f'url(#{i})'

    def shape(self, d, pal, contact=3, shade=True, inner='', sil=True, cop=0.28, x2=0.25, split=False):
        if sil:
            self.sil.append(f'<path d="{d}"/>')
        o = []
        if contact:
            o.append(f'<path d="{d}" fill="{INK}" opacity="{cop}" transform="translate(0 {contact})"/>')
        o.append(f'<path d="{d}" fill="{self.grad(pal, x2) if isinstance(pal, tuple) else pal}"/>')
        if inner or split:
            sp = '<rect x="100" y="-10" width="120" height="230" fill="#7A6040" opacity="0.32"/>' if split else ''
            o.append(f'<g clip-path="{self.clip(d)}">{inner}{sp}</g>')
        if shade and not split:
            o.append(f'<path d="{d}" fill="url(#shX)"/>')
        self.body.append(''.join(o))

    def bone(self, d, w, pal, contact=3, shade=True, yr=(40, 170), cap='round'):
        """a stroked bone (thick rounded stick)."""
        self.sil.append(f'<path d="{d}" fill="none" stroke-width="{w+12}" stroke-linecap="{cap}"/>')
        o = []
        if contact:
            o.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-opacity=".28" stroke-width="{w}" stroke-linecap="{cap}" transform="translate(0 {contact})"/>')
        o.append(f'<path d="{d}" fill="none" stroke="{self.grad(pal, user=yr)}" stroke-width="{w}" stroke-linecap="{cap}"/>')
        if shade:
            o.append(f'<path d="{d}" fill="none" stroke="url(#shX)" stroke-width="{w}" stroke-linecap="{cap}"/>')
        self.body.append(''.join(o))

    def open(self, t):
        self.sil.append(f'<g transform="{t}">'); self.body.append(f'<g transform="{t}">')

    def close(self):
        self.sil.append('</g>'); self.body.append('</g>')

    def raw(self, s):
        self.body.append(s)

    def svg(self):
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n'
                f'  <!-- {self.note} Facing = DOWN (+y). Rotate whole sprite around (100,100). -->\n'
                f'  <defs>{"".join(self.defs)}</defs>\n'
                f'  <g fill="{INK}" stroke="{INK}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">{"".join(self.sil)}</g>\n'
                + '\n'.join('  ' + b for b in self.body) + '\n</svg>\n')


# ---------------------------------------------------------------- shared bits
def hand_claw(s, x, y, fingers=3, fw=6, fl=11, spread=7.5, pal=BONE, ang=0, pw=22, ph=15):
    """bony hand: knuckle palm + finger bones pointing forward (+y). (x,y) = palm centre."""
    s.open(f'rotate({ang} {x} {y})')
    for k in range(fingers):
        fx = x + (k - (fingers - 1) / 2) * spread
        s.shape(rrect(fx - fw / 2, y + 8.5, fw, fl - 2, fw / 2), pal, contact=0)
    s.shape(rrect(x - pw/2, y - 9, pw, ph, 7), pal, contact=2.5)
    s.close()


def rust_blotches(spots):
    return ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" opacity="{o}"/>' for x, y, rx, ry, c, o in spots)


# ================================================================ DESIGN 1  "Rattler"
BODY = ('#C8B994', '#A08F6C')       # body bones: a step darker than the skull so they separate without lines


def skull_inner(s, y0, y1, extra=''):
    """soft face shading: the front of the skull dips darker under the brow, back to light at the chin."""
    i = s._id('g')
    s.defs.append(f'<linearGradient id="{i}" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">'
                  '<stop offset="0" stop-color="#9C8458" stop-opacity="0"/>'
                  '<stop offset="0.45" stop-color="#9C8458" stop-opacity="0.28"/>'
                  '<stop offset="1" stop-color="#9C8458" stop-opacity="0"/></linearGradient>')
    return f'<rect x="20" y="{y0}" width="160" height="{y1-y0}" fill="url(#{i})"/>' + extra


def nose(x, y, w=11, h=11):
    # nasal hole: soft inverted triangle, point down
    t, bt = y - h / 2, y + h / 2
    return (f'M{x-w/2+2} {t} H{x+w/2-2} C{x+w/2+1} {t} {x+w/2+1} {t+3} {x+w/2-1} {t+5} '
            f'L{x+1.6} {bt-1} C{x+0.8} {bt} {x-0.8} {bt} {x-1.6} {bt-1} L{x-w/2+1} {t+5} '
            f'C{x-w/2-1} {t+3} {x-w/2-1} {t} {x-w/2+2} {t} Z')


def teeth(x0, y, n, w, h, gap, col='#FFF8E6'):
    return ''.join(f'<path d="{rrect(x0 + k*(w+gap), y, w, h, min(3, w/2))}" fill="{col}"/>' for k in range(n))


def design1():
    s = Spr('SKELETON design-1 "Rattler": the classic grunt. Round dome skull, cheekbones flaring out over a pinched '
            'muzzle, closed tooth grin, small chin. Shoulder girdle in separate bones with dark gaps: blade, ball '
            'joint, collarbone. Claw hands; notched rusty shortsword forward in the right hand.')
    # shoulder blades (behind), kept clear of the ball joints so ink shows between
    sc = 'M26 94 C24 86 34 72 58 60 C66 58 70 64 68 72 C64 84 50 94 34 99 C30 100 27 98 26 94 Z'
    # collarbones (front, from the ball joint in under the chin)
    s.bone('M52 132 C59 150 74 160 94 164', 10, BODY, yr=(128, 166))
    s.bone(mirror('M52 132 C59 150 74 160 94 164'), 10, BODY, yr=(128, 166))
    # shoulder ball joints
    s.bone('M37 112 C39 94 50 80 66 72', 9, BODY, yr=(70, 112))
    s.bone(mirror('M37 112 C39 94 50 80 66 72'), 9, BODY, yr=(70, 112))
    s.shape(circ(39, 118, 13.5), BONE, contact=3)
    s.shape(circ(161, 118, 13.5), BONE, contact=3)
    # skull
    sk = ('M100 46 C129 46 146 64 146 92 C146 104 146 110 149 116 C151 122 147 128 136 132 '
          'C132 142 130 152 122 156 C114 160 106 160 100 160 C94 160 86 160 78 156 '
          'C70 152 68 142 64 132 C53 128 49 122 51 116 C54 110 54 104 54 92 C54 64 71 46 100 46 Z')
    inner = skull_inner(s, 104, 140,
                        f'<path d="{nose(100, 125)}" fill="{INK}" opacity=".88"/>'
                        f'<path d="{rrect(78, 136, 44, 15, 6)}" fill="#4A3A36"/>' + teeth(80.5, 136, 4, 9, 11, 1.8))
    s.shape(sk, BONE, contact=5, inner=inner, cop=0.32, split=True)
    # left claw hand
    hand_claw(s, 46, 154, pal=BONE)
    # rusty shortsword (right)
    blade = 'M145 157 H161 L161 172 L157 176 L161 180 L161 189 L153 202 L145 189 L145 183 L149 179 L145 175 Z'
    s.shape(blade, IRON, contact=2, inner=rust_blotches([(151, 168, 8, 6, '#C0662E', .95), (157, 188, 5, 7, '#A04E24', .95), (147, 161, 3.5, 3.5, '#D07A3E', .9)]))
    s.shape(rrect(140, 153, 26, 8, 4), RUST, contact=2)          # crossguard
    hand_claw(s, 153, 145, fingers=3, fl=8, pal=BONE)
    return s


def vertebra(s, cy, k, pal):
    """top-down vertebra: round body + two side processes + a back spike. k = scale."""
    d = (f'M{100-15*k} {cy-2*k} C{100-15*k} {cy-6*k} {100-10*k} {cy-6*k} {100-6*k} {cy-5*k} '
         f'C{100-4*k} {cy-10*k} {100-2*k} {cy-12*k} {100} {cy-12*k} C{100+2*k} {cy-12*k} {100+4*k} {cy-10*k} {100+6*k} {cy-5*k} '
         f'C{100+10*k} {cy-6*k} {100+15*k} {cy-6*k} {100+15*k} {cy-2*k} C{100+15*k} {cy+2*k} {100+10*k} {cy+2*k} {100+7*k} {cy+2*k} '
         f'C{100+7*k} {cy+7*k} {100+4*k} {cy+8*k} {100} {cy+8*k} C{100-4*k} {cy+8*k} {100-7*k} {cy+7*k} {100-7*k} {cy+2*k} '
         f'C{100-10*k} {cy+2*k} {100-15*k} {cy+2*k} {100-15*k} {cy-2*k} Z')
    s.shape(d, pal, contact=2)


def design2():
    s = Spr('SKELETON design-2 "Gaper": hunched scavenger. Long narrow skull pushed forward, lower jaw hanging '
            'open and detached (dark gap = gaping mouth), a hump of vertebrae trailing back from the skull, '
            'hooked shoulder blades hiked up and back. Long-fingered hands both on a rusty spear angled forward-right.')
    # vertebrae hump (behind), each a separate bone
    for cy, k in ((38, 1.15), (21, 0.95), (7, 0.78)):
        vertebra(s, cy, k, BODY)
    # hunched coat-hanger shoulders: collarbones swept back from the spine, knobbed dog-bone ends
    for side in (1, -1):
        X = lambda x: 100 + side * (x - 100)
        s.bone(f'M{X(84)} 60 C{X(66)} 66 {X(52)} 80 {X(42)} 98', 10, BODY, yr=(58, 100))
        s.shape(circ(X(36), 92, 8.5), BODY, contact=1.5)
        s.shape(circ(X(46), 104, 8.5), BODY, contact=1.5)
    # spear shaft (behind hands, over shoulder)
    s.bone('M170 64 L142 182', 7, WOOD, yr=(60, 180))
    # skull (long)
    sk = ('M100 40 C128 40 144 60 145 88 C146 104 146 116 140 126 C136 132 132 136 130 142 '
          'C128 148 124 150 100 150 C76 150 72 148 70 142 C68 136 64 132 60 126 '
          'C54 116 54 104 55 88 C56 60 72 40 100 40 Z')
    inner = skull_inner(s, 98, 136,
                        f'<path d="{nose(100, 123, 10, 11)}" fill="{INK}" opacity=".88"/>' + teeth(76.5, 139, 5, 8, 11, 1.5))
    s.shape(sk, BONE, contact=4, inner=inner, cop=0.32, split=True)
    # hanging jaw: the mouth gap between it and the skull is pure ink
    s.sil.append('<path d="M78 148 H122 L120 160 H80 Z"/>')
    jaw = 'M68 158 C70 174 84 182 100 182 C116 182 130 174 132 158 C131 154 126 154 124 157 L76 157 C74 154 69 154 68 158 Z'
    s.shape(jaw, BONE, contact=3, inner=teeth(80, 157, 5, 7.4, 6, 1.6, '#FFF8E6'), split=True)
    # rusty spearhead
    head = 'M142 178 C150 184 149 193 140 202 C133 191 133 184 142 178 Z'
    s.shape(head, IRON, contact=2, inner=rust_blotches([(140, 192, 5, 6, '#B5602E', .95), (140, 197, 3, 3, '#9A4A24', .9)]))
    s.shape(rrect(135, 174, 14, 8, 3), RUST, contact=1.5)
    # hands on the shaft
    hand_claw(s, 161, 104, fingers=4, fw=5, fl=12, spread=5.6, ang=-13)
    hand_claw(s, 148, 152, fingers=4, fw=5, fl=12, spread=5.6, ang=-13)
    return s


# ================================================================ DESIGN 3  "Brute"
def design3():
    s = Spr('SKELETON design-3 "Brute": heavy ogre skull, narrow at the back and widening to massive cheekbones, '
            'a huge underbite jaw jutting out past the face with two thick tusks, big shoulder balls with paired '
            'forearm bones running forward to knuckle fists. Rusty chipped cleaver forward in the right fist.')
    # big shoulder balls
    s.shape(circ(40, 104, 16), BODY)
    s.shape(circ(160, 104, 16), BODY)
    # paired forearm bones (radius + ulna), ink between them
    for side in (1, -1):
        X = lambda x: 100 + side * (x - 100)
        s.bone(f'M{X(33)} 116 L{X(31)} 152', 7.5, BODY, yr=(112, 158))
        s.bone(f'M{X(46)} 116 L{X(44)} 152', 7.5, BODY, yr=(112, 158))
    # skull: narrow back, heavy wide cheekbones
    sk = ('M100 46 C122 46 136 54 140 70 C144 84 148 98 152 112 C154 120 150 126 140 128 '
          'C134 132 66 132 60 128 C50 126 46 120 48 112 C52 98 56 84 60 70 C64 54 78 46 100 46 Z')
    inner = skull_inner(s, 92, 132, f'<path d="{nose(100, 115, 13, 12)}" fill="{INK}" opacity=".88"/>')
    s.shape(sk, BONE, contact=4, inner=inner, cop=0.32, split=True)
    # underbite jaw with lower teeth as silhouette bumps on its top edge, plus tusks
    jaw = ('M60 142 C60 138 64 136 70 137 L72 130 C74 125 80 125 82 130 L84 137 '
           'C90 138 110 138 116 137 L118 130 C120 125 126 125 128 130 L130 137 C136 136 140 138 140 142 '
           'L138 156 C136 164 128 168 118 168 H82 C72 168 64 164 62 156 Z')
    s.shape(jaw, BONE, contact=4, cop=0.34, split=True)
    for tx, sd in ((77, -1), (123, 1)):
        t = f'M{tx-6} 138 C{tx-6} 124 {tx-3+sd*2} 112 {tx+sd*3} 106 C{tx+6} 114 {tx+7} 122 {tx+6} 130 Z'
        s.shape(t, TOOTH, contact=2)
    # cleaver (right)
    cl = 'M147 164 H177 L177 182 L173 186 L177 190 L177 202 H155 C150 202 147 198 147 194 Z'
    s.shape(cl, IRON, contact=2, inner=rust_blotches([(157, 184, 9, 7, '#B5602E', .9), (171, 200, 6, 5, '#9A4A24', .9), (172, 174, 3, 3, '#C8743F', .8)]) +
            f'<path d="{circ(168, 177, 3.5)}" fill="{INK}"/>')
    # knuckle fists
    for (x, y) in ((39, 158), (161, 158)):
        for k in range(4):
            s.shape(circ(x - 9 + k * 6, y + 8, 4.4), BONE, contact=1.5)
        s.shape(rrect(x - 14, y - 9, 28, 18, 8), BONE, contact=2.5)
    return s


# ================================================================ DESIGN 4  "Ribcage"
def design4():
    s = Spr('SKELETON design-4 "Hollow": tall narrow skull with a small pointed jaw, ribs fanned out on both sides '
            'over a dark hollow chest, fencer stance (right shoulder forward, left back). Thin long-fingered hands, '
            'rusty rapier thrust straight forward.')
    # hollow chest: ink mass the ribs sit on
    s.sil.append('<path d="M34 90 C34 70 60 62 100 62 C140 62 166 72 168 100 C170 124 150 140 100 140 C50 140 34 116 34 90 Z"/>')
    # ribs (separate curved bones with dark gaps)
    for k, (a, b, c) in enumerate(((70, 34, 92), (86, 30, 110), (102, 34, 128))):
        s.bone(f'M80 {a} C58 {a-2} {b+4} {a+6} {b} {c}', 8, BODY, yr=(a - 4, c + 4))
        s.bone(f'M120 {a+8} C142 {a+6} {200-b-4} {a+14} {200-b+2} {c+10}', 8, BODY, yr=(a, c + 14))
    # shoulder knobs: left back, right forward
    s.shape(circ(34, 94, 11), BONE)
    s.shape(circ(170, 118, 11), BONE)
    # narrow tall skull, small pointed jaw
    sk = ('M100 40 C126 40 144 58 145 86 C146 104 142 114 138 122 C134 128 130 132 128 138 '
          'C124 152 112 164 100 166 C88 164 76 152 72 138 C70 132 66 128 62 122 '
          'C58 114 54 104 55 86 C56 58 74 40 100 40 Z')
    inner = skull_inner(s, 100, 140,
                        f'<path d="{nose(100, 122, 9, 11)}" fill="{INK}" opacity=".88"/>'
                        f'<path d="{rrect(82, 137, 36, 11, 5)}" fill="#4A3A36"/>' + teeth(84, 137, 4, 7.4, 8, 1.5))
    s.shape(sk, BONE, contact=4, inner=inner, cop=0.32, split=True)
    # rapier (right, forward)
    s.bone('M152 160 L152 199', 6.5, IRON, yr=(160, 202), cap='round')
    s.raw(f'<path d="M150 170 V179 M154 186 V193" stroke="#C0662E" stroke-width="3.5" stroke-linecap="round"/>')
    s.shape(ell(152, 156, 13, 7), RUST, contact=2)                   # cup guard
    hand_claw(s, 152, 146, fingers=3, fw=5, fl=10, spread=6, pw=20, ph=14)
    # back hand, raised behind the left shoulder
    hand_claw(s, 35, 72, fingers=3, fw=5, fl=12, spread=6, pw=20, ph=14, ang=150)
    return s


if __name__ == '__main__':
    import sys
    for k, f in enumerate([design1, design2, design3, design4], 1):
        open(f'design-{k}.svg', 'w').write(f().svg())
    print('built')
