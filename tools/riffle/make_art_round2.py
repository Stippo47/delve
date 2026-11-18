"""Write decks/art-round2.json: one board item per round-2 design, from design/class-round2/*/renders."""
import json, pathlib

HERE = pathlib.Path(__file__).resolve().parent
R2 = HERE.parents[1] / "design" / "class-round2"

# id: (label, your note, what changed, still weak)
ITEMS = [
 ("archer/archer", "Archer, split into parts", "Locked: should look the same.",
  "Rebuilt as parts so the bow arm and the drawing arm can animate. Looks the same at game size.",
  "The arrow now draws over the bow hand (a thin line across it), so it can be pulled back."),
 ("knight/knight-paladin", "Knight · Paladin", "Hand holding shield hidden. Longer, bigger sword, angled inwards.",
  "Shield covers the hand; blade about 70% longer, angled in to point front-centre.", "Cape hem still a bit cloud-like."),
 ("knight/knight-old-guard", "Knight · Old Guard", "Sword short, pose weird. Cape wider and straight on. Beard not meshing with balding hairline.",
  "Greatsword in both fists across the front; wide straight crimson cape; hair, sideburns and beard one connected piece. Back shield dropped.", "The diagonal hold is a guess at 'weird'."),
 ("knight/knight-dame", "Knight · Dame (circlet)", "Cape straight. Hand on shield hidden. Gold crown or accent. Bigger, cooler sword. Hair shadow on face should be hair-coloured.",
  "Straight centred cape, hidden hand, gold circlet with a gem, leaf blade with gold guard, warm auburn hair shadow.", "Circlet can look a bit like a halo."),
 ("knight/knight-dame-tiara", "Knight · Dame (tiara)", "Same notes as the circlet version.",
  "The same, with a gold tiara peaked at the parting instead.", "Guard blurs to a gold flick at game size."),
 ("knight/knight-bastion-a", "Knight · Bastion A, Tower", "Bastion: can't tell what's going on. Redo, 3 versions.",
  "New: closed helm with a white crest, stepped shoulder plates, red tower shield, flanged mace.", "Faceless; the shield hides one shoulder."),
 ("knight/knight-bastion-b", "Knight · Bastion B, Bulwark", "Redo, 3 versions.",
  "New: kettle hat with the face showing, bronze pauldrons, round green shield, long spear.", "Reads more foot soldier than heavy knight."),
 ("knight/knight-bastion-c", "Knight · Bastion C, Griffon", "Redo, 3 versions.",
  "New: round helm with gold wings, purple spaulders, chevron heater shield, warhammer.", "Shoulders merge into one purple slab behind."),
 ("skeleton/skeleton-rattler", "Skeleton · Rattler", "Remove rib cage. Eye sockets. No split down the middle. Then variants.",
  "Sockets, one soft gradient, nose the right way up, no ribs; collarbones under the chin; bigger sword.", "Plainest of the set."),
 ("skeleton/skeleton-rattler-jawless", "Skeleton · Rattler, no jaw", "Including one without a bottom jaw.",
  "Skull stops at the upper jaw; long teeth hang free.", "Close to the plain Rattler at game size."),
 ("skeleton/skeleton-rattler-loosejaw", "Skeleton · Rattler, loose jaw", "Variants.",
  "A chip out of the dome, one bigger socket, jaw hanging crooked with a tooth missing.", "Lower teeth tiny at game size."),
 ("skeleton/skeleton-gaper", "Skeleton · Gaper", "Why the hood shadow? No split. Eye sockets. Nose triangle the wrong way?",
  "Hood shadow gone, no split, sockets, nose flipped; spear held low in both hands, bigger head; spine sways behind.", "Open jaw runs a little past the base head."),
 ("skeleton/skeleton-brute", "Skeleton · Brute", "Same edits. Remove the arm bones.",
  "Arm bones gone: fists float in front of big shoulder balls. Smaller skull, shorter tusks, bigger cleaver.", "Widest of the set, still a bit boxy."),
 ("skeleton/skeleton-hollow", "Skeleton · Hollow", "You get the idea.",
  "Ribs gone; the biggest, deepest sockets; back hand on the hip instead of waving; longer rapier with a cup guard.", "Rapier still the thinnest weapon."),
 ("rogue/rogue-twinfang", "Rogue · Twinfang", "Cape centred and wider.",
  "Centred crimson cape, wider than the shoulders; bigger daggers held low.", "Ponytail sits off-centre on the cape."),
 ("rogue/rogue-bandit-mask", "Rogue · Bandit (mask)", "Mask over the lower face? Bigger sword. Bandana on the forehead, hair peeking through.",
  "Bandana low on the forehead with hair above and locks over it; slate face mask; a big cutlass held low.", "One-sided silhouette."),
 ("rogue/rogue-bandit-nomask", "Rogue · Bandit (no mask)", "Same notes.",
  "The same, with a mustard neckerchief instead of the mask.", "Locks a bit spiky up close."),
 ("rogue/rogue-shade-cape", "Rogue · Shade (cape)", "Hard to read depth. Cape or raised collar? Headband off. Purple hilts?",
  "Depth layered dark to light; bell cloak; headband goes round the head with tails; purple hilts, bigger daggers.", "Hands sit on the jaw."),
 ("rogue/rogue-shade-collar", "Rogue · Shade (collar)", "Same notes; the Dracula collar.",
  "Tight raised collar with a crimson lining instead of the cloak.", "Collar points look a bit like ears small."),
 ("farmer/farmer-granny-reaper", "Farmer · Granny Reaper", "Hold it below the body, not on top. Bigger, better hand positions.",
  "Both fists grip the snath at the front; blade 1.6x longer, sweeping across below the chin.", "Outline chunky at the blade tip."),
 ("farmer/farmer-haymaker-fork", "Farmer · Haymaker (fork)", "Hat is off. Rake too, and how it's held.",
  "New tipped-back straw hat with a wavy brim; three-tine pitchfork held diagonally, fists apart.", "Hat hides most of the shoulders."),
 ("farmer/farmer-haymaker-rake", "Farmer · Haymaker (rake)", "Same notes.",
  "The same, with a wooden hay rake.", "Rake teeth merge at game size."),
 ("farmer/farmer-digger", "Farmer · Digger", "Bad overall. You can retry.",
  "A new character: knit beanie with a pompom, big moustache, work coat, big spade held low.", "One fist touches the cheek."),
 ("farmer/farmer-grandpa-sickle", "Farmer · Grandpa Sickle", "Can't tell what's on his back. Forehead shadow? Beard, nose line, doesn't mesh with hair.",
  "Sheaf across his back with stalks and ears; lit bald dome; hair and beard one white shape with a real moustache; bigger sickle.", "Beard is a big plain white area."),
 ("barbarian/barbarian-wildmane", "Barbarian · Wildmane", "Sword below the body, not above. Bigger.",
  "Sword moved to the right hand, low, wider blade and guard.", "Fist over the pommel a little like a thumbs-up."),
 ("barbarian/barbarian-bearskin-a", "Barbarian · Bearskin (club)", "Weapon hard to see. Spiked club doesn't look right.",
  "Club moved off the face; rebuilt as a pale wooden club with iron spikes.", "Spikes run into the fur in some turns."),
 ("barbarian/barbarian-bearskin-b", "Barbarian · Bearskin (axe)", "Or another weapon.",
  "The same bear, with a double-bit war axe.", "Reads clearest of all at game size."),
 ("barbarian/barbarian-warhelm-a", "Barbarian · Warhelm (plates)", "Hammer and its position bad. Helm midline off. Shoulder pads. Can't see the beard.",
  "New hammer with a visible haft, clear of the beard; midline straight; layered plate pauldrons; lighter beard.", "Face is a thin strip."),
 ("barbarian/barbarian-warhelm-b", "Barbarian · Warhelm (spike)", "Same notes; the shoulder pads.",
  "The same, with domed gold-rimmed pauldrons and one big spike.", "Hammer head smallish small."),
 ("barbarian/barbarian-berserker-a", "Barbarian · Berserker (strap)", "Same weapon problems. Don't like the striped shoulder. Bangs peek out under the mohawk.",
  "Bigger flail held low; stripes replaced by a leather strap; one smooth hairline, the crest covers it.", "Short chain."),
 ("barbarian/barbarian-berserker-b", "Barbarian · Berserker (pelt)", "Same notes.",
  "The same, with a grey wolf pelt on the bare shoulder.", "The pelt echoes Wildmane's fur."),
]

