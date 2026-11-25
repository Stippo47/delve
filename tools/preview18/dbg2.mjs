// a one-off: every blow the hero takes in one preview, and when its ability went
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js');
const { AUDIT } = await import('../../js/stats.js');
const [id, ab, tier, secs] = process.argv.slice(2);
const S = PS.makeStage({ t: 'hero', id, move: ab, tier: +tier || 1 });
AUDIT.on = (ev, w, u, src, amt, o) => {
  if (u === S.hero && (ev === 'takenBuffs' || ev === 'block')) console.log(S.t.toFixed(2), ev, src ? src.kind : '-', amt.toFixed(1), 'hp', (u.hp / u.maxHp).toFixed(2));
  if (ev === 'score' && u === S.hero && o.ab === ab && Math.random() < 0.3) console.log(S.t.toFixed(2), 'score', raw(amt));
  if (ev === 'abRun' && u === S.hero && o.at === 'pre') console.log(S.t.toFixed(2), 'RUN', o.ab);
};
const raw = (x) => x.toFixed(2);
let L = S.loops;
for (let i = 0; i < (+secs || 6) * 30; i++) { S.step(1 / 30); if (S.loops !== L) { L = S.loops; console.log('--- loop', S.castT, S.byBrain, S.forced); } }
console.log('end', S.t.toFixed(2), 'castT', S.castT, 'brain', S.byBrain, 'forced', S.forced, 'casts', S.casts, 'loop', S.loop.toFixed(2), 'scene', S.scene);
