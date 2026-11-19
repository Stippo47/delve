"""Shared helpers for the round-4 fixes (section F).

Every script here reads the picked round-3 SVG and writes the fixed round-4 SVG. Paths are relative to this file.
"""
import math, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
R3 = HERE.parents[2] / "class-round3"
R4 = HERE.parents[1]


def read3(cls, name):
    return (R3 / cls / f"{name}.svg").read_text(encoding="utf-8")


def write4(cls, name, svg):
    p = R4 / cls / f"{name}.svg"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(svg, encoding="utf-8")
    return p


def f(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s == "-0" else s


def fist_d(side=1, W=21.0, L=27.0, cx=0.0, cy=0.0, n=4):
    """A fist wrapped round a handle that runs along y, in the weapon's own frame.

    The fist is longer along the handle than across it. The knuckles are a row of n small bumps along the
    outer side (side=+1: +x, side=-1: -x); the thumb side is smooth. No inner lines.
    """
    hw, hl = W / 2, L / 2
    kx = hw - 2.6           # base line of the knuckle bumps
    r = 0.0
    seg = (L - 6) / n       # knuckles span the middle of the side
    r = seg / 2 + 0.9
    y0 = -hl + 3
    pts = [f"M {f(-hw + 6)} {f(-hl)}", f"L {f(kx - 2.6)} {f(-hl)}", f"Q {f(kx)} {f(-hl)} {f(kx)} {f(y0)}"]
    for i in range(n):
        pts.append(f"A {f(r)} {f(r)} 0 0 1 {f(kx)} {f(y0 + seg * (i + 1))}")
    pts += [f"Q {f(kx)} {f(hl)} {f(kx - 2.6)} {f(hl)}", f"L {f(-hw + 6)} {f(hl)}",
            f"Q {f(-hw)} {f(hl)} {f(-hw)} {f(hl - 6)}", f"L {f(-hw)} {f(-hl + 6)}",
            f"Q {f(-hw)} {f(-hl)} {f(-hw + 6)} {f(-hl)}", "Z"]
    d = " ".join(pts)
    if side < 0:
        d = mirror_x(d)
    if cx or cy:
        d = move(d, cx, cy)
    return d


_num = re.compile(r"-?\d+(?:\.\d+)?(?:e-?\d+)?")


def _tokens(d):
    return re.findall(r"[MLCQAZHVmlcqazhv]|-?\d+(?:\.\d+)?(?:e-?\d+)?", d)


def xform(d, fn, flip=False, k=1.0, drot=0.0):
    """Apply a point function to an absolute path made of M L C Q A H V Z. flip: the map mirrors (sweep flips)."""
    t = _tokens(d)
    out, i, cmd = [], 0, None
    cur = (0.0, 0.0)
    while i < len(t):
        if t[i].isalpha():
            cmd = t[i]; i += 1
            if cmd in "Zz":
                out.append("Z"); continue
            out.append(cmd if cmd not in "HV" else "L")
            continue
        if cmd in ("M", "L", "C", "Q"):
            x, y = float(t[i]), float(t[i + 1]); i += 2
            cur = (x, y)
            X, Y = fn(x, y); out += [f(X), f(Y)]
        elif cmd == "H":
            x = float(t[i]); i += 1; cur = (x, cur[1]); X, Y = fn(*cur); out += [f(X), f(Y)]
        elif cmd == "V":
            y = float(t[i]); i += 1; cur = (cur[0], y); X, Y = fn(*cur); out += [f(X), f(Y)]
        elif cmd == "A":
            rx, ry, rot, la, sw, x, y = t[i:i + 7]; i += 7
            cur = (float(x), float(y))
            X, Y = fn(*cur)
            s = int(sw)
            if flip:
                s = 1 - s
            out += [f(float(rx) * k), f(float(ry) * k), f(float(rot) + drot), la, str(s), f(X), f(Y)]
        else:
            raise ValueError(f"unsupported command {cmd}")
    return " ".join(out)


def mirror_x(d, ax=0.0):
    return xform(d, lambda x, y: (2 * ax - x, y), flip=True)


def move(d, dx, dy):
    return xform(d, lambda x, y: (x + dx, y + dy))


def frame(d, tx, ty, deg, mirror=False, scale=1.0):
    """Local weapon frame -> sprite: (mirror x) scale, rotate by deg, then translate."""
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)

    def fn(x, y):
        if mirror:
            x = -x
        x, y = x * scale, y * scale
        return tx + c * x - s * y, ty + s * x + c * y
    return xform(d, fn, flip=mirror, k=scale, drot=deg)


