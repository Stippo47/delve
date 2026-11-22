"""Render the round-11 boards into design/class-round11/<folder>/renders/ (render10.py's boards, round 11's list).
A single design (a fix that goes into the game) gets round 9's board (<name>.png: big at its size in the game beside the
archer, its 8 facings, the 8 facings at game size beside the archer), <name>-thumb.png, and <name>-before.png: the exact
file the note was on, on the same board. A set of variants gets one board (<group>.png): what the designer saw first
("before"), then every variant, labelled, all at their size in the game beside the archer, and a row at game size in
four facings each; plus <group>-thumb.png (the variants side by side).
Scale: k = (vr / headR) / (22 / 56), the design's 220 box against the archer's (js defs: vr, headR).
python render11.py [name-or-group ...]      (paths relative to this file; none = everything)"""
import sys, shutil, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R11 = HERE.parent
DESIGN = R11.parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
sys.path.insert(0, str(HERE))
import render_board as rb

ARCHER = 22 / 56
SHOOT = ROOT / "tools" / "riffle" / "out" / "r11" / "shoot"   # Edge's page and profile (git-ignored)
R8, R9, R10 = DESIGN / "class-round8", DESIGN / "class-round9", DESIGN / "class-round10"

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
    return f if isinstance(f, pathlib.Path) else R11 / folder / f


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
        out = R11 / d["folder"] / "renders"
        out.mkdir(parents=True, exist_ok=True)
        src = d["src"] or (R11 / d["folder"] / f"{name}.svg")
        board_single(src, d["label"], out / f"{name}.png", d["k"])
        rb.thumb(src, out / f"{name}-thumb.png")
        if d["before"]:
            board_single(DESIGN / d["before"], d["blabel"] or (d["label"] + " (before: what you saw)"), out / f"{name}-before.png", d["bk"])
    else:
        d = VARS[name]
        out = R11 / d["folder"] / "renders"
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


r8, r9, r10 = "class-round8/enemies/", "class-round9/enemies/", "class-round10/enemies/"
E10 = R10 / "enemies"
import boards11
_TS = boards11.scales()

# ================================================================== picks, wired into the game as picked
one("ghost", "Ghost A, tail 1 (the point): in the game", 22, 58, src=E10 / "ghost-a-tail-point.svg", before=r8 + "ghost-a.svg")
one("ghost-b", "Ghost B, tail 1 (the point): in the game's files", 22, 58, src=E10 / "ghost-b-tail-point.svg", before=r8 + "ghost-b.svg")
one("wild-elder-ent", "The Elder Ent, face B: in the game", 60, 66, src=E10 / "wild-elder-ent-face-nose.svg", before=r8 + "wild-elder-ent.svg", bvr=48)
one("spirit-core-frost", "Frost spirit: the core; the game draws the tail", 15, 30, src=E10 / "spirit-core-frost.svg", before=r9 + "frost-spirit.svg")

# ================================================================== picks with a change
one("greenskin-troll", 'Troll, head B: "Sharper jaw. Slightly longer head. No mouth. Long nose." (with arms)', 1, 1, folder="boards",
    before="class-round10/boards/greenskin-troll-head-b.svg", blabel="Troll, head B (before: what you picked)")
SINGLE["greenskin-troll"]["k"] = SINGLE["greenskin-troll"]["bk"] = _TS["greenskin-troll"] / ARCHER
one("wild-ent", 'Ent, face B: "Remove mouth... Take leaf off nose"', 34, 59, before=r10 + "wild-ent-face-nose.svg")
WK = [k_of(18, 35), k_of(18 * 1.25, 35), k_of(34, 40)]
var("wolves", 'Wolves without paws: "Bring their heads forwards a bit. Shorten body a bit." Below: "with the paws rendering under the body"',
    [("wild-wolf.svg", "wolf"), ("wild-dire-wolf.svg", "dire wolf"), ("wild-alpha.svg", "the Alpha (claw marks)"),
     ("wild-wolf-paws-under.svg", "wolf, paws under"), ("wild-dire-wolf-paws-under.svg", "dire wolf, paws under"),
     ("wild-alpha-paws-under.svg", "Alpha, paws under")], 18, 35, ks=WK + WK)
