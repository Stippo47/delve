"""build.py -> base-1..4.svg  (base human: bare head + face + hair + hands, no props)
Sized to the ARCHER'S HEAD (hood footprint x41..159, y14..160), hands archer-size (~24x21).
Facing = DOWN (+y). Rotate whole sprite around (100,100). viewBox -10 -10 220 220."""
import os
OUT = os.path.dirname(os.path.abspath(__file__))
INK = '#2B2230'

class S:
    def __init__(s): s.defs = []; s.n = 0
    def id(s, p='g'): s.n += 1; return f'{p}{s.n}'
    def grad(s, x0, y0, x1, y1, *stops):
        i = s.id('g')
        st = ''.join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a}"' if a is not None else '') + '/>'
                     for o, c, *r in stops for a in [r[0] if r else None])
        s.defs.append(f'<linearGradient id="{i}" x1="{x0}" y1="{y0}" x2="{x1}" y2="{y1}" gradientUnits="userSpaceOnUse">{st}</linearGradient>')
        return i
    def vgrad(s, y0, y1, *stops): return s.grad(0, y0, 0, y1, *stops)
    def clip(s, inner):
        i = s.id('c'); s.defs.append(f'<clipPath id="{i}">{inner}</clipPath>'); return i

def el(kind, **a): return (kind, a)
def render(e, **extra):
    k, a = e; a = {**a, **extra}
    return f'<{k} ' + ' '.join(f'{x.replace("_","-")}="{v}"' for x, v in a.items()) + '/>'
def P(d): return el('path', d=d)
def C(x, y, r): return el('circle', cx=x, cy=y, r=r)
def E(x, y, rx, ry): return el('ellipse', cx=x, cy=y, rx=rx, ry=ry)
def R(cx, cy, w, h, rx=8, rot=0):
    return el('rect', x=cx - w / 2, y=cy - h / 2, width=w, height=h, rx=rx, transform=f'rotate({rot} {cx} {cy})')
def G(prims): return ''.join(render(p) for p in prims)

def part(s, prims, lit, shade, split=True, soft_from=96, soft_to=156):
    """Lit-left shading. split=True: hard seam at x=100 (archer hood style).
    split=False: soft horizontal fade into the shade colour on the right side."""
    g = G(prims); c = s.clip(g)
    o = [f'<g fill="url(#{lit})">{g}</g>']
    if split:
        o.append(f'<g clip-path="url(#{c})"><rect x="100" y="-20" width="140" height="260" fill="url(#{shade})"/></g>')
    else:
        sc = s.grad(soft_from, 0, soft_to, 0, (0, shade, 0), (1, shade, 0.85))
        o.append(f'<g clip-path="url(#{c})"><rect x="-20" y="-20" width="260" height="260" fill="url(#{sc})"/></g>')
    return '\n'.join(o)

def skin(s, prims, y0, y1, hair=None, hl=None, mouth=None, ear=False, split=False, hair_dy=3.5):
    g = G(prims); c = s.clip(g)
    if ear:
        gr = s.vgrad(y0, y1, (0, '#E9B48C'), (1, '#D9A07A'))
    elif hl is not None:   # darker toward the hairline, like the archer's face under the brim
        gr = s.vgrad(hl - 4, y1, (0, '#BC876C'), (0.32, '#E2AF8A'), (0.58, '#F2C7A0'), (1, '#F6D0AC'))
    else:
        gr = s.vgrad(y0, y1, (0, '#D9A27E'), (0.45, '#F0C39C'), (1, '#F6D0AC'))
    o = [f'<g fill="url(#{gr})">{g}</g>', f'<g clip-path="url(#{c})">']
    if split:
        o.append('<rect x="100" y="-20" width="140" height="260" fill="#8A4E36" opacity="0.14"/>')
    else:
        sc = s.grad(98, 0, 160, 0, (0, '#8A4E36', 0), (1, '#8A4E36', 0.32))
        o.append(f'<rect x="-20" y="-20" width="260" height="260" fill="url(#{sc})"/>')
    if hair:
        o.append(f'<g transform="translate(0 {hair_dy})" fill="#7A3E2A" opacity="0.3">{G(hair)}</g>')
    o.append('</g>')
    if mouth:
        x, y = mouth
        o.append(f'<path d="M{x-3} {y} Q{x} {y+2.5} {x+3} {y}" fill="none" stroke="#C98868" stroke-width="2.5" stroke-linecap="round"/>')
    return '\n'.join(o)

