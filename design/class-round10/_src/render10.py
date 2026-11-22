"""Render the round-10 boards into design/class-round10/<folder>/renders/.
A single design (a fix that goes into the game) gets round 9's board (<name>.png: big at its size in the game beside the
archer, its 8 facings, the 8 facings at game size beside the archer), <name>-thumb.png, and <name>-before.png: the exact
file the note was on, on the same board. A set of variants gets one board (<group>.png): what the designer saw first
("before"), then every variant, labelled, all at their size in the game beside the archer, and a row at game size in
four facings each; plus <group>-thumb.png (the variants side by side).
Scale: k = (vr / headR) / (22 / 56), the design's 220 box against the archer's (js defs: vr, headR).
python render10.py [name-or-group ...]      (paths relative to this file; none = everything)"""
import sys, shutil, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R10 = HERE.parent
DESIGN = R10.parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
sys.path.insert(0, str(HERE))
import render_board as rb

ARCHER = 22 / 56
SHOOT = ROOT / "tools" / "riffle" / "out" / "r10" / "shoot"   # Edge's page and profile (git-ignored)
R8, R9, R7 = DESIGN / "class-round8", DESIGN / "class-round9", DESIGN / "class-round7"

SINGLE, VARS = {}, {}


def k_of(vr, hr):
    return (vr / hr) / ARCHER


def one(name, label, vr, hr, before=None, bvr=None, bhr=None, folder="enemies", src=None, blabel=None):
    """A single design. before: the file the note was on (a path under design/), drawn at bvr / bhr (default: the same)."""
    SINGLE[name] = dict(label=label, k=k_of(vr, hr), before=before, bk=k_of(bvr or vr, bhr or hr), folder=folder, src=src,
                        blabel=blabel)


def var(group, title, items, vr, hr, before=None, blabel="before", bvr=None, bhr=None, folder="enemies", ks=None):
    """A set of variants: items = [(file under class-round10/<folder> or an absolute Path, label)]; ks = a scale per item
    if they differ."""
    VARS[group] = dict(title=title, items=items, k=k_of(vr, hr), before=before, blabel=blabel,
                       bk=k_of(bvr or vr, bhr or hr), folder=folder, ks=ks)


def P(folder, f):
    return f if isinstance(f, pathlib.Path) else R10 / folder / f


# ------------------------------------------------------------------ boards
CSS = (f"body{{margin:0;background:{rb.BG};font:600 18px system-ui,Segoe UI,sans-serif;color:#6b6070}}"
       ".top{display:flex;gap:28px;padding:24px 40px 0;align-items:flex-end;flex-wrap:nowrap}"
       ".lab{text-align:center;margin-top:4px} .lab.me{color:#2B2230;font-size:21px} .lab.sm{font-size:14px}"
       ".row{display:flex;gap:14px;padding:14px 40px 0;align-items:center}"
       ".c{display:flex;align-items:center;justify-content:center}"
       ".k{width:110px;font-size:15px;flex:none} h1{font:700 24px system-ui;color:#2B2230;margin:0;padding:18px 40px 0}"
       ".sep{width:2px;align-self:stretch;background:#d8cfbf;margin:0 6px}")


