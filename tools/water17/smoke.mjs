// round 17 (lane water17): the Water Mage loads, and one battle with her runs
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { HEROES } = await import('../../js/heroes.js');
const { ABILITIES, TRAITS } = await import('../../js/kits.js');
const h = HEROES.waterMage; console.log(h.name, h.abilities.map((a) => a.id + ' cd ' + a.cd), h.stats);
for (const a of h.abilities) console.log(a.id, !!ABILITIES[a.id]); console.log('trait', !!TRAITS[h.trait.id]);
await import('../../js/fx-water.js').then(() => console.log('fx ok')).catch((e) => console.log('fx:', e.message));
