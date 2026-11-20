"""Round 5 fiends: imp, devil, demon. No eyes; the tails go straight back (behind the sprite, -y).
python fiends.py   (writes ../../enemies/fiend-*.svg)
"""
from lib import *

GOLD = ("#F6D27A", "#C08A2E")
HORN = ("#4A4050", "#1E1824")
BONE = ("#F4EBD2", "#C9B98E")
FIRE = ("#FFF2A0", "#FF7A2A")

SCALP = ("M 52.5 108 C 50 70 70 47.8 100 47.8 C 130 47.8 150 70 147.5 108 C 136 100 120 96 100 98 "
         "C 80 96 64 100 52.5 108 Z")


def skin_lg(S, c):
    return S.lg(lt(c, 0.12), dk(c, 0.24))


def wings(S, col, span=1.0, top=26):
    """Bat wings spread out from the back to both sides; scalloped trailing edge; darker panels between the bones."""
    for side in (1, -1):
        pts = [(118, 96), (140, 70), (164, top + 10), (196 * span + 100 * (1 - span), top), (190 * span + 100 * (1 - span), 64),
               (178 * span + 100 * (1 - span), 72), (168 * span + 100 * (1 - span), 90), (150, 94), (140, 108)]
        pts = [(x, y) for x, y in pts]
        if side < 0:
            pts = mx(pts)
        S.shape(blob(pts, 0.7), S.lg(lt(col, 0.1), dk(col, 0.3)), shadow=False, shade=0.25,
                decor=[f'<path d="{blob(pts[2:7] if side > 0 else pts[2:7], 0.7)}" fill="{dk(col, 0.25)}" opacity="0.5"/>'])
        bone = [(120, 92), (160, 50), (196 * span + 100 * (1 - span), top)]
        if side < 0:
            bone = mx(bone)
        S.shape(stroke_path(bone, 8, 4), S.lg(dk(col, 0.1), dk(col, 0.4)), shadow=False, shade=0)


def tail(S, col, L=1.0, tip=None):
    """The tail runs straight back from the base of the back and ends in a spade tip."""
    y0, y1 = 92, 92 - 92 * L
    S.shape(stroke_path([(100, y0), (97, (y0 + y1) / 2 + 10), (103, (y0 + y1) / 2 - 10), (100, y1 + 8)], 12, 6),
            S.lg(lt(col, 0.1), dk(col, 0.3)), shadow=False, shade=0.2)
    S.shape(blob([(100, y1 - 10, 'c'), (110, y1 + 4), (104, y1 + 2), (100, y1 + 12, 'c'), (96, y1 + 2), (90, y1 + 4)], 0.7),
            S.lg(lt(tip or col, 0.1), dk(tip or col, 0.3)), shadow=False, shade=0.2)


def horn(S, pts, col=HORN, sh=True):
    for side in (1, -1):
        S.shape(blob(pts if side > 0 else mx(pts), 0.9), S.lg(*col), shadow=sh, sh=3, shade=0.25)


def ffist(S, x, y, a, skin, w=21, h=24, kn=1):
    return fist(S, x, y, a, skin_lg(S, skin), w=w, h=h, knuckle=kn)


def trident(S, x, y, a):
    tf = frame(x, y, a)
    S.shape(rr(0, -6, 7, 92, 3.5), S.lg(*GOLD, x2=1, y2=0), tf=tf, shadow=False, shade=0.2)
    S.shape(blob([(-18, 34), (18, 34), (16, 42), (-16, 42)], 0.5), S.lg(*GOLD), tf=tf, shadow=False, shade=0.2)
    for px in (-14, 0, 14):
        L = 66 if px == 0 else 58
        S.shape(blob([(px - 3.5, 38), (px + 3.5, 38), (px + 3, L - 8), (px, L, 'c'), (px - 3, L - 8)], 0.6), S.lg(*GOLD, x2=1, y2=0.2),
                tf=tf, shadow=False, shade=0.2)


def imp():
    skin = "#E8703E"
    S = Sprite('IMP (round 5), small: orange-red skin, no eyes; little dark horns, pointed ears, a sly wide grin, small '
               'bat wings, a thin tail going straight back with a spade tip, a ball of fire in one hand. Parts: #back '
               '(wings and tail), #body, #arm-r (free claw), #arm-l (fist + fireball). Front = DOWN (+y).')
    S.group("back", (100, 92))
    tail(S, skin, 0.95)
    wings(S, "#A8303A", span=0.82, top=40)
    S.group("body")
    S.shape(sym([(100, 82), (128, 84), (146, 98), (146, 116), (132, 130), (100, 136)]), skin_lg(S, dk(skin, 0.15)), shade=0.3)
    for side in (1, -1):
        pts = [(140, 92), (172, 88, 'c'), (146, 112)]
        S.shape(blob(pts if side > 0 else mx(pts), 0.7), skin_lg(S, skin), shadow=False, shade=0.2)
    face(S, skin)
    S.shape(SCALP, S.lg(lt(skin, 0.14), dk(skin, 0.16)), sh=4, op=0.32, shade=0.22)
    S.raw(f'<path d="M80 134 Q92 146 100 140 Q108 146 120 134" fill="none" stroke="{dk(skin, 0.6)}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>')
    horn(S, [(112, 60), (124, 62), (132, 38, 'c'), (118, 50)])
    S.group("arm-r", (146, 112))
    ffist(S, 146, 140, 10, skin)
    S.group("arm-l", (54, 112))
    ffist(S, 54, 140, -10, skin, kn=-1)
    S.shape(blob([(54, 146), (66, 156), (66, 170), (54, 184, 'c'), (42, 170), (42, 156)]), S.rg(FIRE[0], FIRE[1], 0.5, 0.4, 0.65),
            shadow=False, shade=0)
    return S


