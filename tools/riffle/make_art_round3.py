"""Write decks/art-round3.json: one board item per round-3 design, from design/class-round3/*/renders."""
import json, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R3 = HERE.parents[1] / "design" / "class-round3"
RULE = "Weapon further forward, behind the shoulder."

# path, label, your note, changed, still weak
ITEMS = [
 ("knight/knight-paladin", "Knight · Paladin", "Weapons more forward, behind the body/shoulder. Shield is the special case.",
  "Sword under the right shoulder, only the fist showing; shield stays in front.", "The sword angles a little outward."),
 ("knight/knight-old-guard", "Knight · Old Guard", "(Picked.)", RULE + " Greatsword runs long and diagonal under the beard.", "Diagonal so it fits the sprite: longer, but less straight ahead."),
 ("knight/knight-dame", "Knight · Dame", "(Picked, tiara.)", RULE + " Leaf sword under the left shoulder; guard less hooked.", "Small sword next to the shield."),
 ("knight/knight-tower", "Knight · Bastion, Tower", "No eye holes.", "A smooth closed helm, no slit at all. Bigger dark-iron mace.", "The least person-like; the mace is small."),
 ("knight/knight-bulwark", "Knight · Bastion, Bulwark", "Looks like a paint brush.", "A thin winged spear with a sharp kite head; the butt shows behind the shoulder.", "Spear shows short in front."),
 ("knight/knight-griffon", "Knight · Bastion, Griffon", "Almost good. Helmet boring.", "Big gold feathered wings, a purple crest and a gold beak over the face. Clear block-head hammer.", "Busiest knight; crest stripe like the others."),
 ("barbarian/barbarian-wildmane", "Barbarian · Wildmane", "Bigger weapon.", "Broadsword much bigger, diagonal under the beard.", "Points across more than ahead."),
 ("barbarian/barbarian-wildmane-scar", "Barbarian · Wildmane (scar)", "Add scar on 'eye'?", "The same, with a short pale scar where the left eye would be.", "The scar is a fleck at game size."),
 ("barbarian/barbarian-bearskin", "Barbarian · Bearskin", "(Picked, club.)", RULE + " Pale spiked club under the right paw.", "Paw hides the handle: can read as a drumstick. The round-2 axe is the fallback."),
 ("barbarian/barbarian-warhelm", "Barbarian · Warhelm", "A and B as one. Beard doesn't cover the face. Pads too detailed. Longer handle. No spikes.",
  "One Warhelm: plain domed pads, no spikes; the beard covers everything below the cheeks, with a moustache; longer haft, bigger head.", "Hammer still mostly hidden."),
 ("barbarian/barbarian-berserker", "Barbarian · Berserker", "Spikes on the top face of the mace.", "Five spikes on top of the ball as well as round the rim; bigger ball, one more chain link.", "Top spikes are a glint at game size."),
 ("rogue/rogue-twinfang", "Rogue · Twinfang", "Weapons forward, behind the shoulders, further apart.", "Daggers behind the shoulders, fists at the front corners, further apart, angled out.", "Daggers a little shorter so they fit."),
 ("rogue/rogue-bandit-mask", "Rogue · Bandit", "(Picked, mask.)", RULE + " Slimmer cutlass coming out under the right of the mantle.", "Couldn't get the blade longer and stay in the sprite."),
 ("rogue/rogue-shade-cape", "Rogue · Shade (spread)", "(Picked, cape.)", RULE + " Curved daggers spread apart.", "Close to Twinfang now."),
 ("rogue/rogue-shade-cape-crossed", "Rogue · Shade (crossed)", "(Picked, cape.)", "The rule, but the daggers keep Shade's crossed X ahead of the chin.", "Hands still near the chin."),
 ("farmer/farmer-granny-reaper", "Farmer · Granny Reaper", "Weapon too small. Specifically handle.", "Handle about 1.5x longer, held in two fists under the shoulder; blade wider.", "The handle end at the shoulder is the closest to 'over the shoulder'."),
 ("farmer/farmer-haymaker-fork", "Farmer · Haymaker", "Handle short. Hat too detailed, bowl not wide enough. Tines too shiny.",
  "Handle 1.6x longer; a plain hat with a wider crown and a red band; matte tines.", "The fork points off at an angle."),
 ("farmer/farmer-digger", "Farmer · Digger", "Longer handle, below body.", "Handle twice as long, under the body; spade forward.", "Spade angles off to the right."),
 ("farmer/farmer-grandpa-sickle", "Farmer · Grandpa Sickle", "(Picked.)", RULE + " Sickle a bit bigger, clear of the beard.", "Free hand still over the body."),
 ("skeleton/skeleton-rattler", "Skeleton · Rattler", "No rib cage, or pull it back. Overall good.", "Nothing left in front of the skull; sword behind the shoulder, a bit wider.", "The empty hand floats under the shoulder."),
 ("skeleton/skeleton-rattler-jawless-bow", "Skeleton · Rattler, bow", "Give a bow or spear.", "A recurve bow held out in front, arrow and drawing claw; the string can pull back like the archer's.", "Ring-shaped like the archer at game size."),
 ("skeleton/skeleton-rattler-jawless-spear", "Skeleton · Rattler, spear", "Give a bow or spear.", "A long thin spear with a leaf head (not a brush); butt behind the shoulder.", "Spear on one side only."),
 ("skeleton/skeleton-rattler-loosejaw", "Skeleton · Rattler, mace", "Give him a mace.", "A rusty spiked mace on a handle under the shoulder.", ""),
 ("skeleton/skeleton-gaper", "Skeleton · Gaper", "2 long swords. A bit angry.", "Two long thin swords angled out; sockets slanting down to the nose with a brow ridge.", "Claws sit back by the cheeks so the swords fit."),
 ("skeleton/skeleton-brute", "Skeleton · Brute", "Give shield. Can't tell what the weapon is.", "Round wooden shield in front, claw hidden; a big bearded axe instead of the cleaver.", ""),
 ("banshee/banshee-hood", "Banshee (hood)", "Keep the Hollow's head for a ghoul/banshee.", "The Hollow's skull in a ragged hood, a ghost body trailing into wisps, bony hands reaching forward.", "Skull is still warm bone; glowing eyes would be an option."),
 ("banshee/banshee-hair", "Banshee (hair)", "Same.", "The same with long lavender-white hair instead of the hood.", "Hair and body blur together small."),
 ("enemies/slime-big", "Slime", "Get me the slimes in here.", "A jelly blob with a shine, a bone and a coin inside, eyes at the front.", ""),
 ("enemies/slime-small", "Slime, small", "", "What it splits into: smaller, paler, bigger eyes.", ""),
 ("enemies/slime-fire", "Fire slime", "", "A molten slime with flames off its back that can flicker. Built for burn.", ""),
 ("enemies/bat", "Bat", "Bats.", "Small, wings spread so they can flap.", ""),
 ("enemies/ghost", "Ghost", "Ghosts.", "A plain sheet ghost, unlike the banshee.", ""),
 ("enemies/lizardman-spear", "Lizardman (spear)", "Lizard men.", "Snout forward, crest, tail behind; a leaf spear under the shoulder.", "Olive green, near the archer's green."),
 ("enemies/lizardman-blade", "Lizardman (blade)", "", "The same with a curved scimitar.", "The scimitar can read as a tusk."),
 ("enemies/spider", "Spider", "Spiders.", "Round marked body, six red eyes, eight legs that can move.", ""),
 ("enemies/snowman", "Snowman", "Snowmen.", "Bucket hat, red scarf, carrot nose forward, stick arms.", "The two balls blur below the scarf."),
 ("enemies/mimic", "Mimic (artist's idea)", "(You said yes to mimic chests.)", "A chest whose lid is a mouth of teeth, tongue out.", ""),
]

