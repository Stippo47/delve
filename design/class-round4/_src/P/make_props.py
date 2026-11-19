"""Round 4 props (section P): writes every prop SVG into ../../props/.

Scale: the same as the hero sprites, so the same outline filter gives the same outline thickness.
The archer's head (radius 22 room units) is 56 SVG units, so 1 room unit = 56/22 = 2.545 SVG units.
A 220-unit box ("-10 -10 220 220") is 86.4 room units across; the door uses a 360 box (141.4 room units).
Light from the top left, soft gradients, no inner lines (tone only), one heavy outline from the filter.

python make_props.py
"""
import math, pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = (HERE / ".." / ".." / "props").resolve()
OUT.mkdir(parents=True, exist_ok=True)

S = 56 / 22  # SVG units per room unit
INK = "#2B2230"
FILTER = ('<filter id="outline" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="6 2.5" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="2.5 6" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="c"/><feMerge result="d"><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge><feFlood flood-color="#2B2230"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def lg(id_, stops, x1=0, y1=0, x2=0.6, y2=1, user=False):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a}"' if a is not None else "") + "/>"
                for o, c, a in [(st + (None,))[:3] for st in stops])
    u = ' gradientUnits="userSpaceOnUse"' if user else ""
    return f'<linearGradient id="{id_}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"{u}>{s}</linearGradient>'


def rg(id_, stops, cx=0.5, cy=0.5, r=0.5, fx=None, fy=None, user=False):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a}"' if a is not None else "") + "/>"
                for o, c, a in [(st + (None,))[:3] for st in stops])
    u = ' gradientUnits="userSpaceOnUse"' if user else ""
    fxy = (f' fx="{fx}" fy="{fy}"' if fx is not None else "")
    return f'<radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}"{fxy}{u}>{s}</radialGradient>'


def smooth(pts):
    """Closed path through the midpoints of pts, bending at each point: a soft, slightly faceted shape."""
    n = len(pts)
    mid = lambda a, b: ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    m0 = mid(pts[-1], pts[0])
    d = f"M{f(m0[0])} {f(m0[1])}"
    for i in range(n):
        p, q = pts[i], pts[(i + 1) % n]
        m = mid(p, q)
        d += f" Q{f(p[0])} {f(p[1])} {f(m[0])} {f(m[1])}"
    return d + " Z"


def ring_pts(cx, cy, radii, start=0.0, sy=1.0):
    n = len(radii)
    return [(cx + math.cos(start + i / n * math.tau) * r, cy + math.sin(start + i / n * math.tau) * r * sy)
            for i, r in enumerate(radii)]


def rrect(x, y, w, h, r):
    return f'M{f(x + r)} {f(y)} H{f(x + w - r)} A{f(r)} {f(r)} 0 0 1 {f(x + w)} {f(y + r)} V{f(y + h - r)} A{f(r)} {f(r)} 0 0 1 {f(x + w - r)} {f(y + h)} H{f(x + r)} A{f(r)} {f(r)} 0 0 1 {f(x)} {f(y + h - r)} V{f(y + r)} A{f(r)} {f(r)} 0 0 1 {f(x + r)} {f(y)} Z'


def svg(name, comment, defs, body, box=(-10, -10, 220, 220)):
    vb = " ".join(f(v) for v in box)
    txt = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{f(box[2])}" height="{f(box[3])}">\n'
           f'  <!-- {comment} -->\n  <defs>\n    {FILTER}\n    ' + "\n    ".join(defs) + "\n  </defs>\n" + body + "\n</svg>\n")
    (OUT / name).write_text(txt, encoding="utf-8")
    print("wrote", name)


SHADE_R = lg("shX", [(0, "#2B1A10", 0), (1, "#2B1A10", 0.32)], x1=96, y1=0, x2=170, y2=0, user=True)

# ------------------------------------------------------------------ obstacles (round colliders, drawn at r 30)

def rock():
    # a low-poly boulder: three facets (lit top, side, dark underside) sharing corners, with soft rounded joins
    V = [(40, 70), (70, 30), (124, 24), (168, 56), (178, 108), (150, 160), (96, 176), (44, 150), (26, 108)]
    C = (92, 82)   # the top facet's peak, nearer the light
    outline = "M" + " L".join(f"{x} {y}" for x, y in V) + " Z"
    top = f"M{V[0][0]} {V[0][1]} L{V[1][0]} {V[1][1]} L{V[2][0]} {V[2][1]} L{V[3][0]} {V[3][1]} L136 92 L{C[0]} {C[1] + 22} L58 104 Z"
    right = f"M{V[3][0]} {V[3][1]} L{V[4][0]} {V[4][1]} L{V[5][0]} {V[5][1]} L120 136 L136 92 Z"
    low = f"M{V[5][0]} {V[5][1]} L{V[6][0]} {V[6][1]} L{V[7][0]} {V[7][1]} L58 104 L{C[0]} {C[1] + 22} L136 92 L120 136 Z"
    left = f"M{V[7][0]} {V[7][1]} L{V[8][0]} {V[8][1]} L{V[0][0]} {V[0][1]} L58 104 Z"
    peb = "M14 160 L30 146 L50 154 L50 172 L30 180 L14 172 Z"
    peb2 = "M2 128 L14 118 L28 124 L26 138 L10 142 Z"
    defs = [lg("gRock", [(0, "#BDB2A1"), (1, "#8A7E70")], x2=0.8, y2=1),
            lg("gTop", [(0, "#DCD3C4"), (1, "#B7AC9B")], x2=0.8, y2=1),
            lg("gLow", [(0, "#8C8072"), (1, "#6A5F54")], x2=0.6, y2=1),
            lg("gPeb", [(0, "#B5AA99"), (1, "#7E7266")], x2=0.8, y2=1)]
    j = 'stroke-linejoin="round"'
    b = f"""  <g id="sprite" filter="url(#outline)">
    <path d="{peb2}" fill="url(#gPeb)" stroke="url(#gPeb)" stroke-width="8" {j}/>
    <path d="{peb}" fill="url(#gPeb)" stroke="url(#gPeb)" stroke-width="8" {j}/>
    <path d="{outline}" fill="url(#gRock)" stroke="url(#gRock)" stroke-width="16" {j}/>
    <path d="{left}" fill="#A79B8B" stroke="#A79B8B" stroke-width="2" {j}/>
    <path d="{right}" fill="#857969" stroke="#857969" stroke-width="2" {j}/>
    <path d="{low}" fill="url(#gLow)" stroke="#776B5E" stroke-width="2" {j}/>
    <path d="{top}" fill="url(#gTop)" stroke="#C9BFAE" stroke-width="2" {j}/>
    <path d="M70 46 L104 36 L84 58 Z" fill="#FFFFFF" opacity="0.35" stroke="#FFFFFF" stroke-width="6" stroke-opacity="0.35" {j}/>
    <path d="M18 158 L30 150 L40 156 Z" fill="#FFFFFF" opacity="0.3"/>
  </g>"""
    svg("obstacle-rock.svg", "ROCK: a round obstacle (boulder) seen from above, a chunky low-poly stone with a lit top "
        "facet, a side facet and a dark underside, two pebbles. Drawn at radius 30 room units (76 SVG units). Scale it "
        "by r/30. Light from the top left; the game draws the ground shadow.", defs, b)


