"""Copy the round-7 designs whose kinds the game uses into art/enemies (the names js/enemies.js and js/foes.js load).
- orc (also the Orc Warboss): the round-7 orc (the round-5 orc the designer picked, tusks out of the mouth).
- lizardman-blade (the Lizard Blade and the Lizard Chief): blade B, round 7 (picked "before", spines fixed).
- lizardman (the spear lizard): spear A, round 6 unchanged: the designer's "selected base lizard" (round 6 kept the
  game's round-3 lizards "until an a or b is picked").
- placeholder/bat, snowman, ogre, dragonborn (js/foes.js loads them from placeholder/): the round-7 bat, snowman,
  ogre and dragonborn A replace the round-5 stand-ins; a comment says where each comes from.
Not copied: the ghost and the troll come in two versions each and stay as they are in the game until one is picked;
the heroes with notes (Marksman A, Gladiator, Werewolf and its human form) are not in the game.
python game7.py   (paths relative to this file)"""
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
R7 = HERE.parent
R6 = HERE.parents[1] / "class-round6"
ART = HERE.parents[2] / "art" / "enemies"

COPIES = [(R7 / "enemies/greenskin-orc.svg", "orc.svg"),
          (R7 / "enemies/lizardman-blade-b.svg", "lizardman-blade.svg"),
          (R6 / "enemies/lizardman-spear-a.svg", "lizardman.svg"),
          (R7 / "enemies/bat.svg", "placeholder/bat.svg"),
          (R7 / "enemies/snowman.svg", "placeholder/snowman.svg"),
          (R7 / "enemies/greenskin-ogre.svg", "placeholder/ogre.svg"),
          (R7 / "enemies/dragonborn-a.svg", "placeholder/dragonborn.svg")]

for src, dst in COPIES:
    text = src.read_bytes().decode("utf-8")
    if dst.startswith("placeholder/"):
        rel = src.relative_to(HERE.parents[2]).as_posix()
        note = (f"<!-- GAME COPY (art round 7) of {rel}: the designer's pick with the round-8 note applied. It stays "
                f"under placeholder/ because js/foes.js loads it from here. -->")
        i = text.index(">") + 1
        nl = "\r\n" if "\r\n" in text else "\n"
        text = text[:i] + nl + note + text[i:]
    (ART / dst).write_bytes(text.encode("utf-8"))
    print(dst, "<-", src.relative_to(HERE.parents[1]).as_posix())
