"""Write decks/v19-heroes.json: 0.19.0, the 37 newer heroes against the showcase 3 notes. One card a hero, built from
docs/HEROES-r13.md (each note quoted with what was built) and the clips in clips/showcase5/."""
import json, pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CLIPS = ROOT / "clips" / "showcase5"
vid = lambda n: f"../../../clips/showcase5/{n}.mp4"
doc = (ROOT / "docs" / "HEROES-r13.md").read_text(encoding="utf-8")
body = doc.split("## The heroes", 1)[1]
blocks = re.split(r"\n### ", body)[1:]

def clean(s):
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\((?:ids?|in) [^)]*\)", "", s)           # (id lastStand), (ids kept ...)
    s = re.sub(r"\([a-zA-Z]+'s slot\)", "", s)
    s = re.sub(r"\((?:fxkit|kits2?|render|parts|fx2?|sim)[^)]*\)", "", s)
    s = re.sub(r"style\.\w+(?: \([^)]*\))?:?", "", s)
    s = re.sub(r"weapon '\w+':", "", s)
    s = re.sub(r"Clips?: [A-Za-z0-9, \-]+\.?", "", s)
    s = re.sub(r"`([^`]*)`", r"\1", s).replace("**", "")
    s = s.replace(" -> ", " Built: ").replace("->", "Built:")
    return re.sub(r"\s+", " ", s).strip(" ;")

def bullets(block):
    out, cur = [], None
    for line in block.splitlines()[1:]:
        m = re.match(r"^(\s*)- (.*)", line)
        if m:
            cur = [m.group(2)]; out.append(cur)
        elif cur is not None and line.strip():
            cur.append(line.strip())
    return [" ".join(b) for b in out]

cards = []
for block in blocks:
    head = block.splitlines()[0].strip()
    redo = "(REDO)" in head
    name = re.sub(r"\((REDO|IDK)\)", "", head).strip()
    bl = bullets(block)
    named = re.findall(r"Clips?: ([A-Za-z0-9, \-]+)", block)
    ids = [c.strip(" .") for grp in named for c in re.split(r",| and ", grp) if c.strip(" .")]
    hid = ids[0].split("-")[0] if ids else None
    if not hid:
        pre = {p.stem.split("-")[0] for p in CLIPS.glob("*.mp4")}
        hid = next((x for x in pre if x.lower() in name.lower().replace(" ", "") or name.lower().split()[-1] == x.lower()), None)
    if not hid:
        continue
    files = sorted(p.stem for p in CLIPS.glob(f"{hid}-*.mp4"))
    items, used = [], set()
    order = lambda f: ({"attack": 2, "trait": 1}.get(f.split("-", 1)[1], 0), f)
    for f in sorted(files, key=order):
        ab = f.split("-", 1)[1]
        src = next((b for b in bl if re.search(r"Clip: " + re.escape(f) + r"\b", b)), None)
        if src is None and ab not in ("trait", "attack"):
            words = re.sub("([a-z])([A-Z])", lambda m: m.group(1) + " " + m.group(2), ab).lower()
            src = next((b for b in bl if id(b) not in used and b.lower().startswith(words)), None) or next((b for b in bl if id(b) not in used and words in b.lower()), None)
        if src is None and ab == "trait":
            src = next((b for b in bl if b.lower().startswith("trait") or "Trait **" in b or "trait" in b.lower()[:60]), None)
        if src is None and ab == "attack":
            src = next((b for b in bl if id(b) not in used and re.match(r"^[A-Z][A-Za-z' ]+ ?(\(attack\))?:", b)), None)
        if src: used.add(id(src))
        spaced = re.sub("([a-z])([A-Z])", lambda m: m.group(1) + " " + m.group(2), ab).title()
        lead = re.match(r"^([A-Z][A-Za-z' -]{2,24}):", src or "")
        after = (src or "").split("->", 1)[-1].strip()
        B = r"^(?:Trait )?\*\*([^*]+)\*\*"
        bold = re.match(B, after) or re.match(B, src or "")
        anyb = re.search(r"\*\*([^*]+)\*\*", src or "")
        if ab == "trait": label = "Trait: " + (bold or anyb).group(1) if (bold or anyb) else "Trait"
        elif bold: label = bold.group(1)
        elif lead: label = lead.group(1)
        else: label = {"attack": "Attack"}.get(ab, spaced)
        items.append({"id": f, "label": label[:36], "video": vid(f), "text": (clean(src) if src else "Changed with the rest of the kit; see the clip.")[:480]})
    items.sort(key=lambda i: ({"attack": 0, "trait": 2}.get(i["id"].split("-", 1)[1], 1), i["id"]))
    rest = [clean(b) for b in bl if id(b) not in used and "Clip" not in b]
    details = "\n\n".join(r for r in rest if r)[:1800]
    text = ("Redone: a new kit, built from your notes." if redo else "Your notes, built. Each clip says what changed.")
    why = "Tick the ones that are right now; comment on any that aren't. What you ticked last time with no note is untouched."
    if len(items) >= 2:
        c = {"id": hid, "kind": "board", "rarity": "rare" if redo else "common", "title": name[:26], "text": text, "why": why, "pick": [i["id"] for i in items], "items": items}
    else:
        c = {"id": hid, "kind": "report", "rarity": "common", "title": name[:26], "text": (items[0]["text"] if items else text)[:110], "why": why, "videos": [i["video"] for i in items]}
        if items: details = (items[0]["text"] + "\n\n" + details).strip()
    if details: c["details"] = details
    cards.append(c)

