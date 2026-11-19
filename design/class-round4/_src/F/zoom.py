"""Render SVGs big, side by side, for a close look. python zoom.py OUT.png a.svg b.svg ... (out goes wherever you say)"""
import sys, subprocess, pathlib, time

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"


def main():
    out = pathlib.Path(sys.argv[1]).resolve()
    svgs = [pathlib.Path(p).resolve() for p in sys.argv[2:]]
    px = 520 if len(svgs) <= 3 else 380
    cells = "".join(f'<div><img src="{p.as_uri()}" style="width:{px}px;height:{px}px"><div>{p.stem}</div></div>' for p in svgs)
    html = (f'<!doctype html><meta charset=utf-8><style>body{{margin:0;background:#EDE6D8;font:14px sans-serif;'
            f'display:flex;flex-wrap:wrap;gap:6px;padding:6px}}</style>{cells}')
    page = out.with_suffix(".html")
    page.write_text(html, encoding="utf-8")
    out.unlink(missing_ok=True)
    cols = min(len(svgs), 3 if px == 520 else 4)
    rows = (len(svgs) + cols - 1) // cols
    w, h = cols * (px + 6) + 12, rows * (px + 26) + 12
    subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=3000",
                    f"--user-data-dir={out.parent / '_zprofile'}", f"--window-size={w},{h}",
                    f"--screenshot={out}", page.as_uri()], check=True, capture_output=True)
    for _ in range(100):
        if out.exists() and out.stat().st_size > 0:
            time.sleep(0.3); break
        time.sleep(0.2)
    page.unlink()
    print(out)


main()
