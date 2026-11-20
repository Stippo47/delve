"""A2 round 5: the four engineers, the four beast tamers and their eight beasts.
Run: python crew.py [name ...]  -> ../../fighters/<file>.svg"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *
from fighters import save_f, grad_face, hand_grad

WHIP_NOTE = ("The whip is two parts: arm-r holds the handle (fist on it), and #whip is the lash on its own, its "
             "data-pivot at the tip of the handle (the knot), so the game can pin it to the hand and crack it: "
             "swing it out from the pivot and snap it back, or stretch it toward the target.")


# ================================================================== Engineers
def wrench(S, T, col="#A9B2C0"):
    S.shape(rr(0, 0, 12, 76, 5), col, T=T, shadow=0)
    S.shape("M -17 36 C -17 27 17 27 17 36 L 17 56 L 8 56 L 8 45 L -8 45 L -8 56 L -17 56 Z", col, T=T, shadow=2,
            decor='<rect x="-15" y="34" width="4" height="24" fill="#E6EAF0" opacity="0.7"/>')


def engineer_a():
    S = Sprite("FIGHTER Engineer A, the mechanic: orange work suit with a dark band, a brass gear on the left "
               "shoulder, a welding mask flipped up on top of the head (steel, dark green window), brown hair. A big "
               "open wrench in the right hand (arm-r, before #body); left hand free. Deploys engineer-turret.svg. "
               + LAYOUT)
    S.group("arm-r", PR, "wrench")
    T = frame(151, 143, 16)
    wrench(S, T)
    fist(S, 0, 0, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#E07A2C", decor='<path d="M 26 116 L 174 116 L 174 124 L 26 124 Z" fill="#B4561A" opacity="0.7"/>')
    S.shape(blob(star(42, 104, 30, 23, 9, 0), 0.25), "#D9A441", shadow=3,
            decor=f'<path d="{circ(42, 104, 11)}" fill="#8A6424"/><path d="{circ(42, 104, 6)}" fill="#E07A2C"/>')
    S.head()
    S.shape("M 52 112 C 46 64 70 44 100 44 C 130 44 154 64 148 112 C 140 100 124 94 100 94 C 76 94 60 100 52 112 Z",
            "#6B4426", shadow=4)
    mask = blob([(60, 84), (58, 54), (72, 34), (100, 28), (128, 34), (142, 54), (140, 84), (120, 90), (100, 92), (80, 90)], 0.8)
    S.shape(mask, "#8E97A6", shadow=4,
            decor=f'<path d="{rr(100, 66, 48, 18, 6)}" fill="#24463A"/><path d="{rr(90, 62, 16, 5, 2.5)}" fill="#5E9A84" opacity="0.8"/>')
    S.shape(rr(54, 84, 12, 12, 4), "#5E6474", shadow=2)
    S.shape(rr(146, 84, 12, 12, 4), "#5E6474", shadow=2)
    mouth(S)
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6)
    return save_f("fighter-engineer-a", S)


def engineer_b():
    S = Sprite("FIGHTER Engineer B, the clockmaker: a brown bowler hat with a brass gear pinned to the band, white "
               "shirt sleeves under a green waistcoat, a ring of spare cogs on a cord over the right shoulder; neat "
               "dark hair and moustache. A heavy brass-headed mallet in the right hand (arm-r, before #body); left "
               "hand free. " + LAYOUT)
    S.group("arm-r", PR, "brass mallet")
    T = frame(152, 136, 14)
    S.shape(rr(0, 20, 9, 48, 4), "#7A4E2C", T=T, shadow=0)
    S.shape(rr(0, 50, 40, 24, 7), BRASS, T=T, shadow=2,
            decor='<rect x="-20" y="42" width="40" height="5" fill="#FFE08A" opacity="0.6"/><rect x="-22" y="38" width="6" height="24" fill="#8A6424" opacity="0.6"/><rect x="16" y="38" width="6" height="24" fill="#8A6424" opacity="0.6"/>')
    fist(S, 0, 0, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#F1ECE2", decor=strokes("M 30 104 C 40 92 60 86 70 86 M 170 104 C 160 92 140 86 130 86", "#D8D0C0", 4, 0.8))
    S.shape(blob([(66, 82), (100, 78), (134, 82), (130, 140), (100, 146), (70, 140)], 0.8), "#3E6E4E", shadow=3,
            decor="".join(f'<circle cx="100" cy="{y}" r="2.6" fill="{GOLD}"/>' for y in (118, 128, 138)))
    for i, a in enumerate(range(200, 340, 28)):
        x, y = 150 + 22 * math.cos(math.radians(a)) * 0.9, 112 + 26 * math.sin(math.radians(a)) * -0.8
        S.shape(blob(star(x, y, 8, 5.5, 7, i * 9), 0.3), BRASS if i % 2 else "#B9C0CC", shadow=2,
                decor=f'<circle cx="{f(x)}" cy="{f(y)}" r="2.4" fill="#5E4A2A"/>')
    S.head()
    moustache(S, "#3A2A26", 125, 0.8, 1)
    S.shape(ell(100, 74, 56, 44), "#5A3A26", shadow=5, decor=f'<path d="{ell(84, 64, 26, 14)}" fill="#7A5236" opacity="0.6"/>')
    S.shape(circ(100, 70, 32), "#6A4630", shadow=4, decor=f'<path d="{ell(90, 60, 12, 8)}" fill="#8E6A4E" opacity="0.7"/>')
    S.shape("M 68 74 C 80 90 120 90 132 74 L 131 82 C 120 98 80 98 69 82 Z", "#A07A50", shadow=2)
    S.shape(blob(star(124, 84, 9, 6.5, 8, 0), 0.3), BRASS, shadow=2, decor='<circle cx="124" cy="84" r="2.8" fill="#5E4A2A"/>')
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6)
    return save_f("fighter-engineer-b", S)


def engineer_c():
    S = Sprite("FIGHTER Engineer C, the sapper: a yellow hard hat with a ridge and a brass headlamp at the front, a "
               "big bushy red-brown beard, a leather apron strap over a grey-blue shirt, a coil of fuse on the hip. A "
               "sledgehammer in the right hand (arm-r, before #body); left hand free. " + LAYOUT)
    S.group("arm-r", PR, "sledgehammer")
    T = frame(152, 130, 12)
    S.shape(rr(0, 24, 10, 64, 4.5), "#9A6A3E", T=T, shadow=0)
    S.shape(rr(0, 54, 44, 22, 5), "#6E7484", T=T, shadow=2,
            decor='<rect x="-22" y="44" width="44" height="5" fill="#A9B2C0" opacity="0.8"/>')
    fist(S, 0, 0, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#5E7690")
    S.shape("M 58 80 L 72 78 L 148 138 L 132 140 Z", "#7A4E2C", shadow=2)
    S.shape(circles([(44, 120, 10), (36, 108, 9), (50, 104, 8)]), "#C9A36C", shadow=2,
            decor=strokes(circ(44, 112, 7), "#9E7A44", 2.5, 0.8))
    S.head()
    S.shape(cloud(100, 140, 32, 11, 0.62), "#A8522A", shadow=3,
            decor=f'<path d="{ell(90, 134, 14, 8)}" fill="#C8703E" opacity="0.6"/>')
    moustache(S, "#B8602E", 124, 0.95, 1)
    hat = "M 46 100 C 40 60 66 36 100 36 C 134 36 160 60 154 100 C 136 90 64 90 46 100 Z"
    S.shape(ell(100, 94, 58, 18), "#E2A81E", shadow=4)
    S.shape(hat, "#F2C030", shadow=4,
            decor=strokes("M 100 38 L 100 92", "#D49A12", 9, 0.8) + f'<path d="{ell(80, 56, 14, 10)}" fill="#FFE08A" opacity="0.7"/>')
    S.shape(rr(100, 96, 26, 14, 5), "#8A6424", shadow=2, decor=f'<path d="{ell(100, 98, 9, 5)}" fill="#FFF3B0"/>')
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6)
    return save_f("fighter-engineer-c", S)


def engineer_d():
    S = Sprite("FIGHTER Engineer D, the artificer: a deep teal hood with a brass rim and a glowing blue crystal set in "
               "a brass circlet, brass-plated shoulder pieces with rivets, a satchel strap. A long spanner-staff (a "
               "rod with an open spanner head holding a glowing crystal) in the right hand (arm-r, before #body); "
               "left hand free. " + LAYOUT)
    TEAL, GLOW = "#1F6E78", "#7FE3FF"
    S.group("arm-r", PR, "spanner-staff")
    T = frame(158, 56, 6)
    S.shape(rr(0, 54, 8, 140, 4), "#5E4A3A", T=T, shadow=0)
    S.shape("M -16 112 C -16 102 16 102 16 112 L 16 134 L 7 134 L 7 120 L -7 120 L -7 134 L -16 134 Z", BRASS, T=T, shadow=2)
    S.shape(blob([(0, 120), (6, 128), (0, 138), (-6, 128)], 0.4), GLOW, T=T, shadow=0, side=False,
            decor='<path d="M -1 122 L 1 122 L 1 134 L -1 134 Z" fill="#FFFFFF" opacity="0.8"/>')
    fist(S, 0, 82, T=T)
    S.group("body")
    S.shape(SHOULDERS, "#3E4A58")
    for s in (-1, 1):
        S.shape(ell(100 + s * 54, 104, 24, 26), BRASS, shadow=3,
                decor="".join(f'<circle cx="{100 + s * 54 + dx}" cy="{y}" r="2.6" fill="#8A6424"/>' for dx, y in ((-10, 90), (12, 92), (-14, 112), (12, 118)))
                      + strokes(f"M {100 + s * 54 - 18} 100 C {100 + s * 54 - 6} 94 {100 + s * 54 + 8} 96 {100 + s * 54 + 18} 104", "#FFE08A", 3, 0.6))
    S.shape("M 136 78 L 150 82 L 72 142 L 56 138 Z", "#6A4A30", shadow=2)
    S.head()
    hood = ("M 48 120 C 40 76 60 40 100 36 C 140 40 160 76 152 120 C 144 106 134 98 124 96 C 116 94 108 96 100 100 "
            "C 92 96 84 94 76 96 C 66 98 56 106 48 120 Z")
    S.shape(hood, TEAL, shadow=5, decor=f'<path d="{ell(82, 60, 20, 12)}" fill="#3A8E98" opacity="0.6"/>'
            + strokes("M 52 112 C 62 100 76 96 100 100 C 124 96 138 100 148 112", BRASS, 6))
    S.shape("M 64 92 C 76 84 124 84 136 92 L 134 98 C 122 90 78 90 66 98 Z", BRASS, shadow=2)
    S.shape(blob([(100, 76), (108, 86), (100, 96), (92, 86)], 0.4), GLOW, shadow=2, side=False,
            decor='<path d="M 98 80 L 102 80 L 102 90 L 98 90 Z" fill="#FFFFFF" opacity="0.8"/>')
    mouth(S)
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6)
    return save_f("fighter-engineer-d", S)


# ================================================================== Beast tamers (the whip as its own part)
def whip(S, lash, handle_T, handle_col="#4A2E1C", lash_col="#6E4428", tip="#D9C7A0", knot=None):
    """arm-r: the handle and fist. Then #whip: the lash, pivot at the handle's tip."""
    S.group("arm-r", PR, "whip handle")
    S.shape(rr(0, 12, 10, 34, 4), handle_col, T=handle_T, shadow=0,
            decor=strokes("M -6 14 L 6 18 M -6 21 L 6 25 M -6 28 L 6 32", light(handle_col, 1.6), 2.5, 0.8))
    S.shape(circ(0, -12, 6.5), GOLD, T=handle_T, shadow=0)
    fist(S, 0, 0, T=handle_T, under=True)
    kx, ky = knot
    S.group("whip", (kx, ky), "the lash, its own part (pivot = handle tip)")
    S.raw(f'<path d="{lash}" fill="none" stroke="{lash_col}" stroke-width="7.5" stroke-linecap="round"/>'
          f'<path d="{lash}" fill="none" stroke="{light(lash_col, 1.5)}" stroke-width="3" stroke-linecap="round" opacity="0.5" transform="translate(-1 -1)"/>')
    ex, ey = [float(v) for v in lash.split()[-2:]]
    S.shape(blob([(ex, ey - 5), (ex - 10, ey - 2), (ex - 4, ey + 6)], 0.6), tip, shadow=0)


