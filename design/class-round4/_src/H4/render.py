"""Render the H4 sheets with the shared board script. python render.py [file-stem ...]"""
import sys, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUT = HERE.parents[1] / "heroes-fighters"
LABELS = {"fighter-vampire": "Vampire", "fighter-beast-tamer": "Beast tamer", "fighter-samurai": "Samurai",
          "fighter-gladiator": "Gladiator", "fighter-valkyrie": "Valkyrie", "fighter-executioner": "Executioner",
          "fighter-jester": "Jester", "fighter-werewolf": "Werewolf", "fighter-engineer": "Engineer",
          "fighter-scarecrow": "Scarecrow", "tamer-beast": "Tamer's beast", "engineer-turret": "Engineer's turret"}
names = [n for n in LABELS if any(a in n for a in sys.argv[1:])] if sys.argv[1:] else list(LABELS)
args = [f"{OUT / f'{n}.svg'}={LABELS[n]}" for n in names]
subprocess.run([sys.executable, str(ROOT / "tools/riffle/render_board.py"), "--out", str(OUT / "renders")] + args,
               check=True)