var("wolves-before", "The wolves without paws as you saw them (round 10)",
    [(E10 / "wild-wolf-nopaws.svg", "wolf"), (E10 / "wild-dire-wolf-nopaws.svg", "dire wolf"), (E10 / "wild-alpha-nopaws.svg", "the Alpha")], 18, 35, ks=WK)
one("wild-dire-wolf-less-spiky", 'Dire wolf: "Less spikey" (only the mane, shown with its paws as on your tile)', 18 * 1.25, 35, before=r10 + "wild-dire-wolf.svg")
var("boar", 'Thornback boar: "Ridge. Show me without the mane"',
    [(E10 / "wild-boar-ridge.svg", "A the ridge, as picked"), ("wild-boar-ridge-no-crest.svg", "B no dark crest"), ("wild-boar-ridge-no-ruff.svg", "C no neck ruff")],
    25, 41, before=r8 + "wild-boar.svg", blabel="the game's boar until now")

# ================================================================== fixes: the Wildwood and the Sewers
one("greenskin-orc", 'Orc: "Pony tail layer problem. Try without hair tie"', 27, 62, before=r10 + "greenskin-orc.svg")
var("croc", 'Croc: "Aim inwards. Put a chip in them and make them rusted (save this version though)... mirror it"',
    [("sewer-croc.svg", "A aimed in, rusted, chipped"), ("sewer-croc-steel.svg", "the steel version, saved"), ("sewer-croc-blades-in.svg", "B if you meant the blades")],
    27, 56, before=r10 + "sewer-croc.svg")
one("bandit-axe", 'Axe bandit: "Flip the axe"', 22, 54, before=r10 + "bandit-axe.svg")
one("bandit-daggers", 'Knife bandit: "Pigtail not layered properly"', 22, 54, before=r10 + "bandit-daggers.svg")
one("bandit-sword", 'Sword bandit: the strip "2 lines dark on 1 side light on the other"', 22, 54, before=r10 + "bandit-sword.svg")
one("bandit-brute", 'Bandit brute: no line in the bandanna (and so for everyone)', 30, 64, before=r10 + "bandit-brute.svg")
one("bandit-chief", "The Bandit Chief: no line in the bandanna", 32, 54, before=r10 + "bandit-chief.svg")
for n, lab, ids in (("torch", 'Torch bandit: "Meh. Don\'t like the torch. Pretty cool hat... more suited for an outlaw"',
                     (("hat", "A the hat kept, a new torch"), ("cowl", "B sackcloth cowl"), ("soot", "C red hair, soot"))),
                    ("greatsword", 'Greatsword bandit: "Meh"', (("helm", "A deserter's helm"), ("hood", "B headsman's hood"), ("horns", "C horned raider"))),
                    ("spear", 'Spear bandit: "Try again"', (("kettle", "A kettle hat, boar spear"), ("wrap", "B striped wrap"), ("straw", "C straw hat"))),
                    ("poacher", 'Poacher: "Try again"', (("antlers", "A antlered hood"), ("quiver", "B hood and quiver"), ("game", "C beard, a brace of birds")))):
    var(f"bandit-{n}", lab, [(f"bandit-{n}-{i}.svg", l) for i, l in ids], 22, 54, before=r10 + f"bandit-{n}.svg")

# ================================================================== fixes: Frost, Spire, Dunes
one("frost-icicle-wraith", 'Icicle wraith: "Fix hands then good"', 22, 37, before=r10 + "frost-icicle-wraith.svg")
one("frost-yeti", 'Yeti: "Give dark nose again. Have it be taller then it is wide... torso less sharp on the front"', 31, 68, before=r10 + "frost-yeti.svg")
one("frost-ice-slime", 'Ice slime: "I like the old one more. Maybe without the side spikes"', 22, 49, before=r9 + "frost-ice-slime.svg",
    blabel="Ice slime (the old one, with its spikes)")
one("spire-herald-light", "Herald of Light: less face shade, bangs, a smaller flag, the spear held lower, plain hands", 34, 56, before=r10 + "spire-herald-light.svg")
one("spire-herald-fallen", "Fallen Herald: bangs the other way, a cracked cheek, a smaller flag, the spear held lower, plain hands", 34, 56, before=r10 + "spire-herald-fallen.svg")
one("spire-seraph", 'Seraph: "Use the old head shape."', 23, 56, before=r10 + "spire-seraph.svg")
var("spire-fallen-angel", 'Fallen angel: "Try again"',
    [("spire-fallen-angel-ashen.svg", "A burnt white"), ("spire-fallen-angel-collared.svg", "B halo for a collar"), ("spire-fallen-angel-ember.svg", "C still burning")],
    23, 56, before=r10 + "spire-fallen-angel.svg")
