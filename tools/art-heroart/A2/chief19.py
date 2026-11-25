"""The Goblin Chieftain, three takes (round 19). The designer: v12-bosses "Nothing read horribly but the art/ visuals arent
good"; art round 9 notes "Fix teeth. Better weapons and dual wielding. More and better war paint. 1 clipped ear"; art
round 10b "Have them hold hands forwards more. Flip blades direction". Drawn as one of the goblins (art/enemies/goblin.svg:
the lime dome of a head seen from above, long ears out to the sides, the long nose pointing forward), only a chief.
Parts as art/bosses/goblin-chieftain.svg: #back (100 100), #arm-r (156 114), #arm-l (44 114), #body; style dual (a
weapon in each fist, held forward). Drawn at vr 38 / headR 67 (sizeU 125)."""
from r19 import *

SKIN, DSKIN, PAINT, BONE, HIDE = "#A9C743", "#7E9A2A", "#C8362C", "#EFE6CF", "#7A5236"
PLc, PRc = (44, 114), (156, 114)


def goblin_hand(S):
    S.add_def('<radialGradient id="gHandGob" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#C6DE62"/><stop offset="1" stop-color="#86A22C"/></radialGradient>')
    return "url(#gHandGob)"


def cleaver(S, x, y, a, s, L=36):
    """A war cleaver held forward: a short wrapped haft, a broad notched blade, its edge on the inside (s = -1 left hand)."""
    T = frame(x, y, a)
    S.shape(rr(0, 2, 9, 22, 4), "#5A3A26", T=T, shadow=0)
    k = -s   # the edge faces the middle: for the right hand (s 1) the edge is on local -x
    pts = [(k * -6, 8), (k * 16, 10), (k * 22, 16), (k * 24, L), (k * 18, L + 8), (k * -6, L + 10)]
    notch = f'<path d="{poly([(k * 24, L - 18), (k * 16, L - 14), (k * 24, L - 10)])}" fill="#2B2230" opacity="0.7"/>'
    S.shape(blob(pts, 0.25), "#C9CED6", T=T, shadow=2,
            decor=f'<path d="{poly([(k * 14, 10), (k * 30, 10), (k * 30, L + 12), (k * 14, L + 12)])}" fill="#FFFFFF" opacity="0.45"/>' + notch
            + f'<path d="{circ(k * 2, 24, 3)}" fill="#6E747E"/>' + f'<path d="{circ(k * 4, 40, 2.5)}" fill="#8E5A3A" opacity="0.6"/>')
    return T


