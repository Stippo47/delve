"""Round 9: real art for the Clockwork Foundry's stand-ins (docs/ART-NEEDED.md), A2 style: machines in round 8's
creature build (a few simple shapes, readable at game size), people in the heroes' bust build.
  the gear and cog sprites, the bomb bot (the auto bomb bot is it recoloured), the automaton, the turrets (steam and
  flame on the floor, gun and laser on the walls: what stays put is #back, the game keeps it still while the rest
  turns), the mortar (the fire and gas mortars are it with its brass trim turned red and green), the tesla coil, the
  repair drone, the foundry smith, the bee, the wasp and the hornet (copper: the game turns them bronze and steel), the
  saw blade, the chain crawler's head and one of its plates, the drill bot, the storm spirit.
python foundry9.py [name ...]   -> ../../enemies/foundry-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *

IRON, DIRON, STEELC, COPPER, DCOPPER, BRASS_C = "#7A808C", "#4A4E58", "#BCC4CE", "#C8743A", "#8A4A26", "#D9A441"
HAZARD = "#E8B43A"
METAL_DEFS = ('<radialGradient id="gGaunt" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#C9CED6"/>'
              '<stop offset="1" stop-color="#7A808C"/></radialGradient>'
              '<radialGradient id="gHot" cx="0.5" cy="0.6" r="0.6"><stop offset="0" stop-color="#FFF2A0"/>'
              '<stop offset="0.5" stop-color="#FF9A3D"/><stop offset="1" stop-color="#C8402A"/></radialGradient>')


def cog_path(cx, cy, R, root, n, tip=0.42, a0=0.0):
    """A cog's outline seen from above: n teeth, tip radius R, root radius root; tip = the fraction of each tooth's
    pitch that is the flat top of the tooth."""
    pts = []
    step = 360 / n
    for i in range(n):
        c = a0 + i * step
        half_tip, half_root = step * tip / 2, step * (tip / 2 + 0.16)
        for a, r in ((c - half_root, root), (c - half_tip, R), (c + half_tip, R), (c + half_root, root)):
            pts.append((cx + r * math.sin(math.radians(a)), cy - r * math.cos(math.radians(a))))
    return poly(pts)


def rivets(pts, r=3.2, col="#E4E8EE"):
    return "".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}" fill="{col}" opacity="0.85"/>' for x, y in pts)


def ring_pts(cx, cy, R, n, a0=0):
    return [(cx + R * math.sin(math.radians(a0 + i * 360 / n)), cy - R * math.cos(math.radians(a0 + i * 360 / n))) for i in range(n)]


# ================================================================== gear and cog sprites
def gear_sprite():
    S = Sprite("GEAR SPRITE (round 9): a rolling cog seen from straight above (the designer: \"top down so u see it as a "
               "circle\"): a steel cog with ten square teeth, a darker rim inside them, four round holes and a brass hub "
               "with bolts. No face. It spins as it rolls. Parts: #body only. " + LAYOUT)
    S.group("body")
    holes = "".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="11" fill="{DIRON}"/>' for x, y in ring_pts(100, 100, 32, 4, 45))
    S.shape(cog_path(100, 100, 74, 60, 10), STEELC, shadow=0,
            decor=f'<path d="{circ(100, 100, 52)}" fill="none" stroke="{IRON}" stroke-width="5" opacity="0.6"/>' + holes
                  + f'<path d="{ell(78, 70, 16, 9)}" fill="#FFFFFF" opacity="0.35"/>')
    S.shape(circ(100, 100, 17), BRASS_C, shadow=3, decor=rivets(ring_pts(100, 100, 9, 4), 2.6, "#8A6A2A"))
    return save("enemies", "foundry-gear-sprite", S)


def cog_sprite():
    S = Sprite("COG SPRITE (round 9): the gear sprite's brass cousin, a different cog: seven big blunt teeth, three spokes "
               "with dark windows between them, a steel hub. Seen from straight above, it spins as it rolls. No face. "
               "Parts: #body only. " + LAYOUT)
    S.group("body")
    wins = "".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="7.5" fill="#6A4A1E"/>' for x, y in ring_pts(100, 100, 34, 6, 30))
    S.shape(cog_path(100, 100, 74, 54, 7, tip=0.5, a0=10), "#D8A24A", shadow=0,
            decor=f'<path d="{circ(100, 100, 50)}" fill="none" stroke="#A8762A" stroke-width="5" opacity="0.6"/>' + wins
                  + f'<path d="{ell(78, 70, 16, 9)}" fill="#FFF6D0" opacity="0.4"/>')
    S.shape(circ(100, 100, 18), STEELC, shadow=3, decor=rivets(ring_pts(100, 100, 10, 3), 2.8, "#6E747E"))
    return save("enemies", "foundry-cog-sprite", S)


# ================================================================== bomb bot
def leg9(S, hip, foot, w=11, col=IRON):
    S.shape(taper([hip, foot], w, w * 0.8, 0.7), col, shadow=0)
    S.shape(circ(foot[0], foot[1], w * 0.7), BRASS_C, shadow=2)


def bomb_bot():
    S = Sprite("BOMB BOT (round 9): a round iron bomb on four stubby legs, seen from above: a black iron ball with a ring "
               "of rivets, a brass fuse cap on top (the middle, seen from above) with a short fuse curling back, a small "
               "grille at the front; brass feet. No eyes. The game draws the fuse's sparks. The auto bomb bot is this "
               "art recoloured. Parts: #back (the back legs), #arm-l / #arm-r (the front legs, they swing as it runs), "
               "#body. " + LAYOUT)
    S.group("back", (100, 100), "back legs")
    for s in (-1, 1):
        leg9(S, (100 + s * 34, 74), (100 + s * 52, 50))
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 34, 124), "front leg")
        leg9(S, (100 + s * 34, 126), (100 + s * 52, 152))
    S.group("body")
    S.shape(circ(100, 100, 52), "#45464E", shadow=0,
            decor=rivets(ring_pts(100, 100, 42, 12, 15), 3.2, "#8A8E98") + f'<path d="{ell(80, 76, 18, 11)}" fill="#FFFFFF" opacity="0.22"/>'
                  )
    S.shape(strip([(100, 98), (106, 80), (118, 70), (128, 72)], 6, taper=(0.8, 1.0)), "#C9B58A", shadow=2)
    S.shape(circ(100, 100, 15), BRASS_C, shadow=3, decor=f'<path d="{circ(97, 97, 5)}" fill="#FFF2C0" opacity="0.7"/>')
    return save("enemies", "foundry-bomb-bot", S)


# ================================================================== automaton
def automaton():
    S = Sprite("AUTOMATON (round 9): a brass sword construct in the heroes' bust build: a riveted copper dome of a head "
               "with a dark vent grille at the front (no eyes), brass shoulder plates, a boiler on its back with two "
               "short stacks and vent slats (#back, sways); a broad straight sword in an iron gauntlet under the right "
               "shoulder (arm-r, it swings), an iron gauntlet on the left (arm-l). " + LAYOUT)
    S.add_def(METAL_DEFS)
    S.group("back", (100, 80), "boiler")
    S.shape(rr(100, 52, 92, 52, 18), COPPER, shadow=0,
            decor=strokes("M 66 40 L 66 64 M 76 40 L 76 64 M 124 40 L 124 64 M 134 40 L 134 64", DCOPPER, 3.5, 0.7))
    S.shape(rr(100, 30, 30, 18, 7), DIRON, shadow=2, decor=strokes("M 90 30 L 110 30", "#1E1E24", 5, 1))
    S.group("arm-r", PR, "sword")
    T = frame(160, 128, 10)
    S.shape(rr(0, -10, 10, 24, 4), "#5A3A26", T=T, shadow=0)
    S.shape(poly([(-11, 8), (11, 8), (10, 64), (0, 80), (-10, 64)]), STEELC, T=T, shadow=2,
            decor=f'<path d="{poly([(0, 8), (11, 8), (10, 64), (0, 80)])}" fill="#7E8696" opacity="0.45"/>')
    S.shape(rr(0, 5, 34, 9, 3), BRASS_C, T=T, shadow=2)
    fist(S, 0, -8, T=T, w=24, h=27, hand="url(#gGaunt)")
    S.group("body")
    S.shape(SHOULDERS, BRASS_C, decor=rivets([(40, 100), (52, 88), (160, 100), (148, 88), (40, 120), (160, 120)], 3.4, "#8A6A2A"))
    head(S, face="url(#gAutoHead)")
    S.add_def('<linearGradient id="gAutoHead" x1="60" y1="48" x2="140" y2="153" gradientUnits="userSpaceOnUse">'
              '<stop offset="0" stop-color="#C4CAD4"/><stop offset="1" stop-color="#6E747E"/></linearGradient>')
    S.raw(f'<g clip-path="url(#autoHead)"><path d="{rr(100, 84, 16, 76, 8)}" fill="{COPPER}"/>'
          f'<path d="{rr(100, 138, 50, 22, 8)}" fill="#2A2228"/>{strokes("M 80 132 L 120 132 M 80 140 L 120 140 M 80 148 L 120 148", "#5E5A62", 3, 1)}'
          '</g>')
    S.add_def(f'<clipPath id="autoHead"><path d="{HEAD}"/></clipPath>')
    S.group("arm-l", PL, "gauntlet")
    fist(S, 48, 146, -6, w=24, h=27, hand="url(#gGaunt)")
    return save("enemies", "foundry-automaton", S)


# ================================================================== turrets
def floor_base(S, col=DIRON):
    """A floor turret's base plate (#back: the game keeps it still while the top turns): a rounded square with bolts."""
    S.group("back", (100, 100), "base plate (stays still)")
    S.shape(rr(100, 100, 140, 140, 28), col, shadow=0,
            decor=rivets([(46, 46), (154, 46), (46, 154), (154, 154)], 5, "#9AA0AA")
                  + f'<path d="{circ(100, 100, 58)}" fill="#2A2C32" opacity="0.5"/>')


