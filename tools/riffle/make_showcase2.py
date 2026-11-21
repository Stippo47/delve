"""Write decks/showcase.json: every hero's attack and abilities on a target dummy (one clip each), plus the puddle and
enemy-HP style picks. Clips come from tools/showcase.mjs (clips/showcase2/<hero>-<ability|attack>.mp4)."""
import json, pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
src = (ROOT / "js" / "heroes.js").read_text(encoding="utf-8")
blocks = re.split(r"\n  (\w+): \{\n", src.split("export const HEROES = {", 1)[1].split("\nexport const HERO_IDS")[0])
cards = []
for i in range(1, len(blocks), 2):
    hid, body = blocks[i], blocks[i + 1]
    name = re.search(r"name: '([^']+)'", body).group(1)
    atk = re.search(r"attack: \{ name: '([^']+)'", body).group(1)
    abil = re.findall(r"\{ id: '(\w+)', name: '((?:[^'\\]|\\.)*)', cd:", body)
    items = []
    for aid, an in [("attack", atk + " (attack)")] + abil:
        if (ROOT / "clips" / "showcase2" / f"{hid}-{aid}.mp4").exists():
            items.append({"id": f"{hid}-{aid}", "label": an.replace("\\'", "'")[:36], "video": f"../../../clips/showcase2/{hid}-{aid}.mp4",
                          "text": f"{name}: {an}." + ("" if aid == "attack" else "")})
    if items:
        cards.append({"id": hid, "kind": "board", "rarity": "common", "title": name,
                      "text": f"{name}'s attack and three abilities on target dummies. Tick the ones that read well.",
                      "why": "Anything you leave unticked or comment on gets reworked.", "pick": [x["id"] for x in items], "items": items})
def styles(prefix, names, what):
    return [{"id": f"{prefix}{n}", "label": nm, "image": f"../../../clips/r9/{prefix}-style{n}.png", "text": f"{what}, style {n}: {nm}."}
            for n, nm in enumerate(names, 1) if (ROOT / "clips" / "r9" / f"{prefix}-style{n}.png").exists()]
pud = styles("puddles", ["Inked", "Soft", "Bands", "Splat", "Rimmed", "Pixel", "Silhouette"], "Oil, fire, gas, water, mist and web on the ground")
ehp = styles("ehp", ["Bar", "Arc"], "An enemy's health, shown once it's hurt")
head = [
    {"id": "puddles", "kind": "board", "rarity": "rare", "title": "Puddles that merge: 7 styles",
     "text": "Oil, fire, gas, water, mist and webs, now merging into one body where they overlap. Pick one (all seven are in settings).",
     "why": "Overlapping bodies of the same kind now join: dark with dark, light with light, one outline round the lot.", "pick": ["puddles1"], "items": pud},
    {"id": "ehp", "kind": "board", "rarity": "rare", "title": "Enemy health, on top",
     "text": "Bar and Arc now sit above the enemy. The new default gives tanky enemies the arc and the rest the bar.",
     "why": "You asked for 4 ways. Bosses keep their own bar at the top.", "pick": ["ehp1"], "items": ehp},
]
deck = {"title": "Showcase 2: your notes applied", "topic": "art", "order": 10, "priority": 2, "cards": [c for c in head if c["items"]] + cards}
(HERE / "decks" / "showcase2.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(deck["cards"]), "clips", sum(len(c["items"]) for c in cards))
