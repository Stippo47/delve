"""Round 9: real art for the Gilded Spire's stand-ins (docs/ART-NEEDED.md), A2 style, the heroes' bust build for the host
(a head token with the heroes' face, no eyes, shoulders, fists in the arm parts, the spear under the shoulder) with
feathered wings in #back: the fallen angel, the Twin Heralds (light and fallen: the same shape), the choir sprite, the
sun blade, the golem and the gilded golem, the light and ward spirits.
python spire9.py [name ...]   -> ../../enemies/spire-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *

ASH_FACE = ('<linearGradient id="gFaceAsh" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
            '<stop offset="0" stop-color="#7E7486"/><stop offset="0.2" stop-color="#A49AAA"/><stop offset="0.45" stop-color="#CEC6D2"/>'
            '<stop offset="0.85" stop-color="#D2CAD6"/><stop offset="1" stop-color="#BCB2C2"/></linearGradient>'
            '<radialGradient id="gHandAsh" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#DCD4E0"/>'
            '<stop offset="1" stop-color="#A69CAE"/></radialGradient>')
LIGHT = dict(wing="#FAF6EC", dwing="#E2D6B8", robe="#F4EFE4", trim=GOLD, hair="#F2C454", shaft="#C99A3A", blade="#FFF2C4",
             face="url(#gFace)", hand="url(#gHand)", plate="#F2C84A")
FALLEN = dict(wing="#4E4658", dwing="#2E2836", robe="#4A4256", trim="#8E6AB8", hair="#2A2430", shaft="#3A3442", blade="#B89AE0",
              face="url(#gFaceAsh)", hand="url(#gHandAsh)", plate="#5E5470")


def feather9(root, a, L, w, tip=0.55):
    """One long feather lying flat: base at root, pointing along angle a (degrees, 0 = +y), length L, half width w."""
    T = frame(root[0], root[1], a)
    return blob([(0, -w * 0.4), (w * 0.9, L * 0.25), (w, L * tip), (w * 0.45, L * 0.88), (0, L), (-w * 0.5, L * 0.86),
                 (-w * 0.95, L * tip), (-w * 0.85, L * 0.22)], 0.8), T


def wing9(S, s, p, ragged=False, k=1.0, root=(122, 94)):
    """A wing spread out and swept back from the shoulder blade (side s = +1 right, -1 left): five long feathers fanned
    from the root, the outer ones longest; ragged: torn, uneven, gaps between them, sharper ends."""
    rx = 100 + s * (root[0] - 100)
    fan = ((-98, 64, 14), (-112, 80, 14), (-126, 92, 13), (-140, 100, 12), (-154, 96, 11))
    if ragged:
        fan = ((-96, 56, 11), (-110, 84, 10), (-125, 70, 11), (-139, 102, 9.5), (-155, 80, 10))
    for i, (a, L, w) in enumerate(fan):
        d, T = feather9((rx, root[1]), s * a, L * k, w * k, 0.5 if ragged else 0.55)
        S.shape(d, p["wing"] if i % 2 == 0 else light(p["wing"], 0.96), T=T, shadow=2 if i else 0, sop=0.18,
                decor=f'<path d="M 0 {f(L * k * 0.15)} L 0 {f(L * k * 0.9)}" stroke="{p["dwing"]}" stroke-width="3" '
                      f'stroke-linecap="round" opacity="0.7"/>' + ("" if not ragged else
                      f'<path d="M {f(w * k)} {f(L * k * 0.62)} L {f(w * k * 0.1)} {f(L * k * 0.7)} L {f(w * k)} {f(L * k * 0.78)} Z" '
                      f'fill="{p["dwing"]}"/>'))
    # the covert feathers over the root: a rounded shoulder of the wing
    S.shape(blob([(rx - s * 8, root[1] + 8), (rx + s * 18, root[1] - 2), (rx + s * 40, root[1] - 18), (rx + s * 46, root[1] - 34),
                  (rx + s * 26, root[1] - 30), (rx, root[1] - 18)], 0.85), p["wing"], shadow=2, sop=0.18)


def spear9(S, T, p, back=-52, L=50, blade=1.0):
    """The host's spear (local frame: +y forward along the shaft): a long shaft, a gold socket, a long leaf blade."""
    S.shape(rr(0, (back + L) / 2, 9, L - back, 4.5), p["shaft"], T=T, shadow=0)
    S.shape(rr(0, L - 6, 15, 10, 3.5), p["trim"], T=T, shadow=1)
    b = [(-11, L - 2), (11, L - 2), (12, L + 18), (0, L + 46 * blade), (-12, L + 18)]
    S.shape(blob(b, 0.7), p["blade"], T=T, shadow=2,
            decor=f'<path d="{poly([(0, L - 2), (11, L - 2), (12, L + 18), (0, L + 46 * blade)])}" fill="{shade(p["blade"], 0.7)}" opacity="0.45"/>')
    fist(S, 0, 0, T=T, hand=p["hand"])


