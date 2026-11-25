"""Round 19 art lane: the fiends (imp, devil, demon, succubus). Imported by build19.py.
The game's imp, devil and demon are the round-5 drawings (art/enemies/placeholder/, headed "art the designer marked not
good"; round 9's notes call the devil and demon "stand-ins"). The approved fiend is the Pit Lord (round 10): the heroes'
bust build, a bare head lit from the top left, no eyes, a mouth that carries the face, bat wings in #back. These are
drawn the same way, each with its own silhouette so the four read apart beside the Pit Lord: the imp nearly all head with
a fireball, the devil a trident and a goatee, the demon a wall of shoulder and fist, the succubus hair and a heart-tipped
tail."""
from foes19 import *


def hi(cx, cy, rx, ry, op=0.14):
    return f'<path d="{ell(cx, cy, rx, ry)}" fill="#FFFFF4" opacity="{op}"/>'


def hand_def(key, light_, dark_):
    return (f'<radialGradient id="gHand{key}" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="{light_}"/>'
            f'<stop offset="1" stop-color="{dark_}"/></radialGradient>')


# the Pit Lord's bat wing (round 10, approved), right side, and its three bones
WING = [(118, 96), (128, 64), (150, 36), (182, 14), (204, 18), (196, 36), (206, 52), (190, 62), (196, 80), (176, 84),
        (172, 102), (150, 98), (136, 108)]
RIBS = [((122, 92), (182, 18)), ((126, 94), (198, 48)), ((130, 98), (190, 76))]


def scale_pts(pts, k, cx, cy, dx=0, dy=0):
    return [(cx + (x - cx) * k + dx, cy + (y - cy) * k + dy) for x, y in pts]


def bat_wings(S, col, rib, k=1.0, dx=0, dy=0, kx=1.0):
    """The Pit Lord's bat wings scaled k about their root (kx more across), moved by dx, dy; both sides."""
    def tr(p):
        x, y = scale_pts([p], k, 118, 96, dx, dy)[0]
        return (118 + dx + (x - 118 - dx) * kx, y)
    for s in (-1, 1):
        w = [tr(p) for p in WING]
        rb = [(tr(a), tr(b)) for a, b in RIBS]
        if s < 0:
            w = mirror(w)
            rb = [((200 - a[0], a[1]), (200 - b[0], b[1])) for a, b in rb]
        S.shape(blob(w, 0.6), col, shadow=0,
                decor=strokes(" ".join(f"M {f(a[0])} {f(a[1])} L {f(b[0])} {f(b[1])}" for a, b in rb), rib, 5 * k, 0.8))


def heart(x, y, k=1.0):
    """A heart, its point toward +y."""
    p = lambda dx, dy: f"{f(x + dx * k)} {f(y + dy * k)}"
    return (f"M {p(0, 10)} C {p(-4, 4)} {p(-15, -1)} {p(-15, -10)} C {p(-15, -18)} {p(-5, -20)} {p(0, -13)} "
            f"C {p(5, -20)} {p(15, -18)} {p(15, -10)} C {p(15, -1)} {p(4, 4)} {p(0, 10)} Z")


def thin_tail(S, col, root=(100, 84), tip=(100, 4), w0=12, w1=5, wave=0.0, end=None, end_col=None):
    """A thin tail running straight back from the body (a slight S if wave), its end a spade or a heart."""
    (x0, y0), (x1, y1) = root, tip
    n = 6
    pts = [(x0 + (x1 - x0) * i / n + wave * math.sin(i / n * math.pi * 2), y0 + (y1 - y0) * i / n) for i in range(n + 1)]
    S.shape(taper(pts, w0, w1, 0.8), col, shadow=0)
    ec = end_col or col
    kw = dict(fill=ec) if ec.startswith("url(") else dict(color=ec)
    if end == "heart":   # point toward the root
        S.shape(heart(x1, y1 - 6, 1.0), **kw, shadow=2, side=False, decor=hi(x1 - 7, y1 - 17, 4, 3, 0.35))
    elif end == "spade":
        S.shape(blob([(x1, y1 - 16), (x1 + 13, y1 + 2), (x1 + 6, y1 + 6), (x1, y1 + 3), (x1 - 6, y1 + 6), (x1 - 13, y1 + 2)], 0.55),
                **kw, shadow=2, side=False)


