// One fight, printed: node tools/audit/cooldowns/try.mjs haymaker 2 group 1
import { fight } from './lib.mjs';
const [h = 'haymaker', tier = '2', sc = 'group', seed = '1'] = process.argv.slice(2);
const t0 = Date.now();
const r = fight(h, +tier, sc, +seed);
console.log(`${h} T${tier} ${sc} seed ${seed}: winner ${r.winner}, ${r.time.toFixed(1)}s fight, alive ${r.aliveT.toFixed(1)}s, ${r.casts.length} casts, ${Date.now() - t0} ms`);
for (const c of r.casts) console.log(` ${c.t.toFixed(1).padStart(6)} ${c.ab.padEnd(16)} cd ${c.cd.toFixed(1)} next ${c.next ?? '-'} atk ${c.atk} other ${c.other} re ${c.re}  ` +
  c.comps.map((k) => `${k.key}[${k.cls}] ${k.end == null ? 'open' : (k.end - c.t).toFixed(1) + 's'} cd>${k.cdEnd ?? '-'} ${k.why}`).join(' | '));