def board_single(src, lab, out, k):
    big = 270
    sp = rb.sprite
    zoom = k < 0.8
    face = max(k, 0.8)
    rot = "".join(f'<div class="c" style="width:{70 * face:.0f}px;height:{70 * face:.0f}px">{sp(src, 70 * face, d)}</div>'
                  for d in range(0, 360, 45))
    rot40 = "".join(f'<div class="c" style="width:{max(46, 40 * k):.0f}px;height:{max(46, 40 * k):.0f}px">'
                    f'{sp(src, 40 * k, d)}</div>' for d in range(0, 360, 45))
    close = (f'<div>{sp(src, big)}<div class=lab>close up (x{1 / k:.1f})</div></div>' if zoom else "")
    html = f"""<!doctype html><meta charset=utf-8><style>{CSS}</style>
    <div class=top>
      <div>{sp(rb.ARCHER, big)}<div class=lab>archer (for scale)</div></div>
      <div>{sp(src, big * k)}<div class="lab me">{lab}</div><div class="lab sm">at its size in the game</div></div>
      {close}
    </div>
    <div class=row><div class=k>8 facings</div>{rot}</div>
    <div class=row><div class=k>game size</div>{rot40}<div class="c" style="margin-left:24px;width:46px;height:46px">{sp(rb.ARCHER, 40)}</div><div class=k>archer</div></div>
    """
    w = int(max(900, 40 + 270 + 28 + big * k + 28 + (big + 28 if zoom else 0) + 60, 190 + 8 * (70 * face + 14)))
    h = int(24 + max(big * k, big) + 70 + 14 + 70 * face + 14 + max(46, 40 * k) + 40)
    rb.shoot(html, out, w, h)


def board_vars(title, cells, out, before=None):
    """cells = [(src, label, k)]; before = (src, label, k) or None."""
    sp = rb.sprite
    kmax = max([c[2] for c in cells] + ([before[2]] if before else []) + [1])
    n = len(cells) + (1 if before else 0)
    big = min(230, max(150, (1500 - 200) / (n * max(kmax, 0.75) + 0.8)))   # the archer's box, px
    zoomk = max(1.0, 0.75 / min(c[2] for c in cells))     # small designs are drawn bigger than their game size
    def cell(src, lab, k, me=True):
        return (f'<div>{sp(src, big * k * zoomk)}<div class="lab{" me" if me else ""}">{lab}</div></div>')
    top = f'<div>{sp(rb.ARCHER, big)}<div class=lab>archer</div></div>'
    if zoomk > 1.01:
        top = f'<div>{sp(rb.ARCHER, big / 1.6)}<div class="lab sm">archer (the designs are shown x{zoomk:.1f})</div></div>'
    if before:
        top += cell(before[0], before[1], before[2], False) + '<div class=sep></div>'
    top += "".join(cell(*c) for c in cells)
    g = 44
    def small(src, k):
        return "".join(f'<div class="c" style="width:{max(g, g * k):.0f}px;height:{max(g, g * k):.0f}px">{sp(src, g * k, d)}</div>'
                       for d in (0, 45, 180, 270))
    row = f'<div class="c" style="width:{g}px;height:{g}px">{sp(rb.ARCHER, g)}</div>'
    if before:
        row += '<div class=sep></div>' + small(before[0], before[2])
    for c in cells:
        row += '<div class=sep></div>' + small(c[0], c[2])
    html = f"""<!doctype html><meta charset=utf-8><style>{CSS}</style><h1>{title}</h1>
    <div class=top>{top}</div>
    <div class=row style="padding-top:22px"><div class=k>game size<br>(archer first)</div>{row}</div>"""
    wtop = 80 + (big if zoomk <= 1.01 else big / 1.6) + 28 + sum(big * c[2] * zoomk + 28 for c in cells) + ((big * before[2] * zoomk + 50) if before else 0)
    wrow = 220 + g + sum(4 * max(g, g * c[2]) + 4 * 14 + 30 for c in cells + ([before] if before else []))
    w = int(max(900, wtop, wrow))
    h = int(60 + 24 + max(big * kmax * zoomk, big) + 40 + 22 + max(g, g * kmax) + 46)
    rb.shoot(html, out, w, h)


def thumb_vars(cells, out):
    sp = rb.sprite
    n = len(cells)
    s = 150
    html = (f"<!doctype html><meta charset=utf-8><style>body{{margin:0;background:{rb.BG};display:flex;align-items:center;"
            f"justify-content:center;gap:6px;width:{n * (s + 6) + 10}px;height:{s + 16}px}}</style>"
            + "".join(sp(c[0], s) for c in cells))
    rb.shoot(html, out, n * (s + 6) + 10, s + 16)


