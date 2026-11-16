"""Set A2: base humans at the archer's HEAD size (hood footprint ~118x140, x41..159 y14..155).
Rendering matches the archer: one heavy outline under all shapes, no inner lines, soft vertical gradients,
contact shadows, lit from the left. Hard centre split is optional per part ('hard' | 'soft' | None)."""
import re
OUT = '#2B2230'

def xf(el, k, ox, oy):
    """scale an element string about (100,100) by k, then translate by (ox,oy). Handles path d (absolute
    pairs), circle/ellipse/rect attributes."""
    X = lambda v: 100 + k * (v - 100) + ox
    Y = lambda v: 100 + k * (v - 100) + oy
    def path(m):
        nums = [float(n) for n in re.findall(r'-?\d+\.?\d*', m.group(1))]
        cmds = re.findall(r'[A-Za-z]|-?\d+\.?\d*', m.group(1))
        out, i = [], 0
        for t in cmds:
            if t.isalpha(): out.append(t); continue
            v = float(t)
            out.append(f'{(X(v) if i % 2 == 0 else Y(v)):.1f}'); i += 1
        return 'd="' + ' '.join(out) + '"'
    el = re.sub(r'd="([^"]*)"', path, el)
    for a, f in (('cx', X), ('cy', Y), ('x', X), ('y', Y)):
        el = re.sub(rf' {a}="(-?[\d.]+)"', lambda m: f' {a}="{f(float(m.group(1))):.1f}"', el)
    for a in ('r', 'rx', 'ry', 'width', 'height'):
        el = re.sub(rf' {a}="([\d.]+)"', lambda m: f' {a}="{k*float(m.group(1)):.1f}"', el)
    return el

class S:
    def __init__(s, name, note, k=1, ox=0, oy=0):
        s.name, s.note, s.k, s.ox, s.oy = name, note, k, ox, oy
        s.defs, s.sil, s.body = [], [], []
        s.n = 0
    def uid(s, p):
        s.n += 1; return f'{p}{s.n}'
    def lg(s, c1, c2=None, x2=0.3, units=None):
        i = s.uid('g')
        if units:
            s.defs.append(f'<linearGradient id="{i}" x1="0" y1="{units[0]}" x2="0" y2="{units[1]}" gradientUnits="userSpaceOnUse">' +
                          ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in c1) + '</linearGradient>')
        else:
            s.defs.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>')
        return f'url(#{i})'
    def softshade(s, col, x0=70, x1=160, op=0.5):
        i = s.uid('g')
        s.defs.append(f'<linearGradient id="{i}" x1="{x0}" y1="0" x2="{x1}" y2="0" gradientUnits="userSpaceOnUse">'
                      f'<stop offset="0" stop-color="{col}" stop-opacity="0"/><stop offset="1" stop-color="{col}" stop-opacity="{op}"/></linearGradient>')
        return f'url(#{i})'
    def shape(s, el, scale=True, sil=True):
        if scale: el = xf(el, s.k, s.ox, s.oy)
        i = s.uid('s')
        s.defs.append(el.replace('/>', f' id="{i}"/>', 1))
        s.defs.append(f'<clipPath id="{i}c"><use href="#{i}"/></clipPath>')
        if sil: s.sil.append(f'<use href="#{i}"/>')
        return i
    def part(s, i, lit, shade=None, mode='hard', cast=None, cast_dy=3, cast_op=0.28):
        if cast:
            s.body.append(f'<use href="#{i}" fill="{cast}" opacity="{cast_op}" transform="translate(0 {cast_dy})"/>')
        s.body.append(f'<use href="#{i}" fill="{lit}"/>')
        if shade and mode == 'hard':
            s.body.append(f'<g clip-path="url(#R)"><use href="#{i}" fill="{shade}"/></g>')
        elif shade and mode == 'soft':
            s.body.append(f'<use href="#{i}" fill="{shade}"/>')
    def raw(s, x): s.body.append(x)
    def hand(s, x, y, w=24, h=21, rx=8, rot=0):
        t = f' transform="rotate({rot} {x+w/2} {y+h/2})"' if rot else ''
        i = s.shape(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"{t}/>', scale=False)
        s.body.append(f'<g transform="translate(0 2.5)"><rect x="{x+1}" y="{y}" width="{w-2}" height="{h}" rx="{rx}" fill="{OUT}" opacity="0.3"{t}/></g>')
        s.body.append(f'<use href="#{i}" fill="url(#gHand)"/>')
    def mouth(s, y, w=3, x=100):
        s.body.append(f'<path d="M{x-w} {y} Q{x} {y+2.5} {x+w} {y}" fill="none" stroke="#C98868" stroke-width="2.5" stroke-linecap="round"/>')
    def svg(s):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n'
                f'  <!-- BASE HUMAN {s.name}: {s.note} Sized to the archer HEAD (hood footprint). Facing = DOWN (+y). Rotate whole sprite around (100,100). -->\n'
                '  <defs>\n    <clipPath id="R"><rect x="100" y="-10" width="120" height="230"/></clipPath>\n'
                '    <radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/><stop offset="1" stop-color="#DFA57F"/></radialGradient>\n    '
                + '\n    '.join(s.defs) + '\n  </defs>\n'
                f'  <g fill="{OUT}" stroke="{OUT}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">\n    '
                + '\n    '.join(s.sil) + '\n  </g>\n  ' + '\n  '.join(s.body) + '\n</svg>\n')

