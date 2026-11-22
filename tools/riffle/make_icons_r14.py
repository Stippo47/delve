"""Write decks/icons-r14.json: round 14's icon sample. The same 20 subjects (10 abilities, 4 trinkets, 6 stats) in
three styles, to pick one before the full set is drawn. Pictures come from design/icons-r14/renders
(node design/icons-r14/build.mjs, then node design/icons-r14/render.mjs)."""
import json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
REN = HERE.parents[1] / "design" / "icons-r14" / "renders"
rel = lambda stem: f"../../../design/icons-r14/renders/{stem}.png"

STYLES = [
    ("a", "A · Painted emblem", "The sprite style in a tile: the object itself, outlined and shaded. Rim = role or rarity."),
    ("b", "B · Bold glyph", "Two tones: one cream shape on a tile in the role colour. The clearest at the smallest size."),
    ("c", "C · Scene medallion", "A round window onto the ability happening. Backdrop = element, ring = role and timer."),
]
ABILITIES = [
    ("shieldBash", "Shield Bash", "Paladin. Today it shares the shield with nine other abilities."),
    ("barrage", "Barrage", "Archer. Three arrows loosed as a fan."),
    ("frostArrow", "Frost Arrow", "Archer. Today a plain snowflake, shared with Ice Shard and Frost Nova."),
    ("roll", "Roll", "Archer, the movement skill. Today the dash arrow, shared with eight others."),
    ("whirl", "Whirl", "Berserker. The flail going round. Today the same swirl as Cleave and Reap."),
    ("chainLightning", "Chain Lightning", "Storm Mage. Today all three of her abilities are the same bolt."),
    ("sanctuary", "Sanctuary", "Cleric, the heal. Today the same sun as Smite and Consecrate."),
    ("raiseDead", "Raise Dead", "Necromancer, a summon. Today the same skull as Bone Spear."),
    ("backstab", "Backstab", "Twinfang. Today the same dagger as Fan of Knives."),
    ("callWolf", "Call Wolf", "Druid, a summon. Today a paw."),
]
TRINKETS = [
    ("vampTooth", "Vampire Tooth", "Common. Today it is nearly the same picture as the Venom Fang."),
    ("hookChain", "Hook and Chain", "Rare. Today too thin to read at 18 px."),
    ("whirlingKnives", "Whirling Knives", "Epic. Today a busy tangle at 18 px."),
    ("phoenixFeather", "Phoenix Feather", "Legendary."),
]
STATS = [
    ("dmg", "Damage", "Your example: a sword beside the number."),
    ("hp", "Health", "A red heart (green stays the colour of healing)."),
    ("armor", "Armour", "A shield."),
    ("atkSpeed", "Attack speed", "A sword with speed streaks; yellow, so it never reads as Damage."),
    ("moveSpeed", "Move speed", "A boot with the same streaks."),
    ("range", "Range", "A drawn bow."),
]
# the lane's pick, and the icons it would redraw first in each style (left unticked on the boards)
PICK = "a"
WEAK = {"a": ["range", "atkSpeed"], "b": ["roll", "vampTooth"], "c": ["barrage", "chainLightning", "roll", "whirl", "range", "atkSpeed"]}

def need(stem):
    if not (REN / f"{stem}.png").exists():
        sys.exit(f"missing render: {stem}.png (run build.mjs and render.mjs first)")
    return rel(stem)

cards = [{
    "id": "style", "kind": "board", "rarity": "epic", "title": "Icons: pick a style",
    "text": "The same 20 icons drawn three ways. Pick the style; the full set of about 245 then follows in it.",
    "why": "My pick is A: it is the one that looks like the game's own sprites, every ability gets its own object, and it still "
           "reads on the hero card at 24 px. B is the clearest when tiny but plainer. C is the richest large and the muddiest small.",
    "pick": [PICK],
    "details": "Each sheet shows the ten abilities, four trinkets and six stats large, then ready, on cooldown and locked for two of "
               "them. The next three cards have every icon by itself, and the style at the size the game really shows it.\n\n"
               "Nothing in the game has changed: today's icons stay until you pick.",
    "items": [{"id": k, "label": label[:36], "image": need(f"sheet-{k}"), "thumb": need(f"thumb-{k}"), "text": text} for k, label, text in STYLES],
}]
for k, label, text in STYLES:
    items = [{"id": f"{k}-real", "label": "At real size on the phone", "image": need(f"mock-{k}"),
              "text": "The Archer's card in a fight beside today's, a stat row, ability rows at 40 px, trinkets at 36 px."}]
    for group in (ABILITIES, TRINKETS, STATS):
        for sid, name, what in group:
            items.append({"id": f"{k}-{sid}", "label": name[:36], "image": need(f"icon-{k}-{sid}"), "text": what})
    cards.append({
        "id": f"style-{k}", "kind": "board", "rarity": "rare", "title": f"Style {label}"[:26],
        "text": (text + " Tick what works; comment on any icon.")[:110],
        "why": "Each icon is its own item, large and at the sizes the game would show it. The ones I left unticked are the ones I "
               "would redraw first in this style.",
        "pick": [i["id"] for i in items if i["id"].split("-", 1)[1] not in WEAK[k]],
        "items": items,
    })
cards.append({
    "id": "stats", "kind": "board", "rarity": "rare", "title": "Stats beside a number",
    "text": "Your stat line (a sword and a number, and the rest) in each style, at 14 and 16 px.",
    "why": "The stats can follow a different style from the abilities. A is painted like the sprites; B is one flat colour per stat "
           "and the crispest at 14 px; C is a white mark on a coloured chip.",
    "pick": [f"stats-{PICK}"],
    "items": [{"id": f"stats-{k}", "label": label[:36], "image": need(f"stats-{k}"),
               "text": "Six of the nine hero stats; ability haste, healing and potency would follow."} for k, label, _ in STYLES],
})
for c in cards:
    assert len(c["title"]) <= 26 and len(c["text"]) <= 110, (c["id"], len(c["title"]), len(c["text"]))
    for i in c["items"]:
        assert len(i["label"]) <= 36 and len(i.get("text", "")) <= 110, (i["id"], len(i.get("text", "")))
deck = {"title": "Icons: pick a style", "topic": "art", "order": 29, "priority": 2, "cards": cards}
(HERE / "decks" / "icons-r14.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("cards", len(cards), "tiles", sum(len(c["items"]) for c in cards))