def head_goblin(S, clip_left=True, paint="stripes"):
    """The big lime head with its ears, nose, grin and paint (in #body)."""
    for sx in (-1, 1):
        clipped = clip_left and sx < 0
        tip = (100 + sx * 92, 70) if not clipped else (100 + sx * 76, 76)
        ear = [(100 + sx * 36, 72), tip, (100 + sx * 40, 104)]
        if clipped:
            ear = [(100 + sx * 36, 72), (100 + sx * 70, 70), (100 + sx * 74, 80), (100 + sx * 66, 82), (100 + sx * 76, 88), (100 + sx * 40, 104)]
        S.shape(blob(ear, 0.35 if not clipped else 0.2), SKIN, shadow=3,
                decor=f'<path d="{blob([(100 + sx * 44, 82), (100 + sx * 70, 80), (100 + sx * 46, 96)], 0.4)}" fill="{DSKIN}" opacity="0.6"/>'
                + (f'<path d="{circ(100 + sx * 66, 80, 3)}" fill="#E8C56A"/>' if not clipped else ""))
    S.shape(blob([(54, 96), (58, 62), (78, 42), (100, 38), (122, 42), (142, 62), (146, 96), (134, 124), (100, 134), (66, 124)], 0.8), SKIN, shadow=5,
            decor=hi(80, 58, 16, 9, 0.35, -30) + (
                "".join(f'<path d="{poly([(70 + 10 * k, 58 - 2 * k), (76 + 10 * k, 56 - 2 * k), (82 + 10 * k, 98), (76 + 10 * k, 100)])}" fill="{PAINT}"/>' for k in (0, 5, 6))
                + f'<path d="{blob([(96, 60), (104, 60), (106, 76), (100, 82), (94, 76)], 0.6)}" fill="#F4EEDC"/>'
                if paint == "stripes" else
                f'<path d="{blob([(112, 62), (132, 56), (138, 70), (126, 84), (110, 78)], 0.7)}" fill="{PAINT}"/>'
                + "".join(f'<path d="{ell(120 + 14 * math.cos(math.radians(a)), 66 + 12 * math.sin(math.radians(a)), 3.4, 5)}" fill="{PAINT}" transform="rotate({a + 90} {f(120 + 14 * math.cos(math.radians(a)))} {f(66 + 12 * math.sin(math.radians(a)))})"/>' for a in (-150, -110, -70, -30))
                + strokes("M 66 96 L 84 84 M 70 106 L 88 94", PAINT, 4.5)))
    # the grin at the front edge, lower fangs up over the lip
    S.shape("M 70 116 C 82 128 118 128 130 116 C 128 130 116 140 100 140 C 84 140 72 130 70 116 Z", "#3A1E22", shadow=2,
            decor=f'<path d="M 74 120 C 86 130 114 130 126 120 L 126 124 C 114 134 86 134 74 124 Z" fill="#E8E0C8"/>')
    for x in (82, 118):
        S.shape(blob([(x - 4, 134), (x + 4, 134), (x + 1, 118), (x - 1, 118)], 0.4), BONE, shadow=1)
    # the long hooked nose, pointing forward
    S.shape(blob([(92, 98), (108, 98), (106, 122), (101, 140), (99, 140), (94, 122)], 0.6), shade(SKIN, 0.95), shadow=4,
            decor=f'<path d="{ell(97, 110, 3, 8)}" fill="#FFFFFF" opacity="0.3"/>')


