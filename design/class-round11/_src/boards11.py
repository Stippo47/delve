"""The round-11 boards that show a design with what the game draws apart (into ../boards/):
  greenskin-troll.svg     the picked troll with its boulder in front, placed as the game places it, at the size the
                          round-10 note asked for (the troll 10% smaller: r 54, vr 40; the boulder the size it is: r 41)
  dunes-sand-serpent.svg  the serpent's head (round 10's, unchanged) and six of the new segments laid as the game lays
                          the chain, so the segments' diamonds can be seen beside the head's
python boards11.py   (paths relative to this file). scales() gives each board's scale for render11.py."""
import sys, math, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R11 = HERE.parent
DESIGN = R11.parent
R8, R10 = DESIGN / "class-round8", DESIGN / "class-round10"
sys.path.insert(0, str(HERE))
from compose import compose

FEEL_R = 1.1   # js/units.js FEEL.collider


def troll_board(write=True):
    rock = (R8 / "props" / "troll-boulder.svg").read_text(encoding="utf-8")
    src, dst = R11 / "enemies" / "greenskin-troll.svg", R11 / "boards" / "greenskin-troll.svg"
    r, vr, headR, hold, br = 54, 40, 66, -0.46, 41
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
    if write:
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(compose([(rock, f"{tf} {tf_rock}"), (src.read_text(encoding="utf-8"), tf)],
                               "THE TROLL (round 11: the picked head B with its notes) with its boulder in front, placed as the game "
                               "places it (js/foes9.js); the two are drawn apart in the game. For the board only."), encoding="utf-8")
    return dst, vr / headR / fit


def serpent_board():
    head = (R10 / "enemies" / "dunes-serpent-head.svg").read_text(encoding="utf-8")
    coil = (R11 / "enemies" / "dunes-serpent-coil.svg").read_text(encoding="utf-8")
    kh, kc, gap, n = 21 / 40, 20 / 55, 26, 6
    x, y, items = 0.0, 0.0, []
    pos = [(0.0, 0.0, 90.0)]
    for i in range(1, n + 1):
        a = math.radians(-90 + 34 * math.sin(i * 1.05 - 0.4))
        x += gap * math.cos(a); y += gap * math.sin(a)
        pos.append((x, y, math.degrees(a) + 180))
    ox, oy = 92, 146
    for i in range(n, 0, -1):
        px, py, face = pos[i]
        k = kc * (1 - 0.35 * ((i - 1) / (n - 1)))
        items.append((coil, f"translate({ox + px:.2f} {oy + py:.2f}) rotate({face - 90:.1f}) scale({k:.4f}) translate(-100 -100)"))
    items.append((head, f"translate({ox:.2f} {oy:.2f}) scale({kh:.4f}) translate(-100 -100)"))
    out = R11 / "boards" / "dunes-sand-serpent.svg"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(compose(items, "THE SAND SERPENT (round 11): round 10's head and six of the round-11 body segments laid as the game "
                                  "lays the chain (gap 26, tapering), for the board only."), encoding="utf-8")
    return out


def scales():
    return {"greenskin-troll": troll_board(write=False)[1]}


if __name__ == "__main__":
    print(troll_board()[0].relative_to(R11).as_posix())
    print(serpent_board().relative_to(R11).as_posix())
