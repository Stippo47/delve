globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js');
const { DEFS } = await import('../../js/units.js');
const g = PS.foeGroups();
let n = 0;
for (const x of g) { console.log('##', x.id, x.name, x.kinds.length); for (const k of x.kinds) { const d = DEFS[k]; n++; console.log(' ', k, d.boss ? 'BOSS' : '', d.role, 'r' + d.r, PS.foeMoves(k, 2).map((m) => m.move).join(','), d.brain ? 'brain' : '', d.ability ? 'ab:' + (d.ability.name || typeof d.ability) : '', d.onDeath ? 'death' : '', d.splits ? 'splits' : '', d.dashCd ? 'dash' : '', d.hitSt ? 'hitSt:' + Object.keys(d.hitSt) : ''); } }
console.log('kinds', n);
