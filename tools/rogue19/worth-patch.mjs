// ability-worth with one piece of a kit switched off (for finding what moved a hero's numbers):
//   node tools/rogue19/worth-patch.mjs <off: trait:<id> | none> <ability-worth args...>
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const off = process.argv[2]; process.argv.splice(2, 1);
await import('../../js/dungeon.js'); const K2 = await import('../../js/kits2.js');
if (off.startsWith('trait:')) { const T = K2.TRAITS2[off.slice(6)]; for (const k of Object.keys(T)) if (typeof T[k] === 'function') T[k] = () => undefined; T.dealt = (w, u, t, a) => a; T.taken = (w, u, s, a) => a; }
await import('../ability-worth.mjs');