def flute_circle(cx, cy, r, n, amp):
    d = ""
    for i in range(n):
        a0 = i / n * math.tau
        a1 = (i + 1) / n * math.tau
        am = (a0 + a1) / 2
        p0 = (cx + math.cos(a0) * r, cy + math.sin(a0) * r)
        p1 = (cx + math.cos(a1) * r, cy + math.sin(a1) * r)
        c = (cx + math.cos(am) * (r + amp), cy + math.sin(am) * (r + amp))
        d += (f"M{f(p0[0])} {f(p0[1])}" if i == 0 else "") + f" Q{f(c[0])} {f(c[1])} {f(p1[0])} {f(p1[1])}"
    return d + " Z"


def pillar():
    # a fluted column on a square plinth, seen from above; its top is snapped off (a high jagged stub on the lit
    # side, the broken lower face darker) and a fallen drum of it lies across the plinth's front corner
    cx, cy, R = 88, 86, 50
    col = flute_circle(cx, cy, R, 16, 6)
    stub = "M30 60 C38 42 52 34 70 32 L92 46 L84 60 L106 66 L98 82 L118 90 L100 100 L106 116 L82 112 L72 132 L52 124 C38 110 30 88 30 60 Z"
    defs = [lg("gPlinth", [(0, "#9E9180"), (1, "#6E6354")], x2=0.8, y2=1),
            lg("gCol", [(0, "#EEE6D7"), (1, "#B9AC97")], x2=0.8, y2=1),
            lg("gBreak", [(0, "#AE9F88"), (1, "#837560")], x2=0.8, y2=1),
            lg("gDrum", [(0, "#EDE4D4"), (0.55, "#C9BCA6"), (1, "#958771")], x1=0, y1=0, x2=0, y2=1),
            lg("gChunk", [(0, "#E3D9C8"), (1, "#A49680")], x2=0.8, y2=1),
            f'<path id="col" d="{col}"/>', '<clipPath id="colC"><use href="#col"/></clipPath>',
            f'<clipPath id="topC"><circle cx="{cx}" cy="{cy}" r="{R - 8}"/></clipPath>',
            f'<path id="plinth" d="{rrect(30, 30, 136, 136, 14)}"/>', '<clipPath id="plC"><use href="#plinth"/></clipPath>',
            '<path id="drum" d="M-40 -19 H40 A10 19 0 0 1 40 19 H-40 A10 19 0 0 1 -40 -19 Z"/>',
            '<clipPath id="drumC"><use href="#drum"/></clipPath>']
    flutes = "".join(
        f'<path d="M{cx} {cy} L{f(cx + math.cos(a) * 70)} {f(cy + math.sin(a) * 70)} L{f(cx + math.cos(a + 0.2) * 70)} {f(cy + math.sin(a + 0.2) * 70)} Z" fill="#FFFFFF" opacity="0.22"/>'
        for a in [i / 16 * math.tau + 0.1 for i in range(16)])
    b = f"""  <g id="sprite" filter="url(#outline)">
    <use href="#plinth" fill="url(#gPlinth)"/>
    <g clip-path="url(#plC)"><rect x="30" y="30" width="136" height="9" fill="#FFFFFF" opacity="0.18"/><rect x="30" y="30" width="9" height="136" fill="#FFFFFF" opacity="0.12"/></g>
    <use href="#col" fill="#2B2230" opacity="0.32" transform="translate(7 9)"/>
    <use href="#col" fill="url(#gCol)"/>
    <g clip-path="url(#colC)">
      {flutes}
      <circle cx="{cx + 20}" cy="{cy + 22}" r="64" fill="none" stroke="#5E5244" stroke-width="20" opacity="0.25"/>
    </g>
    <circle cx="{cx}" cy="{cy}" r="{R - 8}" fill="url(#gBreak)"/>
    <g clip-path="url(#topC)">
      <path d="{stub}" fill="#2B2230" opacity="0.3" transform="translate(6 7)"/>
      <path d="{stub}" fill="url(#gCol)"/>
      <path d="M40 54 C46 44 56 40 68 38" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity="0.45"/>
    </g>
    <g clip-path="url(#plC)"><use href="#drum" fill="#2B2230" opacity="0.3" transform="translate(136 150) rotate(-38) translate(4 8)"/></g>
    <g transform="translate(136 150) rotate(-38)">
      <use href="#drum" fill="url(#gDrum)"/>
      <g clip-path="url(#drumC)">
        <rect x="-50" y="-12" width="100" height="4" fill="#FFFFFF" opacity="0.4"/>
        <rect x="-50" y="-1" width="100" height="4" fill="#8E806C" opacity="0.35"/>
        <rect x="-50" y="9" width="100" height="4" fill="#6E6252" opacity="0.4"/>
      </g>
      <ellipse cx="-40" cy="0" rx="10" ry="19" fill="#D8CCB8"/>
      <ellipse cx="-41" cy="-2" rx="6" ry="12" fill="#FFFFFF" opacity="0.3"/>
    </g>
    <path d="{smooth(ring_pts(176, 104, [9, 7, 10, 8], start=0.4))}" fill="url(#gChunk)"/>
    <path d="{smooth(ring_pts(26, 176, [12, 10, 13, 9, 11], start=0.2))}" fill="url(#gChunk)"/>
  </g>"""
    svg("obstacle-pillar.svg", "BROKEN PILLAR: a fluted stone column on a square plinth, seen from above, its top "
        "snapped off (a high jagged stub on the lit side, the broken lower face darker), a fallen drum of it across "
        "the plinth's front corner, rubble. Drawn at radius 30 room units (the plinth corners and the drum reach "
        "~36). Scale by r/30.", defs, b)


