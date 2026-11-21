"""Round 9: the Goblin Chieftain, built on the round-8 chieftain (greenskins.chieftain8: the round-7 "Troll A, mohawk",
which the designer said to keep "but not as a troll"), with the same E3 library. check9.py checks the copied
greenskins.py still gives that file byte for byte; chieftain9() below is troll7("a")'s drawing, step for step, with
each change made where its step is and named in a CHANGE comment, so what was changed is plain:
  skin       the trolls' blue-teal -> the goblins' yellow-lime, a shade deeper (the Warren's goblins, greenskins.SKIN)
  nose       the troll's broad round nose -> the goblin's long hooked nose (greenskins.goblin)
  mouth      the troll's heavy underbite and two big tusks -> the goblin's wide grin, two small fangs up at its ends
  ears       troll7's long ears -> the goblin's huge ears swept out and back, with their darker inner ear
  headdress  the red crest is kept (it is what the designer liked); a band of bone across the brow and
             three white feathers with brown tips at the back of the crest make it a bone-and-feather headdress
  war paint  a red handprint on the left shoulder, two red stripes on the right
  weapon     the knotted log club -> a cleaver (right hand)
  spears     a bundle of three spears tied across its back, points up behind the right shoulder (#back)
The hunched shoulders, the left fist and the sizes are troll7("a")'s.
python bosses9e.py   -> ../../enemies/boss-goblin-chieftain.svg   (paths relative to this file)"""
import math
from greenskins import *

SKIN_CHIEF = "#B2C84E"   # CHANGE skin: the goblins' yellow-lime (#C2D65A), a shade deeper for the chief
PAINT = "#C8302A"


def spear_bundle(S):
    """Three spears tied together, lying across the back from the left hip up past the right shoulder, points out."""
    for i, (dx, dy, a) in enumerate(((-6, 4, 206), (0, 0, 216), (6, -4, 226))):
        tf = frame(70 + dx, 128 + dy, a)       # the frame's +y runs up and back to the right
        S.shape(rr(0, 40, 8, 112, 4), S.lg("#A87A4A", "#6E4A2A", x2=1, y2=0), tf=tf, shadow=False, shade=0.2)
        S.shape(blob([(-8, 94), (8, 94), (9, 106), (0, 124, 'c'), (-9, 106)], 0.8), S.lg(*IRON, x2=1, y2=0.2), tf=tf, shadow=False, shade=0.2)
    S.shape(rr(0, 0, 30, 9, 4), S.lg("#8E6A44", "#5E4028"), tf=frame(84, 106, 214), sh=2, op=0.25, shade=0.15)


