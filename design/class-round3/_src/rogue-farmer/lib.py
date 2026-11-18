"""Helpers to rebuild round-2 SVGs into round-3 layout (weapon arms before body)."""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[4]
R2 = ROOT / "design" / "class-round2"
R3 = ROOT / "design" / "class-round3"

FILTER = ('<filter id="outline" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" '
          'operator="dilate" radius="6 2.5" result="a"/><feMorphology in="SourceAlpha" operator="dilate" '
          'radius="2.5 6" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="c"/>'
          '<feMerge result="d"><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge>'
          '<feFlood flood-color="#2B2230"/><feComposite in2="d" operator="in" result="o"/><feMerge>'
          '<feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')

# extra defs every round-3 file gets
EXTRA = ('<linearGradient id="gUnder" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A2E2A" stop-opacity="0.55"/>'
         '<stop offset="0.42" stop-color="#5A2E2A" stop-opacity="0"/></linearGradient>'
         '<linearGradient id="gWoodV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#CF9A62"/><stop offset="0.55" stop-color="#AD7442"/><stop offset="1" stop-color="#83542C"/></linearGradient>'
         '<linearGradient id="gMatte" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B9BEC7"/><stop offset="1" stop-color="#868D9A"/></linearGradient>')


def read(cls, name):
    return (R2 / cls / f"{cls}-{name}.svg").read_text(encoding="utf-8")


def group(src, gid):
    """Return the full <g id=gid ...>...</g> text (balanced)."""
    m = re.search(r'<g id="%s"' % re.escape(gid), src)
    if not m:
        return ""
    i = m.start(); depth = 0; j = i
    for t in re.finditer(r'<g\b|</g>', src[i:]):
        if t.group() == '</g>':
            depth -= 1
        else:
            depth += 1
        if depth == 0:
            j = i + t.end(); break
    return src[i:j]


def defs(src):
    d = re.search(r'<defs>(.*)</defs>', src, re.S).group(1)
    d = re.sub(r'<filter id="outline".*?</filter>', FILTER, d, flags=re.S)
    return d + EXTRA


def fist(cx, cy, rot=0, w=24, h=21, under=True):
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    x, y = cx - w / 2, cy - h / 2
    s = f'<rect x="{x:.1f}" y="{y:.1f}" width="{w}" height="{h}" rx="8"{t} fill="url(#gHand)"/>'
    if under:
        s += f'<rect x="{x:.1f}" y="{y:.1f}" width="{w}" height="{h}" rx="8"{t} fill="url(#gUnder)"/>'
    return s


def fist_front(cx, cy, rot=0, cls="uc"):
    """A fist drawn over the body, with its contact shadow (round-2 style)."""
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    return (f'<g clip-path="url(#{cls})"><g transform="translate(0 2.5)"><rect x="{cx-11:.1f}" y="{cy-10.5:.1f}" width="22" height="21" rx="8"{t} fill="#2B2230" opacity="0.3"/></g></g>'
            f'<rect x="{cx-12:.1f}" y="{cy-10.5:.1f}" width="24" height="21" rx="8"{t} fill="url(#gHand)"/>')


def write(cls, name, comment, d, parts):
    out = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n'
           f'<!-- {comment} -->\n<defs>\n{d}\n</defs>\n<g id="sprite" filter="url(#outline)">\n'
           + "\n".join(p for p in parts if p) + '\n</g>\n</svg>\n')
    p = R3 / cls / f"{cls}-{name}.svg"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(out, encoding="utf-8")
    return p
