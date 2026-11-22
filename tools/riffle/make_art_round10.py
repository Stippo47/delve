"""Write decks/art-round10.json: art round 10 (design/class-round10). The variant sets the designer asked for, one card
each (comment with the one to keep), then the fixes that went into the game, each beside the version they saw."""
import json, pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
R = HERE.parents[1] / "design" / "class-round10"
sys.path.insert(0, str(HERE))
from make_art_round4 import clean
REN = R / "enemies" / "renders"
rel = lambda stem: f"../../../design/class-round10/enemies/renders/{stem}.png"

# board -> (title, what's on it, the note it answers)
VARIANTS = [
    ("ghost-a-tails", "Ghost A: three tails", "A point, B stub, C hem. Only the tail's outline differs.", "Tail is still a bit weird. Try 3 types."),
    ("ghost-b-tails", "Ghost B: three tails", "The same three tails on the second ghost.", "Same thing"),
    ("troll-heads", "Troll: three heads", "A wide jaw and long ears, B potato nose and a moss mop, C flat top with horns. 10% smaller, the boulder as it is.", "Try different heads. Make them slightly smaller keep boulder same size."),
    ("troll-hands", "Troll: just hands", "The same three heads with fists only, no arms.", "Make version without arms. Just hands"),
    ("wolves-nopaws", "Wolves without paws", "The wolf, the dire wolf and the Alpha without their front paws.", "Show me wolves without paws."),
    ("alpha-scar", "The Alpha's scar", "A claw marks, B a stitched scar down the snout.", "Change face scar"),
    ("boar", "Thornback boar: three", "Redrawn in the wolves' build: A a ridge, B quills, C plates.", "I could see it almost working. Make variants."),
    ("ent-faces", "Ent: three faces", "A leaf brows, B a nose with a leaf, C hollows.", "Face variants"),
    ("elder-ent-faces", "Elder Ent: three faces", "A a scowl with peg teeth, B a nose and moss moustache, C lantern eyes. It is also bigger in the game now.", "Change face. 3 versions. They should also be very big"),
    ("sproutling", "Sproutling: three takes", "A turnip, B acorn, C bud.", "Don't like."),
    ("golem-bodies", "Golem: three bodies", "A boulders, B blocks, C a hunch. The eye is kept as it was.", "First get down basic golems body. Make 3 variants."),
    ("gilded-golems", "Gilded golem: the three", "Each of the three bodies in gold.", "Then make gilded. Note I love the eye."),
    ("frost-spirit", "Frost spirit's tail", "The core alone, and a mock-up of the wiggling tail the game will draw behind it.", "That tail should be like that rat tail where it's wiggly/ follows behind"),
    ("boss-biblical-angel", "A biblically accurate angel", "One great eye, two crossing wheels set with eyes, six wings: for the Spire's boss, which is being rebuilt.", "I want one of those biblically accurate angels."),
]
cards = []
vnames = {v[0] for v in VARIANTS}
for stem, title, text, note in VARIANTS:
    if not (REN / f"{stem}.png").exists():
        continue
    cards.append({"id": stem, "kind": "report", "rarity": "uncommon", "title": title[:26], "text": text[:110],
                  "why": f"You wrote: \"{note}\" Comment with the letter to keep, or what to change. The game keeps its current art until you pick.",
                  "images": [rel(stem)]})

notes = (R / "notes.md").read_text(encoding="utf-8").splitlines()
def note_for(stem):
    for l in notes:
        if l.lstrip().startswith("- ") and ("`" + stem + "`" in l or stem + ".svg" in l or stem + ".png" in l):
            label = re.search(r"\*\*([^*]+)\*\*", l)
            return (label.group(1) if label else ""), clean(l)
    return "", ""
GROUPS = [("Wildwood and Sewers", ["greenskin", "sewer", "bandit", "wild", "slime"]), ("Frost, Spire and Dunes", ["frost", "spire", "dunes"]), ("Foundry and bosses", ["foundry", "boss"])]
done = set()
for gi, (title, prefixes) in enumerate(GROUPS):
    items = []
    for png in sorted(REN.glob("*.png")):
        stem = png.stem
        if stem.endswith(("-before", "-thumb")) or stem in vnames or stem in done or not any(stem.startswith(p) for p in prefixes):
            continue
        done.add(stem)
        label, text = note_for(stem)
        label = (label or stem.replace("-", " ").capitalize()).split(",")[0][:30]
        it = {"id": stem, "label": label, "image": rel(stem), "text": (text or "Redrawn this round.")[:400]}
        if (REN / f"{stem}-thumb.png").exists(): it["thumb"] = rel(stem + "-thumb")
        items.append(it)
        if (REN / f"{stem}-before.png").exists():
            items.append({"id": stem + "-before", "label": (label + " (before)")[:36], "image": rel(stem + "-before"), "text": "The version you saw last round."})
    if len(items) >= 2:
        cards.append({"id": f"fixes{gi}", "kind": "board", "rarity": "rare", "title": title[:26],
                      "text": "Your notes applied, each beside the version you saw. These are live in 0.14.2.",
                      "why": "Drawn on the stronger model this time, to the standard of the heroes you approved. Tick the ones that are right; comment on any that still aren't.",
                      "pick": [i["id"] for i in items if not i["id"].endswith("-before")], "items": items})
deck = {"title": "Art round 10: your notes, and picks", "topic": "art", "order": 23, "priority": 2, "cards": cards}
(HERE / "decks" / "art-round10.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(cards), "variant cards", sum(1 for c in cards if c["kind"] == "report"))
