# Round 6 props (lane E): writes the new and redone prop SVGs into art/props/ (and the mimic into art/enemies/).
# Same rendering as the round-4 props: one heavy ink outline from the #outline filter, light from the top left, soft
# gradients, tone instead of inner lines. Scale: 1 room unit = 2.545 SVG units; a 220 box (-10 -10 220 220) is 86.4
# room units, centred on (100,100). Everything here is seen from straight above (no front faces), so it is drawn
# upright on screen with the light staying top left.
#   python design/env-round6/make_props.py   (from the repo root)
import math, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUTLINE = ('<filter id="outline" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="6 2.5" result="a"/>'
           '<feMorphology in="SourceAlpha" operator="dilate" radius="2.5 6" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="c"/>'
           '<feMerge result="d"><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge><feFlood flood-color="#2B2230"/>'
           '<feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')


def svg(comment, defs, body, box=(-10, -10, 220, 220)):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box[0]} {box[1]} {box[2]} {box[3]}" width="{box[2]}" height="{box[3]}">\n'
            f'  <!-- {comment} -->\n  <defs>\n    {OUTLINE}\n    {defs}\n  </defs>\n{body}\n</svg>\n')


def lg(id_, a, b, x2=0.8, y2=1, stops=None):
    st = stops or [(0, a), (1, b)]
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="{x2}" y2="{y2}">' + ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in st) + '</linearGradient>'


def pts(p):
    return ' '.join(f'{x:.1f},{y:.1f}' for x, y in p)


def write(rel, text):
    path = os.path.join(ROOT, rel)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print('wrote', rel)


# ---------------------------------------------------------------- crate: one crate, two path cells (48 room units) square
def crate():
    o, i = 39, 48  # outer edge, top's edge (the sides slope out between, like the walls)
    O, I = 200 - o, 200 - i
    body = f'''  <g id="sprite" filter="url(#outline)">
    <rect x="{o}" y="{o}" width="{O - o}" height="{O - o}" rx="4" fill="#6E4424"/>
    <polygon points="{pts([(o, o), (O, o), (I, i), (i, i)])}" fill="#D29A5E"/>
    <polygon points="{pts([(o, o), (i, i), (i, I), (o, O)])}" fill="#B98049"/>
    <polygon points="{pts([(O, o), (O, O), (I, I), (I, i)])}" fill="#7E4F2B"/>
    <polygon points="{pts([(o, O), (i, I), (I, I), (O, O)])}" fill="#6A4122"/>
    <rect x="{i}" y="{i}" width="{I - i}" height="{I - i}" fill="url(#gTop)"/>
    <g clip-path="url(#topC)">
      <rect x="{i}" y="{i}" width="{I - i}" height="{I - i}" fill="none" stroke="#9A6436" stroke-width="26"/>
      <path d="M{i + 13} {i + 40} H{I - 13} M{i + 13} {i + 66} H{I - 13}" stroke="#8E5A30" stroke-width="3" opacity="0.55"/>
      <path d="M{i + 8} {I - 20} L{I - 20} {i + 8} L{I - 8} {i + 20} L{i + 20} {I - 8} Z" fill="url(#gBrace)"/>
      <rect x="{i}" y="{i}" width="{I - i}" height="{I - i}" fill="url(#shX)"/>
      <ellipse cx="{i + 30}" cy="{i + 14}" rx="22" ry="4" fill="#FFFFFF" opacity="0.25"/>
    </g>
    <g fill="#5A5458">{''.join(f'<path d="M{x} {y} h{dx * 22} v{dy * 7} h{-dx * 15} v{dy * 15} h{-dx * 7} Z"/>' for x, y, dx, dy in [(i, i, 1, 1), (I, i, -1, 1), (i, I, 1, -1), (I, I, -1, -1)])}</g>
    <g fill="#B8B2B8">{''.join(f'<circle cx="{x}" cy="{y}" r="2.2"/>' for x, y in [(i + 14, i + 4), (i + 4, i + 14), (I - 14, i + 4), (I - 4, i + 14), (i + 14, I - 4), (i + 4, I - 14), (I - 14, I - 4), (I - 4, I - 14)])}</g>
  </g>'''
    defs = (lg('gTop', '#E2AA6C', '#A86E3C') + lg('gBrace', '#C98A50', '#9A6234') +
            '<linearGradient id="shX" x1="96" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2B1A10" stop-opacity="0"/><stop offset="1" stop-color="#2B1A10" stop-opacity="0.22"/></linearGradient>'
            f'<clipPath id="topC"><rect x="{i}" y="{i}" width="{I - i}" height="{I - i}"/></clipPath>')
    write('art/props/crate.svg', svg('CRATE: one wooden crate seen from straight above, 48 room units square (two path cells, 122 SVG units). The sides slope out from the lid like the walls; a diagonal brace, iron corners. Drawn at its own size whatever the collider (sc 1).', defs, body))


