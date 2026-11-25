// Round 19 (lane art-hitfx): the clips of the trial hit looks (js/fx-hit-r19.js, ?hitfx=), one staged battle or run each,
// every effect in each of its options. Made after tools/melee19/clips.mjs.
//   CLIP_LANE=art-hitfx node tools/art-hitfx/clips.mjs [--port 18946] [--only mark-sharp-1,death-bone-2] [--board death-bone]
//     [--out design/r19-art/hitfx] [--jobs 3]
// Needs the dev server (node tools/serve.mjs <port>). Edge: every run's profile folder is made under this lane's own temp
// folder, so whatever is left running can be stopped without touching another lane's.
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = opt('port', '18946'), out = path.resolve(opt('out', 'design/r19-art/hitfx')), jobs = +opt('jobs', 3);
const only = (opt('only', '') || '').split(',').filter(Boolean), boardOnly = (opt('board', '') || '').split(',').filter(Boolean);
const LANE = process.env.CLIP_LANE || 'art-hitfx';
const TMP = path.join(os.tmpdir(), LANE); fs.mkdirSync(TMP, { recursive: true });

const PRELUDE = (hero, zoom) => `(async () => {
  const RD = await import('./js/render.js'); RD.view.zoom = ${zoom};
  const SIM = await import('./js/sim.js'), PATH = await import('./js/path.js');
  const R = GAME.run, w = R.world, me = w.units.find((u) => u.kind === '${hero}' && u.team === 'hero') || w.units.find((u) => u.team === 'hero');
  const CX = w.W / 2, CY = w.H / 2;
  const foes = () => w.units.filter((u) => u.team !== me.team && !u.dead && u.team !== 'neutral');
  const friends = () => w.units.filter((u) => u.team === me.team && u !== me && !u.summon && !u.dead);
  const heroes = () => w.units.filter((u) => u.team === me.team && !u.summon && !u.dead);
  const put = (u, x, y, a) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; u.home = { x, y }; if (a != null) u.facing = u.mvA = a; };
  const tough = (list, hp = 6, dmg = 0.3) => { for (const u of list) { u.maxHp = Math.round(u.maxHp * hp); u.hp = u.maxHp; u.dmgMul *= dmg; } };
  const clear = () => { w.pillars = []; w.walls = w.walls.filter((r) => r.solid); w.hazards = []; PATH.buildGrid(w); };
  const quiet = (u) => { if (u.kit) for (const k in u.kit.cd) u.kit.cd[k] = 999; };
  const hold = (list) => { for (const u of list) { u.x = u.home.x; u.y = u.home.y; u.vx = u.vy = 0; } };
  const mid = (a, b, k = 0.5) => () => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
  const done = {}; const at = (T, t, id, f) => { if (T >= t && !done[id]) { done[id] = true; f(); } };
  for (const u of heroes()) quiet(u);
  let T = 0, each = () => {}, look = null, calm = true;
  STAGE
  let cam = null;
  const rf = GAME.recFrame; GAME.recFrame = (dt) => { T += dt; try { each(T, dt); } catch (e) { console.error(e); throw e; }
    if (calm) for (const e of foes()) e.atkT = Math.max(e.atkT || 0, 0.3);
    const L = look ? look() : me; if (L) { if (!cam) cam = { x: L.x, y: L.y }; cam.x += (L.x - cam.x) * 0.25; cam.y += (L.y - cam.y) * 0.25; w.camAt = cam; RD.view.snap = true; }
    return rf.call(GAME, dt); };
})();`;

