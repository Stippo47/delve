"""The stand-in each round-9 kind wore in the game before this round, as an SVG: the file it borrowed, turned the way
the game turns a variant's colours (a Python copy of js/recolor.js recolorRGB), or for the kinds drawn in code (the
slimes, the slimelets the chain segments and the cogs wore) the game's procedural slime (js/sprites.js drawSlime) in
those colours. Written to tools/riffle/out/r9/before/ (scratch, git-ignored) for render9.py to draw as each design's
-before.png.
python befores9.py   (paths relative to this file)"""
import re, colorsys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ART = ROOT / "art"
OUT = ROOT / "tools" / "riffle" / "out" / "r9" / "before"


def recolor_rgb(r, g, b, spec):
    """js/recolor.js recolorRGB (hue degrees added, sat x, light +; no def here uses an accent)."""
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    h = (h + spec.get("hue", 0) / 360 + 1) % 1
    s = max(0, min(1, s * spec.get("sat", 1)))
    l = max(0, min(1, l + spec.get("light", 0)))
    R, G, B = colorsys.hls_to_rgb(h, l, s)
    return round(R * 255), round(G * 255), round(B * 255)


def recolor_text(text, spec):
    """Every colour turned, but the outline filter's ink: the game draws its own outline (parts.js INK) after the
    colours are turned, so the stand-in's outline stayed black."""
    def one(m):
        if m.group(1):
            return m.group(0)
        if text[max(0, m.start() - 13):m.start()].endswith('flood-color="'):
            return m.group(0)
        x = m.group(2)
        if len(x) == 3:
            x = "".join(c + c for c in x)
        n = int(x, 16)
        r, g, b = recolor_rgb(n >> 16, (n >> 8) & 255, n & 255, spec)
        return f"#{r:02x}{g:02x}{b:02x}"
    text = re.sub(r'(url\(|href=")?#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])', one, text)
    def rgba(m):
        r, g, b = recolor_rgb(int(m.group(1)), int(m.group(2)), int(m.group(3)), spec)
        return f"rgba({r},{g},{b}{m.group(4)})" if m.group(4) else f"rgb({r},{g},{b})"
    return re.sub(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)", rgba, text)


def slime_svg(small):
    """js/sprites.js drawSlime as an SVG: the outline drawn as a stroke of the same width the game uses."""
    c1, c2, lw = (("#B4D6F6", "#5C92D2", 18) if small else ("#8EC2F2", "#3F7AC4", 12))
    body = "M100 42 C140 42 156 72 156 104 C156 138 134 158 100 160 C66 158 44 138 44 104 C44 72 60 42 100 42 Z"
    drip = "M86 152 C90 170 96 180 100 184 C104 180 110 170 114 152 Z"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">
