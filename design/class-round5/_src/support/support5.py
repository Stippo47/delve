"""Round 5 (lane A1): the support heroes. python support5.py [name ...] -> ../../heroes-support/support-<name>.svg
Weapons and hands live in the arm groups (weapon arms before #body, so only the fist shows), never in #body.
Paths are relative to this file."""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from lib import *
import more

OUT = pathlib.Path(__file__).resolve().parents[2] / "heroes-support"
OUT.mkdir(parents=True, exist_ok=True)
PL, PR = (46, 108), (154, 108)
GOLD, WOOD = "#F2B53A", "#B07A46"
LAYOUT = ("Parts in draw order inside #sprite; the outline comes from the #outline filter. Facing = DOWN (+y), "
          "centre (100,100).")
FARM_BRIM = "M 28 68 C 28 40 60 20 100 20 C 140 20 172 40 172 68 C 172 96 140 116 100 116 C 60 116 28 96 28 68 Z"
FARM_CROWN = "M 56 60 C 54 34 75 24 100 24 C 125 24 146 34 144 60 C 144 74 125 82 100 82 C 75 82 56 74 56 60 Z"
FARM_BAND = ("M 56 56 C 62 68 80 75 100 75 C 120 75 138 68 144 56 C 145 61 145 67 144 70 C 138 80 120 85 100 85 "
             "C 80 85 62 80 56 70 C 55 67 55 61 56 56 Z")


def save(name, S):
    p = OUT / f"support-{name}.svg"
    p.write_text(S.svg(), encoding="utf-8")
    return p.name


def arc_pts(cx, cy, rx, ry, a0, a1, n):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / (n - 1))),
             cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / (n - 1)))) for i in range(n)]


# ------------------------------------------------------------------ Monk: the necklace lies on the shoulders
def monk():
    S = Sprite("SUPPORT Monk (round 5: necklace fixed): shaved head with a small topknot, saffron robe with a maroon sash "
               "over the left shoulder, big wooden prayer beads round the neck: the loop is drawn before the head, so it "
               "comes out from under the chin and hangs in front, the big red bead at the bottom, two big "
               "fists with white wraps held up in front (arm-l, arm-r, after #body). " + LAYOUT)
    S.add_def('<radialGradient id="gBald" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="#F6D3B0"/>'
              '<stop offset="0.7" stop-color="#E9B88F"/><stop offset="1" stop-color="#D49E78"/></radialGradient>')
    S.group("body")
    S.shape(SHOULDERS, "#E8892B")
    S.shape(poly([(30, 96), (52, 80), (112, 140), (80, 140)]), "#93302C", shadow=3)
    # the loop goes round the back of the neck under the head and hangs down in front, below the chin
    for i, (x, y) in enumerate(arc_pts(100, 126, 42, 38, -10, 190, 15)):
        big = i == 7
        S.shape(circ(x, y, 11 if big else 8), "#C8402F" if big else "#B07440", shadow=2.5)
    S.shape(ell(52.1, 108.7, 7, 9.6), fill="#F0C49D", shadow=0, side=False)
    S.shape(ell(147.8, 108.7, 7, 9.6), fill="#D8A27C", shadow=0, side=False)
    S.shape(HEAD, fill="url(#gBald)", shadow=5,
            decor='<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>'
                  f'<path d="{ell(84, 70, 15, 10)}" fill="#FFF0DE" opacity="0.55"/>')
    S.shape(circ(100, 40, 10), "#3A2A24", shadow=3)
    S.mouth()
    S.group("arm-l", PL, "wrapped fist")
    S.fist(48, 156, 14, w=26, h=26)
    S.shape(rr(48, 144, 24, 8, 3), "#F2EDE2", T="rotate(14 48 156)", shadow=0)
    S.group("arm-r", PR, "wrapped fist, punching")
    S.fist(150, 170, -14, w=26, h=26)
    S.shape(rr(150, 158, 24, 8, 3), "#F2EDE2", T="rotate(-14 150 170)", shadow=0)
    return save("monk", S)


