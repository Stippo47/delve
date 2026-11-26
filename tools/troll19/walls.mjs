// Lane troll19 (round 19): does a troll's boulder (a yeti's snowball) push anybody into a wall, a rock or out of the
// room? Is the boulder itself ever in a wall, the troll in its boulder? Headless (no browser).
//   node tools/troll19/walls.mjs [--staged] [--battles] [--dungeon warren,crypt,frost] [--n 12] [--json out.json] [--v]
// With no mode named: all three.
//  staged   tools/troll19/stage.js scenes (a rooted hero against the room's edge, in a corner, against a thin wall, a
//           rock, a crate's corner, behind a doorway too narrow for the boulder), each kind, --n seeds each, 12 s
//  battles  battle mode fights in walled rooms: each kind (plain, elite, major; alone and in threes) against hero
//           parties, the room's own crates and rocks plus two walls put in
//  dungeon  dungeon runs with only troll-shaped kinds in the rooms (?foes=), the starting party
// What is counted, every step, for every unit up (the numbers are unit-steps; "times" = separate spells of it):
//   in a wall      its middle inside a wall's rectangle
//   out            its middle outside the room
//   deep           more than a third of its radius (and 10) inside a wall or past the room's edge
//   in a rock      more than a third of its radius (and 10) inside a plain rock, barrel or pillar
//   in a boulder   more than 14 inside a boulder or snowball that isn't its own
// each only "by a boulder" (a boulder or snowball within 14 of touching it), and the rest listed apart;
// and for every boulder: its middle in a wall / outside the room, more than 8 into a wall, the edge or a plain rock;
// its owner more than 14 nearer than its hands' reach (the troll inside its boulder).
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes('--' + k);
globalThis.location = { search: '?foes=' + opt('foes', 'troll,rockTroll,yeti') };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const FS = await import('node:fs'), PATH = await import('node:path'), URL_ = await import('node:url');
const here = PATH.dirname(URL_.fileURLToPath(import.meta.url));
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const { buildGrid, circleRect } = await import('../../js/path.js');
const DG = await import('../../js/dungeon.js'), HE = await import('../../js/heroes.js'), P = await import('../../js/progress.js');
const DT = 1 / 60, N = +opt('n', 12), V = has('v');
const save = freshSave(); save.cheat = true;
(0, eval)(FS.readFileSync(PATH.join(here, 'stage.js'), 'utf8'));
T19.regrid = (w) => { const own = w.pillars.filter((p) => p.owner); w.pillars = w.pillars.filter((p) => !p.owner); buildGrid(w); w.pillars.push(...own); };
const ballOf = T19.ballOf;
const all = !has('staged') && !has('battles') && !opt('dungeon');

