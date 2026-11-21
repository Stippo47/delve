"""Small SVG builder for the round-4 caster heroes (H1).

Every sprite: one heavy outline from the round-3 #outline filter over #sprite, no inner lines, fills with soft
gradients lit from the left, a darkening overlay on the right side of each shape, and a contact shadow under
each shape (the shape moved down a little, clipped to everything drawn before it).
Paths here are relative to this file; nothing absolute.
"""
import math, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUTDIR = HERE.parents[1] / "heroes-casters"

FILTER = ('<filter id="outline" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" '
          'operator="dilate" radius="6 2.5" result="a"/><feMorphology in="SourceAlpha" operator="dilate" '
          'radius="2.5 6" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="c"/>'
          '<feMerge result="d"><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge>'
          '<feFlood flood-color="#2B2230"/><feComposite in2="d" operator="in" result="o"/><feMerge>'
          '<feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')

COMMON = (
    '<radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8D4B2"/><stop offset="1" stop-color="#DFA57F"/></radialGradient>'
    '<linearGradient id="gFace" x1="0" y1="94.8" x2="0" y2="153.1" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#B07560"/><stop offset="0.2" stop-color="#D9A27F"/><stop offset="0.45" stop-color="#F2C7A0"/><stop offset="0.85" stop-color="#F4CBA6"/><stop offset="1" stop-color="#E6B590"/></linearGradient>'
    '<linearGradient id="gFaceSide" x1="100" y1="0" x2="156" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8A4E36" stop-opacity="0"/><stop offset="1" stop-color="#8A4E36" stop-opacity="0.28"/></linearGradient>'
    '<linearGradient id="sR" x1="0.4" y1="0" x2="1" y2="0.12"><stop offset="0" stop-color="#1A1030" stop-opacity="0"/><stop offset="1" stop-color="#1A1030" stop-opacity="0.32"/></linearGradient>'
    '<linearGradient id="sRl" x1="0.4" y1="0" x2="1" y2="0.12"><stop offset="0" stop-color="#1A1030" stop-opacity="0"/><stop offset="1" stop-color="#1A1030" stop-opacity="0.18"/></linearGradient>'
    '<linearGradient id="gUnder" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A2E2A" stop-opacity="0.55"/><stop offset="0.42" stop-color="#5A2E2A" stop-opacity="0"/></linearGradient>'
    '<linearGradient id="gWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#CF9A62"/><stop offset="0.55" stop-color="#AD7442"/><stop offset="1" stop-color="#83542C"/></linearGradient>'
)

HEAD = ("M 100 47.8 C 129.6 47.8 147.8 68.7 147.8 98.3 C 147.8 122.6 136.5 140 120.9 147.8 C 113.9 151.3 107 153.1 "
        "100 153.1 C 93 153.1 86.1 151.3 79.1 147.8 C 63.5 140 52.1 122.6 52.1 98.3 C 52.1 68.7 70.4 47.8 100 47.8 Z")
SHOULDERS = "M 26 108 C 26 82 54 76 100 76 C 146 76 174 82 174 108 C 174 134 146 140 100 140 C 54 140 26 134 26 108 Z"


def ang(x1, y1, x2, y2):
    """Rotation (degrees) that turns local +y into the direction (x1,y1)->(x2,y2)."""
    return math.degrees(math.atan2(-(x2 - x1), y2 - y1))


def dist(x1, y1, x2, y2):
    return math.hypot(x2 - x1, y2 - y1)


