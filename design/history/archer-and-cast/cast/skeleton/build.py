"""Skeleton enemy — 4 designs in the archer's rendering.
One heavy outer silhouette (#2B2230, 12u stroke), no inner lines, soft top-to-bottom gradients,
split shading (lit left / darker right, hard seam), contact shadows. Front = DOWN, rotate around (100,100).
No eyes anywhere: the skull reads through cranium shape, cheekbones, a closed tooth row and a jaw.
"""
INK = '#2B2230'

# (lit_top, lit_bot, shade_top, shade_bot)
BONE  = ('#FAF1D8', '#E9D9B0', '#CDB88C', '#B39C6E')
BONE2 = ('#EFE2C0', '#DAC79A', '#C3AC7D', '#A68F62')   # under-parts (jaw, back pieces)
TOOTH = ('#FFFDF6', '#F3EBD6', '#E6DAB9', '#D8C9A2')
RUST  = ('#D2804A', '#B05E33', '#A2532F', '#833F24')
RUSTD = ('#9A5233', '#7C3E25', '#7A3F27', '#5F2F1D')    # deep rust patches
IRON  = ('#7C6A6C', '#5E4E52', '#5E4E52', '#463A3E')
WOOD  = ('#D0935A', '#B57944', '#A5693A', '#8A552C')
GOLD  = ('#F9CB5C', '#E8A030', '#E2A23A', '#C9821F')
PATINA= ('#8CC7B0', '#6AAA95', '#5E9C88', '#4A8070')
CLOTH = ('#86629F', '#6C4C88', '#634680', '#4E3668')
CLOTHB= ('#5E4478', '#4A3462', '#4A3462', '#3A2850')
FEATH = ('#FFF8E8', '#EFE5CC', '#E3D8C2', '#CFC1A3')


class S:
    def __init__(self, title):
        self.title, self.defs, self.sil, self.body, self.n = title, [], [], [], 0

    def g(self, top, bot, x2=0.3):
        self.n += 1; i = f'g{self.n}'
        self.defs.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="1"><stop offset="0" stop-color="{top}"/>'
                         f'<stop offset="1" stop-color="{bot}"/></linearGradient>')
        return f'url(#{i})'

    def clip(self, d):
        self.n += 1; i = f'c{self.n}'
        self.defs.append(f'<clipPath id="{i}"><path d="{d}"/></clipPath>')
        return f'url(#{i})'

    def part(self, d, pal, split_x=100, whole=None, contact=3, sil=True, extra='', cshadow_op=0.28, sil_w=None):
        """whole='lit'|'shade' paints the whole part one side (like the archer's side petals)."""
        if sil:
            self.sil.append(f'<path d="{d}"' + (f' stroke-width="{sil_w}"' if sil_w else '') + '/>')
        o = []
        if contact:
            o.append(f'<path d="{d}" fill="{INK}" opacity="{cshadow_op}" transform="translate(0 {contact})"/>')
        if whole == 'shade':
            o.append(f'<path d="{d}" fill="{self.g(pal[2], pal[3])}"/>')
        else:
            o.append(f'<path d="{d}" fill="{self.g(pal[0], pal[1])}"/>')
        inner = ''
        if whole is None and split_x is not None:
            inner += f'<rect x="{split_x}" y="-20" width="300" height="300" fill="{self.g(pal[2], pal[3])}"/>'
        inner += extra
        if inner:
            o.append(f'<g clip-path="{self.clip(d)}">{inner}</g>')
        self.body.append(''.join(o))

    def raw(self, body, sil=''):
        self.body.append(body)
        if sil: self.sil.append(sil)

    def hand(self, x, y, w=22, h=19, rot=0):
        d = rrect(x - w / 2, y - h / 2, w, h, 7.5)
        t = f' transform="rotate({rot} {x} {y})"' if rot else ''
        self.sil.append(f'<path d="{d}"{t}/>')
        self.body.append(f'<g{t}><path d="{d}" fill="{INK}" opacity="0.3" transform="translate(0 2)"/>'
                         f'<path d="{d}" fill="url(#gBoneHand)"/></g>')

    def svg(self):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n'
                f'<!-- {self.title}. Single sprite. Facing = DOWN (+y). Rotate whole sprite around (100,100). -->\n'
                f'<defs>{"".join(self.defs)}'
                '<radialGradient id="gBoneHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#FBF5E6"/>'
                '<stop offset="1" stop-color="#D6C7A2"/></radialGradient></defs>\n'
                f'<g fill="{INK}" stroke="{INK}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">{"".join(self.sil)}</g>\n'
                + '\n'.join(self.body) + '\n</svg>\n')


