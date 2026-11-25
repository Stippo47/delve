// Lane downed18: look for battle seeds where a Necromancer raises a bled-out hero's body (for the clip).
//   node tools/downed18/find-raise.mjs --a necromancer,paladin*2 --b archer*3 [--n 30]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const save = freshSave(); save.cheat = true;
const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0, tier: +opt('tier', 3) }; });
for (let i = 0; i < +opt('n', 30); i++) {
  const seed = +opt('seed', 100) + i; setSeed(seed);
  const run = B.newBattle(save, { arena: opt('arena', 'crypt'), size: opt('size', 's'), a: parse(opt('a')), b: parse(opt('b')) }), w = run.world;
  let t = 0; const got = [];
  while (!run.summary && t < 300) { const before = new Set(w.corpses); B.updateBattle(run, 1 / 60); t += 1 / 60;
    for (const c of before) if (!w.corpses.includes(c) && c.t > 0.2) got.push(`${t.toFixed(1)} ${c.kind}${c.bled ? ' (bled out)' : ''}`); }
  console.log(`seed ${seed}: ${run.summary.winner} ${run.t.toFixed(1)}s  raised: ${got.join(', ') || '-'}  log: ${run.log.map((e) => e.t.toFixed(1) + ' ' + e.ev + ' ' + e.side + ' ' + e.k).join(', ')}`);
}
