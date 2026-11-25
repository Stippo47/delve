// a status stage stepped with a trace: node tools/preview18b/dbg-status.mjs id [secs] [way]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const [id, secs, way] = process.argv.slice(2);
const PS = await import('../../js/preview-sim.js');
const { setSeed } = await import('../../js/util.js');
setSeed(11);
const S = PS.makeStage({ t: 'status', id, way });
console.log('loop', S.loop, 'way', S.way, S.locked ? 'LOCKED ' + S.why : '');
let f = 0;
for (let i = 0; i < +(secs || S.loop) * 30; i++) {
  S.step(1 / 30);
  const s = S.hero;
  if (S.fires > f) { if (f === 0 || i % 15 === 0) console.log('  fire at', S.t.toFixed(2), 'srcSeen', S.srcSeen); f = S.fires; }
  if (i % 10 === 0) console.log(S.t.toFixed(2), s.kind, (s.x | 0) + ',' + (s.y | 0), 'hp', (s.hp / s.maxHp).toFixed(2), 'st', JSON.stringify(Object.fromEntries(Object.entries(s.st).filter(([, v]) => v > 0.5).map(([k, v]) => [k, Math.round(v)]))),
    'T', ['stunT', 'rootT', 'sleepT', 'frozenT', 'tauntT', 'invulnT', 'silencedT', 'guardT'].filter((k) => s[k] > 0).map((k) => k + s[k].toFixed(1)).join(' '), 'buffs', s.buffs.map((b) => b.id).join(','), 'h2', (s.h2 || []).map((h) => h.id).join(','),
    '|', S.dummies.map((o) => o.kind + ' ' + (o.x | 0) + ',' + (o.y | 0) + (o.act ? ' ' + o.act.type : '')).join('; '));
}