<!-- the game's procedural {'slimelet' if small else 'slime'} (js/sprites.js drawSlime), for the board only -->
<defs><linearGradient id="g" x1="0" y1="42" x2="0" y2="184" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>
<clipPath id="k"><path d="{body}"/></clipPath></defs>
<g stroke-linejoin="round"><path d="{drip}" fill="#2B2230" stroke="#2B2230" stroke-width="{lw}"/><path d="{body}" fill="#2B2230" stroke="#2B2230" stroke-width="{lw}"/>
<path d="{body}" fill="url(#g)"/><path d="{drip}" fill="url(#g)"/>
<g clip-path="url(#k)"><circle cx="108" cy="112" r="30" fill="rgba(20,70,60,0.22)"/><ellipse cx="78" cy="72" rx="14" ry="9" transform="rotate(-28.6 78 72)" fill="rgba(255,255,255,0.45)"/></g></g></svg>
"""


SLIME, SLIMELET = "@slime", "@slimelet"
P = "enemies/placeholder/"
# design -> (the file the stand-in borrowed, relative to art/, or a procedural slime; the variant's colour turn or None)
BEFORE = {
    # the Frost Hollow
    "frost-wolf": ("enemies/wolf.svg", {"hue": 175, "sat": 0.3, "light": 0.3}),
    "frost-ice-slime": (SLIME, {"hue": -12, "sat": 0.5, "light": 0.24}),
    "frost-spider": (P + "spider-hunter.svg", {"hue": 150, "sat": 0.6, "light": 0.18}),
    "frost-yeti": ("enemies/troll.svg", {"hue": 170, "sat": 0.12, "light": 0.34}),
    "frost-icicle-wraith": ("enemies/ghost.svg", {"hue": 175, "sat": 0.7, "light": 0.16}),
    "frost-spirit": ("enemies/ghost.svg", {"hue": 175, "sat": 0.8, "light": 0.2}),
    # the Ember Deep
    "ember-fire-spider": (P + "spider-hunter.svg", {"hue": -40, "sat": 1.5, "light": 0.02}),
    "ember-hellhound": ("enemies/wolf.svg", {"hue": -25, "sat": 1.7, "light": -0.16}),
    "ember-cinder-bat": (P + "bat.svg", {"hue": -30, "sat": 1.6, "light": 0.05}),
    "ember-spirit": ("enemies/ghost.svg", {"hue": -40, "sat": 1.8, "light": 0.1}),
    "ember-pit-lord": (P + "demon.svg", None),
    # the Gilded Spire
    "spire-fallen-angel": (P + "angel.svg", {"hue": 230, "sat": 0.55, "light": -0.3}),
    "spire-sun-blade": (P + "cherub.svg", {"hue": 18, "sat": 1.4, "light": 0.16}),
    "spire-choir-sprite": (P + "cherub.svg", {"hue": -45, "sat": 0.7, "light": 0.14}),
    "spire-golem": (P + "ogre.svg", {"sat": 0.12, "light": 0.04}),
    "spire-gilded-golem": (P + "ogre.svg", {"hue": -36, "sat": 2.2, "light": 0.12}),
    "spire-light-spirit": ("enemies/ghost.svg", {"hue": 40, "sat": 1.6, "light": 0.22}),
    "spire-ward-spirit": ("enemies/ghost.svg", {"hue": -100, "sat": 1.2, "light": 0.08}),
    "spire-herald-light": (P + "angel.svg", {"light": 0.14, "sat": 1.3}),
    "spire-herald-fallen": (P + "angel.svg", {"hue": 230, "sat": 0.55, "light": -0.3}),
    # the Sunken Dunes
    "dunes-scarab": (P + "spider-hunter.svg", {"hue": 120, "sat": 1.3, "light": -0.06}),
    "dunes-golden-scarab": (P + "spider-hunter.svg", {"hue": 210, "sat": 2.6, "light": 0.1}),
    "dunes-cobra": ("enemies/lizardman.svg", {"hue": 40, "sat": 0.8, "light": 0.04}),
    "dunes-jackal": (P + "bandit.svg", {"hue": 20, "sat": 0.7, "light": 0.08}),
    "dunes-mummy": ("enemies/rattler.svg", {"hue": 15, "sat": 0.4, "light": 0.16}),
    "dunes-sand-mage": ("enemies/orc-shaman.svg", {"hue": 35, "sat": 0.6, "light": 0.12}),
    "dunes-dust-devil": ("enemies/ghost.svg", {"hue": 35, "sat": 0.55, "light": 0.08}),
    "dunes-serpent-head": (P + "croc.svg", {"hue": 28, "sat": 0.7, "light": 0.1}),
    "dunes-serpent-coil": (SLIMELET, {"hue": -170, "sat": 0.55, "light": 0.14}),
    "dunes-dart-trap": ("enemies/mimic.svg", {"hue": 10, "sat": 0.35, "light": 0.06}),
    "dunes-venom-spirit": ("enemies/ghost.svg", {"hue": -120, "sat": 1.4, "light": 0.04}),
    "dunes-wind-spirit": ("enemies/ghost.svg", {"hue": 30, "sat": 0.4, "light": 0.2}),
    # the Clockwork Foundry
    "foundry-gear-sprite": (SLIMELET, {"hue": 0, "sat": 0, "light": -0.04}),
    "foundry-cog-sprite": (SLIMELET, {"hue": -170, "sat": 0.75, "light": 0}),
    "foundry-bomb-bot": (P + "slime-fire.svg", {"hue": 180, "sat": 0.15, "light": -0.12}),
    "foundry-auto-bomb": (P + "slime-fire.svg", {"hue": 200, "sat": 0.6, "light": -0.02}),
    "foundry-automaton": ("enemies/rattler.svg", {"hue": 25, "sat": 1.4, "light": -0.04}),
    "foundry-turret-steam": ("enemies/mimic.svg", {"hue": 190, "sat": 0.2, "light": -0.05}),
    "foundry-turret-flame": ("enemies/mimic.svg", {"hue": -20, "sat": 0.9, "light": -0.08}),
    "foundry-turret-gun": ("enemies/mimic.svg", {"hue": 190, "sat": 0.1, "light": -0.15}),
    "foundry-turret-laser": ("enemies/mimic.svg", {"hue": -60, "sat": 1.0, "light": -0.1}),
    "foundry-mortar": ("enemies/mimic.svg", {"hue": 190, "sat": 0.1, "light": 0.05}),
    "foundry-mortar-fire": ("enemies/mimic.svg", {"hue": -10, "sat": 1.3, "light": 0}),
    "foundry-mortar-gas": ("enemies/mimic.svg", {"hue": 70, "sat": 1.2, "light": 0}),
    "foundry-tesla-coil": (P + "snowman.svg", {"hue": -150, "sat": 0.6, "light": -0.25}),
    "foundry-repair-drone": (P + "bat.svg", {"hue": 190, "sat": 0.2, "light": 0.05}),
    "foundry-smith": (P + "bandit-brute.svg", {"hue": -15, "sat": 0.6, "light": -0.14}),
    "foundry-bee": (P + "bat.svg", {"hue": 25, "sat": 1.3, "light": 0.05}),
    "foundry-wasp": (P + "bat.svg", {"hue": 40, "sat": 1.4, "light": 0}),
    "foundry-hornet": (P + "bat.svg", {"hue": 10, "sat": 1.6, "light": -0.06}),
    "foundry-saw-blade": (SLIMELET, {"hue": 0, "sat": 0, "light": 0.14}),
    "foundry-crawler-head": (P + "spider-hunter.svg", {"hue": 180, "sat": 0.2, "light": -0.04}),
    "foundry-crawler-plate": (SLIMELET, {"hue": 0, "sat": 0, "light": -0.12}),
    "foundry-drill-bot": (P + "slime-fire.svg", {"hue": 190, "sat": 0.1, "light": 0.06}),
    "foundry-storm-spirit": ("enemies/ghost.svg", {"hue": 15, "sat": 1.4, "light": 0.2}),
    # the bosses that wore recoloured art
    "boss-goblin-chieftain": ("enemies/orc.svg", {"hue": 28, "sat": 1.15, "light": -0.1}),
    "boss-winter-queen": ("heroes/frost.svg", {"hue": 12, "sat": 0.55, "light": 0.16}),
    "boss-gilded-seraph": (P + "seraph.svg", {"hue": 10, "sat": 1.2, "light": 0.08}),
    "boss-choir-singer": (P + "cherub.svg", {"hue": 10, "sat": 1.1, "light": 0.1}),
}


def before_svg(name):
    f, spec = BEFORE[name]
    text = slime_svg(f == SLIMELET) if f in (SLIME, SLIMELET) else (ART / f).read_text(encoding="utf-8")
    if spec:
        text = recolor_text(text, spec)
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / f"{name}.svg"
    p.write_text(text, encoding="utf-8")
    return p


if __name__ == "__main__":
    import sys
    for n in sys.argv[1:] or BEFORE:
        print(before_svg(n).relative_to(ROOT).as_posix())