def render(name):
    SHOOT.mkdir(parents=True, exist_ok=True)
    rb.OUT = SHOOT
    if name in SINGLE:
        d = SINGLE[name]
        out = R10 / d["folder"] / "renders"
        out.mkdir(parents=True, exist_ok=True)
        src = d["src"] or (R10 / d["folder"] / f"{name}.svg")
        board_single(src, d["label"], out / f"{name}.png", d["k"])
        rb.thumb(src, out / f"{name}-thumb.png")
        if d["before"]:
            board_single(DESIGN / d["before"], d["blabel"] or (d["label"] + " (before: what you saw)"), out / f"{name}-before.png", d["bk"])
    else:
        d = VARS[name]
        out = R10 / d["folder"] / "renders"
        out.mkdir(parents=True, exist_ok=True)
        ks = d["ks"] or [d["k"]] * len(d["items"])
        cells = [(P(d["folder"], f), lab, k) for (f, lab), k in zip(d["items"], ks)]
        before = (DESIGN / d["before"], d["blabel"], d["bk"]) if d["before"] else None
        board_vars(d["title"], cells, out / f"{name}.png", before)
        thumb_vars(cells, out / f"{name}-thumb.png")
        if before:
            board_single(before[0], d["blabel"], out / f"{name}-before.png", before[2])
    shutil.rmtree(SHOOT / "_profile", ignore_errors=True)
    print("rendered", name)


# ================================================================== group 1: the art-round8 notes
r8 = "class-round8/enemies/"
var("ghost-a-tails", 'Ghost A: "Tail is still a bit weird. Try 3 types."',
    [("ghost-a-tail-point.svg", "1 point"), ("ghost-a-tail-stub.svg", "2 stub"), ("ghost-a-tail-hem.svg", "3 hem")],
    22, 58, before=r8 + "ghost-a.svg", blabel="before")
var("ghost-b-tails", 'Ghost B: "Same thing" (3 tail types)',
    [("ghost-b-tail-point.svg", "1 point"), ("ghost-b-tail-stub.svg", "2 stub"), ("ghost-b-tail-hem.svg", "3 hem")],
    22, 58, before=r8 + "ghost-b.svg", blabel="before")
one("greenskin-orc", "Orc: tusks to the side, hair fixed", 27, 62, before=r8 + "greenskin-orc.svg")
one("sewer-croc", "Croc: the axes", 27, 56, before=r8 + "sewer-croc.svg")
# the trolls: boards composed with the boulder (boards/, build10.py troll_boards); "slightly smaller": r 60 -> 54,
# vr 44 -> 40, the boulder the size it is now. Each composed board's scale comes from its fit into the box.
import build10
_TS = build10.troll_boards()[1] if (R10 / "enemies" / "greenskin-troll-head-a.svg").exists() else {}
if _TS:
    B = R10 / "boards"
    for kind, title in (("head", 'Troll: "Try different heads. Make them slightly smaller keep boulder same size." (10% smaller, the same boulder)'),
                        ("hands", 'Troll: "Make version without arms. Just hands" (the same three heads)')):
        VARS["troll-heads" if kind == "head" else "troll-hands"] = dict(title=title, items=[(B / f"greenskin-troll-{kind}-{h}.svg", f"head {h.upper()}") for h in "abc"],
                                      k=1, before="class-round10/boards/greenskin-troll-before.svg", blabel="before",
                                      bk=_TS["greenskin-troll-before"] / ARCHER, folder="enemies",
                                      ks=[_TS[f"greenskin-troll-{kind}-{h}"] / ARCHER for h in "abc"])
for n, lab in (("sword", "Bandit, sword and shield"), ("torch", "Torch bandit"), ("greatsword", "Greatsword bandit"),
               ("axe", "Axe bandit"), ("spear", "Spear bandit"), ("daggers", "Knife bandit"), ("poacher", "Poacher")):
    one(f"bandit-{n}", lab, 22, 54, before=r8 + f"bandit-{n}.svg")
