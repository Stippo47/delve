// Round 16 (the balance audit): a second, plain check of the queued-blow bug the recorder flags (report section 4).
// One hero against one foe, n seeds: casts of each ability, the shots that actually left the hero (by ability and kind),
// and how often another cast came within 0.5 s of one.   node tools/audit/heroes/queue-check.mjs archer 2 wildmane 10
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await import('../../../js/battle.js');
const { setSeed } = await import('../../../js/util.js');
const { freshSave } = await import('../../../js/save.js');
const { AUDIT } = await import('../../../js/stats.js');
const save = freshSave(); save.cheat = true;
const [hero, tier, foe, n] = [process.argv[2], +process.argv[3], process.argv[4] || 'wildmane', +(process.argv[5] || 10)];
const casts = {}, shots = {}, seen = new WeakSet(), lostAfter = {};
for (let i = 0; i < n; i++) {
  setSeed(300 + i);
  const run = B.newBattle(save, { arena: 'crypt', scaled: false, a: [{ k: hero, n: 1, tier }], b: [{ k: foe, n: 1, tier }] });
  const f = run.sides.a[0]; let pend = null;
  AUDIT.on = (ev, w, u, s, a, o) => { if (ev === 'cast' && u === f) { casts[o.ab] = (casts[o.ab] || 0) + 1; if (pend && w.time - pend.t < 0.5) { const k = pend.ab + ' then ' + o.ab; lostAfter[k] = (lostAfter[k] || 0) + 1; } pend = { ab: o.ab, t: w.time }; } };
  while (run.phase === 'fight' && run.t < 120) { B.updateBattle(run, 1 / 60); for (const p of run.world.projectiles) if (!seen.has(p)) { seen.add(p); if (p.owner === f) { const k = (p.ab || 'weapon') + ':' + p.kind; shots[k] = (shots[k] || 0) + 1; } } }
}
AUDIT.on = null;
console.log('casts', casts); console.log('shots', shots); console.log('another cast within 0.5 s of', lostAfter);
