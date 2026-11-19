"""Round-4 fixes for the skeletons. python skel.py [name ...]

Reads each round-3 skeleton SVG back into a list of shapes (path, fill, contact shadow, clipped decor, side shade),
changes the shapes, and writes it out again in the same structure.
"""
import sys, re, math
from fx import *

C = "skeleton"
FILTER = re.search(r'<filter id="outline".*?</filter>', read3(C, "skeleton-rattler"), re.S).group(0)


class Shape:
    def __init__(self, id, d, fill, group, shadow=0.0, op=0.3, decor="", shade=False):
        self.id, self.d, self.fill, self.group = id, d, fill, group
        self.shadow, self.op, self.decor, self.shade = shadow, op, decor, shade


class Sprite:
    def __init__(self, comment, grads):
        self.comment, self.grads = comment, list(grads)
        self.groups = []      # [(gid, pivot)]
        self.shapes = []

    def group(self, gid, pivot=None):
        self.groups.append((gid, pivot))

    def add(self, sh):
        self.shapes.append(sh)
        return sh

    def find(self, id):
        for s in self.shapes:
            if s.id == id:
                return s
        raise KeyError(id)

    def remove(self, *ids):
        self.shapes = [s for s in self.shapes if s.id not in ids]

    def insert_after(self, after_id, sh):
        i = [s.id for s in self.shapes].index(after_id)
        self.shapes.insert(i + 1, sh)

    def svg(self):
        defs, body = [FILTER] + self.grads, []
        order = []
        for gid, piv in self.groups:
            for sh in self.shapes:
                if sh.group == gid:
                    order.append(sh)
        done = []
        for sh in order:
            defs.append(f'<path id="{sh.id}" d="{sh.d}"/>')
            if sh.shadow and done:
                defs.append(f'<clipPath id="under-{sh.id}">' + "".join(f'<use href="#{o}"/>' for o in done) + '</clipPath>')
            if sh.decor:
                defs.append(f'<clipPath id="{sh.id}-c"><use href="#{sh.id}"/></clipPath>')
            done.append(sh.id)
        for gid, piv in self.groups:
            p = f' data-pivot="{piv}"' if piv else ""
            body.append(f'    <g id="{gid}"{p}>')
            seen = []
            for sh in order:
                if sh.group != gid:
                    continue
                if sh.shadow and order.index(sh) > 0:
                    body.append(f'      <g clip-path="url(#under-{sh.id})"><use href="#{sh.id}" fill="#2B2230" opacity="{sh.op}" transform="translate(0 {sh.shadow})"/></g>')
                body.append(f'      <use href="#{sh.id}" fill="{sh.fill}"/>')
                if sh.decor:
                    body.append(f'      <g clip-path="url(#{sh.id}-c)">{sh.decor}</g>')
                if sh.shade:
                    body.append(f'      <use href="#{sh.id}" fill="url(#shX)"/>')
            body.append('    </g>')
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n'
                f'  <!-- {self.comment} -->\n  <defs>\n    ' + "\n    ".join(defs) + '\n  </defs>\n'
                '  <g id="sprite" filter="url(#outline)">\n' + "\n".join(body) + '\n  </g>\n</svg>\n')


def balanced_g(s, i):
    """End index of the <g ...> element starting at i."""
    depth = 0
    for t in re.finditer(r'<g\b|</g>', s[i:]):
        depth += -1 if t.group() == '</g>' else 1
        if depth == 0:
            return i + t.end()
    raise ValueError


def parse(name):
    s = read3(C, name)
    comment = re.search(r'<!--(.*?)-->', s, re.S).group(1).strip()
    dfs = re.search(r'<defs>(.*)</defs>', s, re.S).group(1)
    grads = re.findall(r'<(?:linear|radial)Gradient\b.*?</(?:linear|radial)Gradient>', dfs, re.S)
    paths = dict(re.findall(r'<path id="([^"]+)" d="([^"]*)"', dfs))
    sp = Sprite(comment, grads)
    sprite = s[s.index('<g id="sprite"'):]
    for m in re.finditer(r'<g id="([^"]+)"(?: data-pivot="([^"]+)")?>', sprite):
        gid = m.group(1)
        if gid == "sprite":
            continue
        sp.group(gid, m.group(2))
        a = m.end(); b = balanced_g(sprite, m.start()) - 4
        g = sprite[a:b]
        i = 0
        pend_shadow = None
        while True:
            while i < len(g) and g[i].isspace():
                i += 1
            if i >= len(g):
                break
            mm = re.match(r'<g clip-path="url\(#under-([^)]+)\)"><use href="#[^"]+" fill="#2B2230" opacity="([\d.]+)" transform="translate\(0 ([\d.]+)\)"/></g>', g[i:])
            if mm:
                pend_shadow = (mm.group(1), float(mm.group(2)), float(mm.group(3)))
                i += mm.end(); continue
            mm = re.match(r'<g clip-path="url\(#([^)]+)-c\)">', g[i:])
            if mm:
                e = balanced_g(g, i)
                sp.find(mm.group(1)).decor = g[i + mm.end():e - 4]
                i = e; continue
            mm = re.match(r'<use href="#([^"]+)" fill="([^"]+)"/>', g[i:])
            if mm:
                sid, fill = mm.group(1), mm.group(2)
                if fill == "url(#shX)":
                    sp.find(sid).shade = True
                else:
                    sh = Shape(sid, paths[sid], fill, gid)
                    if pend_shadow and pend_shadow[0] == sid:
                        sh.op, sh.shadow = pend_shadow[1], pend_shadow[2]
                    sp.add(sh)
                pend_shadow = None
                i += mm.end(); continue
            raise SystemExit(f"{name}: can't parse at: {g[i:i + 120]}")
    return sp


