"""Round 10: the Wildwood's bandits, all nine drawn again (art-round8 deck: "Overall the bandits were all bad quality";
the Bandit Chief: "Meh. Could be done better"). The heroes' bust build and the gang's marks kept (the red bandanna over
the lower face, rag-edged leather), but each one now has its own headgear with real shapes in it, its own colour, a
bigger weapon drawn like the heroes' (blades split light and dark), and something on the shoulders.
python bandits10.py [name ...]   -> ../../enemies/bandit-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *
from bandits8 import RAGS, MASK, RED, FLAME, blade_decor

LEATHER, DLEATHER, HAIR = "#A8743F", "#7A4E2A", "#5A3A26"
IRON, DIRON = "#AEB5C1", "#6E747E"


# ------------------------------------------------------------------ shared pieces
def tunic(S, col=LEATHER, wide=False, patch=True):
    """The gang's rag-edged tunic with a seam of stitches along each shoulder and a darker patch."""
    d = RAGS if not wide else ("M14 108 C14 80 50 72 100 72 C150 72 186 80 186 108 L182 128 Q174 148 152 140 Q138 154 118 144 "
                               "Q100 156 82 144 Q62 154 48 140 Q26 148 18 128 Z")
    dk = shade(col, 0.7)
    dec = strokes("M 36 100 C 44 92 56 88 68 88 M 164 100 C 156 92 144 88 132 88", dk, 3, 0.55)
    if patch:
        dec += (f'<path d="{rr(152, 110, 22, 18, 4)}" fill="{dk}" opacity="0.55" transform="rotate(12 152 110)"/>'
                + strokes("M 142 104 L 146 100 M 150 102 L 154 98 M 158 104 L 162 100", light(col, 1.25), 2.2, 0.7))
    S.shape(d, col, decor=dec)


def mask(S, col=RED):
    """The gang's bandanna over the lower face, with a fold and a darker lower half."""
    S.shape(MASK, col, shadow=3,
            decor=f'<path d="M50 138 C74 150 126 150 150 138 L150 190 L50 190 Z" fill="{shade(col, 0.78)}" opacity="0.5"/>')
    S.raw(f'<path d="M68 128 Q100 138 132 128" fill="none" stroke="{shade(col, 0.62)}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>')


def sword(S, T, L=70, w=10.5, hilt=BRASS, grip="#5A3A26"):
    S.shape(rr(0, -10, 10, 24, 4), grip, T=T, shadow=0)
    S.shape(circ(0, -24, 6.5), hilt, T=T, shadow=0)
    blade = [(-w, 8), (w, 8), (w, L - 12), (0, L + 8), (-w, L - 12)]
    S.shape(poly(blade), STEEL, T=T, shadow=2, decor=blade_decor([(0, 8), (w, 8), (w, L - 12), (0, L + 8)])
            + f'<rect x="-1.5" y="12" width="3" height="{L - 34}" fill="#8A93A2" opacity="0.5"/>')
    S.shape(rr(0, 5, 36, 8, 3.5), hilt, T=T, shadow=2)
    fist(S, 0, -8, T=T)


def dagger(S, T, L=52, s=1):
    """A long curved fighting knife (the Twinfang's kind), its point curving towards local x * s."""
    TB = T if s > 0 else f"{T} scale(-1 1)"
    S.shape(rr(0, -8, 9, 20, 4), "#3E2A22", T=T, shadow=0)
    bl = [(-7, 6), (7, 6), (10, L * 0.5), (11, L - 8), (13, L + 8), (3, L - 4), (-5, L * 0.5)]
    S.shape(blob(bl, 0.75), STEEL, T=TB, shadow=2,
            decor=f'<path d="{blob([(1, 6), (7, 6), (10, L * 0.5), (11, L - 8), (13, L + 8), (7, L - 6), (3, L * 0.5)], 0.75)}" fill="#7E8696" opacity="0.45"/>')
    S.shape(rr(0, 4, 22, 7, 3), BRASS, T=T, shadow=2)
    fist(S, 0, -6, T=T)


