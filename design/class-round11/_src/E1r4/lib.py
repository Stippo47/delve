"""Small SVG builder for the round-4 enemy redo sprites (section E1; adapted from ../E2/lib.py) (house style: one outline from the filter, no inner lines,
gradients lit from the left, contact shadows on the parts underneath). Paths here are relative to this file."""
import math, pathlib, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parents[1] / "enemies"
ROOT = HERE.parents[3]

FILTER = ('<filter id="outline" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" '
          'operator="dilate" radius="6 2.5" result="a"/><feMorphology in="SourceAlpha" operator="dilate" '
          'radius="2.5 6" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="c"/>'
          '<feMerge result="d"><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge>'
          '<feFlood flood-color="#2B2230"/><feComposite in2="d" operator="in" result="o"/><feMerge>'
          '<feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')

INK = "#2B2230"


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


# ----------------------------------------------------------------- path helpers
def circ(cx, cy, r):
    return f"M{f(cx-r)} {f(cy)} A{f(r)} {f(r)} 0 1 0 {f(cx+r)} {f(cy)} A{f(r)} {f(r)} 0 1 0 {f(cx-r)} {f(cy)} Z"


def ell(cx, cy, rx, ry):
    return f"M{f(cx-rx)} {f(cy)} A{f(rx)} {f(ry)} 0 1 0 {f(cx+rx)} {f(cy)} A{f(rx)} {f(ry)} 0 1 0 {f(cx-rx)} {f(cy)} Z"


def rr(cx, cy, w, h, r):
    x, y = cx - w / 2, cy - h / 2
    r = min(r, w / 2, h / 2)
    return (f"M{f(x+r)} {f(y)} H{f(x+w-r)} A{f(r)} {f(r)} 0 0 1 {f(x+w)} {f(y+r)} V{f(y+h-r)} "
            f"A{f(r)} {f(r)} 0 0 1 {f(x+w-r)} {f(y+h)} H{f(x+r)} A{f(r)} {f(r)} 0 0 1 {f(x)} {f(y+h-r)} "
            f"V{f(y+r)} A{f(r)} {f(r)} 0 0 1 {f(x+r)} {f(y)} Z")


def poly(pts):
    return "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts) + " Z"


def blob(pts, t=1.0, closed=True):
    """Smooth closed curve through the points (Catmull-Rom). A point given as (x, y, 'c') is a sharp corner."""
    n = len(pts)
    P = [(p[0], p[1]) for p in pts]
    sharp = [len(p) > 2 for p in pts]
    d = f"M{f(P[0][0])} {f(P[0][1])}"
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0, p1, p2, p3 = P[(i - 1) % n], P[i], P[(i + 1) % n], P[(i + 2) % n]
        if not closed:
            if i == 0: p0 = p1
            if i == n - 2: p3 = p2
        k1 = 0 if sharp[i] else t / 6
        k2 = 0 if sharp[(i + 1) % n] else t / 6
        c1 = (p1[0] + (p2[0] - p0[0]) * k1, p1[1] + (p2[1] - p0[1]) * k1)
        c2 = (p2[0] - (p3[0] - p1[0]) * k2, p2[1] - (p3[1] - p1[1]) * k2)
        d += f" C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}"
    return d + (" Z" if closed else "")


def sym(half, t=1.0):
    """Points from the top centre round the RIGHT side to the bottom centre; mirrored about x=100."""
    left = [((200 - p[0]), p[1]) + tuple(p[2:]) for p in reversed(half[1:-1])]
    return blob(list(half) + left, t)


def mx(pts):
    return [(200 - p[0], p[1]) + tuple(p[2:]) for p in pts]


def stroke_path(pts, w0, w1=None, t=1.0):
    """A tapered limb/tail along a polyline: width w0 at the start, w1 at the end (round start, pointed if w1=0)."""
    if w1 is None: w1 = w0
    n = len(pts)
    L, R = [], []
    for i, (x, y) in enumerate(pts):
        a = pts[min(i + 1, n - 1)]; b = pts[max(i - 1, 0)]
        dx, dy = a[0] - b[0], a[1] - b[1]
        m = math.hypot(dx, dy) or 1
        nx, ny = -dy / m, dx / m
        w = (w0 + (w1 - w0) * i / (n - 1)) / 2
        L.append((x + nx * w, y + ny * w)); R.append((x - nx * w, y - ny * w))
    return blob(L + list(reversed(R)), t)


