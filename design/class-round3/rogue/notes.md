# Rogue, round 3

All files start from the round-2 SVGs. They use the brief's new rounder outline filter, copied exactly. Group ids
and pivots are unchanged: left shoulder (46,108), right shoulder (154,108), cape `back` sway pivot as before.
**Weapon arms now come before `body` in the file**, so they draw behind the shoulders. Each weapon fist sits half
under the front edge of the shoulder. Its top is darkened slightly so it reads as coming out from under the body.
Renders are in `renders/` (archer beside each one).

## Twinfang: `rogue-twinfang.svg`
- "Same thing as first knight. Weapons a bit forward, behind the shoulders": both arm groups are before `body`. The
  daggers come out from under the shoulders, and only the fists and gold guards show at the front corners.
- "Also move them apart a bit": the fists moved out from x 58/142 to x 40/160. Each dagger is also angled 9° outward,
  so the tips spread further.
- Still weak: the fists are only half visible, which is what the rule asks for, but they're small at 40px. The
  blades are a little shorter (58 instead of 69) to keep the tips inside the sprite box now that they start lower.

## Bandit (mask): `rogue-bandit-mask.svg`
- Weapon rule: `arm-r` (fist + cutlass) is before `body`. The fist peeks out at the right side under the scalloped
  mantle, and the cutlass comes out from under it pointing forward and a little inward. The blade is slimmer, so it
  reads more like a sword than a cleaver.
- The free left hand holds nothing, so it stays in front (after `body`), as in round 2.
- Still weak: the blade can't get longer than round 2's without leaving the sprite box, because it now starts lower.
  The silhouette is one-sided (sword on the right only), as in round 2.

## Shade (cape): two versions, because the brief's "two weapons spread a little apart" fights the Shade's crossed X
- `rogue-shade-cape.svg` (**spread**): both arms are before `body`, with the fists at the front corners of the
  shoulders. The curved daggers bow outward like fangs and are spread apart. This follows the two-weapon rule
  exactly, but at 40px it's closer to Twinfang. Purple and silver against red and plum, and curved against straight
  blades, still tell them apart.
- `rogue-shade-cape-crossed.svg` (**crossed**): both arms are before `body`. The fists peek out under the chin and the
  blades cross in an X ahead of the face. This keeps the Shade's own look and makes the two rogues differ more.
- Still weak: in the crossed version only slivers of the fists show. In the spread version the outline bunches a
  little under the blade tips.

## Dropped, as asked
Bandit no-mask and Shade collar weren't carried over.
