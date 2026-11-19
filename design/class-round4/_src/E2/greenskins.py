"""Greenskins: goblin, hobgoblin, orc, orc shaman, troll, ogre. Each a different shade of green."""
from lib import *
import math

RUST = ("#B9876A", "#7E5A48")
IRON = ("#D9DDE3", "#8C94A1")
WOOD = ("#B98552", "#7A4E2C")


def dagger(S, x, y, a, blade=IRON):
    tf = frame(x, y, a)
    S.shape(rr(0, -6, 8, 26, 3.5), S.lg("#7A5236", "#4E3220"), tf=tf, shadow=False)           # grip
    S.shape(rr(0, 9, 22, 7, 3.5), S.lg(*RUST), tf=tf, shadow=False)                           # guard
    S.shape(blob([(-7, 12), (7, 12), (6, 34), (0, 52), (-6, 34)]), S.lg(*blade, x2=1, y2=0.2), tf=tf, shadow=False,
            decor=[f'<circle cx="4" cy="24" r="4" fill="#9A5A3A" opacity="0.55" transform="{tf}"/>'])


def goblin():
    S = Sprite('GOBLIN (round 4 greenskin), ~70% of the archer: bright lime-yellow skin, huge sideways ears, long nose, '
               'big yellow eyes, brown rag tunic, rusty dagger. Drawn at base size and scaled 0.7 inside each part. '
               'Parts: #arm-r (dagger + fist, before #body so the blade comes out from under the shoulder), #body, '
               '#arm-l (empty claw). Outline from the #outline filter. Facing = DOWN (+y), centre (100,100).', k=0.72)
    skin, skinD = "#BFD957", "#8EAA2E"
    S.group("arm-r", (150, 108))
    dagger(S, 150, 154, -12)
    fist(S, 150, 150, -12, S.lg(skin, skinD), knuckle=1, claws="#F2E6C4")
    S.group("body")
    S.shape(sym([(100, 80), (138, 82), (162, 98), (164, 118), (150, 134), (100, 140)]), S.lg("#9A7A4E", "#6E5434"),
            decor=[f'<path d="{poly([(60,132),(70,146),(80,134),(92,148),(104,136),(118,148),(128,134),(140,146),(150,128),(60,128)])}" fill="#6E5434"/>'])
    # ears: long, out to the sides and swept back
    for side in (1, -1):
        pts = [(140, 88), (170, 78), (206, 66), (186, 92), (146, 114)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.9), S.lg(skin, skinD), shadow=False)
        inner = [(148, 94), (170, 85), (190, 76), (176, 92), (152, 106)]
        if side < 0: inner = mx(inner)
        S.flat(blob(inner, 0.9), "#7E9A2A", op=0.7)
    head = sym([(100, 52), (130, 56), (148, 78), (150, 104), (138, 130), (100, 146)])
    S.shape(head, S.lg(skin, skinD), hi=0.35, sh=5)
    # nose
    S.shape(blob([(90, 124), (100, 118), (110, 124), (106, 150), (100, 166), (94, 150)]), S.lg("#B0CC48", "#86A22C"), sh=3)
    for x in (80, 120):
        S.flat(ell(x, 118, 9, 8), "#FFE15A")
        S.flat(ell(x + 1, 119, 3.6, 4.4), "#C2271E")
    S.group("arm-l", (50, 108))
    fist(S, 52, 146, 8, S.lg(skin, skinD), knuckle=-1, claws="#F2E6C4")
    return S


def gladius(S, x, y, a):
    tf = frame(x, y, a)
    S.shape(circ(0, -22, 6), S.lg("#E2B65A", "#A87A2A"), tf=tf, shadow=False)
    S.shape(rr(0, -8, 9, 26, 4), S.lg("#6A3E26", "#40241A"), tf=tf, shadow=False)
    S.shape(rr(0, 8, 28, 8, 4), S.lg("#E2B65A", "#A87A2A"), tf=tf, shadow=False)
    S.shape(blob([(-8.5, 11), (8.5, 11), (9.5, 40), (5, 54), (0, 59), (-5, 54), (-9.5, 40)]), S.lg(*IRON, x2=1, y2=0.2),
            tf=tf, shadow=False)


