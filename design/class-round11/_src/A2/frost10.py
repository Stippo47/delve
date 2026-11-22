"""Round 10, the frost spirit's note ("That tail should be like that rat tail where it's wiggly/ follows behind"): the
spirits' cores without the drawn tail (beasts9.spirit9(tail=False)), one per element, for the game to trail a springy
ribbon behind (the code is the lead's: design/class-round10/notes.md says exactly what it draws), and a mock-up of the
frost spirit with that ribbon for the board.
python frost10.py [name ...]   -> ../../enemies/spirit-core-<element>.svg, ../../boards/frost-spirit-code-tail.svg"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *
from beasts9 import spirit9, SPIRIT_COLS

NAMES = {"frost": ("Frost Spirit", "frost: an ice-blue core with a white snowflake."),
         "fire": ("Fire Spirit", "fire: a flame-orange core with a pale flame in it."),
         "heal": ("Light Spirit", "light: a pale gold core with a little sun in it."),
         "ward": ("Ward Spirit", "warding: a violet core with a pale shield in it."),
         "poison": ("Venom Spirit", "venom: a lime-green core with a dark drop in it."),
         "haste": ("Wind Spirit", "wind: a white, sky-pale core with a swirl in it."),
         "shock": ("Storm Spirit", "lightning: a pale yellow core with a white bolt in it.")}


def core(el):
    return save("enemies", f"spirit-core-{el}", spirit9(el, *NAMES[el], tail=False))


def ribbon(spine, w0, pw=0.8):
    """What the code draws: a ribbon along the chain's points, w0 wide at the root, tapering to a point."""
    n = len(spine)
    L, R = [], []
    for i, (x, y) in enumerate(spine):
        a, b = spine[max(i - 1, 0)], spine[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        w = w0 / 2 * (1 - i / (n - 1)) ** pw
        L.append((x + nx * w, y + ny * w))
        R.append((x - nx * w, y - ny * w))
    return blob(L + R[::-1][1:], 0.9)


def mock():
    """The frost spirit as the game would draw it with the code tail: the core, and behind it a ribbon on a chain of
    five springy points, mid-wiggle. For the board only."""
    S = spirit9("frost", *NAMES["frost"], tail=False)
    c0, c1, t0, t1, mk = SPIRIT_COLS["frost"]
    body = S.out[:]
    S.out = []
    S.open = False
    S.comment = ("FROST SPIRIT, a mock-up for the board (round 10): the core (spirit-core-frost.svg) with the tail the game "
                 "would draw behind it: a ribbon on a chain of springy points, caught mid-wiggle. " + LAYOUT)
    S.add_def(f'<linearGradient id="gRib" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{t0}"/>'
              f'<stop offset="1" stop-color="{t1}"/></linearGradient>')
    S.group("back", (100, 100), "the code-drawn tail")
    S.shape(ribbon([(100, 104), (95, 84), (106, 64), (93, 44), (105, 24), (98, 6)], 50), fill="url(#gRib)", shadow=0, side=False)
    S.out.append("</g>")
    S.open = False
    S.out += body
    S.open = True
    p = ROOT5 / "boards" / "frost-spirit-code-tail.svg"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(S.svg(), encoding="utf-8")
    return p


BUILD = {f"spirit-core-{el}": (lambda el=el: core(el)) for el in NAMES}
BUILD["frost-spirit-code-tail"] = mock

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
