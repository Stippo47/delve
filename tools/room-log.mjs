// Round 14, lane L: a room-by-room log of a batch of runs (tools/runs.mjs --rooms <file>; read by tools/long-rooms.mjs).
// For every room with enemies: how long its fight took (from walking in to the last enemy down, or to the wipe), and,
// for rooms that ran past `keep` seconds, a snapshot every `every` seconds of everyone alive: where they are, their mode
// and target, their health, what each side has taken and been healed so far (cumulative: long-rooms.mjs takes the
// differences), and each hero's damage and healing from the run's stats.
// Nothing here changes the sim: it only reads the world after each update.
const R = (x) => Math.round(x);
const side = (u) => u.trueTeam || u.team;

// --watch i:room[:every[:from]] (runs.mjs): the run's room, printed in full every `every` seconds from `from` on.
export function watchPrint(run, t0) {
  const w = run.world, out = [];
  out.push(`-- t ${t0.toFixed(1)} phase ${run.phase} room ${run.rooms} ${run.theme} f${run.floor}.${run.map.L + 1} ${run.node.kind} ${w.shape} ${Math.round(w.W)}x${Math.round(w.H)} quiet ${(run.quietT || 0).toFixed(0)} stale ${!!w.stale} waves ${w.waves ? w.waves.left + (w.waves.pending ? 'p' : '') : '-'}`);
  for (const u of w.units) {
    if (u.dead || u.linkTo) continue;
    const t = u.target, d = t ? Math.hypot(t.x - u.x, t.y - u.y) - u.r - t.r : null;
    out.push(`   ${side(u) === 'hero' ? 'H' : 'E'} ${u.kind}#${u.id} hp ${Math.round(u.hp)}/${Math.round(u.maxHp)} @${R(u.x)},${R(u.y)} r${R(u.r)} ${u.mode}${t ? '>' + t.kind + '#' + t.id + ' gap ' + R(d) : ''} spd ${R(u.spd)}/${R(u.def.speed * (u.moveMul || 1))} atkT ${u.atkT.toFixed(1)}${u.act ? ' act ' + u.act.type : ''}${u.forcedGoal ? ' forced ' + Object.keys(u.forcedGoal).filter((k) => u.forcedGoal[k] === true).join('/') + '@' + R(u.forcedGoal.x) + ',' + R(u.forcedGoal.y) : ''}${u.downed ? ' DOWN' : ''}${u.ethereal ? ' eth' : ''}${u.hidden ? ' hidden' : ''}${u.fixed ? ' fixed' : ''}${u.aggro ? '' : ' calm'}${u.elite ? ' elite' : ''}${u.major ? ' major' : ''} armor ${(u.armor || 0).toFixed(1)}${u.kit ? ' cd ' + Object.entries(u.kit.cd).map(([k, v]) => k + ':' + v.toFixed(0)).join(',') : ''}${u.buffs.length ? ' buffs ' + u.buffs.map((b) => b.id).join(',') : ''}${u.stuckT > 0.3 ? ' stuckT ' + u.stuckT.toFixed(1) : ''}${process.env.LR_WATCHV ? ` dv ${R(u.dvx)},${R(u.dvy)} v ${R(u.vx)},${R(u.vy)} k ${R(u.kx)},${R(u.ky)} mvA ${u.mvA.toFixed(2)} unstick ${(u.unstickT || 0).toFixed(1)} path ${u.path ? u.path.length + '>' + R(u.path[0].x) + ',' + R(u.path[0].y) : '-'}` : ''}${u.el && u.el.holdT > 0 ? ' holdT ' + u.el.holdT.toFixed(1) : ''}`);
  }
  return out.join('\n');
}
export function geoPrint(w) {
  return `   walls ${w.walls.map((r) => `[${R(r.x)},${R(r.y)} ${R(r.w)}x${R(r.h)}${r.solid ? ' rock' : ''}]`).join(' ')}\n   pillars ${w.pillars.map((p) => `(${R(p.x)},${R(p.y)} r${R(p.r)})`).join(' ')}\n   hazards ${w.hazards.map((h) => `${h.type}(${R(h.x)},${R(h.y)} r${R(h.r)})`).join(' ')}`;
}

