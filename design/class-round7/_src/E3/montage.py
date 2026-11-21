"""Tile render boards into one picture to look over: python montage.py out.png cols width a.png b.png ..."""
import sys
from PIL import Image
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
ims = [Image.open(p).convert("RGB") for p in sys.argv[4:]]
ims = [i.resize((w, round(i.height * w / i.width))) for i in ims]
h = max(i.height for i in ims)
rows = (len(ims) + cols - 1) // cols
M = Image.new("RGB", (cols * w, rows * h), "#EDE6D8")
for k, i in enumerate(ims):
    M.paste(i, ((k % cols) * w, (k // cols) * h))
M.save(out)
