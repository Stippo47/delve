"""Round 9: the builders the new creatures share, in round 8's creature style (the wolves, boar, crab and rat king: a
few simple capsule shapes, readable at game size) and with the A2 library the heroes were made with.
  wolf9    the round-8 wolf (wild8.py: the capsule body, the werewolf's skull, ears, snout and paws) with a coat,
           mane, back and tail of its own: the frost wolf, the hellhound.
  spider9  a spider in the same build: a round abdomen, a smaller head, fangs, four jointed legs a side (the back
           three pairs in #back, the front pair in the arm parts, so they strike): the frost and fire spiders.
  spirit9  the elemental spirits' one shared shape: a round glowing core with a curling wisp of a tail behind it and
           two small motes for hands, coloured per element, with the element's mark in the core.
Imported by frost9.py, ember9.py, spire9.py, dunes9.py, foundry9.py (paths relative to this file)."""
import math, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *
from wild8 import tufts, INKC, CLAW, PINK

ICE, ICE_L, ICE_D = "#B4E6F8", "#F0FBFF", "#6EB8DC"
FLAME_DEF = ('<linearGradient id="gFlame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB23A"/>'
             '<stop offset="1" stop-color="#E8542A"/></linearGradient>'
             '<linearGradient id="gFlameUp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFD25A"/>'
             '<stop offset="0.55" stop-color="#FF8A2E"/><stop offset="1" stop-color="#D8402A"/></linearGradient>')


def taper(pts, w0, w1, t=0.8):
    """A limb along a polyline, w0 wide at the start, w1 at the end, round ends (grove8.band_taper)."""
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


def shard(x, y, a, L, w, back=0.32):
    """An ice shard lying flat: a long diamond from (x, y) pointing along angle a (degrees, 0 = +y), length L, half
    width w; its widest point `back` of the way along. Returns (outline, the darker half)."""
    T = frame(x, y, a)
    pts = [(0, 0), (w, L * back), (0, L), (-w, L * back)]
    half = [(0, 0), (w, L * back), (0, L)]
    return poly(pts), poly(half), T


def ice_shard(S, x, y, a, L, w, shadow=2, col=ICE):
    d, half, T = shard(x, y, a, L, w)
    S.shape(d, col, T=T, shadow=shadow, side=False,
            decor=f'<path d="{half}" fill="{ICE_D}" opacity="0.45"/>'
                  f'<path d="M 0 {f(L * 0.08)} L {f(-w * 0.45)} {f(L * 0.3)} L 0 {f(L * 0.62)} Z" fill="{ICE_L}" opacity="0.8"/>')


def flame(cx, cy, a, L, w, k=0.9):
    """A flame tongue: base at (cx, cy), its tip along angle a (degrees, 0 = +y), length L, half width w."""
    T = frame(cx, cy, a)
    return blob([(0, -w * 0.3), (w * 0.95, L * 0.18), (w * 0.7, L * 0.5), (w * 0.18, L * 0.82), (0, L), (-w * 0.3, L * 0.7),
                 (-w * 0.8, L * 0.42), (-w * 0.9, L * 0.15)], k), T


# ================================================================== wolves (wild8.wolf, the round-8 wolf, as the base)
def paw(S, cx, cy, a, fur, claw=CLAW, k=1.0):
    """The werewolf's paw (wild8.py): a round furry pad, three short claws forward."""
    T = f"{frame(cx, cy, a)} scale({k})"
    for dx in (-6.5, 0, 6.5):
        S.shape("M -2.8 0 L 2.8 0 L 0 9 Z", claw, T=f"{T} translate({dx} 9)", shadow=0, side=False)
    S.shape(blob([(-12, -9), (0, -13), (12, -9), (13, 5), (0, 12), (-13, 5)], 0.9), fur, T=T, shadow=3)


