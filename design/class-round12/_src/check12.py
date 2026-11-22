"""Check the round-12 generators.
1. The round-5 and round-6 hero generators copied into this _src (A2/fighters5.py, A2/ranged6.py), called with no
   round-12 switch, still give the approved Valkyrie, Samurai and Trapper (art/heroes) byte for byte; and the three
   hand-drawn heroes that parts12.py edits as text (base/) are the approved files. So each new weapon hand is only what
   its switch or edit adds.
2. build12.py rebuilds the committed round-12 files (heroes/, props/, boards/) byte for byte.
3. game12.py's copies in art/ are the built files (with their one comment).
4. bounds12.py: no sprite is cut off by its 220 box.
The copies are built in design/_check12 (deleted afterwards). python check12.py   (paths relative to this file)"""
import sys, shutil, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R12 = HERE.parent
DESIGN = HERE.parents[1]
ROOT = HERE.parents[2]
TMP = DESIGN / "_check12"
KEEP = ("heroes", "props", "boards")
OLD = """
import sys, pathlib
sys.path.insert(0, sys.argv[1])
import fighters5 as f, ranged6 as r
for p in (f.valkyrie(), f.samurai(), r.trapper()):
    print(p)
"""
bad, n = [], 0
try:
    if TMP.exists():
        shutil.rmtree(TMP)
    src = TMP / "_src"
    shutil.copytree(HERE, src, ignore=shutil.ignore_patterns("__pycache__"))
    # 1. the copied generators, no switch
    out = subprocess.run([sys.executable, "-c", OLD, str(src / "A2")], check=True, capture_output=True, text=True, cwd=src / "A2").stdout
    for line, name in zip(out.split(), ("valkyrie", "samurai", "trapper")):
        n += 1
        if pathlib.Path(line).read_bytes() != (ROOT / "art" / "heroes" / f"{name}.svg").read_bytes():
            bad.append(f"[no switch] {name} is not art/heroes/{name}.svg")
    for name in ("bulwark", "bearskin", "warhelm"):
        n += 1
        if (HERE / "base" / f"{name}.svg").read_bytes() != (ROOT / "art" / "heroes" / f"{name}.svg").read_bytes():
            bad.append(f"[base] base/{name}.svg is not art/heroes/{name}.svg")
    for d in ("fighters", "ranged"):
        shutil.rmtree(TMP / d, ignore_errors=True)
    # 2. the whole folder
    subprocess.run([sys.executable, str(src / "build12.py")], check=True, capture_output=True, text=True)
    for d in KEEP:
        mine = {p.name for p in (R12 / d).glob("*.svg")}
        made = {p.name for p in (TMP / d).glob("*.svg")}
        for name in sorted(mine | made):
            n += 1
            a, b = R12 / d / name, TMP / d / name
            if not a.exists() or not b.exists() or a.read_bytes() != b.read_bytes():
                bad.append(f"[build] {d}/{name} differs from a fresh build")
    # 3. the copies in art/
    sys.path.insert(0, str(HERE))
    import game12
    for s, dst in game12.COPIES:
        n += 1
        a = ROOT / "art" / dst
        if not a.exists():
            bad.append(f"[art] art/{dst} is missing (run game12.py)")
            continue
        t = a.read_text(encoding="utf-8")
        i = t.index("<!-- GAME COPY")
        j = t.index("-->", i) + 3
        if t[:i - 1] + t[j:] != (R12 / "props" / s).read_text(encoding="utf-8"):
            bad.append(f"[art] art/{dst} is not props/{s}")
finally:
    shutil.rmtree(TMP, ignore_errors=True)
# 4. inside their boxes
import bounds12
files = sorted((R12 / "heroes").glob("*.svg")) + sorted((R12 / "props").glob("*.svg"))
bad += ["[box] " + b for b in bounds12.check(files)]
print("\n".join(bad) if bad else f"round 12: {n} files checked, all as they should be; {len(files)} sprites inside their boxes")
sys.exit(1 if bad else 0)
