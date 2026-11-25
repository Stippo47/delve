import fs from 'node:fs';
function edit(f, pairs) {
  let s = fs.readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error(f + ' bad ' + a.slice(0, 90)); s = s.slice(0, i) + b + s.slice(i + a.length); }
  fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s); console.log('ok', f);
}
edit('js/sim.js', [[`export function stun(w, u, t) {`, `// Taunted (round 19, lane sys19; the designer on the Dame's Challenge: "Should show the agreed lines V over their head.
// For the taunted indicator. Already used somewhere else."): every taunt an ability or a trinket puts on goes through
// here: e goes for \`by\` for dur, and wears Hold the Line's red V over its head while it is held (fxkit.js drawBodyFx). A
// taunt topped up while it runs (the Warden's chains) keeps its mark without popping it in again. (A tank's blows drawing
// a foe's attention, hurt() below, is not a taunt anyone cast: no mark.)
export function taunt(w, e, by, dur) {
  if (!alive(e) || !by) return;
  e.tauntBy = by; e.tauntT = Math.max(dur, e.tauntBy === by ? e.tauntT || 0 : 0); e.target = by;
  if (!(e.vMarkBy === by && e.vMarkT > w.time)) e.vMarkT0 = w.time;
  e.vMarkBy = by; e.vMarkT = Math.max(e.vMarkT || 0, w.time + dur);
}
export function stun(w, u, t) {`]]);
edit('js/kits.js', [[`for (const e of foesNear(w, u, u.x, u.y, tier >= 2 ? 320 : 240)) { e.tauntBy = u; e.tauntT = dur; e.target = u; e.vMarkBy = u; e.vMarkT0 = w.time; e.vMarkT = w.time + dur;`,
  `for (const e of foesNear(w, u, u.x, u.y, tier >= 2 ? 320 : 240)) { taunt(w, e, u, dur); // (round 19: sim.js taunt, the one way in)`],
  [`  stun, heal as simHeal, addBuff, fx, zone as simZone, cleanse, wallRect, offFloor,`, `  stun, heal as simHeal, addBuff, fx, zone as simZone, cleanse, wallRect, offFloor, taunt,`]]);
edit('js/kits2.js', [[`for (const e of list) { e.tauntBy = u; e.tauntT = 4; e.target = u; k2(w, { draw: 'tauntMark', unit: e, x: e.x, y: e.y, r: e.vr, max: 1, ab: 'challenge' }); }`,
  `for (const e of list) taunt(w, e, u, 4); // (round 19, lane sys19: the agreed red V over the head, sim.js taunt; it was a "!" of its own)`],
  [`      t.tauntBy = u; t.tauntT = dur; t.target = u; u.target = t;`, `      taunt(w, t, u, dur); u.target = t; // (round 19: sim.js taunt, the red V)`]]);
edit('js/kits3.js', [[`u2.tauntBy = u; u2.tauntT = 0.6; if (!(u2.fearT > 0) && u2.team !== u.team) u2.target = u;`, `if (u2.team !== u.team) { const tg = u2.target; taunt(w2, u2, u, 0.6); if (u2.fearT > 0) u2.target = tg; } // (round 19: sim.js taunt, the red V)`],
  [`offFloor, silence } from './sim.js';`, `offFloor, silence, taunt } from './sim.js';`]]);
edit('js/trinkets.js', [[`best.target = u; best.tauntBy = u; best.tauntT = 3;`, `taunt(w, best, u, 3); // (round 19: sim.js taunt, the red V)`],
  [`import { hurt, addStatus, spawn, alive, hpRatio, puff, explode, blocked, stun, heal, fx, zone } from './sim.js';`, `import { hurt, addStatus, spawn, alive, hpRatio, puff, explode, blocked, stun, heal, fx, zone, taunt } from './sim.js';`]]);
