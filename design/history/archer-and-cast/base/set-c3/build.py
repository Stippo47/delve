"""Generates base-1..4.svg (bare human heads: face, hair, hands) in the archer's rendering.
Round 2: heads are drawn in a roomy design space, then scaled down so the bare head fits the archer's HOOD
footprint (~118 wide x ~140 tall, x 41..159, y 14..155). Hands are drawn unscaled at archer size (~24x21)."""
import os, math
OUT = os.path.dirname(os.path.abspath(__file__))
INK = "#2B2230"

def lg(id, a, b, x2="0", y2="1"):
    return f'<linearGradient id="{id}" x1="0" y1="0" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>'

COMMON_DEFS = f'''
    <path id="shadeR" d="M100 -40 V240 H240 V-40 Z"/>
    <rect id="all" x="-40" y="-40" width="280" height="280"/>
    {lg("gSkin", "#F6D0AC", "#EFC096")}
    {lg("gSkinS", "#E2AE88", "#D49B76")}
    <linearGradient id="gFaceSoft" x1="92" y1="0" x2="162" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8A4E36" stop-opacity="0"/><stop offset="1" stop-color="#8A4E36" stop-opacity="0.26"/></linearGradient>
    <radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/><stop offset="1" stop-color="#DFA57F"/></radialGradient>
'''

def face_grad(y0, y1):
    # archer face: warm shadow under the brim fading to skin
    return f'''<linearGradient id="gFace" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#9A6250"/><stop offset="0.36" stop-color="#C98E6C"/>
      <stop offset="0.62" stop-color="#F2C7A0"/><stop offset="1" stop-color="#F6D0AC"/></linearGradient>'''

def hair_grads(lit0, lit1, sh0, sh1, y0=20, y1=180, soft=(84, 170)):
    def g(id, a, b):
        return (f'<linearGradient id="{id}" x1="0" y1="{y0}" x2="{(y1-y0)*0.3:.0f}" y2="{y1}" gradientUnits="userSpaceOnUse">'
                f'<stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>')
    soft_g = (f'<linearGradient id="gHairSoft" x1="{soft[0]}" y1="0" x2="{soft[1]}" y2="0" gradientUnits="userSpaceOnUse">'
              f'<stop offset="0" stop-color="{sh1}" stop-opacity="0"/><stop offset="1" stop-color="{sh1}" stop-opacity="0.9"/></linearGradient>')
    return g("gHair", lit0, lit1) + g("gHairS", sh0, sh1) + soft_g

def split(ref, clip):
    """Archer's hard centre split: lit left, shaded right, seam at x=100."""
    return f'<use href="#{ref}" fill="url(#gHair)"/><g clip-path="url(#{clip})"><use href="#shadeR" fill="url(#gHairS)"/></g>'

def soft(ref, clip):
    """Soft alternative: lit gradient with a shadow that builds up toward the right edge."""
    return f'<use href="#{ref}" fill="url(#gHair)"/><g clip-path="url(#{clip})"><use href="#all" fill="url(#gHairSoft)"/></g>'

def skin(ref, clip, hard=False):
    shade = '<use href="#shadeR" fill="#8A4E36" opacity="0.14"/>' if hard else '<use href="#all" fill="url(#gFaceSoft)"/>'
    return f'<use href="#{ref}" fill="url(#gFace)"/><g clip-path="url(#{clip})">{shade}</g>'

# hands: archer size, rounded rects. (x, y, w, h, rx, rot)
def hand(x, y, w=24, h=21, rx=8, rot=0):
    cx, cy = x + w / 2, y + h / 2
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    return (f'<g{t}><rect x="{x+1}" y="{y+2}" width="{w}" height="{h}" rx="{rx}" fill="{INK}" opacity="0.3"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="url(#gHand)"/></g>')

def hand_ol(x, y, w=24, h=21, rx=8, rot=0):
    cx, cy = x + w / 2, y + h / 2
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"{t}/>'

def mouth(y, w=3.6):
    # drawn in head space, so it is a little thicker to survive the down-scale
    return f'<path d="M{100-w} {y} Q100 {y+3} {100+w} {y}" fill="none" stroke="#C98868" stroke-width="3.3" stroke-linecap="round"/>'

