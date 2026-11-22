"""Write decks/v17-heroes.json: 0.17.0. The XP catch-up, the first 15 heroes' showcase 4 notes (clips/showcase6/), the
four variant sets to pick from, and what the ability balance pass found."""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent
CLIPS = HERE.parents[1] / "clips" / "showcase6"
vid = lambda n: f"../../../clips/showcase6/{n}.mp4"
has = lambda n: (CLIPS / f"{n}.mp4").exists()

cards = [{
    "id": "xp", "kind": "report", "rarity": "epic", "title": "XP: catching up",
    "text": "A low hero carried through a late dungeon now levels by the handful. Live as 0.17.0.",
    "why": "You asked how XP is shared and described how it should work. This is that, with one thing I left out; say if you want it anyway.",
    "details": "How it was: every living hero got the same XP for a kill, the downed got none, and a late dungeon paid only about twice the first. A new hero needed nearly as many runs as the first party had.\n\nNow: each level costs 10% more than the last, and a kill pays by the dungeon's level on the same curve. Everyone in the party gets the same amount. So a level 1 hero in a late dungeon gains several levels a run, and a level 40 party in the Wildwood barely moves, with no special rule for who is behind.\n\nTest: three level 33 heroes carrying a level 1 Archer through the Crypt. She was level 8, 15, 18, 24, 27, 29, 30 and 31 after runs one to eight; the carriers went from 33 to 39.\n\nFour test campaigns from a fresh save, with wipes costing 75%: all nine dungeons fall in every one, the Foundry between run 102 and 134.",
    "parts": [
        {"id": "downed", "title": "The downed get XP too", "text": "A level 1 hero falls in a late dungeon's first room. If the downed got nothing, being carried would teach it nothing."},
        {"id": "blow", "title": "No killing-blow bonus", "text": "You wondered about more XP for the killing blow. I left it out: the Archer would pull levels ahead of the Paladin and the Cleric in the same party, which is the falling behind this fixes."},
        {"id": "gold", "title": "A thing I saw: gold after wipes", "text": "In one test a three-hero party took 62 runs on the Warren. With wipes costing 75% it banked about 40 gold a run and never afforded a fourth hero. The test never leaves early (which costs 20%); a player would."},
    ],
}]

SETS = [
    ("shockwave", "Shockwave: pick one", "Redone. Your first words were a repeating shockwave forwards: these travel, and hit what they pass once.",
     [("berserker-shockwave-v1-arcs", "1 Arcs", "A pale inked crescent running out and growing."),
      ("berserker-shockwave-v2-ripples", "2 Ripples", "The same front as soft dust under the units."),
      ("berserker-shockwave-v3-stomps", "3 Stomps", "No front drawn: three blows marching out.")], "berserker-shockwave-v1-arcs"),
    ("wolfbite", "Wolf bite: pick one", "Redone. The old ones were small marks on the wolf's own head. These are on the target, at its size.",
     [("druid-callWolf-v1-fangs", "1 Fangs", "Jaws with gums and canines snapping shut."),
      ("druid-callWolf-v2-crunch", "2 Crunch", "No teeth: a pinch and tooth holes."),
      ("druid-callWolf-v3-clamp", "3 Clamp", "Two curved fangs closing like pincers.")], "druid-callWolf-v1-fangs"),
    ("bonespear", "Bone Spear: pick one", "You asked for three variations.",
     [("necromancer-boneSpear-v1-spear", "1 Spear", "A shaft with a lashed leaf-shaped head."),
      ("necromancer-boneSpear-v2-femur", "2 Femur", "A thrown thigh bone."),
      ("necromancer-boneSpear-v3-fang", "3 Fang", "A great curved fang.")], "necromancer-boneSpear-v1-spear"),
    ("oldbones", "Old Bones: pick one", "Granny, redone. Nothing floats over her now; she has a bone-white edge for the second she can't be hurt.",
     [("granny-oldBones-v1-stand", "1 Stand", "A flash, dust and chips."),
      ("granny-oldBones-v2-creak", "2 Creak", "Comic crack marks."),
      ("granny-oldBones-v3-glance", "3 Glance", "The blow clangs off.")], "granny-oldBones-v1-stand"),
]
for cid, title, text, opts, pick in SETS:
    items = [{"id": n, "label": lab, "video": vid(n), "text": t} for n, lab, t in opts if has(n)]
    if len(items) >= 2:
        cards.append({"id": cid, "kind": "board", "rarity": "uncommon", "title": title[:26], "text": text[:110],
                      "why": "Tick the one to keep. The first is in the game until you pick.", "pick": [pick], "items": items})

