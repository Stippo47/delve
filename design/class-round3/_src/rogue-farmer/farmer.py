from lib import *
import math, sys

C = "farmer"


def shadowed(d, fill, clip="uc", dy=3, op=0.28, extra=""):
    return (f'<g clip-path="url(#{clip})"><g transform="translate(0 {dy})"><path d="{d}"{extra} fill="#1A1030" opacity="{op}"/></g></g>'
            f'<path d="{d}"{extra} fill="{fill}"/><path d="{d}"{extra} fill="url(#sR)"/>')


def pole(x1, y1, x2, y2, w, fill="url(#gWoodV)"):
    """A straight wooden shaft from (x1,y1) to (x2,y2), width w, round ends."""
    L = math.hypot(x2 - x1, y2 - y1)
    a = math.degrees(math.atan2(-(x2 - x1), y2 - y1))  # rotate so local +y points along shaft
    return (f'<g transform="translate({x1:.1f} {y1:.1f}) rotate({a:.1f})">'
            f'<rect x="{-w/2}" y="0" width="{w}" height="{L:.1f}" rx="{w/2}" fill="{fill}"/></g>')


def along(x1, y1, x2, y2, t):
    return x1 + (x2 - x1) * t, y1 + (y2 - y1) * t


def ang(x1, y1, x2, y2):
    return math.degrees(math.atan2(-(x2 - x1), y2 - y1))


# ---------------- Haymaker (fork) ----------------
BRIM = "M28 68 C28 40 60 20 100 20 C140 20 172 40 172 68 C172 96 140 116 100 116 C60 116 28 96 28 68 Z"
CROWN = "M56 60 C54 34 75 24 100 24 C125 24 146 34 144 60 C144 74 125 82 100 82 C75 82 56 74 56 60 Z"
BAND = "M56 56 C62 68 80 75 100 75 C120 75 138 68 144 56 C145 61 145 67 144 70 C138 80 120 85 100 85 C80 85 62 80 56 70 C55 67 55 61 56 56 Z"


def fork_head(cx, cy, rot):
    # matte iron: no bright highlight, three tines on a cross-piece
    return (f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({rot:.1f})">'
            f'<rect x="-6" y="-12" width="12" height="13" rx="3" fill="#6E7480"/>'
            f'<path d="M-25 0 C-25 -7 25 -7 25 0 L25 6 C25 10 -25 10 -25 6 Z" fill="#7E8592"/>'
            f'<path d="M-23 3 C-29 13 -27 25 -21 36 L-14.5 35 C-19.5 25 -20.5 15 -15.5 7 Z" fill="url(#gMatte)"/>'
            f'<path d="M-3.8 5 L-3.8 36 L0 40 L3.8 36 L3.8 5 Z" fill="url(#gMatte)"/>'
            f'<path d="M23 3 C29 13 27 25 21 36 L14.5 35 C19.5 25 20.5 15 15.5 7 Z" fill="url(#gMatte)"/></g>')


def haymaker():
    s = read(C, "haymaker-fork")
    d = defs(s)
    d += f'<clipPath id="brimc"><path d="{BRIM}"/></clipPath>'
    body = group(s, "body")
    cut = body.index('<g clip-path="url(#uc)"><g transform="translate(0 4)"><path d="M171.2')
    hat = (shadowed(BRIM, "url(#g4)", dy=4, op=0.3)
           + f'<path d="M40 74 C52 100 80 110 100 110 C120 110 148 100 160 74 C164 92 140 112 100 112 C60 112 36 92 40 74 Z" fill="#C08A34" opacity="0.35"/>'
           + shadowed(CROWN, "url(#g5)", clip="brimc", dy=4, op=0.3)
           + f'<ellipse cx="80" cy="42" rx="13" ry="8" fill="#FFF3C4" opacity="0.45"/>'
           + shadowed(BAND, "url(#g2)", clip="brimc", dy=2, op=0.2))
    body = body[:cut] + hat + "\n</g>"
    # pitchfork: shaft enters from behind the right shoulder (butt end peeks out past the brim), passes under the body,
    # comes out at the front edge in the right fist, left fist further down, head forward
    B = (194, 84); H = (136, 157)
    a = ang(*B, *H)
    f1 = along(*B, *H, 0.56)
    f2 = along(*B, *H, 0.88)
    arm_r = ('<g id="arm-r" data-pivot="154 108">\n'
             + pole(*B, *H, 10) + "\n"
             + fork_head(H[0], H[1], a) + "\n"
             + fist(f1[0], f1[1], a) + "\n"
             + "</g>")
    write(C, "haymaker-fork",
          "HAYMAKER (fork) round 3: long pitchfork handle passing behind the body (arm-r before body): the butt end pokes out at the right side of the shoulder, the shaft runs under the shoulder and comes out at the front edge in the right fist (the other hand is hidden under the body); matte iron tines, no bright highlights. Simpler straw hat: smooth brim, wide low crown (the bowl), plain red band. Two-handed: fist + fork in arm-r, no arm-l. Front = down (+y).",
          d, [arm_r, body])


