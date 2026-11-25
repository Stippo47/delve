// Round 19 (lane rogue19): one short clip per changed ability, attack, trait and status of the Bandit, the Shade, the Monk
// and the Cultist (and the Ghost's incorporeal turn, the Dame's Disarm on the shared status), recorded with tools/clip.mjs
// in staged battles, zoomed in.
//   node tools/rogue19/clips.mjs [--port 8933] [--only shade-blackout,...] [--hero shade] [--out docs/clips/rogue19] [--jobs 3]
// Needs the dev server (node tools/serve.mjs 8933). Edge runs on this lane's own temp folders (CLIP_LANE, default rogue19).
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = opt('port', '8933'), out = path.resolve(opt('out', 'docs/clips/rogue19')), jobs = +opt('jobs', 3);
const only = (opt('only', '') || '').split(',').filter(Boolean), heroOnly = opt('hero', '');
const LANE = process.env.CLIP_LANE || 'rogue19';
const TMP = path.join(os.tmpdir(), LANE); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(out, { recursive: true });
const PRELUDE = (hero) => `(async () => {
  const K = await import('./js/kits.js'), FT = await import('./js/fxtag.js'), SIM = await import('./js/sim.js'), PATH = await import('./js/path.js'), K2 = await import('./js/kits2.js');
  const R = GAME.run, w = R.world, me = w.units.find((u) => u.kind === '${hero}');
  const CX = w.W / 2, CY = w.H / 2;
  const foes = () => w.units.filter((u) => u.team !== me.team && !u.dead && u.team !== 'neutral');
  const friends = () => w.units.filter((u) => u.team === me.team && u !== me && !u.partOf && !u.summon && !u.dead);
  const put = (u, x, y, a) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; u.home = { x, y }; if (a != null) u.facing = u.mvA = a; };
  const tough = (list, hp = 3, dmg = 0.35) => { for (const u of list) { u.maxHp = Math.round(u.maxHp * hp); u.hp = u.maxHp; u.dmgMul *= dmg; } };
  const clear = () => { w.pillars = []; w.walls = w.walls.filter((r) => r.solid); PATH.buildGrid(w); };
  const use = (ab, tier, t, by = me) => { by.kit.cd[ab] = 99; by.kit.using = ab; if (t) by.target = t; try { FT.tagAbility(w, by, ab, tier, () => K.ABILITIES[ab].use(w, by, t, tier)); } finally { by.kit.using = null; } };
  const quiet = (u) => { for (const k in u.kit.cd) u.kit.cd[k] = 999; };
  const done = {}; const at = (T, t, id, f) => { if (T >= t && !done[id]) { done[id] = true; f(); } };
  quiet(me); for (const f of friends()) if (f.kit) quiet(f);
  let T = 0, each = () => {};
  STAGE
  const rf = GAME.recFrame; GAME.recFrame = (dt) => { T += dt; try { each(T, dt); } catch (e) { console.error(e); throw e; } return rf.call(GAME, dt); };
})();`;
const ABS = { rogueBandit: ['smokeBomb', 'pickpocket', 'lowBlow'], shade: ['shadowWalk', 'blackout', 'deathMark'], monk: ['flurry', 'palmStrike', 'innerPeace'],
  cultist: ['bloodPact', 'ritualCircle', 'soulCandle'], dame: ['riposte', 'challenge', 'disarm'] };
