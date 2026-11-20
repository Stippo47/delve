"""H2 heroes (holy, support, odd jobs). Run: python gen.py [name ...]  -> ../../heroes-support/support-<name>.svg"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from lib import *

OUT = pathlib.Path(__file__).resolve().parents[2] / "heroes-support"
OUT.mkdir(parents=True, exist_ok=True)
PL, PR = (46, 108), (154, 108)
GOLD, WOOD = "#F2B53A", "#B07A46"
LAYOUT = ("Parts in draw order inside #sprite; the outline comes from the #outline filter. Facing = DOWN (+y), "
          "centre (100,100).")


def save(name, S):
    p = OUT / f"support-{name}.svg"
    p.write_text(S.svg(), encoding="utf-8")
    return p


# ------------------------------------------------------------------ 1. Cleric
def cleric():
    S = Sprite("SUPPORT Cleric (healer): white hood with a gold rim, sky-blue mantle, a gold sun-halo standing up behind "
               "the head, a short sun sceptre in the right hand (arm-r, drawn before #body so it runs under the shoulder "
               "and only the fist shows), left hand free. " + LAYOUT)
    S.group("back", note="sun halo behind the head")
    S.shape(blob(star(100, 68, 70, 55, 12), 0.25), GOLD, shadow=0,
            decor=f'<path d="{circ(100, 68, 50)}" fill="{light(GOLD, 1.15)}" opacity="0.6"/>')
    S.group("arm-r", PR, "sun sceptre")
    T = frame(150, 124, 18)
    S.shape(rr(0, 20, 9, 66, 4.5), WOOD, T=T, shadow=0)
    S.shape(rr(0, 45, 15, 7, 3), GOLD, T=T, shadow=2)
    S.shape(blob(star(0, 60, 17, 12, 8), 0.4), GOLD, T=T, shadow=3)
    S.shape(circ(0, 60, 8.5), "#FFF1B8", T=T, shadow=0, side=False)
    S.fist(0, 13, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#7DB4E6")
    S.shape("M 40 104 C 46 92 60 86 76 86 L 84 140 C 64 140 46 132 40 120 Z", "#F3EEE2", shadow=3)
    S.shape("M 160 104 C 154 92 140 86 124 86 L 116 140 C 136 140 154 132 160 120 Z", "#F3EEE2", shadow=3)
    S.head(ears=False)
    hood = ("M 46 128 C 38 82 60 40 100 40 C 140 40 162 82 154 128 C 151 140 139 142 135 130 C 129 108 117 98 100 98 "
            "C 83 98 71 108 65 130 C 61 142 49 140 46 128 Z")
    rim = "M 65 130 C 71 108 83 98 100 98 C 117 98 129 108 135 130"
    S.shape(hood, "#F5F1E6", shadow=4,
            decor=f'<path d="{rim}" fill="none" stroke="{GOLD}" stroke-width="13"/>'
                  f'<path d="M 100 40 L 100 96" stroke="#D9D2C2" stroke-width="5" opacity="0.6"/>')
    S.mouth()
    S.group("arm-l", PL, "free hand")
    S.fist(54, 146, -8)
    return save("cleric", S)


# ------------------------------------------------------------------ 2. Templar
PATTEE = "M 92 -2 H 108 L 104 22 L 128 18 V 34 L 104 30 L 108 54 H 92 L 96 30 L 72 34 V 18 L 96 22 Z"


def pattee(cx, cy, k):
    """Cross pattee centred on (cx, cy), scale k (base is 56 across)."""
    return f'<path d="{PATTEE}" transform="translate({f(cx)} {f(cy)}) scale({k}) translate(-100 -26)" fill="#C8352E"/>'


def templar():
    S = Sprite("SUPPORT Templar knight: flat-topped great helm with a cross-shaped visor slit, white surcoat over mail, "
               "white cape with a red cross pattee. A two-handed greatsword held in the middle, in front, across the "
               "body: both fists on the grip, blade forward-left; it is all in arm-r (arm-l left out), drawn before "
               "#body. " + LAYOUT)
    S.group("back", (100, 86), "cape")
    cape = blob([(100, 10), (134, 12), (158, 32), (164, 70), (150, 100), (100, 104), (50, 100), (36, 70), (42, 32), (66, 12)], 0.9)
    S.shape(cape, "#F1EEE8", shadow=0, decor=pattee(100, 38, 1.05))
    S.group("arm-r", PR, "greatsword, two hands")
    T = frame(147, 157, 62)
    S.shape(circ(0, -21, 7.5), "#C9962E", T=T, shadow=0)
    S.shape(rr(0, 6, 10, 46, 4), "#6B4A33", T=T, shadow=0)
    S.shape(poly([(-10, 40), (10, 40), (9, 85), (0, 96), (-9, 85)]), "#D8DDE5", T=T, shadow=3,
            decor='<rect x="-1.4" y="42" width="2.8" height="48" fill="#F4F6FA" opacity="0.6"/>')
    S.shape(rr(0, 35, 52, 10, 5), "#C9962E", T=T, shadow=2)
    S.fist(0, 0, T=T)
    S.fist(0, 21, T=T)
    S.group("body")
    S.shape(SHOULDERS, "#8E96A4")
    S.shape("M 44 82 C 70 76 130 76 156 82 L 150 136 C 130 140 70 140 50 136 Z", "#F2EFE9", shadow=3)
    helm = blob([(100, 46), (136, 50), (150, 80), (150, 120), (138, 150), (100, 156), (62, 150), (50, 120), (50, 80), (64, 50)], 0.8)
    S.shape(helm, "#C3CAD4", shadow=5,
            decor='<path d="M 40 70 C 70 64 130 64 160 70 V 80 C 130 74 70 74 40 80 Z" fill="#E8B54A"/>'
                  '<path d="M 40 122 C 70 116 130 116 160 122 V 160 H 40 Z" fill="#8F98A8" opacity="0.5"/>'
                  '<path d="M 64 128 C 80 125 120 125 136 128 V 134 C 120 131 104 131 104 131 V 150 H 96 V 131 C 96 131 80 131 64 134 Z" fill="#2B2230"/>'
                  '<path d="M 100 46 V 120" stroke="#E8ECF1" stroke-width="5" opacity="0.5"/>')
    return save("templar", S)


import more
DESIGNS = {"cleric": cleric, "templar": templar}
DESIGNS.update({k: (lambda fn: (lambda: fn(save)))(v) for k, v in more.ALL.items()})

if __name__ == "__main__":
    names = sys.argv[1:] or list(DESIGNS)
    for n in names:
        print(DESIGNS[n]())
