"""Copy the round-9 designs the game uses into art/ (each with a comment saying where it comes from). The defs that point
at them (js/foes10.js, js/dunes.js, js/foundry.js, js/boss-*.js) say art, headR and, where it changed, the size.
python game9.py   (paths relative to this file)"""
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
R9 = HERE.parent
ROOT = HERE.parents[2]
ART = ROOT / "art"

COPIES = [
    # the Frost Hollow
    ("enemies/frost-wolf.svg", "enemies/frost-wolf.svg"),
    ("enemies/frost-ice-slime.svg", "enemies/ice-slime.svg"),
    ("enemies/frost-spider.svg", "enemies/frost-spider.svg"),
    ("enemies/frost-yeti.svg", "enemies/yeti.svg"),
    ("props/yeti-snowball.svg", "props/yeti-snowball.svg"),
    ("enemies/frost-icicle-wraith.svg", "enemies/icicle-wraith.svg"),
    ("enemies/frost-spirit.svg", "enemies/spirit-frost.svg"),
    # the Ember Deep
    ("enemies/ember-fire-spider.svg", "enemies/fire-spider.svg"),
    ("enemies/ember-hellhound.svg", "enemies/hellhound.svg"),
    ("enemies/ember-cinder-bat.svg", "enemies/cinder-bat.svg"),
    ("enemies/ember-spirit.svg", "enemies/spirit-fire.svg"),
    ("enemies/ember-pit-lord.svg", "enemies/pit-lord.svg"),
    # the Gilded Spire
    ("enemies/spire-fallen-angel.svg", "enemies/fallen-angel.svg"),
    ("enemies/spire-sun-blade.svg", "enemies/sun-blade.svg"),
    ("enemies/spire-choir-sprite.svg", "enemies/choir-sprite.svg"),
    ("enemies/spire-golem.svg", "enemies/golem.svg"),
    ("enemies/spire-gilded-golem.svg", "enemies/gilded-golem.svg"),
    ("enemies/spire-light-spirit.svg", "enemies/spirit-heal.svg"),
    ("enemies/spire-ward-spirit.svg", "enemies/spirit-ward.svg"),
    ("enemies/spire-herald-light.svg", "enemies/herald-light.svg"),
    ("enemies/spire-herald-fallen.svg", "enemies/herald-fallen.svg"),
    # the Sunken Dunes
    ("enemies/dunes-scarab.svg", "enemies/scarab.svg"),
    ("enemies/dunes-cobra.svg", "enemies/cobra.svg"),
    ("enemies/dunes-jackal.svg", "enemies/jackal.svg"),
    ("enemies/dunes-mummy.svg", "enemies/mummy.svg"),
    ("enemies/dunes-sand-mage.svg", "enemies/sand-mage.svg"),
    ("enemies/dunes-dust-devil.svg", "enemies/dust-devil.svg"),
    ("enemies/dunes-serpent-head.svg", "enemies/serpent-head.svg"),
    ("enemies/dunes-serpent-coil.svg", "enemies/serpent-coil.svg"),
    ("enemies/dunes-dart-trap.svg", "enemies/dart-trap.svg"),
    ("enemies/dunes-venom-spirit.svg", "enemies/spirit-poison.svg"),
    ("enemies/dunes-wind-spirit.svg", "enemies/spirit-haste.svg"),
    # the Clockwork Foundry
    ("enemies/foundry-gear-sprite.svg", "enemies/gear-sprite.svg"),
    ("enemies/foundry-cog-sprite.svg", "enemies/cog-sprite.svg"),
    ("enemies/foundry-bomb-bot.svg", "enemies/bomb-bot.svg"),
    ("enemies/foundry-automaton.svg", "enemies/automaton.svg"),
    ("enemies/foundry-turret-steam.svg", "enemies/turret-steam.svg"),
    ("enemies/foundry-turret-flame.svg", "enemies/turret-flame.svg"),
    ("enemies/foundry-turret-gun.svg", "enemies/turret-gun.svg"),
    ("enemies/foundry-turret-laser.svg", "enemies/turret-laser.svg"),
    ("enemies/foundry-mortar.svg", "enemies/mortar.svg"),
    ("enemies/foundry-tesla-coil.svg", "enemies/tesla-coil.svg"),
    ("enemies/foundry-repair-drone.svg", "enemies/repair-drone.svg"),
    ("enemies/foundry-smith.svg", "enemies/smith.svg"),
    ("enemies/foundry-bee.svg", "enemies/bee.svg"),
    ("enemies/foundry-wasp.svg", "enemies/wasp.svg"),
    ("enemies/foundry-hornet.svg", "enemies/hornet.svg"),
    ("enemies/foundry-saw-blade.svg", "enemies/saw-blade.svg"),
    ("enemies/foundry-crawler-head.svg", "enemies/crawler-head.svg"),
    ("enemies/foundry-crawler-plate.svg", "enemies/crawler-plate.svg"),
    ("enemies/foundry-drill-bot.svg", "enemies/drill-bot.svg"),
    ("enemies/foundry-storm-spirit.svg", "enemies/spirit-shock.svg"),
]

if __name__ == "__main__":
    for src, dst in COPIES:
        text = (R9 / src).read_text(encoding="utf-8")
        note = f"<!-- GAME COPY (art round 9) of design/class-round9/{src} -->"
        i = text.index(">") + 1
        text = text[:i] + "\n" + note + text[i:]
        out = ART / dst
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        print(f"art/{dst} <- {src}")
