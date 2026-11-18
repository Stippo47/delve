import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib import *
import math

OUT = pathlib.Path(r"C:\Users\Isaiah\Dev\delve\design\class-round3")
SK = OUT / "skeleton"; SK.mkdir(parents=True, exist_ok=True)
BN = OUT / "banshee"; BN.mkdir(parents=True, exist_ok=True)

RAT = "skeleton-rattler.svg"


def balls(S, r=12.5, cx=42, cy=110):
    S.shape("ball-l", circ(cx, cy, r), "url(#gBone2)")
    S.shape("ball-r", circ(200 - cx, cy, r), "url(#gBone2)")


def empty_claw_l(S, dx=4, dy=-5):
    t = Frame(dx, dy, 0)
    for i in range(4):
        S.shape(f"hand-l-f{i}", t.path(r2_path(RAT, f"hand-l-f{i}")), "url(#gBone)", shadow=0)
    S.shape("hand-l-palm", t.path(r2_path(RAT, "hand-l-palm")), "url(#gBone)")


# ---------------------------------------------------------------- weapons (local frames)

def sword(S, fr, pre="", fist_u=26):
    p = pre
    S.shape(p + "pommel", fr.path(circ(0, 0, 6.5)), "url(#gIron)", shadow=0)
    S.shape(p + "grip", fr.path(rr(0, 17, 8, 34, 3)), "url(#gWrap)", shadow=0)
    S.shape(p + "guard", fr.path(rr(0, 41, 31, 8, 4)), "url(#gRust)")
    blade = poly([(-12.5, 45), (12.5, 45), (12.3, 66), (7.5, 70.5), (11.8, 75), (10, 86), (0, 97),
                  (-10.8, 86), (-12.5, 61), (-8, 57), (-12.5, 52.5)])
    S.shape(p + "blade", fr.path(blade), "url(#gIron)",
            decor=rust_blobs(fr, [(-5, 52, 7, 5, "a"), (6, 82, 4.5, 7, "b"), (-6, 74, 3.5, 4, "c")]))
    fist(S, p + "fist", fr, fist_u)


def rattler():
    S = Sprite('SKELETON round 3 "Rattler": closed grin, jaw shut, no collarbones (no rib-cage read). Parts in draw order: '
               '#arm-r (rusty notched sword + claw; drawn first so it sits behind the shoulder and skull), #body (skull + '
               'shoulder balls), #arm-l (empty claw). Outline from the #outline filter. Facing = DOWN (+y), centre (100,100).')
    S.group("arm-r", (160, 110))
    sword(S, Frame(162, 107, -8))
    S.group("body")
    balls(S)
    S.shape("skull", r2_path(RAT, "skull"), "url(#gSkull)", shadow=5, op=0.32, decor=r2_decor(RAT))
    S.group("arm-l", (40, 110))
    empty_claw_l(S)
    (SK / "skeleton-rattler.svg").write_text(S.svg(), encoding="utf-8")



JAW = "skeleton-rattler-jawless.svg"
LJ = "skeleton-rattler-loosejaw.svg"


def jawless_body(S):
    balls(S)
    for i in range(5):
        S.shape(f"tooth{i}", r2_path(JAW, f"tooth{i}"), "#FFF8E6", shadow=0, shade=False)
    S.shape("skull", r2_path(JAW, "skull"), "url(#gSkull)", shadow=5, op=0.32, decor=r2_decor(JAW))


