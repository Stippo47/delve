"""Round 12: five of the six new heroes the designer asked for (docs/riffle-log/2026-11-22-round12.txt, the deck notes
on kits: "Clock work hero. Influence time. / Air mage. Whirled effect / Warden (uses a lot or shackles and restraints.
Nullification themed) / Telekinetic. / Earth mage (earth quakes, chains of spikes from the ground, spawn stone walls.)"),
each drawn three ways: three different silhouettes, not three colourings. The sixth, the Mob, is mob12.py.
All in the approved heroes' bust build (a head token on shoulders, fists in the arm parts, no eyes, the small mouth), the
mages on the casters' lines (kit12.py). Nothing here goes into art/: the game keeps its stand-ins until a pick.
python heroes12.py [name ...]   -> ../../heroes/<id>-<take>.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from kit12 import *

CREAM, DARK = "#FBF4E2", "#3A3040"


def hand_grad(S, gid, c0, c1):
    S.add_def(f'<radialGradient id="{gid}" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="{c0}"/>'
              f'<stop offset="1" stop-color="{c1}"/></radialGradient>')
    return f"url(#{gid})"


# ================================================================== the Clockwork hero
def clock_pt(cx, cy, a, L):
    """A point L out from (cx, cy) at clock angle a (degrees clockwise from twelve; twelve = -y, the back)."""
    return cx + L * math.sin(math.radians(a)), cy - L * math.cos(math.radians(a))


def dial_decor(cx, cy, r, h=305, m=60, col=DARK, wh=7.5, wm=5.5, lh=0.52, lm=0.8):
    """A clock face's marks: twelve ticks (bold at the quarters) and two hands."""
    s = ""
    for i in range(12):
        q = i % 3 == 0
        x0, y0 = clock_pt(cx, cy, 30 * i, r - (10 if q else 6.5))
        x1, y1 = clock_pt(cx, cy, 30 * i, r - 2.5)
        s += strokes(f"M {f(x0)} {f(y0)} L {f(x1)} {f(y1)}", col, 4.4 if q else 2.6, 1 if q else 0.6)
    for a, L, w in ((h, r * lh, wh), (m, r * lm, wm)):
        x1, y1 = clock_pt(cx, cy, a, L)
        s += strokes(f"M {f(cx)} {f(cy)} L {f(x1)} {f(y1)}", col, w)
    return s


def clock_hand(S, T, L=60, col="#39465E"):
    """A great clock hand held as a blade: a thin shaft, a pierced round, a long spade point (+y forward)."""
    S.shape(rr(0, -10, 9, 24, 4), "#5A3A26", T=T, shadow=0)
    S.shape(circ(0, -24, 6.5), BRASS, T=T, shadow=0)
    d = (blob([(-4.5, 6), (4.5, 6), (4.5, L * 0.36), (13, L * 0.5), (11, L * 0.66), (0, L + 10), (-11, L * 0.66), (-13, L * 0.5), (-4.5, L * 0.36)], 0.55)
         + " " + circ(0, L * 0.52, 5.2))
    S.shape(d, col, T=T, shadow=2, rule="evenodd",
            decor=f'<path d="{poly([(0, 6), (-16, 6), (-16, L + 12), (0, L + 12)])}" fill="#FFFFFF" opacity="0.2"/>')
    S.shape(rr(0, 5, 26, 7.5, 3.5), BRASS, T=T, shadow=2)


def hourglass(S, T, w=19, h=25, sand="#F2B53A"):
    """An hourglass standing in the frame T (its middle at the origin): brass ends, two glass bulbs, sand run half down."""
    glass = blob([(-w + 3, -h), (w - 3, -h), (w - 2, -h * 0.5), (3.2, -2), (3.2, 2), (w - 2, h * 0.5), (w - 3, h), (-w + 3, h),
                  (-w + 2, h * 0.5), (-3.2, 2), (-3.2, -2), (-w + 2, -h * 0.5)], 0.6)
    top = blob([(-w * 0.62, -h * 0.42), (w * 0.62, -h * 0.42), (2.4, -2), (-2.4, -2)], 0.4)
    pile = blob([(-w + 3, h), (-w * 0.55, h * 0.55), (0, h * 0.3), (w * 0.55, h * 0.55), (w - 3, h)], 0.5)
    S.shape(glass, "#D8EEF2", T=T, shadow=2, side=False,
            decor=f'<path d="{top}" fill="{sand}"/><path d="{pile}" fill="{sand}"/><rect x="-1.4" y="-2" width="2.8" height="{h}" fill="{sand}"/>'
                  f'<path d="{ell(-w * 0.45, -h * 0.62, 3.2, 6)}" fill="#FFFFFF" opacity="0.85"/>'
                  f'<path d="{ell(-w * 0.45, h * 0.45, 2.6, 5)}" fill="#FFFFFF" opacity="0.6"/>')
    for yy in (-h - 3, h + 3):
        S.shape(rr(0, yy, w * 2 + 6, 9, 4), BRASS, T=T, shadow=2)


