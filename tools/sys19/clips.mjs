// Lane sys19 (round 19): the shared rules' clips (one shadow system, lobs on the centre, the air drawn over the floor,
// thrown weapons as held, free hands, the taunt mark), recorded with tools/clip.mjs like tools/hero-clips.mjs.
//   node tools/sys19/clips.mjs [--port 8931] [--only a,b] [--out docs/clips/sys19] [--jobs 2] [--tag before]
// Needs the dev server (node tools/serve.mjs 8931 .). Nobody is pinned in place: units are put somewhere once, then
// left to move.
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = opt('port', '8931'), out = path.resolve(opt('out', 'docs/clips/sys19')), jobs = +opt('jobs', 2), tag = opt('tag', '');
const only = (opt('only', '') || '').split(',').filter(Boolean);
const LANE = process.env.CLIP_LANE || 'delve-lane-sys19';
const TMP = path.join(os.tmpdir(), LANE); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(out, { recursive: true });

const PRELUDE = (hero) => `(async () => {
  const K = await import('./js/kits.js'), FT = await import('./js/fxtag.js'), SIM = await import('./js/sim.js'), PATH = await import('./js/path.js'), K2 = await import('./js/kits2.js');
  const R = GAME.run, w = R.world, me = w.units.find((u) => u.kind === '${hero}');
  const CX = w.W / 2, CY = w.H / 2;
  const foes = () => w.units.filter((u) => u.team !== me.team && !u.dead && u.team !== 'neutral');
  const friends = () => w.units.filter((u) => u.team === me.team && u !== me && !u.partOf && !u.summon && !u.dead);
  const put = (u, x, y, a) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; u.home = { x, y }; if (a != null) u.facing = u.mvA = a; };
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

const ABS = { grandpa: ['breadToss', 'harvest', 'oldTales'], alchemist: ['acidFlask', 'elixir', 'bangFlask'], griffon: ['swoop', 'hammerThrow', 'wingShield'],
  warhelm: ['thunderBlow', 'warHorn', 'skullSplitter'], dame: ['riposte', 'challenge', 'disarm'], oldguard: ['greatSweep', 'rallyCry', 'pommelStrike'],
  shaman: ['healTotem', 'spiritLink', 'rainDance'], warlock: ['eldritchBeam', 'summonImp', 'darkBargain'], haymaker: ['toss', 'pitchHay', 'forkCharge'], witch: ['frogHex', 'cursedBrew', 'broomRide'],
  grenadier: ['blastOff', 'bigBomb', 'clusterBomb'] };
const N = (hero, t) => { const ids = ABS[hero]; return hero + ':' + (ids.flatMap((id, i) => Array.from({ length: +t[i] }, (_, k) => id + (k + 1))).join('+') || 'root'); };
const CLIPS = {
  // Bread Toss at a hurt friend walking across: the loaf lands on its middle, one shadow on the floor under the loaf
  'grandpa-bread': { hero: 'grandpa', battle: 'rattler*2|grandpa,paladin', t: '100', secs: 6, zoom: 1.5, stage: `
    clear(); const pal = friends()[0], F = foes(); tough(F, 4, 0.2); put(me, CX - 200, CY + 40, 0); put(pal, CX - 20, CY - 60, 0); put(F[0], CX + 160, CY + 60, Math.PI); put(F[1], CX + 200, CY - 40, Math.PI);
    each = (T) => { at(T, 0.3, 'h', () => { pal.hp = pal.maxHp * 0.4; }); at(T, 1.0, 'a', () => use('breadToss', 1, pal)); at(T, 3.0, 'b', () => use('breadToss', 1, pal)); };` },
  // the Alchemist's Elixir thrown to a friend: on its middle
  'alchemist-elixir': { hero: 'alchemist', battle: 'rattler*2|alchemist,paladin', t: '010', secs: 6, zoom: 1.5, stage: `
    clear(); const pal = friends()[0], F = foes(); tough(F, 4, 0.2); put(me, CX - 200, CY + 60, 0); put(pal, CX, CY - 40, 0); put(F[0], CX + 140, CY - 40, Math.PI); put(F[1], CX + 170, CY + 50, Math.PI);
    each = (T) => { at(T, 0.3, 'h', () => { pal.hp = pal.maxHp * 0.4; }); at(T, 1.0, 'a', () => use('elixir', 1, pal)); at(T, 3.2, 'b', () => use('elixir', 1, pal)); };` },
  // a lobbed flask onto the floor (Brew Pools): its shadow on the floor, shrinking as it rises
  'alchemist-pools': { hero: 'alchemist', battle: 'rattler*3|alchemist', t: '100', secs: 5, zoom: 1.4, stage: `
    clear(); const F = foes(); tough(F, 4, 0.2); put(me, CX - 220, CY, 0); F.forEach((u, i) => put(u, CX + 100 + i * 30, CY + (i - 1) * 60, Math.PI));
    each = (T) => { at(T, 0.8, 'a', () => use('acidFlask', 1, F[1])); };` },
  // Toss: the foe flung over the others, drawn over them, not shoving them
  'haymaker-toss': { hero: 'haymaker', battle: 'rattler*5|haymaker', t: '100', secs: 5, zoom: 1.4, stage: `
    clear(); const F = foes(); tough(F, 4, 0.2); put(me, CX - 120, CY, 0); put(F[0], CX - 70, CY, Math.PI); [[40, -30], [70, 20], [100, -10], [60, 60]].forEach(([x, y], i) => put(F[i + 1], CX + x, CY + y, Math.PI));
    each = (T) => { at(T, 0.8, 'a', () => use('toss', 1, F[0])); };` },
  // Skull Splitter: the held hammer thrown, he leaps over the pack after it
  'warhelm-skull': { hero: 'warhelm', battle: 'rattler*5|warhelm', t: '001', secs: 5, zoom: 1.4, stage: `
    clear(); const F = foes(); tough(F, 4, 0.2); put(me, CX - 200, CY, 0); [[-90, 0], [-60, 50], [-60, -50], [120, 0], [150, 40]].forEach(([x, y], i) => put(F[i], CX + x, CY + y, Math.PI));
    each = (T) => { at(T, 0.8, 'a', () => use('skullSplitter', 1, F[3])); };` },
  // Warhelm's plain blows: the free hand
  'warhelm-attack': { hero: 'warhelm', battle: 'rattlerMace*1|warhelm', t: '000', secs: 5, zoom: 1.5, stage: `
    clear(); const F = foes(); tough(F, 6, 0.2); put(me, CX - 60, CY, 0); put(F[0], CX + 20, CY, Math.PI);` },
  // the Griffon's Stormhammer: the thrown hammer looks like the held one
  'griffon-hammer': { hero: 'griffon', battle: 'rattler*3|griffon', t: '010', secs: 5, zoom: 1.4, stage: `
    clear(); const F = foes(); tough(F, 4, 0.2); put(me, CX - 200, CY, 0); F.forEach((u, i) => put(u, CX + 30 + i * 60, CY + (i - 1) * 20, Math.PI));
    each = (T) => { at(T, 0.8, 'a', () => use('hammerThrow', 1, F[1])); };` },
  // free hands at rest and walking: several heroes whose other hand holds nothing
  'free-hands': { hero: 'warhelm', battle: 'rattler*2|warhelm,witch,warlock,grandpa,alchemist,jester', t: '000', secs: 5, zoom: 1.1, stage: `
    clear(); const F = foes(); tough(F, 6, 0.1); const H = [me, ...friends()]; H.forEach((h, i) => put(h, CX - 160 + (i % 3) * 110, CY - 70 + Math.floor(i / 3) * 150, 0)); F.forEach((u, i) => put(u, CX + 230, CY + (i - 0.5) * 120, Math.PI));` },
  // the Old Guard's Rally: the arm swung from the shoulder
  'oldguard-rally': { hero: 'oldguard', battle: 'rattler*2|oldguard,paladin', t: '010', secs: 5, zoom: 1.6, stage: `
    clear(); const pal = friends()[0], F = foes(); tough(F, 4, 0.2); put(me, CX - 100, CY, 0); put(pal, CX - 30, CY + 70, 0); put(F[0], CX + 160, CY, Math.PI); put(F[1], CX + 200, CY + 60, Math.PI);
    each = (T) => { at(T, 0.8, 'a', () => use('rallyCry', 1, F[0])); at(T, 3.0, 'b', () => use('rallyCry', 1, F[0])); };` },
  // the Dame's Challenge: every taunted foe gets the V over its head
  'dame-challenge': { hero: 'dame', battle: 'rattler*4|dame,paladin', t: '030', secs: 6, zoom: 1.3, stage: `
    clear(); const pal = friends()[0], F = foes(); tough(F, 4, 0.2); put(me, CX - 200, CY + 60, 0); put(pal, CX + 10, CY - 30, 0); F.forEach((u, i) => put(u, CX + 90 + (i % 2) * 60, CY - 70 + i * 40, Math.PI));
    each = (T) => { at(T, 0.3, 'h', () => { pal.hp = pal.maxHp * 0.3; }); at(T, 0.8, 'a', () => use('challenge', 3, F[0])); };` },
  // the Shaman's spirit eagle (Ancestors' Call): drawn over everyone on the floor
  'shaman-eagle': { hero: 'shaman', battle: 'rattler*4|shaman,paladin', t: '003', secs: 7, zoom: 1.3, stage: `
    clear(); const pal = friends()[0], F = foes(); tough(F, 4, 0.2); put(me, CX - 180, CY, 0); put(pal, CX - 60, CY, 0); F.forEach((u, i) => put(u, CX + 40 + (i % 2) * 60, CY + (i - 1.5) * 50, Math.PI));
    each = (T) => { at(T, 0.6, 'a', () => use('rainDance', 3, F[0])); };` },
  // the Warlock's imp: always hovering, drawn over the floor
  'warlock-imp': { hero: 'warlock', battle: 'rattler*4|warlock', t: '000', secs: 6, zoom: 1.4, stage: `
    clear(); const F = foes(); tough(F, 4, 0.2); put(me, CX - 120, CY, 0); F.forEach((u, i) => put(u, CX + 20 + (i % 2) * 50, CY + (i - 1.5) * 45, Math.PI));` },
  // the Healing Totem: one shadow, at its foot
  'shaman-totem': { hero: 'shaman', battle: 'rattler*2|shaman,paladin', t: '100', secs: 5, zoom: 1.6, stage: `
    clear(); const pal = friends()[0], F = foes(); tough(F, 4, 0.2); put(me, CX - 160, CY, 0); put(pal, CX - 40, CY, 0); put(F[0], CX + 60, CY - 20, Math.PI); put(F[1], CX + 90, CY + 40, Math.PI);
    each = (T) => { at(T, 0.6, 'h', () => { pal.hp = pal.maxHp * 0.5; }); at(T, 0.8, 'a', () => use('healTotem', 1, pal)); };` },
};

const list = Object.entries(CLIPS).filter(([name]) => !only.length || only.includes(name));
const run = ([name, c]) => new Promise((resolve) => {
  const file = path.join(out, name + (tag ? '-' + tag : '') + '.mp4'), ev = PRELUDE(c.hero).replace('STAGE', c.stage || '');
  const a = ['tools/clip.mjs', file, '--port', port, '--secs', String(c.secs || 6), '--zoom', String(c.zoom || 1.35), '--seed', '5', '--eval', ev, '--nospend', ...(c.extra || [])];
  if (c.follow) a.push('--follow', c.follow);
  if (c.q) a.push('--q', c.q);
  a.push('--battle', c.battle, '--arena', c.arena || 'crypt', '--nodes', N(c.hero, c.t));
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
