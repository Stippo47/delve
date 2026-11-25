// Round 18 (lane dash18): the dashes' clips, recorded with tools/clip.mjs (one staged battle per clip), after
// tools/hero-clips.mjs.
//   node tools/dash18/clips.mjs [--port 8918] [--before 8919] [--only wolf-after,iaido-after] [--out docs/clips/dash18] [--jobs 2]
// Needs the dev server on --port (node tools/serve.mjs 8918), and for the "before" clips a second one on --before serving
// the game as it was before this lane (git archive of the commit it started from, unpacked anywhere).
// Each clip is a real battle (js/battle.js) staged through clip.mjs --eval: who stands where, health raised and blows
// softened so the move can be shown twice, the move set off at set moments. Every clip is cropped to its middle and
// scaled up, so the body and the blade can be seen.
// Edge: every run's profile folder is made under this lane's own temp folder (TMP below), so anything left running can
// be told from other lanes' browsers by its command line and stopped without touching theirs.
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = opt('port', '8918'), before = opt('before', '8919'), out = path.resolve(opt('out', 'docs/clips/dash18')), jobs = +opt('jobs', 2);
const only = (opt('only', '') || '').split(',').filter(Boolean);
const TAG = 'delve-lane-dash18', TMP = path.join(os.tmpdir(), TAG); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(out, { recursive: true });

// What every stage script can use (runs in the page, after the battle has started). Nothing here needs this lane's own
// modules, so the same script stages the game as it was.
const PRELUDE = (hero) => `(async () => {
  const K = await import('./js/kits.js'), FT = await import('./js/fxtag.js'), SIM = await import('./js/sim.js'), PATH = await import('./js/path.js');
  const R = GAME.run, w = R.world, me = w.units.find((u) => u.kind === '${hero}');
  const CX = w.W / 2, CY = w.H / 2;
  const foes = () => w.units.filter((u) => u.team !== me.team && !u.dead && u.team !== 'neutral');
  const friends = () => w.units.filter((u) => u.team === me.team && u !== me && !u.partOf && !u.summon && !u.dead);
  const put = (u, x, y, a) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = u.dvx = u.dvy = 0; u.spd = 0; u.home = { x, y }; if (a != null) u.facing = u.mvA = a; };
  const tough = (list, hp = 3, dmg = 0.35) => { for (const u of list) { u.maxHp = Math.round(u.maxHp * hp); u.hp = u.maxHp; u.dmgMul *= dmg; } };
  const clear = () => { w.pillars = []; w.walls = w.walls.filter((r) => r.solid); PATH.buildGrid(w); };
  const use = (ab, tier, t, by = me) => { by.kit.cd[ab] = 99; by.kit.using = ab; if (t) by.target = t; try { FT.tagAbility(w, by, ab, tier, () => K.ABILITIES[ab].use(w, by, t, tier)); } finally { by.kit.using = null; } };
  const quiet = (u) => { if (u.kit) for (const k in u.kit.cd) u.kit.cd[k] = 999; };
  const busy = (u) => !!(u.act || (u.el && u.el.rush) || (u.later && u.later.some((l) => !l.done)));
  const pin = (u) => { u.x = u.home.x; u.y = u.home.y; u.vx = u.vy = u.kx = u.ky = u.dvx = u.dvy = 0; u.spd = 0; };
  const mend = (list) => { for (const u of list) { u.hp = u.maxHp; u.stunT = 0; u.koT = 0; if (u.st) for (const k in u.st) u.st[k] = 0; } };
  const done = {}; const at = (T, t, id, f) => { if (T >= t && !done[id]) { done[id] = true; f(); } };
  quiet(me); for (const f of friends()) quiet(f);
  let T = 0, each = () => {};
  STAGE
  const rf = GAME.recFrame; GAME.recFrame = (dt) => { T += dt; try { each(T, dt); } catch (e) { console.error(e); throw e; } return rf.call(GAME, dt); };
})();`;