def crate(cx, cy, s, rot, gid):
    """A wooden crate seen from above at size s (SVG units), a frame of planks round a darker panel and a diagonal brace."""
    h = s / 2
    fr = s * 0.16
    return f"""<g transform="translate({f(cx)} {f(cy)}) rotate({rot})">
      <path d="{rrect(-h, -h, s, s, 6)}" fill="url(#gCrate)"/>
      <path d="{rrect(-h + fr, -h + fr, s - 2 * fr, s - 2 * fr, 3)}" fill="#6E3F1E" opacity="0.6"/>
      <clipPath id="{gid}"><path d="{rrect(-h + fr, -h + fr, s - 2 * fr, s - 2 * fr, 3)}"/></clipPath>
      <g clip-path="url(#{gid})">
        <path d="M{f(-h)} {f(h - fr * 0.6)} L{f(h - fr * 0.6)} {f(-h)} L{f(h)} {f(-h + fr * 0.6)} L{f(-h + fr * 0.6)} {f(h)} Z" fill="url(#gCrate)"/>
        <path d="M{f(-h)} {f(-h + s * 0.36)} H{f(h)} M{f(-h)} {f(-h + s * 0.64)} H{f(h)}" stroke="#6E4222" stroke-width="3" opacity="0.35"/>
      </g>
      <path d="{rrect(-h, -h, s, s, 6)}" fill="url(#shX2)"/>
      <ellipse cx="{f(-h + s * 0.3)}" cy="{f(-h + fr * 0.5)}" rx="{f(s * 0.2)}" ry="3" fill="#FFFFFF" opacity="0.3"/>
    </g>"""


def crates():
    defs = [lg("gCrate", [(0, "#D79A5C"), (1, "#A36A3A")], x2=0.7, y2=1),
            lg("shX2", [(0, "#2B1A10", 0), (1, "#2B1A10", 0.28)], x1=0.3, y1=0, x2=1, y2=0.2),
            lg("gBarrel", [(0, "#C98A50"), (1, "#8E5A30")], x2=0.8, y2=1),
            lg("gHoop", [(0, "#A7ADB6"), (1, "#5E636D")], x2=0.8, y2=1)]
    barrel = f"""<g>
      <circle cx="148" cy="150" r="31" fill="url(#gHoop)"/>
      <circle cx="148" cy="150" r="24" fill="url(#gBarrel)"/>
      <path d="M128 142 H168 M128 158 H168" stroke="#6E4222" stroke-width="3" opacity="0.35"/>
      <circle cx="148" cy="150" r="24" fill="url(#shX2)"/>
      <circle cx="141" cy="152" r="4" fill="#5A3A1E" opacity="0.8"/>
      <ellipse cx="137" cy="134" rx="9" ry="3" transform="rotate(-25 137 134)" fill="#FFFFFF" opacity="0.35"/>
    </g>"""
    b = f"""  <g id="sprite" filter="url(#outline)">
    {crate(86, 96, 100, -8, "cA")}
    {barrel}
    <clipPath id="bigC"><path d="{rrect(-50, -50, 100, 100, 6)}" transform="translate(86 96) rotate(-8)"/></clipPath>
    <g clip-path="url(#bigC)"><path d="{rrect(-31, -31, 62, 62, 6)}" transform="translate(104 78) rotate(16) translate(6 9)" fill="#2B2230" opacity="0.35"/></g>
    {crate(104, 78, 62, 16, "cB")}
  </g>"""
    svg("obstacle-crates.svg", "CRATE STACK: a big crate with a smaller one stacked on it and a barrel beside, seen "
        "from above. Drawn at radius 30 room units (fits the round collider). Scale by r/30.", defs, b)


# ------------------------------------------------------------------ spike trap (r 30) and oil (r 40)

def plate(defs_extra=()):
    return [lg("gPlate", [(0, "#6E6874"), (1, "#3E3944")], x2=0.8, y2=1),
            lg("gSpikeL", [(0, "#F4F6F9"), (1, "#C3CAD2")], x2=0, y2=1),
            lg("gSpikeR", [(0, "#9AA2AC"), (1, "#6C737D")], x2=0, y2=1),
            lg("gRivet", [(0, "#C9A27A"), (1, "#7E5634")], x2=0.8, y2=1), *defs_extra]


GRID = [(100 + dx, 104 + dy) for dy in (-40, 0, 40) for dx in (-40, 0, 40)]


def plate_body():
    p = rrect(38, 40, 124, 124, 18)
    return f"""<path d="{p}" fill="url(#gPlate)"/>
    <path d="{rrect(48, 50, 104, 104, 12)}" fill="#2B2230" opacity="0.28"/>
    <path d="{rrect(52, 54, 98, 98, 10)}" fill="#5A5460"/>
    <path d="{rrect(52, 54, 98, 98, 10)}" fill="url(#gPlate)" opacity="0.6"/>
    {"".join(f'<circle cx="{x}" cy="{y}" r="5" fill="url(#gRivet)"/>' for x, y in [(46, 48), (154, 48), (46, 156), (154, 156)])}"""


