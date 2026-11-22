"""Round 12, section C: the summons and props the newer heroes' abilities brought in, which the game draws in code
(js/fx2.js LOOK2.<kind>) or borrows (docs/ART-NEEDED.md, "Round 13 (lane H2, the newer heroes): drawn in code or
borrowed"). One design each, in the props' and enemies' build: one ink outline from the filter, each shape lit from the
top left with a darker right side and a contact shadow on what lies under it. Front = +y; a thing that stands (the
totem, the pavise) is drawn the way the heroes' staffs and shields are: its foot at the front, its top leaning back.
The game is not wired to these: notes.md says which file replaces which code-drawn thing, and the headR to give it.
python props12.py [name ...]   -> ../../props/<name>.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from kit12 import *

PROP = "One part (#body) unless said. Front = DOWN (+y), centre (100,100); the outline comes from the #outline filter."

# name -> (the kind's vr in js/heroes2.js, the headR the design was drawn for: the 220 box spans vr * 220 / headR room
# units, which makes the sprite the size of the thing the game draws in code today).
SIZES = {"haybale": (30, 76), "totem": (26, 78), "spirit-bear": (26, 78), "spirit-eagle": (22, 70), "spirit-beaver": (20, 73),
         "cauldron": (24, 86), "warlock-imp": (16, 44), "beehive": (22, 86), "supply-crate": (22, 90), "barricade": (34, 57),
         "barricade-spiked": (34, 57), "pavise": (26, 64), "big-bomb": (20, 89), "engineer-torcher": (26, 87), "engineer-tesla": (24, 87),
         "engineer-mortar": (24, 87), "engineer-medbay": (24, 87), "engineer-med-drone": (14, 84), "engineer-windup": (14, 90)}
HERO_K = 22 / 56


def game_size(name):
    """(vr, the headR to give the kind, the scale the design is drawn at inside its box). A prop is smaller on screen than
    a hero's 220 box, so drawn to fill the box its outline would come out thinner than the heroes' (the designer:
    "the gaper in this pic has big outlines"). So, like the Mob's peasants, it is drawn small inside the box (every part
    carries the scale) and the game draws the box at the heroes' scale: headR = vr x 56 / 22."""
    vr, hr = SIZES[name]
    k = (vr / hr) / HERO_K
    if abs(k - 1) < 0.08 or k > 1:
        return vr, hr, 1.0
    return vr, round(vr / HERO_K), round(k, 3)


def line_of(name):
    """A prop the game draws bigger than a hero's box (the barricade, half as wide again) can't be drawn small inside it:
    it asks for a thinner outline instead (data-line, as the gaper does), the heroes' weight on screen."""
    vr, hr = SIZES[name]
    k = (vr / hr) / HERO_K
    return round(6 / k, 2) if k > 1.08 else 6


class Prop(Sprite):
    def __init__(self, name, comment):
        self.name = name
        vr, hr, self.k = game_size(name)
        tail = (f" Drawn at {self.k} of the box (each part carries the scale; pivots are in the box's own frame), so its outline is "
                f"the heroes' weight: give the kind headR {hr} (vr {vr}).") if self.k != 1 else f" Give the kind headR {hr} (vr {vr})."
        line = line_of(name)
        if line != 6:
            tail = f" Its outline is {line} units (data-line), the heroes' weight at this size:" + tail.replace(" Give", " give")
        super().__init__(comment + tail, line=line)

    def group(self, gid, pivot=None, note="", T=None):
        k = self.k
        if k == 1:
            return super().group(gid, pivot, note)
        pv = (round(100 + (pivot[0] - 100) * k, 1), round(100 + (pivot[1] - 100) * k, 1)) if pivot else None
        super().group(gid, pv, note, T=scl(k, 100, 100))
SP0, SP1, SP2, SPD = "#5FB8E8", "#9FE4FF", "#DDF6FF", "#2E6A9A"     # the ancestors' light blue (fx2.js SPIRIT) and a dark for noses