def wall_plate(S, col=DIRON):
    """A wall turret's plate (#back): its back edge on the wall, where the game mounts it (families.js mountOnWall: the
    collider's radius + 2 out, 30.6 room units, 83 of these units at headR 60)."""
    S.group("back", (100, 100), "wall plate (stays on the wall)")
    S.shape(rr(100, 34, 168, 36, 10), col, shadow=0, decor=rivets([(30, 34), (60, 34), (140, 34), (170, 34)], 4.5, "#9AA0AA"))


def turret_steam():
    S = Sprite("STEAM TURRET (round 9): a round iron turret on the floor, seen from above: a riveted base plate that "
               "stays still (#back) and a round iron housing that turns, a stubby wide steam barrel with a brass muzzle "
               "ring and a pressure gauge on top, a pipe curling back into the housing. Parts: #back (the base), #body "
               "(housing and barrel). " + LAYOUT)
    floor_base(S)
    S.group("body")
    S.shape(rr(100, 150, 34, 64, 12), IRON, shadow=0, decor=strokes("M 92 128 L 92 176", "#C9CED6", 3, 0.5))
    S.shape(rr(100, 178, 42, 14, 6), BRASS_C, shadow=2)
    S.shape(circ(100, 100, 52), "#8A909C", shadow=3,
            decor=rivets(ring_pts(100, 100, 42, 10, 18), 3.2, "#CDD2DA") + f'<path d="{ell(82, 78, 18, 10)}" fill="#FFFFFF" opacity="0.25"/>')
    S.shape(circ(80, 70, 9), COPPER, shadow=2, decor=strokes("M 72 70 L 88 70 M 80 62 L 80 78", DCOPPER, 3, 0.9))
    S.shape(circ(112, 84, 14), "#F2EEE4", shadow=2, decor=strokes("M 112 84 L 120 78", "#C8402A", 3, 1) + f'<path d="{circ(112, 84, 14)}" fill="none" stroke="{BRASS_C}" stroke-width="4"/>')
    return save("enemies", "foundry-turret-steam", S)


