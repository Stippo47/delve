"""Write decks/art-round6.json: each changed design (design/class-round6) next to the version the designer saw."""
import json, pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
R6 = HERE.parents[1] / "design" / "class-round6"
sys.path.insert(0, str(HERE))
from make_art_round4 import clean

notes = (R6 / "notes.md").read_text(encoding="utf-8").splitlines()
def note_for(fname):
    for l in notes:
        if fname in l and l.lstrip().startswith("- "):
            label = re.search(r"\*\*([^*]+)\*\*", l)
            return (label.group(1) if label else ""), clean(l)
    return "", ""

items = []
for folder in ["heroes-casters", "heroes-support", "ranged", "fighters", "enemies"]:
    d = R6 / folder
    if not d.exists():
        continue
    for svg in sorted(d.glob("*.svg")):
        r = d / "renders"
        if not (r / f"{svg.stem}.png").exists():
            continue
        label, text = note_for(svg.name)
        label = (label or svg.stem.split("-", 1)[-1].replace("-", " ").capitalize())[:30]
        rel = f"../../../design/class-round6/{folder}/renders/{svg.stem}"
        items.append({"id": svg.stem, "label": label, "image": rel + ".png", "thumb": rel + "-thumb.png", "text": text or "Changed this round."})
        if (r / f"{svg.stem}-before.png").exists():
            items.append({"id": svg.stem + "-before", "label": label + " (before)", "image": rel + "-before.png",
                          "text": "The version you saw last round, for comparison."})
deck = {"title": "Art round 6: only what you asked", "topic": "art", "order": 7, "priority": 2, "cards": [{
    "id": "fixes", "kind": "board", "rarity": "rare", "title": "Exactly your notes",
    "text": "Each design changed only where your note said, shown beside the version you saw.",
    "why": "Tick the ones that are right now. Each 'before' tile is the last version, for comparing.",
    "details": "Every design was rebuilt from the exact file you saw, and only the note was applied. Where last round had redrawn something instead of doing your note (the lizards, dragonborn, goblin, imp, devil), it went back to the earlier version with only your note applied. All of it was done by Opus at the highest effort.\n\nHeroes not picked with no note (Bearskin, Necromancer, Pyromancer, Storm, Beekeeper, Lantern keeper, Plague doctor, Templar, Scarecrow, Vampire, the tamers) were left alone: they need a note each to know what to fix.",
    "pick": [i["id"] for i in items if not i["id"].endswith("-before")], "items": items}]}
(HERE / "decks" / "art-round6.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("items:", len(items))