def clockwork(v):
    what = {"watch": "a chronomancer who wears a great brass pocket watch for a hat (its white face up, the hands at ten past ten, "
                     "the winding crown and bow at the back); a bottle-green coat edged in brass; a pendulum staff in the right "
                     "fist (behind the body), a small brass cog turning over the open left fist",
            "sands": "Father Time: a dusk-grey hood edged in brass, a long white beard; a great clock hand for a staff in the "
                     "right fist (behind the body), an hourglass hanging from the left fist",
            "windup": "a wind-up brass man: a brass head whose face is a clock face (the hands at twenty past eight make a "
                      "moustache), copper shoulders with rivets, a big butterfly key in the back (#back, it can turn), brass "
                      "fists; a clock hand for a sword in the right fist"}[v]
    S = Sprite(f"CLOCKWORK (round 12, take \"{v}\"): the hero who bends time. {what}. " + LAYOUT)
    if v == "watch":
        COAT = "#2F6B55"
        B, F = (186, 52), (150, 150)
        S.group("arm-r", PR, "pendulum staff")
        T, a = pole(S, B, F, 8, BRASS)
        S.shape(rr(0, 9, 4.5, 16, 2), "#8E96A4", T=T, shadow=0)
        S.shape(circ(0, 27, 14.5), BRASS, T=T, shadow=0, decor=f'<path d="{circ(0, 27, 8)}" fill="{shade(BRASS, 0.72)}" opacity="0.55"/>' + hi(-5, 21, 5, 3.4, 0.7))
        fist(S, *grip(B, F, (151, 141)), a)
        S.group("body")
        robe(S, COAT, BRASS, 8)
        head(S)
        mouth(S)
        # the pocket watch worn as a hat: the bow and crown at the back, to one side; the case; the face
        cx, cy, R = 100, 66, 55
        bx, by = clock_pt(cx, cy, 30, R + 17)
        S.shape(ring(bx, by, 10.5, 5), BRASS, rule="evenodd", shadow=0)
        kx, ky = clock_pt(cx, cy, 30, R + 4)
        S.shape(rr(0, 0, 17, 15, 4), shade(BRASS, 0.9), T=frame(kx, ky, 30), shadow=0)
        S.shape(circ(cx, cy + 5, R), shade(BRASS, 0.72), shadow=5)
        S.shape(circ(cx, cy, R), BRASS, shadow=0, decor=hi(72, 26, 22, 9, 0.35, -28))
        S.shape(circ(cx, cy, R - 10), CREAM, shadow=0, side=False,
                decor=dial_decor(cx, cy, R - 10) + f'<path d="{circ(cx, cy, R - 10)}" fill="url(#{S._grad("#B8B0A0", "side")})" opacity="0.7"/>')
        S.shape(circ(cx, cy, 6.5), BRASS, shadow=2)
        free(S, "l")
        S.shape(gear(56, 168, 14.5, 10, 8, 22) + " " + circ(56, 168, 4.2), BRASS, rule="evenodd", shadow=0)
    elif v == "sands":
        ROBE, HD = "#6E6A8C", "#8A86A8"
        B, F = (186, 50), (150, 150)
        S.group("arm-r", PR, "the clock-hand staff")
        T, a = pole(S, B, F, 8, "#8A5E38")
        d = blob([(-4, -2), (4, -2), (4, 10), (13, 22), (10, 34), (0, 54), (-10, 34), (-13, 22), (-4, 10)], 0.55) + " " + circ(0, 24, 5)
        S.shape(d, BRASS, T=T, shadow=0, rule="evenodd", decor=f'<path d="{poly([(0, -4), (16, -4), (16, 56), (0, 56)])}" fill="{shade(BRASS, 0.6)}" opacity="0.4"/>')
        S.shape(rr(0, -3, 15, 7, 3), shade(BRASS, 0.8), T=T, shadow=1)
        fist(S, *grip(B, F, (151, 141)), a)
        S.group("body")
        robe(S, ROBE, BRASS, 8)
        head(S)
        beard = ("M 62 116 C 62 140 74 154 86 162 C 88 174 93 184 100 196 C 107 184 112 174 114 162 C 126 154 138 140 138 116 "
                 "C 126 132 112 137 100 131 C 88 137 74 132 62 116 Z")
        S.shape(beard, "#F1EFE8", shadow=3, decor=strokes("M 100 140 L 100 178", "#B9B6AE", 3, 0.6))
        S.shape("M 100 120 C 90 116 76 120 68 130 C 80 134 92 132 100 127 C 108 132 120 134 132 130 C 124 120 110 116 100 120 Z", "#FAF8F2", shadow=3)
        S.shape(HOOD, HD, shadow=4, decor=hi(72, 62, 16, 9, 0.22, -30))
        edge = "M 46 124 C 52 106 70 98 100 98 C 130 98 148 106 154 124 C 152 110 150 104 148 100 C 136 92 120 89 100 89 C 80 89 64 92 52 100 C 50 104 48 110 46 124 Z"
        S.shape(edge, BRASS, shadow=2)
        S.group("arm-l", PL, "the hourglass, hanging from the left fist")
        TH = frame(56, 172, 6)
        S.shape(ring(0, -30, 7.5, 3.4), shade(BRASS, 0.85), T=TH, rule="evenodd", shadow=0)
        hourglass(S, TH, 17, 20)
        fist(S, 57, 140, 0, w=24, h=21)
    else:
        BR, CU = "#E0AC48", "#C4703C"
        hb = hand_grad(S, "gHandB", "#F6D684", "#B8822E")
        S.group("back", (100, 44), "the key (the game can turn it)")
        S.shape(rr(100, 36, 11, 44, 4), "#8E96A4", shadow=0)
        for s in (-1, 1):
            S.shape(ell(100 + s * 23, 14, 21, 14.5) + " " + ell(100 + s * 24, 14, 10, 6.5), "#C9CED6", rule="evenodd", shadow=0)
        S.shape(circ(100, 16, 8.5), "#8E96A4", shadow=1)
        S.group("arm-r", PR, "the clock-hand sword")
        TS = frame(165, 124, 14)
        clock_hand(S, TS)
        fist(S, 0, -8, T=TS, hand=hb)
        S.group("body")
        S.shape(SHOULDERS, CU, decor="".join(f'<circle cx="{x}" cy="{y}" r="3.6" fill="{light(CU, 1.4)}"/>' for x, y in ((38, 104), (46, 122), (162, 104), (154, 122)))
                + hi(58, 90, 20, 7, 0.25))
        S.shape(cloud(100, 106, 44, 14, 0.5), "#8E96A4", shadow=3, T="translate(100 106) scale(1.12 0.8) translate(-100 -106)")   # a cog collar
        S.shape(HEAD, BR, shadow=5, decor=hi(76, 66, 18, 10, 0.45, -28))
        S.shape(rr(100, 46, 22, 12, 5), shade(BR, 0.8), shadow=2)                                       # the cap on top
        cx, cy, R = 100, 109, 37
        S.shape(circ(cx, cy, R + 5), shade(BR, 0.72), shadow=2)
        S.shape(circ(cx, cy, R), CREAM, shadow=0, side=False,
                decor=dial_decor(cx, cy, R, h=247, m=113, wh=8.5, wm=8.5, lh=0.62, lm=0.62)
                      + f'<path d="{circ(cx, cy, R)}" fill="url(#{S._grad("#B8B0A0", "side")})" opacity="0.7"/>')
        S.shape(circ(cx, cy, 6), BR, shadow=2)
        S.group("arm-l", PL, "free hand")
        fist(S, 50, 146, -6, hand=hb)
    return save("heroes", f"clockwork-{v}", S)


