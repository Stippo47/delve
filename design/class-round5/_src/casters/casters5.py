"""Round 5 (lane A1): the casters. python casters5.py [names...] writes ../../heroes-casters/caster-*.svg.
Builds on the round-4 generator (casters.py, copied here); weapons and hands live in the arm groups, never in #body.
Paths are relative to this file."""
import math, sys
from lib import Sprite, HEAD, SHOULDERS, ang, dist
import casters as c4
from casters import (PIV_L, PIV_R, shoulders, capsule, pole, point_on, grip, circle, arc_puffs, shard, mirror,
                     free_fist, snowflake)


def rename(s, name, comment):
    s.name, s.comment = name, comment
    return s


def flame_d(x, y, w, h, lean=0):
    """A flame tongue: wide round base at (x, y), tip h above it (toward -y), leaning sideways by `lean`."""
    return (f"M {x - w:.1f} {y:.1f} C {x - w:.1f} {y + w * 0.9:.1f} {x + w:.1f} {y + w * 0.9:.1f} {x + w:.1f} {y:.1f} "
            f"C {x + w:.1f} {y - h * 0.45:.1f} {x + lean + w * 0.2:.1f} {y - h * 0.7:.1f} {x + lean:.1f} {y - h:.1f} "
            f"C {x + lean - w * 0.5:.1f} {y - h * 0.65:.1f} {x - w:.1f} {y - h * 0.45:.1f} {x - w:.1f} {y:.1f} Z")


# =====================================================================================================  Frost
def frost():
    s = c4.frost()
    rename(s, "caster-frost", "FROST MAGE (round 5: the round-4 design kept, plus a blue gem set in the front of the hood). "
           "Round hood with a white fur ruff, ice shards on the shoulders, snowflake staff in the right fist (behind the body); empty left fist.")
    # the gem goes in #body, after the fur ruff, on the hood above the face (the free fist group is last; insert before it)
    body = [g for g in s.groups if g[0].startswith('<g id="body"')][0]
    s.cur = body
    gem = "M 100 62 L 111 74 L 100 90 L 89 74 Z"
    s.shape("M 100 57 C 110 57 117 66 117 75 C 117 86 108 94 100 96 C 92 94 83 86 83 75 C 83 66 90 57 100 57 Z",
            s.grad("#F4F8FB", "#9DB3C6"), dy=3, shadow=0.3, shade="sRl")
    s.shape(gem, s.ygrad([(0, "#9FE6FF"), (0.5, "#2F8FE0"), (1, "#163E9A")], 62, 90), dy=2, shadow=0.25, shade="sRl",
            details=['<path d="M 100 62 L 89 74 L 100 76 Z" fill="#E8FBFF" opacity="0.85"/>',
                     '<path d="M 100 76 L 111 74 L 100 90 Z" fill="#0E2C70" opacity="0.4"/>'])
    return s


