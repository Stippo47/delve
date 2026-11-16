"""build.py -> base-1..4.svg  (base human: head + face + hair + hands, no props)
Facing = DOWN (+y). Rotate whole sprite around (100,100). viewBox -10 -10 220 220."""
import math, os
OUT = os.path.dirname(os.path.abspath(__file__))
INK = '#2B2230'

class S:
    def __init__(s): s.defs = []; s.n = 0
    def id(s, p='g'): s.n += 1; return f'{p}{s.n}'
    def vgrad(s, y0, y1, *stops):
        i = s.id('g')
        st = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
        s.defs.append(f'<linearGradient id="{i}" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">{st}</linearGradient>')
        return i
    def clip(s, inner):
        i = s.id('c'); s.defs.append(f'<clipPath id="{i}">{inner}</clipPath>'); return i

def el(kind, **a):
    return (kind, a)
def render(e, **extra):
    k, a = e; a = {**a, **extra}
    return f'<{k} ' + ' '.join(f'{x.replace("_","-")}="{v}"' for x, v in a.items()) + '/>'
def P(d): return el('path', d=d)
def C(x, y, r): return el('circle', cx=x, cy=y, r=r)
def E(x, y, rx, ry): return el('ellipse', cx=x, cy=y, rx=rx, ry=ry)
def R(cx, cy, w, h, rx=8, rot=0):
    return el('rect', x=cx - w / 2, y=cy - h / 2, width=w, height=h, rx=rx, transform=f'rotate({rot} {cx} {cy})')

SHADE_R = '<rect x="100" y="-20" width="140" height="260"/>'

def part(s, prims, lit, shade, shadow=0.3, dy=3, shadow_on=None):
    """split-shaded part: lit left, darker right of x=100, hard seam. Optional contact shadow."""
    o = []
    g = ''.join(render(p) for p in prims)
    if shadow:
        if shadow_on:  # clip the cast shadow onto what lies beneath
            o.append(f'<g clip-path="url(#{shadow_on})"><g transform="translate(0 {dy})" fill="{INK}" opacity="{shadow}">{g}</g></g>')
        else:
            o.append(f'<g transform="translate(0 {dy})" fill="{INK}" opacity="{shadow}">{g}</g>')
    o.append(f'<g fill="url(#{lit})">{g}</g>')
    c = s.clip(g)
    o.append(f'<g clip-path="url(#{c})"><g fill="url(#{shade})">{SHADE_R}</g></g>')
    return '\n'.join(o)

def hands(s, hs, shadow=0.3):
    o = []
    for h in hs:
        o.append(f'<g transform="translate(0 2.5)">' + render(h, fill=INK, opacity=shadow) + '</g>')
    for h in hs:
        o.append(render(h, fill='url(#gHand)'))
    return '\n'.join(o)

HAND_DEF = ('<radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75">'
            '<stop offset="0" stop-color="#F8D4B2"/><stop offset="1" stop-color="#DFA57F"/></radialGradient>')

def skin(s, prims, y0, y1, hair_prims, hair_dy=4, mouth=None, ear=False, hl=None):
    """skin with back-to-front gradient, right-half warm shade, hair contact shadow, tiny mouth."""
    g = ''.join(render(p) for p in prims)
    if ear:
        grad = s.vgrad(y0, y1, (0, '#E9B48C'), (1, '#D9A07A'))
    else:
        if hl is not None:  # darken toward the hairline like the archer's face under the brim
            grad = s.vgrad(hl - 4, y1, (0, '#BC876C'), (0.3, '#E2AF8A'), (0.55, '#F2C7A0'), (1, '#F6D0AC'))
        else:
            grad = s.vgrad(y0, y1, (0, '#C98E6C'), (0.3, '#E6B48E'), (0.62, '#F2C7A0'), (1, '#F6D0AC'))
    c = s.clip(g)
    o = [f'<g fill="url(#{grad})">{g}</g>',
         f'<g clip-path="url(#{c})"><path d="M100 -20 H240 V240 H100 Z" fill="#8A4E36" opacity="0.15"/>']
    if hair_prims:
        hg = ''.join(render(p) for p in hair_prims)
        o.append(f'<g transform="translate(0 {hair_dy})" fill="#7A3E2A" opacity="0.3">{hg}</g>')
    o.append('</g>')
    if mouth:
        x, y = mouth
        o.append(f'<path d="M{x-3} {y} Q{x} {y+2.5} {x+3} {y}" fill="none" stroke="#C98868" stroke-width="2.5" stroke-linecap="round"/>')
    return '\n'.join(o)

