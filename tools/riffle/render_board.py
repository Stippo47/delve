"""Render one picture per character design for the Riffle art board.

Each picture: the archer and the design side by side at the same scale (so head size can be compared),
then the design in 8 facings at 70px and 40px (game size), with the archer at 40px for scale.
Also a square thumbnail of the design alone. Uses Edge headless; no installs needed.

python tools/riffle/render_board.py   ->  tools/riffle/out/*.png
"""
import os, subprocess, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "tools" / "riffle" / "out"
OUT.mkdir(parents=True, exist_ok=True)
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BG = "#EDE6D8"

ARCHER = ROOT / "design" / "archer-final" / "archer.svg"

def uri(p):
    return pathlib.Path(p).resolve().as_uri()

def sprite(src, px, deg=0):
    # The sprite box is 220 units; the token is drawn at that box size.
    return (f'<img src="{uri(src)}" style="width:{px}px;height:{px}px;transform:rotate({deg}deg);'
            f'display:block">')

def shoot(html, out, w, h):
    page = OUT / f"_page-{pathlib.Path(out).stem}.html"
    page.write_text(html, encoding="utf-8")
    subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=2", "--virtual-time-budget=3000",
                    f"--user-data-dir={OUT / '_profile'}", f"--window-size={w},{h}",
                    f"--screenshot={out}", "--default-background-color=00000000",
                    uri(page)], check=True, capture_output=True)
    import time  # Edge hands off and writes the file a moment later
    for _ in range(100):
        if pathlib.Path(out).exists() and pathlib.Path(out).stat().st_size > 0:
            time.sleep(0.3); break
        time.sleep(0.2)
    else:
        raise SystemExit(f"no screenshot for {out}")
    page.unlink()

def sheet(src, label, out):
    big = 270
    rot = "".join(f'<div class="c">{sprite(src, 70, d)}</div>' for d in range(0, 360, 45))
    rot40 = "".join(f'<div class="c s">{sprite(src, 40, d)}</div>' for d in range(0, 360, 45))
    html = f"""<!doctype html><meta charset=utf-8><style>
    body{{margin:0;background:{BG};font:600 18px system-ui,Segoe UI,sans-serif;color:#6b6070}}
    .top{{display:flex;gap:40px;padding:24px 40px 0;align-items:flex-end}}
    .lab{{text-align:center;margin-top:4px}} .lab.me{{color:#2B2230;font-size:22px}}
    .row{{display:flex;gap:22px;padding:14px 40px 0;align-items:center}}
    .c{{width:70px;height:70px;display:flex;align-items:center;justify-content:center}}
    .s{{width:70px;height:46px}}
    .k{{width:110px;font-size:15px}}
    </style>
    <div class=top>
      <div>{sprite(ARCHER, big)}<div class=lab>archer (for scale)</div></div>
      <div>{sprite(src, big)}<div class="lab me">{label}</div></div>
    </div>
    <div class=row><div class=k>8 facings</div>{rot}</div>
    <div class=row><div class=k>game size</div>{rot40}<div class="c s" style="margin-left:24px">{sprite(ARCHER, 40)}</div><div class=k>archer</div></div>
    """
    shoot(html, out, 900, 540)

def thumb(src, out):
    html = f"""<!doctype html><meta charset=utf-8><style>body{{margin:0;background:{BG};display:flex;
    align-items:center;justify-content:center;width:180px;height:180px}}</style>{sprite(src, 172)}"""
    shoot(html, out, 180, 180)

ITEMS = [("ref-archer", "Archer (locked)", ARCHER),
         ("ref-base", "Base body (approved)", ROOT / "design/base-approved/base-1s-160.svg")]
NAMES = {
    "knight": ["Paladin", "Old Guard", "Bastion", "Dame"],
    "skeleton": ["Rattler", "Gaper", "Brute", "Hollow"],
    "rogue": ["Twinfang", "Cowl", "Bandit", "Shade"],
    "farmer": ["Haymaker", "Granny Reaper", "Digger", "Grandpa Sickle"],
    "barbarian": ["Wildmane", "Bearskin", "Warhelm", "Flail Berserker"],
}
for cls, names in NAMES.items():
    for i, n in enumerate(names, 1):
        ITEMS.append((f"{cls}-{i}", f"{cls.title()} · {n}", ROOT / f"design/class-candidates/{cls}/design-{i}.svg"))

if __name__ == "__main__":
    for iid, label, src in ITEMS:
        sheet(src, label, OUT / f"{iid}.png")
        thumb(src, OUT / f"{iid}-thumb.png")
        print("made", iid)
    import shutil; shutil.rmtree(OUT / "_profile", ignore_errors=True)
