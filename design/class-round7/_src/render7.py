"""Render every round-7 design with tools/riffle/render_board.py (--out <folder>/renders) and put the version the
designer left the note on beside it as <name>-before.png: the round-6 render, or for a note left on a "(before)" tile
the round-5 render that tile showed (round 6's <name>-before.png).
python render7.py [name ...]      (paths relative to this file; no names = everything)"""
import sys, shutil, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R7 = HERE.parent
DESIGN = HERE.parents[1]
ROOT = HERE.parents[2]
RB = ROOT / "tools" / "riffle" / "render_board.py"

# notes left on the "(before)" tile (the round-5 version): their before is that tile
ON_BEFORE = {"greenskin-ogre", "greenskin-orc", "lizardman-blade-b", "lizardman-spear-b", "ghost"}
# a design in two versions (or under a new name) -> the design the note was on
ALT = {"ghost-a": "ghost", "ghost-b": "ghost", "greenskin-troll-a": "greenskin-troll", "greenskin-troll-b": "greenskin-troll",
       "ranged-marksman-a-beard": "ranged-marksman-a"}


def label(stem):
    words = stem.split("-")
    if words[0] in ("caster", "support", "ranged", "fighter", "greenskin", "fiend", "celestial", "lizardman"):
        words = words[1:]
    return " ".join(w.upper() if len(w) == 1 else w.capitalize() for w in words).strip()


def before(folder, stem):
    base = ALT.get(stem, stem)
    r6 = DESIGN / "class-round6" / folder / "renders"
    if base in ON_BEFORE and (r6 / f"{base}-before.png").exists():
        return r6 / f"{base}-before.png"
    for p in (r6 / f"{base}.png", DESIGN / "class-round5" / folder / "renders" / f"{base}.png"):
        if p.exists():
            return p
    return None


if __name__ == "__main__":
    want = set(sys.argv[1:])
    for folder in sorted(p for p in R7.iterdir() if p.is_dir() and p.name != "_src"):
        svgs = [s for s in sorted(folder.glob("*.svg")) if not want or s.stem in want]
        if not svgs:
            continue
        out = folder / "renders"
        out.mkdir(exist_ok=True)
        subprocess.run([sys.executable, str(RB), "--out", str(out)] + [f"{s}={label(s.stem)}" for s in svgs], check=True,
                       stdout=subprocess.DEVNULL)
        for s in svgs:
            b = before(folder.name, s.stem)
            if b:
                shutil.copyfile(b, out / f"{s.stem}-before.png")
            print("rendered", folder.name, s.stem, "| before:", b.relative_to(DESIGN) if b else None)
