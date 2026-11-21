"""Round 7 lizard family: the round-6 builds (lizards6.py) with only the round-8-log notes, each behind a switch in the
generator it touches, turned on here for the one design the note was on:
  lizardman-croc-a   E1r4 TEETH_IN    "bring teeth in, underneath head"
  dragonborn-a       E2r4 HORNS_R7    "horns look like they are floating"
The other round-6 lizards and the dragonborn are rebuilt unchanged (prune7.py drops them).
python lizards7.py  -> ../enemies/*.svg   (paths relative to this file)
"""
import sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "enemies"

sys.path.insert(0, str(HERE / "E1r4"))
import lib as l1
l1.OUT = OUT
import lizards as lz
for v in ("a", "b"):
    lz.EYES, lz.FACE = False, v == "b"
    for fn, name in ((lz.liz_a, "spear"), (lz.liz_b, "blade"), (lz.liz_c, "croc")):
        lz.TEETH_IN = (name, v) == ("croc", "a")
        S = fn()
        S.comment = S.comment.replace("(round 4", f"(round 6, version {v}: the round-4 design " + (
            "without eyes" if v == "a" else "without eyes and with the heroes' face shading over the head") + "; was round 4", 1)
        print(S.write(f"lizardman-{name}-{v}.svg").name)
sys.path.pop(0)
for m in ("lib", "lizards"):
    sys.modules.pop(m, None)

sys.path.insert(0, str(HERE / "E2r4"))
import lib as l2
l2.OUT = OUT
import others as ot
for v in ("a", "b"):
    ot.RED, ot.EYES, ot.FACE = True, False, v == "b"
    ot.HORNS_R7 = v == "a"
    S = ot.dragonborn()
    S.comment = (S.comment.replace("Sapphire-blue scales", "Red scales (round 6: was sapphire-blue)")
                 .replace("(round 4)", f"(round 6, version {v}: the round-4 dragonborn in red, " + (
                     "without eyes" if v == "a" else "without eyes, with the heroes' face shading over the head") + ")", 1))
    print(S.write(f"dragonborn-{v}.svg").name)
