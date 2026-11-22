"""Round 10, the art-round9 notes on the bosses drawn with the A2 library:
  the choir singer   "Flip book. Hair weird": bosses9.choir_singer(r10=True): the round-4 cherub's hair, the book turned;
  the Gilded Seraph  "Looks decent as a base. Could be improved upon. Up the quality. Make more interesting": the same
                     seraph (six gold wings, a sun headdress, white and gold, hands out to cast) drawn again: the wings
                     are the picked angel's two-layer wings, three pairs set as a seraph's are (a pair raised over her
                     head, a pair spread, a pair swept down round her), a sunburst behind her head, a veil of gold;
  and, from the v12-bosses deck ("I want one of those biblically accurate angels"): one drawn for the boss lane to
                     build on: wheels within wheels set with eyes round one great eye, six wings.
python bosses10.py [name ...]   -> ../../enemies/boss-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *
import bosses9 as B9
from spire10 import WING_OUT, WING_IN

GOLDW, PALEW, DGOLD = "#F6CF5A", "#FFF0B8", "#D8A030"


def wing_pair(S, rot, k, col, dcol, pivot=(100, 92), shadow=0):
    """The picked angel's wing, both sides, turned rot degrees up (-) or down (+) about the middle of the back and
    scaled k."""
    for s in (1, -1):
        out, inn = (WING_OUT, WING_IN) if s > 0 else (mirror(WING_OUT), mirror(WING_IN))
        T = f"rotate({s * rot} {pivot[0]} {pivot[1]}) translate({pivot[0]} {pivot[1]}) scale({k}) translate({-pivot[0]} {-pivot[1]})"
        S.shape(blob(out, 0.7), col, T=T, shadow=shadow, sop=0.2)
        S.shape(blob(inn, 0.7), dcol, T=T, shadow=3, sop=0.2)


# round 11: hooks for the variant sets the notes ask for (A2/new11.py sets one, builds, and clears it). With every hook
# None the generators below draw exactly what they drew.
#   HEAD_FN(S)   the Gilded Seraph's head (face, hair and what she wears on it), in place of the diadem and veil of links
HEAD_FN = None


def seraph():
    S = Sprite("THE GILDED SERAPH (round 10): the round-9 seraph drawn again, the same figure: the heroes' bust build, no "
               "eyes, long pale gold hair, a white robe with gold trim and gold shoulder plates, her hands held out to "
               "cast in gold bracers (arm-l, arm-r: they lift when she casts); six golden wings, the picked angel's "
               "two-layer wings, set as a seraph's: a pair swept down round her shoulders, a pair spread wide, a pair "
               "raised behind her head (#back, sway); behind her head a sunburst of gold rays, on her brow a gold diadem "
               "with a sun jewel and a short veil of gold links over the top of her face. " + LAYOUT)
    S.group("back", (100, 94), "six wings")
    wing_pair(S, 38, 0.84, "#F2C24A", "#FFE08A")    # swept down
    wing_pair(S, -42, 0.86, GOLDW, PALEW, shadow=3)  # raised
    wing_pair(S, 2, 0.98, "#FFE9A0", "#FFF8DC", shadow=3)  # spread
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 54, 110), "a casting hand")
        S.shape(rr(100 + s * 52, 138, 30, 13, 5), GOLD, T=f"rotate({-s * 6} {100 + s * 52} 138)", shadow=0)
        fist(S, 100 + s * 52, 152, s * -6)
    S.group("body")
    S.shape(SHOULDERS, "#F8F4EA", decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", GOLD, 5, 0.9)
            + strokes("M 100 96 L 100 140", GOLD, 4, 0.7))
    for s in (-1, 1):
        S.shape(blob([(100 + s * 34, 84), (100 + s * 60, 78), (100 + s * 80, 92), (100 + s * 78, 114), (100 + s * 58, 122),
                      (100 + s * 40, 108)], 0.85), GOLD, shadow=3,
                decor=f'<path d="{ell(100 + s * 58, 90, 13, 6)}" fill="#FFFFFF" opacity="0.4"/>'
                      + strokes(f"M {100 + s * 42} 108 Q {100 + s * 60} 120 {100 + s * 78} 112", "#FFF2C0", 3.5, 0.9))
    # the sunburst behind her head: one disc of rays
    S.shape(poly(star(100, 82, 64, 44, 16, 0)), "#F2B53A", shadow=3, decor=f'<path d="{circ(100, 82, 46)}" fill="#FFE08A"/>')
    if HEAD_FN:
        HEAD_FN(S)
        return save("enemies", "boss-gilded-seraph", S)
    head(S)
    mouth(S, 138, "#9A6E68")
    S.shape(blob([(50, 122), (46, 84), (60, 56), (100, 44), (140, 56), (154, 84), (150, 122), (142, 104), (134, 90), (118, 84),
                  (100, 88), (82, 84), (66, 90), (58, 104)], 0.85), "#FFF4DA", shadow=4,
            decor=strokes("M 100 50 L 100 86", "#E8D4A8", 3, 0.6) + f'<path d="{ell(80, 62, 16, 9)}" fill="#FFFFFF" opacity="0.4"/>')
    # the veil: a fringe of gold links hanging from the diadem over the top of the face
    for x in range(68, 133, 8):
        S.shape(rr(x, 104 + (4 if (x // 8) % 2 else 0), 5, 16, 2.5), GOLD, shadow=1)
    S.shape("M 58 90 C 70 80 86 76 100 76 C 114 76 130 80 142 90 C 142 96 140 100 138 102 C 126 94 114 91 100 91 "
            "C 86 91 74 94 62 102 C 60 100 58 96 58 90 Z", GOLD, shadow=3, decor=strokes("M 62 92 C 76 82 124 82 138 92", "#FFF2C0", 3, 0.9))
    S.shape(circ(100, 82, 10), "#FFFBE8", shadow=2, decor='<circle cx="97" cy="79" r="3.5" fill="#FFFFFF"/>'
            + f'<path d="{circ(100, 82, 10)}" fill="none" stroke="#F2B53A" stroke-width="4"/>')
    return save("enemies", "boss-gilded-seraph", S)


def eye(S, cx, cy, rx, ry, rot=0, iris="#4AA0D8", look=(0, 0), shadow=2):
    """An open eye: a white almond, a coloured iris, a dark pupil, a glint."""
    T = f"rotate({rot} {cx} {cy})"
    alm = blob([(cx - rx, cy), (cx - rx * 0.5, cy - ry), (cx + rx * 0.5, cy - ry), (cx + rx, cy), (cx + rx * 0.5, cy + ry),
                (cx - rx * 0.5, cy + ry)], 0.9)
    ix, iy = cx + look[0], cy + look[1]
    S.shape(alm, "#FFFDF4", T=T, shadow=shadow, side=False,
            decor=f'<circle cx="{f(ix)}" cy="{f(iy)}" r="{f(ry * 0.92)}" fill="{iris}"/>'
                  f'<circle cx="{f(ix)}" cy="{f(iy)}" r="{f(ry * 0.46)}" fill="#2B2230"/>'
                  f'<circle cx="{f(ix - ry * 0.3)}" cy="{f(iy - ry * 0.35)}" r="{f(ry * 0.2)}" fill="#FFFFFF"/>')


def ring_band(cx, cy, rx, ry, w, rot):
    """An elliptical band (a wheel seen at a tilt) as one path with a hole."""
    return (ell(cx, cy, rx, ry) + " " + ell(cx, cy, rx - w, ry - w)), f"rotate({rot} {cx} {cy})"


def biblical():
    S = Sprite("A BIBLICALLY ACCURATE ANGEL (round 10, for the Gilded Spire's boss; the designer: \"I want one of those "
               "biblically accurate angels\"): no body at all: one great open eye in a gold socket at the middle, looking "
               "forward; round it two golden wheels crossing each other, each set with small open eyes; and six wings, the "
               "picked angel's two-layer wings in white and gold, a pair raised, a pair spread, a pair swept down (#back, "
               "sway). Kept to the game's shapes: few, big, one outline. Parts: #back (the six wings), #arm-l / #arm-r "
               "(the two wheels: they can turn against each other), #body (the great eye). " + LAYOUT)
    S.group("back", (100, 100), "six wings")
    wing_pair(S, 44, 0.8, "#F2E2B0", "#FFFFFF", pivot=(100, 100))
    wing_pair(S, -44, 0.8, "#F2E2B0", "#FFFFFF", pivot=(100, 100), shadow=3)
    wing_pair(S, 0, 0.98, "#FFFFFF", "#FFF6DC", pivot=(100, 100), shadow=3)
    for g, rot in (("arm-l", -30), ("arm-r", 30)):
        S.group(g, (100, 100), "a wheel set with eyes")
        d, T = ring_band(100, 100, 84, 36, 15, rot)
        S.shape(d, GOLD, T=T, shadow=3, rule="evenodd",
                decor=f'<path d="{ell(100, 100, 81, 33)}" fill="none" stroke="#FFF2C0" stroke-width="3" opacity="0.8"/>')
        for a in (0, 62, 118, 180, 242, 298):
            x, y = 100 + 76.5 * math.cos(math.radians(a)), 100 + 28.5 * math.sin(math.radians(a))
            r = math.radians(rot)
            gx, gy = 100 + (x - 100) * math.cos(r) - (y - 100) * math.sin(r), 100 + (x - 100) * math.sin(r) + (y - 100) * math.cos(r)
            eye(S, gx, gy, 9.5, 6, rot + math.degrees(math.atan2(28.5 * math.cos(math.radians(a)), -76.5 * math.sin(math.radians(a)))),
                iris="#4AA0D8", shadow=0)
    S.group("body")
    S.shape(poly(star(100, 100, 37, 28, 12, 15)), "#F2B53A", shadow=4)
    S.shape(circ(100, 100, 27), GOLD, shadow=0, decor=f'<path d="{ell(88, 84, 12, 6)}" fill="#FFFFFF" opacity="0.5"/>')
    eye(S, 100, 100, 23, 15, 0, iris="#3A8AD0", look=(0, 3), shadow=3)
    return save("enemies", "boss-biblical-angel", S)


BUILD = {"boss-choir-singer": lambda: B9.choir_singer(r10=True), "boss-gilded-seraph": seraph, "boss-biblical-angel": biblical}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