def rrect(x, y, w, h, r):
    return (f'M{x+r} {y} H{x+w-r} A{r} {r} 0 0 1 {x+w} {y+r} V{y+h-r} A{r} {r} 0 0 1 {x+w-r} {y+h} '
            f'H{x+r} A{r} {r} 0 0 1 {x} {y+h-r} V{y+r} A{r} {r} 0 0 1 {x+r} {y} Z')

def circ(cx, cy, r):
    return f'M{cx-r} {cy} A{r} {r} 0 1 0 {cx+r} {cy} A{r} {r} 0 1 0 {cx-r} {cy} Z'

def face_grad(s, y0, y1, top='#9A8160'):
    """Archer-style face: warm shadow under the brow fading into bone."""
    s.n += 1; i = f'f{s.n}'
    s.defs.append(f'<linearGradient id="{i}" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">'
                  f'<stop offset="0" stop-color="{top}"/><stop offset="0.38" stop-color="#CDBB93"/>'
                  f'<stop offset="0.8" stop-color="#EEE4C8"/><stop offset="1" stop-color="#F6EEDA"/></linearGradient>')
    return f'url(#{i})'

def teeth(s, xs, y, w, h):
    """Closed tooth row: light teeth on a mid-bone backing (gaps read as tone, never as a dark mouth)."""
    x0, x1 = xs[0] - w / 2 - 1.5, xs[-1] + w / 2 + 1.5
    back = rrect(x0, y + 2, x1 - x0, h - 4, 6)
    ds = ''.join(f'<path d="{rrect(x - w / 2, y, w, h, min(w, h) / 2.6)}"/>' for x in xs)
    s.n += 1; ci = f'r{s.n}'
    s.defs.append(f'<clipPath id="{ci}"><rect x="100" y="-20" width="200" height="300"/></clipPath>')
    lit, sh = s.g(TOOTH[0], TOOTH[1], 0), s.g(TOOTH[2], TOOTH[3], 0)
    return (f'<path d="{back}" fill="#C2AA7A"/><path d="{back}" fill="#A68D5E" clip-path="url(#{ci})"/>'
            f'<g fill="{lit}">{ds}</g><g fill="{sh}" clip-path="url(#{ci})">{ds}</g>')


# ============================================================ shared skull head
SUTURE = ('<path d="M100 26 L96 36 L103 46 L97 56 L103 66 L98 76 L101 84" fill="none" stroke="{c}" '
          'stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>')

