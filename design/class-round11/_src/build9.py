"""Build every round-9 design into design/class-round9/enemies/ (and props/). Each generator writes its own files and
prints their paths:
  A2/frost9.py, A2/ember9.py, A2/spire9.py, A2/dunes9.py, A2/foundry9.py, A2/bosses9.py   new designs, A2 library
  E3/frost9e.py, E3/ember9e.py, E3/bosses9e.py   designs built on picked E3 designs (the troll, Ghost B, the bat, the
                                                  round-8 chieftain)
check9.py checks the copied round-8 libraries still give the round-8 files, and that this rebuilds the folder byte for
byte. python build9.py [module ...]   (paths relative to this file; no names = every generator that exists)"""
import sys, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R9 = HERE.parent
GENERATORS = ["A2/frost9.py", "E3/frost9e.py", "A2/ember9.py", "E3/ember9e.py", "A2/spire9.py", "A2/dunes9.py",
              "A2/foundry9.py", "A2/bosses9.py", "E3/bosses9e.py"]


def build(want=()):
    made = []
    for g in GENERATORS:
        p = HERE / g
        if not p.exists() or (want and pathlib.Path(g).stem not in want):
            continue
        out = subprocess.run([sys.executable, str(p)], check=True, capture_output=True, text=True, cwd=p.parent).stdout
        made += [line.strip() for line in out.splitlines() if line.strip().endswith(".svg")]
    return made


if __name__ == "__main__":
    for p in build(set(sys.argv[1:])):
        print(p)
