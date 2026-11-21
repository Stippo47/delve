"""Lizardmen, three variants. python lizards.py [a b c]
A spear (the picked round-3 one, hands turned), B desert lizard with a scimitar curving IN, C croc with club + shell."""
from lib import *

IRON = ("#E6EAEF", "#9AA2AE")
WOOD = ("#B07A48", "#6E4628")
BONE = ("#FBF3DC", "#D4C29A")
CLAW = "#F2E6C4"

# round 6: "try without eyes, then one with shading like humans over the face; do this with the other lizards and the
# dragonborn". EYES=False drops the eyes (iris, slit, glint) and nothing else; FACE=True also lays the heroes' face
# shading over the head: darker toward the top of the head (as under a hero's brim), light across the middle of the
# snout, a touch darker at its tip, with no shine spot (heroes' faces have none). The rest is the round-4 lizard.
EYES, FACE = True, False
# round 7 switches (all off here, so lizards6.py still builds round 6; lizards7.py turns them on per design):
# TEETH_IN, croc A ("bring teeth in, underneath head"): the side teeth that were drawn over everything, poking out
# past the jaw onto the outline, are gone; the same three teeth a side are drawn under the head instead, so only
# their points show along the jaw's edge.
TEETH_IN = False


def face_shade(S, y0, y1, col, brow):
    """The heroes' face shading as a see-through overlay on a head running from y0 (back of the head) to y1 (snout tip):
    a soft shadow across the brow, where a hero's face is darkest under the hat and where the eyes were, fading to the
    light middle of the snout, a touch darker again at the tip."""
    gid = S.uid("g")
    o = lambda y: f"{max(0.0, min(1.0, (y - y0) / (y1 - y0))):.3f}"
    S.defs.append(f'<linearGradient id="{gid}" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">'
                  f'<stop offset="{o(brow - 24)}" stop-color="{col}" stop-opacity="0"/>'
                  f'<stop offset="{o(brow)}" stop-color="{col}" stop-opacity="0.5"/>'
                  f'<stop offset="{o(brow + 12)}" stop-color="{col}" stop-opacity="0.3"/>'
                  f'<stop offset="{o(brow + 30)}" stop-color="{col}" stop-opacity="0"/>'
                  f'<stop offset="{o(y1 - 16)}" stop-color="{col}" stop-opacity="0"/>'
                  f'<stop offset="1" stop-color="{col}" stop-opacity="0.16"/></linearGradient>')
    return f'<rect x="-20" y="{y0}" width="240" height="{y1 - y0}" fill="url(#{gid})"/>'

HEAD_A = ("M100 52 C127 52 143 70 143 94 C143 110 137 121 129 131 C122 141 120 155 114 166 C110 172 105 174 100 174 "
          "C95 174 90 172 86 166 C80 155 78 141 71 131 C63 121 57 110 57 94 C57 70 73 52 100 52 Z")
SHOULDERS = "M30 108 C30 85 56 78 100 78 C144 78 170 85 170 108 C170 131 144 140 100 140 C56 140 30 131 30 108 Z"
TAIL = "M82 84 C78 62 82 42 94 28 C104 16 116 10 130 6 C120 16 113 28 111 42 C109 58 114 72 118 84 Z"


def claw_hand(S, cx, cy, skin, side, shadow=True):
    """An empty, relaxed claw: a rounded block with three claws pointing forward."""
    S.shape(rr(cx, cy, 26, 22, 8), skin, shadow=shadow, sh=3)
    S.shape(" ".join(poly([(cx + dx - 3.5, cy + 9), (cx + dx + 3.5, cy + 9), (cx + dx + side * 1.5, cy + 18)])
                     for dx in (-8, 0, 8)), CLAW, shadow=False, shade=0)


def scales(S, pts, col, op=0.5):
    return [f'<path d="{" ".join(circ(x, y, r) for x, y, r in pts)}" fill="{col}" opacity="{op}"/>']