# ---------------------------------------------------------------- barrel: from above, the lid inside the bulging staves
def barrel():
    R = 60  # 23.6 room units
    staves = ''.join(f'<path d="M100 100 L{100 + math.cos(a) * 70:.1f} {100 + math.sin(a) * 70:.1f}" />' for a in [k * math.tau / 16 + 0.1 for k in range(16)])
    body = f'''  <g id="sprite" filter="url(#outline)">
    <circle cx="100" cy="100" r="{R}" fill="url(#gStave)"/>
    <g clip-path="url(#outC)" stroke="#5E3C22" stroke-width="2.4" opacity="0.45">{staves}</g>
    <circle cx="100" cy="100" r="{R - 6}" fill="none" stroke="url(#gHoop)" stroke-width="7"/>
    <circle cx="100" cy="100" r="44" fill="#6E4424"/>
    <circle cx="100" cy="100" r="40" fill="url(#gLid)"/>
    <g clip-path="url(#lidC)"><path d="M60 80 H140 M60 100 H140 M60 120 H140" stroke="#8E5A30" stroke-width="3" opacity="0.5"/>
      <circle cx="104" cy="104" r="40" fill="none" stroke="#2B1A10" stroke-width="8" opacity="0.18"/></g>
    <circle cx="118" cy="112" r="6.5" fill="#4A2E1A"/><circle cx="117" cy="111" r="3.5" fill="#2B1A10"/>
    <path d="M58 78 A48 48 0 0 1 96 54" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.28"/>
  </g>'''
    defs = ('<radialGradient id="gStave" cx="0.38" cy="0.36" r="0.7"><stop offset="0" stop-color="#C99060"/><stop offset="1" stop-color="#7A5232"/></radialGradient>'
            + lg('gHoop', '#8C8790', '#4A454E') + lg('gLid', '#D9A066', '#A06A3A') +
            f'<clipPath id="outC"><circle cx="100" cy="100" r="{R}"/></clipPath><clipPath id="lidC"><circle cx="100" cy="100" r="40"/></clipPath>')
    write('art/props/barrel.svg', svg('BARREL seen from straight above: the planked lid and its bung inside the bulging staves and an iron hoop. 47 room units across (r 23.6); drawn at its own size (sc 1).', defs, body))


# ---------------------------------------------------------------- brazier: replaces the unclear broken pillar
def brazier():
    c = 58  # half the plinth
    oct_ = [(100 + c * math.cos(a), 100 + c * math.sin(a)) for a in [k * math.tau / 8 + math.tau / 16 for k in range(8)]]
    sq = [(100 - c, 100 - c + 14), (100 - c + 14, 100 - c), (100 + c - 14, 100 - c), (100 + c, 100 - c + 14), (100 + c, 100 + c - 14), (100 + c - 14, 100 + c), (100 - c + 14, 100 + c), (100 - c, 100 + c - 14)]
    flames = ''.join(f'<path d="M{100 + dx} {100 + dy} m-{s} 0 c0 -{s * 1.4} {s} -{s * 2.2} {s} -{s * 2.8} c0 {s * 0.6} {s} {s * 1.4} {s} {s * 2.8} a{s} {s} 0 0 1 -{s * 2} 0 Z" fill="{col}"/>'
                     for dx, dy, s, col in [(-14, 8, 11, '#FF8A3D'), (12, 12, 10, '#FF8A3D'), (0, -4, 13, '#FFB347'), (-4, 10, 7, '#FFE08A'), (10, 4, 6, '#FFE08A')])
    body = f'''  <g id="light">
    <circle cx="100" cy="100" r="96" fill="url(#gLight)"/>
  </g>
  <g id="sprite" filter="url(#outline)">
    <polygon points="{pts(sq)}" fill="url(#gStone)"/>
    <polygon points="{pts([(x + (100 - x) * 0.14, y + (100 - y) * 0.14) for x, y in sq])}" fill="url(#gStoneTop)"/>
    <g fill="#8C8174">{''.join(f'<circle cx="{100 + sx * 40}" cy="{100 + sy * 40}" r="4"/>' for sx in (-1, 1) for sy in (-1, 1))}</g>
    <circle cx="100" cy="100" r="44" fill="url(#gIron)"/>
    <circle cx="100" cy="100" r="35" fill="#2E2226"/>
    <g clip-path="url(#bowlC)">
      <circle cx="92" cy="104" r="11" fill="#5A2A1E"/><circle cx="112" cy="94" r="10" fill="#6A2E1E"/><circle cx="104" cy="114" r="9" fill="#4E241A"/><circle cx="86" cy="88" r="8" fill="#6A2E1E"/>
      <circle cx="100" cy="100" r="30" fill="url(#gCoal)"/>
      {flames}
    </g>
    <path d="M66 82 A36 36 0 0 1 90 60" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
  </g>'''
    defs = (lg('gStone', '#C2B8A8', '#857A6C') + lg('gStoneTop', '#D6CDBD', '#A0958A') + lg('gIron', '#7A7480', '#3E3944') +
            '<radialGradient id="gCoal" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFB347" stop-opacity="0.9"/><stop offset="0.6" stop-color="#E0603A" stop-opacity="0.45"/><stop offset="1" stop-color="#E0603A" stop-opacity="0"/></radialGradient>'
            '<radialGradient id="gLight" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFC27A" stop-opacity="0.38"/><stop offset="1" stop-color="#FFC27A" stop-opacity="0"/></radialGradient>'
            '<clipPath id="bowlC"><circle cx="100" cy="100" r="35"/></clipPath>')
    write('art/props/brazier.svg', svg('BRAZIER (replaces the broken pillar): a square stone plinth with cut corners and an iron fire bowl of coals and flames, seen from straight above; #light (no outline) is its glow on the floor. Collider r 30 (scale by r/30).', defs, body))


