"""Fiends: imp, devil, demon, fiend. Four different shapes: a winged little imp, a classic red devil with a trident,
a hulking demon with ram horns and burning fists, and a four-legged fiend beast."""
from lib import *
import math

BONE = ("#F4EAD2", "#C2B394")


def bat_wing(S, side, root, tip, span_pts, col, colD):
    pts = span_pts if side > 0 else mx(span_pts)
    S.shape(blob(pts, 0.8), S.lg(col, colD), shadow=False, shade=0.25)


def imp():
    S = Sprite('IMP (round 4 fiend), ~60%: orange-red, all head, two little back-swept horns, pointed ears, big yellow '
               'eyes, wide bat wings, a thin tail with a spade tip, a fireball in its right claw. Parts: #back (tail + '
               'wings), #arm-r (fireball claw), #body, #arm-l (empty claw). Scaled 0.62. Facing = DOWN (+y).', k=0.62)
    skin, skinD = "#F07A44", "#C8462C"
    S.group("back", (100, 96))
    S.shape(stroke_path([(100, 84), (108, 56), (122, 34), (128, 16)], 9, 6), S.lg(skin, skinD), shadow=False)
    S.shape(blob([(130, 0), (142, 18), (132, 26), (124, 24), (114, 20)], 0.6), S.lg("#5A2A3A", "#2E1620"), shadow=False)
    for side in (1, -1):
        bat_wing(S, side, None, None, [(124, 88), (156, 56), (196, 36), (204, 52), (194, 82), (184, 76), (178, 100), (164, 94),
                                       (156, 114), (136, 106)], "#B8344A", "#6E1A30")
    S.group("arm-r", (146, 110))
    S.shape(blob([(132, 156), (136, 140), (146, 146), (150, 130), (158, 144), (166, 136), (166, 158), (150, 174), (136, 170)], 0.8),
            S.lg("#FFB23A", "#F0582A", x2=0, y2=1), shadow=False, shade=0)
    S.shape(circ(150, 160, 9), S.lg("#FFFBD0", "#FFD84A"), shadow=False, shade=0)
    S.shape(rr(148, 140, 22, 16, 7), S.lg(skin, skinD), sh=3)
    S.group("body")
    S.shape(sym([(100, 84), (128, 86), (148, 100), (146, 120), (100, 128)]), S.lg(skin, skinD))
    for side in (1, -1):
        pts = [(134, 96), (162, 90), (180, 80), (166, 104), (138, 114)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.9), S.lg(skin, skinD), sh=3)
    S.shape(sym([(100, 56), (130, 60), (146, 82), (146, 110), (132, 134), (100, 144)]), S.lg(skin, skinD), sh=5, hi=0.35)
    for side in (1, -1):
        pts = [(110, 66), (120, 62), (124, 44), (118, 30), (112, 46)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.8), S.lg("#5A2A3A", "#2E1620"), sh=3, shade=0.15)
    for x in (82, 118):
        S.flat(ell(x, 118, 10, 10), "#FFE15A")
        S.flat(ell(x + 0.5, 119, 2.6, 7.5), INK)
    S.group("arm-l", (54, 110))
    S.shape(rr(56, 144, 20, 16, 7), S.lg(skin, skinD), sh=3)
    S.shape(" ".join(poly([(x - 3, 150), (x + 3, 150), (x, 158)]) for x in (49, 56, 63)), "#F2E6C4", shadow=False, shade=0)
    return S


def trident(S, x, y, a, metal=("#F3D37A", "#B0832E")):
    tf = frame(x, y, a)
    S.shape(rr(0, -40, 7, 104, 3.5), S.lg("#4A2A30", "#2A161C", x2=1, y2=0), tf=tf, shadow=False)
    m = S.lg(*metal, x2=1, y2=0.3)
    S.shape(blob([(-16, 20), (-12, 16), (12, 16), (16, 20), (16, 30), (11, 30), (11, 24), (-11, 24), (-11, 30), (-16, 30)], 0.4),
            m, tf=tf, shadow=False)
    for tx, ln in ((-13.5, 46), (0, 52), (13.5, 46)):
        S.shape(blob([(tx - 2.5, 26), (tx + 2.5, 26), (tx + 2.5, ln - 8), (tx + 5.5, ln - 9), (tx, ln + 2), (tx - 5.5, ln - 9), (tx - 2.5, ln - 8)], 0.3),
                m, tf=tf, shadow=False, shade=0.2)


