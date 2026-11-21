"""Build every round-8 design into design/class-round8/<folder>/.
Part 1 (the art-round7 notes) comes from copies of the round-7 generators (E3/greenskins.py, E3/critters.py, lib.py),
each change behind a switch named *_R8 with the note quoted; check8.py turns them off and checks the copies still give
the round-7 (and round-6) files byte for byte. Part 2 (real art for the kinds that went in on placeholders) is new:
E3/wild8.py (the Wildwood), E3/sewer8.py (the Sewers). Boards that show a design with something the game draws apart
(the troll's boulder) or at the game's scale are made here too (compose.py), into <folder>/boards/.
python build8.py [name ...]    (paths relative to this file)"""
import sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "E3"))
sys.path.insert(0, str(HERE))
import lib
import greenskins as G
import critters as C
from compose import compose

R8 = HERE.parent
ENEMIES = R8 / "enemies"
BOARDS = R8 / "boards"

# the game's numbers each board is drawn with (js/*.js defs): r, vr, headR; FEEL.collider = 1.1 (js/units.js)
FEEL_R = 1.1
ARCHER = {"vr": 22, "headR": 56}


def write(S, name, folder=ENEMIES):
    folder.mkdir(parents=True, exist_ok=True)
    p = folder / name
    p.write_text(S.svg(), encoding="utf-8")
    return p


def troll_with_boulder(r=60, vr=44, headR=66, hold=-0.46):
    """The troll and its boulder as the game places them (js/foes9.js boulderOf: the boulder's r is 0.62 of the troll's
    collider; it sits u.r + b.r + hold * u.r + 8 ahead of the troll's centre), in the troll's own SVG units."""
    ur = r * FEEL_R
    br = round(ur * 0.62)
    k = vr / headR                       # room units per SVG unit
    ahead = (ur + br + hold * ur + 8) / k  # boulder centre, SVG units ahead of (100,100)
    box = 86.4 * br / 30 / k             # the boulder prop's 220 box, in troll SVG units
    s = box / 220
    troll = (ENEMIES / "greenskin-troll.svg").read_text(encoding="utf-8")
    rock = (R8 / "props" / "troll-boulder.svg").read_text(encoding="utf-8")
    cy = 100 + ahead
    tf_rock = f"translate({100 - 100 * s:.2f} {cy - 100 * s:.2f}) scale({s:.4f})"
    return troll, rock, tf_rock, cy + 74 * s


def build(want=()):
    def on(name):
        return not want or name in want
    made = []
    if on("greenskin-orc"):
        made.append(write(G.orc(), "greenskin-orc.svg"))
    if on("ghost-a") or on("ghost-b"):
        for t in "ab":
            made.append(write(C.ghost7(t), f"ghost-{t}.svg"))
    if on("greenskin-chieftain"):
        made.append(write(G.chieftain8(), "greenskin-chieftain.svg"))
    if on("greenskin-troll"):
        made.append(write(G.troll8(), "greenskin-troll.svg"))
        made.append(write(G.boulder(), "troll-boulder.svg", R8 / "props"))
        troll, rock, tf_rock, bottom = troll_with_boulder()
        # the board: troll and boulder together, scaled to fit the box (the in-game scale is the scale board's job)
        top = 20
        fit = 220 / (bottom + 8 - top)
        tf = f"translate({100 - 100 * fit:.2f} {-10 - top * fit:.2f}) scale({fit:.4f})"
        # the game draws obstacles (the boulder) before the units, so the troll's fists lie over the boulder
        both = compose([(rock, f"{tf} {tf_rock}"), (troll, tf)],
                       "TROLL (round 8) with its boulder in front, placed as the game places it (js/foes9.js); the two "
                       "are drawn apart in the game. For the board only.")
        BOARDS.mkdir(parents=True, exist_ok=True)
        (BOARDS / "greenskin-troll-boulder.svg").write_text(both, encoding="utf-8")
        made.append(BOARDS / "greenskin-troll-boulder.svg")
    return made


if __name__ == "__main__":
    for p in build(set(sys.argv[1:])):
        print(p.relative_to(R8).as_posix())
