"""Delete rebuilt SVGs that are byte-identical to the file the designer saw (the round-6 file, or the round-5 file where
round 6 left the design alone), so the round-7 folders hold only what changed this round.
python prune7.py   (paths relative to this file)"""
import pathlib
HERE = pathlib.Path(__file__).resolve().parent
R7 = HERE.parent
DESIGN = HERE.parents[1]
for p in sorted(R7.glob("*/*.svg")):
    for r in ("class-round6", "class-round5"):
        q = DESIGN / r / p.parent.name / p.name
        if q.exists():
            if q.read_bytes() == p.read_bytes():
                p.unlink()
            break
for d in sorted(x for x in R7.iterdir() if x.is_dir() and x.name != "_src"):
    print(d.name, sorted(s.stem for s in d.glob("*.svg")))