def svg(comment, defs, outline, body, hands, s, cy, Y):
    """Head (outline+body) is scaled by s about design point (100,cy) and placed at (100,Y). Hands are unscaled."""
    T = f'translate(100 {Y}) scale({s}) translate(-100 {-cy})'
    hs = [hand_ol(*h) for h in hands]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">
  <!-- {comment} Facing = DOWN (+y). Rotate whole sprite around (100,100). -->
  <defs>{COMMON_DEFS}{defs}
  </defs>
  <g fill="{INK}" stroke="{INK}" stroke-linejoin="round" stroke-linecap="round">
    <g transform="{T}" stroke-width="{12/s:.2f}">{outline}</g>
    <g stroke-width="12">{''.join(hs)}</g>
  </g>
  <g transform="{T}">{body}
  </g>
  {''.join(hand(*h) for h in hands)}
</svg>
'''

def write(n, s):
    open(os.path.join(OUT, f'base-{n}.svg'), 'w').write(s)

# ------------------------------------------------------------------ designs
def base1():
    """MOP (soft gradient): round head under a heavy bowl-mop with three fat fringe lobes; ears out at the lower sides;
    fists up just in front of the chin corners (boxer guard). Hair uses the archer's hard split."""
    defs = f'''
    <circle id="skull" cx="100" cy="114" r="56"/>
    <clipPath id="skullC"><use href="#skull"/></clipPath>
    <ellipse id="earL" cx="40" cy="132" rx="16" ry="19"/>
    <ellipse id="earR" cx="160" cy="132" rx="16" ry="19"/>
    <path id="hair" d="M24 118 C14 60 52 20 100 20 C148 20 186 60 176 118
       C170 134 152 138 140 126 C130 140 112 140 100 128 C88 140 70 140 60 126 C48 138 30 134 24 118 Z"/>
    <clipPath id="hairC"><use href="#hair"/></clipPath>
    {face_grad(120, 164)}
    {hair_grads("#C4774A", "#A85F37", "#93512F", "#7A4023")}
    '''
    outline = '<use href="#earL"/><use href="#earR"/><use href="#skull"/><use href="#hair"/>'
    body = f'''
  <use href="#earL" fill="url(#gSkin)"/><use href="#earR" fill="url(#gSkinS)"/>
  {skin("skull", "skullC")}
  {mouth(155)}
  <use href="#hair" fill="{INK}" opacity="0.25" transform="translate(0 4)"/>
  {soft("hair", "hairC")}'''
    hands = [(58, 142, 24, 21, 8, -12), (118, 142, 24, 21, 8, 12)]
    return svg("BASE 1 MOP.", defs, outline, body, hands, s=0.72, cy=96, Y=88)

def base2():
    """CURTAINS: wide head; centre-parted hair falling in two long curtains to the front corners, framing a
    narrow face window; no ears; two hands stacked in a front grip, right of centre. Hard split on the part."""
    defs = f'''
    <ellipse id="skull" cx="100" cy="110" rx="68" ry="62"/>
    <clipPath id="skullC"><use href="#skull"/></clipPath>
    <path id="hair" d="M100 36 C152 34 188 68 184 120 C182 152 176 172 164 186
       C150 176 144 154 140 134 C134 118 118 110 100 114 C82 110 66 118 60 134 C56 154 50 176 36 186
       C24 172 18 152 16 120 C12 68 48 34 100 36 Z"/>
    <clipPath id="hairC"><use href="#hair"/></clipPath>
    {face_grad(110, 158)}
    {hair_grads("#77699E", "#605484", "#574B73", "#43395C")}
    '''
    outline = '<use href="#skull"/><use href="#hair"/>'
    body = f'''
  {skin("skull", "skullC")}
  {mouth(152)}
  <use href="#hair" fill="{INK}" opacity="0.25" transform="translate(0 4)"/>
  {soft("hair", "hairC")}
  <g clip-path="url(#hairC)"><path d="M100 32 C97 56 97 86 100 114 C103 86 103 56 100 32 Z" fill="#3A3254" opacity="0.5"/></g>'''
    hands = [(92, 146, 24, 21, 8, 8), (110, 158, 24, 21, 8, 8)]
    return svg("BASE 2 CURTAINS.", defs, outline, body, hands, s=0.70, cy=110, Y=92)

def base3():
    """EGG + BUN: long egg head, narrow chin pointing forward; hair pulled back tight with one big side-swept
    fringe and a round bun at the back-left; big round ears; open hands hanging at the flanks, angled forward.
    Soft shading (no centre split)."""
    defs = f'''
    <path id="skull" d="M100 22 C148 22 168 62 165 104 C162 144 134 178 100 182 C66 178 38 144 35 104 C32 62 52 22 100 22 Z"/>
    <clipPath id="skullC"><use href="#skull"/></clipPath>
    <ellipse id="earL" cx="37" cy="116" rx="14" ry="18"/>
    <ellipse id="earR" cx="163" cy="116" rx="14" ry="18"/>
    <circle id="bun" cx="68" cy="14" r="25"/>
    <clipPath id="bunC"><use href="#bun"/></clipPath>
    <path id="hair" d="M29 112 C22 56 56 16 100 16 C144 16 178 56 171 116
       C166 128 154 134 144 128 C120 118 86 118 64 98 C56 108 42 118 29 112 Z"/>
    <clipPath id="hairC"><use href="#hair"/></clipPath>
    {face_grad(104, 156)}
    {hair_grads("#F0CB76", "#E0B054", "#CF9A44", "#B07A2C")}
    '''
    outline = '<use href="#bun"/><use href="#earL"/><use href="#earR"/><use href="#skull"/><use href="#hair"/>'
    body = f'''
  {soft("bun", "bunC")}
  <g clip-path="url(#bunC)"><use href="#hair" fill="{INK}" opacity="0.22" transform="translate(0 -4)"/></g>
  <use href="#earL" fill="url(#gSkin)"/><use href="#earR" fill="url(#gSkinS)"/>
  {skin("skull", "skullC")}
  {mouth(160)}
  <use href="#hair" fill="{INK}" opacity="0.25" transform="translate(0 4)"/>
  {soft("hair", "hairC")}'''
    hands = [(32, 134, 21, 25, 8, 22), (147, 134, 21, 25, 8, -22)]
    return svg("BASE 3 EGG + BUN.", defs, outline, body, hands, s=0.70, cy=92, Y=88)

def base4():
    """CLOUD: big round cloud of curls (big lobes, no spikes); small round face pushed out the front like a moon;
    asymmetric hands: lead fist forward-left, rear fist cocked by the right cheek. Soft shading."""
    lobes = []
    for a in range(-135, 136, 27):     # 0 = straight back (up)
        r = 25 if abs(a) < 130 else 22
        d = 46
        x = 100 + d * math.sin(math.radians(a)); y = 80 - d * math.cos(math.radians(a))
        lobes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}"/>')
    cloud = '<circle cx="100" cy="80" r="50"/>' + ''.join(lobes)
    defs = f'''
    <g id="cloud">{cloud}</g>
    <clipPath id="cloudC">{cloud}</clipPath>
    <circle id="face" cx="100" cy="136" r="54"/>
    <clipPath id="faceC"><use href="#face"/></clipPath>
    {face_grad(124, 178)}
    {hair_grads("#9E6A4C", "#82543A", "#6A4230", "#563222", soft=(70, 180))}
    '''
    outline = '<use href="#face"/><use href="#cloud"/>'
    body = f'''
  {skin("face", "faceC")}
  {mouth(176)}
  <use href="#cloud" fill="{INK}" opacity="0.25" transform="translate(0 4)"/>
  {soft("cloud", "cloudC")}'''
    hands = [(54, 148, 24, 21, 8, -10), (140, 116, 24, 21, 8, 14)]
    return svg("BASE 4 CLOUD.", defs, outline, body, hands, s=0.75, cy=100, Y=86)

for i, f in enumerate([base1, base2, base3, base4], 1):
    write(i, f())
print("ok")