LASH = "M 160 163 C 160 182 140 194 118 192 C 96 190 88 172 104 166 C 120 160 130 176 120 188 C 112 198 90 202 70 198"
HT = frame(150, 134, 24)
KNOT = (160, 163)


def tamer_a():
    S = Sprite("FIGHTER Beast tamer A, the ringmaster (kept, hat fixed): the top hat now seen from above: a wide black "
               "brim and the round crown on it with a red band, no side view. Emerald tailcoat with gold frogging, "
               "sideburns and a waxed moustache. Beasts: tamer-a-lion.svg, tamer-a-bear.svg. " + WHIP_NOTE + " Left "
               "hand free (arm-l). " + LAYOUT)
    whip(S, LASH, HT, knot=KNOT)
    S.group("body")
    S.shape(SHOULDERS, "#2E8A5C",
            decor="".join(strokes(f"M {x} 100 L {x + 18} 100 M {x} 112 L {x + 18} 112 M {x} 124 L {x + 18} 124", GOLD, 4)
                          for x in (34, 148)))
    S.head()
    S.shape("M 50 118 C 48 104 52 96 60 94 L 64 120 Z", "#6B3F24", shadow=2)
    S.shape("M 150 118 C 152 104 148 96 140 94 L 136 120 Z", "#6B3F24", shadow=2)
    S.shape("M 100 126 C 92 120 80 120 72 118 C 78 126 88 130 100 130 C 112 130 122 126 128 118 C 120 120 108 120 100 126 Z",
            "#4A2E1C", shadow=2)
    S.shape(ell(100, 74, 62, 46), "#2E2836", shadow=5, decor=f'<path d="{ell(80, 62, 26, 14)}" fill="#4A4258" opacity="0.6"/>')
    S.shape(circ(100, 68, 33), "#C8342E", shadow=4)
    S.shape(circ(100, 64, 29), "#3A3446", shadow=0, decor=f'<path d="{ell(90, 54, 14, 9)}" fill="#5A5270" opacity="0.7"/>')
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6)
    return save_f("fighter-tamer-a", S)


