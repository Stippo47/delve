import fs from 'node:fs';
function edit(f, pairs) {
  let s = fs.readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error(f + ' bad ' + a.slice(0, 90)); s = s.slice(0, i) + b + s.slice(i + a.length); }
  fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s); console.log('ok', f);
}
const R = '(round 19, lane sys19: no pinning, leash.js)';
edit('js/preview-sim.js', [
  [`import { makeWorld, spawn,`, `import { leash, holdWalk, freeWalk } from './leash.js'; // round 19 (lane sys19): "the bench stops pinning people"\nimport { makeWorld, spawn,`],
  [`      if (!cast && !u.act && !u.forcedGoal) { const k = Math.min(1, dt * 2); u.x += (u.home.x - u.x) * k; u.y += (u.home.y - u.y) * k; }`,
   `      if (!cast) leash(u, u.home, dt, 30); // ${R}: its walking is held till the ability goes; a knock plays out`],
  [`        if (!o.act && !o.forcedGoal) { const k = Math.min(1, dt * 3); o.x += (o.home.x - o.x) * k; o.y += (o.home.y - o.y) * k; }`,
   `        leash(o, o.home, dt, 50); // ${R}: a friend shoved, flung, carried or pulled stays where that put it a while`],
  [`    pin = { x: u.x, y: u.y }; did = {}; swingT = 0.5; turn = 0; lastShot = u.lastAttackT; S.hits = hitWatch(); S.hits2 = hitWatch();`,
   `    pin = { x: u.x, y: u.y }; did = {}; swingT = 0.5; turn = 0; lastShot = u.lastAttackT; S.hits = hitWatch(); S.hits2 = hitWatch(); holdWalk(u); // ${R}`],
  [`      else if (!did.free) { if (u.act) pin = { x: u.x, y: u.y }; else if (!u.downed) { u.x = pin.x; u.y = pin.y; u.vx = u.vy = 0; u.spd = 0; } }`,
   `      else if (!did.free) { if (u.act) pin = { x: u.x, y: u.y }; else leash(u, pin, dt, 24); } // ${R}`],
  [`      for (const o of allies) if (!o.downed && !o.dead) { o.atkT = 999; const k = Math.hypot(o.kx, o.ky) > 20 ? 0 : Math.min(1, dt * 5); o.x += (o.home.x - o.x) * k; o.y += (o.home.y - o.y) * k; if (!did.up) o.facing = 0; }`,
   `      for (const o of allies) if (!o.downed && !o.dead) { o.atkT = 999; holdWalk(o); leash(o, o.home, dt, 30); if (!did.up && !o._leashed) o.facing = 0; } // ${R}`],
  [`      if (held() && !u.dead && !u.act) { u.x = hold.x; u.y = hold.y; u.vx = u.vy = 0; }`,
   `      if (held()) holdWalk(u); else freeWalk(u); // ${R}: its walking held, not its place`],
  [`        if (o.baseMove != null && !o.act) { const q = Math.min(1, dt * 3), [hx, hy] = at(o.spec.at); o.x += (hx - o.x) * q; o.y += (hy - o.y) * q; }`,
   `        if (o.baseMove != null) { const [hx, hy] = at(o.spec.at); leash(o, { x: hx, y: hy }, dt, 30); } // ${R}: a charge's knock back plays out`],
  [`      if (trig && !trig.dead) { trig.atkT = 99; if (!trig._wound) { trig.x = trig.home.x; trig.y = trig.home.y; } }`,
   `      if (trig && !trig.dead) { trig.atkT = 99; if (!trig._wound) { holdWalk(trig); leash(trig, trig.home, dt, 20); } else freeWalk(trig); } // ${R}`],
  [`      else if (u.act) pin = { x: u.x, y: u.y };
      else if (!u.downed && !u.ethereal && scene !== 'drink') { u.x = pin.x; u.y = pin.y; u.vx = u.vy = 0; }
      if (scene === 'drink') { u.x = pin.x; u.y = pin.y; }`,
   `      else if (u.act) pin = { x: u.x, y: u.y };
      else { holdWalk(u); leash(u, pin, dt, 24); } // ${R}`],
  [`      if (ally && !ally.downed) { ally.atkT = 999; ally.x = ally.home.x; ally.y = ally.home.y; }`,
   `      if (ally && !ally.downed) { ally.atkT = 999; holdWalk(ally); leash(ally, ally.home, dt, 30); } // ${R}`],
]);
edit('js/lab.js', [
  [`import { buildGrid } from './path.js';`, `import { buildGrid } from './path.js';\nimport { leash, holdWalk } from './leash.js'; // round 19 (lane sys19): "the bench stops pinning people"`],
  [`    if (u.act) pin = { x: u.x, y: u.y };
    else if (!u.downed) { u.x = pin.x; u.y = pin.y; u.vx = u.vy = 0; }`, `    if (u.act) pin = { x: u.x, y: u.y };
    else { holdWalk(u); leash(u, pin, dt, 24); } // ${R}: a knock, a shove, a pull plays out; only far off does it walk back`],
  [`    if (ally) { ally.atkT = 999; ally.x = ally.home.x; ally.y = ally.home.y; for`, `    if (ally) { ally.atkT = 999; holdWalk(ally); leash(ally, ally.home, dt, 40); /* ${R} */ for`],
]);
