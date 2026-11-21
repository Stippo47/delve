"""Copy the round-8 designs the game uses into art/ (each with a comment saying where it comes from).
Part 1: the orc (also the Warboss); Ghost A as the Crypt's ghost (both ghosts were picked; Ghost B goes in beside it,
unused, for the cold ghost the roster asks for); the troll (also the rock troll) and its boulder prop; Troll A as the
chieftain, unused until the boss lane takes it up. Part 2: every Wildwood and Sewer kind that wore a placeholder, and
the druid's called wolf (the same wolf: the designer's "capsule shaped" note was on Call Wolf).
python game8.py   (paths relative to this file)"""
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
R8 = HERE.parent
ROOT = HERE.parents[2]
ART = ROOT / "art"

COPIES = [
    ("enemies/greenskin-orc.svg", "enemies/orc.svg"),
    ("enemies/ghost-a.svg", "enemies/ghost.svg"),
    ("enemies/ghost-b.svg", "enemies/ghost-b.svg"),
    ("enemies/greenskin-troll.svg", "enemies/troll.svg"),
    ("props/troll-boulder.svg", "props/troll-boulder.svg"),
    ("enemies/greenskin-chieftain.svg", "enemies/chieftain.svg"),
    ("enemies/wild-wolf.svg", "enemies/wolf.svg"),
    ("enemies/wild-wolf.svg", "summons/wolf.svg"),
    ("enemies/wild-dire-wolf.svg", "enemies/dire-wolf.svg"),
    ("enemies/wild-alpha.svg", "enemies/alpha.svg"),
    ("enemies/bandit-sword.svg", "enemies/bandit.svg"),
    ("enemies/bandit-torch.svg", "enemies/bandit-torch.svg"),
    ("enemies/bandit-greatsword.svg", "enemies/bandit-greatsword.svg"),
    ("enemies/bandit-axe.svg", "enemies/bandit-axe.svg"),
    ("enemies/bandit-spear.svg", "enemies/bandit-spear.svg"),
    ("enemies/bandit-daggers.svg", "enemies/bandit-daggers.svg"),
    ("enemies/bandit-poacher.svg", "enemies/poacher.svg"),
    ("enemies/bandit-brute.svg", "enemies/bandit-brute.svg"),
    ("enemies/bandit-chief.svg", "enemies/bandit-chief.svg"),
    ("enemies/wild-boar.svg", "enemies/boar.svg"),
    ("enemies/wild-sproutling.svg", "enemies/sproutling.svg"),
    ("enemies/wild-ent.svg", "enemies/ent.svg"),
    ("enemies/wild-wisp.svg", "enemies/wisp.svg"),
    ("enemies/wild-elder-ent.svg", "enemies/elder-ent.svg"),
    ("enemies/sewer-rat-king.svg", "enemies/rat-king.svg"),
    ("enemies/sewer-croc.svg", "enemies/croc.svg"),
    ("enemies/sewer-crab.svg", "enemies/crab.svg"),
]

if __name__ == "__main__":
    for src, dst in COPIES:
        text = (R8 / src).read_text(encoding="utf-8")
        note = f"<!-- GAME COPY (art round 8) of design/class-round8/{src} -->"
        i = text.index(">") + 1
        text = text[:i] + "\n" + note + text[i:]
        out = ART / dst
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        print(f"art/{dst} <- {src}")