def devil():
    S = Sprite('DEVIL (round 4 fiend), archer-sized: scarlet skin, slicked black hair with a widow\'s peak, two black '
               'horns, a pointed black goatee, yellow eyes, a long tail with an arrowhead tip, a gold trident. Parts: '
               '#back (tail, pivot at its root), #arm-r (trident + fist, before #body), #body, #arm-l (empty fist). '
               'Scaled 1.04. Facing = DOWN (+y), centre (100,100).', k=1.04)
    skin, skinD = "#E2483C", "#A8222A"
    S.group("back", (112, 80))
    S.shape(stroke_path([(108, 84), (124, 58), (150, 40), (172, 36), (186, 24)], 11, 7), S.lg(skin, skinD), shadow=False)
    S.shape(blob([(180, 14), (196, 4), (200, 24), (192, 34), (176, 30)], 0.6), S.lg("#3A2430", "#1E1018"), shadow=False)
    S.group("arm-r", (160, 104))
    trident(S, 154, 142, -4)
    fist(S, 154, 142, -4, S.lg(skin, skinD), w=22, h=25, knuckle=1)
    S.group("body")
    S.shape(sym([(100, 74), (142, 76), (172, 92), (176, 114), (158, 136), (100, 140)]), S.lg("#B8303A", "#7A1A24"))
    for side in (1, -1):
        pts = [(140, 100), (158, 94), (172, 88), (162, 108), (142, 114)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.9), S.lg(skin, skinD), sh=3)
    S.shape(sym([(100, 50), (132, 54), (149, 76), (150, 104), (140, 128), (100, 144)]), S.lg(skin, skinD), sh=5, hi=0.3)
    for side in (1, -1):
        pts = [(118, 70), (132, 62), (146, 54), (156, 36), (156, 58), (138, 80)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.85), S.lg("#5A3440", "#22121A"), sh=4, shade=0.15, hi=0.35)
    S.shape(blob([(90, 136), (100, 132), (110, 136), (106, 154), (100, 168), (94, 154)], 0.8), S.lg("#3A2C38", "#1A1220"), sh=3, shade=0.1)
    for x in (84, 116):
        S.flat(blob([(x - 8, 118), (x, 113), (x + 8, 118), (x, 123)]), "#FFE24A")
        S.flat(ell(x, 118, 2, 4.5), INK)
    S.group("arm-l", (40, 106))
    fist(S, 44, 142, 4, S.lg(skin, skinD), w=22, h=25, knuckle=-1)
    return S


def ram_horn(S, side, col):
    # a thick C-curl: up off the head, out, back down and round to the front, tapering
    c = (142, 92)
    pts = []
    for i in range(9):
        t = math.radians(-150 + i * 34)
        r = 28 - i * 1.6
        pts.append((c[0] + math.cos(t) * r, c[1] + math.sin(t) * r))
    pts = [(c[0] - 26, c[1] - 6)] + pts
    if side < 0: pts = mx(pts)
    S.shape(stroke_path(pts, 22, 8), col, sh=4, shade=0.25, hi=0.25)


def demon():
    S = Sprite('DEMON (round 4 fiend), ~120%: a hulking dark violet brute, two huge horns sweeping '
               'back, a crest of fire on the head, glowing eyes and two huge burning fists (no weapon). Parts: #back '
               '(the head fire, flickers), #body, #arm-l/#arm-r (burning fists, pivot at the shoulders). Scaled 1.15.',
               k=1.15)
    skin, skinD = "#6E4E86", "#3A2650"
    S.group("back", (100, 70))
    S.shape(blob([(100, 76), (124, 62), (128, 36), (118, 44), (114, 18), (104, 32), (98, 8), (90, 30), (82, 20), (80, 42),
                  (72, 36), (76, 62)], 0.7), S.lg("#FFE06A", "#FF6A2A", x2=0, y2=1), shadow=False, shade=0)
    S.group("body")
    crack = "#FF8A2A"
    S.shape(sym([(100, 68), (146, 66), (178, 84), (184, 110), (166, 134), (100, 140)]), S.lg(skin, skinD))
    for side in (1, -1):
        pts = [(116, 76), (136, 62), (156, 52), (170, 36), (172, 18)]
        if side < 0: pts = mx(pts)
        S.shape(stroke_path(pts, 24, 3), S.lg("#3E3236", "#ECE0C8", x2=0, y2=1),
                sh=4, shade=0.25, hi=0.3)
    S.shape(sym([(100, 54), (128, 58), (144, 78), (146, 104), (136, 126), (100, 138)]), S.lg(skin, skinD), sh=5, hi=0.25)
    S.shape(sym([(100, 100), (122, 104), (132, 114), (122, 122), (100, 118)]), S.lg("#5A3E70", "#34224A"), sh=3, shade=0.1)
    for x in (85, 115):
        S.flat(blob([(x - 8, 120), (x, 115), (x + 8, 120), (x, 125)]), "#FFB43A")
        S.flat(ell(x, 120, 4, 2.2), "#FFF4B0")
    for side, gid, sx in ((-1, "arm-l", 38), (1, "arm-r", 162)):
        S.group(gid, (sx, 104))
        hx, hy = sx + side * 4, 142
        fl = [(hx - 18, hy + 6), (hx - 22, hy - 14), (hx - 12, hy - 6), (hx - 10, hy - 26), (hx, hy - 12), (hx + 8, hy - 28),
              (hx + 12, hy - 8), (hx + 22, hy - 16), (hx + 18, hy + 6), (hx, hy + 18)]
        S.shape(blob(fl, 0.7), S.lg("#FFE06A", "#FF6A2A", x2=0, y2=1), shadow=False, shade=0)
        S.shape(rr(hx, hy, 32, 28, 11), S.lg(skin, skinD), sh=4)
        S.shape(" ".join(blob([(hx + dx - 4, hy + 11), (hx + dx + 4, hy + 11), (hx + dx, hy + 22)], 0.5) for dx in (-10, 0, 10)),
                S.lg("#3A2C40", "#1A1220"), shadow=False, shade=0)
    return S


