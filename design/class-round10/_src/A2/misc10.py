"""Round 10, from the designer's message of 2026-11-22: "make the sword enemy much bigger. Like 3 units across in size":
the Spire's sun blade drawn again to be seen at that size (three heroes long in the game: js/foes10.js vr 52, headR 58:
the sword's 200 units are 179 room units, three hero-widths), balanced on the middle of its length
so it turns about its own middle.
python misc10.py [name ...]   -> ../../enemies/spire-sun-blade.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *

DEFS = ('<linearGradient id="gSunBlade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFBE6"/>'
        '<stop offset="0.5" stop-color="#F8D868"/><stop offset="0.5" stop-color="#E8B43A"/><stop offset="1" stop-color="#C88A22"/></linearGradient>'
        '<radialGradient id="gSunDisc" cx="0.4" cy="0.36" r="0.7"><stop offset="0" stop-color="#FFFFFF"/>'
        '<stop offset="0.5" stop-color="#FFE98A"/><stop offset="1" stop-color="#F2B53A"/></radialGradient>')


def sun_blade():
    S = Sprite("SUN BLADE (round 10: \"much bigger. Like 3 units across\"): a great floating golden sword of the host seen "
               "from above, drawn to be three heroes long in the game and balanced on its middle (it turns about the "
               "middle of its length): a long broad blade, point forward, split light and dark down a fuller cut with a "
               "row of small suns, pale glowing edges; a wide crossguard like a pair of gold wings with a sun disc and "
               "twelve rays at its heart; a grip bound in white, a sun for a pommel. No hands. Parts: #body only (it "
               "turns whole). " + LAYOUT)
    S.add_def(DEFS)
    S.group("body")
    # the grip and pommel (behind the guard: towards -y)
    S.shape(rr(100, 28, 13, 34, 5), "#F4EFE4", shadow=0, decor=strokes("M 93 18 L 107 22 M 93 26 L 107 30 M 93 34 L 107 38", "#C9BCA0", 3, 0.9))
    S.shape(poly(star(100, 10, 13, 8.5, 8, 22.5)), GOLD, shadow=0, decor='<circle cx="100" cy="10" r="6" fill="#FFF2C0"/>')
    # the blade: from the guard (y 50) to the point (y 200), widest just past the guard
    S.shape(poly([(100 - 21, 50), (100 + 21, 50), (100 + 23, 66), (100 + 19, 158), (100, 200), (100 - 19, 158), (100 - 23, 66)]),
            fill="url(#gSunBlade)", shadow=0, side=False,
            decor=strokes("M 82 58 L 85 156 L 100 190 L 115 156 L 118 58", "#FFFFFF", 3.5, 0.75)
                  + f'<rect x="96" y="56" width="8" height="112" rx="4" fill="#B87A1E" opacity="0.55"/>'
                  + "".join(f'<path d="{poly(star(100, y, 5.2, 2.6, 8, 0))}" fill="#FFF6D0"/>' for y in range(70, 160, 22)))
    # the crossguard: two gold wings, three feathers' scallops each, curving a little forward at the tips
    for s in (-1, 1):
        g = [(100 + s * 8, 40), (100 + s * 30, 34), (100 + s * 54, 36), (100 + s * 70, 46), (100 + s * 62, 54), (100 + s * 66, 62),
             (100 + s * 52, 62), (100 + s * 50, 70), (100 + s * 36, 64), (100 + s * 30, 70), (100 + s * 10, 62)]
        S.shape(blob(g, 0.7), GOLD, shadow=3, decor=strokes(f"M {100 + s * 12} 48 Q {100 + s * 36} 40 {100 + s * 62} 48", "#FFF2C0", 3.5, 0.9))
    # the sun at the heart of the guard
    S.shape(poly(star(100, 50, 25, 15, 12, 0)), "#F2B53A", shadow=3)
    S.shape(circ(100, 50, 14), fill="url(#gSunDisc)", shadow=2, side=False)
    return save("enemies", "spire-sun-blade", S)


BUILD = {"spire-sun-blade": sun_blade}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
