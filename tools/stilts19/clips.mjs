// Lane stilts19 (round 19): the Canopy Idol's clips, recorded with tools/clip.mjs (a battle against staged heroes, or the
// boss room), like tools/sys19/clips.mjs. Staged clips are the boss room of a run (?bossroom&boss=stiltIdol) with the
// heroes put where the scene wants them.
//   node tools/stilts19/clips.mjs [--port 8961] [--only a,b] [--out docs/clips/stilts19] [--jobs 2]
// Needs the dev server (node tools/serve.mjs 8961 .). Each recording runs its own headless Edge on its own profile
// folder under this lane's temp folder; only those are stopped at the end.
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = opt('port', '8961'), out = path.resolve(opt('out', 'docs/clips/stilts19')), jobs = +opt('jobs', 2);
const only = (opt('only', '') || '').split(',').filter(Boolean);
const LANE = 'delve-lane-stilts19';
const TMP = path.join(os.tmpdir(), LANE); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(out, { recursive: true });

// In the page, after the battle has started: the idol (sp), its fight state (k()), the heroes, and small tools to
// stage a scene. Nobody is pinned: a hero told to stay has its walking taken away (moveMul), as the Book's scenes do.
const PRELUDE = `(async () => {
  const SIM = await import('./js/sim.js'), PATH = await import('./js/path.js'), R = GAME.run, w = R.world;
  const sp = w.units.find((u) => u.kind === 'stiltIdol'), k = () => sp.si;
  const heroes = () => w.units.filter((u) => u.team !== sp.team && !u.dead && u.team !== 'neutral' && !u.summon && !u.minion);
  for (const h of heroes()) h.forcedGoal = null; w.wp = null;
  const put = (u, x, y, a) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; u.home = { x, y }; if (a != null) u.facing = u.mvA = a; };
  const tough = (list, hp = 30, dmg = 1) => { for (const u of list) { u.maxHp = Math.round(u.maxHp * hp); u.hp = u.maxHp; u.dmgMul *= dmg; } };
  const stay = (u) => { u.moveMul = 1e-4; };
  const quiet = (u) => { if (u.kit) for (const c in u.kit.cd) u.kit.cd[c] = 999; };
  const idle = (u) => { u.atkT = 999; quiet(u); };
  const done = {}; const at = (T, t, id, f) => { if (T >= t && !done[id]) { done[id] = true; f(); } };
  const CX = w.W / 2, CY = w.H / 2;
  w.pillars = []; w.walls = w.walls.filter((r) => r.solid); PATH.buildGrid(w);
  sp.aggro = true; sp.maxHp *= 20; sp.hp = sp.maxHp; // (awake at once; a clip is about one thing: it doesn't die or turn a phase in it unless the stage says so)
  let T = 0, each = () => {};
  STAGE
  // (its feet are a share of its health: made on its first tick, so brought back down from the padded figure here)
  let feet = false; const fix = () => { if (feet || !k()) return; feet = true; for (const L of k().legs) if (L.foot) { L.foot.maxHp = Math.round(L.foot.maxHp / 20); L.foot.hp = L.foot.maxHp; } };
  const rf = GAME.recFrame; GAME.recFrame = (dt) => { T += dt; try { fix(); each(T, dt); } catch (e) { console.error(e); throw e; } return rf.call(GAME, dt); };
})();`;

