"""Write decks/art-round11.json: art round 11 (design/class-round11). First what is now in the game: the picks, and the
fixes, each beside the version the note was on. Then the sets to pick from, one card each (the game keeps its current
art for those until a pick). Then the two figures that were owed: the Enchantress and the Succubus."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent
R = HERE.parents[1] / "design" / "class-round11"
rel = lambda stem, folder="enemies": f"../../../design/class-round11/{folder}/renders/{stem}.png"


def exists(stem, folder="enemies"):
    return (R / folder / "renders" / f"{stem}.png").exists()


def board(cid, title, text, why, rows):
    """rows: (stem, label, what, folder) -> a tile and its before."""
    items = []
    for stem, label, what, *f in rows:
        folder = f[0] if f else "enemies"
        if not exists(stem, folder):
            continue
        it = {"id": stem, "label": label[:36], "image": rel(stem, folder), "text": what}
        if exists(stem + "-thumb", folder): it["thumb"] = rel(stem + "-thumb", folder)
        items.append(it)
        if exists(stem + "-before", folder):
            items.append({"id": stem + "-before", "label": (label[:27] + " (before)"), "image": rel(stem + "-before", folder), "text": "The version your note was on."})
    assert len(items) >= 2, cid
    return {"id": cid, "kind": "board", "rarity": "rare", "title": title[:26], "text": text[:110], "why": why,
            "pick": [i["id"] for i in items if not i["id"].endswith("-before")], "items": items}


def report(cid, title, text, note, folder="enemies", extra=""):
    assert exists(cid, folder), cid
    return {"id": cid, "kind": "report", "rarity": "uncommon", "title": title[:26], "text": text[:110],
            "why": f"You wrote: \"{note}\" {extra}Comment with the one to keep, or what to change. The game keeps its current art until you pick.",
            "images": [rel(cid, folder)]}


TICK = "Tick the ones that are right; comment on any that still aren't."
cards = [
    board("picks", "Your picks, in the game", "Ghost tail 1 on both, the Elder Ent's face B, the frost spirit's tail drawn by the game.",
          "These are exactly what you picked, now live. The spirits' tails are drawn by the game (all seven); the clip on the next card shows them. " + TICK,
          [("ghost", "Ghost A, tail 1", "The point, as picked."), ("ghost-b", "Ghost B, tail 1", "The point, as picked."),
           ("wild-elder-ent", "Elder Ent, face B", "As picked; it is the size you asked for last round."),
           ("spirit-core-frost", "Frost spirit", "The art is the core alone now; the game draws the tail."),
           ("greenskin-troll", "Troll, head B", "Sharper jaw, a slightly longer head, no mouth, a long nose. It keeps its arms. 10% smaller, the boulder its old size.", "boards"),
           ("wild-ent", "Ent, face B", "The mouth and the leaf on the nose are gone.")]),
    {"id": "moving", "kind": "report", "rarity": "uncommon", "title": "Cobra, spirits, gaper",
     "text": "In the game: the cobra's hood circles over its coil, the spirits' tails, the troll, the gaper's thinner line.",
     "why": "You wrote: \"have it slowly move around the bottom segment in game\", \"like that rat tail\" and \"the gaper in this pic has big outlines\". The gaper stands beside a rattler: their lines are the same weight now. Pin anything that looks wrong.",
     "videos": ["../../../design/class-round11/films/cobra-spirits-gaper.mp4"]},
    report("wolves", "Wolves: heads, bodies", "The game's wolves: no paws, heads forward, bodies shorter. Beside them: the paws drawn under the body.",
           "Bring their heads forwards a bit. Shorten body a bit. And I think this is good. Also show me with the pawns rendering under the body",
           extra="The three without paws are live. "),
    report("boar", "Boar: without the mane", "A the ridge as you picked it (live). B without the dark crest. C without the ruff round its neck.",
           "Ridge. Show me without the mane", extra="I wasn't sure which you call the mane, so both are here. "),
    board("fixes-wild", "Wildwood and Sewers", "Your notes applied, each beside the version you saw. Live.",
          "Each changes only what its note says. No bandit has the line in the bandanna any more. " + TICK,
          [("bandit-axe", "Axe bandit", "The axe flipped: the blade faces in."), ("bandit-daggers", "Knife bandit", "The kerchief's knot lies on top now."),
           ("bandit-sword", "Sword bandit", "The helm's strip is two flat lines, light and dark."), ("bandit-brute", "Bandit brute", "No line in the bandanna."),
           ("bandit-chief", "Bandit Chief", "No line in the bandanna."), ("greenskin-orc", "Orc", "The tail of hair lies over the head, from the knot; no hair tie."),
           ("wild-dire-wolf-less-spiky", "Dire wolf, less spiky", "Only its mane: fewer, shallower tufts (shown with paws, as on your tile).")]),
    report("croc", "Croc: the axes", "Aimed inwards, rusted, a chip in each; the right one is the left one mirrored. The steel version is saved.",
           "Aim inwards. Put a chip in them and make them rusted (save this version though)... mirror it",
           extra="Live. I read \"aim inwards\" as where the axes point; say if you meant the blades. "),
    board("fixes-cold", "Frost, Spire and Dunes", "Your notes applied, each beside the version you saw. Live.",
          "Each changes only what its note says. " + TICK,
          [("frost-icicle-wraith", "Icicle wraith", "The hands: three long icicle fingers on each sleeve."),
           ("frost-yeti", "Yeti", "A dark nose again, taller than it is wide; the front of the torso is one soft curve."),
           ("frost-ice-slime", "Ice slime", "The old one, without its icicles."),
           ("spire-herald-light", "Herald of Light", "Less shade on the face, bangs to one side, a smaller flag, the spear held lower in a plain fist."),
           ("spire-herald-fallen", "Fallen Herald", "Bangs the other way, a cracked cheek, the same flag and grip."),
           ("spire-seraph", "Seraph", "The old head shape and cap of hair, in its pale gold."),
           ("dunes-serpent-coil", "Serpent segment", "The head's own diamond, the same size on screen."),
           ("dunes-sand-serpent", "Sand serpent, whole", "Head and six segments as the game lays them.", "boards"),
           ("boss-goblin-chieftain", "Goblin Chieftain", "Hands further forward, the blades flipped.")]),
    report("mummy", "Mummy: the last one", "A no button, no arms (live). B no button, arms kept. C the newer one without its collar.",
           "I liked the last one just without the button thing. I want to see without the collar",
           extra="Earlier: \"Remove arms\", so A has both notes. The collar that shows is the newer one's. "),
    board("fixes-foundry", "The Foundry", "Your notes applied, each beside the version you saw. Live.",
          "Each changes only what its note says. " + TICK,
          [("foundry-bomb-bot", "Bomb bot", "No caution tape, a proper fuse, the feet under its left and right sides."),
           ("foundry-turret-flame", "Flame turret", "The flame comes out from under the nozzle, not on top of it."),
           ("foundry-turret-laser", "Laser turret", "The socket is the housing's shape and hugs it."),
           ("foundry-smith", "Foundry smith", "The glow is on the hammer's side; a plain left hand."),
           ("foundry-saw-blade", "Saw blade", "The previous blade with the new red middle."),
           ("foundry-tesla-coil", "Tesla coil", "Cheated up: the coil stands and you see its side.")]),
    report("bandit-torch", "Torch bandit", "A the hat kept, only the torch new. B a sackcloth cowl. C red hair and soot. The same new torch on all.",
           "Meh. Don't like the torch. Pretty cool hat for a bandit more suited for an outlaw", extra="The hat is saved for an outlaw if you want one. "),
    report("bandit-greatsword", "Greatsword bandit", "A a deserter's dented helm. B the gang's headsman. C a horned raider.", "Meh"),
    report("bandit-spear", "Spear bandit", "A a kettle hat and a boar spear. B a striped head wrap. C a farmer's straw hat.", "Try again"),
    report("bandit-poacher", "Poacher", "A an antlered hide hood. B a hood and a quiver. C a beard and a brace of birds.", "Try again"),
    report("spire-fallen-angel", "Fallen angel", "A burnt white, blindfolded. B its halo slipped to a collar. C still burning.", "Try again"),
    report("golem-bodies", "Golem: four more", "D an arch. E a cairn of slabs. F split slate. G one carved wheel. The first three are kept.", "Try 4 more. Keeps these."),
    report("gilded-golems", "Gilded golem: no mask", "No plate round the eye. A gold veins. B gold bands. C gold caps. Shown on body A.", "Don't like the gold mask look"),
    report("sproutling", "Sproutling: the original", "The first design, no arms. A no collar of leaves. B five broad leaves. C its two leaves out to the sides.",
           "I like these. Save em. But try the original design just better. No arms. Less busy leaves.", extra="The three from last time are saved. "),
    report("dart-trap", "Dart trap: its eye", "A a carved eye. B a ruby in a gold lotus. C a scarab.", "Different eye style. Variants"),
    report("automaton-visors", "Automaton: visors", "A a grille of five slots. B one round lens. C a scowl.", "Good except visor. 3 variants."),
    report("automaton-keys", "Automaton: keys", "1 a ring. 2 a bar with two knobs. 3 a clover.", "I also don't like the look of the key on the back. Make 3 for that too"),
    report("crawler-visors", "Chain crawler: visor", "The automaton's three visors on the crawler's head.", "Different visor."),
    report("repair-drone", "Repair drone: its front", "A just an eye. B an eye and two grabbers. C an eye and a welding torch.", "3 variants for what's on its front. Its propellers and body looks good. Eye?"),
    report("steam-turret", "Steam turret: barrel", "A a long pipe. B twin pipes. C a kettle's spout.", "Meh Don't like gun barrel"),
    report("mortar", "Mortar: straight up", "Seen from above, the barrel aims up: a round hole, set forward of the middle. A bare tube. B a cradle. C a pot.",
           "Should be a cannon aiming straight up with a circle hole in the top. Slightly offset from the middle, skewed to 1 side."),
    report("bee", "Bee, from the wasp", "Fatter, wings on top, one red eye. A a cog collar. B a cog on its back. C cogs at the wings.",
           "This might be a good base for the basic bee. Maybe a bit fatter. Also make wings render ontop. Maybe add 1 red eye on the head"),
    report("hive", "A hive", "A a copper dome with a door. B a brass drum with honeycomb ports. C an iron comb, some cells lit.", "Also make a hive sprite", folder="props"),
    report("gilded-seraph", "Gilded Seraph: her head", "No helmet, nothing over the face. A a thin circlet. B a halo ring. C a white hood.",
           "Looks good. I'll keep if u can't do better but I don't love the helmet and face covering"),
    report("pit-lord", "Pit Lord: face and tail", "Faces: A burning eyes and fangs, B a bone mask, C a furnace grate. Tails 1 to 3. Last: its face now, tail 1.",
           "Face variants. Also tail", extra="Say a face and a tail, like \"B with tail 1\". "),
    report("enchantress", "The Enchantress", "Her own art at last. A her hair in two buns that make a heart. B a veil and fan. C curls and a rose.",
           "She has worn the Witch's art turned pink until now.", folder="heroes"),
    report("succubus", "The Succubus", "Her own art. A wings and a heart-tipped tail. B a whip with a heart. C her wings folded into a heart.",
           "She has worn the Devil's art turned pink until now."),
]
for c in cards:   # the two owed figures answer no note
    if c["id"] in ("enchantress", "succubus"):
        c["why"] = c["why"].replace("You wrote: \"", "").replace(".\" Comment", ". Comment")
    assert len(c["title"]) <= 26 and len(c["text"]) <= 110, (c["id"], len(c["title"]), len(c["text"]))
deck = {"title": "Art round 11: your notes, and picks", "topic": "art", "order": 30, "priority": 2, "cards": cards}
(HERE / "decks" / "art-round11.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(cards), "boards", sum(1 for c in cards if c["kind"] == "board"), "tiles", sum(len(c.get("items", [])) for c in cards))