def rr(cx, cy, w, h, r):
    x0, x1, y0, y1 = cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2
    r = min(r, w / 2, h / 2)
    return (f"M {f(x0 + r)} {f(y0)} L {f(x1 - r)} {f(y0)} A {f(r)} {f(r)} 0 0 1 {f(x1)} {f(y0 + r)} "
            f"L {f(x1)} {f(y1 - r)} A {f(r)} {f(r)} 0 0 1 {f(x1 - r)} {f(y1)} L {f(x0 + r)} {f(y1)} "
            f"A {f(r)} {f(r)} 0 0 1 {f(x0)} {f(y1 - r)} L {f(x0)} {f(y0 + r)} A {f(r)} {f(r)} 0 0 1 {f(x0 + r)} {f(y0)} Z")


def bone_fist(sp, pre, group, tx, ty, deg, side, k=1.0, after=None):
    """A bony fist wrapped round a handle that runs along the frame's y axis: a palm along the handle and a row of
    four knuckle bones down its outer side (side=+1: frame +x). Returns the shapes (fingers first, then palm)."""
    out = []
    for i in range(4):
        d = rr(6.3, -9.6 + 6.4 * i, 9.5, 5.2, 2.5)
        if side < 0:
            d = mirror_x(d)
        out.append(Shape(f"{pre}-f{i}", frame(d, tx, ty, deg, scale=k), "url(#gBone)", group, shade=True))
    d = rr(-1.8, 0, 15.5, 26, 6.5)
    if side < 0:
        d = mirror_x(d)
    out.append(Shape(f"{pre}-palm", frame(d, tx, ty, deg, scale=k), "url(#gBone)", group, shadow=3, op=0.3, shade=True))
    return out


def replace_fist(sp, old_pre, new_shapes):
    ids = [s.id for s in sp.shapes]
    pos = min(i for i, x in enumerate(ids) if x.startswith(old_pre + "-"))
    sp.shapes = [s for s in sp.shapes if not s.id.startswith(old_pre + "-")]
    for j, sh in enumerate(new_shapes):
        sp.shapes.insert(pos + j, sh)


# ---------------------------------------------------------------- jaws
CRANIUM = ("M100 48 C126 48 145 64 145 90 C145 102 144 109 147 116 C149 121 146 127 138 130 C135 135 130 138 124 139 "
           "L76 139 C70 138 65 135 62 130 C54 127 51 121 53 116 C56 109 55 102 55 90 C55 64 74 48 100 48 Z")
JAW = ("M 71 153 C 71 150 74 148.5 77 149.5 C 90 152 110 152 123 149.5 C 126 148.5 129 150 129 153 "
       "C 128 164 116 171 100 171 C 84 171 72 164 71 153 Z")
UP_TEETH = [(80.7, 132, 6.6, 12.5), (90.35, 132, 6.6, 13.5), (100, 132, 6.6, 13.5), (109.65, 132, 6.6, 13.5), (119.3, 132, 6.6, 12.5)]


def tooth(cx, top, w, h):
    return rr(cx, top + h / 2, w, h, 3)


def add_jaw(sp, after="skull", dy=0.0, rot=0.0, n_low=4, upper=None):
    """Lower jaw as its own bone, below the cranium with a dark gap between (the outline fills the gap)."""
    j = JAW
    if rot:
        j = frame(move(j, -100, -150), 100, 150, rot)
    j = move(j, 0, dy)
    shapes = [Shape("jaw", j, "url(#gBone)", "body", shadow=4, op=0.3, shade=True)]
    xs = [84, 94, 106, 116][:n_low]
    for i, x in enumerate(xs):
        t = tooth(x, 146.5, 6.2, 7.5)
        if rot:
            t = frame(move(t, -100, -150), 100, 150, rot)
        shapes.append(Shape(f"ltooth{i}", move(t, 0, dy), "#FFF8E6", "body"))
    i = [s.id for s in sp.shapes].index(after)
    for k, sh in enumerate(shapes):
        sp.shapes.insert(i + 1 + k, sh)