# ----------------------------------------------------------------------------- A
def liz_a():
    S = Sprite('LIZARDMAN A "spear" (round 4; the picked round-3 lizardman, redone to the hand rule). Olive scales, a long '
               'snout with nostrils, yellow slit eyes on brow bumps, an orange crest of spines down the back of the head, '
               'tail curling behind. The spear passes under the right shoulder; the fist wraps the shaft with its '
               'knuckles along it. Parts: #back = tail (pivot at its root), #arm-r = spear + fist (before #body), '
               '#body, #arm-l = empty claw. Facing = DOWN (+y), centre (100,100).')
    sc, scD, scDD = "#A9C75E", "#7EA343", "#5F8233"
    S.group("back", (100, 80))
    S.shape(TAIL, S.lg(sc, scD), shadow=False, shade=0.3,
            decor=['<path d="M94 50 C98 40 104 32 112 26" fill="none" stroke="#D2552A" stroke-width="5" '
                   'stroke-linecap="round" stroke-dasharray="6 7"/>'])
    S.group("arm-r", (160, 108))
    a = -3
    tf = frame(156, 140, a)
    S.shape(rr(0, -40, 7, 150, 3.5), S.lg(*WOOD, x2=1, y2=0), tf=tf, shadow=False, shade=0)
    S.shape(rr(0, 24, 10, 8, 3), "#6E7682", tf=tf, shadow=False, shade=0)
    S.shape(blob([(0, 26), (10, 36), (13, 46), (8, 56), (0, 66, 'c'), (-8, 56), (-13, 46), (-10, 36)], 0.8),
            S.lg(*IRON, x2=1, y2=0.2), tf=tf, shadow=False, shade=0.25)
    fist(S, 156, 140, a, S.lg(sc, scD), w=22, h=25, knuckle=1)
    S.group("body")
    S.shape(SHOULDERS, S.lg(scD, scDD), shade=0.35, decor=scales(S, [(46, 100, 5), (40, 114, 4), (154, 100, 5), (160, 114, 4)], scDD))
    for x in (65, 135):
        S.shape(ell(x, 104, 13, 12), S.lg(sc, scD), sh=4)
    S.shape(HEAD_A, S.lg(sc, scD), sh=5, hi=None if FACE else 0.35, shade=0.35,
            decor=scales(S, [(80, 74, 4.5), (122, 76, 4.5), (88, 128, 4), (114, 126, 4), (100, 144, 3.5)], "#6E9238")
            + ([face_shade(S, 52, 174, "#3E5A1E", 102)] if FACE else []))
    S.shape("M100 40 L108 56 L104 58 L111 72 L106 74 L112 88 L100 96 L88 88 L94 74 L89 72 L96 58 L92 56 Z",
            S.lg("#F08A3A", "#D2552A", x2=0, y2=1), sh=3, shade=0.25)
    for x in (64, 136) if EYES else ():
        S.flat(ell(x, 108, 6, 7), "#FFD23F")
        S.flat(ell(x + 0.5, 108.5, 1.8, 6), INK)
    S.flat(f"{ell(93, 163, 2.6, 3.6)} {ell(107, 163, 2.6, 3.6)}", "#3A4A1E")
    S.group("arm-l", (42, 108))
    claw_hand(S, 54, 142, S.lg(sc, scD), -1)
    return S


