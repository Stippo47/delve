"""Round 11: the sets the art-round10 and art-round10b notes ask for where the note is open ("3 variants", "Try 4 more",
"Meh", "Nope", "Try again"). Variants of a design the designer liked are that design's copied generator with one hook
filled (its visor, its key, its eye, its face...), so nothing else on it moves; redraws are new code in the heroes' A2
library. The game keeps its current art for every one of these until a pick (notes.md).
python new11.py [name ...]   -> ../../enemies/<name>.svg, ../../props/<name>.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import common
from common import *
import foundry9 as F9
import foundry10 as F10
import foundry10b as FB
import second10 as S2
import bosses10 as B10
import spire9 as SP9
import spire10 as SP
import grove8 as G8
from beasts9 import taper, flame, FLAME_DEF
from foundry9 import IRON, DIRON, STEELC, COPPER, DCOPPER, BRASS_C, HAZARD, cog_path, rivets, ring_pts, floor_base
from foundry10b import DARK, COAL, AMBER, REDP, hi, slit

BUILD = {}


def hooked(mod, hooks, fn, name):
    """fn() with the module's hooks set (then cleared), saved as `name`."""
    def run():
        old = {k: getattr(mod, k) for k in hooks}
        for k, v in hooks.items():
            setattr(mod, k, v)
        common.SAVE_AS = name
        try:
            return fn()
        finally:
            common.SAVE_AS = None
            for k, v in old.items():
                setattr(mod, k, v)
    return run


# ================================================================== the automaton: three visors, three keys
# "Good except visor. 3 variants. I also don't like the look of the key on the back. Make 3 for that too"
def visor(v):
    """The machines' visor, three ways (decor on the head plate; kind = "automaton" or "crawler" gives its place)."""
    def draw(kind):
        cy, w = (116, 74) if kind == "automaton" else (126, 66)
        if v == "grille":    # a knight's visor: a dark band with five upright breathing slots lit amber
            bars = "".join(f'<path d="{rr(100 + dx, cy, 6.5, 13, 3)}" fill="{AMBER}"/>' for dx in (-24, -12, 0, 12, 24))
            return f'<path d="{rr(100, cy, w, 21, 7)}" fill="#22202A"/>' + bars
        if v == "lens":      # one round glass eye in a brass ring, a glint on it
            return (f'<path d="{circ(100, cy, 17)}" fill="{BRASS_C}"/><path d="{circ(100, cy, 12.5)}" fill="#22202A"/>'
                    f'<path d="{circ(100, cy, 9)}" fill="{AMBER}"/><circle cx="96.5" cy="{cy - 3.5}" r="3" fill="#FFF6D8"/>')
        # "vee": two slanted slits meeting in a point: a scowl
        d = (f"M {100 - w / 2 + 4} {cy - 9} L 100 {cy + 2} L {100 + w / 2 - 4} {cy - 9} L {100 + w / 2 - 4} {cy + 1} L 100 {cy + 12} "
             f"L {100 - w / 2 + 4} {cy + 1} Z")
        d2 = (f"M {100 - w / 2 + 10} {cy - 3.5} L 100 {cy + 6.5} L {100 + w / 2 - 10} {cy - 3.5} L {100 + w / 2 - 10} {cy - 0.5} L 100 {cy + 9.5} "
              f"L {100 - w / 2 + 10} {cy - 0.5} Z")
        return f'<path d="{d}" fill="#22202A" stroke="#22202A" stroke-width="3" stroke-linejoin="round"/><path d="{d2}" fill="{AMBER}"/>'
    return draw