one("bandit-brute", "Bandit brute", 30, 64, before=r8 + "bandit-brute.svg")
one("bandit-chief", "The Bandit Chief", 32, 54, before=r8 + "bandit-chief.svg")
var("wolves-nopaws", '"Show me wolves without paws"',
    [("wild-wolf-nopaws.svg", "wolf"), ("wild-dire-wolf-nopaws.svg", "dire wolf"), ("wild-alpha-nopaws.svg", "the Alpha")],
    18, 35, ks=[k_of(18, 35), k_of(18 * 1.25, 35), k_of(34, 40)])
var("alpha-scar", 'The Alpha: "Change face scar"',
    [("wild-alpha-scar-claws.svg", "A claw marks"), ("wild-alpha-scar-snout.svg", "B stitched scar")],
    34, 40, before=r8 + "wild-alpha.svg")
one("wild-dire-wolf", "Dire wolf: a bigger mane, the body 10% bigger", 18 * 1.25, 35, before=r8 + "wild-dire-wolf.svg")
var("boar", 'Thornback boar: "I could see it almost working... Make variants."',
    [("wild-boar-ridge.svg", "A ridge"), ("wild-boar-quills.svg", "B quills"), ("wild-boar-plates.svg", "C plates")],
    25, 41, before=r8 + "wild-boar.svg")
var("ent-faces", 'Ent: "Face variants"',
    [("wild-ent-face-brow.svg", "A leaf brows"), ("wild-ent-face-nose.svg", "B nose"), ("wild-ent-face-hollows.svg", "C hollows")],
    34, 59, before=r8 + "wild-ent.svg")
var("elder-ent-faces", 'The Elder Ent: "Change face. 3 versions. They should also be very big" (shown at 3 heroes across)',
    [("wild-elder-ent-face-brows.svg", "A scowl"), ("wild-elder-ent-face-nose.svg", "B nose and moustache"),
     ("wild-elder-ent-face-glow.svg", "C lantern")],
    72, 66, before=r8 + "wild-elder-ent.svg", blabel="before (its size until now)", bvr=48)
var("sproutling", 'Sproutling: "Don\'t like." Three new takes',
    [("wild-sproutling-bulb.svg", "A turnip"), ("wild-sproutling-acorn.svg", "B acorn"), ("wild-sproutling-bud.svg", "C bud")],
    15, 34, before=r8 + "wild-sproutling.svg")

# ================================================================== group 2: the art-round9 notes
r9 = "class-round9/enemies/"
B10 = R10 / "boards"
# the Frost Hollow
one("frost-icicle-wraith", "Icicle wraith: a banshee of the ice", 22, 37, before=r9 + "frost-icicle-wraith.svg")
var("frost-spirit", 'Frost spirit: "That tail should be like that rat tail where it\'s wiggly/ follows behind"',
    [(B10 / "frost-spirit-code-tail.svg", "the tail drawn by the game (a mock-up)"), ("spirit-core-frost.svg", "the art: the core alone")],
    15, 30, before=r9 + "frost-spirit.svg", blabel="before: the tail drawn in")
one("frost-yeti", "Yeti: the face, the nose, the fangs", 31, 68, before=r9 + "frost-yeti.svg")
one("yeti-snowball", "The yeti's snowball: no lumps", 25 * 86.4 / 30 / 220 * 100, 100, before="class-round9/props/yeti-snowball.svg", folder="props")
# the Gilded Spire
one("spire-choir-sprite", "Choir sprite: the hair", 16, 40, before=r9 + "spire-choir-sprite.svg")
one("spire-fallen-angel", "Fallen angel", 23, 56, before=r9 + "spire-fallen-angel.svg")
one("spire-herald-light", "Herald of Light", 34, 56, before=r9 + "spire-herald-light.svg")
one("spire-herald-fallen", "Fallen Herald", 34, 56, before=r9 + "spire-herald-fallen.svg")
var("golem-bodies", 'Golem: "First get down basic golems body. Make 3 variants." (the eye kept)',
    [("spire-golem-boulders.svg", "A boulders"), ("spire-golem-blocks.svg", "B blocks"), ("spire-golem-hunch.svg", "C hunch")],
    33, 66, before=r9 + "spire-golem.svg")
