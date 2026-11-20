"""A2 round 5, fighters: fixes and redos. Run: python fighters.py [name ...]  -> ../../fighters/<file>.svg
The engineers, beast tamers and beasts are in crew.py."""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *

BRONZE = "#C98A3A"
GLADIATOR_R6 = True
WWH_R6 = True
WOLF_R6 = True
EXE_R6 = True


def save_f(name, S):
    return save("fighters", name, S)


def grad_face(S, gid, stops):
    st = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in zip((0, 0.2, 0.45, 0.85, 1), stops))
    S.add_def(f'<linearGradient id="{gid}" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">{st}</linearGradient>')
    return f"url(#{gid})"


def hand_grad(S, gid, c0, c1):
    S.add_def(f'<radialGradient id="{gid}" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="{c0}"/>'
              f'<stop offset="1" stop-color="{c1}"/></radialGradient>')
    return f"url(#{gid})"


# ================================================================== Jester
def jester():
    S = Sprite("FIGHTER Jester (round 5): the cap's back point is shorter and its bell sits fully inside the sprite "
               "box, so it is no longer cut off. Three-pointed cap split magenta and yellow with gold bells, pointed "
               "ruff, harlequin shoulders. A marotte in the right hand (arm-r, before #body); left hand free. " + LAYOUT)
    MAG, YEL = "#B8337E", "#F2C230"
    S.group("arm-r", PR, "marotte")
    T = frame(150, 136, 18)
    S.shape(rr(0, 18, 8, 60, 4), "#6E4A2C", T=T, shadow=0)
    S.shape(blob([(-12, 46), (-24, 34), (0, 40), (24, 34), (12, 46)], 0.6), MAG, T=T, shadow=2)
    S.shape(circ(0, 56, 11), "#F2C7A0", T=T, shadow=2)
    S.shape("M -11 52 C -10 40 10 40 11 52 C 4 48 -4 48 -11 52 Z", YEL, T=T, shadow=2)
    fist(S, 0, 0, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, MAG,
            decor="".join(f'<path d="{poly([(x, 108), (x + 14, 90), (x + 28, 108), (x + 14, 126)])}" fill="{YEL}"/>'
                          for x in (18, 46, 126, 154)))
    ruff = star(100, 118, 64, 48, 12, 15)
    S.shape(poly(ruff), "#F4EEE2", shadow=3,
            decor="".join(f'<path d="{poly([(100, 118), ruff[i], ruff[(i + 1) % 24], ruff[(i + 2) % 24]])}" fill="{MAG if (i // 2) % 2 else YEL}"/>'
                          for i in range(0, 24, 2)))
    S.head(ears=False)
    capL = blob([(100, 38), (100, 98), (76, 96), (56, 104), (46, 90), (34, 80), (20, 84), (10, 76), (16, 58), (32, 48), (50, 46),
                 (64, 32), (78, 18), (92, 10), (99, 16)], 0.75)
    capR = blob([(100, 38), (100, 98), (124, 96), (144, 104), (154, 90), (166, 80), (180, 84), (190, 76), (184, 58), (168, 48),
                 (150, 46), (136, 32), (122, 18), (108, 10), (101, 16)], 0.75)
    S.shape(capL, MAG, shadow=4)
    S.shape(capR, YEL, shadow=0)
    S.shape("M 52 104 C 66 88 134 88 148 104 L 146 112 C 130 98 70 98 54 112 Z", "#F4EEE2", shadow=2)
    for x, y in [(12, 84), (188, 84), (100, 9)]:
        S.shape(circ(x, y, 8), GOLD, shadow=3, decor=f'<circle cx="{x - 2}" cy="{y - 2}" r="3" fill="#FFF1B8"/>')
    S.mouth()
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 152, -6)
    return save_f("fighter-jester", S)


