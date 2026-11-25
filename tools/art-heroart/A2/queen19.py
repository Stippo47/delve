"""The Winter Queen, three takes (round 19). The designer (v12-bosses): "Don't like all of the abilities... U can keep her
just improve quality worthy of a boss." Parts as art/bosses/winter-queen.svg: #back (the train and collar, pivot 100 92,
sways), #arm-l (46 110) and #arm-r (154 110) (her hands held out to cast: they lift when she casts), #body. Drawn at
vr 34 / headR 57 (sizeU 131): the outline is thinner against her than a hero's, so her shapes are bolder."""
from r19 import *

ICE, DICE, FROST, GOWN, DGOWN = "#BFE8FA", "#6FB4DE", "#F2FBFF", "#3E6FC0", "#26437E"


def skin(S):
    S.add_def('<linearGradient id="gFaceIce" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
              '<stop offset="0" stop-color="#9C96C8"/><stop offset="0.25" stop-color="#C9C6EA"/><stop offset="0.6" stop-color="#E8E6F8"/>'
              '<stop offset="1" stop-color="#CFD6EE"/></linearGradient>')
    S.add_def('<radialGradient id="gHandIce" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#EEF2FB"/><stop offset="1" stop-color="#AEB8DA"/></radialGradient>')
    return "url(#gFaceIce)", "url(#gHandIce)"


def face_marks(S, lips="#5A6FB8"):
    """Her face: blue lips, two frost marks under the eyes' place (no eyes), a frost bloom on one cheek."""
    S.raw(f'<path d="M 93 137 Q 100 142 107 137 Q 100 139.5 93 137 Z" fill="{lips}" stroke="{lips}" stroke-width="2.4" stroke-linejoin="round"/>')
    S.raw(f'<path d="{ell(76, 128, 9, 5)}" fill="#9FB8F0" opacity="0.45"/><path d="{ell(124, 128, 9, 5)}" fill="#9FB8F0" opacity="0.45"/>'
          + snowflake(126, 118, 5, 1.4, "#FFFFFF"))


def shard(cx, cy, a, L, w):
    return blob([(-w, 0), (-w * 0.6, -L * 0.6), (0, -L), (w * 0.6, -L * 0.6), (w, 0), (0, w * 0.6)], 0.25), frame(cx, cy, a)


def ice_shards(S, items, col=ICE):
    for cx, cy, a, L, w in items:
        d, T = shard(cx, cy, a, L, w)
        S.shape(d, col, T=T, shadow=3, decor=f'<path d="{poly([(0, w), (0, -L), (w * 1.2, -L * 0.5), (w * 1.2, w)])}" fill="{DICE}" opacity="0.45"/>')


def snowflake(cx, cy, r, w=2.6, col="#FFFFFF"):
    s = ""
    for k in range(6):
        a = math.radians(60 * k)
        x1, y1 = cx + r * math.cos(a), cy + r * math.sin(a)
        s += strokes(f"M {f(cx)} {f(cy)} L {f(x1)} {f(y1)}", col, w)
        for t in (0.55,):
            bx, by = cx + r * t * math.cos(a), cy + r * t * math.sin(a)
            for da in (-40, 40):
                b = a + math.radians(da)
                s += strokes(f"M {f(bx)} {f(by)} L {f(bx + r * 0.3 * math.cos(b))} {f(by + r * 0.3 * math.sin(b))}", col, w * 0.8)
    return s