# ================================================================== the Haymaker
def haybale():
    S = Prop("haybale", "HAY BALE (the Haymaker's; round 12): a rolled bale lying across its way, seen from above: straw wound round it, "
               "two bands of twine, shaggy ends. It rolls towards +y. " + PROP)
    STRAW = "#E2BE58"
    S.group("body")
    for s in (-1, 1):   # the shaggy ends
        pts = [(100 + s * 70, 44)] + [(100 + s * (88 if i % 2 else 80), 50 + i * 12.5) for i in range(9)] + [(100 + s * 70, 156)]
        S.shape(poly(pts), shade(STRAW, 0.8), shadow=0)
    lines = ("M 28 62 Q 100 56 172 62 M 24 100 Q 100 94 176 100 M 28 138 Q 100 132 172 138", "M 26 80 Q 100 75 174 80 M 26 120 Q 100 114 174 120")
    S.shape(rr(100, 100, 156, 122, 36), STRAW, shadow=0,
            decor=strokes(lines[0], "#B88E2E", 3.6, 0.6) + strokes(lines[1], "#F6E6A0", 3.6, 0.7) + hi(70, 58, 30, 9, 0.3))
    for x in (64, 136):
        S.shape(rr(x, 100, 9, 126, 3), "#8A6A2A", shadow=2)
    return save("props", "haybale", S)


# ================================================================== the Shaman
def totem():
    TERRA, TEAL, BONE, WD = "#E07A44", "#2FB3A4", "#F4EEDC", "#A0705A"
    S = Prop("totem", "TOTEM (the Shaman's; round 12): a carved, painted spirit pole, the big brother of the one on his back: an eagle's "
               "head with spread teal wings on top, a terracotta face under it, a wooden bear's face at the foot. It stands: its "
               "foot at the front, its top leaning back. " + PROP)
    S.group("body")
    wing = [(100, 50), (74, 28), (42, 16), (10, 20), (22, 32), (12, 44), (30, 48), (26, 60), (48, 58), (58, 68), (100, 66)]
    for pts in (wing, mirror(wing)):
        k = 1 if pts is wing else -1
        S.shape(blob(pts, 0.5), TEAL, shadow=0,
                decor=f'<path d="{blob([(100 - k * 94, 14), (100 - k * 62, 18), (100 - k * 68, 62), (100 - k * 96, 50)], 0.6)}" fill="{BONE}"/>'
                      + strokes(f"M {100 - k * 30} 36 L {100 - k * 40} 58 M {100 - k * 48} 26 L {100 - k * 56} 54", "#1E7A70", 3.4, 0.7))
    S.shape(ell(100, 188, 36, 11), shade(WD, 0.62), shadow=0)
    S.shape(rr(100, 156, 58, 62, 10), WD, shadow=0,
            decor=f'<rect x="78" y="144" width="12" height="9" rx="2" fill="{BONE}"/><rect x="110" y="144" width="12" height="9" rx="2" fill="{BONE}"/>'
                  f'<path d="{poly([(80, 166), (120, 166), (116, 176), (110, 168), (104, 176), (100, 168), (96, 176), (90, 168), (84, 176)])}" fill="{BONE}"/>'
                  + strokes("M 100 128 L 100 142", shade(WD, 0.6), 4, 0.6))
    S.shape(rr(100, 122, 66, 13, 5), TEAL, shadow=2)
    S.shape(rr(100, 94, 62, 48, 10), TERRA, shadow=2,
            decor=f'<circle cx="84" cy="90" r="8.5" fill="{BONE}"/><circle cx="116" cy="90" r="8.5" fill="{BONE}"/>'
                  f'<circle cx="84" cy="90" r="4" fill="{TEAL}"/><circle cx="116" cy="90" r="4" fill="{TEAL}"/>'
                  f'<rect x="84" y="104" width="32" height="6" rx="2.5" fill="#8A3A1A" opacity="0.7"/>')
    S.shape(rr(100, 68, 66, 11, 5), BONE, shadow=2)
    S.shape(blob([(72, 62), (70, 34), (84, 20), (100, 16), (116, 20), (130, 34), (128, 62)], 0.7), shade(TERRA, 0.86), shadow=2,
            decor=f'<rect x="60" y="26" width="80" height="8" fill="{TEAL}"/>')
    S.shape(poly([(88, 44), (112, 44), (100, 76)]), GOLD, shadow=2, decor=f'<path d="{poly([(100, 44), (112, 44), (100, 76)])}" fill="#B8862A" opacity="0.5"/>')
    return save("props", "totem", S)


def swirl(x, y, r, a0=0):
    return strokes(spiral(x, y, 2, r, 1.4, 36, a0), SP2, 5.5, 0.95)


