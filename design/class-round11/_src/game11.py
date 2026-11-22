"""Copy the round-11 designs that go into the game into art/ (each with a comment saying where it comes from): the picks
as picked, the picks with their change, and the single fixes. Where a note asked for variants, or said "Try again" or
"Meh", the game keeps its current art until one is picked (the bandits among them are copied only so that they lose the
line in the bandanna: "Remove them for everyone"). The js changes that go with these are listed in notes.md.
python game11.py   (paths relative to this file)"""
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
R11 = HERE.parent
DESIGN = R11.parent
ROOT = HERE.parents[2]
ART = ROOT / "art"
R10 = "class-round10/"
R = "class-round11/"

COPIES = [
    # ---- picks, as picked (round 10's files)
    (R10 + "enemies/ghost-a-tail-point.svg", "enemies/ghost.svg"),            # Ghost A: "Do 1"
    (R10 + "enemies/ghost-b-tail-point.svg", "enemies/ghost-b.svg"),          # Ghost B: "1" (the file is not used by a kind yet)
    (R10 + "enemies/wild-elder-ent-face-nose.svg", "enemies/elder-ent.svg"),  # the Elder Ent: "B"
    (R10 + "enemies/wild-boar-ridge.svg", "enemies/boar.svg"),                # the boar: "Ridge."
    # ---- picks with a change
    (R + "enemies/greenskin-troll.svg", "enemies/troll.svg"),                 # head B, its four notes, arms
    (R + "enemies/wild-ent.svg", "enemies/ent.svg"),                          # face B, no mouth, no leaf
    (R + "enemies/wild-wolf.svg", "enemies/wolf.svg"),                        # no paws, head forward, shorter body
    (R + "enemies/wild-wolf.svg", "summons/wolf.svg"),                        # the druid's wolf is the same wolf (it was the same file)
    (R + "enemies/wild-dire-wolf.svg", "enemies/dire-wolf.svg"),              # the same, and "Less spikey"
    (R + "enemies/wild-alpha.svg", "enemies/alpha.svg"),                      # the same, with the claw marks ("Claw marks")
    # ---- fixes: the Wildwood and the Sewers
    (R + "enemies/greenskin-orc.svg", "enemies/orc.svg"),
    (R + "enemies/sewer-croc.svg", "enemies/croc.svg"),
    (R + "enemies/bandit-axe.svg", "enemies/bandit-axe.svg"),
    (R + "enemies/bandit-daggers.svg", "enemies/bandit-daggers.svg"),
    (R + "enemies/bandit-sword.svg", "enemies/bandit.svg"),
    (R + "enemies/bandit-brute.svg", "enemies/bandit-brute.svg"),
    (R + "enemies/bandit-chief.svg", "enemies/bandit-chief.svg"),
    (R + "enemies/bandit-torch.svg", "enemies/bandit-torch.svg"),             # only the bandanna's line gone: a new one waits for a pick
    (R + "enemies/bandit-greatsword.svg", "enemies/bandit-greatsword.svg"),   # the same
    (R + "enemies/bandit-spear.svg", "enemies/bandit-spear.svg"),             # the same
    # ---- fixes: Frost, Spire, Dunes
    (R + "enemies/frost-icicle-wraith.svg", "enemies/icicle-wraith.svg"),
    (R + "enemies/frost-yeti.svg", "enemies/yeti.svg"),
    (R + "enemies/frost-ice-slime.svg", "enemies/ice-slime.svg"),             # headR 49 again (js/foes10.js)
    (R + "enemies/spire-herald-light.svg", "enemies/herald-light.svg"),
    (R + "enemies/spire-herald-fallen.svg", "enemies/herald-fallen.svg"),
    (R + "enemies/spire-seraph.svg", "enemies/seraph.svg"),
    (R + "enemies/dunes-cobra.svg", "enemies/cobra.svg"),                     # with js/dunes.js sway
    (R + "enemies/dunes-serpent-coil.svg", "enemies/serpent-coil.svg"),
    (R + "enemies/dunes-mummy.svg", "enemies/mummy.svg"),                     # "the last one", no button, no arms
    # ---- fixes: the Foundry, the bosses
    (R + "enemies/foundry-bomb-bot.svg", "enemies/bomb-bot.svg"),
    (R + "enemies/foundry-turret-flame.svg", "enemies/turret-flame.svg"),
    (R + "enemies/foundry-turret-laser.svg", "enemies/turret-laser.svg"),
    (R + "enemies/foundry-smith.svg", "enemies/smith.svg"),
    (R + "enemies/foundry-saw-blade.svg", "enemies/saw-blade.svg"),
    (R + "enemies/foundry-tesla-coil.svg", "enemies/tesla-coil.svg"),
    (R + "enemies/boss-goblin-chieftain.svg", "bosses/goblin-chieftain.svg"),
]

if __name__ == "__main__":
    for src, dst in COPIES:
        text = (DESIGN / src).read_text(encoding="utf-8")
        note = f"<!-- GAME COPY (art round 11) of design/{src} -->"
        i = text.index(">") + 1
        text = text[:i] + "\n" + note + text[i:]
        out = ART / dst
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        print(f"art/{dst} <- {src}")
