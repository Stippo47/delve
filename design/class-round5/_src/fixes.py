"""Round 5 (lane A1): the picked fixes. Reads the round-4 SVGs, writes design/class-round5/<class>/.
python fixes.py [name ...]      Paths are relative to this file.
"""
import sys, re, math
from fx import *

STEEL = ('<linearGradient id="r5Steel" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#E4E8EE"/>'
         '<stop offset="1" stop-color="#7F8898"/></linearGradient>'
         '<linearGradient id="r5Ivory" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#FFF8E8"/>'
         '<stop offset="1" stop-color="#CDB98E"/></linearGradient>')
HAND_M = ('<radialGradient id="gHandM" cx="0.62" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/>'
          '<stop offset="1" stop-color="#DFA57F"/></radialGradient>')


# ---------------------------------------------------------------- small shapes
def cone(x0, y0, x1, y1, w, r=1.6):
    """A fat cone spike, base centre (x0,y0), tip (x1,y1), base half-width w, slightly rounded tip.
    Returns (whole, the half away from the light)."""
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy); ux, uy = dx / L, dy / L; nx, ny = -uy, ux
    a = (x0 + nx * w, y0 + ny * w); b = (x0 - nx * w, y0 - ny * w)
    t1 = (x1 - ux * r * 1.6 + nx * r, y1 - uy * r * 1.6 + ny * r)
    t2 = (x1 - ux * r * 1.6 - nx * r, y1 - uy * r * 1.6 - ny * r)
    whole = (f"M {f(a[0])} {f(a[1])} L {f(t1[0])} {f(t1[1])} Q {f(x1)} {f(y1)} {f(t2[0])} {f(t2[1])} "
             f"L {f(b[0])} {f(b[1])} Z")
    side = b if (b[0] - a[0]) + (b[1] - a[1]) * 0.6 > 0 else a
    half = f"M {f(x0)} {f(y0)} L {f(x1)} {f(y1)} L {f(side[0])} {f(side[1])} Z"
    return whole, half


def pyramid(cx, cy, r, rot=0):
    """A four-sided spike seen from straight above: a diamond of four facets lit from the top left."""
    pts = []
    for k in range(4):
        a = math.radians(rot + 90 * k - 90)
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    N, E, S, W = pts
    tri = lambda p, q: f"M {f(p[0])} {f(p[1])} L {f(q[0])} {f(q[1])} L {f(cx)} {f(cy)} Z"
    return [(tri(W, N), "#F6F8FB"), (tri(N, E), "#C3CAD4"), (tri(S, W), "#A4ACB9"), (tri(E, S), "#6C7484")]


def fang(x0, y0, ox, oy, L, w, bend):
    """A curved fang from the base (x0,y0) pointing out along (ox,oy), bending toward +y by `bend`."""
    n = math.hypot(ox, oy); ox, oy = ox / n, oy / n
    nx, ny = -oy, ox
    a = (x0 + nx * w, y0 + ny * w); b = (x0 - nx * w, y0 - ny * w)
    tip = (x0 + ox * L, y0 + oy * L + bend)
    c1 = (x0 + ox * L * 0.55 + nx * w * 0.7, y0 + oy * L * 0.55 + ny * w * 0.7 + bend * 0.2)
    c2 = (x0 + ox * L * 0.55 - nx * w * 0.7, y0 + oy * L * 0.55 - ny * w * 0.7 + bend * 0.45)
    return (f"M {f(a[0])} {f(a[1])} Q {f(c1[0])} {f(c1[1])} {f(tip[0])} {f(tip[1])} "
            f"Q {f(c2[0])} {f(c2[1])} {f(b[0])} {f(b[1])} Z")


def mirror_arm(svg, src="arm-l", dst="arm-r"):
    """Replace group dst with an exact mirror of group src about x = 100 (identical, flipped). Hands keep the
    light from the left (their gradient is flipped back); everything else is a true mirror image."""
    g = get_group(svg, src)
    inner = g[g.index(">") + 1:g.rindex("</g>")]
    inner = inner.replace("url(#gHand)", "url(#gHandM)")
    pv = re.search(r'data-pivot="([-\d.]+) ([-\d.]+)"', g)
    px, py = float(pv.group(1)), float(pv.group(2))
    new = (f'<g id="{dst}" data-pivot="{f(200 - px)} {f(py)}">\n<!-- round 5: the exact mirror of {src} -->\n'
           f'<g transform="matrix(-1 0 0 1 200 0)">{inner}</g>\n</g>')
    svg = set_group(svg, dst, new)
    if 'id="gHandM"' not in svg:
        svg = add_defs(svg, HAND_M)
    return svg


