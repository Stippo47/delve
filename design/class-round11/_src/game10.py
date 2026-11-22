"""Copy the round-10 designs that go into the game into art/ (each with a comment saying where it comes from). Only
single fixes and redraws go in; where the designer asked for variants the game keeps its current art until they pick.
The defs that point at them say art, headR and, where it changed, the size.
python game10.py   (paths relative to this file)"""
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
R10 = HERE.parent
ROOT = HERE.parents[2]
ART = ROOT / "art"

COPIES = [
    # the art-round8 notes
    ("enemies/greenskin-orc.svg", "enemies/orc.svg"),
    ("enemies/sewer-croc.svg", "enemies/croc.svg"),
    ("enemies/bandit-sword.svg", "enemies/bandit.svg"),
    ("enemies/bandit-torch.svg", "enemies/bandit-torch.svg"),
    ("enemies/bandit-greatsword.svg", "enemies/bandit-greatsword.svg"),
    ("enemies/bandit-axe.svg", "enemies/bandit-axe.svg"),
    ("enemies/bandit-spear.svg", "enemies/bandit-spear.svg"),
    ("enemies/bandit-daggers.svg", "enemies/bandit-daggers.svg"),
    ("enemies/bandit-poacher.svg", "enemies/poacher.svg"),
    ("enemies/bandit-brute.svg", "enemies/bandit-brute.svg"),
    ("enemies/bandit-chief.svg", "enemies/bandit-chief.svg"),
    ("enemies/wild-dire-wolf.svg", "enemies/dire-wolf.svg"),
    # the art-round9 notes
    # the spirits' cores without the drawn tail: beside the round-9 files, unused until the game draws the tail (notes.md)
    ("enemies/spirit-core-frost.svg", "enemies/spirit-core-frost.svg"),
    ("enemies/spirit-core-fire.svg", "enemies/spirit-core-fire.svg"),
    ("enemies/spirit-core-heal.svg", "enemies/spirit-core-heal.svg"),
    ("enemies/spirit-core-ward.svg", "enemies/spirit-core-ward.svg"),
    ("enemies/spirit-core-poison.svg", "enemies/spirit-core-poison.svg"),
    ("enemies/spirit-core-haste.svg", "enemies/spirit-core-haste.svg"),
    ("enemies/spirit-core-shock.svg", "enemies/spirit-core-shock.svg"),
    ("enemies/frost-yeti.svg", "enemies/yeti.svg"),
    ("props/yeti-snowball.svg", "props/yeti-snowball.svg"),
    ("enemies/frost-icicle-wraith.svg", "enemies/icicle-wraith.svg"),
    ("enemies/spire-choir-sprite.svg", "enemies/choir-sprite.svg"),
    ("enemies/spire-fallen-angel.svg", "enemies/fallen-angel.svg"),
    ("enemies/spire-herald-light.svg", "enemies/herald-light.svg"),
    ("enemies/spire-herald-fallen.svg", "enemies/herald-fallen.svg"),
    ("enemies/dunes-cobra.svg", "enemies/cobra.svg"),
    ("enemies/dunes-jackal.svg", "enemies/jackal.svg"),
    ("enemies/dunes-mummy.svg", "enemies/mummy.svg"),
    ("enemies/dunes-serpent-head.svg", "enemies/serpent-head.svg"),
    ("enemies/dunes-serpent-coil.svg", "enemies/serpent-coil.svg"),
    ("enemies/foundry-bee.svg", "enemies/bee.svg"),
    ("enemies/foundry-wasp.svg", "enemies/wasp.svg"),
    ("enemies/foundry-hornet.svg", "enemies/hornet.svg"),
    ("enemies/foundry-gear-sprite.svg", "enemies/gear-sprite.svg"),
    ("enemies/foundry-cog-sprite.svg", "enemies/cog-sprite.svg"),
    ("enemies/foundry-turret-gun.svg", "enemies/turret-gun.svg"),
    ("enemies/foundry-turret-steam.svg", "enemies/turret-steam.svg"),
    ("enemies/boss-choir-singer.svg", "bosses/choir-singer.svg"),
    ("enemies/boss-goblin-chieftain.svg", "bosses/goblin-chieftain.svg"),
    ("enemies/boss-gilded-seraph.svg", "bosses/gilded-seraph.svg"),
    # today's message
    ("enemies/spire-sun-blade.svg", "enemies/sun-blade.svg"),
    ("enemies/slime.svg", "enemies/slime.svg"),
    ("enemies/slime-small.svg", "enemies/slime-small.svg"),
    # the second pass: the rest of the Foundry, the kinds with no note that fell short, the Spire's seraph and cherub, the Pit Lord
    ("enemies/foundry-automaton.svg", "enemies/automaton.svg"),
    ("enemies/foundry-bomb-bot.svg", "enemies/bomb-bot.svg"),
    ("enemies/foundry-turret-flame.svg", "enemies/turret-flame.svg"),
    ("enemies/foundry-turret-laser.svg", "enemies/turret-laser.svg"),
    ("enemies/foundry-mortar.svg", "enemies/mortar.svg"),
    ("enemies/foundry-tesla-coil.svg", "enemies/tesla-coil.svg"),
    ("enemies/foundry-repair-drone.svg", "enemies/repair-drone.svg"),
    ("enemies/foundry-saw-blade.svg", "enemies/saw-blade.svg"),
    ("enemies/foundry-crawler-head.svg", "enemies/crawler-head.svg"),
    ("enemies/foundry-crawler-plate.svg", "enemies/crawler-plate.svg"),
    ("enemies/foundry-drill-bot.svg", "enemies/drill-bot.svg"),
    ("enemies/foundry-smith.svg", "enemies/smith.svg"),
    ("enemies/frost-ice-slime.svg", "enemies/ice-slime.svg"),
    ("enemies/dunes-sand-mage.svg", "enemies/sand-mage.svg"),
    ("enemies/dunes-dart-trap.svg", "enemies/dart-trap.svg"),
    ("enemies/spire-seraph.svg", "enemies/seraph.svg"),
    ("enemies/spire-cherub.svg", "enemies/cherub.svg"),
    ("enemies/ember-pit-lord.svg", "enemies/pit-lord.svg"),
]

if __name__ == "__main__":
    for src, dst in COPIES:
        if not (R10 / src).exists():
            continue
        text = (R10 / src).read_text(encoding="utf-8")
        note = f"<!-- GAME COPY (art round 10) of design/class-round10/{src} -->"
        i = text.index(">") + 1
        text = text[:i] + "\n" + note + text[i:]
        out = ART / dst
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        print(f"art/{dst} <- {src}")
