// a foe stage stepped with a trace: node tools/preview18b/dbg-foe.mjs kind move rank [secs]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const [id, move, rank, secs] = process.argv.slice(2);
const PS = await import('../../js/preview-sim.js');
const { setSeed } = await import('../../js/util.js');
setSeed(11);
const S = PS.makeStage({ t: 'foe', id, move, rank: +rank });
console.log('scene', S.scene, 'loop', S.loop, 'size', S.size);
let f = 0, n = 0;
const T = +(secs || S.loop * 1);
for (let i = 0; i < T * 30; i++) {
  S.step(1 / 30);
  const u = S.hero;
  if (S.fires > f) { f = S.fires; if (n++ < 12) console.log('fire', S.t.toFixed(2)); }
  if (i % 15 === 0) console.log(S.t.toFixed(2), 'u', u.x | 0, u.y | 0, (u.hp / u.maxHp).toFixed(2), u.act ? u.act.type : '', 'tgt', u.target ? u.target.kind : '-', JSON.stringify(Object.fromEntries(Object.entries(u.el || {}).filter(([k, v]) => typeof v === 'number').map(([k, v]) => [k, +v.toFixed(2)]))), '|', S.dummies.map((o) => o.kind + ' ' + (o.x | 0) + ',' + (o.y | 0) + ' ' + (o.hp / o.maxHp).toFixed(2)).join('; '), 'danger', S.w.danger.length);
}
