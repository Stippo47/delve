"""Round 10, second pass: the rest of the Clockwork Foundry. The card was REDO with only the storm spirit and the gun
turret ticked ("U are losing the style... 1 maybe 2 body segments"; "Cogs weren't horrible but also weren't very
interesting"), so every other Foundry kind is drawn again: few big clean shapes, one or two body parts, each with one
thing of its own to look at. The machines share a look: dark iron, brass, one amber-lit slit where a face would be.
  automaton, bomb bot (the auto bomb bot is it recoloured), flame turret, laser turret (in the gun turret's bulkhead),
  mortar (the fire and gas mortars are it with the brass turned), tesla coil, repair drone, foundry smith, saw blade,
  chain crawler (head and plate), drill bot.
Each keeps its round-9 parts (what swings, what stays still) and the width of its main body, so headR and sizes stand.
python foundry10b.py [name ...]   -> ../../enemies/foundry-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *
from foundry9 import IRON, DIRON, STEELC, COPPER, DCOPPER, BRASS_C, HAZARD, METAL_DEFS, cog_path, rivets, ring_pts, floor_base

DARK, COAL, AMBER, REDP = "#4A4E58", "#3A3640", "#FFB84A", "#C8403A"
FLAME = ('<linearGradient id="gFlame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A0"/>'
         '<stop offset="0.5" stop-color="#FFB23A"/><stop offset="1" stop-color="#E8542A"/></linearGradient>')


def hi(x, y, rx, ry, o=0.25, rot=0):
    r = f' transform="rotate({rot} {x} {y})"' if rot else ""
    return f'<path d="{ell(x, y, rx, ry)}" fill="#FFFFFF" opacity="{o}"{r}/>'


def slit(cx, cy, w, h=13):
    """The machines' face: one dark slit lit amber from inside (never two eyes)."""
    return (f'<path d="{rr(cx, cy, w, h, h / 2)}" fill="#22202A"/>'
            f'<path d="{rr(cx, cy, w - 12, h - 7, (h - 7) / 2)}" fill="{AMBER}"/>')


def hazard(x0, x1, y0, y1, step=16):
    out = f'<path d="M {x0} {y0} L {x1} {y0} L {x1} {y1} L {x0} {y1} Z" fill="{HAZARD}"/>'
    for x in range(int(x0) - 20, int(x1) + 20, step):
        out += f'<path d="M {x} {y1} L {x + step / 2} {y1} L {x + step / 2 + (y1 - y0)} {y0} L {x + (y1 - y0)} {y0} Z" fill="#2A2C32"/>'
    return out


def key(S, cx, y, k=1.0):
    """A brass wind-up key seen from above, standing out of the back: a shaft and a butterfly bow (two solid wings)."""
    S.shape(rr(cx, y + 18 * k, 9 * k, 34 * k, 4), BRASS_C, shadow=0)
    bow = [(0, 5), (10, -6), (24, -12), (30, 0), (24, 12), (10, 7), (0, 9), (-10, 7), (-24, 12), (-30, 0), (-24, -12), (-10, -6)]
    S.shape(blob([(cx + x * k, y + yy * k) for x, yy in bow], 0.8), BRASS_C, shadow=0,
            decor=f'<path d="{ell(cx - 16 * k, y - 3 * k, 7 * k, 3 * k)}" fill="#FFFFFF" opacity="0.35"/>')


