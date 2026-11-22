// Round 14 (lane S): fear, headless. The designer: "Doesn't seem to back away. Burst will make them turn away and run.
// Will have a radius of fear around them giving other entities fear."
//   node tools/test/fear-spread.mjs            (also runs on the round 13 code, for the before numbers)
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const S = await import('../../js/sim.js');
const { setSeed, dist, angleTo, angleDiff } = await import('../../js/util.js');
const DT = 1 / 60;
const frightener = (w, x, y) => { const h = S.spawn(w, 'paladin', x, y, { level: 20 }); h.invulnT = 1e9; h.stunT = 1e9; return h; }; // (stands there, takes nothing, does nothing)

// 1. Backing away: a rattler 120 from a paladin it is coming for, given 45 fear by him (one banshee wail's worth)
console.log('backing away (one wail\'s worth of fear, 45): distance from the frightener, every 0.5 s');
for (const fear of [45, 20]) {
  const rows = [];
  for (const seed of [1, 2, 3]) {
    setSeed(seed);
    const w = S.makeWorld(1200, 480), h = frightener(w, 300, 240), e = S.spawn(w, 'rattler', 420, 240, { mult: 1 }); e.aggro = true; e.target = h;
    for (let t = 0; t < 0.5; t += DT) S.step(w, DT); // (it closes in first)
    S.addStatus(w, e, 'fear', fear, h);
    const d = [];
    for (let t = 0; t <= 4.01; t += DT) { if (Math.abs(t / 0.5 - Math.round(t / 0.5)) < DT / 1.2) d.push(Math.round(dist(e.x, e.y, h.x, h.y))); S.step(w, DT); }
    rows.push(d);
  }
  console.log(`  fear ${fear}: ` + rows.map((d) => d.join(' ')).join('  |  '));
}

// 2. The burst: it turns its back and runs (facing the way it runs, away from the frightener)
{
  setSeed(4);
  const w = S.makeWorld(1200, 480), h = frightener(w, 300, 240), e = S.spawn(w, 'rattler', 400, 240, { mult: 1 }); e.aggro = true; e.target = h;
  S.addStatus(w, e, 'fear', 120, h);
  let away = 0, n = 0, d0 = dist(e.x, e.y, h.x, h.y);
  for (let t = 0; t < 2.5; t += DT) { S.step(w, DT); if (t > 0.4) { n++; if (angleDiff(e.facing, angleTo(h.x, h.y, e.x, e.y)) < 1.0) away++; } }
  console.log(`terrified: faces away from the frightener ${Math.round(100 * away / n)}% of its run (after a 0.4 s turn); ran ${Math.round(dist(e.x, e.y, h.x, h.y) - d0)} further off in 2.5 s`);
}

// 3. The spread: six rattlers in a knot, one terrified and the other five frightened by the same wail (45); 25 s on
{
  for (const seed of [5, 6, 7]) {
    setSeed(seed);
    const w = S.makeWorld(1600, 900), h = frightener(w, 300, 450), g = [];
    for (let i = 0; i < 6; i++) { const e = S.spawn(w, 'rattler', 560 + (i % 3) * 55, 400 + Math.floor(i / 3) * 70, { mult: 1 }); e.aggro = true; e.target = h; g.push(e); }
    for (const e of g) S.addStatus(w, e, 'fear', 45, h);
    S.addStatus(w, g[0], 'fear', 100, h);
    const line = []; let bursts = 0, maxGen = 0; const seen = new Set();
    for (let t = 0; t < 25; t += DT) {
      S.step(w, DT);
      for (const e of g) if (e.fearT > 0 && !seen.has(e.id + ':' + Math.floor(e.fearImmuneT))) { if (e.fearT > 2.95) { bursts++; maxGen = Math.max(maxGen, e.fearGen || 0); } seen.add(e.id + ':' + Math.floor(e.fearImmuneT)); }
      if (Math.abs(t - Math.round(t)) < DT / 2) line.push(g.filter((e) => e.fearT > 0).length);
    }
    console.log(`six in a knot (seed ${seed}): fleeing each second ${line.join('')} | bursts ${bursts}, deepest hand ${maxGen}, fleeing at the end ${g.filter((e) => e.fearT > 0).length}`);
  }
}