def turret_flame():
    S = Sprite("FLAME TURRET (round 9): a squat red iron turret on the floor, seen from above: a base plate that stays "
               "still (#back), a squat rounded housing painted red with a black-and-yellow hazard band, a fuel tank on "
               "its back, a long flamethrower nozzle with a flared mouth and a little pilot flame. Parts: #back (the "
               "base), #body (housing, tank and nozzle). " + LAYOUT)
    floor_base(S)
    S.add_def(FLAME_DEF)
    S.group("body")
    S.shape(rr(100, 150, 18, 70, 7), IRON, shadow=0)
    S.shape(blob([(86, 178), (114, 178), (120, 194), (80, 194)], 0.6), DIRON, shadow=2)
    d, T = flame(100, 192, 0, 14, 7)
    S.shape(d, fill="url(#gFlameUp)", T=T, shadow=0, side=False)
    S.shape(rr(100, 54, 62, 34, 15), "#7A2E28", shadow=0, decor=strokes("M 76 54 L 124 54", "#A8443A", 4, 0.7))
    S.shape(rr(100, 104, 96, 80, 26), "#A8443A", shadow=3,
            decor=f'<path d="M 52 124 L 148 124 L 148 136 L 52 136 Z" fill="{HAZARD}"/>'
                  + "".join(f'<path d="M {x} 124 L {x + 8} 124 L {x - 4} 136 L {x - 12} 136 Z" fill="#2A2228"/>' for x in range(58, 150, 16))
                  + f'<path d="{ell(80, 82, 18, 9)}" fill="#FFFFFF" opacity="0.2"/>')
    return save("enemies", "foundry-turret-flame", S)


