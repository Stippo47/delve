"""Round 5 lizardmen and dragonborn for the Sewers. No eyes. Each in two versions:
  a: plain: one scaly head lit from the left, a snout and brow bumps, nothing else on the face;
  b: face shading like the humans: the top of the head is a plate of darker scales (like a hero's headgear) and the
     snout under it has the heroes' face gradient (dark under the brow, light toward the front, darker right side).
python lizards.py   (writes ../../enemies/lizard*-a/b.svg, dragonborn-a/b.svg)
"""
from lib import *

IRON = ("#D9DDE3", "#8C94A1")
WOOD = ("#B98552", "#7A4E2C")
GOLD = ("#F6D27A", "#C08A2E")
BONE = ("#F4EBD2", "#C9B98E")

SKULL = ("M 100 44 C 128 44 146 62 146 90 C 146 108 138 120 128 126 C 122 150 114 170 100 172 C 86 170 78 150 72 126 "
         "C 62 120 54 108 54 90 C 54 62 72 44 100 44 Z")
PLATE = ("M 56 104 C 50 66 72 44 100 44 C 128 44 150 66 144 104 C 136 112 124 108 118 116 C 112 112 106 110 100 110 "
         "C 94 110 88 112 82 116 C 76 108 64 112 56 104 Z")


def head(S, skin, ver, crest, plate_col=None, snout=SKULL, horns=None):
    """The lizard head: skull and snout in one token (front = the snout tip at y 172)."""
    if ver == "a":
        S.shape(snout, S.lg(lt(skin, 0.14), dk(skin, 0.26)), sh=5, op=0.3, shade=0.3)
    else:
        S.shape(snout, face_fill(S, skin, 96, 172), sh=5, op=0.3, shade=0,
                decor=[f'<rect x="100" y="-20" width="80" height="240" fill="{side_shade(S, skin, 100, 146)}"/>'])
        pc = plate_col or dk(skin, 0.25)
        S.shape(PLATE, S.lg(lt(pc, 0.12), dk(pc, 0.2)), sh=4, op=0.34, shade=0.28,
                decor=[f'<path d="M40 70 C70 60 130 60 160 70 L160 80 C130 70 70 70 40 80 Z" fill="{dk(pc, 0.3)}" opacity="0.35"/>'])
    # nostrils: two small dark slits near the snout tip (the only marks on the face)
    for side in (1, -1):
        S.flat(ell(100 + side * 7, 160, 2.2, 3.4), dk(skin, 0.6), op=0.7)
    if crest:
        for i, (y, h) in enumerate(((44, 20), (62, 18), (80, 15))):
            S.shape(blob([(100, y - h, 'c'), (106, y - h * 0.3), (105, y + 8), (95, y + 8), (94, y - h * 0.3)], 0.7),
                    S.lg(lt(crest, 0.1), dk(crest, 0.25)), sh=3, shade=0.2)


def tail(S, skin, sway=1):
    S.group("back", (100, 86))
    S.shape(stroke_path([(100, 96), (97, 60), (104, 30), (120, 10), (136, 2)], 34, 4), S.lg(lt(skin, 0.1), dk(skin, 0.3)),
            shadow=False, shade=0.3)


def lfist(S, x, y, a, skin, kn=1):
    return fist(S, x, y, a, S.lg(lt(skin, 0.12), dk(skin, 0.2)), knuckle=kn)


def spear(S, x, y, a):
    tf = frame(x, y, a)
    S.shape(rr(0, -10, 8, 104, 4), S.lg(*WOOD, x2=1, y2=0), tf=tf, shadow=False, shade=0.2)
    S.shape(blob([(0, 36), (9, 48), (8, 62), (0, 76, 'c'), (-8, 62), (-9, 48)]), S.lg(*IRON, x2=1, y2=0.2), tf=tf, shadow=False, shade=0.25)
    S.shape(rr(0, 36, 12, 7, 3), S.lg("#8A5A3A", "#5A3622"), tf=tf, shadow=False, shade=0)


def scimitar(S, x, y, a):
    """Held forward; the blade bows out toward the body's middle (the cutting edge, swung inward) and its tip
    flicks back outward."""
    tf = frame(x, y, a)
    S.shape(rr(0, -8, 9, 24, 4), S.lg("#6A3E26", "#40241A"), tf=tf, shadow=False)
    S.shape(rr(0, 6, 26, 8, 4), S.lg(*GOLD), tf=tf, shadow=False)
    S.shape(blob([(-7, 10), (7, 10), (6, 30), (12, 52), (18, 64, 'c'), (2, 56), (-12, 40), (-11, 24)], 0.9),
            S.lg(*IRON, x2=1, y2=0.2), tf=tf, shadow=False, shade=0.25)


def greatsword(S, x, y, a):
    tf = frame(x, y, a)
    S.shape(circ(0, -24, 6.5), S.lg(*GOLD), tf=tf, shadow=False)
    S.shape(rr(0, -10, 9, 26, 4), S.lg("#5A2E26", "#341A16"), tf=tf, shadow=False)
    S.shape(blob([(-20, 4), (-10, 8), (10, 8), (20, 4), (16, 12), (-16, 12)], 0.6), S.lg(*GOLD), tf=tf, shadow=False, shade=0.2)
    S.shape(blob([(-9, 11, 'c'), (9, 11, 'c'), (10, 56), (0, 70, 'c'), (-10, 56)]), S.lg(*IRON, x2=1, y2=0.2), tf=tf, shadow=False,
            shade=0.25, decor=[f'<rect x="-1.2" y="14" width="2.4" height="42" fill="#F4F6FA" opacity="0.5" transform="{tf}"/>'])


def harness(S, col):
    S.shape("M 128 80 L 140 82 L 76 140 L 62 136 Z", S.lg(lt(col, 0.1), dk(col, 0.25)), sh=2, shade=0.2)