class Sprite:
    def __init__(self, name, comment):
        self.name = name
        self.comment = comment
        self.defs = [FILTER, COMMON]
        self.n = 0
        self.drawn = []          # ids of shapes drawn so far (in file order): contact shadows fall on these
        self.groups = []         # [open-tag, [strings]]
        self.cur = None
        self.clips = {}

    # ---- defs ----
    def nid(self, p):
        self.n += 1
        return f"{p}{self.n}"

    def grad(self, c1, c2, x2=0.3, y2=1.0, mid=None):
        i = self.nid("g")
        stops = f'<stop offset="0" stop-color="{c1}"/>'
        if mid:
            stops += f'<stop offset="0.5" stop-color="{mid}"/>'
        stops += f'<stop offset="1" stop-color="{c2}"/>'
        self.defs.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="{y2}">{stops}</linearGradient>')
        return f"url(#{i})"

    def ygrad(self, stops, y1, y2, x1=None, x2=None):
        """User-space gradient; stops = [(offset, colour), ...]. Vertical unless x1/x2 given."""
        i = self.nid("g")
        st = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
        if x1 is None:
            co = f'x1="0" y1="{y1}" x2="0" y2="{y2}"'
        else:
            co = f'x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"'
        self.defs.append(f'<linearGradient id="{i}" {co} gradientUnits="userSpaceOnUse">{st}</linearGradient>')
        return f"url(#{i})"

    def rgrad(self, c1, c2, cx=0.4, cy=0.38, r=0.7, mid=None):
        i = self.nid("g")
        stops = f'<stop offset="0" stop-color="{c1}"/>'
        if mid:
            stops += f'<stop offset="0.45" stop-color="{mid}"/>'
        stops += f'<stop offset="1" stop-color="{c2}"/>'
        self.defs.append(f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}">{stops}</radialGradient>')
        return f"url(#{i})"

    def path(self, d, tf=None):
        i = self.nid("s")
        t = f' transform="{tf}"' if tf else ''
        self.defs.append(f'<path id="{i}" d="{d}"{t}/>')
        return i

    def clip_of(self, ids):
        key = tuple(ids)
        if key in self.clips:
            return self.clips[key]
        i = self.nid("c")
        self.defs.append(f'<clipPath id="{i}">' + "".join(f'<use href="#{x}"/>' for x in ids) + '</clipPath>')
        self.clips[key] = i
        return i

    # ---- groups ----
    def group(self, gid, pivot=None):
        p = f' data-pivot="{pivot}"' if pivot else ''
        self.cur = [f'<g id="{gid}"{p}>', []]
        self.groups.append(self.cur)
        return self

    def raw(self, s):
        self.cur[1].append(s)

    # ---- drawing ----
    def shape(self, d, fill, tf=None, dy=3, shadow=0.28, shade="sR", details=(), cast=True, record=True,
              opacity=None):
        """Draw one shape: contact shadow on what's below, the fill, inner details (clipped), right-side shade."""
        i = self.path(d, tf)
        out = []
        if cast and shadow and self.drawn:
            c = self.clip_of(self.drawn)
            out.append(f'<g clip-path="url(#{c})"><use href="#{i}" transform="translate(0 {dy})" fill="#1A1030" opacity="{shadow}"/></g>')
        op = f' opacity="{opacity}"' if opacity is not None else ''
        out.append(f'<use href="#{i}" fill="{fill}"{op}/>')
        if details:
            c = self.clip_of([i])
            out.append(f'<g clip-path="url(#{c})">' + "".join(details) + '</g>')
        if shade:
            out.append(f'<use href="#{i}" fill="url(#{shade})"/>')
        self.cur[1].append("".join(out))
        if record:
            self.drawn.append(i)
        return i

    def head(self, dy=5, mouth=True):
        i = self.shape(HEAD, "url(#gFace)", dy=dy, shadow=0.3, shade=None,
                       details=[f'<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>'])
        if mouth:  # the house style's small, subtle mouth curve (no eyes, brows, blush or nose)
            self.raw('<path d="M96 136.5 Q100 139 104 136.5" fill="none" stroke="#C98868" stroke-width="2.5" stroke-linecap="round"/>')
        return i

    def fist(self, cx, cy, a=0, w=20, h=25, under=True, shadow=True):
        """A fist gripping a handle that runs along direction a (degrees, as from ang()): the long side of the
        fist (the row of knuckles) lies along the handle."""
        t = f' transform="rotate({a:.1f} {cx:.1f} {cy:.1f})"'
        x, y = cx - w / 2, cy - h / 2
        s = ''
        if shadow and self.drawn:
            c = self.clip_of(self.drawn)
            s += (f'<g clip-path="url(#{c})"><rect x="{x:.1f}" y="{y + 2.5:.1f}" width="{w}" height="{h}" rx="8"{t} '
                  f'fill="#2B2230" opacity="0.28"/></g>')
        s += f'<rect x="{x:.1f}" y="{y:.1f}" width="{w}" height="{h}" rx="8"{t} fill="url(#gHand)"/>'
        if under:
            s += f'<rect x="{x:.1f}" y="{y:.1f}" width="{w}" height="{h}" rx="8"{t} fill="url(#gUnder)"/>'
        self.cur[1].append(s)

    # ---- output ----
    def svg(self):
        out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">',
               f'<!-- {self.comment} -->',
               '<!-- Parts: groups inside #sprite in draw order; weapon arms come before #body so the weapon sits under the '
               'body and only the fist shows. Pivots: the shoulder points. Front = down (+y), centre (100,100). -->',
               '<defs>', *self.defs, '</defs>', '<g id="sprite" filter="url(#outline)">']
        for tag, parts in self.groups:
            if not parts:
                continue
            out.append(tag)
            out.extend(parts)
            out.append('</g>')
        out += ['</g>', '</svg>', '']
        return "\n".join(out)

    def write(self):
        OUTDIR.mkdir(parents=True, exist_ok=True)
        p = OUTDIR / f"{self.name}.svg"
        p.write_text(self.svg(), encoding="utf-8")
        return p
