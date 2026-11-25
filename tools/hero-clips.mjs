// Round 15 (lane N): the six new heroes' clips, recorded with tools/clip.mjs (one staged battle or run per clip).
//   node tools/hero-clips.mjs [--port 8974] [--only mob-pileOn,warden-attack] [--hero mob] [--out clips/r15/heroes] [--jobs 3]
// Needs the dev server (node tools/serve.mjs <port>). Each clip is a real battle (js/battle.js) or a real run, staged
// through clip.mjs --eval: who stands where, the enemies' health raised and their blows softened so the hero lives to
// show the move, and the move used at a set moment at the tier named (clip.mjs is told --nospend: it spends no skill
// points itself, the nodes are passed). Nothing here is read by the game.
// Edge: every run's profile folder is made under this lane's own temp folder (TEMP below), so anything left running
// can be told from other lanes' browsers by its command line and stopped without touching theirs.
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = opt('port', '8974'), out = path.resolve(opt('out', 'clips/r15/heroes')), jobs = +opt('jobs', 3);
const only = (opt('only', '') || '').split(',').filter(Boolean), heroOnly = opt('hero', '');
const TMP = path.join(os.tmpdir(), 'delve-lane-n-newheroes'); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(out, { recursive: true });

// What every stage script can use (runs in the page, after the battle or run has started).
const PRELUDE = (hero) => `(async () => {
  const K = await import('./js/kits.js'), FT = await import('./js/fxtag.js'), SIM = await import('./js/sim.js'), PATH = await import('./js/path.js'), K2 = await import('./js/kits2.js');
  const R = GAME.run, w = R.world, me = w.units.find((u) => u.kind === '${hero}');
  const CX = w.W / 2, CY = w.H / 2;
  const foes = () => w.units.filter((u) => u.team !== me.team && !u.dead && u.team !== 'neutral');
  const friends = () => w.units.filter((u) => u.team === me.team && u !== me && !u.partOf && !u.summon && !u.dead);
  const put = (u, x, y, a) => { const dx = x - u.x, dy = y - u.y; u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; u.home = { x, y }; if (a != null) u.facing = u.mvA = a; for (const b of u.bodies || []) { b.x += dx; b.y += dy; b.vx = b.vy = 0; if (a != null) b.facing = b.mvA = a; } };
  const tough = (list, hp = 3, dmg = 0.35) => { for (const u of list) { u.maxHp = Math.round(u.maxHp * hp); u.hp = u.maxHp; u.dmgMul *= dmg; } };
  const clear = (keep) => { w.pillars = keep ? w.pillars : []; w.walls = w.walls.filter((r) => r.solid); PATH.buildGrid(w); };
  const use = (ab, tier, t, by = me) => { by.kit.cd[ab] = 99; by.kit.using = ab; if (t) by.target = t; try { FT.tagAbility(w, by, ab, tier, () => K.ABILITIES[ab].use(w, by, t, tier)); } finally { by.kit.using = null; } };
  const quiet = (u) => { for (const k in u.kit.cd) u.kit.cd[k] = 999; };
  const done = {}; const at = (T, t, id, f) => { if (T >= t && !done[id]) { done[id] = true; f(); } };
  quiet(me); for (const f of friends()) if (f.kit) quiet(f);
  let T = 0, each = () => {};
  STAGE
  const rf = GAME.recFrame; GAME.recFrame = (dt) => { T += dt; try { each(T, dt); } catch (e) { console.error(e); throw e; } return rf.call(GAME, dt); };
})();`;

// name: { hero, battle (Red | Blue) or run: party, t: the tier of each of its three abilities (three digits), secs, zoom, follow, q, stage }
const N = (hero, t) => { const ids = ABS[hero]; return hero + ':' + (ids.flatMap((id, i) => Array.from({ length: +t[i] }, (_, k) => id + (k + 1))).join('+') || 'root'); };
const ABS = { mob: ['pileOn', 'surround', 'scatter'], clockwork: ['rewind', 'timeBubble', 'stopClock'], airMage: ['gale', 'updraft', 'cyclone'], warden: ['manacle', 'nullify', 'chainGang'],
  telekinetic: ['hurl', 'levitate', 'mindShield'], earthMage: ['earthquake', 'spikeChain', 'stoneWall'], waterMage: ['bubbleShield', 'waterDome', 'waterCannon'] };
