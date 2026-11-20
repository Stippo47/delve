"""Round 4, H1: ten caster heroes. python casters.py [names...] writes the SVGs into ../../heroes-casters/."""
import math, sys
from lib import Sprite, HEAD, SHOULDERS, ang, dist

PIV_L, PIV_R = "46 108", "154 108"


# ------------------------------------------------------------------ geometry helpers
def shoulders(s, top, bottom, trim=None, trim_w=9):
    """Robe shoulders; trim = a band of colour along the front (lower) edge."""
    g = s.grad(top, bottom)
    det = []
    if trim:
        det = [f'<rect x="0" y="0" width="200" height="200" fill="{trim}"/>',
               f'<path d="{SHOULDERS}" transform="translate(0 {-trim_w})" fill="{g}"/>']
    return s.shape(SHOULDERS, g, details=det)


def capsule(x1, y1, x2, y2, w):
    """A rounded bar from (x1,y1) to (x2,y2), width w (same winding every time, so several union cleanly)."""
    L = dist(x1, y1, x2, y2) or 1
    nx, ny = -(y2 - y1) / L * w / 2, (x2 - x1) / L * w / 2
    r = w / 2
    return (f"M {x1 + nx:.1f} {y1 + ny:.1f} L {x2 + nx:.1f} {y2 + ny:.1f} A {r} {r} 0 0 0 {x2 - nx:.1f} {y2 - ny:.1f} "
            f"L {x1 - nx:.1f} {y1 - ny:.1f} A {r} {r} 0 0 0 {x1 + nx:.1f} {y1 + ny:.1f} Z")


def pole(s, B, F, w, fill):
    """A straight shaft from back end B to front end F. Returns (transform at F, angle)."""
    a = ang(*B, *F)
    s.shape(capsule(*B, *F, w), fill, shadow=0)
    return f"translate({F[0]:.1f} {F[1]:.1f}) rotate({a:.2f})", a


def point_on(B, F, t):
    L = dist(*B, *F)
    return B[0] + (F[0] - B[0]) * t / L, B[1] + (F[1] - B[1]) * t / L


def grip(B, F, P):
    """The point on B->F nearest P (where the fist goes)."""
    L = dist(*B, *F)
    ux, uy = (F[0] - B[0]) / L, (F[1] - B[1]) / L
    t = (P[0] - B[0]) * ux + (P[1] - B[1]) * uy
    return point_on(B, F, t)


def circle(x, y, r):
    return f"M {x - r:.1f} {y:.1f} A {r} {r} 0 1 0 {x + r:.1f} {y:.1f} A {r} {r} 0 1 0 {x - r:.1f} {y:.1f} Z"


def arc_puffs(cx, cy, rx, ry, a0, a1, n, r):
    """A chain of circles along an elliptical arc (degrees, 0 = right, 90 = up): fur, curls."""
    d = []
    for k in range(n):
        t = math.radians(a0 + (a1 - a0) * k / (n - 1))
        d.append(circle(cx + rx * math.cos(t), cy - ry * math.sin(t), r))
    return " ".join(d)


def shard(bx, by, tx, ty, w, at=0.35):
    """A long diamond from base (bx,by) to tip (tx,ty)."""
    L = dist(bx, by, tx, ty)
    ux, uy = (tx - bx) / L, (ty - by) / L
    px, py = -uy, ux
    mx, my = bx + ux * L * at, by + uy * L * at
    return (f"M {bx:.1f} {by:.1f} L {mx + px * w / 2:.1f} {my + py * w / 2:.1f} L {tx:.1f} {ty:.1f} "
            f"L {mx - px * w / 2:.1f} {my - py * w / 2:.1f} Z")


def mirror(d):
    """Mirror a path of absolute M/L/C/Q/A/Z commands about x = 100."""
    out, toks, i, cmd = [], d.replace(",", " ").split(), 0, None
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t
            out.append(t)
            i += 1
            continue
        if cmd == "A":
            rx, ry, rot, la, sw, x, y = toks[i:i + 7]
            out += [rx, ry, f"{-float(rot):g}", la, str(1 - int(sw)), f"{200 - float(x):g}", y]
            i += 7
        else:
            out += [f"{200 - float(toks[i]):g}", toks[i + 1]]
            i += 2
    return " ".join(out)


def free_fist(s, side="l", x=None):
    """An empty fist at the front edge of the body, drawn over it (as Wildmane's)."""
    if side == "l":
        s.group("arm-l", PIV_L)
        s.fist(x or 57, 140, 0, w=24, h=21, under=False)
    else:
        s.group("arm-r", PIV_R)
        s.fist(x or 143, 140, 0, w=24, h=21, under=False)


