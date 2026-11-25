"""The Beekeeper, three takes (round 19). The designer (round 12, kits): "REDO... Overall don't like. Visuals or abilities
or animations"; round 13 gave him a new kit (Bee, Smoker, Beehive, Honey Glaze; trait Pollen) but kept the art. Parts as
the file in the game: the smoker in #arm-r (154 108), before the body (the fist shows over the shoulder's edge, the can
out in front), #body, a free fist in #arm-l (46 108), bees in #front."""
from r19 import *

HONEY, COPPER, WHITE = "#F2B32E", "#C9773C", "#F4F1E6"


def bee(S, x, y, a, k=1.0):
    T = frame(x, y, a)
    for s in (-1, 1):
        S.shape(ell(s * 7 * k, -3 * k, 6 * k, 4 * k), fill="#FFFFFF", T=T, shadow=0, side=False, catch=False)
    S.shape(ell(0, 4 * k, 7.5 * k, 9.5 * k), HONEY, T=T, shadow=0,
            decor=f'<rect x="-9" y="{f(1 * k)}" width="18" height="{f(3 * k)}" fill="#2B2230"/><rect x="-9" y="{f(6.5 * k)}" width="18" height="{f(3 * k)}" fill="#2B2230"/>')


def smoker(S, gloves):
    """The copper smoker held out in front of the right shoulder, spout forward, a puff of smoke coming off it."""
    T = frame(150, 138, 14)
    S.shape(rr(0, -12, 22, 16, 6), "#8E6240", T=T, shadow=0)  # bellows (under the shoulder)
    S.shape(rr(0, 20, 30, 34, 10), COPPER, T=T, shadow=0, decor=hi(-7, 10, 5, 9, 0.4) + f'<rect x="-15" y="28" width="30" height="4" fill="#8E4F22" opacity="0.6"/>')
    S.shape(blob([(-9, 36), (9, 36), (6, 44), (3, 52), (-3, 52), (-6, 44)], 0.6), shade(COPPER, 0.9), T=T, shadow=2)
    S.shape(circles([(-2, 60, 7), (6, 68, 6), (-1, 76, 5)]), "#EAE7E2", T=T, shadow=0, side=False)
    fist(S, 0, 0, T=T, w=24, h=21, hand=gloves)


