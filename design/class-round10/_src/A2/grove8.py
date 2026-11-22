"""Round 8, part 2: the Wildwood's beasts and growing things, real art for kinds that wore placeholders: the thornback
boar (it wore the beast tamer's boar), the sproutling (a recoloured goblin), the ent (a recoloured troll), the wisp (a
recoloured ghost) and the Elder Ent, the boss (a recoloured troll). The heroes' bust style (A2 library): a head token,
shoulders, the hands or paws in the arm parts, matte, no eyes.
python grove8.py [name ...]   -> ../../enemies/wild-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *
from wild8 import tufts, INKC, CLAW

BONE = "#EFE4C6"
BARK, DBARK, MOSS, LEAF, DLEAF = "#7E5E40", "#5A402C", "#6E8E4A", "#6EA048", "#4A7A34"


def leaf(cx, cy, a, L, w):
    """A leaf in a local frame: base at (cx, cy), pointing along angle a (degrees, 0 = +y), length L, half width w."""
    T = frame(cx, cy, a)
    return blob([(0, 0), (w * 0.9, L * 0.3), (w, L * 0.55), (0, L), (-w, L * 0.55), (-w * 0.9, L * 0.3)], 0.8), T


# ================================================================== thornback boar
def boar():
    S = Sprite("THORNBACK BOAR (round 8): a stout wild boar seen from above in the wolves' capsule build: a dark bristly "
               "capsule of a body with a ridge of big pale thorns down the spine (the thorns its elite sheds), a little "
               "tufted tail, a big head with small pointed ears, a flat pink-grey snout disc with two nostrils and two "
               "big curved white tusks; two front hooves. No eyes. Parts: #back (tail, sways), #body, #arm-l / #arm-r "
               "(front legs and hooves, swing to walk), #front (the tusks, over the legs). " + LAYOUT)
    HIDE, DHIDE, SNOUT = "#5E4A3E", "#3E3028", "#B98A86"
    S.group("back", (100, 46), "tail")
    S.shape(strip([(100, 50), (98, 36), (102, 24), (100, 14)], 6, taper=(0.8, 1.0)), HIDE, shadow=0,
            decor=f'<path d="{ell(100, 16, 9, 8)}" fill="{DHIDE}"/>')
    S.group("body")
    S.shape(rr(100, 92, 104, 116, 50), HIDE, shadow=0,
            decor=f'<path d="{ell(100, 78, 30, 46)}" fill="{DHIDE}" opacity="0.45"/>')
    # thorns down the spine: big curved spikes leaning back, in two staggered rows
    for i, (y, k) in enumerate(((52, 0.8), (70, 1.0), (88, 1.1), (106, 1.05))):
        for s in (-1, 1):
            x = 100 + s * (9 if i % 2 else 14)
            T = f"translate({x} {y}) rotate({s * 18 + 180}) scale({k})"
            S.shape(blob([(-7, 0), (7, 0), (3, 14), (0, 24), (-3, 14)], 0.7), BONE, T=T, shadow=2,
                    decor=f'<path d="M -4 12 L 4 12 L 0 24 Z" fill="#8A7A5A" opacity="0.8"/>')
    # head: skull, ears, snout disc with nostrils, tusks
    for s in (-1, 1):
        S.shape(blob([(100 + s * 22, 128), (100 + s * 40, 110), (100 + s * 42, 124), (100 + s * 32, 138)], 0.6), HIDE, shadow=2,
                decor=f'<path d="{blob([(100 + s * 26, 127), (100 + s * 37, 115), (100 + s * 38, 124), (100 + s * 31, 133)], 0.6)}" fill="{PINK_IN}" opacity="0.7"/>')
    S.shape(ell(100, 140, 34, 30), HIDE, shadow=3)
    S.shape(ell(100, 166, 20, 15), SNOUT, shadow=3,
            decor=f'<path d="{ell(93, 167, 3.5, 5)} {ell(107, 167, 3.5, 5)}" fill="#6E4A48"/>')

    def hoof(cx, cy, a):
        T = frame(cx, cy, a)
        S.shape(rr(0, -6, 20, 26, 9), HIDE, T=T, shadow=2)
        S.shape(blob([(-10, 4), (10, 4), (9, 14), (0, 16), (-9, 14)], 0.8), "#2E2624", T=T, shadow=2,
                decor='<path d="M 0 5 L 0 16" stroke="#4E4440" stroke-width="2.5"/>')
    S.group("arm-l", (70, 120), "front leg")
    hoof(62, 158, 8)
    S.group("arm-r", (130, 120), "front leg")
    hoof(138, 158, -8)
    # the tusks in front of everything (over the swinging legs): big, curving up and out from the sides of the snout
    S.group("front")
    for s in (-1, 1):
        S.shape(blob([(100 + s * 14, 172), (100 + s * 24, 170), (100 + s * 36, 160), (100 + s * 44, 144), (100 + s * 46, 130),
                      (100 + s * 39, 142), (100 + s * 30, 154), (100 + s * 18, 161)], 0.7), BONE, shadow=2)
    return save("enemies", "wild-boar", S)


PINK_IN = "#9C7E8C"


# ================================================================== sproutling
def sproutling():
    S = Sprite("SPROUTLING (round 8): a small walking sapling seen from above: a round green bud of a head with two big "
               "seed leaves fanned back over it and a curled shoot standing up between them, a collar of small leaves "
               "for shoulders; little twig arms ending in leafy tufts (the hands). No eyes, no mouth. Parts: #arm-l / "
               "#arm-r (twig arm and leaf hand), #body. " + LAYOUT)
    S.group("body")
    # a collar of small leaves round the bud (the shoulders)
    for a in range(-150, 151, 30):
        d, T = leaf(100, 104, a, 50, 13)
        S.shape(d, DLEAF if a % 60 else LEAF, T=T, shadow=0 if a in (-150, 150) else 2)
    S.shape(circ(100, 108, 40), "#9CCB62", shadow=4,
            decor=f'<path d="{ell(88, 94, 18, 12)}" fill="#C4E48A" opacity="0.55"/>')
    # two seed leaves fanned back over the head, and the shoot between them
    for s in (-1, 1):
        d, T = leaf(100, 96, 180 + s * 38, 74, 22)
        S.shape(d, LEAF, T=T, shadow=4,
                decor=f'<path d="M 0 6 L 0 62" stroke="{DLEAF}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>')
    S.shape(strip([(100, 96), (102, 76), (110, 64), (118, 66)], 7, taper=(0.9, 1.0)), "#7AAE4A", shadow=3)
    S.shape(circ(119, 64, 7), "#9CCB62", shadow=2)

    def twig_hand(sx):
        S.shape(strip([(100 + sx * 34, 120), (100 + sx * 44, 138), (100 + sx * 48, 152)], 7, taper=(0.9, 1.0)), BARK, shadow=0)
        for a in (-35, 0, 35):
            d, T = leaf(100 + sx * 48, 150, a - sx * 8, 22, 7)
            S.shape(d, LEAF, T=T, shadow=2)
    S.group("arm-l", (66, 116), "twig arm")
    twig_hand(-1)
    S.group("arm-r", (134, 116), "twig arm")
    twig_hand(1)
    return save("enemies", "wild-sproutling", S)


# ================================================================== ent and the Elder Ent
def crown(S, cx, cy, R, n, col, dcol, sy=0.8, k=0.62, rot=0, light=True):
    """A tree's crown seen from above: a ring of leafy lobes, a darker heart, a lighter clump top left."""
    T = f"translate({cx} {cy}) scale(1 {sy}) translate({-cx} {-cy})"
    S.shape(cloud(cx, cy, R, n, k, rot), col, shadow=0, T=T,
            decor=(f'<path d="{ell(cx, cy, R * 0.55, R * 0.55)}" fill="{dcol}" opacity="0.5"/>'
                   + (f'<path d="{ell(cx - R * 0.35, cy - R * 0.35, R * 0.32, R * 0.26)}" fill="#FFFFF4" opacity="0.14"/>'
                      if light else "")))


