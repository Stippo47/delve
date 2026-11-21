"""Write decks/art-round9.json: art round 9 (design/class-round9): real art for the later dungeons' enemies and four
bosses, one board a dungeon, each design beside the stand-in the game showed."""
import json, pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
R9 = HERE.parents[1] / "design" / "class-round9"
sys.path.insert(0, str(HERE))
from make_art_round4 import clean

notes = (R9 / "notes.md").read_text(encoding="utf-8").splitlines()
def note_for(stem):
    for l in notes:
        if l.lstrip().startswith("- ") and (stem + ".svg" in l or "`" + stem + "`" in l):
            label = re.search(r"\*\*([^*]+)\*\*", l)
            return (label.group(1) if label else ""), clean(l)
    return "", ""

GROUPS = [("frost", "Frost Hollow", "Frost wolf, ice slime, frost spider, the yeti and its snowball, the icicle wraith, the frost spirit."),
          ("ember", "Ember Deep", "Fire spider, hellhound, cinder bat, fire spirit and the Pit Lord."),
          ("spire", "Gilded Spire", "Fallen angel, the Twin Heralds, choir sprite, sun blade, both golems, the light and ward spirits."),
          ("dunes", "Sunken Dunes", "Scarab, cobra, jackal guard, mummy, sand mage and dust devil, the sand serpent, dart trap, two spirits."),
          ("foundry", "Clockwork Foundry", "Gears, bomb bot, automaton, turrets and mortar, tesla coil, drone, smith, saw, drill, bees, the crawler."),
          ("boss", "Bosses", "The Goblin Chieftain as a goblin, the Winter Queen, the Gilded Seraph (and her fallen look) and her singers.")]
WHY = {"boss": "The Chieftain kept the mohawk troll's build but has goblin skin, nose, grin and ears, a cleaver and war paint. Tick the ones that fit; comment on any that don't.",
       "frost": "Pale creatures on a pale floor: they read by their outlines. Tick the ones that fit the heroes' style; comment on any that don't."}
d = R9 / "enemies"; r = d / "renders"
cards = []
for prefix, title, text in GROUPS:
    items = []
    for svg in sorted(d.glob(prefix + "-*.svg")):
        if not (r / f"{svg.stem}.png").exists():
            continue
        label, note = note_for(svg.stem)
        label = (label or svg.stem.split("-", 1)[-1].replace("-", " ").capitalize()).split(",")[0][:30]
        rel = f"../../../design/class-round9/enemies/renders/{svg.stem}"
        it = {"id": svg.stem, "label": label, "image": rel + ".png", "text": (note or "New this round.")[:400]}
        if (r / f"{svg.stem}-thumb.png").exists():
            it["thumb"] = rel + "-thumb.png"
        items.append(it)
        if (r / f"{svg.stem}-before.png").exists():
            items.append({"id": svg.stem + "-before", "label": (label + " (before)")[:36], "image": rel + "-before.png", "text": "The stand-in the game showed until now."})
    if len(items) >= 2:
        cards.append({"id": prefix, "kind": "board", "rarity": "rare", "title": title, "text": text[:110],
                      "why": WHY.get(prefix, "Each sits beside the recoloured stand-in it replaces. Live in 0.13.1. Tick the ones that fit the heroes' style; comment on any that don't."),
                      "pick": [i["id"] for i in items if not i["id"].endswith("-before")], "items": items})
deck = {"title": "Art round 9: the later dungeons", "topic": "art", "order": 20, "priority": 3, "cards": cards}
(HERE / "decks" / "art-round9.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(cards), "tiles", sum(len(c["items"]) for c in cards))