# ================================================================== the Air mage
MINT, DMINT, WHITE = "#7CCDB6", "#2F9E8A", "#F4F8F4"


def whirl(S, x, y, k=1.0, col="#E4F5EF"):
    """A little whirlwind standing on a point: three flat rings of air, the widest on top."""
    d = " ".join(ell(x + dx * k, y + dy * k, rx * k, ry * k) for dx, dy, rx, ry in ((0, 0, 15, 6.5), (2.5, 10, 10.5, 5), (-0.5, 19, 6, 3.6)))
    S.shape(d, col, shadow=0, decor=strokes(f"M {f(x - 9 * k)} {f(y + 1.5 * k)} Q {f(x)} {f(y + 6 * k)} {f(x + 10 * k)} {f(y)} "
                                             f"M {f(x - 4 * k)} {f(y + 11.5 * k)} Q {f(x + 3 * k)} {f(y + 14.5 * k)} {f(x + 9 * k)} {f(y + 10 * k)}", DMINT, 2.6 * k, 0.75))


def fan(S, T, col=WHITE, rib=DMINT):
    """An open paper fan in the frame T (the pivot under the fist at the origin, the fan opening forward, +y)."""
    leaf = [(0, 2), (-30, 30), (-22, 48), (-8, 57), (8, 57), (22, 48), (30, 30)]
    S.shape(blob(leaf, 0.45), col, T=T, shadow=2,
            decor=strokes("M 0 4 L -24 36 M 0 4 L -10 52 M 0 4 L 10 52 M 0 4 L 24 36", rib, 3, 0.85)
                  + strokes("M -27 33 Q 0 62 27 33", rib, 4.5, 0.9))
    fist(S, 0, 0, T=T)


def air_mage(v):
    what = {"swirl": "a white hood whose top is drawn up into a curl of wind, a spiral turning on it; a long scarf streaming "
                     "back off one shoulder (#back, sways); a mint robe edged in white; a staff ending in a curl in the right "
                     "fist (behind the body), a little whirlwind over the open left fist",
            "fans": "a wide round travelling hat painted with one great spiral, a small knob on top; a deep green robe; an open "
                    "paper fan in each hand (arm-l and arm-r: the hero fans the wind with both, in turn)",
            "gale": "no hat: white hair blown hard to one side in three long locks, and a long scarf blown the same way (#back, "
                    "sways); a mint robe; a pinwheel on a stick for a staff in the right fist, a little whirlwind over "
                    "the open left fist"}[v]
    S = Sprite(f"AIR MAGE (round 12, take \"{v}\"): the mage of wind (\"Whirled effect\"). {what}. " + LAYOUT)
    if v == "swirl":
        S.group("back", (100, 92), "scarf")
        for sp, w in (([(70, 96), (48, 78), (34, 54), (14, 44), (4, 22)], 13), ([(62, 104), (36, 96), (16, 78), (0, 74)], 10)):
            S.shape(strip(sp, w, 0.0, 2, (0.55, 1.0)), DMINT, shadow=0)
        B, F = (186, 52), (150, 150)
        S.group("arm-r", PR, "the curled staff")
        T, a = pole(S, B, F, 8, "#C9B08A")
        S.shape(band([(0, -3), (2, 10), (-1, 22), (-11, 28), (-22, 25), (-26, 14), (-20, 6), (-12, 9), (-12, 16)], 4.6), "#E8EEF0", T=T, shadow=0)
        fist(S, *grip(B, F, (151, 141)), a)
        S.group("body")
        robe(S, MINT, WHITE, 8)
        head(S)
        mouth(S)
        S.shape(taper([(86, 52), (92, 30), (108, 16), (126, 18), (132, 32), (124, 40), (117, 34)], 30, 7), WHITE, shadow=0)
        S.shape(HOOD, WHITE, shadow=4, decor=strokes(spiral(100, 68, 3, 25, 1.75, 44, 200), DMINT, 5.5, 0.9))
        free(S, "l")
        whirl(S, 56, 160)
    elif v == "fans":
        ROBE = "#3E9E8C"
        S.group("body")
        robe(S, ROBE, WHITE, 8)
        head(S)
        mouth(S)
        HAT = "#EFE6C8"
        T = scl(0.98, dy=-2)
        pts = []
        for i in range(73):   # the painted spiral, flattened like the brim
            t = i / 72
            a = math.radians(150) + t * 2.4 * 2 * math.pi
            r = 6 + 58 * t
            pts.append((100 + r * math.cos(a), 66 + r * 0.66 * math.sin(a)))
        spi = "M " + " L ".join(f"{f(x)} {f(y)}" for x, y in pts)
        S.shape(BRIM, HAT, T=T, shadow=5, decor=strokes(spi, DMINT, 6, 0.9) + hi(64, 44, 20, 8, 0.3, -24))
        S.shape(ell(100, 62, 10, 7.5), shade(HAT, 0.82), T=T, shadow=2)
        S.group("arm-l", PL, "fan")
        fan(S, frame(46, 142, 24))
        S.group("arm-r", PR, "fan")
        fan(S, frame(154, 142, -24))
    else:
        S.group("back", (100, 92), "scarf, blown to one side")
        S.shape(strip([(84, 100), (56, 92), (30, 74), (8, 72), (-6, 56)], 14, 0.0, 2, (0.5, 1.0)), DMINT, shadow=0)
        B, F = (186, 52), (150, 150)
        S.group("arm-r", PR, "the pinwheel")
        T, a = pole(S, B, F, 7, "#C9B08A")
        for i in range(4):   # four curled sails round the pin
            TT = f"{T} translate(0 20) rotate({i * 90})"
            S.shape(blob([(0, 0), (4, -15), (17, -21), (20, -6), (9, -1)], 0.55), WHITE if i % 2 == 0 else MINT, T=TT, shadow=0)
        S.shape(circ(0, 20, 4.6), GOLD, T=T, shadow=1)
        fist(S, *grip(B, F, (151, 141)), a)
        S.group("body")
        robe(S, MINT, WHITE, 8)
        # the hair blown to the left: three long locks behind the head, then the cap of hair over the brow
        HAIR = "#F6F6F0"
        for sp, w in (([(74, 58), (46, 44), (22, 40), (2, 26)], 30), ([(66, 78), (40, 72), (18, 76), (-4, 66)], 26), ([(64, 98), (44, 100), (26, 108), (10, 106)], 20)):
            S.shape(taper(sp, w, 5, 0.8), HAIR, shadow=2)
        head(S)
        mouth(S)
        S.shape(blob([(51, 110), (46, 80), (58, 54), (100, 40), (140, 52), (153, 78), (151, 104), (138, 88), (116, 82), (92, 86), (70, 96), (58, 106)], 0.8), HAIR, shadow=4,
                decor=strokes("M 140 58 Q 100 46 64 70 M 146 80 Q 104 62 62 90", "#C9D6D2", 3.4, 0.75))
        free(S, "l")
        whirl(S, 56, 160)
    return save("heroes", f"airMage-{v}", S)