def wolf9(S, c, hw=40, Y=12, mane=None, back=None, tail_tip=None, ear_in=PINK, claw=CLAW, stripe_op=0.7):
    """The round-8 wolf's parts (wild8.wolf) on a sprite S already described: #back (the tail), #body (the capsule,
    then `back`(S) on it, the mane, ears, skull, snout, nose), #arm-l / #arm-r (the front paws).
    c: fur, snout, stripe, muzzle, tip (tail tip), ruff. mane(S, Y): draws the ruff (else the wolf's cloud ruff).
    tail_tip(S, Y, tw): draws the tail's tip (else a dark tip of `tip`)."""
    fur, snout, stripe, muzzle = c["fur"], c["snout"], c["stripe"], c["muzzle"]
    S.group("back", (100, 52 + Y), "tail")
    tw = 14
    tail = blob([(100, 70 + Y), (100 + tw * 0.55, 56 + Y), (100 + tw, 30 + Y), (100 + tw * 0.85, 6 + Y), (100, -8 + Y),
                 (100 - tw * 0.85, 6 + Y), (100 - tw, 30 + Y), (100 - tw * 0.55, 56 + Y)], 0.9)
    if tail_tip:
        S.shape(tail, fur, shadow=0)
        tail_tip(S, Y, tw)
    else:
        S.shape(tail, fur, shadow=0, decor=f'<path d="{ell(100, -2 + Y, tw + 2, 15)}" fill="{c["tip"]}"/>')
    S.group("body")
    body = rr(100, 92 + Y, hw * 2, 96, hw)
    S.shape(body, fur, shadow=0, decor=f'<path d="{ell(100, 80 + Y, hw * 0.55, 38)}" fill="{shade(fur, 0.82)}" opacity="0.5"/>')
    if back:
        back(S, Y)
    if mane:
        mane(S, Y)
    else:
        ruff = cloud(100, 120 + Y, 40, 14, 0.52, 6)
        S.shape(ruff, c["ruff"], shadow=3, T=f"translate(100 {120 + Y}) scale(1.08 0.8) translate(-100 {-120 - Y})")
    for s in (-1, 1):
        ear = blob([(100 + s * 14, 116 + Y), (100 + s * 30, 84 + Y), (100 + s * 38, 96 + Y), (100 + s * 32, 122 + Y)], 0.6)
        inner = blob([(100 + s * 19, 113 + Y), (100 + s * 29, 92 + Y), (100 + s * 33, 99 + Y), (100 + s * 29, 116 + Y)], 0.6)
        S.shape(ear, fur, shadow=2, sop=0.18, decor=f'<path d="{inner}" fill="{ear_in}" opacity="0.75"/>')
    S.shape(ell(100, 128 + Y, 29, 28), fur, shadow=3, sop=0.15)
    sn = blob([(100, 130 + Y), (112, 136 + Y), (115, 154 + Y), (110, 172 + Y), (100, 180 + Y), (90, 172 + Y), (85, 154 + Y),
               (88, 136 + Y)], 0.85)
    S.shape(sn, snout, shadow=4,
            decor=f'<path d="M 82 {156 + Y} C 90 {166 + Y} 110 {166 + Y} 118 {156 + Y} L 118 {186 + Y} L 82 {186 + Y} Z" fill="{muzzle}"/>'
                  + strokes(f"M 100 {134 + Y} L 100 {160 + Y}", stripe, 4.5, stripe_op))
    S.shape(ell(100, 175 + Y, 8.5, 6.5), INKC, shadow=2, side=False,
            decor=f'<circle cx="97" cy="{173 + Y}" r="2.4" fill="#6A6278"/>')
    S.group("arm-l", (70, 118 + Y), "front paw")
    paw(S, 68, 154 + Y, 8, fur, claw)
    S.group("arm-r", (130, 118 + Y), "front paw")
    paw(S, 132, 154 + Y, -8, fur, claw)
    return S


# ================================================================== spiders
# legs, right side (the left mirrors them): hip on the head's side, knee out and up, foot out and down
SPIDER_LEGS = [((118, 140), (146, 152), (144, 190)),      # the front pair (arm parts, they strike)
               ((124, 132), (164, 128), (186, 158)),
               ((126, 122), (166, 104), (190, 84)),
               ((120, 112), (154, 80), (162, 42))]


def spider9(S, p, mark=None, joint=None, tips=None, scale=1.0):
    """A spider seen from above: #back (abdomen and the six back legs), #arm-l / #arm-r (the front legs), #body (the head
    and fangs). p: body, leg, fang colours (and 'dleg', the outer half of each leg). mark(S): the abdomen's pattern (decor
    svg). joint(x, y): decor svg painted on each knee (a glow). tips(S, x, y, a): something at each foot."""
    def leg(pts, w0=14, w1=7):
        (hx, hy), (kx, ky), (tx, ty) = pts
        # one smooth limb through hip, knee and foot; its outer half (knee to foot) painted p["dleg"]; joint() can paint
        # over the knee (decor, inside the leg)
        outer = strokes(f"M {f(kx)} {f(ky)} L {f(tx)} {f(ty)} L {f(tx + (tx - kx) * 0.4)} {f(ty + (ty - ky) * 0.4)}",
                        p["dleg"], 26) if p.get("dleg") else ""
        S.shape(taper([(hx, hy), (kx, ky), (tx, ty)], w0, w1, 0.7), p["leg"], shadow=0,
                decor=outer + (joint(kx, ky) if joint else ""))
        if tips:
            tips(S, tx, ty, -math.degrees(math.atan2(tx - kx, ty - ky)))
    S.group("back", (100, 104), "abdomen and the back legs")
    for s in (-1, 1):
        for L in SPIDER_LEGS[1:]:
            leg([(100 + s * (x - 100), y) for x, y in L])
    S.shape(ell(100, 62, 40, 46), p["body"], shadow=0, decor=mark(S) if mark else "")
    S.shape(rr(100, 106, 22, 14, 6), shade(p["body"], 0.8), shadow=2)    # the waist
    for gid, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + s * 20, 136), "front leg")
        leg([(100 + s * (x - 100), y) for x, y in SPIDER_LEGS[0]], 14, 9)
    S.group("body")
    S.shape(ell(100, 128, 30, 28), p["body"], shadow=4, sop=0.25,
            decor=f'<path d="{ell(90, 118, 14, 9)}" fill="#FFFFF4" opacity="0.18"/>')
    for s in (-1, 1):
        jaw = blob([(100 + s * 2, 148), (100 + s * 13, 146), (100 + s * 15, 158), (100 + s * 9, 166), (100 + s * 3, 162)], 0.9)
        S.shape(jaw, shade(p["body"], 0.86), shadow=3)
        fang = blob([(100 + s * 4, 160), (100 + s * 11, 161), (100 + s * 8, 171), (100 + s * 3, 178), (100 + s * 4, 169)], 0.8)
        S.shape(fang, p["fang"], shadow=2, side=False)
    return S


