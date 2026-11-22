"""Round 5 greenskins for the Warren: goblin, hobgoblin, orc, orc shaman, troll, ogre. Each a different green, no eyes.

Built the heroes' way: a top-down bust (head token, shoulders, two fists), the head covered on top (scalp, cap, hood,
hair) and the face showing at the front edge with the heroes' face gradient (dark under the brow, light across the
middle), no eyes. What makes each one a greenskin is in the silhouette: ears, nose, jaw and tusks, hair, weapon.
python greenskins.py   (writes ../../enemies/greenskin-*.svg)
"""
from lib import *

IRON = ("#D9DDE3", "#8C94A1")
RUST = ("#C09070", "#7E5A48")
WOOD = ("#C08A55", "#7A4E2C")
DWOOD = ("#9A6A40", "#5E3C22")
BONE = ("#F4EBD2", "#C9B98E")
LEATHER = ("#A0603E", "#6A3A26")

SKIN = {
    "goblin": "#C2D65A",     # yellow-lime
    "hobgoblin": "#A6AA48",  # olive-yellow
    "orc": "#6FA84A",        # grass green
    "shaman": "#9DB890",     # grey sage
    "troll": "#5FA592",      # blue-teal green
    "ogre": "#869A5A",       # drab moss
}

SCALP = ("M 52.5 108 C 50 70 70 47.8 100 47.8 C 130 47.8 150 70 147.5 108 C 136 100 120 96 100 98 "
         "C 80 96 64 100 52.5 108 Z")

# round 7: the designer's notes on the ogre and orc were left on their "(before)" tiles, the round-5 versions, so these
# two go back to round 5 (no round-6 change: the brow crease is back, and the orc keeps its knuckled fists) and get
# only the round-7 note:
#   OGRE_R7 "make hands simple then this could potentially work": the heroes' plain fists (no knuckle bumps), the
#           iron cuffs as they were.
#   ORC_R7  "tusks? not in mouth": the two tusks come out of the mouth: their roots on the mouth line, inside its
#           ends (they stood on the chin below it, either side of the mouth), pointing up past the upper lip; the
#           mouth line is drawn over their roots. Same tusks (size, lean, colour).
OGRE_R7 = True
ORC_R7 = True
# round 8 (art-round7 deck, on the Orc: "Wider mouth"): the mouth line runs x 74..126 (it ran 84..116), same height,
# same bow, same width of line; the tusks stay where they were, their roots still on the line inside its ends.
ORC_R8 = True


def lgs(S, skin):
    return S.lg(lt(skin, 0.12), dk(skin, 0.22))


def gfist(S, x, y, a, skin, w=21, h=24, knuckle=1, plain=None):
    plain = HEROES6 if plain is None else plain
    return fist(S, x, y, a, lgs(S, skin), w=w, h=h, knuckle=0 if plain else knuckle)


def scalp(S, skin, d=SCALP, tf=None):
    """The bald top of the head: same skin, lit from the left; its lower edge is the brow, which shades the face."""
    return S.shape(d, S.lg(lt(skin, 0.14), dk(skin, 0.16)), tf=tf, sh=4, op=0.32, shade=0.22)


def ears(S, skin, pts, inner=None, tf=None):
    for side in (1, -1):
        p = pts if side > 0 else mx(pts)
        S.shape(blob(p, 0.9), lgs(S, skin), tf=tf, shadow=False, shade=0.2)
        if inner:
            q = inner if side > 0 else mx(inner)
            S.flat(blob(q, 0.9), dk(skin, 0.25), tf=tf, op=0.55)


def tusks(S, xs=(84, 116), y=150, h=16, w=8, lean=4, sh=2):
    """Lower tusks rising from the jaw at the front, pointing back up toward the brow."""
    for x in xs:
        s = 1 if x > 100 else -1
        S.shape(blob([(x - w / 2, y), (x + w / 2, y), (x + s * lean * 0.5 + w * 0.18, y - h * 0.6), (x + s * lean, y - h, 'c'),
                      (x + s * lean * 0.5 - w * 0.3, y - h * 0.55)], 0.8), S.lg(*BONE), sh=sh, op=0.25, shade=0.15)


# ----------------------------------------------------------------- weapons
def knife(S, x, y, a):
    tf = frame(x, y, a)
    S.shape(rr(0, -8, 8, 26, 3.5), S.lg("#7A5236", "#4E3220"), tf=tf, shadow=False)
    S.shape(blob([(-7, 6), (7, 6), (6, 30), (1, 48, 'c'), (-5, 28)]), S.lg(*RUST, x2=1, y2=0.2), tf=tf, shadow=False, shade=0.25)


def falchion(S, x, y, a):
    tf = frame(x, y, a)
    S.shape(rr(0, -8, 9, 26, 4), S.lg("#6A3E26", "#40241A"), tf=tf, shadow=False)
    S.shape(rr(0, 7, 26, 8, 4), S.lg(*RUST), tf=tf, shadow=False)
    S.shape(blob([(-8, 10), (8, 10), (12, 36), (10, 54), (0, 62, 'c'), (-7, 44), (-8, 26)]), S.lg(*IRON, x2=1, y2=0.2),
            tf=tf, shadow=False, shade=0.25)


def cleaver(S, x, y, a):
    tf = frame(x, y, a)
    S.shape(rr(0, -10, 10, 30, 4), S.lg("#6A3E26", "#40241A"), tf=tf, shadow=False)
    S.shape(blob([(-9, 4, 'c'), (10, 4, 'c'), (24, 12), (26, 56), (20, 68, 'c'), (-10, 66, 'c'), (-12, 40)], 0.6),
            S.lg(*IRON, x2=1, y2=0.25), tf=tf, shadow=False, shade=0.28,
            decor=[f'<circle cx="16" cy="18" r="4.5" fill="#6E7584" transform="{tf}"/>',
                   f'<path d="M-12 58 L22 58 L20 70 L-12 70 Z" fill="#F4F6FA" opacity="0.4" transform="{tf}"/>'])