# ================================================================== the Warden
LEATHER = "#5E4A3C"


def cuff(S, T, links=3, col=IRON, y0=14):
    """A shackle on a short chain, hanging forward (+y) from the fist at the origin of T: links, then an open cuff."""
    S.shape(chain([(0, y0 + i * 10.5) for i in range(links)], 6.8, 2.7), DIRON, T=T, rule="evenodd", shadow=0)
    yc = y0 + links * 10.5 + 9
    S.shape(ring(0, yc, 15, 8.5), col, T=T, rule="evenodd", shadow=1,
            decor=f'<rect x="-3.5" y="{f(yc + 6)}" width="7" height="12" fill="{INK}" opacity="0.55"/>' + hi(-7, yc - 8, 5, 3, 0.6))
    fist(S, 0, 0, T=T)


def big_key(S, T, L=84, col="#C9CED6"):
    """A gaoler's great key held like a mace: the bow behind the fist, the bit at the far end, its teeth to the outside."""
    S.shape(ring(0, -34, 17, 8), col, T=T, rule="evenodd", shadow=0)
    S.shape(rr(0, L / 2 - 14, 9.5, L + 12, 4), col, T=T, shadow=0, decor=f'<rect x="-3.4" y="-30" width="2.6" height="{L + 30}" fill="#FFFFFF" opacity="0.6"/>')
    bit = poly([(3, L - 34), (28, L - 34), (28, L - 25), (19, L - 25), (19, L - 19), (28, L - 19), (28, L - 7), (3, L - 7)])
    S.shape(bit, col, T=T, shadow=2, decor=f'<rect x="3" y="{L - 34}" width="26" height="4.5" fill="#FFFFFF" opacity="0.5"/>')
    S.shape(circ(0, L - 4, 6.5), col, T=T, shadow=0)
    S.shape(rr(0, L - 41, 15, 7, 3), shade(col, 0.72), T=T, shadow=1)
    S.shape(rr(0, 12, 15, 7, 3), shade(col, 0.72), T=T, shadow=1)
    fist(S, 0, -8, T=T)


