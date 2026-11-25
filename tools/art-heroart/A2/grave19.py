"""The Grave Warden (the Crypt's mini-boss), three takes (round 19). It still wears the Brute's sprite (js/enemies.js
graveWarden: art 'art/enemies/brute.svg', "powered-up stand-ins"). Drawn as the skeletons are (the skull seen from the
front-top, eye sockets, the Bone King's family), bigger and dressed for the graveyard. Parts: the weapon in #arm-r
(158 108), #body, the off hand in #arm-l (42 108); attackAnim swing. Drawn at vr 36 / headR 60 (sizeU 132)."""
from r19 import *

BONE_, DBONE = "#EFE4C8", "#B9A882"
PLg, PRg = (42, 108), (158, 108)


def skull(S, cy=96, w=1.0, jaw=True):
    """A big skull, front-top: the cranium, two deep sockets, the nose hole, a row of teeth, the jaw under it."""
    if jaw:
        S.shape(rr(100, cy + 44, 56 * w, 26, 11), BONE_, shadow=3,
                decor="".join(f'<path d="{rr(100 + dx, cy + 36, 7, 10, 2)}" fill="#FFFFF4"/>' for dx in (-16, -8, 0, 8, 16)))
    S.shape(blob([(100 - 46 * w, cy + 6), (100 - 44 * w, cy - 32), (100 - 22 * w, cy - 52), (100, cy - 56), (100 + 22 * w, cy - 52),
                  (100 + 44 * w, cy - 32), (100 + 46 * w, cy + 6), (100 + 30 * w, cy + 34), (100, cy + 38), (100 - 30 * w, cy + 34)], 0.8), BONE_, shadow=5,
            decor=hi(100 - 22 * w, cy - 34, 14, 8, 0.45, -30)
            + f'<path d="{blob([(78, cy - 4), (90, cy - 6), (94, cy + 6), (86, cy + 16), (74, cy + 10)], 0.8)}" fill="#2E2430"/>'
            + f'<path d="{blob([(122, cy - 4), (110, cy - 6), (106, cy + 6), (114, cy + 16), (126, cy + 10)], 0.8)}" fill="#2E2430"/>'
            + f'<path d="M 100 {cy + 14} L 106 {cy + 26} L 94 {cy + 26} Z" fill="#2E2430"/>'
            + "".join(f'<path d="{rr(100 + dx, cy + 32, 7, 9, 2)}" fill="#FFFFF4" stroke="{DBONE}" stroke-width="1"/>' for dx in (-14, -7, 0, 7, 14)))


def bone_fist(S, x, y, a=0):
    if "gHandBone" not in "".join(S.defs):
        S.add_def('<radialGradient id="gHandBone" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#FBF4E2"/><stop offset="1" stop-color="#C9B892"/></radialGradient>')
    S.shape(rr(0, 0, 22, 24, 7), fill="url(#gHandBone)", T=frame(x, y, a), shadow=3, side=False,
            decor="".join(strokes(f"M {dx} -10 L {dx} 10", DBONE, 1.6, 0.8) for dx in (-5, 0, 5)))