const N = (hero, t) => { const ids = ABS[hero]; return hero + ':' + (ids.flatMap((id, i) => Array.from({ length: +t[i] }, (_, k) => id + (k + 1))).join('+') || 'root'); };
const CLIPS = {
  // ------------------------------------------------------------ the Bandit
  'bandit-bolas': { hero: 'rogueBandit', battle: 'rattlerBow*1,rattler*1|rogueBandit', t: '300', secs: 6, stage: `
    clear(); put(me, CX - 70, CY, 0); const F = foes(); tough(F, 4, 0.2); put(F[0], CX + 75, CY - 25, Math.PI); put(F[1], CX + 90, CY + 70, Math.PI);
    each = (T) => { me.kit.lightW = w; me.kit.lightT = 99; at(T, 0.8, 'a', () => use('smokeBomb', 3, F[0])); };` },

  'bandit-dirtyTrick': { hero: 'rogueBandit', battle: 'orc*1,goblin*1|rogueBandit', t: '030', secs: 3.2, follow: false, stage: `
    clear(); put(me, CX - 60, CY, 0); const F = foes(); tough(F, 4, 0.2); put(F[0], CX, CY, Math.PI); put(F[1], CX + 130, CY + 10, Math.PI); w.camAt = { x: CX + 10, y: CY };
    each = (T) => { w.camAt = { x: CX + 10, y: CY }; me.kit.lightW = w; me.kit.lightT = 99; if (T < 1.15) { F[0].x = CX; F[0].y = CY; F[0].atkT = 1; F[1].atkT = 1; F[1].x = CX + 130; F[1].y = CY + 10; me.x = CX - 60; me.y = CY; } at(T, 0.6, 'a', () => use('pickpocket', 3, F[0])); };` },

  'bandit-hostage': { hero: 'rogueBandit', battle: 'goblin*1,rattlerBow*2|rogueBandit', t: '003', secs: 6, stage: `
    clear(); put(me, CX - 80, CY, 0); const F = foes(); tough(F, 4, 0.3); put(F[0], CX - 30, CY, Math.PI); put(F[1], CX + 110, CY - 25, Math.PI); put(F[2], CX + 115, CY + 25, Math.PI);
    each = (T) => { me.kit.lightW = w; me.kit.lightT = 99; for (const e of F.slice(1)) { e.target = me; e.x = e.home.x; e.y = e.home.y; } if (T > 0.7) { me.facing = 0; me.target = F[1]; me.vx = me.vy = 0; me.x = CX - 80; me.y = CY; } at(T, 0.7, 'a', () => use('lowBlow', 3, F[0])); };` },

  'bandit-lightFingers': { hero: 'rogueBandit', battle: 'goblin*1,orc*1,rattler*1|rogueBandit', t: '000', secs: 6, stage: `
    clear(); put(me, CX - 130, CY, 0); const F = foes(); tough(F, 4, 0.2); put(F[0], CX - 20, CY - 40, Math.PI); put(F[1], CX + 60, CY + 50, Math.PI); put(F[2], CX + 130, CY - 20, Math.PI);
    me.kit.lightW = w; me.kit.lightT = 0.8;` },
  'dame-disarm': { hero: 'dame', battle: 'orc*1|dame', t: '003', secs: 5, follow: 'orc', zoom: 1.6, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 4, 0.2); put(F[0], CX + 30, CY, Math.PI);
    each = (T) => { at(T, 0.7, 'a', () => use('disarm', 2, F[0])); };` },
  // ------------------------------------------------------------ the Shade
  'shade-attack': { hero: 'shade', battle: 'orc*1|shade', t: '000', secs: 4, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 5, 0.2); put(F[0], CX + 30, CY, Math.PI);` },
  'shade-blackout': { hero: 'shade', battle: 'orc*2,rattler*1,orcShaman*1|shade', t: '010', secs: 7, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 5, 0.3); put(F[0], CX + 30, CY - 20, Math.PI); put(F[1], CX + 20, CY + 50, Math.PI); put(F[2], CX - 100, CY + 10, 0); put(F[3], CX + 200, CY, Math.PI);
    each = (T) => { at(T, 0.6, 'a', () => use('blackout', 2, F[0])); at(T, 1.6, 'walk', () => { me.target = F[2]; }); };` },
  'shade-clones': { hero: 'shade', battle: 'orc*2,rattler*1|shade', t: '003', secs: 7, stage: `
    clear(); put(me, CX - 80, CY, 0); const F = foes(); tough(F, 5, 0.3); put(F[0], CX + 40, CY - 30, Math.PI); put(F[1], CX + 60, CY + 50, Math.PI); put(F[2], CX + 140, CY, Math.PI);
    each = (T) => { at(T, 0.6, 'a', () => use('deathMark', 3, F[0])); };` },
  'shade-shadowWalk': { hero: 'shade', battle: 'orc*2,goblin*2|shade', t: '100', secs: 7, stage: `
    clear(); put(me, CX - 120, CY, 0); const F = foes(); tough(F, 5, 0.3); put(F[0], CX + 10, CY - 60, Math.PI); put(F[1], CX + 40, CY + 50, Math.PI); put(F[2], CX + 120, CY - 10, Math.PI); put(F[3], CX + 150, CY + 80, Math.PI);
    each = (T) => { at(T, 0.6, 'a', () => use('shadowWalk', 1, F[0])); };` },
  'ghost-incorporeal': { hero: 'paladin', battle: 'ghost*1|paladin', t: '000', secs: 5, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 6, 0.3); put(F[0], CX + 20, CY, Math.PI); F[0].incorpCd = 99;
    each = (T) => { F[0].incorpCd = 99; at(T, 1.2, 'a', () => SIM.incorporeal(w, F[0], 3.2, 'mist')); };` },

  // ------------------------------------------------------------ the Monk
  'monk-attack': { hero: 'monk', battle: 'goblin*1|monk', t: '000', secs: 4, follow: false, zoom: 0.85, stage: `
    clear(); put(me, CX - 200, CY, 0); const F = foes(); tough(F, 8, 0.2); put(F[0], CX - 140, CY, Math.PI); w.camAt = { x: CX - 20, y: CY };
    each = (T) => { w.camAt = { x: CX - 20, y: CY }; };` },

  'monk-flurry': { hero: 'monk', battle: 'orc*1|monk', t: '200', secs: 4, follow: false, stage: `
    clear(); put(me, CX - 80, CY, 0); const F = foes(); tough(F, 8, 0.2); put(F[0], CX - 30, CY, Math.PI); SIM.stun(w, F[0], 0.7); w.camAt = { x: CX - 20, y: CY };
    each = (T) => { w.camAt = { x: CX - 20, y: CY }; at(T, 0.7, 'a', () => use('flurry', 2, F[0])); };` },

  'monk-palmStrike': { hero: 'monk', battle: 'goblin*3|monk', t: '030', secs: 5, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 6, 0.2); put(F[0], CX + 20, CY - 26, Math.PI); put(F[1], CX + 22, CY + 26, Math.PI); put(F[2], CX + 60, CY, Math.PI); for (const e of F) SIM.stun(w, e, 0.9);
    each = (T) => { if (T < 0.8) { me.facing = 0; me.atkT = 1; } at(T, 0.8, 'a', () => use('palmStrike', 3, F[2])); at(T, 3.2, 'b', () => { for (const e of F) K2.spin(w, e, 60); }); };` },
  'monk-innerPeace': { hero: 'monk', battle: 'orc*2,rattlerBow*2|monk', t: '002', secs: 5, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 4, 1); put(F[0], CX + 15, CY - 25, Math.PI); put(F[1], CX + 15, CY + 30, Math.PI); put(F[2], CX + 140, CY - 50, Math.PI); put(F[3], CX + 145, CY + 50, Math.PI);
    each = (T) => { for (const e of F) e.target = me; at(T, 0.6, 'a', () => use('innerPeace', 2, F[0])); };` },

  // ------------------------------------------------------------ the Cultist
  'cultist-attack': { hero: 'cultist', battle: 'orc*1|cultist,cleric', t: '000', secs: 6, follow: 'orc', zoom: 1.7, stage: `
    clear(); put(me, CX - 140, CY, 0); const F = foes(); tough(F, 5, 0.2); put(F[0], CX + 60, CY, Math.PI); F[0].hp = F[0].maxHp * 0.5;` },
  'cultist-bloodPact': { hero: 'cultist', battle: 'orc*2|cultist,paladin,wildmane', t: '300', secs: 6, stage: `
    clear(); put(me, CX - 100, CY, 0); const P = friends(); put(P[0], CX - 30, CY - 40, 0); put(P[1], CX - 30, CY + 40, 0); const F = foes(); tough(F, 5, 0.2); put(F[0], CX + 60, CY - 30, Math.PI); put(F[1], CX + 70, CY + 40, Math.PI);
    each = (T) => { at(T, 0.6, 'a', () => use('bloodPact', 3, F[0])); };` },
  'cultist-ritualCircle': { hero: 'cultist', battle: 'orc*1,goblin*1|cultist,paladin', t: '030', secs: 6, follow: 'orc', zoom: 1.7, stage: `
    clear(); put(me, CX - 140, CY, 0); const P = friends(); put(P[0], CX - 40, CY + 60, 0); const F = foes(); tough(F, 2, 0.2); put(F[0], CX + 40, CY - 20, Math.PI); put(F[1], CX + 120, CY + 60, Math.PI); F[0].hp = F[0].maxHp * 0.3; SIM.stun(w, F[0], 1.2);
    each = (T) => { at(T, 0.5, 'a', () => use('ritualCircle', 2, F[0])); };` },
  'cultist-sacrifice': { hero: 'cultist', battle: 'goblin*2,orc*1|cultist', t: '003', secs: 5, stage: `
    clear(); put(me, CX - 120, CY, 0); const F = foes(); tough(F, 1, 0.2); put(F[0], CX - 20, CY - 60, Math.PI); put(F[1], CX + 50, CY + 40, Math.PI); put(F[2], CX + 110, CY - 20, Math.PI);
    for (const e of F) { e.hp = e.maxHp * 0.3; K.addStatus(w, e, 'bleed', 60, me); }
    each = (T) => { at(T, 0.6, 'a', () => use('soulCandle', 3, F[0])); };` },

  'cultist-bloodRite': { hero: 'cultist', battle: 'orc*2|cultist,paladin', t: '111', secs: 5, follow: 'paladin', zoom: 1.7, stage: `
    clear(); put(me, CX - 140, CY, 0); const P = friends(); put(P[0], CX + 10, CY + 20, 0); const F = foes(); tough(F, 5, 0.3); put(F[0], CX + 60, CY, Math.PI); put(F[1], CX + 70, CY + 60, Math.PI);
    for (const k in me.kit.cd) me.kit.cd[k] = 10; me.kit.riteW = w; me.kit.riteT = 99;
    each = (T) => { at(T, 1.0, 'a', () => { P[0].hp = P[0].maxHp * 0.08; me.kit.riteT = 0; }); };` },
};
const list = Object.entries(CLIPS).filter(([name, c]) => (!only.length || only.includes(name)) && (!heroOnly || c.hero === heroOnly));
const run = ([name, c]) => new Promise((resolve) => {
  const file = path.join(out, name + '.mp4'), ev = PRELUDE(c.hero).replace('STAGE', c.stage || '');
  const a = ['tools/clip.mjs', file, '--port', port, '--secs', String(c.secs || 6), '--zoom', String(c.zoom || 1.8), '--seed', '5', '--eval', ev, '--nospend', ...(c.follow === false ? [] : ['--follow', c.follow || c.hero]), ...(c.extra || [])]; // (follow false: the battle's own camera, everyone in it: a hero's own steps show against the floor)
  if (c.q) a.push('--q', c.q);
  a.push('--battle', c.battle, '--arena', c.arena || 'crypt', '--nodes', ABS[c.hero] ? N(c.hero, c.t) : '');
  const t0 = Date.now();
  execFile(process.execPath, a, { env: { ...process.env, TEMP: TMP, TMP }, maxBuffer: 1 << 24 }, (err, so, se) => {
    const msg = (so + se).trim().split('\n').filter((l) => !/^no page errors/.test(l)).join(' | ');
    console.log(`${err ? 'FAILED' : 'ok'} ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)${msg ? ' ' + msg.slice(0, 600) : ''}`); resolve();
  });
});
let i = 0; const next = async () => { while (i < list.length) await run(list[i++]); };
await Promise.all(Array.from({ length: Math.min(jobs, list.length) }, next));
try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${LANE}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
console.log(`${list.length} clips -> ${path.relative(process.cwd(), out)}`);
