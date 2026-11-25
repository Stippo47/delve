globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const m = await import('../../js/units.js');
const { tagsOf } = await import('../../js/tags.js');
const D = m.DEFS || m.UNITS || m.default;
for (const [k, d] of Object.entries(D)) {
  if (d.team === 'hero') continue;
  console.log(k.padEnd(18), String(d.art || '').replace('art/', '').padEnd(34), String(d.attackAnim || '').padEnd(7), String(d.role||'').padEnd(8), d.proj ? JSON.stringify(d.proj).slice(0,20) : '', [...tagsOf(k, d)].join(','));
}
