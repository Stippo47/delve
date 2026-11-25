"""Round 19 art lane (heroes and bosses): rebuild every SVG in design/r19-art and its pictures.
python tools/art-heroart/build.py"""
import sys, pathlib, importlib
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "A2")); sys.path.insert(0, str(HERE))
JOBS = [("water19", "water", ("wave", "orb", "shell")), ("qm19", "qm", ("pots", "ledger", "sack")),
        ("bee19", "keeper", ("veil", "skep", "beard")), ("bandit19", "bandit", ("highwayman", "cutpurse", "rascal")),
        ("queen19", "queen", ("spires", "mantle", "glacier")), ("chief19", "chief", ("skull", "mohawk", "crown")),
        ("grave19", "warden", ("digger", "coffin", "undertaker"))]
for mod, fn, takes in JOBS:
    m = importlib.import_module(mod)
    for t in takes:
        print(getattr(m, fn)(t))
import boards
for u in boards.SUBJ:
    boards.run(u)
