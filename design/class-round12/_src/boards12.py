"""The round-12 boards that put several finished sprites into one picture (into ../boards/, for the boards only; the
game draws each file by itself):
  mob-<set>.svg        the Mob's four peasants of one set side by side, at the scale they share
  with-<group>.svg     section C: a hero (art/heroes) with the props drawn for it beside it, each at its size in the game
python boards12.py   (paths relative to this file). CANVAS gives each board's size in sprite units for render12.py."""
import sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R12 = HERE.parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "A2"))
from compose import compose

MOB_ORDER = ("torch", "pitchfork", "axe", "dagger")
MOB_W, MOB_H = 440, 204          # the mob board's canvas, sprite units
ARCHER = 22 / 56                  # room units per sprite unit for a hero


def mob_board(take):
    xs, ys = (58, 164, 270, 376), (70, 84, 70, 84)
    items = []
    for w, x, y in zip(MOB_ORDER, xs, ys):
        t = (R12 / "heroes" / f"mob-{w}-{take}.svg").read_text(encoding="utf-8")
        items.append((t, f"translate({x - 100} {y - 100})"))
    out = R12 / "boards" / f"mob-{take}.svg"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(compose(items, f"THE MOB, set \"{take}\" (round 12): its four peasants (torch, pitchfork, axe, dagger) side by side "
                                  "at the scale they share. For the board only: the game draws each peasant's own file.",
                           vb=f"0 0 {MOB_W} {MOB_H}").replace('width="220" height="220"', f'width="{MOB_W}" height="{MOB_H}"'), encoding="utf-8")
    return out


def with_board(group, hero, props, W=None, H=236):
    """A hero and its props in a row, each at its game scale. props = [(file under ../props or a Path, vr, headR)]."""
    items, x = [], 0
    ht = (ROOT / "art" / "heroes" / f"{hero}.svg") if isinstance(hero, str) else hero
    items.append((ht.read_text(encoding="utf-8"), "translate(10 14)"))
    x = 236
    for fn, vr, hr in props:
        p = fn if isinstance(fn, pathlib.Path) else R12 / "props" / fn
        k = (vr / hr) / ARCHER
        size = 220 * k
        items.append((p.read_text(encoding="utf-8"), f"translate({x:.1f} {14 + (220 - size) * 0.62:.1f}) scale({k:.4f}) translate(10 10)"))
        x += size + 12
    W = W or int(x + 6)
    out = R12 / "boards" / f"with-{group}.svg"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(compose(items, f"Section C, \"{group}\" (round 12): the hero as it is in the game, and beside it the things drawn "
                                  "for it, each at its size in the game. For the board only.", vb=f"0 0 {W} {H}")
                   .replace('width="220" height="220"', f'width="{W}" height="{H}"'), encoding="utf-8")
    return out, W, H


def all_boards():
    made = [mob_board(t) for t in ("village", "family", "kitchen")]
    try:
        import props_list
        for g in props_list.GROUPS:
            made.append(with_board(g["id"], g["hero"], g["props"])[0])
    except ImportError:
        pass
    return made


if __name__ == "__main__":
    for p in all_boards():
        print(p.relative_to(R12).as_posix())