# =====================================================================================================
def pyromancer():
    s = Sprite("caster-pyromancer",
               "PYROMANCER (fire mage): hair that is a fire, streaming back off the head in three tongues; dark red robe "
               "with a gold edge; both fists in front holding a fireball (two-handed: both hands + the fireball in arm-r, no arm-l).")
    s.group("arm-r", PIV_R)
    ball = ("M 100 204 C 84 204 74 193 74 180 C 74 168 80 161 88 155 C 88 162 91 165 95 163 C 93 153 98 145 107 139 "
            "C 104 149 109 156 117 159 C 123 164 126 171 126 180 C 126 193 116 204 100 204 Z")
    core = ("M 100 196 C 90 196 84 189 84 181 C 84 174 88 169 93 165 C 94 170 97 171 99 170 C 99 163 103 158 108 154 "
            "C 108 161 112 166 115 169 C 116 173 116 177 116 181 C 116 189 110 196 100 196 Z")
    s.shape(ball, s.grad("#FF9A3C", "#D8361E"), shadow=0,
            details=[f'<path d="{core}" fill="#FFD44E"/>',
                     '<ellipse cx="97" cy="185" rx="9" ry="8" fill="#FFF6D2"/>'])
    s.fist(73, 168, a=-30, w=20, h=24)
    s.fist(127, 168, a=30, w=20, h=24)
    s.group("body")
    shoulders(s, "#B8322A", "#701A1C", trim="#E9A93A", trim_w=10)
    s.head()
    hair = ("M 50 112 C 44 88 47 66 57 52 C 52 40 50 28 55 12 C 63 26 71 34 80 39 C 81 24 89 10 100 -2 "
            "C 108 12 115 24 118 38 C 127 32 135 24 144 12 C 149 28 148 42 143 52 C 153 66 156 88 150 112 "
            "C 145 102 136 97 126 98 C 120 102 110 104 100 101 C 90 104 80 102 74 98 C 64 97 55 102 50 112 Z")
    flame = s.ygrad([(0, "#D7301C"), (0.45, "#F26B22"), (1, "#FFAA36")], 0, 110)
    tongues = ("M 66 100 C 60 82 64 64 72 52 C 76 62 82 68 90 70 C 90 54 96 38 102 26 C 108 40 110 54 111 66 "
               "C 117 60 124 54 128 46 C 134 62 136 80 132 100 C 122 94 110 97 100 96 C 88 98 76 94 66 100 Z")
    s.shape(hair, flame, dy=4, shadow=0.3,
            details=[f'<path d="{tongues}" fill="#FFC948" opacity="0.75"/>',
                     '<path d="M 84 100 C 82 90 86 82 92 76 C 94 84 98 88 104 88 C 110 84 114 80 116 76 C 120 84 120 92 116 100 Z" fill="#FFE98A" opacity="0.8"/>'])
    return s


def snowflake(r=21, w=7):
    d = []
    for k in range(6):
        t = math.radians(90 + 60 * k)
        ex, ey = r * math.cos(t), r * math.sin(t)
        d.append(capsule(0, 0, ex, ey, w))
        bx, by = 0.58 * ex, 0.58 * ey
        for side in (-1, 1):
            u = t + side * math.radians(48)
            d.append(capsule(bx, by, bx + 9 * math.cos(u), by + 9 * math.sin(u), 5.5))
    return " ".join(d)