const CLIPS = {
  // ------------------------------------------------------------ the Mob
  'mob-attack': { hero: 'mob', battle: 'rattlerMace*1,rattler*1|mob', t: '000', secs: 6, stage: `
    clear(); put(me, CX - 60, CY, 0); const F = foes(); tough(F, 4, 0.3); put(F[0], CX + 70, CY - 20, Math.PI); put(F[1], CX + 90, CY + 60, Math.PI);` },
  'mob-pileOn': { hero: 'mob', battle: 'brute*1,rattler*2|mob', t: '300', secs: 7, stage: `
    clear(); put(me, CX - 90, CY, 0); const F = foes(), big = F.find((u) => u.kind === 'brute'); tough(F, 3, 0.3); put(big, CX + 70, CY, Math.PI); F.filter((u) => u !== big).forEach((u, i) => put(u, CX + 170, CY + (i ? 90 : -90), Math.PI));
    each = (T) => { at(T, 1.0, 'a', () => use('pileOn', 3, big)); };` },
  'mob-surround': { hero: 'mob', battle: 'rattler*5|mob', t: '030', secs: 7, stage: `
    clear(); put(me, CX - 150, CY, 0); const F = foes(); tough(F, 3, 0.3); [[60, -70], [120, 10], [50, 60], [150, -60], [140, 90]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));
    each = (T) => { if (T < 0.9) for (const u of F) { u.atkT = 1; u.vx = u.vy = 0; u.x = u.home.x; u.y = u.home.y; } at(T, 0.9, 'a', () => use('surround', 3, F[1])); };` },
  'mob-scatter': { hero: 'mob', battle: 'rattlerMace*4|mob', t: '003', secs: 7, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 3, 0.5); F.forEach((u, i) => put(u, CX + 60 + (i % 2) * 50, CY + (i - 1.5) * 55, Math.PI));
    each = (T) => { at(T, 1.6, 'hp', () => { me.hp = me.maxHp * 0.45; }); at(T, 1.8, 'a', () => use('scatter', 3, F[0])); };` },
  'mob-trait': { hero: 'mob', battle: 'brute*1|mob', t: '000', secs: 8, stage: `
    clear(); put(me, CX - 60, CY, 0); const F = foes(); tough(F, 6, 0.2); put(F[0], CX + 40, CY, Math.PI);
    each = (T) => { at(T, 3.2, 'a', () => { me.bodies.forEach((b, i) => { const a = 2.2 + i * 1.0; b.kx = Math.cos(a) * 900; b.ky = Math.sin(a) * 900; }); }); };` },
  'mob-revive': { hero: 'mob', run: 'mob,paladin,cleric', t: '111', secs: 9, extra: ['--quiet'], stage: `
    const pal = friends().find((u) => u.kind === 'paladin');
    each = (T) => { at(T, 0.8, 'a', () => SIM.hurt(w, me.bodies[1], 99999, null, { noDodge: true })); };` },
  'mob-walk': { hero: 'mob', run: 'mob,paladin,archer', t: '111', secs: 6, extra: ['--quiet'], stage: `` },
  'mob-area': { hero: 'mob', battle: 'rattler*1|mob', t: '000', secs: 5, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 3, 0); put(F[0], CX + 120, CY, Math.PI); me.barAlways = true;
    each = (T) => { for (const u of F) { u.atkT = 1; u.x = u.home.x; u.y = u.home.y; } me.target = null; for (const b of me.bodies) b.target = null;
      at(T, 1.2, 'a', () => { SIM.explode(w, me.x - 20, me.y, 90, me.maxHp * 0.12, {}, F[0], '#FF8A3D'); }); at(T, 3.0, 'b', () => { SIM.hurt(w, me.bodies[0], me.maxHp * 0.12, F[0], { noDodge: true }); }); };` },
  // ------------------------------------------------------------ the Clockmaker
  'clockwork-attack': { hero: 'clockwork', battle: 'rattlerMace*2|clockwork', t: '000', secs: 5, stage: `
    clear(); put(me, CX - 170, CY, 0); const F = foes(); tough(F, 3, 0.3); put(F[0], CX + 40, CY - 30, Math.PI); put(F[1], CX + 70, CY + 50, Math.PI);` },
  'clockwork-rewind': { hero: 'clockwork', battle: 'brute*1|clockwork,paladin', t: '200', secs: 7, stage: `
    clear(); const pal = friends()[0], F = foes(); tough(F, 3, 0.3); put(me, CX - 230, CY + 40, 0); put(pal, CX - 60, CY - 10, 0); put(F[0], CX + 40, CY, Math.PI);
    each = (T) => { at(T, 2.4, 'hit', () => { SIM.hurt(w, pal, pal.maxHp * 0.5, F[0], { noDodge: true, knock: 520, kAngle: 2.6 }); SIM.addStatus(w, pal, 'burn', 60, F[0]); }); at(T, 3.1, 'a', () => use('rewind', 2, F[0])); };` },
  'clockwork-rewind3': { hero: 'clockwork', run: 'clockwork,paladin', t: '300', secs: 7, extra: ['--quiet'], stage: `
    const pal = friends()[0];
    each = (T) => { at(T, 1.6, 'hit', () => SIM.hurt(w, pal, 99999, null, { noDodge: true })); at(T, 2.6, 'a', () => use('rewind', 3, null)); };` },
  'clockwork-timeBubble': { hero: 'clockwork', battle: 'rattler*4,rattlerBow*2|clockwork,paladin', t: '020', secs: 8, stage: `
    clear(); const pal = friends()[0], F = foes(), bows = F.filter((u) => u.kind === 'rattlerBow'), mel = F.filter((u) => u.kind !== 'rattlerBow'); tough(F, 3, 0.3);
    put(me, CX - 240, CY, 0); put(pal, CX - 110, CY, 0); mel.forEach((u, i) => put(u, CX + 60 + (i % 2) * 50, CY + (i - 1.5) * 50, Math.PI)); bows.forEach((u, i) => put(u, CX + 230, CY + (i ? 70 : -70), Math.PI));
    each = (T) => { at(T, 1.3, 'a', () => use('timeBubble', 2, mel[1])); };` },
  'clockwork-stopClock': { hero: 'clockwork', battle: 'rattler*3,rattlerBow*3|clockwork,archer', t: '003', secs: 7, stage: `
    clear(); const arc = friends()[0], F = foes(), bows = F.filter((u) => u.kind === 'rattlerBow'), mel = F.filter((u) => u.kind !== 'rattlerBow'); tough(F, 3, 0.3);
    put(me, CX - 200, CY + 30, 0); put(arc, CX - 210, CY - 70, 0); mel.forEach((u, i) => put(u, CX + 10, CY + (i - 1) * 70, Math.PI)); bows.forEach((u, i) => put(u, CX + 200, CY + (i - 1) * 80, Math.PI));
    each = (T) => { if (!done.a && T > 1.2 && (w.projectiles.filter((p) => p.team !== me.team).length >= 2 || T > 2.6)) { done.a = true; use('stopClock', 3, mel[0]); } };` },
  'clockwork-trait': { hero: 'clockwork', battle: 'brute*1|clockwork', t: '000', secs: 7, stage: `
    clear(); const F = foes(); tough(F, 3, 0.4); put(me, CX - 200, CY - 60, 0); put(F[0], CX + 60, CY + 40, Math.PI); me.barAlways = true;
    each = (T) => { at(T, 3.6, 'a', () => SIM.hurt(w, me, 99999, F[0], { noDodge: true })); };` },
  // ------------------------------------------------------------ the Air Mage
  'airMage-attack': { hero: 'airMage', battle: 'rattlerMace*3|airMage', t: '000', secs: 5, stage: `
    clear(); put(me, CX - 190, CY, 0); const F = foes(); tough(F, 3, 0.3); F.forEach((u, i) => put(u, CX + 20 + i * 60, CY + (i - 1) * 8, Math.PI));` },
  'airMage-gale': { hero: 'airMage', battle: 'rattler*4,rattlerBow*1|airMage', t: '300', secs: 6, stage: `
    clear(); const F = foes(), bow = F.find((u) => u.kind === 'rattlerBow'), mel = F.filter((u) => u !== bow); tough(F, 3, 0.3);
    put(me, w.W - 470, CY, 0); mel.forEach((u, i) => put(u, w.W - 360 + (i % 2) * 50, CY + (i - 1.5) * 36, Math.PI)); put(bow, w.W - 150, CY, Math.PI);
    each = (T) => { at(T, 1.4, 'a', () => use('gale', 3, mel[1])); };` },
  'airMage-updraft': { hero: 'airMage', battle: 'orcShaman*1,rattler*2|airMage', t: '030', secs: 6, stage: `
    clear(); const F = foes(), sh = F.find((u) => u.kind === 'orcShaman'); tough(F, 3, 0.3); put(me, CX - 200, CY, 0); put(sh, CX + 40, CY, Math.PI); F.filter((u) => u !== sh).forEach((u, i) => put(u, CX + 20, CY + (i ? 56 : -56), Math.PI));
    each = (T) => { at(T, 1.1, 'a', () => use('updraft', 3, sh)); };` },
  'airMage-cyclone': { hero: 'airMage', battle: 'rattler*5|airMage', t: '003', secs: 9, stage: `
    clear(); const F = foes(); tough(F, 4, 0.3); put(me, CX - 230, CY, 0); F.forEach((u, i) => put(u, CX + 40 + (i % 2) * 70, CY + (i - 2) * 60, Math.PI));
    each = (T) => { at(T, 1.0, 'a', () => use('cyclone', 3, F[2])); };` },
  'airMage-trait': { hero: 'airMage', battle: 'rattler*4|airMage', t: '000', secs: 7, stage: `
    clear(); const F = foes(); tough(F, 4, 0.3); put(me, CX - 220, CY, 0); F.forEach((u, i) => put(u, CX + 30 + (i % 2) * 46, CY + (i - 1.5) * 44, Math.PI));
    each = (T) => { if (T > 1 && T < 3.2) K2.whirl(w, F[1], 3.4, me); };` },
  // ------------------------------------------------------------ the Warden
  'warden-attack': { hero: 'warden', battle: 'rattlerMace*1|warden', t: '000', secs: 10, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 40, CY, Math.PI);` },
  'warden-manacle': { hero: 'warden', battle: 'orcShaman*1,rattlerBow*2,rattler*1|warden', t: '300', secs: 7, stage: `
    clear(); const F = foes(), sh = F.find((u) => u.kind === 'orcShaman'), bows = F.filter((u) => u.kind === 'rattlerBow'), r = F.find((u) => u.kind === 'rattler'); tough(F, 3, 0.3);
    put(me, CX - 150, CY, 0); put(sh, CX + 110, CY - 30, Math.PI); bows.forEach((u, i) => put(u, CX + 150, CY + (i ? 120 : 50), Math.PI)); put(r, CX + 300, CY - 140, Math.PI);
    each = (T) => { at(T, 1.2, 'a', () => use('manacle', 3, sh)); };` },
  'warden-nullify': { hero: 'warden', battle: 'rattlerBow*4,orc*2|warden,paladin', t: '020', secs: 7, stage: `
    clear(); const pal = friends()[0], F = foes(), bows = F.filter((u) => u.kind === 'rattlerBow'), orcs = F.filter((u) => u.kind === 'orc'); tough(F, 3, 0.3);
    put(me, CX - 60, CY, 0); put(pal, CX - 90, CY + 80, 0); orcs.forEach((u, i) => put(u, CX + 40, CY + (i ? 60 : -50), Math.PI)); bows.forEach((u, i) => put(u, CX + 140 + (i % 2) * 20, CY + (i - 1.5) * 60, Math.PI));
    each = (T) => { at(T, 1.0, 'st', () => { SIM.addStatus(w, pal, 'burn', 70, F[0]); SIM.addStatus(w, pal, 'poison', 60, F[0]); for (const o of orcs) SIM.addBuff(o, { id: 'rage', dur: 9, dealt: 1.3, atkSpeed: 1.4 }); });
      if (!done.a && T > 1.5 && (w.projectiles.filter((p) => p.team !== me.team).length >= 2 || T > 2.8)) { done.a = true; use('nullify', 2, orcs[0]); } };` },
  'warden-chainGang': { hero: 'warden', battle: 'rattler*4|warden,archer', t: '003', secs: 8, stage: `
    clear(); const arc = friends()[0], F = foes(); tough(F, 3, 0.3); put(me, CX - 20, CY, 0); put(arc, CX - 230, CY + 90, 0); F.forEach((u, i) => { put(u, CX + 70 + (i % 2) * 40, CY + (i - 1.5) * 50, Math.PI); u.target = arc; });
    each = (T) => { if (T < 1.0) for (const u of F) u.target = arc; at(T, 1.0, 'a', () => use('chainGang', 3, F[0])); };` },
  'warden-trait': { hero: 'warden', battle: 'goblin*2|warden', t: '100', secs: 7, stage: `
    clear(); const F = foes(); tough(F, 6, 0.3); put(me, CX - 120, CY, 0); put(F[0], CX + 90, CY - 50, Math.PI); put(F[1], CX + 90, CY + 60, Math.PI);
    each = (T) => { at(T, 0.8, 'a', () => use('manacle', 1, F[0])); };` },
  'shackled-1-irons': { hero: 'warden', battle: 'rattlerMace*1|warden', t: '000', secs: 9, q: 'v_shackle=1', stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 40, CY, Math.PI);` },
  'shackled-2-wound': { hero: 'warden', battle: 'rattlerMace*1|warden', t: '000', secs: 9, q: 'v_shackle=2', stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 40, CY, Math.PI);` },
  'shackled-3-staked': { hero: 'warden', battle: 'rattlerMace*1|warden', t: '000', secs: 9, q: 'v_shackle=3', stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 40, CY, Math.PI);` },
  // ------------------------------------------------------------ the Telekinetic
  'telekinetic-attack': { hero: 'telekinetic', battle: 'rattlerMace*2|telekinetic', t: '000', secs: 5, stage: `
    clear(); put(me, CX - 180, CY, 0); const F = foes(); tough(F, 3, 0.3); put(F[0], CX + 40, CY - 30, Math.PI); put(F[1], CX + 70, CY + 50, Math.PI);` },
  'telekinetic-hurl': { hero: 'telekinetic', battle: 'rattler*4|telekinetic', t: '300', secs: 6, stage: `
    clear(); const F = foes(); tough(F, 3, 0.3); put(me, CX - 200, CY, 0); F.forEach((u, i) => put(u, CX + 60 + (i % 2) * 44, CY + (i - 1.5) * 40, Math.PI));
    w.pillars.push({ x: CX - 150, y: CY - 110, r: 30 }); PATH.buildGrid(w);
    each = (T) => { at(T, 1.0, 'a', () => use('hurl', 3, F[1])); };` },
  'telekinetic-levitate': { hero: 'telekinetic', battle: 'brute*1,rattler*3|telekinetic', t: '030', secs: 8, stage: `
    clear(); const F = foes(), big = F.find((u) => u.kind === 'brute'), rest = F.filter((u) => u !== big); tough(F, 3, 0.3); put(me, CX - 210, CY, 0); put(big, CX - 10, CY - 40, Math.PI); rest.forEach((u, i) => put(u, CX + 150 + (i % 2) * 30, CY + 60 + (i - 1) * 36, Math.PI));
    each = (T) => { if (T < 4.2) for (const u of rest) { u.x = u.home.x; u.y = u.home.y; u.vx = u.vy = 0; } at(T, 1.0, 'a', () => use('levitate', 3, big)); };` },
  'telekinetic-mindShield': { hero: 'telekinetic', battle: 'rattlerBow*4,rattler*2|telekinetic,archer', t: '003', secs: 8, stage: `
    clear(); const arc = friends()[0], F = foes(), bows = F.filter((u) => u.kind === 'rattlerBow'), mel = F.filter((u) => u.kind !== 'rattlerBow'); tough(F, 3, 0.3);
    put(me, CX - 120, CY, 0); put(arc, CX - 150, CY + 50, 0); mel.forEach((u, i) => put(u, CX + 20, CY + (i ? 70 : -70), Math.PI)); bows.forEach((u, i) => put(u, CX + 190, CY + (i - 1.5) * 64, Math.PI));
    each = (T) => { arc.x = arc.home.x; arc.y = arc.home.y; at(T, 1.2, 'a', () => use('mindShield', 3, mel[0])); };` },
  'telekinetic-trait': { hero: 'telekinetic', battle: 'rattler*3|telekinetic', t: '000', secs: 6, stage: `
    clear(); const F = foes(); put(me, CX - 180, CY, 0); F.forEach((u, i) => { put(u, CX + 30 + i * 70, CY + (i - 1) * 50, Math.PI); u.dmgMul *= 0.3; if (i) { u.maxHp *= 3; u.hp = u.maxHp; } else u.hp = 6; });` },
  // ------------------------------------------------------------ the Earth Mage
  'earthMage-attack': { hero: 'earthMage', battle: 'rattlerMace*2|earthMage', t: '000', secs: 5, stage: `
    clear(); put(me, CX - 180, CY, 0); const F = foes(); tough(F, 3, 0.3); put(F[0], CX + 40, CY - 30, Math.PI); put(F[1], CX + 70, CY + 50, Math.PI);` },
  'earthMage-earthquake': { hero: 'earthMage', battle: 'rattler*5|earthMage', t: '300', secs: 8, stage: `
    clear(); const F = foes(); tough(F, 4, 0.3); put(me, CX - 230, CY, 0); F.forEach((u, i) => put(u, CX + 30 + (i % 2) * 70, CY + (i - 2) * 50, Math.PI));
    each = (T) => { at(T, 1.0, 'a', () => use('earthquake', 3, F[2])); };` },
  'earthMage-spikeChain': { hero: 'earthMage', battle: 'rattler*5|earthMage', t: '030', secs: 6, stage: `
    clear(); const F = foes(); tough(F, 4, 0.3); put(me, CX - 230, CY, 0); [[20, -20], [120, 70], [190, -60], [290, 40], [330, -90]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));
    each = (T) => { if (T < 1) for (const u of F) { u.x = u.home.x; u.y = u.home.y; u.vx = u.vy = 0; } at(T, 1.0, 'a', () => use('spikeChain', 3, F[0])); };` },
  'earthMage-stoneWall': { hero: 'earthMage', battle: 'brute*2,rattlerBow*1|earthMage,archer', t: '003', secs: 12, stage: `
    clear(); const arc = friends()[0], F = foes(), br = F.filter((u) => u.kind === 'brute'), bow = F.find((u) => u.kind === 'rattlerBow'); tough(F, 3, 0.3);
    put(me, CX - 250, CY - 110, 0); put(arc, CX - 200, CY + 20, 0); br.forEach((u, i) => { put(u, CX + 120, CY + (i ? 60 : -30), Math.PI); u.target = arc; }); put(bow, CX + 260, CY + 20, Math.PI);
    each = (T) => { if (T < 1.2) for (const u of br) u.target = arc; arc.x = arc.home.x; arc.y = arc.home.y; at(T, 1.0, 'a', () => use('stoneWall', 3, br[0])); };` },
  'earthMage-trait': { hero: 'earthMage', battle: 'rattler*3|earthMage', t: '010', secs: 6, stage: `
    clear(); const F = foes(); tough(F, 4, 0.3); put(me, CX - 220, CY, 0); [[20, -30], [110, 50], [200, -40]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));
    each = (T) => { if (T < 1) for (const u of F) { u.x = u.home.x; u.y = u.home.y; u.vx = u.vy = 0; } at(T, 1.0, 'a', () => use('spikeChain', 1, F[0])); };` },
  // ------------------------------------------------------------ the Water Mage (round 17, lane water17; --out docs/clips/water17)
  // the beam on an enemy, then (the paladin knocked under 40%) swung onto the friend: healed and washed, not soaked
  'waterMage-beam': { hero: 'waterMage', zoom: 1.05, battle: 'rattlerMace*2|waterMage,paladin', t: '000', secs: 8, stage: `
    clear(); const pal = friends()[0], F = foes(); tough(F, 4, 0.2); put(me, CX - 150, CY + 60, 0); put(pal, CX - 50, CY - 30, 0); put(F[0], CX + 10, CY + 30, Math.PI); put(F[1], CX + 60, CY - 70, Math.PI);
    pal.potions = 0; each = (T) => { me.x = me.home.x; me.y = me.home.y; me.vx = me.vy = 0; pal.atkT = Math.max(pal.atkT, 0.5); at(T, 3.9, 'hit', () => { pal.hp = pal.maxHp * 0.3; SIM.addStatus(w, pal, 'burn', 70, F[0]); }); };` },
  // a bubble on the friend: three fire bolts stop on it, a sword goes through it, the third bolt pops it (soaked, the near one knocked back)
  'waterMage-bubble': { hero: 'waterMage', zoom: 1.05, battle: 'rattlerMace*1,seraph*1|waterMage,paladin', t: '100', secs: 8, stage: `
    clear(); const pal = friends()[0], F = foes(), mace = F.find((u) => u.kind === 'rattlerMace'), ser = F.find((u) => u.kind === 'seraph'); tough(F, 4, 0.25);
    put(me, CX - 230, CY + 70, 0); put(pal, CX - 60, CY, 0); put(mace, CX + 2, CY + 30, Math.PI); put(ser, CX + 230, CY - 60, Math.PI); me.atkT = 99;
    const bolt = () => { const a = Math.atan2(pal.y - ser.y, pal.x - ser.x); w.projectiles.push({ kind: 'bolt', color: '#FF8A3D', x: ser.x + Math.cos(a) * 34, y: ser.y + Math.sin(a) * 34, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, r: 7, team: ser.team, owner: ser, dmg: pal.maxHp * 0.13, o: { knock: 20, burn: 14 }, life: 1.4, a }); SIM.setAnim(ser, 'cast', 0.3); };
    each = (T) => { me.atkT = Math.max(me.atkT, 0.5); ser.atkT = 9; pal.atkT = Math.max(pal.atkT, 0.5); at(T, 0.9, 'a', () => use('bubbleShield', 1, mace)); at(T, 1.5, 'b1', bolt); at(T, 2.4, 'b2', bolt); at(T, 3.8, 'b3', bolt); at(T, 4.6, 'b4', bolt); };` },
  // the Dome (tier II): the skeletons outside pressed against its skin, the archers' arrows glancing off, the one caught inside soaked
  'waterMage-dome': { hero: 'waterMage', zoom: 1.05, battle: 'rattler*4,rattlerBow*2|waterMage,paladin,archer', t: '020', secs: 9, stage: `
    clear(); const [pal, arc] = friends(), F = foes(), bows = F.filter((u) => u.kind === 'rattlerBow'), mel = F.filter((u) => u.kind !== 'rattlerBow'); tough(F, 4, 0.3);
    put(me, CX - 150, CY, 0); put(pal, CX - 80, CY + 30, 0); put(arc, CX - 170, CY - 70, 0); mel.forEach((u, i) => put(u, CX + 130 + (i % 2) * 70, CY + (i - 1.5) * 60, Math.PI)); bows.forEach((u, i) => put(u, CX + 300, CY + (i ? 100 : -100), Math.PI));
    const caught = mel[3]; put(caught, CX - 60, CY - 60, Math.PI);
    each = (T) => { for (const f of [me, pal, arc]) { f.x = f.home.x; f.y = f.home.y; f.vx = f.vy = 0; } at(T, 1.0, 'a', () => use('waterDome', 2, mel[0])); };` },
  // the Water Cannon (tier III): down a line of skeletons, through the hurt paladin standing in it (healed, burning put out), following the one it was aimed at
  'waterMage-cannon': { hero: 'waterMage', zoom: 1.05, battle: 'rattler*4|waterMage,paladin', t: '003', secs: 6, stage: `
    clear(); const pal = friends()[0], F = foes(); tough(F, 4, 0.2); put(me, CX - 260, CY, 0); put(pal, CX - 130, CY + 8, 0); pal.hp = pal.maxHp * 0.45; SIM.addStatus(w, pal, 'burn', 60, F[0]);
    [[10, -10], [90, 20], [170, -30], [250, 60]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));
    each = (T) => { pal.atkT = Math.max(pal.atkT, 0.5); if (T < 1) for (const u of F) { u.x = u.home.x; u.y = u.home.y; u.vx = u.vy = 0; } at(T, 1.0, 'a', () => use('waterCannon', 3, F[1])); };` },
  // Splashback: struck while she stands in a puddle, three balls of water fly back at whoever struck her
  'waterMage-trait': { hero: 'waterMage', zoom: 1.05, battle: 'rattlerMace*2|waterMage', t: '000', secs: 7, stage: `
    clear(); const F = foes(); tough(F, 4, 0.25); put(me, CX - 60, CY, 0); put(F[0], CX + 10, CY - 30, Math.PI); put(F[1], CX + 10, CY + 50, Math.PI);
    w.hazards.push({ type: 'water', x: CX - 60, y: CY, r: 58 }); me.barAlways = true;
    each = (T) => { me.x = CX - 60; me.y = CY; me.vx = me.vy = 0; };` },
  'timeBubble-2-glass': { hero: 'clockwork', battle: 'rattler*4,rattlerBow*2|clockwork,paladin', t: '020', secs: 8, q: 'v_timeBubble=2', same: 'clockwork-timeBubble' },
};
for (const c of Object.values(CLIPS)) if (c.same) c.stage = CLIPS[c.same].stage;

