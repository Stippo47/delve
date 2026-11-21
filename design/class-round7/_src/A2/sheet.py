"""A quick working sheet: each SVG big (240px) with 4 facings at game size (40px) under it, the archer first for scale.
python sheet.py out.png a.svg b.svg ...   (paths relative to the current folder or absolute)"""
import sys, pathlib, shutil
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

out = pathlib.Path(sys.argv[1]).resolve()
files = [pathlib.Path(a).resolve() for a in sys.argv[2:]]
rb.OUT = out.parent
big = 240 if len(files) <= 4 else 190


def col(f):
    rots = "".join(f'<div class=s>{rb.sprite(f, 40, d)}</div>' for d in (0, 90, 180, 315))
    return (f'<div class="c">{rb.sprite(f, big)}<div class=g>{rots}</div>'
            f'<div class=l>{f.stem[:22]}</div></div>')


cols = [col(ROOT / "design/archer-final/archer.svg")] + [col(f) for f in files]
html = f"""<!doctype html><meta charset=utf-8><style>
body{{margin:0;background:{rb.BG};font:600 13px system-ui,Segoe UI,sans-serif;color:#6b6070;padding:10px}}
.r{{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}} .c{{text-align:center;display:flex;flex-direction:column;align-items:center}}
.g{{display:flex;gap:6px;margin-top:4px}} .s{{width:44px;height:44px;display:flex;align-items:center;justify-content:center}} .l{{margin-top:2px}}</style>
<div class=r>{''.join(cols)}</div>"""
per = 6 if big < 240 else 5
rows = (len(cols) + per - 1) // per
rb.shoot(html, out, (big + 12) * per + 30, rows * (big + 80) + 20)
shutil.rmtree(out.parent / "_profile", ignore_errors=True)
print(out)
