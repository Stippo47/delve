import re
base = open('/home/claude/archer/r4/peak-split-veins.svg').read()
OLD_QSHAPE = re.search(r'<g id="quiverShape".*?</g>', base, re.S).group(0)
OLD_Q = re.search(r'<!-- quiver -->\s*<g transform="rotate\(28 138 52\)">.*?</g>', base, re.S).group(0)

INK = '#2B2230'
def fletch(x, y, ang, col, shade, L=28, W=8.5, bars=None):
    """Rounded feather fletching pointing up from (x,y). Returns (silhouette, fill)."""
    vane = (f'M0 0 C{-W} -4 {-W-1.5} {-L*0.55:.1f} {-W*0.55:.1f} {-L+3} '
            f'Q0 {-L-3} {W*0.55:.1f} {-L+3} C{W+1.5} {-L*0.55:.1f} {W} -4 0 0 Z')
    right = (f'M0 0 V{-L} Q{W*0.275:.2f} {-L} {W*0.55:.2f} {-L+3} C{W+1.5} {-L*0.55:.1f} {W} -4 0 0 Z')
    t = f'translate({x} {y}) rotate({ang})'
    sil = f'<path transform="{t}" d="{vane}"/><path transform="{t}" d="M0 6 V-4" stroke-width="13"/>'
    extra = ''
    if bars:
        cid = f'v{abs(hash((x,y,ang,col)))%99999}'
        extra = (f'<clipPath id="{cid}"><path d="{vane}"/></clipPath><g clip-path="url(#{cid})">' +
                 ''.join(f'<rect x="-12" y="{b}" width="24" height="2.6" fill="{bars}"/>' for b in (-L*0.35, -L*0.62)) + '</g>')
    fill = (f'<g transform="{t}">'
            f'<path d="{vane}" fill="{INK}" opacity="0.28" transform="translate(1.5 2.5)"/>'
            f'<path d="{vane}" fill="{col}"/><path d="{right}" fill="{shade}"/>{extra}'
            f'</g>')
    return sil, fill

GREY, GREY_D = '#BFC5CD', '#9AA2AE'
WHITE, WHITE_D = '#FFF8E8', '#E3D8C2'
GREEN, GREEN_D = '#9AD17F', '#74B05E'
GOLD, GOLD_D = '#F7C552', '#D9952A'

def wrap(sil_parts, fill_parts, rot=28):
    g = f'rotate({rot} 138 52)'
    sil = f'<g id="quiverShape" transform="{g}">' + ''.join(sil_parts) + '</g>'
    fill = f'<!-- quiver -->\n  <g transform="{g}">' + ''.join(fill_parts) + '</g>'
    return sil, fill

def q1():  # classic leather tube, gold rim, 2 grey + 1 white rounded fletchings
    a = [fletch(129, 30, -12, GREY, GREY_D), fletch(147, 30, 12, GREY, GREY_D), fletch(138, 29, 0, WHITE, WHITE_D, L=31)]
    body = '<rect x="118" y="30" width="40" height="48" rx="11"/>'
    rim = '<rect x="115" y="25" width="46" height="11" rx="5"/>'
    sil = [s for s, _ in a] + [body, rim]
    fill = [f for _, f in a] + [
        '<rect x="118" y="30" width="40" height="48" rx="11" fill="url(#gQuiver)"/>',
        '<path d="M138 30 H147 A11 11 0 0 1 158 41 V67 A11 11 0 0 1 147 78 H138 Z" fill="#6E4222" opacity="0.35"/>',
        '<path d="M118 62 H158 V67 A11 11 0 0 1 147 78 H129 A11 11 0 0 1 118 67 Z" fill="#6E4222"/>',
        '<rect x="115" y="25" width="46" height="11" rx="5" fill="#F2B53A"/>',
        '<path d="M138 25 H156 A5 5 0 0 1 161 30.5 A5 5 0 0 1 156 36 H138 Z" fill="#D9952A"/>']
    return wrap(sil, fill)

def q2():  # tapered body with a folded leaf flap; 2 white + 1 green
    a = [fletch(128, 32, -16, WHITE, WHITE_D), fletch(148, 32, 14, WHITE, WHITE_D), fletch(138, 30, -2, GREY, GREY_D, L=28)]
    body = '<path d="M116 28 H160 L153 76 Q138 84 123 76 Z"/>'
    leaf = '<path d="M112 26 C126 18 152 22 164 34 C150 46 124 44 112 26 Z"/>'
    sil = [s for s, _ in a] + [body, leaf]
    fill = [f for _, f in a] + [
        '<path d="M116 28 H160 L153 76 Q138 84 123 76 Z" fill="url(#gQuiver)"/>',
        '<path d="M138 28 H160 L153 76 Q146 80 138 81 Z" fill="#6E4222" opacity="0.35"/>',
        '<path d="M112 26 C126 18 152 22 164 34 C150 46 124 44 112 26 Z" fill="#2B2230" opacity="0.3" transform="translate(1 3)"/>',
        '<path d="M112 26 C126 18 152 22 164 34 C150 46 124 44 112 26 Z" fill="#6FB563"/>',
        '<path d="M112 26 C130 30 148 32 164 34 C150 46 124 44 112 26 Z" fill="#4C8C4F"/>',
        ]
    return wrap(sil, fill)

