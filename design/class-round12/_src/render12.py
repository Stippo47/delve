"""Render the round-12 boards (render11.py's boards, round 12's list) into design/class-round12/<folder>/renders/.
A hero (section A) gets:
  <hero>.png          the set board: its three takes at game scale beside the archer, and a row at game size in four
                      facings each (round 11's board for a set); <hero>-thumb.png, the three side by side
  <hero>-<take>.png   one take alone on round 9's board (big beside the archer, its 8 facings, the 8 facings at game
                      size) and <hero>-<take>-thumb.png: the tiles of the hero's card in the deck
  <hero>-lineup.png   each take standing in a row with five approved heroes, big and at game size: does it pass as
                      one of the set?
The Mob's boards show its four peasants together (boards/mob-<set>.svg), one set per cell.
Section C: one board per hero (boards/renders/with-<group>.png): the hero as it is in the game and beside it each new
thing at its size in the game, then the same row at game size; and for the weapon parts, before and after.
Scale: k = (vr / headR) / (22 / 56), the design's 220 box against the archer's.
python render12.py [name ...]      (paths relative to this file; none = everything)"""
import sys, shutil, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R12 = HERE.parent
DESIGN = R12.parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "A2"))
import render_board as rb
import boards12

ART = ROOT / "art" / "heroes"
SHOOT = ROOT / "tools" / "riffle" / "out" / "r12" / "shoot"   # Edge's page and profile (git-ignored)
CSS = (f"body{{margin:0;background:{rb.BG};font:600 18px system-ui,Segoe UI,sans-serif;color:#6b6070}}"
       ".top{display:flex;gap:28px;padding:24px 40px 0;align-items:flex-end;flex-wrap:nowrap}"
       ".lab{text-align:center;margin-top:4px} .lab.me{color:#2B2230;font-size:21px} .lab.sm{font-size:14px}"
       ".row{display:flex;gap:14px;padding:14px 40px 0;align-items:center}"
       ".c{display:flex;align-items:center;justify-content:center;flex:none}"
       ".k{width:110px;font-size:15px;flex:none} h1{font:700 24px system-ui;color:#2B2230;margin:0;padding:18px 40px 0}"
       "h2{font:700 19px system-ui;color:#2B2230;margin:0;padding:16px 40px 0}"
       ".sep{width:2px;align-self:stretch;background:#d8cfbf;margin:0 6px;flex:none}")


def img(src, w, h=None, deg=0):
    """A picture w x h pixels (h = w for a sprite's square box), turned deg degrees."""
    h = h or w
    return (f'<img src="{rb.uri(src)}" style="width:{w:.1f}px;height:{h:.1f}px;transform:rotate({deg}deg);display:block;flex:none">')


def shoot(html, out, w, h):
    SHOOT.mkdir(parents=True, exist_ok=True)
    rb.OUT = SHOOT
    out.parent.mkdir(parents=True, exist_ok=True)
    rb.shoot(html, out, int(w), int(h))


# ------------------------------------------------------------------ boards
def board_set(title, cells, out, canvas=(220, 220), note=""):
    """cells = [(src, label)]: every take at game scale beside the archer, then a row at game size in four facings.
    canvas = the cells' size in sprite units (the Mob's boards are wider than a sprite's box)."""
    cw, ch = canvas
    big = 250 if cw <= 220 else 190                       # pixels per 220 sprite units
    u = big / 220
    top = f'<div>{img(rb.ARCHER, big)}<div class=lab>archer</div></div>'
    top += "".join(f'<div>{img(s, cw * u, ch * u)}<div class="lab me">{lab}</div></div>' for s, lab in cells)
    g = 44
    gu = g / 220
    side = max(cw, ch) * gu
    def small(src):
        return "".join(f'<div class="c" style="width:{side:.0f}px;height:{side:.0f}px">{img(src, cw * gu, ch * gu, d)}</div>' for d in (0, 45, 180, 270))
    row = f'<div class="c" style="width:{g}px;height:{g}px">{img(rb.ARCHER, g)}</div>'
    for s, _ in cells:
        row += '<div class=sep></div>' + small(s)
    html = (f'<!doctype html><meta charset=utf-8><style>{CSS}</style><h1>{title}</h1><div class=top>{top}</div>'
            f'<div class=row style="padding-top:22px"><div class=k>game size<br>(archer first)</div>{row}</div>'
            + (f'<div class=row><div class="lab sm" style="text-align:left">{note}</div></div>' if note else ""))
    wtop = 80 + big + 28 + sum(cw * u + 28 for _ in cells)
    wrow = 220 + g + sum(4 * side + 4 * 14 + 30 for _ in cells)
    w = max(900, wtop, wrow)
    h = 60 + 24 + max(ch * u, big) + 40 + 22 + max(g, side) + 46 + (30 if note else 0)
    shoot(html, out, w, h)


