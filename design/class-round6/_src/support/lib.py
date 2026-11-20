"""Small sprite builder in the round-3 house style (H2 heroes).

Every shape gets: a soft top-left-lit gradient fill, a darker right side (overlay), and a contact shadow
cast down (+y) onto everything drawn before it (clipped to their union). The outline comes from the
#outline filter on #sprite. Items held in a hand are built in a local frame whose +y runs along the handle
towards the business end; T = "translate(x y) rotate(a)".
"""
import math, colorsys

INK = "#2B2230"
FILTER = ('<filter id="outline" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" '
          'operator="dilate" radius="6 2.5" result="a"/><feMorphology in="SourceAlpha" operator="dilate" '
          'radius="2.5 6" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="c"/>'
          '<feMerge result="d"><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge>'
          '<feFlood flood-color="#2B2230"/><feComposite in2="d" operator="in" result="o"/><feMerge>'
          '<feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')

COMMON = (
    '<radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/>'
    '<stop offset="1" stop-color="#DFA57F"/></radialGradient>'
    '<linearGradient id="gUnder" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A2E2A" stop-opacity="0.5"/>'
    '<stop offset="0.45" stop-color="#5A2E2A" stop-opacity="0"/></linearGradient>'
    '<linearGradient id="gFace" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
    '<stop offset="0" stop-color="#B07560"/><stop offset="0.2" stop-color="#D9A27F"/><stop offset="0.45" stop-color="#F2C7A0"/>'
    '<stop offset="0.85" stop-color="#F4CBA6"/><stop offset="1" stop-color="#E6B590"/></linearGradient>'
    '<linearGradient id="gFaceSide" x1="100" y1="0" x2="156" y2="0" gradientUnits="userSpaceOnUse">'
    '<stop offset="0" stop-color="#8A4E36" stop-opacity="0"/><stop offset="1" stop-color="#8A4E36" stop-opacity="0.28"/></linearGradient>'
)

HEAD = ("M 100 47.8 C 129.6 47.8 147.8 68.7 147.8 98.3 C 147.8 122.6 136.5 140 120.9 147.8 C 113.9 151.3 107 153.1 "
        "100 153.1 C 93 153.1 86.1 151.3 79.1 147.8 C 63.5 140 52.1 122.6 52.1 98.3 C 52.1 68.7 70.4 47.8 100 47.8 Z")
SHOULDERS = "M 26 108 C 26 82 54 76 100 76 C 146 76 174 82 174 108 C 174 134 146 140 100 140 C 54 140 26 134 26 108 Z"


# ------------------------------------------------------------------ colour

def _hx(c):
    c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _to(r, g, b):
    return '#%02X%02X%02X' % tuple(max(0, min(255, round(v * 255))) for v in (r, g, b))


def shade(c, k=0.8, sat=1.05):
    h, l, s = colorsys.rgb_to_hls(*_hx(c)); return _to(*colorsys.hls_to_rgb(h, l * k, min(1, s * sat)))


def light(c, k=1.12):
    h, l, s = colorsys.rgb_to_hls(*_hx(c)); return _to(*colorsys.hls_to_rgb(h, min(0.97, l * k), s))


# ------------------------------------------------------------------ geometry

def f(v):
    return f"{v:.1f}".rstrip('0').rstrip('.') if abs(v - round(v)) > 1e-9 else str(int(round(v)))


def circ(cx, cy, r):
    return f"M {f(cx-r)} {f(cy)} A {f(r)} {f(r)} 0 1 0 {f(cx+r)} {f(cy)} A {f(r)} {f(r)} 0 1 0 {f(cx-r)} {f(cy)} Z"


def ell(cx, cy, rx, ry):
    return f"M {f(cx-rx)} {f(cy)} A {f(rx)} {f(ry)} 0 1 0 {f(cx+rx)} {f(cy)} A {f(rx)} {f(ry)} 0 1 0 {f(cx-rx)} {f(cy)} Z"


def rr(cx, cy, w, h, r):
    """Rounded rect centred on (cx, cy)."""
    x, y = cx - w / 2, cy - h / 2
    r = min(r, w / 2, h / 2)
    return (f"M {f(x+r)} {f(y)} H {f(x+w-r)} A {f(r)} {f(r)} 0 0 1 {f(x+w)} {f(y+r)} V {f(y+h-r)} "
            f"A {f(r)} {f(r)} 0 0 1 {f(x+w-r)} {f(y+h)} H {f(x+r)} A {f(r)} {f(r)} 0 0 1 {f(x)} {f(y+h-r)} "
            f"V {f(y+r)} A {f(r)} {f(r)} 0 0 1 {f(x+r)} {f(y)} Z")


def poly(pts):
    return "M " + " L ".join(f"{f(x)} {f(y)}" for x, y in pts) + " Z"


def blob(pts, t=1.0):
    """Closed smooth curve through the points (Catmull-Rom as cubic Beziers)."""
    n = len(pts)
    d = f"M {f(pts[0][0])} {f(pts[0][1])}"
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6 * t, p1[1] + (p2[1] - p0[1]) / 6 * t)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6 * t, p2[1] - (p3[1] - p1[1]) / 6 * t)
        d += f" C {f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}"
    return d + " Z"


def mirror(pts, cx=100):
    return [(2 * cx - x, y) for x, y in pts]


def sym(half, cx=100):
    """Points for the left half (top to bottom) -> closed symmetric outline."""
    return half + mirror(half[::-1], cx)


def star(cx, cy, ro, ri, n, rot=0):
    pts = []
    for i in range(2 * n):
        r = ro if i % 2 == 0 else ri
        a = math.radians(rot + 180 * i / n - 90)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def frame(x, y, a):
    return f"translate({f(x)} {f(y)}) rotate({f(a)})"