def key11(v):
    """The wind-up key, three ways (seen from above, standing out of the back: a shaft and its handle)."""
    def draw(S, cx, y, k=1.0):
        S.shape(rr(cx, y + 18 * k, 9 * k, 34 * k, 4), BRASS_C, shadow=0)
        if v == "ring":      # an old key's ring: one hollow round bow
            S.shape(circ(cx, y, 17 * k) + " " + circ(cx, y, 8.5 * k), BRASS_C, shadow=0, rule="evenodd",
                    decor=f'<path d="{ell(cx - 8 * k, y - 9 * k, 6 * k, 3 * k)}" fill="#FFFFFF" opacity="0.4"/>')
        elif v == "bar":     # a plain T: a bar with a ball at each end
            S.shape(rr(cx, y, 52 * k, 9 * k, 4.5 * k), BRASS_C, shadow=0)
            for s in (-1, 1):
                S.shape(circ(cx + s * 26 * k, y, 8.5 * k), BRASS_C, shadow=0,
                        decor=f'<circle cx="{f(cx + s * 26 * k - 2.5 * k)}" cy="{f(y - 2.5 * k)}" r="{f(2.6 * k)}" fill="#FFFFFF" opacity="0.5"/>')
        else:                # "clover": three round hollow lobes, a clock key
            d = " ".join(circ(cx + dx * k, y + dy * k, 11 * k) for dx, dy in ((-15, 2), (15, 2), (0, -13)))
            holes = "".join(f'<circle cx="{f(cx + dx * k)}" cy="{f(y + dy * k)}" r="{f(4.6 * k)}" fill="#6E5220"/>' for dx, dy in ((-15, 2), (15, 2), (0, -13)))
            S.shape(d, BRASS_C, shadow=0, decor=holes)
    return draw


for _v in ("grille", "lens", "vee"):
    BUILD[f"foundry-automaton-visor-{_v}"] = hooked(FB, dict(VISOR_FN=visor(_v)), FB.automaton, f"foundry-automaton-visor-{_v}")
    # the chain crawler, "Different visor.": the same three on its head
    BUILD[f"foundry-crawler-head-visor-{_v}"] = hooked(FB, dict(VISOR_FN=visor(_v)), FB.crawler_head, f"foundry-crawler-head-visor-{_v}")
for _v in ("ring", "bar", "clover"):
    BUILD[f"foundry-automaton-key-{_v}"] = hooked(FB, dict(KEY_FN=key11(_v)), FB.automaton, f"foundry-automaton-key-{_v}")


# ================================================================== the repair drone: three fronts
# "3 variants for what's on its front. Its propellers and body looks good. Eye?"
def drone_front(v):
    def draw(S, where):
        if where == "tools":
            if v == "eye":        # nothing held: the eye is the whole front
                return
            if v == "claws":      # two small grabbers
                for g, s in (("arm-l", -1), ("arm-r", 1)):
                    S.group(g, (100 + s * 22, 128), "grabber")
                    T = frame(100 + s * 24, 132, -s * 14)
                    S.shape(rr(0, 10, 8, 26, 4), "#8A909C", T=T, shadow=0)
                    S.shape(blob([(-9, 22), (-3, 20), (-4, 30), (0, 40), (-7, 38), (-11, 30)], 0.7) + " "
                            + blob([(9, 22), (3, 20), (4, 30), (0, 40), (7, 38), (11, 30)], 0.7), STEELC, T=T, shadow=1)
                return
            # "torch": one welding arm under the eye, on the left
            S.group("arm-l", (78, 128), "welding torch")
            T = frame(76, 132, 14)
            S.shape(rr(0, 14, 8, 34, 4), "#8A909C", T=T, shadow=0)
            S.shape(rr(0, 32, 14, 12, 4), BRASS_C, T=T, shadow=1)
            S.shape(blob([(-5, 38), (5, 38), (3, 48), (0, 56), (-3, 48)], 0.8), "#8AD8FF", T=T, shadow=0, side=False)
            return
        # the eye, on the front of the shell: a brass ring, a dark glass, a blue iris, a glint
        cy, r = (140, 15) if v == "eye" else (139, 12)
        S.shape(circ(100, cy, r), BRASS_C, shadow=3,
                decor=f'<path d="{circ(100, cy, r - 4)}" fill="#22303E"/><path d="{circ(100, cy + 1, r - 7.5)}" fill="#5AC8F0"/>'
                      f'<circle cx="{100 - r * 0.3}" cy="{cy - r * 0.3}" r="{f(r * 0.2)}" fill="#FFFFFF"/>')
    return draw


for _v in ("eye", "claws", "torch"):
    BUILD[f"foundry-repair-drone-{_v}"] = hooked(FB, dict(FRONT_FN=drone_front(_v)), FB.repair_drone, f"foundry-repair-drone-{_v}")


