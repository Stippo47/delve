"""The Water Mage, three takes (round 19). Parts as the placeholder and every mage: the staff (or orb) in #arm-r with
the shoulder pivot (154 108) (her beam, cannon and bubbles come from that side: fx-water.js handOf), #body, an empty
fist in #arm-l (46 108). anim cast lifts both."""
from r19 import *

TEAL, DTEAL, FOAM, SEA = "#2C8C9C", "#1E5F7E", "#E6FAF5", "#3A9FD0"
CORAL = "#F07A6A"


def drop_gem(S, cx, cy, s=1.0):
    S.add_def('<linearGradient id="gDrop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFF0FF"/>'
              '<stop offset="0.5" stop-color="#2F8FE0"/><stop offset="1" stop-color="#163E9A"/></linearGradient>')
    d = (f"M {f(cx)} {f(cy - 13 * s)} C {f(cx + 5 * s)} {f(cy - 6 * s)} {f(cx + 10 * s)} {f(cy - 1 * s)} {f(cx + 10 * s)} {f(cy + 6 * s)} "
         f"A {f(10 * s)} {f(10 * s)} 0 0 1 {f(cx - 10 * s)} {f(cy + 6 * s)} C {f(cx - 10 * s)} {f(cy - 1 * s)} {f(cx - 5 * s)} {f(cy - 6 * s)} {f(cx)} {f(cy - 13 * s)} Z")
    S.shape(d, fill="url(#gDrop)", shadow=2, side=False,
            decor=f'<path d="{ell(cx - 3.5 * s, cy + 2 * s, 2.6 * s, 4 * s)}" fill="#E8FBFF" opacity="0.9"/>')


def foam_ruff(S, col=FOAM, r0=11.5, jitter=True):
    """The frost mage's fur ruff round the face, as sea foam: bubbles of mixed size along the hood's edge."""
    cs = []
    pts = [(144, 142), (148, 130), (146, 117), (138, 106), (125, 97), (109, 93), (91, 93), (75, 97), (62, 106), (54, 117), (52, 130), (56, 142)]
    for i, (x, y) in enumerate(pts):
        r = r0 * (1.0 if not jitter else (1.08, 0.86, 1.0, 0.92, 1.1, 0.9)[i % 6])
        cs.append((x, y, r))
    small = [(152, 138, 5), (151, 112, 4.5), (131, 96, 5), (100, 87, 5.5), (69, 96, 5), (49, 112, 4.5), (48, 138, 5)]
    S.shape(circles(cs + small), col, shadow=3, decor="".join(
        f'<path d="{circ(x - r * 0.35, y - r * 0.35, r * 0.28)}" fill="#FFFFFF" opacity="0.7"/>' for x, y, r in cs[::2]))


def staff_driftwood(S, ball=15):
    B, F = (188, 46), (152, 160)
    T, a = pole(S, B, F, 9, "#A87444", decor=strokes("M -1 -60 L 0 -10", "#7A4E2C", 2.2, 0.5))
    # a crook of driftwood cupping the ball
    S.shape(taper([(0, -4), (-11, 6), (-14, 20), (-8, 32)], 7, 4), "#9A6A3E", T=T, shadow=0)
    water_ball(S, 2, 18, ball, T=T)
    fist(S, *grip(B, F, (152, 140)), a)
    return T


