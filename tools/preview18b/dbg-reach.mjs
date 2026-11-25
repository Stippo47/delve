// what a foe stage's heroes took, and from whom: node tools/preview18b/dbg-reach.mjs kind move rank
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const [id, move, rank] = process.argv.slice(2);
const PS = await import('../../js/preview-sim.js');
const { AUDIT } = await import('../../js/stats.js');
const { setSeed } = await import('../../js/util.js');
setSeed(11);
const S = PS.makeStage({ t: 'foe', id, move, rank: +rank });
let f = 0; console.log(S.scene);
AUDIT.on = (ev, w, u, src, amt, o = {}) => { if (w !== S.w) return; if ((ev === 'hurt' || ev === 'status') && u && u.team === 'hero') console.log(S.t.toFixed(2), ev, u.kind, '<-', src ? src.kind + '/' + src.team : 'null', o.by ? 'by ' + o.by.kind : '', (amt || 0).toFixed(1)); };
for (let i = 0; i < 2 * S.loop * 30; i++) { S.step(1 / 30); if (S.fires > f) { if (S.t - (S._lf || -9) > 0.8) console.log('FIRE', S.t.toFixed(2), 'loop', S.loops); S._lf = S.t; f = S.fires; } }
