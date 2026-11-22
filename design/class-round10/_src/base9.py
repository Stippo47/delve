"""For check10.py: run every round-9 generator copied into this _src as it stands (no round-10 argument or switch) and
put what they write into the folder given, so check10.py can compare it with design/class-round9 byte for byte. The
round-10 fixes to round-9 designs (the yeti, its snowball, the spirits, the choir sprite and singer, the gun turret, the
Goblin Chieftain) are arguments and switches of these generators, so this shows each fix is only what its switch adds.
python base9.py <out folder>   (run from a copy of _src: it writes beside it)"""
import sys, shutil, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R = HERE.parent
OUT = pathlib.Path(sys.argv[1])
GEN9 = ["A2/frost9.py", "E3/frost9e.py", "A2/ember9.py", "E3/ember9e.py", "A2/spire9.py", "A2/dunes9.py", "A2/foundry9.py",
        "A2/bosses9.py", "E3/bosses9e.py"]

for g in GEN9:
    p = HERE / g
    subprocess.run([sys.executable, str(p)], check=True, stdout=subprocess.DEVNULL, cwd=p.parent)
for d in ("enemies", "props"):
    (OUT / d).mkdir(parents=True, exist_ok=True)
    for f in (R / d).glob("*.svg"):
        shutil.move(str(f), str(OUT / d / f.name))