def tamer_b():
    S = Sprite("FIGHTER Beast tamer B, the jungle beastmaster: a leopard's head worn as a hood (round ears, spots, the "
               "muzzle over the brow), the pelt down the back, darker skin, a necklace of fangs, a green sash. A "
               "plaited vine-green whip. Beasts: tamer-b-panther.svg, tamer-b-boar.svg. " + WHIP_NOTE + " Left hand "
               "free (arm-l). " + LAYOUT)
    S.add_def(DARK_SKIN)
    LEO, SPOT = "#E0A040", "#5A3A1E"
    spots = "".join(f'<path d="{ell(x, y, 5, 4)}" fill="{SPOT}" opacity="0.85"/>' for x, y in
                    ((70, 60), (90, 50), (112, 52), (130, 64), (78, 78), (100, 70), (122, 82), (62, 92), (138, 96), (100, 30), (84, 26), (118, 30)))
    S.group("back", (100, 60), "the pelt down the back")
    S.shape(blob([(64, 70), (60, 30), (76, 4), (100, -2), (124, 4), (140, 30), (136, 70)], 0.85), LEO, shadow=0, decor=spots)
    whip(S, LASH, HT, handle_col="#5A4024", lash_col="#5E7A34", tip="#A8C46A", knot=KNOT)
    S.group("body")
    S.shape(SHOULDERS, "#9A6A44", decor=strokes("M 132 78 L 64 140", "#3E7A44", 12, 0.95))
    for i, x in enumerate(range(72, 132, 10)):
        y = 132 + 6 * math.sin(math.pi * (x - 72) / 60)
        S.shape(f"M {x - 3} {f(y)} L {x + 3} {f(y)} L {x} {f(y + 10)} Z", "#F4EEDC", shadow=1, side=False)
    S.head(face="url(#gFaceD)", ear=("#9C6A4A", "#7E5236"))
    for s in (-1, 1):
        S.shape(circ(100 + s * 40, 52, 13), LEO, shadow=3, decor=f'<path d="{circ(100 + s * 40, 54, 6)}" fill="#B07A3A"/>')
    hood = "M 50 112 C 44 70 66 44 100 44 C 134 44 156 70 150 112 C 140 102 124 96 112 96 L 100 104 L 88 96 C 76 96 60 102 50 112 Z"
    S.shape(hood, LEO, shadow=4, decor=spots)
    S.shape(blob([(84, 92), (100, 88), (116, 92), (112, 106), (100, 110), (88, 106)], 0.8), "#F2DDB0", shadow=2,
            decor=f'<path d="{ell(100, 96, 6, 4)}" fill="#4A2A1E"/>')
    mouth(S, 137, "#7A4430")
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6, dark=True)
    return save_f("fighter-tamer-b", S)