FIXES = [
    ("archer-frostArrow", "Archer: Frost Arrow", "The string and arrow draw back through the charge. Snow along its path and where it bursts."),
    ("archer-barrage", "Archer: Barrage", "The same drawn bow. It now goes at a lone enemy too."),
    ("archer-roll", "Archer: Roll", "She makes a full turn as she goes, and the caltrops skid out along the floor."),
    ("berserker-attack", "Berserker: Flail", "No spike ball left on the ground."),
    ("berserker-whirl", "Berserker: Whirl", "White crescents and balls as you approved them; blows knock back the way the flail turns."),
    ("granny-reap", "Granny: Reap", "The crescent rides the scythe; her orbs burst clear of her face."),
    ("storm-chainLightning", "Storm: Chain Lightning", "The bolt, each leap and the overload arcs are one inked shape. No spark lines."),
    ("storm-stormCloud-tier1", "Storm: Zeus Bolt, tier I", "Hard knockback the way it flies, and a stronger strike."),
    ("storm-stormCloud", "Storm: Zeus Bolt, tier III", "The same at tier III."),
    ("cleric-attack", "Cleric: light orbs", "All three leave one point, 45 degrees apart. One that meets a friend heals it and stops."),
    ("cleric-sanctuary", "Cleric: Sanctuary", "The same ring with more light: it draws itself round and pulses with each mend."),
    ("necromancer-lifeDrain", "Necromancer: Life Drain", "The thin tendrils wait until the ribbon has landed."),
    ("tower-holdTheLine", "Tower: Hold the Line", "The red mark stays over each taunted enemy until the taunt ends."),
    ("wildmane-cleave", "Wildmane: Cleave", "The slash turns with the sword and starts at the blade's tip."),
    ("frost-iceShard", "Frost Mage: Ice Shard", "A trail of snow particles."),
    ("druid-entangle", "Druid: Entangle", "The same patch and vines, redrawn: tapered stems, curled tips, thorns, leaves."),
]
items = [{"id": n, "label": lab[:36], "video": vid(n), "text": t} for n, lab, t in FIXES if has(n)]
cards.append({"id": "fixes", "kind": "board", "rarity": "rare", "title": "Your showcase 4 notes", "text": "Each clip changed only where your note said.",
              "why": "Tick the ones that are right now; comment on any that aren't.", "pick": [i["id"] for i in items], "items": items})

cards.append({
    "id": "balance", "kind": "report", "rarity": "rare", "title": "Archer, Tower, the rest",
    "text": "Each ability was measured switched on and off. The Archer's abilities now carry half her damage.",
    "why": "You said the Archer's abilities should carry more of her damage and the Tower is weak beside the Paladin.",
    "details": "At tier III all fifteen first heroes are within about a room of each other. Tanks deal 23% of a party's damage, shooters 41%.\n\nStill weak: the Berserker at tier I (he goes down 2.5 times a run), Granny at tier I, the Pyromancer at tier III (cause not found), Twinfang (better, still behind). The Bard's songs, Hold the Line, Guard, Old Bones, Gas Form and Miasma show no measurable worth in the tests; they need another look.",
    "parts": [
        {"id": "archer", "title": "Archer", "text": "Abilities' share of her damage: 25% to 33% at tier I, 40% to 54% at tier III. Her bow is unchanged. Frost Arrow hits harder and its burst hurts; Barrage is used on a lone enemy too."},
        {"id": "tower", "title": "Tower against Paladin", "text": "The Tower is the health tank now: 310 health (was 180), less armour, Charge worth twice his blow. Bare, the Paladin still wins their duel; fully built, the Tower does. The Paladin is untouched."},
        {"id": "others", "title": "Others", "text": "Twinfang, Wildmane, Berserker and Granny have more health and harder abilities. The casters' big spells hit harder. Ice Wall is only raised against a brawler coming for her. Heals trimmed a little."},
        {"id": "reach", "title": "A call I made: reach", "text": "Cleave and Reap now reach only as far as the blade sweeps, so the look and the blow agree."},
    ],
})
deck = {"title": "0.17.0: XP, the first 15 heroes", "topic": "runs", "order": 27, "priority": 1, "tags": ["first"], "cards": cards}
(HERE / "decks" / "v17-heroes.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(cards))
