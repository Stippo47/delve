"""Slimes, three style takes (A cube, B ooze, C bubble cluster), each big / small / fire.
python slimes.py            -> writes all nine and renders them
python slimes.py a b        -> only the takes named"""
from lib import *

TEAL = dict(lt="#A6F0DE", mid="#62C9B0", dk="#2E8A76", deep="#1F6B5C", glint="#F4FFFB")
TEAL_S = dict(lt="#C8F7EC", mid="#8EDCC8", dk="#4FA893", deep="#3A8A78", glint="#FFFFFF")
FIRE = dict(lt="#FFE27A", mid="#FF9A2E", dk="#D9461C", deep="#8E2414", glint="#FFF6D0")
LIME = dict(lt="#DDF27A", mid="#A8D23E", dk="#6E9A22", deep="#4B7016", glint="#FBFFE0")
LIME_S = dict(lt="#EAF8A8", mid="#C4E36A", dk="#8EB63E", deep="#6E962C", glint="#FFFFF0")
PINK = dict(lt="#FFC4E2", mid="#F28CC0", dk="#C8508E", deep="#96306A", glint="#FFF4FA")
PINK_S = dict(lt="#FFDDEE", mid="#F8B0D4", dk="#DC7AAE", deep="#B85A8C", glint="#FFFFFF")


def eye(S, x, y, rx, ry, glint=True, col=INK):
    S.flat(ell(x, y, rx, ry), col)
    if glint:
        S.flat(circ(x - rx * 0.32, y - ry * 0.38, max(1.8, rx * 0.36)), "#FFFFFF")


def flame(cx, cy, w, h, lean=0):
    """A soft flame tongue whose tip points up (back), base centred at (cx, cy): a fat round body and a curled tip."""
    return blob([(cx - w * 0.5, cy), (cx - w * 0.55, cy - h * 0.3), (cx - w * 0.3, cy - h * 0.6),
                 (cx + lean * 0.6, cy - h * 0.82), (cx + lean, cy - h, 'c'), (cx + w * 0.42 + lean * 0.3, cy - h * 0.55),
                 (cx + w * 0.55, cy - h * 0.25), (cx + w * 0.45, cy + h * 0.05), (cx, cy + h * 0.12)], 0.9)


# ----------------------------------------------------------------------------- A: the cube
def cube(kind):
    small = kind == "small"
    fire = kind == "fire"
    P = FIRE if fire else TEAL_S if small else TEAL
    S = Sprite(f'SLIME take A "cube" ({kind}): a gelatinous cube seen from above. A soft-cornered block of clear jelly with a '
               'bevelled top face, a glass-like rim light on the top-left edges, things stuck inside, two eyes floating at '
               'the front edge, goo sagging over the front lip. Parts: #body only (squash/stretch the whole sprite to hop). '
               'Facing = DOWN (+y), centre (100,100).', k=0.62 if small else 1.0)
    if fire:
        S.group("back", (100, 46))
        for x, w, h, l in ((64, 40, 44, -8), (100, 50, 62, 4), (138, 40, 46, 10)):
            S.shape(flame(x, 64, w, h, l), S.lg("#FFB23A", "#E0501C", x2=0.4, y2=-1), shadow=False, shade=0.2)
        for x, w, h, l in ((66, 20, 24, -4), (100, 26, 36, 2), (136, 20, 24, 5)):
            S.shape(flame(x, 60, w, h, l), S.lg("#FFF3B0", "#FFC23A", x2=0, y2=-1), shadow=False, shade=0, under=False)
    S.group("body")
    # goo drips hanging over the front lip (drawn first, so only the drop ends show below the block)
    for x, y, r in ((70, 172, 8), (106, 178, 10), (136, 171, 7)):
        S.shape(rr(x, (150 + y) / 2, 2 * r, y - 150 + 2 * r, r), S.lg(P["dk"], P["deep"]), shadow=False, shade=0.2)
    body = rr(100, 104, 136, 128, 30)
    S.shape(body, S.lg(P["mid"], P["dk"], x2=0.6, y2=1), shadow=False, shade=0.3,
            decor=[f'<path d="{rr(96, 98, 104, 96, 22)}" fill="{P["lt"]}" opacity="0.55"/>',
                   f'<path d="{rr(98, 100, 84, 76, 18)}" fill="{P["mid"]}" opacity="0.5"/>'])
    # stuff stuck inside (seen through the jelly)
    if fire:
        S.flat(ell(88, 96, 26, 22), "#FFF1A0", op=0.55)
        S.flat(ell(84, 92, 14, 12), "#FFFBE0", op=0.7)
    elif small:
        S.flat(circ(80, 86, 9), P["glint"], op=0.45)
        S.flat(circ(118, 80, 5), P["glint"], op=0.45)
    else:
        # a skull, tilted, at the back left
        S.raw(f'<g transform="rotate(-14 80 82)" opacity="0.7"><path d="{blob([(80, 62), (96, 70), (98, 86), (92, 94), (90, 102), (70, 102), (68, 94), (62, 86), (64, 70)], 1)}" fill="#F6F0DC"/>'
              f'<path d="{ell(73, 84, 5.5, 6.5)} {ell(87, 84, 5.5, 6.5)}" fill="{P["deep"]}"/>'
              f'<path d="{poly([(80, 90), (83, 95), (77, 95)])}" fill="{P["deep"]}"/></g>')
        S.flat(circ(126, 72, 7), P["glint"], op=0.5)
        S.flat(circ(138, 90, 4), P["glint"], op=0.5)
        # a coin
        S.flat(ell(122, 112, 8, 7), "#F2C84A", op=0.7)
    # glass rim light along the top and left edges
    S.flat(rr(100, 46, 96, 7, 3.5), P["glint"], op=0.85)
    S.flat(rr(40, 100, 7, 80, 3.5), P["glint"], op=0.7)
    S.flat(circ(48, 50, 6), P["glint"], op=0.9)
    # goo sagging over the front lip
    ey = 138 if not small else 136
    ex, rx, ry = (20, 9, 11) if not small else (22, 12, 14)
    eye(S, 100 - ex, ey, rx, ry)
    eye(S, 100 + ex, ey, rx, ry)
    if fire:
        for x, y, r in ((62, 70, 3.5), (140, 128, 3), (130, 64, 2.5), (58, 130, 2.5)):
            S.flat(circ(x, y, r), "#FFF6D0", op=0.9)
    return S


