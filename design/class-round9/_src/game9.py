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
