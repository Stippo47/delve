globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { HEROES, HERO_IDS } = await import('../../js/heroes.js');
for (const k of HERO_IDS) { const h = HEROES[k];
  console.log(`${k} [${h.weapon || '-'}${h.proj ? ' proj:' + JSON.stringify(h.proj) : ''}] atk: ${h.attack && h.attack.name}`);
  for (const a of h.abilities) console.log(`   ${a.id}: ${a.name} -- ${a.desc.slice(0, 90)}`);
}