# ================================================================== Scarecrow
def scarecrow():
    S = Sprite("FIGHTER Scarecrow (round 5): a bigger stitched mouth; thicker weave and stitch lines; the sack's top "
               "gathered and tied with twine, a frill of burlap and straw above the knot; a faded patched blue coat, "
               "a straw ruff, the cross-pole behind the shoulders (#back). The hands are straw bunches out of blue "
               "cuffs held forward and in, clear of the pole ends (arm-l, arm-r). The crow is its own part (#crow, "
               "after the arms) so it can fly off. " + LAYOUT)
    BUR, DBUR, STRAW, COAT = "#CDAE7E", "#8E7048", "#E8C25A", "#5F82A6"
    S.group("back", None, "cross-pole")
    S.shape(rr(100, 100, 214, 14, 5), "#8A5E38", shadow=0, decor=strokes("M -10 96 L 210 96", "#B07A46", 3, 0.6))
    S.group("body")
    S.shape(SHOULDERS, COAT,
            decor=f'<path d="{rr(148, 104, 26, 22, 3)}" fill="#B2563A"/>'
                  + strokes("M 136 92 L 160 92 M 136 116 L 160 116 M 138 92 L 136 116 M 158 92 L 160 116", "#E8D8B0", 3.5, 0.9)
                  + f'<path d="{rr(56, 120, 20, 16, 3)}" fill="#9AA14E"/>' + strokes("M 46 112 L 66 112 M 46 128 L 66 128", "#E8D8B0", 3.5, 0.9))
    S.shape(blob(star(100, 120, 64, 46, 14, 8), 0.2), STRAW, shadow=3,
            decor="".join(strokes(f"M 100 120 L {x} {y}", "#C79A34", 4, 0.7) for x, y in star(100, 120, 60, 46, 14, 8)[::2]))
    # the gathered top: straw and a burlap frill above a twine knot
    S.shape(cloud(100, 36, 19, 9, 0.7), BUR, shadow=3, T="translate(100 36) scale(1 0.8) translate(-100 -36)",
            decor=strokes("M 100 34 L 100 18 M 100 34 L 86 26 M 100 34 L 114 26 M 100 34 L 88 42 M 100 34 L 112 42", DBUR, 3, 0.6))
    weave = "".join(strokes(f"M 40 {y} L 160 {y + 6}", "#A88A5E", 3, 0.35) for y in range(58, 156, 12)) + \
        "".join(strokes(f"M {x} 40 L {x - 6} 160", "#A88A5E", 3, 0.25) for x in range(52, 160, 12))
    S.shape(HEAD, BUR, shadow=5, decor='<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>' + weave
            + '<path d="M 74 56 C 84 64 92 66 100 66 C 108 66 116 64 126 56 L 118 50 L 100 56 L 82 50 Z" fill="#A88A5E" opacity="0.5"/>')
    S.shape(rr(100, 48, 30, 10, 5), "#6E4E2C", shadow=2, decor=strokes("M 88 48 L 112 48", "#A07A4E", 3, 0.7))
    S.raw(strokes("M 78 128 Q 100 142 122 128", "#5A3E2A", 4.5)
          + strokes("M 82 124 L 84 138 M 91 128 L 92 142 M 100 130 L 100 144 M 109 128 L 108 142 M 118 124 L 116 138",
                    "#5A3E2A", 3.5))

    def tuft(cx, cy, a):
        T = frame(cx, cy, a)
        S.shape(blob(star(0, 12, 17, 9, 6, 0), 0.15), "#D9A83E", T=T, shadow=3,
                decor=strokes("M 0 4 L 0 24 M -6 6 L -10 20 M 6 6 L 10 20", "#A87A24", 3, 0.8))
        S.shape(rr(0, -6, 30, 18, 7), COAT, T=T, shadow=2, decor=strokes("M -15 -2 L 15 -2", "#E8D8B0", 3.5, 0.8))
    S.group("arm-l", PL, "straw hand")
    tuft(56, 172, 18)
    S.group("arm-r", PR, "straw hand")
    tuft(144, 172, -18)
    S.group("crow", (34, 100), "the crow, its own part")
    CROW = "#3E3850"
    S.shape("M 28 82 L 24 58 L 34 64 L 44 58 L 40 82 Z", CROW, shadow=3)
    S.shape(ell(34, 98, 15, 21), CROW, shadow=4,
            decor=strokes("M 26 88 C 24 100 26 110 32 118", "#5E5878", 3.5, 0.9) + strokes("M 42 88 C 44 100 42 110 36 118", "#2C2838", 3.5, 0.7))
    S.shape(circ(34, 121, 10.5), CROW, shadow=3, decor='<circle cx="29" cy="119" r="2.2" fill="#E8E2D2"/><circle cx="39" cy="119" r="2.2" fill="#E8E2D2"/>')
    S.shape("M 29 127 L 39 127 L 34 143 Z", "#8E8A96", shadow=2)
    return save_f("fighter-scarecrow", S)


# ================================================================== Valkyrie
def braid(S, spine, w, col):
    """A plait: lobes leaning left and right in turn down a spine."""
    n = len(spine)
    for i in range(n - 1):
        (x0, y0), (x1, y1) = spine[i], spine[i + 1]
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        a = math.degrees(math.atan2(y1 - y0, x1 - x0)) + (28 if i % 2 else -28)
        L = math.hypot(x1 - x0, y1 - y0) * 0.95
        k = 1 - 0.25 * i / (n - 1)
        S.shape(ell(0, 0, L * 0.75, w * k), col, T=f"translate({f(cx)} {f(cy)}) rotate({f(a)})", shadow=2,
                decor=f'<path d="{ell(-2, -2, L * 0.45, w * k * 0.45)}" fill="{light(col, 1.15)}" opacity="0.7"/>')


