"""Render the round-9 designs: one board each (tools/riffle/render_board.py's: the design big beside the archer, its 8
facings, and the 8 facings at game size beside the archer at game size), into design/class-round9/<folder>/renders/
<name>.png, plus <name>-thumb.png, and beside each <name>-before.png: the stand-in the game showed (befores9.py), on the
same board. Every board is drawn at the game's scale: the design's 220 box is k times the archer's, k = (vr / headR) /
(22 / 56) (js defs: the unit's sprite radius vr and the art's head radius headR), so a yeti stands bigger than the
archer and a bee smaller, as in the game; a design much smaller than the archer gets a close-up beside it too.
python render9.py [name ...]      (paths relative to this file; no names = every design that exists)"""
import sys, shutil, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R9 = HERE.parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
sys.path.insert(0, str(HERE))
import render_board as rb
import befores9

ARCHER = 22 / 56            # the archer's vr / headR
SHOOT = ROOT / "tools" / "riffle" / "out" / "r9" / "shoot"   # Edge's page and profile (git-ignored), never beside the renders

# design -> (label, the game's vr and headR now, the stand-in's vr and headR, folder)
D = {}


def add(name, label, vr, hr, vr0=None, hr0=None, folder="enemies"):
    D[name] = (label, vr, hr, vr0 or vr, hr0 or hr, folder)


# the Frost Hollow
add("frost-wolf", "Frost wolf", 18, 35)
add("frost-ice-slime", "Ice slime", 22, 49, 22, 54)
add("frost-spider", "Frost spider", 20, 54, 20, 52)
add("frost-yeti", "Yeti", 31, 68, 31, 66)
add("frost-icicle-wraith", "Icicle wraith", 22, 37, 22, 58)
add("frost-spirit", "Frost spirit", 15, 30, 15, 58)
# the Ember Deep
add("ember-fire-spider", "Fire spider", 20, 54, 20, 52)
add("ember-hellhound", "Hellhound", 18, 35)
add("ember-cinder-bat", "Cinder bat", 16, 44)
add("ember-spirit", "Fire spirit", 15, 30, 15, 58)
add("ember-pit-lord", "The Pit Lord", 38, 68, 38, 64)
# the Gilded Spire
add("spire-fallen-angel", "Fallen angel", 23, 56)
add("spire-sun-blade", "Sun blade", 17, 58, 17, 46)
add("spire-choir-sprite", "Choir sprite", 16, 40, 16, 46)
add("spire-golem", "Golem", 33, 66)
add("spire-gilded-golem", "Gilded golem", 33, 66)
add("spire-light-spirit", "Light spirit", 15, 30, 15, 58)
add("spire-ward-spirit", "Ward spirit", 15, 30, 15, 58)
add("spire-herald-light", "Herald of Light", 34, 56)
add("spire-herald-fallen", "Fallen Herald", 34, 56)
# the Sunken Dunes
add("dunes-scarab", "Scarab", 13, 36, 13, 52)
add("dunes-golden-scarab", "Golden scarab (the scarab turned gold)", 13, 36, 13, 52)
add("dunes-cobra", "Cobra", 19, 48, 19, 56)
add("dunes-jackal", "Jackal guard", 22, 54)
add("dunes-mummy", "Mummy", 24, 54, 24, 60)
add("dunes-sand-mage", "Sand mage", 23, 55, 23, 56)
add("dunes-dust-devil", "Dust devil", 22, 68, 22, 58)
add("dunes-serpent-head", "Sand serpent (head)", 21, 40, 21, 56)
add("dunes-serpent-coil", "Sand serpent (a coil)", 20, 55, 20, 54)
add("dunes-dart-trap", "Dart trap", 20, 45, 20, 60)
add("dunes-venom-spirit", "Venom spirit", 15, 30, 15, 58)
add("dunes-wind-spirit", "Wind spirit", 15, 30, 15, 58)
# the Clockwork Foundry
add("foundry-gear-sprite", "Gear sprite", 18, 65, 18, 54)
add("foundry-cog-sprite", "Cog sprite", 18, 65, 18, 54)
add("foundry-bomb-bot", "Bomb bot", 19, 45, 19, 60)
add("foundry-auto-bomb", "Auto bomb bot (the bomb bot recoloured)", 19, 45, 19, 60)
add("foundry-automaton", "Automaton", 24, 54, 24, 60)
add("foundry-turret-steam", "Steam turret", 22, 60)
add("foundry-turret-flame", "Flame turret", 22, 60)
add("foundry-turret-gun", "Gun turret (on a wall)", 22, 60)
add("foundry-turret-laser", "Laser turret (on a wall)", 22, 60)
add("foundry-mortar", "Mortar", 22, 60)
add("foundry-mortar-fire", "Fire mortar (the mortar, trim turned red)", 22, 60)
add("foundry-mortar-gas", "Gas mortar (the mortar, trim turned green)", 22, 60)
add("foundry-tesla-coil", "Tesla coil", 20, 52, 20, 60)
add("foundry-repair-drone", "Repair drone", 15, 55, 15, 44)
add("foundry-smith", "Foundry smith", 30, 66, 30, 54)
add("foundry-bee", "Bee (copper)", 12, 48, 12, 44)
add("foundry-wasp", "Wasp (copper)", 12, 50, 12, 44)
add("foundry-hornet", "Hornet (copper)", 15, 52, 15, 44)
add("foundry-saw-blade", "Saw blade", 20, 67, 20, 54)
add("foundry-crawler-head", "Chain crawler (head)", 23, 40, 23, 52)
add("foundry-crawler-plate", "Chain crawler (a plate)", 22, 46, 22, 54)
add("foundry-drill-bot", "Drill bot", 20, 49, 20, 60)
add("foundry-storm-spirit", "Storm spirit", 15, 30, 15, 58)
# the bosses that wore recoloured art
add("boss-goblin-chieftain", "The Goblin Chieftain", 38, 67, 38, 62)
add("boss-winter-queen", "The Winter Queen", 34, 57, 34, 54)
add("boss-gilded-seraph", "The Gilded Seraph", 38, 58, 38, 56)
add("boss-gilded-seraph-fallen", "The Gilded Seraph, fallen (not used yet)", 38, 58)
add("boss-choir-singer", "Choir singer (the Seraph's)", 20, 40, 20, 46)


