"""One picture: the H4 sprites at 70px and game size (40px) beside the round-3/round-4 knights and barbarians."""
import sys, pathlib, shutil
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

OUT = HERE.parents[1] / "heroes-fighters" / "renders"
OUT.mkdir(parents=True, exist_ok=True)
rb.OUT = OUT
mine = sorted((HERE.parents[1] / "heroes-fighters").glob("*.svg"))
r4 = HERE.parents[1]
old = sorted((r4 / "knight").glob("*.svg")) + sorted((r4 / "barbarian").glob("*.svg")) + \
      sorted((r4 / "rogue").glob("*.svg")) + sorted((r4 / "farmer").glob("*.svg"))


def row(files, px, deg=0):
    return "".join(f'<div class="c" style="width:{px+16}px">{rb.sprite(f, px, deg)}<div class=l>{f.stem.split("-", 1)[-1][:9]}</div></div>'
                   for f in files)


html = f"""<!doctype html><meta charset=utf-8><style>
body{{margin:0;background:{rb.BG};font:600 10px system-ui,Segoe UI,sans-serif;color:#6b6070;padding:10px}}
.r{{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;margin-bottom:12px}} .c{{text-align:center}} .l{{margin-top:2px}}
h{{display:block;font-size:13px;margin:3px 0}}</style>
<h>H4 at 70px</h><div class=r>{row(mine, 70)}</div>
<h>H4 at game size (40px), facing down and turned 135</h><div class=r>{row(mine, 40)}</div><div class=r>{row(mine, 40, 135)}</div>
<h>knights, barbarians, rogues, farmers (round 4 fixes) at 40px</h><div class=r>{row(old, 40)}</div>"""
rb.shoot(html, OUT / "_lineup.png", 1000, 560)
shutil.rmtree(OUT / "_profile", ignore_errors=True)
print("made", OUT / "_lineup.png")
