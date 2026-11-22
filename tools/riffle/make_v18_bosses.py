"""Write decks/v18-bosses.json: 0.18.0, the seven bosses redone from the v12-bosses answers (clips/r13/bosses/)."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent
CLIPS = HERE.parents[1] / "clips" / "r13" / "bosses"
vid = lambda n: f"../../../clips/r13/bosses/{n}.mp4"
vids = lambda bid: [vid(p.stem) for p in sorted(CLIPS.glob(f"{bid}-p*.mp4"))]

# id, title, face text, your words, moves [(title, what it asks and looks like)], note
BOSSES = [
    ("greatEngine", "The Great Engine", "One machine now: a furnace head on a cog and two jointed arms, a hammer and a claw.",
     "You wanted an arm segment between head and hands, and said the spin did not look good at all.",
     [("Hammer Fall", "The hammer climbs up the screen and drops. Scatter, then pile on it while it's stuck."),
      ("Claw Grab", "The claw shoots out on its pistons and hauls a hero to the furnace mouth. Hit the claw to free them."),
      ("Whirl", "Replaces the spin: arms locked straight out, the whole body turning like a rotor, then dizzy. Run."),
      ("Furnace Beam", "A white-hot sweep. Get behind a boiler."),
      ("Pressure", "Break the valve before the gauge hits red, or the boiler blows."),
      ("Welder drones", "A broken hand is forged back by two drones, not a timer. Kill them.")],
     "Its steam uses the game's round dust puffs, which look bubbly up close."),
    ("sandWurm", "The Sand Wurm", "Built again round the burrow: it lives under the sand and can only be hit out of it.",
     "You said: just no.",
     [("Under", "A mound runs across the room with crust tipping off its front and a furrow behind."),
      ("Breach", "The ground lifts, sand jets, and it arcs out of one hole into another. Get off the ground, then hit the body as it pours past."),
      ("Lunge", "Reared up, it strikes down a line. Sidestep, then hit the stuck head."),
      ("Inhale", "It pulls everyone to its maw, then the jaws snap. Run against the pull."),
      ("Quicksand", "From its second stage the holes stay as quicksand and scarabs crawl out."),
      ("The Coil", "Last stage: the mound circles the party and the ring bursts. Stand in the middle.")],
     "It wakes as the party walks in; walking up to a sleeping mound was 25 seconds of nothing."),
    ("cinder", "Cinder, the Old Drake", "An animal that walks: four stepping legs, a body that follows its head, a prowl round its mark.",
     "You said it was stuck in one spot, and didn't like the art or the look of its attacks.",
     [("Bite", "Keep off its mouth."),
      ("Scorch", "The game's own fire down a slowly turning cone. Get behind a pillar."),
      ("Tail Sweep", "Don't stand behind it, or break the blade off its tail."),
      ("Rush", "Get out of the lane; a pillar dazes it."),
      ("Fire Call", "A fireball on each hero. Split up."),
      ("Ring of Fire", "It runs a full circle round the party laying flame, then scorches into the pen."),
      ("Molten", "Last stage: fire drips where it walks.")],
     "The scorch is a dense carpet of flames; fewer, bigger tongues might read better on a phone."),
    ("gildedSeraph", "The angel", "The Spire's boss is the biblical angel you picked: one eye, wheels turning against each other, six wings.",
     "You asked for a biblically accurate angel, a horns ability, and four chains from the corners.",
     [("Chains", "One chain from each of the four corners at a hero. Whoever it hits is dragged to that corner and shackled a moment."),
      ("Trumpets", "My reading of horns: four horns in a cross with a climbing note. Break the one aimed at you; break all four and it reels."),
      ("Wheel Within a Wheel", "The wheels leave it and drop as two eyed hoops. Step in, then out."),
      ("Smite", "A small circle."),
      ("Host", "Two singers halve what it takes. Kill them."),
      ("Gaze", "Last stage: a slowly turning cone of sight. Get out of it.")],
     "It is still named The Gilded Seraph in the game. Say if you want a new name, and if horns meant horns on its head."),
    ("winterQueen", "The Winter Queen", "Kept, with every move rebuilt so each asks something different and looks different.",
     "You said her abilities were very similar and the clones should look different.",
     [("Icicle Fan", "Real crystals; pillars stop them."),
      ("Frost Nova", "Then she blinks away. Get off her."),
      ("Ice Wall", "With freezing mist on the cut-off side. Walk round."),
      ("Lattice", "Beams between her and two ice mirrors. Break a mirror to break its lines."),
      ("Blizzard", "Only a circle round her is calm. Close in."),
      ("Her images", "Slabs of ice with her shape caught in them, not second queens.")],
     ""),
    ("chieftain", "The Goblin Chieftain", "A two-minute fight: half the health, harder blows, six moves that each ask something else.",
     "You said samey, two minutes, more damage and less health.",
     [("Twin Chop", "Keep out of his face."),
      ("Charge", "The bonfires stop and daze him."),
      ("Thrown Axe", "Step off the ring."),
      ("War Drums", "Break them."),
      ("Dynamite mice", "Get away."),
      ("Whirlwind", "Last stage: run, then he is dizzy.")],
     "Wins take about 112 seconds (they took 218). The spear and the bomb barrage are gone."),
    ("greatOoze", "The Great Ooze", "No tentacles, drawn in the slime you picked, a smaller shadow, and about an even fight now.",
     "You said the shadow was too big, no tentacles, too easy, and to look at its ability pool.",
     [("Hop Slam", "Get out from under it."),
      ("Roll", "The whole zig-zag shows on the floor first. Read the bounce."),
      ("Heave", "Get off it."),
      ("Brood", "Kill the slimes before they crawl home and heal it."),
      ("Split and Slap", "Fight two halves, then keep out from between them."),
      ("Meltdown", "Last stage: its landings leave gas.")],
     "The plainest of the seven: its room is unchanged and the split could use a more visible tear."),
]
cards = []
for bid, title, text, words, moves, note in BOSSES:
    v = vids(bid)
    parts = [{"id": f"m{i}", "title": t[:26], "text": d} for i, (t, d) in enumerate(moves)]
    for i, p in enumerate(parts):  # a clip a stage, shared out over the moves in order
        if v: p["videos"] = [v[min(len(v) - 1, i * len(v) // len(parts))]]
    cards.append({"id": bid, "kind": "report", "rarity": "rare", "title": title[:26], "text": text[:110],
                  "why": words + " Each move is a part: mark the ones that are still weak.",
                  "videos": v[:2], "details": ("One clip a stage of the fight, in order. " + note).strip(), "parts": parts})
cards.insert(0, {"id": "all", "kind": "report", "rarity": "epic", "title": "Seven bosses, redone", "text": "Every boss you sent back is rebuilt. Live as 0.18.0. Each has its own card after this one.",
                 "why": "Your boss answers, built on the stronger model this time. I watched them before sending: the fights read, and each move asks for something different.",
                 "details": "How hard: in 100 test fights each, at the level the campaign meets them, the party wins 44 to 56. Those levels are from before the XP change, so I will re-measure after a fresh campaign.\n\nStill to do: no sounds for the new moves. The Bone King and the Elder Ent still flash fully white when struck; the seven here only blink.",
                 "videos": [vid("greatEngine-p1"), vid("sandWurm-p1")]})
deck = {"title": "0.18.0: the bosses, redone", "topic": "runs", "order": 29, "priority": 1, "tags": ["first"], "cards": cards}
(HERE / "decks" / "v18-bosses.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(cards))