def devil():
    skin = "#C2303A"
    S = Sprite('DEVIL (round 5): crimson skin, no eyes; big black horns curving out and up, a pointed black goatee at '
               'the front, dark red bat wings, the tail straight back with a spade tip, a gold trident held low. '
               'Parts: #back (wings and tail), #arm-r (trident + fist, before #body), #body, #arm-l (free fist). '
               'Front = DOWN (+y).')
    S.group("back", (100, 92))
    tail(S, skin, 1.0, tip="#2E2834")
    wings(S, "#5E1E2A", span=0.86, top=34)
    S.group("arm-r", (150, 110))
    trident(S, 154, 118, 10)
    ffist(S, 154, 140, 10, skin)
    S.group("body")
    S.shape(SHOULDERS, S.lg("#4A2230", "#24121A"), shade=0.2)
    S.shape("M 36 104 C 56 92 144 92 164 104 L 160 118 C 140 106 60 106 40 118 Z", S.lg(*GOLD), sh=2, shade=0.2)
    face(S, skin)
    S.shape(SCALP, S.lg(lt(skin, 0.14), dk(skin, 0.18)), sh=4, op=0.32, shade=0.24)
    S.raw(f'<path d="M88 136 Q100 132 112 136" fill="none" stroke="{dk(skin, 0.6)}" stroke-width="3" stroke-linecap="round"/>')
    S.shape(blob([(88, 140), (112, 140), (108, 156), (100, 172, 'c'), (92, 156)], 0.8), S.lg(*HORN), sh=3, shade=0.2)
    horn(S, [(118, 62), (136, 66), (166, 54), (178, 22, 'c'), (156, 42), (128, 50)])
    S.group("arm-l", (50, 110))
    ffist(S, 48, 142, -4, skin, kn=-1)
    return S


def demon():
    skin = "#6E3448"
    S = Sprite('DEMON (round 5), big: dark plum-maroon skin cracked with glowing orange, no eyes; huge ram horns curling '
               'round the sides of the head, a glowing mouth, massive shoulders, two huge clawed fists; a short heavy '
               'tail straight back. Parts: #back (tail), #body, #arm-l, #arm-r (fists). Front = DOWN (+y).')
    S.group("back", (100, 92))
    tail(S, skin, 0.8, tip="#3E1E2A")
    S.group("body")
    hump = sym([(100, 52), (150, 58), (186, 84), (192, 116), (172, 140), (100, 146)])
    cracks = ''.join(f'<path d="{blob(p, 0.5)}" fill="#FF8A3A" opacity="0.95"/>' for p in (
        [(12, 112), (30, 118, 'c'), (26, 126), (44, 136, 'c'), (22, 130)],
        [(188, 112), (170, 118, 'c'), (174, 126), (156, 136, 'c'), (178, 130)],
        [(84, 50), (100, 60, 'c'), (116, 50), (100, 54)]))
    S.shape(hump, S.lg(lt(skin, 0.06), dk(skin, 0.35)), shade=0.3, decor=[cracks])
    face(S, skin)
    S.shape(SCALP, S.lg(lt(skin, 0.12), dk(skin, 0.2)), sh=4, op=0.32, shade=0.24)
    S.shape("M 80 134 Q100 152 120 134 Q100 142 80 134 Z", S.lg("#FFE080", "#FF7A2A"), shadow=False, shade=0)
    # ram horns: from the top of the head, curling down round the sides
    pts = [(118, 60), (150, 52), (172, 70), (174, 100), (158, 116), (146, 104, 'c'), (156, 96), (156, 78), (142, 70), (124, 74)]
    horn(S, pts, col=("#D8C8A8", "#8A7A62"))
    for gid, x, kn in (("arm-l", 28, -1), ("arm-r", 172, 1)):
        S.group(gid, (40 if x < 100 else 160, 116))
        ffist(S, x, 150, 0, skin, w=32, h=34, kn=kn)
        for i in range(3):  # claws over the knuckles, pointing forward
            cx = x - 10 + i * 10
            S.shape(blob([(cx - 3.5, 164), (cx + 3.5, 164), (cx, 174, 'c')], 0.6), S.lg(*BONE), shadow=False, shade=0.1)
    return S


if __name__ == "__main__":
    for name, fn in (("imp", imp), ("devil", devil), ("demon", demon)):
        print(fn().write(f"fiend-{name}.svg"))
