"""Round 11, the redraws: where the note was "Try again", "Meh", "Try 4 more", "try the original design just better",
"Don't like the gold mask look", "I don't love the helmet and face covering": graded sets, each option a different idea,
in the heroes' A2 library and with the parts of the design the designer kept (the bandits' gang marks, the golem's eye,
the angel's wings). The game keeps its current art for every one of these until a pick (notes.md).
python new11b.py [name ...]   -> ../../enemies/<name>.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import common
from common import *
import bandits10 as B
from bandits8 import RED, FLAME, blade_decor
import spire9 as SP9
import spire10 as SP
import bosses10 as B10
import grove8 as G8
from spire9 import STONE, DSTONE, stone
from beasts9 import taper, flame, FLAME_DEF

BUILD = {}
IRON, DIRON = "#AEB5C1", "#6E747E"
hi = lambda x, y, rx, ry, o=0.22, rot=0: (f'<path d="{ell(x, y, rx, ry)}" fill="#FFFFF4" opacity="{o}"'
                                           + (f' transform="rotate({rot} {x} {y})"' if rot else "") + "/>")


def gang(fn):
    """A bandit drawn with the round-11 gang mark (the bandanna without its fold line)."""
    def run():
        B.NO_FOLD = True
        try:
            return fn()
        finally:
            B.NO_FOLD = False
    return run


# ================================================================== the torch bandit
# "Meh. Don't like the torch. Pretty cool hat for a bandit more suited for an outlaw"
def torch11(S, T):
    """A proper torch: a long haft, an iron basket of three bands holding the burning rags, a big flame in three tongues
    (deep orange, then yellow, a pale heart)."""
    S.shape(rr(0, 4, 10, 44, 4), "#8A5E38", T=T, shadow=0)
    S.shape(blob([(-12, 22), (12, 22), (14, 40), (0, 44), (-14, 40)], 0.7), "#3E3630", T=T, shadow=2,
            decor=strokes("M -13 28 L 13 28 M -14 36 L 14 36", "#8E96A4", 3, 0.9))
    fl = blob([(-14, 38), (-20, 48), (-16, 58), (-10, 54), (-6, 66), (0, 76), (7, 65), (11, 55), (17, 59), (20, 48), (14, 38), (0, 34)], 0.75)
    mid = blob([(-9, 42), (-12, 50), (-6, 56), (-2, 64), (2, 69), (6, 58), (11, 51), (9, 42), (0, 40)], 0.75)
    S.shape(fl, fill="url(#gFlame11)", T=T, shadow=0, side=False,
            decor=f'<path d="{mid}" fill="#FFD25A"/><path d="{blob([(-4, 44), (4, 44), (5, 51), (0, 59), (-5, 51)], 0.8)}" fill="#FFF6C8"/>')
    fist(S, 0, 0, T=T)


FLAME11 = ('<linearGradient id="gFlame11" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9A3D"/>'
           '<stop offset="1" stop-color="#E0482A"/></linearGradient>')


def bandit_torch(v):
    """a "hat": the slouch hat kept exactly (round 10's), only the torch redrawn; b "cowl": a ragged sackcloth cowl, patched
    and stitched, its point hanging back; c "soot": bare-headed, a mop of rust-red hair tied back with a rag, soot on the
    brow. All: the new torch held out front left, the sword on the right."""
    S = Sprite(f"TORCH BANDIT (round 11, \"{v}\"): the gang's leather and red bandanna, a broad sword in the right hand (arm-r, "
               "under the shoulder) and a burning torch held out in the left (arm-l): a long haft, an iron basket, a big "
               "flame in three tongues. " + {"hat": "The battered slouch hat of round 10, unchanged.",
                                            "cowl": "A ragged sackcloth cowl over head and shoulders, patched and stitched, its point hanging back.",
                                            "soot": "Bare-headed: a mop of rust-red hair tied back with a rag, soot on the brow."}[v]
               + " No eyes. " + LAYOUT)
    S.add_def(FLAME11)
    if v == "cowl":
        S.group("back", (100, 60), "the cowl's point")
        S.shape(strip([(104, 52), (118, 32), (138, 18), (158, 14)], 15, taper=(0.75, 1.0)), "#A8946A", shadow=0)
    if v == "soot":
        S.group("back", (100, 56), "the tail of hair")
        S.shape(strip([(100, 54), (106, 34), (100, 16), (108, 2)], 14, taper=(0.8, 1.0)), "#A8482A", shadow=0)
    S.group("arm-r", PR, "sword")
    B.sword(S, frame(165, 124, 14))
    S.group("body")
    B.tunic(S, "#8E6238")
    if v == "hat":
        S.shape(blob([(52, 118), (50, 96), (64, 84), (100, 80), (136, 84), (150, 96), (148, 118), (132, 106), (100, 102), (68, 106)], 0.8),
                "#4E5A44", shadow=3)
    if v == "cowl":
        S.shape(blob([(30, 106), (42, 84), (70, 74), (100, 72), (130, 74), (158, 84), (170, 106), (160, 124), (146, 116), (132, 130),
                      (116, 120), (100, 132), (84, 120), (68, 130), (54, 116), (40, 124)], 0.6), "#9A8660", shadow=3)
    head(S)
    B.mask(S)
    if v == "hat":
        T = scl(0.96, dy=-7)
        HAT = "#6A4E36"
        brim = ("M28 68 C28 40 60 20 100 20 C140 20 172 40 172 68 C172 80 166 90 156 98 L150 90 L142 104 C130 112 116 116 100 116 "
                "C60 116 28 96 28 68 Z")
        S.shape(brim, HAT, T=T, shadow=5,
                decor=f'<path d="M36 68 C36 44 64 28 100 28 C136 28 164 44 164 68 C164 90 136 108 100 108 C64 108 36 90 36 68 Z" '
                      f'fill="none" stroke="{light(HAT, 1.35)}" stroke-width="2.4" stroke-dasharray="5 6" opacity="0.7"/>')
        S.shape(CROWN, light(HAT, 1.1), T=T, shadow=4, decor=f'<path d="{ell(84, 42, 20, 10)}" fill="#FFFFF4" opacity="0.12"/>')
        S.shape(BAND, RED, T=T, shadow=2)
    elif v == "cowl":
        cowl = blob([(46, 116), (40, 78), (54, 46), (78, 32), (100, 28), (122, 32), (146, 46), (160, 78), (154, 116), (142, 108),
                     (140, 90), (122, 78), (100, 75), (78, 78), (60, 90), (58, 108)], 0.8)
        S.shape(cowl, "#A8946A", shadow=4,
                decor=f'<path d="{rr(124, 52, 24, 20, 4)}" fill="#7E6C48" opacity="0.7" transform="rotate(14 124 52)"/>'
                      + strokes("M 114 44 L 118 40 M 122 44 L 126 40 M 130 46 L 134 42 M 100 30 L 100 72", "#5E4E34", 2.4, 0.7)
                      + hi(76, 50, 20, 10, 0.14))
    else:
        S.shape(blob([(50, 100), (46, 70), (60, 46), (82, 38), (100, 30), (118, 38), (140, 46), (154, 70), (150, 100), (140, 88),
                      (128, 98), (116, 86), (100, 96), (84, 86), (72, 98), (60, 88)], 0.7), "#A8482A", shadow=4,
                decor=hi(80, 54, 18, 9, 0.16) + strokes("M 70 50 Q 78 66 74 84 M 100 40 L 100 84 M 130 50 Q 122 66 126 84", "#7A2E1C", 3, 0.5))
        S.shape("M54 60 C66 68 84 72 100 72 C116 72 134 68 146 60 C148 64 148 70 146 74 C134 82 116 86 100 86 C84 86 66 82 54 74 "
                "C52 70 52 64 54 60 Z", "#D8CDB4", shadow=2)
        S.raw(f'<path d="{ell(74, 108, 9, 4.5)} {ell(120, 106, 7, 3.5)}" fill="#3A302C" opacity="0.3"/>')
    S.group("arm-l", PL, "torch")
    torch11(S, frame(56, 128, 22))
    return save("enemies", f"bandit-torch-{v}", S)


# ================================================================== the greatsword bandit ("Meh")
def greatsword(S):
    """Round 10's great sword, both fists on it, across the front (unchanged: the note was on the bandit)."""
    S.group("arm-r", PR, "greatsword, both hands, in front")
    T = frame(156, 114, 48)
    S.shape(rr(0, -8, 11, 50, 4), "#4A3226", T=T, shadow=0)
    S.shape(circ(0, -35, 7.5), BRASS, T=T, shadow=0)
    L = 100
    blade = [(-16, 20), (16, 20), (15, L), (0, L + 22), (-15, L)]
    S.shape(poly(blade), STEEL, T=T, shadow=3, decor=blade_decor([(0, 20), (16, 20), (15, L), (0, L + 22)])
            + f'<rect x="-2" y="24" width="4" height="{L - 44}" fill="#8A93A2" opacity="0.5"/>')
    S.shape(blob([(-34, 10), (-30, 22), (0, 25), (30, 22), (34, 10), (0, 15)], 0.6), DIRON, T=T, shadow=2)
    fist(S, 0, -22, T=T)
    fist(S, 0, 2, T=T)


def bandit_greatsword(v):
    """a "helm": a deserter: a dented conical iron helm with a nasal bar, a mail collar; b "hood": the gang's headsman: a
    black hood drawn to a point; c "horns": a raider: an iron-banded leather cap with two great ox horns, a bearskin over
    the shoulders."""
    what = {"helm": "a deserter soldier: a dented conical iron helm with a brow band and a nasal bar down over the face, a mail collar",
            "hood": "the gang's headsman: a black hood drawn up to a point that falls back",
            "horns": "a raider: a leather cap banded in iron with two great ox horns curving out and forward, a brown bearskin over the shoulders"}[v]
    S = Sprite(f"GREATSWORD BANDIT (round 11, \"{v}\"): the gang's leather and red bandanna; {what}; the great two-handed "
               "sword of round 10 held across the front in both fists (arm-r, after #body; no arm-l). No eyes. " + LAYOUT)
    if v == "hood":
        S.group("back", (100, 56), "the hood's point")
        S.shape(strip([(100, 50), (110, 30), (126, 14), (146, 6)], 14, taper=(0.8, 1.0)), "#2E2A34", shadow=0)
    S.group("body")
    B.tunic(S, "#8E6238", patch=False)
    if v == "helm":
        S.shape(cloud(100, 104, 46, 15, 0.5), "#8A919E", shadow=3, T="translate(100 104) scale(1.1 0.84) translate(-100 -104)")
    if v == "horns":
        S.shape(cloud(100, 102, 52, 12, 0.62, 8), "#6A4A32", shadow=3, T="translate(100 102) scale(1.16 0.76) translate(-100 -102)")
    if v == "hood":
        S.shape(blob([(38, 110), (46, 86), (70, 76), (100, 74), (130, 76), (154, 86), (162, 110), (140, 124), (100, 128), (60, 124)], 0.85), "#3A3640", shadow=3)
    head(S)
    B.mask(S)
    if v == "helm":
        S.shape(blob([(49, 98), (47, 70), (62, 46), (100, 30), (138, 46), (153, 70), (151, 98), (100, 102)], 0.8), IRON, shadow=5,
                decor=hi(80, 58, 18, 11, 0.35) + f'<path d="{blob([(118, 50), (130, 58), (124, 70), (114, 62)], 0.9)}" fill="#6E747E" opacity="0.5"/>'
                      + strokes("M 100 32 L 100 96", "#8A919E", 3, 0.7))
        S.shape("M47 88 C60 97 80 102 100 102 C120 102 140 97 153 88 C155 94 154 101 151 105 C138 113 120 117 100 117 C80 117 62 113 49 105 "
                "C46 101 45 94 47 88 Z", shade(IRON, 0.8), shadow=3,
                decor="".join(f'<circle cx="{x}" cy="{y}" r="3" fill="#E6EAF0"/>' for x, y in ((58, 101), (78, 108), (122, 108), (142, 101))))
        S.shape(blob([(93, 100), (107, 100), (106, 130), (100, 136), (94, 130)], 0.6), light(IRON, 1.08), shadow=3)   # the nasal bar
    elif v == "hood":
        hood = blob([(47, 118), (41, 80), (54, 48), (78, 33), (100, 28), (122, 33), (146, 48), (159, 80), (153, 118), (141, 110),
                     (138, 92), (120, 80), (100, 77), (80, 80), (62, 92), (59, 110)], 0.8)
        S.shape(hood, "#2E2A34", shadow=4, decor=hi(76, 50, 20, 10, 0.1) + strokes("M 100 30 L 100 74", "#4E4856", 3, 0.7))
    else:
        for s in (-1, 1):   # the horns: out from the temples, curving forward
            h = [(126, 78), (140, 64), (162, 60), (180, 72), (186, 96), (176, 84), (160, 78), (144, 84), (132, 92)]
            tip = [(180, 72), (186, 96), (176, 84)]
            S.shape(blob(h if s > 0 else mirror(h), 0.8), "#EFE4C6", shadow=3,
                    decor=f'<path d="{blob(tip if s > 0 else mirror(tip), 0.6)}" fill="#8A7A5A" opacity="0.6"/>')
        S.shape(blob([(50, 98), (47, 70), (62, 46), (100, 36), (138, 46), (153, 70), (150, 98), (128, 90), (100, 88), (72, 90)], 0.85), "#7A5236", shadow=4,
                decor=hi(80, 56, 18, 9, 0.16) + strokes("M 100 38 L 100 88 M 52 84 C 74 74 126 74 148 84", IRON, 6, 0.95))
        S.shape(circ(100, 62, 6), IRON, shadow=2)
    greatsword(S)
    return save("enemies", f"bandit-greatsword-{v}", S)


# ================================================================== the spear bandit ("Try again")
def bandit_spear(v):
    """a "kettle": a wide-brimmed iron war hat (a round brim from above) and a boar spear with a crossbar; b "wrap": a
    striped head wrap, mustard and red, its long end flying back; c "straw": a farmer turned robber: a torn conical straw
    hat, a pitchfork-straight spear with a long leaf blade."""
    what = {"kettle": "a wide-brimmed iron kettle hat, dented, with a riveted rim; a boar spear with a crossbar under its blade",
            "wrap": "a head wrap wound in mustard and red stripes, its long end flying back; a long spear with a red tassel",
            "straw": "a farmer turned robber: a torn conical straw hat; a long spear with a broad leaf blade"}[v]
    S = Sprite(f"SPEAR BANDIT (round 11, \"{v}\"): the gang's leather and red bandanna; {what}, in the right hand (arm-r, under "
               "the shoulder, the point well forward), the left hand free (arm-l). No eyes. " + LAYOUT)
    if v == "wrap":
        S.group("back", (112, 52), "the wrap's end")
        S.shape(strip([(110, 52), (126, 34), (146, 22), (168, 20)], 13, taper=(0.8, 1.0)), "#D9A441", shadow=0,
                decor=strokes("M 122 28 L 132 46 M 138 18 L 148 36 M 154 12 L 162 30", RED, 6, 0.9))
    S.group("arm-r", PR, "spear")
    T = frame(158, 108, 5)
    back, L = -52, 52
    S.shape(rr(0, (back + L) / 2, 9, L - back, 4.5), "#9A6A40", T=T, shadow=0)
    if v == "kettle":
        S.shape(rr(0, L - 8, 36, 8, 3.5), DIRON, T=T, shadow=1)
    elif v == "wrap":
        S.shape(blob([(3, L - 12), (14, L - 20), (20, L - 36), (26, L - 22), (20, L - 8), (8, L - 2)], 0.8), RED, T=T, shadow=1)
    S.shape(rr(0, L - 2, 14, 9, 3), DIRON, T=T, shadow=1)
    w = 15 if v == "straw" else 12
    bl = [(-w, L + 2), (w, L + 2), (w + 1, L + 20), (0, L + 46), (-w - 1, L + 20)]
    S.shape(blob(bl, 0.7), STEEL, T=T, shadow=2, decor=blade_decor([(0, L + 2), (w, L + 2), (w + 1, L + 20), (0, L + 46)]))
    fist(S, 0, 0, T=T)
    S.group("body")
    B.tunic(S, patch=v != "kettle")
    if v == "kettle":
        S.shape(cloud(100, 104, 46, 15, 0.5), "#8A919E", shadow=3, T="translate(100 104) scale(1.1 0.84) translate(-100 -104)")
    if v == "straw":
        S.shape(blob([(52, 118), (50, 96), (64, 84), (100, 80), (136, 84), (150, 96), (148, 118), (132, 106), (100, 102), (68, 106)], 0.8),
                "#6E7A4A", shadow=3)
    head(S)
    B.mask(S)
    if v == "kettle":
        S.shape(ell(100, 76, 66, 54), shade(IRON, 0.86), shadow=5,
                decor=rivets11([(100 + 58 * math.sin(math.radians(a)), 76 - 47 * math.cos(math.radians(a))) for a in range(0, 360, 30)], 2.8)
                      + f'<path d="{ell(100, 76, 56, 45)}" fill="none" stroke="#5E6470" stroke-width="2.5" opacity="0.6"/>')
        S.shape(ell(100, 68, 38, 34), IRON, shadow=4, decor=hi(86, 54, 16, 10, 0.4)
                + f'<path d="{blob([(112, 62), (124, 68), (120, 80), (110, 72)], 0.9)}" fill="#6E747E" opacity="0.5"/>')
    elif v == "wrap":
        wrap = blob([(49, 98), (45, 70), (60, 44), (100, 32), (140, 44), (155, 70), (151, 98), (128, 90), (100, 87), (72, 90)], 0.85)
        S.shape(wrap, "#D9A441", shadow=4,
                decor=strokes("M 44 62 Q 100 30 156 62 M 44 84 Q 100 54 156 84", RED, 8, 0.9) + hi(80, 48, 18, 8, 0.2))
        S.shape(circ(112, 50, 10), shade("#D9A441", 0.85), shadow=2)
    else:
        HAT = "#D8BC6A"
        S.shape(blob([(100, 10), (136, 20), (164, 44), (174, 76), (160, 98), (146, 92), (136, 108), (118, 104), (100, 114), (80, 106),
                      (62, 110), (48, 98), (32, 92), (26, 70), (38, 42), (66, 20)], 0.75), HAT, shadow=5,
                decor="".join(f'<circle cx="100" cy="62" r="{r}" fill="none" stroke="#A88A3E" stroke-width="2.2" opacity="0.6"/>' for r in (16, 30, 44, 58))
                      + strokes("M 100 62 L 60 22 M 100 62 L 150 30 M 100 62 L 168 84 M 100 62 L 34 84 M 100 62 L 100 112", "#A88A3E", 2, 0.45)
                      + hi(78, 40, 22, 10, 0.2))
        S.shape(circ(100, 62, 8), shade(HAT, 0.8), shadow=2)
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 146, -6)
    return save("enemies", f"bandit-spear-{v}", S)