// a hero's move shown twice: everyone put back in place before each go
const TWICE = (setup, go, t1 = 0.9, t2 = 3.7) => `
    clear(); ${setup}
    const all = [me, ...foes(), ...friends()], spots = all.map((u) => [u.x, u.y, u.facing]);
    const reset = () => { all.forEach((u, i) => { if (!u.dead) { u.act = null; put(u, ...spots[i]); } }); mend(all); };
    let free = -1;
    each = (T) => { for (const u of all) if (u !== me) u.atkT = Math.max(u.atkT, 0.5); me.atkT = Math.max(me.atkT, 0.5);
      if (T < ${t1} || (T > ${t2} - 0.5 && T < ${t2})) all.forEach((u) => pin(u));
      at(T, ${t2} - 0.5, 'r', reset); at(T, ${t1}, 'a', () => { ${go} }); at(T, ${t2}, 'b', () => { ${go} }); };`;
// an enemy's move shown twice at a hero held in place
const FOE = (setup, key, hold = 0.52) => `
    const HOLD = ${hold};
    clear(); ${setup}
    const go = () => { put(foe, ...spot); foe.act = null; if (foe.el) foe.el.rush = null; foe.aggro = true; foe.target = me; foe.el = foe.el || {}; for (const k in foe.el) if (typeof foe.el[k] === 'number') foe.el[k] = 99; foe.el['${key}'] = 0; foe.abilT = 99; foe.thinkT = 0; mend([me, foe]);
      ${key === 'abil' ? "foe.facing = foe.mvA = Math.atan2(me.y - foe.y, me.x - foe.x); const was = w.actor; w.actor = foe; SIM.unitAbility(w, foe); w.actor = was;" : ''} }; // (a plain unit's own ability is set off by hand: sim.js unitAbility)
    let last = 0;
    each = (T) => { if (!busy(foe) || T - last < HOLD) pin(me); me.atkT = 9; // (held in place for the tell; a charge may carry it off)
      me.facing = Math.atan2(foe.y - me.y, foe.x - me.x); foe.atkT = Math.max(foe.atkT, 0.4); for (const f of friends()) { f.atkT = 9; if (!busy(foe) && T - last > 1.9) pin(f); }
      at(T, 0.8, 'a', () => { go(); last = T; }); at(T, 3.6, 'b', () => { go(); last = T; });
      if (!busy(foe) && (T < 0.8 || T - last > 1.9)) { put(foe, ...spot); foe.el = foe.el || {}; foe.el['${key}'] = 99; foe.abilT = 99; } };`;