# ---------------------------------------------------------------- rocks, four styles, each at r 30 (76 SVG units)
def rocks():
    defs0 = ''
    # 1: a chunky boulder with flattened sides and a broad lit top (Carved)
    def smooth(P):  # a closed curve through the midpoints, the corners as control points: rounded but lumpy
        m = [((P[k][0] + P[(k + 1) % len(P)][0]) / 2, (P[k][1] + P[(k + 1) % len(P)][1]) / 2) for k in range(len(P))]
        return f'M{m[-1][0]:.1f} {m[-1][1]:.1f} ' + ' '.join(f'Q{P[k][0]} {P[k][1]} {m[k][0]:.1f} {m[k][1]:.1f}' for k in range(len(P))) + ' Z'
    sil = smooth([(38, 70), (84, 26), (142, 30), (180, 76), (172, 140), (120, 178), (60, 168), (26, 120)])
    topf = smooth([(62, 80), (92, 46), (136, 52), (156, 90), (128, 116), (78, 112)])
    body = f'''  <g id="sprite" filter="url(#outline)" stroke-linejoin="round">
    <path d="M150 140 C150 130 162 126 172 132 C180 138 178 152 168 156 C158 158 150 150 150 140 Z" fill="url(#gPeb)"/>
    <path d="{sil}" fill="url(#gBody)"/>
    <g clip-path="url(#bodyC)">
      <path d="{sil}" fill="#3A3138" opacity="0.28" transform="translate(18 20)"/>
      <path d="{topf}" fill="#3A3138" opacity="0.2" transform="translate(5 9)"/>
      <path d="{topf}" fill="url(#gTop)"/>
      <path d="M74 70 C82 60 92 54 104 52" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.45"/>
    </g>
  </g>'''
    defs = (lg('gBody', '#B4AB9F', '#7A7166') + lg('gTop', '#D8D0C4', '#B0A79A') + lg('gPeb', '#B2A99C', '#7C7368') +
            f'<clipPath id="bodyC"><path d="{sil}"/></clipPath>')
    write('art/props/rock-1.svg', svg('ROCK 1 (Carved): a rounded boulder with a broad lit top, a pebble beside it. r 30 room units; scale by r/30.', defs, body))
    # 2: a low-poly rock in flat tones (Flat)
    P = {'a': (46, 70), 'b': (78, 34), 'c': (128, 28), 'd': (168, 62), 'e': (174, 114), 'f': (146, 160), 'g': (94, 172), 'h': (50, 148), 'i': (32, 108),
         'm': (80, 62), 'n': (124, 56), 'o': (148, 88), 'p': (120, 118), 'q': (82, 108), 'r': (68, 84)}
    face = lambda ks, col: f'<polygon points="{pts([P[k] for k in ks])}" fill="{col}"/>'
    body = f'''  <g id="sprite" filter="url(#outline)">
    {face('abcdefghi', '#8E8579')}
    {face('abcnmr', '#C2BAAD')}{face('ar i'.replace(' ', ''), '#AFA699')}{face('cdon', '#A39A8E')}{face('deo', '#8A8176')}
    {face('efpo', '#776E64')}{face('fgqp', '#6C645B')}{face('ghiq', '#857C71')}{face('iraq'.replace('a', ''), '#958C80')}
    {face('mnopqr', '#D6CFC3')}
    <polygon points="{pts([(86, 68), (118, 63), (104, 76)])}" fill="#FFFFFF" opacity="0.35"/>
  </g>'''
    write('art/props/rock-2.svg', svg('ROCK 2 (Flat): a low-poly rock cut in flat facets, brightest on top, darkening towards the bottom right. r 30; scale by r/30.', '', body))
    # 3: a cluster of three dark stones (Torchlit)
    stones = [(64, 66, 30, -0.4), (138, 74, 36, 0.3), (96, 128, 50, 0.1)]
    parts = ''
    for k, (x, y, r, a) in enumerate(stones):
        parts += f'''  <g filter="url(#outline)">
    <ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * 0.86:.1f}" transform="rotate({a * 57:.0f} {x} {y})" fill="url(#gS)"/>
    <ellipse cx="{x - r * 0.18:.1f}" cy="{y - r * 0.2:.1f}" rx="{r * 0.62:.1f}" ry="{r * 0.46:.1f}" transform="rotate({a * 57:.0f} {x} {y})" fill="url(#gST)"/>
    <ellipse cx="{x - r * 0.35:.1f}" cy="{y - r * 0.42:.1f}" rx="{r * 0.28:.1f}" ry="{r * 0.09:.1f}" transform="rotate(-30 {x} {y})" fill="#FFFFFF" opacity="0.3"/>
  </g>\n'''
    defs = lg('gS', '#9A9088', '#5A524E') + lg('gST', '#B3AAA0', '#8A8079')
    write('art/props/rock-3.svg', svg('ROCK 3 (Torchlit): three stones heaped together, each with its own outline, the big one in front. r 30; scale by r/30.', defs, '  <g id="sprite">\n' + parts + '  </g>'))
    # 4: layered slab rock: stepped strata (Mosaic)
    def blobp(cx, cy, R, seed):
        p = []
        for k in range(9):
            ang = k / 9 * math.tau + seed
            r = R * (0.84 + 0.22 * ((math.sin(k * 7.3 + seed * 3) + 1) / 2))
            p.append((cx + math.cos(ang) * r, cy + math.sin(ang) * r * 0.9))
        return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in p) + ' Z'
    layers = [(blobp(102, 104, 74, 0.2), '#8A8074'), (blobp(94, 94, 52, 1.1), '#A89E91'), (blobp(88, 86, 30, 2.3), '#C8BFB2')]
    inner = ''
    for d, col in layers:
        inner += f'<path d="{d}" fill="#4E464A" stroke="#4E464A" stroke-width="10" opacity="0.35" transform="translate(7 9)"/><path d="{d}" fill="{col}" stroke="{col}" stroke-width="10"/>'
    body = f'''  <g id="sprite" filter="url(#outline)" stroke-linejoin="round">
    <path d="{layers[0][0]}" fill="{layers[0][1]}" stroke="{layers[0][1]}" stroke-width="10"/>
    <g clip-path="url(#l0)">{inner}
      <path d="M150 120 L168 112 M36 120 L52 126" stroke="#5E5458" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
      <ellipse cx="80" cy="72" rx="16" ry="4" transform="rotate(-18 80 72)" fill="#FFFFFF" opacity="0.35"/></g>
  </g>'''
    defs = f'<clipPath id="l0"><path d="{layers[0][0]}" stroke="#000" stroke-width="10"/></clipPath>'
    write('art/props/rock-4.svg', svg('ROCK 4 (Mosaic): a flat layered rock, three stepped strata rising to a lit top. r 30; scale by r/30.', defs, body))


