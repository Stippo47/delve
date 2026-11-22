"""Round 10, the art-round8 notes on the Wildwood's beasts and growing things (A2 library): wolves without paws, the
Alpha's scar, the dire wolf's mane and body, the boar (variants), the ents' faces (variants), the sproutling (new takes).
The wolves and ents are the copied round-8 generators with one argument per note (with none they give the round-8 file
byte for byte: check10.py).
python wild10.py [name ...]   -> ../../enemies/<name>.svg   (paths relative to this file)"""
import sys, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import *
import wild8 as W
import grove8 as G

HIDE, DHIDE, SNOUT, BONE, PINK_IN = "#6A5244", "#3E3028", "#C0908A", "#EFE4C6", "#9C7E8C"


def boar(v):
    """The thornback boar again, in the wolves' build (a capsule body, a round skull, a blunt snout), three ways with its
    thorns: "ridge" one jagged crest of bristles down the spine with three big thorns in it; "quills" a coat of quills
    all over the back, their tips pale, so its outline is spiky; "plates" three overlapping thorn-plates, each ending in
    a thorn either side."""
    what = {"ridge": "a crest of dark bristles down the spine with three big pale thorns standing in it",
            "quills": "a coat of long quills over the whole back, pale at the tips, so its outline is spiky",
            "plates": "three overlapping horn plates across the back, each ending in a thorn at either side"}[v]
    S = Sprite(f"THORNBACK BOAR (round 10, variant \"{v}\"): a stout wild boar seen from above in the wolves' capsule build: "
               f"{what}; a little tufted tail, a round skull with small pointed ears, a blunt snout with a pink-grey disc "
               "and two nostrils, two tusks curving up from the sides of it; two front hooves. No eyes. Parts: #back (tail, "
               "sways), #body, #arm-l / #arm-r (front legs and hooves, swing to walk), #front (snout and tusks, over the "
               "legs). " + LAYOUT)
    S.group("back", (100, 40), "tail")
    S.shape(strip([(100, 46), (97, 32), (103, 20), (100, 10)], 6, taper=(0.8, 1.0)), HIDE, shadow=0,
            decor=f'<path d="{ell(100, 10, 9, 8)}" fill="{DHIDE}"/>')
    S.group("body")
    if v == "quills":
        S.shape(W.tufts(100, 84, 62, 15, 0.3, 0, 0.92, 1.0, 0.7, sweep=34), BONE, shadow=0,
                decor=f'<path d="{W.tufts(100, 84, 50, 15, 0.26, 0, 0.92, 1.0, 0.7, sweep=34)}" fill="{DHIDE}"/>')
    S.shape(rr(100, 90, 96, 112, 48), HIDE, shadow=0 if v != "quills" else 3,
            decor=f'<path d="{ell(100, 78, 28, 44)}" fill="{DHIDE}" opacity="0.45"/>')
    if v == "ridge":
        left = [(100 - (15 if i % 2 else 9), 30 + i * 8) for i in range(13)]
        right = [(100 + (9 if i % 2 else 15), 30 + i * 8) for i in range(13)]
        S.shape(blob([(100, 22)] + right + [(100, 132)] + left[::-1], 0.5), DHIDE, shadow=3)
        for y, k in ((48, 0.9), (80, 1.05), (112, 0.95)):
            T = f"translate(100 {y}) scale({k})"
            S.shape(blob([(-9, 8), (0, 12), (9, 8), (5, -8), (0, -24), (-5, -8)], 0.7), BONE, T=T, shadow=3,
                    decor='<path d="M 0 12 L 10 8 L 6 -8 L 0 -24 Z" fill="#B8A67E" opacity="0.6"/>')
    elif v == "quills":
        for x, y, a in ((78, 54, -24), (122, 54, 24), (100, 44, 0), (70, 84, -30), (130, 84, 30), (88, 74, -10), (112, 74, 10),
                        (100, 98, 0), (80, 106, -18), (120, 106, 18)):
            T = f"translate({x} {y}) rotate({a})"
            S.shape(blob([(-6, 9), (0, 12), (6, 9), (3, -6), (0, -20), (-3, -6)], 0.7), BONE, T=T, shadow=2,
                    decor='<path d="M -7 2 L 7 2 L 7 14 L -7 14 Z" fill="#8A6E58" opacity="0.7"/>')
    else:
        for y, w in ((110, 46), (84, 50), (58, 44)):
            for s in (-1, 1):
                S.shape(blob([(100 + s * (w - 8), y - 16), (100 + s * (w + 14), y - 26), (100 + s * (w - 2), y - 2)], 0.6), BONE, shadow=0)
            S.shape(blob([(100 - w, y - 16), (100, y - 26), (100 + w, y - 16), (100 + w - 6, y + 4), (100, y + 12), (100 - w + 6, y + 4)], 0.8),
                    "#8E7A62", shadow=4, decor=strokes(f"M 100 {y - 22} L 100 {y + 8}", "#5E4E3E", 3, 0.5)
                    + f'<path d="{ell(84, y - 12, 14, 5)}" fill="#FFFFF4" opacity="0.14"/>')
    # head: a ruff of bristles, ears, the skull
    S.shape(cloud(100, 128, 40, 13, 0.52, 6), shade(HIDE, 0.9), shadow=3, T="translate(100 128) scale(1.1 0.78) translate(-100 -128)")
    for s in (-1, 1):
        S.shape(blob([(100 + s * 18, 126), (100 + s * 38, 104), (100 + s * 42, 122), (100 + s * 32, 138)], 0.6), HIDE, shadow=2,
                decor=f'<path d="{blob([(100 + s * 24, 126), (100 + s * 36, 112), (100 + s * 38, 123), (100 + s * 31, 133)], 0.6)}" fill="{PINK_IN}" opacity="0.75"/>')
    S.shape(ell(100, 140, 31, 28), HIDE, shadow=3, sop=0.15)

    def hoof(cx, cy, a):
        T = frame(cx, cy, a)
        S.shape(rr(0, -6, 20, 26, 9), HIDE, T=T, shadow=2)
        S.shape(blob([(-10, 4), (10, 4), (9, 14), (0, 16), (-9, 14)], 0.8), "#2E2624", T=T, shadow=2,
                decor='<path d="M 0 5 L 0 16" stroke="#4E4440" stroke-width="2.5"/>')
    S.group("arm-l", (70, 120), "front leg")
    hoof(62, 160, 8)
    S.group("arm-r", (130, 120), "front leg")
    hoof(138, 160, -8)
    S.group("front")
    sn = blob([(100, 138), (114, 144), (118, 160), (114, 176), (100, 182), (86, 176), (82, 160), (86, 144)], 0.9)
    S.shape(sn, light(HIDE, 1.18), shadow=4)
    for s in (-1, 1):
        S.shape(blob([(100 + s * 12, 172), (100 + s * 22, 172), (100 + s * 31, 162), (100 + s * 35, 146), (100 + s * 29, 153),
                      (100 + s * 22, 160), (100 + s * 14, 163)], 0.7), BONE, shadow=2)
    S.shape(ell(100, 174, 16, 11.5), SNOUT, shadow=3,
            decor=f'<path d="{ell(94, 174.5, 3.2, 4.4)} {ell(106, 174.5, 3.2, 4.4)}" fill="#6E4A48"/>')
    return save("enemies", f"wild-boar-{v}", S)