def axe(S, T, L=62, s=-1):
    """A bearded axe: the haft forward, the blade on side s."""
    S.shape(rr(0, L / 2 - 10, 10, L + 16, 4), "#9A6A40", T=T, shadow=0,
            decor=f'<rect x="1" y="-30" width="4" height="{L + 40}" fill="#6E4628" opacity="0.5"/>')
    head = blob([(0, 28), (s * 14, 26), (s * 30, 12), (s * 42, 30), (s * 43, 54), (s * 34, 74), (s * 16, 58), (0, 58)], 0.8)
    S.shape(head, "#C9CED6", T=T, shadow=2,
            decor=strokes(f"M {s * 33} 14 C {s * 46} 30 {s * 47} 56 {s * 35} 73", "#FFFFFF", 6.5, 0.8))
    S.shape(rr(0, 43, 15, 32, 4), DIRON, T=T, shadow=1)
    fist(S, 0, 0, T=T)


def spear(S, T, back=-52, L=52, ribbon=RED):
    S.shape(rr(0, (back + L) / 2, 9, L - back, 4.5), "#9A6A40", T=T, shadow=0)
    if ribbon:   # a rag of the gang's red tied under the head
        S.shape(blob([(3, L - 12), (16, L - 18), (26, L - 34), (30, L - 20), (22, L - 6), (8, L - 2)], 0.8), ribbon, T=T, shadow=1)
    S.shape(rr(0, L - 6, 14, 10, 3), DIRON, T=T, shadow=1)
    S.shape(blob([(-12, L - 2), (12, L - 2), (13, L + 16), (0, L + 42), (-13, L + 16)], 0.7), STEEL, T=T, shadow=2,
            decor=blade_decor([(0, L - 2), (12, L - 2), (13, L + 16), (0, L + 42)]))
    fist(S, 0, 0, T=T)


def torch(S, T):
    S.shape(rr(0, 6, 10, 34, 4), "#8A5E38", T=T, shadow=0)
    S.shape(rr(0, 24, 19, 16, 5), "#4E423A", T=T, shadow=2, decor=strokes("M -10 20 L 10 24 M -10 27 L 10 31", "#2E2622", 2.5, 0.7))
    flame = blob([(0, 26), (15, 33), (20, 45), (16, 57), (7, 64), (0, 76), (-7, 64), (-16, 57), (-20, 45), (-15, 33)], 0.9)
    S.shape(flame, fill="url(#gFlame)", T=T, shadow=0, side=False,
            decor=f'<path d="{blob([(0, 34), (9, 42), (10, 50), (0, 64), (-10, 50), (-9, 42)], 0.9)}" fill="#FFE9A0"/>')
    fist(S, 0, 0, T=T)


def shield(S, cx, cy, r=31):
    """A round wooden shield: iron rim, planks, a band of the gang's red, an iron boss."""
    S.shape(circ(cx, cy, r), "#8E96A4", shadow=4)
    planks = "".join(strokes(f"M {cx + dx} {cy - r} L {cx + dx} {cy + r}", "#6E4628", 2.5, 0.55) for dx in (-14, 0, 14))
    S.shape(circ(cx, cy, r - 5.5), "#B07A48", shadow=0,
            decor=planks + f'<path d="M {cx - r} {cy - 6} L {cx + r} {cy - 14} L {cx + r} {cy + 2} L {cx - r} {cy + 10} Z" fill="{RED}" opacity="0.9"/>')
    S.shape(circ(cx, cy, 9.5), "#C9CED6", shadow=2, decor=f'<circle cx="{cx - 3}" cy="{cy - 3}" r="3.4" fill="#FFFFFF" opacity="0.85"/>')


# ------------------------------------------------------------------ the nine
def bandit_sword():
    S = Sprite("BANDIT, sword and shield (round 10): the gang's rag-edged leather and red bandanna (no eyes) under a dented "
               "iron pot helm with a riveted rim and a ridge, a mail collar; a broad sword in the right hand (arm-r, under "
               "the shoulder) and a round wooden shield with an iron rim and boss and a band of the gang's red, held in "
               "front on the left (arm-l, hand hidden). " + LAYOUT)
    S.group("arm-r", PR, "sword")
    sword(S, frame(165, 124, 14))
    S.group("body")
    tunic(S)
    S.shape(cloud(100, 104, 46, 15, 0.5), "#8A919E", shadow=3, T="translate(100 104) scale(1.1 0.84) translate(-100 -104)")
    head(S)
    mask(S)
    S.shape(blob([(49, 100), (46, 68), (62, 42), (100, 32), (138, 42), (154, 68), (151, 100), (100, 104)], 0.85), IRON, shadow=5,
            decor=f'<path d="{ell(80, 56, 20, 13)}" fill="#F4F6FA" opacity="0.35"/>'
                  f'<path d="{blob([(120, 52), (130, 58), (126, 68), (116, 62)], 0.9)}" fill="#6E747E" opacity="0.5"/>')
    S.shape(rr(100, 68, 10, 74, 5), light(IRON, 1.12), shadow=2)
    rim = ("M47 90 C60 99 80 104 100 104 C120 104 140 99 153 90 C155 96 154 103 151 107 C138 115 120 119 100 119 "
           "C80 119 62 115 49 107 C46 103 45 96 47 90 Z")
    S.shape(rim, shade(IRON, 0.8), shadow=3,
            decor="".join(f'<circle cx="{x}" cy="{y}" r="3" fill="#E6EAF0"/>' for x, y in ((58, 103), (78, 110), (100, 112), (122, 110), (142, 103))))
    S.group("arm-l", PL, "shield")
    fist(S, 48, 142, -6)
    shield(S, 42, 152)
    return save("enemies", "bandit-sword", S)