def queen(v):
    what = {"spires": "a crown of five tall ice spires fanning up and back, long silver-white hair under it; a high fan collar "
                      "of ice shards behind her head; a deep-blue gown with a frost-white mantle edged in ice; a long train "
                      "frosted at its hem (#back); pale lilac skin, blue lips and frost marks on the cheeks; both hands "
                      "out in ice-cut gauntlets, a snowflake forming over the right",
            "mantle": "a great white fur mantle round her shoulders, a ring of icicles hanging from a silver circlet over a "
                      "lilac veil that falls back over the head; a sceptre of ice with a star crystal in the right fist, the "
                      "left hand open with snow drifting off it; a long train behind (#back)",
            "glacier": "a warrior queen in plates of glacier ice: jagged ice pauldrons, a crown of ice shards standing out "
                       "round her head like a broken star, a long white braid down her back over a frozen cape (#back); "
                       "a shard of ice held like a dagger in each fist"}[v]
    S = Sprite(f"THE WINTER QUEEN (round 19, take \"{v}\"): {what}. Parts in draw order inside #sprite; facing down; "
               "the game draws the outline.")
    face, hand = skin(S)
    PLq, PRq = (46, 110), (154, 110)
    if v == "spires":
        S.group("back", (100, 92), "the train and the shard collar (sways)")
        S.shape(blob([(46, 110), (40, 60), (60, 18), (100, 4), (140, 18), (160, 60), (154, 110)], 0.8), DGOWN, shadow=0,
                decor=f'<path d="{blob([(44, 44), (60, 14), (100, 0), (140, 14), (156, 44), (100, 30)], 0.8)}" fill="{FROST}"/>'
                + "".join(f'<path d="{circ(x, y, 3)}" fill="{FROST}"/>' for x, y in ((50, 44), (70, 34), (130, 34), (150, 44), (100, 30))))
        ice_shards(S, [(100 + 50 * math.sin(math.radians(a)), 80 - 30 * math.cos(math.radians(a)), a, 44, 8) for a in (-70, -40, 40, 70)], ICE)
        S.group("arm-l", PLq, "left hand out, in an ice gauntlet")
        S.shape(rr(52, 146, 24, 22, 7), DICE, shadow=0, decor=f'<path d="{poly([(42, 138), (50, 132), (58, 140)])}" fill="{FROST}"/>')
        fist(S, 54, 160, 0, w=24, h=20, hand=hand)
        S.group("arm-r", PRq, "right hand out, a snowflake forming over it")
        S.shape(rr(148, 146, 24, 22, 7), DICE, shadow=0)
        fist(S, 146, 160, 0, w=24, h=20, hand=hand)
        S.shape(circ(150, 182, 13), "#E8F6FF", shadow=0, side=False, decor=snowflake(150, 182, 11, 2.2, DICE))
        S.group("body")
        robe(S, GOWN, FROST, 9, decor=strokes("M 40 120 Q 60 110 70 124 M 160 120 Q 140 110 130 124", FROST, 2.4, 0.7))
        # the frost mantle on the shoulders, edged in little shards
        S.shape("M 30 104 C 34 84 62 78 100 78 C 138 78 166 84 170 104 C 150 98 126 96 100 96 C 74 96 50 98 30 104 Z", FROST, shadow=3)
        ice_shards(S, [(36, 100, -70, 18, 5), (52, 92, -40, 16, 5), (148, 92, 40, 16, 5), (164, 100, 70, 18, 5)], ICE)
        # hair falling to the shoulders, then the head
        S.shape(blob([(54, 130), (50, 84), (70, 52), (100, 44), (130, 52), (150, 84), (146, 130), (126, 110), (74, 110)], 0.8), "#E6EEF8", shadow=3,
                decor=strokes("M 60 118 Q 58 90 76 66 M 140 118 Q 142 90 124 66", "#B9C6DE", 3, 0.7))
        head(S, face=face)
        face_marks(S)
        S.shape("M 52 104 C 48 64 70 46 100 46 C 130 46 152 64 148 104 C 136 90 118 86 100 92 C 82 86 64 90 52 104 Z", "#EEF3FA", shadow=4,
                decor=hi(76, 62, 14, 8, 0.5, -30) + strokes("M 100 90 Q 96 70 100 48", "#B9C6DE", 2.4, 0.7) + strokes("M 68 92 Q 74 70 92 60 M 132 92 Q 126 70 108 60", "#C8D2E6", 2.4, 0.7))
        # the crown: five spires on a silver band
        S.shape("M 58 82 C 70 70 86 66 100 66 C 114 66 130 70 142 82 L 140 90 C 128 80 114 76 100 76 C 86 76 72 80 60 90 Z", "#C9D3E6", shadow=2,
                decor="".join(f'<path d="{circ(x, 76, 2.6)}" fill="#7FC4F0"/>' for x in (76, 100, 124)))
        ice_shards(S, [(100, 70, 0, 50, 9), (78, 74, -22, 40, 8), (122, 74, 22, 40, 8), (62, 82, -44, 30, 7), (138, 82, 44, 30, 7)], "#DDF4FF")
    elif v == "mantle":
        S.group("back", (100, 92), "the train (sways)")
        S.shape(blob([(44, 110), (34, 50), (56, 6), (100, -8), (144, 6), (166, 50), (156, 110)], 0.8), "#5D4FA8", shadow=0,
                decor=f'<path d="{blob([(40, 30), (56, 4), (100, -10), (144, 4), (160, 30), (100, 16)], 0.8)}" fill="{FROST}"/>' + snowflake(100, 30, 12, 2.4, "#C9D6F6") + snowflake(64, 50, 8, 2, "#C9D6F6") + snowflake(136, 50, 8, 2, "#C9D6F6"))
        S.group("arm-r", PRq, "the ice sceptre")
        B, F = (176, 56), (150, 168)
        T, a = pole(S, B, F, 8, "#D8EEFA")
        S.shape(blob(star(0, 14, 15, 6, 6), 0.3), "#E8F8FF", T=T, shadow=2, decor=f'<path d="{blob(star(0, 14, 15, 6, 6), 0.3)}" fill="{DICE}" opacity="0.3" transform="translate(4 0)"/>')
        fist(S, *grip(B, F, (153, 144)), a, hand=hand)
        S.group("body")
        robe(S, "#5D4FA8", "#C9D3E6", 8)
        # the fur mantle: a thick scalloped white ruff right round the shoulders
        S.shape(cloud(100, 106, 66, 16, 0.6), FROST, shadow=3, T="translate(100 106) scale(1.06 0.56) translate(-100 -106)",
                decor="".join(f'<path d="{circ(100 + 56 * math.cos(math.radians(a)), 106 + 30 * math.sin(math.radians(a)), 3)}" fill="#2B2230" opacity="0.8"/>' for a in range(200, 341, 35)))
        # the veil falling back over the head
        S.shape(blob([(52, 118), (48, 72), (64, 40), (100, 30), (136, 40), (152, 72), (148, 118), (126, 104), (74, 104)], 0.8), "#B9AEE6", shadow=3,
                decor=strokes("M 66 104 Q 62 70 84 44 M 134 104 Q 138 70 116 44 M 100 32 L 100 90", "#9A8ED0", 2.4, 0.7))
        head(S, face=face)
        face_marks(S, "#6A5AB8")
        # the circlet and its hanging icicles
        S.shape("M 56 96 C 68 82 84 76 100 76 C 116 76 132 82 144 96 L 141 101 C 129 89 115 84 100 84 C 85 84 71 89 59 101 Z", "#D6DCEA", shadow=2,
                decor=f'<path d="{circ(100, 80, 3.6)}" fill="#8FD2F6"/>')
        for k, x in enumerate((64, 76, 88, 100, 112, 124, 136)):
            y = 96 - 14 * math.sin(math.radians(180 * (x - 56) / 88)) + 2
            L = (14, 18, 22, 26, 22, 18, 14)[k]
            S.shape(blob([(x - 4, y - 2), (x + 4, y - 2), (x, y + L)], 0.2), "#DDF4FF", shadow=2)
        S.shape(blob(star(100, 70, 12, 5, 6), 0.3), "#E8F8FF", shadow=2)
        S.group("arm-l", PLq, "left hand open, snow drifting off it")
        fist(S, 56, 156, 0, w=25, h=21, hand=hand)
        S.raw(snowflake(46, 178, 6, 1.8) + snowflake(62, 188, 4.5, 1.5))
    else:
        S.group("back", (100, 92), "the frozen cape and the braid (sways)")
        S.shape(blob([(40, 108), (28, 56), (48, 10), (100, -4), (152, 10), (172, 56), (160, 108)], 0.75), "#4C7FB8", shadow=0,
                decor="".join(strokes(f"M {x} -4 L {x + (x - 100) * 0.3} 108", "#3A6AA0", 3, 0.6) for x in (64, 88, 112, 136))
                + f'<path d="{blob([(30, 60), (48, 8), (100, -6), (152, 8), (170, 60), (160, 44), (130, 24), (100, 18), (70, 24), (40, 44)], 0.8)}" fill="{ICE}" opacity="0.75"/>')
        for k in range(5):
            y = 46 - 9 * k
            S.shape(ell(100 + (2 if k % 2 else -2), y, 10 - k * 0.7, 6.5), "#EEF3FA", shadow=2, decor=strokes(f"M 92 {y - 2} L 108 {y + 3}", "#B9C6DE", 2, 0.8))
        S.shape(ell(100, 2, 5, 6), "#7FC4F0", shadow=2)
        for s, PP in ((-1, PLq), (1, PRq)):
            S.group("arm-l" if s < 0 else "arm-r", PP, "an ice dagger in the fist")
            x = 100 + s * 46
            d, T = shard(x + s * 4, 172, s * -8, -34, 6)
            S.shape(blob([(-6, 0), (-4, 22), (0, 36), (4, 22), (6, 0)], 0.3), "#DDF4FF", T=frame(x, 160, s * -62), shadow=0,
                    decor=f'<path d="{poly([(0, 0), (0, 36), (6, 0)])}" fill="{DICE}" opacity="0.4"/>')
            fist(S, x, 154, s * 8, w=22, h=24, hand=hand)
        S.group("body")
        robe(S, "#2F5A9A", ICE, 8)
        # the pauldrons: jagged chunks of glacier ice
        for s in (-1, 1):
            S.shape(blob([(100 + s * 40, 84), (100 + s * 64, 78), (100 + s * 80, 92), (100 + s * 78, 116), (100 + s * 58, 124), (100 + s * 42, 108)], 0.4), ICE, shadow=3,
                    decor=f'<path d="{poly([(100 + s * 60, 78), (100 + s * 80, 92), (100 + s * 78, 116), (100 + s * 62, 100)])}" fill="{DICE}" opacity="0.45"/>')
            ice_shards(S, [(100 + s * 70, 86, s * 60, 22, 6)], "#DDF4FF")
        head(S, face=face)
        face_marks(S)
        S.shape("M 52 104 C 48 64 70 46 100 46 C 130 46 152 64 148 104 C 140 92 124 86 112 92 C 106 84 94 84 88 92 C 76 86 60 92 52 104 Z", "#EEF3FA", shadow=4,
                decor=hi(76, 62, 14, 8, 0.5, -30) + strokes("M 100 86 Q 98 66 100 48", "#B9C6DE", 2.4, 0.7))
        # the crown of shards standing out like a broken star
        ice_shards(S, [(100 + 40 * math.sin(math.radians(a)), 74 - 26 * math.cos(math.radians(a)), a, L, 7)
                       for a, L in ((-70, 30), (-40, 38), (-12, 30), (14, 44), (42, 32), (70, 28))], "#DDF4FF")
        S.shape("M 60 90 C 72 78 86 74 100 74 C 114 74 128 78 140 90 L 137 96 C 125 86 113 82 100 82 C 87 82 75 86 63 96 Z", "#9FD8F4", shadow=2)
    return save("bosses", "winterQueen", v, S)


if __name__ == "__main__":
    for v in ("spires", "mantle", "glacier"):
        print(queen(v))
