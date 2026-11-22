"""Round 10, second pass:
  kinds on the Frost and Dunes cards (both IDK) that had no note and were not ticked, looked at again against this
  round's standard and redrawn where they fell short: the ice slime (it followed the old tailed slime: now the picked
  slime in ice), the sand mage (a turban, a veil, a sun staff, an orb of sand), the dart trap (in the wall, like the
  Foundry's wall turrets);
  the Spire's seraph (it wore the angel with a halo the designer sent back) and cherub (round 4's, never picked), on
  the picked angel's build; and the Pit Lord (it sat close to the red devil and the demon).
python second10.py [name ...]   -> ../../enemies/*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *
from bandits8 import MASK
from spire9 import feather9, cherub_hair
from bosses10 import wing_pair

TURQ, LSAND = "#3FB8A8", "#E8D29A"


def hi(x, y, rx, ry, o=0.25, rot=0):
    r = f' transform="rotate({rot} {x} {y})"' if rot else ""
    return f'<path d="{ell(x, y, rx, ry)}" fill="#FFFFFF" opacity="{o}"{r}/>'


# ================================================================== ice slime
def ice_slime():
    S = Sprite("ICE SLIME (round 10): the game's slime (the picked slime, tail removed) made of ice: the same soft rounded "
               "cube, glassy, white at the top left going clear blue, three ice shards frozen inside it where the slime "
               "has its bone, a frosted rim, a bright shine. No eyes, no tail. Parts: #body only (it hops whole). " + LAYOUT)
    S.add_def('<linearGradient id="gIce10" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#FFFFFF"/>'
              '<stop offset="0.45" stop-color="#C4EAFA"/><stop offset="1" stop-color="#6EB4E2"/></linearGradient>')
    S.group("body")
    inside = ""
    for pts in ([(66, 92), (94, 74), (108, 104), (82, 120)], [(108, 112), (136, 98), (146, 130), (120, 144)], [(74, 128), (92, 122), (98, 148), (80, 152)]):
        cx = sum(x for x, _ in pts) / 4
        inside += (f'<path d="{poly(pts)}" fill="#F0FBFF" opacity="0.9"/>'
                   f'<path d="{poly([pts[1], pts[2], pts[3]])}" fill="#7CBCE0" opacity="0.55"/>'
                   f'<path d="{poly([pts[0], pts[1], (cx, (pts[0][1] + pts[2][1]) / 2)])}" fill="#FFFFFF" opacity="0.8"/>')
    S.shape(rr(100, 104, 136, 122, 44), fill="url(#gIce10)", shadow=0, side=False,
            decor='<path d="M36 140 C60 160 140 160 164 140 L164 180 L36 180 Z" fill="#3E7AAE" opacity="0.28"/>' + inside
                  + f'<path d="{rr(100, 104, 122, 108, 37)}" fill="none" stroke="#FFFFFF" stroke-width="4" opacity="0.55"/>'
                  + f'<path d="{blob([(58, 78), (76, 66), (88, 70), (72, 84), (60, 90)], 1.0)}" fill="#FFFFFF" opacity="0.85"/>')
    return save("enemies", "frost-ice-slime", S)


# ================================================================== sand mage
def sand_mage():
    S = Sprite("SAND MAGE (round 10): a desert mage in the heroes' bust build: a teal turban wound in big folds with a gold "
               "brooch and a white plume, its tail of cloth lying back (#back, sways), a cream veil over the lower face (no "
               "eyes), an ochre robe with a turquoise border; a staff topped with a gold sun under the right shoulder "
               "(arm-r), and an orb of whirling sand held out in the left hand (arm-l); both lift when it casts. " + LAYOUT)
    OCHRE, TEAL = "#C8843A", "#2E9A98"
    S.group("back", (112, 56), "the turban's tail")
    S.shape(strip([(114, 56), (132, 40), (150, 22), (150, 2)], 13, taper=(0.8, 1.0)), shade(TEAL, 0.82), shadow=0)
    S.group("arm-r", PR, "sun staff")
    T = frame(160, 100, 4)
    S.shape(rr(0, 6, 9, 92, 4.5), "#8A5A30", T=T, shadow=0)
    S.shape(poly(star(0, 64, 23, 13, 8, 0)), GOLD, T=T, shadow=2)
    S.shape(circ(0, 64, 11), "#FFF2C0", T=T, shadow=2, decor='<circle cx="-3" cy="61" r="3.5" fill="#FFFFFF"/>')
    fist(S, 0, 0, T=T)
    S.group("body")
    S.shape(SHOULDERS, OCHRE, decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", TURQ, 6, 0.95)
            + strokes("M 34 106 Q 62 124 100 126 Q 138 124 166 106", GOLD, 3, 0.9))
    head(S)
    S.shape(MASK, "#F2E8D0", shadow=3,
            decor='<path d="M50 138 C74 150 126 150 150 138 L150 190 L50 190 Z" fill="#D8C8A4" opacity="0.5"/>')
    S.raw('<path d="M68 128 Q100 138 132 128" fill="none" stroke="#C8B48C" stroke-width="3" stroke-linecap="round" opacity="0.8"/>')
    turban = blob([(48, 92), (42, 66), (58, 40), (100, 28), (142, 40), (158, 66), (152, 92), (128, 99), (100, 101), (72, 99)], 0.85)
    S.shape(turban, TEAL, shadow=5,
            decor=strokes("M 46 84 C 70 62 112 54 154 66 M 50 66 C 74 46 114 40 146 48 M 56 96 C 84 82 124 78 156 86", shade(TEAL, 0.68), 4, 0.6)
                  + hi(78, 44, 18, 8, 0.2, -12))
    pf, ph = feather([(100, 90), (98, 68), (104, 48), (114, 36)], 9)
    S.shape(pf, "#FFFFFF", shadow=3, decor=f'<path d="{ph}" fill="#D8D0C0" opacity="0.7"/>')
    S.shape(circ(100, 92, 10), GOLD, shadow=2, decor='<circle cx="100" cy="92" r="4.5" fill="#D8463F"/>')
    S.group("arm-l", PL, "an orb of sand")
    fist(S, 50, 144, -6)
    S.shape(circ(44, 168, 17), LSAND, shadow=3,
            decor='<path d="M 34 172 C 32 158 50 154 54 164 C 57 173 44 178 41 170 C 39 165 45 162 48 166" fill="none" stroke="#B08A48" '
                  'stroke-width="3.5" stroke-linecap="round"/>' + hi(38, 160, 5, 3, 0.6))
    return save("enemies", "dunes-sand-mage", S)


# ================================================================== dart trap
# round 11: hooks for the variant sets the notes ask for (A2/new11.py sets one, builds, and clears it). With every hook
# None the generators below draw exactly what they drew.
#   EYE_FN(S)            the dart trap's "eye" (the mark carved on its head), in place of the gold winged sun
#   FACE_FN(S, OBS, LAVA, BONE)   the Pit Lord's face, in place of the jagged molten grin
#   TAIL_FN(S, OBS, LAVA, BONE)   a tail for the Pit Lord (#back, after the wings)
EYE_FN = FACE_FN = TAIL_FN = None


def dart_trap():
    S = Sprite("DART TRAP (round 10): a trap set in a tomb wall, seen from above, built like the Foundry's wall turrets: a "
               "carved sandstone block built out from the wall with a turquoise band along its lip and a round socket in "
               "its front edge (#back: it stays on the wall), and half in the socket the part that turns to aim: a round "
               "stone head with a gold winged sun carved on it and a dark slot of a mouth with three darts in it, points "
               "out. No eyes. Parts: #back (the block), #body (the head). " + LAYOUT)
    STONE_S, DSTONE_S = "#D6BE94", "#8E7652"
    S.group("back", (100, 100), "the block (stays on the wall)")
    # the wall's face is 64 units behind the centre (families.js mountOnWall at headR 45): the block runs from it to the centre
    block = "M 22 36 L 178 36 L 178 90 Q 178 104 164 104 L 36 104 Q 22 104 22 90 Z"
    glyphs = strokes("M 40 52 L 40 68 M 48 52 L 56 60 L 48 68 M 152 52 L 152 68 M 160 52 L 160 68 M 34 80 L 60 80 M 140 80 L 166 80", DSTONE_S, 3.5, 0.6)
    S.shape(block, STONE_S, shadow=0,
            decor=f'<path d="M 20 92 L 180 92 L 180 106 L 20 106 Z" fill="{TURQ}"/>' + glyphs + f'<path d="{circ(100, 104, 52)}" fill="#3A2E28"/>'
                  + hi(60, 44, 24, 5, 0.25))
    S.group("body")
    for x in (86, 100, 114):   # the darts, points out, their shafts in the mouth
        S.shape(poly([(x - 5, 138), (x + 5, 138), (x, 160)]), "#C8CCD4", shadow=0, side=False)
    S.shape(circ(100, 104, 46), light(STONE_S, 1.05), shadow=3,
            decor=f'<circle cx="100" cy="104" r="38" fill="none" stroke="{DSTONE_S}" stroke-width="3" opacity="0.45"/>'
                  + f'<path d="{rr(100, 134, 50, 15, 7)}" fill="#2E2428"/>' + hi(82, 76, 14, 7, 0.3, -20))
    if EYE_FN:
        EYE_FN(S)
        return save("enemies", "dunes-dart-trap", S)
    wing = [(100, 94), (118, 88), (136, 92), (132, 100), (118, 98), (128, 106), (112, 104), (100, 104)]
    S.shape(blob(wing, 0.5) + " " + blob(mirror(wing), 0.5), GOLD, shadow=2)
    S.shape(circ(100, 96, 10), "#FFE08A", shadow=2, decor='<circle cx="97" cy="93" r="3.5" fill="#FFFFFF" opacity="0.8"/>')
    return save("enemies", "dunes-dart-trap", S)


# ================================================================== the Spire's seraph and cherub
# round 11 (art-round10b deck, the Seraph: "Use the old head shape."; on the one before it: "I like the head shape of
# this."): SERAPH_R11: the head and the hair are the old seraph's own outlines (art/enemies/placeholder/seraph.svg: its
# head path and its cap of hair with the scalloped fringe, copied point for point), in this seraph's pale gold; the
# mouth sits where the old head's did. The halo ring, wings, robe, collar and hands are untouched.
SERAPH_R11 = False
OLD_HEAD = ("M100 50 C110.7 50 123.8 49.7 132 54 C140.2 58.3 146 67.7 149 76 C152 84.3 151.5 95.3 150 104 C148.5 112.7 148.3 121.3 140 128 C131.7 134.7 113.3 144 100 144 C86.7 144 68.3 134.7 60 128 C51.7 121.3 51.5 112.7 50 104 C48.5 95.3 48 84.3 51 76 C54 67.7 59.8 58.3 68 54 C76.2 49.7 89.3 50 100 50 Z")
OLD_HAIR = ("M100 42 C106.8 42 117.5 41.7 124 44 C130.5 46.3 141.5 52.6 146 58 C150.5 63.4 154.6 74.6 156 82 C157.4 89.4 157.1 104 156 110 C154.9 116 150 124.6 148 124 C146 123.4 144.3 110 142 106 C139.7 102 135.7 96.8 132 96 C128.3 95.2 120.5 100 116 100 C111.5 100 104.5 96 100 96 C95.5 96 88.5 100 84 100 C79.5 100 71.7 95.2 68 96 C64.3 96.8 60.3 102 58 106 C55.7 110 54 123.4 52 124 C50 124.6 45.1 116 44 110 C42.9 104 42.6 89.4 44 82 C45.4 74.6 49.5 63.4 54 58 C58.5 52.6 69.5 46.3 76 44 C82.5 41.7 93.2 42 100 42 Z")


def seraph():
    S = Sprite("SERAPH (round 10): one of the host on the picked angel's build, a caster, not a spearman: four of the angel's "
               "white two-layer wings (a pair spread, a pair swept down: #back, sway), a white robe with a gold collar, long "
               "pale gold hair, a gold halo ring worn over the hair (the picked Angel B's, layered over the head), no eyes; "
               "both hands held out to cast in gold cuffs (arm-l, arm-r: they lift when it casts). " + LAYOUT)
    S.group("back", (100, 92), "four wings")
    wing_pair(S, 40, 0.8, "#E2DEEC", "#F6F4FA")
    wing_pair(S, -4, 0.98, "#FFFFFF", "#F0EEF6", shadow=3)
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 54, 110), "a casting hand")
        S.shape(rr(100 + s * 52, 136, 28, 11, 5), GOLD, T=f"rotate({-s * 6} {100 + s * 52} 136)", shadow=0)
        fist(S, 100 + s * 52, 150, s * -6)
    S.group("body")
    S.shape(SHOULDERS, "#FBF8F0", decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", GOLD, 5, 0.9))
    S.shape(blob([(62, 112), (100, 106), (138, 112), (134, 134), (100, 146), (66, 134)], 0.85), GOLD, shadow=3)
    if SERAPH_R11:
        S.comment = S.comment.replace("(round 10)", "(round 11: the old seraph's head shape and cap of hair; round 10)")
        S.shape(OLD_HEAD, fill="url(#gFace)", shadow=5, decor='<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>')
        mouth(S, 129, "#C98868")
        S.shape(OLD_HAIR, "#F4DC9A", shadow=4)
    else:
        head(S)
        mouth(S, 138, "#C98868")
        S.shape(blob([(50, 122), (46, 84), (60, 56), (100, 44), (140, 56), (154, 84), (150, 122), (142, 104), (134, 92), (118, 96),
                      (100, 90), (82, 96), (66, 92), (58, 104)], 0.85), "#F4DC9A", shadow=4,
                decor=strokes("M 100 86 L 100 96", "#D8B860", 3, 0.6))
    S.shape(ell(100, 64, 36, 31) + " " + ell(100, 64, 27, 22), "#F6CF5A", shadow=5, rule="evenodd",
            decor='<path d="M 70 52 A 32 27 0 0 1 96 36" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.6"/>')
    return save("enemies", "spire-seraph", S)


def cherub():
    S = Sprite("CHERUB (round 10): a little love-archer of the host seen from above, kin to the choir sprite: a round head "
               "with a cap of golden curls and the heroes' small mouth (no eyes), a white wrap with a rose sash, two small "
               "white wings (#back, sway); a small gold bow held out in front (arm-l, with its string, which the game draws "
               "to the drawing hand) and an arrow tipped with a heart in the drawing hand (arm-r). " + LAYOUT)
    S.group("back", (100, 96), "small wings")
    for s in (-1, 1):
        for a, L, w in ((-96, 58, 14), (-116, 68, 14), (-138, 62, 13)):
            d, T = feather9((100 + s * 30, 100), s * a, L, w)
            S.shape(d, "#FFFFFF", T=T, shadow=2, sop=0.18, decor=f'<path d="M 0 8 L 0 {L * 0.85}" stroke="#CCD2E2" stroke-width="3" opacity="0.7"/>')
    S.group("body")
    S.shape(ell(100, 116, 50, 30), "#FBF8F0", decor=strokes("M 56 104 Q 96 130 142 128", "#E8708A", 8, 0.95))
    head(S)
    mouth(S, 137, "#D98A7A")
    S.shape(cherub_hair(), "#F2C454", shadow=4, decor=hi(84, 64, 16, 9, 0.4))
    S.group("arm-l", PL, "bow, string and the hand holding it")
    S.raw('<path id="string" d="M44 142 L100 152 L156 142" fill="none" stroke="#FFF8E8" stroke-width="2.5" '
          'stroke-linecap="round" stroke-linejoin="round"/>')
    outer = [(38, 138), (58, 156), (80, 168), (100, 172), (120, 168), (142, 156), (162, 138)]
    inner = [(x, y - 8) for x, y in outer[::-1]]
    S.shape(blob(outer + inner, 0.5), GOLD, shadow=0)
    fist(S, 100, 170, 90, w=19, h=22)
    S.group("arm-r", PR, "heart arrow and the drawing hand")
    S.shape(rr(100, 172, 4, 34, 2), "#C89A60", shadow=0)
    S.shape("M100 205 C92 197 85 191 89 184 C93 179 99 181 100 186 C101 181 107 179 111 184 C115 191 108 197 100 205 Z", "#F0607E", shadow=1)
    fist(S, 100, 153, 90, w=18, h=20)
    return save("enemies", "spire-cherub", S)


# ================================================================== the Pit Lord
def pit_lord():
    S = Sprite("THE PIT LORD (round 10): the Ember Deep's lord, drawn again to stand apart from the red devil and the demon: "
               "a great figure of black obsidian in the heroes' bust build, cracked through with glowing lava: broad black "
               "shoulders with molten cracks, a heavy iron collar, an obsidian head with a jagged molten grin (no eyes) and "
               "two huge pale bone horns sweeping out and back, two red bat wings spread behind (#back, sway); a whip of "
               "fire in the right hand (arm-r: the handle in the fist, the burning lash curling in across the front), a "
               "clawed left hand (arm-l). " + LAYOUT)
    OBS, DOBS, LAVA, BONE = "#4A4050", "#2E2632", "#FF8A2E", "#EFE4C6"
    S.add_def(FLAME_DEF.replace('id="gFlame"', 'id="gFlame10"')
              + '<linearGradient id="gFlameUp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFB23A"/><stop offset="1" stop-color="#E8542A"/></linearGradient>'
              + f'<radialGradient id="gHandObs" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#6A5E70"/><stop offset="1" stop-color="{DOBS}"/></radialGradient>')
    S.group("back", (100, 90), "wings")
    for s in (-1, 1):
        w = [(118, 96), (128, 64), (150, 36), (182, 14), (204, 18), (196, 36), (206, 52), (190, 62), (196, 80), (176, 84), (172, 102), (150, 98), (136, 108)]
        ribs = strokes("M 122 92 L 182 18 M 126 94 L 198 48 M 130 98 L 190 76", "#5A161C", 5, 0.8)
        if s < 0:
            w = mirror(w)
            ribs = strokes("M 78 92 L 18 18 M 74 94 L 2 48 M 70 98 L 10 76", "#5A161C", 5, 0.8)
        S.shape(blob(w, 0.6), "#A8323A", shadow=0, decor=ribs)
    if TAIL_FN:
        TAIL_FN(S, OBS, LAVA, BONE)
    S.group("arm-r", (154, 108), "whip of fire")
    T = frame(170, 144, 0)
    lash = taper([(0, 10), (7, 32), (-4, 50), (-26, 58), (-50, 56)], 14, 5, 0.8)
    S.shape(lash, fill="url(#gFlameUp)", T=T, shadow=0, side=False,
            decor=f'<path d="{taper([(0, 14), (6, 32), (-4, 48), (-24, 55)], 4.5, 2, 0.8)}" fill="#FFE27A"/>')
    d, Tf = flame(-48, 56, 90, 24, 11)
    S.shape(d, fill="url(#gFlameUp)", T=f"{T} {Tf}", shadow=0, side=False)
    S.shape(rr(0, -8, 11, 30, 4), "#3A2A26", T=T, shadow=2)
    fist(S, 0, -6, T=T, w=24, h=27, hand="url(#gHandObs)")
    S.group("body")
    cracks = strokes("M 26 98 L 40 110 L 34 124 L 46 134 M 174 98 L 160 110 L 166 124 L 154 134 M 52 84 L 62 96 L 56 106 M 148 84 L 138 96 L 144 106",
                     LAVA, 4.5, 0.95)
    S.shape("M10 110 C10 80 48 70 100 70 C152 70 190 80 190 110 C190 138 152 146 100 146 C48 146 10 138 10 110 Z", OBS, decor=cracks + hi(52, 86, 22, 7, 0.1))
    S.shape(blob([(58, 106), (100, 98), (142, 106), (138, 130), (100, 140), (62, 130)], 0.85), "#6E6874", shadow=3,
            decor=f'<circle cx="100" cy="128" r="6" fill="{LAVA}"/>')
    for s in (-1, 1):   # the horns: huge, pale, sweeping out and back from the temples
        h = [(126, 86), (146, 82), (166, 64), (176, 38), (172, 10), (160, 34), (148, 52), (128, 62)]
        tip = [(176, 38), (172, 10), (160, 34)]
        if s < 0:
            h, tip = mirror(h), mirror(tip)
        S.shape(blob(h, 0.8), BONE, shadow=3, decor=f'<path d="{blob(tip + [tip[0]], 0.6)}" fill="#8A7A5A" opacity="0.6"/>')
    S.shape(HEAD, OBS, shadow=5,
            decor=strokes("M 100 50 L 96 66 L 104 78 L 98 92 M 66 78 L 76 90 M 134 78 L 124 90", LAVA, 4, 0.95) + hi(80, 68, 16, 9, 0.12))
    if FACE_FN:
        FACE_FN(S, OBS, LAVA, BONE)
    else:
        S.shape(poly([(72, 124), (82, 132), (91, 124), (100, 133), (109, 124), (118, 132), (128, 124), (120, 142), (100, 148), (80, 142)]),
                fill="#FFB23A", shadow=0, side=False, decor='<path d="M 70 136 L 130 136 L 130 150 L 70 150 Z" fill="#E8542A" opacity="0.7"/>')
    S.group("arm-l", (46, 108), "clawed hand")
    for dx in (-9, 0, 9):
        S.shape(poly([(36 + dx - 4.5, 152), (36 + dx + 4.5, 152), (36 + dx * 1.25, 172)]), BONE, shadow=0, side=False)
    fist(S, 36, 144, -6, w=26, h=30, hand="url(#gHandObs)")
    return save("enemies", "ember-pit-lord", S)


BUILD = {"frost-ice-slime": ice_slime, "dunes-sand-mage": sand_mage, "dunes-dart-trap": dart_trap, "spire-seraph": seraph,
         "spire-cherub": cherub, "ember-pit-lord": pit_lord}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
