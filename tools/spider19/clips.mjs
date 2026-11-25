// Lane spider19 (round 19): Old Longlegs' clips, recorded with tools/clip.mjs (a battle against staged heroes, or the
// boss room), like tools/sys19/clips.mjs. Staged clips are the boss room of a run (?bossroom&boss=ikSpider) with the
// heroes put where the scene wants them.
//   node tools/spider19/clips.mjs [--port 8937] [--only a,b] [--out docs/clips/spider19] [--jobs 2]
// Needs the dev server (node tools/serve.mjs 8937 .). Each recording runs its own headless Edge on its own profile
// folder under this lane's temp folder; only those are stopped at the end.
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = opt('port', '8937'), out = path.resolve(opt('out', 'docs/clips/spider19')), jobs = +opt('jobs', 2);
const only = (opt('only', '') || '').split(',').filter(Boolean);
const LANE = 'delve-lane-spider19';
const TMP = path.join(os.tmpdir(), LANE); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(out, { recursive: true });

// In the page, after the battle has started: the spider (sp), its fight state (k()), the heroes, and small tools to
// stage a scene. Nobody is pinned: a hero told to stay has its walking taken away (moveMul), as the Book's scenes do.
const PRELUDE = `(async () => {
  const SIM = await import('./js/sim.js'), PATH = await import('./js/path.js'), R = GAME.run, w = R.world;
  const sp = w.units.find((u) => u.kind === 'ikSpider'), k = () => sp.sp;
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
  const rf = GAME.recFrame; GAME.recFrame = (dt) => { T += dt; try { each(T, dt); } catch (e) { console.error(e); throw e; } return rf.call(GAME, dt); };
})();`;

