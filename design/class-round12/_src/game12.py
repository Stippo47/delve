"""Copy section C's files into art/ (each with a comment saying where it comes from). They are new files that no kind
points at yet: the summons and props go to art/summons/, the heroes' new weapon hands to art/heroes/r12/ (beside the
approved heroes, which stay as they are). Nothing of section A (the six new heroes) is copied: the game keeps its
stand-ins until the designer picks. notes.md lists the js change that goes with each file; none is made here.
python game12.py   (paths relative to this file)"""
import pathlib
import props_list

HERE = pathlib.Path(__file__).resolve().parent
R12 = HERE.parent
ROOT = HERE.parents[2]
ART = ROOT / "art"

COPIES = [(p[0], p[4]) for g in props_list.GROUPS for p in g["props"]]

if __name__ == "__main__":
    for src, dst in COPIES:
        text = (R12 / "props" / src).read_text(encoding="utf-8")
        note = f"<!-- GAME COPY (art round 12, not wired yet) of design/class-round12/props/{src} -->"
        i = text.index(">") + 1
        text = text[:i] + "\n" + note + text[i:]
        out = ART / dst
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        print(f"art/{dst} <- props/{src}")
