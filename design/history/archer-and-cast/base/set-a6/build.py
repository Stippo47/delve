"""Set A5 (adults, round 1x1 token, no shoulders by default): base humans at the archer's HEAD size (hood footprint ~118x140, x41..159 y14..155).
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

# ---- helpers -------------------------------------------------------------------------------------
TUNIC = ('#98A1B3', '#7C8598')
def face_side_soft(s, i, x0=100, x1=156):
    s.raw(f'<use href="#{i}" fill="{s.softshade("#8A4E36", x0, x1, 0.28)}"/>')
def shoulders(s, l, r, top, bot):
    """rounded shoulder band centred on the head centre; span incl. outline = w."""
    cy = (top + bot) / 2
    d = (f'M{l} {cy} C{l} {top+6} {l+28} {top} 100 {top} C{r-28} {top} {r} {top+6} {r} {cy} '
         f'C{r} {bot-6} {r-28} {bot} 100 {bot} C{l+28} {bot} {l} {bot-6} {l} {cy} Z')
    i = s.shape(f'<path d="{d}"/>', scale=False)
    s.part(i, s.lg(*TUNIC), s.softshade('#2E3442', 80, r, 0.4), 'soft')
def adult_face_grad(s, y0, y1):
    return s.lg([(0, '#B07560'), (0.2, '#D9A27F'), (0.45, '#F2C7A0'), (0.85, '#F4CBA6'), (1, '#E6B590')], units=(y0, y1))
def SHW(w):  # shoulder band centred on the head centre (100,100), total span w, modest depth
    return dict(l=100 - w/2 + 6, r=100 + w/2 - 6, top=74, bot=126)

# ---------------------------------------------------------------- 1: BOWL (adult, round, asymmetric)
def base1(sh=False):
    s = S('1 "Bowl"', 'adult, round 1x1 token: wide rounded skull with a soft defined chin; brown bowl cut parted off-centre, fringe lobes sweeping to one side, bun set back-left; small ears; fists staggered at the front corners.' + (f' SHOULDERS VARIANT: rounded band centred on the head, ~{sh} total span.' if sh else ''))
    HL, HS = s.lg('#94603E', '#7A4A2D'), s.softshade('#3A1F12', 60, 166, 0.5)
    sl, ss = skin(s)
    if sh: shoulders(s, **SHW(sh))
    ears = [s.shape('<ellipse cx="45" cy="110" rx="8" ry="11"/>', scale=False), s.shape('<ellipse cx="155" cy="110" rx="8" ry="11"/>', scale=False)]
    head = s.shape('<path d="M100 40 C134 40 155 64 155 98 C155 126 142 146 124 155 C116 159 108 161 100 161 C92 161 84 159 76 155 C58 146 45 126 45 98 C45 64 66 40 100 40 Z"/>', scale=False)
    bun = s.shape('<circle cx="78" cy="34" r="14"/>', scale=False)
    hair = s.shape('<path d="M42 112 C34 80 44 46 72 36 C88 30 112 30 128 36 C156 46 166 80 158 110 C156 116 150 116 148 110 C146 100 140 92 132 88 C128 96 120 102 110 104 C108 100 104 98 100 98 C96 106 88 110 78 110 C74 108 70 106 66 106 C62 114 56 120 48 121 C45 118 43 116 42 112 Z"/>', scale=False)
    s.part(ears[0], sl); s.part(ears[1], ss)
    s.part(bun, s.lg('#7E4F32', '#64402A'))
    s.part(head, adult_face_grad(s, 94, 161), cast='#1E2230' if sh else None, cast_dy=5, cast_op=0.3)
    face_side_soft(s, head)
    s.part(hair, HL, HS, 'soft', cast='#3A1F12', cast_dy=4, cast_op=0.3)
    s.mouth(142, w=4)
    s.hand(32, 146, 22, 18, rx=6); s.hand(146, 136, 22, 18, rx=6)
    return s

# ---------------------------------------------------------------- 2: SWEPT (adult, soft oval)
def base2(sh=False):
    s = S('2 "Swept"', 'adult, round 1x1 token: soft oval head with the chin pulled in; blonde hair with a higher hairline and one side-swept fringe lock with pointed tips; small ears; both hands angled together at front-left for a two-handed grip.' + (f' SHOULDERS VARIANT: rounded band centred on the head, ~{sh} total span.' if sh else ''))
    HL, HS = s.lg('#F4D27A', '#E2AE4C'), s.softshade('#A8681E', 60, 160, 0.55)
    sl, ss = skin(s)
    if sh: shoulders(s, **SHW(sh))
    ears = [s.shape('<ellipse cx="48" cy="108" rx="7" ry="10"/>', scale=False), s.shape('<ellipse cx="152" cy="108" rx="7" ry="10"/>', scale=False)]
    head = s.shape('<path d="M100 38 C132 38 152 62 152 96 C152 124 140 144 124 154 C116 159 108 161 100 161 C92 161 84 159 76 154 C60 144 48 124 48 96 C48 62 68 38 100 38 Z"/>', scale=False)
    hair = s.shape('<path d="M46 106 C38 70 58 34 100 32 C142 34 162 70 154 104 C148 94 138 88 128 86 C124 94 116 98 106 100 C104 96 102 94 98 92 C92 102 82 108 70 110 C66 118 58 124 50 126 C48 120 46 114 46 106 Z"/>', scale=False)
    s.part(ears[0], sl); s.part(ears[1], ss)
    s.part(head, adult_face_grad(s, 90, 161), cast='#1E2230' if sh else None, cast_dy=5, cast_op=0.3)
    face_side_soft(s, head)
    s.part(hair, HL, HS, 'soft', cast='#7A4A20', cast_dy=4, cast_op=0.3)
    s.mouth(142, w=4)
    s.hand(38, 140, 22, 18, rx=6, rot=-35); s.hand(54, 155, 22, 18, rx=6, rot=-35)
    return s

# ---------------------------------------------------------------- 3: CROP (adult, squarish, stubble)
def base3(sh=False):
    s = S('3 "Crop"', 'adult, squarish 1x1 token: broad rounded-square head with a firm (not heavy) jaw and soft copper stubble shadow; short tufty copper crop, slightly uneven; ears that stick out; square fists held wide at the front corners.' + (f' SHOULDERS VARIANT: rounded band centred on the head, ~{sh} total span.' if sh else ''))
    HL, HS = s.lg('#E3823F', '#CC672C'), s.softshade('#6A2410', 60, 166, 0.5)
    sl, ss = skin(s)
    if sh: shoulders(s, **SHW(sh))
    ears = [s.shape('<rect x="34" y="94" width="18" height="28" rx="8"/>', scale=False), s.shape('<rect x="148" y="94" width="18" height="28" rx="8"/>', scale=False)]
    head = s.shape('<path d="M46 82 C46 52 68 38 100 38 C132 38 154 52 154 82 L154 116 C154 142 136 158 116 160 L84 160 C64 158 46 142 46 116 Z"/>', scale=False)
    hair = s.shape('<path d="M44 100 C36 82 38 64 46 54 C46 42 58 36 70 38 C76 30 92 28 100 34 C108 28 126 30 132 40 C146 38 158 48 154 62 C162 72 162 88 154 100 C150 94 144 92 138 98 C132 88 120 88 114 96 C108 90 100 90 94 96 C88 86 74 86 68 96 C60 90 50 92 44 100 Z"/>', scale=False)
    s.part(ears[0], sl); s.part(ears[1], ss)
    s.part(head, adult_face_grad(s, 92, 160), cast='#1E2230' if sh else None, cast_dy=5, cast_op=0.3)
    sg = s.uid('g'); s.defs.append(f'<linearGradient id="{sg}" x1="0" y1="118" x2="0" y2="160" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9A4E2A" stop-opacity="0"/><stop offset="0.45" stop-color="#9A4E2A" stop-opacity="0.2"/><stop offset="1" stop-color="#9A4E2A" stop-opacity="0.3"/></linearGradient>')
    s.raw(f'<use href="#{head}" fill="url(#{sg})"/>')
    face_side_soft(s, head)
    s.part(hair, HL, HS, 'soft', cast='#6A2A10', cast_dy=4, cast_op=0.3)
    s.mouth(144, w=5)
    s.hand(22, 138, 24, 20, rx=7); s.hand(154, 138, 24, 20, rx=7)
    return s

if __name__ == '__main__':
    for n, f in (('1', base1), ('2', base2), ('3', base3)):
        for w in (140, 160, 180):
            open(f'base-{n}s-{w}.svg', 'w').write(f(w).svg())
    print('built')