def jawless_bow():
    S = Sprite('SKELETON round 3 "Rattler, no jaw" (bow): no lower jaw, upper teeth hang free. Parts in draw order: '
               '#arm-l (recurve bow, string, bow claw), #arm-r (arrow + drawing claw; the game pulls this back and '
               'should move the string middle (100,153) with it), #body (skull + shoulder balls). Bow and arrow are drawn '
               'before the body, so the limbs run behind the shoulders. Facing = DOWN (+y), centre (100,100).')
    S.group("arm-l", (40, 110))
    # bow: a round arc in front of the skull, tips curling forward-out (recurve)
    arc = [(100 + 68 * math.cos(math.radians(t)), 112 + 68 * math.sin(math.radians(t))) for t in range(162, 17, -4)]
    w = lambda t: 4.6 + 3.8 * math.sin(math.pi * t)
    tipL = bez((35.6, 133.6), (24, 133), (25, 120), 10)
    tipR = [(200 - x, y) for x, y in tipL]
    S.shape("string", poly([(25, 120), (100, 151.5), (175, 120), (175, 123), (100, 154.5), (25, 123)]),
            "#D9CFB8", shadow=0, shade=False)
    S.shape("bow-tip-l", ribbon(tipL, lambda t: 5 - 1.6 * t), "url(#gBone2)", shadow=0)
    S.shape("bow-tip-r", ribbon(tipR, lambda t: 5 - 1.6 * t), "url(#gBone2)", shadow=0)
    S.shape("bow", ribbon(arc, w), "url(#gWood)", shadow=0)
    fist(S, "fist-l", Frame(100, 180, 0), 0, w=22, h=14)
    S.group("arm-r", (160, 110))
    S.shape("shaft", rr(100, 170, 4.5, 40, 2), "url(#gWood)", shadow=0)
    S.shape("arrowhead", "M100 203 L91.5 189 C93 186.5 96 186 100 187.5 C104 186 107 186.5 108.5 189 Z", "url(#gIron)")
    fist(S, "fist-r", Frame(100, 150, 0), 0, w=20, h=13, knuck=False)
    S.group("body")
    jawless_body(S)
    (SK / "skeleton-rattler-jawless-bow.svg").write_text(S.svg(), encoding="utf-8")


def spear(S, fr, L=163, fist_u=95):
    S.shape("butt", fr.path(rr(0, 2, 9, 9, 3)), "url(#gIronD)", shadow=0)
    S.shape("shaft", fr.path(rr(0, 60, 6.5, 120, 3)), "url(#gWood)", shadow=0)
    head = "M0 {t} C-3 {a} -10.5 {b} -10.5 {c} C-10.5 {d} -5 {e} -3.4 {g} L3.4 {g} C5 {e} 10.5 {d} 10.5 {c} C10.5 {b} 3 {a} 0 {t} Z"
    head = head.format(t=L, a=L - 9, b=L - 20, c=L - 27, d=L - 33, e=L - 37, g=L - 39)
    S.shape("spearhead", fr.path(head), "url(#gIron)",
            decor=f'<path d="{fr.path(f"M0 {L} L0 {L-39} L12 {L-39} L12 {L} Z")}" fill="#4A3A36" opacity="0.22"/>' +
                  rust_blobs(fr, [(-5, L - 30, 4, 5, "a"), (4, L - 14, 3, 4, "b")]))
    S.shape("binding", fr.path(rr(0, L - 41, 9, 9, 3)), "url(#gRust)")
    fist(S, "fist-r", fr, fist_u, w=22, h=15)


def jawless_spear():
    S = Sprite('SKELETON round 3 "Rattler, no jaw" (spear): no lower jaw, upper teeth hang free. Parts in draw order: '
               '#arm-r (long spear + claw; drawn first so the shaft runs under the shoulder and its butt shows behind), '
               '#body (skull + shoulder balls), #arm-l (empty claw). Facing = DOWN (+y), centre (100,100).')
    S.group("arm-r", (160, 110))
    spear(S, Frame(171, 38, -7))
    S.group("body")
    jawless_body(S)
    S.group("arm-l", (40, 110))
    empty_claw_l(S)
    (SK / "skeleton-rattler-jawless-spear.svg").write_text(S.svg(), encoding="utf-8")