# ---------------------------------------------------------------- knights
HELM_OUT = "M 100 40 C 134 40 154 64 154 98 C 154 130 138 154 100 158 C 62 154 46 130 46 98 C 46 64 66 40 100 40 Z"
HOLE4 = ("M 100 103 C 111 98 127 98 134 104 C 140 110 140 124 139 136 C 138 150 126 166 100 166 "
         "C 74 166 62 150 61 136 C 60 124 60 110 66 104 C 73 98 89 98 100 103 Z")
# round 5: the opening sits higher and stops above the mouth; the helm below it is solid down to the chin
HOLE5 = ("M 100 99 C 112 95 128 96 135 102 C 141 108 141 118 137 124 C 131 131 117 133 100 133 "
         "C 83 133 69 131 63 124 C 59 118 59 108 65 102 C 72 96 88 95 100 99 Z")


def griffon():
    s = read4("knight", "knight-griffon")
    s = sub1(s, 'd="' + HELM_OUT + ' ' + HOLE4 + '"', 'd="' + HELM_OUT + ' ' + HOLE5 + '"')
    s = set_comment(s, "Round 5: the face opening moved up and closed at the bottom: it now stops above the mouth, so the "
                       "helm covers the mouth and chin in one solid piece (no thin sliver under the chin); the helm is as tall as before.")
    write5("knight", "knight-griffon", s)


# ---------------------------------------------------------------- barbarians
CLUB = "M -6 8 C -7.5 22 -12 36 -15.5 50 C -18 62 -13 75 0 75 C 13 75 18 62 15.5 50 C 12 36 7.5 22 6 8 Z"


def club_arm(spikes, top, label, bands=""):
    T = "translate(152 149) rotate(47)"
    return ('<g id="arm-r" data-pivot="160 108">\n'
            f'      <!-- round 5 ({label}): the club, held low; the handle runs under the right paw and only the fist shows -->\n'
            f'      <g transform="{T}">\n'
            '        <rect x="-5.5" y="-18" width="11" height="34" rx="4" fill="#6A4226"/>\n'
            f'        {spikes}\n'
            '        <use href="#bcClub" fill="url(#bcgClub)"/>\n'
            '        <use href="#bcClub" fill="url(#g16)"/>\n'
            '        <g clip-path="url(#bccClub)"><path d="M -7 28 C -9 40 -11 52 -10 64" fill="none" stroke="#F6DDB6" stroke-width="3" stroke-linecap="round" opacity="0.6"/>'
            '<rect x="-20" y="6" width="40" height="11" fill="#6A4226"/><rect x="-20" y="14" width="40" height="3" fill="#4A2E1A" opacity="0.6"/>'
            f'{bands}</g>\n'
            f'        {top}\n'
            '        <g clip-path="url(#bccHandle)"><use href="#fistR" transform="translate(1 3)" fill="#2B2230" opacity="0.3"/></g>\n'
            '        <use href="#fistR" fill="url(#gHand)"/>\n'
            '      </g>\n    </g>'), T


def bearskin(v="a"):
    s = read4("barbarian", "barbarian-bearskin")
    s = add_defs(s, STEEL + '<radialGradient id="r5Stud" cx="0.36" cy="0.32" r="0.75"><stop offset="0" stop-color="#F6F8FB"/>'
                    '<stop offset="0.5" stop-color="#B3BAC6"/><stop offset="1" stop-color="#5E6676"/></radialGradient>')
    bands = ('<rect x="-20" y="40" width="40" height="5.5" fill="#6F7787"/><rect x="-20" y="40" width="40" height="2" fill="#C9CFD8"/>')
    if v == "a":
        # four big iron cones out of the sides and one out of the end: few, fat and evenly spaced
        whole, dark = [], []
        for (b, t) in [((-11, 32), (-24, 29)), ((11, 32), (24, 29)), ((-15.6, 56), (-29, 56)), ((15.6, 56), (29, 56)),
                       ((0, 72), (0, 85))]:
            w_, d_ = cone(*b, *t, 6.8, r=2)
            whole.append(w_); dark.append(d_)
        spikes = f'<path d="{" ".join(whole)}" fill="url(#r5Steel)"/><path d="{" ".join(dark)}" fill="#3E3D52" opacity="0.42"/>'
        top = ""
        label = "A: five big iron spikes"
        note = ("Round 5 (A): new spikes - five big fat iron cones, evenly spaced (two out of each side, one out of the end), "
                "each split light/dark down the middle; an iron band round the club. No thin points, no starburst.")
        clipd = " ".join(whole)
    else:
        # no spikes: a studded club - big round domed iron studs on the top face and an iron band
        spikes = ""
        top = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#r5Stud)"/>' for x, y, r in
                      [(-6, 30, 4.4), (5, 33, 4.4), (-9, 53, 5), (3, 55, 5), (-3, 66, 4.8)])
        label = "B: studded, no spikes"
        note = ("Round 5 (B): no spikes at all - a studded club: five big round domed iron studs on the top face and an "
                "iron band, so the club reads clean.")
        clipd = ""
    arm, T = club_arm(spikes, top, label, bands)
    s = set_group(s, "arm-r", arm)
    s = re.sub(r'<clipPath id="bccWpn">.*?</clipPath>',
               f'<clipPath id="bccWpn"><g transform="{T}"><use href="#bcClub"/><path d="{clipd}"/><use href="#fistR"/></g></clipPath>', s)
    s = set_comment(s, note)
    write5("barbarian", f"barbarian-bearskin-{v}", s)