def fireball(S, cx, cy, r=15):
    """A ball of fire held in a hand: a round flame with a short tongue licking back (-y), a hot core."""
    d, T = flame(cx, cy + r * 0.6, 180, r * 2.5, r * 1.05)
    S.shape(d, fill="url(#gFlameUp)", T=T, shadow=0, side=False)
    S.shape(circ(cx, cy, r * 0.6), "#FFD25A", shadow=0, side=False,
            decor=f'<circle cx="{f(cx - 2)}" cy="{f(cy - 2)}" r="{f(r * 0.3)}" fill="#FFF6D0"/>')


def horn(S, pts, col, w0=18, w1=3, tip=None):
    S.shape(taper(pts, w0, w1, 0.8), col, shadow=3,
            decor=(f'<path d="{circ(pts[-1][0], pts[-1][1], 7)}" fill="{tip}" opacity="0.7"/>' if tip else ""))


def both(pts):
    return pts, mirror(pts)


def grin(S, y=132, w=24, col="#3A1218", fangs="#F4EBD8", up=6):
    """A wide sly grin: one curved line, two small fangs hanging from it."""
    S.raw(f'<path d="M {f(100 - w)} {f(y - up)} Q 100 {f(y + up)} {f(100 + w)} {f(y - up)}" fill="none" stroke="{col}" '
          f'stroke-width="3.6" stroke-linecap="round"/>')
    for x in (100 - w * 0.42, 100 + w * 0.42):
        t = (x - (100 - w)) / (2 * w)
        yy = (1 - t) ** 2 * (y - up) + 2 * (1 - t) * t * (y + up) + t * t * (y - up) + 0.5
        S.shape(poly([(x - 3.6, yy - 1), (x + 3.6, yy - 1), (x, yy + 7)]), fangs, shadow=0, side=False)


def claws(S, x, y, n=3, gap=7, L=12, col="#2E2428", a=0):
    for i in range(n):
        dx = (i - (n - 1) / 2) * gap
        S.shape(poly([(x + dx - 3.5, y), (x + dx + 3.5, y), (x + dx * 1.2 + a, y + L)]), col, shadow=0, side=False)