const PARTY = 'paladin,archer,cleric,twinfang';
const CLIPS = {
  // walking: one hero far off, standing still; the spider crosses the hall to it. Close and at half speed, to see each
  // foot plant and stay put while the body goes over it.
  walk: { party: 'paladin', q: 'bossmove=walk', secs: 9, speed: 0.5, zoom: 1.5, follow: 'ikSpider', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX + 330, CY, Math.PI); put(h, CX - 420, CY + 30, 0);` },
  // the same walk at full speed and further out
  'walk-far': { party: 'paladin', q: 'bossmove=walk', secs: 8, zoom: 1.0, follow: 'ikSpider', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX + 400, CY - 200, Math.PI); put(h, CX - 420, CY + 240, 0);` },
  // turning: its mark is carried round it in a circle; it turns on the spot, feet swinging round
  turn: { party: 'paladin', q: 'bossmove=walk', secs: 9, speed: 0.6, zoom: 1.4, follow: 'ikSpider', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX, CY, Math.PI); put(h, CX - 110, CY, 0);
    each = (T) => { const a = Math.PI + T * 0.95, g = k() || { gx: sp.x, gy: sp.y }; put(h, g.gx + Math.cos(a) * 116, g.gy + Math.sin(a) * 116, a + Math.PI); };` },
  // a stomp: a hero who can't step away is stamped on; one who can steps out of the next
  stomp: { party: 'paladin,tower', q: 'bossmove=stomp', secs: 7, speed: 0.6, zoom: 1.5, follow: 'ikSpider', stage: `
    const [a, b] = heroes(); tough([a, b]); idle(a); idle(b); stay(a); put(sp, CX + 60, CY, Math.PI); put(a, CX - 60, CY - 50, 0); put(b, CX - 50, CY + 70, 0);` },
  // the head slam landing: its mark can't get away
  'slam-hit': { party: 'paladin', q: 'bossmove=slam', secs: 7, speed: 0.6, zoom: 1.3, follow: 'ikSpider', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX + 110, CY, Math.PI); put(h, CX - 110, CY + 10, 0);` },
  // the head slam missing: everyone steps out of the circle; it lies stunned on the floor and the party piles on
  'slam-miss': { party: PARTY, q: 'bossmove=slam', secs: 9, speed: 0.7, zoom: 1.2, follow: 'ikSpider', stage: `
    const H = heroes(); tough(H, 30, 0.25); H.forEach(quiet); put(sp, CX + 120, CY, Math.PI); H.forEach((h, i) => put(h, CX - 130 - (i > 1 ? 140 : 0), CY + (i % 2 ? 60 : -60), 0));` },
  // a leg breaking: the party on one foot; it snaps, hangs and drags as the spider walks on
  'leg-break': { party: 'paladin,twinfang', q: 'bossmove=walk', secs: 9, speed: 0.6, zoom: 1.5, follow: 'ikSpider', stage: `
    const H = heroes(); tough(H, 30, 0.5); H.forEach(quiet); put(sp, CX + 60, CY, Math.PI); put(H[0], CX - 70, CY - 60, 0); put(H[1], CX - 90, CY - 110, 0);
    each = (T) => { const kk = k(); if (!kk) return; const L = kk.legs[0]; at(T, 0.2, 'weak', () => { if (L.foot) L.foot.hp = L.foot.maxHp * 0.45; }); for (const h of H) if (L.foot && !L.foot.dead) { h.focus = L.foot; h.focusT = 1; }
      at(T, 4.5, 'go', () => { for (const h of H) { idle(h); stay(h); } put(H[0], CX - 520, CY + 200, 0); put(H[1], CX - 560, CY + 240, 0); }); };` },
  // walking with two legs broken, then three
  'walk-2broken': { party: 'paladin', q: 'bossmove=legs2', secs: 9, speed: 0.6, zoom: 1.4, follow: 'ikSpider', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX + 330, CY, Math.PI); put(h, CX - 420, CY + 30, 0);` },
  'walk-3broken': { party: 'paladin', q: 'bossmove=legs3', secs: 9, speed: 0.6, zoom: 1.4, follow: 'ikSpider', stage: `
    const h = heroes()[0]; tough([h]); idle(h); stay(h); put(sp, CX + 330, CY, Math.PI); put(h, CX - 420, CY + 30, 0);` },
  // the fourth leg goes: it collapses, lies dazed, then fights from the floor (a slam from its belly)
  collapse: { party: 'paladin,twinfang', q: 'bossmove=legs3m', secs: 12, speed: 0.8, zoom: 1.2, follow: 'ikSpider', stage: `
    const H = heroes(); tough(H, 30, 0.4); H.forEach(quiet); put(sp, CX + 60, CY, Math.PI); put(H[0], CX - 70, CY - 60, 0); put(H[1], CX - 90, CY - 110, 0);
    each = (T) => { const kk = k(); if (!kk) return; const L = kk.legs[0]; at(T, 0.3, 'weak', () => { if (L.foot) L.foot.hp = L.foot.maxHp * 0.3; }); for (const h of H) if (L.foot && !L.foot.dead) { h.focus = L.foot; h.focusT = 1; } };` },
  // web spit: one caught (it can't step away), then one that lands on bare floor and leaves a web
  web: { party: 'archer,cleric', q: 'bossmove=web', secs: 9, speed: 0.7, zoom: 1.0, stage: `
    const [a, b] = heroes(); tough([a, b]); idle(a); idle(b); stay(a); put(sp, CX + 200, CY, Math.PI); put(a, CX - 170, CY - 40, 0); put(b, CX - 700, CY + 300, 0);
    w.camAt = { x: CX + 10, y: CY };
    each = (T) => { at(T, 3.2, 'again', () => { sp.el.web = 0.2; a.moveMul = 1; put(a, CX - 150, CY + 150, 0); a.vx = 0; a.vy = 230; }); if (T > 3.2 && T < 4.6) { a.y -= 0; a.dvy = 200; } };` },
  // the brood: spiderlings let down from under it
  brood: { party: 'paladin,archer', q: 'bossmove=brood', secs: 7, speed: 0.6, zoom: 1.4, follow: 'ikSpider', stage: `
    const H = heroes(); tough(H); H.forEach(idle); H.forEach(stay); put(sp, CX + 60, CY, Math.PI); put(H[0], CX - 200, CY - 40, 0); put(H[1], CX - 330, CY + 60, 0);` },
  // its death
  death: { party: 'paladin,archer', q: 'bossmove=walk', secs: 6, speed: 0.6, zoom: 1.3, follow: 'ikSpider', stage: `
    const H = heroes(); tough(H); H.forEach(quiet); put(sp, CX + 60, CY, Math.PI); put(H[0], CX - 80, CY - 60, 0); put(H[1], CX - 300, CY + 60, 0);
    each = (T) => { at(T, 1.6, 'die', () => { SIM.hurt(w, sp, sp.hp + 1e6, H[1], { noDodge: true, shot: true }); }); };` },
};
// the whole fight, in the boss room, as the batches measure it
const FIGHT = { name: 'fight', args: ['--party', PARTY, '--level', '25', '--q', 'bossroom&boss=ikSpider&theme=sewers', '--secs', '75', '--speed', '1.5', '--zoom', '0.8', '--follow', 'ikSpider', '--seed', '4', '--max', '900'] };

const list = Object.entries(CLIPS).filter(([name]) => !only.length || only.includes(name));
const run = ([name, c]) => new Promise((resolve) => {
  const file = path.join(out, name + '.mp4'), ev = PRELUDE.replace('STAGE', c.stage || '');
  const a = ['tools/clip.mjs', file, '--port', port, '--secs', String(c.secs || 6), '--zoom', String(c.zoom || 1.3), '--seed', String(c.seed || 5), '--eval', ev, '--speed', String(c.speed || 1),
    '--party', c.party, '--level', '25', '--q', 'theme=sewers&bossroom&boss=ikSpider' + (c.q ? '&' + c.q : '')];
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