def band_taper(pts, w0, w1):
    """A limb along a polyline, w0 wide at the start, w1 at the end, round ends."""
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
    return blob(L + R[::-1], 0.8)


def wood_hand(S, cx, cy, a, k=1.0, col=BARK):
    """A gnarled wooden hand: a knotty fist with three short twig fingers reaching forward."""
    T = f"{frame(cx, cy, a)} scale({k})"
    for dx, L in ((-8, 16), (0, 20), (8, 16)):
        S.shape(blob([(dx - 3.5, 4), (dx + 3.5, 4), (dx + 2, L), (dx, L + 4), (dx - 2, L)], 0.7), shade(col, 0.85), T=T, shadow=0)
    S.shape(blob([(-15, -12), (0, -16), (15, -12), (16, 4), (8, 12), (-8, 12), (-16, 4)], 0.85), col, T=T, shadow=3,
            decor=f'<path d="{ell(-5, -4, 4, 3)}" fill="{shade(col, 0.7)}" opacity="0.6"/>')


# round 10 (art-round8 deck: the Ent, "Face variants"; the Elder Ent, "Change face. 3 versions. They should also be very
# big"): ent(face=...) and elder_ent(face=...) swap only what is drawn on the front of the head; with face=None they give
# the round-8 files byte for byte (check10.py). "Very big" is the game's size (js/elderent.js).
HOLE, AMBER = "#2E2420", "#FFC860"