def tamer_c():
    S = Sprite("FIGHTER Beast tamer C, the steppe rider: a tall red felt cap with a wide fur brim and a tassel, a blue "
               "quilted coat with a fur collar, long black hair in two braids behind, a drooping moustache. A long "
               "braided leather whip. Beasts: tamer-c-wolf.svg, tamer-c-sabretooth.svg. " + WHIP_NOTE + " Left hand "
               "free (arm-l). " + LAYOUT)
    S.group("back", (100, 60), "braids")
    for s in (-1, 1):
        S.shape(strip(curve((100 + s * 12, 60), (100 + s * 20, 30), (100 + s * 14, 4), 9), 6, 0.3, 4, (0.9, 1)), "#2A2430", shadow=0)
    whip(S, LASH, HT, handle_col="#4A2E1C", lash_col="#8A5A34", knot=KNOT)
    S.group("body")
    S.shape(SHOULDERS, "#3A5E9A", decor="".join(strokes(f"M {x} 84 L {x} 134", "#2E4A7E", 3, 0.6) for x in (40, 56, 144, 160)))
    S.shape(cloud(100, 106, 46, 16, 0.6), "#8E7A62", shadow=3)
    S.head()
    moustache(S, "#2A2430", 124, 0.85, 6)
    S.shape(cloud(100, 76, 52, 18, 0.66), "#8E7A62", shadow=5, T="translate(100 76) scale(1 0.86) translate(-100 -76)",
            decor=f'<path d="{ell(80, 64, 24, 12)}" fill="#B09A7E" opacity="0.6"/>')
    S.shape(blob([(70, 84), (66, 56), (78, 34), (100, 26), (122, 34), (134, 56), (130, 84), (100, 90)], 0.85), "#C8342E", shadow=4,
            decor=strokes("M 100 28 L 100 86 M 82 36 L 76 82 M 118 36 L 124 82", "#A82626", 3, 0.6)
                  + f'<path d="{ell(88, 46, 10, 8)}" fill="#E25A4A" opacity="0.6"/>')
    S.shape(circ(100, 48, 7), GOLD, shadow=2)
    S.shape(strip(curve((100, 48), (110, 30), (102, 12), 7), 4.5, 0, 1, (1, 1)), "#E25A4A", shadow=2)
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6)
    return save_f("fighter-tamer-c", S)


