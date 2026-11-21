"""Round 8, part 2: real art for the Wildwood kinds that went into the game on placeholders, in the heroes' top-down
bust style (the A2 library the heroes were built with): a head token, shoulders, fists (or paws) in the arm parts,
weapons under the shoulder, matte, no eyes.
python wild8.py [name ...]   -> ../../<folder>/<name>.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *

INKC = "#2E2836"
CLAW = "#F4F1EA"
PINK = "#9C7E8C"   # the werewolf's dusky inner ear


# ================================================================== wolves
# The designer (round 9, the druid's Call Wolf): "I don't like the wolf sprites. They should be capsule shaped but they
# are too complex also make sure the ware wolf and them match in style." So: one capsule of a body behind the head (no
# legs drawn but the front paws), the werewolf's parts for the rest: its round skull, laid-back pointed ears with the
# dusky inner ear, the long snout with a paler stripe and pale muzzle, the dark nose with its small light dot, the
# scalloped ruff, and its paws with three white claws.
WOLVES = {
    # name: fur, snout, stripe, muzzle, tail tip, belly/ruff light
    "wolf": dict(fur="#7C7470", snout="#968E88", stripe="#B0A8A2", muzzle="#C8C0B8", tip="#4E4846", ruff="#8A827C"),
    "dire-wolf": dict(fur="#45414A", snout="#5A5660", stripe="#6E6A74", muzzle="#8E8A92", tip="#2A2630", ruff="#57525C"),
    "alpha": dict(fur="#C9C6C0", snout="#DEDAD4", stripe="#EEEBE6", muzzle="#F4F1EC", tip="#8E8A86", ruff="#E4E1DC"),
}


def tufts(cx, cy, R, n, depth=0.22, rot=0, sx=1.0, sy=1.0, t=0.55, sweep=0.0, arc=360):
    """A ring (or an arc, centred on the back) of pointed fur tufts, a mane: n tips on a circle of radius R, valleys
    depth*R further in; sweep turns each tip that many degrees towards the back (-y), so the tufts lie back."""
    pts = []
    a0 = -90 - arc / 2
    for i in range(2 * n + (0 if arc == 360 else 1)):
        a = a0 + arc * i / (2 * n)
        tip = i % 2 == 0
        r = R * (1 if tip else 1 - depth)
        if tip and sweep:
            # lean towards -y (the back): right side tips turn anticlockwise, left side clockwise; less towards the
            # back and the front, where a tip already points along the body
            ca = math.cos(math.radians(a))
            a += -sweep * ca
        pts.append((cx + r * math.cos(math.radians(a + rot)) * sx, cy + r * math.sin(math.radians(a + rot)) * sy))
    if arc != 360:
        pts.append((cx, cy))
    return blob(pts, t)


def wolf(name="wolf"):
    c = WOLVES[name]
    fur, snout, stripe, muzzle = c["fur"], c["snout"], c["stripe"], c["muzzle"]
    big = name == "alpha"
    dire = name == "dire-wolf"
    desc = {"wolf": "WOLF (round 8): a grey wolf seen from above, capsule-shaped and simple (the designer: \"capsule shaped\", "
                    "\"too complex\", \"match the werewolf\"): one rounded capsule of a body, a bushy tail with a dark "
                    "tip, the werewolf's round skull, laid-back ears, long snout with a pale muzzle and dark nose, a "
                    "scalloped ruff and two front paws with white claws. No eyes.",
            "dire-wolf": "DIRE WOLF (round 8): the wolf, black and shaggier: a black capsule body, a mane of pointed "
                         "tufts over the shoulders, the werewolf's skull, ears and snout in black and smoke grey, white "
                         "claws. No eyes. (The game draws it 1.25x the wolf.)",
            "alpha": "THE ALPHA (round 8): the giant wolf, pack leader: pale silver fur, a great mane of pointed tufts over "
                     "the shoulders, one ear torn, an old scar across the brow in one darker shade, the werewolf's skull "
                     "and snout, big paws with white claws, a long bushy tail. No eyes."}[name]
    S = Sprite(desc + " Parts: #back (tail, sways), #body, #arm-l / #arm-r (front paws, swing to walk). " + LAYOUT)
    Y = 12  # everything sits this far forward of round 8's first try, to leave the tail room
    # ---- tail
    S.group("back", (100, 52 + Y), "tail")
    tw = 17 if big else 14
    tail = blob([(100, 70 + Y), (100 + tw * 0.55, 56 + Y), (100 + tw, 30 + Y), (100 + tw * 0.85, 6 + Y), (100, -8 + Y),
                 (100 - tw * 0.85, 6 + Y), (100 - tw, 30 + Y), (100 - tw * 0.55, 56 + Y)], 0.9)
    S.shape(tail, fur, shadow=0, decor=f'<path d="{ell(100, -2 + Y, tw + 2, 15)}" fill="{c["tip"]}"/>')
    # ---- body
    S.group("body")
    hw = 40 if not big else 44
    body = rr(100, 92 + Y, hw * 2, 96, hw)
    S.shape(body, fur, shadow=0, decor=f'<path d="{ell(100, 80 + Y, hw * 0.55, 38)}" fill="{shade(fur, 0.82)}" opacity="0.5"/>')
    # ---- the mane / ruff round the neck, then the head
    if name == "wolf":
        ruff = cloud(100, 120 + Y, 40, 14, 0.52, 6)
        S.shape(ruff, c["ruff"], shadow=3, T=f"translate(100 {120 + Y}) scale(1.08 0.8) translate(-100 {-120 - Y})")
    else:
        R = 56 if big else 50
        mane = tufts(100, 114 + Y, R, 13 if big else 12, 0.2, 0, 1.0, 0.8, 0.85, sweep=20)
        S.shape(mane, c["ruff"], shadow=3)
    for s in (-1, 1):
        if big and s == 1:   # the Alpha's torn right ear: a notch bitten out of its tip
            ear = blob([(100 + s * 14, 116 + Y), (100 + s * 28, 86 + Y), (100 + s * 32, 92 + Y), (100 + s * 36, 90 + Y),
                        (100 + s * 38, 104 + Y), (100 + s * 32, 122 + Y)], 0.6)
        else:
            ear = blob([(100 + s * 14, 116 + Y), (100 + s * 30, 84 + Y), (100 + s * 38, 96 + Y), (100 + s * 32, 122 + Y)], 0.6)
        inner = blob([(100 + s * 19, 113 + Y), (100 + s * 29, 92 + Y), (100 + s * 33, 99 + Y), (100 + s * 29, 116 + Y)], 0.6)
        S.shape(ear, fur, shadow=2, sop=0.18, decor=f'<path d="{inner}" fill="{PINK}" opacity="0.75"/>')
    skull = ell(100, 128 + Y, 29, 28)
    scar = (f'<path d="M 84 {116 + Y} L 113 {139 + Y}" fill="none" stroke="{shade(fur, 0.6)}" stroke-width="5" '
            f'stroke-linecap="round"/>' if big else "")
    S.shape(skull, fur, shadow=3, sop=0.15, decor=scar)
    sn = blob([(100, 130 + Y), (112, 136 + Y), (115, 154 + Y), (110, 172 + Y), (100, 180 + Y), (90, 172 + Y), (85, 154 + Y),
               (88, 136 + Y)], 0.85)
    S.shape(sn, snout, shadow=4,
            decor=f'<path d="M 82 {156 + Y} C 90 {166 + Y} 110 {166 + Y} 118 {156 + Y} L 118 {186 + Y} L 82 {186 + Y} Z" fill="{muzzle}"/>'
                  + strokes(f"M 100 {134 + Y} L 100 {160 + Y}", stripe, 4.5, 0.7))
    S.shape(ell(100, 175 + Y, 8.5, 6.5), INKC, shadow=2, side=False,
            decor=f'<circle cx="97" cy="{173 + Y}" r="2.4" fill="#6A6278"/>')

    # ---- front paws (the werewolf's paw: a round furry pad, three short white claws forward)
    def paw(cx, cy, a, k=1.0):
        T = f"{frame(cx, cy, a)} scale({k})"
        for dx in (-6.5, 0, 6.5):
            S.shape("M -2.8 0 L 2.8 0 L 0 9 Z", CLAW, T=f"{T} translate({dx} 9)", shadow=0, side=False)
        S.shape(blob([(-12, -9), (0, -13), (12, -9), (13, 5), (0, 12), (-13, 5)], 0.9), fur, T=T, shadow=3)
    pk = 1.15 if big else 1.0
    S.group("arm-l", (70, 118 + Y), "front paw")
    paw(68, 154 + Y, 8, pk)
    S.group("arm-r", (130, 118 + Y), "front paw")
    paw(132, 154 + Y, -8, pk)
    return save("enemies", f"wild-{name}", S)


BUILD = {"wild-wolf": lambda: wolf("wolf"), "wild-dire-wolf": lambda: wolf("dire-wolf"), "wild-alpha": lambda: wolf("alpha")}

if __name__ == "__main__":
    want = sys.argv[1:] or list(BUILD)
    for n in want:
        print(BUILD[n]().relative_to(ROOT5).as_posix())