def bandit_torch():
    S = Sprite("TORCH BANDIT, sword and torch (round 10): the gang's leather and red bandanna under a battered slouch hat "
               "(the farmers' hat as its base: a wide brim, a crown pushed back, a red band), its brim stitched and nicked; "
               "a broad sword in the right hand (arm-r, under the shoulder) and a burning torch held out in the left "
               "(arm-l). No eyes. " + LAYOUT)
    S.add_def(FLAME)
    HAT = "#6A4E36"
    S.group("arm-r", PR, "sword")
    sword(S, frame(165, 124, 14))
    S.group("body")
    tunic(S, "#8E6238")
    S.shape(blob([(52, 118), (50, 96), (64, 84), (100, 80), (136, 84), (150, 96), (148, 118), (132, 106), (100, 102), (68, 106)], 0.8),
            "#4E5A44", shadow=3)   # a drab green neck cloth
    head(S)
    mask(S)
    T = scl(0.96, dy=-7)
    brim = ("M28 68 C28 40 60 20 100 20 C140 20 172 40 172 68 C172 80 166 90 156 98 L150 90 L142 104 C130 112 116 116 100 116 "
            "C60 116 28 96 28 68 Z")
    S.shape(brim, HAT, T=T, shadow=5,
            decor=f'<path d="M36 68 C36 44 64 28 100 28 C136 28 164 44 164 68 C164 90 136 108 100 108 C64 108 36 90 36 68 Z" '
                  f'fill="none" stroke="{light(HAT, 1.35)}" stroke-width="2.4" stroke-dasharray="5 6" opacity="0.7"/>')
    S.shape(CROWN, light(HAT, 1.1), T=T, shadow=4, decor=f'<path d="{ell(84, 42, 20, 10)}" fill="#FFFFF4" opacity="0.12"/>')
    S.shape(BAND, RED, T=T, shadow=2)
    S.group("arm-l", PL, "torch")
    torch(S, frame(54, 140, 26))
    return save("enemies", "bandit-torch", S)


def spiky(cx, cy, ro, ri, a0, a1, n):
    pts = []
    for i in range(2 * n + 1):
        a = math.radians(a0 + (a1 - a0) * i / (2 * n))
        r = ro if i % 2 else ri
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def bandit_greatsword():
    S = Sprite("GREATSWORD BANDIT (round 10): the gang's leather and red bandanna; a shock of black hair in back-swept "
               "spikes tied with a mustard headband knotted at the side; a great "
               "two-handed sword held in front the Old Guard's way, both fists on the long grip at the front right, the "
               "wide blade across the front (arm-r, after #body; no arm-l). No eyes. " + LAYOUT)
    BLACK, MUST = "#3A3340", "#D9A441"
    S.group("body")
    tunic(S, "#8E6238", patch=False)
    # the hair behind the head: spikes swept back
    hair = spiky(100, 86, 66, 44, 168, 372, 7)
    S.shape(blob(hair + [(128, 96), (100, 92), (72, 96)], 0.45), BLACK, shadow=3)
    head(S)
    mask(S)
    # the hairline: a jagged fringe over the brow
    fringe = [(50, 104), (48, 76), (62, 52), (100, 42), (138, 52), (152, 76), (150, 104), (140, 92), (132, 104), (122, 90),
              (112, 102), (102, 88), (92, 102), (82, 90), (72, 104), (62, 92)]
    S.shape(blob(fringe, 0.5), BLACK, shadow=4)
    S.shape("M50 74 C60 82 80 88 100 88 C120 88 140 82 150 74 C152 78 152 85 150 89 C138 97 120 101 100 101 C80 101 62 97 "
            "50 89 C48 85 48 78 50 74 Z", MUST, shadow=3)
    S.shape(blob([(54, 80), (36, 66), (24, 70), (34, 80), (22, 92), (36, 94), (50, 90)], 0.7), MUST, shadow=2)
    S.shape(circ(50, 84, 7), shade(MUST, 0.85), shadow=2)
    S.group("arm-r", PR, "greatsword, both hands, in front")
    T = frame(156, 114, 48)
    S.shape(rr(0, -8, 11, 50, 4), "#4A3226", T=T, shadow=0)
    S.shape(circ(0, -35, 7.5), BRASS, T=T, shadow=0)
    L = 100
    blade = [(-16, 20), (16, 20), (15, L), (0, L + 22), (-15, L)]
    S.shape(poly(blade), STEEL, T=T, shadow=3, decor=blade_decor([(0, 20), (16, 20), (15, L), (0, L + 22)])
            + f'<rect x="-2" y="24" width="4" height="{L - 44}" fill="#8A93A2" opacity="0.5"/>')
    S.shape(blob([(-34, 10), (-30, 22), (0, 25), (30, 22), (34, 10), (0, 15)], 0.6), DIRON, T=T, shadow=2)
    fist(S, 0, -22, T=T)
    fist(S, 0, 2, T=T)
    return save("enemies", "bandit-greatsword", S)