def keeper(v):
    what = {"veil": "the beekeeper's suit: a round white hood with a black mesh window over the face, a honey-coloured band "
                    "at the brim, white shoulders with a honey-drop patch, honey leather gloves; the copper smoker puffing in the "
                    "right fist; three bees about him",
            "skep": "a straw skep (a domed hive of coiled straw) worn as a hat, its little door at the front, bees crawling on "
                    "it; a short honey-brown beard, a striped yellow-and-black scarf, a canvas apron over the shoulders; the "
                    "smoker in the right fist",
            "beard": "the bee-bearded keeper: a great beard that is a swarm of bees (honey and black, with wings), a wide "
                     "straw sun hat; a green smock; the smoker in the right fist, bees drifting off the beard"}[v]
    S = Sprite(f"BEEKEEPER (round 19, take \"{v}\"): {what}. " + LAYOUT + " The game draws the outline.")
    gl = "url(#gHandGlove)"
    S.add_def('<radialGradient id="gHandGlove" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F6D27A"/><stop offset="1" stop-color="#C8902E"/></radialGradient>')
    S.group("arm-r", PR, "the smoker")
    smoker(S, gl if v == "veil" else None)
    S.group("body")
    if v == "veil":
        S.shape(SHOULDERS, WHITE, decor=hi(56, 92, 18, 6, 0.3) + f'<path d="{blob([(150, 112), (156, 120), (150, 128), (144, 120)], 0.6)}" fill="{HONEY}"/>'
                + strokes("M 40 118 Q 100 132 160 118", "#D8D2C2", 2.4, 0.8))
        S.shape(ell(100, 132, 46, 14), "#E6E1D2", shadow=3)  # the collar where the hood meets the suit
        head(S)
        # the hood: a white dome, the mesh window over the face (drawn over the head), a honey band at its edge
        S.shape(blob([(46, 116), (44, 74), (62, 44), (100, 34), (138, 44), (156, 74), (154, 116), (128, 130), (100, 134), (72, 130)], 0.8), WHITE, shadow=4,
                decor=hi(74, 54, 16, 10, 0.5, -30) + strokes("M 62 48 Q 100 30 138 48", "#D8D2C2", 2.5, 0.8))
        mesh = "".join(strokes(f"M {x} 80 L {x} 160", "#55505A", 1.3, 0.8) for x in range(58, 146, 5)) + "".join(strokes(f"M 50 {y} L 150 {y}", "#55505A", 1.3, 0.8) for y in range(90, 156, 5))
        S.shape("M 60 104 C 64 88 82 82 100 82 C 118 82 136 88 140 104 C 140 126 124 146 100 148 C 76 146 60 126 60 104 Z", "#2E2A33", shadow=3,
                decor=f'<path d="{ell(100, 124, 30, 18)}" fill="#E8B58E" opacity="0.45"/>' + mesh + hi(82, 96, 10, 5, 0.25, -20))
        S.shape("M 56 104 C 60 84 80 76 100 76 C 120 76 140 84 144 104 L 138 104 C 134 90 118 84 100 84 C 82 84 66 90 62 104 Z", HONEY, shadow=2)
        S.group("arm-l", PL, "free gloved fist")
        fist(S, 57, 140, 0, w=24, h=21, hand=gl)
        S.group("front", None, "bees")
        bee(S, 24, 60, -30); bee(S, 182, 34, 25); bee(S, 30, 182, 160)
    elif v == "skep":
        STRAW = "#E2B35A"
        S.shape(SHOULDERS, "#C9B48A", decor=hi(56, 92, 18, 6, 0.25) + strokes("M 64 84 L 60 136 M 136 84 L 140 136", "#9E8A62", 4, 0.8))
        # striped scarf
        S.shape("M 66 120 C 78 140 122 140 134 120 L 132 146 C 118 156 82 156 68 146 Z", HONEY, shadow=3,
                decor="".join(f'<rect x="{x}" y="110" width="7" height="50" fill="#2B2230" transform="rotate(14 {x} 135)"/>' for x in range(70, 134, 15)))
        head(S)
        mouth(S, 132)
        S.shape("M 70 124 C 74 146 88 156 100 158 C 112 156 126 146 130 124 C 120 134 110 138 100 136 C 90 138 80 134 70 124 Z", "#A8692E", shadow=3)
        # the skep: coiled straw rings, a dome
        sk = blob([(48, 104), (44, 70), (60, 40), (100, 26), (140, 40), (156, 70), (152, 104), (100, 100)], 0.8)
        rings = "".join(strokes(f"M {44 + 7 * k} {100 - 14 * k} Q 100 {112 - 18 * k} {156 - 7 * k} {100 - 14 * k}", "#9A6A24", 4, 0.9) for k in range(6))
        S.shape(sk, STRAW, shadow=4, decor=rings + hi(76, 52, 16, 10, 0.35, -30))
        S.shape(circles([(46 + 4 * k, 96 - 13 * k, 6) for k in range(5)] + [(154 - 4 * k, 96 - 13 * k, 6) for k in range(5)]), STRAW, shadow=0, side=False)
        S.shape(rr(100, 96, 20, 10, 5), "#3A2A20", shadow=2)  # the hive's door, at the front
        S.group("arm-l", PL, "free fist")
        fist(S, 57, 140, 0, w=24, h=21)
        S.group("front", None, "bees: two on the skep, two in the air")
        bee(S, 78, 56, 40, 0.8); bee(S, 128, 70, -60, 0.8); bee(S, 22, 66, -20); bee(S, 184, 42, 30)
    else:
        S.shape(SHOULDERS, "#6F8F4E", decor=hi(56, 92, 18, 6, 0.25) + strokes("M 100 80 L 100 140", "#4E6A36", 2.4, 0.6))
        head(S)
        # the beard of bees: one fuzzy honey mass round the jaw, its bees picked out in black stripes and white wings
        bd = blob([(58, 112), (60, 140), (74, 162), (100, 176), (126, 162), (140, 140), (142, 112), (124, 130), (100, 134), (76, 130)], 0.8)
        dots = [(68, 134), (80, 150), (94, 162), (110, 160), (124, 148), (134, 132), (86, 138), (104, 146), (118, 136), (76, 120), (128, 120)]
        dec = "".join(f'<g transform="translate({x} {y}) rotate({(i * 47) % 360})"><ellipse cx="0" cy="0" rx="4.6" ry="6" fill="{HONEY}"/>'
                      f'<rect x="-5" y="-1.6" width="10" height="2.2" fill="#2B2230"/><rect x="-5" y="2.6" width="10" height="2" fill="#2B2230"/>'
                      f'<ellipse cx="-4" cy="-4" rx="3.4" ry="2.2" fill="#FFFFFF" opacity="0.9"/><ellipse cx="4" cy="-4" rx="3.4" ry="2.2" fill="#FFFFFF" opacity="0.9"/></g>'
                      for i, (x, y) in enumerate(dots))
        S.shape(bd, "#C88A1E", shadow=4, decor=dec)
        mouth(S, 126, "#8A5A30")
        # the straw sun hat: a wide brim, a low crown, a green band
        S.shape(blob([(22, 78), (34, 40), (70, 18), (100, 14), (130, 18), (166, 40), (178, 78), (150, 104), (100, 110), (50, 104)], 0.8), "#E8C877", shadow=4,
                decor="".join(strokes(f"M {30 + 8 * k} 80 Q 100 {100 - 4 * k} {170 - 8 * k} 80", "#C9A458", 1.8, 0.6) for k in range(0, 5)))
        S.shape(CROWN, "#D9B562", shadow=4, decor=hi(80, 40, 12, 7, 0.4, -30))
        S.shape(BAND, "#4E7A3A", shadow=1)
        S.group("arm-l", PL, "free fist")
        fist(S, 57, 140, 0, w=24, h=21)
        S.group("front", None, "bees drifting off the beard")
        bee(S, 64, 182, 150, 0.9); bee(S, 132, 188, 200, 0.9); bee(S, 18, 120, -70)
    return save("heroes", "beekeeper", v, S)


if __name__ == "__main__":
    for v in ("veil", "skep", "beard"):
        print(keeper(v))
