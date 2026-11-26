// Lane troll19b (round 19): the trolls' bowl in numbers, headless, from the staged scenes of tools/troll19b/stage.js.
// The same file run in a copy of the tree before the lane (scratch/before/tools/troll19b/) gives the "before" column.
//   node tools/troll19b/bowls.mjs [--kinds troll,rockTroll,yeti] [--scenes bowl,stand,near,fetch,break] [--n 12] [--secs 30]
// Per kind and scene, over --n seeds of --secs seconds:
//   bowls a minute     the boulder let go at speed (out of its owner's hands at more than 200 a second)
//   launch             its speed as it goes
//   rolled             how far it went from where it was let go, until it lay still, was taken up or turned for home
//   room               the gap between the boulder's face and the hero when it was let go
//   pressed            seconds a minute the troll held the boulder up against the hero (within 6 of touching)
//   thrown             how far a struck hero went in the 0.8 s after the blow (rooted heroes: nothing)
//   wait               from letting go to having it in its fists again
//   fists              blows the troll struck with no boulder in its fists, a minute of such time
//   breaks             boulders broken (a minute), and the first one's time
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
const DT = 1 / 60, N = +opt('n', 12), SECS = +opt('secs', 30);
const save = freshSave(); save.cheat = true;
(0, eval)(FS.readFileSync(PATH.join(here, '../troll19/stage.js'), 'utf8'));
(0, eval)(FS.readFileSync(PATH.join(here, 'stage.js'), 'utf8'));
T19.regrid = (w) => { const own = w.pillars.filter((p) => p.owner); w.pillars = w.pillars.filter((p) => !p.owner); buildGrid(w); w.pillars.push(...own); };
const ballOf = T19.ballOf;
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const med = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };

function one(kind, scene, seed) {
  setSeed(seed);
  const [k, rank] = kind.split('@');
  const party = scene === 'break' ? ['paladin', 'archer'] : ['paladin'];
  for (const id of party) { const hv = save.heroes[id]; hv.owned = true; hv.level = 5; hv.nodes = {}; hv.points = P.START_POINTS + 4; P.autoSpend(save, id); }
  const run = B.newBattle(save, { arena: 'crypt', a: party.map((id) => ({ k: id, n: 1 })), b: [{ k, n: 1, rank: +rank || 0 }] });
  globalThis.GAME = { run };
  const u = run.sides.b.find((q) => q.kind === k);
  for (let i = 0; i < 30; i++) B.updateBattle(run, DT);
  if (u.yt) for (let i = 0; i < 300 && !(u.snow && !u.snow.packing); i++) B.updateBattle(run, DT);
  const S = T19.stage2(scene), w = S.w, h = S.h;
  const R = { bowls: 0, launch: [], rolled: [], room: [], pressed: 0, thrown: [], wait: [], fists: 0, bare: 0, breaks: 0, first: null, held: 0, secs: 0 };
  let was = true, cur = null, hp = h.hp, fly = null, atk = u.lastAttackT, ball = ballOf(u), out = null;
  for (let t = 0; t < SECS; t += DT) {
    B.updateBattle(run, DT); R.secs += DT;
    if (run.phase !== 'fight') break;
    const b = ballOf(u);
    if (ball && b !== ball) { R.breaks++; if (R.first == null) R.first = t; cur = null; } // (gone: broken, burst or left)
    ball = b || ball; if (!b) ball = null;
    const held = !!(b && b.held);
    if (b) {
      const sp = Math.hypot(b.vx, b.vy), gap = Math.hypot(b.x - h.x, b.y - h.y) - b.r - h.r;
      if (held) { R.held += DT; if (gap < 6) R.pressed += DT; }
      if (was && !held && sp > 200) { R.bowls++; R.launch.push(sp); R.room.push(gap); cur = { x: b.x, y: b.y, far: 0 }; out = t; }
      if (cur) { cur.far = Math.max(cur.far, Math.hypot(b.x - cur.x, b.y - cur.y)); if (held || sp < 5 || b.recalled) { R.rolled.push(cur.far); cur = null; } }
      if (!was && held && out != null) { R.wait.push(t - out); out = null; }
    }
    if (!held) { R.bare += DT; if (u.lastAttackT !== atk) R.fists++; }
    atk = u.lastAttackT;
    for (const q of S.hs) if (q.hp < 5e5) q.hp = q.maxHp = 1e6;
    if (u.hp < 5e5) u.hp = u.maxHp = 1e6;
    if (fly) { fly.far = Math.max(fly.far, Math.hypot(h.x - fly.x, h.y - fly.y)); if (t - fly.t > 0.8) { R.thrown.push(fly.far); fly = null; } }
    else if (h.hp < hp - 0.5 && b && Math.hypot(b.x - h.x, b.y - h.y) < b.r + h.r + 30 && Math.hypot(b.vx, b.vy) > 60) fly = { x: h.x, y: h.y, t, far: 0 };
    hp = h.hp;
    was = held;
  }
  return R;
}
const KINDS = opt('kinds', 'troll,rockTroll,yeti').split(','), SCENES = opt('scenes', 'bowl,stand,near,fetch,break').split(',');
for (const kind of KINDS) for (const scene of SCENES) {
  const A = { bowls: 0, launch: [], rolled: [], room: [], pressed: 0, thrown: [], wait: [], fists: 0, bare: 0, breaks: 0, first: [], secs: 0, held: 0 };
  for (let i = 0; i < N; i++) {
    const r = one(kind, scene, 700 + i * 13);
    for (const k of ['bowls', 'pressed', 'fists', 'bare', 'breaks', 'secs', 'held']) A[k] += r[k];
    for (const k of ['launch', 'rolled', 'room', 'thrown', 'wait']) A[k].push(...r[k]);
    if (r.first != null) A.first.push(r.first);
  }
  const m = A.secs / 60;
  console.log(`${kind.padEnd(11)} ${scene.padEnd(6)} bowls ${(A.bowls / m).toFixed(1)}/min  launch ${Math.round(mean(A.launch))}  rolled ${Math.round(med(A.rolled))} (most ${Math.round(Math.max(0, ...A.rolled))})  room ${Math.round(med(A.room))} (least ${Math.round(Math.min(999, ...A.room))})  pressed ${(A.pressed / m).toFixed(1)}s/min  thrown ${Math.round(med(A.thrown))} (n ${A.thrown.length})  wait ${med(A.wait).toFixed(1)}s  fists ${A.bare > 1 ? (A.fists / (A.bare / 60)).toFixed(1) : '-'}/min bare (${Math.round(A.bare / A.secs * 100)}% bare)  breaks ${(A.breaks / m).toFixed(1)}/min first ${A.first.length ? med(A.first).toFixed(1) + 's' : '-'}`);
}
