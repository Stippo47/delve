"""Round 5 critters in the house style: slimes (cube, drips turned to trail behind, no eyes), bat, ghost, two spiders,
snowman. All seen from straight above, chunky shapes, lit from the left, contact shadows, no eyes.
python critters.py   (writes ../../enemies/*.svg)
"""
from lib import *
import math

BONE = ("#F4EBD2", "#C9B98E")
WOOD = ("#9A6A40", "#5E3C22")
BAT_R6 = True
# round 7 ("remove body; make head bigger; maybe make ears different as well / bigger"): no body behind the head;
# the head (with its snout, nose and fangs) 1.28x as big, sitting where head and body were; the long ears swept
# straight back become big broad pointed ears standing up and out from the top of the head. Wings as they were.
BAT_R7 = True
SPIDER_R6 = True
SLIME_R6 = True
SNOWMAN_R6 = True
# round 7 ("weird red thing at back of snowman"): the scarf end trailing behind (#back) is gone; nothing else changed
SNOWMAN_R7 = True


# ----------------------------------------------------------------- slimes
def slime(kind):
    cols = {"big": ("#8FE3CB", "#3E9C86", 1.0), "small": ("#B4EEDD", "#58B49D", 0.66), "fire": ("#FFC070", "#D8482A", 1.0)}
    c1, c2, k = cols[kind]
    S = Sprite(f'SLIME, {kind} (round 5): the round-4 cube slime with its drips turned 180 degrees (they now trail '
               f'behind it, so it reads as moving forward) and no eyes. A soft rounded cube of jelly lit from the left, '
               + ('a swallowed bone inside, ' if kind == "big" else 'embers inside, ' if kind == "fire" else '')
               + f'one soft shine. Scaled {k}. Parts: #body only (the game squashes it whole). Front = DOWN (+y).', k=k)
    S.group("body")
    drips = [(70, 56, 14, 24), (100, 52, 17, 36), (131, 56, 12, 18)]
    if kind == "big" and SLIME_R6:
        drips = []  # round 6 ("remove tail"): the three drips trailing behind are gone; nothing else changed
    for x, y, w, L in drips:
        S.shape(blob([(x - w, y + 14), (x - w * 0.8, y - L * 0.45), (x - w * 0.95, y - L + w * 0.5), (x, y - L - w * 0.35),
                      (x + w * 0.95, y - L + w * 0.5), (x + w * 0.8, y - L * 0.45), (x + w, y + 14)], 1.0),
                S.lg(c1, c2), shadow=False, shade=0.2)
    inner = []
    if kind == "big":
        inner.append(f'<g transform="translate(118 116) rotate(-35)" opacity="0.35"><rect x="-5" y="-22" width="10" height="44" rx="5" fill="{dk(c2, 0.5)}"/>'
                     f'<circle cx="-6" cy="-22" r="7" fill="{dk(c2, 0.5)}"/><circle cx="6" cy="-22" r="7" fill="{dk(c2, 0.5)}"/>'
                     f'<circle cx="-6" cy="22" r="7" fill="{dk(c2, 0.5)}"/><circle cx="6" cy="22" r="7" fill="{dk(c2, 0.5)}"/></g>')
    if kind == "fire":
        inner.append(''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#FFF0A0" opacity="0.8"/>' for x, y, r in ((120, 120, 9), (84, 136, 6), (132, 88, 5))))
    inner.append(f'<path d="M36 140 C60 160 140 160 164 140 L164 180 L36 180 Z" fill="{dk(c2, 0.25)}" opacity="0.35"/>')
    S.shape(rr(100, 104, 136, 122, 44), S.lg(c1, c2), shade=0.3, decor=inner)
    S.flat(blob([(58, 78), (76, 66), (88, 70), (72, 84), (60, 90)], 1.0), "#FFFFFF", op=0.35)
    return S


# ----------------------------------------------------------------- bat
def bat():
    fur, mem = "#7E6070", "#5A3E54"
    S = Sprite('BAT (round 5), small: seen from above in flight; a round furry head with two big ears swept back, a '
               'small snout with two white fangs, no eyes; membrane wings spread to the sides (scalloped trailing edge, '
               'paler bones). Parts: #arm-l / #arm-r (the wings, pivots at the shoulders, so the game flaps them), '
               '#body (head and fur). Scaled 0.8. Front = DOWN (+y).', k=0.8)
    for gid, side in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + side * 26, 100))
        pts = [(120, 110), (156, 116), (190, 112), (210, 98, 'c'), (192, 86), (182, 64, 'c'), (166, 76), (150, 50, 'c'),
               (138, 72), (122, 64, 'c'), (118, 84)]
        if side < 0:
            pts = mx(pts)
        S.shape(blob(pts, 0.6), S.lg(lt(mem, 0.15), dk(mem, 0.3)), shadow=False, shade=0.2)
        for bone in ([(122, 104), (160, 106), (206, 98)], [(160, 106), (180, 68)], [(160, 106), (150, 56)]):
            b = bone if side > 0 else mx(bone)
            S.shape(stroke_path(b, 9, 5), S.lg(lt(mem, 0.35), lt(mem, 0.1)), shadow=False, shade=0)
    S.group("body")
    if BAT_R7:
        S.comment = S.comment.replace("a round furry head with two big ears swept back", "a big round furry head with no "
                                      "body behind it (round 7), two big broad pointed ears standing up and out").replace(
                                      "#body (head and fur)", "#body (head and ears)")
        hk = 1.28                                       # the head, its snout, nose and fangs: 1.28x, centred at (100, 106)
        htf = f"translate(100 106) scale({hk}) translate(-100 -112)"
        for side in (1, -1):
            ear = [(104, 82), (110, 62), (126, 38), (148, 16, 'c'), (150, 44), (142, 70), (128, 88)]
            inner = [(112, 78), (118, 60), (130, 42), (143, 27, 'c'), (143, 48), (136, 68), (126, 80)]
            S.shape(blob(ear if side > 0 else mx(ear), 0.8), S.lg(lt(fur, 0.12), dk(fur, 0.28)), shadow=False, shade=0.25,
                    decor=[f'<path d="{blob(inner if side > 0 else mx(inner), 0.8)}" fill="#C78A9A" opacity="0.6"/>'])
        S.shape(circ(100, 112, 36), S.lg(lt(fur, 0.22), dk(fur, 0.12)), tf=htf, sh=4, shade=0.3)
        S.shape(ell(100, 140, 14, 11), S.lg(lt(fur, 0.2), dk(fur, 0.1)), tf=htf, sh=3, shade=0.2)
        S.shape("M 93.5 135.5 C 93.5 131.5 106.5 131.5 106.5 135.5 C 106.5 139 102.5 141.5 100 141.5 C 97.5 141.5 93.5 139 93.5 135.5 Z",
                S.lg(dk(fur, 0.45), dk(fur, 0.65)), tf=htf, sh=1.5, op=0.25, shade=0)
        for x in (94, 106):
            S.shape(poly([(x - 3, 146), (x + 3, 146), (x, 155)]), S.lg("#FFFFFF", "#D8D0E0"), tf=htf, shadow=False, shade=0)
        return S
    S.shape(ell(100, 82, 26, 30), S.lg(lt(fur, 0.1), dk(fur, 0.3)), shadow=False, shade=0.3)
    for side in (1, -1):
        pts = [(110, 92), (124, 84), (134, 52, 'c'), (116, 70)]
        S.shape(blob(pts if side > 0 else mx(pts), 0.8), S.lg(lt(fur, 0.12), dk(fur, 0.28)), shadow=False, shade=0.25,
                decor=[f'<path d="{blob([(114, 86), (124, 80), (130, 62), (118, 74)] if side > 0 else mx([(114, 86), (124, 80), (130, 62), (118, 74)]), 0.8)}" fill="#C78A9A" opacity="0.6"/>'])
    if BAT_R6:
        # round 6 ("decent; fix shading; maybe add nose"): the face no longer uses the heroes' face gradient (dark at
        # the top for the shadow of a hat brim the bat doesn't have, so it showed as a dark band across its head); it is
        # lit like the rest of the bat, light top left to darker bottom right. A small dark nose on the snout.
        S.shape(circ(100, 112, 36), S.lg(lt(fur, 0.22), dk(fur, 0.12)), sh=4, shade=0.3)
        S.shape(ell(100, 140, 14, 11), S.lg(lt(fur, 0.2), dk(fur, 0.1)), sh=3, shade=0.2)
        S.shape("M 93.5 135.5 C 93.5 131.5 106.5 131.5 106.5 135.5 C 106.5 139 102.5 141.5 100 141.5 C 97.5 141.5 93.5 139 93.5 135.5 Z",
                S.lg(dk(fur, 0.45), dk(fur, 0.65)), sh=1.5, op=0.25, shade=0)
    else:
        S.shape(circ(100, 112, 36), face_fill(S, lt(fur, 0.15), 92, 148), sh=4, shade=0,
                decor=[f'<rect x="100" y="60" width="50" height="100" fill="{side_shade(S, fur, 100, 140)}"/>'])
        S.shape(ell(100, 140, 14, 11), S.lg(lt(fur, 0.2), dk(fur, 0.1)), sh=3, shade=0.2)
    for x in (94, 106):
        S.shape(poly([(x - 3, 146), (x + 3, 146), (x, 155)]), S.lg("#FFFFFF", "#D8D0E0"), shadow=False, shade=0)
    return S