def frame(x, y, a):
    """transform for a local frame whose +y points along angle a (degrees, 0 = down/forward, + = toward +x... see rot)."""
    return f"translate({f(x)} {f(y)}) rotate({f(a)})"


def rot(px, py, cx, cy, a):
    r = math.radians(a)
    dx, dy = px - cx, py - cy
    return cx + dx * math.cos(r) - dy * math.sin(r), cy + dx * math.sin(r) + dy * math.cos(r)


# ----------------------------------------------------------------- sprite builder
class Sprite:
    def __init__(self, comment, k=1.0):
        self.comment = comment
        self.k = k
        self.defs = []
        self.grads = {}
        self.groups = []  # [gid, pivot, [items]]
        self.n = 0
        self.under = []

    def uid(self, p="s"):
        self.n += 1
        return f"{p}{self.n}"

    def lg(self, light, dark, x2=0.3, y2=1.0):
        key = ("lg", light, dark, x2, y2)
        if key not in self.grads:
            i = self.uid("g")
            self.defs.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{light}"/>'
                             f'<stop offset="1" stop-color="{dark}"/></linearGradient>')
            self.grads[key] = i
        return f"url(#{self.grads[key]})"

    def lg3(self, a, b, c, x2=0.3, y2=1.0):
        key = ("lg3", a, b, c, x2, y2)
        if key not in self.grads:
            i = self.uid("g")
            self.defs.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{a}"/>'
                             f'<stop offset="0.5" stop-color="{b}"/><stop offset="1" stop-color="{c}"/></linearGradient>')
            self.grads[key] = i
        return f"url(#{self.grads[key]})"

    def rg(self, inner, outer, cx=0.5, cy=0.5, r=0.5, o_in=1, o_out=1):
        key = ("rg", inner, outer, cx, cy, r, o_in, o_out)
        if key not in self.grads:
            i = self.uid("g")
            self.defs.append(f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}"><stop offset="0" stop-color="{inner}" stop-opacity="{o_in}"/>'
                             f'<stop offset="1" stop-color="{outer}" stop-opacity="{o_out}"/></radialGradient>')
            self.grads[key] = i
        return f"url(#{self.grads[key]})"

    def shadeR(self, op=0.32, col="#1A1030"):
        key = ("sh", op, col)
        if key not in self.grads:
            i = self.uid("g")
            self.defs.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="1" y2="0.25"><stop offset="0.45" stop-color="{col}" stop-opacity="0"/>'
                             f'<stop offset="1" stop-color="{col}" stop-opacity="{op}"/></linearGradient>')
            self.grads[key] = i
        return f"url(#{self.grads[key]})"

    def hi(self, op=0.4):
        return self.rg("#FFFFF4", "#FFFFF4", 0.32, 0.28, 0.55, op, 0)

    def group(self, gid, pivot=None):
        self.groups.append([gid, pivot, []])
        return self

    def raw(self, s):
        self.groups[-1][2].append(s)

    def shape(self, d, fill, tf=None, shadow=True, sh=4, op=0.3, shade=0.32, hi=None, decor=None, under=True,
              clip=None):
        """Draw path d. shadow: a contact shadow cast onto everything drawn before it (in this sprite).
        decor: svg strings clipped to this shape (spots, glows). Returns the path id."""
        pid = self.uid("p")
        t = f' transform="{tf}"' if tf else ""
        self.defs.append(f'<path id="{pid}" d="{d}"{t}/>')
        items = []
        if shadow and self.under:
            cid = self.uid("c")
            self.defs.append(f'<clipPath id="{cid}">' + "".join(f'<use href="#{u}"/>' for u in self.under) + '</clipPath>')
            items.append(f'<g clip-path="url(#{cid})"><use href="#{pid}" transform="translate(0 {sh})" fill="{INK}" opacity="{op}"/></g>')
        items.append(f'<use href="#{pid}" fill="{fill}"/>')
        if decor or shade or hi:
            cid = self.uid("c")
            self.defs.append(f'<clipPath id="{cid}"><use href="#{pid}"/></clipPath>')
            inner = ""
            if decor:
                inner += "".join(decor)
            if hi:
                inner += f'<use href="#{pid}" fill="{self.hi(hi)}"/>'
            if shade:
                inner += f'<use href="#{pid}" fill="{self.shadeR(shade)}"/>'
            items.append(f'<g clip-path="url(#{cid})">{inner}</g>')
        if clip:
            items = [f'<g clip-path="url(#{clip})">' + "".join(items) + '</g>']
        self.groups[-1][2].extend(items)
        if under:
            self.under.append(pid)
        return pid

    def flat(self, d, fill, tf=None, op=1):
        """A flat decoration (no shadow/shade), e.g. eyes, glows."""
        t = f' transform="{tf}"' if tf else ""
        o = f' opacity="{op}"' if op != 1 else ""
        self.raw(f'<path d="{d}"{t} fill="{fill}"{o}/>')

    def pv(self, p):
        k = self.k
        return (100 + (p[0] - 100) * k, 100 + (p[1] - 100) * k)

    def svg(self):
        k = self.k
        sc = "" if k == 1 else f' transform="translate(100 100) scale({k}) translate(-100 -100)"'
        out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">',
               f'<!-- {self.comment} -->', '<defs>', FILTER] + self.defs + ['</defs>', '<g id="sprite" filter="url(#outline)">']
        for gid, pivot, items in self.groups:
            pa = ""
            if pivot:
                x, y = self.pv(pivot)
                pa = f' data-pivot="{f(x)} {f(y)}"'
            out.append(f'<g id="{gid}"{pa}><g{sc}>')
            out.extend(items)
            out.append('</g></g>')
        out += ['</g>', '</svg>', '']
        return "\n".join(out)

    def write(self, name):
        OUT.mkdir(parents=True, exist_ok=True)
        p = OUT / name
        p.write_text(self.svg(), encoding="utf-8")
        return p


