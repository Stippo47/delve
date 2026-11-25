// Lane downed18: two battle-mode clips, recorded with tools/clip.mjs (each a real battle, staged through --eval).
//   node tools/serve.mjs 8977 .        (this lane's own server port)
//   node tools/downed18/clips.mjs [--port 8977] [--out docs/clips/downed18] [--only valkyrie-revive]
// clip.mjs opens its own headless Edge on a fresh delve-edge-XXXX profile folder and only ever stops processes on that
// folder (tools/edge.mjs), so other lanes' browsers are left alone.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = opt('port', '8977'), out = path.resolve(opt('out', 'docs/clips/downed18')), only = (opt('only', '') || '').split(',').filter(Boolean);
fs.mkdirSync(out, { recursive: true });

const PRELUDE = `(async () => {
  const K = await import('./js/kits.js'), H = await import('./js/heroes.js'), SIM = await import('./js/sim.js'), PATH = await import('./js/path.js');
  const R = GAME.run, w = R.world, CX = w.W / 2, CY = w.H / 2;
  const of = (side, k) => R.sides[side].find((u) => u.kind === k);
  const put = (u, x, y, a) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; u.home = { x, y }; if (a != null) u.facing = u.mvA = a; };
  const tough = (u, hp = 4, dmg = 0.3) => { u.maxHp = Math.round(u.maxHp * hp); u.hp = u.maxHp; u.dmgMul *= dmg; };
  const quiet = (u) => { if (u.kit) for (const k in u.kit.cd) u.kit.cd[k] = 999; };
  const tier = (u, t) => K.initKit(u, u.kind, { nodes: H.tierBuild(u.kind, t) }, 1);
  w.pillars = []; w.walls = w.walls.filter((r) => r.solid); PATH.buildGrid(w);
  const done = {}; const at = (T, t, id, f) => { if (T >= t && !done[id]) { done[id] = true; f(); } };
  let T = 0, each = () => {};
  STAGE
  const rf = GAME.recFrame; GAME.recFrame = (dt) => { T += dt; try { each(T, dt); } catch (e) { console.error(e); throw e; } return rf.call(GAME, dt); };
})();`;

const CLIPS = {
  // A Blue paladin goes down (grey, the bleed-out ring in Blue's colour); the Valkyrie (Call at tier III) flies to him,
  // brings him back in a burst, then carries him clear.
  'valkyrie-revive': { battle: 'goblin*3|valkyrie,paladin', secs: 8, zoom: 1.3, stage: `
    const valk = of('a', 'valkyrie'), pal = of('a', 'paladin'), F = R.sides.b;
    tier(valk, 3); quiet(valk); quiet(pal); tough(valk, 3, 1); tough(pal, 1, 1);
    put(valk, CX - 230, CY + 40, 0); put(pal, CX - 20, CY, 0);
    F.forEach((u, i) => { tough(u, 5, 0.25); put(u, CX + 60 + (i % 2) * 40, CY + (i - 1) * 60, Math.PI); });
    each = (T) => {
      at(T, 1.4, 'down', () => { SIM.hurt(w, pal, pal.hp + 9999, F[0], { noDodge: true, knock: 120 }); });
      at(T, 3.0, 'call', () => { valk.kit.cd.valkyrieCall = 0; }); // (her score fires it now a friend is downed)
    };` },
  // A Red archer goes down; nobody brings her back, she bleeds out (sped up here: 3.5 s left) and leaves her body; the
  // Blue Necromancer raises it as three skeletons. (While she is only downed there is no body to raise.)
  'necro-raise': { battle: 'archer,berserker|necromancer,paladin', secs: 9, zoom: 1.3, stage: `
    const nec = of('a', 'necromancer'), pal = of('a', 'paladin'), arc = of('b', 'archer'), ber = of('b', 'berserker');
    tier(nec, 1); quiet(nec); quiet(pal); quiet(ber); quiet(arc); tough(pal, 4, 0.3); tough(ber, 4, 0.2); tough(nec, 3, 1);
    put(nec, CX - 180, CY + 30, 0); put(pal, CX - 50, CY - 30, 0); put(ber, CX + 30, CY - 30, Math.PI); put(arc, CX + 70, CY + 80, Math.PI);
    each = (T) => {
      at(T, 1.0, 'down', () => { SIM.hurt(w, arc, arc.hp + 9999, pal, { noDodge: true, knock: 140 }); });
      at(T, 1.05, 'bleed', () => { arc.bleedT = 3.5; });
      at(T, 5.2, 'raise', () => { nec.kit.cd.raiseDead = 0; });
    };` },
};

for (const [name, c] of Object.entries(CLIPS)) {
  if (only.length && !only.includes(name)) continue;
  const file = path.join(out, name + '.mp4');
  const ev = PRELUDE.replace('STAGE', c.stage);
  console.log('recording', name);
  execFileSync(process.execPath, ['tools/clip.mjs', file, '--port', port, '--secs', String(c.secs), '--zoom', String(c.zoom), '--seed', '5', '--battle', c.battle, '--arena', 'crypt', '--eval', ev, '--nospend'], { stdio: 'inherit' });
}