def mace(S, fr, hu=74, R=14.5):
    S.shape("handle", fr.path(rr(0, hu / 2 - 2, 8, hu + 4, 3.5)), "url(#gWood)", shadow=0)
    S.shape("collar", fr.path(rr(0, hu - 12, 11, 8, 3)), "url(#gIronD)")
    spikes = []
    for k in range(7):
        a = math.radians(25.7 + 360 / 7 * k)
        tip = (math.sin(a) * (R + 9), hu + math.cos(a) * (R + 9))
        b1 = (math.sin(a + 0.42) * (R - 1), hu + math.cos(a + 0.42) * (R - 1))
        b2 = (math.sin(a - 0.42) * (R - 1), hu + math.cos(a - 0.42) * (R - 1))
        spikes.append(poly([b1, tip, b2]))
    S.shape("spikes", fr.path(" ".join(spikes)), "url(#gIron)")
    S.shape("head", fr.path(circ(0, hu, R)), "url(#gIron)",
            decor=rust_blobs(fr, [(-5, hu + 5, 5, 4, "a"), (6, hu - 4, 3, 3.5, "b")]))
    fist(S, "fist-r", fr, 28, w=22, h=15)


def loosejaw():
    S = Sprite('SKELETON round 3 "Rattler, loose jaw" (mace): chipped dome, lower jaw hanging crooked. Parts in draw '
               'order: #arm-r (spiked mace + claw; drawn first so the handle runs under the shoulder), #body (skull, '
               'jaw, shoulder balls), #arm-l (empty claw). Facing = DOWN (+y), centre (100,100).')
    S.group("arm-r", (160, 110))
    mace(S, Frame(162, 104, -7))
    S.group("body")
    balls(S)
    S.shape("jaw", r2_path(LJ, "jaw"), "url(#gBone)", shadow=0)
    for i in range(3):
        S.shape(f"ltooth{i}", r2_path(LJ, f"ltooth{i}"), "#FFF8E6", shadow=0, shade=False)
    for i in range(4):
        S.shape(f"tooth{i}", r2_path(LJ, f"tooth{i}"), "#FFF8E6", shadow=0, shade=False)
    S.shape("skull", r2_path(LJ, "skull"), "url(#gSkull)", shadow=5, op=0.32, decor=r2_decor(LJ))
    S.group("arm-l", (40, 110))
    empty_claw_l(S)
    (SK / "skeleton-rattler-loosejaw.svg").write_text(S.svg(), encoding="utf-8")



GAP = "skeleton-gaper.svg"
BRU = "skeleton-brute.svg"


def longsword(S, fr, p, L=101, fist_u=21):
    S.shape(p + "pommel", fr.path(circ(0, 0, 5.5)), "url(#gIron)", shadow=0)
    S.shape(p + "grip", fr.path(rr(0, 14, 7, 28, 3)), "url(#gWrap)", shadow=0)
    S.shape(p + "guard", fr.path(rr(0, 32, 30, 7, 3.5)), "url(#gIronD)")
    blade = poly([(-6, 35), (6, 35), (5.6, L - 11), (0, L), (-5.6, L - 11)])
    S.shape(p + "blade", fr.path(blade), "url(#gIron)",
            decor=f'<path d="{fr.path(poly([(0, 35), (6, 35), (5.6, L - 11), (0, L)]))}" fill="#4A3A36" opacity="0.18"/>' +
                  rust_blobs(fr, [(-3, 44, 3.5, 3.5, "a"), (3, L - 28, 2.6, 5, "b")]))
    fist(S, p + "fist", fr, fist_u, w=22, h=15)