const list = Object.entries(CLIPS).filter(([name, c]) => (!only.length || only.includes(name)) && (!heroOnly || c.hero === heroOnly));
const run = ([name, c]) => new Promise((resolve) => {
  const file = path.join(out, name + '.mp4'), ev = PRELUDE(c.hero).replace('STAGE', c.stage || '');
  // a battle is framed by the game's own battle camera (everyone in it); a run follows the hero. c.follow: a kind to stay on instead
  // (round 15, lane E: clip.mjs spends skill points by default now; --nospend keeps these clips as they were made: the
  // battle's hero has exactly the nodes of its tiers, a run's party none, and each stage uses its move at the tier named)
  const a = ['tools/clip.mjs', file, '--port', port, '--secs', String(c.secs || 6), '--zoom', String(c.zoom || (c.battle ? 1.35 : 1.5)), '--seed', '5', '--eval', ev, '--nospend', ...(c.extra || [])];
  if (c.follow || !c.battle) a.push('--follow', c.follow || c.hero);
  if (c.q) a.push('--q', c.q);
  if (c.battle) a.push('--battle', c.battle, '--arena', c.arena || 'crypt', '--nodes', N(c.hero, c.t));
  else a.push('--party', c.run, '--level', '9');
  const t0 = Date.now();
  execFile(process.execPath, a, { env: { ...process.env, TEMP: TMP, TMP }, maxBuffer: 1 << 24 }, (err, so, se) => {
    const msg = (so + se).trim().split('\n').filter((l) => !/^no page errors/.test(l)).join(' | ');
    console.log(`${err ? 'FAILED' : 'ok'} ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)${msg ? ' ' + msg.slice(0, 600) : ''}`); resolve();
  });
});
// a few at a time
let i = 0; const next = async () => { while (i < list.length) await run(list[i++]); };
await Promise.all(Array.from({ length: Math.min(jobs, list.length) }, next));
// whatever Edge is still running on one of this lane's profile folders is stopped (never anyone else's)
try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*delve-lane-n-newheroes*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
console.log(`${list.length} clips -> ${path.relative(process.cwd(), out)}`);
