# A2: ranged heroes, round 5

Built by `../_src/A2/ranged.py` (shared pieces in `common.py`, builder in `lib.py`); `render.py` makes the boards
in `renders/` and `renders/_lineup.png` (all of them at 70px and 40px beside the archer). `sheet.py` is a quick
working sheet. Same house style as round 4: the base head and shoulders, the round-3 outline filter, light from the
top left, contact shadows, no eyes, the small mouth.

**Parts.** Every hand and whatever it holds is in an arm group (`arm-l` / `arm-r`, pivot 46 108 / 154 108), never in
`#body`. One-handed weapons sit before `#body` (under the shoulder, only the fist shows); the marksmen's long guns
are two-handed and drawn after `#body`, on the right shoulder, both fists in `arm-r` (no `arm-l`).

| design | the designer's note | what changed |
|---|---|---|
| Crossbowman | fix hat, farmer as base | the kettle hat is now the farmers' hat in steel: brim, crown pushed back, a highlight ridge; no band (a dark or red band read as a grinning mouth) |
| Falconer | hat off centre | the beret is centred on the head; the feather on the right gives the tilt |
| Grenadier | keep moustache and bomb, improve the rest | moustache and lit bomb kept; new tall blue mitre cap (seen from above) with a brass plate stamped with a flaming bomb and a red tuft, red coat with white crossbelts, three little bombs on a bandolier over the left shoulder |
| Harpooner | remove nose, puffy moustache, fix hat | the beard that read as a nose is gone; a puffy grey moustache; the sou'wester is a brim (short in front, long flap behind) with a stitch ring and a low crown; the harpoon's rope end is now tied to the harpoon itself and the coil stays in the other hand, so nothing tears when the arms swing |
| Javelin huntress | better headband, ponytail straight back | ponytail runs straight back from the crown with a coral tie; headband is wider, woven with a gold zigzag, gold beads at the temples |
| Marksman A-D | 4 styles, gun visible, keep the feather | a slim long gun on the right shoulder with the barrel and muzzle out past the front hand. A musketeer (teal cavalier hat, plume), B alpine hunter (green felt hat, scoped rifle), C frontier rifleman (brown wide-brim hat, lever rifle with a brass frame), D rifle officer (black bicorne with gold edge and cockade, scoped long rifle). The cream plume is on every hat |
| Ninja | mask curves up in the middle; no katana | the lower mask rises to a point over the nose; the katana is gone (scarf tails stay) |
| Pirate | nose read as a smile; separate moustache | the beard is now a separate puffy black moustache over a short chin beard |
| Slinger | head unclear, read as one thing | a shepherd wrapped in a ram's fleece: woolly cream ram hood with two curled horns, the fleece running on as the shoulder mantle; crook and sling kept |
| Trapper | new hat with a slight tilt, carries a gun | a fur trapper's cap with ear flaps down and the front flap turned up, tilted 9 degrees; a short rifle in the right hand; the jaw trap moved to the left hand |

## Suggested moves (unchanged unless new)
Crossbowman: Pavise. Falconer: Loose the falcon. Grenadier: Bomb lob. Harpooner: Reel in. Huntress: Javelin.
Marksman: Aimed shot (stands still, then a long shot that pierces). Ninja: Shuriken fan. Pirate: Point blank.
Slinger: Sling stone. Trapper: Set trap, then shoots what the trap holds (a bonus on held targets).

## Still weak
- Marksmen: at 40px the gun reads as a thin stick with two fists; the hats carry the four styles more than the
  guns. A bigger gun would leave the sprite box or cover the face.
- Grenadier: the mitre is a blue-and-brass cap; it could read as a helmet to someone who doesn't know grenadiers.
- Harpooner: the sou'wester is still a big yellow dome at 40px (better than before, but the crown/brim split is
  subtle when small).
- Slinger: the horns are fine big; at 40px it reads as "sheep", which is the point, but say if it should be less
  literal.
- Trapper: the jaw trap is still a steel ring with teeth (reads as a cog at 40px).