def skull(s, cy=76, rx=58, ry=50, cran_extra='', jaw_w=34, teeth_n=5, brow=114, suture=True, cran=None, cheek=40):
    """Light-bulb skull, seen from above-front: big cranium, cheekbones, closed tooth row, narrower jaw.
    The sockets are hidden under the brow ridge: only the archer-style warm shadow shows there."""
    jx0, jx1 = 100 - jaw_w, 100 + jaw_w
    # mandible (behind) — narrower than the cranium, chin at the front
    jb = brow + 60
    jaw = f'M{jx0-2} {brow+22} C{jx0-4} {jb-14} {jx0+12} {jb} 100 {jb} C{jx1-12} {jb} {jx1+4} {jb-14} {jx1+2} {brow+22} Z'
    s.part(jaw, BONE2, contact=0)
    # maxilla + cheekbones (under the brow), warm shadow on top fading to bone
    # face (maxilla + cheeks as one plate): wide under the brow, narrowing into the tooth row
    w0 = rx * 0.86
    face = (f'M{100-w0} {brow-12} L{100+w0} {brow-12} L{100+w0} {brow+2} C{100+w0} {brow+14} {jx1+6} {brow+26} {jx1-1} {brow+40} '
            f'L{jx0+1} {brow+40} C{jx0-6} {brow+26} {100-w0} {brow+14} {100-w0} {brow+2} Z')
    s.sil.append(f'<path d="{face}"/>')
    fg = face_grad(s, brow, brow + 34)
    s.raw(f'<path d="{face}" fill="{fg}"/><g clip-path="{s.clip(face)}">'
          f'<rect x="100" y="80" width="80" height="100" fill="#6E5236" opacity="0.16"/></g>')
    tw = (2 * jaw_w - 6) / teeth_n
    xs = [jx0 + 3 + tw * (i + .5) for i in range(teeth_n)]
    # tooth row, closed, sitting on the jaw
    s.raw(teeth(s, xs, brow + 22, tw - 3, 24))
    # cranium on top, with its brow edge arching over the face
    # one light-bulb silhouette: the cranium flows straight down into the face plate; the brow is only a soft edge
    c = cran or (f'M100 {cy-ry} C{100+rx*0.6} {cy-ry} {100+rx} {cy-ry*0.55} {100+rx} {cy} '
                 f'C{100+rx} {cy+ry*0.45} {100+w0+3} {brow-10} {100+w0} {brow+2} '
                 f'C{100+w0*0.5} {brow-9} {100-w0*0.5} {brow-9} {100-w0} {brow+2} '
                 f'C{100-w0-3} {brow-10} {100-rx} {cy+ry*0.45} {100-rx} {cy} C{100-rx} {cy-ry*0.55} {100-rx*0.6} {cy-ry} 100 {cy-ry} Z')
    s.part(c, BONE, contact=4, cshadow_op=0.3, extra=(SUTURE.format(c='#C2AB7C') if suture else '') + cran_extra)
    return c


# ============================================================ D1 — bare skull, arrow in the head, notched shortsword
def d1():
    s = S('Skeleton D1 — bare skull with an arrow stuck in it, notched rusty shortsword')
    arrow_sil = ('<path d="M80 50 L54 18" stroke-width="16"/>'
                 '<path d="M54 18 C44 12 38 4 41 -1 C49 1 57 8 59 16 Z"/>'
                 '<path d="M54 18 C46 22 34 23 29 18 C33 12 45 11 54 18 Z"/>')
    s.raw('', sil=arrow_sil)
    blade = 'M147 166 H161 V178 L156 182 L161 187 V190 L154 202 L147 190 Z'
    s.part(blade, RUST, split_x=154)
    skull(s, suture=False, cran_extra='<path d="M80 52 L92 64 L86 76 L96 88" fill="none" stroke="#C9B386" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>')
    s.raw('<path d="M80 50 L54 18" stroke="#2B2230" stroke-width="5" opacity="0.25" transform="translate(0 3)"/>'
          '<path d="M80 50 L54 18" stroke="#A0683A" stroke-width="5" stroke-linecap="round"/>'
          f'<path d="M54 18 C44 12 38 4 41 -1 C49 1 57 8 59 16 Z" fill="{s.g(*FEATH[:2])}"/>'
          f'<path d="M54 18 C46 22 34 23 29 18 C33 12 45 11 54 18 Z" fill="{s.g(*FEATH[2:])}"/>')
    s.part(rrect(140, 160, 28, 9, 4.5), IRON, split_x=154, contact=0)
    s.hand(154, 151)
    s.hand(52, 166, rot=-12)
    return s.svg()