# ================================================================== the steam turret: three barrels
# "Meh Don't like gun barrel"
def steam_barrel(v):
    def draw(S):
        if v == "pipe":       # one long straight pipe with two collars and a plain open end
            S.shape(rr(100, 162, 20, 70, 7), DCOPPER, shadow=0, decor=f'<rect x="93" y="120" width="4" height="80" fill="#FFFFFF" opacity="0.2"/>')
            for y in (152, 176):
                S.shape(rr(100, y, 28, 8, 3.5), BRASS_C, shadow=1)
            S.shape(rr(100, 194, 26, 9, 4), BRASS_C, shadow=2, decor=f'<path d="{ell(100, 196, 8, 3)}" fill="#3A2A1E"/>')
        elif v == "twin":     # two short pipes side by side from a brass manifold
            S.shape(rr(100, 150, 50, 16, 6), BRASS_C, shadow=0, decor=rivets([(82, 150), (118, 150)], 2.6, "#8A6A2A"))
            for s in (-1, 1):
                S.shape(rr(100 + s * 14, 172, 16, 40, 6), DCOPPER, shadow=2)
                S.shape(rr(100 + s * 14, 190, 21, 8, 3.5), BRASS_C, shadow=1, decor=f'<path d="{ell(100 + s * 14, 192, 6, 2.6)}" fill="#3A2A1E"/>')
        else:                 # "kettle": a short curved spout like a kettle's, a whistle cap on its end
            S.shape(blob([(86, 146), (114, 146), (112, 166), (108, 184), (92, 184), (88, 166)], 0.7), COPPER, shadow=0,
                    decor=f'<path d="M 90 150 L 94 150 L 96 182 L 93 182 Z" fill="#FFFFFF" opacity="0.25"/>')
            S.shape(rr(100, 150, 34, 9, 4), BRASS_C, shadow=1)
            S.shape(blob([(88, 182), (112, 182), (110, 194), (100, 198), (90, 194)], 0.8), BRASS_C, shadow=2,
                    decor=f'<path d="{circ(100, 189, 3.6)}" fill="#3A2A1E"/>')
    return draw


for _v in ("pipe", "twin", "kettle"):
    BUILD[f"foundry-turret-steam-{_v}"] = hooked(F10, dict(BARREL_FN=steam_barrel(_v)), F10.turret_steam, f"foundry-turret-steam-{_v}")


# ================================================================== the bee, from the wasp; and a hive
# The wasp: "This might be a good base for the basic bee. Maybe a bit fatter. Also make wings render ontop. Maybe add 1
# red eye on the head. Also make a hive sprite". The bee: "Too simple now. Middle ground. They should also show like cogs
# or something on them".
def bee11(v):
    """The wasp's build (a head and one abdomen), a bit fatter and shorter, its wings drawn after the body (on top), one
    red eye on the head, and clockwork showing: v = "collar" a brass cog for a collar between head and abdomen; "back" a
    cog set into the top of the abdomen, turning; "hubs" a small cog at each wing's root."""
    what = {"collar": "a brass cog worn as a collar between head and abdomen", "back": "a brass cog set into the top of its abdomen",
            "hubs": "a small brass cog at the root of each wing"}[v]
    S = Sprite(f"BEE (round 11, cogs \"{v}\"): the basic mechanical bee, built from the wasp (the designer: \"a good base for "
               f"the basic bee. Maybe a bit fatter\"): a round copper head with one red glass eye and two feelers, one plump "
               f"striped abdomen with a short iron stinger, {what}; one wing of thin pale plate a side, drawn over the body "
               "(arm-l, arm-r, after #body: they flap). Parts: #body, #arm-l / #arm-r (wings, on top). " + LAYOUT)
    S.group("body")
    S.shape(poly([(93, 40), (107, 40), (100, 16)]), DIRON, shadow=0)                      # the stinger
    ab = blob([(100, 30), (122, 44), (134, 72), (130, 102), (100, 122), (70, 102), (66, 72), (78, 44)], 0.9)
    S.shape(ab, COPPER, shadow=0, decor=F10.stripes((56, 80), 60, 140, 9, 11) + f'<path d="{ell(86, 58, 9, 15)}" fill="#FFFFFF" opacity="0.28"/>')
    if v == "back":
        S.shape(cog_path(100, 96, 17, 12.5, 8, tip=0.46), BRASS_C, shadow=2, decor=f'<path d="{circ(100, 96, 6)}" fill="#8A6A2A"/>')
    for s in (-1, 1):
        S.shape(band([(100 + s * 10, 158), (100 + s * 16, 174), (100 + s * 26, 182)], 3.2), DIRON, shadow=0)
    if v == "collar":
        S.shape(cog_path(100, 122, 27, 21, 10, tip=0.46), BRASS_C, shadow=3)
    S.shape(circ(100, 140, 25), DCOPPER, shadow=4, decor=f'<path d="{ell(90, 130, 8, 5)}" fill="#FFFFFF" opacity="0.25"/>')
    S.shape(circ(100, 150, 8.5), "#2A2428", shadow=0, side=False,
            decor='<circle cx="100" cy="150" r="6" fill="#E8403A"/><circle cx="98" cy="148" r="2.2" fill="#FFD0C8"/>')   # the one red eye
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 14, 110), "wing, over the body")
        F10.wing(S, s, (14, 110), -124, 74, 19)
        if v == "hubs":
            S.shape(cog_path(100 + s * 15, 109, 11, 8, 8, tip=0.46), BRASS_C, shadow=2, decor=f'<circle cx="{100 + s * 15}" cy="109" r="3.4" fill="#8A6A2A"/>')
    return save("enemies", f"foundry-bee-{v}", S)


