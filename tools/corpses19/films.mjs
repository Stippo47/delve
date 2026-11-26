// Lane corpses19: the before/after films (each a real battle, staged through clip.mjs --eval, the same seed and staging
// both times). "before" is the game as the branch started (tools/corpses19/serve-overlay.mjs on --before, the changed
// files as they were), "after" this worktree (tools/serve.mjs on --after).
//   node tools/corpses19/serve-overlay.mjs 8979 <folder with the old js/...> .
//   node tools/serve.mjs 8975 .
//   node tools/corpses19/films.mjs [--before 8979] [--after 8975] [--out docs/clips/corpses19] [--only crowd,boulder] [--which before|after]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ports = { before: opt('before', '8979'), after: opt('after', '8975') }, out = path.resolve(opt('out', 'docs/clips/corpses19'));
const only = (opt('only', '') || '').split(',').filter(Boolean), which = opt('which', '') ? [opt('which')] : ['before', 'after'];
fs.mkdirSync(out, { recursive: true });

const PRELUDE = `(async () => {
  const SIM = await import('./js/sim.js'), PATH = await import('./js/path.js'), K = await import('./js/kits.js'), H = await import('./js/heroes.js');
  const R = GAME.run, w = R.world, CX = w.W / 2, CY = w.H / 2;
  const side = (s) => R.sides[s];
  const of = (s, k, i = 0) => R.sides[s].filter((u) => u.kind === k)[i];
  const put = (u, x, y, a) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; u.home = { x, y }; if (a != null) u.facing = u.mvA = a; };
  const tough = (u, hp = 4, dmg = 0.3) => { u.maxHp = Math.round(u.maxHp * hp); u.hp = u.maxHp; u.dmgMul *= dmg; };
  const frail = (u, hp) => { u.maxHp = hp; u.hp = hp; };
  const quiet = (u) => { if (u.kit) for (const k in u.kit.cd) u.kit.cd[k] = 999; };
  const tier = (u, t) => K.initKit(u, u.kind, { nodes: H.tierBuild(u.kind, t) }, 1);
  const hold = (u) => { u.stunT = 999; u.aggro = false; };
  const die = (u, by, knock = 0) => SIM.hurt(w, u, u.hp + 99999, by || null, { noDodge: true, knock });
  // the room cleared of its own obstacles; ours: rock / barrel (round, pillars) and crate (a square wall)
  w.pillars = []; w.walls = w.walls.filter((r) => !r.prop);
  const rock = (x, y, prop = 'rock') => w.pillars.push({ x, y, r: 33, prop, grid: true });
  const crate = (x, y) => w.walls.push({ x: x - 36, y: y - 36, w: 72, h: 72, prop: 'crate', grid: true });
  const cam = (x, y) => { w.camAt = { x, y }; };
  const done = {}; const at = (T, t, id, f) => { if (T >= t && !done[id]) { done[id] = true; f(); } };
  let T = 0, each = () => {};
  STAGE
  PATH.buildGrid(w);
  const rf = GAME.recFrame; GAME.recFrame = (dt) => { T += dt; try { each(T, dt); } catch (e) { console.error(e); throw e; } return rf.call(GAME, dt); };
})();`;

