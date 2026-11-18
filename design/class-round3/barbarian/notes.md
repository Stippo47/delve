# Barbarians, round 3

Started from `design/class-round2/barbarian/`. Every file uses the brief's rounder outline filter, exactly as written.
Pivots are unchanged: `arm-l` 40 108, `arm-r` 160 108. Every weapon is one-handed. The other arm is a free fist that
stays in front.

**Weapon rule, applied the same way everywhere:** the weapon's arm group now comes **before `#body`** in the file,
so the game draws it under the body. The grip passes under the mantle, paw or pauldron. Only the fist shows at the
body's front edge, and the weapon comes out forward past the body. The body casts a soft contact shadow onto the
weapon where it comes out. Each weapon is built in its own little frame
(`<g transform="translate(fist) rotate(angle)">`), so the angle or position is easy to change later.

Renders are in `renders/` (archer beside each one, 8 facings, game size).

## Wildmane: `barbarian-wildmane.svg` (no scar) and `barbarian-wildmane-scar.svg` (scar)
- "Bigger weapon": a broadsword with a blade 42 wide and 95 to the tip (was 42 by 63), and a 80-wide guard. It is drawn under the right side of the mantle and runs diagonally under the beard. The point comes out at the bottom centre. The beard sits over part of the blade, which makes it read as behind the body.
- "Add scar on 'eye'?": two labelled versions. The scar version has a short pale scar slanting across where his left eye would be. It runs from under the fringe down to the cheek, with a faint darker edge. The other version has no scar.
- Still weak: the scar is subtle at 40px. It shows as a pale fleck. Making it any bolder starts to read as an eye. The fist is mostly under the mantle, so mainly the guard and pommel mark where the sword comes out.

## Bearskin (club): `barbarian-bearskin.svg`
- Weapon rule: the club's handle is under the right paw, and the fist shows at the paw's edge. The club runs diagonally forward and inward under the face, so it stays clear of the snout and fangs.
- "The club must read clearly": a pale wooden club with a narrow handle that swells to a fat rounded end, a darker grip band, wood grain, and five light iron spikes. The spikes are on the outer sides only, so none run into the fur edge or out of the frame. The pale wood keeps it apart from the dark fur.
- Still weak: this is the weakest one. The paw and its claws sit over the handle, so mostly the fat end shows, and up close it can look like a drumstick. At 40px it reads as a pale spiked lump at the front corner. If it's still unclear, the next thing to try is a different weapon that shows its shape with no handle, like round 2's war axe.

## Warhelm (A + B, now one unit): `barbarian-warhelm.svg`
- Started from B. "Remove the shoulder spikes" and "Shoulder pads may be a bit too detailed": B's steel domes with gold rims, spikes removed. There are no lames.
- "Is that a beard? If so it doesn't cover the face": the beard is now drawn over the face, not under it. It covers everything below the cheeks. The mouth is hidden, and a lighter moustache sits on top. Three faint grain strands run down it, and the forked points are kept. Only a strip of face shows between the gold brow band and the moustache.
- "Slightly longer handle": the haft is longer, with two leather wraps showing between the fist and the head. Weapon rule: the hammer is drawn under the left pauldron. The head is bigger and further forward: a flared steel block with a gold band and a beak spike on the outer side.
- Still weak: the face strip is thin. The hammer head reads, but it sits right at the bottom-left corner of the frame.

## Berserker (strap): `barbarian-berserker.svg`
- "Spikes on the top face of the mace": the ball now has five small pyramid spikes on its top face, the face we see from above. Each is a four-sided point with a light facet top-left and a dark facet bottom-right, like the lighting on everything else. The ring of spikes round the rim is kept.
- Weapon rule: the handle is under the spiked pauldron, and the fist shows at its front edge. The chain (four links, one more than before) and the ball hang out forward and inward under the jaw-beard. The ball is bigger: 33 across, 46 across the rim spikes (was 29 and 44).
- Still weak: the top spikes are fine detail. At 40px they show as a glint on the ball, not as separate spikes. The ball still sits close to the body.

## For whoever animates these
- The body's shadow on each weapon is clipped to where the weapon sits at rest. When an arm swings far, that shadow
  stays behind. Drop it while swinging, or ignore it: it is faint.
- The Berserker's ball and top spikes are drawn in sprite coordinates inside `#arm-r`, so they swing with the arm.
  They are not inside the rotated handle group.