def ent_face(S, face):
    if face == "brow":      # leaf eyebrows, a wide crack of a mouth turned down
        for s in (-1, 1):   # two leaves for eyebrows, drawn down in the middle
            d, T = leaf(100 + s * 5, 110, -s * 108, 42, 11)
            S.shape(d, LEAF, T=T, shadow=4,
                    decor=f'<path d="M 0 5 L 0 36" stroke="{DLEAF}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>')
        S.raw(strokes("M 80 138 Q 100 128 120 138", HOLE, 6.5))
    elif face == "nose":    # a fat snag of a nose with a leaf growing on it, a small crack of a mouth under it
        S.raw(strokes("M 86 146 Q 100 141 114 146", HOLE, 5.5))
        S.shape(blob([(89, 96), (111, 96), (109, 114), (114, 128), (100, 137), (86, 128), (91, 114)], 0.85), "#9A7A56", shadow=4,
                decor=f'<path d="{ell(100, 128, 6, 4.5)}" fill="{DBARK}" opacity="0.55"/>')
        d, T = leaf(108, 104, -118, 24, 8)
        S.shape(d, LEAF, T=T, shadow=2)
    elif face == "hollows":   # two knot-hole eyes and a jagged carved mouth
        for s in (-1, 1):
            S.shape(ell(100 + s * 19, 112, 8.5, 10.5), HOLE, T=f"rotate({s * 14} {100 + s * 19} 112)", shadow=0, side=False)
        S.shape(poly([(78, 132), (88, 137), (94, 131), (100, 138), (106, 131), (112, 137), (122, 132), (114, 146), (100, 150), (86, 146)]),
                HOLE, shadow=0, side=False)
    elif face == "glow":      # the hollows lit from inside
        for s in (-1, 1):
            S.shape(ell(100 + s * 19, 112, 8.5, 10.5), HOLE, T=f"rotate({s * 14} {100 + s * 19} 112)", shadow=0, side=False,
                    decor=f'<ellipse cx="{100 + s * 19}" cy="114" rx="5" ry="6.5" fill="{AMBER}"/>')
        S.shape(blob([(86, 128), (100, 124), (114, 128), (116, 140), (100, 148), (84, 140)], 0.9), HOLE, shadow=0, side=False,
                decor=f'<ellipse cx="100" cy="139" rx="9" ry="6" fill="{AMBER}" opacity="0.9"/>')