def hive(v):
    """A hive for the Foundry's bees, a thing that stands in a room (no facing): "dome" a riveted copper skep in three
    rings with a round door; "drum" a brass drum with six honeycomb ports round a big cog lid; "comb" seven hexagonal
    cells of iron, some lit amber."""
    if v == "dome":
        S = Sprite("HIVE (round 11, \"dome\"): a mechanical beehive seen from above: a copper skep in three riveted rings "
                   "narrowing to a brass cap, a dark round door at its front with a brass sill, a short stack at the back. "
                   "Parts: #body only. " + LAYOUT)
        S.group("body")
        S.shape(rr(100, 34, 18, 22, 5), DIRON, shadow=0)
        for r, c in ((78, shade(COPPER, 0.88)), (60, COPPER), (40, light(COPPER, 1.08))):
            S.shape(circ(100, 104, r), c, shadow=4 if r < 78 else 0,
                    decor=rivets(ring_pts(100, 104, r - 7, 12, 15), 2.6, "#7A4A22") + (hi(74, 64, 22, 9, 0.2, -30) if r == 78 else ""))
        S.shape(circ(100, 104, 17), BRASS_C, shadow=3, decor=hi(94, 98, 6, 3, 0.5))
        S.shape(rr(100, 176, 40, 16, 7), BRASS_C, shadow=2)
        S.shape(circ(100, 166, 15), "#2A2226", shadow=0, side=False, decor=f'<path d="{ell(100, 170, 9, 6)}" fill="{AMBER}" opacity="0.55"/>')
    elif v == "drum":
        S = Sprite("HIVE (round 11, \"drum\"): a mechanical beehive seen from above: a round brass drum with six dark "
                   "honeycomb ports round its rim, lit amber inside, and a big copper cog for a lid, a red jewel at its "
                   "heart. Parts: #body only. " + LAYOUT)
        S.group("body")
        ports = ""
        for a in range(0, 360, 60):
            x, y = 100 + 58 * math.sin(math.radians(a)), 104 - 58 * math.cos(math.radians(a))
            hx = poly([(x + 14 * math.sin(math.radians(a + b)), y - 14 * math.cos(math.radians(a + b))) for b in range(0, 360, 60)])
            hx2 = poly([(x + 8 * math.sin(math.radians(a + b)), y - 8 * math.cos(math.radians(a + b))) for b in range(0, 360, 60)])
            ports += f'<path d="{hx}" fill="#2A2226"/><path d="{hx2}" fill="{AMBER}" opacity="0.75"/>'
        S.shape(circ(100, 104, 80), BRASS_C, shadow=0, decor=ports + hi(70, 54, 22, 8, 0.25, -30))
        S.shape(cog_path(100, 104, 42, 33, 10, tip=0.46), COPPER, shadow=4, decor=f'<path d="{circ(100, 104, 20)}" fill="{DCOPPER}"/>' + hi(88, 88, 10, 5, 0.3))
        S.shape(circ(100, 104, 9), "#E8403A", shadow=2, decor='<circle cx="97" cy="101" r="3" fill="#FFD0C8"/>')
    else:
        S = Sprite("HIVE (round 11, \"comb\"): a mechanical beehive seen from above: seven hexagonal iron cells in a "
                   "honeycomb, each rimmed in brass, three of them lit amber from inside, the others capped with a copper "
                   "lid. Parts: #body only. " + LAYOUT)
        S.group("body")
        R = 31
        cells = [(0, 0)] + [(R * 1.76 * math.sin(math.radians(a)), -R * 1.76 * math.cos(math.radians(a))) for a in range(30, 390, 60)]
        hexd = lambda cx, cy, r: poly([(cx + r * math.sin(math.radians(b)), cy - r * math.cos(math.radians(b))) for b in range(0, 360, 60)])
        S.shape(" ".join(hexd(100 + x, 104 + y, R + 2) for x, y in cells), DIRON, shadow=0)
        for i, (x, y) in enumerate(cells):
            lit = i in (0, 2, 5)
            S.shape(hexd(100 + x, 104 + y, R - 4), BRASS_C, shadow=2,
                    decor=f'<path d="{hexd(100 + x, 104 + y, R - 10)}" fill="{"#2A2226" if lit else COPPER}"/>'
                          + (f'<path d="{hexd(100 + x, 106 + y, R - 17)}" fill="{AMBER}" opacity="0.85"/>' if lit else hi(100 + x - 5, 104 + y - 6, 7, 3.5, 0.3)))
    return save("props", f"foundry-hive-{v}", S)


