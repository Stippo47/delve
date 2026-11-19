"""Bats, three style takes. python bats.py [a b c]"""
from lib import *


def eye(S, x, y, rx, ry, col=INK, glint=True):
    S.flat(ell(x, y, rx, ry), col)
    if glint:
        S.flat(circ(x - rx * 0.3, y - ry * 0.35, max(1.6, rx * 0.34)), "#FFFFFF")


def fangs(S, xs, y, w=6, h=8, col="#FFF8EC"):
    S.flat(" ".join(poly([(x - w / 2, y), (x + w / 2, y), (x, y + h)]) for x in xs), col)


def wing(S, pts, light, dark, side, shade=0.25, decor=None):
    if side < 0:
        pts = mx(pts)
    return S.shape(blob(pts, 0.8), S.lg(light, dark, x2=0.6 if side > 0 else -0.2, y2=1), shadow=False, shade=shade,
                   decor=decor)


# ----------------------------------------------------------------------------- A: fuzzball
def bat_a():
    S = Sprite('BAT take A "fuzzball": a round ball of fluff with huge ears and two small leathery wings held out to '
               'the sides; big eyes, a pink nose and two fangs at the front. About 65% of the archer. Parts: #arm-l, '
               '#arm-r = the wings (pivot at the shoulders, before #body: flap them by swinging or squashing in x), '
               '#body = the ball, ears and face. Facing = DOWN (+y), centre (100,100).')
    for side, gid in ((-1, "arm-l"), (1, "arm-r")):
        S.group(gid, (100 + side * 30, 98))
        pts = [(124, 92), (146, 78), (170, 72), (176, 86), (172, 100), (166, 112), (156, 108), (150, 120), (140, 114),
               (128, 118)]
        wing(S, pts, "#7A68A0", "#4A3A6C", side, decor=[
            f'<path d="{blob(mx(pts) if side < 0 else pts, 0.8)}" fill="#9C88C4" opacity="0.45" '
            f'transform="translate({-side * 6} -4) scale(1)"/>'])
    S.group("body")
    # ears lying back off the top of the head
    for side in (-1, 1):
        pts = [(112, 76), (124, 52), (134, 34), (142, 50), (138, 74), (126, 86)]
        inner = [(120, 74), (128, 56), (134, 46), (137, 60), (132, 76)]
        if side < 0: pts, inner = mx(pts), mx(inner)
        S.shape(blob(pts, 0.85), S.lg("#B6A2D8", "#7A66A0"), shadow=False, shade=0.2,
                decor=[f'<path d="{blob(inner, 0.85)}" fill="#F0A6C0" opacity="0.85"/>'])
    pts = []
    import math
    for i in range(18):
        a = math.radians(i * 20 - 90)
        r = 46 if i % 2 == 0 else 42
        pts.append((100 + math.cos(a) * r, 106 + math.sin(a) * r))
    S.shape(blob(pts, 0.9), S.lg("#CDBCEA", "#8A76B4", x2=0.6, y2=1), sh=5, shade=0.3, hi=0.35,
            decor=[f'<path d="{ell(100, 126, 26, 18)}" fill="#E6DAF6" opacity="0.7"/>'])
    eye(S, 84, 116, 8, 10)
    eye(S, 116, 116, 8, 10)
    S.flat(ell(100, 132, 6, 4.5), "#E07A9A")
    fangs(S, (93, 107), 146, 7, 9)
    return S


