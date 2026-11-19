"""Two context boards for the props, at true scale (room units), rendered to ../../props/renders/:
- scene.png: a bit of room with a wall, doors and every prop, the archer for scale;
- door-glows.png: the door shut, open, and open with each room kind's glow, side by side.
Run make_props.py first.  python scene.py
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
PROPS = (HERE / ".." / ".." / "props").resolve()
RENDERS = PROPS / "renders"
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb  # noqa: E402

S = 56 / 22
n = [0]


def inline(path, x, y, rot=0):
    """Place an SVG with its box centre (100,100) at room point (x, y), ids made unique."""
    txt = pathlib.Path(path).read_text(encoding="utf-8")
    n[0] += 1
    p = f"p{n[0]}-"
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', txt).group(1).split()]
    inner = re.sub(r"^<svg[^>]*>|</svg>\s*$", "", txt.strip())
    inner = re.sub(r"<!--.*?-->", "", inner, flags=re.S)
    inner = re.sub(r'id="([^"]+)"', lambda m: f'id="{p}{m.group(1)}"', inner)
    inner = re.sub(r'href="#([^"]+)"', lambda m: f'href="#{p}{m.group(1)}"', inner)
    inner = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{p}{m.group(1)})", inner)
    w = vb[2] / S
    return (f'<g transform="translate({x} {y}) rotate({rot})"><svg x="{-w * (100 - vb[0]) / vb[2]:.2f}" y="{-w * (100 - vb[1]) / vb[3]:.2f}" '
            f'width="{w:.2f}" height="{w:.2f}" viewBox="{" ".join(str(v) for v in vb)}" overflow="visible">{inner}</svg></g>')


def shadow(x, y, r):  # the game's ground shadow under pillars, cast towards the bottom of the screen
    return f'<ellipse cx="{x + 4}" cy="{y + r * 0.45}" rx="{r * 1.1}" ry="{r * 0.6}" fill="rgba(43,34,48,0.22)"/>'


def floor(w, h, top):
    tiles = "".join(f'<rect x="{x * 52 + (13 if (y % 2) else 0)}" y="{top + 8 + y * 52}" width="34" height="34" rx="8" fill="#D9CDB6" opacity="0.5"/>'
                    for y in range(int((h - top) / 52) + 1) for x in range(int(w / 52) + 1))
    return (f'<rect width="{w}" height="{h}" fill="#E8DECB"/>{tiles}'
            f'<rect x="0" y="0" width="{w}" height="{top}" fill="#2F2734"/>'
            f'<rect x="0" y="{top - 6}" width="{w}" height="6" fill="#7A6D60"/>')


def page(svg_txt, name, w, h, px):
    f = HERE / f"_{name}.svg"
    f.write_text(svg_txt, encoding="utf-8")
    rb.OUT = RENDERS
    html = (f'<!doctype html><meta charset=utf-8><style>body{{margin:0;background:#EDE6D8}}</style>'
            f'<img src="{f.as_uri()}" style="width:{px}px;height:{px * h / w:.0f}px;display:block">')
    rb.shoot(html, RENDERS / f"{name}.png", px, int(px * h / w))
    f.unlink()
    print("made", name)


def scene():
    W, H, top = 620, 470, 70
    a = PROPS
    parts = [floor(W, H, top)]
    for x, k in [(90, "door-shut"), (240, "door-open-fight"), (390, "door-open-treasure"), (540, "door-open-choice")]:
        parts.append(inline(a / f"{k}.svg", x, top))
    things = [(70, 180, "obstacle-rock", 30), (190, 190, "obstacle-pillar", 30), (560, 200, "obstacle-crates", 30),
              (330, 330, "fountain", 38)]
    for x, y, k, r in things:
        parts.append(shadow(x, y, r))
    for x, y, k, r in things:
        parts.append(inline(a / f"{k}.svg", x, y))
    parts += [inline(a / "trap-spikes-up.svg", 70, 290), inline(a / "trap-spikes-down.svg", 70, 400),
              inline(a / "hazard-oil.svg", 190, 330),
              inline(a / "chest-closed.svg", 450, 290), inline(a / "chest-locked.svg", 520, 290),
              inline(a / "chest-open.svg", 590, 290),
              inline(a / "pedestal.svg", 450, 410), inline(a / "pedestal.svg", 520, 410),
              f'<ellipse cx="{392}" cy="{210}" rx="{22 * 1.25}" ry="{22 * 0.55}" fill="rgba(43,34,48,0.18)"/>',
              inline(ROOT / "design" / "archer-final" / "archer.svg", 390, 195)]
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{"".join(parts)}</svg>'
    page(svg, "scene", W, H, 1400)


def glows():
    kinds = ["shut", "open", "fight", "hazard", "elite", "treasure", "fountain", "choice", "boss"]
    W, H, top = 9 * 140 + 20, 200, 70
    parts = [floor(W, H, top)]
    for i, k in enumerate(kinds):
        name = "door-shut" if k == "shut" else "door-open" if k == "open" else f"door-open-{k}"
        x = 80 + i * 140
        parts.append(inline(PROPS / f"{name}.svg", x, top))
        parts.append(f'<text x="{x}" y="{H - 10}" font-family="Segoe UI, sans-serif" font-size="15" font-weight="600" '
                     f'fill="#6b6070" text-anchor="middle">{k}</text>')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{"".join(parts)}</svg>'
    page(svg, "door-glows", W, H, 1800)


if __name__ == "__main__":
    scene(); glows()
    import shutil; shutil.rmtree(RENDERS / "_profile", ignore_errors=True)