def outline(prims_list):
    g = ''.join(render(p) for p in prims_list)
    return f'<g fill="{INK}" stroke="{INK}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">{g}</g>'

def svg(name, comment, s, body, k=1.0):
    body = (f'<g transform="translate(100 100) scale({k}) translate(-100 -100)">\n'
            + body.replace('stroke-width="12"', f'stroke-width="{12/k:.2f}"') + '\n</g>')
    d = '\n    '.join([HAND_DEF] + s.defs)
    t = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">
  <!-- {comment} Facing = DOWN (+y). Rotate whole sprite around (100,100). -->
  <defs>
    {d}
  </defs>
{body}
</svg>
'''
    open(os.path.join(OUT, name), 'w').write(t)

def hair_grads(s, y0, y1, lit, shade):
    return s.vgrad(y0, y1, (0, lit[0]), (1, lit[1])), s.vgrad(y0, y1, (0, shade[0]), (1, shade[1]))

# ---------------------------------------------------------------------------------------------
# BASE 1 "Bowl": round head, heavy helmet-like bowl cut with a 3-lobe fringe, ears poking out
#   below the bowl's rim, small fists tucked at the front corners (close, like holding a hilt).
def base1():
    s = S()
    head = [C(100, 98, 68)]
    ears = [E(33, 122, 12, 15), E(167, 122, 12, 15)]
    hair = [P('M26 116 C18 52 56 18 100 18 C144 18 182 52 174 116 '
              'C166 120 156 118 148 112 C140 122 128 122 120 114 C112 124 88 124 80 114 '
              'C72 122 60 122 52 112 C44 118 34 120 26 116 Z')]
    hs = [R(58, 172, 25, 22, 8, 18), R(142, 172, 25, 22, 8, -18)]
    lit, sh = hair_grads(s, 18, 124, ('#6A6282', '#4F4866'), ('#4A4360', '#363049'))
    headclip = s.clip(''.join(render(p) for p in head + ears))
    body = [outline(ears + head + hair + hs),
            skin(s, ears, 105, 140, None, ear=True),
            skin(s, head, 30, 166, hair, mouth=(100, 152), hl=112),
            part(s, hair, lit, sh, shadow=0),
            # one big swept lock tone on the bowl (shape, not a line)
            f'<g clip-path="url(#{s.clip(render(hair[0]))})"><path d="M100 18 C86 44 84 80 100 116 C92 84 92 50 100 18 Z" fill="#2E2940" opacity="0.35"/></g>',
            hands(s, hs)]
    svg('base-1.svg', 'BASE 1 "Bowl": round head, bowl cut with 3-lobe fringe, ears below the rim, fists at front corners.', s, '\n'.join(body), k=1.1)

# BASE 2 "Long": long egg head (longer than wide), slicked-back blond hair with a soft widow's peak and a
#   long ponytail that falls off the back and drapes over the right shoulder; BIG ears out to the sides;
#   open hands held wide at the flanks.
def base2():
    s = S()
    head = [E(100, 98, 52, 70)]
    ears = [E(47, 118, 15, 20), E(153, 118, 15, 20)]
    tail = [P('M90 34 C92 16 116 6 138 10 C162 14 178 34 176 64 C168 50 154 38 136 34 C120 31 110 36 106 42 Z')]
    hair = [P('M46 116 C36 60 64 24 100 24 C136 24 164 60 154 116 '
              'C148 110 132 108 120 114 C112 116 106 120 100 126 C94 120 88 116 80 114 C68 108 52 110 46 116 Z')]
    hs = [R(30, 152, 22, 28, 9, 10), R(170, 152, 22, 28, 9, -10)]
    lit, sh = hair_grads(s, 24, 126, ('#F3D47A', '#DDAF4C'), ('#CC9A3E', '#AC7C2C'))
    tl, ts = hair_grads(s, 6, 64, ('#E6BE5C', '#CDA044'), ('#BE8C36', '#9E7028'))
    body = [outline(ears + tail + head + hair + hs),
            part(s, tail, tl, ts, shadow=0),
            skin(s, ears, 98, 138, None, ear=True),
            skin(s, head, 28, 168, hair, mouth=(100, 156), hl=112),
            part(s, hair, lit, sh, shadow=0),
            hands(s, hs)]
    svg('base-2.svg', 'BASE 2 "Long": long egg head, slicked-back hair, soft widow\'s peak, ponytail draped over the right shoulder, big ears, open hands wide at flanks.', s, '\n'.join(body), k=1.08)

# BASE 3 "Cloud": huge round curly cloud of hair (union of puffs) that swallows the head; the face is a
#   small low oval tucked under the front puffs; no ears; hands held together just under the chin.
def base3():
    s = S()
    face = [E(100, 140, 42, 32)]
    puffs = [(100, 26, 27), (66, 33, 26), (134, 33, 26), (40, 56, 26), (160, 56, 26),
             (27, 88, 25), (173, 88, 25), (32, 120, 22), (168, 120, 22), (50, 144, 16), (150, 144, 16),
             (76, 116, 19), (100, 112, 20), (124, 116, 19)]
    hair = [E(100, 80, 66, 56)] + [C(*p) for p in puffs]
    hs = [R(84, 182, 24, 22, 8, 22), R(116, 182, 24, 22, 8, -22)]
    lit, sh = hair_grads(s, 0, 160, ('#93664C', '#77503B'), ('#62402F', '#4C3124'))
    hc = s.clip(''.join(render(p) for p in hair))
    body = [outline(face + hair + hs),
            skin(s, face, 108, 172, hair, mouth=(100, 160), hl=128),
            part(s, hair, lit, sh, shadow=0),
            hands(s, hs)]
    svg('base-3.svg', 'BASE 3 "Cloud": huge curly hair cloud, small low face tucked under the front puffs, hands together under the chin.', s, '\n'.join(body), k=1.04)

# BASE 4 "Jaw": wide-jawed pear head (narrow crown, broad cheeks), short tufty crop that sticks up at the
#   back with a fringe swooping forward-left; large open face; small round ears; both big mitts gripping
#   off to the front-right (a two-hander grip).
def base4():
    s = S()
    head = [P('M100 32 C136 32 156 46 164 72 C172 98 178 126 170 146 C160 166 132 168 100 168 '
              'C68 168 40 166 30 146 C22 126 28 98 36 72 C44 46 64 32 100 32 Z')]
    ears = [C(31, 104, 11), C(169, 104, 11)]
    hair = [P('M30 100 C24 64 40 40 58 32 Q60 22 66 14 Q74 24 82 28 Q90 18 100 8 Q110 18 118 28 '
              'Q126 24 134 14 Q140 22 142 32 C160 40 176 62 172 92 '
              'C160 88 146 88 134 92 C118 98 104 104 92 114 C80 124 62 132 48 130 C38 128 32 116 30 100 Z')]
    hs = [R(140, 180, 27, 24, 9, -14), R(170, 156, 27, 24, 9, -36)]
    lit, sh = hair_grads(s, 8, 132, ('#EC8C50', '#D06A34'), ('#B4562A', '#93421F'))
    body = [outline(ears + head + hair + hs),
            skin(s, ears, 96, 120, None, ear=True),
            skin(s, head, 34, 168, hair, mouth=(104, 154)),
            part(s, hair, lit, sh, shadow=0),
            hands(s, hs)]
    svg('base-4.svg', 'BASE 4 "Jaw": wide-jawed pear head, tufty crop with forward-left swoop fringe, open face, small ears, two-hander grip front-right.', s, '\n'.join(body), k=1.08)

for f in (base1, base2, base3, base4): f()
print('ok')