def spirit_bear():
    S = Prop("spirit-bear", "SPIRIT BEAR (the Shaman's ancestor spirit; round 12): a bear seen from above, head forward, in the ancestors' "
               "pale blue, the spirits' swirl on its back. The game draws it see-through. One of three in one style. " + PROP)
    S.group("body")
    S.shape(circ(100, 26, 12), SP0, shadow=0)
    for s in (-1, 1):
        S.shape(ell(100 + s * 46, 50, 18, 22), SP0, shadow=0)
        S.shape(ell(100 + s * 52, 136, 18, 24), SP0, shadow=0,
                decor=strokes(f"M {100 + s * 46} 152 L {100 + s * 46} 160 M {100 + s * 54} 153 L {100 + s * 54} 161", SP2, 3, 0.9))
    S.shape(ell(100, 90, 62, 64), SP1, shadow=3, decor=swirl(100, 82, 27, 30) + hi(72, 56, 20, 10, 0.3, -30))
    for s in (-1, 1):
        S.shape(circ(100 + s * 30, 130, 14), SP0, shadow=2, decor=f'<circle cx="{100 + s * 30}" cy="130" r="6.5" fill="{SP2}"/>')
    S.shape(circ(100, 150, 38), SP1, shadow=4, decor=hi(84, 132, 14, 8, 0.35, -24))
    S.shape(ell(100, 177, 18, 15), SP2, shadow=2)
    S.shape(ell(100, 187, 8, 5.5), fill=SPD, shadow=0, side=False)
    return save("props", "spirit-bear", S)


def spirit_eagle():
    S = Prop("spirit-eagle", "SPIRIT EAGLE (the Shaman's ancestor spirit; round 12): an eagle seen from above, wings spread, head forward, in "
               "the ancestors' pale blue, the spirits' swirl on its back. The game draws it see-through, flying. " + PROP)
    S.group("body")
    wing = [(92, 84), (60, 66), (30, 62), (4, 74), (14, 86), (2, 98), (16, 106), (8, 120), (26, 122), (24, 136), (46, 128), (70, 122), (92, 118)]
    for pts in (wing, mirror(wing)):
        k = 1 if pts is wing else -1
        S.shape(blob(pts, 0.5), SP0, shadow=0,
                decor=f'<path d="{blob([(100 - k * 8, 84), (100 - k * 40, 68), (100 - k * 70, 66), (100 - k * 66, 92), (100 - k * 40, 102), (100 - k * 8, 108)], 0.6)}" fill="{SP1}"/>')
    S.shape(blob([(88, 70), (76, 32), (90, 38), (100, 26), (110, 38), (124, 32), (112, 70)], 0.5), SP0, shadow=0)
    S.shape(ell(100, 100, 21, 44), SP1, shadow=3, decor=swirl(100, 92, 14, 30))
    S.shape(circ(100, 148, 19), SP2, shadow=3)
    S.shape(poly([(90, 158), (110, 158), (100, 184)]), "#F2C14E", shadow=2, decor=f'<path d="{poly([(100, 158), (110, 158), (100, 184)])}" fill="#B8862A" opacity="0.45"/>')
    return save("props", "spirit-eagle", S)


def spirit_beaver():
    S = Prop("spirit-beaver", "SPIRIT BEAVER (the Shaman's ancestor spirit; round 12): a beaver seen from above, its flat tail behind, two "
               "front teeth, in the ancestors' pale blue, the spirits' swirl on its back. The game draws it see-through. " + PROP)
    S.group("body")
    S.shape(ell(100, 40, 27, 36), SP0, shadow=0,
            decor=strokes("M 80 26 L 120 54 M 78 44 L 110 68 M 92 12 L 124 36 M 120 26 L 80 54 M 122 44 L 90 68 M 108 12 L 76 36", SPD, 2.6, 0.35))
    for s in (-1, 1):
        S.shape(ell(100 + s * 40, 76, 14, 18), SP0, shadow=0)
        S.shape(ell(100 + s * 42, 138, 14, 17), SP0, shadow=0)
    S.shape(ell(100, 104, 48, 50), SP1, shadow=3, decor=swirl(100, 98, 22, 30) + hi(78, 76, 16, 8, 0.3, -30))
    for s in (-1, 1):
        S.shape(circ(100 + s * 24, 134, 10), SP0, shadow=2)
    S.shape(circ(100, 152, 31), SP1, shadow=4, decor=hi(86, 138, 12, 7, 0.35, -24))
    S.shape(rr(100, 184, 20, 16, 3), "#FFFFFF", shadow=2, decor=f'<rect x="99" y="174" width="2.4" height="20" fill="{SP0}"/>')
    S.shape(ell(100, 174, 16, 10), SP2, shadow=2)
    S.shape(ell(100, 177, 7, 4.6), fill=SPD, shadow=0, side=False)
    return save("props", "spirit-beaver", S)