def hobgoblin():
    S = Sprite('HOBGOBLIN (round 4 greenskin), archer-sized soldier: dull olive-khaki skin, iron cap with a red crest, '
               'swept-back ears, red leather shoulders, a short sword and a red square shield. Parts: #arm-r (sword + '
               'fist, before #body), #body, #arm-l (shield in front, hand hidden). Facing = DOWN (+y), centre (100,100).')
    skin, skinD = "#A6A866", "#767A3C"
    S.group("arm-r", (160, 108))
    gladius(S, 156, 140, -6)
    fist(S, 156, 140, -6, S.lg(skin, skinD), knuckle=1)
    S.group("body")
    S.shape(sym([(100, 76), (142, 78), (172, 94), (176, 114), (160, 136), (100, 142)]), S.lg("#B4553C", "#7E3426"),
            decor=[f'<path d="{rr(100, 70, 200, 26, 0)}" fill="#5E2A20" opacity="0.35"/>'])
    for side in (1, -1):
        pts = [(140, 94), (170, 86), (192, 70), (178, 98), (146, 114)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.9), S.lg(skin, skinD), shadow=False)
    S.shape(sym([(100, 50), (132, 54), (149, 76), (150, 104), (140, 130), (100, 148)]), S.lg(skin, skinD), sh=5)
    # iron cap over the top/back of the head
    S.shape(sym([(100, 44), (134, 48), (153, 70), (154, 94), (146, 102), (100, 96)]), S.lg(*IRON), hi=0.45, sh=4)
    S.shape(sym([(100, 36), (110, 42), (111, 70), (108, 96), (100, 100)]), S.lg("#E04A36", "#A2281E"), sh=3, shade=0.25)
    for x in (82, 118):
        S.flat(ell(x, 120, 6, 6.5), "#FFB43A")
        S.flat(ell(x + 0.5, 121, 2.2, 4.5), INK)
    S.group("arm-l", (40, 108))
    S.shape(rr(46, 150, 50, 56, 10), S.lg("#D8513A", "#962A20"), tf="rotate(6 46 150)", sh=5,
            decor=[f'<path d="{rr(46,150,50,56,10)}" transform="rotate(6 46 150)" fill="none" stroke="#E2B65A" stroke-width="7"/>',
                   f'<circle cx="46" cy="150" r="9" fill="#E8C060"/><circle cx="44" cy="148" r="4" fill="#FFF0B0" opacity="0.7"/>'])
    return S


def cleaver(S, x, y, a):
    """A big orc chopper: a broad blade that widens to a squared, clipped tip; the back runs along the handle line."""
    tf = frame(x, y, a)
    S.shape(rr(0, -12, 10, 56, 5), S.lg(*WOOD, x2=1, y2=0), tf=tf, shadow=False)
    S.shape(rr(0, 14, 13, 10, 4), S.lg("#5A5E68", "#3A3E48"), tf=tf, shadow=False)
    S.shape(blob([(-7, 16, 'c'), (10, 16), (17, 26), (21, 42), (19, 47, 'c'), (-2, 50, 'c'), (-7, 46, 'c'), (-7, 42, 'c'),
                  (-2, 39, 'c'), (-7, 36, 'c'), (-7, 30, 'c'), (-2, 27, 'c'), (-7, 24, 'c')], 0.5),
            S.lg("#D4D8DE", "#7C8390", x2=1, y2=0.3), tf=tf, shadow=False,
            decor=[f'<circle cx="12" cy="52" r="5" fill="#9A5A3A" opacity="0.45" transform="{tf}"/>'])


