// Round 18, lane res18: evidence for the plain bugs in docs/audit/res18.md. MEASURES ONLY.
//   node tools/audit/res18/check.mjs
// 1. who the Paladin's Smite III and Consecrate III count as undead (kits.js isUndead: a test on the kind's name)
// 2. a chain (the Sand Serpent: a head and six coils) lying in burning ground builds Burn on its head once per coil
// 3. what the Book's resistance chips say (unit-stats.js: def.res only) against what really lands (kinds.json)
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const B = await imp('js/battle.js');
const SIM = await imp('js/sim.js');
const { setSeed } = await imp('js/util.js');
const { freshSave } = await imp('js/save.js');
const { DEFS } = await imp('js/units.js');
const K = await imp('js/kits.js');
const P = await imp('tools/audit/res18/proposal.mjs');
const save = freshSave(); save.cheat = true;

console.log('1. isUndead (kits.js) says undead:');
const said = Object.keys(DEFS).filter((k) => DEFS[k].team !== 'hero' && K.isUndead({ kind: k, def: DEFS[k] }));
console.log('   ' + said.map((k) => `${k} (${DEFS[k].name})`).join(', '));
const undead = P.TAGS.undead;
console.log('   wrongly undead: ' + said.filter((k) => !undead.includes(k)).join(', '));
console.log('   undead it misses: ' + undead.filter((k) => DEFS[k] && !said.includes(k)).map((k) => `${k} (${DEFS[k].name})`).join(', '));

console.log('\n2. a chain in burning ground (one step of the hazard loop, 34 burn a second):');
for (const kind of ['sandSerpent', 'chainCrawler', 'wolf']) {
  setSeed(1);
  const run = B.newBattle(save, { arena: 'crypt', size: 'l', a: [{ k: kind, n: 1 }], b: [{ k: 'paladin', n: 1, tier: 1 }] });
  const w = run.world, u = run.sides.a[0], src = run.sides.b[0];
  src.x = u.x + 900;
  SIM.step(w, 1 / 60);
  const body = w.units.filter((o) => o === u || o.linkTo === u);
  for (const o of body) for (const k in o.st) o.st[k] = 0;
  // the same as sim.js's hazard loop does for a fire patch under every body: addStatus(w, o, 'burn', 34 * dt)
  for (const o of body) SIM.addStatus(w, o, 'burn', 34 / 60);
  console.log(`   ${kind}: ${body.length} bodies, head's burn after one step ${(u.st.burn).toFixed(2)} (a lone body: ${(34 / 60).toFixed(2)}) = x${(u.st.burn / (34 / 60)).toFixed(1)}`);
}

console.log('\n3. the Book\'s chips (def.res) against what lands:');
const kinds = JSON.parse(readFileSync(resolve(ROOT, 'tools/audit/res18/kinds.json'), 'utf8'));
for (const r of kinds) {
  const t = r.takes.plain; if (!t || !Object.keys(t).length) continue;
  const d = DEFS[r.kind], hidden = [];
  for (const [s, v] of Object.entries(t)) { const shown = d.res && d.res[s] != null ? d.res[s] : 1; if (Math.abs(shown - v) > 0.01) hidden.push(`${s} shows ${shown} takes ${v}`); }
  if (hidden.length) console.log(`   ${r.kind} (${r.name}): ${hidden.join('; ')}`);
}
