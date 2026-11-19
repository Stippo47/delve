"""Banshee, two new takes on the base body (round head token, 160-wide shoulders, chunky hands). python banshee.py [a b]"""
from lib import *

BASE_HEAD = ("M 100.0 47.8 C 129.6 47.8 147.8 68.7 147.8 98.3 C 147.8 122.6 136.5 140.0 120.9 147.8 C 113.9 151.3 "
             "107.0 153.1 100.0 153.1 C 93.0 153.1 86.1 151.3 79.1 147.8 C 63.5 140.0 52.1 122.6 52.1 98.3 C 52.1 68.7 "
             "70.4 47.8 100.0 47.8 Z")
SKULL = ("M 100 52 C 121 52 137 67 138 91 C 139 106 138 115 140 122 C 142 129 138 134 133 136 C 130 145 123 154 113 "
         "160 C 108 163 104 165 100 165 C 96 165 92 163 87 160 C 77 154 70 145 67 136 C 62 134 58 129 60 122 C 62 115 "
         "61 106 62 91 C 63 67 79 52 100 52 Z")


def hand(S, cx, cy, fill, a=0):
    S.shape(rr(0, 0, 24, 22, 8), fill, tf=frame(cx, cy, a), sh=3)


def banshee_a():
    S = Sprite('BANSHEE take A "wailer" (round 4): a drowned-looking spirit woman on the base body. Cold blue-white skin, '
               'long silver hair falling down her back and streaming behind her into one long tail of hair (no legs), '
               'two dark hollow eyes and a wide-open wailing mouth, a ragged dark-teal shawl over the shoulders, pale '
               'hands reaching forward. Parts: #back = the hair tail (pivot at the head, sways), #body = shawl, head, '
               'hair, face, #arm-l, #arm-r = the hands (pivot at the shoulders). Facing = DOWN (+y), centre (100,100).')
    S.group("back", (100, 70))
    S.shape(stroke_path([(100, 90), (96, 60), (104, 34), (96, 14), (84, 2)], 84, 14, 0.9), S.lg("#C8C0E4", "#6E6698", x2=0.6, y2=1),
            shadow=False, shade=0.3,
            decor=[f'<path d="{stroke_path([(108, 80), (112, 52), (106, 26)], 10, 4)}" fill="#E4E0F4" opacity="0.5"/>'])
    S.group("body")
    shawl = blob([(100, 74), (140, 76), (170, 92), (176, 112), (170, 132), (160, 128, 'c'), (152, 140), (140, 132, 'c'),
                  (128, 142), (100, 142), (72, 142), (60, 132, 'c'), (48, 140), (40, 128, 'c'), (30, 132), (24, 112),
                  (30, 92), (60, 76)], 0.9)
    S.shape(shawl, S.lg("#3E8A8E", "#1C4248", x2=0.6, y2=1), shade=0.3)
    # hair round the head (the back of the head and two long locks beside the face)
    hair = blob([(100, 40), (130, 46), (150, 70), (154, 104), (150, 136), (142, 154), (132, 140), (128, 112), (100, 104),
                 (72, 112), (68, 140), (58, 154), (50, 136), (46, 104), (50, 70), (70, 46)], 0.9)
    S.shape(hair, S.lg("#D4CEEC", "#7A72A6", x2=0.6, y2=1), sh=5, shade=0.3, hi=0.35)
    face = blob([(100, 78), (126, 84), (138, 106), (134, 132), (118, 150), (100, 155), (82, 150), (66, 132), (62, 106),
                 (74, 84)], 1.0)
    S.shape(face, S.lg("#F0F8FC", "#A8C4D4", x2=0.6, y2=1), sh=5, shade=0.25)
    # hollow eyes and a wailing mouth
    S.flat(f"{ell(86, 114, 7.5, 9)} {ell(114, 114, 7.5, 9)}", "#2B2230")
    S.flat(f"{circ(86, 116, 2.4)} {circ(114, 116, 2.4)}", "#9AF0E8")
    S.flat(ell(100, 140, 7, 9), "#2B2230")
    # a centre parting in the hair
    S.flat(stroke_path([(100, 44), (100, 72)], 3, 1), "#5E5688", op=0.8)
    S.group("arm-l", (44, 108))
    hand(S, 44, 150, S.lg("#E4EEF6", "#A8BED0"), -8)
    S.group("arm-r", (156, 108))
    hand(S, 156, 150, S.lg("#D4E2EE", "#98B0C4"), 8)
    return S


