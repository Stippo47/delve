// a one-off: the wearer's health through a trinket or potion stage
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js');
const [t, id, move] = process.argv.slice(2);
const S = PS.makeStage(move ? { t, id, move, tier: 3 } : { t, id });
for (let i = 0; i < 150; i++) { S.step(1 / 30); if (i % 10 === 0) console.log(S.t.toFixed(2), 'hp', (S.hero.hp / S.hero.maxHp).toFixed(2), 'fires', S.fires, 'pot', S.hero.potions, S.hero.act && S.hero.act.type); }