# ================================================================== automaton
def automaton():
    S = Sprite("AUTOMATON (round 10): a clockwork knight in the heroes' bust build: dark iron shoulders with a big brass cog "
               "for each pauldron, a smooth steel helm of a head with a brass crest and one amber-lit visor slit (no eyes), "
               "a brass wind-up key standing out of its back (#back, sways); a broad sword in an iron gauntlet under the "
               "right shoulder (arm-r, it swings), an iron gauntlet on the left (arm-l). " + LAYOUT)
    S.add_def(METAL_DEFS)
    S.group("back", (100, 70), "wind-up key")
    key(S, 100, 24, 1.15)
    S.group("arm-r", PR, "sword")
    T = frame(165, 124, 14)
    S.shape(rr(0, -10, 10, 24, 4), "#3E424A", T=T, shadow=0)
    w, L = 11, 70
    S.shape(poly([(-w, 8), (w, 8), (w, L - 12), (0, L + 8), (-w, L - 12)]), STEEL, T=T, shadow=2,
            decor=f'<path d="{poly([(0, 8), (w, 8), (w, L - 12), (0, L + 8)])}" fill="#7E8696" opacity="0.45"/>')
    S.shape(rr(0, 5, 38, 9, 4), BRASS_C, T=T, shadow=2)
    fist(S, 0, -8, T=T, hand="url(#gGaunt)")
    S.group("body")
    S.shape(SHOULDERS, DARK, decor=hi(60, 88, 20, 7, 0.12))
    for s in (-1, 1):
        cx = 100 + s * 52
        S.shape(cog_path(cx, 106, 31, 23, 8, tip=0.46, a0=22.5), BRASS_C, shadow=3,
                decor=f'<path d="{circ(cx, 106, 12)}" fill="#8A6A2A"/>' + f'<circle cx="{cx}" cy="106" r="5" fill="#E4E8EE"/>'
                      + hi(cx - 8, 94, 9, 4, 0.4))
    S.shape(HEAD, "#C4CAD4", shadow=5,
            decor=f'<path d="M 44 132 L 156 132 L 156 160 L 44 160 Z" fill="#8A909C" opacity="0.6"/>' + slit(100, 116, 74, 15)
                  + rivets([(64, 140), (136, 140), (82, 147), (118, 147)], 2.8, "#E4E8EE") + hi(80, 70, 18, 10, 0.4))
    S.shape(rr(100, 76, 13, 66, 6), BRASS_C, shadow=3)
    S.group("arm-l", PL, "gauntlet")
    fist(S, 48, 146, -6, w=23, h=27, hand="url(#gGaunt)")
    S.shape(rr(48, 132, 29, 8, 3.5), BRASS_C, T="rotate(-6 48 132)", shadow=1)
    return save("enemies", "foundry-automaton", S)


# ================================================================== bomb bot
def bomb_bot():
    S = Sprite("BOMB BOT (round 10): a walking bomb seen from above: one round black iron bomb with a hazard band across its "
               "front, a brass fuse cap on top with a fuse curling to a spark, a brass wind-up key standing out of its back "
               "(#back, sways), two stubby brass feet in front (arm-l, arm-r: they swing as it runs). The game draws the "
               "sparks when it is lit. Parts: #back (key), #arm-l / #arm-r (feet), #body. " + LAYOUT)
    S.group("back", (100, 60), "wind-up key")
    key(S, 100, 26, 1.1)
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 30, 128), "foot")
        S.shape(rr(100 + s * 32, 152, 30, 40, 13), BRASS_C, shadow=0, decor=f'<path d="M 0 164 L 200 164 L 200 180 L 0 180 Z" fill="#8A6A2A" opacity="0.7"/>')
    S.group("body")
    S.shape(circ(100, 100, 52), COAL, shadow=3, decor=hazard(40, 160, 118, 136) + hi(78, 70, 18, 10, 0.22, -30))
    S.shape(circ(100, 96, 15), BRASS_C, shadow=3, decor=hi(95, 91, 6, 3.5, 0.5))
    S.shape(strip([(100, 96), (112, 84), (126, 78), (138, 82)], 5, taper=(0.9, 1.0)), "#D8C8A0", shadow=2)
    S.shape(poly(star(140, 82, 11, 5, 6, 10)), "#FFC24A", shadow=0, side=False, decor='<circle cx="140" cy="82" r="4" fill="#FFFFFF"/>')
    return save("enemies", "foundry-bomb-bot", S)