# ---------------------------------------------------------------- pedestal, from straight above
def pedestal():
    o8 = lambda r, ph=math.tau / 16: [(100 + r * math.cos(k * math.tau / 8 + ph), 100 + r * math.sin(k * math.tau / 8 + ph)) for k in range(8)]
    body = f'''  <g id="sprite" filter="url(#outline)">
    <polygon points="{pts(o8(54))}" fill="url(#gBase)"/>
    <polygon points="{pts(o8(44))}" fill="url(#gTop)"/>
    <rect x="70" y="70" width="60" height="60" rx="12" fill="#5E3A86"/>
    <rect x="73" y="73" width="54" height="54" rx="10" fill="url(#gCush)"/>
    <rect x="76" y="76" width="48" height="48" rx="8" fill="none" stroke="#F2C14E" stroke-width="3"/>
    <g fill="#F2C14E">{''.join(f'<circle cx="{x}" cy="{y}" r="5"/>' for x in (72, 128) for y in (72, 128))}</g>
    <ellipse cx="90" cy="86" rx="12" ry="4" transform="rotate(-30 90 86)" fill="#FFFFFF" opacity="0.3"/>
    <path d="M60 70 A46 46 0 0 1 88 52" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.35"/>
  </g>'''
    defs = (lg('gBase', '#BFB3A0', '#857966') + lg('gTop', '#DED4C2', '#ADA08C') +
            '<radialGradient id="gCush" cx="0.38" cy="0.36" r="0.75"><stop offset="0" stop-color="#B693E8"/><stop offset="1" stop-color="#7448A8"/></radialGradient>')
    write('art/props/pedestal.svg', svg('PEDESTAL (the choice room\'s) seen from straight above: an octagonal stone plinth, a violet cushion with gold piping and tassels. The reward floats over its centre (100,100). 42 room units across. Not turned to the screen.', defs, body))