def to_global(x, y, a, lx, ly):
    r = math.radians(a)
    return (x + lx * math.cos(r) - ly * math.sin(r), y + lx * math.sin(r) + ly * math.cos(r))


# ------------------------------------------------------------------ sprite

class Sprite:
    def __init__(self, comment):
        self.comment = comment
        self.defs, self.out, self.shapes = [], [], []
        self.n = 0
        self.cache = {}
        self.open = False

    def _grad(self, c, kind):
        key = (c, kind)
        if key in self.cache:
            return self.cache[key]
        i = f"g{len(self.cache) + 1}"
        if kind == "fill":
            self.defs.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" '
                             f'stop-color="{light(c, 1.1)}"/><stop offset="1" stop-color="{shade(c, 0.86)}"/></linearGradient>')
        else:
            dk = shade(c, 0.45, 1.1)
            self.defs.append(f'<linearGradient id="{i}" x1="0.45" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{dk}" '
                             f'stop-opacity="0"/><stop offset="1" stop-color="{dk}" stop-opacity="0.42"/></linearGradient>')
        self.cache[key] = i
        return i

    def add_def(self, s):
        self.defs.append(s)

    def group(self, gid, pivot=None, note=""):
        if self.open:
            self.out.append("</g>")
        pv = f' data-pivot="{f(pivot[0])} {f(pivot[1])}"' if pivot else ""
        self.out.append(f'<g id="{gid}"{pv}>' + (f"<!-- {note} -->" if note else ""))
        self.open = True

    def shape(self, d, color=None, fill=None, T="", shadow=4, sop=0.3, side=True, decor="", catch=True,
              note="", over=None):
        self.n += 1
        sid = f"s{self.n}"
        self.defs.append(f'<path id="{sid}" d="{d}"/>')
        tr = f' transform="{T}"' if T else ""
        o = []
        if note:
            o.append(f"<!-- {note} -->")
        if shadow and self.shapes:
            uid = f"u{self.n}"
            uses = "".join(f'<use href="#{s}"' + (f' transform="{t}"' if t else "") + "/>" for s, t in self.shapes)
            self.defs.append(f'<clipPath id="{uid}">{uses}</clipPath>')
            o.append(f'<g clip-path="url(#{uid})"><use href="#{sid}" transform="translate(0 {shadow}) {T}" '
                     f'fill="{INK}" opacity="{sop}"/></g>')
        fl = fill or f"url(#{self._grad(color, 'fill')})"
        o.append(f'<use href="#{sid}"{tr} fill="{fl}"/>')
        if side and color:
            o.append(f'<use href="#{sid}"{tr} fill="url(#{self._grad(color, "side")})"/>')
        if over:
            o.append(f'<use href="#{sid}"{tr} fill="{over}"/>')
        if decor:
            cid = f"c{self.n}"
            self.defs.append(f'<clipPath id="{cid}"><use href="#{sid}"{tr}/></clipPath>')
            inner = f'<g transform="{T}">{decor}</g>' if T else decor
            o.append(f'<g clip-path="url(#{cid})">{inner}</g>')
        if catch:
            self.shapes.append((sid, T))
        self.out.append("".join(o))
        return sid

    def raw(self, s):
        self.out.append(s)

    def mouth(self, y=136.5, op=1.0):
        """The round-3 subtle mouth curve (people have no eyes, brows or blush, but keep this)."""
        o = f' opacity="{op}"' if op < 1 else ""
        self.raw(f'<path d="M96 {f(y)} Q100 {f(y + 2.5)} 104 {f(y)}" fill="none" stroke="#C98868" stroke-width="2.5" '
                 f'stroke-linecap="round"{o}/>')

    # ---- common pieces
    def head(self, shadow=5, ears=True):
        if ears:
            self.shape(ell(52.1, 108.7, 7, 9.6), fill="#F0C49D", shadow=0, side=False)
            self.shape(ell(147.8, 108.7, 7, 9.6), fill="#D8A27C", shadow=0, side=False)
        return self.shape(HEAD, fill="url(#gFace)", shadow=shadow,
                          decor='<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>')

    def fist(self, cx, cy, a=0, w=21, h=25, under=False, shadow=3, T=None):
        """A fist; its long side (knuckle row) runs along local y, i.e. along a handle in that frame."""
        if T is None:
            T = frame(cx, cy, a); cx = cy = 0
        self.shape(rr(cx, cy, w, h, 8), fill="url(#gHand)", T=T, shadow=shadow, side=False,
                   over="url(#gUnder)" if under else None)

    def svg(self):
        if self.open:
            self.out.append("</g>")
            self.open = False
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n'
                f"<!-- {self.comment} -->\n<defs>\n{FILTER}\n{COMMON}\n" + "\n".join(self.defs) + "\n</defs>\n"
                '<g id="sprite" filter="url(#outline)">\n' + "\n".join(self.out) + "\n</g>\n</svg>\n")


def cloud(cx, cy, R, n, k=0.62, rot=0):
    """Scalloped round outline: n round lobes on a circle of radius R."""
    pts = [(cx + R * math.cos(math.radians(rot + 360 * i / n - 90)), cy + R * math.sin(math.radians(rot + 360 * i / n - 90)))
           for i in range(n)]
    ch = 2 * R * math.sin(math.pi / n)
    r = ch * k
    d = f"M {f(pts[0][0])} {f(pts[0][1])}"
    for i in range(n):
        x, y = pts[(i + 1) % n]
        d += f" A {f(r)} {f(r)} 0 0 1 {f(x)} {f(y)}"
    return d + " Z"
