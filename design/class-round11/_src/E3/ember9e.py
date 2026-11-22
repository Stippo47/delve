"""Round 9: the cinder bat, built on the round-7 bat the designer picked (critters.bat(): a big round furry head with no
body, big broad ears standing up and out, a small snout with two white fangs, membrane wings), with the same E3
library: its shapes as they were, in cinders (ART-NEEDED: "a bat of cinders, glowing cracks, trailing embers").
python ember9e.py   -> ../../enemies/ember-cinder-bat.svg   (paths relative to this file)"""
import sys
from critters import *

FUR, MEM = "#3E3230", "#2E2426"      # charred: the head and the wing membranes
GLOW = ("#FFE27A", "#FF8A3D")         # what glows in the cracks


def cinder_bat9():
    S = Sprite('CINDER BAT (round 9): the round-7 bat (the designer\'s pick) as a bat of cinders: its shapes as they were '
               '(a big round head with no body behind it, two big broad pointed ears standing up and out, a small snout '
               'with two fangs, membrane wings with a scalloped trailing edge), charred black, the wing bones and cracks '
               'across the head glowing orange like embers, the ears glowing inside, a trail of embers streaming behind. '
               'No eyes. Parts: #back (the ember trail, sways), #arm-l / #arm-r (the wings, pivots at the shoulders, so '
               'the game flaps them), #body (head and ears). Scaled 0.8. Front = DOWN (+y).', k=0.8)
    # the ember trail behind the head
    S.group("back", (100, 96))
    S.shape(stroke_path([(100, 92), (95, 62), (104, 34), (97, 6)], 36, 6, 0.9), S.lg("#FF9A3D", "#C8402A", x2=0, y2=-1),
            shadow=False, shade=0,
            decor=[f'<path d="{stroke_path([(100, 84), (96, 58), (102, 36)], 14, 3, 0.9)}" fill="#FFE27A"/>'])
    for x, y, r in ((120, 34, 6.5), (80, 46, 5.5), (112, 4, 4.5)):
        S.shape(circ(x, y, r), S.lg(*GLOW), shadow=False, shade=0)
    # the wings: the round-7 bat's, charred, their bones glowing
    for gid, side in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + side * 26, 100))
        pts = [(120, 110), (156, 116), (190, 112), (210, 98, 'c'), (192, 86), (182, 64, 'c'), (166, 76), (150, 50, 'c'),
               (138, 72), (122, 64, 'c'), (118, 84)]
        if side < 0:
            pts = mx(pts)
        S.shape(blob(pts, 0.6), S.lg(lt(MEM, 0.12), dk(MEM, 0.3)), shadow=False, shade=0.2,
                decor=[f'<path d="{blob(pts, 0.6)}" fill="none" stroke="#C8502E" stroke-width="7" opacity="0.55"/>'])
        for bone in ([(122, 104), (160, 106), (206, 98)], [(160, 106), (180, 68)], [(160, 106), (150, 56)]):
            b = bone if side > 0 else mx(bone)
            S.shape(stroke_path(b, 9, 5), S.lg(*GLOW), shadow=False, shade=0)
    # the head: the round-7 bat's (1.28x, centred at 100, 106), charred, cracks glowing
    S.group("body")
    hk = 1.28
    htf = f"translate(100 106) scale({hk}) translate(-100 -112)"
    for side in (1, -1):
        ear = [(104, 82), (110, 62), (126, 38), (148, 16, 'c'), (150, 44), (142, 70), (128, 88)]
        inner = [(112, 78), (118, 60), (130, 42), (143, 27, 'c'), (143, 48), (136, 68), (126, 80)]
        S.shape(blob(ear if side > 0 else mx(ear), 0.8), S.lg(lt(FUR, 0.12), dk(FUR, 0.28)), shadow=False, shade=0.25,
                decor=[f'<path d="{blob(inner if side > 0 else mx(inner), 0.8)}" fill="#FF8A3D" opacity="0.75"/>'])
    cracks = (f'<path d="M 88 78 L 94 88 L 90 96 M 114 80 L 108 90 M 68 108 L 75 116 L 72 124 M 132 106 L 126 114" '
              f'transform="{htf}" fill="none" stroke="#FF9A3D" stroke-width="3" stroke-linecap="round"/>')
    S.shape(circ(100, 112, 36), S.lg(lt(FUR, 0.22), dk(FUR, 0.12)), tf=htf, sh=4, shade=0.3, decor=[cracks])
    S.shape(ell(100, 140, 14, 11), S.lg(lt(FUR, 0.2), dk(FUR, 0.1)), tf=htf, sh=3, shade=0.2)
    S.shape("M 93.5 135.5 C 93.5 131.5 106.5 131.5 106.5 135.5 C 106.5 139 102.5 141.5 100 141.5 C 97.5 141.5 93.5 139 93.5 135.5 Z",
            S.lg("#FF8A3D", "#C8402A"), tf=htf, sh=1.5, op=0.25, shade=0)
    for x in (94, 106):
        S.shape(poly([(x - 3, 146), (x + 3, 146), (x, 155)]), S.lg("#FFFFFF", "#E8D8C8"), tf=htf, shadow=False, shade=0)
    return S


if __name__ == "__main__":
    print(cinder_bat9().write("ember-cinder-bat.svg").relative_to(OUT.parent).as_posix())