def rivets11(pts, r):
    return "".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}" fill="#E6EAF0"/>' for x, y in pts)


# ================================================================== the poacher ("Try again")
def bow(S):
    """Round 10's bow, string and hands (unchanged)."""
    S.group("arm-l", PL, "bow, string and the hand holding it")
    S.raw('<path id="string" d="M30 146 L100 158 L170 146" fill="none" stroke="#EDE3CC" stroke-width="2.5" '
          'stroke-linecap="round" stroke-linejoin="round"/>')
    outer = [(22, 142), (46, 162), (74, 177), (100, 182), (126, 177), (154, 162), (178, 142)]
    inner = [(x, y - 9) for x, y in outer[::-1]]
    S.shape(blob(outer + inner, 0.5), "#5A3A26", shadow=0, decor=f'<path d="{circ(24, 137, 8)} {circ(176, 137, 8)}" fill="#2E2018"/>')
    S.shape(rr(100, 180, 32, 14, 4), "#A07A50", shadow=1)
    fist(S, 100, 180, 90, w=21, h=24)
    S.group("arm-r", PR, "arrow and the drawing hand")
    S.shape(rr(100, 176, 4, 40, 2), "#8A6440", shadow=0)
    S.shape(poly([(93, 192), (100, 206), (107, 192)]), STEEL, shadow=1)
    fist(S, 100, 160, 90, w=20, h=22)