def orc_head(S, skin, skinD, tusk=1.0, ears=True):
    if ears:
        for side in (1, -1):
            pts = [(138, 94), (160, 90), (178, 80), (168, 102), (142, 114)]
            if side < 0: pts = mx(pts)
            S.shape(blob(pts, 0.9), S.lg(skin, skinD), sh=3)
    S.shape(sym([(100, 50), (130, 52), (148, 72), (150, 100), (140, 122), (100, 132)]), S.lg(skin, skinD), sh=5, hi=0.3)
    # heavy underbite jaw
    S.shape(sym([(100, 116), (122, 118), (134, 130), (128, 146), (100, 152)]), S.lg(skin, skinD), sh=4)
    for side in (1, -1):
        tip = (124 + 10 * tusk, 140 + 24 * tusk)
        pts = [(114, 144), (122, 134), (tip[0] + 2, tip[1] - 8), tip, (tip[0] - 6, tip[1] - 6), (116, 150)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.7), S.lg("#FFF6DA", "#D8C8A0"), sh=2, shade=0.2)


def orc():
    S = Sprite('ORC grunt (round 4 greenskin), ~115%: grass-green skin, wide flat head with a heavy underbite and two '
               'tusks, black mohawk, one spiked iron pauldron, a big cleaver. Parts: #arm-r (cleaver + fist, before '
               '#body), #body, #arm-l (empty fist). Drawn at base size, scaled 1.15. Facing = DOWN (+y), centre (100,100).',
               k=1.15)
    skin, skinD = "#78AE4A", "#4B7E2E"
    S.group("arm-r", (162, 104))
    cleaver(S, 154, 136, -14)
    fist(S, 154, 138, -14, S.lg(skin, skinD), w=22, h=26, knuckle=1)
    S.group("body")
    S.shape(sym([(100, 72), (144, 72), (176, 90), (180, 114), (160, 136), (100, 142)]), S.lg("#8A6446", "#553A28"),
            decor=[f'<path d="M150 80 L162 86 L74 142 L62 136 Z" fill="#3E2A1E" opacity="0.6"/>'])
    # spiked pauldron on the left shoulder
    S.shape(ell(46, 102, 30, 26), S.lg(*IRON), hi=0.45, sh=4)
    for (x, y) in [(30, 86), (44, 80), (24, 102)]:
        S.shape(blob([(x - 6, y + 6), (x - 4, y - 8), (x, y - 14), (x + 4, y - 8), (x + 6, y + 6)]), S.lg("#E6E9EE", "#9AA2AE"),
                shadow=False, shade=0.2)
    orc_head(S, skin, skinD)
    S.shape(sym([(100, 40), (108, 44), (110, 70), (108, 98), (100, 104)]), S.lg("#3E3440", "#221C26"), sh=3, shade=0.1)
    S.shape(sym([(100, 96), (128, 98), (140, 106), (128, 112), (100, 110)]), S.lg("#669A3E", "#44722A"), sh=3, shade=0.1)
    for x in (85, 115):
        S.flat(ell(x, 114, 5.5, 4.5), "#E8402C")
    S.group("arm-l", (40, 106))
    fist(S, 44, 138, 6, S.lg(skin, skinD), w=24, h=28, knuckle=-1)
    return S


def staff(S, x, y, a):
    tf = frame(x, y, a)
    S.shape(blob([(-4, -70), (4, -70), (5, -20), (3, 10), (5, 30), (-1, 34), (-4, 8), (-5, -20)], 0.8),
            S.lg(*WOOD, x2=1, y2=0), tf=tf, shadow=False)
    # a small skull lashed on the end, with a green fire
    S.shape(blob([(0, 22), (14, 30), (16, 46), (8, 58), (0, 60), (-8, 58), (-16, 46), (-14, 30)]), S.lg("#9BE86A", "#3FA548"),
            tf=tf, shadow=False, shade=0.15, decor=[f'<circle cx="0" cy="46" r="10" fill="#E8FFB0" opacity="0.8" transform="{tf}"/>'])
    S.shape(blob([(-9, 30), (9, 30), (11, 40), (6, 48), (-6, 48), (-11, 40)]), S.lg("#F6EEDA", "#CBBE9E"), tf=tf, shadow=True, sh=3,
            decor=[f'<g transform="{tf}"><circle cx="-4.5" cy="38" r="3.2" fill="{INK}"/><circle cx="4.5" cy="38" r="3.2" fill="{INK}"/></g>'])