export function roomLog({ keep = 100, every = 5 } = {}) {
  const rooms = [];
  let cur = null, runId = 0, runMeta = null;
  const tally = () => ({ hT: 0, hH: 0, eT: 0, eH: 0 });

  function begin(run) {
    const w = run.world;
    const foes = w.units.filter((u) => side(u) === 'enemy' && !u.dead && !u.def.trap).length;
    cur = { run: runId, n: run.rooms, theme: run.theme, floor: run.floor, L: run.map.L, kind: run.node.kind, shape: w.shape, W: Math.round(w.W), H: Math.round(w.H),
      foes0: foes, waves: w.waves ? w.waves.left : 0, party: run.party.slice(), up: run.party.filter((k) => !run.heroes[k].down).length,
      t: 0, fight: null, end: null, snaps: [], kt: [], wt: [], downs: [], wn: 0, sum: tally(), hp: new Map(), last: null, killedBy: {}, ...runMeta };
    cur.empty = foes === 0 && !(w.waves && w.waves.left > 0);
  }
  function close(run, how) {
    if (!cur || cur.closed) return;
    cur.closed = true;
    if (cur.fight == null) cur.fight = cur.t;
    if (!cur.end) cur.end = how;
    if (!cur.empty) {
      const out = { ...cur }; delete out.hp; delete out.closed; delete out.last;
      if (cur.fight < keep) delete out.snaps;
      rooms.push(out);
    }
  }
  function snap(run) {
    const w = run.world, S = run.stats && run.stats.heroes;
    const units = [];
    for (const u of w.units) {
      if (u.dead || u.gone) continue;
      const h = cur.hp.get(u.id);
      units.push({ id: u.id, k: u.kind, s: side(u), hp: R(100 * Math.max(0, u.hp) / u.maxHp), mhp: R(u.maxHp), x: R(u.x), y: R(u.y), m: u.mode, tg: u.target ? u.target.kind + '#' + u.target.id : null,
        f: [u.downed ? 'D' : '', u.minion ? 'm' : '', u.summon ? 's' : '', u.linkTo ? 'l' : '', u.ethereal ? 'e' : '', u.hidden ? 'h' : '', u.fixed ? 'x' : '', u.aggro ? '' : 'z', u.forcedGoal ? 'F' : '',
          u.elite ? 'E' : '', u.major ? 'M' : '', u.def.boss ? 'B' : '', u.def.trap ? 'T' : '', u.act ? 'a:' + u.act.type.replace(/[^A-Za-z]/g, '') : '', u.stunT > 0.05 || u.frozenT > 0.05 || u.sleepT > 0.05 ? 'S' : '', u.rootT > 0.05 ? 'R' : ''].filter(Boolean).join(''),
        tk: h ? R(h.t) : 0, hl: h ? R(h.h) : 0, r: R(u.r), spd: R(u.def.speed * (u.moveMul || 1)), role: u.def.role, rng: R(u.def.range || 0) });
    }
    const her = {};
    if (S) for (const k of run.party) if (S[k]) her[k] = { d: R(S[k].dmg), h: R(S[k].heal) };
    // a long room: its walls, rocks and hazards too (to see who can reach whom)
    if (cur.t >= keep && !cur.geo) cur.geo = { walls: w.walls.map((r) => [R(r.x), R(r.y), R(r.w), R(r.h), r.solid ? 1 : 0]), pillars: w.pillars.map((p) => [R(p.x), R(p.y), R(p.r)]),
      hazards: w.hazards.map((h) => [h.type, R(h.x), R(h.y), R(h.r)]), water: (w.water || []).map((c) => [R(c.x), R(c.w)]) };
    cur.snaps.push({ t: R(cur.t), ...Object.fromEntries(Object.entries(cur.sum).map(([k, v]) => [k, R(v)])), her, u: units,
      wave: w.waves ? { left: w.waves.left, pend: !!w.waves.pending } : null, coming: w.danger.some((z) => z.spawns && !z.done) || w.fx.some((f) => f.spawns && !f.done) });
  }
  return {
    rooms,
    newRun(meta) { runId++; runMeta = meta || {}; cur = null; },
    tick(run, dt) {
      const w = run.world;
      if (!cur || cur.n !== run.rooms || cur.run !== runId) { if (cur && !cur.closed) close(run, 'next'); begin(run); }
      if (cur.closed) return;
      cur.t += dt;
      // health changes, by side (a unit gone since the last tick took what it had left)
      const seen = new Set();
      for (const u of w.units) {
        if (u.gone) continue;
        seen.add(u.id);
        const h = cur.hp.get(u.id), hp = u.dead ? 0 : Math.max(0, u.hp);
        if (!h) { cur.hp.set(u.id, { v: hp, s: side(u), t: 0, h: 0, k: u.kind, down: !!u.downed, main: side(u) === 'enemy' && !u.minion && !u.summon && !u.linkTo && !u.def.trap, part: !!(u.linkTo || u.lifeT != null || u.def.trap) }); continue; }
        const d = hp - h.v, wasDown = h.down; h.v = hp; h.down = !!u.downed;
        if (u.downed && !wasDown && cur.fight == null) cur.downs.push(R(cur.t));
        const s = side(u);
        if (d < 0) { h.t -= d; if (s === 'hero') cur.sum.hT -= d; else cur.sum.eT -= d; }
        else if (d > 0 && !wasDown && !u.downed) { h.h += d; if (s === 'hero') cur.sum.hH += d; else cur.sum.eH += d; } // (a revive is not healing)
      }
      for (const [id, h] of cur.hp) if (!seen.has(id) && !h.gone) {
        h.gone = true;
        if (h.v > 0 && !h.part) { h.t += h.v; if (h.s === 'hero') cur.sum.hT += h.v; else cur.sum.eT += h.v; h.v = 0; }
        if (h.main && cur.fight == null) cur.kt.push(Math.round(cur.t * 10) / 10); // a room's own enemy (not called help or a chain's link) is down
      }
      if (w.waves && w.waves.n !== cur.wn) { cur.wn = w.waves.n; if (cur.wn) cur.wt.push(R(cur.t)); }
      if (cur.fight == null && run.phase === 'fight') {
        const k = Math.floor(cur.t / every);
        if (k !== cur.last) { cur.last = k; snap(run); }
        if (cur.snaps.length > 2 * Math.ceil(keep / every) + 400) cur.snaps.splice(1, 1); // (a stuck room: keep the start and the latest)
      } else if (cur.fight == null) { cur.fight = cur.t; cur.end = run.phase === 'lost' ? 'lost' : 'cleared'; cur.upEnd = run.party.filter((k) => !run.heroes[k].down).length; }
      if (run.phase === 'lost') close(run, 'lost');
      else if (run.phase === 'won' || run.phase === 'retreated') close(run, run.phase);
    },
    // the run stopped (stuck, an error, the time cap): whatever room it was in ends here
    stop(run, how) { if (cur && !cur.closed) { if (cur.fight == null) { snap(run); cur.fight = cur.t; } else cur.after = { how, phase: run.was || run.phase, t: R(cur.t) }; close(run, how); } },
  };
}