def tamer_d():
    S = Sprite("FIGHTER Beast tamer D, the drake keeper: a dungeon handler in black leather with a studded iron collar "
               "guard, a shaved head with a short dark crest and a scarred iron half-helm band, heavy gauntlets. A "
               "chain whip (iron links, a barbed tip). Beasts: tamer-d-drake.svg, tamer-d-beetle.svg. " + WHIP_NOTE
               + " Left hand free (arm-l). " + LAYOUT)
    glove = hand_grad(S, "gGlove", "#6A5A5A", "#3A3034")
    S.group("arm-r", PR, "whip handle")
    S.shape(rr(0, 12, 11, 34, 4), "#3A3034", T=HT, shadow=0)
    S.shape(circ(0, -12, 6.5), "#8E96A4", T=HT, shadow=0)
    fist(S, 0, 0, T=HT, under=True, hand=glove)
    S.group("whip", KNOT, "the chain lash, its own part (pivot = handle tip)")
    pts = [(160, 163), (158, 176), (148, 186), (134, 192), (118, 192), (104, 186), (98, 176), (106, 168), (118, 170),
           (122, 180), (114, 190), (100, 196), (84, 198), (70, 196)]
    for i, (x, y) in enumerate(pts):
        S.shape(ell(x, y, 5.5, 5.5) if i % 2 else rr(x, y, 9, 9, 3), "#8E96A4", shadow=0)
    S.shape("M 70 190 L 54 196 L 70 202 L 64 196 Z", "#C9D0DA", shadow=0)
    S.group("body")
    S.shape(SHOULDERS, "#2E2A30", decor="".join(f'<circle cx="{x}" cy="{y}" r="3" fill="#A9B2C0"/>'
                                                 for x, y in ((36, 100), (40, 116), (48, 128), (164, 100), (160, 116), (152, 128))))
    S.shape(blob([(52, 84), (100, 76), (148, 84), (150, 130), (100, 140), (50, 130)], 0.85), "#5E6474", shadow=3,
            decor="".join(f'<circle cx="{x}" cy="{y}" r="3" fill="#C9D0DA"/>' for x, y in ((60, 92), (80, 86), (120, 86), (140, 92))))
    S.head(face=grad_face(S, "gTan", ("#9A6A50", "#C08A68", "#DDA884", "#E0AC88", "#C8926C")))
    S.shape(blob([(90, 100), (88, 70), (92, 50), (100, 44), (108, 50), (112, 70), (110, 100)], 0.8), "#2A2026", shadow=3)
    band = "M 52 100 C 66 86 134 86 148 100 L 148 112 C 134 98 66 98 52 112 Z"
    S.shape(band, "#7E8696", shadow=3, decor="".join(f'<circle cx="{x}" cy="{f(y)}" r="2.6" fill="#C9D0DA"/>'
                                                     for x, y in ((62, 100), (80, 94), (120, 94), (138, 100))))
    S.raw(strokes("M 124 112 L 132 128", "#A86A58", 3, 0.8))
    mouth(S)
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 150, -6, hand=glove)
    return save_f("fighter-tamer-d", S)


# ================================================================== Beasts (top-down quadrupeds, front = +y)
BEAST_LAYOUT = ("A beast companion, about a hero's size, seen from above, head forward (+y). Parts: #back (tail, sways "
                "about its pivot), #body (torso, hind legs, head), #arm-l / #arm-r (front legs, swing to walk). "
                "No eyes (the designer cut eyes on the monsters). " + LAYOUT)


def legs_front(S, col, paw, y=150, spread=36, w=13, claws=None):
    for side, s in (("arm-l", -1), ("arm-r", 1)):
        x = 100 + s * spread
        S.group(side, (100 + s * 24, 116), "front leg")
        S.shape(rr(x, y - 12, w * 1.4, 34, w * 0.7), col, shadow=0)
        S.shape(ell(x, y + 6, w, w * 0.85), paw, shadow=3)
        if claws:
            for dx in (-6, 0, 6):
                S.shape(f"M {x + dx - 2} {y + 14} L {x + dx + 2} {y + 14} L {x + dx} {y + 21} Z", claws, shadow=0, side=False)


def hind(S, col, paw, y=56, spread=38, w=13):
    for s in (-1, 1):
        S.shape(ell(100 + s * (spread - 4), y + 10, w * 0.85, w * 1.8), col, shadow=0)
        S.shape(ell(100 + s * (spread - 2), y - 4, w * 0.75, w * 0.7), paw, shadow=0)