# ============================================================ D2 — rusty cooking-pot helm, two-hand spear on the right
def d2():
    s = S('Skeleton D2 — dented rusty cooking pot for a helmet, rusty spear held two-handed on the right')
    # spear shaft (behind everything) + leaf head
    shaft = 'M171 22 L163 176'
    s.raw(f'<path d="{shaft}" stroke="{INK}" stroke-width="5" opacity="0.25" transform="translate(0 3)"/>'
          f'<path d="{shaft}" stroke="url(#gShaft2)" stroke-width="7" stroke-linecap="round"/>',
          sil=f'<path d="{shaft}" stroke-width="19"/>')
    s.defs.append('<linearGradient id="gShaft2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C98A52"/>'
                  '<stop offset="1" stop-color="#8A552C"/></linearGradient>')
    head = 'M162 162 C172 170 174 184 162 202 C150 184 152 170 162 162 Z'
    s.part(head, RUST, split_x=162)
    s.part(rrect(152, 158, 20, 8, 4), IRON, split_x=162, contact=0)
    skull(s, suture=False)
    # pot handle (back-left), then the pot, tipped forward on the skull
    handle = 'M58 40 L22 10'
    s.raw(f'<path d="{handle}" stroke="{INK}" stroke-width="7" opacity="0.25" transform="translate(0 3)"/>'
          f'<path d="{handle}" stroke="#8C4A2C" stroke-width="10" stroke-linecap="round"/>'
          f'<path d="{handle}" stroke="#A85A34" stroke-width="5" stroke-linecap="round" transform="translate(-1.5 -1.5)"/>',
          sil=f'<path d="{handle}" stroke-width="22"/>')
    # rim: wider lip, a dent knocked into its back-right edge
    rim = ('M100 12 C112 12 122 14 130 18 C128 26 136 34 146 30 C160 42 168 56 168 76 C168 108 138 134 100 134 '
           'C62 134 32 108 32 76 C32 38 62 12 100 12 Z')
    s.part(rim, ('#6F6577', '#584F60', '#514858', '#3F3746'), contact=4, cshadow_op=0.32)
    dome = ('M100 24 C110 24 118 26 124 29 C124 38 134 44 144 40 C152 50 156 60 156 72 C156 100 132 118 100 118 '
            'C68 118 44 100 44 72 C44 44 68 24 100 24 Z')
    s.part(dome, ('#A49AA8', '#80768A', '#7A7084', '#62586C'), contact=3, cshadow_op=0.3,
           extra=f'<path d="M52 66 C54 48 70 36 82 40 C92 44 86 56 76 60 C68 64 66 76 58 80 C52 82 50 74 52 66 Z" fill="{s.g(*RUST[:2])}"/>'
                 f'<path d="M116 98 C126 92 140 90 146 96 C150 104 138 112 124 112 C116 112 110 104 116 98 Z" fill="{s.g(*RUST[2:])}"/>')
    s.hand(166, 98, rot=4)
    s.hand(164, 136, rot=4)
    return s.svg()


def star(cx, cy, r0, r1, n, rot=0):
    import math
    pts = []
    for i in range(2 * n):
        a = math.radians(rot + i * 180 / n); r = r1 if i % 2 == 0 else r0
        pts.append(f'{cx + r * math.sin(a):.1f} {cy - r * math.cos(a):.1f}')
    return 'M' + ' L'.join(pts) + ' Z'