def orc_shaman():
    S = Sprite('ORC SHAMAN (round 4 greenskin), ~110%: darker moss-green skin, a bleached beast skull worn as a helm '
               'with two horns, a grey wolf-fur mantle, small tusks, a gnarled staff with a little skull in a green fire. '
               'Parts: #arm-r (staff + fist, before #body), #body, #arm-l (empty hand). Scaled 1.1. Facing = DOWN (+y).',
               k=1.1)
    skin, skinD = "#5E9468", "#3A6646"
    S.group("arm-r", (160, 104))
    staff(S, 152, 132, -4)
    fist(S, 152, 132, -4, S.lg(skin, skinD), w=22, h=26, knuckle=1)
    S.group("body")
    # fur mantle, shaggy edge
    pts = []
    for i in range(17):
        t = math.pi * (i / 16)
        r = 82 if i % 2 == 0 else 72
        pts.append((100 - math.cos(t) * r, 108 + math.sin(t) * r * 0.45 - 4))
    back = [(100 + (p[0] - 100), 108 - (p[1] - 108) * 0.9) for p in reversed(pts[1:-1])]
    S.shape(blob(pts + back, 0.8), S.lg("#A8A094", "#6E665C"))
    orc_head(S, skin, skinD, tusk=0.6)
    # skull helm with horns
    for side in (1, -1):
        pts = [(124, 64), (150, 52), (164, 30), (160, 54), (138, 76)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.9), S.lg("#D8CBAA", "#A2946E"), sh=3)
    S.shape(sym([(100, 40), (126, 44), (138, 62), (134, 86), (118, 104), (108, 112), (100, 114)]), S.lg("#F6EEDA", "#C9BB98"),
            hi=0.4, sh=5, decor=[f'<path d="{ell(86, 82, 8, 9)} {ell(114, 82, 8, 9)}" fill="{INK}" opacity="0.85"/>',
                                 f'<path d="{ell(96, 106, 2.5, 4)} {ell(104, 106, 2.5, 4)}" fill="{INK}" opacity="0.6"/>'])
    for x in (84, 116):
        S.flat(ell(x, 117, 5.5, 4.5), "#F2E040")
    S.group("arm-l", (40, 106))
    fist(S, 42, 144, 0, S.lg(skin, skinD), w=22, h=26, knuckle=-1)
    return S


def troll():
    S = Sprite('TROLL (round 4 greenskin), ~130%: sea-green/teal skin, hunched, a small head low and forward with a '
               'big round nose and little tusks at the jaw corners, a shaggy dark mane over the back, very long arms '
               'reaching forward with big three-clawed hands. Parts: #body, #arm-l/#arm-r (long arms, pivot at the '
               'shoulders, drawn over the body). Scaled 1.28. Facing = DOWN (+y), centre (100,100).', k=1.28)
    skin, skinD = "#6FB0A0", "#3E7668"
    S.group("body")
    S.shape(sym([(100, 46), (140, 48), (168, 66), (176, 94), (164, 118), (100, 128)]), S.lg(skin, skinD))
    pts = [(100, 26), (116, 32), (126, 26), (136, 40), (150, 36), (154, 54), (166, 56), (160, 74), (146, 80), (100, 92)]
    S.shape(sym(pts, 0.7), S.lg("#4E5A3A", "#2E3424"), sh=3, shade=0.2)
    for side in (1, -1):
        pts = [(122, 102), (142, 100), (152, 108), (140, 116), (124, 116)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.9), S.lg(skin, skinD), sh=3)
    S.shape(sym([(100, 74), (120, 78), (132, 94), (132, 116), (122, 132), (100, 140)]), S.lg(skin, skinD), sh=5, hi=0.3)
    for side in (1, -1):
        pts = [(112, 130), (118, 126), (124, 136), (122, 142), (116, 138)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.7), S.lg("#FFF6DA", "#D8C8A0"), sh=2, shade=0)
    S.shape(ell(100, 132, 12, 13), S.lg("#86C4B2", "#4E8A7A"), sh=4, hi=0.3)
    for x in (88, 112):
        S.flat(ell(x, 108, 4.5, 4), "#FFD84A")
    for side, gid, sx in ((-1, "arm-l", 40), (1, "arm-r", 160)):
        S.group(gid, (sx, 88))
        pts = [(sx, 86), (sx + side * 6, 112), (sx + side * 4, 132), (sx + side * 2, 144)]
        S.shape(stroke_path(pts, 30, 22), S.lg(skin, skinD), sh=5)
        hx, hy = sx + side * 2, 148
        S.shape(blob([(hx - 15, hy - 6), (hx, hy - 12), (hx + 15, hy - 6), (hx + 16, hy + 8), (hx, hy + 14), (hx - 16, hy + 8)]),
                S.lg(skin, skinD), sh=3)
        cl = []
        for dx in (-10, 0, 10):
            cl.append(blob([(hx + dx - 4, hy + 10), (hx + dx + 4, hy + 10), (hx + dx + 1.5, hy + 22), (hx + dx - 1.5, hy + 22)], 0.6))
        S.shape(" ".join(cl), S.lg("#F2E6C4", "#C8B890"), shadow=False, shade=0)
    return S