def warden(v):
    what = {"gaoler": "an iron pot helm with a cage of three bars down over the face, round iron shoulder plates on dark "
                      "leather; a great key held like a mace in the right fist (arm-r, under the shoulder), a shackle on a "
                      "short chain hanging from the left fist (arm-l)",
            "binder": "a witch-finder's black hat (the farmers' hat as its base: a wide brim and a flat crown) with an iron band "
                      "and a padlock for a buckle, chains crossed over the shoulders to a padlock under the chin; a man-catcher "
                      "(a pole with a wide iron fork) in the right fist (behind the body); left hand free",
            "lock": "a closed iron helm made like a padlock: a keyhole for a visor, glowing pale, and the lock's shackle arching "
                    "over the back of the head; iron shoulders; a shackle on a chain in each fist (arm-l and arm-r: thrown and "
                    "swung in turn)"}[v]
    S = Sprite(f"WARDEN (round 12, take \"{v}\"): the hero of shackles and restraints, who shuts powers off. {what}. " + LAYOUT)
    NULL = "#BFF3F0"
    if v == "gaoler":
        S.group("arm-r", PR, "the great key")
        big_key(S, frame(166, 118, 12))
        S.group("body")
        S.shape(SHOULDERS, LEATHER, decor=hi(58, 90, 20, 7, 0.12))
        for s in (-1, 1):
            S.shape(circ(100 + s * 56, 104, 25), IRON, shadow=3,
                    decor=hi(100 + s * 56 - 8, 92, 9, 5, 0.5) + "".join(f'<circle cx="{f(100 + s * 56 + 16 * math.cos(math.radians(a)))}" cy="{f(104 + 16 * math.sin(math.radians(a)))}" r="2.8" fill="{DIRON}"/>' for a in (30, 150, 270)))
        head(S)
        mouth(S)
        # the cage: a hoop under the jaw and three bars up to the helm
        HOOP = "M 49 112 C 54 136 74 152 100 154 C 126 152 146 136 151 112 L 151 124 C 146 148 126 164 100 166 C 74 164 54 148 49 124 Z"
        S.shape(HOOP + " " + " ".join(rr(x, 128, 9, 66, 3) for x in (74, 100, 126)), DIRON, shadow=3,
                decor=f'<path d="{" ".join(rr(x - 2, 128, 2.6, 66, 1) for x in (74, 100, 126))}" fill="#FFFFFF" opacity="0.35"/>')
        S.shape(blob([(49, 100), (46, 68), (62, 42), (100, 32), (138, 42), (154, 68), (151, 100), (100, 104)], 0.85), IRON, shadow=5,
                decor=hi(80, 56, 20, 13, 0.35))
        rim = ("M47 90 C60 99 80 104 100 104 C120 104 140 99 153 90 C155 96 154 103 151 107 C138 115 120 119 100 119 "
               "C80 119 62 115 49 107 C46 103 45 96 47 90 Z")
        S.shape(rim, shade(IRON, 0.78), shadow=3,
                decor="".join(f'<circle cx="{x}" cy="{y}" r="3" fill="#E6EAF0"/>' for x, y in ((58, 103), (78, 110), (100, 112), (122, 110), (142, 103))))
        S.group("arm-l", PL, "shackle")
        cuff(S, frame(50, 146, 4), 2)
    elif v == "binder":
        HAT = "#3E3A48"
        B, F = (186, 48), (150, 150)
        S.group("arm-r", PR, "the man-catcher")
        T, a = pole(S, B, F, 8, "#8A5E38")
        S.shape(band([(-19, 40), (-19, 20), (-12, 8), (0, 3), (12, 8), (19, 20), (19, 40)], 4.8), "#C9CED6", T=T, shadow=0)
        S.shape(rr(0, 2, 13, 10, 3), DIRON, T=T, shadow=1)
        fist(S, *grip(B, F, (151, 141)), a)
        S.group("body")
        S.shape(SHOULDERS, "#4A5068", decor=hi(58, 90, 20, 7, 0.14))
        for s in (-1, 1):
            S.shape(chain(along((100 + s * 68, 96), (100 + s * 20, 150), 6), 7.4, 3), IRON, rule="evenodd", shadow=2)
        S.shape(blob([(54, 116), (52, 96), (66, 86), (100, 82), (134, 86), (148, 96), (146, 116), (130, 106), (100, 102), (70, 106)], 0.8), "#2E3344", shadow=3)   # the high collar
        head(S)
        mouth(S)
        S.shape(rr(100, 170, 26, 21, 5), BRASS, shadow=2,
                decor=f'<circle cx="100" cy="168" r="3.6" fill="{INK}"/><rect x="98.2" y="168" width="3.6" height="8" fill="{INK}"/>' + hi(93, 164, 5, 3, 0.6))
        TH = scl(0.98, dy=-3)
        S.shape(BRIM, HAT, T=TH, shadow=5, decor=hi(62, 44, 22, 8, 0.12, -24))
        S.shape(CROWN, light(HAT, 1.25), T=TH, shadow=4, decor=hi(84, 40, 18, 8, 0.12))
        S.shape(BAND, IRON, T=TH, shadow=2,
                decor=f'<rect x="90" y="70" width="20" height="17" rx="3" fill="{BRASS}"/><circle cx="100" cy="77" r="2.8" fill="{INK}"/><rect x="98.6" y="77" width="2.8" height="6" fill="{INK}"/>')
        free(S, "l")
    else:
        S.group("back", (100, 60), "the lock's shackle")
        arch = [(100 + 44 * math.cos(math.radians(t)), 52 - 44 * math.sin(math.radians(t))) for t in range(-14, 195, 16)]
        S.shape(band(arch, 8), "#C9CED6", shadow=0, decor=strokes("M 60 40 Q 70 16 100 12", "#FFFFFF", 4, 0.6))
        S.group("body")
        S.shape(SHOULDERS, LEATHER, decor=hi(58, 90, 20, 7, 0.12))
        for s in (-1, 1):
            S.shape(circ(100 + s * 56, 104, 25), IRON, shadow=3, decor=hi(100 + s * 56 - 8, 92, 9, 5, 0.5))
        BODY = "#8E96A4"
        helm = "M 48 62 C 48 50 56 44 68 44 L 132 44 C 144 44 152 50 152 62 L 152 122 C 152 142 132 156 100 156 C 68 156 48 142 48 122 Z"
        S.shape(helm, BODY, shadow=5, decor=hi(72, 62, 14, 9, 0.4) + "".join(f'<circle cx="{x}" cy="{y}" r="3.2" fill="#E6EAF0"/>' for x, y in ((60, 56), (140, 56), (60, 130), (140, 130))))
        S.shape(rr(100, 60, 104, 12, 4), shade(BODY, 0.75), shadow=2)
        key = circ(100, 100, 13) + " " + poly([(93, 104), (107, 104), (112, 136), (88, 136)])
        S.shape(key, shadow=0, side=False, fill="#2B2230",
                decor=f'<path d="{circ(100, 100, 8)}" fill="{NULL}"/><path d="{poly([(96, 104), (104, 104), (107, 132), (93, 132)])}" fill="{NULL}"/>'
                      f'<path d="{circ(100, 100, 4)}" fill="#FFFFFF"/>')
        S.group("arm-l", PL, "shackle")
        cuff(S, frame(48, 146, 8), 2)
        S.group("arm-r", PR, "shackle")
        cuff(S, frame(152, 146, -8), 2)
    return save("heroes", f"warden-{v}", S)


