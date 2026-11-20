"""Shared pieces for the A2 round-5 heroes (ranged and fighters)."""
import math, pathlib
from lib import *

ROOT5 = pathlib.Path(__file__).resolve().parents[2]
PL, PR = (46, 108), (154, 108)
STEEL, DSTEEL, WOOD, DWOOD, GOLD, BRASS = "#D3D8E0", "#9AA2AE", "#B57944", "#7A4E2C", "#F2B53A", "#D9A441"
LAYOUT = ("Parts in draw order inside #sprite; the outline comes from the #outline filter. Facing = DOWN (+y), "
          "centre (100,100). Hands and whatever they hold are in the arm groups, never in #body.")
DARK_SKIN = (
    '<radialGradient id="gHandD" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#B9805A"/>'
    '<stop offset="1" stop-color="#8E5A3C"/></radialGradient>'
    '<linearGradient id="gFaceD" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
    '<stop offset="0" stop-color="#6E4230"/><stop offset="0.2" stop-color="#8E5A3E"/><stop offset="0.45" stop-color="#AF7550"/>'
    '<stop offset="0.85" stop-color="#B57B56"/><stop offset="1" stop-color="#A06A48"/></linearGradient>')

# the farmers' hat (Haymaker), the base for brimmed hats: brim, crown (pushed back) and band
BRIM = "M28 68 C28 40 60 20 100 20 C140 20 172 40 172 68 C172 96 140 116 100 116 C60 116 28 96 28 68 Z"
CROWN = "M56 60 C54 34 75 24 100 24 C125 24 146 34 144 60 C144 74 125 82 100 82 C75 82 56 74 56 60 Z"
BAND = ("M56 56 C62 68 80 75 100 75 C120 75 138 68 144 56 C145 61 145 67 144 70 C138 80 120 85 100 85 "
        "C80 85 62 80 56 70 C55 67 55 61 56 56 Z")


def save(folder, name, S):
    out = ROOT5 / folder
    out.mkdir(parents=True, exist_ok=True)
    p = out / f"{name}.svg"
    p.write_text(S.svg(), encoding="utf-8")
    return p


def scl(k, cx=100, cy=68, dx=0, dy=0):
    """A transform scaling about (cx, cy), then moving by (dx, dy)."""
    return f"translate({f(cx + dx)} {f(cy + dy)}) scale({k}) translate({f(-cx)} {f(-cy)})"


def strokes(d, col, w, op=1.0, cap="round"):
    return (f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="{cap}" '
            f'stroke-linejoin="round" opacity="{op}"/>')


def head(S, dark=False, face=None):
    face = face or ("url(#gFaceD)" if dark else "url(#gFace)")
    return S.shape(HEAD, fill=face, shadow=5,
                   decor='<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>')


def fist(S, cx, cy, a=0, dark=False, w=21, h=25, T=None, shadow=3, under=False, hand=None):
    """A fist whose long side (the knuckle row) runs along local y: along the handle in that frame."""
    if T is None:
        T = frame(cx, cy, a); cx = cy = 0
    S.shape(rr(cx, cy, w, h, 8), fill=hand or ("url(#gHandD)" if dark else "url(#gHand)"), T=T, shadow=shadow,
            side=False, over="url(#gUnder)" if under else None)


def mouth(S, y=136.5, c="#C98868"):
    S.raw(f'<path d="M96 {f(y)} Q100 {f(y + 2.5)} 104 {f(y)}" fill="none" stroke="{c}" stroke-width="2.5" '
          f'stroke-linecap="round"/>')


def curve(p0, p1, p2, n=9):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / (n - 1) for i in range(n))]


