// Round 18, lane res18: which heroes put which statuses on (and how much), from one battle each against a big pack of
// plain Bandits (no resistances), tier III everything. Picks the status-reliant heroes for bench.mjs.
//   node tools/audit/res18/census.mjs  -> tools/audit/res18/census.json
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const B = await imp('js/battle.js');
const SIM = await imp('js/sim.js');
const { setSeed } = await imp('js/util.js');
const { freshSave } = await imp('js/save.js');
const { AUDIT } = await imp('js/stats.js');
const { HEROES } = await imp('js/heroes.js');
const save = freshSave(); save.cheat = true;
const ownerOf = (u) => { let o = u; for (let i = 0; i < 6 && o; i++) { if (o.def && o.def.hero && !o.summonBy) return o; o = o.summonBy || o.ghostOf || o.owner || null; } return null; };
const out = {};
for (const hero of Object.keys(HEROES)) {
  const tally = {};
  for (const seed of [1, 2]) {
    setSeed(seed);
    let run; try { run = B.newBattle(save, { arena: 'crypt', size: 'l', a: [{ k: hero, n: 1, tier: 3 }], b: [{ k: 'bandit', n: 8 }] }); } catch (e) { continue; }
    const w = run.world, me = run.sides.a[0];
    for (const e of run.sides.b) { e.maxHp *= 20; e.hp = e.maxHp; e.dmgMul *= 0.05; }
    AUDIT.on = (ev, w2, u, src, amt, o) => { if (ev === 'status' && src && ownerOf(src) === me && u.team !== me.team) tally[o.type] = (tally[o.type] || 0) + amt; };
    for (let t = 0; t < 60; t += 1 / 60) { if (w.hitstop > 0) { w.hitstop -= 1 / 60; continue; } try { SIM.step(w, 1 / 60); } catch (e) { break; } }
    AUDIT.on = null;
  }
  for (const k in tally) tally[k] = Math.round(tally[k] / 120); // a second
  out[hero] = tally;
  console.log(hero, JSON.stringify(tally));
}
writeFileSync(resolve(ROOT, 'tools/audit/res18/census.json'), JSON.stringify(out, null, 1));