def angel_body(S, p, hair="curls", plate=False):
    """Shoulders (a robe, or plate), the head with the heroes' face, the hair or helm. No eyes."""
    if plate:
        S.shape(SHOULDERS, p["robe"], decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", p["trim"], 4, 0.9))
        for s in (-1, 1):
            S.shape(blob([(100 + s * 34, 82), (100 + s * 62, 78), (100 + s * 80, 92), (100 + s * 80, 114), (100 + s * 62, 122),
                          (100 + s * 40, 110)], 0.85), p["plate"], shadow=4,
                    decor=f'<path d="{ell(100 + s * 60, 90, 13, 6)}" fill="#FFFFFF" opacity="0.35"/>')
    else:
        S.shape(SHOULDERS, p["robe"], decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", p["trim"], 4, 0.9)
                + strokes("M 70 82 Q 100 96 130 82", p["trim"], 3.5, 0.8))
    head(S, face=p["face"])
    mouth(S, 137, "#9A6E68" if p is not FALLEN else "#6E6070")
    if hair == "curls":
        S.shape(cloud(100, 82, 46, 11, 0.7, 8), p["hair"], shadow=4,
                T="translate(100 82) scale(1.04 0.86) translate(-100 -82)",
                decor=f'<path d="{ell(86, 66, 16, 10)}" fill="#FFF6D0" opacity="0.4"/>')
    elif hair == "long":
        S.shape(blob([(52, 118), (48, 84), (62, 56), (100, 44), (138, 56), (152, 84), (148, 118), (140, 100), (132, 86),
                      (116, 80), (100, 84), (84, 80), (68, 86), (60, 100)], 0.85), p["hair"], shadow=4,
                decor=strokes("M 100 50 L 100 82", light(p["hair"], 1.5), 3, 0.5))


# ================================================================== the fallen angel
def fallen_angel():
    S = Sprite("FALLEN ANGEL (round 9): one of the host, fallen: the heroes' bust build, ashen skin, no eyes, long black "
               "hair, a dark violet robe with a dull violet trim; two dark wings, ragged: torn feathers of uneven length "
               "with gaps between them (#back, sway); a dark spear with a pale violet blade under the right shoulder "
               "(arm-r, it thrusts), the left hand free (arm-l). " + LAYOUT)
    S.add_def(ASH_FACE)
    S.group("back", (100, 92), "ragged wings")
    for s in (-1, 1):
        wing9(S, s, FALLEN, ragged=True)
    S.group("arm-r", PR, "spear")
    spear9(S, frame(156, 110, 5), FALLEN, L=44)
    S.group("body")
    angel_body(S, FALLEN, hair="long")
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 146, -6, hand=FALLEN["hand"])
    return save("enemies", "spire-fallen-angel", S)