def poacher(v):
    """a "antlers": a deerskin hood with a pair of small antlers, a green face cloth; b "quiver": a moss-green hood and
    face cloth, a quiver on the back with its arrows' red feathers fanned out; c "game": a bald head under a tied rag, a
    big grey beard, a brace of pheasants slung across the back."""
    what = {"antlers": "a deerskin hood with a pair of small antlers standing up from it and two soft ears, a moss-green cloth over the lower face",
            "quiver": "a moss-green hood and cloth over the lower face, a quiver slung on the back with a fan of red-feathered arrows",
            "game": "a bald head under a knotted rag, a big grey beard (no mask), two shot pheasants slung across the back"}[v]
    S = Sprite(f"POACHER (round 11, \"{v}\"): a woodland hunter, not one of the masked gang: {what}; a leather jerkin; the "
               "short dark recurve bow of round 10 held out in front (arm-l, with its string) and an arrow in the drawing "
               "hand (arm-r). No eyes. " + LAYOUT)
    GREEN, HIDE = "#5E7048", "#A8824E"
    S.group("back", (100, 64), {"antlers": "nothing", "quiver": "quiver", "game": "a brace of pheasants"}[v])
    if v == "quiver":
        T = frame(128, 78, 200)
        S.shape(rr(0, 20, 26, 58, 8), "#7A4E2C", T=T, shadow=0, decor=strokes("M -13 8 L 13 8", "#D9A441", 4, 0.9))
        for dx, a in ((-9, -10), (0, 0), (9, 10)):
            S.shape(blob([(dx - 5, 48), (dx + 5, 48), (dx + 6 + a * 0.3, 68), (dx + a * 0.4, 74), (dx - 6 + a * 0.3, 68)], 0.7), RED, T=T, shadow=1)
    if v == "game":
        for x, a, c in ((56, 143, "#B8743A"), (146, 217, "#8A5A2E")):
            T = frame(x, 84, a)
            S.shape(blob([(-9, 0), (9, 0), (12, 22), (7, 42), (0, 62), (-7, 42), (-12, 22)], 0.8), c, T=T, shadow=0,
                    decor=strokes("M -6 20 L 6 24 M -5 32 L 5 36 M -3 44 L 3 48", "#5A3A1E", 3, 0.6))
            S.shape(circ(0, -6, 8), "#2E6A4A", T=T, shadow=1, decor='<circle cx="0" cy="-2" r="3" fill="#C8403A"/>')
    S.group("body")
    B.tunic(S, "#8A6440", patch=False)
    S.shape(blob([(40, 110), (44, 86), (66, 76), (100, 74), (134, 76), (156, 86), (160, 110), (140, 124), (100, 128), (60, 124)], 0.85),
            "#6A4E34" if v != "quiver" else shade(GREEN, 0.82), shadow=3,
            decor=strokes("M 132 78 L 100 126", "#3E2A1E", 5, 0.7) if v == "quiver" else "")
    head(S)
    if v == "game":
        beard = blob([(60, 124), (74, 136), (88, 142), (100, 143), (112, 142), (126, 136), (140, 124), (142, 144), (132, 158),
                      (118, 164), (108, 174), (100, 178), (92, 174), (82, 164), (68, 158), (58, 144)], 0.65)
        S.shape(beard, "#B4B0AA", shadow=3, decor=strokes("M 86 150 L 90 166 M 100 150 L 100 172 M 114 150 L 110 166", "#8A8680", 3, 0.5))
        mouth(S, 137, "#9A6A58")
        S.shape(blob([(50, 96), (47, 70), (62, 46), (100, 36), (138, 46), (153, 70), (150, 96), (128, 88), (100, 86), (72, 88)], 0.85), "#B8623A", shadow=4,
                decor=hi(80, 54, 18, 9, 0.16) + strokes("M 52 84 C 74 74 126 74 148 84", "#8A3E22", 3.5, 0.6))
        S.shape(blob([(138, 60), (152, 50), (162, 56), (154, 64), (162, 74), (148, 74)], 0.7), "#B8623A", shadow=2)
    else:
        S.shape(MASK11, GREEN if v == "antlers" else shade(GREEN, 0.9), shadow=3)
        col = HIDE if v == "antlers" else GREEN
        hood = blob([(47, 116), (41, 78), (54, 46), (78, 32), (100, 28), (122, 32), (146, 46), (159, 78), (153, 116), (141, 108),
                     (138, 90), (120, 78), (100, 75), (80, 78), (62, 90), (59, 108)], 0.8)
        if v == "antlers":
            for s in (-1, 1):
                S.shape(blob([(100 + s * 30, 62), (100 + s * 46, 44), (100 + s * 44, 58), (100 + s * 52, 70)], 0.6), shade(HIDE, 0.85), shadow=0)
        S.shape(hood, col, shadow=4, decor=hi(78, 50, 20, 10, 0.14) + strokes("M 58 104 C 56 86 74 70 100 68 C 126 70 144 86 142 104", shade(col, 0.7), 3, 0.5))
        if v == "antlers":
            for s in (-1, 1):
                an = taper([(100 + s * 16, 56), (100 + s * 22, 38), (100 + s * 20, 20), (100 + s * 26, 6)], 8, 4) + " " + \
                     taper([(100 + s * 21, 34), (100 + s * 34, 26), (100 + s * 40, 14)], 6, 3.5)
                S.shape(an, "#EFE4C6", shadow=3)
    bow(S)
    return save("enemies", f"bandit-poacher-{v}", S)


