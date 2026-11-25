"""python boards.py <subject> ... : the pictures for the deck (design/r19-art/<kind>/<id>/<id>-<take>.png)."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from render import *
D = ROOT / "design" / "r19-art"
H = 86.4
SUBJ = {
  "waterMage": ("heroes", ROOT/"art/heroes/waterMage.svg", H, ["wave", "orb", "shell"]),
  "quartermaster": ("heroes", ROOT/"art/heroes/quartermaster.svg", H, ["pots", "ledger", "sack"]),
  "beekeeper": ("heroes", ROOT/"art/heroes/beekeeper.svg", H, ["veil", "skep", "beard"]),
  "winterQueen": ("bosses", ROOT/"art/bosses/winter-queen.svg", 34*220/57, ["spires", "mantle", "glacier"]),
  "chieftain": ("bosses", ROOT/"art/bosses/goblin-chieftain.svg", 38*220/67, ["skull", "mohawk", "crown"]),
  "rogueBandit": ("heroes", ROOT/"art/heroes/bandit.svg", 20*220/56, ["highwayman", "cutpurse", "rascal"]),
  "graveWarden": ("bosses", ROOT/"art/enemies/brute.svg", 36*220/60, ["digger", "coffin", "undertaker"]),
}
def run(uid):
    kind, cur, sizeU, takes = SUBJ[uid]
    for t in takes:
        p = D/kind/uid/f"{uid}-{t}.svg"
        board(f"{uid}: {t} (beside the art in the game now)", [("now", cur, sizeU, True), (t, p, sizeU, False)], D/kind/uid/f"{uid}-{t}.png")
    board(f"{uid}: all takes", [("now", cur, sizeU, True)] + [(t, D/kind/uid/f"{uid}-{t}.svg", sizeU, False) for t in takes], HERE/"look"/f"{uid}-all.png")
if __name__ == "__main__":
    for u in sys.argv[1:] or SUBJ: run(u)