def board_single(src, lab, out, k=1.0):
    """Round 9's board for one design: big beside the archer, its 8 facings, the 8 facings at game size."""
    big = 270
    rot = "".join(f'<div class="c" style="width:70px;height:70px">{img(src, 70 * k, None, d)}</div>' for d in range(0, 360, 45))
    rot40 = "".join(f'<div class="c" style="width:46px;height:46px">{img(src, 40 * k, None, d)}</div>' for d in range(0, 360, 45))
    html = f"""<!doctype html><meta charset=utf-8><style>{CSS}</style>
    <div class=top>
      <div>{img(rb.ARCHER, big)}<div class=lab>archer (for scale)</div></div>
      <div>{img(src, big * k)}<div class="lab me">{lab}</div></div>
    </div>
    <div class=row><div class=k>8 facings</div>{rot}</div>
    <div class=row><div class=k>game size</div>{rot40}<div class="c" style="margin-left:24px;width:46px;height:46px">{img(rb.ARCHER, 40)}</div><div class=k>archer</div></div>
    """
    shoot(html, out, 900, 24 + big + 70 + 14 + 70 + 14 + 46 + 40)


def board_wide(src, lab, out, canvas):
    """One of the Mob's sets alone: its four peasants big beside the archer, then at game size in four facings."""
    cw, ch = canvas
    big = 250
    u = big / 220
    g = 44
    gu = g / 220
    side = max(cw, ch) * gu
    small = "".join(f'<div class="c" style="width:{side:.0f}px;height:{side:.0f}px">{img(src, cw * gu, ch * gu, d)}</div>' for d in (0, 90, 180, 270))
    html = f"""<!doctype html><meta charset=utf-8><style>{CSS}</style>
    <div class=top>
      <div>{img(rb.ARCHER, big)}<div class=lab>archer (for scale)</div></div>
      <div>{img(src, cw * u, ch * u)}<div class="lab me">{lab}</div></div>
    </div>
    <div class=row style="padding-top:20px"><div class=k>game size</div><div class="c" style="width:{g}px;height:{g}px">{img(rb.ARCHER, g)}</div><div class=sep></div>{small}</div>
    """
    shoot(html, out, 80 + big + 28 + cw * u + 40, 24 + big + 40 + 20 + side + 40)


def thumb_set(cells, out, canvas=(220, 220)):
    cw, ch = canvas
    s = 150
    w = s * cw / 220
    html = (f"<!doctype html><meta charset=utf-8><style>body{{margin:0;background:{rb.BG};display:flex;align-items:center;"
            f"justify-content:center;gap:6px;width:{len(cells) * (w + 6) + 10:.0f}px;height:{s + 16}px}}</style>"
            + "".join(img(c[0], w, s * ch / 220) for c in cells))
    shoot(html, out, len(cells) * (w + 6) + 10, s + 16)


def thumb_one(src, out, canvas=(220, 220)):
    cw, ch = canvas
    s = 172 * 220 / max(cw, ch)
    html = (f"<!doctype html><meta charset=utf-8><style>body{{margin:0;background:{rb.BG};display:flex;align-items:center;"
            f"justify-content:center;width:180px;height:180px}}</style>{img(src, cw * s / 220, ch * s / 220)}")
    shoot(html, out, 180, 180)


def board_lineup(title, rows, out, canvas=(220, 220)):
    """rows = [(label, src, [five approved heroes' files])]: the take third in a row of six, big and at game size."""
    cw, ch = canvas
    big, g = 150, 44
    html = f'<!doctype html><meta charset=utf-8><style>{CSS}</style><h1>{title}</h1>'
    for lab, src, mates in rows:
        seq = [(m, 220, 220) for m in mates[:2]] + [(src, cw, ch)] + [(m, 220, 220) for m in mates[2:]]
        html += f'<h2>{lab}</h2><div class=row style="gap:6px;align-items:flex-end">'
        html += "".join(img(s, w * big / 220, h * big / 220) for s, w, h in seq)
        html += '<div class=sep style="margin:0 14px"></div>'
        html += "".join(f'<div class="c" style="height:{g}px">{img(s, w * g / 220, h * g / 220)}</div>' for s, w, h in seq) + "</div>"
    w = 80 + (5 * 220 + cw) * (big + g) / 220 + 6 * 12 + 60
    h = 60 + len(rows) * (44 + max(ch, 220) * big / 220 + 14) + 30
    shoot(html, out, w, h)


def board_row(title, cells, out, H=236, note=""):
    """Section C: one wide picture per cell [(src, label, W units)] at game scale (the heroes' 250 px box), then small."""
    u = 250 / 220
    gu = 44 / 220
    html = f'<!doctype html><meta charset=utf-8><style>{CSS}</style><h1>{title}</h1>'
    wmax = 0
    for src, lab, W in cells:
        html += f'<div class=row style="align-items:flex-end;gap:30px"><div>{img(src, W * u, H * u)}<div class="lab me" style="text-align:left">{lab}</div></div>'
        html += f'<div><div class="lab sm">game size</div>{img(src, W * gu, H * gu)}</div></div>'
        wmax = max(wmax, W * u + 30 + W * gu)
    if note:
        html += f'<div class=row><div class="lab sm" style="text-align:left">{note}</div></div>'
    shoot(html, out, max(900, 80 + wmax + 40), 60 + len(cells) * (H * u + 14 + 34) + (40 if note else 0) + 20)