# ================================================================== the Twin Heralds
def herald(fallen):
    p = FALLEN if fallen else LIGHT
    name = "FALLEN HERALD" if fallen else "HERALD OF LIGHT"
    look = ("its fallen twin, the same shape: ashen skin, black plate with a violet trim, a black winged helm, two "
            "dark ragged wings, a dark spear with a violet blade" if fallen else
            "white and gold: gold plate on the shoulders over a white robe, a gold winged helm with a white plume, two "
            "great white wings, a long gold spear")
    S = Sprite(f"{name} (round 9): one of the Twin Heralds, the Choir Halls' mini-boss pair, a tall angel herald in the "
               f"heroes' bust build, no eyes: {look}. Wings in #back (sway); the spear under the right shoulder (arm-r, "
               f"it thrusts), the left hand free (arm-l). " + LAYOUT)
    if fallen:
        S.add_def(ASH_FACE)
    S.group("back", (100, 92), "wings")
    for s in (-1, 1):
        wing9(S, s, p, ragged=fallen)
    S.group("arm-r", PR, "spear")
    spear9(S, frame(156, 108, 5), p, back=-60, L=46, blade=1.05)
    S.group("body")
    angel_body(S, p, hair=None, plate=True)
    # the winged helm: a cap over the head, a little wing at each temple, a plume down the back
    helm = "#2E2A36" if fallen else GOLD
    plume = "#5E4E7A" if fallen else "#FFFFFF"
    pf, ph = feather([(100, 60), (100, 40), (100, 22), (100, 6)], 15)
    S.shape(pf, plume, shadow=0, decor=f'<path d="{ph}" fill="{shade(plume, 0.85)}" opacity="0.6"/>')
    for s in (-1, 1):
        d, T = feather9((100 + s * 40, 84), s * -120, 36, 9)
        S.shape(d, p["wing"], T=T, shadow=2)
    S.shape("M 53 104 C 50 70 70 46 100 46 C 130 46 150 70 147 104 C 136 96 120 92 100 92 C 80 92 64 96 53 104 Z", helm, shadow=4,
            decor=strokes("M 100 48 L 100 92", light(helm, 1.25), 4, 0.6) + f'<path d="{ell(84, 64, 12, 7)}" fill="#FFFFFF" opacity="0.3"/>')
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 146, -6, hand=p["hand"])
    return save("enemies", "spire-herald-fallen" if fallen else "spire-herald-light", S)


# ================================================================== the choir sprite
# round 10 (art-round9 deck: the Choir sprite, "Weird hair"; the Choir singer, "Flip book. Hair weird"): hair10 swaps the
# lumpy cap with spiral squiggles for the round-4 cherub's hair: a cap of soft curls, each
# bump one arc, with a parted fringe over the brow. Nothing else.
def cherub_hair():
    pts = [(100 + math.cos(math.radians(160 + i * 24.4)) * 48, 90 + math.sin(math.radians(160 + i * 24.4)) * 42) for i in range(10)]
    d = f"M {f(pts[0][0])} {f(pts[0][1])}"
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        r = math.hypot(x1 - x0, y1 - y0) * 0.56
        d += f" A {f(r)} {f(r)} 0 0 1 {f(x1)} {f(y1)}"
    return d + " C 128 102 114 92 100 100 C 86 92 72 102 55 106 Z"


