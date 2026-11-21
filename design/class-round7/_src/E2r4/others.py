"""Dragonborn, angel, cherub."""
from lib import *
import math

IRON = ("#E4E8EE", "#8C94A1")
GOLD = ("#FFE08A", "#C8902E")
BRONZE = ("#E0A860", "#94602C")
SKIN = ("#F4CBA5", "#DCA27E")


RED, EYES, FACE = False, True, False
# round 7, dragonborn A ("horns look like they are floating"): HORNS_R7 attaches the horns (off here, so lizards6.py
# still builds round 6; lizards7.py turns it on for version a). See dragonborn().
HORNS_R7 = False


def face_shade(S, y0, y1, col, brow):
    """The heroes' face shading as a see-through overlay on a head running from y0 (back of the head) to y1 (snout tip):
    a soft shadow across the brow, where a hero's face is darkest under the hat and where the eyes were, fading to the
    light middle of the snout, a touch darker again at the tip."""
    gid = S.uid("g")
    o = lambda y: f"{max(0.0, min(1.0, (y - y0) / (y1 - y0))):.3f}"
    S.defs.append(f'<linearGradient id="{gid}" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">'
                  f'<stop offset="{o(brow - 24)}" stop-color="{col}" stop-opacity="0"/>'
                  f'<stop offset="{o(brow)}" stop-color="{col}" stop-opacity="0.5"/>'
                  f'<stop offset="{o(brow + 12)}" stop-color="{col}" stop-opacity="0.3"/>'
                  f'<stop offset="{o(brow + 30)}" stop-color="{col}" stop-opacity="0"/>'
                  f'<stop offset="{o(y1 - 16)}" stop-color="{col}" stop-opacity="0"/>'
                  f'<stop offset="1" stop-color="{col}" stop-opacity="0.16"/></linearGradient>')
    return f'<rect x="-20" y="{y0}" width="240" height="{y1 - y0}" fill="url(#{gid})"/>'


def falchion(S, x, y, a):
    tf = frame(x, y, a)
    S.shape(rr(0, -14, 8, 30, 3.5), S.lg("#5A3424", "#38201A", x2=1, y2=0), tf=tf, shadow=False)
    S.shape(rr(0, 6, 26, 8, 4), S.lg(*BRONZE), tf=tf, shadow=False)
    S.shape(blob([(-8, 9, 'c'), (8, 9), (13, 28), (11, 42), (0, 50), (-6, 43), (-8, 28)], 0.7), S.lg(*IRON, x2=1, y2=0.2),
            tf=tf, shadow=False)


