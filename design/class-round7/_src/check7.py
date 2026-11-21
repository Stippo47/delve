"""Check the round-7 generators against the files the designer saw.
1. A copy of this _src with every round-7 switch turned off (*_R7, TEETH_IN, BLADE_R7, CREST_R7, HORNS_R7, BEARD) must
   rebuild every round-6 design byte for byte (round 5's file where round 6 left a design alone), so each round-7
   change is only what its switch adds.
2. The E3 generators with their round-6 switches off as well must rebuild the round-5 enemies byte for byte (five of
   the round-7 notes were on round-5 "(before)" tiles and start from those).
3. build7.py must rebuild the committed round-7 files byte for byte.
The copies are built in design/_check7 (deleted afterwards). python check7.py   (paths relative to this file)"""
import re, sys, shutil, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R7 = HERE.parent
DESIGN = HERE.parents[1]
R6, R5 = DESIGN / "class-round6", DESIGN / "class-round5"
TMP = DESIGN / "_check7"
FOLDERS = ("ranged", "fighters", "heroes-casters", "heroes-support", "enemies")
SWITCH = re.compile(r"^(\w+_R7|TEETH_IN|BLADE_R7|CREST_R7|HORNS_R7|BEARD) = .*$", re.M)


def copy_src(r7_off):
    if TMP.exists():
        shutil.rmtree(TMP)
    src = TMP / "_src"
    shutil.copytree(HERE, src, ignore=shutil.ignore_patterns("__pycache__"))
    found = set()
    if r7_off:
        for p in src.rglob("*.py"):
            t = p.read_text(encoding="utf-8")
            found |= set(SWITCH.findall(t))
            p.write_text(SWITCH.sub(lambda m: f"{m.group(1)} = False", t), encoding="utf-8")
    return src, found


def run(src, *args):
    subprocess.run([sys.executable, *args], check=True, stdout=subprocess.DEVNULL, cwd=src)


def round6_build(src):
    run(src, "-c", "import sys; sys.path.insert(0, sys.argv[1]); import ranged as r; r.TRAPPER_R6 = 'right'; "
        "p = r.trapper(); p.replace(p.with_name('ranged-trapper-right.svg'))", str(src / "A2"))
    for s in ("A2/ranged.py", "A2/fighters.py", "A2/crew.py", "casters/casters5.py", "support/support5.py",
              "E3/critters.py", "E3/greenskins.py", "E3/fiends.py", "E3/lizards.py", "E3/angel.py"):
        run(src, str(src / s))
    run(src, str(src / "lizards6.py"))
    run(src, str(src / "fiends6.py"))


def ref(folder, name):
    for r in (R6, R5):
        if (r / folder / name).exists():
            return r / folder / name
    return None


bad, n = [], 0
try:
    # 1. round-7 switches off -> round 6
    src, found = copy_src(True)
    need = {"MARKSMAN_R7", "GLADIATOR_R7", "WWH_R7", "WOLF_R7", "SNOWMAN_R7", "BAT_R7", "GHOST_R7", "OGRE_R7", "ORC_R7",
            "TROLL_R7", "TEETH_IN", "BLADE_R7", "CREST_R7", "HORNS_R7", "BEARD"}
    if need - found:
        bad.append(f"switches not found: {sorted(need - found)}")
    round6_build(src)
    for fo in FOLDERS:
        for p in sorted((TMP / fo).glob("*.svg")):
            n += 1
            q = ref(fo, p.name)
            if q is None:
                bad.append(f"[r6] {fo}/{p.name}: no round-6 or round-5 file")
            elif q.read_bytes() != p.read_bytes():
                bad.append(f"[r6] {fo}/{p.name} differs from {q.relative_to(DESIGN)}")
        for q in sorted((R6 / fo).glob("*.svg")):
            if not (TMP / fo / q.name).exists():
                bad.append(f"[r6] {fo}/{q.name}: round 6 has it, not rebuilt")
    # 2. the E3 generators with their round-6 switches off too -> round 5
    out = TMP / "r5"
    out.mkdir()
    subprocess.run([sys.executable, "-c", """
import sys, pathlib
sys.path.insert(0, sys.argv[1])
import lib
lib.OUT = pathlib.Path(sys.argv[2])
lib.HEROES6 = False
import critters as c, greenskins as g, fiends as f, lizards as l
c.HEROES6 = g.HEROES6 = f.HEROES6 = False
c.BAT_R6 = c.SPIDER_R6 = c.SLIME_R6 = c.SNOWMAN_R6 = False
for k in ("big", "small", "fire"):
    c.slime(k).write(f"slime-{k}.svg")
c.bat().write("bat.svg"); c.ghost().write("ghost.svg"); c.snowman().write("snowman.svg")
for k in ("hunter", "momma"):
    c.spider(k).write(f"spider-{k}.svg")
for name, fn in (("goblin", g.goblin), ("hobgoblin", g.hobgoblin), ("orc", g.orc), ("orc-shaman", g.shaman),
                 ("troll", g.troll), ("ogre", g.ogre)):
    fn().write(f"greenskin-{name}.svg")
for name, fn in (("imp", f.imp), ("devil", f.devil), ("demon", f.demon)):
    fn().write(f"fiend-{name}.svg")
for v in ("a", "b"):
    l.lizard_spear(v).write(f"lizardman-spear-{v}.svg"); l.lizard_blade(v).write(f"lizardman-blade-{v}.svg")
    l.dragonborn(v).write(f"dragonborn-{v}.svg")
""", str(src / "E3"), str(out)], check=True, stdout=subprocess.DEVNULL)
    for p in sorted(out.glob("*.svg")):
        n += 1
        if p.read_bytes() != (R5 / "enemies" / p.name).read_bytes():
            bad.append(f"[r5] enemies/{p.name} differs from round 5")
    # 3. build7.py -> the committed round-7 files
    src, _ = copy_src(False)
    run(src, str(src / "build7.py"))
    for fo in FOLDERS:
        got = {p.name for p in (TMP / fo).glob("*.svg")}
        have = {p.name for p in (R7 / fo).glob("*.svg")}
        for name in sorted(got | have):
            n += 1
            a, b = TMP / fo / name, R7 / fo / name
            if not (a.exists() and b.exists()) or a.read_bytes() != b.read_bytes():
                bad.append(f"[r7] {fo}/{name}: build7.py output differs from design/class-round7")
finally:
    shutil.rmtree(TMP, ignore_errors=True)
print(f"{n} files checked")
print("\n".join(bad) if bad else "all identical")