def choir_sprite(hair10=False):
    S = Sprite("CHOIR SPRITE (round 9): a tiny singing cherub of the host, seen from above: a round head with golden curls, "
               "no eyes, its mouth open in an 'o' as it sings; a white robe collar with a gold edge; two small white wings "
               "(#back, sway); two little hands held up in front as it sings (arm-l, arm-r, they lift when it sings). "
               + LAYOUT)
    S.group("back", (100, 96), "small wings")
    for s in (-1, 1):
        for a, L, w in ((-96, 58, 14), (-116, 68, 14), (-138, 62, 13)):
            d, T = feather9((100 + s * 30, 100), s * a, L, w)
            S.shape(d, "#FAF6EC", T=T, shadow=2, sop=0.18, decor=f'<path d="M 0 8 L 0 {L * 0.85}" stroke="#E2D6B8" stroke-width="3" opacity="0.7"/>')
    S.group("body")
    S.shape(ell(100, 116, 50, 30), "#F4EFE4", decor=strokes("M 54 124 Q 100 150 146 124", GOLD, 4, 0.9))
    head(S)
    if hair10:
        S.comment = S.comment.replace("(round 9)", "(round 9; round 10: the hair)")
        S.shape(cherub_hair(), "#F2C454", shadow=4, decor=f'<path d="{ell(84, 64, 16, 9)}" fill="#FFF6D0" opacity="0.4"/>')
    else:
        curls = "".join(f'<path d="M {x - 6} {y} a 6 6 0 1 1 6 6" fill="none" stroke="#D8A030" stroke-width="3" stroke-linecap="round" opacity="0.8"/>'
                        for x, y in ((82, 66), (104, 58), (120, 74), (92, 84), (70, 84)))
        S.shape(cloud(100, 80, 44, 13, 0.82, 4), "#F2C454", shadow=4, T="translate(100 80) scale(1.04 0.84) translate(-100 -80)",
                decor=f'<path d="{ell(86, 64, 14, 8)}" fill="#FFF6D0" opacity="0.4"/>' + curls)
    S.shape(ell(100, 138, 6, 7), "#7A3A3A", shadow=0, side=False, decor=f'<path d="{ell(100, 142, 4, 3)}" fill="#C86A6A"/>')
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 34, 116), "a little hand")
        fist(S, 100 + s * 34, 150, s * -16, w=18, h=20)
    return save("enemies", "spire-choir-sprite", S)


# ================================================================== the sun blade
SUN_DEFS = ('<linearGradient id="gSunBlade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF8D8"/>'
            '<stop offset="0.5" stop-color="#F6CF5A"/><stop offset="1" stop-color="#D89A2A"/></linearGradient>')


def sun_blade():
    S = Sprite("SUN BLADE (round 9): a floating golden sword of the host seen from above, centred so it spins about its "
               "middle: a broad gold blade, point forward, its edges glowing pale, a crossguard with a sun disc and short "
               "rays at its heart, a gold grip and a round pommel behind. No hands. Parts: #body only (it spins whole). "
               + LAYOUT)
    S.add_def(SUN_DEFS)
    S.group("body")
    blade = [(-20, -4), (20, -4), (18, 62), (0, 98), (-18, 62)]
    T = "translate(100 100)"
    S.shape(blob(blade, 0.35), fill="url(#gSunBlade)", T=T, shadow=0, side=False,
            decor=f'<path d="M -20 -4 L -18 62 L 0 98 L 0 -4 Z" fill="#FFFDF0" opacity="0.45"/>'
                  + strokes("M -14 4 L -13 60 L 0 88 L 13 60 L 14 4", "#FFFFFF", 3.5, 0.7))
    S.shape(rr(0, -36, 11, 44, 5), "#C9902E", T=T, shadow=2, decor=strokes("M -5 -50 L 5 -44 M -5 -38 L 5 -32 M -5 -26 L 5 -20", "#8E5E1E", 2.5, 0.7))
    S.shape(circ(0, -62, 10), GOLD, T=T, shadow=2, decor='<circle cx="-3" cy="-65" r="3.5" fill="#FFF6D0"/>')
    S.shape(rr(0, -6, 64, 12, 5), GOLD, T=T, shadow=2)
    S.shape(poly(star(0, -6, 36, 22, 8, 22.5)), "#F6CF5A", T=T, shadow=2)          # the sun's rays round the guard
    S.shape(circ(0, -6, 21), "#FFD25A", T=T, shadow=2, decor=f'<path d="{circ(-5, -11, 8)}" fill="#FFF8D8" opacity="0.8"/>')
    return save("enemies", "spire-sun-blade", S)


# ================================================================== the golem and the gilded golem
STONE, DSTONE = "#A8A096", "#6E6860"


def stone(cx, cy, w, h, k=(1.0, 0.94, 1.02, 0.96, 1.0, 0.95, 1.03, 0.97)):
    """A rounded, slightly uneven stone: eight points round an ellipse, each pushed in or out a little."""
    pts = []
    for i, kk in enumerate(k):
        a = math.radians(i * 45 + 22.5)
        pts.append((cx + math.cos(a) * w / 2 * kk * 1.08, cy + math.sin(a) * h / 2 * kk * 1.08))
    return blob(pts, 0.95)


