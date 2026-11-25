// Lane downed18: the log of fights where a hero went down beside a Valkyrie, to see why the Call did or didn't come.
//   node tools/downed18/why.mjs --a valkyrie,paladin --b wolf*8@2 [--n 8]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const save = freshSave(); save.cheat = true;
const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0, tier: 3 }; });
for (let i = 0; i < +opt('n', 8); i++) {
  setSeed(500 + i);
  const run = B.newBattle(save, { arena: opt('arena', 'crypt'), size: 'l', a: parse(opt('a')), b: parse(opt('b')) });
  let t = 0; while (!run.summary && t < 400) { B.updateBattle(run, 1 / 60); t += 1 / 60; }
  const valk = run.sides.a.concat(run.sides.b).filter((u) => u.kind === 'valkyrie').map((u) => `valk ${u.dead ? 'dead' : u.downed ? 'down' : 'up'} cd ${u.kit.cd.valkyrieCall != null ? u.kit.cd.valkyrieCall.toFixed(1) : '-'} tier ${u.kit.tiers.valkyrieCall}`);
  console.log(`seed ${500 + i}: ${run.summary.winner} in ${run.t.toFixed(1)}s  ${valk.join('; ')}`);
  for (const e of run.log) console.log(`   ${e.t.toFixed(1)} ${e.ev} ${e.side} ${e.k}${e.by ? ' by ' + e.by : ''}`);
}
