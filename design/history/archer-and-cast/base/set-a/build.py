"""Builds base-1..4.svg. Shared rendering lib matching the archer: one heavy outline under all shapes,
split lit-left/shade-right, soft vertical gradients, contact shadows, no inner lines, no eyes."""
OUT = '#2B2230'

class S:
    def __init__(s, name, note):
        s.name, s.note = name, note
        s.defs, s.sil, s.body = [], [], []
        s.n = 0
    def uid(s, p):
        s.n += 1; return f'{p}{s.n}'
    def lg(s, c1, c2, x2=0.35, units=None):
        i = s.uid('g')
        if units:  # (y1,y2) user space
            s.defs.append(f'<linearGradient id="{i}" x1="0" y1="{units[0]}" x2="0" y2="{units[1]}" gradientUnits="userSpaceOnUse">' +
                          ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in c1) + '</linearGradient>')
        else:
            s.defs.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>')
        return f'url(#{i})'
    def shape(s, el, sil=True):
        """el: svg element string WITHOUT fill (e.g. '<path d=".."/>'). returns id"""
        i = s.uid('s')
        s.defs.append(el.replace('/>', f' id="{i}"/>', 1))
        s.defs.append(f'<clipPath id="{i}c"><use href="#{i}"/></clipPath>')
        if sil: s.sil.append(f'<use href="#{i}"/>')
        return i
    def part(s, i, lit, shade, cast=None, cast_dy=3, cast_op=0.28, cast_clip=None, split=True):
        """draw shape id i: optional cast shadow (onto whatever is below), lit fill, right half shade."""
        if cast:
            g = f'<use href="#{i}" fill="{cast}" opacity="{cast_op}" transform="translate(0 {cast_dy})"/>'
            if cast_clip: g = f'<g clip-path="url(#{cast_clip}c)">{g}</g>'
            s.body.append(g)
        s.body.append(f'<use href="#{i}" fill="{lit}"/>')
        if split and shade:
            s.body.append(f'<g clip-path="url(#R)"><use href="#{i}" fill="{shade}"/></g>')
    def raw(s, x): s.body.append(x)
    def hand(s, x, y, w, h, rx=8, rot=0):
        t = f' transform="rotate({rot} {x+w/2} {y+h/2})"' if rot else ''
        i = s.shape(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"{t}/>')
        s.body.append(f'<g transform="translate(0 2.5)"><rect x="{x+1}" y="{y}" width="{w-2}" height="{h}" rx="{rx}" fill="{OUT}" opacity="0.3"{t}/></g>')
        s.body.append(f'<use href="#{i}" fill="url(#gHand)"/>')
        return i
    def mouth(s, y, w=3, x=100):
        s.body.append(f'<path d="M{x-w} {y} Q{x} {y+2.5} {x+w} {y}" fill="none" stroke="#C98868" stroke-width="2.5" stroke-linecap="round"/>')
    def svg(s):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n'
                f'  <!-- BASE HUMAN {s.name}: {s.note} Facing = DOWN (+y). Rotate whole sprite around (100,100). -->\n'
                '  <defs>\n    <clipPath id="R"><rect x="100" y="-10" width="120" height="230"/></clipPath>\n'
                '    <radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/><stop offset="1" stop-color="#DFA57F"/></radialGradient>\n    '
                + '\n    '.join(s.defs) + '\n  </defs>\n'
                f'  <g fill="{OUT}" stroke="{OUT}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">\n    '
                + '\n    '.join(s.sil) + '\n  </g>\n  ' + '\n  '.join(s.body) + '\n</svg>\n')

SKIN_L = ('#F4CBA5', '#EAB78F'); SKIN_S = ('#DDA982', '#CE9671')
def skin(s, x2=0.2): return s.lg(*SKIN_L, x2=x2), s.lg(*SKIN_S, x2=x2)
def face_grad(s, y0, y1, shadow='#AD725A'):
    # archer face: warm shadow under the brim fading into skin
    return s.lg([(0, shadow), (0.22, '#D59D7A'), (0.48, '#F2C7A0'), (1, '#F6D0AC')], None, units=(y0, y1))

