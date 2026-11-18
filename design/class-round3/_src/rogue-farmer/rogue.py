from lib import *

C = "rogue"

# ---------------- Twinfang ----------------
def dagger(cx, cy, rot, L=66, W=11, grip="#7A3227", guard=("#E8A030", "#B8731F")):
    blade = f'M{-W} 9 L{-W} {L-24} L0 {L} L{W} {L-24} L{W} 9 Z'
    return (f'<g transform="translate({cx} {cy}) rotate({rot})">'
            f'<rect x="-5.5" y="-16" width="11" height="19" rx="5" fill="{grip}"/>'
            f'<path d="{blade}" fill="url(#gSteel)"/>'
            f'<rect x="-16" y="1" width="32" height="10" rx="4.5" fill="{guard[0]}"/>'
            f'<rect x="0" y="1" width="16" height="10" rx="4.5" fill="{guard[1]}" opacity="0.55"/></g>')

def twinfang():
    s = read(C, "twinfang")
    d = defs(s)
    L = (40, 144, 9)
    R = (160, 144, -9)
    arm_l = (f'<g id="arm-l" data-pivot="46 108">\n{dagger(*L, L=58)}\n{fist(L[0], L[1]-4, L[2])}\n</g>')
    arm_r = (f'<g id="arm-r" data-pivot="154 108">\n{dagger(*R, L=58)}\n{fist(R[0], R[1]-4, R[2])}\n</g>')
    write(C, "twinfang",
          "TWINFANG round 3: weapon rule. Both daggers sit further forward, drawn behind the shoulders (arm groups before body); only the fists show at the front edge of the shoulders; daggers spread apart and angled a little outward. Parts: back = cape, arm-l, arm-r (fist + dagger), body. Front = down (+y).",
          d, [group(s, "back"), arm_l, arm_r, group(s, "body")])

# ---------------- Bandit (mask) ----------------
def cutlass(cx, cy, rot, k=1.0):
    return (f'<g transform="translate({cx} {cy}) rotate({rot})"><rect x="-6" y="-19" width="12" height="22" rx="5" fill="#5A3A26"/>'
            f'<g transform="translate(0 12) scale(1 {k}) translate(0 -12)"><path d="M-9 12 L-9 50 C-9 62 -3 70 5 74 C13 60 14 44 13 26 L10 12 Z" fill="url(#gSteel)"/></g>'
            f'<path d="M-19 4 Q0 0 19 4 L19 12 Q0 9 -19 12 Z" fill="#E8A030"/><path d="M0 2 Q10 2 19 4 L19 12 Q10 10 0 10 Z" fill="#B8731F" opacity="0.55"/></g>')

def bandit():
    s = read(C, "bandit-mask")
    d = defs(s)
    arm_r = (f'<g id="arm-r" data-pivot="154 108">\n{cutlass(166, 134, 18, 0.95)}\n{fist(166, 131, 18)}\n</g>')
    arm_l = group(s, "arm-l")
    write(C, "bandit-mask",
          "BANDIT (mask) round 3: weapon rule. The cutlass hand is drawn behind the body (arm-r before body): the blade passes under the right shoulder and pokes out forward, only the fist shows at the front edge. Bigger blade. The free left hand stays in front. Parts: arm-r (fist + cutlass), body, arm-l (open hand). Front = down (+y).",
          d, [arm_r, group(s, "body"), arm_l])

# ---------------- Shade (cape) ----------------
def curved(cx, cy, rot, flip=1):
    # curved dagger; flip=1 curves outward to sprite left when rot positive
    f = flip
    blade = f'M-9 9 L-9 28 C{-8*f} 45 {0.4*f} 58 {8*f} 66 C{11*f} 48 10 31 9 9 Z' if f == 1 else \
            'M-9 9 L-9 28 C-8 45 -4.4 58 -8 66 C11 48 10 31 9 9 Z'
    return (f'<g transform="translate({cx} {cy}) rotate({rot})"><rect x="-5.5" y="-16" width="11" height="19" rx="5" fill="#4A3484"/>'
            f'<path d="{blade}" fill="url(#gSteel)"/>'
            f'<rect x="-16" y="1" width="32" height="10" rx="4.5" fill="#9A74E0"/><rect x="0" y="1" width="16" height="10" rx="4.5" fill="#5E3FA8" opacity="0.55"/></g>')

def curved2(cx, cy, rot, side):
    # side=-1 left hand: blade bows outward to the left; side=1 right hand bows right
    s = side
    blade = ('M-10 9 L10 9 C15 26 23 42 19 62 C10 50 -5 34 -10 9 Z' if s == 1 else
             'M10 9 L-10 9 C-15 26 -23 42 -19 62 C-10 50 5 34 10 9 Z')
    return (f'<g transform="translate({cx} {cy}) rotate({rot})"><rect x="-5.5" y="-16" width="11" height="19" rx="5" fill="#4A3484"/>'
            f'<path d="{blade}" fill="url(#gSteel)"/>'
            f'<rect x="-16" y="1" width="32" height="10" rx="4.5" fill="#9A74E0"/><rect x="0" y="1" width="16" height="10" rx="4.5" fill="#5E3FA8" opacity="0.55"/></g>')

def shade():
    s = read(C, "shade-cape")
    d = defs(s)
    # A: spread apart (brief rule for two weapons)
    L = (50, 139, 6); R = (150, 139, -6)
    arm_l = f'<g id="arm-l" data-pivot="46 108">\n{curved2(L[0], L[1], L[2], -1)}\n{fist(L[0], L[1]-2, L[2])}\n</g>'
    arm_r = f'<g id="arm-r" data-pivot="154 108">\n{curved2(R[0], R[1], R[2], 1)}\n{fist(R[0], R[1]-2, R[2])}\n</g>'
    write(C, "shade-cape",
          "SHADE (cape) round 3, spread: weapon rule. Both curved daggers drawn behind the body (arm groups before body), fists at the front edge of the shoulders, blades spread apart and bowing outward. Parts: back = cape, arm-l, arm-r, body. Front = down (+y).",
          d, [group(s, "back"), arm_l, arm_r, group(s, "body")])
    # B: crossed X kept, further forward
    L = (76, 148, -34); R = (124, 148, 34)
    arm_l = f'<g id="arm-l" data-pivot="46 108">\n{curved(L[0], L[1]+3, L[2], 1)}\n{fist(L[0], L[1], L[2])}\n</g>'
    arm_r = f'<g id="arm-r" data-pivot="154 108">\n{curved(R[0], R[1]+3, R[2], -1)}\n{fist(R[0], R[1], R[2])}\n</g>'
    write(C, "shade-cape-crossed",
          "SHADE (cape) round 3, crossed: weapon rule, keeping the X. Both daggers drawn behind the body (arm groups before body); the fists show at the chin edge and the blades cross ahead of the face. Parts: back = cape, arm-l, arm-r, body. Front = down (+y).",
          d, [group(s, "back"), arm_l, arm_r, group(s, "body")])

twinfang(); bandit(); shade()
print("ok")
