"""Render the H3 sheets with the shared board script. python render.py [name ...]"""
import sys, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUT = HERE.parents[1] / "heroes-ranged"
LABELS = {"marksman": "Marksman", "ninja": "Ninja", "crossbowman": "Crossbowman", "trapper": "Trapper",
          "pirate": "Pirate", "javelin-huntress": "Javelin huntress", "grenadier": "Grenadier", "slinger": "Slinger",
          "falconer": "Falconer", "harpooner": "Harpooner"}
names = sys.argv[1:] or list(LABELS)
args = [f"{OUT / f'ranged-{n}.svg'}={LABELS[n]}" for n in names]
subprocess.run([sys.executable, str(ROOT / "tools/riffle/render_board.py"), "--out", str(OUT / "renders")] + args,
               check=True)
