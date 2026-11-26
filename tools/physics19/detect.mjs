// Lane physics19 (round 19): the jump detector. Headless (no browser). It runs many fights and logs every step in
// which a body moved further than its own walking and knockback explain, by cause.
//   node tools/physics19/detect.mjs [--root <tree>] [--set bosses,segs,crowd,fliers,structs,trolls,dungeons] [--n 3]
//        [--secs 60] [--th 6] [--json out.json] [--v] [--ex 12]
// --root: the tree whose js/ is run (default: this worktree), so the same detector measures a copy of the game as it
// was and the game as it is.
//
// What is a jump. Every step, for every unit up before and after it:
//   moved      = where it is now less where it was
//   explained  = (its velocity + its knockback) * dt, as sim.js physics integrates them
//   jump       = |moved - explained|
// A jump of TH (6) room units or more in one step (360 a second: a hero walks 60-110) is logged. Units a brain places
// by hand each step (boss parts, chain links: boss-kit.js place) have no velocity, so for them a jump is a change in
// their step from the step before of TH or more (a snap, not a fast smooth swing).
// A body held back is not a jump: one that went no further than its own pace would have taken it (stopped by a wall,
// a rock or a body it walked or was knocked into) is not counted.
// Left out: a body in the air (a leap, a toss, a hop), a body knocked hard (its knockback over 90), its first step,
// and anything that can't be seen (under the sand, in smoke).
//
// The cause. The physics itself says what it pushed and out of what (sim.js physics: w.physLog); a jump counts as a
// push when that push is at least half of it: out of a foot or part of a boss, its own boss or its own parts, a chain
// link, its own chain, a fixed thing (summons, turrets, the wagon), a heavier / lighter / like body, a rock, a
// boulder, a wall, the room's edge. Else it is put down to what the unit was doing: a dash or another act, an
// ability's animation, a hook on it (flung, whirled...), held by something, or a brain's own move (named by kind).
// Also counted (the layer audit): every push the physics made between two bodies on different heights (floor /
// hovering / flying: height.js airTier), between a body and its own boss or its boss's other parts, a link and its
// own chain.
import FS from 'node:fs'; import PATH from 'node:path'; import URL_ from 'node:url';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes('--' + k);
const here = PATH.dirname(URL_.fileURLToPath(import.meta.url));
const root = PATH.resolve(opt('root', PATH.join(here, '..', '..')));
const imp = (f) => import(URL_.pathToFileURL(PATH.join(root, 'js', f)).href);
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await imp('battle.js'), { setSeed } = await imp('util.js'), { freshSave } = await imp('save.js'), { DEFS } = await imp('units.js');
const { circleRect } = await imp('path.js'), HT = await imp('height.js'), P = await imp('progress.js');
const DG = await imp('dungeon.js'), HE = await imp('heroes.js');
const DT = 1 / 60, TH = +opt('th', 6), N = +opt('n', 3), SECS = +opt('secs', 60), V = has('v'), EX = +opt('ex', 12);
const SETS = opt('set', 'bosses,segs,crowd,fliers,structs,trolls,dungeons').split(',');
const KD = Math.exp(-5 * DT);

