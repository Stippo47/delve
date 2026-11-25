// a one-off: units and events in one preview over time
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const PS = await import('../../js/preview-sim.js');
const { AUDIT } = await import('../../js/stats.js');
const [id, ab, tier, secs, what] = process.argv.slice(2);
const S = PS.makeStage({ t: 'hero', id, move: ab, tier: +tier || 1 });
AUDIT.on = (ev, w, u, src, amt, o) => {
  if (what && !what.split(',').includes(ev)) return;
  if (['abRun', 'cast', 'hurt', 'block', 'buff', 'hook', 'heal', 'status'].includes(ev) && (u === S.hero || src === S.hero || (src && src.summonBy) || ev === 'buff'))
    console.log(S.t.toFixed(2), ev, u ? u.kind : '-', src ? src.kind : '-', typeof amt === 'number' ? amt.toFixed(1) : amt, JSON.stringify(Object.fromEntries(Object.entries(o || {}).filter(([k, v]) => typeof v !== "object"))).slice(0, 90));
};
let L = S.loops;
for (let i = 0; i < (+secs || 5) * 30; i++) { S.step(1 / 30); if (S.loops !== L) { console.log('--- new loop'); L = S.loops; } }
console.log('units', S.w.units.map((u) => u.kind + '@' + (u.x | 0) + ',' + (u.y | 0) + ' ' + (u.hp | 0) + '/' + u.maxHp).join(' | '));
