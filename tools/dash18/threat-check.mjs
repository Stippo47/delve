// Round 18, lane dash18: does js/threat.js see each of the six dashes coming? An enemy starts one at a hero held in
// place; every step threatened(w, hero, 1.5) is asked. Printed: when the threat was first seen, how long it said was
// left then, and when the blow really landed (the hero's health dropped). The warning must come before the blow.
//   node tools/dash18/threat-check.mjs
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const SIM = await import('../../js/sim.js');
const DZ = await import('../../js/dashes.js');
const { threatened } = await import('../../js/threat.js');
const save = freshSave(); save.cheat = true; let bad = 0;
const put = (u, x, y, a) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; if (a != null) u.facing = u.mvA = a; };
function go(name, start) {
  setSeed(3); const run = B.newBattle(save, { arena: 'crypt', a: [{ k: 'paladin', n: 1 }], b: [{ k: 'rattler', n: 1 }] }), w = run.world;
  w.pillars = []; w.walls = w.walls.filter((r) => r.solid);
  const h = w.units.find((u) => u.kind === 'paladin'), e = w.units.find((u) => u.kind === 'rattler'), cx = w.W / 2, cy = w.H / 2;
  put(h, cx + 60, cy, Math.PI); put(e, cx - 110, cy, 0); h.maxHp *= 9; h.hp = h.maxHp; h.react = 0; if (h.kit) for (const k in h.kit.cd) h.kit.cd[k] = 999;
  w.actor = e; start(w, e, h); w.actor = null;
  let t = 0, seen = null, said = null, hit = null; const hp0 = h.hp;
  while (e.act && e.act.dv && t < 4) { h.stunT = 0.1; put(h, cx + 60, cy); const th = threatened(w, h, 1.5); if (th && seen == null) { seen = t; said = th.t; } SIM.step(w, 1 / 60); t += 1 / 60; if (hit == null && h.hp < hp0) hit = t; }
  const ok = hit != null && seen != null && seen < hit;
  if (!ok) bad++;
  console.log(`${name.padEnd(10)} seen at ${seen == null ? ' never' : seen.toFixed(2) + 's'} (it said ${said == null ? '-' : said.toFixed(2) + 's'} to go)   landed at ${hit == null ? 'never' : hit.toFixed(2) + 's'}   ${ok ? 'ok' : 'NOT SEEN IN TIME'}`);
}
go('drawCut', (w, e, h) => DZ.drawCut(w, e, { a: 0, len: 300, dmg: 9, hit: {} }));
go('blinkChain', (w, e, h) => DZ.blinkChain(w, e, { targets: [h], n: 1, dmg: 9, hit: {} }));
go('hook', (w, e, h) => DZ.hook(w, e, { t: h, dmg: 9, hit: {} }));
go('feint', (w, e, h) => DZ.feint(w, e, { t: h, dmg: 9, hit: {} }));
go('dragFling', (w, e, h) => DZ.dragFling(w, e, { a: 0, len: 300, dmg: 9, hit: {} }));
go('pounce', (w, e, h) => DZ.pounce(w, e, { t: h, dmg: 9, hit: {} }));
console.log(bad ? `${bad} not seen in time` : 'all six are seen before they land');
process.exit(bad ? 1 : 0);
