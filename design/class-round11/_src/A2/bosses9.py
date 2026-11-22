"""Round 9: the bosses that wore recoloured art (docs/ART-NEEDED-bosses.md), in the heroes' bust build: the Winter Queen
(her mirror images use the same art), the Gilded Seraph (and a fallen version, unused until the game can swap a
boss's art), and the Seraph's choir singer. The Goblin Chieftain is built on the round-8 chieftain in ../E3/bosses9e.py.
python bosses9.py [name ...]   -> ../../enemies/boss-*.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *
from spire9 import feather9, wing9, LIGHT, FALLEN, ASH_FACE, cherub_hair

COLD_FACE = ('<linearGradient id="gFaceCold" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#8E98B0"/><stop offset="0.2" stop-color="#B4BED2"/><stop offset="0.45" stop-color="#E2E8F2"/>'
             '<stop offset="0.85" stop-color="#E6ECF4"/><stop offset="1" stop-color="#CCD6E4"/></linearGradient>'
             '<radialGradient id="gHandCold" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F0F4FA"/>'
             '<stop offset="1" stop-color="#B8C4D6"/></radialGradient>')
GOWN, DGOWN, FROST = "#7EAEDE", "#4E7EB8", "#F2FAFF"


# ================================================================== the Winter Queen
def winter_queen():
    S = Sprite("THE WINTER QUEEN (round 9): the Frost Hollow's queen in the heroes' bust build: pale cold skin, no eyes, "
               "long white hair, a crown of tall ice crystals; a high collar of ice shards rising behind her head, an "
               "ice-blue gown with white frost trim on the shoulders and a long train flowing back behind her, frosted "
               "at its edge (#back, sways); her hands held out to cast, in frost cuffs (arm-l, arm-r: they lift when she "
               "casts). Her mirror images are the same art (the game draws them see-through). " + LAYOUT)
    S.add_def(COLD_FACE)
    # the train, flowing back
    S.group("back", (100, 92), "the train")
    train = blob([(60, 104), (48, 74), (42, 40), (52, 16), (76, 6), (100, 12), (124, 6), (148, 16), (158, 40), (152, 74), (140, 104)], 0.85)
    S.shape(train, GOWN, shadow=0,
            decor=f'<path d="{cloud(100, 12, 52, 12, 0.6, 0)}" transform="translate(100 12) scale(1 0.4) translate(-100 -12)" fill="{FROST}"/>'
                  + strokes("M 78 90 Q 72 56 80 24 M 122 90 Q 128 56 120 24", DGOWN, 4, 0.45))
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 54, 110), "a casting hand")
        S.shape(rr(100 + s * 52, 138, 30, 12, 5), FROST, T=f"rotate({-s * 6} {100 + s * 52} 138)", shadow=0)
        fist(S, 100 + s * 52, 152, s * -6, hand="url(#gHandCold)")
    S.group("body")
    # the high collar of ice shards behind the head
    for a, L, w in ((-78, 30, 9), (-50, 36, 10), (-22, 40, 11), (22, 40, 11), (50, 36, 10), (78, 30, 9)):
        r = math.radians(a)
        ice_shard(S, 100 + 40 * math.sin(r), 100 - 40 * math.cos(r), 180 + a, L, w, shadow=0)
    S.shape(SHOULDERS, GOWN, decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", FROST, 7, 0.95)
            + strokes("M 66 84 Q 100 98 134 84", FROST, 5, 0.85))
    head(S, face="url(#gFaceCold)")
    mouth(S, 137, "#8E7E98")
    # long white hair: a cap over the head falling to the shoulders at the sides
    S.shape(blob([(52, 124), (46, 84), (60, 54), (100, 42), (140, 54), (154, 84), (148, 124), (140, 106), (134, 88), (118, 80),
                  (100, 84), (82, 80), (66, 88), (60, 106)], 0.85), "#D8D4EC", shadow=4,
            decor=strokes("M 100 48 L 100 82", "#C8D2E0", 3, 0.7) + strokes("M 70 60 Q 64 84 62 110 M 130 60 Q 136 84 138 110", "#D4DCE8", 3, 0.6))
    # the ice crown: a ring of tall crystals on the head, the front ones biggest
    for a, L, w in ((-90, 22, 7), (-60, 26, 8), (-30, 30, 9), (0, 34, 10), (30, 30, 9), (60, 26, 8), (90, 22, 7)):
        x = 100 + 30 * math.sin(math.radians(a))
        y = 66 - 14 * math.cos(math.radians(a))
        ice_shard(S, x, y + 6, 180 + a * 0.5, L, w, shadow=2)
    S.shape("M 66 78 C 76 66 90 62 100 62 C 110 62 124 66 134 78 C 124 72 112 70 100 70 C 88 70 76 72 66 78 Z", "#CDEFFC", shadow=2)
    return save("enemies", "boss-winter-queen", S)


# ================================================================== the Gilded Seraph
GOLDW = dict(wing="#F8E2A0", dwing="#C99A3A")
FALLW = dict(wing="#4E4658", dwing="#2E2836")


def seraph(fallen=False):
    W = FALLW if fallen else GOLDW
    p = FALLEN if fallen else LIGHT
    S = Sprite(("THE GILDED SERAPH, fallen (round 9): her fallen look, unused until the game can swap a boss's art: the "
                "same shapes with dark ragged wings, black and violet robes, ashen skin, a dark sun headdress. "
                if fallen else
                "THE GILDED SERAPH (round 9): the Gilded Spire's seraph in the heroes' bust build: six golden wings, three "
                "a side, spread round her back like a sunburst (#back, sway); a sun headdress (no halo: the designer's "
                "'radiance has no halo'): a gold diadem on the brow with rays standing out from it back over her head; long pale gold "
                "hair, no eyes; a white robe with gold trim and gold shoulder plates; her hands held out to cast in gold "
                "bracers (arm-l, arm-r: they lift when she casts). ") + LAYOUT)
    if fallen:
        S.add_def(ASH_FACE)
    S.group("back", (100, 94), "six wings")
    for s in (-1, 1):
        for root, fan in (((118, 92), ((-150, 70, 12), (-162, 82, 12), (-174, 74, 11))),       # rising behind
                          ((126, 96), ((-110, 74, 13), (-124, 88, 13), (-138, 80, 12))),        # out behind
                          ((130, 104), ((-62, 62, 12), (-76, 76, 12), (-90, 70, 11)))):         # out to the sides
            rx = 100 + s * (root[0] - 100)
            for i, (a, L, w) in enumerate(fan):
                d, T = feather9((rx, root[1]), s * a, L, w)
                torn = fallen and i == 1
                S.shape(d, W["wing"] if i % 2 == 0 else light(W["wing"], 0.95), T=T, shadow=2 if i else 0, sop=0.18,
                        decor=f'<path d="M 0 {f(L * 0.15)} L 0 {f(L * 0.9)}" stroke="{W["dwing"]}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>'
                              + (f'<path d="M {f(w)} {f(L * 0.6)} L {f(w * 0.1)} {f(L * 0.7)} L {f(w)} {f(L * 0.8)} Z" fill="{W["dwing"]}"/>' if torn else ""))
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 54, 110), "a casting hand")
        S.shape(rr(100 + s * 52, 138, 30, 12, 5), p["trim"] if not fallen else "#5E4E7A", T=f"rotate({-s * 6} {100 + s * 52} 138)", shadow=0)
        fist(S, 100 + s * 52, 152, s * -6, hand=p["hand"])
    S.group("body")
    S.shape(SHOULDERS, p["robe"], decor=strokes("M 30 118 Q 60 136 100 138 Q 140 136 170 118", p["trim"], 5, 0.9))
    for s in (-1, 1):
        S.shape(blob([(100 + s * 34, 84), (100 + s * 60, 80), (100 + s * 76, 94), (100 + s * 74, 114), (100 + s * 56, 120),
                      (100 + s * 40, 108)], 0.85), p["plate"], shadow=3, decor=f'<path d="{ell(100 + s * 58, 92, 12, 5)}" fill="#FFFFFF" opacity="0.35"/>')
    ray = "#F2B53A" if not fallen else "#3A3442"
    head(S, face=p["face"])
    mouth(S, 137, "#9A6E68" if not fallen else "#6E6070")
    S.shape(blob([(52, 118), (48, 84), (62, 56), (100, 44), (138, 56), (152, 84), (148, 118), (140, 100), (132, 86), (116, 80),
                  (100, 84), (84, 80), (68, 86), (60, 100)], 0.85), "#FFF4DA" if not fallen else p["hair"], shadow=4,
            decor=strokes("M 100 50 L 100 82", "#E8D4A8" if not fallen else light(p["hair"], 1.4), 3, 0.5))
    # the sun headdress: a diadem on the brow, its rays standing out from it back over the head
    for a in range(-75, 76, 25):
        r = math.radians(a)
        tf = frame(100 + 34 * math.sin(r), 84 - 22 * math.cos(r), 180 + a * 1.1)
        S.shape(poly([(-6, 0), (6, 0), (0, 30 - abs(a) * 0.08)]), ray, T=tf, shadow=2, side=False)
    S.shape("M 62 80 C 74 66 88 62 100 62 C 112 62 126 66 138 80 C 126 74 112 72 100 72 C 88 72 74 74 62 80 Z", ray, shadow=2)
    S.shape(circ(100, 68, 8), "#FFF2C0" if not fallen else "#8E6AB8", shadow=2)
    return save("enemies", "boss-gilded-seraph-fallen" if fallen else "boss-gilded-seraph", S)


# ================================================================== the Seraph's choir singer
def choir_singer(r10=False):
    S = Sprite("CHOIR SINGER (round 9): one of the Gilded Seraph's singers, kin to the choir sprite: a cherub with golden "
               "curls, no eyes, its mouth open in an 'o' as it sings; a white robe with a gold collar; gold-tipped white "
               "wings (#back, sway); an open hymn book held in front in both hands (the hands are arm-l, arm-r: they lift "
               "when it sings). " + LAYOUT)
    S.group("back", (100, 96), "wings")
    for s in (-1, 1):
        for a, L, w in ((-96, 60, 14), (-116, 72, 14), (-138, 66, 13)):
            d, T = feather9((100 + s * 30, 100), s * a, L, w)
            S.shape(d, "#FAF6EC", T=T, shadow=2, sop=0.18,
                    decor=f'<path d="M 0 8 L 0 {L * 0.85}" stroke="#E2D6B8" stroke-width="3" opacity="0.7"/>'
                          + f'<path d="M -16 {L * 0.78} L 16 {L * 0.78} L 16 {L + 6} L -16 {L + 6} Z" fill="{GOLD}" opacity="0.85"/>')
    S.group("body")
    S.shape(ell(100, 116, 52, 32), "#F8F4EA", decor=strokes("M 52 124 Q 100 152 148 124", GOLD, 6, 0.95))
    head(S)
    if r10:
        S.comment = S.comment.replace("(round 9)", "(round 9; round 10: the hair, and the book turned to face the singer)")
        S.shape(cherub_hair(), "#F2C454", shadow=4, decor=f'<path d="{ell(84, 64, 16, 9)}" fill="#FFF6D0" opacity="0.4"/>')
    else:
        curls = "".join(f'<path d="M {x - 6} {y} a 6 6 0 1 1 6 6" fill="none" stroke="#D8A030" stroke-width="3" stroke-linecap="round" opacity="0.8"/>'
                        for x, y in ((82, 66), (104, 58), (120, 74), (92, 84), (70, 84)))
        S.shape(cloud(100, 80, 44, 13, 0.82, 4), "#F2C454", shadow=4, T="translate(100 80) scale(1.04 0.84) translate(-100 -80)",
                decor=f'<path d="{ell(86, 64, 14, 8)}" fill="#FFF6D0" opacity="0.4"/>' + curls)
    S.shape(ell(100, 136, 6, 7), "#7A3A3A", shadow=0, side=False, decor=f'<path d="{ell(100, 140, 4, 3)}" fill="#C86A6A"/>')
    # the open book in front, held at both sides
    if r10:   # the book the other way up: its pages fall open towards the singer, who reads it
        S.shape("M 70 180 Q 85 186 100 178 Q 115 186 130 180 L 130 156 Q 115 162 100 154 Q 85 162 70 156 Z", "#F4EEDC", shadow=3,
                decor=strokes("M 100 154 L 100 178", "#B8A47C", 2.5, 0.9) + strokes("M 76 166 L 94 164 M 76 172 L 94 170 M 106 164 L 124 166 M 106 170 L 124 172", "#B8A47C", 2, 0.7))
    else:
        S.shape("M 70 156 Q 85 150 100 158 Q 115 150 130 156 L 130 180 Q 115 174 100 182 Q 85 174 70 180 Z", "#F4EEDC", shadow=3,
                decor=strokes("M 100 158 L 100 182", "#B8A47C", 2.5, 0.9) + strokes("M 76 162 L 94 164 M 76 168 L 94 170 M 106 164 L 124 162 M 106 170 L 124 168", "#B8A47C", 2, 0.7))
    S.shape("M 66 154 L 70 156 L 70 180 L 66 182 Z M 134 154 L 130 156 L 130 180 L 134 182 Z", "#A8443A", shadow=0)
    for g, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(g, (100 + s * 34, 120), "a hand on the book")
        fist(S, 100 + s * 36, 168, 0, w=18, h=20)
    return save("enemies", "boss-choir-singer", S)


BUILD = {"boss-winter-queen": winter_queen, "boss-gilded-seraph": lambda: seraph(False),
         "boss-gilded-seraph-fallen": lambda: seraph(True), "boss-choir-singer": choir_singer}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
