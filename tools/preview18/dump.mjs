globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { HEROES } = await import('../../js/heroes.js');
const { ABILITIES } = await import('../../js/kits.js');
const { DEFS } = await import('../../js/units.js');
let n = 0;
for (const [id, h] of Object.entries(HEROES)) {
  console.log(`## ${id} (${DEFS[id] && DEFS[id].role}) attack: ${h.attack.name} | trait ${h.trait.id}: ${h.trait.desc || ''}`);
  for (const a of h.abilities) { n++; const A = ABILITIES[a.id] || {};
    console.log(`  ${a.id} [${a.name}] cd${a.cd} ${A.reflex ? 'REFLEX ' : ''}${A.passiveTier ? 'PASSIVE ' : ''}${A.hook ? 'HOOK ' : ''}show=${JSON.stringify(A.show || {})} :: ${a.desc} || ${a.tiers.join(' | ')}`); }
}
console.log(n, Object.keys(HEROES).length);
