globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await import('../../js/battle.js'); const { setSeed } = await import('../../js/util.js'); const { freshSave } = await import('../../js/save.js');
setSeed(5); const save = freshSave(); save.cheat = true;
for (const k of ['cultist', 'paladin']) { save.heroes[k].owned = true; }
save.heroes.cultist.nodes = { bloodPact1: 1, ritualCircle1: 1, soulCandle1: 1 };
const run = B.newBattle(save, { arena: 'crypt', a: [{ k: 'cultist', n: 1 }, { k: 'paladin', n: 1 }], b: [{ k: 'orc', n: 2 }] });
const w = run.world, me = w.units.find((u) => u.kind === 'cultist'), P = w.units.find((u) => u.kind === 'paladin'), F = w.units.filter((u) => u.kind === 'orc');
const CX = w.W / 2, CY = w.H / 2; const put = (u, x, y) => { u.x = x; u.y = y; };
put(me, CX - 140, CY); put(P, CX + 10, CY + 20); put(F[0], CX + 60, CY); put(F[1], CX + 70, CY + 60);
for (const k in me.kit.cd) me.kit.cd[k] = 10; me.kit.riteW = w; me.kit.riteT = 99;
let t = 0;
for (let i = 0; i < 360; i++) { if (i === 60) { P.hp = P.maxHp * 0.08; me.kit.riteT = 0; } B.updateBattle(run, 1 / 60); t += 1 / 60;
  if (i % 20 === 0 || (P.downed && i % 10 === 0)) console.log(t.toFixed(2), 'P', P.x.toFixed(0), P.y.toFixed(0), P.downed ? 'DOWN' : P.hp.toFixed(0), 'me', me.x.toFixed(0), me.y.toFixed(0), me.act && me.act.type); }