def dragonborn():
    S = Sprite('DRAGONBORN (round 4), ~115%: a dragon-flavoured lizardman warrior. Sapphire-blue scales, a broad dragon '
               'snout, two big ivory horns swept back off the brow, teal frill fans on the cheeks, small folded wings, '
               'bronze pauldrons, a falchion. Parts: #back (wings), #arm-r (falchion + claw, before #body), #body, '
               '#arm-l (empty claw). Scaled 1.12. Facing = DOWN (+y), centre (100,100).', k=1.12)
    # round 6 ("should be red; overall not great" + "try without eyes, then one with shading like humans over the face"):
    # RED recolours it (scales red, wings dark red, cheek frills gold-orange, nostrils dark red; horns, pauldrons, claws
    # and the falchion as they were); EYES=False drops the eyes; FACE=True lays the heroes' face shading over the head.
    sc, scD = ("#D9574A", "#94262A") if RED else ("#5A8EDC", "#2C5098")
    S.group("back", (100, 84))
    for side in (1, -1):
        pts = [(118, 86), (140, 62), (160, 36), (170, 22), (172, 44), (164, 52), (162, 70), (150, 74), (142, 92)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.75), S.lg(*(("#A8343A", "#661820") if RED else ("#3E5EA8", "#1E3270"))), shadow=False, shade=0.2)
    S.group("arm-r", (160, 106))
    falchion(S, 154, 138, -6)
    fist(S, 154, 138, -6, S.lg(sc, scD), w=21, h=24, knuckle=1, claws="#F2E6C4")
    S.group("body")
    S.shape(sym([(100, 74), (142, 76), (172, 92), (176, 114), (158, 136), (100, 140)]), S.lg(sc, scD))
    for side in (1, -1):
        S.shape(ell(100 + side * 56, 102, 22, 20), S.lg(*BRONZE), sh=4, hi=0.4)
    # frills: fans of spines on the cheeks
    for side in (1, -1):
        pts = [(132, 82), (150, 70), (158, 80), (166, 82), (166, 94), (174, 100), (164, 108), (166, 118), (140, 116)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.6), S.lg(*(("#F2B24A", "#C06A24") if RED else ("#5AD0C0", "#228A8A"))), sh=3, shade=0.2)
    if HORNS_R7:
        # round 7: the horns lay on top of the head with their thin roots ending on it and a drop shadow under them,
        # so they looked like they floated over the head. Now they grow out of the skull: drawn under the head, the
        # roots hidden by it, the same ivory horns coming out of the head's edge at the temples and sweeping back,
        # a little longer so as much horn shows as before.
        S.comment = S.comment.replace("two big ivory horns swept back off the brow", "two big ivory horns growing out of "
                                      "the sides of the skull and sweeping back (round 7: they lay on top of the head)")
        for side in (1, -1):
            pts = [(116, 80), (124, 64), (140, 48), (154, 24), (152, 54), (140, 84)]
            if side < 0: pts = mx(pts)
            S.shape(blob(pts, 0.85), S.lg("#FFF4DC", "#C8B48E"), sh=4, shade=0.25, hi=0.3)
    S.shape(sym([(100, 50), (128, 54), (144, 74), (144, 100), (134, 122), (124, 144), (116, 164), (100, 170)]),
            S.lg(sc, scD), sh=5, hi=None if FACE else 0.35,
            decor=[f'<path d="{ell(100, 96, 12, 30)}" fill="{"#F4927C" if RED else "#7EAAEC"}" opacity="{0.45 if RED else 0.5}"/>']
            + ([face_shade(S, 50, 170, "#5A1418", 100)] if FACE else []))
    for side in ((1, -1) if not HORNS_R7 else ()):
        pts = [(112, 70), (124, 62), (140, 50), (150, 30), (146, 56), (128, 80)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.85), S.lg("#FFF4DC", "#C8B48E"), sh=4, shade=0.25, hi=0.3)
    for x in (80, 120) if EYES else ():
        S.flat(ell(x, 104, 6.5, 7), "#FFB43A")
        S.flat(ell(x + 0.5, 104.5, 2, 6), INK)
    S.flat(f"{ell(93, 160, 2.5, 3.6)} {ell(107, 160, 2.5, 3.6)}", "#5A1418" if RED else "#1E3268")
    S.group("arm-l", (40, 106))
    fist(S, 44, 142, 4, S.lg(sc, scD), w=21, h=24, knuckle=-1, claws="#F2E6C4")
    return S


def feather_wing(S, side, pts, col, colD):
    if side < 0: pts = mx(pts)
    S.shape(blob(pts, 0.7), S.lg(col, colD), shadow=False, shade=0.18)


def angel():
    S = Sprite('ANGEL (round 4), archer-sized, enemy or ally: big white feathered wings spread out behind, a gold halo '
               'ring over brown hair, white robe shoulders with a gold collar, a gold spear (no eyes, the small mouth curve the heroes have). '
               'Parts: #back (wings, pivot at the centre of the back), #arm-r (spear + fist, before #body), #body, '
               '#arm-l (empty hand). Facing = DOWN (+y), centre (100,100).')
    S.group("back", (100, 90))
    for side in (1, -1):
        outer = [(118, 92), (140, 66), (170, 44), (200, 30), (204, 46), (198, 62), (202, 72), (190, 84), (192, 96),
                 (178, 104), (176, 116), (160, 116), (152, 124), (134, 112)]
        feather_wing(S, side, outer, "#FFFFFF", "#C9CEDE")
        inner = [(122, 92), (142, 74), (166, 58), (174, 70), (166, 82), (168, 94), (154, 98), (150, 108), (132, 106)]
        feather_wing(S, side, inner, "#F6F4FA", "#D8DCE8")
    S.group("arm-r", (160, 108))
    tf = frame(156, 144, -5)
    S.shape(rr(0, -50, 7, 108, 3.5), S.lg("#F6E6B0", "#C89A40", x2=1, y2=0), tf=tf, shadow=False)
    S.shape(blob([(0, 6), (10, 18), (12, 30), (0, 50), (-12, 30), (-10, 18)], 0.8), S.lg(*GOLD, x2=1, y2=0.3), tf=tf,
            shadow=False, decor=[f'<path d="M0 6 L10 18 L12 30 L0 50 Z" fill="#B07A20" opacity="0.35" transform="{tf}"/>'])
    S.shape(rr(0, 4, 14, 7, 3.5), S.lg(*GOLD), tf=tf, shadow=False)
    fist(S, 156, 142, -5, S.lg(*SKIN), w=21, h=24, knuckle=1)
    S.group("body")
    S.shape(sym([(100, 76), (142, 78), (172, 94), (176, 114), (158, 136), (100, 142)]), S.lg("#FBF8F0", "#CFC8B8"))
    S.shape(sym([(100, 112), (122, 112), (140, 122), (134, 138), (100, 148)]), S.lg(*GOLD), sh=3)
    S.shape(sym([(100, 50), (132, 54), (149, 76), (150, 104), (140, 128), (100, 144)]), S.lg(*SKIN), sh=5)
    hair = [(100, 42), (124, 44), (146, 58), (156, 82), (156, 110), (148, 124), (142, 106), (132, 96), (116, 100), (100, 96)]
    S.shape(sym(hair, 0.85), S.lg("#B87A4A", "#7A4A2A"), sh=4, hi=0.3)
    S.shape(ring(100, 64, 34, 30, 9), S.lg("#FFF2B0", "#E8B440"), sh=5, shade=0.15)
    S.raw('<path d="M96 129 Q100 131.5 104 129" fill="none" stroke="#C98868" stroke-width="2.5" stroke-linecap="round"/>')
    S.group("arm-l", (40, 108))
    fist(S, 44, 144, 0, S.lg(*SKIN), w=21, h=24, knuckle=0)
    return S


