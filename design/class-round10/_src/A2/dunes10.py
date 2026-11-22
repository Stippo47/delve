"""Round 10, the art-round9 notes on the Sunken Dunes:
  the cobra         "Meh": drawn again: a neat coil, the hood spread in front of it, a real head;
  the jackal guard  "Good overall shape and colours, bad quality": the same shape and colours, drawn again with a head
                    the size of the heroes', proper ears, a banded collar, a real shield and spear;
  the mummy         "No": drawn again in the heroes' bust build: a wrapped head with a dark slit, arms held out;
  the sand serpent  "Wth is that snake enemy" (v12-bosses deck): a proper snake's head and a body segment that joins
                    its neighbours into one patterned body.
python dunes10.py [name ...]   -> ../../enemies/dunes-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *

SAND, DSAND, BAND, CREAM = "#D8B46A", "#B08A48", "#7A5632", "#F2E2B8"
TURQ, LAPIS = "#3FB8A8", "#3A5AA8"
FUR, SNOUT = "#3A3440", "#4A4452"


# ================================================================== cobra
def cobra():
    S = Sprite("COBRA (round 10): a cobra reared to strike, seen from above: its body in one neat coil behind (two turns, "
               "dark bands across it, the thin tail lying out to one side: #back, sways), the neck rising from the middle "
               "of the coil into a broad spread hood with a dark chevron on its back and a pale rim, a wedge of a head "
               "with two brow ridges (no eyes) and a forked tongue (#front, it flicks). Sandy gold, banded brown. Parts: "
               "#back (coil), #body (hood and head), #front (tongue). " + LAYOUT)
    S.group("back", (100, 76), "the coil")
    S.shape(strip([(140, 96), (164, 84), (176, 60), (170, 38)], 9, taper=(0.9, 1.0)), DSAND, shadow=0)   # the tail's end
    def bands(cx, cy, r0, r1, n, rot=0):
        return "".join(f'<path d="M {f(cx + r0 * math.cos(math.radians(a)))} {f(cy + r0 * math.sin(math.radians(a)))} L '
                       f'{f(cx + r1 * math.cos(math.radians(a)))} {f(cy + r1 * math.sin(math.radians(a)))}" stroke="{BAND}" '
                       f'stroke-width="7" stroke-linecap="round" opacity="0.8"/>' for a in range(rot, 360 + rot, 360 // n))
    S.shape(circ(100, 72, 56), DSAND, shadow=0, decor=bands(100, 72, 38, 60, 10, 8)
            + f'<path d="{ell(78, 46, 20, 10)}" fill="#FFFFF4" opacity="0.16"/>')
    S.shape(circ(100, 74, 33), SAND, shadow=4, decor=bands(100, 74, 12, 36, 7, 30))
    S.group("body")
    hood = blob([(100, 62), (126, 68), (146, 86), (152, 110), (142, 132), (122, 146), (100, 150), (78, 146), (58, 132), (48, 110),
                 (54, 86), (74, 68)], 0.9)
    S.shape(hood, SAND, shadow=5,
            decor=f'<path d="{blob([(100, 68), (124, 74), (140, 90), (144, 110), (136, 128), (120, 140), (100, 143), (80, 140), (64, 128), (56, 110), (60, 90), (76, 74)], 0.9)}" fill="{light(SAND, 1.12)}"/>'
                  + strokes("M 70 92 L 100 116 L 130 92", BAND, 8, 0.85) + strokes("M 80 80 L 100 96 L 120 80", BAND, 6, 0.7)
                  + f'<path d="{ell(80, 86, 14, 7)}" fill="#FFFFF4" opacity="0.2"/>')
    S.group("front", (100, 150), "the tongue")
    S.raw('<path d="M 100 176 L 100 192 M 100 192 L 94 202 M 100 192 L 106 202" fill="none" stroke="#B8303A" stroke-width="4" '
          'stroke-linecap="round"/>')
    S.group("top")
    head = blob([(100, 118), (116, 124), (124, 142), (120, 162), (110, 178), (100, 183), (90, 178), (80, 162), (76, 142), (84, 124)], 0.9)
    S.shape(head, shade(SAND, 0.94), shadow=5, decor=f'<path d="M 76 166 C 88 176 112 176 124 166 L 124 190 L 76 190 Z" fill="{CREAM}"/>'
            + strokes("M 100 124 L 100 150", BAND, 5, 0.6))
    for s in (-1, 1):
        S.shape(ell(100 + s * 15, 146, 7.5, 9.5), SAND, T=f"rotate({s * 14} {100 + s * 15} 146)", shadow=3, sop=0.3)
    return save("enemies", "dunes-cobra", S)


# ================================================================== jackal guard
def jackal():
    S = Sprite("JACKAL GUARD (round 10): the round-9 guard's shape and colours, drawn again: a tomb guard with a jackal's "
               "head, the heroes' bust build: black fur, a head the size of the heroes', a long jackal snout pointing "
               "forward with a gold stripe, tall pointed ears standing up and back, gold inside, a broad collar in bands of "
               "gold, turquoise and lapis over white linen; a gold-bladed spear under the right shoulder (arm-r, it "
               "thrusts), a round bronze shield with a gold sun boss on the left (arm-l). No eyes. " + LAYOUT)
    S.group("arm-r", PR, "spear")
    T = frame(160, 104, 5)
    S.shape(rr(0, -4, 9, 104, 4.5), "#5A3A26", T=T, shadow=0)
    S.shape(rr(0, 42, 16, 10, 3.5), GOLD, T=T, shadow=1)
    S.shape(blob([(-12, 46), (12, 46), (13, 66), (0, 98), (-13, 66)], 0.7), "#F6DC8A", T=T, shadow=2,
            decor=f'<path d="{poly([(0, 46), (12, 46), (13, 66), (0, 98)])}" fill="#C89A3A" opacity="0.45"/>')
    fist(S, 0, 0, T=T, hand="url(#gHandD)")
    S.add_def(DARK_SKIN)
    S.group("body")
    S.shape(SHOULDERS, "#F4EEDD", decor=strokes("M 34 122 Q 100 148 166 122", "#D8CCB0", 5, 0.6))
    # the broad collar: three bands, one shape each, widest at the bottom
    for pts, col in (([(34, 104), (58, 84), (100, 78), (142, 84), (166, 104), (154, 126), (100, 136), (46, 126)], GOLD),
                     ([(44, 104), (64, 88), (100, 83), (136, 88), (156, 104), (146, 120), (100, 128), (54, 120)], TURQ),
                     ([(54, 104), (70, 92), (100, 88), (130, 92), (146, 104), (138, 114), (100, 120), (62, 114)], LAPIS),
                     ([(64, 104), (76, 96), (100, 93), (124, 96), (136, 104), (130, 110), (100, 114), (70, 110)], GOLD)):
        S.shape(blob(pts, 0.85), col, shadow=0 if col == GOLD and pts[0][0] == 34 else 2, sop=0.2)
    for s in (-1, 1):   # tall ears, standing up and back, broad at the root
        ear = blob([(100 + s * 12, 96), (100 + s * 20, 62), (100 + s * 36, 20), (100 + s * 46, 56), (100 + s * 44, 92)], 0.7)
        inner = blob([(100 + s * 22, 90), (100 + s * 27, 64), (100 + s * 36, 38), (100 + s * 40, 62), (100 + s * 37, 88)], 0.7)
        S.shape(ear, FUR, shadow=3, decor=f'<path d="{inner}" fill="{GOLD}"/>')
    S.shape(ell(100, 104, 42, 40), FUR, shadow=5, decor=f'<path d="{ell(84, 86, 16, 10)}" fill="#FFFFFF" opacity="0.12"/>')
    sn = blob([(100, 112), (118, 120), (122, 142), (114, 168), (100, 178), (86, 168), (78, 142), (82, 120)], 0.9)
    S.shape(sn, SNOUT, shadow=5, decor=strokes("M 100 118 L 100 156", GOLD, 5, 0.9))
    S.shape(ell(100, 172, 9.5, 7), "#1E1A22", shadow=2, side=False, decor='<circle cx="97" cy="170" r="2.4" fill="#5A5466"/>')
    S.group("arm-l", PL, "round shield")
    fist(S, 48, 142, -6, hand="url(#gHandD)")
    cx, cy = 40, 154
    S.shape(circ(cx, cy, 31), "#9A6A2E", shadow=4)
    S.shape(circ(cx, cy, 25.5), "#D8A24A", shadow=0,
            decor="".join(f'<path d="M {cx} {cy} L {f(cx + 30 * math.cos(math.radians(a)))} {f(cy + 30 * math.sin(math.radians(a)))}" '
                          f'stroke="#B8823A" stroke-width="3" opacity="0.7"/>' for a in range(0, 360, 45)))
    S.shape(circ(cx, cy, 11), GOLD, shadow=2, decor=f'<circle cx="{cx - 3.5}" cy="{cy - 3.5}" r="4" fill="#FFF6D0" opacity="0.85"/>')
    return save("enemies", "dunes-jackal", S)


# ================================================================== mummy
def mummy():
    LIN, DLIN, SHADE = "#D8D0B6", "#B4AA90", "#857A62"
    S = Sprite("MUMMY (round 10, second take: the first read as a table with legs): a wrapped person in the heroes' bust "
               "build, drawn as the heroes are: shoulders in old linen under a broad gold and turquoise collar, a bandaged "
               "head with one dark slit across it where the eyes would be (nothing in it), two wrapped fists in front where "
               "a hero's are (arm-l, arm-r, they swing), and two long loose wrappings trailing back together from the back "
               "of its head like a scarf's tails (#back, sway). " + LAYOUT)

    def stripes(x0, x1, y0, y1, step, slope, op=0.3):
        out, y = "", y0
        while y < y1:
            out += f'<path d="M {x0} {f(y)} L {x1} {f(y + slope)} L {x1} {f(y + slope + step)} L {x0} {f(y + step)} Z" fill="{SHADE}" opacity="{op}"/>'
            y += step * 2
        return out
    S.group("back", (100, 76), "trailing wrappings")
    for pts, w in (([(106, 72), (124, 54), (144, 44), (166, 44)], 8), ([(100, 66), (112, 44), (126, 26), (146, 14)], 7.5)):
        S.shape(band(pts, w), LIN, shadow=0, decor=stripes(40, 160, 0, 90, 9, 5, 0.22))
    S.group("body")
    S.shape(SHOULDERS, DLIN, decor=stripes(20, 180, 66, 150, 9, -10, 0.32))
    S.shape(blob([(36, 106), (58, 86), (100, 80), (142, 86), (164, 106), (152, 126), (100, 136), (48, 126)], 0.85), GOLD, shadow=3)
    S.shape(blob([(48, 106), (66, 92), (100, 87), (134, 92), (152, 106), (142, 118), (100, 126), (58, 118)], 0.85), TURQ, shadow=0)
    S.shape(HEAD, LIN, shadow=5,
            decor=stripes(40, 160, 40, 92, 11, 8) + stripes(40, 160, 118, 160, 10, -7)
                  + '<path d="M 46 98 Q 100 90 154 98 L 154 112 Q 100 106 46 112 Z" fill="#2A262E"/>'
                  + f'<path d="{ell(80, 66, 16, 8)}" fill="#FFFFFF" opacity="0.22"/>')
    for g, s, pv in (("arm-l", -1, PL), ("arm-r", 1, PR)):
        S.group(g, pv, "wrapped fist")
        x = 100 + s * 50
        S.shape(rr(x, 146, 25, 29, 9), LIN, T=f"rotate({-s * 6} {x} 146)", shadow=3, decor=stripes(x - 20, x + 20, 128, 164, 6, s * 4, 0.34))
    return save("enemies", "dunes-mummy", S)


# ================================================================== the sand serpent: a head and a body segment
SCALE, DSCALE, BELLY, MARK = "#D2A85C", "#A8803E", "#F0DCA8", "#6E4A2A"
PERIOD = 71   # one segment's step along the body in the segment's own units (the game's gap 26 at headR 55, vr 20)


def diamonds(ys, hw=24, hh=None):
    """The serpent's back pattern: dark diamonds edged pale, one per step, so segments join into one patterned body."""
    hh = hh or PERIOD / 2 - 3
    out = ""
    for y in ys:
        d = f"M 100 {f(y - hh)} L {100 + hw} {f(y)} L 100 {f(y + hh)} L {100 - hw} {f(y)} Z"
        out += (f'<path d="{d}" fill="{MARK}" stroke="{BELLY}" stroke-width="4" stroke-linejoin="round"/>'
                f'<path d="M 100 {f(y - hh + 12)} L {100 + hw - 12} {f(y)} L 100 {f(y + hh - 12)} L {100 - hw + 12} {f(y)} Z" fill="{DSCALE}"/>')
    return out