# ================================================================== the Telekinetic
MUST, PSI, DPSI, INDIGO = "#D2A53C", "#9C8CFF", "#5E4ACF", "#3E3A8C"
STONE, DSTONE = "#B3A894", "#7E7566"


def rock(S, x, y, r, rot=0, col=STONE, T="", shadow=0, lift=None, n=7):
    """A lump of stone: a knobbly outline, a lit facet, a pit. lift = the colour of a crescent of force under it."""
    pts = []
    for i in range(n):
        a = math.radians(rot + 360 * i / n)
        k = (1.0, 0.86, 1.06, 0.9, 1.0, 0.84, 0.98, 0.9, 1.04)[i % 9]
        pts.append((x + r * k * math.cos(a), y + r * k * 0.92 * math.sin(a)))
    if lift:
        S.shape(blob([(x - r * 1.02, y + r * 0.62), (x, y + r * 1.26), (x + r * 1.02, y + r * 0.62), (x + r * 0.5, y + r * 1.58), (x - r * 0.5, y + r * 1.58)], 0.9),
                lift, T=T, shadow=0, side=False)
    S.shape(blob(pts, 0.55), col, T=T, shadow=shadow,
            decor=f'<path d="{blob([(x - r * 0.75, y - r * 0.2), (x - r * 0.2, y - r * 0.8), (x + r * 0.35, y - r * 0.62), (x - r * 0.1, y - r * 0.1)], 0.5)}" fill="#FFFFFF" opacity="0.3"/>'
                  f'<path d="{ell(x + r * 0.28, y + r * 0.3, r * 0.2, r * 0.14)}" fill="{shade(col, 0.6)}" opacity="0.6"/>')


def psi_blade(S, T):
    """A short broad sword that hangs in the air by itself (no hand on it), a ring of force round its grip."""
    L, w = 62, 10
    S.shape(rr(0, -10, 9, 22, 4), "#4A3A5E", T=T, shadow=0)
    S.shape(circ(0, -23, 6), BRASS, T=T, shadow=0)
    blade = [(-w, 8), (w, 8), (w, L - 12), (0, L + 8), (-w, L - 12)]
    S.shape(poly(blade), STEEL, T=T, shadow=2, decor=blade_decor([(0, 8), (w, 8), (w, L - 12), (0, L + 8)]))
    S.shape(rr(0, 5, 32, 8, 3.5), BRASS, T=T, shadow=2)
    S.shape(ell(0, -9, 15, 7) + " " + ell(0, -9, 9.5, 2.6), PSI, T=T, rule="evenodd", shadow=0, side=False)


def telekinetic(v):
    what = {"orbit": "a tall white turban with a violet gem at the brow, a mustard robe with an indigo edge; both hands "
                     "open and empty; three stones hang in the air behind the shoulders, a crescent of force under each (#back: "
                     "the game can swing them round)",
            "blades": "a deep indigo hood with a pale eye-shaped gem, both fists pressed to the temples (in #body); two short "
                      "swords hang in the air in front of the shoulders with no hand on them, a ring of force round each "
                      "grip (arm-l and arm-r: they strike in turn)",
            "boulder": "an indigo blindfold tied over the upper face, pale silver hair in one long braid that floats up behind the head "
                       "and curls over (#back, sways); a mustard robe; a boulder hanging in the air in front of the open right "
                       "hand, a crescent of force under it (arm-r); the left hand open"}[v]
    S = Sprite(f"TELEKINETIC (round 12, take \"{v}\"): the hero who moves things with the mind. {what}. " + LAYOUT)
    if v == "orbit":
        S.group("back", (100, 96), "the stones that hang in the air")
        rock(S, 24, 62, 18, 10, lift=PSI)
        rock(S, 150, 14, 13, 40, lift=PSI)
        rock(S, 181, 74, 11, 80, lift=PSI)
        S.group("body")
        robe(S, MUST, INDIGO, 8)
        head(S)
        mouth(S)
        TUR = "#F3EFE4"
        S.shape(blob([(48, 104), (42, 74), (54, 42), (80, 24), (100, 20), (120, 24), (146, 42), (158, 74), (152, 104), (128, 96), (100, 94), (72, 96)], 0.85), TUR, shadow=4,
                decor=strokes("M 50 86 Q 96 58 150 80 M 54 60 Q 100 36 146 58 M 72 34 Q 102 50 138 38", "#C9C2B0", 3.6, 0.8) + hi(74, 44, 16, 8, 0.4, -24))
        S.shape(circ(100, 88, 11.5), GOLD, shadow=2)
        S.shape(circ(100, 88, 7.5), PSI, shadow=0, decor=hi(97.5, 85.5, 2.8, 2, 0.9))
        free(S, "l", 52, 144)
        free(S, "r", 148, 144)
    elif v == "blades":
        S.group("body")
        robe(S, MUST, INDIGO, 8)
        head(S)
        mouth(S)
        S.shape(HOOD, INDIGO, shadow=4, decor=hi(70, 62, 9, 17, 0.14, 20))
        S.shape(blob([(82, 68), (100, 56), (118, 68), (100, 80)], 0.5), "#F2EEFF", shadow=2, decor=f'<path d="{circ(100, 68, 6)}" fill="{PSI}"/>' + hi(98, 66, 2.2, 1.6, 0.9))
        for s in (-1, 1):   # fists at the temples
            fist(S, 100 + s * 49, 122, s * 8, w=22, h=24)
        S.group("arm-l", PL, "a sword that hangs in the air")
        psi_blade(S, frame(26, 126, -6))
        S.group("arm-r", PR, "a sword that hangs in the air")
        psi_blade(S, frame(174, 126, 6))
    else:
        HAIR = "#DCD6EA"
        S.group("back", (100, 60), "the floating braid")
        sp = [(100, 54), (104, 34), (118, 16), (138, 8), (156, 16), (160, 32), (150, 42)]
        S.shape(taper(sp, 26, 12, 0.8), HAIR, shadow=0,
                decor="".join(strokes(f"M {f(x - 12)} {f(y + dy)} L {f(x + 12)} {f(y - dy)}", "#9A8EB8", 3.2, 0.8) for (x, y), dy in zip(sp[1:6], (5, 9, 2, -8, -2))))
        S.shape(circ(149, 44, 8), GOLD, shadow=1, decor=hi(147, 42, 3, 2, 0.7))
        S.group("body")
        robe(S, MUST, INDIGO, 8)
        head(S)
        mouth(S)
        S.shape(blob([(51, 106), (46, 78), (60, 52), (100, 42), (140, 52), (154, 78), (149, 106), (140, 90), (120, 82), (100, 86), (80, 82), (60, 90)], 0.85), HAIR, shadow=4,
                decor=hi(78, 58, 16, 8, 0.4, -20) + strokes("M 100 44 L 100 84", "#9A8EB8", 3, 0.6))
        S.shape(blob([(50, 98), (148, 98), (160, 92), (168, 100), (160, 106), (166, 116), (150, 112), (149, 114), (100, 118), (51, 114)], 0.35), INDIGO, shadow=3,
                decor=strokes("M 52 102 Q 100 106 148 102", "#6E68C8", 2.6, 0.8))
        free(S, "l", 54, 142)
        S.group("arm-r", PR, "the open hand and the boulder that hangs before it")
        fist(S, 146, 142, 0, w=24, h=21)
        rock(S, 124, 170, 20, 20, lift=PSI, n=8)
    return save("heroes", f"telekinetic-{v}", S)


