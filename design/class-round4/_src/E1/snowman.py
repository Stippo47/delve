"""Snowman, upright (head straight above the body, so it no longer leans), plain hat. python snowman.py [a b]"""
import math
from lib import *

SNOW = ("#FFFFFF", "#C9D6EA")
SNOW_D = ("#EEF3FA", "#AFC0DA")


def lumpy(cx, cy, r, n=14, amp=2.6, phase=0):
    pts = []
    for i in range(n):
        a = math.radians(i * 360 / n + phase)
        rr_ = r + (amp if i % 2 == 0 else -amp * 0.4)
        pts.append((cx + math.cos(a) * rr_, cy + math.sin(a) * rr_))
    return blob(pts, 1.0)


def twig_arm(S, side):
    sh = (128, 112)
    pts = [(sh[0], sh[1]), (154, 108), (178, 98)]
    fingers = [[(166, 104), (176, 88)], [(176, 99), (192, 98)], [(170, 102), (184, 112)]]
    if side < 0:
        pts = [(200 - x, y) for x, y in pts]
        fingers = [[(200 - x, y) for x, y in f] for f in fingers]
    S.shape(stroke_path(pts, 9, 7), S.lg("#8A5A34", "#5A3820", x2=1, y2=0.2), shadow=False, shade=0)
    for f in fingers:
        S.shape(stroke_path(f, 6.5, 5), S.lg("#8A5A34", "#5A3820"), shadow=False, shade=0)


def snowman(take):
    hat = "a plain black top hat seen from above (a round crown on a round brim, one red band)" if take == "a" else \
        "a blue knitted beanie with a white pompom"
    S = Sprite(f'SNOWMAN take {take.upper()} (round 4): two packed-snow balls seen straight from above, the head sitting '
               f'right on top of the body so it stands upright (the round-3 one leaned forward), {hat}, two lumps of '
               'coal for eyes, a carrot nose pointing forward, a red scarf with one end blowing back, stick arms. About '
               '110% of the archer. Parts: #arm-l, #arm-r = the stick arms (pivot where they go into the body, before '
               '#body), #body = everything else. Facing = DOWN (+y), centre (100,100).')
    for side, gid in ((-1, "arm-l"), (1, "arm-r")):
        S.group(gid, (100 + side * 30, 110))
        twig_arm(S, side)
    S.group("body")
    # body ball, the lower snowball (a little behind the head, the way heroes' heads sit a little forward of the shoulders)
    S.shape(lumpy(100, 96, 62, 16, 2.8), S.lg(*SNOW_D, x2=0.6, y2=1), shadow=False, shade=0.35,
            decor=[f'<path d="{circ(64, 76, 6)} {circ(138, 70, 5)} {circ(60, 116, 4)}" fill="#FFFFFF" opacity="0.7"/>'])
    # scarf: a collar showing round the front of the neck, one end blowing back to the side
    S.shape(stroke_path([(126, 104), (146, 84), (156, 62), (168, 48)], 16, 13), S.lg("#E8524A", "#B02E2E"), sh=4,
            shade=0.2)
    S.shape(blob([(50, 112), (64, 84), (100, 72), (136, 84), (150, 112), (134, 146), (100, 158), (66, 146)], 1.0),
            S.lg("#E8524A", "#A82A2A", x2=0.6, y2=1), sh=5, shade=0.3)
    # head ball
    S.shape(lumpy(100, 114, 38, 14, 1.6, 10), S.lg(*SNOW, x2=0.6, y2=1), sh=6, op=0.3, shade=0.32, hi=0.5)
    # hat
    if take == "a":
        S.shape(ell(100, 100, 27, 23), S.lg("#4A4458", "#24202E", x2=0.6, y2=1), sh=5, shade=0.3)
        S.shape(circ(100, 96, 16), S.lg("#6A647A", "#36324A", x2=0.6, y2=1), sh=4, shade=0.3, hi=0.25)
    else:
        S.shape(lumpy(100, 100, 27, 18, 1.4), S.lg("#4A8AD8", "#2A5298", x2=0.6, y2=1), sh=5, shade=0.3)
        S.shape(lumpy(100, 94, 11, 10, 2.2), S.lg("#FFFFFF", "#D4DCEA"), sh=4, shade=0.2)
    # coal eyes and carrot nose (the nose points forward past the head)
    for x in (85, 115):
        S.flat(blob([(x - 5, 134), (x - 1, 129), (x + 5, 131), (x + 5, 137), (x, 140), (x - 5, 138)], 0.9), "#2B2230")
    S.shape(blob([(93, 140), (100, 136), (107, 140), (102, 166), (100, 172, 'c'), (98, 166)], 0.8),
            S.lg("#FFA040", "#E06A1C", x2=1, y2=0.2), sh=3, shade=0.2)
    return S


if __name__ == "__main__":
    want = sys.argv[1:] or ["a", "b"]
    lab = {"a": "Snowman A top hat", "b": "Snowman B beanie"}
    name = {"a": "snowman-a-tophat.svg", "b": "snowman-b-beanie.svg"}
    render([(snowman(t).write(name[t]), lab[t]) for t in want])
