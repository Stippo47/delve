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


# round 10 (art-round9 deck, on the Goblin Chieftain: "Are those feathers in hair? Fix teeth. Better weapons and dual
# wielding. More and better war paint. 1 clipped ear"): chieftain9(r10=True) is chieftain9() with only these changes, each
# marked CHANGE10 where its step is:
#   feathers   the three small white tabs behind the crest are two big eagle feathers, plainly feathers: a quill down the
#              middle, a notched vane, a dark tip, tied to the back of the crest with a bone bead
#   teeth      the two slivers at the ends of the grin are two proper lower fangs standing up from the corners of the mouth
#   weapons    two jagged war choppers, one in each fist (the cleaver and the free fist are gone); the spears stay on its back
#   war paint  a proper red handprint on the left shoulder and three chevrons on the right, two slashes on each cheek, a
#              stripe down the nose, bands on the ears
#   ear        the left ear's tip is cut off
def paint10():
    """CHANGE10 war paint on the shoulders: a proper handprint (palm, four fingers, a thumb) on the left, three chevrons on
    the right."""
    hand = (f'<g transform="translate(-4 13) rotate(-18 46 108)" fill="{PAINT}" opacity="0.9"><ellipse cx="46" cy="112" rx="11" ry="10"/>'
            + "".join(f'<rect x="{x}" y="{y}" width="5.5" height="15" rx="2.75" transform="rotate({a} {x + 2.75} {y + 15})"/>'
                      for x, y, a in ((36, 88, -16), (42, 84, -5), (48.5, 84, 6), (54.5, 88, 18)))
            + '<rect x="58" y="104" width="13" height="5.5" rx="2.75" transform="rotate(-24 58 107)"/></g>')
    chev = "".join(f'<path d="M {142 + i * 2} {92 + i * 11} L {158 + i * 2} {100 + i * 11} L {176 + i * 2} {92 + i * 11}" fill="none" stroke="{PAINT}" '
                   f'stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>' for i in range(3))
    return hand + chev


# round 11 (art-round10 deck, the Goblin Chieftain: "Have them hold hands forwards more. Flip blades direction"):
# chieftain9(r10=True, r11=True): both fists and their choppers 12 units further forward; each chopper mirrored about its
# haft, so the cutting edges face in. Nothing else.
def chopper(S, x, y, a, skin, side):
    """A goblin war chopper in a fist: a red-wrapped haft, a broad jagged blade with a notch in its back and a hole, the
    edge on the outer side (side = +1 right hand, -1 left)."""
    tf = frame(x, y, a) + ("" if side > 0 else " scale(-1 1)")
    S.shape(rr(0, -8, 11, 40, 4.5), S.lg("#6A3E26", "#40241A"), tf=tf, shadow=False,
            decor=[f'<path d="M -7 -20 L 7 -17 L 7 -12 L -7 -15 Z M -7 -8 L 7 -5 L 7 0 L -7 -3 Z" fill="{PAINT}" transform="{tf}"/>'])
    blade = blob([(-9, 10, 'c'), (10, 10, 'c'), (28, 18), (32, 44), (26, 64), (12, 80, 'c'), (-6, 74), (-12, 58, 'c'), (-5, 48),
                  (-13, 38, 'c'), (-10, 24)], 0.7)
    S.shape(blade, S.lg(*IRON, x2=1, y2=0.25), tf=tf, shadow=False, shade=0.28,
            decor=[f'<path d="M 27 20 C 36 36 34 58 14 79" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity="0.75" transform="{tf}"/>',
                   f'<circle cx="4" cy="24" r="4.5" fill="#6E7584" transform="{tf}"/>'])


