// Lane physics19: one boss fight, every snap of a placed part printed with what its boss was doing that step.
//   node tools/physics19/probe.mjs --boss cinder [--root scratch/before] [--seed 100] [--secs 40] [--th 6] [--party a,b,c,d]
import PATH from 'node:path'; import URL_ from 'node:url';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const here = PATH.dirname(URL_.fileURLToPath(import.meta.url)), root = PATH.resolve(opt('root', PATH.join(here, '..', '..')));
const imp = (f) => import(URL_.pathToFileURL(PATH.join(root, 'js', f)).href);
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await imp('battle.js'), { setSeed } = await imp('util.js'), { freshSave } = await imp('save.js'), P = await imp('progress.js');
const save = freshSave(); save.cheat = true;
const boss = opt('boss', 'cinder'), party = opt('party', 'paladin,berserker,twinfang,tower').split(','), lvl = +opt('level', 30), TH = +opt('th', 6), DT = 1 / 60;
for (const id of party) { const hv = save.heroes[id]; hv.owned = true; hv.level = lvl; hv.nodes = {}; hv.points = P.START_POINTS + lvl - 1; P.autoSpend(save, id); }
setSeed(+opt('seed', 100));
const run = B.newBattle(save, { arena: opt('arena', 'sewers'), size: 'l', a: party.map((k) => ({ k, n: 1 })), b: boss.split(',').map((x) => { const [k, n] = x.split('*'); return { k, n: +n || 1 }; }) });
globalThis.GAME = { run };
const w = run.world, prev = new Map();
const st = (u) => { const k = u.cd || u.sp || u.si || u.sw || u.ge || {}; const e = u.el || {}; return JSON.stringify({ mv: k.mv && (k.mv.type || k.mv.kind || k.mv), hold: +(e.holdT || 0).toFixed(2), rush: !!e.rush, act: u.act && u.act.type, slam: k.slam && k.slam.st, fall: !!k.fall, pose: k.pose && k.pose.kind, rear: k.rear && +k.rear.toFixed(1), v: Math.round(Math.hypot(u.vx, u.vy)), stun: +(u.stunT || 0).toFixed(1), anim: u.anim && u.anim.kind, hidden: !!u.hidden }); };
let n = 0;
for (let t = 0; t < +opt('secs', 40) && !run.summary; t += DT) {
  B.updateBattle(run, DT);
  if (opt('watch')) { const [t0, t1] = opt('watch').split(':').map(Number); if (w.time >= t0 && w.time <= t1) { const b = w.units.find((u) => u.def.boss); const k = b.cd || b.sp || b.si || b.sw || b.ge || {}; const q = w.units.find((u) => u.partOf === b && !u.dead);
    console.log(w.time.toFixed(3), 'boss', b.x.toFixed(1), b.y.toFixed(1), 'f', b.facing.toFixed(3), 'v', b.vx.toFixed(0), b.vy.toFixed(0), 'part', q && q.x.toFixed(1), q && q.y.toFixed(1), JSON.stringify({ mv: k.mv && (k.mv.type || k.mv), rear: k.rear, crouch: k.crouch, gait: k.gait && +k.gait.toFixed(2), hold: b.el && b.el.holdT, h: k.h, gx: k.gx && +k.gx.toFixed(1), gy: k.gy && +k.gy.toFixed(1), sp0: k.sp && k.sp[5] && [+k.sp[5].x.toFixed(1), +k.sp[5].y.toFixed(1)], vis5: k.vis && k.vis[5] && [+k.vis[5].x.toFixed(1), +k.vis[5].y.toFixed(1)] }), opt('extra') ? JSON.stringify(eval(opt('extra'))) : ''); } }
  if (w.time === w._seenT) continue; w._seenT = w.time; // (hitstop: nothing stepped)
  for (const u of w.units) {
    if (u.dead) continue;
    const p = prev.get(u), placed = u.def.part || u.def.segment || u.linkTo || u.def.boss;
    if (p && placed) {
      const mx = u.x - p.x, my = u.y - p.y, jx = mx - p.mx, jy = my - p.my, j = Math.hypot(jx, jy);
      if (j >= TH && !(u.hidden || p.hidden)) { n++; if (n < +opt('max', 80)) console.log(w.time.toFixed(2), u.kind, u.id, 'snap', j.toFixed(1), 'step', Math.hypot(mx, my).toFixed(1), 'was', Math.hypot(p.mx, p.my).toFixed(1), 'hop', Math.round(u.hop || 0), st(u.partOf || u.linkTo || u)); }
      prev.set(u, { x: u.x, y: u.y, mx: u.hidden || p.hidden ? NaN : mx, my: u.hidden || p.hidden ? NaN : my, hidden: !!u.hidden });
    } else prev.set(u, { x: u.x, y: u.y, mx: 0, my: 0, hidden: !!u.hidden });
  }
}
console.log('snaps', n, 'in', w.time.toFixed(1), 's');
