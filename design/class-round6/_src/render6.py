"""Render every round-6 design with tools/riffle/render_board.py (--out <folder>/renders) and put the version the
designer saw beside it as <name>-before.png (the round-5 render; for a design built back from its round-4 version,
also <name>-r4.png, the round-4 render it starts from).
python render6.py [name ...]      (paths relative to this file; no names = everything)"""
import sys, shutil, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R6 = HERE.parent
DESIGN = HERE.parents[1]
ROOT = HERE.parents[2]
RB = ROOT / "tools" / "riffle" / "render_board.py"

R4 = {  # round-6 file -> the round-4 render it is built back from
    "lizardman-spear-a": "enemies/renders/lizardman-a-spear.png", "lizardman-spear-b": "enemies/renders/lizardman-a-spear.png",
    "lizardman-blade-a": "enemies/renders/lizardman-b-desert-blade.png",
    "lizardman-blade-b": "enemies/renders/lizardman-b-desert-blade.png",
    "lizardman-croc-a": "enemies/renders/lizardman-c-croc.png", "lizardman-croc-b": "enemies/renders/lizardman-c-croc.png",
    "dragonborn-a": "monsters/renders/dragonborn-dragonborn.png", "dragonborn-b": "monsters/renders/dragonborn-dragonborn.png",
    "greenskin-goblin": "monsters/renders/greenskin-goblin.png", "fiend-imp": "monsters/renders/fiend-imp.png",
    "fiend-devil": "monsters/renders/fiend-devil.png", "ranged-harpooner": "heroes-ranged/renders/ranged-harpooner.png",
}


def label(stem):
    words = stem.split("-")
    if words[0] in ("caster", "support", "ranged", "fighter", "greenskin", "fiend", "celestial", "lizardman"):
        words = words[1:]
    return " ".join(w.upper() if len(w) == 1 else w.capitalize() for w in words).strip()


want = set(sys.argv[1:])
for folder in sorted(p for p in R6.iterdir() if p.is_dir() and p.name != "_src"):
    svgs = [s for s in sorted(folder.glob("*.svg")) if not want or s.stem in want]
    if not svgs:
        continue
    out = folder / "renders"
    out.mkdir(exist_ok=True)
    subprocess.run([sys.executable, str(RB), "--out", str(out)] + [f"{s}={label(s.stem)}" for s in svgs], check=True)
    for s in svgs:
        before = DESIGN / "class-round5" / folder.name / "renders" / f"{s.stem}.png"
        if before.exists():
            shutil.copyfile(before, out / f"{s.stem}-before.png")
        if s.stem in R4:
            src = DESIGN / "class-round4" / R4[s.stem]
            shutil.copyfile(src, out / f"{s.stem}-r4.png")
            if not before.exists():  # new this round (the croc): its round-4 render is the "before"
                shutil.copyfile(src, out / f"{s.stem}-before.png")
        print("rendered", folder.name, s.stem)
