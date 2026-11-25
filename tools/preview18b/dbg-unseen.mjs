// what the unseen blows on a stage were (src, options): node tools/preview18b/dbg-unseen.mjs foe hellhound kit 1
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const [t, id, move, rank] = process.argv.slice(2);
const PS = await import('../../js/preview-sim.js');
const M = await import('../preview-measure.mjs');
const { AUDIT, newStats } = await import('../../js/stats.js');
const { setSeed } = await import('../../js/util.js');
setSeed(11);
const S = PS.makeStage(t === 'foe' ? { t, id, move, rank: +rank } : { t, id });
AUDIT.on = (ev, w, u, src, amt, o = {}) => {
  if ((ev === 'takenBuffs' || ev === 'block' || ev === 'keep') && u && !o.dot && !M.seenAny(u, src, o)) console.log(S.t.toFixed(2), ev, u.kind, '<-', src ? src.kind : 'null', JSON.stringify(Object.keys(o)), amt.toFixed(1));
};
for (let i = 0; i < 2 * S.loop * 30 + 10; i++) { if (!S.w.stats) S.w.stats = newStats(['paladin']); S.step(1 / 30); }