def jaw_note(sp, text):
    sp.comment = "Round 4: " + text + " | was: " + sp.comment


# ---------------------------------------------------------------- the four rattlers
def rattler():
    sp = parse("skeleton-rattler")
    # cranium from the jawless rattler (teeth hang free), then a separate lower jaw below a dark gap
    sk = sp.find("skull")
    sk.d = CRANIUM
    # the old closed-grin mouth decor is replaced: sockets + nose only
    sk.decor = re.sub(r'<path d="M85 135 H115.*$', '', sk.decor)
    teeth = [Shape(f"tooth{i}", tooth(*t), "#FFF8E6", "body") for i, t in enumerate(UP_TEETH)]
    i = [s.id for s in sp.shapes].index("skull")
    for k, t in enumerate(teeth):
        sp.shapes.insert(i + k, t)
    add_jaw(sp, after="skull", dy=0)
    # hand rule: the claw wraps the grip, knuckles running down the handle (frame of the round-3 sword)
    replace_fist(sp, "fist", bone_fist(sp, "fist", "arm-r", 162, 107, 8, +1))
    fist_slide(sp, "fist", 162, 107, 8, 27)
    jaw_note(sp, "the lower jaw is its own bone below the skull with a dark gap between; the sword claw is turned to the grip (knuckles down the handle)")
    write4(C, "skeleton-rattler", sp.svg())


def fist_slide(sp, pre, tx, ty, deg, u):
    """Move a bone fist built at the frame origin to distance u along the handle."""
    a = math.radians(deg)
    dx, dy = -math.sin(a) * u, math.cos(a) * u
    for s in sp.shapes:
        if s.id.startswith(pre + "-f") or s.id == pre + "-palm":
            s.d = move(s.d, dx, dy)


def jawless(kind):
    name = f"skeleton-rattler-jawless-{kind}"
    sp = parse(name)
    add_jaw(sp, after="skull", dy=3 if kind == "spear" else 0, rot=0)
    if kind == "spear":
        replace_fist(sp, "fist-r", bone_fist(sp, "fist-r", "arm-r", 171, 38, 7, +1))
        fist_slide(sp, "fist-r", 171, 38, 7, 95)
        note = "the lower jaw is back, as its own bone below the skull with a dark gap between; the spear claw is turned to the shaft (knuckles down the shaft)"
    else:
        # bow hand: the grip runs across (the bow's belly), so the claw is turned across too
        replace_fist(sp, "fist-l", bone_fist(sp, "fist-l", "arm-l", 100, 182, -90, +1))
        # drawing hand: pinches the arrow's nock, turned along the arrow. arm-r (arrow + hand) now draws after the
        # body, so the hand sits over the jaw like the archer's hand at the chin
        replace_fist(sp, "fist-r", bone_fist(sp, "fist-r", "arm-r", 100, 167, 0, +1, k=0.78))
        sp.find("shaft").d = rr(100, 177, 4.5, 30, 2)
        sp.groups = [g for g in sp.groups if g[0] != "arm-r"] + [g for g in sp.groups if g[0] == "arm-r"]
        note = "the lower jaw is back, as its own bone below the skull with a dark gap between; the bow claw is turned along the bow's grip"
    jaw_note(sp, note)
    write4(C, name, sp.svg())


def jawless_bow():
    jawless("bow")


def jawless_spear():
    jawless("spear")


def loosejaw():
    sp = parse("skeleton-rattler-loosejaw")
    replace_fist(sp, "fist-r", bone_fist(sp, "fist-r", "arm-r", 162, 104, 7, +1))
    fist_slide(sp, "fist-r", 162, 104, 7, 28)
    jaw_note(sp, "the crooked jaw hangs a little lower so the gap under the skull reads at game size; the mace claw is turned to the handle (knuckles down the handle)")
    for id in ["jaw", "ltooth0", "ltooth1", "ltooth2"]:
        sp.find(id).d = move(sp.find(id).d, 0, 3)
    write4(C, "skeleton-rattler-loosejaw", sp.svg())


# ---------------------------------------------------------------- Gaper: 30% bigger, no brows, calmer round sockets
def scale_shapes(sp, groups, k, cx=100, cy=100):
    m = (k, 0, 0, k, cx * (1 - k), cy * (1 - k))
    for sh in sp.shapes:
        if sh.group in groups:
            sh.d = scale_about(sh.d, k, cx, cy)
            if sh.decor:
                sh.decor = f'<g transform="{mat_str(m)}">{sh.decor}</g>'
    sp.groups = [(g, (" ".join(f(cx + (float(v) - c0) * k) for v, c0 in zip(p.split(), (cx, cy))) if p and g in groups else p))
                 for g, p in sp.groups]