def leaf_d(cx, cy, a, L, w):
    T = frame(cx, cy, a)
    return blob([(0, 0), (w * 0.9, L * 0.3), (w, L * 0.55), (0, L), (-w, L * 0.55), (-w * 0.9, L * 0.3)], 0.8), T


def sprout(v):
    """New takes on the sproutling ("Don't like."): "bulb" a walking turnip, "acorn" an acorn in its cap, "bud" a closed
    flower bud on a rosette of leaves. All small, no face, two little hands in the arm parts."""
    LEAF, DLEAF = "#6EA048", "#4A7A34"
    if v == "bulb":
        S = Sprite("SPROUTLING (round 10, take \"bulb\"): a little walking turnip seen from above: a round bulb, cream going "
                   "to violet at the crown, three broad leaves sprouting from the crown and lying back, two root-tip hands. "
                   "No face. Parts: #back (the leaves, sway), #arm-l / #arm-r (root hands), #body. " + LAYOUT)
        S.add_def('<radialGradient id="gBulb" cx="0.5" cy="0.22" r="0.9"><stop offset="0" stop-color="#B06AA0"/>'
                  '<stop offset="0.42" stop-color="#D9A6C8"/><stop offset="0.7" stop-color="#F4EAD6"/><stop offset="1" stop-color="#E2D2B4"/></radialGradient>')
        S.group("back", (100, 92), "leaves")
        for a, L, w in ((180 - 40, 78, 24), (180 + 40, 78, 24), (180, 88, 26)):
            d, T = leaf_d(100, 92, a, L, w)
            S.shape(d, LEAF if a != 180 else "#7CB052", T=T, shadow=3,
                    decor=f'<path d="M 0 8 L 0 {L - 12}" stroke="{DLEAF}" stroke-width="3.5" stroke-linecap="round" opacity="0.6"/>')
        for gid, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(gid, (100 + s * 34, 124), "root hand")
            S.shape(blob([(100 + s * 30, 122), (100 + s * 46, 130), (100 + s * 52, 146), (100 + s * 46, 158), (100 + s * 38, 148), (100 + s * 30, 140)], 0.8),
                    "#E8DCC0", shadow=0)
        S.group("body")
        S.shape(ell(100, 122, 46, 44), fill="url(#gBulb)", shadow=3, side=False,
                decor=f'<path d="{ell(84, 108, 14, 9)}" fill="#FFFFFF" opacity="0.3"/>'
                      f'<rect x="100" y="60" width="60" height="120" fill="#5A2E4A" opacity="0.12"/>')
        S.shape(circ(100, 96, 10), "#5E8A3C", shadow=2)
        return save("enemies", "wild-sproutling-bulb", S)
    if v == "acorn":
        S = Sprite("SPROUTLING (round 10, take \"acorn\"): a walking acorn seen from above: a smooth tan nut under a big "
                   "scaly brown cap worn like a hat, a short stalk on the cap with one green leaf, two twig hands. No face. "
                   "Parts: #arm-l / #arm-r (twig hands), #body. " + LAYOUT)
        NUT, CAP = "#D9A866", "#7A5236"
        for gid, s in (("arm-l", -1), ("arm-r", 1)):
            S.group(gid, (100 + s * 34, 122), "twig hand")
            S.shape(strip([(100 + s * 30, 122), (100 + s * 44, 138), (100 + s * 48, 152)], 7, taper=(0.9, 1.0)), "#7E5E40", shadow=0)
            S.shape(circ(100 + s * 48, 154, 9), NUT, shadow=2)
        S.group("body")
        S.shape(blob([(100, 172), (72, 160), (58, 136), (60, 112), (140, 112), (142, 136), (128, 160)], 0.9), NUT, shadow=0,
                decor=f'<path d="{ell(82, 140, 9, 16)}" fill="#FFFFF4" opacity="0.28"/>')
        cap = ell(100, 88, 54, 52)
        scales = "".join(f'<path d="M {x} -20 L {x + 150} 200 M {x + 150} -20 L {x} 200" fill="none" stroke="#5A3A24" stroke-width="3" opacity="0.5"/>'
                         for x in range(-150, 200, 26))
        S.shape(cap, CAP, shadow=5, decor=scales
                + f'<path d="{ell(80, 62, 22, 12)}" fill="#FFFFF4" opacity="0.12"/>')
        S.shape(strip([(100, 70), (102, 54), (108, 44)], 6, taper=(0.9, 1.0)), "#5A3A24", shadow=3)
        d, T = leaf_d(108, 46, -126, 34, 12)
        S.shape(d, LEAF, T=T, shadow=3, decor=f'<path d="M 0 4 L 0 28" stroke="{DLEAF}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>')
        return save("enemies", "wild-sproutling-acorn", S)
    S = Sprite("SPROUTLING (round 10, take \"bud\"): a walking flower bud seen from above: a rosette of five broad leaves "
               "for a body, a closed pink bud in the middle wrapped in three green sepals (it opens to spit seeds when it "
               "roots), two leaf hands. No face. Parts: #arm-l / #arm-r (leaf hands), #body. " + LAYOUT)
    for gid, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + s * 34, 120), "leaf hand")
        d, T = leaf_d(100 + s * 34, 120, -s * 28, 46, 13)
        S.shape(d, "#7CB052", T=T, shadow=0, decor=f'<path d="M 0 6 L 0 38" stroke="{DLEAF}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>')
    S.group("body")
    for a in (108, 180, 252, 144, 216):
        d, T = leaf_d(100, 106, a, 70, 24)
        S.shape(d, DLEAF if a in (144, 216) else LEAF, T=T, shadow=3,
                decor='<path d="M 0 8 L 0 58" stroke="#3A6428" stroke-width="3.5" stroke-linecap="round" opacity="0.55"/>')
    S.shape(circ(100, 116, 38), "#E88AA8", shadow=5, decor=f'<path d="{ell(88, 102, 14, 9)}" fill="#FFFFFF" opacity="0.3"/>'
            + strokes("M 100 80 C 112 96 112 136 100 152 M 76 96 C 92 104 108 104 124 96", "#C2607E", 3.5, 0.6))
    for a in (0, 120, 240):
        T = f"rotate({a} 100 116)"
        S.shape(blob([(82, 150), (100, 156), (118, 150), (112, 130), (100, 112), (88, 130)], 0.8), "#5E9440", T=T, shadow=3)
    return save("enemies", "wild-sproutling-bud", S)