# ---------------- Granny Reaper ----------------
def granny():
    s = read(C, "granny-reaper")
    d = defs(s)
    B = (192, 68); H = (151, 184)
    a = ang(*B, *H)
    f1 = along(*B, *H, 0.52)
    f2 = along(*B, *H, 0.83)
    blade = ('<path d="M145 172 L154 197 C112 207 52 200 12 150 C10 145 15 141 19 144 C48 176 98 186 145 172 Z" fill="url(#g8)"/>'
             '<path d="M145 172 C98 186 48 176 19 144 C40 174 80 190 116 191 C128 191 138 188 148 184 Z" fill="#FFFFFF" opacity="0.45"/>')
    ferrule = f'<rect x="{H[0]-9}" y="{H[1]-8}" width="18" height="12" rx="4" fill="#5B6270" transform="rotate({a:.1f} {H[0]} {H[1]-2})"/>'
    arm_r = ('<g id="arm-r" data-pivot="154 108">\n'
             + pole(*B, *H, 11) + "\n" + blade + "\n" + ferrule + "\n"
             + fist(f1[0], f1[1], a) + "\n"
             + fist(f2[0], f2[1], a, under=False) + "\n</g>")
    write(C, "granny-reaper",
          "GRANNY REAPER round 3: a much longer snath, drawn behind the body (arm-r before body): its top end pokes out at the right side of the shoulder, it runs under the shoulder, comes out at the front edge in the right fist, the left fist holds it further down, and a bigger blade sweeps left across the front. Two-handed: both fists + scythe in arm-r, no arm-l. Front = down (+y).",
          d, [arm_r, group(s, "body")])


# ---------------- Digger ----------------
def digger():
    s = read(C, "digger")
    d = defs(s)
    B = (19, 104); H = (104, 165)
    a = ang(*B, *H)
    f1 = along(*B, *H, 0.54)
    grip = (f'<g transform="translate({B[0]} {B[1]}) rotate({a:.1f})">'
            '<path d="M-13 -11 C-13 -15 13 -15 13 -11 L13 -7 C13 -4 6 -1 5 4 L-5 4 C-6 -1 -13 -4 -13 -7 Z" fill="#B57944"/>'
            '<path d="M0 -14 C7 -14 13 -13 13 -11 L13 -7 C13 -4 6 -1 5 4 L0 4 Z" fill="#8E5A2C" opacity="0.5"/></g>')
    head = (f'<g transform="translate({H[0]:.1f} {H[1]:.1f}) rotate({a:.1f})"><path d="M-6 -8 L6 -8 L9 4 L-9 4 Z" fill="#7C8494"/>'
            '<path d="M-20 2 L20 2 L20 20 C20 31 10 38 0 42 C-10 38 -20 31 -20 20 Z" fill="url(#gSteel)"/>'
            '<path d="M-20 2 L20 2 L20 7 L-20 7 Z" fill="#8E96A4"/></g>')
    arm_r = ('<g id="arm-r" data-pivot="154 108">\n'
             + pole(*B, *H, 10) + "\n" + grip + "\n" + head + "\n"
             + fist(f1[0], f1[1], a) + "\n</g>")
    write(C, "digger",
          "DIGGER round 3: longer spade handle, held low and drawn below the body (arm-r before body): the D-grip shows behind the left shoulder, the handle runs under the shoulder and comes out at the front edge in the left fist, blade forward. Two-handed: fist + spade in arm-r (as the round-2 rule says), no arm-l. Front = down (+y).",
          d, [arm_r, group(s, "body")])


# ---------------- Grandpa Sickle ----------------
def grandpa():
    s = read(C, "grandpa-sickle")
    d = defs(s)
    sick = ('<g transform="translate(150 140) scale(1.1) translate(-150 -140)">'
            '<rect x="144" y="128" width="11" height="34" rx="5" fill="url(#gWood)"/>'
            '<g transform="translate(0 -4)">'
            '<path d="M146 156 C166 168 168 198 140 204 C118 208 98 200 92 184 C91 180 96 178 98 182 C106 194 124 196 136 190 C150 182 150 168 142 160 Z" fill="url(#g5)"/>'
            '<path d="M98 182 C106 194 124 196 136 190 C150 182 150 168 142 160 L146 158 C156 170 154 188 138 196 C122 202 104 196 98 182 Z" fill="#FFFFFF" opacity="0.45"/>'
            '<rect x="140" y="152" width="16" height="8" rx="3" fill="#7C8494"/></g></g>')
    arm_r = ('<g id="arm-r" data-pivot="154 108">\n<g transform="translate(12 -5)">' + sick + '</g>\n' + fist(160, 134, -8) + '\n</g>')
    write(C, "grandpa-sickle",
          "GRANDPA SICKLE round 3: weapon rule. The sickle hand is drawn behind the body (arm-r before body): the handle sits under the right shoulder, only the fist shows at the front edge, and the crescent comes out forward, a little bigger. The free left fist stays in front. Parts: back = sheaf, arm-r (fist + sickle), body, arm-l (free fist). Front = down (+y).",
          d, [group(s, "back"), arm_r, group(s, "body"), group(s, "arm-l")])


if __name__ == "__main__":
    for n in sys.argv[1:] or ["haymaker"]:
        globals()[n]()
    print("ok")