# ------------------------------------------------------------------ Seer: the hair redone
def seer():
    S = Sprite("SUPPORT Seer (round 5: hair redone): long smooth silver-lilac hair parted in the middle, one soft mass "
               "falling down the back and two tapered locks framing the face onto the shoulders; a violet blindfold "
               "tied over the eyes, its two tails trailing back over the hair; midnight shawl. A glowing crystal ball "
               "held out in front in both cupped hands (all in arm-r, after #body; arm-l left out). " + LAYOUT)
    S.add_def('<radialGradient id="gOrb" cx="0.38" cy="0.34" r="0.7"><stop offset="0" stop-color="#E9FFFB"/>'
              '<stop offset="0.35" stop-color="#8BEFE0"/><stop offset="1" stop-color="#2FA7B4"/></radialGradient>')
    S.group("back", (100, 70), "hair falling down the back, blindfold tails")
    S.shape("M 52 96 C 46 62 62 30 100 26 C 138 30 154 62 148 96 C 150 70 146 40 134 22 C 124 8 112 2 100 2 "
            "C 88 2 76 8 66 22 C 54 40 50 70 52 96 Z", "#C2B0E4", shadow=0)
    S.shape("M 60 96 C 56 60 64 26 82 8 C 90 2 110 2 118 8 C 136 26 144 60 140 96 Z", "#C2B0E4", shadow=0,
            decor='<path d="M 80 14 C 74 40 74 70 78 96 M 120 14 C 126 40 126 70 122 96" stroke="#A796CB" '
                  'stroke-width="4" fill="none" opacity="0.6"/>')
    S.shape(blob([(94, 60), (88, 40), (84, 22), (88, 18), (96, 36), (102, 56)], 0.8), "#7A45B4", shadow=3)
    S.shape(blob([(106, 60), (112, 40), (118, 24), (122, 28), (114, 44), (100, 58)], 0.8), "#7A45B4", shadow=3)
    S.group("body")
    S.shape(SHOULDERS, "#33447F")
    S.head()
    # the two front locks, smooth and tapering, lying on the shoulders beside the face
    lock = "M 54 96 C 46 112 44 132 50 152 C 54 160 60 162 62 154 C 64 138 64 118 64 100 Z"
    S.shape(lock, "#D2C4EC", shadow=3)
    S.shape(" ".join([lock.replace("54 96", "146 96")]) if False else
            "M 146 96 C 154 112 156 132 150 152 C 146 160 140 162 138 154 C 136 138 136 118 136 100 Z", "#D2C4EC", shadow=3)
    # the hair over the top of the head, parted in the middle
    S.shape("M 52 108 C 46 74 66 48 100 46 C 134 48 154 74 148 108 C 138 98 124 92 108 90 C 104 92 102 96 100 100 "
            "C 98 96 96 92 92 90 C 76 92 62 98 52 108 Z", "#DCD0F0", shadow=4,
            decor='<path d="M 100 46 C 98 64 99 84 100 100" stroke="#A796CB" stroke-width="3.5" fill="none" opacity="0.8"/>')
    S.shape("M 47 104 C 70 98 130 98 153 104 L 151 120 C 130 114 70 114 49 120 Z", "#6B3FA0", shadow=3)
    S.mouth()
    S.group("arm-r", PR, "crystal ball in both hands")
    S.fist(78, 170, 35, w=20, h=24)
    S.fist(122, 170, -35, w=20, h=24)
    S.shape(circ(100, 174, 20), fill="url(#gOrb)", shadow=4,
            decor='<path d="M 86 168 A 14 14 0 0 1 98 158" stroke="#FFFFFF" stroke-width="4" fill="none" '
                  'stroke-linecap="round" opacity="0.85"/>')
    return save("seer", S)