def berserker(v="a"):
    s = read4("barbarian", "barbarian-berserker")
    s = add_defs(s, STEEL)
    cx, cy, R = 130.7, 179.7, 16.5
    a0 = s.index('<path d="M 138.8 166.6')
    b0 = s.index('<g transform="translate(159 146) rotate(40)">', a0)
    whole, dark = [], []
    n = 6 if v == "a" else 8
    for k in range(n):
        a = math.radians(-90 + 360 / n * k + (30 if v == "a" else 22.5))
        b = (cx + math.cos(a) * (R - 3), cy + math.sin(a) * (R - 3))
        t = (cx + math.cos(a) * (R + (11 if v == "a" else 8)), cy + math.sin(a) * (R + (11 if v == "a" else 8)))
        w_, d_ = cone(*b, *t, 6.2 if v == "a" else 5)
        whole.append(w_); dark.append(d_)
    ball = (f'<path d="{" ".join(whole)}" fill="url(#r5Steel)"/>\n'
            f'      <path d="{" ".join(dark)}" fill="#3E3D52" opacity="0.45"/>\n'
            f'      <circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#g21)"/>\n'
            f'      <circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#g22)"/>\n')
    if v == "a":
        ball += "      " + "".join(f'<path d="{d}" fill="{c}"/>' for d, c in pyramid(cx, cy, 11.5)) + "\n"
        note = ("Round 5 (A): new flail head - six fat cone spikes round the ball, and one big four-sided spike in the "
                "middle of the top face, seen from straight above (lit facets top left, dark bottom right).")
    else:
        studs = "".join(f'<circle cx="{f(cx + dx)}" cy="{f(cy + dy)}" r="4.6" fill="url(#bzgStud)"/>'
                        for dx, dy in [(-5.5, -4), (5.5, -4), (0, 6)])
        ball += "      " + studs + "\n"
        note = ("Round 5 (B): new flail head - eight short fat cone spikes round the ball, and three round domed "
                "studs on the top face instead of spikes.")
    s = s[:a0] + ball + "      " + s[b0:]
    s = set_comment(s, note)
    write5("barbarian", f"barbarian-berserker-{v}", s)


LOCK5 = ("M 61 92 C 51 103 45 116 45 130 C 45 138 46 144 49 151 L 54 145 L 59 153 L 64 144 L 69 148 "
         "C 70 137 70 126 69 115 C 68 106 66 99 61 92 Z")


def wildmane():
    s = read4("barbarian", "barbarian-wildmane-scar")
    locks = LOCK5 + " " + mirror_x(LOCK5, 100)
    s, n = re.subn(r'<path d="[^"]*" id="s12"/>', f'<path d="{locks}" id="s12"/>', s)
    assert n == 1, n
    s = set_comment(s, "Round 5: the side locks are much shorter: they end a little below the chin (were down past the shoulders).")
    write5("barbarian", "barbarian-wildmane-scar", s)


# ---------------------------------------------------------------- rogues
MASK_NAVY = ('<linearGradient id="g7" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#4B5468"/>'
             '<stop offset="1" stop-color="#30364A"/></linearGradient>')
MASK_RED = ('<linearGradient id="g7" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#D8463F"/>'
            '<stop offset="1" stop-color="#A23035"/></linearGradient>')


def bandit(v="a"):
    s = read4("rogue", "rogue-bandit-mask")
    s = sub1(s, MASK_NAVY, MASK_RED)
    s = sub1(s, 'stroke="#5D6880"', 'stroke="#7E1F26"')
    if v == "a":
        for gid, c1, c2 in [("g1", "#4B5468", "#30364A"), ("g4", "#56607A", "#353C52"), ("g6", "#56607A", "#353C52")]:
            s, n = re.subn(r'(<linearGradient id="%s"[^>]*>)<stop offset="0" stop-color="#[0-9A-F]+"/><stop offset="1" stop-color="#[0-9A-F]+"/>' % gid,
                           lambda m: m.group(1) + f'<stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/>', s)
            assert n == 1, gid
        note = "Round 5 (A): the face bandanna is red; the head scarf swapped to the old dark navy so the red reads as the bandanna."
    else:
        note = "Round 5 (B): the face bandanna is red, and the head scarf stays red too (all red)."
    s = set_comment(s, note)
    write5("rogue", f"rogue-bandit-mask-{v}", s)


