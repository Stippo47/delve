"""Round 5 angel: the round-4 angel ("good except crown") with the gold ring over the hair removed.
  a: no halo at all; b: a thin pale halo standing up behind the head (only its top arc shows past the hair).
python angel.py   (reads ../../../class-round4/monsters/celestial-angel.svg, writes ../../enemies/celestial-angel-a/b.svg)
"""
import pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parents[2] / "class-round4" / "monsters" / "celestial-angel.svg"
OUT = HERE.parents[1] / "enemies"

s = SRC.read_text(encoding="utf-8")
lines = [l for l in s.splitlines() if not re.search(r'href="#p45"', l)]
a = "\n".join(lines) + "\n"
a = a.replace("a gold halo ring over brown hair", "brown hair, no halo (round 5: the ring over the hair read as a crown)")
(OUT / "celestial-angel-a.svg").write_text(a, encoding="utf-8")

halo = ('<g><path d="M52 40 A48 15 0 1 0 148 40 A48 15 0 1 0 52 40 Z M59 40 A41 9.5 0 1 1 141 40 A41 9.5 0 1 1 59 40 Z" '
        'fill="url(#gHalo)"/></g>')
b = a.replace("brown hair, no halo (round 5: the ring over the hair read as a crown)",
              "brown hair; a thin pale halo standing up behind the head instead of the ring over the hair (round 5)")
b = b.replace("</defs>", '<linearGradient id="gHalo" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#FFF8D8"/>'
              '<stop offset="1" stop-color="#F0C860"/></linearGradient></defs>', 1)
i = b.index('<g id="arm-r"')
b = b[:i] + '<g id="halo">' + halo + '</g>\n' + b[i:]
(OUT / "celestial-angel-b.svg").write_text(b, encoding="utf-8")
print("ok")
