// Lane physics19 (round 19): the before / after films. Every scene is filmed twice with the same seed and staging:
// once on a copy of the game as it was (scratch/before, served on --before), once on this tree (--after).
//   node tools/physics19/clips.mjs [--after 8977] [--before 8987] [--only spider-feet,crowd] [--which before,after] [--jobs 2]
// Needs both servers:  node tools/serve.mjs 8977 .   and   node tools/serve.mjs 8987 scratch/before
// Each recording runs its own headless Edge (tools/clip.mjs) on a profile folder under this lane's temp folder; only
// those are stopped at the end.
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const PORT = { after: opt('after', '8977'), before: opt('before', '8987') };
const out = path.resolve(opt('out', 'docs/clips/physics19')), jobs = +opt('jobs', 2);
const only = (opt('only', '') || '').split(',').filter(Boolean), which = opt('which', 'before,after').split(',');
const LANE = 'delve-lane-physics19';
const TMP = path.join(os.tmpdir(), LANE); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(out, { recursive: true });

// In the page, once the fight is up: the boss (if the scene has one), the heroes, and small tools to stage a scene.
// Nobody is pinned: a hero told to stay has its walking taken away (moveMul), so whatever moves it is the physics.
const PRELUDE = `(async () => {
  const SIM = await import('./js/sim.js'), PATH = await import('./js/path.js'), R = GAME.run, w = R.world;
  const boss = w.units.find((u) => u.def.boss) || null;
  const foes = () => w.units.filter((u) => boss ? u.team === boss.team : u.team === 'enemy');
  const heroes = () => w.units.filter((u) => (boss ? u.team !== boss.team : u.team === 'hero') && !u.dead && u.team !== 'neutral' && !u.summon && !u.minion);
  for (const h of heroes()) h.forcedGoal = null; w.wp = null;
  const put = (u, x, y, a) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; u.wasX = x; u.wasY = y; u.home = { x, y }; if (a != null) u.facing = u.mvA = a; };
  const tough = (list, hp = 30, dmg = 1) => { for (const u of list) { u.maxHp = Math.round(u.maxHp * hp); u.hp = u.maxHp; u.dmgMul *= dmg; } };
  const stay = (u) => { u.moveMul = 1e-4; };
  const quiet = (u) => { if (u.kit) for (const c in u.kit.cd) u.kit.cd[c] = 999; };
  const idle = (u) => { u.atkT = 999; quiet(u); };
  const done = {}; const at = (T, t, id, f) => { if (T >= t && !done[id]) { done[id] = true; f(); } };
  const CX = w.W / 2, CY = w.H / 2;
  const clearRoom = () => { w.pillars = w.pillars.filter((p) => p.owner); w.walls = w.walls.filter((r) => r.solid); PATH.buildGrid(w); };
  if (boss) { boss.aggro = true; }
  let T = 0, each = () => {};
  STAGE
  const rf = GAME.recFrame; GAME.recFrame = (dt) => { T += dt; try { each(T, dt); } catch (e) { console.error(e); throw e; } return rf.call(GAME, dt); };
})();`;
// a boss made to last the clip (its feet are a share of its health, made on its first tick: brought back down)
const LASTS = `boss.maxHp *= 20; boss.hp = boss.maxHp; let feet = false; const fixFeet = () => { const k = boss.sp || boss.si; if (feet || !k) return; feet = true; for (const L of k.legs) if (L.foot) { L.foot.maxHp = Math.round(L.foot.maxHp / 20); L.foot.hp = L.foot.maxHp; } };`;

