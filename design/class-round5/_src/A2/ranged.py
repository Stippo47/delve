"""A2 round 5, ranged heroes. Run: python ranged.py [name ...]  -> ../../ranged/ranged-<name>.svg"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *

HAIR = "#3E2A26"


def save_r(name, S):
    return save("ranged", f"ranged-{name}", S)


# ------------------------------------------------------------------ Crossbowman
def crossbowman():
    S = Sprite("RANGED Crossbowman (round 5): steel kettle hat built on the farmers' hat (brim, crown pushed back, "
               "leather band with rivets, a low comb down the crown), slate gambeson, tall pavise on the back. Heavy "
               "crossbow held in front with both fists on the stock (all in arm-r, arm-l left out). " + LAYOUT)
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
    k = scl(0.9, dy=4)
    S.shape(BRIM, "#AEB6C3", T=k, shadow=5,
            decor=f'<path d="{ell(84, 56, 40, 22)}" fill="#C9D0DA" opacity="0.55"/>')
    S.shape(CROWN, "#C3CAD5", T=k, shadow=4,
            decor='<path d="M 96 20 H 104 V 84 H 96 Z" fill="#E8ECF2" opacity="0.85"/>'
                  f'<path d="{ell(84, 42, 14, 9)}" fill="#EEF1F5" opacity="0.6"/>')
    mouth(S, 139)
    return save_r("crossbowman", S)


# ------------------------------------------------------------------ Falconer
def falconer():
    S = Sprite("RANGED Falconer (round 5): the rust beret now sits centred on the head (the feather gives the "
               "tilt), leather jerkin over green. A slate-grey falcon on the gauntlet of the raised left fist "
               "(arm-l, drawn after #body so the bird sits on top); right hand free. " + LAYOUT)
    S.group("body")
    S.shape(SHOULDERS, "#6B4A33")
    S.shape(blob([(64, 84), (100, 80), (136, 84), (132, 140), (100, 146), (68, 140)], 0.8), "#4E7A62", shadow=3)
    head(S)
    S.shape(blob([(56, 100), (52, 72), (66, 50), (100, 42), (134, 50), (148, 72), (144, 100), (100, 104)], 0.85),
            "#5A3A26", shadow=4)
    S.shape(ell(100, 68, 58, 42), "#C0532F", shadow=4,
            decor=f'<path d="{ell(88, 58, 32, 20)}" fill="#D96B44" opacity="0.6"/>'
                  '<path d="M 44 86 C 70 104 130 104 156 86 L 160 120 L 40 120 Z" fill="#9E3E22" opacity="0.7"/>')
    S.shape(circ(100, 64, 6), "#A8442A", shadow=2)
    S.shape(strip(curve((130, 56), (152, 34), (150, -2), 11), 7.5, 0, 1, (0.45, 1)), "#E2C89A", shadow=3,
            decor='<path d="M 130 56 Q 152 34 150 -2" stroke="#8A6A40" stroke-width="2.5" fill="none"/>'
                  '<path d="M 138 2 L 162 2 L 160 14 L 140 14 Z" fill="#6A4A2C"/>')
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
    return save_r("falconer", S)


# ------------------------------------------------------------------ Grenadier
MOUSTACHE_G = ("M 100 124 C 92 118 80 118 72 124 C 66 128 62 126 60 120 C 62 132 74 136 86 132 C 92 130 98 130 100 128 "
               "C 102 130 108 130 114 132 C 126 136 138 132 140 120 C 138 126 134 128 128 124 C 120 118 108 118 100 124 Z")


def bomb(S, x, y, r, fuse=True, lit=False, T=""):
    S.shape(circ(x, y, r), "#3A3440", shadow=2, T=T,
            decor=f'<path d="{circ(x - r * 0.35, y - r * 0.35, r * 0.36)}" fill="#8A8494" opacity="0.8"/>')
    if fuse:
        S.shape(rr(x + r * 0.45, y - r * 0.8, r * 0.5, r * 0.45, 1.5), "#8A8494", shadow=0, T=T)


def grenadier():
    S = Sprite("RANGED Grenadier (round 5; the moustache and the bomb kept): a tall blue grenadier's mitre cap seen "
               "from above, its brass front plate stamped with a flaming bomb and a red tuft on top; a red coat with "
               "white crossbelts and a bandolier of little bombs over the left shoulder; the big handlebar moustache. "
               "A lit bomb cupped in the right hand (arm-r, drawn before #body), left hand free (arm-l). " + LAYOUT)
    S.group("arm-r", PR, "bomb with a lit fuse")
    fist(S, 150, 148, -6)
    S.shape(circ(154, 174, 17), "#3A3440", shadow=3,
            decor=f'<path d="{circ(148, 168, 6)}" fill="#8A8494" opacity="0.8"/>')
    S.shape(rr(160, 158, 8, 7, 2), "#8A8494", shadow=0)
    S.raw('<path d="M 162 156 Q 170 150 168 144" stroke="#7A5A3A" stroke-width="3" fill="none" stroke-linecap="round"/>')
    S.shape(blob(star(169, 141, 9, 4, 6, 10), 0.2), "#FFB03A", shadow=0, side=False,
            decor=f'<path d="{circ(169, 141, 3.5)}" fill="#FFF3B0"/>')
    S.group("body")
    S.shape(SHOULDERS, "#B8343A",
            decor='<path d="M 40 84 L 56 80 L 150 138 L 132 140 Z M 160 84 L 144 80 L 50 138 L 68 140 Z" fill="#F1ECE2"/>')
    # bandolier of bombs over the left shoulder
    for x, y in ((36, 112), (44, 96), (56, 86)):
        S.shape(circ(x, y, 8.5), "#3A3440", shadow=2,
                decor=f'<path d="{circ(x - 3, y - 3, 3)}" fill="#8A8494" opacity="0.8"/>')
    head(S)
    S.shape(blob([(52, 108), (52, 74), (68, 50), (100, 40), (132, 50), (148, 74), (148, 108), (100, 100)], 0.85),
            "#2E4A86", shadow=4, decor=f'<path d="{ell(80, 62, 16, 10)}" fill="#4A6AAE" opacity="0.6"/>')
    S.shape("M 52 98 C 70 88 130 88 148 98 L 148 110 C 130 100 70 100 52 110 Z", "#EFE6D2", shadow=2)
    plate = "M 68 98 C 66 72 78 50 100 36 C 122 50 134 72 132 98 C 118 92 82 92 68 98 Z"
    S.shape(plate, "#E9B243", shadow=4,
            decor=f'<path d="{ell(86, 66, 12, 18)}" fill="#FFE08A" opacity="0.6"/>')
    bomb(S, 100, 78, 9, fuse=False)
    S.shape(blob([(95, 70), (98, 58), (102, 62), (106, 54), (106, 68)], 0.4), "#E8562A", shadow=0, side=False)
    S.shape(cloud(100, 34, 10, 7, 0.75), "#C8323A", shadow=3)
    S.shape(MOUSTACHE_G, "#8A5230", shadow=2)
    S.group("arm-l", PL, "free hand")
    fist(S, 52, 148, -8)
    return save_r("grenadier", S)


# ------------------------------------------------------------------ Harpooner
def harpooner():
    S = Sprite("RANGED Harpooner (round 5): the beard that read as a nose is gone; a big puffy grey moustache instead; "
               "a proper yellow sou'wester built like the farmers' hat (short brim in front, long flap behind, low "
               "crown, stitching rings); navy knit sweater. A barbed harpoon in the right hand (arm-r, drawn before "
               "#body) with its rope tied to the shaft, and a coil of rope in the left hand (arm-l). " + LAYOUT)
    S.group("arm-r", PR, "harpoon (its rope end is tied on, so it moves with it)")
    T = frame(165, 25, 7)
    S.shape(rr(0, 64, 9, 132, 4.5), "#A87444", T=T, shadow=0)
    S.shape(rr(0, 136, 6, 34, 3), DSTEEL, T=T, shadow=0)
    S.shape("M 0 178 L -17 146 L -6 150 L -5 138 L 5 138 L 6 150 L 17 146 Z", STEEL, T=T, shadow=0,
            decor='<path d="M -1.5 140 L 0 176 L 1.5 140 Z" fill="#F4F6F9" opacity="0.8"/>')
    S.shape(rr(0, 126, 12, 7, 2.5), "#D8C08A", T=T, shadow=0)
    S.raw(f'<path d="M -4 126 C -16 132 -22 120 -30 128" transform="{T}" stroke="#D8C08A" stroke-width="4" '
          'fill="none" stroke-linecap="round"/>')
    fist(S, 0, 112, T=T)
    S.group("body")
    S.shape(SHOULDERS, "#2F4560",
            decor='<path d="M 40 90 V 132 M 56 82 V 138 M 144 82 V 138 M 160 90 V 132" stroke="#3E5878" stroke-width="5" opacity="0.6"/>')
    head(S)
    moustache(S, "#CFCBC6", 124)
    brim = blob([(36, 96), (28, 64), (36, 32), (60, 10), (100, 2), (140, 10), (164, 32), (172, 64), (164, 96),
                 (134, 108), (100, 112), (66, 108)], 0.85)
    S.shape(brim, "#E6B42A", shadow=5,
            decor=strokes("M 42 94 C 34 62 48 22 100 14 C 152 22 166 62 158 94 C 140 104 60 104 42 94",
                          "#B88418", 3, 0.75))
    S.shape(ell(100, 60, 36, 31), "#F0C238", shadow=4, sop=0.3,
            decor=f'<path d="{ell(84, 46, 16, 10)}" fill="#FBE07A" opacity="0.6"/>'
                  + strokes("M 100 30 V 90", "#D9A426", 3, 0.5))
    S.group("arm-l", PL, "rope coil")
    S.raw('<path d="M 62 176 C 74 194 92 192 96 180" stroke="#D8C08A" stroke-width="4" fill="none" stroke-linecap="round"/>')
    S.shape(circ(54, 166, 18), "#D8C08A", shadow=3,
            decor=f'<path d="{circ(54, 166, 9)}" fill="#8E7A50"/>'
                  f'<path d="{circ(54, 166, 13.5)}" fill="none" stroke="#B8A06A" stroke-width="2"/>')
    fist(S, 52, 148, 78)
    return save_r("harpooner", S)


# ------------------------------------------------------------------ Javelin huntress
def huntress():
    S = Sprite("RANGED Javelin huntress (round 5): the ponytail now runs straight back from the crown; a better "
               "headband: a wide coral band woven with a gold zigzag, a gold bead at each temple and tie-ends trailing "
               "behind. Darker skin, long dark hair over the shoulders, spotted pelt, spare javelins on the back. A "
               "javelin in the right hand (arm-r, drawn before #body), left hand free. " + LAYOUT)
    S.add_def(DARK_SKIN)
    S.group("back", (100, 50), "ponytail straight back + spare javelins")
    for (x, y, a) in ((150, 24, 202), (166, 36, 216)):
        T = frame(x, y, a)
        S.shape(rr(0, -40, 6, 110, 3), "#9A6A3E", T=T, shadow=0)
        S.shape("M 0 18 C -8 6 -7 -6 0 -14 C 7 -6 8 6 0 18 Z", STEEL, T=T, shadow=0)
    tail = blob([(88, 52), (84, 34), (86, 16), (92, 2), (100, -6), (108, 2), (114, 16), (116, 34), (112, 52)], 0.9)
    S.shape(tail, HAIR, shadow=0,
            decor=strokes("M 96 50 C 94 30 96 12 100 -2 M 104 50 C 106 30 104 12 100 -2", "#6A4A40", 3, 0.7))
    S.shape(rr(100, 44, 30, 12, 5), "#E4604A", shadow=2,
            decor=strokes("M 86 44 L 92 40 L 98 48 L 104 40 L 110 48 L 116 42", GOLD, 2.5))
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
    hb = "M 50 94 C 66 82 134 82 150 94 L 151 107 C 134 95 66 95 49 107 Z"
    S.shape(hb, "#E4604A", shadow=2,
            decor=strokes("M 54 99 L 62 92 L 70 97 L 78 90 L 86 95 L 94 89 L 100 94 L 106 89 L 114 95 L 122 90 L 130 97 "
                          "L 138 92 L 146 99", GOLD, 3))
    for x in (50, 150):
        S.shape(circ(x, 112, 6), GOLD, shadow=2, decor=f'<circle cx="{x - 2}" cy="110" r="2" fill="#FFF1B8"/>')
    mouth(S, 137, "#7A4430")
    S.group("arm-l", PL, "free hand, raised to aim")
    fist(S, 50, 150, -14, dark=True)
    return save_r("javelin-huntress", S)


# ------------------------------------------------------------------ Marksman x4
def plume(S, base, mid, tip, w=13, col="#F7F0DE", dk="#DCCDAA"):
    out, half = feather(curve(base, mid, tip, 17), w, (0.5, 0.75), 0.5)
    S.shape(out, col, shadow=3, decor=f'<path d="{half}" fill="{dk}"/>')


def marksman_a():
    S = Sprite("RANGED Marksman A, the musketeer: wide teal cavalier hat pinned up on the left with the big cream "
               "plume sweeping back, crimson coat with a gold crossbelt, white cravat. A long musket at the right "
               "shoulder (arm-r, drawn after #body so all of it shows), both fists on it, the barrel well out in "
               "front. arm-l left out. " + LAYOUT)
    S.group("body")
    S.shape(SHOULDERS, "#A8323A", decor='<path d="M 40 86 L 54 82 L 150 140 L 132 140 Z" fill="#F2B53A"/>')
    S.shape(blob([(84, 132), (100, 126), (116, 132), (112, 152), (100, 160), (88, 152)], 0.9), "#F1ECE2", shadow=3)
    head(S)
    S.shape(ell(100, 64, 68, 50), "#2C7A7B", shadow=5,
            decor=f'<path d="{ell(100, 60, 56, 38)}" fill="#3A9192" opacity="0.5"/>')
    S.shape("M 34 70 C 30 40 52 16 84 12 C 60 26 48 48 50 78 Z", "#246668", shadow=3)
    S.shape(circ(102, 62, 30), "#246668", shadow=4,
            decor=f'<path d="{ell(90, 50, 12, 8)}" fill="#3E9C9C" opacity="0.7"/>'
                  '<path d="M 66 74 C 82 84 122 84 138 74 L 138 96 L 66 96 Z" fill="#1E3E40" opacity="0.8"/>')
    plume(S, (118, 86), (172, 72), (164, -4))
    mouth(S)
    S.group("arm-r", PR, "musket, both hands (arm-l left out)")
    gun(S, frame(160, 90, 4), "#9A6034", "#A9B2C0", BRASS)
    return save_r("marksman-a", S)


def marksman_b():
    S = Sprite("RANGED Marksman B, the alpine hunter: a green felt hunting hat with a narrow brim, a pinched crown and "
               "a cord band, the cream plume tucked in the band and swept back; grey-green loden jacket with a dark "
               "collar. A hunting rifle with a brass scope at the right shoulder (arm-r, after #body), both fists on "
               "it. arm-l left out. " + LAYOUT)
    S.group("body")
    S.shape(SHOULDERS, "#6E7E5A", decor=strokes("M 60 84 C 80 96 120 96 140 84", "#3E4A34", 10, 0.9))
    head(S)
    S.shape(blob([(54, 104), (52, 76), (66, 54), (100, 46), (134, 54), (148, 76), (146, 104), (100, 100)], 0.85),
            "#7A5232", shadow=4)
    S.shape(ell(100, 70, 54, 40), "#3F6B44", shadow=5,
            decor=f'<path d="{ell(90, 64, 40, 26)}" fill="#4E7E52" opacity="0.5"/>')
    crown = blob([(70, 76), (66, 52), (80, 34), (100, 30), (120, 34), (134, 52), (130, 76), (100, 84)], 0.85)
    S.shape(crown, "#4C7E50", shadow=4,
            decor=strokes("M 100 32 V 78", "#2E5232", 6, 0.8) + f'<path d="{ell(84, 48, 9, 12)}" fill="#6A9A6A" opacity="0.6"/>')
    S.shape("M 68 74 C 80 86 120 86 132 74 L 131 82 C 120 94 80 94 69 82 Z", "#2E3A2C", shadow=2)
    plume(S, (124, 80), (160, 60), (150, 0), 11)
    S.shape(blob([(118, 74), (130, 70), (132, 82), (120, 86)], 0.8), "#6E5A3E", shadow=2)
    mouth(S)
    S.group("arm-r", PR, "scoped hunting rifle, both hands (arm-l left out)")
    gun(S, frame(160, 90, 4), "#6A3E24", "#7E8592", None, scope="#C99A3A", front=94)
    return save_r("marksman-b", S)


def marksman_c():
    S = Sprite("RANGED Marksman C, the frontier rifleman: a brown wide-brim hat with the sides curled up and a dented "
               "crown, the cream plume in the hatband; a red neckerchief, a tan duster. A lever rifle with a brass "
               "frame at the right shoulder (arm-r, after #body), both fists on it. arm-l left out. " + LAYOUT)
    S.group("body")
    S.shape(SHOULDERS, "#C49A62", decor=strokes("M 34 100 C 60 92 140 92 166 100", "#A47A44", 5, 0.7))
    S.shape(blob([(78, 130), (100, 124), (122, 130), (114, 152), (100, 158), (86, 152)], 0.9), "#C2402E", shadow=3)
    head(S)
    brim = blob([(30, 84), (24, 60), (36, 32), (64, 16), (100, 12), (136, 16), (164, 32), (176, 60), (170, 84),
                 (150, 74), (130, 98), (100, 104), (70, 98), (50, 74)], 0.8)
    S.shape(brim, "#8A5A34", shadow=5,
            decor=f'<path d="{ell(80, 34, 30, 14)}" fill="#A6744A" opacity="0.6"/>'
                  + strokes("M 32 80 C 30 60 40 40 60 28 M 168 80 C 170 60 160 40 140 28", "#6A4024", 4, 0.6))
    crown = blob([(68, 76), (64, 50), (78, 30), (100, 24), (122, 30), (136, 50), (132, 76), (100, 84)], 0.85)
    S.shape(crown, "#9C6A3E", shadow=4,
            decor=strokes("M 100 30 C 96 44 96 58 100 72", "#6A4024", 5, 0.7)
                  + f'<path d="{ell(84, 42, 9, 12)}" fill="#B88252" opacity="0.6"/>')
    S.shape("M 66 70 C 80 84 120 84 134 70 L 133 79 C 120 92 80 92 67 79 Z", "#4A2E1C", shadow=2)
    plume(S, (126, 80), (166, 64), (160, 4), 11)
    mouth(S)
    S.group("arm-r", PR, "lever rifle, both hands (arm-l left out)")
    T = frame(160, 90, 4)
    gun(S, T, "#8A5530", "#5A5E6C", None, receiver=BRASS)
    S.raw(f'<path d="M 5 50 C 16 52 16 66 5 66" transform="{T}" stroke="{BRASS}" stroke-width="3.5" fill="none"/>')
    return save_r("marksman-c", S)


def marksman_d():
    S = Sprite("RANGED Marksman D, the rifle officer: a black bicorne worn side to side with a gold edge, a blue "
               "cockade and the cream plume standing up from it; a dark blue coat with white crossbelts. A long rifle "
               "with a steel scope at the right shoulder (arm-r, after #body), both fists on it. arm-l left out. "
               + LAYOUT)
    S.group("body")
    S.shape(SHOULDERS, "#2E3E6A",
            decor='<path d="M 40 84 L 56 80 L 150 138 L 132 140 Z M 160 84 L 144 80 L 50 138 L 68 140 Z" fill="#F1ECE2"/>')
    head(S)
    S.shape(blob([(54, 104), (52, 76), (66, 54), (100, 46), (134, 54), (148, 76), (146, 104), (100, 100)], 0.85),
            "#B9B2A6", shadow=4)
    bic = ("M 14 82 C 20 66 40 54 66 50 C 80 30 120 30 134 50 C 160 54 180 66 186 82 C 160 86 130 96 100 98 "
           "C 70 96 40 86 14 82 Z")
    S.shape(bic, "#2B2530", shadow=5,
            decor=f'<path d="{bic}" fill="none" stroke="{GOLD}" stroke-width="8"/>'
                  '<path d="M 70 52 C 86 40 114 40 130 52 C 116 48 84 48 70 52 Z" fill="#4A4250"/>')
    S.shape(circ(64, 74, 10), "#3A5AA8", shadow=2, decor='<circle cx="64" cy="74" r="4" fill="#F1ECE2"/>')
    plume(S, (64, 66), (40, 40), (52, -2), 12)
    mouth(S)
    S.group("arm-r", PR, "scoped long rifle, both hands (arm-l left out)")
    gun(S, frame(160, 90, 4), "#5A3420", "#8E96A4", "#C9D0DA", scope="#5E6474", front=94)
    return save_r("marksman-d", S)


# ------------------------------------------------------------------ Ninja
def ninja():
    S = Sprite("RANGED Ninja (round 5): charcoal hood and mask; the lower face covering now curves up in the middle "
               "(over the nose), so the face shows as a slit dipping at the centre; two crimson scarf tails behind; "
               "no katana. A big shuriken pinched in each hand (arm-l, arm-r, drawn before #body). " + LAYOUT)
    S.group("back", (100, 50), "scarf tails")
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
    S.shape(blob([(48, 112), (46, 84), (60, 56), (100, 42), (140, 56), (154, 84), (152, 112), (128, 104), (100, 102),
                  (72, 104)], 0.85), "#3D3946", shadow=4,
            decor=f'<path d="{ell(84, 64, 22, 12)}" fill="#55505F" opacity="0.6"/>')
    S.shape(blob([(50, 120), (64, 124), (80, 124), (92, 120), (100, 113), (108, 120), (120, 124), (136, 124), (150, 120),
                  (144, 142), (122, 154), (100, 158), (78, 154), (56, 142)], 0.8), "#34303C", shadow=3,
            decor=strokes("M 72 132 C 86 128 94 124 100 118 C 106 124 114 128 128 132", "#4A4554", 3, 0.7))
    S.shape(circ(100, 48, 9), "#B02A33", shadow=2)
    return save_r("ninja", S)


# ------------------------------------------------------------------ Pirate
def pirate():
    S = Sprite("RANGED Pirate (round 5): the beard no longer makes a nose and a smile; a separate puffy black "
               "moustache like the harpooner's over a short chin beard. Black tricorn with gold edging, burgundy coat "
               "with gold epaulettes; cutlass in the left hand, flintlock in the right, both arms before #body. "
               + LAYOUT)
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
    S.shape(blob([(80, 138), (92, 134), (100, 136), (108, 134), (120, 138), (116, 152), (100, 160), (84, 152)], 0.8),
            "#2E2830", shadow=3)
    moustache(S, "#2E2830", 126, 0.95, 2)
    hat = ("M 100 112 C 92 98 74 82 44 72 C 30 66 24 56 30 46 C 52 52 76 40 100 40 C 124 40 148 52 170 46 "
           "C 176 56 170 66 156 72 C 126 82 108 98 100 112 Z")
    S.shape(hat, "#2B2530", shadow=5,
            decor=f'<path d="{hat}" fill="none" stroke="{GOLD}" stroke-width="9"/>')
    S.shape(circ(100, 62, 24), "#3A3340", shadow=3)
    return save_r("pirate", S)


# ------------------------------------------------------------------ Slinger
def slinger():
    S = Sprite("RANGED Slinger (round 5), a shepherd wrapped in a ram's fleece: a woolly cream ram-skin hood with two "
               "big curled horns, the fleece running on over the shoulders as one mantle; earth-brown tunic. The sling "
               "in the right hand and the shepherd's crook in the left are kept (both arms drawn before #body). "
               + LAYOUT)
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
    WOOL = "#F0E8D6"
    S.shape(cloud(100, 108, 64, 17, 0.62), WOOL, T="translate(100 104) scale(1.1 0.62) translate(-100 -108)", shadow=3,
            decor=f'<path d="{ell(76, 94, 26, 14)}" fill="#FFFFFF" opacity="0.45"/>')
    head(S)
    hood = cloud(100, 74, 50, 20, 0.66, 9)
    S.shape(hood, WOOL, shadow=4, T="translate(100 74) scale(1 0.92) translate(-100 -74)",
            decor=f'<path d="{ell(84, 56, 22, 14)}" fill="#FFFFFF" opacity="0.5"/>'
                  + "".join(f'<path d="{circ(x, y, 5)}" fill="#D8CDB4" opacity="0.7"/>'
                            for x, y in ((70, 70), (92, 60), (114, 66), (130, 82), (80, 90), (104, 84))))
    # the hood's face opening, a darker fleece rim
    S.shape("M 58 112 C 66 96 82 90 100 90 C 118 90 134 96 142 112 C 126 102 74 102 58 112 Z", "#D9CBAE", shadow=2)
    for s in (-1, 1):
        cx, cy = 100 + s * 50, 76
        horn = (f"M {f(cx - s * 6)} {f(cy - 26)} C {f(cx + s * 22)} {f(cy - 30)} {f(cx + s * 34)} {f(cy - 6)} "
                f"{f(cx + s * 28)} {f(cy + 14)} C {f(cx + s * 22)} {f(cy + 30)} {f(cx - s * 2)} {f(cy + 30)} "
                f"{f(cx - s * 4)} {f(cy + 14)} C {f(cx - s * 6)} {f(cy + 2)} {f(cx + s * 8)} {f(cy - 2)} "
                f"{f(cx + s * 12)} {f(cy + 6)} C {f(cx + s * 16)} {f(cy + 12)} {f(cx + s * 10)} {f(cy + 18)} "
                f"{f(cx + s * 4)} {f(cy + 14)} C {f(cx + s * 10)} {f(cy + 24)} {f(cx + s * 24)} {f(cy + 14)} "
                f"{f(cx + s * 20)} {f(cy)} C {f(cx + s * 16)} {f(cy - 14)} {f(cx)} {f(cy - 14)} {f(cx - s * 10)} {f(cy - 8)} Z")
        S.shape(horn, "#A8957A", shadow=4,
                decor=strokes(f"M {f(cx)} {f(cy - 22)} L {f(cx + s * 4)} {f(cy - 12)} M {f(cx + s * 14)} {f(cy - 22)} "
                              f"L {f(cx + s * 14)} {f(cy - 10)} M {f(cx + s * 26)} {f(cy - 10)} L {f(cx + s * 18)} {f(cy - 4)}",
                              "#7E6C56", 3, 0.7))
    mouth(S)
    return save_r("slinger", S)


# ------------------------------------------------------------------ Trapper
def trapper():
    S = Sprite("RANGED Trapper (round 5): a new hat: a fur trapper's cap with the ear flaps down beside the face and "
               "the front flap turned up, sitting at a slight tilt; buckskin coat with a fur collar. Carries a gun: a "
               "short rifle in the right hand (arm-r, drawn before #body, only the fist shows), and the jaw trap on "
               "its chain in the left hand (arm-l, before #body). " + LAYOUT)
    S.group("arm-l", PL, "jaw trap on a chain")
    for i in range(3):
        S.shape(ell(49 - i * 1.5, 148 + i * 7, 3.5, 4.5), DSTEEL, shadow=0)
    cx, cy = 44, 180
    S.shape(rr(cx, cy - 22, 7, 12, 3), "#8E96A2", shadow=0)
    S.shape(circ(cx, cy, 22) + " " + circ(cx, cy, 13), "#9AA2AE", shadow=0, rule="evenodd")
    for a in range(0, 360, 60):
        r = math.radians(a + 30)
        S.shape(poly([(cx + 15 * math.cos(r - 0.42), cy + 15 * math.sin(r - 0.42)),
                      (cx + 15 * math.cos(r + 0.42), cy + 15 * math.sin(r + 0.42)),
                      (cx + 5 * math.cos(r), cy + 5 * math.sin(r))]), "#E2E6EC", shadow=0, side=False)
    fist(S, 50, 142, 10)
    S.group("arm-r", PR, "short rifle")
    T = frame(160, 66, 4)
    S.shape(blob([(-9, 0), (9, 0), (7, 18), (4.5, 44), (-4.5, 44), (-7, 18)], 0.6), "#7A4A2A", T=T, shadow=0)
    S.shape(rr(0, 92, 6, 96, 3), "#7E8592", T=T, shadow=2,
            decor='<rect x="-2.2" y="44" width="1.8" height="94" fill="#E6EAF0" opacity="0.6"/>')
    S.shape(rr(0, 92, 10, 40, 4.5), "#7A4A2A", T=T, shadow=2)
    S.shape(rr(0, 60, 10, 18, 3.5), "#5E6474", T=T, shadow=2)
    S.shape(rr(0, 112, 12, 4.5, 2), BRASS, T=T, shadow=1)
    fist(S, 0, 48, T=T)
    S.group("body")
    S.shape(SHOULDERS, "#C09060", decor=strokes("M 40 96 L 44 120 M 52 92 L 56 124 M 148 92 L 144 124 M 160 96 L 156 120", "#9A6E44", 3, 0.6))
    S.shape(cloud(100, 104, 46, 16, 0.62), "#E9DEC6", shadow=3)
    head(S)
    tilt = "rotate(-9 100 90)"
    FUR, DFUR, LIN = "#7A5E44", "#5A4430", "#C9A77A"
    for s in (-1, 1):
        S.shape(blob([(100 + s * 40, 76), (100 + s * 50, 92), (100 + s * 50, 124), (100 + s * 42, 134),
                      (100 + s * 34, 124), (100 + s * 34, 92)], 0.8), FUR, T=tilt, shadow=4,
                decor=strokes(f"M {100 + s * 44} 96 L {100 + s * 42} 126", DFUR, 3, 0.6))
    S.shape(blob([(54, 92), (52, 64), (66, 40), (100, 30), (134, 40), (148, 64), (146, 92), (100, 98)], 0.85), FUR, T=tilt,
            shadow=5, decor=f'<path d="{ell(82, 52, 22, 13)}" fill="#957658" opacity="0.6"/>'
                            + strokes("M 70 44 L 76 70 M 90 36 L 92 66 M 110 36 L 108 66 M 130 44 L 124 70", DFUR, 3, 0.5))
    S.shape("M 56 96 C 62 78 80 70 100 70 C 120 70 138 78 144 96 C 146 104 140 108 132 104 C 120 98 80 98 68 104 "
            "C 60 108 54 104 56 96 Z", LIN, T=tilt, shadow=3,
            decor=strokes("M 66 92 L 70 84 M 80 86 L 82 78 M 96 84 L 96 76 M 112 84 L 114 76 M 128 88 L 130 80",
                          "#A88458", 3, 0.7))
    S.shape(rr(100, 34, 10, 10, 4), DFUR, T=tilt, shadow=2)
    mouth(S, 138)
    return save_r("trapper", S)


DESIGNS = {"crossbowman": crossbowman, "falconer": falconer, "grenadier": grenadier, "harpooner": harpooner,
           "javelin-huntress": huntress, "marksman-a": marksman_a, "marksman-b": marksman_b, "marksman-c": marksman_c,
           "marksman-d": marksman_d, "ninja": ninja, "pirate": pirate, "slinger": slinger, "trapper": trapper}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(DESIGNS):
        print(DESIGNS[n]())