# ================================================================== turrets
def turret_flame():
    S = Sprite("FLAME TURRET (round 10): a floor turret seen from above: the riveted base plate that stays still (#back), and "
               "on it the part that turns: a dark iron burner between two red fuel tanks with brass caps, a hazard band "
               "across its front, a flared scorched nozzle with a pilot flame. Parts: #back (the base), #body. " + LAYOUT)
    S.add_def(FLAME)
    floor_base(S)
    S.group("body")
    S.shape(rr(100, 150, 24, 56, 8), "#3E424A", shadow=0)
    S.shape(blob([(84, 168), (116, 168), (126, 190), (74, 190)], 0.5), "#6A5A54", shadow=2)
    S.shape(blob([(100, 186), (110, 192), (111, 200), (100, 212), (89, 200), (90, 192)], 0.9), fill="url(#gFlame)", shadow=0, side=False)
    for s in (-1, 1):
        cx = 100 + s * 38
        S.shape(rr(cx, 60, 18, 12, 4), BRASS_C, shadow=0)
        S.shape(rr(cx, 100, 32, 80, 16), REDP, shadow=3, decor=hi(cx - 6, 78, 6, 16, 0.3)
                + strokes(f"M {cx - 16} 116 L {cx + 16} 116", "#8E2A26", 5, 0.8))
    S.shape(rr(100, 100, 54, 78, 22), DARK, shadow=4,
            decor=hazard(70, 130, 122, 134, 14) + rivets([(84, 72), (116, 72)], 3.2, "#A8AEB8") + hi(88, 80, 12, 7, 0.16))
    S.shape(circ(100, 94, 13), BRASS_C, shadow=2, decor=strokes("M 100 94 L 107 87", REDP, 3.5, 1) + '<circle cx="100" cy="94" r="8.5" fill="#F2EEE4"/>'
            + strokes("M 100 94 L 106 88", REDP, 3, 1))
    return save("enemies", "foundry-turret-flame", S)


def bulkhead(S):
    """The gun turret's bulkhead (foundry9.turret_gun, round 10), for the laser turret beside it: a riveted iron block
    built out from the wall with a round socket in its front edge (#back: it stays on the wall)."""
    S.group("back", (100, 100), "bulkhead (stays on the wall)")
    S.shape(rr(100, 26, 196, 16, 6), "#6E747E", shadow=0, decor=rivets([(14, 26), (186, 26)], 3.5, "#C9CED6"))
    bulk = "M 22 16 L 178 16 L 178 88 Q 178 104 162 104 L 38 104 Q 22 104 22 88 Z"
    stripes = "".join(f'<path d="M {x} 108 L {x + 12} 108 L {x + 2} 90 L {x - 10} 90 Z" fill="#2A2C32"/>' for x in range(24, 190, 24))
    S.shape(bulk, DIRON, shadow=2,
            decor=f'<path d="M 20 90 L 180 90 L 180 106 L 20 106 Z" fill="{HAZARD}"/>' + stripes
                  + rivets([(34, 30), (166, 30), (34, 60), (166, 60), (66, 30), (134, 30)], 4.5, "#9AA0AA")
                  + f'<path d="{circ(100, 100, 56)}" fill="#22242A"/>' + hi(64, 40, 26, 9, 0.08))


