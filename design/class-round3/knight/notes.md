# Knights, round 3

Started from `design/class-round2/knight/`. Every file uses the brief's rounder outline filter, exactly as written.
Parts and pivots are unchanged: `#back` (cape, pivot 100 88), `#body`, `#arm-l` (50 108) and `#arm-r` (150 108).

**Weapon rule, applied the same way everywhere:** the weapon's arm group now comes **before `#body`** in the file,
so the game draws it under the body. The grip passes under the shoulder or pauldron. The fist sits at the front edge
of the body, where the weapon comes out, and the weapon points forward (down) past the body. The body casts a soft
contact shadow onto the weapon where it comes out, so the join reads as "behind" even without an inner line.
Shields stay after `#body`, in front, with the hand hidden. Each weapon is built in its own little frame
(`<g transform="translate(fist) rotate(angle)">`), so the angle or position is easy to change later.

Renders are in `renders/` (archer beside each one, 8 facings, game size).

## Paladin: `knight-paladin.svg`
- "More forward, render behind the body/shoulder, not on top": the sword is drawn under the right pauldron. Only the fist shows, at the pauldron's front edge. The blade (29 wide, 77 to the tip) angles 37° inward and points forward past the chin.
- "The shield is a special case": the heater shield stays in front, with the hand hidden.
- Still weak: the frame stops the blade at about 60 units visible. It can't get longer without leaving the box.

## Old Guard: `knight-old-guard.svg`
- Weapon rule: the two-handed greatsword (`#arm-r`, both hands, no `#arm-l`) is drawn under the right pauldron. The lower fist shows at the pauldron's front edge. The upper fist and the gold pommel peek out past the pauldron's outer side, which is how it still reads as two-handed.
- The beard reaches the front of the body, so a forward sword would hide behind it. The blade is long instead (32 wide, 95 to the tip) and runs at 54° under the beard. The tip comes out at the bottom centre.
- Still weak: the sword is more diagonal than forward, and the tip lies along the bottom of the frame. If he wants it pointing straighter forward, it has to get much shorter.

## Dame (tiara): `knight-dame.svg`
- Weapon rule: the leaf-bladed sword (`#arm-l`) is drawn under the left pauldron, and only the fist shows. It keeps the gold ricasso, ruby pommel, guard gem and swept quillons. The quillons are a little less hooked, because one of them now sticks out alone beside the pauldron.
- The kite shield stays in front, hand hidden. The tiara, braid and cape are unchanged. The circlet version is dropped.
- Still weak: the right quillon hides behind the face, so the guard reads as a single gold flick.

## Tower (was Bastion A): `knight-tower.svg`
- "No eye holes": the helm front had a darker visor band and a gold bar. Together they read as a T-shaped eye slit, and both are gone. It is now a smooth closed steel helm with the white crest and a soft highlight. There is no slit or visor line of any kind.
- Weapon rule: the flanged mace (`#arm-r`) is drawn under the right lames. The head is bigger and dark iron, so it stands apart from the steel helm.
- The tower shield is lifted 5 units (an inner `translate` in `#arm-l`), because its outline touched the bottom of the frame.
- Still weak: with no features the helm is a plain grey egg. That is what was asked, but it is the least "person" of the three. The mace head is the smallest weapon on the sheet at 40px.

## Bulwark (was Bastion B): `knight-bulwark.svg`
- "Looks like a paint brush": the rounded head, gold ferrule and thick shaft are gone. It is now a thin shaft (6 wide), a sharp kite-shaped steel head split light/dark down the middle, and a pair of steel lugs below the head (a winged spear).
- Weapon rule: the spear is drawn under the right pauldron, and its butt end sticks up behind the shoulder, so it reads as one long spear. Only the fist shows at the front.
- Still weak: the face is still only a chin under the brim (unchanged).

## Griffon (was Bastion C): `knight-griffon.svg`
- "Almost good. Helmet boring": new griffon helm, keeping the griffon idea:
  - wings: bigger, swept back and out, with a scalloped feather edge, a cream underside along the front edge and soft feather bands.
  - crest: a purple feather crest (it matches the spaulders) runs front to back over the dome.
  - beak visor: a gold beak comes down from the brow over the upper face, with a darker hooked tip. The chin shows below it as one patch. It is not two patches either side of the beak, because those would read as eyes.
- Weapon rule: the warhammer (`#arm-l`) is drawn under the left spaulder. Its head is now a clear double-faced steel block with a gold band (round 2's read like an axe). The heater shield stays in front.
- All three Bastions at 40px: Tower is a grey egg with a red tower shield. Bulwark is a big grey disc hat with brown shoulders and a green round shield. Griffon is gold wings on purple with a cream shield. Different colours, different silhouettes.
- Still weak: the Griffon is the busiest of the knights. The crest is a centre stripe like the Paladin's gold comb and the Tower's white crest, and only its colour sets it apart.

## For whoever animates these
- The body's shadow on each weapon is clipped to where the weapon sits at rest. When an arm swings far, that shadow
  stays behind. Drop it while swinging, or ignore it: it is faint.
- Old Guard is two-handed: `#arm-r` only.