var("golem-bodies", 'Golem: "Try 4 more. Keeps these." (the three kept are in the first deck; the eye as it was)',
    [("spire-golem-arch.svg", "D arch"), ("spire-golem-cairn.svg", "E cairn"), ("spire-golem-shards.svg", "F shards"), ("spire-golem-wheel.svg", "G wheel")], 33, 66)
var("gilded-golems", 'Gilded golem: "Don\'t like the gold mask look" (no plate round the eye; on body A)',
    [("spire-gilded-golem-veins.svg", "A gold veins"), ("spire-gilded-golem-bands.svg", "B gold bands"), ("spire-gilded-golem-caps.svg", "C gold caps")],
    33, 66, before=r10 + "spire-gilded-golem-boulders.svg", blabel="before (the mask)")
one("dunes-cobra", "Cobra: the hood and head are now a free part; the game circles them over the coil", 19, 54, before=r10 + "dunes-cobra.svg")
one("dunes-serpent-coil", "Sand serpent, a segment: the head's own diamond, the same size on screen", 20, 55, before=r10 + "dunes-serpent-coil.svg")
one("dunes-sand-serpent", "Sand serpent: head and six segments as the game lays them", 100, 100, folder="boards",
    before="class-round10/boards/dunes-sand-serpent.svg")
var("mummy", 'Mummy: "I liked the last one just without the button thing. I want to see without the collar" (and, before: "Remove arms.")',
    [("dunes-mummy.svg", "A no button, no arms"), ("dunes-mummy-arms.svg", "B no button, arms kept"), ("dunes-mummy-take2-no-collar.svg", "C the newer one, no collar")],
    24, 54, before="class-round11/_src/base/dunes-mummy-take1.svg", blabel='"the last one" (with the button)')
var("dart-trap", 'Dart trap: "Different eye style. Variants"',
    [("dunes-dart-trap-horus.svg", "A carved eye"), ("dunes-dart-trap-gem.svg", "B ruby in a lotus"), ("dunes-dart-trap-scarab.svg", "C scarab")],
    20, 45, before=r10 + "dunes-dart-trap.svg")

# ================================================================== the Foundry
one("foundry-bomb-bot", 'Bomb bot: no caution tape, a proper fuse, the feet under its sides', 19, 45, before=r10 + "foundry-bomb-bot.svg")
one("foundry-turret-flame", 'Flame turret: the flame comes out from under the nozzle', 22, 60, before=r10 + "foundry-turret-flame.svg")
one("foundry-turret-laser", 'Laser turret: "Have the socket hug it more."', 22, 60, before=r10 + "foundry-turret-laser.svg")
one("foundry-smith", 'Foundry smith: the glow on the hammer\'s side, a plain hand', 30, 66, before=r10 + "foundry-smith.svg")
one("foundry-saw-blade", 'Saw blade: the previous blade with the new middle', 20, 67, before=r9 + "foundry-saw-blade.svg", blabel="Saw blade (the previous one)")
one("foundry-tesla-coil", 'Tesla coil: "slightly cheated up so you can see it better"', 20, 52, before=r10 + "foundry-tesla-coil.svg")
var("automaton-visors", 'Automaton: "Good except visor. 3 variants."',
    [("foundry-automaton-visor-grille.svg", "A grille"), ("foundry-automaton-visor-lens.svg", "B one lens"), ("foundry-automaton-visor-vee.svg", "C scowl")],
    24, 54, before=r10 + "foundry-automaton.svg")
var("automaton-keys", 'Automaton: "I also don\'t like the look of the key on the back. Make 3 for that too"',
    [("foundry-automaton-key-ring.svg", "1 ring"), ("foundry-automaton-key-bar.svg", "2 bar"), ("foundry-automaton-key-clover.svg", "3 clover")],
    24, 54, before=r10 + "foundry-automaton.svg")