def chief(v):
    what = {"skull": "a boar's skull worn as a helmet (tusks curling forward over his brow), two black feathers stuck in it; "
                     "his ears out to the sides, the left one clipped, war paint in red slashes and a white blaze; a hide "
                     "mantle with bone spikes; a bundle of throwing spears on his back (#back); a war cleaver in each fist, "
                     "held forward, the edges in",
            "mohawk": "the red mohawk kept from the old chief, swept back in spikes; red war paint (a hand print over one eye's "
                      "place and stripes), a bone through the nose, a necklace of teeth; a wolf pelt cloak (#back); two "
                      "hooked axes held forward",
            "crown": "a stolen king's crown, much too small, perched on his bald head; a stolen royal-red cape with an ermine "
                     "trim (#back), a gold chain of office; a cleaver in the right fist and a jewelled sceptre used as a "
                     "spiked club in the left"}[v]
    S = Sprite(f"THE GOBLIN CHIEFTAIN (round 19, take \"{v}\"): {what}. Facing down; the game draws the outline.")
    hand = goblin_hand(S)
    if v == "skull":
        S.group("back", (100, 100), "the bundle of throwing spears (sways)")
        for dx, a in ((-10, -8), (0, 0), (12, 9)):
            T = frame(100 + dx, 70, 180 + a)
            S.shape(rr(0, 36, 6, 72, 3), "#9A6A3E", T=T, shadow=0)
            S.shape(blob([(-6, 70), (6, 70), (0, 88)], 0.3), "#C9CED6", T=T, shadow=0)
        S.shape(rr(100, 52, 40, 12, 5), HIDE, shadow=2)
    elif v == "mohawk":
        S.group("back", (100, 100), "the wolf pelt (sways)")
        S.shape(blob([(40, 110), (34, 60), (60, 24), (100, 14), (140, 24), (166, 60), (160, 110)], 0.8), "#8A8E96", shadow=0,
                decor=f'<path d="{blob([(70, 26), (100, 0), (130, 26), (100, 40)], 0.7)}" fill="#6A6E76"/>'
                + "".join(strokes(f"M {x} 30 L {x + (x - 100) * 0.1} 60", "#6A6E76", 2.4, 0.7) for x in range(54, 150, 12)))
        for sx in (-1, 1):
            S.shape(blob([(100 + sx * 14, 10), (100 + sx * 22, -8), (100 + sx * 28, 12)], 0.4), "#7A7E86", shadow=0)
    else:
        S.group("back", (100, 100), "the stolen cape (sways)")
        S.shape(blob([(36, 112), (28, 54), (56, 14), (100, 2), (144, 14), (172, 54), (164, 112)], 0.8), "#B02A3A", shadow=0,
                decor=f'<path d="{blob([(28, 54), (56, 14), (100, 2), (144, 14), (172, 54), (160, 52), (130, 26), (100, 16), (70, 26), (40, 52)], 0.8)}" fill="#F4F0E6"/>'
                + "".join(f'<path d="{blob([(x - 2.5, y), (x + 2.5, y), (x, y + 5)], 0.4)}" fill="#2B2230"/>' for x, y in ((56, 26), (100, 8), (144, 26))))
    # the arms: a weapon in each fist, held forward, drawn before the body so the fists come out from under the shoulders
    S.group("arm-r", PRc, "right fist and weapon")
    if v == "skull":
        cleaver(S, 142, 152, -34, 1)
    elif v == "mohawk":
        T = frame(142, 148, -34)
        S.shape(rr(0, 10, 9, 36, 4), "#7A4E2C", T=T, shadow=0)
        S.shape(blob([(4, 16), (24, 12), (34, 26), (30, 44), (22, 34), (4, 32)], 0.5), "#C9CED6", T=T, shadow=2,
                decor=f'<path d="{poly([(20, 10), (40, 10), (40, 46), (20, 46)])}" fill="#FFFFFF" opacity="0.4"/>')
        S.shape(blob([(-4, 26), (-12, 32), (-6, 38)], 0.4), "#C9CED6", T=T, shadow=0)
    else:
        cleaver(S, 142, 152, -34, 1)
    fist(S, 142, 148, -34, w=24, h=24, hand=hand)
    S.group("arm-l", PLc, "left fist and weapon")
    if v == "skull":
        cleaver(S, 58, 152, 34, -1)
    elif v == "mohawk":
        T = frame(58, 148, 34)
        S.shape(rr(0, 10, 9, 36, 4), "#7A4E2C", T=T, shadow=0)
        S.shape(blob([(-4, 16), (-24, 12), (-34, 26), (-30, 44), (-22, 34), (-4, 32)], 0.5), "#C9CED6", T=T, shadow=2,
                decor=f'<path d="{poly([(-20, 10), (-8, 10), (-8, 46), (-20, 46)])}" fill="#FFFFFF" opacity="0.4"/>')
        S.shape(blob([(4, 26), (12, 32), (6, 38)], 0.4), "#C9CED6", T=T, shadow=0)
    else:
        T = frame(58, 148, 34)
        S.shape(rr(0, 14, 9, 34, 4), "#E2B04A", T=T, shadow=0)
        S.shape(circ(0, 36, 13), "#E2B04A", T=T, shadow=2, decor=f'<path d="{circ(-2, 34, 5)}" fill="#C8362C"/>' + hi(-5, 30, 4, 3, 0.6))
        for k in range(6):
            a = math.radians(60 * k + 30)
            S.shape(blob([(13 * math.cos(a) - 3 * math.sin(a), 36 + 13 * math.sin(a) + 3 * math.cos(a)), (13 * math.cos(a) + 3 * math.sin(a), 36 + 13 * math.sin(a) - 3 * math.cos(a)),
                          (21 * math.cos(a), 36 + 21 * math.sin(a))], 0.3), "#C9CED6", T=T, shadow=0)
    fist(S, 58, 148, 34, w=24, h=24, hand=hand)
    S.group("body")
    if v == "skull":
        S.shape(SHOULDERS, HIDE, decor=hi(56, 92, 18, 6, 0.2) + strokes("M 36 112 Q 60 102 80 116 M 120 116 Q 140 102 164 112", "#5A3A26", 3, 0.7))
        for x, y, a in ((36, 98, -60), (54, 88, -30), (146, 88, 30), (164, 98, 60)):
            S.shape(blob([(-5, 0), (5, 0), (0, -18)], 0.4), BONE, T=frame(x, y, a), shadow=2)
        head_goblin(S, True, "stripes")
        # the boar skull: a bone dome on the top of the head, two eye holes, the snout over his brow, tusks curling out
        S.shape(blob([(64, 84), (66, 50), (84, 32), (100, 28), (116, 32), (134, 50), (136, 84), (118, 92), (100, 94), (82, 92)], 0.8), BONE, shadow=4,
                decor=f'<path d="{ell(84, 70, 8, 10)}" fill="#3A2A2A"/><path d="{ell(116, 70, 8, 10)}" fill="#3A2A2A"/>'
                + strokes("M 100 36 L 100 58", "#C9BEA2", 2.5, 0.8) + hi(80, 44, 10, 6, 0.4, -30))
        S.shape(rr(100, 92, 30, 18, 8), BONE, shadow=3, decor=f'<path d="{ell(94, 96, 3, 2.5)}" fill="#3A2A2A"/><path d="{ell(106, 96, 3, 2.5)}" fill="#3A2A2A"/>')
        for sx in (-1, 1):
            S.shape(taper([(100 + sx * 12, 96), (100 + sx * 26, 104), (100 + sx * 30, 92)], 7, 3), BONE, shadow=2)
        for x, a in ((76, -30), (86, -12)):
            S.shape(taper([(x, 40), (x - 6, 20), (x - 12, 0)], 9, 3), "#2E2A36", shadow=2, decor=strokes(f"M {x} 40 L {x - 12} 0", "#6A6478", 1.2, 0.8))
    elif v == "mohawk":
        S.shape(SHOULDERS, "#5E6A3A", decor=hi(56, 92, 18, 6, 0.2))
        for k, x in enumerate(range(60, 145, 12)):
            y = 128 + 6 * math.sin(math.pi * (x - 60) / 84)
            S.shape(blob([(x - 4, y - 4), (x + 4, y - 4), (x, y + 8)], 0.4), BONE, shadow=2)
        head_goblin(S, True, "hand")
        S.shape(blob([(94, 112), (88, 82), (90, 52), (94, 26), (100, 8), (106, 26), (110, 52), (112, 82), (106, 112)], 0.5), PAINT, shadow=3,
                decor="".join(strokes(f"M 96 {y} L 104 {y - 8}", "#8E2420", 2, 0.6) for y in range(30, 100, 12)))
        for y in (24, 44, 64):
            S.shape(blob([(98, y), (102, y), (100, y - 16)], 0.3), "#E05040", shadow=0, side=False)
        S.shape(rr(100, 128, 30, 6, 3), BONE, shadow=2)
        for x in (85, 115):
            S.shape(circ(x, 128, 4), BONE, shadow=1)
    else:
        S.shape(SHOULDERS, "#6A4A8A", decor=hi(56, 92, 18, 6, 0.2))
        # the chain of office: gold links round the shoulders and a medallion in front... over the chest, under the chin
        S.shape(chain([(100 + 52 * math.cos(math.radians(a)), 112 + 20 * math.sin(math.radians(a))) for a in range(20, 161, 20)], 5.5, 2.2), "#E2B04A", shadow=2, rule="evenodd")
        head_goblin(S, True, "stripes")
        # the crown: much too small, tipped to one side on the bald dome
        T = frame(108, 62, 14)
        S.shape(blob([(-20, 12), (-22, -8), (-12, 0), (-6, -14), (0, -2), (6, -14), (12, 0), (22, -8), (20, 12)], 0.2), "#F2C24A", T=T, shadow=4,
                decor=f'<path d="{rr(0, 8, 44, 7, 2)}" fill="#C8902E"/>' + f'<path d="{circ(0, 6, 3.4)}" fill="#C8362C"/>' + f'<path d="{circ(-12, 7, 2.4)}" fill="#3A7FD0"/><path d="{circ(12, 7, 2.4)}" fill="#3A9A50"/>')
    return save("bosses", "chieftain", v, S)


if __name__ == "__main__":
    for v in ("skull", "mohawk", "crown"):
        print(chief(v))
