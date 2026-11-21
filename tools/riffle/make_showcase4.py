"""Write decks/showcase4.json: the showcase 2 notes applied (lane V3, round 10/11). One board a hero with only the
clips that changed (clips/showcase4/), each saying what changed; variants asked for are picked on their own cards."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent
CLIPS = HERE.parents[1] / "clips" / "showcase4"

# clip name -> (label, what changed)
WHAT = {
    "tower-holdTheLine": ("Hold the Line", "The red lines to the taunted enemies are gone; a red mark pops in over each one's head instead."),
    "archer-attack": ("Bow (attack)", "The bow is held further forward."),
    "archer-frostArrow": ("Frost Arrow", "No ice puddle left on the floor."),
    "archer-roll": ("Roll", "She slides back on her feet, and at tier III the caltrops fly out of the slide."),
    "twinfang-backstab": ("Backstab", "The smoke fades out, and a second puff appears where she comes back in."),
    "wildmane-cleave": ("Cleave", "The greatsword is held straight out through the spin."),
    "berserker-attack": ("Flail (attack)", "Simpler: the head comes down, a dent and some dust."),
    "berserker-whirl": ("Whirl", "No strings; the heads match the flail in his hand."),
    "granny-reap": ("Reap", "The scythe is held out; the blood orbs drip on the way and pop when they reach her."),
    "granny-oldBones": ("Old Bones", "No skull: a pale wisp rises out of her and is pulled back in with a flash."),
    "frost-iceShard": ("Ice Shard", "Each spike has a frost trail; chilled units shed slow snowflakes."),
    "storm-attack": ("Zap (attack)", "Thinner, small arms, stronger yellow, and it starts at her hands."),
    "storm-chainLightning": ("Chain Lightning", "Starts at her hands. No X where lightning hits."),
    "storm-stormCloud-tier1": ("Zeus Bolt, tier I", "Reworked: one bolt that leaps between enemies 4 times, shocking each."),
    "storm-stormCloud": ("Zeus Bolt, tier III", "Three bolts, 6 leaps each. Busy on four dummies standing close; reads better in a room."),
    "cleric-attack": ("Light orb (attack)", "The orbs fan out by angle and curve in; one passing through an ally heals it a little."),
    "cleric-mend": ("Mending Ray", "An outlined gold band; the heal symbols are outlined crosses spread round the target."),
    "cleric-sanctuary": ("Sanctuary", "One ring of light through every post."),
    "bard-attack": ("Sour note (attack)", "Sways more slowly."),
    "bard-lullaby": ("Lullaby", "Each note has its own pace and end point, then drifts and fades."),
    "druid-entangle": ("Entangle", "The earlier cast is back, with the newer entangled look on the enemies."),
    "necromancer-attack": ("Soul flame (attack)", "No longer a bone: green soul fire that starts big and slow, then shrinks and speeds up."),
    "necromancer-raiseDead": ("Raise Dead", "The raised dead are plain grey, with even hands."),
    "necromancer-lifeDrain": ("Life Drain", "The ribbon grows out to its target first."),
    "necromancer-boneSpear": ("Bone Spear", "Simpler: one tapering bone spike."),
    "plague-attack": ("Poison cluster (attack)", "The poof fades out."),
    "falconer-looseFalcon": ("Loose the Falcon", "The bird leaves his arm while it hunts."),
    "warhelm-warHorn": ("War Horn", "Short sound lines to the front and sides, not a ring round him."),
    "jester-mock": ("Mock", "Short sound lines, not a ring round him."),
    "gladiator-showboat": ("Showboat", "Short sound lines, not a ring round him."),
    "griffon-wingShield": ("Wing Guard", "The wings are longer and in his gold."),
    "boss-chieftain-spin": ("Chieftain's spin", "A spinning blade now sweeps two crescents; bone spikes are only for bone."),
    "boss-greatEngine-spin": ("Great Engine's spin", "The same blade sweep on the Engine's head spin."),
}
HEROES = [("tower", "Tower"), ("archer", "Archer"), ("twinfang", "Twinfang"), ("wildmane", "Wildmane"), ("berserker", "Berserker"), ("granny", "Granny Reaper"),
          ("frost", "Frost Mage"), ("storm", "Storm Mage"), ("cleric", "Cleric"), ("bard", "Bard"), ("druid", "Druid"), ("necromancer", "Necromancer"), ("plague", "Plague Doctor")]
vid = lambda n: f"../../../clips/showcase4/{n}.mp4"
has = lambda n: (CLIPS / f"{n}.mp4").exists()
def board(cid, title, text, names, why="Each changed only where your note said. Tick the ones that are right now; comment on any that aren't."):
    items = [{"id": n, "label": WHAT[n][0][:36], "video": vid(n), "text": WHAT[n][1]} for n in names if has(n)]
    return {"id": cid, "kind": "board", "rarity": "common", "title": title[:26], "text": text[:110], "why": why, "pick": [i["id"] for i in items], "items": items} if items else None

cards = []
# the two sets of variants the designer asked for
shock = [("berserker-shockwave", "1 Ridge", "The one you saw."), ("berserker-shockwave-v2", "2 Slabs", "Rock slabs thrust up out of the floor."), ("berserker-shockwave-v3", "3 Rolling", "A hump of earth rolls forward, pebbles hopping off it.")]
bite = [("druid-callWolf", "1 Jaws", "The one you saw."), ("druid-callWolf-v2", "2 Chomp", "A big jaw outline closing, tooth marks left."), ("druid-callWolf-v3", "3 Rake", "Three curved fang streaks across the enemy."), ("druid-callWolf-v4", "4 Snap", "A white crescent and tufts of fur.")]
for cid, title, text, why, opts, pick in [
    ("shockwave", "Shockwave: pick one", "You asked for two more Shockwave variants. Three to choose from.", "Tick the one to keep (or more than one, and I'll blend them).", shock, "berserker-shockwave-v2"),
    ("wolfbite", "Wolf bite: pick one", "You asked for three variations of the wolf's bite. Four to choose from.", "Tick the one to keep. The wolf's body partly hides the bite on these dummies; it shows better in a real fight.", bite, "druid-callWolf-v3")]:
    items = [{"id": n, "label": lab, "video": vid(n), "text": t} for n, lab, t in opts if has(n)]
    cards.append({"id": cid, "kind": "board", "rarity": "uncommon", "title": title, "text": text, "why": why, "pick": [pick], "items": items})
for hid, name in HEROES:
    names = [n for n in WHAT if n.startswith(hid + "-")]
    c = board(hid, name, f"{name}: the clips that changed from your notes.", names)
    if c: cards.append(c)
c = board("others", "New heroes and bosses", "Fixes from the heroes and boss work: the falcon, the rings round heroes, the bosses' spins.",
          ["falconer-looseFalcon", "warhelm-warHorn", "jester-mock", "gladiator-showboat", "griffon-wingShield", "boss-chieftain-spin", "boss-greatEngine-spin"],
          why="You've disliked rings round heroes before, so three new abilities that drew them now burst short sound lines instead. Tick what's right.")
if c: cards.append(c)
deck = {"title": "Showcase 4: your showcase 2 notes", "topic": "art", "order": 18, "priority": 2, "cards": cards}
(HERE / "decks" / "showcase4.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(cards), "clips", sum(len(c["items"]) for c in cards))
