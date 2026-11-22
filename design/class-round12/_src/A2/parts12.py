"""Round 12, section C, the heroes' own parts (docs/ART-NEEDED.md: "(parts) Bearskin ... Warhelm ... Bulwark, Valkyrie,
Samurai, Trapper" and "demon form (Warlock)"). Each is the approved hero with only its weapon hand changed, as the hero
deck's notes ask (docs/riffle-log/2026-11-22-round12.txt):
  hero-valkyrie   "Hold spear better": fighters5.py with VALK_R12 (the round-5 generator, one switch)
  hero-samurai    "Should hold with 2 hands in front of him": fighters5.py with SAM_R12
  hero-trapper    "I want them to have a shotgun. Should hold with 2 hands. Trap sits on their back hip.": ranged6.py, TRAP_R12
  hero-bulwark    "Holding spear too close to tip": the approved file (base/bulwark.svg, drawn by hand in rounds 2 to 4)
                  with the spear slid forward through the fist; no shape redrawn
  hero-warhelm    the hammer as its own part (#arm-l-hammer) and the fist alone in #arm-l, so the fists can punch in turn
                  while the hammer is away; the same shapes, split. warhelm-hammer: the hammer alone, for when it flies
  hero-bearskin   "The bear paws of his outfit should be on his hands. Move with it. I didn't like this club.": the
                  hide's paws and claws leave #body for the arm parts, over the fists; a new club in its own part
                  (#arm-r-club), which the game can hide
  hero-warlock-demon   the Warlock's demon form: his own bust turned demon, holding the great sword (new)
With no switch the copied generators give the approved files byte for byte; the three hand-drawn heroes are edited as
text from a copy of the approved file (base/). check12.py checks both.
python parts12.py [name ...]   -> ../../props/<name>.svg   (paths relative to this file)"""
import sys, re, math, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from kit12 import *
from compose import prefixed

BASE = pathlib.Path(__file__).resolve().parents[1] / "base"


def put(name, text):
    out = ROOT5 / "props"
    out.mkdir(parents=True, exist_ok=True)
    p = out / f"{name}.svg"
    p.write_text(text, encoding="utf-8")
    return p


def cut(t, start, end):
    """(before, the block from `start` up to `end`, after)."""
    a = t.index(start)
    b = t.index(end, a)
    return t[:a], t[a:b], t[b:]


def mini(build, prefix):
    """Shapes drawn with the A2 library, to splice into a hand-drawn file: (defs, markup, [(shape id, transform)]),
    every id prefixed so none can clash with the file's own."""
    S = Sprite("")
    S.group("x")
    build(S)
    t = prefixed(S.svg(), prefix)
    defs = t[t.index("<defs>") + 6:t.index("</defs>")]
    defs = defs[defs.index("</filter>") + 9:]                        # the outline filter is the file's own
    body = t[t.index(f'<g id="{prefix}x">') + len(f'<g id="{prefix}x">'):t.rindex("</g>\n</g>")]
    return defs.strip(), body.strip(), [(prefix + s, T) for s, T in S.shapes]


# ================================================================== the three generated heroes
def valkyrie():
    import fighters5 as m
    m.VALK_R12 = True
    try:
        return m.valkyrie()
    finally:
        m.VALK_R12 = False


def samurai():
    import fighters5 as m
    m.SAM_R12 = True
    try:
        return m.samurai()
    finally:
        m.SAM_R12 = False


def trapper():
    import ranged6 as m
    m.TRAP_R12 = True
    try:
        return m.trapper()
    finally:
        m.TRAP_R12 = False