# ---------------------------------------------------------------- oil: a flat glossy spill, no ink outline (a liquid on the floor)
def oil():
    def lobe(cx, cy, rx, ry, n, ph, amp):
        p = []
        for k in range(48):
            a = k / 48 * math.tau
            r = 1 + amp * math.sin(a * n + ph) + amp * 0.5 * math.sin(a * (n + 2) + ph * 1.7)
            p.append((cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r))
        return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in p) + ' Z'
    outer = lobe(100, 102, 92, 66, 3, 0.6, 0.09)
    deep = lobe(98, 100, 70, 48, 3, 0.9, 0.08)
    body = f'''  <g id="sprite">
    <path d="{outer}" fill="#2A2124" opacity="0.55" filter="url(#soft)"/>
    <path d="{outer}" fill="url(#gRim)"/>
    <path d="{deep}" fill="url(#gDeep)"/>
    <path d="{deep}" fill="url(#gSheen)" opacity="0.2"/>
    <circle cx="18" cy="66" r="7" fill="#2E2528"/><circle cx="184" cy="146" r="6" fill="#2E2528"/><circle cx="170" cy="40" r="4.5" fill="#2E2528"/>
    <path d="M44 84 C58 62 84 50 112 50" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.55"/>
    <path d="M120 50 C128 50 134 52 138 54" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
    <ellipse cx="128" cy="128" rx="14" ry="4" transform="rotate(-20 128 128)" fill="#FFFFFF" opacity="0.22"/>
    <circle cx="16" cy="64" r="2" fill="#FFFFFF" opacity="0.5"/>
  </g>'''
    defs = ('<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>'
            '<radialGradient id="gRim" cx="0.45" cy="0.42" r="0.6"><stop offset="0.6" stop-color="#3B3034"/><stop offset="1" stop-color="#5C4A44"/></radialGradient>'
            '<radialGradient id="gDeep" cx="0.42" cy="0.38" r="0.7"><stop offset="0" stop-color="#2A2226"/><stop offset="1" stop-color="#151014"/></radialGradient>'
            '<linearGradient id="gSheen" x1="0" y1="0.2" x2="1" y2="0.8"><stop offset="0.2" stop-color="#8E6CC8" stop-opacity="0"/><stop offset="0.38" stop-color="#8E6CC8"/>'
            '<stop offset="0.5" stop-color="#4FB8A8"/><stop offset="0.62" stop-color="#E0B050"/><stop offset="0.8" stop-color="#E0B050" stop-opacity="0"/></linearGradient>')
    write('art/props/hazard-oil.svg', svg('OIL: a flat glossy spill on the floor: no ink outline (a liquid, not a thing), a soft dark edge, a lighter shallow rim, a deep middle with a rainbow sheen, wet highlights, a few drops. Drawn at r 38 across, 26 front to back; scale by r/38.', defs, body))


