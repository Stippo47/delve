"""Write decks/roster.json: what each picked design does as its own unit (one design card per group, a part per unit)."""
import json, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R3 = HERE.parents[1] / "design" / "class-round3"

def pic(cls, name):
    p = R3 / cls / "renders" / f"{name}-thumb.png"
    return [f"../../../design/class-round3/{cls}/renders/{name}-thumb.png"] if p.exists() else []

# (class folder, file name, title, what it does)
GROUPS = [
 ("knights", "Knights: the front line", "Six knights, each holding the line a different way.", [
  ("knight", "knight-paladin", "Paladin", "Sword and shield. Guards a hurt ally: stands next to them and takes part of the damage meant for them."),
  ("knight", "knight-old-guard", "Old Guard", "Two-handed greatsword. Slow, wide sweeps that hit everything in front."),
  ("knight", "knight-dame", "Dame", "A duellist. Quick sword; blocks a hit now and then and strikes straight back."),
  ("knight", "knight-bastion-a", "Bastion, Tower", "Pure wall. Plants the tower shield: takes far less damage and draws every enemy near."),
  ("knight", "knight-bastion-b", "Bastion, Bulwark", "Spear and round shield. Long reach: fights from just behind the front, keeps enemies at spear length."),
  ("knight", "knight-bastion-c", "Bastion, Griffon", "Warhammer. Leaps onto a far enemy and lands with a shove that knocks those around it back."),
 ]),
 ("rogues", "Rogues: quick and sly", "Three rogues: one kills, one earns, one hides.", [
  ("rogue", "rogue-twinfang", "Twinfang", "Twin daggers. A fast flurry on one target; best at finishing the hurt ones."),
  ("rogue", "rogue-bandit-mask", "Bandit", "The money one. Grabs coins from further away, and what it kills drops extra coins."),
  ("rogue", "rogue-shade-cape", "Shade", "Slips out of sight for a moment; the next hit from behind is a big backstab."),
 ]),
 ("farmers", "Farmers: tools as weapons", "Four farmers, each tool doing what it does on a farm.", [
  ("farmer", "farmer-granny-reaper", "Granny Reaper", "Scythe. A slow sweep all the way round her, hitting everyone close."),
  ("farmer", "farmer-haymaker-fork", "Haymaker", "Pitchfork. Shoves enemies back hard; one shoved into a wall takes extra damage."),
  ("farmer", "farmer-digger", "Digger", "Spade. Digs a trench that slows enemies crossing it."),
  ("farmer", "farmer-grandpa-sickle", "Grandpa Sickle", "Sickle. Quick cuts that hit much harder on enemies already low."),
 ]),
 ("barbarians", "Barbarians: big hits", "Four barbarians, each strong in a different way.", [
  ("barbarian", "barbarian-wildmane", "Wildmane", "Big sword. Gets stronger the more hurt he is."),
  ("barbarian", "barbarian-bearskin-a", "Bearskin", "Spiked club. Grabs an enemy and throws it into others."),
  ("barbarian", "barbarian-warhelm", "Warhelm", "Hammer. Slams the ground: everyone around is knocked back and staggered."),
  ("barbarian", "barbarian-berserker-a", "Berserker", "Flail. Spins it while moving, hitting everything around; can't stop for a few seconds."),
 ]),
]
ENEMIES = [
  ("skeleton", "skeleton-rattler", "Rattler", "The plain skeleton: a sword, walks in, swings."),
  ("skeleton", "skeleton-rattler-jawless-bow", "Rattler, bow", "Shoots from range and backs away."),
  ("skeleton", "skeleton-rattler-jawless-spear", "Rattler, spear", "Reach: stabs from further off."),
  ("skeleton", "skeleton-rattler-loosejaw", "Rattler, mace", "Slow, heavy hits that stagger."),
  ("skeleton", "skeleton-gaper", "Gaper", "Two long swords, angry: fast and charges straight in."),
  ("skeleton", "skeleton-brute", "Brute", "Shield: blocks hits from the front, so it has to be hit from the side or back."),
  ("banshee", "banshee", "Banshee", "Floats over hazards; a scream that slows everyone near."),
  ("enemies", "slime-big", "Slime", "As now: splits into small slimes when it dies."),
  ("enemies", "bat", "Bat", "Flies over hazards; darts in, bites, darts out."),
  ("enemies", "ghost", "Ghost", "Drifts through walls; fades in and out."),
  ("enemies", "lizardman", "Lizardman", "Wet: a spear lunge that soaks what it hits."),
  ("enemies", "spider", "Spider", "Webs: shoots a strand that tangles a hero in place for a moment."),
  ("enemies", "snowman", "Snowman", "Chill: throws snowballs that slow."),
]

cards = []
for gid, title, text, units in GROUPS:
    cards.append({
        "id": gid, "kind": "design", "rarity": "rare", "title": title, "text": text,
        "why": "You asked for every pick to be its own unit. This is what makes each one play differently. Mark any that's wrong or dull.",
        "pick": "Go with these; each one's move is its unlockable ability in its skill tree.",
        "details": "Base attacks stay plain. Each unit's move here is its ability, unlocked in its skill tree, so a level-1 unit just fights with its weapon. Kept to one move each so they're easy to tell apart in a fight.",
        "parts": [{"id": n, "title": t, "text": d, "images": pic(c, n)} for c, n, t, d in units],
    })
cards.append({
    "id": "enemies", "kind": "design", "rarity": "rare", "title": "Enemies: one habit each",
    "text": "Each new enemy with one simple habit, and the status it's built around where it has one.",
    "why": "You said to make enemies for the statuses, not bolt statuses on. These are kept simple, like the rats.",
    "pick": "Go with these.",
    "details": "Skeletons, slimes and rats stay as they are now. The status ones (lizardman wet, spider tangle, snowman chill) come with stage 4, when those statuses are in.",
    "parts": [{"id": n, "title": t, "text": d, "images": pic(c, n)} for c, n, t, d in ENEMIES],
})
deck = {"title": "Who each unit is", "topic": "art", "order": 3, "priority": 2, "cards": cards}
(HERE / "decks" / "roster.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards:", len(cards), "missing pictures:", sum(1 for c in cards for p in c["parts"] if not p["images"]))
