# A2: fighters, round 5

Built by `../_src/A2/fighters.py` (fixes, redos, turret) and `../_src/A2/crew.py` (engineers, beast tamers, beasts);
`render.py` makes the boards in `renders/` and `renders/_lineup.png`. House style as round 4.

**Parts.** Every hand and whatever it holds is in an arm group (`arm-l` / `arm-r`), never in `#body`. New part ids
(each a direct child of `#sprite`, so parts.js splits it into its own layer and `pose[id]` can turn it about its
`data-pivot`):
- `engineer-turret.svg`: `#top` (pivot 100 96, the swivel centre) is the gun: housing, mantlet, twin barrels. `#body`
  is the base ring and `#back` the legs, so the top can turn on its own.
- the beast tamers: `#whip` is the lash on its own, pivot at the tip of the handle (160 163); `arm-r` holds the handle.
  To animate: pin the lash's pivot to the hand (apply arm-r's pose to the pivot point), then crack it: swing it out
  from the pivot and snap it back, or stretch it toward the target on the hit.
- `fighter-scarecrow.svg`: `#crow` (pivot 34 100) so it can lift off the shoulder and fly.
- Note for the game: parts.js only treats ids starting `arm-`, `back`, `front` as "moving" when it hands the body's
  loose shadows down; `top`, `whip` and `crow` should be added to that regex when they are wired in.

| design | the designer's note | what changed |
|---|---|---|
| Engineer's turret | top separate from base | `#top` is its own part (see above) |
| Beast tamer A, ringmaster | can stay, fix the hat | the top hat is drawn from above now: wide brim, round crown, red band (no side view); moustache added; whip as two parts |
| Beast tamer B, jungle beastmaster | 4 variants, different themes | leopard head worn as a hood (ears, spots, muzzle on the brow), pelt down the back, darker skin, fang necklace, green vine whip |
| Beast tamer C, steppe rider | | tall red felt cap with a fur brim and tassel, quilted blue coat, fur collar, two braids behind, drooping moustache, leather whip |
| Beast tamer D, drake keeper | | black leather, studded iron collar guard, shaved head with a dark crest under an iron band, a scar, gloves, a chain whip with a barbed tip |
| Beasts (2 per tamer) | "that's not a beast" | hero-sized animals seen from above, head forward, no eyes: A lion (mane, circus collar) and bear (ruff collar); B panther and boar (tusks); C wolf and sabre-tooth (long fangs); D drake (folded wings, horns, spade tail) and rhinoceros beetle (horn, six legs). Parts: `#back` tail, `#body`, `arm-l`/`arm-r` front legs |
| Engineer A-D | 4 styles | A mechanic (kept: orange suit, flipped welding mask, wrench); B clockmaker (bowler with a gear, green waistcoat, cogs on a cord, moustache, brass mallet); C sapper (yellow hard hat with a headlamp, big red beard, fuse coil, sledgehammer); D artificer (teal hood with a glowing crystal circlet, brass pauldrons, a spanner-staff with a crystal) |
| Executioner | try again | a hulking headsman: broad bare shoulders, studded strap, black leather hood with the tip flopping back, open at the jaw (no eye holes); a big bearded axe in the right hand with the blade turned in toward the front |
| Gladiator | try again | bronze helmet with a broad brim and a tall red crest front to back, bare shoulders, a steel shoulder guard on the sword arm, a gladius and a small round bronze shield |
| Jester | top bell cut off | the back point is shorter so its bell sits inside the sprite box |
| Samurai | try again (a separate one) | indigo kabuto with slim gold horns sweeping back in a V, flaring neck guard and layered shoulder plates laced in orange, a single katana in the right hand |
| Scarecrow | bigger mouth, thicker lines, hands off the stick, crow separate, sack top | wider stitched mouth with thick stitches; weave and patch stitches thicker; hands are straw bunches from blue cuffs held forward and in, clear of the pole ends; crow is `#crow`; the sack's top is gathered and tied with twine under a burlap frill (no straw crown) |
| Valkyrie | braids, bigger spear, helmet top as wide as the band | plaits (lobes leaning left/right in turn) tied with blue bands; spear longer with a bigger head and wings; the helm has straight sides so its top is the band's width |
| Vampire | collar doesn't read; hair should hug the head | a high stand-up collar flaring at the sides, black outside, crimson inside, low behind the head, points at the shoulders; hair slicked back along the head with a widow's peak |
| Werewolf | redo, add a human form | wolf from above in the house style: round skull, ears laid back, long snout with pale muzzle, dark nose, white fangs, shaggy ruff, rags of the red shirt, clawed paws, no eyes. Human form `fighter-werewolf-human.svg`: same torn red shirt, wild grey-brown hair, sideburns and stubble, a hatchet |

## Suggested moves
Turret / Engineers: Deploy turret (the wrench/mallet/hammer repairs it). Beast tamers: Crack the whip (the beast gets a
burst of speed and damage and pounces on the tamer's target); per theme the beast differs (lion roar slows, bear
knocks back, panther pounces from range, boar charges in a line, wolf bleeds, sabre-tooth crits, drake breathes a
short cone of fire, beetle shoves and blocks). Executioner: Execute. Gladiator: Shield bash then a quick stab.
Samurai: Iaido dash. Scarecrow: Murder of crows. Valkyrie: Valkyrie's call. Vampire: Life drain. Werewolf: starts
human with the hatchet, turns into the wolf below half HP (Frenzy).

## Still weak
- The beasts are flat "rug" shapes from above; the hind legs read as round paws at the back corners. At 40px they
  read by colour and head (mane, tusks, fangs, horn, wings). Wolf and sabre-tooth are the weakest heads.
- Tamer D's chain whip reads as a string of beads; tamer D overall is the plainest.
- Werewolf without eyes: reads as a wolf by the snout and ears, but less fierce than with the yellow eyes.
- Executioner: the axe blade turned inward sits in front of the chest; the haft runs under the shoulder.
- Gladiator: the helmet brim covers most of the head; the face is a strip.
- The samurai's horns are thin at the tips and go a little soft with the outline filter.
