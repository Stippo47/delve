"""Check the round-10 generators.
1. The round-8 and round-9 code copied into _src, called with no round-10 argument, still gives the files the designer
   saw, byte for byte: both ghosts, the orc, the troll, the chieftain, the croc (round 8), the three wolves, the ent, the
   Elder Ent, and whatever round-9 files BASE9 lists. So each round-10 fix is only what its argument or switch adds.
2. build10.py rebuilds the committed round-10 files (enemies/, props/, boards/) byte for byte.
The copies are built in design/_check10 (deleted afterwards). python check10.py   (paths relative to this file)"""
import sys, shutil, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R10 = HERE.parent
DESIGN = HERE.parents[1]
R8, R9, R7 = DESIGN / "class-round8", DESIGN / "class-round9", DESIGN / "class-round7"
TMP = DESIGN / "_check10"

E3_CODE = """
import sys, pathlib
sys.path.insert(0, sys.argv[1])
out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
import critters as c, greenskins as g
for t in "ab":
    (out / f"ghost-{t}.svg").write_text(c.ghost7(t).svg(), encoding="utf-8")
(out / "greenskin-orc.svg").write_text(g.orc().svg(), encoding="utf-8")
(out / "greenskin-troll.svg").write_text(g.troll8().svg(), encoding="utf-8")
(out / "greenskin-chieftain.svg").write_text(g.chieftain8().svg(), encoding="utf-8")
sys.path.insert(0, sys.argv[3])
import croc8
(out / "sewer-croc.svg").write_text(croc8.croc(), encoding="utf-8")
"""
A2_CODE = """
import sys
sys.path.insert(0, sys.argv[1])
import wild8 as w, grove8 as g
for n in ("wolf", "dire-wolf", "alpha"):
    w.wolf(n)
g.ent(); g.elder_ent()
"""

bad, n = [], 0
try:
    if TMP.exists():
        shutil.rmtree(TMP)
    src = TMP / "_src"
    shutil.copytree(HERE, src, ignore=shutil.ignore_patterns("__pycache__"))
    # 1. the copied generators, as they were
    subprocess.run([sys.executable, "-c", E3_CODE, str(src / "E3"), str(TMP / "base"), str(src)], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, "-c", A2_CODE, str(src / "A2")], check=True, stdout=subprocess.DEVNULL, cwd=src / "A2")
    refs = {TMP / "base" / f: R8 / "enemies" / f for f in ("ghost-a.svg", "ghost-b.svg", "greenskin-orc.svg", "greenskin-troll.svg",
                                                           "greenskin-chieftain.svg", "sewer-croc.svg")}
    refs.update({TMP / "enemies" / f"wild-{w}.svg": R8 / "enemies" / f"wild-{w}.svg" for w in ("wolf", "dire-wolf", "alpha", "ent", "elder-ent")})
    base9 = src / "base9.py"   # round-9 designs a round-10 fix starts from: base9.py writes them into TMP/base9
    if base9.exists():
        subprocess.run([sys.executable, str(base9), str(TMP / "base9")], check=True, stdout=subprocess.DEVNULL, cwd=src)
        for p in sorted((TMP / "base9").rglob("*.svg")):
            refs[p] = R9 / p.relative_to(TMP / "base9")
    for a, b in refs.items():
        n += 1
        if not a.exists() or a.read_bytes() != b.read_bytes():
            bad.append(f"[base] {a.name} differs from {b.relative_to(DESIGN).as_posix()}")
    for d in ("enemies", "props", "base", "base9"):
        shutil.rmtree(TMP / d, ignore_errors=True)
    # 2. build10.py -> the committed files
    subprocess.run([sys.executable, str(src / "build10.py")], check=True, stdout=subprocess.DEVNULL, cwd=src)
    keep = ("enemies", "props", "boards")
    built = {p.relative_to(TMP) for p in TMP.rglob("*.svg") if p.relative_to(TMP).parts[0] in keep}
    have = {p.relative_to(R10) for p in R10.rglob("*.svg") if p.relative_to(R10).parts[0] in keep}
    for rel in sorted(built | have):
        n += 1
        a, b = TMP / rel, R10 / rel
        if not a.exists():
            bad.append(f"[r10] {rel.as_posix()}: in design/class-round10 but build10.py doesn't make it")
        elif not b.exists() or a.read_bytes() != b.read_bytes():
            bad.append(f"[r10] {rel.as_posix()}: build10.py output differs from design/class-round10")
finally:
    shutil.rmtree(TMP, ignore_errors=True)
print(f"{n} files checked")
print("\n".join(bad) if bad else "all identical")