const FILMS = {
  // Twenty villagers brawl round two rocks, a barrel and a crate, made frail so they fall fast: bodies flying (over
  // everything while in the air), landing, lying under the living, their shadows and side rings, and under the rocks
  // and the crate (before: shoved out of them and drawn over them; over the living's shadows and rings).
  crowd: { battle: 'villager*9|villager*9', arena: 'wildwood', secs: 11, zoom: 1.7, stage: `
    rock(CX - 50, CY - 70); rock(CX + 55, CY - 45, 'barrel'); crate(CX - 15, CY + 45); rock(CX + 75, CY + 75);
    const A = side('a'), B = side('b');
    A.slice(0, 6).forEach((u, i) => { frail(u, 24); put(u, CX - 150 - (i % 2) * 45, CY - 110 + i * 42, 0); });
    B.slice(0, 6).forEach((u, i) => { frail(u, 24); put(u, CX + 150 + (i % 2) * 45, CY - 110 + i * 42, Math.PI); });
    // three stand by the obstacles and are struck down into them (each thrown at one)
    const by = [[B[6], CX + 125, CY - 45, Math.PI, 1.0], [A[6], CX - 95, CY + 45, 0, 1.7], [B[7], CX + 75, CY + 150, -Math.PI / 2, 2.4]];
    for (const [u, x, y] of by) { put(u, x, y); hold(u); tough(u, 50, 0); }
    for (const u of [A[7], A[8], B[8]]) { put(u, u.team === A[0].team ? CX - 420 : CX + 420, CY + 300); hold(u); tough(u, 50, 0); } // (kept out of it: the fight goes on)
    cam(CX + 15, CY + 55);
    each = (T) => { for (const [u, , , a, t] of by) at(T, t, 'k' + t, () => { u.stunT = 0; SIM.hurt(w, u, u.hp + 99999, null, { noDodge: true, knock: 300, kAngle: a }); }); };` },
  // A rock troll's boulder rolled through two bodies and a downed knight (and, after, the troll walking back over them).
  // Before: the ball plows the bodies along in front of it and the knight lies drawn over the ball; after: it rolls
  // over them all and they stay where they lay, under it.
  boulder: { battle: 'rockTroll|villager*3,paladin', arena: 'warren', secs: 6, zoom: 1.5, stage: `
    const tr = of('b', 'rockTroll'), V = side('a').filter((u) => u.kind === 'villager'), pal = of('a', 'paladin');
    put(tr, CX - 300, CY, 0); tough(tr, 5, 0);
    put(V[0], CX - 120, CY - 6); put(V[1], CX - 30, CY + 14); put(pal, CX + 70, CY - 4, 0); tough(pal, 1, 0);
    put(V[2], CX + 200, CY + 330); hold(V[2]); tough(V[2], 50, 0);
    quiet(pal);
    cam(CX - 40, CY);
    each = (T) => {
      at(T, 0.15, 'kill', () => { for (const v of [V[0], V[1]]) { v.kx = v.ky = 0; die(v, null, 0); } die(pal, null, 0); pal.bleedT = 99; });
      // (their killing blows threw them off its line: laid back on it, still, once they have landed)
      at(T, 0.9, 'lay', () => { w.corpses.forEach((c, i) => { c.x = CX - 110 + i * 85; c.y = CY + (i ? 12 : -8); c.kx = c.ky = c.vz = c.z = c.spin = 0; }); });
      at(T, 1.2, 'roll', () => { const b = tr.bould; if (!b) return; b.held = false; b.vx = 380; b.vy = 0; b.hits.clear(); });
    };` },
  // Skeletons (frail) against three heroes, a Necromancer on the skeletons' side: the knight goes down beside a rock,
  // skeletons walk over him; the Necromancer raises the fallen as minions. Before: the downed knight is drawn over the
  // rock and his ring over the skeletons stepping on him; the skeletons' bodies over the rock and crate. After: under.
  necro: { battle: 'rattler*5,necromancer|paladin,tower,cleric', arena: 'crypt', secs: 10, zoom: 1.7, stage: `
    const nec = of('b', 'necromancer'), pal = of('a', 'paladin'), tow = of('a', 'tower'), cle = of('a', 'cleric'), S = side('b').filter((u) => u.kind === 'rattler');
    rock(CX, CY - 42); crate(CX + 25, CY + 88);
    tier(nec, 2); quiet(nec); tough(nec, 6, 0.3); put(nec, CX + 260, CY + 10, Math.PI);
    put(pal, CX + 4, CY + 10, 0); quiet(pal); tough(pal, 1, 0.5);
    put(tow, CX - 120, CY - 15, 0); quiet(tow); tough(tow, 8, 1.4); put(cle, CX - 140, CY + 60, 0); quiet(cle); tough(cle, 8, 0.6);
    S.forEach((u, i) => { frail(u, 20); put(u, CX + 120 + (i % 2) * 35, CY - 60 + i * 38, Math.PI); });
    cam(CX + 40, CY + 40);
    each = (T) => {
      at(T, 0.4, 'down', () => { die(pal, S[0], 0); pal.bleedT = 99; });
      at(T, 5.0, 'raise', () => { nec.kit.cd.raiseDead = 0; });
    };` },
  // Bodies and what lies on the floor: villagers struck down into an oil slick, a burning patch, a gas cloud and a pool
  // of blood. Before: each body lay over them; after: on the bare floor, under them (it lies in the puddle).
  puddles: { battle: 'villager*5|villager*5', arena: 'crypt', secs: 6, zoom: 1.7, stage: `
    const A = side('a'), B = side('b'), spots = [[CX - 120, CY - 40, 'oil'], [CX + 10, CY - 60, 'fire'], [CX + 130, CY - 30, 'gas'], [CX - 40, CY + 90, 'blood']];
    for (const [x, y, type] of spots) { if (type === 'blood') (w._blood = w._blood || []).push({ x, y, r: 46, t0: 0, life: 99, seed: 3 }); else w.hazards.push({ type, x, y, r: 58, t: 99, max: 99 }); }
    const V = [...A, ...B]; V.forEach((u, i) => { put(u, CX - 300 + (i % 5) * 150, CY + (i < 5 ? 220 : 260)); hold(u); tough(u, 50, 0); });
    cam(CX, CY + 40);
    each = (T) => { spots.forEach(([x, y], i) => at(T, 0.6 + i * 0.5, 'k' + i, () => { const u = V[i]; put(u, x + 50, y + 10); u.stunT = 0; SIM.hurt(w, u, u.hp + 99999, null, { noDodge: true, knock: 120, kAngle: Math.PI }); })); };` },
  // The Sand Wurm killed with its rings out and the heroes round it: each ring drops and sinks into the sand. Before:
  // the lying rings drawn over the heroes walking by; after: once down, under them.
  wurm: { battle: 'sandWurm,scarab|paladin,dame,berserker,oldguard', arena: 'dunes', secs: 6, zoom: 1.3, stage: `
    const wu = of('b', 'sandWurm'), sp = of('b', 'scarab'); side('a').forEach((u) => { tough(u, 6, 1); });
    put(sp, w.W - 60, 60); hold(sp); tough(sp, 80, 0); // (a spare of its side, out of the way: the battle goes on after the wurm)
    let killAt = null;
    each = (T) => {
      const out = wu && wu.sw ? [wu, ...wu.sw.parts].filter((p) => !p.hidden).length : 0;
      if (!killAt && T > 1.5 && out >= 7 && !wu.dead) { killAt = T; cam(wu.x, wu.y); die(wu, side('a')[0], 0); }
      if (!killAt && T > 9) { killAt = T; die(wu, side('a')[0], 0); }
    };` },
  // The Cinder Drake (?bossmove=death: nearly dead, molten) brought down: it drops where it stood and cools to a husk
  // that stays; the heroes walk over it. (This one already lay under everything; filmed to show it still does.)
  drake: { battle: 'cinder,imp|paladin,dame,berserker,oldguard,cleric', arena: 'ember', secs: 9, zoom: 1.0, q: 'bossmove=death', stage: `
    const dr = of('b', 'cinder'), sp = of('b', 'imp'); side('a').forEach((u) => { tough(u, 6, 1); });
    put(sp, 60, 60); hold(sp); tough(sp, 80, 0);
    // (a spare of its side: the battle goes on after the drake; it is put past the husk, so the heroes walk over it to get there)
    each = (T) => { at(T, 1.2, 'kill', () => { if (dr && !dr.dead) { cam(dr.x, dr.y); die(dr, side('a')[0], 0); const a = Math.atan2(dr.y - CY, dr.x - CX) + Math.PI; put(sp, dr.x + Math.cos(dr.facing) * 260, dr.y + Math.sin(dr.facing) * 260); } }); };` },
  // The Great Engine brought down beside the heroes: its dome drops and its cog rolls off. Before: both drawn over the
  // heroes; after: on the floor under them (plates and bolts still fly over them while in the air).
  engine: { battle: 'greatEngine,gearSprite|paladin,dame,berserker,oldguard', arena: 'foundry', secs: 5, zoom: 1.1, stage: `
    const en = of('b', 'greatEngine'), sp = of('b', 'gearSprite'); side('a').forEach((u) => { tough(u, 6, 1); });
    put(sp, w.W - 60, 60); hold(sp); tough(sp, 80, 0); // (a spare of its side, out of the way: the battle goes on)
    each = (T) => { at(T, 2.0, 'kill', () => { if (en && !en.dead) { cam(en.x, en.y); for (const [i, u] of side('a').entries()) put(u, en.x + Math.cos(i * 1.6 + 2.2) * 120, en.y + Math.sin(i * 1.6 + 2.2) * 120); die(en, side('a')[0], 0); } }); };` },
};

for (const [name, c] of Object.entries(FILMS)) {
  if (only.length && !only.includes(name)) continue;
  for (const wh of which) {
    const file = path.join(out, `${name}-${wh}.mp4`);
    const ev = PRELUDE.replace('STAGE', c.stage);
    console.log('recording', name, wh);
    execFileSync(process.execPath, ['tools/clip.mjs', file, '--port', ports[wh], '--secs', String(c.secs), '--zoom', String(c.zoom), '--seed', '5', '--battle', c.battle,
      '--arena', c.arena, '--eval', ev, '--w', '960', '--h', '540', ...(c.q ? ['--q', c.q] : [])], { stdio: 'inherit' });
  }
}
