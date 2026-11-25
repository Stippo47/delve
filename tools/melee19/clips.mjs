// Round 19 (lane melee19): the knights' and brutes' clips (a copy of tools/hero-clips.mjs with its own list), one staged battle each.
//   CLIP_LANE=melee19 node tools/melee19/clips.mjs [--port 8932] [--only griffon-attack] [--hero griffon] [--out docs/clips/melee19] [--jobs 3]
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
const port = opt('port', '8932'), out = path.resolve(opt('out', 'docs/clips/melee19')), jobs = +opt('jobs', 3);
const only = (opt('only', '') || '').split(',').filter(Boolean), heroOnly = opt('hero', '');
const LANE = process.env.CLIP_LANE || 'melee19'; // round 18: CLIP_LANE gives a run its own Edge folders, so its clean-up never stops another lane's
const TMP = path.join(os.tmpdir(), LANE); fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(out, { recursive: true });

// What every stage script can use (runs in the page, after the battle or run has started).
const PRELUDE = (hero, zoom, cam) => `(async () => {
  const RD = await import('./js/render.js'); RD.view.zoom = ${zoom};
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
  let camOn = ${cam ? `w.units.find((u) => u.kind === '${cam}')` : 'me'}, cam = null; // the camera eases after one unit (melee19: clip.mjs --follow lagged)
  const rf = GAME.recFrame; GAME.recFrame = (dt) => { T += dt; try { each(T, dt); } catch (e) { console.error(e); throw e; }
    if (camOn) { if (!cam) cam = { x: camOn.x, y: camOn.y }; cam.x += (camOn.x - cam.x) * 0.25; cam.y += (camOn.y - cam.y) * 0.25; w.camAt = cam; RD.view.snap = true; }
    return rf.call(GAME, dt); };
})();`;

// name: { hero, battle (Red | Blue) or run: party, t: the tier of each of its three abilities (three digits), secs, zoom, follow, q, stage }
const N = (hero, t) => { const ids = ABS[hero]; return hero + ':' + (ids.flatMap((id, i) => Array.from({ length: +t[i] }, (_, k) => id + (k + 1))).join('+') || 'root'); };
const ABS = { oldguard: ['greatSweep', 'rallyCry', 'pommelStrike'], dame: ['riposte', 'challenge', 'disarm'], griffon: ['swoop', 'hammerThrow', 'wingShield'],
  bulwark: ['brace', 'shieldWall', 'impale'], bearskin: ['maul', 'hibernate', 'bearRoar'], warhelm: ['thunderBlow', 'warHorn', 'skullSplitter'], haymaker: ['toss', 'pitchHay', 'forkCharge'] };
