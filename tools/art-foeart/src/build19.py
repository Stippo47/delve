"""Round 19 art lane (enemy sprites): build every option, or the kinds named.
python tools/art-foeart/src/build19.py [kind ...]   -> design/r19-art/foes/<kind>/<kind>-<option>.svg"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from foes19 import BUILD, ROOT
import fiends19, ghosts19  # noqa: F401  (they add their kinds to BUILD)

if __name__ == "__main__":
    for k in sys.argv[1:] or list(BUILD):
        fn, opts = BUILD[k]
        for o in opts:
            print(fn(o).relative_to(ROOT).as_posix())
