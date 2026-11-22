"""Section C's list: what was drawn for which hero, and the size the game should draw each at. One place for the boards
(boards12.py, render12.py), the copy into art/ (game12.py), the notes' wiring table and the deck.
props = (file in ../props, vr, headR, the kind in js/heroes2.js, where it goes in art/[, the scale it is drawn at inside its
box]). vr is the kind's own (heroes2.js); headR is the one to give the kind with its `art` (A2/props12.py game_size)."""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / "A2"))
import props12

H = (22, 56)   # a hero's vr and headR


def P(name, kind, art):
    """(file, vr, the headR for the kind, kind, where in art/, the scale it is drawn at inside its box)."""
    vr, hr, k = props12.game_size(name)
    return (f"{name}.svg", vr, hr, kind, art, k)


GROUPS = [
    dict(id="haymaker", hero="haymaker", title="The Haymaker: his hay bale", label="the Haymaker, and the hay bale",
         props=[P("haybale", "haybale", "summons/haybale.svg")]),
    dict(id="shaman", hero="shaman", title="The Shaman: the totem and the three ancestor spirits",
         label="the Shaman; the totem; the spirit bear, eagle and beaver (the game draws them see-through)",
         props=[P("totem", "totem", "summons/totem.svg"), P("spirit-bear", "spiritBear", "summons/spirit-bear.svg"),
                P("spirit-eagle", "spiritEagle", "summons/spirit-eagle.svg"), P("spirit-beaver", "spiritBeaver", "summons/spirit-beaver.svg")]),
    dict(id="alchemist", hero="alchemist", title="The Alchemist: the cauldron", label="the Alchemist, and the cauldron",
         props=[P("cauldron", "cauldron", "summons/cauldron.svg")]),
    dict(id="warlock", hero="warlock", title="The Warlock: his imp, and his demon form",
         label="the Warlock; his own imp; his demon form",
         props=[P("warlock-imp", "warlockImp", "summons/warlock-imp.svg"), ("hero-warlock-demon.svg", *H, "(demon form)", "heroes/r12/warlock-demon.svg")]),
    dict(id="beekeeper", hero="beekeeper", title="The Beekeeper: the hive", label="the Beekeeper, and the hive",
         props=[P("beehive", "beehive", "summons/beehive.svg")]),
    dict(id="quartermaster", hero="quartermaster", title="The Quartermaster: the supply crate and the barricade",
         label="the Quartermaster; the supply crate; the barricade; the barricade with its spikes",
         props=[P("supply-crate", "crate", "summons/supply-crate.svg"), P("barricade", "barricade", "summons/barricade.svg"),
                P("barricade-spiked", "barricade (u.spikes)", "summons/barricade-spiked.svg")]),
    dict(id="crossbowman", hero="crossbowman", title="The Crossbowman: the pavise", label="the Crossbowman, and the pavise",
         props=[P("pavise", "pavise", "summons/pavise.svg")]),
    dict(id="grenadier", hero="grenadier", title="The Grenadier: the big bomb", label="the Grenadier, and the big bomb",
         props=[P("big-bomb", "bigBomb", "summons/big-bomb.svg")]),
    dict(id="engineer", hero="engineer", title="The Engineer: the four towers and the two drones",
         label="the Engineer; the torcher, the tesla tower, the snowball mortar, the medbay; the med drone and the wind-up drone",
         props=[P("engineer-torcher", "torcher", "summons/engineer-torcher.svg"), P("engineer-tesla", "tesla", "summons/engineer-tesla.svg"),
                P("engineer-mortar", "mortar", "summons/engineer-mortar.svg"), P("engineer-medbay", "medbay", "summons/engineer-medbay.svg"),
                P("engineer-med-drone", "medDrone", "summons/engineer-med-drone.svg"), P("engineer-windup", "windup", "summons/engineer-windup.svg")]),
    # ---- the heroes' own weapon hands: the hero as it is in the game, then the new file
    dict(id="bearskin", hero="bearskin", title="Bearskin: the paws on his hands, a new club", label="Bearskin now; with the paws on his hands and the new club",
         props=[("hero-bearskin.svg", *H, "bearskin", "heroes/r12/bearskin.svg")]),
    dict(id="warhelm", hero="warhelm", title="Warhelm: the hammer as its own part", label="Warhelm now; the same, split (nothing moves); the hammer alone",
         props=[("hero-warhelm.svg", *H, "warhelm", "heroes/r12/warhelm.svg"), ("warhelm-hammer.svg", *H, "(the flying hammer)", "heroes/r12/warhelm-hammer.svg")]),
    dict(id="bulwark", hero="bulwark", title="Bulwark: the spear held further back", label="Bulwark now; holding the spear further from its tip",
         props=[("hero-bulwark.svg", *H, "bulwark", "heroes/r12/bulwark.svg")]),
    dict(id="valkyrie", hero="valkyrie", title="Valkyrie: the spear held at the shaft", label="Valkyrie now; holding the spear at the shaft, in front",
         props=[("hero-valkyrie.svg", *H, "valkyrie", "heroes/r12/valkyrie.svg")]),
    dict(id="samurai", hero="samurai", title="Samurai: the katana in both hands", label="Samurai now; the katana in both hands, in front",
         props=[("hero-samurai.svg", *H, "samurai", "heroes/r12/samurai.svg")]),
    dict(id="trapper", hero="trapper", title="Trapper: a shotgun, the trap on his hip", label="Trapper now; a shotgun in both hands, the trap on his back hip",
         props=[("hero-trapper.svg", *H, "trapper", "heroes/r12/trapper.svg")]),
]