def turret_laser():
    S = Sprite("LASER TURRET (round 10): a wall turret seen from above, in the gun turret's bulkhead: a riveted iron block "
               "built out from the wall with a round socket in its front edge (#back, it stays on the wall), and half in "
               "the socket the part that turns: a long capsule of a housing with cooling fins across its back and a red "
               "charge window down its middle, a long barrel with three brass focusing rings and a red lens at its end. "
               "Parts: #back (the bulkhead), #body. " + LAYOUT)
    bulkhead(S)
    S.group("body")
    S.shape(rr(100, 152, 15, 84, 6), "#3E424A", shadow=0, decor=strokes("M 96 116 L 96 190", "#C9CED6", 2.5, 0.4))
    for y, w in ((134, 30), (154, 26), (174, 22)):
        S.shape(rr(100, y, w, 8, 3.5), BRASS_C, shadow=1)
    S.shape(circ(100, 195, 11), "#E8403A", shadow=2, decor='<circle cx="96" cy="191" r="4" fill="#FFFFFF" opacity="0.8"/>')
    fins = strokes("M 70 64 L 130 64 M 68 76 L 132 76 M 68 88 L 132 88", "#3A3E46", 5, 0.8)
    S.shape(rr(100, 94, 66, 86, 30), "#5A606A", shadow=3, decor=fins + hi(82, 60, 14, 6, 0.2))
    S.shape(rr(100, 114, 16, 38, 8), "#E8403A", shadow=0, side=False, decor='<rect x="96" y="100" width="4" height="26" rx="2" fill="#FFD0C8" opacity="0.8"/>')
    return save("enemies", "foundry-turret-laser", S)


def mortar():
    S = Sprite("MORTAR (round 10): a floor mortar seen from above: the riveted base plate that stays still with two spare "
               "shells lying on it (#back), and on it the part that turns: a short fat iron tube tilted up and forward, a "
               "brass band round its muzzle and the dark mouth showing, a brass yoke across it, a round breech behind. The "
               "fire and gas mortars are this art with the brass (the band, the yoke, the shells' noses) turned red and "
               "green by the game. Parts: #back (the base and shells), #body (yoke and tube). " + LAYOUT)
    floor_base(S)
    for x, y, a in ((46, 62, -18), (62, 50, -18)):
        T = frame(x, y, a)
        S.shape(rr(0, 0, 14, 30, 6), "#8A909C", T=T, shadow=2)
        S.shape(blob([(-7, 10), (7, 10), (5, 20), (0, 25), (-5, 20)], 0.8), BRASS_C, T=T, shadow=0)
    S.group("body")
    S.shape(rr(100, 104, 100, 24, 10), BRASS_C, shadow=3, decor=rivets([(58, 104), (142, 104)], 4, "#8A6A2A"))
    S.shape(circ(100, 66, 19), "#3E424A", shadow=3)
    S.shape(rr(100, 114, 52, 96, 22), "#6E747E", shadow=4, decor=f'<rect x="82" y="70" width="9" height="76" rx="4.5" fill="#FFFFFF" opacity="0.22"/>')
    S.shape(rr(100, 154, 62, 20, 8), BRASS_C, shadow=3, decor=f'<path d="{ell(100, 157, 20, 6.5)}" fill="#22202A"/>')
    return save("enemies", "foundry-mortar", S)


def tesla_coil():
    S = Sprite("TESLA COIL (round 10): seen from above: a square iron base with a pale ceramic insulator at each corner, and "
               "in the middle the coil: a fat ribbed copper ring (the top of the coil is a ring, not a ball) with a crackling "
               "blue-white spark at its heart, and two arcs of lightning jumping from the ring to the insulators. Parts: "
               "#body only. " + LAYOUT)
    S.group("body")
    arcs = ('<path d="M 132 68 L 130 58 L 139 60 L 138 50 L 146 54 M 68 132 L 58 130 L 60 139 L 50 138 L 54 146" fill="none" stroke="#DFF8FF" '
            'stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>')
    S.shape(rr(100, 100, 124, 124, 22), DIRON, shadow=0, decor=hi(70, 52, 22, 7, 0.08))
    for x, y in ((54, 54), (146, 54), (54, 146), (146, 146)):
        S.shape(circ(x, y, 14), "#DCE6F0", shadow=3, decor=f'<circle cx="{x}" cy="{y}" r="8" fill="none" stroke="#9AAEC4" stroke-width="3"/>'
                + f'<circle cx="{x}" cy="{y}" r="3.5" fill="#6E747E"/>')
    S.shape(circ(100, 100, 30), COAL, shadow=0,
            decor='<circle cx="100" cy="100" r="22" fill="#6ED0FF" opacity="0.35"/><circle cx="100" cy="100" r="13" fill="#BFF2FF"/>'
                  + f'<path d="{poly(star(100, 100, 17, 5, 4, 0))}" fill="#FFFFFF"/>')
    S.shape(circ(100, 100, 46) + " " + circ(100, 100, 25), COPPER, shadow=4, rule="evenodd",
            decor='<path d="M 62 84 A 40 40 0 0 1 94 61" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity="0.4"/>'
                  + "".join(f'<path d="M {f(100 + 27 * math.cos(math.radians(a)))} {f(100 + 27 * math.sin(math.radians(a)))} L '
                            f'{f(100 + 45 * math.cos(math.radians(a)))} {f(100 + 45 * math.sin(math.radians(a)))}" stroke="{DCOPPER}" stroke-width="3" opacity="0.55"/>'
                            for a in range(15, 360, 30)))
    S.raw(arcs)
    return save("enemies", "foundry-tesla-coil", S)


