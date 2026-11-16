# Skeleton (enemy, rusty weapon): 4 designs on the approved base

Built on the base proportions: the skull is the ~92–96 wide head token centred on (100,100), the shoulder structure is about 160 wide centred around y 104–118, and the hands are about 24x20.
Rendering follows the archer: one #2B2230 silhouette, no inner lines, top-to-bottom gradients, a hard light/dark split on the skulls (lit from the left) and contact shadows.
Bone is never outlined against bone. Separate bones stand apart, so the silhouette ink shows between them (finger joints, collarbones, ribs, jaw gap). The body bones are one value darker than the skull.
**No eye sockets in any design.** The front of each skull has only a soft brow-shade gradient, a small inverted-triangle nose hole and teeth.
Source: build.py writes the SVGs. render.py makes the sheet (`python3 render.py sheet.png label=file.svg ...`). big.py makes close-up previews.

- **design-1 "Rattler"**: the classic grunt. Round dome skull, cheekbones flaring over a pinched muzzle, closed 4-tooth grin. The shoulder girdle is a ring of separate bones around the skull: a ridge running back to the spine, a ball joint, and a collarbone tucking under the chin. Claw hands. Notched rusty shortsword forward in the right hand.
- **design-2 "Gaper"**: a hunched scavenger. Long narrow skull pushed forward, with the lower jaw hanging open and detached (ink gap = gaping mouth). Three-vertebra hump trails out behind the skull. Hunched "coat-hanger" shoulders: collarbones swept back with knobbed dog-bone ends. Long four-finger hands both on a rusty spear angled forward-right.
- **design-3 "Brute"**: ogre skull, narrow at the back and widening to massive cheekbones. A separate heavy underbite jaw with lower-teeth bumps and two thick tusks. Big shoulder balls with paired forearm bones (radius and ulna, ink between) down to knuckle fists, gorilla stance. Rusty holed cleaver forward in the right fist.
- **design-4 "Hollow"**: tall narrow skull with a pointed little chin. Fanned ribs on both sides over a dark hollow chest. Fencer stance: right shoulder forward, left back, back hand raised. Rusty rapier with a cup guard thrust straight forward.

## Still weak
- Bone sits close to the #EDE6D8 sheet background, so figure-ground leans on the outline and the split. All four are less colourful than the archer: the only accent is rust. A darker or greener game floor would help, and a single cloth or rag accent per design would help too if wanted.
- At 40px the weapons are small. d1's shortsword and d4's rapier mostly read as a brown stick. d3's cleaver is the only weapon with real mass.
- d1 is the plainest of the four. Its girdle ring reads at 70px, but at 40px it is mostly "round skull with grin".
- d3 is the widest (~165 including the fists) and its square stance can read a little like a chair or robot. Its cleaver is partly covered by the fist.
- d4's raised back hand can look like a wave at big size.
- The skull split rotates with the sprite, the same as the archer's hood, so the light isn't world-fixed.
