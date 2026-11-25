// Round 18: what the Book's resistance chips say now, for the audit's four Book gaps. node tools/audit/res18/book-chips.mjs
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { DEFS } = await import('../../../js/units.js');
const US = await import('../../../js/unit-stats.js');
const fn = Object.values(US).find((f) => typeof f === 'function' && /foe|enemy/i.test(f.name));
for (const [k, th] of [['rattlerGold', 'crypt'], ['dustDevil', 'dunes'], ['alpha', 'wildwood'], ['turretGun', 'foundry'], ['skeleton', 'crypt']]) {
  if (!DEFS[k]) { console.log(k, 'no such kind'); continue; }
  try { const s = US.foeSheet(k, 0, { theme: th, floor: 1 }); console.log(k, s.res.map((r) => r.id + '=' + r.v).join(' ')); } catch (e) { console.log(k, 'ERR', e.message.slice(0, 100)); }
}