def gaper():
    S = Sprite('SKELETON round 3 "Gaper": hunched scavenger, long narrow skull, jaw hanging open, angry slanted sockets, '
               'vertebrae trailing behind. Two long swords, one per hand, both drawn before the body so they run under the '
               'shoulders and come out forward, spread apart. Draw order: #back (vertebrae), #arm-l, #arm-r, #body. '
               'Facing = DOWN (+y), centre (100,100).')
    S.group("back", (100, 52))
    for i in range(3):
        S.shape(f"vert{i}-w", r2_path(GAP, f"vert{i}-w"), "url(#gBone2)", shadow=0)
        S.shape(f"vert{i}", r2_path(GAP, f"vert{i}"), "url(#gBone2)", shadow=2.5)
    S.group("arm-l", (40, 100))
    longsword(S, Frame(157, 103, 14, mirror=True), "l-")
    S.group("arm-r", (160, 100))
    longsword(S, Frame(157, 103, 14), "r-")
    S.group("body")
    for side in "lr":
        S.shape(f"collar-{side}", r2_path(GAP, f"collar-{side}"), "url(#gBone2)", shadow=0)
    for side in "lr":
        S.shape(f"knobA-{side}", r2_path(GAP, f"knobA-{side}"), "url(#gBone2)", shadow=0)
    for side in "lr":
        S.shape(f"knobB-{side}", r2_path(GAP, f"knobB-{side}"), "url(#gBone2)", shadow=2.5)
    S.shape("jaw", r2_path(GAP, "jaw"), "url(#gBone)", shadow=0)
    for i in range(4):
        S.shape(f"ltooth{i}", r2_path(GAP, f"ltooth{i}"), "#FFF8E6", shadow=0, shade=False)
    for i in range(5):
        S.shape(f"tooth{i}", r2_path(GAP, f"tooth{i}"), "#FFF8E6", shadow=0, shade=False)
    sockL = "M68.5 99 L93.5 109 C95.5 115 91.5 123 83 123.5 C74 124 67.5 116 68 107 C68 104 68.2 101 68.5 99 Z"
    sockR = Frame(0, 0, 0, mirror=True).path(sockL)
    nose = "M 100 118 C 102.5 121.5 105.5 125 106 128 C 106.5 131 104 132 102.2 130.6 L 100 129 L 97.8 130.6 C 96 132 93.5 131 94 128 C 94.5 125 97.5 121.5 100 118 Z"
    brow = ('<path d="M64 92 L96 104.5 L96 108 L64 97 Z" fill="#8A7454" opacity="0.28"/>'
            '<path d="M136 92 L104 104.5 L104 108 L136 97 Z" fill="#8A7454" opacity="0.28"/>')
    decor = ('<rect x="40" y="30" width="120" height="140" fill="url(#gDome)"/>' + brow +
             f'<path d="{sockL}" fill="url(#gSock)"/><path d="{sockR}" fill="url(#gSock)"/><path d="{nose}" fill="url(#gSock)"/>')
    S.shape("skull", r2_path(GAP, "skull"), "url(#gSkull)", shadow=5, op=0.32, decor=decor)
    (SK / "skeleton-gaper.svg").write_text(S.svg(), encoding="utf-8")


def axe(S, fr):
    S.shape("haft", fr.path(rr(0, 52, 8.5, 110, 4)), "url(#gWood)", shadow=0)
    S.shape("axe-spike", fr.path("M-4 82 L-15 88 L-4 95 Z"), "url(#gIronD)", shadow=0)
    blade = "M3 78 L12 79 C19 73 26 68 33 63 C43 76 45 102 34 116 C26 110 19 103 12 99 L3 99 Z"
    S.shape("axe-head", fr.path(blade), "url(#gIron)",
            decor=f'<path d="{fr.path("M30 61 C40 76 42 102 32 118 L48 118 L48 61 Z")}" fill="#E8E2DA" opacity="0.55"/>' +
                  rust_blobs(fr, [(10, 86, 5, 4.5, "a"), (20, 102, 3.5, 3, "b")]))
    S.shape("axe-collar", fr.path(rr(0, 89, 11, 22, 3)), "url(#gIronD)")
    fist(S, "fist-r", fr, 46, w=24, h=16)


def round_shield(S, cx, cy, R):
    plank = "".join(f'<rect x="{f(cx - R + i * 2 * R / 3)}" y="{f(cy - R)}" width="{f(2 * R / 3)}" height="{f(2 * R)}" '
                    f'fill="{c}" opacity="0.5"/>' for i, c in enumerate(["#B88456", "#8E5F38", "#A9774A"]))
    S.shape("shield", circ(cx, cy, R), "url(#gWood)", shadow=4,
            decor=plank + f'<path d="{circ(cx, cy, R)} {circ(cx, cy, R - 5.5)}" fill-rule="evenodd" fill="url(#gIronD)"/>'
                  + f'<ellipse cx="{f(cx - R * 0.55)}" cy="{f(cy + R * 0.62)}" rx="5" ry="4" fill="#A04E24" opacity="0.9"/>'
                  + f'<ellipse cx="{f(cx + R * 0.8)}" cy="{f(cy - R * 0.2)}" rx="3.5" ry="5" fill="#C0662E" opacity="0.9"/>')
    S.shape("boss", circ(cx, cy, 8.5), "url(#gIron)", shadow=2.5,
            decor=f'<circle cx="{f(cx - 2.5)}" cy="{f(cy - 2.5)}" r="3" fill="#FFFFFF" opacity="0.35"/>')


