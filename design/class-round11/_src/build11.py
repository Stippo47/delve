"""Build every round-11 design into design/class-round11/enemies/ (and props/, boards/, heroes/). Each generator writes its
own files and prints their paths:
  E3/fix11e.py   the orc's hair, the picked troll head with its notes
  croc8.py r11   the croc's axes: aimed in, mirrored, rusted and chipped (and the same in steel, saved)
  A2/fix11.py    every other fix and pick-with-a-change (one switch per note)
  A2/new11.py    the variant sets the notes ask for (a visor, a key, an eye, a face...; the game waits for a pick)
  A2/new11b.py   the redraws ("Try again", "Meh", "Try 4 more"...; the game waits for a pick)
  A2/people11.py the Enchantress and the Succubus
Then boards11.py composes the boards that show a design with what the game draws apart.
check11.py checks the copied generators still give the files the designer saw with no round-11 switch, and that this
rebuilds the folder byte for byte. python build11.py [module ...]   (paths relative to this file; none = everything)"""
import sys, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R11 = HERE.parent
GENERATORS = [("E3/fix11e.py", []), ("croc8.py", ["r11"]), ("A2/fix11.py", []), ("A2/new11.py", []), ("A2/new11b.py", []), ("A2/people11.py", []),
              ("boards11.py", [])]


def build(want=()):
    made = []
    for g, args in GENERATORS:
        p = HERE / g
        if not p.exists() or (want and pathlib.Path(g).stem not in want):
            continue
        out = subprocess.run([sys.executable, str(p)] + args, check=True, capture_output=True, text=True, cwd=p.parent).stdout
        made += [line.strip() for line in out.splitlines() if line.strip().endswith(".svg")]
    return made


if __name__ == "__main__":
    for p in build(set(sys.argv[1:])):
        print(p)
