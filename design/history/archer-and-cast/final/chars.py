"""Character sprites in the archer's final style.

Rules (same as archer.svg): one sprite, front = DOWN, rotate whole around (100,100).
Rendering: one heavy dark outer silhouette, no inner lines, soft top-to-bottom gradients,
split shading (left lit, right half darker, hard seam at x=100 or a part's own centre),
small contact shadows under overlapping parts. No eyes, no blush.
"""
import colorsys

INK = '#2B2230'

def hx(c):
    c = c.lstrip('#'); return tuple(int(c[i:i+2], 16) / 255 for i in (0, 2, 4))
def tohex(r, g, b): return '#%02X%02X%02X' % tuple(max(0, min(255, round(v * 255))) for v in (r, g, b))
def shade(c, k=0.78, sat=1.06):
    h, l, s = colorsys.rgb_to_hls(*hx(c)); return tohex(*colorsys.hls_to_rgb(h, l * k, min(1, s * sat)))
def light(c, k=1.12):
    h, l, s = colorsys.rgb_to_hls(*hx(c)); return tohex(*colorsys.hls_to_rgb(h, min(0.97, l * k), s))


class Sprite:
    def __init__(self):
        self.defs, self.sil, self.body, self.n = [], [], [], 0

    def _id(self, p):
        self.n += 1; return f'{p}{self.n}'

    def part(self, d, color, sil=True, split=True, split_x=100, contact=False, extra='', grad=None,
             shade_k=0.78, sil_extra=''):
        """d: path data. color: base colour. grad: optional raw fill (e.g. url(#gFace))."""
        i = self._id('p')
        top, bot = light(color, 1.1), shade(color, 0.92, 1.0)
        self.defs.append(f'<linearGradient id="g{i}" x1="0" y1="0" x2="0.35" y2="1">'
                         f'<stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bot}"/></linearGradient>')
        self.defs.append(f'<linearGradient id="s{i}" x1="0" y1="0" x2="0.35" y2="1">'
                         f'<stop offset="0" stop-color="{shade(top, shade_k)}"/><stop offset="1" stop-color="{shade(bot, shade_k)}"/></linearGradient>')
        self.defs.append(f'<clipPath id="c{i}"><path d="{d}"/></clipPath>')
        if sil:
            self.sil.append(f'<path d="{d}"/>' + sil_extra)
        out = []
        if contact:
            out.append(f'<path d="{d}" fill="{INK}" opacity="0.28" transform="translate(0 3)"/>')
        out.append(f'<path d="{d}" fill="{grad or f"url(#g{i})"}"/>')
        inner = ''
        if split:
            inner += f'<rect x="{split_x}" y="-20" width="240" height="260" fill="url(#s{i})"/>'
        inner += extra
        if inner:
            out.append(f'<g clip-path="url(#c{i})">{inner}</g>')
        self.body.append(''.join(out))
        return i

    def raw(self, svg, sil=''):
        self.body.append(svg)
        if sil: self.sil.append(sil)

    def svg(self, title):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n'
                f'<!-- {title}. Single sprite. Facing = DOWN (+y). Rotate whole sprite around (100,100). -->\n'
                f'<defs>{"".join(self.defs)}{FACE_DEFS}</defs>\n'
                f'<g fill="{INK}" stroke="{INK}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">{"".join(self.sil)}</g>\n'
                + '\n'.join(self.body) + '\n</svg>\n')


FACE_DEFS = (
    '<linearGradient id="gFace" x1="0" y1="0" x2="0" y2="1">'
    '<stop offset="0" stop-color="#9A6250"/><stop offset="0.38" stop-color="#C98E6C"/>'
    '<stop offset="0.66" stop-color="#F2C7A0"/><stop offset="1" stop-color="#F6D0AC"/></linearGradient>'
    '<radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/>'
    '<stop offset="1" stop-color="#DFA57F"/></radialGradient>'
    '<radialGradient id="gBone" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#FBF5E6"/>'
    '<stop offset="1" stop-color="#D9CDB0"/></radialGradient>'
)

def hand(s, x, y, w=24, h=21, bone=False):
    d = rrect(x - w / 2, y - h / 2, w, h, 8)
    s.raw(f'<path d="{d}" fill="{INK}" opacity="0.3" transform="translate(0 2)"/>'
          f'<path d="{d}" fill="url(#{"gBone" if bone else "gHand"})"/>', sil=f'<path d="{d}"/>')

