"""Round 10, the art-round9 notes on the Clockwork Foundry (the card was REDO; ticked: the storm spirit, the gun turret):
  the bee, wasp, hornet  "U are losing the style. Too many segments. 1 maybe 2 body segments. Not 3.": drawn again: the bee
                         one plump body, the wasp and the hornet a head and one abdomen; one plate wing a side.
  the gear and cog       "Cogs weren't horrible but also weren't very interesting/ could be done better": drawn again with
                         more to them: spokes round a glowing heart, a brass tooth; a brass wheel under a steel pinion.
  the gun turret         "Almost good. Turret part shoukd be in the wall more. Circle half way in. Could add more detail/
                         parts.": foundry9.turret_gun(r10=True): the same dome and barrels in a bulkhead, more parts.
  the steam turret       "Meh. Not horrible": drawn again as a copper boiler with a flared brass nozzle.
python foundry10.py [name ...]   -> ../../enemies/foundry-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *
import foundry9 as F9
from foundry9 import IRON, DIRON, STEELC, COPPER, DCOPPER, BRASS_C, HAZARD, cog_path, rivets, ring_pts, floor_base

BANDC, WINGC = "#3A3434", "#DDE4EC"


# ================================================================== bee, wasp, hornet
def wing(S, s, root, a, L, w):
    """One wing of thin pale plate, a single rounded shape with one rib."""
    T = frame(100 + s * root[0], root[1], s * a)
    S.shape(blob([(0, -4), (w * 0.8, L * 0.2), (w, L * 0.6), (w * 0.5, L * 0.95), (0, L), (-w * 0.55, L * 0.9), (-w * 0.9, L * 0.55),
                  (-w * 0.7, L * 0.18)], 0.9), WINGC, T=T, shadow=0, side=False,
            decor=f'<path d="M 0 {f(L * 0.1)} L 0 {f(L * 0.86)}" stroke="#A8B2BE" stroke-width="3" stroke-linecap="round" opacity="0.8"/>')


def stripes(ys, x0, x1, bow, w):
    return strokes(" ".join(f"M {x0} {y} Q 100 {y - bow} {x1} {y}" for y in ys), BANDC, w, 1)


def insect(kind):
    name = {"bee": "BEE", "wasp": "WASP", "hornet": "HORNET"}[kind]
    what = {"bee": "one plump round body, striped with two dark iron bands, a short stinger at the back, the front end a "
                   "little darker for a head with two short feelers",
            "wasp": "two parts: a small round head with two feelers, and one long abdomen tapering to a long iron stinger, "
                    "striped with three bands",
            "hornet": "two parts: a broad head with two iron mandibles, and one fat abdomen with three bands and a heavy "
                      "stinger"}[kind]
    S = Sprite(f"{name} (round 10: \"1 maybe 2 body segments. Not 3\"): a mechanical {kind} seen from above, in copper: "
               f"{what}; one wing of thin pale plate a side (arm-l, arm-r: they flap). The bronze and steel ones are this "
               f"art turned by the game. No eyes. Parts: #arm-l / #arm-r (wings), #body. " + LAYOUT)
    if kind == "bee":
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 16, 104), "wing")
            wing(S, s, (16, 104), -118, 70, 22)
        S.group("body")
        S.shape(poly([(92, 48), (108, 48), (100, 24)]), DIRON, shadow=0)                       # the stinger
        for s in (-1, 1):                                                                       # feelers
            S.shape(band([(100 + s * 10, 150), (100 + s * 16, 166), (100 + s * 26, 174)], 3.2), DIRON, shadow=0)
        S.shape(ell(100, 100, 40, 54), COPPER, shadow=0,
                decor=stripes((78, 104), 56, 144, 9, 12) + f'<path d="M 50 128 Q 100 118 150 128 L 150 170 L 50 170 Z" fill="{DCOPPER}"/>'
                      + f'<path d="{ell(84, 66, 11, 16)}" fill="#FFFFFF" opacity="0.28"/>')
    elif kind == "wasp":
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 12, 112), "wing")
            wing(S, s, (12, 112), -128, 80, 17)
        S.group("body")
        S.shape(poly([(95, 34), (105, 34), (100, 0)]), DIRON, shadow=0)                        # a long stinger
        S.shape(blob([(100, 26), (116, 44), (124, 74), (120, 104), (100, 122), (80, 104), (76, 74), (84, 44)], 0.9), COPPER, shadow=0,
                decor=stripes((54, 76, 98), 70, 130, 7, 9) + f'<path d="{ell(90, 60, 7, 16)}" fill="#FFFFFF" opacity="0.28"/>')
        for s in (-1, 1):
            S.shape(band([(100 + s * 10, 158), (100 + s * 16, 174), (100 + s * 26, 182)], 3.2), DIRON, shadow=0)
        S.shape(circ(100, 140, 24), DCOPPER, shadow=4, decor=f'<path d="{ell(92, 132, 8, 5)}" fill="#FFFFFF" opacity="0.25"/>')
    else:
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 16, 108), "wing")
            wing(S, s, (16, 108), -116, 78, 25)
        S.group("body")
        S.shape(poly([(91, 36), (109, 36), (100, 6)]), DIRON, shadow=0)
        S.shape(ell(100, 82, 44, 52), COPPER, shadow=0,
                decor=stripes((58, 82, 106), 52, 148, 9, 11) + f'<path d="{ell(82, 54, 12, 16)}" fill="#FFFFFF" opacity="0.28"/>')
        for s in (-1, 1):                                                                       # mandibles
            S.shape(blob([(100 + s * 8, 164), (100 + s * 20, 166), (100 + s * 22, 182), (100 + s * 10, 194), (100 + s * 9, 180)], 0.8), DIRON, shadow=0)
        S.shape(ell(100, 144, 33, 27), DCOPPER, shadow=4, decor=f'<path d="{ell(88, 134, 11, 6)}" fill="#FFFFFF" opacity="0.25"/>')
    return save("enemies", f"foundry-{kind}", S)


# ================================================================== the gear and the cog
GLOW = ('<radialGradient id="gCore" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF6C0"/>'
        '<stop offset="0.55" stop-color="#FFB84A"/><stop offset="1" stop-color="#E8702A"/></radialGradient>')


def gear_sprite():
    S = Sprite("GEAR SPRITE (round 10): a rolling cog seen from straight above (\"top down so u see it as a circle\"), with "
               "more to it: a steel cog with ten bevelled teeth, one of them capped in brass (so its spin shows), a dark "
               "inner rim, five curved spokes with windows between them round a glowing amber heart in a brass collar. No "
               "face. It spins as it rolls. Parts: #body only. " + LAYOUT)
    S.add_def(GLOW)
    S.group("body")
    win = ""
    for i in range(5):
        a0 = i * 72 + 14
        pts = [(100 + r * math.sin(math.radians(a)), 100 - r * math.cos(math.radians(a))) for r, a in
               ((26, a0), (26, a0 + 28), (48, a0 + 52), (48, a0 + 12))]
        win += f'<path d="{blob(pts, 0.8)}" fill="#2E3038"/>'
    S.shape(cog_path(100, 100, 76, 60, 10), STEELC, shadow=0,
            decor=f'<path d="{cog_path(100, 100, 76, 60, 10, tip=0.2)}" fill="#FFFFFF" opacity="0.18"/>'
                  + f'<path d="{circ(100, 100, 55)}" fill="{IRON}"/>' + f'<path d="{circ(100, 100, 50)}" fill="{STEELC}"/>' + win
                  + f'<path d="{ell(74, 62, 18, 9)}" fill="#FFFFFF" opacity="0.3" transform="rotate(-30 74 62)"/>')
    tooth = [(100 + r * math.sin(math.radians(a)), 100 - r * math.cos(math.radians(a))) for r, a in ((60, -13), (77, -8), (77, 8), (60, 13))]
    S.shape(poly(tooth), BRASS_C, shadow=0)
    S.shape(circ(100, 100, 21), BRASS_C, shadow=3)
    S.shape(circ(100, 100, 13), fill="url(#gCore)", shadow=0, side=False, decor='<circle cx="96" cy="96" r="4" fill="#FFFFFF" opacity="0.7"/>')
    return save("enemies", "foundry-gear-sprite", S)


def cog_sprite():
    S = Sprite("COG SPRITE (round 10): the gear sprite's brass cousin, a different wheel: a broad brass crown wheel with "
               "eight blunt teeth and four crescent windows round a cross of spokes, and riding on its middle a small "
               "steel pinion of six teeth with a red jewel bearing. Seen from straight above, it spins as it rolls. No "
               "face. Parts: #body only. " + LAYOUT)
    S.group("body")
    win = ""
    for i in range(4):
        a0 = i * 90 + 45
        pts = [(100 + r * math.sin(math.radians(a)), 100 - r * math.cos(math.radians(a))) for r, a in
               ((30, a0 - 26), (48, a0 - 30), (50, a0), (48, a0 + 30), (30, a0 + 26), (34, a0))]
        win += f'<path d="{blob(pts, 0.8)}" fill="#6A4A1E"/>'
    S.shape(cog_path(100, 100, 76, 56, 8, tip=0.5, a0=22.5), "#D8A24A", shadow=0,
            decor=f'<path d="{circ(100, 100, 54)}" fill="none" stroke="#A8762A" stroke-width="4" opacity="0.7"/>' + win
                  + rivets(ring_pts(100, 100, 61, 8, 22.5), 3, "#8A6A2A")
                  + f'<path d="{ell(74, 62, 18, 9)}" fill="#FFF6D0" opacity="0.4" transform="rotate(-30 74 62)"/>')
    S.shape(cog_path(100, 100, 30, 21, 6, tip=0.45), STEELC, shadow=4)
    S.shape(circ(100, 100, 10), "#D8463F", shadow=2, decor='<circle cx="97" cy="97" r="3.2" fill="#FFFFFF" opacity="0.75"/>')
    return save("enemies", "foundry-cog-sprite", S)


# ================================================================== the steam turret
def turret_steam():
    S = Sprite("STEAM TURRET (round 10): a floor turret seen from above, drawn again as a boiler: the riveted base plate "
               "that stays still (#back), and on it a round copper boiler that turns, bound with two brass straps, a "
               "short neck and a flared brass nozzle like a horn's bell with a dark mouth, a pressure gauge on top, a red valve "
               "wheel on a pipe at its side, a little relief valve at the back with a puff of steam. Parts: #back (the base), #body "
               "(boiler and nozzle). " + LAYOUT)
    floor_base(S)
    S.group("body")
    S.shape(rr(100, 148, 30, 44, 8), DCOPPER, shadow=0)
    bell = [(-17, 150), (17, 150), (30, 172), (32, 186), (-32, 186), (-30, 172)]
    S.shape(blob([(100 + x, y) for x, y in bell], 0.55), BRASS_C, shadow=3,
            decor=f'<path d="{ell(100, 186, 25, 7)}" fill="#3A2A1E"/>' + strokes("M 80 168 L 120 168", "#A8762A", 3, 0.7))
    S.shape(blob([(86, 44), (92, 30), (100, 26), (108, 30), (114, 44), (100, 50)], 0.9), "#F4F6FA", shadow=0, side=False)   # a puff of steam
    S.shape(rr(100, 52, 16, 16, 5), BRASS_C, shadow=0)
    S.shape(circ(100, 100, 52), COPPER, shadow=3,
            decor=strokes("M 50 84 Q 100 70 150 84 M 50 122 Q 100 136 150 122", BRASS_C, 9, 1)
                  + rivets([(60, 80), (80, 74), (120, 74), (140, 80), (60, 126), (80, 132), (120, 132), (140, 126)], 2.6, "#8A6A2A")
                  + f'<path d="{ell(80, 70, 20, 10)}" fill="#FFFFFF" opacity="0.25" transform="rotate(-24 80 70)"/>')
    S.shape(circ(100, 100, 17), "#F2EEE4", shadow=2, decor=strokes("M 100 100 L 110 92", "#C8402A", 3.5, 1)
            + "".join(f'<path d="M {f(100 + 11 * math.sin(math.radians(a)))} {f(100 - 11 * math.cos(math.radians(a)))} L {f(100 + 14 * math.sin(math.radians(a)))} {f(100 - 14 * math.cos(math.radians(a)))}" stroke="#6E6A60" stroke-width="2"/>' for a in range(-120, 121, 40))
            + f'<path d="{circ(100, 100, 17)}" fill="none" stroke="{BRASS_C}" stroke-width="5"/>')
    S.shape(rr(142, 70, 9, 26, 4), DCOPPER, T="rotate(40 142 70)", shadow=2)        # a pipe up the side to the valve wheel
    wheel = circ(150, 60, 12) + " " + circ(150, 60, 6.5)
    S.shape(wheel, "#C8402A", shadow=2, rule="evenodd", decor=strokes("M 138 60 L 162 60 M 150 48 L 150 72", "#8E2A1E", 3, 0.9))
    return save("enemies", "foundry-turret-steam", S)


BUILD = {"foundry-bee": lambda: insect("bee"), "foundry-wasp": lambda: insect("wasp"), "foundry-hornet": lambda: insect("hornet"),
         "foundry-gear-sprite": gear_sprite, "foundry-cog-sprite": cog_sprite,
         "foundry-turret-gun": lambda: F9.turret_gun(r10=True), "foundry-turret-steam": turret_steam}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
