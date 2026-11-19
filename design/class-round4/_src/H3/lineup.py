"""One picture: the ten H3 heroes big, at 70px and at game size (40px, 4 facings), beside the archer and the rogues,
to check they all read apart. python lineup.py"""
import sys, pathlib, shutil
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

OUT = HERE.parents[1] / "heroes-ranged" / "renders"
OUT.mkdir(parents=True, exist_ok=True)
rb.OUT = OUT
mine = sorted((HERE.parents[1] / "heroes-ranged").glob("ranged-*.svg"))
ref = [ROOT / "design/class-round2/archer/archer.svg"] + sorted((ROOT / "design/class-round3/rogue").glob("*.svg"))


def col(f, big=True):
    rots = "".join(rb.sprite(f, 40, d) for d in (0, 90, 180, 315))
    b = rb.sprite(f, 70) if big else ""
    return (f'<div class="c">{b}<div class=g>{rots}</div><div class=l>{f.stem.split("-", 1)[-1][:12]}</div></div>')


html = f"""<!doctype html><meta charset=utf-8><style>
body{{margin:0;background:{rb.BG};font:600 11px system-ui,Segoe UI,sans-serif;color:#6b6070;padding:12px}}
.r{{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:14px}} .c{{text-align:center;display:flex;flex-direction:column;align-items:center}}
.g{{display:grid;grid-template-columns:40px 40px;gap:2px;margin-top:4px}} .l{{margin-top:2px}}</style>
<div class=r>{''.join(col(f) for f in mine)}</div>
<div class=r>{''.join(col(f) for f in ref)}</div>"""
rb.shoot(html, OUT / "_lineup.png", 1000, 420)
shutil.rmtree(OUT / "_profile", ignore_errors=True)
print("made", OUT / "_lineup.png")
