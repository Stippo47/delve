# Art round 3: the four artists' sections (the designer's words, per design)

Each artist reads `design/briefs/round3-brief.md` first, then only their own section.
Every design here also gets the **weapon rule** from the brief unless it says otherwise.

## A. Knights and barbarians -> design/class-round3/knight/ and design/class-round3/barbarian/
Start from `design/class-round2/knight/` and `.../barbarian/`.
- **Paladin**: "This rule is going to go for many weapons. More forward, render behind the body/shoulder, not on top. The shield is a special case." -> sword behind the shoulder, forward; shield stays in front.
- **Old Guard**: picked, no note: the weapon rule.
- **Dame (tiara)**: picked, no note: the weapon rule. (The circlet version is dropped.)
- **Bastion A, Tower**: "No eye holes." -> a closed helm with no eye holes at all (try without any slit first).
- **Bastion B, Bulwark**: "Looks like a paint brush." -> the spear reads as a brush: give it a clear leaf/blade head and a thinner shaft, or another weapon that reads at 40px.
- **Bastion C, Griffon**: "Almost good. Helmet boring." -> a more striking helm (keep the griffon idea: wings, crest, beak visor). The three Bastions are three different units now: make sure they differ from each other at 40px.
- **Wildmane**: "Bigger weapon. Add scar on 'eye'?" -> bigger sword; a version with a short pale scar across where an eye would be (people have no eyes) and one without.
- **Bearskin (club)**: picked: the weapon rule; the club must read clearly.
- **Warhelm**: A and B become **one** unit. A: "Is that a beard? If so it doesn't cover the face. Shoulder pads may be a bit too detailed. Slightly longer handle." B: "Remove the shoulder spikes." -> one Warhelm: a beard that clearly covers the lower face, simpler shoulder pads (B's domes without spikes is a good start), a longer hammer handle.
- **Berserker (strap)**: "Spikes on the top face of the mace." -> spikes on the top of the flail head, the face seen from above.

## B. Skeletons and the banshee -> design/class-round3/skeleton/ and design/class-round3/banshee/
Start from `design/class-round2/skeleton/`. Skeletons are enemies; each is a different enemy now.
- **Rattler**: "No rib cage, or pull it back more. Overall good." -> no ribs showing (or only a hint far back, behind the skull).
- **Rattler, no jaw**: "Same. Give a bow or spear." -> make both, labelled (a bow skeleton and a spear skeleton).
- **Rattler, loose jaw**: "Same. Give him a mace."
- **Gaper**: "Give 2 long swords. Make look a bit angry." -> two long swords (both behind the body, spread); angry: a brow ridge over the sockets angled down to the centre, or slanted sockets.
- **Brute**: "Give shield. Can't tell what weapon is." -> a shield in one hand (in front, hand hidden) and a weapon that reads at 40px in the other.
- **Hollow -> banshee/ghoul**: "Keep the head for a ghoul/banshee enemy. Doesn't work as a skeleton." -> a new floating ghost enemy built around the Hollow's skull (big deep sockets): wispy hair or a hood, a tattered body trailing off behind (back = up), no legs, pale ghostly colours. Arms may reach forward. Name it `banshee-<name>.svg`.

## C. Rogues and farmers -> design/class-round3/rogue/ and design/class-round3/farmer/
Start from `design/class-round2/rogue/` and `.../farmer/`.
- **Twinfang**: "Same thing as first knight. Weapons a bit forward, behind the shoulders, also move them apart a bit."
- **Bandit (mask)**: picked: the weapon rule. (The no-mask version is dropped.)
- **Shade (cape)**: picked: the weapon rule. (The collar version is dropped.)
- **Granny Reaper**: "Weapon too small. Specifically handle." -> a much longer snath (handle), blade bigger too.
- **Haymaker (fork)**: "Handle short. Hat is a bit too detailed. Bowl isn't wide enough. Pitchfork fingers too shiny." -> long handle; a simpler straw hat with a wider crown ("bowl"); matte tines, no bright highlights. (The rake version is dropped.)
- **Digger**: "Longer handle, below body." -> long spade handle, held low, the weapon rule.
- **Grandpa Sickle**: picked: the weapon rule.

## D. New enemies -> design/class-round3/enemies/
The designer: "Get me the slimes in here and any other enemies (bats, ghosts, lizard men, spiders, snowmen, etc)."
Same style, sprite box, outline filter and parts as the heroes (see both briefs). Enemies may have no arms: use
`arm-l`/`arm-r` for whatever should move (bat wings, spider legs on each side, a lizardman's weapon arm) and say in
notes.md what each part is for. Size them against the archer in the render (it's drawn at the same scale):
- **Slimes**: the game draws its slime in code (see `drawSlime` in `js/sprites.js`); it splits into small ones when it dies. Make it a real design: a big slime, the small slime it splits into, and one more slime kind (e.g. fire or ice). A jelly blob seen from above, with a shine, maybe things floating inside. Big about the archer's width; small about 60%.
- **Bat**: small (about 60%), wings spread to the sides (wings as arm-l/arm-r so they can flap).
- **Ghost**: a simple sheet-like ghost, different from the banshee (another artist builds that from a skull).
- **Lizardman**: archer-sized, scaly snout pointing forward (down), a tail behind (up), a spear or curved blade (the weapon rule).
- **Spider**: about 80%, round body, 8 legs (4 a side, as the arm-l/arm-r groups), readable from above.
- **Snowman**: about 110%, two stacked snowballs seen from above (the head in front), stick arms, a carrot nose pointing forward, maybe a bucket hat.
- One or two more if you have ideas that fit, labelled as yours.
People have no eyes, but these are monsters: simple eyes are allowed on monsters where they help them read.
