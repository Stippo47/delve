globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const [id, move, rank] = process.argv.slice(2);
const PS = await import('../../js/preview-sim.js');
const { setSeed } = await import('../../js/util.js');
setSeed(11);
const S = PS.makeStage({ t: 'foe', id, move, rank: +rank });
console.log(S.scene);
let f = 0;
for (let i = 0; i < 9 * 30; i++) { S.step(1 / 30); const u = S.hero; if (S.fires > f) { f = S.fires; console.log('FIRE', S.t.toFixed(2)); } if (i % 9 === 0) { const t = u.target; console.log(S.t.toFixed(2), JSON.stringify(u.g || u.b || {}).slice(0, 80), 'tgt', t ? t.kind : '-', 'd', t ? Math.hypot(t.x - u.x, t.y - u.y) | 0 : '-', 'hp', (u.hp / u.maxHp).toFixed(2), u.stunT > 0 ? 'STUN' : '', u.st.stagger | 0); } }