# round 10 (art-round9 deck, on the Gun turret: "Almost good. Turret part shoukd be in the wall more. Circle half way in.
# Could add more detail/ parts."): turret_gun(r10=True) keeps the dome and the twin barrels exactly and changes:
#   in the wall: the game mounts a wall turret with its centre a collider's radius out from the wall (families.js
#       mountOnWall: 83 of these units), and the dome has to stay on that centre to swivel. So the wall comes out to it:
#       the thin plate is a riveted iron bulkhead built out from the wall as far as the dome's middle (#back, it stays
#       put), with a round socket in its front edge: the dome sits half in the socket, half out.
#   more parts: a drum magazine on the dome's left side, a top hatch with a hinge and a sight notch on the dome, cooling
#       collars on the barrels, a hazard stripe along the bulkhead's lip and a feed pipe along the wall.
def turret_gun(r10=False):
    S = Sprite("GUN TURRET (round 9): a turret mounted on a wall, seen from above: a riveted plate on the wall behind it "
               "(#back: it stays on the wall while the gun turns), a dark iron dome on a swivel and twin barrels pointing "
               "out into the room with brass muzzle rings. Parts: #back (the wall plate), #body (dome and barrels). "
               + LAYOUT)
    if r10:
        S.comment = S.comment.replace("(round 9)", "(round 10: set into the wall, more parts)").replace(
            "a riveted plate on the wall behind it (#back: it stays on the wall while the gun turns)",
            "a riveted iron bulkhead built out from the wall with a round socket in its front edge (#back: it stays on the "
            "wall while the gun turns), the dome half in the socket; a drum magazine on the dome's side, a hatch and a "
            "sight on top, cooling collars on the barrels")
        S.group("back", (100, 100), "bulkhead (stays on the wall)")
        S.shape(rr(100, 26, 196, 16, 6), "#6E747E", shadow=0, decor=rivets([(14, 26), (186, 26)], 3.5, "#C9CED6"))   # the feed pipe
        bulk = "M 22 16 L 178 16 L 178 88 Q 178 104 162 104 L 38 104 Q 22 104 22 88 Z"
        stripes = "".join(f'<path d="M {x} 108 L {x + 12} 108 L {x + 2} 90 L {x - 10} 90 Z" fill="#2A2C32"/>' for x in range(24, 190, 24))
        S.shape(bulk, DIRON, shadow=2,
                decor=f'<path d="M 20 90 L 180 90 L 180 106 L 20 106 Z" fill="{HAZARD}"/>' + stripes
                      + rivets([(34, 30), (166, 30), (34, 60), (166, 60), (66, 30), (134, 30)], 4.5, "#9AA0AA")
                      + f'<path d="{circ(100, 100, 56)}" fill="#22242A"/>'
                      + f'<path d="{ell(64, 40, 26, 9)}" fill="#FFFFFF" opacity="0.08"/>')
    else:
        wall_plate(S)
    S.group("body")
    for x in (90, 110):
        S.shape(rr(x, 150, 11, 84, 5), "#5A606A", shadow=0, decor=strokes(f"M {x - 2} 116 L {x - 2} 184", "#C9CED6", 2.5, 0.5))
        S.shape(rr(x, 190, 15, 9, 3.5), BRASS_C, shadow=1)
    if r10:
        for y in (150, 164):   # cooling collars across both barrels
            S.shape(rr(100, y, 38, 8, 3.5), "#3E424A", shadow=1)
        S.shape(rr(54, 104, 26, 40, 10), "#6E747E", shadow=0, decor=strokes("M 44 92 L 64 92 M 44 104 L 64 104 M 44 116 L 64 116", "#3E424A", 3, 0.8))   # the drum magazine
    S.shape(circ(100, 96, 46), "#5A606A", shadow=3,
            decor=rivets(ring_pts(100, 96, 37, 8, 22), 3.2, "#A8AEB8") + f'<path d="{ell(84, 76, 16, 9)}" fill="#FFFFFF" opacity="0.22"/>'
                  + f'<path d="{circ(100, 96, 18)}" fill="#3E424A"/>')
    if r10:
        S.shape(circ(100, 96, 14), "#7A808C", shadow=2, decor=strokes("M 91 96 L 109 96", "#3E424A", 3, 0.9) + f'<circle cx="95" cy="91" r="3.5" fill="#FFFFFF" opacity="0.3"/>')   # the hatch
        S.shape(rr(100, 78, 14, 7, 3), "#3E424A", shadow=1)     # its hinge
        S.shape(rr(100, 134, 10, 12, 3), BRASS_C, shadow=2)     # the sight, between the barrels' roots
    return save("enemies", "foundry-turret-gun", S)


def turret_laser():
    S = Sprite("LASER TURRET (round 9): a turret mounted on a wall, seen from above: a riveted plate on the wall behind it "
               "(#back), a dark housing with cooling fins down both sides and a long barrel ending in a big red glass "
               "lens. Parts: #back (the wall plate), #body (housing, fins, barrel and lens). " + LAYOUT)
    wall_plate(S)
    S.group("body")
    for s in (-1, 1):
        for y in (78, 92, 106, 120):
            S.shape(rr(100 + s * 46, y, 22, 7, 3), "#3E424A", shadow=0)
    S.shape(rr(100, 150, 24, 70, 8), "#4A4E58", shadow=0)
    S.shape(rr(100, 100, 70, 70, 20), "#5E6470", shadow=3,
            decor=f'<path d="{ell(84, 78, 16, 9)}" fill="#FFFFFF" opacity="0.2"/>' + strokes("M 74 120 L 126 120", "#3E424A", 4, 0.6))
    S.shape(circ(100, 184, 15), "#C8302A", shadow=2,
            decor=f'<path d="{circ(96, 180, 6)}" fill="#FFB0A0" opacity="0.9"/>' + f'<path d="{circ(100, 184, 15)}" fill="none" stroke="#2E2E34" stroke-width="5"/>')
    return save("enemies", "foundry-turret-laser", S)


def mortar():
    S = Sprite("MORTAR (round 9): a short fat mortar tube on the floor, seen from above (it fires up into the sky): a "
               "round base ring with bolts that stays still (#back), a brass yoke and a thick iron tube tilted a little "
               "towards its target, its dark bore with a shell inside, a brass band round the muzzle. The fire and gas "
               "mortars are this art with the brass turned red and green (js/foundry.js). Parts: #back (the base), "
               "#body (yoke and tube). " + LAYOUT)
    S.group("back", (100, 100), "base ring (stays still)")
    S.shape(circ(100, 100, 70), DIRON, shadow=0, decor=rivets(ring_pts(100, 100, 60, 8, 22.5), 4.5, "#9AA0AA"))
    S.group("body")
    for s in (-1, 1):   # the yoke
        S.shape(rr(100 + s * 42, 96, 20, 44, 7), BRASS_C, shadow=0)
    # the tube, tilted up and forward: seen from above its length shows foreshortened, the muzzle at the front
    S.shape(rr(100, 112, 66, 92, 30), "#6E747E", shadow=3,
            decor=f'<path d="{ell(84, 88, 12, 18)}" fill="#FFFFFF" opacity="0.2"/>' + strokes("M 70 100 L 130 100", "#4A4E58", 4, 0.6))
    S.shape(rr(100, 150, 70, 24, 11), BRASS_C, shadow=2)
    S.shape(ell(100, 152, 26, 9), "#1E1E24", shadow=0, side=False)
    return save("enemies", "foundry-mortar", S)


