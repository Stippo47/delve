"""Look tools for round 6 (scratch output goes to tools/riffle/out/r6, which git ignores).

python look.py zoom out.png "x y w h" a.svg b.svg ...     a crop of each design, big, side by side
python look.py pair out.png before.svg after.svg ...      before/after pairs: big, 8 facings at 40px
Paths are relative to where you run it; nothing here holds an absolute path.
"""
import sys, re, pathlib, shutil, base64

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

SCR = ROOT / "tools" / "riffle" / "out" / "r6"
SCR.mkdir(parents=True, exist_ok=True)


def data_uri(path, vb=None):
    t = pathlib.Path(path).read_text(encoding="utf-8")
    if vb:
        t = re.sub(r'viewBox="[^"]*"', f'viewBox="{vb}"', t, count=1)
    return "data:image/svg+xml;base64," + base64.b64encode(t.encode()).decode()


def out_path(p):
    p = pathlib.Path(p)
    return p if p.is_absolute() or len(p.parts) > 1 else SCR / p


def zoom(out, vb, svgs, size=420):
    out = out_path(out)
    rb.OUT = out.parent
    cells = [f'<div style="text-align:center"><img src="{data_uri(a, vb)}" style="width:{size}px;height:{size}px;display:block">'
             f'{pathlib.Path(a).parent.parent.name}/{pathlib.Path(a).stem}</div>' for a in svgs]
    per = 4 if size <= 420 else 3
    html = ("<!doctype html><meta charset=utf-8><style>body{margin:0;background:#EDE6D8;font:600 14px system-ui;display:flex;"
            "flex-wrap:wrap;gap:10px;padding:10px}</style>" + "".join(cells))
    n = len(cells)
    rb.shoot(html, out, 20 + min(n, per) * (size + 10), 20 + ((n + per - 1) // per) * (size + 30))
    shutil.rmtree(out.parent / "_profile", ignore_errors=True)
    print("zoom", out)


def pair(out, svgs):
    out = out_path(out)
    rb.OUT = out.parent
    rows = []
    for i in range(0, len(svgs), 2):
        a, b = svgs[i], svgs[i + 1]
        def col(s):
            small = "".join(f'<div style="width:44px">{rb.sprite(s, 40, d)}</div>' for d in range(0, 360, 45))
            return (f'<div class=c>{rb.sprite(s, 300)}<div class=row>{small}</div>'
                    f'<div class=l>{pathlib.Path(s).parent.parent.name}/{pathlib.Path(s).stem}</div></div>')
        rows.append('<div class=r>' + col(a) + col(b) + '</div>')
    html = ("<!doctype html><meta charset=utf-8><style>body{margin:0;background:#EDE6D8;font:600 14px system-ui;color:#4b4050}"
            ".r{display:flex;gap:30px;padding:10px 14px}.c{width:360px;display:flex;flex-direction:column;align-items:center}"
            ".row{display:flex;gap:2px;padding:6px 0}.l{padding-top:2px}</style>" + "".join(rows))
    rb.shoot(html, out, 800, 20 + len(rows) * 400)
    shutil.rmtree(out.parent / "_profile", ignore_errors=True)
    print("pair", out)


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "zoom":
        zoom(sys.argv[2], sys.argv[3], sys.argv[4:])
    elif cmd == "zoombig":
        zoom(sys.argv[2], sys.argv[3], sys.argv[4:], size=560)
    elif cmd == "pair":
        pair(sys.argv[2], sys.argv[3:])
