"""Round 8, part 2: the poacher, the bandit brute and the Bandit Chief (the rest of the Wildwood's people), on the same
gang look as bandits8.py. python bandits8_more.py [name ...]   -> ../../enemies/bandit-*.svg"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from bandits8 import *


def poacher():
    S = Sprite("POACHER (round 8): a woodland hunter, not one of the masked gang: a drab olive hood (not the archer's "
               "leaf green) with its tail lying back, a scruffy brown beard, a grey fur mantle over leather; a short dark "
               "recurve bow held out in front (arm-l, with its string, which the game draws to the drawing hand) and an "
               "arrow in the drawing hand (arm-r); a rolled net slung on the back (#back), for the net it throws. No eyes. "
               + LAYOUT)
    OLIVE = "#6E6C3C"
    S.group("back", (100, 64), "rolled net")
    S.shape(ell(100, 40, 34, 22), "#C9B58A", shadow=0,
            decor=strokes("M 70 28 L 96 60 M 82 20 L 112 60 M 98 18 L 128 56 M 116 20 L 132 38 "
                          "M 130 28 L 104 60 M 118 20 L 88 60 M 102 18 L 72 54 M 84 20 L 68 38", "#8A7650", 2.6, 0.75))
    S.shape(rr(100, 40, 72, 7, 3), "#7A5A3A", shadow=2)
    S.group("body")
    S.shape(RAGS, "#8A6440")
    S.shape(cloud(100, 106, 48, 15, 0.6), "#8E8A86", shadow=3, T="translate(100 106) scale(1 0.82) translate(-100 -106)")
    head(S)
    beard = blob([(70, 136), (80, 144), (90, 148), (100, 149), (110, 148), (120, 144), (130, 136), (132, 148), (124, 158),
                  (112, 164), (100, 170), (88, 164), (76, 158), (68, 148)], 0.7)
    S.shape(beard, "#6A4A30", shadow=3)
    mouth(S, 139, "#9A6A58")
    S.shape(strip([(104, 52), (118, 36), (136, 26), (150, 24)], 15, taper=(0.75, 1.0)), shade(OLIVE, 0.9), shadow=0)
    S.shape(blob([(46, 116), (42, 76), (56, 48), (78, 34), (100, 30), (122, 34), (144, 48), (158, 76), (154, 116),
                  (142, 108), (140, 88), (122, 76), (100, 74), (78, 76), (60, 88), (58, 108)], 0.8), OLIVE, shadow=4)
    S.group("arm-l", PL, "bow, string and the hand holding it")
    S.raw('<path id="string" d="M30 146 L100 158 L170 146" fill="none" stroke="#EDE3CC" stroke-width="2.5" '
          'stroke-linecap="round" stroke-linejoin="round"/>')
    outer = [(24, 144), (48, 162), (74, 176), (100, 181), (126, 176), (152, 162), (176, 144)]
    inner = [(x, y - 8) for x, y in outer[::-1]]
    S.shape(blob(outer + inner, 0.5), "#5A3A26", shadow=0,
            decor=f'<path d="{circ(26, 139, 7)} {circ(174, 139, 7)}" fill="#2E2018"/>')
    S.shape(rr(100, 180, 30, 13, 4), "#A07A50", shadow=1)
    fist(S, 100, 180, 90, w=21, h=24)
    S.group("arm-r", PR, "arrow and the drawing hand")
    S.shape(rr(100, 176, 4, 40, 2), "#8A6440", shadow=0)
    S.shape(poly([(93, 192), (100, 206), (107, 192)]), STEEL, shadow=1)
    fist(S, 100, 160, 90, w=20, h=22)
    return save("enemies", "bandit-poacher", S)


def club(S, T, L=82):
    """A big studded club: a thick wooden club swelling to a rounded end, iron studs and short iron spikes."""
    S.shape(blob([(-6, -16), (6, -16), (9, 20), (16, L - 20), (14, L - 2), (0, L + 6), (-14, L - 2), (-16, L - 20), (-9, 20)], 0.85),
            "#A0703F", T=T, shadow=0, decor=strokes(f"M 6 0 L 9 {L - 20}", "#C69458", 3, 0.5))
    for x, y in ((-15, L - 30), (15, L - 22), (-13, L - 10), (13, L - 4), (0, L + 4)):
        sx = -1 if x < 0 else 1
        if x == 0:
            S.shape(poly([(-5, y - 2), (5, y - 2), (0, y + 10)]), "#9AA2AE", T=T, shadow=0, side=False)
        else:
            S.shape(poly([(x - sx * 2, y - 5), (x - sx * 2, y + 5), (x + sx * 9, y)]), "#9AA2AE", T=T, shadow=0, side=False)
    for x, y in ((-5, L - 36), (6, L - 26), (-6, L - 14), (5, L - 6)):
        S.shape(circ(x, y, 3.2), "#6E747E", T=T, shadow=0, side=False)
    S.shape(rr(0, 18, 20, 8, 3), "#6E747E", T=T, shadow=1)
    fist(S, 0, 0, T=T, w=24, h=28)


BRUTE_FACE = ('<linearGradient id="gFaceBrute" x1="0" y1="47" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
              '<stop offset="0" stop-color="#F0C49E"/><stop offset="0.3" stop-color="#E9B892"/>'
              '<stop offset="0.55" stop-color="#F2C7A0"/><stop offset="0.85" stop-color="#F4CBA6"/>'
              '<stop offset="1" stop-color="#E6B590"/></linearGradient>')


def brute():
    S = Sprite("BANDIT BRUTE (round 8): the gang's heavy: a bald, scarred head over the red bandanna, broad shoulders in "
               "patched leather with a shaggy fur collar; a big studded club with short iron spikes in the right hand "
               "(arm-r, under the shoulder, pointing forward), a big bare fist in leather wraps on the left (arm-l). "
               "No eyes. " + LAYOUT)
    S.add_def(BRUTE_FACE)
    S.group("arm-r", (156, 108), "big club")
    club(S, frame(158, 124, 10), L=70)
    S.group("body")
    S.shape("M14 108 C14 80 50 72 100 72 C150 72 186 80 186 108 L182 128 Q174 148 152 140 Q138 154 118 144 Q100 156 82 144 "
            "Q62 154 48 140 Q26 148 18 128 Z", "#8E5E34",
            decor=f'<path d="{rr(150, 102, 26, 20, 5)}" fill="#6E4A2A" opacity="0.6"/>')
    S.shape(cloud(100, 100, 50, 14, 0.62), "#6E5A44", shadow=3, T="translate(100 100) scale(1.12 0.7) translate(-100 -100)")
    head(S, face="url(#gFaceBrute)")
    S.raw('<path d="M 74 62 L 90 84" fill="none" stroke="#C88E6E" stroke-width="5" stroke-linecap="round"/>')
    masked(S)
    S.group("arm-l", (44, 108), "bare fist")
    fist(S, 40, 148, -6, w=26, h=30)
    S.shape(rr(40, 136, 30, 9, 4), "#7A5A3A", T="rotate(-6 40 136)", shadow=1)
    return save("enemies", "bandit-brute", S)


def cutlass(S, T, L=62):
    S.shape(rr(0, -10, 9, 22, 4), "#3E2A22", T=T, shadow=0)
    blade = blob([(-8, 8), (8, 8), (12, 30), (12, 50), (4, L + 4), (-2, L), (-6, 40), (-8, 22)], 0.8)
    S.shape(blade, STEEL, T=T, shadow=2,
            decor=f'<path d="{poly([(2, 8), (8, 8), (12, 30), (12, 50), (4, L + 4)])}" fill="#7E8696" opacity="0.4"/>')
    S.shape(rr(0, 4, 30, 8, 3), GOLD, T=T, shadow=1)
    S.shape(blob([(-15, 2), (-12, -12), (0, -20), (12, -12), (15, 2), (9, 1), (7, -8), (0, -12), (-7, -8), (-9, 1)], 0.7),
            GOLD, T=T, shadow=1)
    fist(S, 0, -8, T=T)


def chief():
    S = Sprite("THE BANDIT CHIEF (round 8): the gang's boss: a black tricorn hat with a gold edge and a red plume lying "
               "back, the gang's red bandanna, a long black coat with a high collar and gold trim, a bandolier of "
               "throwing knives over the left shoulder; a gold-hilted cutlass in the right hand "
               "(arm-r, under the shoulder) and a black smoke bomb with a short fuse in the left (arm-l). No eyes. "
               + LAYOUT)
    CRIMSON = "#3E3846"
    S.group("back", (100, 90), "coat tails")
    S.shape(blob([(52, 96), (148, 96), (156, 40), (126, 18), (100, 24), (74, 18), (44, 40)], 0.8), shade(CRIMSON, 0.85), shadow=0)
    S.group("arm-r", PR, "cutlass")
    cutlass(S, frame(162, 134, 10))
    S.group("body")
    S.shape(SHOULDERS, CRIMSON, decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", GOLD, 4, 0.9))
    S.shape(blob([(46, 112), (44, 84), (62, 70), (100, 66), (138, 70), (156, 84), (154, 112), (138, 98), (100, 94), (62, 98)], 0.8),
            shade(CRIMSON, 0.9), shadow=3, decor=strokes("M 48 108 C 50 88 70 78 100 76 C 130 78 150 88 152 108", GOLD, 3.5, 0.85))
    S.shape("M 64 72 L 80 74 L 50 132 L 34 126 Z", "#7A5236", shadow=2)
    for x, y in ((70, 84), (61, 101), (52, 118)):
        S.shape(rr(x, y, 8, 15, 3), "#C9CED6", T=f"rotate(28 {x} {y})", shadow=1)
    head(S)
    masked(S)
    hat = blob([(100, 22), (128, 34), (160, 52), (156, 76), (142, 100), (120, 112), (100, 116), (80, 112), (58, 100), (44, 76),
                (40, 52), (72, 34)], 0.85)
    pf, ph = feather([(112, 46), (122, 26), (136, 10), (148, 2)], 14)
    S.shape(pf, "#D8463F", shadow=0, decor=f'<path d="{ph}" fill="{shade("#D8463F", 0.8)}" opacity="0.6"/>')
    S.shape(hat, "#2E2A34", shadow=5, decor=strokes("M 44 72 C 60 94 80 104 100 106 C 120 104 140 94 156 72", GOLD, 4, 0.9)
            + f'<path d="{ell(100, 62, 30, 24)}" fill="#46404E"/>')
    S.group("arm-l", PL, "smoke bomb")
    fist(S, 46, 144, -6)
    S.shape(circ(42, 166, 14), "#3A3440", shadow=3, decor='<circle cx="37" cy="161" r="4.5" fill="#6E6878"/>')
    S.shape(rr(42, 182, 4, 8, 2), "#C9B58A", shadow=1)
    S.shape(circ(42, 188, 4), "#FFC24A", shadow=0, side=False)
    return save("enemies", "bandit-chief", S)


MORE = {"bandit-poacher": poacher, "bandit-brute": brute, "bandit-chief": chief}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(MORE):
        print(MORE[n]().relative_to(ROOT5).as_posix())
