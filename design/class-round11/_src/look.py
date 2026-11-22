"""Look tools for round 9 (scratch output goes to tools/riffle/out/r9, which git ignores).

python look.py zoom out.png "x y w h" a.svg b.svg ...   a crop of each design, big, side by side
python look.py scale out.png a.svg=SIZE b.svg=SIZE ...  designs at their game scale: SIZE = room units the 220 box
                                                        spans in the game (vr * 220 / headR), each big and at game size
python look.py grid out.png a.svg b.svg ...             the designs at the same box size, labelled (a contact sheet)
Paths are relative to where you run it; nothing here holds an absolute path.
"""
import sys, re, pathlib, shutil, base64

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

SCR = ROOT / "tools" / "riffle" / "out" / "r11"
SCR.mkdir(parents=True, exist_ok=True)
BG = "#EDE6D8"


def data_uri(path, vb=None):
    t = pathlib.Path(path).read_text(encoding="utf-8")
    if vb:
        t = re.sub(r'viewBox="[^"]*"', f'viewBox="{vb}"', t, count=1)
    return "data:image/svg+xml;base64," + base64.b64encode(t.encode()).decode()


def out_path(p):
    p = pathlib.Path(p)
    return p if p.is_absolute() or len(p.parts) > 1 else SCR / p


def shoot(html, out, w, h):
    out = out_path(out)
    rb.OUT = out.parent
    rb.shoot(html, out, w, h)
    shutil.rmtree(out.parent / "_profile", ignore_errors=True)
    print(out)


def zoom(out, vb, svgs, size=420):
    cells = [f'<div style="text-align:center"><img src="{data_uri(a, vb)}" style="width:{size}px;height:{size}px;display:block">'
             f'{pathlib.Path(a).stem}</div>' for a in svgs]
    per = 4 if size <= 420 else 3
    html = (f"<!doctype html><meta charset=utf-8><style>body{{margin:0;background:{BG};font:600 14px system-ui;display:flex;"
            "flex-wrap:wrap;gap:10px;padding:10px}</style>" + "".join(cells))
    n = len(cells)
    shoot(html, out, 20 + min(n, per) * (size + 10), 20 + ((n + per - 1) // per) * (size + 30))


def grid(out, svgs, size=230, per=5):
    cells = [f'<div style="text-align:center;width:{size}px"><img src="{data_uri(a)}" style="width:{size}px;height:{size}px;display:block">'
             f'{pathlib.Path(a).stem}</div>' for a in svgs]
    html = (f"<!doctype html><meta charset=utf-8><style>body{{margin:0;background:{BG};font:600 13px system-ui;display:flex;"
            "flex-wrap:wrap;gap:8px;padding:8px}</style>" + "".join(cells))
    n = len(cells)
    shoot(html, out, 16 + min(n, per) * (size + 8), 16 + ((n + per - 1) // per) * (size + 26))


def scale(out, items, k=2.2):
    """items: [(svg, size)]: each drawn with its 220 box at size*k px (big row) and size*0.55 px (game-ish row),
    bottoms aligned, so relative sizes are the game's."""
    big = "".join(f'<div class=c><img src="{data_uri(s)}" style="width:{z * k:.0f}px;height:{z * k:.0f}px">'
                  f'<div>{pathlib.Path(s).stem}</div></div>' for s, z in items)
    small = "".join(f'<div class=c><img src="{data_uri(s)}" style="width:{z * 0.5:.0f}px;height:{z * 0.5:.0f}px"></div>'
                    for s, z in items)
    html = (f"<!doctype html><meta charset=utf-8><style>body{{margin:0;background:{BG};font:600 13px system-ui;color:#4b4050}}"
            ".r{display:flex;gap:6px;padding:8px 10px;align-items:flex-end}.c{text-align:center}</style>"
            f"<div class=r>{big}</div><div class=r>{small}</div>")
    w = 30 + sum(max(z * k, 60) + 6 for _, z in items)
    h = 70 + max(z for _, z in items) * (k + 0.5) + 40
    shoot(html, out, int(w), int(h))


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "zoom":
        zoom(sys.argv[2], sys.argv[3], sys.argv[4:])
    elif cmd == "zoombig":
        zoom(sys.argv[2], sys.argv[3], sys.argv[4:], size=560)
    elif cmd == "grid":
        grid(sys.argv[2], sys.argv[3:])
    elif cmd == "scale":
        items = []
        for a in sys.argv[3:]:
            f, _, z = a.partition("=")
            items.append((f, float(z or 90)))
        scale(sys.argv[2], items)
