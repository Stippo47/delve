"""Build every round-12 design into design/class-round12/heroes/, props/ and boards/. Each generator writes its own files
and prints their paths:
  A2/heroes12.py  section A: the Clockwork hero, the Air mage, the Warden, the Telekinetic, the Earth mage, three takes each
  A2/mob12.py     section A: the Mob's four peasants, three sets
  A2/props12.py   section C: the summons and props the game draws in code today
  A2/parts12.py   section C: the heroes' new weapon hands and the Warlock's demon form
  boards12.py     the Mob's four together; each hero beside the things drawn for it (for the boards only)
check12.py checks the copied generators still give the approved heroes with no round-12 switch, that this rebuilds the
folder byte for byte, and (bounds12.py) that no sprite is cut off by its box. render12.py makes the pictures; game12.py
copies section C into art/. python build12.py [module ...]   (paths relative to this file; none = everything)"""
import sys, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
GENERATORS = ["A2/heroes12.py", "A2/mob12.py", "A2/props12.py", "A2/parts12.py", "boards12.py"]


def build(want=()):
    made = []
    for g in GENERATORS:
        p = HERE / g
        if want and pathlib.Path(g).stem not in want:
            continue
        out = subprocess.run([sys.executable, str(p)], check=True, capture_output=True, text=True, cwd=p.parent).stdout
        made += [line.strip() for line in out.splitlines() if line.strip().endswith(".svg")]
    return made


if __name__ == "__main__":
    for p in build(set(sys.argv[1:])):
        print(p)
