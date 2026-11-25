"""Build art SVGs in the game's own art convention (round 19, lane caster19): the art round 12 props' way of drawing
(art/summons/spirit-beaver.svg): one #sprite group with the #outline filter, shapes drawn in order, each filled with a
top-lit gradient and a shade gradient down its right side, a soft drop shadow on what is under it (clipped to the shapes
drawn before it), and details clipped to the shape itself. Front = DOWN (+y), centre (100, 100).

    from svgkit import Art, ell, blobpath, poly
    a = Art('SPIRIT WOLF ...', scale=0.7)
    a.shape(ell(100, 100, 30, 50), ('#C8F0FF', '#65D4FF'), '#0086BA', drop=3, inner='<path .../>')
    a.raw('<path ... />')          # drawn as it is, on top
    a.write('art/summons/spirit-wolf.svg')
"""
import math

HEAD = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">
<!-- {note} -->
<defs>
<filter id="outline" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="6 2.5" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="2.5 6" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="c"/><feMerge result="d"><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge><feFlood flood-color="#2B2230"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
'''

def f(v):
    return ('%.1f' % v).rstrip('0').rstrip('.')

def ell(cx, cy, rx, ry, rot=0):
    """an ellipse as a path (rot in degrees)"""
    a = math.radians(rot); dx, dy = math.cos(a) * rx, math.sin(a) * rx
    x1, y1, x2, y2 = cx - dx, cy - dy, cx + dx, cy + dy
    return f'M {f(x1)} {f(y1)} A {f(rx)} {f(ry)} {f(rot)} 1 0 {f(x2)} {f(y2)} A {f(rx)} {f(ry)} {f(rot)} 1 0 {f(x1)} {f(y1)} Z'

def poly(pts, closed=True):
    """straight lines through the points"""
    s = 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in pts)
    return s + (' Z' if closed else '')

def blobpath(pts, tension=1.0, closed=True):
    """a smooth closed curve through the points (Catmull-Rom as cubic Beziers)"""
    n = len(pts); out = [f'M {f(pts[0][0])} {f(pts[0][1])}']
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = pts[(i - 1) % n] if closed or i > 0 else pts[0]; p1 = pts[i]; p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if closed or i + 2 < n else pts[-1]
        t = tension / 6
        c1 = (p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t)
        c2 = (p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t)
        out.append(f'C {f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}')
    return ' '.join(out) + (' Z' if closed else '')

def mirror(pts, cx=100):
    return [(2 * cx - x, y) for x, y in pts]

class Art:
    def __init__(self, note, scale=0.7):
        self.note = note; self.scale = scale; self.defs = []; self.body = []; self.n = 0; self.grads = {}; self.shapes = []
    def grad(self, top, bottom):
        key = ('g', top, bottom)
        if key not in self.grads:
            gid = f'g{len(self.grads) + 1}'; self.grads[key] = gid
            self.defs.append(f'<linearGradient id="{gid}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>')
        return self.grads[key]
    def shade(self, col, a=0.42):
        key = ('s', col, a)
        if key not in self.grads:
            gid = f'g{len(self.grads) + 1}'; self.grads[key] = gid
            self.defs.append(f'<linearGradient id="{gid}" x1="0.45" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{col}" stop-opacity="0"/><stop offset="1" stop-color="{col}" stop-opacity="{a}"/></linearGradient>')
        return self.grads[key]
    def shape(self, d, fill, shade=None, drop=0, inner='', transform=''):
        """fill: (top, bottom) colours or one flat colour; shade: the dark of its right side; drop: its shadow on what
        is under it, in units; inner: SVG clipped to this shape (markings, highlights)"""
        self.n += 1; i = self.n; sid = f's{i}'
        tr = f' transform="{transform}"' if transform else ''
        self.defs.append(f'<path id="{sid}" d="{d}"{tr}/>')
        parts = []
        if drop and self.shapes:
            uid = f'u{i}'; self.defs.append(f'<clipPath id="{uid}">' + ''.join(f'<use href="#{s}"/>' for s in self.shapes) + '</clipPath>')
            parts.append(f'<g clip-path="url(#{uid})"><use href="#{sid}" transform="translate(0 {f(drop)})" fill="#2B2230" opacity="0.3"/></g>')
        fl = f'url(#{self.grad(*fill)})' if isinstance(fill, tuple) else fill
        parts.append(f'<use href="#{sid}" fill="{fl}"/>')
        if shade: parts.append(f'<use href="#{sid}" fill="url(#{self.shade(shade)})"/>')
        if inner:
            cid = f'c{i}'; self.defs.append(f'<clipPath id="{cid}"><use href="#{sid}"/></clipPath>')
            parts.append(f'<g clip-path="url(#{cid})">{inner}</g>')
        self.body.append(''.join(parts)); self.shapes.append(sid)
        return sid
    def raw(self, svg):
        self.body.append(svg)
    def text(self, part='body'):
        s = HEAD.format(note=self.note) + '\n'.join(self.defs) + '\n</defs>\n<g id="sprite" filter="url(#outline)">\n'
        s += f'<g id="{part}" transform="translate(100 100) scale({self.scale}) translate(-100 -100)">\n' + '\n'.join(self.body) + '\n</g>\n</g>\n</svg>\n'
        return s
    def write(self, path, part='body'):
        open(path, 'w', encoding='utf-8').write(self.text(part)); print('wrote', path)