def lion():
    S = Sprite("BEAST Lion (tamer A): a tawny lion with a big russet mane round the head, a pale muzzle, a dark nose, "
               "a tufted tail; a red circus collar with a gold stud. " + BEAST_LAYOUT)
    BODY, MANE = "#D9A050", "#A8582A"
    S.group("back", (100, 46), "tail")
    S.shape(strip(curve((100, 46), (84, 20), (104, 0), 9), 5, 0, 1, (1, 1)), BODY, shadow=0)
    S.shape(circ(104, 0, 9), MANE, shadow=2)
    S.group("body")
    hind(S, BODY, "#C88A3E")
    S.shape(ell(100, 92, 40, 56), BODY, decor=strokes("M 100 44 L 100 120", "#B88038", 6, 0.5))
    S.shape(cloud(100, 140, 46, 16, 0.6), MANE, shadow=4, decor=f'<path d="{ell(86, 128, 24, 14)}" fill="#C8703E" opacity="0.6"/>')
    S.shape(rr(100, 116, 50, 9, 4), "#C8342E", shadow=2)
    S.shape(circ(100, 120, 5), GOLD, shadow=1)
    S.shape(circ(100, 146, 30), BODY, shadow=4)
    for s in (-1, 1):
        S.shape(circ(100 + s * 24, 124, 8), BODY, shadow=2, decor=f'<path d="{circ(100 + s * 24, 126, 4)}" fill="#8E5A2E"/>')
    S.shape(blob([(86, 154), (100, 150), (114, 154), (114, 172), (100, 180), (86, 172)], 0.85), "#F2DDB0", shadow=3)
    S.shape(ell(100, 160, 8, 6), "#5A3424", shadow=1, side=False)
    legs_front(S, BODY, "#E2AE60", 156, 40)
    return save_f("tamer-a-lion", S)


