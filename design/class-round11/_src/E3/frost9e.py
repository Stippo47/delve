"""Round 9: the Frost Hollow kinds built on designs the designer picked, with the same E3 library they were made with:
  the yeti      on the round-8 troll's body plan (greenskins.troll8: the hunched back, the small head pushed forward,
                long arms reaching forward to hold what it rolls); the designer: "Should have the same shape and fighting
                style as trolls. It instead rolls its 'boulders' as large snowballs";
  its snowball  a prop like the troll's boulder (greenskins.boulder), packed snow;
  the icicle wraith  Ghost B (critters.ghost7("b"), the cold ghost round 8 kept for this; the designer: "Make this the
                wraith. Cold ghost that spawns icicles"), unchanged but for the icicles hanging off its shroud.
python frost9e.py [name ...]   -> ../../enemies/frost-*.svg, ../../props/yeti-snowball.svg   (paths relative to this file)"""
import sys, math
from greenskins import *
from critters import ghost7

FUR = ("#FBFDFF", "#BCCADA")      # the yeti's white coat, lit and in shade
SKIN_Y = "#8FA4BC"                # its face and hands: blue-grey
ICE = ("#E8FAFF", "#7CC8EC")


def fluff(cx, cy, rx, ry, a0, a1, n, k=0.62, front=(), front_d=None):
    """A fur coat's edge seen from above: n round tufts (arcs bulging out) along an ellipse from angle a0 to a1 (degrees,
    increasing, through the back), then a smooth front edge back through `front` (points, right to left)."""
    pts = [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n)))
           for i in range(n + 1)]
    d = f"M{f(pts[0][0])} {f(pts[0][1])}"
    for i in range(n):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        r = math.hypot(x1 - x0, y1 - y0) * k
        d += f" A{f(r)} {f(r)} 0 0 1 {f(x1)} {f(y1)}"
    if front_d:   # round 11: a drawn front edge (a path fragment from the last tuft back to the first)
        return d + " " + front_d + " Z"
    return d + "".join(f" L{f(x)} {f(y)}" for x, y in front) + " Z"


# round 10 (art-round9 deck, on the Yeti: "Meh. Not great. Don't like little balls on snow ball for 1. Face is a. Little
# weird. That nose looks like an eye. Weird fangs/mouth"): YETI_R10
#   face:     the dark nose blob (the "eye") is a small pale nose; the mouth is one wide line turned
#             down with two short lower fangs coming up at its corners (they hung down from the lip in the middle).
#   snowball: the two stuck-on lumps and the four clumps are gone: one smooth ball of packed snow, three faint rolling
#             streaks, the same size and light.
#   the hands sit 8 units further back so they are whole inside the box (the board cut them off).
YETI_R10 = False
# round 11 (art-round10 deck, the Yeti: "Give dark nose again. Have it be taller then it is wide. Also make torso less
# sharp on the front"): YETI_R11 (with YETI_R10):
#   nose:   round 9's dark nose again (its two colours), now taller than it is wide (14 wide, 21 tall; round 9's was 36
#           wide and 24 tall, which read as an eye).
#   torso:  the coat's front edge ran in two straight lines to a point in the middle, with a corner at each side; it is
#           one soft curve now, the corners rounded.
YETI_R11 = False


