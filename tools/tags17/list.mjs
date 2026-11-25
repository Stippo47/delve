import { DEFS } from '../../js/units.js';
const rows = [];
for (const [k, d] of Object.entries(DEFS)) {
  const flags = ['boss','mini','part','turret','fixed','flies','fly','undead','fire','element','summon','construct','hops','splits','ethereal','rig','cargo'].filter(f => d[f] != null && d[f] !== false).map(f => f + (typeof d[f] === 'object' ? '' : '=' + String(d[f]).slice(0,12)));
  rows.push(`${k}\t${d.team}\t${d.name}\t${d.brain ? 'brain:' + (d.brain.name || '?') : ''}\t${d.ability || ''}\t${d.res ? JSON.stringify(d.res) : ''}\t${flags.join(',')}`);
}
console.log(rows.join('\n'));
