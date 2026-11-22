"""Round 9: real art for the Sunken Dunes' stand-ins (docs/ART-NEEDED.md), A2 style: the scarab (the golden scarab is
this art turned gold by the game), the cobra, the jackal guard, the mummy, the sand mage and its dust devil, the sand
serpent (a chain: its head and one coil), the dart trap (wall-mounted), the venom and wind spirits.
python dunes9.py [name ...]   -> ../../enemies/dunes-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *

SAND, DSAND, LSAND = "#D8B26A", "#9A7440", "#F2DCA8"
TURQ, LAPIS = "#3AA8A0", "#2E5EA8"


# ================================================================== scarab
SCARAB_DEFS = ('<linearGradient id="gScarab" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#7CE0A0"/>'
               '<stop offset="0.45" stop-color="#2EA27A"/><stop offset="1" stop-color="#1E5E6E"/></linearGradient>')


def scarab():
    S = Sprite("SCARAB (round 9): a scarab beetle seen from above in round 8's creature build: an iridescent green shell "
               "(teal-green going to blue at the back, a bright sheen) split down the middle into its two wing cases, a "
               "rounded shield behind its head, a small head with two curved mandibles, six short dark legs (the front "
               "pair in the arm parts, they jab when it bites). No eyes. The golden scarab is this art turned gold "
               "(js/dunes.js). Parts: #back (the four back legs), #arm-l / #arm-r (the front legs), #body. " + LAYOUT)
    S.add_def(SCARAB_DEFS)
    LEG = "#2A3A3E"
    S.group("back", (100, 100), "back legs")
    for s in (-1, 1):
        for pts in ([(100 + s * 34, 104), (100 + s * 62, 96), (100 + s * 74, 120)], [(100 + s * 30, 82), (100 + s * 60, 64), (100 + s * 66, 38)]):
            S.shape(taper(pts, 11, 6, 0.7), LEG, shadow=0)
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 30, 124), "front leg")
        S.shape(taper([(100 + s * 30, 124), (100 + s * 56, 136), (100 + s * 58, 164)], 11, 6, 0.7), LEG, shadow=0)
    S.group("body")
    S.shape(ell(100, 82, 44, 52), fill="url(#gScarab)", shadow=0,
            decor=strokes("M 100 36 L 100 130", "#16424E", 3.5, 0.75)
                  + f'<path d="{ell(80, 70, 12, 26)}" fill="#C8FFE0" opacity="0.35"/>'
                  + f'<path d="{ell(122, 92, 8, 18)}" fill="#8EA0FF" opacity="0.25"/>')
    S.shape(blob([(64, 122), (100, 112), (136, 122), (140, 138), (124, 150), (100, 154), (76, 150), (60, 138)], 0.85),
            fill="url(#gScarab)", shadow=4, decor=f'<path d="{ell(86, 128, 12, 6)}" fill="#C8FFE0" opacity="0.4"/>')
    S.shape(ell(100, 158, 18, 12), "#1E4A50", shadow=3)
    for s in (-1, 1):
        S.shape(blob([(100 + s * 6, 164), (100 + s * 16, 166), (100 + s * 18, 180), (100 + s * 10, 188), (100 + s * 9, 178),
                      (100 + s * 4, 172)], 0.8), "#2A3A3E", shadow=2)
    return save("enemies", "dunes-scarab", S)


# ================================================================== cobra
def cobra():
    S = Sprite("COBRA (round 9): a cobra seen from above, reared with its hood spread: a wide sandy hood with dark "
               "bands across its back, a pale cream front edge, a small head at the front with a dark forked tongue "
               "flicking out; behind the hood its body lies in a loose coil, banded, ending in a thin tail (#back, sways). No "
               "eyes (and no eye-spots on the hood). Parts: #back (the coiled body), #body (hood and head). " + LAYOUT)
    S.group("back", (100, 96), "coiled body")
    # the body: from under the hood back into a loose coil, a turn and a bit, ending in a thin tail
    pts = []
    for i in range(15):
        u = i / 14
        a = math.radians(90 + 430 * u)
        r = 40 - 32 * u
        pts.append((100 + math.cos(a) * r * 1.1, 54 + math.sin(a) * r))
    pts = [(100, 100)] + pts
    S.shape(taper(pts, 32, 14, 0.8), "#A07A44", shadow=0,
            decor=strokes(" ".join(f"M {f(x - 8)} {f(y - 6)} L {f(x + 8)} {f(y + 6)}" for x, y in pts[2:13:2]), LSAND, 6, 0.7))
    S.group("body")
    hood = blob([(100, 86), (130, 90), (156, 104), (166, 124), (156, 142), (132, 152), (112, 156), (100, 152), (88, 156),
                 (68, 152), (44, 142), (34, 124), (44, 104), (70, 90)], 0.85)
    S.shape(hood, SAND, shadow=3,
            decor=f'<path d="{blob([(54, 140), (76, 152), (100, 148), (124, 152), (146, 140), (140, 160), (100, 170), (60, 160)], 0.8)}" fill="{LSAND}"/>'
                  + strokes("M 56 108 Q 100 94 144 108 M 44 126 Q 100 112 156 126", "#8A6236", 7, 0.8)
                  + strokes("M 100 92 L 100 140", "#8A6236", 4, 0.5))
    S.raw(f'<path d="M 100 172 L 100 186 M 100 186 L 94 194 M 100 186 L 106 194" fill="none" stroke="#7A2E3A" stroke-width="3" stroke-linecap="round"/>')
    S.shape(blob([(85, 136), (100, 130), (115, 136), (118, 156), (109, 172), (100, 177), (91, 172), (82, 156)], 0.9), "#B08A50", shadow=4,
            decor=f'<path d="{ell(100, 167, 9, 7)}" fill="{LSAND}"/>' + strokes("M 100 138 L 100 156", "#7A5430", 4, 0.6))
    return save("enemies", "dunes-cobra", S)


# ================================================================== jackal guard
JACKAL_FUR, JACKAL_SNOUT = "#3A3440", "#4C4452"


def jackal():
    S = Sprite("JACKAL GUARD (round 9): a tomb guard with a jackal's head, the heroes' bust build: black fur, a long "
               "jackal snout pointing forward, tall pointed ears standing up and back with gold on their inner faces, a "
               "broad gold-and-turquoise collar over a white linen kilt-tunic; a gold-tipped spear under the right "
               "shoulder (arm-r, it thrusts), a round bronze shield with a sun disc on the left (arm-l). No eyes. " + LAYOUT)
    S.group("arm-r", PR, "spear")
    T = frame(156, 110, 5)
    S.shape(rr(0, -3, 9, 106, 4.5), "#5A3A26", T=T, shadow=0)
    S.shape(rr(0, 44, 15, 10, 3.5), GOLD, T=T, shadow=1)
    S.shape(blob([(-10, 48), (10, 48), (11, 64), (0, 92), (-11, 64)], 0.7), "#F2D27A", T=T, shadow=2,
            decor=f'<path d="{poly([(0, 48), (10, 48), (11, 64), (0, 92)])}" fill="#C89A3A" opacity="0.45"/>')
    fist(S, 0, 0, T=T, hand="url(#gHandD)")
    S.add_def(DARK_SKIN)
    S.group("body")
    S.shape(SHOULDERS, "#F2EBDA", decor=strokes("M 34 120 Q 100 146 166 120", "#D8CCB0", 5, 0.6))
    S.shape(blob([(40, 104), (60, 86), (100, 80), (140, 86), (160, 104), (150, 122), (100, 130), (50, 122)], 0.85), GOLD, shadow=3,
            decor=strokes("M 46 108 Q 100 90 154 108", TURQ, 6, 0.9) + strokes("M 52 118 Q 100 104 148 118", LAPIS, 5, 0.85))
    for s in (-1, 1):   # tall ears, standing up and back
        ear = blob([(100 + s * 16, 104), (100 + s * 24, 70), (100 + s * 34, 38), (100 + s * 42, 64), (100 + s * 38, 100)], 0.7)
        inner = blob([(100 + s * 21, 100), (100 + s * 27, 72), (100 + s * 34, 50), (100 + s * 37, 70), (100 + s * 34, 96)], 0.7)
        S.shape(ear, JACKAL_FUR, shadow=2, decor=f'<path d="{inner}" fill="{GOLD}" opacity="0.85"/>')
    S.shape(ell(100, 116, 30, 30), JACKAL_FUR, shadow=4, decor=f'<path d="{ell(90, 104, 12, 8)}" fill="#FFFFFF" opacity="0.12"/>')
    sn = blob([(100, 118), (111, 124), (113, 146), (108, 168), (100, 176), (92, 168), (87, 146), (89, 124)], 0.85)
    S.shape(sn, JACKAL_SNOUT, shadow=4, decor=strokes("M 100 124 L 100 152", GOLD, 3.5, 0.8))
    S.shape(ell(100, 172, 7, 5.5), "#1E1A22", shadow=1, side=False)
    S.group("arm-l", PL, "round shield")
    fist(S, 46, 146, -6, hand="url(#gHandD)")
    S.shape(circ(42, 156, 27), "#B8823A", shadow=4,
            decor=f'<path d="{circ(42, 156, 20)}" fill="#D8A24A"/>' + f'<path d="{circ(42, 156, 9)}" fill="{GOLD}"/>'
                  + f'<path d="{circ(38, 151, 4)}" fill="#FFF2C0" opacity="0.8"/>')
    return save("enemies", "dunes-jackal", S)


# ================================================================== mummy
LINEN, DLINEN = "#DCD4C2", "#A49880"   # greyer than the sand floor


def mummy():
    S = Sprite("MUMMY (round 9): the heroes' bust build wrapped from head to fists in old linen: cream bandages wound in "
               "bands round the head (no face showing, no eyes), over the shoulders and down the arms, grubby and darker "
               "in places; loose ends trailing behind it (#back, sway); two wrapped fists reaching forward (arm-l, "
               "arm-r, they swing). " + LAYOUT)
    S.group("back", (100, 90), "trailing bandages")
    for pts, w in (([(150, 96), (136, 70), (112, 54), (96, 36), (70, 26), (54, 8)], 14), ([(48, 98), (36, 82), (40, 64)], 12)):
        S.shape(taper(pts, w, w * 0.6, 0.7), LINEN, shadow=0, decor=strokes(" ".join(f"M {x - 8} {y} L {x + 8} {y + 4}" for x, y in pts[1:]), DLINEN, 2.5, 0.6))
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 56, 108), "wrapped arm")
        S.shape(taper([(100 + s * 60, 104), (100 + s * 62, 134), (100 + s * 56, 158)], 26, 22, 0.8), LINEN, shadow=0,
                decor=strokes(f"M {100 + s * 48} 118 L {100 + s * 72} 124 M {100 + s * 48} 136 L {100 + s * 72} 142 "
                              f"M {100 + s * 46} 152 L {100 + s * 66} 158", DLINEN, 3, 0.7))
        S.shape(rr(0, 0, 24, 27, 9), LINEN, T=frame(100 + s * 54, 166, s * -8), shadow=3,
                decor=strokes("M -14 -4 L 14 2 M -14 6 L 14 10", DLINEN, 2.5, 0.7))
    S.group("body")
    wraps = strokes("M 30 100 L 170 112 M 34 120 L 166 128 M 60 84 L 140 92", DLINEN, 3.5, 0.6)
    S.shape(SHOULDERS, LINEN, decor=wraps + f'<path d="{ell(146, 120, 16, 9)}" fill="#8E7A58" opacity="0.25"/>')
    head(S, face="url(#gMummy)")
    S.add_def('<linearGradient id="gMummy" x1="60" y1="48" x2="120" y2="153" gradientUnits="userSpaceOnUse">'
              f'<stop offset="0" stop-color="{light(LINEN, 1.05)}"/><stop offset="1" stop-color="{shade(LINEN, 0.84)}"/></linearGradient>')
    S.raw(f'<g clip-path="url(#mummyHead)">{strokes("M 50 70 L 150 84 M 50 90 L 150 100 M 50 108 L 150 122 M 50 128 L 150 140 M 56 146 L 146 154", DLINEN, 3.5, 0.75)}'
          '</g>')
    S.add_def(f'<clipPath id="mummyHead"><path d="{HEAD}"/></clipPath>')
    return save("enemies", "dunes-mummy", S)


# ================================================================== sand mage and its dust devil
def sand_mage():
    S = Sprite("SAND MAGE (round 9): a robed desert mage in the heroes' bust build: an ochre hood and robe with a "
               "turquoise border, a cream veil over the lower face (no eyes), a gold staff with a sun disc held in the "
               "right hand (arm-r) with a ribbon of sand swirling round its head, the left hand open with a little "
               "swirl of sand above it (arm-l); both lift when it casts. " + LAYOUT)
    OCHRE = "#C8843A"
    def swirl(cx, cy, r, w):   # a spiral of blown sand winding in, thick outside, thin at the heart
        pts = [(cx + math.cos(math.radians(a)) * r * (1 - 0.7 * i / 11), cy + math.sin(math.radians(a)) * r * (1 - 0.7 * i / 11))
               for i, a in enumerate(range(-90, 270, 33))]
        return taper(pts, w, 2, 0.8)
    S.group("arm-r", PR, "staff")
    T = frame(158, 118, 4)
    S.shape(rr(0, 10, 9, 84, 4.5), "#8A5A30", T=T, shadow=0)
    S.shape(circ(0, 58, 12), GOLD, T=T, shadow=2, decor='<circle cx="-3" cy="54" r="4" fill="#FFF2C0"/>')
    S.shape(swirl(0, 58, 26, 9), LSAND, T=T, shadow=2, side=False)
    fist(S, 0, 0, T=T)
    S.group("body")
    S.shape(SHOULDERS, OCHRE, decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", TURQ, 5, 0.9))
    head(S)
    S.shape(blob([(60, 124), (82, 130), (100, 128), (118, 130), (140, 124), (138, 140), (122, 152), (100, 156), (78, 152), (62, 140)], 0.8),
            "#F0E4C8", shadow=3, decor=strokes("M 66 132 Q 100 142 134 132", "#D8C8A4", 3, 0.7))
    S.shape(blob([(48, 116), (42, 78), (58, 50), (80, 36), (100, 32), (120, 36), (142, 50), (158, 78), (152, 116), (142, 104),
                  (138, 86), (120, 74), (100, 72), (80, 74), (62, 86), (58, 104)], 0.8), OCHRE, shadow=4,
            decor=strokes("M 52 110 C 52 84 72 72 100 72 C 128 72 148 84 148 110", TURQ, 4, 0.85))
    S.group("arm-l", PL, "open hand, a swirl of sand")
    fist(S, 50, 146, -6)
    S.shape(swirl(48, 170, 16, 7), LSAND, shadow=0, side=False)
    return save("enemies", "dunes-sand-mage", S)


def dust_devil():
    S = Sprite("DUST DEVIL (round 9): a small whirlwind of sand seen from above, a spiral: three curved arms of sand "
               "sweeping round into a darker eye, paler at their outer edges, a few grains flung off. No face. Parts: "
               "#body only (it spins whole). " + LAYOUT)
    S.group("body")
    arms = []
    for k in range(3):
        a0 = k * 120
        pts = []
        for i in range(9):
            t = i / 8
            a = math.radians(a0 + t * 200)
            r = 18 + 58 * t
            pts.append((100 + math.cos(a) * r, 100 + math.sin(a) * r))
        arms.append(pts)
    S.shape(circ(100, 100, 34), DSAND, shadow=0, side=False)
    for i, pts in enumerate(arms):
        S.shape(taper(pts, 6, 30, 0.8), SAND if i != 1 else light(SAND, 1.06), shadow=2, side=False,
                decor=strokes("M " + " L ".join(f"{f(x)} {f(y)}" for x, y in pts[3:]), LSAND, 5, 0.6))
    S.shape(circ(100, 100, 15), "#7A5A34", shadow=0, side=False, decor=f'<path d="{circ(96, 96, 6)}" fill="#A8844E"/>')
    return save("enemies", "dunes-dust-devil", S)


# ================================================================== the sand serpent: its head and a coil
SERPENT, DSERPENT, BELLY = "#D2A860", "#7A5430", "#EAD2A0"


def serpent_head():
    S = Sprite("SAND SERPENT, head (round 9): the head of a great desert snake seen from above, flat and wide: a broad "
               "wedge of a head, sandy scales with a dark diamond down its back, a heavy brow ridge on each side, a pale "
               "lip, two curved fangs showing at the front and a dark forked tongue; behind it a short round neck, where "
               "the first coil of its body sits (its coils are dunes-serpent-coil). No eyes. Parts: #body only. " + LAYOUT)
    S.group("body")
    S.shape(ell(100, 96, 28, 24), SERPENT, shadow=0, decor=f'<path d="M 100 76 L 108 92 L 100 108 L 92 92 Z" fill="{DSERPENT}" opacity="0.85"/>')
    S.raw('<path d="M 100 182 L 100 198 M 100 198 L 93 207 M 100 198 L 107 207" fill="none" stroke="#7A2E3A" stroke-width="3.5" stroke-linecap="round"/>')
    for s in (-1, 1):
        S.shape(blob([(100 + s * 12, 168), (100 + s * 20, 170), (100 + s * 18, 184), (100 + s * 13, 190), (100 + s * 14, 178)], 0.8),
                "#F4EEDC", shadow=0, side=False)
    head = blob([(100, 98), (132, 102), (154, 118), (154, 138), (136, 160), (116, 176), (100, 181), (84, 176), (64, 160),
                 (46, 138), (46, 118), (68, 102)], 0.85)
    S.shape(head, SERPENT, shadow=4,
            decor=f'<path d="M 100 104 L 116 124 L 100 146 L 84 124 Z" fill="{DSERPENT}" opacity="0.85"/>'
                  + f'<path d="M 100 148 L 107 158 L 100 166 L 93 158 Z" fill="{DSERPENT}" opacity="0.6"/>'
                  + f'<path d="{blob([(62, 158), (100, 168), (138, 158), (128, 178), (100, 186), (72, 178)], 0.8)}" fill="{BELLY}"/>')
    return save("enemies", "dunes-serpent-head", S)


def serpent_coil():
    S = Sprite("SAND SERPENT, coil (round 9): one round segment of the sand serpent's body seen from above (the chain "
               "of them follows its head, each its own hit circle): a fat round coil of sandy scales, a dark diamond on "
               "top, paler at the sides. Front = towards the head. Parts: #body only. " + LAYOUT)
    S.group("body")
    S.shape(ell(100, 100, 66, 58), SERPENT, shadow=0,
            decor=f'<path d="M 100 56 L 122 100 L 100 144 L 78 100 Z" fill="{DSERPENT}" opacity="0.85"/>'
                  + f'<path d="M 100 72 L 110 100 L 100 128 L 90 100 Z" fill="{SERPENT}"/>'
                  + strokes("M 44 82 Q 50 100 44 118 M 156 82 Q 150 100 156 118", BELLY, 7, 0.7)
                  + f'<path d="{ell(78, 74, 14, 8)}" fill="#FFFFFF" opacity="0.2"/>')
    return save("enemies", "dunes-serpent-coil", S)


# ================================================================== dart trap
def dart_trap():
    S = Sprite("DART TRAP (round 9): a trap set in a tomb wall, seen from above: a carved sandstone slab against the wall "
               "behind it (#back: it stays put while the head turns), a stone cobra's head carved out of it, its hood "
               "spread, three dark dart holes in its mouth (#body, it turns a little to aim). No eyes. " + LAYOUT)
    STONE_S, DSTONE_S = "#CDB48A", "#8E7652"
    S.group("back", (100, 100), "the wall slab")
    # its back edge on the wall's face: the game mounts it the collider's radius + 2 out from the wall (families.js
    # mountOnWall): 28.4 room units, 64 of these units at headR 45; the slab's back edge is at 40, its outline at 34
    S.shape(rr(100, 60, 172, 40, 9), STONE_S, shadow=0,
            decor=strokes("M 28 60 L 172 60", DSTONE_S, 3, 0.5) + strokes("M 56 42 L 56 78 M 144 42 L 144 78", DSTONE_S, 3, 0.4))
    S.group("body")
    S.shape(poly(star(100, 104, 54, 40, 10, 18)), STONE_S, shadow=4)          # the sun's rays, carved
    S.shape(circ(100, 108, 40), STONE_S, shadow=3,
            decor=f'<path d="{circ(100, 108, 30)}" fill="{DSTONE_S}" opacity="0.18"/>'
                  + strokes("M 100 84 L 100 112", DSTONE_S, 5, 0.55)
                  + f'<path d="{ell(86, 92, 10, 6)}" fill="#FFFFFF" opacity="0.25"/>')
    S.shape(rr(100, 128, 44, 14, 6), "#2E2428", shadow=0, side=False)
    for x in (88, 100, 112):   # the darts waiting in it, points out
        S.shape(poly([(x - 4.5, 128), (x + 4.5, 128), (x, 142)]), "#C8CCD4", shadow=0, side=False)
    return save("enemies", "dunes-dart-trap", S)


def venom_spirit():
    return save("enemies", "dunes-venom-spirit", spirit9("poison", "Venom Spirit", "venom: a lime-green core with a dark drop in it, a green tail."))


def wind_spirit():
    return save("enemies", "dunes-wind-spirit", spirit9("haste", "Wind Spirit", "wind: a white, sky-pale core with a swirl in it, a pale blue tail."))


BUILD = {"dunes-scarab": scarab, "dunes-cobra": cobra, "dunes-jackal": jackal, "dunes-mummy": mummy, "dunes-sand-mage": sand_mage,
         "dunes-dust-devil": dust_devil, "dunes-serpent-head": serpent_head, "dunes-serpent-coil": serpent_coil,
         "dunes-dart-trap": dart_trap, "dunes-venom-spirit": venom_spirit, "dunes-wind-spirit": wind_spirit}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
