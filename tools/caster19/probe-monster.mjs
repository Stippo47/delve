// Probe (round 19, lane caster19): Monstrosity's monster punches: swing telegraphs, their weapon shape, blows landing.
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const S = await import('../../js/sim.js'), K = await import('../../js/kits.js'), PATH = await import('../../js/path.js'), FK = await import('../../js/fxkit.js');
const w = S.makeWorld(900, 600); PATH.buildGrid && PATH.buildGrid(w);
const a = S.spawn(w, 'alchemist', 300, 300, { level: 9 }); K.initKit(a, 'alchemist', { nodes: { bangFlask1: 1 } }, 9); for (const k in a.kit.cd) a.kit.cd[k] = 99;
const e = S.spawn(w, 'orc', 380, 300, { mult: 1 }); e.maxHp = e.hp = 9999; e.dmgMul = 0; a.target = e; e.target = a;
K.ABILITIES.bangFlask.use(w, a, e, 1);
let swings = 0, shapes = new Set(), hp0 = e.hp;
for (let i = 0; i < 180; i++) { S.step(w, 1 / 60); for (const t of w.telegraphs) if (t.type === 'swing' && t.src === a && !t._p) { t._p = 1; swings++; shapes.add(FK.weaponOf(a)); } }
console.log('monster', !!a.kit.monster, 'swings', swings, 'shapes', [...shapes], 'dealt', (hp0 - e.hp).toFixed(0), 'facing', a.facing.toFixed(2), 'anim', a.def.attackAnim, 'style', JSON.stringify(a.def.style));
