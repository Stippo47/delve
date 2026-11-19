"""One picture: the ten H2 heroes at game size (40px) and 70px, beside the round-3 heroes, to check they all read apart."""
import sys, pathlib, shutil
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

OUT = HERE.parents[1] / "heroes-support" / "renders"
OUT.mkdir(parents=True, exist_ok=True)
rb.OUT = OUT
mine = sorted((HERE.parents[1] / "heroes-support").glob("support-*.svg"))
old = sorted((ROOT / "design" / "class-round3").glob("*/*.svg"))


def row(files, px):
    return "".join(f'<div class="c" style="width:{px+14}px">{rb.sprite(f, px)}<div class=l>{f.stem.split("-", 1)[-1][:10]}</div></div>'
                   for f in files)


html = f"""<!doctype html><meta charset=utf-8><style>
body{{margin:0;background:{rb.BG};font:600 11px system-ui,Segoe UI,sans-serif;color:#6b6070;padding:12px}}
.r{{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;margin-bottom:14px}} .c{{text-align:center}} .l{{margin-top:2px}}
h{{display:block;font-size:14px;margin:4px 0}}</style>
<h>H2 at 70px</h><div class=r>{row(mine, 70)}</div>
<h>H2 at game size (40px)</h><div class=r>{row(mine, 40)}</div>
<h>round-3 heroes and enemies at 40px</h><div class=r>{row(old, 40)}</div>"""
rb.shoot(html, OUT / "_lineup.png", 980, 420)
shutil.rmtree(OUT / "_profile", ignore_errors=True)
print("made", OUT / "_lineup.png")
