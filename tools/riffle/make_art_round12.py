"""Write decks/art-round12.json: art round 12 (design/class-round12). One board card per new hero (the Mob, the Clockwork
hero, the Air mage, the Warden, the Telekinetic, the Earth mage): its three takes, the writer's pick first, then two
tiles that are not choices (all three side by side; each take in a row with five approved heroes). Then two reports in
parts: the summons and props the game draws in code today, a part per hero; and the heroes' new weapon hands. Nothing in
the game changes until a pick: the game keeps its stand-ins, and the props are files no kind points at yet."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent
R = HERE.parents[1] / "design" / "class-round12"
rel = lambda stem, folder="heroes": f"../../../design/class-round12/{folder}/renders/{stem}.png"


def exists(stem, folder="heroes"):
    return (R / folder / "renders" / f"{stem}.png").exists()


def hero(cid, title, text, why, takes):
    """takes: (take id, label, what it is); the first is the pick."""
    items = []
    for t, label, what in takes:
        stem = f"{cid}-{t}"
        assert exists(stem) and exists(stem + "-thumb"), stem
        items.append({"id": stem, "label": label[:36], "image": rel(stem), "thumb": rel(stem + "-thumb"), "text": what})
    assert exists(cid) and exists(cid + "-lineup"), cid
    items.append({"id": cid + "-all", "label": "All three, side by side", "image": rel(cid), "thumb": rel(cid + "-thumb"),
                  "text": "Not one to pick: the three takes together at game scale beside the archer, and at game size in four facings."})
    items.append({"id": cid + "-lineup", "label": "In a row with five heroes", "image": rel(cid + "-lineup"),
                  "text": "Not one to pick: each take standing third in a row of six with five heroes you approved, big and at game size."})
    assert len(items) >= 2
    assert len(why) <= 300, (cid, len(why))
    return {"id": cid, "kind": "board", "rarity": "rare", "title": title[:26], "text": text[:110], "why": why,
            "pick": [items[0]["id"]], "items": items}


def parts(cid, title, text, why, rows):
    """rows: (board id under boards/renders, part title, text)."""
    ps = []
    for b, ptitle, ptext in rows:
        assert exists("with-" + b, "boards"), b
        assert len(ptitle) < 40, ptitle
        ps.append({"id": b, "title": ptitle, "text": ptext, "images": [rel("with-" + b, "boards")]})
    return {"id": cid, "kind": "report", "rarity": "uncommon", "title": title[:26], "text": text[:110], "why": why,
            "images": [ps[0]["images"][0]], "parts": ps}


KEEP = " The game keeps its stand-in until you pick."
cards = [
    hero("mob", "The Mob: four peasants", "Torch, pitchfork, axe, dagger: four small peasants, one hero. Three sets. Mine: the village.",
         "You wrote: \"Mob. Is 4 peasants... Torch, pitchfork, axe, and dagger.\" Each is about 60% of a hero, with the heroes' line weight. I'd take the village: four colours and four head shapes, so they stay four people at game size." + KEEP,
         [("village", "A the village", "A red kerchief (torch), a slouched felt hat (pitchfork), a bald woodcutter with a black beard (axe), an ochre pointed hood (dagger)."),
          ("kitchen", "B the kitchen militia", "The same sackcloth on all four; a colander, a bucket, a cooking pot and a funnel for helmets."),
          ("family", "C one family", "Grandmother, father, big son and child, four sizes. The child is very small on a phone.")]),
    hero("clockwork", "The Clockwork hero", "\"Influence time.\" Three takes. Mine: the chronomancer with a pocket watch for a hat.",
         "A white dial with two hands is the one clock sign that still reads at game size, so I'd take the watch. The wind-up man's key can turn in the game. Father Time is the weakest: at game size he is an old wizard." + KEEP,
         [("watch", "A the pocket-watch hat", "A chronomancer: a great brass pocket watch worn as a hat, a pendulum staff, a cog turning over the free hand."),
          ("windup", "B the wind-up man", "A brass man whose face is a clock (twenty past eight makes a moustache), a key in his back, a clock hand for a sword."),
          ("sands", "C Father Time", "A hood, a long white beard, a clock-hand staff, an hourglass hanging from the left fist.")]),
    hero("airMage", "The Air mage", "\"Whirled effect.\" Three takes. Mine: the white hood drawn up into a curl of wind.",
         "The curl and the spiral are the whirl, and it sits in the mages' family beside Storm and Frost. The fans would work both hands in turn. The one blown sideways is the weakest: the hair reads as a head wrap." + KEEP,
         [("swirl", "A the curl of wind", "A white hood with a spiral on it and a curled tip, a scarf streaming back, a curled staff, a whirlwind over the free hand."),
          ("fans", "B the spiral hat and fans", "A wide round hat painted with one spiral, a paper fan in each hand."),
          ("gale", "C blown sideways", "No hat: white hair and a scarf blown hard to one side, a pinwheel for a staff.")]),
    hero("warden", "The Warden", "Shackles, restraints, nullification. Three takes. Mine: the helm made like a padlock.",
         "The padlock is a shape nobody else has, and its pale keyhole can carry the nullifying glow. It has no face, like the Tower. The gaoler keeps a face, behind bars. The witch-finder is the weakest: its hat sits near the Witch's." + KEEP,
         [("lock", "A the padlock helm", "A closed helm made like a padlock, a glowing keyhole, the shackle arching over the back, a shackle on a chain in each fist."),
          ("gaoler", "B the gaoler and his key", "A pot helm with a cage of bars over the face, a great key held like a mace, a shackle in the left hand."),
          ("binder", "C the witch-finder", "A black hat with a padlock buckle, chains over the shoulders to a padlock under the chin, a man-catcher fork.")]),
    hero("telekinetic", "The Telekinetic", "Three takes. Mine: fists at the temples, two swords hanging in the air with no hand on them.",
         "The swords with no hands on them say what the hero does, and they are the two arm parts, so the game can swing them. The turban's three stones can circle. The blindfold's floating braid is the weakest read." + KEEP,
         [("blades", "A swords that hang in the air", "An indigo hood with an eye gem, both fists at the temples, a sword floating in front of each shoulder, a ring of force round each grip."),
          ("orbit", "B the turban and the stones", "A white turban with a violet gem, both hands open, three stones hanging in the air behind."),
          ("boulder", "C blindfold, braid, boulder", "An indigo blindfold, a silver braid floating up behind, a boulder hanging before the open right hand.")]),
    hero("earthMage", "The Earth mage", "Quakes, chains of spikes, stone walls. Three takes. Mine: the stone-shaper with rock fists.",
         "The rock fists have the strongest outline of all the takes, and pounding the ground is the earthquake. The ring of spikes is the spike spell worn on the back. The stone hood is the weakest: the Frost mage's build in brown." + KEEP,
         [("fists", "A the rock fists", "A boulder for a cap (moss, amber crystals), a russet beard in two braids, each fist in a great glove of rock."),
          ("spikes", "B the ring of spikes", "A ring of rock spikes round the back of the shoulders, a bun with a stone pin, a carved standing stone for a staff."),
          ("slab", "C the stone hood", "A brown hood with a keystone and an amber gem, columns of rock off the shoulders, a boulder staff.")]),
    parts("props", "Summons and props, drawn", "The things the game draws in code today, as art: each hero with its own beside it, at game scale.",
          "One design each, in the props' style, with the heroes' line weight at their size in the game. None is in the game yet: mark any part that is off and I'll redo it before it goes in.",
          [("haymaker", "Haymaker: the hay bale", "A rolled bale with two bands of twine."),
           ("shaman", "Shaman: totem and spirits", "A carved, painted pole like the one on his back; the bear, eagle and beaver in one pale blue style with a swirl on each back."),
           ("alchemist", "Alchemist: the cauldron", "A black iron pot, green brew to the brim."),
           ("warlock", "Warlock: imp and demon form", "His own imp in his colours, and his demon form as its own bust with the great sword."),
           ("beekeeper", "Beekeeper: the hive", "A straw skep on a round board."),
           ("quartermaster", "Quartermaster: crate, barricade", "A roped crate with the red cross; a wall of pointed planks, and the same with spikes."),
           ("crossbowman", "Crossbowman: the pavise", "A tall shield in his red and yellow on its prop."),
           ("grenadier", "Grenadier: the big bomb", "His bomb, large, with a brass collar and a lit fuse."),
           ("engineer", "Engineer: towers and drones", "The torcher, the tesla tower, the snowball mortar and the medbay on one kind of round wooden deck; the med drone and the wind-up drone.")]),
    parts("hands", "Six heroes' weapon hands", "Your notes on how they hold things, drawn: each hero as it is now, then the new one. Not in the game yet.",
          "Each changes only the hand and what it holds. Mark any part that is off.",
          [("bearskin", "Bearskin: paws on his hands", "You wrote: \"The bear paws of his outfit should be on his hands. Move with it. I didn't like this club.\" The paws ride on the arms now; a new club, a gnarled root, is its own part so it can go away when he claws."),
           ("warhelm", "Warhelm: the hammer by itself", "The hammer is its own part, so it can leave his hand and float while both fists punch. At rest nothing looks different."),
           ("bulwark", "Bulwark: further from the tip", "You wrote: \"Holding spear too close to tip.\" The same spear, slid forward through the fist."),
           ("valkyrie", "Valkyrie: holding the spear", "You wrote: \"Hold spear better.\" The same spear, held at the shaft across the front, the fist in plain sight."),
           ("samurai", "Samurai: both hands", "You wrote: \"Should hold with 2 hands in front of him.\" The same katana, across the front in both fists."),
           ("trapper", "Trapper: shotgun, trap on hip", "You wrote: \"I want them to have a shotgun. Should hold with 2 hands. Trap sits on their back hip.\" A double-barrelled shotgun in both fists; the trap behind the left shoulder.")]),
]
for c in cards:
    assert len(c["title"]) <= 26 and len(c["text"]) <= 110, (c["id"], len(c["title"]), len(c["text"]))
    for it in c.get("items", []):
        assert len(it["label"]) <= 36, it["label"]
deck = {"title": "Art round 12: six new heroes", "topic": "art", "order": 37, "priority": 2, "cards": cards}
(HERE / "decks").mkdir(exist_ok=True)
(HERE / "decks" / "art-round12.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(cards), "boards", sum(1 for c in cards if c["kind"] == "board"), "tiles", sum(len(c.get("items", [])) for c in cards),
      "parts", sum(len(c.get("parts", [])) for c in cards))