def strip(spine, w, wave=0.0, waves=3, taper=(0.35, 1.0)):
    """A soft tapered strip (ribbon, tail) along a polyline spine; w = half width at the widest."""
    n = len(spine)
    L, R = [], []
    for i, (x, y) in enumerate(spine):
        a, b = spine[max(i - 1, 0)], spine[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        t = i / (n - 1)
        k = taper[0] + (taper[1] - taper[0]) * math.sin(math.pi * t) if 0 < t < 1 else 0.15
        ww = w * k
        wl = ww * (1 + wave * math.sin(t * math.pi * 2 * waves))
        L.append((x + nx * wl, y + ny * wl))
        R.append((x - nx * ww, y - ny * ww))
    return blob(L + R[::-1], 0.9)


def band(spine, w):
    """An even-width band along a spine with rounded ends."""
    n = len(spine)
    L, R = [], []
    for i, (x, y) in enumerate(spine):
        a, b = spine[max(i - 1, 0)], spine[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        L.append((x + nx * w, y + ny * w))
        R.append((x - nx * w, y - ny * w))
    return blob(L + R[::-1], 0.8)


def feather(spine, w, notches=(0.5, 0.72), cut=0.3):
    """A feather along a spine (base -> tip): returns (outline, one darker half)."""
    n = len(spine)
    L, R = [], []
    for i, (x, y) in enumerate(spine):
        a, b = spine[max(i - 1, 0)], spine[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        t = i / (n - 1)
        k = (0.45 + 0.55 * math.sin(math.pi * min(t / 0.6, 1) / 2)) * (1 - max(0, t - 0.75) / 0.25 * 0.92)
        kl = k * (cut if any(abs(t - c) < 0.5 / (n - 1) for c in notches) else 1)
        L.append((x + nx * w * kl, y + ny * w * kl))
        R.append((x - nx * w * k, y - ny * w * k))
    return blob(L + R[::-1][1:-1], 0.55), blob(list(spine) + R[::-1][1:-1], 0.55)


def circles(cs):
    """Several circles as one path (nonzero fill = their union)."""
    return " ".join(circ(x, y, r) for x, y, r in cs)


def moustache(S, col, y=124, w=1.0, droop=0.0):
    """A puffy moustache in two soft lobes meeting under the nose line (its own shape, over the face)."""
    cs = [(100, y - 1, 7.5)]
    for s in (-1, 1):
        cs += [(100 + s * 10 * w, y + 0.5, 9), (100 + s * 20 * w, y + 2 + droop * 0.5, 8.5),
               (100 + s * 28.5 * w, y + 4 + droop, 6.5)]
    S.shape(circles(cs), col, shadow=3,
            decor=strokes(f"M {f(100 - 26 * w)} {f(y - 1)} Q {f(100 - 14 * w)} {f(y - 7)} 100 {f(y - 4)} "
                          f"Q {f(100 + 14 * w)} {f(y - 7)} {f(100 + 26 * w)} {f(y - 1)}", light(col, 1.35), 3.5, 0.55))


def rifle(S, T, length=150, stock="#8A5530", metal="#8E96A4", bands=BRASS, fore=True, scope=None, hand="url(#gHand)",
          rear=52, front=92, butt=None):
    """A long gun in the local frame T: butt at y=0, muzzle at y=length (forward). Both fists on it."""
    bw = butt or 13
    S.shape(blob([(-bw, 0), (bw, 0), (bw - 1, 30), (6, rear + 4), (-6, rear + 4), (-bw + 1, 30)], 0.6), stock, T=T, shadow=0)
    if fore:
        S.shape(rr(0, rear + 30, 12, 64, 5), stock, T=T, shadow=2)
    S.shape(rr(0, rear + 10 + (length - rear - 10) / 2, 7.5, length - rear - 10, 3.5), metal, T=T, shadow=2,
            decor=f'<rect x="-2.6" y="{rear}" width="2.2" height="{length}" fill="#F4F6F9" opacity="0.65"/>')
    for yy in ((rear + 46, rear + 60) if bands else ()):
        S.shape(rr(0, yy, 13, 5, 2), bands, T=T, shadow=1)
    if scope:
        S.shape(rr(0, rear + 24, 10, 40, 4), scope, T=T, shadow=3,
                decor=f'<rect x="-3" y="{rear + 6}" width="2.4" height="36" fill="#FFF3C4" opacity="0.6"/>')
        S.shape(rr(0, rear + 6, 13, 6, 2.5), shade(scope, 0.8), T=T, shadow=1)
        S.shape(rr(0, rear + 42, 13, 6, 2.5), shade(scope, 0.8), T=T, shadow=1)
    fist(S, 0, front, T=T, w=22, h=22, hand=hand)
    fist(S, 0, rear, T=T, w=22, h=24, hand=hand)


def gun(S, T, stock="#8A5530", metal="#8E96A4", bands=BRASS, scope=None, hand="url(#gHand)", length=114,
        receiver="#5E6474", rear=30, front=84, k=1.35):
    """A long gun aimed forward in the local frame T (butt plate at y=0 on the shoulder, muzzle at y=length):
    a slim stock, a dark receiver with a trigger guard, a wooden fore-stock and a long steel barrel; both fists on it.
    k widens the gun (not the fists)."""
    T, TF = f"{T} scale({k} 1)", T
    S.shape(blob([(-8, 0), (8, 0), (7, 14), (4.5, 34), (-4.5, 34), (-7, 14)], 0.6), stock, T=T, shadow=0,
            decor='<rect x="-9" y="-2" width="18" height="4" fill="#3A2E2A" opacity="0.7"/>')
    S.shape(rr(0, 72, 6, length - 52 + 20, 3), metal, T=T, shadow=2,
            decor=f'<rect x="-2.2" y="30" width="1.8" height="{length}" fill="#F4F6F9" opacity="0.7"/>')
    S.shape(rr(0, 74, 10, 44, 4.5), stock, T=T, shadow=2)
    S.shape(rr(0, 44, 10, 22, 3.5), receiver, T=T, shadow=2)
    S.raw(f'<path d="M 5 42 C 12 44 12 54 5 56" transform="{T}" fill="none" stroke="{receiver}" stroke-width="3"/>')
    S.shape(rr(0, length - 2, 9, 6, 2.5), shade(metal, 0.75), T=T, shadow=1)
    if bands:
        for yy in (66, 92):
            S.shape(rr(0, yy, 12, 4.5, 2), bands, T=T, shadow=1)
    if scope:
        S.shape(rr(0, 54, 9, 34, 4), scope, T=T, shadow=3,
                decor='<rect x="-2.5" y="38" width="2" height="30" fill="#FFF3C4" opacity="0.55"/>')
        S.shape(rr(0, 38, 12, 6, 2.5), shade(scope, 0.75), T=T, shadow=1)
        S.shape(rr(0, 71, 12, 6, 2.5), shade(scope, 0.75), T=T, shadow=1)
    fist(S, 0, front, T=TF, w=21, h=21, hand=hand)
    fist(S, 0, rear, T=TF, w=21, h=23, hand=hand)