def ent(face=None, out=None):
    S = Sprite("ENT (round 8): a walking tree seen from above, built like the heroes: a leafy crown on its back and "
               "shoulders (#back, sways), bark shoulders with moss on them, a bark head with a dark knot-hole mouth and "
               "two branch stubs growing back from the brow; thick branch arms ending in knotty wooden fists with twig "
               "fingers (arm-l, arm-r). No eyes. " + LAYOUT)
    S.group("back", (100, 76), "leafy crown")
    crown(S, 100, 62, 66, 11, "#5E8E3E", DLEAF, sy=0.78)
    S.group("arm-r", (150, 104), "branch arm")
    S.shape(band_taper([(148, 100), (162, 128), (160, 150)], 30, 24), BARK, shadow=0,
            decor=strokes("M 154 104 L 162 140", DBARK, 3, 0.5))
    S.shape(band_taper([(162, 120), (178, 108), (186, 96)], 9, 4), BARK, shadow=2)
    wood_hand(S, 158, 160, -6)
    S.group("arm-l", (50, 104), "branch arm")
    S.shape(band_taper([(52, 100), (38, 128), (40, 150)], 30, 24), BARK, shadow=0,
            decor=strokes("M 46 104 L 38 140", DBARK, 3, 0.5))
    wood_hand(S, 42, 160, 6)
    S.group("body")
    S.shape(blob([(20, 112), (26, 86), (60, 76), (100, 74), (140, 76), (174, 86), (180, 112), (166, 134), (134, 142),
                  (100, 144), (66, 142), (34, 134)], 0.8), BARK,
            decor=strokes("M 40 96 L 44 128 M 60 84 L 62 132 M 140 84 L 138 132 M 160 96 L 156 128", DBARK, 3.5, 0.45)
                  + f'<path d="{ell(46, 94, 18, 10)} {ell(150, 90, 16, 9)}" fill="{MOSS}"/>')
    for s in (-1, 1):  # branch stubs growing back from the brow
        S.shape(band_taper([(100 + s * 22, 70), (100 + s * 30, 48), (100 + s * 42, 32)], 12, 5), BARK, shadow=3)
    S.shape(blob([(100, 50), (128, 56), (144, 78), (146, 106), (138, 132), (120, 150), (100, 156), (80, 150), (62, 132),
                  (54, 106), (56, 78), (72, 56)], 0.9), "#8A6A4A", shadow=5,
            decor=strokes("M 84 62 L 88 96 M 116 62 L 112 96 M 100 58 L 100 84", DBARK, 3, 0.45)
                  + f'<path d="{ell(100, 104, 40, 9)}" fill="{DBARK}" opacity="0.35"/>')
    if face:
        S.comment = S.comment.replace("a bark head with a dark knot-hole mouth", "a bark head, round 10 face \"" + face + "\"")
        ent_face(S, face)
    else:
        S.shape(blob([(88, 124), (100, 120), (112, 124), (114, 136), (100, 144), (86, 136)], 0.9), "#2E2420", shadow=0, side=False)
    S.shape(ell(118, 70, 10, 6), MOSS, shadow=2)
    return save("enemies", out or "wild-ent", S)


def elder_face(S, face, beard):
    BEARD = "#5E7E44"
    def the_beard():
        S.shape(beard, BEARD, shadow=4, decor=strokes("M 86 140 L 90 168 M 100 142 L 100 178 M 114 140 L 110 166", "#4A6A36", 3, 0.6))
    if face == "brows":     # heavy moss eyebrows drawn down in a scowl, a wide mouth with peg teeth, the beard
        the_beard()
        S.shape(blob([(78, 110), (100, 106), (122, 110), (126, 126), (100, 132), (74, 126)], 0.9), "#241C1A", shadow=0, side=False,
                decor="".join(f'<path d="{rr(x, 112.5, 8.5, 11, 2.5)}" fill="#D8C8A4"/>' for x in (86, 100, 114)))
        for s in (-1, 1):
            S.shape(blob([(100 + s * 6, 98), (100 + s * 20, 86), (100 + s * 38, 78), (100 + s * 50, 82), (100 + s * 44, 94),
                          (100 + s * 28, 98), (100 + s * 14, 106)], 0.75), MOSS, shadow=3)
    elif face == "nose":    # a great snag of a nose, a moss moustache drooping either side of it into the beard
        the_beard()
        for s in (-1, 1):
            S.shape(blob([(100 + s * 2, 120), (100 + s * 20, 116), (100 + s * 40, 122), (100 + s * 50, 138), (100 + s * 46, 152),
                          (100 + s * 34, 140), (100 + s * 18, 134), (100 + s * 4, 136)], 0.8), "#6E8E4A", shadow=3)
        S.shape(blob([(86, 86), (114, 86), (112, 108), (118, 126), (100, 138), (82, 126), (88, 108)], 0.85), "#9A8A76", shadow=4,
                decor=f'<path d="{ell(100, 127, 7.5, 5.5)}" fill="#4E4238" opacity="0.55"/>')
    elif face == "glow":    # hollow knot-hole eyes and the deep mouth, lit from inside like a lantern
        the_beard()
        S.shape(blob([(86, 112), (100, 108), (114, 112), (118, 126), (100, 134), (82, 126)], 0.9), "#241C1A", shadow=0, side=False,
                decor=f'<ellipse cx="100" cy="125" rx="11" ry="6.5" fill="{AMBER}" opacity="0.9"/>')
        for s in (-1, 1):
            S.shape(ell(100 + s * 22, 92, 9.5, 11.5), "#241C1A", T=f"rotate({s * 16} {100 + s * 22} 92)", shadow=0, side=False,
                    decor=f'<ellipse cx="{100 + s * 22}" cy="94.5" rx="5.5" ry="7" fill="{AMBER}"/>')