# ================================================================== the Bulwark
def bulwark(slide=14, at="translate(190 122) rotate(4)"):
    t = (BASE / "bulwark.svg").read_text(encoding="utf-8")
    old = "translate(179 138) rotate(8)"
    head, arm, rest = cut(t, '<g id="arm-r"', '<g id="body">')
    m = re.search(r'<g transform="translate\(179 138\) rotate\(8\)">\n(.*?)\n\s*</g>\s*</g>\s*$', arm, re.S)
    lines = m.group(1).split("\n")
    moved = [l for l in lines if "fistR" not in l]
    assert len(moved) == len(lines) - 2
    arm = ('<g id="arm-r" data-pivot="150 108">\n'
           '  <!-- round 12 ("Holding spear too close to tip"): the same spear, slid forward through the fist (bare shaft between the hand and the head now); the hand sits at the pauldron\'s outer edge -->\n'
           f'  <g transform="{at}">\n    <g transform="translate(0 {slide})">\n' + "\n".join(moved)
           + f'\n    <g clip-path="url(#bcShaft)"><use href="#fistR" transform="translate(0 {3 - slide})" fill="#2B2230" opacity="0.3"/></g>\n    </g>\n'
           '    <use href="#fistR" fill="url(#gHand)"/>\n  </g>\n</g>\n')
    t = head + arm + rest
    clip_old = ('<clipPath id="bcWpn"><g transform="translate(179 138) rotate(8)"><rect x="-4.5" y="-108" width="9" height="138"/><use href="#bHead"/>'
                '<use href="#fistR"/><path d="M -12 25.5 L 12 25.5 L 10 30.5 L -10 30.5 Z"/></g></clipPath>')
    assert clip_old in t
    t = t.replace(clip_old, f'<clipPath id="bcWpn"><g transform="{at}"><g transform="translate(0 {slide})"><rect x="-4.5" y="-108" width="9" height="138"/>'
                            '<use href="#bHead"/><path d="M -12 25.5 L 12 25.5 L 10 30.5 L -10 30.5 Z"/></g><use href="#fistR"/></g></clipPath>')
    assert old not in t
    return put("hero-bulwark", t)


# ================================================================== the Warhelm
def warhelm_split():
    t = (BASE / "warhelm.svg").read_text(encoding="utf-8")
    head, arm, rest = cut(t, '<g id="arm-l"', '<g id="body">')
    m = re.search(r'(\s*<!--.*?-->\n)?\s*<g transform="translate\(36 141\) rotate\(-14\)">\n(.*?)\n\s*</g>\s*</g>\s*$', arm, re.S)
    lines = m.group(2).split("\n")
    assert 'href="#fistL" fill="url(#gHand)"' in lines[-1]
    return t, head, lines, rest


def warhelm():
    t, head, lines, rest = warhelm_split()
    arm = ('<g id="arm-l-hammer" data-pivot="40 108">\n'
           '      <!-- round 12: the warhammer as its own part (it follows #arm-l, or is hidden while it flies); the same shapes -->\n'
           '      <g transform="translate(36 141) rotate(-14)">\n' + "\n".join(lines[:-1]) + '\n      </g>\n    </g>\n'
           '    <g id="arm-l" data-pivot="40 108">\n'
           '      <!-- round 12: the left fist alone, so it can punch -->\n'
           '      <g transform="translate(36 141) rotate(-14)">\n' + lines[-1] + '\n      </g>\n    </g>\n    ')
    return put("hero-warhelm", head + arm + rest)


def warhelm_hammer():
    t, head, lines, rest = warhelm_split()
    keep = [l for l in lines[:-1] if "fistL" not in l]
    i = head.index('<g id="sprite"')
    body = ('<g id="sprite" filter="url(#outline)">\n    <g id="body">\n'
            '      <!-- the Warhelm\'s warhammer alone (round 12), for when it leaves his hand: the hero file\'s own shapes, its head forward (+y) -->\n'
            '      <g transform="translate(100 92)">\n' + "\n".join(keep) + '\n      </g>\n    </g>\n  </g>\n</svg>\n')
    return put("warhelm-hammer", head[:i] + body)


# ================================================================== the Bearskin
CLUB_T = "translate(152 149) rotate(47)"


def new_club(S):
    """A gnarled root club: a thick knotted head, a broken stub of branch, a leather-bound grip. In the old club's frame."""
    W = "#B08050"
    S.shape(rr(0, -1, 11, 34, 4), "#6A4226", T=CLUB_T, shadow=0)
    S.shape(blob([(15, 40), (27, 36), (30, 44), (18, 50)], 0.6), shade(W, 0.86), T=CLUB_T, shadow=0)
    body = [(-6, 8), (-8, 22), (-15, 34), (-13, 45), (-20, 56), (-17, 69), (-6, 78), (7, 77), (18, 67), (16, 54), (20, 44), (13, 32), (8, 20), (6, 8)]
    S.shape(blob(body, 0.75), W, T=CLUB_T, shadow=2,
            decor=strokes("M -7 26 C -11 40 -13 52 -11 66", "#E6C89A", 3, 0.6) + strokes("M 5 22 C 8 36 9 50 6 66", "#7A5230", 2.6, 0.5)
                  + f'<path d="{ell(-3, 54, 7, 5.5)}" fill="#7A5230" opacity="0.75"/><path d="{ell(-3, 54, 3, 2.2)}" fill="#4A2E1A"/>'
                  + f'<path d="{ell(8, 38, 4.6, 3.6)}" fill="#7A5230" opacity="0.7"/>')
    S.shape(rr(0, 11, 14, 9, 3), "#4A2E1A", T=CLUB_T, shadow=1)