# ---------------------------------------------------------------- chest, open and empty: the lid thrown back, its inside showing
def chest_open():
    body = '''  <g id="sprite" filter="url(#outline)">
    <!-- the lid, thrown back past upright: we see its planked inside, the gold bands round its edge and the hasp hanging from its far edge -->
    <path d="M40 46 V20 A14 14 0 0 1 54 6 H146 A14 14 0 0 1 160 20 V46 Z" fill="url(#gLidIn)"/>
    <g clip-path="url(#lidC)">
      <path d="M40 18 H160 M40 32 H160" stroke="#3E2414" stroke-width="2.5" opacity="0.45"/>
      <rect x="36" y="4" width="130" height="8" fill="url(#gBand)"/>
      <rect x="56" y="4" width="12" height="44" fill="url(#gBand)" opacity="0.85"/><rect x="132" y="4" width="12" height="44" fill="url(#gBand)" opacity="0.85"/>
      <rect x="36" y="38" width="130" height="10" fill="#2B1A10" opacity="0.3"/>
    </g>
    <path d="M88 4 H112 V-4 C112 -9 106 -12 100 -12 C94 -12 88 -9 88 -4 Z" fill="url(#gBrass)"/>
    <!-- the box: its front below, its rim all round, and inside it empty -->
    <use href="#front" fill="url(#gWoodDk)"/>
    <g clip-path="url(#frontC)"><rect x="56" y="20" width="12" height="150" fill="url(#gBand)"/><rect x="132" y="20" width="12" height="150" fill="url(#gBand)"/><rect x="36" y="108" width="130" height="52" fill="url(#shX)"/></g>
    <path d="M40 44 H160 V112 H40 Z" fill="url(#gRim)"/>
    <rect x="56" y="44" width="12" height="68" fill="url(#gBand)"/><rect x="132" y="44" width="12" height="68" fill="url(#gBand)"/>
    <use href="#cav" fill="url(#gCav)"/>
    <g clip-path="url(#cavC)">
      <rect x="52" y="56" width="96" height="14" fill="#1E120C" opacity="0.45"/>
      <path d="M52 80 H148 M52 94 H148" stroke="#2B1A10" stroke-width="2.5" opacity="0.4"/>
      <rect x="132" y="56" width="16" height="50" fill="#1E120C" opacity="0.25"/>
    </g>
    <path d="M40 45 H160" stroke="#2B1A10" stroke-width="5" opacity="0.5"/>
    <rect x="72" y="38" width="14" height="14" rx="3" fill="#5A5458"/><rect x="114" y="38" width="14" height="14" rx="3" fill="#5A5458"/>
    <rect x="74" y="40" width="10" height="3" rx="1.5" fill="#B8B2B8" opacity="0.7"/><rect x="116" y="40" width="10" height="3" rx="1.5" fill="#B8B2B8" opacity="0.7"/>
  </g>'''
    defs = (lg('gWoodDk', '#8E5A30', '#6E4222', 0, 1) + lg('gBand', '#FAD06A', '#D9952A', 1, 0) + lg('gBrass', '#FFE38A', '#E0A82A', 0.7, 1) +
            lg('gLidIn', '#4E2E18', '#74462A', 0, 1) + lg('gRim', '#C98A50', '#9A6234', 0.3, 1) +
            '<linearGradient id="gCav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E1A10"/><stop offset="1" stop-color="#5A341E"/></linearGradient>'
            '<linearGradient id="shX" x1="96" y1="0" x2="170" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2B1A10" stop-opacity="0"/><stop offset="1" stop-color="#2B1A10" stop-opacity="0.32"/></linearGradient>'
            '<path id="front" d="M44 108 H156 V148 A10 10 0 0 1 146 158 H54 A10 10 0 0 1 44 148 Z"/><clipPath id="frontC"><use href="#front"/></clipPath>'
            '<path id="cav" d="M54 56 H146 V104 A4 4 0 0 1 142 108 H58 A4 4 0 0 1 54 104 Z"/><clipPath id="cavC"><use href="#cav"/></clipPath>'
            '<clipPath id="lidC"><path d="M40 46 V20 A14 14 0 0 1 54 6 H146 A14 14 0 0 1 160 20 V46 Z"/></clipPath>')
    write('art/props/chest-open.svg', svg('CHEST, open and empty (the coins spill out round it): the lid thrown back behind the box showing its planked inside, the gold bands round its edge and the hasp hanging off its far edge; the box empty and dark inside. #glow (no outline) is a brief warm light the game fades. 48 room units wide. Stays upright on screen.', defs,
                                   body + '''
  <g id="glow">
    <ellipse cx="100" cy="82" rx="70" ry="44" fill="url(#gGlow)" opacity="0.6"/>
  </g>'''.replace('url(#gGlow)', 'url(#gGlow)')).replace('</defs>', '<radialGradient id="gGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF4C8" stop-opacity="0.8"/><stop offset="1" stop-color="#FFD45A" stop-opacity="0"/></radialGradient>\n  </defs>'))


