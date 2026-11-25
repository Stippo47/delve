// Probe (round 19, lane caster19): Dirt Fling dirties foes (their helps washed off); the Digger's spade lands double on a
// dirtied foe and knocks the dirt off; Bury holds a foe in place and it comes up dirty; Sheaves break and hay.
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const S = await import('../../js/sim.js'), K = await import('../../js/kits.js'), K2 = await import('../../js/kits2.js');
const PATH = await import('../../js/path.js');
const w = S.makeWorld(900, 600); PATH.buildGrid && PATH.buildGrid(w);
const d = S.spawn(w, 'digger', 300, 300, { level: 9 }); K.initKit(d, 'digger', { nodes: { dirtFling1: 1, dirtFling2: 1, spadeBat1: 1, spadeBat2: 1, spadeBat3: 1 } }, 9);
const e = S.spawn(w, 'orc', 360, 300, { mult: 1 }); e.maxHp = e.hp = 9999; d.facing = 0;
S.addBuff(e, { id: 'rage', dur: 9, dealt: 1.3 });
K.ABILITIES.dirtFling.use(w, d, e, 2);
const dirtyOn = (u) => !!(u.h2 && u.h2.find((h) => h.id === 'dirty'));
console.log('foe dirty after fling:', dirtyOn(e), 'rage gone:', !e.buffs.some((b) => b.id === 'rage'), 'dirty buff:', e.buffs.some((b) => b.id === 'dirty'));
const hp0 = e.hp; S.hurt(w, e, 10, d, { knock: 40 }); const dmg1 = hp0 - e.hp;
const hp1 = e.hp; S.hurt(w, e, 10, d, { knock: 40 }); const dmg2 = hp1 - e.hp;
console.log('spade on dirty:', dmg1.toFixed(1), 'then plain:', dmg2.toFixed(1), 'dirt knocked off:', !dirtyOn(e));
// clods behind
const n0 = w.projectiles.length; S.hurt(w, e, 10, d, { knock: 40 }); console.log('clods out behind:', w.projectiles.length - n0, w.projectiles.slice(-1).map((p) => [Math.round(p.x), Math.round(p.y)]));
// Bury
const f = S.spawn(w, 'orc', 340, 300, { mult: 1 }); f.maxHp = f.hp = 9999; d.facing = 0;
K.ABILITIES.spadeBat.use(w, d, f, 3);
for (let i = 0; i < 20; i++) { K2.kit2Tick(w, d, 1 / 60); S.step(w, 1 / 60); }
const x0 = f.x, y0 = f.y; f.kx = 500;
for (let i = 0; i < 60; i++) { d.atkT = 9; S.step(w, 1 / 60); K2.kit2Tick(w, d, 1 / 60); }
console.log('buried:', f.buried, 'moved while buried:', Math.hypot(f.x - x0, f.y - y0).toFixed(1));
for (let i = 0; i < 120; i++) { d.atkT = 9; S.step(w, 1 / 60); K2.kit2Tick(w, d, 1 / 60); } // (his own blows held: they would knock the dirt off)
console.log('up again:', !f.buried, 'dirty:', dirtyOn(f));
console.log('after: buried', f.buried, 'h2', (f.h2 || []).map((h) => h.id + ':' + (h.until - w.time).toFixed(2)).join(','), 'alive', !f.dead, 'stunT', f.stunT.toFixed(2), 'time', w.time.toFixed(2));
