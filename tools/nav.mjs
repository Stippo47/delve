// Navigation check (lane S, round 8): how often units are stuck behind rocks, crates, walls and each other.
//   node tools/nav.mjs [--n 6] [--theme all|crypt|...] [--seed 1] [--first] [--v]
// Every 2 simulated seconds, for each unit that wanted to move the whole time (sim.js sets u.navWant) towards
// something further than its reach: if it got less than 30 units nearer its goal and moved under 40, that's 2 stuck
// seconds. 'by a solid' = a wall, crate, pillar, barrel or boulder within its radius + 30 at the time.
// Reports stuck time as a % of wanting-to-move time, for heroes and enemies, and the worst spots.
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const n = +opt('n', 6), seed0 = +opt('seed', 1);
globalThis.location = { search: '?x' };
const { newRun, update } = await import('../js/dungeon.js');
const { setSeed } = await import('../js/util.js');
const { THEME_IDS } = await import('../js/themes.js');
const { HEROES, STARTERS } = await import('../js/heroes.js');
const themes = opt('theme', 'all') === 'all' ? THEME_IDS : [opt('theme')];
const DT = 1 / 60, WIN = 2;
const S = { hero: { want: 0, stuck: 0, solid: 0, ally: 0 }, enemy: { want: 0, stuck: 0, solid: 0, ally: 0 }, errs: 0, unsticks: 0, kinds: {} };

function nearSolid(w, u) {
  const R = u.r + 30;
  for (const p of w.pillars) if (Math.hypot(p.x - u.x, p.y - u.y) < p.r + R) return true;
  for (const r of w.walls) { const cx = Math.max(r.x, Math.min(u.x, r.x + r.w)), cy = Math.max(r.y, Math.min(u.y, r.y + r.h)); if (Math.hypot(u.x - cx, u.y - cy) < R) return true; }
  return false;
}
function goalOf(w, u) {
  if (u.forcedGoal) return { x: u.forcedGoal.x, y: u.forcedGoal.y, reach: 30 };
  if (u.target && !u.target.dead) {
    const reach = u.def.role === 'ranged' ? u.def.range * 0.9 : u.r + u.target.r + (u.def.range || 20) + 40;
    return { x: u.target.x, y: u.target.y, reach };
  }
  if (u.team === 'hero' && w.wp) return { x: w.wp.x, y: w.wp.y, reach: 80 };
  return null;
}
function tick(w, t) {
  for (const u of w.units) {
    if (u.dead || u.downed || u.def.boss || u.summon) continue;
    const side = u.team === 'hero' ? 'hero' : 'enemy';
    const g = goalOf(w, u);
    const f = u._n || (u._n = { t0: t, x: u.x, y: u.y, gd: g ? Math.hypot(g.x - u.x, g.y - u.y) : 0, ok: true, solid: false, ally: false });
    const moving = u.navWant && g && !u.act && !(u.stunT > 0) && !(u.frozenT > 0) && !(u.rootT > 0) && u.mode !== 'hold' && u.mode !== 'strafe' && u.mode !== 'kite' && u.mode !== 'wander';
    if (!moving || Math.hypot(g.x - u.x, g.y - u.y) < g.reach) f.ok = false;
    if (nearSolid(w, u)) f.solid = true;
    if (w.units.some((o) => o !== u && !o.dead && o.team === u.team && Math.hypot(o.x - u.x, o.y - u.y) < u.r + o.r + 6)) f.ally = true;
    if (t - f.t0 >= WIN) {
      if (f.ok && g) {
        S[side].want += WIN;
        const gd = Math.hypot(g.x - u.x, g.y - u.y), mv = Math.hypot(u.x - f.x, u.y - f.y);
        if (f.gd - gd < 30 && mv < 40) {
          S[side].stuck += WIN; if (f.solid) S[side].solid += WIN; else if (f.ally) S[side].ally += WIN;
          const key = side + ':' + u.kind + (f.solid ? '/solid' : f.ally ? '/ally' : '/open') + ':' + u.mode;
          S.kinds[key] = (S.kinds[key] || 0) + WIN;
        }
      }
      u._n = { t0: t, x: u.x, y: u.y, gd: g ? Math.hypot(g.x - u.x, g.y - u.y) : 0, ok: true, solid: false, ally: false };
    }
  }
}
let stuckRuns = 0;
for (const theme of themes) {
  for (let i = 0; i < n; i++) {
    setSeed(seed0 + i * 7919);
    const save = { heroes: {}, depth: 1 };
    if (args.includes('--first')) for (const k of STARTERS) save.heroes[k] = { nodes: { [HEROES[k].abilities[0].id + '1']: 1 } };
    const run = newRun(save, { theme, depth: 1 });
    let t = 0, lastRooms = run.rooms, lastT = 0;
    try {
      while (run.phase !== 'won' && run.phase !== 'lost' && t < 2400) {
        update(run, DT); t += DT; tick(run.world, t);
        if (run.rooms !== lastRooms) { lastRooms = run.rooms; lastT = t; }
        if (t - lastT > (run.node.kind === 'boss' ? 600 : 300)) { stuckRuns++; console.log('  run stuck', theme, i, run.node.kind); break; }
      }
    } catch (e) { S.errs++; console.log('  error', theme, i, e.stack); }
    if (args.includes('--v')) console.log(`  ${theme} #${i} ${run.phase} rooms ${run.rooms} ${Math.round(t)}s`);
  }
}
const pc = (a, b) => (100 * a / Math.max(1, b)).toFixed(2) + '%';
for (const s of ['hero', 'enemy']) console.log(`${s.padEnd(5)} stuck ${pc(S[s].stuck, S[s].want)} of ${Math.round(S[s].want)}s wanting to move | by a solid ${pc(S[s].solid, S[s].want)} | in a bunch ${pc(S[s].ally, S[s].want)}`);
console.log('worst:', Object.entries(S.kinds).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => k + ' ' + v + 's').join(' | '));
console.log(`runs stuck ${stuckRuns} errors ${S.errs}`);