def banshee_b():
    S = Sprite('BANSHEE take B "veiled" (round 4): keeps the Hollow\'s tall skull (as the designer asked in round 3) on '
               'the base body, under a long black mourning veil that covers the dome and falls behind her into a '
               'trailing train, a pale ghost-glow round the shoulders, glowing teal pinpoints in the deep sockets, bony '
               'hands reaching forward. Parts: #back = the veil train (pivot at the head), #body = shoulders, skull, '
               'veil, #arm-l, #arm-r = the hands (pivot at the shoulders). Facing = DOWN (+y), centre (100,100).')
    S.group("back", (100, 70))
    S.shape(blob([(64, 96), (60, 60), (70, 30), (86, 12), (100, 2, 'c'), (114, 12), (130, 30), (140, 60), (136, 96)],
                 0.9), S.lg("#5A4E6E", "#2A2238", x2=0.6, y2=1), shadow=False, shade=0.3,
            decor=[f'<path d="{blob([(96, 90), (92, 50), (100, 10), (104, 50), (104, 90)], 0.9)}" fill="#7A6C92" opacity="0.4"/>'])
    S.group("body")
    shoulders = "M28 108 C28 84 56 78 100 78 C144 78 172 84 172 108 C172 132 144 140 100 140 C56 140 28 132 28 108 Z"
    S.shape(shoulders, S.lg("#D8F0EC", "#88B4B4", x2=0.6, y2=1), shade=0.35,
            decor=[f'<path d="{ell(100, 112, 50, 26)}" fill="#F4FFFC" opacity="0.4"/>'])
    S.shape(SKULL, S.lg("#FCF6E4", "#D6C096", x2=0.6, y2=1), sh=5, shade=0.3, hi=0.3)
    # deep sockets with glowing pinpoints, nose hole, teeth row
    S.flat(f"{ell(85, 116, 11, 13)} {ell(115, 116, 11, 13)}", "#2B2230")
    S.flat(f"{circ(85, 118, 3)} {circ(115, 118, 3)}", "#7AF0E0")
    S.flat(poly([(100, 128), (105, 138), (95, 138)]), "#3A2E34")
    S.flat(" ".join(rr(x, 150, 5.5, 8, 2) for x in (91, 97.5, 104, 110) if True), "#4A3A3C", op=0.55)
    # veil over the dome, falling down both sides of the skull
    veil = blob([(100, 40), (128, 46), (146, 66), (152, 100), (150, 132), (144, 146), (136, 128), (132, 98), (122, 80),
                 (100, 74), (78, 80), (68, 98), (64, 128), (56, 146), (50, 132), (48, 100), (54, 66), (72, 46)], 0.9)
    S.shape(veil, S.lg("#5A4E6E", "#241C30", x2=0.6, y2=1), sh=5, shade=0.3, hi=0.25)
    bone = S.lg("#F7EDD3", "#C8B48C")
    S.group("arm-l", (44, 108))
    hand(S, 44, 150, bone, -8)
    S.shape(" ".join(rr(36 + i * 8, 164, 5, 14, 2.5) for i in range(3)), bone, tf=f"rotate(-8 44 150)", sh=2)
    S.group("arm-r", (156, 108))
    hand(S, 156, 150, bone, 8)
    S.shape(" ".join(rr(148 + i * 8, 164, 5, 14, 2.5) for i in range(3)), bone, tf=f"rotate(8 156 150)", sh=2)
    return S


if __name__ == "__main__":
    want = sys.argv[1:] or ["a", "b"]
    T = {"a": (banshee_a, "banshee-a-wailer.svg", "Banshee A wailer"),
         "b": (banshee_b, "banshee-b-veiled.svg", "Banshee B veiled")}
    render([(T[t][0]().write(T[t][1]), T[t][2]) for t in want])
