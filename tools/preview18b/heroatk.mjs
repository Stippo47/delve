globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { HEROES } = await import('../../js/heroes.js');
const { DEFS } = await import('../../js/units.js');
const K = ['burn','chill','poison','wet','shock','stagger','radiance','curse','entangle','charm','confuse','sleepy','bleed','fear','shackle','whirl','spin'];
for (const id of Object.keys(HEROES)) { const d = DEFS[id]; const c = K.filter((k) => d[k] > 0).map((k) => k + d[k]); console.log(id.padEnd(14), d.role.padEnd(8), c.join(' '), '|', HEROES[id].abilities.map((a) => a.id).join(',')); }