def valkyrie():
    S = Sprite("FIGHTER Valkyrie (round 5): real plaits (lobes leaning left and right in turn) hanging from under the "
               "helm over each shoulder, tied with blue bands; a bigger spear; the helm's top is now as wide as its "
               "gold brow band (straight sides, round top). White wings on the helm, silver scale shoulders. Spear in "
               "the right hand (arm-r, before #body); left hand free. " + LAYOUT)
    S.group("arm-r", PR, "winged spear")
    T = frame(160, 110, 10)
    S.shape(rr(0, -6, 9, 150, 4.5), "#B98A56", T=T, shadow=0)
    S.shape("M 0 44 C 14 54 15 70 0 92 C -15 70 -14 54 0 44 Z", STEEL, T=T, shadow=2,
            decor='<rect x="-1.5" y="50" width="3" height="36" fill="#F4F6FA" opacity="0.7"/>')
    S.shape("M -2 44 C -11 42 -22 36 -26 26 C -16 30 -9 33 -2 36 Z M 2 44 C 11 42 22 36 26 26 C 16 30 9 33 2 36 Z",
            GOLD, T=T, shadow=2)
    S.shape(rr(0, 40, 13, 7, 3), GOLD, T=T, shadow=1)
    fist(S, 0, 10, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#2E3E6E")
    scale = "".join(f'<path d="M {x - 7} {y} A 7 7 0 0 0 {x + 7} {y}" fill="#8E98AC" opacity="0.7"/>'
                    for y in (92, 104, 116, 128) for x in range(20 + (y % 24) // 2, 200, 14))
    S.shape("M 24 112 C 22 90 40 80 62 80 L 70 132 C 52 138 30 132 24 112 Z", "#C3CAD6", shadow=3, decor=scale)
    S.shape("M 176 112 C 178 90 160 80 138 80 L 130 132 C 148 138 170 132 176 112 Z", "#C3CAD6", shadow=3, decor=scale)

    def feather_(root, ang, ln, w):
        c = (root[0] + math.cos(math.radians(ang)) * ln / 2, root[1] + math.sin(math.radians(ang)) * ln / 2)
        dx, dy = math.cos(math.radians(ang)) * ln / 2, math.sin(math.radians(ang)) * ln / 2
        return (f"M {f(c[0] - dx)} {f(c[1] - dy)} A {f(ln / 2)} {f(w / 2)} {f(ang)} 1 0 {f(c[0] + dx)} {f(c[1] + dy)} "
                f"A {f(ln / 2)} {f(w / 2)} {f(ang)} 1 0 {f(c[0] - dx)} {f(c[1] - dy)} Z")
    for sgn in (-1, 1):
        root = (100 + sgn * 46, 92)
        A = lambda a: a if sgn < 0 else 180 - a
        wing = " ".join(feather_(root, A(a), ln, w) for a, ln, w in ((-116, 88, 30), (-138, 76, 28), (-158, 58, 26)))
        S.shape(wing, "#F4F1EA", shadow=3)
    S.head(ears=False)
    HAIR = "#F0C04E"
    for sgn in (-1, 1):
        x0 = 100 + sgn * 40
        spine = [(x0, 108), (x0 + sgn * 3, 122), (x0 + sgn * 4, 136), (x0 + sgn * 4, 150), (x0 + sgn * 3, 163)]
        braid(S, spine, 9, HAIR)
        S.shape(rr(x0 + sgn * 3, 166, 13, 7, 3), "#3E5AA8", shadow=2)
        S.shape(blob([(x0 + sgn * 3 - 6, 169), (x0 + sgn * 3 + 6, 169), (x0 + sgn * 3 + 5, 182), (x0 + sgn * 3 - 5, 182)], 0.8),
                HAIR, shadow=2)
    S.shape("M 52 114 C 46 70 66 44 100 44 C 134 44 154 70 148 114 C 136 104 120 98 100 98 C 80 98 64 104 52 114 Z",
            HAIR, shadow=3)
    helm = "M 50 102 L 50 72 C 50 50 72 36 100 36 C 128 36 150 50 150 72 L 150 102 C 136 92 118 88 100 88 C 82 88 64 92 50 102 Z"
    S.shape(helm, "#C9D0DA", shadow=4,
            decor=f'<path d="M 40 82 C 70 66 130 66 160 82 L 160 110 L 40 110 Z" fill="{GOLD}"/>'
                  '<path d="M 100 36 L 100 74" stroke="#EEF1F5" stroke-width="6" opacity="0.6"/>'
                  f'<path d="{ell(78, 52, 14, 8)}" fill="#EEF1F5" opacity="0.6"/>')
    S.mouth()
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6)
    return save_f("fighter-valkyrie", S)


# ================================================================== Vampire
def vampire():
    S = Sprite("FIGHTER Vampire (round 5): a new collar that reads as a high stand-up collar: one smooth U standing "
               "round the back of the head, black outside and crimson inside, ending in two points at the front of "
               "the shoulders; hair slicked back hugging the head with a widow's peak. Pale skin, wine shoulders. A "
               "rapier in the right hand (arm-r, before #body); left hand free. " + LAYOUT)
    pale = hand_grad(S, "gPaleHand", "#F0E9F2", "#C4B6CA")
    S.group("arm-r", PR, "rapier")
    T = frame(152, 140, 22)
    S.shape(poly([(-4, 14), (4, 14), (1.5, 64), (0, 68), (-1.5, 64)]), STEEL, T=T, shadow=0,
            decor='<rect x="-0.8" y="16" width="1.6" height="44" fill="#F4F6FA" opacity="0.7"/>')
    S.shape(rr(0, -6, 8, 22, 3), "#3A2F44", T=T, shadow=0)
    S.shape(circ(0, -18, 6), GOLD, T=T, shadow=0)
    fist(S, 0, 0, T=T, under=True, hand=pale)
    S.shape(ell(0, 14, 15, 7), GOLD, T=T, shadow=3, decor=f'<path d="{ell(0, 16, 9, 3.5)}" fill="#A8741E" opacity="0.6"/>')
    S.shape(rr(0, 14, 34, 5, 2.5), GOLD, T=T, shadow=2)
    S.group("body")
    S.shape(SHOULDERS, "#5E2A40")
    collar = blob([(46, 142), (24, 112), (16, 78), (30, 52), (60, 40), (100, 38), (140, 40), (170, 52), (184, 78),
                   (176, 112), (154, 142), (148, 118), (146, 90), (134, 66), (100, 56), (66, 66), (54, 90), (52, 118)], 0.6)
    inner = blob([(50, 134), (34, 110), (28, 80), (40, 60), (66, 50), (100, 48), (134, 50), (160, 60), (172, 80),
                  (166, 110), (150, 134), (148, 116), (146, 90), (134, 66), (100, 56), (66, 66), (54, 90), (52, 116)], 0.6)
    S.shape(collar, "#2E2638", shadow=3, decor=f'<path d="{inner}" fill="#B8243A"/>'
            + strokes("M 36 112 C 30 80 50 56 100 52 C 150 56 170 80 164 112", "#E0485E", 3, 0.5))
    face = grad_face(S, "gPale", ("#8C7A90", "#BFB2C4", "#E2D9E6", "#E8E0EC", "#D5CADA"))
    S.head(face=face, ear=("#E2D7E6", "#C7B9CC"))
    hair = ("M 50 106 C 48 66 70 44 100 44 C 130 44 152 66 150 106 C 146 94 136 86 124 84 C 114 84 106 90 100 100 "
            "C 94 90 86 84 76 84 C 64 86 54 94 50 106 Z")
    S.shape(hair, "#2C2A44", shadow=3,
            decor=strokes("M 76 50 C 72 62 72 74 76 84 M 92 46 C 90 60 90 74 94 88 M 112 46 C 110 60 110 74 106 88 "
                          "M 126 50 C 128 62 128 74 124 84", "#5A5476", 3.5, 0.6))
    S.mouth(col="#9C6A7E")
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6, hand=pale)
    return save_f("fighter-vampire", S)


# ================================================================== Executioner
def executioner():
    S = Sprite("FIGHTER Executioner (round 5, new): a hulking headsman with broad bare shoulders, a leather harness "
               "strap and a studded belt; a black leather hood over the whole head, its tip flopping back, open at the "
               "lower face (a grim jaw with stubble, no eye holes). A huge bearded axe in the right hand (arm-r, "
               "before #body: the haft runs under the shoulder, the broad blade out forward and to the side); left "
               "hand free (arm-l). " + LAYOUT)
    SKIN = "#D69A72"
    S.group("back", (100, 56), "the hood's tip, flopping back")
    S.shape(blob([(84, 60), (88, 34), (98, 14), (104, 4), (112, 14), (116, 36), (116, 60)], 0.8), "#2E2630", shadow=0,
            decor=f'<path d="{ell(98, 26, 5, 14)}" fill="#4A4052" opacity="0.7"/>')
    S.group("arm-r", PR, "headsman's axe")
    T = frame(166, 80, 4)
    S.shape(rr(0, 40, 11, 110, 5), "#6E4A2C", T=T, shadow=0, decor=strokes("M 3 0 L 3 90", "#9A6E44", 2.5, 0.6))
    blade = "M -4 66 C -18 64 -32 56 -44 46 C -54 64 -56 90 -46 112 C -34 102 -20 98 -4 98 Z"
    S.shape(blade, "#B9C0CC", T=T, shadow=3,
            decor=strokes("M -44 50 C -50 66 -50 90 -44 108", "#EEF1F5", 6) + '<path d="M -4 66 L -4 98 L -16 98 L -16 66 Z" fill="#5E6676" opacity="0.7"/>')
    S.shape(rr(0, 100, 15, 22, 4), "#4E5464", T=T, shadow=2)
    fist(S, 0, 66, T=T, w=22, h=24)
    S.group("body")
    wide = "M 18 110 C 18 78 52 72 100 72 C 148 72 182 78 182 110 C 182 138 148 144 100 144 C 52 144 18 138 18 110 Z"
    S.shape(wide, SKIN, decor=f'<path d="{ell(46, 96, 18, 10)}" fill="#F0BC92" opacity="0.6"/><path d="{ell(154, 96, 18, 10)}" fill="#F0BC92" opacity="0.4"/>')
    S.shape("M 136 76 L 152 80 L 70 144 L 52 140 Z", "#4A2C1A", shadow=2,
            decor="".join(f'<circle cx="{x}" cy="{y}" r="2.8" fill="#C9A06A"/>' for x, y in [(138, 84), (120, 98), (102, 112), (84, 126), (68, 138)]))
    S.head(ears=False, face=grad_face(S, "gExe", ("#7A4E3A", "#B07A5A", "#D9A27F", "#DDA884", "#C8906C")))
    if EXE_R6:
        # round 6 (facial hair check: the stubble was a flat brown crescent hanging past the chin, so it read as a shadow
        # behind the head, as on the werewolf's human form): the stubble is now a short dark beard on the jaw, drawn on
        # the face with its own contact shadow, ragged at the bottom; the mouth shows above it. Nothing else changed.
        beard = blob([(64, 126), (70, 134), (80, 142), (90, 146), (100, 145), (110, 146), (120, 142), (130, 134),
                      (136, 126), (140, 138), (134, 148), (126, 151.5), (119, 156), (112, 154), (106, 158.5), (100, 155),
                      (94, 158.5), (88, 154), (81, 156), (74, 151.5), (66, 148), (60, 138)], 0.55)
        S.shape(beard, "#5E4A44", shadow=3)
    else:
        S.shape("M 72 138 C 82 148 118 148 128 138 C 124 150 112 156 100 156 C 88 156 76 150 72 138 Z", "#8A6A5A", shadow=0,
                side=False, catch=False)
    hood = ("M 50 124 C 44 90 52 60 72 48 C 82 42 92 40 100 40 C 108 40 118 42 128 48 C 148 60 156 90 150 124 "
            "C 140 116 132 112 124 112 C 116 112 108 116 100 116 C 92 116 84 112 76 112 C 68 112 60 116 50 124 Z")
    S.shape(hood, "#38303E", shadow=5,
            decor=f'<path d="{ell(80, 64, 20, 12)}" fill="#5A5064" opacity="0.6"/>'
                  + strokes("M 60 112 C 72 104 88 108 100 112 C 112 108 128 104 140 112", "#241C28", 4, 0.8))
    S.mouth(140, col="#7A4A3A")
    S.group("arm-l", PL, "free hand")
    fist(S, 48, 150, -8)
    return save_f("fighter-executioner", S)


# ================================================================== Gladiator
def gladiator():
    S = Sprite("FIGHTER Gladiator (round 5, new): a bronze helmet with a broad brim and a tall red crest running front "
               "to back, bare tanned shoulders, a segmented steel arm guard (manica) on the sword shoulder, a leather "
               "strap. A broad gladius in the right hand (arm-r, before #body) and a small round bronze shield in the "
               "left (arm-l, after #body, hand hidden). " + LAYOUT)
    SKIN = "#DDA57C"
    S.group("arm-r", PR, "gladius")
    T = frame(152, 136, 12)
    S.shape("M -8 16 L 8 16 L 9 50 L 0 64 L -9 50 Z", "#D0D6DF", T=T, shadow=0,
            decor='<path d="M -1 18 L -1 64 L 1 64 L 1 18 Z" fill="#F4F6FA" opacity="0.8"/>')
    S.shape(rr(0, 12, 26, 7, 3), BRONZE, T=T, shadow=2)
    S.shape(circ(0, -12, 6.5), BRONZE, T=T, shadow=0)
    fist(S, 0, 0, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, SKIN, decor=f'<path d="{ell(50, 96, 18, 10)}" fill="#F2C29A" opacity="0.6"/>')
    S.shape("M 60 78 L 74 76 L 152 136 L 136 140 Z", "#7A4A2A", shadow=2)
    S.shape("M 150 82 C 170 86 180 100 178 118 C 176 128 168 134 158 136 C 160 116 158 98 150 82 Z", "#BAC2CE", shadow=2,
            decor=strokes("M 158 88 C 170 96 174 108 172 120 M 154 100 C 166 106 168 116 166 128", "#8E96A6", 3, 0.8))
    S.head()
    if not GLADIATOR_R6:
        S.shape(ell(100, 78, 58, 44), BRONZE, shadow=5,
                decor=strokes(f"{ell(100, 78, 50, 36)}", "#9A6224", 3, 0.6) + f'<path d="{ell(80, 64, 26, 14)}" fill="#E8B060" opacity="0.5"/>')
        S.shape(ell(100, 70, 38, 34), "#D6974A", shadow=4, decor=f'<path d="{ell(88, 62, 14, 10)}" fill="#F2C27A" opacity="0.7"/>')
        crest = blob([(92, 104), (88, 80), (88, 40), (92, 14), (100, 6), (108, 14), (112, 40), (112, 80), (108, 104)], 0.8)
        S.shape(crest, "#C8323A", shadow=4,
                decor="".join(strokes(f"M 90 {y} L 110 {y + 4}", "#8E1E26", 2.5, 0.6) for y in range(16, 110, 8)))
    else:
        # round 6 ("give a spartan styled helmet"): the broad-brimmed helmet becomes a Corinthian (Spartan) helm: one
        # bronze shell over the whole head with cheek guards down to the jaw, the face showing only through its T-shaped
        # opening (a band across the eyes, split by the nose guard, and a slot down to the chin, where the mouth
        # shows). The red crest is the round-5 one, front to back, now ending at the brow.
        helm = ("M 91.6 152.4 C 66 150 46 130 46 98 C 46 64 66 40 100 40 C 134 40 154 64 154 98 C 154 130 134 150 108.4 152.4 "
                "L 108 128 C 108 122 112 119 118 118 L 128 117 C 134 116.5 136 112 135 108 C 132 103 118 101 100 101 "
                "C 82 101 68 103 65 108 C 64 112 66 116.5 72 117 L 82 118 C 88 119 92 122 92 128 Z")
        S.shape(helm, BRONZE, shadow=5,
                decor=strokes("M 60 136 C 54 122 52 106 54 92 M 140 136 C 146 122 148 106 146 92", "#9A6224", 3, 0.5))
        S.shape("M 95.5 98 L 104.5 98 L 103.2 124 C 102.8 127.5 97.2 127.5 96.8 124 Z", "#D6974A", shadow=2)
        crest = blob([(92, 94), (88, 72), (88, 40), (92, 14), (100, 6), (108, 14), (112, 40), (112, 72), (108, 94)], 0.8)
        S.shape(crest, "#C8323A", shadow=4,
                decor="".join(strokes(f"M 90 {y} L 110 {y + 4}", "#8E1E26", 2.5, 0.6) for y in range(16, 96, 8)))
    S.mouth(139)
    S.group("arm-l", PL, "round shield (hand hidden)")
    S.shape(circ(54, 150, 30), BRONZE, shadow=3,
            decor=strokes(circ(54, 150, 24), "#9A6224", 3, 0.6) + f'<path d="{ell(46, 140, 12, 8)}" fill="#F2C27A" opacity="0.6"/>')
    S.shape(circ(54, 150, 9), "#E0AC5A", shadow=2)
    return save_f("fighter-gladiator", S)


# ================================================================== Samurai
def samurai():
    S = Sprite("FIGHTER Samurai (round 5, new): an indigo kabuto with a wide flaring neck guard of lames laced in "
               "orange, two slim gold horns (kuwagata) rising from the brow and sweeping back in a V; layered indigo "
               "shoulder plates laced in orange. A long katana in the right hand (arm-r, before #body: only the fist "
               "and the blade out front show); left hand free on the scabbard side (arm-l). " + LAYOUT)
    IND, LACE = "#2E3C66", "#E8742E"
    S.group("arm-r", PR, "katana")
    T = frame(156, 108, 6)
    blade = "M -4.5 26 L 4.5 26 C 5.5 52 4 74 -1 92 L -5 91 C -2.5 72 -3.5 50 -4.5 26 Z"
    S.shape(blade, "#D8DDE5", T=T, shadow=0,
            decor='<path d="M 2 28 C 3 52 2 74 -2 90" stroke="#F4F6FA" stroke-width="2" fill="none" opacity="0.8"/>')
    S.shape(ell(0, 22, 12, 5.5), "#2A2630", T=T, shadow=2, decor=f'<rect x="-12" y="20.5" width="24" height="2.5" fill="{GOLD}"/>')
    S.shape(rr(0, -4, 10, 40, 4), "#ECE6DA", T=T, shadow=0,
            decor="".join(f'<path d="M -6 {y} L 6 {y + 5}" stroke="#2F3240" stroke-width="3"/>' for y in range(-24, 18, 7)))
    fist(S, 0, 4, T=T, w=21, h=23)
    S.group("body")
    S.shape(SHOULDERS, "#3A3440")
    for s in (-1, 1):
        x = 100 + s * 60
        for i, y in enumerate((88, 104, 120)):
            S.shape(rr(x + s * i * 2, y, 46, 18, 7), IND, shadow=3,
                    decor=strokes(f"M {x - 18} {y + 2} L {x + 18} {y + 2}", LACE, 3, 0.9))
    shik = blob([(100, 34), (140, 38), (164, 58), (172, 90), (164, 118), (146, 124), (100, 110), (54, 124), (36, 118),
                 (28, 90), (36, 58), (60, 38)], 0.9)
    S.shape(shik, IND, shadow=3, decor="".join(strokes(f"M 20 {y} Q 100 {y - 60} 180 {y}", LACE, 3.5, 0.9) for y in (96, 110, 124)))
    S.head(ears=False)
    bowl = "M 52 106 C 46 62 68 40 100 40 C 132 40 154 62 148 106 C 138 98 124 92 100 92 C 76 92 62 98 52 106 Z"
    S.shape(bowl, "#384A7C", shadow=4,
            decor=strokes("M 100 40 L 100 92 M 80 44 L 74 94 M 120 44 L 126 94 M 62 54 L 54 98 M 138 54 L 146 98", "#56689A", 3.5, 0.8)
                  + f'<path d="{ell(84, 54, 14, 8)}" fill="#6A7CAE" opacity="0.5"/>')
    S.shape("M 60 102 C 74 92 126 92 140 102 L 136 108 C 122 100 78 100 64 108 Z", "#C8A040", shadow=2)
    for s in (-1, 1):
        horn = (f"M {100 + s * 6} 98 C {100 + s * 18} 80 {100 + s * 36} 50 {100 + s * 50} 18 "
                f"C {100 + s * 40} 50 {100 + s * 24} 82 {100 + s * 14} 100 Z")
        S.shape(horn, GOLD, shadow=4)
    S.shape(circ(100, 98, 7), GOLD, shadow=2)
    S.mouth()
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6)
    return save_f("fighter-samurai", S)


