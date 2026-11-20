"""Quick look board: several designs side by side, big (200px) and at game size (40px, two facings), with the
archer for scale. python board.py out.png a.svg b.svg ...   (paths relative to where you run it)"""
import sys, pathlib, shutil

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

out = pathlib.Path(sys.argv[1]).resolve()
srcs = [pathlib.Path(a).resolve() for a in sys.argv[2:]]
rb.OUT = out.parent
srcs = [ROOT / "design" / "archer-final" / "archer.svg"] + srcs
cells = []
for s in srcs:
    small = "".join(f'<div style="width:46px">{rb.sprite(s, 40, d)}</div>' for d in (0, 135, 270))
    cells.append(f'<div class=c>{rb.sprite(s, 200)}<div class=row>{small}</div><div class=l>{s.stem}</div></div>')
per = 5
rows = [cells[i:i + per] for i in range(0, len(cells), per)]
html = ("<!doctype html><meta charset=utf-8><style>body{margin:0;background:#EDE6D8;font:600 14px system-ui;color:#4b4050}"
        ".r{display:flex;gap:14px;padding:10px 14px}.c{width:210px;text-align:center}.row{display:flex;gap:6px;justify-content:center;"
        "padding:6px 0}.l{padding-top:2px}</style>" + "".join('<div class=r>' + "".join(r) + '</div>' for r in rows))
rb.shoot(html, out, 30 + per * 224, 20 + len(rows) * 300)
shutil.rmtree(out.parent / "_profile", ignore_errors=True)
print("board", out.name)
