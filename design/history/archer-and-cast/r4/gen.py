import itertools, re
base = open('/home/claude/archer/variants/r3-opus-high/attempt-1.svg').read()

NEW_QUIVER_SHAPE = '''<g id="quiverShape" transform="rotate(28 138 52)">
      <path d="M124 26 C116 16 116 6 122 0 C128 8 130 18 128 26 Z"/>
      <path d="M137 24 C134 12 136 2 142 -4 C146 6 144 16 140 24 Z"/>
      <path d="M150 26 C156 16 158 6 154 0 C148 8 146 18 146 26 Z"/>
      <path d="M116 24 H160 L154 74 C153 80 123 80 122 74 Z"/>
    </g>'''
NEW_QUIVER = '''<g transform="rotate(28 138 52)">
    <path d="M124 26 C116 16 116 6 122 0 C128 8 130 18 128 26 Z" fill="#FFF8E8"/>
    <path d="M137 24 C134 12 136 2 142 -4 C146 6 144 16 140 24 Z" fill="#9AD17F"/>
    <path d="M150 26 C156 16 158 6 154 0 C148 8 146 18 146 26 Z" fill="#FFF8E8"/>
    <path d="M116 24 H160 L154 74 C153 80 123 80 122 74 Z" fill="url(#gQuiver)"/>
    <path d="M116 24 H160 L159 33 H117 Z" fill="#F2B53A"/>
    <path d="M117 33 H159 L158.5 36 H117.3 Z" fill="#B97E22"/>
    <path d="M121 64 H155 L154 74 C153 80 123 80 122 74 Z" fill="#6E4222"/>
    <path d="M128 40 V60 M138 40 V60 M148 40 V60" stroke="#6E4222" stroke-width="2" stroke-dasharray="3 3" opacity="0.7"/>
  </g>'''

OLD_QSHAPE = re.search(r'<g id="quiverShape".*?</g>', base, re.S).group(0)
OLD_Q = re.search(r'<!-- quiver -->\s*<g transform="rotate\(30 138 52\)">.*?</g>', base, re.S).group(0)
OLD_CLASP = re.search(r'<!-- leaf clasp -->.*?opacity="0.5"/>', base, re.S).group(0)
VEINS = re.search(r'<path d="M100 18 C97 42.*?</g>\n  </g>', base, re.S).group(0)
OLD_BRIM = '<path id="brim" d="M50 134 C50 90 150 90 150 134 C148 152 130 160 100 160 C70 160 52 152 50 134 Z"/>'
PEAK_BRIM = '<path id="brim" d="M50 134 C50 108 66 99 86 96 C93 95 96 90 98 81 Q100 75 102 81 C104 90 107 95 114 96 C134 99 150 108 150 134 C148 152 130 160 100 160 C70 160 52 152 50 134 Z"/>'
ARROW_CLASP = '''<!-- gold arrowhead clasp -->
  <path d="M100 79 L114 105 L100 99 L86 105 Z" fill="#2B2230" stroke="#2B2230" stroke-width="5" stroke-linejoin="round"/>
  <path d="M100 81 L112 103 L100 98 L88 103 Z" fill="#F7C552"/>
  <path d="M100 81 L112 103 L100 98 Z" fill="#D9952A"/>'''

def make(fore, split, stripes):
    s = base.replace(OLD_QSHAPE, NEW_QUIVER_SHAPE).replace(OLD_Q, '<!-- quiver -->\n  ' + NEW_QUIVER)
    if fore == 'arrow':
        s = s.replace(OLD_CLASP, ARROW_CLASP)
    else:
        s = s.replace(OLD_CLASP, '').replace(OLD_BRIM, PEAK_BRIM)
    if split == 'split':
        s = s.replace('<stop offset="0" stop-color="#7CC06F"/><stop offset="1" stop-color="#5EA459"/>',
                      '<stop offset="0" stop-color="#80C473"/><stop offset="1" stop-color="#66AD5F"/>')
        s = s.replace('<stop offset="0" stop-color="#57995A"/><stop offset="1" stop-color="#3F7C46"/>',
                      '<stop offset="0" stop-color="#4C8C4F"/><stop offset="1" stop-color="#376E3D"/>')
        s = s.replace('<path id="shadeR" d="M100 -10 C97 40 98 66 100 90 V220 H220 V-10 Z"/>',
                      '<path id="shadeR" d="M100 -10 V220 H220 V-10 Z"/>')
    else:
        # one continuous hood: diagonal light-to-dark gradient, no hard split on the hood
        s = s.replace('<linearGradient id="gLit" x1="0" y1="0" x2="0.4" y2="1">\n      <stop offset="0" stop-color="#7CC06F"/><stop offset="1" stop-color="#5EA459"/>',
                      '<linearGradient id="gLit" x1="0.1" y1="0.1" x2="0.95" y2="0.9">\n      <stop offset="0" stop-color="#7CC06F"/><stop offset="0.55" stop-color="#5EA459"/><stop offset="1" stop-color="#3F7C46"/>')
        s = s.replace('<use href="#shadeR" fill="url(#gShade)"/>', '')
        s = s.replace('<g clip-path="url(#brimClip)"><use href="#shadeR" fill="#D9952A" opacity="0.55"/></g>',
                      '<g clip-path="url(#brimClip)"><use href="#brim" fill="#D9952A" opacity="0.5" transform="translate(7 5)"/></g>')
        s = s.replace('<path d="M100 96 H144 V156 H100 Z" fill="#8A4E36" opacity="0.14"/>', '')
    if stripes == 'plain':
        s = s.replace(VEINS, '</g>')
    return s

names = []
for fore, split, stripes in itertools.product(['arrow','peak'], ['split','soft'], ['veins','plain']):
    n = f'{fore}-{split}-{stripes}.svg'
    open(n,'w').write(make(fore, split, stripes)); names.append(n)
print(' '.join(names))