# ----------------------------------------------------------------------------- B: the ooze
def ooze(kind):
    small = kind == "small"
    fire = kind == "fire"
    P = FIRE if fire else LIME_S if small else LIME
    S = Sprite(f'SLIME take B "ooze" ({kind}): a flat, spreading puddle of goo seen from above, lumpy edged, with a thicker '
               'raised core and one big eye. Two pseudopods reach forward (the arms). Matte, not glassy. Parts: #arm-l, '
               '#arm-r = the pseudopods (pivot at their roots, drawn before #body), #body = the puddle, core, eye, '
               'droplets. Facing = DOWN (+y), centre (100,100).', k=0.62 if small else 1.0)
    armc = S.lg(P["mid"], P["dk"])
    S.group("arm-l", (70, 128))
    S.shape(stroke_path([(76, 120), (60, 142), (52, 162), (54, 176)], 26, 16), armc, shadow=False, shade=0.2)
    S.group("arm-r", (130, 128))
    S.shape(stroke_path([(124, 120), (140, 142), (148, 162), (146, 176)], 26, 16), armc, shadow=False, shade=0.3)
    S.group("body")
    pts = [(100, 34), (124, 38), (138, 30), (154, 44), (152, 62), (168, 76), (170, 100), (160, 118), (166, 136),
           (148, 152), (126, 150), (112, 164), (88, 164), (74, 150), (52, 152), (34, 136), (40, 118), (30, 100),
           (32, 76), (48, 62), (46, 44), (62, 30), (76, 38)]
    S.shape(blob(pts, 0.9), S.lg(P["mid"], P["dk"], x2=0.5, y2=1), shadow=False, shade=0.3)
    # thicker raised core: a smaller mound, lit from the top left
    core = blob([(100, 56), (128, 62), (142, 86), (140, 116), (122, 138), (100, 142), (78, 138), (60, 116), (58, 86),
                 (72, 62)], 1.0)
    S.shape(core, S.lg(P["lt"], P["mid"], x2=0.6, y2=1), sh=5, op=0.22, shade=0.25, hi=0.35)
    # a few bubbles / lumps in the goo
    for x, y, r in ((52, 84, 6), (150, 96, 5), (138, 48, 4), (62, 132, 4)):
        S.flat(circ(x, y, r), P["lt"], op=0.8)
    if fire:
        S.flat(ell(96, 96, 22, 18), "#FFF3B0", op=0.6)
    # one big eye at the front of the core
    ex, ey, R = 100, 116, (17 if not small else 22)
    S.flat(ell(ex, ey + 2, R + 1, R * 0.96), P["deep"], op=0.35)
    S.flat(ell(ex, ey, R, R * 0.92), "#FFFCF0" if not fire else "#FFF6D0")
    S.flat(ell(ex, ey + 2, R * 0.56, R * 0.6), "#E8A21E" if not fire else "#C8301A")
    S.flat(ell(ex, ey + 2.5, R * 0.18, R * 0.46), INK)
    S.flat(circ(ex - R * 0.4, ey - R * 0.4, R * 0.2), "#FFFFFF")
    # droplets shed beside it
    if not small:
        S.shape(circ(28, 60, 7), S.lg(P["mid"], P["dk"]), shadow=False, shade=0.2)
        S.shape(circ(172, 150, 6), S.lg(P["mid"], P["dk"]), shadow=False, shade=0.2)
    if fire:
        for x, y, r in ((70, 52, 3), (150, 70, 3), (118, 56, 2.5), (84, 150, 2.5)):
            S.flat(circ(x, y, r), "#FFF6D0", op=0.95)
    return S