def club(S, x, y, a, L=80, w0=12, w1=26):
    tf = frame(x, y, a)
    S.shape(blob([(-w0 / 2, -14), (w0 / 2, -14), (w1 / 2, L - 14), (w1 / 2 - 3, L), (0, L + 4), (-w1 / 2 + 3, L), (-w1 / 2, L - 14)], 0.9),
            S.lg(*WOOD, x2=1, y2=0.2), tf=tf, shadow=False, shade=0.3,
            decor=[f'<ellipse cx="{w1 * 0.3}" cy="{L * 0.55}" rx="4" ry="6" fill="#6A4024" opacity="0.6" transform="{tf}"/>',
                   f'<ellipse cx="{-w1 * 0.25}" cy="{L * 0.8}" rx="3.5" ry="5" fill="#6A4024" opacity="0.6" transform="{tf}"/>'])


def staff(S, x, y, a, skin):
    tf = frame(x, y, a)
    S.shape(rr(0, 20, 9, 84, 4.5), S.lg(*DWOOD, x2=1, y2=0), tf=tf, shadow=False, shade=0.2)
    # a beast skull lashed on the front end, horns out, and a green-gold flame in front of it
    S.shape(blob([(-22, 58), (-12, 64), (12, 64), (22, 58), (16, 74), (-16, 74)], 0.8), S.lg(*BONE), tf=tf, shadow=False, shade=0.15)
    S.shape(blob([(-12, 62), (12, 62), (14, 78), (8, 90), (0, 94), (-8, 90), (-14, 78)]), S.lg(*BONE), tf=tf, shade=0.2, sh=3)
    S.shape(blob([(0, 84), (10, 92), (12, 104), (0, 116, 'c'), (-12, 104), (-10, 92)]), S.rg("#FFF6A8", "#8FD24A", 0.5, 0.4, 0.65),
            tf=tf, shadow=False, shade=0)


# ----------------------------------------------------------------- the six
def goblin():
    skin = SKIN["goblin"]
    S = Sprite('GOBLIN (round 5): yellow-lime skin, no eyes; huge ears swept out and back, a long hooked nose over a '
               'wide grin, a brown rag tunic, a rusty knife. Big head on small shoulders. Parts: #arm-r (knife + fist, '
               'before #body), #body, #arm-l (free fist). Outline from the #outline filter. Front = DOWN (+y).')
    S.group("arm-r", (138, 112))
    knife(S, 140, 150, 14)
    gfist(S, 140, 146, 14, skin)
    S.group("body")
    S.shape(sym([(100, 80), (132, 82), (154, 96), (156, 116), (142, 132), (100, 138)]), S.lg("#A07E52", "#6E5434"),
            decor=[f'<path d="{poly([(50,128),(62,142),(72,128),(86,144),(100,130),(114,144),(128,128),(138,142),(150,126),(150,120),(50,120)])}" fill="#6E5434" opacity="0.7"/>'])
    ears(S, skin, [(138, 86), (168, 74), (204, 58), (184, 90), (144, 112)], [(146, 92), (168, 82), (188, 70), (174, 90), (150, 104)])
    face(S, skin)
    scalp(S, skin)
    S.raw(f'<path d="M80 136 Q100 150 120 136" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3.2" stroke-linecap="round"/>')
    S.shape(blob([(92, 108), (108, 108), (110, 132), (104, 156), (98, 168, 'c'), (94, 150), (90, 128)], 0.9),
            S.lg(lt(skin, 0.05), dk(skin, 0.25)), sh=4, op=0.3, shade=0.25)
    S.group("arm-l", (62, 112))
    gfist(S, 58, 144, -6, skin, knuckle=-1)
    return S


def hobgoblin():
    skin = SKIN["hobgoblin"]
    S = Sprite('HOBGOBLIN (round 5): olive-yellow skin, no eyes; a dented iron cap, short ears out to the sides, a flat '
               'nose and two small lower fangs, red-brown leather shoulders, a falchion and a round wooden shield. '
               'Parts: #arm-r (falchion + fist, before #body), #body, #arm-l (shield, hand hidden). Front = DOWN (+y).')
    S.group("arm-r", (150, 108))
    falchion(S, 152, 142, 22)
    gfist(S, 152, 142, 22, skin)
    S.group("body")
    S.shape(SHOULDERS, S.lg(*LEATHER), decor=[f'<path d="M26 120 C60 136 140 136 174 120 L174 150 L26 150 Z" fill="#5A2E1E" opacity="0.35"/>'])
    ears(S, skin, [(140, 98), (170, 92), (186, 96), (170, 110), (144, 116)], [(148, 102), (168, 98), (176, 101), (166, 108), (150, 110)])
    face(S, skin)
    S.raw(f'<path d="M89 140 Q100 135 111 140" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3" stroke-linecap="round"/>')
    for x in (91, 109):
        S.shape(poly([(x - 3, 140), (x + 3, 140), (x, 132)]), S.lg(*BONE), shadow=False, shade=0)
    S.shape(blob([(94, 112), (106, 112), (110, 126), (100, 130), (90, 126)]), S.lg(lt(skin, 0.05), dk(skin, 0.25)), sh=3, shade=0.2)
    cap = ("M 48 114 C 42 68 66 42 100 42 C 134 42 158 68 152 114 C 140 104 122 99 100 99 C 78 99 60 104 48 114 Z")
    S.shape(cap, S.lg("#C9CDD4", "#7E8594"), sh=4, op=0.32, shade=0.3,
            decor=['<path d="M40 100 C70 90 130 90 160 100 L160 116 L40 116 Z" fill="#6E7584" opacity="0.45"/>',
                   ])
    S.group("arm-l", (52, 110))
    S.shape(circ(50, 150, 34), S.lg(*WOOD), sh=3,
            decor=['<path d="M30 116 L40 116 L40 190 L30 190 Z M58 116 L68 116 L68 190 L58 190 Z" fill="#7A4E2C" opacity="0.35"/>',
                   '<path d="M14 142 L86 142 L86 156 L14 156 Z" fill="#7E8594" opacity="0.9"/>'])
    S.shape(circ(50, 150, 11), S.lg(*IRON), sh=2, shade=0.3)
    return S


