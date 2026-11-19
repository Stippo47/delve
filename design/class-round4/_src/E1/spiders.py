"""Spiders: three base-spider styles (A hunter, B widow, C jumper) and D the momma spider. python spiders.py [a b c d]"""
import math
from lib import *


def legs(S, side, specs, light, dark, shade=0.25, bands=None):
    """specs: list of (hip, knee, foot, w0, w1) for the RIGHT side; mirrored for side=-1."""
    for hip, knee, foot, w0, w1 in specs:
        pts = [hip, knee, foot]
        if side < 0:
            pts = [(200 - x, y) for x, y in pts]
        mid = ((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2)
        mid2 = ((pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2)
        d = stroke_path([pts[0], mid, pts[1], mid2, pts[2]], w0, w1, 0.9)
        dec = None
        if bands:
            dec = [f'<path d="{circ(pts[1][0], pts[1][1], w0 * 0.62)}" fill="{bands}" opacity="0.9"/>']
        S.shape(d, S.lg(light, dark, x2=0.6, y2=1), shadow=False, shade=shade, decor=dec)


def mirror_specs(specs):
    return specs


# ----------------------------------------------------------------------------- A: hunter
def spider_a():
    S = Sprite('SPIDER A "hunter" (round 4): a chunky wolf spider. Grey-brown, a big oval abdomen behind with a dark '
               'arrow mark, a front body with two big eyes and four small ones, two fangs, eight thick bent legs. '
               'About 85% of the archer. Parts: #arm-l, #arm-r = the four legs on each side (pivot where they join; '
               'rock them in turn to walk; before #body), #body = abdomen, front body, eyes, fangs. Facing = DOWN (+y).')
    specs = [((112, 128), (148, 124), (144, 166), 13, 8),
             ((116, 120), (158, 104), (174, 138), 13, 8),
             ((116, 112), (158, 84), (178, 64), 13, 8),
             ((112, 104), (148, 70), (144, 30), 13, 8)]
    for side, gid in ((-1, "arm-l"), (1, "arm-r")):
        S.group(gid, (100 + side * 14, 116))
        legs(S, side, specs, "#9A8A76", "#5E5244")
    S.group("body")
    S.shape(ell(100, 68, 36, 40), S.lg("#A89680", "#6A5C4A", x2=0.6, y2=1), shadow=False, shade=0.35, hi=0.3,
            decor=[f'<path d="{blob([(100, 32), (112, 54), (110, 80), (100, 104), (90, 80), (88, 54)], 0.9)}" fill="#4E4234" opacity="0.7"/>',
                   f'<path d="{" ".join(circ(100 + sx * 22, y, 4) for sx in (-1, 1) for y in (52, 70, 88))}" fill="#D8C8B0" opacity="0.7"/>'])
    S.shape(ell(100, 122, 27, 28), S.lg("#9A8A76", "#5E5244", x2=0.6, y2=1), sh=5, shade=0.3, hi=0.3)
    # fangs
    S.flat(f"{rr(91, 150, 9, 12, 4)} {rr(109, 150, 9, 12, 4)}", "#3A3028")
    for x, y, r in ((89, 132, 6.5), (111, 132, 6.5), (80, 122, 3.6), (120, 122, 3.6), (92, 118, 3), (108, 118, 3)):
        S.flat(circ(x, y, r), INK)
        S.flat(circ(x - r * 0.3, y - r * 0.35, max(1.2, r * 0.3)), "#FFFFFF")
    return S


# ----------------------------------------------------------------------------- B: widow
def spider_b():
    S = Sprite('SPIDER B "widow" (round 4): a glossy black widow. A big shiny round abdomen with a red hourglass, a small '
               'head with red eyes, eight long arched legs. About 85% of the archer (long legs). Parts: #arm-l, #arm-r = '
               'the legs, #body = abdomen, head. Facing = DOWN (+y).')
    specs = [((108, 128), (140, 138), (150, 178), 9, 5),
             ((112, 122), (156, 112), (182, 138), 9, 5),
             ((112, 116), (156, 84), (186, 76), 9, 5),
             ((108, 110), (142, 62), (158, 26), 9, 5)]
    for side, gid in ((-1, "arm-l"), (1, "arm-r")):
        S.group(gid, (100 + side * 10, 118))
        legs(S, side, specs, "#4A4460", "#221E30", shade=0.2)
    S.group("body")
    S.shape(circ(100, 74, 40), S.lg("#4E4868", "#1E1A2A", x2=0.6, y2=1), shadow=False, shade=0.3,
            decor=[f'<path d="{poly([(88, 54), (112, 54), (100, 72)])} {poly([(100, 76), (112, 94), (88, 94)])}" fill="#E83A3A"/>',
                   f'<path d="{ell(84, 56, 12, 8)}" fill="#FFFFFF" opacity="0.35"/>'])
    S.shape(ell(100, 124, 19, 21), S.lg("#4E4868", "#221E30", x2=0.6, y2=1), sh=5, shade=0.3, hi=0.25)
    S.flat(f"{rr(93, 145, 7, 9, 3)} {rr(107, 145, 7, 9, 3)}", "#2A2436")
    for x, y, r in ((93, 132, 4.2), (107, 132, 4.2), (88, 124, 2.6), (112, 124, 2.6)):
        S.flat(circ(x, y, r), "#FF4A4A")
    return S


# ----------------------------------------------------------------------------- C: jumper
def spider_c():
    S = Sprite('SPIDER C "jumper" (round 4): a fuzzy jumping spider. A big square-ish head at the front with two huge '
               'glossy eyes, shiny teal fangs, a black abdomen with white spots and an orange band, short thick legs '
               '(the front pair raised and bigger). About 75% of the archer. Parts: #arm-l, #arm-r = the legs, #body = '
               'abdomen, head, eyes, fangs. Facing = DOWN (+y).')
    specs = [((116, 132), (146, 140), (142, 168), 17, 12),
             ((120, 122), (150, 116), (164, 136), 13, 9),
             ((120, 112), (150, 98), (166, 88), 13, 9),
             ((114, 100), (138, 78), (146, 56), 13, 9)]
    for side, gid in ((-1, "arm-l"), (1, "arm-r")):
        S.group(gid, (100 + side * 18, 118))
        legs(S, side, specs, "#5A505A", "#241E26", shade=0.2)
    S.group("body")
    S.shape(ell(100, 72, 30, 34), S.lg("#4A4048", "#1E1A20", x2=0.6, y2=1), shadow=False, shade=0.3,
            decor=[f'<path d="{rr(100, 92, 64, 12, 6)}" fill="#F08A2A"/>',
                   f'<path d="{circ(88, 58, 6)} {circ(112, 58, 6)} {circ(92, 76, 4.5)} {circ(108, 76, 4.5)}" fill="#F4EEE2"/>'])
    S.shape(rr(100, 126, 64, 50, 22), S.lg("#5A505A", "#2A2430", x2=0.6, y2=1), sh=5, shade=0.3, hi=0.25)
    # teal fangs
    S.shape(f"{ell(91, 154, 8, 9)} {ell(109, 154, 8, 9)}", S.lg("#7AE0D0", "#2A8A90"), sh=3, shade=0.2)
    for x, y, r in ((87, 136, 12), (113, 136, 12), (72, 124, 4.5), (128, 124, 4.5)):
        S.flat(circ(x, y, r), "#141018")
        S.flat(circ(x - r * 0.3, y - r * 0.35, max(1.4, r * 0.32)), "#FFFFFF")
    return S


# ----------------------------------------------------------------------------- D: momma
def spider_d():
    S = Sprite('SPIDER D "momma" (round 4): the big web-shooter, about 125% of the archer. A dusky plum spider with a '
               'huge abdomen carrying a clutch of pale spiderlings on her back, a silk-white spinneret tuft behind, '
               'a crown of eyes, big fangs, eight long heavy legs. Parts: #arm-l, #arm-r = the legs, #body = abdomen, '
               'babies, head. Facing = DOWN (+y).', k=1.0)
    specs = [((112, 136), (150, 138), (158, 186), 15, 9),
             ((118, 126), (166, 112), (192, 140), 15, 9),
             ((118, 114), (168, 86), (196, 66), 15, 9),
             ((112, 102), (150, 58), (164, 14), 15, 9)]
    for side, gid in ((-1, "arm-l"), (1, "arm-r")):
        S.group(gid, (100 + side * 14, 120))
        legs(S, side, specs, "#8A6A8A", "#4A3450", bands="#B898B8")
    S.group("body")
    # silk tuft (spinnerets) at the back
    S.shape(circ(100, 18, 20), S.lg("#FFFFFF", "#D4CCDC"), shadow=False, shade=0.2,
            decor=[f'<path d="{ell(94, 12, 8, 5)}" fill="#FFFFFF"/>'])
    S.shape(ell(100, 66, 50, 52), S.lg("#9A789A", "#4E3854", x2=0.6, y2=1), shadow=False, shade=0.35,
            decor=[f'<path d="{ell(100, 66, 30, 34)}" fill="#B090B0" opacity="0.35"/>'])
    # spiderlings riding on her back
    for x, y in ((80, 54), (118, 50), (100, 76), (78, 90), (124, 86)):
        S.shape(circ(x, y, 9), S.lg("#D8B8D8", "#9A709A"), sh=3, shade=0.25)
        S.flat(f"{circ(x - 3, y + 5, 1.7)} {circ(x + 3, y + 5, 1.7)}", "#E8304A")
    S.shape(ell(100, 132, 32, 30), S.lg("#9A789A", "#4E3854", x2=0.6, y2=1), sh=6, shade=0.3, hi=0.3)
    S.flat(f"{rr(89, 164, 12, 16, 5)} {rr(111, 164, 12, 16, 5)}", "#3A2640")
    for x, y, r in ((89, 144, 7.5), (111, 144, 7.5), (78, 134, 4.5), (122, 134, 4.5), (92, 128, 3.6), (108, 128, 3.6)):
        S.flat(circ(x, y, r), "#E8304A" if r > 7 else INK)
        S.flat(circ(x - r * 0.3, y - r * 0.35, max(1.3, r * 0.3)), "#FFFFFF")
    return S


TAKES = {"a": (spider_a, "spider-a-hunter.svg", "Spider A hunter"),
         "b": (spider_b, "spider-b-widow.svg", "Spider B widow"),
         "c": (spider_c, "spider-c-jumper.svg", "Spider C jumper"),
         "d": (spider_d, "spider-d-momma.svg", "Spider D momma")}

if __name__ == "__main__":
    want = sys.argv[1:] or list(TAKES)
    render([(TAKES[t][0]().write(TAKES[t][1]), TAKES[t][2]) for t in want])
