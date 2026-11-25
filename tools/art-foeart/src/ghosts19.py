"""Round 19 art lane: the banshee. Imported by build19.py.
The game's banshee is round 4's "wailer" (art/enemies/placeholder/banshee.svg, "marked not good"); the designer on the
round-4 hooded take: "No. Try again. Losing style." and, earlier (round 3, Skeleton - Hollow): "Keep the head for a
ghoul/banshee enemy. Doesn't work as a skeleton." The approved spirits are the ghosts (a soft teardrop, two dark eyes,
a small 'o' of a mouth: "Ghosts can also have eyes") and the icicle wraith built on them. Option A is a banshee in the
ghosts' own build; option B wears the Hollow's head, as asked in round 3; option C is A with a hood."""
from fiends19 import *

LILAC, LILAC_D, HAIR, HAIR_D, TEAL = "#EEEDF6", "#9E98BC", "#8E8AB2", "#5E5A84", "#3E8E8A"
INK_EYE = "#2B2230"


def ghost_body(S, col, front=150, back=30, w=46):
    """The ghosts' teardrop seen from above: round at the front, drawn back to a soft point behind."""
    S.shape(blob([(100, front + 4), (100 + w * 0.78, front - 14), (100 + w, front - 48), (100 + w * 0.7, front - 84),
                  (100 + w * 0.3, back + 18), (100, back), (100 - w * 0.3, back + 18), (100 - w * 0.7, front - 84),
                  (100 - w, front - 48), (100 - w * 0.78, front - 14)], 0.9), col, shadow=0,
            decor=hi(82, front - 70, 16, 22, 0.25))


def wail(S, y=138, w=10, h=13):
    """Two hollow eyes and the wailing mouth: dark ovals, the mouth taller than wide and open."""
    for x in (83, 117):
        S.raw(f'<path d="{ell(x, y - 24, 8.5, 11)}" fill="{INK_EYE}"/>')
    S.raw(f'<path d="{ell(100, y, w, h)}" fill="{INK_EYE}"/><path d="{ell(100, y + 3, w * 0.55, h * 0.45)}" fill="#5A4E6E"/>')


def ghost_hand(S, gid, s, col, pivot_x):
    """A ghost's reaching arm: a soft wisp of a sleeve from the side to a pale hand forward."""
    S.group(gid, (pivot_x, 112), "reaching hand")
    x0 = 100 + s * 46
    S.shape(blob([(x0 - 11, 120), (x0, 112), (x0 + 11, 120), (x0 + 10, 142), (x0, 150), (x0 - 10, 142)], 0.9), col, shadow=3)


