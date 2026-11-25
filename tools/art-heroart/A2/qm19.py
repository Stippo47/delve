"""The Quartermaster, three takes (round 19). The designer (round 12, kits): "Overall don't like. Visuals or abilities...
Needs to be more unique"; round 13 gave him a new kit (Pack toss: pots, pans, boots; Supply Crate; Barricade; Pot Helmet;
trait Requisition). Parts as the file in the game: #back (the load, pivot 100 80), #body, both fists on the straps in
#arm-l (46 108) and #arm-r (154 108), after the body; the ledger take holds its book in the left fist."""
from r19 import *

IRON, DIRON, CANVAS, LEATHER, PLANK = "#7C828C", "#4E535C", "#B89A6C", "#8A5A34", "#C08A52"


def straps(S, col=LEATHER):
    for x in (66, 134):
        S.shape(rr(x, 104, 15, 62, 6), col, shadow=2, decor=f'<path d="{rr(x, 122, 17, 6, 2)}" fill="#D9B061"/>')


def strap_fists(S):
    S.group("arm-l", PL, "fist on the strap")
    fist(S, 65, 144, 0)
    S.group("arm-r", PR, "fist on the strap")
    fist(S, 135, 144, 0)


def frying_pan(S, x, y, a, r=17):
    T = frame(x, y, a)
    S.shape(rr(0, -r - 14, 7, 24, 3.5), "#6A4426", T=T, shadow=0)
    S.shape(circ(0, 0, r), DIRON, T=T, shadow=0, decor=f'<path d="{circ(0, 1, r - 4)}" fill="#33363C"/>' + hi(-5, -5, 5, 3, 0.35))


def boot(S, x, y, a):
    S.shape(blob([(-8, -14), (8, -14), (9, 6), (16, 12), (14, 20), (-8, 20)], 0.6), "#6B4428", T=frame(x, y, a), shadow=0,
            decor=f'<path d="{rr(0, 18, 30, 6, 3)}" fill="#3A2A20"/>')