const CLIPS = {
  // 1. the spider's feet stepping onto units: it walks the length of its hall to one hero; four more stand in its
  // way where its feet come down (126 either side of its line), doing nothing. Half speed, close.
  'spider-feet': { room: 'theme=sewers&bossroom&boss=ikSpider&bossmove=walk', party: 'paladin,berserker,tower,oldguard', level: 25, secs: 12, speed: 0.7, zoom: 1.0, follow: 'ikSpider', stage: `
    clearRoom(); ${LASTS} const H = heroes(); tough(H); H.forEach(idle); H.forEach(stay);
    put(boss, CX + 300, CY, Math.PI); put(H[0], CX - 420, CY, 0);
    put(H[1], CX + 150, CY - 118, 0); put(H[2], CX + 60, CY + 122, 0); put(H[3], CX - 30, CY - 108, 0);
    each = () => { fixFeet(); boss.tauntBy = H[0]; boss.tauntT = 9; };` },
  // the same in a real fight: the party at its feet, at full speed
  'spider-fight': { room: 'theme=sewers&bossroom&boss=ikSpider', party: 'paladin,berserker,twinfang,tower', level: 25, secs: 16, speed: 1, zoom: 1.0, follow: 'ikSpider', stage: `
    ${LASTS} tough(heroes(), 8); each = () => { fixFeet(); };` },
  // 2. the idol's hooves: the same walk through four standing heroes (its hooves stand 180 out)
  'idol-hooves': { room: 'theme=sewers&bossroom&boss=stiltIdol&bossmove=walk', party: 'paladin,berserker,tower,oldguard', level: 25, secs: 12, speed: 0.7, zoom: 0.85, follow: 'stiltIdol', stage: `
    clearRoom(); ${LASTS} const H = heroes(); tough(H); H.forEach(idle); H.forEach(stay);
    put(boss, CX + 330, CY, Math.PI); put(H[0], CX - 420, CY, 0);
    put(H[1], CX + 150, CY - 170, 0); put(H[2], CX + 40, CY + 176, 0); put(H[3], CX - 70, CY - 160, 0);
    each = () => { fixFeet(); boss.tauntBy = H[0]; boss.tauntT = 9; };` },
  'idol-fight': { room: 'theme=sewers&bossroom&boss=stiltIdol', party: 'paladin,berserker,twinfang,tower', level: 25, secs: 16, speed: 1, zoom: 0.8, follow: 'stiltIdol', stage: `
    ${LASTS} tough(heroes(), 8); each = () => { fixFeet(); };` },
  // 3. the drake's body brushing units and walls: a real fight, the party made to last, close on its body
  'drake-fight': { room: 'theme=ember&bossroom&boss=cinder', party: 'paladin,berserker,twinfang,tower', level: 44, secs: 18, speed: 1, zoom: 0.95, follow: 'cinder', stage: `
    ${LASTS} tough(heroes(), 12);` },
  // its body dragged through four heroes who only stand there: it prowls round one hero far off
  'drake-body': { room: 'theme=ember&bossroom&boss=cinder', party: 'paladin,berserker,tower,oldguard', level: 44, secs: 12, speed: 0.6, zoom: 0.95, follow: 'cinder', stage: `
    ${LASTS} const H = heroes(); tough(H, 60); H.forEach(idle); H.forEach(stay);
    const bx = boss.x, by = boss.y; put(H[0], bx - 420, by + 40, 0);
    put(H[1], bx - 120, by - 60, 0); put(H[2], bx - 200, by + 90, 0); put(H[3], bx - 60, by + 120, 0);
    each = () => { boss.tauntBy = H[0]; boss.tauntT = 9; };` },
  // 4. a crowded melee
  crowd: { battle: 'rattler*12,rattlerSpear*6|paladin,berserker,twinfang,tower,archer,cleric', arena: 'crypt', level: 28, secs: 14, speed: 1, zoom: 1.0, stage: `tough(heroes(), 6);` },
  'crowd-big': { battle: 'ogre*3,orc*6,goblin*8|paladin,berserker,gladiator,tower,dame,cleric', arena: 'warren', level: 14, secs: 14, speed: 1, zoom: 1.0, stage: `tough(heroes(), 6);` },
  // 5. flyers over ground units: bats and ghosts on a party that stands and fights
  fliers: { battle: 'bat*10,ghost*5|paladin,tower,berserker,cleric', arena: 'crypt', level: 28, secs: 12, speed: 1, zoom: 1.25, stage: `tough(heroes(), 10); tough(foes(), 6);` },
  // fliers and walkers through each other: bats sent across a line of standing heroes
  'fliers-cross': { battle: 'bat*8,rattler*4|paladin,tower,berserker,cleric,oldguard', arena: 'crypt', level: 28, secs: 9, speed: 0.6, zoom: 1.35, stage: `
    const H = heroes(); tough(H, 30); H.forEach(idle); H.forEach(stay); tough(foes(), 30); clearRoom();
    H.forEach((h, i) => put(h, CX - 40, CY - 112 + i * 56, 0));
    const F = foes(); F.forEach((f, i) => { put(f, CX + 260, CY - 150 + i * 28, Math.PI); f.atkT = 999; f.forcedGoal = { x: CX - 330, y: CY - 150 + i * 28 }; });
    w.camAt = { x: CX, y: CY };` },
  // 6. spikes under units. The Bone King's rows of bone spikes and grave lances, in his own room
  'spikes-king': { room: 'theme=crypt&bossroom&boss=boneKing', party: 'paladin,berserker,twinfang,tower', level: 33, secs: 18, speed: 1, zoom: 1.0, follow: 'boneKing', stage: `
    boss.maxHp *= 20; boss.hp = boss.maxHp; tough(heroes(), 12);` },
  // the Earth Mage's spike chain, the spike under one enemy and the heaved slabs; the Frost Mage's nova; the Trapper's
  // caltrops; and two of a room's spike plates under the fight
  'spikes-heroes': { battle: 'rattler*8,brute*2|earthMage,frost,trapper,paladin', arena: 'crypt', q: 'allnodes', secs: 18, speed: 1, zoom: 1.15, stage: `
    tough(heroes(), 20, 0.25); tough(foes(), 14); clearRoom();
    w.hazards.push({ type: 'spikes', x: CX - 30, y: CY - 70, r: 40 }, { type: 'spikes', x: CX + 40, y: CY + 60, r: 40 });` },
  // the Winter Queen's crystals bursting out of the floor
  'spikes-queen': { room: 'theme=frost&bossroom&boss=winterQueen', party: 'paladin,berserker,twinfang,tower', level: 36, secs: 20, speed: 1, zoom: 0.95, follow: 'winterQueen', stage: `
    boss.maxHp *= 20; boss.hp = boss.maxHp; tough(heroes(), 12);` },
  // chains: two sand serpents in a melee
  serpent: { battle: 'sandSerpent*2|paladin,berserker,twinfang,tower', arena: 'dunes', level: 45, secs: 14, speed: 1, zoom: 1.1, follow: 'sandSerpent', stage: `tough(heroes(), 6); tough(foes(), 6);` },
  // things put down on bodies: hives, bombs, turrets, barricades thrown into a crowd
  structures: { battle: 'orc*6,ogre*2,wolfRider*4|engineer,beekeeper,grenadier,quartermaster,shaman,chef', arena: 'warren', level: 16, secs: 14, speed: 1, zoom: 1.05, stage: `tough(heroes(), 6); tough(foes(), 8);` },
};