def lizard_spear(ver):
    skin, crest = "#7DB052", "#E0703A"
    S = Sprite(f'LIZARDMAN, spear ({ver}) (round 5): green scales, no eyes, an orange crest down the back of the head, '
               f'a long tail behind, a leather strap, a spear held low. '
               + ('Plain head: one scaly token lit from the left, brow bumps, nostrils. ' if ver == "a" else
                  'Face shaded like the humans: a darker scale plate over the top of the head, the snout under it with the heroes\' face gradient. ')
               + 'Parts: #back (tail, sways), #arm-r (spear + fist, before #body), #body, #arm-l (free fist). Front = DOWN (+y).')
    tail(S, skin)
    S.group("arm-r", (150, 110))
    spear(S, 154, 120, 6)
    lfist(S, 154, 142, 6, skin)
    S.group("body")
    S.shape(SHOULDERS, S.lg(dk(skin, 0.12), dk(skin, 0.42)), shade=0.3,
            decor=[f'<circle cx="{x}" cy="{y}" r="7" fill="{dk(skin, 0.25)}" opacity="0.5"/>' for x, y in ((40, 100), (60, 88), (150, 92), (166, 112))])
    harness(S, "#8A5A3A")
    head(S, skin, ver, crest, plate_col="#4E7A40")
    S.group("arm-l", (52, 110))
    lfist(S, 50, 142, -4, skin, -1)
    return S


def lizard_blade(ver):
    skin, crest = "#5FA58A", "#E6B83E"
    S = Sprite(f'LIZARDMAN, blade ({ver}) (round 5): sea-green scales, no eyes, a gold crest, a tail, a scimitar curved '
               f'the right way (the edge bows inward, the tip flicks out). '
               + ('Plain head. ' if ver == "a" else 'Face shaded like the humans (darker plate over the top, face gradient on the snout). ')
               + 'Parts: #back (tail), #arm-r (scimitar + fist, before #body), #body, #arm-l (free fist). Front = DOWN (+y).')
    tail(S, skin)
    S.group("arm-r", (150, 110))
    scimitar(S, 152, 142, 12)
    lfist(S, 152, 138, 12, skin)
    S.group("body")
    S.shape(SHOULDERS, S.lg(dk(skin, 0.12), dk(skin, 0.42)), shade=0.3,
            decor=[f'<circle cx="{x}" cy="{y}" r="7" fill="{dk(skin, 0.25)}" opacity="0.5"/>' for x, y in ((40, 100), (60, 88), (150, 92), (166, 112))])
    S.shape("M 30 100 C 50 86 150 86 170 100 L 168 112 C 150 100 50 100 32 112 Z", S.lg("#C84A3A", "#842A22"), sh=2, shade=0.2)
    head(S, skin, ver, crest, plate_col="#3E7A64")
    S.group("arm-l", (52, 110))
    lfist(S, 50, 142, -4, skin, -1)
    return S


DB_SNOUT = ("M 100 46 C 130 46 148 64 148 92 C 148 110 140 122 130 128 C 126 150 116 166 100 168 C 84 166 74 150 70 128 "
            "C 60 122 52 110 52 92 C 52 64 70 46 100 46 Z")


def dragonborn(ver):
    skin = "#D2503A"
    S = Sprite(f'DRAGONBORN ({ver}) (round 5): red scales, no eyes, two big horns swept back, cheek spikes, dark iron '
               f'shoulder plates with gold rims, a greatsword held low; no tail (it\'s not a lizardman). '
               + ('Plain head. ' if ver == "a" else 'Face shaded like the humans (dark-red plate over the top, face gradient on the snout). ')
               + 'Parts: #arm-r (greatsword + fist, before #body), #body, #arm-l (free fist). Front = DOWN (+y).')
    S.group("arm-r", (150, 110))
    greatsword(S, 154, 140, 16)
    fist(S, 154, 136, 16, S.lg(lt(skin, 0.12), dk(skin, 0.2)))
    S.group("body")
    S.shape(SHOULDERS, S.lg("#4A4452", "#262230"), shade=0.2)
    for side in (1, -1):
        cx = 100 + side * 56
        S.shape(ell(cx, 108, 30, 30), S.lg("#6E6878", "#3A3644"), sh=3, shade=0.3,
                decor=[f'<path d="M{cx - 34} 124 C{cx - 20} 130 {cx + 20} 130 {cx + 34} 124 L{cx + 34} 140 L{cx - 34} 140 Z" fill="{GOLD[1]}"/>'])
    # horns: big, from the sides of the head, sweeping back and out
    for side in (1, -1):
        pts = [(124, 70), (140, 78), (160, 50), (166, 18, 'c'), (148, 36), (126, 56)]
        S.shape(blob(pts if side > 0 else mx(pts), 0.9), S.lg(*BONE), shadow=False, shade=0.25)
    head(S, skin, ver, None, plate_col="#8E2A22", snout=DB_SNOUT)
    for side in (1, -1):  # cheek spikes
        pts = [(140, 112), (160, 120, 'c'), (138, 126)]
        S.shape(blob(pts if side > 0 else mx(pts), 0.6), S.lg(*BONE), sh=2, shade=0.2)
    S.group("arm-l", (48, 110))
    fist(S, 46, 142, -4, S.lg(lt(skin, 0.12), dk(skin, 0.2)), knuckle=-1)
    return S


if __name__ == "__main__":
    for v in ("a", "b"):
        print(lizard_spear(v).write(f"lizardman-spear-{v}.svg"))
        print(lizard_blade(v).write(f"lizardman-blade-{v}.svg"))
        print(dragonborn(v).write(f"dragonborn-{v}.svg"))
