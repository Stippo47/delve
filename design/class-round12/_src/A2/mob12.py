"""Round 12: the Mob (the designer: "Make new hero. Mob. Is 4 peasants. Is the collective of all 4. Each is like 30% the
strength of 1 normal hero. Torch, pitchfork, axe, and dagger. They are strongly attracted to each other. All melee.").
Four small peasants, one file each, drawn three ways (three sets): each peasant is the approved heroes' bust build (a
head token on shoulders, fists in the arm parts, no eyes) drawn small inside the usual 220 box: every part carries one
transform, a scale about the box's centre, and the outline filter stays outside it, so the line is the heroes' weight
when the game draws the file at the heroes' scale (a kind with headR = 56 x the scale: 34 for 0.6; vr = 22 x the scale).
Inside the small figure the fists, hafts and blades are drawn fatter than a hero's so they still read.
python mob12.py [name ...]   -> ../../heroes/mob-<weapon>-<take>.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from kit12 import *

WOODH = "#9A6A40"
SACK = "#B89A6A"


# ------------------------------------------------------------------ the four weapons (hero units, drawn fat; +y forward)
def w_torch(S):
    S.add_def(FLAME)
    T = frame(160, 128, 6)
    S.shape(rr(0, 10, 14, 50, 5), "#8A5E38", T=T, shadow=0)
    S.shape(rr(0, 36, 26, 20, 6), "#4E423A", T=T, shadow=3, decor=strokes("M -13 31 L 13 36 M -13 39 L 13 44", "#2E2622", 3.4, 0.7))
    flame = blob([(0, 38), (19, 46), (25, 62), (20, 77), (9, 86), (0, 104), (-9, 86), (-20, 77), (-25, 62), (-19, 46)], 0.9)
    S.shape(flame, fill="url(#gFlame)", T=T, shadow=0, side=False,
            decor=f'<path d="{blob([(0, 50), (11, 60), (12, 70), (0, 88), (-12, 70), (-11, 60)], 0.9)}" fill="#FFE9A0"/>')
    fist(S, 0, 0, T=T, w=27, h=31)


def w_pitchfork(S):
    T = frame(164, 122, 8)
    S.shape(rr(0, 18, 13, 142, 6), WOODH, T=T, shadow=0, decor=f'<rect x="1.5" y="-70" width="5" height="170" fill="#6E4628" opacity="0.5"/>')
    tines = " ".join([rr(0, 94, 50, 11, 4)] + [poly([(x - 5, 94), (x + 5, 94), (x + 5, 124 + (6 if x == 0 else 0)), (x, 137 + (6 if x == 0 else 0)), (x - 5, 124 + (6 if x == 0 else 0))])
                                               for x in (-20, 0, 20)])
    S.shape(tines, STEEL, T=T, shadow=3, decor=f'<path d="{poly([(0, 88), (30, 88), (30, 160), (0, 160)])}" fill="#7E8696" opacity="0.4"/>')
    S.shape(rr(0, 84, 19, 12, 4), DIRON, T=T, shadow=2)
    fist(S, 0, 0, T=T, w=27, h=31)


def w_axe(S, s=1):
    T = frame(164, 122, 12)
    L = 74
    S.shape(rr(0, L / 2 - 12, 14, L + 26, 5), WOODH, T=T, shadow=0, decor=f'<rect x="1.5" y="-40" width="5" height="{L + 60}" fill="#6E4628" opacity="0.5"/>')
    hd = blob([(0, 30), (s * 18, 28), (s * 38, 12), (s * 52, 34), (s * 53, 62), (s * 42, 86), (s * 20, 68), (0, 68)], 0.8)
    S.shape(hd, "#C9CED6", T=T, shadow=3, decor=strokes(f"M {s * 41} 15 C {s * 57} 34 {s * 58} 64 {s * 43} 85", "#FFFFFF", 9, 0.8))
    S.shape(rr(0, 49, 20, 40, 5), DIRON, T=T, shadow=2)
    fist(S, 0, 0, T=T, w=27, h=31)


def w_dagger(S, knife=False):
    T = frame(160, 128, 6)
    L, w = 70, 13
    S.shape(rr(0, -10, 13, 26, 5), "#4A3226", T=T, shadow=0)
    if knife:   # a kitchen knife: one straight back, one curved edge
        bl = [(-w, 10), (w * 0.4, 10), (w * 0.9, L * 0.55), (w * 0.2, L + 6), (-w, L - 14)]
        S.shape(blob(bl, 0.45), STEEL, T=T, shadow=3, decor=f'<path d="{blob([(-2, 10), (w * 0.4, 10), (w * 0.9, L * 0.55), (w * 0.2, L + 6), (-2, L - 6)], 0.45)}" fill="#7E8696" opacity="0.45"/>')
    else:
        blade = [(-w, 12), (w, 12), (w, L - 16), (0, L + 10), (-w, L - 16)]
        S.shape(poly(blade), STEEL, T=T, shadow=3, decor=blade_decor([(0, 12), (w, 12), (w, L - 16), (0, L + 10)]))
        S.shape(rr(0, 8, 40, 10, 4), BRASS, T=T, shadow=2)
    fist(S, 0, -6, T=T, w=27, h=31)


# ------------------------------------------------------------------ heads
def phead(S, ears=True, fill="url(#gFace)"):
    if ears:
        S.shape(ell(52.1, 108.7, 8, 10.6), fill="#F0C49D", shadow=0, side=False)
        S.shape(ell(147.8, 108.7, 8, 10.6), fill="#D8A27C", shadow=0, side=False)
    S.shape(HEAD, fill=fill, shadow=7, decor='<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>')


def pmouth(S, y=136):
    S.raw(f'<path d="M94 {f(y)} Q100 {f(y + 4)} 106 {f(y)}" fill="none" stroke="#C98868" stroke-width="4" stroke-linecap="round"/>')


def kerchief(S, col="#C8403A"):
    phead(S, False); pmouth(S)
    S.shape("M 50 142 C 32 82 60 36 100 36 C 140 36 168 82 150 142 C 152 112 134 94 100 94 C 66 94 48 112 50 142 Z", col, shadow=6,
            decor=hi(70, 58, 12, 18, 0.2, 24))
    for s in (-1, 1):
        S.shape(blob([(100 + s * 4, 160), (100 + s * 20, 180), (100 + s * 9, 188), (100 + s * 1, 172)], 0.7), shade(col, 0.88), shadow=2)
    S.shape(circ(100, 160, 10), col, shadow=2)


def felt_hat(S, col="#7A6A52"):
    phead(S); pmouth(S)
    T = scl(0.92, dy=-3)
    S.shape(BRIM, col, T=T, shadow=7, decor=hi(62, 44, 22, 8, 0.14, -24))
    S.shape("M58 60 C56 36 76 26 96 30 C104 24 114 26 122 30 C138 32 146 44 144 60 C144 74 125 82 100 82 C75 82 58 74 58 60 Z", light(col, 1.14), T=T, shadow=5)
    S.shape(BAND, "#3E332C", T=T, shadow=2)


def bald_beard(S, col="#3A3340"):
    S.add_def('<radialGradient id="gBald" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="#F6D3B0"/>'
              '<stop offset="0.7" stop-color="#E9B88F"/><stop offset="1" stop-color="#D49E78"/></radialGradient>')   # the Monk's bald head
    phead(S, fill="url(#gBald)")
    S.raw(hi(82, 70, 15, 9, 0.5, -24))
    S.shape("M 56 110 C 56 140 70 158 86 166 C 92 176 96 184 100 190 C 104 184 108 176 114 166 C 130 158 144 140 144 110 "
            "C 132 128 114 134 100 128 C 86 134 68 128 56 110 Z", col, shadow=4)
    moustache(S, light(col, 1.3), y=124, w=1.0, droop=2)


def point_hood(S, col="#C9952E"):
    phead(S, False); pmouth(S)
    S.shape(taper([(92, 52), (100, 26), (120, 6), (146, 4), (164, 18)], 40, 9), col, shadow=0)
    S.shape(HOOD, col, shadow=6, decor=hi(70, 62, 10, 18, 0.2, 20))
    S.shape("M 46 124 C 52 106 70 98 100 98 C 130 98 148 106 154 124 C 153 112 151 106 149 102 C 136 93 120 90 100 90 C 80 90 64 93 51 102 C 49 106 47 112 46 124 Z",
            shade(col, 0.72), shadow=0)


def granny_bun(S, col="#ECEAE4"):
    S.shape(circ(100, 36, 24), col, shadow=3, decor=hi(92, 26, 9, 5, 0.5))
    phead(S); pmouth(S)
    S.shape(blob([(50, 112), (45, 80), (60, 52), (100, 42), (140, 52), (155, 80), (150, 112), (140, 94), (122, 86), (100, 92), (78, 86), (60, 94)], 0.85), col, shadow=5,
            decor=strokes("M 100 46 L 100 88", "#B9B6AE", 4, 0.7))


def flat_cap(S, col="#7A5A3C", tache="#6A4630"):
    phead(S)
    moustache(S, tache, y=126, w=1.0, droop=1)
    S.shape(blob([(48, 98), (44, 70), (60, 46), (100, 38), (140, 46), (156, 70), (152, 98), (100, 106)], 0.85), col, shadow=6,
            decor=hi(76, 56, 20, 10, 0.2, -16) + strokes("M 100 40 L 100 100 M 70 46 Q 78 76 70 102 M 130 46 Q 122 76 130 102", shade(col, 0.7), 3.2, 0.6))
    S.shape("M 52 96 C 66 104 84 107 100 107 C 116 107 134 104 148 96 C 150 108 138 120 100 122 C 62 120 50 108 52 96 Z", shade(col, 0.78), shadow=4)
    S.shape(circ(100, 44, 6.5), shade(col, 0.7), shadow=2)


def bowl_cut(S, col="#C8602E"):
    phead(S); pmouth(S)
    S.shape(blob([(48, 116), (44, 78), (58, 50), (100, 38), (142, 50), (156, 78), (152, 116), (140, 108), (138, 96), (100, 98), (62, 96), (60, 108)], 0.6), col, shadow=6,
            decor=hi(76, 58, 20, 9, 0.25, -16))


def tuft(S, col="#E8C458"):
    phead(S); pmouth(S)
    pts = [(50, 104), (46, 76), (58, 54), (72, 44), (78, 22), (92, 38), (104, 14), (112, 38), (130, 26), (130, 46), (144, 56), (154, 78), (150, 104),
           (138, 88), (126, 96), (112, 84), (100, 94), (88, 84), (74, 96), (62, 88)]
    S.shape(blob(pts, 0.5), col, shadow=6, decor=hi(76, 62, 16, 8, 0.3, -16))


def colander(S):
    phead(S); pmouth(S)
    for s in (-1, 1):
        S.shape(ring(100 + s * 58, 76, 12, 5.5), DIRON, rule="evenodd", shadow=0)
    S.shape(blob([(47, 100), (44, 68), (60, 42), (100, 32), (140, 42), (156, 68), (153, 100), (100, 106)], 0.85), "#C9CED6", shadow=6,
            decor="".join(f'<circle cx="{x}" cy="{y}" r="4" fill="#5E6474"/>' for x, y in ((70, 60), (88, 50), (112, 50), (130, 60), (78, 78), (100, 70), (122, 78), (62, 86), (138, 86)))
                  + hi(72, 48, 14, 7, 0.4, -24))
    S.shape("M45 90 C60 100 80 105 100 105 C120 105 140 100 155 90 C157 98 156 106 152 110 C138 118 120 121 100 121 C80 121 62 118 48 110 C44 106 43 98 45 90 Z",
            "#9AA2AE", shadow=4)


def bucket(S):
    phead(S); pmouth(S)
    W = "#B07A48"
    S.shape(band([(152, 84), (170, 96), (172, 116), (160, 128)], 3.6), "#D9C7A0", shadow=0)   # the rope handle, hanging at one side
    S.shape("M 52 104 L 56 44 C 70 30 130 30 144 44 L 148 104 C 134 114 66 114 52 104 Z", W, shadow=6,
            decor=strokes("M 76 34 L 73 110 M 100 32 L 100 112 M 124 34 L 127 110", "#7A4E2C", 3.4, 0.6) + hi(68, 60, 8, 20, 0.2))
    S.shape(ell(100, 44, 44, 14), light(W, 1.12), shadow=0, decor=strokes("M 76 34 L 76 56 M 100 30 L 100 58 M 124 34 L 124 56", "#7A4E2C", 3.4, 0.5))
    for y, w in ((70, 0), (96, 0)):
        S.shape(f"M {53.4 + (104 - y) * 0.066 - 2} {y} C 70 {y + 9} 130 {y + 9} {146.6 - (104 - y) * 0.066 + 2} {y} L {147 - (104 - y - 9) * 0.066 + 2} {y + 9} C 130 {y + 18} 70 {y + 18} {53 + (104 - y - 9) * 0.066 - 2} {y + 9} Z",
                DIRON, shadow=2)


def pot(S):
    phead(S); pmouth(S)
    P = "#4A4652"
    S.shape(rr(0, 0, 56, 13, 6), P, T="translate(168 62) rotate(-24)", shadow=0)                 # the handle, out to one side
    S.shape("M 48 102 L 48 60 C 48 44 64 36 100 36 C 136 36 152 44 152 60 L 152 102 C 136 112 64 112 48 102 Z", P, shadow=6,
            decor=hi(68, 62, 8, 18, 0.25))
    S.shape(ell(100, 52, 50, 15), light(P, 1.3), shadow=0, decor=hi(80, 48, 18, 5, 0.3))
    S.shape("M 44 98 C 62 108 138 108 156 98 L 156 108 C 138 119 62 119 44 108 Z", light(P, 1.45), shadow=3)


def funnel(S):
    phead(S); pmouth(S)
    C = "#AEB5C1"
    S.shape(blob([(44, 102), (62, 72), (88, 46), (100, 40), (112, 46), (138, 72), (156, 102), (100, 112)], 0.45), C, shadow=6,
            decor=f'<path d="{poly([(100, 30), (160, 30), (160, 120), (100, 120)])}" fill="#5E6474" opacity="0.28"/>' + hi(74, 76, 6, 16, 0.4, 36))
    S.shape(poly([(88, 48), (112, 48), (108, 6), (92, 6)]), light(C, 1.08), shadow=3,
            decor=f'<path d="{poly([(100, 0), (116, 0), (116, 50), (100, 50)])}" fill="#5E6474" opacity="0.28"/>')
    S.shape("M 42 96 C 60 108 140 108 158 96 L 158 106 C 140 119 60 119 42 106 Z", shade(C, 0.8), shadow=3)


# ------------------------------------------------------------------ a peasant
def peasant(take, weapon, k, tunic, head_fn, what, wfn, collar=None, wide=False):
    S = Sprite(f"THE MOB, the peasant with the {weapon} (round 12, set \"{take}\"): {what}. One of four small peasants who are one "
               f"hero together. The heroes' bust build drawn at {k} of a hero inside the usual box (each part carries the "
               f"scale; pivots are in the box's own frame), so the outline is the heroes' weight at the heroes' scale: draw "
               f"it with headR {round(56 * k)} and vr {round(22 * k, 1)}. " + LAYOUT)
    T = scl(k, 100, 100)
    piv = lambda p: (100 + (p[0] - 100) * k, 100 + (p[1] - 100) * k)
    S.group("arm-r", piv(PR), weapon, T=T)
    wfn(S)
    S.group("body", T=T)
    d = SHOULDERS if not wide else "M 14 108 C 14 80 50 72 100 72 C 150 72 186 80 186 108 C 186 136 150 144 100 144 C 50 144 14 136 14 108 Z"
    S.shape(d, tunic, decor=hi(58, 90, 20, 7, 0.16))
    if collar:
        S.shape(cloud(100, 104, 46, 11, 0.55), collar, shadow=4, T="translate(100 104) scale(1.14 0.84) translate(-100 -104)")
    head_fn(S)
    S.group("arm-l", piv(PL), "free hand", T=T)
    fist(S, 50, 146, -6, w=27, h=31)
    return save("heroes", f"mob-{weapon}-{take}", S)


SETS = {
    # the village: four kinds of headgear, four colours
    "village": [("torch", 0.6, "#5E8A4A", kerchief, "a red kerchief tied under the chin, a green dress", w_torch, {}),
                ("pitchfork", 0.6, "#5E7A9A", felt_hat, "a slouched grey felt hat with a dented crown, a blue smock", w_pitchfork, {}),
                ("axe", 0.6, "#9A3E36", bald_beard, "a bald woodcutter with a big black beard, a red shirt", w_axe, {}),
                ("dagger", 0.6, "#8A6238", point_hood, "an ochre hood with a long point that hangs back, a brown jerkin", w_dagger, {})],
    # one family: four sizes
    "family": [("torch", 0.54, "#7E5A9A", granny_bun, "the grandmother, the smallest but one: white hair in a big bun, a violet shawl", w_torch, dict(collar="#9A78B8")),
               ("pitchfork", 0.64, "#5E7A9A", flat_cap, "the father: a brown flat cap and a big moustache, a blue shirt", w_pitchfork, {}),
               ("axe", 0.72, "#9A3E36", bowl_cut, "the big son, the largest: a bowl of red hair, wide shoulders in a red shirt", w_axe, dict(wide=True)),
               ("dagger", 0.47, "#D9A441", tuft, "the child, the smallest: a tuft of blond hair, a yellow shirt, a kitchen knife", lambda S: w_dagger(S, True), {})],
    # the kitchen militia: the same sackcloth, four things from the kitchen for helmets
    "kitchen": [("torch", 0.6, SACK, colander, "a colander for a helmet, its two handles at the sides; sackcloth", w_torch, {}),
                ("pitchfork", 0.6, SACK, bucket, "a wooden bucket upside down on the head, its rope handle hanging; sackcloth", w_pitchfork, {}),
                ("axe", 0.6, SACK, pot, "an iron cooking pot for a helmet, its long handle out to one side; sackcloth", w_axe, {}),
                ("dagger", 0.6, SACK, funnel, "a tin funnel for a hat, its spout up; sackcloth", w_dagger, {})],
}
SCALE = {(t, w): k for t, rows in SETS.items() for w, k, *_ in rows}
BUILD = {}
for _t, _rows in SETS.items():
    for _w, _k, _col, _h, _what, _wf, _kw in _rows:
        BUILD[f"mob-{_w}-{_t}"] = (lambda t=_t, w=_w, k=_k, c=_col, h=_h, what=_what, wf=_wf, kw=_kw: peasant(t, w, k, c, h, what, wf, **kw))

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