// ---------------------------------------------------------------- the stages, one per board
const STAGES = {
  // a party knight's sword (sharp) on a held foe
  'mark-sharp': { key: 'mark', hero: 'dame', battle: 'rattlerMace*1|dame', secs: 3, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 30); put(F[0], CX + 40, CY, Math.PI); look = mid(me, F[0], 0.55); me.atkT = 0.2;
    each = (T) => { hold(F); };` },
  // the Paladin's mace (blunt)
  'mark-blunt': { key: 'mark', hero: 'paladin', battle: 'rattlerMace*1|paladin', secs: 3.5, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 30); put(F[0], CX + 42, CY, Math.PI); look = mid(me, F[0], 0.55);
    each = (T) => { hold(F); me.atkT = Math.min(me.atkT, 0.8); };` },
  // magic in each element: four casters round one foe, each blow its element (fire, frost, poison, holy, curse, nature, water, plain)
  'mark-magic': { key: 'mark', hero: 'pyromancer', battle: 'rattlerMace*1|pyromancer,frost,cleric,necromancer', secs: 3.2, zoom: 2.7, stage: `
    clear(); const F = foes(); tough(F, 30); put(F[0], CX, CY, Math.PI); const H = heroes();
    H.forEach((h, i) => { const a = Math.PI + (i - 1.5) * 0.95; put(h, CX + Math.cos(a) * 105, CY + Math.sin(a) * 105, a + Math.PI); h.atkT = 99; });
    look = () => ({ x: F[0].x - 25, y: F[0].y }); const SEQ = [['burn', 0], ['chill', 1], ['poison', 2], ['radiance', 3], ['curse', 0], ['entangle', 1], ['wet', 2], [null, 3]];
    each = (T) => { hold(F); for (const h of H) { h.atkT = 99; h.x = h.home.x; h.y = h.home.y; } SEQ.forEach(([st, i], j) => at(T, 0.25 + j * 0.36, 'm' + j, () => SIM.hurt(w, F[0], 1, H[i], { magic: true, noDodge: true, ...(st ? { [st]: 4 } : {}) }))); };` },
  // the body's reaction: a knight and a paladin each on a foe, the foes' blows landing on them too
  'struck': { key: 'struck', hero: 'dame', battle: 'rattlerMace*1,rattler*1|dame,paladin', secs: 3, zoom: 2.0, q: 'hitfx_mark=1', stage: `
    clear(); const F = foes(), P = friends()[0]; tough(F, 30, 0.05); tough([me, P], 10); put(me, CX - 40, CY - 55, 0); put(P, CX - 40, CY + 55, 0); put(F[0], CX + 38, CY - 55, Math.PI); put(F[1], CX + 40, CY + 55, Math.PI);
    calm = false; look = () => ({ x: CX - 5, y: CY }); each = (T) => { hold(F); };` },
  // every blow a critical one (a hook on the knight)
  'crit': { key: 'crit', hero: 'dame', battle: 'rattlerMace*1|dame', secs: 3, q: 'hitfx_mark=1', stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 30); put(F[0], CX + 40, CY, Math.PI); look = mid(me, F[0], 0.55);
    me.trinketHooks = [...(me.trinketHooks || []), { dealt: (w2, u, t, amt, o) => { if (!o.dot) o.crit = true; return amt; } }];
    each = (T) => { hold(F); };` },
  // the foes' blows on the Paladin's raised shield (he faces them and doesn't strike)
  'block': { key: 'block', hero: 'paladin', battle: 'rattler*1|paladin', secs: 3, zoom: 2.8, q: 'hitfx_mark=1', stage: `
    clear(); const F = foes(); tough(F, 30, 0.1); tough([me], 10); put(me, CX - 30, CY, 0); put(F[0], CX + 32, CY, Math.PI);
    calm = false; look = mid(me, F[0], 0.5); each = (T) => { hold(F); hold([me]); me.facing = 0; me.atkT = 99; F[0].facing = Math.PI; F[0].atkT = Math.min(F[0].atkT, 0.7); };` },
  // a foe that dodges most blows
  'miss': { key: 'miss', hero: 'dame', battle: 'rattlerMace*1|dame', secs: 3, q: 'hitfx_mark=1', stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 30); put(F[0], CX + 40, CY, Math.PI); F[0].def = { ...F[0].def, dodge: 0.75 }; look = mid(me, F[0], 0.55);
    each = (T) => { hold(F); };` },
  // blasts (sim.js explode) among four held foes
  'blast-small': { key: 'blast', hero: 'dame', battle: 'rattler*4|dame', secs: 3, zoom: 2.2, q: 'hitfx_mark=1', stage: `
    clear(); const F = foes(); tough(F, 50); put(me, CX - 170, CY, 0); me.atkT = 99; F.forEach((u, i) => put(u, CX - 40 + (i % 2) * 80, CY - 40 + Math.floor(i / 2) * 80, Math.PI));
    look = () => ({ x: CX, y: CY }); each = (T) => { hold(F); me.atkT = 99; at(T, 0.3, 'a', () => SIM.explode(w, CX - 40, CY - 40, 42, 2, {}, me, '#FFB347')); at(T, 1.3, 'b', () => SIM.explode(w, CX + 40, CY + 40, 42, 2, { burn: 5 }, me, '#FFB347')); };` },
  'blast-big': { key: 'blast', hero: 'dame', battle: 'rattler*4|dame', secs: 2.2, zoom: 1.8, q: 'hitfx_mark=1', stage: `
    clear(); const F = foes(); tough(F, 50); put(me, CX - 230, CY, 0); me.atkT = 99; F.forEach((u, i) => put(u, CX - 50 + (i % 2) * 100, CY - 50 + Math.floor(i / 2) * 100, Math.PI));
    look = () => ({ x: CX, y: CY }); each = (T) => { hold(F); me.atkT = 99; at(T, 0.4, 'a', () => SIM.explode(w, CX, CY, 125, 2, { burn: 5 }, me, '#FFB347')); };` },
  'blast-element': { key: 'blast', hero: 'dame', battle: 'rattler*4|dame', secs: 3.4, zoom: 2.0, q: 'hitfx_mark=1', stage: `
    clear(); const F = foes(); tough(F, 50); put(me, CX - 200, CY, 0); me.atkT = 99; F.forEach((u, i) => put(u, CX - 45 + (i % 2) * 90, CY - 45 + Math.floor(i / 2) * 90, Math.PI));
    look = () => ({ x: CX, y: CY }); const B = [[CX - 45, CY - 45, { chill: 5 }, '#9FDDF6'], [CX + 45, CY - 45, { poison: 5 }, '#7DB83A'], [CX - 45, CY + 45, { radiance: 5 }, '#F2C14E'], [CX + 45, CY + 45, { curse: 5 }, '#9B7BD6']];
    each = (T) => { hold(F); me.atkT = 99; B.forEach(([x, y, st, col], i) => at(T, 0.3 + i * 0.7, 'b' + i, () => SIM.explode(w, x, y, 62, 2, st, me, col))); };` },
  // heals: a big heal, a heal over time, another big one
  'heal': { key: 'heal', hero: 'cleric', battle: 'rattlerMace*1|dame,paladin,cleric', secs: 3, zoom: 2.2, stage: `
    clear(); const F = foes(); tough(F, 30); put(F[0], CX + 260, CY, Math.PI); const K = heroes().find((u) => u.kind === 'dame'), P = heroes().find((u) => u.kind === 'paladin');
    put(me, CX - 70, CY, 0); put(K, CX + 10, CY - 45, 0); put(P, CX + 10, CY + 45, 0); for (const h of heroes()) { h.hp = h.maxHp * 0.3; h.atkT = 99; }
    look = () => ({ x: CX - 20, y: CY }); each = (T, dt) => { hold(F); for (const h of heroes()) { h.x = h.home.x; h.y = h.home.y; h.atkT = 99; }
      at(T, 0.3, 'a', () => SIM.heal(w, K, K.maxHp * 0.3, me)); if (T > 0.9 && T < 2.0) SIM.heal(w, P, P.maxHp * 0.25 * dt, me); at(T, 2.0, 'b', () => SIM.heal(w, me, me.maxHp * 0.3, me)); };` },
  // buffs landing: rage, war song, haste, a ward
  'buff': { key: 'buff', hero: 'dame', battle: 'rattlerMace*1|dame,archer,paladin', secs: 3.2, zoom: 2.4, stage: `
    clear(); const F = foes(); tough(F, 30); put(F[0], CX + 360, CY, Math.PI); const A = heroes().find((u) => u.kind === 'archer'), P = heroes().find((u) => u.kind === 'paladin');
    put(me, CX - 75, CY - 40, 0); put(A, CX + 45, CY - 40, 0); put(P, CX - 15, CY + 60, 0);
    look = () => ({ x: CX - 15, y: CY }); each = (T) => { hold(F); for (const h of heroes()) { h.x = h.home.x; h.y = h.home.y; h.atkT = 99; }
      at(T, 0.3, 'a', () => SIM.addBuff(me, { id: 'bargain', dur: 5, atkSpeed: 1.8, glow: '#E05AB8' }));
      at(T, 1.0, 'b', () => SIM.addBuff(A, { id: 'warSong', dur: 8, atkSpeed: 1.5, glow: '#FFD27A' }));
      at(T, 1.7, 'c', () => SIM.addBuff(P, { id: 'haste', dur: 4, move: 1.3, atkSpeed: 1.3 }));
      at(T, 2.4, 'd', () => SIM.addBuff(me, { id: 'warded', dur: 4, border: '#BFE6FF', taken: 0.8 })); };` },
  // xp: two kills near the party in a run
  'xp': { key: 'xp', hero: 'dame', run: 'dame,archer,cleric', secs: 3, zoom: 1.9, q: 'hitfx_mark=1&hitfx_death=1', stage: `
    clear(); const F0 = foes(), F = [...F0.filter((u) => !u.def.splits), ...F0.filter((u) => u.def.splits)]; const H = heroes(); H.forEach((h, i) => { put(h, CX - 110, CY - 80 + i * 80, 0); h.atkT = 99; });
    F.forEach((u, i) => { if (i < 2) { put(u, CX + 70, CY - 50 + i * 100, Math.PI); u.aggro = false; } else { u.x = w.W + 3000; u.ethereal = true; } });
    look = () => ({ x: CX - 20, y: CY }); each = (T) => { for (const h of H) { h.x = h.home.x; h.y = h.home.y; h.atkT = 99; } for (const u of F.slice(0, 2)) if (!u.dead) { u.x = u.home.x; u.y = u.home.y; u.atkT = 9; u.abilT = 99; u.act = null; }
      at(T, 0.4, 'a', () => SIM.hurt(w, F[0], 99999, me, { noDodge: true })); at(T, 1.5, 'b', () => SIM.hurt(w, F[1], 99999, me, { noDodge: true })); };` },
  // level-ups in a run
  'level': { key: 'level', hero: 'dame', run: 'dame,archer', secs: 3.2, zoom: 2.8, stage: `
    clear(); const F = foes(); for (const u of F) { u.x = w.W + 3000; u.ethereal = true; } const H = heroes(); H.forEach((h, i) => { put(h, CX - 50 + i * 110, CY, 0); h.atkT = 99; });
    look = () => ({ x: CX + 5, y: CY - 15 }); each = (T) => { for (const h of H) { h.x = h.home.x; h.y = h.home.y; } at(T, 0.3, 'a', () => { R.heroes.dame.level++; }); at(T, 1.7, 'b', () => { R.heroes.archer.level++; }); };` },
  // coins dropping round the knight and pulled in
  'coin': { key: 'coin', hero: 'dame', run: 'dame', secs: 3, zoom: 2.6, stage: `
    clear(); const F = foes(); for (const u of F) { u.x = w.W + 3000; u.ethereal = true; } put(me, CX - 20, CY, 0);
    look = () => ({ x: me.x, y: me.y - 10 }); each = (T) => { hold([me]); me.atkT = 99; at(T, 0.2, 'a', () => SIM.scatterCoins(w, CX + 40, CY, 5, 0.35)); at(T, 1.3, 'b', () => SIM.scatterCoins(w, CX - 80, CY + 10, 5, 0.35)); };` },
};
// deaths: two of one family fall, one after the other
const FAM = { bone: 'rattler*1,rattlerMace*1', slime: 'slime*1,slimePoison*1', beast: 'wolf*1,boar*1', construct: 'automaton*1,cogSprite*1', spirit: 'ghost*1,wisp*1' };
for (const [fam, b] of Object.entries(FAM)) STAGES['death-' + fam] = { key: 'death', hero: 'dame', battle: b + '|dame', secs: 3, zoom: 2.3, q: 'hitfx_mark=1', stage: `
    clear(); const F = foes(); put(me, CX - 90, CY, 0); me.atkT = 99; F.forEach((u, i) => { put(u, CX + 10, CY - 40 + i * 80, Math.PI); u.atkT = 9; if (u.incorp) u.incorp = null; });
    const S0 = new Set(w.units); look = () => ({ x: CX - 10, y: CY }); each = (T) => { me.atkT = 99; w.hazards = []; w.projectiles = w.projectiles.filter((p) => S0.has(p.owner)); for (const u of w.units) if (!S0.has(u) && u.team !== me.team) { u.x = w.W + 3000; u.ethereal = true; } /* (what a death spawns, splits and pools, kept out of the family's clip) */ me.x = me.home.x; me.y = me.home.y; for (const u of F) if (!u.dead) { u.x = u.home.x; u.y = u.home.y; u.incorpT = 0; }
      at(T, 0.4, 'a', () => SIM.hurt(w, F[0], 99999, me, { noDodge: true, magic: true, knock: 25 })); at(T, 1.6, 'b', () => SIM.hurt(w, F[1], 99999, me, { noDodge: true, magic: true, knock: 25 })); };` };