# ================================================================== repair drone
def repair_drone():
    S = Sprite("REPAIR DRONE (round 10): a small flying mender seen from above: one round white shell with a green cross "
               "painted on it (it mends), a spinning rotor on a strut at each side (#back), a wrench in front on the right "
               "and a welding torch with a blue flame on the left (arm-r, arm-l: they lift when it mends). Parts: #back "
               "(rotors), #arm-l / #arm-r (tools), #body. " + LAYOUT)
    S.group("back", (100, 100), "rotors")
    for s in (-1, 1):
        cx = 100 + s * 54
        S.shape(band([(100 + s * 20, 96), (cx, 88)], 5), DARK, shadow=0)
        blades = (f'<path d="M {cx} 88 L {cx - 24} 76 L {cx - 24} 100 Z M {cx} 88 L {cx + 24} 76 L {cx + 24} 100 Z" fill="#8E9AAA" opacity="0.55"/>'
                  f'<circle cx="{cx}" cy="88" r="25" fill="none" stroke="#8A909C" stroke-width="5"/><circle cx="{cx}" cy="88" r="6" fill="{DARK}"/>')
        S.shape(circ(cx, 88, 28), "#E4EAF2", shadow=2, decor=blades)
    S.group("arm-r", (122, 128), "wrench")
    T = frame(124, 132, -14)
    S.shape(rr(0, 14, 8, 34, 4), "#8A909C", T=T, shadow=0)
    S.shape(poly([(-11, 26), (11, 26), (11, 48), (5, 48), (5, 36), (-5, 36), (-5, 48), (-11, 48)]), STEELC, T=T, shadow=1)
    S.group("arm-l", (78, 128), "welding torch")
    T = frame(76, 132, 14)
    S.shape(rr(0, 14, 8, 34, 4), "#8A909C", T=T, shadow=0)
    S.shape(rr(0, 32, 14, 12, 4), BRASS_C, T=T, shadow=1)
    S.shape(blob([(-5, 38), (5, 38), (3, 48), (0, 56), (-3, 48)], 0.8), "#8AD8FF", T=T, shadow=0, side=False)
    S.group("body")
    cross = f'<path d="{rr(100, 104, 16, 46, 4)} {rr(100, 104, 46, 16, 4)}" fill="#3FB86A"/>'
    S.shape(ell(100, 104, 40, 44), "#EEF1F5", shadow=4, decor=cross + hi(84, 78, 13, 8, 0.6, -25))
    return save("enemies", "foundry-repair-drone", S)


