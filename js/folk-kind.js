// The Villager (round 19, lane bases19): a test unit that wears the folk layers (js/folk.js). The designer: "I want you
// to make some "normal" looking bases. No armour or equipment, maybe just a basic sack tunic, then a bunch of hair
// styles and skin colours, facial hair, jewelry." Every villager is a different mix: its look is rolled once from its
// own id (never from the game's dice, so a fight plays the same with or without them), and drawn from parts like any
// hero: it walks, breathes and throws fists in turn (style.dual) with the game's outline round it. Plain and weak: no
// ability, nothing dropped. In battle mode it is on the "No dungeon yet" tab.
import { ART2 } from './looks2.js';
import { folkUrl, randomFolk, dice, parseFolkKey } from './folk.js';

// ?folk=<a look, as folk.js folkKey writes it> dresses every villager the same; ?folk=fantasy lets the fantasy skins in
let forced = null, fantasy = false;
try { const q = new URLSearchParams(globalThis.location ? globalThis.location.search : '').get('folk'); if (q === 'fantasy') fantasy = true; else if (q && q.includes('.')) forced = folkUrl(parseFolkKey(q)); } catch { /* no page (the batches) */ }

export const FOLK_KINDS = {
  villager: { team: 'enemy', name: 'Villager', art: 'art/folk/villager.svg', headR: 54, r: 31, vr: 22, turn: 5, accel: 260, face: 5, mass: 1, hp: 46, speed: 64,
    role: 'melee', range: 16, atkCd: 0.8, dmg: 5, arc: 1.4, temp: 0.4, commit: 0.8, xp: 0, coins: [0, 0], attackAnim: 'punch', weapon: 'thrust', style: { dual: true },
    home: 'crypt', folk: true },
};
// which folk this one is: rolled the first time it is drawn (art/folk/villager.svg, the plain base, is the kind's picture in pages)
export const folkOf = (u) => u._folk || (u._folk = forced || folkUrl(randomFolk(dice(Math.imul((u.id | 0) + 1, 2654435761) ^ 0x5F0C), { fantasy })));
ART2.villager = { art: folkOf };