# ================================================================== tesla coil
def tesla_coil():
    S = Sprite("TESLA COIL (round 9): a tesla coil seen from above: a square dark iron base with bolts, copper coil rings "
               "stacked up the column (concentric rings from above), a grey-blue insulator collar and a copper ball on top "
               "with a bright highlight. It never moves; the game draws its sparks. Parts: #body only. " + LAYOUT)
    S.group("body")
    S.shape(rr(100, 100, 124, 124, 22), "#3E424A", shadow=0, decor=rivets([(52, 52), (148, 52), (52, 148), (148, 148)], 5, "#8A909A"))
    S.shape(circ(100, 100, 50), COPPER, shadow=3,
            decor="".join(f'<path d="{circ(100, 100, r)}" fill="none" stroke="{DCOPPER}" stroke-width="3" opacity="0.8"/>' for r in (44, 37, 30)))
    S.shape(circ(100, 100, 28), "#8E9CB0", shadow=3, decor=f'<path d="{circ(100, 100, 24)}" fill="none" stroke="#6E7C90" stroke-width="3"/>')
    S.shape(circ(100, 100, 20), "#D8803E", shadow=3, decor=f'<path d="{circ(93, 93, 7)}" fill="#FFE0B0" opacity="0.85"/>')
    return save("enemies", "foundry-tesla-coil", S)


# ================================================================== repair drone
def repair_drone():
    S = Sprite("REPAIR DRONE (round 9): a small hovering drone seen from above: four rotors on short struts (pale blurred "
               "discs with two blades), a round steel shell with a yellow hazard stripe and a green work light on top, a "
               "wrench arm reaching forward on the right (arm-r) and a little welding torch on the left (arm-l); both "
               "lift when it mends. Parts: #arm-l, #arm-r, #body. " + LAYOUT)
    S.group("body")
    for x, y in ((56, 64), (144, 64), (56, 136), (144, 136)):
        S.shape(taper([(100, 100), (x, y)], 10, 8, 0.7), IRON, shadow=0)
        S.shape(circ(x, y, 22), "#DDE3EA", shadow=2, side=False,
                decor=strokes(f"M {x - 18} {y - 6} L {x + 18} {y + 6} M {x - 6} {y + 18} L {x + 6} {y - 18}", "#8A909A", 4, 0.8)
                      + f'<path d="{circ(x, y, 5)}" fill="{DIRON}"/>')
    S.shape(circ(100, 100, 38), STEELC, shadow=3,
            decor=f'<path d="M 62 108 L 138 108 L 138 120 L 62 120 Z" fill="{HAZARD}"/>'
                  + "".join(f'<path d="M {x} 108 L {x + 7} 108 L {x - 3} 120 L {x - 10} 120 Z" fill="#2A2228"/>' for x in range(66, 140, 14))
                  + f'<path d="{ell(86, 82, 13, 8)}" fill="#FFFFFF" opacity="0.4"/>')
    S.shape(circ(100, 90, 9), "#7AD86A", shadow=2, decor=f'<path d="{circ(97, 87, 3.5)}" fill="#E4FFD8"/>')
    S.group("arm-r", (122, 118), "wrench arm")
    S.shape(taper([(120, 120), (128, 144), (124, 162)], 9, 7, 0.7), IRON, shadow=0)
    S.shape("M 116 160 L 132 160 L 136 174 L 130 182 L 128 172 L 120 172 L 118 182 L 112 174 Z", STEELC, shadow=2)
    S.group("arm-l", (78, 118), "welding torch")
    S.shape(taper([(80, 120), (72, 144), (76, 160)], 9, 7, 0.7), IRON, shadow=0)
    S.shape(rr(76, 164, 12, 14, 4), BRASS_C, shadow=2)
    S.shape(circ(76, 174, 4), "#9FE3FF", shadow=0, side=False)
    return save("enemies", "foundry-repair-drone", S)


# ================================================================== foundry smith
SMITH_SKIN = ('<linearGradient id="gFaceSmith" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
              '<stop offset="0" stop-color="#8E5E44"/><stop offset="0.2" stop-color="#A87050"/><stop offset="0.45" stop-color="#C48A62"/>'
              '<stop offset="0.85" stop-color="#C88E66"/><stop offset="1" stop-color="#B07A56"/></linearGradient>'
              '<radialGradient id="gHandSmith" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#8A6A4A"/>'
              '<stop offset="1" stop-color="#5E4630"/></radialGradient>')


