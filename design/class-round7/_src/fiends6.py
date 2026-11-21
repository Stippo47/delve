"""Round 6: the goblin, imp and devil back on their round-4 designs, with only the round-6 notes applied
("goblin: no eyes", "imp: no eyes", "devil: no eyes, tail back"). Round 5 had replaced them with new designs
instead (the same thing the designer flagged on the lizards: "reverted a lot more than what I had asked").
Builds from the round-4 generators copied unchanged into E2r4/ (checked byte-identical).
python fiends6.py  -> ../enemies/greenskin-goblin.svg, fiend-imp.svg, fiend-devil.svg   (paths relative to this file)"""
import sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "enemies"
sys.path.insert(0, str(HERE / "E2r4"))
import lib
lib.OUT = OUT
import greenskins as gs, fiends as fd

gs.EYES = False
S = gs.goblin()
S.comment = S.comment.replace("GOBLIN (round 4 greenskin)", "GOBLIN (round 6: the round-4 goblin, eyes taken out)").replace(", big yellow eyes", "")
print(S.write("greenskin-goblin.svg").name)
fd.EYES, fd.TAIL_BACK = False, True
S = fd.imp()
S.comment = S.comment.replace("IMP (round 4 fiend)", "IMP (round 6: the round-4 imp, eyes taken out)").replace(", big yellow '\n               'eyes", "").replace(" big yellow eyes,", "")
print(S.write("fiend-imp.svg").name)
S = fd.devil()
S.comment = (S.comment.replace("DEVIL (round 4 fiend)", "DEVIL (round 6: the round-4 devil, eyes taken out, tail straight back)")
             .replace(", yellow eyes", "").replace("a long tail with an arrowhead tip", "a long tail with an arrowhead tip running straight back"))
print(S.write("fiend-devil.svg").name)