def brute():
    S = Sprite('SKELETON round 3 "Brute": heavy skull with tusks and an underbite, big shoulder balls. Right claw: a '
               'rusty bearded axe, drawn before the body so the haft runs under the shoulder. Left: a round wooden shield '
               'with an iron rim and boss, drawn after the body (in front); the claw behind it is hidden. Draw order: '
               '#arm-r, #body, #arm-l. Facing = DOWN (+y), centre (100,100).')
    S.group("arm-r", (162, 104))
    axe(S, Frame(167, 86, -5))
    S.group("body")
    for side in "lr":
        S.shape(f"collar-{side}", r2_path(BRU, f"collar-{side}"), "url(#gBone2)", shadow=0)
    for side in "lr":
        S.shape(f"ball-{side}", r2_path(BRU, f"ball-{side}"), "url(#gBone2)")
    S.shape("skull", r2_path(BRU, "skull"), "url(#gSkull)", shadow=5, op=0.32, decor=r2_decor(BRU))
    S.shape("jaw", r2_path(BRU, "jaw"), "url(#gBone)", shadow=4)
    for i in range(4):
        S.shape(f"ltooth{i}", r2_path(BRU, f"ltooth{i}"), "#FFF8E6", shadow=0, shade=False)
    for side in "lr":
        S.shape(f"tusk-{side}", r2_path(BRU, f"tusk-{side}"), "#FFF8E6", shadow=3, op=0.28, shade=False)
    S.group("arm-l", (38, 104))
    fist(S, "fist-l", Frame(50, 142, 0), 0, w=24, h=16)
    round_shield(S, 50, 151, 33)
    (SK / "skeleton-brute.svg").write_text(S.svg(), encoding="utf-8")



HOL = "skeleton-hollow.svg"
GHOST_DEFS = [
    '<linearGradient id="gGhost" x1="40" y1="0" x2="165" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#F3FBF8"/><stop offset="0.55" stop-color="#C6E2E0"/><stop offset="1" stop-color="#8FB4BD"/></linearGradient>',
    '<linearGradient id="gGhostFade" x1="0" y1="80" x2="0" y2="-5" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.55"/></linearGradient>',
    '<linearGradient id="gCowl" x1="40" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#E4F3F1"/><stop offset="0.6" stop-color="#AFCFD1"/><stop offset="1" stop-color="#7EA3AE"/></linearGradient>',
    '<linearGradient id="gHair" x1="40" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#F4F1FA"/><stop offset="0.6" stop-color="#CFC8E2"/><stop offset="1" stop-color="#9F96BC"/></linearGradient>',
    '<linearGradient id="gBoneG" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#F3EEE0"/><stop offset="1" stop-color="#CFC6B0"/></linearGradient>',
]
SK_DY = 6


def wisp(x0, y0, x1, y1, w0, amp, ph, n=28, curl=1.0):
    pts = []
    for k in range(n + 1):
        t = k / n
        x = x0 + (x1 - x0) * t + amp * math.sin(math.pi * (1.3 * t) + ph) * t ** curl
        y = y0 + (y1 - y0) * t
        pts.append((x, y))
    return ribbon(pts, lambda t: w0 * (1 - t) ** 0.75 + 2.2)


def robe(S, fill="url(#gGhost)"):
    body = ("M36 136 C24 112 28 80 44 58 C54 44 52 30 40 14 C56 18 66 30 72 42 C74 26 82 10 104 -2 "
            "C100 12 110 28 128 42 C132 28 142 18 160 12 C150 28 150 44 158 58 C172 80 176 112 164 136 "
            "C142 156 58 156 36 136 Z")
    S.shape("robe", body, fill, shadow=0,
            decor='<rect x="0" y="-10" width="200" height="100" fill="url(#gGhostFade)"/>')


