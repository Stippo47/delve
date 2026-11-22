"""Build every round-10 design into design/class-round10/enemies/ (and props/, boards/). Each generator writes its own
files and prints their paths:
  E3/fix10e.py     the art-round8 notes on E3 designs: the ghosts' tails, the orc, the trolls' heads and hands
  croc8.py         the croc's axes (CROC_R10)
  A2/bandits10.py  the nine bandits, drawn again
  A2/wild10.py     wolves without paws, the Alpha's scar, the dire wolf, the boar, the ents' faces, the sproutling
  A2/frost10.py, E3/frost10e.py, A2/spire10.py, A2/dunes10.py, A2/foundry10.py, A2/bosses10.py, E3/bosses10e.py
                   the art-round9 notes, dungeon by dungeon
  A2/misc10.py     the big sun blade, the slime
Then the boards that show a design with what the game draws apart (the trolls with their boulder) go into boards/.
check10.py checks the copied round-8 and round-9 code still gives the files the designer saw, and that this rebuilds the
folder byte for byte. python build10.py [module ...]   (paths relative to this file; no names = every generator)"""
import sys, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R10 = HERE.parent
GENERATORS = ["E3/fix10e.py", "croc8.py", "A2/bandits10.py", "A2/wild10.py", "A2/frost10.py", "E3/frost10e.py",
              "A2/spire10.py", "A2/dunes10.py", "A2/foundry10.py", "A2/bosses10.py", "E3/bosses10e.py", "A2/misc10.py"]
FEEL_R = 1.1   # js/units.js FEEL.collider


def troll_boards():
    """Each troll variant with the boulder in front as the game places it (js/foes9.js boulderOf, HOLD), at the size the
    note asks for: the troll "slightly smaller" (r 60 -> 54, vr 44 -> 40), the boulder the size it is now (r 41)."""
    sys.path.insert(0, str(HERE))
    from compose import compose
    R8 = R10.parent / "class-round8"
    rock = (R8 / "props" / "troll-boulder.svg").read_text(encoding="utf-8")
    out = []
    (R10 / "boards").mkdir(parents=True, exist_ok=True)
    def board(src, dst, r, vr, headR=66, hold=-0.46, br=41):
        ur = r * FEEL_R
        k = vr / headR
        ahead = (ur + br + hold * ur + 8) / k
        s = 86.4 * br / 30 / k / 220
        cy = 100 + ahead
        bottom = cy + 74 * s
        top = 20
        fit = 220 / (bottom + 8 - top)
        tf = f"translate({100 - 100 * fit:.2f} {-10 - top * fit:.2f}) scale({fit:.4f})"
        tf_rock = f"translate({100 - 100 * s:.2f} {cy - 100 * s:.2f}) scale({s:.4f})"
        text = compose([(rock, f"{tf} {tf_rock}"), (src.read_text(encoding="utf-8"), tf)],
                       "A TROLL (round 10) with its boulder in front, placed as the game places it (js/foes9.js); the two are "
                       "drawn apart in the game. For the board only.")
        dst.write_text(text, encoding="utf-8")
        out.append(dst)
        return (vr / headR / fit)
    scale = {}
    scale["greenskin-troll-before"] = board(R8 / "enemies" / "greenskin-troll.svg", R10 / "boards" / "greenskin-troll-before.svg", 60, 44)
    for kind in ("head", "hands"):
        for h in "abc":
            n = f"greenskin-troll-{kind}-{h}"
            scale[n] = board(R10 / "enemies" / f"{n}.svg", R10 / "boards" / f"{n}.svg", 54, 40)
    return out, scale


def build(want=()):
    made = []
    for g in GENERATORS:
        p = HERE / g
        if not p.exists() or (want and pathlib.Path(g).stem not in want):
            continue
        out = subprocess.run([sys.executable, str(p)], check=True, capture_output=True, text=True, cwd=p.parent).stdout
        made += [line.strip() for line in out.splitlines() if line.strip().endswith(".svg")]
    if not want or "boards" in want or "fix10e" in want:
        made += [p.relative_to(R10).as_posix() for p in troll_boards()[0]]
    return made


if __name__ == "__main__":
    for p in build(set(sys.argv[1:])):
        print(p)
