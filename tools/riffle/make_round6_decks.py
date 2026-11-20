"""Write the round-6 pick decks: art (class-round5), environment styles and camp/tree looks.

python tools/riffle/make_round6_decks.py   ->  decks/art-round5.json, decks/looks-r6.json
Item text comes from each folder's notes.md (or design/class-round5/notes.md), as in make_art_round4.py.
"""
import json, pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
R5 = ROOT / "design" / "class-round5"
sys.path.insert(0, str(HERE))
from make_art_round4 import clean  # same note cleaning

def notes_for(folder, fname):
    for p in (R5 / folder / "notes.md", R5 / "notes.md"):
        if not p.exists():
            continue
        lines = p.read_text(encoding="utf-8").splitlines()
        start = next((i for i, l in enumerate(lines) if fname in l), None)
        if start is None:
            continue
        out = []
        for l in lines[start + 1:]:
            if l.startswith("#") or (re.search(r"[\w-]+\.svg", l) and fname not in l and l.lstrip().startswith(("- **", "##", "**"))):
                break
            out.append(l)
        head = lines[start]
        label = re.sub(r"[#*`]", "", head.split(":")[0].split("(")[0]).strip(" -") if head.startswith("#") else ""
        body = clean((head if not head.startswith("#") else "") + "\n" + "\n".join(out))
        return label, body
    return "", ""

def items_for(folders):
    items = []
    for folder in folders:
        for svg in sorted((R5 / folder).glob("*.svg")):
            png = R5 / folder / "renders" / f"{svg.stem}.png"
            if not png.exists():
                continue
            label, body = notes_for(folder, svg.name)
            label = (label or " ".join(w.capitalize() for w in svg.stem.split("-")[1:] or [svg.stem]))[:36]
            if len(body) > 900:
                body = body[:880].rsplit(" ", 1)[0] + "..."
            body = re.sub(r"\b(throw\w*|push\w*|pull\w*|hold\w*|drag\w*|flick\w*)\s+(up|down|left|right)\b", lambda m: m.group(1) + " " + m.group(2) + "ward", body, flags=re.I)
            items.append({"id": svg.stem, "label": label, "image": f"../../../design/class-round5/{folder}/renders/{svg.stem}.png",
                          "thumb": f"../../../design/class-round5/{folder}/renders/{svg.stem}-thumb.png", "text": body or "New this round."})
    return items

WHY = "Each picture shows it beside the archer at the same size, then 8 turns at game size. Tick the keepers."
art = {"title": "Art round 5: your notes applied", "topic": "art", "order": 5, "priority": 2, "cards": [
    {"id": "heroes1", "kind": "board", "rarity": "rare", "title": "Picks, casters, support",
     "text": "Your notes on the picks, casters and support heroes. Hands and weapons are their own parts now.", "why": WHY,
     "details": "The ones in the game now: Twinfang, Wildmane, Berserker (A), Granny, Frost, Druid (A), Pyromancer, Storm, Cleric, Necromancer, Plague doctor. Where a note was open there are lettered versions.",
     "items": items_for(["knight", "barbarian", "rogue", "farmer", "skeleton", "archer", "heroes-casters", "heroes-support"])},
    {"id": "heroes2", "kind": "board", "rarity": "rare", "title": "Ranged and fighters",
     "text": "Your notes on the ranged heroes and fighters, with the variants you asked for.", "why": WHY,
     "details": "Four marksmen, four beast tamers with two beasts each, four engineers, a new executioner, gladiator and samurai, and the werewolf with a human form. The turret's gun, each tamer's whip and the scarecrow's crow are separate parts so they move on their own.",
     "items": items_for(["ranged", "fighters"])},
    {"id": "enemies", "kind": "board", "rarity": "rare", "title": "Enemies, built like heroes",
     "text": "Every enemy redone the way the heroes are built: no eyes, the head from above, matte.", "why": WHY,
     "details": "Why the earlier ones missed: they were drawn from the front with eyes, small heads on full bodies, and shiny. These follow the heroes. The Warren's greenskins are in the game now; lizards come in a plain (a) and a face-shaded (b) version for you to pick.",
     "items": items_for(["enemies"])},
]}
for c in art["cards"]:
    c["pick"] = [i["id"] for i in c["items"]]
(HERE / "decks" / "art-round5.json").write_text(json.dumps(art, indent=2, ensure_ascii=False), encoding="utf-8")

# ---- looks: environment styles and camp/tree looks
SC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None   # folder of env stills (crypt-env1-start.png ...)
ENV = ["Carved", "Flat", "Torchlit", "Mosaic"]
env_items = []
for n, name in enumerate(ENV, 1):
    for theme in ("crypt", "sewers", "warren"):
        p = f"../../../clips/r6/env/{theme}-env{n}-start.png"
        if (ROOT / "clips" / "r6" / "env" / f"{theme}-env{n}-start.png").exists():
            env_items.append({"id": f"env{n}-{theme}", "label": f"{name}, {theme}", "image": p, "text": f"Style {n} ({name}) in the {theme.capitalize()}."})
CAMP = [("classic", "Parchment", "classic"), ("ember", "Night watch", "stars"), ("journal", "Field journal", "ladder"), ("arcade", "Arcade", "runes")]
TREE = {"classic": "Columns", "stars": "Constellation", "ladder": "Ladder", "runes": "Rune stones"}
camp_items, tree_items = [], []
for look, name, tree in CAMP:
    camp_items.append({"id": f"camp-{look}", "label": name, "image": f"../../../clips/r6/camp/L-{look}-1-camp.png", "text": f"The camp in the {name} look."})
    camp_items.append({"id": f"shop-{look}", "label": f"{name}, shop", "image": f"../../../clips/r6/camp/L-{look}-6-shop.png", "text": f"The shop in the {name} look."})
    tree_items.append({"id": f"tree-{tree}", "label": TREE[tree], "image": f"../../../clips/r6/camp/L-{look}-5-tree-{tree}.png", "text": f"The skill tree as {TREE[tree]} (shown under the {name} camp)."})
looks = {"title": "Pick the looks", "topic": "art", "order": 6, "priority": 1, "tags": ["first"], "cards": [
    {"id": "env", "kind": "board", "rarity": "rare", "title": "Four dungeon styles",
     "text": "Four whole looks for the dungeons, each in all three themes. Tick the one (or parts) you like.",
     "why": "You asked for about 4 styles. All four are in the game: Settings, Dungeon look.",
     "details": "Every style has walls sloping out on all sides, quieter floor decor and straight-down shadows. 12 floor patterns across them. Doors stay shut until the room is won, then open lit in the room's colour.",
     "pick": [i["id"] for i in env_items if i["id"].startswith("env1")], "items": env_items},
    {"id": "camp", "kind": "board", "rarity": "rare", "title": "Four camp looks",
     "text": "You didn't like the camp's look: four directions, each shown on the camp and the shop.",
     "why": "All four are in the game: the gear button, Camp look. The one you pick becomes the camp.",
     "pick": ["camp-ember"], "items": camp_items},
    {"id": "tree", "kind": "board", "rarity": "rare", "title": "Four skill tree looks",
     "text": "Four ways to draw a hero's skill tree. Ladder is a different layout: one row per ability.",
     "why": "All four are in the game: the gear button, Tree look.", "pick": ["tree-ladder"], "items": tree_items},
]}
(HERE / "decks" / "looks-r6.json").write_text(json.dumps(looks, indent=2, ensure_ascii=False), encoding="utf-8")
print("art:", [len(c["items"]) for c in art["cards"]], "looks:", len(env_items), len(camp_items), len(tree_items))
