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
        sc = s.grad(96, 0, 154, 0, (0, '#8A4E36', 0), (1, '#8A4E36', 0.28))
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
# ROUND 4: adults. Longer face with a defined jaw + chin, higher asymmetric hairline, shoulder/collar mass
# under the head, smaller flatter hands, soft shadow-side gradient instead of the hard split.

SHOULDERS = P('M34 130 C34 110 58 102 100 102 C142 102 166 110 166 130 C166 148 142 156 100 156 C58 156 34 148 34 130 Z')
NECK = P('M84 118 H116 V156 H84 Z')

def torso(s, lit=('#8F877C', '#7A7268'), shade='#4A433C'):
    g = hg(s, 102, 156, lit)
    return part(s, [SHOULDERS], g, shade, split=False, soft_from=90, soft_to=170)

# BASE 1 "Bowl" (adult): head tapers to a defined flat chin; bowl cut sits higher with an uneven
#   3-lobe fringe (lower on the left); small ears; shoulders under the head; hands smaller, uneven.
def base1():
    s = S()
    head = [P('M100 36 C132 36 152 56 152 90 C152 110 146 126 135 139 L117 155 C109 161 91 161 83 155 '
              'L65 139 C54 126 48 110 48 90 C48 56 68 36 100 36 Z')]
    ears = [E(49, 106, 7, 10), E(151, 104, 7, 10)]
    hair = [P('M44 104 C36 58 64 30 100 30 C138 30 166 58 156 102 '
              'C152 100 148 97 145 93 C139 99 131 99 125 92 C118 98 109 99 103 92 '
              'C96 100 85 103 77 96 C71 103 62 106 55 101 C51 105 47 106 44 104 Z')]
    hs = [R(65, 160, 21, 17, 6, 14), R(137, 156, 21, 17, 6, -24)]
    lit = hg(s, 30, 106, ('#6A6282', '#4F4866'))
    body = [outline([SHOULDERS] + ears + head + hair + hs),
            torso(s),
            f'<g transform="translate(0 3)" fill="{INK}" opacity="0.28">{G(head)}</g>',
            skin(s, ears, 96, 116, ear=True),
            skin(s, head, 40, 160, hair, hl=96, mouth=(101, 141)),
            part(s, hair, lit, '#2A2538', split=False, soft_from=88, soft_to=160),
            hands(hs)]
    svg('base-1.svg', 'BASE 1 "Bowl" (round 4, adult): tapered head with defined chin, higher uneven bowl fringe, shoulders, soft shading.', s, '\n'.join(body))

# BASE 3 "Afro" (adult, rethought): the afro is a HALO around the head, not a ball on top. The face is set
#   INTO the front of the halo with a clean natural hairline; puffs only on the outer edge; hair wraps down
#   past the temples beside the cheeks; jaw and chin protrude in front. Slightly fuller on the left.
def base3():
    s = S()
    face = [P('M68 106 C72 94 86 89 98 92 C114 88 128 94 132 106 C136 120 134 134 127 144 L115 155 '
              'C108 160 92 160 85 155 L73 144 C66 134 64 120 68 106 Z')]
    cx, cy, rx, ry = 100, 80, 50, 48
    import math
    puffs = []
    for i in range(15):
        a = math.radians(-232 + i * (284 / 14))   # outer arc: from beside the left cheek round the back to the right cheek
        r = 14 if i not in (0, 14) else 11
        bump = 3 if i in (2, 3, 4) else 0           # a touch fuller on the left-back
        puffs.append(C(round(cx + (rx + bump) * math.cos(a), 1), round(cy + (ry + bump) * math.sin(a), 1), r))
    hair = [E(cx, cy, rx + 2, ry + 2), P('M50 88 C48 114 56 132 72 140 L84 110 Z'), P('M150 88 C152 114 144 132 128 140 L116 110 Z')] + puffs
    hs = [R(70, 160, 21, 17, 6, 16), R(129, 166, 21, 17, 6, -14)]
    lit = hg(s, 20, 140, ('#93664C', '#74503A'))
    body = [outline([SHOULDERS] + hair + face + hs),
            torso(s, ('#8C8A7A', '#77756A'), '#45443C'),
            part(s, hair, lit, '#3A241B', split=False, soft_from=70, soft_to=170),
            f'<g transform="translate(0 3)" fill="{INK}" opacity="0.22">{G(face)}</g>',
            skin(s, face, 86, 160, None, hl=92, mouth=(101, 141)),
            hands(hs)]
    svg('base-3.svg', 'BASE 3 "Afro" (round 4, adult): afro as a halo framing the head, face set into its front with a natural hairline, defined jaw, shoulders, soft shading.', s, '\n'.join(body))

for f in (base1, base3): f()
print('ok')