def elder_ent(face=None, out=None):
    S = Sprite("THE ELDER ENT (round 8): the oldest tree in the wood, the boss, about twice a hero across and built in "
               "parts: a great crown of dark leaves spread over its back (#back, sways slowly), a massive gnarled trunk "
               "of grey-brown bark with moss on the shoulders and pale shelf fungus, a broad bark face with a deep "
               "knot-hole mouth and a long mossy beard hanging over its chest, two great antler-like branches from its "
               "brow; two huge branch arms with root claws (arm-l, arm-r). No eyes. " + LAYOUT)
    OLD, DOLD = "#7A6A5A", "#4E4238"
    S.group("back", (100, 80), "great crown")
    crown(S, 100, 58, 82, 13, "#3E6E3A", "#2A4E2A", sy=0.74, k=0.6)
    for x, y, r in ((52, 40, 20), (148, 40, 20), (100, 16, 22)):
        S.shape(cloud(x, y, r, 7, 0.6, 10), "#4E7E40", shadow=2)
    S.group("arm-r", (148, 102), "branch arm")
    S.shape(band_taper([(146, 98), (170, 126), (172, 158)], 36, 28), OLD, shadow=0,
            decor=strokes("M 156 104 L 170 150", DOLD, 3.5, 0.5))
    S.shape(band_taper([(170, 122), (190, 110), (200, 96)], 10, 4), OLD, shadow=2)
    wood_hand(S, 170, 170, -8, 1.25, OLD)
    S.group("arm-l", (52, 102), "branch arm")
    S.shape(band_taper([(54, 98), (30, 126), (28, 158)], 36, 28), OLD, shadow=0,
            decor=strokes("M 44 104 L 30 150", DOLD, 3.5, 0.5))
    S.shape(band_taper([(30, 122), (10, 110), (0, 96)], 10, 4), OLD, shadow=2)
    wood_hand(S, 30, 170, 8, 1.25, OLD)
    S.group("body")
    S.shape(blob([(12, 112), (20, 82), (60, 70), (100, 68), (140, 70), (180, 82), (188, 112), (172, 138), (136, 148),
                  (100, 150), (64, 148), (28, 138)], 0.8), OLD,
            decor=strokes("M 34 92 L 38 132 M 56 80 L 58 140 M 144 80 L 142 140 M 166 92 L 162 132", DOLD, 4, 0.45)
                  + f'<path d="{ell(40, 92, 22, 12)} {ell(160, 88, 20, 11)}" fill="{MOSS}"/>')
    for x, y in ((30, 116), (172, 112)):  # pale shelf fungus on the shoulders
        S.shape(ell(x, y, 11, 7), "#E8DCC0", shadow=2, decor=f'<path d="{ell(x, y + 3, 11, 3)}" fill="#B8A888" opacity="0.6"/>')
    for s in (-1, 1):  # antler-like branches from the brow
        S.shape(band_taper([(100 + s * 24, 66), (100 + s * 34, 40), (100 + s * 52, 22), (100 + s * 64, 18)], 14, 5), OLD, shadow=3)
        S.shape(band_taper([(100 + s * 36, 38), (100 + s * 30, 20), (100 + s * 32, 8)], 7, 3), OLD, shadow=2)
    S.shape(blob([(100, 46), (130, 52), (148, 76), (150, 106), (142, 132), (122, 150), (100, 156), (78, 150), (58, 132),
                  (50, 106), (52, 76), (70, 52)], 0.9), "#8A7A68", shadow=5,
            decor=strokes("M 82 58 L 86 96 M 118 58 L 114 96 M 100 54 L 100 82", DOLD, 3.5, 0.45)
                  + f'<path d="{ell(100, 102, 42, 10)}" fill="{DOLD}" opacity="0.4"/>')
    # the long mossy beard over the chest, the mouth above it
    # a ragged mossy beard: tufts hanging in uneven points (round 8: one smooth point read as a leaf)
    beard = blob([(68, 128), (86, 134), (100, 136), (114, 134), (132, 128), (136, 146), (130, 164), (124, 160), (120, 178),
                  (112, 172), (106, 192), (100, 182), (94, 194), (88, 172), (80, 178), (76, 160), (70, 164), (64, 146)], 0.6)
    if face:
        S.comment = S.comment.replace("a broad bark face with a deep knot-hole mouth and a long mossy beard hanging over its chest",
                                      "a broad bark face (round 10 face \"" + face + "\") and a long mossy beard hanging over its chest")
        elder_face(S, face, beard)
    else:
        S.shape(beard, "#5E7E44", shadow=4, decor=strokes("M 86 140 L 90 168 M 100 142 L 100 178 M 114 140 L 110 166", "#4A6A36", 3, 0.6))
        S.shape(blob([(86, 112), (100, 108), (114, 112), (118, 126), (100, 134), (82, 126)], 0.9), "#241C1A", shadow=0, side=False)
    S.shape(ell(122, 66, 12, 7), MOSS, shadow=2)
    return save("enemies", out or "wild-elder-ent", S)


