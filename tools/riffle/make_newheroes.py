"""Write decks/v21-newheroes.json: 0.21.0, the six new heroes and Shackled. One card a hero, built from
docs/HEROES-r15.md (each of the designer's lines with what was built) and the clips in clips/r15/heroes/."""
import json, pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CLIPS = ROOT / "clips" / "r15" / "heroes"
vid = lambda n: f"../../../clips/r15/heroes/{n}.mp4"
has = lambda n: (CLIPS / f"{n}.mp4").exists()
doc = (ROOT / "docs" / "HEROES-r15.md").read_text(encoding="utf-8")
body = doc.split("## The heroes", 1)[1].split("## The numbers", 1)[0]
blocks = re.split(r"\n### ", body)[1:]

def clean(s):
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"Clips?: [^.]*\.", "", s)
    s = s.replace("(`whirl()` in kits2.js: ", "(")
    s = re.sub(r"\(`[^`)]*`\)", "", s)                     # (`pileOn`)
    s = re.sub(r"\(`[^)]*\)", "", s)                       # (`mob.js MOB.armour`), (`a`, `b`, `c`)
    s = re.sub(r"Checked in `[^`]*`: ", "Checked: ", s)
    s = re.sub(r"`([^`]*)`", lambda m: m.group(1), s).replace("**", "")
    s = s.replace(" -> ", " Built: ")
    s = s.replace("hold it down by", "pin it by")
    return re.sub(r"\s+", " ", s).replace(" :", ":").replace(" .", ".").strip(" ;")

def bullets(block):
    out, cur = [], None
    for line in block.splitlines()[1:]:
        m = re.match(r"^- (.*)", line)
        if m: cur = [m.group(1)]; out.append(cur)
        elif cur is not None and line.strip(): cur.append(line.strip())
    return [" ".join(b) for b in out]

PITCH = {
    "mob": ("Four peasants who are one hero: one health pool, one card, four small bodies that stick together.",
            "Keep them as built: Pile On, Surround, Scatter, and Strength in Numbers."),
    "clockwork": ("The clockwork hero is the Clockmaker, a support who rewinds friends, slows a patch of the room and stops the clock.",
                  "Keep him as built: Rewind, Slow Time, Stop the Clock, and Spare Second."),
    "airMage": ("A caster built on Whirled: she shoves enemies along a lane, lifts them, and pulls them in.",
                "Keep her as built: Gale, Updraft, Cyclone, and Eye of the Storm."),
    "warden": ("A tank with a chain. He shackles, silences and strips buffs, and carries the new Shackled status.",
               "Keep him as built: Manacles, Nullify, Chain Gang, and Ball and Chain."),
    "telekinetic": ("A caster who throws the room's own boulders, lifts enemies and catches shots in a dome.",
                    "Keep her as built: Hurl, Levitate, Mind Shield, and Poltergeist."),
    "earthMage": ("A caster with one ability for each thing you named: earthquake, a chain of spikes, a stone wall.",
                  "Keep her as built: Earthquake, Spike Chain, Stone Wall, and Aftershock."),
}
QUOTED = {"Is 4 peasants": "Four who are one", "Each is like 30%": "30% each", "Torch, pitchfork": "What each carries",
          "They are strongly": "Drawn to each other", "All melee": "All melee", "They share 1": "One health pool"}
cards = []
for block in blocks:
    head = block.splitlines()[0].strip()
    name = head.split(" (`")[0].strip()
    hid = re.search(r"\(`(\w+)`", head).group(1)
    parts, rest = [], []
    for b in bullets(block):
        names = [n for n in re.findall(r"\b((?:%s|timeBubble|shackled)-[A-Za-z0-9-]+)" % hid, " ".join(re.findall(r"Clips?: [^.]*\.", b))) if has(n)]
        bold = re.match(r"^(?:Trait |Attack )?\*\*([^*]+)\*\*", b)
        quote = re.match(r'^"([^"]+)"', b)
        if b.startswith("Trait **"): title = "Trait: " + bold.group(1)
        elif b.startswith("Attack **"): title = "Attack: " + bold.group(1)
        elif b.startswith("**Armour"): title = "Enemy armour: my call"
        elif bold: title = bold.group(1).rstrip(":,")
        elif quote: title = next((t for k, t in QUOTED.items() if quote.group(1).startswith(k)), "Your words")
        else: title = clean(b)[:24]
        text = clean(b)
        if not names and not bold and not quote: rest.append(text); continue
        p = {"id": re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:24] or f"p{len(parts)}", "title": title[:26], "text": text[:700]}
        if names: p["videos"] = [vid(n) for n in names]
        parts.append(p)
    seen = set()
    for p in parts:                                        # ids must be unique on a card
        while p["id"] in seen: p["id"] += "x"
        seen.add(p["id"])
    text, pick = PITCH[hid]
    first = [v for p in parts for v in p.get("videos", [])]
    cards.append({"id": hid, "kind": "design", "rarity": "rare", "title": name[:26], "text": text[:110],
                  "why": "Your line, built as a full kit on stand-in art. Each move is a part with a clip.",
                  "pick": pick, "videos": first[1:3] or first[:2], "parts": parts,
                  **({"details": "\n\n".join(rest)[:1800]} if rest else {})})