def spikes(up):
    holes = "".join(f'<ellipse cx="{x}" cy="{y + 4}" rx="12" ry="8" fill="#211A26"/>' for x, y in GRID)
    if up:
        sp = ""
        for x, y in GRID:
            base, tip, hw = y + 4, y - 30, 12
            sp += (f'<ellipse cx="{x}" cy="{base}" rx="13" ry="6" fill="#211A26"/>'
                   f'<path d="M{x - hw} {base} L{x} {tip} L{x} {base + 3} Z" fill="url(#gSpikeL)"/>'
                   f'<path d="M{x} {tip} L{x + hw} {base} L{x} {base + 3} Z" fill="url(#gSpikeR)"/>'
                   f'<circle cx="{x - 1}" cy="{tip + 7}" r="1.8" fill="#FFFFFF"/>')
        inner = holes + sp
        name, what = "trap-spikes-up.svg", "UP: nine steel spikes standing out of the holes (they hurt now)"
    else:
        tips = "".join(f'<path d="M{x - 5} {y + 6} L{x} {y - 2} L{x + 5} {y + 6} Z" fill="#8D949C" opacity="0.8"/>' for x, y in GRID)
        inner = holes + tips
        name, what = "trap-spikes-down.svg", "DOWN: the plate with nine dark holes, the spike tips just showing (safe for now)"
    b = f"""  <g id="sprite" filter="url(#outline)">
    {plate_body()}
    {inner}
  </g>"""
    svg(name, f"SPIKE TRAP {what}. A square iron plate set in the floor, seen from above, drawn at radius 30 room "
        "units (plate 49 room units square). Scale by r/30.", plate(), b)


def lobes(cx, cy, r, n, depth, sy, ph, k=12):
    """A splat: a circle with n rounded lobes, squashed by sy."""
    pts = []
    for i in range(n * k):
        a = i / (n * k) * math.tau
        rr = r * (1 - depth + depth * (0.5 + 0.5 * math.cos(n * a + ph)) ** 0.6) * (1 + 0.06 * math.sin(3 * a + ph * 2))
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr * sy))
    return "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts) + " Z"


def oil():
    pool = lobes(100, 102, 96, 7, 0.16, 0.74, 0.7)
    deep = lobes(104, 106, 70, 6, 0.14, 0.7, 1.9)
    drops = [(180, 160, 6), (16, 56, 5), (156, 30, 4)]
    defs = [lg("gShallow", [(0, "#5A4F60"), (1, "#3A3240")], x2=0.6, y2=1),
            lg("gDeep", [(0, "#2C2532"), (1, "#16121A")], x2=0.6, y2=1),
            lg("gSheen", [(0, "#A98BEA"), (0.3, "#5EC4D0"), (0.6, "#8AD47E"), (1, "#F0C25A")], x1=0, y1=0, x2=1, y2=0.3),
            f'<path id="pool" d="{pool}"/>', '<clipPath id="poolC"><use href="#pool"/></clipPath>',
            f'<path id="deep" d="{deep}"/>', '<clipPath id="deepC"><use href="#deep"/></clipPath>']
    b = f"""  <g id="sprite" filter="url(#outline)">
    <use href="#pool" fill="url(#gShallow)"/>
    {"".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#3A3240"/>' for x, y, r in drops)}
    <use href="#deep" fill="url(#gDeep)"/>
    <g clip-path="url(#deepC)">
      <path d="M44 112 C60 84 100 76 128 90 C150 100 160 96 172 86 C160 108 140 112 124 104 C100 92 70 96 54 118 Z" fill="url(#gSheen)" opacity="0.5"/>
      <path d="M70 134 C92 124 118 128 140 138 C118 134 94 132 74 142 Z" fill="url(#gSheen)" opacity="0.35"/>
    </g>
    <path d="M40 78 C52 60 76 52 100 52" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.55"/>
    <path d="M110 51 L118 51" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.45"/>
    <path d="M150 150 C160 144 166 136 170 128" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.25"/>
  </g>"""
    svg("hazard-oil.svg", "OIL PUDDLE: a flat, lobed splat of black oil seen from above: a lighter shallow rim, the "
        "deep middle darker with a rainbow sheen, wet highlights along the lit edge, a few separate drips. Drawn at "
        "radius 38 room units across (28 front to back). Scale by r/38; the game's range is 34-52.", defs, b)


# ------------------------------------------------------------------ chests (48 wide)

LID = "M56 40 H144 A18 18 0 0 1 162 58 V112 H38 V58 A18 18 0 0 1 56 40 Z"
FRONT = "M44 108 H156 V148 A10 10 0 0 1 146 158 H54 A10 10 0 0 1 44 148 Z"