# ----------------------------------------------------------------- ghost
def ghost():
    c1, c2 = "#F4F8FF", "#A8B6D8"
    S = Sprite('GHOST (round 5): a pale sheet-like head seen from above with a hollow dark mouth, no eyes; two wispy '
               'arms reaching forward; a long wispy tail trailing behind with a curl at the end. Face shaded like the '
               'humans (darker toward the top). Parts: #back (tail, sways), #arm-l / #arm-r (wisps), #body. '
               'Front = DOWN (+y).')
    S.group("back", (100, 80))
    S.shape(stroke_path([(100, 90), (94, 56), (106, 30), (128, 14), (146, 18), (150, 32)], 56, 6, 0.9), S.lg(c1, c2), shadow=False, shade=0.3)
    for gid, side in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + side * 40, 110))
        p = [(138, 104), (156, 122), (162, 150), (152, 164, 'c'), (148, 142), (130, 124)]
        S.shape(blob(p if side > 0 else mx(p), 0.8), S.lg(c1, c2), shadow=False, shade=0.25)
    S.group("body")
    S.shape(HEAD, S.lg(c1, c2), sh=5, shade=0.3,
            decor=[f'<path d="M40 104 C70 96 130 96 160 104 L160 112 C130 104 70 104 40 112 Z" fill="#8C9AC4" opacity="0.0"/>'])
    if HEROES6:
        # round 6 (closer to the heroes, whose mouths are small): the hollow mouth is a small dark "o" the size of the
        # picked round-3 ghost's mouth (it was twice that), where a hero's mouth sits. Nothing else changed.
        S.shape(ell(100, 137, 5.5, 6), S.lg("#3A3050", "#1E1830"), shadow=False, shade=0)
    else:
        S.shape(ell(100, 134, 10, 8), S.lg("#3A3050", "#1E1830"), shadow=False, shade=0)
    return S


