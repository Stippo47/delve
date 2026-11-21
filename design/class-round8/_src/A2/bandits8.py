"""Round 8, part 2: the bandits of the Wildwood, real art for the kinds that wore the Bandit hero (and the Shade, the
Bearskin and the Trapper) as placeholders. One gang look on the heroes' base body (A2 library): rag-edged leather
shoulders, the red bandanna over the lower face (the Bandit hero's mask, picked in round 2), no eyes; what tells them
apart at game size is the weapon (the designer's list: "1 sword and torch, Great sword, Axe, Sword and shield, Spear,
2 daggers") and the headgear, each its own shape and colour.
python bandits8.py [name ...]   -> ../../enemies/bandit-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *

LEATHER = "#A8743F"
DLEATHER = "#7A4E2A"
RED = "#C8403A"           # the gang's bandanna (the Bandit hero's)
HAIR = "#74472B"
NAVY = "#4E5770"
RAGS = ("M24 108 C24 84 56 76 100 76 C144 76 176 84 176 108 L172 126 Q166 144 148 136 Q136 150 118 140 Q100 152 82 140 "
        "Q64 150 52 136 Q34 144 28 126 Z")   # the Bandit hero's rag-edged tunic
MASK = ("M53 114 C70 120 86 118 100 114 C114 118 130 120 147 114 C146 130 136 144 122 152 C114 160 106 168 100 176 "
        "C94 168 86 160 78 152 C64 144 54 130 53 114 Z")
HAIRCAP = ("M51 100 C40 64 62 38 100 38 C138 38 160 64 149 100 C146 92 142 86 138 84 C130 86 122 88 114 86 C106 90 94 90 "
           "86 86 C78 88 70 86 62 84 C58 88 54 94 51 100 Z")
STEEL_D = "#AEB5C1"


def blade_decor(pts_half):
    """The darker right half of a blade (the heroes' blades are split light/dark down the middle)."""
    return f'<path d="{poly(pts_half)}" fill="#7E8696" opacity="0.45"/>'


# ------------------------------------------------------------------ weapons (local frame: +y along the handle, forward)
def sword(S, T, L=66, w=9):
    S.shape(rr(0, -10, 9, 22, 4), "#5A3A26", T=T, shadow=0)
    S.shape(circ(0, -22, 5.5), BRASS, T=T, shadow=0)
    blade = [(-w, 8), (w, 8), (w, L - 10), (0, L + 6), (-w, L - 10)]
    S.shape(poly(blade), STEEL, T=T, shadow=2, decor=blade_decor([(0, 8), (w, 8), (w, L - 10), (0, L + 6)]))
    S.shape(rr(0, 5, 30, 7, 3), BRASS, T=T, shadow=2)
    fist(S, 0, -8, T=T)


def buckler(S, cx, cy, r=25):
    S.shape(circ(cx, cy, r), "#8A5A33", shadow=4,
            decor=f'<path d="{circ(cx, cy, r - 6)}" fill="#A8743F"/>' + strokes(f"M {cx - r} {cy} L {cx + r} {cy}", "#7A4E2A", 3, 0.5))
    S.shape(circ(cx, cy, 8.5), "#B9C0CC", shadow=2, decor=f'<circle cx="{cx - 2.5}" cy="{cy - 2.5}" r="3" fill="#F4F6FA"/>')


def torch(S, T):
    S.shape(rr(0, 12, 9, 38, 4), "#8A5E38", T=T, shadow=0)
    S.shape(rr(0, 32, 16, 16, 5), "#5A4A40", T=T, shadow=2, decor=strokes("M -8 28 L 8 32 M -8 35 L 8 39", "#3E322C", 2.5, 0.7))
    flame = blob([(0, 36), (15, 46), (18, 62), (11, 78), (0, 90), (-11, 78), (-18, 62), (-15, 46)], 0.9)
    S.shape(flame, fill="url(#gFlame)", T=T, shadow=0, side=False,
            decor=f'<path d="{blob([(0, 48), (9, 56), (10, 66), (0, 78), (-10, 66), (-9, 56)], 0.9)}" fill="#FFE9A0"/>')
    fist(S, 0, -2, T=T)


def axe(S, T, L=64):
    S.shape(rr(0, L / 2 - 8, 10, L + 12, 4), "#8A5E38", T=T, shadow=0)
    head = "M -3 30 C -16 28 -30 20 -37 10 C -47 28 -47 54 -37 70 C -30 60 -16 54 -3 54 Z"
    S.shape(head, "#B9C0CC", T=T, shadow=2, decor=strokes("M -37 15 C -43 30 -43 50 -37 65", "#EEF1F5", 4.5))
    S.shape(rr(0, 42, 15, 28, 4), "#6E747E", T=T, shadow=1)
    fist(S, 0, 0, T=T)


def spear(S, T, back=-34, L=80):
    S.shape(rr(0, (back + L) / 2, 9, L - back, 4.5), "#9A6A40", T=T, shadow=0)
    S.shape(rr(0, L - 6, 13, 9, 3), "#6E747E", T=T, shadow=1)
    S.shape(blob([(-10, L - 2), (10, L - 2), (11, L + 14), (0, L + 36), (-11, L + 14)], 0.7), STEEL, T=T, shadow=2,
            decor=blade_decor([(0, L - 2), (10, L - 2), (11, L + 14), (0, L + 36)]))
    fist(S, 0, 0, T=T)


def dagger(S, T, L=44):
    S.shape(rr(0, -8, 8, 18, 3.5), "#4A3226", T=T, shadow=0)
    S.shape(poly([(-7, 6), (7, 6), (5.5, L - 4), (0, L + 7), (-5.5, L - 4)]), STEEL, T=T, shadow=2,
            decor=blade_decor([(0, 6), (7, 6), (5.5, L - 4), (0, L + 7)]))
    S.shape(rr(0, 4, 20, 6, 3), BRASS, T=T, shadow=2)
    fist(S, 0, -6, T=T)


def greatsword(S, T, L=72):
    S.shape(rr(0, -8, 10, 46, 4), "#4A3226", T=T, shadow=0)
    S.shape(circ(0, -32, 6.5), BRASS, T=T, shadow=0)
    blade = [(-11, 20), (11, 20), (10, L), (0, L + 18), (-10, L)]
    S.shape(poly(blade), STEEL, T=T, shadow=2, decor=blade_decor([(0, 20), (11, 20), (10, L), (0, L + 18)]))
    S.shape(rr(0, 17, 52, 9, 4), "#8A929E", T=T, shadow=2)
    fist(S, 0, -20, T=T)
    fist(S, 0, 2, T=T)


# ------------------------------------------------------------------ the body all bandits share
FLAME = ('<linearGradient id="gFlame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB23A"/>'
         '<stop offset="1" stop-color="#E8542A"/></linearGradient>')


def body(S, tunic=LEATHER, hair=True, mask=RED):
    S.group("body")
    S.shape(RAGS, tunic)
    head(S)
    if hair:
        S.shape(HAIRCAP, HAIR, shadow=3)
    return S


def masked(S, mask=RED):
    S.shape(MASK, mask, shadow=3)
    S.raw(f'<path d="M68 128 Q100 138 132 128" fill="none" stroke="{shade(mask, 0.62)}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>')


def scarf(S, col=NAVY):
    """The Bandit hero's head scarf: a band across the brow, knotted at the back right with two tails."""
    S.shape("M52 76 C60 82 80 90 100 90 C120 90 140 82 148 76 C150 80 150 88 148 92 C138 100 120 106 100 106 C80 106 62 100 "
            "52 92 C50 88 50 80 52 76 Z", col, shadow=3)


def scarf_knot(S, col=NAVY):
    S.shape("M116 52 C122 34 140 18 164 18 C156 28 160 38 150 46 C160 46 166 54 170 62 C152 64 138 62 126 62 Z", col, shadow=0)
    S.shape(circ(142, 52, 10), col, shadow=2)


def hood(S, col, tail=True):
    """A cloth hood over the head, its rim round the face, its tail lying back over the shoulders to the right."""
    if tail:
        S.shape(strip([(104, 52), (116, 34), (132, 22), (148, 18)], 15, taper=(0.75, 1.0)), shade(col, 0.9), shadow=0)
    S.shape(blob([(48, 112), (42, 76), (56, 48), (78, 34), (100, 30), (122, 34), (144, 48), (158, 76),
                  (152, 112), (140, 106), (138, 86), (120, 74), (100, 72), (80, 74), (62, 86), (60, 106)], 0.8), col, shadow=4)


def kettle_hat(S, col="#8E96A4"):
    S.shape(ell(100, 80, 62, 48), col, shadow=5, decor=f'<path d="{ell(100, 80, 52, 38)}" fill="{shade(col, 0.85)}" opacity="0.5"/>')
    S.shape(ell(100, 76, 40, 36), col, shadow=4, decor=f'<path d="{ell(88, 64, 16, 11)}" fill="#F4F6FA" opacity="0.35"/>')


def fur_cap(S, col="#8A6A4A"):
    S.shape(blob([(54, 96), (50, 66), (66, 42), (100, 32), (134, 42), (150, 66), (146, 96), (100, 90)], 0.85), col, shadow=5)
    S.shape(cloud(100, 96, 44, 13, 0.55, 0), "#B39A7A", shadow=3, T="translate(100 96) scale(1.06 0.34) translate(-100 -96)")


def feather_cap(S, col="#6E5A3A", plume="#D8463F"):
    pf, ph = feather([(122, 64), (134, 40), (140, 14), (138, -6)], 12)
    S.shape(pf, plume, shadow=0, decor=f'<path d="{ph}" fill="{shade(plume, 0.8)}" opacity="0.6"/>')
    S.shape(blob([(52, 96), (50, 66), (66, 44), (100, 36), (134, 44), (150, 66), (148, 96), (100, 90)], 0.85), col, shadow=5)
    S.shape("M52 92 C60 98 80 102 100 102 C120 102 140 98 148 92 C150 96 150 102 148 106 C138 112 120 114 100 114 C80 114 62 112 "
            "52 106 C50 102 50 96 52 92 Z", shade(col, 0.8), shadow=2)


# ------------------------------------------------------------------ the six
def bandit_sword():
    S = Sprite("BANDIT, sword and shield (round 8): the gang's look on the heroes' base: rag-edged leather tunic, the red "
               "bandanna over the lower face (no eyes), brown hair under a navy head scarf knotted at the back. A short "
               "sword in the right hand (arm-r, under the shoulder, pointing forward) and a round wooden buckler with an "
               "iron boss in front of the left hand (arm-l, hand hidden). " + LAYOUT)
    S.add_def(FLAME)
    S.group("arm-r", PR, "short sword")
    sword(S, frame(164, 132, 12))
    body(S)
    scarf_knot(S)
    scarf(S)
    masked(S)
    S.group("arm-l", PL, "buckler")
    fist(S, 46, 146, -6)
    buckler(S, 42, 156, 27)
    return save("enemies", "bandit-sword", S)


def bandit_torch():
    S = Sprite("TORCH BANDIT, sword and torch (round 8): the gang's tunic and red bandanna; a rust-brown hood with its "
               "point trailing back; a short sword in the right hand (arm-r, under the shoulder) and a burning torch "
               "held out in the left (arm-l), the flame in front. " + LAYOUT)
    S.add_def(FLAME)
    S.group("arm-r", PR, "short sword")
    sword(S, frame(164, 132, 12))
    S.group("arm-l", PL, "torch")
    torch(S, frame(44, 114, -10))
    body(S, hair=False)
    hood(S, "#9A5A3A")
    masked(S)
    return save("enemies", "bandit-torch", S)


def bandit_greatsword():
    S = Sprite("GREATSWORD BANDIT (round 8): the gang's tunic and red bandanna under an iron kettle hat with a broad round "
               "brim; a big two-handed sword, both fists on the long grip at the right side, the blade forward and in "
               "across the front (arm-r, before #body; no arm-l). " + LAYOUT)
    S.group("arm-r", PR, "greatsword, both hands")
    greatsword(S, frame(150, 126, 30))
    body(S, hair=False)
    masked(S)
    kettle_hat(S)
    return save("enemies", "bandit-greatsword", S)


def bandit_axe():
    S = Sprite("AXE BANDIT (round 8): the gang's tunic and red bandanna under a fur cap with a pale fur rim; a hand axe in "
               "the right hand (arm-r, under the shoulder, the blade turned in), the left hand free (arm-l). " + LAYOUT)
    S.group("arm-r", PR, "hand axe")
    axe(S, frame(160, 132, 10))
    body(S, hair=False)
    fur_cap(S)
    masked(S)
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 146, -6)
    return save("enemies", "bandit-axe", S)