# round 10 (art-round8 deck, on the Orc: "Move tusks to the side... While at it fixe hair"): ORC_R10
#   tusks: at the corners of the mouth (x 78 and 122; they stood at 90 and 110, in the middle of it), the same tusks.
#   hair:  the topknot was a ball on the scalp with a thin stick behind it. Now the knot is tied with a bone ring and a
#          thick tail of hair falls back from it, ending in a tuft (#back, it sways); the knot itself is where it was.
ORC_R10 = False


def orc():
    skin = SKIN["orc"]
    S = Sprite('ORC (round 5): grass-green skin, no eyes; heavy brow, a big underbite jaw with two tusks, a black '
               'topknot with a braid trailing back, a brown fur mantle, a big cleaver. Parts: #back (braid), #arm-r '
               '(cleaver + fist, before #body), #body, #arm-l (free fist). Front = DOWN (+y).')
    S.group("back", (100, 70))
    if ORC_R10:
        S.comment = S.comment.replace("a black topknot with a braid trailing back", "a black topknot tied with a bone ring, "
                                      "a thick tail of hair falling back from it to a tuft (round 10)")
        S.shape(blob([(88, 58), (84, 38), (86, 20), (92, 9), (100, 1, 'c'), (103, 11), (110, 5, 'c'), (113, 20), (116, 38),
                      (112, 58)], 0.9), S.lg("#4A4250", "#231C28"), shadow=False, shade=0.2,
                decor=['<path d="M 96 50 C 94 34 96 20 100 8 M 105 50 C 107 36 107 24 106 14" fill="none" stroke="#6A6272" '
                       'stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>'])
    else:
        S.shape(stroke_path([(100, 60), (98, 40), (102, 20), (99, 2)], 15, 7), S.lg("#4A4250", "#231C28"), shadow=False, shade=0.2)
    r5 = ORC_R7  # round 7: the round-5 orc (see ORC_R7)
    plain = False if r5 else None
    if r5:
        S.comment = S.comment.replace("a big underbite jaw with two tusks", "a big underbite jaw with two tusks coming "
                                      "out of the mouth (round 7)")
    S.group("arm-r", (154, 110))
    cy = 126 if ORC_R10 else 142   # round 10: the cleaver 16 units further back, so its whole blade is inside the box
    cleaver(S, 154, cy, 18)
    gfist(S, 154, cy - 4, 18, skin, w=24, h=26, plain=plain)
    S.group("body")
    bumps = []
    for i in range(13):
        t = math.radians(200 + i * 11.67)
        bumps.append((100 + math.cos(t) * 84, 112 + math.sin(t) * 46))
    fur = blob([(100, 150), (40, 140), (14, 116)] + bumps[1:-1] + [(186, 116), (160, 140)], 0.8)
    S.shape(fur, S.lg("#9A7652", "#5E4430"), decor=['<path d="M10 128 C60 146 140 146 190 128 L190 160 L10 160 Z" fill="#4A3424" opacity="0.4"/>'])
    if HEROES6 and not r5:
        bald_head(S, skin)
    else:
        face(S, skin)
        scalp(S, skin, d="M 52.5 112 C 50 70 70 47.8 100 47.8 C 130 47.8 150 70 147.5 112 C 136 104 120 102 100 104 C 80 102 64 104 52.5 112 Z")
    S.shape(circ(100, 62, 15), S.lg("#4A4250", "#231C28"), sh=3, shade=0.2)
    if ORC_R10:   # the bone ring that ties the knot, at its back edge where the tail leaves it
        S.shape(blob([(86, 50), (100, 46), (114, 50), (113, 57), (100, 54), (87, 57)], 0.9), S.lg(*BONE), sh=2, op=0.25, shade=0.15)
    jaw = blob([(70, 128), (100, 132), (130, 128), (136, 144), (122, 160), (100, 164), (78, 160), (64, 144)], 0.9)
    S.shape(jaw, S.lg(lt(skin, 0.04), dk(skin, 0.24)), sh=3, op=0.32, shade=0.22)
    mx0, mx1 = (74, 126) if ORC_R8 else (84, 116)  # round 8: a wider mouth (see ORC_R8)
    if ORC_R8:
        S.comment = S.comment.replace("two tusks coming out of the mouth (round 7)",
                                      "two tusks coming out of the mouth (round 7), a wider mouth (round 8)")
    mline = f'<path d="M{mx0} 140 Q100 136 {mx1} 140" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3" stroke-linecap="round"/>'
    if r5:
        # the mouth line runs x 84..116, at y 138.8 where the tusks stand (x 90, 110): their roots are on it, hidden
        # by it (so no contact shadow peeks out below it)
        if ORC_R10:
            S.comment = S.comment.replace("a wider mouth (round 8)", "a wider mouth (round 8), the tusks at its corners (round 10)")
        tusks(S, (78, 122) if ORC_R10 else (90, 110), 139.2 if ORC_R10 else 138.4, 20, 10, 5, sh=0)
        S.raw(mline)
    else:
        S.raw(mline)
        tusks(S, (84, 116), 150, 20, 10, 5)
    S.group("arm-l", (46, 112))
    gfist(S, 44, 146, -6, skin, w=24, h=26, knuckle=-1, plain=plain)
    return S