# round 7 (on the "(before)" tile, the round-5 ghost: "Overall doesnt look good. Ghosts can also have eyes. Before or
# after"): a new ghost, with eyes, in two versions; the round-5/6 ghost() is kept as it was.
GHOST_R7 = True
# round 8 (art-round7 deck, on Ghost B: "Remove the sliver on their back for this and the other ghost I liked"): the
# narrow darker fold running from the middle of the head back into the tail is gone, on both. Nothing else changed.
GHOST_R8 = True


# round 10 (art-round8 deck, on Ghost A: "Tail is still a bit weird. Try 3 types."; Ghost B: "Same thing"): ghost7's
# tail= swaps only the tail's outline points (everything from the shoulders forward is the round-8 ghost): see TAILS10.
TAILS10 = {
    # a plain soft point straight back
    "point": [(84, 40), (93, 20), (100, 3, 'c'), (107, 20), (117, 42)],
    # short and round: no tail to speak of, an egg
    "stub": [(84, 44), (92, 33), (100, 29), (108, 33), (118, 47)],
    # a sheet's hem: a bell with three rounded scallops along its back edge
    "hem": [(74, 46), (71, 31), (80, 23), (88, 32, 'c'), (93, 21), (100, 17), (107, 21), (112, 32, 'c'), (120, 23), (129, 31),
            (126, 50)],
}