def frost():
    s = Sprite("caster-frost",
               "FROST MAGE: round pale-blue hood with a thick white fur ruff round the face, ice shards growing out of the "
               "shoulders, a long frosted staff with a big snowflake on the end, held forward in the right fist (behind "
               "the body); empty left fist.")
    B, F = (184, 50), (150, 168)
    s.group("arm-r", PIV_R)
    tf, a = pole(s, B, F, 9, s.grad("#F2F7FB", "#93A9BD", x2=1, y2=0))
    flake = f"translate({F[0]:.1f} {F[1]:.1f}) rotate({a:.2f}) translate(0 12)"
    s.shape(snowflake(), s.rgrad("#FFFFFF", "#8FD0EE", cx=0.4, cy=0.35, r=0.75), tf=flake, shadow=0, shade="sRl",
            details=[f'<circle cx="0" cy="0" r="7" fill="#E8F8FF" transform="{flake}"/>'])
    fx, fy = grip(B, F, (151, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#9ED3EA", "#4E8DB8", trim="#F2FAFF", trim_w=8)
    for base, tip, w in [((50, 92), (22, 60), 15), ((38, 106), (6, 96), 13)]:
        g = s.grad("#F2FDFF", "#8ACFEA")
        s.shape(shard(*base, *tip, w), g, dy=3, shadow=0.25)
        s.shape(shard(200 - base[0], base[1], 200 - tip[0], tip[1], w), g, dy=3, shadow=0.25)
    s.head()
    hood = "M 45 122 C 34 72 60 34 100 34 C 140 34 166 72 155 122 C 150 106 132 98 100 98 C 68 98 50 106 45 122 Z"
    s.shape(hood, s.grad("#C4EAF8", "#6FA9CC"), dy=4, shadow=0.3,
            details=['<path d="M 100 34 C 96 56 96 80 100 98 L 112 98 C 108 78 106 56 104 34 Z" fill="#4F8DB8" opacity="0.25"/>',
                     '<path d="M 62 52 C 56 66 54 82 56 100 L 64 100 C 62 84 64 68 70 54 Z" fill="#FFFFFF" opacity="0.2"/>'])
    fur = arc_puffs(100, 128, 48, 36, -24, 204, 12, 11.5)
    s.shape(fur, s.rgrad("#FFFFFF", "#C8D9E6"), dy=3, shadow=0.25, shade="sRl")
    free_fist(s, "l")
    return s


def storm():
    s = Sprite("caster-storm",
               "STORM MAGE: deep-blue wizard hat, its long tip bent back into a yellow lightning bolt; long white beard "
               "out in front; a lightning bolt gripped like a javelin in the right fist (behind the body), empty left fist.")
    s.group("arm-r", PIV_R)
    fx, fy, a = 149, 141, 14
    tf = f"translate({fx} {fy}) rotate({a})"
    bolt = "M -5 -46 L 10 -46 L 5 -6 L 15 -6 L 1 30 L 10 30 L -7 70 L -4 38 L -14 38 L -4 4 L -13 4 Z"
    s.shape(bolt, s.grad("#FFF4A8", "#F2B11E"), tf=tf, shadow=0,
            details=['<path d="M -5 -46 L 2 -46 L -3 -4 L 6 -4 L -6 34 L -1 34 L -7 70 L -14 38 L -4 4 L -13 4 Z" fill="#FFFFFF" opacity="0.4"/>'])
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#3F52B4", "#1F2766", trim="#F5C842", trim_w=8)
    s.head()
    beard = ("M 66 124 C 70 140 80 150 90 156 C 92 168 96 180 100 192 C 104 180 108 168 110 156 C 120 150 130 140 134 124 "
             "C 124 138 112 144 100 144 C 88 144 76 138 66 124 Z")
    s.shape(beard, s.grad("#FFFFFF", "#BCC6D6"), dy=3, shadow=0.25, shade="sRl")
    brim = "M 40 88 C 40 64 68 54 100 54 C 132 54 160 64 160 88 C 160 110 132 117 100 117 C 68 117 40 110 40 88 Z"
    s.shape(brim, s.grad("#4C60C6", "#26307A"), dy=4, shadow=0.3)
    cone = ("M 70 90 C 66 68 78 50 90 36 L 82 26 L 100 26 L 94 2 L 120 32 L 106 32 L 110 40 "
            "C 122 56 134 72 130 90 C 118 99 82 99 70 90 Z")
    cg = s.ygrad([(0, "#6B7EE0"), (0.4, "#4558C2"), (1, "#202A70")], 0, 0, x1=70, x2=130)
    s.shape(cone, cg, dy=4, shadow=0.34,
            details=['<path d="M 60 41 L 140 41 L 140 -10 L 60 -10 Z" fill="#F7C93C"/>',
                     '<path d="M 60 41 L 140 41 L 140 36 L 60 36 Z" fill="#FFE27A"/>'])
    free_fist(s, "l")
    return s


def necromancer():
    s = Sprite("caster-necromancer",
               "NECROMANCER: a deep charcoal-green hood with a long drooping tail and a torn hem on the shoulders; a green ghost-flame over the left fist; a bone staff with a "
               "skull on the end (green glow in the sockets) held forward in the right fist (behind the body).")
    B, F = (182, 48), (150, 156)
    s.group("arm-r", PIV_R)
    tf, a = pole(s, B, F, 9, s.grad("#E6DDC6", "#A89C80", x2=1, y2=0))
    sk = tf
    skull = "M -15 14 C -15 2 -8 -4 0 -4 C 8 -4 15 2 15 14 C 15 22 12 27 9 30 L 9 37 L -9 37 L -9 30 C -12 27 -15 22 -15 14 Z"
    s.shape(skull, s.grad("#FBF6E8", "#C4B898"), tf=sk, shadow=0, shade="sRl",
            details=[f'<g transform="{sk}"><ellipse cx="-6" cy="21" rx="5" ry="5.5" fill="#3A3346"/><ellipse cx="6" cy="21" rx="5" ry="5.5" fill="#3A3346"/>'
                     f'<circle cx="-6" cy="21.5" r="2.4" fill="#A8F060"/><circle cx="6" cy="21.5" r="2.4" fill="#A8F060"/>'
                     f'<path d="M -2 30 L 0 26 L 2 30 Z" fill="#3A3346"/></g>'])
    fx, fy = grip(B, F, (151, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#5E6B68", "#2C3533", trim="#C9BE9E", trim_w=7)
    s.head()
    hood = ("M 36 140 C 24 96 40 54 74 40 C 70 26 60 14 44 4 C 66 4 86 14 98 34 C 140 34 174 76 164 140 "
            "L 157 130 L 151 140 L 146 128 C 142 110 124 98 100 98 C 76 98 58 110 54 128 L 49 140 L 43 130 Z")
    s.shape(hood, s.grad("#77857F", "#2E3836"), dy=5, shadow=0.42,
            details=['<path d="M 56 60 C 46 80 44 104 48 130 L 58 126 C 54 104 56 82 64 62 Z" fill="#FFFFFF" opacity="0.12"/>',
                     '<path d="M 116 40 C 128 60 134 86 132 110 L 146 118 C 148 90 142 62 128 42 Z" fill="#1E2624" opacity="0.25"/>'])
    s.group("arm-l", PIV_L)
    wisp = ("M 58 186 C 46 186 40 176 44 166 C 46 160 50 156 50 148 C 56 152 58 158 58 162 C 60 156 64 152 64 144 "
            "C 72 152 74 162 72 170 C 74 180 68 186 58 186 Z")
    s.shape(wisp, s.grad("#C8FF8A", "#4FB82A"), shadow=0, shade="sRl",
            details=['<path d="M 58 180 C 52 180 49 175 51 169 C 53 165 56 163 57 158 C 61 163 64 168 64 172 C 65 177 62 180 58 180 Z" fill="#F0FFD8" opacity="0.85"/>'])
    s.fist(57, 140, 0, w=24, h=21, under=False)
    return s


def druid():
    s = Sprite("caster-druid",
               "DRUID: long chestnut hair with a leaf circlet and a big pair of branching antlers; moss-green mantle; "
               "a gnarled wooden staff with a curled crook and leaves, held forward in the right fist (behind the body); "
               "empty left fist.")
    B, F = (184, 56), (148, 158)
    s.group("arm-r", PIV_R)
    wood = s.grad("#C08A55", "#7A4E2A", x2=1, y2=0)
    tf, a = pole(s, B, F, 10, wood)
    curl = ("M 0 -2 C 2 12 0 24 -10 29 C -22 34 -31 24 -27 13 C -24 5 -15 4 -12 11")
    s.raw(f'<path d="{curl}" transform="{tf}" fill="none" stroke="#9E6B3C" stroke-width="10" stroke-linecap="round"/>')
    leaf = "M 0 0 C 6 -6 16 -6 22 0 C 16 6 6 6 0 0 Z"
    lg = s.grad("#9CCB55", "#4E7F26")
    s.shape(leaf, lg, tf=f"{tf} translate(2 10) rotate(30)", shadow=0, shade="sRl")
    s.shape(leaf, lg, tf=f"{tf} translate(-2 6) rotate(150)", shadow=0, shade="sRl")
    fx, fy = grip(B, F, (151, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#8DA843", "#4C6623", trim="#7A5230", trim_w=8)
    s.head()
    hair = ("M 44 144 C 32 86 58 46 100 46 C 142 46 168 86 156 144 C 150 142 146 134 146 122 C 145 110 140 102 132 98 "
            "C 120 102 110 100 100 96 C 90 100 80 102 68 98 C 60 102 55 110 54 122 C 54 134 50 142 44 144 Z")
    s.shape(hair, s.grad("#9C6236", "#5A3418"), dy=4, shadow=0.3,
            details=['<path d="M 66 56 C 60 72 60 90 64 104 L 72 100 C 68 86 70 70 76 54 Z" fill="#C88A55" opacity="0.4"/>'])
    # antlers: beams and tines as round bars, mirrored
    L = [capsule(84, 66, 62, 40, 12), capsule(62, 40, 44, 12, 10), capsule(64, 44, 34, 46, 9),
         capsule(50, 22, 58, 0, 8), capsule(45, 13, 24, 8, 8)]
    ant = " ".join(L + [mirror(x) for x in L])
    s.shape(ant, s.grad("#F1E2C2", "#B39A70"), dy=4, shadow=0.3)
    # leaf circlet on the hairline
    for (x, y, r) in [(66, 98, 200), (82, 92, 185), (100, 90, 270), (118, 92, -5), (134, 98, -20)]:
        s.shape(leaf, lg, tf=f"translate({x} {y}) rotate({r}) translate(-11 0)", dy=2, shadow=0.2, shade="sRl")
    free_fist(s, "l")
    return s


def shaman():
    s = Sprite("caster-shaman",
               "SHAMAN: a carved totem with spread wings strapped to the back, rising behind the head; dark hair with two "
               "long braids and a terracotta headband; teal robe; a feathered spirit-stick held forward in the LEFT fist "
               "(behind the body); empty right fist.")
    s.group("back", "100 90")
    s.shape(capsule(100, 96, 100, 18, 13), s.grad("#C48A55", "#875A30", x2=1, y2=0), shadow=0)
    wing = "M 96 30 C 84 18 64 12 44 16 C 50 22 54 26 52 30 C 60 30 64 34 62 38 C 72 36 84 38 96 44 Z"
    wg = s.ygrad([(0, "#F4EEDC"), (0.35, "#2FB3A4"), (1, "#1E7A70")], 0, 0, x1=44, x2=96)
    s.shape(wing, wg, shadow=0, shade="sRl")
    wg2 = s.ygrad([(0, "#F4EEDC"), (0.35, "#2FB3A4"), (1, "#1E7A70")], 0, 0, x1=156, x2=104)
    s.shape(mirror(wing), wg2, shadow=0)
    s.shape("M 86 8 C 86 2 114 2 114 8 L 114 40 C 114 46 86 46 86 40 Z", s.grad("#E07A44", "#A8481E"), dy=3, shadow=0.3,
            details=['<rect x="86" y="18" width="28" height="6" fill="#2FB3A4"/>', '<path d="M 94 30 L 100 40 L 106 30 Z" fill="#F4EEDC"/>'])
    B, F = (32, 92), (56, 168)
    s.group("arm-l", PIV_L)
    tf, a = pole(s, B, F, 8, s.grad("#C48A55", "#875A30", x2=1, y2=0))
    feather = "M 0 0 C 7 8 8 22 0 34 C -8 22 -7 8 0 0 Z"
    for r in (-26, 26, 0):
        s.shape(feather, s.ygrad([(0, "#F4EEDC"), (0.6, "#F4EEDC"), (0.61, "#D9532B"), (1, "#B83A1C")], -2, 36),
                tf=f"{tf} rotate({r}) translate(0 -4)", shadow=0, shade="sRl")
    s.raw(f'<rect x="-6" y="-8" width="12" height="7" rx="3" transform="{tf}" fill="#2FB3A4"/>')
    fx, fy = grip(B, F, (49, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#38B0A2", "#1C6F67", trim="#D7713C", trim_w=8)
    s.head()
    hair = ("M 48 126 C 38 78 62 46 100 46 C 138 46 162 78 152 126 C 146 112 140 102 130 98 C 120 98 108 96 100 90 "
            "C 92 96 80 98 70 98 C 60 102 54 112 48 126 Z")
    s.shape(hair, s.grad("#6A4532", "#3E2618"), dy=4, shadow=0.3,
            details=['<path d="M 66 58 C 60 74 60 92 64 106 L 72 102 C 68 88 70 72 76 56 Z" fill="#A0705A" opacity="0.35"/>'])
    band = "M 52 96 C 66 86 84 82 100 82 C 116 82 134 86 148 96 L 149 106 C 134 96 116 92 100 92 C 84 92 66 96 51 106 Z"
    s.shape(band, s.grad("#E5824A", "#A8481E"), dy=2, shadow=0.25)
    for sx in (1, -1):
        cx = 100 - sx * 52
        pl = " ".join(circle(cx - sx * k * 1.2, 112 + k * 9.5, 8) for k in range(5))
        s.shape(pl, s.grad("#7A5038", "#3E2618"), dy=3, shadow=0.28)
        s.shape(capsule(cx - sx * 6, 152, cx - sx * 6.5, 164, 9), s.grad("#E5824A", "#A8481E"), dy=2, shadow=0.25)
    feather = "M 0 0 C 6 -8 8 -22 2 -36 C -6 -24 -7 -10 0 0 Z"
    s.shape(feather, s.ygrad([(0, "#F4EEDC"), (0.55, "#F4EEDC"), (0.56, "#2FB3A4"), (1, "#1E7A70")], 0, -36),
            tf="translate(52 98) rotate(-50)", dy=3, shadow=0.25, shade="sRl")
    free_fist(s, "r")
    return s


def witch():
    s = Sprite("caster-witch",
               "WITCH: a huge violet witch hat (wide brim, crooked tip, green band), dark-green hair falling at the sides; "
               "a broom held forward in the LEFT fist, bristles first (behind the body); empty right fist.")
    B, F = (14, 56), (56, 160)
    s.group("arm-l", PIV_L)
    tf, a = pole(s, B, F, 8, s.grad("#B88250", "#7A4E2A", x2=1, y2=0))
    bristle = "M -7 -2 L 7 -2 C 12 10 17 24 19 36 C 10 42 -10 42 -19 36 C -17 24 -12 10 -7 -2 Z"
    s.shape(bristle, s.grad("#F0D27A", "#B58A30"), tf=tf, shadow=0,
            details=[f'<g transform="{tf}"><rect x="-12" y="4" width="24" height="6" fill="#A8333A"/>'
                     '<path d="M -4 14 L -8 40 L -5 40 L -1 14 Z M 5 14 L 7 40 L 10 40 L 8 14 Z" fill="#9C7426" opacity="0.5"/></g>'])
    fx, fy = grip(B, F, (49, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#7E4AAE", "#43246A")
    s.head()
    for d in ["M 52 104 C 46 124 50 142 62 154 C 64 140 66 124 66 106 Z"]:
        g = s.grad("#4E8A5C", "#24452E")
        s.shape(d, g, dy=3, shadow=0.25)
        s.shape(mirror(d), g, dy=3, shadow=0.25)
    brim = "M 18 76 C 18 46 56 28 100 28 C 144 28 182 46 182 76 C 182 104 144 120 100 120 C 56 120 18 104 18 76 Z"
    s.shape(brim, s.grad("#8A55BC", "#3E2066"), dy=5, shadow=0.34,
            details=['<path d="M 30 86 C 48 110 80 118 100 118 C 120 118 152 110 170 86 C 176 100 150 124 100 124 C 50 124 24 100 30 86 Z" fill="#B48ADC" opacity="0.35"/>'])
    crown = ("M 68 82 C 62 58 72 40 88 30 C 96 24 100 14 92 -2 C 110 2 120 14 116 30 C 128 42 136 60 132 82 "
             "C 118 94 82 94 68 82 Z")
    s.shape(crown, s.grad("#9662C8", "#4A2876"), dy=5, shadow=0.36,
            details=['<path d="M 60 82 L 140 82 L 140 68 C 120 78 80 78 60 68 Z" fill="#8CC84A"/>',
                     '<rect x="93" y="72" width="14" height="12" rx="2" fill="#F2C94C"/>'])
    free_fist(s, "r")
    return s


def cultist():
    s = Sprite("caster-cultist",
               "CULTIST: a heavy blood-red hooded mantle low over a smooth, featureless gold mask; "
               "a wavy ritual dagger in the right fist and a dark grimoire in the left (both behind the body).")
    s.group("arm-l", PIV_L)
    fx, fy, a = 54, 141, -12
    tf = f"translate({fx} {fy}) rotate({a})"
    book = "M -16 2 L 16 2 C 18 2 19 3 19 5 L 19 44 C 19 46 18 47 16 47 L -16 47 C -18 47 -19 46 -19 44 L -19 5 C -19 3 -18 2 -16 2 Z"
    s.shape(book, s.grad("#4B3C66", "#241B36"), tf=tf, shadow=0,
            details=[f'<g transform="{tf}"><rect x="13" y="4" width="6" height="41" fill="#EFE3C4"/>'
                     '<path d="M -19 36 L -8 47 L -19 47 Z M 19 36 L 8 47 L 19 47 Z" fill="#E7B444"/>'
                     '<circle cx="0" cy="26" r="7" fill="#E7B444"/><circle cx="0" cy="26" r="3.5" fill="#8E2433"/></g>'])
    s.fist(fx, fy, a)
    s.group("arm-r", PIV_R)
    fx, fy, a = 147, 141, 10
    tf = f"translate({fx} {fy}) rotate({a})"
    blade = "M -6 12 C -10 20 -2 26 -6 34 C -10 42 -2 48 -3 54 L 0 66 L 3 54 C 6 46 10 40 6 32 C 2 26 10 18 6 12 Z"
    s.shape(blade, s.grad("#F4F6F9", "#8E96A4", x2=1, y2=0), tf=tf, shadow=0)
    s.shape("M -15 8 C -15 5 15 5 15 8 L 15 13 C 15 16 -15 16 -15 13 Z", s.grad("#F6CF63", "#C48A22"), tf=tf, shadow=0)
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#6E1A26", "#3E0E16")
    # a smooth gold mask, no features, where the face would be
    mask = s.ygrad([(0, "#7A5A1E"), (0.22, "#C99A34"), (0.5, "#F6D477"), (0.85, "#F2CC66"), (1, "#D9A840")], 94.8, 153.1)
    from lib import HEAD
    s.shape(HEAD, mask, dy=5, shadow=0.3, shade="sRl",
            details=['<path d="M 80 112 C 78 124 80 138 86 146 L 92 146 C 88 136 86 124 88 112 Z" fill="#FFF4C8" opacity="0.55"/>'])
    hood = ("M 32 130 C 20 76 56 30 100 30 C 144 30 180 76 168 130 "
            "C 164 140 150 142 140 136 C 134 120 120 112 100 112 C 80 112 66 120 60 136 C 50 142 36 140 32 130 Z")
    hg = s.grad("#A8303C", "#5A1220")
    s.shape(hood, hg, dy=5, shadow=0.38,
            details=['<rect x="0" y="0" width="200" height="200" fill="#3A0A12"/>',
                     f'<path d="{hood}" transform="translate(0 -6)" fill="{hg}"/>',
                     '<path d="M 64 48 C 52 66 48 88 50 112 L 60 110 C 58 88 62 68 72 50 Z" fill="#5A1220" opacity="0.35"/>',
                     '<path d="M 98 30 C 94 54 94 78 97 100 L 105 100 C 102 78 102 54 104 30 Z" fill="#5A1220" opacity="0.28"/>',
                     '<path d="M 136 50 C 146 66 150 86 150 108 L 142 112 C 142 90 138 70 130 54 Z" fill="#5A1220" opacity="0.3"/>'])
    return s


def warlock():
    s = Sprite("caster-warlock",
               "WARLOCK (demon pact): two long horns sweeping back from the brow, slicked violet-black hair with a "
               "widow's peak; dark coat with a magenta edge; a short gold sceptre with a magenta demon-eye orb held "
               "forward in the right fist (behind the body); empty left fist.")
    B, F = (166, 100), (152, 156)
    s.group("arm-r", PIV_R)
    tf, a = pole(s, B, F, 8, s.grad("#F6CF63", "#B07A1E", x2=1, y2=0))
    orb = circle(0, 16, 17)
    s.shape(orb, s.rgrad("#FF9AD2", "#B0186A", cx=0.38, cy=0.32, r=0.75, mid="#E8389A"), tf=tf, shadow=0, shade="sRl",
            details=[f'<g transform="{tf}"><ellipse cx="0" cy="17" rx="3.5" ry="10" fill="#3A0E2A"/>'
                     '<ellipse cx="-6" cy="9" rx="4" ry="3" fill="#FFFFFF" opacity="0.6"/></g>'])
    s.raw(f'<path d="M -9 -4 L 9 -4 L 7 2 L -7 2 Z" transform="{tf}" fill="#E0A83A"/>')
    fx, fy = grip(B, F, (151, 140))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#56406E", "#2E2240", trim="#E0388E", trim_w=8)
    s.head()
    hair = ("M 52 112 C 42 76 62 46 100 46 C 138 46 158 76 148 112 C 140 102 128 96 116 96 C 110 96 104 100 100 110 "
            "C 96 100 90 96 84 96 C 72 96 60 102 52 112 Z")
    s.shape(hair, s.grad("#6E4C8E", "#33224A"), dy=4, shadow=0.32,
            details=['<path d="M 70 52 C 66 66 66 82 70 96 L 76 94 C 74 80 74 66 78 52 Z" fill="#B08AD0" opacity="0.35"/>'])
    horn = "M 70 78 C 66 54 56 30 36 4 C 56 14 74 32 84 52 C 88 60 90 68 90 74 Z"
    hg = s.ygrad([(0, "#F4ECDC"), (0.55, "#C9B49A"), (1, "#6A4A48")], 4, 78)
    s.shape(horn, hg, dy=4, shadow=0.32)
    s.shape(mirror(horn), hg, dy=4, shadow=0.32)
    free_fist(s, "l")
    return s


def alchemist():
    s = Sprite("caster-alchemist",
               "ALCHEMIST: brown leather cap with a brass band and a flip-up brass loupe, white hair puffing out at the sides, "
               "a strap of six corked vials over the shoulders; a round flask of green brew held by the neck, forward in the right fist "
               "(behind the body), to throw; empty left fist.")
    s.group("arm-r", PIV_R)
    fx, fy, a = 148, 141, 10
    tf = f"translate({fx} {fy}) rotate({a})"
    s.shape("M -5.5 0 L 5.5 0 L 5.5 24 L -5.5 24 Z", s.grad("#E8F4F2", "#9FC0BC", x2=1, y2=0), tf=tf, shadow=0)
    bulb = circle(0, 38, 18)
    s.shape(bulb, s.grad("#EAF6F4", "#A9C8C4"), tf=tf, shadow=0, shade="sRl",
            details=[f'<g transform="{tf}"><path d="M -18 38 C -10 34 10 42 18 38 L 18 60 L -18 60 Z" fill="#7CD63A"/>'
                     '<path d="M -18 38 C -10 34 10 42 18 38 L 18 42 C 10 46 -10 38 -18 42 Z" fill="#B8F070"/>'
                     '<circle cx="-4" cy="47" r="3" fill="#D8FFA8"/><circle cx="5" cy="51" r="2" fill="#D8FFA8"/>'
                     '<ellipse cx="-8" cy="31" rx="4" ry="6" fill="#FFFFFF" opacity="0.7"/></g>'])
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#C08A4E", "#704524", trim="#5A3A22", trim_w=8)
    strap = "M 28 100 C 40 80 70 74 100 74 C 130 74 160 80 172 100 L 170 110 C 158 90 130 84 100 84 C 70 84 42 90 30 110 Z"
    s.shape(strap, s.grad("#6A4428", "#3E2614"), dy=2, shadow=0.25)
    vial = "M -8 -16 L 8 -16 L 8 12 C 8 17 4 20 0 20 C -4 20 -8 17 -8 12 Z"
    for (x, y, r, c) in [(33, 98, -66, "#E5508E"), (45, 86, -48, "#F4C430"), (61, 79, -26, "#3BB6E0"),
                         (167, 98, 66, "#A060E0"), (155, 86, 48, "#FF8A3A"), (139, 79, 26, "#E5508E")]:
        t = f"translate({x} {y}) rotate({r}) scale(0.9)"
        s.shape(vial, s.grad("#F4FAFA", "#B6CAC8"), tf=t, dy=3, shadow=0.28, shade="sRl",
                details=[f'<path d="M -8 -2 L 8 -2 L 8 12 C 8 17 4 20 0 20 C -4 20 -8 17 -8 12 Z" transform="{t}" fill="{c}"/>'])
        s.shape("M -6 -23 L 6 -23 L 6 -15 L -6 -15 Z", s.grad("#B07A48", "#6A4022"), tf=t, dy=2, shadow=0.2)
    s.head()
    puffs = arc_puffs(100, 106, 50, 20, 150, 215, 4, 10)
    s.shape(puffs, s.rgrad("#FFFFFF", "#C9CCD4"), dy=3, shadow=0.25, shade="sRl")
    s.shape(mirror(puffs), s.rgrad("#FFFFFF", "#C9CCD4"), dy=3, shadow=0.25, shade="sRl")
    cap = "M 52 104 C 46 70 66 46 100 46 C 134 46 154 70 148 104 C 136 96 120 92 100 92 C 80 92 64 96 52 104 Z"
    s.shape(cap, s.grad("#B07A48", "#6A4022"), dy=4, shadow=0.3,
            details=['<path d="M 50 84 C 70 76 130 76 150 84 L 150 94 C 130 86 70 86 50 94 Z" fill="#E2B04A"/>',
                     '<path d="M 70 50 C 62 62 60 74 62 86 L 70 84 C 68 72 70 62 76 52 Z" fill="#E0A870" opacity="0.4"/>'])
    # a brass loupe flipped up on the right side of the cap
    s.shape(capsule(132, 84, 150, 62, 12), s.grad("#F6D477", "#A87A22"), dy=3, shadow=0.3)
    s.shape(circle(152, 58, 11), s.grad("#F6D477", "#A87A22"), dy=3, shadow=0.3, shade="sRl",
            details=['<circle cx="152" cy="58" r="7" fill="#7FD8C4"/><circle cx="149.5" cy="55.5" r="2.6" fill="#EFFFFA"/>'])
    free_fist(s, "l")
    return s


HEROES = {"pyromancer": pyromancer, "frost": frost, "storm": storm, "necromancer": necromancer, "druid": druid,
          "shaman": shaman, "witch": witch, "cultist": cultist, "warlock": warlock, "alchemist": alchemist}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(HEROES):
        print(HEROES[n]().write().name)