def hands(hs):
    o = [f'<g transform="translate(0 2.5)">{render(h, fill=INK, opacity=0.3)}</g>' for h in hs]
    o += [render(h, fill='url(#gHand)') for h in hs]
    return '\n'.join(o)

def outline(prims):
    return f'<g fill="{INK}" stroke="{INK}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">{G(prims)}</g>'

HAND_DEF = ('<radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75">'
            '<stop offset="0" stop-color="#F8D4B2"/><stop offset="1" stop-color="#DFA57F"/></radialGradient>')

def svg(name, comment, s, body):
    d = '\n    '.join([HAND_DEF] + s.defs)
    open(os.path.join(OUT, name), 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">
  <!-- {comment} Facing = DOWN (+y). Rotate whole sprite around (100,100). -->
  <defs>
    {d}
  </defs>
{body}
</svg>
''')

def hg(s, y0, y1, lit):
    return s.vgrad(y0, y1, (0, lit[0]), (1, lit[1]))

# ---------------------------------------------------------------------------------------------
# BASE 1 "Bowl": round head, slate bowl cut (hard split like the archer hood), 3-lobe fringe,
#   small ears below the rim, fists at the front corners.
def base1():
    s = S()
    head = [C(100, 102, 50)]
    ears = [E(50, 116, 9, 12), E(150, 116, 9, 12)]
    hair = [P('M45 112 C38 62 66 36 100 36 C134 36 162 62 155 112 '
              'C149 115 141 114 135 108 C129 116 120 116 114 110 C108 117 92 117 86 110 '
              'C80 116 71 116 65 108 C59 114 51 115 45 112 Z')]
    hs = [R(68, 160, 24, 21, 8, 18), R(132, 160, 24, 21, 8, -18)]
    lit = hg(s, 36, 117, ('#6A6282', '#4F4866')); sh = hg(s, 36, 117, ('#4A4360', '#363049'))
    body = [outline(ears + head + hair + hs),
            skin(s, ears, 104, 128, ear=True),
            skin(s, head, 52, 152, hair, hl=108, mouth=(100, 142), split=True),
            part(s, hair, lit, sh, split=True),
            hands(hs)]
    svg('base-1.svg', 'BASE 1 "Bowl" (b3: crown sliver removed): round head, bowl cut with 3-lobe fringe, small ears below the rim, fists at front corners.', s, '\n'.join(body))

# BASE 2 "Long": long egg head, slicked-back blond hair to a soft rounded peak, a ponytail that
#   leaves the crown and curls over the right shoulder, big ears, open hands wide at the flanks.
def base2():
    s = S()
    head = [E(100, 98, 40, 56)]
    ears = [E(60, 112, 12, 16), E(140, 112, 12, 16)]
    tail = [P('M92 46 C92 30 108 22 124 24 C142 26 156 40 156 62 C150 52 140 44 128 42 C116 41 108 46 104 52 Z')]
    hair = [P('M62 114 C52 70 70 42 100 42 C130 42 148 70 138 114 '
              'C134 108 124 106 116 110 C110 113 105 116 100 118 C95 116 90 113 84 110 C76 106 66 108 62 114 Z')]
    hs = [R(46, 140, 21, 25, 9, 10), R(154, 140, 21, 25, 9, -10)]
    lit = hg(s, 42, 118, ('#F3D47A', '#DDAF4C')); sh = hg(s, 42, 118, ('#CC9A3E', '#AC7C2C'))
    tl = hg(s, 22, 62, ('#E6BE5C', '#CDA044')); ts = hg(s, 22, 62, ('#BE8C36', '#9E7028'))
    body = [outline(ears + tail + head + hair + hs),
            part(s, tail, tl, ts, split=True),
            skin(s, ears, 96, 128, ear=True),
            skin(s, head, 42, 154, hair, hl=112, mouth=(100, 144), split=True),
            part(s, hair, lit, sh, split=True),
            hands(hs)]
    svg('base-2.svg', 'BASE 2 "Long": long egg head, slicked-back hair to a soft peak, ponytail curling over the right shoulder, big ears, open hands wide at flanks.', s, '\n'.join(body))

# BASE 3 "Cloud": round curly cloud of puffs, soft shading (no hard split); small low face under
#   the front puffs; no ears; hands together under the chin.
def base3():
    s = S()
    face = [E(100, 132, 40, 26)]
    k, cy = 0.88, 84
    raw = [(100, 34, 20), (75, 39, 19), (125, 39, 19), (56, 55, 19), (144, 55, 19),
           (47, 79, 18), (153, 79, 18), (50, 103, 16), (150, 103, 16), (62, 120, 11), (138, 120, 11),
           (80, 103, 14), (100, 100, 15), (120, 103, 14)]
    puffs = [(round(100 + (x - 100) * k, 1), round(cy + (y - cy) * k, 1), round(r * k, 1)) for x, y, r in raw]
    hair = [E(100, round(cy + (74 - cy) * k, 1), round(48 * k, 1), round(40 * k, 1))] + [C(*p) for p in puffs]
    hs = [R(89, 164, 23, 21, 8, 22), R(111, 164, 23, 21, 8, -22)]
    lit = hg(s, 14, 134, ('#93664C', '#77503B'))
    body = [outline(face + hair + hs),
            skin(s, face, 106, 158, hair, hl=114, mouth=(100, 148)),
            part(s, hair, lit, '#3E261D', split=False, soft_from=70, soft_to=170),
            hands(hs)]
    svg('base-3.svg', 'BASE 3 "Cloud" (b3: cloud shrunk 12%, face widened): curly hair cloud, small low face under the front puffs, hands together under the chin.', s, '\n'.join(body))

# BASE 4 "Jaw": wide-jawed head (narrow crown, square front), messy ginger crop with three rounded
#   tufts at the back and a fringe falling forward-left, soft shading (no split), small ears,
#   both hands gripping off to the front-right (two-hander grip).
def base4():
    s = S()
    head = [P('M100 44 C128 44 142 54 148 74 C154 94 158 116 152 130 C144 148 124 152 100 152 '
              'C76 152 56 148 48 130 C42 116 46 94 52 74 C58 54 72 44 100 44 Z')]
    ears = [C(48, 102, 9), C(152, 102, 9)]
    hair = [P('M45 104 C40 76 50 56 64 46 C64 36 72 30 80 32 C84 24 96 22 102 28 C108 22 120 24 122 34 '
              'C130 34 138 40 138 48 C150 58 158 76 154 98 '
              'C146 94 136 94 128 98 C116 104 104 108 94 116 C84 124 70 128 60 126 C52 124 46 116 45 104 Z')]
    hs = [R(122, 162, 24, 21, 8, -10), R(146, 148, 24, 21, 8, -32)]
    lit = hg(s, 24, 128, ('#EC8C50', '#D06A34'))
    body = [outline(ears + head + hair + hs),
            skin(s, ears, 92, 112, ear=True),
            skin(s, head, 44, 152, hair, mouth=(104, 141)),
            part(s, hair, lit, '#8E3E1E', split=False, soft_from=80, soft_to=160),
            hands(hs)]
    svg('base-4.svg', 'BASE 4 "Jaw": wide-jawed head, messy crop with rounded back tufts and forward-left fringe, small ears, two-hander grip front-right.', s, '\n'.join(body))

for f in (base1, base3): f()
print('ok')