# ----------------------------------------------------------------------------- B
def liz_b():
    S = Sprite('LIZARDMAN B "desert blade" (round 4 variant). A sand lizard: tan scales with dark brown bands across the '
               'back of the head and shoulders, a shorter wedge snout, big amber eyes set on the top of the head, a red '
               'cloth sash over one shoulder. A scimitar whose blade curves IN toward the centre line (the round-3 one '
               'curved out). Parts: #back = tail, #arm-r = scimitar + fist (before #body), #body, #arm-l = empty claw. '
               'Facing = DOWN (+y), centre (100,100).')
    sc, scD, band = "#E8C27A", "#C0924A", "#8A5A2E"
    S.group("back", (100, 80))
    tail = stroke_path([(100, 84), (88, 56), (72, 36), (54, 22), (40, 16)], 32, 7)
    S.shape(tail, S.lg(sc, scD), shadow=False, shade=0.3,
            decor=[f'<path d="{" ".join(ell(x, y, 6, 4.5) for x, y in ((90, 64), (74, 42), (58, 28)))}" fill="{band}" opacity="0.75"/>'])
    S.group("arm-r", (160, 108))
    a = 6
    tf = frame(152, 138, a)
    S.shape(rr(0, -14, 8, 26, 3.5), S.lg("#6A3A22", "#40220F", x2=1, y2=0), tf=tf, shadow=False, shade=0)
    S.shape(rr(0, 12, 28, 8, 4), S.lg("#F2CC6A", "#B07E2A"), tf=tf, shadow=False, shade=0)
    # blade: runs forward, then the tip sweeps IN (toward -x local = toward the centre line)
    S.shape(blob([(-6, 15, 'c'), (6, 15), (10, 30), (9, 44), (2, 56), (-10, 62), (-24, 64, 'c'), (-14, 54), (-8, 44),
                  (-7, 30)], 0.75), S.lg(*IRON, x2=1, y2=0.2), tf=tf, shadow=False, shade=0.25)
    fist(S, 152, 138, a, S.lg(sc, scD), w=22, h=25, knuckle=1)
    S.group("body")
    S.shape(SHOULDERS, S.lg(scD, "#9A7034"), shade=0.35,
            decor=[f'<path d="{rr(48, 104, 12, 30, 5)} {rr(152, 104, 12, 30, 5)}" fill="{band}" opacity="0.6"/>'])
    # sash over the left shoulder
    S.shape(blob([(36, 96), (52, 84), (70, 92), (62, 116), (46, 128), (34, 118)], 0.9), S.lg("#D84A3A", "#9A2A22"),
            sh=3, shade=0.2)
    head = blob([(100, 54), (128, 58), (144, 80), (142, 106), (130, 128), (118, 150), (100, 162), (82, 150), (70, 128),
                 (58, 106), (56, 80), (72, 58)], 1.0)
    S.shape(head, S.lg(sc, scD), sh=5, hi=None if FACE else 0.4, shade=0.35,
            decor=[f'<path d="{ell(100, 66, 20, 9)} {ell(100, 88, 14, 7)} {ell(100, 136, 8, 5)}" fill="{band}" opacity="0.7"/>']
            + ([face_shade(S, 54, 162, "#7A4A1E", 106)] if FACE else []))
    for x in (76, 124):
        S.shape(circ(x, 112, 12), S.lg(sc, scD), sh=3, shade=0.25, decor=[face_shade(S, 54, 162, "#7A4A1E", 106)] if FACE else None)
        if EYES:
            S.flat(circ(x, 112, 8), "#F29A2A")
            S.flat(ell(x, 112.5, 2, 7), INK)
            S.flat(circ(x - 3, 108.5, 1.8), "#FFF4D8")
    S.flat(f"{ell(94, 152, 2.4, 3.2)} {ell(106, 152, 2.4, 3.2)}", "#6A4420")
    S.group("arm-l", (42, 108))
    claw_hand(S, 54, 140, S.lg(sc, scD), -1)
    return S


