"""The Shaman's animals (round 19, lane caster19), drawn with svgkit in the art round 12 props' way.
    python tools/caster19/animals.py
Writes the game's spirit wolf and spirit eagle (art/summons/), and the design sketches for the designer (design/caster19/):
a large brown bear (the Bearskin's bear for its colours; the spirit bear comes after the designer approves it) and a
salmon, both top down. The designer: "Beaver looks good in game so just need to do wolf (in the same style), bear (make
large normal bear if I approve you will make it into a spirit), and eagle (better shape). Also try a fish/salmon. Top down."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from svgkit import Art, ell, blobpath, poly, mirror

# the ancestors' pale blue (art/summons/spirit-beaver.svg)
DARK = ('#7CC5EC', '#33A8E7'); DARK_S = '#0D5C86'
LIGHT = ('#C8F0FF', '#65D4FF'); LIGHT_S = '#0086BA'
PALE = ('#F0FBFF', '#9AE4FF'); PALE_S = '#009ED6'
NOSE = '#2E6A9A'
# the spirits' swirl, as on the beaver's back (centred on 97, 100 there)
SWIRL = 'M 101.7 99 L 101.8 99.8 L 101.6 100.6 L 101.1 101.5 L 100.3 102.2 L 99.2 102.7 L 97.8 102.9 L 96.4 102.6 L 94.9 102 L 93.6 100.8 L 92.6 99.3 L 91.9 97.4 L 91.8 95.3 L 92.2 93.1 L 93.2 91 L 94.8 89.1 L 97 87.5 L 99.6 86.6 L 102.5 86.3 L 105.5 86.7 L 108.4 88 L 111.1 90 L 113.2 92.7 L 114.6 95.9 L 115.2 99.6 L 114.9 103.4 L 113.6 107.2 L 111.4 110.6 L 108.2 113.5 L 104.4 115.6 L 100 116.7 L 95.3 116.7 L 90.7 115.5 L 86.4 113.1 L 82.7 109.7 L 79.8 105.3 L 78.1 100.3'
def swirl(cx, cy, k=1.0, w=5.5):
    return f'<path d="{SWIRL}" transform="translate({cx} {cy}) scale({k}) translate(-97 -100)" fill="none" stroke="#DDF6FF" stroke-width="{w / k:.2f}" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>'
def gloss(cx, cy, rx, ry, rot=-30, a=0.3):
    return f'<path d="{ell(cx, cy, rx, ry, rot)}" fill="#FFFFF4" opacity="{a}"/>'

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')

# ------------------------------------------------------------------ the spirit wolf (in the game)
def wolf(pal=None):
    a = Art('SPIRIT WOLF (the Shaman\'s ancestor spirit; round 19, lane caster19, the designer: "In game the wolf looks different from the rest ... do wolf (in the same style)"): a wolf seen from above in the beaver\'s and the bear\'s way: the ancestors\' pale blue, a long body, a bushy tail out behind, pricked ears, a long muzzle, the spirits\' swirl on its back. The game draws it see-through. One part (#body). Front = DOWN (+y), centre (100,100); drawn at 0.72 of the box: give the kind headR 47 (vr 18).', scale=0.72)
    tail = blobpath([(100, 62), (88, 46), (86, 26), (94, 8), (106, 8), (114, 26), (112, 46)])
    a.shape(tail, DARK, DARK_S, inner='<path d="M 95 46 L 97 18 M 105 46 L 104 18" fill="none" stroke="#2E6A9A" stroke-width="2.6" stroke-linecap="round" opacity="0.3"/>')
    for x in (70, 130): a.shape(ell(x, 74, 12, 16, 14 if x < 100 else -14), DARK, DARK_S)
    for x in (72, 128): a.shape(ell(x, 126, 12, 15, -10 if x < 100 else 10), DARK, DARK_S)
    a.shape(ell(100, 94, 32, 44), LIGHT, LIGHT_S, drop=3, inner=swirl(100, 90) + gloss(84, 70, 14, 7))
    a.shape(ell(100, 146, 25, 22), LIGHT, LIGHT_S, drop=3, inner=gloss(90, 140, 9, 4.5))
    # the ears stand up on top of the head, pointing back
    ear = [(76, 138), (78, 104), (96, 130)]
    a.shape(blobpath(ear, 0.3), DARK, DARK_S, drop=2, inner='<path d="M 80 114 L 84 130" stroke="#F0FBFF" stroke-width="5" stroke-linecap="round" opacity="0.6"/>')
    a.shape(blobpath(mirror(ear), 0.3), DARK, DARK_S, drop=2, inner='<path d="M 120 114 L 116 130" stroke="#F0FBFF" stroke-width="5" stroke-linecap="round" opacity="0.6"/>')
    a.shape(blobpath([(89, 154), (111, 154), (113, 172), (106, 190), (94, 190), (87, 172)]), PALE, PALE_S, drop=2)
    a.shape(ell(100, 187, 7, 5), NOSE)
    return a

# ------------------------------------------------------------------ the spirit eagle (in the game)
def eagle():
    a = Art('SPIRIT EAGLE (the Shaman\'s ancestor spirit; round 19, lane caster19, the designer: "Eagle doesnt look right ... eagle (better shape)"): an eagle seen from above, wings spread wide: broad wings that end in spread finger feathers, a fan of a tail behind, a white head and a hooked gold beak in front; the ancestors\' pale blue, the spirits\' swirl on its back. The game beats its wings (drawn narrower and wider) and draws it see-through. One part (#body). Front = DOWN (+y), centre (100,100); drawn at 0.86 of the box: give the kind headR 56 (vr 22).', scale=0.86)
    tail = blobpath([(93, 72), (82, 36), (88, 26), (100, 22), (112, 26), (118, 36), (107, 72)], 0.8)
    a.shape(tail, DARK, DARK_S, inner='<path d="M 96 66 L 89 32 M 100 66 L 100 26 M 104 66 L 111 32" stroke="#2E6A9A" stroke-width="2.2" stroke-linecap="round" opacity="0.3"/>')
    # front is down: the leading edge of each wing is its lower edge, the scalloped trailing edge its upper one, the
    # finger feathers spread at the tip
    wing = [(92, 112), (70, 116), (46, 112), (26, 106), (10, 100), (0, 96), (9, 91), (0, 86), (11, 84), (4, 78), (17, 78), (13, 71), (26, 76), (33, 70), (41, 77), (49, 69), (57, 76), (65, 68), (73, 75), (81, 68), (92, 78)]
    feathers = lambda m: '<path d="' + ' '.join(f'M {m(x0)} {y0} L {m(x1)} {y1}' for x0, y0, x1, y1 in [(12, 88, 30, 92), (16, 80, 34, 88), (30, 76, 40, 88), (46, 74, 52, 88), (62, 72, 66, 88), (78, 72, 80, 88)]) + '" stroke="#2E6A9A" stroke-width="2.4" stroke-linecap="round" opacity="0.32"/>'
    a.shape(poly(wing), DARK, DARK_S, inner=feathers(lambda x: x))
    a.shape(poly(mirror(wing)), DARK, DARK_S, inner=feathers(lambda x: 200 - x))
    cov = [(92, 110), (70, 113), (46, 109), (24, 102), (38, 94), (60, 95), (80, 93), (92, 92)]
    a.shape(blobpath(cov), LIGHT, LIGHT_S, drop=2, inner=gloss(58, 104, 16, 3.5, -4, 0.35))
    a.shape(blobpath(mirror(cov)), LIGHT, LIGHT_S, drop=2)
    a.shape(ell(100, 98, 16, 32), LIGHT, LIGHT_S, drop=3, inner=swirl(100, 94, 0.62, 4.5))
    a.shape(ell(100, 136, 14, 15), PALE, PALE_S, drop=3, inner=gloss(95, 130, 6, 3.5))
    a.shape(blobpath([(93, 146), (107, 146), (105, 156), (100, 163), (95, 156)], 0.6), ('#FFF1C2', '#F2C14E'), '#A8862C', drop=2, inner='<path d="M 95 152 Q 100 155 105 152" fill="none" stroke="#8A6A1E" stroke-width="1.6" opacity="0.6"/>')
    return a

# ------------------------------------------------------------------ design sketches (not in the game)
BROWN = ('#8C6448', '#6A4734'); BROWN_S = '#2E1A12'
FUR = ('#A57A58', '#86603F'); FUR_S = '#3E2416'
TAN = ('#E2C196', '#BE9668'); TAN_S = '#6A4A2A'
CLAW = ('#FBF7EA', '#D8CCB0')
def bear():
    a = Art('BEAR (design sketch, round 19, lane caster19; the designer: "make a bear model (using the bearskin berserker as reference). Should be large. Then make a spirit bear after I approve of the design"): a big brown bear seen from above, the Bearskin\'s pelt colours: a heavy shaggy body with a hump over the shoulders, short thick legs and big paws with cream claws, a round head with small round ears, a tan muzzle and a dark nose, a stub of a tail. Not in the game: the spirit bear is made from it once the design is approved. Front = DOWN (+y), centre (100,100).', scale=0.9)
    for x in (66, 134): a.shape(ell(x, 58, 17, 21, 12 if x < 100 else -12), BROWN, BROWN_S)
    a.shape(ell(100, 20, 8, 7), BROWN, BROWN_S)
    paws = []
    for x in (62, 138):
        claws = ''.join(f'<path d="{ell(x + dx, 158, 2.6, 5)}" fill="#F4EEDC"/>' for dx in (-8, -2.5, 3, 8.5))
        a.shape(ell(x, 140, 17, 21, -10 if x < 100 else 10), BROWN, BROWN_S)
        paws.append(x)
    pts = []
    for i in range(36):
        t = i / 36 * 2 * math.pi; r = 1.0 if i % 2 else 0.94
        pts.append((100 + math.cos(t) * 50 * r, 88 + math.sin(t) * 64 * r))
    a.shape(blobpath(pts, 0.9), BROWN, BROWN_S, drop=3, inner='<path d="M 76 56 L 70 70 M 124 56 L 130 70 M 70 98 L 64 112 M 130 98 L 136 112" stroke="#3E2416" stroke-width="3" stroke-linecap="round" opacity="0.35"/>')
    a.shape(blobpath([(68, 110), (76, 90), (100, 82), (124, 90), (132, 110), (122, 128), (100, 134), (78, 128)]), FUR, FUR_S, drop=2, inner=f'<path d="{ell(88, 98, 14, 6, -20)}" fill="#FFF4E0" opacity="0.22"/>')
    # claws over the front paws (after the body: the paws reach out in front of it)
    for x in paws:
        a.shape(ell(x, 152, 13, 9), BROWN, BROWN_S, drop=2, inner=''.join(f'<path d="{ell(x + dx, 158, 2.4, 4.5)}" fill="#F4EEDC"/>' for dx in (-8, -2.7, 2.7, 8)))
    for x in (72, 128):
        a.shape(ell(x, 140, 11, 10), BROWN, BROWN_S, inner=f'<path d="{ell(x, 142, 5.5, 5)}" fill="#C9A57E"/>')
    a.shape(ell(100, 152, 31, 27), FUR, FUR_S, drop=3, inner=f'<path d="{ell(90, 142, 12, 6, -20)}" fill="#FFF4E0" opacity="0.25"/>')
    a.shape(ell(100, 171, 15, 13), TAN, TAN_S, drop=2)
    a.shape(ell(100, 177, 8, 5.5), '#2B2230', inner=f'<path d="{ell(98, 175.5, 3, 1.6)}" fill="#FFFFFF" opacity="0.5"/>')
    for x in (86, 114): a.shape(ell(x, 156, 3, 3.4), '#2B2230')
    return a

SAL_BACK = ('#6F8F94', '#465F68'); SAL_S = '#1E2E34'
SAL_SIDE = ('#F2A28C', '#D8705E'); SAL_SIDE_S = '#7A2E28'
FIN = ('#8EA8AC', '#5A7278')
def salmon(spirit=False):
    back, side, fin = (LIGHT, PALE, DARK) if spirit else (SAL_BACK, SAL_SIDE, FIN)
    bs, ss, fs = (LIGHT_S, PALE_S, DARK_S) if spirit else (SAL_S, SAL_SIDE_S, SAL_S)
    note = 'SALMON (design sketch, round 19, lane caster19; the designer: "Also try a fish/salmon. Top down. Just visual."): a salmon seen from above, nose forward: a long body, a spotted dark back with the pink of its sides showing along both edges, a thin back fin down the middle, side fins, a forked tail. ' + ('In the ancestors\' pale blue, with the swirl, as a spirit. ' if spirit else 'Its own colours. ') + 'Not in the game. Front = DOWN (+y), centre (100,100).'
    a = Art(note, scale=0.9)
    a.shape(poly([(100, 46), (78, 6), (90, 10), (100, 24), (110, 10), (122, 6)]), fin, fs, inner='<path d="M 90 14 L 98 34 M 110 14 L 102 34" stroke="#1E2E34" stroke-width="2" stroke-linecap="round" opacity="0.3"/>')
    for sd in (-1, 1):
        a.shape(blobpath([(100 + sd * 15, 138), (100 + sd * 34, 152), (100 + sd * 30, 160), (100 + sd * 14, 150)], 0.6), fin, fs)
        a.shape(blobpath([(100 + sd * 10, 70), (100 + sd * 24, 80), (100 + sd * 20, 86), (100 + sd * 8, 80)], 0.6), fin, fs)
    body = [(100, 192), (111, 182), (117, 160), (119, 128), (116, 96), (110, 68), (104, 48), (100, 42), (96, 48), (90, 68), (84, 96), (81, 128), (83, 160), (89, 182)]
    spots = '' if spirit else ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#1E2E34" opacity="0.55"/>' for x, y, r in [(94, 70, 1.8), (106, 78, 2), (97, 92, 2.2), (108, 104, 1.8), (92, 112, 2), (103, 124, 2.2), (96, 138, 1.8), (107, 146, 1.6), (100, 60, 1.5), (91, 150, 1.6)])
    inner = f'<path d="{blobpath(body)}" fill="none" stroke="url(#{a.grad(*side)})" stroke-width="9"/>' + spots + (swirl(100, 116, 0.7, 4.5) if spirit else '') + f'<path d="{ell(94, 100, 6, 26, 4)}" fill="#FFFFFF" opacity="0.18"/>'
    a.shape(blobpath(body), back, bs, drop=3, inner=inner)
    a.shape(ell(100, 108, 2.6, 26), fin, fs)
    a.shape(blobpath([(100, 194), (110, 184), (113, 168), (100, 162), (87, 168), (90, 184)]), back, bs, drop=2, inner='' if spirit else '<path d="M 88 170 Q 100 176 112 170" fill="none" stroke="#1E2E34" stroke-width="2" opacity="0.4"/>')
    for sd in (-1, 1): a.shape(ell(100 + sd * 11, 178, 3.4, 3.6), '#F4F0E6', inner=f'<circle cx="{100 + sd * 11.6}" cy="178.5" r="2" fill="#2B2230"/>')
    return a

# ------------------------------------------------------------------ the Witch's cauldron, top down (in the game)
IRON = ('#5E5966', '#2E2A34'); IRON_S = '#0E0C12'
RIM = ('#7A7484', '#46414E')
BREW = ('#C6F58A', '#6FB83A'); BREW_S = '#2E6A1A'
def cauldron():
    a = Art('CAULDRON (the Witch\'s, Cursed Brew; round 19, lane caster19, the designer: "More top down cauldron. Opening more circular."): a round black iron pot seen straight from above: its fat round belly, a thick rim, a round mouth full to the brim with bubbling green brew, three stub feet and two ring handles showing past its sides. The game draws the fumes, the bubbles rising and the little fire licking out under it. One part (#body). Centre (100,100), the same seen from anywhere; drawn at 0.78 of the box: give the kind headR 61 (vr 24).', scale=0.78)
    import math as m
    for k in range(3):
        t = m.radians(90 + k * 120); a.shape(ell(100 + m.cos(t) * 64, 100 + m.sin(t) * 64, 12, 9, m.degrees(t)), IRON, IRON_S)
    for sd in (-1, 1):
        a.shape(ell(100 + sd * 72, 100, 12, 15), RIM, IRON_S, inner=f'<path d="{ell(100 + sd * 74, 100, 5, 8)}" fill="#1A1820"/>')
    a.shape(ell(100, 100, 68, 68), IRON, IRON_S, drop=3, inner=f'<path d="{ell(74, 72, 22, 9, -40)}" fill="#FFFFFF" opacity="0.18"/>')
    a.shape(ell(100, 100, 56, 56), RIM, IRON_S, drop=2)
    bubbles = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#EAFFD0" opacity="0.85"/><circle cx="{x - r * 0.3}" cy="{y - r * 0.3}" r="{r * 0.35}" fill="#FFFFFF"/>' for x, y, r in [(84, 86, 7), (114, 108, 5.5), (96, 116, 4), (118, 82, 3.5), (76, 108, 3)])
    a.shape(ell(100, 101, 46, 46), BREW, BREW_S, drop=3, inner=f'<path d="M 70 100 Q 86 88 100 100 T 130 100" fill="none" stroke="#9BE36B" stroke-width="5" opacity="0.6"/>' + bubbles)
    return a

if __name__ == '__main__':
    cauldron().write(os.path.join(ROOT, 'art', 'summons', 'cauldron.svg'))
    os.makedirs(os.path.join(ROOT, 'design', 'caster19'), exist_ok=True)
    wolf().write(os.path.join(ROOT, 'art', 'summons', 'spirit-wolf.svg'))
    eagle().write(os.path.join(ROOT, 'art', 'summons', 'spirit-eagle.svg'))
    bear().write(os.path.join(ROOT, 'design', 'caster19', 'bear.svg'))
    salmon().write(os.path.join(ROOT, 'design', 'caster19', 'salmon.svg'))
    salmon(True).write(os.path.join(ROOT, 'design', 'caster19', 'salmon-spirit.svg'))