const PARTY = 'paladin,archer,cleric,twinfang';
const CLIPS = {
  // (the room is 1300 by 960; on a phone its length runs up the screen, so "up" is +x: the idol's head is drawn 119 up
  // from the floor point under it. put(sp, ...) places the head; G is the floor point that gives.)
  // walking: one hero far off, standing still; the idol crosses the hall to it. Close and at half speed, to see each
  // hoof plant and stay put while the head goes over it.
  walk: { party: 'paladin', q: 'bossmove=walk', secs: 10, speed: 0.5, zoom: 1.05, follow: 'stiltIdol', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX + 480, CY, Math.PI); put(h, CX - 480, CY + 30, 0);` },
  // the same walk at full speed and further out, across the hall on a slant
  'walk-far': { party: 'paladin', q: 'bossmove=walk', secs: 9, zoom: 0.8, follow: 'stiltIdol', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX + 480, CY - 250, Math.PI); put(h, CX - 480, CY + 300, 0);` },
  // turning: its mark is carried round it in a circle; it turns on the spot, hooves swinging round
  turn: { party: 'paladin', q: 'bossmove=walk', secs: 10, speed: 0.6, zoom: 1.0, follow: 'stiltIdol', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX + 119, CY, Math.PI); put(h, CX - 150, CY, 0);
    each = (T) => { const a = Math.PI + T * 0.7, g = k() || { gx: sp.x - 119, gy: sp.y }; put(h, g.gx + Math.cos(a) * 156, g.gy + Math.sin(a) * 156, a + Math.PI); };` },
  // a stomp: a hero who can't step away is stamped on; one who can steps out of the next
  stomp: { party: 'paladin,tower', q: 'bossmove=stomp', secs: 8, speed: 0.6, zoom: 1.0, follow: 'stiltIdol', stage: `
    const [a, b] = heroes(); tough([a, b]); idle(a); idle(b); stay(a); const GX = CX + 60; put(sp, GX + 119, CY, Math.PI); put(a, GX - 140, CY - 90, 0); put(b, GX - 130, CY + 110, 0);` },
  // the head slam landing: its mark can't get away
  'slam-hit': { party: 'paladin', q: 'bossmove=slam', secs: 8, speed: 0.6, zoom: 0.95, follow: 'stiltIdol', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); const GX = CX + 110; put(sp, GX + 119, CY, Math.PI); put(h, GX - 190, CY + 10, 0);` },
  // the head slam missing: everyone steps out of the circle; it lies stunned on the floor and the party piles on
  'slam-miss': { party: 'twinfang,paladin,archer', q: 'bossmove=slam', secs: 10, speed: 0.7, zoom: 0.9, follow: 'stiltIdol', stage: `
    const H = heroes(), tw = H.find((h) => h.kind === 'twinfang'), rest = H.filter((h) => h !== tw); tough(H, 30, 0.25); H.forEach(quiet);
    const GX = CX + 120; put(sp, GX + 119, CY, Math.PI); put(tw, GX - 190, CY + 20, 0); rest.forEach((h, i) => put(h, GX - 420 - i * 90, CY + (i ? 190 : -170), 0));
    each = () => { const kk = k(); if (kk && kk.slam && kk.slam.st === 'track') kk.slam.who = tw; };` },
  // a stilt breaking: the party on one hoof; it snaps, hangs and drags as the idol walks on
  'leg-break': { party: 'paladin,twinfang', q: 'bossmove=walk', secs: 10, speed: 0.6, zoom: 1.0, follow: 'stiltIdol', stage: `
    const H = heroes(); tough(H, 30, 0.5); H.forEach(quiet); const GX = CX + 60; put(sp, GX + 119, CY, Math.PI); put(H[0], GX - 150, CY - 130, 0); put(H[1], GX - 180, CY - 80, 0);
    each = (T) => { const kk = k(); if (!kk) return; const L = kk.legs[0]; at(T, 0.3, 'w1', () => { if (L.foot) L.foot.hp = L.foot.maxHp * 0.6; }); at(T, 1.3, 'w2', () => { if (L.foot) L.foot.hp = L.foot.maxHp * 0.3; }); at(T, 2.0, 'w3', () => { if (L.foot) L.foot.hp = 1; }); for (const h of H) if (L.foot && !L.foot.dead) { h.focus = L.foot; h.focusT = 1; }
      at(T, 4.5, 'go', () => { for (const h of H) { idle(h); stay(h); } put(H[0], CX - 520, CY + 260, 0); put(H[1], CX - 560, CY + 300, 0); }); };` },
  // walking with two stilts broken, then three
  'walk-2broken': { party: 'paladin', q: 'bossmove=legs2', secs: 10, speed: 0.6, zoom: 1.0, follow: 'stiltIdol', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX + 480, CY, Math.PI); put(h, CX - 480, CY + 30, 0);` },
  'walk-3broken': { party: 'paladin', q: 'bossmove=legs3', secs: 10, speed: 0.6, zoom: 1.0, follow: 'stiltIdol', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX + 480, CY, Math.PI); put(h, CX - 480, CY + 30, 0);` },
  // the fourth stilt goes: it collapses, lies dazed, then fights from the floor (a slam from its belly)
  collapse: { party: 'paladin,twinfang', q: 'bossmove=legs3m', secs: 13, speed: 0.8, zoom: 0.9, follow: 'stiltIdol', stage: `
    const H = heroes(); tough(H, 30, 0.4); H.forEach(quiet); const GX = CX + 60; put(sp, GX + 119, CY, Math.PI); put(H[0], GX - 150, CY - 130, 0); put(H[1], GX - 180, CY - 80, 0);
    each = (T) => { const kk = k(); if (!kk) return; const L = kk.legs[0]; at(T, 0.3, 'w1', () => { if (L.foot) L.foot.hp = L.foot.maxHp * 0.3; }); at(T, 1.6, 'w2', () => { if (L.foot) L.foot.hp = 1; }); for (const h of H) if (L.foot && !L.foot.dead) { h.focus = L.foot; h.focusT = 1; } };` },
  // the liana: one caught (it can't step away) and hauled in under the head; then one that comes down on bare floor
  vine: { party: 'archer,cleric', q: 'bossmove=vine', secs: 10, speed: 0.7, zoom: 0.8, stage: `
    const [a, b] = heroes(); tough([a, b]); idle(a); idle(b); stay(a); const GX = CX + 200; put(sp, GX + 119, CY, Math.PI); put(a, GX - 380, CY - 60, 0); put(b, CX - 620, CY + 400, 0); stay(b);
    w.camAt = { x: CX + 60, y: CY };
    each = (T) => { at(T, 4.4, 'again', () => { sp.el.vine = 0.2; a.moveMul = 1; put(a, GX - 330, CY + 150, 0); a.vx = 0; a.vy = 230; }); };` },
  // seed pods: shaken out of its crown, falling the whole height; one hero can't step away, the others can; a sproutling out of the first
  pods: { party: 'paladin,archer,cleric', q: 'bossmove=pods', secs: 9, speed: 0.6, zoom: 0.85, stage: `
    const H = heroes(); tough(H); H.forEach(idle); stay(H[0]); const GX = CX + 120; put(sp, GX + 119, CY, Math.PI); put(H[0], GX - 240, CY - 40, 0); put(H[1], GX - 330, CY + 150, 0); put(H[2], GX - 300, CY - 220, 0);
    w.camAt = { x: CX + 40, y: CY };` },
  // its death, from its full height
  death: { party: 'paladin,archer', q: 'bossmove=walk', secs: 7, speed: 0.6, zoom: 0.9, follow: 'stiltIdol', stage: `
    const H = heroes(); tough(H); H.forEach(quiet); const GX = CX + 60; put(sp, GX + 119, CY, Math.PI); put(H[0], GX - 160, CY - 120, 0); put(H[1], GX - 420, CY + 60, 0);
    each = (T) => { at(T, 1.6, 'die', () => { SIM.hurt(w, sp, sp.hp + 1e6, H[1], { noDodge: true, shot: true }); }); };` },
};
// the whole fight, in the boss room, as the batches measure it
const FIGHT = { name: 'fight', args: ['--party', PARTY, '--level', '25', '--q', 'bossroom&boss=stiltIdol&theme=sewers', '--secs', '50', '--speed', '3', '--zoom', '0.7', '--follow', 'stiltIdol', '--seed', '4', '--max', '1500'] };