# ================================================================== spirits
# The elemental spirits (js/families.js spiritBrain: a ray to the nearest of its side that lends it the element; on
# death a burst of it): one shape for all of them, coloured per element, the element's mark in the core.
SPIRIT_COLS = {
    # core light, core edge, tail light, tail dark, mark
    "frost": ("#F4FCFF", "#8ED0EE", "#E6F8FF", "#7EC2E6", "#FFFFFF"),
    "fire": ("#FFF0A8", "#FF8A2E", "#FFC650", "#E0482A", "#FFF6D0"),
    "heal": ("#FFFBE0", "#F2C24A", "#FFF2B0", "#E8B640", "#FFFFFF"),
    "ward": ("#F4ECFF", "#A884E8", "#E2D4FF", "#8E6AD6", "#FFFFFF"),
    "poison": ("#F2FFC8", "#86C43A", "#D6F28A", "#5E9E2A", "#2E4A1E"),
    "haste": ("#FFFFFF", "#B8CCE6", "#F2F6FF", "#9CB2D4", "#7E94BA"),
    "shock": ("#FFFDE0", "#F2C23A", "#FFF29A", "#E0A82A", "#FFFFFF"),
}


def spirit_mark(el, cx, cy, col):
    """The element's mark inside the core (decor, no outline): one simple shape each."""
    if el == "frost":   # a six-armed snowflake
        arms = "".join(f'<path d="M {cx} {cy} L {f(cx + 19 * math.sin(math.radians(a)))} {f(cy - 19 * math.cos(math.radians(a)))}"/>'
                       for a in range(0, 360, 60))
        return (f'<g stroke="{col}" stroke-width="5.5" stroke-linecap="round" fill="none">{arms}</g>'
                f'<circle cx="{cx}" cy="{cy}" r="5" fill="{col}"/>')
    if el == "fire":    # a flame tongue, tip back
        d, T = flame(cx, cy + 14, 180, 34, 11)
        return f'<path d="{d}" transform="{T}" fill="{col}"/>'
    if el == "heal":    # a little sun: a disc and short rays
        rays = "".join(f'<path d="M {f(cx + 11 * math.sin(math.radians(a)))} {f(cy - 11 * math.cos(math.radians(a)))} L '
                       f'{f(cx + 17 * math.sin(math.radians(a)))} {f(cy - 17 * math.cos(math.radians(a)))}"/>' for a in range(0, 360, 45))
        return (f'<g stroke="{col}" stroke-width="3.4" stroke-linecap="round">{rays}</g>'
                f'<circle cx="{cx}" cy="{cy}" r="7.5" fill="{col}"/>')
    if el == "ward":    # a shield
        return (f'<path d="M {cx} {cy - 15} C {cx + 7} {cy - 11} {cx + 12} {cy - 11} {cx + 14} {cy - 12} C {cx + 15} {cy + 2} '
                f'{cx + 9} {cy + 11} {cx} {cy + 16} C {cx - 9} {cy + 11} {cx - 15} {cy + 2} {cx - 14} {cy - 12} C {cx - 12} {cy - 11} '
                f'{cx - 7} {cy - 11} {cx} {cy - 15} Z" fill="{col}" opacity="0.92"/>')
    if el == "poison":  # a drop, point forward
        return (f'<path d="M {cx} {cy + 17} C {cx + 4} {cy + 8} {cx + 12} {cy + 2} {cx + 12} {cy - 5} C {cx + 12} {cy - 12} {cx + 6} '
                f'{cy - 15} {cx} {cy - 15} C {cx - 6} {cy - 15} {cx - 12} {cy - 12} {cx - 12} {cy - 5} C {cx - 12} {cy + 2} '
                f'{cx - 4} {cy + 8} {cx} {cy + 17} Z" fill="{col}" opacity="0.75"/>')
    if el == "haste":   # a swirl
        return (f'<path d="M {cx - 13} {cy + 6} C {cx - 15} {cy - 10} {cx + 4} {cy - 17} {cx + 11} {cy - 7} C {cx + 17} {cy + 2} '
                f'{cx + 6} {cy + 11} {cx - 1} {cy + 5} C {cx - 6} {cy + 1} {cx - 2} {cy - 6} {cx + 4} {cy - 3}" fill="none" '
                f'stroke="{col}" stroke-width="4" stroke-linecap="round"/>')
    if el == "shock":   # a bolt
        return (f'<path d="M {cx + 3} {cy - 17} L {cx - 9} {cy + 2} L {cx} {cy + 2} L {cx - 4} {cy + 17} L {cx + 10} {cy - 3} '
                f'L {cx + 1} {cy - 3} Z" fill="{col}"/>')
    return ""


