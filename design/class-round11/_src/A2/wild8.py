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


# round 10 (art-round8 deck). wolf() with no extra argument is the round-8 wolf byte for byte (check10.py); each note
# is one argument:
#   paws=False        "Show me wolves without paws": the two front paws (the arm parts) left out, nothing else.
#   scar="claws"|"snout"   the Alpha, "Change face scar": the one dark line across the brow becomes three raking claw
#                     marks over the left of the skull ("claws"), or one long old scar down the snout with stitch
#                     marks ("snout").
#   mane=1.25, body=1.1    the dire wolf, "Mane not big enough. Body also 10% bigger": the tufted mane's radius x mane
#                     (its tufts longer with it), the body capsule 10% wider and longer; head, tail, paws as they were.
# round 11 (art-round10 deck, on the wolves without paws: "Bring their heads forwards a bit. Shorten body a bit. And I
# think this is good. Also show me with the pawns rendering under the body"):
#   head=7            the head (ears, skull, scar, snout, nose) 7 units further forward; the ruff or mane follows by half.
#   short=12          the body capsule 12 units shorter: its front end stays, its back end and the tail come forward.
#   paws="under"      the two front paws (the same paws, the same places) drawn before the body, so they lie under it.
#   spiky=(n, depth)  the dire wolf, "Less spikey": its big mane with fewer, shallower tufts (round 10: 12 tufts, 0.3 deep).
def wolf(name="wolf", paws=True, scar=None, mane=1.0, body=1.0, out=None, head=0, short=0, spiky=None):
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
    YT, YH, YR = Y + short, Y + head, (Y + head / 2 if head else Y)   # round 11: the tail, the head, the ruff (all Y when head = short = 0)
    # ---- tail
    S.group("back", (100, 52 + YT), "tail")
    tw = 17 if big else 14
    tail = blob([(100, 70 + YT), (100 + tw * 0.55, 56 + YT), (100 + tw, 30 + YT), (100 + tw * 0.85, 6 + YT), (100, -8 + YT),
                 (100 - tw * 0.85, 6 + YT), (100 - tw, 30 + YT), (100 - tw * 0.55, 56 + YT)], 0.9)
    S.shape(tail, fur, shadow=0, decor=f'<path d="{ell(100, -2 + YT, tw + 2, 15)}" fill="{c["tip"]}"/>')
    # ---- front paws (the werewolf's paw: a round furry pad, three short white claws forward)
    def paw(cx, cy, a, k=1.0):
        T = f"{frame(cx, cy, a)} scale({k})"
        for dx in (-6.5, 0, 6.5):
            S.shape("M -2.8 0 L 2.8 0 L 0 9 Z", CLAW, T=f"{T} translate({dx} 9)", shadow=0, side=False)
        S.shape(blob([(-12, -9), (0, -13), (12, -9), (13, 5), (0, 12), (-13, 5)], 0.9), fur, T=T, shadow=3)
    pk = 1.15 if big else 1.0
    if paws == "under":   # round 11: the paws first, so the body (the ruff, the head) lies over them
        S.group("arm-l", (70, 118 + Y), "front paw, under the body")
        paw(68, 154 + Y, 8, pk)
        S.group("arm-r", (130, 118 + Y), "front paw, under the body")
        paw(132, 154 + Y, -8, pk)
    # ---- body
    S.group("body")
    hw = 40 if not big else 44
    if body != 1.0:
        hw = hw * body
        bl = 96 * body - short
        body_d = rr(100, 140 + Y - bl / 2, hw * 2, bl, hw)   # the front end stays where it was; it grows back and out
        S.shape(body_d, fur, shadow=0, decor=f'<path d="{ell(100, 80 + Y - (bl - 96) / 2, hw * 0.55, 38 * body - short / 2)}" fill="{shade(fur, 0.82)}" opacity="0.5"/>')
    elif short:
        S.shape(rr(100, 92 + Y + short / 2, hw * 2, 96 - short, hw), fur, shadow=0,
                decor=f'<path d="{ell(100, 80 + Y + short / 2, hw * 0.55, 38 - short / 2)}" fill="{shade(fur, 0.82)}" opacity="0.5"/>')
    else:
        body = rr(100, 92 + Y, hw * 2, 96, hw)
        S.shape(body, fur, shadow=0, decor=f'<path d="{ell(100, 80 + Y, hw * 0.55, 38)}" fill="{shade(fur, 0.82)}" opacity="0.5"/>')
    # ---- the mane / ruff round the neck, then the head
    if name == "wolf":
        ruff = cloud(100, 120 + YR, 40, 14, 0.52, 6)
        S.shape(ruff, c["ruff"], shadow=3, T=f"translate(100 {120 + YR}) scale(1.08 0.8) translate(-100 {-120 - YR})")
    else:
        R = 56 if big else 50
        if mane != 1.0:
            mane_d = tufts(100, 112 + YR, R * mane, spiky[0] if spiky else 12, spiky[1] if spiky else 0.3, 0, 1.0, 0.86, 0.8, sweep=24)
            S.shape(mane_d, c["ruff"], shadow=3,
                    decor=f'<path d="{tufts(100, 114 + YR, R * mane * 0.66, spiky[0] - 1 if spiky else 11, spiky[1] * 0.8 if spiky else 0.24, 14, 1.0, 0.84, 0.8, sweep=22)}" fill="{shade(c["ruff"], 0.8)}" opacity="0.55"/>')
        else:
            mane = tufts(100, 114 + YR, R, 13 if big else 12, 0.2, 0, 1.0, 0.8, 0.85, sweep=20)
            S.shape(mane, c["ruff"], shadow=3)
    for s in (-1, 1):
        if big and s == 1:   # the Alpha's torn right ear: a notch bitten out of its tip
            ear = blob([(100 + s * 14, 116 + YH), (100 + s * 28, 86 + YH), (100 + s * 32, 92 + YH), (100 + s * 36, 90 + YH),
                        (100 + s * 38, 104 + YH), (100 + s * 32, 122 + YH)], 0.6)
        else:
            ear = blob([(100 + s * 14, 116 + YH), (100 + s * 30, 84 + YH), (100 + s * 38, 96 + YH), (100 + s * 32, 122 + YH)], 0.6)
        inner = blob([(100 + s * 19, 113 + YH), (100 + s * 29, 92 + YH), (100 + s * 33, 99 + YH), (100 + s * 29, 116 + YH)], 0.6)
        S.shape(ear, fur, shadow=2, sop=0.18, decor=f'<path d="{inner}" fill="{PINK}" opacity="0.75"/>')
    skull = ell(100, 128 + YH, 29, 28)
    scar_d = (f'<path d="M 84 {116 + YH} L 113 {139 + YH}" fill="none" stroke="{shade(fur, 0.6)}" stroke-width="5" '
              f'stroke-linecap="round"/>' if big else "")
    if scar == "claws":
        scar_d = "".join(f'<path d="M {78 + i * 9} {110 + YH - i * 3} Q {84 + i * 9} {124 + YH - i * 3} {82 + i * 9} {138 + YH - i * 3}" fill="none" '
                         f'stroke="#B48C8C" stroke-width="4.5" stroke-linecap="round"/>' for i in range(3))
    elif scar == "snout":
        scar_d = ""
    scar_kind, scar = scar, scar_d
    S.shape(skull, fur, shadow=3, sop=0.15, decor=scar)
    sn = blob([(100, 130 + YH), (112, 136 + YH), (115, 154 + YH), (110, 172 + YH), (100, 180 + YH), (90, 172 + YH), (85, 154 + YH),
               (88, 136 + YH)], 0.85)
    S.shape(sn, snout, shadow=4,
            decor=f'<path d="M 82 {156 + YH} C 90 {166 + YH} 110 {166 + YH} 118 {156 + YH} L 118 {186 + YH} L 82 {186 + YH} Z" fill="{muzzle}"/>'
                  + strokes(f"M 100 {134 + YH} L 100 {160 + YH}", stripe, 4.5, 0.7))
    if scar_kind == "snout":   # one long old scar down the right of the snout, three stitch marks across it
        S.raw(f'<path d="M 92 {112 + YH} Q 106 {136 + YH} 106 {166 + YH}" fill="none" stroke="#B48C8C" stroke-width="4.5" stroke-linecap="round"/>'
              + "".join(f'<path d="M {104 + dx} {y + YH} L {115 + dx} {y + YH - 2}" fill="none" stroke="#B48C8C" stroke-width="3" stroke-linecap="round"/>'
                        for dx, y in ((-9, 126), (-4, 140), (-3, 154))))
    S.shape(ell(100, 175 + YH, 8.5, 6.5), INKC, shadow=2, side=False,
            decor=f'<circle cx="97" cy="{173 + YH}" r="2.4" fill="#6A6278"/>')
    if head or short:
        S.comment = S.comment.replace(" Parts:", f" Round 11: the head {head} units further forward, the body {short} shorter. Parts:")
    if paws == "under":
        S.comment = S.comment.replace("#body, #arm-l / #arm-r (front paws, swing to walk)", "#arm-l / #arm-r (front paws, under the body: round 11), #body")
        return save("enemies", out or f"wild-{name}", S)
    if not paws:
        S.comment = S.comment.replace(" Parts:", " Round 10: drawn without its front paws. Parts:").replace(
            ", #arm-l / #arm-r (front paws, swing to walk)", "")
        return save("enemies", out or f"wild-{name}", S)

    pk = 1.15 if big else 1.0
    S.group("arm-l", (70, 118 + Y), "front paw")
    paw(68, 154 + Y, 8, pk)
    S.group("arm-r", (130, 118 + Y), "front paw")
    paw(132, 154 + Y, -8, pk)
    return save("enemies", out or f"wild-{name}", S)


BUILD = {"wild-wolf": lambda: wolf("wolf"), "wild-dire-wolf": lambda: wolf("dire-wolf"), "wild-alpha": lambda: wolf("alpha")}

if __name__ == "__main__":
    want = sys.argv[1:] or list(BUILD)
    for n in want:
        print(BUILD[n]().relative_to(ROOT5).as_posix())
