"""Rewrite the FILES list in sw.js from what's on disk, and optionally set VERSION.

python tools/build-sw.py [0.6.0]

Everything the game loads goes in: the page, manifest, icons, js/ (not the lab bench), css/, and every SVG under art/.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sw = ROOT / "sw.js"
files = ["./", "index.html", "manifest.webmanifest"]
files += sorted(str(p.relative_to(ROOT)).replace("\\", "/") for p in (ROOT / "icons").glob("*.png"))
files += sorted(str(p.relative_to(ROOT)).replace("\\", "/") for p in (ROOT / "js").glob("*.js") if p.name != "lab.js")
files += sorted(str(p.relative_to(ROOT)).replace("\\", "/") for p in (ROOT / "css").glob("*.css"))
files += sorted(str(p.relative_to(ROOT)).replace("\\", "/") for p in (ROOT / "art").rglob("*.svg"))

lines, line = [], "const FILES = ["
for f in files:
    item = f"'{f}', "
    if len(line) + len(item) > 118:
        lines.append(line.rstrip()); line = "  "
    line += item
lines.append(line.rstrip().rstrip(",") + "];")
s = sw.read_text(encoding="utf-8")
s = re.sub(r"const FILES = \[.*?\];", "\n".join(lines), s, count=1, flags=re.S)
if len(sys.argv) > 1:
    s = re.sub(r"const VERSION = '[^']*'", f"const VERSION = '{sys.argv[1]}'", s, count=1)
sw.write_text(s, encoding="utf-8")
print(len(files), "files")