MASK11 = B.MASK

for _v in ("hat", "cowl", "soot"):
    BUILD[f"bandit-torch-{_v}"] = gang(lambda v=_v: bandit_torch(v))
for _v in ("helm", "hood", "horns"):
    BUILD[f"bandit-greatsword-{_v}"] = gang(lambda v=_v: bandit_greatsword(v))
for _v in ("kettle", "wrap", "straw"):
    BUILD[f"bandit-spear-{_v}"] = gang(lambda v=_v: bandit_spear(v))
for _v in ("antlers", "quiver", "game"):
    BUILD[f"bandit-poacher-{_v}"] = gang(lambda v=_v: poacher(v))


# ================================================================== the fallen angel ("Try again")
def fallen(v):
    """Round 10's was dark on dark. Three with light against dark, each one idea: a "ashen": a burnt angel: white wings
    charred black at the tips, white hair, a black blindfold, its halo broken in two; b "collared": its halo has slipped
    down round its neck like a collar; a deep cowl, whole dark wings, a scythe; c "ember": still burning: black wings
    edged with fire, a crown of thorns, a flaming sword."""
    what = {"ashen": "a burnt angel: the two-layer wings still white but charred black at their tips, short white hair, a black "
                     "blindfold, its halo broken in two halves that hang apart over its head; a broken spear",
            "collared": "its gold halo has fallen and hangs round its neck as a collar; a deep violet cowl up over the head, "
                        "whole wings gone dusk-violet; a long-handled scythe",
            "ember": "still burning: black torn wings with fire along their edges, long white hair, a crown of thorns; a sword "
                     "of flame"}[v]
    S = Sprite(f"FALLEN ANGEL (round 11, \"{v}\"): one of the host, fallen, on the picked angel's build, ashen skin, no eyes: "
               f"{what} (arm-r, under the shoulder), the left hand free (arm-l); wings in #back (sway). " + LAYOUT)
    S.add_def(SP9.ASH_FACE)
    S.add_def(FLAME_DEF)
    hand = "url(#gHandAsh)"
    S.group("back", (100, 90), "wings")
    if v == "ashen":
        SP.wings(S, "#3A3440", "#F4F1F6", k=0.98)
        for s in (-1, 1):   # the pale inner layer runs out over the dark, leaving the tips charred
            mid = [(118, 92), (140, 68), (166, 50), (184, 46), (182, 60), (186, 70), (176, 80), (178, 92), (166, 98), (160, 112), (140, 110)]
            S.shape(blob(mid if s > 0 else mirror(mid), 0.7), "#DAD4E0", T="translate(100 92) scale(0.98) translate(-100 -92)", shadow=0)
        SP.wings(S, "#DAD4E0", "#F8F6FA", k=0.7)
    elif v == "collared":
        SP.wings(S, "#5E5078", "#8E7EB0", k=0.98)
    else:
        SP.wings(S, "#FF8A2E", "#2E2832", ragged=True, k=1.0)
        SP.wings(S, "#2E2832", "#4A4250", ragged=True, k=0.9)
    S.group("arm-r", PR, "weapon")
    T = frame(158, 102, 5)
    if v == "ashen":
        S.shape(rr(0, 2, 9, 80, 4.5), "#B8B0BE", T=T, shadow=0)
        S.shape(poly([(-5, 42), (5, 42), (6, 52), (-2, 58), (2, 64), (-6, 60)]), "#B8B0BE", T=T, shadow=0)
    elif v == "collared":
        S.shape(rr(0, -4, 9, 108, 4.5), "#3A3442", T=T, shadow=0)
        sc = blob([(4, 44), (-4, 52), (-22, 60), (-46, 62), (-70, 52), (-50, 74), (-24, 78), (-6, 70), (6, 58)], 0.8)
        S.shape(sc, "#D8D0E4", T=T, shadow=2, decor=f'<path d="{blob([(-4, 60), (-24, 68), (-46, 68), (-64, 56), (-50, 74), (-24, 78), (-6, 70)], 0.8)}" fill="#7A6E90" opacity="0.5"/>')
        S.shape(rr(0, 50, 16, 12, 4), "#C9A548", T=T, shadow=1)
    else:
        S.shape(rr(0, -10, 10, 24, 4), "#3A3442", T=T, shadow=0)
        d, Tf = flame(0, 6, 0, 92, 15)
        S.shape(d, fill="url(#gFlameUp)", T=f"{T} {Tf}", shadow=0, side=False)
        d, Tf = flame(0, 10, 0, 64, 7.5)
        S.shape(d, "#FFE27A", T=f"{T} {Tf}", shadow=0, side=False)
        S.shape(rr(0, 4, 34, 9, 4), "#C9A548", T=T, shadow=2)
    fist(S, 0, 0 if v != "ember" else -8, T=T, hand=hand)
    S.group("body")
    ROBE = {"ashen": "#E4DEE8", "collared": "#4E4460", "ember": "#3A3440"}[v]
    S.shape(SHOULDERS, ROBE, decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", {"ashen": "#8A8292", "collared": "#8E6AB8", "ember": "#FF8A2E"}[v], 4, 0.9))
    if v == "collared":
        S.shape(blob([(38, 112), (44, 88), (66, 76), (100, 73), (134, 76), (156, 88), (162, 112), (140, 126), (100, 130), (60, 126)], 0.85), shade(ROBE, 0.8), shadow=3)
    head(S, face="url(#gFaceAsh)")
    mouth(S, 137, "#6E6070")
    if v == "ashen":
        S.shape(blob([(50, 104), (47, 76), (60, 52), (100, 42), (140, 52), (153, 76), (150, 104), (138, 92), (124, 100), (110, 90),
                      (96, 98), (82, 90), (68, 100), (58, 92)], 0.7), "#F2EEF4", shadow=4, decor=hi(80, 58, 18, 9, 0.5))
        S.shape("M50 104 C66 112 84 115 100 115 C116 115 134 112 150 104 C151 109 151 115 150 119 C134 127 116 130 100 130 C84 130 66 127 50 119 "
                "C49 115 49 109 50 104 Z", "#2A2630", shadow=2)
        for s in (-1, 1):   # the halo, broken in two
            a0, a1 = (200, 330) if s < 0 else (20, 150)
            pts = [(100 + s * 6 + 34 * math.cos(math.radians(a)), 50 + 22 * math.sin(math.radians(a))) for a in range(a0, a1 + 1, 26)]
            S.shape(band(pts, 4.2), "#E8C860", T=f"rotate({s * 14} {100 + s * 30} 50)", shadow=3)
    elif v == "collared":
        cowl = blob([(46, 120), (40, 80), (54, 46), (78, 32), (100, 28), (122, 32), (146, 46), (160, 80), (154, 120), (142, 110),
                     (140, 90), (122, 78), (100, 75), (78, 78), (60, 90), (58, 110)], 0.8)
        S.shape(cowl, ROBE, shadow=5, decor=hi(76, 50, 20, 10, 0.1) + strokes("M 58 106 C 56 88 74 72 100 70 C 126 72 144 88 142 106", "#8E6AB8", 3, 0.7))
        S.shape(blob([(52, 134), (76, 146), (100, 150), (124, 146), (148, 134), (150, 144), (126, 157), (100, 161), (74, 157), (50, 144)], 0.8), "#F2C24A", shadow=3,
                decor=strokes("M 58 140 Q 100 158 142 140", "#FFF2C0", 3, 0.9))
    else:
        S.shape(blob([(50, 124), (46, 84), (60, 56), (100, 44), (140, 56), (154, 84), (150, 124), (142, 104), (132, 88), (116, 82),
                      (100, 90), (84, 82), (68, 88), (58, 104)], 0.85), "#F2EEF4", shadow=4, decor=strokes("M 100 48 L 100 88", "#C8C0CE", 3, 0.6))
        thorns = "".join(f'<path d="M {f(100 + 40 * math.cos(math.radians(a)))} {f(64 + 26 * math.sin(math.radians(a)))} L '
                         f'{f(100 + 52 * math.cos(math.radians(a + 8)))} {f(64 + 36 * math.sin(math.radians(a + 8)))}" stroke="#3A2A26" stroke-width="4" stroke-linecap="round"/>'
                         for a in range(0, 360, 40))
        S.raw(thorns)
        S.shape(ell(100, 64, 42, 28) + " " + ell(100, 64, 34, 20), "#4A3630", shadow=3, rule="evenodd")
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 146, -6, hand=hand)
    return save("enemies", f"spire-fallen-angel-{v}", S)


