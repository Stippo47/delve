"""Round 11: the two figures still wearing someone else's art. The Enchantress (a hero: today the Witch recoloured) and
the Succubus (an enemy of the Ember Deep: today the Devil recoloured), each drawn three ways in the approved heroes' and
enemies' bust build (A2 library: a head token on shoulders, fists in the arm parts, no eyes). docs/ART-NEEDED.md asks:
the Enchantress "her own bust: rose silk, a heart-shaped locket, no hat; a hand held up to blow kisses"; the Succubus
"bat wings, a whip or a long tail, a heart on the tip of the tail". The game keeps the recolours until a pick.
python people11.py [name ...]   -> ../../heroes/enchantress-*.svg, ../../enemies/ember-succubus-*.svg"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *
from beasts9 import taper

ROSE, DROSE, PINK, WINE = "#E8709A", "#B8446E", "#F7B6CC", "#6A2440"
hi = lambda x, y, rx, ry, o=0.22, rot=0: (f'<path d="{ell(x, y, rx, ry)}" fill="#FFFFF4" opacity="{o}"'
                                           + (f' transform="rotate({rot} {x} {y})"' if rot else "") + "/>")


def heart(cx, cy, s):
    """A heart, its point down (+y), about 2s wide."""
    return (f"M {f(cx)} {f(cy + 0.95 * s)} C {f(cx - 1.7 * s)} {f(cy - 0.15 * s)} {f(cx - 0.85 * s)} {f(cy - 1.35 * s)} {f(cx)} {f(cy - 0.5 * s)} "
            f"C {f(cx + 0.85 * s)} {f(cy - 1.35 * s)} {f(cx + 1.7 * s)} {f(cy - 0.15 * s)} {f(cx)} {f(cy + 0.95 * s)} Z")


def locket(S, y=166):
    """The heart-shaped locket on its chain, hanging in front under the chin."""
    S.raw(strokes(f"M 76 146 Q 86 {y - 4} 100 {y - 6} Q 114 {y - 4} 124 146", "#E8B83A", 2.6, 1))
    S.shape(heart(100, y, 9.5), GOLD, shadow=2, decor=f'<path d="{heart(100, y, 5)}" fill="#E8406A"/>' + hi(95, y - 4, 3, 2, 0.7))


def kiss_hand(S, glove=None):
    """The casting hand (arm-l), held up and open to blow a kiss: the fist, with a little heart resting on it."""
    S.group("arm-l", PL, "the hand she blows kisses from")
    fist(S, 50, 146, -6, hand=glove)
    S.shape(heart(46, 164, 7), "#FF6EA0", shadow=2, side=False, decor=hi(43, 161, 2.4, 1.6, 0.8))


# ================================================================== the Enchantress
def enchantress(v):
    what = {"buns": "blonde hair parted in the middle and tied up in two big round buns at the back of her head, so that her head "
                    "and the buns make a heart from above; a rose ribbon on each bun; puffed sleeves of rose silk",
            "veil": "dark hair under a long rose silk veil that falls back over her shoulders (#back, sways), held by a gold "
                    "circlet with a heart ruby on the brow; a folded fan in her right hand",
            "curls": "a great head of auburn curls with a rose tucked in at one side; a boa of pale pink feathers round "
                     "her shoulders"}[v]
    S = Sprite(f"ENCHANTRESS (round 11, \"{v}\"): the charming hero, her own bust (she wore the Witch's, recoloured): {what}; a "
               "heart-shaped gold locket on a chain under her chin; her left hand held up to blow a kiss, a little heart on "
               "it (arm-l: her casting hand). No hat, no eyes, the heroes' small mouth. " + LAYOUT)
    BLOND, DARKH, AUB = "#F2D27A", "#4A2E3A", "#B8552E"
    if v == "veil":
        S.group("back", (100, 80), "veil")
        S.shape(blob([(48, 96), (34, 70), (38, 40), (58, 18), (84, 8), (100, 14), (116, 8), (142, 18), (162, 40), (166, 70), (152, 96), (100, 104)], 0.8),
                PINK, shadow=0, decor=strokes("M 70 24 Q 64 60 70 96 M 100 16 L 100 98 M 130 24 Q 136 60 130 96", ROSE, 3, 0.45))
        S.group("arm-r", PR, "fan")
        T = frame(152, 140, -10)
        fan = [(0, 0), (-22, 30), (-12, 44), (0, 48), (12, 44), (22, 30)]
        S.shape(blob(fan, 0.45), "#FBF2E6", T=T, shadow=2,
                decor=strokes("M 0 2 L -15 34 M 0 2 L -5 44 M 0 2 L 5 44 M 0 2 L 15 34", ROSE, 2.6, 0.8)
                      + f'<path d="{heart(0, 30, 6)}" fill="#E8406A"/>')
        fist(S, 0, 0, T=T)
    S.group("body")
    silk = strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", light(ROSE, 1.25), 4, 0.8)
    S.shape(SHOULDERS, ROSE, decor=silk + hi(58, 90, 20, 7, 0.25))
    if v == "buns":
        for s in (-1, 1):   # puffed sleeves
            S.shape(ell(100 + s * 58, 104, 22, 24), light(ROSE, 1.12), shadow=3, decor=hi(100 + s * 58 - 6, 94, 9, 5, 0.4)
                    + strokes(f"M {100 + s * 44} 120 Q {100 + s * 58} 130 {100 + s * 74} 118", DROSE, 3, 0.6))
    if v == "curls":
        S.shape(cloud(100, 104, 52, 13, 0.6, 8), "#FBD6E2", shadow=3, T="translate(100 104) scale(1.16 0.78) translate(-100 -104)")
    if v == "buns":
        for s in (-1, 1):   # the two buns: with the head between them, a heart seen from above
            S.shape(circ(100 + s * 30, 52, 31), BLOND, shadow=3,
                    decor=hi(100 + s * 30 - 10, 38, 11, 6, 0.4) + strokes(f"M {100 + s * 12} 40 Q {100 + s * 30} 28 {100 + s * 50} 44 M {100 + s * 10} 56 Q {100 + s * 32} 46 {100 + s * 56} 60", "#D8B052", 3, 0.6))
    head(S)
    mouth(S, 137, "#C0607A")
    if v == "buns":
        S.shape(blob([(50, 112), (46, 80), (60, 56), (84, 46), (100, 52), (116, 46), (140, 56), (154, 80), (150, 112), (140, 96), (124, 86),
                      (100, 92), (76, 86), (60, 96)], 0.8), BLOND, shadow=4,
                decor=strokes("M 100 54 L 100 90", "#D8B052", 3, 0.7) + hi(80, 64, 14, 7, 0.35))
        for s in (-1, 1):
            S.shape(heart(100 + s * 34, 74, 7.5), ROSE, shadow=2, T=f"rotate({s * 20} {100 + s * 34} 74)")
    elif v == "veil":
        S.shape(blob([(50, 110), (47, 82), (60, 58), (100, 48), (140, 58), (153, 82), (150, 110), (138, 96), (120, 90), (100, 94),
                      (80, 90), (62, 96)], 0.85), DARKH, shadow=3)
        S.shape(blob([(46, 104), (42, 74), (58, 46), (100, 34), (142, 46), (158, 74), (154, 104), (140, 86), (120, 76), (100, 74),
                      (80, 76), (60, 86)], 0.85), PINK, shadow=4, decor=hi(78, 52, 20, 9, 0.4))
        S.shape(band([(52, 96), (64, 84), (82, 77), (100, 75), (118, 77), (136, 84), (148, 96)], 3.8), GOLD, shadow=2)
        S.shape(heart(100, 78, 8.5), "#E8406A", shadow=2, decor=hi(96, 75, 3, 2, 0.7))
    else:
        S.shape(cloud(100, 76, 50, 13, 0.6, 4), AUB, shadow=4, T="translate(100 76) scale(1.12 0.9) translate(-100 -76)",
                decor=hi(78, 50, 20, 10, 0.2) + strokes("M 66 60 q 8 -8 14 2 M 96 44 q 8 -8 14 2 M 120 62 q 8 -8 14 2 M 84 78 q 8 -8 14 2", "#7E3418", 3, 0.5))
        S.shape(blob([(54, 104), (58, 92), (72, 98), (86, 90), (100, 100), (114, 90), (128, 98), (142, 92), (146, 104), (128, 108), (100, 104), (72, 108)], 0.7), AUB, shadow=2)
        # a rose at one side
        S.shape(circ(138, 66, 14), "#E8406A", shadow=3,
                decor='<path d="M 130 64 Q 138 54 146 64 Q 142 74 134 72 Q 136 64 142 66" fill="none" stroke="#A8244A" stroke-width="2.6" stroke-linecap="round"/>')
        S.shape(blob([(148, 76), (160, 72), (164, 82), (154, 86)], 0.7), "#5E9A48", shadow=1)
    locket(S)
    kiss_hand(S)
    if v != "veil":
        S.group("arm-r", PR, "free hand")
        fist(S, 150, 146, 6)
    out = save("heroes", f"enchantress-{v}", S)
    return out


# ================================================================== the Succubus
ROSE_SKIN = ('<linearGradient id="gFaceRose" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#A8506E"/><stop offset="0.2" stop-color="#D07A98"/><stop offset="0.45" stop-color="#F0A6BE"/>'
             '<stop offset="0.85" stop-color="#F2AEC4"/><stop offset="1" stop-color="#E294AE"/></linearGradient>'
             '<radialGradient id="gHandRose" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F6B8CC"/>'
             '<stop offset="1" stop-color="#D8809E"/></radialGradient>')
WING_BAT = [(118, 96), (128, 64), (150, 36), (182, 14), (204, 18), (196, 36), (206, 52), (190, 62), (196, 80), (176, 84), (172, 102), (150, 98), (136, 108)]


def bat_wings(S, col, rib, k=1.0, rot=0):
    for s in (-1, 1):
        w = WING_BAT if s > 0 else mirror(WING_BAT)
        ribs = strokes("M 122 92 L 182 18 M 126 94 L 198 48 M 130 98 L 190 76" if s > 0 else "M 78 92 L 18 18 M 74 94 L 2 48 M 70 98 L 10 76", rib, 5, 0.8)
        T = f"rotate({s * rot} 100 96) translate(100 96) scale({k}) translate(-100 -96)"
        S.shape(blob(w, 0.6), col, T=T, shadow=0, decor=ribs)


def heart_tail(S, spine, col, tip="#E8406A", a=0):
    """A long thin tail along `spine`, ending in a heart."""
    S.shape(taper(spine, 9, 6), col, shadow=0)
    x, y = spine[-1]
    S.shape(heart(x, y, 12), tip, T=f"rotate({a} {x} {y})", shadow=0, decor=hi(x - 4, y - 5, 3.6, 2.4, 0.6))


def horns(S, pts, col="#3A2A36"):
    for s in (-1, 1):
        S.shape(blob(pts if s > 0 else mirror(pts), 0.8), col, shadow=3,
                decor=f'<path d="{blob(pts[2:5] if s > 0 else mirror(pts[2:5]), 0.6)}" fill="#FFFFFF" opacity="0.14"/>')


def succubus(v):
    what = {"tail": "long wine-dark hair, two small black horns curving up from the brow, magenta bat wings spread behind and a "
                    "long thin tail curling out behind to one side, a heart at its tip (#back, sway); a black bodice with a rose "
                    "collar; both hands free",
            "whip": "a black bob cut with a straight fringe, two tall horns swept back, small bat wings (#back); a black whip in "
                    "her right hand, its lash curling in across the front to a heart at its end (arm-r)",
            "heart": "long pale pink hair, two small horns, and her two bat wings folded up behind her so that together they "
                     "make one great heart (#back, sway), a thin tail with a heart tip showing under them; a wine-red gown"}[v]
    S = Sprite(f"SUCCUBUS (round 11, \"{v}\"): the Ember Deep's charmer, her own sprite (she wore the Devil's, recoloured rose): "
               f"rose-pink skin, no eyes, the small mouth; {what}. " + LAYOUT)
    S.add_def(ROSE_SKIN)
    hand = "url(#gHandRose)"
    HAIR = {"tail": WINE, "whip": "#2E2430", "heart": "#F7C6D8"}[v]
    S.group("back", (100, 92), "wings" + ("" if v == "whip" else " and tail"))
    if v == "tail":
        bat_wings(S, "#C8508A", "#7A2450", k=0.94)
        heart_tail(S, [(124, 112), (158, 116), (184, 130), (192, 154), (180, 174)], "#B8446E", a=20)
    elif v == "whip":
        bat_wings(S, "#8E2E5E", "#5A1A3A", k=0.78, rot=-8)
    else:
        heart_tail(S, [(100, 120), (70, 150), (40, 152), (22, 168)], "#B8446E", a=40)
        # the two wings folded up into one heart: its lobes behind her head, its point behind her back
        S.shape(heart(100, 62, 64), "#C8508A", shadow=0,
                decor=strokes("M 100 34 L 100 118 M 100 60 L 46 34 M 100 60 L 154 34 M 100 80 L 34 70 M 100 80 L 166 70 M 100 98 L 56 104 M 100 98 L 144 104", "#7A2450", 5, 0.7)
                      + hi(62, 34, 20, 9, 0.2, -20))
    if v == "whip":
        S.group("arm-r", PR, "whip")
        T = frame(166, 140, 0)
        lash = taper([(0, 8), (8, 30), (-2, 46), (-26, 52), (-52, 46), (-66, 30)], 8, 4, 0.8)
        S.shape(lash, "#2E2430", T=T, shadow=0)
        S.shape(heart(-68, 26, 10), "#E8406A", T=f"{T} rotate(150 -68 26)", shadow=0, decor=hi(-71, 22, 3, 2, 0.6))
        S.shape(rr(0, -8, 11, 30, 4), "#5A1A3A", T=T, shadow=2)
        fist(S, 0, -6, T=T, hand=hand)
    S.group("body")
    GOWN = {"tail": "#2E2430", "whip": "#3A2A36", "heart": "#8E2444"}[v]
    S.shape(SHOULDERS, GOWN, decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", ROSE, 4, 0.9) + hi(58, 90, 20, 7, 0.14))
    S.shape(blob([(60, 106), (100, 98), (140, 106), (136, 130), (100, 142), (64, 130)], 0.85), ROSE if v != "heart" else "#F7C6D8", shadow=3)
    if v == "tail":
        horns(S, [(118, 70), (130, 60), (138, 42), (134, 24), (124, 40), (118, 54)])
    elif v == "whip":
        horns(S, [(116, 66), (132, 60), (148, 40), (150, 14), (136, 34), (120, 50)])
    S.shape(HEAD, fill="url(#gFaceRose)", shadow=5, decor='<rect x="100" y="40" width="56" height="120" fill="#7A2450" opacity="0.14"/>')
    mouth(S, 137, "#A03A5E")
    if v == "tail":
        S.shape(blob([(50, 126), (46, 84), (60, 56), (100, 44), (140, 56), (154, 84), (150, 126), (142, 104), (132, 90), (116, 86),
                      (100, 94), (84, 86), (68, 90), (58, 104)], 0.85), HAIR, shadow=4,
                decor=strokes("M 100 48 L 100 90", "#8E3458", 3, 0.6) + hi(80, 60, 16, 8, 0.16))
    elif v == "whip":
        S.shape(blob([(48, 118), (46, 80), (60, 54), (100, 44), (140, 54), (154, 80), (152, 118), (140, 116), (138, 100), (100, 100),
                      (62, 100), (60, 116)], 0.55), HAIR, shadow=4, decor=hi(80, 60, 18, 8, 0.14) + strokes("M 62 99 L 138 99", "#4E4252", 3, 0.6))
    else:
        horns(S, [(118, 64), (128, 58), (134, 44), (130, 32), (124, 44), (118, 52)])
        S.shape(blob([(50, 128), (46, 84), (60, 56), (100, 46), (140, 56), (154, 84), (150, 128), (142, 106), (136, 92), (120, 98),
                      (100, 90), (80, 98), (64, 92), (58, 106)], 0.85), HAIR, shadow=4, decor=strokes("M 100 50 L 100 88", "#E08AAA", 3, 0.6) + hi(80, 62, 16, 8, 0.4))
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 146, -6, hand=hand)
    if v != "whip":
        S.group("arm-r", PR, "free hand")
        fist(S, 150, 146, 6, hand=hand)
    return save("enemies", f"ember-succubus-{v}", S)


BUILD = {}
for _v in ("buns", "veil", "curls"):
    BUILD[f"enchantress-{_v}"] = (lambda v=_v: enchantress(v))
for _v in ("tail", "whip", "heart"):
    BUILD[f"ember-succubus-{_v}"] = (lambda v=_v: succubus(v))

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