shack = [(n, lab, t) for n, lab, t in [
    ("shackled-1-irons", "1 Irons", "Irons close on its wrists blow by blow, then lock."),
    ("shackled-2-wound", "2 Wound", "A chain winds round its body."),
    ("shackled-3-staked", "3 Staked", "A chain runs from it to a stake in the floor.")] if has(n)]
board = {"id": "shackled", "kind": "board", "rarity": "uncommon", "title": "Shackled: pick a look",
         "text": "Your status: no basic attacks, and every ability cooldown set back by half. The Warden builds it.",
         "why": "Three looks for it. Tick one, or none and say what's off. The first is in the game until you pick.",
         "pick": [shack[0][0]], "items": [{"id": n, "label": lab, "video": vid(n), "text": t} for n, lab, t in shack],
         "details": "It builds up like the other statuses; the Warden's chain adds 28 a blow. When it bursts: 4 seconds of no basic attacks, and each cooldown is set back once by half its own length, never past one full cooldown.\n\nMy addition, say if you'd rather not: while it builds, the target's cooldowns already run up to 50% slower.\n\nBosses: 40% of the time, a quarter of a cooldown, and 12 seconds before it can build again. A few enemies that keep a private clock (the Bone King's phases, some turrets) aren't reached by it yet."}

intro = {"id": "all", "kind": "report", "rarity": "epic", "title": "Six new heroes",
         "text": "The Mob, the Clockmaker, the Air Mage, the Warden, the Telekinetic and the Earth Mage. Live as 0.21.0.",
         "why": "The six heroes from your deck notes, each a full kit with previews and a trait scene. They wear recoloured stand-ins until you pick from the art deck.",
         "details": "Each kit was held to your past notes: three abilities that do three different jobs, every effect drawn and none shown as a word, every ability measured by switching it off. None of the eighteen measured as a loss.\n\nNot measured: how they do in battle mode and on the wagon (they only ran without errors), and with trinkets.\n\nFive tier steps look the same on the Book's stage as the tier below (the difference is a number): Rewind I to II and II to III, Slow Time I to II, Stop the Clock II to III, Gale I to II, Nullify I to II.",
         "parts": [
             {"id": "strength", "title": "How strong they are", "text": "Against the average hero, in rooms cleared per run. Earth Mage: strong at tier I. Clockmaker and Air Mage: fair. Warden: fair, a little low on damage at tier I. Telekinetic: the strongest caster at tier III (Hurl). The Mob: weak at both tiers after three raises."},
             {"id": "mob30", "title": "The Mob and “30% each”", "text": "At 30% each the Mob was the weakest hero in the game: four small bodies each lose time finding a place to stand. Their blows are at 35% each now and it is still on the weak side. Say if you want it lifted further past your number."},
             {"id": "mobarea", "title": "The Mob: area hits", "text": "One blow that catches several bodies lands in full on the first and 30% on each more (all four: 190%, not 400%). Without a rule every slam in the game would hit this hero four times. A heal that reaches several counts once."},
             {"id": "mobarmour", "title": "The Mob: enemy armour", "text": "Armour takes its points off every blow, so it would come off the Mob four times. Against one of its bodies armour counts 35%."},
             {"id": "name", "title": "The Clockmaker's name", "text": "My pick for the clockwork hero's name. Say if you want another."},
             {"id": "weak", "title": "Weakest abilities", "text": "The Warden's Nullify adds nothing to rooms cleared at tier I, though it spares the party the most damage of the eighteen. His Chain Gang is inside the noise at both tiers."},
         ],
         "videos": [vid("mob-surround"), vid("clockwork-stopClock")]}
deck = {"title": "0.21.0: six new heroes", "topic": "art", "order": 38, "priority": 1, "tags": ["first"], "cards": [intro] + cards + [board]}
(HERE / "decks" / "v21-newheroes.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(deck["cards"]), "parts", [len(c.get("parts", [])) for c in cards], "clips used", sum(len(p.get("videos", [])) for c in cards for p in c["parts"]), "of", len(list(CLIPS.glob("*.mp4"))))