def golem9(gilded):
    look = ("its stone plated in gold: polished gold plates on the shoulder stones and the fists, and a polished gold "
            "front plate over its chest (it turns shots back)" if gilded else
            "weathered grey stone, a few chips and cracks, a little moss on one shoulder")
    S = Sprite(f"{'GILDED GOLEM' if gilded else 'GOLEM'} (round 9): a stone golem seen from above in the heroes' bust "
               f"build: two great boulders for shoulders, a body stone behind a squarish head stone with a rune glowing on "
               f"its brow (no eyes), two great stone fists (arm-l, arm-r, they swing); {look}. " + LAYOUT)
    GP = "#F2C24A"
    S.group("body")
    S.shape(stone(100, 102, 92, 76), shade(STONE, 0.92), shadow=0)
    for s in (-1, 1):   # the shoulder boulders
        S.shape(stone(100 + s * 54, 100, 66, 62, (1.0, 0.96, 1.03, 0.95, 1.0, 0.97, 1.02, 0.95)[::s]), STONE, shadow=3,
                decor=strokes(f"M {100 + s * 62} 112 L {100 + s * 74} 124", DSTONE, 3, 0.55)
                      + f'<path d="{ell(100 + s * 60, 84, 14, 7)}" fill="#FFFFF4" opacity="0.2"/>'
                      + (f'<path d="{ell(100 + s * 70, 92, 11, 6)}" fill="#7E9A5A" opacity="0.85"/>' if not gilded and s < 0 else ""))
        if gilded:
            S.shape(stone(100 + s * 56, 94, 50, 40), GP, shadow=3, decor=f'<path d="{ell(100 + s * 50, 86, 12, 6)}" fill="#FFF6D0" opacity="0.7"/>')
    if gilded:   # the polished front plate over the chest, under the head
        S.shape(blob([(66, 116), (100, 110), (134, 116), (132, 136), (100, 146), (68, 136)], 0.8), GP, shadow=2,
                decor=f'<path d="{ell(86, 124, 13, 5)}" fill="#FFFFFF" opacity="0.75"/>')
    S.shape(stone(100, 100, 62, 58, (1.0, 0.98, 1.0, 0.97, 1.0, 0.98, 1.0, 0.97)), STONE, shadow=4,
            decor=f'<path d="{ell(88, 82, 16, 9)}" fill="#FFFFF4" opacity="0.22"/>'
                  + f'<path d="M 100 104 L 108 114 L 100 124 L 92 114 Z" fill="none" stroke="{"#FFFFFF" if gilded else "#FFC84A"}" '
                    f'stroke-width="3.5" stroke-linejoin="round"/>')
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 60, 112), "stone fist")
        S.shape(stone(100 + s * 64, 152, 48, 46), STONE, shadow=3,
                decor=strokes(f"M {100 + s * 52} 158 L {100 + s * 76} 158 M {100 + s * 54} 168 L {100 + s * 74} 168", DSTONE, 3, 0.5))
        if gilded:
            S.shape(stone(100 + s * 64, 146, 38, 22), GP, shadow=2)
    return save("enemies", "spire-gilded-golem" if gilded else "spire-golem", S)


def light_spirit():
    return save("enemies", "spire-light-spirit", spirit9("heal", "Light Spirit", "light: a pale gold core with a little sun in it, a gold tail."))


def ward_spirit():
    return save("enemies", "spire-ward-spirit", spirit9("ward", "Ward Spirit", "warding: a violet core with a pale shield in it, a violet tail."))


BUILD = {"spire-fallen-angel": fallen_angel, "spire-herald-light": lambda: herald(False), "spire-herald-fallen": lambda: herald(True),
         "spire-choir-sprite": choir_sprite, "spire-sun-blade": sun_blade, "spire-golem": lambda: golem9(False),
         "spire-gilded-golem": lambda: golem9(True), "spire-light-spirit": light_spirit, "spire-ward-spirit": ward_spirit}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