def shaman():
    skin = SKIN["shaman"]
    S = Sprite('ORC SHAMAN (round 5): grey-sage skin, no eyes; a hide hood with a wolf-fur rim and three feathers '
               'trailing back, a bone collar, small tusks, a staff with a beast skull and a green-gold flame, a flame '
               'cupped in the free hand. Parts: #back (feathers), #arm-r (staff + fist, before #body), #body, #arm-l '
               '(fist + flame). Front = DOWN (+y).')
    S.group("back", (100, 70))
    for a, c in ((-22, "#C84A3A"), (0, "#E8E0CC"), (22, "#3E3646")):
        S.shape(blob([(-7, 0), (7, 0), (8, -40), (0, -60, 'c'), (-8, -40)]), S.lg(lt(c, 0.15), dk(c, 0.2)),
                tf=f"translate(100 64) rotate({a})", shadow=False, shade=0.25)
    S.group("arm-r", (150, 110))
    staff(S, 156, 96, 8, skin)
    gfist(S, 155, 140, 8, skin)
    S.group("body")
    S.shape(SHOULDERS, S.lg("#6E6A4A", "#46422E"))
    S.shape(blob([(100, 112), (136, 110), (156, 120), (146, 138), (100, 146), (54, 138), (44, 120), (64, 110)]), S.lg(*BONE), sh=3, shade=0.2)
    face(S, skin)
    S.raw(f'<path d="M94 139 Q100 141 106 139" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="2.8" stroke-linecap="round"/>')
    tusks(S, (90, 110), 148, 12, 7, 3)
    hood = ("M 44 120 C 36 66 62 36 100 36 C 138 36 164 66 156 120 C 150 130 140 128 138 116 C 132 104 120 98 100 98 "
            "C 80 98 68 104 62 116 C 60 128 50 130 44 120 Z")
    S.shape(hood, S.lg("#B08A5E", "#6E5236"), sh=4, op=0.32, shade=0.3,
            decor=['<path d="M30 104 C60 92 140 92 170 104 L170 140 L30 140 Z" fill="#5E4630" opacity="0.4"/>'])
    S.group("arm-l", (50, 110))
    gfist(S, 46, 146, 0, skin, knuckle=-1)
    S.shape(blob([(46, 150), (56, 160), (56, 172), (46, 186, 'c'), (36, 172), (36, 160)]), S.rg("#FFF6A8", "#8FD24A", 0.5, 0.4, 0.65),
            shadow=False, shade=0)
    return S


def troll():
    skin = SKIN["troll"]
    S = Sprite('TROLL (round 5): blue-teal green skin, no eyes; a huge hunched back with a shaggy moss-dark mane, a '
               'small head pushed forward, a long drooping nose, lower tusks, big hands, a knotted log club. Parts: '
               '#arm-r (club + fist, before #body), #body, #arm-l (big free fist). Front = DOWN (+y).')
    S.group("arm-r", (162, 116))
    club(S, 166, 140, 14, L=66, w0=14, w1=30)
    gfist(S, 166, 136, 14, skin, w=30, h=32)
    S.group("body")
    hump = sym([(100, 34), (150, 42), (186, 74), (192, 112), (176, 140), (100, 146)])
    S.shape(hump, S.lg(lt(skin, 0.06), dk(skin, 0.3)), shade=0.3)
    mane = sym([(100, 28), (130, 32), (158, 50), (166, 72, 'c'), (152, 70), (156, 92, 'c'), (140, 82), (136, 104, 'c'),
                (122, 90), (112, 106, 'c'), (100, 94)], 0.8)
    S.shape(mane, S.lg("#6E8E5A", "#3E5A3A"), sh=4, shade=0.25)
    tf = "translate(100 120) scale(0.8) translate(-100 -100)"
    ears(S, skin, [(138, 96), (160, 92), (168, 100), (156, 110), (140, 112)], tf=tf)
    if HEROES6:
        bald_head(S, skin, tf=tf)
    else:
        S.shape(HEAD, face_fill(S, skin), tf=tf, sh=5, op=0.32, shade=0,
                decor=[f'<rect x="100" y="-20" width="80" height="240" fill="{side_shade(S, skin)}" transform="{tf}"/>'])
        scalp(S, skin, tf=tf)
    S.shape(blob([(92, 84), (108, 84), (110, 104), (100, 112), (90, 104)]), S.lg("#3E6A58", "#20382E"), tf=tf, sh=3, shade=0.2)
    S.raw(f'<path d="M83 139 Q100 146 117 139" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3" stroke-linecap="round" transform="{tf}"/>')
    S.shape(blob([(91, 108), (109, 108), (114, 140), (108, 164), (100, 172), (92, 164), (86, 140)], 0.9),
            S.lg(lt(skin, 0.05), dk(skin, 0.28)), tf=tf, sh=4, shade=0.25)
    S.group("arm-l", (38, 116))
    gfist(S, 32, 146, -8, skin, w=30, h=32, knuckle=-1)
    return S


# round 8 (art-round7 deck, on the "(before)" tile of Troll A, which showed this round-6 troll: "Liked this ones overall
# shape more. Fix face and make like 2x bigger overall and will look pretty good. Also needs a boulder"): troll8() is
# troll() (the round-6 file the designer saw) with only these changes:
#   face:    the long drooping nose (it read as a trunk) and the dark patch above it (a hole) are gone; in their place a
#            big round nose and a heavy underbite with two small tusks coming up out of the mouth (the family's face:
#            the round-7 orc and trolls). Head size, ears, hump and moss patch as they were.
#   boulder: both big fists reach forward on long arms, turned in to hold a boulder in front of it. The boulder is the
#            game's own (js/foes9.js: it rolls off on its own), so it is a prop of its own (troll-boulder.svg); the log
#            club is gone (the boulder is its weapon now; the designer: "The base troll should also attack with a
#            boulder").
#   2x:      in the game (js/enemies.js, the troll's r 42 -> 60, vr 31 -> 44), not in this file; the boards show it at
#            that size beside the archer.
TROLL_R8 = True
BOULDER_SKIN = ("#A49C90", "#6C645C")   # the troll's boulder: grey stone, moss on top