const CLIPS = {
  // ------------------------------------------------------------ Old Guard
  'oldguard-parry': { hero: 'oldguard', battle: 'rattlerMace*1,rattlerBow*1|oldguard', t: '003', secs: 5, stage: `
    clear(); put(me, CX - 60, CY, 0); const F = foes(), mace = F.find((u) => u.kind === 'rattlerMace'), bow = F.find((u) => u.kind === 'rattlerBow'); tough(F, 4, 0.3); put(mace, CX + 10, CY + 10, Math.PI); put(bow, CX + 200, CY - 60, Math.PI);
    each = (T) => { at(T, 0.6, 'a', () => use('pommelStrike', 3, mace)); at(T, 2.6, 'b', () => use('pommelStrike', 3, mace)); };` },
  'oldguard-rally': { hero: 'oldguard', battle: 'rattlerMace*3|oldguard,archer,paladin', t: '020', secs: 6, stage: `
    clear(); const [a1, a2] = friends(), F = foes(); tough(F, 4, 0.3); put(me, CX - 40, CY, 0); put(a1, CX - 110, CY - 70, 0); put(a2, CX - 100, CY + 70, 0); F.forEach((u, i) => put(u, CX + 60, CY + (i - 1) * 70, Math.PI));
    each = (T) => { at(T, 0.8, 's', () => { a1.stunT = 2; a2.stunT = 2; }); at(T, 1.3, 'a', () => use('rallyCry', 2, F[0])); };` },
  'oldguard-laststand': { hero: 'oldguard', battle: 'rattlerMace*3|oldguard,archer', t: '000', secs: 6, stage: `
    clear(); const a1 = friends()[0], F = foes(); tough(F, 4, 0.3); put(me, CX - 40, CY, 0); put(a1, CX - 120, CY - 60, 0); F.forEach((u, i) => put(u, CX + 60, CY + (i - 1) * 70, Math.PI));
    each = (T) => { at(T, 1.2, 'k', () => SIM.hurt(w, a1, 99999, F[0], { noDodge: true })); };` },
  'oldguard-laststand-friend': { hero: 'oldguard', battle: 'rattlerMace*3|oldguard,archer', t: '000', secs: 6, follow: 'archer', stage: `
    clear(); const a1 = friends()[0], F = foes(); tough(F, 4, 0.3); put(me, CX - 40, CY, 0); put(a1, CX - 140, CY - 60, 0); F.forEach((u, i) => put(u, CX + 60, CY + (i - 1) * 70, Math.PI));
    each = (T) => { at(T, 1.2, 'k', () => SIM.hurt(w, me, 99999, F[0], { noDodge: true })); };` },
  // ------------------------------------------------------------ Dame
  'dame-attack': { hero: 'dame', battle: 'rattlerMace*1|dame', t: '000', secs: 4, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 30, CY, Math.PI);` },
  'dame-challenge': { hero: 'dame', battle: 'rattlerMace*2,brute*1|dame,archer', t: '030', secs: 6, stage: `
    clear(); const arc = friends()[0], F = foes(); tough(F, 4, 0.3); put(me, CX - 200, CY + 60, 0); put(arc, CX + 20, CY - 40, 0); F.forEach((u, i) => { put(u, CX + 90 + (i % 2) * 40, CY - 60 + i * 40, Math.PI); u.target = arc; });
    each = (T) => { at(T, 0.8, 'h', () => { arc.hp = arc.maxHp * 0.35; }); at(T, 1.2, 'a', () => use('challenge', 3, F[0])); };` },
  // ------------------------------------------------------------ Griffon
  'griffon-attack': { hero: 'griffon', battle: 'rattlerMace*2|griffon', t: '000', secs: 4, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 40, CY - 15, Math.PI); put(F[1], CX + 50, CY + 45, Math.PI);` },
  'griffon-hammerThrow': { hero: 'griffon', battle: 'rattlerMace*3|griffon', t: '030', secs: 5, stage: `
    clear(); put(me, CX - 160, CY, 0); const F = foes(); tough(F, 6, 0.3); F.forEach((u, i) => put(u, CX + i * 70, CY + (i - 1) * 30, Math.PI));
    each = (T) => { if (T < 1) for (const u of F) { u.x = u.home.x; u.y = u.home.y; } at(T, 0.8, 'a', () => use('hammerThrow', 3, F[1])); };` },
  'griffon-swoop': { hero: 'griffon', battle: 'rattlerMace*3|griffon,archer', t: '300', secs: 5, stage: `
    clear(); const arc = friends()[0], F = foes(); tough(F, 4, 0.3); put(me, CX - 200, CY + 60, 0); put(arc, CX + 60, CY - 40, Math.PI); F.forEach((u, i) => { put(u, CX + 120 + (i % 2) * 30, CY - 80 + i * 45, Math.PI); u.target = arc; });
    each = (T) => { at(T, 0.6, 'h', () => { arc.hp = arc.maxHp * 0.4; }); at(T, 1.0, 'a', () => use('swoop', 3, F[0])); };` },
  'griffon-wingShield': { hero: 'griffon', battle: 'rattlerMace*3|griffon', t: '003', secs: 6, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 6, 0.3); F.forEach((u, i) => put(u, CX + 40 + (i % 2) * 20, CY + (i - 1) * 55, Math.PI));
    each = (T) => { at(T, 0.6, 'a', () => use('wingShield', 3, F[0])); };` },
  // ------------------------------------------------------------ Bulwark
  'bulwark-attack': { hero: 'bulwark', battle: 'rattlerMace*2|bulwark', t: '000', secs: 5, stage: `
    clear(); put(me, CX - 50, CY, 0); const F = foes(); tough(F, 8, 0.4); put(F[0], CX + 40, CY - 10, Math.PI); put(F[1], CX + 120, CY + 10, Math.PI);` },
  'bulwark-brace': { hero: 'bulwark', battle: 'rattlerMace*2|bulwark', t: '300', secs: 5, stage: `
    clear(); put(me, CX - 80, CY, 0); const F = foes(); tough(F, 8, 0.4); put(F[0], CX + 120, CY - 20, Math.PI); put(F[1], CX + 180, CY + 40, Math.PI);
    each = (T) => { at(T, 0.4, 'a', () => use('brace', 3, F[0])); };` },
  // ------------------------------------------------------------ Warhelm
  'warhelm-attack': { hero: 'warhelm', battle: 'rattlerMace*2|warhelm', t: '000', secs: 4, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 40, CY - 15, Math.PI); put(F[1], CX + 50, CY + 45, Math.PI);` },
  'warhelm-skullSplitter': { hero: 'warhelm', battle: 'rattlerMace*3|warhelm', t: '003', secs: 5, stage: `
    clear(); put(me, CX - 180, CY, 0); const F = foes(); tough(F, 6, 0.3); F.forEach((u, i) => put(u, CX + 40 + (i % 2) * 30, CY + (i - 1) * 50, Math.PI));
    each = (T) => { if (T < 1) for (const u of F) { u.x = u.home.x; u.y = u.home.y; } at(T, 0.8, 'a', () => use('skullSplitter', 3, F[1])); };` },
  // ------------------------------------------------------------ Bearskin
  'bearskin-bearRoar1': { hero: 'bearskin', battle: 'rattlerMace*2|bearskin', t: '001', secs: 6, stage: `
    clear(); put(me, CX - 120, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 20, CY, Math.PI); put(F[1], CX + 140, CY + 90, Math.PI);
    each = (T) => { at(T, 0.6, 'a', () => use('bearRoar', 1, F[0])); };` },
  'bearskin-bearRoar3': { hero: 'bearskin', battle: 'rattlerMace*2|bearskin', t: '003', secs: 6, stage: `
    clear(); put(me, CX - 120, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 20, CY, Math.PI); put(F[1], CX + 140, CY + 90, Math.PI);
    each = (T) => { at(T, 0.6, 'a', () => use('bearRoar', 3, F[0])); };` },
  'bearskin-hibernate': { hero: 'bearskin', battle: 'rattlerMace*2|bearskin', t: '030', secs: 7, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 8, 0.05); put(F[0], CX + 40, CY - 15, Math.PI); put(F[1], CX + 50, CY + 45, Math.PI);
    each = (T) => { at(T, 0.6, 'h', () => { me.hp = me.maxHp * 0.3; }); at(T, 0.8, 'a', () => use('hibernate', 3, F[0])); at(T, 4.2, 'w', () => SIM.hurt(w, me, me.maxHp * 0.25, F[0], { noDodge: true })); };` },
  'bearskin-maul': { hero: 'bearskin', battle: 'rattlerMace*3|bearskin', t: '300', secs: 5, zoom: 2.1, stage: `
    clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 30, CY, Math.PI); put(F[1], CX + 80, CY - 60, Math.PI); put(F[2], CX + 80, CY + 60, Math.PI);
    each = (T) => { at(T, 0.8, 'a', () => use('maul', 3, F[0])); };` },
  // ------------------------------------------------------------ Haymaker
  'haymaker-attack': { hero: 'haymaker', battle: 'rattlerMace*1|haymaker', t: '000', secs: 4, stage: `
    clear(); put(me, CX - 60, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 40, CY, Math.PI);` },
  'haymaker-toss': { hero: 'haymaker', battle: 'rattlerMace*2|haymaker', t: '300', secs: 5, stage: `
    clear(); put(me, CX - 20, CY, 0); const F = foes(); tough(F, 8, 0.3); put(F[0], CX + 40, CY - 10, Math.PI); put(F[1], CX + 50, CY + 50, Math.PI);
    each = (T) => { at(T, 0.8, 'a', () => use('toss', 3, F[0])); };` },
  'haymaker-forkCharge': { hero: 'haymaker', battle: 'rattlerMace*3|haymaker', t: '003', secs: 6, stage: `
    clear(); put(me, CX - 200, CY, 0); const F = foes(); tough(F, 8, 0.3); F.forEach((u, i) => put(u, CX + 40 + i * 30, CY + (i - 1) * 60, Math.PI));
    each = (T) => { at(T, 0.5, 'a', () => use('forkCharge', 3, F[1])); };` },
};
for (const c of Object.values(CLIPS)) if (c.same) c.stage = CLIPS[c.same].stage;

const list = Object.entries(CLIPS).filter(([name, c]) => (!only.length || only.includes(name)) && (!heroOnly || c.hero === heroOnly));
const run = ([name, c]) => new Promise((resolve) => {
  const file = path.join(out, name + '.mp4'), ev = PRELUDE(c.hero, c.zoom || 2.6, c.follow).replace('STAGE', c.stage || '');
  // a battle is framed by the game's own battle camera (everyone in it); a run follows the hero. c.follow: a kind to stay on instead
  // (round 15, lane E: clip.mjs spends skill points by default now; --nospend keeps these clips as they were made: the
  // battle's hero has exactly the nodes of its tiers, a run's party none, and each stage uses its move at the tier named)
  const a = ['tools/clip.mjs', file, '--port', port, '--secs', String(c.secs || 6), '--w', String(c.w || 600), '--h', String(c.h || 450), '--seed', '5', '--eval', ev, '--nospend', ...(c.extra || [])];
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
try { execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${LANE}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' }); } catch {}
console.log(`${list.length} clips -> ${path.relative(process.cwd(), out)}`);
