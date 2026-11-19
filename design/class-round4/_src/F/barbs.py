"""Round-4 fixes for the barbarians. python barbs.py [name ...]"""
import sys, re, math
from fx import *

C = "barbarian"
FIST_R = f'<path id="fistR" d="{fist_d(+1)}"/>'
FIST_L = f'<path id="fistL" d="{fist_d(-1)}"/>'


# ---------------------------------------------------------------- Wildmane (she)
LOCK_L = ("M 61 92 C 50 104 42 124 42 146 C 42 158 44 168 48 180 L 54 170 L 59 184 L 65 170 L 70 176 "
          "C 71 162 72 146 71 128 C 70 114 68 102 61 92 Z")


def wildmane():
    s = read3(C, "barbarian-wildmane-scar")
    s = add_defs(s, FIST_R)
    s = refist(s, "fistR")
    # no beard: the beard shape becomes two long locks of hair falling past the face onto the mantle
    locks = LOCK_L + " " + mirror_x(LOCK_L, 100)
    s = sub1(s, '<path d="M58 120 C54 140 66 156 80 166 L84 184 L100 172 L116 184 L120 166 C134 156 146 140 142 120 C128 140 72 140 58 120 Z" id="s12"/>',
             f'<path d="{locks}" id="s12"/>')
    s = sub1(s, '<use href="#s12" fill="url(#g6)"/>\n      <use href="#s12" fill="url(#g7)"/>',
             '<use href="#s12" fill="url(#g4)"/>\n      <use href="#s12" fill="url(#g5)"/>\n'
             '      <g clip-path="url(#wcLocks)"><path d="M 50 120 C 48 140 50 160 54 176" fill="none" stroke="#F0924A" stroke-width="4" stroke-linecap="round" opacity="0.45"/>'
             '<path d="M 140 112 C 146 130 150 150 150 170" fill="none" stroke="#8A3218" stroke-width="4" stroke-linecap="round" opacity="0.3"/></g>')
    s = add_defs(s, '<clipPath id="wcLocks"><use href="#s12"/></clipPath>')
    # scar: one solid darker skin shade, no white
    s = sub1(s, '<path d="M 72 106 L 92 128" fill="none" stroke="#B9775C" stroke-width="7" stroke-linecap="round" opacity="0.45"/><path d="M 72 106 L 92 128" fill="none" stroke="#FCE7D8" stroke-width="4" stroke-linecap="round"/>',
             '<path d="M 72 105 L 92 128" fill="none" stroke="#C47F62" stroke-width="5.5" stroke-linecap="round"/>')
    s = s.replace("swept rust mane, fringe + forked beard", "swept rust mane, fringe (round 4: no beard, long locks instead)")
    s = s.replace("scar across where his left eye", "scar across where her left eye")
    s = set_comment(s, "Round 4: Wildmane is a woman. The forked beard is gone; two long locks of hair fall past her face onto the mantle (same rust as the mane). The scar is one solid darker skin shade, no white. The sword fist wraps the grip.")
    write4(C, "barbarian-wildmane-scar", s)


# ---------------------------------------------------------------- Bearskin: a better club
CLUB = ("M -6 8 C -7.5 22 -12 36 -15.5 50 C -18 62 -13 75 0 75 C 13 75 18 62 15.5 50 C 12 36 7.5 22 6 8 Z")


def spike(x0, y0, x1, y1, w):
    """A cone spike from base centre (x0,y0) to tip (x1,y1), base half-width w: returns (whole, dark half)."""
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy); nx, ny = -dy / L * w, dx / L * w
    a = (x0 + nx, y0 + ny); b = (x0 - nx, y0 - ny)
    whole = f"M {f(a[0])} {f(a[1])} L {f(x1)} {f(y1)} L {f(b[0])} {f(b[1])} Z"
    half = f"M {f(x0)} {f(y0)} L {f(x1)} {f(y1)} L {f(b[0])} {f(b[1])} Z"
    return whole, half