def troll8():
    skin = SKIN["troll"]
    S = Sprite('TROLL (round 8): the round-6 troll with its face fixed and a boulder to hold: blue-teal green skin, no '
               'eyes; a huge hunched back with a moss-dark patch of hair, a small head pushed forward, small ears, a big '
               'round nose, a heavy underbite with two small tusks coming up out of the mouth; long arms reaching forward '
               'either side of the head, big plain fists turned in to hold its boulder (a prop of its own in the game). '
               'Parts: #arm-l, #arm-r (arm and fist, before #body so the hump covers the shoulders), #body. '
               'Front = DOWN (+y).')
    for gid, side in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + side * 62, 116))
        arm = [(100 + side * 64, 118), (100 + side * 60, 148), (100 + side * 44, 170)]
        S.shape(stroke_path(arm, 32, 27, 0.9), S.lg(lt(skin, 0.02), dk(skin, 0.3)), shadow=False, shade=0.25)
        # a big plain fist, rounder than the heroes' (at this size their corner radius reads as a box)
        S.shape(rr(0, 0, 32, 30, 13), lgs(S, skin), tf=frame(100 + side * 40, 176, side * 30), sh=3)
    S.group("body")
    hump = sym([(100, 34), (150, 42), (186, 74), (192, 112), (176, 140), (100, 146)])
    S.shape(hump, S.lg(lt(skin, 0.06), dk(skin, 0.3)), shade=0.3)
    mane = sym([(100, 28), (130, 32), (158, 50), (166, 72, 'c'), (152, 70), (156, 92, 'c'), (140, 82), (136, 104, 'c'),
                (122, 90), (112, 106, 'c'), (100, 94)], 0.8)
    S.shape(mane, S.lg("#6E8E5A", "#3E5A3A"), sh=4, shade=0.25)
    tf = "translate(100 120) scale(0.8) translate(-100 -100)"
    ears(S, skin, [(138, 96), (160, 92), (168, 100), (156, 110), (140, 112)], tf=tf)
    bald_head(S, skin, tf=tf)
    # the face: underbite jaw, tusks out of the mouth, mouth line over their roots, a big round nose above
    jaw = blob([(70, 134), (100, 138), (130, 134), (136, 150), (122, 164), (100, 168), (78, 164), (64, 150)], 0.9)
    S.shape(jaw, S.lg(lt(skin, 0.04), dk(skin, 0.24)), tf=tf, sh=3, op=0.32, shade=0.22)
    th, tw = 20, 9
    tusk = [(116 - tw / 2, 148), (116 + tw / 2, 148), (116 + tw * 0.6, 148 - th * 0.55), (116 + tw * 0.9, 148 - th, 'c'),
            (116 - tw * 0.15, 148 - th * 0.5)]
    for pts in (tusk, mx(tusk)):
        S.shape(blob(pts, 0.8), S.lg(*BONE), tf=tf, shadow=False, shade=0.15)
    S.raw(f'<path d="M82 148 Q100 144 118 148" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3" stroke-linecap="round" transform="{tf}"/>')
    nose = blob([(92, 106), (108, 106), (116, 120), (112, 134), (100, 138), (88, 134), (84, 120)], 0.95)
    S.shape(nose, S.lg(lt(skin, 0.08), dk(skin, 0.22)), tf=tf, sh=3, op=0.28, shade=0.22)
    return S