def rrect(x, y, w, h, r):
    return (f'M{x+r} {y} H{x+w-r} A{r} {r} 0 0 1 {x+w} {y+r} V{y+h-r} A{r} {r} 0 0 1 {x+w-r} {y+h} '
            f'H{x+r} A{r} {r} 0 0 1 {x} {y+h-r} V{y+r} A{r} {r} 0 0 1 {x+r} {y} Z')

def circ(cx, cy, r):
    return f'M{cx-r} {cy} A{r} {r} 0 1 0 {cx+r} {cy} A{r} {r} 0 1 0 {cx-r} {cy} Z'

MOUTH = '<path d="M96.5 {y} Q100 {y2} 103.5 {y}" fill="none" stroke="#C98868" stroke-width="2.5" stroke-linecap="round"/>'


# ---------------------------------------------------------------- KNIGHT
def knight():
    s = Sprite()
    STEEL, BLUE, GOLD = '#BCC3CD', '#4F7BC4', '#F2B53A'
    # pauldrons
    s.part('M60 100 C34 94 16 112 18 136 C34 146 58 138 72 120 Z', STEEL)
    s.part('M140 100 C166 94 184 112 182 136 C166 146 142 138 128 120 Z', STEEL)
    # shield (held at left-front)
    s.part('M30 138 H84 V156 C84 176 70 190 57 196 C44 190 30 176 30 156 Z', GOLD, split_x=57, contact=True)
    s.part('M37 145 H77 V157 C77 172 67 182 57 187 C47 182 37 172 37 157 Z', BLUE, sil=False, split_x=57)
    # helmet dome
    s.part('M100 32 C136 32 160 60 160 96 C160 130 136 156 100 156 C64 156 40 130 40 96 C40 60 64 32 100 32 Z',
           STEEL, contact=True)
    # crest
    s.part('M100 18 C112 30 114 60 109 92 L91 92 C86 60 88 30 100 18 Z', BLUE)
    # gold rim + face opening + nose guard
    s.part('M62 136 C62 102 138 102 138 136 C136 152 122 160 100 160 C78 160 64 152 62 136 Z', GOLD, sil=False)
    s.part('M72 134 C73 110 127 110 128 134 C126 148 74 148 72 134 Z', '#F2C7A0', sil=False, grad='url(#gFace)',
           extra=MOUTH.format(y=139, y2=141.5))
    s.part(rrect(95, 100, 10, 22, 4), STEEL, sil=False, contact=True)
    # sword in the right hand, pointing forward
    s.part('M140 150 H152 V186 L146 198 L140 186 Z', '#D5DAE1', split_x=146, contact=True)
    s.part(rrect(131, 143, 30, 9, 4), GOLD, split_x=146)
    hand(s, 146, 136)
    return s.svg('Knight')


# ---------------------------------------------------------------- FARMER
def farmer():
    s = Sprite()
    STRAW, DENIM, RED = '#F0CF78', '#5D86C6', '#C8553D'
    s.part('M58 104 C32 100 18 120 22 142 C38 150 62 142 74 126 Z', DENIM)
    s.part('M142 104 C168 100 182 120 178 142 C162 150 138 142 126 126 Z', DENIM)
    # face under the brim
    s.part('M68 144 C68 122 132 122 132 144 C130 164 70 164 68 144 Z', '#F2C7A0', grad='url(#gFace)',
           extra=MOUTH.format(y=152, y2=154.5))
    # hat
    s.part(circ(100, 80, 60), STRAW, contact=True)
    s.part(circ(100, 76, 35), RED, sil=False, contact=True)
    s.part(circ(100, 73, 29), light(STRAW, 1.05), sil=False)
    # pitchfork
    s.part(rrect(140, 118, 9, 58, 4), '#B57944', split_x=144.5, contact=True)
    s.part('M128 170 H161 V178 H157 V192 L154 196 L151 192 V178 H147 V192 L144.5 196 L142 192 V178 H138 V192 L135 196 L132 192 V178 H128 Z',
           '#C9CED6', split_x=144.5)
    hand(s, 144.5, 134)
    hand(s, 144.5, 160)
    return s.svg('Farmer')


