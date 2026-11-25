globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js');
const { STATUSES } = await import('../../js/bestiary.js');
for (const id of PS.statusIds()) console.log(id.padEnd(12), String(PS.statusHow(id)).padEnd(6), PS.statusWays(id) ? 'ways' : '    ', ((STATUSES[id] || {}).name || ''), '|', ((STATUSES[id] || {}).desc || (STATUSES[id] || {}).what || '').slice(0, 110));
