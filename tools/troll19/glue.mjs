// Lane troll19: is anybody carried along on the front of a boulder? (the designer, round 19: "Things that are touching
// the boulder almost get glued to it, in front. Like if he rolls the bolder into someone it kind of holds the target in
// front.") "Carried": touching a boulder or snowball that is moving (over 15 a second), within 0.5 rad of the way it is
// going, and moving with it.
//   node tools/troll19/glue.mjs [--n 12] [--kinds troll,rockTroll,rockTroll@1,yeti]
// staged: the scene `push` of tools/troll19/stage.js (a hero rooted square in its way on open floor), 10 s: how long
//         he is carried in all, the longest stretch, how far.  fights: two of the kind against paladin + berserker +
//         archer (level 5/9): seconds carried a minute of fight (all bodies), and the longest stretch.
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const FS = await import('node:fs'), PATH = await import('node:path'), URL_ = await import('node:url');
const here = PATH.dirname(URL_.fileURLToPath(import.meta.url));
const B = await import('../../js/battle.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const { buildGrid } = await import('../../js/path.js');
const P = await import('../../js/progress.js');
const DT = 1 / 60, N = +opt('n', 12);
const save = freshSave(); save.cheat = true;
(0, eval)(FS.readFileSync(PATH.join(here, 'stage.js'), 'utf8'));
T19.regrid = (w) => { const own = w.pillars.filter((p) => p.owner); w.pillars = w.pillars.filter((p) => !p.owner); buildGrid(w); w.pillars.push(...own); };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// one step's worth: every body carried on a ball's front; `st` keeps each ball's last place and each body's stretch
function carried(w, st) {
  let any = 0;
  for (const b of w.pillars) {
    if (!(b.boulder || b.snowball) || b.packing) continue;
    const L = st.last.get(b) || { x: b.x, y: b.y }; st.last.set(b, { x: b.x, y: b.y });
    const mx = b.x - L.x, my = b.y - L.y, mv = Math.hypot(mx, my); if (mv / DT < 15) continue;
    for (const o of w.units) {
      if (o.dead || o.downed || o === b.owner || o.fixed || o.ballOf) continue; // (lane troll19b: o.ballOf, a boulder's health is no body)
      const d = Math.hypot(o.x - b.x, o.y - b.y); if (d > b.r + o.r + 8) continue;
      if (Math.abs(wrap(Math.atan2(o.y - b.y, o.x - b.x) - Math.atan2(my, mx))) > 0.5) continue;
      any++; st.now.add(o); st.dist += mv;
    }
  }
  for (const [o, t] of st.run) if (!st.now.has(o)) { st.longest = Math.max(st.longest, t); st.run.delete(o); }
  for (const o of st.now) st.run.set(o, (st.run.get(o) || 0) + DT);
  for (const t of st.run.values()) st.longest = Math.max(st.longest, t);
  st.now.clear();
  return any;
}
const fresh = () => ({ last: new Map(), run: new Map(), now: new Set(), longest: 0, dist: 0 });
for (const kind of opt('kinds', 'troll,rockTroll,rockTroll@1,yeti').split(',')) {
  const [k, rank] = kind.split('@');
  let secs = 0, longest = 0, dist = 0;
  for (let i = 0; i < N; i++) {
    setSeed(900 + i);
    const run = B.newBattle(save, { arena: 'crypt', a: [{ k: 'paladin', n: 1 }], b: [{ k, n: 1, rank: +rank || 0 }] });
    globalThis.GAME = { run };
    const u = run.sides.b[0];
    for (const q of [...run.sides.a, ...run.sides.b]) q.maxHp = q.hp = 1e6;
    for (let j = 0; j < 30; j++) B.updateBattle(run, DT);
    if (u.yt) for (let j = 0; j < 300 && !(u.snow && !u.snow.packing); j++) B.updateBattle(run, DT);
    T19.stage('push');
    const st = fresh();
    for (let t = 0; t < 10; t += DT) { B.updateBattle(run, DT); secs += carried(run.world, st) * DT; }
    longest = Math.max(longest, st.longest); dist += st.dist;
  }
  let fs = 0, fl = 0, ft = 0, lens = [];
  for (let i = 0; i < N; i++) {
    setSeed(7000 + i * 13);
    const lvl = +rank ? 9 : 5, party = ['paladin', 'berserker', 'archer'];
    for (const id of party) { const hv = save.heroes[id]; hv.owned = true; hv.level = lvl; hv.nodes = {}; hv.points = P.START_POINTS + lvl - 1; P.autoSpend(save, id); }
    const run = B.newBattle(save, { arena: B.homeOf(k) || 'crypt', size: 'l', a: party.map((id) => ({ k: id, n: 1 })), b: [{ k, n: 2, rank: +rank || 0 }] });
    const st = fresh(); let t = 0;
    while (!run.summary && t < 240) { B.updateBattle(run, DT); t += DT; if (run.phase === 'fight') fs += carried(run.world, st) * DT; }
    ft += t; fl = Math.max(fl, st.longest); lens.push(st.longest);
  }
  lens.sort((a, b) => a - b);
  console.log(`${kind.padEnd(12)} pushed into a hero standing still (10 s): carried ${(secs / N).toFixed(1)}s, ${(dist / N).toFixed(0)} far, longest stretch ${longest.toFixed(1)}s | fights: ${(60 * fs / ft).toFixed(1)}s carried a minute, longest stretch ${fl.toFixed(1)}s (median fight's longest ${lens[lens.length >> 1].toFixed(1)}s)`);
}