const list = Object.entries(CLIPS).filter(([name]) => !only.length || only.includes(name)).flatMap(([name, c]) => which.map((wh) => [name, c, wh]));
const run = ([name, c, wh]) => new Promise((resolve) => {
  const file = path.join(out, `${wh}-${name}.mp4`), ev = PRELUDE.replace('STAGE', c.stage || '');
  const a = ['tools/clip.mjs', file, '--port', PORT[wh], '--secs', String(c.secs || 8), '--zoom', String(c.zoom || 1.2), '--seed', String(c.seed || 5), '--eval', ev, '--speed', String(c.speed || 1), '--max', '900'];
  if (c.battle) { a.push('--battle', c.battle, '--arena', c.arena || 'crypt'); if (c.q) a.push('--q', c.q); }
  else a.push('--party', c.party, '--q', c.room);
  // (a battle's heroes fight at their save's level: set through --level for a run; for a battle the stage makes them last)
  if (!c.battle) a.push('--level', String(c.level || 25));
  if (c.follow) a.push('--follow', c.follow);
  if (c.skip) a.push('--skip', String(c.skip));
  if (c.w) a.push('--w', String(c.w), '--h', String(c.h));
  const t0 = Date.now();
  execFile(process.execPath, a, { env: { ...process.env, TEMP: TMP, TMP }, maxBuffer: 1 << 24 }, (err, so, se) => {
    const msg = (so + se).trim().split('\n').filter((l) => !/^no page errors/.test(l)).join(' | ');
    console.log(`${err ? 'FAILED' : 'ok'} ${wh}-${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)${msg ? ' ' + msg.slice(0, 900) : ''}`); resolve();
  });
});
let i = 0; const next = async () => { while (i < list.length) await run(list[i++]); };
await Promise.all(Array.from({ length: Math.min(jobs, list.length) }, next));
try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${LANE}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
console.log(`${list.length} clips -> ${path.relative(process.cwd(), out)}`);
