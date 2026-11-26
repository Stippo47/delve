// lane bases19: what the boards and the design folder show: one entry per picture.
import { BASE, HAIRS, BEARDS, SKINS, BODIES, TUNICS, CLOTHS, JEWELS, HAIR_COLOURS, randomFolk, dice } from '../../js/folk.js';
const on = (spec) => ({ ...BASE, ...spec });
// each body type as itself (the base's bowl cut) so only the build changes
export const SETS = {
  body: Object.keys(BODIES).map((k) => ({ id: k, name: BODIES[k].name, spec: on({ body: k }) })),
  skin: Object.keys(SKINS).map((k) => ({ id: k, name: SKINS[k].name + (SKINS[k].fantasy ? ' (fantasy)' : ''), spec: on({ skin: k, hair: 'crop', hairCol: 'black' }) })),
  hair: Object.keys(HAIRS).map((k) => ({ id: k, name: HAIRS[k].name, spec: on({ hair: k }) })),
  haircol: Object.keys(HAIR_COLOURS).map((k) => ({ id: k, name: HAIR_COLOURS[k].name, spec: on({ hair: 'swept', hairCol: k, beard: 'scruff' }) })),
  beard: Object.keys(BEARDS).map((k) => ({ id: k, name: BEARDS[k].name, spec: on({ beard: k, hair: 'crop' }) })),
  jewel: Object.keys(JEWELS).map((k) => ({ id: k, name: JEWELS[k].name, spec: on({ jewels: [k], hair: 'slick', tunic: k === 'armbands' ? 'sleeveless' : 'sack' }) })),
  tunic: Object.keys(TUNICS).map((k) => ({ id: k, name: TUNICS[k].name, spec: on({ tunic: k }) })),
  cloth: Object.keys(CLOTHS).map((k) => ({ id: k, name: CLOTHS[k].name, spec: on({ cloth: k }) })),
  mixes: (() => { const r = dice(1909), out = []; for (let i = 1; i <= 20; i++) out.push({ id: String(i).padStart(2, '0'), name: 'Mix ' + i, spec: randomFolk(r) }); return out; })(),
};