# ================================================================== foundry smith
def smith():
    S = Sprite("FOUNDRY SMITH (round 10): a big smith in the heroes' bust build: very broad bare sooty shoulders, a dark "
               "leather apron bib with two straps and brass rivets, a bald head under a red sweatband, a great ginger beard "
               "and moustache (no eyes); a big hammer with a red-hot face under the right shoulder (arm-r, it swings), a "
               "thick leather glove on the left fist (arm-l). " + LAYOUT)
    S.add_def(METAL_DEFS)
    S.add_def('<linearGradient id="gFaceBrute" x1="0" y1="47" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
              '<stop offset="0" stop-color="#F0C49E"/><stop offset="0.3" stop-color="#E9B892"/>'
              '<stop offset="0.55" stop-color="#F2C7A0"/><stop offset="0.85" stop-color="#F4CBA6"/>'
              '<stop offset="1" stop-color="#E6B590"/></linearGradient>')
    APRON, GINGER = "#4A4654", "#D06A2A"
    S.group("arm-r", (160, 108), "hammer")
    T = frame(162, 116, 10)
    S.shape(rr(0, 18, 11, 84, 4), "#9A6A40", T=T, shadow=0)
    S.shape(rr(0, 62, 58, 38, 9), DARK, T=T, shadow=3, decor=f'<path d="M -30 70 L 30 70 L 30 84 L -30 84 Z" fill="url(#gHot)"/>'
            + '<rect x="-22" y="48" width="18" height="6" rx="3" fill="#FFFFFF" opacity="0.18"/>')
    fist(S, 0, 0, T=T, w=25, h=29)
    S.group("body")
    wide = "M12 108 C12 80 50 72 100 72 C150 72 188 80 188 108 C188 136 150 144 100 144 C50 144 12 136 12 108 Z"
    S.shape(wide, "#D9A27F", decor=f'<path d="{ell(40, 116, 18, 9)} {ell(160, 92, 16, 7)}" fill="#5A4A44" opacity="0.28"/>' + hi(52, 90, 20, 7, 0.18))
    for s in (-1, 1):
        S.shape(poly([(100 + s * 30, 100), (100 + s * 56, 74), (100 + s * 72, 78), (100 + s * 44, 110)]), APRON, shadow=2,
                decor=f'<circle cx="{100 + s * 58}" cy="84" r="4" fill="{BRASS_C}"/>')
    S.shape(blob([(64, 98), (100, 92), (136, 98), (140, 138), (100, 150), (60, 138)], 0.6), APRON, shadow=3)
    head(S, face="url(#gFaceBrute)")
    S.raw(f'<path d="{ell(128, 104, 9, 5)}" fill="#5A4A44" opacity="0.25"/>')
    beard = blob([(60, 122), (72, 136), (86, 142), (100, 143), (114, 142), (128, 136), (140, 122), (144, 142), (136, 160), (120, 170),
                  (108, 182), (100, 188), (92, 182), (80, 170), (64, 160), (56, 142)], 0.7)
    S.shape(beard, GINGER, shadow=4, decor=strokes("M 84 150 L 88 172 M 100 150 L 100 180 M 116 150 L 112 172", "#A04A1A", 3, 0.5))
    moustache(S, GINGER, 126, 1.0, 2)
    S.shape("M52 72 C60 78 80 86 100 86 C120 86 140 78 148 72 C150 76 150 84 148 88 C138 96 120 102 100 102 C80 102 62 96 "
            "52 88 C50 84 50 76 52 72 Z", REDP, shadow=3)
    S.group("arm-l", (44, 108), "gloved fist")
    fist(S, 36, 148, -6, w=28, h=32, hand="#8A5E38")
    S.shape(rr(36, 132, 34, 10, 4), "#6A4628", T="rotate(-6 36 132)", shadow=1)
    return save("enemies", "foundry-smith", S)