def chieftain9():
    skin = SKIN_CHIEF
    S = Sprite('THE GOBLIN CHIEFTAIN (round 9): the round-8 chieftain (the round-7 Troll A, mohawk, which the designer '
               'said to keep "but not as a troll") made the goblins\' chief: the goblins\' yellow-lime skin, their long '
               'hooked nose, wide grin with two small fangs and huge swept-back ears, no eyes; the ragged red war crest '
               'kept, now with a band of bone across the brow and three white brown-tipped feathers at the '
               'back of the crest; red war paint (a handprint on the left shoulder, stripes on the right); a cleaver in the right fist, a bundle of three spears tied across its back (#back, sways), '
               'the left fist free. Hunched shoulders and sizes as before. Parts: #back (the spears), #arm-r (cleaver '
               '+ fist), #body, #arm-l (free fist). Front = DOWN (+y).')
    # CHANGE spears: a bundle of three spears on its back (#back, before everything, so the shoulders cover the tie)
    S.group("back", (100, 100))
    spear_bundle(S)
    # CHANGE weapon: the club is now a cleaver (the fist as it was)
    S.group("arm-r", (156, 114))
    cleaver(S, 166, 134, 12)
    gfist(S, 165, 124, 12, skin, w=30, h=32, plain=True)
    S.group("body")
    S.shape(sym([(100, 66), (148, 70), (182, 92), (188, 118), (170, 140), (100, 148)]), S.lg(lt(skin, 0.06), dk(skin, 0.3)),
            shade=0.3,
            # CHANGE war paint: a red handprint on the left shoulder, two stripes on the right
            decor=[f'<path d="{blob([(34, 102), (46, 96), (56, 104), (52, 118), (38, 120)], 0.9)}" fill="{PAINT}" opacity="0.85"/>'
                   + "".join(f'<path d="{rr(x, 92, 5, 14, 2.5)}" transform="rotate({a} {x} 92)" fill="{PAINT}" opacity="0.85"/>'
                             for x, a in ((32, -30), (40, -14), (48, 0), (56, 14)))
                   + f'<path d="M 150 96 L 176 104 M 146 110 L 174 118" stroke="{PAINT}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>'])
    # CHANGE ears: the goblin's huge ears swept out and back, with the darker inner ear (greenskins.goblin)
    ears(S, skin, [(138, 86), (168, 74), (204, 58), (184, 90), (144, 112)], [(146, 92), (168, 82), (188, 70), (174, 90), (150, 104)])
    bald_head(S, skin)
    # CHANGE headdress: a band of bone across the brow, under the crest
    band = "M 54 96 C 62 76 82 66 100 66 C 118 66 138 76 146 96 C 138 84 120 76 100 76 C 80 76 62 84 54 96 Z"
    S.shape(band, S.lg(*BONE), sh=2, op=0.25, shade=0.15,
            decor=[f'<path d="M {x} {y - 5} L {x} {y + 5}" stroke="#A8987A" stroke-width="2.5"/>' for x, y in ((70, 82), (86, 74), (100, 71), (114, 74), (130, 82))])
    # CHANGE headdress: three feathers at the back of the crest, fanned back
    for a, L in ((-26, 34), (0, 40), (26, 34)):
        tf = frame(100, 34, 180 + a)
        S.shape(blob([(0, -4), (7, 10), (8, 30), (0, L, 'c'), (-8, 30), (-7, 10)], 0.8), S.lg("#FFFFFF", "#D8D0C0"), tf=tf,
                shadow=False, shade=0.15, decor=[f'<path d="M -9 {L - 9} L 9 {L - 9} L 0 {L + 2} Z" transform="{tf}" fill="#5A4636"/>'])
    crest = sym([(100, 12), (108, 26), (116, 30, 'c'), (112, 44), (120, 50, 'c'), (114, 62), (121, 70, 'c'),
                 (114, 80), (119, 90, 'c'), (108, 94), (100, 100)], 0.85)
    S.shape(crest, S.lg("#D8583A", "#8E2A22"), sh=3, op=0.3, shade=0.25)
    # CHANGE mouth: the goblin's wide grin, two small fangs up at its ends (no underbite, no big tusks)
    S.raw(f'<path d="M78 138 Q100 152 122 138" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3.4" stroke-linecap="round"/>')
    for x, s in ((82, -1), (118, 1)):
        S.shape(blob([(x - 3.5, 141), (x + 3.5, 141), (x + s * 1.5, 130, 'c')], 0.8), S.lg(*BONE), shadow=False, shade=0.1)
    # CHANGE nose: the goblin's long hooked nose (greenskins.goblin), over the grin
    S.shape(blob([(92, 108), (108, 108), (110, 132), (104, 156), (98, 168, 'c'), (94, 150), (90, 128)], 0.9),
            S.lg(lt(skin, 0.05), dk(skin, 0.25)), sh=4, op=0.3, shade=0.25)
    S.group("arm-l", (44, 114))
    gfist(S, 36, 144, -8, skin, w=30, h=32, knuckle=-1, plain=True)
    return S


if __name__ == "__main__":
    print(chieftain9().write("boss-goblin-chieftain.svg").relative_to(OUT.parent).as_posix())
