"""Set C4: ADULT base humans (base-1 Mop, base-2 Curtains, base-3 Egg + Bun).
Heads are drawn in head space and scaled into the archer's hood footprint. A plain linen shoulder mass is drawn
in sprite space under the head so the head is no longer the whole body. Hands are small and flat (archer size or
a bit less). Faces use the archer's soft side gradient (no hard split)."""
import os
OUT = os.path.dirname(os.path.abspath(__file__))
INK = "#2B2230"

COMMON_DEFS = f'''
    <rect id="all" x="-40" y="-40" width="280" height="280"/>
    <linearGradient id="gSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6D0AC"/><stop offset="1" stop-color="#EFC096"/></linearGradient>
    <linearGradient id="gSkinS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2AE88"/><stop offset="1" stop-color="#D49B76"/></linearGradient>
    <linearGradient id="gFaceSoft" x1="88" y1="0" x2="162" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8A4E36" stop-opacity="0"/><stop offset="1" stop-color="#8A4E36" stop-opacity="0.28"/></linearGradient>
    <radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/><stop offset="1" stop-color="#DFA57F"/></radialGradient>
    <linearGradient id="gCloth" x1="0" y1="92" x2="0" y2="162" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#BBA47F"/><stop offset="1" stop-color="#9E8865"/></linearGradient>
    <linearGradient id="gClothSoft" x1="90" y1="0" x2="182" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7C6A50" stop-opacity="0"/><stop offset="1" stop-color="#7C6A50" stop-opacity="0.55"/></linearGradient>
'''

def face_grad(y0, y1):
    return f'''<linearGradient id="gFace" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#9A6250"/><stop offset="0.34" stop-color="#C98E6C"/>
      <stop offset="0.6" stop-color="#F2C7A0"/><stop offset="1" stop-color="#F6D0AC"/></linearGradient>'''

def hair_grads(lit0, lit1, sh, y0=20, y1=180, soft=(84, 172)):
    return (f'<linearGradient id="gHair" x1="0" y1="{y0}" x2="{(y1-y0)*0.3:.0f}" y2="{y1}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{lit0}"/><stop offset="1" stop-color="{lit1}"/></linearGradient>'
            f'<linearGradient id="gHairSoft" x1="{soft[0]}" y1="0" x2="{soft[1]}" y2="0" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{sh}" stop-opacity="0"/><stop offset="1" stop-color="{sh}" stop-opacity="0.9"/></linearGradient>')

def soft(ref, clip):
    return f'<use href="#{ref}" fill="url(#gHair)"/><g clip-path="url(#{clip})"><use href="#all" fill="url(#gHairSoft)"/></g>'

def skin(ref, clip):
    return f'<use href="#{ref}" fill="url(#gFace)"/><g clip-path="url(#{clip})"><use href="#all" fill="url(#gFaceSoft)"/></g>'

def hand(x, y, w=22, h=18, rx=7, rot=0):
    cx, cy = x + w / 2, y + h / 2
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    return (f'<g{t}><rect x="{x+1}" y="{y+2}" width="{w}" height="{h}" rx="{rx}" fill="{INK}" opacity="0.3"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="url(#gHand)"/></g>')

def hand_ol(x, y, w=22, h=18, rx=7, rot=0):
    cx, cy = x + w / 2, y + h / 2
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"{t}/>'

def mouth(y, w=4.2, x=100):
    return f'<path d="M{x-w} {y} Q{x} {y+2.6} {x+w} {y}" fill="none" stroke="#C48466" stroke-width="3.2" stroke-linecap="round"/>'

def shoulders(d):
    """Plain linen shoulder/collar mass in sprite space, under the head."""
    defs = f'<path id="sh" d="{d}"/><clipPath id="shC"><use href="#sh"/></clipPath>'
    body = (f'<use href="#sh" fill="url(#gCloth)"/>'
            f'<g clip-path="url(#shC)"><use href="#all" fill="url(#gClothSoft)"/></g>')
    return defs, '<use href="#sh"/>', body

