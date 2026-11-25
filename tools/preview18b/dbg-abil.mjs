globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const [id, move, rank] = process.argv.slice(2);
const PS = await import('../../js/preview-sim.js');
const { setSeed } = await import('../../js/util.js');
setSeed(11);
const S = PS.makeStage({ t: 'foe', id, move, rank: +rank });
console.log(S.scene);
for (let i = 0; i < S.loop * 30; i++) { S.step(1 / 30); const u = S.hero; if (i % 6 === 0) { const t = u.target; console.log(S.t.toFixed(2), 'abilT', u.abilT.toFixed(2), 'act', u.act ? u.act.type : '-', 'spd', u.spd | 0, 'gap', t ? (Math.hypot(t.x - u.x, t.y - u.y) - t.r - u.r) | 0 : '-', 'own', S.own, 'def.ability', u.def.ability); } }