def fiend():
    S = Sprite('FIEND (round 4 fiend), the beast: a four-legged hellhound shape, dark maroon hide, a row of bone spikes '
               'down the spine, two bone horns swept back off the brow, glowing green eyes, a barbed tail. Parts: #back '
               '(tail, pivot at its root), #body (hind legs, torso, head), #arm-l/#arm-r (front legs, pivot at the '
               'shoulders, for swipes). Scaled 1.06. Facing = DOWN (+y), centre (100,100).', k=1.06)
    hide, hideD = "#8A3E3A", "#4E1E22"
    S.group("back", (100, 46))
    S.shape(stroke_path([(100, 50), (96, 30), (104, 14), (116, 4)], 16, 7), S.lg(hide, hideD), shadow=False)
    S.shape(blob([(110, -4), (126, -2), (122, 10), (112, 12)], 0.7), S.lg(*BONE), shadow=False, shade=0.2)
    S.group("body")
    for side in (1, -1):  # hind legs: haunch out to the side, paw pointing forward
        pts = [(118, 40), (138, 44), (148, 58), (150, 72)]
        if side < 0: pts = mx(pts)
        S.shape(stroke_path(pts, 24, 16), S.lg(hide, hideD), shadow=False)
        px = 100 + side * 50
        S.shape(ell(px, 76, 11, 10), S.lg(hide, hideD), sh=3)
        S.shape(" ".join(blob([(px + dx - 3, 82), (px + dx + 3, 82), (px + dx, 90)], 0.5) for dx in (-7, 0, 7)),
                S.lg(*BONE), shadow=False, shade=0)
    S.shape(sym([(100, 28), (124, 34), (138, 60), (146, 96), (138, 122), (100, 134)]), S.lg(hide, hideD), hi=0.2)
    for i, (y, h) in enumerate([(40, 12), (60, 15), (80, 17), (100, 15)]):
        S.shape(blob([(93, y + 6), (100, y - h), (107, y + 6), (100, y + 10)], 0.6), S.lg(*BONE), sh=3, shade=0.2)
    # head: a long wedge snout
    S.shape(sym([(100, 104), (124, 110), (134, 128), (126, 156), (114, 182), (100, 190)]), S.lg(hide, hideD), sh=6, hi=0.3)
    for side in (1, -1):
        pts = [(114, 118), (134, 106), (156, 98), (172, 78), (164, 106), (134, 130)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.85), S.lg(*BONE), sh=3, shade=0.25)
    for x in (88, 112):
        S.flat(blob([(x - 7, 136), (x, 131), (x + 7, 137), (x, 140)]), "#B6FF5A")
    S.flat(f"{ell(94, 178, 2.4, 3.2)} {ell(106, 178, 2.4, 3.2)}", "#2A1418")
    for side in (1, -1):
        pts = [(112, 168), (118, 164), (116, 178)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.5), S.lg(*BONE), sh=2, shade=0)
    for side, gid, sx in ((-1, "arm-l", 66), (1, "arm-r", 134)):
        S.group(gid, (sx, 112))
        pts = [(sx, 108), (sx + side * 16, 128), (sx + side * 20, 150)]
        S.shape(stroke_path(pts, 24, 18), S.lg(hide, hideD), sh=5)
        px, py = sx + side * 20, 156
        S.shape(ell(px, py, 13, 11), S.lg(hide, hideD), sh=3)
        S.shape(" ".join(blob([(px + dx - 3.5, py + 7), (px + dx + 3.5, py + 7), (px + dx, py + 17)], 0.5) for dx in (-8, 0, 8)),
                S.lg(*BONE), shadow=False, shade=0)
    return S


if __name__ == "__main__":
    import sys
    which = sys.argv[1:] or ["imp", "devil", "demon", "fiend"]
    out = []
    for w in which:
        S = globals()[w]()
        out.append((S.write(f"fiend-{w}.svg"), w.title()))
    render(out)
