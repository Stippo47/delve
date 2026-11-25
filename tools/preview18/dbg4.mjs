globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js');
const S = PS.makeStage({ t: 'hero', id: 'granny', move: 'oldBones', tier: 1 });
const u = S.hero; console.log('tiers', JSON.stringify(u.kit.tiers), 'used', u.kit.oldBonesUsed, Object.keys(u.kit.nodes).filter(k=>/old/.test(k)));
for (let i = 0; i < 45; i++) { S.step(1 / 30); if (u.downed || u.kit.oldBonesUsed) { console.log(S.t.toFixed(2), 'downed', u.downed, 'used', u.kit.oldBonesUsed, 'hp', u.hp); break; } }