# ================================================================== the Alchemist
def cauldron():
    IRON_B = "#4A4652"
    S = Prop("cauldron", "CAULDRON (the Alchemist's, Cursed Brew; round 12): a black iron pot seen from above and a little from the "
               "front: a thick rim, green brew to the brim with bubbles, a ring handle at each side, three stub feet. "
               "The game draws the fire under it and the fumes. " + PROP)
    S.group("body")
    for x, y in ((46, 160), (154, 160), (100, 176)):
        S.shape(rr(x, y, 24, 22, 8), shade(IRON_B, 0.8), shadow=0)
    for s in (-1, 1):
        S.shape(ring(100 + s * 80, 96, 15, 7.5), "#8E96A4", rule="evenodd", shadow=0)
    S.shape(circ(100, 108, 72), IRON_B, shadow=0, decor=hi(62, 142, 10, 22, 0.16, 30))
    S.shape(ell(100, 86, 76, 40), light(IRON_B, 1.5), shadow=3)
    bub = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#C9F59A"/><circle cx="{x - r * 0.3}" cy="{y - r * 0.3}" r="{r * 0.35}" fill="#FFFFFF" opacity="0.9"/>'
                  for x, y, r in ((74, 80, 9), (112, 94, 12), (132, 76, 6.5), (94, 70, 5)))
    S.shape(ell(100, 86, 63, 29), "#7FCB3A", shadow=0, decor=bub + f'<path d="{ell(100, 96, 63, 26)}" fill="#3E8A1E" opacity="0.25"/>')
    return save("props", "cauldron", S)


# ================================================================== the Warlock
def warlock_imp():
    SKIN, DSKIN, MAG, HORN = "#7A4AA0", "#4A2A6A", "#E05AB8", "#D8CBB8"
    S = Prop("warlock-imp", "THE WARLOCK'S IMP (round 12): his own familiar, in his colours: a small round violet body, two long pale horns "
               "swept back like his, magenta bat wings (#back), a thin tail with a spade tip behind, a cat's smile and no "
               "eyes; a little magenta flame over one hand. Sized like the game's imp (headR 44). Parts: #back (wings and "
               "tail), #body, #arm-l, #arm-r (the hand that throws). Front = DOWN (+y), centre (100,100).")
    S.group("back", (100, 100), "wings and tail")
    wing = [(118, 96), (130, 70), (150, 52), (176, 44), (192, 50), (184, 64), (194, 78), (178, 84), (182, 100), (164, 100), (160, 114), (140, 106)]
    for pts in (wing, mirror(wing)):
        k = 1 if pts is wing else -1
        S.shape(blob(pts, 0.6), MAG, shadow=0, decor=strokes(f"M {100 + k * 22} 94 L {100 + k * 76} 50 M {100 + k * 24} 98 L {100 + k * 86} 76", "#8A1E6A", 4.4, 0.8))
    S.shape(taper([(100, 60), (96, 40), (104, 24), (100, 12)], 9, 6), DSKIN, shadow=0)
    S.shape(poly([(100, -6), (114, 14), (100, 10), (86, 14)]), DSKIN, shadow=0)
    S.group("body")
    for s in (-1, 1):   # horns, swept back
        pts = [(100 + s * 26, 78), (100 + s * 40, 70), (100 + s * 52, 50), (100 + s * 50, 26), (100 + s * 38, 44), (100 + s * 28, 60)]
        S.shape(blob(pts, 0.8), HORN, shadow=0, decor=f'<path d="{blob([(100 + s * 46, 50), (100 + s * 50, 26), (100 + s * 40, 42)], 0.6)}" fill="#8A7A6A" opacity="0.5"/>')
    S.shape(ell(100, 108, 50, 46), SKIN, shadow=3, decor=hi(78, 84, 18, 9, 0.3, -24) + f'<path d="{ell(100, 132, 34, 18)}" fill="#B88AD8" opacity="0.5"/>')
    for s in (-1, 1):   # ears
        S.shape(blob([(100 + s * 44, 96), (100 + s * 70, 86), (100 + s * 56, 110)], 0.6), SKIN, shadow=0)
    S.raw('<path d="M 84 124 Q 92 134 100 126 Q 108 134 116 124" fill="none" stroke="#3A1A4A" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>')
    S.group("arm-l", (62, 132), "free hand")
    S.shape(rr(58, 150, 20, 22, 8), SKIN, shadow=2)
    S.group("arm-r", (138, 132), "the hand with the flame")
    flame = blob([(142, 156), (154, 162), (158, 174), (152, 186), (142, 198), (132, 186), (126, 174), (130, 162)], 0.9)
    S.shape(flame, MAG, shadow=0, side=False, decor=f'<path d="{blob([(142, 164), (150, 172), (148, 182), (142, 190), (136, 182), (134, 172)], 0.9)}" fill="#FFD0F0"/>')
    S.shape(rr(142, 150, 20, 22, 8), SKIN, shadow=2)
    return save("props", "warlock-imp", S)