# ------------------------------------------------------------------ imp
def imp(opt):
    S = Sprite({"a": "IMP, round 19 option A, 'firebrand': a small fiend that is nearly all head, in the Pit Lord's build: "
                     "orange-red skin, no eyes, two little black horns swept back, long pointed ears, a wide sly grin with "
                     "two fangs, small bat wings spread behind, a thin tail straight back with a spade tip, a ball of fire "
                     "held out in the left hand (it throws them). Parts: #back (wings and tail), #arm-r (free claw), #body, "
                     "#arm-l (the hand with the fireball). ",
                "b": "IMP, round 19 option B, 'match head': the same small fiend with a flame burning on top of its head "
                     "instead of horns (a lit match), stubby wings, a darker red skin with a paler face, a wide grin, the "
                     "fireball in the left hand and the tail's spade glowing. Parts: #back (wings and tail), #arm-r (free "
                     "claw), #body, #arm-l (the hand with the fireball). "}[opt] + LAY)
    c = dict(skin="#E2683C", dskin="#A83A26", horn="#3A2A2E", wing="#8A2A32", rib="#4A1218") if opt == "a" else \
        dict(skin="#C8423A", dskin="#7E2028", horn="#3A2A2E", wing="#6A2230", rib="#3A0E18")
    S.add_def(FLAME_DEF + hand_def("Imp", light(c["skin"], 1.15), c["dskin"]))
    S.group("back", (100, 92), "wings and tail")
    if opt == "a":
        bat_wings(S, c["wing"], c["rib"], k=0.78, dx=-6, dy=6)
        thin_tail(S, c["skin"], (100, 84), (100, 6), 11, 5, end="spade")
    else:
        bat_wings(S, c["wing"], c["rib"], k=0.6, dx=-8, dy=12)
        thin_tail(S, c["skin"], (100, 84), (100, 8), 11, 5, end="spade", end_col="url(#gFlameUp)")
    S.group("arm-r", (148, 112), "free claw")
    fist(S, 150, 142, 6, w=21, h=24, hand="url(#gHandImp)")
    S.group("body")
    S.shape(blob([(58, 112), (70, 90), (100, 84), (130, 90), (142, 112), (130, 130), (100, 134), (70, 130)], 0.9), c["skin"], shadow=0)
    for s in (-1, 1):   # long pointed ears out to the sides, laid back
        ear = [(100 + s * 40, 108), (100 + s * 64, 100), (100 + s * 90, 94), (100 + s * 70, 116), (100 + s * 44, 124)]
        inner = [(100 + s * 50, 110), (100 + s * 66, 104), (100 + s * 80, 100), (100 + s * 66, 112), (100 + s * 52, 117)]
        S.shape(blob(ear, 0.7), c["skin"], shadow=2, decor=f'<path d="{blob(inner, 0.7)}" fill="{c["dskin"]}" opacity="0.5"/>')
    S.shape(HEAD, c["skin"], T="translate(100 104) scale(1.04) translate(-100 -104)", shadow=5, decor=hi(80, 70, 14, 8, 0.1))
    if opt == "a":   # two little horns on the crown, swept back
        for pts in both([(116, 70), (124, 58), (126, 44), (120, 34)]):
            horn(S, pts, c["horn"], 15, 4)
    if opt == "b":   # the flame burning on top of the head
        d, T = flame(100, 84, 180, 62, 22)
        S.shape(d, fill="url(#gFlameUp)", T=T, shadow=3, side=False)
        d2, T2 = flame(100, 80, 180, 34, 11)
        S.shape(d2, "#FFD25A", T=T2, shadow=0, side=False)
    grin(S, 140, 26)
    S.group("arm-l", (52, 112), "the hand with the fireball")
    fist(S, 50, 142, -6, w=21, h=24, hand="url(#gHandImp)")
    fireball(S, 46, 166, 16)
    return save19("imp", f"imp-{opt}", S)


# ------------------------------------------------------------------ devil
def trident(S, T, gold, shaft=70):
    """A gold-headed trident in a local frame (+y forward): a dark wooden shaft, a crossbar, three round-ended prongs."""
    S.shape(rr(0, (shaft - 40) / 2, 8, shaft + 40, 4), "#5A3A28", T=T, shadow=2)
    S.shape(rr(0, shaft + 2, 40, 10, 5), gold, T=T, shadow=2)
    for x, L in ((-15, 24), (0, 32), (15, 24)):
        S.shape(blob([(x - 4.5, shaft + 4), (x + 4.5, shaft + 4), (x + 3.5, shaft + 4 + L * 0.7), (x, shaft + 4 + L),
                      (x - 3.5, shaft + 4 + L * 0.7)], 0.7), gold, T=T, shadow=2)