def bear():
    S = Sprite("BEAST Bear (tamer A): a big brown circus bear, round ears, a short light muzzle and dark nose, a "
               "stubby tail, a red-and-gold ruff collar. " + BEAST_LAYOUT)
    BODY = "#7A4E30"
    S.group("back", (100, 36), "stub tail")
    S.shape(circ(100, 34, 9), BODY, shadow=0)
    S.group("body")
    hind(S, BODY, "#6A422A", 52, 42, 16)
    S.shape(ell(100, 92, 50, 58), BODY, decor=f'<path d="{ell(86, 78, 26, 30)}" fill="#946240" opacity="0.6"/>')
    S.shape(blob(star(100, 122, 40, 30, 10, 18), 0.3), "#C8342E", shadow=3,
            decor="".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="3" fill="{GOLD}"/>' for x, y in star(100, 122, 36, 30, 10, 18)[::2]))
    S.shape(circ(100, 146, 32), BODY, shadow=4)
    for s in (-1, 1):
        S.shape(circ(100 + s * 26, 124, 10), BODY, shadow=2, decor=f'<path d="{circ(100 + s * 26, 126, 5)}" fill="#C89A72"/>')
    S.shape(ell(100, 164, 15, 13), "#C89A72", shadow=3)
    S.shape(ell(100, 170, 8, 6), "#2E2026", shadow=1, side=False)
    legs_front(S, BODY, "#6A422A", 156, 46, 15)
    return save_f("tamer-a-bear", S)


def panther():
    S = Sprite("BEAST Panther (tamer B): a lean black panther with a blue-grey sheen, pointed ears, a long curling tail, "
               "pale claws. " + BEAST_LAYOUT)
    BODY = "#34303E"
    S.group("back", (100, 40), "long tail")
    S.shape(strip(curve((100, 40), (70, 10), (98, -4), 11), 6, 0, 1, (1, 0.8)), BODY, shadow=0)
    S.group("body")
    hind(S, BODY, "#2A2632", 52, 30, 12)
    S.shape(ell(100, 90, 30, 56), BODY, decor=strokes("M 92 44 C 90 70 90 110 94 134", "#6A6888", 5, 0.6))
    S.shape(ell(100, 148, 25, 26), BODY, shadow=4, decor=strokes("M 90 132 C 88 140 88 150 90 158", "#6A6888", 4, 0.6))
    for s in (-1, 1):
        S.shape(blob([(100 + s * 10, 132), (100 + s * 28, 116), (100 + s * 26, 136)], 0.6), BODY, shadow=2)
    S.shape(blob([(90, 160), (100, 156), (110, 160), (108, 174), (100, 178), (92, 174)], 0.85), "#4A4656", shadow=3)
    S.shape(ell(100, 172, 6, 4.5), "#1E1A24", shadow=1, side=False)
    legs_front(S, BODY, "#2A2632", 152, 30, 11, claws="#E8E2D2")
    return save_f("tamer-b-panther", S)


def boar():
    S = Sprite("BEAST Boar (tamer B): a hulking dark boar with a bristly ridge down the spine, small ears, a flat pink-"
               "grey snout and two big curved white tusks. " + BEAST_LAYOUT)
    BODY = "#5E4A3E"
    S.group("back", (100, 38), "little tail")
    S.raw(strokes("M 100 40 C 92 30 108 24 100 16", BODY, 5))
    S.group("body")
    hind(S, BODY, "#3E302A", 52, 36, 13)
    S.shape(blob([(100, 34), (138, 54), (146, 96), (136, 132), (100, 142), (64, 132), (54, 96), (62, 54)], 0.9), BODY,
            decor=f'<path d="{ell(84, 76, 20, 26)}" fill="#7A6454" opacity="0.6"/>')
    S.shape(blob([(100, 30), (108, 50), (106, 90), (110, 130), (100, 146), (90, 130), (94, 90), (92, 50)], 0.7), "#2E2420", shadow=3,
            decor="".join(strokes(f"M 92 {y} L 108 {y + 4}", "#5A4A40", 2.5, 0.7) for y in range(40, 140, 9)))
    S.shape(ell(100, 150, 30, 26), BODY, shadow=4)
    for s in (-1, 1):
        S.shape(blob([(100 + s * 14, 134), (100 + s * 32, 126), (100 + s * 28, 142)], 0.6), BODY, shadow=2)
    S.shape(ell(100, 172, 17, 12), "#B08A86", shadow=3,
            decor='<ellipse cx="94" cy="172" rx="3" ry="4" fill="#5A3A3A"/><ellipse cx="106" cy="172" rx="3" ry="4" fill="#5A3A3A"/>')
    for s in (-1, 1):
        S.shape(f"M {100 + s * 14} 164 C {100 + s * 28} 168 {100 + s * 32} 182 {100 + s * 24} 192 C {100 + s * 26} 182 "
                f"{100 + s * 20} 172 {100 + s * 12} 170 Z", "#F4EEDC", shadow=2)
    legs_front(S, BODY, "#3E302A", 150, 38, 12)
    return save_f("tamer-b-boar", S)


def wolf():
    S = Sprite("BEAST Wolf (tamer C): a big grey steppe wolf, a pale throat and muzzle, pointed ears, a thick ruff, "
               "a bushy tail with a dark tip. " + BEAST_LAYOUT)
    BODY, PALE = "#8A8E9A", "#D8D8DE"
    S.group("back", (100, 40), "bushy tail")
    S.shape(strip(curve((100, 40), (110, 18), (100, -2), 9), 11, 0, 1, (0.7, 1)), BODY, shadow=0,
            decor=f'<path d="{ell(100, 0, 10, 10)}" fill="#3E4250"/>')
    S.group("body")
    hind(S, BODY, "#6E7280", 52, 30, 12)
    S.shape(ell(100, 90, 32, 54), BODY, decor=strokes("M 100 40 L 100 120", "#5E6270", 8, 0.5))
    S.shape(cloud(100, 128, 34, 14, 0.6), BODY, shadow=3)
    for s in (-1, 1):
        S.shape(blob([(100 + s * 8, 130), (100 + s * 28, 110), (100 + s * 26, 136)], 0.55), BODY, shadow=2,
                decor=f'<path d="{ell(100 + s * 22, 124, 3, 7)}" fill="#5E6270"/>')
    S.shape(ell(100, 140, 22, 20), BODY, shadow=4)
    S.shape(blob([(88, 146), (100, 142), (112, 146), (110, 172), (100, 182), (90, 172)], 0.85), PALE, shadow=3)
    S.shape(ell(100, 178, 7, 5.5), "#2E2836", shadow=1, side=False)
    legs_front(S, BODY, "#6E7280", 154, 30, 11)
    return save_f("tamer-c-wolf", S)


def sabretooth():
    S = Sprite("BEAST Sabre-tooth (tamer C): a heavy sand-coloured cat with faint dark stripes, a short tail, a broad "
               "head and two long white sabre fangs hanging forward. " + BEAST_LAYOUT)
    BODY, ST = "#C8A06A", "#7A5A3A"
    S.group("back", (100, 40), "short tail")
    S.shape(strip(curve((100, 40), (106, 28), (100, 16), 7), 6, 0, 1, (1, 1)), BODY, shadow=0)
    S.group("body")
    hind(S, BODY, "#A88050", 52, 38, 14)
    S.shape(ell(100, 92, 42, 56), BODY,
            decor="".join(strokes(f"M {100 + s * w} {y} L {100 + s * (w - 12)} {y + 4}", ST, 4, 0.6)
                          for y, w in ((60, 30), (76, 38), (92, 40), (108, 38)) for s in (-1, 1)))
    S.shape(ell(100, 142, 32, 28), BODY, shadow=4, decor=strokes("M 100 118 L 100 130 M 86 122 L 90 132 M 114 122 L 110 132", ST, 4, 0.7))
    for s in (-1, 1):
        S.shape(circ(100 + s * 26, 124, 8), BODY, shadow=2, decor=f'<path d="{circ(100 + s * 26, 126, 4)}" fill="{ST}"/>')
    S.shape(ell(100, 160, 18, 13), "#F0DEB8", shadow=3)
    S.shape(ell(100, 156, 7, 5), "#4A3024", shadow=1, side=False)
    for s in (-1, 1):
        S.shape(f"M {100 + s * 8} 166 L {100 + s * 15} 166 C {100 + s * 15} 178 {100 + s * 12} 188 {100 + s * 9} 194 "
                f"C {100 + s * 8} 186 {100 + s * 8} 176 {100 + s * 8} 166 Z", "#F8F4EA", shadow=2)
    legs_front(S, BODY, "#A88050", 154, 40, 14)
    return save_f("tamer-c-sabretooth", S)


def drake():
    S = Sprite("BEAST Drake (tamer D): a small red dragon, wings folded along its back, a pale belly-scale stripe, "
               "two swept-back horns, a long tail ending in a spade; claws. " + BEAST_LAYOUT)
    BODY, DK = "#C8402E", "#8E2A22"
    S.group("back", (100, 46), "tail with a spade")
    S.shape(strip(curve((100, 46), (130, 20), (104, -2), 11), 9, 0, 1, (1, 0.6)), BODY, shadow=0)
    S.shape(blob([(104, -6), (116, 2), (104, 10), (92, 2)], 0.5), DK, shadow=2)
    S.group("body")
    hind(S, BODY, DK, 54, 30, 12)
    S.shape(ell(100, 92, 30, 50), BODY, decor=strokes("M 100 46 L 100 136", "#F2B060", 10, 0.6))
    for s in (-1, 1):
        wing = blob([(100 + s * 10, 112), (100 + s * 48, 96), (100 + s * 58, 62), (100 + s * 42, 40), (100 + s * 34, 60),
                     (100 + s * 22, 52), (100 + s * 16, 70), (100 + s * 8, 70)], 0.5)
        S.shape(wing, DK, shadow=3, decor=strokes(f"M {100 + s * 12} 100 L {100 + s * 50} 62 M {100 + s * 12} 100 L {100 + s * 34} 58",
                                                  "#5E1A16", 3, 0.7))
    S.shape(blob([(100, 118), (122, 130), (120, 158), (100, 182), (80, 158), (78, 130)], 0.85), BODY, shadow=4,
            decor=strokes("M 100 124 L 100 170", "#E86A4A", 5, 0.6))
    for s in (-1, 1):
        S.shape(f"M {100 + s * 12} 126 C {100 + s * 24} 116 {100 + s * 30} 102 {100 + s * 30} 92 C {100 + s * 22} 104 "
                f"{100 + s * 16} 112 {100 + s * 6} 120 Z", "#F2DDB0", shadow=2)
    S.shape(ell(100, 176, 8, 5), "#5E1A16", shadow=1, side=False)
    legs_front(S, BODY, DK, 148, 34, 11, claws="#F4EEDC")
    return save_f("tamer-d-drake", S)


def beetle():
    S = Sprite("BEAST Rhinoceros beetle (tamer D): a huge dungeon beetle with a glossy green-black shell split down "
               "the middle, a big curved horn forward, six legs (the front pair in the arm parts). " + BEAST_LAYOUT)
    SHELL, LEG = "#2E4A3E", "#2A2026"
    S.group("body")
    for s in (-1, 1):
        for y, ex in ((62, 60), (100, 66)):
            S.shape(band([(100 + s * 20, y), (100 + s * ex * 0.7, y - 8), (100 + s * ex, y + 6)], 4.5), LEG, shadow=0)
    S.shape(ell(100, 80, 46, 58), SHELL,
            decor=strokes("M 100 22 L 100 138", "#16241E", 4) + f'<path d="{ell(80, 64, 12, 30)}" fill="#6A9A82" opacity="0.5"/>'
                  f'<path d="{ell(120, 64, 8, 24)}" fill="#6A9A82" opacity="0.25"/>')
    S.shape(ell(100, 138, 36, 22), "#24382E", shadow=4, decor=f'<path d="{ell(88, 132, 12, 6)}" fill="#6A9A82" opacity="0.5"/>')
    S.shape(ell(100, 160, 22, 12), "#1E2C24", shadow=3)
    S.shape("M 92 162 C 92 176 96 186 100 196 C 106 188 110 176 108 162 Z", "#3A4A40", shadow=3,
            decor=strokes("M 98 166 C 98 178 100 186 100 192", "#7AA28E", 3, 0.6))
    for side, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(side, (100 + s * 26, 140), "front leg")
        S.shape(band([(100 + s * 26, 140), (100 + s * 52, 152), (100 + s * 50, 176)], 4.5), LEG, shadow=0)
        S.shape(ell(100 + s * 50, 178, 5, 6), LEG, shadow=0)
    return save_f("tamer-d-beetle", S)


DESIGNS = {"engineer-a": engineer_a, "engineer-b": engineer_b, "engineer-c": engineer_c, "engineer-d": engineer_d,
           "tamer-a": tamer_a, "tamer-b": tamer_b, "tamer-c": tamer_c, "tamer-d": tamer_d,
           "lion": lion, "bear": bear, "panther": panther, "boar": boar, "wolf": wolf, "sabretooth": sabretooth,
           "drake": drake, "beetle": beetle}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(DESIGNS):
        print(DESIGNS[n]())
