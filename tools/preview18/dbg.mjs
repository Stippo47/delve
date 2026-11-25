// a one-off look at what blows reach the hero side with no source behind them, and where they come from
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js');
const { AUDIT } = await import('../../js/stats.js');
const [id, ab, tier] = process.argv.slice(2);
const S = PS.makeStage({ t: 'hero', id, move: ab, tier: +tier || 1 });
AUDIT.on = (ev, w, u, src, amt, o) => {
  if (u && u.team === 'hero' && ev === 'takenBuffs' && !src && !o.dot) console.log(S.t.toFixed(2), u.kind, amt.toFixed(1), Math.hypot(u.kx, u.ky).toFixed(0), JSON.stringify(o).slice(0, 120), new Error().stack.split('\n').slice(3, 6).map((l) => l.trim().replace(/.*js\//, '')).join(' < '));
};
for (let i = 0; i < 400; i++) S.step(1 / 30);
