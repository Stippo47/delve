"""Write decks/art-board.json from the rendered pictures in out/. Run render_board.py first."""
import json, pathlib

HERE = pathlib.Path(__file__).resolve().parent

NOTES = {
    "ref-archer": "Locked final archer. Here so you can comment on it too; it's the yardstick for every other sheet.",
    "ref-base": "The approved base body every class is built on (head is the round collision token).",
    "knight-1": "Paladin: open sallet with gold comb, blue scalloped cape, heater shield, arming sword forward. Weak: cape is a broad blue block, hem reads a bit cloud-like; most 'default knight'.",
    "knight-2": "Old Guard: bald veteran, big white spade beard, fur collar, greatsword two-handed, shield slung on his back. Weak: the back shield peeks out like an ear or horn at game size.",
    "knight-3": "Bastion: faceless great helm, gold cross, braced pavise used as a ram for Charge. In the game now as a stand-in. Weak: reads as a red-and-grey crate at game size.",
    "knight-4": "Dame: bareheaded, auburn braid trailing behind, teal cape, kite shield, sword in the left hand (mirror of the Paladin). Weak: hair cap is helmet-shaped.",
    "rogue-1": "Twinfang: swept dark hair and ponytail, crimson scarf trailing, two reverse daggers forward. Weak: ponytail reads as a fin at game size.",
    "rogue-2": "Cowl: round slouch hood and wide teal cowl, one centred dagger. Weak: a bit blobby or mushroom-like small.",
    "rogue-3": "Bandit: red bandana and neckerchief, leather mantle, one dagger. Weak: both reds are the same; one-sided silhouette.",
    "rogue-4": "Shade: silver hair, violet swallowtail cape, crossed curved daggers. In the game now as a stand-in. Weak: hands small against the blades.",
    "skeleton-1": "Rattler: the classic grunt, ring of separate bones around the skull, notched shortsword. In the game now. Weak: plainest; skull a little big for the base.",
    "skeleton-2": "Gaper: long skull pushed forward, jaw hanging open, vertebra hump, rusty spear. Weak: spear reads as a brown stick small.",
    "skeleton-3": "Brute: ogre skull with tusks and underbite, knuckle fists, rusty cleaver. Used for the Bone King boss now. Weak: square stance can look like a chair.",
    "skeleton-4": "Hollow: tall narrow skull, fanned ribs, fencer stance with a rapier. Weak: raised back hand looks like a wave up close.",
    "farmer-1": "Haymaker: straw hat with red band, denim shoulders, pitchfork tines forward. Weak: hat hides the shoulders; tines tiny small.",
    "farmer-2": "Granny Reaper: red headscarf with big knot, white tufts, green shawl, scythe curling in at the front.",
    "farmer-3": "Digger: ginger lad, teal flat cap, leather vest, shovel spade-first. Weak: sideburns read as big ears.",
    "farmer-4": "Grandpa Sickle: bald, big white beard, grain sheaf on his back, sickle. Weak: sheaf is a plain gold wedge.",
    "barbarian-1": "Wildmane: rust mane and forked beard, cream wolf-fur mantle, greatsword at the shoulder. One you liked in an earlier round.",
    "barbarian-2": "Bearskin: bear-head helm with snout and fangs, hide mantle with paws, spiked club. One you liked earlier. Weak: club mostly hidden; a bit teddy up close.",
    "barbarian-3": "Warhelm: horned iron helm with nasal bar, spiked pauldrons, brown beard, warhammer. Weak: face is small; hammer head a slab.",
    "barbarian-4": "Flail Berserker: black hair with red mohawk, woad stripes, spiked-ball flail. Weakest of the four.",
}

import importlib.util
spec = importlib.util.spec_from_file_location("rb", HERE / "render_board.py")
rb = importlib.util.module_from_spec(spec); spec.loader.exec_module(rb)

items = []
for iid, label, _ in rb.ITEMS:
    items.append({"id": iid, "label": label, "image": f"../out/{iid}.png", "thumb": f"../out/{iid}-thumb.png",
                  "text": NOTES[iid]})

deck = {
    "title": "Character art: every candidate",
    "topic": "art",
    "order": 1,
    "priority": 1,
    "cards": [{
        "id": "candidates",
        "kind": "board",
        "rarity": "rare",
        "title": "Class art candidates",
        "text": "Every candidate on the approved base, one picture each. Tick a favourite per class and comment on any.",
        "why": "Your ticks become the final art in the game. Each picture shows the design beside the archer at the same size, then turned 8 ways at game size.",
        "pick": ["knight-1", "rogue-1", "skeleton-1", "skeleton-3", "barbarian-1", "farmer-2"],
        "details": "Open any picture full size to compare head size with the archer.\n\nIn the game now as stand-ins: knight Bastion, rogue Shade, skeleton Rattler, boss Brute. None are approved yet.\n\nMy picks: Paladin (sword and shield read clearly at game size), Twinfang (two daggers give the rogue its own shape), Rattler for the grunt and Brute for the boss, Wildmane, and Granny Reaper (the scythe is the clearest tool of the farmers).\n\nFarmer and barbarian aren't in the game yet. Whatever you tick for them gets used when they join.",
        "items": items,
    }],
}
(HERE / "decks").mkdir(exist_ok=True)
(HERE / "decks" / "art-board.json").write_text(json.dumps(deck, indent=2), encoding="utf-8")
print("wrote decks/art-board.json with", len(items), "items")
