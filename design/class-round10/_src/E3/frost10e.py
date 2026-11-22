"""Round 10, the art-round9 notes on the Frost Hollow's E3 designs:
  the yeti and its snowball   frost9e.yeti9 / snowball9 with YETI_R10 on (the face, the nose, the fangs, no lumps);
  the icicle wraith           "Different look. Maybe more banshee looking": drawn again as a banshee of the ice, in the
                              ghosts' build (the pale blue of Ghost B, its tall dark eyes).
python frost10e.py [name ...]   -> ../../enemies/frost-*.svg, ../../props/yeti-snowball.svg   (paths relative to this file)"""
import sys, math
from greenskins import *
import frost9e as F9
from frost9e import icicle, ICE, _prop


def yeti10():
    F9.YETI_R10 = True
    try:
        return F9.yeti9()
    finally:
        F9.YETI_R10 = False


def snowball10():
    F9.YETI_R10 = True
    try:
        return F9.snowball9()
    finally:
        F9.YETI_R10 = False


def wraith10():
    c1, c2, fold = "#F6FBFF", "#A9C2E8", "#8AA6D6"
    VEIL = ("#D6E4F6", "#8CA6D2")
    S = Sprite('ICICLE WRAITH (round 10: "Different look. Maybe more banshee looking"): a banshee of the ice seen from above, '
               'in the ghosts\' build and Ghost B\'s pale blue: a round head with two tall dark eyes drawn down in grief and '
               'a long open wailing mouth, a crown of icicles standing up from the back of its head, long hair or veil '
               'streaming back in ragged tatters (#back, sways), two long tattered sleeves reaching forward with icicles '
               'at their ends. Parts: #back (the veil), #arm-l / #arm-r (the sleeves, before #body), #body (head, crown, '
               'face). Front = DOWN (+y).')
    S.group("back", (100, 90))
    veil = [(56, 112), (40, 92), (34, 66), (22, 40, 'c'), (42, 50), (46, 22, 'c'), (62, 40), (74, 6, 'c'), (88, 34), (100, 0, 'c'),
            (112, 34), (126, 6, 'c'), (138, 40), (154, 22, 'c'), (158, 50), (178, 40, 'c'), (166, 66), (160, 92), (144, 112), (100, 120)]
    S.shape(blob(veil, 0.75), S.lg(*VEIL), shadow=False, shade=0.3,
            decor=['<path d="M 62 104 Q 56 76 50 44 M 82 104 Q 78 70 76 30 M 118 104 Q 122 70 124 30 M 138 104 Q 144 76 150 44" fill="none" '
                   f'stroke="{fold}" stroke-width="4" stroke-linecap="round" opacity="0.5"/>'])
    ice = S.lg(*ICE)
    def shard(x, y, a, L, w):
        d, tf = icicle(x, y, a, L, w)
        S.shape(d, ice, tf=tf, shadow=False, shade=0.15, decor=[f'<path d="M 0 0 L {f(-w * 0.5)} 0 L 0 {f(L * 0.8)} Z" '
                                                                 f'transform="{tf}" fill="#FFFFFF" opacity="0.7"/>'])
    for gid, side in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + side * 36, 118))
        for dx, dy, a, L in ((70, 150, 0, 22), (60, 154, 12, 18), (78, 142, -14, 18)):
            shard(100 + side * dx, dy, side * a, L, 5.5)
        arm = [(126, 106), (148, 112), (166, 128), (176, 150), (176, 164), (164, 166), (152, 158), (140, 142), (126, 130)]
        S.shape(blob(arm if side > 0 else mx(arm), 0.85), S.lg(c1, dk(c2, 0.04)), shadow=False, shade=0.25)
    S.group("body")
    # the crown of icicles, their roots under the head
    for x, a, L, w in ((100, 180, 40, 9), (80, 166, 32, 8), (120, 194, 32, 8), (63, 150, 24, 7), (137, 210, 24, 7)):
        shard(x, 88 - abs(x - 100) * 0.1 + abs(x - 100) * 0.25, a, L, w)
    head = blob([(100, 170), (70, 158), (54, 132), (56, 102), (72, 80), (100, 72), (128, 80), (144, 102), (146, 132), (130, 158)], 0.95)
    lit = ug(S, [(0, c1), (0.55, mix(c1, c2, 0.45)), (1, c2)], 60, 70, 150, 170)
    glow = S.rg("#FFFFFF", "#FFFFFF", 0.5, 0.5, 0.5, 0.85, 0)
    S.shape(head, lit, sh=4, op=0.22, shade=0.3,
            decor=[f'<rect x="40" y="60" width="120" height="40" fill="{ug(S, [(0, fold, 0.4), (1, fold, 0)], 0, 66, 0, 100)}"/>',
                   f'<circle cx="92" cy="120" r="42" fill="{glow}"/>'])
    for s in (-1, 1):
        S.flat(ell(100 + s * 18, 120, 7, 12.5), "#2B2230", tf=f"rotate({-s * 16} {100 + s * 18} 120)")
    S.flat(ell(100, 150, 8, 12), "#2B2230")
    return S


BUILD = {"frost-yeti": lambda: yeti10().write("frost-yeti.svg"),
         "yeti-snowball": lambda: _prop(snowball10(), "yeti-snowball.svg"),
         "frost-icicle-wraith": lambda: wraith10().write("frost-icicle-wraith.svg")}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(OUT.parent).as_posix())