// every board in options 1-3: a clip each
const CLIPS = {};
for (const [board, s] of Object.entries(STAGES)) for (const o of [1, 2, 3]) CLIPS[board + '-' + o] = { ...s, board, o };
const list = Object.entries(CLIPS).filter(([name, c]) => (!only.length || only.includes(name)) && (!boardOnly.length || boardOnly.includes(c.board)));
const run = ([name, c]) => new Promise((resolve) => {
  const dir = path.join(out, c.board); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${c.board}-${c.o}.mp4`), ev = PRELUDE(c.hero, c.zoom || 2.6).replace('STAGE', c.stage || '');
  const q = `hitfx=0&hitfx_${c.key}=${c.o}${c.q ? '&' + c.q : ''}`;
  const a = ['tools/clip.mjs', file, '--port', port, '--secs', String(c.secs || 3), '--w', String(c.w || 600), '--h', String(c.h || 450), '--seed', '5', '--skip', '0.6', '--eval', ev, '--nospend', '--q', q];
  if (c.battle) a.push('--battle', c.battle, '--arena', c.arena || 'crypt');
  else a.push('--party', c.run, '--level', '5');
  const t0 = Date.now();
  execFile(process.execPath, a, { env: { ...process.env, TEMP: TMP, TMP }, maxBuffer: 1 << 24 }, (err, so, se) => {
    const msg = (so + se).trim().split('\n').filter((l) => !/^no page errors/.test(l)).join(' | ');
    console.log(`${err ? 'FAILED' : 'ok'} ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)${msg ? ' ' + msg.slice(0, 600) : ''}`); resolve();
  });
});
let i = 0; const next = async () => { while (i < list.length) await run(list[i++]); };
await Promise.all(Array.from({ length: Math.min(jobs, list.length) }, next));
try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*\\${LANE}\\*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
console.log(`${list.length} clips -> ${path.relative(process.cwd(), out)}`);
