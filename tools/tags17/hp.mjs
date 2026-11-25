import { DEFS } from '../../js/units.js';
for (const k of process.argv.slice(2)) { const d = DEFS[k]; console.log(k, d && d.hp, d && d.res && JSON.stringify(d.res), d && d.boss ? 'boss' : '', d && d.flies, d && d.fly); }
