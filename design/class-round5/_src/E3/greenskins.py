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


def lgs(S, skin):
    return S.lg(lt(skin, 0.12), dk(skin, 0.22))


def gfist(S, x, y, a, skin, w=21, h=24, knuckle=1):
    return fist(S, x, y, a, lgs(S, skin), w=w, h=h, knuckle=knuckle)


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


def tusks(S, xs=(84, 116), y=150, h=16, w=8, lean=4):
    """Lower tusks rising from the jaw at the front, pointing back up toward the brow."""
    for x in xs:
        s = 1 if x > 100 else -1
        S.shape(blob([(x - w / 2, y), (x + w / 2, y), (x + s * lean * 0.5 + w * 0.18, y - h * 0.6), (x + s * lean, y - h, 'c'),
                      (x + s * lean * 0.5 - w * 0.3, y - h * 0.55)], 0.8), S.lg(*BONE), sh=2, op=0.25, shade=0.15)


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


def orc():
    skin = SKIN["orc"]
    S = Sprite('ORC (round 5): grass-green skin, no eyes; heavy brow, a big underbite jaw with two tusks, a black '
               'topknot with a braid trailing back, a brown fur mantle, a big cleaver. Parts: #back (braid), #arm-r '
               '(cleaver + fist, before #body), #body, #arm-l (free fist). Front = DOWN (+y).')
    S.group("back", (100, 70))
    S.shape(stroke_path([(100, 60), (98, 40), (102, 20), (99, 2)], 15, 7), S.lg("#4A4250", "#231C28"), shadow=False, shade=0.2)
    S.group("arm-r", (154, 110))
    cleaver(S, 154, 142, 18)
    gfist(S, 154, 138, 18, skin, w=24, h=26)
    S.group("body")
    bumps = []
    for i in range(13):
        t = math.radians(200 + i * 11.67)
        bumps.append((100 + math.cos(t) * 84, 112 + math.sin(t) * 46))
    fur = blob([(100, 150), (40, 140), (14, 116)] + bumps[1:-1] + [(186, 116), (160, 140)], 0.8)
    S.shape(fur, S.lg("#9A7652", "#5E4430"), decor=['<path d="M10 128 C60 146 140 146 190 128 L190 160 L10 160 Z" fill="#4A3424" opacity="0.4"/>'])
    face(S, skin)
    scalp(S, skin, d="M 52.5 112 C 50 70 70 47.8 100 47.8 C 130 47.8 150 70 147.5 112 C 136 104 120 102 100 104 C 80 102 64 104 52.5 112 Z")
    S.shape(circ(100, 62, 15), S.lg("#4A4250", "#231C28"), sh=3, shade=0.2)
    jaw = blob([(70, 128), (100, 132), (130, 128), (136, 144), (122, 160), (100, 164), (78, 160), (64, 144)], 0.9)
    S.shape(jaw, S.lg(lt(skin, 0.04), dk(skin, 0.24)), sh=3, op=0.32, shade=0.22)
    S.raw(f'<path d="M84 140 Q100 136 116 140" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3" stroke-linecap="round"/>')
    tusks(S, (84, 116), 150, 20, 10, 5)
    S.group("arm-l", (46, 112))
    gfist(S, 44, 146, -6, skin, w=24, h=26, knuckle=-1)
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
        gfist(S, x, 154, 0, skin, w=30, h=34, knuckle=kn)
    return S


if __name__ == "__main__":
    import sys
    want = sys.argv[1:]
    for name, fn in (("goblin", goblin), ("hobgoblin", hobgoblin), ("orc", orc), ("orc-shaman", shaman),
                     ("troll", troll), ("ogre", ogre)):
        if want and name not in want:
            continue
        print(fn().write(f"greenskin-{name}.svg"))