intro = {"id": "all", "kind": "report", "rarity": "epic", "title": "37 newer heroes, your notes", "text": "Every showcase 3 note is built: three heroes redone, 20 new traits, eight new statuses. Live as 0.19.0.",
         "why": "One card a hero follows, with a clip for each thing that changed. This card is the summary and the things I want your call on.",
         "details": "Redone from scratch: the Bandit (he takes things off enemies), the Beekeeper (bees that stay and pester), the Quartermaster (no potions; supplies and a barricade).\n\nRoles changed: the Valkyrie is a support now; the Chef, the Trapper and the Engineer fight at range.\n\nBalance, measured at tier I and III: tanks deal 23-24% of a party's damage, shooters 41-42%, supports 18-20%. Still strong: the Beekeeper, the Chef, the Valkyrie and the Shaman at tier I (healers again), the Pirate at tier III. Weakest: the Seer at tier I, the Griffon at tier III.",
         "parts": [
             {"id": "statuses", "title": "New statuses", "text": "Whirled, Dirty, Targeted, Tracked, Trapped and Weakened as you described them. The Monk's turning effect I named Spun. For the Alchemist's protection status my answer is Warded: a pale blue border."},
             {"id": "shackled", "title": "Shackled: not yet", "text": "You said it should go to someone else, maybe the executioner. It waits for that hero."},
             {"id": "bulwark", "title": "Bulwark: a question", "text": "Hybrid damage tank is built as Return Thrust (blows he takes wind up a piercing thrust). Brace, Shield Wall and Impale are unchanged: say if hybrid should reach those too."},
             {"id": "props", "title": "Props drawn in code", "text": "The new summons and props (totem, cauldron, pavise, beehive, barricade, turrets) are plain shapes for now, and a few weapons need to be separate parts. They are on the art list."},
             {"id": "six", "title": "Six new heroes: not built", "text": "The six new heroes from your deck notes (the Warden and the others) are not built yet."},
         ]}
deck = {"title": "0.19.0: the 37 newer heroes", "topic": "art", "order": 32, "priority": 2, "cards": [intro] + cards}
(HERE / "decks" / "v19-heroes.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("cards", len(cards) + 1, "items", sum(len(c.get("items", [])) for c in cards), "unmatched", sum(1 for c in cards for i in c.get("items", []) if i["text"].startswith("Changed with")))