def bandit_axe():
    S = Sprite("AXE BANDIT (round 10): the gang's leather and red bandanna under a fur hat with a thick pale fur band and "
               "a striped tail hanging back from it (#back, sways), a wool collar; a big bearded axe in the right hand "
               "(arm-r, under the shoulder, the blade turned out), the left hand free (arm-l). No eyes. " + LAYOUT)
    FUR, PALE = "#7A5E44", "#CDB894"
    S.group("back", (124, 50), "the hat's tail")
    tail = strip([(120, 54), (134, 36), (150, 20), (166, 8)], 15, taper=(0.8, 1.0))
    bands = "".join(f'<path d="M {x - 12} {y - 10} L {x + 12} {y + 10}" stroke="#4A382A" stroke-width="7" opacity="0.8"/>'
                    for x, y in ((132, 40), (146, 26), (160, 12)))
    S.shape(tail, FUR, shadow=0, decor=bands)
    S.group("arm-r", PR, "axe")
    axe(S, frame(152, 124, 4), s=1)
    S.group("body")
    tunic(S, "#96683C")
    S.shape(cloud(100, 104, 46, 14, 0.6), "#D8CDB4", shadow=3, T="translate(100 104) scale(1.08 0.8) translate(-100 -104)")
    head(S)
    mask(S)
    S.shape(blob([(52, 92), (48, 62), (64, 38), (100, 28), (136, 38), (152, 62), (148, 92), (100, 98)], 0.85), FUR, shadow=5,
            decor=f'<path d="{ell(82, 50, 22, 13)}" fill="#957658" opacity="0.6"/>'
                  + strokes("M 70 44 L 76 72 M 90 34 L 92 68 M 110 34 L 108 68 M 130 44 L 124 72", "#5A4430", 3, 0.5))
    S.shape(cloud(100, 98, 50, 11, 0.6, 0), PALE, shadow=3, T="translate(100 98) scale(1.04 0.32) translate(-100 -98)")
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 146, -6)
    return save("enemies", "bandit-axe", S)


def bandit_spear():
    S = Sprite("SPEAR BANDIT (round 10): the gang's red bandanna under a moss-green hood with a long tail lying back and a "
               "scalloped mantle over the shoulders; a long spear in the right hand (arm-r, under the shoulder, the point "
               "well forward, a rag of the gang's red tied under the head), the left hand free (arm-l). No eyes. " + LAYOUT)
    GREEN = "#5E7048"
    S.group("arm-r", PR, "spear")
    spear(S, frame(158, 108, 5))
    S.group("body")
    tunic(S, patch=False)
    mantle = blob([(30, 104), (40, 84), (66, 76), (100, 74), (134, 76), (160, 84), (170, 104), (164, 122), (152, 114), (140, 128),
                   (126, 118), (114, 132), (100, 122), (86, 132), (74, 118), (60, 128), (48, 114), (36, 122)], 0.7)
    S.shape(mantle, shade(GREEN, 0.86), shadow=3)
    head(S)
    mask(S)
    S.shape(strip([(104, 50), (116, 30), (134, 14), (154, 6)], 16, taper=(0.75, 1.0)), shade(GREEN, 0.9), shadow=0)
    S.shape(blob([(46, 114), (40, 76), (54, 46), (78, 32), (100, 28), (122, 32), (146, 46), (160, 76), (154, 114), (142, 108),
                  (140, 88), (122, 76), (100, 73), (78, 76), (60, 88), (58, 108)], 0.8), GREEN, shadow=4,
            decor=f'<path d="{ell(78, 50, 22, 12)}" fill="#FFFFF4" opacity="0.12"/>'
                  + strokes("M 58 104 C 56 86 74 70 100 68 C 126 70 144 86 142 104", shade(GREEN, 0.7), 3, 0.5))
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 146, -6)
    return save("enemies", "bandit-spear", S)


