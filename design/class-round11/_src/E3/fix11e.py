"""Round 11, the art-round10 notes on designs built with the E3 library. Each is a switch or argument of the copied
generator; with none they give the file the designer saw byte for byte (check11.py).
  greenskin-orc     "Pony tail layer problem. Try without hair tie" (ORC_R11)
  greenskin-troll   the pick: "B. Sharper jaw. Slightly longer head. No mouth. Long nose." with its arms (troll10 r11)
  frost-yeti        "Give dark nose again. Have it be taller then it is wide. Also make torso less sharp on the front"
  frost-icicle-wraith  "Fix hands then good" (WRAITH_R11)
  boss-goblin-chieftain  "Have them hold hands forwards more. Flip blades direction"
python fix11e.py [name ...]   -> ../../enemies/<name>.svg   (paths relative to this file)"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import lib
import critters as C
import greenskins as G

BUILD = {}


def orc11():
    G.ORC_R10 = G.ORC_R11 = True
    try:
        return G.orc()
    finally:
        G.ORC_R10 = G.ORC_R11 = False


BUILD["greenskin-orc"] = orc11
BUILD["greenskin-troll"] = lambda: G.troll10("b", True, r11=True)

import frost9e as F9
import frost10e as F10
import bosses9e as B9


def yeti11():
    F9.YETI_R10 = F9.YETI_R11 = True
    try:
        return F9.yeti9()
    finally:
        F9.YETI_R10 = F9.YETI_R11 = False


def wraith11():
    F10.WRAITH_R11 = True
    try:
        return F10.wraith10()
    finally:
        F10.WRAITH_R11 = False


BUILD["frost-yeti"] = yeti11
BUILD["frost-icicle-wraith"] = wraith11
BUILD["boss-goblin-chieftain"] = lambda: B9.chieftain9(r10=True, r11=True)

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        p = BUILD[n]().write(f"{n}.svg")
        print(p.relative_to(lib.OUT.parent).as_posix())