# ================================================================== the Beekeeper
def beehive():
    STRAW = "#E0B050"
    S = Prop("beehive", "BEEHIVE (the Beekeeper's; round 12): a straw skep on a round board, seen from above and a little from the front: "
               "five coils of straw rope, a dark door at the front. The game draws its bees. " + PROP)
    S.group("body")
    S.shape(ell(100, 118, 86, 70), "#9A6A40", shadow=0, decor=strokes("M 20 104 L 180 104 M 18 134 L 182 134 M 34 160 L 166 160", "#6E4628", 3, 0.5))
    rings = [(100, 112, 70, 62), (100, 104, 58, 50), (100, 96, 45, 38), (100, 88, 31, 26), (100, 82, 16, 13)]
    for i, (x, y, rx, ry) in enumerate(rings):
        S.shape(ell(x, y, rx, ry), STRAW if i % 2 == 0 else light(STRAW, 1.1), shadow=3 if i else 0,
                decor=hi(x - rx * 0.4, y - ry * 0.5, rx * 0.3, ry * 0.18, 0.3, -20))
    S.shape("M 84 174 L 84 158 C 84 146 116 146 116 158 L 116 174 C 108 177 92 177 84 174 Z", fill="#3A2A1A", shadow=0, side=False)
    return save("props", "beehive", S)


# ================================================================== the Quartermaster
def crate():
    W = "#B8884A"
    S = Prop("supply-crate", "SUPPLY CRATE (the Quartermaster's; round 12): a wooden crate seen from straight above, built like the rooms' "
               "crates (sloped sides, a planked lid, iron corners), tied with rope and marked with the red cross of supplies. " + PROP)
    S.group("body")
    S.shape(rr(100, 100, 156, 156, 9), shade(W, 0.66), shadow=0)
    planks = strokes("M 34 68 L 166 68 M 34 100 L 166 100 M 34 132 L 166 132", "#7A5A30", 3.2, 0.6)
    S.shape(rr(100, 100, 130, 130, 5), W, shadow=0, decor=planks + hi(66, 48, 24, 6, 0.3))
    for x in (40, 160):
        for y in (40, 160):
            S.shape(rr(x, y, 20, 20, 3), "#8E96A4", shadow=1, decor=f'<circle cx="{x}" cy="{y}" r="3.2" fill="#3A3440"/>')
    S.shape(rr(100, 100, 12, 158, 3) + " " + rr(100, 100, 158, 12, 3), "#D9C7A0", shadow=2)
    S.shape(circ(100, 100, 31), "#F1EBDD", shadow=3)
    S.shape(rr(100, 100, 15, 42, 2) + " " + rr(100, 100, 42, 15, 2), "#C8453D", shadow=0)
    return save("props", "supply-crate", S)


def barricade(spiked=True):
    W = "#B8884A"
    S = Prop("barricade-spiked" if spiked else "barricade", f"BARRICADE (the Quartermaster's; round 12{', spiked: his upgrade' if spiked else ''}): a wall of seven pointed planks "
               "across the way, seen from above and a little from the front, on two rails with iron nails"
               + (", a row of iron spikes pointing forward" if spiked else "") + ". " + PROP)
    S.group("body")
    if spiked:
        for i in range(6):
            x = 30 + i * 28
            S.shape(poly([(x - 8, 128), (x + 8, 128), (x, 172)]), STEEL, shadow=0, decor=blade_decor([(x, 128), (x + 8, 128), (x, 172)]))
    for i in range(7):
        x = 16 + i * 28
        col = W if i % 2 == 0 else shade(W, 0.86)
        S.shape(poly([(x - 13, 140), (x - 13, 62), (x, 44), (x + 13, 62), (x + 13, 140)]), col, shadow=0,
                decor=strokes(f"M {x - 4} 70 L {x - 4} 132", "#7A5A30", 2.6, 0.5))
    for y in (82, 120):
        S.shape(rr(100, y, 192, 13, 4), "#7A5230", shadow=3,
                decor="".join(f'<circle cx="{16 + i * 28}" cy="{y}" r="3.2" fill="#C9CED6"/>' for i in range(7)))
    return save("props", "barricade-spiked" if spiked else "barricade", S)