def ghost7(take, tail=None):
    """Both versions are a teardrop seen from above, the head and its trailing sheet one shape (no seam between them),
    lit from the top left, with the eyes and mouth at the front of the head and two stubby arms (before #body, so the
    sheet covers where they join).
    a, "sheet": a white sheet ghost: two big dark round eye holes and a small "o" mouth; the sheet narrows behind the
    head into a plump tail whose tip flicks to the side (the shape of the picked round-3 ghost, tail reworked).
    b, "wisp": a pale blue spirit: two tall dark eyes and no mouth; the tail ends in a small round curl; its arms are
    rounded sleeves reaching forward and out (a's stick out at the sides)."""
    if take == "a":
        c1, c2, fold = "#FFFFFF", "#CBCDEA", "#A2A6D2"
        S = Sprite('GHOST, sheet (round 7): a white sheet ghost seen from above, with eyes: a teardrop, the round head at '
                   'the front with two big dark eye holes and a small dark "o" mouth, the sheet narrowing behind it into a '
                   'plump tail whose tip flicks to the side; two stubby sheet arms reach out at the sides. Parts: '
                   '#arm-l / #arm-r (the arms, before #body), #body (sheet and face). Front = DOWN (+y).')
        out = [(100, 163), (62, 147), (53, 116), (59, 86), (74, 60), (86, 38), (96, 18), (112, 6), (132, 5, 'c'),
               (118, 14), (112, 30), (120, 52), (136, 78), (147, 112), (138, 147)]
        eyes, ery, mouth_at = (83, 117), 10.5, (100, 151)
        armc = (c1, c2)
    else:
        c1, c2, fold = "#F6FBFF", "#A9C2E8", "#8AA6D6"
        S = Sprite('GHOST, wisp (round 7): a pale blue spirit seen from above, with eyes: a teardrop, the round head at the '
                   'front with two tall dark eyes and no mouth, the body narrowing behind it into a plump tail that ends in '
                   'a small round curl; two rounded sleeves of arms reach forward and out. Parts: #arm-l / #arm-r (the arms, before '
                   '#body), #body (head, tail and face). Front = DOWN (+y).')
        out = [(100, 163), (62, 147), (53, 116), (59, 86), (74, 60), (88, 40), (96, 22), (108, 8), (126, 6), (136, 18),
               (132, 30), (122, 32), (120, 24), (114, 26), (114, 38), (124, 56), (138, 80), (147, 112), (138, 147)]
        eyes, ery, mouth_at = (84, 116), 13, None
        armc = (c1, c2)
    if tail:
        out = [(100, 163), (62, 147), (53, 116), (59, 86), (74, 60)] + TAILS10[tail] + [(136, 78), (147, 112), (138, 147)]
        S.comment = S.comment.replace("Parts:", {"point": "Round 10, tail type 1: the tail is a plain soft point straight back.",
                                                 "stub": "Round 10, tail type 2: short and round, an egg with no tail to speak of.",
                                                 "hem": "Round 10, tail type 3: a bell that ends in a hem of three rounded scallops."}[tail] + " Parts:")
    for gid, side in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + side * 36, 120))
        if take == "a":  # stubby arms out at the sides
            arm = [(132, 112), (150, 116), (164, 128), (168, 142), (160, 148), (145, 143), (131, 134)]
        else:            # rounded sleeves reaching forward and out
            arm = [(130, 114), (147, 120), (160, 134), (167, 152), (161, 160), (150, 156), (139, 144), (128, 132)]
        S.shape(blob(arm if side > 0 else mx(arm), 0.9), S.lg(lt(armc[0], 0.0), dk(armc[1], 0.04)), shadow=False, shade=0.25)
    S.group("body")
    body = blob(out, 0.9)
    lit = ug(S, [(0, c1), (0.55, mix(c1, c2, 0.45)), (1, c2)], 60, 20, 150, 160)
    glow = S.rg("#FFFFFF", "#FFFFFF", 0.5, 0.5, 0.5, 0.85, 0)
    sliver = [] if GHOST_R8 else [f'<path d="M 92 92 C 96 70 104 46 118 18 C 110 44 108 70 106 94 Z" fill="{fold}" opacity="0.3"/>']
    if GHOST_R8:
        S.comment = S.comment.replace("Parts:", "No fold down the back (round 8). Parts:")
    S.shape(body, lit, shadow=False, shade=0.3,
            decor=sliver + [f'<rect x="40" y="-10" width="120" height="96" fill="{ug(S, [(0, fold, 0.35), (1, fold, 0)], 0, 0, 0, 96)}"/>',
                            f'<circle cx="92" cy="114" r="46" fill="{glow}"/>'])
    for x in eyes:
        S.flat(ell(x, 130, 8 if take == "a" else 7, ery), "#2B2230")
    if mouth_at:
        S.flat(ell(*mouth_at, 4.5, 5.5), "#2B2230")
    return S