def yeti9():
    S = Sprite('YETI (round 9): the troll\'s body plan in white fur (the designer: "the same shape and fighting style as '
               'trolls ... rolls its boulders as large snowballs"): a huge hunched back under a shaggy white coat with a '
               'ragged edge, a blue-grey shag over the hump, a small blue-grey face pushed forward under a white fur '
               'hood with a ragged fringe, a broad flat nose and a wide mouth with two fangs, no eyes; long furry arms '
               'reaching forward either side of the head, huge blue-grey hands turned in to hold its snowball (a prop of '
               'its own in the game, yeti-snowball). Parts: #arm-l, #arm-r (arm and hand, before #body so the coat covers '
               'the shoulders), #body. Front = DOWN (+y).')
    for gid, side in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + side * 62, 116))
        hy = -8 if YETI_R10 else 0
        arm = [(100 + side * 66, 116), (100 + side * 64, 150 + hy), (100 + side * 48, 178 + hy)]
        S.shape(stroke_path(arm, 38, 32, 0.9), S.lg(*FUR), shadow=False, shade=0.25)
        # a huge hand, the palm and the thick fingers one rounded block, turned in to hold the snowball
        S.shape(rr(0, 0, 40, 34, 14), S.lg(lt(SKIN_Y, 0.12), dk(SKIN_Y, 0.25)), tf=frame(100 + side * 43, 187 + hy, side * 30), sh=3)
    S.group("body")
    coat = fluff(100, 94, 86, 58, -196, 16, 13, front=[(178, 130), (100, 146), (22, 130)])
    if YETI_R10 and YETI_R11:
        coat = fluff(100, 94, 86, 58, -196, 16, 13, front_d="C 185 124 178 136 158 140 Q 100 150 42 140 C 22 136 15 124 17.3 110")
    S.shape(coat, S.lg(*FUR), shade=0.3,
            decor=[f'<path d="{blob([(66, 40), (96, 30), (106, 62), (84, 84), (62, 68)])}" fill="#FFFFFF" opacity="0.4"/>',
                   '<path d="M 58 70 Q 70 84 66 100 M 142 70 Q 130 84 134 100 M 86 46 Q 96 60 92 76 M 114 46 Q 104 60 108 76" '
                   'fill="none" stroke="#9FB2C6" stroke-width="4" stroke-linecap="round" opacity="0.35"/>'])
    tf = "translate(100 120) scale(0.82) translate(-100 -100)"
    bald_head(S, SKIN_Y, tf=tf)
    # the white fur hood over the top of the head, a ragged fringe over the brow
    cap = sym([(100, 34), (130, 38), (150, 58), (157, 86), (154, 110), (140, 104), (126, 112), (112, 104), (100, 110)], 0.9)
    if YETI_R10:
        S.comment = S.comment.replace("a broad flat nose and a wide mouth with two fangs", "a small pale nose and a wide mouth "
                                      "turned down with two short lower fangs at its corners (round 10)")
        S.shape(cap, S.lg(*FUR), tf=tf, sh=3, op=0.16, shade=0.25)
        fang = [(112, 141), (122, 141), (121, 132), (120, 126, 'c'), (115, 133)]
        for pts in (fang, mx(fang)):
            S.shape(blob(pts, 0.8), S.lg(*BONE), tf=tf, shadow=False, shade=0.12)
        S.raw(f'<path d="M78 142 Q100 135 122 142" fill="none" stroke="{dk(SKIN_Y, 0.6)}" stroke-width="3.4" stroke-linecap="round" transform="{tf}"/>')
        if YETI_R11:
            S.comment = S.comment.replace("a small pale nose", "a dark nose, taller than it is wide (round 11),")
            nose = blob([(94.5, 110), (105.5, 110), (107, 119), (106, 127), (100, 131), (94, 127), (93, 119)], 0.95)
            S.shape(nose, S.lg(dk(SKIN_Y, 0.18), dk(SKIN_Y, 0.42)), tf=tf, sh=3, op=0.28, shade=0.2)
            return S
        nose = blob([(93, 114), (107, 114), (112, 121), (107, 128), (100, 129.5), (93, 128), (88, 121)], 0.95)
        S.shape(nose, S.lg(lt(SKIN_Y, 0.34), lt(SKIN_Y, 0.08)), tf=tf, sh=3, op=0.25, shade=0.1)
        return S
    S.shape(cap, S.lg(*FUR), tf=tf, sh=3, op=0.16, shade=0.25)
    # a wide mouth, two fangs coming down out of the upper lip
    S.raw(f'<path d="M78 146 Q100 154 122 146" fill="none" stroke="{dk(SKIN_Y, 0.6)}" stroke-width="3.4" stroke-linecap="round" transform="{tf}"/>')
    for x in (88, 112):
        S.shape(blob([(x - 4.5, 147), (x + 4.5, 147), (x + 1, 160), (x, 162, 'c'), (x - 1, 160)], 0.8), S.lg(*BONE), tf=tf,
                shadow=False, shade=0.12)
    nose = blob([(90, 116), (110, 116), (118, 128), (112, 138), (100, 140), (88, 138), (82, 128)], 0.95)
    S.shape(nose, S.lg(dk(SKIN_Y, 0.18), dk(SKIN_Y, 0.42)), tf=tf, sh=3, op=0.28, shade=0.2)
    return S