def bandit_daggers():
    S = Sprite("KNIFE BANDIT, two daggers (round 10): the gang's cutpurse, bare-headed: the red bandanna, dark auburn hair "
               "swept back off the brow in a wave and tied in a long tail that lies back (#back, sways), a gold ring in one "
               "ear, a slate-blue scarf collar over dark leather; a long curved knife in each hand, both under the "
               "shoulders, curving out (arm-l, arm-r, before #body). No eyes. " + LAYOUT)
    SLATE, AUB = "#56506C", "#6A3428"
    S.group("back", (100, 56), "the tail of hair")
    S.shape(blob([(88, 60), (84, 40), (90, 22), (102, 8), (120, -2), (116, 14), (120, 30), (114, 46), (112, 60)], 0.85), AUB, shadow=0,
            decor=strokes("M 98 54 C 96 36 102 22 112 10", light(AUB, 1.5), 3, 0.5))
    S.group("arm-r", PR, "knife")
    dagger(S, frame(158, 134, 6), s=1)
    S.group("arm-l", PL, "knife")
    dagger(S, frame(42, 134, -6), s=-1)
    S.group("body")
    tunic(S, "#6E5244", patch=False)
    S.shape(blob([(40, 110), (44, 86), (66, 76), (100, 74), (134, 76), (156, 86), (160, 110), (140, 124), (100, 128), (60, 124)], 0.85),
            shade(SLATE, 0.82), shadow=3)
    head(S)
    mask(S)
    S.shape(circ(149, 112, 6.5) + " " + circ(149, 112, 3), GOLD, shadow=2, rule="evenodd")     # the earring
    # the hair: swept back off the brow, its front edge one wave, a parting; the tie where the tail leaves it
    S.shape(blob([(50, 106), (46, 74), (60, 48), (100, 38), (140, 48), (154, 74), (150, 106), (142, 92), (128, 84), (112, 92),
                  (98, 84), (82, 94), (68, 86), (58, 94)], 0.85), AUB, shadow=4,
            decor=f'<path d="{ell(80, 56, 20, 10)}" fill="#FFFFF4" opacity="0.14"/>'
                  + strokes("M 104 44 C 100 58 100 72 104 86", shade(AUB, 0.65), 3, 0.6))
    S.shape(rr(101, 50, 26, 10, 5), RED, shadow=2)
    return save("enemies", "bandit-daggers", S)