var("gilded-golems", 'Gilded golem: "Then make gilded. Note I love the eye." (each body gilded)',
    [("spire-gilded-golem-boulders.svg", "A boulders"), ("spire-gilded-golem-blocks.svg", "B blocks"), ("spire-gilded-golem-hunch.svg", "C hunch")],
    33, 66, before=r9 + "spire-gilded-golem.svg")
# the Sunken Dunes
one("dunes-cobra", "Cobra", 19, 54, before=r9 + "dunes-cobra.svg", bhr=48)
one("dunes-jackal", "Jackal guard: the same shape and colours, drawn again", 22, 54, before=r9 + "dunes-jackal.svg")
one("dunes-mummy", "Mummy", 24, 54, before=r9 + "dunes-mummy.svg")
one("dunes-serpent-head", "Sand serpent (the head)", 21, 40, before=r9 + "dunes-serpent-head.svg")
one("dunes-serpent-coil", "Sand serpent (a body segment)", 20, 55, before=r9 + "dunes-serpent-coil.svg")
one("dunes-sand-serpent", "Sand serpent: head and six segments as the game lays them", 100, 100, folder="boards")
# the Clockwork Foundry
one("foundry-bee", "Bee (copper): one body", 12, 56, before=r9 + "foundry-bee.svg", bhr=48)
one("foundry-wasp", "Wasp (copper): a head and one abdomen", 12, 58, before=r9 + "foundry-wasp.svg", bhr=50)
one("foundry-hornet", "Hornet (copper): a head and one abdomen", 15, 62, before=r9 + "foundry-hornet.svg", bhr=52)
one("foundry-gear-sprite", "Gear sprite", 18, 65, before=r9 + "foundry-gear-sprite.svg")
one("foundry-cog-sprite", "Cog sprite", 18, 65, before=r9 + "foundry-cog-sprite.svg")
one("foundry-turret-gun", "Gun turret: set into the wall, more parts", 22, 60, before=r9 + "foundry-turret-gun.svg")
one("foundry-turret-steam", "Steam turret", 22, 60, before=r9 + "foundry-turret-steam.svg")
# the bosses
one("boss-choir-singer", "Choir singer: the book turned, the hair", 20, 40, before=r9 + "boss-choir-singer.svg")
one("boss-goblin-chieftain", "The Goblin Chieftain", 38, 67, before=r9 + "boss-goblin-chieftain.svg")
one("boss-gilded-seraph", "The Gilded Seraph", 38, 58, before=r9 + "boss-gilded-seraph.svg")
var("boss-biblical-angel", '"I want one of those biblically accurate angels" (one drawn for the boss lane; beside it the seraph, redrawn)',
    [("boss-biblical-angel.svg", "a biblically accurate angel"), ("boss-gilded-seraph.svg", "the Gilded Seraph, redrawn")],
    38, 58, before=r9 + "boss-gilded-seraph.svg", blabel="before: the seraph you saw")

# ================================================================== group 3: the designer's message of 2026-11-22
one("spire-sun-blade", 'Sun blade: "much bigger. Like 3 units across"', 52, 58, before=r9 + "spire-sun-blade.svg", bvr=17, bhr=58,
    blabel="Sun blade (before: its art and size until now)")
one("slime", "Slime: the picked slime, tail removed, in the game's blue", 22, 64,
    before="class-round6/enemies/slime-big.svg", blabel="The slime you picked (round 6: the tail removed)")
one("slime-small", "Slimelet: the same slime, paler, no bone", 14, 64)

if __name__ == "__main__":
    want = sys.argv[1:]
    for n in want or (list(SINGLE) + list(VARS)):
        render(n)