for _v in ("collar", "back", "hubs"):
    BUILD[f"foundry-bee-{_v}"] = (lambda v=_v: bee11(v))
for _v in ("dome", "drum", "comb"):
    BUILD[f"foundry-hive-{_v}"] = (lambda v=_v: hive(v))


# ================================================================== the mortar, again
# "Nope. Should be a cannon aiming straight up with a circle hole in the top. Slightly offset from the middle, skewed to 1
# side. Will rotate this cannon to targets. What u made is more of a cannon and I don't like it regardless."
def mortar11(v):
    """A mortar seen from straight above: a barrel aiming straight up, so what shows is its round muzzle with a round
    hole, set a little off the middle of the turning plate towards its front (the side it lobs to; the game turns it to
    its target). "ring" the bare tube: a thick iron muzzle ring, a brass band, the breech's foot behind; "trunnion" the
    tube in a brass cradle with two trunnion blocks and a sight notch at the front; "pot" a squat wide pot of a mortar,
    a heavy lip with four bolts, two carrying handles. The base and its spare shells are round 10's."""
    what = {"ring": "a thick iron muzzle ring round a round black bore, a brass band round the tube, its foot showing behind",
            "trunnion": "the tube held in a brass cradle between two trunnion blocks, a sight notch on the front of its muzzle ring",
            "pot": "a squat wide pot of a mortar: a heavy bolted lip round a wide round bore, a carrying handle at each side"}[v]
    S = Sprite(f"MORTAR (round 11, \"{v}\"): a floor mortar seen from straight above, its barrel aiming straight up: {what}. "
               "The muzzle sits a little forward of the middle of the plate it turns on, so the turn shows. The riveted base "
               "plate stays still with two spare shells on it (#back); the fire and gas mortars are this art with the brass "
               "turned red and green by the game. Parts: #back (the base and shells), #body. " + LAYOUT)
    floor_base(S)
    for x, y, a in ((46, 62, -18), (62, 50, -18)):
        T = frame(x, y, a)
        S.shape(rr(0, 0, 14, 30, 6), "#8A909C", T=T, shadow=2)
        S.shape(blob([(-7, 10), (7, 10), (5, 20), (0, 25), (-5, 20)], 0.8), BRASS_C, T=T, shadow=0)
    S.group("body")
    cy = 112   # the muzzle's centre: 12 units forward of the plate's
    S.shape(circ(100, 100, 50), DARK, shadow=3, decor=rivets(ring_pts(100, 100, 43, 8, 22.5), 3, "#9AA0AA") + hi(76, 70, 16, 7, 0.14, -30))
    bore = lambda r: (f'<path d="{circ(100, cy, r)}" fill="#17151A"/>'
                      f'<path d="M {100 - r} {cy} A {r} {r} 0 0 1 {100 + r} {cy} A {r} {f(r * 0.72)} 0 0 0 {100 - r} {cy} Z" fill="#000000" opacity="0.55"/>')
    if v == "ring":
        S.shape(rr(100, 76, 30, 26, 8), "#3E424A", shadow=2)                                      # the breech's foot, behind
        S.shape(circ(100, cy, 38), BRASS_C, shadow=4)
        S.shape(circ(100, cy, 32), "#7A808C", shadow=0, decor=bore(19) + f'<path d="M 74 100 A 30 30 0 0 1 96 83" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.4"/>')
    elif v == "trunnion":
        S.shape(rr(100, cy, 104, 22, 8), BRASS_C, shadow=3, decor=rivets([(56, cy), (144, cy)], 4, "#8A6A2A"))
        for s in (-1, 1):
            S.shape(rr(100 + s * 44, cy, 16, 34, 6), "#3E424A", shadow=2)
        S.shape(circ(100, cy, 34), "#7A808C", shadow=4, decor=bore(20) + f'<path d="M 76 98 A 30 30 0 0 1 98 83" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.4"/>')
        S.shape(poly([(94, cy + 30), (106, cy + 30), (100, cy + 42)]), BRASS_C, shadow=1)             # the sight, at the front
    else:
        for s in (-1, 1):
            S.shape(circ(100 + s * 44, cy, 13) + " " + circ(100 + s * 44, cy, 6), BRASS_C, shadow=2, rule="evenodd")
        S.shape(circ(100, cy, 42), "#6E747E", shadow=4, decor=bore(27) + rivets(ring_pts(100, cy, 35, 4, 45), 3.4, "#C9CED6")
                + f'<path d="M 68 96 A 38 38 0 0 1 96 76" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.35"/>')
        S.shape(circ(100, cy, 30) + " " + circ(100, cy, 26), BRASS_C, shadow=0, rule="evenodd")
    return save("enemies", f"foundry-mortar-{v}", S)