def poacher():
    S = Sprite("POACHER (round 10): a woodland hunter, not one of the masked gang: an olive hunter's cap with a turned-up "
               "brim coming to a point at the front and a long pheasant feather lying back, a scruffy brown beard, a grey "
               "wolf-fur mantle over leather; a short dark recurve bow held out in front (arm-l, with its string, which "
               "the game draws to the drawing hand) and an arrow in the drawing hand (arm-r); a rolled net slung on the "
               "back (#back). No eyes. " + LAYOUT)
    OLIVE = "#76703A"
    S.group("back", (100, 64), "rolled net")
    S.shape(ell(100, 44, 40, 22), "#C9B58A", shadow=0,
            decor=strokes("M 64 32 L 92 64 M 78 24 L 110 64 M 96 22 L 128 60 M 116 24 L 136 44 "
                          "M 136 32 L 108 64 M 122 24 L 90 64 M 104 22 L 72 58 M 84 24 L 64 44", "#8A7650", 2.6, 0.75))
    S.shape(rr(100, 44, 84, 8, 3), "#7A5A3A", shadow=2)
    S.group("body")
    tunic(S, "#8A6440", patch=False)
    S.shape(cloud(100, 104, 50, 13, 0.6, 6), "#8E8A86", shadow=3, T="translate(100 104) scale(1.14 0.8) translate(-100 -104)")
    head(S)
    beard = blob([(64, 126), (76, 138), (88, 143), (100, 144), (112, 143), (124, 138), (136, 126), (138, 142), (130, 154),
                  (120, 158), (112, 166), (100, 172), (88, 166), (80, 158), (70, 154), (62, 142)], 0.6)
    S.shape(beard, "#6A4A30", shadow=3)
    mouth(S, 137, "#9A6A58")
    # the cap: a long feather, the crown, the turned-up brim pointed at the front
    pf, ph = feather([(126, 70), (140, 46), (150, 20), (150, -4)], 11)
    S.shape(pf, "#C98A4A", shadow=0, decor=f'<path d="{ph}" fill="#8A5A2E" opacity="0.7"/>'
            + strokes("M 136 52 L 146 48 M 142 34 L 152 30 M 146 16 L 154 12", "#4A3220", 3, 0.7))
    S.shape(blob([(52, 92), (50, 64), (66, 42), (100, 32), (134, 42), (150, 64), (148, 92), (100, 96)], 0.85), OLIVE, shadow=5,
            decor=f'<path d="{ell(82, 52, 22, 12)}" fill="#FFFFF4" opacity="0.14"/>')
    S.shape(blob([(44, 84), (58, 91), (80, 96), (100, 104), (120, 96), (142, 91), (156, 84), (154, 96), (140, 106),
                  (120, 112), (100, 126), (80, 112), (60, 106), (46, 96)], 0.7), shade(OLIVE, 0.8), shadow=3)
    S.group("arm-l", PL, "bow, string and the hand holding it")
    S.raw('<path id="string" d="M30 146 L100 158 L170 146" fill="none" stroke="#EDE3CC" stroke-width="2.5" '
          'stroke-linecap="round" stroke-linejoin="round"/>')
    outer = [(22, 142), (46, 162), (74, 177), (100, 182), (126, 177), (154, 162), (178, 142)]
    inner = [(x, y - 9) for x, y in outer[::-1]]
    S.shape(blob(outer + inner, 0.5), "#5A3A26", shadow=0,
            decor=f'<path d="{circ(24, 137, 8)} {circ(176, 137, 8)}" fill="#2E2018"/>')
    S.shape(rr(100, 180, 32, 14, 4), "#A07A50", shadow=1)
    fist(S, 100, 180, 90, w=21, h=24)
    S.group("arm-r", PR, "arrow and the drawing hand")
    S.shape(rr(100, 176, 4, 40, 2), "#8A6440", shadow=0)
    S.shape(poly([(93, 192), (100, 206), (107, 192)]), STEEL, shadow=1)
    fist(S, 100, 160, 90, w=20, h=22)
    return save("enemies", "bandit-poacher", S)


def club(S, T, L=78):
    """A big club: a thick knotted limb swelling to a head bound with two iron bands and set with iron spikes."""
    S.shape(blob([(-7, -18), (7, -18), (10, 20), (19, L - 26), (18, L - 2), (0, L + 8), (-18, L - 2), (-19, L - 26), (-10, 20)], 0.85),
            "#A0703F", T=T, shadow=0, decor=strokes(f"M 5 -6 L 9 {L - 30}", "#C69458", 3.5, 0.5))
    for x, y in ((-19, L - 30), (19, L - 30), (-18, L - 8), (18, L - 8), (0, L + 6)):
        sx = -1 if x < 0 else 1
        if x == 0:
            S.shape(poly([(-6, y - 2), (6, y - 2), (0, y + 13)]), "#C9CED6", T=T, shadow=0, side=False)
        else:
            S.shape(poly([(x - sx * 2, y - 6), (x - sx * 2, y + 6), (x + sx * 12, y)]), "#C9CED6", T=T, shadow=0, side=False)
    for y in (L - 30, L - 8):
        S.shape(rr(0, y, 40, 9, 3), DIRON, T=T, shadow=1,
                decor="".join(f'<circle cx="{x}" cy="{y}" r="2.4" fill="#C9CED6"/>' for x in (-11, 0, 11)))
    fist(S, 0, 0, T=T, w=25, h=29)