# ============================================================ D3 — skeleton king: tarnished crown, ragged mantle, rusty mace
def d3():
    s = S('Skeleton D3 — skeleton king: tarnished crown, ragged royal mantle behind, rusty flanged mace in the left hand')
    mantle = ('M42 114 C16 106 4 80 8 50 L32 62 C40 34 66 18 100 18 C134 18 160 34 168 62 L192 50 '
              'C196 80 184 106 158 114 Z')
    s.part(mantle, CLOTH, contact=0)
    # mace shaft + head (front-left)
    shaft = 'M48 150 L42 174'
    s.raw(f'<path d="{shaft}" stroke="#7A5038" stroke-width="7" stroke-linecap="round"/>', sil=f'<path d="{shaft}" stroke-width="19"/>')
    s.part(star(40, 182, 10, 17, 6, rot=15), RUSTD, split_x=40, contact=0)
    s.part(circ(40, 182, 10), RUST, split_x=40, sil=False, contact=0)
    skull(s, cy=78, rx=52, ry=50, jaw_w=29, teeth_n=4, brow=116, suture=False)
    # crown, set a little crooked on the cranium
    s.raw('<g transform="rotate(-10 100 64)">', '')
    crown = ('M64 74 L58 40 L74 54 L84 30 L94 50 L100 24 L106 50 L116 30 L126 54 L142 40 L136 74 '
             'C126 82 74 82 64 74 Z')
    s.sil.append(f'<path d="{crown}" transform="rotate(-10 100 64)"/>')
    s.part(crown, GOLD, sil=False, contact=3, cshadow_op=0.3,
           extra=f'<path d="M52 34 L76 52 L80 42 L82 80 L52 80 Z" fill="{s.g(*PATINA[:2])}"/>')
    s.raw('</g>')
    s.hand(48, 152, rot=-14)
    s.hand(156, 150, rot=10)
    return s.svg()


# ============================================================ D4 — gravekeeper brute: candle on the skull, rusty scythe sweeping across the front
def d4():
    s = S('Skeleton D4 — gravekeeper brute: melted candle stuck on the skull, rusty scythe on the left, blade sweeping across the front')
    shaft = 'M34 26 L40 178'
    s.defs.append('<linearGradient id="gShaft4" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C98A52"/>'
                  '<stop offset="1" stop-color="#8A552C"/></linearGradient>')
    s.raw(f'<path d="{shaft}" stroke="{INK}" stroke-width="5" opacity="0.25" transform="translate(0 3)"/>'
          f'<path d="{shaft}" stroke="url(#gShaft4)" stroke-width="8" stroke-linecap="round"/>',
          sil=f'<path d="{shaft}" stroke-width="20"/>')
    blade = 'M36 168 C70 196 120 204 170 186 C130 186 92 182 48 160 Z'
    s.part(blade, RUST, split_x=110, contact=0)
    s.part(rrect(30, 162, 20, 14, 5), IRON, split_x=40, contact=0)
    skull(s, cy=78, rx=62, ry=50, jaw_w=40, teeth_n=6, brow=114, suture=False)
    # wax drips + candle + flame (back-right of the cranium)
    drips = ('M106 50 C104 40 112 34 124 34 C136 34 144 40 142 50 C146 60 146 70 140 72 C136 72 136 64 134 58 '
             'C130 66 128 80 120 80 C114 80 116 66 114 58 C110 62 104 60 106 50 Z')
    s.part(drips, ('#FFFBEF', '#F1E6C6', '#E7D9B4', '#D6C59A'), split_x=124, contact=2, sil=False)
    cand = 'M112 26 C112 18 136 18 136 26 V44 C136 52 112 52 112 44 Z'
    s.part(cand, ('#FFFBEF', '#F1E6C6', '#E7D9B4', '#D6C59A'), split_x=124, contact=3)
    flame = 'M124 30 C116 22 116 10 124 -2 C132 10 132 22 124 30 Z'
    s.part(flame, GOLD, split_x=124, contact=0)
    s.part('M124 26 C120 22 120 16 124 9 C128 16 128 22 124 26 Z', ('#FFF1C2', '#FBD978', '#FBE3A0', '#F2C35A'), split_x=124, sil=False, contact=0)
    s.hand(38, 98, rot=-4)
    s.hand(40, 138, rot=-4)
    return s.svg()


if __name__ == '__main__':
    import sys
    fns = {'1': d1, '2': d2, '3': d3, '4': d4}
    for k in (sys.argv[1:] or fns):
        open(f'/home/claude/archer/cast/skeleton/design-{k}.svg', 'w').write(fns[k]())
    print('ok')