SKIN_L = ('#F4CBA5', '#EAB78F'); SKIN_S = ('#DDA982', '#CE9671')
def skin(s): return s.lg(*SKIN_L, x2=0.2), s.lg(*SKIN_S, x2=0.2)
def face_grad(s, y0, y1, shadow='#AD725A'):
    return s.lg([(0, shadow), (0.24, '#D59D7A'), (0.5, '#F2C7A0'), (1, '#F6D0AC')], units=(y0, y1))
def face_side(s, head, mode):
    if mode == 'hard': s.raw(f'<g clip-path="url(#R)"><use href="#{head}" fill="#8A4E36" opacity="0.14"/></g>')
    else: s.raw(f'<use href="#{head}" fill="{s.softshade("#8A4E36", 80, 150, 0.22)}"/>')

builds = {}
def reg(f): builds[f.__name__] = f; return f

def Yf(s, v): return 100 + s.k * (v - 100) + s.oy
def Xf(s, v): return 100 + s.k * (v - 100) + s.ox

# ---------------------------------------------------------------- 1: ROUND / BOWL
@reg
def base1():
    s = S('1 "Bowl"', 'round skull under a brown bowl cut with three chunky fringe lobes and a round bun at the crown; face is the lower crescent; small ears under the sideburns; fists up at both front corners.', k=0.73, oy=0)
    HL, HS = s.lg('#94603E', '#7A4A2D'), s.lg('#74472C', '#5E3923')
    sl, ss = skin(s)
    ears = [s.shape('<ellipse cx="31" cy="124" rx="13" ry="16"/>'), s.shape('<ellipse cx="169" cy="124" rx="13" ry="16"/>')]
    head = s.shape('<circle cx="100" cy="98" r="70"/>')
    bun = s.shape('<circle cx="104" cy="14" r="22"/>')
    hair = s.shape('<path d="M24 122 C14 96 18 52 46 32 C64 18 82 14 100 14 C118 14 136 18 154 32 C182 52 186 96 176 122 C170 134 154 134 148 122 C144 108 138 98 128 98 C120 112 108 116 100 104 C92 116 80 112 72 98 C62 98 56 108 52 122 C46 134 30 134 24 122 Z"/>')
    s.part(ears[0], sl); s.part(ears[1], ss)
    s.part(bun, HS)
    s.part(head, face_grad(s, Yf(s, 100), Yf(s, 168)))
    face_side(s, head, 'hard')
    s.part(hair, HL, HS, 'hard', cast='#3A1F12', cast_dy=4, cast_op=0.3)
    s.mouth(Yf(s, 154))
    s.hand(50, 136); s.hand(126, 136)
    return s

# ---------------------------------------------------------------- 2: EGG / SWEPT TAIL
@reg
def base2():
    s = S('2 "Swept"', 'narrow egg head, open face, blonde side-swept fringe lock with pointed tips, the rest pulled back into a thick tail trailing back-right; small ears; both hands angled together at front-left for a two-handed grip.', k=0.8, oy=-6)
    HL, HS = s.lg('#F4D27A', '#E2AE4C'), s.softshade('#A8681E', 60, 165, 0.55)
    TL = s.lg('#DDA344', '#C48632')
    sl, ss = skin(s)
    ears = [s.shape('<ellipse cx="41" cy="120" rx="11" ry="15"/>'), s.shape('<ellipse cx="159" cy="120" rx="11" ry="15"/>')]
    head = s.shape('<path d="M100 32 C142 32 162 70 162 110 C162 150 134 176 100 176 C66 176 38 150 38 110 C38 70 58 32 100 32 Z"/>')
    tail = s.shape('<path d="M110 38 C118 18 134 2 156 0 C174 0 182 14 176 28 C170 40 154 44 146 56 Z"/>')
    hair = s.shape('<path d="M38 118 C28 74 50 30 100 26 C150 30 170 74 160 112 C152 98 142 88 130 86 C124 98 116 104 104 106 C102 100 100 96 96 94 C90 106 82 114 70 118 C64 128 56 136 44 138 C42 132 40 126 38 118 Z"/>')
    s.part(ears[0], sl); s.part(ears[1], ss)
    s.part(tail, TL, s.softshade('#8A5418', 120, 180, 0.4), 'soft')
    s.part(head, face_grad(s, Yf(s, 92), Yf(s, 176), shadow='#B97C60'))
    face_side(s, head, 'soft')
    s.part(hair, HL, HS, 'soft', cast='#7A4A20', cast_dy=4, cast_op=0.32)
    s.mouth(Yf(s, 158))
    s.hand(48, 138, rot=-35); s.hand(66, 154, rot=-35)
    return s