builds = {}
def reg(f): builds[f.__name__] = f; return f

# ---------------------------------------------------------------- 1: ROUND / BOWL
@reg
def base1():
    s = S('1 "Bowl"', 'big round skull, brown bowl cut with a chunky scalloped fringe and a small round bun at the crown, face is the lower crescent; small round ears tucked under the sideburns; fists raised at both front corners.')
    HL, HS = s.lg('#8C5A3A', '#714429'), s.lg('#653C25', '#52301D')
    sl, ss = skin(s)
    ears = [s.shape('<ellipse cx="31" cy="124" rx="12" ry="15"/>'), s.shape('<ellipse cx="169" cy="124" rx="12" ry="15"/>')]
    head = s.shape('<circle cx="100" cy="98" r="70"/>')
    tuft = s.shape('<path d="M84 30 C80 12 92 0 110 -2 C124 -2 132 8 126 18 C120 26 116 30 118 36 Z"/>')
    hair = s.shape('<path d="M24 122 C14 96 18 52 46 32 C64 18 82 14 100 14 C118 14 136 18 154 32 C182 52 186 96 176 122 C170 132 156 132 150 120 C146 110 140 104 132 104 C126 112 114 114 108 106 C104 100 96 100 92 106 C86 114 74 112 68 104 C60 104 54 110 50 120 C44 132 30 132 24 122 Z"/>')
    s.part(ears[0], sl, None, split=False); s.part(ears[1], ss, None, split=False)
    s.part(head, face_grad(s, 104, 168), '#8A4E36', split=False)
    s.raw(f'<g clip-path="url(#R)"><use href="#{head}" fill="#8A4E36" opacity="0.14"/></g>')
    s.part(tuft, HS, None, split=False)
    s.part(hair, HL, HS, cast='#3A1F12', cast_dy=4, cast_op=0.35)
    s.mouth(156)
    s.hand(38, 150, 26, 23); s.hand(136, 150, 26, 23)
    return s

# ---------------------------------------------------------------- 2: EGG / SWEPT TAIL
@reg
def base2():
    s = S('2 "Swept"', 'narrow egg-shaped head, blonde hair with one heavy side-swept fringe lock over the brow, the rest combed back into a thick rounded tail trailing back-right; small neat ears; both hands angled together at front-left like a two-handed grip.')
    HL, HS = s.lg('#F4D27A', '#E2AE4C'), s.lg('#D69C3A', '#BC8130')
    sl, ss = skin(s)
    ears = [s.shape('<ellipse cx="42" cy="120" rx="9" ry="13"/>'), s.shape('<ellipse cx="158" cy="120" rx="9" ry="13"/>')]
    head = s.shape('<path d="M100 32 C142 32 162 70 162 110 C162 150 134 176 100 176 C66 176 38 150 38 110 C38 70 58 32 100 32 Z"/>')
    tail = s.shape('<path d="M112 36 C120 18 136 4 156 2 C172 2 180 14 174 26 C168 38 154 42 146 54 Z"/>')
    hair = s.shape('<path d="M38 118 C28 74 50 30 100 26 C150 30 170 74 160 112 C152 98 142 88 130 86 C124 96 116 102 106 104 C104 98 102 94 98 92 C92 104 84 112 72 116 C66 126 56 134 46 136 C44 130 40 126 38 118 Z"/>')
    s.part(ears[0], sl, None, split=False); s.part(ears[1], ss, None, split=False)
    s.part(tail, HS, None, split=False)
    s.part(head, face_grad(s, 96, 176), None, split=False)
    s.raw(f'<g clip-path="url(#R)"><use href="#{head}" fill="#8A4E36" opacity="0.14"/></g>')
    s.part(hair, HL, HS, cast='#7A4A20', cast_dy=5, cast_op=0.35)
    s.mouth(160)
    s.hand(46, 152, 25, 22, rot=-35); s.hand(66, 170, 25, 22, rot=-35)
    return s

