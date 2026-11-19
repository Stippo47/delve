# H3: ranged and sly heroes (art round 4)

Ten heroes on the approved base head and shoulders, round-3 rendering (outline filter, top-left light, contact
shadows, no inner lines, subtle mouth, no eyes). Every weapon hand is a fist turned to its handle; weapons are drawn
behind the body/shoulder (arm group before `body`) and come out forward. Two-handed guns/crossbows are all in `arm-r`
(arm-l left out), held in front. Built by `design/class-round4/_src/H3/gen.py`; `render.py` makes the boards,
`lineup.py` makes `renders/_lineup.png` (all ten at 70px and 40px in 4 facings beside the archer and the rogues).

To tell them apart at 40px each has its own headgear shape and main colour:
crossbowman steel disc hat + red/yellow pavise, falconer rust beret + grey bird, grenadier orange knit cap + bombs,
harpooner big yellow sou'wester, huntress dark skin + ponytail + coral band, marksman teal slouch hat + plume,
ninja black hood + red tails, pirate black tricorn, slinger pale-blue headcloth + fleece, trapper grey raccoon cap + tail.

## Marksman (`ranged-marksman.svg`)
- Brief: long musket. Wide teal slouch hat with a cream plume sweeping back, crimson coat with a gold crossbelt.
  The musket runs under the right side of the head; rear fist on the wrist of the stock, front fist on the
  fore-stock, both turned along the barrel; long steel barrel with brass bands out front. Two-handed, all in arm-r.
- Suggested move: **Aimed shot**: stands still for a moment, then fires one long-range shot that pierces the
  first enemy and hits the one behind.
- Weak: the musket sits off to the right rather than dead centre (centre would hide it under the head); the plume
  edge notches are small.

## Ninja (`ranged-ninja.svg`)
- Brief: ninja. Charcoal hood and face wrap with only a slit of face, two crimson scarf tails trailing back from a
  red knot, katana slung on the back (hilt over the left shoulder), a big shuriken pinched in each hand (both arms
  before body).
- Suggested move: **Shuriken fan**: throws three shuriken in a spread; then vanishes into smoke and reappears a
  short step to the side.
- Weak: the face slit is the only skin, so at 40px it's a dark blob with a red tuft; that's the read, but it is the
  darkest sprite in the set. Shuriken aren't handles, so the fists are only pinching them.

## Crossbowman (`ranged-crossbowman.svg`)
- Brief: crossbow. Steel kettle hat (round crown, wide brim), dark slate gambeson, a tall pavise slung on the back
  (yellow and red halves, wood rim), heavy crossbow held in front with both fists side by side on the stock, the
  steel prod across ahead of the face, bolt pointing forward. All in arm-r.
- Suggested move: **Pavise**: plants the shield in front and shoots from behind it, taking much less damage from
  the front until it moves.
- Weak: the kettle hat is a big flat disc; at some angles the brim reads as a steel plate rather than a hat.

## Trapper (`ranged-trapper.svg`)
- Brief: hunter with traps. Grey raccoon-skin cap with a ringed tail hanging behind, buckskin coat, cream fur
  collar; an open jaw trap (steel ring with teeth) held out on a short chain in the right hand; left hand free.
- Suggested move: **Set trap**: drops a jaw trap at its feet; the first enemy to step on it is held in place for
  two seconds and bleeds.
- Weak: at 40px the trap reads as a small round steel thing (a cog?); the jaws are hard to show from above.
  The first try with the spring arms out to the sides read as a propeller, so they were dropped.

## Pirate (`ranged-pirate.svg`)
- Brief: cutlass and pistol. Black tricorn with gold edging, black hair and a big black beard, burgundy coat with
  gold epaulettes; curved cutlass with a gold guard in the left hand, flintlock pistol in the right, both coming out
  forward from under the shoulders.
- Suggested move: **Point blank**: fires the pistol at a close enemy for a big hit and knock-back, then fights with
  the cutlass while it "reloads".
- Weak: tricorn + beard is a lot of near-black around the face; the gold edge carries it.

## Javelin huntress (`ranged-javelin-huntress.svg`)
- Brief: javelin huntress (a woman). Darker skin, long dark hair down over the shoulders and a high ponytail tied
  with a coral band swinging back, coral headband with gold beads, spotted ochre pelt, two spare javelins slung on
  her back, a javelin in the right hand (shaft under the shoulder, head out forward), left hand up to aim.
- Suggested move: **Javelin**: throws a javelin that pins the first enemy hit (slowed for a moment); she picks it
  up again by walking over it, throwing faster while she has spares.
- Weak: "woman" carried by hair only (no faces by rule), same approach as Wildmane; check they don't feel alike
  (Wildmane has the wild mane, this one a sleek ponytail and darker skin).

## Grenadier (`ranged-grenadier.svg`)
- Brief: bombs. Orange-red knit cap with a cream turn-up and pompom, big brown handlebar moustache, olive coat with
  a strap, a burlap sack of bombs on the back, a lit bomb cupped in the right hand; left hand free.
- Suggested move: **Bomb lob**: lobs a bomb that lands after a short delay and blasts a small area (hits allies'
  enemies only, knocks them back).
- Weak: the moustache reads well big, at 40px it's a brown band; the bombs on the back carry the read more.

## Slinger (`ranged-slinger.svg`)
- Brief: shepherd with a sling. Pale-blue headcloth with a white stripe, held by a brown cord, draping down the
  back; a woolly fleece mantle over the shoulders; shepherd's crook in the left hand (hook forward), sling in the
  right (two cords, leather pouch with a stone). Both arms before body.
- Suggested move: **Sling stone**: a quick spinning windup and a stone that stuns the target for half a second;
  the crook can pull a downed ally one step closer (support flavour).
- Weak: the headcloth is plain; I tried blue-and-white stripes first but they looked like a beach towel and
  read as a helmet at 40px.

## Falconer (`ranged-falconer.svg`)
- Brief: bird on the arm. Rust-red beret worn tilted with a tan feather, brown hair, leather jerkin over green;
  a slate-grey falcon with half-spread wings sits on the leather gauntlet of the raised left fist (arm-l drawn
  after body so the bird is on top); right hand free.
- Suggested move: **Loose the falcon**: sends the bird at the farthest enemy; it marks it (everyone deals more
  damage to it) and pecks until it returns.
- Weak: the bird is in arm-l, so it swings with the arm; if the game launches it, it will need to be its own part.
  The falcon's two eye dots are the only eyes in the set (an animal, so allowed).

## Harpooner (`ranged-harpooner.svg`)
- Brief: harpoon on a rope. Yellow oilskin sou'wester (big round brim, long back flap), grey beard, navy knit
  sweater; a big barbed harpoon in the right hand (shaft under the shoulder, head out forward) with its rope
  looping across the front to a coil held in the left hand.
- Suggested move: **Reel in**: throws the harpoon at a far enemy and drags it back to him (or pulls himself to a
  heavy one).
- Weak: the rope crosses from arm-r's harpoon to arm-l's coil but is drawn in arm-l; when the arms swing it will
  detach from the harpoon. The game may want the rope drawn live between the two.

## Parts note (all ten)
Groups in file order inside `#sprite`: `back` (optional), weapon arm(s) before `body`, `body`, then any free hand or
the falcon arm after `body`. Pivots: arm-l 46 108, arm-r 154 108. Marksman and crossbowman have no arm-l (both
hands on the gun in arm-r).