def warden(v):
    what = {"digger": "the gravedigger: a ragged moss-green cowl over a big skull, a long grave spade held forward in the "
                      "right hand (it swings it), a lantern with a green ghost-light in the left; a tattered mantle",
            "coffin": "the warden in rusted iron: a pot helm with a crest of bone, a coffin lid for a shield on the left arm, "
                      "a flanged mace in the right; chains across the shoulders",
            "undertaker": "the undertaker: a tall black hat with a crepe band, a grey shroud wound round the shoulders, a "
                          "great coffin-maker's mallet in the right hand, a ring of iron keys in the left"}[v]
    S = Sprite(f"THE GRAVE WARDEN (round 19, take \"{v}\"): {what}. Facing down; the game draws the outline.")
    S.group("arm-r", PRg, "the weapon in the right hand")
    if v == "digger":
        T = frame(150, 150, -6)
        S.shape(rr(0, -10, 9, 70, 4), "#7A5236", T=T, shadow=0)
        S.shape(blob([(-15, 28), (15, 28), (16, 52), (0, 64), (-16, 52)], 0.5), "#8E949E", T=T, shadow=2,
                decor=f'<path d="{poly([(0, 26), (18, 26), (18, 66), (0, 66)])}" fill="#5E646E" opacity="0.5"/>' + f'<path d="{circ(-6, 40, 3)}" fill="#8E5A3A" opacity="0.7"/>')
        bone_fist(S, 150, 148, -6)
    elif v == "coffin":
        T = frame(150, 150, -8)
        S.shape(rr(0, 6, 9, 30, 4), "#5A3A26", T=T, shadow=0)
        S.shape(circ(0, 32, 14), "#7C828C", T=T, shadow=2, decor=hi(-5, 27, 4, 3, 0.5))
        for k in range(6):
            a = math.radians(60 * k)
            S.shape(blob([(10 * math.cos(a) - 4 * math.sin(a), 32 + 10 * math.sin(a) + 4 * math.cos(a)), (10 * math.cos(a) + 4 * math.sin(a), 32 + 10 * math.sin(a) - 4 * math.cos(a)),
                          (22 * math.cos(a), 32 + 22 * math.sin(a))], 0.4), "#6E747E", T=T, shadow=0)
        bone_fist(S, 150, 148, -8)
    else:
        T = frame(150, 150, -6)
        S.shape(rr(0, 6, 9, 40, 4), "#7A5236", T=T, shadow=0)
        S.shape(rr(0, 40, 40, 24, 6), "#8A6A46", T=T, shadow=2, decor=f'<path d="{rr(-17, 40, 6, 24, 2)}" fill="#5E646E"/><path d="{rr(17, 40, 6, 24, 2)}" fill="#5E646E"/>')
        bone_fist(S, 150, 148, -6)
    S.group("body")
    if v == "digger":
        S.shape(SHOULDERS, "#4E5A3A", decor=hi(56, 92, 18, 6, 0.2)
                + "".join(f'<path d="{poly([(x, 136), (x + 6, 146), (x + 12, 136)])}" fill="#4E5A3A"/>' for x in range(30, 170, 14)))
        S.shape(blob([(46, 122), (40, 70), (62, 34), (100, 24), (138, 34), (160, 70), (154, 122), (138, 110), (100, 104), (62, 110)], 0.8), "#5A6A40", shadow=4,
                decor=hi(70, 50, 14, 8, 0.2, -30) + strokes("M 100 26 L 100 100", "#3E4A2C", 2.5, 0.6))
        skull(S, 108, 0.82)
        S.shape("M 52 110 C 60 90 78 80 100 80 C 122 80 140 90 148 110 C 138 98 120 90 100 90 C 80 90 62 98 52 110 Z", "#3E4A2C", shadow=0, side=False)
    elif v == "coffin":
        S.shape(SHOULDERS, "#5A4E5E", decor=hi(56, 92, 18, 6, 0.2))
        S.shape(chain([(40 + 9 * k, 96 + 3 * k) for k in range(8)] + [(160 - 9 * k, 96 + 3 * k) for k in range(8)], 5, 2), "#8E949E", rule="evenodd", shadow=2)
        skull(S, 108, 0.86)
        S.shape(blob([(52, 86), (56, 52), (78, 34), (100, 30), (122, 34), (144, 52), (148, 86), (124, 80), (100, 78), (76, 80)], 0.8), "#7C6A5A", shadow=4,
                decor=hi(74, 50, 14, 8, 0.35, -30) + "".join(f'<path d="{circ(x, y, 3)}" fill="#A8553A" opacity="0.7"/>' for x, y in ((70, 66), (128, 58), (110, 46))))
        S.shape(rr(100, 82, 100, 10, 5), "#5E5048", shadow=2, decor="".join(f'<path d="{circ(x, 82, 2.4)}" fill="#C9B89A"/>' for x in (60, 80, 100, 120, 140)))
        for k in range(5):
            S.shape(blob([(100 - 5, 34 + 10 * k), (100 + 5, 34 + 10 * k), (100, 22 + 10 * k)], 0.4), BONE_, shadow=1)
    else:
        S.shape(SHOULDERS, "#2E2A34", decor=hi(56, 92, 18, 6, 0.15))
        S.shape("M 30 108 C 40 88 70 84 100 86 C 130 84 160 88 170 108 C 150 124 130 130 100 130 C 70 130 50 124 30 108 Z", "#9A9AA2", shadow=3,
                decor=strokes("M 40 106 Q 100 92 160 106", "#7A7A84", 2.4, 0.8) + strokes("M 46 116 Q 100 104 154 116", "#7A7A84", 2.4, 0.8))
        skull(S, 112, 0.82)
        S.shape(ell(100, 74, 58, 26), "#1E1C22", shadow=4, decor=hi(72, 64, 14, 5, 0.25, -10))
        S.shape(circ(100, 62, 27), "#2A2630", shadow=3, decor=hi(90, 52, 8, 5, 0.3, -30))
        S.shape(ring(100, 62, 28, 22), "#55505E", shadow=0, rule="evenodd")
    S.group("arm-l", PLg, "the off hand")
    if v == "digger":
        S.shape(rr(52, 164, 20, 26, 6), "#4A4F58", shadow=0, decor=f'<path d="{rr(52, 166, 12, 16, 4)}" fill="#9CF28A"/>' + hi(48, 160, 3, 5, 0.6))
        S.shape(ring(52, 146, 6, 3), "#4A4F58", shadow=0, rule="evenodd")
        bone_fist(S, 54, 140)
    elif v == "coffin":
        T = frame(52, 150, 10)
        S.shape(poly([(-16, -26), (16, -26), (24, -6), (16, 40), (-16, 40), (-24, -6)]), "#6A4A32", T=T, shadow=2,
                decor=strokes("M -14 0 L 14 0 M 0 -16 L 0 30", "#C9B89A", 4, 0.9) + "".join(f'<path d="{circ(x, y, 2.2)}" fill="#8E949E"/>' for x, y in ((-12, -20), (12, -20), (-12, 34), (12, 34))))
        bone_fist(S, 58, 136, 10)
    else:
        S.shape(ring(50, 164, 12, 8), "#7C828C", shadow=0, rule="evenodd")
        for a in (60, 100, 140):
            x, y = 50 + 12 * math.cos(math.radians(a)), 164 + 12 * math.sin(math.radians(a))
            S.shape(rr(0, 10, 5, 18, 2) + " " + circ(0, 0, 5), "#7C828C", T=frame(x, y, a - 90), shadow=0)
        bone_fist(S, 54, 142)
    return save("bosses", "graveWarden", v, S)


if __name__ == "__main__":
    for v in ("digger", "coffin", "undertaker"):
        print(warden(v))