def shade():
    s = read4("rogue", "rogue-shade-cape-crossed")
    s = mirror_arm(s)
    s = set_comment(s, "Round 5: the two daggers are identical, mirrored: the right hand is an exact flip of the left (blade, grip, guard, fist).")
    write5("rogue", "rogue-shade-cape-crossed", s)


def twinfang():
    s = read4("rogue", "rogue-twinfang")
    s = mirror_arm(s)
    s = set_comment(s, "Round 5: the two hooked daggers are identical, mirrored: the right hand is an exact flip of the left (shading too).")
    write5("rogue", "rogue-twinfang", s)


# ---------------------------------------------------------------- farmers
def granny(up=44, low=72):
    s = read4("farmer", "farmer-granny-reaper")
    a = math.radians(19.5)
    P = lambda d: (192 - math.sin(a) * d, 68 + math.cos(a) * d)
    g = get_group(s, "arm-r")
    paths = re.findall(r'<path d="([^"]*)" fill="url\(#gHand\)"/>', g)
    assert len(paths) == 2, len(paths)
    for d, (old, new) in zip(paths, [(80, up), (107, low)]):
        (x0, y0), (x1, y1) = P(old), P(new)
        nd = move(d, x1 - x0, y1 - y0)
        g = g.replace(f'd="{d}"', f'd="{nd}"')
    s = set_group(s, "arm-r", g)
    s = set_comment(s, f"Round 5: both hands moved the other way, up the snath toward its top end ({up} and {low} along it; round 4 had 80 and 107, round 3 64 and 102).")
    write5("farmer", "farmer-granny-reaper", s)


def haymaker():
    s = read4("farmer", "farmer-haymaker-fork")
    s = sub1(s, '<path d="M40 74 C52 100 80 110 100 110 C120 110 148 100 160 74 C164 92 140 112 100 112 C60 112 36 92 40 74 Z" fill="#C08A34" opacity="0.35"/>', '')
    s = sub1(s, '<linearGradient id="g4" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#F7DD8A"/><stop offset="1" stop-color="#DDAA48"/></linearGradient>',
             '<linearGradient id="g4" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#F8E094"/><stop offset="1" stop-color="#E2B456"/></linearGradient>')
    s = set_comment(s, "Round 5: the odd darker crescent along the inside of the brim is gone; the brim is one soft straw gradient.")
    write5("farmer", "farmer-haymaker-fork", s)


# ---------------------------------------------------------------- skeleton
def gaper(k=1.3 / 1.12, lift=5):
    s = read4("skeleton", "skeleton-gaper")
    u = 21 * 1.12; a = math.radians(-12)
    fx_, fy_ = 171 - math.sin(a) * u, 90 + math.cos(a) * u
    for gid, cx in (("arm-r", fx_), ("arm-l", 200 - fx_)):
        g = get_group(s, gid)
        head, inner = g[:g.index(">") + 1], g[g.index(">") + 1:g.rindex("</g>")]
        g = (head + f'\n<g transform="translate(0 {-lift}) translate({f(cx)} {f(fy_)}) scale({k:.4f}) translate({f(-cx)} {f(-fy_)})">'
             + inner + '</g>\n</g>')
        s = set_group(s, gid, g)
    s = set_comment(s, "Round 5: everything 30% bigger than round 3, the outline not: the skull and bones were already 1.3x; "
                       "now the swords and the bony hands are too (they were 1.12x and 1.08x). The outline stays the same width.")
    write5("skeleton", "skeleton-gaper", s)


# ---------------------------------------------------------------- game heroes kept as they were (structure checked)
def copies():
    for cls, name in [("knight", "knight-paladin"), ("knight", "knight-tower")]:
        write5(cls, name, read4(cls, name))
    a = (R4.parent / "class-round2" / "archer" / "archer.svg").read_text(encoding="utf-8")
    write5("archer", "archer", a)


ALL = {"griffon": griffon, "bearskin": lambda: (bearskin("a"), bearskin("b")),
       "berserker": lambda: (berserker("a"), berserker("b")), "wildmane": wildmane,
       "bandit": lambda: (bandit("a"), bandit("b")), "shade": shade, "twinfang": twinfang,
       "granny": granny, "haymaker": haymaker, "gaper": gaper, "copies": copies}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(ALL):
        ALL[n]()
    print("ok")
