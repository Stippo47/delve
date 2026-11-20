"""Close-up: a crop of one or more designs, big. python zoom.py out.png "x y w h" a.svg b.svg ..."""
import sys, re, pathlib, shutil, base64

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

out = pathlib.Path(sys.argv[1]).resolve()
vb = sys.argv[2]
rb.OUT = out.parent
cells = []
for a in sys.argv[3:]:
    t = pathlib.Path(a).read_text(encoding="utf-8")
    t = re.sub(r'viewBox="[^"]*"', f'viewBox="{vb}"', t, count=1)
    b = base64.b64encode(t.encode()).decode()
    cells.append(f'<div style="text-align:center"><img src="data:image/svg+xml;base64,{b}" style="width:420px;height:420px;display:block">'
                 f'{pathlib.Path(a).stem}</div>')
html = ("<!doctype html><meta charset=utf-8><style>body{margin:0;background:#EDE6D8;font:600 14px system-ui;display:flex;"
        "flex-wrap:wrap;gap:10px;padding:10px}</style>" + "".join(cells))
n = len(cells)
rb.shoot(html, out, 20 + min(n, 4) * 430, 20 + ((n + 3) // 4) * 450)
shutil.rmtree(out.parent / "_profile", ignore_errors=True)
print("zoom", out.name)
