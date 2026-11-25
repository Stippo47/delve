// Lane drake19: one fight in Node, printing where the body crosses itself or the head's facing jumps (for hunting faults in the spine).
globalThis.location = { search: '?bossroom&boss=cinder' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const CM = await import('../../js/boss-cinder.js');
const party = ['paladin', 'archer', 'cleric', 'twinfang'], level = 44;
setSeed(+process.argv[2] || 1); const s = freshSave();
for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = level; h.points = P.START_POINTS + level - 1; P.autoSpend(s, k); }
s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
const run = newRun(s, { theme: 'ember', party, depth: 1, floor: 1 });
let t = 0, n = 0, lastF = null, wasCross = false, jn = 0, lastMv = '';
const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const R = Math.round;
while (run.phase !== 'won' && run.phase !== 'lost' && t < 300) {
  update(run, 1 / 60); t += 1 / 60;
  const w = run.world, b = w.units.find((u) => u.kind === 'cinder' && u.cd); if (!b || !b.cd.phase || b.dead) continue;
  const k = b.cd;
  const pts = []; for (let off = 0; off <= CM.LEN; off += 26) pts.push(CM.at_(k, b, off));
  let cross = null;
  for (let a = 0; a < pts.length; a++) for (let c = a + 5; c < pts.length; c++) if (Math.hypot(pts[a].x - pts[c].x, pts[a].y - pts[c].y) < 56) cross = cross || [a * 26, c * 26];
  if (cross && !wasCross && n++ < 8) console.log('cross', t.toFixed(2), cross.join('/'), 'mv', k.mv, 'was', lastMv, 'stun', (b.stunT || 0).toFixed(2), 'frozen', (b.frozenT || 0).toFixed(2), 'head', R(b.x), R(b.y), 'f', b.facing.toFixed(2), 'sp', k.sp.map((q) => R(q.x) + ',' + R(q.y)).join(' '));
  wasCross = !!cross;
  if (lastF != null && Math.abs(wrap(b.facing - lastF)) > 0.5 && jn++ < 8) console.log('jump', t.toFixed(2), lastF.toFixed(2), '->', b.facing.toFixed(2), 'mv', k.mv, 'was', lastMv);
  lastF = b.facing; lastMv = k.mv;
}
