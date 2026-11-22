"""Round 8, part 2: real art for two Sewer kinds that wore placeholders: the rat king (a big recoloured rat; the
designer: "Jumble of rats all packed together ... The sprite shouldn't just look like the rat sprite now layered ontop of
itself a few times, more effort than that") and the sewer crab (a recoloured hunter spider). The croc is in
../E1r4/lizards.py (the picked Croc A with two axes). Heroes' bust style (A2 library), no eyes.
python sewer8.py [name ...]   -> ../../enemies/sewer-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *

# the game's rat (js/sprites.js drawRat): a teardrop body lit from the top, pink ears and nose, a pink tail
RAT_FURS = ["#9C8676", "#8A7C72", "#A8907C", "#7E6A5C", "#94877E", "#B09A86", "#86766A", "#9A8070", "#7A6E66"]
EAR, NOSE, TAIL = "#E3AFA6", "#E2A1A5", "#D8A39A"


def rat(S, x, y, a, k=1.0, fur="#9C8676", curl=0.0):
    """One rat in the knot, rump at (x, y), head out along angle a (degrees, 0 = +y), k its size: a round rump, a
    pointed head turned `curl` degrees on its neck, two round pink ears, a pink nose. Its tail is drawn by the caller
    (the tails knot in the middle)."""
    T = f"{frame(x, y, a)} scale({k})"
    TH = f"{T} rotate({curl} 0 20)"
    # a big round body and a smaller pointed head (round 8 look-over: a head as big as the rump read as a cone)
    S.shape(ell(0, 6, 18, 23), fur, T=T, shadow=3)
    for s in (-1, 1):
        S.shape(circ(s * 10, 27, 5.5), EAR, T=TH, shadow=2, side=False,
                decor=f'<path d="{circ(s * 10, 28, 3)}" fill="#C98E86"/>')
    S.shape(blob([(-10, 22), (0, 18), (10, 22), (8, 33), (3, 43), (0, 46), (-3, 43), (-8, 33)], 0.85), light(fur, 1.04), T=TH,
            shadow=3)
    S.shape(circ(0, 44, 3), NOSE, T=TH, shadow=0, side=False)


def rat_king():
    S = Sprite("RAT KING (round 8): a knot of rats seen from above, not one rat stacked: nine rats of different sizes, "
               "furs and poses packed round a tangle of their own pink tails knotted together in the middle, heads out "
               "on all sides; the biggest at the front, a little gold crown on its head (the king), its two neighbours "
               "the ones that bite (arm-l, arm-r, so they lunge when it attacks), the two at the back writhing (#back). "
               "No eyes. " + LAYOUT)
    def tails(d, w=4):
        S.raw(f'<path d="{d}" fill="none" stroke="#B4847C" stroke-width="{w + 3}" stroke-linecap="round"/>')
        S.raw(f'<path d="{d}" fill="none" stroke="{TAIL}" stroke-width="{w}" stroke-linecap="round"/>')
    # at the back, two rats squirming backwards out of the heap (they sway)
    S.group("back", (100, 90), "two rats at the back")
    rat(S, 84, 78, 158, 0.9, RAT_FURS[3], curl=-14)
    rat(S, 120, 74, -150, 0.84, RAT_FURS[6], curl=18)
    S.group("body")
    # the heap: rats of different sizes and furs piled at all angles, heads out, unevenly
    tails("M 58 70 C 48 58 52 42 40 34 M 146 66 C 158 56 152 40 166 32")   # loose tail ends hanging out of the heap
    for x, y, a, k, fur, c in ((66, 94, 112, 0.98, RAT_FURS[1], -10), (138, 86, -100, 0.95, RAT_FURS[4], 12),
                               (102, 74, 186, 0.86, RAT_FURS[8], 8), (64, 122, 70, 0.9, RAT_FURS[5], 16),
                               (140, 118, -66, 0.92, RAT_FURS[2], -12)):
        rat(S, x, y, a, k, fur, c)
    # the knot of tails tangled over the middle of the heap
    tails("M 74 100 C 86 80 116 78 126 96 C 134 112 114 126 100 118 C 86 110 94 88 110 92 C 126 96 128 114 116 120 "
          "M 90 126 C 78 112 90 98 104 102 C 118 106 116 124 102 128")
    # the king on top at the front, biggest, with a little gold crown
    rat(S, 100, 110, 0, 1.22, RAT_FURS[0])
    S.shape(poly([(90, 146), (90, 136), (95, 141), (100, 132), (105, 141), (110, 136), (110, 146)]), GOLD, shadow=2,
            decor=f'<path d="{rr(100, 145, 22, 5, 2)}" fill="#C98A2A"/>')
    # the two that bite (front left and right): arm parts so the game lunges them
    S.group("arm-l", (76, 116), "a biting rat")
    rat(S, 70, 118, 38, 0.98, RAT_FURS[7], curl=-10)
    S.group("arm-r", (126, 116), "a biting rat")
    rat(S, 132, 120, -42, 0.94, RAT_FURS[2], curl=12)
    return save("enemies", "sewer-rat-king", S)


# ================================================================== crab
def crab():
    S = Sprite("SEWER CRAB (round 8): a crab seen from above, armoured from the front: a wide rusty-red shell with a "
               "smooth armoured front lip, four jointed legs a side (#back), two big pincers held "
               "forward (arm-l, arm-r, so the game snaps them when it pinches); pale tips. No eyes. Its blue and green "
               "kinds are this art with the colours turned (js/foes9.js). " + LAYOUT)
    SHELL, DSHELL, TIP = "#C8603A", "#8E3A26", "#F0D2B0"
    S.group("back", (100, 100), "legs")
    for s in (-1, 1):
        for i, (ang, L) in enumerate(((-40, 40), (-16, 44), (10, 44), (34, 38))):
            a = math.radians(ang)
            x0, y0 = 100 + s * 54, 90 + i * 8
            kx, ky = x0 + s * math.cos(a) * L * 0.55, y0 + math.sin(a) * L * 0.55 - 6
            tx, ty = x0 + s * math.cos(a) * L, y0 + math.sin(a) * L + 4
            S.shape(band([(x0, y0), (kx, ky), (tx, ty)], 4.5), SHELL, shadow=0)
            S.shape(circ(tx, ty, 3.5), TIP, shadow=0, side=False)
    S.group("body")
    # a wide oval shell, its front edge thickened into a smooth armoured lip (round 8: a toothed rim under a light
    # ridge read like a face)
    shell = blob([(100, 58), (138, 62), (166, 78), (172, 100), (164, 120), (138, 134), (100, 140), (62, 134), (36, 120),
                  (28, 100), (34, 78), (62, 62)], 0.9)
    S.shape(shell, SHELL, shadow=0,
            decor=f'<path d="{ell(100, 98, 46, 24)}" fill="{shade(SHELL, 0.82)}" opacity="0.4"/>'
                  + f'<path d="{ell(78, 82, 30, 14)}" fill="#E8906A" opacity="0.32"/>')
    lip = blob([(40, 118), (62, 126), (100, 130), (138, 126), (160, 118), (156, 130), (136, 142), (100, 148), (64, 142),
                (44, 130)], 0.8)
    S.shape(lip, DSHELL, shadow=3)

    def pincer(s):
        x0 = 100 + s * 40
        S.shape(band([(x0, 128), (100 + s * 46, 146), (100 + s * 40, 160)], 7), SHELL, shadow=0)
        T = frame(100 + s * 38, 170, -s * 14)
        S.shape(blob([(-15, -8), (0, -14), (15, -8), (17, 10), (12, 26), (2, 34), (-6, 26), (-14, 12)], 0.85), SHELL, T=T, shadow=3)
        # the movable finger and the fixed one, a gap between
        S.shape(blob([(s * -2, 22), (s * 8, 30), (s * 6, 44), (s * 1, 48), (s * -3, 36)], 0.8), TIP, T=T, shadow=2)
        S.shape(blob([(s * 10, 18), (s * 16, 26), (s * 14, 38), (s * 9, 40), (s * 8, 28)], 0.8), TIP, T=T, shadow=2)
    S.group("arm-l", (60, 128), "pincer")
    pincer(-1)
    S.group("arm-r", (140, 128), "pincer")
    pincer(1)
    return save("enemies", "sewer-crab", S)


BUILD = {"sewer-rat-king": rat_king, "sewer-crab": crab}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
