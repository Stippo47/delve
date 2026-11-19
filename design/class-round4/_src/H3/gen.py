"""H3 heroes (ranged and sly). Run: python gen.py [name ...]  -> ../../heroes-ranged/ranged-<name>.svg"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from lib import *

OUT = pathlib.Path(__file__).resolve().parents[2] / "heroes-ranged"
OUT.mkdir(parents=True, exist_ok=True)
PL, PR = (46, 108), (154, 108)
STEEL, DSTEEL, WOOD, DWOOD, GOLD, BRASS = "#D3D8E0", "#9AA2AE", "#B57944", "#7A4E2C", "#F2B53A", "#D9A441"
LAYOUT = ("Parts in draw order inside #sprite; the outline comes from the #outline filter. Facing = DOWN (+y), "
          "centre (100,100).")

HAIR = "#3E2A26"
DARK_SKIN = (
    '<radialGradient id="gHandD" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#B9805A"/>'
    '<stop offset="1" stop-color="#8E5A3C"/></radialGradient>'
    '<linearGradient id="gFaceD" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
    '<stop offset="0" stop-color="#6E4230"/><stop offset="0.2" stop-color="#8E5A3E"/><stop offset="0.45" stop-color="#AF7550"/>'
    '<stop offset="0.85" stop-color="#B57B56"/><stop offset="1" stop-color="#A06A48"/></linearGradient>')


def save(name, S):
    p = OUT / f"ranged-{name}.svg"
    p.write_text(S.svg(), encoding="utf-8")
    return p


def head(S, dark=False):
    face = "url(#gFaceD)" if dark else "url(#gFace)"
    return S.shape(HEAD, fill=face, shadow=5,
                   decor='<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>')


def fist(S, cx, cy, a=0, dark=False, w=21, h=25, T=None, shadow=3, under=False):
    """A fist whose long side (the knuckle row) runs along local y: along the handle in that frame."""
    if T is None:
        T = frame(cx, cy, a); cx = cy = 0
    S.shape(rr(cx, cy, w, h, 8), fill="url(#gHandD)" if dark else "url(#gHand)", T=T, shadow=shadow, side=False,
            over="url(#gUnder)" if under else None)


def mouth(S, y=136.5, c="#C98868"):
    S.raw(f'<path d="M96 {f(y)} Q100 {f(y + 2.5)} 104 {f(y)}" fill="none" stroke="{c}" stroke-width="2.5" '
          f'stroke-linecap="round"/>')


def strip(spine, w, wave=0.0, waves=3, taper=(0.35, 1.0)):
    """A soft tapered strip (feather, ribbon, braid) along a polyline spine; w = half width at the widest."""
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


def feather(spine, w, notches=(0.5, 0.72), cut=0.3):
    """A feather along a spine (base -> tip): returns (outline, one darker half). Notches cut into the left edge."""
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
    out = blob(L + R[::-1][1:-1], 0.55)
    half = blob(list(spine) + R[::-1][1:-1], 0.55)
    return out, half


def curve(p0, p1, p2, n=9):
    """Points on a quadratic curve (for spines)."""
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / (n - 1) for i in range(n))]


# ------------------------------------------------------------------ 1. Marksman
def marksman():
    S = Sprite("RANGED Marksman: a wide teal slouch hat with a big cream plume sweeping back, buff leather coat, white "
               "cravat. A long musket aimed forward, held in front with both hands (all in arm-r, arm-l left out): the "
               "stock runs under the head (drawn before #body), the rear fist grips the wrist beside the chin and the "
               "front hand cradles the fore-stock, so the long barrel shows out front. " + LAYOUT)
    S.group("arm-r", PR, "musket, both hands")
    T = frame(148, 50, 2)
    S.shape(blob([(-11, 0), (11, 0), (11, 50), (8, 92), (-8, 92), (-11, 50)], 0.6), WOOD, T=T, shadow=0)
    fist(S, 0, 127, T=T, w=25, h=21, shadow=0)
    S.shape(rr(0, 112, 12, 52, 5), WOOD, T=T, shadow=3)
    S.shape(rr(0, 120, 8, 72, 4), STEEL, T=T, shadow=2,
            decor='<rect x="-3.5" y="84" width="2.6" height="72" fill="#F4F6F9" opacity="0.8"/>')
    S.shape(rr(0, 142, 13, 5, 2), BRASS, T=T, shadow=1)
    S.shape(rr(0, 153, 12, 6, 2.5), BRASS, T=T, shadow=1)
    fist(S, 0, 99, T=T, w=21, h=22)
    S.group("body")
    S.shape(SHOULDERS, "#A8323A",
            decor='<path d="M 40 86 L 54 82 L 72 140 L 58 140 Z" fill="#F2B53A"/>')
    S.shape(blob([(84, 132), (100, 126), (116, 132), (112, 152), (100, 160), (88, 152)], 0.9), "#F1ECE2", shadow=3)
    head(S)
    S.shape(ell(100, 62, 66, 52), "#2C7A7B", shadow=5,
            decor=f'<path d="{ell(100, 58, 54, 40)}" fill="#3A9192" opacity="0.5"/>')
    S.shape(circ(100, 62, 32), "#246668", shadow=4,
            decor='<path d="M 62 72 C 80 82 120 82 138 72 L 138 96 L 62 96 Z" fill="#1E3E40" opacity="0.8"/>'
                  f'<path d="{ell(88, 50, 12, 8)}" fill="#3E9C9C" opacity="0.7"/>')
    out, half = feather(curve((116, 86), (170, 72), (164, -4), 17), 13, (0.5, 0.75), 0.5)
    S.shape(out, "#F7F0DE", shadow=3, decor=f'<path d="{half}" fill="#DCCDAA"/>')
    mouth(S)
    return save("marksman", S)


# ------------------------------------------------------------------ 2. Ninja
def ninja():
    S = Sprite("RANGED Ninja: charcoal hood and mask wrapped round the head with only a narrow slit of face showing, "
               "two long crimson scarf tails trailing behind from the knot, a katana slung on the back (hilt over the "
               "left shoulder). A big steel shuriken pinched in each hand (arm-l, arm-r, drawn before #body). " + LAYOUT)
    S.group("back", (100, 50), "scarf tails + katana on the back")
    T = frame(56, 38, -50)
    S.shape(rr(0, 60, 12, 110, 5), "#2A2630", T=T, shadow=0)
    S.shape(rr(0, -4, 10, 30, 4), "#C9C2B0", T=T, shadow=0,
            decor='<path d="M -6 -16 L 6 -10 M -6 -6 L 6 0 M -6 4 L 6 10" stroke="#3A3440" stroke-width="3"/>')
    S.shape(ell(0, 13, 13, 5), GOLD, T=T, shadow=2)
    S.shape(strip(curve((100, 50), (118, 26), (150, 0), 11), 8, 0.35, 2, (0.8, 1.0)), "#C8323A", shadow=0)
    S.shape(strip(curve((104, 52), (140, 40), (176, 18), 11), 7.5, 0.35, 2, (0.8, 1.0)), "#A8262F", shadow=0)
    for side, x in (("arm-l", 52), ("arm-r", 148)):
        S.group(side, PL if side == "arm-l" else PR, "shuriken")
        s = 1 if x > 100 else -1
        S.shape(blob(star(x + 2 * s, 172, 20, 5.5, 4, 45 if s > 0 else 0), 0.15), STEEL, shadow=0,
                decor=f'<path d="{circ(x + 2 * s, 172, 4)}" fill="#3A3440"/>')
        fist(S, x, 148, -8 * s)
    S.group("body")
    S.shape(SHOULDERS, "#3D3946")
    head(S)
    S.shape(blob([(48, 112), (46, 84), (60, 56), (100, 42), (140, 56), (154, 84), (152, 112), (128, 106), (100, 104),
                  (72, 106)], 0.85), "#3D3946", shadow=4,
            decor=f'<path d="{ell(84, 64, 22, 12)}" fill="#55505F" opacity="0.6"/>')
    S.shape(blob([(52, 122), (76, 128), (100, 129), (124, 128), (148, 122), (142, 142), (122, 154), (100, 158),
                  (78, 154), (58, 142)], 0.9), "#34303C", shadow=3)
    S.shape(circ(100, 48, 9), "#B02A33", shadow=2)
    return save("ninja", S)


# ------------------------------------------------------------------ 3. Crossbowman
def crossbowman():
    S = Sprite("RANGED Crossbowman: steel kettle hat with a wide flat brim, cream padded gambeson, a tall round-topped "
               "pavise slung on the back (yellow and red halves). A heavy crossbow held in front with both fists on "
               "the stock (all in arm-r, arm-l left out), drawn before #body; the steel prod runs across ahead of the "
               "face. " + LAYOUT)
    S.group("back", None, "pavise on the back")
    pav = "M 54 116 L 46 26 C 44 4 70 -4 100 -4 C 130 -4 156 4 154 26 L 146 116 Z"
    S.shape(pav, "#E9B53A", T="rotate(-10 100 60)", shadow=0,
            decor='<rect x="100" y="-10" width="60" height="130" fill="#C23B35"/>'
                  '<rect x="95" y="-10" width="10" height="130" fill="#7A4E2C"/>'
                  f'<path d="{pav}" fill="none" stroke="#6A4428" stroke-width="12"/>')
    S.group("arm-r", PR, "crossbow, both hands")
    T = frame(116, 112, 0)
    S.shape(rr(0, 40, 16, 84, 6), WOOD, T=T, shadow=0)
    S.raw(f'<path d="M -46 70 L 0 74 L 46 70" transform="{T}" fill="none" stroke="#F3EDE0" stroke-width="2.5" '
          'stroke-linejoin="round"/>')
    S.shape(blob([(-50, 66), (-30, 76), (0, 80), (30, 76), (50, 66), (52, 76), (30, 88), (0, 92), (-30, 88), (-52, 76)],
                 0.7), "#B3BAC6", T=T, shadow=3,
            decor='<path d="M -60 60 L -40 70 L -44 90 L -64 86 Z M 60 60 L 40 70 L 44 90 L 64 86 Z" fill="#4A4450"/>')
    S.shape(rr(0, 80, 4.5, 26, 2), DWOOD, T=T, shadow=0)
    S.shape(poly([(-6, 90), (6, 90), (0, 100)]), STEEL, T=T, shadow=0)
    fist(S, -12, 52, T=T, w=19, h=25)
    fist(S, 12, 52, T=T, w=19, h=25)
    S.group("body")
    S.shape(SHOULDERS, "#4A5068",
            decor='<path d="M 26 100 H 174 M 26 118 H 174" stroke="#5E6680" stroke-width="5" opacity="0.7"/>')
    head(S)
    S.shape(ell(100, 72, 70, 50), "#B4BCC8", shadow=5,
            decor=f'<path d="{ell(100, 70, 58, 38)}" fill="#C9D0DA" opacity="0.5"/>')
    S.shape(circ(100, 66, 30), "#CDD4DE", shadow=4,
            decor='<path d="M 97 30 H 103 V 100 H 97 Z" fill="#EEF1F5" opacity="0.8"/>')
    mouth(S, 138)
    return save("crossbowman", S)


# ------------------------------------------------------------------ 4. Trapper
def trapper():
    S = Sprite("RANGED Trapper: a raccoon-skin cap with a ringed tail hanging behind, buckskin coat with a cream fur "
               "collar. An open steel jaw trap held out by its chain in the right hand (arm-r, drawn before #body), "
               "left hand free. " + LAYOUT)
    S.group("back", (100, 50), "raccoon tail")
    spine = curve((100, 50), (82, 26), (60, 0), 7)
    for i, (x, y) in enumerate(spine):
        S.shape(circ(x, y, 13.5 - i * 0.4 if i < 6 else 11), "#2E2830" if i % 2 else "#958B7E", shadow=2 if i else 0)
    S.group("arm-r", PR, "jaw trap on a chain")
    for i in range(3):
        S.shape(ell(151 + i * 1.5, 148 + i * 7, 3.5, 4.5), DSTEEL, shadow=0)
    cx, cy = 156, 180
    S.shape(rr(cx, cy - 22, 7, 12, 3), "#8E96A2", shadow=0)
    ring = circ(cx, cy, 25) + " " + circ(cx, cy, 16)
    S.shape(ring, "#9AA2AE", shadow=0, rule="evenodd")
    for a in range(0, 360, 60):
        r = math.radians(a + 30)
        S.shape(poly([(cx + 18 * math.cos(r - 0.42), cy + 18 * math.sin(r - 0.42)),
                      (cx + 18 * math.cos(r + 0.42), cy + 18 * math.sin(r + 0.42)),
                      (cx + 6 * math.cos(r), cy + 6 * math.sin(r))]), "#E2E6EC", shadow=0, side=False)
    fist(S, 150, 142, -10)
    S.group("body")
    S.shape(SHOULDERS, "#C09060")
    S.shape(cloud(100, 104, 46, 16, 0.62), "#E9DEC6", shadow=3)
    head(S)
    cap = cloud(100, 76, 47, 24, 0.7, 4)
    S.shape(cap, "#8E857A", shadow=5,
            decor='<path d="M 40 96 C 70 108 130 108 160 96 V 130 H 40 Z" fill="#5E574E" opacity="0.8"/>'
                  f'<path d="{ell(84, 60, 20, 13)}" fill="#ADA496" opacity="0.6"/>')
    mouth(S)
    S.group("arm-l", PL, "free hand")
    fist(S, 52, 146, -8)
    return save("trapper", S)


# ------------------------------------------------------------------ 5. Pirate
def pirate():
    S = Sprite("RANGED Pirate: black tricorn hat with gold edging worn point-forward, black hair and a big black "
               "beard, burgundy coat with gold epaulettes. A curved cutlass with a gold basket guard in the left hand "
               "and a flintlock pistol in the right; both arms are drawn before #body (weapons come out forward from "
               "under the shoulders). " + LAYOUT)
    S.group("arm-l", PL, "cutlass")
    T = frame(50, 142, -14)
    S.shape(rr(0, -10, 9, 22, 4), "#4A2E1E", T=T, shadow=0)
    S.shape("M -9 8 L -11 46 C -11 62 -4 72 8 78 C 12 62 13 42 10 8 Z", STEEL, T=T, shadow=0,
            decor='<path d="M -4 10 L -5 50 C -5 60 0 68 6 72" stroke="#F4F6F9" stroke-width="3" fill="none" opacity="0.8"/>')
    S.shape("M -16 4 Q 0 0 16 4 L 16 11 Q 0 8 -16 11 Z", GOLD, T=T, shadow=2)
    S.shape("M 10 -16 C 20 -12 22 0 14 8 L 9 6 C 15 0 14 -8 8 -11 Z", GOLD, T=T, shadow=0)
    fist(S, 0, -6, T=T, w=20, h=24)
    S.group("arm-r", PR, "flintlock pistol")
    T = frame(150, 138, 4)
    S.shape(blob([(-8, -8), (8, -8), (9, 14), (6, 34), (-6, 34), (-9, 14)], 0.7), "#7A4A2A", T=T, shadow=0)
    S.shape(rr(0, 40, 9, 44, 4), DSTEEL, T=T, shadow=2,
            decor='<rect x="-3" y="18" width="2.4" height="44" fill="#E6EAF0" opacity="0.7"/>')
    S.shape(rr(0, 60, 14, 8, 3), GOLD, T=T, shadow=1)
    S.shape(rr(0, 22, 13, 6, 2.5), GOLD, T=T, shadow=1)
    fist(S, 0, 4, T=T, w=21, h=24)
    S.group("body")
    S.shape(SHOULDERS, "#8E2F3E",
            decor='<path d="M 26 104 C 40 96 60 94 74 100 L 74 108 C 60 102 40 104 26 112 Z M 174 104 C 160 96 140 94 126 100 L 126 108 C 140 102 160 104 174 112 Z" fill="#E8A030"/>')
    head(S)
    S.shape(blob([(52, 122), (52, 80), (66, 56), (100, 46), (134, 56), (148, 80), (148, 122), (136, 120), (130, 98),
                  (100, 92), (70, 98), (64, 120)], 0.85), "#2E2830", shadow=4)
    S.shape(cloud(100, 140, 30, 10, 0.62), "#2E2830", shadow=3)
    mouth(S, 123)
    hat = ("M 100 112 C 92 98 74 82 44 72 C 30 66 24 56 30 46 C 52 52 76 40 100 40 C 124 40 148 52 170 46 "
           "C 176 56 170 66 156 72 C 126 82 108 98 100 112 Z")
    S.shape(hat, "#2B2530", shadow=5,
            decor=f'<path d="{hat}" fill="none" stroke="{GOLD}" stroke-width="9"/>')
    S.shape(circ(100, 62, 24), "#3A3340", shadow=3)
    return save("pirate", S)


# ------------------------------------------------------------------ 6. Javelin huntress
def huntress():
    S = Sprite("RANGED Javelin huntress (a woman): long black hair falling over her shoulders, a coral headband with a "
               "white feather, a long beaded braid down her back, a spotted ochre pelt over the shoulders, two spare "
               "javelins slung on her back (heads up behind the right shoulder). A javelin in the right hand (arm-r, "
               "drawn before #body: the shaft runs under the shoulder and the head comes out forward), left hand free "
               "and raised to aim. Darker skin. " + LAYOUT)
    S.add_def(DARK_SKIN)
    S.group("back", (100, 50), "braid + spare javelins")
    for (x, y, a) in ((150, 24, 202), (166, 36, 216)):
        T = frame(x, y, a)
        S.shape(rr(0, -40, 6, 110, 3), "#9A6A3E", T=T, shadow=0)
        S.shape("M 0 18 C -8 6 -7 -6 0 -14 C 7 -6 8 6 0 18 Z", STEEL, T=T, shadow=0)
    T = frame(92, 48, 132) + " scale(0.86)"
    S.shape(blob([(-10, 0), (-16, 18), (-17, 38), (-12, 58), (-2, 74), (4, 80), (6, 66), (14, 46), (15, 24), (10, 0)], 0.9),
            HAIR, T=T, shadow=0,
            decor='<path d="M -2 4 C -6 30 -4 54 2 76 M 6 6 C 8 26 6 50 2 70" stroke="#6A4A40" stroke-width="3" fill="none" opacity="0.7"/>')
    S.shape(rr(0, 4, 26, 11, 5), "#E4604A", T=T, shadow=2)
    S.group("arm-r", PR, "javelin")
    T = frame(158, 56, 7)
    S.shape(rr(0, 64, 6.5, 128, 3), "#B07A46", T=T, shadow=0)
    S.shape(rr(0, 96, 9, 14, 3), "#E4604A", T=T, shadow=0)
    S.shape("M 0 154 C -10 140 -9 128 -4 118 L 4 118 C 9 128 10 140 0 154 Z", STEEL, T=T, shadow=0,
            decor='<path d="M -1 118 V 152 H 2 V 118 Z" fill="#F4F6F9" opacity="0.7"/>')
    fist(S, 0, 96, T=T, dark=True)
    S.group("body")
    S.shape(SHOULDERS, "#D79B3E",
            decor=''.join(f'<path d="{ell(x, y, rx, ry)}" fill="#7A4A22" opacity="0.85"/>'
                          for x, y, rx, ry in ((36, 98, 6, 5), (30, 118, 5, 4), (166, 96, 6, 4), (170, 116, 5, 6),
                                               (150, 132, 5, 4), (50, 132, 5, 4))))
    S.shape(blob([(52, 80), (66, 76), (70, 106), (64, 132), (50, 136), (40, 122), (42, 98)], 0.9), HAIR, shadow=3)
    S.shape(blob([(148, 80), (134, 76), (130, 106), (136, 132), (150, 136), (160, 122), (158, 98)], 0.9), HAIR, shadow=3)
    head(S, dark=True)
    S.shape(blob([(52, 110), (54, 74), (72, 52), (100, 44), (128, 52), (146, 74), (148, 110), (136, 100), (116, 94),
                  (100, 98), (84, 94), (64, 100)], 0.85), HAIR, shadow=4,
            decor='<path d="M 99 44 L 100 94" stroke="#2A1C1A" stroke-width="3"/>'
                  f'<path d="{ell(80, 62, 14, 9)}" fill="#6A4A40" opacity="0.6"/>')
    S.shape("M 52 96 C 68 86 132 86 148 96 L 148 104 C 132 94 68 94 52 104 Z", "#E4604A", shadow=2)
    S.shape(circ(52, 112, 5), GOLD, shadow=2)
    S.shape(circ(148, 112, 5), GOLD, shadow=2)
    mouth(S, 137, "#7A4430")
    S.group("arm-l", PL, "free hand, raised to aim")
    fist(S, 50, 150, -14, dark=True)
    return save("javelin-huntress", S)


# ------------------------------------------------------------------ 7. Grenadier
def grenadier():
    S = Sprite("RANGED Grenadier: red-orange knit cap with a cream turn-up and a pompom, big brown handlebar moustache, "
               "olive coat, a burlap sack of bombs on the back (its strap over the left shoulder). A round black bomb "
               "with a lit fuse in the right hand (arm-r, drawn before #body; the hand cups the bomb), left hand "
               "free. " + LAYOUT)
    S.group("back", (100, 56), "sack of bombs")
    S.shape(blob([(58, 60), (60, 30), (76, 10), (100, 4), (124, 10), (140, 30), (142, 60)], 0.9), "#C9A36C", shadow=0,
            decor='<path d="M 58 40 C 80 46 120 46 142 40" stroke="#A88454" stroke-width="5" fill="none"/>')
    for x, y, r in ((82, 16, 13), (106, 10, 14), (126, 22, 12)):
        S.shape(circ(x, y, r), "#3A3440", shadow=2,
                decor=f'<path d="{circ(x - r * 0.35, y - r * 0.35, r * 0.35)}" fill="#7A7484" opacity="0.8"/>')
    S.group("arm-r", PR, "bomb with a lit fuse")
    fist(S, 150, 148, -6)
    S.shape(circ(154, 174, 17), "#3A3440", shadow=3,
            decor=f'<path d="{circ(148, 168, 6)}" fill="#8A8494" opacity="0.8"/>')
    S.shape(rr(160, 158, 8, 7, 2), "#8A8494", shadow=0)
    S.raw('<path d="M 162 156 Q 170 150 168 144" stroke="#7A5A3A" stroke-width="3" fill="none" stroke-linecap="round"/>')
    S.shape(blob(star(169, 141, 9, 4, 6, 10), 0.2), "#FFB03A", shadow=0, side=False,
            decor=f'<path d="{circ(169, 141, 3.5)}" fill="#FFF3B0"/>')
    S.group("body")
    S.shape(SHOULDERS, "#6F7A45",
            decor='<path d="M 36 82 L 52 78 L 76 140 L 58 140 Z" fill="#7A5232"/>')
    head(S)
    S.shape(blob([(54, 104), (54, 74), (72, 52), (100, 44), (128, 52), (146, 74), (146, 104), (100, 98)], 0.85),
            "#D9572B", shadow=4,
            decor='<path d="M 80 48 V 100 M 100 44 V 100 M 120 48 V 100" stroke="#B8441E" stroke-width="4" opacity="0.6"/>')
    S.shape("M 52 94 C 70 86 130 86 148 94 L 148 108 C 130 100 70 100 52 108 Z", "#EFE6D2", shadow=2)
    S.shape(cloud(100, 64, 11, 7, 0.75), "#F3ECDC", shadow=3)
    S.shape("M 100 124 C 92 118 80 118 72 124 C 66 128 62 126 60 120 C 62 132 74 136 86 132 C 92 130 98 130 100 128 "
            "C 102 130 108 130 114 132 C 126 136 138 132 140 120 C 138 126 134 128 128 124 C 120 118 108 118 100 124 Z",
            "#8A5230", shadow=2)
    return save("grenadier", S)


# ------------------------------------------------------------------ 8. Slinger
def slinger():
    S = Sprite("RANGED Slinger (a shepherd): a blue-and-white striped headcloth draped over the head and down the back, "
               "held by a dark cord ring, fleece on the shoulders over an earth-brown tunic. A sling in the right hand "
               "(two cords and a pouch with a stone, swinging out front), a shepherd's crook in the left hand with the "
               "hook forward; both arms drawn before #body. " + LAYOUT)
    S.group("arm-l", PL, "shepherd's crook")
    T = frame(44, 40, -4)
    S.shape(rr(0, 72, 8, 150, 4), "#9C6A3C", T=T, shadow=0)
    S.raw(f'<path d="M 0 146 C 0 170 22 172 22 156 C 22 146 12 144 10 150" transform="{T}" fill="none" '
          'stroke="#9C6A3C" stroke-width="8" stroke-linecap="round"/>')
    fist(S, 0, 106, T=T)
    S.group("arm-r", PR, "sling")
    S.raw('<path d="M 150 152 C 154 168 148 182 154 192 M 152 152 C 166 164 172 178 168 192" stroke="#8A6040" '
          'stroke-width="3.5" fill="none" stroke-linecap="round"/>')
    S.shape(ell(161, 194, 14, 9), "#7A5236", shadow=0)
    S.shape(circ(161, 193, 8), "#B4AEA4", shadow=2)
    fist(S, 150, 146, -10)
    S.group("body")
    S.shape(SHOULDERS, "#9A6E46")
    S.shape(cloud(100, 108, 64, 17, 0.62), "#F2EBDC", T="translate(100 104) scale(1.1 0.62) translate(-100 -108)", shadow=3,
            decor=f'<path d="{ell(76, 94, 26, 14)}" fill="#FFFFFF" opacity="0.45"/>')
    S.shape(blob([(48, 104), (42, 70), (50, 36), (70, 14), (100, 6), (130, 14), (150, 36), (158, 70), (152, 104),
                  (100, 92)], 0.85), "#7FA8CE", shadow=4,
            decor='<path d="M 30 52 C 60 42 140 42 170 52 L 170 62 C 140 52 60 52 30 62 Z" fill="#E9F0F6" opacity="0.9"/>')
    head(S)
    S.shape(blob([(52, 108), (50, 78), (64, 54), (100, 44), (136, 54), (150, 78), (148, 108), (130, 98), (100, 95),
                  (70, 98)], 0.85), "#8DB4D8", shadow=4,
            decor=f'<path d="{ell(84, 62, 20, 12)}" fill="#B7D2EA" opacity="0.6"/>')
    S.shape("M 54 90 C 70 80 130 80 146 90 L 147 99 C 130 89 70 89 53 99 Z", "#6A4428", shadow=2)
    mouth(S)
    return save("slinger", S)


# ------------------------------------------------------------------ 9. Falconer
def falconer():
    S = Sprite("RANGED Falconer: rust-red beret worn tilted with a long tan feather, brown leather jerkin over a green "
               "shirt. A slate-grey falcon with half-spread wings perched on the thick leather gauntlet of the raised "
               "left fist (arm-l, drawn after #body so the bird sits on top); right hand free. " + LAYOUT)
    S.group("body")
    S.shape(SHOULDERS, "#6B4A33")
    S.shape(blob([(64, 84), (100, 80), (136, 84), (132, 140), (100, 146), (68, 140)], 0.8), "#4E7A62", shadow=3)
    head(S)
    S.shape(blob([(56, 100), (52, 72), (66, 50), (100, 42), (134, 50), (148, 72), (144, 100), (100, 104)], 0.85),
            "#5A3A26", shadow=4)
    S.shape(ell(110, 66, 56, 40), "#C0532F", shadow=4,
            decor=f'<path d="{ell(98, 56, 32, 20)}" fill="#D96B44" opacity="0.6"/>')
    S.shape(circ(112, 62, 6), "#A8442A", shadow=2)
    S.shape(strip(curve((132, 52), (150, 30), (148, -4), 11), 7.5, 0, 1, (0.45, 1)), "#E2C89A", shadow=3,
            decor='<path d="M 132 52 Q 150 30 148 -4" stroke="#8A6A40" stroke-width="2.5" fill="none"/>'
                  '<path d="M 136 0 L 160 0 L 158 12 L 138 12 Z" fill="#6A4A2C"/>')
    mouth(S)
    S.group("arm-r", PR, "free hand")
    fist(S, 148, 146, 8)
    S.group("arm-l", PL, "gauntlet + falcon")
    S.shape(rr(48, 142, 30, 30, 11), "#8A5A33", shadow=3)
    bx, by = 44, 166
    S.shape(blob([(bx - 8, by - 8), (bx + 8, by - 8), (bx + 12, by - 36), (bx, by - 40), (bx - 12, by - 36)], 0.6),
            "#4E5A6E", shadow=3)
    for s_ in (-1, 1):
        S.shape(blob([(bx + 6 * s_, by + 6), (bx + 24 * s_, by + 2), (bx + 40 * s_, by - 10), (bx + 44 * s_, by - 26),
                      (bx + 30 * s_, by - 18), (bx + 14 * s_, by - 14), (bx + 6 * s_, by - 8)], 0.75), "#7D8CA4",
                shadow=3,
                decor=f'<path d="M {bx + 28 * s_} {by - 36} L {bx + 52 * s_} {by - 24} L {bx + 40 * s_} {by - 2} '
                      f'L {bx + 30 * s_} {by - 8} Z" fill="#4A5468"/>')
    S.shape(ell(bx, by, 12, 18), "#8C9AB0", shadow=3,
            decor=f'<path d="M {bx - 6} {by - 6} Q {bx} {by - 2} {bx + 6} {by - 6} M {bx - 5} {by - 14} Q {bx} {by - 10} {bx + 5} {by - 14}" stroke="#6A7890" stroke-width="2.5" fill="none"/>')
    S.shape(circ(bx, by + 14, 10.5), "#3E4658", shadow=3,
            decor=f'<path d="{ell(bx, by + 21, 7.5, 4)}" fill="#EFE6D4"/>')
    S.shape("M {0} {1} L {2} {1} C {2} {3} {4} {5} {6} {5} Z".format(bx - 4.5, by + 22, bx + 4.5, by + 29, bx + 1, by + 31, bx),
            GOLD, shadow=2)
    S.raw(f'<circle cx="{bx - 6}" cy="{by + 17}" r="1.8" fill="#1A1420"/><circle cx="{bx + 6}" cy="{by + 17}" r="1.8" fill="#1A1420"/>')
    return save("falconer", S)


# ------------------------------------------------------------------ 10. Harpooner
def harpooner():
    S = Sprite("RANGED Harpooner: yellow oilskin sou'wester (long back flap, narrow front brim), grey beard, navy "
               "knit sweater. A big barbed harpoon in the right hand (arm-r, drawn before #body: the shaft runs under "
               "the shoulder, the head comes out forward) with its rope looping across the front to a coil held in the "
               "left hand (arm-l). " + LAYOUT)
    S.group("arm-r", PR, "harpoon + its rope")
    T = frame(165, 25, 7)
    S.shape(rr(0, 64, 9, 132, 4.5), "#A87444", T=T, shadow=0)
    S.shape(rr(0, 136, 6, 34, 3), DSTEEL, T=T, shadow=0)
    S.shape("M 0 178 L -17 146 L -6 150 L -5 138 L 5 138 L 6 150 L 17 146 Z", STEEL, T=T, shadow=0,
            decor='<path d="M -1.5 140 L 0 176 L 1.5 140 Z" fill="#F4F6F9" opacity="0.8"/>')
    S.shape(rr(0, 126, 12, 7, 2.5), "#D8C08A", T=T, shadow=0)
    fist(S, 0, 112, T=T)
    S.group("body")
    S.shape(SHOULDERS, "#2F4560",
            decor='<path d="M 40 90 V 132 M 56 82 V 138 M 144 82 V 138 M 160 90 V 132" stroke="#3E5878" stroke-width="5" opacity="0.6"/>')
    head(S)
    S.shape(cloud(100, 140, 30, 10, 0.62), "#C9C6C2", shadow=3)
    mouth(S, 122)
    hat = blob([(44, 100), (34, 70), (40, 34), (60, 6), (100, -6), (140, 6), (160, 34), (166, 70), (156, 100),
                (132, 108), (100, 110), (68, 108)], 0.85)
    S.shape(hat, "#E0AC22", shadow=5,
            decor=f'<path d="{ell(76, 30, 22, 20)}" fill="#F2C845" opacity="0.6"/>')
    S.shape(circ(100, 68, 33), "#EDBE33", shadow=3, sop=0.2,
            decor=f'<path d="{ell(88, 56, 12, 8)}" fill="#F8D868" opacity="0.7"/>')
    S.group("arm-l", PL, "rope coil")
    S.raw('<path d="M 66 178 C 92 198 126 198 146 182" stroke="#D8C08A" stroke-width="4" fill="none" stroke-linecap="round"/>')
    S.shape(circ(54, 166, 18), "#D8C08A", shadow=3,
            decor=f'<path d="{circ(54, 166, 9)}" fill="#8E7A50"/>'
                  f'<path d="{circ(54, 166, 13.5)}" fill="none" stroke="#B8A06A" stroke-width="2"/>')
    fist(S, 52, 148, 78)
    return save("harpooner", S)


DESIGNS = {"marksman": marksman, "ninja": ninja, "crossbowman": crossbowman, "trapper": trapper, "pirate": pirate,
           "javelin-huntress": huntress, "grenadier": grenadier, "slinger": slinger, "falconer": falconer,
           "harpooner": harpooner}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(DESIGNS):
        print(DESIGNS[n]())