// ---------------------------------------------------------------- the detector
const C = { steps: 0, unitSteps: 0, small: 0, deep: { n8: 0, n16: 0, half: 0, long: 0, longest: 0, ex: [], by: {}, kinds: {} }, by: {}, layer: { cross: 0, ownBoss: 0, ownChain: 0, crossKinds: {} }, ex: [] };
const catOf = (u, o) => {
  if (o.partOf && (o.partOf === u || o.partOf === u.partOf)) return 'its own parts';
  if (u.partOf && u.partOf === o) return 'its own boss';
  if ((o.linkTo && (o.linkTo === u || o.linkTo === u.linkTo)) || u.linkTo === o) return 'its own chain';
  if (o.def.part) return /Foot|Hoof|foot|hoof/.test(o.kind) ? 'a boss foot' : 'a boss part';
  if (o.def.segment) return 'a chain link';
  if (o.fixed) return 'a fixed thing';
  if (o.def.boss) return 'a boss body';
  const k = o.mass / Math.max(0.01, u.mass);
  return k > 2 ? 'a heavier body' : k < 0.5 ? 'a lighter body' : 'a like body';
};
const hooksOn = (u) => (u.h2 || []).map((h) => h.id || h.name).filter(Boolean).join('+');
function stateOf(u) {
  if (u.act) return 'act:' + u.act.type + (u.act.kind ? '/' + u.act.kind : '');
  const hk = hooksOn(u); if (hk) return 'hook:' + hk;
  if (u.def.part || u.def.segment || (u.fixed && u.linkTo)) return 'placed:' + u.kind;
  if (u.stunT > 0) return 'held/stunned';
  if (u.passUntil > 0 && u.passUntil < 1e8 && u._ptime < u.passUntil) return 'passing';
  if (u.anim && u.anim.kind) return 'anim:' + u.anim.kind + '(' + u.kind + ')';
  return 'brain:' + u.kind;
}
const pre = new Map(), pushed = new Map(), spell = new Map();
const MOVING = new Set(['dash', 'charge', 'leap', 'ride', 'slip']);
const actOf = (u) => (u.act ? (u.act.dv || MOVING.has(u.act.type) ? 'act:' + u.act.type : null) : null);
// what the sim's physics says it moved this step, and out of what (sim.js physics: w.physLog; the copy of the game as
// it was has the same five logging lines put in, tools/physics19/log-hook.py, and nothing else changed)
function logPush(u, dx, dy, o, kind) {
  let P = pushed.get(u); if (!P) pushed.set(u, (P = { x: 0, y: 0, big: 0, o: null, kind: null }));
  P.x += dx; P.y += dy;
  const m = Math.hypot(dx, dy); if (m > P.big) { P.big = m; P.o = o; P.kind = kind; }
  if (kind === 'body' && o && m > 0.01 && u.id < o.id) { // the layer audit: each pair once
    const ta = HT.airTier(u), tb = HT.airTier(o);
    if (ta !== tb) { C.layer.cross++; const k = [u.kind + ':' + ta, o.kind + ':' + tb].sort().join(' x '); C.layer.crossKinds[k] = (C.layer.crossKinds[k] || 0) + 1; }
    const mob = (u.partOf && u.partOf.bodies) || (o.partOf && o.partOf.bodies) || u.bodies || o.bodies; // (the Mob's four bodies are four people: they may jostle)
    if (!mob && (u.partOf === o || o.partOf === u || (u.partOf && u.partOf === o.partOf))) C.layer.ownBoss++;
    if ((u.linkTo && (u.linkTo === o || u.linkTo === o.linkTo)) || o.linkTo === u) C.layer.ownChain++;
  }
}
function before(w) {
  pre.clear(); pushed.clear(); w.physLog = logPush;
  for (const u of w.units) { if (u.dead || u.downed) continue; pre.set(u, { x: u.x, y: u.y, hop: u.hop || 0, k: Math.hypot(u.kx, u.ky), pdx: u._pdx, pdy: u._pdy, eth: !!(u.ethereal || u.hidden), act: actOf(u) }); }
}
function note(cause, tag, w, u, mag, extra) {
  const E = C.by[cause] || (C.by[cause] = { n: 0, worst: 0, sum: 0, kinds: {}, ex: [] });
  E.n++; E.sum += mag; E.worst = Math.max(E.worst, mag); E.kinds[u.kind] = (E.kinds[u.kind] || 0) + 1;
  const e = { tag, t: +w.time.toFixed(2), who: u.kind, id: u.id, jump: +mag.toFixed(1), x: Math.round(u.x), y: Math.round(u.y), ...extra };
  if (E.ex.length < 60) E.ex.push(e); else if (mag > E.ex[E.ex.length - 1].jump) { E.ex[E.ex.length - 1] = e; }
  if (E.ex.length >= 60) E.ex.sort((a, b) => b.jump - a.jump);
}
function after(w, tag) {
  if (w.time === w._seenT) return; w._seenT = w.time; // (a beat of stillness on a big hit, w.hitstop: nothing stepped)
  C.steps++;
  const us = w.units;
  for (const u of us) {
    if (u.dead || u.downed) continue;
    u._ptime = w.time;
    const p = pre.get(u); if (!p) { u._pdx = u._pdy = undefined; continue; }
    C.unitSteps++;
    const mx = u.x - p.x, my = u.y - p.y;
    const placed = !!(u.def.part || u.def.segment || (u.fixed && u.linkTo));
    let ex, ey;
    if (placed) { ex = mx - (p.pdx ?? mx); ey = my - (p.pdy ?? my); }
    else { ex = mx - (u.vx + u.kx / KD) * DT; ey = my - (u.vy + u.ky / KD) * DT; }
    u._pdx = mx; u._pdy = my;
    if (p.eth || u.ethereal || u.hidden) { u._pdx = u._pdy = undefined; continue; }                      // out of sight (burrowed, under the sand, a broom, smoke): not seen, and its next step is measured from nothing
    const mag = Math.hypot(ex, ey);
    // held back, not thrown: it went no further than its own pace would have taken it (it walked or was knocked
    // into a wall, a rock, a body, and was stopped or slid along it). Nothing jumps on the screen.
    if (!placed && Math.hypot(mx, my) <= Math.hypot(mx - ex, my - ey) + 1) continue;
    if (mag >= TH / 2 && mag < TH) C.small++;
    if (mag < TH) continue;
    if (p.hop > 6 || (u.hop || 0) > 6 || u.flyT > 0 && !u.def.boss || u.airborne) { continue; }       // in the air: a leap's own arc
    if (p.k > 90 || Math.hypot(u.kx, u.ky) > 90) continue;                                               // knocked: thrown
    // did the physics push it this step, by at least half of the jump?
    let cause = null, extra = {};
    const P = pushed.get(u), pm = P ? Math.hypot(P.x, P.y) : 0;
    // (held back again: a body its brain or an ability moved this step, a lunge, a hop, stopped by what it ran into.
    // Without the push it would have gone further than it did)
    if (P && pm >= TH / 2 && !placed) { const bx = mx - P.x, by = my - P.y, bm = Math.hypot(bx, by); if (bm > 1 && Math.hypot(mx, my) <= bm + 1 && (bx * P.x + by * P.y) < -0.5 * bm * pm) continue; }
    if (P && pm >= TH / 2 && pm >= mag * 0.5) {
      if (P.kind === 'body') { const o = P.o; cause = 'pushed out of ' + catOf(u, o); extra = { by: o.kind, push: +pm.toFixed(1), tiers: HT.airTier(u) + '/' + HT.airTier(o), m: +(o.mass / u.mass).toFixed(1) }; }
      else if (P.kind === 'rock') { cause = 'pushed out of a rock'; extra = { push: +pm.toFixed(1) }; }
      else { const e = 1.5; cause = u.x <= u.r + e || u.x >= w.W - u.r - e || u.y <= u.r + e || u.y >= w.H - u.r - e ? "pushed in from the room's edge" : 'pushed out of a wall'; extra = { push: +pm.toFixed(1) }; }
    }
    // a boulder or snowball (boulders.js is not logged): touching it now, pushed straight away from it
    if (!cause && !u.fixed && !p.act && !actOf(u)) {
      const nx = ex / mag, ny = ey / mag;
      for (const q of w.pillars) {
        if (!(q.boulder || q.snowball)) continue;
        const dx = u.x - q.x, dy = u.y - q.y, d = Math.hypot(dx, dy), gap = d - u.r - q.r;
        if (gap > 1.2 || d < 1e-6 || mag > u.r + q.r + 2) continue;
        if ((dx * nx + dy * ny) / d > 0.85) { cause = 'pushed out of a boulder'; extra = { gap: +gap.toFixed(1) }; }
      }
    }
    // a placed part whose own body lunged, rushed, dropped or was carried this step or the one before: it went with it
    if (!cause && placed) { const o = u.partOf || u.linkTo, q = o && pre.get(o); if (q && Math.max(Math.hypot(o.x - q.x, o.y - q.y), Math.hypot(q.pdx || 0, q.pdy || 0)) >= TH) cause = 'with its body: ' + o.kind + (o.stunT > 0 ? ' (held or carried)' : " (its own lunge, rush or drop)"); }
    if (!cause) cause = p.act || actOf(u) || stateOf(u);
    note(cause, tag, w, u, mag, extra);
    if (V && mag > 20) console.log('  ', tag, 't', w.time.toFixed(2), u.kind, cause, mag.toFixed(1), JSON.stringify(extra));
  }
  // the other side of easing bodies apart: how often two that should not share a place are left deep in each other
  // (same height, neither out of the world, not one animal, not two anchors: the rule of the game as it is now)
  for (let i = 0; i < us.length; i++) {
    const a = us[i]; if (a.dead || a.downed || a.ethereal || a.hidden || a.passUntil > w.time || a.def.pass) continue;
    const fa = !!(a.fixed || (a.def.part && !(a.def.speed > 0))), oa = a.partOf && !a.partOf.bodies ? a.partOf : a.linkTo || a, ta = HT.airTier(a);
    for (let j = i + 1; j < us.length; j++) {
      const b = us[j]; if (b.dead || b.downed || b.ethereal || b.hidden || b.passUntil > w.time || b.def.pass) continue;
      const dx = b.x - a.x, dy = b.y - a.y, m = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 >= (m - 8) * (m - 8)) continue;
      const fb = !!(b.fixed || (b.def.part && !(b.def.speed > 0))); if (fa && fb) continue;
      if (oa === (b.partOf && !b.partOf.bodies ? b.partOf : b.linkTo || b) || ta !== HT.airTier(b)) continue;
      const deep = m - Math.sqrt(d2); C.deep.n8++; if (deep > 16) { C.deep.n16++; { const key = a.id + ':' + b.id, sp = spell.get(key); if (sp && sp.last === C.steps - 1 && sp.w === w) { sp.last = C.steps; sp.n++; if (sp.n === 30) { C.deep.long++; if (C.deep.ex.length < 30) C.deep.ex.push(`${tag} t${w.time.toFixed(1)} ${a.kind} x ${b.kind} ${Math.round(deep)} deep`); } if (sp.n > C.deep.longest) C.deep.longest = sp.n; } else spell.set(key, { last: C.steps, n: 1, w }); } const k = [catOf(b, a), catOf(a, b)].sort()[0]; C.deep.by[k] = (C.deep.by[k] || 0) + 1; const kk = [a.kind, b.kind].sort().join(' x '); C.deep.kinds[kk] = (C.deep.kinds[kk] || 0) + 1; } if (deep > Math.min(a.r, b.r)) C.deep.half++;
    }
  }
}