for _v in ("ashen", "collared", "ember"):
    BUILD[f"spire-fallen-angel-{_v}"] = (lambda v=_v: fallen(v))


# ================================================================== the Gilded Seraph's head
# "Looks good. I'll keep if u can't do better but I don't love the helmet and face covering"
def seraph_head(v):
    """Everything but the head is round 10's seraph. a "circlet": her hair loose, a thin gold circlet with the sun jewel on
    the brow, nothing over the face; b "halo": no metal on the head at all: a parted fall of hair and a halo ring worn over
    it (the picked angel's); c "hood": a white hood edged in gold, open at the face, the sun jewel pinned at its peak."""
    def draw(S):
        S.comment = S.comment.replace("on her brow a gold diadem with a sun jewel and a short veil of gold links over the top of her face",
                                      {"circlet": "round 11: a thin gold circlet with the sun jewel on her brow, her face bare",
                                       "halo": "round 11: nothing on her brow; a gold halo ring worn over her hair, her face bare",
                                       "hood": "round 11: a white hood edged in gold, open at the face, the sun jewel at its peak"}[v])
        head(S)
        mouth(S, 138, "#9A6E68")
        hair = blob([(50, 122), (46, 84), (60, 56), (100, 44), (140, 56), (154, 84), (150, 122), (142, 104), (134, 90), (118, 84),
                     (100, 88), (82, 84), (66, 90), (58, 104)], 0.85)
        if v != "hood":
            S.shape(hair, "#FFF4DA", shadow=4, decor=strokes("M 100 50 L 100 86", "#E8D4A8", 3, 0.6) + hi(80, 62, 16, 9, 0.4))
        if v == "circlet":
            S.shape(band([(52, 96), (64, 84), (82, 77), (100, 75), (118, 77), (136, 84), (148, 96)], 4.2), GOLD, shadow=2)
            S.shape(circ(100, 77, 9), "#FFFBE8", shadow=2, decor='<circle cx="97" cy="74" r="3.2" fill="#FFFFFF"/>'
                    + f'<path d="{circ(100, 77, 9)}" fill="none" stroke="#F2B53A" stroke-width="4"/>')
        elif v == "halo":
            S.shape(ell(100, 64, 37, 31) + " " + ell(100, 64, 28, 22), "#F6CF5A", shadow=5, rule="evenodd",
                    decor='<path d="M 69 52 A 33 27 0 0 1 96 35" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.6"/>')
        else:
            hood = blob([(46, 124), (40, 82), (54, 48), (78, 33), (100, 28), (122, 33), (146, 48), (160, 82), (154, 124), (142, 112),
                         (140, 92), (122, 80), (100, 77), (78, 80), (60, 92), (58, 112)], 0.8)
            S.shape(hood, "#FBF8F0", shadow=5, decor=hi(76, 52, 20, 10, 0.5)
                    + strokes("M 58 110 C 56 90 74 74 100 72 C 126 74 144 90 142 110", GOLD, 5, 0.95))
            S.shape(circ(100, 74, 9), "#FFFBE8", shadow=2, decor='<circle cx="97" cy="71" r="3.2" fill="#FFFFFF"/>'
                    + f'<path d="{circ(100, 74, 9)}" fill="none" stroke="#F2B53A" stroke-width="4"/>')
    return draw