# round 10 (art-round8 deck, on the Troll: "Try different heads. Make them slightly smaller keep boulder same size. Make
# version without arms. Just hands"): troll10(head, arms) is troll8() (the file the designer saw) with only the head
# swapped (head "a", "b", "c") and, with arms=False, the two long arms left out so only the hands hold the boulder. The
# hump, the moss patch, the fists and their places are troll8's. "Slightly smaller" is the game's size (and the board's).
def troll10(head="a", arms=True):
    skin = SKIN["troll"]
    what = {"a": "head A: a wide jaw with two big tusks at the corners of the mouth, long ears swept back, a heavy brow, a flat nose",
            "b": "head B: a big potato nose over a small mouth with one snaggle tooth, round ears, a mop of moss hair over the brow",
            "c": "head C: a broad flat-topped head with two stubby horns, drooping ears, a wide mouth showing a row of blunt teeth"}[head]
    S = Sprite(f'TROLL (round 10, {what}; {"long arms" if arms else "no arms, just the hands"}): the round-8 troll with a '
               'different head: blue-teal green skin, no eyes, the huge hunched back with its moss-dark patch of hair, big '
               'plain fists turned in to hold its boulder (a prop of its own in the game). Parts: #arm-l, #arm-r '
               f'({"arm and fist" if arms else "the fist"}, before #body), #body. Front = DOWN (+y).')
    for gid, side in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + side * 62, 116))
        if arms:
            arm = [(100 + side * 64, 118), (100 + side * 60, 148), (100 + side * 44, 170)]
            S.shape(stroke_path(arm, 32, 27, 0.9), S.lg(lt(skin, 0.02), dk(skin, 0.3)), shadow=False, shade=0.25)
        S.shape(rr(0, 0, 32, 30, 13), lgs(S, skin), tf=frame(100 + side * 40, 176, side * 30), sh=3, shadow=arms)
    S.group("body")
    hump = sym([(100, 34), (150, 42), (186, 74), (192, 112), (176, 140), (100, 146)])
    S.shape(hump, S.lg(lt(skin, 0.06), dk(skin, 0.3)), shade=0.3)
    mane = sym([(100, 28), (130, 32), (158, 50), (166, 72, 'c'), (152, 70), (156, 92, 'c'), (140, 82), (136, 104, 'c'),
                (122, 90), (112, 106, 'c'), (100, 94)], 0.8)
    S.shape(mane, S.lg("#6E8E5A", "#3E5A3A"), sh=4, shade=0.25)
    tf = "translate(100 120) scale(0.8) translate(-100 -100)"
    mouth_col = dk(skin, 0.55)
    if head == "a":
        ears(S, skin, [(136, 104), (158, 84), (184, 70), (176, 92), (160, 108), (142, 118)], inner=[(146, 104), (160, 92), (172, 84), (160, 102)], tf=tf)
        bald_head(S, skin, tf=tf)
        # a heavy brow: the scalp's lower edge shades the face
        scalp(S, skin, d="M 52.5 114 C 50 70 70 47.8 100 47.8 C 130 47.8 150 70 147.5 114 C 134 104 118 102 100 104 C 82 102 66 104 52.5 114 Z", tf=tf)
        jaw = blob([(58, 132), (100, 136), (142, 132), (148, 150), (130, 166), (100, 170), (70, 166), (52, 150)], 0.9)
        S.shape(jaw, S.lg(lt(skin, 0.04), dk(skin, 0.24)), tf=tf, sh=3, op=0.32, shade=0.22)
        th, tw = 30, 13
        tusk = [(128 - tw / 2, 147), (128 + tw / 2, 147), (128 + tw * 0.7, 147 - th * 0.55), (128 + tw * 0.95, 147 - th, 'c'),
                (128 - tw * 0.1, 147 - th * 0.5)]
        for pts in (tusk, mx(tusk)):
            S.shape(blob(pts, 0.8), S.lg(*BONE), tf=tf, shadow=False, shade=0.15)
        S.raw(f'<path d="M66 147 Q100 142 134 147" fill="none" stroke="{mouth_col}" stroke-width="3" stroke-linecap="round" transform="{tf}"/>')
        S.flat(f"{ell(94, 126, 2.6, 4)} {ell(106, 126, 2.6, 4)}", dk(skin, 0.5), tf=tf, op=0.8)
    elif head == "b":
        ears(S, skin, [(140, 104), (156, 98), (166, 108), (162, 122), (148, 126), (140, 118)], tf=tf)
        bald_head(S, skin, tf=tf)
        # a tuft of moss hair on the crown, its fringe over the brow
        mop = blob([(58, 86), (60, 66), (76, 50), (100, 44), (124, 50), (140, 66), (142, 86, 'c'), (130, 80), (122, 92, 'c'),
                    (112, 82), (100, 94, 'c'), (88, 82), (78, 92, 'c'), (70, 80)], 0.8)
        S.shape(mop, S.lg("#6E8E5A", "#3E5A3A"), tf=tf, sh=4, shade=0.25)
        S.raw(f'<path d="M84 141 Q100 137 116 141" fill="none" stroke="{mouth_col}" stroke-width="3" stroke-linecap="round" transform="{tf}"/>')
        S.shape(blob([(105, 140), (114, 140.5), (111, 129, 'c')], 0.6), S.lg(*BONE), tf=tf, shadow=False, shade=0.1)
        nose = blob([(91, 94), (109, 94), (120, 108), (118, 124), (100, 131), (82, 124), (80, 108)], 0.95)
        S.shape(nose, S.lg(lt(skin, 0.1), dk(skin, 0.22)), tf=tf, sh=4, op=0.3, shade=0.22,
                decor=[f'<circle cx="111" cy="109" r="4" fill="{dk(skin, 0.3)}" opacity="0.6" transform="{tf}"/>'])
    else:
        ears(S, skin, [(140, 96), (166, 98), (178, 112), (170, 126), (156, 116), (142, 114)], tf=tf)
        for pts in ([(118, 64), (132, 60), (142, 44), (146, 30, 'c'), (132, 38), (122, 50)],):
            for q in (pts, mx(pts)):
                S.shape(blob(q, 0.8), S.lg(*BONE), tf=tf, shadow=False, shade=0.18)
        flat = blob([(100, 52), (134, 54), (150, 70), (152, 104), (146, 134), (128, 152), (100, 156), (72, 152), (54, 134),
                     (48, 104), (50, 70), (66, 54)], 0.9)
        bald_head(S, skin, d=flat, tf=tf)
        scalp(S, skin, d="M 50 108 C 46 70 62 52 100 52 C 138 52 154 70 150 108 C 136 100 118 98 100 100 C 82 98 64 100 50 108 Z", tf=tf)
        # a wide mouth with a row of blunt lower teeth
        S.shape(rr(100, 139, 52, 15, 7), S.lg(dk(skin, 0.6), dk(skin, 0.7)), tf=tf, shadow=False, shade=0)
        S.shape(" ".join(rr(x, 141.5, 9, 10, 2.5) for x in (82, 94, 106, 118)), S.lg(*BONE), tf=tf, shadow=False, shade=0.12)
        S.flat(f"{ell(95, 122, 2.6, 3.6)} {ell(105, 122, 2.6, 3.6)}", dk(skin, 0.5), tf=tf, op=0.8)
    return S


def boulder():
    """The troll's boulder, a prop (art/props/troll-boulder.svg): round, so it can roll; grey stone lit from the top
    left, a few flat chips on it, moss growing over the top. Sized like the other rocks: r 30 in the game at scale 1
    (radius 76 in the 220 box), so the game scales it by r / 30."""
    S = Sprite('TROLL BOULDER (round 8): the boulder a troll pushes and rolls: a big round grey stone, lit from the top '
               'left, a few flat chips, a cap of moss over the top. A prop: r 30 at scale 1 (the game scales it by r / 30). '
               'No parts. Front = DOWN (+y).')
    S.group("body")
    R = 74
    pts = []
    for i in range(16):
        a = math.radians(i * 360 / 16 + 6)
        r = R * (1.0, 0.975, 0.99, 0.965)[i % 4]
        pts.append((100 + math.cos(a) * r, 100 + math.sin(a) * r))
    rock = blob(pts, 1.0)
    lit = S.rg(lt(BOULDER_SKIN[0], 0.2), BOULDER_SKIN[1], 0.36, 0.3, 0.8)
    chips = (f'<path d="{blob([(56, 122), (72, 114), (84, 124), (74, 136), (60, 134)], 0.9)}" fill="#4E4842" opacity="0.16"/>'
             f'<path d="{blob([(118, 140), (138, 132), (148, 146), (132, 158), (120, 154)], 0.9)}" fill="#4E4842" opacity="0.16"/>'
             f'<ellipse cx="72" cy="66" rx="20" ry="12" transform="rotate(-35 72 66)" fill="#FFFFF4" opacity="0.2"/>')
    S.shape(rock, lit, shadow=False, shade=0.32, decor=[chips])
    # a small tuft of moss on the top right (a cap over the whole top read as part of the troll beside it)
    moss = blob([(112, 36), (132, 40), (150, 56), (156, 74, 'c'), (146, 70), (140, 80, 'c'), (130, 70), (120, 76, 'c'),
                 (114, 62), (104, 58, 'c'), (104, 46)], 0.9)
    S.shape(moss, S.lg("#86A664", "#4A6A3C"), sh=3, op=0.25, shade=0.2)
    return S


