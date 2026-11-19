"""Write decks/art-round4.json: three boards (fixes, new heroes, enemies and props), one item per SVG in
design/class-round4, each item's text taken from the artist's notes.md for that file."""
import json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
R4 = HERE.parents[1] / "design" / "class-round4"

BOARDS = [
    ("fixes", "Your picks, fixed", "Every pick with your round-3 notes and the new hand rule.",
     ["knight", "barbarian", "rogue", "farmer", "skeleton"]),
    ("heroes", "40 new heroes", "Casters, support, ranged and fighters: ten each, all different.",
     ["heroes-casters", "heroes-support", "heroes-ranged", "heroes-fighters"]),
    ("enemies", "Enemies and props", "Redos, the new families, and the room props.",
     ["enemies", "monsters", "props"]),
]

def clean(s):
    s = re.sub(r"`([^`]*)`", r"\1", s)
    s = s.replace("**", "").replace("*", "")
    # notes are hard-wrapped: join everything, then break before the parts worth a paragraph of their own
    s = " ".join(l.strip().lstrip("- ").strip() for l in s.splitlines() if l.strip())
    s = re.sub(r"\s+(Suggested move|Move|Weak|Still weak|Note)( \([^)]*\))?:", r"\n\n\1\2:", s)
    # Riffle refuses words that read like a swipe direction ("throws up", "pushed down")
    s = re.sub(r"\b(throw\w*|push\w*|pull\w*|hold\w*|drag\w*|flick\w*)\s+(up|down|left|right)\b",
               lambda m: {"up": "upward", "down": "downward", "left": "leftward", "right": "rightward"}[m.group(2).lower()] + " " + m.group(1)
               if False else m.group(1) + " " + {"up": "upward", "down": "downward", "left": "leftward", "right": "rightward"}[m.group(2).lower()], s, flags=re.I)
    return re.sub(r"[ \t]+", " ", s).strip()

def notes_for(folder, fname):
    """The block of notes.md about this file: from the line naming it to the next line naming another .svg file."""
    p = R4 / folder / "notes.md"
    if not p.exists():
        return "", ""
    lines = p.read_text(encoding="utf-8").splitlines()
    start = next((i for i, l in enumerate(lines) if fname in l and (l.startswith("#") or l.lstrip().startswith("-"))), None)
    if start is None:
        start = next((i for i, l in enumerate(lines) if fname in l), None)
    if start is None:
        return "", ""
    head = lines[start]
    out = []
    for l in lines[start + 1:]:
        if l.startswith("#") or (re.search(r"[\w-]+\.svg", l) and fname not in l and (l.lstrip().startswith("- **`") or l.startswith("##"))):
            break
        out.append(l)
    label = re.sub(r"[#*`]", "", head.split(":")[0]).strip(" -") if head.startswith("#") else ""
    label = re.split(r"\s[—–(]|\s-\s", label)[0].strip()  # drop "— file.svg + ..." and "(file)" tails
    body = clean((head if not head.startswith("#") else "") + "\n" + "\n".join(out))
    return label, body

def nice(stem):
    return " ".join(w.capitalize() for w in stem.split("-")[1:] or [stem])

cards = []
for bid, title, text, folders in BOARDS:
    items = []
    for folder in folders:
        d = R4 / folder
        if not d.exists():
            continue
        for svg in sorted(d.glob("*.svg")):
            stem = svg.stem
            png = d / "renders" / f"{stem}.png"
            if not png.exists():
                print("no render:", folder, stem); continue
            label, body = notes_for(folder, svg.name)
            label = {"engineer-turret": "Engineer's turret", "tamer-beast": "Beast tamer's cub"}.get(stem) or (label or nice(stem))[:36]
            if len(body) > 900:
                body = body[:880].rsplit(" ", 1)[0] + "..."
            items.append({"id": stem, "label": label,
                          "image": f"../../../design/class-round4/{folder}/renders/{stem}.png",
                          "thumb": f"../../../design/class-round4/{folder}/renders/{stem}-thumb.png",
                          "text": body or "New this round."})
    if bid == "enemies":  # the prop artist's two true-scale context pictures
        for stem, label, text in [("scene", "Props in a room", "Every prop at true size on the floor, with four doors in the wall and the archer for scale."),
                                  ("door-glows", "All the door states", "Shut, open (the way in), and the glow for each kind of room behind a door.")]:
            if (R4 / "props" / "renders" / f"{stem}.png").exists():
                items.append({"id": "props-" + stem, "label": label, "image": f"../../../design/class-round4/props/renders/{stem}.png", "text": text})
    cards.append({
        "id": bid, "kind": "board", "rarity": "rare", "title": title, "text": text,
        "why": "Each tick becomes a unit (or the prop) in the game. Each picture shows it beside the archer at the same size, then 8 turns at game size.",
        "pick": [i["id"] for i in items],
        "details": "Each item's text is the artist's note: what you asked for or what it is, a suggested move (only a proposal), and what's still weak.",
        "items": items,
    })
    print(bid, len(items))

deck = {"title": "Art round 4: fixes, 40 heroes, monsters", "topic": "art", "order": 4, "priority": 1, "tags": ["first"], "cards": cards}
(HERE / "decks" / "art-round4.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
