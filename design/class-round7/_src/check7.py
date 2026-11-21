"""Rebuild every design from the generators copied into this _src (from design/class-round6/_src) and compare each
file with the one the designer saw: the round-6 file, or the round-5 file where round 6 left a design unchanged (its
prune step deleted those). The round-5 generators' own outputs that lizards6.py / fiends6.py overwrite (the round-5
lizards, dragonborn, goblin, imp and devil) are checked against round 5 before they are overwritten.
python check7.py         (paths relative to this file; scratch goes to tools/riffle/out/r7, which git ignores)
Prints every file that differs; "all identical" when the copies rebuild byte for byte."""
import sys, shutil, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R7 = HERE.parent
DESIGN = HERE.parents[1]
R6, R5 = DESIGN / "class-round6", DESIGN / "class-round5"
SCR = HERE.parents[2] / "tools" / "riffle" / "out" / "r7" / "check"
FOLDERS = ("ranged", "fighters", "heroes-casters", "heroes-support", "enemies")


def run(script, *args):
    subprocess.run([sys.executable, str(HERE / script), *args], check=True, stdout=subprocess.DEVNULL)


def ref(folder, name):
    for r in (R6, R5):
        p = r / folder / name
        if p.exists():
            return p
    return None


def trapper_right():
    """round 6's alternate trapper (ranged.TRAPPER_R6 = "right"), saved beside the straight one"""
    a2 = HERE / "A2"
    subprocess.run([sys.executable, "-c", "import sys; sys.path.insert(0, sys.argv[1]); import ranged as r; "
                    "r.TRAPPER_R6 = 'right'; p = r.trapper(); p.replace(p.with_name('ranged-trapper-right.svg'))",
                    str(a2)], check=True)


for fo in FOLDERS:  # start clean: only the generators' output
    for p in (R7 / fo).glob("*.svg"):
        p.unlink()
trapper_right()
for s in ("A2/ranged.py", "A2/fighters.py", "A2/crew.py", "casters/casters5.py", "support/support5.py",
          "E3/critters.py", "E3/greenskins.py", "E3/fiends.py", "E3/lizards.py", "E3/angel.py"):
    run(s)
bad, n = [], 0
# the round-5 lizards and dragonborn (E3/lizards.py has no round-6 switch) that lizards6.py overwrites: vs round 5
for p in sorted((R7 / "enemies").glob("*.svg")):
    if p.name.startswith(("lizardman-", "dragonborn-")):
        n += 1
        if p.read_bytes() != (R5 / "enemies" / p.name).read_bytes():
            bad.append(f"enemies/{p.name} (round-5 generator) differs from round 5")
# the E3 generators with every round-6 switch off must give the round-5 files (the designer's notes on the
# "(before)" tiles start from those): into scratch, then compared
if SCR.exists():
    shutil.rmtree(SCR)
SCR.mkdir(parents=True)
subprocess.run([sys.executable, "-c", """
import sys, pathlib
sys.path.insert(0, sys.argv[1])
import lib
lib.OUT = pathlib.Path(sys.argv[2])
lib.HEROES6 = False
import critters as c, greenskins as g, fiends as f
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
""", str(HERE / "E3"), str(SCR)], check=True)
for p in sorted(SCR.glob("*.svg")):
    n += 1
    if p.read_bytes() != (R5 / "enemies" / p.name).read_bytes():
        bad.append(f"enemies/{p.name} (round-6 switches off) differs from round 5")
run("lizards6.py")
run("fiends6.py")
for fo in FOLDERS:
    for p in sorted((R7 / fo).glob("*.svg")):
        n += 1
        q = ref(fo, p.name)
        if q is None:
            bad.append(f"{fo}/{p.name}: no round-6 or round-5 file")
        elif q.read_bytes() != p.read_bytes():
            bad.append(f"{fo}/{p.name} differs from {q.relative_to(DESIGN)}")
# every round-6 design must have been rebuilt
for fo in FOLDERS:
    for q in sorted((R6 / fo).glob("*.svg")):
        if not (R7 / fo / q.name).exists():
            bad.append(f"{fo}/{q.name}: round 6 has it, not rebuilt")
print(f"{n} files checked")
print("\n".join(bad) if bad else "all identical")