def q3():  # wooden case with two gold bands; barred feathers
    a = [fletch(130, 30, -7, WHITE, WHITE_D, bars='#8A552C'), fletch(146, 30, 7, WHITE, WHITE_D, bars='#8A552C'),
         fletch(138, 28, 0, WHITE, WHITE_D, L=31, bars='#8A552C')]
    body = '<rect x="119" y="27" width="38" height="52" rx="7"/>'
    sil = [s for s, _ in a] + [body, '<rect x="116" y="27" width="44" height="7" rx="3"/>', '<rect x="116" y="68" width="44" height="7" rx="3"/>']
    fill = [f for _, f in a] + [
        '<rect x="119" y="27" width="38" height="52" rx="7" fill="url(#gWood)"/>',
        '<path d="M127 36 C126 46 129 56 127 66 M147 36 C149 46 146 56 148 66" fill="none" stroke="#94602F" stroke-width="2" stroke-linecap="round" opacity="0.7"/>',
        '<rect x="116" y="27" width="44" height="7" rx="3" fill="#F2B53A"/><rect x="138" y="27" width="22" height="7" rx="3" fill="#D9952A"/>',
        '<rect x="116" y="68" width="44" height="7" rx="3" fill="#F2B53A"/><rect x="138" y="68" width="22" height="7" rx="3" fill="#D9952A"/>']
    return wrap(sil, fill)

def q4():  # short round pouch with a scalloped fur cuff; wide fan, grey-white-grey
    a = [fletch(126, 38, -26, GREY, GREY_D, L=30), fletch(150, 38, 26, GREY, GREY_D, L=30), fletch(138, 35, 0, WHITE, WHITE_D, L=33)]
    bag = '<path d="M113 40 H163 C166 62 158 80 138 82 C118 80 110 62 113 40 Z"/>'
    cuff = '<path d="M110 40 Q114 31 120 36 Q125 29 131 35 Q138 28 145 35 Q151 29 156 36 Q162 31 166 40 Q162 47 156 44 Q151 49 145 45 Q138 50 131 45 Q125 49 120 44 Q114 47 110 40 Z"/>'
    sil = [s for s, _ in a] + [bag, cuff]
    fill = [f for _, f in a] + [
        '<path d="M113 40 H163 C166 62 158 80 138 82 C118 80 110 62 113 40 Z" fill="url(#gQuiver)"/>',
        '<path d="M138 40 H163 C166 62 158 80 138 82 Z" fill="#6E4222" opacity="0.35"/>',
        cuff.replace('/>', ' fill="#F2E6CC"/>'),
        '<path d="M138 31 Q145 28 145 35 Q151 29 156 36 Q162 31 166 40 Q162 47 156 44 Q151 49 145 45 Q138 50 138 47 Z" fill="#D8C8A8"/>']
    return wrap(sil, fill)

def q5():  # no case: a bundle of arrows tied with a leather wrap, heads showing at the bottom
    xs = [(126, -8, GOLD, GOLD_D), (150, 8, GOLD, GOLD_D), (132, -3, GREEN, GREEN_D), (144, 3, WHITE, WHITE_D)]
    a = [fletch(x, 30, ang, c, d, L=26, W=7.5) for x, ang, c, d in xs]
    shafts_sil = ''.join(f'<path d="M{x} 30 L{x + (0 if ang==0 else ang*0.15):.1f} 80" stroke-width="13"/>' for x, ang, _, _ in xs)
    heads = ''.join(f'<path d="M{x-5} 78 L{x} 90 L{x+5} 78 Z"/>' for x in (129, 138, 147))
    wrapband = '<rect x="118" y="48" width="40" height="13" rx="5"/>'
    sil = [s for s, _ in a] + [shafts_sil, heads, wrapband]
    fill = ([f'<path d="M{x} 30 L{x + (0 if ang==0 else ang*0.15):.1f} 80" stroke="#A0683A" stroke-width="4" stroke-linecap="round"/>' for x, ang, _, _ in xs] +
            [f for _, f in a] +
            [heads.replace('Z"/>', 'Z" fill="url(#gSteel)"/>'),
             '<rect x="118" y="48" width="40" height="13" rx="5" fill="url(#gGrip)"/>',
             '<rect x="138" y="48" width="20" height="13" rx="5" fill="#5E261D" opacity="0.4"/>',
             '<path d="M120 58 C112 64 110 72 114 78" fill="none" stroke="#2B2230" stroke-width="7" stroke-linecap="round"/>',
             '<path d="M120 58 C112 64 110 72 114 78" fill="none" stroke="#A44A39" stroke-width="3.5" stroke-linecap="round"/>'])
    return wrap(sil, fill)

def q6():  # q1 body, one darker feather behind, two light in front
    DARK, DARK_D = '#DACCB0', '#BFAE8E'
    a = [fletch(138, 28, 0, DARK, DARK_D, L=32), fletch(130, 31, -13, WHITE, WHITE_D), fletch(146, 31, 13, WHITE, WHITE_D)]
    sil0, fill0 = q1()
    body_fill = re.search(r'<rect x="118" y="30".*', fill0).group(0)
    body_fill = body_fill[:body_fill.rfind('</g>')]
    sil = [x for x, _ in a] + ['<rect x="118" y="30" width="40" height="48" rx="11"/>', '<rect x="115" y="25" width="46" height="11" rx="5"/>']
    return wrap(sil, [f for _, f in a] + [body_fill])

out = []
for i, q in enumerate([q1, q2, q3, q4, q5, q6], 1):
    sil, fill = q()
    s = base.replace(OLD_QSHAPE, sil).replace(OLD_Q, fill)
    n = f'quiver-{i}.svg'; open(n, 'w').write(s); out.append(n)
print(' '.join(out))