def ogre():
    S = Sprite('OGRE (round 4 greenskin), the biggest: pale grey-sage skin, a huge round back and a big belly bulging '
               'out in front, a small bald head with a black topknot, a leather strap across the belly, a big studded '
               'club. Parts: #arm-r (club + fist, before #body), #body, #arm-l (empty fist). Scaled 1.22 (fills the '
               'sprite box). Facing = DOWN (+y), centre (100,100).', k=1.22)
    skin, skinD = "#BAC6A4", "#869676"
    S.group("arm-r", (158, 100))
    tf = frame(158, 128, -12)
    S.shape(blob([(-6, -44), (6, -44), (8, -2), (16, 22), (17, 40), (0, 52), (-17, 40), (-16, 22), (-8, -2)], 0.9),
            S.lg("#B88A58", "#7A5232", x2=1, y2=0.2), tf=tf, shadow=False,
            decor=[f'<g transform="{tf}" fill="#8C94A0"><circle cx="-7" cy="30" r="4"/><circle cx="7" cy="42" r="4"/><circle cx="8" cy="20" r="3.5"/><circle cx="-4" cy="46" r="3.5"/></g>'])
    fist(S, 158, 130, -12, S.lg(skin, skinD), w=24, h=28, knuckle=1)
    S.group("body")
    S.shape(sym([(100, 34), (136, 38), (164, 56), (178, 88), (170, 116), (140, 128), (100, 132)]), S.lg(skin, skinD))
    S.shape(sym([(100, 92), (130, 96), (148, 116), (144, 144), (124, 162), (100, 166)]), S.lg("#CCD6B6", "#97A684"), sh=6,
            hi=0.35, decor=[f'<path d="M46 132 L156 96 L160 110 L50 146 Z" fill="#7A5236"/>',
                            f'<path d="{ell(100, 148, 3.5, 2.5)}" fill="#6E7A5E"/>'])
    for side in (1, -1):
        S.shape(ell(100 + side * 28, 72, 6, 8), S.lg(skin, skinD), sh=3)
    S.shape(sym([(100, 50), (118, 52), (128, 66), (128, 84), (118, 98), (100, 102)]), S.lg(skin, skinD), sh=6, hi=0.35)
    S.shape(circ(100, 52, 8), S.lg("#3E3440", "#221C26"), sh=3, shade=0.1)
    for x in (91, 109):
        S.flat(ell(x, 84, 3, 3), INK)
    for x in (94, 106):
        S.shape(poly([(x - 2.5, 100), (x + 2.5, 100), (x, 106)]), "#F6EEDA", shadow=False, shade=0)
    S.group("arm-l", (42, 100))
    fist(S, 48, 134, 4, S.lg(skin, skinD), w=24, h=28, knuckle=-1)
    return S


if __name__ == "__main__":
    import sys
    which = sys.argv[1:] or ["goblin"]
    out = []
    for w in which:
        S = globals()[w.replace("-", "_")]()
        p = S.write(f"greenskin-{w}.svg")
        out.append((p, w.title()))
    render(out)