// name: { hero (the unit the stage calls `me`), battle (Red | Blue), t (the hero's three ability tiers), secs, crop (the
// share of the frame kept, round its middle), stage, site ('before': the game as it was) }
const N = (hero, ids, t) => hero + ':' + (ids.flatMap((id, i) => Array.from({ length: +t[i] }, (_, k) => id + (k + 1))).join('+') || 'root');
const CLIPS = {
  // ---- the wolf's lunge: before (a straight run through), after (the pounce)
  wolf: { hero: 'paladin', ids: ['shieldBash', 'guard', 'consecrate'], battle: 'wolf*1|paladin', t: '000', pair: true, crop: 0.46, stage: FOE(`
    const foe = foes()[0], spot = [CX - 105, CY + 6, 0]; tough([foe], 6, 0.6); me.maxHp *= 4; me.hp = me.maxHp; put(me, CX + 60, CY, Math.PI); put(foe, ...spot);`, 'lunge') },
  // ---- Iaido: before (he is simply at the far end), after (the draw cut)
  iaido: { hero: 'samurai', ids: ['iaido', 'focus', 'crescentCut'], battle: 'rattler*3|samurai', t: '100', pair: true, crop: 0.46, stage: TWICE(`
    const F = foes(); tough(F, 8, 0.2); put(me, CX - 175, CY, 0); [[-40, 6], [30, -16], [100, 12]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));`, `use('iaido', 1, F[1]);`) },
  // ---- Shadow Walk: before (one straight run), after (the blink chain)
  shadowWalk: { hero: 'shade', ids: ['shadowWalk', 'blackout', 'deathMark'], battle: 'rattler*3|shade', t: '100', pair: true, crop: 0.56, stage: TWICE(`
    const F = foes(); tough(F, 8, 0.2); put(me, CX - 150, CY + 20, 0); [[-10, -40], [70, 30], [130, -50]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));`, `use('shadowWalk', 1, F[0]);`) },
  // ---- the other variations, one each
  'hook-backstab': { hero: 'twinfang', ids: ['backstab', 'dash', 'fanOfKnives'], battle: 'brute*1|twinfang', t: '100', crop: 0.6, stage: TWICE(`
    const F = foes(); tough(F, 8, 0.2); put(me, CX - 150, CY + 10, 0); put(F[0], CX + 40, CY, Math.PI);`, `use('backstab', 1, F[0]);`) },
  'feint-crescentCut': { hero: 'samurai', ids: ['iaido', 'focus', 'crescentCut'], battle: 'brute*1|samurai', t: '001', crop: 0.46, stage: TWICE(`
    const F = foes(); tough(F, 8, 0.2); put(me, CX - 140, CY, 0); put(F[0], CX + 40, CY, Math.PI);`, `use('crescentCut', 1, F[0]);`) },
  'dragFling-charge': { hero: 'tower', ids: ['holdTheLine', 'charge', 'groundPound'], battle: 'rattler*3|tower', t: '010', crop: 0.46, stage: TWICE(`
    const F = foes(); tough(F, 8, 0.2); put(me, CX - 200, CY, 0); [[-80, 0], [0, 26], [10, -34]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));`, `use('charge', 1, F[0]);`) },
  // ---- more of them in other hands
  'dragFling-shieldRush': { hero: 'gladiator', ids: ['netThrow', 'showboat', 'shieldRush'], battle: 'rattler*3|gladiator', t: '002', crop: 0.62, stage: TWICE(`
    const F = foes(); tough(F, 8, 0.2); put(me, CX - 230, CY, 0); [[-90, 0], [10, 30], [30, -30]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));`, `use('shieldRush', 2, F[0]);`) },
  'drawCut-spearLunge': { hero: 'huntress', ids: ['runningThrow', 'bound', 'prey'], battle: 'rattler*3|huntress', t: '100', crop: 0.46, stage: TWICE(`
    const F = foes(); tough(F, 8, 0.2); put(me, CX - 175, CY, 0); [[-50, 4], [10, -10], [70, 8]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));`, `use('runningThrow', 1, F[1]);`) },
  'pounce-bearClaws': { hero: 'bearskin', ids: ['maul', 'hibernate', 'bearRoar'], battle: 'brute*1|bearskin', t: '001', crop: 0.46, stage: TWICE(`
    const F = foes(); tough(F, 8, 0.2); put(me, CX - 120, CY, 0); put(F[0], CX + 40, CY, Math.PI);`, `use('bearRoar', 1, F[0]);`, 0.9, 4.0), secs: 7.4 },
  'hook-werewolf': { hero: 'werewolf', ids: ['turnWolf', 'frenzy', 'pounce'], battle: 'rattler*3|werewolf', t: '001', crop: 0.6, stage: TWICE(`
    const F = foes(); tough(F, 8, 0.2); put(me, CX - 150, CY + 10, 0); [[30, 0], [70, 44], [74, -40]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));`, `use('pounce', 1, F[0]);`) },
  // ---- enemies: the tell on the floor, then the move
  'feint-goblin': { hero: 'paladin', ids: ['shieldBash', 'guard', 'consecrate'], battle: 'goblin*1|paladin', t: '000', crop: 0.46, stage: FOE(`
    const foe = foes()[0], spot = [CX - 95, CY + 6, 0]; tough([foe], 8, 0.6); me.maxHp *= 4; me.hp = me.maxHp; put(me, CX + 50, CY, Math.PI); put(foe, ...spot); foe.spd = 60; foe.mvA = 0;`, 'abil') },
  'dragFling-orc': { hero: 'archer', ids: ['barrage', 'frostArrow', 'roll'], battle: 'orc*1|archer,cleric', t: '000', crop: 0.56, stage: FOE(`
    const foe = foes()[0], spot = [CX - 150, CY, 0], fr = friends()[0]; tough([foe], 8, 0.6); me.maxHp *= 4; me.hp = me.maxHp; fr.maxHp *= 4; fr.hp = fr.maxHp; put(me, CX - 10, CY, Math.PI); put(fr, CX + 60, CY + 30, Math.PI); put(foe, ...spot);`, 'abil', 0.85) }, // (held till the orc reaches it: left free, the archer steps out of the lane, as it should)
  'drawCut-boneSpear': { hero: 'paladin', ids: ['shieldBash', 'guard', 'consecrate'], battle: 'rattlerSpear*1|paladin', t: '000', crop: 0.46, stage: FOE(`
    const foe = foes()[0], spot = [CX - 130, CY + 6, 0]; tough([foe], 8, 0.6); me.maxHp *= 4; me.hp = me.maxHp; put(me, CX + 40, CY, Math.PI); put(foe, ...spot); foe.spd = 60; foe.mvA = 0;`, 'abil') },
  'hook-bat': { hero: 'paladin', ids: ['shieldBash', 'guard', 'consecrate'], battle: 'bat*1|paladin', t: '000', arena: 'crypt', crop: 0.52, stage: FOE(`
    const foe = foes()[0], spot = [CX - 100, CY + 6, 0]; tough([foe], 8, 0.6); me.maxHp *= 4; me.hp = me.maxHp; put(me, CX + 40, CY, Math.PI); put(foe, ...spot); foe.spd = 60; foe.mvA = 0;`, 'abil') },
};