# ----------------------------------------------------------------------------- C: the bubble cluster
def bubbles(kind):
    small = kind == "small"
    fire = kind == "fire"
    P = FIRE if fire else PINK_S if small else PINK
    S = Sprite(f'SLIME take C "bubbles" ({kind}): a cluster of glossy jelly bubbles stuck together like frogspawn: one big '
               'bubble at the front with the face, smaller ones bunched behind it (they pop off as slimelets). '
               'Parts: #body only. Facing = DOWN (+y), centre (100,100).', k=0.62 if small else 1.0)
    S.group("body")
    if small:
        balls = [(126, 70, 24), (100, 112, 44)]
    else:
        balls = [(96, 34, 20), (60, 66, 28), (132, 58, 32), (158, 100, 16), (100, 116, 50)]
    for i, (x, y, r) in enumerate(balls):
        last = i == len(balls) - 1
        if fire:
            g = S.rg("#FFF2A8", "#E8541E", cx=0.42, cy=0.4, r=0.62)
            S.shape(circ(x, y, r), g, sh=5, op=0.28, shade=0.35,
                    decor=[f'<path d="{circ(x - r * 0.1, y - r * 0.1, r * 0.5)}" fill="#FFF8D0" opacity="0.5"/>'])
        else:
            S.shape(circ(x, y, r), S.lg(P["lt"], P["dk"], x2=0.6, y2=1), sh=5, op=0.28, shade=0.3,
                    decor=[f'<path d="{circ(x + r * 0.12, y + r * 0.18, r * 0.72)}" fill="{P["mid"]}" opacity="0.55"/>'])
            if not last:
                # a dark seed in each back bubble, like frogspawn
                S.flat(circ(x + r * 0.08, y + r * 0.12, r * 0.3), P["deep"], op=0.7)
        S.flat(ell(x - r * 0.42, y - r * 0.42, r * 0.26, r * 0.17), P["glint"], op=0.9)
        S.flat(circ(x + r * 0.5, y - r * 0.5, r * 0.08 + 1), P["glint"], op=0.8)
    fx, fy, R = balls[-1]
    ex, rx, ry = (18, 8.5, 11) if not small else (19, 11, 14)
    ey = fy + R * 0.38
    eye(S, fx - ex, ey, rx, ry)
    eye(S, fx + ex, ey, rx, ry)
    # a small open mouth
    if not small:
        S.flat(blob([(fx - 7, fy + R * 0.66), (fx + 7, fy + R * 0.66), (fx + 4, fy + R * 0.8), (fx - 4, fy + R * 0.8)], 1),
               INK)
    return S


TAKES = {"a": ("cube", cube, "A cube"), "b": ("ooze", ooze, "B ooze"), "c": ("bubbles", bubbles, "C bubbles")}

if __name__ == "__main__":
    want = sys.argv[1:] or list(TAKES)
    done = []
    for t in want:
        name, fn, lab = TAKES[t]
        for kind in ("big", "small", "fire"):
            p = fn(kind).write(f"slime-{t}-{name}-{kind}.svg")
            done.append((p, f"Slime {lab}, {kind}"))
    render(done)
