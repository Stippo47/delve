"""Render the caster SVGs with the shared board script, plus a lineup of all of them at game size.
python render.py [names...]     (names = svg stems without 'caster-'; none = all)
python render.py --lineup        only the lineup
"""
import subprocess, sys, pathlib, time

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
DIR = HERE.parents[1] / "heroes-casters"
REN = DIR / "renders"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
LABEL = {"pyromancer": "Pyromancer", "frost": "Frost mage", "storm": "Storm mage", "necromancer": "Necromancer",
         "druid": "Druid", "shaman": "Shaman", "witch": "Witch", "cultist": "Cultist", "warlock": "Warlock",
         "alchemist": "Alchemist"}


def boards(names):
    args = [f"{DIR / f'caster-{n}.svg'}={LABEL[n]}" for n in names]
    subprocess.run([sys.executable, str(ROOT / "tools" / "riffle" / "render_board.py"), "--out", str(REN), *args],
                   check=True)


def lineup():
    """All casters (and a few round-3 heroes for comparison) side by side, at 40px in 4 facings and at 70px."""
    svgs = [(LABEL[n], DIR / f"caster-{n}.svg") for n in LABEL if (DIR / f"caster-{n}.svg").exists()]
    refs = [("archer", ROOT / "design/archer-final/archer.svg"),
            ("Shade", ROOT / "design/class-round3/rogue/rogue-shade-cape-crossed.svg"),
            ("Wildmane", ROOT / "design/class-round3/barbarian/barbarian-wildmane.svg"),
            ("Paladin", ROOT / "design/class-round3/knight/knight-paladin.svg"),
            ("Granny", ROOT / "design/class-round3/farmer/farmer-granny-reaper.svg")]

    def img(p, px, deg=0):
        return f'<img src="{p.resolve().as_uri()}" style="width:{px}px;height:{px}px;transform:rotate({deg}deg)">'

    def col(lab, p, ref=False):
        small = "".join(img(p, 40, d) for d in (0, 90, 180, 270))
        return (f'<div class="col{" ref" if ref else ""}"><div class=big>{img(p, 96)}</div><div class=sm>{small}</div>'
                f'<div class=sm>{img(p, 40, 45)}{img(p, 40, 135)}{img(p, 40, 225)}{img(p, 40, 315)}</div><div class=lab>{lab}</div></div>')

    html = ("<!doctype html><meta charset=utf-8><style>body{margin:0;background:#EDE6D8;font:600 14px system-ui,Segoe UI;"
            "color:#2B2230}.row{display:flex;gap:6px;padding:14px}.col{display:flex;flex-direction:column;align-items:center;width:100px}"
            ".sm{display:grid;grid-template-columns:40px 40px;gap:4px;margin-top:4px}.lab{margin-top:4px}.ref{opacity:.85}"
            ".ref .lab{color:#8a7f8a}</style>"
            "<div class=row>" + "".join(col(l, p) for l, p in svgs) + "</div>"
            "<div class=row>" + "".join(col(l, p, True) for l, p in refs) + "</div>")
    REN.mkdir(parents=True, exist_ok=True)
    page = REN / "_lineup.html"
    page.write_text(html, encoding="utf-8")
    out = REN / "casters-lineup.png"
    out.unlink(missing_ok=True)
    prof = REN / "_profile"
    subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--virtual-time-budget=3000", f"--user-data-dir={prof}", "--window-size=1100,640",
                    f"--screenshot={out}", page.resolve().as_uri()], check=True, capture_output=True)
    for _ in range(100):
        if out.exists() and out.stat().st_size > 0:
            time.sleep(0.3)
            break
        time.sleep(0.2)
    page.unlink()
    import shutil
    shutil.rmtree(prof, ignore_errors=True)
    print("made", out.name)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a == ["--lineup"]:
        lineup()
    else:
        boards(a or [n for n in LABEL if (DIR / f"caster-{n}.svg").exists()])
        lineup()