def bearskin():
    s = read3(C, "barbarian-bearskin")
    s = add_defs(s, FIST_R)
    T = "translate(150 152) rotate(50)"
    sp = [((-11.5, 36), (-23, 33)), ((11.5, 36), (23, 33)), ((-15.5, 52), (-27, 51)), ((15.5, 52), (27, 51)), ((0, 73), (0, 81))]
    whole, dark = [], []
    for (b, t) in sp:
        w_, d_ = spike(b[0], b[1], t[0], t[1], 4.6)
        whole.append(w_); dark.append(d_)
    nails = "".join(f'<circle cx="{x}" cy="{y}" r="3.2" fill="#8C95A4"/><circle cx="{x - 0.9}" cy="{y - 0.9}" r="1.4" fill="#F4F6FA"/>'
                    for x, y in [(-5, 46), (6, 58), (-3, 66)])
    arm = ('<g id="arm-r" data-pivot="160 108">\n'
           '      <!-- round 4: a bigger, straight war club (pale wood, thickening toward the end, iron spikes out of the sides and tip, nail heads), held low: the handle passes under the right paw and the club comes out past the front of the body; only the fist shows, wrapped round the handle -->\n'
           f'      <g transform="{T}">\n'
           '        <rect x="-5.5" y="-18" width="11" height="34" rx="4" fill="#6A4226"/>\n'
           f'        <path d="{" ".join(whole)}" fill="url(#g17)"/>\n'
           f'        <path d="{" ".join(dark)}" fill="#5B5A6D" opacity="0.45"/>\n'
           '        <use href="#bcClub" fill="url(#bcgClub)"/>\n'
           '        <use href="#bcClub" fill="url(#g16)"/>\n'
           '        <g clip-path="url(#bccClub)"><path d="M -7 28 C -9 40 -11 52 -10 64" fill="none" stroke="#F6DDB6" stroke-width="3" stroke-linecap="round" opacity="0.6"/>'
           '<rect x="-20" y="6" width="40" height="11" fill="#6A4226"/><rect x="-20" y="14" width="40" height="3" fill="#4A2E1A" opacity="0.6"/>'
           f'{nails}</g>\n'
           '        <g clip-path="url(#bccHandle)"><use href="#fistR" transform="translate(1 3)" fill="#2B2230" opacity="0.3"/></g>\n'
           '        <use href="#fistR" fill="url(#gHand)"/>\n'
           '      </g>\n    </g>')
    s = set_group(s, "arm-r", arm)
    s = re.sub(r'<path id="bcClub" d="[^"]*"/>', f'<path id="bcClub" d="{CLUB}"/>', s)
    s = re.sub(r'<clipPath id="bccHandle">.*?</clipPath>', '<clipPath id="bccHandle"><use href="#bcClub"/><rect x="-5.5" y="-18" width="11" height="34"/></clipPath>', s)
    s = re.sub(r'<clipPath id="bccWpn">.*?</clipPath>',
               f'<clipPath id="bccWpn"><g transform="{T}"><use href="#bcClub"/><path d="{" ".join(whole)}"/><use href="#fistR"/></g></clipPath>', s)
    s = add_defs(s, '<linearGradient id="bcgClub" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="#F0D3A6"/><stop offset="0.55" stop-color="#D6A86E"/><stop offset="1" stop-color="#A9773F"/></linearGradient>')
    s = set_comment(s, "Round 4: a better club - bigger, straight, pale wood thickening to a rounded end, iron spikes out of both sides and the tip, nail heads; the fist wraps the handle.")
    write4(C, "barbarian-bearskin", s)


