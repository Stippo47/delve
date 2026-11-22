# Art the designed bosses need (lane B, round 10)

> **Round 13 (bosses3, 2026-11-22): this list is out of date.** The Great Engine, the Sand Wurm, Cinder and the Great
> Ooze are drawn in code as jointed figures (`js/boss-<id>-fx.js`, the kit in `js/boss-draw.js`): they bend, step, stretch
> and break in ways one SVG can't, so they need no art unless the designer asks for it. The Spire's boss is the art
> lane's biblical angel (`art/bosses/biblical-angel.svg`). The camp, the hall and the sanctum are drawn in code to
> match. What art could still add: the Winter Queen's ice mirrors, the angel's trumpets and chains, the war drums.

**Art round 9 (lane A, wave 11)** drew the Goblin Chieftain, the Winter Queen, the Gilded Seraph (and her fallen
look, not swapped in yet) and her choir singer (design/class-round9, art/bosses/). The rest below is still to do:
the drums, the tunnel mouths and stage, the ice dais and wall, the sun blades, and the bosses drawn in code.

Everything below is a PLACEHOLDER today: either an existing sprite recoloured and scaled (`js/recolor.js`), or simple
parts drawn in code in `js/fx-boss.js`. Real art in the game's style: top-down bust, matte, ink outline, **no eyes**,
built in parts like the heroes (`art/heroes/*.svg`, `js/parts.js`) where a unit has arms that move. Parts that are their
own units (segments, hands, blades, drums) are drawn top-down and turn with the unit's facing.

| boss | now | needs |
|---|---|---|
| **Goblin Chieftain** (Warren) | `art/enemies/orc.svg` recoloured warmer | the chief: orc-wide goblin, war paint, a cleaver (right), spears bundled on the back, a bone-and-feather headdress; a throwing pose for the spear |
| | war drums drawn in code | a war drum from above (hide skin, painted hand, rim, sticks), and a broken drum |
| | tunnel mouths, the hide stage drawn in code | a tunnel-mouth prop for the side walls; the chief's stage (hides, bone spikes) |
| **Great Ooze** (Sewers) | drawn in code: a wobbling blob with things inside | a big slime body with depth (rubbish, bones, a rusted grate floating inside), squash/stretch frames for the hop; a paler "melting" look for phase 4 |
| | tentacles drawn in code | the Thing's arm: a tapering suckered tentacle rising from water (a curl at the edge, and a full lash) |
| **Winter Queen** (Frost Hollow) | the Frost Mage hero's art, paler and bigger | the queen: tall, an ice crown, a long train, hands that cast; her images are the same art, a touch see-through |
| | ice dais drawn in code; walls use the Frost Mage's ice-wall blocks | a dais of ice; a wall of ice made for a long line (the blocks read as a dotted line from far off) |
| **Cinder** (Ember Deep) | every part drawn in code | a wingless drake in parts: a long horned head (mouth that opens and glows for the scorch), 5 armoured back segments sized 42 down to 32, a bladed tail; a broken-tail stump; molten crack overlays for phase 3 |
| **Gilded Seraph** (Gilded Spire) | the placeholder seraph recoloured gold; singers are cherubs recoloured | the seraph: six gold wings, a sun halo-less headdress (radiance has no halo), arms that cast; a fallen version (dark wings, purple); a choir singer |
| | sun blades drawn in code | a floating gold sword from above, and its fallen (dark) look |
| **Sand Wurm** (Sunken Dunes) | drawn in code | the head from above: a round ringed maw with teeth; ringed segments 40 down to 26; a tail tip; a burrow mound and a hole; its shadow should hide while it's under |
| **Great Engine** (Clockwork Foundry) | drawn in code | the head (riveted dome, furnace grille, gear teeth) cold and overheated; the hammer hand and the claw hand from above, and a broken hand's scrap; a rocket-fist trail |

Arena dressing that's in code today and could become props: the war camp's stage, the sanctum's floor sun, the pit's
lava pools, the dunes' ripples, the engine room's conveyor band.
