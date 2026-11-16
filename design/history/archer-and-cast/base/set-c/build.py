"""Generates base-1..4.svg (bare human heads: face, hair, hands) in the archer's rendering."""
import os
OUT = os.path.dirname(os.path.abspath(__file__))
INK = "#2B2230"

def lg(id, a, b, x2="0", y2="1"):
    return f'<linearGradient id="{id}" x1="0" y1="0" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>'

COMMON_DEFS = f'''
    <path id="shadeR" d="M100 -10 V220 H220 V-10 Z"/>
    {lg("gSkin", "#F6D0AC", "#EFC096")}
    {lg("gSkinS", "#E2AE88", "#D49B76")}
    <radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/><stop offset="1" stop-color="#DFA57F"/></radialGradient>
    <radialGradient id="gHandS" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#EBC09C"/><stop offset="1" stop-color="#CF946F"/></radialGradient>
'''

def face_grad(y0, y1):
    # archer face: warm shadow under the brim fading to skin
    return f'''<linearGradient id="gFace" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#9A6250"/><stop offset="0.36" stop-color="#C98E6C"/>
      <stop offset="0.62" stop-color="#F2C7A0"/><stop offset="1" stop-color="#F6D0AC"/></linearGradient>'''

def hair_grads(lit0, lit1, sh0, sh1, y0=20, y1=180):
    def g(id, a, b):
        return (f'<linearGradient id="{id}" x1="0" y1="{y0}" x2="{(y1-y0)*0.3:.0f}" y2="{y1}" gradientUnits="userSpaceOnUse">'
                f'<stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>')
    return g("gHair", lit0, lit1) + g("gHairS", sh0, sh1)

def split(ref, lit, shade, clip):
    return f'<use href="#{ref}" fill="url(#{lit})"/><g clip-path="url(#{clip})"><use href="#shadeR" fill="url(#{shade})"/></g>'

def hand(x, y, w, h, rx, rot=0, cx=None, cy=None):
    """Archer hand: contact shadow + rounded rect, radial skin gradient. Right-side hands use the shaded gradient."""
    cx = x + w / 2 if cx is None else cx
    cy = y + h / 2 if cy is None else cy
    g = "gHandS" if x + w / 2 > 100 else "gHand"
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    return (f'<g{t}><rect x="{x+1}" y="{y+2.5}" width="{w}" height="{h}" rx="{rx}" fill="{INK}" opacity="0.3"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="url(#{g})"/></g>')

def hand_ol(x, y, w, h, rx, rot=0, cx=None, cy=None):
    cx = x + w / 2 if cx is None else cx
    cy = y + h / 2 if cy is None else cy
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"{t}/>'

def mouth(y, w=3):
    return f'<path d="M{100-w} {y} Q100 {y+2.5} {100+w} {y}" fill="none" stroke="#C98868" stroke-width="2.5" stroke-linecap="round"/>'

SCALE = 1.1
def svg(comment, defs, outline, body, dy=0, sc=None):
    sc = SCALE if sc is None else sc
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">
  <!-- {comment} Facing = DOWN (+y). Rotate whole sprite around (100,100). -->
  <defs>{COMMON_DEFS}{defs}
  </defs>
  <g transform="translate(100 {100+dy}) scale({sc}) translate(-100 -100)">
  <g fill="{INK}" stroke="{INK}" stroke-width="{12/sc:.1f}" stroke-linejoin="round" stroke-linecap="round">
    {outline}
  </g>
  {body}
  </g>
