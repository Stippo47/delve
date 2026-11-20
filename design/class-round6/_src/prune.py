"""Delete regenerated SVGs that are byte-identical to the round-5 file the designer saw (unchanged designs), so the
round-6 folders hold only what changed. python prune.py   (paths relative to this file)"""
import pathlib
HERE = pathlib.Path(__file__).resolve().parent
R6, R5 = HERE.parent, HERE.parents[1] / "class-round5"
for p in sorted(R6.glob("*/*.svg")):
    q = R5 / p.parent.name / p.name
    if q.exists() and q.read_bytes() == p.read_bytes():
        p.unlink()
for d in sorted(x for x in R6.iterdir() if x.is_dir() and x.name != "_src"):
    print(d.name, sorted(s.stem for s in d.glob("*.svg")))