def foundry_smith():
    S = Sprite("FOUNDRY SMITH (round 9): a big smith in the heroes' bust build: broad bare shoulders smudged with soot "
               "under the straps of a heavy leather apron, a sooty grey cap on the back of the head, a short black beard on the chin (no eyes); a big "
               "hammer in the right hand, its head glowing red-hot (arm-r, it swings), a thick leather glove on the left "
               "(arm-l). " + LAYOUT)
    S.add_def(SMITH_SKIN + METAL_DEFS)
    S.group("arm-r", (156, 108), "hot hammer")
    T = frame(160, 126, 8)
    S.shape(rr(0, 18, 11, 70, 5), "#7A5236", T=T, shadow=0)
    S.shape(rr(0, 60, 54, 28, 7), "#4A4E58", T=T, shadow=2,
            decor=f'<path d="{rr(0, 60, 54, 28, 7)}" fill="url(#gHot)" transform="translate(0 6) scale(1 0.8)"/>')
    fist(S, 0, 0, T=T, w=26, h=30, hand="url(#gHandSmith)")
    S.group("body")
    S.shape("M12 110 C12 80 48 70 100 70 C152 70 188 80 188 110 C188 138 152 146 100 146 C48 146 12 138 12 110 Z", "#B07A56",
            decor=f'<path d="{ell(56, 116, 20, 9)}" fill="#3A3034" opacity="0.25"/>' + f'<path d="{ell(150, 98, 16, 8)}" fill="#3A3034" opacity="0.2"/>')
    for s in (-1, 1):   # the apron's straps over the shoulders
        S.shape(taper([(100 + s * 46, 74), (100 + s * 58, 110), (100 + s * 52, 144)], 18, 18, 0.8), "#6E4A2E", shadow=2,
                decor=f'<circle cx="{100 + s * 57}" cy="108" r="4" fill="{BRASS_C}"/>')
    head(S, face="url(#gFaceSmith)")
    S.shape(blob([(74, 140), (88, 146), (100, 147), (112, 146), (126, 140), (126, 152), (116, 162), (100, 166), (84, 162), (74, 152)], 0.8),
            "#3A2E2A", shadow=3)
    mouth(S, 141, "#7A4A3A")
    S.shape("M52 92 C51 64 72 46 100 46 C128 46 149 64 148 92 C138 84 120 82 100 84 C80 82 62 84 52 92 Z", "#4E4A52", shadow=3,
            decor=strokes("M 56 86 C 70 78 130 78 144 86", "#3A2C24", 4, 0.6) + f'<path d="{ell(70, 104, 10, 6)}" fill="#3A3034" opacity="0.3"/>')
    S.group("arm-l", (44, 108), "gloved fist")
    fist(S, 40, 146, -6, w=27, h=31, hand="url(#gHandSmith)")
    S.shape(rr(40, 132, 32, 10, 4), "#5E4630", T="rotate(-6 40 132)", shadow=1)
    return save("enemies", "foundry-smith", S)


# ================================================================== bees (copper: the game turns them bronze and steel)
BAND = "#3A3434"
WING = "#DDE4EC"


def plate_wing(S, root, a, L, w):
    d, T = feather9(root, a, L, w)
    S.shape(d, WING, T=T, shadow=0, side=False,
            decor=f'<path d="M 0 {f(L * 0.12)} L 0 {f(L * 0.9)} M {f(-w * 0.5)} {f(L * 0.4)} L {f(w * 0.5)} {f(L * 0.4)}" '
                  f'stroke="#A8B2BE" stroke-width="2.5" opacity="0.8"/>')


def feather9(root, a, L, w):
    T = frame(root[0], root[1], a)
    return blob([(0, -w * 0.4), (w * 0.9, L * 0.25), (w, L * 0.55), (w * 0.45, L * 0.88), (0, L), (-w * 0.5, L * 0.86),
                 (-w * 0.95, L * 0.55), (-w * 0.85, L * 0.22)], 0.8), T