# ------------------------------------------------------------------ Beekeeper: the farmers' hat
def beekeeper():
    S = Sprite("SUPPORT Beekeeper (round 5: the hat rebuilt on the farmers' straw hat): the Haymaker's brim, crown and "
               "band, in pale canvas with a dark band, a mesh veil hanging from the brim over the face; white suit, a "
               "copper smoker puffing smoke in the right hand (arm-r, before #body; only the fist shows), left hand free, "
               "three bees buzzing round (#front). " + LAYOUT)
    S.add_def('<pattern id="pMesh" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0 L5 5 M5 0 L0 5" '
              'stroke="#8C8890" stroke-width="0.8" opacity="0.55"/></pattern>')
    S.group("arm-r", PR, "smoker")
    T = frame(150, 124, 22)
    S.shape(rr(0, 8, 16, 26, 5), "#7A5236", T=T, shadow=0)
    S.shape(rr(0, 36, 26, 30, 7), "#C8783C", T=T, shadow=0,
            decor='<rect x="-14" y="29" width="28" height="4" fill="#8E4F22" opacity="0.6"/>')
    S.shape(poly([(-8, 49), (8, 49), (3, 60), (-3, 60)]), "#9A9FA8", T=T, shadow=2)
    S.shape(circ(2, 67, 6.5), "#E6E3E0", T=T, shadow=0)
    S.shape(circ(-5, 78, 5), "#E6E3E0", T=T, shadow=0)
    S.fist(0, 12, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#F2EFE8")
    S.shape(ell(100, 120, 54, 38), "#4F4B55", shadow=4,
            decor='<rect x="40" y="70" width="120" height="100" fill="url(#pMesh)"/>')
    S.shape(FARM_BRIM, "#DCD2AE", shadow=4)
    S.shape(FARM_CROWN, "#E6DDBC", shadow=4, decor=f'<path d="{ell(80, 42, 13, 8)}" fill="#FFFBEA" opacity="0.5"/>')
    S.shape(FARM_BAND, "#5E4E3A", shadow=2)
    S.group("arm-l", PL, "free hand")
    S.fist(50, 150, -6)
    S.group("front", note="bees")
    more.bee(S, 22, 58, -30)
    more.bee(S, 182, 36, 25)
    more.bee(S, 26, 184, 160)
    return save("beekeeper", S)


# ------------------------------------------------------------------ Chef: redone
def chef():
    S = Sprite("SUPPORT Chef (round 5, redone): the face shows now: a puffy white toque sits on top of the head with its "
               "band round the brow, a big dark handlebar moustache, white double-breasted jacket, red neckerchief. A black "
               "iron frying pan in the right hand and a wooden spoon in the left; both arms before #body, so the handles "
               "run under the shoulders and only the fists show. " + LAYOUT)
    S.group("arm-l", PL, "wooden spoon")
    T = frame(52, 128, -24)
    S.shape(rr(0, 26, 8, 62, 4), "#C8935A", T=T, shadow=0)
    S.shape(ell(0, 60, 10, 13), "#D8A46A", T=T, shadow=2, decor='<ellipse cx="1" cy="61" rx="6" ry="8.5" fill="#B07A44" opacity="0.6"/>')
    S.fist(0, 12, T=T, under=True)
    S.group("arm-r", PR, "frying pan")
    T = frame(150, 128, 30)
    S.shape(rr(0, 18, 10, 52, 5), "#3F3B45", T=T, shadow=0)
    S.shape(circ(0, 54, 25), "#47434E", T=T, shadow=3,
            decor='<circle cx="2" cy="56" r="18" fill="#2F2C35"/><path d="M -12 44 A 16 16 0 0 1 4 38" stroke="#7B7686" '
                  'stroke-width="3" fill="none" stroke-linecap="round"/>')
    S.fist(0, 12, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#F1EFEA",
            decor=''.join(f'<circle cx="{x}" cy="{y}" r="3.2" fill="#B9B2A6"/>' for x, y in [(68, 124), (76, 134), (132, 124), (124, 134)]))
    S.head()
    # toque: the band round the brow, then the puffed top over the crown of the head
    S.shape("M 52 100 C 58 84 78 76 100 76 C 122 76 142 84 148 100 C 136 94 120 90 100 90 C 80 90 64 94 52 100 Z",
            "#F3F1EC", shadow=4, decor='<path d="M 52 100 C 64 94 80 90 100 90 C 120 90 136 94 148 100 L 148 94 C 136 88 120 84 100 84 C 80 84 64 88 52 94 Z" fill="#DCD6CA"/>')
    S.shape(cloud(100, 52, 40, 7, 0.7, 10), "#FBFAF6", shadow=5,
            decor=f'<path d="{circ(92, 44, 20)}" fill="#FFFFFF" opacity="0.6"/>')
    S.shape("M 100 128 C 92 122 78 122 70 128 C 62 134 56 132 54 124 C 50 136 62 144 74 140 C 84 137 94 134 100 136 "
            "C 106 134 116 137 126 140 C 138 144 150 136 146 124 C 144 132 138 134 130 128 C 122 122 108 122 100 128 Z",
            "#4A2E22", shadow=3)
    S.mouth(143)
    S.shape(poly([(84, 150), (116, 150), (110, 160), (100, 168), (90, 160)]), "#D23A32", shadow=3)
    return save("chef", S)


# ------------------------------------------------------------------ Cleric: ranged now, a light orb
def cleric():
    S = Sprite("SUPPORT Cleric (round 5, redone: ranged, a light orb): a white hood with a gold rim and a gold sun "
               "emblem on its top; cream robe with a sky-blue stole; a slim white-and-gold staff holding a glowing light "
               "orb in a gold cradle, in the right fist (before #body, so it runs under the shoulder; only the fist "
               "shows); a soft light glowing over the open left hand (the healing ray). " + LAYOUT)
    S.add_def('<radialGradient id="gLight" cx="0.4" cy="0.38" r="0.62"><stop offset="0" stop-color="#FFFFFF"/>'
              '<stop offset="0.45" stop-color="#FFF6C8"/><stop offset="1" stop-color="#F6CF5A"/></radialGradient>')
    S.group("arm-r", PR, "light-orb staff")
    T = frame(150, 124, 16)
    S.shape(rr(0, 20, 8, 70, 4), "#F2EEE4", T=T, shadow=0)
    S.shape(rr(0, 52, 14, 6, 3), GOLD, T=T, shadow=2)
    cradle = ("M -14 52 C -18 62 -16 74 -8 80 L -6 76 C -11 70 -12 62 -9 56 Z "
              "M 14 52 C 18 62 16 74 8 80 L 6 76 C 11 70 12 62 9 56 Z")
    S.shape(cradle, GOLD, T=T, shadow=2)
    S.shape(circ(0, 68, 12), fill="url(#gLight)", T=T, shadow=0, side=False)
    S.fist(0, 12, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#F2ECDD")
    S.shape("M 52 84 C 60 80 70 80 76 82 L 80 140 C 70 140 60 136 54 132 Z", "#7DB4E6", shadow=3)
    S.shape("M 148 84 C 140 80 130 80 124 82 L 120 140 C 130 140 140 136 146 132 Z", "#7DB4E6", shadow=3)
    S.head(ears=False)
    hood = ("M 46 128 C 38 82 60 40 100 40 C 140 40 162 82 154 128 C 151 140 139 142 135 130 C 129 108 117 98 100 98 "
            "C 83 98 71 108 65 130 C 61 142 49 140 46 128 Z")
    rim = "M 65 130 C 71 108 83 98 100 98 C 117 98 129 108 135 130"
    S.shape(hood, "#F7F3EA", shadow=4, decor=f'<path d="{rim}" fill="none" stroke="{GOLD}" stroke-width="11"/>')
    S.shape(blob(star(100, 66, 17, 11, 8), 0.35), GOLD, shadow=2)
    S.shape(circ(100, 66, 8), "#FFF1B8", shadow=0, side=False)
    S.mouth()
    S.group("arm-l", PL, "open hand with a soft light")
    S.fist(54, 146, -8)
    S.shape(circ(54, 166, 9), fill="url(#gLight)", shadow=0, side=False)
    return save("cleric", S)


# ------------------------------------------------------------------ Lantern keeper: redone
def lantern_keeper():
    S = Sprite("SUPPORT Lantern keeper (round 5, redone): an old lamplighter with a long white beard, in a wide moss-green oilskin cape and a "
               "deep hood; a long crook pole in the right hand (before #body; only the fist shows) "
               "with a big brass lantern hanging from the hook out in front, its four glass panes glowing; a ring of "
               "keys in the left fist. " + LAYOUT)
    S.add_def('<radialGradient id="gPane" cx="0.45" cy="0.42" r="0.7"><stop offset="0" stop-color="#FFFBE0"/>'
              '<stop offset="0.5" stop-color="#FFD25A"/><stop offset="1" stop-color="#F08A24"/></radialGradient>')
    S.group("arm-r", PR, "crook pole and lantern")
    T = frame(156, 106, 8)
    S.shape(rr(0, 22, 9, 58, 4.5), "#5A3A26", T=T, shadow=0)
    S.shape("M -4.5 50 C -4.5 60 4 66 12 62 L 9 56 C 6 58 4.5 56 4.5 50 Z", "#3F3B45", T=T, shadow=0)
    # the lantern: a square cage of glowing panes seen from above, a round brass cap on top
    S.shape(rr(4, 78, 34, 34, 7), fill="url(#gPane)", T=T, shadow=2)
    S.shape("M -13 61 H 21 V 66 H -13 Z M -13 90 H 21 V 95 H -13 Z M -13 61 H -8 V 95 H -13 Z M 16 61 H 21 V 95 H 16 Z",
            "#8E6A2E", T=T, shadow=0)
    S.shape(circ(4, 78, 9), "#D9A640", T=T, shadow=2, decor='<circle cx="2" cy="76" r="3" fill="#FFF0B8" opacity="0.8"/>')
    S.fist(0, 12, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#4E6A3A")
    S.shape(blob([(32, 112), (46, 86), (100, 80), (154, 86), (168, 112), (156, 136), (100, 144), (44, 136)], 0.9), "#6A8A48", shadow=3)
    S.head()
    hood = ("M 44 130 C 32 84 56 34 100 32 C 144 34 168 84 156 130 C 152 144 138 146 134 132 C 128 112 116 102 100 102 "
            "C 84 102 72 112 66 132 C 62 146 48 144 44 130 Z")
    beard = ("M 64 118 C 66 140 78 152 88 160 C 90 170 95 178 100 186 C 105 178 110 170 112 160 C 122 152 134 140 136 118 "
             "C 124 134 112 140 100 140 C 88 140 76 134 64 118 Z")
    S.shape(beard, "#EEEAE2", shadow=3)
    S.shape(hood, "#5E7E40", shadow=5,
            decor='<path d="M 66 132 C 72 112 84 102 100 102 C 116 102 128 112 134 132 L 134 124 C 126 104 116 96 100 96 '
                  'C 84 96 74 104 66 124 Z" fill="#3E5428" opacity="0.7"/>')
    S.mouth()
    S.group("arm-l", PL, "ring of keys")
    S.shape(circ(48, 166, 11), fill="none", shadow=0, side=False, catch=False) if False else None
    S.raw('<circle cx="50" cy="168" r="10" fill="none" stroke="#C9962E" stroke-width="3.5"/>')
    for (x, y, a) in [(42, 176, 30), (52, 179, 0), (60, 174, -30)]:
        S.shape(rr(0, 6, 5, 12, 2), "#D9A640", T=frame(x, y, a), shadow=0)
    S.fist(50, 150, -6)
    return save("lantern-keeper", S)


# ------------------------------------------------------------------ Plague doctor: redone
def plague_doctor():
    S = Sprite("SUPPORT Plague doctor (round 5, redone): a black wide-brimmed hat built like the farmers' (same brim, crown and band) with a red band and a gold buckle; a "
               "long curved beak mask in warm tan leather, strapped on, jutting far forward from under the brim; a tall "
               "black collar flaring behind the head; dark plum coat. A walking cane in the right hand (before #body; "
               "only the fist shows); a brass censer smoking green on a short chain from the left fist. " + LAYOUT)
    S.group("back", (100, 80), "high collar")
    S.shape("M 34 112 C 26 84 36 56 56 44 C 70 36 84 34 100 34 C 116 34 130 36 144 44 C 164 56 174 84 166 112 "
            "C 150 96 130 90 100 90 C 70 90 50 96 34 112 Z", "#2A2232", shadow=0,
            decor='<path d="M 46 100 C 44 80 52 60 66 50" stroke="#4A3E58" stroke-width="5" fill="none" opacity="0.6"/>')
    S.group("arm-r", PR, "cane")
    T = frame(152, 126, 14)
    S.shape(rr(0, 30, 8, 92, 4), "#3A2A22", T=T, shadow=0)
    S.shape(circ(0, 76, 6.5), "#C9CFD8", T=T, shadow=0)
    S.fist(0, 12, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#4A3046")
    S.shape(HEAD, "#7A5A40", shadow=5)
    beak = "M 82 118 C 92 112 108 112 118 118 C 118 140 112 164 104 184 C 102 190 98 192 96 188 C 94 168 86 142 82 118 Z"
    S.shape(beak, "#D9B07A", shadow=4,
            decor='<path d="M 80 136 C 92 140 108 140 120 136 L 120 144 C 108 148 92 148 80 144 Z" fill="#6A4428"/>'
                  '<path d="M 96 170 C 98 178 100 184 100 192 L 112 192 L 112 168 Z" fill="#8A5E36" opacity="0.6"/>'
                  '<path d="M 90 118 C 92 140 96 160 100 182" stroke="#F4D8A8" stroke-width="3" fill="none" opacity="0.6"/>')
    S.shape(FARM_BRIM, "#2E2838", shadow=5)
    S.shape(FARM_CROWN, "#38304A", shadow=4, decor=f'<path d="{ell(80, 42, 13, 8)}" fill="#6A6284" opacity="0.6"/>')
    S.shape(FARM_BAND, "#B8302E", shadow=2, decor='<rect x="92" y="72" width="16" height="13" rx="2.5" fill="#F2C94C"/>'
                                                  '<rect x="96.5" y="75.5" width="7" height="6" rx="1" fill="#B8302E"/>')
    S.group("arm-l", PL, "censer on a chain")
    S.raw('<path d="M 50 156 L 48 170" stroke="#C9962E" stroke-width="3" stroke-linecap="round"/>')
    S.shape(circ(47, 178, 9), "#D9A640", shadow=0, decor='<rect x="38" y="176" width="18" height="3" fill="#8E6A2E"/>')
    for (x, y, r) in [(40, 192, 6.5), (50, 196, 5), (36, 202, 4.5)]:
        S.shape(circ(x, y, r), "#B8E07A", shadow=0, side=False)
    S.fist(50, 148, -6)
    return save("plague-doctor", S)


# ------------------------------------------------------------------ Templar: redone
CROSS = "M -5 -16 H 5 L 3 -4 L 16 -5 V 5 L 3 4 L 5 16 H -5 L -3 4 L -16 5 V -5 L -3 -4 Z"


def templar():
    S = Sprite("SUPPORT Templar (round 5, redone): a flat-topped steel great helm seen from above, a red cross on its top "
               "and a gold strip down its front; white surcoat over mail; a white cape with a red cross. A longsword in "
               "the right hand (arm-r, before #body; only the fist shows) and a white kite shield with a red cross on the "
               "left arm, in front, the hand hidden behind it (arm-l, after #body). " + LAYOUT)
    S.group("back", (100, 86), "cape")
    cape = blob([(100, 12), (134, 14), (158, 34), (164, 70), (150, 100), (100, 104), (50, 100), (36, 70), (42, 34), (66, 14)], 0.9)
    S.shape(cape, "#F1EEE8", shadow=0, decor=f'<path d="{CROSS}" transform="translate(100 44) scale(1.5)" fill="#C8352E"/>')
    S.group("arm-r", PR, "longsword")
    T = frame(152, 128, 10)
    S.shape(circ(0, -14, 6.5), "#C9962E", T=T, shadow=0)
    S.shape(rr(0, 2, 9, 30, 4), "#6B4A33", T=T, shadow=0)
    S.shape(poly([(-8, 20), (8, 20), (7, 66), (0, 76), (-7, 66)]), "#D8DDE5", T=T, shadow=3,
            decor='<rect x="-1.2" y="22" width="2.4" height="50" fill="#F4F6FA" opacity="0.6"/>')
    S.shape(rr(0, 18, 40, 8, 4), "#C9962E", T=T, shadow=2)
    S.fist(0, 4, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#9AA2B0")
    S.shape("M 44 82 C 70 76 130 76 156 82 L 150 136 C 130 140 70 140 50 136 Z", "#F2EFE9", shadow=3)
    # the great helm: its round flat top fills most of the view; the front face peeks out below
    S.shape("M 52 100 C 52 132 74 154 100 154 C 126 154 148 132 148 100 Z", "#A9B1BE", shadow=5,
            decor='<rect x="96" y="100" width="8" height="56" fill="#E8B54A"/>'
                  '<path d="M 60 128 C 80 136 120 136 140 128 L 140 134 C 120 142 80 142 60 134 Z" fill="#7E8798" opacity="0.6"/>')
    S.shape(circ(100, 96, 48), "#D3D9E2", shadow=4,
            decor=f'<path d="{CROSS}" transform="translate(100 94) scale(1.9)" fill="#C8352E"/>'
                  f'<path d="{ell(80, 76, 14, 9)}" fill="#FFFFFF" opacity="0.45"/>')
    S.group("arm-l", PL, "kite shield, hand hidden")
    shield = "M 34 124 C 44 120 62 120 72 124 C 74 146 68 164 53 178 C 38 164 32 146 34 124 Z"
    S.shape(shield, "#F4F1EA", shadow=4,
            decor='<path d="M 49 124 H 57 V 176 H 49 Z M 35 136 H 71 V 144 H 35 Z" fill="#C8352E"/>')
    return save("templar", S)


DESIGNS = {"monk": monk, "seer": seer, "beekeeper": beekeeper, "chef": chef, "cleric": cleric,
           "lantern-keeper": lantern_keeper, "plague-doctor": plague_doctor, "templar": templar,
           "bard": lambda: more.bard(save)}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(DESIGNS):
        print(DESIGNS[n]())