# ================================================================== wisp
WISP_DEFS = ('<radialGradient id="gWisp" cx="0.42" cy="0.4" r="0.65"><stop offset="0" stop-color="#FCFFE6"/>'
             '<stop offset="0.45" stop-color="#E6FFAA"/><stop offset="1" stop-color="#9ED25A"/></radialGradient>'
             '<linearGradient id="gWispTail" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#CFF08A"/>'
             '<stop offset="1" stop-color="#7EBE48"/></linearGradient>')


def wisp():
    S = Sprite("WISP (round 8): a floating light seen from above: a round glowing orb, pale lime at the heart and greener "
               "at the edge, a flickering flame-tail streaming back behind it (#back, sways) and two little wisps of "
               "flame for hands (arm-l, arm-r) that lift when it mends a beast. No face. " + LAYOUT)
    S.add_def(WISP_DEFS)
    S.group("back", (100, 96), "flame tail")
    tail = blob([(72, 96), (66, 70), (78, 50), (74, 30), (88, 38), (94, 14), (104, 32), (114, 6), (120, 34), (132, 26),
                 (128, 52), (136, 72), (128, 96)], 0.75)
    S.shape(tail, fill="url(#gWispTail)", shadow=0, side=False)
    for gid, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + s * 30, 108), "a wisp of flame")
        S.shape(blob([(100 + s * 34, 104), (100 + s * 52, 112), (100 + s * 58, 128), (100 + s * 52, 140), (100 + s * 44, 128),
                      (100 + s * 34, 124)], 0.8), fill="url(#gWispTail)", shadow=0, side=False)
    S.group("body")
    S.shape(circ(100, 110, 42), fill="url(#gWisp)", shadow=0, side=False,
            decor=f'<path d="{circ(100, 110, 26)}" fill="#FFFFF4" opacity="0.35"/>')
    return save("enemies", "wild-wisp", S)


BUILD = {"wild-boar": boar, "wild-sproutling": sproutling, "wild-ent": ent, "wild-elder-ent": elder_ent, "wild-wisp": wisp}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