BUILD = {
    # "Show me wolves without paws"
    "wild-wolf-nopaws": lambda: W.wolf("wolf", paws=False, out="wild-wolf-nopaws"),
    "wild-dire-wolf-nopaws": lambda: W.wolf("dire-wolf", paws=False, mane=1.25, body=1.1, out="wild-dire-wolf-nopaws"),
    "wild-alpha-nopaws": lambda: W.wolf("alpha", paws=False, scar="claws", out="wild-alpha-nopaws"),
    # "Change face scar": two scars to choose from
    "wild-alpha-scar-claws": lambda: W.wolf("alpha", scar="claws", out="wild-alpha-scar-claws"),
    "wild-alpha-scar-snout": lambda: W.wolf("alpha", scar="snout", out="wild-alpha-scar-snout"),
    # "Mane not big enough. Body also 10% bigger"
    "wild-dire-wolf": lambda: W.wolf("dire-wolf", mane=1.25, body=1.1),
}
for _f in ("brow", "nose", "hollows"):      # the Ent: "Face variants"
    BUILD[f"wild-ent-face-{_f}"] = (lambda f=_f: G.ent(face=f, out=f"wild-ent-face-{f}"))
for _f in ("brows", "nose", "glow"):        # the Elder Ent: "Change face. 3 versions."
    BUILD[f"wild-elder-ent-face-{_f}"] = (lambda f=_f: G.elder_ent(face=f, out=f"wild-elder-ent-face-{f}"))
for _v in ("ridge", "quills", "plates"):    # the boar: "Make variants."
    BUILD[f"wild-boar-{_v}"] = (lambda v=_v: boar(v))
for _v in ("bulb", "acorn", "bud"):         # the sproutling: "Don't like."
    BUILD[f"wild-sproutling-{_v}"] = (lambda v=_v: sprout(v))

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