// ---------------------------------------------------------------- the audit
const KEYS = ['inWall', 'out', 'deep', 'inRock', 'inBall', 'ballInWall', 'ballOut', 'ballDeep', 'ballInRock', 'ownerInBall'];
const newCount = () => ({ steps: 0, by: Object.fromEntries(KEYS.map((k) => [k, { steps: 0, times: 0, worst: 0 }])), other: { inWall: 0, out: 0, deep: 0, inRock: 0 }, seen: new Map(), ex: [] });
function wallPen(w, x, y, r) { // how far a circle is into a wall or past the room's edge (0: clear), and whether its middle is in / out
  let pen = Math.max(0, r - x, r - y, x - (w.W - r), y - (w.H - r)), inW = false;
  const out = x < 0 || y < 0 || x > w.W || y > w.H;
  for (const q of w.walls) {
    if (x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h) { inW = true; pen = Math.max(pen, r + Math.min(x - q.x, q.x + q.w - x, y - q.y, q.y + q.h - y)); continue; }
    const c = circleRect(x, y, r, q); if (c) pen = Math.max(pen, c.over);
  }
  return { pen, inW, out };
}
function audit(w, C, tag) {
  C.steps++;
  const balls = w.pillars.filter((p) => p.owner !== undefined && (p.boulder || p.snowball) && !p.packing);
  const rocks = w.pillars.filter((p) => !(p.boulder || p.snowball) && !p.painted);
  const mark = (key, who, on, worst) => {
    const k = key + ':' + (who.id ?? who._bid ?? (who._bid = 'b' + Math.random()));
    const E = C.by[key];
    if (on) { E.steps++; E.worst = Math.max(E.worst, worst || 0); if (!(C.seen.get(k) > w.time - 0.5)) { E.times++; if (C.ex.length < 400) C.ex.push({ key, tag, t: +w.time.toFixed(2), kind: who.kind || (who.snowball ? 'snowball' : 'boulder'), x: Math.round(who.x), y: Math.round(who.y), worst: Math.round(worst || 0) }); } C.seen.set(k, w.time); }
  };
  for (const u of w.units) {
    if (u.dead || u.downed || u.ethereal || u.fixed || u.team === 'neutral' || u.def.boss) continue;
    if ((u.hop || 0) > 10 || u.flyT > 0 || u.airborne) continue; // (up in the air: over the walls)
    const near = balls.some((b) => Math.hypot(u.x - b.x, u.y - b.y) < u.r + b.r + 14);
    const { pen, inW, out } = wallPen(w, u.x, u.y, u.r);
    const deep = pen > Math.max(10, u.r / 3);
    let rock = 0; for (const p of rocks) rock = Math.max(rock, u.r + p.r - Math.hypot(u.x - p.x, u.y - p.y));
    const inRock = rock > Math.max(10, u.r / 3);
    if (near) { mark('inWall', u, inW, pen); mark('out', u, out, pen); mark('deep', u, deep, pen); mark('inRock', u, inRock, rock); }
    else { if (inW) C.other.inWall++; if (out) C.other.out++; if (deep) C.other.deep++; if (inRock) C.other.inRock++; }
    let ib = 0; for (const b of balls) if (b.owner !== u) ib = Math.max(ib, u.r + b.r - Math.hypot(u.x - b.x, u.y - b.y));
    mark('inBall', u, ib > 14, ib);
  }
  for (const b of balls) {
    const { pen, inW, out } = wallPen(w, b.x, b.y, b.r);
    mark('ballInWall', b, inW, pen); mark('ballOut', b, out, pen); mark('ballDeep', b, pen > 8, pen);
    let rock = 0; for (const p of rocks) rock = Math.max(rock, b.r + p.r - Math.hypot(b.x - p.x, b.y - p.y));
    mark('ballInRock', b, rock > 8, rock);
    const u = b.owner;
    if (u && !u.dead && b.held && !b.haul) { // (in its hands: how far inside its reach is the boulder's middle?)
      const want = b.snowball ? u.r * 0.82 + b.r : u.r * 0.54 + b.r + 8, d = Math.hypot(u.x - b.x, u.y - b.y);
      mark('ownerInBall', b, want - d > 14, want - d);
    }
  }
}
const line = (C) => KEYS.map((k) => `${k} ${C.by[k].times}x/${C.by[k].steps}${C.by[k].worst ? ' (' + Math.round(C.by[k].worst) + ')' : ''}`).join('  ');
const total = (C) => KEYS.reduce((n, k) => n + C.by[k].steps, 0);
const out = { staged: {}, battles: {}, dungeon: {} };

