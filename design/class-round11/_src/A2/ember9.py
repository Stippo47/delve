"""Round 9: real art for the Ember Deep's stand-ins (docs/ART-NEEDED.md), A2 style: the fire spider, the hellhound, the
fire spirit and the Pit Lord (floor 2's mini-boss, which wore the round-5 demon). The cinder bat is built on the round-7
bat the designer picked, in ../E3/ember9e.py.
python ember9.py [name ...]   -> ../../enemies/ember-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *

GLOW = ('<radialGradient id="gEmber" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF2A0"/>'
        '<stop offset="0.45" stop-color="#FFA23A"/><stop offset="1" stop-color="#E8542A" stop-opacity="0"/></radialGradient>')


# ================================================================== fire spider
FIRE_SPIDER = dict(body="#3E3438", leg="#332B30", fang="#FFB24A")


def fire_spider():
    S = Sprite("FIRE SPIDER (round 9): the frost spider's build (round abdomen, small head, two fangs, four smooth jointed "
               "legs a side) as a spider of the pit: coal black, every knee glowing orange like a coal, a glowing orange "
               "hourglass and cracks on the abdomen, orange-hot fangs. No eyes. Parts: #back (abdomen and the six back "
               "legs, sways), #arm-l / #arm-r (the front legs, they strike), #body (head and fangs). " + LAYOUT)
    S.add_def(GLOW)

    def mark(S):
        cracks = strokes("M 100 22 L 96 36 L 104 44 M 64 52 L 76 58 L 72 70 M 136 52 L 124 58 L 128 70 M 82 94 L 90 86 "
                         "M 118 94 L 110 86", "#FF8A3D", 3, 0.85)
        hourglass = f'<path d="M 86 40 L 114 40 L 104 58 L 114 76 L 86 76 L 96 58 Z" fill="url(#gEmber)" opacity="0.6" transform="translate(100 58) scale(1.5) translate(-100 -58)"/>'
        return (hourglass + cracks + '<path d="M 88 42 L 112 42 L 103 58 L 112 74 L 88 74 L 97 58 Z" fill="#FF9A3D"/>'
                '<path d="M 93 46 L 107 46 L 101 58 L 107 70 L 93 70 L 99 58 Z" fill="#FFE27A"/>')

    def joint(x, y):
        return f'<circle cx="{f(x)}" cy="{f(y)}" r="13" fill="url(#gEmber)"/><circle cx="{f(x)}" cy="{f(y)}" r="4" fill="#FFF2A0"/>'
    spider9(S, FIRE_SPIDER, mark=mark, joint=joint)
    return save("enemies", "ember-fire-spider", S)


# ================================================================== hellhound
HELLHOUND = dict(fur="#332D34", snout="#3F373F", stripe="#F07A34", muzzle="#4C4044", tip="#332D34", ruff="#332D34")


def hellhound():
    S = Sprite("HELLHOUND (round 9): the round-8 wolf made a hound of the pit: lean (a narrower capsule), coal black, a "
               "burning mane of flame tongues streaming back over the neck and shoulders, its tail ending in a flame, an "
               "ember-orange stripe down the snout, dark red inner ears, bone claws. No eyes. Parts: #back (tail, "
               "sways), #body, #arm-l / #arm-r (front paws, swing to walk). " + LAYOUT)
    S.add_def(FLAME_DEF)

    def mane(S, Y):
        S.shape(tufts(100, 110 + Y, 58, 12, 0.42, 0, 1.06, 0.9, 0.75, sweep=36), fill="url(#gFlameUp)", shadow=3, side=False)
        S.shape(tufts(100, 114 + Y, 46, 10, 0.36, 9, 1.04, 0.9, 0.75, sweep=32), "#FFC650", shadow=0, side=False)

    def tail_tip(S, Y, tw):
        d, T = flame(100, 10 + Y, 180, 28, tw + 4)
        S.shape(d, fill="url(#gFlameUp)", T=T, shadow=0, side=False)
        d2, T2 = flame(100, 6 + Y, 180, 16, tw - 3)
        S.shape(d2, "#FFD25A", T=T2, shadow=0, side=False)
    wolf9(S, HELLHOUND, hw=34, mane=mane, tail_tip=tail_tip, ear_in="#8E3A2A", claw="#EADFCB", stripe_op=0.85)
    return save("enemies", "ember-hellhound", S)


def fire_spirit():
    S = spirit9("fire", "Fire Spirit", "fire: a flame-orange core with a pale flame in it, an orange-red tail.")
    return save("enemies", "ember-spirit", S)


# ================================================================== the Pit Lord
PIT_FACE = ('<linearGradient id="gFacePit" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
            '<stop offset="0" stop-color="#7A2420"/><stop offset="0.2" stop-color="#A8402E"/><stop offset="0.45" stop-color="#D2604A"/>'
            '<stop offset="0.85" stop-color="#D8664E"/><stop offset="1" stop-color="#BC5242"/></linearGradient>'
            '<radialGradient id="gHandPit" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#C85448"/>'
            '<stop offset="1" stop-color="#8E2C26"/></radialGradient>')
SKIN, DSKIN, HORN, IRON = "#B23C34", "#6E1E1E", "#3A3034", "#3E383E"


def horn(S, s):
    """A great horn from the temple: out to the side, then sweeping back, ridged, pale at the tip."""
    pts = [(100 + s * 34, 74), (100 + s * 58, 60), (100 + s * 76, 40), (100 + s * 80, 16), (100 + s * 72, -4)]
    S.shape(taper(pts, 26, 4, 0.75), HORN, shadow=3,
            decor=strokes(f"M {100 + s * 48} 56 L {100 + s * 54} 72 M {100 + s * 62} 46 L {100 + s * 72} 58 "
                          f"M {100 + s * 70} 30 L {100 + s * 82} 36", "#5E5258", 3, 0.8)
                  + f'<path d="{circ(100 + s * 74, 2, 9)}" fill="#C9B8A8" opacity="0.8"/>')


def pit_lord():
    S = Sprite("THE PIT LORD (round 9): the Ember Deep's lord of the pit, a big demon in the heroes' bust build: dark red "
               "skin, no eyes; two great black ridged horns from the temples sweeping out and back; a grim mouth with two "
               "fangs; a dark scalp coming to a point on the brow; broad shoulders under black iron pauldrons with spikes, their edges glowing like a forge, molten cracks on the arms; "
               "two folded wings of dark red membrane behind (#back, sway); a whip of fire in the right hand (arm-r: the "
               "handle in the fist, the burning lash curving forward), a big clawed left hand (arm-l). " + LAYOUT)
    S.add_def(PIT_FACE + FLAME_DEF)
    # ---- folded wings behind the shoulders
    S.group("back", (100, 90), "folded wings")
    for s in (-1, 1):
        wing = blob([(100 + s * 30, 96), (100 + s * 44, 70), (100 + s * 62, 34), (100 + s * 72, 2), (100 + s * 84, 30),
                     (100 + s * 92, 52), (100 + s * 86, 76), (100 + s * 70, 98)], 0.75)
        S.shape(wing, "#6E2A2E", shadow=0,
                decor=strokes(f"M {100 + s * 40} 92 L {100 + s * 70} 6 M {100 + s * 50} 90 L {100 + s * 88} 44", "#2E2228", 5, 0.9))
    # ---- the whip of fire (right)
    S.group("arm-r", (154, 108), "whip of fire")
    # the handle in the fist below the shoulder, the burning lash lying forward and curling in across the front
    T = frame(170, 144, 0)
    lash = taper([(0, 10), (7, 32), (-4, 50), (-26, 58), (-50, 56)], 13, 5, 0.8)
    S.shape(lash, fill="url(#gFlameUp)", T=T, shadow=0, side=False,
            decor=f'<path d="{taper([(0, 14), (6, 32), (-4, 48), (-24, 55)], 4, 2, 0.8)}" fill="#FFE27A"/>')
    d, Tf = flame(-48, 56, 90, 22, 10)
    S.shape(d, fill="url(#gFlameUp)", T=f"{T} {Tf}", shadow=0, side=False)
    S.shape(rr(0, -8, 11, 30, 4), "#3A2A26", T=T, shadow=2)
    S.shape(rr(0, 8, 16, 7, 3), IRON, T=T, shadow=1)
    fist(S, 0, -6, T=T, w=24, h=27, hand="url(#gHandPit)")
    # ---- the body
    S.group("body")
    S.shape("M10 110 C10 80 48 70 100 70 C152 70 190 80 190 110 C190 138 152 146 100 146 C48 146 10 138 10 110 Z", SKIN,
            decor=strokes("M 30 100 L 40 112 L 36 124 M 170 100 L 160 112 L 164 124 M 54 132 L 62 122", "#FF8A3D", 3, 0.7))
    for s in (-1, 1):
        pad = blob([(100 + s * 40, 80), (100 + s * 70, 76), (100 + s * 92, 92), (100 + s * 94, 116), (100 + s * 78, 128),
                    (100 + s * 52, 122), (100 + s * 40, 102)], 0.85)
        S.shape(pad, IRON, shadow=4, decor=f'<path d="{ell(100 + s * 62, 90, 16, 7)}" fill="#7A7280" opacity="0.45"/>'
                + strokes(f"M {100 + s * 46} 120 Q {100 + s * 76} 132 {100 + s * 93} 112", "#FF7A30", 3.5, 0.75))
        for x, y, h in ((100 + s * 60, 84, 20), (100 + s * 80, 92, 17)):
            S.shape(poly([(x - 7, y + 4), (x + 7, y + 4), (x + s * 5, y - h)]), "#24202A", shadow=2, side=False)
    for s in (-1, 1):
        horn(S, s)
    head(S, face="url(#gFacePit)")
    S.shape("M53 96 C52 66 72 46 100 46 C128 46 148 66 147 96 C138 90 118 88 108 92 L 100 104 L 92 92 C82 88 62 90 53 96 Z",
            DSKIN, shadow=3)
    S.raw('<path d="M80 136 Q100 143 120 136" fill="none" stroke="#4A1414" stroke-width="3.4" stroke-linecap="round"/>')
    for x in (88, 112):
        S.shape(poly([(x - 4, 136.5), (x + 4, 137.5), (x, 147)]), "#F4EBD8", shadow=0, side=False)
    # ---- the clawed left hand
    S.group("arm-l", (46, 108), "clawed hand")
    for dx in (-9, 0, 9):
        S.shape(poly([(36 + dx - 4.5, 152), (36 + dx + 4.5, 152), (36 + dx * 1.25, 170)]), "#2E2428", shadow=0, side=False)
    fist(S, 36, 144, -6, w=26, h=30, hand="url(#gHandPit)")
    return save("enemies", "ember-pit-lord", S)


BUILD = {"ember-fire-spider": fire_spider, "ember-hellhound": hellhound, "ember-spirit": fire_spirit, "ember-pit-lord": pit_lord}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