def water(v):
    what = {"wave": "a deep-teal hood that rises at the back into a breaking wave, its lip curling over in white foam; a ruff "
                    "of sea foam round the face; a water-drop gem at the brow; a driftwood staff cupping a ball of water in the "
                    "right fist (behind the body); an empty left fist",
            "orb": "no hood: long sea-blue hair caught up in a great curl like a wave, a circlet of shells and one pearl; a "
                   "shawl of fishing net with cork floats over teal robes; a ball of water held up in the open right hand (in "
                   "front of the body), turning; an empty left fist",
            "shell": "a sea priestess: a tall conch shell worn as a hood (its spiral at the back), coral-pink lip round the face, "
                     "fin-like frills over the ears; a staff of coral with a ball of water caught in its branches in the right "
                     "fist (behind the body); an empty left fist"}[v]
    S = Sprite(f"WATER MAGE (round 19, take \"{v}\"): {what}. " + LAYOUT + " The game draws the outline.")
    if v == "wave":
        S.group("arm-r", PR, "the driftwood staff and its ball of water")
        staff_driftwood(S)
        S.group("body")
        robe(S, DTEAL, FOAM, 8, decor=strokes("M 34 118 Q 46 110 58 118 Q 70 126 82 118", "#7FD3D6", 3, 0.6)
             + strokes("M 118 118 Q 130 110 142 118 Q 154 126 166 118", "#7FD3D6", 3, 0.6))
        head(S)
        mouth(S)
        # the wave: drawn first (behind the hood), rising off its back and curling over to the left
        crest = blob([(70, 64), (64, 40), (72, 16), (92, 2), (118, 0), (138, 10), (146, 26), (140, 40), (130, 44), (126, 32),
                      (114, 24), (102, 28), (108, 40), (124, 54), (130, 66)], 0.7)
        for x, y, r in ((150, 48, 4.5), (156, 34, 3.5), (146, 58, 3)):
            S.shape(circ(x, y, r), FOAM, shadow=0, side=False)
        S.shape(crest, TEAL, shadow=0, decor=(f'<path d="{blob([(124, 2), (146, 20), (142, 42), (130, 46), (124, 34), (112, 24), (104, 30), (108, 16)], 0.7)}" fill="{FOAM}"/>'
                                               + f'<path d="{circles([(136, 46, 4), (124, 48, 3), (144, 36, 3.4)])}" fill="{FOAM}"/>'
                                               + strokes("M 74 58 Q 76 30 96 16", "#9FE6E6", 4, 0.55)))
        S.shape(HOOD, TEAL, shadow=4, decor=hi(72, 62, 16, 9, 0.22, -30)
                + strokes("M 60 78 Q 72 66 84 74 Q 96 82 108 70", "#7FD3D6", 3.2, 0.5)
                + strokes("M 104 56 Q 116 46 128 54 Q 138 60 146 52", "#7FD3D6", 3.2, 0.5))
        foam_ruff(S)
        drop_gem(S, 100, 70, 1.15)
        free(S, "l")
    elif v == "orb":
        HAIR, ROBE = "#3E9E8E", "#2D4F8C"
        S.group("body")
        robe(S, ROBE, "#C9A26A", 7)
        # the net shawl over the shoulders, its floats along the hem
        net = "M 30 110 C 34 90 60 82 100 82 C 140 82 166 90 170 110 C 152 118 128 122 100 122 C 72 122 48 118 30 110 Z"
        mesh = "".join(strokes(f"M {x} 70 L {x + 40} 130", "#2B4A55", 1.6, 0.45) + strokes(f"M {x + 40} 70 L {x} 130", "#2B4A55", 1.6, 0.45) for x in range(20, 180, 14))
        S.shape(net, "#B9D9D2", shadow=3, decor=mesh)
        for x, y in ((40, 114), (62, 121), (138, 121), (160, 114)):
            S.shape(ell(x, y, 6, 4.6), "#D99A4E", shadow=2)
        # long wavy locks over both shoulders (under the head)
        for s in (-1, 1):
            lock = [(100 + s * 30, 70), (100 + s * 52, 84), (100 + s * 60, 100), (100 + s * 70, 112), (100 + s * 74, 126)]
            S.shape(taper(lock, 21, 9), HAIR, shadow=3, decor=strokes(" ".join(("M" if i == 0 else "L") + f" {f(x)} {f(y)}" for i, (x, y) in enumerate(lock)), light(HAIR, 1.35), 2.6, 0.5))
        head(S)
        mouth(S)
        cap = "M 52 104 C 48 64 70 44 100 44 C 130 44 152 64 148 104 C 140 92 124 86 112 88 C 106 84 94 84 88 88 C 76 86 60 92 52 104 Z"
        S.shape(cap, HAIR, shadow=4, decor=hi(74, 62, 14, 8, 0.25, -30) + strokes("M 100 86 Q 98 66 100 46", shade(HAIR, 0.7), 2.5, 0.6)
                + strokes("M 64 92 Q 70 70 88 58", light(HAIR, 1.35), 2.6, 0.6) + strokes("M 136 92 Q 130 70 112 58", light(HAIR, 1.35), 2.6, 0.6)
                + strokes("M 76 90 Q 80 72 94 62", shade(HAIR, 0.75), 2.2, 0.5) + strokes("M 124 90 Q 120 72 106 62", shade(HAIR, 0.75), 2.2, 0.5))
        # a bun at the back, pinned with a starfish
        S.shape(circ(100, 34, 18), HAIR, shadow=3, decor=strokes(spiral(100, 34, 2, 14, 1.3), shade(HAIR, 0.72), 2.4, 0.6) + hi(93, 27, 6, 4, 0.3))
        S.shape(blob(star(116, 26, 10.5, 6, 5, 12), 0.5), "#F29A5A", shadow=2, decor="".join(f'<path d="{circ(x, y, 1.3)}" fill="#FFE2C4"/>' for x, y in star(116, 26, 6, 6, 5, 12)[::2]))
        # the circlet: small shells and a pearl at the brow
        S.shape("M 56 98 C 66 84 84 78 100 78 C 116 78 134 84 144 98 C 140 98 138 96 134 94 C 124 88 112 85 100 85 C 88 85 76 88 66 94 C 62 96 60 98 56 98 Z", "#E8D9B6", shadow=2)
        for x, y, a in ((72, 88, -30), (128, 88, 30)):
            S.shape(blob([(-7, 4), (-5, -4), (0, -7), (5, -4), (7, 4), (0, 6)], 0.7), "#F3B4A2", T=frame(x, y, a), shadow=2,
                    decor="".join(strokes(f"M 0 5 L {dx} -5", "#C9786A", 1.4, 0.7) for dx in (-4, 0, 4)))
        S.shape(circ(100, 82, 7), "#F6F2F8", shadow=2, decor=hi(97, 79, 3, 2, 0.9))
        # the orb, held up over the open right hand (in front of the body)
        S.group("arm-r", PR, "the right hand held open under a ball of water")
        S.shape(ell(150, 150, 13, 6), "#2F7FB8", shadow=0, side=False, sop=0.2)
        fist(S, 150, 140, -12, w=25, h=21)
        water_ball(S, 150, 156, 17)
        free(S, "l")
    else:
        SHELL, LIP = "#F2E2C8", "#F08F7E"
        B, F = (184, 48), (150, 150)
        S.group("arm-r", PR, "the coral staff, a ball of water caught in its branches")
        T, a = pole(S, B, F, 9, CORAL)
        for pts in ([(0, -6), (-10, 6), (-16, 14)], [(0, -6), (10, 4), (17, 10)], [(0, -20), (-9, -30)]):
            S.shape(taper(pts, 7, 4.5), CORAL, T=T, shadow=0)
        water_ball(S, 0, 16, 14, T=T)
        for x, y in ((-16, 14), (17, 10)):
            S.shape(circ(x, y, 3.6), light(CORAL, 1.1), T=T, shadow=0)
        fist(S, *grip(B, F, (152, 140)), a)
        S.group("body")
        robe(S, SEA, "#F2E2C8", 7, decor="".join(f'<path d="{circ(x, 124, 2.6)}" fill="#FFFFFF" opacity="0.45"/>' for x in range(38, 170, 16)))
        # fin frills on the shoulders, over the ears
        for s in (-1, 1):
            fin = [(100 + s * 46, 98), (100 + s * 64, 84), (100 + s * 78, 90), (100 + s * 72, 104), (100 + s * 80, 116), (100 + s * 60, 118)]
            S.shape(blob(fin, 0.7), "#5FC4C8", shadow=3, decor="".join(strokes(f"M {100 + s * 50} 106 L {100 + s * (62 + 8 * k)} {86 + 10 * k}", "#2C8C9C", 2, 0.6) for k in range(3)))
        head(S)
        mouth(S)
        # the conch: its body a long spiral cone running back from the face, the lip round the face
        S.shape(blob([(56, 108), (50, 70), (66, 30), (88, 0), (104, -8), (120, 2), (140, 32), (150, 72), (144, 108), (100, 96)], 0.75), SHELL, shadow=4,
                decor="".join(strokes(f"M {44 + 6 * k} {100 - 24 * k} Q 100 {60 - 24 * k} {156 - 6 * k} {70 - 24 * k}", "#C9A880", 3.2, 0.75) for k in range(5))
                + "".join(f'<path d="{circ(100 + dx, y, 3.4)}" fill="#D9B990"/>' for dx, y in ((-30, 74), (30, 74), (-22, 50), (22, 50), (-12, 28), (12, 28)))
                + hi(76, 44, 12, 18, 0.3, -20))
        for x, y in ((50, 70), (150, 70), (58, 44), (142, 44), (70, 22), (130, 22)):
            S.shape(blob([(x - 6, y + 4), (x - 1 if x < 100 else x + 1, y - 9), (x + 6, y + 4)], 0.6), shade(SHELL, 0.95), shadow=2)
        S.shape(circ(104, -2, 8), light(SHELL, 1.05), shadow=2, decor=strokes(spiral(104, -2, 1, 6.5, 1.4), "#C9A880", 1.8, 0.8))
        lip = "M 46 122 C 40 88 66 70 100 70 C 134 70 160 88 154 122 C 148 104 130 96 100 96 C 70 96 52 104 46 122 Z"
        S.shape(lip, LIP, shadow=3, decor=strokes("M 52 112 C 56 94 76 82 100 82 C 124 82 144 94 148 112", "#FFD0C4", 3, 0.6))
        S.shape(circ(100, 84, 7.5), "#F6F2F8", shadow=2, decor=hi(97, 81, 3, 2, 0.9))
        free(S, "l")
    return save("heroes", "waterMage", v, S)


if __name__ == "__main__":
    for v in ("wave", "orb", "shell"):
        print(water(v))
