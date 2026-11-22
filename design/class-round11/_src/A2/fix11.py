"""Round 11: the art-round10 and art-round10b notes that are a fix or a pick with a change, on designs built with the A2
library. Each is a switch or argument of the copied round-8/9/10 generator, named beside the note it answers; with none
the generators give the files the designer saw byte for byte (check11.py).
python fix11.py [name ...]   -> ../../enemies/<name>.svg   (paths relative to this file)"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import common
from common import ROOT5

BUILD = {}


def switched(mod, flags, fn, name=None):
    """Call fn() with the module's switches on (then off again), saving under `name` if given."""
    def run():
        old = {k: getattr(mod, k) for k in flags}
        for k, v in flags.items():
            setattr(mod, k, v)
        common.SAVE_AS = name
        try:
            return fn()
        finally:
            common.SAVE_AS = None
            for k, v in old.items():
                setattr(mod, k, v)
    return run


# ------------------------------------------------------------------ the Wildwood's bandits
import bandits10 as B
# "I think I don't like the line in the bandanas. Remove them for everyone": every masked bandit, nothing else changed
for _n, _f in (("bandit-brute", B.brute), ("bandit-chief", B.chief), ("bandit-torch", B.bandit_torch),
               ("bandit-greatsword", B.bandit_greatsword), ("bandit-spear", B.bandit_spear)):
    BUILD[_n] = switched(B, dict(NO_FOLD=True), _f)
# "Flip the axe"
BUILD["bandit-axe"] = switched(B, dict(NO_FOLD=True, AXE_FLIP=True), B.bandit_axe)
# "Pigtail not layered properly"
BUILD["bandit-daggers"] = switched(B, dict(NO_FOLD=True, KNOT_OVER=True), B.bandit_daggers)
# "The strip down the middle should be 2 lines dark on 1 side light on the other. Sharp contrast instead of gradient"
BUILD["bandit-sword"] = switched(B, dict(NO_FOLD=True, RIDGE_LINES=True), B.bandit_sword)

# ------------------------------------------------------------------ the Wildwood's beasts and trees
import wild8 as W
import wild10 as W10
import grove8 as G
R11 = dict(head=7, short=12)   # "Bring their heads forwards a bit. Shorten body a bit."
# the wolves without paws (the game's), and "with the pawns rendering under the body" (for the board)
BUILD["wild-wolf"] = lambda: W.wolf("wolf", paws=False, **R11)
BUILD["wild-wolf-paws-under"] = lambda: W.wolf("wolf", paws="under", out="wild-wolf-paws-under", **R11)
# the dire wolf: also "Less spikey" (its mane: 12 tufts 0.3 deep -> 9 tufts 0.16 deep, the same size)
DIRE = dict(mane=1.25, body=1.1, spiky=(9, 0.16))
BUILD["wild-dire-wolf"] = lambda: W.wolf("dire-wolf", paws=False, **DIRE, **R11)
BUILD["wild-dire-wolf-paws-under"] = lambda: W.wolf("dire-wolf", paws="under", out="wild-dire-wolf-paws-under", **DIRE, **R11)
# the dire wolf as it was shown on its own tile (with paws), with only "Less spikey": for the before/after
BUILD["wild-dire-wolf-less-spiky"] = lambda: W.wolf("dire-wolf", out="wild-dire-wolf-less-spiky", **DIRE)
# the Alpha, with the picked scar ("Claw marks")
BUILD["wild-alpha"] = lambda: W.wolf("alpha", paws=False, scar="claws", **R11)
BUILD["wild-alpha-paws-under"] = lambda: W.wolf("alpha", paws="under", scar="claws", out="wild-alpha-paws-under", **R11)
# the boar: "Ridge. Show me without the mane"
BUILD["wild-boar-no-crest"] = lambda: W10.boar("ridge", no="crest")
BUILD["wild-boar-no-ruff"] = lambda: W10.boar("ridge", no="ruff")
# the Ent: "Remove mouth. B is good Take leaf off nose"
BUILD["wild-ent"] = switched(G, dict(ENT_R11=True), lambda: G.ent(face="nose", out="wild-ent"))

# ------------------------------------------------------------------ the Frost Hollow
import frost9 as F9
# "I like the old one more. Maybe without the side spikes the old one could work"
BUILD["frost-ice-slime"] = lambda: F9.ice_slime(spikes=False)

# ------------------------------------------------------------------ the Sunken Dunes
import dunes10 as D
# "Have that top segment free from the bottom and have it slowly move around the bottom segment in game."
BUILD["dunes-cobra"] = switched(D, dict(COBRA_R11=True), D.cobra)
# "Segment diamonds don't look identical to head diamonds. Slight smaller and fainter"
BUILD["dunes-serpent-coil"] = switched(D, dict(COIL_R11=True), D.serpent_coil)
# the mummy. The first deck, on the first take: "Don't like Weird button on face. Remove arms. Otherwise good". The second
# deck, on the second take: "I liked the last one just without the button thing. I want to see without the collar".
BUILD["dunes-mummy"] = switched(D, {}, lambda: D.mummy1(button=False, arms=False), "dunes-mummy")                 # the game's
BUILD["dunes-mummy-arms"] = switched(D, {}, lambda: D.mummy1(button=False), "dunes-mummy-arms")                   # "just without the button thing"
BUILD["dunes-mummy-take2-no-collar"] = switched(D, {}, lambda: D.mummy(collar=False), "dunes-mummy-take2-no-collar")

# ------------------------------------------------------------------ the Gilded Spire
import spire10 as SP
import second10 as S2
BUILD["spire-herald-light"] = lambda: SP.herald(False, r11=True)
BUILD["spire-herald-fallen"] = lambda: SP.herald(True, r11=True)
# "Use the old head shape."
BUILD["spire-seraph"] = switched(S2, dict(SERAPH_R11=True), S2.seraph)

# ------------------------------------------------------------------ the Clockwork Foundry
import foundry9 as FO9
import foundry10b as FB
BUILD["foundry-bomb-bot"] = switched(FB, dict(BOMB_R11=True), FB.bomb_bot)
BUILD["foundry-turret-flame"] = switched(FB, dict(FLAME_R11=True), FB.turret_flame)
BUILD["foundry-turret-laser"] = switched(FB, dict(LASER_R11=True), FB.turret_laser)
BUILD["foundry-smith"] = switched(FB, dict(SMITH_R11=True), FB.smith)
# "Add the middle detail onto the previous saw blade."
BUILD["foundry-saw-blade"] = switched(FO9, dict(SAW_R11=True), FO9.saw_blade)

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