def bearskin():
    t = (BASE / "bearskin.svg").read_text(encoding="utf-8")
    cdefs, cbody, cshapes = mini(new_club, "c12_")
    head, arm_r, rest = cut(t, '<g id="arm-r"', '<g id="body">')
    body, arm_l, tail = cut(rest, '<g id="arm-l"', '</g>\n</svg>')
    # the paws (s2 left, s4 right) and their claws (s6, s8) leave the body for the arms
    blines = body.split("\n")
    def take(sid):
        got = [l for l in blines if f'href="#{sid}"' in l and "bccWpn" not in l]
        assert len(got) == 3, (sid, len(got))
        for l in got:
            blines.remove(l)
        return got
    pl, cl, pr, cr = take("s2"), take("s6"), take("s4"), take("s8")
    body = "\n".join(blines)
    fist_l = [l for l in arm_l.split("\n") if "h22" in l]
    assert len(fist_l) == 2
    new = ('<g id="arm-r-club" data-pivot="160 108">\n'
           '      <!-- round 12 ("I didn\'t like this club"): a new club, a gnarled root, in its own part (it follows #arm-r, or is hidden while he claws) -->\n'
           + cbody + '\n    </g>\n    ' + body
           + '<g id="arm-l" data-pivot="40 108">\n'
           '      <!-- round 12 ("The bear paws of his outfit should be on his hands. Move with it."): the fist, and over it the hide\'s paw and claws (they were in #body) -->\n'
           + "\n".join(fist_l + pl + cl) + '\n    </g>\n'
           '    <g id="arm-r" data-pivot="160 108">\n'
           '      <!-- round 12: the right fist (where it held the club), and over it the hide\'s paw and claws -->\n'
           f'      <g clip-path="url(#k23)"><use href="#fistR" transform="translate(1 2.5) {CLUB_T}" fill="#2B2230" opacity="0.3"/></g>\n'
           f'      <use href="#fistR" transform="{CLUB_T}" fill="url(#gHand)"/>\n'
           + "\n".join(pr + cr) + '\n    </g>\n  ')
    t = head + new + tail
    m = re.search(r'<clipPath id="bccWpn">.*?</clipPath>', t, re.S)
    uses = "".join(f'<use href="#{s}" transform="{T}"/>' for s, T in cshapes)
    t = t[:m.start()] + f'<clipPath id="bccWpn">{uses}</clipPath>' + t[m.end():]
    t = t.replace("</defs>", cdefs + "\n</defs>", 1)
    return put("hero-bearskin", t)