def devil(opt):
    S = Sprite({"a": "DEVIL, round 19 option A, 'trident': the Pit Lord's build in crimson: no eyes, slicked black hair "
                     "coming to a widow's peak, two black horns curving out and up from the brow, a pointed black goatee, "
                     "dark red bat wings half spread behind, a tail straight back with a spade tip; a gold trident under the "
                     "right shoulder, held low and forward (it thrusts), a free left fist. Parts: #back (wings and tail), "
                     "#arm-r (trident and fist, before #body), #body, #arm-l (free fist). ",
                "b": "DEVIL, round 19 option B, 'high collar': the same devil without wings: a black cloak over the shoulders "
                     "with a tall stiff collar standing up behind the head, lined in red; the horns swept back; the goatee; "
                     "the tail straight back with its spade; the gold trident under the right shoulder. Parts: #back (the "
                     "collar and the tail), #arm-r (trident and fist, before #body), #body, #arm-l (free fist). "}[opt] + LAY)
    skin, hair, hornc, wing, rib, gold = "#C8343A", "#2A2028", "#2E2630", "#7A1E26", "#3A0E14", "#F2B53A"
    S.add_def(hand_def("Dev", "#E0505A", "#8E2028"))
    S.group("back", (100, 92), "wings and tail" if opt == "a" else "collar and tail")
    if opt == "a":
        bat_wings(S, wing, rib, k=0.84, dx=-4, dy=8, kx=0.92)
    thin_tail(S, skin, (100, 86), (100, 4), 12, 5, wave=4, end="spade")
    if opt == "b":   # the collar standing up behind the head: a broad rounded fan, red inside
        S.shape(blob([(40, 98), (38, 60), (60, 28), (100, 18), (140, 28), (162, 60), (160, 98), (100, 84)], 0.85), "#241C28",
                shadow=0, decor=f'<path d="{blob([(50, 94), (50, 62), (68, 38), (100, 30), (132, 38), (150, 62), (150, 94), (100, 82)], 0.85)}" fill="#A02434"/>')
    S.group("arm-r", (154, 108), "trident and fist")
    T = frame(158, 112, -4)
    trident(S, T, gold, 56)
    fist(S, 0, 24, T=T, w=23, h=25, hand="url(#gHandDev)")
    S.group("body")
    if opt == "a":
        S.shape(SHOULDERS, skin, decor=hi(56, 92, 20, 7, 0.12))
    else:
        S.shape(SHOULDERS, "#4A2A40", decor=hi(56, 92, 20, 7, 0.12))
    S.shape(HEAD, skin, shadow=5, decor=hi(80, 70, 14, 8, 0.12))
    hp = [(134, 92), (152, 82), (162, 64), (158, 46)] if opt == "a" else [(132, 88), (148, 74), (152, 56), (144, 40)]
    for pts in both(hp):   # the horns, out from the brow and curving up and back, over the head
        horn(S, pts, hornc, 17, 4, tip="#5A4E5A")
    S.raw('<path d="M 82 132 Q 100 140 118 132" fill="none" stroke="#4A0E16" stroke-width="3.4" stroke-linecap="round"/>')
    S.shape(blob([(90, 138), (110, 138), (106, 150), (100, 166), (94, 150)], 0.7), hair, shadow=2, side=False)
    S.group("arm-l", (46, 108), "free fist")
    fist(S, 40, 140, -6, w=23, h=25, hand="url(#gHandDev)")
    return save19("devil", f"devil-{opt}", S)