def scale_about(d, k, cx, cy):
    return xform(d, lambda x, y: (cx + (x - cx) * k, cy + (y - cy) * k), k=k)


def affine(d, m):
    """Apply an SVG matrix (a b c d e f) to a path. Assumes a uniform scale + rotation (+ optional mirror)."""
    a, b, c, dd, e, f_ = m
    det = a * dd - b * c
    k = math.sqrt(abs(det))
    rot = math.degrees(math.atan2(b, a))
    return xform(d, lambda x, y: (a * x + c * y + e, b * x + dd * y + f_), flip=det < 0, k=k, drot=rot)


def mat_mul(m1, m2):
    """m1 after m2 (both SVG matrices a b c d e f)."""
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1)


def mat_frame(tx, ty, deg, k=1.0, mirror=False):
    a = math.radians(deg); c, s = math.cos(a) * k, math.sin(a) * k
    mx = -1 if mirror else 1
    return (c * mx, s * mx, -s, c, tx, ty)


def mat_inv(m):
    a, b, c, d, e, f_ = m
    det = a * d - b * c
    return (d / det, -b / det, -c / det, a / det, (c * f_ - d * e) / det, (b * e - a * f_) / det)


def mat_str(m):
    return "matrix(" + " ".join(f(v) if abs(v) > 1e-9 else "0" for v in m) + ")"


def add_defs(svg, text):
    return svg.replace("</defs>", text + "\n</defs>", 1)


def sub1(svg, a, b):
    n = svg.count(a)
    if n != 1:
        raise SystemExit(f"expected 1 match, got {n}: {a[:90]}")
    return svg.replace(a, b)


FIST_RECT = re.compile(r'<rect x="-1[23](?:\.5)?" y="-10\.5" width="2[56]" height="2[12]" rx="(?:8\.5|9)"'
                       r'(?P<t> transform="translate\([^)]*\)")?(?P<rest>[^>]*)/>')


def refist(svg, fid):
    """Swap every round-3 fist rectangle (inside the weapon frames) for <use href="#fid">."""
    def rep(m):
        t = m.group("t") or ""
        return f'<use href="#{fid}"{t}{m.group("rest")}/>'
    svg2, n = FIST_RECT.subn(rep, svg)
    if n == 0:
        raise SystemExit("no fist rect found")
    return svg2


def group_span(svg, gid):
    m = re.search(r'<g id="%s"' % re.escape(gid), svg)
    if not m:
        raise SystemExit(f"no group {gid}")
    i = m.start(); depth = 0
    for t in re.finditer(r'<g\b|</g>', svg[i:]):
        depth += -1 if t.group() == '</g>' else 1
        if depth == 0:
            return i, i + t.end()
    raise SystemExit("unbalanced")


def get_group(svg, gid):
    a, b = group_span(svg, gid)
    return svg[a:b]


def set_group(svg, gid, text):
    a, b = group_span(svg, gid)
    return svg[:a] + text + svg[b:]


def move_group_after(svg, gid, after):
    """Cut group gid out and put it right after group `after` (draw order = file order)."""
    g = get_group(svg, gid)
    a, b = group_span(svg, gid)
    svg = svg[:a] + svg[b:]
    a2, b2 = group_span(svg, after)
    return svg[:b2] + "\n" + g + svg[b2:]


def set_comment(svg, text):
    """Add a round-4 comment line right after the <svg> tag."""
    i = svg.index(">") + 1
    return svg[:i] + f"\n<!-- {text} -->" + svg[i:]