items = []
for path, label, note, changed, weak in ITEMS:
    cls, name = path.split("/")
    d = R3 / cls / "renders"
    assert (d / f"{name}.png").exists(), name
    text = (f"Your note: {note}\n\n" if note else "") + f"Changed: {changed}" + (f"\n\nStill weak: {weak}" if weak else "")
    items.append({"id": name, "label": label, "image": f"../../../design/class-round3/{cls}/renders/{name}.png",
                  "thumb": f"../../../design/class-round3/{cls}/renders/{name}-thumb.png", "text": text})

deck = {
  "title": "Art round 3: weapons back, new enemies",
  "topic": "art", "order": 3, "priority": 1, "tags": ["first"],
  "cards": [{
    "id": "round3", "kind": "board", "rarity": "rare",
    "title": "Art round 3",
    "text": "Your picks with the new weapon rule, the Bastions and Warhelm redone, and the new enemies. Tick the keepers.",
    "why": "Each tick becomes a unit in the game. Each picture shows the design beside the archer at the same size, then 8 turns at game size.",
    "pick": [i["id"] for i in items if i["id"] not in ("rogue-shade-cape", "barbarian-wildmane", "banshee-hair", "lizardman-blade")],
    "details": "Weapons now sit behind the body and shoulder and come out forward, with only the fist showing, as you asked for the Paladin. Shields stay in front.\n\nThe sprite box is the limit: with the weapon starting under the body, there's only a little room in front, so the longest weapons run diagonally to stay big.\n\nWhere a note was open there are two versions: Wildmane with or without the scar, Shade's daggers spread or crossed, the banshee hooded or with hair, the lizardman with a spear or a blade.",
    "items": items,
  }],
}
(HERE / "decks" / "art-round3.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("items:", len(items))
