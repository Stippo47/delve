"""Write decks/art-round8.json: art round 8 (design/class-round8). Two boards: the round-7 notes applied (each beside
the version the designer saw), and real art for the kinds that wore placeholders (each beside the placeholder)."""
import json, pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
R8 = HERE.parents[1] / "design" / "class-round8"
sys.path.insert(0, str(HERE))
from make_art_round4 import clean

notes = (R8 / "notes.md").read_text(encoding="utf-8").splitlines()
def note_for(fname):
    for l in notes:
        if fname in l and l.lstrip().startswith("- "):
            label = re.search(r"\*\*([^*]+)\*\*", l)
            return (label.group(1) if label else ""), clean(l)
    return "", ""

PART1 = ["greenskin-orc", "ghost-a", "ghost-b", "greenskin-troll", "greenskin-chieftain"]
part1, part2 = [], []
d = R8 / "enemies"
r = d / "renders"
for svg in sorted(d.glob("*.svg")):
    if not (r / f"{svg.stem}.png").exists():
        continue
    label, text = note_for(svg.name)
    label = (label or svg.stem.split("-", 1)[-1].replace("-", " ").capitalize()).split(",")[0][:30]
    rel = f"../../../design/class-round8/enemies/renders/{svg.stem}"
    one = svg.stem in PART1
    out = part1 if one else part2
    it = {"id": svg.stem, "label": label, "image": rel + ".png", "text": (text or "New this round.")[:400]}
    if (r / f"{svg.stem}-thumb.png").exists():
        it["thumb"] = rel + "-thumb.png"
    out.append(it)
    if (r / f"{svg.stem}-before.png").exists():
        out.append({"id": svg.stem + "-before", "label": (label + " (before)")[:36], "image": rel + "-before.png",
                    "text": "The version you saw last round, for comparison." if one else "What the game showed until now (a recoloured stand-in)."})
picks = lambda items: [i["id"] for i in items if not i["id"].endswith("-before")]
deck = {"title": "Art round 8: notes, and real enemy art", "topic": "art", "order": 15, "priority": 3, "cards": [
    {"id": "notes", "kind": "board", "rarity": "rare", "title": "Your round-7 notes",
     "text": "The orc's mouth, both ghosts, the troll with its boulder, and the mohawk one as the Chieftain.",
     "why": "Each starts from the exact tile your note was on and changes only that. Tick the ones that are right now.",
     "details": "The troll is now twice the archer across in the game (it was 1.4 times), with a round nose, an underbite and a boulder in both fists.\n\nThe mohawk troll is kept exactly as drawn and named the Warren's Chieftain, but it still has the trolls' teal skin. If 'not as a troll' meant a different look, say so.",
     "pick": picks(part1), "items": part1},
    {"id": "real", "kind": "board", "rarity": "rare", "title": "Real art for placeholders",
     "text": "Wolves, six bandits, poacher, brute and Chief, boar, sproutling, ent, wisp, Elder Ent, rat king, croc, crab.",
     "why": "These were recoloured stand-ins in 0.10.0. All are live in 0.12.0 in the heroes' style, no eyes. Tick the ones that fit; comment on any that don't.",
     "details": "Weak spots I know of: the bandits differ by headgear and weapon only; the greatsword is short; the rat king reads as a heap of rats up close and a spiky blob at game size; the ent and the Elder Ent share a build.",
     "pick": picks(part2), "items": part2}]}
(HERE / "decks" / "art-round8.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("items:", len(part1), len(part2))