# ---------------------------------------------------------------- 3: SQUARE / CROP
@reg
def base3():
    s = S('3 "Crop"', 'broad squarish head and wide jaw, short tufty copper crop with a blunt three-point fringe, cut high above big jug ears; heavy square fists held out wide at the front corners.')
    HL, HS = s.lg('#E3823F', '#CC672C'), s.lg('#B6522A', '#97401F')
    sl, ss = skin(s)
    ears = [s.shape('<rect x="12" y="88" width="30" height="40" rx="14"/>'), s.shape('<rect x="158" y="88" width="30" height="40" rx="14"/>')]
    head = s.shape('<rect x="30" y="34" width="140" height="134" rx="52"/>')
    hair = s.shape('<path d="M34 102 C26 80 26 60 36 46 C34 34 44 24 56 26 C62 14 78 12 86 20 C94 10 106 10 114 20 C122 12 138 14 144 26 C156 24 166 34 164 46 C174 60 174 80 166 102 C158 94 150 92 144 98 C136 88 128 86 122 96 C114 86 86 86 78 96 C72 86 64 88 56 98 C50 92 42 94 34 102 Z"/>')
    s.part(ears[0], sl, None, split=False); s.part(ears[1], ss, None, split=False)
    s.part(head, face_grad(s, 92, 168), None, split=False)
    s.raw(f'<g clip-path="url(#R)"><use href="#{head}" fill="#8A4E36" opacity="0.14"/></g>')
    s.part(hair, HL, HS, cast='#6A2A10', cast_dy=4, cast_op=0.32)
    s.mouth(154, w=4)
    s.hand(14, 138, 32, 30, rx=11); s.hand(154, 138, 32, 30, rx=11)
    return s

# ---------------------------------------------------------------- 4: MOP / MANE
@reg
def base4():
    s = S('4 "Mop"', 'small face sunk deep in a huge cloud of dark-brown lobed curls that hides the ears and falls past the cheeks; one hand leads close in front, the other rests out at the side.')
    BL, BS = s.lg('#5A3E34', '#4A322A'), s.lg('#432C25', '#37241E')
    FL, FS = s.lg('#8A6150', '#765041'), s.lg('#664437', '#56392D')
    back = s.shape('<path d="M30 150 C10 140 6 112 18 96 C6 76 14 50 34 44 C34 22 56 8 76 14 C86 2 114 2 124 14 C144 8 166 22 166 44 C186 50 194 76 182 96 C194 112 190 140 170 150 C160 168 140 172 128 160 L72 160 C60 172 40 168 30 150 Z"/>')
    front = s.shape('<path d="M40 142 C22 130 22 104 36 92 C26 70 42 46 64 48 C68 28 90 20 100 30 C110 20 132 28 136 48 C158 46 174 70 164 92 C178 104 178 130 160 142 C152 156 132 156 128 142 C126 116 114 102 100 102 C86 102 74 116 72 142 C68 156 48 156 40 142 Z"/>')
    face = s.shape('<path d="M66 132 C66 108 82 96 100 96 C118 96 134 108 134 132 C134 154 120 166 100 166 C80 166 66 154 66 132 Z"/>')
    s.part(back, BL, BS, cast='#1E1828', cast_dy=3, cast_op=0.3)
    s.part(face, face_grad(s, 100, 166, shadow='#7E4E44'), None, split=False)
    s.raw(f'<g clip-path="url(#R)"><use href="#{face}" fill="#8A4E36" opacity="0.14"/></g>')
    s.part(front, FL, FS, cast='#24140E', cast_dy=4, cast_op=0.45)
    s.mouth(156)
    s.hand(52, 166, 25, 22); s.hand(162, 120, 25, 22)
    return s

if __name__ == '__main__':
    import sys
    for n, f in builds.items():
        open(f'base-{n[-1]}.svg', 'w').write(f().svg())
    print('built')