def brute():
    S = Sprite("BANDIT BRUTE (round 10): the gang's heavy, bigger than the rest: a bald, scarred head over the red "
               "bandanna, very broad shoulders in patched leather, a spiked iron pauldron strapped on the right one, a "
               "shaggy fur collar; a great club bound with spiked iron bands in the right hand (arm-r, under the "
               "shoulder), a big fist in leather wraps on the left (arm-l). No eyes. " + LAYOUT)
    S.add_def('<linearGradient id="gFaceBrute" x1="0" y1="47" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
              '<stop offset="0" stop-color="#F0C49E"/><stop offset="0.3" stop-color="#E9B892"/>'
              '<stop offset="0.55" stop-color="#F2C7A0"/><stop offset="0.85" stop-color="#F4CBA6"/>'
              '<stop offset="1" stop-color="#E6B590"/></linearGradient>')
    S.group("arm-r", (156, 108), "great club")
    club(S, frame(160, 118, 10), L=68)
    S.group("body")
    tunic(S, "#8E5E34", wide=True, patch=False)
    S.shape(cloud(100, 100, 50, 14, 0.62), "#6E5A44", shadow=3, T="translate(100 100) scale(1.14 0.72) translate(-100 -100)")
    # the pauldron on the right shoulder: an iron plate with three spikes, a strap across the chest to it
    S.shape("M 60 86 L 72 82 L 150 118 L 142 128 Z", "#5E4028", shadow=2)
    for a in (-50, -10, 30):
        r = math.radians(a)
        x, y = 156 + 26 * math.cos(r), 100 + 22 * math.sin(r)
        S.shape(poly([(-6, 0), (6, 0), (0, 16)]), "#C9CED6", T=f"translate({f(x)} {f(y)}) rotate({a - 90})", shadow=0, side=False)
    S.shape(ell(156, 100, 27, 23), IRON, shadow=3, decor=f'<path d="{ell(148, 92, 11, 7)}" fill="#F4F6FA" opacity="0.4"/>'
            + "".join(f'<circle cx="{x}" cy="{y}" r="2.8" fill="#6E747E"/>' for x, y in ((142, 110), (156, 116), (170, 108))))
    head(S, face="url(#gFaceBrute)")
    S.raw('<path d="M 72 60 L 92 86" fill="none" stroke="#C88E6E" stroke-width="5" stroke-linecap="round"/>'
          '<path d="M 76 74 L 86 66 M 82 80 L 91 73" fill="none" stroke="#C88E6E" stroke-width="3" stroke-linecap="round"/>')
    mask(S)
    S.group("arm-l", (44, 108), "wrapped fist")
    fist(S, 38, 148, -6, w=27, h=31)
    for dy in (-9, 0):
        S.shape(rr(38, 140 + dy, 31, 6, 3), "#7A5A3A", T="rotate(-6 38 140)", shadow=1)
    return save("enemies", "bandit-brute", S)


