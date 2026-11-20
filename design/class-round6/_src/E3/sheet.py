"""Contact sheet: several SVGs side by side at one scale (big row + game-size row), via Edge headless.

python sheet.py out.png a.svg b.svg ...      (paths relative to where you run it)
Options: --big N (px for the big row, default 200), --cols N.
"""
import sys, pathlib, base64
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

def img(p, px, deg=0):
    b = base64.b64encode(pathlib.Path(p).read_bytes()).decode()
    return f'<img src="data:image/svg+xml;base64,{b}" style="width:{px}px;height:{px}px;transform:rotate({deg}deg);display:block">'

def main(a):
    big, cols = 200, 6
    while a and a[0].startswith("--"):
        if a[0] == "--big": big = int(a[1]); a = a[2:]
        elif a[0] == "--cols": cols = int(a[1]); a = a[2:]
    out, srcs = pathlib.Path(a[0]).resolve(), a[1:]
    cells = []
    for s in srcs:
        small = "".join(img(s, 40, d) for d in (0, 90, 180, 315))
        cells.append(f'<div class=c>{img(s, big)}<div class=s>{small}</div><div class=l>{pathlib.Path(s).stem}</div></div>')
    rows = [cells[i:i + cols] for i in range(0, len(cells), cols)]
    html = f"""<!doctype html><meta charset=utf-8><style>body{{margin:0;background:{rb.BG};font:600 13px system-ui;color:#6b6070}}
    .row{{display:flex;gap:8px;padding:8px}} .c{{width:{big}px;text-align:center}} .s{{display:flex;gap:6px;justify-content:center;margin-top:2px}}
    .l{{margin-top:2px}}</style>""" + "".join('<div class=row>' + "".join(r) + '</div>' for r in rows)
    rb.OUT = out.parent
    rb.shoot(html, out, 16 + (big + 8) * min(cols, len(cells)), 16 + len(rows) * (big + 72))

if __name__ == "__main__":
    main(sys.argv[1:])
