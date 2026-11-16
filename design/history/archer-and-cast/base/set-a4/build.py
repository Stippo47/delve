"""Set A4 (adults): base humans at the archer's HEAD size (hood footprint ~118x140, x41..159 y14..155).
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

# ---- adult helpers -------------------------------------------------------------------------------
TUNIC = ('#98A1B3', '#7C8598')
def face_side_soft(s, i, x0=100, x1=146):
    s.raw(f'<use href="#{i}" fill="{s.softshade("#8A4E36", x0, x1, 0.28)}"/>')
def shoulders(s, l, r, top, bot):
    cy = (top + bot) / 2
    d = (f'M{l} {cy} C{l} {top+8} {l+30} {top} 100 {top} C{r-30} {top} {r} {top+8} {r} {cy} '
         f'C{r} {bot-6} {r-26} {bot} 100 {bot} C{l+26} {bot} {l} {bot-6} {l} {cy} Z')
    i = s.shape(f'<path d="{d}"/>', scale=False)
    s.part(i, s.lg(*TUNIC), s.softshade('#2E3442', 70, r, 0.4), 'soft')
    return i
def adult_face_grad(s, y0, y1):
    return s.lg([(0, '#B07560'), (0.2, '#D9A27F'), (0.45, '#F2C7A0'), (0.85, '#F4CBA6'), (1, '#E6B590')], units=(y0, y1))

# ---------------------------------------------------------------- 1: BOWL (adult, asymmetric)
@reg
def base1():
    s = S('1 "Bowl"', 'adult: longer face with a tapered jaw and chin; brown bowl cut parted off-centre with the fringe lobes sweeping to his right (viewer left), bun set back-left; small ears; shoulders under the head; fists staggered at the front corners.')
    HL, HS = s.lg('#94603E', '#7A4A2D'), s.softshade('#3A1F12', 60, 160, 0.5)
    sl, ss = skin(s)
    shoulders(s, 34, 166, 92, 152)
    ears = [s.shape('<ellipse cx="57" cy="106" rx="8" ry="11"/>', scale=False), s.shape('<ellipse cx="143" cy="106" rx="8" ry="11"/>', scale=False)]
    head = s.shape('<path d="M100 28 C128 28 144 50 144 80 C144 108 138 126 126 140 C118 150 110 156 100 156 C90 156 82 150 74 140 C62 126 56 108 56 80 C56 50 72 28 100 28 Z"/>', scale=False)
    bun = s.shape('<circle cx="80" cy="22" r="15"/>', scale=False)
    hair = s.shape('<path d="M52 108 C44 78 52 42 76 30 C90 22 114 22 128 30 C152 42 156 78 148 106 C146 112 140 112 138 106 C136 96 132 90 126 86 C122 94 116 100 108 102 C106 98 104 96 100 96 C96 104 90 108 82 108 C78 106 74 104 70 104 C68 112 62 118 56 118 C54 116 52 112 52 108 Z"/>', scale=False)
    s.part(ears[0], sl); s.part(ears[1], ss)
    s.part(bun, s.lg('#7E4F32', '#64402A'))
    s.part(head, adult_face_grad(s, 92, 156), cast='#1E2230', cast_dy=5, cast_op=0.3)
    face_side_soft(s, head)
    s.part(hair, HL, HS, 'soft', cast='#3A1F12', cast_dy=4, cast_op=0.3)
    s.mouth(138, w=4)
    s.hand(36, 146, 22, 18, rx=6); s.hand(140, 136, 22, 18, rx=6)
    return s

# ---------------------------------------------------------------- 2: SWEPT (adult)
@reg
def base2():
    s = S('2 "Swept"', 'adult: narrow egg head with a long face and pointed chin; blonde hair with a higher hairline and one side-swept fringe lock with pointed tips; small ears; narrow shoulders; both hands angled together at front-left for a two-handed grip.')
    HL, HS = s.lg('#F4D27A', '#E2AE4C'), s.softshade('#A8681E', 60, 150, 0.55)
    sl, ss = skin(s)
    shoulders(s, 40, 160, 94, 150)
    ears = [s.shape('<ellipse cx="59" cy="104" rx="7" ry="10"/>', scale=False), s.shape('<ellipse cx="141" cy="104" rx="7" ry="10"/>', scale=False)]
    head = s.shape('<path d="M100 28 C126 28 142 50 142 80 C142 110 132 132 118 146 C112 152 106 158 100 158 C94 158 88 152 82 146 C68 132 58 110 58 80 C58 50 74 28 100 28 Z"/>', scale=False)
    hair = s.shape('<path d="M56 102 C48 68 64 28 100 26 C136 28 152 68 144 100 C138 90 130 84 122 82 C118 90 112 94 104 96 C102 92 100 90 96 88 C92 98 84 104 74 106 C70 114 64 120 58 122 C56 116 56 110 56 102 Z"/>', scale=False)
    s.part(ears[0], sl); s.part(ears[1], ss)
    s.part(head, adult_face_grad(s, 88, 158), cast='#1E2230', cast_dy=5, cast_op=0.3)
    face_side_soft(s, head)
    s.part(hair, HL, HS, 'soft', cast='#7A4A20', cast_dy=4, cast_op=0.3)
    s.mouth(138, w=4)
    s.hand(46, 138, 22, 18, rx=6, rot=-35); s.hand(60, 153, 22, 18, rx=6, rot=-35)
    return s

# ---------------------------------------------------------------- 3: CROP (adult, square jaw, stubble)
@reg
def base3():
    s = S('3 "Crop"', 'adult: broad square head with a heavy square jaw and copper stubble shadow; short tufty copper crop, slightly uneven; ears that stick out; broad shoulders; square fists held wide at the front corners.')
    HL, HS = s.lg('#E3823F', '#CC672C'), s.softshade('#6A2410', 60, 160, 0.5)
    sl, ss = skin(s)
    shoulders(s, 26, 174, 90, 154)
    ears = [s.shape('<rect x="44" y="90" width="18" height="28" rx="8"/>', scale=False), s.shape('<rect x="138" y="90" width="18" height="28" rx="8"/>', scale=False)]
    head = s.shape('<path d="M56 72 C56 42 76 28 100 28 C124 28 144 42 144 72 L144 116 C144 140 128 154 112 156 L88 156 C72 154 56 140 56 116 Z"/>', scale=False)
    hair = s.shape('<path d="M54 96 C46 76 48 56 56 46 C56 34 66 26 78 28 C84 18 98 16 106 24 C114 16 132 20 136 32 C148 32 156 44 152 56 C158 68 156 84 146 96 C142 90 136 88 132 94 C126 84 116 84 110 92 C106 86 98 86 94 92 C88 82 76 82 70 92 C64 86 58 88 54 96 Z"/>', scale=False)
    s.part(ears[0], sl); s.part(ears[1], ss)
    s.part(head, adult_face_grad(s, 88, 156), cast='#1E2230', cast_dy=5, cast_op=0.3)
    sg = s.uid('g'); s.defs.append(f'<linearGradient id="{sg}" x1="0" y1="112" x2="0" y2="156" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9A4E2A" stop-opacity="0"/><stop offset="0.45" stop-color="#9A4E2A" stop-opacity="0.2"/><stop offset="1" stop-color="#9A4E2A" stop-opacity="0.3"/></linearGradient>')
    s.raw(f'<use href="#{head}" fill="url(#{sg})"/>')
    face_side_soft(s, head)
    s.part(hair, HL, HS, 'soft', cast='#6A2A10', cast_dy=4, cast_op=0.3)
    s.mouth(140, w=5)
    s.hand(28, 136, 24, 20, rx=7); s.hand(148, 136, 24, 20, rx=7)
    return s

if __name__ == '__main__':
    for n, f in builds.items():
        open(f'base-{n[-1]}.svg', 'w').write(f().svg())
    print('built')