</svg>
'''

def write(n, s):
    open(os.path.join(OUT, f'base-{n}.svg'), 'w').write(s)

# ------------------------------------------------------------------ designs
def base1():
    """MOP: round head, heavy bowl-mop of ginger-chestnut hair with three fat fringe lobes, ears out at the sides,
    fists up at the two front corners (boxer guard)."""
    defs = f'''
    <circle id="skull" cx="100" cy="116" r="56"/>
    <clipPath id="skullC"><use href="#skull"/></clipPath>
    <ellipse id="earL" cx="42" cy="134" rx="14" ry="17"/>
    <ellipse id="earR" cx="158" cy="134" rx="14" ry="17"/>
    <path id="hair" d="M22 120 C12 60 52 20 100 20 C148 20 188 60 178 120
       C172 136 152 140 140 128 C130 142 112 142 100 130 C88 142 70 142 60 128 C48 140 28 136 22 120 Z"/>
    <clipPath id="hairC"><use href="#hair"/></clipPath>
    {face_grad(124, 166)}
    {hair_grads("#C4774A", "#A85F37", "#93512F", "#7A4023")}
    '''
    H = [(44, 160, 32, 29, 12, -10), (124, 160, 32, 29, 12, 10)]
    outline = f'''<use href="#earL"/><use href="#earR"/><use href="#skull"/><use href="#hair"/>
    {''.join(hand_ol(*h) for h in H)}'''
    body = f'''
  <use href="#earL" fill="url(#gSkin)"/><use href="#earR" fill="url(#gSkinS)"/>
  <use href="#skull" fill="url(#gFace)"/>
  <g clip-path="url(#skullC)"><use href="#shadeR" fill="#8A4E36" opacity="0.14"/></g>
  {mouth(158)}
  <use href="#hair" fill="{INK}" opacity="0.25" transform="translate(0 3)"/>
  {split("hair", "gHair", "gHairS", "hairC")}
  {''.join(hand(*h) for h in H)}'''
    return svg("BASE 1 MOP.", defs, outline, body)

def base2():
    """BEAN: wide, short head; slicked-back blue-black hair with a centre part, widow's-peak hairline pointing forward,
    high open forehead, ponytail trailing behind; no ears; two hands stacked in a front grip, offset right."""
    defs = f'''
    <ellipse id="skull" cx="100" cy="110" rx="68" ry="62"/>
    <clipPath id="skullC"><use href="#skull"/></clipPath>
    <path id="hair" d="M100 36 C152 34 188 68 184 120 C182 152 176 172 164 186
       C150 176 144 154 140 134 C134 118 118 110 100 114 C82 110 66 118 60 134 C56 154 50 176 36 186
       C24 172 18 152 16 120 C12 68 48 34 100 36 Z"/>
    <clipPath id="hairC"><use href="#hair"/></clipPath>
    {face_grad(110, 158)}
    {hair_grads("#73669A", "#5C5080", "#54496F", "#41385A")}
    '''
    H = [(88, 170, 32, 28, 12, 8), (120, 178, 32, 28, 12, 8)]
    outline = f'''<use href="#skull"/><use href="#hair"/>
    {''.join(hand_ol(*h) for h in H)}'''
    body = f'''
  <use href="#skull" fill="url(#gFace)"/>
  <g clip-path="url(#skullC)"><use href="#shadeR" fill="#8A4E36" opacity="0.14"/></g>
  {mouth(152)}
  <use href="#hair" fill="{INK}" opacity="0.25" transform="translate(0 3)"/>
  {split("hair", "gHair", "gHairS", "hairC")}
  <g clip-path="url(#hairC)"><path d="M100 32 C97 56 97 86 100 114 C103 86 103 56 100 32 Z" fill="#3A3254" opacity="0.5"/></g>
  {''.join(hand(*h) for h in H)}'''
    return svg("BASE 2 CURTAINS.", defs, outline, body, dy=-16)

def base3():
    """EGG + BUN: long egg head with a narrow chin pointing forward; wheat hair pulled back tight with one big
    side-swept fringe and a round bun knotted at the back-left; big round ears; tall open mitten hands hanging at
    the flanks, angled forward."""
    defs = f'''
    <path id="skull" d="M100 22 C148 22 168 62 165 104 C162 144 134 178 100 182 C66 178 38 144 35 104 C32 62 52 22 100 22 Z"/>
    <clipPath id="skullC"><use href="#skull"/></clipPath>
    <ellipse id="earL" cx="35" cy="116" rx="16" ry="20"/>
    <ellipse id="earR" cx="165" cy="116" rx="16" ry="20"/>
    <circle id="bun" cx="70" cy="16" r="22"/>
    <clipPath id="bunC"><use href="#bun"/></clipPath>
    <path id="hair" d="M29 112 C22 56 56 16 100 16 C144 16 178 56 171 116
       C166 128 154 134 144 128 C120 118 86 118 64 98 C56 108 42 118 29 112 Z"/>
    <clipPath id="hairC"><use href="#hair"/></clipPath>
    {face_grad(104, 156)}
    {hair_grads("#EFC872", "#DFAE52", "#CF9A44", "#B98232")}
    '''
    H = [(10, 140, 30, 36, 13, 22), (160, 140, 30, 36, 13, -22)]
    outline = f'''<use href="#bun"/><use href="#earL"/><use href="#earR"/><use href="#skull"/><use href="#hair"/>
    {''.join(hand_ol(*h) for h in H)}'''
    body = f'''
  <use href="#bun" fill="url(#gHair)"/>
  <g clip-path="url(#bunC)"><use href="#hair" fill="{INK}" opacity="0.22" transform="translate(0 -3)"/></g>
  <use href="#earL" fill="url(#gSkin)"/><use href="#earR" fill="url(#gSkinS)"/>
  <use href="#skull" fill="url(#gFace)"/>
  <g clip-path="url(#skullC)"><use href="#shadeR" fill="#8A4E36" opacity="0.14"/></g>
  {mouth(160)}
  <use href="#hair" fill="{INK}" opacity="0.25" transform="translate(0 3)"/>
  {split("hair", "gHair", "gHairS", "hairC")}
  {''.join(hand(*h) for h in H)}'''
    return svg("BASE 3 EGG + BUN.", defs, outline, body, dy=9, sc=1.06)

def base4():
    """CLOUD: huge round cloud of dark-brown curls (big lobes, no spikes); small round face pushed out the front of it
    like a moon; asymmetric hands: lead fist forward-left, rear fist cocked by the right cheek."""
    import math
    lobes = []
    for a in range(-135, 136, 27):     # 0 = straight back (up)
        r = 29 if abs(a) < 130 else 26
        d = 53
        x = 100 + d * math.sin(math.radians(a)); y = 80 - d * math.cos(math.radians(a))
        lobes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}"/>')
    cloud = '<circle cx="100" cy="80" r="58"/>' + ''.join(lobes)
    defs = f'''
    <g id="cloud">{cloud}</g>
    <clipPath id="cloudC">{cloud}</clipPath>
    <circle id="face" cx="100" cy="140" r="46"/>
    <clipPath id="faceC"><use href="#face"/></clipPath>
    {face_grad(132, 176)}
    {hair_grads("#7E4E39", "#6A3F2D", "#5A3527", "#47291E")}
    '''
    H = [(38, 160, 33, 29, 12, -10), (152, 128, 31, 28, 12, 14)]
    outline = f'''<use href="#face"/><use href="#cloud"/>
    {''.join(hand_ol(*h) for h in H)}'''
    body = f'''
  <use href="#face" fill="url(#gFace)"/>
  <g clip-path="url(#faceC)"><use href="#shadeR" fill="#8A4E36" opacity="0.14"/></g>
  {mouth(176)}
  <use href="#cloud" fill="{INK}" opacity="0.25" transform="translate(0 3)"/>
  <use href="#cloud" fill="url(#gHair)"/>
  <g clip-path="url(#cloudC)"><use href="#shadeR" fill="url(#gHairS)"/></g>
  {''.join(hand(*h) for h in H)}'''
    return svg("BASE 4 CLOUD.", defs, outline, body, dy=7, sc=1.06)

for i, f in enumerate([base1, base2, base3, base4], 1):
    write(i, f())
print("ok")
