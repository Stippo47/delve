"""Part check: each design drawn whole, each part alone (with the outline), and posed the way the game moves
the arms (parts.js MOVES: swing wind-up and strike, cast lift), with the outline over the posed composite.

python parts.py --out <folder> a.svg b.svg ...   ->  <folder>/<stem>-parts.png
Paths are relative to where you run it; nothing absolute is stored.
"""
import sys, re, math, pathlib, subprocess, time, shutil
import xml.etree.ElementTree as ET

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

ET.register_namespace("", "http://www.w3.org/2000/svg")
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")

POSES = [  # label, {part: (r radians, dx, dy)}  (arm-r frame; arm-l mirrored)
    ("swing wind-up", {"arm-r": (-0.95, 0, -6), "arm-l": (0.11, 0, 1)}),
    ("swing strike", {"arm-r": (0.6, 0, 10), "arm-l": (-0.07, 0, -2)}),
    ("cast", {"arm-r": (0.38, 0, 22), "arm-l": (-0.38, 0, 22)}),
    ("limp", {"arm-r": (-0.55, 0, -6), "arm-l": (0.55, 0, -6)}),
]


def variant(src, keep=None, pose=None):
    t = ET.parse(src)
    root = t.getroot()
    sp = [e for e in root.iter() if e.get("id") == "sprite"][0]
    for g in list(sp):
        gid = g.get("id")
        if keep is not None and gid != keep:
            sp.remove(g); continue
        if pose and gid in pose:
            r, dx, dy = pose[gid]
            pv = [float(v) for v in (g.get("data-pivot") or "100 100").replace(",", " ").split()]
            g.set("transform", f"translate({dx} {dy}) rotate({math.degrees(r):.2f} {pv[0]} {pv[1]})")
    if pose:
        root.set("viewBox", "-30 -30 260 260")
    return ET.tostring(root, encoding="unicode")


def img(svgtext, px):
    import base64
    b = base64.b64encode(svgtext.encode()).decode()
    return f'<img src="data:image/svg+xml;base64,{b}" style="width:{px}px;height:{px}px;display:block">'


def sheet(src, out):
    t = ET.parse(src).getroot()
    sp = [e for e in t.iter() if e.get("id") == "sprite"][0]
    ids = [g.get("id") for g in sp]
    full = open(src, encoding="utf-8").read()
    cells = [(img(full, 200), "whole")]
    for i in ids:
        cells.append((img(variant(src, keep=i), 200), f"{i} alone"))
    row2 = []
    for lab, p in POSES:
        pose = {k: v if k == "arm-r" else v for k, v in p.items()}
        # arm-l gets the mirrored rotation (parts.js mirror(): r -> -r, dx -> -dx)
        pose = {"arm-r": p["arm-r"], "arm-l": (p["arm-l"][0], p["arm-l"][1], p["arm-l"][2])}
        if lab in ("cast", "limp"):
            pose["arm-l"] = (-p["arm-r"][0], -p["arm-r"][1], p["arm-r"][2])
        row2.append((img(variant(src, pose=pose), 200), lab))
    def row(cs):
        return '<div class=row>' + "".join(f'<div class=c>{h}<div class=l>{l}</div></div>' for h, l in cs) + '</div>'
    html = f"""<!doctype html><meta charset=utf-8><style>body{{margin:0;background:#EDE6D8;font:600 15px system-ui;color:#6b6070}}
    .row{{display:flex;gap:10px;padding:10px 16px}} .c{{text-align:center}}</style>
    <div style="padding:8px 16px;color:#2B2230">{pathlib.Path(src).stem}: parts in file order: {' / '.join(ids)}</div>{row(cells)}{row(row2)}"""
    w = 40 + 210 * max(len(cells), len(row2))
    rb.shoot(html, out, w, 560)


if __name__ == "__main__":
    a = sys.argv[1:]
    assert a[0] == "--out"
    out = pathlib.Path(a[1]).resolve(); out.mkdir(parents=True, exist_ok=True)
    rb.OUT = out
    for s in a[2:]:
        sheet(s, out / f"{pathlib.Path(s).stem}-parts.png")
        print("parts", pathlib.Path(s).stem)
    shutil.rmtree(out / "_profile", ignore_errors=True)
