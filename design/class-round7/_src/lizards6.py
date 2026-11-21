"""Round 6 lizard family, back to the round-4 designs the designer saw ("try without eyes, then one with shading like
humans over the face; do this with the other lizards and the dragonborn"; round 7: "it reverted a lot more than what
I had asked"). Builds from the round-4 generators copied unchanged into E1r4/ and E2r4/ (checked byte-identical):
  lizardman-spear-a/-b  = round-4 lizardman A spear      a: no eyes   b: no eyes + the heroes' face shading
  lizardman-blade-a/-b  = round-4 lizardman B desert blade
  lizardman-croc-a/-b   = round-4 lizardman C croc (round 5 dropped it; the round-6 note covered all the lizards)
  dragonborn-a/-b       = round-4 dragonborn, red ("should be red"), same a/b
python lizards6.py  -> ../enemies/*.svg   (paths relative to this file)
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
    S = ot.dragonborn()
    S.comment = (S.comment.replace("Sapphire-blue scales", "Red scales (round 6: was sapphire-blue)")
                 .replace("(round 4)", f"(round 6, version {v}: the round-4 dragonborn in red, " + (
                     "without eyes" if v == "a" else "without eyes, with the heroes' face shading over the head") + ")", 1))
    print(S.write(f"dragonborn-{v}.svg").name)
