"""The Alchemist's pictures (round 19, lane caster19). python tools/caster19/alchemist_art.py
- art/heroes/alchemist.svg: the round flask in her hand becomes a skinny tube like the vials on her head (the designer:
  "the potions they use should look like the vials on their head. Skinny tubes. Same style but tubular"), its own part
  #arm-r-tube riding her right fist (parts.js hides it when it has just been thrown and while she is the monster); the
  game paints the brew in it (fx2 ART2.alchemist).
- art/heroes/alchemist-monster.svg: Monstrosity's altered sprite ("They should get a new altered sprite based off their
  base sprite. Purple skin."): her own picture with purple skin, no tube, big fists, the hair standing up wilder. A sketch
  for the designer's art round.
Run once on the original picture (it checks the tube isn't there yet)."""
import os, re
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
P = os.path.join(ROOT, 'art', 'heroes', 'alchemist.svg')
s = open(P, encoding='utf-8').read()

TUBE_D = 'M -6.5 -8 L 6.5 -8 L 6.5 40 C 6.5 46 3.3 49 0 49 C -3.3 49 -6.5 46 -6.5 40 Z'
TUBE = ('<g id="arm-r-tube" data-pivot="154 108">\n'
        f'<path id="tubeGlass" d="{TUBE_D}" transform="translate(148 141) rotate(10)" fill="url(#gTube)"/>'
        f'<g clip-path="url(#cTube)"><g transform="translate(148 141) rotate(10)"><rect x="-8" y="20" width="16" height="32" fill="#B9D8B0"/><rect x="-8" y="20" width="16" height="3" fill="#DDF0D4"/><rect x="-4.5" y="-6" width="2.4" height="44" rx="1.2" fill="#FFFFFF" opacity="0.6"/></g></g>'
        f'<path d="{TUBE_D}" transform="translate(148 141) rotate(10)" fill="url(#sRl)"/>\n</g>\n')

if 'arm-r-tube' not in s:
    # the round flask (neck s2, bulb s4 and its brew) out of the right arm; the tube as its own part before it
    s = s.replace('<use href="#s2" fill="url(#g1)"/><use href="#s2" fill="url(#sR)"/>\n', '', 1)
    i = s.index('<use href="#s4" fill="url(#g3)"/><g clip-path="url(#c5)">'); j = s.index('<use href="#s4" fill="url(#sRl)"/>', i) + len('<use href="#s4" fill="url(#sRl)"/>')
    s = s[:i] + s[j:]
    s = s.replace('<g id="arm-r" data-pivot="154 108">', '<!-- Round 19 (lane caster19): her potion is a skinny tube like the vials on her head, its own part (#arm-r-tube) riding her right fist; the game paints its brew. -->\n' + TUBE + '<g id="arm-r" data-pivot="154 108">', 1)
    s = s.replace('</defs>', f'<linearGradient id="gTube" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F4FAFA"/><stop offset="1" stop-color="#B6CAC8"/></linearGradient><clipPath id="cTube"><path d="{TUBE_D}" transform="translate(148 141) rotate(10)"/></clipPath>\n</defs>', 1)
    open(P, 'w', encoding='utf-8').write(s); print('tube in', P)

# ---- the monster: purple skin, no tube, big fists, wilder hair
m = open(P, encoding='utf-8').read()
i = m.index('<!-- Round 19 (lane caster19): her potion'); m = m[:i] + m[m.index('<g id="arm-r" data-pivot', i):]
SKIN = {'#F8D4B2': '#D9B6F2', '#DFA57F': '#9C6CC8', '#B07560': '#6A4290', '#D9A27F': '#9466C0', '#F2C7A0': '#C39BE6', '#F4CBA6': '#C9A2EA', '#E6B590': '#AE86D8', '#8A4E36': '#3E2260', '#5A2E2A': '#2E1848', '#C98868': '#6A3C98'}
for a, b in SKIN.items(): m = m.replace(a, b)
# big fists: each hand's rect drawn half as big again about its own middle
def fist(mo):
    x, y, w, h = map(float, mo.group(1, 2, 3, 4)); cx, cy = x + w / 2, y + h / 2; k = 1.8
    return f'<rect x="{cx - w * k / 2:.1f}" y="{cy - h * k / 2:.1f}" width="{w * k:.1f}" height="{h * k:.1f}" rx="{8 * k:.1f}"'
m = re.sub(r'<g clip-path="url\(#c\d+\)"><rect [^>]*opacity="0.28"/></g>', '', m) # (the fists' own small shadows: they no longer fit)
m = re.sub(r'<rect x="([\d.]+)" y="([\d.]+)" width="(2[04])" height="(2[15])" rx="8"', fist, m)
m = m.replace('<!-- ALCHEMIST', '<!-- ALCHEMIST AS THE MONSTER (round 19, lane caster19, Monstrosity: "They should get a new altered sprite based off their base sprite. Purple skin."): her own picture with the skin turned purple, fists nearly twice as big and empty (no potion: "Should not hold a flask"). A sketch for the art round; tools/caster19/alchemist_art.py makes it from alchemist.svg. -->\n<!-- ALCHEMIST', 1)
open(os.path.join(ROOT, 'art', 'heroes', 'alchemist-monster.svg'), 'w', encoding='utf-8').write(m); print('monster written')