# ================================================================== Werewolf (beast form) and its human form
FUR, DFUR, PFUR = "#7E879C", "#5B6378", "#C9CCD6"


def torn_shirt(S, col="#A33A3A"):
    shirt = [(26, 112), (30, 90), (52, 78), (100, 74), (148, 78), (170, 90), (174, 112), (166, 124), (158, 118), (152, 134),
             (140, 126), (128, 140), (100, 142), (72, 140), (60, 126), (48, 134), (42, 118), (34, 124)]
    S.shape(blob(shirt, 0.3), col)


def werewolf():
    S = Sprite("FIGHTER Werewolf (round 5, redo): a wolf seen from above in the house style: a round furry skull, "
               "big ears laid back, a long snout forward with a pale muzzle, a dark nose and two white fangs, a "
               "shaggy ruff over hunched shoulders, rags of the red shirt. No eyes (the snout and ears carry the read). "
               "No weapon: two big furry paws with white claws held forward (arm-l, arm-r, after #body). The human "
               "form is fighter-werewolf-human.svg. " + LAYOUT)
    S.group("body")
    torn_shirt(S)
    ruff = cloud(100, 104, 52, 18, 0.62, 5)
    if not WOLF_R6:
        S.shape(ruff, FUR, shadow=3, T="translate(100 104) scale(1.12 0.9) translate(-100 -104)",
                decor=f'<path d="{ell(80, 94, 30, 16)}" fill="#9AA2B4" opacity="0.5"/>')
        for s in (-1, 1):
            ear = blob([(100 + s * 22, 74), (100 + s * 46, 40), (100 + s * 52, 54), (100 + s * 44, 82)], 0.6)
            S.shape(ear, FUR, shadow=3, decor=f'<path d="{ell(100 + s * 42, 58, 5, 12)}" fill="#B88A98" opacity="0.7"/>')
        S.shape(ell(100, 100, 40, 40), FUR, shadow=5,
                decor=f'<path d="{ell(88, 86, 18, 12)}" fill="#9AA2B4" opacity="0.6"/>'
                      + strokes("M 100 64 L 100 96 M 86 68 L 90 94 M 114 68 L 110 94", DFUR, 4, 0.5))
        snout = blob([(100, 104), (116, 112), (120, 136), (114, 162), (100, 174), (86, 162), (80, 136), (84, 112)], 0.85)
        S.shape(snout, "#9AA2B4", shadow=4,
                decor=f'<path d="M 78 138 C 90 152 110 152 122 138 L 122 182 L 78 182 Z" fill="{PFUR}"/>'
                      + strokes("M 100 108 L 100 150", "#B6BDCC", 5, 0.7))
        for s in (-1, 1):
            S.shape(f"M {100 + s * 13} 150 L {100 + s * 19} 151 L {100 + s * 15} 162 Z", "#F4F1EA", shadow=0, side=False)
        S.shape(ell(100, 168, 11, 8.5), "#2E2836", shadow=2, side=False, decor='<circle cx="96" cy="165" r="3" fill="#6A6278"/>')
    else:
        # round 6 ("better; weird fangs; weird shadowing in some places, like that top head segment and ears"):
        # the same wolf. The light sheen patches (skull, ruff, paws) and the dark stripes on the skull are gone, and
        # the skull's contact shadow on the ruff is soft and short, so the top of the head no longer sits on the ruff as
        # a separate ringed dome. The inner ears follow the ear's shape in a muted dusky pink instead of a round pink
        # spot. The fangs are two curved white fangs hanging from the upper jaw beside the nose (not flat triangles
        # stuck on the snout's sides). Shapes, sizes and colours otherwise as round 5.
        S.shape(ruff, FUR, shadow=3, T="translate(100 104) scale(1.12 0.9) translate(-100 -104)")
        for s in (-1, 1):
            ear = blob([(100 + s * 22, 74), (100 + s * 46, 40), (100 + s * 52, 54), (100 + s * 44, 82)], 0.6)
            inner = blob([(100 + s * 30, 72), (100 + s * 44, 49), (100 + s * 47, 57), (100 + s * 41, 76)], 0.6)
            S.shape(ear, FUR, shadow=2, sop=0.18, decor=f'<path d="{inner}" fill="#9C7E8C" opacity="0.75"/>')
        S.shape(ell(100, 100, 40, 40), FUR, shadow=3, sop=0.15)
        snout = blob([(100, 104), (116, 112), (120, 136), (114, 162), (100, 174), (86, 162), (80, 136), (84, 112)], 0.85)
        S.shape(snout, "#9AA2B4", shadow=4,
                decor=f'<path d="M 78 138 C 90 152 110 152 122 138 L 122 182 L 78 182 Z" fill="{PFUR}"/>'
                      + strokes("M 100 108 L 100 150", "#B6BDCC", 5, 0.7))
        for s in (-1, 1):
            S.shape(f"M {100 + s * 9.5} 158 C {100 + s * 14.5} 158.5 {100 + s * 16} 162 {100 + s * 15} 166 "
                    f"C {100 + s * 14.5} 169.5 {100 + s * 13} 172.5 {100 + s * 12} 174.5 C {100 + s * 11.2} 170 {100 + s * 9.5} 165 "
                    f"{100 + s * 9.5} 158 Z", "#F4F1EA", shadow=1.5, sop=0.25, side=False)
        S.shape(ell(100, 168, 11, 8.5), "#2E2836", shadow=2, side=False, decor='<circle cx="96" cy="165" r="3" fill="#6A6278"/>')

    def paw(cx, cy, a):
        T = frame(cx, cy, a)
        for dx in (-9, 0, 9):
            S.shape("M -3.5 0 L 3.5 0 L 0 15 Z", "#F4F1EA", T=f"{T} translate({dx} 10)", shadow=0, side=False)
        S.shape(blob([(-15, -10), (0, -16), (15, -10), (16, 6), (0, 15), (-16, 6)], 0.9), FUR, T=T, shadow=3,
                decor="" if WOLF_R6 else f'<path d="{ell(-4, -6, 7, 4)}" fill="#9AA2B4" opacity="0.6"/>')
    S.group("arm-l", PL, "paw")
    paw(46, 152, 10)
    S.group("arm-r", PR, "paw")
    paw(154, 152, -10)
    return save_f("fighter-werewolf", S)