# ---------------------------------------------------------------- the used fountain: drained, a puddle left, dead leaves
def fountain_used():
    src = open(os.path.join(ROOT, 'art/props/fountain.svg'), encoding='utf-8').read()
    rim = src[src.index('<path d="M196 100'):]
    rim = rim[:rim.index('/>') + 2]
    leaves = ''.join(f'<path d="M0 -9 C6 -5 6 5 0 9 C-6 5 -6 -5 0 -9 Z" transform="translate({x} {y}) rotate({a})" fill="{c}"/>'
                     for x, y, a, c in [(68, 120, 30, '#9A7A3E'), (130, 70, -40, '#B08A44'), (138, 132, 80, '#8E6A34')])
    body = f'''  <g id="sprite" filter="url(#outline)">
    {rim}
    <path d="M30 70 A76 76 0 0 1 130 26" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity="0.3"/>
    <circle cx="100" cy="100" r="76" fill="#6E6254"/>
    <circle cx="100" cy="100" r="72" fill="url(#gDry)"/>
    <g clip-path="url(#basinC)">
      <circle cx="108" cy="110" r="72" fill="none" stroke="#2B2230" stroke-width="16" opacity="0.2"/>
      <circle cx="100" cy="100" r="64" fill="none" stroke="#5E5A52" stroke-width="3" opacity="0.35"/>
      <path d="M100 126 C92 138 98 150 112 160" fill="none" stroke="#5E6A60" stroke-width="7" stroke-linecap="round" opacity="0.35"/>
      <path d="M86 140 C78 150 76 166 92 170 C110 174 132 166 134 154 C136 142 120 138 108 142 C98 132 92 134 86 140 Z" fill="url(#gPuddle)"/>
      <ellipse cx="98" cy="150" rx="9" ry="3" transform="rotate(-12 98 150)" fill="#FFFFFF" opacity="0.35"/>
      <g fill="#6E8A4E" opacity="0.8"><circle cx="40" cy="96" r="7"/><circle cx="46" cy="108" r="6"/><circle cx="152" cy="62" r="6"/><circle cx="160" cy="74" r="5"/></g>
      {leaves}
    </g>
    <circle cx="104" cy="106" r="27" fill="#2B2230" opacity="0.22"/>
    <circle cx="100" cy="100" r="26" fill="url(#gPed)"/>
    <circle cx="100" cy="100" r="15" fill="#6E6458"/>
    <circle cx="100" cy="100" r="9" fill="#4A423C"/>
    <path d="M92 92 A12 12 0 0 1 104 88" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.35"/>
  </g>'''
    defs = (lg('gRim', '#CFC3B0', '#8C7F6E') + lg('gPed', '#DCD1BF', '#9A8C78') +
            '<radialGradient id="gDry" cx="0.4" cy="0.36" r="0.75"><stop offset="0" stop-color="#B3AA9C"/><stop offset="1" stop-color="#857B6E"/></radialGradient>'
            '<radialGradient id="gPuddle" cx="0.4" cy="0.4" r="0.7"><stop offset="0" stop-color="#7FB2C4"/><stop offset="1" stop-color="#4E7F92"/></radialGradient>'
            '<clipPath id="basinC"><circle cx="100" cy="100" r="72"/></clipPath>')
    write('art/props/fountain-used.svg', svg('FOUNTAIN, used: the same basin drunk dry: bare stone with a water line round it, a last puddle in the low side, a damp trail from the dry spout, moss and a few dead leaves. Radius 38 room units.', defs, body))