def chest(kind):
    gold = kind != "locked"
    defs = [lg("gWood", [(0, "#A86E3C"), (0.38, "#D99E60"), (1, "#8E5A30")], x2=0, y2=1) if gold else
            lg("gWood", [(0, "#86603F"), (0.38, "#B38962"), (1, "#6E4C32")], x2=0, y2=1),
            lg("gWoodDk", [(0, "#8E5A30"), (1, "#6E4222")], x2=0, y2=1) if gold else
            lg("gWoodDk", [(0, "#7E5636"), (1, "#5C3C24")], x2=0, y2=1),
            lg("gBand", [(0, "#FAD06A"), (1, "#D9952A")], x2=1, y2=0) if gold else
            lg("gBand", [(0, "#AEB4BE"), (1, "#666B75")], x2=1, y2=0),
            lg("gBrass", [(0, "#FFE38A"), (1, "#E0A82A")], x2=0.7, y2=1),
            SHADE_R,
            f'<path id="lid" d="{LID}"/>', '<clipPath id="lidC"><use href="#lid"/></clipPath>',
            f'<path id="front" d="{FRONT}"/>', '<clipPath id="frontC"><use href="#front"/></clipPath>']
    bands = '<rect x="56" y="20" width="12" height="150" fill="url(#gBand)"/><rect x="132" y="20" width="12" height="150" fill="url(#gBand)"/>'
    studs = ""
    if not gold:
        studs = "".join(f'<circle cx="{x}" cy="{y}" r="2.6" fill="#D9DEE4"/>' for x in (62, 138) for y in (52, 74, 94, 126, 146))
    if kind == "open":
        b = chest_open(defs, bands)
        return
    lock = ""
    if kind == "closed":
        lock = ('<path d="M84 98 H116 V126 C116 134 108 140 100 142 C92 140 84 134 84 126 Z" fill="#2B2230" opacity="0.25" transform="translate(3 4)"/>'
                '<path d="M84 98 H116 V126 C116 134 108 140 100 142 C92 140 84 134 84 126 Z" fill="url(#gBrass)"/>'
                '<rect x="84" y="98" width="32" height="6" rx="3" fill="#FFF3C4" opacity="0.6"/>'
                '<path d="M100 110 A5 5 0 0 1 103 119 L105 128 H95 L97 119 A5 5 0 0 1 100 110 Z" fill="#5A3A1E"/>')
    else:  # a big brass padlock hanging over the seam
        lock = ('<path d="M88 116 V102 A12 12 0 0 1 112 102 V116" fill="none" stroke="#8A6A2A" stroke-width="7" transform="translate(1.5 2)" opacity="0.6"/>'
                '<path d="M88 116 V102 A12 12 0 0 1 112 102 V116" fill="none" stroke="url(#gBrass)" stroke-width="7"/>'
                f'<path d="{rrect(79, 112, 42, 36, 9)}" fill="#2B2230" opacity="0.3" transform="translate(3 4)"/>'
                f'<path d="{rrect(79, 112, 42, 36, 9)}" fill="url(#gBrass)"/>'
                f'<path d="{rrect(83, 116, 34, 6, 3)}" fill="#FFF3C4" opacity="0.7"/>'
                '<path d="M100 124 A5 5 0 0 1 103 133 L105 141 H95 L97 133 A5 5 0 0 1 100 124 Z" fill="#4A3418"/>')
    b = f"""  <g id="sprite" filter="url(#outline)">
    <use href="#front" fill="url(#gWoodDk)"/>
    <g clip-path="url(#frontC)">{bands}<rect x="36" y="110" width="130" height="50" fill="url(#shX)"/></g>
    <use href="#lid" fill="url(#gWood)"/>
    <g clip-path="url(#lidC)">
      <path d="M38 62 H162 M38 86 H162" stroke="{'#8E5A30' if gold else '#5C3C24'}" stroke-width="3" opacity="0.4"/>
      {bands}
      <rect x="36" y="100" width="130" height="12" fill="url(#gBand)"/>
      <rect x="36" y="36" width="130" height="80" fill="url(#shX)"/>
      <ellipse cx="78" cy="72" rx="26" ry="5" fill="#FFFFFF" opacity="0.28"/>
    </g>
    <rect x="44" y="112" width="112" height="5" fill="#2B2230" opacity="0.3"/>
    {studs}
    {lock}
  </g>"""
    if kind == "closed":
        svg("chest-closed.svg", "CHEST, closed (the free one, treasure rooms): planked lid seen from above with gold "
            "bands and a gold lock plate, the front face below. 48 room units wide, 48 front to back. It is the "
            "mimic's chest on purpose, so the mimic is a surprise. Stays upright on screen.", defs, b)
    else:
        svg("chest-locked.svg", "CHEST, locked (needs a key): darker wood, iron bands with studs instead of gold, and "
            "a big brass padlock (key colour) hanging over the seam. 48 room units wide. Stays upright on screen.", defs, b)


def chest_open(defs, bands):
    lid_up = "M50 14 H150 A12 12 0 0 1 162 26 V52 H38 V26 A12 12 0 0 1 50 14 Z"
    box = "M44 46 H156 V110 H44 Z"
    cav = rrect(54, 56, 92, 46, 6)
    defs += [rg("gGlow", [(0, "#FFF4C8", 0.95), (0.45, "#FFE08A", 0.55), (1, "#FFD45A", 0)], cx=0.5, cy=0.5, r=0.5),
             lg("gCoin", [(0, "#FFE08A"), (1, "#E09A2A")], x2=0.7, y2=1),
             lg("gCav", [(0, "#3A2016"), (1, "#5A341E")], x2=0, y2=1),
             f'<path id="lidUp" d="{lid_up}"/>', '<clipPath id="lidUpC"><use href="#lidUp"/></clipPath>',
             f'<path id="cav" d="{cav}"/>', '<clipPath id="cavC"><use href="#cav"/></clipPath>']
    coins = [(66, 92, 9), (80, 86, 10), (96, 90, 10), (112, 84, 10), (128, 90, 9), (90, 76, 9), (108, 72, 9),
             (124, 76, 8), (74, 74, 8), (100, 100, 9), (136, 100, 8), (62, 102, 8)]
    coin_s = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#gCoin)"/><circle cx="{x - r * 0.3}" cy="{y - r * 0.3}" r="{r * 0.35:.1f}" fill="#FFF6CC" opacity="0.8"/>' for x, y, r in coins)
    b = f"""  <g id="sprite" filter="url(#outline)">
    <use href="#lidUp" fill="#7A4A26"/>
    <g clip-path="url(#lidUpC)">
      <rect x="36" y="12" width="130" height="10" fill="url(#gBand)"/>
      <rect x="56" y="12" width="12" height="44" fill="url(#gBand)" opacity="0.8"/>
      <rect x="132" y="12" width="12" height="44" fill="url(#gBand)" opacity="0.8"/>
      <rect x="36" y="12" width="130" height="44" fill="url(#shX)"/>
    </g>
    <use href="#front" fill="url(#gWoodDk)"/>
    <g clip-path="url(#frontC)">{bands}<rect x="36" y="108" width="130" height="52" fill="url(#shX)"/></g>
    <path d="{box}" fill="#B9824C"/>
    <rect x="56" y="46" width="12" height="64" fill="url(#gBand)"/>
    <rect x="132" y="46" width="12" height="64" fill="url(#gBand)"/>
    <rect x="44" y="46" width="112" height="64" fill="url(#shX)"/>
    <use href="#cav" fill="url(#gCav)"/>
    <g clip-path="url(#cavC)">
      <rect x="54" y="56" width="92" height="8" fill="#2B2230" opacity="0.35"/>
      {coin_s}
      <path d="M96 62 L104 62 L108 68 L100 76 L92 68 Z" fill="#E0604B"/><path d="M96 62 L100 62 L100 76 L92 68 Z" fill="#FF9A86"/>
    </g>
    <rect x="86" y="110" width="28" height="22" rx="5" fill="url(#gBrass)"/>
    <rect x="86" y="110" width="28" height="5" rx="2.5" fill="#FFF3C4" opacity="0.6"/>
  </g>
  <g id="glow">
    <ellipse cx="100" cy="76" rx="78" ry="54" fill="url(#gGlow)" opacity="0.75"/>
    {"".join(f'<path d="M{x} {y - s} L{x + s * 0.28} {y - s * 0.28} L{x + s} {y} L{x + s * 0.28} {y + s * 0.28} L{x} {y + s} L{x - s * 0.28} {y + s * 0.28} L{x - s} {y} L{x - s * 0.28} {y - s * 0.28} Z" fill="#FFFFFF"/>' for x, y, s in [(70, 64, 9), (132, 70, 7), (112, 40, 6)])}
  </g>"""
    svg("chest-open.svg", "CHEST, open: the lid stands up behind the box (its dark inside showing), the box full of "
        "gold coins and a ruby, a warm glow and three sparkles over it. #glow has no outline; the game can fade it. "
        "48 room units wide. Stays upright on screen.", defs, b)


