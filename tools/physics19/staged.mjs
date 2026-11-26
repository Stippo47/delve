// Lane physics19 (round 19): the staged scenes of the films, without the film: a boss walks (or its body is dragged)
// through heroes who only stand there, and every step each standing hero's move is measured.
//   node tools/physics19/staged.mjs [--root <tree>] [--secs 12] [--seeds 6]
// For each boss: the worst single step a standing hero was moved, how many steps moved one 6 or more (a jump), how far
// they were moved in all, how many times a foot stood on a hero at the end of a step (on the floor, more than 6 into
// one: the game as it was threw the hero out in that same step, so it reads 0 there for another reason), and the worst
// single step the boss's own body made that its walk does not explain (its first moments left out: it is set up then).
import PATH from 'node:path'; import URL_ from 'node:url';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const here = PATH.dirname(URL_.fileURLToPath(import.meta.url)), root = PATH.resolve(opt('root', PATH.join(here, '..', '..')));
const imp = (f) => import(URL_.pathToFileURL(PATH.join(root, 'js', f)).href);
globalThis.location = { search: '?bossmove=walk' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await imp('battle.js'), { setSeed } = await imp('util.js'), { freshSave } = await imp('save.js'), P = await imp('progress.js'), PT = await imp('path.js');
const save = freshSave(); save.cheat = true;
const DT = 1 / 60, SECS = +opt('secs', 12), SEEDS = +opt('seeds', 6);
const party = ['paladin', 'berserker', 'tower', 'oldguard'];
// [boss, arena, level, how far to the side the standing heroes are]
const SCENES = [['ikSpider', 'sewers', 25, 118], ['stiltIdol', 'sewers', 25, 172], ['cinder', 'ember', 44, 70], ['sandSerpent', 'dunes', 40, 40]];
for (const [boss, arena, lvl, side] of SCENES) {
  let worst = 0, jumps = 0, moved = 0, landings = 0, bossWorst = 0, steps = 0;
  for (let sd = 0; sd < SEEDS; sd++) {
    setSeed(40 + sd * 7);
    for (const id of party) { const hv = save.heroes[id]; hv.owned = true; hv.level = lvl; hv.nodes = {}; hv.points = P.START_POINTS + lvl - 1; P.autoSpend(save, id); }
    const run = B.newBattle(save, { arena, size: 'l', a: party.map((k) => ({ k, n: 1 })), b: [{ k: boss, n: 1 }] });
    globalThis.GAME = { run };
    const w = run.world; w.pillars = w.pillars.filter((p) => p.owner); w.walls = []; PT.buildGrid(w);
    const b = w.units.find((u) => u.kind === boss), H = w.units.filter((u) => u.team !== b.team);
    const CX = w.W / 2, CY = w.H / 2, put = (u, x, y) => { u.x = x; u.y = y; u.vx = u.vy = u.kx = u.ky = 0; u.wasX = x; u.wasY = y; u.home = { x, y }; };
    for (const h of H) { h.maxHp *= 99; h.hp = h.maxHp; h.atkT = 999; if (h.kit) for (const c in h.kit.cd) h.kit.cd[c] = 999; h.moveMul = 1e-4; }
    b.maxHp *= 99; b.hp = b.maxHp;
    put(b, CX + 300, CY); put(H[0], CX - 420, CY);
    const sx = (sd % 3 - 1) * 14; // the standing heroes a little to one side or the other each seed
    put(H[1], CX + 150 + sx, CY - side); put(H[2], CX + 60 - sx, CY + side); put(H[3], CX - 30 + sx, CY - side);
    const prev = new Map(), on = new Set();
    for (let t = 0; t < SECS; t += DT) {
      b.tauntBy = H[0]; b.tauntT = 9;
      for (const u of w.units) prev.set(u, { x: u.x, y: u.y });
      const t0 = w.time; B.updateBattle(run, DT); if (w.time === t0) continue; steps++;
      for (const h of H.slice(1)) { const p = prev.get(h), d = Math.hypot(h.x - p.x, h.y - p.y); if (Math.hypot(h.kx, h.ky) > 60 || h.stunT > 0) continue; moved += d; if (d > worst) worst = d; if (d >= 6) jumps++; }
      { const p = prev.get(b), ex = b.x - p.x - b.vx * DT, ey = b.y - p.y - b.vy * DT, e = Math.hypot(ex, ey); const k = b.sp || b.si; if (t > 0.3 && !(k && (k.slam || k.fall)) && e > bossWorst) bossWorst = e; }
      for (const f of w.units) { if (!(f.partOf === b) || f.dead || (f.hop || 0) > 1 || !/Foot/.test(f.kind)) continue;
        for (const h of H.slice(1)) { const key = f.id + ':' + h.id, deep = f.r + h.r - Math.hypot(f.x - h.x, f.y - h.y); if (deep > 6) { if (!on.has(key)) { on.add(key); landings++; } } else if (deep < 0) on.delete(key); } }
    }
  }
  console.log(`${boss.padEnd(13)} ${SEEDS} runs of ${SECS}s: a standing hero's worst single step ${worst.toFixed(1)}, steps of 6 or more ${jumps}, moved ${Math.round(moved / SEEDS)} a run in all; a foot left standing on a hero ${landings} times; the boss's own worst unexplained step ${bossWorst.toFixed(1)}`);
}