def chief():
    S = Sprite("THE BANDIT CHIEF (round 10): the gang's boss: a wide black cavalier hat, one side of its brim pinned up, "
               "with a gold band and a great red plume sweeping back over it; long black hair, the gang's red bandanna; a "
               "black coat with red facings, gold buttons and gold-fringed epaulettes, a short cape behind (#back, "
               "sways); a big gold-hilted cutlass in the right hand (arm-r, under the shoulder) and a black smoke bomb "
               "with a lit fuse in the left (arm-l). No eyes. " + LAYOUT)
    COAT, HATC, HAIRC = "#3A3442", "#2A2630", "#2E2830"
    S.group("back", (100, 90), "cape")
    S.shape(blob([(50, 100), (150, 100), (162, 60), (150, 30), (128, 36), (114, 22), (100, 34), (86, 22), (72, 36), (50, 30), (38, 60)], 0.7),
            "#8E2A30", shadow=0, decor=strokes("M 72 40 L 76 90 M 100 38 L 100 92 M 128 40 L 124 90", "#6A1E26", 3.5, 0.55))
    S.group("arm-r", PR, "cutlass")
    T = frame(164, 126, 12)
    S.shape(rr(0, -10, 10, 24, 4), "#3E2A22", T=T, shadow=0)
    L = 66
    blade = blob([(-9, 8), (9, 8), (14, 32), (15, 54), (6, L + 8), (-3, L + 2), (-7, 44), (-9, 24)], 0.8)
    S.shape(blade, STEEL, T=T, shadow=2,
            decor=f'<path d="{blob([(2, 8), (9, 8), (14, 32), (15, 54), (6, L + 8), (3, 50), (2, 30)], 0.8)}" fill="#7E8696" opacity="0.45"/>')
    S.shape(rr(0, 4, 34, 9, 3.5), GOLD, T=T, shadow=1)
    S.shape(blob([(-17, 2), (-14, -14), (0, -24), (14, -14), (17, 2), (10, 1), (8, -9), (0, -15), (-8, -9), (-10, 1)], 0.7),
            GOLD, T=T, shadow=1)
    fist(S, 0, -8, T=T)
    S.group("body")
    S.shape(SHOULDERS, COAT,
            decor=f'<path d="M 78 76 L 100 132 L 122 76 L 136 76 L 104 142 L 96 142 L 64 76 Z" fill="#8E2A30"/>'
                  + "".join(f'<circle cx="{x}" cy="{y}" r="3.4" fill="{GOLD}"/>' for x, y in ((72, 124), (128, 124), (62, 106), (138, 106))))
    for s in (-1, 1):   # gold-fringed epaulettes
        cx = 100 + s * 56
        S.shape(blob([(cx - 18, 96), (cx - 12, 84), (cx + 6, 82), (cx + 18, 92), (cx + 18, 112), (cx + 6, 122), (cx - 12, 120), (cx - 18, 108)], 0.85),
                GOLD, shadow=3, decor=strokes(" ".join(f"M {cx + s * 8} {y} L {cx + s * 18} {y + 1}" for y in (92, 99, 106, 113)), "#B8862A", 2.6, 0.9))
    # long black hair behind the head
    S.shape(blob([(48, 118), (44, 84), (60, 62), (100, 56), (140, 62), (156, 84), (152, 118), (140, 126), (132, 108), (100, 102), (68, 108), (60, 126)], 0.8),
            HAIRC, shadow=3)
    head(S)
    mask(S)
    # the plume first (it lies over the back of the hat's crown from the pinned-up side), then the hat
    brim = blob([(100, 16), (136, 22), (168, 42), (178, 70), (164, 92), (140, 104), (120, 110), (100, 112), (80, 110), (60, 104),
                 (40, 94), (30, 76), (38, 54), (52, 40), (68, 26)], 0.85)
    S.shape(brim, HATC, shadow=5,
            decor=strokes("M 34 80 C 48 96 76 106 100 106 C 124 106 150 98 168 82", GOLD, 3.2, 0.9)
                  + f'<path d="{blob([(30, 76), (38, 54), (52, 40), (68, 26), (72, 44), (60, 60), (50, 80), (42, 92)], 0.8)}" fill="#46404E"/>')
    S.shape(ell(102, 60, 33, 27), "#3A3440", shadow=4, decor=f'<path d="{ell(90, 50, 14, 8)}" fill="#FFFFF4" opacity="0.1"/>')
    S.shape("M 70 64 C 78 80 90 86 102 86 C 114 86 127 80 134 64 C 136 70 135 76 132 80 C 124 90 114 94 102 94 "
            "C 90 94 80 90 72 80 C 69 76 68 70 70 64 Z", GOLD, shadow=2)
    spine = curve((62, 58), (84, 8), (150, 10), 17) + [(160, 16), (162, 26), (154, 30)]
    out, half = feather(spine, 17, (), 1.0)
    S.shape(out, "#D8463F", shadow=4, decor=f'<path d="{half}" fill="#A8303A"/>')
    S.shape(circ(60, 60, 6.5), GOLD, shadow=2)
    S.group("arm-l", PL, "smoke bomb")
    fist(S, 46, 142, -6)
    S.shape(circ(40, 164, 16), "#3A3440", shadow=3, decor='<circle cx="34" cy="158" r="5" fill="#6E6878"/>')
    S.shape(rr(40, 148, 9, 7, 2.5), "#8E96A4", shadow=1)
    S.shape(strip([(40, 146), (34, 138), (26, 136)], 3, taper=(0.9, 1.0)), "#C9B58A", shadow=0)
    S.shape(circ(25, 135, 5), "#FFC24A", shadow=0, side=False)
    return save("enemies", "bandit-chief", S)


BUILD = {"bandit-sword": bandit_sword, "bandit-torch": bandit_torch, "bandit-greatsword": bandit_greatsword,
         "bandit-axe": bandit_axe, "bandit-spear": bandit_spear, "bandit-daggers": bandit_daggers,
         "bandit-poacher": poacher, "bandit-brute": brute, "bandit-chief": chief}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