# ================================================================== the Warlock's demon form
def demon():
    SKIN = ("#8E2438", "#B83A44", "#D8564E", "#DC5E54", "#C4483E")
    S = Sprite("THE WARLOCK'S DEMON FORM (round 12): the Warlock with the imp in him, his own bust turned demon (the game "
               "washed his sprite red and drew horns and a sword in code): red skin, two fangs, his slicked hair with its "
               "widow's peak, his two horns grown long and heavy, torn bat wings behind (#back, sways), his dark coat with "
               "the magenta edge; the great demonic sword in the right fist (arm-r, under the shoulder): a black blade with "
               "a burning red core. Left hand free. " + LAYOUT)
    st = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in zip((0, 0.2, 0.45, 0.85, 1), SKIN))
    S.add_def(f'<linearGradient id="gFaceDm" x1="0" y1="95" x2="0" y2="153" gradientUnits="userSpaceOnUse">{st}</linearGradient>'
              '<radialGradient id="gHandDm" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#E06A5A"/><stop offset="1" stop-color="#A8303A"/></radialGradient>')
    hand = "url(#gHandDm)"
    S.group("back", (100, 92), "wings")
    wing = [(118, 96), (128, 64), (150, 36), (182, 14), (204, 18), (196, 36), (206, 52), (190, 62), (196, 80), (176, 84), (172, 102), (150, 98), (136, 108)]
    for pts in (wing, mirror(wing)):
        k = 1 if pts is wing else -1
        S.shape(blob(pts, 0.6), "#6A1E3A", shadow=0, T="translate(100 96) scale(0.92) translate(-100 -96)",
                decor=strokes(f"M {100 + k * 22} 92 L {100 + k * 82} 18 M {100 + k * 26} 94 L {100 + k * 98} 48 M {100 + k * 30} 98 L {100 + k * 90} 76", "#3A0E22", 5, 0.8))
    S.group("arm-r", PR, "the demon sword")
    T = frame(166, 118, 10)
    L, w = 84, 14
    S.shape(rr(0, -12, 10, 30, 4), "#3A1A2A", T=T, shadow=0)
    S.shape(poly([(0, -36), (8, -26), (0, -20), (-8, -26)]), "#8A1E28", T=T, shadow=0)
    blade = [(-w, 8), (w, 8), (w - 2, L * 0.45), (w + 3, L * 0.55), (w - 1, L - 14), (0, L + 8), (-w + 1, L - 14), (-w, L * 0.5)]
    S.shape(poly(blade), "#3E2A3A", T=T, shadow=2,
            decor=f'<path d="{poly([(-4.5, 12), (4.5, 12), (4.5, L - 16), (0, L - 4), (-4.5, L - 16)])}" fill="#E0304A"/>'
                  f'<path d="{poly([(-1.6, 14), (1.6, 14), (1.6, L - 18), (0, L - 12), (-1.6, L - 18)])}" fill="#FF9A6A"/>')
    S.shape(poly([(-24, 0), (-17, 9), (17, 9), (24, 0), (15, 2), (-15, 2)]), "#8A1E28", T=T, shadow=2)
    fist(S, 0, -8, T=T, hand=hand)
    S.group("body")
    robe(S, "#2E2238", "#E0388E", 8)
    for s in (-1, 1):   # the horns, grown: the Warlock's own line, longer and thicker, with a ridge
        pts = [(100 + s * 28, 80), (100 + s * 44, 58), (100 + s * 62, 30), (100 + s * 78, -2), (100 + s * 52, 14), (100 + s * 26, 40), (100 + s * 10, 74)]
        S.shape(blob(pts, 0.7), "#4A2A36", shadow=0,
                decor=f'<path d="{blob([(100 + s * 62, 26), (100 + s * 78, -2), (100 + s * 52, 14)], 0.6)}" fill="#D8CBB8" opacity="0.85"/>'
                      + strokes(f"M {100 + s * 22} 60 L {100 + s * 36} 66 M {100 + s * 34} 44 L {100 + s * 48} 50", "#2A141E", 3, 0.6))
    S.shape(HEAD, fill="url(#gFaceDm)", shadow=5, decor='<rect x="100" y="40" width="56" height="120" fill="#5A0E22" opacity="0.2"/>')
    S.raw('<path d="M94 136 Q100 139.5 106 136" fill="none" stroke="#6A1422" stroke-width="2.8" stroke-linecap="round"/>')
    S.shape(poly([(92, 137), (97, 137), (94.5, 146)]) + " " + poly([(103, 137), (108, 137), (105.5, 146)]), "#FBF4E4", shadow=0, side=False)
    hair = ("M 52 112 C 42 76 62 46 100 46 C 138 46 158 76 148 112 C 140 102 128 96 116 96 C 110 96 104 100 100 110 C 96 100 90 96 84 96 "
            "C 72 96 60 102 52 112 Z")   # the Warlock's own hair
    S.shape(hair, "#3A2250", shadow=4, decor='<path d="M 70 52 C 66 66 66 82 70 96 L 76 94 C 74 80 74 66 78 54 Z" fill="#B08AD0" opacity="0.35"/>')
    S.group("arm-l", PL, "free hand")
    fist(S, 57, 140, 0, w=24, h=21, hand=hand)
    return save("props", "hero-warlock-demon", S)


BUILD = {"hero-valkyrie": valkyrie, "hero-samurai": samurai, "hero-trapper": trapper, "hero-bulwark": bulwark, "hero-warhelm": warhelm,
         "warhelm-hammer": warhelm_hammer, "hero-bearskin": bearskin, "hero-warlock-demon": demon}

if __name__ == "__main__":
    for n in sys.argv[1:] or list(BUILD):
        print(BUILD[n]().relative_to(ROOT5).as_posix())