def comma_tail(x0, y0, cx, cy, x1, y1, w0, n=14):
    """A tail tapering from w0 wide at (x0, y0) to a point at (x1, y1), along a quadratic curve through control (cx, cy)."""
    L, R = [], []
    for i in range(n + 1):
        s = i / n
        x = (1 - s) ** 2 * x0 + 2 * (1 - s) * s * cx + s * s * x1
        y = (1 - s) ** 2 * y0 + 2 * (1 - s) * s * cy + s * s * y1
        dx = 2 * (1 - s) * (cx - x0) + 2 * s * (x1 - cx)
        dy = 2 * (1 - s) * (cy - y0) + 2 * s * (y1 - cy)
        d = math.hypot(dx, dy) or 1
        w = w0 / 2 * (1 - s) ** 0.9 + 0.6
        L.append((x - dy / d * w, y + dx / d * w))
        R.append((x + dy / d * w, y - dx / d * w))
    return blob(L + R[::-1][1:], 0.7)


# round 10 (art-round9 deck, on the Frost spirit: "That tail should be like that rat tail where it's wiggly/ follows
# behind"): tail=False leaves the drawn tail (#back) out, so the game can draw it as a springy ribbon behind the core
# (js/render.js, as it draws the rat's tail). The core is the round-9 core, untouched.
def spirit9(el, name, desc, tail=True):
    """The one spirit shape, in the element's colours (SPIRIT_COLS) with its mark: a comma, a round core with a tail
    sweeping back from it, tapering and curling to a point."""
    c0, c1, t0, t1, mk = SPIRIT_COLS[el]
    S = Sprite(f"{name.upper()} (round 9): an elemental spirit seen from above, the spirits' one shared shape: a round "
               f"glowing core with the element's mark in it and a wisp of a tail sweeping back from it, tapering and "
               f"curling to a point (a comma); {desc} No face. Parts: #back (the tail, sways), #body (the core). " + LAYOUT)
    gid = f"gSp{el}"
    S.add_def(f'<radialGradient id="{gid}" cx="0.4" cy="0.36" r="0.72"><stop offset="0" stop-color="{c0}"/>'
              f'<stop offset="0.55" stop-color="{light(c1, 1.18)}"/><stop offset="1" stop-color="{c1}"/></radialGradient>'
              f'<linearGradient id="{gid}T" x1="0" y1="1" x2="0.3" y2="0"><stop offset="0" stop-color="{t0}"/>'
              f'<stop offset="1" stop-color="{t1}"/></linearGradient>')
    if tail:
        S.group("back", (100, 100), "the tail")
        S.shape(comma_tail(100, 110, 70, 54, 128, 30, 52), fill=f"url(#{gid}T)", shadow=0, side=False,
                decor=f'<path d="{comma_tail(94, 92, 76, 58, 112, 40, 18)}" fill="{t0}" opacity="0.5"/>')
    else:
        S.comment = S.comment.replace("(round 9)", "(round 10: the core only)").replace(
            "a wisp of a tail sweeping back from it, tapering and curling to a point (a comma)",
            "no drawn tail: the game draws its tail as a ribbon that trails and wiggles behind it").replace(
            "Parts: #back (the tail, sways), #body (the core).", "Parts: #body (the core).")
    S.group("body")
    S.shape(circ(100, 116, 36), fill=f"url(#{gid})", shadow=3, side=False,
            decor=f'<path d="{circ(100, 116, 25)}" fill="{c0}" opacity="0.35"/>' + spirit_mark(el, 100, 118, mk)
                  + f'<path d="{ell(86, 100, 10, 6)}" fill="#FFFFFF" opacity="0.5"/>')
    return S