# =====================================================================================================  Shaman
def shaman():
    """Round-4 shaman; the braids now come out from under the hair (drawn before the head) and are shorter."""
    s = Sprite("caster-shaman",
               "SHAMAN (round 5: braids fixed): a carved totem with spread wings strapped to the back; dark hair with two "
               "short braids that come out from under the hair at the sides (drawn under it, so they join the head cleanly); "
               "terracotta headband; teal robe; a feathered spirit-stick in the LEFT fist (behind the body); empty right fist.")
    s.group("back", "100 90")
    s.shape(capsule(100, 96, 100, 18, 13), s.grad("#C48A55", "#875A30", x2=1, y2=0), shadow=0)
    wing = "M 96 30 C 84 18 64 12 44 16 C 50 22 54 26 52 30 C 60 30 64 34 62 38 C 72 36 84 38 96 44 Z"
    wg = s.ygrad([(0, "#F4EEDC"), (0.35, "#2FB3A4"), (1, "#1E7A70")], 0, 0, x1=44, x2=96)
    s.shape(wing, wg, shadow=0, shade="sRl")
    wg2 = s.ygrad([(0, "#F4EEDC"), (0.35, "#2FB3A4"), (1, "#1E7A70")], 0, 0, x1=156, x2=104)
    s.shape(mirror(wing), wg2, shadow=0)
    s.shape("M 86 8 C 86 2 114 2 114 8 L 114 40 C 114 46 86 46 86 40 Z", s.grad("#E07A44", "#A8481E"), dy=3, shadow=0.3,
            details=['<rect x="86" y="18" width="28" height="6" fill="#2FB3A4"/>', '<path d="M 94 30 L 100 40 L 106 30 Z" fill="#F4EEDC"/>'])
    B, F = (32, 92), (56, 168)
    s.group("arm-l", PIV_L)
    tf, a = pole(s, B, F, 8, s.grad("#C48A55", "#875A30", x2=1, y2=0))
    feather = "M 0 0 C 7 8 8 22 0 34 C -8 22 -7 8 0 0 Z"
    for r in (-26, 26, 0):
        s.shape(feather, s.ygrad([(0, "#F4EEDC"), (0.6, "#F4EEDC"), (0.61, "#D9532B"), (1, "#B83A1C")], -2, 36),
                tf=f"{tf} rotate({r}) translate(0 -4)", shadow=0, shade="sRl")
    s.raw(f'<rect x="-6" y="-8" width="12" height="7" rx="3" transform="{tf}" fill="#2FB3A4"/>')
    fx, fy = grip(B, F, (49, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#38B0A2", "#1C6F67", trim="#D7713C", trim_w=8)
    # braids first: three plaits each, starting up under where the hair will be, ending in a terracotta tie
    for sx in (1, -1):
        cx = 100 - sx * 50
        pl = " ".join(circle(cx - sx * k * 1.0, 114 + k * 9, 7.5) for k in range(3))
        s.shape(pl, s.grad("#7A5038", "#3E2618"), dy=3, shadow=0.28)
        s.shape(capsule(cx - sx * 2.5, 138, cx - sx * 3, 147, 8.5), s.grad("#E5824A", "#A8481E"), dy=2, shadow=0.25)
    s.head()
    hair = ("M 46 128 C 36 78 62 46 100 46 C 138 46 164 78 154 128 C 148 112 140 102 130 98 C 120 98 108 96 100 90 "
            "C 92 96 80 98 70 98 C 60 102 52 112 46 128 Z")
    s.shape(hair, s.grad("#6A4532", "#3E2618"), dy=4, shadow=0.3,
            details=['<path d="M 66 58 C 60 74 60 92 64 106 L 72 102 C 68 88 70 72 76 56 Z" fill="#A0705A" opacity="0.35"/>'])
    band = "M 52 96 C 66 86 84 82 100 82 C 116 82 134 86 148 96 L 149 106 C 134 96 116 92 100 92 C 84 92 66 96 51 106 Z"
    s.shape(band, s.grad("#E5824A", "#A8481E"), dy=2, shadow=0.25)
    feather = "M 0 0 C 6 -8 8 -22 2 -36 C -6 -24 -7 -10 0 0 Z"
    s.shape(feather, s.ygrad([(0, "#F4EEDC"), (0.55, "#F4EEDC"), (0.56, "#2FB3A4"), (1, "#1E7A70")], 0, -36),
            tf="translate(52 98) rotate(-50)", dy=3, shadow=0.25, shade="sRl")
    free_fist(s, "r")
    return s


# =====================================================================================================  Witch
FARM_BRIM = "M 28 68 C 28 40 60 20 100 20 C 140 20 172 40 172 68 C 172 96 140 116 100 116 C 60 116 28 96 28 68 Z"
FARM_CROWN = "M 56 60 C 54 34 75 24 100 24 C 125 24 146 34 144 60 C 144 74 125 82 100 82 C 75 82 56 74 56 60 Z"
FARM_BAND = ("M 56 56 C 62 68 80 75 100 75 C 120 75 138 68 144 56 C 145 61 145 67 144 70 C 138 80 120 85 100 85 "
             "C 80 85 62 80 56 70 C 55 67 55 61 56 56 Z")


def witch():
    s = Sprite("caster-witch",
               "WITCH (round 5: the hat rebuilt on the farmers' straw hat): the same wide oval brim and band as the Haymaker's "
               "hat, in violet, with the crown drawn up into a tall bent point that leans back; dark-green hair at the sides; "
               "a broom in the LEFT fist, bristles first (behind the body); empty right fist.")
    B, F = (14, 56), (56, 160)
    s.group("arm-l", PIV_L)
    tf, a = pole(s, B, F, 8, s.grad("#B88250", "#7A4E2A", x2=1, y2=0))
    bristle = "M -7 -2 L 7 -2 C 12 10 17 24 19 36 C 10 42 -10 42 -19 36 C -17 24 -12 10 -7 -2 Z"
    s.shape(bristle, s.grad("#F0D27A", "#B58A30"), tf=tf, shadow=0,
            details=[f'<g transform="{tf}"><rect x="-12" y="4" width="24" height="6" fill="#A8333A"/>'
                     '<path d="M -4 14 L -8 40 L -5 40 L -1 14 Z M 5 14 L 7 40 L 10 40 L 8 14 Z" fill="#9C7426" opacity="0.5"/></g>'])
    fx, fy = grip(B, F, (49, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#7E4AAE", "#43246A")
    s.head()
    for d in ["M 52 100 C 46 120 50 138 60 150 C 64 136 66 120 66 104 Z"]:
        g = s.grad("#4E8A5C", "#24452E")
        s.shape(d, g, dy=3, shadow=0.25)
        s.shape(mirror(d), g, dy=3, shadow=0.25)
    # the farmers' brim, violet
    s.shape(FARM_BRIM, s.grad("#6E3EA0", "#34185A", x2=0.25), dy=4, shadow=0.3)
    # the farmers' crown, drawn up into a bent point leaning back (toward -y), and their band, green, with a buckle
    crown = ("M 66 64 C 64 50 74 40 84 32 C 90 24 94 14 96 4 C 98 -4 110 -8 122 -1 C 110 0 106 6 108 16 "
             "C 109 22 112 28 116 32 C 126 40 136 50 134 64 C 134 76 118 83 100 83 C 82 83 66 76 66 64 Z")
    s.shape(crown, s.grad("#A274D4", "#4A2876", x2=0.25), dy=4, shadow=0.3,
            details=['<ellipse cx="86" cy="46" rx="9" ry="6" fill="#E6D2FA" opacity="0.45"/>'])
    band = ("M 66 60 C 72 70 86 75 100 75 C 114 75 128 70 134 60 C 135 65 135 70 134 72 C 128 81 114 85 100 85 "
            "C 86 85 72 81 66 72 C 65 70 65 65 66 60 Z")
    s.shape(band, s.grad("#9CD45A", "#4E8A2A", x2=0.25), dy=2, shadow=0.2,
            details=['<rect x="92" y="72" width="16" height="13" rx="2.5" fill="#F2C94C"/>'
                     '<rect x="96.5" y="75.5" width="7" height="6" rx="1" fill="#5E8A2E"/>'])
    free_fist(s, "r")
    return s


# =====================================================================================================  Druid A (round 4, kept)
def druid_a():
    s = c4.druid()
    return rename(s, "caster-druid-a", "DRUID A (round 4, kept as it was: 'pretty good'): long chestnut hair, leaf circlet, big "
                  "branching antlers; moss-green mantle; a curled wooden staff with leaves in the right fist (behind the body); empty left fist.")


def druid_b():
    s = Sprite("caster-druid-b",
               "DRUID B (elder): an old druid, long grey-white hair and a long beard with moss in it, a crown of woven twigs "
               "with leaves and red berries, a hooded bark-brown mantle with a moss collar; a gnarled staff holding a "
               "glowing green seed in a cradle of twigs, in the right fist (behind the body); empty left fist.")
    B, F = (186, 50), (150, 162)
    s.group("arm-r", PIV_R)
    wood = s.grad("#B88454", "#6E4626", x2=1, y2=0)
    tf, a = pole(s, B, F, 10, wood)
    # twig cradle: three short twigs forward round the seed
    tw = " ".join([capsule(0, -2, -12, 18, 6), capsule(0, -2, 12, 18, 6), capsule(-12, 18, -9, 30, 5), capsule(12, 18, 9, 30, 5)])
    s.shape(tw, wood, tf=tf, shadow=0)
    s.shape(circle(0, 20, 11), s.rgrad("#F4FFD0", "#5FB82A", mid="#B8F070"), tf=tf, shadow=0, shade=None,
            details=[f'<circle cx="-3" cy="16" r="3.5" fill="#FFFFFF" opacity="0.8" transform="{tf}"/>'])
    fx, fy = grip(B, F, (151, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#9A6A42", "#5A3A20")
    moss = arc_puffs(100, 118, 58, 30, 0, 180, 9, 10)
    s.shape(moss, s.rgrad("#B6D46A", "#5E8A2A"), dy=3, shadow=0.25, shade="sRl")
    s.head()
    beard = ("M 64 118 C 66 140 78 152 88 160 C 90 172 94 182 100 192 C 106 182 110 172 112 160 C 122 152 134 140 136 118 "
             "C 124 134 112 140 100 140 C 88 140 76 134 64 118 Z")
    s.shape(beard, s.grad("#F4F2EC", "#B6B8B4"), dy=3, shadow=0.25, shade="sRl",
            details=['<path d="M 84 150 C 88 160 92 168 96 176" stroke="#8FB04A" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7"/>'])
    hair = ("M 46 136 C 36 84 60 46 100 46 C 140 46 164 84 154 136 C 146 130 142 120 142 110 C 136 100 120 96 100 96 "
            "C 80 96 64 100 58 110 C 58 120 54 130 46 136 Z")
    s.shape(hair, s.grad("#EEEDE8", "#A9ABA8"), dy=4, shadow=0.3,
            details=['<path d="M 66 56 C 60 72 60 90 64 104 L 72 100 C 68 86 70 70 76 54 Z" fill="#FFFFFF" opacity="0.5"/>'])
    # woven twig crown: a ring of twig segments round the top of the head, leaves and berries on it
    ring = [capsule(100 + 40 * math.cos(math.radians(t)), 76 - 26 * math.sin(math.radians(t)),
                    100 + 40 * math.cos(math.radians(t + 34)), 76 - 26 * math.sin(math.radians(t + 34)), 8)
            for t in range(-20, 200, 34)]
    s.shape(" ".join(ring), s.grad("#A87448", "#5E3A1E"), dy=3, shadow=0.3)
    leaf = "M 0 0 C 6 -6 16 -6 22 0 C 16 6 6 6 0 0 Z"
    lg = s.grad("#9CCB55", "#4E7F26")
    for (x, y, r) in [(62, 82, 210), (74, 58, 240), (100, 50, 270), (126, 58, 300), (138, 82, 330)]:
        s.shape(leaf, lg, tf=f"translate({x} {y}) rotate({r}) translate(-4 0)", dy=2, shadow=0.2, shade="sRl")
    for (x, y) in [(86, 52), (116, 52), (66, 70), (134, 70)]:
        s.shape(circle(x, y, 4.2), s.rgrad("#FF7A6A", "#B0202A"), dy=1.5, shadow=0.2, shade=None)
    free_fist(s, "l")
    return s


def druid_c():
    s = Sprite("caster-druid-c",
               "DRUID C (stag skull): a wild druid wearing a bleached stag skull on top of the head like a helm, its snout "
               "over the brow and its antlers sweeping back; long black hair, a shaggy moss-and-fur mantle; a thorny vine "
               "staff ending in a curl with a glowing leaf bud, in the right fist (behind the body); empty left fist.")
    B, F = (186, 54), (148, 160)
    s.group("arm-r", PIV_R)
    wood = s.grad("#8E6A44", "#4E3420", x2=1, y2=0)
    tf, a = pole(s, B, F, 10, wood)
    curl = "M 0 -2 C 2 12 0 24 -10 29 C -22 34 -31 24 -27 13 C -24 5 -15 4 -12 11"
    s.raw(f'<path d="{curl}" transform="{tf}" fill="none" stroke="#7A5634" stroke-width="10" stroke-linecap="round"/>')
    bud = "M -16 10 C -22 4 -24 -4 -18 -10 C -12 -4 -10 4 -16 10 Z"
    s.shape(bud, s.rgrad("#E8FFB0", "#4E9A26"), tf=tf, shadow=0, shade="sRl")
    for (ty, side) in [(-30, 1), (-52, -1), (-74, 1)]:
        s.shape(f"M 0 {ty} L {side * 11} {ty - 7} L 0 {ty - 9} Z", s.grad("#6E8A3A", "#3E5A1E"), tf=tf, shadow=0, shade=None)
    fx, fy = grip(B, F, (151, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#6E7A3A", "#3A4420")
    fur = arc_puffs(100, 116, 64, 34, -10, 190, 11, 11)
    s.shape(fur, s.rgrad("#8C7A5A", "#4E4030"), dy=3, shadow=0.28, shade="sRl")
    s.head()
    hair = ("M 44 140 C 34 90 58 52 100 52 C 142 52 166 90 156 140 C 150 136 146 126 146 114 C 142 104 134 100 128 98 "
            "L 72 98 C 66 100 58 104 54 114 C 54 126 50 136 44 140 Z")
    s.shape(hair, s.grad("#4A4050", "#221C28"), dy=4, shadow=0.3)
    # antlers sweeping back off the skull (behind it in draw order: drawn first)
    L = [capsule(82, 60, 58, 38, 11), capsule(58, 38, 46, 14, 9), capsule(62, 42, 34, 42, 8), capsule(51, 24, 64, 10, 7)]
    ant = " ".join(L + [mirror(x) for x in L])
    s.shape(ant, s.grad("#F6EEDC", "#B8A784"), dy=4, shadow=0.3)
    skull = ("M 70 70 C 68 52 82 42 100 42 C 118 42 132 52 130 70 C 129 82 120 90 114 96 C 112 104 108 110 100 112 "
             "C 92 110 88 104 86 96 C 80 90 71 82 70 70 Z")
    s.shape(skull, s.grad("#FBF6EA", "#C9BC9C"), dy=4, shadow=0.32,
            details=['<ellipse cx="86" cy="74" rx="7" ry="6" fill="#4A3A40"/><ellipse cx="114" cy="74" rx="7" ry="6" fill="#4A3A40"/>'
                     '<path d="M 96 100 L 100 94 L 104 100 Z" fill="#7A6A60" opacity="0.6"/>'])
    free_fist(s, "l")
    return s


# =====================================================================================================  Pyromancer
def pyromancer():
    s = Sprite("caster-pyromancer",
               "PYROMANCER (round 5, redone): a crimson hood with a gold edge, its back drawn out into three flame points; "
               "a tall flared collar behind the head, cut like flames (orange to yellow); charcoal-and-red robe; a black "
               "iron staff with a fire bowl on the end, burning, in the right fist (behind the body); a little flame "
               "dancing over the open left fist.")
    B, F = (186, 50), (153, 142)
    s.group("arm-r", PIV_R)
    tf, a = pole(s, B, F, 9, s.grad("#5A5060", "#2A2430", x2=1, y2=0))
    fire = ("M 0 52 C -12 52 -20 44 -20 34 C -20 26 -16 20 -12 16 C -12 22 -9 25 -6 24 C -8 16 -4 10 2 4 "
            "C 2 12 6 16 10 18 C 12 14 14 12 16 10 C 20 18 20 26 19 32 C 20 44 12 52 0 52 Z")
    s.shape(fire, s.ygrad([(0, "#D8361E"), (0.5, "#FF8A2A"), (1, "#FFC84A")], 0, 0, x1=0, x2=0), tf=f"{tf} translate(0 5) scale(0.9)", shadow=0,
            shade=None, details=[f'<path d="M 0 46 C -8 46 -12 40 -12 34 C -12 28 -8 24 -5 22 C -4 27 0 28 2 26 C 2 22 4 18 8 16 '
                                 f'C 10 22 12 28 11 34 C 11 41 7 46 0 46 Z" fill="#FFE27A" transform="{tf} translate(0 5) scale(0.9)"/>'])
    bowl = "M -15 0 L 15 0 C 15 9 9 15 0 15 C -9 15 -15 9 -15 0 Z"
    s.shape(bowl, s.grad("#F2C25A", "#9A6A1E"), tf=tf, shadow=0, shade="sRl")
    fx, fy = grip(B, F, (151, 141))
    s.fist(fx, fy, a)
    s.group("body")
    collar = ("M 34 112 C 26 94 28 74 38 58 C 44 66 48 70 54 72 C 52 58 56 44 66 34 C 70 44 76 50 84 54 "
              "C 86 42 92 34 100 28 C 108 34 114 42 116 54 C 124 50 130 44 134 34 C 144 44 148 58 146 72 "
              "C 152 70 156 66 162 58 C 172 74 174 94 166 112 Z")
    s.shape(collar, s.ygrad([(0, "#FFC84A"), (0.45, "#FF7A2A"), (1, "#C8301E")], 28, 112), shadow=0, shade="sRl")
    shoulders(s, "#B8322A", "#5A1418", trim="#3A2A30", trim_w=10)
    s.head()
    hood = ("M 46 124 C 36 82 54 50 76 40 C 74 30 78 22 86 16 C 88 24 92 28 98 30 C 98 20 102 12 108 6 "
            "C 110 16 112 24 118 30 C 122 24 126 20 132 18 C 132 28 130 36 126 42 C 150 54 164 86 154 124 "
            "C 150 108 132 98 100 98 C 68 98 50 108 46 124 Z")
    s.shape(hood, s.grad("#D8443A", "#7A1C20"), dy=4, shadow=0.32,
            details=['<path d="M 46 124 C 50 108 68 98 100 98 C 132 98 150 108 154 124 L 154 116 C 148 100 130 90 100 90 '
                     'C 70 90 52 100 46 116 Z" fill="#F2B53A"/>',
                     '<path d="M 64 56 C 56 72 54 90 56 106 L 64 104 C 62 88 64 74 70 60 Z" fill="#FF9A7A" opacity="0.3"/>'])
    s.group("arm-l", PIV_L)
    s.shape(flame_d(55, 170, 10, 30, -2), s.ygrad([(0, "#FFE27A"), (0.5, "#FF9A3A"), (1, "#E8401E")], 140, 178),
            shadow=0, shade=None, details=[f'<path d="{flame_d(55, 170, 5, 16, -1)}" fill="#FFF4C0"/>'])
    s.fist(57, 140, 0, w=24, h=21, under=False)
    return s


# =====================================================================================================  Storm
def storm():
    s = Sprite("caster-storm",
               "STORM MAGE (round 5, redone): an indigo hood with a yellow lightning bolt down its top; a mantle of grey "
               "storm cloud piled on the shoulders; a steel lightning rod with a two-pronged fork holding a crackling "
               "spark ball, in the right fist (behind the body); a spark over the open left fist.")
    B, F = (184, 52), (150, 150)
    s.group("arm-r", PIV_R)
    tf, a = pole(s, B, F, 8, s.grad("#E6ECF2", "#7C8898", x2=1, y2=0))
    prongs = " ".join([capsule(0, -2, -13, 14, 6.5), capsule(-13, 14, -11, 30, 6), capsule(0, -2, 13, 14, 6.5), capsule(13, 14, 11, 30, 6)])
    s.shape(prongs, s.grad("#E6ECF2", "#7C8898"), tf=tf, shadow=0)
    s.shape(circle(0, 22, 11), s.rgrad("#FFFFFF", "#F2C21E", mid="#FFF07A"), tf=tf, shadow=0, shade=None,
            details=[f'<path d="M -4 14 L 3 20 L -2 23 L 5 30" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="{tf}"/>'])
    fx, fy = grip(B, F, (151, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#3F4AA8", "#1E2460", trim="#F5C842", trim_w=7)
    cloud = arc_puffs(100, 112, 64, 32, -14, 194, 10, 14)
    s.shape(cloud, s.rgrad("#E8ECF4", "#7E88A0"), dy=4, shadow=0.3, shade="sRl")
    s.head()
    hood = "M 46 124 C 36 76 62 38 100 38 C 138 38 164 76 154 124 C 148 106 130 98 100 98 C 70 98 52 106 46 124 Z"
    s.shape(hood, s.grad("#5260C6", "#202A72"), dy=4, shadow=0.32,
            details=['<path d="M 104 38 L 90 66 L 102 66 L 92 96 L 116 58 L 104 58 L 112 38 Z" fill="#F7D33C"/>',
                     '<path d="M 104 38 L 90 66 L 96 66 L 104 44 Z" fill="#FFF2A8"/>',
                     '<path d="M 62 54 C 54 70 52 88 54 106 L 62 104 C 60 88 62 72 68 58 Z" fill="#9AA6F0" opacity="0.3"/>'])
    s.group("arm-l", PIV_L)
    spark = "M 56 150 L 60 162 L 72 164 L 61 169 L 63 182 L 55 172 L 44 178 L 50 167 L 41 159 L 53 160 Z"
    s.shape(spark, s.rgrad("#FFFFFF", "#F2C21E", mid="#FFF07A"), shadow=0, shade=None)
    s.fist(57, 140, 0, w=24, h=21, under=False)
    return s


# =====================================================================================================  Necromancer
def necromancer():
    s = Sprite("caster-necromancer",
               "NECROMANCER (round 5, redone; new staff): a deep black-violet hood edged in bone-white, with a ragged front edge and a long "
               "drooping point; dark violet robe; a staff made of a spine (stacked vertebrae) "
               "topped with a horned skull, green fire in its sockets, in the right fist (behind the body); a green ghost "
               "flame over the open left fist.")
    B, F = (184, 50), (150, 150)
    s.group("arm-r", PIV_R)
    a = ang(*B, *F)
    L = dist(*B, *F)
    s.shape(capsule(*B, *F, 6), s.grad("#8A7E6A", "#4E4436", x2=1, y2=0), shadow=0)
    bones = []
    n = 7
    for k in range(n):
        px, py = point_on(B, F, 8 + (L - 16) * k / (n - 1))
        bones.append(f"M {px - 7:.1f} {py:.1f} A 7 5 {a:.1f} 1 0 {px + 7:.1f} {py:.1f} A 7 5 {a:.1f} 1 0 {px - 7:.1f} {py:.1f} Z")
    s.shape(" ".join(bones), s.grad("#F4ECD6", "#B4A684"), shadow=0, shade="sRl")
    tf = f"translate({F[0]:.1f} {F[1]:.1f}) rotate({a:.2f})"
    horns = ("M -12 8 C -24 4 -30 -8 -26 -20 C -22 -10 -16 -6 -8 -4 Z M 12 8 C 24 4 30 -8 26 -20 C 22 -10 16 -6 8 -4 Z")
    s.shape(horns, s.ygrad([(0, "#5A4A50"), (1, "#F0E6D2")], -20, 8), tf=tf, shadow=0, shade="sRl")
    skull = "M -15 14 C -15 2 -8 -4 0 -4 C 8 -4 15 2 15 14 C 15 22 12 27 9 30 L 9 37 L -9 37 L -9 30 C -12 27 -15 22 -15 14 Z"
    s.shape(skull, s.grad("#FBF6E8", "#C4B898"), tf=tf, shadow=0, shade="sRl",
            details=[f'<g transform="{tf}"><ellipse cx="-6" cy="19" rx="5" ry="5.5" fill="#2E3A2A"/><ellipse cx="6" cy="19" rx="5" ry="5.5" fill="#2E3A2A"/>'
                     f'<circle cx="-6" cy="19.5" r="3" fill="#A8F060"/><circle cx="6" cy="19.5" r="3" fill="#A8F060"/>'
                     f'<path d="M -2 28 L 0 24 L 2 28 Z" fill="#3A3346"/></g>'])
    fx, fy = grip(B, F, (151, 141))
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#4A3A62", "#1E1630")
    s.head()
    hood = ("M 42 132 C 30 84 54 40 92 36 C 92 24 86 12 76 2 C 96 4 110 16 114 36 C 148 44 170 84 158 132 "
            "L 150 120 L 144 132 L 138 116 C 130 104 118 98 100 98 C 82 98 70 104 62 116 L 56 132 L 50 120 Z")
    s.shape(hood, s.grad("#5A4478", "#1E1630"), dy=5, shadow=0.42,
            details=['<path d="M 56 60 C 46 80 44 104 48 130 L 58 126 C 54 104 56 82 64 62 Z" fill="#B898E0" opacity="0.18"/>',
                     '<path d="M 56 134 L 62 116 C 70 104 82 98 100 98 C 118 98 130 104 138 116 L 144 134" fill="none" stroke="#E8DEC4" stroke-width="9" stroke-linejoin="round"/>'])
    s.group("arm-l", PIV_L)
    wisp = ("M 58 186 C 46 186 40 176 44 166 C 46 160 50 156 50 148 C 56 152 58 158 58 162 C 60 156 64 152 64 144 "
            "C 72 152 74 162 72 170 C 74 180 68 186 58 186 Z")
    s.shape(wisp, s.grad("#C8FF8A", "#4FB82A"), shadow=0, shade="sRl",
            details=['<path d="M 58 180 C 52 180 49 175 51 169 C 53 165 56 163 57 158 C 61 163 64 168 64 172 C 65 177 62 180 58 180 Z" fill="#F0FFD8" opacity="0.85"/>'])
    s.fist(57, 140, 0, w=24, h=21, under=False)
    return s


# =====================================================================================================  Cultist
def cultist():
    s = Sprite("caster-cultist",
               "CULTIST (round 5, redone): a tall pointed black-violet hood pulled low, its point leaning back, a big gold "
               "eye-in-a-circle sigil on top of the hood and a blood-red lining showing at the front edge; robe of the same "
               "dark violet with a red sash; a curved ritual dagger in the right fist and a black candle burning in the "
               "left (both behind the body, only the fists and what they hold showing).")
    s.group("arm-l", PIV_L)
    fx, fy, a = 54, 142, -6
    tf = f"translate({fx} {fy}) rotate({a})"
    s.shape("M -7 4 L 7 4 L 7 30 C 7 33 -7 33 -7 30 Z", s.grad("#4A3A5A", "#1E1428", x2=1, y2=0), tf=tf, shadow=0)
    s.shape("M -2 32 L 2 32 L 2 36 L -2 36 Z", s.grad("#2B2230", "#2B2230"), tf=tf, shadow=0, shade=None)
    s.shape(flame_d(0, 46, 6, 16), s.ygrad([(0, "#FFF4C0"), (1, "#FF9A3A")], 0, 0, x1=0, x2=0),
            tf=f"{tf} rotate(180 0 42)", shadow=0, shade=None)
    s.fist(fx, fy, a)
    s.group("arm-r", PIV_R)
    fx, fy, a = 147, 141, 10
    tf = f"translate({fx} {fy}) rotate({a})"
    blade = "M -6 12 C -12 24 -14 40 -8 54 C -4 62 4 66 10 64 C 2 58 0 48 2 38 C 4 28 8 20 6 12 Z"
    s.shape(blade, s.grad("#F4F6F9", "#8E96A4", x2=1, y2=0), tf=tf, shadow=0)
    s.shape("M -14 8 C -14 5 14 5 14 8 L 14 13 C 14 16 -14 16 -14 13 Z", s.grad("#F6CF63", "#C48A22"), tf=tf, shadow=0)
    s.fist(fx, fy, a)
    s.group("body")
    shoulders(s, "#3E2A52", "#1A1024", trim="#A8202E", trim_w=7)
    s.head()
    hood = ("M 40 132 C 28 92 44 56 70 40 C 76 22 88 4 100 -6 C 112 4 124 22 130 40 C 156 56 172 92 160 132 "
            "C 156 140 146 142 140 136 C 134 116 120 106 100 106 C 80 106 66 116 60 136 C 54 142 44 140 40 132 Z")
    hg = s.grad("#4E3868", "#160E22")
    s.shape(hood, hg, dy=5, shadow=0.38,
            details=['<rect x="0" y="0" width="200" height="200" fill="#A8202E"/>',
                     f'<path d="{hood}" transform="translate(0 -6)" fill="{hg}"/>',
                     '<path d="M 100 -6 C 96 20 96 50 98 76 L 104 76 C 104 50 104 20 100 -6 Z" fill="#000000" opacity="0.18"/>'])
    # the sigil on top of the hood: a gold ring with an eye-shape inside (a symbol, not a face)
    s.shape(circle(100, 62, 17), s.grad("#F6D477", "#B8862A"), dy=2, shadow=0.25, shade="sRl",
            details=['<circle cx="100" cy="62" r="11.5" fill="#2A1A3A"/>',
                     '<path d="M 90 62 Q 100 54 110 62 Q 100 70 90 62 Z" fill="#F6D477"/>',
                     '<circle cx="100" cy="62" r="3" fill="#A8202E"/>'])
    return s


# =====================================================================================================  Alchemist
def alch_flask(s):
    s.group("arm-r", PIV_R)
    fx, fy, a = 148, 141, 10
    tf = f"translate({fx} {fy}) rotate({a})"
    s.shape("M -5.5 0 L 5.5 0 L 5.5 24 L -5.5 24 Z", s.grad("#E8F4F2", "#9FC0BC", x2=1, y2=0), tf=tf, shadow=0)
    s.shape(circle(0, 38, 18), s.grad("#EAF6F4", "#A9C8C4"), tf=tf, shadow=0, shade="sRl",
            details=[f'<g transform="{tf}"><path d="M -18 38 C -10 34 10 42 18 38 L 18 60 L -18 60 Z" fill="#7CD63A"/>'
                     '<path d="M -18 38 C -10 34 10 42 18 38 L 18 42 C 10 46 -10 38 -18 42 Z" fill="#B8F070"/>'
                     '<circle cx="-4" cy="47" r="3" fill="#D8FFA8"/><circle cx="5" cy="51" r="2" fill="#D8FFA8"/>'
                     '<ellipse cx="-8" cy="31" rx="4" ry="6" fill="#FFFFFF" opacity="0.7"/></g>'])
    s.fist(fx, fy, a)


def alch_body(s):
    s.group("body")
    shoulders(s, "#C08A4E", "#704524", trim="#5A3A22", trim_w=8)
    strap = "M 28 100 C 40 80 70 74 100 74 C 130 74 160 80 172 100 L 170 110 C 158 90 130 84 100 84 C 70 84 42 90 30 110 Z"
    s.shape(strap, s.grad("#6A4428", "#3E2614"), dy=2, shadow=0.25)
    vial = "M -8 -16 L 8 -16 L 8 12 C 8 17 4 20 0 20 C -4 20 -8 17 -8 12 Z"
    for (x, y, r, c) in [(33, 98, -66, "#E5508E"), (45, 86, -48, "#F4C430"), (61, 79, -26, "#3BB6E0"),
                         (167, 98, 66, "#A060E0"), (155, 86, 48, "#FF8A3A"), (139, 79, 26, "#E5508E")]:
        t = f"translate({x} {y}) rotate({r}) scale(0.9)"
        s.shape(vial, s.grad("#F4FAFA", "#B6CAC8"), tf=t, dy=3, shadow=0.28, shade="sRl",
                details=[f'<path d="M -8 -2 L 8 -2 L 8 12 C 8 17 4 20 0 20 C -4 20 -8 17 -8 12 Z" transform="{t}" fill="{c}"/>'])
        s.shape("M -6 -23 L 6 -23 L 6 -15 L -6 -15 Z", s.grad("#B07A48", "#6A4022"), tf=t, dy=2, shadow=0.2)
    s.head()


def goggles(s, y, strap=True):
    if strap:
        s.shape(f"M 50 {y - 4} C 70 {y - 12} 130 {y - 12} 150 {y - 4} L 150 {y + 5} C 130 {y - 3} 70 {y - 3} 50 {y + 5} Z",
                s.grad("#5A3A22", "#3A2414"), dy=2, shadow=0.25)
    for cx in (82, 118):
        s.shape(circle(cx, y - 6, 13), s.grad("#F6D477", "#A87A22"), dy=3, shadow=0.3, shade="sRl",
                details=[f'<circle cx="{cx}" cy="{y - 6}" r="8.5" fill="#6FCFC0"/>'
                         f'<circle cx="{cx - 3}" cy="{y - 9}" r="3" fill="#EFFFFA"/>'])


def alchemist_a():
    s = Sprite("caster-alchemist-a",
               "ALCHEMIST A (round 5: no hat, so hair and hat can't fight): a big wild cloud of white hair, brass goggles "
               "pushed up on the forehead on a leather strap; a strap of six corked vials over the shoulders; a round flask "
               "of green brew in the right fist (behind the body), to throw; empty left fist.")
    alch_flask(s)
    alch_body(s)
    hair = c4.arc_puffs(100, 84, 44, 30, -30, 210, 11, 15)
    s.shape(hair, s.rgrad("#FFFFFF", "#C2C6D0"), dy=4, shadow=0.3, shade="sRl")
    s.shape(circle(100, 74, 34), s.rgrad("#FFFFFF", "#D2D6DE"), dy=3, shadow=0.2, shade="sRl")
    goggles(s, 96)
    free_fist(s, "l")
    return s


def alchemist_b():
    s = Sprite("caster-alchemist-b",
               "ALCHEMIST B (round 5: one hat, the hair tucked away): a round brown leather cap with a short peak and a "
               "brass band, the goggles strapped round the cap; no hair showing; a strap of six corked vials over the "
               "shoulders; a round flask of green brew in the right fist (behind the body); empty left fist.")
    alch_flask(s)
    alch_body(s)
    cap = "M 50 108 C 44 70 66 44 100 44 C 134 44 156 70 150 108 C 138 98 120 94 100 94 C 80 94 62 98 50 108 Z"
    s.shape(cap, s.grad("#B07A48", "#5E381C"), dy=4, shadow=0.3,
            details=['<path d="M 70 50 C 62 62 60 74 62 86 L 70 84 C 68 72 70 62 76 52 Z" fill="#E0A870" opacity="0.4"/>',
                     '<path d="M 100 44 L 100 94" stroke="#5E381C" stroke-width="3" opacity="0.35"/>'])
    peak = "M 62 104 C 74 96 126 96 138 104 C 136 114 124 118 100 118 C 76 118 64 114 62 104 Z"
    s.shape(peak, s.grad("#C08A56", "#7A4A24"), dy=3, shadow=0.3)
    goggles(s, 84)
    free_fist(s, "l")
    return s


DESIGNS = {"frost": frost, "shaman": shaman, "witch": witch, "druid-a": druid_a, "druid-b": druid_b, "druid-c": druid_c,
           "pyromancer": pyromancer, "storm": storm, "necromancer": necromancer, "cultist": cultist,
           "alchemist-a": alchemist_a, "alchemist-b": alchemist_b}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(DESIGNS):
        print(DESIGNS[n]().write().name)
