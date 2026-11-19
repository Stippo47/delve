"""Render the H2 sheets with the shared board script. python render.py [name ...]"""
import sys, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUT = HERE.parents[1] / "heroes-support"
LABELS = {"cleric": "Cleric", "templar": "Templar", "bard": "Bard", "plague-doctor": "Plague doctor", "monk": "Monk",
          "seer": "Seer", "beekeeper": "Beekeeper", "chef": "Chef", "quartermaster": "Quartermaster",
          "lantern-keeper": "Lantern keeper"}
names = sys.argv[1:] or list(LABELS)
args = [f"{OUT / f'support-{n}.svg'}={LABELS[n]}" for n in names]
subprocess.run([sys.executable, str(ROOT / "tools/riffle/render_board.py"), "--out", str(OUT / "renders")] + args,
               check=True)
