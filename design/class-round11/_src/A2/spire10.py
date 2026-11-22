"""Round 10, the art-round9 notes on the Gilded Spire:
  the choir sprite   "Weird hair": spire9.choir_sprite(hair10=True), the round-4 cherub's hair;
  the fallen angel   "Meh. I think u could do better": drawn again on the picked angel's build (its two-layer wings);
  the golem          "First get down basic golems body. Make 3 variants. Then make gilded. Note I love the eye.": three
                     bodies, each with the eye (the diamond rune) where it was, and each one gilded;
  the Twin Heralds   "Meh. Could do better. More interesting design (and better quality)": drawn again as heralds: a
                     crested helm, layered pauldrons, a standard (a spear with a banner), the picked angel's wings.
python spire10.py [name ...]   -> ../../enemies/spire-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *
import spire9 as S9
from spire9 import ASH_FACE, STONE, DSTONE, stone

# the picked angel's wing (round 4's Angel, the designer's pick): two layered shapes, a few big scallops each
WING_OUT = [(118, 92), (140, 66), (170, 44), (200, 30), (204, 46), (198, 62), (202, 72), (190, 84), (192, 96), (178, 104),
            (176, 116), (160, 116), (152, 124), (134, 112)]
WING_IN = [(122, 92), (142, 74), (166, 58), (174, 70), (166, 82), (168, 94), (154, 98), (150, 108), (132, 106)]
# the same wing torn: sharper tips, a bite out of the trailing edge
RAG_OUT = [(118, 92), (138, 68), (166, 48), (198, 28), (192, 48), (204, 56), (188, 66), (198, 82), (180, 84), (186, 102),
           (168, 98), (166, 118), (152, 106), (146, 124), (134, 110)]
RAG_IN = [(122, 92), (142, 74), (168, 56), (166, 72), (174, 80), (160, 86), (164, 100), (150, 98), (146, 110), (132, 104)]


def wings(S, col, dcol, ragged=False, k=1.0, dy=0, broken=None):
    """Both wings in #back. k scales them about the middle of the back; broken = the side (+1 / -1) whose wing is half
    gone (its outer layer cut short)."""
    T = f"translate(100 {92 + dy}) scale({k}) translate(-100 -92)"
    for s in (1, -1):
        out, inn = (RAG_OUT, RAG_IN) if ragged else (WING_OUT, WING_IN)
        if broken == s:
            out = [(118, 92), (138, 70), (158, 56), (172, 60), (166, 72), (178, 78), (166, 88), (172, 102), (158, 100), (154, 116), (134, 110)]
            inn = [(122, 92), (140, 76), (154, 70), (152, 82), (160, 90), (148, 94), (146, 106), (132, 104)]
        if s < 0:
            out, inn = mirror(out), mirror(inn)
        S.shape(blob(out, 0.5 if ragged else 0.7), col, T=T, shadow=0)
        S.shape(blob(inn, 0.5 if ragged else 0.7), dcol, T=T, shadow=3, sop=0.2)


def halo(S, col, cx=100, cy=62, rx=37, ry=31, w=9, gap=None, rot=0):
    """A halo ring seen from above, drawn as a thick stroke (the outline filter rings it); gap = (a0, a1) degrees left
    open (a broken halo)."""
    a0, a1 = (gap[1], gap[0] + 360) if gap else (0, 359.9)
    def pt(a):
        return cx + rx * math.cos(math.radians(a)), cy + ry * math.sin(math.radians(a))
    (x0, y0), (xm, ym), (x1, y1) = pt(a0), pt((a0 + a1) / 2), pt(a1)
    d = f"M {f(x0)} {f(y0)} A {rx} {ry} 0 0 1 {f(xm)} {f(ym)} A {rx} {ry} 0 0 1 {f(x1)} {f(y1)}"
    tr = f' transform="rotate({rot} {cx} {cy})"' if rot else ""
    S.raw(f'<path d="{d}" fill="none" stroke="{shade(col, 0.72)}" stroke-width="{w}" stroke-linecap="round"{tr}/>'
          f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w - 3.5}" stroke-linecap="round"{tr} transform-origin="0 0"/>')


# ================================================================== the fallen angel
def fallen_angel():
    S = Sprite("FALLEN ANGEL (round 10): one of the host, fallen, on the picked angel's build: ashen skin, no eyes, long "
               "black hair with a pale streak, a broken halo of tarnished gold hanging askew over its head; a dark violet "
               "robe with a ragged cowl; the angel's two-layer wings gone dark and torn, the left one half gone (#back, "
               "sway); a black glaive with a pale violet blade under the right shoulder (arm-r, it thrusts), the left hand "
               "free (arm-l). " + LAYOUT)
    S.add_def(ASH_FACE)
    ROBE, HAIR = "#4E4460", "#2A2430"
    S.group("back", (100, 90), "torn wings")
    wings(S, "#4A4060", "#6E6090", ragged=True, broken=-1, k=0.97)
    S.group("arm-r", PR, "glaive")
    T = frame(158, 102, 5)
    S.shape(rr(0, -8, 9, 100, 4.5), "#3A3442", T=T, shadow=0)
    S.shape(rr(0, 40, 15, 10, 3.5), "#8E6AB8", T=T, shadow=1)
    bl = [(-6, 44), (9, 44), (17, 58), (16, 78), (2, 98), (-8, 74), (-9, 56)]
    S.shape(blob(bl, 0.75), "#C4A8EC", T=T, shadow=2,
            decor=f'<path d="{blob([(2, 44), (9, 44), (17, 58), (16, 78), (2, 98)], 0.75)}" fill="#7A5AB0" opacity="0.5"/>')
    fist(S, 0, 0, T=T, hand="url(#gHandAsh)")
    S.group("body")
    S.shape(SHOULDERS, ROBE, decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", "#8E6AB8", 4, 0.9))
    cowl = blob([(38, 112), (44, 88), (66, 76), (100, 73), (134, 76), (156, 88), (162, 112), (150, 124), (140, 112), (128, 126),
                 (114, 114), (100, 128), (86, 114), (72, 126), (60, 112), (50, 124)], 0.7)
    S.shape(cowl, shade(ROBE, 0.8), shadow=3)
    head(S, face="url(#gFaceAsh)")
    mouth(S, 137, "#6E6070")
    S.shape(blob([(50, 124), (46, 84), (60, 56), (100, 44), (140, 56), (154, 84), (150, 124), (142, 104), (132, 88), (116, 82),
                  (100, 90), (84, 82), (68, 88), (58, 104)], 0.85), HAIR, shadow=4,
            decor=strokes("M 100 48 L 100 88", "#5E5470", 3, 0.6) + strokes("M 118 50 C 130 62 138 80 142 104", "#B8ACC6", 4.5, 0.75))
    halo(S, "#C9A548", cy=52, rx=31, ry=19, w=7, gap=(28, 70), rot=-6)
    S.group("arm-l", PL, "free hand")
    fist(S, 50, 146, -6, hand="url(#gHandAsh)")
    return save("enemies", "spire-fallen-angel", S)


# ================================================================== the Twin Heralds
# round 11 (art-round10 deck, the Twin Heralds. The Fallen: "Make face more interesting. Make the spear flag smaller, and
# have them hold the spear lower down on the handle and forwards more Hand also looks off". The Herald of Light: "Reduce
# the shadow of face. Same spear flag. Idea is to have them both have bangs but 1 is down 1 way and the other has it the
# other way. Don't like hands"): herald(fallen, r11=True), each change marked CHANGE11:
#   flag     the pennant 0.6x its size, tied at the same place under the blade.
#   hold     the fist was hidden under the pauldrons; it grips the shaft 34 units further down it (forward), in front
#            of the shoulder where a hero's weapon hand shows, and the whole standard is 3 units further forward.
#   hands    both hands are the heroes' own fists (their size, skin), no plate block and cuff.
#   bangs    a swept fringe of hair under the helm's brow: the Herald of Light's falls to its right, the Fallen's to its left.
#   face     Light: the brow's shade is the heroes' lightest (no dark band under the helm, a fainter cast shadow).
#            Fallen: under the bangs, a jagged violet crack runs down the bare cheek from the brow.
GFACE_LIT = ('<linearGradient id="gFaceLit" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#E2B08C"/><stop offset="0.3" stop-color="#F0C49C"/><stop offset="0.6" stop-color="#F4CBA6"/>'
             '<stop offset="1" stop-color="#E9BB96"/></linearGradient>')


def herald(fallen, r11=False):
    if fallen:
        p = dict(wing="#3E3648", dwing="#5A5068", robe="#4A4256", plate="#3A3644", edge="#8E6AB8", helm="#2E2A36", crest="#8E6AB8",
                 banner="#2E2836", mark="#B89AE0", shaft="#3A3442", blade="#C4A8EC", bdk="#7A5AB0", face="url(#gFaceAsh)",
                 hand="url(#gHandAsh)")
    else:
        p = dict(wing="#FFFFFF", dwing="#E6E2EE", robe="#F4EFE4", plate="#F2C24A", edge="#FFF2C0", helm="#F2C24A", crest="#FFFFFF",
                 banner="#FBF8F0", mark="#F2B53A", shaft="#C99A3A", blade="#FFF2C4", bdk="#D8A83A", face="url(#gFace)",
                 hand="url(#gHand)")
    name = "FALLEN HERALD" if fallen else "HERALD OF LIGHT"
    look = ("its fallen twin, the same shape: black plate edged violet, a black helm with a violet crest, the wings dark "
            "and torn, a black standard with a violet mark" if fallen else
            "white and gold: gold plate edged pale, a gold helm with a white crest, great white wings, a white standard "
            "with a gold sun")
    S = Sprite(f"{name} (round 10): one of the Twin Heralds, the Choir Halls' mini-boss pair, drawn again as a herald in "
               f"the heroes' bust build, no eyes: a helm with a tall fan crest standing up from brow to nape, two layered "
               f"pauldrons a side, a gorget; the picked angel's two-layer wings, bigger (#back, sway); its standard under "
               f"the right shoulder: a long spear with a swallow-tailed pennant flying out from under the blade (arm-r, it "
               f"thrusts); a gauntleted left fist (arm-l). {look}. " + LAYOUT)
    if fallen:
        S.add_def(ASH_FACE)
    if r11:
        S.comment = S.comment.replace("(round 10)", "(round 11: bangs under the helm, a smaller pennant, the spear held further "
                                      "down its shaft in a plain fist; round 10)")
        if not fallen:
            S.add_def(GFACE_LIT)
    S.group("back", (100, 90), "wings")
    wings(S, p["wing"], p["dwing"], ragged=fallen, k=0.98, dy=-6)
    S.group("arm-r", PR, "the standard")
    T = frame(160, 101 if r11 else 98, 4)   # CHANGE11 hold: 3 units further forward
    S.shape(rr(0, -6, 9, 108, 4.5), p["shaft"], T=T, shadow=0)
    # the banner: a swallow-tailed pennant tied under the blade, flying out to the side
    ban = [(3, 44), (3, 22), (22, 20), (44, 14), (34, 31), (46, 46), (22, 44)]
    mark = (f'<circle cx="18" cy="32" r="6.5" fill="{p["mark"]}"/>' if not fallen else
            f'<path d="M 18 23 L 25 32 L 18 41 L 11 32 Z" fill="{p["mark"]}"/>')
    if r11:   # CHANGE11 flag: 0.6x, about the point where it is tied under the blade
        S.shape(blob(ban, 0.5), p["banner"], T=f"{T} translate(3 44) scale(0.6) translate(-3 -44)", shadow=2, decor=mark)
    else:
        S.shape(blob(ban, 0.5), p["banner"], T=T, shadow=2, decor=mark)
    S.shape(rr(0, 46, 16, 10, 3.5), p["plate"] if not fallen else p["edge"], T=T, shadow=1)
    b = [(-12, 50), (12, 50), (13, 70), (0, 102), (-13, 70)]
    S.shape(blob(b, 0.7), p["blade"], T=T, shadow=2,
            decor=f'<path d="{poly([(0, 50), (12, 50), (13, 70), (0, 102)])}" fill="{p["bdk"]}" opacity="0.45"/>')
    if r11:   # CHANGE11 hold, hands: a hero's fist, further down the shaft where it shows in front of the shoulder
        fist(S, 0, 34, T=T, hand=p["hand"])
    else:
        fist(S, 0, 0, T=T, hand=p["plate"] if not fallen else "#5E5470")
    S.group("body")
    S.shape(SHOULDERS, p["robe"], decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", p["edge"] if fallen else GOLD, 4, 0.9))
    for s in (-1, 1):   # two layered pauldrons a side: the lower, then the upper over it
        lo = [(100 + s * 40, 100), (100 + s * 62, 92), (100 + s * 84, 102), (100 + s * 86, 120), (100 + s * 66, 130), (100 + s * 44, 120)]
        up = [(100 + s * 32, 84), (100 + s * 58, 76), (100 + s * 80, 86), (100 + s * 82, 104), (100 + s * 60, 112), (100 + s * 38, 104)]
        for pts, sh in ((lo, 0.88), (up, 1.0)):
            S.shape(blob(pts, 0.85), shade(p["plate"], sh) if sh < 1 else p["plate"], shadow=4,
                    decor=strokes(f"M {pts[5][0]} {pts[5][1]} Q {pts[4][0]} {pts[4][1] + 2} {pts[3][0]} {pts[3][1]}", p["edge"], 4, 0.9))
        S.raw(f'<ellipse cx="{100 + s * 58}" cy="87" rx="12" ry="5.5" fill="#FFFFFF" opacity="{0.4 if not fallen else 0.14}"/>')
    S.shape(blob([(64, 104), (100, 98), (136, 104), (130, 122), (100, 130), (70, 122)], 0.85), shade(p["plate"], 0.9), shadow=3)   # the gorget
    if r11 and not fallen:   # CHANGE11 face: less shade (a lighter brow, a fainter cast shadow from the helm)
        S.shape(HEAD, fill="url(#gFaceLit)", shadow=5,
                decor='<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)" opacity="0.6"/>')
    else:
        head(S, face=p["face"])
    mouth(S, 137, "#9A6E68" if not fallen else "#6E6070")
    if r11:   # CHANGE11 bangs: a fringe swept to one side under the helm's brow (and the Fallen's cracked cheek)
        HAIRC = "#2A2630" if fallen else "#E8C86A"
        bang = [(56, 92), (100, 86), (144, 92), (147, 104), (140, 118), (128, 112), (118, 116), (106, 108), (96, 110), (84, 102), (72, 102), (60, 100)]
        if fallen:
            bang = mirror(bang)
            S.raw('<path d="M 124 112 L 119 121 L 126 127 L 121 137 L 127 143" fill="none" stroke="#9A72D0" stroke-width="3" '
                  'stroke-linecap="round" stroke-linejoin="round"/><path d="M 126 127 L 133 130" fill="none" stroke="#9A72D0" '
                  'stroke-width="2.4" stroke-linecap="round"/>')
        S.shape(blob(bang, 0.6), HAIRC, shadow=2 if not fallen else 3, sop=0.2 if not fallen else 0.3,
                decor=strokes("M 132 98 L 128 110 M 116 96 L 110 106 M 100 94 L 96 104" if not fallen else
                              "M 68 98 L 72 110 M 84 96 L 90 106 M 100 94 L 104 104", light(HAIRC, 1.5) if fallen else shade(HAIRC, 0.8), 2.5, 0.5))
    # the helm: a cap over the head with cheek guards, a fan crest standing along its ridge
    helm = "M 51 110 C 46 70 68 44 100 44 C 132 44 154 70 149 110 C 142 108 138 102 136 94 C 124 90 112 89 100 96 C 88 89 76 90 64 94 C 62 102 58 108 51 110 Z"
    S.shape(helm, p["helm"], shadow=4, sop=0.16 if (r11 and not fallen) else 0.3,
            decor=f'<path d="{ell(80, 62, 14, 8)}" fill="#FFFFFF" opacity="{0.35 if not fallen else 0.14}"/>'
                  + strokes("M 53 108 C 58 104 62 100 64 92 C 76 88 88 87 100 94 C 112 87 124 88 136 92 C 138 100 142 104 147 108",
                            p["edge"], 3.5, 0.9))
    crest = [(91, 96), (86, 78), (89, 58), (85, 40), (91, 22), (100, 6), (109, 22), (115, 40), (111, 58), (114, 78), (109, 96)]
    S.shape(blob(crest, 0.7), p["crest"], shadow=3,
            decor=strokes("M 100 12 L 100 94 M 92 30 L 92 90 M 108 30 L 108 90", shade(p["crest"], 0.78), 3, 0.6))
    S.shape(rr(100, 96, 24, 9, 4), p["edge"], shadow=2)
    S.group("arm-l", PL, "gauntlet")
    if r11:   # CHANGE11 hands: a hero's fist
        fist(S, 48, 146, -6, hand=p["hand"])
        return save("enemies", "spire-herald-fallen" if fallen else "spire-herald-light", S)
    fist(S, 48, 146, -6, hand=p["plate"] if not fallen else "#5E5470", w=23, h=27)
    S.shape(rr(48, 132, 28, 8, 3.5), p["edge"], T="rotate(-6 48 132)", shadow=1)
    return save("enemies", "spire-herald-fallen" if fallen else "spire-herald-light", S)


# ================================================================== the golem: three bodies, then each one gilded
GP = "#F2C24A"
EYE = "M 100 104 L 108 114 L 100 124 L 92 114 Z"


def eye(gilded, dy=0, k=1.0):
    """The eye the designer loved: the diamond rune on the head stone, as round 9 drew it (white on the gilded golem,
    gold on the plain one), with a faint glow behind it."""
    col = "#FFFFFF" if gilded else "#FFC84A"
    tr = f' transform="translate(0 {dy}) translate(100 114) scale({k}) translate(-100 -114)"'
    return (f'<circle cx="100" cy="114" r="15" fill="{col}" opacity="0.16"{tr}/>'
            f'<path d="{EYE}" fill="none" stroke="{col}" stroke-width="3.5" stroke-linejoin="round"{tr}/>')


def golem(v, gilded=False):
    """v = "boulders": three round stones (two shoulder boulders, a head stone) and two fist stones, fewer and cleaner
    than round 9's; "blocks": cut temple stone, squared and bevelled; "hunch": one great boulder of a back with a
    small head sunk in its front, long arms to two big fists (the troll's plan)."""
    what = {"boulders": "three big round stones: two shoulder boulders and a head stone between them, two fist stones",
            "blocks": "cut temple stone: a broad squared chest block with bevelled edges, a cube of a head, squared fists",
            "hunch": "one great boulder of a back with a band of carved runes, a small head stone sunk in its front, long "
                     "arms reaching forward to two big fists"}[v]
    gold = (" Gilded: polished gold plates over the shoulders and knuckles and a gold brow plate round the eye, the eye "
            "white." if gilded else " Weathered grey stone, a little moss.")
    S = Sprite(f"{'GILDED GOLEM' if gilded else 'GOLEM'} (round 10, body \"{v}\"): a stone golem seen from above: {what}; "
               f"on its head the eye: a diamond rune that glows (no other face).{gold} Parts: #arm-l / #arm-r (the fists, "
               "swing), #body. " + LAYOUT)
    hi = lambda x, y, rx, ry, o=0.22: f'<path d="{ell(x, y, rx, ry)}" fill="#FFFFF4" opacity="{o}"/>'
    moss = lambda x, y, rx, ry: "" if gilded else f'<path d="{ell(x, y, rx, ry)}" fill="#7E9A5A" opacity="0.9"/>'
    if v == "boulders":
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 60, 112), "stone fist")
            S.shape(stone(100 + s * 62, 154, 50, 46), STONE, shadow=0, decor=hi(100 + s * 62 - 8, 142, 12, 6))
            if gilded:
                S.shape(blob([(100 + s * 62 - 20, 160), (100 + s * 62, 154), (100 + s * 62 + 20, 160), (100 + s * 62 + 16, 176),
                              (100 + s * 62, 180), (100 + s * 62 - 16, 176)], 0.85), GP, shadow=2, decor=hi(100 + s * 62 - 6, 162, 8, 3.5, 0.7))
        S.group("body")
        for s in (-1, 1):
            S.shape(stone(100 + s * 50, 98, 78, 70, (1.0, 0.96, 1.03, 0.95, 1.0, 0.97, 1.02, 0.95)[::s]), STONE, shadow=0 if s < 0 else 3,
                    decor=hi(100 + s * 50 - 10, 76, 18, 9) + (moss(34, 84, 14, 7) if s < 0 else ""))
            if gilded:
                S.shape(stone(100 + s * 54, 90, 56, 40), GP, shadow=3, decor=hi(100 + s * 54 - 8, 80, 14, 6, 0.7))
        S.shape(stone(100, 106, 66, 62, (1.0, 0.98, 1.0, 0.97, 1.0, 0.98, 1.0, 0.97)), light(STONE, 1.05), shadow=5,
                decor=hi(88, 88, 16, 8) + ("" if not gilded else f'<path d="{blob([(78, 100), (100, 92), (122, 100), (124, 122), (100, 136), (76, 122)], 0.85)}" fill="{GP}"/>'
                                           + hi(90, 102, 9, 4, 0.7)) + eye(gilded))
    elif v == "blocks":
        def block(cx, cy, w, h, col, r=9, shadow=4, extra=""):
            S.shape(rr(cx, cy, w, h, r), col, shadow=shadow,
                    decor=f'<path d="{rr(cx, cy, w - 12, h - 12, max(r - 4, 2))}" fill="#FFFFF4" opacity="0.1"/>'
                          + strokes(f"M {cx - w / 2 + 8} {cy + h / 2 - 5} L {cx + w / 2 - 8} {cy + h / 2 - 5}", DSTONE, 3, 0.4) + extra)
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 60, 112), "stone fist")
            block(100 + s * 64, 154, 46, 44, STONE, shadow=0)
            if gilded:
                S.shape(rr(100 + s * 64, 166, 40, 16, 4), GP, shadow=2, decor=hi(100 + s * 58, 163, 9, 3, 0.7))
        S.group("body")
        block(100, 98, 168, 64, shade(STONE, 0.95), r=12, shadow=0, extra=moss(40, 82, 15, 7)
              + strokes("M 62 70 L 62 126 M 138 70 L 138 126", DSTONE, 3, 0.45))
        if gilded:
            for s in (-1, 1):
                S.shape(rr(100 + s * 62, 90, 40, 40, 7), GP, shadow=3, decor=hi(100 + s * 62 - 8, 80, 11, 5, 0.7))
        block(100, 110, 64, 62, light(STONE, 1.06), r=10, shadow=5,
              extra=("" if not gilded else f'<path d="{rr(100, 114, 44, 36, 6)}" fill="{GP}"/>' + hi(90, 104, 9, 4, 0.7)) + eye(gilded))
    else:
        for g, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(g, (100 + s * 62, 114), "arm and fist")
            arm = band([(100 + s * 66, 112), (100 + s * 64, 140), (100 + s * 52, 160)], 15)
            S.shape(arm, shade(STONE, 0.9), shadow=0)
            S.shape(stone(100 + s * 46, 168, 46, 42), STONE, shadow=3, decor=hi(100 + s * 46 - 8, 158, 11, 5))
            if gilded:
                S.shape(blob([(100 + s * 46 - 18, 172), (100 + s * 46, 166), (100 + s * 46 + 18, 172), (100 + s * 46 + 14, 186),
                              (100 + s * 46, 189), (100 + s * 46 - 14, 186)], 0.85), GP, shadow=2, decor=hi(100 + s * 46 - 6, 174, 8, 3, 0.7))
        S.group("body")
        back = stone(100, 86, 168, 124, (1.0, 0.97, 1.02, 0.96, 1.0, 0.96, 1.02, 0.97))
        runes = "".join(f'<path d="M {x} 60 l 5 7 l -5 7 l -5 -7 Z" fill="none" stroke="{GP if gilded else DSTONE}" stroke-width="3" '
                        f'stroke-linejoin="round" opacity="{0.95 if gilded else 0.6}"/>' for x in (52, 76, 100, 124, 148))
        S.shape(back, STONE, shadow=0, decor=hi(70, 50, 30, 14) + moss(140, 44, 18, 8) + runes
                + strokes("M 28 96 Q 100 116 172 96", DSTONE, 3.5, 0.4))
        if gilded:
            S.shape(blob([(30, 92), (60, 34), (100, 24), (140, 34), (170, 92), (150, 70), (100, 52), (50, 70)], 0.85), GP, shadow=3,
                    decor=hi(74, 40, 22, 7, 0.7))
        S.shape(stone(100, 122, 60, 58, (1.0, 0.98, 1.0, 0.97, 1.0, 0.98, 1.0, 0.97)), light(STONE, 1.06), shadow=5,
                decor=hi(88, 106, 14, 7) + ("" if not gilded else f'<path d="{blob([(80, 114), (100, 108), (120, 114), (122, 134), (100, 146), (78, 134)], 0.85)}" fill="{GP}"/>')
                      + eye(gilded, dy=12))
    return save("enemies", f"spire-{'gilded-' if gilded else ''}golem-{v}", S)


BUILD = {"spire-choir-sprite": lambda: S9.choir_sprite(hair10=True),
         "spire-fallen-angel": fallen_angel,
         "spire-herald-light": lambda: herald(False), "spire-herald-fallen": lambda: herald(True)}
for _v in ("boulders", "blocks", "hunch"):
    BUILD[f"spire-golem-{_v}"] = (lambda v=_v: golem(v))
    BUILD[f"spire-gilded-golem-{_v}"] = (lambda v=_v: golem(v, True))

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