def insect(S, kind):
    """bee, wasp, hornet: wings (arm parts, they flap as it flies), the body (#body)."""
    k = {"bee": 1.0, "wasp": 0.9, "hornet": 1.15}[kind]
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 12, 112), "wings")
        L = {"bee": 56, "wasp": 62, "hornet": 64}[kind]
        plate_wing(S, (100 + s * 12, 112), s * -112, L, 16 * k)
        plate_wing(S, (100 + s * 10, 104), s * -140, L * 0.78, 13 * k)
    S.group("body")
    if kind == "bee":
        S.shape(ell(100, 74, 30, 36), COPPER, shadow=0,
                decor=strokes("M 72 66 Q 100 58 128 66 M 72 84 Q 100 76 128 84", BAND, 9, 1) + f'<path d="{ell(88, 64, 9, 13)}" fill="#FFFFFF" opacity="0.25"/>')
        S.shape(poly([(94, 42), (106, 42), (100, 26)]), DIRON, shadow=0)
        S.shape(circ(100, 112, 22), DCOPPER, shadow=3)
        S.shape(ell(100, 140, 18, 15), COPPER, shadow=3, decor=f'<path d="{ell(94, 135, 6, 4)}" fill="#FFFFFF" opacity="0.3"/>')
    elif kind == "wasp":
        S.shape(blob([(100, 18), (114, 40), (120, 64), (114, 84), (100, 92), (86, 84), (80, 64), (86, 40)], 0.9), COPPER, shadow=0,
                decor=strokes("M 82 52 Q 100 46 118 52 M 80 70 Q 100 64 120 70", BAND, 7, 1) + f'<path d="{ell(92, 56, 6, 12)}" fill="#FFFFFF" opacity="0.25"/>')
        S.shape(poly([(96, 22), (104, 22), (100, 2)]), DIRON, shadow=0)
        S.shape(rr(100, 96, 10, 14, 4), DIRON, shadow=2)
        S.shape(ell(100, 116, 17, 19), DCOPPER, shadow=3)
        S.shape(ell(100, 144, 15, 13), COPPER, shadow=3, decor=f'<path d="{ell(95, 140, 5, 3.5)}" fill="#FFFFFF" opacity="0.3"/>')
    else:   # hornet: bigger, heavier, mandibles
        S.shape(ell(100, 68, 34, 42), COPPER, shadow=0,
                decor=strokes("M 68 56 Q 100 48 132 56 M 68 76 Q 100 68 132 76 M 74 94 Q 100 88 126 94", BAND, 9, 1)
                      + f'<path d="{ell(86, 58, 10, 15)}" fill="#FFFFFF" opacity="0.25"/>')
        S.shape(poly([(93, 30), (107, 30), (100, 10)]), DIRON, shadow=0)
        S.shape(circ(100, 114, 25), DCOPPER, shadow=3)
        for s in (-1, 1):
            S.shape(blob([(100 + s * 6, 156), (100 + s * 16, 158), (100 + s * 16, 172), (100 + s * 8, 178), (100 + s * 8, 168)], 0.8), DIRON, shadow=0)
        S.shape(ell(100, 146, 21, 17), COPPER, shadow=3, decor=f'<path d="{ell(93, 141, 7, 4.5)}" fill="#FFFFFF" opacity="0.3"/>')


def bee():
    S = Sprite("BEE (round 9): a small mechanical bee seen from above, in copper: a round striped abdomen with dark iron "
               "bands and a short stinger at the back, a thorax, a round head; two pairs of wings of thin pale plate "
               "with a rib down each (arm-l, arm-r: they flap). The bronze and steel bees are this art turned by the "
               "game. No eyes. " + LAYOUT)
    insect(S, "bee")
    return save("enemies", "foundry-bee", S)


def wasp():
    S = Sprite("WASP (round 9): a thinner mechanical wasp seen from above, in copper: a long pointed striped abdomen with a "
               "long iron stinger, a thin waist, a thorax, a round head; long narrow plate wings (arm-l, arm-r: they "
               "flap). The bronze and steel wasps are this art turned by the game. No eyes. " + LAYOUT)
    insect(S, "wasp")
    return save("enemies", "foundry-wasp", S)


def hornet():
    S = Sprite("HORNET (round 9): a big heavy mechanical hornet seen from above, in copper: a fat abdomen with three iron "
               "bands and a stinger, a big thorax, a broad head with two iron mandibles; broad plate wings (arm-l, "
               "arm-r: they flap). The bronze and steel hornets are this art turned by the game. No eyes. " + LAYOUT)
    insect(S, "hornet")
    return save("enemies", "foundry-hornet", S)


# ================================================================== saw blade
def saw_blade():
    S = Sprite("SAW BLADE (round 9): a circular saw blade seen from above: a steel disc with a ring of small sharp hooked "
               "teeth, a darker groove inside them, three slots and a brass hub with bolts. It spins as it runs along a "
               "wall. Parts: #body only. " + LAYOUT)
    S.group("body")
    pts = []
    n = 22
    for i in range(n):
        a0 = i * 360 / n
        for a, r in ((a0, 60), (a0 + 360 / n * 0.62, 74), (a0 + 360 / n * 0.72, 66)):
            pts.append((100 + r * math.sin(math.radians(a)), 100 - r * math.cos(math.radians(a))))
    slots = "".join(f'<path d="{rr(100, 64, 8, 22, 4)}" transform="rotate({a} 100 100)" fill="{DIRON}"/>' for a in (0, 120, 240))
    S.shape(poly(pts), "#D4DAE2", shadow=0,
            decor=f'<path d="{circ(100, 100, 52)}" fill="none" stroke="{IRON}" stroke-width="4" opacity="0.6"/>' + slots
                  + f'<path d="{ell(78, 72, 16, 8)}" fill="#FFFFFF" opacity="0.45"/>')
    S.shape(circ(100, 100, 16), BRASS_C, shadow=3, decor=rivets(ring_pts(100, 100, 8, 3), 2.5, "#8A6A2A"))
    return save("enemies", "foundry-saw-blade", S)


# ================================================================== chain crawler: head and a plate
CRAWL, DCRAWL = "#8A929E", "#5A606A"


