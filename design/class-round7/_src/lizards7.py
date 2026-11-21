"""Round 7 lizard family: the round-6 builds (lizards6.py) with only the round-8-log notes, each behind a switch in the
generator it touches, turned on here for the one design the note was on:
  lizardman-croc-a   E1r4 TEETH_IN    "bring teeth in, underneath head"
  lizardman-blade-a  E1r4 BLADE_R7    "remove eyes; shoulder doesn't look right nor do hands"
  dragonborn-a       E2r4 HORNS_R7    "horns look like they are floating"
  lizardman-blade-b  E3   CREST_R7    the note was on its "(before)" tile, the round-5 version: "use the selected base
  lizardman-spear-b                   lizard to fix up the spines on back and stuff; I like the hood looking bit" /
                                      "fix back spines": built from round 5 (E3/lizards.py), not round 6
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
        lz.BLADE_R7 = (name, v) == ("blade", "a")
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
sys.path.pop(0)
for m in ("lib", "others"):
    sys.modules.pop(m, None)

# blade b and spear b: the round-5 versions (the designer's notes were on their "(before)" tiles), with spear A's crest
sys.path.insert(0, str(HERE / "E3"))
import lib as l3
l3.OUT = OUT
import lizards as l5
l5.CREST_R7 = True
for fn, name in ((l5.lizard_blade, "blade"), (l5.lizard_spear, "spear")):
    S = fn("b")
    S.comment = S.comment.replace("(round 5)", "(round 5, version b, with the round-7 crest: the picked spear lizard's jagged "
                                  "crest down the back of the head and its dashed line down the tail)", 1)
    print(S.write(f"lizardman-{name}-b.svg").name)
