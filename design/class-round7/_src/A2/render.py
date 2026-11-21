"""Render the A2 boards with the shared script, and a lineup per folder.
python render.py            -> ../../ranged/renders, ../../fighters/renders (every SVG) + _lineup.png in each"""
import sys, subprocess, pathlib, shutil
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
R5 = HERE.parents[1]
sys.path.insert(0, str(ROOT / "tools" / "riffle"))
import render_board as rb


def label(stem):
    s = stem.split("-", 1)[-1] if stem.startswith(("ranged-", "fighter-")) else stem
    return s.replace("-", " ").capitalize()


for folder in ("ranged", "fighters"):
    svgs = sorted((R5 / folder).glob("*.svg"))
    if len(sys.argv) > 1:
        svgs = [p for p in svgs if any(a in p.stem for a in sys.argv[1:])]
    if not svgs:
        continue
    args = [f"{p}={label(p.stem)}" for p in svgs]
    subprocess.run([sys.executable, str(ROOT / "tools/riffle/render_board.py"), "--out", str(R5 / folder / "renders")] + args,
                   check=True)
    if len(sys.argv) > 1:
        continue
    out = R5 / folder / "renders"
    rb.OUT = out

    def col(f):
        rots = "".join(rb.sprite(f, 40, d) for d in (0, 90, 180, 315))
        return (f'<div class="c">{rb.sprite(f, 70)}<div class=g>{rots}</div><div class=l>{label(f.stem)[:14]}</div></div>')
    ref = [ROOT / "design/archer-final/archer.svg"]
    html = f"""<!doctype html><meta charset=utf-8><style>
body{{margin:0;background:{rb.BG};font:600 11px system-ui,Segoe UI,sans-serif;color:#6b6070;padding:12px}}
.r{{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:14px}} .c{{text-align:center;display:flex;flex-direction:column;align-items:center;width:92px}}
.g{{display:grid;grid-template-columns:40px 40px;gap:2px;margin-top:4px}} .l{{margin-top:2px}}</style>
<div class=r>{''.join(col(f) for f in ref + svgs)}</div>"""
    rows = (len(svgs) + 1 + 9) // 10
    rb.shoot(html, out / "_lineup.png", 1060, rows * 200 + 30)
    shutil.rmtree(out / "_profile", ignore_errors=True)
    print("made", out / "_lineup.png")