# ================================================================== the Crossbowman
def pavise():
    BLUE, REDP, BONE = "#6E7F98", "#C8453D", "#EFE8D6"
    S = Prop("pavise", "PAVISE (the Crossbowman's; round 12): a tall standing shield, drawn as the heroes' shields are (its face to the "
               "front, in front of the wooden prop that holds it up): quartered in his red and yellow, a steel rim, a rib "
               "down the middle. " + PROP)
    S.group("body")
    S.shape(rr(0, 0, 13, 92, 5), "#8A5E38", T="translate(100 62) rotate(0)", shadow=0)
    S.shape(rr(100, 20, 44, 13, 5), "#7A5230", shadow=1)
    face = "M 34 86 C 34 70 46 64 60 64 L 140 64 C 154 64 166 70 166 86 L 166 164 C 166 184 140 196 100 196 C 60 196 34 184 34 164 Z"
    S.shape(face, "#AEB5C1", shadow=3)
    inner = "M 43 88 C 43 77 51 73 62 73 L 138 73 C 149 73 157 77 157 88 L 157 162 C 157 177 134 187 100 187 C 66 187 43 177 43 162 Z"
    S.shape(inner, REDP, shadow=0,
            decor=f'<rect x="100" y="60" width="70" height="68" fill="{GOLD}"/><rect x="30" y="128" width="70" height="70" fill="{GOLD}"/>'
                  + hi(66, 92, 12, 6, 0.3, -20))
    S.shape(rr(100, 130, 15, 118, 6), "#C9CED6", shadow=2, decor='<rect x="95.5" y="74" width="3" height="112" fill="#FFFFFF" opacity="0.6"/>')
    return save("props", "pavise", S)


# ================================================================== the Grenadier
def big_bomb():
    S = Prop("big-bomb", "BIG BOMB (the Grenadier's; round 12): his bomb, large: a black iron ball, a brass collar at the top (back), a "
               "curling fuse with a spark. The game swells it as the fuse burns down. " + PROP)
    S.group("body")
    S.shape(band([(100, 34), (104, 18), (118, 8), (134, 12)], 3.6), "#C9A070", shadow=0)
    S.shape(poly(star(138, 12, 14, 6, 6, 10)), "#FFD23A", shadow=0, side=False, decor='<circle cx="138" cy="12" r="4.5" fill="#FFFFFF"/>')
    S.shape(rr(100, 38, 34, 20, 6), BRASS, shadow=0)
    S.shape(circ(100, 112, 76), "#3A3440", shadow=3,
            decor=hi(70, 78, 24, 13, 0.3, -30) + f'<path d="{ell(124, 150, 26, 12)}" fill="#6A6470" opacity="0.35" transform="rotate(-30 124 150)"/>')
    return save("props", "big-bomb", S)


# ================================================================== the Engineer
def deck(S, r=74, feet=(90, 210, 330), note="the deck and its feet (these stay put while the top turns)"):
    """The engineer's machines stand on one round wooden deck with a brass rim and three steel feet (#back)."""
    S.group("back", (100, 100), note)
    for a in feet:
        x, y = 100 + (r + 6) * math.cos(math.radians(a)), 100 + (r + 6) * math.sin(math.radians(a))
        S.shape(circ(x, y, 13), "#3A3440", shadow=0, decor=hi(x - 4, y - 4, 4, 3, 0.3))
    S.shape(circ(100, 100, r), BRASS, shadow=0)
    S.shape(circ(100, 100, r - 9), "#B8884A", shadow=0,
            decor=strokes(f"M {100 - r} 76 L {100 + r} 76 M {100 - r} 100 L {100 + r} 100 M {100 - r} 124 L {100 + r} 124", "#7A5A30", 3, 0.55)
                  + "".join(f'<circle cx="{f(100 + (r - 17) * math.cos(math.radians(a)))}" cy="{f(100 + (r - 17) * math.sin(math.radians(a)))}" r="3" fill="#5E4A3C"/>' for a in range(30, 360, 60)))