# ------------------------------------------------------------------ demon
def demon(opt):
    S = Sprite({"a": "DEMON, round 19 option A, 'ram': a wall of a fiend in the Pit Lord's build: dark plum-maroon skin "
                     "cracked through with glowing orange on the shoulders and skull, no eyes, a heavy brow, two great ram "
                     "horns curling round the sides of the head, a glowing mouth, a short thick tail straight back, two huge "
                     "fists with black claws. Parts: #back (tail), #body, #arm-l / #arm-r (fists). ",
                "b": "DEMON, round 19 option B, 'bull': the same mass as a bull of the pit: dark red-brown hide, no eyes, a "
                     "broad pale muzzle at the front with a gold ring through it, two long pale horns sweeping out wide and "
                     "forward, smouldering cracks, a shaggy dark crest on the crown, a short tail, two huge fists. Parts: "
                     "#back (tail), #body, #arm-l / #arm-r (fists). "}[opt] + LAY)
    skin, dskin = ("#7A2E46", "#3E1222") if opt == "a" else ("#7E3A2C", "#40180E")
    lava = "#FF8A2E"
    S.add_def(hand_def("Dem", light(skin, 1.25), dskin))
    S.group("back", (100, 88), "tail")
    S.shape(taper([(100, 84), (100, 60), (102, 38), (100, 24)], 26, 12, 0.8), skin, shadow=0)
    if opt == "a":
        S.shape(blob([(100, 6), (116, 26), (108, 32), (100, 28), (92, 32), (84, 26)], 0.6), skin, shadow=2, side=False)
    else:
        S.shape(cloud(100, 22, 8, 5, 0.7), "#2E1410", shadow=2, side=False)
    S.group("body")
    cracks = strokes("M 24 100 L 36 110 L 30 124 M 176 100 L 164 110 L 170 124 M 58 80 L 66 92 M 142 80 L 134 92", lava, 4, 0.95)
    S.shape("M4 112 C4 78 46 66 100 66 C154 66 196 78 196 112 C196 142 154 150 100 150 C46 150 4 142 4 112 Z", skin,
            decor=cracks + hi(50, 86, 26, 8, 0.12))
    if opt == "a":
        for s in (-1, 1):   # ram horns: from the temple back and round, curling down beside the head
            pts = [(100 + s * 34, 74), (100 + s * 56, 58), (100 + s * 76, 66), (100 + s * 80, 88), (100 + s * 68, 104), (100 + s * 54, 98)]
            S.shape(taper(pts, 24, 10, 0.85), "#C8B48E", shadow=4,
                    decor=strokes(" ".join(f"M {f(100 + s * (60 + 6 * i))} {f(56 + 10 * i)} L {f(100 + s * (52 + 6 * i))} {f(66 + 10 * i)}"
                                           for i in range(3)), "#8A7656", 3, 0.6))
    S.shape(HEAD, skin, T="translate(100 110) scale(1.0 0.9) translate(-100 -110)", shadow=5, decor=hi(80, 76, 13, 7, 0.1))
    if opt == "a":   # the glowing mouth
        S.shape("M 74 128 Q 100 138 126 128 Q 118 148 100 150 Q 82 148 74 128 Z", "#FFB23A", shadow=0, side=False,
                decor='<path d="M 70 140 L 130 140 L 130 156 L 70 156 Z" fill="#E8542A" opacity="0.7"/>')
        for x in (86, 114):
            S.shape(poly([(x - 4, 131), (x + 4, 132), (x, 141)]), "#F4EBD8", shadow=0, side=False)
    else:            # the bull: a shaggy crest, horns out wide and forward, a broad muzzle with a gold ring
        S.shape(cloud(100, 66, 18, 7, 0.6), "#2E1410", shadow=2, T="translate(100 66) scale(1.3 0.9) translate(-100 -66)")
        for pts in both([(130, 92), (156, 84), (180, 92), (192, 112), (190, 130)]):
            S.shape(taper(pts, 20, 6, 0.85), "#EFE4C6", shadow=4, decor=f'<path d="{circ(pts[-1][0], pts[-1][1], 9)}" fill="#8A7A5A" opacity="0.6"/>')
        S.shape(blob([(76, 126), (100, 120), (124, 126), (128, 146), (100, 160), (72, 146)], 0.9), light(skin, 1.3), shadow=3,
                decor=f'<path d="{ell(90, 146, 4.5, 3.5)}" fill="#2E1410"/><path d="{ell(110, 146, 4.5, 3.5)}" fill="#2E1410"/>')
        ring = circ(100, 163, 11) + " M 106.5 163 A 6.5 6.5 0 1 1 93.5 163 A 6.5 6.5 0 1 1 106.5 163 Z"
        S.shape(ring, "#F2B53A", shadow=2, side=False, rule="evenodd")
    for gid, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + s * 62, 116), "fist")
        x = 100 + s * 66
        claws(S, x, 166, 3, 10, 11, "#EFE4C6")
        fist(S, x, 150, s * 6, w=32, h=38, hand="url(#gHandDem)")
    return save19("demon", f"demon-{opt}", S)


