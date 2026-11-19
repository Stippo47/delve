"""Round-4 fixes for the rogues and farmers. python rf.py [name ...]"""
import sys, re
from fx import *

RECT_FIST = re.compile(r'<rect x="[-\d.]+" y="[-\d.]+" width="24" height="21" rx="8" '
                       r'transform="rotate\((?P<r>[-\d.]+) (?P<cx>[-\d.]+) (?P<cy>[-\d.]+)\)" fill="url\(#gHand\)"/>'
                       r'(?P<u><rect x="[-\d.]+" y="[-\d.]+" width="24" height="21" rx="8" transform="rotate\([^)]*\)" fill="url\(#gUnder\)"/>)?')


def fist_at(cx, cy, rot, side, under=True):
    d = frame(fist_d(side), cx, cy, rot)
    s = f'<path d="{d}" fill="url(#gHand)"/>'
    if under:
        s += f'<path d="{d}" fill="url(#gUnder)"/>'
    return s


def refist_group(svg, gid, override=None):
    """Swap the rotated-rect fists inside one weapon arm for fists wrapped round the handle.
    override: list of (cx, cy, rot) to use instead of the old centre/angle, in order."""
    g = get_group(svg, gid)
    n = [0]

    def rep(m):
        cx, cy, r = float(m.group("cx")), float(m.group("cy")), float(m.group("r"))
        if override:
            cx, cy, r = override[n[0]]
        n[0] += 1
        side = -1 if cx < 100 else 1
        return fist_at(cx, cy, r, side, under=bool(m.group("u")))
    g2 = RECT_FIST.sub(rep, g)
    if n[0] == 0:
        raise SystemExit(f"no fist in {gid}")
    return set_group(svg, gid, g2)


# ---------------------------------------------------------------- rogues
def bandit():
    s = read3("rogue", "rogue-bandit-mask")
    s = refist_group(s, "arm-r")
    s = set_comment(s, "Round 4: hand rule - the cutlass fist wraps the grip, long along the handle, knuckles on the outer side.")
    write4("rogue", "rogue-bandit-mask", s)


def shade():
    s = read3("rogue", "rogue-shade-cape-crossed")
    s = refist_group(s, "arm-l")
    s = refist_group(s, "arm-r")
    s = set_comment(s, "Round 4: crossed daggers kept; hand rule only - each fist wraps its grip along the handle.")
    write4("rogue", "rogue-shade-cape-crossed", s)


# a hooked blade that curves in toward the sprite's centre line (+x in the left hand's frame)
HOOK = "M -9 9 C -10.5 26 -6 44 12 57 C 15 58.5 17 57 15 54 C 6 44 5 28 9 9 Z"


def twinfang():
    s = read3("rogue", "rogue-twinfang")
    for gid, (tx, ty, rot), side in [("arm-l", (40, 144, 9), -1), ("arm-r", (160, 144, -9), 1)]:
        g = get_group(s, gid)
        blade = HOOK if side < 0 else mirror_x(HOOK)
        g = sub1(g, '<path d="M-11 9 L-11 34 L0 58 L11 34 L11 9 Z" fill="url(#gSteel)"/>',
                 f'<path d="{blade}" fill="url(#gSteel)"/>')
        nrot = 2 if side < 0 else -2
        g = g.replace(f"translate({tx} {ty}) rotate({rot})", f"translate({tx} {ty}) rotate({nrot})")
        s = set_group(s, gid, g)
        s = refist_group(s, gid, override=[(tx, ty - 4, nrot)])
    s = set_comment(s, "Round 4: hooked daggers - each blade curves in toward the centre line and ends in a hooked tip; the fists wrap the grips along the handle.")
    write4("rogue", "rogue-twinfang", s)


# ---------------------------------------------------------------- farmers
def digger():
    s = read3("farmer", "farmer-digger")
    # slid 15 units down the handle so the turned fist still shows past the body's edge
    s = refist_group(s, "arm-r", override=[(64.9 + 0.812 * 15, 136.94 + 0.584 * 15, -54.335)])
    s = set_comment(s, "Round 4: hand rule - the fist wraps the spade handle along its length.")
    write4("farmer", "farmer-digger", s)


def grandpa():
    s = read3("farmer", "farmer-grandpa-sickle")
    # the sickle handle is upright (x about 161.5, y 122-159); the fist was tilted -8 degrees off it
    s = refist_group(s, "arm-r", override=[(161.5, 136, 0)])
    s = set_comment(s, "Round 4: hand rule - the fist is turned to the sickle's upright handle and wraps it.")
    write4("farmer", "farmer-grandpa-sickle", s)


def granny(up=80, low=107):
    s = read3("farmer", "farmer-granny-reaper")
    # the snath runs from (192,68) at 19.5 degrees; the fists sat 64 and 102 along it. Now further down the shaft.
    import math
    a = math.radians(19.5)
    P = lambda d: (192 - math.sin(a) * d, 68 + math.cos(a) * d)
    (x1, y1), (x2, y2) = P(up), P(low)
    s = refist_group(s, "arm-r", override=[(x1, y1, 19.5), (x2, y2, 19.5)])
    s = set_comment(s, f"Round 4: both hands hold further down the shaft ({up} and {low} along the snath, were 64 and 102); each fist wraps the snath.")
    write4("farmer", "farmer-granny-reaper", s)


def haymaker():
    s = read3("farmer", "farmer-haymaker-fork")
    g = get_group(s, "arm-r")
    for old in ['fill="#6E7480"', 'fill="#7E8592"', 'fill="url(#gMatte)"']:
        g = g.replace(old, 'fill="url(#gFork)"')
    s = set_group(s, "arm-r", g)
    s = add_defs(s, '<linearGradient id="gFork" x1="-27" y1="0" x2="27" y2="0" gradientUnits="userSpaceOnUse">'
                    '<stop offset="0" stop-color="#B4BAC4"/><stop offset="1" stop-color="#7E8592"/></linearGradient>')
    s = refist_group(s, "arm-r")
    s = set_comment(s, "Round 4: the fork head is one colour (socket, crossbar and tines share one soft grey); the fist wraps the handle.")
    write4("farmer", "farmer-haymaker-fork", s)


if __name__ == "__main__":
    for n in sys.argv[1:] or ["bandit", "shade", "twinfang", "digger", "grandpa", "granny", "haymaker"]:
        globals()[n]()
    print("ok")