# ================================================================== saw blade
def saw_blade():
    S = Sprite("SAW BLADE (round 10): a circular saw seen from straight above: a steel disc with twelve big hooked teeth, "
               "three curved slots cut through it, a red-painted hub with a brass nut. It spins as it runs along a wall. "
               "Parts: #body only. " + LAYOUT)
    S.group("body")
    pts = []
    for i in range(12):
        a = i * 30
        for da, r in ((0, 58), (9, 77), (25, 58)):
            pts.append((100 + r * math.sin(math.radians(a + da)), 100 - r * math.cos(math.radians(a + da))))
    slots = ""
    for i in range(3):
        a0 = i * 120 + 20
        p = [(100 + r * math.sin(math.radians(a)), 100 - r * math.cos(math.radians(a))) for r, a in
             ((34, a0), (36, a0 + 30), (40, a0 + 58), (48, a0 + 60), (46, a0 + 28), (42, a0))]
        slots += f'<path d="{blob(p, 0.8)}" fill="#3A3E48"/>'
    S.shape(poly(pts), STEELC, shadow=0,
            decor=f'<circle cx="100" cy="100" r="54" fill="none" stroke="#8A909C" stroke-width="3.5" opacity="0.7"/>' + slots
                  + hi(74, 62, 18, 9, 0.35, -30))
    S.shape(circ(100, 100, 25), REDP, shadow=3, decor=hi(92, 90, 9, 5, 0.3))
    S.shape(poly([(100 + 11 * math.sin(math.radians(a)), 100 - 11 * math.cos(math.radians(a))) for a in range(0, 360, 60)]), BRASS_C, shadow=2)
    return save("enemies", "foundry-saw-blade", S)


# ================================================================== chain crawler
PLATE = "#8A909C"


def crawler_head():
    S = Sprite("CHAIN CRAWLER, the head (round 10): the head of a mechanical centipede seen from above: one broad rounded "
               "steel head plate with a brass ridge down it and one amber-lit slit across its front (no eyes), and "
               "two great curved iron pincers (arm-l, arm-r: they snap when it bites); a "
               "collar behind where the first body plate joins. Parts: #arm-l / #arm-r (pincers), #body. " + LAYOUT)
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 30, 138), "pincer")
        p = [(122, 128), (146, 136), (160, 158), (154, 184), (134, 198), (142, 176), (138, 158), (122, 150)]
        S.shape(blob(p if s > 0 else mirror(p), 0.85), DARK, shadow=0)
    S.group("body")
    S.shape(rr(100, 58, 88, 44, 20), "#6E747E", shadow=0)
    plate = blob([(100, 46), (134, 54), (152, 82), (152, 114), (136, 142), (100, 154), (64, 142), (48, 114), (48, 82), (66, 54)], 0.9)
    S.shape(plate, PLATE, shadow=4, decor=slit(100, 126, 66, 14) + rivets([(62, 84), (138, 84)], 3.2, "#E4E8EE") + hi(78, 66, 16, 8, 0.3))
    S.shape(rr(100, 80, 13, 56, 6), BRASS_C, shadow=3)
    return save("enemies", "foundry-crawler-head", S)


def crawler_plate():
    S = Sprite("CHAIN CRAWLER, a body plate (round 10): one plate of the centipede's body seen from above: a rounded steel "
               "plate a little longer than the step between plates, so each overlaps the next and they read as one body, a "
               "brass stud on its spine, a darker band along its back edge, and one pointed iron leg out at each side. No "
               "parts. " + LAYOUT)
    S.group("body")
    for s in (-1, 1):
        p = [(140, 96), (166, 90), (180, 100), (188, 128)]
        S.shape(strip(p if s > 0 else mirror(p), 5.5, taper=(1.0, 1.0)), DARK, shadow=0)
    S.shape(rr(100, 100, 108, 86, 36), PLATE, shadow=0,
            decor=f'<path d="M 40 50 L 160 50 L 160 72 Q 100 84 40 72 Z" fill="#5A606A" opacity="0.6"/>'
                  + rivets([(62, 106), (138, 106)], 3.2, "#E4E8EE") + hi(76, 92, 14, 6, 0.25))
    S.shape(circ(100, 108, 10), BRASS_C, shadow=2)
    return save("enemies", "foundry-crawler-plate", S)