items = []
for path, label, note, changed, weak in ITEMS:
    cls, name = path.split("/")
    d = R2 / cls / "renders"
    items.append({"id": name, "label": label, "image": f"../../../design/class-round2/{cls}/renders/{name}.png",
                  "thumb": f"../../../design/class-round2/{cls}/renders/{name}-thumb.png",
                  "text": f"Your note: {note}\n\nChanged: {changed}\n\nStill weak: {weak}"})
    assert (d / f"{name}.png").exists(), name

deck = {
  "title": "Art round 2: your notes applied",
  "topic": "art", "order": 2, "priority": 1, "tags": ["first"],
  "cards": [{
    "id": "round2", "kind": "board", "rarity": "rare",
    "title": "Art round 2",
    "text": "Every design with your notes applied, plus new Bastions. Tick the keepers, comment on any.",
    "why": "Your ticks become the game's art. Each picture shows the design beside the archer at the same size, then 8 turns at game size.",
    "pick": ["knight-dame", "knight-paladin", "knight-bastion-a", "skeleton-rattler", "skeleton-brute", "rogue-twinfang",
             "rogue-shade-collar", "farmer-granny-reaper", "barbarian-wildmane", "barbarian-bearskin-b", "barbarian-warhelm-a"],
    "details": "Every sprite is now built in parts: the body, each arm with what it holds, and a cape or quiver behind. The outline is added afterwards over the whole figure. So weapon swings, the bow drawing back and arm swing can come next, once you've picked.\n\nThe outline in these pictures is a rounder version than the brief first asked for: two of the artists found the first one squared off points.\n\nWhere a note was open (crown or accent, cape or collar, mask or not, club or another weapon, the Warhelm's shoulders, what replaces the woad stripes), there are two versions to pick from.\n\nEach item's text has your note, what changed and what's still weak.",
    "items": items,
  }],
}
(HERE / "decks" / "art-round2.json").write_text(json.dumps(deck, indent=2, ensure_ascii=False), encoding="utf-8")
print("items:", len(items))