# round 7 (the troll: "Looks weird"): reworked, in two versions (troll7); the round-5/6 troll() is kept as it was.
TROLL_R7 = True


def troll7(take):
    """Both: blue-teal skin, no eyes, built like the rest of the family (a head token on big shoulders, two plain fists,
    a knotted log club in the right fist behind the body), a heavy underbite with two lower tusks coming out of the
    mouth (their roots under the mouth line, as on the round-7 orc), a big round nose (round 6's long drooping nose
    read as a trunk, and the dark patch above it as a hole; both gone).
    a, "mohawk": a new take: a ragged rust-red crest of hair from the brow back over the head and on down the back,
    long ears swept back and out, big tusks curving up and out.
    b, "shaggy": round 6's hunched troll with its weird parts fixed: the head bigger (0.92, it was 0.8); the dark
    moss-green hair, a patch on the hump that read like a wig, now covers the whole hunched back as a shaggy coat with
    a ragged edge and grows on over the top of the head to a ragged fringe over the brow; drooping ears; smaller
    tusks."""
    skin = SKIN["troll"]
    if take == "a":
        S = Sprite('TROLL, mohawk (round 7): blue-teal skin, no eyes; a ragged rust-red crest of hair from the brow back '
                   'over the head and on down the back, long ears swept back and out, a broad round nose, a heavy '
                   'underbite with two big tusks curving up out of the mouth; hunched shoulders, big plain fists, a '
                   'knotted log club. Parts: #arm-r (club + fist, before #body), #body, #arm-l (free fist). '
                   'Front = DOWN (+y).')
    else:
        S = Sprite('TROLL, shaggy (round 7): blue-teal skin, no eyes; a huge hunched back under a shaggy coat of moss-dark '
                   'hair with a ragged edge, the hair growing on over the top of the head to a ragged fringe over the brow; '
                   'drooping ears, a big round nose, a heavy underbite with two lower tusks coming out of the mouth; big '
                   'plain fists, a knotted log club. Parts: #arm-r (club + fist, before #body), #body, #arm-l (free fist). '
                   'Front = DOWN (+y).')
    S.group("arm-r", (156, 114))
    club(S, 164, 144, 12, L=70, w0=14, w1=30)
    gfist(S, 164, 142, 12, skin, w=30, h=32, plain=True)
    S.group("body")
    if take == "a":
        tf = None
        S.shape(sym([(100, 66), (148, 70), (182, 92), (188, 118), (170, 140), (100, 148)]), S.lg(lt(skin, 0.06), dk(skin, 0.3)),
                shade=0.3)
        ears(S, skin, [(140, 96), (168, 80), (204, 70, 'c'), (176, 96), (144, 112)])
        bald_head(S, skin)
        crest = sym([(100, 12), (108, 26), (116, 30, 'c'), (112, 44), (120, 50, 'c'), (114, 62), (121, 70, 'c'),
                     (114, 80), (119, 90, 'c'), (108, 94), (100, 100)], 0.85)
        S.shape(crest, S.lg("#D8583A", "#8E2A22"), sh=3, op=0.3, shade=0.25)
        nose = blob([(93, 106), (107, 106), (114, 124), (108, 134), (100, 136), (92, 134), (86, 124)], 0.95)
        th, tw = 30, 11
    else:
        tf = "translate(100 116) scale(0.92) translate(-100 -100)"
        # the hunched back is all shaggy moss-dark fur: a ragged edge of tufts all round it
        pts = []
        for i in range(21):
            a = math.radians(-90 + (i - 10) * 10.8)
            r0 = (1.0, 0.97, 1.02)[i // 2 % 3] if i % 2 == 0 else 0.9
            pts.append((100 + 90 * r0 * math.cos(a) * 1.0, 92 + 62 * r0 * math.sin(a), 'c' if i % 2 == 0 else None))
        pts = [(x, y, c) if c else (x, y) for x, y, c in pts]
        fur = pts + [(176, 128), (100, 140), (24, 128)]
        S.shape(blob(fur, 0.8), S.lg("#6E8E5A", "#2E4632"), shade=0.3,
                decor=[f'<path d="{blob([(70, 40), (96, 30), (104, 60), (84, 80), (66, 66)])}" fill="#86A66E" opacity="0.35"/>'])
        ears(S, skin, [(138, 102), (162, 98), (180, 110, 'c'), (162, 120), (140, 120)], tf=tf)
        bald_head(S, skin, tf=tf)
        # the same fur grows over the top of the head, ending in a ragged fringe over the brow
        cap = sym([(100, 30), (128, 34), (146, 52), (152, 76), (150, 98, 'c'), (140, 92), (132, 104, 'c'), (122, 96),
                   (112, 106, 'c'), (100, 98)], 0.85)
        S.shape(cap, S.lg("#6E8E5A", "#2E4632"), tf=tf, sh=4, op=0.3, shade=0.25)
        nose = blob([(92, 108), (108, 108), (116, 124), (110, 138), (100, 141), (90, 138), (84, 124)], 0.95)
        th, tw = 20, 9
    jaw = blob([(70, 134), (100, 138), (130, 134), (136, 150), (122, 164), (100, 168), (78, 164), (64, 150)], 0.9)
    S.shape(jaw, S.lg(lt(skin, 0.04), dk(skin, 0.24)), tf=tf, sh=3, op=0.32, shade=0.22)
    tusk = [(116 - tw / 2, 148), (116 + tw / 2, 148), (116 + tw * 0.6, 148 - th * 0.55), (116 + tw * 0.9, 148 - th, 'c'),
            (116 - tw * 0.15, 148 - th * 0.5)]
    for pts in (tusk, mx(tusk)):
        S.shape(blob(pts, 0.8), S.lg(*BONE), tf=tf, shadow=False, shade=0.15)
    S.raw(f'<path d="M82 148 Q100 144 118 148" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3" stroke-linecap="round"'
          + (f' transform="{tf}"' if tf else "") + '/>')
    S.shape(nose, S.lg(lt(skin, 0.08), dk(skin, 0.22)), tf=tf, sh=3, op=0.28, shade=0.22)
    S.group("arm-l", (44, 114))
    gfist(S, 36, 144, -8, skin, w=30, h=32, knuckle=-1, plain=True)
    return S


# round 8 (art-round7 deck, on Troll A, mohawk: "Keep this but not as a troll"): kept exactly as it was (troll7("a"):
# the same shapes and colours, byte for byte but the comment), and it is now the Warren's chieftain: the boss the
# designer renamed ("The Warboss: Chieftain. More abilities."). The red war crest, the big tusks and the club make it
# the tribe's chief, and next to the Warren's trolls (the hunched mounds) it stands upright on its shoulders. Only its
# name changes; the game still draws the Warboss as the orc until the boss lane takes this up.
CHIEF_R8 = True


def chieftain8():
    S = troll7("a")
    S.comment = S.comment.replace("TROLL, mohawk (round 7)", "CHIEFTAIN (round 8: the round-7 Troll A, mohawk, kept as it "
                                  "was and made the Warren's chieftain, the boss)")
    return S


def ogre():
    skin = SKIN["ogre"]
    S = Sprite('OGRE (round 5): drab moss skin, no eyes; a big round bald head, a heavy underbite with two stubby '
               'teeth, fat shoulders with a spotted hide over one, and no weapon: two huge fists in iron cuffs. '
               'Parts: #body, #arm-l and #arm-r (the fists, after #body). Front = DOWN (+y).')
    S.group("body")
    S.shape(ell(100, 112, 90, 38), S.lg(lt(skin, 0.06), dk(skin, 0.3)), shade=0.3)
    S.shape(blob([(22, 96), (60, 80), (84, 84), (80, 118), (56, 138), (22, 132), (12, 114)]), S.lg("#D8B27A", "#A07A4A"), sh=3, shade=0.25,
            decor=['<circle cx="36" cy="104" r="7" fill="#7A5634" opacity="0.6"/><circle cx="60" cy="94" r="5" fill="#7A5634" opacity="0.6"/>'
                   '<circle cx="50" cy="126" r="6" fill="#7A5634" opacity="0.6"/>'])
    head = "M 100 40 C 136 40 156 64 156 98 C 156 130 134 156 100 156 C 66 156 44 130 44 98 C 44 64 64 40 100 40 Z"
    ears(S, skin, [(150, 94), (166, 90), (170, 102), (160, 110), (150, 108)])
    r5 = OGRE_R7  # round 7: the round-5 ogre (its brow crease back) with the plain fists (see OGRE_R7)
    if r5:
        S.comment = S.comment.replace("two huge fists in iron cuffs", "two huge plain fists in iron cuffs (round 7: no "
                                      "knuckle bumps)")
    if HEROES6 and not r5:
        bald_head(S, skin, d=head)
    else:
        S.shape(head, face_fill(S, skin, 96, 156), sh=5, op=0.32, shade=0,
                decor=[f'<rect x="100" y="-20" width="80" height="240" fill="{side_shade(S, skin, 100, 160)}"/>'])
        scalp(S, skin, d="M 44.5 106 C 42 64 64 40 100 40 C 136 40 158 64 155.5 106 C 144 98 124 96 100 98 C 76 96 56 98 44.5 106 Z")
    jaw = blob([(64, 128), (100, 132), (136, 128), (142, 146), (126, 162), (100, 166), (74, 162), (58, 146)], 0.9)
    S.shape(jaw, S.lg(lt(skin, 0.04), dk(skin, 0.24)), sh=3, op=0.32, shade=0.22)
    S.raw(f'<path d="M78 142 Q100 138 122 142" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3" stroke-linecap="round"/>')
    for x in (86, 114):
        S.shape(rr(x, 139, 10, 12, 3), S.lg(*BONE), shadow=False, shade=0.1)
    S.shape(blob([(90, 110), (110, 110), (116, 122), (100, 128), (84, 122)]), S.lg(lt(skin, 0.05), dk(skin, 0.25)), sh=3, shade=0.2)
    for gid, x, kn in (("arm-l", 30, -1), ("arm-r", 170, 1)):
        S.group(gid, (40 if x < 100 else 160, 114))
        S.shape(rr(x, 136, 30, 16, 6), S.lg("#9AA0AA", "#5E6472"), sh=3, shade=0.3)
        gfist(S, x, 154, 0, skin, w=30, h=34, knuckle=kn, plain=True if r5 else None)
    return S


if __name__ == "__main__":
    import sys
    want = sys.argv[1:]
    for name, fn in (("goblin", goblin), ("hobgoblin", hobgoblin), ("orc", orc), ("orc-shaman", shaman),
                     ("troll", troll), ("ogre", ogre)):
        if want and name not in want:
            continue
        if name == "troll" and TROLL_R7:
            for take in ("a", "b"):
                print(troll7(take).write(f"greenskin-troll-{take}.svg"))
            continue
        print(fn().write(f"greenskin-{name}.svg"))