for _v in ("ring", "trunnion", "pot"):
    BUILD[f"foundry-mortar-{_v}"] = (lambda v=_v: mortar11(v))


# ================================================================== the tesla coil, cheated up
# "The Tesla cannon I will allow to be slightly cheated up so you can see it better."
def tesla11():
    S = Sprite("TESLA COIL (round 11: \"slightly cheated up so you can see it better\"): round 10's coil on its square base "
               "with the four insulators, no longer seen from dead above: the coil stands up and is tipped a little towards "
               "the back, so its side shows: a dark footing, four copper windings stepping up and back, the fat ribbed copper "
               "ring on top with the blue-white spark at its heart; two arcs jump from the ring to the front insulators. "
               "Parts: #body only. " + LAYOUT)
    S.group("body")
    S.shape(rr(100, 104, 124, 124, 22), DIRON, shadow=0, decor=hi(70, 56, 22, 7, 0.08))
    for x, y in ((54, 58), (146, 58), (54, 150), (146, 150)):
        S.shape(circ(x, y, 14), "#DCE6F0", shadow=3, decor=f'<circle cx="{x}" cy="{y}" r="8" fill="none" stroke="#9AAEC4" stroke-width="3"/>'
                + f'<circle cx="{x}" cy="{y}" r="3.5" fill="#6E747E"/>')
    S.shape(ell(100, 128, 34, 24), COAL, shadow=3)                                                # the footing
    for i, (y, rx) in enumerate(((122, 27), (112, 27), (102, 27), (92, 27))):                     # the windings, stepping up and back
        S.shape(ell(100, y, rx, 15), shade(COPPER, 0.8 + 0.05 * i), shadow=3,
                decor=f'<path d="M {100 - rx + 6} {y - 4} Q 100 {y - 16} {100 + rx - 6} {y - 4}" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.25"/>')
    top = 70
    S.shape(ell(100, top, 46, 34), COPPER, shadow=5,
            decor=f'<path d="M 62 {top - 12} A 40 28 0 0 1 94 {top - 28}" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity="0.4"/>'
                  + "".join(f'<path d="M {f(100 + 27 * math.cos(math.radians(a)))} {f(top + 20 * math.sin(math.radians(a)))} L '
                            f'{f(100 + 45 * math.cos(math.radians(a)))} {f(top + 33 * math.sin(math.radians(a)))}" stroke="{DCOPPER}" stroke-width="3" opacity="0.55"/>'
                            for a in range(15, 360, 30))
                  + f'<path d="{ell(100, top, 25, 18)}" fill="{COAL}"/>'
                  + f'<ellipse cx="100" cy="{top}" rx="20" ry="14" fill="#6ED0FF" opacity="0.35"/><ellipse cx="100" cy="{top}" rx="12" ry="9" fill="#BFF2FF"/>'
                  + f'<path d="{poly(star(100, top, 15, 4.5, 4, 0))}" fill="#FFFFFF"/>')
    S.raw('<path d="M 132 92 L 142 100 L 136 110 L 146 118 L 140 130 L 146 138 M 68 92 L 58 100 L 64 110 L 54 118 L 60 130 L 54 138" fill="none" '
          'stroke="#DFF8FF" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>')
    return save("enemies", "foundry-tesla-coil", S)


