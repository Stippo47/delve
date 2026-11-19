// Trinkets: things a hero wears (1, or 2 with the skill tree's slot node). Each is a set of hooks, the same kind of
// object as a trait (see the list at the top of kits.js); sim.js calls them through hooksOf(u). A unit gets
// u.trinketHooks from its u.trinkets (ids) at spawn. Effects are shown, not told: rings, beams, zones and particles,
// never words in the arena.
//   TRINKETS[id] = { name, desc (one plain sentence), rarity, price (gold), color (the gem's colour for the UI), hooks }
// Damage a trinket deals itself carries o.proc, and the trinkets that react to hits ignore proc hits, so one
// trinket's sparks never set off another's in an endless loop.
import { TAU, clamp, dist, angleTo, angleDiff, rand, rrange, chance } from './util.js';
import { hurt, addStatus, spawn, alive, hpRatio, puff, explode, blocked, stun, heal, fx, zone } from './sim.js';
import { shoot } from './kits.js';
import { lineClear, circleRect } from './path.js';

// ---------------------------------------------------------------- helpers
const st = (u, id) => { const s = u.trs || (u.trs = {}); return s[id] || (s[id] = {}); };
const foeOf = (u, o) => alive(o) && !o.ethereal && o.team !== u.team && o.team !== 'neutral';
const foesNear = (w, u, x, y, r) => w.units.filter((o) => foeOf(u, o) && dist(x, y, o.x, o.y) < r + o.r);
const nearestFoe = (w, u, x, y, r, skip) => {
  let best = null, bd = r;
  for (const o of w.units) if (foeOf(u, o) && o !== skip && !(skip instanceof Set && skip.has(o))) { const d = dist(x, y, o.x, o.y); if (d < bd) { bd = d; best = o; } }
  return best;
};
const inFight = (w, u, r = 320) => w.units.some((o) => foeOf(u, o) && o.aggro !== false && dist(u.x, u.y, o.x, o.y) < r);
const baseDmg = (u, k) => (u.def.dmg || 8) * (u.dmgMul || 1) * k;
const P = (w, p) => { w.particles.push({ vx: 0, vy: 0, life: 0.5, max: 0.5, size: 4, ...p }); };
function flame(w, x, y, size = 7) {
  P(w, { shape: 'flame', x: x + rrange(-6, 6), y: y + rrange(-6, 6), vx: rrange(-15, 15), vy: rrange(-15, 15), rise: rrange(40, 70), up: 0, life: rrange(0.3, 0.5), max: 0.5, size, color: '#FF8A3D', drag: 0.96 });
}
function spark(w, x, y, a, color = '#FFFFFF', v = 220) {
  const b = a + rrange(-0.8, 0.8), s = v * rrange(0.6, 1.2);
  P(w, { shape: 'spark', x, y, vx: Math.cos(b) * s, vy: Math.sin(b) * s, life: 0.16, max: 0.16, size: 3, color, drag: 0.85 });
}
// A line of motes from one point to another: chains, wisps, the way back for a rewind.
function streak(w, x1, y1, x2, y2, color, n = 8, size = 4, life = 0.35) {
  for (let i = 0; i <= n; i++) { const k = i / n; P(w, { x: x1 + (x2 - x1) * k + rrange(-3, 3), y: y1 + (y2 - y1) * k + rrange(-3, 3), life: life * rrange(0.7, 1), max: life, size: size * rrange(0.7, 1.2), color }); }
}
// A projectile from any point (shoot() in kits.js always leaves from the shooter).
function shotFrom(w, owner, x, y, a, o) {
  const sp = o.speed || 420;
  w.projectiles.push({ kind: o.kind || 'bolt', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: o.r || 5, team: owner.team, owner, dmg: o.dmg,
    o: { knock: 30, ...(o.st || {}), proc: true }, life: o.life || 0.8, a, skip: o.skip || null, land: o.land || null });
}
const freeAt = (w, x, y, r) => x > r && y > r && x < w.W - r && y < w.H - r && !w.walls.some((wl) => circleRect(x, y, r, wl)) && !w.pillars.some((p) => dist(x, y, p.x, p.y) < p.r + r);
// Statuses on every hit (the simple rings): a few motes of the status's colour where it lands.
const onHit = (type, amount, color) => ({
  hit(w, u, t, amt, o) { if (o.proc || !alive(t)) return; addStatus(w, t, type, amount, u); for (let i = 0; i < 3; i++) spark(w, t.x, t.y, rand() * TAU, color, 120); },
});