# ================================================================== drill bot
def drill_bot():
    S = Sprite("DRILL BOT (round 10): a burrowing machine seen from above, two parts: one squat rounded body in safety "
               "yellow with two black chevrons pointing forward, a track down each side and a short exhaust stack behind "
               "(#back); and a great conical steel drill as wide as the body on an iron collar (arm-r: it drives forward "
               "when it strikes). Parts: #back (stack), #body, #arm-r (drill). " + LAYOUT)
    S.group("back", (100, 70), "exhaust stack")
    S.shape(rr(100, 42, 26, 22, 8), DARK, shadow=0, decor=hi(94, 37, 6, 3, 0.2))
    S.group("body")
    for s in (-1, 1):
        cx = 100 + s * 48
        S.shape(rr(cx, 94, 28, 96, 11), COAL, shadow=0,
                decor=strokes(" ".join(f"M {cx - 14} {y} L {cx + 14} {y}" for y in range(56, 140, 14)), "#8A8492", 4, 0.55))
    S.shape(rr(100, 90, 88, 90, 34), HAZARD, shadow=3,
            decor=strokes("M 68 64 L 100 84 L 132 64 M 68 90 L 100 110 L 132 90", "#2A2C32", 10, 1, cap="butt") + hi(80, 58, 14, 6, 0.4))
    S.group("arm-r", (100, 120), "the drill")
    S.shape(rr(100, 138, 76, 18, 8), DARK, shadow=3)
    cone = poly([(66, 146), (134, 146), (100, 208)])
    S.shape(cone, STEELC, shadow=2,
            decor=strokes("M 60 158 L 140 150 M 68 176 L 132 166 M 80 194 L 122 184", "#6E747E", 5.5, 0.9, cap="butt")
                  + '<path d="M 66 146 L 78 146 L 100 208 Z" fill="#FFFFFF" opacity="0.3"/>')
    return save("enemies", "foundry-drill-bot", S)


def crawler_board():
    """The chain crawler as the game lays it (js/foundry.js: a head and eight plates, gap 28, tapering), on an easy
    curve, the tail drawn first. For the board only."""
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
    from compose import compose
    head = (ROOT5 / "enemies" / "foundry-crawler-head.svg").read_text(encoding="utf-8")
    plate = (ROOT5 / "enemies" / "foundry-crawler-plate.svg").read_text(encoding="utf-8")
    kh, kc, gap, n, taper = 23 / 40, 22 / 46, 28, 8, 0.6
    x, y, pos = 0.0, 0.0, [(0.0, 0.0, 90.0)]
    for i in range(1, n + 1):
        a = math.radians(-90 + 34 * math.sin(i * 0.8 - 0.4))
        x += gap * math.cos(a); y += gap * math.sin(a)
        pos.append((x, y, math.degrees(a) + 180))
    S, ox, oy, items = 0.78, 96, 176, []
    for i in range(n, 0, -1):
        px, py, face = pos[i]
        k = kc * (1 - 0.35 * ((i - 1) / (n - 1)) * taper) * S
        items.append((plate, f"translate({ox + px * S:.2f} {oy + py * S:.2f}) rotate({face - 90:.1f}) scale({k:.4f}) translate(-100 -100)"))
    items.append((head, f"translate({ox:.2f} {oy:.2f}) scale({kh * S:.4f}) translate(-100 -100)"))
    out = ROOT5 / "boards" / "foundry-chain-crawler.svg"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(compose(items, "THE CHAIN CRAWLER (round 10): its head and eight plates laid as the game lays the chain (gap 28, "
                                  "tapering), for the board only."), encoding="utf-8")
    return out


BUILD = {"foundry-automaton": automaton, "foundry-bomb-bot": bomb_bot, "foundry-turret-flame": turret_flame,
         "foundry-turret-laser": turret_laser, "foundry-mortar": mortar, "foundry-tesla-coil": tesla_coil,
         "foundry-repair-drone": repair_drone, "foundry-smith": smith, "foundry-saw-blade": saw_blade,
         "foundry-crawler-head": crawler_head, "foundry-crawler-plate": crawler_plate, "foundry-drill-bot": drill_bot,
         "foundry-chain-crawler": crawler_board}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