// ---------------------------------------------------------------- the fights
const save = freshSave(); save.cheat = true;
const R = B.battleRoster(save);
const LEVEL = { wildwood: 6, warren: 12, sewers: 20, crypt: 28, frost: 34, ember: 44, spire: 48, dunes: 51, foundry: 56, loose: 25 };
const homeLevel = (k) => LEVEL[B.homeOf(k)] || 20;
function party(ids, lvl) { for (const id of ids) { const hv = save.heroes[id]; hv.owned = true; hv.level = lvl; hv.nodes = {}; hv.points = P.START_POINTS + lvl - 1; P.autoSpend(save, id); } }
const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });
let fights = 0, fightSecs = 0, errors = 0;
function fight(tag, a, b, lvl, seed, o = {}) {
  setSeed(seed);
  party(parse(a).map((s) => s.k).filter((k) => B.isHero(k)), lvl);
  party(parse(b).map((s) => s.k).filter((k) => B.isHero(k)), lvl);
  let run;
  try {
    run = B.newBattle(save, { arena: o.arena || 'crypt', size: o.size || 'l', a: parse(a), b: parse(b) });
    globalThis.GAME = { run };
    let t = 0;
    while (!run.summary && t < (o.secs || SECS)) { before(run.world); B.updateBattle(run, DT); t += DT; if (run.phase === 'fight') after(run.world, `${tag} #${seed}`); }
    fights++; fightSecs += t;
  } catch (e) { errors++; console.log('  ERROR', tag, seed, e.stack.split('\n').slice(0, 3).join(' | ')); }
}
const PARTIES = ['paladin,berserker,twinfang,tower', 'paladin,archer,cleric,pyromancer', 'oldguard,samurai,frost,bard'];
const bossesAll = R.dungeons.flatMap((d) => d.bosses);
const PARTED = ['ikSpider', 'stiltIdol', 'cinder', 'sandWurm', 'greatEngine', 'greatOoze', 'elderEnt', 'boneKing', 'winterQueen', 'gildedSeraph', 'chieftain'];
if (SETS.includes('bosses')) {
  const list = opt('boss') ? opt('boss').split(',') : [...PARTED, ...bossesAll.filter((k) => !PARTED.includes(k))];
  for (const k of list) { if (!DEFS[k]) continue; const n = PARTED.includes(k) ? N * 2 : Math.max(1, Math.ceil(N / 2)); for (let i = 0; i < n; i++) fight('boss ' + k, PARTIES[i % PARTIES.length], k, homeLevel(k), 100 + i * 7, { arena: B.homeOf(k) && B.homeOf(k) !== 'loose' ? B.homeOf(k) : 'sewers' }); }
}
if (SETS.includes('segs')) {
  for (const k of ['sandSerpent', 'chainCrawler']) for (let i = 0; i < N * 2; i++) fight('chain ' + k, PARTIES[i % PARTIES.length], `${k}*${1 + (i % 3)}${i % 4 === 3 ? '@1' : ''}`, homeLevel(k) - 6, 300 + i * 11, { arena: B.homeOf(k) });
}
if (SETS.includes('crowd')) {
  const mobs = ['rattler*12,rattlerSpear*6', 'goblin*12,orc*4,ogre*2', 'rat*12,crab*6', 'wolf*10,boar*4,banditBrute*3', 'scarab*12,mummy*4', 'slime*8,slimeBig*4', 'automaton*4,gearSprite*8,drillBot*4', 'frostWolf*8,snowman*4,spiderMomma*2'];
  for (let i = 0; i < mobs.length; i++) for (let j = 0; j < N; j++) fight('crowd ' + mobs[i], ['paladin,berserker,twinfang,tower,archer,cleric', 'mob,gladiator,werewolf,dame,bulwark,necromancer'][j % 2], mobs[i], homeLevel(parse(mobs[i])[0].k) + 4, 500 + i * 13 + j, { arena: B.homeOf(parse(mobs[i])[0].k) });
}
if (SETS.includes('fliers')) {
  const mobs = ['bat*10,frostWolf*4', 'ghost*6,banshee*3,rattler*6', 'wisp*6,wolf*6', 'cherub*6,angel*3,golem*2', 'imp*8,hellhound*4', 'cinderBat*8,demon*2', 'bee*8,wasp*6,automaton*2', 'spiritFrost*4,spiritFire*4,rattler*6'];
  for (let i = 0; i < mobs.length; i++) for (let j = 0; j < N; j++) fight('fliers ' + mobs[i], ['paladin,berserker,witch,griffon,valkyrie,archer', 'tower,warlock,shaman,falconer,twinfang,cleric'][j % 2], mobs[i], homeLevel(parse(mobs[i])[0].k) + 4, 700 + i * 17 + j, { arena: B.homeOf(parse(mobs[i])[0].k) });
}
if (SETS.includes('structs')) {
  const ps = ['engineer,shaman,beekeeper,quartermaster,crossbowman,chef', 'earthMage,necromancer,druid,trapper,alchemist,grenadier', 'warden,telekinetic,airMage,waterMage,digger,harpooner'];
  const foes = ['rattler*10,brute*2', 'orc*6,ogre*2,wolfRider*4', 'turretGun*3,turretFlame*2,mortar*2,automaton*3', 'lizardman*6,croc*3'];
  for (let i = 0; i < ps.length; i++) for (let j = 0; j < Math.max(2, N); j++) fight('structures ' + ps[i].split(',')[0], ps[i], foes[(i + j) % foes.length], homeLevel(parse(foes[(i + j) % foes.length])[0].k) + 4, 900 + i * 19 + j, { arena: B.homeOf(parse(foes[(i + j) % foes.length])[0].k) });
}
if (SETS.includes('trolls')) {
  for (const k of ['troll', 'rockTroll', 'yeti', 'ogre*3', 'frostGiant', 'golem*3', 'gildedGolem*2', 'brute*3']) for (let i = 0; i < N; i++) fight('big ' + k, PARTIES[i % PARTIES.length], k.includes('*') ? k : k + '*2', homeLevel(parse(k)[0].k) + 2, 1100 + i * 23, { arena: B.homeOf(parse(k)[0].k) });
}
if (SETS.includes('dungeons')) {
  const themes = opt('themes', 'wildwood,warren,sewers,crypt,frost,ember,spire,dunes,foundry').split(',');
  for (const theme of themes) for (let i = 0; i < Math.max(1, Math.ceil(N / 3)); i++) {
    setSeed(1300 + i * 7919);
    const s = freshSave(), lvl = LEVEL[theme] + 4, ids = HE.STARTERS.slice();
    for (const k of ids) { s.heroes[k].owned = true; s.heroes[k].level = lvl; s.heroes[k].points = P.START_POINTS + lvl - 1; P.autoSpend(s, k); }
    s.party = ids.slice(); s.unlocks = { slotMini1: true, slotBoss1: true };
    try {
      const run = DG.newRun(s, { theme, party: ids.slice(), depth: 1, floor: 1 });
      globalThis.GAME = { run };
      let t = 0, rooms = 0, lw = null;
      while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < +opt('dsecs', 420)) {
        const w0 = run.world; if (w0 !== lw) { rooms++; lw = w0; pre.clear(); }
        before(w0); DG.update(run, DT); t += DT;
        if (run.world === w0 && run.phase === 'fight') after(w0, `dungeon ${theme} run ${i} room ${rooms}`);
      }
      fights++; fightSecs += t;
    } catch (e) { errors++; console.log('  ERROR dungeon', theme, i, e.stack.split('\n').slice(0, 3).join(' | ')); }
  }
}