# ---------------------------------------------------------------- the boss door: iron leaves with bone studs and spikes
def boss_door():
    s = open(os.path.join(ROOT, 'design/env-round6/src/door-open-boss-r4.svg'), encoding='utf-8').read()  # the round-4 door, as it was
    a = s.index('<path d="M-8 100 V44 C-8 30 -4 20 2 12 L30 24 V100 Z" fill="url(#gLeaf)"/>')
    b = s.index('<circle cx="70" cy="30"')
    leaves = ('<path d="M-8 100 V44 C-8 30 -4 20 2 12 L32 22 V100 Z" fill="url(#gIronLeaf)"/><path d="M208 100 V44 C208 30 204 20 198 12 L168 22 V100 Z" fill="url(#gIronLeafR)"/>'
              '<path d="M32 22 V100 H24 V24 Z M168 22 V100 H176 V24 Z" fill="#7A2030" opacity="0.8"/>'
              + ''.join(f'<path d="M32 {y} l12 5 l-12 5 Z M168 {y} l-12 5 l12 5 Z" fill="#CFC6B4"/>' for y in (30, 50, 70, 88))
              + ''.join(f'<circle cx="{x}" cy="{y}" r="4.2" fill="#E8DFC8"/><circle cx="{x - 1}" cy="{y - 1}" r="1.6" fill="#FFFFFF" opacity="0.6"/>' for x in (6, 18, 182, 194) for y in (40, 62, 84))
              + '<path d="M0 30 L28 30 M172 30 L200 30" stroke="#2B2230" stroke-width="3" opacity="0.4"/>')
    s = s[:a] + leaves + s[b:]
    s = s.replace('<linearGradient id="gLeaf"', '<linearGradient id="gIronLeaf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6A6470"/><stop offset="1" stop-color="#3A3540"/></linearGradient>'
                  '<linearGradient id="gIronLeafR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#5A5460"/><stop offset="1" stop-color="#2E2A33"/></linearGradient><linearGradient id="gLeaf"')
    s = s.replace('the light spills onto the floor.', 'the light spills onto the floor. Round 6: the leaves are the boss door\'s own: dark iron with bone studs, bone spikes along their inner edges and a red-hot seam.')
    write('art/props/door-open-boss.svg', s)


# ---------------------------------------------------------------- the mimic: the round-3 mimic, made of the game's chest
def mimic():
    s = open(os.path.join(ROOT, 'design/class-round3/enemies/mimic.svg'), encoding='utf-8').read()
    # the chest's own wood, bands and brass lock plate (chest-closed.svg), so a mimic is a chest until it bites
    s = s.replace('<linearGradient id="gWood" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#C98A50"/><stop offset="1" stop-color="#9A6234"/></linearGradient>',
                  '<linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A86E3C"/><stop offset="0.38" stop-color="#D99E60"/><stop offset="1" stop-color="#8E5A30"/></linearGradient>'
                  '<linearGradient id="gBrass" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset="1" stop-color="#E0A82A"/></linearGradient>')
    s = s.replace('<path id="lid" d="M52 36 H148 A14 14 0 0 1 162 50 V124 A8 8 0 0 1 154 132 H46 A8 8 0 0 1 38 124 V50 A14 14 0 0 1 52 36 Z"/>',
                  '<path id="lid" d="M56 36 H144 A18 18 0 0 1 162 54 V124 A8 8 0 0 1 154 132 H46 A8 8 0 0 1 38 124 V54 A18 18 0 0 1 56 36 Z"/>')
    s = s.replace('<path d="M38 62 H162 M38 88 H162 M38 112 H162" stroke="#8E5A30" stroke-width="3" opacity="0.6"/>',
                  '<path d="M38 62 H162 M38 88 H162" stroke="#8E5A30" stroke-width="3" opacity="0.4"/>')
    s = s.replace('<rect x="86" y="114" width="28" height="20" rx="4" fill="#D9952A"/>\n        <path d="M100 119 A4 4 0 0 1 102.5 126 L104 131 H96 L97.5 126 A4 4 0 0 1 100 119 Z" fill="#5A3A1E"/>', '')
    s = s.replace('<ellipse cx="66" cy="48" rx="20" ry="6" fill="#FFFFFF" opacity="0.25"/>\n      </g>',
                  '<ellipse cx="78" cy="68" rx="26" ry="5" fill="#FFFFFF" opacity="0.28"/>\n      </g>\n      '
                  '<path d="M84 112 H116 V126 C116 132 108 138 100 140 C92 138 84 132 84 126 Z" fill="url(#gBrass)"/><rect x="84" y="112" width="32" height="5" rx="2.5" fill="#FFF3C4" opacity="0.6"/>'
                  '<path d="M100 118 A4 4 0 0 1 102.5 125 L104 132 H96 L97.5 125 A4 4 0 0 1 100 118 Z" fill="#5A3A1E"/>')
    s = s.replace('MIMIC (round 3 enemy, MY OWN IDEA)', 'MIMIC (round 3 mimic, back by request; round 6: made of the game\'s chest, chest-closed.svg: the same domed lid, wood, gold bands and brass lock plate)')
    write('art/enemies/mimic.svg', s)


if __name__ == '__main__':
    crate(); barrel(); brazier(); rocks(); pedestal(); oil(); chest_open(); fountain_used(); boss_door(); mimic()