def werewolf_human():
    S = Sprite("FIGHTER Werewolf, human form (round 5): the same torn red shirt; a woodsman with wild shaggy grey-brown "
               "hair, long sideburns and stubble, a fur-trimmed collar. A hatchet in the right hand (arm-r, before "
               "#body); left hand free (arm-l). Turns into fighter-werewolf.svg. " + LAYOUT)
    S.group("arm-r", PR, "hatchet")
    T = frame(152, 136, 16)
    S.shape(rr(0, 18, 9, 62, 4), "#8A5E38", T=T, shadow=0)
    if WWH_R6:
        # round 6 ("flip axe"): the hatchet head is mirrored across the haft, so the blade faces in toward the body
        # (as the Brute's axe was flipped in round 4). Same haft, head and size.
        S.shape("M -4 34 C -14 32 -24 28 -30 22 C -36 34 -36 50 -30 60 C -24 54 -14 50 -4 50 Z", "#B9C0CC", T=T, shadow=2,
                decor=strokes("M -30 26 C -34 36 -34 48 -30 56", "#EEF1F5", 4))
    else:
        S.shape("M 4 34 C 14 32 24 28 30 22 C 36 34 36 50 30 60 C 24 54 14 50 4 50 Z", "#B9C0CC", T=T, shadow=2,
                decor=strokes("M 30 26 C 34 36 34 48 30 56", "#EEF1F5", 4))
    fist(S, 0, 0, T=T, under=True)
    S.group("body")
    torn_shirt(S)
    S.shape(cloud(100, 106, 44, 16, 0.6), "#8A8E9C", shadow=3)
    S.head()
    HAIR, DHAIR = "#6E6A6E", "#4E4A50"
    for s in (-1, 1):
        S.shape(blob([(100 + s * 46, 88), (100 + s * 50, 112), (100 + s * 44, 136), (100 + s * 36, 128), (100 + s * 38, 100)], 0.8),
                HAIR, shadow=3)
    hair = blob([(48, 112), (40, 96), (46, 84), (42, 66), (56, 58), (60, 40), (78, 42), (90, 28), (104, 38), (120, 28),
                 (128, 44), (146, 44), (144, 62), (158, 72), (150, 86), (158, 100), (150, 112), (138, 98), (126, 104),
                 (116, 94), (104, 104), (92, 94), (80, 104), (70, 96), (60, 106)], 0.55)
    if WWH_R6:
        # round 6 (facial hair layered wrong / doesn't look good): the see-through stubble crescent hung past the chin,
        # so it read as a shadow behind the head. Now the stubble is a short scruffy beard in the hair's colour,
        # drawn over the face: it runs from the sideburns along the jaw and over the chin, a little past the face's
        # edge, with a ragged lower edge; the mouth shows above it. And the hair: no sheen patch, no dark lines.
        beard = blob([(57, 122), (65, 126), (70, 136), (80, 144), (90, 148), (100, 146.5), (110, 148), (120, 144),
                      (130, 136), (135, 126), (143, 122), (145, 136), (139, 146), (131, 151), (125, 149.5), (118, 156),
                      (111, 154), (105, 159), (100, 155), (95, 159), (89, 154), (82, 156), (75, 149.5), (69, 151),
                      (61, 146), (55, 136)], 0.55)
        S.shape(beard, HAIR, shadow=3)
        S.shape(hair, HAIR, shadow=4)
        S.mouth(139, col="#9A6A58")
    else:
        S.shape("M 70 140 C 82 152 118 152 130 140 C 124 154 112 158 100 158 C 88 158 76 154 70 140 Z", "#8A7068",
                shadow=0, side=False, catch=False)
        S.shape(hair, HAIR, shadow=4,
                decor=strokes("M 70 52 L 76 80 M 90 40 L 92 76 M 110 40 L 108 76 M 130 52 L 124 80", DHAIR, 3.5, 0.6)
                      + f'<path d="{ell(80, 60, 18, 10)}" fill="#8E8A8E" opacity="0.6"/>')
        S.mouth(140, col="#9A6A58")
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6)
    return save_f("fighter-werewolf-human", S)