var("crawler-visors", 'Chain crawler: "Different visor." (the automaton\'s three)',
    [("foundry-crawler-head-visor-grille.svg", "A grille"), ("foundry-crawler-head-visor-lens.svg", "B one lens"), ("foundry-crawler-head-visor-vee.svg", "C scowl")],
    23, 40, before=r10 + "foundry-crawler-head.svg")
var("repair-drone", 'Repair drone: "3 variants for what\'s on its front... Eye?"',
    [("foundry-repair-drone-eye.svg", "A just an eye"), ("foundry-repair-drone-claws.svg", "B eye and grabbers"), ("foundry-repair-drone-torch.svg", "C eye and a torch")],
    15, 55, before=r10 + "foundry-repair-drone.svg")
var("steam-turret", 'Steam turret: "Meh Don\'t like gun barrel"',
    [("foundry-turret-steam-pipe.svg", "A long pipe"), ("foundry-turret-steam-twin.svg", "B twin pipes"), ("foundry-turret-steam-kettle.svg", "C kettle spout")],
    22, 60, before=r10 + "foundry-turret-steam.svg")
var("mortar", 'Mortar: "a cannon aiming straight up with a circle hole in the top. Slightly offset from the middle"',
    [("foundry-mortar-ring.svg", "A bare tube"), ("foundry-mortar-trunnion.svg", "B in a cradle"), ("foundry-mortar-pot.svg", "C squat pot")],
    22, 60, before=r10 + "foundry-mortar.svg")
var("bee", 'Bee, from the wasp: "a bit fatter... wings render ontop... 1 red eye... cogs or something"',
    [("foundry-bee-collar.svg", "A cog collar"), ("foundry-bee-back.svg", "B cog on its back"), ("foundry-bee-hubs.svg", "C cogs at the wings")],
    12, 56, before=r10 + "foundry-bee.svg", blabel="the bee now")
var("hive", '"Also make a hive sprite"',
    [("foundry-hive-dome.svg", "A copper dome"), ("foundry-hive-drum.svg", "B brass drum"), ("foundry-hive-comb.svg", "C iron comb")], 30, 80, folder="props")

# ================================================================== bosses, the Pit Lord
one("boss-goblin-chieftain", 'The Goblin Chieftain: "Have them hold hands forwards more. Flip blades direction"', 38, 67, before=r10 + "boss-goblin-chieftain.svg")
var("gilded-seraph", 'The Gilded Seraph: "I don\'t love the helmet and face covering"',
    [("boss-gilded-seraph-circlet.svg", "A thin circlet"), ("boss-gilded-seraph-halo.svg", "B halo ring"), ("boss-gilded-seraph-hood.svg", "C white hood")],
    38, 58, before=r10 + "boss-gilded-seraph.svg")
var("pit-lord", 'The Pit Lord: "Face variants. Also tail"',
    [("ember-pit-lord-eyes.svg", "face A, tail 1"), ("ember-pit-lord-skull.svg", "face B, tail 2"), ("ember-pit-lord-furnace.svg", "face C, tail 3"),
     ("ember-pit-lord-tail.svg", "its face now, tail 1")], 38, 68, before=r10 + "ember-pit-lord.svg")
var("sproutling", 'Sproutling: "try the original design just better. No arms. Less busy leaves."',
    [("wild-sproutling-plain.svg", "A no collar"), ("wild-sproutling-ruff.svg", "B five-leaf ruff"), ("wild-sproutling-spread.svg", "C leaves out to the sides")],
    15, 34, before=r8 + "wild-sproutling.svg", blabel="the original")

# ================================================================== owed: the Enchantress and the Succubus
var("enchantress", "The Enchantress (hero): her own art, three ways",
    [("enchantress-buns.svg", "A heart of buns"), ("enchantress-veil.svg", "B veil and fan"), ("enchantress-curls.svg", "C curls and a rose")],
    22, 56, before="../art/heroes/witch.svg", blabel="today: the Witch, turned pink", folder="heroes")
var("succubus", "The Succubus (the Ember Deep): her own art, three ways",
    [("ember-succubus-tail.svg", "A wings and a heart tail"), ("ember-succubus-whip.svg", "B a whip"), ("ember-succubus-heart.svg", "C wings folded to a heart")],
    24, 56, before="../art/enemies/placeholder/devil.svg", blabel="today: the Devil, turned pink")

if __name__ == "__main__":
    want = sys.argv[1:]
    for n in want or (list(SINGLE) + list(VARS)):
        render(n)