# ----------------------------------------------------------------- common bits
def fist(S, cx, cy, a, skin, w=21, h=24, knuckle=1, claws=None, shadow=True):
    """A fist gripping a handle that runs along angle a (degrees; 0 = handle runs down the screen).
    w = size along the handle, h = across it. knuckle = which side (+1/-1, in the fist's local x) the knuckle bumps
    stand out on. claws: colour of small claw tips on the knuckles (monsters)."""
    tf = frame(cx, cy, a)
    hw, hh = h / 2, w / 2   # local x across the handle, local y along it
    d = rr(0, 0, h, w, 8)
    pid = S.shape(d, skin, tf=tf, shadow=shadow, sh=3)
    if knuckle:
        ks = []
        for i in range(3):
            y = -hh + 4 + i * (w - 8) / 2
            ks.append(circ(knuckle * (hw - 1.5), y, 4.2))
        S.shape(" ".join(ks), skin, tf=tf, shadow=False, shade=0.2)
    if claws:
        cl = []
        for i in range(3):
            y = -hh + 4 + i * (w - 8) / 2
            x = knuckle * (hw + 1)
            cl.append(poly([(x, y - 3), (x + knuckle * 7, y), (x, y + 3)]))
        S.shape(" ".join(cl), claws, tf=tf, shadow=False, shade=0)
    return pid


def render(paths_labels):
    args = [sys.executable, str(ROOT / "tools" / "riffle" / "render_board.py"), "--out", str(OUT / "renders")]
    args += [f"{p}={lab}" for p, lab in paths_labels]
    subprocess.run(args, check=True)


def ring(cx, cy, rx, ry, w):
    """An elliptical ring (the inner ellipse runs the other way, so it is a hole under the nonzero rule)."""
    a, b = rx - w, ry - w
    inner = (f"M{f(cx-a)} {f(cy)} A{f(a)} {f(b)} 0 1 1 {f(cx+a)} {f(cy)} A{f(a)} {f(b)} 0 1 1 {f(cx-a)} {f(cy)} Z")
    return ell(cx, cy, rx, ry) + " " + inner