def cherub():
    S = Sprite('CHERUB (round 4), ~60%, enemy or ally: a chubby baby with blond curls, rosy skin, little round white '
               'wings, a small gold bow with a heart-tipped arrow (no eyes, the small mouth curve the heroes have). Parts: #back (wings), '
               '#body, #arm-r (drawing hand), #arm-l (bow + bow hand, in front). Scaled 0.62. Facing = DOWN (+y).', k=0.62)
    skin = S.lg("#FFD6BE", "#EAA28C")
    S.group("back", (100, 96))
    for side in (1, -1):
        pts = [(124, 96), (146, 72), (174, 58), (190, 66), (186, 82), (192, 94), (176, 104), (172, 116), (150, 114), (132, 112)]
        feather_wing(S, side, pts, "#FFFFFF", "#CCD2E2")
    S.group("body")
    S.shape(sym([(100, 86), (134, 88), (156, 102), (156, 122), (134, 136), (100, 138)]), skin)
    S.shape(sym([(100, 54), (132, 58), (150, 80), (150, 108), (140, 130), (100, 144)]), skin, sh=5, hi=0.3)
    # curls: a scalloped cap, each bump an arc
    pts = []
    for i in range(10):
        t = math.radians(160 + i * 24.4)
        pts.append((100 + math.cos(t) * 48, 90 + math.sin(t) * 42))
    d = f"M{f(pts[0][0])} {f(pts[0][1])}"
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        r = math.hypot(x1 - x0, y1 - y0) * 0.56
        d += f" A{f(r)} {f(r)} 0 0 1 {f(x1)} {f(y1)}"
    d += " C128 102 114 92 100 100 C86 92 72 102 55 106 Z"
    S.shape(d, S.lg("#FFE89A", "#E2AC40"), sh=4, hi=0.35)
    S.raw('<path d="M94 128 Q100 132 106 128" fill="none" stroke="#D98A7A" stroke-width="3.6" stroke-linecap="round"/>')
    S.group("arm-r", (146, 112))
    S.shape(rr(124, 150, 22, 18, 8), skin, sh=3)
    S.group("arm-l", (60, 112))
    S.shape("M44 156 C70 182 130 182 156 156 L150 150 C128 170 72 170 50 150 Z", S.lg(*GOLD), shadow=True, sh=3, shade=0.2)
    S.shape(rr(100, 164, 4, 52, 2), S.lg("#C89A60", "#8A6034"), shadow=False, shade=0)
    S.shape("M100 210 C92 202 86 196 90 190 C94 185 99 188 100 192 C101 188 106 185 110 190 C114 196 108 202 100 210 Z",
            S.lg("#FF7A9A", "#D83A6A"), shadow=False, shade=0.1)
    S.shape(rr(100, 170, 22, 18, 8), skin, sh=3)
    return S


if __name__ == "__main__":
    import sys
    names = {"dragonborn": "dragonborn-dragonborn.svg", "angel": "celestial-angel.svg", "cherub": "celestial-cherub.svg"}
    which = sys.argv[1:] or list(names)
    out = []
    for w in which:
        S = globals()[w]()
        out.append((S.write(names[w]), w.title()))
    render(out)
