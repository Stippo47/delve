"""Render the round-8 designs: tools/riffle/render_board.py's board (the design big beside the archer, 8 facings, game
size), into <folder>/renders/<name>.png, plus <name>-thumb.png; and beside each, <name>-before.png: the tile the
designer's note was on (part 1), or the placeholder the game showed for that kind (part 2).
A design shown "at game scale" (SCALE) is drawn at its size in the game relative to the archer (vr * 220 / headR
against the archer's 22 * 220 / 56), so a troll twice the archer's size looks twice the size; the others are drawn
like every earlier round (the 220 box at the archer's size).
python render8.py [name ...]      (paths relative to this file; no names = everything)"""
import sys, shutil, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R8 = HERE.parent
DESIGN = HERE.parents[1]
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

ARCHER_SIZE = 22 * 220 / 56   # room units the archer's 220 box spans in the game


def label(stem):
    words = stem.split("-")
    if words[0] in ("greenskin", "wild", "sewer", "bandit") and len(words) > 1 and words[0] != "bandit":
        words = words[1:]
    return " ".join(w.upper() if len(w) == 1 else w.capitalize() for w in words).strip()


def scaled_sheet(src, lab, out, k):
    """render_board.sheet with the design k times the archer's box (its game size), big row and facings."""
    big = 270
    def spr(p, px, deg=0):
        return rb.sprite(p, px, deg)
    rot = "".join(f'<div class="c" style="width:{70 * k:.0f}px;height:{70 * k:.0f}px">{spr(src, 70 * k, d)}</div>'
                  for d in range(0, 360, 45))
    rot40 = "".join(f'<div class="c s" style="width:{max(46, 40 * k):.0f}px;height:{max(46, 40 * k):.0f}px">'
                    f'{spr(src, 40 * k, d)}</div>' for d in range(0, 360, 45))
    html = f"""<!doctype html><meta charset=utf-8><style>
    body{{margin:0;background:{rb.BG};font:600 18px system-ui,Segoe UI,sans-serif;color:#6b6070}}
    .top{{display:flex;gap:40px;padding:24px 40px 0;align-items:flex-end}}
    .lab{{text-align:center;margin-top:4px}} .lab.me{{color:#2B2230;font-size:22px}}
    .row{{display:flex;gap:{max(6, 22 - 8 * (k - 1)):.0f}px;padding:14px 40px 0;align-items:center}}
    .c{{display:flex;align-items:center;justify-content:center}}
    .k{{width:110px;font-size:15px;flex:none}}
    </style>
    <div class=top>
      <div>{spr(rb.ARCHER, big)}<div class=lab>archer (for scale)</div></div>
      <div>{spr(src, big * k)}<div class="lab me">{lab} (at its size in the game)</div></div>
    </div>
    <div class=row><div class=k>8 facings</div>{rot}</div>
    <div class=row><div class=k>game size</div>{rot40}<div class="c s" style="margin-left:24px;width:46px">{spr(rb.ARCHER, 40)}</div><div class=k>archer</div></div>
    """
    w = int(max(900, 40 + 270 + 40 + big * k + 80, 160 + 8 * (70 * k + 22)))
    h = int(24 + big * k + 40 + 14 + 70 * k + 14 + max(46, 40 * k) + 40)
    rb.shoot(html, out, w, h)


def render(folder, stem, before=None, k=None, src=None, lab=None):
    out = R8 / folder / "renders"
    out.mkdir(parents=True, exist_ok=True)
    rb.OUT = out
    src = pathlib.Path(src) if src else R8 / folder / f"{stem}.svg"
    lab = lab or label(stem)
    if k:
        scaled_sheet(src, lab, out / f"{stem}.png", k)
    else:
        rb.sheet(src, lab, out / f"{stem}.png")
    rb.thumb(src, out / f"{stem}-thumb.png")
    shutil.rmtree(out / "_profile", ignore_errors=True)
    if before:
        b = pathlib.Path(before)
        if b.suffix == ".png":
            shutil.copyfile(b, out / f"{stem}-before.png")
        else:  # a placeholder svg: render it the plain way as the before
            rb.sheet(b, lab + " (before: placeholder)", out / f"{stem}-before.png")
            shutil.rmtree(out / "_profile", ignore_errors=True)
    print("rendered", folder, stem, "| before:", pathlib.Path(before).relative_to(ROOT).as_posix() if before else None)


R7 = DESIGN / "class-round7" / "enemies" / "renders"
# part 1: name -> (folder, the tile the note was on, scale)
PART1 = {
    "greenskin-orc": ("enemies", R7 / "greenskin-orc.png", None),
    "ghost-a": ("enemies", R7 / "ghost-a.png", None),
    "ghost-b": ("enemies", R7 / "ghost-b.png", None),
    "greenskin-chieftain": ("enemies", R7 / "greenskin-troll-a.png", None),
}
LABELS = {"greenskin-chieftain": "Chieftain (was Troll A)"}


def troll():
    # the troll with its boulder (boards/greenskin-troll-boulder.svg, fitted into the box by build8.py) at its game size
    # (js/enemies.js: r 60, vr 44, headR 66); the before is the round-6 tile the note was on
    sys.path.insert(0, str(HERE))
    import build8
    *_, bottom = build8.troll_with_boulder()
    fit = 220 / (bottom + 8 - 20)
    size = 44 * 220 / 66 / fit
    render("enemies", "greenskin-troll", R7 / "greenskin-troll-a-before.png", k=size / ARCHER_SIZE,
           src=R8 / "boards" / "greenskin-troll-boulder.svg", lab="Troll, with its boulder")


# part 2: name -> folder; the before is the placeholder the game showed (befores.py)
PART2 = {}
for n in ("wild-wolf", "wild-dire-wolf", "wild-alpha", "bandit-sword", "bandit-torch", "bandit-greatsword", "bandit-axe",
          "bandit-spear", "bandit-daggers", "bandit-poacher", "bandit-brute", "bandit-chief", "wild-boar",
          "wild-sproutling", "wild-ent", "wild-wisp", "wild-elder-ent", "sewer-rat-king", "sewer-croc", "sewer-crab"):
    PART2[n] = "enemies"
LABELS2 = {"wild-wolf": "Wolf", "wild-dire-wolf": "Dire wolf", "wild-alpha": "The Alpha", "bandit-sword": "Bandit (sword and shield)",
           "bandit-torch": "Torch bandit (sword and torch)", "bandit-greatsword": "Greatsword bandit", "bandit-axe": "Axe bandit",
           "bandit-spear": "Spear bandit", "bandit-daggers": "Knife bandit (two daggers)", "bandit-poacher": "Poacher",
           "bandit-brute": "Bandit brute", "bandit-chief": "The Bandit Chief", "wild-boar": "Thornback boar",
           "wild-sproutling": "Sproutling", "wild-ent": "Ent", "wild-wisp": "Wisp", "wild-elder-ent": "The Elder Ent",
           "sewer-rat-king": "Rat king", "sewer-croc": "Croc (two axes)", "sewer-crab": "Sewer crab"}


def part2(stem):
    import befores
    b = befores.before_svg(stem)
    render(PART2[stem], stem, b, lab=LABELS2[stem])


if __name__ == "__main__":
    want = set(sys.argv[1:])
    sys.path.insert(0, str(HERE))
    for stem in PART2:
        if (not want and (R8 / PART2[stem] / f"{stem}.svg").exists()) or stem in want:
            part2(stem)
    for stem, (folder, before, k) in PART1.items():
        if not want or stem in want:
            render(folder, stem, before, k, lab=LABELS.get(stem))
    if not want or "greenskin-troll" in want:
        troll()
