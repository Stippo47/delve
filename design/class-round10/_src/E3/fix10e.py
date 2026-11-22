"""Round 10, the art-round8 notes on designs built with the E3 library: the ghosts' tails (3 types each), the orc (tusks
to the side, hair), the troll (heads, no-arms version). Each change is an argument of the copied round-8 generator
(critters.py, greenskins.py); with no argument they give the round-8 file byte for byte (check10.py).
python fix10e.py [name ...]   -> ../../enemies/<name>.svg   (paths relative to this file)"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import lib
import critters as C
import greenskins as G

BUILD = {}
for _t in "ab":
    for _tail in C.TAILS10:
        BUILD[f"ghost-{_t}-tail-{_tail}"] = (lambda t=_t, tail=_tail: C.ghost7(t, tail=tail))

def orc10():
    G.ORC_R10 = True
    try:
        return G.orc()
    finally:
        G.ORC_R10 = False


BUILD["greenskin-orc"] = orc10

for _h in "abc":
    BUILD[f"greenskin-troll-head-{_h}"] = (lambda h=_h: G.troll10(h, True))
    BUILD[f"greenskin-troll-hands-{_h}"] = (lambda h=_h: G.troll10(h, False))

# "Get new slime spite in": the picked slime, tail removed, in the game's blue; and the slimelet from it
BUILD["slime"] = lambda: C.slime("big", game="slime")
BUILD["slime-small"] = lambda: C.slime("big", game="small")

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        p = BUILD[n]().write(f"{n}.svg")
        print(p.relative_to(lib.OUT.parent).as_posix())
