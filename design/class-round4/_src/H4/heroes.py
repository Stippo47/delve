"""H4 fighters and oddballs. Run: python heroes.py [name ...]  -> ../../heroes-fighters/<file>.svg"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from lib import *

OUT = pathlib.Path(__file__).resolve().parents[2] / "heroes-fighters"
OUT.mkdir(parents=True, exist_ok=True)
PL, PR = (46, 108), (154, 108)
GOLD, WOOD, STEEL, BRONZE = "#F2B53A", "#9A6A3E", "#C9D0DA", "#C98A3A"
LAYOUT = ("Parts in draw order inside #sprite; the outline comes from the #outline filter. Facing = DOWN (+y), "
          "centre (100,100).")
FILES = {}


def save(fname, S):
    p = OUT / fname
    p.write_text(S.svg(), encoding="utf-8")
    return p


def grad_face(S, gid, stops):
    """A face gradient like gFace (dark under the headgear at the top, light lower down) in other skin tones."""
    st = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in zip((0, 0.2, 0.45, 0.85, 1), stops))
    S.add_def(f'<linearGradient id="{gid}" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">{st}</linearGradient>')
    return f"url(#{gid})"


def strokes(d, col, w, op=1.0, cap="round"):
    return (f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="{cap}" '
            f'stroke-linejoin="round" opacity="{op}"/>')


def arc_pts(cx, cy, r, a0, a1, n):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / (n - 1))),
             cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / (n - 1)))) for i in range(n)]


# ================================================================== 1. Vampire
def vampire():
    S = Sprite("FIGHTER Vampire: pale grey-lilac skin, black hair slicked back to a widow's peak, a tall stand-up "
               "collar standing up behind and beside the head in four bat-wing points (black outside, crimson inside), black "
               "cape and a crimson waistcoat. A rapier with a gold cup hilt in the right hand (arm-r, drawn before "
               "#body: the blade runs under the shoulder, only the fist shows); left hand free. " + LAYOUT)
    S.add_def('<radialGradient id="gPaleHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F0E9F2"/>'
              '<stop offset="1" stop-color="#C4B6CA"/></radialGradient>')
    S.group("back", (100, 88), "cape and the stand-up collar")
    # collar: four bat-wing points standing up behind and beside the head, crimson inside
    def collar(k, c=(100, 108)):
        P = lambda x, y: f"{f(c[0] + (x - c[0]) * k)} {f(c[1] + (y - c[1]) * k)}"
        return (f"M {P(38, 132)} L {P(20, 104)} L {P(2, 60)} Q {P(38, 54)} {P(38, 12)} Q {P(70, 42)} {P(100, 38)} "
                f"Q {P(130, 42)} {P(162, 12)} Q {P(162, 54)} {P(198, 60)} L {P(180, 104)} L {P(162, 132)} Z")
    S.shape(collar(1), "#3A2F44", shadow=0,
            decor=f'<path d="{collar(0.8)}" fill="#C42840"/><path d="{collar(0.62)}" fill="#7E1426" opacity="0.7"/>')
    S.group("arm-r", PR, "rapier")
    T = frame(152, 140, 26)
    S.shape(poly([(-3.5, 14), (3.5, 14), (1.2, 70), (0, 73), (-1.2, 70)]), STEEL, T=T, shadow=0,
            decor='<rect x="-0.8" y="16" width="1.6" height="50" fill="#F4F6FA" opacity="0.7"/>')
    S.shape(rr(0, -6, 8, 22, 3), "#3A2F44", T=T, shadow=0)
    S.shape(circ(0, -18, 6), GOLD, T=T, shadow=0)
    S.fist(0, 0, T=T, under=True, hand="url(#gPaleHand)")
    S.shape(ell(0, 14, 15, 7), GOLD, T=T, shadow=3,
            decor=f'<path d="{ell(0, 16, 9, 3.5)}" fill="#A8741E" opacity="0.6"/>')
    S.shape(rr(0, 14, 34, 5, 2.5), GOLD, T=T, shadow=2)
    S.group("body")
    S.shape(SHOULDERS, "#5E2A40")
    face = grad_face(S, "gPale", ("#8C7A90", "#BFB2C4", "#E2D9E6", "#E8E0EC", "#D5CADA"))
    S.head(face=face, ear=("#E2D7E6", "#C7B9CC"))
    hair = ("M 49 114 C 42 62 68 40 100 40 C 132 40 158 62 151 114 C 146 96 134 86 120 84 "
            "C 112 84 106 90 100 106 C 94 90 88 84 80 84 C 66 86 54 96 49 114 Z")
    S.shape(hair, "#2C2A44", shadow=4,
            decor=strokes("M 74 50 C 70 64 70 76 74 86 M 90 44 C 86 60 86 74 90 86", "#6A6280", 4, 0.6))
    S.mouth(col="#9C6A7E")
    S.group("arm-l", PL, "free hand")
    S.fist(50, 150, -6, hand="url(#gPaleHand)")
    return save("fighter-vampire.svg", S)


# ================================================================== 2. Beast tamer
def tamer():
    S = Sprite("FIGHTER Beast tamer (ringmaster): a tall black top hat with a red band, an emerald tailcoat with gold "
               "frogging, brown sideburns. A bullwhip in the right hand: the handle runs under the shoulder (arm-r, "
               "drawn before #body, only the fist shows) and the lash curls out in front. Left hand free. The beast is "
               "a separate sprite, tamer-beast.svg. " + LAYOUT)
    S.group("arm-r", PR, "whip: handle and lash")
    lash = "M 139 160 C 136 180 116 192 96 190 C 76 188 70 170 84 164 C 98 158 110 172 102 186 C 96 196 82 202 64 198"
    S.raw(f'<path d="{lash}" fill="none" stroke="#6E4428" stroke-width="7.5" stroke-linecap="round"/>'
          f'<path d="{lash}" fill="none" stroke="#B07A46" stroke-width="3" stroke-linecap="round" opacity="0.6" transform="translate(-1 -1)"/>')
    S.shape(blob([(64, 194), (54, 192), (58, 200)], 0.6), "#D9C7A0", shadow=0)
    T = frame(150, 134, 24)
    S.shape(rr(0, 12, 10, 34, 4), "#4A2E1C", T=T, shadow=0,
            decor=strokes("M -6 14 L 6 18 M -6 21 L 6 25 M -6 28 L 6 32", "#8A5A34", 2.5, 0.8))
    S.shape(circ(0, -12, 6.5), GOLD, T=T, shadow=0)
    S.fist(0, 0, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#2E8A5C",
            decor="".join(strokes(f"M {x} 100 L {x + 18} 100 M {x} 112 L {x + 18} 112 M {x} 124 L {x + 18} 124", GOLD, 4)
                          for x in (34, 148)))
    S.head()
    S.shape("M 50 118 C 48 104 52 96 60 94 L 64 120 Z", "#6B3F24", shadow=2)
    S.shape("M 150 118 C 152 104 148 96 140 94 L 136 120 Z", "#6B3F24", shadow=2)
    S.shape(ell(100, 88, 60, 20), "#3A3446", shadow=4)
    S.shape("M 66 90 L 68 14 C 68 2 132 2 132 14 L 134 90 C 120 96 80 96 66 90 Z", "#3A3446", shadow=3,
            decor='<path d="M 60 66 L 140 66 L 140 82 L 60 82 Z" fill="#C8342E"/>'
                  '<path d="M 76 10 L 78 88" stroke="#6A6280" stroke-width="5" opacity="0.6"/>')
    S.shape(ell(100, 13, 32, 9), "#4E4760", shadow=0, side=False)
    S.mouth()
    S.group("arm-l", PL, "free hand")
    S.fist(50, 150, -6)
    return save("fighter-beast-tamer.svg", S)


# ================================================================== 3. Samurai
def samurai():
    S = Sprite("FIGHTER Samurai: black kabuto with a wide flared black neck guard laced in red, a big gold crescent on a red brow plate, "
               "red lacquered shoulder plates (sode) with gold lacing bands. Black lacquered gloves (kote). A katana held two-handed in the middle, "
               "in front: both fists on the long grip, the blade forward; it is all in arm-r (arm-l left out), "
               "drawn after #body. " + LAYOUT)
    S.group("body")
    S.shape(SHOULDERS, "#2F3240")
    bands = lambda x0, x1: "".join(f'<rect x="{x0}" y="{y}" width="{x1 - x0}" height="4" fill="{GOLD}" opacity="0.9"/>'
                                   for y in (96, 110, 124))
    S.shape(rr(40, 110, 46, 62, 10), "#B8312F", shadow=3, decor=bands(14, 66))
    S.shape(rr(160, 110, 46, 62, 10), "#B8312F", shadow=3, decor=bands(134, 186))
    # neck guard (shikoro): lames flaring out behind and beside the head
    shik = blob([(100, 30), (140, 34), (166, 56), (174, 92), (166, 122), (148, 128), (100, 112), (52, 128), (34, 122),
                 (26, 92), (34, 56), (60, 34)], 0.9)
    lames = "".join(strokes(f"M 20 {y} Q 100 {y - 60} 180 {y}", "#C8342E", 4, 0.9) for y in (98, 114, 128))
    S.shape(shik, "#3A3E4E", shadow=3, decor=lames)
    S.head(ears=False)
    bowl = ("M 50 108 C 44 62 68 40 100 40 C 132 40 156 62 150 108 C 140 98 124 92 100 92 C 76 92 60 98 50 108 Z")
    S.shape(bowl, "#343847", shadow=4,
            decor=strokes("M 100 40 L 100 92 M 80 44 L 74 94 M 120 44 L 126 94", "#565B6E", 4, 0.8))
    # brow plate and the gold crescent (maedate), horns sweeping wide past the helmet
    S.shape("M 58 102 C 74 90 126 90 142 102 L 138 108 C 122 98 78 98 62 108 Z", "#B8312F", shadow=2)
    moon = ("M 100 100 C 70 96 38 70 26 26 C 48 56 76 70 100 72 C 124 70 152 56 174 26 C 162 70 130 96 100 100 Z")
    S.shape(moon, GOLD, shadow=4)
    S.mouth()
    S.group("arm-r", PR, "katana, two hands")
    T = frame(132, 132, 50)
    blade = "M -4.5 43 L 4.5 43 C 5.5 66 4 86 -1 102 L -5 101 C -2.5 84 -3.5 64 -4.5 43 Z"
    S.shape(blade, "#D8DDE5", T=T, shadow=3,
            decor='<path d="M 2 45 C 3 66 2 86 -2 100" stroke="#F4F6FA" stroke-width="2" fill="none" opacity="0.8"/>')
    S.shape(rr(0, 11, 10, 52, 4), "#ECE6DA", T=T, shadow=2,
            decor="".join(f'<path d="M -6 {y} L 6 {y + 5}" stroke="#2F3240" stroke-width="3"/>' for y in range(-16, 36, 7)))
    S.shape(ell(0, 40, 13, 6), "#3A3A44", T=T, shadow=2, decor=f'<rect x="-13" y="38" width="26" height="2.5" fill="{GOLD}"/>')
    S.add_def('<radialGradient id="gKote" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#6A6F84"/>'
              '<stop offset="1" stop-color="#363A4A"/></radialGradient>')
    S.fist(0, -6, T=T, w=20, h=21, hand="url(#gKote)")
    S.fist(0, 22, T=T, w=20, h=21, hand="url(#gKote)")
    return save("fighter-samurai.svg", S)


# ================================================================== 4. Gladiator
def gladiator():
    S = Sprite("FIGHTER Gladiator (retiarius): bare tanned shoulders with a leather strap, a tall bronze shoulder "
               "guard (galerus) standing up on the left shoulder, short black curly hair. A trident in the right "
               "hand and a weighted net in the left; both arms drawn before #body so the shafts run under the "
               "shoulders and only the fists show. " + LAYOUT)
    BRZ = "#C27A2E"
    S.group("arm-r", PR, "trident")
    T = frame(150, 126, 22)
    S.shape(rr(0, 10, 8, 84, 4), "#8A5E38", T=T, shadow=0)
    S.shape("M -17 44 C -17 56 -10 58 0 58 C 10 58 17 56 17 44 L 17 70 L 11 62 L 11 54 C 5 60 -5 60 -11 54 L -11 62 L -17 70 Z",
            "#B9C0CC", T=T, shadow=2)
    S.shape(poly([(-4, 50), (4, 50), (4, 68), (0, 78), (-4, 68)]), "#B9C0CC", T=T, shadow=2)
    S.shape(rr(0, 50, 30, 7, 3), BRZ, T=T, shadow=2)
    S.fist(0, 0, T=T, under=True)
    S.group("arm-l", PL, "net")
    mesh = "".join(strokes(f"M {x} 140 L {x + 70} 220", "#8C7A58", 2.5, 0.8) + strokes(f"M {x + 70} 140 L {x} 220", "#8C7A58", 2.5, 0.8)
                   for x in range(-40, 80, 13))
    net = blob([(46, 148), (36, 162), (20, 178), (18, 192), (34, 196), (54, 192), (70, 196), (80, 184), (70, 168), (58, 152)], 0.9)
    S.shape(net, "#DCCDA6", shadow=0, decor=mesh)
    for x, y in [(18, 192), (34, 197), (54, 193), (70, 197), (81, 184)]:
        S.shape(circ(x, y, 4.5), "#6E6A74", shadow=0, side=False)
    S.fist(50, 146, 10)
    S.group("body")
    skin = "#E2AE84"
    S.shape(SHOULDERS, skin)
    S.shape("M 128 78 L 142 80 L 176 120 L 168 130 Z", "#6E4228", shadow=2)
    S.shape("M 16 126 C 8 96 12 66 28 46 L 46 42 C 40 62 48 80 68 86 L 68 128 C 50 136 28 134 16 126 Z", BRZ, shadow=3,
            decor=strokes("M 24 116 C 18 92 22 70 34 52", "#F2C27A", 5, 0.8) + strokes("M 30 50 L 46 44", "#F2C27A", 4, 0.8))
    S.head()
    curls = [(64, 96), (60, 80), (66, 64), (78, 52), (92, 46), (108, 46), (122, 52), (134, 64), (140, 80), (136, 96),
             (78, 92), (92, 88), (108, 88), (122, 92), (82, 72), (100, 64), (118, 72), (100, 78)]
    hair = " ".join(circ(x, y, 13) for x, y in curls)
    S.shape(hair, "#3A3038", shadow=4,
            decor="".join(f'<path d="M {x - 7} {y - 2} A 8 8 0 0 1 {x + 3} {y - 8}" fill="none" stroke="#6E6070" stroke-width="3.5" stroke-linecap="round"/>'
                          for x, y in curls))
    S.mouth()
    return save("fighter-gladiator.svg", S)


# ================================================================== 5. Valkyrie
def valkyrie():
    S = Sprite("FIGHTER Valkyrie (she): round silver helm with a gold brow band and two big white wings sweeping "
               "back from its sides, long golden braids over the shoulders, navy tunic with silver scale on the "
               "shoulders. A winged spear in the right hand (arm-r, drawn before #body: the shaft runs under the "
               "shoulder, only the fist shows); left hand free. " + LAYOUT)
    S.group("arm-r", PR, "winged spear")
    T = frame(159, 146, 12)
    S.shape(rr(0, -14, 8, 96, 4), "#B98A56", T=T, shadow=0)
    S.shape("M 0 30 C 10 38 10 48 0 61 C -10 48 -10 38 0 30 Z", STEEL, T=T, shadow=2,
            decor='<rect x="-1" y="34" width="2" height="22" fill="#F4F6FA" opacity="0.7"/>')
    S.shape("M -2 30 C -9 28 -17 24 -20 17 C -12 20 -7 22 -2 24 Z M 2 30 C 9 28 17 24 20 17 C 12 20 7 22 2 24 Z",
            GOLD, T=T, shadow=2)
    S.fist(0, 0, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#2E3E6E")
    scale = "".join(f'<path d="M {x - 7} {y} A 7 7 0 0 0 {x + 7} {y}" fill="#8E98AC" opacity="0.7"/>'
                    for y in (92, 104, 116, 128) for x in range(20 + (y % 24) // 2, 200, 14))
    S.shape("M 24 112 C 22 90 40 80 62 80 L 70 132 C 52 138 30 132 24 112 Z", "#C3CAD6", shadow=3, decor=scale)
    S.shape("M 176 112 C 178 90 160 80 138 80 L 130 132 C 148 138 170 132 176 112 Z", "#C3CAD6", shadow=3, decor=scale)
    # wings on the helm, behind it
    def feather(root, ang, ln, w):
        c = (root[0] + math.cos(math.radians(ang)) * ln / 2, root[1] + math.sin(math.radians(ang)) * ln / 2)
        dx, dy = math.cos(math.radians(ang)) * ln / 2, math.sin(math.radians(ang)) * ln / 2
        return (f"M {f(c[0] - dx)} {f(c[1] - dy)} A {f(ln / 2)} {f(w / 2)} {f(ang)} 1 0 {f(c[0] + dx)} {f(c[1] + dy)} "
                f"A {f(ln / 2)} {f(w / 2)} {f(ang)} 1 0 {f(c[0] - dx)} {f(c[1] - dy)} Z")
    for sgn in (-1, 1):
        root = (100 + sgn * 44, 94)
        A = lambda a: a if sgn < 0 else 180 - a
        wing = " ".join(feather(root, A(a), ln, w) for a, ln, w in ((-116, 88, 30), (-138, 76, 28), (-158, 58, 26)))
        S.shape(wing, "#F4F1EA", shadow=3)
    S.head(ears=False)
    # braids
    for x0, sgn in ((62, -1), (138, 1)):
        for i in range(4):
            y = 118 + i * 12
            S.shape(ell(x0 + sgn * (i * 1.5), y, 10 - i * 0.6, 8), "#F0C04E", shadow=2)
        xe = x0 + sgn * 5
        S.shape(rr(xe, 162, 12, 7, 3), "#2E3E6E", shadow=2)
        S.shape(blob([(xe - 6, 165), (xe + 6, 165), (xe + 4, 176), (xe - 4, 176)], 0.8), "#F0C04E", shadow=2)
    S.shape("M 52 116 C 44 66 66 42 100 42 C 134 42 156 66 148 116 C 136 104 120 98 100 98 C 80 98 64 104 52 116 Z",
            "#F0C04E", shadow=3)
    helm = "M 54 100 C 50 62 70 40 100 40 C 130 40 150 62 146 100 C 132 88 118 84 100 84 C 82 84 68 88 54 100 Z"
    S.shape(helm, "#C9D0DA", shadow=4,
            decor=f'<path d="M 40 92 C 70 74 130 74 160 92 L 160 110 L 40 110 Z" fill="{GOLD}"/>'
                  '<path d="M 100 40 L 100 86" stroke="#EEF1F5" stroke-width="5" opacity="0.6"/>')
    S.mouth()
    S.group("arm-l", PL, "free hand")
    S.fist(50, 150, -6)
    return save("fighter-valkyrie.svg", S)


# ================================================================== 6. Executioner
def executioner():
    S = Sprite("FIGHTER Executioner: a black pointed hood over the whole head with two eye slots, its short cape "
               "over broad studded leather shoulders, a leather strap. A huge two-handed axe held in the middle, in front: both "
               "fists on the haft, the crescent blade forward; it is all in arm-r (arm-l left out), drawn after "
               "#body. " + LAYOUT)
    S.group("body")
    wide = "M 20 108 C 20 80 52 74 100 74 C 148 74 180 80 180 108 C 180 136 148 142 100 142 C 52 142 20 136 20 108 Z"
    S.shape(wide, "#7A4A2A",
            decor="".join(f'<circle cx="{x}" cy="{y}" r="3" fill="#C9A06A"/>' for x, y in
                          [(30, 98), (36, 114), (44, 128), (170, 98), (164, 114), (156, 128)]))
    S.shape("M 132 78 L 148 82 L 72 142 L 54 138 Z", "#4A2C1A", shadow=2)
    hood = ("M 100 12 C 114 32 148 54 154 96 C 160 116 154 134 140 140 C 128 150 114 156 100 156 C 86 156 72 150 60 140 "
            "C 46 134 40 116 46 96 C 52 54 86 32 100 12 Z")
    S.shape(hood, "#4A4354", shadow=5,
            decor=f'<path d="{rr(82, 116, 18, 9, 4.5)}" fill="#1C1620"/><path d="{rr(118, 116, 18, 9, 4.5)}" fill="#1C1620"/>'
                  '<path d="M 100 16 C 92 40 88 70 92 100" stroke="#6E6680" stroke-width="6" fill="none" opacity="0.7"/>')
    S.group("arm-r", PR, "two-handed axe")
    T = frame(137, 110, 28)
    S.shape(rr(0, 30, 10, 100, 4), "#6E4A2C", T=T, shadow=3)
    blade = "M 2 46 C 16 46 30 42 42 34 C 50 50 50 68 40 84 C 30 76 16 72 2 72 Z"
    S.shape(blade, "#B9C0CC", T=T, shadow=4,
            decor='<path d="M 40 38 C 46 54 46 68 38 80" stroke="#EEF1F5" stroke-width="5" fill="none"/>'
                  '<path d="M 2 46 L 2 72 L 14 72 L 14 46 Z" fill="#6E7688" opacity="0.6"/>')
    S.shape(rr(0, 59, 14, 32, 4), "#5C6272", T=T, shadow=2)
    S.fist(0, 6, T=T, w=21, h=24)
    S.fist(0, 31, T=T, w=21, h=24)
    return save("fighter-executioner.svg", S)


# ================================================================== 7. Jester
def jester():
    S = Sprite("FIGHTER Jester: a three-pointed cap split magenta and yellow with gold bells on the tips, a pointed "
               "ruff collar in the same colours, harlequin shoulders. A marotte (a stick topped with a little "
               "jester head) in the right hand (arm-r, drawn before #body, only the fist shows); left hand free. "
               + LAYOUT)
    MAG, YEL = "#B8337E", "#F2C230"
    S.group("arm-r", PR, "marotte")
    T = frame(150, 136, 18)
    S.shape(rr(0, 18, 8, 60, 4), "#6E4A2C", T=T, shadow=0)
    S.shape(blob([(-12, 46), (-24, 34), (0, 40), (24, 34), (12, 46)], 0.6), MAG, T=T, shadow=2)
    S.shape(circ(0, 56, 11), "#F2C7A0", T=T, shadow=2)
    S.shape("M -11 52 C -10 40 10 40 11 52 C 4 48 -4 48 -11 52 Z", YEL, T=T, shadow=2)
    S.fist(0, 0, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, MAG,
            decor="".join(f'<path d="{poly([(x, 108), (x + 14, 90), (x + 28, 108), (x + 14, 126)])}" fill="{YEL}"/>'
                          for x in (18, 46, 126, 154)))
    ruff = star(100, 118, 64, 48, 12, 15)
    S.shape(poly(ruff), "#F4EEE2", shadow=3,
            decor="".join(f'<path d="{poly([(100, 118), ruff[i], ruff[(i + 1) % 24], ruff[(i + 2) % 24]])}" fill="{MAG if (i // 2) % 2 else YEL}"/>'
                          for i in range(0, 24, 2)))
    S.head(ears=False)
    # cap: three floppy points (left, back, right), split down the middle
    capL = blob([(100, 38), (100, 98), (76, 96), (56, 104), (46, 90), (34, 80), (20, 84), (10, 76), (16, 58), (32, 48), (50, 46),
                 (62, 28), (76, 10), (90, -2), (98, 8)], 0.75)
    capR = blob([(100, 38), (100, 98), (124, 96), (144, 104), (154, 90), (166, 80), (180, 84), (190, 76), (184, 58), (168, 48),
                 (150, 46), (138, 28), (124, 10), (110, -2), (102, 8)], 0.75)
    S.shape(capL, MAG, shadow=4)
    S.shape(capR, YEL, shadow=0)
    S.shape("M 52 104 C 66 88 134 88 148 104 L 146 112 C 130 98 70 98 54 112 Z", "#F4EEE2", shadow=2)
    for x, y in [(12, 84), (188, 84), (96, 0)]:
        S.shape(circ(x, y, 8), GOLD, shadow=3, decor=f'<circle cx="{x - 2}" cy="{y - 2}" r="3" fill="#FFF1B8"/>')
    S.mouth()
    S.group("arm-l", PL, "free hand")
    S.fist(50, 152, -6)
    return save("fighter-jester.svg", S)


# ================================================================== 8. Werewolf
def werewolf():
    S = Sprite("FIGHTER Werewolf: a grey-blue wolf head with tall pointed ears, a long snout pointing forward "
               "(pale underneath) with a dark nose, small yellow eyes (a beast: the one hero with eyes), a jagged ruff, "
               "a torn red shirt with grey fur bursting out at the arms. No weapon: two big furry "
               "paws with white claws held forward (arm-l, arm-r, after #body). " + LAYOUT)
    FUR, DARK, PALE = "#7E879C", "#5B6378", "#D2D3DA"
    S.group("body")
    # torn red shirt on the shoulders, grey fur bursting out at the arms
    shirt = ([(26, 112), (30, 90), (52, 78), (100, 74), (148, 78), (170, 90), (174, 112), (166, 124), (158, 118), (152, 134),
                  (140, 126), (128, 140), (100, 142), (72, 140), (60, 126), (48, 134), (42, 118), (34, 124)])
    S.shape(blob(shirt, 0.3), "#A33A3A")
    # ears
    S.shape("M 58 82 L 48 14 L 92 56 Z", FUR, shadow=3, decor='<path d="M 62 70 L 55 32 L 82 58 Z" fill="#B88A98"/>')
    S.shape("M 142 82 L 152 14 L 108 56 Z", FUR, shadow=3, decor='<path d="M 138 70 L 145 32 L 118 58 Z" fill="#9C7482"/>')
    ruff = ([(100, 44), (126, 48), (146, 62), (154, 80), (168, 90), (156, 100), (172, 114), (154, 120), (162, 136), (142, 136),
                 (140, 154), (122, 146), (112, 160), (100, 150), (88, 160), (78, 146), (60, 154), (58, 136), (38, 136), (46, 120),
                 (28, 114), (44, 100), (32, 90), (46, 80), (54, 62), (74, 48)])
    ruff = blob([(100 + (x - 100) * 0.84, y) for x, y in ruff], 0.32)
    S.shape(ruff, FUR, shadow=5,
            decor=strokes("M 100 46 L 100 96 M 84 50 L 88 90 M 116 50 L 112 90", DARK, 6, 0.5)
                  + f'<path d="M 62 128 L 80 118 L 100 128 L 120 118 L 138 128 L 128 150 L 100 156 L 72 150 Z" fill="{PALE}" opacity="0.9"/>')
    S.raw('<path d="M 74 100 Q 82 94 92 100 Q 84 106 74 100 Z" fill="#F2C23A"/><path d="M 126 100 Q 118 94 108 100 Q 116 106 126 100 Z" fill="#F2C23A"/>')
    snout = blob([(100, 98), (114, 106), (118, 134), (112, 164), (100, 176), (88, 164), (82, 134), (86, 106)], 0.8)
    S.shape(snout, "#9AA2B4", shadow=4,
            decor=f'<path d="M 80 136 C 90 150 110 150 120 136 L 120 180 L 80 180 Z" fill="{PALE}"/>'
                  + strokes("M 100 104 L 100 150", "#B6BDCC", 5, 0.7))
    S.shape(ell(100, 166, 10, 8), "#2E2836", shadow=2, side=False, decor='<circle cx="97" cy="163" r="3" fill="#6A6278"/>')
    S.group("arm-l", PL, "paw")
    def paw(cx, cy, a):
        T = frame(cx, cy, a)
        for dx in (-8, 0, 8):
            S.shape("M -3 0 L 3 0 L 0 14 Z", "#F4F1EA", T=f"{T} translate({dx} 10)", shadow=0, side=False)
        S.shape(blob([(-13, -8), (0, -14), (13, -8), (14, 6), (0, 14), (-14, 6)], 0.9), FUR, T=T, shadow=3)
    paw(48, 150, 8)
    S.group("arm-r", PR, "paw")
    paw(152, 150, -8)
    return save("fighter-werewolf.svg", S)


# ================================================================== 9. Engineer
def engineer():
    S = Sprite("FIGHTER Engineer: an orange work suit, a brass gear on the left shoulder, a welding mask flipped up "
               "on top of the head (steel with a dark green window), messy brown hair. A big wrench in the right hand "
               "(arm-r, drawn before #body: the handle runs under the shoulder, only the fist shows); left hand free. "
               "The turret is a separate sprite, engineer-turret.svg. " + LAYOUT)
    S.group("arm-r", PR, "wrench")
    T = frame(151, 143, 16)
    S.shape(rr(0, 0, 12, 76, 5), "#A9B2C0", T=T, shadow=0)
    S.shape("M -17 36 C -17 27 17 27 17 36 L 17 56 L 8 56 L 8 45 L -8 45 L -8 56 L -17 56 Z", "#A9B2C0", T=T, shadow=2,
            decor='<rect x="-15" y="34" width="4" height="24" fill="#E6EAF0" opacity="0.7"/>')
    S.fist(0, 0, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#E07A2C", decor='<path d="M 26 116 L 174 116 L 174 124 L 26 124 Z" fill="#B4561A" opacity="0.7"/>')
    S.shape(blob(star(42, 104, 30, 23, 9, 0), 0.25), "#D9A441", shadow=3,
            decor=f'<path d="{circ(42, 104, 11)}" fill="#8A6424"/><path d="{circ(42, 104, 6)}" fill="#E07A2C"/>')
    S.head()
    hair = ("M 52 114 C 46 64 70 44 100 44 C 130 44 154 64 148 114 C 142 104 138 98 132 98 L 128 106 L 120 96 "
            "L 110 104 L 102 94 L 92 104 L 84 96 L 74 106 L 68 98 C 62 100 56 106 52 114 Z")
    S.shape(hair, "#6B4426", shadow=4)
    mask = blob([(62, 82), (60, 54), (74, 36), (100, 30), (126, 36), (140, 54), (138, 82), (120, 88), (100, 90), (80, 88)], 0.8)
    S.shape(mask, "#8E97A6", shadow=4,
            decor=f'<path d="{rr(100, 66, 44, 16, 5)}" fill="#24463A"/><path d="{rr(92, 62, 14, 5, 2.5)}" fill="#5E9A84" opacity="0.8"/>')
    S.shape(rr(54, 82, 12, 12, 4), "#5E6474", shadow=2)
    S.shape(rr(146, 82, 12, 12, 4), "#5E6474", shadow=2)
    S.mouth()
    S.group("arm-l", PL, "free hand")
    S.fist(50, 150, -6)
    return save("fighter-engineer.svg", S)


# ================================================================== 10. Scarecrow
def scarecrow():
    S = Sprite("FIGHTER Scarecrow: a burlap sack head tied off with a rope, straw poking out of the top, a stitched mouth, a straw ruff round "
               "the neck, a faded patched blue coat, the wooden cross-pole across its back, a crow perched on the "
               "left shoulder. No weapon: straw tufts for hands (arm-l, arm-r, after #body). " + LAYOUT)
    S.group("back", None, "cross-pole")
    S.shape(rr(100, 100, 214, 14, 5), "#8A5E38", shadow=0,
            decor=strokes("M -10 96 L 210 96", "#B07A46", 3, 0.6))
    S.shape(rr(100, 26, 14, 70, 5), "#7A5232", shadow=3)
    S.group("body")
    S.shape(SHOULDERS, "#5F82A6",
            decor=f'<path d="{rr(148, 104, 26, 22, 3)}" fill="#B2563A"/>' + strokes("M 136 94 L 160 94 M 136 114 L 160 114", "#E8D8B0", 2, 0.8)
                  + f'<path d="{rr(56, 120, 20, 16, 3)}" fill="#9AA14E"/>')
    S.shape(blob(star(100, 120, 64, 46, 14, 8), 0.2), "#E8C25A", shadow=3,
            decor="".join(strokes(f"M 100 120 L {x} {y}", "#C79A34", 3, 0.7) for x, y in star(100, 120, 60, 46, 14, 8)[::2]))
    S.shape(blob([(92, 52), (84, 22), (94, 36), (98, 14), (104, 34), (114, 18), (110, 40), (122, 32), (110, 54)], 0.25),
            "#E8C25A", shadow=0)
    weave = "".join(strokes(f"M 40 {y} L 160 {y + 6}", "#A88A5E", 1.6, 0.35) for y in range(52, 156, 8)) +             "".join(strokes(f"M {x} 40 L {x - 6} 160", "#A88A5E", 1.6, 0.25) for x in range(48, 160, 8))
    S.shape(HEAD, "#CDAE7E", shadow=5,
            decor='<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>' + weave)
    S.shape("M 82 58 C 88 44 112 44 118 58 C 108 54 92 54 82 58 Z", "#CDAE7E", shadow=2)
    S.shape(rr(100, 56, 38, 9, 4.5), "#6E4E2C", shadow=2)
    S.raw(strokes("M 86 132 Q 100 138 114 132", "#5A3E2A", 2.5)
          + strokes("M 89 128 L 91 138 M 96 130 L 97 140 M 103 130 L 102 140 M 110 128 L 108 138", "#5A3E2A", 2))
    # crow on the left shoulder, facing forward
    CROW = "#3E3850"
    S.shape("M 28 82 L 24 58 L 34 64 L 44 58 L 40 82 Z", CROW, shadow=3)
    S.shape(ell(34, 98, 15, 21), CROW, shadow=4,
            decor=strokes("M 26 88 C 24 100 26 110 32 118", "#5E5878", 3.5, 0.9) + strokes("M 42 88 C 44 100 42 110 36 118", "#2C2838", 3.5, 0.7))
    S.shape(circ(34, 121, 10.5), CROW, shadow=3, decor='<circle cx="29" cy="119" r="2.2" fill="#E8E2D2"/><circle cx="39" cy="119" r="2.2" fill="#E8E2D2"/>')
    S.shape("M 29 127 L 39 127 L 34 143 Z", "#8E8A96", shadow=2)
    def tuft(cx, cy, a):
        T = frame(cx, cy, a)
        S.shape(blob(star(0, 6, 16, 8, 6, 0), 0.15), "#E8C25A", T=T, shadow=3)
        S.shape(rr(0, -6, 22, 12, 5), "#5F82A6", T=T, shadow=2)
    S.group("arm-l", PL, "straw hand")
    tuft(60, 154, 10)
    S.group("arm-r", PR, "straw hand")
    tuft(152, 150, -6)
    return save("fighter-scarecrow.svg", S)


# ================================================================== Tamer's beast
def beast():
    S = Sprite("COMPANION the beast tamer's tiger cub, drawn separately (about 60% of a hero). Orange with dark "
               "stripes, round ears, pale muzzle, simple eyes (beasts may have eyes), a striped tail. Parts: #back "
               "(tail, sways about its pivot), #body, #arm-l / #arm-r (front paws, swing to walk). " + LAYOUT)
    OR, ST = "#E98A2E", "#4A2A1E"
    S.group("back", (100, 72), "tail")
    tail = "M 94 60 C 90 40 100 22 116 14 C 124 10 130 16 124 22 C 112 30 106 42 108 60 Z"
    S.shape(tail, OR, shadow=0, decor=strokes("M 96 40 L 108 44 M 102 28 L 112 34 M 114 18 L 120 24", ST, 4))
    S.group("body")
    S.shape(ell(100, 82, 30, 36), OR,
            decor=strokes("M 70 70 Q 82 72 88 66 M 130 70 Q 118 72 112 66 M 70 88 Q 84 90 90 84 M 130 88 Q 116 90 110 84 M 100 50 L 100 66", ST, 5))
    S.shape(circ(76, 104, 9), OR, shadow=0)
    S.shape(circ(124, 104, 9), OR, shadow=0)
    S.shape(circ(76, 104, 9), "#F3D9B4", shadow=0, catch=False)
    S.shape(circ(124, 104, 9), "#F3D9B4", shadow=0, catch=False)
    head = ell(100, 122, 32, 28)
    S.shape(head, OR, shadow=4,
            decor=strokes("M 100 96 L 100 108 M 88 98 L 92 108 M 112 98 L 108 108 M 68 118 L 80 120 M 132 118 L 120 120", ST, 4.5))
    S.shape(ell(100, 138, 16, 11), "#F6E4C8", shadow=2)
    S.shape(ell(100, 134, 5, 3.5), "#C4626A", shadow=0, side=False)
    S.raw('<ellipse cx="88" cy="122" rx="3.5" ry="4.5" fill="#2B2230"/><ellipse cx="112" cy="122" rx="3.5" ry="4.5" fill="#2B2230"/>')
    S.group("arm-l", (82, 110), "front paw")
    S.shape(ell(76, 144, 9, 10), OR, shadow=3)
    S.group("arm-r", (118, 110), "front paw")
    S.shape(ell(124, 144, 9, 10), OR, shadow=3)
    return save("tamer-beast.svg", S)


# ================================================================== Engineer's turret
def turret():
    S = Sprite("COMPANION the engineer's turret, drawn separately (about 70% of a hero): a three-legged stand, a "
               "round brass housing with a hatch on top, a brass mantlet with an orange stripe and twin steel barrels pointing forward. Parts: #back "
               "(legs), #body (housing and barrels; the game turns the whole sprite to aim). " + LAYOUT)
    S.group("back", None, "tripod legs")
    for a in (150, 30, 270):
        r = math.radians(a)
        x, y = 100 + 60 * math.cos(r), 96 + 60 * math.sin(r)
        S.shape(f'M {f(100 - 7 * math.sin(r))} {f(96 + 7 * math.cos(r))} L {f(x - 5 * math.sin(r))} {f(y + 5 * math.cos(r))} '
                f'L {f(x + 5 * math.sin(r))} {f(y - 5 * math.cos(r))} L {f(100 + 7 * math.sin(r))} {f(96 - 7 * math.cos(r))} Z',
                "#5E6474", shadow=0)
        S.shape(circ(x, y, 9), "#3E4250", shadow=0)
    S.group("body", None, "housing and twin barrels")
    S.shape(circ(100, 96, 36), "#6A7080", shadow=3)
    for dx in (-9, 9):
        S.shape(rr(100 + dx, 146, 11, 56, 4), "#A9B2C0", shadow=3,
                decor=f'<rect x="{96 + dx}" y="122" width="2.5" height="46" fill="#E6EAF0" opacity="0.7"/>')
        S.shape(rr(100 + dx, 172, 14, 8, 3), "#5E6474", shadow=2)
    S.shape(rr(100, 124, 40, 22, 6), "#D9A441", shadow=3,
            decor='<path d="M 80 118 L 120 118 L 120 124 L 80 124 Z" fill="#E07A2C"/>')
    S.shape(circ(100, 94, 28), "#D9A441", shadow=4,
            decor="".join(f'<circle cx="{f(100 + 21 * math.cos(math.radians(a)))}" cy="{f(94 + 21 * math.sin(math.radians(a)))}" r="2.6" fill="#8A6424"/>'
                          for a in range(0, 360, 60)))
    S.shape(circ(100, 92, 11), "#5E6474", shadow=2, decor='<circle cx="97" cy="89" r="4" fill="#8E96A6"/>')
    return save("engineer-turret.svg", S)


DESIGNS = {"vampire": vampire, "tamer": tamer, "samurai": samurai, "gladiator": gladiator, "valkyrie": valkyrie,
           "executioner": executioner, "jester": jester, "werewolf": werewolf, "engineer": engineer,
           "scarecrow": scarecrow, "beast": beast, "turret": turret}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(DESIGNS):
        print(DESIGNS[n]())