BUILD["foundry-tesla-coil"] = tesla11


# ================================================================== the dart trap: three "eyes"
# "Different eye style. Variants"
def trap_eye(v):
    def draw(S):
        if v == "horus":     # a carved eye: a lapis almond with a gold iris, a kohl line and the falcon's tear under it
            S.shape(blob([(72, 98), (86, 88), (100, 85), (114, 88), (128, 98), (114, 107), (100, 110), (86, 107)], 0.8), "#2E5A9A", shadow=2,
                    decor=f'<path d="{circ(100, 98, 9.5)}" fill="{GOLD}"/><circle cx="100" cy="98" r="4.5" fill="#2A2228"/>')
            S.raw('<path d="M 128 98 L 140 94 M 100 110 L 100 120 Q 100 126 108 124 M 90 109 L 84 120" fill="none" stroke="#2A4A80" '
                  'stroke-width="4" stroke-linecap="round"/>')
        elif v == "gem":     # one round red stone in a gold lotus of five petals
            for a in (-70, -35, 0, 35, 70):
                T = f"rotate({a} 100 100)"
                S.shape(blob([(94, 96), (100, 74), (106, 96)], 0.7), GOLD, T=T, shadow=0)
            S.shape(circ(100, 100, 13), GOLD, shadow=2)
            S.shape(circ(100, 100, 9), "#D83A3A", shadow=0, decor='<circle cx="97" cy="97" r="3" fill="#FFD0C8"/>')
        else:                # "scarab": a turquoise scarab, its wing cases parted by one line, gold legs
            S.raw(strokes("M 86 92 L 74 86 M 86 102 L 72 104 M 114 92 L 126 86 M 114 102 L 128 104", "#C9952A", 3.6, 1))
            S.shape(ell(100, 99, 15, 18), TURQ, shadow=2, decor=strokes("M 100 88 L 100 117 M 86 92 Q 100 98 114 92", "#1E7A70", 2.6, 0.8)
                    + hi(94, 92, 5, 3, 0.5))
            S.shape(ell(100, 82, 9, 6), GOLD, shadow=1)
    return draw


TURQ = S2.TURQ if hasattr(S2, "TURQ") else "#3FB8A8"
for _v in ("horus", "gem", "scarab"):
    BUILD[f"dunes-dart-trap-{_v}"] = hooked(S2, dict(EYE_FN=trap_eye(_v)), S2.dart_trap, f"dunes-dart-trap-{_v}")