// ---------------------------------------------------------------- the report
const rows = Object.entries(C.by).sort((a, b) => b[1].n - a[1].n);
const total = rows.reduce((n, [, E]) => n + E.n, 0);
const isPush = (c) => c.startsWith('pushed');
const pushes = rows.filter(([c]) => isPush(c)).reduce((n, [, E]) => n + E.n, 0);
console.log(`tree ${PATH.relative(process.cwd(), root) || "."}`);
console.log(`${fights} fights, ${Math.round(fightSecs)} s simulated, ${C.steps} steps, ${C.unitSteps} unit-steps, errors ${errors}`);
console.log(`jumps of ${TH} or more in one step: ${total} (${(total / Math.max(1, fightSecs) * 60).toFixed(1)} a minute of fight); pushed out of something: ${pushes}; other: ${total - pushes}; smaller jumps (${TH / 2} to ${TH}): ${C.small}`);
const groupOf = (c) => (isPush(c) ? 0 : c.startsWith('placed:') ? 1 : 2);
console.log(`two bodies left in each other (pair-steps; same height, not one animal): more than 8 deep ${C.deep.n8}, more than 16 deep ${C.deep.n16}, deeper than the smaller one's radius ${C.deep.half}`);
const GROUPS = ['PUSHED OUT OF SOMETHING (the sim put it somewhere else in one step)', "PARTS A BRAIN PLACES (a snap: its step changed by that much from the step before)", "ITS OWN MOVE OR AN ABILITY'S (dashes, hauls, blinks, a boss's own motion: read, not counted as faults)"];
let lastG = -1;
rows.sort((a, b) => groupOf(a[0]) - groupOf(b[0]) || b[1].n - a[1].n);
for (const [c, E] of rows) {
  if (groupOf(c) !== lastG) { lastG = groupOf(c); console.log(`-- ${GROUPS[lastG]}: ${rows.filter(([q]) => groupOf(q) === lastG).reduce((n, [, e]) => n + e.n, 0)}`); }
  const kinds = Object.entries(E.kinds).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} ${n}`).join(', ');
  console.log(`${String(E.n).padStart(7)}  ${c.padEnd(38)} mean ${(E.sum / E.n).toFixed(1).padStart(5)}  worst ${E.worst.toFixed(1).padStart(6)}   ${kinds}`);
  if (V || has('exs')) for (const e of E.ex.slice().sort((a, b) => b.jump - a.jump).slice(0, EX)) console.log('           ', JSON.stringify(e));
}
console.log(`spells of half a second or more with a pair more than 16 deep: ${C.deep.long}; the longest ${(C.deep.longest / 60).toFixed(1)} s`); if (V || has('exs')) for (const e of C.deep.ex) console.log('     ', e);
console.log('more than 16 deep, by what the other is: ' + Object.entries(C.deep.by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', '));
console.log('  the pairs: ' + Object.entries(C.deep.kinds).sort((a, b) => b[1] - a[1]).slice(0, 16).map(([k, n]) => `${k} ${n}`).join(', '));
const ck = Object.entries(C.layer.crossKinds).sort((a, b) => b[1] - a[1]);
console.log(`layers (pushes the physics made): pairs on different heights ${C.layer.cross}; a body against its own boss or its own parts ${C.layer.ownBoss}; against its own chain ${C.layer.ownChain}`);
for (const [k, n] of ck.slice(0, 14)) console.log(`${String(n).padStart(7)}  ${k}`);
if (opt('json')) FS.writeFileSync(opt('json'), JSON.stringify({ tree: PATH.relative(process.cwd(), root) || ".", fights, secs: Math.round(fightSecs), steps: C.steps, unitSteps: C.unitSteps, th: TH, total, pushes, small: C.small, deep: C.deep, by: Object.fromEntries(rows.map(([c, E]) => [c, { n: E.n, mean: +(E.sum / E.n).toFixed(1), worst: +E.worst.toFixed(1), kinds: E.kinds, ex: E.ex.slice().sort((a, b) => b.jump - a.jump).slice(0, 20) }])), layer: C.layer }, null, 1));