def seraph11(v):
    old, B10.HEAD_FN, common.SAVE_AS = B10.HEAD_FN, seraph_head(v), f"boss-gilded-seraph-{v}"
    try:
        return B10.seraph()
    finally:
        B10.HEAD_FN, common.SAVE_AS = old, None


for _v in ("circlet", "halo", "hood"):
    BUILD[f"boss-gilded-seraph-{_v}"] = (lambda v=_v: seraph11(v))


# ================================================================== the golem: four more bodies
# "Try 4 more. Keeps these."
def golem11(v, gild=None):
    """Four more bodies, each with the eye (the diamond rune, as round 9 drew it): "arch" one great horseshoe of stone for
    shoulders and arms, the head inside its curve; "cairn" a cairn: three flat slabs stacked, each smaller, two loose
    stones for fists; "shards" split slate: angular plates for shoulders, a wedge of a head, two long shards for arms;
    "wheel" one great round carved stone, a ring of runes cut round the eye at its middle, two fist stones.
    gild (the gilded golem, "Don't like the gold mask look": no plate round the eye) on the first round-10 body,
    "boulders": "veins" gold run into the cracks of the stone; "bands" a gold band round each shoulder stone and fist,
    a thin gold ring set in the head stone round the eye; "caps" the tops of the shoulder stones capped in gold, gold
    knuckles."""
    GP = SP.GP
    if gild:
        what = {"veins": "veins of gold run through cracks in every stone", "bands": "a gold band round each shoulder stone and each "
                "fist, a thin gold ring set into the head stone round the eye",
                "caps": "the tops of the two shoulder stones capped in polished gold, gold knuckles on the fists"}[gild]
        S = Sprite(f"GILDED GOLEM (round 11, gilding \"{gild}\", on round 10's body A \"boulders\"): three big round stones and "
                   f"two fist stones; {what}; the eye white on bare stone: no gold plate round it (the designer: \"Don't like "
                   "the gold mask look\"). Parts: #arm-l / #arm-r (the fists, swing), #body. " + LAYOUT)
        vein = lambda d: strokes(d, GP, 3.6, 1) + strokes(d, "#FFF2C0", 1.4, 0.9)
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 60, 112), "stone fist")
            cx = 100 + s * 62
            dec = hi(cx - 8, 142, 12, 6)
            if gild == "veins":
                dec += vein(f"M {cx - 18} 140 L {cx - 6} 150 L {cx - 10} 162 L {cx + 4} 172")
            if gild == "bands":
                dec += f'<path d="M {cx - 30} 150 Q {cx} 162 {cx + 30} 150 L {cx + 30} 162 Q {cx} 174 {cx - 30} 162 Z" fill="{GP}"/>' + hi(cx - 8, 158, 8, 2.6, 0.6)
            S.shape(stone(cx, 154, 50, 46), STONE, shadow=0, decor=dec)
            if gild == "caps":
                S.shape(blob([(cx - 20, 160), (cx, 154), (cx + 20, 160), (cx + 16, 176), (cx, 180), (cx - 16, 176)], 0.85), GP, shadow=2, decor=hi(cx - 6, 162, 8, 3.5, 0.7))
        S.group("body")
        for s in (-1, 1):
            cx = 100 + s * 50
            dec = hi(cx - 10, 76, 18, 9)
            if gild == "veins":
                dec += vein(f"M {cx - s * 30} 70 L {cx - s * 14} 84 L {cx - s * 20} 100 L {cx - s * 4} 110 L {cx - s * 8} 126") + vein(f"M {cx - s * 14} 84 L {cx + s * 4} 80")
            if gild == "bands":
                dec += f'<path d="M {cx - 44} 92 Q {cx} 108 {cx + 44} 92 L {cx + 44} 106 Q {cx} 122 {cx - 44} 106 Z" fill="{GP}"/>' + hi(cx - 14, 102, 10, 3, 0.6)
            S.shape(stone(cx, 98, 78, 70, (1.0, 0.96, 1.03, 0.95, 1.0, 0.97, 1.02, 0.95)[::s]), STONE, shadow=0 if s < 0 else 3, decor=dec)
            if gild == "caps":
                S.shape(blob([(cx - 30, 84), (cx - 12, 66), (cx + 14, 66), (cx + 30, 84), (cx + 14, 92), (cx - 12, 92)], 0.85), GP, shadow=3, decor=hi(cx - 8, 76, 14, 5, 0.7))
        dec = hi(88, 88, 16, 8)
        if gild == "veins":
            dec += vein("M 74 92 L 84 100 L 80 112 M 126 96 L 118 106 L 124 120 L 114 130")
        if gild == "bands":
            dec += f'<circle cx="100" cy="114" r="21" fill="none" stroke="{GP}" stroke-width="5"/>'
        S.shape(stone(100, 106, 66, 62, (1.0, 0.98, 1.0, 0.97, 1.0, 0.98, 1.0, 0.97)), light(STONE, 1.05), shadow=5, decor=dec + SP.eye(True))
        return save("enemies", f"spire-gilded-golem-{gild}", S)
    what = {"arch": "one great horseshoe of stone for its shoulders and arms, curving forward to two blunt ends, the head stone inside the curve",
            "cairn": "a cairn that walks: three flat slabs stacked, each smaller than the one under it, the top one its head; two loose stones for fists",
            "shards": "split slate: two angular plates for shoulders, a wedge of a head between them, two long shards for arms",
            "wheel": "one great round stone carved like a millstone, a ring of runes cut round the eye at its middle; two fist stones"}[v]
    S = Sprite(f"GOLEM (round 11, body \"{v}\"): a stone golem seen from above: {what}; on its head the eye: a diamond rune "
               "that glows (no other face). Weathered grey stone, a little moss. Parts: #arm-l / #arm-r (the fists, swing), "
               "#body. " + LAYOUT)
    moss = lambda x, y, rx, ry: f'<path d="{ell(x, y, rx, ry)}" fill="#7E9A5A" opacity="0.9"/>'
    if v == "arch":
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 60, 112), "the arch's end")
            S.shape(stone(100 + s * 62, 158, 44, 42), STONE, shadow=0, decor=hi(100 + s * 62 - 8, 148, 11, 5))
        S.group("body")
        arch = blob([(22, 150), (14, 110), (26, 66), (60, 40), (100, 32), (140, 40), (174, 66), (186, 110), (178, 150), (140, 150),
                     (146, 112), (136, 86), (100, 76), (64, 86), (54, 112), (60, 150)], 0.75)
        S.shape(arch, shade(STONE, 0.95), shadow=3, decor=hi(64, 60, 28, 11, 0.22, -24) + moss(142, 56, 16, 7)
                + strokes("M 40 96 L 58 104 M 160 96 L 142 104 M 100 34 L 100 74", DSTONE, 3, 0.4))
        S.shape(stone(100, 118, 64, 60, (1.0, 0.98, 1.0, 0.97, 1.0, 0.98, 1.0, 0.97)), light(STONE, 1.06), shadow=5, decor=hi(88, 102, 15, 7) + SP.eye(False, dy=6))
    elif v == "cairn":
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 60, 112), "stone fist")
            S.shape(stone(100 + s * 66, 150, 42, 36, (1.0, 0.9, 1.05, 0.95, 1.0, 0.92, 1.04, 0.96)), STONE, shadow=0, decor=hi(100 + s * 66 - 8, 142, 10, 4))
        S.group("body")
        S.shape(stone(100, 96, 164, 112, (1.0, 0.95, 1.03, 0.96, 1.0, 0.94, 1.03, 0.97)), shade(STONE, 0.9), shadow=0, decor=hi(62, 62, 28, 9, 0.2, -18) + moss(150, 76, 15, 7))
        S.shape(stone(100, 100, 122, 88, (0.98, 1.03, 0.95, 1.0, 0.97, 1.03, 0.95, 1.0)), STONE, shadow=5, decor=hi(74, 76, 22, 8, 0.2, -14))
        S.shape(stone(100, 106, 76, 62, (1.0, 0.97, 1.02, 0.96, 1.0, 0.97, 1.02, 0.96)), light(STONE, 1.07), shadow=5, decor=hi(86, 90, 16, 7) + SP.eye(False, dy=-6))
    elif v == "shards":
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 60, 112), "a shard of an arm")
            p = [(144, 104), (176, 112), (182, 150), (170, 186), (150, 168), (146, 136)]
            S.shape(poly(p if s > 0 else mirror(p)), STONE, shadow=0,
                    decor=f'<path d="{poly([(176, 112), (182, 150), (170, 186), (166, 140)] if s > 0 else mirror([(176, 112), (182, 150), (170, 186), (166, 140)]))}" fill="{DSTONE}" opacity="0.35"/>')
        S.group("body")
        for s in (-1, 1):
            p = [(104, 60), (150, 46), (186, 76), (178, 118), (140, 132), (108, 112)]
            S.shape(poly(p if s > 0 else mirror(p)), shade(STONE, 0.94), shadow=0 if s < 0 else 3,
                    decor=f'<path d="{poly([(150, 46), (186, 76), (178, 118), (150, 96)] if s > 0 else mirror([(104, 60), (150, 46), (150, 96), (108, 112)]))}" fill="#FFFFF4" opacity="0.14"/>'
                          + (moss(46, 64, 14, 6) if s < 0 else ""))
        hd = [(100, 66), (132, 84), (126, 132), (100, 158), (74, 132), (68, 84)]
        S.shape(poly(hd), light(STONE, 1.06), shadow=5,
                decor=f'<path d="{poly([(100, 66), (132, 84), (126, 132), (100, 158)])}" fill="{DSTONE}" opacity="0.22"/>' + SP.eye(False, dy=-2))
    else:
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 60, 112), "stone fist")
            S.shape(stone(100 + s * 68, 160, 44, 42), STONE, shadow=0, decor=hi(100 + s * 68 - 8, 150, 11, 5))
        S.group("body")
        runes = "".join(f'<path d="M 0 -6 l 4.5 6 l -4.5 6 l -4.5 -6 Z" fill="none" stroke="{DSTONE}" stroke-width="3" stroke-linejoin="round" opacity="0.7" '
                        f'transform="translate({f(100 + 56 * math.sin(math.radians(a)))} {f(100 - 56 * math.cos(math.radians(a)))}) rotate({a})"/>' for a in range(0, 360, 30))
        S.shape(stone(100, 100, 152, 152, (1.0, 0.99, 1.01, 0.99, 1.0, 0.99, 1.01, 0.99)), STONE, shadow=3,
                decor=f'<circle cx="100" cy="100" r="68" fill="none" stroke="{DSTONE}" stroke-width="3" opacity="0.45"/>'
                      f'<circle cx="100" cy="100" r="44" fill="none" stroke="{DSTONE}" stroke-width="3" opacity="0.45"/>' + runes
                      + hi(64, 54, 30, 12, 0.22, -30) + moss(146, 60, 15, 7))
        S.shape(circ(100, 100, 34), light(STONE, 1.07), shadow=4, decor=hi(90, 86, 13, 6) + SP.eye(False, dy=-14, k=1.15))
    return save("enemies", f"spire-golem-{v}", S)