# ---------------------------------------------------------------- 3: SQUARE / CROP
@reg
def base3():
    s = S('3 "Crop"', 'broad squarish head and wide jaw, short tufty copper crop cut high above big jug ears; square fists held wide at the front corners.', k=0.7, oy=0)
    HL, HS = s.lg('#E3823F', '#CC672C'), s.lg('#B6522A', '#97401F')
    sl, ss = skin(s)
    ears = [s.shape('<rect x="10" y="86" width="34" height="44" rx="16"/>'), s.shape('<rect x="156" y="86" width="34" height="44" rx="16"/>')]
    head = s.shape('<rect x="30" y="34" width="140" height="134" rx="52"/>')
    hair = s.shape('<path d="M34 108 C24 80 24 60 36 46 C34 32 46 20 60 24 C68 10 88 8 98 20 C108 8 132 10 140 24 C154 20 166 32 164 46 C176 60 176 80 166 108 C158 98 148 96 140 104 C132 90 118 90 110 102 C104 94 96 94 90 102 C82 90 68 90 60 104 C52 96 42 98 34 108 Z"/>')
    s.part(ears[0], sl); s.part(ears[1], ss)
    s.part(head, face_grad(s, Yf(s, 98), Yf(s, 168)))
    face_side(s, head, 'hard')
    s.part(hair, HL, HS, 'hard', cast='#6A2A10', cast_dy=4, cast_op=0.3)
    s.mouth(Yf(s, 152), w=4)
    s.hand(30, 128, 26, 23, rx=9); s.hand(144, 128, 26, 23, rx=9)
    return s

# ---------------------------------------------------------------- 4: MOP / MANE
@reg
def base4():
    s = S('4 "Mop"', 'small face sunk in a big two-layer cloud of dark-brown curls that hides the ears and falls past the cheeks; one hand leads in front, the other rests out at the side.', k=0.68, oy=-2)
    BL, BS = s.lg('#5A3E34', '#4A322A'), s.softshade('#1E1410', 70, 170, 0.45)
    FL, FS = s.lg('#8D6452', '#775143'), s.softshade('#2A1A14', 70, 170, 0.45)
    back = s.shape('<path d="M30 150 C10 140 6 112 18 96 C6 76 14 50 34 44 C34 22 56 8 76 14 C86 2 114 2 124 14 C144 8 166 22 166 44 C186 50 194 76 182 96 C194 112 190 140 170 150 C160 168 140 172 128 160 L72 160 C60 172 40 168 30 150 Z"/>')
    front = s.shape('<path d="M40 142 C22 130 22 104 36 92 C26 70 42 46 64 48 C68 28 90 20 100 30 C110 20 132 28 136 48 C158 46 174 70 164 92 C178 104 178 130 160 142 C152 156 132 156 130 142 C132 120 120 103 100 103 C80 103 68 120 70 142 C68 156 48 156 40 142 Z"/>', sil=False)
    face = s.shape('<path d="M64 134 C64 112 80 100 100 100 C120 100 136 112 136 134 C136 156 120 168 100 168 C80 168 64 156 64 134 Z"/>')
    s.part(back, BL, BS, 'soft', cast='#1E1828', cast_dy=3, cast_op=0.3)
    s.part(face, face_grad(s, Yf(s, 104), Yf(s, 168), shadow='#9C6450'))
    face_side(s, face, 'soft')
    s.part(front, FL, FS, 'soft', cast='#24140E', cast_dy=4, cast_op=0.45)
    s.mouth(Yf(s, 157))
    s.hand(70, 140); s.hand(144, 112)
    return s

if __name__ == '__main__':
    for n, f in builds.items():
        open(f'base-{n[-1]}.svg', 'w').write(f().svg())
    print('built')