# ----------------------------------------------------------------- spiders
LEGS = [((124, 134), (166, 148), (164, 192)),
        ((134, 124), (182, 120), (200, 148)),
        ((134, 112), (182, 94), (200, 66)),
        ((126, 100), (164, 68), (160, 26))]


def spider(kind):
    if kind == "hunter":
        body, mark, k = "#9A7656", "#5A4030", 0.9
        desc = 'SPIDER, hunter (round 5): a sandy-brown hunting spider, chunky legs with dark tips, a dark chevron on the abdomen'
    else:
        body, mark, k = "#86749A", "#E8DEF0", 1.0
        desc = 'SPIDER, momma (round 5): a big purple-grey spider with a huge abdomen carrying pale egg bumps, thick legs'
    S = Sprite(desc + ', two fangs at the front, no eyes. Seen from straight above, few big shapes. Parts: #back (the '
               'abdomen and the six rear legs), #arm-l / #arm-r (the front legs, so the game can raise them to bite), '
               f'#body (head and fangs). Scaled {k}. Front = DOWN (+y).', k=k)
    lw0, lw1 = (16, 9) if kind == "hunter" else (19, 11)
    S.group("back", (100, 100))
    for side in (1, -1):
        for leg in LEGS[1:]:
            pts = list(leg) if side > 0 else mx(list(leg))
            S.shape(stroke_path(pts, lw0, lw1, 0.6), S.lg(lt(body, 0.05), dk(body, 0.35)), shadow=False, shade=0.25,
                    decor=[f'<circle cx="{pts[2][0]}" cy="{pts[2][1]}" r="16" fill="{dk(body, 0.5)}"/>'])
    if kind == "hunter":
        ab = ell(100, 60, 46, 50)
        dec = [f'<path d="{blob([(100, 30), (124, 50), (118, 78), (100, 64), (82, 78), (76, 50)], 0.7)}" fill="{mark}" opacity="0.75"/>']
    else:
        ab = ell(100, 54, 62, 60)
        dec = [f'<circle cx="{x}" cy="{y}" r="{r}" fill="{mark}" opacity="0.85"/>' for x, y, r in
               ((84, 40, 11), (112, 30, 9), (124, 58, 10), (96, 68, 9), (70, 64, 7), (136, 36, 6))]
    S.shape(ab, S.lg(lt(body, 0.1), dk(body, 0.35)), shade=0.3, decor=dec)
    for gid, side in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + side * 24, 132))
        pts = list(LEGS[0]) if side > 0 else mx(list(LEGS[0]))
        S.shape(stroke_path(pts, lw0, lw1, 0.6), S.lg(lt(body, 0.05), dk(body, 0.35)), shadow=False, shade=0.25,
                decor=[f'<circle cx="{pts[2][0]}" cy="{pts[2][1]}" r="16" fill="{dk(body, 0.5)}"/>'])
    S.group("body")
    if kind == "hunter" and SPIDER_R6:
        # round 6 ("fix fangs and shading"): the head is lit like the rest of the spider (light top left, darker bottom
        # right) instead of the heroes' face gradient, which put a dark band across it under the abdomen. The fangs:
        # two stubby jaws in the body's colour at the front of the head, each ending in a short ivory fang that curves
        # in (they were near-black, so they read as a hole in the outline, not as fangs).
        S.shape(ell(100, 118, 40, 38), S.lg(lt(body, 0.12), dk(body, 0.22)), sh=5, shade=0.3)
        for side in (1, -1):
            jaw = [(101, 140), (113, 139), (117, 150), (112, 160), (103, 158)]
            fang = [(103, 154), (111, 155), (109, 164), (103, 172, 'c'), (104, 163)]
            S.shape(blob(jaw if side > 0 else mx(jaw), 0.9), S.lg(dk(body, 0.05), dk(body, 0.3)), sh=3, shade=0.25)
            S.shape(blob(fang if side > 0 else mx(fang), 0.8), S.lg("#F4EBD2", "#C9B98E"), sh=2, op=0.25, shade=0.15)
    else:
        S.shape(ell(100, 118, 40, 38), face_fill(S, lt(body, 0.1), 84, 156), sh=5, shade=0,
                decor=[f'<rect x="100" y="60" width="60" height="120" fill="{side_shade(S, body, 100, 140)}"/>'])
        for side in (1, -1):
            p = [(104, 146), (118, 146), (116, 164), (106, 174, 'c'), (108, 160)]
            S.shape(blob(p if side > 0 else mx(p), 0.8), S.lg("#4A3A44", "#1E1820"), sh=3, shade=0.2)
    return S