for _v in ("arch", "cairn", "shards", "wheel"):
    BUILD[f"spire-golem-{_v}"] = (lambda v=_v: golem11(v))
for _v in ("veins", "bands", "caps"):
    BUILD[f"spire-gilded-golem-{_v}"] = (lambda v=_v: golem11("boulders", gild=v))


# ================================================================== the sproutling: the original, better
# "I like these. Save em. But try the original design just better. No arms. Less busy leaves. Bud doesnt look the too good"
def sprout11(v):
    """The round-8 sproutling (the original): its round green bud of a head, the two big seed leaves fanned back over it and
    the curled shoot between them, drawn cleaner; the twig arms and their leafy hands are gone, and the collar of eleven
    small leaves is "plain" none at all; "ruff" five broad leaves; "spread" none, and the two seed leaves stand out to the
    sides like a seedling's instead of lying back."""
    LEAF, DLEAF = G8.LEAF, G8.DLEAF
    S = Sprite(f"SPROUTLING (round 11, \"{v}\": the round-8 design, no arms, fewer leaves): a small walking sapling seen from "
               "above: a round green bud of a head, two big seed leaves " + ("standing out to the sides" if v == "spread" else "fanned back over it")
               + " and a curled shoot standing up between them" + (", a ruff of five broad leaves under it" if v == "ruff" else "")
               + ". No arms, no face. Parts: #back (the leaves and shoot, sway), #body. " + LAYOUT)
    def leaf(a, L, w, col, cy=96, shadow=4):
        d, T = G8.leaf(100, cy, a, L, w)
        S.shape(d, col, T=T, shadow=shadow,
                decor=f'<path d="M 0 6 L 0 {L - 12}" stroke="{DLEAF}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>'
                      f'<path d="M -{w} 0 L 0 0 L 0 {L} L -{w} {L} Z" fill="#FFFFF4" opacity="0.1"/>')
    if v == "ruff":
        S.group("back", (100, 104), "ruff of leaves")
        for a in (-144, -72, 0, 72, 144):
            d, T = G8.leaf(100, 104, a + 180, 62, 20)
            S.shape(d, DLEAF if a in (-72, 72) else shade(LEAF, 0.92), T=T, shadow=0 if abs(a) == 144 else 2,
                    decor=f'<path d="M 0 8 L 0 50" stroke="#3A6428" stroke-width="3" stroke-linecap="round" opacity="0.5"/>')
        S.group("body")
    else:
        S.group("body")
    S.shape(circ(100, 110, 42), "#9CCB62", shadow=4,
            decor=f'<path d="{ell(86, 94, 18, 12)}" fill="#C4E48A" opacity="0.6"/>'
                  f'<path d="M 54 124 Q 100 150 146 124 L 146 160 L 54 160 Z" fill="#6E9E44" opacity="0.4"/>')
    S.group("top", (100, 96), "seed leaves and shoot")
    for s in (-1, 1):
        if v == "spread":
            leaf(180 + s * 82, 78, 24, LEAF)
        else:
            leaf(180 + s * 38, 76, 23, LEAF)
    S.shape(strip([(100, 98), (102, 78), (110, 66), (119, 68)], 7.5, taper=(0.9, 1.0)), "#7AAE4A", shadow=3)
    S.shape(circ(120, 66, 7.5), "#9CCB62", shadow=2)
    return save("enemies", f"wild-sproutling-{v}", S)


for _v in ("plain", "ruff", "spread"):
    BUILD[f"wild-sproutling-{_v}"] = (lambda v=_v: sprout11(v))

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