const list = Object.entries(CLIPS).filter(([name]) => !only.length || only.includes(name));
const run = ([name, c]) => new Promise((resolve) => {
  const file = path.join(out, name + '.mp4'), ev = PRELUDE.replace('STAGE', c.stage || '');
  const a = ['tools/clip.mjs', file, '--port', port, '--secs', String(c.secs || 6), '--zoom', String(c.zoom || 1.3), '--seed', String(c.seed || 5), '--eval', ev, '--speed', String(c.speed || 1),
    '--party', c.party, '--level', '25', '--q', 'theme=sewers&bossroom&boss=stiltIdol' + (c.q ? '&' + c.q : '')];
  if (c.follow) a.push('--follow', c.follow);
  const t0 = Date.now();
  execFile(process.execPath, a, { env: { ...process.env, TEMP: TMP, TMP }, maxBuffer: 1 << 24 }, (err, so, se) => {
    const msg = (so + se).trim().split('\n').filter((l) => !/^no page errors/.test(l)).join(' | ');
    console.log(`${err ? 'FAILED' : 'ok'} ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)${msg ? ' ' + msg.slice(0, 900) : ''}`); resolve();
  });
});
const runFight = () => new Promise((resolve) => {
  const t0 = Date.now();
  execFile(process.execPath, ['tools/clip.mjs', path.join(out, 'fight.mp4'), '--port', port, ...FIGHT.args], { env: { ...process.env, TEMP: TMP, TMP }, maxBuffer: 1 << 24 }, (err, so, se) => {
    console.log(`${err ? 'FAILED' : 'ok'} fight (${((Date.now() - t0) / 1000).toFixed(0)}s) ${(so + se).trim().slice(0, 600)}`); resolve(); });
});
let i = 0; const next = async () => { while (i < list.length) await run(list[i++]); };
await Promise.all(Array.from({ length: Math.min(jobs, list.length) }, next));
if (!only.length || only.includes('fight')) await runFight();
try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${LANE}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
console.log(`${list.length} clips -> ${path.relative(process.cwd(), out)}`);
