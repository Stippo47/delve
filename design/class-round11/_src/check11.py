"""Check the round-11 generators.
1. The round-8, round-9 and round-10 code copied into this _src, called with no round-11 switch or argument, still gives
   the files the designer saw, byte for byte: check10's base files (round 8), base9.py's (round 9), and build10.py's
   whole folder (round 10: enemies/, props/, boards/). So each round-11 fix is only what its switch adds.
2. build11.py rebuilds the committed round-11 files (enemies/, props/, boards/, heroes/) byte for byte.
The copies are built in design/_check11 (deleted afterwards). python check11.py   (paths relative to this file)"""
import sys, shutil, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R11 = HERE.parent
DESIGN = HERE.parents[1]
R8, R9, R10 = DESIGN / "class-round8", DESIGN / "class-round9", DESIGN / "class-round10"
TMP = DESIGN / "_check11"
KEEP = ("enemies", "props", "boards", "heroes")

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
g.ent(); g.elder_ent(); g.sproutling()
"""

bad, n = [], 0


def compare(refs, tag):
    global n
    for a, b in refs.items():
        n += 1
        if not a.exists() or not b.exists() or a.read_bytes() != b.read_bytes():
            bad.append(f"[{tag}] {a.name} differs from {b.relative_to(DESIGN).as_posix()}")


def clear():
    for d in KEEP + ("base", "base9"):
        shutil.rmtree(TMP / d, ignore_errors=True)


try:
    if TMP.exists():
        shutil.rmtree(TMP)
    src = TMP / "_src"
    shutil.copytree(HERE, src, ignore=shutil.ignore_patterns("__pycache__"))
    # 1a. round 8
    subprocess.run([sys.executable, "-c", E3_CODE, str(src / "E3"), str(TMP / "base"), str(src)], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, "-c", A2_CODE, str(src / "A2")], check=True, stdout=subprocess.DEVNULL, cwd=src / "A2")
    refs = {TMP / "base" / f: R8 / "enemies" / f for f in ("ghost-a.svg", "ghost-b.svg", "greenskin-orc.svg", "greenskin-troll.svg",
                                                           "greenskin-chieftain.svg", "sewer-croc.svg")}
    refs.update({TMP / "enemies" / f"wild-{w}.svg": R8 / "enemies" / f"wild-{w}.svg"
                 for w in ("wolf", "dire-wolf", "alpha", "ent", "elder-ent", "sproutling")})
    compare(refs, "round 8")
    # the first round-10 mummy (the one on the art-round10 deck; the second pass replaced it in design/class-round10):
    # mummy1() against the copy of that file kept in _src/base (text: the copy came out of git with other line ends)
    n += 1
    made = subprocess.run([sys.executable, "-c", "import sys; sys.path.insert(0, sys.argv[1]); import common, dunes10 as D; "
                           "common.SAVE_AS = 'zz-take1'; print(D.mummy1().read_text(encoding='utf-8'), end='')", str(src / "A2")],
                          check=True, capture_output=True, text=True, encoding="utf-8", cwd=src / "A2").stdout
    if made.split() != (HERE / "base" / "dunes-mummy-take1.svg").read_text(encoding="utf-8").split():
        bad.append("[round 10, first take] dunes10.mummy1() differs from _src/base/dunes-mummy-take1.svg")
    clear()
    # 1b. round 9
    subprocess.run([sys.executable, str(src / "base9.py"), str(TMP / "base9")], check=True, stdout=subprocess.DEVNULL, cwd=src)
    compare({p: R9 / p.relative_to(TMP / "base9") for p in sorted((TMP / "base9").rglob("*.svg"))}, "round 9")
    clear()
    # 1c. round 10: the whole folder
    subprocess.run([sys.executable, str(src / "build10.py")], check=True, stdout=subprocess.DEVNULL, cwd=src)
    built = {p.relative_to(TMP) for p in TMP.rglob("*.svg") if p.relative_to(TMP).parts[0] in KEEP}
    have = {p.relative_to(R10) for p in R10.rglob("*.svg") if p.relative_to(R10).parts[0] in KEEP}
    for rel in sorted(built | have):
        n += 1
        a, b = TMP / rel, R10 / rel
        if not a.exists() or not b.exists() or a.read_bytes() != b.read_bytes():
            bad.append(f"[round 10] {rel.as_posix()}: the copied generators no longer give design/class-round10's file")
    clear()
    # 2. build11.py -> the committed files
    subprocess.run([sys.executable, str(src / "build11.py")], check=True, stdout=subprocess.DEVNULL, cwd=src)
    built = {p.relative_to(TMP) for p in TMP.rglob("*.svg") if p.relative_to(TMP).parts[0] in KEEP}
    have = {p.relative_to(R11) for p in R11.rglob("*.svg") if p.relative_to(R11).parts[0] in KEEP}
    for rel in sorted(built | have):
        n += 1
        a, b = TMP / rel, R11 / rel
        if not a.exists():
            bad.append(f"[round 11] {rel.as_posix()}: in design/class-round11 but build11.py doesn't make it")
        elif not b.exists() or a.read_bytes() != b.read_bytes():
            bad.append(f"[round 11] {rel.as_posix()}: build11.py output differs from design/class-round11")
finally:
    shutil.rmtree(TMP, ignore_errors=True)
print(f"{n} files checked")
print("\n".join(bad) if bad else "all identical")