# ---------------------------------------------------------------- ROGUE
def rogue():
    s = Sprite()
    PURPLE = '#8A5BB8'
    s.part('M60 98 C32 94 16 116 20 140 C38 148 62 138 74 120 Z', shade(PURPLE, 0.8))
    s.part('M140 98 C168 94 184 116 180 140 C162 148 138 138 126 120 Z', shade(PURPLE, 0.8))
    # daggers (behind hands)
    s.part('M62 158 L74 160 L64 196 L58 192 Z', '#D5DAE1', split_x=66, contact=True)
    s.part('M138 158 L126 160 L136 196 L142 192 Z', '#D5DAE1', split_x=134, contact=True)
    # hood: slimmer, sharper tip
    s.part('M100 10 C114 30 150 58 157 92 C163 124 146 152 100 154 C54 152 37 124 43 92 C50 58 86 30 100 10 Z',
           PURPLE, contact=True)
    # deep opening (no gold), face in shadow, mask over the lower face
    s.part('M60 132 C60 96 140 96 140 132 C138 150 124 158 100 158 C76 158 62 150 60 132 Z', light(PURPLE, 1.15), sil=False)
    s.part('M70 130 C71 106 129 106 130 130 C128 146 72 146 70 130 Z', '#F2C7A0', sil=False, grad='url(#gFace)')
    s.part('M66 132 C84 126 116 126 134 132 L132 144 C118 152 82 152 68 144 Z', '#4E3D66', sil=False)
    hand(s, 70, 152)
    hand(s, 130, 152)
    return s.svg('Rogue')


# ---------------------------------------------------------------- BARBARIAN
def barbarian():
    s = Sprite()
    FUR, IRON, HORN, BEARD = '#946847', '#A5ADB8', '#EFE5CC', '#E0883A'
    s.part('M30 108 Q24 96 36 92 Q40 80 54 84 Q62 74 74 82 L126 82 Q138 74 146 84 Q160 80 164 92 '
           'Q176 96 170 108 Q182 118 172 130 Q176 144 160 144 Q154 156 140 150 L60 150 Q46 156 40 144 '
           'Q24 144 28 130 Q18 118 30 108 Z', FUR)
    # axe (right side, pointing forward)
    s.part(rrect(135, 118, 10, 72, 4), '#A0683A', split_x=140, contact=True)
    s.part('M145 164 C166 158 180 172 176 196 C164 190 154 188 145 190 Z', '#D5DAE1', split_x=160)
    # horns
    s.part('M62 82 C44 72 24 78 16 96 C12 106 16 114 22 112 C28 96 44 90 64 96 Z', HORN, split=False)
    s.part('M138 82 C156 72 176 78 184 96 C188 106 184 114 178 112 C172 96 156 90 136 96 Z', HORN)
    # face strip under the cap, then the beard
    s.part('M66 120 C66 98 134 98 134 120 C132 136 68 136 66 120 Z', '#F2C7A0', grad='url(#gFace)')
    s.part('M60 116 C64 150 80 174 100 182 C120 174 136 150 140 116 C124 128 76 128 60 116 Z', BEARD, contact=True)
    # iron cap
    s.part('M100 40 C128 40 146 62 146 88 C146 102 140 112 130 116 C112 106 88 106 70 116 C60 112 54 102 54 88 C54 62 72 40 100 40 Z',
           IRON, contact=True)
    hand(s, 140, 134)
    hand(s, 140, 160)
    return s.svg('Barbarian')


# ---------------------------------------------------------------- SKELETON
def skeleton():
    s = Sprite()
    BONE, RUST = '#EDE4CD', '#B5683F'
    s.part(circ(52, 122, 18), BONE)
    s.part(circ(148, 122, 18), BONE)
    # rusty sword
    s.part('M140 148 H152 V172 L148 176 L152 182 L146 198 L140 184 Z', RUST, split_x=146, contact=True)
    s.part(rrect(131, 141, 30, 8, 4), '#6E4A3A', split_x=146)
    # skull
    s.part('M100 30 C136 30 158 56 158 92 C158 122 142 144 124 152 L76 152 C58 144 42 122 42 92 C42 56 64 30 100 30 Z',
           BONE, contact=True,
           extra='<path d="M118 40 L110 58 L120 66 L112 82" fill="none" stroke="#B9AB8C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
    # sockets peeking at the front, then teeth
    s.part('M66 122 C66 108 92 108 94 122 C92 136 70 138 66 122 Z', '#3B2F33', sil=False, split=False)
    s.part('M134 122 C134 108 108 108 106 122 C108 136 130 138 134 122 Z', '#3B2F33', sil=False, split=False)
    s.part(rrect(78, 142, 44, 15, 6), light(BONE, 1.04), contact=True,
           extra='<path d="M89 142 V157 M100 142 V157 M111 142 V157" stroke="#C7B994" stroke-width="3"/>')
    hand(s, 146, 134, bone=True)
    return s.svg('Skeleton')


if __name__ == '__main__':
    for name, fn in [('knight', knight), ('farmer', farmer), ('rogue', rogue), ('barbarian', barbarian), ('skeleton', skeleton)]:
        open(f'{name}.svg', 'w').write(fn())
    print('ok')
