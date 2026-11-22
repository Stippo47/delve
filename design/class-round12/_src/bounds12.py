"""Does every round-12 sprite stay inside its 220 box (no shape cut off by the viewBox)? Draws them all on one page with
Edge, then looks along each box's edge for a fill colour (the outline alone may touch the edge). Needs Pillow.
python bounds12.py [file.svg ...]   (none = heroes/ and props/ of this round; paths relative to this file)"""
import sys, subprocess, pathlib, shutil
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
R12 = HERE.parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb

OUT = ROOT / "tools" / "riffle" / "out" / "r12" / "bounds"


def cut(c):
    """Is this edge pixel a fill colour? The page (magenta), the ink outline and their blends are not: an outline may
    touch the box's edge (the approved heroes' do), a fill there means the shape itself is cut off."""
    r, g, bl = c
    t = min(1.0, max(0.0, (r - 43) / 212))
    return abs(g - (34 - 34 * t)) + abs(bl - (48 + 207 * t)) > 40


def check(files):
    OUT.mkdir(parents=True, exist_ok=True)
    rb.OUT = OUT
    cols, cell, gap = 10, 220, 6
    rows = -(-len(files) // cols)
    html = (f"<!doctype html><meta charset=utf-8><style>body{{margin:0;background:#FF00FF;display:grid;grid-template-columns:repeat({cols},{cell}px);"
            f"gap:{gap}px;padding:{gap}px}}img{{width:{cell}px;height:{cell}px;display:block}}</style>"
            + "".join(f'<img src="{rb.uri(p)}">' for p in files))
    png = OUT / "bounds.png"
    w, h = cols * (cell + gap) + gap, rows * (cell + gap) + gap
    page = OUT / "_bounds.html"
    page.write_text(html, encoding="utf-8")
    png.unlink(missing_ok=True)
    subprocess.run([rb.EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--virtual-time-budget=4000",
                    f"--user-data-dir={OUT / '_profile'}", f"--window-size={w},{h}", f"--screenshot={png}", rb.uri(page)], check=True, capture_output=True)
    import time
    for _ in range(100):
        if png.exists() and png.stat().st_size > 0:
            time.sleep(0.4); break
        time.sleep(0.2)
    im = Image.open(png).convert("RGB")
    px = im.load()
    bad = []
    for i, p in enumerate(files):
        x0, y0 = gap + (i % cols) * (cell + gap), gap + (i // cols) * (cell + gap)
        sides = {"top": [(x0 + d, y0) for d in range(cell)], "bottom": [(x0 + d, y0 + cell - 1) for d in range(cell)],
                 "left": [(x0, y0 + d) for d in range(cell)], "right": [(x0 + cell - 1, y0 + d) for d in range(cell)]}
        hit = [s for s, pts in sides.items() if any(cut(px[x, y]) for x, y in pts)]
        if hit:
            bad.append(f"{p.relative_to(R12).as_posix() if p.is_relative_to(R12) else p.name}: cut off at the box's {', '.join(hit)}")
    shutil.rmtree(OUT / "_profile", ignore_errors=True)
    page.unlink(missing_ok=True)
    return bad


if __name__ == "__main__":
    files = [pathlib.Path(a).resolve() for a in sys.argv[1:]] or sorted((R12 / "heroes").glob("*.svg")) + sorted((R12 / "props").glob("*.svg"))
    bad = check(files)
    print("\n".join(bad) if bad else f"all {len(files)} sprites are inside their boxes")
    sys.exit(1 if bad else 0)