// ---------------------------------------------------------------- staged scenes
const KINDS = opt('kinds', 'troll,rockTroll,rockTroll@1,troll@2,yeti,yeti@1').split(',');
const SCENES = opt('scenes', 'wall,corner,thin,pillar,crate,door,friends').split(',');
function staged(kind, scene, seed, secs = 12) {
  setSeed(seed);
  const [k, rank] = kind.split('@');
  const run = B.newBattle(save, { arena: 'crypt', a: [{ k: 'paladin', n: 1 }], b: [{ k, n: 1, rank: +rank || 0 }, ...(scene === 'friends' ? [{ k: 'orc', n: 1 }] : [])] });
  globalThis.GAME = { run };
  const u = run.sides.b.find((q) => q.kind === k);
  for (const q of [...run.sides.a, ...run.sides.b]) q.maxHp = q.hp = 1e6;
  for (let i = 0; i < 30; i++) B.updateBattle(run, DT);
  if (u.yt) for (let i = 0; i < 300 && !(u.snow && !u.snow.packing); i++) B.updateBattle(run, DT);
  const S = T19.stage(scene);
  const C = newCount(), h = S.h, h0 = { x: h.x, y: h.y };
  let far = 0, crossed = false, py = h.y;
  for (let t = 0; t < secs; t += DT) {
    B.updateBattle(run, DT); audit(run.world, C, `${kind}/${scene}/${seed}`);
    far = Math.max(far, Math.hypot(h.x - h0.x, h.y - h0.y));
    if (scene === 'thin' && Math.abs(h.x - run.world.W / 2) < 215 && ((py > 416 && h.y < 380) || (h.y > 380 && h.y < 416))) crossed = true; // (in the wall, or over it in one step; round its end is fair)
    py = h.y;
    if (scene === 'door') { const b = ballOf(u); if (b && b.y < 400 + 20 && Math.abs(b.x - run.world.W / 2) < 60) crossed = true; } // (the boulder's middle up in the doorway)
  }
  return { C, crossed, far };
}
if (all || has('staged')) {
  console.log('== staged scenes (a rooted hero; unit-steps of 720 a run; "x" = spells) ==');
  for (const kind of KINDS) for (const scene of SCENES) {
    const sum = newCount(); let crossed = 0, bad = 0;
    for (let i = 0; i < N; i++) {
      const r = staged(kind, scene, 900 + i);
      for (const k of KEYS) { sum.by[k].steps += r.C.by[k].steps; sum.by[k].times += r.C.by[k].times; sum.by[k].worst = Math.max(sum.by[k].worst, r.C.by[k].worst); }
      if (r.crossed) crossed++; if (total(r.C) || r.crossed) bad++;
    }
    out.staged[`${kind}/${scene}`] = { runs: N, bad, crossed, ...Object.fromEntries(KEYS.map((k) => [k, sum.by[k]])) };
    console.log(`${kind.padEnd(12)} ${scene.padEnd(8)} runs with a fault ${String(bad).padStart(2)}/${N}${scene === 'thin' ? `  through the wall ${crossed}` : scene === 'door' ? `  boulder in the doorway ${crossed}` : ''}  ${line(sum)}`);
  }
}

