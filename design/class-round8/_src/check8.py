"""Check the round-8 generators against the files the designer saw.
1. A copy of this _src with every round-8 switch turned off (*_R8) must give the round-7 orc and ghosts and the round-6
   troll (the "(before)" tile the troll note was on; also the game's art/enemies/troll.svg) byte for byte, so each
   round-8 change is only what its switch adds.
2. build8.py must rebuild the committed round-8 files byte for byte.
The copies are built in design/_check8 (deleted afterwards). python check8.py   (paths relative to this file)"""
import re, sys, shutil, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R8 = HERE.parent
DESIGN = HERE.parents[1]
R7, R6 = DESIGN / "class-round7", DESIGN / "class-round6"
TMP = DESIGN / "_check8"
SWITCH = re.compile(r"^(\w+_R8) = .*$", re.M)


def copy_src(off):
    if TMP.exists():
        shutil.rmtree(TMP)
    src = TMP / "_src"
    shutil.copytree(HERE, src, ignore=shutil.ignore_patterns("__pycache__"))
    found = set()
    if off:
        for p in src.rglob("*.py"):
            t = p.read_text(encoding="utf-8")
            found |= set(SWITCH.findall(t))
            p.write_text(SWITCH.sub(lambda m: f"{m.group(1)} = False", t), encoding="utf-8")
    return src, found


bad, n = [], 0
try:
    src, found = copy_src(True)
    need = {"ORC_R8", "GHOST_R8", "TROLL_R8"}
    if need - found:
        bad.append(f"switches not found: {sorted(need - found)}")
    out = TMP / "off"
    out.mkdir()
    subprocess.run([sys.executable, "-c", """
import sys, pathlib
sys.path.insert(0, sys.argv[1])
out = pathlib.Path(sys.argv[2])
import greenskins as g, critters as c
(out / "greenskin-orc.svg").write_text(g.orc().svg(), encoding="utf-8")
(out / "greenskin-troll.svg").write_text(g.troll().svg(), encoding="utf-8")
for t in "ab":
    (out / f"ghost-{t}.svg").write_text(c.ghost7(t).svg(), encoding="utf-8")
""", str(src / "E3"), str(out)], check=True, stdout=subprocess.DEVNULL)
    refs = {"greenskin-orc.svg": R7 / "enemies/greenskin-orc.svg", "ghost-a.svg": R7 / "enemies/ghost-a.svg",
            "ghost-b.svg": R7 / "enemies/ghost-b.svg", "greenskin-troll.svg": R6 / "enemies/greenskin-troll.svg"}
    for name, ref in refs.items():
        n += 1
        if (out / name).read_bytes() != ref.read_bytes():
            bad.append(f"[off] {name} differs from {ref.relative_to(DESIGN).as_posix()}")
    n += 1
    if (R6 / "enemies/greenskin-troll.svg").read_bytes() != (HERE.parents[2] / "art/enemies/troll.svg").read_bytes():
        bad.append("[off] the round-6 troll is not the game's art/enemies/troll.svg")
    # 2. build8.py -> the committed files
    src, _ = copy_src(False)
    subprocess.run([sys.executable, str(src / "build8.py")], check=True, stdout=subprocess.DEVNULL, cwd=src)
    for p in sorted(TMP.rglob("*.svg")):
        rel = p.relative_to(TMP)
        if rel.parts[0] in ("_src", "off"):
            continue
        n += 1
        q = R8 / rel
        if not q.exists() or q.read_bytes() != p.read_bytes():
            bad.append(f"[r8] {rel.as_posix()}: build8.py output differs from design/class-round8")
finally:
    shutil.rmtree(TMP, ignore_errors=True)
print(f"{n} files checked")
print("\n".join(bad) if bad else "all identical")