def serpent_head():
    S = Sprite("SAND SERPENT, the head (round 10): a real snake's head seen from above: a broad arrow of a head, widest at "
               "the jaws and narrowing to a blunt snout, two raised brow ridges (no eyes), two nostril pits, a pale lip, a "
               "forked tongue (#front, it flicks); behind it the neck, the body's width, with the body's pattern (dark "
               "diamonds edged pale down the back) so the first segment joins it. Parts: #body, #front (tongue). " + LAYOUT)
    S.group("front", (100, 180), "the tongue")
    S.raw('<path d="M 100 184 L 100 198 M 100 198 L 93 207 M 100 198 L 107 207" fill="none" stroke="#B8303A" stroke-width="4.5" '
          'stroke-linecap="round"/>')
    S.group("body")
    S.shape(rr(100, 62, 80, 110, 40), SCALE, shadow=0, decor=diamonds((50, 50 - 49.5)) + f'<rect x="56" y="0" width="12" height="130" fill="{BELLY}" opacity="0.35"/>'
            + f'<rect x="132" y="0" width="12" height="130" fill="{DSCALE}" opacity="0.4"/>')
    head = blob([(100, 190), (118, 184), (136, 162), (150, 132), (150, 106), (136, 88), (118, 82), (100, 80), (82, 82), (64, 88),
                 (50, 106), (50, 132), (64, 162), (82, 184)], 0.9)
    S.shape(head, SCALE, shadow=5,
            decor=f'<path d="M 44 150 C 70 186 130 186 156 150 L 156 200 L 44 200 Z" fill="{BELLY}"/>'
                  + f'<path d="M 100 92 L 116 112 L 100 140 L 84 112 Z" fill="{MARK}" stroke="{BELLY}" stroke-width="4" stroke-linejoin="round"/>'
                  + f'<path d="{ell(80, 96, 16, 8)}" fill="#FFFFF4" opacity="0.18"/>'
                  + f'<path d="{ell(93, 176, 2.6, 3.4)} {ell(107, 176, 2.6, 3.4)}" fill="{MARK}"/>')
    for s in (-1, 1):
        S.shape(ell(100 + s * 30, 128, 11, 15), light(SCALE, 1.06), T=f"rotate({s * 22} {100 + s * 30} 128)", shadow=4, sop=0.3)
    return save("enemies", "dunes-serpent-head", S)