def snowball9():
    """The yeti's snowball, a prop (art/props/yeti-snowball.svg) sized like the troll's boulder: radius 74 in the 220 box,
    so the game scales it by r / 30."""
    S = Sprite('YETI SNOWBALL (round 9): the snowball a yeti packs and rolls: a big round ball of packed snow, lit from the '
               'top left, white going blue in the shade, a few clumps of snow stuck on it. A prop: r 30 at scale 1 (the '
               'game scales it by r / 30; it turns as it rolls). No parts. Front = DOWN (+y).')
    S.group("body")
    R = 74
    pts = []
    for i in range(18):
        a = math.radians(i * 20 + 4)
        r = R * (1.0, 0.97, 0.995, 0.975, 1.0, 0.965)[i % 6]
        pts.append((100 + math.cos(a) * r, 100 + math.sin(a) * r))
    ball = blob(pts, 1.0)
    lit = S.rg("#FFFFFF", "#A8C2DA", 0.36, 0.3, 0.82)
    clumps = "".join(f'<path d="{blob(p, 0.9)}" fill="{c}" opacity="{o}"/>' for p, c, o in (
        ([(124, 128), (140, 120), (152, 132), (140, 146), (126, 142)], "#7E9CBC", 0.22),
        ([(60, 120), (72, 114), (80, 124), (70, 134), (60, 130)], "#7E9CBC", 0.18),
        ([(108, 64), (122, 58), (130, 70), (118, 78), (108, 74)], "#FFFFFF", 0.7),
        ([(66, 80), (80, 74), (86, 86), (74, 92), (64, 88)], "#FFFFFF", 0.55)))
    if YETI_R10:
        S.comment = S.comment.replace("a few clumps of snow stuck on it", "smooth, three faint streaks from rolling (round 10: no lumps)")
        streaks = ('<path d="M 44 118 Q 100 140 156 112 M 58 150 Q 104 164 146 144 M 70 54 Q 108 44 138 58" fill="none" '
                   'stroke="#7E9CBC" stroke-width="4" stroke-linecap="round" opacity="0.2"/>')
        S.shape(ball, lit, shadow=False, shade=0.3,
                decor=[streaks, '<ellipse cx="74" cy="66" rx="22" ry="13" transform="rotate(-35 74 66)" fill="#FFFFFF" opacity="0.55"/>'])
        return S
    S.shape(ball, lit, shadow=False, shade=0.3,
            decor=[clumps, '<ellipse cx="74" cy="66" rx="22" ry="13" transform="rotate(-35 74 66)" fill="#FFFFFF" opacity="0.55"/>'])
    # two lumps of snow stuck on top, catching the light
    for x, y, r in ((128, 92, 13), (84, 140, 11)):
        S.shape(circ(x, y, r), S.lg("#FFFFFF", "#C4D4E4"), sh=3, op=0.2, shade=0.2)
    return S


# ---------------------------------------------------------------- the icicle wraith: Ghost B with icicles
def icicle(x, y, a, L, w):
    """An icicle hanging off an edge, seen from above as a slim point: root at (x, y), pointing along angle a (degrees,
    0 = +y), length L, half width w at the root."""
    tf = frame(x, y, a)
    return blob([(-w, 0), (w, 0), (w * 0.45, L * 0.6), (0, L, 'c'), (-w * 0.45, L * 0.6)], 0.8), tf


def wraith9():
    """critters.ghost7("b") (round 8's Ghost B, the sliver gone) as it was, the icicles added: each one drawn before the
    shroud or sleeve it hangs from, its root tucked under the edge, only the point showing."""
    S = ghost7("b")
    S.comment = ('ICICLE WRAITH (round 9): Ghost B (the pale blue spirit the designer picked, kept for the cold ghost) '
                 'as it was, with icicles hanging off its shroud: a fringe of icy points along both sides and down the '
                 'tail, two at each sleeve\'s end. ' + S.comment.replace("GHOST, wisp (round 7): ", "Ghost B: "))
    # the arms are groups 0 and 1, the body group 2: put the icicles at the start of each, so they sit under the cloth
    sleeve = [(163, 154, -8, 18, 5), (154, 159, 8, 14, 4.5)]
    side = [(58, 136, 95, 16, 5), (56, 112, 120, 18, 5.5), (62, 88, 140, 17, 5), (74, 64, 152, 14, 4.5)]
    side_r = [(142, 136, -95, 16, 5), (144, 112, -120, 18, 5.5), (138, 88, -140, 17, 5), (126, 64, -152, 14, 4.5)]
    fill = S.lg(*ICE)
    for g, pts in ((0, [(200 - x, y, -a, L, w) for x, y, a, L, w in sleeve]), (1, sleeve), (2, side + side_r)):
        keep = S.groups[g][2]
        S.groups[g][2] = []
        S.groups.append(S.groups.pop(g))   # draw into it as the last group for a moment
        for x, y, a, L, w in pts:
            d, tf = icicle(x, y, a, L, w)
            S.shape(d, fill, tf=tf, shadow=False, shade=0.15, decor=[f'<path d="M 0 0 L {f(-w * 0.5)} 0 L 0 {f(L * 0.8)} Z" '
                                                                       f'transform="{tf}" fill="#FFFFFF" opacity="0.7"/>'])
        S.groups[-1][2] += keep
        S.groups.insert(g, S.groups.pop())
    return S


BUILD = {"frost-yeti": lambda: yeti9().write("frost-yeti.svg"),
         "yeti-snowball": lambda: (lambda p: p)(_prop(snowball9(), "yeti-snowball.svg")),
         "frost-icicle-wraith": lambda: wraith9().write("frost-icicle-wraith.svg")}


def _prop(S, name):
    out = OUT.parent / "props"
    out.mkdir(parents=True, exist_ok=True)
    p = out / name
    p.write_text(S.svg(), encoding="utf-8")
    return p


if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(OUT.parent).as_posix())