def qm(v):
    what = {"pots": "a cook-sergeant who wears a big upturned cooking pot as a helmet (a ladle hooked on its handle: his Pot "
                    "Helmet), a bushy moustache; olive jerkin, leather straps; a canvas rucksack hung with a frying pan, a "
                    "kettle and a spare boot (what Pack toss throws)",
            "ledger": "a supply clerk with a peaked cap and a pencil behind his ear, a wooden carrying frame on his back with "
                      "two supply crates lashed on and a lantern; an open ledger in his left fist (he has a receipt for "
                      "everything), the right fist on the strap",
            "sack": "a small, round packer under an enormous patched sack bigger than he is, its mouth tied with rope and "
                    "things poking out of it (a broom, a pan, a sword hilt, a boot); curly hair and a red neckerchief"}[v]
    S = Sprite(f"QUARTERMASTER (round 19, take \"{v}\"): {what}. " + LAYOUT + " The game draws the outline.")
    if v == "pots":
        S.group("back", (100, 80), "the rucksack and what hangs off it (sways)")
        frying_pan(S, 34, 46, 40)
        S.shape(blob([(150, 30), (174, 26), (184, 44), (176, 64), (154, 66), (146, 48)], 0.8), "#8E949E", shadow=0,
                decor=f'<path d="{rr(165, 22, 18, 6, 3)}" fill="#5A5F68"/>' + hi(156, 38, 6, 4, 0.4))
        S.shape(taper([(176, 40), (192, 30), (200, 34)], 7, 4), "#8E949E", shadow=0)
        S.shape(rr(100, 44, 118, 82, 26), CANVAS, shadow=0, decor=f'<path d="{rr(100, 66, 118, 34, 14)}" fill="{shade(CANVAS, 0.85)}"/>'
                + strokes("M 52 50 L 148 50", shade(CANVAS, 0.7), 2.5, 0.6))
        boot(S, 104, 2, 160)
        S.shape(taper([(70, 20), (58, -8)], 7, 6), "#B9BEC6", shadow=2)
        S.shape(ell(56, -12, 10, 8), "#B9BEC6", shadow=0, decor=f'<path d="{ell(56, -11, 6, 4.5)}" fill="#8A9099"/>')
        S.group("body")
        S.shape(SHOULDERS, "#6F7B4A", decor=hi(56, 92, 18, 6, 0.2))
        straps(S)
        head(S)
        mouth(S, 140)
        moustache(S, "#8A5A34", y=128, w=1.05, droop=2)
        # the pot: its rim, the pot (bottom up) and two handles, a ladle hooked on the right one
        S.shape(rr(146, 84, 22, 12, 6) + " " + rr(146, 84, 10, 3, 1.5), DIRON, shadow=0, rule="evenodd")
        S.shape(rr(54, 84, 22, 12, 6) + " " + rr(54, 84, 10, 3, 1.5), DIRON, shadow=0, rule="evenodd")
        S.shape(ell(100, 96, 54, 22), DIRON, shadow=4)
        S.shape(blob([(52, 92), (54, 56), (72, 34), (100, 28), (128, 34), (146, 56), (148, 92), (124, 104), (100, 106), (76, 104)], 0.8), IRON, shadow=0,
                decor=hi(76, 50, 14, 9, 0.4, -30) + f'<path d="{ell(100, 64, 26, 20)}" fill="{shade(IRON, 0.88)}" opacity="0.6"/>'
                + strokes("M 56 92 Q 100 110 144 92", "#9EA4AE", 3, 0.7) + f'<path d="{circ(124, 82, 3)}" fill="#5A3A26" opacity="0.6"/>'
                + f'<path d="{circ(80, 74, 2.5)}" fill="#5A3A26" opacity="0.5"/>')
        S.shape(taper([(150, 86), (168, 70), (178, 50)], 6, 5), "#B9BEC6", shadow=2)
        S.shape(circ(181, 44, 9), "#B9BEC6", shadow=2, decor=f'<path d="{circ(182, 45, 5.5)}" fill="#8A9099"/>')
        strap_fists(S)
    elif v == "ledger":
        S.group("back", (100, 80), "the carrying frame, two crates and a lantern (sways)")
        for x in (58, 142):
            S.shape(rr(x, 36, 10, 92, 5), PLANK, shadow=0)
        crate = lambda cx, cy, w, h: S.shape(rr(cx, cy, w, h, 4), PLANK, shadow=3,
                                              decor=strokes(f"M {cx - w / 2 + 6} {cy - h / 2 + 6} L {cx + w / 2 - 6} {cy + h / 2 - 6}", shade(PLANK, 0.75), 4, 0.8)
                                              + strokes(f"M {cx - w / 2} {cy - h / 6} L {cx + w / 2} {cy - h / 6}", shade(PLANK, 0.7), 2, 0.6)
                                              + strokes(f"M {cx - w / 2} {cy + h / 6} L {cx + w / 2} {cy + h / 6}", shade(PLANK, 0.7), 2, 0.6)
                                              + f'<path d="{rr(cx, cy, w - 4, h - 4, 3)}" fill="none" stroke="{shade(PLANK, 0.7)}" stroke-width="3"/>')
        crate(100, 50, 96, 54)
        crate(94, 16, 64, 36)
        S.shape(rr(100, 50, 106, 7, 3) + " " + rr(100, 28, 8, 60, 3), "#C9B07A", shadow=2)  # rope
        S.shape(rr(152, 12, 18, 24, 6), "#5A5F68", shadow=2, decor=f'<path d="{rr(152, 12, 10, 14, 4)}" fill="#FFD36A"/>')
        S.shape(ring(152, -2, 6, 3), "#5A5F68", shadow=0, rule="evenodd")
        for x in (58, 142):
            S.shape(circ(x, -10, 6), shade(PLANK, 0.9), shadow=0)
        S.group("body")
        S.shape(SHOULDERS, "#3E5E8A", decor=hi(56, 92, 18, 6, 0.2) + "".join(f'<path d="{circ(100, y, 2.8)}" fill="#E8C56A"/>' for y in (116, 128)))
        straps(S, "#6E4A2C")
        head(S)
        mouth(S)
        # the peaked cap: crown, band and a stiff brim at the front; the pencil behind the right ear
        S.shape("M 148 112 L 166 96 L 170 100 L 152 116 Z", "#E6C46A", shadow=2, decor=f'<path d="M 164 96 L 172 92 L 170 100 Z" fill="#F4D8B0"/>')
        S.shape(blob([(52, 92), (52, 58), (70, 38), (100, 32), (130, 38), (148, 58), (148, 92), (100, 86)], 0.8), "#34507A", shadow=4,
                decor=hi(74, 52, 14, 8, 0.25, -30) + strokes("M 100 34 L 100 84", shade("#34507A", 0.7), 2, 0.5))
        S.shape("M 54 90 C 70 82 86 80 100 80 C 114 80 130 82 146 90 L 146 100 C 130 94 114 92 100 92 C 86 92 70 94 54 100 Z", "#2B3A52", shadow=2)
        S.shape("M 62 98 C 76 92 88 91 100 91 C 112 91 124 92 138 98 C 134 108 120 112 100 112 C 80 112 66 108 62 98 Z", "#22252C", shadow=3,
                decor=hi(84, 98, 12, 3, 0.35))
        S.shape(rr(100, 86, 14, 10, 3), "#E8C56A", shadow=2)
        S.group("arm-l", PL, "the ledger, open, held in the left fist")
        T = frame(62, 156, -10)
        S.shape(rr(0, 0, 50, 34, 4), "#7A3A2C", T=T, shadow=3)
        S.shape(rr(-11, -1, 22, 30, 2) + " " + rr(11, -1, 22, 30, 2), "#F6EEDA", T=T, shadow=1,
                decor="".join(strokes(f"M {x0} {y} L {x0 + 16} {y}", "#8A8070", 1.6, 0.7) for x0 in (-19, 3) for y in (-9, -4, 1, 6, 11)))
        fist(S, 54, 140, 0)
        S.group("arm-r", PR, "fist on the strap")
        fist(S, 135, 144, 0)
    else:
        SACK = "#C9A877"
        S.group("back", (100, 80), "the great sack and what pokes out of it (sways)")
        S.shape(taper([(84, 20), (50, -4)], 9, 8), "#B07A44", shadow=0)
        S.shape(blob([(30, -2), (40, -18), (58, -14), (52, 4)], 0.6), "#E0C36A", shadow=0,
                decor="".join(strokes(f"M {34 + 5 * k} -10 L {42 + 4 * k} 2", "#B8963E", 2, 0.8) for k in range(4)))
        S.shape(taper([(118, 22), (148, -2)], 8, 8), "#6A4426", shadow=0)
        S.shape(rr(150, -4, 26, 8, 4), "#C9A25A", shadow=0, T="rotate(-38 150 -4)")
        S.shape(circ(156, -10, 6), "#C9A25A", shadow=0)
        frying_pan(S, 104, -2, 200, 17)
        boot(S, 72, 10, 210)
        sack = blob([(26, 74), (18, 40), (34, 12), (66, 0), (100, -2), (134, 0), (166, 12), (182, 40), (174, 74), (100, 96)], 0.85)
        S.shape(sack, SACK, shadow=4, decor=hi(56, 26, 22, 12, 0.25, -25)
                + f'<path d="{rr(150, 40, 26, 22, 4)}" fill="#9C6B4A"/>' + strokes("M 140 32 L 160 48 M 160 32 L 140 48", "#6A4426", 2, 0.8)
                + f'<path d="{rr(48, 46, 22, 18, 3)}" fill="#7C8A5C"/>' + strokes("M 40 40 L 56 52", "#4A5634", 2, 0.8)
                + strokes("M 60 14 Q 100 30 140 14", shade(SACK, 0.7), 3, 0.7))
        S.shape(ell(100, 20, 26, 10), "#B8925C", shadow=2, decor=strokes("M 76 20 Q 100 30 124 20", "#8C6A3E", 3, 0.8))
        S.group("body")
        S.shape(SHOULDERS, "#9C7A4E", decor=hi(56, 92, 18, 6, 0.2))
        straps(S, "#C9B07A")
        S.shape("M 70 128 C 80 142 120 142 130 128 L 124 150 C 112 158 88 158 76 150 Z", "#C8443A", shadow=3)
        head(S)
        mouth(S)
        S.shape("M 54 100 C 50 66 70 48 100 48 C 130 48 150 66 146 100 C 132 92 116 90 100 90 C 84 90 68 92 54 100 Z", "#7A4A2A", shadow=4)
        curls = [(100 + 40 * math.cos(math.radians(a)), 96 + 22 * math.sin(math.radians(a)), 9.5) for a in range(190, 351, 20)]
        S.shape(circles(curls), "#7A4A2A", shadow=4, decor="".join(strokes(f"M {f(x - 5)} {f(y)} Q {f(x)} {f(y - 6)} {f(x + 5)} {f(y)}", "#A46A40", 2.4, 0.7) for x, y, r in curls[::2]))
        strap_fists(S)
    return save("heroes", "quartermaster", v, S)


if __name__ == "__main__":
    for v in ("pots", "ledger", "sack"):
        print(qm(v))
