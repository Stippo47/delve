"""Build every round-7 design into design/class-round7/<folder>/ and drop the ones that did not change (prune7.py).
Each round-7 change sits behind a switch named *_R7 (or TEETH_IN, BLADE_R7, CREST_R7, HORNS_R7, BEARD) in the
generator it touches; check7.py turns them all off and checks the generators still give the round-6 files.
python build7.py      (paths relative to this file; then python render7.py for the boards)"""
import sys, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent


def run(*args):
    subprocess.run([sys.executable, *args], check=True, stdout=subprocess.DEVNULL, cwd=HERE)


def build(here=HERE):
    a2 = str(here / "A2")
    run(str(here / "A2/ranged.py"), "marksman-a")
    run("-c", "import sys; sys.path.insert(0, sys.argv[1]); import ranged as r; r.BEARD = True; r.marksman_a()", a2)
    run(str(here / "A2/fighters.py"), "gladiator", "werewolf", "werewolf-human")
    for s in ("E3/critters.py", "E3/greenskins.py", "E3/fiends.py", "E3/lizards.py"):
        run(str(here / s))
    run(str(here / "lizards7.py"))   # the lizards and dragonborn (round-6 builds + round-7 switches)
    run(str(here / "fiends6.py"))    # the goblin, imp and devil as round 6 had them (E3 writes round-5 ones)
    run(str(here / "prune7.py"))


if __name__ == "__main__":
    build()
    for d in sorted(p for p in HERE.parent.iterdir() if p.is_dir() and p.name != "_src"):
        print(d.name, sorted(s.stem for s in d.glob("*.svg")))
