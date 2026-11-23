// Check that the audit's counting changes nothing: the same fights with and without it end the same way, to the frame.
// (Units' ids steer some of their wandering, so both runs make the same units in the same order: two processes.)
//   node tools/audit/foes/same.mjs            (runs both and compares)
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { boot, DT } from './lib.mjs';
import { instrument } from './instrument.mjs';
const mode = process.argv[2];
if (!mode) {
  const me = fileURLToPath(import.meta.url);
  const a = execFileSync(process.execPath, [me, 'plain']).toString().trim().split('\n'), b = execFileSync(process.execPath, [me, 'counted']).toString().trim().split('\n');
  let bad = 0; a.forEach((x, i) => { if (x !== b[i]) { bad++; console.log('DIFFERENT', i, '\n  plain  ', x, '\n  counted', b[i]); } });
  console.log(`${a.length} fights, ${bad} different`);
} else {
  const G = await boot();
  const R = G.B.battleRoster(G.save);
  const kinds = R.dungeons.flatMap((d) => d.kinds);
  const setups = [];
  for (let i = 0; i < kinds.length; i += 1) setups.push({ arena: 'crypt', size: 'l', scaled: i % 2 === 0, a: [{ k: kinds[i], n: 2, rank: 0 }], b: [{ k: kinds[(i * 7 + 3) % kinds.length], n: 2, rank: 0 }] });
  for (const b of R.dungeons.flatMap((d) => d.bosses)) setups.push({ arena: 'crypt', size: 'l', scaled: true, a: [{ k: 'paladin', n: 1, tier: 1 }, { k: 'archer', n: 1, tier: 1 }], b: [{ k: b, n: 1 }] });
  const I = instrument(G); I.warm();
  const show = (run) => run.winner + ' ' + run.t.toFixed(4) + ' ' + run.world.units.filter((u) => !u.dead).map((u) => Math.round(u.hp)).join(',');
  setups.forEach((s, i) => {
    if (mode === 'plain') { G.setSeed(777 + i); const run = G.B.newBattle(G.save, s); while (run.phase === 'fight' && run.t < 400) G.B.updateBattle(run, DT); if (run.phase === 'fight') G.B.callBattle(run); console.log(show(run)); }
    else console.log(show(I.fight(s, 777 + i).run));
  });
}