# ------------------------------------------------------------------ succubus
def succubus(opt):
    S = Sprite({"a": "SUCCUBUS, round 19 option A, 'wings': her own sprite, not the devil turned pink: lilac-rose skin, no "
                     "eyes, a small smile, long plum hair falling down her back, two small dark horns curving back over it, "
                     "big rose bat wings spread behind, a long thin tail straight back ending in a heart; two empty hands "
                     "(she blows kisses). Parts: #back (wings, hair's end and tail), #arm-r (free hand), #body, #arm-l "
                     "(free hand). ",
                "b": "SUCCUBUS, round 19 option B, 'whip': the same lady with her hair in one high tail streaming back, the "
                     "horns swept back beside it, the wings folded small, a coiled black whip in the right hand, the "
                     "heart-tipped tail. Parts: #back (wings, hair tail and tail), #arm-r (whip and hand, before #body), "
                     "#body, #arm-l (free hand). "}[opt] + LAY)
    skin, hair, wing, rib, hornc, rose = "#E8A4C0", "#5A2A4E", "#B83A6A", "#5E1636", "#3A2A36", "#FF5AAE"
    S.add_def(hand_def("Suc", "#F6C8DA", "#C87A9A"))
    S.group("back", (100, 92), "wings, hair and tail")
    if opt == "a":
        bat_wings(S, wing, rib, k=0.9, dx=-4, dy=4)
        thin_tail(S, "#C24A6E", (100, 86), (100, 10), 9, 4, wave=6, end="heart", end_col=rose)
        S.shape(blob([(68, 86), (100, 78), (132, 86), (128, 60), (114, 40), (100, 36), (86, 40), (72, 60)], 0.85), hair, shadow=0)
    else:
        bat_wings(S, wing, rib, k=0.6, dx=-8, dy=12)
        thin_tail(S, "#C24A6E", (100, 86), (104, 12), 9, 4, wave=6, end="heart", end_col=rose)
        S.shape(taper([(100, 62), (96, 42), (104, 24), (98, 8)], 26, 8, 0.85), hair, shadow=0,
                decor=strokes("M 99 54 L 97 40 L 102 26", light(hair, 1.4), 3, 0.5))
    if opt == "b":
        S.group("arm-r", (154, 108), "whip and hand")
        T = frame(156, 132, 0)
        S.raw(f'<path d="M 0 12 C 10 30 4 50 -12 58 C -26 64 -38 56 -36 46" transform="{T}" fill="none" '
              f'stroke="#4A1A30" stroke-width="5" stroke-linecap="round"/>'
              f'<path d="M 0 14 C 9 30 3 48 -12 56" transform="{T}" fill="none" stroke="#B0607E" stroke-width="1.6" '
              f'stroke-linecap="round" opacity="0.7"/>')
        S.shape(rr(0, 2, 8, 22, 4), "#2A2028", T=T, shadow=2)
        fist(S, 0, -4, T=T, w=20, h=22, hand="url(#gHandSuc)")
    S.group("body")
    S.shape(SHOULDERS, skin, T="translate(100 108) scale(0.86 0.92) translate(-100 -108)", decor=hi(60, 92, 16, 6, 0.16))
    S.shape(HEAD, skin, shadow=5, decor=hi(80, 70, 14, 8, 0.12))
    S.shape("M 52 104 C 48 66 70 46 100 46 C 130 46 152 66 148 104 C 142 96 132 90 120 90 C 112 90 104 94 100 100 "
            "C 96 94 88 90 80 90 C 68 90 58 96 52 104 Z", hair, shadow=3, decor=hi(80, 62, 12, 5, 0.16))
    hp = [(122, 86), (132, 72), (136, 56), (130, 44)] if opt == "a" else [(120, 84), (126, 68), (124, 52), (116, 42)]
    for pts in both(hp):   # small horns from the hair at the temples, curving back
        horn(S, pts, hornc, 13, 4)
    S.raw('<path d="M 92 136 Q 100 141 108 136" fill="none" stroke="#9A3A5E" stroke-width="2.8" stroke-linecap="round"/>')
    if opt == "a":
        S.group("arm-r", (154, 108), "free hand")
        fist(S, 152, 140, 6, w=20, h=22, hand="url(#gHandSuc)")
    S.group("arm-l", (46, 108), "free hand")
    fist(S, 48, 140, -6, w=20, h=22, hand="url(#gHandSuc)")
    return save19("succubus", f"succubus-{opt}", S)


BUILD.update({"imp": (imp, "ab"), "devil": (devil, "ab"), "demon": (demon, "ab"), "succubus": (succubus, "ab")})
