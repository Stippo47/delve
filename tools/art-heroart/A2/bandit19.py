"""The Bandit (hero, kind rogueBandit), three takes (round 19). The designer (round 12, kits): "Overall don't like hero";
round 13 and rogue19 rebuilt the kit (Hostage, Dirty Trick, Bolas, Light Fingers; Disarmed takes his cutlass) but the art
stayed the round-5 red bandanna, which the Wildwood's enemy bandits also wear. Parts as art/heroes/bandit.svg: the
cutlass in #arm-r (154 108) before the body, #body, a free fist in #arm-l (46 108). The blade's fills are steel, its grip
wood and brass, so Disarmed can lift the cutlass out of the fist (parts.js bareArm)."""
from r19 import *

STEEL_, DSTEEL_ = "#D3D8E0", "#9AA2AE"


def cutlass(S, x=150, y=146, a=-14, L=58):
    """A cutlass held forward from the right fist: a brass knuckle-bow, a curved blade bellying out (+y forward)."""
    T = frame(x, y, a)
    S.shape(rr(0, -10, 8, 18, 3), "#6A4426", T=T, shadow=0)                         # the grip (in the fist)
    S.shape("M -12 2 C -14 -6 -10 -14 -2 -16 L 0 -12 C -6 -10 -9 -5 -8 2 Z", "#D9A441", T=T, shadow=0)   # knuckle-bow
    S.shape(rr(0, 4, 22, 6, 3), "#D9A441", T=T, shadow=0)
    blade = f"M -4 6 C -6 {f(L * 0.4)} -4 {f(L * 0.8)} 4 {f(L + 6)} C 12 {f(L * 0.85)} 14 {f(L * 0.5)} 6 6 Z"
    S.shape(blade, STEEL_, T=T, shadow=2, decor=f'<path d="M 1 6 C 2 {f(L * 0.4)} 4 {f(L * 0.8)} 6 {f(L + 6)} L 16 {f(L)} L 16 6 Z" fill="{DSTEEL_}" opacity="0.5"/>')
    fist(S, 0, -6, T=T)