def reframe(sp, ids, old, new):
    """Move shapes from one weapon frame to another: new . old^-1 (decor follows)."""
    m = mat_mul(new, mat_inv(old))
    for sh in sp.shapes:
        if sh.id in ids:
            sh.d = affine(sh.d, m)
            if sh.decor:
                sh.decor = f'<g transform="{mat_str(m)}">{sh.decor}</g>'


SOCK_L = "M 66 108 C 65.5 100.5 73 97 81.5 97.5 C 90 98 95.5 103 94.5 110.5 C 93.5 118 87.5 123 80 123 C 72 123 66.5 116 66 108 Z"
NOSE = ("M 100 118 C 102.5 121.5 105.5 125 106 128 C 106.5 131 104 132 102.2 130.6 L 100 129 L 97.8 130.6 "
        "C 96 132 93.5 131 94 128 C 94.5 125 97.5 121.5 100 118 Z")
M100 = (-1, 0, 0, 1, 200, 0)


def gaper(K=1.3, sw=(171, 90, -12, 1.12)):
    sp = parse("skeleton-gaper")
    sk = sp.find("skull")
    sk.decor = (f'<rect x="40" y="30" width="120" height="140" fill="url(#gDome)"/>'
                f'<path d="{SOCK_L}" fill="url(#gSock)"/><path d="{mirror_x(SOCK_L, 100)}" fill="url(#gSock)"/>'
                f'<path d="{NOSE}" fill="url(#gSock)"/>')
    scale_shapes(sp, ("back", "body"), K)
    for sh in sp.shapes:          # the trailing vertebrae would leave the box at 1.3x: tuck them in
        if sh.group == "back":
            sh.d = move(sh.d, 0, 14)
    # swords: same blades, a little bigger, re-placed under the bigger shoulders
    oldR = mat_frame(157, 103, -14)
    newR = mat_frame(sw[0], sw[1], sw[2], sw[3])
    reframe(sp, [f"r-{n}" for n in ("pommel", "grip", "guard", "blade")], oldR, newR)
    reframe(sp, [f"l-{n}" for n in ("pommel", "grip", "guard", "blade")], mat_mul(M100, oldR), mat_mul(M100, newR))
    u = 21 * sw[3]
    a = math.radians(sw[2])
    fx_, fy_ = sw[0] - math.sin(a) * u, sw[1] + math.cos(a) * u
    replace_fist(sp, "r-fist", bone_fist(sp, "r-fist", "arm-r", fx_, fy_, sw[2], +1, k=1.08))
    replace_fist(sp, "l-fist", bone_fist(sp, "l-fist", "arm-l", 200 - fx_, fy_, -sw[2], -1, k=1.08))
    sp.groups = [(g, ("22 100" if g == "arm-l" else "178 100" if g == "arm-r" else "100 51.6" if g == "back" else p)) for g, p in sp.groups]
    sp.comment = ("Round 4: 30% bigger (body scaled 1.3 about the centre), no brow ridges, calmer round sockets "
                  "(not slanted), the swords re-placed under the bigger shoulders, each claw turned to its grip. | was: " + sp.comment)
    write4(C, "skeleton-gaper", sp.svg())


# ---------------------------------------------------------------- Brute: 15% bigger, axe flipped
def brute(K=1.15, ax=(178, 72, -6, 1.1), fist_u=56):
    sp = parse("skeleton-brute")
    scale_shapes(sp, ("body", "arm-l"), K)
    old = mat_frame(167, 86, 5)
    new = mat_frame(ax[0], ax[1], ax[2], ax[3], mirror=True)   # mirror: the blade now faces in, the spike out
    reframe(sp, ["haft", "axe-spike", "axe-head", "axe-collar"], old, new)
    a = math.radians(ax[2])
    u = fist_u * ax[3]
    replace_fist(sp, "fist-r", bone_fist(sp, "fist-r", "arm-r", ax[0] - math.sin(a) * u, ax[1] + math.cos(a) * u, ax[2], +1, k=1.08))
    sp.groups = [(g, ("170 104" if g == "arm-r" else p)) for g, p in sp.groups]
    sp.comment = ("Round 4: 15% bigger (body and shield scaled 1.15 about the centre); the axe is flipped (blade faces in "
                  "toward the centre, back spike out); the claw is turned to the haft. | was: " + sp.comment)
    write4(C, "skeleton-brute", sp.svg())


if __name__ == "__main__":
    for n in sys.argv[1:] or ["rattler", "jawless_bow", "jawless_spear", "loosejaw"]:
        globals()[n.replace("-", "_")]()
    print("ok")