# ================================================================== the Earth mage
EARTH, CLAY, SAND, AMBER, MOSS = "#7A5638", "#9A6A42", "#D9B77A", "#F2A93A", "#7FA046"


def column(S, x, y, a, L, w=20, col=STONE):
    """A blunt column of rock growing from (x, y) along angle a (degrees, 0 = +y), its end face lit."""
    T = frame(x, y, a)
    S.shape(poly([(-w / 2, 0), (w / 2, 0), (w / 2, L - 5), (w / 2 - 5, L), (-w / 2 + 5, L), (-w / 2, L - 5)]), col, T=T, shadow=2,
            decor=f'<path d="{poly([(-w / 2, 0), (-1, 0), (-1, L), (-w / 2, L)])}" fill="#FFFFFF" opacity="0.22"/>'
                  f'<path d="{poly([(-w / 2, L - 9), (w / 2, L - 9), (w / 2, L), (-w / 2, L)])}" fill="#FFFFFF" opacity="0.28"/>')


def spike(S, x, y, a, L, w=24, col=STONE, shadow=0):
    """A spike of rock from (x, y) along angle a (0 = +y): a lit face and a dark one."""
    T = frame(x, y, a)
    S.shape(poly([(-w / 2, 0), (w / 2, 0), (2, L), (-2, L)]), col, T=T, shadow=shadow,
            decor=f'<path d="{poly([(-w / 2, 0), (0, 0), (0, L), (-2, L)])}" fill="#FFFFFF" opacity="0.26"/>')