def serpent_coil():
    S = Sprite("SAND SERPENT, a body segment (round 10): one length of the snake's body seen from above, a rounded link a "
               "little longer than the step between segments, so each overlaps the next and they read as one body; down "
               "its back the pattern: a dark diamond edged pale in the middle and half of one at each end (they meet the "
               "neighbours'), paler on the left flank and darker on the right. No parts. " + LAYOUT)
    S.group("body")
    S.shape(rr(100, 100, 110, 150, 55), SCALE, shadow=0,
            decor=diamonds((100 - PERIOD, 100, 100 + PERIOD)) + f'<rect x="40" y="0" width="14" height="200" fill="{BELLY}" opacity="0.4"/>'
                  + f'<rect x="146" y="0" width="14" height="200" fill="{DSCALE}" opacity="0.45"/>')
    return save("enemies", "dunes-serpent-coil", S)


def serpent_board():
    """The sand serpent as the game lays it (js/dunes.js: a head and six segments, gap 26, tapering to 65%), on an easy
    curve, the tail drawn first. For the board only."""
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
    from compose import compose
    head = (ROOT5 / "enemies" / "dunes-serpent-head.svg").read_text(encoding="utf-8")
    coil = (ROOT5 / "enemies" / "dunes-serpent-coil.svg").read_text(encoding="utf-8")
    kh, kc, gap, n = 21 / 40, 20 / 55, 26, 6
    # the head's path: an arc; positions in room units, the head at the bottom facing down
    pts = []
    for i in range(n + 1):
        d = i * gap
        ang = math.radians(-90 + 26 * math.sin(d / 46))       # the body's heading at that point (the head faces +y)
        pts.append((d, ang))
    x, y, items = 0.0, 0.0, []
    pos = [(0.0, 0.0, 90.0)]
    for i in range(1, n + 1):
        a = math.radians(-90 + 34 * math.sin(i * 1.05 - 0.4))
        x += gap * math.cos(a); y += gap * math.sin(a)
        pos.append((x, y, math.degrees(a) + 180))
    S = 1.0   # room units -> board units
    ox, oy = 92, 146
    for i in range(n, 0, -1):
        px, py, face = pos[i]
        k = kc * (1 - 0.35 * ((i - 1) / (n - 1))) * S
        items.append((coil, f"translate({ox + px * S:.2f} {oy + py * S:.2f}) rotate({face - 90:.1f}) scale({k:.4f}) translate(-100 -100)"))
    items.append((head, f"translate({ox:.2f} {oy:.2f}) scale({kh * S:.4f}) translate(-100 -100)"))
    out = ROOT5 / "boards" / "dunes-sand-serpent.svg"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(compose(items, "THE SAND SERPENT (round 10): its head and six body segments laid as the game lays the chain "
                                  "(gap 26, tapering), for the board only."), encoding="utf-8")
    return out


BUILD = {"dunes-cobra": cobra, "dunes-jackal": jackal, "dunes-mummy": mummy, "dunes-serpent-head": serpent_head,
         "dunes-serpent-coil": serpent_coil, "dunes-sand-serpent": serpent_board}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
