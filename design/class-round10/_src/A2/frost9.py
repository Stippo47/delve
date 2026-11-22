"""Round 9: real art for the Frost Hollow's stand-ins (docs/ART-NEEDED.md), A2 style: the frost wolf, the ice slime, the
frost spider and the frost spirit. The yeti (with its snowball) and the icicle wraith are built on the round-8 troll
and Ghost B in ../E3/frost9e.py.
python frost9.py [name ...]   -> ../../enemies/frost-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *


# ================================================================== frost wolf
FROST_WOLF = dict(fur="#DCE6EE", snout="#EBF1F5", stripe="#B8C8D6", muzzle="#FFFFFF", tip="#9CB4C8", ruff="#F2F7FA")


def frost_wolf():
    S = Sprite("FROST WOLF (round 9): the round-8 wolf (capsule body, the werewolf's skull, laid-back ears, long snout, "
               "front paws) as a white wolf of the ice caves: a pale blue-white coat, a shaggy mane of pointed white tufts "
               "over the shoulders, a row of ice crystals grown along its back, a blue-grey tail tip and ice-blue claws. "
               "No eyes. Parts: #back (tail, sways), #body, #arm-l / #arm-r (front paws, swing to walk). " + LAYOUT)

    def frost_back(S, Y):
        # ice on the back: a row of shards along the spine, the biggest at the shoulders, leaning back
        # (where the mane doesn't cover it: the capsule's top, y 44..86 + Y)
        for x, y, a, L, w in ((100, 76 + Y, 180, 34, 10), (84, 72 + Y, 212, 26, 7.5), (116, 72 + Y, 148, 26, 7.5),
                              (91, 52 + Y, 196, 15, 5.5), (109, 52 + Y, 164, 15, 5.5)):
            ice_shard(S, x, y, a, L, w)

    def mane(S, Y):
        S.shape(tufts(100, 114 + Y, 50, 12, 0.24, 0, 1.0, 0.8, 0.85, sweep=22), FROST_WOLF["ruff"], shadow=3)
    wolf9(S, FROST_WOLF, back=frost_back, mane=mane, ear_in="#A6A4BE", claw="#8FCBE6", stripe_op=0.55)
    return save("enemies", "frost-wolf", S)


# ================================================================== ice slime
SLIME_BODY = "M100 42 C140 42 156 72 156 104 C156 138 134 158 100 160 C66 158 44 138 44 104 C44 72 60 42 100 42 Z"
ICE_SLIME_DEFS = ('<radialGradient id="gIceSlime" cx="0.38" cy="0.32" r="0.78"><stop offset="0" stop-color="#FAFEFF"/>'
                  '<stop offset="0.5" stop-color="#CDEEFA"/><stop offset="1" stop-color="#86C4E4"/></radialGradient>')


def ice_slime():
    S = Sprite("ICE SLIME (round 9): the game's slime (a round dome of jelly with its point at the front) made of ice: "
               "pale and glassy, almost white at the top left and clear blue at the edge, three ice shards frozen inside "
               "it, a bright shine; two icicles hang where its point would be. No eyes, no face. Parts: #body only (it hops whole). "
               + LAYOUT)
    S.add_def(ICE_SLIME_DEFS)
    S.group("body")
    for (x0, x1, tip) in ((82, 110, (94, 192)), (108, 128, (122, 176))):   # two icicles where its point would be
        S.shape(poly([(x0, 146), (x1, 146), tip]), ICE, shadow=0, side=False,
                decor=f'<path d="M {(x0 + x1) / 2} 146 L {x1} 146 L {tip[0]} {tip[1]} Z" fill="{ICE_D}" opacity="0.4"/>')
    inside = ""
    # three shards frozen inside (no outline: they are seen through the ice)
    for pts, a in (([(70, 88), (92, 76), (104, 98), (84, 112)], 1.0), ([(104, 108), (128, 96), (138, 122), (116, 136)], 1.0),
                   ([(80, 122), (94, 118), (98, 140), (84, 144)], 0.9)):
        cx = sum(x for x, _ in pts) / 4
        inside += (f'<path d="{poly(pts)}" fill="#E4F7FD" opacity="{0.85 * a}"/>'
                   f'<path d="{poly([pts[1], pts[2], pts[3]])}" fill="#8CC8E6" opacity="{0.55 * a}"/>'
                   f'<path d="{poly([pts[0], pts[1], (cx, (pts[0][1] + pts[2][1]) / 2)])}" fill="#FFFFFF" opacity="0.7"/>')
    S.shape(SLIME_BODY, fill="url(#gIceSlime)", shadow=0, side=False,
            decor=f'<path d="{ell(118, 124, 40, 34)}" fill="#5E9CC8" opacity="0.2"/>' + inside
                  + f'<path d="{ell(76, 66, 17, 9)}" transform="rotate(-30 76 66)" fill="#FFFFFF" opacity="0.8"/>'
                  + f'<circle cx="98" cy="56" r="3.5" fill="#FFFFFF" opacity="0.8"/>')
    return save("enemies", "frost-ice-slime", S)


# ================================================================== frost spider
FROST_SPIDER = dict(body="#A9CEE2", leg="#8DB6D0", dleg="#E4F4FB", fang="#F4FBFF")


def frost_spider():
    S = Sprite("FROST SPIDER (round 9): a spider seen from above in round 8's creature build: a round pale ice-blue "
               "abdomen with a white frost-flake on it, a smaller head, two ice-white fangs, four jointed legs a side "
               "frosted white from the knee down. No eyes. Parts: #back (abdomen and the "
               "six back legs, sways), #arm-l / #arm-r (the front legs, they strike), #body (head and fangs). " + LAYOUT)

    def mark(S):
        arms = "".join(f'<path d="M 100 58 L {f(100 + 24 * math.sin(math.radians(a)))} {f(58 - 24 * math.cos(math.radians(a)))}"/>'
                       for a in range(0, 360, 60))
        return (f'<path d="{ell(100, 58, 30, 30)}" fill="#FFFFFF" opacity="0.16"/>'
                f'<g stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity="0.9">{arms}</g>'
                f'<circle cx="100" cy="58" r="6" fill="#FFFFFF"/>')

    spider9(S, FROST_SPIDER, mark=mark)
    return save("enemies", "frost-spider", S)


def frost_spirit():
    S = spirit9("frost", "Frost Spirit", "frost: an ice-blue core with a white snowflake, a white-blue tail.")
    return save("enemies", "frost-spirit", S)


BUILD = {"frost-wolf": frost_wolf, "frost-ice-slime": ice_slime, "frost-spider": frost_spider, "frost-spirit": frost_spirit}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