def torcher():
    S = Prop("engineer-torcher", "TORCHER (the Engineer's tower; round 12): a flame thrower on the engineer's round wooden deck: a thick steel "
               "shield curved across its front, a dark nozzle with a pilot light poking through it, and behind, bare, its red "
               "fuel tank (strong from the front, weak from behind). Parts: #back (deck and feet), #top (the machine; it turns "
               "about its pivot). Front = DOWN (+y), centre (100,100).")
    deck(S)
    S.group("top", (100, 100), "the flame thrower")
    S.shape(rr(100, 62, 46, 56, 20), "#C8403A", shadow=3, decor=hi(88, 48, 8, 14, 0.4) + f'<rect x="76" y="64" width="48" height="7" fill="{BRASS}"/>')
    S.shape(circ(100, 104, 34), "#A9B2C0", shadow=3, decor=hi(88, 90, 10, 6, 0.5, -24))
    S.shape(rr(100, 156, 22, 50, 7), "#3A3440", shadow=2)
    S.shape(circ(100, 182, 7.5), "#FF8A3D", shadow=0, side=False, decor='<circle cx="100" cy="182" r="3.4" fill="#FFE9A0"/>')
    arc = [(100 + 64 * math.cos(math.radians(a)), 100 + 60 * math.sin(math.radians(a))) for a in range(10, 171, 16)]
    S.shape(band(arc, 13), "#7E8794", shadow=3,
            decor="".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="3.2" fill="#E6EAF0"/>' for x, y in arc[1:-1:2]) + strokes("M 44 118 Q 60 146 86 156", "#FFFFFF", 4, 0.35))
    S.shape(rr(100, 150, 30, 12, 4), BRASS, shadow=2)
    return save("props", "engineer-torcher", S)


def tesla():
    CU = "#C8784A"
    S = Prop("engineer-tesla", "TESLA TOWER (the Engineer's tower; round 12): a copper coil standing on the engineer's round wooden deck (its "
               "foot at the middle, its top leaning back), four windings, a steel ball on top with a spark on it. Parts: "
               "#back (deck and feet), #body (the coil). Front = DOWN (+y), centre (100,100).")
    deck(S)
    S.group("body")
    S.shape(ell(100, 122, 40, 22), "#5E6474", shadow=3)
    for i, (y, rx) in enumerate(((112, 32), (98, 29), (84, 26), (70, 23))):
        S.shape(ell(100, y, rx, rx * 0.5), CU if i % 2 == 0 else light(CU, 1.12), shadow=3, decor=hi(100 - rx * 0.4, y - rx * 0.2, rx * 0.3, 3, 0.4))
    S.shape(circ(100, 46, 25), "#DCE3EC", shadow=3, decor=hi(90, 36, 9, 6, 0.8, -24))
    S.shape(poly(star(100, 46, 13, 4.5, 4, 0)), "#FFE66B", shadow=0, side=False, decor='<circle cx="100" cy="46" r="3.6" fill="#FFFFFF"/>')
    return save("props", "engineer-tesla", S)


def mortar():
    S = Prop("engineer-mortar", "SNOWBALL MORTAR (the Engineer's tower; round 12): a short brass mortar aiming straight up, seen from above (a "
               "round mouth with a snowball waiting in it, set a little off the middle), on a steel cradle, three snowballs "
               "piled on the engineer's wooden deck beside it. Parts: #back (deck and feet), #top (the mortar; it turns). "
               "Front = DOWN (+y), centre (100,100).")
    deck(S)
    S.group("top", (100, 100), "the mortar")
    S.shape(rr(100, 100, 112, 26, 8), "#7E8794", shadow=3, decor='<circle cx="52" cy="100" r="4" fill="#E6EAF0"/><circle cx="148" cy="100" r="4" fill="#E6EAF0"/>')
    for x, y, r in ((62, 142, 11), (80, 150, 11), (72, 132, 10)):
        S.shape(circ(x, y, r), "#F2FBFF", shadow=2, decor=f'<path d="{ell(x + 3, y + 4, r * 0.7, r * 0.5)}" fill="#9FD0EA" opacity="0.5"/>')
    S.shape(circ(104, 96, 44), BRASS, shadow=4, decor=hi(84, 70, 16, 8, 0.45, -30))
    S.shape(circ(104, 96, 31), shade(BRASS, 0.7), shadow=0)
    S.shape(circ(104, 96, 27), fill="#2B2230", shadow=0, side=False)
    S.shape(circ(104, 98, 19), "#F2FBFF", shadow=0, decor=f'<path d="{ell(108, 104, 13, 9)}" fill="#9FD0EA" opacity="0.5"/>' + hi(98, 91, 6, 4, 0.9))
    return save("props", "engineer-mortar", S)


def medbay():
    S = Prop("engineer-medbay", "MEDBAY (the Engineer's tower; round 12): a round white canvas tent on the engineer's wooden deck, seen from above: "
               "eight panels, a brass cap, the healers' green cross on its front. Parts: #back (deck and feet), #body (the "
               "tent). Front = DOWN (+y), centre (100,100).")
    deck(S)
    S.group("body")
    TENT = "#EEF3F8"
    seams = "".join(strokes(f"M 100 94 L {f(100 + 60 * math.cos(math.radians(a)))} {f(98 + 56 * math.sin(math.radians(a)))}", "#B8C4D2", 3, 0.8) for a in range(22, 360, 45))
    S.shape(cloud(100, 98, 54, 8, 0.72, 22.5), TENT, shadow=4, decor=seams + hi(78, 70, 16, 8, 0.6, -30))
    S.shape(rr(100, 130, 13, 36, 3) + " " + rr(100, 130, 36, 13, 3), "#5FBF6A", shadow=0)
    S.shape(circ(100, 94, 9.5), BRASS, shadow=2)
    return save("props", "engineer-medbay", S)


def med_drone():
    S = Prop("engineer-med-drone", "MED DRONE (the Engineer's medbay's; round 12): a small round white flyer with the green cross, a spinning rotor "
               "on a steel arm at each side, a brass lens at the front. " + PROP)
    S.group("body")
    for s in (-1, 1):
        S.shape(rr(100 + s * 46, 96, 40, 11, 4), "#8E96A4", shadow=0)
        S.shape(circ(100 + s * 68, 96, 29), "#C9D2DE", shadow=0, decor=f'<path d="{ell(100 + s * 68, 96, 27, 7)}" fill="#FFFFFF" opacity="0.6" transform="rotate(-30 {100 + s * 68} 96)"/>')
        S.shape(circ(100 + s * 68, 96, 7.5), "#5E6474", shadow=1)
    S.shape(circ(100, 104, 46), "#EEF3F8", shadow=3, decor=hi(82, 82, 14, 8, 0.7, -30))
    S.shape(rr(100, 98, 15, 46, 3) + " " + rr(100, 98, 46, 15, 3), "#5FBF6A", shadow=0)
    S.shape(circ(100, 146, 12), BRASS, shadow=2)
    S.shape(circ(100, 146, 6.5), "#4FC3E8", shadow=0, decor=hi(98, 144, 2.4, 1.8, 0.9))
    return save("props", "engineer-med-drone", S)


def windup():
    S = Prop("engineer-windup", "WIND-UP DRONE (the Engineer's; round 12): a little brass ball that walks up to a foe and pops: a steel wind-up "
               "key in its back (#back: the game can turn it), two dark feet, a dark visor with two lights, a red cap on "
               "top. Parts: #back (the key), #body. Front = DOWN (+y), centre (100,100).")
    S.group("back", (100, 46), "the key")
    S.shape(rr(100, 44, 13, 40, 5), "#8E96A4", shadow=0)
    for s in (-1, 1):
        S.shape(ell(100 + s * 27, 20, 25, 17) + " " + ell(100 + s * 28, 20, 12, 7.5), "#C9CED6", rule="evenodd", shadow=0)
    S.shape(circ(100, 22, 10), "#8E96A4", shadow=1)
    S.group("body")
    for s in (-1, 1):
        S.shape(rr(100 + s * 46, 150, 34, 30, 10), "#3A3440", shadow=0)
    S.shape(circ(100, 112, 58), "#E0B050", shadow=3, decor=hi(76, 84, 20, 11, 0.45, -30))
    S.shape("M 52 122 C 66 138 134 138 148 122 L 146 142 C 130 158 70 158 54 142 Z", "#3A3440", shadow=2,
            decor='<circle cx="80" cy="141" r="6.5" fill="#FFE66B"/><circle cx="120" cy="141" r="6.5" fill="#FFE66B"/>')
    S.shape(circ(100, 86, 13), "#C8403A", shadow=2, decor=hi(96, 82, 4, 3, 0.7))
    return save("props", "engineer-windup", S)


BUILD = {"haybale": haybale, "totem": totem, "spirit-bear": spirit_bear, "spirit-eagle": spirit_eagle, "spirit-beaver": spirit_beaver,
         "cauldron": cauldron, "warlock-imp": warlock_imp, "beehive": beehive, "supply-crate": crate,
         "barricade": lambda: barricade(False), "barricade-spiked": lambda: barricade(True), "pavise": pavise, "big-bomb": big_bomb,
         "engineer-torcher": torcher, "engineer-tesla": tesla, "engineer-mortar": mortar, "engineer-medbay": medbay,
         "engineer-med-drone": med_drone, "engineer-windup": windup}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