def war_feather(S, a, L=46, w=11):
    """A big eagle feather tied to the back of the crest, lying back at angle a."""
    tf = frame(100, 40, 180 + a)
    vane = blob([(0, 0), (w * 0.8, L * 0.2), (w, L * 0.5), (w * 0.7, L * 0.72, 'c'), (w * 0.3, L * 0.68), (w * 0.5, L * 0.9), (0, L, 'c'),
                 (-w * 0.6, L * 0.86), (-w, L * 0.5), (-w * 0.8, L * 0.2)], 0.8)
    S.shape(vane, S.lg("#FFFFFF", "#D8D0C0"), tf=tf, shadow=False, shade=0.15,
            decor=[f'<path d="M {-w - 2} {L * 0.7} L {w + 2} {L * 0.62} L {w + 2} {L + 4} L {-w - 2} {L + 4} Z" fill="#3E3028" transform="{tf}"/>',
                   f'<path d="M 0 2 L 0 {L - 4}" stroke="#A8987A" stroke-width="2.5" stroke-linecap="round" transform="{tf}"/>'])


def chieftain9(r10=False, r11=False):
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
    if r10:   # CHANGE10 weapons: a war chopper in each fist (both before #body, under the shoulders)
        S.comment = S.comment.replace("(round 9)", "(round 10: two big feathers, lower fangs, a war chopper in each fist, more war paint, one clipped ear; round 9)")
        fw = 12 if r11 else 0     # CHANGE11: hands forward
        flip = -1 if r11 else 1   # CHANGE11: the blades' direction flipped
        if r11:
            S.comment = S.comment.replace("(round 10:", "(round 11: the hands held further forward, the choppers' edges turned in; round 10:")
        chopper(S, 166, 110 + fw, 12, skin, flip)
        gfist(S, 165, 124 + fw, 12, skin, w=30, h=32, plain=True)
        S.group("arm-l", (44, 114))
        chopper(S, 34, 110 + fw, -12, skin, -flip)
        gfist(S, 35, 124 + fw, -12, skin, w=30, h=32, knuckle=-1, plain=True)
    else:
        cleaver(S, 166, 134, 12)
        gfist(S, 165, 124, 12, skin, w=30, h=32, plain=True)
    S.group("body")
    S.shape(sym([(100, 66), (148, 70), (182, 92), (188, 118), (170, 140), (100, 148)]), S.lg(lt(skin, 0.06), dk(skin, 0.3)),
            shade=0.3,
            # CHANGE war paint: a red handprint on the left shoulder, two stripes on the right
            decor=[paint10()] if r10 else
                  [f'<path d="{blob([(34, 102), (46, 96), (56, 104), (52, 118), (38, 120)], 0.9)}" fill="{PAINT}" opacity="0.85"/>'
                   + "".join(f'<path d="{rr(x, 92, 5, 14, 2.5)}" transform="rotate({a} {x} 92)" fill="{PAINT}" opacity="0.85"/>'
                             for x, a in ((32, -30), (40, -14), (48, 0), (56, 14)))
                   + f'<path d="M 150 96 L 176 104 M 146 110 L 174 118" stroke="{PAINT}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>'])
    # CHANGE ears: the goblin's huge ears swept out and back, with the darker inner ear (greenskins.goblin)
    if r10:   # CHANGE10 ear: the left ear's tip cut off; paint bands on both
        full, inner = [(138, 86), (168, 74), (204, 58), (184, 90), (144, 112)], [(146, 92), (168, 82), (188, 70), (174, 90), (150, 104)]
        clip, cin = [(138, 86), (160, 76), (176, 70, 'c'), (172, 94, 'c'), (144, 112)], [(146, 92), (160, 85), (170, 81), (168, 92), (150, 104)]
        for pts, inn, m in ((full, inner, False), (clip, cin, True)):
            S.shape(blob(mx(pts) if m else pts, 0.9), lgs(S, skin), shadow=False, shade=0.2)
            S.flat(blob(mx(inn) if m else inn, 0.9), dk(skin, 0.25), op=0.55)
        S.raw(f'<path d="M 168 78 L 174 92 M 180 72 L 186 84" stroke="{PAINT}" stroke-width="4.5" stroke-linecap="round" opacity="0.9"/>'
              f'<path d="M 32 78 L 27 91" stroke="{PAINT}" stroke-width="4.5" stroke-linecap="round" opacity="0.9"/>')
    else:
        ears(S, skin, [(138, 86), (168, 74), (204, 58), (184, 90), (144, 112)], [(146, 92), (168, 82), (188, 70), (174, 90), (150, 104)])
    bald_head(S, skin)
    if r10:   # CHANGE10 war paint: two slashes on each cheek
        S.raw("".join(f'<path d="M {100 + s * 26} 112 L {100 + s * 40} 124 M {100 + s * 22} 122 L {100 + s * 36} 134" stroke="{PAINT}" '
                      f'stroke-width="5" stroke-linecap="round" opacity="0.9"/>' for s in (-1, 1)))
    # CHANGE headdress: a band of bone across the brow, under the crest
    band = "M 54 96 C 62 76 82 66 100 66 C 118 66 138 76 146 96 C 138 84 120 76 100 76 C 80 76 62 84 54 96 Z"
    S.shape(band, S.lg(*BONE), sh=2, op=0.25, shade=0.15,
            decor=[f'<path d="M {x} {y - 5} L {x} {y + 5}" stroke="#A8987A" stroke-width="2.5"/>' for x, y in ((70, 82), (86, 74), (100, 71), (114, 74), (130, 82))])
    # CHANGE headdress: three feathers at the back of the crest, fanned back
    if r10:   # CHANGE10 feathers: two big eagle feathers, plainly feathers
        for a in (-34, 34):
            war_feather(S, a)
        S.shape(circ(100, 40, 7.5), S.lg(*BONE), sh=2, op=0.25, shade=0.15)
    for a, L in (() if r10 else ((-26, 34), (0, 40), (26, 34))):
        tf = frame(100, 34, 180 + a)
        S.shape(blob([(0, -4), (7, 10), (8, 30), (0, L, 'c'), (-8, 30), (-7, 10)], 0.8), S.lg("#FFFFFF", "#D8D0C0"), tf=tf,
                shadow=False, shade=0.15, decor=[f'<path d="M -9 {L - 9} L 9 {L - 9} L 0 {L + 2} Z" transform="{tf}" fill="#5A4636"/>'])
    crest = sym([(100, 12), (108, 26), (116, 30, 'c'), (112, 44), (120, 50, 'c'), (114, 62), (121, 70, 'c'),
                 (114, 80), (119, 90, 'c'), (108, 94), (100, 100)], 0.85)
    S.shape(crest, S.lg("#D8583A", "#8E2A22"), sh=3, op=0.3, shade=0.25)
    # CHANGE mouth: the goblin's wide grin, two small fangs up at its ends (no underbite, no big tusks)
    S.raw(f'<path d="M78 138 Q100 152 122 138" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3.4" stroke-linecap="round"/>')
    if r10:   # CHANGE10 teeth: two proper lower fangs standing up from the corners of the mouth, their roots on the line
        fang = [(112, 144.5), (123, 139.5), (123, 131), (121.5, 123, 'c'), (115, 131)]
        for pts in (fang, mx(fang)):
            S.shape(blob(pts, 0.8), S.lg(*BONE), shadow=False, shade=0.12)
        S.raw(f'<path d="M78 138 Q100 152 122 138" fill="none" stroke="{dk(skin, 0.55)}" stroke-width="3.4" stroke-linecap="round"/>')
    for x, s in (() if r10 else ((82, -1), (118, 1))):
        S.shape(blob([(x - 3.5, 141), (x + 3.5, 141), (x + s * 1.5, 130, 'c')], 0.8), S.lg(*BONE), shadow=False, shade=0.1)
    # CHANGE nose: the goblin's long hooked nose (greenskins.goblin), over the grin
    S.shape(blob([(92, 108), (108, 108), (110, 132), (104, 156), (98, 168, 'c'), (94, 150), (90, 128)], 0.9),
            S.lg(lt(skin, 0.05), dk(skin, 0.25)), sh=4, op=0.3, shade=0.25,
            # CHANGE10 war paint: a stripe down the nose
            decor=[f'<path d="M 100 110 L 99 150" stroke="{PAINT}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>'] if r10 else None)
    if r10:
        return S
    S.group("arm-l", (44, 114))
    gfist(S, 36, 144, -8, skin, w=30, h=32, knuckle=-1, plain=True)
    return S


if __name__ == "__main__":
    print(chieftain9().write("boss-goblin-chieftain.svg").relative_to(OUT.parent).as_posix())