# ----------------------------------------------------------------- snowman
def snowman():
    s1, s2 = "#FFFFFF", "#B8C8E0"
    S = Sprite('SNOWMAN (round 5): seen from straight above, upright (not leaning): a big snowball body behind a '
               'smaller snowball head, a plain dark top hat (two shapes, no band), a red scarf with one end trailing '
               'behind, a carrot nose poking forward, a coal smile, stick arms with twig hands. No eyes. Parts: '
               '#back (the scarf end), #arm-l / #arm-r (sticks), #body. Front = DOWN (+y).')
    if SNOWMAN_R7:
        S.comment = S.comment.replace("a red scarf with one end trailing behind", "a red scarf round the neck (round 7: its "
                                      "end trailing behind is gone)").replace("#back (the scarf end), ", "").replace(
                                      "a plain dark top hat (two shapes, no band)", "a blue knitted cap with a white bobble")
    else:
        S.group("back", (100, 92))
        S.shape(blob([(118, 96), (132, 92), (150, 40), (156, 22, 'c'), (140, 30), (122, 80)], 0.8), S.lg("#E8545A", "#A8282E"), shadow=False, shade=0.2)
    for gid, side in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + side * 56, 100))
        pts = [(150, 104), (176, 128), (192, 158)]
        b = pts if side > 0 else mx(pts)
        S.shape(stroke_path(b, 9, 6), S.lg(*WOOD), shadow=False, shade=0.2)
        for tw in ([(192, 158), (186, 176)], [(192, 158), (206, 166)], [(180, 134), (196, 132)]):
            t = tw if side > 0 else mx(tw)
            S.shape(stroke_path(t, 6, 3), S.lg(*WOOD), shadow=False, shade=0)
    S.group("body")
    if SNOWMAN_R6:
        # round 6 ("stop having it look like it's leaning over; stack the head over the body in the middle"): the head
        # now sits dead centre on the body, both balls centred on the sprite's centre (100, 100), so it stands straight
        # up under the camera. The scarf ring round the neck, the beanie, the coal smile and the carrot nose move up with
        # the head (the head was 36 units in front of the body's centre). Same shapes, sizes and colours.
        dy = -20
        S.shape(circ(100, 100, 70), S.lg(s1, s2), shade=0.25)
        S.shape(ell(100, 103, 54, 50), S.lg("#E8545A", "#A8282E"), sh=4, shade=0.25,
                decor=['<path d="M40 100 L160 100 L160 106 L40 106 Z" fill="#A8282E" opacity="0.4"/>'])
        S.shape(circ(100, 100, 46), S.lg(s1, s2), sh=5, shade=0.28)
    else:
        dy = 0
        S.shape(circ(100, 84, 70), S.lg(s1, s2), shade=0.25)
        S.shape(ell(100, 114, 54, 42), S.lg("#E8545A", "#A8282E"), sh=4, shade=0.25,
                decor=['<path d="M40 100 L160 100 L160 106 L40 106 Z" fill="#A8282E" opacity="0.4"/>'])
        S.shape(circ(100, 120, 46), S.lg(s1, s2), sh=5, shade=0.28)
    for x in (84, 92, 100, 108, 116):
        S.flat(circ(x, 154 + dy - abs(x - 100) * 0.3, 3.2), "#2E2834")
    S.shape("M 55 126 C 52 92 72 72 100 72 C 128 72 148 92 145 126 C 134 116 118 112 100 114 C 82 112 66 116 55 126 Z",
            S.lg("#6E9CE6", "#3460B0"), sh=4, shade=0.28, tf=f"translate(0 {dy})" if dy else None,
            decor=['<path d="M40 104 C70 94 130 94 160 104 L160 132 L40 132 Z" fill="#9CC0F4" opacity="0.55"/>'] if not dy else
                  [f'<path d="M40 {104 + dy} C70 {94 + dy} 130 {94 + dy} 160 {104 + dy} L160 {132 + dy} L40 {132 + dy} Z" fill="#9CC0F4" opacity="0.55"/>'])
    S.shape(circ(100, 82 + dy, 13), S.lg("#FFFFFF", "#C8D4EA"), sh=3, shade=0.2)
    S.shape(blob([(93, 132 + dy), (107, 132 + dy), (102, 170 + dy), (100, 178 + dy, 'c'), (98, 170 + dy)], 0.8),
            S.lg("#FFAA50", "#E06A1E"), sh=3, shade=0.2)
    return S


if __name__ == "__main__":
    for kind in ("big", "small", "fire"):
        print(slime(kind).write(f"slime-{kind}.svg"))
    print(bat().write("bat.svg"))
    if GHOST_R7:
        for take in ("a", "b"):
            print(ghost7(take).write(f"ghost-{take}.svg"))
    else:
        print(ghost().write("ghost.svg"))
    for kind in ("hunter", "momma"):
        print(spider(kind).write(f"spider-{kind}.svg"))
    print(snowman().write("snowman.svg"))