# ---------------------------------------------------------------- Warhelm: hammer 15% bigger
def warhelm():
    s = read3(C, "barbarian-warhelm")
    s = add_defs(s, FIST_L)
    s = refist(s, "fistL")
    head_big = scale_about("M -8 37 L 20 34 C 23.5 34 26 36.5 26 40 L 26 56 C 26 59.5 23.5 62 20 62 L -8 59 L -27 49.5 L -27 46.5 Z", 1.15, 0, 48)
    s = sub1(s, '<path id="whHead" d="M -8 37 L 20 34 C 23.5 34 26 36.5 26 40 L 26 56 C 26 59.5 23.5 62 20 62 L -8 59 L -27 49.5 L -27 46.5 Z"/>',
             f'<path id="whHead" d="{head_big}"/>')
    s = sub1(s, '<rect x="13" y="30" width="13" height="36" fill="#EEF1F5" opacity="0.7"/><rect x="-8" y="30" width="15" height="36" fill="url(#g19)"/><rect x="-8" y="45" width="15" height="6" fill="url(#g5)"/>',
             '<rect x="15" y="28" width="15" height="42" fill="#EEF1F5" opacity="0.7"/><rect x="-9.2" y="28" width="17.2" height="42" fill="url(#g19)"/><rect x="-9.2" y="44.5" width="17.2" height="7" fill="url(#g5)"/>')
    # a slightly longer, thicker haft to carry the bigger head
    s = s.replace('<rect x="-4.5" y="-46" width="9" height="92" rx="3.5"', '<rect x="-5" y="-50" width="10" height="96" rx="3.5"')
    s = s.replace('<circle cx="0" cy="-47" r="5.5" fill="url(#g19)"/>', '<circle cx="0" cy="-51" r="6" fill="url(#g19)"/>')
    s = s.replace('<rect x="-4.5" y="-46" width="9" height="92"/>', '<rect x="-5" y="-50" width="10" height="96"/>')
    s = set_comment(s, "Round 4: hammer head 15% bigger on a slightly longer, thicker haft; the fist wraps the haft.")
    write4(C, "barbarian-warhelm", s)


# ---------------------------------------------------------------- Berserker: new flail spikes
def berserker():
    s = read3(C, "barbarian-berserker")
    s = add_defs(s, FIST_R)
    s = refist(s, "fistR")
    cx, cy, R = 130.7, 179.7, 16.5
    whole, dark = [], []
    for k in range(7):
        a = math.radians(-90 + 360 / 7 * k + 12)
        b = (cx + math.cos(a) * (R - 2), cy + math.sin(a) * (R - 2))
        t = (cx + math.cos(a) * (R + 11), cy + math.sin(a) * (R + 11))
        w_, d_ = spike(b[0], b[1], t[0], t[1], 5.2)
        whole.append(w_); dark.append(d_)
    # top face: a ring of shorter spikes leaning outward from the crown, as a spiked ball looks from above
    inner, inner_d = [], []
    for k in range(5):
        a = math.radians(-60 + 72 * k)
        b = (cx + math.cos(a) * 2.5, cy + math.sin(a) * 2.5)
        t = (cx + math.cos(a) * 13.5, cy + math.sin(a) * 13.5)
        w_, d_ = spike(b[0], b[1], t[0], t[1], 3.6)
        inner.append(w_); inner_d.append(d_)
    studs = (f'<path d="{" ".join(inner)}" fill="url(#g19)"/><path d="{" ".join(inner_d)}" fill="#3E3D52" opacity="0.45"/>'
             f'<circle cx="{f(cx)}" cy="{f(cy)}" r="3.4" fill="#E9EDF2"/>')
    new_ball = (f'<path d="{" ".join(whole)}" fill="url(#g19)"/>\n'
                f'      <path d="{" ".join(dark)}" fill="#3E3D52" opacity="0.5"/>\n'
                f'      <circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#g21)"/>\n'
                f'      <circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#g22)"/>\n'
                f'      <!-- round 4: spikes on the top face drawn as a ring of short spikes leaning outward from the crown -->\n'
                f'      {studs}\n')
    a = s.index('<polygon points="134.2,202.4')
    b = s.index('<g transform="translate(159 146) rotate(40)">', a)
    s = s[:a] + new_ball + "      " + s[b:]
    s = add_defs(s, '<radialGradient id="bzgStud" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#F4F6FA"/><stop offset="0.55" stop-color="#A9B2C1"/><stop offset="1" stop-color="#4E5666"/></radialGradient>')
    s = set_comment(s, "Round 4: new flail spikes - seven clean cone spikes round the ball, lit from the left, and a ring of short spikes on the top face leaning outward from the crown (no more diamond studs); the fist wraps the handle.")
    write4(C, "barbarian-berserker", s)


if __name__ == "__main__":
    for n in sys.argv[1:] or ["wildmane", "bearskin", "warhelm", "berserker"]:
        globals()[n]()
    print("ok")