# ----------------------------------------------------------------------------- B: cloak bat
def bat_b():
    S = Sprite('BAT take B "cloak": a sleek dark vampire bat with its wings swept forward round its head like a cloak, '
               'about to dive; tall pointed ears, glowing red eyes, white fangs. About 65% of the archer. Parts: '
               '#arm-l, #arm-r = the wings (pivot at the shoulders, before #body), #body = body, head, ears. '
               'Facing = DOWN (+y), centre (100,100).')
    for side, gid in ((-1, "arm-l"), (1, "arm-r")):
        S.group(gid, (100 + side * 14, 92))
        pts = [(110, 84), (132, 66), (156, 62), (174, 76), (182, 104), (176, 136), (160, 162), (150, 174, 'c'),
               (152, 156), (136, 146, 'c'), (139, 132), (124, 122, 'c'), (127, 110), (120, 100)]
        band = [(126, 84), (150, 76), (166, 92), (168, 120), (156, 146), (146, 130), (134, 114)]
        wing(S, pts, "#5A5276", "#2E2842", side, shade=0.3, decor=[
            f'<path d="{blob(mx(band) if side < 0 else band, 0.9)}" fill="#8A3A5A" opacity="0.55"/>'])
    S.group("body")
    S.shape(ell(100, 86, 18, 26), S.lg("#4E4766", "#2A2438"), shadow=False, shade=0.3)
    for side in (-1, 1):
        pts = [(108, 104), (114, 86), (122, 66), (128, 82), (124, 104)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.7), S.lg("#5E5678", "#332C48"), shadow=False, shade=0.2,
                decor=[f'<path d="{blob(pts, 0.7)}" fill="#B05A7A" opacity="0.5" transform="translate(0 6) scale(1)"/>'])
    S.shape(circ(100, 118, 24), S.lg("#5E5678", "#2E2842", x2=0.6, y2=1), sh=4, shade=0.3, hi=0.25)
    for x in (89, 111):
        S.flat(ell(x, 122, 6.5, 5), "#FF5A4A")
        S.flat(circ(x - 1.5, 121, 1.8), "#FFE0D0")
    fangs(S, (94, 106), 138, 6, 8)
    return S


# ----------------------------------------------------------------------------- C: delta / fox bat
def bat_c():
    S = Sprite('BAT take C "fox bat": a fruit bat seen from above as an arrowhead: long brown wings swept back in a V, an '
               'orange fur ruff, a fox-like head with big ears and a pointed snout leading the way. About 70% of the '
               'archer. Parts: #arm-l, #arm-r = the wings (pivot at the shoulders, before #body), #body = body, ruff, '
               'head, ears. Facing = DOWN (+y), centre (100,100).')
    for side, gid in ((-1, "arm-l"), (1, "arm-r")):
        S.group(gid, (100 + side * 16, 104))
        pts = [(112, 108), (138, 106), (164, 98), (182, 78), (180, 50, 'c'), (170, 62), (158, 56), (150, 70), (138, 66),
               (130, 80), (116, 80)]
        band = [(124, 100), (150, 96), (168, 82), (160, 70), (146, 80), (130, 86)]
        wing(S, pts, "#9A6844", "#5A3420", side, shade=0.25, decor=[
            f'<path d="{blob(mx(band) if side < 0 else band, 0.9)}" fill="#C08A5C" opacity="0.45"/>'])
    S.group("body")
    S.shape(ell(100, 74, 15, 26), S.lg("#7A5034", "#4A2C1C"), shadow=False, shade=0.3)
    # orange ruff
    import math
    pts = []
    for i in range(16):
        a = math.radians(i * 22.5 - 90)
        r = 26 if i % 2 == 0 else 22
        pts.append((100 + math.cos(a) * r, 104 + math.sin(a) * r * 0.85))
    S.shape(blob(pts, 0.9), S.lg("#F6B25A", "#C46A24"), sh=4, shade=0.25)
    # ears
    for side in (-1, 1):
        pts = [(108, 118), (122, 106), (136, 102), (130, 118), (120, 128)]
        if side < 0: pts = mx(pts)
        S.shape(blob(pts, 0.7), S.lg("#8A5A38", "#5A3420"), sh=3, shade=0.2)
    # head with a pointed snout
    S.shape(blob([(100, 106), (116, 112), (120, 126), (112, 142), (100, 154), (88, 142), (80, 126), (84, 112)], 0.9),
            S.lg("#9A6844", "#5E3822", x2=0.6, y2=1), sh=4, shade=0.3, hi=0.3)
    for x in (91, 109):
        eye(S, x, 128, 4.5, 5.5)
    S.flat(ell(100, 150, 4.5, 3.5), INK)
    return S


TAKES = {"a": (bat_a, "Bat A fuzzball"), "b": (bat_b, "Bat B cloak"), "c": (bat_c, "Bat C fox bat")}
NAMES = {"a": "bat-a-fuzzball.svg", "b": "bat-b-cloak.svg", "c": "bat-c-foxbat.svg"}

if __name__ == "__main__":
    want = sys.argv[1:] or list(TAKES)
    render([(TAKES[t][0]().write(NAMES[t]), TAKES[t][1]) for t in want])
