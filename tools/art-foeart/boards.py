"""Round 19 art lane (enemy sprites): the list of option boards (boards.json for render.mjs) and the Riffle deck.
python tools/art-foeart/boards.py            -> tools/art-foeart/boards.json, tools/riffle/decks/r19-art-foes.json
node tools/art-foeart/render.mjs tools/art-foeart/boards.json [filter]   -> design/r19-art/foes/<kind>/<kind>-<opt>.png"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
FOES = "design/r19-art/foes"

# kind: (name, current art the game draws, [(option, label, one line)], favourite)
KINDS = {}
# boards: (id, title, text, why, [kinds])
BOARDS = []


def kind(k, name, cur, opts, fav, ref=None):
    KINDS[k] = dict(name=name, cur=cur, opts=opts, fav=fav, ref=ref)


# ---------------------------------------------------------------- the Frost Hollow
kind("spiderHunter", "Hunter Spider", "art/enemies/placeholder/spider-hunter.svg", [
    ("a", "Chevron", "The old hunter's colours and chevron, in the fire spider's build."),
    ("b", "Striped", "A wolf spider: one dark stripe, banded knees, a bigger head and fangs."),
], ["a"])
kind("spiderMomma", "Momma Spider", "art/enemies/placeholder/spider-momma.svg", [
    ("a", "Clutch", "Huge abdomen, one tidy clutch of seven same-size eggs on her back."),
    ("b", "Egg sac", "Carries a white silk egg sac on her back: where her brood comes from."),
], ["b"])
kind("frostWolf", "Frost Wolf", "art/enemies/frost-wolf.svg", [
    ("a", "No paws", "Your wolf fixes: head forward, body shorter, no paws (as the picked wolves)."),
    ("b", "Paws under", "The same, with the front paws drawn under the body."),
], ["a"])

# ---------------------------------------------------------------- the Ember Deep
kind("banshee", "Banshee", "art/enemies/placeholder/banshee.svg", [
    ("a", "Wailer", "In the ghosts' build: their eyes, a wailing mouth, long hair streaming back."),
    ("b", "Hollow", "The Hollow's skull you said to keep for a banshee, in a ragged shroud."),
    ("c", "Veil", "A under a teal veil that trails behind her."),
], ["b"])
kind("imp", "Imp", "art/enemies/placeholder/imp.svg", [
    ("a", "Firebrand", "Nearly all head, little horns, long ears, a grin, a fireball in hand."),
    ("b", "Match head", "A flame burning on its head instead of horns, darker red."),
], ["a"], ref=("design/class-round6/enemies/fiend-imp.svg", "ticked round 8, never wired"))
kind("devil", "Devil", "art/enemies/placeholder/devil.svg", [
    ("a", "Trident", "Crimson, widow's peak, goatee, horns, bat wings, gold trident."),
    ("b", "High collar", "No wings: a black cloak with a tall collar behind the head."),
], ["a"], ref=("design/class-round6/enemies/fiend-devil.svg", "ticked round 8, never wired"))
kind("demon", "Demon", "art/enemies/placeholder/demon.svg", [
    ("a", "Ram", "Plum brute, glowing cracks, curled ram horns, a glowing mouth, huge fists."),
    ("b", "Bull", "A bull of the pit: wide pale horns, a gold nose ring, huge fists."),
], ["b"], ref=("design/class-round6/enemies/fiend-demon.svg", "ticked round 8, never wired"))
kind("succubus", "Succubus", "@succubus", [
    ("a", "Wings", "Her own sprite: plum hair, small horns, rose wings, a heart-tipped tail."),
    ("b", "Whip", "Hair in a high tail, wings folded small, a coiled whip."),
], ["a"])
kind("hellhound", "Hellhound", "art/enemies/hellhound.svg", [
    ("a", "No paws", "Your wolf fixes: head forward, body shorter, no paws (as the picked wolves)."),
    ("b", "Paws under", "The same, with the front paws drawn under the body."),
], ["a"])


def board(bid, title, text, why, kinds):
    BOARDS.append(dict(id=bid, title=title, text=text, why=why, kinds=kinds))


board("frost", "Frost Hollow foes", "Hunter and momma spiders and the banshee redrawn; the frost wolf with your wolf fixes.",
      "The spiders and banshee are still round 4-5 drawings you turned down. Spiders now use the ticked fire spider's build, "
      "the banshee the ghosts'. The frost wolf gets the wolves' fix. Left: the game now. Right: the option, 3x and game size.",
      ["spiderHunter", "spiderMomma", "banshee", "frostWolf"])
board("ember", "Ember Deep foes", "Imp, devil, demon and succubus redrawn beside the Pit Lord; the hellhound with your wolf fixes.",
      "Imp, devil and demon are round-5 stand-ins (your ticked round-6 fixes never reached the game: the middle picture). "
      "The succubus is the devil turned pink. All in the Pit Lord's build, each its own outline.",
      ["imp", "devil", "demon", "succubus", "hellhound"])


def png(k, o):
    return f"{FOES}/{k}/{k}-{o}.png"


def main():
    out = []
    for k, d in KINDS.items():
        for o, lab, line in d["opts"]:
            cur = [{"url": d["cur"], "label": "now in the game"}]
            if d["ref"]:
                cur.append({"url": d["ref"][0], "label": d["ref"][1]})
            out.append({"out": png(k, o), "title": f"{d['name']}: option {o.upper()}, {lab}", "sub": line, "kind": k,
                        "cur": cur, "opt": [{"url": f"{FOES}/{k}/{k}-{o}.svg", "label": f"{o.upper()}: {lab}"}],
                        "thumb": png(k, o).replace(".png", "-thumb.png")})
    (ROOT / "tools/art-foeart/boards.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    cards = []
    for b in BOARDS:
        items, pick = [], []
        for k in b["kinds"]:
            d = KINDS[k]
            for o, lab, line in d["opts"]:
                iid = f"{k}-{o}"
                items.append({"id": iid, "label": f"{d['name']} {o.upper()}: {lab}"[:40], "image": "../../../" + png(k, o), "text": line,
                              "thumb": "../../../" + png(k, o).replace(".png", "-thumb.png")})
                if o in d["fav"]:
                    pick.append(iid)
        cards.append({"id": b["id"], "kind": "board", "rarity": "uncommon", "title": b["title"], "text": b["text"],
                      "why": b["why"], "pick": pick, "items": items})
    deck = {"title": "Art: enemies", "topic": "art", "stack": "r19art", "order": 7, "cards": cards}
    (ROOT / "tools/riffle/decks/r19-art-foes.json").write_text(json.dumps(deck, indent=1, ensure_ascii=False), encoding="utf-8")
    print(len(out), "boards,", len(cards), "cards")


if __name__ == "__main__":
    main()
