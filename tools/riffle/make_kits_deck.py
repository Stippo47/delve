"""Write decks/kits.json: the 15 heroes' kits as a board (one item per hero), plus my calls so far."""
import json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
src = (ROOT / "js" / "heroes.js").read_text(encoding="utf-8")

# Pull the kit text out of heroes.js (it's data written as a JS object literal).
RENDERS = {
    "paladin": "knight/renders/knight-paladin", "tower": "knight/renders/knight-tower", "archer": None,
    "twinfang": "rogue/renders/rogue-twinfang", "wildmane": "barbarian/renders/barbarian-wildmane-scar",
    "berserker": "barbarian/renders/barbarian-berserker", "granny": "farmer/renders/farmer-granny-reaper",
    "pyromancer": "heroes-casters/renders/caster-pyromancer", "frost": "heroes-casters/renders/caster-frost",
    "storm": "heroes-casters/renders/caster-storm", "cleric": "heroes-support/renders/support-cleric",
    "bard": "heroes-support/renders/support-bard", "druid": "heroes-casters/renders/caster-druid",
    "necromancer": "heroes-casters/renders/caster-necromancer", "plague": "heroes-support/renders/support-plague-doctor",
}
blocks = re.split(r"\n  (\w+): \{\n", src.split("export const HEROES = {", 1)[1].split("\nexport const HERO_IDS")[0])
items = []
for i in range(1, len(blocks), 2):
    hid, body = blocks[i], blocks[i + 1]
    name = re.search(r"name: '([^']+)'", body).group(1)
    role = re.search(r"role: '(\w+)'", body).group(1)
    blurb = re.search(r"blurb: '((?:[^'\\]|\\.)*)'", body).group(1).replace("\\'", "'")
    atk = re.search(r"attack: \{ name: '([^']+)'.*?desc: '((?:[^'\\]|\\.)*)'", body).group(1)
    abil = re.findall(r"\{ id: '\w+', name: '([^']+)', cd: [\d.]+, desc: '((?:[^'\\]|\\.)*)',\s*tiers: \['((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)'\] \}", body)
    trait = re.search(r"trait: \{ id: '\w+', name: '([^']+)', desc: '((?:[^'\\]|\\.)*)' \}", body)
    unlock = "Starter" if "starter: true" in body else "Unlocked with " + re.search(r"gems: (\d+)", body).group(1) + " gems"
    lines = [f"{blurb} ({role}; {unlock}.)", "", f"Attack: {atk}."]
    for n, (an, ad, t1, t2, t3) in enumerate(abil):
        lines.append(f"\n{an}{' (free from the start)' if n == 0 else ''}: {ad}\nI: {t1} II: {t2} III: {t3}".replace("\\'", "'"))
    lines.append(f"\nTrait, {trait.group(1)}: {trait.group(2)}".replace("\\'", "'"))
    r = RENDERS[hid]
    img = f"../../../design/class-round2/archer/renders/archer" if r is None else f"../../../design/class-round4/{r}"
    items.append({"id": hid, "label": name, "image": img + ".png", "thumb": img + "-thumb.png", "text": "\n".join(lines)})

deck = {
  "title": "Build v1: the 15 heroes' kits",
  "topic": "progression", "order": 3, "priority": 2,
  "cards": [
    {"id": "kits", "kind": "board", "rarity": "rare", "title": "15 heroes in the game",
     "text": "Each hero's attack, three abilities with three tiers, and trait. Tick the ones you like; comment on any.",
     "why": "These are in the game now (being finished). Your notes here change what each one does.",
     "pick": [i["id"] for i in items],
     "details": "Base attacks are plain. Abilities and their tiers are bought in each hero's skill tree with gold; a bought tier switches on in a run once the hero reaches its level there (2, 5 and 8). Tier III also needs the hero to have reached level 8 in a dungeon once.",
     "items": items},
    {"id": "calls", "kind": "design", "rarity": "uncommon", "title": "My calls so far",
     "text": "Choices I made while building, so a new player has a fair start. Mark any you'd change.",
     "why": "You said not to wait for you, so I picked. Each part is one call; they're easy to change.",
     "pick": "Keep these.",
     "parts": [
       {"id": "free", "title": "First ability free", "text": "Every hero starts with its first ability (tier I) already bought, so a new party of one still has a move."},
       {"id": "scale", "title": "Fewer enemies for small parties", "text": "Enemy numbers scale with party size: one hero faces about 40% of what three do."},
       {"id": "pace", "title": "First runs", "text": "A brand-new solo hero tends to fall around rooms 5 to 10 with 100 to 200 gold, enough for a node or two."},
       {"id": "enemies", "title": "Enemy art", "text": "Only the enemy art you picked is used (skeletons, ghost, lizardmen, plus the rat and slime). Anything else is a placeholder until it's redrawn."},
     ]},
  ],
}
(HERE / "decks" / "kits.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("heroes:", len(items))