def bandit_spear():
    S = Sprite("SPEAR BANDIT (round 8): the gang's tunic and red bandanna under a leather cap with a red feather lying "
               "back; a long spear in the right hand (arm-r, under the shoulder, the point well forward), the left hand "
               "free (arm-l). " + LAYOUT)
    S.group("arm-r", PR, "spear")
    spear(S, frame(156, 110, 5), back=-52, L=50)
    body(S, hair=False)
    feather_cap(S)
    masked(S)
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 146, -6)
    return save("enemies", "bandit-spear", S)


def bandit_daggers():
    S = Sprite("KNIFE BANDIT, two daggers (round 8): the gang's tunic and red bandanna under a dark slate hood drawn low; "
               "a dagger in each hand, both under the shoulders, pointing forward and a little apart (arm-l, arm-r, "
               "before #body). " + LAYOUT)
    S.group("arm-r", PR, "dagger")
    dagger(S, frame(156, 136, 8))
    S.group("arm-l", PL, "dagger")
    dagger(S, frame(44, 136, -8))
    body(S, tunic="#7A5A44", hair=False)
    hood(S, "#4E4A5E", tail=False)
    masked(S)
    return save("enemies", "bandit-daggers", S)


BUILD = {"bandit-sword": bandit_sword, "bandit-torch": bandit_torch, "bandit-greatsword": bandit_greatsword,
         "bandit-axe": bandit_axe, "bandit-spear": bandit_spear, "bandit-daggers": bandit_daggers}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