def svg(comment, defs, outline, body, hands, s, cy, Y, sh):
    T = f'translate(100 {Y}) scale({s}) translate(-100 {-cy})'
    sdefs, sol, sbody = shoulders(sh)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">
  <!-- {comment} Facing = DOWN (+y). Rotate whole sprite around (100,100). -->
  <defs>{COMMON_DEFS}{sdefs}{defs}
  </defs>
  <g fill="{INK}" stroke="{INK}" stroke-linejoin="round" stroke-linecap="round">
    <g stroke-width="12">{sol}</g>
    <g transform="{T}" stroke-width="{12/s:.2f}">{outline}</g>
    <g stroke-width="12">{''.join(hand_ol(*h) for h in hands)}</g>
  </g>
  {sbody}
  <g transform="{T}">{body}
  </g>
  {''.join(hand(*h) for h in hands)}
</svg>
'''

def write(n, s):
    open(os.path.join(OUT, f'base-{n}.svg'), 'w').write(s)

# jaw: longer than wide, flat-ish cheek planes angling into a defined, slightly squared chin
JAW = "M100 28 C142 28 162 60 161 100 C160 128 154 148 140 164 C130 176 116 184 100 184 C84 184 70 176 60 164 C46 148 40 128 39 100 C38 60 58 28 100 28 Z"

def base1():
    """MOP, adult: shaggy chestnut mop worn higher and swept slightly right (uneven lobes), long face with a squared
    jaw and a soft stubble shadow on the jaw; ears show below the hair; broad shoulders; fists up front."""
    defs = f'''
    <path id="skull" d="{JAW}"/>
    <clipPath id="skullC"><use href="#skull"/></clipPath>
    <ellipse id="earL" cx="40" cy="116" rx="13" ry="17"/>
    <ellipse id="earR" cx="160" cy="116" rx="13" ry="17"/>
    <path id="hair" d="M26 104 C16 52 52 14 102 14 C150 14 186 50 176 102
       C172 116 158 120 148 108 C140 122 120 122 112 106 C102 118 82 118 76 102 C68 114 54 116 48 104 C42 112 30 114 26 104 Z"/>
    <clipPath id="hairC"><use href="#hair"/></clipPath>
    <linearGradient id="gStub" x1="0" y1="128" x2="0" y2="184" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8A5A44" stop-opacity="0"/><stop offset="0.45" stop-color="#8A5A44" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#8A5A44" stop-opacity="0.3"/></linearGradient>
    {face_grad(104, 150)}
    {hair_grads("#C27A4C", "#A55E37", "#6E3A20")}
    '''
    outline = '<use href="#earL"/><use href="#earR"/><use href="#skull"/><use href="#hair"/>'
    body = f'''
  <use href="#earL" fill="url(#gSkin)"/><use href="#earR" fill="url(#gSkinS)"/>
  {skin("skull", "skullC")}
  <g clip-path="url(#skullC)"><path d="M40 126 C50 150 64 166 76 168 C88 172 112 172 124 168 C136 166 150 150 160 126 V200 H40 Z" fill="url(#gStub)"/></g>
  {mouth(150)}
  <use href="#hair" fill="{INK}" opacity="0.25" transform="translate(0 4)"/>
  {soft("hair", "hairC")}'''
    hands = [(52, 152, 22, 18, 7, -10), (126, 152, 22, 18, 7, 10)]
    sh = "M18 124 C16 106 32 96 54 98 C74 100 126 100 146 98 C168 96 184 106 182 124 C180 150 164 158 148 154 C128 148 72 148 52 154 C36 158 20 150 18 124 Z"
    return svg("BASE 1 MOP (adult).", defs, outline, body, hands, s=0.72, cy=99, Y=86, sh=sh)

def base2():
    """CURTAINS, adult: off-centre wide soft part, hair falls in two curtains to the jaw (left narrower than right),
    long narrow face with a defined chin; sloped shoulders; two hands stacked in a front grip right of centre."""
    defs = f'''
    <path id="skull" d="M100 32 C138 32 156 62 156 100 C156 130 150 152 136 168 C126 180 113 188 100 188 C87 188 74 180 64 168 C50 152 44 130 44 100 C44 62 62 32 100 32 Z"/>
    <clipPath id="skullC"><use href="#skull"/></clipPath>
    <path id="hair" d="M92 22 C150 18 182 58 180 114 C178 142 172 158 160 168
       C152 156 148 138 144 120 C138 100 118 90 92 94 C76 94 62 104 58 122 C54 140 50 156 42 166
       C28 156 20 138 20 112 C20 58 46 24 92 22 Z"/>
    <clipPath id="hairC"><use href="#hair"/></clipPath>
    <linearGradient id="gPart" x1="76" y1="0" x2="108" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2F2845" stop-opacity="0"/><stop offset="0.5" stop-color="#2F2845" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#2F2845" stop-opacity="0"/></linearGradient>
    {face_grad(98, 146)}
    {hair_grads("#7A6CA0", "#605486", "#3C3352")}
    '''
    outline = '<use href="#skull"/><use href="#hair"/>'
    body = f'''
  {skin("skull", "skullC")}
  {mouth(152)}
  <use href="#hair" fill="{INK}" opacity="0.25" transform="translate(0 4)"/>
  {soft("hair", "hairC")}
  <g clip-path="url(#hairC)"><path d="M78 14 C82 40 84 70 84 96 L100 96 C100 70 102 40 106 14 Z" fill="url(#gPart)"/></g>'''
    hands = [(96, 158, 22, 18, 7, 8), (112, 170, 22, 18, 7, 8)]
    sh = "M28 130 C26 112 42 102 64 104 C84 106 116 106 136 104 C158 102 174 112 172 130 C170 152 154 160 138 156 C118 150 82 150 62 156 C46 160 30 152 28 130 Z"
    return svg("BASE 2 CURTAINS (adult).", defs, outline, body, hands, s=0.70, cy=104, Y=88, sh=sh)

def base3():
    """EGG + BUN, adult: kept the liked design (bun back-left, side-swept wheat fringe, round ears, hands at the
    flanks) but with a higher fringe, a longer face below it and a squared chin; shoulders under the head; smaller
    flatter hands."""
    defs = f'''
    <path id="skull" d="M100 22 C148 22 166 60 165 100 C164 130 154 152 138 168 C126 180 113 186 100 186 C87 186 74 180 62 168 C46 152 36 130 35 100 C34 60 52 22 100 22 Z"/>
    <clipPath id="skullC"><use href="#skull"/></clipPath>
    <ellipse id="earL" cx="37" cy="112" rx="13" ry="17"/>
    <ellipse id="earR" cx="163" cy="112" rx="13" ry="17"/>
    <circle id="bun" cx="68" cy="14" r="25"/>
    <clipPath id="bunC"><use href="#bun"/></clipPath>
    <path id="hair" d="M29 102 C22 50 56 14 100 14 C144 14 178 50 171 104
       C166 114 156 118 146 112 C122 102 88 102 66 86 C58 96 42 106 29 102 Z"/>
    <clipPath id="hairC"><use href="#hair"/></clipPath>
    {face_grad(92, 140)}
    {hair_grads("#F0CB76", "#E0B054", "#B07A2C")}
    '''
    outline = '<use href="#bun"/><use href="#earL"/><use href="#earR"/><use href="#skull"/><use href="#hair"/>'
    body = f'''
  {soft("bun", "bunC")}
  <g clip-path="url(#bunC)"><use href="#hair" fill="{INK}" opacity="0.22" transform="translate(0 -4)"/></g>
  <use href="#earL" fill="url(#gSkin)"/><use href="#earR" fill="url(#gSkinS)"/>
  {skin("skull", "skullC")}
  {mouth(152)}
  <use href="#hair" fill="{INK}" opacity="0.25" transform="translate(0 4)"/>
  {soft("hair", "hairC")}'''
    hands = [(22, 140, 18, 22, 7, 18), (160, 140, 18, 22, 7, -18)]
    sh = "M22 126 C20 108 36 98 58 100 C78 102 122 102 142 100 C164 98 180 108 178 126 C176 150 160 158 144 154 C124 148 76 148 56 154 C40 158 24 150 22 126 Z"
    return svg("BASE 3 EGG + BUN (adult).", defs, outline, body, hands, s=0.70, cy=92, Y=86, sh=sh)

for i, f in enumerate([base1, base2, base3], 1):
    write(i, f())
print("ok")
