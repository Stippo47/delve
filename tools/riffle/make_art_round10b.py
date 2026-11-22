"""Write decks/art-round10b.json: art round 10's second pass (the rest of the Foundry, the mummy, the Frost and Dunes
kinds that fell short, the Spire's seraph and cherub, the Pit Lord), each beside what the game showed before."""
import json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
REN = HERE.parents[1] / "design" / "class-round10" / "enemies" / "renders"
rel = lambda stem: f"../../../design/class-round10/enemies/renders/{stem}.png"
GROUPS = [
    ("foundry2", "The rest of the Foundry", "You marked the Foundry redo: the eleven kinds I hadn't redrawn the first time, now done.",
     [("foundry-automaton", "Automaton", "A clockwork knight: steel helm, one amber visor slit, a cog for each shoulder, a wind-up key."),
      ("foundry-bomb-bot", "Bomb bot", "One black bomb with a hazard band, a fuse, a key and two brass feet."),
      ("foundry-turret-flame", "Flame turret", "A dark burner between two red fuel tanks, with a pilot flame."),
      ("foundry-turret-laser", "Laser turret", "In the gun turret's wall socket: a finned capsule with a red charge window and a long barrel."),
      ("foundry-mortar", "Mortar", "A fat tilted tube with a brass muzzle band and two spare shells."),
      ("foundry-tesla-coil", "Tesla coil", "A ribbed copper ring with a blue-white spark at its heart."),
      ("foundry-repair-drone", "Repair drone", "One white shell with a green cross, two rotors, a wrench and a torch."),
      ("foundry-smith", "Foundry smith", "No longer brown on brown: ginger beard, red sweatband, dark apron, a red-hot hammer."),
      ("foundry-saw-blade", "Saw blade", "Twelve big hooked teeth, three curved slots, a red hub."),
      ("foundry-crawler-head", "Chain crawler", "A mechanical centipede: a head plate with pincers and overlapping body plates."),
      ("foundry-drill-bot", "Drill bot", "A yellow chevroned body on tracks and a drill as wide as the body.")]),
    ("others2", "Mummy, Spire, Pit Lord", "The mummy redrawn, three Frost and Dunes kinds that fell short, the Spire's seraph and cherub, the Pit Lord.",
     [("dunes-mummy", "Mummy", "A wrapped person in the heroes' build: bandaged head with one dark slit, a gold and turquoise collar, loose wrappings trailing."),
      ("frost-ice-slime", "Ice slime", "The slime you picked, in ice, with three shards frozen inside."),
      ("dunes-sand-mage", "Sand mage", "A teal turban with a brooch and plume, a veil, a sun staff and an orb of sand."),
      ("dunes-dart-trap", "Dart trap", "A sandstone block with a socket holding a round head with a winged sun and three darts."),
      ("spire-seraph", "Seraph", "Its own caster on your picked angel's build: four wings, pale gold hair, a halo ring over the hair."),
      ("spire-cherub", "Cherub", "Kin to the choir sprite: a rose sash, a gold bow, a heart-tipped arrow."),
      ("ember-pit-lord", "The Pit Lord", "Black obsidian cracked with lava, a molten grin, huge bone horns, red wings."),
      ("bandit-daggers", "Knife bandit", "A slate kerchief and a gold earring instead of hair that looked like Twinfang's.")]),
]
cards = []
for cid, title, text, rows in GROUPS:
    items = []
    for stem, label, what in rows:
        if not (REN / f"{stem}.png").exists():
            continue
        it = {"id": stem, "label": label, "image": rel(stem), "text": what}
        if (REN / f"{stem}-thumb.png").exists(): it["thumb"] = rel(stem + "-thumb")
        items.append(it)
        if (REN / f"{stem}-before.png").exists():
            items.append({"id": stem + "-before", "label": (label + " (before)")[:36], "image": rel(stem + "-before"), "text": "What the game showed before."})
    cards.append({"id": cid, "kind": "board", "rarity": "rare", "title": title[:26], "text": text[:110],
                  "why": "Live in 0.16.1. Tick the ones that are right; comment on any that still aren't.",
                  "pick": [i["id"] for i in items if not i["id"].endswith("-before")], "items": items})
deck = {"title": "Art round 10, part two", "topic": "art", "order": 26, "priority": 3, "cards": cards}
(HERE / "decks" / "art-round10b.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(cards), "tiles", sum(len(c["items"]) for c in cards))
