"""Copy the round-6 enemies that are in the game into art/enemies (same names the game uses).
The goblin is the round-4 goblin (drawn at 0.72 inside the 220 box); its game copy is drawn at 0.875, so its shoulders
are as wide as the round-5 goblin's (56) and it fills the hit circle the game sizes for it (enemies.js headR 42)
without any code change. python game6.py   (paths relative to this file)"""
import sys, shutil, pathlib
HERE = pathlib.Path(__file__).resolve().parent
ART = HERE.parents[2] / "art" / "enemies"
EN = HERE.parent / "enemies"
for src, dst in (("greenskin-hobgoblin", "hobgoblin"), ("greenskin-orc", "orc"), ("greenskin-orc-shaman", "orc-shaman"),
                 ("greenskin-troll", "troll")):
    shutil.copyfile(EN / f"{src}.svg", ART / f"{dst}.svg")
    print(dst)
sys.path.insert(0, str(HERE / "E2r4"))
import lib
lib.OUT = ART
import greenskins as gs
gs.EYES = False
S = gs.goblin()
S.k = 0.875
S.comment = ("GOBLIN (round 6, game copy: the round-4 goblin with its eyes taken out, drawn at 0.875 inside the box so it "
             "fills the game's goblin hit circle; the design file is design/class-round6/enemies/greenskin-goblin.svg at "
             "0.72). Parts: #arm-r (dagger + fist, before #body), #body, #arm-l (empty claw). Facing = DOWN (+y).")
print(S.write("goblin.svg").name)