# ------------------------------------------------------------------ the list
HEROES = {
    "clockwork": ("The Clockwork hero (\"Influence time\"): three takes",
                  [("watch", "A the pocket-watch hat"), ("windup", "B the wind-up man"), ("sands", "C Father Time")],
                  ["engineer", "alchemist", "storm", "witch", "cleric"]),
    "airMage": ("The Air mage (\"Whirled effect\"): three takes",
                [("swirl", "A the curl of wind"), ("fans", "B the spiral hat and fans"), ("gale", "C blown sideways")],
                ["storm", "frost", "pyromancer", "witch", "seer"]),
    "warden": ("The Warden (shackles, restraints, nullification): three takes",
               [("lock", "A the padlock helm"), ("gaoler", "B the gaoler and his key"), ("binder", "C the witch-finder")],
               ["tower", "paladin", "bulwark", "warhelm", "bandit"]),
    "telekinetic": ("The Telekinetic: three takes",
                    [("blades", "A swords that hang in the air"), ("orbit", "B the turban and the stones"), ("boulder", "C blindfold, braid and boulder")],
                    ["seer", "monk", "witch", "warlock", "necromancer"]),
    "earthMage": ("The Earth mage (quakes, spikes, stone walls): three takes",
                  [("fists", "A the rock fists"), ("spikes", "B the ring of spikes"), ("slab", "C the stone hood")],
                  ["druid", "frost", "shaman", "warhelm", "digger"]),
}
MOB = [("village", "A the village"), ("kitchen", "B the kitchen militia"), ("family", "C one family")]
MOB_MATES = ["haymaker", "digger", "granny", "grandpa", "bandit"]
MOB_CANVAS = (boards12.MOB_W, boards12.MOB_H)


def render_hero(h):
    title, takes, mates = HEROES[h]
    out = R12 / "heroes" / "renders"
    cells = [(R12 / "heroes" / f"{h}-{t}.svg", lab) for t, lab in takes]
    board_set(title, cells, out / f"{h}.png")
    thumb_set(cells, out / f"{h}-thumb.png")
    for (t, lab), (src, _) in zip(takes, cells):
        board_single(src, lab, out / f"{h}-{t}.png")
        thumb_one(src, out / f"{h}-{t}-thumb.png")
    board_lineup(title.split(":")[0] + ": each take in a row with five approved heroes",
                 [(lab, src, [ART / f"{m}.svg" for m in mates]) for (t, lab), (src, _) in zip(takes, cells)], out / f"{h}-lineup.png")


def render_mob():
    out = R12 / "heroes" / "renders"
    cells = [(R12 / "boards" / f"mob-{t}.svg", lab) for t, lab in MOB]
    board_set("The Mob (four peasants who are one hero: torch, pitchfork, axe, dagger): three sets", cells, out / "mob.png", MOB_CANVAS)
    thumb_set(cells, out / "mob-thumb.png", MOB_CANVAS)
    for (t, lab), (src, _) in zip(MOB, cells):
        board_wide(src, lab, out / f"mob-{t}.png", MOB_CANVAS)
        thumb_one(src, out / f"mob-{t}-thumb.png", MOB_CANVAS)
    board_lineup("The Mob: each set in a row with five approved heroes",
                 [(lab, src, [ART / f"{m}.svg" for m in MOB_MATES]) for (t, lab), (src, _) in zip(MOB, cells)], out / "mob-lineup.png", MOB_CANVAS)


def render_props(gid):
    import props_list
    g = next(x for x in props_list.GROUPS if x["id"] == gid)
    out = R12 / "boards" / "renders"
    src, W, H = boards12.with_board(g["id"], g["hero"], g["props"])
    cells = [(src, g["label"], W)]
    for b in g.get("more", []):          # extra rows: (board id, hero file, props, label)
        s2, W2, _ = boards12.with_board(b[0], b[1], b[2])
        cells.append((s2, b[3], W2))
    board_row(g["title"], cells, out / f"with-{gid}.png", H, g.get("note", ""))


def names():
    n = list(HEROES) + ["mob"]
    try:
        import props_list
        n += [g["id"] for g in props_list.GROUPS]
    except ImportError:
        pass
    return n


def render(name):
    if name in HEROES:
        render_hero(name)
    elif name == "mob":
        render_mob()
    else:
        render_props(name)
    shutil.rmtree(SHOOT / "_profile", ignore_errors=True)
    print("rendered", name)


if __name__ == "__main__":
    for n in sys.argv[1:] or names():
        render(n)
