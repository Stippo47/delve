globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { DEFS } = await import('../../js/units.js');
await import('../../js/preview-sim.js');
for (const [k, d] of Object.entries(DEFS)) if (d.team === 'enemy' && !d.boss && !d.dummy && !d.part) console.log(k.padEnd(18), (d.role||'').padEnd(8), 'r', d.r, 'hp', d.hp, 'dmg', d.dmg, 'cd', d.atkCd, 'rng', d.range, 'spd', d.speed, d.brain ? 'BRAIN' : '', d.ability ? 'AB:' + (d.ability.name || typeof d.ability) : '', d.undead ? 'UNDEAD' : '', d.construct ? 'CONSTR' : '', d.shot || d.proj || '', d.dashCd ? 'dash' : '', d.tags ? JSON.stringify(d.tags) : '');