// ---------------------------------------------------------------- battles in walled rooms
// The room's own crates and rocks stay; two walls are put in (a long thin one and a short thick one), so there are
// walls, wall ends and corners to be pushed against wherever the fight goes.
const PARTIES = ['paladin,archer', 'paladin,berserker,cleric', 'tower,twinfang,archer,cleric'];
function walled(run) {
  const w = run.world, W = w.W, H = w.H;
  const add = (r) => { if (!w.units.some((u) => circleRect(u.x, u.y, u.r + 30, r))) w.walls.push({ ...r, t19: true }); };
  add({ x: W * 0.5 - 18, y: H * 0.12, w: 36, h: H * 0.2 }); add({ x: W * 0.5 - 18, y: H * 0.68, w: 36, h: H * 0.2 });
  add({ x: W * 0.28, y: H * 0.5 - 18, w: W * 0.12, h: 36 }); add({ x: W * 0.6, y: H * 0.5 - 18, w: W * 0.12, h: 36 });
  T19.regrid(w);
}
function battles() {
  console.log('== battle mode, walled rooms ==');
  const rows = [];
  for (const kind of opt('bkinds', 'troll,rockTroll,yeti,troll@1,rockTroll@1,yeti@1,troll@2,rockTroll@2,yeti@2').split(',')) {
    const [k, rank] = kind.split('@');
    const C = newCount(); let n = 0, wins = 0, time = 0, never = 0;
    for (const party of PARTIES) for (const cnt of [1, 3]) for (let i = 0; i < N; i++) {
      setSeed(4000 + i * 31 + cnt);
      const lvl = +rank === 2 ? 14 : +rank === 1 ? 9 : 5;
      for (const id of party.split(',')) { const hv = save.heroes[id]; hv.owned = true; hv.level = lvl; hv.nodes = {}; hv.points = P.START_POINTS + lvl - 1; P.autoSpend(save, id); }
      const run = B.newBattle(save, { arena: B.homeOf(k) || 'crypt', size: i % 2 ? 's' : 'l', a: party.split(',').map((id) => ({ k: id, n: 1 })), b: [{ k, n: cnt, rank: +rank || 0 }] });
      walled(run);
      let t = 0; while (!run.summary && t < 300) { B.updateBattle(run, DT); t += DT; if (run.phase === 'fight') audit(run.world, C, `${kind}x${cnt} v ${party} #${i}`); }
      n++; if (!run.summary) never++; else { if (run.summary.winner === 'b') wins++; time += run.summary.time; }
    }
    out.battles[kind] = { fights: n, redWins: wins, never, secs: +(time / Math.max(1, n - never)).toFixed(1), steps: C.steps, ...Object.fromEntries(KEYS.map((q) => [q, C.by[q]])), other: C.other, ex: C.ex.slice(0, 12) };
    console.log(`${kind.padEnd(12)} ${n} fights, the trolls' side won ${wins}, ${(time / Math.max(1, n - never)).toFixed(0)}s a fight${never ? ', never ended ' + never : ''}  ${line(C)}  | away from any boulder: in a wall ${C.other.inWall}, out ${C.other.out}, deep ${C.other.deep}`);
    if (V) for (const e of C.ex.slice(0, 8)) console.log('    ', JSON.stringify(e));
    rows.push(C);
  }
}
if (all || has('battles')) battles();

// ---------------------------------------------------------------- dungeon runs
function dungeon(themes) {
  console.log('== dungeon runs, only troll-shaped kinds in the rooms ==');
  const { newRun, update } = DG, { STARTERS } = HE;
  for (const theme of themes) {
    const C = newCount(); let rooms = 0, secs = 0, ends = {};
    for (let i = 0; i < N; i++) {
      setSeed(700 + i * 7919);
      const s = freshSave(); for (const k of STARTERS) { s.heroes[k].owned = true; s.heroes[k].level = +opt('level', 8); s.heroes[k].points = P.START_POINTS + +opt('level', 8) - 1; P.autoSpend(s, k); }
      s.party = STARTERS.slice(); s.unlocks = { slotMini1: true, slotBoss1: true };
      const run = newRun(s, { theme, party: STARTERS.slice(), depth: 1, floor: 1 });
      let t = 0, lw = null;
      while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < +opt('secs', 600)) {
        update(run, DT); t += DT;
        const w = run.world; if (w !== lw) { rooms++; lw = w; }
        if (w.units.some((u) => u.bould || u.snow)) audit(w, C, `${theme} run ${i} room ${rooms}`);
      }
      secs += t; ends[run.phase] = (ends[run.phase] || 0) + 1;
    }
    out.dungeon[theme] = { runs: N, rooms, secs: Math.round(secs), ends, steps: C.steps, ...Object.fromEntries(KEYS.map((q) => [q, C.by[q]])), other: C.other, ex: C.ex.slice(0, 12) };
    console.log(`${theme.padEnd(8)} ${N} runs, ${rooms} rooms, ${Math.round(secs)}s (${JSON.stringify(ends)}), ${C.steps} steps with a boulder about  ${line(C)}  | away from any boulder: in a wall ${C.other.inWall}, out ${C.other.out}, deep ${C.other.deep}`);
    if (V) for (const e of C.ex.slice(0, 8)) console.log('    ', JSON.stringify(e));
  }
}
if (all || opt('dungeon')) dungeon((opt('dungeon') || 'warren,crypt,frost').split(','));
if (opt('json')) FS.writeFileSync(opt('json'), JSON.stringify(out, null, 1));
