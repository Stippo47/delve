"""Look-over sheets: each design's -before.png (left) beside its new render (right), several designs per sheet.
python pairs.py out-prefix name [name ...]   -> tools/riffle/out/r7/<out-prefix>-N.png   (scratch, git-ignored)"""
import sys, pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
R7 = HERE.parent
SCR = HERE.parents[2] / "tools" / "riffle" / "out" / "r7"
SCR.mkdir(parents=True, exist_ok=True)


def find(stem):
    for folder in R7.iterdir():
        p = folder / "renders" / f"{stem}.png"
        if p.exists():
            return p
    raise SystemExit(f"no render for {stem}")


prefix, names = sys.argv[1], sys.argv[2:]
per = 3
for n in range(0, len(names), per):
    rows = []
    for stem in names[n:n + per]:
        after = Image.open(find(stem)).convert("RGB")
        bp = find(stem).with_name(f"{stem}-before.png")
        before = Image.open(bp).convert("RGB") if bp.exists() else Image.new("RGB", after.size, "#EDE6D8")
        row = Image.new("RGB", (before.width + after.width + 20, max(before.height, after.height)), "#B8B0A0")
        row.paste(before, (0, 0)); row.paste(after, (before.width + 20, 0))
        rows.append(row)
    sheet = Image.new("RGB", (max(r.width for r in rows), sum(r.height for r in rows) + 20 * (len(rows) - 1)), "#B8B0A0")
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height + 20
    out = SCR / f"{prefix}-{n // per + 1}.png"
    sheet.save(out)
    print(out)
