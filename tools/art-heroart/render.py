"""Round 19 art lane (heroes and bosses): boards for the deck.

A board: the current art and each option side by side, at game size (four facings, on a floor tone, then on the
cream) and at 3x, each with the game's outline: the renderer grows one ink outline of OUTLINE (2.4) room units over the
whole figure (js/parts.js), so a preview copy of each SVG gets an outline filter of 2.4 * 220 / sizeU SVG units (sizeU =
the room units the 220 box is drawn at: vr * 220 / headR). The art files themselves carry no outline.

python render.py   (imported by build.py)"""
import pathlib, subprocess, time, re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
TMP = HERE / "tmp"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PROFILE = HERE / "edge-profile"          # this lane's own Edge profile
INK = "#2B2230"
PX_PER_U = 44 / 86.4                      # css px per room unit at game size (a hero's 220 box is 44 px)


def outline_filter(r):
    a, b, c = r, r * 2.5 / 6, r * 4.6 / 6
    return (f'<filter id="olx" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" '
            f'radius="{a:.2f} {b:.2f}" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="{b:.2f} {a:.2f}" result="b"/>'
            f'<feMorphology in="SourceAlpha" operator="dilate" radius="{c:.2f}" result="c"/><feMerge result="d"><feMergeNode in="a"/>'
            f'<feMergeNode in="b"/><feMergeNode in="c"/></feMerge><feFlood flood-color="{INK}"/><feComposite in2="d" operator="in" result="o"/>'
            f'<feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')


def preview(src, sizeU, tag):
    """A copy of the art with the game's outline put on as a filter (for pictures only)."""
    TMP.mkdir(parents=True, exist_ok=True)
    t = pathlib.Path(src).read_text(encoding="utf-8")
    r = 2.4 * 220 / sizeU
    t = re.sub(r'<filter id="outline".*?</filter>', '', t, flags=re.S)
    t = t.replace("<defs>", "<defs>" + outline_filter(r), 1)
    t = re.sub(r'<g id="sprite"[^>]*>', '<g id="sprite" filter="url(#olx)">', t, count=1)
    # widen the view box so a big outline is not cut
    t = re.sub(r'viewBox="[^"]*"', 'viewBox="-24 -24 248 248"', t, count=1)
    t = re.sub(r'width="220" height="220"', 'width="248" height="248"', t, count=1)
    out = TMP / f"{tag}.svg"
    out.write_text(t, encoding="utf-8")
    return out


def uri(p):
    return pathlib.Path(p).resolve().as_uri()


def img(p, w, deg=0):
    return f'<img src="{uri(p)}" style="width:{w:.1f}px;height:{w:.1f}px;transform:rotate({deg}deg);display:block;flex:none">'


def shoot(html, out, w, h):
    out = pathlib.Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    page = TMP / f"_page-{out.stem}.html"
    page.write_text(html, encoding="utf-8")
    out.unlink(missing_ok=True)
    subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2",
                    "--virtual-time-budget=3000", f"--user-data-dir={PROFILE}", f"--window-size={int(w)},{int(h)}",
                    f"--screenshot={out}", "--default-background-color=00000000", uri(page)], check=True, capture_output=True)
    for _ in range(100):
        if out.exists() and out.stat().st_size > 0:
            time.sleep(0.3); break
        time.sleep(0.2)
    else:
        raise SystemExit(f"no screenshot for {out}")


CSS = ("body{margin:0;background:#EDE6D8;font:600 17px system-ui,Segoe UI,sans-serif;color:#6b6070}"
       "h1{font:700 22px system-ui;color:#2B2230;margin:0;padding:14px 24px 4px}"
       ".grid{display:grid;gap:0 26px;padding:6px 24px 16px;align-items:end}"
       ".cell{display:flex;flex-direction:column;align-items:center}"
       ".lab{color:#2B2230;font-size:17px;margin-top:4px;text-align:center}.lab.cur{color:#7a6f80}"
       ".k{font-size:13px;color:#8a7f90;align-self:center;text-align:right;line-height:1.2}"
       ".floor{background:#3E3743;border-radius:10px;padding:8px 10px;display:flex;gap:8px}"
       ".cream{padding:8px 10px;display:flex;gap:8px}.c{display:flex;align-items:center;justify-content:center;flex:none}"
       ".me{outline:3px solid #E8A33A;outline-offset:6px;border-radius:12px}")


def board(title, items, out, pick=None):
    """items = [(label, svg, sizeU, is_current)]; one column each: at 3x (and the actual device pixels of an iPhone),
    then game size in four facings on the floor and on the cream."""
    cols = []
    for i, (lab, src, sizeU, cur) in enumerate(items):
        p = preview(src, sizeU, f"{pathlib.Path(out).stem}-{i}")
        g = 220 * PX_PER_U * sizeU / 86.4 * (248 / 220)   # css px of the 248 box at game size
        g3 = g * 3
        cols.append((lab, p, g, g3, cur))
    big = max(c[3] for c in cols)
    gmax = max(c[2] for c in cols)
    row3 = "".join(f'<div class="cell"><div class="c" style="width:{big:.0f}px;height:{big:.0f}px">{img(p, g3)}</div>'
                   f'<div class="lab{" cur" if cur else ""}">{lab}</div></div>' for lab, p, g, g3, cur in cols)
    def four(p, g, cls):
        cells = "".join(f'<div class="c" style="width:{gmax:.0f}px;height:{gmax:.0f}px">{img(p, g, d)}</div>' for d in (0, 90, 180, 270))
        return f'<div class="{cls}">{cells}</div>'
    rowf = "".join(f'<div class="cell">{four(p, g, "floor")}</div>' for lab, p, g, g3, cur in cols)
    rowc = "".join(f'<div class="cell">{four(p, g, "cream")}</div>' for lab, p, g, g3, cur in cols)
    n = len(cols)
    colw = max(big, 4 * gmax + 3 * 8 + 20)
    html = (f'<!doctype html><meta charset=utf-8><style>{CSS}.grid{{grid-template-columns:repeat({n},{colw:.0f}px)}}</style>'
            f'<h1>{title}</h1><div class=grid>{row3}</div>'
            f'<div style="padding:0 24px;font-size:13px;color:#8a7f90">game size, four facings (front = down)</div>'
            f'<div class=grid>{rowf}</div><div class=grid style="padding-top:0">{rowc}</div>')
    w = 48 + n * colw + (n - 1) * 26
    h = 50 + big + 34 + 26 + 2 * (gmax + 30) + 40
    shoot(html, out, w, h)