# boards that show a design with what the game draws apart, as the game places it (round 8's troll and boulder)
BOARDS = R9 / "boards"


def yeti_board():
    """The yeti and its snowball (js/foes10.js packSnow: r = round(0.55 x the yeti's collider), its centre u.r + r + 8
    ahead; the prop's 220 box is 86.4 room units at r 30), in the yeti's SVG units, fitted into one 220 box."""
    from compose import compose
    vr, hr, r = 31, D["frost-yeti"][2], 42 * 1.1
    k = vr / hr                                   # room units per yeti SVG unit
    sr = round(r * 0.55)
    ahead = (r + sr + 8) / k
    s = 86.4 * sr / 30 / k / 220                  # the snowball box in yeti units / 220
    yeti = (R9 / "enemies" / "frost-yeti.svg").read_text(encoding="utf-8")
    ball = (R9 / "props" / "yeti-snowball.svg").read_text(encoding="utf-8")
    cy = 100 + ahead
    top, bottom = -10, cy + 80 * s
    fit = 220 / (bottom - top)
    tf = f"translate({100 - 100 * fit:.2f} {-10 - top * fit:.2f}) scale({fit:.4f})"
    tb = f"translate({100 - 100 * s:.2f} {cy - 100 * s:.2f}) scale({s:.4f})"
    BOARDS.mkdir(parents=True, exist_ok=True)
    out = BOARDS / "frost-yeti-snowball.svg"
    out.write_text(compose([(ball, f"{tf} {tb}"), (yeti, tf)], "YETI (round 9) with its snowball in front, placed as the "
                           "game places it (js/foes10.js packSnow); the two are drawn apart in the game. For the board only."),
                   encoding="utf-8")
    return out, (vr / hr / fit) / ARCHER


GOLD_SCARAB = {"accent": {"from": 165, "range": 60, "hue": 40, "sat": 1.5, "light": 0.08}}   # js/dunes.js scarabGold


def golden_scarab():
    """The golden scarab is the scarab's art turned gold by the game (its def's accent): that turn, for the board."""
    BOARDS.mkdir(parents=True, exist_ok=True)
    out = BOARDS / "dunes-golden-scarab.svg"
    text = (R9 / "enemies" / "dunes-scarab.svg").read_text(encoding="utf-8")
    out.write_text(befores9.recolor_text(text, GOLD_SCARAB), encoding="utf-8")
    return out, (13 / 36) / ARCHER


# The Foundry's recolours (js/foundry.js): the auto bomb bot, the fire and gas mortars (their brass trim turned by an
# accent), as the game turns them.
AUTO_BOMB = {"hue": 200, "sat": 0.6, "light": -0.02}
MORTAR_FIRE = {"accent": {"from": 40, "range": 30, "hue": 8, "sat": 1.25, "light": -0.04}}
MORTAR_GAS = {"accent": {"from": 40, "range": 30, "hue": 95, "sat": 1.0, "light": -0.06}}


