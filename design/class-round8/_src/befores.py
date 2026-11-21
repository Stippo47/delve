"""The placeholder art each part-2 kind wore in the game before this round, as an SVG: the placeholder file, turned
the way the game turns a variant's colours (a Python copy of js/recolor.js recolorRGB), or for the rat king the
game's procedural rat (js/sprites.js drawRat) in its variant's colours. Written to tools/riffle/out/r8/before/
(scratch, git-ignored) for render8.py to draw as each design's -before.png.
python befores.py   (paths relative to this file)"""
import re, colorsys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ART = ROOT / "art" / "enemies"
OUT = ROOT / "tools" / "riffle" / "out" / "r8" / "before"


def recolor_rgb(r, g, b, spec):
    """js/recolor.js recolorRGB (hue degrees added, sat x, light +; accent ignored: no def here uses one)."""
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    h = (h + spec.get("hue", 0) / 360 + 1) % 1
    s = max(0, min(1, s * spec.get("sat", 1)))
    l = max(0, min(1, l + spec.get("light", 0)))
    R, G, B = colorsys.hls_to_rgb(h, l, s)
    return round(R * 255), round(G * 255), round(B * 255)


def recolor_text(text, spec):
    def one(m):
        if m.group(1):
            return m.group(0)
        x = m.group(2)
        if len(x) == 3:
            x = "".join(c + c for c in x)
        n = int(x, 16)
        r, g, b = recolor_rgb(n >> 16, (n >> 8) & 255, n & 255, spec)
        return f"#{r:02x}{g:02x}{b:02x}"
    return re.sub(r'(url\(|href=")?#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])', one, text)


RAT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">
<!-- the game's procedural rat (js/sprites.js drawRat), with the springy tail it draws apart, for the board only -->
<defs><linearGradient id="e" x1="0" y1="60" x2="0" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#E9B7AE"/><stop offset="1" stop-color="#C98E86"/></linearGradient>
<linearGradient id="b" x1="0" y1="44" x2="0" y2="176" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9C8676"/><stop offset="1" stop-color="#6F5A4D"/></linearGradient>
<clipPath id="k"><path d="M100 44 C134 44 150 72 150 100 C150 124 134 142 116 150 L100 176 L84 150 C66 142 50 124 50 100 C50 72 66 44 100 44 Z"/></clipPath></defs>
<g stroke-linejoin="round" stroke-linecap="round">
<path d="M100 50 C98 30 112 18 126 14 C136 12 140 4 136 -2" fill="none" stroke="#2B2230" stroke-width="12"/>
<path d="M100 50 C98 30 112 18 126 14 C136 12 140 4 136 -2" fill="none" stroke="#D8A39A" stroke-width="3"/>
<path d="M62 70 C44 58 36 78 46 92 C54 92 62 84 66 76 Z M138 70 C156 58 164 78 154 92 C146 92 138 84 134 76 Z M100 44 C134 44 150 72 150 100 C150 124 134 142 116 150 L100 176 L84 150 C66 142 50 124 50 100 C50 72 66 44 100 44 Z" fill="#2B2230" stroke="#2B2230" stroke-width="16"/>
<path d="M62 70 C44 58 36 78 46 92 C54 92 62 84 66 76 Z M138 70 C156 58 164 78 154 92 C146 92 138 84 134 76 Z" fill="url(#e)"/>
<path d="M100 44 C134 44 150 72 150 100 C150 124 134 142 116 150 L100 176 L84 150 C66 142 50 124 50 100 C50 72 66 44 100 44 Z" fill="url(#b)"/>
<rect x="100" y="0" width="120" height="220" fill="#2B2230" fill-opacity="0.18" clip-path="url(#k)"/>
<circle cx="100" cy="170" r="7" fill="#E2A1A5"/></g></svg>
"""

# kind -> (placeholder file, the variant's colour turn or None)
BEFORE = {
    "wild-wolf": ("placeholder/wolf.svg", None),
    "wild-dire-wolf": ("placeholder/wolf.svg", {"light": -0.34, "sat": 0.35}),
    "wild-alpha": ("placeholder/wolf.svg", {"light": 0.14, "sat": 0.6}),
    "bandit-sword": ("placeholder/bandit.svg", None),
    "bandit-torch": ("placeholder/bandit.svg", {"hue": 18, "light": 0.02}),
    "bandit-greatsword": ("placeholder/bandit.svg", {"hue": -24, "sat": 0.8, "light": -0.06}),
    "bandit-axe": ("placeholder/bandit.svg", {"hue": 40, "sat": 0.9}),
    "bandit-spear": ("placeholder/bandit-b.svg", {"hue": 30, "sat": 0.9}),
    "bandit-daggers": ("placeholder/bandit-b.svg", None),
    "bandit-poacher": ("placeholder/poacher.svg", None),
    "bandit-brute": ("placeholder/bandit-brute.svg", None),
    "bandit-chief": ("placeholder/bandit-chief.svg", None),
    "wild-boar": ("placeholder/boar.svg", None),
    "wild-sproutling": ("goblin.svg", {"hue": 22, "sat": 1.25, "light": 0.1}),
    "wild-ent": ("troll.svg", {"hue": -70, "sat": 0.75, "light": -0.08}),
    "wild-wisp": ("ghost.svg", {"hue": -120, "sat": 1.6, "light": 0.06}),
    "wild-elder-ent": ("troll.svg", {"hue": -78, "sat": 0.65, "light": -0.14}),
    "sewer-rat-king": (None, {"light": -0.12, "sat": 0.8}),
    "sewer-croc": ("placeholder/croc.svg", None),
    "sewer-crab": ("placeholder/spider-hunter.svg", {"hue": -40, "sat": 1.4, "light": 0.06}),
}


def before_svg(name):
    f, spec = BEFORE[name]
    text = RAT if f is None else (ART / f).read_text(encoding="utf-8")
    if spec:
        text = recolor_text(text, spec)
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / f"{name}.svg"
    p.write_text(text, encoding="utf-8")
    return p


if __name__ == "__main__":
    for n in BEFORE:
        print(before_svg(n).relative_to(ROOT).as_posix())