def ghost_skull(S, extra=""):
    S.shape("skull", Frame(0, SK_DY, 0).path(r2_path(HOL, "skull")), "url(#gSkull)", shadow=5, op=0.3,
            decor=f'<g transform="translate(0 {SK_DY})">{r2_decor(HOL)}</g>' + extra)


def ghost_arm(S, side):
    m = side == "r"
    fr = Frame(0, 0, 0, mirror=m)
    pre = f"{side}-"
    for i, (dx, ang, ln) in enumerate([(-8, -26, 21), (0, -3, 25), (8, 22, 21)]):
        ff = Frame(53 + dx, 164, ang, mirror=m)
        claw = f"M-2.6 -4 L2.6 -4 L1.6 {ln - 4} L0 {ln} L-1.6 {ln - 4} Z"
        S.shape(pre + f"finger{i}", ff.path(claw), "url(#gBone2)", shadow=0)
    S.shape(pre + "palm", fr.path(rr(53, 162, 21, 13, 5.5)), "url(#gBone2)", shadow=2.5)
    sleeve = "M38 112 C35 128 38 144 43 156 L48 150 L53 158 L58 150 L63 156 C65 140 67 126 67 114 Z"
    S.shape(pre + "sleeve", fr.path(sleeve), "url(#gGhost)", shadow=3)


HOOD_IN = "M141 167 C141 140 139 114 129 104 C119 96 81 96 71 104 C61 114 59 140 59 167"


def banshee(kind):
    hood = kind == "hood"
    desc = ("a ragged hood over the dome, the face showing in its opening" if hood else
            "long wispy hair parted over the dome, streaming back and hanging beside the face")
    S = Sprite(f'BANSHEE round 3 ({kind}): floating ghost built on the Hollow skull (big deep sockets), {desc}, a tattered '
               'body trailing off behind (up) in five wisps, no legs. Arms reach forward: ragged sleeves with long bony '
               'fingers. Draw order: #body (wisps, torso, ' + ('skull, hood' if hood else 'back hair, skull, front hair') +
               '), #arm-l, #arm-r (each a sleeve + bony hand). Facing = DOWN (+y), centre (100,100).')
    S.extra_defs += GHOST_DEFS
    S.group("body")
    robe(S)
    if not hood:
        back = ("M62 92 C58 66 68 44 80 30 C86 20 82 10 72 2 C88 6 96 16 100 26 C104 14 114 6 130 4 "
                "C120 12 116 22 120 32 C132 46 142 66 138 92 Z")
        S.shape("hair-back", back, "url(#gHair)", shadow=0)
        ghost_skull(S)
        front = ("M61 106 C55 78 72 52 100 50 C128 52 145 78 139 106 C144 128 148 148 157 166 "
                 "C146 162 139 150 137 132 C136 114 130 92 110 82 C106 82 103 84 100 88 C97 84 94 82 90 82 C70 92 64 114 63 132 "
                 "C61 150 54 162 43 166 C52 148 56 128 61 106 Z")
        S.shape("hair-front", front, "url(#gHair)", shadow=3.5, op=0.3)
    else:
        ghost_skull(S, extra=f'<path d="{HOOD_IN}" fill="none" stroke="#2B2230" stroke-opacity="0.45" stroke-width="12"/>')
        cowl = ("M47 166 C39 140 39 112 41 88 C43 58 62 40 84 32 C92 26 96 18 102 10 C104 20 108 26 116 32 C138 40 157 58 159 88 C161 112 161 140 153 166 "
                "L147 157 L141 167 C141 140 139 114 129 104 C119 96 81 96 71 104 C61 114 59 140 59 167 L53 157 Z")
        S.shape("cowl", cowl, "url(#gGhost)", shadow=4, op=0.3)
    for side in "lr":
        S.group(f"arm-{side}", (52, 114) if side == "l" else (148, 114))
        ghost_arm(S, side)
    (BN / f"banshee-{kind}.svg").write_text(S.svg(), encoding="utf-8")


def banshee_hair():
    banshee("hair")


def banshee_hood():
    banshee("hood")


if __name__ == "__main__":
    which = sys.argv[1:] or ["rattler"]
    for w in which:
        globals()[w]()