# ================================================================== the Pit Lord: three faces, three tails
# "Face variants. Also tail"
def pit_face(v):
    def draw(S, OBS, LAVA, BONE):
        if v == "eyes":       # two burning slits for eyes, a row of fangs under them
            for s in (-1, 1):
                S.shape(blob([(100 + s * 12, 112), (100 + s * 34, 102), (100 + s * 38, 110), (100 + s * 14, 119)], 0.6), fill="#FFB23A", shadow=0, side=False,
                        decor=f'<path d="{blob([(100 + s * 16, 113), (100 + s * 32, 106), (100 + s * 34, 110), (100 + s * 17, 116.5)], 0.6)}" fill="#FFF2A0"/>')
            S.shape(poly([(78, 132), (122, 132), (116, 143), (110, 134), (105, 145), (100, 134), (95, 145), (90, 134), (84, 143)]), BONE, shadow=0, side=False)
        elif v == "skull":    # a bone mask over the face: two hollow sockets with an ember deep in each, a nose slit, teeth
            S.shape(blob([(62, 104), (76, 96), (100, 100), (124, 96), (138, 104), (136, 126), (122, 144), (100, 150), (78, 144), (64, 126)], 0.8), BONE, shadow=3,
                    decor="".join(f'<path d="{ell(100 + s * 19, 116, 10.5, 9)}" fill="#2A2028"/><circle cx="{100 + s * 19}" cy="117" r="4" fill="{LAVA}"/>' for s in (-1, 1))
                          + '<path d="M 100 124 L 96 133 L 104 133 Z" fill="#2A2028"/>'
                          + strokes("M 86 140 L 86 148 M 93 142 L 93 150 M 100 143 L 100 151 M 107 142 L 107 150 M 114 140 L 114 148", "#8A7A5A", 2.6, 0.9))
        else:                 # "furnace": one great round mouth of fire, a grate of three iron bars across it
            S.shape(ell(100, 126, 27, 20), fill="#FFB23A", shadow=0, side=False,
                    decor=f'<path d="{ell(100, 130, 18, 12)}" fill="#FFF2A0"/>' + strokes("M 88 104 L 88 148 M 100 104 L 100 148 M 112 104 L 112 148", "#2E2632", 5, 1))
    return draw


def pit_tail(v):
    def draw(S, OBS, LAVA, BONE):
        spine = [(108, 74), (126, 56), (132, 34), (122, 16)]
        if v == "spade":      # a devil's tail: a thick black tail curling up behind to a barbed spade
            S.shape(taper(spine, 17, 9), OBS, shadow=0)
            S.shape(blob([(122, 20), (106, 12), (112, -2), (126, -8), (134, 6), (140, 18)], 0.6), LAVA, shadow=0, side=False,
                    decor=f'<path d="{blob([(122, 16), (112, 10), (116, 2), (125, -2), (130, 8)], 0.6)}" fill="#FFD25A"/>')
        elif v == "flame":    # the tail burns: its last third is fire
            S.shape(taper(spine[:3], 17, 11), OBS, shadow=0)
            d, T = flame(130, 38, 196, 44, 14)
            S.shape(d, fill="url(#gFlameUp)", T=T, shadow=0, side=False)
            d, T = flame(129, 34, 196, 26, 7)
            S.shape(d, "#FFE27A", T=T, shadow=0, side=False)
        else:                 # "club": a heavy tail of obsidian plates ending in a spiked knob
            S.shape(taper(spine, 19, 13), OBS, shadow=0, decor=strokes("M 112 62 L 126 70 M 122 46 L 136 50 M 124 28 L 136 26", LAVA, 3.5, 0.9))
            for a in (-150, -90, -30, 30):
                x, y = 121 + 13 * math.cos(math.radians(a)), 10 + 13 * math.sin(math.radians(a))
                S.shape(poly([(-5, 0), (5, 0), (0, 12)]), BONE, T=f"translate({f(x)} {f(y)}) rotate({a - 90})", shadow=0, side=False)
            S.shape(circ(121, 10, 14), OBS, shadow=0, decor=f'<circle cx="121" cy="10" r="5" fill="{LAVA}"/>')
    return draw


for _f, _t in (("eyes", "spade"), ("skull", "flame"), ("furnace", "club")):
    BUILD[f"ember-pit-lord-{_f}"] = hooked(S2, dict(FACE_FN=pit_face(_f), TAIL_FN=pit_tail(_t)), S2.pit_lord, f"ember-pit-lord-{_f}")
# the Pit Lord as shown, with only a tail added (the first): to see the tail without a change of face
BUILD["ember-pit-lord-tail"] = hooked(S2, dict(TAIL_FN=pit_tail("spade")), S2.pit_lord, "ember-pit-lord-tail")

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        p = BUILD[n]()
        print(p.relative_to(ROOT5).as_posix())