# ------------------------------------------------------------------ door (112 x 26, in a 360 box)

DOOR_COL = {"fight": "#C8553D", "hazard": "#E0884B", "elite": "#8E3B5B", "treasure": "#F2B53A",
            "fountain": "#5DB7E0", "choice": "#9B7BD6", "boss": "#2B2230"}


def mix(c, d, k):
    a = [int(c[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(d[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * k):02X}" for x, y in zip(a, b))


# Room edge (the wall's inner face) runs along y = 100; the room is below (+y), outside is above.
# The door is 112 room units across (285 SVG): x -42.5 .. 242.5. The wall band is 26 deep (66 SVG): y 34 .. 100.
OPEN_IN = "M-8 100 V44 C-8 6 40 -10 100 -10 C160 -10 208 6 208 44 V100 Z"     # the arched opening
FRAME = "M-42 96 V40 C-42 -16 30 -42 100 -42 C170 -42 242 -16 242 40 V96 A8 8 0 0 1 234 104 H-34 A8 8 0 0 1 -42 96 Z"   # the stone frame round it


def door_defs():
    return [lg("gStone", [(0, "#B9AD9B"), (1, "#857A6B")], x2=0.6, y2=1),
            lg("gStoneLt", [(0, "#D6CCBA"), (1, "#A69985")], x2=0.6, y2=1),
            lg("gDoor", [(0, "#B07A48"), (1, "#7E5230")], x2=0.3, y2=1),
            lg("gIron", [(0, "#6A646F"), (1, "#433D48")], x2=0, y2=1),
            f'<path id="open" d="{OPEN_IN}"/>', '<clipPath id="openC"><use href="#open"/></clipPath>',
            f'<path id="frame" d="{FRAME}"/>', '<clipPath id="frameC"><use href="#frame"/></clipPath>']


def frame_body():
    # voussoirs: alternate lighter wedges round the arch, a keystone at the top; jamb blocks alternate too
    wedges = ""
    for i in range(9):
        a0 = math.pi + i / 9 * math.pi
        a1 = math.pi + (i + 1) / 9 * math.pi
        if i % 2 == 0:
            p = [(100, 44), (100 + math.cos(a0) * 200, 44 + math.sin(a0) * 200), (100 + math.cos(a1) * 200, 44 + math.sin(a1) * 200)]
            wedges += f'<path d="M{p[0][0]} {p[0][1]} L{f(p[1][0])} {f(p[1][1])} L{f(p[2][0])} {f(p[2][1])} Z" fill="#FFFFFF" opacity="0.13"/>'
    blocks = "".join(f'<rect x="-50" y="{y}" width="50" height="22" fill="#FFFFFF" opacity="0.13"/>'
                     f'<rect x="200" y="{y}" width="50" height="22" fill="#FFFFFF" opacity="0.13"/>' for y in (48, 92))
    blocks += "".join(f'<rect x="-50" y="{y}" width="50" height="22" fill="#2B2230" opacity="0.08"/>'
                      f'<rect x="200" y="{y}" width="50" height="22" fill="#2B2230" opacity="0.08"/>' for y in (70,))
    key = "M86 -44 H114 L110 -6 H90 Z"
    return f"""<use href="#frame" fill="url(#gStone)"/>
    <g clip-path="url(#frameC)">{wedges}{blocks}
      <path d="M-42 104 V40 C-42 -16 30 -42 100 -42 C170 -42 242 -16 242 40 V104 H232 V40 C232 -8 168 -32 100 -32 C32 -32 -32 -8 -32 40 V104 Z" fill="#FFFFFF" opacity="0.12"/>
    </g>
    <path d="{key}" fill="url(#gStoneLt)" stroke="url(#gStoneLt)" stroke-width="8" stroke-linejoin="round"/>"""


def threshold():
    return (f'<path d="{rrect(-46, 92, 292, 20, 9)}" fill="url(#gStoneLt)"/>'
            f'<path d="{rrect(-40, 93, 280, 5, 2.5)}" fill="#FFFFFF" opacity="0.3"/>')


def door(state, kind=None):
    defs = door_defs()
    spill = ""
    if state == "shut":
        planks = "".join(f'<rect x="{x}" y="-20" width="3" height="130" fill="#4A2E18" opacity="0.35"/>' for x in range(19, 200, 27) if abs(x - 100) > 6)
        planks += "".join(f'<rect x="{x}" y="-20" width="24" height="130" fill="#FFFFFF" opacity="0.07"/>' for x in range(-5, 200, 54))
        inner = f"""<use href="#open" fill="url(#gDoor)"/>
    <g clip-path="url(#openC)">
      {planks}
      <rect x="97" y="-20" width="6" height="130" fill="#2B2230" opacity="0.45"/>
      <rect x="-10" y="26" width="220" height="14" fill="url(#gIron)"/>
      <rect x="-10" y="70" width="220" height="14" fill="url(#gIron)"/>
      <rect x="-10" y="26" width="220" height="3" fill="#FFFFFF" opacity="0.25"/>
      <rect x="-10" y="70" width="220" height="3" fill="#FFFFFF" opacity="0.25"/>
      {"".join(f'<circle cx="{x}" cy="{y}" r="2.6" fill="#B9BEC6"/>' for x in (8, 40, 72, 128, 160, 192) for y in (33, 77))}
      <path d="M-8 100 V44 C-8 6 40 -10 100 -10 C160 -10 208 6 208 44 V100 Z" fill="none" stroke="#2B2230" stroke-width="14" opacity="0.22"/>
    </g>
    <circle cx="88" cy="58" r="8" fill="none" stroke="#C9CDD4" stroke-width="4"/>
    <circle cx="112" cy="58" r="8" fill="none" stroke="#C9CDD4" stroke-width="4"/>
    <circle cx="88" cy="50" r="3.5" fill="#8E949C"/><circle cx="112" cy="50" r="3.5" fill="#8E949C"/>"""
        name, what = "door-shut.svg", "SHUT: an arched double door of planks with two iron straps and ring handles"
    else:
        col = DOOR_COL.get(kind)
        boss = kind == "boss"
        if col is None:
            fill, core = "#2B2230", "#3E3440"
        elif boss:
            fill, core = "#1C1422", "#6B1F33"
        else:
            fill, core = col, mix(col, "#FFF6E0", 0.7)
        defs += [rg("gPass", [(0, core), (0.55, fill), (1, mix(fill, "#2B2230", 0.45))], cx=0.5, cy=0.35, r=0.65),
                 lg("gLeaf", [(0, "#8E5E36"), (1, "#5E3C22")], x2=1, y2=0)]
        # the two door leaves, swung away from the room into the passage, seen at a slant on each side
        leaves = ('<path d="M-8 100 V44 C-8 30 -4 20 2 12 L30 24 V100 Z" fill="url(#gLeaf)"/>'
                  '<path d="M208 100 V44 C208 30 204 20 198 12 L170 24 V100 Z" fill="url(#gLeaf)"/>'
                  '<rect x="-10" y="40" width="42" height="9" fill="url(#gIron)"/><rect x="168" y="40" width="42" height="9" fill="url(#gIron)"/>'
                  '<rect x="-10" y="76" width="42" height="9" fill="url(#gIron)"/><rect x="168" y="76" width="42" height="9" fill="url(#gIron)"/>')
        lit = ""
        if False:
            lit = (f'<path d="M30 24 V100 L22 100 V30 Z" fill="{core}" opacity="0.7"/>'
                   f'<path d="M170 24 V100 L178 100 V30 Z" fill="{core}" opacity="0.7"/>')
        motes = ""
        if boss:
            motes = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#E0503A" opacity="{o}"/>'
                            for x, y, r, o in [(70, 30, 3, 0.9), (126, 18, 2.4, 0.8), (110, 60, 2, 0.7), (84, 74, 2.6, 0.8), (140, 50, 2, 0.6)])
        inner = f"""<use href="#open" fill="url(#gPass)"/>
    <g clip-path="url(#openC)">
      {leaves}{lit}{motes}
      <path d="{OPEN_IN}" fill="none" stroke="#2B2230" stroke-width="12" opacity="0.25"/>
    </g>"""
        if col:
            sc, a0, a1 = (("#2B2230", 0.42, 0.2) if boss else (col, 0.5, 0.2))
            defs += [rg("gSpill", [(0, sc, a0), (0.5, sc, a1), (1, sc, 0)], cx=100, cy=100, r=190, user=True),
                     lg("gRay", [(0, mix(col, "#FFF6E0", 0.5) if not boss else "#6B1F33", 0.5), (1, sc, 0)], x1=0, y1=100, x2=0, y2=270, user=True),
                     '<clipPath id="roomC"><rect x="-80" y="100" width="360" height="180"/></clipPath>']
            rays = "".join(f'<path d="M{a} 100 L{b} 100 L{d} 270 L{c} 270 Z" fill="url(#gRay)" opacity="0.6"/>'
                           for a, b, c, d in [(4, 40, -60, 10), (80, 120, 64, 136), (160, 196, 190, 260)])
            embers = ""
            if boss:
                embers = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#E0503A" opacity="{o}"/>'
                                 for x, y, r, o in [(60, 150, 2.5, 0.7), (150, 176, 2, 0.6), (104, 210, 2.6, 0.5), (30, 196, 1.8, 0.5)])
            spill = f"""  <g id="spill" clip-path="url(#roomC)">
    <ellipse cx="100" cy="100" rx="190" ry="180" fill="url(#gSpill)"/>
    {rays}{embers}
  </g>
"""
        if col is None:
            name, what = "door-open.svg", "OPEN (the way in, no glow): the leaves swung back into a dark passage"
        else:
            name, what = f"door-open-{kind}.svg", f"OPEN, {kind} room behind: the passage glows {col} and the light spills onto the floor"
        if col:
            # the threshold and the inner edges of the frame catch the light
            inner += (f'\n    <path d="{rrect(-20, 92, 240, 22, 8)}" fill="{core if not boss else "#6B1F33"}" opacity="{0.35 if not boss else 0.3}"/>' if False else "")
    tint = ""
    if state != "shut" and DOOR_COL.get(kind) and kind != "boss":
        tint = f'<path d="{rrect(-8, 92, 216, 20, 6)}" fill="{mix(DOOR_COL[kind], "#FFF6E0", 0.45)}" opacity="0.5"/>'
    b = f"""{spill}  <g id="sprite" filter="url(#outline)">
    {frame_body()}
    {inner}
    {threshold()}
    {tint}
  </g>"""
    svg(name, f"DOOR {what}. Seen from inside the room: the room is below (+y), outside is above. The room's edge "
        "(the wall's inner face) is the line y = 100, and the box centre (100,100) is the middle of the doorway on that "
        "line. 112 room units across (285 SVG units), the wall band 26 deep; the stone arch rises 16 room units past "
        "the wall's outer edge. Box 360 = 141.4 room units. #spill (no outline) is the light on the floor; the game "
        "can pulse it. Rotate the whole thing so +y points into the room.", defs, b, box=(-80, -80, 360, 360))


# ------------------------------------------------------------------ fountain (r 38) and pedestal

def fountain(used):
    rim = ""
    n = 8
    pts = []
    for i in range(n * 8):
        a = i / (n * 8) * math.tau
        r = 90 + 6 * abs(math.cos(a * n / 2))
        pts.append((100 + math.cos(a) * r, 100 + math.sin(a) * r))
    rim = "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts) + " Z"
    w0, w1 = ("#9FE0F6", "#3E95C8") if not used else ("#A9C3CC", "#6F8F9C")
    defs = [lg("gRim", [(0, "#CFC3B0"), (1, "#8C7F6E")], x2=0.8, y2=1),
            rg("gWater", [(0, w0), (1, w1)], cx=0.38, cy=0.34, r=0.75),
            lg("gPed", [(0, "#DCD1BF"), (1, "#9A8C78")], x2=0.8, y2=1),
            '<clipPath id="waterC"><circle cx="100" cy="100" r="72"/></clipPath>']
    if used:
        centre = """<circle cx="100" cy="100" r="28" fill="url(#gPed)"/>
    <circle cx="100" cy="100" r="17" fill="#8C7F6E"/>
    <circle cx="100" cy="100" r="12" fill="#A9C3CC" opacity="0.6"/>"""
        ripples = '<circle cx="100" cy="100" r="54" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.15"/>'
    else:
        drops = "".join(f'<circle cx="{f(100 + math.cos(a) * 38)}" cy="{f(100 + math.sin(a) * 38)}" r="3.5" fill="#E8FAFF"/>'
                        for a in [i / 8 * math.tau + 0.4 for i in range(8)])
        splash = "M" + " L".join(f"{f(100 + math.cos(a) * (20 if i % 2 == 0 else 11))} {f(100 + math.sin(a) * (20 if i % 2 == 0 else 11))}"
                                 for i, a in enumerate([j / 16 * math.tau for j in range(16)])) + " Z"
        centre = f"""<circle cx="104" cy="106" r="26" fill="#2B2230" opacity="0.25"/>
    <circle cx="100" cy="100" r="26" fill="url(#gPed)"/>
    <circle cx="100" cy="100" r="18" fill="#3E95C8"/>
    <path d="{splash}" fill="#BDEFFF" stroke="#BDEFFF" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="98" cy="98" r="8" fill="#FFFFFF"/>
    {drops}"""
        ripples = ('<circle cx="100" cy="100" r="44" fill="none" stroke="#FFFFFF" stroke-width="3.5" opacity="0.35"/>'
                   '<circle cx="100" cy="100" r="58" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.22"/>')
    b = f"""  <g id="sprite" filter="url(#outline)">
    <path d="{rim}" fill="url(#gRim)"/>
    <path d="M30 70 A76 76 0 0 1 130 26" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity="0.3"/>
    <circle cx="100" cy="100" r="76" fill="#6E6254"/>
    <circle cx="100" cy="100" r="72" fill="url(#gWater)"/>
    <g clip-path="url(#waterC)">
      <circle cx="104" cy="106" r="72" fill="none" stroke="#2B2230" stroke-width="10" opacity="0.18"/>
      {ripples}
      <ellipse cx="62" cy="62" rx="16" ry="5" transform="rotate(-40 62 62)" fill="#FFFFFF" opacity="{0.55 if not used else 0.25}"/>
    </g>
    {centre}
  </g>"""
    if used:
        svg("fountain-used.svg", "FOUNTAIN, used: the same basin, the water low and grey, the spout dry. Radius 38 room units.", defs, b)
    else:
        svg("fountain.svg", "FOUNTAIN (the fountain room's): a round stone basin with a lobed rim, clear blue water with "
            "ripples, a spout in the middle bubbling over. Radius 38 room units (the game's collider), 97 SVG units.", defs, b)


def pedestal():
    defs = [lg("gPedTop", [(0, "#D9CEBB"), (1, "#A99B86")], x2=0.8, y2=1),
            lg("gPedSide", [(0, "#A39581"), (0.5, "#8C7F6C"), (1, "#6E6252")], x2=1, y2=0),
            rg("gCush", [(0, "#C9B2F2"), (1, "#7E5EC0")], cx=0.38, cy=0.34, r=0.75),
            lg("gGoldP", [(0, "#FAD06A"), (1, "#D9952A")], x2=1, y2=0)]
    # base slab, column, cap, cushion: a short round plinth seen from above and a little in front
    b = f"""  <g id="sprite" filter="url(#outline)">
    <path d="M50 126 A50 24 0 0 0 150 126 V138 A50 24 0 0 1 50 138 Z" fill="url(#gPedSide)"/>
    <ellipse cx="100" cy="126" rx="50" ry="24" fill="url(#gPedTop)"/>
    <path d="M72 82 V118 A28 12 0 0 0 128 118 V82 Z" fill="url(#gPedSide)"/>
    <ellipse cx="100" cy="122" rx="30" ry="10" fill="#2B2230" opacity="0.2"/>
    <path d="M72 82 V118 A28 12 0 0 0 128 118 V82 Z" fill="url(#gPedSide)"/>
    <path d="M60 78 A40 20 0 0 0 140 78 V88 A40 20 0 0 1 60 88 Z" fill="url(#gPedSide)"/>
    <ellipse cx="100" cy="78" rx="40" ry="20" fill="url(#gPedTop)"/>
    <ellipse cx="100" cy="77" rx="30" ry="14" fill="url(#gCush)"/>
    <path d="M70 77 A30 14 0 0 0 130 77" fill="none" stroke="url(#gGoldP)" stroke-width="3"/>
    {"".join(f'<circle cx="{x}" cy="{y}" r="3.4" fill="url(#gGoldP)"/>' for x, y in [(70, 78), (130, 78), (100, 91)])}
    <ellipse cx="90" cy="70" rx="10" ry="3.5" fill="#FFFFFF" opacity="0.35"/>
  </g>"""
    svg("pedestal.svg", "PEDESTAL (the choice room's): a short round stone plinth seen from above and a little in "
        "front, a violet cushion with a gold trim on top; the game floats the reward over the cushion (cushion "
        "centre at SVG 100,77). 40 room units wide (100 SVG units). Stays upright on screen.", defs, b)


if __name__ == "__main__":
    rock(); pillar(); crates()
    spikes(False); spikes(True); oil()
    chest("closed"); chest("open"); chest("locked")
    door("shut"); door("open")
    for k in DOOR_COL:
        door("open", k)
    fountain(False); fountain(True); pedestal()