const list = [];
for (const [name, c] of Object.entries(CLIPS)) { if (c.pair) { list.push([name + '-before', { ...c, site: 'before' }], [name + '-after', c]); } else list.push([name, c]); }
const todo = list.filter(([name]) => !only.length || only.includes(name) || only.includes(name.replace(/-(before|after)$/, '')));
const run = ([name, c]) => new Promise((resolve) => {
  const raw = path.join(out, '.' + name + '.raw.mp4'), file = path.join(out, name + '.mp4'), ev = PRELUDE(c.hero).replace('STAGE', c.stage || '');
  const a = ['tools/clip.mjs', raw, '--port', c.site === 'before' ? before : port, '--secs', String(c.secs || 6.4), '--zoom', '1.5', '--seed', '5', '--w', '844', '--h', '390', '--eval', ev, '--nospend',
    '--battle', c.battle, '--arena', c.arena || 'crypt', '--nodes', N(c.hero, c.ids, c.t)];
  const t0 = Date.now();
  execFile(process.execPath, a, { env: { ...process.env, TEMP: TMP, TMP }, maxBuffer: 1 << 24 }, (err, so, se) => {
    const msg = (so + se).trim().split('\n').filter((l) => !/^no page errors/.test(l)).join(' | ');
    if (!err) { // the middle of the frame, scaled back up (the fight is staged round the room's middle)
      const k = c.crop || 0.5, cx = c.cx ?? 0.5, cy = c.cy ?? 0.4; // (the staged fight sits a little above the frame's middle: the battle's bar is along the bottom)
      try { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-vf', `crop=trunc(iw*${k}/2)*2:trunc(ih*${k}/2)*2:trunc(iw*${cx}-iw*${k}/2):trunc(ih*${cy}-ih*${k}/2),scale=1688:780:flags=lanczos`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', file]); fs.rmSync(raw, { force: true }); }
      catch (e) { console.log('crop failed', name, String(e).slice(0, 200)); }
    }
    console.log(`${err ? 'FAILED' : 'ok'} ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)${msg ? ' ' + msg.slice(0, 700) : ''}`); resolve();
  });
});
let i = 0; const next = async () => { while (i < todo.length) await run(todo[i++]); };
await Promise.all(Array.from({ length: Math.min(jobs, todo.length) }, next));
// whatever Edge is still running on one of this lane's profile folders is stopped (never anyone else's)
try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${TAG}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
console.log(`${todo.length} clips -> ${path.relative(process.cwd(), out)}`);