def banshee(opt):
    S = Sprite({"a": "BANSHEE, round 19 option A, 'wailer' in the ghosts' build: the ghost's soft pale-lilac teardrop, its "
                     "front a face with the ghosts' two dark eyes and a wide open wailing mouth; long silver-blue hair parted "
                     "over the crown and falling past the face, streaming back far behind her in one long wavy tail (#back, "
                     "sways); two thin wisps of arms reaching forward to pale hands. Parts: #back (the hair's tail), #body, "
                     "#arm-l / #arm-r (the reaching hands). ",
                "b": "BANSHEE, round 19 option B, 'hollow': the Hollow's head (round 3: \"Keep the head for a ghoul/banshee\") "
                     "on a spirit: a pale bone skull with two big hollow sockets, a dark nose hole and a gaping jaw, in a "
                     "ragged grey-teal shroud that hoods the back of the skull and trails behind into a ghost's tail; two "
                     "bony hands reaching forward. Parts: #back (the shroud's tail), #body, #arm-l / #arm-r (bony hands). ",
                "c": "BANSHEE, round 19 option C, 'veil': option A under a sheer teal veil: the hair hidden but for two long "
                     "locks by the face, the veil hanging back off the crown and trailing in a long ragged train (#back); "
                     "the ghosts' eyes and the wailing mouth. Parts: #back (the veil's train), #body, #arm-l / #arm-r "
                     "(reaching hands). "}[opt] + LAY)
    if opt in ("a", "c"):
        col_tail, col_tail_d = (HAIR, HAIR_D) if opt == "a" else ("#5FA8A2", "#2E6E6A")
        S.group("back", (100, 70), "the hair's long tail" if opt == "a" else "the veil's train")
        spine = [(100, 86), (108, 60), (94, 34), (106, 10), (98, -6)]
        S.shape(strip(spine, 30, 0.12, 3, (0.55, 1.0)), col_tail, shadow=0,
                decor=strokes("M 100 80 C 108 58 92 36 104 12 M 90 74 C 96 54 84 40 92 20 M 112 72 C 118 54 104 38 114 22",
                              col_tail_d, 3, 0.5))
        ghost_hand(S, "arm-r", 1, LILAC, 140)
        S.group("body")
        ghost_body(S, LILAC, 152, 60, 48)
        if opt == "a":   # the hair: a cap over the crown parted down the middle, two long locks down beside the face
            S.shape("M 54 100 C 52 70 70 52 100 52 C 130 52 148 70 146 100 C 146 118 144 132 140 144 C 134 130 132 104 "
                    "118 90 C 112 85 104 86 100 90 C 96 86 88 85 82 90 C 68 104 66 130 60 144 C 56 132 54 118 54 100 Z",
                    HAIR, shadow=3, decor=strokes("M 100 56 L 100 94", HAIR_D, 3, 0.6) + hi(80, 66, 12, 7, 0.22))
        else:            # the veil: over the crown and down both sides, a dark gap where the face shows
            S.shape("M 50 110 C 46 72 68 48 100 48 C 132 48 154 72 150 110 C 150 128 144 144 136 154 C 132 136 130 114 "
                    "118 102 C 108 96 92 96 82 102 C 70 114 68 136 64 154 C 56 144 50 128 50 110 Z", "#5FA8A2", shadow=3,
                    decor=hi(80, 64, 14, 8, 0.25) + strokes("M 76 60 Q 100 52 124 60", "#9AD0CA", 3, 0.6))
        wail(S, 140)
        ghost_hand(S, "arm-l", -1, LILAC, 60)
    else:
        BONE, SHROUD, SHROUD_D = "#EFE6CE", "#7E9A9C", "#4E6A70"
        S.group("back", (100, 72), "the shroud's tail")
        S.shape(blob([(64, 92), (100, 84), (136, 92), (130, 62), (116, 34), (110, 6), (100, -6), (92, 10), (84, 30), (70, 60)], 0.8),
                SHROUD, shadow=0, decor=strokes("M 100 80 C 104 54 96 32 102 6 M 86 70 C 90 50 84 38 90 22", SHROUD_D, 3, 0.5))
        S.group("arm-r", (140, 112), "bony hand")
        S.shape(taper([(140, 104), (152, 124), (150, 144)], 22, 14, 0.8), SHROUD, shadow=0)
        S.shape(rr(150, 152, 18, 20, 7), BONE, shadow=3, side=False)
        for dx in (-5.5, 0, 5.5):
            S.shape(rr(150 + dx, 166, 4.6, 12, 2.3), BONE, shadow=1, side=False)
        S.group("body")
        S.shape(blob([(48, 120), (56, 88), (100, 74), (144, 88), (152, 120), (138, 140), (100, 144), (62, 140)], 0.9), SHROUD, shadow=0,
                decor=hi(66, 94, 14, 8, 0.15))
        S.shape(HEAD, BONE, shadow=5, decor=hi(80, 68, 16, 10, 0.3))
        # the hood over the back of the skull, its ragged edge across the brow
        S.shape("M 52 100 C 50 66 70 46 100 46 C 130 46 150 66 148 100 C 140 98 134 90 126 92 C 118 94 112 88 100 90 "
                "C 88 88 82 94 74 92 C 66 90 60 98 52 100 Z", SHROUD, shadow=3, decor=hi(80, 62, 14, 6, 0.18))
        for x in (82, 118):   # the Hollow's big sockets
            S.raw(f'<path d="{blob([(x - 13, 112), (x, 104), (x + 13, 112), (x + 11, 126), (x, 130), (x - 11, 126)], 0.9)}" fill="{INK_EYE}"/>')
        S.raw(f'<path d="M 100 128 L 105 138 L 95 138 Z" fill="{INK_EYE}"/>')
        S.raw(f'<path d="{ell(100, 147, 12, 6)}" fill="{INK_EYE}"/>')
        for x in (91, 97, 103, 109):
            S.raw(f'<path d="{rr(x, 142.5, 4.6, 5, 1.5)}" fill="#FFFDF4"/>')
        S.group("arm-l", (60, 112), "bony hand")
        S.shape(taper([(60, 104), (48, 124), (50, 144)], 22, 14, 0.8), SHROUD, shadow=0)
        S.shape(rr(50, 152, 18, 20, 7), BONE, shadow=3, side=False)
        for dx in (-5.5, 0, 5.5):
            S.shape(rr(50 + dx, 166, 4.6, 12, 2.3), BONE, shadow=1, side=False)
    return save19("banshee", f"banshee-{opt}", S)


BUILD.update({"banshee": (banshee, "abc")})