# ================================================================== Engineer's turret
def turret():
    S = Sprite("COMPANION the engineer's turret (round 5): the gun top is its own part so it can turn on its own. "
               "#back: the three legs. #body: the base (a steel ring and swivel plate). #top (data-pivot = the swivel "
               "centre): the brass housing, the mantlet and the twin barrels, pointing forward. " + LAYOUT)
    S.group("back", None, "tripod legs")
    for a in (150, 30, 270):
        r = math.radians(a)
        x, y = 100 + 62 * math.cos(r), 96 + 62 * math.sin(r)
        S.shape(f'M {f(100 - 7 * math.sin(r))} {f(96 + 7 * math.cos(r))} L {f(x - 5 * math.sin(r))} {f(y + 5 * math.cos(r))} '
                f'L {f(x + 5 * math.sin(r))} {f(y - 5 * math.cos(r))} L {f(100 + 7 * math.sin(r))} {f(96 - 7 * math.cos(r))} Z',
                "#5E6474", shadow=0)
        S.shape(circ(x, y, 9), "#3E4250", shadow=0)
    S.group("body", None, "base: steel ring and swivel plate")
    S.shape(circ(100, 96, 40), "#6A7080", shadow=3,
            decor="".join(f'<circle cx="{f(100 + 34 * math.cos(math.radians(a)))}" cy="{f(96 + 34 * math.sin(math.radians(a)))}" r="2.6" fill="#3E4250"/>'
                          for a in range(15, 360, 45)))
    S.shape(circ(100, 96, 30), "#4E5464", shadow=2)
    S.group("top", (100, 96), "the turning gun top")
    for dx in (-9, 9):
        S.shape(rr(100 + dx, 146, 11, 56, 4), "#A9B2C0", shadow=3,
                decor=f'<rect x="{96 + dx}" y="122" width="2.5" height="46" fill="#E6EAF0" opacity="0.7"/>')
        S.shape(rr(100 + dx, 172, 14, 8, 3), "#5E6474", shadow=2)
    S.shape(rr(100, 124, 40, 22, 6), "#D9A441", shadow=3,
            decor='<path d="M 80 118 L 120 118 L 120 124 L 80 124 Z" fill="#E07A2C"/>')
    S.shape(circ(100, 94, 27), "#D9A441", shadow=4,
            decor="".join(f'<circle cx="{f(100 + 20 * math.cos(math.radians(a)))}" cy="{f(94 + 20 * math.sin(math.radians(a)))}" r="2.6" fill="#8A6424"/>'
                          for a in range(0, 360, 60)))
    S.shape(circ(100, 92, 11), "#5E6474", shadow=2, decor='<circle cx="97" cy="89" r="4" fill="#8E96A6"/>')
    return save_f("engineer-turret", S)


DESIGNS = {"jester": jester, "scarecrow": scarecrow, "valkyrie": valkyrie, "vampire": vampire,
           "executioner": executioner, "gladiator": gladiator, "samurai": samurai, "werewolf": werewolf,
           "werewolf-human": werewolf_human, "turret": turret}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(DESIGNS):
        print(DESIGNS[n]())