// ---------------------------------------------------------------- the ghost (Wraith Veil)
// A downed hero's ghost: same look, drawn see-through (u.ethereal), can't be hit, targeted or touched by statuses,
// hits very weakly. It slips back into the body when the body is revived. It counts as a summon, so it never keeps a
// run going on its own (a party of ghosts is a wiped party).
const GHOST = {
  tick(w, g, dt) {
    if (g.ghostOf && (g.ghostOf.dead || !g.ghostOf.downed)) {           // revived: back into the body
      if (!g.ghostOf.dead) streak(w, g.x, g.y, g.ghostOf.x, g.ghostOf.y, 'rgba(200,225,255,0.8)', 10, 5, 0.5);
      puff(w, g.x, g.y, 'rgba(200,225,255,0.7)', 10, 60, 6, 0.6); g.dead = true; return;
    }
    g.hop = 6 + Math.sin(w.time * 3 + g.id) * 4;                          // floats a little off the ground
    if (rand() < dt * 10) P(w, { x: g.x + rrange(-g.r, g.r) * 0.6, y: g.y + rrange(-g.r, g.r) * 0.6, rise: 30, up: 0, life: 0.7, max: 0.7, size: 5, color: 'rgba(200,225,255,0.55)' });
  },
  immune: ['burn', 'chill', 'poison', 'wet', 'shock', 'stagger'],
  knockImmune: true,
};
export function raiseGhost(w, body) {
  const g = spawn(w, body.kind, body.x, body.y, { team: 'hero', level: body.level || 1 });
  Object.assign(g, { summon: true, ghostOf: body.fake ? null : body, ethereal: true, aggro: true, potions: 0, abilT: Infinity,
    dmgMul: (body.dmgMul || 1) * 0.25, facing: body.facing || 0, mvA: body.facing || 0, trinketHooks: [GHOST], trinkets: [] });
  fx(w, { type: 'pillar', x: body.x, y: body.y, r: 26, kind: 'holy', max: 0.7 });
  puff(w, body.x, body.y, 'rgba(200,225,255,0.8)', 16, 90, 7, 0.8);
  return g;
}