def earth_mage(v):
    what = {"slab": "a brown hood with a keystone and an amber gem on its brow, blunt columns of rock standing up off the "
                    "shoulders; a clay-brown robe edged in sand; a staff with a rope-bound boulder for a head in the right fist "
                    "(behind the body), a stone turning over the open left fist",
            "fists": "a stone-shaper with a boulder for a cap (moss on it, amber crystals growing out of one side) and a big "
                     "russet beard in two tied braids; each fist inside a great glove of rock (arm-l and arm-r: the hero "
                     "pounds the ground with them in turn)",
            "spikes": "a ring of rock spikes standing out all round the back of the shoulders (#back), russet hair tied up in a "
                      "bun with a stone pin; a moss-green robe edged in sand; a carved standing stone for a staff in the right "
                      "fist (behind the body), its runes amber; a stone over the open left fist"}[v]
    S = Sprite(f"EARTH MAGE (round 12, take \"{v}\"): the mage of earthquakes, spikes and stone walls. {what}. " + LAYOUT)
    if v == "slab":
        B, F = (186, 52), (150, 148)
        S.group("arm-r", PR, "the boulder staff")
        T, a = pole(S, B, F, 9, "#8A5E38")
        rock(S, 0, 20, 18, 30, T=T)
        S.shape(rr(0, 20, 38, 5.5, 2.5) + " " + rr(0, 20, 5.5, 38, 2.5), "#D9C7A0", T=f"{T} rotate(18 0 20)", shadow=0, side=False)
        rock(S, 0, 20, 9.5, 10, T=T, col=light(STONE, 1.06))
        fist(S, *grip(B, F, (151, 141)), a)
        S.group("body")
        for s in (-1, 1):
            for da, L, w in ((150, 52, 26), (108, 46, 24)):
                column(S, 100 + s * 44, 104, -s * da, L, w, light(STONE, 1.06))
        robe(S, CLAY, SAND, 8)
        head(S)
        mouth(S)
        S.shape(HOOD, EARTH, shadow=4, decor=hi(70, 62, 9, 17, 0.14, 20))
        S.shape(poly([(84, 54), (116, 54), (122, 86), (100, 96), (78, 86)]), light(STONE, 1.08), shadow=3)
        S.shape(poly([(100, 60), (110, 73), (100, 88), (90, 73)]), AMBER, shadow=2,
                decor='<path d="M 100 60 L 90 73 L 100 75 Z" fill="#FFF3C4" opacity="0.85"/><path d="M 100 75 L 110 73 L 100 88 Z" fill="#A85A12" opacity="0.4"/>')
        free(S, "l")
        rock(S, 56, 168, 11.5, 50)
    elif v == "fists":
        BEARD = "#A8552E"
        S.group("body")
        S.shape(SHOULDERS, "#6E7A46", decor=hi(58, 90, 20, 7, 0.14))
        S.shape(cloud(100, 104, 46, 13, 0.55), "#5A4636", shadow=3, T="translate(100 104) scale(1.14 0.84) translate(-100 -104)")   # a fur collar
        head(S)
        for s in (-1, 1):   # the beard: two tied braids
            sp = [(100 + s * 20, 136), (100 + s * 24, 156), (100 + s * 20, 174), (100 + s * 14, 190)]
            S.shape(circles([(x, y, 12.5 - i * 1.6) for i, (x, y) in enumerate(sp)]), BEARD, shadow=2)
            S.shape(rr(100 + s * 17, 180, 17, 7, 3), STONE, shadow=1, T=f"rotate({s * 14} {100 + s * 17} 180)")
        S.shape("M 58 112 C 62 134 76 150 100 154 C 124 150 138 134 142 112 C 130 126 114 132 100 126 C 86 132 70 126 58 112 Z", BEARD, shadow=3)
        moustache(S, light(BEARD, 1.12), y=124, w=0.95, droop=2)
        # the boulder worn as a cap
        cap = [(46, 104), (40, 80), (48, 54), (66, 36), (88, 30), (112, 26), (136, 36), (152, 52), (160, 78), (154, 104), (128, 98), (100, 100), (72, 98)]
        for x, y, a, L, w in ((140, 44, 205, 30, 17), (150, 56, 232, 26, 15), (128, 36, 178, 22, 13)):
            spike(S, x, y, a, L, w, AMBER)
        S.shape(blob(cap, 0.5), STONE, shadow=5,
                decor=f'<path d="{blob([(50, 70), (62, 44), (90, 34), (84, 56), (62, 78)], 0.5)}" fill="#FFFFFF" opacity="0.28"/>'
                      + strokes("M 104 30 L 98 50 L 110 62 M 98 50 L 84 58", DSTONE, 3, 0.7)
                      + f'<path d="{ell(126, 78, 9, 6)}" fill="{DSTONE}" opacity="0.5"/>')
        S.shape(blob([(48, 94), (44, 78), (52, 62), (62, 66), (60, 78), (70, 84), (64, 98)], 0.7), MOSS, shadow=2)
        for s, part in ((-1, "arm-l"), (1, "arm-r")):
            S.group(part, PL if s < 0 else PR, "a fist in a glove of rock")
            x, y = 100 + s * 56, 150
            rock(S, x, y, 25, 20 if s > 0 else 70, n=8, shadow=3)
            S.raw(strokes(f"M {x - 11} {y + 3} L {x - 11} {y + 13} M {x} {y + 5} L {x} {y + 15} M {x + 11} {y + 3} L {x + 11} {y + 13}", DSTONE, 3.4, 0.75))
    else:
        HAIR = "#A8552E"
        S.group("back", (100, 100), "the ring of spikes")
        for i, a in enumerate(range(-100, 101, 25)):
            L = 54 if i % 2 == 0 else 44
            x, y = 100 + 52 * math.sin(math.radians(a)), 100 - 30 * math.cos(math.radians(a))
            spike(S, x, y, 180 + a * 0.92, L, 27)
        B, F = (186, 50), (150, 150)
        S.group("arm-r", PR, "the standing stone")
        a = ang(*B, *F)
        L = math.dist(B, F)
        T = frame(F[0], F[1], a)
        S.shape(poly([(-8, -L), (8, -L), (9, 26), (0, 42), (-9, 26)]), light(STONE, 1.04), T=T, shadow=0,
                decor=f'<path d="{poly([(-9, -L), (-1, -L), (-1, 40), (-9, 28)])}" fill="#FFFFFF" opacity="0.24"/>'
                      + strokes("M -3 2 L 3 6 L -3 10 M -3 16 L 3 16 M 0 16 L 0 26", AMBER, 3.2, 1))
        fist(S, *grip(B, F, (151, 141)), a)
        S.group("body")
        robe(S, "#6E8A4A", SAND, 8)
        S.shape(circ(100, 40, 19), HAIR, shadow=2, decor=hi(93, 32, 7, 4, 0.3))
        S.shape(rr(100, 40, 52, 6, 3), light(STONE, 1.05), shadow=1, T="rotate(-24 100 40)")
        S.shape(circ(100, 40, 12), light(HAIR, 1.08), shadow=1)
        head(S)
        mouth(S)
        S.shape(blob([(51, 108), (46, 78), (60, 52), (100, 42), (140, 52), (154, 78), (149, 108), (140, 92), (122, 84), (100, 90), (78, 84), (60, 92)], 0.85), HAIR, shadow=4,
                decor=strokes("M 100 46 L 100 86", shade(HAIR, 0.7), 3, 0.6) + hi(78, 58, 16, 8, 0.2, -20))
        free(S, "l")
        rock(S, 56, 168, 11.5, 50)
    return save("heroes", f"earthMage-{v}", S)


BUILD = {}
for _fn, _id, _vs in ((clockwork, "clockwork", ("watch", "sands", "windup")), (air_mage, "airMage", ("swirl", "fans", "gale")),
                      (warden, "warden", ("gaoler", "binder", "lock")), (telekinetic, "telekinetic", ("orbit", "blades", "boulder")),
                      (earth_mage, "earthMage", ("slab", "fists", "spikes"))):
    for _v in _vs:
        BUILD[f"{_id}-{_v}"] = (lambda fn=_fn, v=_v: fn(v))

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
