"""Check the round-9 generators.
1. The round-8 code copied into _src (A2/lib.py, common.py, wild8.py; E3/lib.py, critters.py, greenskins.py) still gives
   the files the designer saw, byte for byte: the round-8 wolves, Ghost B, the troll and the chieftain, and the round-7
   bat. The round-9 designs built on those (the frost wolf and hellhound on the wolf, the icicle wraith on Ghost B, the
   yeti on the troll, the cinder bat on the bat, the Goblin Chieftain on the chieftain) start from exactly them.
2. build9.py rebuilds the committed round-9 files (enemies/, props/) byte for byte.
The copies are built in design/_check9 (deleted afterwards). python check9.py   (paths relative to this file)"""
import sys, shutil, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R9 = HERE.parent
DESIGN = HERE.parents[1]
R8, R7 = DESIGN / "class-round8", DESIGN / "class-round7"
TMP = DESIGN / "_check9"

bad, n = [], 0
try:
    if TMP.exists():
        shutil.rmtree(TMP)
    src = TMP / "_src"
    shutil.copytree(HERE, src, ignore=shutil.ignore_patterns("__pycache__"))
    # 1. the copied round-8 generators
    subprocess.run([sys.executable, str(src / "A2" / "wild8.py")], check=True, stdout=subprocess.DEVNULL, cwd=src / "A2")
    subprocess.run([sys.executable, "-c", """
import sys, pathlib
sys.path.insert(0, sys.argv[1])
out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
import critters as c, greenskins as g
(out / "ghost-b.svg").write_text(c.ghost7("b").svg(), encoding="utf-8")
(out / "bat.svg").write_text(c.bat().svg(), encoding="utf-8")
(out / "greenskin-troll.svg").write_text(g.troll8().svg(), encoding="utf-8")
(out / "greenskin-chieftain.svg").write_text(g.chieftain8().svg(), encoding="utf-8")
""", str(src / "E3"), str(TMP / "r8")], check=True)
    refs = {TMP / "enemies" / f"wild-{w}.svg": R8 / "enemies" / f"wild-{w}.svg" for w in ("wolf", "dire-wolf", "alpha")}
    refs.update({TMP / "r8" / "ghost-b.svg": R8 / "enemies" / "ghost-b.svg", TMP / "r8" / "bat.svg": R7 / "enemies" / "bat.svg",
                 TMP / "r8" / "greenskin-troll.svg": R8 / "enemies" / "greenskin-troll.svg",
                 TMP / "r8" / "greenskin-chieftain.svg": R8 / "enemies" / "greenskin-chieftain.svg"})
    for a, b in refs.items():
        n += 1
        if not a.exists() or a.read_bytes() != b.read_bytes():
            bad.append(f"[base] {a.name} differs from {b.relative_to(DESIGN).as_posix()}")
    for p in (TMP / "enemies").glob("wild-*.svg"):
        p.unlink()
    shutil.rmtree(TMP / "r8")
    # 2. build9.py -> the committed files
    subprocess.run([sys.executable, str(src / "build9.py")], check=True, stdout=subprocess.DEVNULL, cwd=src)
    built = {p.relative_to(TMP) for p in TMP.rglob("*.svg") if p.relative_to(TMP).parts[0] in ("enemies", "props")}
    have = {p.relative_to(R9) for p in R9.rglob("*.svg") if p.relative_to(R9).parts[0] in ("enemies", "props")}
    for rel in sorted(built | have):
        n += 1
        a, b = TMP / rel, R9 / rel
        if not a.exists():
            bad.append(f"[r9] {rel.as_posix()}: in design/class-round9 but build9.py doesn't make it")
        elif not b.exists() or a.read_bytes() != b.read_bytes():
            bad.append(f"[r9] {rel.as_posix()}: build9.py output differs from design/class-round9")
finally:
    shutil.rmtree(TMP, ignore_errors=True)
print(f"{n} files checked")
print("\n".join(bad) if bad else "all identical")