def bandit(v):
    what = {"highwayman": "a highwayman: a black tricorn hat with a red feather, a black mask band across the face, a long "
                          "charcoal coat with the collar turned up and brass buttons, a cutlass held forward",
            "cutpurse": "a cutpurse in a deep green hood and cape, a grey scarf pulled up over the mouth, coin purses on a cord "
                        "over the shoulder (Light Fingers), a cutlass",
            "rascal": "a grinning rascal: a wide floppy hat pushed back, a gold hoop earring, stubble, a mustard vest with a "
                      "bolas wound over one shoulder (his Bolas), a cutlass"}[v]
    S = Sprite(f"BANDIT (hero rogueBandit, round 19, take \"{v}\"): {what}. " + LAYOUT + " The game draws the outline.")
    S.group("arm-r", PR, "the cutlass")
    cutlass(S)
    S.group("body")
    if v == "highwayman":
        S.shape(SHOULDERS, "#6A2A3A", decor=hi(56, 92, 18, 6, 0.2) + "".join(f'<path d="{circ(x, 128, 2.6)}" fill="#E2B04A"/>' for x in (90, 110)))
        for s in (-1, 1):  # the turned-up collar
            S.shape(blob([(100 + s * 20, 128), (100 + s * 50, 104), (100 + s * 62, 120), (100 + s * 36, 140)], 0.6), "#7A3446", shadow=3)
        head(S)
        mouth(S)
        S.shape("M 52 104 C 50 70 70 52 100 52 C 130 52 150 70 148 104 C 132 96 116 94 100 94 C 84 94 68 96 52 104 Z", "#4A2E22", shadow=4)
        S.shape("M 54 112 C 70 102 86 100 100 100 C 114 100 130 102 146 112 L 146 124 C 130 116 114 114 100 114 C 86 114 70 116 54 124 Z", "#1E1C22", shadow=3,
                decor=hi(80, 106, 10, 2.5, 0.3))
        # the tricorn: three upturned sides from above, a triangle with its point forward
        tri = "M 100 112 Q 64 70 30 52 Q 26 36 40 30 Q 100 4 160 30 Q 174 36 170 52 Q 136 70 100 112 Z"
        edge = "M 100 104 Q 66 66 36 50 Q 34 40 44 36 Q 100 12 156 36 Q 166 40 164 50 Q 134 66 100 104"
        S.shape(tri, "#2E2A36", shadow=4, decor=strokes(edge, "#D9A441", 3.4, 0.95) + hi(70, 34, 14, 6, 0.25, -20))
        S.shape(blob([(64, 60), (70, 34), (100, 26), (130, 34), (136, 60), (100, 72)], 0.7), "#36323E", shadow=3, decor=hi(86, 40, 10, 6, 0.3, -30))
        S.shape(taper([(112, 40), (132, 24), (150, 10), (164, 6)], 12, 4), "#C8362C", shadow=2, decor=strokes("M 112 40 L 164 6", "#8E2420", 1.6, 0.8))
    elif v == "cutpurse":
        S.shape(SHOULDERS, "#3E6A3A", decor=hi(56, 92, 18, 6, 0.2))
        S.shape("M 34 108 C 60 96 140 96 166 108 L 160 118 C 130 108 70 108 40 118 Z", "#C9B07A", shadow=2)  # the cord
        for x, y in ((48, 120), (68, 114), (150, 118)):
            S.shape(blob([(x - 7, y - 4), (x + 7, y - 4), (x + 9, y + 8), (x, y + 13), (x - 9, y + 8)], 0.7), "#8A5A34", shadow=2,
                    decor=f'<path d="{rr(x, y - 3, 14, 3, 1.5)}" fill="#E2B04A"/>')
        head(S)
        S.shape("M 60 116 C 72 126 86 130 100 130 C 114 130 128 126 140 116 C 140 136 124 154 100 156 C 76 154 60 136 60 116 Z", "#8A8E96", shadow=3,
                decor=strokes("M 66 128 Q 100 144 134 128", "#6A6E76", 2.4, 0.8) + strokes("M 72 140 Q 100 152 128 140", "#6A6E76", 2.4, 0.8))
        S.shape(HOOD, "#2F5A2E", shadow=4, decor=hi(72, 62, 16, 9, 0.22, -30) + strokes("M 100 40 L 100 96", "#1E3A1E", 2.5, 0.6))
        S.shape(taper([(100, 44), (106, 24), (118, 8), (132, 2)], 26, 8), "#2F5A2E", shadow=2)   # the liripipe hanging back
        S.shape("M 46 124 C 52 106 70 98 100 98 C 130 98 148 106 154 124 C 150 112 132 104 100 104 C 68 104 50 112 46 124 Z", "#1E3A1E", shadow=0, side=False)
    else:
        S.shape(SHOULDERS, "#D9A93A", decor=hi(56, 92, 18, 6, 0.25) + f'<path d="M 82 80 L 100 140 L 118 80 Z" fill="#EDE2CC"/>')
        # the bolas wound over the left shoulder: a cord and three weighted balls
        S.shape("M 40 92 C 60 88 82 104 100 134 L 92 138 C 76 112 58 98 40 100 Z", "#8A5A34", shadow=2)
        for x, y in ((38, 96), (58, 90), (48, 112)):
            S.shape(circ(x, y, 8), "#6E747E", shadow=2, decor=hi(x - 3, y - 3, 3, 2, 0.5) + strokes(f"M {x - 8} {y} L {x + 8} {y}", "#8A5A34", 2, 0.7))
        head(S)
        S.raw(f'<path d="M 92 136 Q 100 142 110 134" fill="none" stroke="#C98868" stroke-width="2.6" stroke-linecap="round"/>')
        S.raw("".join(f'<circle cx="{x}" cy="{y}" r="1.2" fill="#8A6A58" opacity="0.6"/>' for x, y in ((80, 132), (86, 140), (94, 146), (106, 146), (114, 140), (120, 132), (90, 134), (110, 138), (100, 148))))
        S.shape(ring(148, 116, 6, 3.4), "#E2B04A", shadow=2, rule="evenodd")
        # the floppy hat pushed back: a wide soft brim tilted up at the front, a dented crown
        S.shape(blob([(30, 84), (38, 50), (70, 26), (110, 22), (150, 34), (172, 64), (164, 92), (130, 84), (100, 90), (66, 90)], 0.8), "#7A5A3A", shadow=4,
                decor=strokes("M 40 82 Q 100 72 162 84", "#5A3E26", 3, 0.6) + hi(66, 40, 16, 7, 0.25, -20))
        S.shape(blob([(64, 70), (70, 40), (100, 30), (130, 40), (136, 70), (100, 80)], 0.8), "#8A6A46", shadow=3,
                decor=strokes("M 100 36 Q 96 52 100 74", "#5A3E26", 3, 0.7) + f'<path d="M 64 66 C 80 74 120 74 136 66 L 136 72 C 120 80 80 80 64 72 Z" fill="#3A5A8A"/>')
    S.group("arm-l", PL, "free fist")
    fist(S, 57, 140, 0, w=24, h=21)
    return save("heroes", "rogueBandit", v, S)


if __name__ == "__main__":
    for v in ("highwayman", "cutpurse", "rascal"):
        print(bandit(v))
