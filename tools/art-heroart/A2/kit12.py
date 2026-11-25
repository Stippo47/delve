"""Round 12: pieces shared by the new heroes (heroes12.py), the Mob (mob12.py), the props (props12.py) and the heroes'
new weapon parts (parts12.py). All in the heroes' A2 library (lib.py, common.py: round 11's, copied; lib.py's group()
takes a transform now). The casters of rounds 4 and 5 were drawn with an older builder (class-round7/_src/casters); the
numbers that make a mage one of them are copied here from it: the hood, the staff's line over the right shoulder, the
free fist, the robe's trim."""
import math
from common import *

hi = lambda x, y, rx, ry, o=0.22, rot=0: (f'<path d="{ell(x, y, rx, ry)}" fill="#FFFFF4" opacity="{o}"'
                                           + (f' transform="rotate({rot} {x} {y})"' if rot else "") + "/>")
HOOD = "M 46 124 C 36 76 62 38 100 38 C 138 38 164 76 154 124 C 148 106 130 98 100 98 C 70 98 52 106 46 124 Z"
FLAME = ('<linearGradient id="gFlame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB23A"/>'
         '<stop offset="1" stop-color="#E8542A"/></linearGradient>')
IRON, DIRON = "#AEB5C1", "#6E747E"


def ang(x1, y1, x2, y2):
    """The rotation that turns local +y into the direction (x1, y1) -> (x2, y2)."""
    return math.degrees(math.atan2(-(x2 - x1), y2 - y1))


def robe(S, col, trim=None, w=9, decor="", d=SHOULDERS):
    """The casters' robe: the shoulders, with a band of trim along the front edge."""
    dec = decor
    if trim:
        g, sd = S._grad(col, "fill"), S._grad(col, "side")
        dec = (f'<rect x="0" y="60" width="200" height="110" fill="{trim}"/>'
               f'<path d="{d}" transform="translate(0 {-w})" fill="url(#{g})"/>'
               f'<rect x="26" y="60" width="148" height="110" fill="url(#{sd})"/>') + decor
    return S.shape(d, col, decor=dec)


def pole(S, B, F, w, col, decor="", shadow=0):
    """A straight shaft from its back end B to its front end F. Returns (the frame at F, +y on past F; the angle)."""
    a, L = ang(*B, *F), math.dist(B, F)
    T = frame(F[0], F[1], a)
    S.shape(rr(0, -L / 2, w, L, w / 2), col, T=T, shadow=shadow, decor=decor)
    return T, a


def grip(B, F, P):
    """The point on B -> F nearest P (where the fist goes)."""
    L = math.dist(B, F)
    ux, uy = (F[0] - B[0]) / L, (F[1] - B[1]) / L
    t = (P[0] - B[0]) * ux + (P[1] - B[1]) * uy
    return B[0] + ux * t, B[1] + uy * t


def free(S, side, x=None, y=140, hand=None, note="free hand"):
    """A mage's empty fist at the front edge of the body, in its own arm part."""
    if side == "l":
        S.group("arm-l", PL, note)
        fist(S, x or 57, y, 0, w=24, h=21, hand=hand)
    else:
        S.group("arm-r", PR, note)
        fist(S, x or 143, y, 0, w=24, h=21, hand=hand)


def gear(cx, cy, ro, ri, n, rot=0, tooth=0.5):
    """A cog's outline: n square teeth between radii ri and ro."""
    pts = []
    for i in range(n):
        a0 = rot + 360 * i / n
        w = 360 / n * tooth / 2
        for a, r in ((a0 - w * 1.25, ri), (a0 - w, ro), (a0 + w, ro), (a0 + w * 1.25, ri)):
            pts.append((cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))))
    return poly(pts)


def ring(cx, cy, ro, ri):
    """A ring as one path (use rule='evenodd')."""
    return circ(cx, cy, ro) + " " + circ(cx, cy, ri)


def chain(pts, r=6.5, hole=2.6):
    """Chain links as one path: a round link at each point (evenodd leaves their holes open)."""
    return " ".join(circ(x, y, r) + " " + circ(x, y, hole) for x, y in pts)


def along(p0, p1, n):
    return [(p0[0] + (p1[0] - p0[0]) * i / (n - 1), p0[1] + (p1[1] - p0[1]) * i / (n - 1)) for i in range(n)]


def taper(pts, w0, w1, t=0.8):
    """A limb along a polyline, w0 wide at the start, w1 at the end, round ends (beasts9.taper)."""
    n = len(pts)
    L, R = [], []
    for i, (x, y) in enumerate(pts):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        w = (w0 + (w1 - w0) * i / (n - 1)) / 2
        L.append((x + nx * w, y + ny * w))
        R.append((x - nx * w, y - ny * w))
    return blob(L + R[::-1], t)


def blade_decor(pts_half):
    """The darker right half of a blade (the heroes' blades are split light and dark down the middle)."""
    return f'<path d="{poly(pts_half)}" fill="#7E8696" opacity="0.45"/>'


def spiral(cx, cy, r0, r1, turns, n=40, a0=0):
    """A spiral polyline path (for a stroke): from radius r0 out to r1."""
    pts = []
    for i in range(n + 1):
        t = i / n
        a = math.radians(a0) + t * turns * 2 * math.pi
        r = r0 + (r1 - r0) * t
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return "M " + " L ".join(f"{f(x)} {f(y)}" for x, y in pts)
