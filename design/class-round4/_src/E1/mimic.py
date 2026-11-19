"""Mimic: the game's chest, its lid parted along the gold band into a toothy mouth, tongue attached inside.
python mimic.py"""
from lib import *

WOOD = ("#B8784A", "#8A5430")
LID = ("#C4844E", "#94603A")
GOLD = ("#FFE08A", "#D9A23A")


def mimic():
    S = Sprite('MIMIC (round 4): the game\'s own chest from above (rounded brown box, a gold band across the middle, a '
               'gold lock), so it looks like the real chest until it bites. The band is where it opens: the lid and the '
               'box part along it into a wide mouth with teeth on both lips, two yellow eyes glowing inside, and a fat '
               'tongue that grows out of the back of the mouth and lolls forward over the front of the box. Parts: '
               '#body = chest, mouth, teeth, eyes; #arm-r = the tongue (pivot at its root inside the mouth, so it can '
               'lash; drawn after #body so its root shows in the mouth). Facing = DOWN (+y), centre (100,100).')
    S.group("body")
    # box (front half) and lid (back half): one rounded block, the lid a touch lighter
    S.shape(rr(100, 102, 156, 116, 22), S.lg(*WOOD, x2=0.6, y2=1), shadow=False, shade=0.3,
            decor=[f'<path d="{rr(100, 70, 156, 60, 22)}" fill="{LID[0]}" opacity="0.6"/>',
                   f'<path d="{" ".join(rr(x, 102, 6, 116, 3) for x in (66, 100, 134))}" fill="#7A4628" opacity="0.18"/>'])
    # gold corner caps, as on the game chest's band ends
    # the mouth: a lens across the middle where the gold band was
    mouth = blob([(34, 100, 'c'), (60, 88), (100, 84), (140, 88), (166, 100, 'c'), (140, 124), (100, 132), (60, 124)], 0.9)
    lips = blob([(24, 100, 'c'), (60, 80), (100, 76), (140, 80), (176, 100, 'c'), (140, 132), (100, 140), (60, 132)], 0.9)
    S.shape(lips, S.lg(*GOLD, x2=0.4, y2=1), sh=4, shade=0.25, hi=0.3)
    S.shape(mouth, S.lg("#5A1E2A", "#2A0E16", x2=0.2, y2=1), shadow=False, shade=0)
    # teeth on both lips
    up = [(44, 92), (62, 88), (80, 86), (100, 85), (120, 86), (138, 88), (156, 92)]
    dn = [(52, 117), (72, 122), (92, 125), (110, 125), (130, 122), (148, 117)]
    S.flat(" ".join(poly([(x - 6, y - 2), (x + 6, y - 2), (x, y + 10)]) for x, y in up) + " " +
           " ".join(poly([(x - 6, y + 2), (x + 6, y + 2), (x, y - 10)]) for x, y in dn), "#FFF6E2")
    # eyes glowing in the dark corners of the mouth
    for x in (52, 148):
        S.flat(ell(x, 104, 7, 5.5), "#FFD84A")
        S.flat(ell(x, 104, 2, 5), INK)
    # the lock, on the lid's lip at the middle (the game chest's gold lock)
    S.shape(rr(100, 68, 22, 22, 6), S.lg(*GOLD), sh=4, shade=0.25, hi=0.35)
    S.flat(f"{circ(100, 65, 3.6)} {poly([(97, 66), (103, 66), (101.5, 74), (98.5, 74)])}", "#6A4A1A")
    S.group("arm-r", (100, 112))
    # tongue: a wide root deep in the mouth, narrowing as it lolls forward over the box front, a curl at the tip
    tongue = stroke_path([(100, 104), (102, 122), (98, 142), (104, 160), (114, 172)], 34, 20, 0.9)
    S.shape(tongue, S.lg("#F27A9A", "#C8466A", x2=0.6, y2=1), shadow=True, sh=4, shade=0.25, hi=0.25,
            decor=[f'<path d="{stroke_path([(100, 112), (101, 128), (99, 146), (104, 160)], 3, 2)}" fill="#B03A5A" '
                   'opacity="0.5"/>'])
    return S


if __name__ == "__main__":
    render([(mimic().write("mimic.svg"), "Mimic")])