def recoloured(name, base, spec, vr, hr):
    def make():
        BOARDS.mkdir(parents=True, exist_ok=True)
        out = BOARDS / f"{name}.svg"
        out.write_text(befores9.recolor_text((R9 / "enemies" / f"{base}.svg").read_text(encoding="utf-8"), spec), encoding="utf-8")
        return out, (vr / hr) / ARCHER
    return make


COMPOSITE = {"frost-yeti": yeti_board, "dunes-golden-scarab": golden_scarab,
             "foundry-auto-bomb": recoloured("foundry-auto-bomb", "foundry-bomb-bot", AUTO_BOMB, 19, 45),
             "foundry-mortar-fire": recoloured("foundry-mortar-fire", "foundry-mortar", MORTAR_FIRE, 22, 60),
             "foundry-mortar-gas": recoloured("foundry-mortar-gas", "foundry-mortar", MORTAR_GAS, 22, 60)}


def board(src, lab, out, k):
    """render_board.sheet at the game's scale (k = this design's box / the archer's)."""
    big = 270
    sp = rb.sprite
    zoom = k < 0.8
    face = max(k, 0.8)
    rot = "".join(f'<div class="c" style="width:{70 * face:.0f}px;height:{70 * face:.0f}px">{sp(src, 70 * face, d)}</div>'
                  for d in range(0, 360, 45))
    rot40 = "".join(f'<div class="c" style="width:{max(46, 40 * k):.0f}px;height:{max(46, 40 * k):.0f}px">'
                    f'{sp(src, 40 * k, d)}</div>' for d in range(0, 360, 45))
    close = (f'<div>{sp(src, big)}<div class=lab>close up (x{1 / k:.1f})</div></div>' if zoom else "")
    html = f"""<!doctype html><meta charset=utf-8><style>
    body{{margin:0;background:{rb.BG};font:600 18px system-ui,Segoe UI,sans-serif;color:#6b6070}}
    .top{{display:flex;gap:40px;padding:24px 40px 0;align-items:flex-end}}
    .lab{{text-align:center;margin-top:4px}} .lab.me{{color:#2B2230;font-size:22px}}
    .row{{display:flex;gap:{max(8, 22 - 8 * (face - 1)):.0f}px;padding:14px 40px 0;align-items:center}}
    .c{{display:flex;align-items:center;justify-content:center}}
    .k{{width:110px;font-size:15px;flex:none}}
    </style>
    <div class=top>
      <div>{sp(rb.ARCHER, big)}<div class=lab>archer (for scale)</div></div>
      <div>{sp(src, big * k)}<div class="lab me">{lab}</div><div class=lab style="font-size:14px">at its size in the game</div></div>
      {close}
    </div>
    <div class=row><div class=k>8 facings</div>{rot}</div>
    <div class=row><div class=k>game size</div>{rot40}<div class="c" style="margin-left:24px;width:46px;height:46px">{sp(rb.ARCHER, 40)}</div><div class=k>archer</div></div>
    """
    w = int(max(900, 40 + 270 + 40 + big * k + 40 + (big + 40 if zoom else 0) + 40, 160 + 8 * (70 * face + 22)))
    h = int(24 + max(big * k, big) + 70 + 14 + 70 * face + 14 + max(46, 40 * k) + 40)
    rb.shoot(html, out, w, h)


def render(name):
    lab, vr, hr, vr0, hr0, folder = D[name]
    out = R9 / folder / "renders"
    out.mkdir(parents=True, exist_ok=True)
    SHOOT.mkdir(parents=True, exist_ok=True)
    rb.OUT = SHOOT
    src = R9 / folder / f"{name}.svg"
    if name in COMPOSITE and not src.exists():
        src = COMPOSITE[name]()[0]
    if name in COMPOSITE:
        csrc, k = COMPOSITE[name]()
        board(csrc, lab + (", with its snowball" if name == "frost-yeti" else ""), out / f"{name}.png", k)
    else:
        board(src, lab, out / f"{name}.png", (vr / hr) / ARCHER)
    rb.thumb(src, out / f"{name}-thumb.png")
    if name in befores9.BEFORE:
        b = befores9.before_svg(name)
        board(b, lab + " (before: the stand-in)", out / f"{name}-before.png", (vr0 / hr0) / ARCHER)
    shutil.rmtree(SHOOT / "_profile", ignore_errors=True)
    print("rendered", folder, name)


if __name__ == "__main__":
    want = sys.argv[1:]
    for n in want or [n for n in D if (R9 / D[n][5] / f"{n}.svg").exists() or n in COMPOSITE]:
        render(n)