# ----------------------------------------------------------------------------- C
def liz_c():
    S = Sprite('LIZARDMAN C "croc" (round 4 variant). A heavier swamp croc-man: dark moss-brown hide, a broad flat '
               'snout with a row of teeth showing along each side, eyes on raised bumps, a double row of armour ridges '
               'down the back of the head. A turtle-shell shield in front (hand hidden) and a bone club behind the '
               'right shoulder. Parts: #back = thick tail, #arm-r = club + fist (before #body), #body, #arm-l = shield. '
               'Facing = DOWN (+y), centre (100,100).')
    sc, scD, scDD = "#8A9A58", "#5E6E3A", "#44522A"
    S.group("back", (100, 80))
    S.shape("M78 86 C76 62 84 40 98 24 C104 18 110 14 116 12 C112 24 112 40 116 54 C120 66 122 76 122 86 Z",
            S.lg(sc, scD), shadow=False, shade=0.3,
            decor=[f'<path d="{" ".join(poly([(x - 5, y + 4), (x, y - 6), (x + 5, y + 4)]) for x, y in ((104, 30), (106, 46), (108, 62)))}" fill="{scDD}" opacity="0.7"/>'])
    S.group("arm-r", (160, 108))
    a = -10
    tf = frame(156, 138, a)
    S.shape(rr(0, -6, 9, 36, 4), S.lg(*BONE, x2=1, y2=0), tf=tf, shadow=False, shade=0.2)
    S.shape(blob([(-8, 10), (8, 10), (14, 26), (16, 44), (10, 56), (0, 60), (-10, 56), (-16, 44), (-14, 26)], 0.9),
            S.lg(*BONE, x2=1, y2=0.2), tf=tf, shadow=False, shade=0.3)
    S.shape(" ".join(circ(x, y, 3.5) for x, y in ((-9, 34), (9, 40), (-4, 50))), "#B0A07A", tf=tf, shadow=False, shade=0)
    fist(S, 156, 138, a, S.lg(sc, scD), w=22, h=26, knuckle=1)
    S.group("body")
    S.shape("M24 108 C24 82 54 76 100 76 C146 76 176 82 176 108 C176 134 146 142 100 142 C54 142 24 134 24 108 Z",
            S.lg(scD, scDD), shade=0.35)
    head = blob([(100, 50), (130, 56), (146, 80), (144, 106), (136, 124), (134, 146), (128, 166), (112, 176),
                 (100, 177), (88, 176), (72, 166), (66, 146), (64, 124), (56, 106), (54, 80), (70, 56)], 1.0)
    # teeth along the jaw edges (drawn under the head so only the points show)
    if TEETH_IN:
        # round 7: the side teeth, brought in under the head: each sits on the jaw's edge (x = the edge at that
        # height), its root hidden under the head and its point showing 5 units past the edge, a little forward
        teeth = [(134.9, 134), (133.7, 148), (130.4, 162)]
        S.shape(" ".join(poly([(100 + s * (ex - 100 - 4), y - 4.5), (100 + s * (ex - 100 - 4), y + 4.5),
                                (100 + s * (ex - 100 + 5), y + 2.5)]) for ex, y in teeth for s in (1, -1)), "#FFF6E0",
                shadow=False, shade=0)
        S.comment = S.comment.replace("a row of teeth showing along each side", "three teeth a side tucked under the jaw "
                                      "so only their points show (round 7)")
    else:
        S.shape(" ".join(poly([(x - 4, y), (x + 4, y), (x + (5 if x > 100 else -5), y + 4)]) for x, y in
                         ((134, 132), (133, 146), (131, 160), (66, 132), (67, 146), (69, 160))), "#FFF6E0",
                shadow=False, shade=0,
                tf=None)
    S.raw('')
    S.shape(head, S.lg(sc, scD), sh=5, hi=None if FACE else 0.3, shade=0.35,
            decor=[face_shade(S, 50, 177, "#2A3414", 96)] if FACE else None)
    # side teeth that poke out past the jaw
    if not TEETH_IN:
        S.flat(" ".join(poly([(x, y - 4), (x, y + 4), (x + (7 if x > 100 else -7), y + 1)]) for x, y in
                        ((137, 134), (135, 148), (132, 162), (63, 134), (65, 148), (68, 162))), "#FFF6E0")
    # armour ridges down the back of the head
    S.flat(" ".join(rr(x + (3 if i % 2 else 0), y, 7, 13, 3.5) for i, (x, y) in enumerate((92, y) for y in (60, 78, 96))), scDD, op=0.55)
    S.flat(" ".join(rr(x - (3 if i % 2 else 0), y, 7, 13, 3.5) for i, (x, y) in enumerate((108, y) for y in (60, 78, 96))), scDD, op=0.55)
    for x in (72, 128):
        S.shape(circ(x, 100, 11), S.lg(sc, scD), sh=3, shade=0.25, decor=[face_shade(S, 50, 177, "#2A3414", 96)] if FACE else None)
        if EYES:
            S.flat(ell(x, 102, 5.5, 6.5), "#E8D24A")
            S.flat(ell(x + 0.5, 102.5, 1.6, 5.5), INK)
    S.flat(f"{ell(92, 168, 3, 3.5)} {ell(108, 168, 3, 3.5)}", "#2E3A18")
    S.group("arm-l", (40, 108))
    # turtle-shell shield in front, the hand hidden behind it
    sh = circ(38, 152, 28)
    S.shape(sh, S.lg("#8A6A3A", "#5A4022"), sh=4, shade=0.3, hi=0.3,
            decor=[f'<path d="{circ(38, 152, 19)}" fill="#A8844A"/>',
                   f'<path d="{poly([(38, 142), (47, 147), (47, 157), (38, 162), (29, 157), (29, 147)])}" fill="#C49C58"/>'])
    return S


TAKES = {"a": (liz_a, "lizardman-a-spear.svg", "Lizardman A spear"),
         "b": (liz_b, "lizardman-b-desert-blade.svg", "Lizardman B desert blade"),
         "c": (liz_c, "lizardman-c-croc.svg", "Lizardman C croc")}

if __name__ == "__main__":
    want = sys.argv[1:] or list(TAKES)
    render([(TAKES[t][0]().write(TAKES[t][1]), TAKES[t][2]) for t in want])