def crawler_head():
    S = Sprite("CHAIN CRAWLER, head (round 9): a mechanical centipede's head seen from above: a broad riveted steel head "
               "plate with a ridge and a dark vent at the front (no eyes), two short iron feelers, the first pair of legs; "
               "two big curved iron mandibles at the front (arm-l, arm-r: they snap forward when it bites). Its plates "
               "are foundry-crawler-plate. " + LAYOUT)
    S.group("body")
    for s in (-1, 1):
        S.shape(taper([(100 + s * 40, 100), (100 + s * 66, 92), (100 + s * 76, 112)], 9, 6, 0.7), DCRAWL, shadow=0)
        S.shape(taper([(100 + s * 18, 146), (100 + s * 28, 170), (100 + s * 40, 184)], 5, 3, 0.7), DIRON, shadow=0)
    S.shape(blob([(100, 52), (134, 60), (150, 88), (148, 120), (132, 144), (100, 152), (68, 144), (52, 120), (50, 88), (66, 60)], 0.9),
            CRAWL, shadow=0,
            decor=strokes("M 100 58 L 100 132", DCRAWL, 5, 0.7) + strokes("M 62 96 Q 100 84 138 96", DCRAWL, 4, 0.5)
                  + f'<path d="{ell(84, 74, 14, 8)}" fill="#FFFFFF" opacity="0.3"/>')
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 26, 138), "mandible")
        S.shape(blob([(100 + s * 22, 134), (100 + s * 40, 146), (100 + s * 40, 170), (100 + s * 24, 188), (100 + s * 6, 192),
                      (100 + s * 22, 176), (100 + s * 26, 156)], 0.75), DIRON, shadow=2)
    return save("enemies", "foundry-crawler-head", S)


def crawler_plate():
    S = Sprite("CHAIN CRAWLER, plate (round 9): one plated segment of the chain crawler seen from above (the chain of them "
               "follows its head, each its own hit circle): a rounded steel plate with a raised ridge across it and "
               "rivets, two little jointed legs out each side. Front = towards the head. Parts: #body only. " + LAYOUT)
    S.group("body")
    for s in (-1, 1):
        for y in (86, 114):
            S.shape(taper([(100 + s * 46, y), (100 + s * 68, y - 8), (100 + s * 76, y + 12)], 9, 6, 0.7), DCRAWL, shadow=0)
    S.shape(rr(100, 100, 108, 74, 30), CRAWL, shadow=0,
            decor=f'<path d="{rr(100, 104, 108, 22, 10)}" fill="{DCRAWL}" opacity="0.55"/>' + rivets([(60, 86), (140, 86), (60, 116), (140, 116)], 3.4)
                  + f'<path d="{ell(80, 80, 16, 7)}" fill="#FFFFFF" opacity="0.3"/>')
    return save("enemies", "foundry-crawler-plate", S)


# ================================================================== drill bot
def drill_bot():
    S = Sprite("DRILL BOT (round 9): a squat burrowing bot seen from above: a round steel body with a hazard stripe, a "
               "dark track down each side, and a big conical drill bit forward with spiral grooves (arm-r: it drives "
               "forward when it strikes). No eyes. Parts: #body, #arm-r (the drill). " + LAYOUT)
    S.group("body")
    for s in (-1, 1):
        S.shape(rr(100 + s * 46, 98, 26, 96, 12), "#3A3C42", shadow=0,
                decor=strokes(" ".join(f"M {100 + s * 46 - 11} {y} L {100 + s * 46 + 11} {y}" for y in range(58, 142, 10)), "#5E6068", 3, 0.9))
    S.shape(circ(100, 98, 42), "#C88A3A", shadow=3,
            decor=f'<path d="M 58 76 L 142 76 L 142 88 L 58 88 Z" fill="{HAZARD}"/>'
                  + "".join(f'<path d="M {x} 76 L {x + 7} 76 L {x - 3} 88 L {x - 10} 88 Z" fill="#2A2228"/>' for x in range(62, 144, 14))
                  + f'<path d="{ell(84, 104, 12, 7)}" fill="#FFFFFF" opacity="0.3"/>')
    S.group("arm-r", (100, 100), "the drill")
    S.shape(rr(100, 140, 40, 14, 6), DIRON, shadow=0)
    S.shape(poly([(80, 146), (120, 146), (100, 198)]), STEELC, shadow=2,
            decor=strokes("M 84 154 L 114 160 M 88 166 L 110 172 M 92 178 L 106 184", "#7E8696", 4, 0.9))
    return save("enemies", "foundry-drill-bot", S)


def storm_spirit():
    return save("enemies", "foundry-storm-spirit", spirit9("shock", "Storm Spirit", "lightning: a pale yellow core with a white bolt in it, a gold tail."))


BUILD = {"foundry-gear-sprite": gear_sprite, "foundry-cog-sprite": cog_sprite, "foundry-bomb-bot": bomb_bot,
         "foundry-automaton": automaton, "foundry-turret-steam": turret_steam, "foundry-turret-flame": turret_flame,
         "foundry-turret-gun": turret_gun, "foundry-turret-laser": turret_laser, "foundry-mortar": mortar,
         "foundry-tesla-coil": tesla_coil, "foundry-repair-drone": repair_drone, "foundry-smith": foundry_smith,
         "foundry-bee": bee, "foundry-wasp": wasp, "foundry-hornet": hornet, "foundry-saw-blade": saw_blade,
         "foundry-crawler-head": crawler_head, "foundry-crawler-plate": crawler_plate, "foundry-drill-bot": drill_bot,
         "foundry-storm-spirit": storm_spirit}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