// ---------------------------------------------------------------- the trinkets
export const TRINKETS = {
  // ---------- legendary
  phoenixFeather: {
    name: 'Phoenix Feather', rarity: 'legendary', price: 600, color: '#FF7A2F',
    desc: 'Once a run, when you would go down you burst into flame and rise again at half health, and the feather burns away.',
    hooks: {
      downed(w, u) {
        u.hp = u.maxHp * 0.5; u.invulnT = 1.5; cleanseHot(u);
        fx(w, { type: 'pillar', x: u.x, y: u.y, r: 40, kind: 'fire', max: 0.9 });
        fx(w, { type: 'ring', x: u.x, y: u.y, r: 150, color: '#FF9A3D', max: 0.5 });
        for (let i = 0; i < 22; i++) flame(w, u.x + rrange(-30, 30), u.y + rrange(-30, 30), 9);
        for (const e of foesNear(w, u, u.x, u.y, 150)) hurt(w, e, baseDmg(u, 1.5), u, { burn: 45, knock: 260, kAngle: angleTo(u.x, u.y, e.x, e.y), noDodge: true, proc: true });
        w.shake = Math.max(w.shake, 7);
        consume(u, 'phoenixFeather');
        return true;
      },
    },
  },
  wraithVeil: {
    name: 'Wraith Veil', rarity: 'legendary', price: 520, color: '#C8DCFF',
    desc: 'When you go down your ghost rises from the body and fights on, faint and untouchable, until you are revived.',
    hooks: { fallen(w, u) { if (u.team === 'hero' && !u.summon) raiseGhost(w, u); } },
  },
  timeSand: {
    name: 'Hourglass of Sand', rarity: 'legendary', price: 480, color: '#E8C878',
    desc: 'Once a room, when you drop below a third of your health, time winds you back to where you stood three seconds ago, with the health you had then.',
    hooks: {
      tick(w, u, dt) {
        const s = st(u, 'timeSand'); s.acc = (s.acc || 0) + dt; if (s.acc < 0.2) return; s.acc = 0;
        (s.past || (s.past = [])).push({ x: u.x, y: u.y, hp: u.hp }); if (s.past.length > 16) s.past.shift();
        if (!s.used && rand() < 0.3) P(w, { x: u.x + rrange(-8, 8), y: u.y + rrange(-8, 8), vy: 30, life: 0.5, max: 0.5, size: 2.5, color: '#E8C878' });
      },
      struck(w, u) {
        const s = st(u, 'timeSand'); if (s.used || !s.past || s.past.length < 10 || u.hp > u.maxHp / 3) return;
        s.used = true; const back = s.past[0];
        for (let i = s.past.length - 1; i > 0; i--) streak(w, s.past[i].x, s.past[i].y, s.past[i - 1].x, s.past[i - 1].y, '#E8C878', 3, 4, 0.7);
        streak(w, u.x, u.y, s.past[s.past.length - 1].x, s.past[s.past.length - 1].y, '#E8C878', 3, 4, 0.7);
        fx(w, { type: 'ring', x: u.x, y: u.y, r: 40, color: '#E8C878', max: 0.4 });
        u.x = back.x; u.y = back.y; u.kx = u.ky = 0; u.vx = u.vy = 0; u.path = null;
        u.hp = Math.max(u.hp, back.hp, u.maxHp * 0.2); u.invulnT = Math.max(u.invulnT, 0.6); u.act = null;
        fx(w, { type: 'ring', x: u.x, y: u.y, r: 60, color: '#FFE7A0', max: 0.5 });
        puff(w, u.x, u.y, '#E8C878', 14, 80, 4, 0.6);
      },
    },
  },
  // ---------- epic
  impLantern: {
    name: 'Imp Lantern', rarity: 'epic', price: 340, color: '#FF9A3D',
    desc: 'Every few seconds a little flame lobs a fireball at the thickest knot of enemies, and it bursts, setting them alight.',
    hooks: {
      tick(w, u, dt) {
        const s = st(u, 'impLantern'); s.t = (s.t ?? 2) - dt;
        // the lantern's flame bobs over the wearer's shoulder
        if (rand() < dt * 8) { const a = w.time * 2.5; flame(w, u.x + Math.cos(a) * (u.r + 8), u.y + Math.sin(a) * (u.r + 8), 4); }
        if (s.t > 0) return;
        let best = null, bn = 0;
        for (const e of foesNear(w, u, u.x, u.y, 330)) {
          if (blocked(w, u.x, u.y, e.x, e.y)) continue;
          const n = foesNear(w, u, e.x, e.y, 75).length; if (n > bn) { bn = n; best = e; }
        }
        if (!best) { s.t = 0.5; return; }
        s.t = 4.5;
        const lead = dist(u.x, u.y, best.x, best.y) / 320;
        shoot(w, u, angleTo(u.x, u.y, best.x + best.vx * lead, best.y + best.vy * lead), { kind: 'fireball', speed: 320, r: 9, dmg: 0, life: 1.4,
          land: (p) => explode(w, p.x, p.y, 75, baseDmg(u, 1.1), { burn: 32 }, u, '#FF8A3D') });
        for (let i = 0; i < 5; i++) flame(w, u.x, u.y, 6);
      },
    },
  },
  blinkStone: {
    name: 'Blink Stone', rarity: 'epic', price: 320, color: '#B58CFF',
    desc: 'Once every few seconds, a blow that would land on you finds only air: you blink away, out of reach.',
    hooks: {
      evade(w, u, src, amt, o) {
        if (!src || src.team === u.team) return false;
        const s = st(u, 'blinkStone'); if ((s.ready ?? 0) > w.time) return false;
        let best = null, bs = -Infinity;
        for (let i = 0; i < 16; i++) {
          const a = i / 16 * TAU, d = 150 + (i % 3) * 40, x = u.x + Math.cos(a) * d, y = u.y + Math.sin(a) * d;
          if (!freeAt(w, x, y, u.r + 4) || !lineClear(w, u.x, u.y, x, y, 4)) continue;
          let near = Infinity; for (const e of w.units) if (foeOf(u, e)) near = Math.min(near, dist(x, y, e.x, e.y) - e.r);
          if (near > bs) { bs = near; best = { x, y }; }
        }
        if (!best) return false;
        s.ready = w.time + 6;
        puff(w, u.x, u.y, 'rgba(150,110,230,0.85)', 12, 80, 6, 0.5);
        streak(w, u.x, u.y, best.x, best.y, 'rgba(181,140,255,0.8)', 10, 3, 0.3);
        u.x = best.x; u.y = best.y; u.kx = u.ky = 0; u.path = null; u.invulnT = Math.max(u.invulnT, 0.35);
        if (u.act && u.act.type === 'drink') u.act = null;
        puff(w, u.x, u.y, 'rgba(150,110,230,0.85)', 12, 80, 6, 0.5);
        fx(w, { type: 'ring', x: u.x, y: u.y, r: 34, color: '#B58CFF', max: 0.3 });
        return true;
      },
    },
  },
  thunderRing: {
    name: 'Thunder Ring', rarity: 'epic', price: 300, color: '#FFF27A',
    desc: 'Every fourth hit lets loose lightning that leaps between up to four enemies, jumping further and hitting harder through the wet.',
    hooks: {
      hit(w, u, t, amt, o) {
        if (o.proc) return;
        const s = st(u, 'thunderRing'); s.n = (s.n || 0) + 1; if (s.n < 4) return; s.n = 0;
        const done = new Set(); let from = t;
        for (let j = 0; j < 4 && from; j++) {
          const wet = from.st && from.st.wet > 20;
          const next = j === 0 ? t : nearestFoe(w, u, from.x, from.y, wet ? 260 : 170, done);
          if (!next) break;
          const x0 = j === 0 ? u.x : from.x, y0 = j === 0 ? u.y : from.y;
          fx(w, { type: 'beam', x1: x0, y1: y0, x2: next.x, y2: next.y, kind: 'lightning', max: 0.25 });
          streak(w, x0, y0, next.x, next.y, '#FFF27A', 7, 3, 0.2);
          for (let i = 0; i < 4; i++) spark(w, next.x, next.y, rand() * TAU, '#FFF27A');
          const soaked = next.st.wet > 20;
          hurt(w, next, baseDmg(u, soaked ? 0.9 : 0.5), u, { noDodge: true, shock: soaked ? 70 : 30, proc: true });
          done.add(next); from = next;
        }
      },
    },
  },
  boneCharm: {
    name: 'Bone Charm', rarity: 'epic', price: 300, color: '#E8E2D0',
    desc: 'Enemies you kill sometimes climb back up as skeletons that fight for you for a few seconds.',
    hooks: {
      kill(w, u, v) {
        if (v.summon || v.def.boss || u.summon || !chance(0.5)) return;
        if (w.units.filter((o) => o.summonBy === u && o.boneCharm && alive(o)).length >= 2) return;
        const s = spawn(w, 'skeleton', v.x, v.y, { team: u.team });
        Object.assign(s, { summon: true, summonBy: u, boneCharm: true, lifeT: 9, aggro: true, dmgMul: (u.dmgMul || 1) * 0.6, tint: '#C9A7FF', facing: v.facing, mvA: v.facing });
        s.hp = s.maxHp = Math.round(s.maxHp * 0.7);
        fx(w, { type: 'pillar', x: v.x, y: v.y, r: 24, kind: 'drain', max: 0.5 });
        puff(w, v.x, v.y, '#E8E2D0', 14, 90, 5, 0.6);
      },
    },
  },
  widowLocket: {
    name: "Widow's Locket", rarity: 'epic', price: 280, color: '#FFE7A0',
    desc: 'When a friend goes down, holy light bursts from their body, throwing enemies back and keeping them off it for a while.',
    hooks: {
      allyDown(w, u, v) {
        if (v.team !== 'hero' || v.summon) return;
        fx(w, { type: 'pillar', x: v.x, y: v.y, r: 40, kind: 'holy', max: 0.8 });
        fx(w, { type: 'ring', x: v.x, y: v.y, r: 170, color: '#FFE7A0', max: 0.5 });
        fx(w, { type: 'zone', x: v.x, y: v.y, r: 80, kind: 'sanctuary', ward: true, src: u, max: 6 });
        puff(w, v.x, v.y, '#FFE7A0', 20, 160, 5, 0.6);
        for (const e of foesNear(w, u, v.x, v.y, 170)) { hurt(w, e, baseDmg(u, 0.5), u, { knock: 360, heavy: true, kAngle: angleTo(v.x, v.y, e.x, e.y), noDodge: true, proc: true }); stun(w, e, 1); }
        w.shake = Math.max(w.shake, 5);
      },
    },
  },
  whirlingKnives: {
    name: 'Whirling Knives', rarity: 'epic', price: 300, color: '#D8DEE8',
    desc: 'Two little knives circle you in a fight, nicking every enemy they pass.',
    hooks: {
      tick(w, u, dt) {
        if (!inFight(w, u, 260)) return;
        const s = st(u, 'whirlingKnives'); s.a = (s.a || 0) + dt * 5.5; s.hitT = s.hitT || new Map();
        const R = u.r + 24;
        for (let k = 0; k < 2; k++) {
          const a = s.a + k * Math.PI, x = u.x + Math.cos(a) * R, y = u.y + Math.sin(a) * R;
          P(w, { shape: 'spark', x, y, vx: -Math.sin(a) * 60, vy: Math.cos(a) * 60, life: 0.12, max: 0.12, size: 3.5, color: '#E8EEF6', drag: 0.8 });
          for (const e of foesNear(w, u, x, y, 9)) {
            if ((s.hitT.get(e) || 0) > w.time) continue; s.hitT.set(e, w.time + 0.5);
            hurt(w, e, baseDmg(u, 0.25), u, { knock: 40, kAngle: a + Math.PI / 2, proc: true });
          }
        }
      },
    },
  },
  splitShard: {
    name: 'Splitting Shard', rarity: 'epic', price: 260, color: '#9FDDF6',
    desc: 'Your shots split as they hit, and two smaller shots fly on into whatever is behind.',
    hooks: {
      hit(w, u, t, amt, o) {
        if (!o.shot || o.proc) return;
        const a = o.kAngle ?? angleTo(u.x, u.y, t.x, t.y);
        for (const s of [-0.45, 0.45]) shotFrom(w, u, t.x + Math.cos(a + s) * (t.r + 4), t.y + Math.sin(a + s) * (t.r + 4), a + s,
          { kind: 'shard', speed: 460, r: 4, dmg: Math.max(2, amt * 0.4), life: 0.55, skip: t });
        for (let i = 0; i < 4; i++) spark(w, t.x, t.y, a, '#BFEFFF');
      },
    },
  },
  // ---------- rare
  cinderBoots: {
    name: 'Cinder Boots', rarity: 'rare', price: 180, color: '#E0603B',
    desc: 'You run a little faster and leave a trail of embers in a fight that burns enemies who walk through it.',
    hooks: {
      moveSpeed: () => 1.1,
      tick(w, u, dt) {
        const s = st(u, 'cinderBoots'); s.t = (s.t || 0) - dt;
        if (s.t > 0 || u.spd < 30 || !inFight(w, u)) return; s.t = 0.25;
        flame(w, u.x, u.y, 5);
        zone(w, { x: u.x, y: u.y, r: 22, dur: 2.4, kind: 'fire', src: u, every: 0.3, tick(z) {
          if (rand() < 0.5) flame(w, z.x, z.y, 5);
          for (const e of foesNear(w, u, z.x, z.y, z.r)) addStatus(w, e, 'burn', 12, u);
        } });
      },
    },
  },
  brambleVest: {
    name: 'Bramble Vest', rarity: 'rare', price: 160, color: '#7FA04A',
    desc: 'Whoever hits you up close gets a spray of thorns back.',
    hooks: {
      struck(w, u, src, amt, o) {
        if (!src || o.proc || src.team === u.team || !alive(src) || dist(u.x, u.y, src.x, src.y) > u.r + src.r + 70) return;
        const s = st(u, 'brambleVest'); if ((s.ready || 0) > w.time) return; s.ready = w.time + 0.5;
        const a = angleTo(u.x, u.y, src.x, src.y);
        for (const d of [-0.3, 0, 0.3]) shoot(w, u, a + d, { kind: 'thorn', speed: 520, r: 4, dmg: 2 + amt * 0.25, life: 0.4, st: { proc: true } });
      },
    },
  },
  soulJar: {
    name: 'Soul Jar', rarity: 'rare', price: 170, color: '#BFE8FF',
    desc: 'Everything you kill lets loose a wisp that flies into the nearest enemy.',
    hooks: {
      kill(w, u, v) {
        const e = nearestFoe(w, u, v.x, v.y, 420, v); if (!e) return;
        puff(w, v.x, v.y, 'rgba(190,232,255,0.8)', 8, 50, 5, 0.6);
        shotFrom(w, u, v.x, v.y, angleTo(v.x, v.y, e.x, e.y), { kind: 'bolt', speed: 360, r: 7, dmg: baseDmg(u, 0.9), life: 1.3, skip: v, st: { chill: 10 } });
      },
    },
  },
  frostBloom: {
    name: 'Frost Bloom', rarity: 'rare', price: 170, color: '#BFEFFF',
    desc: 'Enemies you kill burst into a ring of icicles that chill everything around them.',
    hooks: {
      kill(w, u, v) {
        puff(w, v.x, v.y, '#E6F8FF', 12, 120, 5, 0.5);
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + rand() * 0.3;
          shotFrom(w, u, v.x + Math.cos(a) * v.r, v.y + Math.sin(a) * v.r, a, { kind: 'icicle', speed: 330, r: 5, dmg: baseDmg(u, 0.35), life: 0.55, skip: v, st: { chill: 30 } }); }
      },
    },
  },
  galeFeather: {
    name: 'Gale Feather', rarity: 'rare', price: 150, color: '#E6F0F2',
    desc: 'When enemies crowd round you, a gust of wind blows them all away.',
    hooks: {
      tick(w, u, dt) {
        const s = st(u, 'galeFeather'); s.t = (s.t || 0) - dt; if (s.t > 0) return;
        const crowd = foesNear(w, u, u.x, u.y, u.r + 60); if (crowd.length < 3) { s.t = 0.3; return; }
        s.t = 6;
        fx(w, { type: 'ring', x: u.x, y: u.y, r: u.r + 110, color: '#E6F0F2', max: 0.4 });
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; P(w, { x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, life: 0.35, max: 0.35, size: 5, color: 'rgba(230,240,242,0.8)', drag: 0.9 }); }
        for (const e of crowd) hurt(w, e, 1, u, { knock: 420, heavy: true, kAngle: angleTo(u.x, u.y, e.x, e.y), noDodge: true, proc: true });
      },
    },
  },
  salamanderScale: {
    name: 'Salamander Scale', rarity: 'rare', price: 150, color: '#FF6A3D',
    desc: 'Fire never burns you, and standing in flames heals you.',
    hooks: {
      immune: ['burn'],
      tick(w, u, dt) {
        const inFire = w.hazards.some((h) => h.type === 'fire' && dist(u.x, u.y, h.x, h.y) < h.r + u.r * 0.4)
          || w.fx.some((f) => f.type === 'zone' && f.kind === 'fire' && dist(u.x, u.y, f.x, f.y) < f.r + u.r * 0.4);
        if (!inFire) return;
        heal(w, u, u.maxHp * 0.05 * dt, u);
        if (rand() < dt * 10) P(w, { x: u.x + rrange(-12, 12), y: u.y + rrange(-12, 12), rise: 50, up: 0, life: 0.6, max: 0.6, size: 4, color: rand() < 0.5 ? '#9BE07A' : '#FFB347' });
      },
    },
  },
  snakeCharm: {
    name: 'Snake Charm', rarity: 'rare', price: 140, color: '#9BCB3C',
    desc: 'Poison can never touch you.',
    hooks: {
      immune: ['poison'],
      tick(w, u, dt) {   // poison clouds part around you
        if (rand() > dt * 8) return;
        const gas = w.hazards.some((h) => h.type === 'gas' && dist(u.x, u.y, h.x, h.y) < h.r + u.r)
          || w.fx.some((f) => f.type === 'zone' && f.kind === 'poison' && dist(u.x, u.y, f.x, f.y) < f.r + u.r);
        if (gas) { const a = rand() * TAU; P(w, { x: u.x + Math.cos(a) * u.r, y: u.y + Math.sin(a) * u.r, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: 0.4, max: 0.4, size: 5, color: '#9BCB3C' }); }
      },
    },
  },
  kindlingFlask: {
    name: 'Kindling Flask', rarity: 'rare', price: 160, color: '#FFB347',
    desc: 'Hitting a burning enemy makes the fire on it burst, scorching everything close by.',
    hooks: {
      hit(w, u, t, amt, o) {
        if (o.proc || !t.st || t.st.burn < 25) return;
        const s = st(u, 'kindlingFlask'); s.ready = s.ready || new Map();
        if ((s.ready.get(t) || 0) > w.time) return; s.ready.set(t, w.time + 1.5);
        t.st.burn *= 0.4;
        explode(w, t.x, t.y, 65, baseDmg(u, 0.8), { burn: 12 }, u, '#FFB347');
      },
    },
  },
  hookChain: {
    name: 'Hook and Chain', rarity: 'rare', price: 170, color: '#A8A8B0',
    desc: 'Every so often you hook an enemy from afar and drag it to your feet, ideally one that is after a friend.',
    hooks: {
      tick(w, u, dt) {
        const s = st(u, 'hookChain'); s.t = (s.t ?? 3) - dt; if (s.t > 0 || u.stunT > 0 || u.frozenT > 0 || u.act) return; s.t = 0.5;
        let best = null, bs = 0;
        for (const e of foesNear(w, u, u.x, u.y, 380)) {
          const d = dist(u.x, u.y, e.x, e.y); if (d < 150 || e.def.boss || blocked(w, u.x, u.y, e.x, e.y)) continue;
          const sc = 1 + (e.target && e.target !== u ? 1 : 0) + d / 400; if (sc > bs) { bs = sc; best = e; }
        }
        if (!best) return;
        s.t = 8;
        const d = dist(u.x, u.y, best.x, best.y) - u.r - best.r - 14, a = angleTo(best.x, best.y, u.x, u.y);
        best.kx = Math.cos(a) * d * 5; best.ky = Math.sin(a) * d * 5; best.act = null; stun(w, best, 0.6);
        best.target = u; best.tauntBy = u; best.tauntT = 3;
        fx(w, { type: 'beam', x1: u.x, y1: u.y, x2: best.x, y2: best.y, kind: 'drain', max: 0.3 });
        streak(w, u.x, u.y, best.x, best.y, '#B8B8C0', 14, 3, 0.35);
        for (let i = 0; i < 5; i++) spark(w, best.x, best.y, a, '#D8D8E0');
      },
    },
  },
  howlingSkull: {
    name: 'Howling Skull', rarity: 'rare', price: 140, color: '#D9D2C0',
    desc: 'When you go down, a scream bursts out of you that stuns and scatters every enemy nearby.',
    hooks: {
      fallen(w, u) {
        for (let i = 0; i < 3; i++) fx(w, { type: 'ring', x: u.x, y: u.y, r: 90 + i * 60, color: '#D9D2C0', max: 0.35 + i * 0.15 });
        fx(w, { type: 'wave', x: u.x, y: u.y, a: 0, r: 200, max: 0.5 });
        puff(w, u.x, u.y, '#D9D2C0', 18, 200, 5, 0.6);
        for (const e of foesNear(w, u, u.x, u.y, 200)) { stun(w, e, 1.6); e.target = null; e.kx += Math.cos(angleTo(u.x, u.y, e.x, e.y)) * 240 / e.mass; e.ky += Math.sin(angleTo(u.x, u.y, e.x, e.y)) * 240 / e.mass; }
        w.shake = Math.max(w.shake, 6);
      },
    },
  },
  lastBreath: {
    name: 'Last Breath', rarity: 'rare', price: 180, color: '#FFE7A0',
    desc: 'Once a room, a blow that would bring you down leaves you clinging on, untouchable for two seconds.',
    hooks: {
      downed(w, u) {
        const s = st(u, 'lastBreath'); if (s.used) return false;
        s.used = true; u.hp = 1; u.invulnT = 2;
        fx(w, { type: 'ring', x: u.x, y: u.y, r: 60, color: '#FFE7A0', max: 0.5 });
        puff(w, u.x, u.y, '#FFE7A0', 14, 120);
        return true;
      },
    },
  },
  volatile: {
    name: 'Volatile Charm', rarity: 'rare', price: 140, color: '#FF8A3D',
    desc: 'Sometimes when you are hit you explode, burning everything nearby.',
    hooks: {
      struck(w, u, src, amt, o) { if (o.proc || !chance(0.15)) return; explode(w, u.x, u.y, 70, 14 * (u.dmgMul || 1), { burn: 28 }, u, '#FF8A3D', u); },
    },
  },
  // ---------- common
  frostRing: { name: 'Frost Ring', rarity: 'common', price: 80, color: '#7FD6F5', desc: 'Your hits chill.', hooks: onHit('chill', 15, '#BFEFFF') },
  emberRing: { name: 'Ember Ring', rarity: 'common', price: 80, color: '#FF7A2F', desc: 'Your hits burn.', hooks: onHit('burn', 15, '#FF9A55') },
  venomFang: { name: 'Venom Fang', rarity: 'common', price: 80, color: '#9BCB3C', desc: 'Your hits poison.', hooks: onHit('poison', 15, '#9BCB3C') },
  tideShell: { name: 'Tide Shell', rarity: 'common', price: 70, color: '#6FB7E8', desc: 'Your hits soak enemies through.', hooks: onHit('wet', 22, '#8FD3FF') },
  leadWeight: { name: 'Lead Weight', rarity: 'common', price: 90, color: '#8C8C96', desc: 'Your hits stagger, and enough of them knock an enemy out.', hooks: onHit('stagger', 14, '#E8E2D0') },
  vampTooth: {
    name: 'Vampire Tooth', rarity: 'common', price: 90, color: '#C8553D', desc: 'You heal a little of the damage you deal.',
    hooks: {
      hit(w, u, t, amt) {
        if (heal(w, u, amt * 0.08, u) > 0 && rand() < 0.6) {
          const a = angleTo(t.x, t.y, u.x, u.y), d = dist(t.x, t.y, u.x, u.y);
          P(w, { x: t.x, y: t.y, vx: Math.cos(a) * d * 2.2, vy: Math.sin(a) * d * 2.2, life: 0.4, max: 0.4, size: 4, color: '#C8553D', drag: 0.96 });
        }
      },
    },
  },
  ironSkin: {
    name: 'Iron Skin', rarity: 'common', price: 70, color: '#B8BCC4', desc: 'You take less damage.',
    hooks: { taken(w, u, src, amt, o) { if (!o.dot && rand() < 0.5) spark(w, u.x, u.y, rand() * TAU, '#C8CCD4', 140); return amt * 0.85; } },
  },
  swiftBoots: {
    name: 'Swift Boots', rarity: 'common', price: 60, color: '#D8C08A', desc: 'You move faster.',
    hooks: { moveSpeed: () => 1.15, tick(w, u, dt) { if (u.spd > 50 && rand() < dt * 6) P(w, { x: u.x - Math.cos(u.mvA) * u.r, y: u.y - Math.sin(u.mvA) * u.r, life: 0.35, max: 0.35, size: 5, color: 'rgba(216,200,160,0.6)' }); } },
  },
};
export const TRINKET_IDS = Object.keys(TRINKETS);
for (const [id, t] of Object.entries(TRINKETS)) t.id = id;

function cleanseHot(u) { u.st.burn = 0; u.st.poison = 0; u.st.chill = 0; u.frozenT = 0; u.stunT = 0; u.act = null; }
// A trinket that's used up (the Phoenix Feather) is taken off for the rest of the run: u.trinkets is the run's own
// list for this hero (dungeon.js passes it in), so the next room spawns the hero without it.
function consume(u, id) {
  const i = (u.trinkets || []).findIndex((t) => (t && t.id ? t.id : t) === id);
  if (i >= 0) u.trinkets.splice(i, 1);
  u.trinketHooks = trinketHooks(u.trinkets);
}

// The hook objects for a list of worn trinkets (ids, or { id } items).
export function trinketHooks(list) {
  const out = [];
  for (const t of list || []) { const d = TRINKETS[t && t.id ? t.id : t]; if (d) out.push(d.hooks); }
  return out;
}
export const wears = (list, id) => (list || []).some((t) => (t && t.id ? t.id : t) === id);
